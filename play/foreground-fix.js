// Mobile foreground repair.
// IMPORTANT: wait until the Phaser scene has COMPLETELY finished create().
// Earlier versions fired as soon as the sidewalk texture existed during preload,
// which meant the replacement could be created too early and never become the
// final visible world layer.
(function () {
  let patched = false;
  let attempts = 0;

  function patchForeground() {
    if (patched || !window.Phaser || !Phaser.GAMES || !Phaser.GAMES.length) return;

    const game = Phaser.GAMES[0];
    const scene = game && game.scene && game.scene.scenes && game.scene.scenes[0];
    attempts++;

    // Do NOT patch during preload. These globals/groups are only populated once
    // main.js create() has completed far enough for the playable world to exist.
    if (
      !scene || !scene.sys || !scene.sys.isActive() ||
      !scene.textures || !scene.textures.exists('sidewalk') ||
      typeof player === 'undefined' || !player ||
      typeof buildings === 'undefined' || !buildings ||
      typeof tanks === 'undefined' || !tanks ||
      typeof cam === 'undefined' || !cam
    ) return;

    // Remove only the original gigantic world-wide sidewalk TileSprite.
    // Keep every other gameplay object exactly where main.js created it.
    scene.children.list.slice().forEach(obj => {
      if (obj && obj.texture && obj.texture.key === 'sidewalk') obj.destroy();
    });

    // sidewalk.png is itself a complete 960x540 transparent overlay. Its visible
    // cyberpunk wall/platform occupies the bottom of the image, so render the
    // WHOLE native asset at the same coordinates as the game canvas. No crop,
    // no rescaling, and no repositioning of player/buildings/tanks.
    const street = scene.add.image(480, 270, 'sidewalk')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3.5)
      .setAlpha(1)
      .setVisible(true);

    // Sanity-check the layer really has native dimensions before declaring done.
    if (!street || street.width !== 960 || street.height !== 540) {
      if (street) street.destroy();
      return;
    }

    patched = true;
    window.__rrStreetLayer = street;
    console.log('[RR] mobile foreground restored after scene create', {
      attempts,
      width: street.width,
      height: street.height,
      depth: street.depth
    });
  }

  // Wait beyond preload/create instead of racing them.
  const timer = setInterval(function () {
    patchForeground();
    if (patched || attempts > 200) clearInterval(timer);
  }, 50);

  // Also retry after load/orientation settles on mobile browsers.
  window.addEventListener('load', function () {
    setTimeout(patchForeground, 350);
  }, { once: true });
})();
