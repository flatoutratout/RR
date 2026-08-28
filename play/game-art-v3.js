// Rainbow Rampage — GAME ART V3
// Actual replacement artwork generated as crisp vector textures at runtime.
(function(){
const C={gorilla:0xff8a19,croc:0x55ff28,cow:0xff35c8,eagle:0x22ddff};
function boot(){
 if(!window.game||!game.scene||!game.scene.scenes[0])return setTimeout(boot,100);
 const s=game.scene.scenes[0]; if(!s.textures||!s.add)return setTimeout(boot,100); if(s.__artV3)return;s.__artV3=1;
 const make=(key,w,h,draw)=>{const g=s.make.graphics({x:0,y:0,add:false});draw(g,w,h);g.generateTexture('rr3_'+key,w,h);g.destroy();};
 const outline=(g,x,y,w,h,r,fill,stroke=0x05030a)=>{g.fillStyle(stroke,1);g.fillRoundedRect(x-5,y-5,w+10,h+10,r+5);g.fillStyle(fill,1);g.fillRoundedRect(x,y,w,h,r);};
 function character(ch,act){
  const accent=C[ch]; make(ch+'_'+act,150,170,(g)=>{
   // neon aura / motion slash
   if(act==='run1'||act==='run2'){g.lineStyle(8,accent,.25);g.lineBetween(10,105,72,85);g.lineStyle(4,0xffffff,.18);g.lineBetween(4,125,60,110);}
   if(act==='smash'){g.lineStyle(9,accent,.32);g.strokeCircle(76,100,60);}
   const bob=act==='jump'?-12:0, lean=act==='smash'?10:0;
   // legs
   g.lineStyle(22,0x07060b,1);g.lineBetween(58,118+bob,48-(act==='run1'?15:0),157+bob);g.lineBetween(91,118+bob,102+(act==='run2'?15:0),157+bob);
   g.lineStyle(12,accent,1);g.lineBetween(58,119+bob,50-(act==='run1'?14:0),153+bob);g.lineBetween(91,119+bob,100+(act==='run2'?14:0),153+bob);
   // huge torso
   outline(g,38+lean,55+bob,75,77,28,ch==='cow'?0xf2f2f2:(ch==='croc'?0x249c2a:(ch==='eagle'?0x263342:0x27222c)));
   // arms
   g.lineStyle(26,0x05030a,1);g.lineBetween(43+lean,75+bob,act==='smash'?17:30,act==='smash'?122:111+bob);g.lineBetween(109+lean,75+bob,act==='smash'?135:121,act==='smash'?119:108+bob);
   g.lineStyle(15,accent,1);g.lineBetween(44+lean,76+bob,act==='smash'?18:31,act==='smash'?121:109+bob);g.lineBetween(108+lean,76+bob,act==='smash'?134:120,act==='smash'?118:107+bob);
   // head silhouette
   g.fillStyle(0x05030a,1);g.fillCircle(77+lean,43+bob,37);
   if(ch==='gorilla'){g.fillStyle(0x342d39,1);g.fillCircle(77+lean,43+bob,30);g.fillStyle(0xb77b54,1);g.fillRoundedRect(55+lean,45+bob,45,25,11);}
   if(ch==='croc'){g.fillStyle(0x48d934,1);g.fillEllipse(82+lean,44+bob,72,43);g.fillStyle(0x9aff43,1);g.fillRoundedRect(74+lean,44+bob,48,18,8);g.fillStyle(0xffffff,1);for(let i=0;i<4;i++)g.fillTriangle(82+i*10+lean,61+bob,88+i*10+lean,61+bob,85+i*10+lean,69+bob);}
   if(ch==='cow'){g.fillStyle(0xf7f4ee,1);g.fillEllipse(77+lean,43+bob,58,55);g.fillStyle(0x111018,1);g.fillCircle(63+lean,32+bob,10);g.fillCircle(91+lean,48+bob,11);g.fillStyle(0xff8fbf,1);g.fillEllipse(78+lean,55+bob,36,19);}
   if(ch==='eagle'){g.fillStyle(0xffffff,1);g.fillEllipse(77+lean,40+bob,55,57);g.fillStyle(0xffc21c,1);g.fillTriangle(83+lean,44+bob,123+lean,53+bob,83+lean,61+bob);g.fillStyle(0x27394a,1);g.fillRect(45+lean,57+bob,61,19);}
   // shades + eyes line
   g.fillStyle(0x05030a,1);g.fillRoundedRect(49+lean,31+bob,56,14,5);g.fillStyle(accent,.9);g.fillRect(54+lean,35+bob,18,4);g.fillRect(81+lean,35+bob,18,4);
   // chain / chest emblem
   g.lineStyle(5,0xffdc32,1);g.strokeCircle(76+lean,82+bob,17);g.fillStyle(accent,1);g.fillCircle(76+lean,82+bob,8);
   // action accents
   if(act==='jump'){g.lineStyle(5,0xffffff,.45);g.lineBetween(34,159,18,169);g.lineBetween(116,159,135,169);}
  });
 }
 ['gorilla','croc','cow','eagle'].forEach(ch=>['idle','run1','run2','jump','smash'].forEach(a=>character(ch,a)));
 // enemy tank
 make('tank',180,105,g=>{g.fillStyle(0x05030a,1);g.fillRoundedRect(10,66,150,34,15);g.fillStyle(0x333849,1);g.fillRoundedRect(17,70,136,24,11);for(let i=0;i<5;i++){g.fillStyle(0x11131b,1);g.fillCircle(35+i*25,83,12);g.lineStyle(3,0xff365f,1);g.strokeCircle(35+i*25,83,8);}outline(g,52,39,73,37,10,0x4b5266);g.fillStyle(0xff365f,1);g.fillRect(61,48,20,8);g.fillRect(91,48,20,8);g.fillStyle(0x05030a,1);g.fillRect(104,28,68,14);g.fillStyle(0xffdf32,1);g.fillRect(109,32,61,6);g.fillStyle(0xffffff,1);g.fillCircle(38,57,6);});
 make('chopper',220,105,g=>{g.lineStyle(8,0x05030a,1);g.lineBetween(25,24,193,24);g.lineStyle(3,0x23e8ff,1);g.lineBetween(31,24,187,24);g.fillStyle(0x05030a,1);g.fillEllipse(104,60,135,66);g.fillStyle(0x263647,1);g.fillEllipse(104,60,122,54);g.fillStyle(0x23e8ff,.8);g.fillEllipse(129,54,49,27);g.fillStyle(0x05030a,1);g.fillTriangle(45,55,4,39,12,70);g.lineStyle(8,0x05030a,1);g.lineBetween(67,91,148,91);g.fillStyle(0xff315f,1);g.fillRect(78,69,27,7);g.fillStyle(0xffe32c,1);g.fillRect(112,69,27,7);});
 make('coin',64,64,g=>{g.fillStyle(0x05030a,1);g.fillCircle(32,32,29);g.fillStyle(0xffc400,1);g.fillCircle(32,32,24);g.lineStyle(4,0xffff80,1);g.strokeCircle(32,32,18);g.fillStyle(0x05030a,1);g.fillRoundedRect(25,15,14,34,5);g.fillStyle(0xfff36a,1);g.fillRect(29,19,5,26);});
 make('bullet',48,18,g=>{g.fillStyle(0xff236d,.25);g.fillEllipse(16,9,32,17);g.fillStyle(0xffffff,1);g.fillRoundedRect(15,5,29,8,4);g.fillStyle(0xffea2b,1);g.fillCircle(40,9,6);});
 // replacement building: huge readable cyber arcade tower
 make('building',360,520,g=>{g.fillStyle(0x05030a,1);g.fillRoundedRect(18,10,324,510,12);g.fillStyle(0x171324,1);g.fillRoundedRect(28,20,304,500,8);g.fillStyle(0xff25c8,1);g.fillRect(28,20,304,13);g.fillStyle(0x20e5ff,1);g.fillRect(28,500,304,12);g.fillStyle(0x090711,1);g.fillRect(48,55,264,70);g.lineStyle(4,0xffe72c,1);g.strokeRect(48,55,264,70);for(let r=0;r<6;r++)for(let c=0;c<5;c++){const col=(r+c)%3===0?0xff2ec8:(r+c)%3===1?0x1ee5ff:0xffe52c;g.fillStyle(col,.72);g.fillRoundedRect(54+c*54,155+r*50,32,27,4);}g.fillStyle(0xffffff,1);g.fillRoundedRect(78,68,204,44,6);g.fillStyle(0x05030a,1);g.fillRect(91,78,178,23);g.fillStyle(0xff2ec8,1);g.fillRect(104,84,48,11);g.fillStyle(0xffe52c,1);g.fillRect(158,84,45,11);g.fillStyle(0x1ee5ff,1);g.fillRect(209,84,47,11);g.lineStyle(7,0xff2ec8,.7);g.lineBetween(34,145,34,480);g.lineStyle(5,0x1ee5ff,.7);g.lineBetween(326,145,326,480);});
 const map={tank:'rr3_tank',chopper:'rr3_chopper',coin:'rr3_coin',bullet:'rr3_bullet',building:'rr3_building'};
 // Replace every live object based on its original texture key. Physics bodies remain untouched.
 s.events.on('update',()=>{(s.children.list||[]).forEach(o=>{if(!o||o.__rr3||!o.texture||!o.texture.key||!o.setTexture)return;const k=o.texture.key;let nk=map[k];if(!nk&&/^(gorilla|croc|cow|eagle)_(idle|run1|run2|jump|smash)$/.test(k))nk='rr3_'+k;if(nk&&s.textures.exists(nk)){o.setTexture(nk);o.__rr3=1;}});});
 // Make replacements immediately visible on already-created start/player objects when applicable.
 (s.children.list||[]).forEach(o=>{if(o&&o.texture&&map[o.texture.key]&&o.setTexture)o.setTexture(map[o.texture.key]);});
}
setTimeout(boot,250);
})();