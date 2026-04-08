const dropdowns = document.querySelectorAll('[data-dropdown]');

dropdowns.forEach((dropdown) => {
  const trigger = dropdown.querySelector('[data-dropdown-trigger]');

  trigger?.addEventListener('click', (event) => {
    event.preventDefault();
    const isOpen = dropdown.classList.contains('open');

    dropdowns.forEach((item) => item.classList.remove('open'));
    if (!isOpen) dropdown.classList.add('open');
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-dropdown]')) {
    dropdowns.forEach((dropdown) => dropdown.classList.remove('open'));
  }
});

function renderEcosystemCarousel() {
  const filterRoot = document.getElementById('ecosystem-filters');
  const carouselRoot = document.getElementById('ecosystem-carousel');
  const musicProjects = window.FUMU_DATA?.musicProjects || [];
  const techProjects = window.FUMU_DATA?.techProjects || [];
  const otherProjects = window.FUMU_DATA?.otherProjects || [];
  const categoryLabels = window.FUMU_DATA?.categoryLabels;

  if (!filterRoot || !carouselRoot || !categoryLabels) return;

  const groups = {
    music: musicProjects,
    tech: techProjects,
    other: otherProjects,
  };
  const orderedItems = [
    ...musicProjects.map((item) => ({ ...item, category: 'music' })),
    ...techProjects.map((item) => ({ ...item, category: 'tech' })),
    ...otherProjects.map((item) => ({ ...item, category: 'other' })),
  ];
  const filters = ['music', 'tech', 'other'];
  let activeFilter = 'music';
  let scrollTimeout;
  let resizeBound = false;

  function updateActiveCard() {
    const cards = Array.from(carouselRoot.querySelectorAll('.ecosystem-card'));
    if (!cards.length) return;

    const carouselBounds = carouselRoot.getBoundingClientRect();
    const centerX = carouselBounds.left + carouselBounds.width / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const bounds = card.getBoundingClientRect();
      const cardCenter = bounds.left + bounds.width / 2;
      const distance = Math.abs(centerX - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    let nextActiveFilter = activeFilter;

    cards.forEach((card, index) => {
      card.classList.toggle('active', index === closestIndex);
      card.classList.toggle('neighbor', Math.abs(index - closestIndex) === 1);
      if (index === closestIndex) {
        nextActiveFilter = card.dataset.category;
      }
    });

    if (nextActiveFilter !== activeFilter) {
      activeFilter = nextActiveFilter;
      updateFilterVisuals();
    }
  }

  function bindCarouselBehavior() {
    updateActiveCard();

    carouselRoot.querySelectorAll('.ecosystem-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });

    carouselRoot.addEventListener('scroll', () => {
      window.clearTimeout(scrollTimeout);
      updateActiveCard();
      scrollTimeout = window.setTimeout(updateActiveCard, 60);
    }, { passive: true });

    if (!resizeBound) {
      window.addEventListener('resize', updateActiveCard);
      resizeBound = true;
    }
  }

  function syncIndicator() {
    const indicator = filterRoot.querySelector('.filter-indicator');
    const activeButton = filterRoot.querySelector('[data-filter].active');

    if (!indicator || !activeButton) return;

    indicator.style.width = `${activeButton.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeButton.offsetLeft}px)`;
  }

  function updateFilterVisuals() {
    filterRoot.querySelectorAll('[data-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.filter === activeFilter);
    });

    syncIndicator();
  }

  function renderFilters() {
    filterRoot.innerHTML = `
      <div class="filter-indicator" aria-hidden="true"></div>
      ${filters
        .map(
          (filter) => `
            <button class="filter-chip${filter === activeFilter ? ' active' : ''}" type="button" data-filter="${filter}">
              ${categoryLabels[filter]}
            </button>
          `
        )
        .join('')}
    `;

    filterRoot.querySelectorAll('[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        updateFilterVisuals();

        const target = carouselRoot.querySelector(`[data-category="${activeFilter}"]`);
        target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });

    syncIndicator();
  }

  function renderCards() {
    carouselRoot.innerHTML = orderedItems
      .map((item) => {
        const links = item.links
          .map(
            (link) => `
              ${link.url
                ? `<a class="social-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`
                : `<span class="social-link">${link.label}</span>`}
            `
          )
          .join('');

        return `
          <article class="ecosystem-card fade-in" data-key="${item.key}" data-category="${item.category}">
            <a class="ecosystem-image-link" href="${item.pageUrl}">
              <div class="ecosystem-image">${item.heroArtLabel || item.imageLabel}</div>
            </a>
            <h3><a href="${item.pageUrl}">${item.title}</a></h3>
            <p class="ecosystem-subtitle">${categoryLabels[item.category]}</p>
            <p class="ecosystem-description">${item.summary || item.description}</p>
            <div class="social-link-row">${links}</div>
            <div class="cta-row">
              <a class="btn btn-secondary" href="${item.pageUrl}">See more</a>
            </div>
          </article>
        `;
      })
      .join('');

    bindCarouselBehavior();
    updateFilterVisuals();
  }

  renderFilters();
  renderCards();
}

renderEcosystemCarousel();
