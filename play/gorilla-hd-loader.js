(function(){
  if(!window.Phaser||!Phaser.Loader||!Phaser.Loader.LoaderPlugin)return;
  const proto=Phaser.Loader.LoaderPlugin.prototype;
  if(proto.__rrGorillaHdPatched)return;
  const original=proto.image;
  proto.image=function(key,url,xhrSettings){
    if(typeof key==='string'&&key.indexOf('gorilla_')===0){
      const act=key.slice('gorilla_'.length);
      const assets=window.GORILLA_HD_ASSETS||{};
      if(assets[act]) url=assets[act];
    }
    return original.call(this,key,url,xhrSettings);
  };
  proto.__rrGorillaHdPatched=true;
})();
