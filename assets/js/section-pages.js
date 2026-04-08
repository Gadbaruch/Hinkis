(function () {
  const ecosystem = window.FUMU_DATA?.ecosystem || [];
  const otherProjects = window.FUMU_DATA?.otherProjects || [];
  const categoryLabels = window.FUMU_DATA?.categoryLabels || {};
  const musicProjects = window.FUMU_DATA?.musicProjects || [];
  const techProjects = window.FUMU_DATA?.techProjects || [];

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

  function renderSectionPage(sectionKey) {
    const root = document.getElementById('section-root');
    const section = [...ecosystem, ...otherProjects].find((item) => item.key === sectionKey);

    if (!root || !section) return;

    document.title = `${section.title} | Gad Baruch Hinkis`;

    const tags = (section.categories || ['other'])
      .map((category) => `<span class="tag">${categoryLabels[category] || category}</span>`)
      .join('');
    const links = section.links
      .map(
        (link) => `
          <a class="social-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>
        `
      )
      .join('');

    root.innerHTML = `
      ${renderTopNav('..', '')}

      <main>
        <section class="product-hero fade-in">
          <div class="container section-card-hero">
            <div class="section-card-copy">
              <p class="kicker">${section.title}</p>
              <h1>${section.subtitle || section.summary}</h1>
              <p>${section.description || section.summary}</p>
              <div class="tag-row">${tags}</div>
              <div class="social-link-row" style="margin-top: 1rem;">${links}</div>
              <div class="cta-row">
                <a class="btn btn-secondary" href="../index.html">Back to Home</a>
              </div>
            </div>
            <div class="section-card-media">${section.imageLabel || section.heroArtLabel}</div>
          </div>
        </section>

        <section class="section fade-in fade-delay-1">
          <div class="container card-grid">
            <article class="card">
              <h3>What belongs here</h3>
              <p>A dedicated story, selected media, a short bio, and direct actions connected to ${section.title}.</p>
            </article>
            <article class="card">
              <h3>Socials and links</h3>
              <p>Only the relevant links for this branch of the ecosystem, instead of mixing everything together.</p>
            </article>
            <article class="card">
              <h3>Connected projects</h3>
              <p>This page can later point into product pages, performances, releases, or external sites.</p>
            </article>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container">${section.title} section page.</div>
      </footer>
    `;
  }

  window.renderSectionPage = renderSectionPage;
})();
