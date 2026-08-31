(() => {
  const COLORS=[0xff2bd6,0x35e7ff,0xbaff39,0xffb21c];
  const state={scene:null,nextX:0,lastFx:0,collider:null};
  const JUNK=new Set(['DEGEN','WAGMI','ARMY','AIR','REKT','SEND IT','MOON','100X']);

  function streetChunk(s,x){
    const floor=window.RR2.floorY;
    // Deep, clearly visible pavement/road deck under the gameplay plane.
    s.add.rectangle(x+260,floor+26,520,62,0x17131d,.98).setDepth(-6);
    s.add.rectangle(x+260,floor+2,520,8,0x8d8498,.95).setDepth(-5);
    s.add.rectangle(x+260,floor+7,520,3,0xffffff,.25).setDepth(-4);
    // Slab joints and subtle neon reflection keep it readable without clutter.
    for(let j=0;j<5;j++)s.add.rectangle(x+52+j*104,floor+27,2,50,0x050407,.55).setDepth(-4);
    const c=COLORS[Math.floor(x/520)%COLORS.length];
    s.add.rectangle(x+125,floor+43,82,3,c,.20).setDepth(-3);
    s.add.rectangle(x+385,floor+43,82,3,c,.14).setDepth(-3);
  }

  function removeLabels(s){
    s.children.list.slice().forEach(o=>{
      if(!o||o===s.toast||typeof o.text!=='string')return;
      const t=o.text.trim().toUpperCase();
      if(JUNK.has(t))o.destroy();
    });
  }

  function ensureCollision(s){
    if(state.collider||!s.player||!s.buildings)return;
    state.collider=s.physics.add.collider(s.player,s.buildings);
  }

  function attackFx(s){
    const p=s.player;if(!p||!p.active||s.time.now-state.lastFx<300)return;
    const key=p.texture&&p.texture.key||'';if(!key.endsWith('_smash'))return;
    state.lastFx=s.time.now;
    const dir=p.flipX?-1:1,x=p.x+dir*55,y=p.y-50,c=COLORS[Math.floor(s.time.now/300)%COLORS.length];
    const ring=s.add.circle(x,y,10,c,.10).setStrokeStyle(4,c,.72).setDepth(25);
    s.tweens.add({targets:ring,scale:2.7,alpha:0,duration:170,ease:'Quad.easeOut',onComplete:()=>ring.destroy()});
    for(let i=0;i<5;i++){
      const shard=s.add.rectangle(x,y,Phaser.Math.Between(4,9),3,i%2?0xffffff:c,.9).setDepth(26).setAngle(Phaser.Math.Between(0,180));
      const a=Phaser.Math.FloatBetween(-.8,.8)+(dir<0?Math.PI:0),d=Phaser.Math.Between(35,75);
      s.tweens.add({targets:shard,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,duration:Phaser.Math.Between(130,220),onComplete:()=>shard.destroy()});
    }
  }

  function tick(){
    const g=window.RR2Game;if(!g||!g.scene)return;
    const s=g.scene.getScene('Game');if(!s||!s.sys||!s.sys.isActive()||!s.player)return;
    if(state.scene!==s){state.scene=s;state.nextX=0;state.lastFx=0;state.collider=null;}
    ensureCollision(s);removeLabels(s);
    const ahead=s.player.x+1450;
    while(state.nextX<ahead){streetChunk(s,state.nextX);state.nextX+=520;}
    attackFx(s);
  }
  setInterval(tick,90);
})();