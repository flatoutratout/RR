// Proper Gorilla animation: keep physics on the existing player body and render a separate visual sprite.
// This lets the five unique Gorilla action images animate without their different source sizes moving the collider.
(function () {
  if (typeof window.setPlayerAction !== 'function') return;

  const originalSetPlayerAction = window.setPlayerAction;
  let visual = null;
  let visualScene = null;
  let lastAction = 'idle';

  const textureFor = action => `gorilla_${action}`;
  const scaleFor = action => action === 'idle' ? 0.50 : 0.65;

  function cleanup() {
    if (visual) {
      visual.destroy();
      visual = null;
    }
    visualScene = null;
  }

  function ensureVisual(p) {
    if (visual && visual.scene === p.scene) return visual;
    cleanup();
    visualScene = p.scene;
    visual = p.scene.add.image(p.x, p.y + 65, 'gorilla_idle')
      .setOrigin(0.5, 1)
      .setScale(0.50)
      .setDepth((p.depth || 0) + 0.1);

    p.scene.events.on('postupdate', function syncGorillaVisual() {
      if (!visual || !window.player || window.player !== p || !p.active || window.selectedCharacter !== 'gorilla') {
        cleanup();
        p.setAlpha(1);
        p.scene.events.off('postupdate', syncGorillaVisual);
        return;
      }
      visual.setPosition(p.x, p.y + 65);
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

    // Keep the hidden physics sprite on one stable texture; only the visual follower animates.
    if (!p.texture || p.texture.key !== 'gorilla_idle') p.setTexture('gorilla_idle');

    if (lastAction !== action || !v.texture || v.texture.key !== textureFor(action)) {
      lastAction = action;
      v.setTexture(textureFor(action));
      v.setScale(scaleFor(action));
      v.setAngle(0);
    }
  };
})();
