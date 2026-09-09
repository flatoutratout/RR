// Compatibility shim for the new gorilla run-frame filenames.
// The game asks for gorilla_run1.png / gorilla_run2.png, while the uploaded files are gorilla_run_1.png / gorilla_run_2.png.
(function () {
  if (!window.Phaser || !Phaser.Loader || !Phaser.Loader.LoaderPlugin) return;

  const originalImage = Phaser.Loader.LoaderPlugin.prototype.image;

  Phaser.Loader.LoaderPlugin.prototype.image = function (key, url, xhrSettings) {
    if (key === 'gorilla_run1' && typeof url === 'string') {
      url = url.replace('gorilla_run1.png', 'gorilla_run_1.png');
    } else if (key === 'gorilla_run2' && typeof url === 'string') {
      url = url.replace('gorilla_run2.png', 'gorilla_run_2.png');
    }

    return originalImage.call(this, key, url, xhrSettings);
  };
})();
