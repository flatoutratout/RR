// Mobile-only direct fix for the original giant sidewalk TileSprite.
// Replace the 200,000px TileSprite with the exact original 960x540 sidewalk image,
// fixed to the camera. This avoids the mobile renderer dropping the giant surface.
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

      // main.js chains .setScrollFactor(1) onto the TileSprite it thinks it created.
      // Ignore that one call for this replacement so the artwork stays locked to camera.
      const realSetScrollFactor = img.setScrollFactor.bind(img);
      img.setScrollFactor = function () {
        realSetScrollFactor(0, 0);
        return img;
      };

      console.log('[RR] mobile sidewalk replaced with fixed normal image');
      return img;
    }

    return originalTileSprite.call(this, x, y, width, height, texture, frame);
  };
})();
