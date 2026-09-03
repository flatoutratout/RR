(() => {
  // Visual-only foreground deck. Deliberately does not touch physics, input, HUD or spawning.
  const state = { scene:null, nextX:0 };
  const CHUNK = 640;

  function addChunk(s,x){
    const y = window.RR2.floorY;
    const depth = -7; // above backdrop/road, behind all actors and buildings

    // Pavement top: broad enough to visibly carry the characters.
    s.add.rectangle(x + CHUNK/2, y + 13, CHUNK, 30, 0x292731, 1).setDepth(depth);
    s.add.rectangle(x + CHUNK/2, y + 1, CHUNK, 5, 0xd2ced8, .82).setDepth(depth + .1);
    s.add.rectangle(x + CHUNK/2, y + 5, CHUNK, 4, 0x77727e, .72).setDepth(depth + .1);

    // Kerb + deep street/platform face. This is the visual mass future gaps will cut through.
    s.add.rectangle(x + CHUNK/2, y + 32, CHUNK, 10, 0x15141b, 1).setDepth(depth);
    s.add.rectangle(x + CHUNK/2, y + 72, CHUNK, 72, 0x0b0a10, .98).setDepth(depth);
    s.add.rectangle(x + CHUNK/2, y + 39, CHUNK, 3, 0x423d49, .8).setDepth(depth + .1);

    // Concrete slab joints and small neon reflections so it reads as pavement, not a flat bar.
    for(let i=0;i<8;i++){
      const sx=x+i*80;
      s.add.rectangle(sx,y+14,2,25,0x111017,.9).setDepth(depth+.2);
    }
    const cyan=(Math.floor(x/CHUNK)%2)===0;
    const glow=cyan?0x35e7ff:0xff2bd6;
    s.add.rectangle(x+155,y+22,112,3,glow,.22).setDepth(depth+.3);
    s.add.rectangle(x+475,y+21,86,2,glow,.16).setDepth(depth+.3);

    // Recessed panels in the platform face give it thickness without adding gameplay objects.
    for(let i=0;i<3;i++){
      const px=x+105+i*210;
      s.add.rectangle(px,y+70,124,45,0x050508,1).setStrokeStyle(2,0x24212b,.9).setDepth(depth+.2);
      s.add.rectangle(px,y+51,82,2,glow,.13).setDepth(depth+.3);
    }
  }

  function tick(){
    const game=window.RR2Game;
    if(!game||!game.scene)return;
    const s=game.scene.getScene('Game');
    if(!s||!s.sys||!s.sys.isActive()||!s.player)return;
    if(state.scene!==s){ state.scene=s; state.nextX=0; }
    const ahead=s.player.x+1800;
    while(state.nextX<ahead){ addChunk(s,state.nextX); state.nextX+=CHUNK; }
  }

  setInterval(tick,120);
})();