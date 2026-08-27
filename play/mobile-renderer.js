// Rainbow Rampage mobile renderer guard.
// main.js still declares `type: Phaser.AUTO`, so on mobile we make AUTO resolve
// to Canvas BEFORE main.js is evaluated. Do not touch the game world/sidewalk code.
(function () {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  if (!isTouch || !window.Phaser) return;

  // Phaser's renderer constants are exposed as properties. Redefining AUTO here means
  // the later `type: Phaser.AUTO` expression in main.js receives the Canvas value (1).
  // This is deliberately isolated in this tiny pre-main script so main.js remains intact.
  try {
    Object.defineProperty(Phaser, 'AUTO', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: Phaser.CANVAS
    });
    console.log('[RR] mobile Phaser.AUTO mapped to CANVAS before game creation');
  } catch (err) {
    try {
      Phaser.AUTO = Phaser.CANVAS;
    } catch (_) {}
    console.warn('[RR] renderer constant redefine fallback used', err);
  }
})();
