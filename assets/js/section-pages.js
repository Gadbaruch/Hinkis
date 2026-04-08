(function () {
  const ecosystem = window.FUMU_DATA?.ecosystem || [];
  const otherProjects = window.FUMU_DATA?.otherProjects || [];
  const categoryLabels = window.FUMU_DATA?.categoryLabels || {};
  const musicProjects = window.FUMU_DATA?.musicProjects || [];
  const techProjects = window.FUMU_DATA?.techProjects || [];

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
                ${musicProjects.map((item) => `<a href="${item.pageUrl}">${item.title}</a>`).join("")}
              </div>
            </div>
            <div class="dropdown" data-dropdown>
              <button class="dropdown-toggle" data-dropdown-trigger>
                Tech
                <span aria-hidden="true">▾</span>
              </button>
              <div class="dropdown-menu">
                <a href="../music-tech.html">Tech Overview</a>
                ${techProjects.map((item) => `<a href="${item.pageUrl}">${item.title}</a>`).join("")}
              </div>
            </div>
          </nav>
        </div>
      </header>

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
