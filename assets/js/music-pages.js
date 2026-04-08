(function () {
  const musicProjects = window.FUMU_DATA?.musicProjects || [];
  const techProjects = window.FUMU_DATA?.techProjects || [];
  const spotifyControllers = new Map();
  let spotifyApiReady = false;
  let spotifyApi = null;
  let spotifyBootstrapped = false;
  let activeSpotifyKey = null;
  let visibilityHandlersBound = false;
  let activeVisibilityObserver = null;

  function linkMarkup(link) {
    if (!link.url) {
      return `<span class="social-link">${link.label}</span>`;
    }

    return `<a class="social-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`;
  }

  function extractSpotifyUri(spotifyEmbedUrl) {
    if (!spotifyEmbedUrl) return '';

    const match = spotifyEmbedUrl.match(/embed\/(album|artist|track|playlist)\/([^?]+)/);
    if (!match) return '';

    return `spotify:${match[1]}:${match[2]}`;
  }

  function pauseOtherSpotifyEmbeds(exceptKey) {
    spotifyControllers.forEach((controller, key) => {
      if (key !== exceptKey) {
        controller.pause();
      }
    });
  }

  function bindSpotifyVisibilityHandlers() {
    if (visibilityHandlersBound) return;
    visibilityHandlersBound = true;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseOtherSpotifyEmbeds(null);
        activeSpotifyKey = null;
      }
    });

    window.addEventListener('pagehide', () => {
      pauseOtherSpotifyEmbeds(null);
      activeSpotifyKey = null;
    });

    window.addEventListener('beforeunload', () => {
      pauseOtherSpotifyEmbeds(null);
      activeSpotifyKey = null;
    });
  }

  function observeActiveSpotifyEmbed(key) {
    if (activeVisibilityObserver) {
      activeVisibilityObserver.disconnect();
      activeVisibilityObserver = null;
    }

    const target = document.querySelector(`[data-spotify-key="${key}"]`);
    if (!target || !('IntersectionObserver' in window)) return;

    activeVisibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.dataset.spotifyKey !== activeSpotifyKey) return;

          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
            const controller = spotifyControllers.get(activeSpotifyKey);
            if (controller) {
              controller.pause();
            }
          }
        });
      },
      {
        threshold: [0, 0.35, 0.6, 1],
      }
    );

    activeVisibilityObserver.observe(target);
  }

  function createSpotifyControllers(root) {
    if (!spotifyApiReady || !spotifyApi) return;

    root.querySelectorAll('[data-spotify-uri]').forEach((element) => {
      const spotifyKey = element.dataset.spotifyKey;
      if (!spotifyKey || spotifyControllers.has(spotifyKey)) return;

      const options = {
        width: '100%',
        height: 352,
        uri: element.dataset.spotifyUri,
      };

      spotifyApi.createController(element, options, (controller) => {
        spotifyControllers.set(spotifyKey, controller);

        controller.addListener('playback_started', () => {
          activeSpotifyKey = spotifyKey;
          pauseOtherSpotifyEmbeds(spotifyKey);
          observeActiveSpotifyEmbed(spotifyKey);
        });

        controller.addListener('playback_update', (event) => {
          if (event?.data?.isPaused) {
            if (activeSpotifyKey === spotifyKey) {
              activeSpotifyKey = null;
              if (activeVisibilityObserver) {
                activeVisibilityObserver.disconnect();
                activeVisibilityObserver = null;
              }
            }
            return;
          }

          activeSpotifyKey = spotifyKey;
          observeActiveSpotifyEmbed(spotifyKey);
        });
      });
    });
  }

  function ensureSpotifyIframeApi(root) {
    if (!root.querySelector('[data-spotify-uri]')) return;

    bindSpotifyVisibilityHandlers();

    if (spotifyApiReady && spotifyApi) {
      createSpotifyControllers(root);
      return;
    }

    window.__fumuSpotifyRoots = window.__fumuSpotifyRoots || new Set();
    window.__fumuSpotifyRoots.add(root);

    if (!spotifyBootstrapped) {
      spotifyBootstrapped = true;
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        spotifyApiReady = true;
        spotifyApi = IFrameAPI;
        window.__fumuSpotifyRoots.forEach((spotifyRoot) => {
          createSpotifyControllers(spotifyRoot);
        });
      };

      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      document.body.appendChild(script);
    }
  }

  function renderMusicPage(projectKey) {
    const root = document.getElementById('music-root');
    const project = musicProjects.find((item) => item.key === projectKey);

    if (!root || !project) return;

    const displayTitle = project.displayTitle || project.title;
    const links = project.links.map(linkMarkup).join('');
    let lastSection = '';
    const productionsMarkup = (project.productions || [])
      .map((production, index) => {
        const visibleLinks = production.spotifyEmbedUrl
          ? production.links.filter((link) => !/spotify/i.test(link.label))
          : production.links;
        const productionLinks = visibleLinks.map(linkMarkup).join('');
        const spotifyUri = extractSpotifyUri(production.spotifyEmbedUrl);
        const spotifyKey = `${project.key}-${index}`;
        const productionEmbed = production.spotifyEmbedUrl
          ? `
            <div class="production-embed">
              <div
                class="spotify-embed-host"
                data-spotify-key="${spotifyKey}"
                data-spotify-uri="${spotifyUri}"
                aria-label="${production.artist} - ${production.album} Spotify player"
              ></div>
            </div>
          `
          : '';

        const sectionHeading = production.section && production.section !== lastSection
          ? `<h3 class="production-section-heading">${production.section}</h3>`
          : '';
        lastSection = production.section || lastSection;

        return `
          ${sectionHeading}
          <article class="production-item${production.spotifyEmbedUrl ? ' production-item-with-embed' : ''}">
            ${productionEmbed}
            <div class="production-copy">
              <h3>${production.artist} <span style="color: var(--muted);">/ ${production.album}</span></h3>
              <div class="production-meta">
                <span>${production.genre}</span>
                <span>${production.year || 'Date pending'}</span>
              </div>
              <p>${production.summary}</p>
              ${productionLinks ? `<div class="social-link-row" style="margin-top: 1rem;">${productionLinks}</div>` : ''}
            </div>
          </article>
        `;
      })
      .join('');

    document.title = `${displayTitle} | Gad Baruch Hinkis`;

    root.innerHTML = `
      <header class="site-header">
        <div class="container nav">
          <a class="brand" href="../index.html">Gad <span>Baruch Hinkis</span></a>
          <nav class="nav-links" aria-label="Primary">
            <a class="nav-link" href="../index.html">Home</a>
            <div class="dropdown" data-dropdown>
              <button class="dropdown-toggle" data-dropdown-trigger>
                Music
                <span aria-hidden="true">▾</span>
              </button>
              <div class="dropdown-menu">
                <a href="../music.html">Music Overview</a>
                ${musicProjects
                  .map((item) => `<a href="${item.pageUrl}">${item.title}</a>`)
                  .join('')}
              </div>
            </div>
            <div class="dropdown" data-dropdown>
              <button class="dropdown-toggle" data-dropdown-trigger>
                Tech
                <span aria-hidden="true">▾</span>
              </button>
              <div class="dropdown-menu">
                <a href="../music-tech.html">Tech Overview</a>
                ${techProjects.map((item) => `<a href="${item.pageUrl}">${item.title}</a>`).join('')}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section class="product-hero fade-in">
          <div class="container music-layout">
            <div class="music-panel copy">
              ${project.hideKicker ? '' : `<p class="kicker">${project.title}</p>`}
              <h1>${displayTitle}</h1>
              <p>${project.summary}</p>
              <div class="social-link-row" style="margin-top: 1rem;">${links}</div>
            </div>
            <div class="music-hero-art music-panel">${project.heroArtLabel}</div>
          </div>
        </section>

        <section class="section fade-in fade-delay-1">
          <div class="container">
            <div class="music-panel copy">
              <h2>${project.productions ? 'Archive Focus' : 'Featured Media'}</h2>
              <div class="embed-shell">${project.embedLabel}</div>
            </div>
          </div>
        </section>

        ${
          project.productions
            ? `
              <section class="section fade-in fade-delay-2">
                <div class="container">
                  <h2>Discography And Production Credits</h2>
                  <div class="production-list">
                    ${productionsMarkup}
                  </div>
                </div>
              </section>
            `
            : `
              <section class="section fade-in fade-delay-2">
                <div class="container card-grid">
                  <article class="card">
                    <h3>Short summary</h3>
                    <p>This one-pager is ready for a tighter artist statement, release highlights, and a more specific visual direction.</p>
                  </article>
                  <article class="card">
                    <h3>Links</h3>
                    <p>Relevant socials and official destinations live here so each project has its own identity.</p>
                  </article>
                  <article class="card">
                    <h3>Media slot</h3>
                    <p>We can swap the placeholder for a Spotify embed, YouTube video, or Instagram embed once you pick the right piece.</p>
                  </article>
                </div>
              </section>
            `
        }
      </main>

      <footer class="site-footer">
        <div class="container">${project.title} music page.</div>
      </footer>
    `;

    ensureSpotifyIframeApi(root);
  }

  window.renderMusicPage = renderMusicPage;
})();
