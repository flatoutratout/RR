// Gorilla V1 preview gameplay-fit patch.
(function () {
  const GORILLA_SCALE = 1.08;

  function fitGorillaBody() {
    if (!player || selectedCharacter !== 'gorilla') return;
    if (player.body && player.body.setSize) {
      // Tight collision body around the visible Gorilla while leaving Phaser in charge of movement.
      player.body.setSize(70, 82, false);
      player.body.setOffset(225, 174);
    }
  }

  const originalStartGame = startGame;
  startGame = function startGameWithGorillaFit(chosen) {
    originalStartGame(chosen);
    if (selectedCharacter !== 'gorilla' || !player) return;

    const scene = player.scene;
    player.setScale(GORILLA_SCALE);
    player.baseScale = GORILLA_SCALE;
    fitGorillaBody();

    if (scene && scene.cameras && scene.cameras.main) {
      const cam = scene.cameras.main;
      cam.setDeadzone(250, 120);
      cam.setFollowOffset(-165, 0);
    }

    // Legacy image bodies are larger than the visible artwork. The game already uses
    // tighter visible-core rectangles for building blocking and smashing.
    if (buildings && buildings.children) {
      buildings.children.iterate(b => { if (b && b.body) b.body.enable = false; });
    }
    if (choppers && choppers.children) {
      choppers.children.iterate(c => {
        if (!c || !c.body) return;
        c.body.setSize(96, 42, true);
        c.body.allowGravity = false;
      });
    }
  };

  // Do not change player origin, y-position, scale, angle or body during movement states.
  // main.js owns velocity/jump/action state; this patch only keeps collision bounds sane.
  const originalSetPlayerAction = setPlayerAction;
  setPlayerAction = function setPlayerActionWithoutMovementOverride(action) {
    originalSetPlayerAction(action);
    if (selectedCharacter === 'gorilla' && player) {
      player.setScale(GORILLA_SCALE);
      player.baseScale = GORILLA_SCALE;
      player.setAngle(0);
      fitGorillaBody();
    }
  };

  const originalUpdate = update;
  update = function updateWithPreviewPhysics(time, delta) {
    if (selectedCharacter === 'gorilla' && player) {
      if (buildings && buildings.children) {
        buildings.children.iterate(b => { if (b && b.body) b.body.enable = false; });
      }
      if (choppers && choppers.children) {
        choppers.children.iterate(c => {
          if (!c || !c.body) return;
          c.body.setSize(96, 42, true);
          c.body.allowGravity = false;
        });
      }
    }
    return originalUpdate.call(this, time, delta);
  };

  const originalDoSmash = doSmash;
  doSmash = function doSmashWithAirHit(scene) {
    if (selectedCharacter === 'gorilla' && choppers && player && player.body) {
      const dir = player.flipX ? -1 : 1;
      choppers.children.iterate(c => {
        if (!c || !c.active) return;
        const dx = (c.x - player.x) * dir;
        const dy = Math.abs(c.y - (player.y - 70));
        if (dx >= -10 && dx <= 145 && dy <= 155) {
          c.hp = (c.hp || 1) - 1;
          if (c.hp <= 0) {
            const cx = c.x, cy = c.y;
            c.disableBody(true, true);
            addScore(c.enemyType === 'elite' ? 150 : 90);
            addRage(22);
            burst(scene, cx, cy, 0xff66ff);
            floatText(scene, cx, cy - 30, 'WRECKED!', '#ff66ff');
          }
        }
      });
    }
    return originalDoSmash.call(this, scene);
  };
})();
