// Stable Gorilla motion patch: keep one confirmed HD texture visible and animate the pose procedurally.
// This prevents mismatched-frame flashing while giving run/jump/smash readable movement.
(function () {
  if (typeof window.setPlayerAction !== 'function') return;
  const originalSetPlayerAction = window.setPlayerAction;

  window.setPlayerAction = function patchedPlayerAction(action) {
    if (!window.player || !window.isStarted || window.isGameOver || window.selectedCharacter !== 'gorilla') {
      return originalSetPlayerAction(action);
    }

    const p = window.player;
    const base = p.baseScale || 0.50;

    // Never swap Gorilla textures during gameplay. The action silhouettes were not registered
    // consistently, which is what produced the apparent double-image flash.
    if (!p.texture || p.texture.key !== 'gorilla_idle') p.setTexture('gorilla_idle');

    if (action === 'run1') {
      p.setScale(base * 1.015, base * 0.975);
      p.setAngle(-2.2);
    } else if (action === 'run2') {
      p.setScale(base * 0.985, base * 1.025);
      p.setAngle(2.2);
    } else if (action === 'jump') {
      p.setScale(base * 0.97, base * 1.045);
      p.setAngle(p.flipX ? -5 : 5);
    } else if (action === 'smash') {
      p.setScale(base * 1.07, base * 0.93);
      p.setAngle(p.flipX ? 4 : -4);
    } else {
      p.setScale(base);
      p.setAngle(0);
    }
  };
})();
