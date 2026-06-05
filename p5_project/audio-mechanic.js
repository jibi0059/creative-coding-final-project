let micButton;
let t = 0;

let mic;
let micStarted = false;
let rawMicLevel = 0;
let smoothedSound = 0;
let clapImpact = 0;

let oceanFront = 0;
let targetOceanFront = 0;
let currentWildness = 0;
let targetWildness = 0;
let stormExitOffset = 0;
let stormEntering = false;
let stormLeaving = false;

let calmBrushes = [];
let stormBrushes = [];

function setupAudioMechanic() {
  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(toggleMic);

  createOceanBrushes();
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
      targetOceanFront = width + width * 0.18;
      stormEntering = true;
      stormLeaving = false;
      stormExitOffset = 0;
    });
  } else {
    mic.stop();
    micStarted = false;
    rawMicLevel = 0;
    smoothedSound = 0;
    clapImpact = 0;
    targetWildness = 0;
    targetOceanFront = width + width * 0.22;
    stormEntering = false;
    stormLeaving = true;
    micButton.html("START MIC");
  }
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  // Microphone values are tiny, so this boost makes voice/claps visible.
  let boostedSound = constrain(rawMicLevel * 48, 0, 1);

  // Sudden sounds push the ocean harder, then slowly fade like water energy.
  if (boostedSound > clapImpact) {
    clapImpact = boostedSound;
  }

  clapImpact *= 0.88;
  smoothedSound = lerp(smoothedSound, clapImpact, 0.16);

  if (micStarted) {
    targetWildness = constrain(map(smoothedSound, 0, 1, 0.06, 0.82), 0.06, 0.82);
  } else {
    targetWildness = 0;
  }

  currentWildness = lerp(currentWildness, targetWildness, 0.08);
}

function updateOceanTransition() {
  // The storm ocean now behaves like moving water instead of a hard light mask.
  // Mic on: a wave front enters from the left.
  // Mic off: the storm water keeps travelling and exits toward the right.
  if (micStarted) {
    oceanFront = lerp(oceanFront, targetOceanFront, 0.018);
    stormExitOffset = 0;
  } else if (stormLeaving) {
    stormExitOffset = lerp(stormExitOffset, width + width * 0.35, 0.025);

    if (stormExitOffset > width + width * 0.25) {
      stormLeaving = false;
      oceanFront = 0;
      stormExitOffset = 0;
    }
  }
}

function drawCalmPainting() {
  // Soft night sky background, kept simple so the ocean remains the focus.
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

  for (let i = 0; i < 420; i++) {
    calmBrushes.push({
      x: random(width),
      y: random(oceanTop, height),
      w: random(shorter * 0.015, shorter * 0.055),
      h: random(2, 7),
      speed: random(0.15, 0.55),
      noiseOffset: random(1000),
      colourPick: random()
    });
  }

  for (let i = 0; i < 620; i++) {
    stormBrushes.push({
      x: random(width),
      y: random(oceanTop, height),
      w: random(shorter * 0.012, shorter * 0.07),
      h: random(2, 9),
      speed: random(0.6, 2.4),
      noiseOffset: random(1000),
      colourPick: random(),
      layer: random(0.4, 1.4)
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

  let oceanBase = height * 0.45;
  let stormReach = height * 0.22;
  let visibleFront = oceanFront - stormExitOffset;

  drawingContext.moveTo(-width * 0.2 - stormExitOffset, height);
  drawingContext.lineTo(-width * 0.2 - stormExitOffset, oceanBase + 20);

  for (let x = -width * 0.2; x <= visibleFront; x += 24) {
    let waveEdge = sin(x * 0.018 + t * 3.2) * 22;
    let noiseEdge = (noise(x * 0.008, t * 0.8) - 0.5) * 42;
    let edgeY = oceanBase + waveEdge + noiseEdge;
    drawingContext.lineTo(x - stormExitOffset, edgeY);
  }

  drawingContext.lineTo(visibleFront - stormExitOffset, height);
  drawingContext.closePath();
  drawingContext.clip();

  translate(-stormExitOffset, 0);
  drawStormOcean();

  drawingContext.restore();
  pop();

  drawWaveFrontEdge(visibleFront - stormExitOffset);
}

function drawStormOcean() {
  let oceanTop = height * 0.38;
  let oceanBase = height * 0.45;
  let wildness = currentWildness;

  noStroke();
  fill(8, 25, 46, 160 + wildness * 55);
  rect(0, oceanTop, width + width * 0.35, height - oceanTop);

  drawStormWaveBodies(oceanTop, oceanBase, wildness);
  drawStormBrushField(oceanTop, wildness);
  drawBrokenReflection(oceanBase, wildness);
  drawFoamHighlights(oceanTop, wildness);
}

function drawStormWaveBodies(oceanTop, oceanBase, wildness) {
  noStroke();

  let amplitude = map(wildness, 0, 1, 14, height * 0.11);
  let frequency = map(wildness, 0, 1, 0.007, 0.022);
  let speed = map(wildness, 0, 1, 1.2, 5.2);

  for (let y = oceanBase - height * 0.03; y < height; y += 18) {
    beginShape();

    let depth = map(y, oceanBase, height, 0, 1);
    let alpha = map(depth, 0, 1, 95, 215);
    fill(12, 48 + wildness * 18, 82 + wildness * 22, alpha);

    vertex(0, height);

    for (let x = -40; x <= width + width * 0.4; x += 20) {
      let primaryWave = sin(x * frequency + t * speed + y * 0.012);
      let secondaryWave = sin(x * frequency * 1.7 - t * speed * 0.8 + y * 0.018);
      let naturalNoise = noise(x * frequency * 0.7, y * 0.006, t * speed * 0.25) - 0.5;

      let wave =
        primaryWave * amplitude * 0.9 +
        secondaryWave * amplitude * 0.35 +
        naturalNoise * amplitude * 0.75;

      let verticalScale = map(depth, 0, 1, 0.55, 1.18);
      let yy = y + wave * verticalScale;

      vertex(x, yy);
    }

    vertex(width + width * 0.4, height);
    endShape(CLOSE);
  }
}

function drawStormBrushField(oceanTop, wildness) {
  rectMode(CENTER);
  noStroke();

  let speedMultiplier = map(wildness, 0, 1, 0.7, 2.8);
  let verticalMovement = map(wildness, 0, 1, 6, height * 0.07);
  let rotationAmount = map(wildness, 0, 1, 0.02, 0.18);

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    let depth = map(b.y, oceanTop, height, 0, 1);
    let smoothWave = sin(b.x * 0.012 + t * (1.5 + wildness * 3.5) + b.noiseOffset);
    let localNoise = noise(b.x * 0.006, b.y * 0.01, t * (0.4 + wildness * 1.8)) - 0.5;
    let yPush = (smoothWave * 0.65 + localNoise * 0.7) * verticalMovement * b.layer;
    let xDrift = sin(t * 4 + b.noiseOffset) * wildness * 5;

    b.x += b.speed * speedMultiplier;

    if (b.x > width + width * 0.4 + b.w) {
      b.x = -b.w;
      b.y = random(height * 0.38, height);
    }

    let brushW = b.w * map(wildness, 0, 1, 0.85, 1.25);
    let brushH = b.h * map(wildness, 0, 1, 0.85, 1.35);
    let angle = sin(t * 2.4 + b.noiseOffset) * rotationAmount;

    let c;
    if (b.colourPick < 0.38) {
      c = color(9, 34, 62, map(depth, 0, 1, 85, 175));
    } else if (b.colourPick < 0.72) {
      c = color(24, 76 + wildness * 18, 112 + wildness * 22, map(depth, 0, 1, 55, 145));
    } else if (b.colourPick < 0.9) {
      c = color(82, 124, 145, map(depth, 0, 1, 35, 105));
    } else {
      c = color(225, 229, 208, map(wildness, 0, 1, 25, 115));
    }

    push();
    translate(b.x + xDrift, b.y + yPush);
    rotate(angle);
    fill(c);
    rect(0, 0, brushW, brushH, brushH);
    pop();
  }

  rectMode(CORNER);
}

function drawBrokenReflection(oceanTop, wildness) {
  let centerX = width * 0.52;
  rectMode(CENTER);
  noStroke();

  for (let i = 0; i < 55; i++) {
    let y = oceanTop + 12 + i * 10;
    let depth = map(y, oceanTop, height, 0, 1);
    let spread = map(i, 0, 55, width * 0.03, width * 0.28);
    let shake = sin(t * 9 + i) * wildness * 35;
    let brokenPieces = int(map(wildness, 0, 1, 1, 5));

    for (let j = 0; j < brokenPieces; j++) {
      let pieceX = centerX + random(-spread * 0.5, spread * 0.5) + shake;
      let pieceW = spread / brokenPieces * random(0.35, 0.9);

      fill(230, 225, 190, map(depth, 0, 1, 90, 5) * map(wildness, 0, 1, 0.7, 1.4));
      rect(pieceX, y + random(-3, 3) * wildness, pieceW, random(1.5, 4.5), 3);
    }
  }

  rectMode(CORNER);
}

function drawFoamHighlights(oceanTop, wildness) {
  if (wildness < 0.2) return;

  stroke(235, 238, 220, map(wildness, 0.2, 1, 25, 115));
  strokeWeight(map(wildness, 0.2, 1, 1, 2.2));
  noFill();

  let lines = int(map(wildness, 0.2, 1, 6, 20));

  for (let i = 0; i < lines; i++) {
    let y = random(height * 0.39, height - 10);
    let xStart = random(width + width * 0.35);
    let length = random(width * 0.06, width * 0.16);

    beginShape();
    for (let x = 0; x < length; x += 14) {
      let yy = y + sin(x * 0.065 + t * 4.5 + i) * random(1.5, 5.5) * wildness;
      vertex(xStart + x, yy);
    }
    endShape();
  }
}

function drawWaveFrontEdge(frontX) {
  if (frontX <= -20 || frontX >= width + 40) return;

  let oceanBase = height * 0.45;
  noFill();
  stroke(225, 229, 208, 70);
  strokeWeight(2);

  beginShape();
  for (let x = frontX - width * 0.16; x <= frontX + 16; x += 14) {
    let edgeY = oceanBase + sin(x * 0.018 + t * 3.2) * 18 + (noise(x * 0.008, t * 0.8) - 0.5) * 35;
    vertex(x, edgeY);
  }
  endShape();
}

function drawMicDebug() {
  noStroke();
  fill(255, 220);
  textSize(14);

  if (!micStarted && !stormLeaving && oceanFront <= 1) {
    text("click START MIC to let the storm ocean enter", 30, 75);
  } else if (!micStarted) {
    text("mic off: storm layer is leaving the painting", 30, 75);
  } else {
    text("mic level: " + nf(rawMicLevel, 1, 4), 30, 75);
    text("ocean wildness: " + nf(currentWildness, 1, 2), 30, 95);
  }
}

function resizeAudioMechanic() {
  createOceanBrushes();
  oceanFront = constrain(oceanFront, 0, width + width * 0.18);
  targetOceanFront = micStarted ? width + width * 0.18 : 0;
}