// Direct asset remap for illustrated build. Runs before main.js preload.
(function(){
  const map={
    sky:'assets/v5/sky.svg',
    sidewalk:'assets/v5/sidewalk.svg',
    building:'assets/v5/building.svg',
    tank:'assets/v5/tank.svg',
    chopper:'assets/v5/chopper.svg',
    coin:'assets/v5/coin.svg',
    bullet:'assets/v5/bullet.svg',
    gorilla:'assets/v5/gorilla.svg',
    gorilla_idle:'assets/v5/gorilla.svg',
    gorilla_run1:'assets/v5/gorilla.svg',
    gorilla_run2:'assets/v5/gorilla.svg',
    gorilla_jump:'assets/v5/gorilla.svg',
    gorilla_smash:'assets/v5/gorilla.svg',
    gorilla_portrait:'assets/v5/gorilla.svg'
  };
  const p=Phaser.Loader.LoaderPlugin.prototype;
  const image=p.image;
  p.image=function(key,url,xhr){
    if(typeof key==='string'&&map[key]) return this.svg(key,map[key]);
    return image.call(this,key,url,xhr);
  };
})();