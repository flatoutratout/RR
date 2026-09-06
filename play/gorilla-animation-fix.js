// Gorilla animation: stable hidden physics body + five unique visual action sprites.
(function () {
  if (typeof window.setPlayerAction !== 'function') return;

  const originalSetPlayerAction = window.setPlayerAction;
  let visual = null;
  let lastAction = 'idle';

  const textureFor = action => `gorilla_${action}`;

  // Match every pose to the idle Gorilla's visible height (~130px on screen).
  // The source PNGs have very different heights, so one shared scale made jump/smash tiny.
  const actionScale = {
    idle: 0.50,
    run1: 0.653,
    run2: 0.730,
    jump: 0.743,
    smash: 0.909
  };

  function cleanup() {
    if (visual) {
      visual.destroy();
      visual = null;
    }
  }

  function ensureVisual(p) {
    if (visual && visual.scene === p.scene) return visual;
    cleanup();

    visual = p.scene.add.image(p.x, p.y + 65, 'gorilla_idle')
      .setOrigin(0.5, 1)
      .setScale(actionScale.idle)
      .setDepth((p.depth || 0) + 0.1);

    p.scene.events.on('postupdate', function syncGorillaVisual() {
      if (!visual || !window.player || window.player !== p || !p.active || window.selectedCharacter !== 'gorilla') {
        cleanup();
        p.setAlpha(1);
        p.scene.events.off('postupdate', syncGorillaVisual);
        return;
      }
      // Same bottom-centre anchor for every pose: no re-centering when textures switch.
      visual.setPosition(Math.round(p.x), Math.round(p.y + 65));
      visual.setOrigin(0.5, 1);
      visual.setFlipX(!!p.flipX);
      visual.setDepth((p.depth || 0) + 0.1);
    });

    return visual;
  }

  window.setPlayerAction = function gorillaPlayerAction(action) {
    if (!window.player || !window.isStarted || window.isGameOver || window.selectedCharacter !== 'gorilla') {
      cleanup();
      if (window.player) window.player.setAlpha(1);
      return originalSetPlayerAction(action);
    }

    const p = window.player;
    const v = ensureVisual(p);
    p.setAlpha(0);

    // Physics sprite never changes texture. Only the single visible follower changes pose.
    if (!p.texture || p.texture.key !== 'gorilla_idle') p.setTexture('gorilla_idle');

    if (lastAction !== action || !v.texture || v.texture.key !== textureFor(action)) {
      lastAction = action;
      v.setTexture(textureFor(action));
      v.setOrigin(0.5, 1);
      v.setScale(actionScale[action] || actionScale.idle);
      v.setAngle(0);
    }
  };
})();
