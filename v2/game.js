(() => {
  const RR = window.RR2;
  const P = RR.palette;
  const inputState = { left:false, right:false, jump:false, smash:false };

  class BootScene extends Phaser.Scene {
    constructor(){ super('Boot'); }
    preload(){
      const root = RR.assetRoot;
      this.load.image('sky', root + 'sky.png');
      this.load.image('sidewalk', root + 'sidewalk.png');
      this.load.image('logo', root + 'logo-wide.png');
      this.load.image('building', root + 'building.png');
      this.load.image('tank', root + 'tank.png');
      this.load.image('chopper', root + 'chopper.png');
      this.load.image('coin', root + 'coin.png');
      this.load.image('bullet', root + 'bullet.png');
      this.load.image('spark', root + 'impact_spark.png');
      Object.keys(RR.characters).forEach(id => {
        this.load.image(`${id}_portrait`, `${root}portraits/${id}.png`);
        ['idle','run1','run2','jump','smash'].forEach(frame => {
          this.load.image(`${id}_${frame}`, `${root}sprites/${id}_${frame}.png`);
        });
      });
    }
    create(){ this.scene.start('Menu'); }
  }

  class MenuScene extends Phaser.Scene {
    constructor(){ super('Menu'); this.selected = 'gorilla'; }
    create(){
      const { width:w, height:h } = this.scale;
      this.add.image(w/2,h/2,'sky').setDisplaySize(w,h).setAlpha(.42);
      this.add.rectangle(w/2,h/2,w,h,0x050008,.58);
      this.add.image(w/2,75,'logo').setDisplaySize(380,112);
      this.add.text(w/2,131,'CHOOSE YOUR RAMPAGER',{fontFamily:'Arial Black',fontSize:'24px',color:'#ffffff',stroke:'#050008',strokeThickness:7}).setOrigin(.5);

      const ids = Object.keys(RR.characters);
      const gap = 156;
      const startX = w/2 - gap*(ids.length-1)/2;
      this.cards = [];
      ids.forEach((id,i) => {
        const x = startX+i*gap;
        const card = this.add.container(x,286);
        const bg = this.add.rectangle(0,0,140,230,0x0d0714,.94).setStrokeStyle(4,0xffffff,1);
        const portrait = this.add.image(0,-40,`${id}_portrait`).setDisplaySize(126,126);
        const name = this.add.text(0,47,RR.characters[id].name,{fontFamily:'Arial Black',fontSize:'18px',color:'#ffffff',stroke:'#000000',strokeThickness:5}).setOrigin(.5);
        const desc = this.add.text(0,78,RR.characters[id].blurb,{fontFamily:'Arial',fontStyle:'bold',fontSize:'11px',color:'#d8cce2',align:'center',wordWrap:{width:118}}).setOrigin(.5,0);
        card.add([bg,portrait,name,desc]);
        card.setSize(140,230).setInteractive({useHandCursor:true}).on('pointerdown',() => this.choose(id));
        this.cards.push({id,card,bg,portrait,name});
      });
      this.choose(this.selected);

      this.stats = this.add.text(w/2,430,'',{fontFamily:'Arial Black',fontSize:'15px',color:'#baff39',stroke:'#000',strokeThickness:5}).setOrigin(.5);
      this.refreshStats();
      const button = this.add.rectangle(w/2,489,265,54,P.pink,1).setStrokeStyle(4,0xffffff).setInteractive({useHandCursor:true});
      this.add.text(w/2,489,'START RAMPAGE',{fontFamily:'Arial Black',fontSize:'24px',color:'#ffffff',stroke:'#000000',strokeThickness:6}).setOrigin(.5);
      button.on('pointerdown',()=>this.scene.start('Game',{character:this.selected}));
      this.input.keyboard.on('keydown-ENTER',()=>this.scene.start('Game',{character:this.selected}));
    }
    choose(id){
      this.selected=id;
      this.cards.forEach(c=>{
        const active=c.id===id;
        c.bg.setStrokeStyle(active?6:4,active?P.lime:P.white,1);
        c.card.setScale(active?1.07:1);
        c.card.setDepth(active?3:1);
      });
      if(this.stats) this.refreshStats();
    }
    refreshStats(){
      const s=RR.characters[this.selected];
      this.stats.setText(`HP ${s.hp}   •   SPEED ${Math.round(s.speed/2.7)}   •   JUMP ${Math.round(s.jump/6)}   •   RAGE ${Math.round(s.rageGain*100)}`);
    }
  }

  class GameScene extends Phaser.Scene {
    constructor(){ super('Game'); }
    init(data){ this.character = data.character || 'gorilla'; }
    create(){
      this.stats = RR.characters[this.character];
      this.score=0; this.destroyed=0; this.coins=0; this.health=this.stats.hp; this.rage=0;
      this.rageUntil=0; this.gameOver=false; this.nextSpawn=520; this.lastShot=0; this.lastSmash=0; this.runFrameAt=0;
      this.worldFloor = RR.floorY;
      this.physics.world.setBounds(0,0,RR.worldWidth,RR.height);
      this.physics.world.gravity.y=1050;

      this.createWorld();
      this.createGroups();
      this.createPlayer();
      this.createInput();
      this.createHUD();
      this.spawnAhead(1800);

      this.cameras.main.setBounds(0,0,RR.worldWidth,RR.height);
      this.cameras.main.startFollow(this.player,true,.11,.11,-235,0);
      this.cameras.main.setDeadzone(260,120);
      this.cameras.main.fadeIn(250,5,0,8);
    }

    createWorld(){
      const w=RR.width,h=RR.height;
      this.sky=this.add.tileSprite(0,0,RR.worldWidth,h,'sky').setOrigin(0).setScrollFactor(.16).setDepth(-30);
      this.sky.setDisplaySize(RR.worldWidth,h);
      this.nearSkyline=this.add.graphics().setDepth(-18).setAlpha(.45);
      for(let x=0;x<RR.worldWidth;x+=Phaser.Math.Between(145,260)){
        const bw=Phaser.Math.Between(90,190), bh=Phaser.Math.Between(90,260);
        this.nearSkyline.fillStyle(0x08030d,1).fillRect(x,this.worldFloor-bh,bw,bh);
      }
      this.road=this.add.tileSprite(0,this.worldFloor-3,RR.worldWidth,110,'sidewalk').setOrigin(0,.5).setDepth(-5);
      this.road.setDisplaySize(RR.worldWidth,110);
      this.ground=this.add.rectangle(RR.worldWidth/2,this.worldFloor+38,RR.worldWidth,80,0x000000,0).setOrigin(.5);
      this.physics.add.existing(this.ground,true);
      this.add.rectangle(RR.worldWidth/2,this.worldFloor+48,RR.worldWidth,4,0xffffff,.15).setDepth(-4);
    }

    createGroups(){
      this.buildings=this.physics.add.staticGroup();
      this.tanks=this.physics.add.group({allowGravity:false});
      this.choppers=this.physics.add.group({allowGravity:false});
      this.bullets=this.physics.add.group({allowGravity:false});
      this.pickups=this.physics.add.group({allowGravity:false});
      this.effects=this.add.group();
    }

    createPlayer(){
      this.player=this.physics.add.sprite(135,this.worldFloor,`${this.character}_idle`).setOrigin(.5,1).setDepth(10);
      this.player.setDisplaySize(126*this.stats.scale,146*this.stats.scale);
      this.player.body.setSize(this.player.displayWidth*.50,this.player.displayHeight*.76,true);
      this.player.body.setOffset(this.player.width*.25,this.player.height*.20);
      this.player.setCollideWorldBounds(true);
      this.physics.add.collider(this.player,this.ground);
      this.physics.add.overlap(this.player,this.bullets,(_,b)=>this.hitPlayer(b));
      this.physics.add.overlap(this.player,this.pickups,(_,p)=>this.collectPickup(p));
      this.physics.add.overlap(this.player,this.tanks,(_,e)=>this.touchEnemy(e));
      this.physics.add.overlap(this.player,this.choppers,(_,e)=>this.touchEnemy(e));
    }

    createInput(){
      this.keys=this.input.keyboard.addKeys({
        left:Phaser.Input.Keyboard.KeyCodes.A,right:Phaser.Input.Keyboard.KeyCodes.D,
        left2:Phaser.Input.Keyboard.KeyCodes.LEFT,right2:Phaser.Input.Keyboard.KeyCodes.RIGHT,
        jump:Phaser.Input.Keyboard.KeyCodes.SPACE,jump2:Phaser.Input.Keyboard.KeyCodes.W,
        smash:Phaser.Input.Keyboard.KeyCodes.E,smash2:Phaser.Input.Keyboard.KeyCodes.F
      });
      document.querySelectorAll('#mobile-controls button').forEach(btn=>{
        const key=btn.dataset.control;
        const down=e=>{e.preventDefault();inputState[key]=true;btn.classList.add('active');};
        const up=e=>{e.preventDefault();inputState[key]=false;btn.classList.remove('active');};
        btn.addEventListener('pointerdown',down,{passive:false});
        btn.addEventListener('pointerup',up,{passive:false});
        btn.addEventListener('pointercancel',up,{passive:false});
        btn.addEventListener('pointerleave',up,{passive:false});
      });
    }

    createHUD(){
      const fixed=(obj)=>obj.setScrollFactor(0).setDepth(100);
      fixed(this.add.rectangle(480,47,650,75,0x07010d,.82).setStrokeStyle(3,0xffffff,.92));
      fixed(this.add.rectangle(480,47,644,69,0x190d22,.36));
      this.scoreText=fixed(this.add.text(180,25,'SCORE 000000',{fontFamily:'Arial Black',fontSize:'18px',color:'#ffffff',stroke:'#000',strokeThickness:4}));
      this.distanceText=fixed(this.add.text(180,52,'DIST 0m',{fontFamily:'Arial Black',fontSize:'13px',color:'#35e7ff',stroke:'#000',strokeThickness:4}));
      this.healthText=fixed(this.add.text(390,25,'',{fontFamily:'Arial Black',fontSize:'17px',color:'#ff6577',stroke:'#000',strokeThickness:4}));
      this.comboText=fixed(this.add.text(390,52,'SMASHED 0',{fontFamily:'Arial Black',fontSize:'13px',color:'#ffcc35',stroke:'#000',strokeThickness:4}));
      this.rageLabel=fixed(this.add.text(615,19,'RAGE',{fontFamily:'Arial Black',fontSize:'12px',color:'#ffffff',stroke:'#000',strokeThickness:4}));
      this.rageBg=fixed(this.add.rectangle(698,51,168,18,0x221226,1).setStrokeStyle(2,0xffffff,.8).setOrigin(.5));
      this.rageFill=fixed(this.add.rectangle(614,51,0,14,P.pink,1).setOrigin(0,.5));
      this.rageText=fixed(this.add.text(698,51,'0%',{fontFamily:'Arial Black',fontSize:'11px',color:'#ffffff',stroke:'#000',strokeThickness:3}).setOrigin(.5));
      this.toast=fixed(this.add.text(480,112,'',{fontFamily:'Arial Black',fontSize:'25px',color:'#ffffff',stroke:'#000',strokeThickness:7}).setOrigin(.5).setAlpha(0));
      this.help=fixed(this.add.text(480,514,'A/D MOVE   •   SPACE JUMP   •   E SMASH',{fontFamily:'Arial Black',fontSize:'11px',color:'#ffffff',stroke:'#000',strokeThickness:4}).setOrigin(.5).setAlpha(.72));
      this.updateHUD();
    }

    spawnAhead(limitX){
      while(this.nextSpawn < limitX && this.nextSpawn < RR.worldWidth-800){
        const x=this.nextSpawn;
        const roll=Phaser.Math.Between(0,99);
        if(roll<58) this.spawnBuilding(x);
        else if(roll<80) this.spawnTank(x);
        else this.spawnChopper(x);
        if(Phaser.Math.Between(0,99)<36) this.spawnCoin(x+Phaser.Math.Between(20,90),Phaser.Math.Between(330,405));
        this.nextSpawn += Phaser.Math.Between(185,330);
      }
    }

    spawnBuilding(x){
      const height=Phaser.Math.Between(150,240);
      const b=this.buildings.create(x,this.worldFloor,'building').setOrigin(.5,1).setDepth(3);
      const ratio=b.width/b.height;
      b.setDisplaySize(height*ratio,height);
      b.refreshBody();
      b.body.setSize(b.displayWidth*.74,b.displayHeight*.88);
      b.body.setOffset(b.width*.13,b.height*.12);
      b.hp=Phaser.Math.Between(1,4); b.maxHp=b.hp; b.scoreValue=35+b.hp*25; b.rageValue=10+b.hp*4;
      b.setTint([0xffffff,0xfbe9ff,0xdffaff,0xfff2cf][Phaser.Math.Between(0,3)]);
    }

    spawnTank(x){
      const t=this.tanks.create(x,this.worldFloor-2,'tank').setOrigin(.5,1).setDepth(6);
      t.setDisplaySize(88,52); t.body.setSize(t.displayWidth*.82,t.displayHeight*.66,true);
      t.hp=2; t.scoreValue=115; t.lastShot=0; t.setVelocityX(-34);
    }

    spawnChopper(x){
      const y=Phaser.Math.Between(235,330);
      const c=this.choppers.create(x,y,'chopper').setOrigin(.5).setDepth(7);
      c.setDisplaySize(118,62); c.body.setSize(c.displayWidth*.75,c.displayHeight*.56,true);
      c.hp=2; c.scoreValue=145; c.lastShot=0; c.baseY=y; c.phase=Math.random()*6.28; c.setVelocityX(-28);
    }

    spawnCoin(x,y){
      const c=this.pickups.create(x,y,'coin').setDepth(5);
      c.setDisplaySize(30,30); c.body.setCircle(Math.max(7,c.body.width*.28));
      c.spin=Phaser.Math.FloatBetween(-2.6,2.6);
    }

    update(time,delta){
      if(this.gameOver) return;
      this.handleMovement(time);
      this.animatePlayer(time);
      this.updateEnemies(time);
      this.cleanup();
      this.spawnAhead(this.player.x+1900);
      this.updateHUD();
      this.road.tilePositionX=this.cameras.main.scrollX*.08;
      this.sky.tilePositionX=this.cameras.main.scrollX*.03;
      if(this.rageUntil && time>this.rageUntil) this.endRage();
      if(this.player.y>RR.height+80) this.endGame();
      if(this.player.x>RR.worldWidth-1200) this.endGame(true);
    }

    handleMovement(time){
      const left=this.keys.left.isDown||this.keys.left2.isDown||inputState.left;
      const right=this.keys.right.isDown||this.keys.right2.isDown||inputState.right;
      const rage=this.rageUntil>time;
      const speed=this.stats.speed*(rage?1.2:1);
      if(left&&!right){this.player.setVelocityX(-speed);this.player.setFlipX(true);}
      else if(right&&!left){this.player.setVelocityX(speed);this.player.setFlipX(false);}
      else this.player.setVelocityX(0);

      const jumpPressed=Phaser.Input.Keyboard.JustDown(this.keys.jump)||Phaser.Input.Keyboard.JustDown(this.keys.jump2)||inputState.jump;
      if(jumpPressed&&this.player.body.blocked.down){this.player.setVelocityY(-this.stats.jump);inputState.jump=false;}
      const smashPressed=Phaser.Input.Keyboard.JustDown(this.keys.smash)||Phaser.Input.Keyboard.JustDown(this.keys.smash2)||inputState.smash;
      if(smashPressed&&time-this.lastSmash>310){this.smash(time);inputState.smash=false;}
    }

    animatePlayer(time){
      if(time-this.lastSmash<230){ this.setPlayerTexture('smash'); return; }
      if(!this.player.body.blocked.down){ this.setPlayerTexture('jump'); return; }
      if(Math.abs(this.player.body.velocity.x)>10){
        if(time>this.runFrameAt){this.runFrameAt=time+115;this.runFrame=this.runFrame===1?2:1;}
        this.setPlayerTexture(`run${this.runFrame||1}`);
      } else this.setPlayerTexture('idle');
    }

    setPlayerTexture(frame){
      const key=`${this.character}_${frame}`;
      if(this.player.texture.key!==key){
        this.player.setTexture(key);
        this.player.setDisplaySize(126*this.stats.scale,146*this.stats.scale);
      }
    }

    smash(time){
      this.lastSmash=time;
      const rage=this.rageUntil>time;
      const radius=rage?155:112;
      const power=rage?3:1;
      this.cameras.main.shake(rage?125:70,rage?.008:.004);
      this.burst(this.player.x+(this.player.flipX?-35:35),this.player.y-35,rage?P.pink:P.orange,12);
      this.flashWord(rage?'RAGE SMASH!':'SMASH!');
      this.hitThingsInRadius(this.buildings,radius,power,'building');
      this.hitThingsInRadius(this.tanks,radius+10,power,'enemy');
      this.hitThingsInRadius(this.choppers,radius+22,power,'enemy');
    }

    hitThingsInRadius(group,radius,power,type){
      group.getChildren().slice().forEach(obj=>{
        if(!obj.active) return;
        const d=Phaser.Math.Distance.Between(this.player.x,this.player.y-55,obj.x,obj.y-(obj.displayHeight||0)*.35);
        if(d<=radius){
          obj.hp-=power;
          obj.setTintFill(0xffffff);
          this.time.delayedCall(65,()=>obj.active&&obj.clearTint());
          this.burst(obj.x,obj.y-(obj.displayHeight||30)*.45,P.cyan,7);
          if(obj.hp<=0){
            if(type==='building') this.destroyBuilding(obj); else this.destroyEnemy(obj);
          }
        }
      });
    }

    destroyBuilding(b){
      const x=b.x,y=b.y-b.displayHeight*.38;
      this.score+=b.scoreValue;this.destroyed++;
      this.addRage(b.rageValue*this.stats.rageGain);
      this.burst(x,y,P.orange,18);
      if(Phaser.Math.Between(0,99)<48) this.spawnCoin(x,y-20);
      b.destroy();
      this.cameras.main.shake(90,.006);
    }

    destroyEnemy(e){
      this.score+=e.scoreValue||100;this.destroyed++;
      this.addRage(16*this.stats.rageGain);
      this.burst(e.x,e.y,P.pink,15);
      e.destroy();
    }

    addRage(amount){
      if(this.rageUntil>this.time.now) return;
      this.rage=Phaser.Math.Clamp(this.rage+amount,0,100);
      if(this.rage>=100) this.startRage();
    }

    startRage(){
      this.rage=100;this.rageUntil=this.time.now+6500;
      this.flashWord('🌈 RAGE MODE 🌈');
      this.player.setTint(0xff77ee);
      this.cameras.main.flash(180,255,40,205,false);
    }

    endRage(){ this.rageUntil=0;this.rage=0;this.player.clearTint(); }

    updateEnemies(time){
      this.tanks.getChildren().forEach(t=>{
        if(!t.active)return;
        const dx=this.player.x-t.x;
        if(Math.abs(dx)<620){
          t.setFlipX(dx<0);
          t.setVelocityX(dx>0?-20:20);
          if(time-t.lastShot>Phaser.Math.Between(1350,1900)){t.lastShot=time;this.fireBullet(t,210);}
        }
      });
      this.choppers.getChildren().forEach(c=>{
        if(!c.active)return;
        c.y=c.baseY+Math.sin(time*.002+c.phase)*18;
        const dx=this.player.x-c.x;
        c.setFlipX(dx<0);
        if(Math.abs(dx)<720&&time-c.lastShot>Phaser.Math.Between(1150,1750)){c.lastShot=time;this.fireBullet(c,235);}
      });
      this.pickups.getChildren().forEach(c=>{if(c.active)c.rotation+=c.spin*.012;});
    }

    fireBullet(shooter,speed){
      const b=this.bullets.create(shooter.x,shooter.y-(shooter.texture.key==='tank'?26:0),'bullet').setDepth(8);
      b.setDisplaySize(14,8);b.body.setSize(12,7,true);b.spawnAt=this.time.now;
      const angle=Phaser.Math.Angle.Between(b.x,b.y,this.player.x,this.player.y-55);
      this.physics.velocityFromRotation(angle,speed,b.body.velocity);
      b.rotation=angle;
      this.burst(b.x,b.y,P.orange,3);
    }

    hitPlayer(bullet){
      if(!bullet.active||this.player.invulnerableUntil>this.time.now)return;
      bullet.destroy();
      this.player.invulnerableUntil=this.time.now+850;
      this.health--;
      this.cameras.main.shake(120,.012);this.cameras.main.flash(100,255,40,70,false);
      this.player.setTintFill(0xffffff);this.time.delayedCall(95,()=>this.player.active&&this.player.clearTint());
      this.flashWord('HIT!');
      if(this.health<=0)this.endGame();
    }

    touchEnemy(enemy){
      if(!enemy.active||this.player.invulnerableUntil>this.time.now)return;
      this.player.invulnerableUntil=this.time.now+700;this.health--;
      this.player.setVelocityY(-220);this.player.setVelocityX(this.player.x<enemy.x?-190:190);
      this.cameras.main.shake(90,.008);
      if(this.health<=0)this.endGame();
    }

    collectPickup(p){
      if(!p.active)return;
      this.coins++;this.score+=50;this.addRage(8*this.stats.rageGain);
      this.burst(p.x,p.y,P.lime,8);p.destroy();
    }

    burst(x,y,color,count){
      for(let i=0;i<count;i++){
        const size=Phaser.Math.Between(3,9);
        const r=this.add.rectangle(x,y,size,size,color,1).setDepth(30).setAngle(Phaser.Math.Between(0,180));
        const a=Phaser.Math.FloatBetween(-Math.PI,Math.PI),dist=Phaser.Math.Between(25,100);
        this.tweens.add({targets:r,x:x+Math.cos(a)*dist,y:y+Math.sin(a)*dist,angle:r.angle+Phaser.Math.Between(80,320),alpha:0,duration:Phaser.Math.Between(240,520),ease:'Quad.easeOut',onComplete:()=>r.destroy()});
      }
    }

    flashWord(text){
      this.toast.setText(text).setAlpha(1).setScale(.55).setAngle(Phaser.Math.Between(-4,4));
      this.tweens.killTweensOf(this.toast);
      this.tweens.add({targets:this.toast,scale:1.12,duration:120,ease:'Back.easeOut',yoyo:true,hold:170,onComplete:()=>this.tweens.add({targets:this.toast,alpha:0,duration:180})});
    }

    cleanup(){
      const left=this.player.x-1000;
      [this.tanks,this.choppers,this.bullets,this.pickups].forEach(group=>group.getChildren().slice().forEach(o=>{
        if(o.active&&(o.x<left||o.x>this.player.x+1800||o.y>620||o.y<-100))o.destroy();
      }));
      this.buildings.getChildren().slice().forEach(o=>{if(o.active&&o.x<left)o.destroy();});
    }

    updateHUD(){
      this.scoreText.setText(`SCORE ${String(Math.floor(this.score)).padStart(6,'0')}`);
      this.distanceText.setText(`DIST ${Math.max(0,Math.floor((this.player.x-135)/10))}m   •   COINS ${this.coins}`);
      this.healthText.setText(`HP ${'♥'.repeat(Math.max(0,this.health))}`);
      this.comboText.setText(`SMASHED ${this.destroyed}`);
      const rageActive=this.rageUntil>this.time.now;
      const pct=rageActive?Math.ceil((this.rageUntil-this.time.now)/65):Math.floor(this.rage);
      this.rageFill.width=168*Phaser.Math.Clamp((rageActive?100:this.rage)/100,0,1);
      this.rageFill.fillColor=rageActive?P.lime:P.pink;
      this.rageText.setText(rageActive?`${Math.max(0,pct/10).toFixed(1)}s`:`${Math.floor(this.rage)}%`);
    }

    endGame(victory=false){
      if(this.gameOver)return;
      this.gameOver=true;this.physics.pause();
      const cam=this.cameras.main;
      const x=cam.scrollX+RR.width/2;
      this.add.rectangle(x,RR.height/2,RR.width,RR.height,0x030006,.78).setDepth(190);
      const title=this.add.text(x,176,victory?'CITY WRECKED':'RAMPAGE OVER',{fontFamily:'Arial Black',fontSize:'44px',color:victory?'#baff39':'#ff2bd6',stroke:'#000',strokeThickness:10}).setOrigin(.5).setDepth(200);
      this.add.text(x,245,`SCORE ${Math.floor(this.score)}\n${this.destroyed} TARGETS DESTROYED  •  ${this.coins} COINS`,{fontFamily:'Arial Black',fontSize:'17px',align:'center',color:'#fff',stroke:'#000',strokeThickness:6,lineSpacing:8}).setOrigin(.5).setDepth(200);
      const again=this.add.rectangle(x,340,260,58,P.pink,1).setStrokeStyle(4,0xffffff).setDepth(200).setInteractive({useHandCursor:true});
      this.add.text(x,340,'RAMPAGE AGAIN',{fontFamily:'Arial Black',fontSize:'22px',color:'#fff',stroke:'#000',strokeThickness:6}).setOrigin(.5).setDepth(201);
      const choose=this.add.rectangle(x,414,260,48,0x13091b,1).setStrokeStyle(3,0xffffff).setDepth(200).setInteractive({useHandCursor:true});
      this.add.text(x,414,'CHANGE CHARACTER',{fontFamily:'Arial Black',fontSize:'15px',color:'#fff',stroke:'#000',strokeThickness:5}).setOrigin(.5).setDepth(201);
      again.on('pointerdown',()=>this.scene.restart({character:this.character}));
      choose.on('pointerdown',()=>this.scene.start('Menu'));
      this.submitScore();
    }

    submitScore(){
      fetch('/api/submit-score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'PLAYER',score:Math.floor(this.score),character:this.character})}).catch(()=>{});
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent:'game',
    width:RR.width,
    height:RR.height,
    backgroundColor:'#06020a',
    render:{antialias:true,roundPixels:true,powerPreference:'high-performance'},
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:1050},debug:false}},
    scene:[BootScene,MenuScene,GameScene]
  });
  window.RR2Game=game;
})();
