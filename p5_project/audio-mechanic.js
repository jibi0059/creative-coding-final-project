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

let currentIntensity = 0.08;
let targetIntensity = 0.08;

let stormBrushes = [];
let stormWaveLayers = [];
let foamBrushes = [];

function setupAudioMechanic() {
  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(toggleMic);

  createStormOceanSystem();
}

function drawAudioMechanic() {
  updateSoundLevel();
  updateOceanTransition();

  drawStormOceanLayer();
  drawMicDebug();

  t += 0.01;
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
    micButton.html("START MIC");
  }
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  let boostedSound = constrain(rawMicLevel, 0, 1);

  if (boostedSound > soundEnergy) {
    soundEnergy = boostedSound;
  }

  soundEnergy *= 0.9;
  smoothedSound = lerp(smoothedSound, soundEnergy, 0.13);

  if (micStarted) {
    targetIntensity = constrain(map(smoothedSound, 0.01, 0.35, 0.08, 1), 0.08, 1);
  } else {
    targetIntensity = 0.08;
  }

  currentIntensity = lerp(currentIntensity, targetIntensity, 0.075);
}

function getWaveHeightEnergy() {
  // Smooth staged wave height response.
  // Low mic levels create gentle raised waves.
  // The tallest waves are only reached when the mic level approaches around 0.35.
  let e = constrain(currentIntensity, 0, 1);

  if (e < 0.3) {
    let amt = smoothstep(0.08, 0.3, e);
    return lerp(0.18, 0.38, amt);
  } else if (e < 0.7) {
    let amt = smoothstep(0.3, 0.7, e);
    return lerp(0.38, 0.72, amt);
  } else {
    let amt = smoothstep(0.7, 1, e);
    return lerp(0.72, 1.15, amt);
  }
}

function smoothstep(edge0, edge1, x) {
  let amt = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return amt * amt * (3 - 2 * amt);
}

function getWaveSpeedEnergy() {
  // Very slow staged flow speed response.
  // Sound still affects speed, but the ocean now moves like heavy water instead of racing.
  let e = constrain(currentIntensity, 0, 1);

  if (e < 0.3) {
    return map(e, 0, 0.3, 0.075, 0.30);
  } else if (e < 0.7) {
    return map(e, 0.3, 0.7, 0.30, 0.90);
  } else {
    return map(e, 0.7, 1, 0.90, 1.75);
  }
}

function updateOceanTransition() {
  // Smooth fade transition instead of left/right sweep.
  // Mic on: storm layer fades in as a calm sea, then reacts to sound.
  // Mic off: waves calm down and fade out.
  stormOpacity = lerp(stormOpacity, targetStormOpacity, 0.035);

  if (stormOpacity < 0.01 && !micStarted) {
    stormOpacity = 0;
    stormLeaving = false;
    currentIntensity = 0.08;
  }
}

function getStormPresence() {
  return stormOpacity;
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

  for (let i = 0; i < layerCount; i++) {
    let depth = i / (layerCount - 1);

    stormWaveLayers.push({
      // Slightly higher placement so the ocean sits more naturally in the composition.
      baseY: map(depth, 0, 1, height * 0.48, height * 0.96),
      baseAmp: map(depth, 0, 1, height * 0.03, height * 0.075) * random(0.85, 1.25),
      soundAmp: map(depth, 0, 1, height * 0.07, height * 0.18) * random(0.75, 1.35),
      wavelength: random(width * 0.34, width * 0.68),
      speed: random(0.45, 1.25),
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
      y: random(height * 0.55, height),
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

  // Let storm waves rise freely instead of being cut off at a fixed height.
  drawingContext.rect(0, 0, width, height);
  drawingContext.clip();

  drawStormBrushFieldFromLayers();

  for (let i = 0; i < stormWaveLayers.length; i++) {
    updateSingleStormWaveMotion(stormWaveLayers[i], i);
    drawSingleStormWave(stormWaveLayers[i], i);
  }

  drawFoamBrushes();

  drawingContext.restore();
  pop();
}

function updateSingleStormWaveMotion(layer, index) {
  let flowSpeed = layer.speed * getWaveSpeedEnergy();
  layer.flowOffset += flowSpeed * width * 0.006;
  layer.foamOffset += flowSpeed * 1.2;

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

  let speedMultiplier = getWaveSpeedEnergy() * 0.55;
  let verticalMovement = map(getWaveHeightEnergy(), 0, 1.15, 3, height * 0.035);

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    let layer = stormWaveLayers[i % stormWaveLayers.length];

    if (b.x < layer.tail + width * 0.03 || b.x > layer.front - width * 0.03) continue;

    let depth = map(b.y, height * 0.34, height, 0, 1);
    let smoothWave = sin(b.x * 0.012 + t * 0.8 + b.noiseOffset);

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
      b.y = random(height * 0.55, height);
    }

    let c;
    if (b.colourPick < 0.45) {
      c = color(8, 34, 66, map(depth, 0, 1, 70, 155));
    } else if (b.colourPick < 0.82) {
      c = color(22, 72 + currentIntensity * 14, 108 + currentIntensity * 22, map(depth, 0, 1, 45, 125));
    } else {
      c = color(190, 205, 198, map(currentIntensity, 0, 1, 12, 55));
    }

    // Louder waves become brighter.
    let brightnessBoost = map(waveHeightEnergy, 0.18, 1.15, 0, 45);

    fill(
      min(red(c) + brightnessBoost, 255),
      min(green(c) + brightnessBoost, 255),
      min(blue(c) + brightnessBoost, 255),
      alpha(c)
    );

    rect(b.x, brushY, b.w, b.h, b.h);
  }

  rectMode(CORNER);
}

function drawSingleStormWave(layer, index) {
  let leftEdge = layer.tail;
  let rightEdge = layer.front;

  if (rightEdge < 0 || leftEdge > width) return;

  let depth = index / max(stormWaveLayers.length - 1, 1);
  let waveHeightEnergy = getWaveHeightEnergy();
  let amp = layer.baseAmp + layer.soundAmp * waveHeightEnergy;
  let speed = layer.speed * getWaveSpeedEnergy();
  let wavelength = layer.wavelength;
  let localOffset = layer.xDrift - layer.flowOffset;

  let waveColour;
  if (layer.colourType < 0.38) {
    waveColour = color(9, 36, 68, map(depth, 0, 1, 145, 230));
  } else if (layer.colourType < 0.78) {
    waveColour = color(18, 68 + currentIntensity * 20, 104 + currentIntensity * 30, map(depth, 0, 1, 120, 215));
  } else {
    waveColour = color(55 + currentIntensity * 38, 82 + currentIntensity * 20, 82, map(depth, 0, 1, 65, 145));
  }

  noStroke();
  fill(waveColour);

  beginShape();
  vertex(leftEdge - 40, height + 40);

  for (let x = leftEdge - 40; x <= rightEdge + 60; x += 18) {
    let y = getStormWaveY(layer, x + localOffset, amp, wavelength, speed);
    vertex(x, y);
  }

  vertex(rightEdge + 60, height + 40);
  endShape(CLOSE);

  drawStormCrestFoam(layer, amp, wavelength, speed, leftEdge, rightEdge, localOffset);
}

function getStormWaveY(layer, x, amp, wavelength, speed) {
  let mainWave = sin((x / wavelength) * TWO_PI + layer.phase) * amp;
  let secondWave = sin((x / (wavelength * 0.58)) * TWO_PI - layer.phase) * amp * 0.22;
  let randomWave = (noise(x * layer.noiseScale, layer.baseY * 0.005, t * 0.08) - 0.5) * amp * layer.noiseStrength * 0.75;

  // Louder sound makes waves taller and more violent, not visually tighter.
  let peakLift = pow(max(0, mainWave / max(amp, 1)), 2.15) * amp * getWaveHeightEnergy() * 0.55;

  return layer.baseY - mainWave - secondWave - randomWave - peakLift;
}

function drawStormCrestFoam(layer, amp, wavelength, speed, leftEdge, rightEdge, localOffset) {
  if (getWaveHeightEnergy() < 0.25) return;

  noStroke();

  let foamAmount = int(map(getWaveHeightEnergy(), 0.25, 1.15, 3, 18));

  for (let i = 0; i < foamAmount; i++) {
    let x = random(leftEdge, rightEdge);
    let y = getStormWaveY(layer, x + localOffset, amp, wavelength, speed);

    if (y > layer.baseY - amp * 0.45) continue;

    fill(235, 232, 210, random(45, 130));
    ellipse(x, y + random(-4, 8), random(10, 32), random(2, 6));
  }
}

function drawFoamBrushes() {
  if (getWaveHeightEnergy() < 0.28) return;

  rectMode(CENTER);
  noStroke();

  let foamCount = int(map(getWaveHeightEnergy(), 0.28, 1.15, 25, 135));

  for (let i = 0; i < foamCount; i++) {
    let f = foamBrushes[i % foamBrushes.length];
    let layer = stormWaveLayers[f.layerIndex % stormWaveLayers.length];

    let visibleWidth = max(layer.front - layer.tail, 1);
    if (visibleWidth <= 2) continue;

    let waveHeightEnergy = getWaveHeightEnergy();
    let amp = layer.baseAmp + layer.soundAmp * waveHeightEnergy;
    let speed = layer.speed * getWaveSpeedEnergy();
    let wavelength = layer.wavelength;
    let x = layer.tail + ((f.xRatio * width + layer.foamOffset + i * 17) % visibleWidth);

    if (x < layer.tail || x > layer.front) continue;

    let y = getStormWaveY(layer, x, amp, wavelength, speed) + random(-4, 12);

    fill(230, 236, 224, f.alpha * map(getWaveHeightEnergy(), 0.28, 1.15, 0.38, 1.1));
    rect(x, y, f.size * random(1.2, 3.0), f.size * random(0.3, 0.7), f.size);
  }

  rectMode(CORNER);
}


function resizeAudioMechanic() {
  createStormOceanSystem();
}