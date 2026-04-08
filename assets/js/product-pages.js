(function () {
  const musicProjects = window.FUMU_DATA?.musicProjects || [];
  const techProjects = window.FUMU_DATA?.techProjects || [];
  const PRODUCTS = {
    "wave-rider": {
      pageTitle: "Wave Rider | Product Mockup",
      name: "Wave Rider",
      heroTitle: "Wave Rider Product Page",
      heroDescription:
        "Minimal wireframe for content placement. We will replace each section with real product details later.",
      primaryCta: "Primary CTA slot (Purchase)",
      secondaryCta: "Secondary CTA slot (Download/Trial)",
      mediaSlot: "Demo video area (YouTube/Vimeo embed)",
      featureA: {
        title: "Feature block A",
        text: "Short feature title + one sentence benefit.",
        slot: "Screenshot/diagram slot",
      },
      featureB: {
        title: "Feature block B",
        text: "Second feature with concise value proposition text.",
        slot: "UI close-up slot",
      },
      pricing: {
        title: "Pricing block",
        text: "Price, license, and supported formats placeholder.",
        slot: "Pricing table slot",
      },
      faq: {
        title: "FAQ block",
        text: "Compatibility and installation questions placeholder.",
        slot: "FAQ accordion slot",
      },
      footer: "Wave Rider mockup structure.",
    },
    superscaler: {
      pageTitle: "SuperScaler | Product Mockup",
      name: "SuperScaler",
      heroTitle: "SuperScaler Product Page",
      heroDescription: "Structure-first mockup using the same layout system as Wave Rider.",
      primaryCta: "Primary CTA slot",
      secondaryCta: "Secondary CTA slot",
      mediaSlot: "Hero visual or demo slot",
      featureA: {
        title: "Feature block A",
        text: "Short description placeholder.",
        slot: "Screenshot slot",
      },
      featureB: {
        title: "Feature block B",
        text: "Short description placeholder.",
        slot: "Workflow slot",
      },
      pricing: {
        title: "Pricing/License",
        text: "Pricing and licensing placeholder.",
        slot: "Pricing table slot",
      },
      faq: {
        title: "Support/FAQ",
        text: "Compatibility and support notes placeholder.",
        slot: "FAQ slot",
      },
      footer: "SuperScaler mockup structure.",
    },
  };

  function renderProductPage(productKey) {
    const root = document.getElementById("product-root");
    const product = PRODUCTS[productKey];
    if (!root || !product) return;

    document.title = product.pageTitle;

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
          <div class="container">
            <p class="kicker">${product.name}</p>
            <h1>${product.heroTitle}</h1>
            <p>${product.heroDescription}</p>
            <div class="cta-row">
              <span class="placeholder">${product.primaryCta}</span>
              <span class="placeholder">${product.secondaryCta}</span>
            </div>
            <div class="placeholder large">${product.mediaSlot}</div>
          </div>
        </section>

        <section class="section fade-in fade-delay-1">
          <div class="container card-grid">
            <article class="card">
              <h3>${product.featureA.title}</h3>
              <p>${product.featureA.text}</p>
              <span class="placeholder">${product.featureA.slot}</span>
            </article>
            <article class="card">
              <h3>${product.featureB.title}</h3>
              <p>${product.featureB.text}</p>
              <span class="placeholder">${product.featureB.slot}</span>
            </article>
            <article class="card">
              <h3>${product.pricing.title}</h3>
              <p>${product.pricing.text}</p>
              <span class="placeholder">${product.pricing.slot}</span>
            </article>
            <article class="card">
              <h3>${product.faq.title}</h3>
              <p>${product.faq.text}</p>
              <span class="placeholder">${product.faq.slot}</span>
            </article>
          </div>
        </section>

        <section class="section fade-in fade-delay-2">
          <div class="container">
            <h2>Explore</h2>
            <div class="project-stack">
              <article class="project-rail">
                <strong>Back to Main Site</strong>
                <span>About the maker and full ecosystem overview.</span>
                <a class="rail-action" href="../index.html">Open</a>
              </article>
              <article class="project-rail">
                <strong>Tech Index</strong>
                <span>All products and external project links in one place.</span>
                <a class="rail-action" href="../music-tech.html">Open</a>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container">${product.footer}</div>
      </footer>
    `;
  }

  window.renderProductPage = renderProductPage;
})();
