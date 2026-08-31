(() => {
  const COLORS=[0xff2bd6,0x35e7ff,0xbaff39,0xffb21c];
  const state={scene:null,nextX:300,lastFx:0,collider:null};

  function streetChunk(s,x){
    const floor=window.RR2.floorY,seed=Math.floor(x/520),c=COLORS[seed%COLORS.length];
    s.add.rectangle(x,floor+23,118,4,0xffffff,.14).setDepth(-7);
    s.add.rectangle(x+150,floor+23,58,4,0xffffff,.10).setDepth(-7);
    const lampX=x+110;
    s.add.rectangle(lampX,floor-62,4,124,0x17131d,.92).setDepth(1);
    s.add.rectangle(lampX,floor-124,30,5,0x211928,.95).setDepth(1);
    s.add.circle(lampX,floor-124,5,c,.72).setDepth(2);
  }

  function decorateBuilding(s,b){
    if(b.__cleanDecor)return;
    b.__cleanDecor=true;
    const w=Math.max(46,b.displayWidth),h=Math.max(100,b.displayHeight),top=b.y-h,c=COLORS[Math.floor(b.x/180)%COLORS.length];
    const trim=s.add.rectangle(b.x,top+8,w*.62,3,c,.38).setDepth(4);
    const base=s.add.rectangle(b.x,b.y-25,w*.64,4,c,.25).setDepth(4);
    b.__cleanDecorObjects=[trim,base];
  }

  function cleanupDecor(s){
    if(!s.buildings)return;
    const active=new Set(s.buildings.getChildren().filter(b=>b.active));
    s.buildings.getChildren().forEach(b=>decorateBuilding(s,b));
    // Decor is deliberately subtle and attached to buildings; no floating labels or health bars.
    active.forEach(b=>{
      if(b.__cleanDecorObjects)b.__cleanDecorObjects.forEach(o=>{if(o&&o.active){o.x=b.x;}});
    });
  }

  function ensureCollision(s){
    if(state.collider||!s.player||!s.buildings)return;
    state.collider=s.physics.add.collider(s.player,s.buildings);
  }

  function attackFx(s){
    const p=s.player;if(!p||!p.active)return;
    if(s.time.now-state.lastFx<300)return;
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
    if(state.scene!==s){state.scene=s;state.nextX=300;state.lastFx=0;state.collider=null;}
    ensureCollision(s);
    const ahead=s.player.x+1250;
    while(state.nextX<ahead){streetChunk(s,state.nextX);state.nextX+=520;}
    cleanupDecor(s);attackFx(s);
  }
  setInterval(tick,90);
})();