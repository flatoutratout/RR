// Mobile-safe foreground renderer.
// Replace the original WORLD_W-wide TileSprite entirely; resizing the existing
// TileSprite after creation can leave its oversized internal WebGL texture alive.
(function () {
  let patched = false;

  function patchForeground() {
    if (patched || !window.Phaser || !Phaser.GAMES || !Phaser.GAMES.length) return;
    const game = Phaser.GAMES[0];
    const scene = game && game.scene && game.scene.scenes && game.scene.scenes[0];
    if (!scene || !scene.children || !scene.cameras || !scene.cameras.main || !scene.textures.exists('sidewalk')) return;

    const oldSidewalk = scene.children.list.find(obj =>
      obj && obj.type === 'TileSprite' && obj.texture && obj.texture.key === 'sidewalk'
    );
    if (!oldSidewalk) return;

    // Destroy the huge 200000px TileSprite so its internal GPU surface is gone.
    oldSidewalk.destroy();

    // Create a fresh canvas-sized TileSprite. It is fixed to the camera and only
    // its texture position moves, giving the same world scrolling effect.
    const sidewalk = scene.add.tileSprite(480, 270, 960, 540, 'sidewalk')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3);

    const sync = function () {
      if (!sidewalk.active) return;
      sidewalk.tilePositionX = scene.cameras.main.scrollX;
    };
    sync();
    scene.events.on('postupdate', sync);

    patched = true;
  }

  const timer = setInterval(function () {
    patchForeground();
    if (patched) clearInterval(timer);
  }, 50);

  setTimeout(function () { clearInterval(timer); }, 10000);
})();
