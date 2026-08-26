// Mobile landscape patch for Rainbow Rampage.
// Keeps the game fitted to the visible phone viewport and enables true multi-touch controls.
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

    // Phaser otherwise has too few active touch pointers for run + jump/smash together.
    // Add enough independent pointers for both thumbs and simultaneous actions.
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
    // Right thumb action button.
    const smash = makeBtn(874, 458, '✊', 28, 40);

    // Track the pointer that owns each button. Releasing another finger must not
    // cancel a button that is still being held by its original finger.
    const bindHold = (btn, setter) => {
      let ownerPointerId = null;

      btn.on('pointerdown', pointer => {
        ownerPointerId = pointer.id;
        setter(true);
      });

      const release = pointer => {
        if (ownerPointerId === null || pointer.id === ownerPointerId) {
          ownerPointerId = null;
          setter(false);
        }
      };

      btn.on('pointerup', release);
      btn.on('pointerupoutside', release);
      btn.on('pointerout', pointer => {
        // On touch, pointerout can fire while a finger is still held during
        // multi-touch movement. Only use it as a release for mouse/pen input.
        if (!isTouch) release(pointer);
      });
    };

    bindHold(left,  v => leftDown = v);
    bindHold(right, v => rightDown = v);
    bindHold(jump,  v => jumpDown = v);
    bindHold(smash, v => smashDown = v);
  };
})();
