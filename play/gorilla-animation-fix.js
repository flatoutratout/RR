// Gorilla animation: one stable hidden physics body + one visible five-pose sprite.
(function () {
  if (typeof window.setPlayerAction !== 'function') return;

  const originalSetPlayerAction = window.setPlayerAction;
  const originalStartRainbowFlash = window.startRainbowFlash;
  const originalStopRainbowFlash = window.stopRainbowFlash;
  const originalStartRageTrail = window.startRageTrail;
  const originalStopRageTrail = window.stopRageTrail;

  let visual = null;
  let lastAction = 'idle';
  let gorillaRageTrailEvent = null;
  let gorillaRagePulseTween = null;

  const textureFor = action => `gorilla_${action}`;

  // Scale from the actual opaque character bounds, using idle as the reference.
  // This prevents run/jump/smash from visibly growing/shrinking between frames.
  const actionScale = {
    idle: 0.500,
    run1: 0.497,
    run2: 0.596,
    jump: 0.581,
    smash: 0.720
  };

  function cleanupVisual() {
    if (visual) {
      visual.destroy();
      visual = null;
    }
    window.__gorillaVisual = null;
  }

  function ensureVisual(p) {
    if (visual && visual.scene === p.scene) return visual;
    cleanupVisual();

    visual = p.scene.add.image(Math.round(p.x), Math.round(p.y + 65), 'gorilla_idle')
      .setOrigin(0.5, 1)
      .setScale(actionScale.idle)
      .setDepth((p.depth || 0) + 0.1);
    window.__gorillaVisual = visual;

    p.scene.events.on('postupdate', function syncGorillaVisual() {
      if (!visual || !window.player || window.player !== p || !p.active || window.selectedCharacter !== 'gorilla') {
        cleanupVisual();
        p.setAlpha(1);
        p.scene.events.off('postupdate', syncGorillaVisual);
        return;
      }
      visual.setPosition(Math.round(p.x), Math.round(p.y + 65));
      visual.setOrigin(0.5, 1);
      visual.setFlipX(!!p.flipX);
      visual.setDepth((p.depth || 0) + 0.1);
    });

    return visual;
  }

  window.setPlayerAction = function gorillaPlayerAction(action) {
    if (!window.player || !window.isStarted || window.isGameOver || window.selectedCharacter !== 'gorilla') {
      cleanupVisual();
      if (window.player) window.player.setAlpha(1);
      return originalSetPlayerAction(action);
    }

    const p = window.player;
    const v = ensureVisual(p);
    p.setAlpha(0);

    // The hidden physics sprite stays on one texture. Only the visible sprite changes pose.
    if (!p.texture || p.texture.key !== 'gorilla_idle') p.setTexture('gorilla_idle');

    if (lastAction !== action || !v.texture || v.texture.key !== textureFor(action)) {
      lastAction = action;
      v.setTexture(textureFor(action));
      v.setOrigin(0.5, 1);
      v.setScale(actionScale[action] || actionScale.idle);
      v.setAngle(0);
    }
  };

  function stopGorillaRageTrail() {
    if (gorillaRageTrailEvent) {
      gorillaRageTrailEvent.remove ? gorillaRageTrailEvent.remove(false) : gorillaRageTrailEvent.stop();
      gorillaRageTrailEvent = null;
    }
  }

  // Rage must render from the visible Gorilla, not the hidden physics sprite.
  // The old code cloned the hidden idle body every 55ms, which caused the huge flashing/ghost stack.
  window.startRageTrail = function gorillaAwareRageTrail(scene) {
    if (window.selectedCharacter !== 'gorilla') return originalStartRageTrail(scene);
    stopGorillaRageTrail();

    gorillaRageTrailEvent = scene.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        const v = window.__gorillaVisual;
        if (!v || !v.active || !window.rageMode) return;
        const dir = v.flipX ? 1 : -1;
        const trail = scene.add.image(v.x + dir * 12, v.y, v.texture.key)
          .setOrigin(0.5, 1)
          .setDepth(v.depth - 0.1)
          .setAlpha(0.18)
          .setScale(v.scaleX, v.scaleY)
          .setFlipX(v.flipX);
        if (window.rainbowPipelineReady && trail.setPipeline) {
          try { trail.setPipeline('RainbowStar'); } catch (e) {}
        }
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          x: trail.x + dir * 12,
          duration: 150,
          ease: 'Sine.easeOut',
          onComplete: () => trail.destroy()
        });
      }
    });
  };

  window.stopRageTrail = function gorillaAwareStopTrail() {
    if (window.selectedCharacter !== 'gorilla') return originalStopRageTrail();
    stopGorillaRageTrail();
  };

  window.startRainbowFlash = function gorillaAwareRainbow(scene) {
    if (window.selectedCharacter !== 'gorilla') return originalStartRainbowFlash(scene);
    window.stopRainbowFlash();
    const v = ensureVisual(window.player);
    if (!v) return;
    v.clearTint();
    if (window.rainbowPipelineReady && v.setPipeline) {
      try { v.setPipeline('RainbowStar'); } catch (e) {}
    }
    gorillaRagePulseTween = scene.tweens.add({
      targets: v,
      scaleX: v.scaleX * 1.035,
      scaleY: v.scaleY * 1.035,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  };

  window.stopRainbowFlash = function gorillaAwareStopRainbow() {
    if (window.selectedCharacter !== 'gorilla') return originalStopRainbowFlash();
    stopGorillaRageTrail();
    if (gorillaRagePulseTween) {
      gorillaRagePulseTween.stop();
      gorillaRagePulseTween = null;
    }
    const v = window.__gorillaVisual;
    if (v && v.active) {
      if (v.resetPipeline) v.resetPipeline();
      v.clearTint();
      v.setScale(actionScale[lastAction] || actionScale.idle);
    }
    // Keep the invisible physics body completely visually inert.
    if (window.player && window.player.active) {
      if (window.player.resetPipeline) window.player.resetPipeline();
      window.player.clearTint();
      window.player.setScale(window.player.baseScale || 0.50);
      window.player.setAlpha(0);
    }
  };
})();
