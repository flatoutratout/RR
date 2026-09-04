(() => {
  const RR=window.RR2;

  function rebuildStreet(scene){
    if(scene.__rrWorldV6)return;
    scene.__rrWorldV6=true;
    scene.children.list.slice().forEach(o=>{if(o&&o.type==='Graphics'&&o.depth>=-5&&o.depth<=-4)o.destroy();});
    const y=RR.floorY,W=RR.width,g=scene.add.graphics().setScrollFactor(0).setDepth(-4);
    g.fillStyle(0x080a0f,1).fillRect(0,y-2,W,74);g.fillStyle(0x10141b,1).fillRect(0,y+22,W,50);
    g.fillStyle(0x45464d,1).fillRect(0,y-8,W,13);g.fillStyle(0x777982,1).fillRect(0,y-8,W,2);g.fillStyle(0x282930,1).fillRect(0,y+5,W,8);g.fillStyle(0x111319,1).fillRect(0,y+13,W,8);g.fillStyle(0x555760,.75).fillRect(0,y+13,W,2);
    const slabs=[0,104,222,344,455,580,705,824,960];g.lineStyle(1,0x18191e,.95);for(let i=0;i<slabs.length;i++){const x=slabs[i];g.lineBetween(x,y-7,x+(i%2?2:-2),y+12);}g.lineStyle(1,0x5d5f68,.22).lineBetween(0,y-2,W,y-2);
    [[61,0,12],[172,4,18],[397,1,10],[635,5,15],[781,2,11],[918,5,14]].forEach(([x,dy,w])=>{g.fillStyle(0x1e2025,.7).fillEllipse(x,y+dy,w,2);});
    [134,492,826].forEach(x=>{g.fillStyle(0x050609,1).fillRoundedRect(x,y+14,55,6,1);g.lineStyle(1,0x696b73,.65).strokeRoundedRect(x,y+14,55,6,1);for(let d=6;d<52;d+=7)g.lineBetween(x+d,y+15,x+d,y+19);});
    g.lineStyle(1,0x202631,.55).lineBetween(0,y+44,W,y+44);
    [354,718].forEach(x=>{g.fillStyle(0x131820,1).fillEllipse(x,y+51,43,11);g.lineStyle(1,0x565b65,.72).strokeEllipse(x,y+51,43,11);g.lineStyle(1,0x303640,.8).strokeEllipse(x,y+51,31,7);});
    [[42,0xff2bd6,110],[226,0x35e7ff,90],[438,0xbaff39,100],[646,0xff2bd6,92],[836,0x35e7ff,105]].forEach(([x,c,w])=>{g.fillStyle(c,.12).fillRect(x,y+27,w,2);g.fillStyle(c,.07).fillRect(x+16,y+32,w*.68,2);});
  }

  function fixBuildingBodies(scene){
    if(!scene.buildings)return;
    scene.buildings.getChildren().forEach(b=>{
      if(!b.active||!b.body)return;
      const stamp=`tight:${b.displayWidth|0}:${b.displayHeight|0}`;
      if(b.__rrBodyStamp===stamp)return;
      b.__rrBodyStamp=stamp;
      // The PNG contains substantial transparent side padding. Use only the visible tower core.
      // 42% width leaves the collision edge close to the rendered facade instead of the canvas edge.
      b.body.setSize(b.width*.42,b.height*.86,false);
      b.body.setOffset(b.width*.29,b.height*.14);
      if(b.body.updateFromGameObject)b.body.updateFromGameObject();
    });
  }

  const timer=setInterval(()=>{
    const game=window.RR2Game;if(!game||!game.scene)return;
    const s=game.scene.getScene('Game');if(!s||!s.sys||!s.sys.isActive()||!s.player)return;
    rebuildStreet(s);fixBuildingBodies(s);
  },80);
})();