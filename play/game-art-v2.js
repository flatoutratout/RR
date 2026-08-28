// Rainbow Rampage — GAME ART V2 gameplay treatment
// Preview-only visual layer. No gameplay/physics changes.
(function(){
  const COLORS=[0xff245f,0xff9d00,0xffef21,0x55ff35,0x19e8ff,0x8c55ff,0xff28d7];
  function boot(){
    if(!window.game||!game.scene){return setTimeout(boot,150);}
    const scenes=game.scene.scenes||[]; const s=scenes[0];
    if(!s||!s.add||!s.cameras){return setTimeout(boot,150);}
    if(s.__artV2)return; s.__artV2=true;

    // Deep neon night sky / city silhouette. Kept behind the existing world art.
    const far=s.add.graphics().setScrollFactor(.05).setDepth(-40);
    far.fillStyle(0x05020d,1).fillRect(0,0,960,540);
    for(let i=0;i<85;i++){
      const x=(i*137)%960,y=25+((i*83)%300),r=(i%3)+1;
      far.fillStyle(COLORS[i%COLORS.length],.35+(i%4)*.1).fillCircle(x,y,r);
    }
    const city=s.add.graphics().setScrollFactor(.12).setDepth(-35);
    let x=-30;
    for(let i=0;i<34;i++){
      const w=35+(i*19)%55,h=70+(i*47)%190;
      city.fillStyle(i%2?0x100b1b:0x0a0713,1).fillRect(x,430-h,w,h);
      city.lineStyle(2,COLORS[i%COLORS.length],.22).strokeRect(x,430-h,w,h);
      for(let wy=440-h;wy<415;wy+=24) for(let wx=x+10;wx<x+w-7;wx+=18){
        if(((wx+wy+i)|0)%3) city.fillStyle(COLORS[(i+wy)%COLORS.length],.35).fillRect(wx,wy,5,8);
      }
      x+=w+7;
    }
    const haze=s.add.graphics().setScrollFactor(0).setDepth(80);
    haze.fillStyle(0xff00c8,.025).fillRect(0,0,960,540);
    haze.lineStyle(2,0x18eaff,.045);
    for(let y=8;y<540;y+=9)haze.lineBetween(0,y,960,y);

    // Arcade frame makes the game feel intentionally authored rather than raw canvas.
    const frame=s.add.graphics().setScrollFactor(0).setDepth(89);
    frame.lineStyle(5,0x000000,.9).strokeRect(3,3,954,534);
    frame.lineStyle(2,0xff25d5,.45).strokeRect(8,8,944,524);
    frame.lineStyle(1,0x19e8ff,.4).strokeRect(12,12,936,516);

    // Speed streaks: wake up only once play starts / camera begins travelling.
    const streaks=[];
    for(let i=0;i<18;i++){
      const g=s.add.rectangle(-100,80+(i*29)%390,60+(i*41)%180,2,COLORS[i%COLORS.length],.0).setScrollFactor(0).setDepth(70).setOrigin(0,.5);
      streaks.push(g);
    }
    s.events.on('update',()=>{
      const cam=s.cameras.main, moving=(cam.scrollX||0)>15;
      streaks.forEach((g,i)=>{
        g.alpha=moving?.08+(i%4)*.025:0;
        g.x+=10+(i%5)*4;
        if(g.x>980){g.x=-220;g.y=70+Math.random()*390;}
      });
    });

    // Big graffiti-style game title watermark in the world.
    const stamp=s.add.text(760,390,'RAMPAGE',{fontFamily:'Impact, Arial Black',fontSize:'72px',fontStyle:'italic',color:'#ffffff',stroke:'#000000',strokeThickness:12}).setOrigin(.5).setScrollFactor(.18).setDepth(-30).setAlpha(.08).setAngle(-7);
    s.add.text(760,442,'NO BRAKES // ALL CHAOS',{fontFamily:'Arial Black',fontSize:'16px',color:'#fff200',stroke:'#000',strokeThickness:5}).setOrigin(.5).setScrollFactor(.18).setDepth(-30).setAlpha(.18).setAngle(-7);

    // Punch up loaded gameplay textures without touching bodies or mechanics.
    s.events.on('update',()=>{
      const list=s.children&&s.children.list?s.children.list:[];
      list.forEach(o=>{
        if(!o||o.__v2t||!o.texture||!o.texture.key)return;
        const k=o.texture.key;
        if(/^(gorilla|croc|cow|eagle)(_|$)/.test(k)){
          o.__v2t=1; if(o.setTint)o.setTint(0xffffff); if(o.setPipeline){};
        } else if(k==='tank'||k==='chopper'){
          o.__v2t=1; if(o.setTint)o.setTint(k==='tank'?0xfff06a:0x7fefff);
        } else if(k==='coin'){
          o.__v2t=1; if(o.setTint)o.setTint(0xffe43b);
        }
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300)); else setTimeout(boot,300);
})();