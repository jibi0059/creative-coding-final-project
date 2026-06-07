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

let stormBrushes = [];
let stormWaveLayers = [];
let foamBrushes = [];

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

  drawStormOceanLayer();

  if (audioDebugVisible) {
    drawMicDebug();
  }

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

  oceanPalette.highlight = [
    constrain(175 + dayAmount * 45 + twilightAmount * 30, 145, 240),
    constrain(195 + dayAmount * 35 + twilightAmount * 20, 165, 240),
    constrain(190 + dayAmount * 22 - nightAmount * 25, 145, 230)
  ];

  oceanPalette.foam = [
    constrain(225 + dayAmount * 15, 205, 250),
    constrain(228 + dayAmount * 12, 205, 250),
    constrain(214 + twilightAmount * 18, 190, 245)
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
    micButton.html("START MIC");
  }
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  // Boost the microphone signal so claps / voice clearly affect the ocean.
  let boostedSound = constrain(rawMicLevel * 4.5, 0, 1);

  if (boostedSound > soundEnergy) {
    soundEnergy = boostedSound;
  }

  soundEnergy *= 0.93;
  smoothedSound = lerp(smoothedSound, soundEnergy, 0.18);

  if (micStarted) {
    // This lower range makes normal voice / claps visible again.
    targetIntensity = constrain(map(smoothedSound, 0.006, 0.16, 0.12, 1), 0.12, 1);
  } else {
    targetIntensity = 0.08;
  }

  currentIntensity = lerp(currentIntensity, targetIntensity, 0.11);
}

function getWaveHeightEnergy() {
  // Smooth staged wave height response.
  // Low mic levels create gentle raised waves.
  // The tallest waves are only reached when the mic level approaches around 0.35.
  let e = constrain(currentIntensity, 0, 1);

  if (e < 0.3) {
    let amt = smoothstep(0.08, 0.3, e);
    return lerp(0.09, 0.19, amt);
  } else if (e < 0.7) {
    let amt = smoothstep(0.3, 0.7, e);
    return lerp(0.19, 0.36, amt);
  } else {
    let amt = smoothstep(0.7, 1, e);
    return lerp(0.36, 0.58, amt);
  }
}

function smoothstep(edge0, edge1, x) {
  let amt = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return amt * amt * (3 - 2 * amt);
}

function getWaveSpeedEnergy() {
  // Keep the audio ocean flowing close to the calm Perlin ocean speed.
  // Sound changes the wave height more than the horizontal travel speed.
  let e = constrain(currentIntensity, 0, 1);

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

  if (stormOpacity < 0.01 && !micStarted) {
    stormOpacity = 0;
    layerRevealProgress = 0;
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

  let shorter = min(width, height);
  let layerCount = 12;

  updateAudioOceanBounds();

  for (let i = 0; i < layerCount; i++) {
    let depth = i / (layerCount - 1);

    stormWaveLayers.push({
      // Share the same horizon as the time and perlin mechanics so this reads as one ocean.
      baseYRatio: map(depth, 0, 1, 0.02, 0.96),
      baseY: audioOceanY(map(depth, 0, 1, 0.02, 0.96)),
      baseAmpRatio: map(depth, 0, 1, 0.009, 0.026) * random(0.85, 1.18),
      soundAmpRatio: map(depth, 0, 1, 0.06, 0.145) * random(0.85, 1.45),
      baseAmp: map(depth, 0, 1, height * 0.03, height * 0.075) * random(0.85, 1.25),
      soundAmp: map(depth, 0, 1, height * 0.07, height * 0.18) * random(0.75, 1.35),
      wavelength: random(width * 0.34, width * 0.68),
      speed: random(0.28, 0.62),
      phase: random(TWO_PI),
      noiseScale: random(0.0018, 0.0045),
      noiseStrength: random(0.28, 0.75),
      colourType: random(),
      xDrift: random(-width * 0.12, width * 0.12),
      front: width * 1.15,
      tail: -width * 0.15,
      enterSpeed: random(0.012, 0.026),
      leaveSpeed: random(0.016, 0.034),
      activeWidth: random(width * 0.7, width * 1.25),
      flowOffset: random(width),
      foamOffset: random(width)
    });
  }

  for (let i = 0; i < 520; i++) {
    stormBrushes.push({
      x: random(width * 1.35),
      yRatio: random(0.12, 1),
      y: audioOceanY(random(0.12, 1)),
      w: random(shorter * 0.012, shorter * 0.065),
      h: random(2, 8),
      speed: random(0.35, 1.45),
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
  drawAudioCelestialReflection();

  drawStormBrushFieldFromLayers();

  for (let i = 0; i < stormWaveLayers.length; i++) {
    updateSingleStormWaveMotion(stormWaveLayers[i], i);
    drawSingleStormWave(stormWaveLayers[i], i);
  }

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
      255 * bandReveal
    );

    rect(0, y, width, bandH);
  }

  // Monet-like horizontal strokes so the active ocean still feels close to the calm Perlin sea.
  for (let i = 0; i < 120; i++) {
    let yRatio = random(0.03, 1);
    let y = audioOceanY(yRatio);
    let strokeReveal = getBrushRevealAmount(yRatio);
    if (strokeReveal <= 0.01) continue;
    let strokeW = random(width * 0.025, width * 0.16);
    let strokeH = random(2, 8);
    let x = (random(width) + t * width * 0.01 * random(0.4, 1.2)) % width;
    let depthAlpha = map(yRatio, 0, 1, 28, 92);

    fill(
      lerp(oceanPalette.highlight[0], oceanPalette.mid[0], yRatio),
      lerp(oceanPalette.highlight[1], oceanPalette.mid[1], yRatio),
      lerp(oceanPalette.highlight[2], oceanPalette.mid[2], yRatio),
      depthAlpha * map(waveMood, 0.18, 1.15, 0.7, 1.25) * strokeReveal
    );

    rect(x, y, strokeW, strokeH, strokeH);
  }
}

function drawAudioCelestialReflection() {
  if (typeof latestTimeSceneState === "undefined" || !latestTimeSceneState) return;

  let scene = latestTimeSceneState;
  let reflectionX = width * 0.5;
  let reflectionStrength = 0;
  let reflectionColour = [255, 225, 150];

  if (scene.sun && scene.sun.amount > 0.02) {
    reflectionX = scene.sun.x;
    reflectionStrength = scene.sun.amount * max(scene.dayAmount || 0, scene.twilightAmount || 0.35);
    reflectionColour = [255, 215, 135];
  }

  if (scene.moon && scene.moon.amount > 0.02 && scene.moon.amount > reflectionStrength) {
    reflectionX = scene.moon.x;
    reflectionStrength = scene.moon.amount * max(scene.nightAmount || 0, 0.35);
    reflectionColour = [195, 215, 245];
  }

  if (reflectionStrength <= 0.02) return;

  noStroke();

  let waveMood = getWaveHeightEnergy();
  let oceanHeight = max(audioSeaBottom - audioSeaTop, 1);
  let shimmerCount = int(map(waveMood, 0.18, 1.15, 26, 72));
  let reflectionWidth = map(waveMood, 0.18, 1.15, width * 0.10, width * 0.26);

  for (let i = 0; i < shimmerCount; i++) {
    let amt = i / max(shimmerCount - 1, 1);
    let y = audioSeaTop + oceanHeight * map(amt, 0, 1, 0.03, 0.82);
    let reflectionReveal = getBrushRevealAmount(map(y, audioSeaTop, audioSeaBottom, 0, 1));
    if (reflectionReveal <= 0.01) continue;
    let spread = reflectionWidth * (0.15 + amt * 1.15);
    let x = reflectionX + sin(t * 2.2 + i * 0.75) * spread * 0.2 + random(-spread, spread);
    let w = random(width * 0.018, width * 0.12) * (1 - amt * 0.45);
    let h = random(2, 7);
    let alphaValue = reflectionStrength * map(amt, 0, 1, 115, 12) * reflectionReveal;

    fill(reflectionColour[0], reflectionColour[1], reflectionColour[2], alphaValue);
    rect(x, y, w, h, h);
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
  let flowSpeed = layer.speed * getWaveSpeedEnergy();
  layer.flowOffset += flowSpeed * width * 0.012;
  layer.foamOffset += flowSpeed * 1.4;

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

  let speedMultiplier = getWaveSpeedEnergy() * 0.9;
  let verticalMovement = map(getWaveHeightEnergy(), 0, 0.58, 2, height * 0.018);

  refreshStormLayerGeometry();

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    let layer = stormWaveLayers[i % stormWaveLayers.length];
    let brushReveal = getBrushRevealAmount(b.yRatio);
    if (brushReveal <= 0.01) continue;

    if (b.x < layer.tail + width * 0.03 || b.x > layer.front - width * 0.03) continue;

    let depth = map(b.y, audioSeaTop, audioSeaBottom, 0, 1);
    let smoothWave = sin(b.x * 0.012 + t * 1.15 + b.noiseOffset);

    let waveHeightEnergy = getWaveHeightEnergy();
    let amp = layer.baseAmp + layer.soundAmp * waveHeightEnergy;
    let waveY = getStormWaveY(layer, b.x - layer.flowOffset, amp, layer.wavelength, layer.speed);

    // Keep brush strokes attached to the body of the wave.
    let yPush = smoothWave * verticalMovement * b.layer;
    let brushY = waveY + map(depth, 0, 1, 8, 90) + yPush;

    // Skip anything that drifts above the wave crest.
    if (brushY < waveY + 4) continue;

    b.x += b.speed * speedMultiplier;

    if (b.x > width * 1.35 + b.w) {
      b.x = -b.w;
      b.yRatio = random(0.12, 1);
      b.y = audioOceanY(b.yRatio);
    }

    let c;
    if (b.colourPick < 0.45) {
      c = color(oceanPalette.deep[0], oceanPalette.deep[1], oceanPalette.deep[2], map(depth, 0, 1, 115, 210));
    } else if (b.colourPick < 0.82) {
      c = color(oceanPalette.mid[0], oceanPalette.mid[1], oceanPalette.mid[2], map(depth, 0, 1, 95, 190));
    } else {
      c = color(oceanPalette.highlight[0], oceanPalette.highlight[1], oceanPalette.highlight[2], map(currentIntensity, 0, 1, 35, 105));
    }

    // Louder waves become brighter.
    let brightnessBoost = map(waveHeightEnergy, 0.18, 1.15, 0, 45);

    fill(
      min(red(c) + brightnessBoost, 255),
      min(green(c) + brightnessBoost, 255),
      min(blue(c) + brightnessBoost, 255),
      alpha(c) * brushReveal
    );

    rect(b.x, brushY, b.w, b.h, b.h);
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
  let localOffset = layer.xDrift - layer.flowOffset;

  let waveColour;
  if (layer.colourType < 0.38) {
    waveColour = color(oceanPalette.deep[0], oceanPalette.deep[1], oceanPalette.deep[2], map(depth, 0, 1, 190, 255));
  } else if (layer.colourType < 0.78) {
    waveColour = color(oceanPalette.mid[0], oceanPalette.mid[1], oceanPalette.mid[2], map(depth, 0, 1, 175, 245));
  } else {
    waveColour = color(oceanPalette.highlight[0] * 0.45, oceanPalette.highlight[1] * 0.5, oceanPalette.highlight[2] * 0.48, map(depth, 0, 1, 135, 220));
  }

  noStroke();
  fill(red(waveColour), green(waveColour), blue(waveColour), alpha(waveColour) * layerReveal);

  beginShape();
  vertex(leftEdge - 40, audioSeaBottom + height * 0.08);

  for (let x = leftEdge - 40; x <= rightEdge + 60; x += 18) {
    let y = getStormWaveY(layer, x + localOffset, amp, wavelength, speed);
    vertex(x, y);
  }

  vertex(rightEdge + 60, audioSeaBottom + height * 0.08);
  endShape(CLOSE);

  drawStormCrestFoam(layer, amp, wavelength, speed, leftEdge, rightEdge, localOffset);
}

function getStormWaveY(layer, x, amp, wavelength, speed) {
  let timeDrift = t * speed * 1.6;
  let mainWave = sin((x / wavelength) * TWO_PI + layer.phase + timeDrift) * amp;
  let secondWave = sin((x / (wavelength * 0.58)) * TWO_PI - layer.phase + timeDrift * 0.7) * amp * 0.22;
  let randomWave = (noise(x * layer.noiseScale + timeDrift * 0.18, layer.baseY * 0.005, t * 0.08) - 0.5) * amp * layer.noiseStrength * 0.75;

  // Louder sound makes waves taller and more violent, not visually tighter.
  let peakLift = pow(max(0, mainWave / max(amp, 1)), 2.15) * amp * getWaveHeightEnergy() * 0.28;

  return layer.baseY - mainWave - secondWave - randomWave - peakLift;
}

function drawStormCrestFoam(layer, amp, wavelength, speed, leftEdge, rightEdge, localOffset) {
  if (getWaveHeightEnergy() < 0.13) return;

  noStroke();
  let layerIndex = stormWaveLayers.indexOf(layer);
  let layerReveal = getLayerRevealAmount(layerIndex);
  if (layerReveal <= 0.01) return;

  let foamAmount = int(map(getWaveHeightEnergy(), 0.13, 0.58, 3, 14));

  for (let i = 0; i < foamAmount; i++) {
    let x = random(leftEdge, rightEdge);
    let y = getStormWaveY(layer, x + localOffset, amp, wavelength, speed);

    if (y > layer.baseY - amp * 0.45) continue;

    fill(oceanPalette.foam[0], oceanPalette.foam[1], oceanPalette.foam[2], random(45, 130) * layerReveal);
    ellipse(x, y + random(-4, 8), random(10, 32), random(2, 6));
  }
}

function drawFoamBrushes() {
  if (getWaveHeightEnergy() < 0.14) return;

  rectMode(CENTER);
  noStroke();

  let foamCount = int(map(getWaveHeightEnergy(), 0.14, 0.58, 18, 90));

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

    let y = getStormWaveY(layer, x, amp, wavelength, speed) + random(-4, 12);

    fill(oceanPalette.foam[0], oceanPalette.foam[1], oceanPalette.foam[2], f.alpha * map(getWaveHeightEnergy(), 0.14, 0.58, 0.35, 0.95) * layerReveal);
    rect(x, y, f.size * random(1.2, 3.0), f.size * random(0.3, 0.7), f.size);
  }

  rectMode(CORNER);
}


function resizeAudioMechanic() {
  updateAudioOceanBounds();
  createStormOceanSystem();
  layerRevealProgress = micStarted ? 1 : 0;
  targetLayerRevealProgress = micStarted ? 1 : 0;
}