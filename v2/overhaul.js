(() => {
  const COLORS=[0xff2bd6,0x35e7ff,0xbaff39,0xffb21c,0x9b5cff];
  const SIGNS=['WAGMI','SEND IT','RAMPAGE','MOON','DEGEN','NGMI?','100X','REKT'];
  const state={scene:null,nextX:220,lastFx:0,enemyFx:new WeakMap(),lastScore:0};
  const floor=()=>window.RR2.floorY;

  function fadeDestroy(s,o,ms=300){s.tweens.add({targets:o,alpha:0,duration:ms,onComplete:()=>o.destroy()});}
  function neonText(s,x,y,text,c,size=14,depth=5){return s.add.text(x,y,text,{fontFamily:'Arial Black',fontSize:`${size}px`,color:'#fff',stroke:Phaser.Display.Color.IntegerToColor(c).rgba,strokeThickness:2}).setOrigin(.5).setDepth(depth);}

  function addStreetChunk(s,x){
    const f=floor(),seed=Math.floor(x/360),c=COLORS[seed%COLORS.length];
    s.add.rectangle(x,f+21,118,4,0xffffff,.18).setDepth(-7);
    s.add.rectangle(x+150,f+21,54,4,c,.20).setDepth(-7);
    const poleX=x+(seed%2?118:-118);
    s.add.rectangle(poleX,f-72,5,142,0x17111e,.96).setDepth(1);
    s.add.rectangle(poleX,f-143,44,6,0x2a1930,.98).setDepth(1);
    const glow=s.add.circle(poleX,f-143,9,c,.82).setDepth(2);
    s.tweens.add({targets:glow,alpha:.35,duration:500+seed%4*110,yoyo:true,repeat:-1});
    if(seed%2===0){
      const sign=s.add.container(x+Phaser.Math.Between(-32,32),f-Phaser.Math.Between(172,238)).setDepth(4);
      sign.add(s.add.rectangle(0,0,Phaser.Math.Between(84,120),34,0x08030d,.95).setStrokeStyle(3,c,1));
      sign.add(neonText(s,0,0,SIGNS[seed%SIGNS.length],c,15,0));
      s.tweens.add({targets:sign,alpha:.58,duration:380+seed%4*100,yoyo:true,repeat:-1});
    }
    if(seed%3===0){
      s.add.rectangle(x+70,f-18,27,37,0x17131d,.98).setStrokeStyle(2,0x73677d).setDepth(5);
      s.add.rectangle(x+70,f-39,31,5,c,.55).setDepth(6);
    }
    if(seed%4===1){
      const cone=s.add.triangle(x-62,f-18,0,34,14,0,28,34,0xff8a18,.9).setDepth(5);
      s.add.rectangle(cone.x,cone.y+7,20,3,0xffffff,.8).setDepth(6);
    }
  }

  function decorateBuilding(s,b){
    if(b.__rrDecorated)return;b.__rrDecorated=true;
    const w=Math.max(48,b.displayWidth),h=Math.max(100,b.displayHeight),top=b.y-h,c=COLORS[Math.floor(b.x/100)%COLORS.length];
    const trim=s.add.rectangle(b.x,top+6,w*.78,5,c,.76).setDepth(4);
    const awning=s.add.rectangle(b.x,b.y-35,w*.72,8,c,.5).setDepth(4);
    const label=neonText(s,b.x,b.y-h*.57,SIGNS[Math.floor(b.x/170)%SIGNS.length],c,Math.max(9,Math.min(14,w*.11)),5).setAlpha(.85);
    const roof=s.add.rectangle(b.x,top-3,w*.45,5,0x17111f,.95).setDepth(4);
    b.__rrDecor=[trim,awning,label,roof];
    b.once('destroy',()=>b.__rrDecor&&b.__rrDecor.forEach(o=>o&&o.destroy()));
  }

  function decorateEnemy(s,e,type){
    if(e.__rrJuiced)return;e.__rrJuiced=true;e.__rrType=type;e.__rrStartHp=e.hp||2;
    const c=type==='tank'?0xffb21c:0x35e7ff;
    e.setScale(e.scaleX*1.12,e.scaleY*1.12);
    const shadow=s.add.ellipse(e.x,type==='tank'?floor()+2:e.y+34,type==='tank'?100:92,13,0x000000,.34).setDepth(type==='tank'?5:6);
    const badge=neonText(s,e.x,type==='tank'?e.y-62:e.y-48,type==='tank'?'ARMY':'AIR',c,9,9).setAlpha(.7);
    e.__rrExtras=[shadow,badge];
    e.once('destroy',()=>e.__rrExtras&&e.__rrExtras.forEach(o=>o&&o.destroy()));
  }

  function syncEnemies(s){
    [['tanks','tank'],['choppers','chopper']].forEach(([group,type])=>{
      if(!s[group])return;
      s[group].getChildren().forEach(e=>{
        if(!e.active)return;decorateEnemy(s,e,type);
        if(e.__rrExtras){e.__rrExtras[0].x=e.x;e.__rrExtras[0].y=type==='tank'?floor()+2:e.y+34;e.__rrExtras[1].setPosition(e.x,type==='tank'?e.y-62:e.y-48);}
        const prev=state.enemyFx.get(e);
        if(prev!==undefined&&e.hp<prev)damageFx(s,e,type);
        state.enemyFx.set(e,e.hp);
      });
    });
  }

  function damageFx(s,e,type){
    const c=type==='tank'?0xffb21c:0x35e7ff;
    for(let i=0;i<9;i++){
      const p=s.add.rectangle(e.x,e.y,Phaser.Math.Between(3,8),Phaser.Math.Between(2,5),i%3?c:0xffffff).setDepth(28).setAngle(Phaser.Math.Between(0,180));
      const a=Phaser.Math.FloatBetween(-Math.PI,Math.PI),d=Phaser.Math.Between(28,75);
      s.tweens.add({targets:p,x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d,alpha:0,duration:Phaser.Math.Between(180,330),onComplete:()=>p.destroy()});
    }
    const flash=s.add.circle(e.x,e.y,18,0xffffff,.65).setDepth(27);s.tweens.add({targets:flash,scale:2.3,alpha:0,duration:120,onComplete:()=>flash.destroy()});
  }

  function attackFx(s){
    const p=s.player;if(!p||!p.active||s.time.now-state.lastFx<285)return;
    const key=p.texture&&p.texture.key||'';if(!key.endsWith('_smash'))return;state.lastFx=s.time.now;
    const dir=p.flipX?-1:1,x=p.x+dir*58,y=p.y-54,c=COLORS[Math.floor(s.time.now/300)%COLORS.length];
    const labels={gorilla:'KAPOW!',croc:'CHOMP!',cow:'BONK!',eagle:'SLASH!'};
    const ring=s.add.circle(x,y,12,c,.12).setStrokeStyle(6,c,.95).setDepth(25);
    s.tweens.add({targets:ring,scale:4.1,alpha:0,duration:210,ease:'Quad.easeOut',onComplete:()=>ring.destroy()});
    const word=neonText(s,x+dir*18,y-36,labels[s.character]||'SMASH!',c,15,29).setAngle(Phaser.Math.Between(-8,8));
    s.tweens.add({targets:word,y:word.y-28,scale:1.35,alpha:0,duration:330,ease:'Quad.easeOut',onComplete:()=>word.destroy()});
    for(let i=0;i<12;i++){
      const shard=s.add.rectangle(x,y,Phaser.Math.Between(5,13),Phaser.Math.Between(2,6),i%3?c:0xffffff).setDepth(26).setAngle(Phaser.Math.Between(0,180));
      const a=Phaser.Math.FloatBetween(-1.25,1.25)+(dir<0?Math.PI:0),d=Phaser.Math.Between(48,118);
      s.tweens.add({targets:shard,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,angle:shard.angle+180,alpha:0,duration:Phaser.Math.Between(170,300),onComplete:()=>shard.destroy()});
    }
  }

  function scorePop(s){
    if(s.score<=state.lastScore)return;
    const gain=Math.floor(s.score-state.lastScore);state.lastScore=s.score;
    if(gain<35)return;
    const t=neonText(s,s.player.x+Phaser.Math.Between(30,80),s.player.y-125,`+${gain}`,0xbaff39,13,30);
    s.tweens.add({targets:t,y:t.y-35,alpha:0,duration:520,onComplete:()=>t.destroy()});
  }

  function tick(){
    const g=window.RR2Game;if(!g||!g.scene)return;
    const s=g.scene.getScene('Game');if(!s||!s.sys||!s.sys.isActive()||!s.player)return;
    if(state.scene!==s){state.scene=s;state.nextX=220;state.lastFx=0;state.lastScore=s.score||0;state.enemyFx=new WeakMap();}
    const ahead=s.player.x+1400;while(state.nextX<ahead){addStreetChunk(s,state.nextX);state.nextX+=360;}
    if(s.buildings)s.buildings.getChildren().forEach(b=>decorateBuilding(s,b));
    syncEnemies(s);attackFx(s);scorePop(s);
  }
  setInterval(tick,70);
})();