// Gorilla V1 preview gameplay-fit patch.
(function () {
  const GORILLA_SCALE = 1.08;
  const TIGHT_KEYS = new Set();

  function buildTightTexture(scene, sourceKey) {
    const tightKey = `${sourceKey}_tight`;
    if (TIGHT_KEYS.has(tightKey) || scene.textures.exists(tightKey)) {
      TIGHT_KEYS.add(tightKey);
      return tightKey;
    }

    const tex = scene.textures.get(sourceKey);
    const source = tex && tex.getSourceImage ? tex.getSourceImage() : null;
    if (!source || !source.width || !source.height) return sourceKey;

    const scan = document.createElement('canvas');
    scan.width = source.width;
    scan.height = source.height;
    const ctx = scan.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, scan.width, scan.height);
    ctx.drawImage(source, 0, 0);

    let data;
    try {
      data = ctx.getImageData(0, 0, scan.width, scan.height).data;
    } catch (e) {
      return sourceKey;
    }

    let minX = scan.width, minY = scan.height, maxX = -1, maxY = -1;
    for (let y = 0; y < scan.height; y++) {
      for (let x = 0; x < scan.width; x++) {
        if (data[(y * scan.width + x) * 4 + 3] > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) return sourceKey;

    const pad = 3;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(scan.width - 1, maxX + pad);
    maxY = Math.min(scan.height - 1, maxY + pad);
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;

    const cropped = scene.textures.createCanvas(tightKey, w, h);
    const cctx = cropped.getContext();
    cctx.clearRect(0, 0, w, h);
    cctx.drawImage(source, minX, minY, w, h, 0, 0, w, h);
    cropped.refresh();
    TIGHT_KEYS.add(tightKey);
    return tightKey;
  }

  function useTightGorillaTexture(action) {
    if (!player || selectedCharacter !== 'gorilla') return;
    const scene = player.scene;
    const sourceKey = `gorilla_${action}`;
    const tightKey = buildTightTexture(scene, sourceKey);
    if (tightKey !== sourceKey && scene.textures.exists(tightKey)) {
      player.setTexture(tightKey);
    }
  }

  function fitGorillaBody() {
    if (!player || selectedCharacter !== 'gorilla' || !player.body) return;
    const frameW = Math.max(1, player.width || 1);
    const frameH = Math.max(1, player.height || 1);
    const bodyW = Math.max(42, Math.min(frameW * 0.55, frameW - 6));
    const bodyH = Math.max(58, Math.min(frameH * 0.82, frameH - 4));
    player.body.setSize(bodyW, bodyH, true);
  }

  const originalStartGame = startGame;
  startGame = function startGameWithGorillaFit(chosen) {
    originalStartGame(chosen);
    if (selectedCharacter !== 'gorilla' || !player) return;

    const scene = player.scene;
    useTightGorillaTexture('idle');
    player.setScale(GORILLA_SCALE);
    player.baseScale = GORILLA_SCALE;
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

  const originalSetPlayerAction = setPlayerAction;
  setPlayerAction = function setPlayerActionWithTightFrame(action) {
    originalSetPlayerAction(action);
    if (selectedCharacter === 'gorilla' && player) {
      useTightGorillaTexture(action);
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
