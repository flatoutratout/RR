// Force fresh character sprite assets when files are replaced under the same filename.
(function () {
  if (!window.Phaser || !Phaser.Loader || !Phaser.Loader.LoaderPlugin) return;

  const originalImage = Phaser.Loader.LoaderPlugin.prototype.image;
  const version = "20260909-eagle2";

  Phaser.Loader.LoaderPlugin.prototype.image = function (key, url) {
    if (typeof url === "string" && url.includes("assets/sprites/")) {
      url += (url.includes("?") ? "&" : "?") + "v=" + version;
    }
    return originalImage.call(this, key, url);
  };
})();
