(() => {
  function install(scene){
    if(!scene||scene.__rrStreetV4||!scene.player)return;
    scene.__rrStreetV4=true;
    const y=window.RR2.floorY;

    // Cover the old oversized slab with a much shallower street treatment.
    const g=scene.add.graphics().setScrollFactor(0).setDepth(-4);
    g.fillStyle(0x0b0b10,1).fillRect(0,y-7,window.RR2.width,79);

    // Narrow concrete pavement / kerb directly under actors.
    g.fillStyle(0x34323a,1).fillRect(0,y-7,window.RR2.width,12);
    g.fillStyle(0x77727d,1).fillRect(0,y-7,window.RR2.width,2);
    g.fillStyle(0x1b1a20,1).fillRect(0,y+5,window.RR2.width,8);
    g.fillStyle(0x050507,1).fillRect(0,y+13,window.RR2.width,59);

    // Road surface detail: subtle seams, short lane glints and drains.
    g.lineStyle(1,0x25232b,.9);
    g.lineBetween(0,y+31,window.RR2.width,y+31);
    g.lineBetween(0,y+58,window.RR2.width,y+58);
    for(let x=0;x<window.RR2.width;x+=155){
      g.lineStyle(1,0x302d36,.65).lineBetween(x,y+14,x,y+71);
    }
    for(let x=55,i=0;x<window.RR2.width;x+=235,i++){
      const c=[0xff2bd6,0x35e7ff,0xbaff39][i%3];
      g.fillStyle(c,.16).fillRect(x,y+38,72,2);
    }
    for(let x=130;x<window.RR2.width;x+=330){
      g.fillStyle(0x020203,1).fillRoundedRect(x,y+17,46,7,2);
      g.lineStyle(1,0x4a4650,.7).strokeRoundedRect(x,y+17,46,7,2);
      for(let d=5;d<42;d+=7)g.lineBetween(x+d,y+19,x+d,y+22);
    }
  }

  const timer=setInterval(()=>{
    const game=window.RR2Game;
    if(!game||!game.scene)return;
    const s=game.scene.getScene('Game');
    if(s&&s.sys&&s.sys.isActive()&&s.player){install(s);clearInterval(timer);}
  },60);
})();