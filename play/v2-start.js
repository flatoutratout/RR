// Rainbow Rampage — Game Art V2 character select preview.
(function () {
  showStart = function showStartV2(scene) {
    startPanel = scene.add.container(480, 286).setScrollFactor(0).setDepth(100);
    const backdrop = scene.add.rectangle(0,0,920,480,0x030006,.985).setStrokeStyle(5,0xffffff,.95);
    const inner = scene.add.rectangle(0,0,902,462,0x0c0711,.98).setStrokeStyle(3,0xff00c8,.72);
    startPanel.add([backdrop,inner]);

    const logo=scene.add.image(0,-184,'logoWide').setScale(.58);
    const sub=scene.add.text(0,-133,'CHOOSE YOUR RAMPAGER',{fontFamily:'Arial Black',fontSize:'22px',color:'#ffffff',stroke:'#000',strokeThickness:7}).setOrigin(.5);
    const tag=scene.add.text(0,-105,'GAME ART V2  //  PICK YOUR CHAOS',{fontFamily:'Arial Black',fontSize:'10px',color:'#fff200',stroke:'#000',strokeThickness:4}).setOrigin(.5);
    startPanel.add([logo,sub,tag]);

    const chars=[
      {key:'gorilla',name:'GORILLA',role:'BALANCED',color:0xffa400,stats:[4,4,4],accent:'#ffb000'},
      {key:'croc',name:'CROC',role:'SPEED',color:0x55ff19,stats:[3,4,5],accent:'#62ff24'},
      {key:'cow',name:'COW',role:'TANK',color:0xff25d0,stats:[5,3,3],accent:'#ff32d6'},
      {key:'eagle',name:'EAGLE',role:'AIR',color:0x16dfff,stats:[3,3,5],accent:'#20e5ff'}
    ];
    let choosing=false;
    const choose=(key,card,portrait)=>{if(choosing||isStarted)return;choosing=true;startPanel.list.forEach(o=>{if(o&&o.input&&o.disableInteractive)o.disableInteractive();});card.setFillStyle(0xffffff,.2);portrait.setScale(.69);scene.time.delayedCall(1,()=>startGame(key));};

    chars.forEach((ch,i)=>{
      const x=-318+i*212;
      const glow=scene.add.rectangle(x,28,194,246,ch.color,.10).setStrokeStyle(8,ch.color,.18);
      const card=scene.add.rectangle(x,28,184,236,0x050508,.99).setStrokeStyle(4,ch.color,1);
      const artBack=scene.add.rectangle(x,-28,166,126,ch.color,.16).setStrokeStyle(2,0xffffff,.25);
      const stripe=scene.add.rectangle(x,-86,166,8,ch.color,.95);
      const portrait=scene.add.image(x,-29,`${ch.key}_portrait`).setScale(.63);
      const shade=scene.add.rectangle(x,20,166,18,0x000000,.38);
      const plate=scene.add.rectangle(x,51,158,38,ch.color,.98).setAngle(-2);
      const name=scene.add.text(x,50,ch.name,{fontFamily:'Arial Black',fontSize:'20px',color:'#050208',stroke:'#ffffff',strokeThickness:1}).setOrigin(.5).setAngle(-2);
      const role=scene.add.text(x,78,ch.role,{fontFamily:'Arial Black',fontSize:'10px',color:ch.accent,stroke:'#000',strokeThickness:4}).setOrigin(.5);
      startPanel.add([glow,card,artBack,stripe,portrait,shade,plate,name,role]);

      ['HEALTH','DAMAGE','SPEED'].forEach((label,j)=>{
        const y=101+j*16;
        const t=scene.add.text(x-70,y,label,{fontFamily:'Arial Black',fontSize:'8px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(0,.5);startPanel.add(t);
        for(let b=0;b<5;b++){const r=scene.add.rectangle(x-14+b*14,y,11,8,b<ch.stats[j]?ch.color:0x242028,1).setStrokeStyle(1,0xffffff,b<ch.stats[j]?.5:.12);startPanel.add(r);}
      });
      const tap=scene.add.text(x,158,'TAP TO RAMPAGE',{fontFamily:'Arial Black',fontSize:'9px',color:'#fff200',stroke:'#000',strokeThickness:4}).setOrigin(.5);startPanel.add(tap);
      card.setInteractive({useHandCursor:true});
      card.on('pointerdown',()=>choose(ch.key,card,portrait));
      card.on('pointerover',()=>{if(choosing)return;glow.setAlpha(.32);card.setScale(1.045);portrait.setScale(.68);});
      card.on('pointerout',()=>{if(choosing)return;glow.setAlpha(1);card.setScale(1);portrait.setScale(.63);});
      scene.tweens.add({targets:glow,alpha:{from:.55,to:1},duration:650+i*90,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
      scene.tweens.add({targets:portrait,y:portrait.y-4,duration:900+i*100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    });
    const footer=scene.add.text(0,211,'GO FAST  •  SMASH HARD  •  RACK UP COINS',{fontFamily:'Arial Black',fontSize:'15px',color:'#fff',stroke:'#000',strokeThickness:6}).setOrigin(.5);startPanel.add(footer);
    const rainbow=['#ff2b45','#ff9d00','#fff200','#58ff37','#00eaff','#8a55ff','#ff20cc'];scene.tweens.addCounter({from:0,to:rainbow.length-1,duration:1600,repeat:-1,onUpdate:t=>{if(footer.active)footer.setColor(rainbow[Math.floor(t.getValue())%rainbow.length]);}});
    startPanel.setScale(.96).setAlpha(0);scene.tweens.add({targets:startPanel,alpha:1,scale:1,duration:320,ease:'Back.easeOut'});
  };
})();