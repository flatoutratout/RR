// Force the missing lower street/wall artwork to render on mobile.
// The full sidewalk layer is valid, but the lower wall section was still ending up
// underneath the blank gameplay strip. Recreate the layer and place it just in
// front of world buildings, but still behind the player and enemies.
(function () {
  let patched = false;

  function patchForeground() {
    if (patched || !window.Phaser || !Phaser.GAMES || !Phaser.GAMES.length) return;
    const game = Phaser.GAMES[0];
    const scene = game && game.scene && game.scene.scenes && game.scene.scenes[0];
    if (!scene || !scene.children || !scene.textures || !scene.textures.exists('sidewalk')) return;

    scene.children.list.slice().forEach(obj => {
      if (obj && obj.texture && obj.texture.key === 'sidewalk') obj.destroy();
    });

    // Full native artwork, camera-fixed. Depth 4.5 deliberately puts the lower
    // street/wall in front of the building layer (4) but behind player (5) and tanks (7).
    const street = scene.add.image(480, 270, 'sidewalk')
      .setOrigin(0.5)
      .setDisplaySize(960, 540)
      .setScrollFactor(0)
      .setDepth(4.5);

    // The top of sidewalk.png is transparent, so only its intended lower wall/street
    // artwork should sit above the buildings. This removes the black mobile gap.
    street.setAlpha(1);

    patched = true;
  }

  const timer = setInterval(function () {
    patchForeground();
    if (patched) clearInterval(timer);
  }, 50);

  setTimeout(function () { clearInterval(timer); }, 10000);
})();
