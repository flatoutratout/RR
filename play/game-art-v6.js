// Rainbow Rampage — GAME ART V6
// High-detail raster-style Canvas textures, built at runtime. No SVG programmer-art.
(function(){
  const seeded=(seed)=>{let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)};
  const rnd=seeded(0x52414d50);
  const R=(a,b)=>a+Math.floor(rnd()*(b-a+1));

  function wait(){
    if(!window.game||!game.scene||!game.scene.scenes||!game.scene.scenes[0]) return setTimeout(wait,60);
    const s=game.scene.scenes[0];
    if(!s.textures||!s.add) return setTimeout(wait,60);
    if(s.__rrV6) return; s.__rrV6=true;

    // Remove the crude V5 feel by hiding most generated geometric world decoration.
    // The replacement scenic texture carries the skyline/street itself.
    try {
      (s.children.list||[]).forEach(o=>{
        if(!o) return;
        if(o.type==='Rectangle' && o.depth>0 && o.depth<3 && o.width<500 && o.height>40) o.setAlpha(0);
      });
    } catch(e){}

    const make=(key,w,h,paint)=>{
      if(s.textures.exists(key)) s.textures.remove(key);
      const t=s.textures.createCanvas(key,w,h); paint(t.context,w,h); t.refresh(); return t;
    };
    const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
    const ellipse=(c,x,y,rx,ry,fill,stroke=null,lw=1)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};

    // ---- CINEMATIC SUNSET CITY -------------------------------------------------
    make('rr6_sky',960,540,(c,w,h)=>{
      let g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#11164e');g.addColorStop(.38,'#59265e');g.addColorStop(.68,'#d85b55');g.addColorStop(1,'#251927');c.fillStyle=g;c.fillRect(0,0,w,h);
      let sun=c.createRadialGradient(515,280,10,515,280,255);sun.addColorStop(0,'rgba(255,229,137,.75)');sun.addColorStop(.28,'rgba(255,164,91,.28)');sun.addColorStop(1,'rgba(255,70,80,0)');c.fillStyle=sun;c.fillRect(0,0,w,h);
      // painterly clouds
      for(let i=0;i<34;i++){c.save();c.globalAlpha=.025+(i%5)*.012;c.fillStyle=i%2?'#ffd0c9':'#d690bd';c.translate((i*173)%1060-50,55+(i%8)*27);c.rotate(-.06+(i%3)*.025);c.beginPath();c.ellipse(0,0,80+(i%5)*30,7+(i%4)*4,0,0,Math.PI*2);c.fill();c.restore();}
      // distant skyline
      let x=-18,idx=0;while(x<w+40){let bw=38+(idx*17)%42,bh=95+(idx*47)%190,y=470-bh;c.fillStyle=idx%2?'#26243f':'#20203a';c.fillRect(x,y,bw,bh);if(idx%5===0){c.beginPath();c.moveTo(x+bw*.2,y);c.lineTo(x+bw*.5,y-28);c.lineTo(x+bw*.8,y);c.fill();}for(let yy=y+18;yy<458;yy+=25)for(let xx=x+9;xx<x+bw-5;xx+=17){if(((xx+yy+idx)>>2)%3){c.fillStyle=((xx+yy)%5===0)?'rgba(255,190,84,.48)':'rgba(74,72,103,.45)';c.fillRect(xx,yy,5,9);}}x+=bw+9;idx++;}
      // nearer battered blocks
      x=-45;idx=0;while(x<w+80){let bw=95+(idx*21)%65,bh=125+(idx*53)%160,y=505-bh;c.fillStyle=idx%2?'#171621':'#1d1a25';c.fillRect(x,y,bw,bh);c.strokeStyle='#0a0910';c.lineWidth=7;c.strokeRect(x,y,bw,bh);c.fillStyle='rgba(255,255,255,.06)';c.fillRect(x+7,y+8,8,bh-15);for(let yy=y+27;yy<490;yy+=38)for(let xx=x+18;xx<x+bw-12;xx+=31){c.fillStyle=((xx+yy+idx)%7<2)?'rgba(255,182,70,.75)':'rgba(57,60,76,.72)';c.fillRect(xx,yy,11,17);}x+=bw-4;idx++;}
      // atmospheric haze
      let hz=c.createLinearGradient(0,310,0,495);hz.addColorStop(0,'rgba(255,115,105,0)');hz.addColorStop(.7,'rgba(255,112,94,.09)');hz.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=hz;c.fillRect(0,280,w,220);
      // pavement
      c.fillStyle='#17161d';c.fillRect(0,458,w,82);c.fillStyle='#58505a';c.fillRect(0,458,w,14);c.fillStyle='#9b8f94';c.fillRect(0,468,w,4);c.strokeStyle='#08080b';c.lineWidth=4;for(let xx=-40;xx<w+80;xx+=95){c.beginPath();c.moveTo(xx,474);c.lineTo(xx+40,540);c.stroke();c.beginPath();c.moveTo(xx+50,474);c.lineTo(xx+105,540);c.stroke();}
      // cracks and rubble
      for(let i=0;i<46;i++){let sx=R(0,960),sy=R(480,535);c.strokeStyle='rgba(5,5,8,.72)';c.lineWidth=R(1,3);c.beginPath();c.moveTo(sx,sy);for(let j=0;j<R(2,5);j++){sx+=R(-20,23);sy+=R(4,13);c.lineTo(sx,sy);}c.stroke();}
      // film grain
      c.globalAlpha=.06;for(let i=0;i<7500;i++){let v=R(150,255);c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(R(0,w),R(0,h),1,1);}c.globalAlpha=1;
    });

    // ---- PAINTERLY GORILLA ------------------------------------------------------
    function gorilla(act){
      make('rr6_gorilla_'+act,600,600,(c,w,h)=>{
        const jump=act==='jump', smash=act==='smash', run=act==='run1'||act==='run2', oy=jump?-32:0, lean=smash?18:0;
        c.lineCap='round';c.lineJoin='round';
        if(smash){let eg=c.createRadialGradient(310,330,15,310,330,235);eg.addColorStop(0,'rgba(255,126,25,.32)');eg.addColorStop(.55,'rgba(255,47,65,.08)');eg.addColorStop(1,'rgba(255,0,0,0)');c.fillStyle=eg;c.fillRect(0,40,600,540);}
        if(run){[['#ff2c72',285],['#ffac28',330],['#28d8ff',375]].forEach((v,i)=>{c.strokeStyle=v[0];c.globalAlpha=.25;c.lineWidth=16-i*3;c.beginPath();c.arc(120,v[1],180,Math.PI*1.06,Math.PI*1.75);c.stroke();});c.globalAlpha=1;}
        // legs
        const legs=[[[245,390+oy],[act==='run1'?185:220,540+oy]],[[360,390+oy],[act==='run2'?425:390,540+oy]]];
        legs.forEach(p=>{c.strokeStyle='#07070a';c.lineWidth=100;c.beginPath();c.moveTo(...p[0]);c.lineTo(...p[1]);c.stroke();c.strokeStyle='#353238';c.lineWidth=74;c.stroke();c.strokeStyle='rgba(190,180,184,.12)';c.lineWidth=13;c.stroke();});
        // torso layered volume
        let body=c.createRadialGradient(292,230+oy,25,310,300+oy,180);body.addColorStop(0,'#6a6268');body.addColorStop(.35,'#403b41');body.addColorStop(.78,'#242126');body.addColorStop(1,'#111014');c.fillStyle='#07070a';ellipse(c,310+lean,302+oy,160,180,'#08080b');ellipse(c,310+lean,300+oy,145,165,body);
        ellipse(c,220+lean,270+oy,92,92,'#38343a');ellipse(c,400+lean,270+oy,92,92,'#38343a');
        // chest planes
        ellipse(c,306+lean,313+oy,83,118,'rgba(113,101,105,.56)');c.strokeStyle='rgba(8,7,10,.45)';c.lineWidth=13;c.beginPath();c.moveTo(305,255+oy);c.lineTo(305,405+oy);c.stroke();
        // arms
        const arms=smash?[[[205,255+oy],[105,458+oy]],[[410,250+oy],[512,438+oy]]]:[[[198,250+oy],[110,430+oy]],[[418,250+oy],[505,420+oy]]];
        arms.forEach((p,ai)=>{c.strokeStyle='#08080b';c.lineWidth=122;c.beginPath();c.moveTo(...p[0]);c.lineTo(...p[1]);c.stroke();c.strokeStyle='#353238';c.lineWidth=94;c.stroke();c.strokeStyle=ai?'rgba(38,211,255,.16)':'rgba(255,57,112,.16)';c.lineWidth=16;c.stroke();});
        // fists + knuckles
        arms.forEach(p=>{let [fx,fy]=p[1];ellipse(c,fx,fy,67,60,'#141318','#07070a',10);for(let k=0;k<4;k++){c.strokeStyle='rgba(140,128,134,.6)';c.lineWidth=7;c.beginPath();c.arc(fx-38+k*25,fy-17,13,Math.PI,0);c.stroke();}});
        // head silhouette and facial volume
        ellipse(c,310+lean,150+oy,119,105,'#09090c');ellipse(c,310+lean,151+oy,103,92,'#39353a');
        // crown/mohawk fur ridge
        c.fillStyle='#151318';c.beginPath();c.moveTo(230+lean,105+oy);c.quadraticCurveTo(310+lean,45+oy,390+lean,106+oy);c.quadraticCurveTo(312+lean,82+oy,230+lean,105+oy);c.fill();
        // brow shelf
        c.fillStyle='#18161a';c.beginPath();c.moveTo(229+lean,142+oy);c.quadraticCurveTo(310+lean,101+oy,391+lean,142+oy);c.lineTo(372+lean,169+oy);c.quadraticCurveTo(310+lean,145+oy,247+lean,170+oy);c.closePath();c.fill();
        // eyes
        [[274,-1],[346,1]].forEach(v=>{let ex=v[0]+lean;c.fillStyle='#07070a';c.beginPath();c.moveTo(ex-27,147+oy);c.lineTo(ex+27,140+oy);c.lineTo(ex+18,165+oy);c.lineTo(ex-19,167+oy);c.closePath();c.fill();ellipse(c,ex,155+oy,10,8,'#ff3a29');ellipse(c,ex-2,153+oy,3,3,'#ffe985');});
        // muzzle and nostrils
        ellipse(c,310+lean,201+oy,73,52,'#8a6657','#171318',8);ellipse(c,282+lean,187+oy,15,12,'#151114');ellipse(c,338+lean,187+oy,15,12,'#151114');
        // roaring mouth
        ellipse(c,310+lean,222+oy,62,38,'#21060a','#100b0d',5);
        // teeth
        c.fillStyle='#f3dfb7';for(let i=0;i<6;i++){let x=267+i*17+lean;c.beginPath();c.moveTo(x,199+oy);c.lineTo(x+14,199+oy);c.lineTo(x+8,220+oy);c.closePath();c.fill();}for(let i=0;i<5;i++){let x=276+i*17+lean;c.beginPath();c.moveTo(x,242+oy);c.lineTo(x+14,242+oy);c.lineTo(x+7,220+oy);c.closePath();c.fill();}
        // ears
        ellipse(c,204+lean,164+oy,28,38,'#6e544e','#111014',8);ellipse(c,416+lean,164+oy,28,38,'#6e544e','#111014',8);
        // dense fur strokes for raster/painterly texture
        c.globalCompositeOperation='source-atop';for(let i=0;i<2450;i++){let x=R(145,472),y=R(80+oy,470+oy);let dx=x-(310+lean),dy=y-(295+oy);if((dx*dx)/(178*178)+(dy*dy)/(205*205)<1 || ((x-310)*(x-310))/(125*125)+((y-(150+oy))*(y-(150+oy)))/(108*108)<1){let len=R(4,15),a=(rnd()-.5)*2.2;c.strokeStyle=i%7===0?'rgba(230,215,220,.10)':i%4===0?'rgba(120,112,118,.16)':'rgba(8,8,11,.22)';c.lineWidth=R(1,3);c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);c.stroke();}}c.globalCompositeOperation='source-over';
        // rainbow paint sprayed across shoulders
        const cols=['#ff2867','#ff931f','#ffdb2e','#39db5f','#22c7ff','#9b43ff'];cols.forEach((col,i)=>{let px=205+i*38,py=300+(i%2)*28+oy;c.fillStyle=col;ellipse(c,px,py,14,10,col);c.globalAlpha=.65;for(let j=0;j<4;j++)ellipse(c,px+R(-24,24),py+R(-24,24),R(2,6),R(2,6),col);c.globalAlpha=1;});
        // chain/medallion
        c.strokeStyle='#ffd044';c.lineWidth=13;c.beginPath();c.arc(310+lean,329+oy,78,.2,Math.PI-.2);c.stroke();ellipse(c,310+lean,382+oy,28,28,'#ffd044','#0b0910',8);ellipse(c,310+lean,382+oy,13,13,'#ff2c82');
        // rim lights
        c.strokeStyle='rgba(255,45,106,.38)';c.lineWidth=9;c.beginPath();c.arc(290,300+oy,165,2.25,3.65);c.stroke();c.strokeStyle='rgba(31,205,255,.4)';c.beginPath();c.arc(330,300+oy,165,-1.0,.72);c.stroke();
        // smash rubble
        if(smash){for(let i=0;i<34;i++){let x=R(45,555),y=R(460,580),r=R(4,15);c.fillStyle=i%6===0?'rgba(255,111,31,.85)':'#41363a';c.beginPath();c.moveTo(x-r,y);c.lineTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.closePath();c.fill();}}
      });
    }
    ['idle','run1','run2','jump','smash'].forEach(gorilla);

    // ---- DESTRUCTIBLE BUILDING --------------------------------------------------
    make('rr6_building',520,700,(c,w,h)=>{
      c.fillStyle='#09080b';rr(c,28,26,464,674,14);c.fill();let g=c.createLinearGradient(50,40,470,690);g.addColorStop(0,'#75615c');g.addColorStop(.45,'#4a3b3d');g.addColorStop(1,'#211d22');c.fillStyle=g;rr(c,44,42,432,658,8);c.fill();
      // brickwork
      c.strokeStyle='rgba(16,12,16,.5)';c.lineWidth=3;for(let y=68;y<680;y+=29){c.beginPath();c.moveTo(44,y);c.lineTo(476,y);c.stroke();let off=((y/29)|0)%2?34:0;for(let x=44-off;x<480;x+=68){c.beginPath();c.moveTo(x,y-29);c.lineTo(x,y);c.stroke();}}
      // windows with mixed light
      for(let row=0,y=122;y<594;row++,y+=92)for(let col=0,x=78;x<430;col++,x+=92){c.fillStyle='#0d0d14';c.fillRect(x-7,y-8,61,74);c.strokeStyle='#08070a';c.lineWidth=7;c.strokeRect(x-7,y-8,61,74);let lit=(row+col)%3===0;c.fillStyle=lit?'rgba(255,177,63,.88)':'rgba(58,75,91,.7)';c.fillRect(x+5,y+5,17,23);c.fillRect(x+30,y+5,17,23);c.fillStyle=lit?'rgba(255,203,92,.5)':'rgba(38,45,56,.8)';c.fillRect(x+5,y+37,17,18);c.fillRect(x+30,y+37,17,18);}
      // rooftop sign
      c.fillStyle='#151218';rr(c,76,23,368,89,10);c.fill();c.strokeStyle='#0a080b';c.lineWidth=10;c.stroke();c.font='900 36px Arial Black';c.textAlign='center';c.lineWidth=10;c.strokeStyle='#0b090c';c.strokeText('RAMPAGE BLOCK',260,77);c.fillStyle='#f2eadf';c.fillText('RAMPAGE BLOCK',260,77);
      // painted rainbow graffiti slash
      ['#ff2b68','#ff941e','#ffdc2e','#39db5f','#23c8ff','#9847ff'].forEach((col,i)=>{c.strokeStyle=col;c.lineWidth=7;c.beginPath();c.moveTo(95,92+i*4);c.lineTo(420,84+i*4);c.stroke();});
      // structural cracks
      [[165,150],[355,235],[250,385],[405,500]].forEach(seed=>{let x=seed[0],y=seed[1];c.strokeStyle='#0a080b';c.lineWidth=9;c.beginPath();c.moveTo(x,y);for(let j=0;j<6;j++){x+=R(-34,35);y+=R(30,58);c.lineTo(x,y);}c.stroke();});
      // roof fire + smoke
      for(const fx of [112,260,398]){let fg=c.createRadialGradient(fx,45,3,fx,45,55);fg.addColorStop(0,'rgba(255,239,112,.95)');fg.addColorStop(.35,'rgba(255,121,22,.9)');fg.addColorStop(1,'rgba(255,30,15,0)');c.fillStyle=fg;c.fillRect(fx-60,0,120,110);}for(let i=0;i<38;i++){c.fillStyle=`rgba(24,18,27,${.08+(i%5)*.018})`;ellipse(c,R(80,450),R(0,115),R(18,52),R(13,40),c.fillStyle);}
      // soot/rubble at base
      for(let i=0;i<80;i++){let x=R(45,475),y=R(600,695);c.fillStyle=i%7===0?'rgba(255,122,35,.45)':'rgba(15,12,16,.42)';ellipse(c,x,y,R(2,10),R(2,7),c.fillStyle);}
    });

    // ---- MILITARY ENEMIES -------------------------------------------------------
    make('rr6_tank',420,220,(c)=>{
      c.lineJoin='round';c.fillStyle='#08090a';rr(c,28,132,332,76,31);c.fill();c.fillStyle='#465137';rr(c,42,145,304,48,22);c.fill();for(let x=76;x<=326;x+=52){ellipse(c,x,169,25,25,'#151a12','#7e8758',5);ellipse(c,x,169,12,12,'#343d2a');}
      c.fillStyle='#596644';rr(c,108,78,166,78,18);c.fill();c.strokeStyle='#090a09';c.lineWidth=10;c.stroke();c.fillStyle='#4a5639';c.beginPath();c.moveTo(140,80);c.lineTo(183,48);c.lineTo(248,48);c.lineTo(282,82);c.closePath();c.fill();c.stroke();c.fillStyle='#3b4630';rr(c,236,62,174,27,9);c.fill();c.stroke();ellipse(c,135,111,15,11,'#f3cf68');c.fillStyle='#bb3c2d';c.fillRect(164,102,38,18);
      for(let i=0;i<48;i++){c.strokeStyle='rgba(230,215,148,.13)';c.lineWidth=2;c.beginPath();let x=R(45,340),y=R(90,186);c.moveTo(x,y);c.lineTo(x+R(5,21),y-R(0,7));c.stroke();}
    });
    make('rr6_chopper',520,250,(c)=>{
      c.strokeStyle='#090a0d';c.lineWidth=17;c.beginPath();c.moveTo(35,34);c.lineTo(485,34);c.stroke();c.strokeStyle='rgba(170,177,185,.7)';c.lineWidth=4;c.stroke();ellipse(c,292,135,145,67,'#101219','#08090b',12);ellipse(c,320,128,105,49,'#394a58');ellipse(c,367,120,50,36,'rgba(111,182,202,.85)','#0a0b0e',7);c.fillStyle='#11131a';c.beginPath();c.moveTo(164,123);c.lineTo(22,82);c.lineTo(45,180);c.lineTo(180,153);c.closePath();c.fill();c.strokeStyle='#090a0d';c.lineWidth=12;c.beginPath();c.moveTo(205,222);c.lineTo(430,222);c.stroke();c.fillStyle='#e54042';c.fillRect(235,171,61,18);c.fillStyle='#3b9bd2';c.fillRect(310,171,61,18);c.font='900 18px Arial Black';c.fillStyle='rgba(255,255,255,.65)';c.fillText('POLICE',270,140);
    });

    make('rr6_coin',128,128,(c)=>{let g=c.createRadialGradient(43,34,5,64,64,57);g.addColorStop(0,'#fffbd1');g.addColorStop(.35,'#ffd84d');g.addColorStop(1,'#d86e08');ellipse(c,64,64,62,62,'#08080b');ellipse(c,64,64,54,54,g,'#fff19a',5);const cols=['#ff2b68','#ff921e','#ffe02e','#36db5d','#25c7ff','#9547ff'];cols.forEach((col,i)=>{c.strokeStyle=col;c.lineWidth=8;c.beginPath();c.arc(64,64,29-i*2,Math.PI*.15,Math.PI*1.15);c.stroke();});ellipse(c,64,64,12,12,'#20162a');});
    make('rr6_bullet',150,50,(c)=>{let g=c.createLinearGradient(0,0,150,0);g.addColorStop(0,'rgba(255,60,20,0)');g.addColorStop(.45,'rgba(255,89,25,.75)');g.addColorStop(.7,'#ffd65b');g.addColorStop(1,'#fffbe4');c.fillStyle=g;rr(c,2,12,140,26,13);c.fill();c.strokeStyle='#130b0c';c.lineWidth=5;c.stroke();});

    // Replace the actual live texture keys continuously, preserving physics bodies.
    const map={sky:'rr6_sky',building:'rr6_building',tank:'rr6_tank',chopper:'rr6_chopper',coin:'rr6_coin',bullet:'rr6_bullet',gorilla:'rr6_gorilla_idle',gorilla_portrait:'rr6_gorilla_idle'};
    const charRE=/^gorilla_(idle|run1|run2|jump|smash)$/;
    function swap(o){
      if(!o||!o.texture||!o.setTexture) return;
      const k=o.texture.key;if(!k) return;
      let nk=map[k];let m=k.match(charRE);if(m) nk='rr6_gorilla_'+m[1];
      if(!nk||!s.textures.exists(nk)||k===nk) return;
      const dw=o.displayWidth,dh=o.displayHeight;
      o.setTexture(nk);
      if(k==='sky') o.setDisplaySize(960,540);
      else if(k==='gorilla_portrait') o.setDisplaySize(Math.max(dw,170),Math.max(dh,190));
      else if(m){o.setDisplaySize(Math.max(dw*1.42,150),Math.max(dh*1.42,170));}
      else o.setDisplaySize(dw,dh);
    }
    const apply=()=>{(s.children.list||[]).forEach(swap);};
    apply();s.events.on('update',apply);

    // Put a clean scenic plate behind gameplay to guarantee the illustrated city is visible.
    try{
      const scenic=s.add.image(480,270,'rr6_sky').setScrollFactor(0).setDepth(0.25).setDisplaySize(960,540);
      // Ensure original sky sits behind it.
      (s.children.list||[]).forEach(o=>{if(o!==scenic&&o.texture&&o.texture.key==='sky')o.setAlpha(0);});
    }catch(e){}

    // Add atmospheric foreground rubble and smoke to break the flat-vector look.
    try{
      const fx=s.add.graphics().setScrollFactor(0).setDepth(4.2);fx.fillStyle(0x09080b,.7);
      for(let i=0;i<35;i++){fx.fillCircle(R(0,960),R(470,540),R(2,9));}
    }catch(e){}
  }
  setTimeout(wait,180);
})();
