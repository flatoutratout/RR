// Rainbow Rampage — illustrated arcade art pass
(function(){
function boot(){
 if(!window.game||!game.scene||!game.scene.scenes[0])return setTimeout(boot,100);
 const s=game.scene.scenes[0]; if(!s.textures||s.__rr4)return setTimeout(boot,100); s.__rr4=1;
 const canvasTex=(key,w,h,fn)=>{const t=s.textures.createCanvas('rr4_'+key,w,h),c=t.context;fn(c,w,h);t.refresh();};
 const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
 const stroke=(c,w=8,col='#09080c')=>{c.lineWidth=w;c.strokeStyle=col;c.stroke();};
 function city(c,w,h){
  let g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#111348');g.addColorStop(.38,'#6d285b');g.addColorStop(.66,'#ed674c');g.addColorStop(1,'#241729');c.fillStyle=g;c.fillRect(0,0,w,h);
  const sun=c.createRadialGradient(520,285,5,520,285,240);sun.addColorStop(0,'rgba(255,216,96,.55)');sun.addColorStop(.5,'rgba(255,80,80,.14)');sun.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=sun;c.fillRect(0,0,w,h);
  // clouds
  for(let i=0;i<18;i++){c.fillStyle='rgba(255,160,175,'+(0.035+(i%3)*.025)+')';c.beginPath();c.ellipse((i*157)%1000,75+(i%6)*34,90+(i%4)*28,9+(i%3)*5,-.08,0,Math.PI*2);c.fill();}
  // distant skyline
  for(let i=0,x=-10;x<w+80;i++,x+=42+(i%4)*17){const bh=90+(i*37)%180;c.fillStyle=i%2?'#292542':'#201d39';c.fillRect(x,h-78-bh,46+(i%3)*18,bh);c.fillStyle='rgba(255,198,94,.55)';for(let yy=h-95-bh;yy<h-105;yy+=24)for(let xx=x+9;xx<x+45;xx+=17)if((xx+yy+i)%3)c.fillRect(xx,yy,5,8);}
  // closer battered buildings
  for(let i=0,x=-25;x<w+100;i++,x+=105){const bh=105+(i*53)%135;c.fillStyle='#171521';c.fillRect(x,h-68-bh,112,bh);c.strokeStyle='#09080c';c.lineWidth=7;c.strokeRect(x,h-68-bh,112,bh);c.fillStyle='#34303d';for(let yy=h-50-bh;yy<h-90;yy+=31)for(let xx=x+15;xx<x+96;xx+=28)c.fillRect(xx,yy,13,18);c.fillStyle='#ffc55a';for(let yy=h-50-bh;yy<h-90;yy+=62)for(let xx=x+15;xx<x+96;xx+=56)c.fillRect(xx,yy,9,13);}
  // road/sidewalk
  c.fillStyle='#16151c';c.fillRect(0,h-70,w,70);c.fillStyle='#4b4750';c.fillRect(0,h-70,w,13);c.fillStyle='#807984';c.fillRect(0,h-67,w,4);c.strokeStyle='#09080c';c.lineWidth=5;for(let x=0;x<w;x+=70)c.strokeRect(x,h-57,70,57);
 }
 canvasTex('sky',960,540,city);
 function gorilla(c,act){
  c.clearRect(0,0,260,270);c.save();const smash=act==='smash',jump=act==='jump',run=act==='run1'||act==='run2';const oy=jump?-20:0;
  if(smash){const rg=c.createRadialGradient(145,160,10,145,160,115);rg.addColorStop(0,'rgba(255,119,0,.42)');rg.addColorStop(1,'rgba(255,0,0,0)');c.fillStyle=rg;c.fillRect(0,20,260,240);}
  if(run){c.strokeStyle='rgba(255,211,43,.45)';c.lineWidth=9;for(let i=0;i<4;i++){c.beginPath();c.moveTo(10,130+i*24);c.lineTo(78,118+i*22);c.stroke();}}
  // legs
  c.lineCap='round';c.strokeStyle='#0a090c';c.lineWidth=48;c.beginPath();c.moveTo(105,190+oy);c.lineTo(82+(act==='run1'?-25:0),245+oy);c.moveTo(154,190+oy);c.lineTo(177+(act==='run2'?25:0),245+oy);c.stroke();c.strokeStyle='#302d31';c.lineWidth=34;c.stroke();
  // torso gradient
  const body=c.createRadialGradient(128,125+oy,15,128,145+oy,100);body.addColorStop(0,'#555158');body.addColorStop(.5,'#302e33');body.addColorStop(1,'#111014');c.fillStyle=body;c.beginPath();c.ellipse(130,145+oy,74,78,0,0,Math.PI*2);c.fill();stroke(c,11);
  // shoulders/arms
  const arm=(x1,y1,x2,y2)=>{c.strokeStyle='#09080c';c.lineWidth=57;c.beginPath();c.moveTo(x1,y1+oy);c.lineTo(x2,y2+oy);c.stroke();c.strokeStyle='#37343a';c.lineWidth=40;c.stroke();c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=8;c.stroke();};
  arm(78,119,smash?38:54,smash?215:190);arm(181,119,smash?223:204,smash?205:184);
  // fists
  for(const p of [[smash?37:53,smash?220:194],[smash?224:205,smash?211:189]]){c.fillStyle='#17151a';c.beginPath();c.arc(p[0],p[1]+oy,29,0,Math.PI*2);c.fill();stroke(c,8);for(let k=0;k<3;k++){c.strokeStyle='#57525a';c.lineWidth=5;c.beginPath();c.arc(p[0]-12+k*12,p[1]-2+oy,7,Math.PI,0);c.stroke();}}
  // head + brow
  c.fillStyle='#17161a';c.beginPath();c.ellipse(130,74+oy,53,49,0,0,Math.PI*2);c.fill();stroke(c,10);c.fillStyle='#4b4544';c.beginPath();c.ellipse(130,89+oy,42,30,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#09080c';c.lineWidth=13;c.beginPath();c.moveTo(91,62+oy);c.quadraticCurveTo(130,39+oy,169,62+oy);c.stroke();
  // angry eyes
  c.fillStyle='#ff492e';c.beginPath();c.ellipse(111,69+oy,9,6,-.2,0,Math.PI*2);c.ellipse(149,69+oy,9,6,.2,0,Math.PI*2);c.fill();
  // mouth and teeth
  c.fillStyle='#09070a';c.beginPath();c.ellipse(130,99+oy,34,22,0,0,Math.PI*2);c.fill();c.fillStyle='#eee0b5';for(let i=0;i<5;i++){c.beginPath();c.moveTo(103+i*13,88+oy);c.lineTo(109+i*13,101+oy);c.lineTo(115+i*13,88+oy);c.fill();}for(let i=0;i<4;i++){c.beginPath();c.moveTo(110+i*13,110+oy);c.lineTo(116+i*13,99+oy);c.lineTo(122+i*13,110+oy);c.fill();}
  // rainbow paint splashes
  ['#ff285f','#ff9c20','#ffe22b','#36e65d','#28c9ff','#a14cff'].forEach((col,i)=>{c.fillStyle=col;c.beginPath();c.arc(73+i*19,145+(i%2)*18+oy,7+(i%3),0,Math.PI*2);c.fill();});
  c.restore();
 }
 ['idle','run1','run2','jump','smash'].forEach(a=>canvasTex('gorilla_'+a,260,270,(c)=>gorilla(c,a)));
 // alternate characters remain distinct but use painted silhouettes
 const chars={croc:['#56cf36','#b3ff58'],cow:['#ece7e2','#ff8fc4'],eagle:['#e9eef4','#ffbd21']};
 Object.keys(chars).forEach(ch=>['idle','run1','run2','jump','smash'].forEach(act=>canvasTex(ch+'_'+act,230,250,(c)=>{const [base,acc]=chars[ch];const oy=act==='jump'?-15:0;c.lineCap='round';c.strokeStyle='#08080b';c.lineWidth=52;c.beginPath();c.moveTo(92,172+oy);c.lineTo(73,230+oy);c.moveTo(140,172+oy);c.lineTo(159,230+oy);c.stroke();c.fillStyle=base;c.beginPath();c.ellipse(116,135+oy,65,75,0,0,Math.PI*2);c.fill();stroke(c,10);c.strokeStyle='#08080b';c.lineWidth=50;c.beginPath();c.moveTo(67,122+oy);c.lineTo(35,195+oy);c.moveTo(165,122+oy);c.lineTo(200,190+oy);c.stroke();c.fillStyle=base;c.beginPath();c.ellipse(116,65+oy,ch==='croc'?70:54,45,0,0,Math.PI*2);c.fill();stroke(c,10);c.fillStyle='#09090c';c.fillRect(75,52+oy,83,18);c.fillStyle=acc;c.fillRect(84,57+oy,27,6);c.fillRect(122,57+oy,27,6);c.fillStyle=acc;c.beginPath();c.arc(116,133+oy,15,0,Math.PI*2);c.fill();})));
 // building: battered masonry, not neon box
 canvasTex('building',420,620,(c)=>{c.fillStyle='#0b0a0d';rr(c,16,12,388,608,8);c.fill();const g=c.createLinearGradient(0,0,420,620);g.addColorStop(0,'#5b5051');g.addColorStop(.55,'#302b31');g.addColorStop(1,'#17151a');c.fillStyle=g;rr(c,27,23,366,597,5);c.fill();for(let y=45;y<590;y+=34){c.strokeStyle='rgba(10,8,10,.65)';c.lineWidth=3;c.beginPath();c.moveTo(28,y);c.lineTo(392,y);c.stroke();for(let x=35+(y%68?20:0);x<390;x+=58){c.beginPath();c.moveTo(x,y-33);c.lineTo(x,y);c.stroke();}}for(let y=70;y<545;y+=88)for(let x=62;x<350;x+=92){c.fillStyle='#0b0c13';c.fillRect(x,y,47,58);c.strokeStyle='#151218';c.lineWidth=8;c.strokeRect(x,y,47,58);c.fillStyle=((x+y)%3)?'#f0a14a':'#4e6074';c.globalAlpha=.6;c.fillRect(x+9,y+10,11,20);c.fillRect(x+27,y+10,11,20);c.globalAlpha=1;}c.fillStyle='#111015';c.fillRect(65,14,290,62);c.strokeStyle='#f0b62b';c.lineWidth=5;c.strokeRect(65,14,290,62);c.fillStyle='#f4e6d4';c.font='900 28px Arial Black';c.textAlign='center';c.fillText('RAMPAGE BLOCK',210,54);c.strokeStyle='#18141a';c.lineWidth=8;c.beginPath();c.moveTo(55,250);c.lineTo(145,330);c.lineTo(103,414);c.moveTo(330,180);c.lineTo(280,270);c.lineTo(342,355);c.stroke();});
 canvasTex('tank',230,130,(c)=>{c.fillStyle='#0a0b0a';rr(c,13,83,190,39,18);c.fill();c.fillStyle='#3e4931';rr(c,22,89,172,25,12);c.fill();for(let x=45;x<185;x+=34){c.fillStyle='#171a14';c.beginPath();c.arc(x,102,15,0,Math.PI*2);c.fill();c.strokeStyle='#778153';c.lineWidth=4;c.stroke();}c.fillStyle='#596542';rr(c,67,52,90,43,12);c.fill();stroke(c,7);c.fillStyle='#35402b';c.fillRect(125,42,95,17);stroke(c,6);c.fillStyle='#d9d2a2';c.fillRect(74,63,21,9);c.fillStyle='#cf3c25';c.fillRect(104,63,18,9);});
 canvasTex('chopper',260,135,(c)=>{c.strokeStyle='#0a0a0d';c.lineWidth=10;c.beginPath();c.moveTo(20,24);c.lineTo(235,24);c.stroke();c.strokeStyle='#818792';c.lineWidth=4;c.stroke();c.fillStyle='#111319';c.beginPath();c.ellipse(132,77,79,43,0,0,Math.PI*2);c.fill();stroke(c,8);c.fillStyle='#344454';c.beginPath();c.ellipse(151,72,57,31,0,0,Math.PI*2);c.fill();c.fillStyle='#7bc1d6';c.beginPath();c.ellipse(174,67,29,22,0,0,Math.PI*2);c.fill();c.fillStyle='#111319';c.beginPath();c.moveTo(67,69);c.lineTo(8,54);c.lineTo(17,91);c.closePath();c.fill();c.strokeStyle='#0a0a0d';c.lineWidth=8;c.beginPath();c.moveTo(94,119);c.lineTo(196,119);c.stroke();});
 canvasTex('coin',72,72,(c)=>{const g=c.createRadialGradient(25,20,4,36,36,31);g.addColorStop(0,'#fff7a2');g.addColorStop(.35,'#ffd32e');g.addColorStop(1,'#e37811');c.fillStyle='#0a090c';c.beginPath();c.arc(36,36,34,0,Math.PI*2);c.fill();c.fillStyle=g;c.beginPath();c.arc(36,36,28,0,Math.PI*2);c.fill();c.strokeStyle='#fff2a0';c.lineWidth=4;c.stroke();c.fillStyle='#ff2a87';c.beginPath();c.arc(36,36,14,0,Math.PI*2);c.fill();c.strokeStyle='#22d9ff';c.lineWidth=5;c.beginPath();c.arc(36,36,10,Math.PI*.2,Math.PI*1.15);c.stroke();c.strokeStyle='#65ee47';c.beginPath();c.arc(36,36,10,Math.PI*1.15,Math.PI*1.75);c.stroke();});
 canvasTex('bullet',60,22,(c)=>{const g=c.createLinearGradient(0,0,60,0);g.addColorStop(0,'rgba(255,60,20,0)');g.addColorStop(.55,'#ff5b20');g.addColorStop(1,'#fff6bf');c.fillStyle=g;rr(c,2,5,55,12,6);c.fill();});
 const map={sky:'rr4_sky',building:'rr4_building',tank:'rr4_tank',chopper:'rr4_chopper',coin:'rr4_coin',bullet:'rr4_bullet'};
 function swap(o){if(!o||o.__rr4||!o.texture||!o.setTexture)return;const k=o.texture.key;let nk=map[k];if(!nk&&/^(gorilla|croc|cow|eagle)_(idle|run1|run2|jump|smash)$/.test(k))nk='rr4_'+k;if(!nk||!s.textures.exists(nk))return;const dw=o.displayWidth,dh=o.displayHeight;o.setTexture(nk);if(k==='sky'){o.setDisplaySize(dw,dh);}else if(/^(gorilla|croc|cow|eagle)_/.test(k)){o.setDisplaySize(dw*1.18,dh*1.18);}else{o.setDisplaySize(dw,dh);}o.__rr4=1;}
 s.events.on('update',()=>{(s.children.list||[]).forEach(swap);});(s.children.list||[]).forEach(swap);
}
setTimeout(boot,350);
})();