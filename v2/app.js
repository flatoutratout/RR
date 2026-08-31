(() => {
  const RR = window.RR2;
  const P = RR.palette;
  const controls = { left:false, right:false, jump:false, smash:false };

  class Boot extends Phaser.Scene {
    constructor(){ super('Boot'); }
    preload(){
      const r=RR.assetRoot;
      ['sky','sidewalk','logo-wide','building','tank','chopper','coin','bullet','impact_spark'].forEach(name=>{
        const key=name==='logo-wide'?'logo':name==='impact_spark'?'spark':name;
        this.load.image(key,`${r}${name}.png`);
      });
      Object.keys(RR.characters).forEach(id=>{
        this.load.image(`${id}_portrait`,`${r}portraits/${id}.png`);
        ['idle','run1','run2','jump','smash'].forEach(f=>this.load.image(`${id}_${f}`,`${r}sprites/${id}_${f}.png`));
      });
    }
    create(){ this.scene.start('Select'); }
  }

  class Select extends Phaser.Scene {
    constructor(){ super('Select'); this.selected='gorilla'; }
    create(){
      const w=RR.width,h=RR.height;
      this.add.image(w/2,h/2,'sky').setDisplaySize(w,h).setAlpha(.45);
      this.add.rectangle(w/2,h/2,w,h,0x050008,.58);
      this.add.image(w/2,70,'logo').setDisplaySize(360,106);
      this.add.text(w/2,130,'CHOOSE YOUR RAMPAGER',{fontFamily:'Arial Black',fontSize:'24px',color:'#fff',stroke:'#050008',strokeThickness:7}).setOrigin(.5);
      const ids=Object.keys(RR.characters), gap=156, start=w/2-gap*(ids.length-1)/2;
      this.cards=[];
      ids.forEach((id,i)=>{
        const c=this.add.container(start+i*gap,285);
        const bg=this.add.rectangle(0,0,140,228,0x0c0612,.95).setStrokeStyle(4,0xffffff);
        const portrait=this.add.image(0,-42,`${id}_portrait`).setDisplaySize(126,126);
        const name=this.add.text(0,48,RR.characters[id].name,{fontFamily:'Arial Black',fontSize:'18px',color:'#fff',stroke:'#000',strokeThickness:5}).setOrigin(.5);
        const desc=this.add.text(0,77,RR.characters[id].blurb,{fontFamily:'Arial',fontStyle:'bold',fontSize:'11px',color:'#d9ccdf',align:'center',wordWrap:{width:118}}).setOrigin(.5,0);
        c.add([bg,portrait,name,desc]).setSize(140,228).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.choose(id));
        this.cards.push({id,c,bg});
      });
      this.statsText=this.add.text(w/2,428,'',{fontFamily:'Arial Black',fontSize:'15px',color:'#baff39',stroke:'#000',strokeThickness:5}).setOrigin(.5);
      this.choose(this.selected);
      const go=this.add.rectangle(w/2,487,270,56,P.pink).setStrokeStyle(4,0xffffff).setInteractive({useHandCursor:true});
      this.add.text(w/2,487,'START RAMPAGE',{fontFamily:'Arial Black',fontSize:'24px',color:'#fff',stroke:'#000',strokeThickness:6}).setOrigin(.5);
      go.on('pointerdown',()=>this.scene.start('Game',{character:this.selected}));
      this.input.keyboard.on('keydown-ENTER',()=>this.scene.start('Game',{character:this.selected}));
    }
    choose(id){
      this.selected=id;
      this.cards.forEach(card=>{
        const on=card.id===id;
        card.bg.setStrokeStyle(on?6:4,on?P.lime:P.white);
        card.c.setScale(on?1.065:1).setDepth(on?3:1);
      });
      const s=RR.characters[id];
      this.statsText.setText(`HP ${s.hp}   •   SPEED ${Math.round(s.speed/2.7)}   •   JUMP ${Math.round(s.jump/6)}   •   RAGE ${Math.round(s.rageGain*100)}`);
    }
  }

  class Game extends Phaser.Scene {
    constructor(){ super('Game'); }
    init(data){ this.character=data.character||'gorilla'; }
    create(){
      this.stats=RR.characters[this.character];
      Object.assign(this,{score:0,destroyed:0,coins:0,health:this.stats.hp,rage:0,rageUntil:0,gameOver:false,nextSpawn:520,lastSmash:-9999,runFrame:1,runFrameAt:0});
      this.physics.world.setBounds(0,0,RR.worldWidth,RR.height);
      this.physics.world.gravity.y=1050;
      this.makeWorld();
      this.makeGroups();
      this.makePlayer();
      this.bindInput();
      this.makeHUD();
      this.spawnTo(1900);
      this.cameras.main.setBounds(0,0,RR.worldWidth,RR.height).startFollow(this.player,true,.1,.1,-235,0).setDeadzone(250,110).fadeIn(220,4,0,8);
    }

    makeWorld(){
      this.sky=this.add.tileSprite(0,0,RR.worldWidth,RR.height,'sky').setOrigin(0).setDepth(-30).setScrollFactor(.14);
      this.sky.setDisplaySize(RR.worldWidth,RR.height);
      const skyline=this.add.graphics().setDepth(-15).setAlpha(.42);
      let x=0;
      while(x<RR.worldWidth){
        const bw=Phaser.Math.Between(90,180), bh=Phaser.Math.Between(90,250);
        skyline.fillStyle(0x08030d).fillRect(x,RR.floorY-bh,bw,bh);
        x+=bw+Phaser.Math.Between(20,70);
      }
      this.road=this.add.tileSprite(0,RR.floorY-2,RR.worldWidth,108,'sidewalk').setOrigin(0,.5).setDepth(-5);
      this.road.setDisplaySize(RR.worldWidth,108);
      this.ground=this.add.rectangle(RR.worldWidth/2,RR.floorY+35,RR.worldWidth,70,0x000000,0);
      this.physics.add.existing(this.ground,true);
    }

    makeGroups(){
      this.buildings=this.physics.add.staticGroup();
      this.tanks=this.physics.add.group({allowGravity:false});
      this.choppers=this.physics.add.group({allowGravity:false});
      this.bullets=this.physics.add.group({allowGravity:false});
      this.pickups=this.physics.add.group({allowGravity:false});
    }

    fitBody(sprite,wRatio,hRatio,xRatio,yRatio){
      const sw=sprite.width, sh=sprite.height;
      sprite.body.setSize(sw*wRatio,sh*hRatio,false);
      sprite.body.setOffset(sw*xRatio,sh*yRatio);
    }

    makePlayer(){
      this.player=this.physics.add.sprite(135,RR.floorY,`${this.character}_idle`).setOrigin(.5,1).setDepth(10);
      this.player.setDisplaySize(126*this.stats.scale,146*this.stats.scale);
      this.fitBody(this.player,.50,.76,.25,.20);
      this.player.setCollideWorldBounds(true);
      this.player.invulnerableUntil=0;
      this.physics.add.collider(this.player,this.ground);
      this.physics.add.overlap(this.player,this.bullets,(_,b)=>this.takeBullet(b));
      this.physics.add.overlap(this.player,this.pickups,(_,p)=>this.takeCoin(p));
      this.physics.add.overlap(this.player,this.tanks,(_,e)=>this.bodyHit(e));
      this.physics.add.overlap(this.player,this.choppers,(_,e)=>this.bodyHit(e));
    }

    bindInput(){
      this.keys=this.input.keyboard.addKeys({left:'A',right:'D',left2:'LEFT',right2:'RIGHT',jump:'SPACE',jump2:'W',smash:'E',smash2:'F'});
      document.querySelectorAll('#mobile-controls button').forEach(btn=>{
        if(btn.dataset.rrBound==='1')return;
        btn.dataset.rrBound='1';
        const k=btn.dataset.control;
        const down=e=>{e.preventDefault();controls[k]=true;btn.classList.add('active');};
        const up=e=>{e.preventDefault();controls[k]=false;btn.classList.remove('active');};
        btn.addEventListener('pointerdown',down,{passive:false});
        ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,up,{passive:false}));
      });
    }

    fixed(o){ return o.setScrollFactor(0).setDepth(100); }
    makeHUD(){
      this.fixed(this.add.rectangle(480,47,650,75,0x07010d,.84).setStrokeStyle(3,0xffffff,.9));
      this.scoreText=this.fixed(this.add.text(180,24,'',{fontFamily:'Arial Black',fontSize:'18px',color:'#fff',stroke:'#000',strokeThickness:4}));
      this.distanceText=this.fixed(this.add.text(180,52,'',{fontFamily:'Arial Black',fontSize:'13px',color:'#35e7ff',stroke:'#000',strokeThickness:4}));
      this.healthText=this.fixed(this.add.text(390,24,'',{fontFamily:'Arial Black',fontSize:'17px',color:'#ff6577',stroke:'#000',strokeThickness:4}));
      this.killText=this.fixed(this.add.text(390,52,'',{fontFamily:'Arial Black',fontSize:'13px',color:'#ffcc35',stroke:'#000',strokeThickness:4}));
      this.fixed(this.add.text(615,18,'RAGE',{fontFamily:'Arial Black',fontSize:'12px',color:'#fff',stroke:'#000',strokeThickness:4}));
      this.fixed(this.add.rectangle(698,51,168,18,0x25122a).setStrokeStyle(2,0xffffff,.8));
      this.rageFill=this.fixed(this.add.rectangle(614,51,0,14,P.pink).setOrigin(0,.5));
      this.rageText=this.fixed(this.add.text(698,51,'',{fontFamily:'Arial Black',fontSize:'11px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(.5));
      this.toast=this.fixed(this.add.text(480,112,'',{fontFamily:'Arial Black',fontSize:'25px',color:'#fff',stroke:'#000',strokeThickness:7}).setOrigin(.5).setAlpha(0));
      this.fixed(this.add.text(480,515,'A/D MOVE   •   SPACE JUMP   •   E SMASH',{fontFamily:'Arial Black',fontSize:'11px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(.5).setAlpha(.7));
      this.updateHUD();
    }

    spawnTo(limit){
      while(this.nextSpawn<limit&&this.nextSpawn<RR.worldWidth-800){
        const x=this.nextSpawn, r=Phaser.Math.Between(0,99);
        if(r<56)this.spawnBuilding(x); else if(r<80)this.spawnTank(x); else this.spawnChopper(x);
        if(Phaser.Math.Between(0,99)<38)this.spawnCoin(x+Phaser.Math.Between(25,95),Phaser.Math.Between(325,405));
        this.nextSpawn+=Phaser.Math.Between(190,325);
      }
    }

    spawnBuilding(x){
      const h=Phaser.Math.Between(150,238);
      const b=this.buildings.create(x,RR.floorY,'building').setOrigin(.5,1).setDepth(3);
      b.setDisplaySize(h*(b.width/b.height),h).refreshBody();
      b.body.setSize(b.width*.74,b.height*.88,false).setOffset(b.width*.13,b.height*.12);
      b.hp=Phaser.Math.Between(1,4);b.scoreValue=35+b.hp*25;b.rageValue=10+b.hp*4;
      b.setTint([0xffffff,0xf7e7ff,0xdffaff,0xfff0c9][Phaser.Math.Between(0,3)]);
    }

    spawnTank(x){
      const t=this.tanks.create(x,RR.floorY-2,'tank').setOrigin(.5,1).setDepth(6).setDisplaySize(88,52);
      this.fitBody(t,.82,.66,.09,.24);
      t.hp=2;t.scoreValue=115;t.lastShot=0;t.setVelocityX(-30);
    }

    spawnChopper(x){
      const y=Phaser.Math.Between(225,320);
      const c=this.choppers.create(x,y,'chopper').setDepth(7).setDisplaySize(118,62);
      this.fitBody(c,.75,.56,.12,.22);
      c.hp=2;c.scoreValue=145;c.lastShot=0;c.baseY=y;c.phase=Math.random()*Math.PI*2;c.setVelocityX(-26);
    }

    spawnCoin(x,y){
      const c=this.pickups.create(x,y,'coin').setDepth(5).setDisplaySize(30,30);
      c.body.setCircle(c.width*.32,c.width*.18,c.height*.18);
      c.spin=Phaser.Math.FloatBetween(-2.5,2.5);
    }

    update(time){
      if(this.gameOver)return;
      this.move(time);this.animate(time);this.updateEnemies(time);this.cleanup();this.spawnTo(this.player.x+1900);this.updateHUD();
      this.road.tilePositionX=this.cameras.main.scrollX*.08;this.sky.tilePositionX=this.cameras.main.scrollX*.03;
      if(this.rageUntil&&time>this.rageUntil)this.endRage();
    }

    move(time){
      const left=this.keys.left.isDown||this.keys.left2.isDown||controls.left;
      const right=this.keys.right.isDown||this.keys.right2.isDown||controls.right;
      const speed=this.stats.speed*(this.rageUntil>time?1.2:1);
      if(left&&!right){this.player.setVelocityX(-speed).setFlipX(true);}else if(right&&!left){this.player.setVelocityX(speed).setFlipX(false);}else this.player.setVelocityX(0);
      const jump=Phaser.Input.Keyboard.JustDown(this.keys.jump)||Phaser.Input.Keyboard.JustDown(this.keys.jump2)||controls.jump;
      if(jump&&this.player.body.blocked.down){this.player.setVelocityY(-this.stats.jump);controls.jump=false;}
      const smash=Phaser.Input.Keyboard.JustDown(this.keys.smash)||Phaser.Input.Keyboard.JustDown(this.keys.smash2)||controls.smash;
      if(smash&&time-this.lastSmash>310){controls.smash=false;this.doSmash(time);}
    }

    animate(time){
      let frame='idle';
      if(time-this.lastSmash<230)frame='smash';
      else if(!this.player.body.blocked.down)frame='jump';
      else if(Math.abs(this.player.body.velocity.x)>10){if(time>this.runFrameAt){this.runFrameAt=time+115;this.runFrame=this.runFrame===1?2:1;}frame=`run${this.runFrame}`;}
      const key=`${this.character}_${frame}`;
      if(this.player.texture.key!==key){this.player.setTexture(key).setDisplaySize(126*this.stats.scale,146*this.stats.scale);this.fitBody(this.player,.50,.76,.25,.20);}
    }

    doSmash(time){
      this.lastSmash=time;
      const rage=this.rageUntil>time, radius=rage?160:116, power=rage?3:1;
      this.cameras.main.shake(rage?125:70,rage?.008:.004);
      this.burst(this.player.x+(this.player.flipX?-40:40),this.player.y-42,rage?P.pink:P.orange,rage?18:11);
      this.word(rage?'RAGE SMASH!':'SMASH!');
      this.hitGroup(this.buildings,radius,power,true);this.hitGroup(this.tanks,radius+12,power,false);this.hitGroup(this.choppers,radius+28,power,false);
    }

    hitGroup(group,radius,power,building){
      group.getChildren().slice().forEach(o=>{
        if(!o.active)return;
        const oy=o.originY===1?o.y-o.displayHeight*.42:o.y;
        if(Phaser.Math.Distance.Between(this.player.x,this.player.y-55,o.x,oy)>radius)return;
        o.hp-=power;o.setTintFill(0xffffff);this.time.delayedCall(65,()=>o.active&&o.clearTint());this.burst(o.x,oy,P.cyan,7);
        if(o.hp<=0)building?this.killBuilding(o):this.killEnemy(o);
      });
    }

    killBuilding(b){
      const x=b.x,y=b.y-b.displayHeight*.42;this.score+=b.scoreValue;this.destroyed++;this.addRage(b.rageValue*this.stats.rageGain);this.burst(x,y,P.orange,18);
      if(Phaser.Math.Between(0,99)<45)this.spawnCoin(x,y-20);b.destroy();this.cameras.main.shake(85,.005);
    }
    killEnemy(e){this.score+=e.scoreValue||100;this.destroyed++;this.addRage(16*this.stats.rageGain);this.burst(e.x,e.y,P.pink,15);e.destroy();}

    addRage(v){if(this.rageUntil>this.time.now)return;this.rage=Phaser.Math.Clamp(this.rage+v,0,100);if(this.rage>=100)this.startRage();}
    startRage(){this.rage=100;this.rageUntil=this.time.now+6500;this.player.setTint(0xff77ee);this.word('🌈 RAGE MODE 🌈');this.cameras.main.flash(170,255,40,205,false);}
    endRage(){this.rageUntil=0;this.rage=0;this.player.clearTint();}

    updateEnemies(time){
      this.tanks.getChildren().forEach(t=>{if(!t.active)return;const dx=this.player.x-t.x;if(Math.abs(dx)<620){t.setFlipX(dx<0);t.setVelocityX(dx>0?-18:18);if(time-t.lastShot>1450){t.lastShot=time;this.fire(t,210);}}});
      this.choppers.getChildren().forEach(c=>{if(!c.active)return;c.y=c.baseY+Math.sin(time*.002+c.phase)*18;const dx=this.player.x-c.x;c.setFlipX(dx<0);if(Math.abs(dx)<720&&time-c.lastShot>1250){c.lastShot=time;this.fire(c,235);}});
      this.pickups.getChildren().forEach(c=>{if(c.active)c.rotation+=c.spin*.012;});
    }

    fire(shooter,speed){
      const sy=shooter.texture.key==='tank'?shooter.y-28:shooter.y;
      const b=this.bullets.create(shooter.x,sy,'bullet').setDepth(8).setDisplaySize(14,8);
      this.fitBody(b,.85,.75,.075,.125);
      const angle=Phaser.Math.Angle.Between(b.x,b.y,this.player.x,this.player.y-55);this.physics.velocityFromRotation(angle,speed,b.body.velocity);b.rotation=angle;
    }

    takeBullet(b){if(!b.active||this.player.invulnerableUntil>this.time.now)return;b.destroy();this.damagePlayer(1);}
    bodyHit(e){if(!e.active||this.player.invulnerableUntil>this.time.now)return;this.player.setVelocityY(-220);this.player.setVelocityX(this.player.x<e.x?-190:190);this.damagePlayer(1);}
    damagePlayer(n){this.player.invulnerableUntil=this.time.now+820;this.health-=n;this.cameras.main.shake(110,.011);this.cameras.main.flash(90,255,35,70,false);this.player.setTintFill(0xffffff);this.time.delayedCall(90,()=>this.player.active&&this.player.clearTint());this.word('HIT!');if(this.health<=0)this.finish();}
    takeCoin(c){if(!c.active)return;this.coins++;this.score+=50;this.addRage(8*this.stats.rageGain);this.burst(c.x,c.y,P.lime,8);c.destroy();}

    burst(x,y,color,count){for(let i=0;i<count;i++){const s=Phaser.Math.Between(3,9),r=this.add.rectangle(x,y,s,s,color).setDepth(30).setAngle(Phaser.Math.Between(0,180)),a=Phaser.Math.FloatBetween(-Math.PI,Math.PI),d=Phaser.Math.Between(25,100);this.tweens.add({targets:r,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,angle:r.angle+Phaser.Math.Between(80,320),alpha:0,duration:Phaser.Math.Between(240,520),ease:'Quad.easeOut',onComplete:()=>r.destroy()});}}
    word(text){this.toast.setText(text).setAlpha(1).setScale(.55).setAngle(Phaser.Math.Between(-4,4));this.tweens.killTweensOf(this.toast);this.tweens.add({targets:this.toast,scale:1.1,duration:115,ease:'Back.easeOut',yoyo:true,hold:160,onComplete:()=>this.tweens.add({targets:this.toast,alpha:0,duration:170})});}

    cleanup(){const left=this.player.x-1000;[this.tanks,this.choppers,this.bullets,this.pickups].forEach(g=>g.getChildren().slice().forEach(o=>{if(o.active&&(o.x<left||o.x>this.player.x+1900||o.y>620||o.y<-100))o.destroy();}));this.buildings.getChildren().slice().forEach(b=>{if(b.active&&b.x<left)b.destroy();});}
    updateHUD(){
      this.scoreText.setText(`SCORE ${String(Math.floor(this.score)).padStart(6,'0')}`);this.distanceText.setText(`DIST ${Math.max(0,Math.floor((this.player.x-135)/10))}m   •   COINS ${this.coins}`);this.healthText.setText(`HP ${'♥'.repeat(Math.max(0,this.health))}`);this.killText.setText(`SMASHED ${this.destroyed}`);
      const active=this.rageUntil>this.time.now;this.rageFill.width=168*(active?1:this.rage/100);this.rageFill.fillColor=active?P.lime:P.pink;this.rageText.setText(active?`${Math.max(0,(this.rageUntil-this.time.now)/1000).toFixed(1)}s`:`${Math.floor(this.rage)}%`);
    }

    finish(){
      if(this.gameOver)return;this.gameOver=true;this.physics.pause();const x=this.cameras.main.scrollX+RR.width/2;
      this.add.rectangle(x,RR.height/2,RR.width,RR.height,0x030006,.8).setDepth(190);
      this.add.text(x,175,'RAMPAGE OVER',{fontFamily:'Arial Black',fontSize:'44px',color:'#ff2bd6',stroke:'#000',strokeThickness:10}).setOrigin(.5).setDepth(200);
      this.add.text(x,245,`SCORE ${Math.floor(this.score)}\n${this.destroyed} TARGETS DESTROYED  •  ${this.coins} COINS`,{fontFamily:'Arial Black',fontSize:'17px',align:'center',color:'#fff',stroke:'#000',strokeThickness:6,lineSpacing:8}).setOrigin(.5).setDepth(200);
      const again=this.add.rectangle(x,340,260,58,P.pink).setStrokeStyle(4,0xffffff).setDepth(200).setInteractive({useHandCursor:true});
      this.add.text(x,340,'RAMPAGE AGAIN',{fontFamily:'Arial Black',fontSize:'22px',color:'#fff',stroke:'#000',strokeThickness:6}).setOrigin(.5).setDepth(201);
      const change=this.add.rectangle(x,414,260,48,0x13091b).setStrokeStyle(3,0xffffff).setDepth(200).setInteractive({useHandCursor:true});
      this.add.text(x,414,'CHANGE CHARACTER',{fontFamily:'Arial Black',fontSize:'15px',color:'#fff',stroke:'#000',strokeThickness:5}).setOrigin(.5).setDepth(201);
      again.on('pointerdown',()=>this.scene.restart({character:this.character}));change.on('pointerdown',()=>this.scene.start('Select'));
      fetch('/api/submit-score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'PLAYER',score:Math.floor(this.score),character:this.character})}).catch(()=>{});
    }
  }

  window.RR2Game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:RR.width,height:RR.height,backgroundColor:'#06020a',render:{antialias:true,roundPixels:true,powerPreference:'high-performance'},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{y:1050},debug:false}},scene:[Boot,Select,Game]});
})();
