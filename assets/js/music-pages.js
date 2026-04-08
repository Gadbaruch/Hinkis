(function () {
  const musicProjects = window.FUMU_DATA?.musicProjects || [];
  const techProjects = window.FUMU_DATA?.techProjects || [];

  function linkMarkup(link) {
    if (!link.url) {
      return `<span class="social-link">${link.label}</span>`;
    }

    return `<a class="social-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`;
  }

  function renderMusicPage(projectKey) {
    const root = document.getElementById('music-root');
    const project = musicProjects.find((item) => item.key === projectKey);

    if (!root || !project) return;

    const links = project.links.map(linkMarkup).join('');
    const productionsMarkup = (project.productions || [])
      .map((production, index) => {
        const visibleLinks = production.spotifyEmbedUrl
          ? production.links.filter((link) => !/spotify/i.test(link.label))
          : production.links;
        const productionLinks = visibleLinks.map(linkMarkup).join('');
        const productionEmbed = production.spotifyEmbedUrl
          ? `
            <div class="production-embed">
              <iframe
                src="${production.spotifyEmbedUrl}"
                width="100%"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="${production.artist} - ${production.album} Spotify player"
              ></iframe>
            </div>
          `
          : '';

        return `
          <article class="production-item">
            <div class="production-copy">
              <h3>${production.artist} <span style="color: var(--muted);">/ ${production.album}</span></h3>
              <div class="production-meta">
                <span>${production.genre}</span>
                <span>${production.year || 'Date pending'}</span>
              </div>
              <p>${production.summary}</p>
              ${productionLinks ? `<div class="social-link-row" style="margin-top: 1rem;">${productionLinks}</div>` : ''}
              ${productionEmbed}
            </div>
          </article>
        `;
      })
      .join('');

    document.title = `${project.title} | Gad Baruch Hinkis`;

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
              <p class="kicker">${project.title}</p>
              <h1>${project.title}</h1>
              <p>${project.summary}</p>
              <div class="social-link-row" style="margin-top: 1rem;">${links}</div>
            </div>
            <div class="music-hero-art music-panel">${project.heroArtLabel}</div>
          </div>
        </section>

        <section class="section fade-in fade-delay-1">
          <div class="container">
            <div class="music-panel copy">
              <h2>Featured Media</h2>
              <div class="embed-shell">${project.embedLabel}</div>
            </div>
          </div>
        </section>

        ${
          project.productions
            ? `
              <section class="section fade-in fade-delay-2">
                <div class="container">
                  <h2>Selected Productions</h2>
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
  }

  window.renderMusicPage = renderMusicPage;
})();
