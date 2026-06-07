let micButton;
let t = 0;

let mic;
let micStarted = false;
let rawMicLevel = 0;
let smoothedSound = 0;
let soundEnergy = 0;

let stormOpacity = 0;
let targetStormOpacity = 0;
let stormLeaving = false;

let layerRevealProgress = 0;
let targetLayerRevealProgress = 0;

let currentIntensity = 0.08;
let targetIntensity = 0.08;
let oceanTravel = 0;
let voicePulse = 0;
let voicePeak = 0;
let waveformHeight = 0;

let stormBrushes = [];
let stormWaveLayers = [];
let foamBrushes = [];
let stormClouds = [];
let rainDrops = [];
let thunderBolts = [];
let stormSkyProgress = 0;
let targetStormSkyProgress = 0;

let audioSeaTop = 0;
let audioSeaBottom = 0;
let audioDebugVisible = false;
let oceanPalette = {
  deep: [8, 34, 66],
  mid: [22, 78, 118],
  highlight: [205, 220, 205],
  foam: [235, 232, 210]
};

function setupAudioMechanic() {
  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(toggleMic);

  createStormOceanSystem();
}

function drawAudioMechanic() {
  updateAudioOceanBounds();
  updateSoundLevel();
  updateOceanTransition();
  updateOceanPaletteFromTime();

  drawAudioStormSky();
  drawStormOceanLayer();

  if (audioDebugVisible) {
    drawMicDebug();
  }

  oceanTravel += getWaveSpeedEnergy() * width * 0.0018;
  t += 0.01;
}

function updateAudioOceanBounds() {
  // Match the time mechanic horizon when it exists, otherwise use the shared group horizon.
  let horizon = height * 0.5;

  if (typeof latestTimeSceneState !== "undefined" && latestTimeSceneState && latestTimeSceneState.horizonY) {
    horizon = latestTimeSceneState.horizonY;
  }

  audioSeaTop = horizon;
  audioSeaBottom = height;
}

function updateOceanPaletteFromTime() {
  // Keep our ocean visually connected to the time mechanic instead of using one fixed blue palette.
  let dayAmount = 0.5;
  let nightAmount = 0.2;
  let twilightAmount = 0.2;

  if (typeof latestTimeSceneState !== "undefined" && latestTimeSceneState) {
    dayAmount = latestTimeSceneState.dayAmount || 0;
    nightAmount = latestTimeSceneState.nightAmount || 0;
    twilightAmount = latestTimeSceneState.twilightAmount || 0;
  }

  let stormMood = getWaveHeightEnergy();
  let brightness = dayAmount * 32 + twilightAmount * 16 - nightAmount * 18;
  let stormDarken = map(stormMood, 0.18, 1.15, 0, 24);

  oceanPalette.deep = [
    constrain(8 + brightness * 0.18 - stormDarken * 0.3, 3, 35),
    constrain(28 + brightness * 0.45 - stormDarken * 0.2, 16, 72),
    constrain(58 + brightness * 0.75 - stormDarken * 0.1, 35, 118)
  ];

  oceanPalette.mid = [
    constrain(18 + brightness * 0.32, 8, 72),
    constrain(64 + brightness * 0.9, 36, 135),
    constrain(105 + brightness * 1.1, 72, 185)
  ];

  // Keep highlights cool and watery. Do not push the wave colours into yellow.
  oceanPalette.highlight = [
    constrain(92 + dayAmount * 32 + twilightAmount * 16, 75, 165),
    constrain(145 + dayAmount * 38 + twilightAmount * 20, 115, 210),
    constrain(165 + dayAmount * 35 - nightAmount * 18, 130, 230)
  ];

  oceanPalette.foam = [
    constrain(198 + dayAmount * 22, 180, 235),
    constrain(220 + dayAmount * 18, 195, 245),
    constrain(225 + twilightAmount * 12, 200, 250)
  ];
}

function audioOceanY(depthRatio) {
  return lerp(audioSeaTop - height * 0.025, audioSeaBottom + height * 0.025, depthRatio);
}

function toggleMic() {
  if (!micStarted) {
    userStartAudio();
    getAudioContext().resume();

    mic.start(function() {
      micStarted = true;
      micButton.html("MIC OFF");
      stormLeaving = false;
      targetStormOpacity = 1;
      targetLayerRevealProgress = 1;
      targetStormSkyProgress = 1;

      // The storm layer fades in across the whole ocean instead of sweeping in from the side.
      for (let i = 0; i < stormWaveLayers.length; i++) {
        stormWaveLayers[i].tail = -width * 0.15;
        stormWaveLayers[i].front = width * 1.15;
      }
    });
  } else {
    mic.stop();
    micStarted = false;
    rawMicLevel = 0;
    smoothedSound = 0;
    soundEnergy = 0;
    targetIntensity = 0.08;
    stormLeaving = true;
    targetStormOpacity = 0;
    targetLayerRevealProgress = 0;
    targetStormSkyProgress = 0;
    micButton.html("START MIC");
  }
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  // Remove quiet background noise first, otherwise the ocean can get stuck at maximum height.
  let noiseFloor = 0.006;
  let cleanedMicLevel = max(0, rawMicLevel - noiseFloor);

  // Boost the cleaned microphone signal so claps / voice clearly affect the ocean.
  let boostedSound = constrain(pow(cleanedMicLevel * 22, 0.7), 0, 1);

  // Recording-app style pulse: reacts to tiny voice peaks immediately, then falls quickly.
  let instantVoice = constrain(pow(cleanedMicLevel * 34, 0.55), 0, 1);
  if (instantVoice > voicePeak) {
    voicePeak = instantVoice;
  } else {
    voicePeak = lerp(voicePeak, instantVoice, 0.26);
  }
  voicePulse = lerp(voicePulse, voicePeak, instantVoice > voicePulse ? 0.68 : 0.22);

  // Recording-app style wave height: the main wave height rises and falls sharply with voice volume.
  let instantHeight = constrain(map(instantVoice, 0.02, 0.85, 0, 1), 0, 1);
  waveformHeight = lerp(waveformHeight, instantHeight, instantHeight > waveformHeight ? 0.78 : 0.2);

  // Fast attack, faster release: waves jump up quickly, then naturally fall back down.
  if (boostedSound > soundEnergy) {
    soundEnergy = lerp(soundEnergy, boostedSound, 0.72);
  } else {
    soundEnergy = lerp(soundEnergy, boostedSound, 0.18);
  }

  let smoothRate = boostedSound > smoothedSound ? 0.42 : 0.16;
  smoothedSound = lerp(smoothedSound, soundEnergy, smoothRate);

  if (micStarted) {
    // Sensitive to volume changes, but still capped at the same maximum wave height.
    let averageVoice = map(smoothedSound, 0.002, 0.09, 0.08, 1);
    let instantPush = map(voicePulse, 0, 1, 0, 0.42);
    targetIntensity = constrain(averageVoice + instantPush, 0.08, 1);
  } else {
    targetIntensity = 0.08;
    voicePulse = lerp(voicePulse, 0, 0.28);
    voicePeak = lerp(voicePeak, 0, 0.35);
    waveformHeight = lerp(waveformHeight, 0, 0.35);
  }

  let intensityRate = targetIntensity > currentIntensity ? 0.34 : 0.12;
  currentIntensity = lerp(currentIntensity, targetIntensity, intensityRate);
}

function getWaveHeightEnergy() {
  // Recording-app style vertical response: height follows voice peaks clearly.
  // It rises and falls quickly, while keeping the same maximum cap.
  let slowBody = pow(constrain(currentIntensity, 0, 1), 0.9);
  let fastHeight = pow(constrain(waveformHeight, 0, 1), 0.62);
  let combined = constrain(slowBody * 0.35 + fastHeight * 0.65, 0, 1);

  return map(combined, 0, 1, 0.055, 0.58);
}


function smoothstep(edge0, edge1, x) {
  let amt = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return amt * amt * (3 - 2 * amt);
}

// Worley noise helpers for painterly water texture
function hash2D(ix, iy) {
  // Small deterministic hash for Worley feature points.
  let n = sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
  return n - floor(n);
}

function worleyNoise(x, y, scale) {
  // Cellular/Worley noise gives the water a broken, painterly surface texture.
  let sx = x * scale;
  let sy = y * scale;
  let cellX = floor(sx);
  let cellY = floor(sy);
  let closest = 9999;

  for (let ox = -1; ox <= 1; ox++) {
    for (let oy = -1; oy <= 1; oy++) {
      let gx = cellX + ox;
      let gy = cellY + oy;
      let px = gx + hash2D(gx, gy);
      let py = gy + hash2D(gx + 19.19, gy + 73.73);
      let d = dist(sx, sy, px, py);
      closest = min(closest, d);
    }
  }

  return constrain(closest, 0, 1);
}

function waterCellTexture(x, y, strength) {
  // Mix Worley with regular noise so the result feels organic rather than overly digital.
  let cell = worleyNoise(x + oceanTravel * 0.18, y + t * 18, 0.008);
  let soft = noise(x * 0.005, y * 0.014, t * 0.25);
  let mixed = lerp(soft, 1 - cell, 0.45);
  return map(mixed, 0, 1, -strength, strength);
}

function getWaveSpeedEnergy() {
  // Keep the audio ocean flowing close to the calm Perlin ocean speed.
  // Sound changes the wave height more than the horizontal travel speed.
  let e = constrain(currentIntensity + voicePulse * 0.22, 0, 1);

  if (e < 0.3) {
    return map(e, 0, 0.3, 0.18, 0.32);
  } else if (e < 0.7) {
    return map(e, 0.3, 0.7, 0.32, 0.48);
  } else {
    return map(e, 0.7, 1, 0.48, 0.68);
  }
}

function updateOceanTransition() {
  // Smooth fade transition instead of left/right sweep.
  // Mic on: storm layer fades in as a calm sea, then reacts to sound.
  // Mic off: waves calm down and fade out.
  stormOpacity = lerp(stormOpacity, targetStormOpacity, micStarted ? 0.045 : 0.04);
  layerRevealProgress = lerp(layerRevealProgress, targetLayerRevealProgress, micStarted ? 0.035 : 0.045);
  stormSkyProgress = lerp(stormSkyProgress, targetStormSkyProgress, micStarted ? 0.032 : 0.038);

  if (stormOpacity < 0.01 && !micStarted) {
    stormOpacity = 0;
    layerRevealProgress = 0;
    stormSkyProgress = 0;
    stormLeaving = false;
    currentIntensity = 0.08;
  }
}

function getStormPresence() {
  return stormOpacity;
}

function getLayerRevealAmount(index) {
  let layerCount = max(stormWaveLayers.length - 1, 1);
  let depth = index / layerCount;

  // Mic on: deeper/bottom layers appear first, then move upward.
  // Mic off: top layers disappear first, then the deeper layers fade away.
  let order = micStarted ? 1 - depth : depth;
  let revealWindow = 0.42;
  let reveal = smoothstep(order * revealWindow, order * revealWindow + revealWindow, layerRevealProgress);

  if (!micStarted && stormLeaving) {
    reveal = smoothstep(order * revealWindow, order * revealWindow + revealWindow, layerRevealProgress);
  }

  return constrain(reveal, 0, 1);
}

function getBrushRevealAmount(yRatio) {
  // Same logic as the wave layers, but based on brush depth.
  let order = micStarted ? 1 - yRatio : yRatio;
  let revealWindow = 0.42;
  return constrain(smoothstep(order * revealWindow, order * revealWindow + revealWindow, layerRevealProgress), 0, 1);
}

function drawMicDebug() {
  noStroke();
  fill(255, 180);
  textSize(14);

  if (!micStarted && !stormLeaving) {
    text("audio storm ocean: click START MIC", 30, 75);
  } else if (!micStarted && stormLeaving) {
    text("audio storm ocean: calming and fading out", 30, 75);
  } else {
    text("mic level: " + nf(rawMicLevel, 1, 4), 30, 75);
    text("storm wave energy: " + nf(currentIntensity, 1, 2), 30, 95);
  }
}


function createStormOceanSystem() {
  stormBrushes = [];
  stormWaveLayers = [];
  foamBrushes = [];
  stormClouds = [];
  rainDrops = [];
  thunderBolts = [];

  let shorter = min(width, height);
  let layerCount = 12;

  updateAudioOceanBounds();

  for (let i = 0; i < layerCount; i++) {
    let depth = i / (layerCount - 1);

    stormWaveLayers.push({
      // Share the same horizon as the time and perlin mechanics so this reads as one ocean.
      baseYRatio: map(depth, 0, 1, 0.02, 0.96),
      baseY: audioOceanY(map(depth, 0, 1, 0.02, 0.96)),
      baseAmpRatio: map(depth, 0, 1, 0.006, 0.019) * random(0.85, 1.14),
      soundAmpRatio: map(depth, 0, 1, 0.042, 0.105) * random(0.85, 1.35),
      baseAmp: map(depth, 0, 1, height * 0.03, height * 0.075) * random(0.85, 1.25),
      soundAmp: map(depth, 0, 1, height * 0.07, height * 0.18) * random(0.75, 1.35),
      wavelength: random(width * 0.46, width * 0.86),
      speed: random(0.28, 0.62),
      phase: random(TWO_PI),
      noiseScale: random(0.0018, 0.0045),
      noiseStrength: random(0.28, 0.75),
      colourType: random(),
      xDrift: random(width),
      front: width * 1.15,
      tail: -width * 0.15,
      enterSpeed: random(0.012, 0.026),
      leaveSpeed: random(0.016, 0.034),
      activeWidth: random(width * 0.7, width * 1.25),
      flowOffset: random(width),
      foamOffset: random(width)
    });
  }
  for (let i = 0; i < 760; i++) {
    stormBrushes.push({
      x: random(width * 1.35),
      yRatio: random(0.12, 1),
      y: audioOceanY(random(0.12, 1)),
      w: random(shorter * 0.008, shorter * 0.045),
      h: random(2, 6),
      speed: random(0.22, 0.9),
      noiseOffset: random(1000),
      colourPick: random(),
      layer: random(0.5, 1.35)
    });
  }

  for (let i = 0; i < 220; i++) {
    foamBrushes.push({
      layerIndex: floor(random(layerCount)),
      xRatio: random(0, 1.35),
      size: random(2, 7),
      offset: random(1000),
      alpha: random(40, 135)
    });
  }

  createAudioStormSkySystem();
}

function createAudioStormSkySystem() {
  stormClouds = [];
  rainDrops = [];
  thunderBolts = [];

  let cloudCount = 70;
  for (let i = 0; i < cloudCount; i++) {
    stormClouds.push({
      x: random(-width * 0.55, width * 1.2),
      y: random(height * 0.015, height * 0.29),
      w: random(width * 0.16, width * 0.42),
      h: random(height * 0.045, height * 0.12),
      speed: random(0.12, 0.36),
      alpha: random(95, 175),
      seed: random(1000),
      puffCount: floor(random(6, 11)),
      puffs: []
    });

    let cloud = stormClouds[stormClouds.length - 1];
    for (let p = 0; p < cloud.puffCount; p++) {
      let pAmt = p / max(cloud.puffCount - 1, 1);
      cloud.puffs.push({
        xOffset: map(pAmt, 0, 1, -cloud.w * 0.45, cloud.w * 0.45) + random(-cloud.w * 0.06, cloud.w * 0.06),
        yOffset: random(-cloud.h * 0.22, cloud.h * 0.22),
        wScale: random(0.3, 0.5),
        hScale: random(0.78, 1.42)
      });
    }
  }

  let rainCount = 320;
  for (let i = 0; i < rainCount; i++) {
    rainDrops.push({
      x: random(width),
      y: random(audioSeaTop * 0.08, audioSeaTop * 0.55),
      len: random(height * 0.018, height * 0.045),
      speed: random(height * 0.005, height * 0.013),
      drift: random(width * 0.00025, width * 0.00075),
      alpha: random(35, 95)
    });
  }
}

function drawAudioStormSky() {
  if (stormSkyProgress <= 0.01 && !micStarted && !stormLeaving) return;

  push();
  drawingContext.save();
  drawingContext.globalAlpha = stormSkyProgress;

  drawStormSkyShade();
  drawStormCloudField();
  updateAndDrawThunderBolts();
  drawAudioRain();

  drawingContext.restore();
  pop();
}

function drawStormSkyShade() {
  noStroke();

  let shadeHeight = height * 0.34;
  let shadeAlpha = 95 * stormSkyProgress;

  for (let i = 0; i < 8; i++) {
    let amt = i / 7;
    fill(8, 12, 24, shadeAlpha * map(amt, 0, 1, 1, 0.15));
    rect(0, shadeHeight * amt, width, shadeHeight / 6);
  }
}

function drawStormCloudField() {
  noStroke();

  // Mic on: clouds enter from left. Mic off: clouds leave to right.
  let cloudShift = micStarted
    ? lerp(-width * 0.62, 0, stormSkyProgress)
    : lerp(width * 1.22, 0, stormSkyProgress);

  let intensity = getWaveHeightEnergy();

  for (let i = 0; i < stormClouds.length; i++) {
    let c = stormClouds[i];
    let x = c.x + cloudShift + t * width * 0.0025 * c.speed;
    let y = c.y + sin(t * 0.2 + c.seed) * height * 0.0012;

    if (x > width * 1.35) x -= width * 1.85;

    let cloudAlpha = c.alpha * map(intensity, 0.055, 0.58, 0.95, 1.35);
    fill(18, 24, 38, cloudAlpha);

    for (let p = 0; p < c.puffs.length; p++) {
      let puff = c.puffs[p];
      let px = x + puff.xOffset + sin(t * 0.12 + c.seed + p) * c.w * 0.003;
      let py = y + puff.yOffset + sin(t * 0.1 + c.seed + p) * c.h * 0.012;
      let pw = c.w * puff.wScale;
      let ph = c.h * puff.hScale;
      ellipse(px, py, pw, ph);
    }

    fill(45, 58, 78, cloudAlpha * 0.42);
    ellipse(x + c.w * 0.06, y - c.h * 0.08, c.w * 0.74, c.h * 0.9);
  }
}

function maybeSpawnThunder() {
  if (!micStarted) return;

  // Thunder is occasional and dramatic, not constant.
  let soundPush = constrain(voicePulse + waveformHeight, 0, 1.6);
  let triggerChance = map(soundPush, 0, 1.6, 0.0006, 0.018);
  if (random() > triggerChance) return;

  let startX = random(width * 0.08, width * 0.92);
  let startY = random(height * 0.04, height * 0.16);
  let segments = [];
  let x = startX;
  let y = startY;

  for (let i = 0; i < 8; i++) {
    x += random(-width * 0.03, width * 0.04);
    y += random(height * 0.025, height * 0.055);
    segments.push({ x: x, y: y });
  }

  thunderBolts.push({
    startX: startX,
    startY: startY,
    segments: segments,
    life: 1,
    alpha: random(170, 255),
    flash: random(35, 75),
    glowSize: random(width * 0.18, width * 0.34),
    glowOffsetX: random(-width * 0.06, width * 0.06),
    glowOffsetY: random(-height * 0.025, height * 0.045)
  });
}


function drawSoftThunderGlow(b) {
  noStroke();

  let glowAlpha = b.flash * b.life * stormSkyProgress;
  let glowX = b.startX + b.glowOffsetX;
  let glowY = b.startY + b.glowOffsetY + height * 0.05;

  // Layered ellipses create a cloud-like light bloom instead of a hard rectangular flash.
  for (let i = 0; i < 5; i++) {
    let amt = i / 4;
    fill(205, 225, 255, glowAlpha * map(amt, 0, 1, 0.26, 0.035));
    ellipse(
      glowX + sin(b.startX * 0.01 + i) * width * 0.025,
      glowY + cos(b.startY * 0.01 + i) * height * 0.012,
      b.glowSize * map(amt, 0, 1, 0.7, 2.2),
      b.glowSize * map(amt, 0, 1, 0.28, 0.85)
    );
  }

  // A small local sky flash near the bolt gives impact without showing block edges.
  fill(230, 240, 255, glowAlpha * 0.16);
  ellipse(glowX, glowY, b.glowSize * 0.7, b.glowSize * 0.32);
}

function drawThunderWaterReflection(b) {
  if (stormOpacity <= 0.01) return;

  noStroke();

  let reflectionAlpha = b.flash * b.life * stormSkyProgress * stormOpacity;
  let reflectionX = b.startX + b.glowOffsetX * 0.45;
  let oceanHeight = max(audioSeaBottom - audioSeaTop, 1);

  // Lightning reflection is broken by moving water, so it appears as scattered horizontal shimmer.
  let shimmerCount = 26;
  for (let i = 0; i < shimmerCount; i++) {
    let amt = i / max(shimmerCount - 1, 1);
    let y = audioSeaTop + oceanHeight * map(amt, 0, 1, 0.04, 0.62);
    let waveSpread = map(amt, 0, 1, width * 0.035, width * 0.2);
    let waveNoise = noise(i * 0.22, t * 0.9, b.startX * 0.002);
    let x = reflectionX + sin(t * 4.8 + i * 0.65) * waveSpread * 0.28 + map(waveNoise, 0, 1, -waveSpread, waveSpread);
    let w = random(width * 0.018, width * 0.12) * map(amt, 0, 1, 1.05, 0.35);
    let h = random(1.5, 4.5);
    let localAlpha = reflectionAlpha * map(amt, 0, 1, 0.42, 0.03);

    fill(190, 220, 255, localAlpha);
    ellipse(x, y, w, h);
  }

  // A faint vertical core suggests the lightning line reflected through the wave gaps.
  for (let i = 0; i < 8; i++) {
    let y = audioSeaTop + oceanHeight * random(0.05, 0.38);
    let x = reflectionX + random(-width * 0.035, width * 0.035);
    let w = random(width * 0.006, width * 0.025);
    let h = random(2, 5);

    fill(225, 238, 255, reflectionAlpha * random(0.05, 0.14));
    ellipse(x, y, w, h);
  }
}

function updateAndDrawThunderBolts() {
  maybeSpawnThunder();

  for (let i = thunderBolts.length - 1; i >= 0; i--) {
    let b = thunderBolts[i];
    let boltAlpha = b.alpha * b.life * stormSkyProgress;

    drawSoftThunderGlow(b);
    drawThunderWaterReflection(b);

    strokeWeight(random(1.4, 2.8));
    stroke(225, 238, 255, boltAlpha);
    noFill();

    beginShape();
    vertex(b.startX, b.startY);
    for (let j = 0; j < b.segments.length; j++) {
      vertex(b.segments[j].x, b.segments[j].y);
    }
    endShape();

    strokeWeight(random(4, 7));
    stroke(120, 165, 255, boltAlpha * 0.16);
    beginShape();
    vertex(b.startX, b.startY);
    for (let j = 0; j < b.segments.length; j++) {
      vertex(b.segments[j].x, b.segments[j].y);
    }
    endShape();

    b.life -= 0.18;
    if (b.life <= 0) thunderBolts.splice(i, 1);
  }
}

function drawAudioRain() {
  if (stormSkyProgress <= 0.01) return;

  strokeWeight(1);

  // Rain is mostly vertical, with around 10 degrees of diagonal slant.
  let rainStrength = map(getWaveHeightEnergy() + voicePulse * 0.2, 0.055, 0.78, 0.42, 0.92);
  let rainTop = audioSeaTop * 0.12;
  let rainBottom = height;
  let slant = tan(radians(10));

  for (let i = 0; i < rainDrops.length; i++) {
    let r = rainDrops[i];
    let alphaValue = r.alpha * stormSkyProgress * rainStrength;

    stroke(175, 205, 230, alphaValue);

    let dx = r.len * slant;
    line(r.x, r.y, r.x + dx, r.y + r.len);

    r.x += r.drift * rainStrength;
    r.y += r.speed * rainStrength;

    if (r.y > rainBottom + r.len) {
      r.y = random(rainTop, audioSeaTop * 0.55);
      r.x = random(width * -0.05, width * 1.05);
    }

    if (r.x > width * 1.12) {
      r.x = -width * 0.08;
    }
  }
}


function drawStormOceanLayer() {
  if (stormOpacity <= 0.01 && !micStarted && !stormLeaving) return;

  push();
  drawingContext.save();
  drawingContext.globalAlpha = stormOpacity;
  drawingContext.beginPath();

  // Keep the layer visible across the canvas so wave crests are not cut off.
  drawingContext.rect(0, 0, width, height + height * 0.12);
  drawingContext.clip();

  drawAudioOceanAtmosphere();

  drawStormBrushFieldFromLayers();

  for (let i = 0; i < stormWaveLayers.length; i++) {
    updateSingleStormWaveMotion(stormWaveLayers[i], i);
    drawSingleStormWave(stormWaveLayers[i], i);
  }

  drawLighthouseShoreBreak();
  drawFoamBrushes();

  drawingContext.restore();
  pop();
}

function drawAudioOceanAtmosphere() {
  // When the mic is active, this becomes the full ocean surface rather than a transparent overlay.
  noStroke();

  let oceanHeight = max(audioSeaBottom - audioSeaTop, 1);
  let waveMood = getWaveHeightEnergy();

  for (let i = 0; i < 22; i++) {
    let amt = i / 21;
    let y = audioSeaTop + oceanHeight * amt;
    let bandH = oceanHeight / 18 + 2;
    let bandReveal = getBrushRevealAmount(amt);
    if (bandReveal <= 0.01) continue;

    fill(
      lerp(oceanPalette.mid[0], oceanPalette.deep[0], amt),
      lerp(oceanPalette.mid[1], oceanPalette.deep[1], amt),
      lerp(oceanPalette.mid[2], oceanPalette.deep[2], amt),
      max(215, 255 * bandReveal)
    );

    rect(0, y, width, bandH);
  }

  // Monet-like short dabs so the active ocean visually belongs with the Perlin calm sea.
  for (let i = 0; i < 190; i++) {
    let yRatio = random(0.03, 1);
    let y = audioOceanY(yRatio);
    let strokeReveal = getBrushRevealAmount(yRatio);
    if (strokeReveal <= 0.01) continue;

    let drift = t * width * 0.008 * random(0.35, 0.95);
    let x = (random(width) + drift) % width;
    let strokeW = random(width * 0.012, width * 0.075) * map(yRatio, 0, 1, 0.75, 1.25);
    let strokeH = random(2, 5.5);
    let depthAlpha = map(yRatio, 0, 1, 95, 145);
    let shimmer = noise(x * 0.006, y * 0.012, t * 0.35);
    let cellTexture = waterCellTexture(x, y, 18);

    fill(
      lerp(oceanPalette.highlight[0], oceanPalette.mid[0], yRatio) + shimmer * 6 + cellTexture * 0.35,
      lerp(oceanPalette.highlight[1], oceanPalette.mid[1], yRatio) + shimmer * 8 + cellTexture * 0.55,
      lerp(oceanPalette.highlight[2], oceanPalette.mid[2], yRatio) + shimmer * 10 + cellTexture * 0.75,
      depthAlpha * map(waveMood, 0.09, 0.58, 1.0, 1.35) * max(0.72, strokeReveal)
    );

    ellipse(x, y + sin(t * 1.1 + x * 0.01) * 2, strokeW, strokeH);
  }

}


function refreshStormLayerGeometry() {
  for (let i = 0; i < stormWaveLayers.length; i++) {
    let layer = stormWaveLayers[i];
    layer.baseY = audioOceanY(layer.baseYRatio);
    layer.baseAmp = height * layer.baseAmpRatio;
    layer.soundAmp = height * layer.soundAmpRatio;
  }

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    b.y = audioOceanY(b.yRatio);
  }
}

function updateSingleStormWaveMotion(layer, index) {
  // One-way motion only. Everything uses positive left-to-right travel.
  let flowSpeed = layer.speed * getWaveSpeedEnergy();
  layer.flowOffset += flowSpeed * width * 0.018;
  layer.foamOffset += flowSpeed * 2.2;

  // Prevent giant offset values from causing precision wobble during long previews.
  if (layer.flowOffset > width * 4) layer.flowOffset -= width * 4;
  if (layer.foamOffset > width * 4) layer.foamOffset -= width * 4;

  // Keep each wave layer covering the full scene. Transition is now handled by opacity.
  layer.tail = -width * 0.15;
  layer.front = width * 1.15;
}

// function drawStormBaseFromLayers() {
//   let furthestFront = 0;
//   let earliestTail = width;
//
//   for (let i = 0; i < stormWaveLayers.length; i++) {
//     furthestFront = max(furthestFront, stormWaveLayers[i].front);
//     earliestTail = min(earliestTail, stormWaveLayers[i].tail);
//   }
//
//   if (furthestFront <= 0) return;
//
//   noStroke();
//   fill(5, 18, 36, 185);
//   rect(max(0, earliestTail), height * 0.34, min(width, furthestFront) - max(0, earliestTail), height * 0.66);
// }

function drawStormBrushFieldFromLayers() {
  rectMode(CENTER);
  noStroke();

  let speedMultiplier = getWaveSpeedEnergy() * 1.6;
  let verticalMovement = map(getWaveHeightEnergy(), 0, 0.58, 1.5, height * 0.012) + voicePulse * height * 0.012 + waveformHeight * height * 0.018;

  refreshStormLayerGeometry();

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    let layer = stormWaveLayers[i % stormWaveLayers.length];
    let brushReveal = getBrushRevealAmount(b.yRatio);
    if (brushReveal <= 0.01) continue;

    if (b.x < layer.tail + width * 0.03 || b.x > layer.front - width * 0.03) continue;

    let depth = map(b.y, audioSeaTop, audioSeaBottom, 0, 1);
    let waveformJitter = sin(t * 26 + b.noiseOffset) * voicePulse * 0.9;
    let smoothWave = sin((b.x - oceanTravel * 0.8) * 0.012 + b.noiseOffset + waveformJitter);

    let waveHeightEnergy = getWaveHeightEnergy();
    let amp = layer.baseAmp + layer.soundAmp * waveHeightEnergy;
    let waveY = getStormWaveY(layer, b.x, amp, layer.wavelength, layer.speed, layer.flowOffset);

    // Keep brush strokes attached to the body of the wave.
    let yPush = smoothWave * verticalMovement * b.layer;
    let brushY = waveY + map(depth, 0, 1, 4, 78) + yPush + sin(t * 34 + b.noiseOffset) * voicePulse * height * 0.006 + sin(t * 42 + b.noiseOffset * 0.7) * waveformHeight * height * 0.008;

    // Keep the texture close to the surface, like the calm Perlin ocean marks.
    if (brushY < waveY + 2) continue;

    b.x += b.speed * speedMultiplier;

    if (b.x > width * 1.35 + b.w) {
      b.x = -b.w;
      b.yRatio = random(0.12, 1);
      b.y = audioOceanY(b.yRatio);
    }

    let c;
    if (b.colourPick < 0.45) {
      c = color(oceanPalette.deep[0], oceanPalette.deep[1], oceanPalette.deep[2], map(depth, 0, 1, 175, 235));
    } else if (b.colourPick < 0.82) {
      c = color(oceanPalette.mid[0], oceanPalette.mid[1], oceanPalette.mid[2], map(depth, 0, 1, 155, 220));
    } else {
      c = color(oceanPalette.highlight[0], oceanPalette.highlight[1], oceanPalette.highlight[2], map(currentIntensity, 0, 1, 95, 165));
    }

    // Louder waves become more visually present, but stay in a cool blue-green palette.
    let brightnessBoost = map(waveHeightEnergy, 0.09, 0.58, 0, 18);
    let cellTexture = waterCellTexture(b.x, brushY, 16);

    fill(
      constrain(red(c) + brightnessBoost * 0.45 + cellTexture * 0.25, 0, 255),
      constrain(green(c) + brightnessBoost * 0.8 + cellTexture * 0.45, 0, 255),
      constrain(blue(c) + brightnessBoost + cellTexture * 0.65, 0, 255),
      alpha(c) * max(0.72, brushReveal)
    );

    ellipse(b.x, brushY, b.w, b.h);
  }

  rectMode(CORNER);
}

function drawSingleStormWave(layer, index) {
  let leftEdge = layer.tail;
  let rightEdge = layer.front;

  if (rightEdge < 0 || leftEdge > width) return;

  let layerReveal = getLayerRevealAmount(index);
  if (layerReveal <= 0.01) return;

  let depth = index / max(stormWaveLayers.length - 1, 1);
  let waveHeightEnergy = getWaveHeightEnergy();
  let amp = layer.baseAmp + layer.soundAmp * waveHeightEnergy;
  let speed = layer.speed * getWaveSpeedEnergy();
  let wavelength = layer.wavelength;
  let localOffset = layer.xDrift + layer.flowOffset;

  let waveColour;
  if (layer.colourType < 0.38) {
    waveColour = color(oceanPalette.deep[0], oceanPalette.deep[1], oceanPalette.deep[2], map(depth, 0, 1, 180, 245));
  } else if (layer.colourType < 0.78) {
    waveColour = color(oceanPalette.mid[0], oceanPalette.mid[1], oceanPalette.mid[2], map(depth, 0, 1, 165, 235));
  } else {
    waveColour = color(oceanPalette.highlight[0] * 0.55, oceanPalette.highlight[1] * 0.58, oceanPalette.highlight[2] * 0.56, map(depth, 0, 1, 145, 215));
  }

  let bodyCellTexture = waterCellTexture(width * depth + layer.flowOffset, layer.baseY, 10);
  waveColour = color(
    constrain(red(waveColour) + bodyCellTexture * 0.12, 0, 255),
    constrain(green(waveColour) + bodyCellTexture * 0.24, 0, 255),
    constrain(blue(waveColour) + bodyCellTexture * 0.34, 0, 255),
    alpha(waveColour)
  );

  noStroke();
  fill(red(waveColour), green(waveColour), blue(waveColour), min(255, alpha(waveColour) * max(0.95, layerReveal)));

  beginShape();
  vertex(leftEdge - 40, audioSeaBottom + height * 0.08);

  for (let x = leftEdge - 40; x <= rightEdge + 60; x += 18) {
    let y = getStormWaveY(layer, x, amp, wavelength, speed, localOffset);
    vertex(x, y);
  }

  vertex(rightEdge + 60, audioSeaBottom + height * 0.08);
  endShape(CLOSE);

  drawPainterlyWaveTexture(layer, index, amp, wavelength, speed, leftEdge, rightEdge, localOffset, layerReveal);
  drawStormCrestFoam(layer, amp, wavelength, speed, leftEdge, rightEdge, localOffset);
}

function drawPainterlyWaveTexture(layer, index, amp, wavelength, speed, leftEdge, rightEdge, localOffset, layerReveal) {
  let depth = index / max(stormWaveLayers.length - 1, 1);
  let markCount = int(map(depth, 0, 1, 8, 18) + voicePulse * 18 + waveformHeight * 24);

  noStroke();

  for (let i = 0; i < markCount; i++) {
    let x = random(leftEdge, rightEdge);
    if (x < -width * 0.08 || x > width * 1.08) continue;

    let crestY = getStormWaveY(layer, x, amp, wavelength, speed, localOffset);
    let y = crestY + random(8, 48 + depth * 34);
    let markW = random(width * 0.012, width * 0.055) * map(depth, 0, 1, 0.75, 1.25);
    let markH = random(2, 5.5);
    let colourNoise = noise(x * 0.008, y * 0.012, t * 0.28);
    let cellTexture = waterCellTexture(x, y, 22);

    fill(
      lerp(oceanPalette.highlight[0], oceanPalette.mid[0], depth) + colourNoise * 5 + cellTexture * 0.28,
      lerp(oceanPalette.highlight[1], oceanPalette.mid[1], depth) + colourNoise * 7 + cellTexture * 0.48,
      lerp(oceanPalette.highlight[2], oceanPalette.mid[2], depth) + colourNoise * 9 + cellTexture * 0.68,
      random(150, 230) * max(0.95, layerReveal)
    );

    ellipse(x, y, markW, markH);
  }
}

function getStormWaveY(layer, x, amp, wavelength, speed, travelOffset) {
  // One-direction wave travel: subtracting positive travel from x makes crests move left-to-right.
  let travellingX = x - travelOffset;

  let waveHeightEnergy = getWaveHeightEnergy();
  let wildness = map(waveHeightEnergy, 0.07, 0.58, 0.15, 1.0);
  let waveformPulse = voicePulse * amp;
  let heightSpike = waveformHeight * amp;

  let mainWave = sin((travellingX / wavelength) * TWO_PI + layer.phase) * amp;
  let secondWave = sin((travellingX / (wavelength * 0.58)) * TWO_PI + layer.phase * 0.6) * amp * map(wildness, 0.15, 1, 0.08, 0.34);
  let thirdWave = sin((travellingX / (wavelength * 0.31)) * TWO_PI + layer.phase * 1.4 + t * 4.5) * amp * map(wildness, 0.15, 1, 0.02, 0.16);
  let voiceWave = sin((travellingX / (wavelength * 0.18)) * TWO_PI + t * 18 + layer.phase) * waveformPulse * 0.22;
  let heightWave = sin((travellingX / (wavelength * 0.24)) * TWO_PI + t * 13 + layer.phase * 1.8) * heightSpike * 0.2;
  let randomWave = (noise(travellingX * layer.noiseScale, layer.baseY * 0.005, t * 0.12) - 0.5) * amp * layer.noiseStrength * map(wildness, 0.15, 1, 0.25, 0.95);

  // More volume = more jagged / active surface, but still capped by the same amp.
  let peakLift = pow(max(0, mainWave / max(amp, 1)), 2.1) * amp * map(wildness, 0.15, 1, 0.08, 0.28 + waveformHeight * 0.16);

  return layer.baseY - mainWave - secondWave - thirdWave - voiceWave - heightWave - randomWave - peakLift;
}

function drawStormCrestFoam(layer, amp, wavelength, speed, leftEdge, rightEdge, localOffset) {
  if (getWaveHeightEnergy() < 0.13) return;

  noStroke();
  let layerIndex = stormWaveLayers.indexOf(layer);
  let layerReveal = getLayerRevealAmount(layerIndex);
  if (layerReveal <= 0.01) return;

  let foamAmount = int(map(getWaveHeightEnergy(), 0.13, 0.58, 2, 9));

  for (let i = 0; i < foamAmount; i++) {
    let x = random(leftEdge, rightEdge);
    let y = getStormWaveY(layer, x, amp, wavelength, speed, localOffset);

    if (y > layer.baseY - amp * 0.45) continue;

    fill(oceanPalette.foam[0], oceanPalette.foam[1], oceanPalette.foam[2], random(150, 235) * max(0.95, layerReveal));
    ellipse(x, y + random(-3, 7), random(8, 24), random(2, 5));
  }
}

function drawFoamBrushes() {
  if (getWaveHeightEnergy() < 0.14) return;

  rectMode(CENTER);
  noStroke();

  let foamCount = int(map(getWaveHeightEnergy(), 0.14, 0.58, 12, 62) + voicePulse * 38 + waveformHeight * 44);

  for (let i = 0; i < foamCount; i++) {
    let f = foamBrushes[i % foamBrushes.length];
    let layer = stormWaveLayers[f.layerIndex % stormWaveLayers.length];
    let layerReveal = getLayerRevealAmount(f.layerIndex % stormWaveLayers.length);
    if (layerReveal <= 0.01) continue;

    let visibleWidth = max(layer.front - layer.tail, 1);
    if (visibleWidth <= 2) continue;

    let waveHeightEnergy = getWaveHeightEnergy();
    let amp = layer.baseAmp + layer.soundAmp * waveHeightEnergy;
    let speed = layer.speed * getWaveSpeedEnergy();
    let wavelength = layer.wavelength;
    let x = layer.tail + ((f.xRatio * width + layer.foamOffset + i * 17) % visibleWidth);

    if (x < layer.tail || x > layer.front) continue;

    let y = getStormWaveY(layer, x, amp, wavelength, speed, layer.xDrift + layer.flowOffset) + random(-4, 12);

    fill(oceanPalette.foam[0], oceanPalette.foam[1], oceanPalette.foam[2], f.alpha * map(getWaveHeightEnergy(), 0.07, 0.58, 1.0, 1.45) * max(0.95, layerReveal));
    rect(x, y, f.size * random(1.2, 3.0), f.size * random(0.3, 0.7), f.size);
  }

  rectMode(CORNER);
}


function resizeAudioMechanic() {
  updateAudioOceanBounds();
  createStormOceanSystem();
  stormSkyProgress = micStarted ? 1 : 0;
  targetStormSkyProgress = micStarted ? 1 : 0;
  layerRevealProgress = micStarted ? 1 : 0;
  targetLayerRevealProgress = micStarted ? 1 : 0;
}
function drawLighthouseShoreBreak() {
  // The time mechanic places the lighthouse and rocky land on the right side.
  // This creates a diagonal shore-break instead of a vertical foam wall.
  if (stormOpacity <= 0.01) return;

  let oceanHeight = max(audioSeaBottom - audioSeaTop, 1);
  let shoreStartX = width * 0.81;
  let shoreEndX = width * 0.96;
  let shoreTop = audioSeaTop + oceanHeight * 0.2;
  let shoreBottom = audioSeaBottom + height * 0.04;
  let waveEnergy = getWaveHeightEnergy();
  let foamStrength = constrain(map(waveEnergy + voicePulse * 0.25 + waveformHeight * 0.25, 0.055, 0.58, 0.35, 1.25), 0.25, 1.35);

  push();
  noStroke();

  // Soft shaded water beside the rocky land, suggesting the shore blocks the wave flow.
  for (let i = 0; i < 9; i++) {
    let amt = i / 8;
    let x = lerp(shoreStartX, width, amt);
    let alphaValue = 28 * stormOpacity * pow(1 - amt, 1.35);
    fill(oceanPalette.deep[0] * 0.62, oceanPalette.deep[1] * 0.7, oceanPalette.deep[2] * 0.82, alphaValue);
    rect(x, shoreTop, width - x, shoreBottom - shoreTop);
  }

  // Broken foam strokes follow a diagonal implied coastline from upper-left to lower-right.
  let foamCount = int(map(foamStrength, 0.35, 1.25, 24, 78));
  for (let i = 0; i < foamCount; i++) {
    let yRatio = random(0.18, 0.98);
    let y = audioSeaTop + oceanHeight * yRatio + sin(t * 2.1 + i * 0.45) * height * 0.005;

    // Diagonal shore: farther down the water, the land edge sits slightly more to the right.
    let diagonalEdge = lerp(shoreStartX, shoreEndX, yRatio);
    let edgeNoise = noise(i * 0.18, yRatio * 3.5, t * 0.45);
    let x = diagonalEdge + map(edgeNoise, 0, 1, -width * 0.045, width * 0.055);

    let w = random(width * 0.015, width * 0.09) * map(yRatio, 0, 1, 0.7, 1.25);
    let h = random(2, 5.5);
    let alphaValue = random(75, 185) * foamStrength * stormOpacity;

    fill(oceanPalette.foam[0], oceanPalette.foam[1], oceanPalette.foam[2], alphaValue);
    ellipse(x, y, w, h);
  }

  // Short curved foam lines show waves curling back after striking the rocks.
  strokeWeight(1.2);
  noFill();
  let curlCount = int(map(foamStrength, 0.35, 1.25, 6, 18));
  for (let i = 0; i < curlCount; i++) {
    let yRatio = random(0.24, 0.92);
    let baseY = audioSeaTop + oceanHeight * yRatio;
    let edgeX = lerp(shoreStartX, shoreEndX, yRatio);
    let curlW = random(width * 0.025, width * 0.08);
    let curlH = random(height * 0.006, height * 0.018);
    let alphaValue = random(55, 135) * foamStrength * stormOpacity;

    stroke(oceanPalette.foam[0], oceanPalette.foam[1], oceanPalette.foam[2], alphaValue);
    beginShape();
    vertex(edgeX - curlW, baseY + curlH * 0.2);
    bezierVertex(edgeX - curlW * 0.45, baseY - curlH, edgeX + curlW * 0.1, baseY - curlH * 0.5, edgeX + curlW * 0.25, baseY + curlH * 0.2);
    endShape();
  }

  noStroke();

  // Small splashes climb upward near the implied rocky edge during louder sound.
  let splashCount = int(map(foamStrength, 0.35, 1.25, 4, 22));
  for (let i = 0; i < splashCount; i++) {
    let yRatio = random(0.22, 0.88);
    let baseY = audioSeaTop + oceanHeight * yRatio;
    let edgeX = lerp(shoreStartX, shoreEndX, yRatio);
    let splashX = edgeX + random(-width * 0.018, width * 0.03);
    let splashLift = random(height * 0.008, height * 0.04) * foamStrength;
    let splashW = random(3, 8);
    let splashH = random(2, 5);

    fill(oceanPalette.foam[0], oceanPalette.foam[1], oceanPalette.foam[2], random(55, 135) * foamStrength * stormOpacity);
    ellipse(splashX, baseY - splashLift, splashW, splashH);
  }

  // Subtle reflected turbulence beside the shore, aligned with left-to-right wave travel.
  strokeWeight(1);
  for (let i = 0; i < 18; i++) {
    let yRatio = random(0.2, 0.96);
    let y = audioSeaTop + oceanHeight * yRatio;
    let edgeX = lerp(shoreStartX, shoreEndX, yRatio);
    let x1 = edgeX - random(width * 0.025, width * 0.12);
    let x2 = edgeX + random(width * 0.01, width * 0.055);
    let alphaValue = random(25, 85) * foamStrength * stormOpacity;

    stroke(oceanPalette.highlight[0], oceanPalette.highlight[1], oceanPalette.highlight[2], alphaValue);
    line(x1, y, x2, y + sin(t * 2 + i) * height * 0.0035);
  }

  pop();
}