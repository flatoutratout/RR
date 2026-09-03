(() => {
  // SAFE presentation layer only. Core gameplay/input/spawning stays in remake.js.
  const RR=window.RR2;
  const state={scene:null,nextStreetX:0,lastFx:0,collider:null};
  const JUNK=new Set(['DEGEN','WAGMI','ARMY','AIR','REKT','SEND IT','MOON','100X']);
  const COLORS=[0xff2bd6,0x35e7ff,0xbaff39,0xffb21c];

  function stripOldLabels(s){
    s.children.list.slice().forEach(o=>{
      if(!o||o===s.toast||typeof o.text!=='string')return;
      if(JUNK.has(o.text.trim().toUpperCase()))o.destroy();
    });
  }

  function streetChunk(s,x){
    const floor=RR.floorY,w=520;
    // Thick foreground pavement/platform. Feet sit on floorY; everything below is visual depth.
    s.add.rectangle(x+w/2,floor+34,w,72,0x111018,1).setDepth(-6);
    s.add.rectangle(x+w/2,floor+5,w,14,0x4b4854,1).setDepth(-4);
    s.add.rectangle(x+w/2,floor-1,w,3,0xd7d3df,.78).setDepth(-3);
    s.add.rectangle(x+w/2,floor+13,w,4,0x24212c,1).setDepth(-3);

    for(let j=0;j<5;j++){
      const sx=x+52+j*104;
      s.add.rectangle(sx,floor+27,2,40,0x050407,.76).setDepth(-2);
    }

    const c=COLORS[Math.floor(x/w)%COLORS.length];
    s.add.rectangle(x+135,floor+21,94,3,c,.20).setDepth(-2);
    s.add.rectangle(x+392,floor+22,72,2,c,.14).setDepth(-2);

    // Dark recesses make the deck feel thick, ready for future real gaps/holes.
    for(let j=0;j<3;j++){
      const rx=x+90+j*170;
      s.add.rectangle(rx,floor+52,94,25,0x08080d,1).setStrokeStyle(2,0x24232c,.75).setDepth(-2);
    }
  }

  function ensureStreet(s){
    const ahead=s.player.x+1650;
    while(state.nextStreetX<ahead){streetChunk(s,state.nextStreetX);state.nextStreetX+=520;}
  }

  function ensureBuildingCollision(s){
    // Buildings block the player but are still destroyed by remake.js smash logic.
    if(state.collider||!s.player||!s.buildings)return;
    state.collider=s.physics.add.collider(s.player,s.buildings);
  }

  function attackFx(s){
    const p=s.player;
    if(!p||!p.active||s.time.now-state.lastFx<300)return;
    const key=p.texture&&p.texture.key||'';
    if(!key.endsWith('_smash'))return;
    state.lastFx=s.time.now;
    const dir=p.flipX?-1:1,x=p.x+dir*54,y=p.y-48;
    const c=COLORS[Math.floor(s.time.now/300)%COLORS.length];
    const ring=s.add.circle(x,y,9,c,.08).setStrokeStyle(4,c,.7).setDepth(25);
    s.tweens.add({targets:ring,scale:2.8,alpha:0,duration:170,ease:'Quad.easeOut',onComplete:()=>ring.destroy()});
    for(let i=0;i<5;i++){
      const shard=s.add.rectangle(x,y,Phaser.Math.Between(4,9),3,i%2?0xffffff:c,.9).setDepth(26).setAngle(Phaser.Math.Between(0,180));
      const a=Phaser.Math.FloatBetween(-.8,.8)+(dir<0?Math.PI:0),d=Phaser.Math.Between(34,76);
      s.tweens.add({targets:shard,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,duration:Phaser.Math.Between(130,220),onComplete:()=>shard.destroy()});
    }
  }

  function tick(){
    const g=window.RR2Game;if(!g||!g.scene)return;
    const s=g.scene.getScene('Game');
    if(!s||!s.sys||!s.sys.isActive()||!s.player)return;
    if(state.scene!==s){state.scene=s;state.nextStreetX=0;state.lastFx=0;state.collider=null;}
    stripOldLabels(s);
    ensureBuildingCollision(s);
    ensureStreet(s);
    attackFx(s);
  }

  setInterval(tick,90);
})();