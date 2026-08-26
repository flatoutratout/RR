// Mobile-friendly game-over restart control.
// Loaded after main.js so it can extend the existing game-over flow without
// changing desktop keyboard controls.
(() => {
  const originalEndPanel = window.endPanel;

  window.endPanel = function(scene, title, color, sub) {
    if (typeof originalEndPanel === "function") {
      originalEndPanel(scene, title, color, sub);
    }

    if (title !== "GAME OVER") return;

    const restartBg = scene.add.rectangle(480, 350, 300, 54, 0x08000d, 0.96)
      .setScrollFactor(0)
      .setDepth(220)
      .setStrokeStyle(3, 0x00ffff, 0.95)
      .setInteractive({ useHandCursor: true });

    const restartText = scene.add.text(480, 350, "↻  TAP TO RESTART", {
      fontFamily: "Arial Black, Impact, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(221)
      .setInteractive({ useHandCursor: true });

    const restart = () => window.location.reload();
    restartBg.on("pointerdown", restart);
    restartText.on("pointerdown", restart);

    scene.tweens.add({
      targets: [restartBg, restartText],
      alpha: { from: 0.78, to: 1 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  };
})();
