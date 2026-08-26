// Fix the foreground/sidewalk layer disappearing on mobile GPUs.
// The original build creates this TileSprite at WORLD_W (200000px) wide.
// That is unnecessarily huge and can fail to render on mobile. Keep the
// TileSprite canvas-sized and scroll its texture with the camera instead.
(function () {
  let patched = false;

  function patchForeground() {
    if (patched || !window.Phaser || !Phaser.GAMES || !Phaser.GAMES.length) return;
    const game = Phaser.GAMES[0];
    const scene = game && game.scene && game.scene.scenes && game.scene.scenes[0];
    if (!scene || !scene.children || !scene.cameras || !scene.cameras.main) return;

    const sidewalk = scene.children.list.find(obj =>
      obj && obj.type === 'TileSprite' && obj.texture && obj.texture.key === 'sidewalk'
    );
    if (!sidewalk) return;

    // 960x540 is the game's logical canvas size. The texture itself continues
    // to repeat, but we no longer ask the GPU for a 200000px-wide TileSprite.
    sidewalk.setSize(960, 540);
    sidewalk.setPosition(480, 270);
    sidewalk.setOrigin(0.5);
    sidewalk.setScrollFactor(0);
    sidewalk.setDepth(3);

    scene.events.on('postupdate', function () {
      if (!sidewalk.active) return;
      sidewalk.tilePositionX = scene.cameras.main.scrollX;
    });

    patched = true;
  }

  const timer = setInterval(function () {
    patchForeground();
    if (patched) clearInterval(timer);
  }, 100);

  setTimeout(function () { clearInterval(timer); }, 10000);
})();
