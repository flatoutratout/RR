(() => {
  const COLORS={pink:0xff2bd6,cyan:0x35e7ff,lime:0xbaff39,gold:0xffc82e,orange:0xff7b22,ink:0x07010d};
  const state={scene:null,nextStreetX:0,lastFx:0,collider:null,hudBuilt:false};
  const JUNK=new Set(['DEGEN','WAGMI','ARMY','AIR','REKT','SEND IT','MOON','100X']);

  function stripOldLabels(s){
    s.children.list.slice().forEach(o=>{
      if(!o||o===s.toast||typeof o.text!=='string')return;
      const t=o.text.trim().toUpperCase();
      if(JUNK.has(t))o.destroy();
    });
  }

  function streetChunk(s,x){
    const floor=window.RR2.floorY;
    const width=520;
    // Deep foreground pavement: top slab, kerb and dark structural face.
    s.add.rectangle(x+width/2,floor+31,width,66,0x111018,1).setDepth(-6);
    s.add.rectangle(x+width/2,floor+4,width,12,0x4c4956,1).setDepth(-4);
    s.add.rectangle(x+width/2,floor-1,width,3,0xc7c3cf,.72).setDepth(-3);
    s.add.rectangle(x+width/2,floor+12,width,4,0x24212c,1).setDepth(-3);

    // Large readable paving slabs with wet neon reflections.
    for(let j=0;j<5;j++){
      const sx=x+52+j*104;
      s.add.rectangle(sx,floor+25,2,36,0x050407,.78).setDepth(-2);
    }
    const c=[COLORS.pink,COLORS.cyan,COLORS.lime,COLORS.orange][Math.floor(x/width)%4];
    s.add.rectangle(x+132,floor+18,92,3,c,.24).setDepth(-2);
    s.add.rectangle(x+392,floor+19,70,2,c,.18).setDepth(-2);

    // Recesses in the pavement face make the platform feel thick enough for later gaps/holes.
    for(let j=0;j<3;j++){
      const rx=x+90+j*170;
      s.add.rectangle(rx,floor+47,92,24,0x08080d,1).setStrokeStyle(2,0x24232c,.8).setDepth(-2);
      s.add.rectangle(rx,floor+45,62,2,c,.10).setDepth(-1);
    }
  }

  function ensureStreet(s){
    const ahead=s.player.x+1650;
    while(state.nextStreetX<ahead){streetChunk(s,state.nextStreetX);state.nextStreetX+=520;}
  }

  function ensureCollision(s){
    if(state.collider||!s.player||!s.buildings)return;
    state.collider=s.physics.add.collider(s.player,s.buildings);
  }

  function hideLegacyHud(s){
    ['scoreText','distanceText','healthText','killText','rageFill','rageText'].forEach(k=>{
      if(s[k]&&s[k].setVisible)s[k].setVisible(false);
    });
    s.children.list.forEach(o=>{
      if(!o||o===s.toast||!o.setVisible)return;
      if(o.scrollFactorX===0&&o.depth===100&&typeof o.y==='number'&&o.y<88)o.setVisible(false);
    });
  }

  function hudText(s,x,y,label,value,color){
    const box=s.add.rectangle(x,y,126,58,0x050509,.94).setStrokeStyle(2,color,1).setScrollFactor(0).setDepth(151);
    const l=s.add.text(x,y-17,label,{fontFamily:'Arial Black',fontSize:'10px',color:'#d9d9df'}).setOrigin(.5).setScrollFactor(0).setDepth(152);
    const v=s.add.text(x,y+8,value,{fontFamily:'Arial Black',fontSize:'20px',color:'#ffffff',stroke:'#000',strokeThickness:4}).setOrigin(.5).setScrollFactor(0).setDepth(152);
    return {box,l,v};
  }

  function buildHud(s){
    if(state.hudBuilt)return;
    state.hudBuilt=true;
    hideLegacyHud(s);

    const logoBg=s.add.rectangle(92,39,164,64,0x050509,.96).setStrokeStyle(2,0xffffff,.85).setScrollFactor(0).setDepth(151);
    const logo=s.add.image(92,39,'logo').setScrollFactor(0).setDepth(152);
    const scale=Math.min(142/logo.width,46/logo.height);logo.setScale(scale);

    state.score=hudText(s,245,39,'SCORE','000000',COLORS.cyan);
    state.coins=hudText(s,379,39,'COINS','0',COLORS.gold);
    state.lives=hudText(s,513,39,'LIVES','♥♥♥',COLORS.pink);
    state.distance=hudText(s,647,39,'DISTANCE','0m',COLORS.lime);
    state.heat=hudText(s,781,39,'HEAT','○ ○ ○ ○ ○',COLORS.orange);

    s.add.rectangle(479,85,610,30,0x07010d,.95).setStrokeStyle(2,COLORS.pink,.9).setScrollFactor(0).setDepth(151);
    s.add.rectangle(192,85,94,30,COLORS.pink,1).setScrollFactor(0).setDepth(152);
    s.add.text(192,85,'⚡ RAGE',{fontFamily:'Arial Black',fontSize:'13px',color:'#09040b'}).setOrigin(.5).setScrollFactor(0).setDepth(153);
    state.rageBack=s.add.rectangle(538,85,482,14,0x211826,1).setScrollFactor(0).setDepth(152);
    state.rageBar=s.add.rectangle(297,85,0,12,COLORS.pink,1).setOrigin(0,.5).setScrollFactor(0).setDepth(153);
    state.ragePct=s.add.text(790,85,'0%',{fontFamily:'Arial Black',fontSize:'11px',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(154);

    state.missionBg=s.add.rectangle(804,140,278,70,0x050806,.94).setStrokeStyle(3,COLORS.lime,.95).setScrollFactor(0).setDepth(151);
    state.missionTitle=s.add.text(682,118,`${s.stats.name.toUpperCase()} MISSION`,{fontFamily:'Arial Black',fontSize:'10px',color:'#baff39'}).setScrollFactor(0).setDepth(152);
    state.missionText=s.add.text(682,137,'Destroy buildings',{fontFamily:'Arial Black',fontSize:'14px',color:'#fff'}).setScrollFactor(0).setDepth(152);
    state.missionCount=s.add.text(682,157,'0/25',{fontFamily:'Arial Black',fontSize:'12px',color:'#fff'}).setScrollFactor(0).setDepth(152);
    state.mult=s.add.text(913,139,'x1.0',{fontFamily:'Arial Black',fontSize:'24px',color:'#baff39'}).setOrigin(.5).setScrollFactor(0).setDepth(152);

    // Tiny gameplay hint bar, matching the target without swallowing the screen.
    s.add.rectangle(480,518,430,24,0x050509,.82).setStrokeStyle(1,0xffffff,.3).setScrollFactor(0).setDepth(149);
    s.add.text(480,518,'SMASH BUILDINGS   •   COLLECT COINS   •   JUMP OBSTACLES',{fontFamily:'Arial Black',fontSize:'9px',color:'#eeeeee'}).setOrigin(.5).setScrollFactor(0).setDepth(150);
  }

  function updateHud(s){
    if(!state.hudBuilt)return;
    const hp=Math.max(0,s.health||0);
    state.score.v.setText(String(Math.floor(s.score||0)).padStart(6,'0'));
    state.coins.v.setText(String(s.coins||0));
    state.lives.v.setText('♥'.repeat(hp));
    state.distance.v.setText(`${Math.max(0,Math.floor((s.player.x-135)/10))}m`);
    const heat=Math.min(5,Math.floor((s.destroyed||0)/4));
    state.heat.v.setText('● '.repeat(heat)+'○ '.repeat(5-heat));
    const active=s.rageUntil>s.time.now;
    const rage=active?100:(s.rage||0);
    state.rageBar.width=482*Math.max(0,Math.min(1,rage/100));
    state.rageBar.fillColor=active?COLORS.lime:COLORS.pink;
    state.ragePct.setText(active?`${Math.max(0,(s.rageUntil-s.time.now)/1000).toFixed(1)}s`:`${Math.floor(rage)}%`);
    const smashed=s.destroyed||0;
    state.missionCount.setText(`${Math.min(smashed,25)}/25`);
    const mult=1+Math.min(.5,smashed*.02);
    state.mult.setText(`x${mult.toFixed(1)}`);
  }

  function attackFx(s){
    const p=s.player;if(!p||!p.active||s.time.now-state.lastFx<280)return;
    const key=p.texture&&p.texture.key||'';if(!key.endsWith('_smash'))return;
    state.lastFx=s.time.now;
    const dir=p.flipX?-1:1,x=p.x+dir*55,y=p.y-50;
    const c=[COLORS.pink,COLORS.cyan,COLORS.gold,COLORS.lime][Math.floor(s.time.now/280)%4];
    const ring=s.add.circle(x,y,10,c,.10).setStrokeStyle(4,c,.78).setDepth(25);
    s.tweens.add({targets:ring,scale:3,alpha:0,duration:180,ease:'Quad.easeOut',onComplete:()=>ring.destroy()});
    for(let i=0;i<7;i++){
      const shard=s.add.rectangle(x,y,Phaser.Math.Between(4,10),3,i%2?0xffffff:c,.95).setDepth(26).setAngle(Phaser.Math.Between(0,180));
      const a=Phaser.Math.FloatBetween(-.9,.9)+(dir<0?Math.PI:0),d=Phaser.Math.Between(38,86);
      s.tweens.add({targets:shard,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,duration:Phaser.Math.Between(130,230),onComplete:()=>shard.destroy()});
    }
  }

  function tick(){
    const g=window.RR2Game;if(!g||!g.scene)return;
    const s=g.scene.getScene('Game');if(!s||!s.sys||!s.sys.isActive()||!s.player)return;
    if(state.scene!==s){
      state.scene=s;state.nextStreetX=0;state.lastFx=0;state.collider=null;state.hudBuilt=false;
      ['score','coins','lives','distance','heat','rageBack','rageBar','ragePct','missionBg','missionTitle','missionText','missionCount','mult'].forEach(k=>delete state[k]);
    }
    stripOldLabels(s);ensureCollision(s);ensureStreet(s);buildHud(s);updateHud(s);attackFx(s);
  }
  setInterval(tick,80);
})();