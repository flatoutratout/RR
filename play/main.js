const W = 960;
const H = 540;
const WORLD_W = 200000;
const FLOOR_Y = 560;
// Background sidewalk sits close to the bottom of the canvas; keep visible sprites planted on it.
const BUILDING_FEET_Y = 560;
const PLAYER_START_X = 90;
const PLAYER_START_Y = 560;
const TANK_FEET_Y = 544;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: W,
  height: H,
  backgroundColor: "#050008",
  render: { antialias: true, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1050 }, debug: false }
  },
  scene: { preload, create, update }
};

class RainbowStarPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      fragShader: `
      precision mediump float;
      uniform sampler2D uMainSampler;
      varying vec2 outTexCoord;
      uniform float time;

      vec3 rainbow(float t) {
        return 0.58 + 0.42 * cos(6.2831853 * (t + vec3(0.0, 0.34, 0.67)));
      }

      void main(void) {
        vec4 tex = texture2D(uMainSampler, outTexCoord);
        if (tex.a <= 0.02) { discard; }

        float band = outTexCoord.y * 4.8 + outTexCoord.x * 1.35 + time * 3.1;
        vec3 star = rainbow(band);

        float shade = dot(tex.rgb, vec3(0.30, 0.59, 0.11));
        vec3 detail = mix(star * 0.72, star * 1.32, shade);
        vec3 finalColor = mix(tex.rgb, detail, 0.82);

        gl_FragColor = vec4(finalColor, tex.a);
      }`
    });
  }

  onPreRender() {
    this.set1f('time', this.game.loop.time / 1000.0);
  }
}

let player, cursors, keys, ground, buildings, coins, tanks, choppers, projectiles;
let score = 0, highScore = 0, destroyed = 0;
let health = 5, rage = 0, combo = 1, comboTimer = 0;
let coinCount = 0, rageEndAt = 0;
let rageMode = false, canSmash = true, isStarted = false, isGameOver = false;
let rageFlashEvent = null;
let ragePulseTween = null;
let rageTrailEvent = null;
let rainbowPipelineReady = false;
let leftDown = false, rightDown = false, jumpDown = false, smashDown = false;
let nextSpawnX = 420, lastMilestone = 0, lastChaosZone = -1, difficultyLevel = 1, nextPressureAt = 320;
let scoreText, missionText, healthText, rageText, comboText, distanceText, difficultyText, startPanel;
let coinText, destroyedText, highScoreText, rageBarBg, rageBarFill, rageTimerText, pauseText;
let hudShellRef, missionShellRef, questToast, heatBarFill;
let screenFxLayer, vignetteFx, scanlineFx, rageScreenWash, ambientFxEvent;
let bestDistance = 0;
let cam;
let shadowSkyline = [];
let runFrameTimer = 0;
let smashAnimTimer = 0;
let jumpsUsed = 0;
let prevPlayerX = PLAYER_START_X;

const QUESTS = [
  { type: "buildings", label: "Destroy buildings", base: 50 },
  { type: "coins", label: "Collect coins", base: 10 },
  { type: "distance", label: "Run distance", base: 250 }
];
let currentQuest = null;
let questLevels = { buildings: 0, coins: 0, distance: 0 };

let selectedCharacter = "gorilla";
const characterStats = {
  gorilla: { name: "GORILLA", speed: 1.00, jump: 1.00, hp: 5, rage: 1.00 },
  croc:    { name: "CROC",    speed: 1.14, jump: 0.95, hp: 4, rage: 1.05 },
  cow:     { name: "COW",     speed: 0.92, jump: 0.92, hp: 7, rage: 0.90 },
  eagle:   { name: "EAGLE",   speed: 1.04, jump: 1.22, hp: 4, rage: 1.00 },
};

new Phaser.Game(config);

function preload() {
  this.load.image("sky", "assets/sky.png");
  this.load.image("sidewalk", "assets/sidewalk.png");
  this.load.image("logo", "assets/logo.png");
  this.load.image("logoWide", "assets/logo-wide.png");
  this.load.image("gorilla", "assets/gorilla.png");
  this.load.image("croc", "assets/croc.png");
  this.load.image("cow", "assets/cow.png");
  this.load.image("eagle", "assets/eagle.png");
  this.load.image("building", "assets/building.png");
  this.load.image("coin", "assets/coin.png");
  this.load.image("tank", "assets/tank.png");
  this.load.image("chopper", "assets/chopper.png");
  this.load.image("bullet", "assets/bullet.png");
  this.load.image("neon_overlay", "assets/neon_overlay.png");
  // Final high-detail sprite-sheet frames
  ["gorilla","croc","cow","eagle"].forEach(ch => {
    ["idle","run1","run2","jump","smash"].forEach(act => {
      this.load.image(`${ch}_${act}`, `assets/sprites/${ch}_${act}.png`);
    });
    this.load.image(`${ch}_portrait`, `assets/portraits/${ch}.png`);
  });
  this.load.image("muzzle_flash", "assets/muzzle_flash.png");
  this.load.image("impact_spark", "assets/impact_spark.png");
  this.load.svg("hudShell", "assets/ui/hud_shell.svg", { width: 960, height: 132 });
  this.load.svg("missionShell", "assets/ui/mission_shell.svg", { width: 300, height: 96 });

}



function createShadowSkyline(scene) {
  // Clean redone shadow skyline:
  // - no random internal rectangles/windows
  // - no floating detached chunks
  // - every shape starts from the ground line and grows upward
  // - three parallax layers for depth
  shadowSkyline = [];

  function makeCleanLayer({ baseY, colour, alpha, scroll, depth, scale, xOffset }) {
    const g = scene.add.graphics().setDepth(depth).setScrollFactor(scroll).setAlpha(alpha);
    g.fillStyle(colour, 1);

    const pattern = [
      [0, 180, 170, 0], [170, 130, 245, 1], [295, 210, 190, 0],
      [500, 160, 305, 2], [655, 245, 220, 0], [895, 145, 275, 1],
      [1035, 225, 185, 0], [1255, 175, 330, 2], [1425, 255, 205, 0],
      [1670, 150, 260, 1], [1815, 220, 180, 0]
    ];

    const chunkW = 2050;
    const repeats = Math.ceil(WORLD_W / chunkW) + 3;

    for (let r = -1; r < repeats; r++) {
      const ox = r * chunkW * scale + xOffset;

      for (const [x, w, h, roof] of pattern) {
        const px = ox + x * scale;
        const bw = w * scale;
        const bh = h * scale;

        // Main mass: always grounded to baseY.
        g.fillRect(px, baseY - bh, bw, bh);

        // Roofs are attached directly to the main mass only.
        if (roof === 1) {
          g.fillTriangle(
            px,
            baseY - bh,
            px + bw,
            baseY - bh,
            px + bw * 0.5,
            baseY - bh - 34 * scale
          );
        }

        if (roof === 2) {
          g.fillRect(px + bw * 0.22, baseY - bh - 30 * scale, bw * 0.56, 30 * scale);
          g.fillRect(px + bw * 0.45, baseY - bh - 58 * scale, bw * 0.10, 28 * scale);
        }

        // Tiny antenna attached to roof, not floating.
        if (roof !== 0) {
          g.fillRect(px + bw * 0.72, baseY - bh - 68 * scale, 3 * scale, 68 * scale);
        }
      }
    }

    shadowSkyline.push(g);
  }

  // Softer far layer
  makeCleanLayer({
    baseY: 475,
    colour: 0x12081f,
    alpha: 0.18,
    scroll: 0.14,
    depth: 1.0,
    scale: 0.74,
    xOffset: -120
  });

  // Main readable mid layer
  makeCleanLayer({
    baseY: 505,
    colour: 0x07030f,
    alpha: 0.30,
    scroll: 0.24,
    depth: 1.2,
    scale: 0.86,
    xOffset: 60
  });

  // Near chunky layer, toned so it doesn't drown the sky
  makeCleanLayer({
    baseY: 526,
    colour: 0x010003,
    alpha: 0.42,
    scroll: 0.34,
    depth: 1.4,
    scale: 0.98,
    xOffset: -40
  });
}



const DEBUG_BULLET_BUILDING_CORES = false;

const BUILDING_TYPES = [
  { key: "small", hp: 1, score: 25, rage: 8, scale: 0.78, tint: 0xffffff },
  { key: "standard", hp: 2, score: 40, rage: 10, scale: 0.90, tint: 0xffffff },
  { key: "heavy", hp: 4, score: 85, rage: 16, scale: 1.06, tint: 0xd8d8ff },
  { key: "vault", hp: 5, score: 125, rage: 20, scale: 1.00, tint: 0xffee88 },
  { key: "fuel", hp: 3, score: 65, rage: 15, scale: 0.94, tint: 0xff9966 },
  { key: "rageLab", hp: 3, score: 70, rage: 30, scale: 0.98, tint: 0xff66ff }
];

function pickBuildingType() {
  const meters = player ? Math.floor(Math.max(0, player.x - PLAYER_START_X) / 10) : 0;
  const r = Phaser.Math.Between(1, 100);
  if (meters > 720 && r > 90) return BUILDING_TYPES[3]; // vault
  if (meters > 560 && r > 82) return BUILDING_TYPES[5]; // rage lab
  if (meters > 420 && r > 72) return BUILDING_TYPES[4]; // fuel
  if (meters > 260 && r > 58) return BUILDING_TYPES[2]; // heavy
  if (r < 30) return BUILDING_TYPES[0];
  return BUILDING_TYPES[1];
}

function applyBuildingType(b, type, w, h) {
  if (!b || !b.active) return;

  b.buildingType = type.key;
  b.maxHp = type.hp;
  b.hp = type.hp;
  b.scoreValue = type.score;
  b.rageValue = type.rage;
  b.damageStage = 0;

  // Keep original proven building setup, only vary display size/tint.
  b.displayWidth = Math.round(w * type.scale);
  b.displayHeight = Math.round(h * type.scale);
  b.setTint(type.tint);
  b.setAlpha(1);
  b.setDepth(4);
  b.refreshBody();

  // Preserve the proven source-pixel body values from the stable build.
  if (b.body) {
    b.body.setSize(210, 1465, false);
    b.body.setOffset(452, 45);
    b.body.updateFromGameObject();
  }
}

function updateBuildingDamageVisual(b) {
  if (!b || !b.active || !b.maxHp) return;

  const ratio = Phaser.Math.Clamp(b.hp / b.maxHp, 0, 1);
  const stage = ratio <= 0.25 ? 3 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 1 : 0;

  if (stage === b.damageStage) return;
  b.damageStage = stage;

  if (stage === 1) {
    b.setAlpha(0.94);
    smokePuff(b.scene, b.x, b.y - b.displayHeight * 0.35, 0.45);
  } else if (stage === 2) {
    b.setAlpha(0.88);
    smokePuff(b.scene, b.x, b.y - b.displayHeight * 0.45, 0.65);
    sparkShower(b.scene, b.x, b.y - b.displayHeight * 0.48, 0.65);
  } else if (stage === 3) {
    b.setAlpha(0.80);
    smokePuff(b.scene, b.x, b.y - b.displayHeight * 0.55, 0.9);
    sparkShower(b.scene, b.x, b.y - b.displayHeight * 0.56, 0.9);
  }
}

function smokePuff(scene, x, y, power = 1) {
  for (let i = 0; i < 4 * power; i++) {
    const s = scene.add.circle(
      x + Phaser.Math.Between(-18, 18),
      y + Phaser.Math.Between(-8, 8),
      Phaser.Math.Between(8, 18) * power,
      0x171020,
      0.28
    ).setDepth(39);

    scene.tweens.add({
      targets: s,
      x: s.x + Phaser.Math.Between(-26, 26),
      y: s.y - Phaser.Math.Between(28, 68),
      alpha: 0,
      scale: 1.5,
      duration: Phaser.Math.Between(430, 760),
      onComplete: () => s.destroy()
    });
  }
}

function sparkShower(scene, x, y, power = 1) {
  for (let i = 0; i < 7 * power; i++) {
    const s = scene.add.rectangle(x, y, Phaser.Math.Between(4, 9), 2, 0xffdf77, 0.9).setDepth(40);
    scene.tweens.add({
      targets: s,
      x: x + Phaser.Math.Between(-38, 38),
      y: y + Phaser.Math.Between(-34, 28),
      alpha: 0,
      duration: Phaser.Math.Between(210, 390),
      onComplete: () => s.destroy()
    });
  }
}

function spawnCoinBurst(scene, x, y, count) {
  for (let i = 0; i < count; i++) {
    const c = coins.create(
      x + Phaser.Math.Between(-48, 48),
      y + Phaser.Math.Between(-80, -25),
      "coin"
    );
    c.setDepth(30);
    c.setScale(0.52);
    c.setVelocity(Phaser.Math.Between(-50, 70), Phaser.Math.Between(-115, -45));
    c.baseY = c.y;
  }
}

function destroyBuildingVariety(scene, b) {
  if (!b || !b.active) return;

  const type = b.buildingType || "standard";
  const x = b.x;
  const y = b.y - b.displayHeight * 0.35;

  destroyed++;
  addScore(((b.scoreValue || 40) * 2.4) * combo);
  addRage((b.rageValue || 10) * 1.8);

  combo = Math.min(99, combo + 1);
  comboTimer = scene.time.now + 2200;

  if (type === "fuel") {
    premiumExplosion(scene, x, y, 0xff6633, 1.35);
    floatText(scene, x, y - 30, "CHAIN!", "#ff9a3c");
    screenHit(scene, 0.022, 220, true);

    buildings.children.iterate(other => {
      if (!other || !other.active || other === b) return;
      if (Phaser.Math.Distance.Between(x, y, other.x, other.y) < 155) {
        other.hp -= 2;
        updateBuildingDamageVisual(other);
        if (other.hp <= 0) destroyBuildingVariety(scene, other);
      }
    });

    spawnCoinBurst(scene, x, y, 3);
  } else if (type === "vault") {
    premiumExplosion(scene, x, y, 0xffee66, 1.2);
    floatText(scene, x, y - 30, "VAULT!", "#ffe76b");
    spawnCoinBurst(scene, x, y, 12);
  } else if (type === "rageLab") {
    premiumExplosion(scene, x, y, 0xff66ff, 1.2);
    addRage(22);
    floatText(scene, x, y - 30, "RAGE BOOST!", "#ff66ff");
    spawnCoinBurst(scene, x, y, 3);
  } else if (type === "heavy") {
    premiumExplosion(scene, x, y, 0x99ccff, 1.16);
    floatText(scene, x, y - 30, "ARMORED DOWN!", "#bfffff");
    spawnCoinBurst(scene, x, y, 7);
  } else {
    premiumExplosion(scene, x, y, 0xff00ff, 1.0);
    spawnCoinBurst(scene, x, y, type === "small" ? 2 : 5);
  }

  b.disableBody(true, true);
  pulseHud("#ffe600");
  if (comboText) {
    scene.tweens.add({
      targets: comboText,
      scaleX: 1.45,
      scaleY: 1.45,
      duration: 90,
      yoyo: true,
      ease: "Back.easeOut"
    });
  }
  updateHUD();
}

function updateDifficultyDirector(scene) {
  const meters = Math.floor(Math.max(0, player.x - PLAYER_START_X) / 10);
  const target = Math.max(1, Math.floor(meters / 190) + 1);

  if (target > difficultyLevel) {
    difficultyLevel = target;
    showQuestToast(scene, "THREAT LEVEL " + difficultyLevel);
    screenHit(scene, 0.010, 140, true);
  }

  if (scene.time.now > comboTimer && combo > 1) {
    combo = Math.max(1, Math.floor(combo * 0.5));
  }

  if (meters > nextPressureAt) {
    nextPressureAt += Phaser.Math.Between(250, 370);
    showQuestToast(scene, difficultyLevel >= 4 ? "CITY UNDER FIRE" : "PRESSURE RISING");
    addRage(4);
  }
}



































function createScreenFX(scene) {
  // Subtle screen polish: vignette, scanlines and a controllable rage wash.
  // Fixed to camera, drawn above gameplay but below HUD.
  const depth = 82;

  const wash = scene.add.rectangle(480, 270, W, H, 0xff00ff, 0)
    .setScrollFactor(0)
    .setDepth(depth);
  rageScreenWash = wash;

  const v = scene.add.graphics().setScrollFactor(0).setDepth(depth + 1);
  v.fillStyle(0x000000, 0.20);
  v.fillRect(0, 0, W, 26);
  v.fillRect(0, H - 34, W, 34);
  v.fillRect(0, 0, 34, H);
  v.fillRect(W - 34, 0, 34, H);
  v.fillStyle(0x000000, 0.10);
  v.fillRect(0, 0, W, 8);
  v.fillRect(0, H - 8, W, 8);
  vignetteFx = v;

  const s = scene.add.graphics().setScrollFactor(0).setDepth(depth + 2).setAlpha(0.16);
  s.lineStyle(1, 0xffffff, 0.16);
  for (let y = 2; y < H; y += 6) {
    s.lineBetween(0, y, W, y);
  }
  scanlineFx = s;

  scene.tweens.add({
    targets: scanlineFx,
    alpha: { from: 0.08, to: 0.18 },
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut"
  });
}

function startAmbientFX(scene) {
  if (ambientFxEvent) return;

  ambientFxEvent = scene.time.addEvent({
    delay: 120,
    loop: true,
    callback: () => {
      if (!isStarted || isGameOver || !cam) return;

      const sx = cam.scrollX + Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(150, 500);

      // Dust/spark flecks floating through the playable layer.
      const colourRoll = Phaser.Math.Between(0, 4);
      const colour = colourRoll === 0 ? 0xff5cff : colourRoll === 1 ? 0x00eaff : 0xffffff;
      const alpha = colourRoll < 2 ? 0.20 : 0.12;
      const p = scene.add.circle(sx, sy, Phaser.Math.FloatBetween(1.2, 2.8), colour, alpha)
        .setDepth(8.2);

      scene.tweens.add({
        targets: p,
        x: sx - Phaser.Math.Between(20, 70),
        y: sy + Phaser.Math.Between(-14, 18),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1700),
        ease: "Sine.easeOut",
        onComplete: () => p.destroy()
      });
    }
  });
}

function impactFreeze(scene, ms = 36) {
  if (!scene || !scene.physics || !scene.physics.world) return;
  scene.physics.world.pause();
  scene.time.delayedCall(ms, () => {
    if (!isGameOver && scene.physics && scene.physics.world) scene.physics.world.resume();
  });
}

function screenHit(scene, strength = 0.012, duration = 110, flash = false) {
  if (cam && cam.shake) cam.shake(duration, strength);
  if (flash && cam && cam.flash) cam.flash(110, 255, 255, 255, 0.18);
}

function premiumExplosion(scene, x, y, color = 0xff00ff, power = 1) {
  // Big readable arcade hit: flash, shockwave, smoke, sparks and debris.
  const ring = scene.add.circle(x, y, 16 * power)
    .setDepth(58)
    .setStrokeStyle(4 * power, color, 0.95);
  scene.tweens.add({
    targets: ring,
    radius: 82 * power,
    alpha: 0,
    duration: 360,
    ease: "Cubic.easeOut",
    onComplete: () => ring.destroy()
  });

  const flash = scene.add.circle(x, y, 28 * power, 0xffffff, 0.48)
    .setDepth(57);
  scene.tweens.add({
    targets: flash,
    scale: 2.2,
    alpha: 0,
    duration: 180,
    ease: "Quad.easeOut",
    onComplete: () => flash.destroy()
  });

  for (let i = 0; i < 9 * power; i++) {
    const smoke = scene.add.circle(
      x + Phaser.Math.Between(-10, 10),
      y + Phaser.Math.Between(-12, 10),
      Phaser.Math.Between(11, 24) * power,
      0x1a1024,
      0.34
    ).setDepth(19);
    scene.tweens.add({
      targets: smoke,
      x: smoke.x + Phaser.Math.Between(-55, 55),
      y: smoke.y + Phaser.Math.Between(-70, -18),
      alpha: 0,
      scale: 1.75,
      duration: Phaser.Math.Between(520, 880),
      ease: "Sine.easeOut",
      onComplete: () => smoke.destroy()
    });
  }

  for (let i = 0; i < 22 * power; i++) {
    const spark = scene.add.rectangle(
      x,
      y,
      Phaser.Math.Between(5, 12) * power,
      Phaser.Math.Between(2, 5) * power,
      i % 3 === 0 ? 0xffffff : color,
      0.95
    ).setDepth(60);
    spark.rotation = Phaser.Math.FloatBetween(0, Math.PI);
    scene.tweens.add({
      targets: spark,
      x: x + Phaser.Math.Between(-95, 95) * power,
      y: y + Phaser.Math.Between(-85, 55) * power,
      alpha: 0,
      rotation: spark.rotation + Phaser.Math.FloatBetween(-2.5, 2.5),
      duration: Phaser.Math.Between(260, 560),
      ease: "Cubic.easeOut",
      onComplete: () => spark.destroy()
    });
  }

  for (let i = 0; i < 10 * power; i++) {
    const chunk = scene.add.circle(x, y, Phaser.Math.Between(3, 7) * power, 0x12091d, 0.95)
      .setDepth(55);
    scene.tweens.add({
      targets: chunk,
      x: x + Phaser.Math.Between(-85, 85) * power,
      y: y + Phaser.Math.Between(-75, 40) * power,
      alpha: 0,
      scale: 0.4,
      duration: Phaser.Math.Between(360, 640),
      ease: "Quad.easeOut",
      onComplete: () => chunk.destroy()
    });
  }
}

function coinPop(scene, x, y) {
  const glow = scene.add.circle(x, y, 20, 0xfff200, 0.35).setDepth(56);
  scene.tweens.add({
    targets: glow,
    scale: 1.8,
    alpha: 0,
    duration: 220,
    ease: "Sine.easeOut",
    onComplete: () => glow.destroy()
  });

  for (let i = 0; i < 7; i++) {
    const p = scene.add.circle(x, y, Phaser.Math.Between(2, 5), 0xfff200, 0.9).setDepth(57);
    scene.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-34, 34),
      y: y + Phaser.Math.Between(-38, 14),
      alpha: 0,
      duration: 320,
      ease: "Sine.easeOut",
      onComplete: () => p.destroy()
    });
  }
}



function create() {
  highScore = Number(localStorage.getItem("rr_highscore") || 0);
  bestDistance = Number(localStorage.getItem("rr_best_distance") || 0);

  if (this.game.renderer && this.game.renderer.type === Phaser.WEBGL && !this.renderer.pipelines.has("RainbowStar")) {
    this.renderer.pipelines.add("RainbowStar", new RainbowStarPipeline(this.game));
    rainbowPipelineReady = true;
  } else {
    rainbowPipelineReady = !!(this.game.renderer && this.game.renderer.type === Phaser.WEBGL);
  }

  // Split world layers: sky first, shadow skyline depth second, sidewalk/ground third.
  // This keeps the nice depth buildings from covering or erasing the pavement.
  this.add.image(480, 270, "sky").setDisplaySize(W, H).setScrollFactor(0).setDepth(0);
  createShadowSkyline(this);
  // Sidewalk is a separate 960x540 transparent-top tile. It sits in front of skyline shadows
  // but behind gameplay objects, so the pavement is visible without covering characters/tanks.
  this.add.tileSprite(WORLD_W / 2, H / 2, WORLD_W, H, "sidewalk")
    .setOrigin(0.5)
    .setScrollFactor(1)
    .setDepth(3);
  this.add.image(480, 270, "neon_overlay").setScrollFactor(0).setAlpha(0.26).setDepth(9);
  createScreenFX(this);

  ground = this.physics.add.staticGroup();
  // A real visible floor: the top edge is the shared baseline for characters, enemies and buildings.
  const floor = this.add.rectangle(WORLD_W / 2, FLOOR_Y + 22, WORLD_W, 44, 0x000000, 0).setDepth(3);
  // Keep the physics floor but hide the old purple strip so the artwork sidewalk/floor in bg.png remains visible.
  const floorLine = this.add.rectangle(WORLD_W / 2, FLOOR_Y, WORLD_W, 2, 0x000000, 0).setDepth(4);
  const floorGlow = this.add.rectangle(WORLD_W / 2, FLOOR_Y + 3, WORLD_W, 3, 0x000000, 0).setDepth(4);
  this.physics.add.existing(floor, true);
  ground.add(floor);

  buildings = this.physics.add.staticGroup();
  coins = this.physics.add.group({ allowGravity: false });
  tanks = this.physics.add.group({ allowGravity: false });
  choppers = this.physics.add.group({ allowGravity: false });
  projectiles = this.physics.add.group({ allowGravity: false });

  player = this.physics.add.sprite(PLAYER_START_X, PLAYER_START_Y, `${selectedCharacter}_idle`);
  player.setCollideWorldBounds(true);
  player.setScale(0.50);
  player.baseScale = 0.50;
  player.body.setSize(58, 112);
  player.body.setOffset(226, 128);
  player.setDepth(5);
  player.setVisible(false);
  player.body.enable = false;

  this.physics.add.collider(player, ground);
  // Building blocking is handled manually below so the collision matches the visible tower edge.
  this.physics.add.overlap(player, coins, collectCoin, null, this);
  this.physics.add.overlap(player, tanks, touchEnemy, null, this);
  this.physics.add.overlap(player, choppers, touchEnemy, null, this);
  this.physics.add.overlap(player, projectiles, hitByProjectile, null, this);
cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys({
    A: Phaser.Input.Keyboard.KeyCodes.A,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    W: Phaser.Input.Keyboard.KeyCodes.W,
    SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
    R: Phaser.Input.Keyboard.KeyCodes.R
  });

  cam = this.cameras.main;
  cam.startFollow(player, true, 0.09, 0.09);
  cam.setBounds(0, 0, WORLD_W, H);
  cam.setDeadzone(260, 120);
  this.physics.world.setBounds(0, 0, WORLD_W, H);

  createHUD(this);
  createMobileButtons.call(this);
  showStart(this);
  spawnAhead(this);

  this.time.addEvent({
    delay: 1350,
    loop: true,
    callback: () => {
      if (isStarted && !isGameOver) enemyFire(this);
    }
  });
}

function startGame(chosen) {
  selectedCharacter = chosen || selectedCharacter;
  const stats = characterStats[selectedCharacter];
  health = stats.hp;
  questLevels = { buildings: 0, coins: 0, distance: 0 };
  selectNewQuest(null);
  isStarted = true;
  player.setTexture(`${selectedCharacter}_idle`);
  player.setVisible(true);
  player.body.enable = true;
  player.setPosition(PLAYER_START_X, PLAYER_START_Y);
  updateHUD();
  startAmbientFX(player.scene);
  if (startPanel) startPanel.destroy();
}

function showStart(scene) {
  // Clean character select layout: fixed vertical zones so cards, labels and controls never overlap.
  startPanel = scene.add.container(480, 304).setScrollFactor(0).setDepth(100);
  startPanel.setAlpha(0);
  scene.tweens.add({ targets: startPanel, alpha: 1, y: 282, duration: 360, ease: "Cubic.easeOut" });

  const bg = scene.add.rectangle(0, 0, 865, 400, 0x090012, 0.985);
  bg.setStrokeStyle(4, 0xff00ff, 0.9);

  // Single-line brand logo: avoids the old stacked RAINBOW/RAMPAGE overlap.
  const title = scene.add.image(0, -151, "logoWide").setScale(0.72);
  scene.tweens.add({ targets: title, scale: 0.745, duration: 1150, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  const titleGlow = scene.add.rectangle(0, -151, 520, 78, 0xff00ff, 0.035);
  titleGlow.setStrokeStyle(2, 0xff00ff, 0.16);

  const subBg = scene.add.rectangle(0, -96, 330, 32, 0x050008, 0.72);
  subBg.setStrokeStyle(2, 0xffffff, 0.18);
  const sub = scene.add.text(0, -96, "CHOOSE YOUR RAMPAGER", hudStyle(17, "#ffffff")).setOrigin(0.5);

  startPanel.add([bg, titleGlow, title, subBg, sub]);

  const chars = [
    { key: "gorilla", name: "GORILLA", stat: "Balanced", color: "#00ffff" },
    { key: "croc",    name: "CROC",    stat: "Fast",     color: "#8cff00" },
    { key: "cow",     name: "COW",     stat: "Tanky",    color: "#ff44aa" },
    { key: "eagle",   name: "EAGLE",   stat: "Jump+",    color: "#ffe600" },
  ];

  chars.forEach((ch, i) => {
    const x = -315 + i * 210;
    const card = scene.add.rectangle(x, 0, 162, 152, 0xffffff, 0.07);
    card.setStrokeStyle(2, 0xffffff, 0.38);

    const sprite = scene.add.image(x, -38, `${ch.key}_portrait`).setScale(0.48);

    const name = scene.add.text(x, 48, ch.name, {
      fontFamily: "Arial Black",
      fontSize: "17px",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    const stat = scene.add.text(x, 72, ch.stat, {
      fontFamily: "Arial Black",
      fontSize: "14px",
      color: ch.color,
      align: "center",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    card.setInteractive({ useHandCursor: true });
    sprite.setInteractive({ useHandCursor: true });
    name.setInteractive({ useHandCursor: true });
    stat.setInteractive({ useHandCursor: true });

    const choose = () => startGame(ch.key);
    card.on("pointerdown", choose);
    sprite.on("pointerdown", choose);
    name.on("pointerdown", choose);
    stat.on("pointerdown", choose);

    card.on("pointerover", () => { card.setFillStyle(0xffffff, 0.13); card.setStrokeStyle(3, 0x00ffff, 0.75); });
    card.on("pointerout", () => { card.setFillStyle(0xffffff, 0.07); card.setStrokeStyle(2, 0xffffff, 0.38); });

    card.setAlpha(0); sprite.setAlpha(0); name.setAlpha(0); stat.setAlpha(0);
    startPanel.add([card, sprite, name, stat]);
    scene.tweens.add({ targets: [card, sprite, name, stat], alpha: 1, duration: 360, delay: 180 + i * 90, ease: "Sine.easeOut" });
    scene.tweens.add({ targets: sprite, y: sprite.y - 4, duration: 1100 + i * 80, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  });

  const controlsY = 124;
  const moveBox = scene.add.rectangle(-170, controlsY, 150, 26, 0x12071d, 0.85).setStrokeStyle(2, 0xffffff, 0.35);
  const moveText = scene.add.text(-170, controlsY, "ARROWS / WASD", hudStyle(13, "#ffffff")).setOrigin(0.5);
  const moveEq = scene.add.text(-75, controlsY, "= MOVE", hudStyle(13, "#ffffff")).setOrigin(0, 0.5);

  const smashBox = scene.add.rectangle(120, controlsY, 76, 26, 0x12071d, 0.85).setStrokeStyle(2, 0xffffff, 0.35);
  const smashText = scene.add.text(120, controlsY, "SPACE", hudStyle(13, "#ffffff")).setOrigin(0.5);
  const smashEq = scene.add.text(172, controlsY, "= SMASH", hudStyle(13, "#ffffff")).setOrigin(0, 0.5);

  const notes = scene.add.text(0, 158, "Mobile buttons included  •  Endless mode  •  Leaderboard planned", {
    fontFamily: "Arial Black", fontSize: "13px", color: "#ffffff",
    align: "center", stroke: "#000000", strokeThickness: 4
  }).setOrigin(0.5);

  const start = scene.add.text(0, 186, "TAP A CHARACTER TO START", hudStyle(20, "#00ffff")).setOrigin(0.5);
  scene.tweens.add({ targets: start, scale: 1.055, duration: 720, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

  moveBox.setAlpha(0); moveText.setAlpha(0); moveEq.setAlpha(0); smashBox.setAlpha(0); smashText.setAlpha(0); smashEq.setAlpha(0); notes.setAlpha(0); start.setAlpha(0);
  startPanel.add([moveBox, moveText, moveEq, smashBox, smashText, smashEq, notes, start]);
  scene.tweens.add({ targets: [moveBox, moveText, moveEq, smashBox, smashText, smashEq], alpha: 1, duration: 320, delay: 560, ease: "Sine.easeOut" });
  scene.tweens.add({ targets: notes, alpha: 1, duration: 320, delay: 680, ease: "Sine.easeOut" });
  scene.tweens.add({ targets: start, alpha: 1, duration: 320, delay: 780, ease: "Sine.easeOut" });
}
function spawnAhead(scene) {
  while (nextSpawnX < player.x + 1300) {
    spawnChunk(scene, nextSpawnX);
    nextSpawnX += Phaser.Math.Between(160, 260);
  }
}

function spawnChunk(scene, x) {
  const type = pickBuildingType();
  const h = Phaser.Math.Between(type.key === "small" ? 270 : 330, type.key === "heavy" || type.key === "vault" ? 620 : 550);
  const w = Phaser.Math.Between(type.key === "small" ? 200 : 235, type.key === "heavy" || type.key === "vault" ? 405 : 355);

  // Anchor buildings by their FEET, not their centre. This keeps every random
  // height grounded on the same street line and stops tall variants floating.
  const b = buildings.create(x, BUILDING_FEET_Y, "building");
  b.setOrigin(0.5, 1);
  b.displayWidth = w;
  b.displayHeight = h;
  b.setDepth(4);
  b.refreshBody();

  // The PNG has transparent/visual padding, so the physics body must be
  // narrower than the full image. This removes the invisible wall that stopped
  // the player before the visible building edge.
  // Keep the collision much slimmer than the visible art so there is no invisible wall.
  // The building graphic is wide with decorative edges/transparent padding; only the core tower blocks movement.
  // IMPORTANT: Phaser body sizes/offsets are based on the SOURCE PNG pixels,
  // not displayWidth/displayHeight. building.png has a lot of transparent padding,
  // so using display pixels here creates an invisible wall well before the visible edge.
  // These source-pixel values hug the actual tower instead.
  b.body.setSize(210, 1465, false);
  b.body.setOffset(452, 45);
  b.body.updateFromGameObject();
  applyBuildingType(b, type, w, h);

  if (Phaser.Math.Between(1, 100) <= 78) {
    const coin = coins.create(x + Phaser.Math.Between(-15, 45), Phaser.Math.Between(150, 350), "coin");
    coin.setDepth(30);
    coin.setScale(0.58);
    coin.baseY = coin.y;
    scene.tweens.add({
      targets: coin,
      y: coin.y - 6,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    scene.tweens.add({
      targets: coin,
      scale: 0.64,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  const heat = Math.min(8, 1 + Math.floor(player.x / 1200));
  if (x > 650 && Phaser.Math.Between(1, 100) <= Math.min(52, 14 + heat * 3 + difficultyLevel * 3)) {
    const t = tanks.create(x + Phaser.Math.Between(20, 90), TANK_FEET_Y, "tank");
    t.setOrigin(0.5, 1);
    t.setDepth(7); // tanks render in front of buildings
    if (t.body) {
      t.body.allowGravity = false;
      t.body.immovable = true;
      t.body.setSize(64, 30);
      t.body.setOffset(8, 14);
    }
    t.setVelocityX(-Math.abs(80 * (1 + heat * 0.08 + difficultyLevel * 0.025)));
    if (difficultyLevel >= 3 && Phaser.Math.Between(1, 100) > 76) {
      t.enemyType = "armored";
      t.hp = 2;
      t.setTint(0xff66ff);
      t.setScale(1.12);
      t.setVelocityX(t.body.velocity.x * 0.82);
    } else if (difficultyLevel >= 2 && Phaser.Math.Between(1, 100) > 70) {
      t.enemyType = "fast";
      t.hp = 1;
      t.setTint(0x66ffff);
      t.setVelocityX(t.body.velocity.x * 1.35);
    } else {
      t.enemyType = "normal";
      t.hp = 1;
    }
    t.setCollideWorldBounds(false);
  }

  if (x > 900 && Phaser.Math.Between(1, 100) <= Math.min(40, 9 + heat * 2 + difficultyLevel * 2)) {
    const c = choppers.create(x + Phaser.Math.Between(20, 120), Phaser.Math.Between(125, 220), "chopper");
    c.setDepth(32);

    c.setVelocityX((Phaser.Math.Between(0, 1) ? 55 : -55) * (1 + heat * 0.07 + difficultyLevel * 0.03));
    if (difficultyLevel >= 3 && Phaser.Math.Between(1, 100) > 74) {
      c.enemyType = "elite";
      c.hp = 2;
      c.setTint(0xff66ff);
      c.setScale(1.10);
    } else {
      c.enemyType = "normal";
      c.hp = 1;
    }
    c.startX = c.x;
  }
}

function cleanupBehind() {
  const killX = player.x - 700;
  buildings.children.iterate(o => { if (o && o.active && o.x < killX) o.disableBody(true, true); });
  coins.children.iterate(o => { if (o && o.active && o.x < killX) o.disableBody(true, true); });
  tanks.children.iterate(o => { if (o && o.active && o.x < killX) o.disableBody(true, true); });
  choppers.children.iterate(o => { if (o && o.active && o.x < killX) o.disableBody(true, true); });
  projectiles.children.iterate(o => { if (o && o.active && o.x < killX) o.disableBody(true, true); });
}

function createHUD(scene) {
  const hudDepth = 90;

  const hud = scene.add.container(0, 0).setScrollFactor(0).setDepth(hudDepth);

  // V5 HUD: wider two-tier layout. Stats get full breathing room, rage becomes a wide strip.
  const shell = scene.add.image(480, 66, "hudShell")
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(hudDepth);
  hud.add(shell);
  hudShellRef = shell;

  const logo = scene.add.image(104, 58, "logoWide")
    .setScale(0.39)
    .setScrollFactor(0)
    .setDepth(hudDepth + 1);
  hud.add(logo);

  const valueStyle = (size = 24, color = "#ffffff") => ({
    fontFamily: "Arial Black, Impact, sans-serif",
    fontSize: size + "px",
    color,
    stroke: "#000000",
    strokeThickness: 5,
    shadow: { offsetX: 0, offsetY: 0, color: color, blur: 3, stroke: false, fill: true }
  });

  scoreText = scene.add.text(282, 62, "0", valueStyle(30, "#ffffff")).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);
  scoreText.maxWidth = 58;
  coinText = scene.add.text(428, 62, "0", valueStyle(29, "#ffffff")).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);
  coinText.maxWidth = 45;
  healthText = scene.add.text(570, 61, "♥♥♥♥♥", valueStyle(17, "#ff4da6")).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);
  healthText.maxWidth = 58;
  distanceText = scene.add.text(722, 62, "0m", valueStyle(28, "#ffffff")).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);
  distanceText.maxWidth = 60;
  difficultyText = scene.add.text(858, 61, "🔥🔥🔥", valueStyle(16, "#ff9a00")).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);
  difficultyText.maxWidth = 78;
  heatBarFill = scene.add.graphics().setScrollFactor(0).setDepth(hudDepth + 3);
  rageBarFill = scene.add.graphics().setScrollFactor(0).setDepth(hudDepth + 3);
  rageTimerText = scene.add.text(815, 112, "0%", valueStyle(19, "#00ffff"))
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(hudDepth + 3);
  rageText = scene.add.text(0, 0, "").setVisible(false);

  const missionShell = scene.add.image(810, 162, "missionShell")
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(hudDepth - 1);
  missionShellRef = missionShell;

  missionText = scene.add.text(730, 126, "COW MISSION", hudStyle(11, "#73ff00"))
    .setOrigin(0, 0).setScrollFactor(0).setDepth(hudDepth);
  destroyedText = scene.add.text(730, 149, "Destroy buildings\n0/50", hudStyle(13, "#ffffff"))
    .setOrigin(0, 0).setScrollFactor(0).setDepth(hudDepth);
  comboText = scene.add.text(900, 132, "x1", hudStyle(27, "#7dff00"))
    .setOrigin(1, 0).setScrollFactor(0).setDepth(hudDepth + 1);
pauseText = scene.add.text(946, 18, "Ⅱ", hudStyle(24, "#ffffff"))
    .setOrigin(0.5, 0).setScrollFactor(0).setDepth(hudDepth + 2);

  scene.tweens.add({
    targets: shell,
    alpha: { from: 0.96, to: 1 },
    duration: 900,
    yoyo: true,
    repeat: -1
  });
}

function hudStyle(size, color="#ffffff") {
  return { fontFamily: "Arial Black", fontSize: size + "px", color, stroke: "#000000", strokeThickness: 4, shadow: { offsetX: 0, offsetY: 0, color, blur: 3, fill: true } };
}


function setPlayerAction(action) {
  if (!player || !isStarted || isGameOver) return;
  const textureKey = `${selectedCharacter}_${action}`;
  if (player.texture && player.texture.key !== textureKey) {
    player.setTexture(textureKey);
  }
}


function getBuildingCoreRect(b) {
  // Visible blocking area for the mega-building.
  // Keep this deliberately narrower than the art so the cow can run right up to the visible edge.
  const coreW = b.displayWidth * 0.42;
  const coreH = b.displayHeight * 0.96;
  // The visible PNG has wide transparent/decorative sides.
  // Keep blocking tight so the cow can stand right up to the tower edge.
  return new Phaser.Geom.Rectangle(
    b.x - coreW / 2,
    BUILDING_FEET_Y - coreH,
    coreW,
    coreH
  );
}

function resolveBuildingBlocking() {
  if (!player || !player.body) return;
  const p = player.body;
  const playerRect = new Phaser.Geom.Rectangle(p.x, p.y, p.width, p.height);
  let best = null;

  buildings.children.iterate(b => {
    if (!b || !b.active) return;
    const r = getBuildingCoreRect(b);
    if (!Phaser.Geom.Rectangle.Overlaps(playerRect, r)) return;

    const overlapLeft = playerRect.right - r.left;
    const overlapRight = r.right - playerRect.left;
    const push = (player.x < b.x) ? -overlapLeft : overlapRight;
    const absPush = Math.abs(push);
    if (!best || absPush < best.absPush) best = { push, absPush };
  });

  if (best) {
    player.x += best.push;
    player.setVelocityX(0);
  }
}

function update(time, delta) {
  if (!isStarted) return;

  if (isGameOver) {
    if (Phaser.Input.Keyboard.JustDown(keys.R)) location.reload();
    return;
  }

  spawnAhead(this);
  cleanupBehind();
  updateDifficultyDirector(this);
  buildings.children.iterate(b => { if (b && b.active) updateBuildingDamageVisual(b); });

  const stat = characterStats[selectedCharacter];
  const onFloor = player.body.blocked.down || player.body.touching.down;
  const left = cursors.left.isDown || keys.A.isDown || leftDown;
  const right = cursors.right.isDown || keys.D.isDown || rightDown;
  const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(keys.W) || jumpDown;
  const smashPressed = Phaser.Input.Keyboard.JustDown(keys.SPACE) || smashDown;

  const speed = (rageMode ? 410 : 255) * stat.speed;
  player.setVelocityX(0);

  if (left) { player.setVelocityX(-speed); player.setFlipX(true); }
  if (right) { player.setVelocityX(speed); player.setFlipX(false); }

  resolveBuildingBlocking();

  if (onFloor) {
    jumpsUsed = 0;
  }

  if (jumpPressed && jumpsUsed < 2) {
    // First jump stays powerful, second jump is weaker so the player cannot float across the top of the screen.
    const jumpPower = jumpsUsed === 0 ? -595 : -365;
    player.setVelocityY(jumpPower * stat.jump);
    jumpsUsed++;
    jumpDown = false;
  }

  
  if (smashAnimTimer > 0) {
    smashAnimTimer -= delta;
    setPlayerAction("smash");
  } else if (!onFloor) {
    setPlayerAction("jump");
  } else if (left || right) {
    runFrameTimer += delta;
    setPlayerAction((Math.floor(runFrameTimer / 120) % 2 === 0) ? "run1" : "run2");
  } else {
    setPlayerAction("idle");
  }

  if (smashPressed && canSmash) doSmash(this);
tanks.children.iterate(e => {
    if (!e || !e.active) return;
    e.y = TANK_FEET_Y;
    if (!e.nextTankShotAt) e.nextTankShotAt = this.time.now + Phaser.Math.Between(900, 1600);
    if (this.time.now > e.nextTankShotAt && Math.abs(e.x - player.x) < 720 && e.x > player.x + 80) {
      e.nextTankShotAt = this.time.now + Phaser.Math.Between(Math.max(950, 2100 - difficultyLevel * 70), Math.max(1400, 2800 - difficultyLevel * 80));
      const p = projectiles.create(e.x - 28, e.y - 34, "bullet");
      p.isPlayerBullet = false;
      p.setDepth(33);
      p.body.allowGravity = false;
      p.setTint(0xff6633);
      p.setVelocityX(-Phaser.Math.Between(180, 260));
      p.setVelocityY(Phaser.Math.Between(-20, 20));
      const flash = this.add.image(e.x - 44, e.y - 38, "muzzle_flash").setDepth(34).setScale(0.22).setFlipX(true);
      this.tweens.add({ targets: flash, alpha: 0, scale: 0.42, duration: 105, onComplete: () => flash.destroy() });
    }
    if (e.body) {
      e.body.allowGravity = false;
      e.body.velocity.y = 0;
    }
    if (e.body.blocked.left) e.setVelocityX(85);
    if (e.body.blocked.right) e.setVelocityX(-85);
  });

  choppers.children.iterate(c => {
    if (!c || !c.active) return;
    c.y += Math.sin(time / 280 + c.x) * 0.45;
    if (Math.abs(c.x - c.startX) > 115) c.setVelocityX(-c.body.velocity.x);
  });

  coins.children.iterate(c => { if (c && c.active) c.angle += 2; });
  projectiles.children.iterate(p => {
    if (!p || !p.active) return;
    if (Phaser.Math.Between(1, 100) <= 35) {
      const trail = this.add.circle(p.x, p.y, 3, 0xfff2aa, 0.45).setDepth(31);
      this.tweens.add({ targets: trail, alpha: 0, scale: 0.25, duration: 160, onComplete: () => trail.destroy() });
    }
    if (p.x < player.x - 900 || p.x > player.x + 1200 || p.y > H) p.disableBody(true, true);
  });

  if (comboTimer > 0) comboTimer -= delta;
  else {
    combo = 1;
    comboText.setText("x1");
  }

  if (rage >= 100 && !rageMode) activateRage(this);

  const chaosZone = Math.floor(player.x / 5000);
  if (chaosZone > 0 && chaosZone !== lastChaosZone) {
    lastChaosZone = chaosZone;
    chaosSpike(this);
  }

  const distance = Math.floor(player.x / 10);
  if (distance >= lastMilestone + 100) {
    lastMilestone = distance;
    addScore(100);
    floatText(this, player.x, player.y - 100, "+100 DISTANCE", "#00ffff");
  }

  // Subtle premium camera breathing without moving the game world.
  if (cam && !rageMode) {
    const targetZoom = (Math.abs(player.body.velocity.x) > 300) ? 1.018 : 1.0;
    cam.setZoom(Phaser.Math.Linear(cam.zoom, targetZoom, 0.018));
  }

  checkQuestCompletion(this);
  updateHUD();

  if (player.y > 700) gameOver(this);
}

function doSmash(scene) {
  canSmash = false;
  smashDown = false;
  smashAnimTimer = 220;
  setPlayerAction("smash");

  const dir = player.flipX ? -1 : 1;

  // Tight front-only hit window. This stops one smash destroying two buildings.
  const smashW = rageMode ? 105 : 85;
  const smashH = 105;
  const frontX = dir > 0 ? player.body.x + player.body.width : player.body.x;
  const smashX = dir > 0 ? frontX - 4 : frontX - smashW + 4;
  const smashY = player.body.y + 10;
  const smashZone = new Phaser.Geom.Rectangle(smashX, smashY, smashW, smashH);

  const flash = scene.add.image(player.x + dir * 82, player.y - 18, "muzzle_flash").setDepth(60).setScale(0.40);
  flash.setFlipX(dir < 0);
  scene.tweens.add({ targets: flash, alpha: 0, scale: 0.62, duration: 110, onComplete: () => flash.destroy() });
  let hit = false;

  let targetBuilding = null;
  let targetDist = Infinity;
  buildings.children.iterate(b => {
    if (!b || !b.active) return;
    const r = getBuildingCoreRect(b);
    if (!Phaser.Geom.Rectangle.Overlaps(smashZone, r)) return;
    const d = Math.abs(b.x - player.x);
    if (d < targetDist) {
      targetDist = d;
      targetBuilding = b;
    }
  });

  if (targetBuilding) {
    const b = targetBuilding;
    hit = true;
    b.hp -= rageMode ? 2 : 1;
    sparkShower(scene, b.x, b.y - b.displayHeight * 0.46, 0.55);
    updateBuildingDamageVisual(b);
    floatText(scene, b.x, b.y - 40, b.hp <= 0 ? (combo >= 5 ? "OVERKILL!" : "SMASH!") : "CRACK!", b.hp <= 0 ? (combo >= 5 ? "#ff3cff" : "#ffe600") : "#ffffff");
    if (b.hp <= 0) {
      destroyBuildingVariety(scene, b);
      screenHit(scene, 0.032, 260, true);
      impactFreeze(scene, 68);
    } else {
      screenHit(scene, 0.007, 70, false);
    }
  }

  tanks.children.iterate(e => {
    if (!e || !e.active) return;
    if (Phaser.Geom.Rectangle.Overlaps(smashZone, e.getBounds())) {
      hit = true;
      e.hp = (e.hp || 1) - 1;
      if (e.hp <= 0) {
        e.disableBody(true, true);
        addScore(e.enemyType === "armored" ? 120 : 65);
        addRage(18);
        combo = Math.min(99, combo + 1);
        comboTimer = scene.time.now + 2200;
        floatText(scene, e.x, e.y - 35, e.enemyType === "armored" ? "ARMOR CRUSH!" : "BONK!", "#00ffff");
        burst(scene, e.x, e.y, 0x00ffff);
        screenHit(scene, 0.015, 130, false);
        impactFreeze(scene, 28);
      } else {
        floatText(scene, e.x, e.y - 35, "DENT!", "#ffffff");
        sparkShower(scene, e.x, e.y - 20, 0.6);
      }
    }
  });

  choppers.children.iterate(e => {
    if (!e || !e.active) return;
    if (Phaser.Geom.Rectangle.Overlaps(smashZone, e.getBounds())) {
      hit = true;
      e.hp = (e.hp || 1) - 1;
      if (e.hp <= 0) {
        e.disableBody(true, true);
        addScore(e.enemyType === "elite" ? 150 : 90);
        addRage(22);
        combo = Math.min(99, combo + 1);
        comboTimer = scene.time.now + 2200;
        floatText(scene, e.x, e.y - 30, e.enemyType === "elite" ? "ELITE DOWN!" : "WRECKED!", "#ff66ff");
        burst(scene, e.x, e.y, 0xff66ff);
        screenHit(scene, 0.018, 150, false);
        impactFreeze(scene, 30);
      } else {
        floatText(scene, e.x, e.y - 30, "HIT!", "#ffffff");
        sparkShower(scene, e.x, e.y, 0.55);
      }
    }
  });

  if (!hit) {
    screenHit(scene, 0.004, 45, false);
  }

  scene.time.delayedCall(rageMode ? 115 : 245, () => canSmash = true);
}

function chaosSpike(scene) {
  floatText(scene, player.x + 250, player.y - 120, "CHAOS WAVE!", "#ff004c");
  screenHit(scene, 0.018, 260, true);

  for (let i = 0; i < 2; i++) {
    const t = tanks.create(player.x + 500 + i * 170, TANK_FEET_Y, "tank");
    t.setOrigin(0.5, 1);
    t.setDepth(7); // tanks render in front of buildings
    if (t.body) {
      t.body.allowGravity = false;
      t.body.immovable = true;
      t.body.setSize(64, 30);
      t.body.setOffset(8, 14);
    }
    t.setVelocityX(-110 - i * 20);
    t.setCollideWorldBounds(false);
  }

  if (Math.random() < 0.75) {
    const c = choppers.create(player.x + 650, Phaser.Math.Between(125, 220), "chopper");    c.setDepth(32);

    c.setVelocityX(-85);
    c.startX = c.x;
  }
}

function enemyFire(scene) {
  const shooters = [];
  tanks.children.iterate(t => { if (t && t.active && Math.abs(t.x - player.x) < 850) shooters.push(t); });
  choppers.children.iterate(c => { if (c && c.active && Math.abs(c.x - player.x) < 850) shooters.push(c); });
  if (!shooters.length) return;
  const s = Phaser.Utils.Array.GetRandom(shooters);
  const p = projectiles.create(s.x, s.y, "bullet");
  p.setDepth(33);
  p.isPlayerBullet = false;
  const shotFlash = scene.add.image(s.x, s.y, "muzzle_flash").setDepth(34).setScale(0.22);
  scene.tweens.add({ targets: shotFlash, alpha: 0, scale: 0.42, duration: 105, onComplete: () => shotFlash.destroy() });
  const angle = Phaser.Math.Angle.Between(s.x, s.y, player.x, player.y);
  const heat = Math.min(8, 1 + Math.floor(player.x / 1200));
  const bulletSpeed = 250 + heat * 22;
  p.setVelocity(Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed);
}

function collectCoin(player, coin) {
  coin.disableBody(true, true);
  coinCount++;
  addScore(10);
  addRage(5);
  burst(this, coin.x, coin.y, 0xffff00);
}

function touchEnemy(player, enemy) {
  if (rageMode) {
    enemy.disableBody(true, true);
    addScore(80);
    addRage(6);
    burst(this, enemy.x, enemy.y, 0x00ffff);
    const spark = this.add.image(enemy.x, enemy.y, "impact_spark").setDepth(59).setScale(0.42);
    this.tweens.add({ targets: spark, alpha: 0, scale: 0.75, duration: 180, onComplete: () => spark.destroy() });
    screenHit(this, 0.009, 80, false);
    return;
  }
  damage(this, 1);
}

function hitByProjectile(player, bullet) {
  const bx = bullet.x, by = bullet.y;
  bullet.disableBody(true, true);
  premiumExplosion(this, bx, by, 0xffaa33, 0.45);
  if (!rageMode) damage(this, 1);
}

function damage(scene, amount) {
  if (player.invulnerable) return;
  health -= amount;
  player.invulnerable = true;
  player.setTint(0xff0000);
  screenHit(scene, 0.018, 160, true);
  updateHUD();

  scene.time.delayedCall(850, () => {
    player.invulnerable = false;
    player.clearTint();
    if (rageMode) startRainbowFlash(scene);
  });

  if (health === 1) {
    player.setTint(0xff3333);
    floatText(scene, player.x, player.y - 90, "LOW HP!", "#ff3333");
    screenHit(scene, 0.02, 220, true);
  }

  if (health <= 0) gameOver(scene);
}

function addScore(amount) {
  comboTimer = 2200;
  score += amount * combo;
  combo = Math.min(9, combo + 1);

  const scene = player && player.scene ? player.scene : null;
  if (scene && combo === 3) floatText(scene, player.x, player.y - 85, "RAMPAGE!", "#ff00ff");
  if (scene && combo === 5) floatText(scene, player.x, player.y - 85, "UNSTOPPABLE!", "#00ffff");
  if (scene && combo === 8) floatText(scene, player.x, player.y - 85, "GOD MODE!", "#ffff00");

  updateHUD();
}

function addRage(amount) {
  if (!rageMode) rage = Math.min(100, rage + amount * characterStats[selectedCharacter].rage);
  updateHUD();
  pulseHud(amount >= 10 ? "#ff4df3" : "#00ffff");
}


function getQuestValue(type) {
  if (type === "buildings") return destroyed;
  if (type === "coins") return coinCount;
  if (type === "distance") return Math.floor(player.x / 10);
  return 0;
}

function selectNewQuest(previousType) {
  let pool = QUESTS.filter(q => q.type !== previousType);
  if (!pool.length) pool = QUESTS;
  const template = Phaser.Utils.Array.GetRandom(pool);
  const level = questLevels[template.type] || 0;
  currentQuest = {
    type: template.type,
    label: template.label,
    target: template.base * (level + 1),
    start: getQuestValue(template.type)
  };
}

function getQuestProgress() {
  if (!currentQuest) return { progress: 0, target: 50, label: "Destroy buildings" };
  const progress = Math.max(0, getQuestValue(currentQuest.type) - currentQuest.start);
  return { progress, target: currentQuest.target, label: currentQuest.label };
}

function checkQuestCompletion(scene) {
  if (!currentQuest || !isStarted || isGameOver) return;
  const q = getQuestProgress();
  if (q.progress < q.target) return;

  const completedType = currentQuest.type;
  questLevels[completedType] = (questLevels[completedType] || 0) + 1;
  health = Math.min(9, health + 1);
  addScore(250);
  addRage(15);
  floatText(scene, player.x + 80, player.y - 115, "QUEST COMPLETE +1 LIFE", "#73ff00");
  showQuestToast(scene, "+1 LIFE  •  NEW MISSION");
  if (missionShellRef) {
    scene.tweens.add({ targets: missionShellRef, scaleX: 1.08, scaleY: 1.08, alpha: 1, duration: 120, yoyo: true, ease: "Sine.easeOut" });
  }
  selectNewQuest(completedType);
}


function pulseHud(color = "#00ffff") {
  const scene = player && player.scene;
  if (!scene || !hudShellRef) return;
  scene.tweens.add({
    targets: hudShellRef,
    alpha: { from: 1, to: 0.78 },
    duration: 75,
    yoyo: true,
    ease: "Sine.easeOut"
  });
}

function showQuestToast(scene, message) {
  if (!scene) return;
  if (questToast && questToast.destroy) questToast.destroy();

  const c = scene.add.container(480, 190).setScrollFactor(0).setDepth(130);
  const bg = scene.add.rectangle(0, 0, 380, 42, 0x061006, 0.88)
    .setStrokeStyle(3, 0x73ff00, 1);
  const txt = scene.add.text(0, -2, message, {
    fontFamily: "Arial Black, Impact, sans-serif",
    fontSize: "18px",
    color: "#73ff00",
    stroke: "#000000",
    strokeThickness: 5
  }).setOrigin(0.5);
  c.add([bg, txt]);
  c.setAlpha(0);
  c.setY(160);
  questToast = c;

  scene.tweens.add({ targets: c, y: 190, alpha: 1, duration: 180, ease: "Back.easeOut" });
  scene.time.delayedCall(1000, () => {
    if (!c.active) return;
    scene.tweens.add({ targets: c, y: 145, alpha: 0, duration: 230, ease: "Sine.easeIn", onComplete: () => c.destroy() });
  });
}

function updateHUD() {
  if (!scoreText) return;
  const dist = Math.floor(player.x / 10);
  const heat = Math.min(8, 1 + Math.floor(player.x / 1200));
  scoreText.setText(String(score));
  if (missionText) missionText.setText(characterStats[selectedCharacter].name + " MISSION");
  if (destroyedText) {
    const q = getQuestProgress();
    destroyedText.setText(q.label + "\n" + Math.min(q.progress, q.target) + "/" + q.target);
  }
  distanceText.setText(dist + "m");
  healthText.setText("♥".repeat(Math.max(0, health)) || "0");
  if (coinText) coinText.setText(String(coinCount));
  if (difficultyText) difficultyText.setText("🔥".repeat(Math.min(5, Math.max(1, heat))));
  if (heatBarFill && heatBarFill.clear) {
    heatBarFill.clear();
    const heatPct = Math.min(1, heat / 8);
    heatBarFill.fillStyle(0xff7a00, 0.95);
    heatBarFill.fillRoundedRect(842, 72, 54 * heatPct, 4, 2);
    heatBarFill.lineStyle(1, 0xffaa00, 0.45);
    heatBarFill.strokeRoundedRect(842, 72, 54, 4, 2);
  }
  const pct = rageMode ? Math.max(0, (rageEndAt - player.scene.time.now) / 7000) : rage / 100;
  const barMax = 468;
  const barW = Math.max(0, Math.min(barMax, barMax * pct));
  if (rageBarFill && rageBarFill.clear) {
    rageBarFill.clear();
    const colors = [0xff1d25, 0xff8a00, 0xfff200, 0x00ff66, 0x00d9ff, 0x8a4dff, 0xff00ff];
    const segW = barMax / colors.length;
    const barX = 300;
    const barY = 101;
    for (let i = 0; i < colors.length; i++) {
      const x = barX + i * segW;
      const w = Math.max(0, Math.min(segW + 1, barW - i * segW));
      if (w > 0) {
        rageBarFill.fillStyle(colors[i], 1);
        rageBarFill.fillRoundedRect(x, barY, w, 12, 5);
      }
    }
    if (rageMode || rage >= 100) {
      rageBarFill.lineStyle(2, 0xffffff, 0.85);
      rageBarFill.strokeRoundedRect(barX - 1, barY - 1, barMax + 2, 14, 6);
    }
  }
  if (rageText && rageText.setText) rageText.setText(rageMode ? "⚡ RAINBOW" : "⚡ RAGE");
  rageTimerText.setText(rageMode ? Math.ceil(Math.max(0, rageEndAt - player.scene.time.now) / 1000) + "s" : Math.floor(rage) + "%");
  if (rageScreenWash) {
    if (rageMode) {
      const pulse = 0.09 + Math.sin(player.scene.time.now / 80) * 0.035;
      rageScreenWash.setFillStyle(0xff00ff, pulse);
    } else if (health <= 1) {
      const low = 0.05 + Math.sin(player.scene.time.now / 95) * 0.025;
      rageScreenWash.setFillStyle(0xff0033, low);
    } else {
      rageScreenWash.setFillStyle(0xff00ff, 0);
    }
  }
  comboText.setText("x" + combo + (combo >= 5 ? " CHAOS" : ""));
  const comboScale = combo >= 7 ? 1.32 : combo >= 4 ? 1.22 : 1.12;
  comboText.setScale(comboScale);
  if (combo >= 6) comboText.setTint(0xff3cff);
  else if (combo >= 3) comboText.setTint(0xffe600);
  else comboText.clearTint();
  setTimeout(() => { if (comboText && comboText.active) comboText.setScale(1); }, 80);
  fitHudValue(scoreText);
  fitHudValue(coinText);
  fitHudValue(healthText);
  fitHudValue(distanceText);
}

function fitHudValue(textObj, maxScale = 1) {
  if (!textObj) return;
  textObj.setScale(maxScale);
  const limit = textObj.maxWidth || 96;
  if (textObj.width > limit) {
    textObj.setScale(Math.max(0.62, limit / textObj.width));
  }
}

function startRainbowFlash(scene) {
  stopRainbowFlash();
  if (!player || !player.active) return;

  player.clearTint();

  // Proper Mario-star style rainbow: several moving rainbow bands across the character,
  // not one flat colour overlay switching on the whole sprite.
  if (rainbowPipelineReady && player.setPipeline) {
    try {
      player.setPipeline("RainbowStar");
    } catch (e) {
      rainbowPipelineReady = false;
    }
  }

  // Fallback if a browser/device falls back to Canvas rendering.
  if (!rainbowPipelineReady) {
    const colours = [0xff245d, 0xff8a00, 0xfff200, 0x00ff66, 0x00d9ff, 0x8a4dff];
    rageFlashEvent = scene.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => {
        if (!player || !player.active || !rageMode || player.invulnerable) return;
        const c = colours[Math.floor(scene.time.now / 70) % colours.length];
        player.setTint(c);
      }
    });
  }

  // Small power-up pulse without throwing off the floor alignment.
  ragePulseTween = scene.tweens.add({
    targets: player,
    scale: (player.baseScale || 0.50) * 1.065,
    duration: 220,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut"
  });
}

function startRageTrail(scene) {
  stopRageTrail();

  rageTrailEvent = scene.time.addEvent({
    delay: 55,
    loop: true,
    callback: () => {
      if (!player || !player.active || !rageMode) return;

      const dir = player.flipX ? 1 : -1;
      const trail = scene.add.sprite(player.x + dir * 18, player.y, player.texture.key)
        .setDepth((player.depth || 20) - 1)
        .setAlpha(0.34)
        .setScale(player.scaleX, player.scaleY)
        .setFlipX(player.flipX);

      if (player.frame && player.frame.name !== undefined) trail.setFrame(player.frame.name);
      if (rainbowPipelineReady && trail.setPipeline) {
        try { trail.setPipeline("RainbowStar"); } catch (e) {}
      } else {
        const wheel = Phaser.Display.Color.HSVColorWheel();
        trail.setTint(wheel[Math.floor(scene.time.now / 8) % 360].color);
      }

      scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: trail.scaleX * 0.92,
        scaleY: trail.scaleY * 0.92,
        x: trail.x + dir * 22,
        duration: 260,
        ease: "Sine.easeOut",
        onComplete: () => trail.destroy()
      });
    }
  });
}

function stopRageTrail() {
  if (rageTrailEvent) {
    rageTrailEvent.remove ? rageTrailEvent.remove(false) : rageTrailEvent.stop();
    rageTrailEvent = null;
  }
}

function stopRainbowFlash() {
  stopRageTrail();
  if (rageFlashEvent) {
    rageFlashEvent.remove ? rageFlashEvent.remove(false) : rageFlashEvent.stop();
    rageFlashEvent = null;
  }
  if (ragePulseTween) {
    ragePulseTween.stop();
    ragePulseTween = null;
  }
  if (player && player.active) {
    if (player.resetPipeline) player.resetPipeline();
    player.clearTint();
    player.setScale(player.baseScale || 0.50);
  }
}

function activateRage(scene) {
  rageMode = true;
  rageEndAt = scene.time.now + 7000;
  startRainbowFlash(scene);
  startRageTrail(scene);
  floatText(scene, player.x, player.y - 80, "RAINBOW RAGE!", "#ff66ff");
  showQuestToast(scene, "RAINBOW RAGE ACTIVATED");
  for (let i = 0; i < 6; i++) {
    burst(scene, player.x + Phaser.Math.Between(-80,80), player.y + Phaser.Math.Between(-80,40), 0xff66ff);
  }
  cam.flash(250, 255, 0, 255);
  premiumExplosion(scene, player.x, player.y - 30, 0xff66ff, 1.35);
  screenHit(scene, 0.012, 140, true);
  cam.zoomTo(1.1, 200);
  scene.time.delayedCall(7000, () => {
    rageMode = false;
    rage = 0;
    stopRainbowFlash();
    cam.zoomTo(1, 300);
    updateHUD();
  });
}

function gameOver(scene) {
  if (isGameOver) return;
  isGameOver = true;
  scene.physics.pause();
  saveHighScore();
  endPanel(scene, "GAME OVER", "#ff004c", "Press R to restart");
  submitScoreAndShowLeaderboard(scene);
}

function saveHighScore() {
  const dist = Math.floor(player.x / 10);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("rr_highscore", String(highScore));
  }
  if (dist > bestDistance) {
    bestDistance = dist;
    localStorage.setItem("rr_best_distance", String(bestDistance));
  }
}

function endPanel(scene, title, color, sub) {
  const container = scene.add.container(480, 270).setScrollFactor(0).setDepth(100);
  const bg = scene.add.rectangle(0, 0, 590, 285, 0x050008, 0.92);
  bg.setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(color).color, 0.9);
  const t = scene.add.text(0, -95, title, {
    fontFamily: "Arial Black", fontSize: "42px", color: "#ffffff",
    stroke: color, strokeThickness: 5
  }).setOrigin(0.5);
  const s = scene.add.text(0, -5, "Score: " + score + "\nDistance: " + Math.floor(player.x / 10) + "m\nBest Distance: " + bestDistance + "m\nHigh Score: " + highScore, {
    fontFamily: "Arial Black", fontSize: "21px", color: "#ffffff",
    align: "center", stroke: "#000000", strokeThickness: 5
  }).setOrigin(0.5);
  const r = scene.add.text(0, 105, sub, hudStyle(22, "#ffe600")).setOrigin(0.5);
  container.add([bg, t, s, r]);
}

function burst(scene, x, y, color) {
  // Lightweight coin bursts remain snappy; destruction gets the premium explosion.
  if (color === 0xffff00) {
    coinPop(scene, x, y);
    return;
  }

  premiumExplosion(scene, x, y, color, rageMode ? 1.28 : 1.0);
}


function floatText(scene, x, y, msg, color) {
  const t = scene.add.text(x, y, msg, {
    fontFamily: "Arial Black", fontSize: "24px", color: color,
    stroke: "#000000", strokeThickness: 5
  }).setOrigin(0.5).setDepth(25);
  scene.tweens.add({
    targets: t,
    y: y - 48,
    alpha: 0,
    duration: 700,
    onComplete: () => t.destroy()
  });
}

function createMobileButtons() {
  const makeBtn = (x, y, label, size=26) => {
    const c = this.add.circle(x, y, 37, 0xffffff, 0.18).setScrollFactor(0).setInteractive().setDepth(50);
    c.setStrokeStyle(3, 0xffffff, 0.35);
    const t = this.add.text(x, y, label, {
      fontFamily: "Arial Black", fontSize: size + "px", color: "#ffffff",
      stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    return c;
  };

  const left = makeBtn(68, 455, "◀");
  const right = makeBtn(153, 455, "▶");
  const jump = makeBtn(785, 455, "▲");
  const smash = makeBtn(880, 455, "✊", 28);

  left.on("pointerdown", () => leftDown = true);
  left.on("pointerup", () => leftDown = false);
  left.on("pointerout", () => leftDown = false);

  right.on("pointerdown", () => rightDown = true);
  right.on("pointerup", () => rightDown = false);
  right.on("pointerout", () => rightDown = false);

  jump.on("pointerdown", () => jumpDown = true);
  jump.on("pointerup", () => jumpDown = false);
  jump.on("pointerout", () => jumpDown = false);

  smash.on("pointerdown", () => smashDown = true);
  smash.on("pointerup", () => smashDown = false);
  smash.on("pointerout", () => smashDown = false);
}


async function submitScoreAndShowLeaderboard(scene) {
  const finalScore = score;
  const finalDistance = Math.floor(player.x / 10);
  const finalCharacter = characterStats[selectedCharacter].name;

  let playerName = localStorage.getItem("rr_player_name") || "";

  setTimeout(async () => {
    const entered = window.prompt("Enter name for global leaderboard:", playerName || "ANON");
    playerName = (entered || "ANON").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 16) || "ANON";
    localStorage.setItem("rr_player_name", playerName);

    showLeaderboardStatus(scene, "Submitting score...");

    try {
      await fetch("/api/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: playerName,
          score: finalScore,
          distance: finalDistance,
          character: finalCharacter
        })
      });

      const res = await fetch("/api/leaderboard");
      const data = await res.json();

      if (!res.ok || !data.scores) {
        throw new Error(data.error || "Leaderboard unavailable");
      }

      showLeaderboard(scene, data.scores);
    } catch (err) {
      showLeaderboardStatus(scene, "Leaderboard offline locally.\nDeploy to Vercel + add Supabase env vars.");
    }
  }, 300);
}

function showLeaderboardStatus(scene, message) {
  scene.add.rectangle(480, 438, 620, 105, 0x050008, 0.88)
    .setScrollFactor(0)
    .setDepth(150)
    .setStrokeStyle(3, 0x00ffff, 0.75);

  scene.add.text(480, 438, message, {
    fontFamily: "Arial Black",
    fontSize: "19px",
    color: "#ffffff",
    align: "center",
    stroke: "#000000",
    strokeThickness: 5
  }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
}

function showLeaderboard(scene, rows) {
  scene.add.rectangle(480, 410, 720, 210, 0x050008, 0.94)
    .setScrollFactor(0)
    .setDepth(160)
    .setStrokeStyle(4, 0xff00ff, 0.85);

  scene.add.text(480, 318, "GLOBAL TOP 10", {
    fontFamily: "Arial Black",
    fontSize: "28px",
    color: "#ffffff",
    stroke: "#ff00ff",
    strokeThickness: 6
  }).setOrigin(0.5).setScrollFactor(0).setDepth(161);

  const lines = rows.map((r, i) => {
    const name = String(r.player_name || "ANON").padEnd(12, " ").slice(0, 12);
    const charName = String(r.character || "").slice(0, 7);
    return `${String(i + 1).padStart(2, " ")}. ${name}  ${String(r.score).padStart(6, " ")}  ${String(r.distance).padStart(4, " ")}m  ${charName}`;
  });

  scene.add.text(480, 425, lines.join("\n") || "No scores yet", {
    fontFamily: "monospace",
    fontSize: "18px",
    color: "#ffffff",
    align: "left",
    stroke: "#000000",
    strokeThickness: 3
  }).setOrigin(0.5).setScrollFactor(0).setDepth(161);
}
