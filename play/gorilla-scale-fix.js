// Scale fix for the new 500x500 gorilla sprite set.
// Keep the source PNGs untouched and reduce only the in-game render size.
(function () {
  const GORILLA_SCALE = 0.26;
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    try {
      if (typeof player !== "undefined" && player && player.active && selectedCharacter === "gorilla") {
        player.baseScale = GORILLA_SCALE;
        player.setScale(GORILLA_SCALE);
        clearInterval(timer);
      }
    } catch (_) {}

    // Don't leave a timer running forever if the game fails to initialise.
    if (attempts > 120) clearInterval(timer);
  }, 100);
})();
