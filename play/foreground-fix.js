// Mobile foreground repair: render the actual lower section of sidewalk.png
// as its own strip. The game canvas is 960x540 and the intended street/wall art
// lives in the bottom part of the 960x540 sidewalk texture.
(function () {
  let patched = false;

  function patchForeground() {
    if (patched || !window.Phaser || !Phaser.GAMES || !Phaser.GAMES.length) return;
    const game = Phaser.GAMES[0];
    const scene = game && game.scene && game.scene.scenes && game.scene.scenes[0];
    if (!scene || !scene.children || !scene.textures || !scene.textures.exists('sidewalk')) return;

    // Remove every previous sidewalk renderer so old mobile patches cannot fight this one.
    scene.children.list.slice().forEach(obj => {
      if (obj && obj.texture && obj.texture.key === 'sidewalk') obj.destroy();
    });

    // sidewalk.png is 960x540 with a transparent upper area. Render only the
    // lower 150px where the industrial wall / pavement artwork actually lives.
    // This places it explicitly into the blank lower part of the gameplay canvas.
    const wall = scene.add.image(480, 465, 'sidewalk')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(4.5)
      .setCrop(0, 390, 960, 150)
      .setDisplaySize(960, 150)
      .setAlpha(1);

    // The current build also has world baselines below the 540px logical canvas
    // (player/buildings at 560 and tanks at 544). Keep rendered mobile objects
    // visually planted on the restored street instead of hanging below the screen.
    const alignObjects = function () {
      if (!wall.active) return;
      scene.children.list.forEach(obj => {
        if (!obj || !obj.active || !obj.texture) return;
        const key = obj.texture.key || '';

        if (/^(gorilla|croc|cow|eagle)_(idle|run1|run2|jump|smash)$/.test(key)) {
          if (obj.y > 525 && obj.body) {
            obj.y = Math.min(obj.y, 522);
            obj.body.updateFromGameObject();
          }
        } else if (key === 'tank') {
          // Keep the original tank scale; only correct its feet position.
          if (obj.y > 526) {
            obj.y = 526;
            if (obj.body) obj.body.updateFromGameObject();
          }
        } else if (key === 'building') {
          if (obj.y > 535) {
            obj.y = 535;
            if (obj.body) obj.body.updateFromGameObject();
          }
        }
      });
    };

    alignObjects();
    scene.events.on('postupdate', alignObjects);
    patched = true;
  }

  const timer = setInterval(function () {
    patchForeground();
    if (patched) clearInterval(timer);
  }, 50);

  setTimeout(function () { clearInterval(timer); }, 10000);
})();
