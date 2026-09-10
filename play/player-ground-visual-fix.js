// Visual ground alignment for the 500x500 character sprite set.
// The character art sits slightly too high compared with tanks/buildings.
// Drop the rendered character by a fixed on-screen amount while compensating
// the Arcade body offset so gameplay collisions stay where they were.
(function () {
  const VISUAL_DROP_PX = 30;
  let applied = false;
  let attempts = 0;

  const timer = setInterval(() => {
    attempts += 1;

    try {
      if (!applied && typeof player !== "undefined" && player && player.active && player.body && player.visible) {
        const scaleY = Math.abs(player.scaleY || player.scale || 1);
        const sourceShift = VISUAL_DROP_PX / scaleY;
        const currentDisplayOriginY = player.displayOriginY;
        const currentOffsetY = player.body.offset.y / scaleY;

        // Moving the display origin upward moves the artwork down. Moving the
        // body offset by the same source-space amount cancels that change for
        // physics, so only the visible sprite moves.
        player.setDisplayOrigin(player.displayOriginX, currentDisplayOriginY - sourceShift);
        player.body.setOffset(player.body.offset.x / Math.abs(player.scaleX || 1), currentOffsetY - sourceShift);
        player.body.updateFromGameObject();

        player.rrGroundVisualAligned = true;
        applied = true;
        clearInterval(timer);
      }
    } catch (_) {}

    if (attempts > 150) clearInterval(timer);
  }, 50);
})();
