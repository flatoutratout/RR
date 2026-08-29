// Gorilla V1 preview gameplay-fit + animation patch.
(function () {
  const GORILLA_SCALE = 1.08;
  const FLOOR_Y = PLAYER_START_Y;

  function fitGorillaBody() {
    if (!player || selectedCharacter !== 'gorilla') return;
    player.setOrigin(0.5, 1);
    if (player.body && player.body.setSize) {
      // Collision hugs the visible Gorilla, not the old 520x260 transparent canvas.
      player.body.setSize(70, 82, false);
      player.body.setOffset(225, 174);
      player.body.updateFromGameObject();
    }
  }

  function applyGorillaPose(action) {
    if (!player || selectedCharacter !== 'gorilla') return;

    // All five legacy Gorilla texture paths currently contain the same source artwork.
    // Give each gameplay state its own silhouette/motion until the final dedicated pose art lands.
    let sx = GORILLA_SCALE;
    let sy = GORILLA_SCALE;
    let angle = 0;
    let yOffset = 0;

    if (action === 'run1') {
      sx = 1.12;
      sy = 1.02;
      angle = -4;
      yOffset = 1;
    } else if (action === 'run2') {
      sx = 1.02;
      sy = 1.13;
      angle = 4;
      yOffset = -3;
    } else if (action === 'jump') {
      sx = 0.98;
      sy = 1.18;
      angle = player.flipX ? 9 : -9;
    } else if (action === 'smash') {
      sx = 1.20;
      sy = 0.94;
      angle = player.flipX ? -7 : 7;
      yOffset = 4;
    }

    player.setScale(sx, sy);
    player.baseScale = GORILLA_SCALE;
    player.setAngle(angle);

    // Only pin to the street while grounded. Jump physics remains free vertically.
    if (action !== 'jump' && player.body && (player.body.blocked.down || player.body.touching.down)) {
      player.y = FLOOR_Y + yOffset;
    }
    fitGorillaBody();
  }

  const originalStartGame = startGame;
  startGame = function startGameWithGorillaFit(chosen) {
    originalStartGame(chosen);
    if (selectedCharacter !== 'gorilla' || !player) return;

    const scene = player.scene;
    player.setScale(GORILLA_SCALE);
    player.baseScale = GORILLA_SCALE;
    player.setOrigin(0.5, 1);
    player.setY(FLOOR_Y);
    fitGorillaBody();

    if (scene && scene.cameras && scene.cameras.main) {
      const cam = scene.cameras.main;
      cam.setDeadzone(250, 120);
      cam.setFollowOffset(-165, 0);
    }

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

  // Keep the game's normal texture-state logic, then add a visibly different pose per state.
  const originalSetPlayerAction = setPlayerAction;
  setPlayerAction = function setPlayerActionWithGorillaMotion(action) {
    originalSetPlayerAction(action);
    if (selectedCharacter === 'gorilla') applyGorillaPose(action);
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
