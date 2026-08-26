// Mobile-safe foreground replacement for Rainbow Rampage.
// The original game creates a WORLD_W-wide TileSprite for sidewalk.png. Desktop
// tolerates it, but some mobile WebGL renderers don't. Replace it with ONE
// canvas-sized TileSprite and scroll the texture with the camera.
(function () {
  let patched = false;
  let attempts = 0;

  function patchForeground() {
    if (patched || !window.Phaser || !Phaser.GAMES || !Phaser.GAMES.length) return;

    const game = Phaser.GAMES[0];
    const scene = game && game.scene && game.scene.scenes && game.scene.scenes[0];
    attempts++;

    if (
      !scene || !scene.sys || !scene.sys.isActive() ||
      !scene.textures || !scene.textures.exists('sidewalk') ||
      typeof player === 'undefined' || !player ||
      typeof buildings === 'undefined' || !buildings ||
      typeof tanks === 'undefined' || !tanks ||
      typeof cam === 'undefined' || !cam
    ) return;

    // Remove every sidewalk display object created by earlier code/patches.
    scene.children.list.slice().forEach(obj => {
      if (obj && obj.texture && obj.texture.key === 'sidewalk') obj.destroy();
    });

    // Use a NORMAL 960x540 TileSprite. This is small enough for mobile GPUs,
    // preserves the complete original sidewalk.png (including the lower wall),
    // and sits above buildings but below the player/tanks.
    const street = scene.add.tileSprite(480, 270, 960, 540, 'sidewalk')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(4.5)
      .setAlpha(1)
      .setVisible(true);

    // Make the fixed-size texture move exactly as the world camera moves.
    const syncStreet = function () {
      if (!street || !street.active || !cam) return;
      street.tilePositionX = cam.scrollX;
      street.tilePositionY = 0;
    };
    syncStreet();
    scene.events.on('update', syncStreet);
    street.once('destroy', function () {
      if (scene && scene.events) scene.events.off('update', syncStreet);
    });

    patched = true;
    window.__rrStreetLayer = street;
    console.log('[RR] mobile-safe sidewalk active', {
      width: street.width,
      height: street.height,
      depth: street.depth,
      attempts
    });
  }

  const timer = setInterval(function () {
    patchForeground();
    if (patched || attempts > 240) clearInterval(timer);
  }, 50);

  window.addEventListener('load', function () {
    setTimeout(patchForeground, 350);
  }, { once: true });
})();
