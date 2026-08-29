// Gorilla V1 preview gameplay-fit patch.
// Make the illustrated Gorilla read larger, keep collision tight to the visible body,
// and bias the camera so the player runs in the left third rather than screen centre.
(function () {
  const originalStartGame = startGame;
  startGame = function startGameWithGorillaFit(chosen) {
    originalStartGame(chosen);
    if (selectedCharacter !== 'gorilla' || !player) return;

    const scene = player.scene;

    // The source frame contains generous transparent padding, so use a stronger visual scale.
    player.setScale(1.08);
    player.baseScale = 1.08;

    // Do not let transparent pixels become gameplay collision. Fit the Arcade body to
    // the actual central Gorilla silhouette and anchor it toward the bottom of the frame.
    if (player.body && player.body.setSize) {
      player.body.setSize(82, 104, false);
      player.body.setOffset(219, 142);
    }

    // Keep the Gorilla in the left third so the player can see what is coming ahead.
    if (scene && scene.cameras && scene.cameras.main) {
      const cam = scene.cameras.main;
      cam.setDeadzone(250, 120);
      cam.setFollowOffset(-165, 0);
    }
  };
})();
