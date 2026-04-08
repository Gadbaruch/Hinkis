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

  function renderTopNav(basePath, activeKey) {
    return `
      <header class="site-header">
        <div class="container nav">
          <a class="brand" href="${basePath}/index.html">Gad <span>Baruch Hinkis</span></a>
          <nav class="nav-links" aria-label="Primary">
            <a class="nav-link${activeKey === 'home' ? ' active' : ''}" href="${basePath}/index.html">Home</a>
            <a class="nav-link${activeKey === 'about' ? ' active' : ''}" href="${basePath}/about.html">About</a>
            <a class="nav-link${activeKey === 'music' ? ' active' : ''}" href="${basePath}/music.html">Music</a>
            <a class="nav-link${activeKey === 'tools' ? ' active' : ''}" href="${basePath}/tools.html">Tools</a>
            <a class="nav-link${activeKey === 'contact' ? ' active' : ''}" href="${basePath}/contact.html">Contact</a>
          </nav>
        </div>
      </header>
    `;
  }

  function buildCatalogue(project) {
    const jumpItems = [];
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
        const productionId = `${project.key}-entry-${index + 1}`;
        jumpItems.push({
          id: productionId,
          label: `${production.artist} / ${production.album}`,
        });

        return `
          ${sectionHeading}
          <article id="${productionId}" class="production-item${production.spotifyEmbedUrl ? ' production-item-with-embed' : ''}">
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

    const jumpNavMarkup = jumpItems.length
      ? `
        <aside class="catalog-jump-nav" aria-label="Jump to release">
          <div class="catalog-jump-list">
            ${jumpItems
              .map(
                (item) => `
                  <a class="catalog-jump-link" href="#${item.id}" data-jump-target="${item.id}" aria-label="${item.label}">
                    <span class="catalog-jump-dot" aria-hidden="true"></span>
                    <span class="catalog-jump-label">${item.label}</span>
                  </a>
                `
              )
              .join('')}
          </div>
        </aside>
      `
      : '';

    return { productionsMarkup, jumpItems, jumpNavMarkup };
  }

  function bindJumpNav(root, jumpItems) {
    ensureSpotifyIframeApi(root);

    if (!(jumpItems.length && 'IntersectionObserver' in window)) return;

    const jumpLinks = Array.from(root.querySelectorAll('[data-jump-target]'));
    const jumpLinkMap = new Map(jumpLinks.map((link) => [link.dataset.jumpTarget, link]));
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisible = null;

        entries.forEach((entry) => {
          if (!mostVisible || entry.intersectionRatio > mostVisible.intersectionRatio) {
            mostVisible = entry;
          }
        });

        if (!mostVisible?.target?.id) return;

        jumpLinks.forEach((link) => {
          link.classList.toggle('active', link.dataset.jumpTarget === mostVisible.target.id);
        });
      },
      {
        rootMargin: '-18% 0px -55% 0px',
        threshold: [0.15, 0.4, 0.7],
      }
    );

    jumpItems.forEach((item, index) => {
      const target = root.querySelector(`#${item.id}`);
      const link = jumpLinkMap.get(item.id);
      if (target) {
        observer.observe(target);
      }

      if (index === 0 && link) {
        link.classList.add('active');
      }
    });
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
    const { productionsMarkup, jumpItems, jumpNavMarkup } = buildCatalogue(project);

    document.title = `${displayTitle} | Gad Baruch Hinkis`;

    root.innerHTML = `
      ${renderTopNav('..', 'music')}

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

        ${
          project.productions
            ? ''
            : `
              <section class="section fade-in fade-delay-1">
                <div class="container">
                  <div class="music-panel copy">
                    <h2>Featured Media</h2>
                    <div class="embed-shell">${project.embedLabel}</div>
                  </div>
                </div>
              </section>
            `
        }

        ${
          project.productions
            ? `
              <section class="section fade-in fade-delay-2">
                <div class="container catalog-layout">
                  <div class="catalog-main">
                    <h2>Discography And Production Credits</h2>
                    <div class="production-list">
                      ${productionsMarkup}
                    </div>
                  </div>
                  ${jumpNavMarkup}
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

    bindJumpNav(root, jumpItems);
  }

  function renderMusicHubPage() {
    const root = document.getElementById('music-root');
    const voiceProject = musicProjects.find((item) => item.key === 'voice-of-gad');
    const catalogueProject = musicProjects.find((item) => item.key === 'music-productions');

    if (!root || !voiceProject || !catalogueProject) return;

    const voiceLinks = voiceProject.links.map(linkMarkup).join('');
    const { productionsMarkup, jumpItems, jumpNavMarkup } = buildCatalogue(catalogueProject);

    document.title = `Music | Gad Baruch Hinkis`;

    root.innerHTML = `
      ${renderTopNav('.', 'music')}

      <main>
        <section class="product-hero fade-in">
          <div class="container music-layout">
            <div class="music-panel copy">
              <p class="kicker">Music</p>
              <h1>Voice Of Gad</h1>
              <p>${voiceProject.summary}</p>
              <div class="social-link-row" style="margin-top: 1rem;">${voiceLinks}</div>
            </div>
            <div class="music-hero-art music-panel">${voiceProject.heroArtLabel}</div>
          </div>
        </section>

        <section class="section fade-in fade-delay-1">
          <div class="container catalog-layout">
            <div class="catalog-main">
              <div class="music-panel copy" style="margin-bottom: 2rem;">
                <h2>My Music Production Catalogue</h2>
                <p>${catalogueProject.summary}</p>
                <div class="social-link-row" style="margin-top: 1rem;">${catalogueProject.links.map(linkMarkup).join('')}</div>
              </div>
              <div class="production-list">
                ${productionsMarkup}
              </div>
            </div>
            ${jumpNavMarkup}
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container">Music hub with featured artist work and full production catalogue.</div>
      </footer>
    `;

    bindJumpNav(root, jumpItems);
  }

  window.renderMusicPage = renderMusicPage;
  window.renderMusicHubPage = renderMusicHubPage;
})();
