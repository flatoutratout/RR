(() => {
  function install(scene){
    if(!scene||scene.__rrStreetV4||!scene.player)return;
    scene.__rrStreetV4=true;
    const RR=window.RR2,y=RR.floorY,W=RR.width;
    const g=scene.add.graphics().setScrollFactor(0).setDepth(-4);

    // Hide the old prototype slab completely.
    g.fillStyle(0x07080c,1).fillRect(0,y-8,W,86);

    // Proper stone pavement: individual slabs with irregular seams.
    g.fillStyle(0x34343b,1).fillRect(0,y-8,W,17);
    g.fillStyle(0x777985,1).fillRect(0,y-8,W,2);
    g.fillStyle(0x202127,1).fillRect(0,y+7,W,4);
    g.lineStyle(1,0x111217,.95);
    const joints=[0,92,205,318,427,548,660,777,886,960];
    joints.forEach((x,i)=>{
      g.lineBetween(x,y-7,x+(i%2?2:-2),y+7);
      if(i<joints.length-1){
        const mid=(x+joints[i+1])/2;
        g.lineStyle(1,0x4a4b53,.35).lineBetween(x+5,y-4,joints[i+1]-5,y-4);
        if(i%3===1)g.fillStyle(0x17181c,.8).fillEllipse(mid,y+1,20,3);
      }
    });

    // Deep kerb face with a believable lip/shadow.
    g.fillStyle(0x15161b,1).fillRect(0,y+11,W,9);
    g.fillStyle(0x090a0e,1).fillRect(0,y+20,W,58);
    g.fillStyle(0x3d3f48,.8).fillRect(0,y+11,W,2);
    g.fillStyle(0x050609,.95).fillRect(0,y+18,W,3);

    // Wet asphalt: subtle bands, cracks and reflections instead of boxes.
    g.fillStyle(0x0d1016,1).fillRect(0,y+21,W,57);
    g.lineStyle(1,0x1d222b,.75).lineBetween(0,y+48,W,y+48);
    g.lineStyle(1,0x080a0e,.9).lineBetween(0,y+73,W,y+73);
    const cracks=[[74,34,99,38,113,35],[286,61,304,57,329,62],[610,30,628,34,647,31],[824,66,842,61,869,64]];
    cracks.forEach(p=>{g.lineStyle(1,0x030405,.9);g.beginPath();g.moveTo(p[0],y+p[1]);g.lineTo(p[2],y+p[3]);g.lineTo(p[4],y+p[5]);g.strokePath();});

    // Storm drains built into the kerb.
    [148,514,846].forEach(x=>{
      g.fillStyle(0x030406,1).fillRoundedRect(x,y+12,50,7,1);
      g.lineStyle(1,0x666873,.7).strokeRoundedRect(x,y+12,50,7,1);
      for(let d=6;d<47;d+=7)g.lineBetween(x+d,y+13,x+d,y+18);
    });

    // Manhole covers and wet neon reflected into the road.
    [365,735].forEach(x=>{
      g.fillStyle(0x11141a,1).fillEllipse(x,y+53,42,10);
      g.lineStyle(1,0x4a4e58,.75).strokeEllipse(x,y+53,42,10);
      g.lineStyle(1,0x272b33,.8).strokeEllipse(x,y+53,31,6);
    });
    const refs=[[54,0xff2bd6,92],[245,0x35e7ff,72],[455,0xbaff39,88],[670,0xff2bd6,76],[858,0x35e7ff,82]];
    refs.forEach(([x,c,w])=>{
      g.fillStyle(c,.12).fillRect(x,y+27,w,2);
      g.fillStyle(c,.07).fillRect(x+10,y+31,w*.7,1);
      g.fillStyle(c,.045).fillRect(x+22,y+36,w*.4,1);
    });
  }

  const timer=setInterval(()=>{
    const game=window.RR2Game;if(!game||!game.scene)return;
    const s=game.scene.getScene('Game');
    if(s&&s.sys&&s.sys.isActive()&&s.player){install(s);clearInterval(timer);}
  },60);
})();