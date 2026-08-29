// Gorilla V1 preview sizing patch.
// Keep the new artwork readable in gameplay without changing the other characters.
(function () {
  const originalStartGame = startGame;
  startGame = function startGameWithGorillaScale(chosen) {
    originalStartGame(chosen);
    if (selectedCharacter === 'gorilla' && player) {
      player.setScale(0.82);
      player.baseScale = 0.82;
    }
  };
})();
