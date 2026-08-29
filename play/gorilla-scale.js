// Gorilla V1 preview gameplay-fit patch.
(function () {
  const originalStartGame = startGame;
  startGame = function startGameWithGorillaFit(chosen) {
    originalStartGame(chosen);
    if (selectedCharacter !== 'gorilla' || !player) return;

    const scene = player.scene;
    player.setScale(1.08);
    player.baseScale = 1.08;

    // Tight body around the visible Gorilla only.
    if (player.body && player.body.setSize) {
      player.body.setSize(66, 96, false);
      player.body.setOffset(227, 150);
    }

    if (scene && scene.cameras && scene.cameras.main) {
      const cam = scene.cameras.main;
      cam.setDeadzone(250, 120);
      cam.setFollowOffset(-165, 0);
    }

    // The legacy building PNG carries a huge source-space body. Disable that body as a
    // physical wall: main.js already uses its tighter visible-core rectangle for blocking/smashing.
    if (buildings && buildings.children) {
      buildings.children.iterate(b => {
        if (b && b.body) b.body.enable = false;
      });
    }

    // Give helicopters explicit compact bodies matching the visible aircraft rather than
    // transparent image bounds. Keep them non-solid; overlap/projectiles handle damage.
    if (choppers && choppers.children) {
      choppers.children.iterate(c => {
        if (!c || !c.body) return;
        c.body.setSize(96, 42, true);
        c.body.allowGravity = false;
      });
    }
  };

  // Patch newly spawned enemies/buildings every frame because endless chunks are created after start.
  const originalUpdate = update;
  update = function updateWithPreviewPhysics(time, delta) {
    if (selectedCharacter === 'gorilla') {
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

  // Helicopters need a reachable melee window. Ground smash can now clip a low helicopter
  // if it is close horizontally, while normal overlap still handles direct contact.
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
