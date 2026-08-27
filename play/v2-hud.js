// Rainbow Rampage V2 HUD. Keeps the existing updateHUD data contract/coordinates
// but replaces the neon-shell presentation with chunky comic arcade panels.
(function () {
  createHUD = function createHUDV2(scene) {
    const hudDepth = 90;
    const hud = scene.add.container(0, 0).setScrollFactor(0).setDepth(hudDepth);
    hudShellRef = hud;

    const panel = (x, y, w, h, stroke, fill = 0x08080d) => {
      const r = scene.add.rectangle(x, y, w, h, fill, 0.96).setScrollFactor(0).setDepth(hudDepth);
      r.setStrokeStyle(4, stroke, 0.95);
      hud.add(r);
      return r;
    };

    // Heavy black header backing and the torn-comic white lower edge.
    const topBack = scene.add.rectangle(480, 57, 952, 110, 0x050508, 0.91).setScrollFactor(0).setDepth(hudDepth - 2);
    topBack.setStrokeStyle(3, 0xffffff, 0.5);
    hud.add(topBack);
    const slash = scene.add.rectangle(480, 116, 950, 5, 0xffffff, 0.82).setAngle(-0.25).setScrollFactor(0).setDepth(hudDepth - 1);
    hud.add(slash);

    panel(103, 54, 188, 84, 0xffffff, 0x09090d);
    panel(282, 54, 126, 72, 0x00eaff);
    panel(428, 54, 118, 72, 0xffd600);
    panel(570, 54, 126, 72, 0xff2d83);
    panel(722, 54, 132, 72, 0x75ff28);
    panel(858, 54, 118, 72, 0xff7b22);

    const logo = scene.add.image(103, 54, 'logoWide').setScale(0.36).setScrollFactor(0).setDepth(hudDepth + 2);
    hud.add(logo);

    const labelStyle = color => ({
      fontFamily:'Arial Black', fontSize:'10px', color,
      stroke:'#000000', strokeThickness:4
    });
    const valueStyle = (size=25, color='#ffffff') => ({
      fontFamily:'Arial Black', fontSize:size+'px', color,
      stroke:'#000000', strokeThickness:6
    });

    hud.add(scene.add.text(282, 29, 'SCORE', labelStyle('#00eaff')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+2));
    hud.add(scene.add.text(428, 29, 'COINS', labelStyle('#ffd600')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+2));
    hud.add(scene.add.text(570, 29, 'LIVES', labelStyle('#ff4ba0')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+2));
    hud.add(scene.add.text(722, 29, 'DISTANCE', labelStyle('#8cff42')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+2));
    hud.add(scene.add.text(858, 29, 'HEAT', labelStyle('#ff913b')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+2));

    scoreText = scene.add.text(282, 59, '0', valueStyle(27)).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+3); scoreText.maxWidth=72;
    coinText = scene.add.text(428, 59, '0', valueStyle(26,'#fff4a4')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+3); coinText.maxWidth=52;
    healthText = scene.add.text(570, 59, '♥♥♥♥♥', valueStyle(16,'#ff4ba0')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+3); healthText.maxWidth=76;
    distanceText = scene.add.text(722, 59, '0m', valueStyle(25)).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+3); distanceText.maxWidth=78;
    difficultyText = scene.add.text(858, 57, '🔥', valueStyle(15,'#ff9a00')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+3); difficultyText.maxWidth=78;

    // Keep the updateHUD heat drawing coordinates intact.
    heatBarFill = scene.add.graphics().setScrollFactor(0).setDepth(hudDepth + 4);

    // Rage strip. updateHUD draws segments from x=300..768 at y=101.
    const rageBack = scene.add.rectangle(530, 106, 548, 31, 0x09060d, 0.98).setScrollFactor(0).setDepth(hudDepth);
    rageBack.setStrokeStyle(3, 0xff21c8, 0.92); hud.add(rageBack);
    const rageLabelPlate = scene.add.rectangle(245, 106, 105, 31, 0xff21c8, 0.95).setScrollFactor(0).setDepth(hudDepth+1).setAngle(-1);
    hud.add(rageLabelPlate);
    hud.add(scene.add.text(245, 106, '⚡ RAGE', {fontFamily:'Arial Black',fontSize:'13px',color:'#090006',stroke:'#ffffff',strokeThickness:1}).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+2));
    const barBg = scene.add.rectangle(534, 107, 474, 15, 0x211824, 1).setScrollFactor(0).setDepth(hudDepth+1);
    barBg.setStrokeStyle(2,0xffffff,0.18); hud.add(barBg);
    rageBarFill = scene.add.graphics().setScrollFactor(0).setDepth(hudDepth + 4);
    rageTimerText = scene.add.text(815, 104, '0%', valueStyle(17,'#00eaff')).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth+4);
    rageText = scene.add.text(0,0,'').setVisible(false);

    // Mission card: compact, black, green comic panel at top-right below HUD.
    missionShellRef = panel(808, 158, 292, 70, 0x79ff32, 0x071008);
    missionText = scene.add.text(685, 132, 'MISSION', {fontFamily:'Arial Black',fontSize:'10px',color:'#79ff32',stroke:'#000000',strokeThickness:4}).setOrigin(0,0).setScrollFactor(0).setDepth(hudDepth+2);
    destroyedText = scene.add.text(685, 151, 'Destroy buildings\n0/50', {fontFamily:'Arial Black',fontSize:'12px',color:'#ffffff',stroke:'#000000',strokeThickness:4}).setOrigin(0,0).setScrollFactor(0).setDepth(hudDepth+2);
    comboText = scene.add.text(932, 139, 'x1', {fontFamily:'Arial Black',fontSize:'25px',color:'#7dff00',stroke:'#000000',strokeThickness:6}).setOrigin(1,0).setScrollFactor(0).setDepth(hudDepth+3);

    const pauseBg = scene.add.rectangle(938, 23, 34, 34, 0x08080d, 0.98).setScrollFactor(0).setDepth(hudDepth+3);
    pauseBg.setStrokeStyle(3,0xffffff,0.82); hud.add(pauseBg);
    pauseText = scene.add.text(938, 10, 'Ⅱ', {fontFamily:'Arial Black',fontSize:'20px',color:'#ffffff',stroke:'#000000',strokeThickness:4}).setOrigin(0.5,0).setScrollFactor(0).setDepth(hudDepth+4);

    // Tiny comic wobble instead of the whole HUD breathing.
    scene.tweens.add({targets:rageLabelPlate,angle:1,duration:700,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  };
})();
