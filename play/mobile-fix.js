// Mobile landscape patch for Rainbow Rampage.
// main.js creates the Phaser game immediately, but scene.create runs after assets load,
// so replacing this global function here changes the controls before they are created.
(function () {
  function fitGameToVisibleViewport() {
    const vv = window.visualViewport;
    const vw = Math.round(vv ? vv.width : window.innerWidth);
    const vh = Math.round(vv ? vv.height : window.innerHeight);
    document.documentElement.style.setProperty('--rr-vw', vw + 'px');
    document.documentElement.style.setProperty('--rr-vh', vh + 'px');
    if (window.game && window.game.scale && window.game.scale.refresh) window.game.scale.refresh();
  }

  fitGameToVisibleViewport();
  window.addEventListener('resize', fitGameToVisibleViewport, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(fitGameToVisibleViewport, 120); }, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitGameToVisibleViewport, { passive: true });

  window.createMobileButtons = function createMobileButtons() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
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

    // Left cluster is a proper triangle: jump above and centred between left/right.
    const left  = makeBtn(64, 470, '◀');
    const right = makeBtn(154, 470, '▶');
    const jump  = makeBtn(109, 390, '▲');
    // Smash stays on the opposite thumb, inset from the phone edge / gesture area.
    const smash = makeBtn(874, 458, '✊', 28, 40);

    const bindHold = (btn, setter) => {
      btn.on('pointerdown', () => setter(true));
      btn.on('pointerup', () => setter(false));
      btn.on('pointerout', () => setter(false));
      btn.on('pointerupoutside', () => setter(false));
    };

    bindHold(left,  v => leftDown = v);
    bindHold(right, v => rightDown = v);
    bindHold(jump,  v => jumpDown = v);
    bindHold(smash, v => smashDown = v);
  };
})();
