// Mobile landscape patch for Rainbow Rampage V2.
// Keeps the game fitted to the visible phone viewport, preserves reliable
// multi-touch, and gives the controls the chunky comic-arcade treatment.
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

  window.addEventListener('blur', releaseAllControls);
  window.addEventListener('pagehide', releaseAllControls);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) releaseAllControls();
  });
  document.addEventListener('touchcancel', releaseAllControls, { passive: true });
  document.addEventListener('pointercancel', releaseAllControls, { passive: true });

  window.createMobileButtons = function createMobileButtons() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (this.input && this.input.addPointer) this.input.addPointer(4);

    const makeBtn = (x, y, label, opts = {}) => {
      const radius = opts.radius || 42;
      const fill = opts.fill || 0x20232b;
      const stroke = opts.stroke || 0xffffff;
      const glow = opts.glow || stroke;
      const fontSize = opts.fontSize || 30;

      const shadow = this.add.circle(x + 3, y + 5, radius + 3, 0x000000, 0.72)
        .setScrollFactor(0).setDepth(78);
      const glowRing = this.add.circle(x, y, radius + 4, glow, isTouch ? 0.18 : 0.10)
        .setScrollFactor(0).setDepth(79);
      const c = this.add.circle(x, y, radius, fill, isTouch ? 0.92 : 0.78)
        .setScrollFactor(0).setInteractive().setDepth(80);
      c.setStrokeStyle(4, stroke, 0.96);

      const t = this.add.text(x, y - 1, label, {
        fontFamily: 'Arial Black', fontSize: fontSize + 'px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 6
      }).setOrigin(0.5).setScrollFactor(0).setDepth(81);

      c._rrParts = { shadow, glowRing, text: t };
      return c;
    };

    // Left-hand triangle: jump above and centred between left/right.
    const left  = makeBtn(64, 470, '◀', { fill: 0x252833, stroke: 0xf5f5f5, glow: 0xffffff, radius: 40 });
    const right = makeBtn(154, 470, '▶', { fill: 0x252833, stroke: 0xf5f5f5, glow: 0xffffff, radius: 40 });
    const jump  = makeBtn(109, 386, '▲', { fill: 0x008da8, stroke: 0x7df7ff, glow: 0x00eaff, radius: 40 });
    const smash = makeBtn(874, 458, '✊', { fill: 0xb32028, stroke: 0xff8b62, glow: 0xff2b31, radius: 46, fontSize: 31 });

    const owners = new Map();
    const bindHold = (btn, key, setter) => {
      const parts = btn._rrParts || {};
      btn.on('pointerdown', pointer => {
        owners.set(key, pointer.id);
        setter(true);
        btn.setScale(0.91);
        if (parts.text) parts.text.setScale(0.91);
        if (parts.glowRing) parts.glowRing.setAlpha(0.55);
      });

      const release = pointer => {
        const owner = owners.get(key);
        if (owner === undefined || !pointer || pointer.id === owner) {
          owners.delete(key);
          setter(false);
          btn.setScale(1);
          if (parts.text) parts.text.setScale(1);
          if (parts.glowRing) parts.glowRing.setAlpha(1);
        }
      };

      btn.on('pointerup', release);
      btn.on('pointerupoutside', release);
      btn.on('pointercancel', release);
      btn.on('pointerout', pointer => { if (!isTouch) release(pointer); });
    };

    bindHold(left, 'left', v => leftDown = v);
    bindHold(right, 'right', v => rightDown = v);
    bindHold(jump, 'jump', v => jumpDown = v);
    bindHold(smash, 'smash', v => smashDown = v);

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
