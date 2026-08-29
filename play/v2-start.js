// Rainbow Rampage V2 character select.
// Uses the existing portraits/stats and only replaces presentation.
(function () {
  showStart = function showStartV2(scene) {
    startPanel = scene.add.container(480, 286).setScrollFactor(0).setDepth(100);

    const backdrop = scene.add.rectangle(0, 0, 900, 468, 0x050008, 0.975);
    backdrop.setStrokeStyle(5, 0xffffff, 0.95);
    const inner = scene.add.rectangle(0, 0, 884, 452, 0x100914, 0.96);
    inner.setStrokeStyle(3, 0xff00c8, 0.82);
    startPanel.add([backdrop, inner]);

    const slash1 = scene.add.rectangle(-235, -177, 300, 14, 0xdfff00, 0.95).setAngle(-3);
    const slash2 = scene.add.rectangle(225, -170, 245, 10, 0xff006e, 0.9).setAngle(4);
    const logo = scene.add.image(0, -178, 'logoWide').setScale(0.62);
    const sub = scene.add.text(0, -128, 'CHOOSE YOUR RAMPAGER', {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 7
    }).setOrigin(0.5);
    const subLine = scene.add.text(0, -102, 'SMASH HARDER  •  RUN FURTHER  •  OWN THE BOARD', {
      fontFamily: 'Arial Black', fontSize: '10px', color: '#dfff00',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);
    startPanel.add([slash1, slash2, logo, sub, subLine]);

    const chars = [
      { key:'gorilla', name:'GORILLA', role:'BALANCED', color:0xff315f, stats:[4,4,4] },
      { key:'croc', name:'CROC', role:'SPEED', color:0xa7ff22, stats:[3,4,5] },
      { key:'cow', name:'COW', role:'TANK', color:0xff4ccf, stats:[5,3,3] },
      { key:'eagle', name:'EAGLE', role:'AIR', color:0x31dfff, stats:[3,3,5] }
    ];

    const makeStat = (x, y, label, amount, color) => {
      const labelText = scene.add.text(x, y, label, {
        fontFamily:'Arial Black', fontSize:'8px', color:'#ffffff', stroke:'#000000', strokeThickness:3
      }).setOrigin(0, 0.5);
      startPanel.add(labelText);
      for (let i=0;i<5;i++) {
        const bar = scene.add.rectangle(x + 53 + i*12, y, 9, 7, i < amount ? color : 0x2a2630, 1);
        bar.setStrokeStyle(1, 0xffffff, i < amount ? 0.55 : 0.16);
        startPanel.add(bar);
      }
    };

    let choosing = false;
    const chooseCharacter = (key, cardBg, portrait) => {
      if (choosing || isStarted) return;
      choosing = true;
      startPanel.list.forEach(obj => {
        if (obj && obj.input && obj.disableInteractive) obj.disableInteractive();
      });
      if (cardBg) cardBg.setFillStyle(0xffffff, 0.18);
      if (portrait) portrait.setScale(key === 'gorilla' ? 0.88 : 0.60);
      scene.time.delayedCall(1, () => startGame(key));
    };

    chars.forEach((ch, i) => {
      const x = -315 + i * 210;
      const cardBg = scene.add.rectangle(x, 30, 184, 235, 0x07070a, 0.98);
      cardBg.setStrokeStyle(4, ch.color, 1);
      const innerCard = scene.add.rectangle(x, 30, 170, 221, 0x16121a, 0.92);
      innerCard.setStrokeStyle(2, 0xffffff, 0.3);

      const portraitBack = scene.add.rectangle(x, -18, 156, 118, ch.color, 0.12);
      portraitBack.setStrokeStyle(2, ch.color, 0.55);
      const portraitBaseScale = ch.key === 'gorilla' ? 0.82 : 0.54;
      const portraitHoverScale = ch.key === 'gorilla' ? 0.86 : 0.57;
      const portrait = scene.add.image(x, -22, `${ch.key}_portrait`).setScale(portraitBaseScale);

      const namePlate = scene.add.rectangle(x, 52, 150, 33, ch.color, 0.96).setAngle(-1.5);
      const name = scene.add.text(x, 51, ch.name, {
        fontFamily:'Arial Black', fontSize:'19px', color:'#080509', stroke:'#ffffff', strokeThickness:1
      }).setOrigin(0.5).setAngle(-1.5);
      const role = scene.add.text(x, 77, ch.role, {
        fontFamily:'Arial Black', fontSize:'10px', color:Phaser.Display.Color.IntegerToColor(ch.color).rgba,
        stroke:'#000000', strokeThickness:4
      }).setOrigin(0.5);

      startPanel.add([cardBg, innerCard, portraitBack, portrait, namePlate, name, role]);
      makeStat(x - 68, 98, 'HEALTH', ch.stats[0], 0x63ff45);
      makeStat(x - 68, 114, 'DAMAGE', ch.stats[1], 0xff3b44);
      makeStat(x - 68, 130, 'SPEED', ch.stats[2], 0x26baff);

      const tap = scene.add.text(x, 155, 'TAP TO RAMPAGE', {
        fontFamily:'Arial Black', fontSize:'9px', color:'#ffffff', stroke:'#000000', strokeThickness:4
      }).setOrigin(0.5);
      startPanel.add(tap);

      cardBg.setInteractive({ useHandCursor:true });
      cardBg.on('pointerdown', () => chooseCharacter(ch.key, cardBg, portrait));
      cardBg.on('pointerover', () => {
        if (choosing) return;
        cardBg.setScale(1.045);
        portrait.setScale(portraitHoverScale);
        cardBg.setFillStyle(ch.color, 0.15);
      });
      cardBg.on('pointerout', () => {
        if (choosing) return;
        cardBg.setScale(1);
        portrait.setScale(portraitBaseScale);
        cardBg.setFillStyle(0x07070a, 0.98);
      });

      scene.tweens.add({
        targets: portrait,
        y: portrait.y - 4,
        duration: 900 + i*100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    const footer = scene.add.text(0, 207, 'BUILD.  SMASH.  RAGE.  REPEAT.', {
      fontFamily:'Arial Black', fontSize:'16px', color:'#ffffff', stroke:'#000000', strokeThickness:6
    }).setOrigin(0.5);
    const rainbow = ['#ff2b45','#ff9d00','#fff200','#58ff37','#00eaff','#8a55ff','#ff20cc'];
    scene.tweens.addCounter({
      from:0,to:rainbow.length-1,duration:1600,repeat:-1,
      onUpdate:t => { if (footer.active) footer.setColor(rainbow[Math.floor(t.getValue()) % rainbow.length]); }
    });
    startPanel.add(footer);

    startPanel.setScale(0.96).setAlpha(0);
    scene.tweens.add({ targets:startPanel, alpha:1, scale:1, duration:320, ease:'Back.easeOut' });
  };
})();
