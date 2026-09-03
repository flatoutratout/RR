(() => {
  const state={scene:null,patched:false};

  function targetHit(scene,obj,zone){
    if(!obj||!obj.active)return false;
    let b;
    try{b=obj.getBounds();}catch(_){return false;}
    return Phaser.Geom.Intersects.RectangleToRectangle(zone,b);
  }

  function patchScene(s){
    if(!s||s.__rrCombatFixed)return;
    s.__rrCombatFixed=true;

    s.doSmash=function(time){
      if(this.gameOver)return;
      if(time-this.lastSmash<300)return;
      this.lastSmash=time;

      const rage=this.rageUntil>time;
      const dir=this.player.flipX?-1:1;
      const power=rage?3:1;
      const reach=rage?210:155;
      const height=rage?250:190;
      const frontX=this.player.x+dir*(reach*.42);
      const zone=new Phaser.Geom.Rectangle(frontX-reach/2,this.player.y-height,reach,height+45);

      this.cameras.main.shake(rage?125:70,rage?.008:.004);
      this.burst(this.player.x+dir*45,this.player.y-48,rage?window.RR2.palette.pink:window.RR2.palette.orange,rage?18:11);
      this.word(rage?'RAGE SMASH!':'SMASH!');

      const hit=(group,building)=>{
        if(!group||!group.getChildren)return;
        group.getChildren().slice().forEach(o=>{
          if(!targetHit(this,o,zone))return;
          o.hp=(o.hp||1)-power;
          if(o.setTintFill)o.setTintFill(0xffffff);
          this.time.delayedCall(65,()=>{if(o.active&&o.clearTint)o.clearTint();});
          const oy=o.originY===1?o.y-o.displayHeight*.42:o.y;
          this.burst(o.x,oy,window.RR2.palette.cyan,7);
          if(o.hp<=0){
            if(building)this.killBuilding(o);else this.killEnemy(o);
          }
        });
      };

      hit(this.buildings,true);
      hit(this.tanks,false);
      hit(this.choppers,false);
    };

    const smashBtn=document.querySelector('#mobile-controls [data-control="smash"]');
    if(smashBtn&&!smashBtn.dataset.rrCombatBound){
      smashBtn.dataset.rrCombatBound='1';
      smashBtn.addEventListener('pointerdown',e=>{
        e.preventDefault();
        const game=window.RR2Game;
        const scene=game&&game.scene?game.scene.getScene('Game'):null;
        if(scene&&scene.sys&&scene.sys.isActive()&&!scene.gameOver)scene.doSmash(scene.time.now);
      },{passive:false});
    }
  }

  function tick(){
    const game=window.RR2Game;
    if(!game||!game.scene)return;
    const s=game.scene.getScene('Game');
    if(!s||!s.sys||!s.sys.isActive()||!s.player)return;
    if(state.scene!==s){state.scene=s;state.patched=false;}
    if(!state.patched){patchScene(s);state.patched=true;}
  }

  setInterval(tick,80);
})();