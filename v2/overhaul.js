(() => {
  const COLORS=[0xff2bd6,0x35e7ff,0xbaff39,0xffb21c,0x9b5cff];
  const SIGNS=['WAGMI','SEND IT','RAMPAGE','MOON','DEGEN','NGMI?','100X','REKT'];
  const state={scene:null,nextX:250,lastFx:0};

  function addStreetChunk(s,x){
    const floor=window.RR2.floorY;
    const seed=Math.floor(x/420);
    const side=seed%2?1:-1;
    const lampX=x+side*105;
    const pole=s.add.rectangle(lampX,floor-72,5,142,0x16111d,.95).setDepth(1);
    s.add.rectangle(lampX,floor-143,38,7,0x24162c,.95).setDepth(1);
    s.add.circle(lampX,floor-142,7,COLORS[seed%COLORS.length],.9).setDepth(2);
    s.add.rectangle(x,floor+22,112,4,0xffffff,.16).setDepth(-7);
    s.add.rectangle(x+128,floor+22,48,4,0xffffff,.12).setDepth(-7);

    if(seed%2===0){
      const sign=s.add.container(x+Phaser.Math.Between(-35,35),floor-Phaser.Math.Between(170,235)).setDepth(4);
      const c=COLORS[(seed+2)%COLORS.length];
      sign.add(s.add.rectangle(0,0,Phaser.Math.Between(76,112),32,0x08030d,.94).setStrokeStyle(3,c,1));
      sign.add(s.add.text(0,0,SIGNS[seed%SIGNS.length],{fontFamily:'Arial Black',fontSize:'15px',color:'#ffffff',stroke:'#000000',strokeThickness:4}).setOrigin(.5));
      s.tweens.add({targets:sign,alpha:.62,duration:420+seed%4*90,yoyo:true,repeat:-1});
    }

    if(seed%3===0){
      const bin=s.add.container(x+70,floor-20).setDepth(5);
      bin.add(s.add.rectangle(0,0,25,36,0x17131d,.96).setStrokeStyle(2,0x6b6173));
      bin.add(s.add.rectangle(0,-20,30,5,0x2d2535));
    }
  }

  function decorateBuilding(s,b){
    if(b.__rrDecorated)return;b.__rrDecorated=true;
    const w=Math.max(48,b.displayWidth),h=Math.max(100,b.displayHeight),top=b.y-h;
    const c=COLORS[Math.floor(b.x/100)%COLORS.length];
    const trim=s.add.rectangle(b.x,top+5,w*.72,4,c,.72).setDepth(4);
    const awning=s.add.rectangle(b.x,b.y-34,w*.68,7,c,.46).setDepth(4);
    const label=s.add.text(b.x,b.y-h*.57,SIGNS[Math.floor(b.x/170)%SIGNS.length],{fontFamily:'Arial Black',fontSize:`${Math.max(9,Math.min(14,w*.11))}px`,color:'#ffffff',stroke:'#000',strokeThickness:4}).setOrigin(.5).setDepth(5).setAlpha(.82);
    b.__rrDecor=[trim,awning,label];
    b.once('destroy',()=>b.__rrDecor&&b.__rrDecor.forEach(o=>o&&o.destroy()));
  }

  function attackFx(s){
    const p=s.player;if(!p||!p.active)return;
    if(s.time.now-state.lastFx<300)return;
    const key=p.texture&&p.texture.key||'';
    if(!key.endsWith('_smash'))return;
    state.lastFx=s.time.now;
    const dir=p.flipX?-1:1,x=p.x+dir*58,y=p.y-54;
    const c=COLORS[Math.floor(s.time.now/300)%COLORS.length];
    const ring=s.add.circle(x,y,12,c,.16).setStrokeStyle(5,c,.9).setDepth(25);
    s.tweens.add({targets:ring,scale:3.4,alpha:0,duration:190,ease:'Quad.easeOut',onComplete:()=>ring.destroy()});
    for(let i=0;i<8;i++){
      const shard=s.add.rectangle(x,y,Phaser.Math.Between(5,12),Phaser.Math.Between(2,5),i%2?0xffffff:c).setDepth(26).setAngle(Phaser.Math.Between(0,180));
      const a=Phaser.Math.FloatBetween(-1.1,1.1)+(dir<0?Math.PI:0),d=Phaser.Math.Between(45,105);
      s.tweens.add({targets:shard,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,duration:Phaser.Math.Between(150,270),onComplete:()=>shard.destroy()});
    }
  }

  function tick(){
    const g=window.RR2Game;if(!g||!g.scene)return;
    const s=g.scene.getScene('Game');if(!s||!s.sys||!s.sys.isActive()||!s.player)return;
    if(state.scene!==s){state.scene=s;state.nextX=250;state.lastFx=0;}
    const ahead=s.player.x+1250;
    while(state.nextX<ahead){addStreetChunk(s,state.nextX);state.nextX+=420;}
    if(s.buildings&&s.buildings.getChildren)s.buildings.getChildren().forEach(b=>decorateBuilding(s,b));
    attackFx(s);
  }
  setInterval(tick,90);
})();