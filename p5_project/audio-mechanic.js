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
let waveRidges = [];
let sprayDrops = [];

function setupAudioMechanic() {
  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(toggleMic);

  createOceanBrushes();
  createWaveRidges();
  createSprayDrops();
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
      oceanFront = max(oceanFront, width * 0.02);
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

  let boostedSound = constrain(rawMicLevel * 45, 0, 1);

  if (boostedSound > soundEnergy) {
    soundEnergy = boostedSound;
  }

  soundEnergy *= 0.9;
  smoothedSound = lerp(smoothedSound, soundEnergy, 0.14);

  if (micStarted) {
    targetWildness = constrain(map(smoothedSound, 0, 1, 0.08, 0.9), 0.08, 0.9);
  } else {
    targetWildness = 0;
  }

  currentWildness = lerp(currentWildness, targetWildness, 0.07);
}

function updateOceanTransition() {
  // Mic on: the storm waves enter from the left.
  // Mic off: the whole storm layer continues travelling and exits to the right.
  if (micStarted) {
    oceanFront = lerp(oceanFront, width + width * 0.25, 0.018);
    oceanTail = 0;
  } else if (stormLeaving) {
    oceanTail = lerp(oceanTail, width + width * 0.25, 0.022);
    oceanFront = width + width * 0.25;

    if (oceanTail > width + width * 0.12) {
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

  for (let i = 0; i < 520; i++) {
    stormBrushes.push({
      x: random(width * 1.35),
      y: random(height * 0.36, height),
      w: random(shorter * 0.012, shorter * 0.065),
      h: random(2, 8),
      speed: random(0.4, 1.8),
      noiseOffset: random(1000),
      colourPick: random(),
      layer: random(0.5, 1.35)
    });
  }
}

function createWaveRidges() {
  waveRidges = [];

  for (let i = 0; i < 18; i++) {
    waveRidges.push({
      baseY: map(i, 0, 17, height * 0.34, height * 0.96),
      phase: random(TWO_PI),
      speed: random(0.55, 1.45),
      scale: random(0.75, 1.3),
      curlChance: random()
    });
  }
}

function createSprayDrops() {
  sprayDrops = [];

  for (let i = 0; i < 190; i++) {
    sprayDrops.push({
      x: random(width * 1.35),
      y: random(height * 0.32, height * 0.72),
      size: random(1, 4),
      offset: random(1000),
      alpha: random(55, 160)
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
  let oceanBase = height * 0.45;

  drawingContext.moveTo(leftEdge, height);
  drawingContext.lineTo(leftEdge, height * 0.32);

  for (let x = leftEdge; x <= rightEdge; x += 18) {
    let edgeY = getStormTopEdge(x, oceanBase);
    drawingContext.lineTo(x, edgeY);
  }

  drawingContext.lineTo(rightEdge, height);
  drawingContext.closePath();
  drawingContext.clip();

  drawStormOcean(leftEdge, rightEdge);

  drawingContext.restore();
  pop();

  drawEnteringWaveEdge(rightEdge);
}

function getStormTopEdge(x, oceanBase) {
  let wildness = max(currentWildness, 0.18);
  let highReach = map(wildness, 0, 1, height * 0.08, height * 0.3);
  let rolling = sin(x * 0.012 + t * 2.4) * highReach * 0.35;
  let randomLift = noise(x * 0.006, t * 0.9) * highReach;
  return oceanBase - randomLift + rolling;
}

function drawStormOcean(leftEdge, rightEdge) {
  let wildness = max(currentWildness, stormLeaving ? 0.32 : 0.08);

  noStroke();
  fill(5, 18, 36, 225);
  rect(leftEdge - 4, height * 0.28, rightEdge - leftEdge + 8, height);

  drawStormBrushField(wildness, leftEdge, rightEdge);
  drawLayeredWaveLines(wildness, leftEdge, rightEdge);
  drawWaveCurls(wildness, leftEdge, rightEdge);
  drawStormFoam(wildness, leftEdge, rightEdge);
}

function drawStormBrushField(wildness, leftEdge, rightEdge) {
  rectMode(CENTER);
  noStroke();

  let speedMultiplier = map(wildness, 0, 1, 0.6, 2.3);
  let verticalMovement = map(wildness, 0, 1, 4, height * 0.055);

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    let depth = map(b.y, height * 0.32, height, 0, 1);
    let smoothWave = sin(b.x * 0.012 + t * (1.3 + wildness * 2.4) + b.noiseOffset);
    let localNoise = noise(b.x * 0.006, b.y * 0.01, t * 0.75) - 0.5;
    let yPush = (smoothWave * 0.65 + localNoise * 0.7) * verticalMovement * b.layer;

    b.x += b.speed * speedMultiplier;

    if (b.x > width * 1.35 + b.w) {
      b.x = -b.w;
      b.y = random(height * 0.32, height);
    }

    let c;
    if (b.colourPick < 0.45) {
      c = color(8, 34, 66, map(depth, 0, 1, 100, 190));
    } else if (b.colourPick < 0.82) {
      c = color(25, 78 + wildness * 14, 118 + wildness * 22, map(depth, 0, 1, 75, 165));
    } else {
      c = color(210, 220, 215, map(wildness, 0, 1, 28, 95));
    }

    fill(c);
    rect(b.x, b.y + yPush, b.w, b.h, b.h);
  }

  rectMode(CORNER);
}

function drawLayeredWaveLines(wildness, leftEdge, rightEdge) {
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);

  let lineCountBoost = int(map(wildness, 0, 1, 0, 7));
  let amp = map(wildness, 0, 1, height * 0.035, height * 0.15);
  let frequency = map(wildness, 0, 1, 0.006, 0.018);
  let speed = map(wildness, 0, 1, 1.1, 3.8);

  for (let i = 0; i < waveRidges.length; i++) {
    let ridge = waveRidges[i];
    let ridgeDepth = map(ridge.baseY, height * 0.32, height, 0, 1);
    let localAmp = amp * ridge.scale * map(ridgeDepth, 0, 1, 0.8, 1.3);
    let layers = 3 + lineCountBoost;

    for (let layer = 0; layer < layers; layer++) {
      let yOffset = layer * map(wildness, 0, 1, 8, 15);
      let alpha = map(layer, 0, layers - 1, 185, 55);
      stroke(236, 239, 224, alpha);
      strokeWeight(map(wildness, 0, 1, 1.1, 2.2));

      beginShape();
      for (let x = leftEdge - 30; x <= rightEdge + 40; x += 14) {
        let waveA = sin(x * frequency + t * speed * ridge.speed + ridge.phase) * localAmp;
        let waveB = sin(x * frequency * 1.9 - t * speed * 0.6 + ridge.phase) * localAmp * 0.34;
        let uneven = (noise(x * 0.005, ridge.baseY * 0.005, t * 0.45) - 0.5) * localAmp * 0.55;
        let y = ridge.baseY - waveA - waveB + uneven + yOffset;
        vertex(x, y);
      }
      endShape();
    }
  }
}

function drawWaveCurls(wildness, leftEdge, rightEdge) {
  if (wildness < 0.18) return;

  noFill();
  stroke(238, 241, 226, map(wildness, 0.18, 1, 80, 190));
  strokeWeight(map(wildness, 0.18, 1, 1.2, 2.5));
  strokeCap(ROUND);

  let curlCount = int(map(wildness, 0.18, 1, 5, 15));
  let spacing = max(70, width / curlCount);

  for (let i = 0; i < curlCount; i++) {
    let x = leftEdge + i * spacing + sin(t * 0.8 + i) * 40;
    if (x < leftEdge - 60 || x > rightEdge + 60) continue;

    let baseY = map(noise(i * 0.2, t * 0.25), 0, 1, height * 0.34, height * 0.78);
    let curlSize = map(wildness, 0, 1, height * 0.035, height * 0.105) * random(0.8, 1.25);

    push();
    translate(x, baseY);
    rotate(map(noise(i, t * 0.2), 0, 1, -0.35, 0.25));

    for (let ring = 0; ring < 4; ring++) {
      beginShape();
      for (let a = 0; a < TWO_PI * 1.35; a += 0.18) {
        let r = curlSize - ring * curlSize * 0.17 - a * curlSize * 0.08;
        if (r <= 1) continue;
        let px = cos(a) * r;
        let py = sin(a) * r;
        vertex(px, py);
      }
      endShape();
    }

    pop();
  }
}

function drawStormFoam(wildness, leftEdge, rightEdge) {
  if (wildness < 0.22) return;

  noStroke();
  fill(240, 242, 230, map(wildness, 0.22, 1, 45, 150));

  let visibleWidth = rightEdge - leftEdge;
  let dropsToDraw = int(map(wildness, 0.22, 1, 25, 150));

  for (let i = 0; i < dropsToDraw; i++) {
    let d = sprayDrops[i % sprayDrops.length];
    let x = leftEdge + ((d.x + t * 70 + i * 13) % max(visibleWidth, 1));
    let y = d.y + sin(t * 4 + d.offset) * 14 * wildness;
    circle(x, y, d.size * map(wildness, 0, 1, 0.6, 1.5));
  }
}

function drawEnteringWaveEdge(frontX) {
  if (frontX <= 0 || frontX >= width + width * 0.15 || stormLeaving) return;

  noFill();
  stroke(240, 242, 230, 120);
  strokeWeight(2.5);
  strokeCap(ROUND);

  beginShape();
  for (let y = height * 0.32; y <= height; y += 18) {
    let x = frontX + sin(y * 0.022 + t * 2.5) * 20;
    vertex(x, y);
  }
  endShape();
}

function drawMicDebug() {
  noStroke();
  fill(255, 225);
  textSize(14);

  if (!micStarted && !stormLeaving && oceanFront <= 1) {
    text("click START MIC to let layered waves enter", 30, 75);
  } else if (!micStarted) {
    text("mic off: storm waves exit to the right", 30, 75);
  } else {
    text("mic level: " + nf(rawMicLevel, 1, 4), 30, 75);
    text("wave intensity: " + nf(currentWildness, 1, 2), 30, 95);
  }
}

function resizeAudioMechanic() {
  createOceanBrushes();
  createWaveRidges();
  createSprayDrops();

  oceanFront = constrain(oceanFront, 0, width + width * 0.25);
  oceanTail = constrain(oceanTail, 0, width + width * 0.25);
}