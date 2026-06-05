let micButton;
let t = 0;

let mic;
let micStarted = false;
let rawMicLevel = 0;
let smoothedSound = 0;
let soundEnergy = 0;

let oceanFront = 0;
let oceanTail = 0;
let currentWildness = 0;
let targetWildness = 0;
let stormLeaving = false;

let calmBrushes = [];
let stormBrushes = [];
let stormWaveLayers = [];
let foamBrushes = [];

function setupAudioMechanic() {
  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(toggleMic);

  createOceanBrushes();
  createStormWaveLayers();
  createFoamBrushes();
}

function drawAudioMechanic() {
  drawCalmPainting();
  updateSoundLevel();
  updateOceanTransition();

  drawCalmOcean();
  drawInteractiveOceanLayer();
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
      oceanTail = 0;
      oceanFront = max(oceanFront, width * 0.03);
    });
  } else {
    mic.stop();
    micStarted = false;
    rawMicLevel = 0;
    smoothedSound = 0;
    soundEnergy = 0;
    targetWildness = 0;
    stormLeaving = true;
    micButton.html("START MIC");
  }
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  let boostedSound = constrain(rawMicLevel * 42, 0, 1);

  if (boostedSound > soundEnergy) {
    soundEnergy = boostedSound;
  }

  soundEnergy *= 0.9;
  smoothedSound = lerp(smoothedSound, soundEnergy, 0.13);

  if (micStarted) {
    targetWildness = constrain(map(smoothedSound, 0, 1, 0.08, 0.92), 0.08, 0.92);
  } else {
    targetWildness = 0;
  }

  currentWildness = lerp(currentWildness, targetWildness, 0.075);
}

function updateOceanTransition() {
  // Mic on: storm layers enter from the left.
  // Mic off: storm layers continue travelling out to the right.
  if (micStarted) {
    oceanFront = lerp(oceanFront, width + width * 0.28, 0.018);
    oceanTail = 0;
  } else if (stormLeaving) {
    oceanTail = lerp(oceanTail, width + width * 0.28, 0.021);
    oceanFront = width + width * 0.28;

    if (oceanTail > width + width * 0.15) {
      stormLeaving = false;
      oceanFront = 0;
      oceanTail = 0;
      currentWildness = 0;
    }
  }
}

function drawCalmPainting() {
  let topColour = color(8, 12, 28);
  let horizonColour = color(34, 47, 75);

  for (let y = 0; y < height; y += 3) {
    let amt = map(y, 0, height, 0, 1);
    stroke(lerpColor(topColour, horizonColour, amt));
    strokeWeight(3);
    line(0, y, width, y);
  }

  noStroke();
  fill(230, 225, 190, 220);
  circle(width * 0.52, height * 0.22, min(width, height) * 0.09);

  fill(230, 225, 190, 28);
  circle(width * 0.52, height * 0.22, min(width, height) * 0.16);

  fill(230, 225, 190, 12);
  circle(width * 0.52, height * 0.22, min(width, height) * 0.24);
}

function createOceanBrushes() {
  calmBrushes = [];
  stormBrushes = [];

  let oceanTop = height * 0.45;
  let shorter = min(width, height);

  for (let i = 0; i < 430; i++) {
    calmBrushes.push({
      x: random(width),
      y: random(oceanTop, height),
      w: random(shorter * 0.015, shorter * 0.055),
      h: random(2, 7),
      speed: random(0.12, 0.42),
      noiseOffset: random(1000),
      colourPick: random()
    });
  }

  for (let i = 0; i < 420; i++) {
    stormBrushes.push({
      x: random(width * 1.35),
      y: random(height * 0.32, height),
      w: random(shorter * 0.012, shorter * 0.06),
      h: random(2, 8),
      speed: random(0.35, 1.4),
      noiseOffset: random(1000),
      colourPick: random(),
      layer: random(0.5, 1.35)
    });
  }
}

function createStormWaveLayers() {
  stormWaveLayers = [];

  // Each object is one independent wave body. They overlap to create the storm.
  for (let i = 0; i < 13; i++) {
    let depth = i / 12;

    stormWaveLayers.push({
      baseY: map(depth, 0, 1, height * 0.36, height * 0.92),
      baseAmp: map(depth, 0, 1, height * 0.055, height * 0.12) * random(0.75, 1.35),
      soundAmp: map(depth, 0, 1, height * 0.08, height * 0.2) * random(0.7, 1.45),
      wavelength: random(width * 0.22, width * 0.46),
      speed: random(0.55, 1.75),
      phase: random(TWO_PI),
      noiseScale: random(0.0025, 0.006),
      noiseStrength: random(0.3, 0.9),
      colourType: random(),
      foamChance: random(),
      xDrift: random(-width * 0.08, width * 0.08)
    });
  }
}

function createFoamBrushes() {
  foamBrushes = [];

  for (let i = 0; i < 180; i++) {
    foamBrushes.push({
      layerIndex: floor(random(13)),
      xRatio: random(0, 1.35),
      size: random(2, 7),
      offset: random(1000),
      alpha: random(40, 130)
    });
  }
}

function drawCalmOcean() {
  let oceanTop = height * 0.45;

  noStroke();
  fill(14, 35, 62, 235);
  rect(0, oceanTop, width, height - oceanTop);

  drawCalmWaveBands(oceanTop);
  drawCalmBrushField(oceanTop);
  drawCalmReflection(oceanTop);
}

function drawCalmWaveBands(oceanTop) {
  noStroke();

  for (let y = oceanTop; y < height; y += 18) {
    beginShape();

    let depth = map(y, oceanTop, height, 0, 1);
    fill(24, 58, 88, map(depth, 0, 1, 70, 180));

    vertex(0, height);

    for (let x = 0; x <= width + 20; x += 24) {
      let wave = sin(x * 0.008 + t * 1.2 + y * 0.015) * map(depth, 0, 1, 2, 8);
      vertex(x, y + wave);
    }

    vertex(width, height);
    endShape(CLOSE);
  }
}

function drawCalmBrushField(oceanTop) {
  rectMode(CENTER);
  noStroke();

  for (let i = 0; i < calmBrushes.length; i++) {
    let b = calmBrushes[i];
    let depth = map(b.y, oceanTop, height, 0, 1);
    let drift = sin(t * 1.5 + b.noiseOffset) * 4;
    let yWave = sin(b.x * 0.01 + t + b.noiseOffset) * map(depth, 0, 1, 1, 7);

    b.x += b.speed;
    if (b.x > width + b.w) {
      b.x = -b.w;
      b.y = random(oceanTop, height);
    }

    let c;
    if (b.colourPick < 0.45) {
      c = color(28, 68, 102, map(depth, 0, 1, 45, 125));
    } else if (b.colourPick < 0.8) {
      c = color(44, 84, 112, map(depth, 0, 1, 35, 105));
    } else {
      c = color(190, 198, 177, map(depth, 0, 1, 18, 55));
    }

    fill(c);
    rect(b.x + drift, b.y + yWave, b.w, b.h, b.h);
  }

  rectMode(CORNER);
}

function drawCalmReflection(oceanTop) {
  let centerX = width * 0.52;
  rectMode(CENTER);
  noStroke();

  for (let i = 0; i < 38; i++) {
    let y = oceanTop + 18 + i * 11;
    let depth = map(y, oceanTop, height, 0, 1);
    let spread = map(i, 0, 38, width * 0.04, width * 0.2);
    let shimmer = sin(t * 2.5 + i * 0.6) * 5;

    fill(230, 225, 190, map(depth, 0, 1, 75, 5));
    rect(centerX + shimmer, y, spread, 2.2, 3);
  }

  rectMode(CORNER);
}

function drawInteractiveOceanLayer() {
  if (oceanFront <= 1 && !stormLeaving) return;

  push();
  drawingContext.save();
  drawingContext.beginPath();

  let leftEdge = oceanTail;
  let rightEdge = oceanFront;

  drawingContext.rect(leftEdge, height * 0.23, rightEdge - leftEdge, height * 0.77);
  drawingContext.clip();

  drawStormOcean(leftEdge, rightEdge);

  drawingContext.restore();
  pop();
}

function drawStormOcean(leftEdge, rightEdge) {
  let wildness = max(currentWildness, stormLeaving ? 0.32 : 0.08);

  noStroke();
  fill(5, 18, 36, 218);
  rect(leftEdge - 2, height * 0.26, rightEdge - leftEdge + 4, height * 0.74);

  drawStormBrushField(wildness);

  // Back layers first, front layers last.
  for (let i = 0; i < stormWaveLayers.length; i++) {
    drawSingleStormWave(stormWaveLayers[i], i, wildness, leftEdge, rightEdge);
  }

  drawFoamBrushes(wildness, leftEdge, rightEdge);
}

function drawStormBrushField(wildness) {
  rectMode(CENTER);
  noStroke();

  let speedMultiplier = map(wildness, 0, 1, 0.45, 1.8);
  let verticalMovement = map(wildness, 0, 1, 3, height * 0.035);

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    let depth = map(b.y, height * 0.32, height, 0, 1);
    let smoothWave = sin(b.x * 0.012 + t * (1.1 + wildness * 1.8) + b.noiseOffset);
    let yPush = smoothWave * verticalMovement * b.layer;

    b.x += b.speed * speedMultiplier;

    if (b.x > width * 1.35 + b.w) {
      b.x = -b.w;
      b.y = random(height * 0.32, height);
    }

    let c;
    if (b.colourPick < 0.45) {
      c = color(8, 34, 66, map(depth, 0, 1, 80, 170));
    } else if (b.colourPick < 0.82) {
      c = color(22, 72 + wildness * 12, 108 + wildness * 18, map(depth, 0, 1, 55, 135));
    } else {
      c = color(190, 205, 198, map(wildness, 0, 1, 18, 62));
    }

    fill(c);
    rect(b.x, b.y + yPush, b.w, b.h, b.h);
  }

  rectMode(CORNER);
}

function drawSingleStormWave(layer, layerIndex, wildness, leftEdge, rightEdge) {
  let layerDepth = layerIndex / max(stormWaveLayers.length - 1, 1);
  let amp = layer.baseAmp + layer.soundAmp * wildness;
  let speed = layer.speed * map(wildness, 0, 1, 0.8, 2.1);
  let wavelength = layer.wavelength * map(wildness, 0, 1, 1.15, 0.72);
  let localOffset = layer.xDrift + t * speed * width * 0.035;

  let waveColour;
  if (layer.colourType < 0.35) {
    waveColour = color(9, 36, 68, map(layerDepth, 0, 1, 175, 235));
  } else if (layer.colourType < 0.7) {
    waveColour = color(18, 68 + wildness * 18, 104 + wildness * 26, map(layerDepth, 0, 1, 155, 225));
  } else {
    waveColour = color(42, 92 + wildness * 18, 120 + wildness * 20, map(layerDepth, 0, 1, 135, 205));
  }

  noStroke();
  fill(waveColour);

  beginShape();
  vertex(leftEdge - 40, height + 40);

  for (let x = leftEdge - 40; x <= rightEdge + 60; x += 18) {
    let y = getStormWaveY(layer, x + localOffset, amp, wavelength, speed, wildness);
    vertex(x, y);
  }

  vertex(rightEdge + 60, height + 40);
  endShape(CLOSE);

  drawWaveHighlight(layer, amp, wavelength, speed, wildness, leftEdge, rightEdge, localOffset);
}

function getStormWaveY(layer, x, amp, wavelength, speed, wildness) {
  let mainWave = sin((x / wavelength) * TWO_PI + layer.phase + t * speed) * amp;
  let secondWave = sin((x / (wavelength * 0.47)) * TWO_PI - layer.phase + t * speed * 0.62) * amp * 0.28;
  let randomWave = (noise(x * layer.noiseScale, layer.baseY * 0.005, t * 0.28 * speed) - 0.5) * amp * layer.noiseStrength;

  // This makes peaks feel uneven and storm-like without becoming messy scribbles.
  let peakLift = pow(max(0, mainWave / max(amp, 1)), 2.2) * amp * wildness * 0.85;

  return layer.baseY - mainWave - secondWave - randomWave - peakLift;
}

function drawWaveHighlight(layer, amp, wavelength, speed, wildness, leftEdge, rightEdge, localOffset) {
  if (wildness < 0.12) return;

  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  stroke(215, 228, 218, map(wildness, 0, 1, 35, 125));
  strokeWeight(map(wildness, 0, 1, 1, 2.4));

  beginShape();
  for (let x = leftEdge - 30; x <= rightEdge + 50; x += 22) {
    let y = getStormWaveY(layer, x + localOffset, amp, wavelength, speed, wildness);
    vertex(x, y + amp * 0.12);
  }
  endShape();
}

function drawFoamBrushes(wildness, leftEdge, rightEdge) {
  if (wildness < 0.22) return;

  rectMode(CENTER);
  noStroke();

  let visibleWidth = max(rightEdge - leftEdge, 1);
  let foamCount = int(map(wildness, 0.22, 1, 30, 130));

  for (let i = 0; i < foamCount; i++) {
    let f = foamBrushes[i % foamBrushes.length];
    let layer = stormWaveLayers[f.layerIndex % stormWaveLayers.length];

    let amp = layer.baseAmp + layer.soundAmp * wildness;
    let speed = layer.speed * map(wildness, 0, 1, 0.8, 2.1);
    let wavelength = layer.wavelength * map(wildness, 0, 1, 1.15, 0.72);
    let x = leftEdge + ((f.xRatio * width + t * 42 + i * 17) % visibleWidth);
    let y = getStormWaveY(layer, x, amp, wavelength, speed, wildness) + random(-4, 12);

    fill(230, 236, 224, f.alpha * map(wildness, 0.22, 1, 0.45, 1.25));
    rect(x, y, f.size * random(1.3, 3.5), f.size * random(0.35, 0.75), f.size);
  }

  rectMode(CORNER);
}

function drawMicDebug() {
  noStroke();
  fill(255, 225);
  textSize(14);

  if (!micStarted && !stormLeaving && oceanFront <= 1) {
    text("click START MIC to let individual wave layers enter", 30, 75);
  } else if (!micStarted) {
    text("mic off: individual wave layers exit to the right", 30, 75);
  } else {
    text("mic level: " + nf(rawMicLevel, 1, 4), 30, 75);
    text("wave intensity: " + nf(currentWildness, 1, 2), 30, 95);
  }
}

function resizeAudioMechanic() {
  createOceanBrushes();
  createStormWaveLayers();
  createFoamBrushes();

  oceanFront = constrain(oceanFront, 0, width + width * 0.28);
  oceanTail = constrain(oceanTail, 0, width + width * 0.28);
}