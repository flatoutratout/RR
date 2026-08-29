// Gorilla V1 preview fit patch.
(function () {
  const crop = { x: 29, y: 10, w: 72, h: 78 };
  const actions = ['idle', 'run1', 'run2', 'jump', 'smash'];

  function addTightFrames(scene) {
    actions.forEach(action => {
      const key = `gorilla_${action}`;
      const tex = scene.textures.get(key);
      if (tex && tex.key !== '__MISSING' && !tex.has('tight')) {
        tex.add('tight', 0, crop.x, crop.y, crop.w, crop.h);
      }
    });
  }

  const baseSetPlayerAction = setPlayerAction;
  setPlayerAction = function(action) {
    if (selectedCharacter !== 'gorilla') return baseSetPlayerAction(action);
    if (!player || !isStarted || isGameOver) return;
    const key = `gorilla_${action}`;
    if (player.texture.key !== key || player.frame.name !== 'tight') {
      player.setTexture(key, 'tight');
    }
  };

  const baseStartGame = startGame;
  startGame = function(chosen) {
    baseStartGame(chosen);
    if (selectedCharacter !== 'gorilla' || !player) return;

    const scene = player.scene;
    addTightFrames(scene);
    player.setTexture('gorilla_idle', 'tight');
    player.setOrigin(0.5, 1);
    player.setScale(1.08);
    player.baseScale = 1.08;
    player.setY(PLAYER_START_Y);

    if (player.body) {
      player.body.setSize(66, 74, false);
      player.body.setOffset(3, 4);
      player.body.updateFromGameObject();
    }

    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.setDeadzone(250, 120);
      scene.cameras.main.setFollowOffset(-165, 0);
    }

    if (buildings && buildings.children) {
      buildings.children.iterate(b => { if (b && b.body) b.body.enable = false; });
    }
  };

  const baseUpdate = update;
  update = function(time, delta) {
    if (selectedCharacter === 'gorilla' && player) {
      if (player.body) {
        player.body.setSize(66, 74, false);
        player.body.setOffset(3, 4);
      }
      if (buildings && buildings.children) {
        buildings.children.iterate(b => { if (b && b.body) b.body.enable = false; });
      }
    }
    return baseUpdate.call(this, time, delta);
  };
})();
