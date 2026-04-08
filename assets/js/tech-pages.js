(function () {
  const techProjects = window.FUMU_DATA?.techProjects || [];
  const musicProjects = window.FUMU_DATA?.musicProjects || [];

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

  function renderTechPage(projectKey) {
    const root = document.getElementById('tech-root');
    const project = techProjects.find((item) => item.key === projectKey);

    if (!root || !project) return;

    const links = project.links.map(linkMarkup).join('');
    const productsMarkup = (project.products || [])
      .map((product) => {
        const productLinks = (product.links || []).map(linkMarkup).join('');

        return `
          <article class="production-item">
            <div class="production-copy">
              <h3>${product.title}</h3>
              <p>${product.summary}</p>
              ${productLinks ? `<div class="social-link-row" style="margin-top: 1rem;">${productLinks}</div>` : ''}
            </div>
          </article>
        `;
      })
      .join('');

    document.title = `${project.title} | Gad Baruch Hinkis`;

    root.innerHTML = `
      ${renderTopNav('..', 'tools')}

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
          project.products
            ? `
              <section class="section fade-in fade-delay-2">
                <div class="container">
                  <h2>Catalogue</h2>
                  <div class="production-list">
                    ${productsMarkup}
                  </div>
                </div>
              </section>
            `
            : `
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
            `
        }
      </main>

      <footer class="site-footer">
        <div class="container">${project.title} tech page.</div>
      </footer>
    `;
  }

  window.renderTechPage = renderTechPage;
})();
