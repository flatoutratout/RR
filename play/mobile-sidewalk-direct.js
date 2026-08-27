// Mobile-only direct fix for the original giant sidewalk TileSprite.
// Intercept the sidewalk creation BEFORE main.js creates it and replace the
// 200,000px-wide TileSprite with a normal 960x540 image fixed to the camera.
// This keeps the exact original sidewalk.png artwork and avoids the mobile
// renderer failing on an enormous TileSprite surface.
(function () {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  if (!isTouch || !window.Phaser || !Phaser.GameObjects || !Phaser.GameObjects.GameObjectFactory) return;

  const proto = Phaser.GameObjects.GameObjectFactory.prototype;
  const originalTileSprite = proto.tileSprite;

  proto.tileSprite = function (x, y, width, height, texture, frame) {
    if (texture === 'sidewalk' && width > 5000) {
      const img = this.image(480, 270, texture, frame);
      img.setDisplaySize(960, 540);
      img.setScrollFactor(0);
      img.setName('__rr_mobile_sidewalk_direct');
      console.log('[RR] replaced giant mobile sidewalk TileSprite with normal image');
      return img;
    }

    return originalTileSprite.call(this, x, y, width, height, texture, frame);
  };
})();
