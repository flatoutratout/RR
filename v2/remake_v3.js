(() => {
  const RR=window.RR2,P=RR.palette;
  const ctl={left:false,right:false,jump:false,smash:false};
  const fitH=(o,h)=>{o.setScale(h/o.height);return o;};
  const fitIn=(o,w,h)=>{o.setScale(Math.min(w/o.width,h/o.height));return o;};

  class Boot extends Phaser.Scene{
    constructor(){super('Boot');}
    preload(){
      const r=RR.assetRoot;
      ['sky','logo-wide','building','tank','chopper','coin','bullet','neon_overlay'].forEach(n=>this.load.image(n==='logo-wide'?'logo':n,`${r}${n}.png`));
      Object.keys(RR.characters).forEach(id=>{
        this.load.image(`${id}_portrait`,`${r}portraits/${id}.png`);
        ['idle','run1','run2','jump','smash'].forEach(f=>this.load.image(`${id}_${f}`,`${r}sprites/${id}_${f}.png`));
      });
    }
    create(){this.scene.start('Select');}
  }

  class Select extends Phaser.Scene{
    constructor(){super('Select');this.selected='gorilla';}
    create(){
      fitIn(this.add.image(RR.width/2,RR.height/2,'sky').setAlpha(.62),RR.width,RR.height);
      this.add.rectangle(RR.width/2,RR.height/2,RR.width,RR.height,0x050008,.40);
      fitIn(this.add.image(RR.width/2,67,'logo'),330,90);
      this.add.text(RR.width/2,123,'CHOOSE YOUR RAMPAGER',{fontFamily:'Arial Black',fontSize:'23px',color:'#fff',stroke:'#050008',strokeThickness:7}).setOrigin(.5);
      const ids=Object.keys(RR.characters),gap=184,start=RR.width/2-gap*(ids.length-1)/2;this.cards=[];
      ids.forEach((id,i)=>{
        const c=this.add.container(start+i*gap,286),bg=this.add.rectangle(0,0,164,230,0x0c0612,.95).setStrokeStyle(4,0xffffff);
        const p=fitIn(this.add.image(0,-42,`${id}_portrait`),144,126);
        const name=this.add.text(0,49,RR.characters[id].name,{fontFamily:'Arial Black',fontSize:'18px',color:'#fff',stroke:'#000',strokeThickness:5}).setOrigin(.5);
        const desc=this.add.text(0,78,RR.characters[id].blurb,{fontFamily:'Arial',fontStyle:'bold',fontSize:'11px',color:'#d9ccdf',align:'center',wordWrap:{width:138}}).setOrigin(.5,0);
        c.add([bg,p,name,desc]).setSize(164,230).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.choose(id));this.cards.push({id,c,bg});
      });
      this.stats=this.add.text(RR.width/2,430,'',{fontFamily:'Arial Black',fontSize:'15px',color:'#baff39',stroke:'#000',strokeThickness:5}).setOrigin(.5);this.choose(this.selected);
      const go=this.add.rectangle(RR.width/2,487,270,56,P.pink).setStrokeStyle(4,0xffffff).setInteractive({useHandCursor:true});
      this.add.text(RR.width/2,487,'START RAMPAGE',{fontFamily:'Arial Black',fontSize:'24px',color:'#fff',stroke:'#000',strokeThickness:6}).setOrigin(.5);
      go.on('pointerdown',()=>this.scene.start('Game',{character:this.selected}));this.input.keyboard.on('keydown-ENTER',()=>this.scene.start('Game',{character:this.selected}));
    }
    choose(id){this.selected=id;this.cards.forEach(x=>{const on=x.id===id;x.bg.setStrokeStyle(on?6:4,on?P.lime:0xffffff);x.c.setScale(on?1.05:1);});const s=RR.characters[id];this.stats.setText(`HP ${s.hp}   •   SPEED ${Math.round(s.speed/2.7)}   •   JUMP ${Math.round(s.jump/6)}   •   RAGE ${Math.round(s.rageGain*100)}`);}
  }

  class Game extends Phaser.Scene{
    constructor(){super('Game');}
    init(d){this.character=d.character||'gorilla';}
    create(){
      this.stats=RR.characters[this.character];Object.assign(this,{score:0,destroyed:0,coins:0,health:this.stats.hp,rage:0,rageUntil:0,lastSmash:-9999,nextSpawn:590,gameOver:false,runFrame:1,runAt:0});
      this.physics.world.setBounds(0,0,RR.worldWidth,RR.height);this.physics.world.gravity.y=1050;
      this.backdrop();this.groups();this.playerSetup();this.inputSetup();this.hud();this.spawnTo(2200);
      this.cameras.main.setBounds(0,0,RR.worldWidth,RR.height).startFollow(this.player,true,.1,.1,-235,0).setDeadzone(250,110).fadeIn(200,4,0,8);
    }

    backdrop(){
      this.sky=this.add.tileSprite(0,0,RR.width,RR.height,'sky').setOrigin(0).setScrollFactor(0).setDepth(-50).setDisplaySize(RR.width,RR.height);
      this.neon=fitIn(this.add.image(RR.width/2,RR.height/2,'neon_overlay').setScrollFactor(0).setDepth(-35).setAlpha(.08),RR.width,RR.height);
      const g=this.add.graphics().setScrollFactor(0).setDepth(-5),y=RR.floorY;
      // top walking surface
      g.fillStyle(0x26232c,1).fillRect(0,y-8,RR.width,14);
      g.fillStyle(0x8d8994,.95).fillRect(0,y-8,RR.width,3);
      g.fillStyle(0x17151d,1).fillRect(0,y+6,RR.width,38);
      // kerb/front face
      g.fillStyle(0x0a0a0f,1).fillRect(0,y+44,RR.width,42);
      g.fillStyle(0x35313d,.75).fillRect(0,y+42,RR.width,4);
      // pavement slab joints
      g.lineStyle(2,0x0b0a0f,.75);for(let x=0;x<RR.width;x+=112)g.lineBetween(x,y+7,x,y+43);
      g.lineStyle(1,0x4e4958,.35);g.lineBetween(0,y+24,RR.width,y+24);
      // drainage / service recesses
      for(let x=45;x<RR.width;x+=190){g.fillStyle(0x050507,1).fillRoundedRect(x,y+53,112,23,3);g.lineStyle(2,0x24212c,.9).strokeRoundedRect(x,y+53,112,23,3);}
      // restrained wet-neon reflections
      const cs=[0xff2bd6,0x35e7ff,0xbaff39];for(let x=70,i=0;x<RR.width;x+=220,i++){g.fillStyle(cs[i%3],.12).fillRect(x,y+17,68,3);}
      this.ground=this.add.rectangle(RR.worldWidth/2,y+35,RR.worldWidth,70,0,0);this.physics.add.existing(this.ground,true);
    }

    groups(){this.buildings=this.physics.add.staticGroup();this.tanks=this.physics.add.group({allowGravity:false});this.choppers=this.physics.add.group({allowGravity:false});this.bullets=this.physics.add.group({allowGravity:false});this.pickups=this.physics.add.group({allowGravity:false});}
    body(s,wr,hr,xr,yr){s.body.setSize(s.width*wr,s.height*hr,false);s.body.setOffset(s.width*xr,s.height*yr);}
    charFrame(f='idle'){const k=`${this.character}_${f}`;if(this.player.texture.key!==k)this.player.setTexture(k);fitH(this.player,126*this.stats.scale);this.body(this.player,.50,.76,.25,.20);}
    playerSetup(){
      this.player=this.physics.add.sprite(145,RR.floorY,`${this.character}_idle`).setOrigin(.5,1).setDepth(10);this.charFrame();this.player.setCollideWorldBounds(true);this.player.invulnerableUntil=0;
      this.physics.add.collider(this.player,this.ground);this.physics.add.collider(this.player,this.buildings);this.physics.add.overlap(this.player,this.bullets,(_,b)=>this.hitByBullet(b));this.physics.add.overlap(this.player,this.pickups,(_,c)=>this.coin(c));this.physics.add.overlap(this.player,this.tanks,(_,e)=>this.bodyHit(e));this.physics.add.overlap(this.player,this.choppers,(_,e)=>this.bodyHit(e));
    }

    inputSetup(){
      this.keys=this.input.keyboard.addKeys({left:'A',right:'D',left2:'LEFT',right2:'RIGHT',jump:'W',jump2:'UP',smash:'SPACE',smash2:'E',smash3:'F'});
      document.querySelectorAll('#mobile-controls button').forEach(btn=>{if(btn.dataset.rrV3==='1')return;btn.dataset.rrV3='1';const k=btn.dataset.control;const down=e=>{e.preventDefault();ctl[k]=true;btn.classList.add('active');};const up=e=>{e.preventDefault();if(k==='left'||k==='right')ctl[k]=false;btn.classList.remove('active');};btn.addEventListener('pointerdown',down,{passive:false});['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,up,{passive:false}));});
    }

    fixed(o){return o.setScrollFactor(0).setDepth(100);}
    box(x,w,label,color){this.fixed(this.add.rectangle(x,34,w,50,0x050509,.91).setStrokeStyle(2,color,.88));this.fixed(this.add.text(x,19,label,{fontFamily:'Arial Black',fontSize:'9px',color:'#cfcbd4'}).setOrigin(.5));return this.fixed(this.add.text(x,41,'',{fontFamily:'Arial Black',fontSize:'17px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(.5));}
    hud(){
      this.fixed(this.add.rectangle(67,34,116,50,0x050509,.91).setStrokeStyle(2,0xffffff,.7));this.fixed(fitIn(this.add.image(67,34,'logo'),100,34));
      this.scoreText=this.box(188,112,'SCORE',P.cyan);this.coinText=this.box(305,104,'COINS',0xffcc35);this.healthText=this.box(420,112,'LIVES',P.pink);this.distanceText=this.box(540,116,'DISTANCE',P.lime);this.heatText=this.box(662,116,'HEAT',P.orange);
      this.fixed(this.add.rectangle(480,75,520,22,0x08060c,.91).setStrokeStyle(2,P.pink,.75));this.fixed(this.add.text(205,75,'RAGE',{fontFamily:'Arial Black',fontSize:'11px',color:'#ff2bd6'}).setOrigin(.5));this.rageFill=this.fixed(this.add.rectangle(247,75,0,8,P.pink).setOrigin(0,.5));this.rageText=this.fixed(this.add.text(742,75,'0%',{fontFamily:'Arial Black',fontSize:'10px',color:'#fff'}).setOrigin(.5));
      this.fixed(this.add.rectangle(820,116,245,58,0x050806,.88).setStrokeStyle(2,P.lime,.85));this.fixed(this.add.text(710,97,`${this.stats.name.toUpperCase()} MISSION`,{fontFamily:'Arial Black',fontSize:'9px',color:'#baff39'}));this.fixed(this.add.text(710,115,'Destroy buildings',{fontFamily:'Arial Black',fontSize:'12px',color:'#fff'}));this.missionCount=this.fixed(this.add.text(710,135,'0 / 25',{fontFamily:'Arial Black',fontSize:'10px',color:'#fff'}));
      this.toast=this.fixed(this.add.text(480,112,'',{fontFamily:'Arial Black',fontSize:'24px',color:'#fff',stroke:'#000',strokeThickness:7}).setOrigin(.5).setAlpha(0));this.updateHUD();
    }

    spawnTo(limit){while(this.nextSpawn<limit&&this.nextSpawn<RR.worldWidth-700){const x=this.nextSpawn,r=Phaser.Math.Between(0,99);if(r<55)this.spawnBuilding(x);else if(r<80)this.spawnTank(x);else this.spawnChopper(x);if(Phaser.Math.Between(0,99)<40)this.spawnCoin(x+Phaser.Math.Between(30,90),Phaser.Math.Between(335,410));this.nextSpawn+=Phaser.Math.Between(250,355);}}
    spawnBuilding(x){const h=Phaser.Math.Between(120,175),w=Phaser.Math.Between(90,125),b=this.buildings.create(x,RR.floorY,'building').setOrigin(.5,1).setDepth(4);b.setDisplaySize(w,h);b.refreshBody();b.body.setSize(b.width*.86,b.height*.90,false).setOffset(b.width*.07,b.height*.10);b.hp=Phaser.Math.Between(1,3);b.scoreValue=50+b.hp*30;b.rageValue=12+b.hp*5;b.setTint([0xffffff,0xf3e8ff,0xe8fbff,0xffefcf][Phaser.Math.Between(0,3)]);}
    spawnTank(x){const t=this.tanks.create(x,RR.floorY-1,'tank').setOrigin(.5,1).setDepth(7);fitH(t,42);this.body(t,.82,.66,.09,.24);t.hp=2;t.scoreValue=115;t.lastShot=0;t.setVelocityX(-28);}
    spawnChopper(x){const y=Phaser.Math.Between(245,315),c=this.choppers.create(x,y,'chopper').setDepth(7);fitH(c,50);this.body(c,.75,.56,.12,.22);c.hp=2;c.scoreValue=145;c.lastShot=0;c.baseY=y;c.phase=Math.random()*6.28;c.setVelocityX(-24);}
    spawnCoin(x,y){const c=this.pickups.create(x,y,'coin').setDepth(5);fitH(c,25);c.body.setCircle(c.width*.32,c.width*.18,c.height*.18);c.spin=Phaser.Math.FloatBetween(-2.5,2.5);}

    update(time){if(this.gameOver)return;this.move(time);this.animate(time);this.enemies(time);this.cleanup();this.spawnTo(this.player.x+1800);this.updateHUD();this.sky.tilePositionX=this.cameras.main.scrollX*.05;if(this.rageUntil&&time>this.rageUntil)this.endRage();}
    move(time){const l=this.keys.left.isDown||this.keys.left2.isDown||ctl.left,r=this.keys.right.isDown||this.keys.right2.isDown||ctl.right,spd=this.stats.speed*(this.rageUntil>time?1.2:1);if(l&&!r)this.player.setVelocityX(-spd).setFlipX(true);else if(r&&!l)this.player.setVelocityX(spd).setFlipX(false);else this.player.setVelocityX(0);const jump=Phaser.Input.Keyboard.JustDown(this.keys.jump)||Phaser.Input.Keyboard.JustDown(this.keys.jump2)||ctl.jump;if(jump&&this.player.body.blocked.down){this.player.setVelocityY(-this.stats.jump);ctl.jump=false;}const smash=Phaser.Input.Keyboard.JustDown(this.keys.smash)||Phaser.Input.Keyboard.JustDown(this.keys.smash2)||Phaser.Input.Keyboard.JustDown(this.keys.smash3)||ctl.smash;if(smash&&time-this.lastSmash>260){ctl.smash=false;this.smash(time);}}
    animate(time){let f='idle';if(time-this.lastSmash<220)f='smash';else if(!this.player.body.blocked.down)f='jump';else if(Math.abs(this.player.body.velocity.x)>10){if(time>this.runAt){this.runAt=time+115;this.runFrame=this.runFrame===1?2:1;}f=`run${this.runFrame}`;}if(this.player.texture.key!==`${this.character}_${f}`)this.charFrame(f);}

    smash(time){this.lastSmash=time;const rage=this.rageUntil>time,pow=rage?3:1,dir=this.player.flipX?-1:1,reach=rage?185:145;this.cameras.main.shake(rage?115:65,rage?.007:.0035);this.burst(this.player.x+dir*46,this.player.y-40,rage?P.pink:P.orange,rage?16:9);this.word(rage?'RAGE SMASH!':'SMASH!');const top=this.player.y-(rage?145:115),bot=this.player.y+8,left=dir>0?this.player.x-8:this.player.x-reach,right=dir>0?this.player.x+reach:this.player.x+8;this.hitGroup(this.buildings,left,right,top,bot,pow,true);this.hitGroup(this.tanks,left-15,right+15,top,bot+15,pow,false);this.hitGroup(this.choppers,left-20,right+20,top-100,bot,pow,false);}
    hitGroup(g,l,r,t,b,pow,isBuilding){g.getChildren().slice().forEach(o=>{if(!o.active)return;const q=o.getBounds();if(q.right<l||q.left>r||q.bottom<t||q.top>b)return;o.hp-=pow;o.setTintFill(0xffffff);this.time.delayedCall(60,()=>o.active&&o.clearTint());this.burst(Phaser.Math.Clamp(this.player.x,q.left,q.right),Phaser.Math.Clamp(this.player.y-50,q.top,q.bottom),P.cyan,6);if(o.hp<=0)isBuilding?this.killBuilding(o):this.killEnemy(o);});}
    killBuilding(b){const x=b.x,y=b.y-b.displayHeight*.4;this.score+=b.scoreValue;this.destroyed++;this.addRage(b.rageValue*this.stats.rageGain);this.burst(x,y,P.orange,16);if(Phaser.Math.Between(0,99)<40)this.spawnCoin(x,y-18);b.destroy();}
    killEnemy(e){this.score+=e.scoreValue||100;this.destroyed++;this.addRage(16*this.stats.rageGain);this.burst(e.x,e.y,P.pink,13);e.destroy();}
    addRage(v){if(this.rageUntil>this.time.now)return;this.rage=Phaser.Math.Clamp(this.rage+v,0,100);if(this.rage>=100){this.rageUntil=this.time.now+6500;this.player.setTint(0xff77ee);this.word('🌈 RAGE MODE 🌈');}}
    endRage(){this.rageUntil=0;this.rage=0;this.player.clearTint();}

    enemies(time){this.tanks.getChildren().forEach(t=>{if(!t.active)return;const dx=this.player.x-t.x;if(Math.abs(dx)<600){t.setFlipX(dx<0);t.setVelocityX(dx>0?-16:16);if(time-t.lastShot>1500){t.lastShot=time;this.fire(t,205);}}});this.choppers.getChildren().forEach(c=>{if(!c.active)return;c.y=c.baseY+Math.sin(time*.002+c.phase)*14;const dx=this.player.x-c.x;c.setFlipX(dx<0);if(Math.abs(dx)<700&&time-c.lastShot>1300){c.lastShot=time;this.fire(c,230);}});this.pickups.getChildren().forEach(c=>{if(c.active)c.rotation+=c.spin*.012;});}
    fire(s,spd){const y=s.texture.key==='tank'?s.y-20:s.y,b=this.bullets.create(s.x,y,'bullet').setDepth(8);fitH(b,7);this.body(b,.85,.75,.075,.125);const a=Phaser.Math.Angle.Between(b.x,b.y,this.player.x,this.player.y-48);this.physics.velocityFromRotation(a,spd,b.body.velocity);b.rotation=a;}
    hitByBullet(b){if(!b.active||this.player.invulnerableUntil>this.time.now)return;b.destroy();this.damage(1);}
    bodyHit(e){if(!e.active||this.player.invulnerableUntil>this.time.now)return;this.player.setVelocityY(-200);this.player.setVelocityX(this.player.x<e.x?-170:170);this.damage(1);}
    damage(n){this.player.invulnerableUntil=this.time.now+800;this.health-=n;this.cameras.main.shake(95,.009);this.player.setTintFill(0xffffff);this.time.delayedCall(80,()=>this.player.active&&this.player.clearTint());this.word('HIT!');if(this.health<=0)this.finish();}
    coin(c){if(!c.active)return;this.coins++;this.score+=50;this.addRage(8*this.stats.rageGain);this.burst(c.x,c.y,P.lime,7);c.destroy();}
    burst(x,y,color,n){for(let i=0;i<n;i++){const z=Phaser.Math.Between(3,8),r=this.add.rectangle(x,y,z,z,color).setDepth(30),a=Phaser.Math.FloatBetween(-3.14,3.14),d=Phaser.Math.Between(22,80);this.tweens.add({targets:r,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,duration:Phaser.Math.Between(220,450),onComplete:()=>r.destroy()});}}
    word(t){this.toast.setText(t).setAlpha(1).setScale(.6);this.tweens.killTweensOf(this.toast);this.tweens.add({targets:this.toast,scale:1.05,duration:100,yoyo:true,hold:120,onComplete:()=>this.tweens.add({targets:this.toast,alpha:0,duration:150})});}
    cleanup(){const left=this.player.x-900;[this.tanks,this.choppers,this.bullets,this.pickups].forEach(g=>g.getChildren().slice().forEach(o=>{if(o.active&&(o.x<left||o.x>this.player.x+1800||o.y>620||o.y<-100))o.destroy();}));this.buildings.getChildren().slice().forEach(b=>{if(b.active&&b.x<left)b.destroy();});}
    updateHUD(){this.scoreText.setText(String(Math.floor(this.score)).padStart(6,'0'));this.coinText.setText(String(this.coins));this.healthText.setText('♥'.repeat(Math.max(0,this.health)));this.distanceText.setText(`${Math.max(0,Math.floor((this.player.x-145)/10))}m`);const heat=Math.min(5,Math.floor(this.destroyed/3));this.heatText.setText('●'.repeat(heat)+'○'.repeat(5-heat));const active=this.rageUntil>this.time.now;this.rageFill.width=460*(active?1:this.rage/100);this.rageFill.fillColor=active?P.lime:P.pink;this.rageText.setText(active?`${Math.max(0,(this.rageUntil-this.time.now)/1000).toFixed(1)}s`:`${Math.floor(this.rage)}%`);this.missionCount.setText(`${Math.min(this.destroyed,25)} / 25`);}
    finish(){if(this.gameOver)return;this.gameOver=true;this.physics.pause();const x=this.cameras.main.scrollX+RR.width/2;this.add.rectangle(x,RR.height/2,RR.width,RR.height,0x030006,.82).setDepth(190);this.add.text(x,185,'RAMPAGE OVER',{fontFamily:'Arial Black',fontSize:'42px',color:'#ff2bd6',stroke:'#000',strokeThickness:9}).setOrigin(.5).setDepth(200);this.add.text(x,250,`SCORE ${Math.floor(this.score)}\n${this.destroyed} TARGETS  •  ${this.coins} COINS`,{fontFamily:'Arial Black',fontSize:'17px',align:'center',color:'#fff',stroke:'#000',strokeThickness:5}).setOrigin(.5).setDepth(200);const a=this.add.rectangle(x,345,250,54,P.pink).setStrokeStyle(4,0xffffff).setDepth(200).setInteractive();this.add.text(x,345,'RAMPAGE AGAIN',{fontFamily:'Arial Black',fontSize:'21px',color:'#fff'}).setOrigin(.5).setDepth(201);const c=this.add.rectangle(x,415,250,46,0x13091b).setStrokeStyle(3,0xffffff).setDepth(200).setInteractive();this.add.text(x,415,'CHANGE CHARACTER',{fontFamily:'Arial Black',fontSize:'14px',color:'#fff'}).setOrigin(.5).setDepth(201);a.on('pointerdown',()=>this.scene.restart({character:this.character}));c.on('pointerdown',()=>this.scene.start('Select'));}
  }

  window.RR2Game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:RR.width,height:RR.height,backgroundColor:'#06020a',render:{antialias:true,roundPixels:true,powerPreference:'high-performance'},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{y:1050},debug:false}},scene:[Boot,Select,Game]});
})();