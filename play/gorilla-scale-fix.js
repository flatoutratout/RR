// Scale + ground alignment fix for the new 500x500 gorilla sprite set.
// Keep the source PNGs untouched and adjust only the in-game render/body placement.
(function () {
  const GORILLA_SCALE = 0.26;
  const GORILLA_BODY_OFFSET_X = 226;
  const GORILLA_BODY_OFFSET_Y = 365;
  let attempts = 0;

  const timer = setInterval(() => {
    attempts += 1;
    try {
      if (typeof player !== "undefined" && player && player.active && selectedCharacter === "gorilla") {
        player.baseScale = GORILLA_SCALE;
        player.setScale(GORILLA_SCALE);

        // New 500x500 artwork has much more image below the old collision box.
        // Move the body down inside the sprite so the visible feet sit on the same floor line as the tanks.
        if (player.body) {
          player.body.setSize(58, 112, false);
          player.body.setOffset(GORILLA_BODY_OFFSET_X, GORILLA_BODY_OFFSET_Y);
          player.body.updateFromGameObject();
        }

        clearInterval(timer);
      }
    } catch (_) {}

    // Don't leave a timer running forever if the game fails to initialise.
    if (attempts > 120) clearInterval(timer);
  }, 100);
})();
