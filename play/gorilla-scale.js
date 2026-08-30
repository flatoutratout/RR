// Gorilla V1 preview gameplay-fit patch.
(function () {
  const GORILLA_SCALE = 0.92;
  const TIGHT_KEYS = new Set();

  function buildTightTexture(scene, sourceKey) {
    const tightKey = `${sourceKey}_tight`;
    if (TIGHT_KEYS.has(tightKey) || scene.textures.exists(tightKey)) { TIGHT_KEYS.add(tightKey); return tightKey; }
    const tex = scene.textures.get(sourceKey);
    const source = tex && tex.getSourceImage ? tex.getSourceImage() : null;
    if (!source || !source.width || !source.height) return sourceKey;

    const scan = document.createElement('canvas');
    scan.width = source.width; scan.height = source.height;
    const ctx = scan.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0,0,scan.width,scan.height); ctx.drawImage(source,0,0);

    let img;
    try { img = ctx.getImageData(0,0,scan.width,scan.height); } catch(e) { return sourceKey; }
    const data = img.data, w0 = scan.width, h0 = scan.height;
    const seen = new Uint8Array(w0*h0);
    let best = [], bestCount = 0;

    for (let y=0; y<h0; y++) {
      for (let x=0; x<w0; x++) {
        const start = y*w0+x;
        if (seen[start] || data[start*4+3] <= 40) continue;
        const stack=[start], comp=[]; seen[start]=1;
        while(stack.length){
          const p=stack.pop(); comp.push(p);
          const px=p%w0, py=(p/w0)|0;
          for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){
            if(!ox&&!oy) continue;
            const nx=px+ox, ny=py+oy;
            if(nx<0||ny<0||nx>=w0||ny>=h0) continue;
            const np=ny*w0+nx;
            if(!seen[np] && data[np*4+3] > 40){ seen[np]=1; stack.push(np); }
          }
        }
        if(comp.length>bestCount){ best=comp; bestCount=comp.length; }
      }
    }

    if (!bestCount) return sourceKey;
    const keep = new Uint8Array(w0*h0);
    let minX=w0,minY=h0,maxX=-1,maxY=-1;
    for(const p of best){
      keep[p]=1; const x=p%w0, y=(p/w0)|0;
      if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
    }

    const bw=maxX-minX+1, bh=maxY-minY+1;
    if (bw < 60 || bh < 60 || bestCount < 1200) return sourceKey;

    for(let p=0;p<keep.length;p++) if(!keep[p]) data[p*4+3]=0;
    ctx.putImageData(img,0,0);

    const pad=2;
    minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad);
    maxX=Math.min(w0-1,maxX+pad); maxY=Math.min(h0-1,maxY+pad);
    const w=maxX-minX+1,h=maxY-minY+1;
    const cropped=scene.textures.createCanvas(tightKey,w,h);
    const cctx=cropped.getContext();
    cctx.clearRect(0,0,w,h); cctx.drawImage(scan,minX,minY,w,h,0,0,w,h);
    cropped.refresh(); TIGHT_KEYS.add(tightKey); return tightKey;
  }

  function useTightGorillaTexture(action){
    if(!player||selectedCharacter!=='gorilla') return;
    const scene=player.scene;
    let sourceKey=`gorilla_${action}`;
    let tightKey=buildTightTexture(scene,sourceKey);
    const tex=scene.textures.get(tightKey);
    const frame=tex && tex.get ? tex.get() : null;
    if(action==='jump' && (!frame || frame.width<60 || frame.height<60)){
      sourceKey='gorilla_smash';
      tightKey=buildTightTexture(scene,sourceKey);
    }
    if(scene.textures.exists(tightKey)) player.setTexture(tightKey);
  }

  function fitGorillaBody(){
    if(!player||selectedCharacter!=='gorilla'||!player.body)return;
    const frameW=Math.max(1,player.width||1),frameH=Math.max(1,player.height||1);
    player.body.setSize(Math.max(38,Math.min(frameW*.52,frameW-6)),Math.max(54,Math.min(frameH*.80,frameH-4)),true);
  }

  const originalStartGame=startGame;
  startGame=function(chosen){
    originalStartGame(chosen);
    if(selectedCharacter!=='gorilla'||!player)return;
    const scene=player.scene;
    useTightGorillaTexture('idle'); player.setScale(GORILLA_SCALE); player.baseScale=GORILLA_SCALE; fitGorillaBody();
    if(scene?.cameras?.main){scene.cameras.main.setDeadzone(250,120);scene.cameras.main.setFollowOffset(-165,0);}
    if(buildings?.children)buildings.children.iterate(b=>{if(b?.body)b.body.enable=false;});
    if(choppers?.children)choppers.children.iterate(c=>{if(c?.body){c.body.setSize(96,42,true);c.body.allowGravity=false;}});
  };

  const originalSetPlayerAction=setPlayerAction;
  setPlayerAction=function(action){
    originalSetPlayerAction(action);
    if(selectedCharacter==='gorilla'&&player){
      useTightGorillaTexture(action); player.setScale(GORILLA_SCALE); player.baseScale=GORILLA_SCALE; player.setAngle(0); fitGorillaBody();
    }
  };

  const originalUpdate=update;
  update=function(time,delta){
    if(selectedCharacter==='gorilla'&&player){
      if(buildings?.children)buildings.children.iterate(b=>{if(b?.body)b.body.enable=false;});
      if(choppers?.children)choppers.children.iterate(c=>{if(c?.body){c.body.setSize(96,42,true);c.body.allowGravity=false;}});
    }
    return originalUpdate.call(this,time,delta);
  };

  const originalDoSmash=doSmash;
  doSmash=function(scene){
    if(selectedCharacter==='gorilla'&&choppers&&player?.body){
      const dir=player.flipX?-1:1;
      choppers.children.iterate(c=>{
        if(!c?.active)return;
        const dx=(c.x-player.x)*dir,dy=Math.abs(c.y-(player.y-70));
        if(dx>=-10&&dx<=145&&dy<=155){
          c.hp=(c.hp||1)-1;
          if(c.hp<=0){const cx=c.x,cy=c.y;c.disableBody(true,true);addScore(c.enemyType==='elite'?150:90);addRage(22);burst(scene,cx,cy,0xff66ff);floatText(scene,cx,cy-30,'WRECKED!','#ff66ff');}
        }
      });
    }
    return originalDoSmash.call(this,scene);
  };
})();
