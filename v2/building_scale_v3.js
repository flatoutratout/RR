(() => {
  // V3 building-only scale correction. Keep player/enemy scale and combat untouched.
  const patch = (Proto) => {
    if (!Proto || !Proto.setDisplaySize || Proto.__rrBuildingScalePatched) return;
    const original = Proto.setDisplaySize;
    Proto.setDisplaySize = function(width, height) {
      if (this.texture && this.texture.key === 'building') {
        width *= 2.0;
        height *= 1.65;
      }
      return original.call(this, width, height);
    };
    Proto.__rrBuildingScalePatched = true;
  };

  patch(Phaser.Physics && Phaser.Physics.Arcade && Phaser.Physics.Arcade.Image && Phaser.Physics.Arcade.Image.prototype);
  patch(Phaser.Physics && Phaser.Physics.Arcade && Phaser.Physics.Arcade.Sprite && Phaser.Physics.Arcade.Sprite.prototype);
})();
