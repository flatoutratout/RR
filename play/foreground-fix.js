// Mobile foreground repair: flatten the known-good sky + sidewalk artwork into
// a small opaque strip at runtime, then render it with normal Phaser Images.
// This avoids the mobile-only failure we've seen with the transparent sidewalk
// texture / TileSprite path while keeping the original artwork.
(function () {
  let installed = false;
  let attempts = 0;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function install() {
    if (installed || !window.Phaser || !Phaser.GAMES || !Phaser.GAMES.length) return;

    const game = Phaser.GAMES[0];
    const scene = game && game.scene && game.scene.scenes && game.scene.scenes[0];
    attempts++;

    if (
      !scene || !scene.sys || !scene.sys.isActive() ||
      typeof player === 'undefined' || !player ||
      typeof buildings === 'undefined' || !buildings ||
      typeof tanks === 'undefined' || !tanks ||
      typeof cam === 'undefined' || !cam
    ) return;

    installed = true;

    try {
      // The visible sidewalk artwork starts at y=329 in the original 960x540 PNG.
      // Flatten that section over the matching sky section so the resulting
      // texture is completely opaque and mobile WebGL has no alpha-layer issue.
      const [skyImg, sidewalkImg] = await Promise.all([
        loadImage('assets/sky.png?v=street-flat-1'),
        loadImage('assets/sidewalk.png?v=street-flat-1')
      ]);

      const stripY = 329;
      const stripH = 540 - stripY;
      const canvas = document.createElement('canvas');
      canvas.width = 960;
      canvas.height = stripH;
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#050008';
      ctx.fillRect(0, 0, 960, stripH);
      ctx.drawImage(skyImg, 0, stripY, 960, stripH, 0, 0, 960, stripH);
      ctx.drawImage(sidewalkImg, 0, stripY, 960, stripH, 0, 0, 960, stripH);

      if (scene.textures.exists('rr_mobile_street_flat')) {
        scene.textures.remove('rr_mobile_street_flat');
      }
      scene.textures.addCanvas('rr_mobile_street_flat', canvas);

      // Remove every previous sidewalk display object / experimental repair.
      scene.children.list.slice().forEach(obj => {
        if (!obj || !obj.texture) return;
        const key = obj.texture.key;
        if (key === 'sidewalk' || key === 'rr_mobile_street_flat') obj.destroy();
      });

      // Three ordinary Images are enough to cover a 960px camera while it moves.
      // Recycle them around the camera instead of making a 200,000px TileSprite.
      const tiles = [-1, 0, 1].map(() =>
        scene.add.image(0, stripY, 'rr_mobile_street_flat')
          .setOrigin(0, 0)
          .setDepth(3.5)
          .setScrollFactor(1)
          .setAlpha(1)
          .setVisible(true)
      );

      function sync() {
        if (!cam || !tiles[0] || !tiles[0].active) return;
        const base = Math.floor(cam.scrollX / 960) * 960;
        tiles[0].x = base - 960;
        tiles[1].x = base;
        tiles[2].x = base + 960;
      }

      sync();
      scene.events.on('update', sync);
      window.__rrStreetLayer = tiles;
      console.log('[RR] flattened mobile street installed', { attempts, stripY, stripH });
    } catch (err) {
      installed = false;
      console.error('[RR] flattened mobile street failed', err);
    }
  }

  const timer = setInterval(() => {
    install();
    if (installed || attempts > 240) clearInterval(timer);
  }, 50);

  window.addEventListener('load', () => setTimeout(install, 350), { once: true });
})();
