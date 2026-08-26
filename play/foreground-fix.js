// Force the missing lower street/wall artwork to render as a normal Phaser Image.
// sidewalk.png is a full 960x540 image. Using TileSprite here has proven unreliable
// on the mobile build, so this removes every sidewalk TileSprite and draws the
// original texture directly at its native game size behind gameplay objects.
(function () {
  let patched = false;

  function patchForeground() {
    if (patched || !window.Phaser || !Phaser.GAMES || !Phaser.GAMES.length) return;
    const game = Phaser.GAMES[0];
    const scene = game && game.scene && game.scene.scenes && game.scene.scenes[0];
    if (!scene || !scene.children || !scene.textures || !scene.textures.exists('sidewalk')) return;

    // Remove any previous sidewalk TileSprite / patch layer.
    scene.children.list.slice().forEach(obj => {
      if (obj && obj.texture && obj.texture.key === 'sidewalk') {
        obj.destroy();
      }
    });

    // Draw the exact 960x540 sidewalk/wall artwork as a normal image.
    // Fixed to camera because the artwork itself is a complete screen layer.
    const street = scene.add.image(480, 270, 'sidewalk')
      .setOrigin(0.5)
      .setDisplaySize(960, 540)
      .setScrollFactor(0)
      .setDepth(3);

    // Make sure it stays behind buildings/player but above the distant skyline.
    scene.children.moveBelow(street, scene.children.list.find(o => o && o.texture && o.texture.key === 'building') || street);

    patched = true;
  }

  const timer = setInterval(function () {
    patchForeground();
    if (patched) clearInterval(timer);
  }, 50);

  setTimeout(function () { clearInterval(timer); }, 10000);
})();
