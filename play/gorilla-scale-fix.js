// Scale + ground alignment fix for the new 500x500 gorilla sprite set.
// Keep the visible gorilla small while preserving the original world-space physics hitbox.
(function () {
  const GORILLA_SCALE = 0.26;

  // Original player body was 58x112 at scale 0.50.
  // Recalculate its source-pixel size at scale 0.26 so the actual on-screen
  // collision box remains approximately the same size as before.
  const BODY_W = 112;
  const BODY_H = 215;

  // Centre the body horizontally in the 500x500 sprite and bottom-align it,
  // so the gorilla's feet meet the floor without burying the artwork.
  const BODY_OFFSET_X = Math.round((500 - BODY_W) / 2);
  const BODY_OFFSET_Y = 500 - BODY_H;

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;

    try {
      if (typeof player !== "undefined" && player && player.active && selectedCharacter === "gorilla") {
        player.baseScale = GORILLA_SCALE;
        player.setScale(GORILLA_SCALE);

        if (player.body) {
          player.body.setSize(BODY_W, BODY_H, false);
          player.body.setOffset(BODY_OFFSET_X, BODY_OFFSET_Y);
          player.body.updateFromGameObject();
        }

        clearInterval(timer);
      }
    } catch (_) {}

    if (attempts > 120) clearInterval(timer);
  }, 100);
})();
