// Robust mobile foreground replacement for Rainbow Rampage.
// Do not use a huge world TileSprite (mobile GPU issue) and do not use a
// canvas TileSprite (some mobile renderers still fail to show the lower wall).
// Instead recycle three ordinary Image objects. Normal images are the most
// reliable Phaser path across WebGL/Canvas/mobile and still give us an endless
// scrolling sidewalk without allocating a gigantic texture surface.
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

    // Remove every previous sidewalk renderer, including the original
    // WORLD_W TileSprite and any older repair layer.
    scene.children.list.slice().forEach(obj => {
      if (obj && obj.texture && obj.texture.key === 'sidewalk') obj.destroy();
    });

    // Three ordinary 960x540 images are enough to cover the viewport while the
    // camera moves. The source PNG contains transparency above the street/wall.
    const streetTiles = [-1, 0, 1].map(() =>
      scene.add.image(0, 270, 'sidewalk')
        .setOrigin(0.5)
        .setScrollFactor(1)
        .setDepth(4.5)
        .setAlpha(1)
        .setVisible(true)
    );

    function syncStreet() {
      if (!cam || !streetTiles.length) return;
      // Snap to the current 960px world tile, then keep one image either side.
      const tile = Math.floor(cam.scrollX / 960);
      const baseLeft = tile * 960;
      for (let i = 0; i < streetTiles.length; i++) {
        const img = streetTiles[i];
        if (!img || !img.active) continue;
        img.x = baseLeft + (i - 1) * 960 + 480;
        img.y = 270;
        img.setDepth(4.5);
        img.setVisible(true);
        img.setAlpha(1);
      }
    }

    syncStreet();
    scene.events.on('update', syncStreet);

    patched = true;
    window.__rrStreetTiles = streetTiles;
    window.__rrStreetLayer = streetTiles[1];
    console.log('[RR] sidewalk restored with recycled normal images', {
      renderer: game.renderer && game.renderer.type,
      attempts,
      count: streetTiles.length
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
