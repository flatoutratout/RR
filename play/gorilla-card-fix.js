(function(){
  if(!window.Phaser) return;
  // Make the Gorilla selection card use the same HD idle art as gameplay,
  // so there is no ambiguity about which asset set is active.
  const proto = Phaser.GameObjects.GameObjectFactory.prototype;
  if(proto.__rrHdGorillaCardPatched) return;
  const originalImage = proto.image;
  proto.image = function(x, y, texture, frame){
    if(texture === 'gorilla_portrait') texture = 'gorilla_idle';
    const obj = originalImage.call(this, x, y, texture, frame);
    if(texture === 'gorilla_idle' && obj && obj.setScale){
      obj.setScale(0.58);
    }
    return obj;
  };
  proto.__rrHdGorillaCardPatched = true;
})();
