// Direct illustrated asset remap. Patches LoaderPlugin instances as Phaser creates them.
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

  const FTM=Phaser.Loader.FileTypesManager;
  const originalInstall=FTM.install;

  FTM.install=function(loader){
    originalInstall.call(this,loader);
    if(loader.__rrV5Wrapped) return;
    loader.__rrV5Wrapped=true;
    const originalImage=loader.image;
    loader.image=function(key,url,xhrSettings){
      if(typeof key==='string' && map[key]){
        return this.svg(key,map[key]);
      }
      if(key && typeof key==='object' && !Array.isArray(key) && map[key.key]){
        return this.svg(key.key,map[key.key]);
      }
      return originalImage.call(this,key,url,xhrSettings);
    };
  };
})();