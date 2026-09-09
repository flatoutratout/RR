// Rainbow Rampage progressive building damage overlay.
// Keeps the original building asset/physics untouched and draws damage in the
// same 1024x1536 source coordinate space, so every random building size lines up.
(function () {
  const SOURCE_W = 1024;
  const SOURCE_H = 1536;

  const cracks = [
    [[560,430],[548,470],[566,510],[550,548],[575,590],[558,630]],
    [[475,650],[458,688],[482,724],[463,760],[490,802],[472,846]],
    [[625,805],[646,840],[625,878],[650,920],[630,962],[655,1004]],
    [[515,1000],[496,1035],[520,1072],[500,1110],[526,1150],[508,1192]],
    [[665,1120],[646,1155],[672,1190],[650,1230],[680,1270],[658,1310]],
    [[430,1210],[448,1242],[425,1278],[450,1315],[432,1352],[458,1388]],
    [[590,1320],[572,1350],[596,1382],[575,1415],[602,1442]],
    [[700,520],[682,554],[704,590],[680,626],[705,662]],
    [[505,275],[488,310],[512,344],[492,382],[518,418]],
    [[620,680],[602,714],[626,748],[608,785],[634,820]]
  ];

  const holes = [
    [610,735,22], [485,1080,19], [650,1010,27], [535,560,22], [445,1280,20]
  ];

  function sx(b, x) { return (x / SOURCE_W - 0.5) * b.displayWidth; }
  function sy(b, y) { return -(1 - y / SOURCE_H) * b.displayHeight; }

  function destroyOverlay(b) {
    if (b && b.rrDamageOverlay) {
      b.rrDamageOverlay.destroy();
      b.rrDamageOverlay = null;
    }
  }

  function drawCrack(g, b, points, stage) {
    const lineW = Math.max(2, b.displayWidth * (0.007 + stage * 0.0015));
    const p0 = points[0];

    // Violet edge makes the fracture readable over the dark neon facade.
    g.lineStyle(lineW + 2, 0xb778d1, 0.68);
    g.beginPath();
    g.moveTo(sx(b,p0[0]), sy(b,p0[1]));
    for (let i=1;i<points.length;i++) g.lineTo(sx(b,points[i][0]), sy(b,points[i][1]));
    g.strokePath();

    g.lineStyle(lineW, 0x050207, 0.98);
    g.beginPath();
    g.moveTo(sx(b,p0[0]), sy(b,p0[1]));
    for (let i=1;i<points.length;i++) g.lineTo(sx(b,points[i][0]), sy(b,points[i][1]));
    g.strokePath();

    // Short branches off the main fracture.
    for (let i=1;i<points.length-1;i+=2) {
      const p = points[i];
      const dir = ((i + stage) % 2) ? 1 : -1;
      g.lineStyle(Math.max(1.5,lineW*0.72), 0x070309, 0.96);
      g.beginPath();
      g.moveTo(sx(b,p[0]), sy(b,p[1]));
      g.lineTo(sx(b,p[0] + dir*(24 + stage*7)), sy(b,p[1] + 14));
      g.lineTo(sx(b,p[0] + dir*(38 + stage*8)), sy(b,p[1] + 3));
      g.strokePath();
    }
  }

  function drawHole(g, b, hole, stage) {
    const [x,y,r] = hole;
    const rx = r / SOURCE_W * b.displayWidth;
    const ry = r / SOURCE_H * b.displayHeight;
    g.fillStyle(0x030105, 0.96);
    g.fillEllipse(sx(b,x), sy(b,y), rx*2.2, ry*2.2);
    g.lineStyle(Math.max(2,b.displayWidth*0.006), 0xa269b8, 0.72);
    g.strokeEllipse(sx(b,x), sy(b,y), rx*2.35, ry*2.35);

    for (let n=0;n<4;n++) {
      const a = (n * 1.47) + stage * 0.31;
      const dx = Math.cos(a) * r * 2.0;
      const dy = Math.sin(a) * r * 2.0;
      g.lineStyle(Math.max(1.5,b.displayWidth*0.0045), 0x070309, 0.95);
      g.beginPath();
      g.moveTo(sx(b,x), sy(b,y));
      g.lineTo(sx(b,x+dx), sy(b,y+dy));
      g.strokePath();
    }
  }

  function renderDamage(b, stage) {
    destroyOverlay(b);
    if (!stage || !b.scene || !b.active) return;

    const g = b.scene.add.graphics();
    g.setPosition(b.x, b.y);
    g.setDepth(4.25);

    const crackCount = stage === 1 ? 3 : stage === 2 ? 6 : 10;
    for (let i=0;i<crackCount;i++) drawCrack(g,b,cracks[i],stage);

    if (stage >= 2) {
      const holeCount = stage === 2 ? 2 : 5;
      for (let i=0;i<holeCount;i++) drawHole(g,b,holes[i],stage);
    }

    b.rrDamageOverlay = g;
    b.once(Phaser.GameObjects.Events.DESTROY, function () { destroyOverlay(b); });
  }

  // Replace the old alpha-only damage feedback with visible progressive cracks.
  window.updateBuildingDamageVisual = function (b) {
    if (!b || !b.active || !b.maxHp) {
      destroyOverlay(b);
      return;
    }

    const ratio = Phaser.Math.Clamp(b.hp / b.maxHp, 0, 1);
    const stage = ratio <= 0.25 ? 3 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 1 : 0;
    if (stage === b.damageStage) return;

    b.damageStage = stage;
    b.setAlpha(1); // damage is now artwork, not transparency
    renderDamage(b, stage);

    if (stage === 1) {
      smokePuff(b.scene, b.x, b.y - b.displayHeight * 0.35, 0.45);
    } else if (stage === 2) {
      smokePuff(b.scene, b.x, b.y - b.displayHeight * 0.45, 0.65);
      sparkShower(b.scene, b.x, b.y - b.displayHeight * 0.48, 0.65);
    } else if (stage === 3) {
      smokePuff(b.scene, b.x, b.y - b.displayHeight * 0.55, 0.9);
      sparkShower(b.scene, b.x, b.y - b.displayHeight * 0.56, 0.9);
    }
  };
})();
