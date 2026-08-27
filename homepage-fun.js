(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.body.classList.add('fun-ready');

  const hero = document.querySelector('.hero');
  const heroBg = document.querySelector('.hero-bg');

  if (hero) {
    const layer = document.createElement('div');
    layer.className = 'hero-fun-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = `
      <span class="graffiti-word g1">SMASH.</span>
      <span class="graffiti-word g2">RAMPAGE.</span>
      <span class="graffiti-word g3">BURN.</span>
      <span class="paint-splat s1"></span>
      <span class="paint-splat s2"></span>
      <span class="paint-splat s3"></span>
    `;
    hero.appendChild(layer);
  }

  if (!reduceMotion && hero && heroBg && window.matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      heroBg.style.transform = `scale(1.055) translate(${x * -14}px, ${y * -9}px)`;
    });

    hero.addEventListener('pointerleave', () => {
      heroBg.style.transform = 'scale(1.04) translate(0,0)';
    });
  }

  const revealTargets = document.querySelectorAll('.section-kicker, .section-title, .poster-wrap, .info-grid, .lb-copy, .lb-board, .bottom-play-wrap');
  revealTargets.forEach((element) => element.classList.add('fun-reveal'));

  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((element) => observer.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  }

  document.querySelectorAll('.mega-play').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      button.classList.remove('is-hit');
      void button.offsetWidth;
      button.classList.add('is-hit');

      if (!reduceMotion) {
        const splat = document.createElement('span');
        splat.className = 'rr-click-splat';
        splat.style.left = `${event.clientX}px`;
        splat.style.top = `${event.clientY}px`;
        document.body.appendChild(splat);
        setTimeout(() => splat.remove(), 500);
      }
    });
  });
})();
