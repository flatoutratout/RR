// Use Phaser's Canvas renderer on touch/mobile devices.
// The game's original WORLD_W sidewalk TileSprite renders correctly in Canvas,
// while some mobile WebGL drivers drop that foreground layer entirely.
(function () {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  if (!isTouch || !window.Phaser) return;

  try {
    Phaser.AUTO = Phaser.CANVAS;
    console.log('[RR] mobile renderer forced to CANVAS');
  } catch (err) {
    console.warn('[RR] could not force mobile canvas renderer', err);
  }
})();
