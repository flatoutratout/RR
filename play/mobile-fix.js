// Mobile landscape patch for Rainbow Rampage.
// Keeps the game fitted to the visible phone viewport and enables reliable multi-touch controls.
(function () {
  function fitGameToVisibleViewport() {
    const vv = window.visualViewport;
    const vw = Math.round(vv ? vv.width : window.innerWidth);
    const vh = Math.round(vv ? vv.height : window.innerHeight);
    document.documentElement.style.setProperty('--rr-vw', vw + 'px');
    document.documentElement.style.setProperty('--rr-vh', vh + 'px');
    if (window.game && window.game.scale && window.game.scale.refresh) window.game.scale.refresh();
  }

  function releaseAllControls() {
    if (typeof leftDown !== 'undefined') leftDown = false;
    if (typeof rightDown !== 'undefined') rightDown = false;
    if (typeof jumpDown !== 'undefined') jumpDown = false;
    if (typeof smashDown !== 'undefined') smashDown = false;
  }

  fitGameToVisibleViewport();
  window.addEventListener('resize', fitGameToVisibleViewport, { passive: true });
  window.addEventListener('orientationchange', function () {
    releaseAllControls();
    setTimeout(fitGameToVisibleViewport, 120);
  }, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitGameToVisibleViewport, { passive: true });

  // Mobile browsers can swallow the final touch/pointer-up when the finger slides,
  // hits browser chrome, changes orientation, or the tab loses focus. Always clear
  // held movement states in those cases so the character never gets stuck running.
  window.addEventListener('blur', releaseAllControls);
  window.addEventListener('pagehide', releaseAllControls);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) releaseAllControls();
  });
  document.addEventListener('touchcancel', releaseAllControls, { passive: true });
  document.addEventListener('pointercancel', releaseAllControls, { passive: true });

  window.createMobileButtons = function createMobileButtons() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    if (this.input && this.input.addPointer) {
      this.input.addPointer(4);
    }

    const makeBtn = (x, y, label, size = 26, radius = 37) => {
      const c = this.add.circle(x, y, radius, 0xffffff, isTouch ? 0.22 : 0.14)
        .setScrollFactor(0).setInteractive().setDepth(80);
      c.setStrokeStyle(3, 0xffffff, 0.48);
      this.add.text(x, y, label, {
        fontFamily: 'Arial Black', fontSize: size + 'px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(81);
      return c;
    };

    // Left-hand triangle: jump above, left/right below.
    const left  = makeBtn(64, 470, '◀');
    const right = makeBtn(154, 470, '▶');
    const jump  = makeBtn(109, 390, '▲');
    const smash = makeBtn(874, 458, '✊', 28, 40);

    // Keep one owner pointer per held button so multi-touch works properly.
    const owners = new Map();

    const bindHold = (btn, key, setter) => {
      btn.on('pointerdown', pointer => {
        owners.set(key, pointer.id);
        setter(true);
      });

      const release = pointer => {
        const owner = owners.get(key);
        if (owner === undefined || !pointer || pointer.id === owner) {
          owners.delete(key);
          setter(false);
        }
      };

      btn.on('pointerup', release);
      btn.on('pointerupoutside', release);
      btn.on('pointercancel', release);
      btn.on('pointerout', pointer => {
        if (!isTouch) release(pointer);
      });
    };

    bindHold(left,  'left',  v => leftDown = v);
    bindHold(right, 'right', v => rightDown = v);
    bindHold(jump,  'jump',  v => jumpDown = v);
    bindHold(smash, 'smash', v => smashDown = v);

    // Crucial fallback: listen at the scene input level as well. A release does
    // not always return to the original button on mobile browsers.
    if (this.input) {
      this.input.on('pointerup', pointer => {
        for (const [key, owner] of owners.entries()) {
          if (owner !== pointer.id) continue;
          owners.delete(key);
          if (key === 'left') leftDown = false;
          if (key === 'right') rightDown = false;
          if (key === 'jump') jumpDown = false;
          if (key === 'smash') smashDown = false;
        }
      });

      this.input.on('gameout', () => {
        owners.clear();
        releaseAllControls();
      });
    }
  };
})();
