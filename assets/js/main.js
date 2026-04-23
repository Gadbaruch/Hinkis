// ── Custom cursor ────────────────────────────────────────────────
(function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX  = -100, ringY  = -100;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.11;
    ringY += (mouseY - ringY) * 0.11;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  const hoverSelector = 'a, button, [role="button"], .home-overview-card, .domain-card, .ecosystem-card-static, .filter-chip';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelector)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelector)) document.body.classList.remove('cursor-hover');
  });
}());

// ── Scroll reveal ────────────────────────────────────────────────
(function initScrollReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  if (prefersReduced) {
    els.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  els.forEach((el) => observer.observe(el));
}());

// ── Hero scroll indicator ────────────────────────────────────────
(function initHeroScroll() {
  const indicator = document.getElementById('hero-scroll');
  if (!indicator) return;
  let hidden = false;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80 && !hidden) {
      indicator.classList.add('hidden');
      hidden = true;
    } else if (window.scrollY <= 80 && hidden) {
      indicator.classList.remove('hidden');
      hidden = false;
    }
  }, { passive: true });
}());

// ── Dropdowns ────────────────────────────────────────────────────
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
  const copyRoot = document.getElementById('ecosystem-copy');
  const musicProjects = window.FUMU_DATA?.musicProjects || [];
  const techProjects = window.FUMU_DATA?.techProjects || [];
  const categoryLabels = window.FUMU_DATA?.categoryLabels;

  if (!filterRoot || !carouselRoot || !categoryLabels) return;

  const groups = {
    music: musicProjects,
    tech: techProjects,
  };
  const filters = ['music', 'tech'];
  let activeFilter = 'music';
  let autoCycleTimer = null;
  let autoCycleStopped = false;
  const filterDescriptions = {
    music: 'Active artist identities and the broader production archive.',
    tech: 'Products, instruments, and software tools built around music making.',
  };

  function stopAutoCycle() {
    if (autoCycleStopped) return;
    autoCycleStopped = true;
    if (autoCycleTimer) {
      window.clearInterval(autoCycleTimer);
      autoCycleTimer = null;
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

    if (copyRoot) {
      copyRoot.textContent = filterDescriptions[activeFilter] || '';
    }
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
        stopAutoCycle();
        activeFilter = button.dataset.filter;
        updateFilterVisuals();
        renderCards();
      });
    });

    syncIndicator();
  }

  function renderCards() {
    const items = groups[activeFilter] || [];

    carouselRoot.innerHTML = items
      .map((item) => {
        const title = item.cardTitle || item.displayTitle || item.title;
        const linkButtons = (item.homeLinks || []).slice(0, 2)
          .map((link) =>
            link.url
              ? `<a class="social-link home-card-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`
              : `<span class="social-link home-card-link home-card-link-disabled">${link.label}</span>`
          )
          .join('');

        return `
          <article class="music-overview-card home-overview-card home-overview-card-interactive fade-in" data-key="${item.key}" data-category="${activeFilter}" data-page-url="${item.pageUrl}">
            <div class="music-overview-art">${item.heroArtLabel || item.imageLabel}</div>
            <div class="music-overview-copy">
              <strong>${title}</strong>
              <p>${item.summary || item.description}</p>
              <div class="home-card-links">${linkButtons}</div>
            </div>
          </article>
        `;
      })
      .join('');

    carouselRoot.querySelectorAll('.home-overview-card-interactive').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        const url = card.dataset.pageUrl;
        if (url) {
          window.location.href = url;
        }
      });
    });
  }

  function startAutoCycle() {
    if (autoCycleStopped) return;

    autoCycleTimer = window.setInterval(() => {
      const currentIndex = filters.indexOf(activeFilter);
      activeFilter = filters[(currentIndex + 1) % filters.length];
      updateFilterVisuals();
      renderCards();
    }, 4000);
  }

  renderFilters();
  renderCards();
  updateFilterVisuals();
  startAutoCycle();
}

renderEcosystemCarousel();

function initHeroAudioScene() {
  const canvas = document.getElementById('hero-audio-canvas');
  const toggle = document.getElementById('hero-audio-toggle');
  const hint = document.getElementById('hero-audio-hint');

  if (!canvas || !toggle) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HARMONIES = [
    {
      name: 'Amber Drift',
      color: '#d84e24',
      notes: [0, 3, 7, 10],
      droneRoots: [98, 146.83, 220],
    },
    {
      name: 'Sea Glass',
      color: '#0f766e',
      notes: [0, 2, 5, 9],
      droneRoots: [110, 164.81, 246.94],
    },
    {
      name: 'Milk Moon',
      color: '#f2b880',
      notes: [0, 5, 7, 11],
      droneRoots: [87.31, 130.81, 196],
    },
  ];
  const DOT_PALETTES = [
    { color: '#d84e24', instrument: 'glass' },
    { color: '#0f766e', instrument: 'pluck' },
    { color: '#f0c98e', instrument: 'soft' },
  ];
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    energy: 0.42,
    portrait: {
      x: 0,
      y: 0,
      radius: 0,
      shoulderWidth: 0,
    },
    pointer: {
      x: 0.5,
      y: 0.5,
      targetX: 0.5,
      targetY: 0.5,
      active: false,
    },
    audio: {
      enabled: false,
      context: null,
      masterGain: null,
      dryGain: null,
      fxGain: null,
      delay: null,
      feedback: null,
      convolver: null,
      droneGain: null,
      droneFilter: null,
      droneOscillators: [],
    },
    activeHarmony: 0,
    hoveredDot: null,
    hoveredWave: null,
    lastDotTrigger: -1,
    waveZones: [],
    dots: [],
  };

  function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function createImpulseResponse(audioContext, duration = 2.4, decay = 2.2) {
    const sampleRate = audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const n = length - i;
        data[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      }
    }

    return impulse;
  }

  function rebuildSceneGeometry() {
    const portraitRadius = Math.min(state.width, state.height) * 0.15;
    state.portrait = {
      x: state.width * 0.5,
      y: state.height * 0.47,
      radius: portraitRadius,
      shoulderWidth: portraitRadius * 2.2,
    };

    state.waveZones = HARMONIES.map((harmony, index) => ({
      id: index,
      label: harmony.name,
      color: harmony.color,
      y: state.height * (0.26 + index * 0.18),
      amplitude: state.height * (0.024 + index * 0.01),
      thickness: 28 + index * 8,
      front: index === 1,
      phase: Math.random() * Math.PI * 2,
    }));

    state.dots = Array.from({ length: 12 }, (_, index) => {
      const palette = DOT_PALETTES[index % DOT_PALETTES.length];
      const ring = index < 6 ? 0.23 : 0.34;
      const angle = (Math.PI * 2 * index) / 12;

      return {
        id: index,
        palette,
        ring,
        angle,
        speed: 0.08 + (index % 4) * 0.018,
        wobble: Math.random() * Math.PI * 2,
        radius: 9 + (index % 3),
        x: 0,
        y: 0,
      };
    });
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = Math.max(1, bounds.width);
    state.height = Math.max(1, bounds.height);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    rebuildSceneGeometry();
  }

  function updatePointer(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    state.pointer.targetX = Math.min(Math.max((clientX - bounds.left) / bounds.width, 0), 1);
    state.pointer.targetY = Math.min(Math.max((clientY - bounds.top) / bounds.height, 0), 1);
    state.pointer.active = true;
    state.energy = Math.min(1, state.energy + 0.08);
    updateDroneState();
  }

  function clearPointer() {
    state.pointer.active = false;
    state.hoveredDot = null;
    state.hoveredWave = null;
    state.lastDotTrigger = -1;
    canvas.style.cursor = 'default';
    updateDroneState();
  }

  function ensureAudio() {
    if (state.audio.context) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      hint.textContent = 'Web Audio is not available in this browser, but the visual still performs.';
      return;
    }

    const audioContext = new AudioContextCtor();
    const masterGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    const fxGain = audioContext.createGain();
    const delay = audioContext.createDelay(0.8);
    const feedback = audioContext.createGain();
    const convolver = audioContext.createConvolver();
    const droneGain = audioContext.createGain();
    const droneFilter = audioContext.createBiquadFilter();

    masterGain.gain.value = 0.0001;
    dryGain.gain.value = 0.84;
    fxGain.gain.value = 0.32;
    delay.delayTime.value = 0.26;
    feedback.gain.value = 0.28;
    convolver.buffer = createImpulseResponse(audioContext);
    droneGain.gain.value = 0.0001;
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 980;
    droneFilter.Q.value = 1.2;

    dryGain.connect(masterGain);
    fxGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGain);
    fxGain.connect(convolver);
    convolver.connect(masterGain);
    masterGain.connect(audioContext.destination);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);

    state.audio.droneOscillators = HARMONIES[0].droneRoots.map((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index === 0 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(droneFilter);
      oscillator.start();
      return { oscillator, gain };
    });

    state.audio.context = audioContext;
    state.audio.masterGain = masterGain;
    state.audio.dryGain = dryGain;
    state.audio.fxGain = fxGain;
    state.audio.delay = delay;
    state.audio.feedback = feedback;
    state.audio.convolver = convolver;
    state.audio.droneGain = droneGain;
    state.audio.droneFilter = droneFilter;
  }

  async function toggleAudio() {
    ensureAudio();

    if (!state.audio.context) return;
    if (state.audio.context.state === 'suspended') {
      await state.audio.context.resume();
    }

    state.audio.enabled = !state.audio.enabled;
    toggle.setAttribute('aria-pressed', String(state.audio.enabled));
    toggle.textContent = state.audio.enabled ? 'Sound on' : 'Sound off';
    hint.textContent = state.audio.enabled
      ? 'Sound is live. Hover dots for notes and wave lanes for slower harmony shifts.'
      : 'Hover the dots and waves after turning sound on.';
    updateDroneState();
  }

  function playDotVoice(dot, noteIndex) {
    ensureAudio();
    const audioContext = state.audio.context;
    if (!audioContext || !state.audio.enabled) return;

    const harmony = HARMONIES[state.activeHarmony];
    const pitchClass = harmony.notes[noteIndex % harmony.notes.length];
    const octaveOffset = dot.id < 6 ? 72 : 60;
    const frequency = midiToFrequency(octaveOffset + pitchClass);
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const overtone = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    if (dot.palette.instrument === 'glass') {
      oscillator.type = 'triangle';
      overtone.type = 'sine';
      filter.type = 'bandpass';
      filter.frequency.value = frequency * 2.1;
      filter.Q.value = 3.8;
    } else if (dot.palette.instrument === 'pluck') {
      oscillator.type = 'sawtooth';
      overtone.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.value = frequency * 4.6;
      filter.Q.value = 1.2;
    } else {
      oscillator.type = 'sine';
      overtone.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.value = frequency * 3.2;
      filter.Q.value = 0.9;
    }

    oscillator.frequency.setValueAtTime(frequency, now);
    overtone.frequency.setValueAtTime(frequency * 1.5, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    oscillator.connect(filter);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(state.audio.dryGain);
    gain.connect(state.audio.fxGain);

    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + 1.7);
    overtone.stop(now + 1.7);
  }

  function updateDroneState() {
    const {
      context: audioContext,
      enabled,
      droneGain,
      droneFilter,
      droneOscillators,
    } = state.audio;

    if (!audioContext || !droneGain || !droneFilter || !droneOscillators.length) return;

    const now = audioContext.currentTime;
    const activeWave = state.hoveredWave != null ? HARMONIES[state.hoveredWave] : null;
    const targetGain = enabled && activeWave ? 0.055 : 0.0001;
    const cutoff = 500 + (1 - state.pointer.y) * 1400;

    droneGain.gain.cancelScheduledValues(now);
    droneGain.gain.linearRampToValueAtTime(targetGain, now + 0.18);
    droneFilter.frequency.cancelScheduledValues(now);
    droneFilter.frequency.linearRampToValueAtTime(cutoff, now + 0.18);

    if (!activeWave) return;

    droneOscillators.forEach(({ oscillator, gain }, index) => {
      const root = activeWave.droneRoots[index % activeWave.droneRoots.length];
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.linearRampToValueAtTime(root * (1 + (state.pointer.x - 0.5) * 0.06), now + 0.24);
      gain.gain.cancelScheduledValues(now);
      gain.gain.linearRampToValueAtTime(0.018 + index * 0.005, now + 0.18);
    });
  }

  function drawBackdrop() {
    const gradient = context.createLinearGradient(0, 0, state.width, state.height);
    gradient.addColorStop(0, '#fff8ee');
    gradient.addColorStop(0.46, '#f2e8d8');
    gradient.addColorStop(1, '#ddd8cc');
    context.fillStyle = gradient;
    context.fillRect(0, 0, state.width, state.height);

    const bloomLeft = context.createRadialGradient(
      state.width * 0.18,
      state.height * 0.28,
      20,
      state.width * 0.18,
      state.height * 0.28,
      state.width * 0.4
    );
    bloomLeft.addColorStop(0, 'rgba(216, 78, 36, 0.22)');
    bloomLeft.addColorStop(1, 'rgba(216, 78, 36, 0)');
    context.fillStyle = bloomLeft;
    context.fillRect(0, 0, state.width, state.height);

    const bloomRight = context.createRadialGradient(
      state.width * 0.82,
      state.height * 0.22,
      10,
      state.width * 0.82,
      state.height * 0.22,
      state.width * 0.36
    );
    bloomRight.addColorStop(0, 'rgba(15, 118, 110, 0.2)');
    bloomRight.addColorStop(1, 'rgba(15, 118, 110, 0)');
    context.fillStyle = bloomRight;
    context.fillRect(0, 0, state.width, state.height);
  }

  function drawWave(zone, layer) {
    const frequency = 0.011 + zone.id * 0.002;
    const drift = state.time * (0.6 + zone.id * 0.14) + zone.phase;
    const amplitude = zone.amplitude * (1 + state.energy * 0.18);
    const hoverBoost = state.hoveredWave === zone.id ? 1.35 : 1;
    const portraitClipWidth = state.portrait.radius * 1.6;

    context.save();
    context.lineWidth = 2 + zone.id * 1.2;
    context.strokeStyle = `${zone.color}${state.hoveredWave === zone.id ? 'dd' : 'aa'}`;
    context.shadowColor = `${zone.color}66`;
    context.shadowBlur = state.hoveredWave === zone.id ? 20 : 10;
    context.beginPath();

    for (let x = 0; x <= state.width; x += 7) {
      if (layer === 'back' && x > state.portrait.x - portraitClipWidth && x < state.portrait.x + portraitClipWidth) {
        continue;
      }

      const bias = Math.sin((x / state.width) * Math.PI * 2 + state.pointer.x * Math.PI * 2);
      const y = zone.y + Math.sin(x * frequency + drift) * amplitude * hoverBoost + bias * state.height * 0.018;

      if (x === 0 || (layer === 'back' && x - 7 <= state.portrait.x - portraitClipWidth && x >= state.portrait.x + portraitClipWidth)) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
    context.restore();
  }

  function drawPortrait() {
    const { x, y, radius, shoulderWidth } = state.portrait;

    context.save();
    context.translate(x, y);

    const halo = context.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 2.5);
    halo.addColorStop(0, 'rgba(255,255,255,0.58)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = halo;
    context.beginPath();
    context.arc(0, 0, radius * 2.3, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = 'rgba(255, 250, 242, 0.56)';
    context.strokeStyle = 'rgba(91, 77, 58, 0.2)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, -radius * 0.58, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(-shoulderWidth * 0.42, radius * 0.68);
    context.quadraticCurveTo(0, radius * 0.18, shoulderWidth * 0.42, radius * 0.68);
    context.quadraticCurveTo(shoulderWidth * 0.2, radius * 1.2, 0, radius * 1.35);
    context.quadraticCurveTo(-shoulderWidth * 0.2, radius * 1.2, -shoulderWidth * 0.42, radius * 0.68);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = 'rgba(91, 77, 58, 0.3)';
    context.beginPath();
    context.arc(0, -radius * 0.62, radius * 0.38, Math.PI * 0.1, Math.PI * 0.9);
    context.stroke();

    context.restore();
  }

  function updateDots() {
    state.dots.forEach((dot, index) => {
      const angle = state.time * dot.speed + dot.angle + dot.wobble;
      const orbitX = state.width * dot.ring * 0.55;
      const orbitY = state.height * dot.ring * 0.44;
      dot.x = state.portrait.x + Math.cos(angle) * orbitX + (state.pointer.x - 0.5) * 28;
      dot.y = state.portrait.y + Math.sin(angle) * orbitY + (state.pointer.y - 0.5) * 24 + (index % 2 === 0 ? -12 : 14);
    });
  }

  function drawDots() {
    state.dots.forEach((dot) => {
      const hovered = state.hoveredDot === dot.id;
      context.save();
      context.beginPath();
      context.fillStyle = dot.palette.color;
      context.globalAlpha = hovered ? 0.98 : 0.74;
      context.arc(dot.x, dot.y, hovered ? dot.radius + 2.5 : dot.radius, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.strokeStyle = 'rgba(255,255,255,0.62)';
      context.lineWidth = 1.2;
      context.arc(dot.x, dot.y, dot.radius + 5 + state.energy * 2.5, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    });
  }

  function drawHud() {
    const panelWidth = Math.min(240, state.width * 0.42);
    const x = state.width - panelWidth - 18;
    const y = state.height - 70;

    context.save();
    context.fillStyle = 'rgba(255, 250, 242, 0.58)';
    context.strokeStyle = 'rgba(28, 26, 23, 0.08)';
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(x, y, panelWidth, 50, 18);
    context.fill();
    context.stroke();

    context.fillStyle = 'rgba(28, 26, 23, 0.64)';
    context.font = "600 12px 'Instrument Sans'";
    context.fillText(state.audio.enabled ? 'Audio live' : 'Visual only', x + 14, y + 20);
    context.font = "500 11px 'Instrument Sans'";
    const harmony = HARMONIES[state.activeHarmony];
    context.fillText(`Harmony: ${harmony.name}`, x + 14, y + 37);
    context.restore();
  }

  function renderFrame() {
    drawBackdrop();
    updateDots();
    state.waveZones.filter((zone) => !zone.front).forEach((zone) => drawWave(zone, 'back'));
    drawPortrait();
    state.waveZones.filter((zone) => zone.front).forEach((zone) => drawWave(zone, 'front'));
    drawDots();
    drawHud();
  }

  function hitTestScene() {
    let hoveredDot = null;
    let hoveredWave = null;

    state.dots.forEach((dot, index) => {
      const dx = dot.x - state.pointer.x * state.width;
      const dy = dot.y - state.pointer.y * state.height;
      if (Math.hypot(dx, dy) <= dot.radius + 8 && hoveredDot == null) {
        hoveredDot = index;
      }
    });

    state.waveZones.forEach((zone) => {
      const dy = Math.abs(state.pointer.y * state.height - zone.y);
      if (dy <= zone.thickness && hoveredWave == null) {
        hoveredWave = zone.id;
      }
    });

    if (hoveredWave != null && hoveredWave !== state.hoveredWave) {
      state.activeHarmony = hoveredWave;
    }
    state.hoveredWave = hoveredWave;
    updateDroneState();

    if (hoveredDot != null && hoveredDot !== state.lastDotTrigger) {
      state.hoveredDot = hoveredDot;
      state.lastDotTrigger = hoveredDot;
      playDotVoice(state.dots[hoveredDot], hoveredDot);
    } else if (hoveredDot == null) {
      state.hoveredDot = null;
      state.lastDotTrigger = -1;
    }

    canvas.style.cursor = hoveredDot != null || hoveredWave != null ? 'pointer' : 'default';
  }

  function animate() {
    state.time += reducedMotion ? 0.002 : 0.012;
    state.pointer.x += (state.pointer.targetX - state.pointer.x) * 0.06;
    state.pointer.y += (state.pointer.targetY - state.pointer.y) * 0.06;
    state.energy += ((state.pointer.active ? 0.92 : 0.42) - state.energy) * 0.03;
    hitTestScene();
    renderFrame();

    if (!reducedMotion) {
      window.requestAnimationFrame(animate);
    }
  }

  canvas.addEventListener('pointermove', (event) => updatePointer(event.clientX, event.clientY));
  canvas.addEventListener('pointerenter', (event) => updatePointer(event.clientX, event.clientY));
  canvas.addEventListener('pointerleave', clearPointer);
  canvas.addEventListener('pointerdown', (event) => {
    updatePointer(event.clientX, event.clientY);
    state.energy = 1;
    hitTestScene();
  });
  toggle.addEventListener('click', () => {
    toggleAudio();
  });
  window.addEventListener('resize', resize);

  resize();
  renderFrame();

  if (!reducedMotion) {
    window.requestAnimationFrame(animate);
  }
}

function initShuffleTitle() {
  const title = document.getElementById('shuffle-title');
  if (!title) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const baseOrder = Array.from(title.querySelectorAll('.shuffle-word')).map((word) => word.dataset.word);
  let currentOrder = [...baseOrder];

  function shuffleWords(order) {
    const next = [...order];

    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }

    if (next.every((word, index) => word === currentOrder[index])) {
      [next[0], next[1]] = [next[1], next[0]];
    }

    return next;
  }

  function animateShuffle() {
    const wordsByKey = new Map(Array.from(title.children).map((node) => [node.dataset.word, node]));
    const beforeRects = new Map(Array.from(title.children).map((node) => [node, node.getBoundingClientRect()]));
    const nextOrder = shuffleWords(baseOrder);

    nextOrder.forEach((word) => {
      title.appendChild(wordsByKey.get(word));
    });

    Array.from(title.children).forEach((node, index) => {
      const before = beforeRects.get(node);
      const after = node.getBoundingClientRect();
      const deltaX = before.left - after.left;
      const deltaY = before.top - after.top;
      const rotate = ((index % 2 === 0 ? 1 : -1) * (6 + Math.random() * 6));

      node.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px) scale(0.92) rotate(${rotate}deg)`,
            opacity: 0.68,
            filter: 'blur(5px)',
          },
          {
            transform: 'translate(0, 0) scale(1) rotate(0deg)',
            opacity: 1,
            filter: 'blur(0)',
          },
        ],
        {
          duration: 640,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          fill: 'both',
          delay: index * 28,
        }
      );
    });

    currentOrder = nextOrder;
  }

  window.setInterval(animateShuffle, 3000);
}

initShuffleTitle();
initHeroAudioScene();
