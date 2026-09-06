// Gorilla animation: stable physics body + one visible five-pose sprite.
(function () {
  if (typeof setPlayerAction !== 'function') return;

  const originalSetPlayerAction = setPlayerAction;
  const originalStartRainbowFlash = startRainbowFlash;
  const originalStopRainbowFlash = stopRainbowFlash;
  const originalStartRageTrail = startRageTrail;
  const originalStopRageTrail = stopRageTrail;

  let visual = null;
  let lastAction = 'idle';
  let gorillaRageTrailEvent = null;
  let gorillaRagePulseTween = null;

  const textureFor = action => `gorilla_${action}`;
  const actionScale = {
    idle: 0.500,
    run1: 0.497,
    run2: 0.596,
    jump: 0.581,
    smash: 0.720
  };

  function cleanupVisual() {
    if (visual) visual.destroy();
    visual = null;
  }

  function ensureVisual(p) {
    if (visual && visual.scene === p.scene) return visual;
    cleanupVisual();
    visual = p.scene.add.image(Math.round(p.x), Math.round(p.y + 65), 'gorilla_idle')
      .setOrigin(0.5, 1)
      .setScale(actionScale.idle)
      .setDepth((p.depth || 0) + 0.1);

    p.scene.events.on('postupdate', function syncGorillaVisual() {
      if (!visual || !player || player !== p || !p.active || selectedCharacter !== 'gorilla') {
        cleanupVisual();
        if (p && p.active) p.setAlpha(1);
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

  setPlayerAction = function gorillaPlayerAction(action) {
    if (!player || !isStarted || isGameOver || selectedCharacter !== 'gorilla') {
      cleanupVisual();
      if (player) player.setAlpha(1);
      return originalSetPlayerAction(action);
    }

    const p = player;
    const v = ensureVisual(p);
    p.setAlpha(0);
    // Never swap the physics sprite texture. This is what was causing the apparent frame flash/jump.
    if (!p.texture || p.texture.key !== 'gorilla_idle') p.setTexture('gorilla_idle');

    if (lastAction !== action || !v.texture || v.texture.key !== textureFor(action)) {
      lastAction = action;
      v.setTexture(textureFor(action));
      v.setOrigin(0.5, 1);
      v.setScale(actionScale[action] || actionScale.idle);
      v.setAngle(0);
    }
  };

  function stopGorillaTrail() {
    if (gorillaRageTrailEvent) {
      gorillaRageTrailEvent.remove ? gorillaRageTrailEvent.remove(false) : gorillaRageTrailEvent.stop();
      gorillaRageTrailEvent = null;
    }
  }

  startRageTrail = function gorillaAwareRageTrail(scene) {
    if (selectedCharacter !== 'gorilla') return originalStartRageTrail(scene);
    stopGorillaTrail();
    gorillaRageTrailEvent = scene.time.addEvent({
      delay: 95,
      loop: true,
      callback: () => {
        if (!visual || !visual.active || !rageMode) return;
        const dir = visual.flipX ? 1 : -1;
        const trail = scene.add.image(visual.x + dir * 10, visual.y, visual.texture.key)
          .setOrigin(0.5, 1)
          .setDepth(visual.depth - 0.1)
          .setAlpha(0.15)
          .setScale(visual.scaleX, visual.scaleY)
          .setFlipX(visual.flipX);
        if (rainbowPipelineReady && trail.setPipeline) {
          try { trail.setPipeline('RainbowStar'); } catch (e) {}
        }
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          x: trail.x + dir * 10,
          duration: 145,
          ease: 'Sine.easeOut',
          onComplete: () => trail.destroy()
        });
      }
    });
  };

  stopRageTrail = function gorillaAwareStopTrail() {
    if (selectedCharacter !== 'gorilla') return originalStopRageTrail();
    stopGorillaTrail();
  };

  startRainbowFlash = function gorillaAwareRainbow(scene) {
    if (selectedCharacter !== 'gorilla') return originalStartRainbowFlash(scene);
    stopRainbowFlash();
    const v = ensureVisual(player);
    if (!v) return;
    v.clearTint();
    if (rainbowPipelineReady && v.setPipeline) {
      try { v.setPipeline('RainbowStar'); } catch (e) {}
    }
    gorillaRagePulseTween = scene.tweens.add({
      targets: v,
      scaleX: v.scaleX * 1.025,
      scaleY: v.scaleY * 1.025,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  };

  stopRainbowFlash = function gorillaAwareStopRainbow() {
    if (selectedCharacter !== 'gorilla') return originalStopRainbowFlash();
    stopGorillaTrail();
    if (gorillaRagePulseTween) {
      gorillaRagePulseTween.stop();
      gorillaRagePulseTween = null;
    }
    if (visual && visual.active) {
      if (visual.resetPipeline) visual.resetPipeline();
      visual.clearTint();
      visual.setScale(actionScale[lastAction] || actionScale.idle);
    }
    if (player && player.active) {
      if (player.resetPipeline) player.resetPipeline();
      player.clearTint();
      player.setScale(player.baseScale || 0.50);
      player.setAlpha(0);
    }
  };
})();
