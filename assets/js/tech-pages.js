(function () {
  const techProjects = window.FUMU_DATA?.techProjects || [];
  const musicProjects = window.FUMU_DATA?.musicProjects || [];

  function linkMarkup(link) {
    if (!link.url) {
      return `<span class="social-link">${link.label}</span>`;
    }

    return `<a class="social-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`;
  }

  function renderTechPage(projectKey) {
    const root = document.getElementById('tech-root');
    const project = techProjects.find((item) => item.key === projectKey);

    if (!root || !project) return;

    const links = project.links.map(linkMarkup).join('');

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
                ${musicProjects.map((item) => `<a href="${item.pageUrl}">${item.title}</a>`).join('')}
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

        <section class="section fade-in fade-delay-2">
          <div class="container card-grid">
            <article class="card">
              <h3>Product snapshot</h3>
              <p>This page is ready for clearer positioning, feature highlights, and an eventual stronger product-specific story.</p>
            </article>
            <article class="card">
              <h3>Official links</h3>
              <p>Each project gets only the links that make sense for it instead of sharing one generic set.</p>
            </article>
            <article class="card">
              <h3>Demo slot</h3>
              <p>We can swap the placeholder for a YouTube demo, Instagram post, or embedded walkthrough when you pick one.</p>
            </article>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container">${project.title} tech page.</div>
      </footer>
    `;
  }

  window.renderTechPage = renderTechPage;
})();
