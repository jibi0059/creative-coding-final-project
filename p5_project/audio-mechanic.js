let micButton;
let t = 0;

let mic;
let micStarted = false;
let rawMicLevel = 0;
let smoothedSound = 0;
let clapImpact = 0;

let oceanReveal = 0;
let targetOceanReveal = 0;
let currentWildness = 0;
let targetWildness = 0;

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
      targetOceanReveal = width;
    });
  } else {
    mic.stop();
    micStarted = false;
    rawMicLevel = 0;
    smoothedSound = 0;
    clapImpact = 0;
    targetWildness = 0;
    targetOceanReveal = 0;
    micButton.html("START MIC");
  }
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  // Microphone values are tiny, so this boost makes voice/claps visible.
  let boostedSound = constrain(rawMicLevel * 75, 0, 1);

  // Sudden sounds push the ocean harder, then slowly fade like water energy.
  if (boostedSound > clapImpact) {
    clapImpact = boostedSound;
  }

  clapImpact *= 0.91;
  smoothedSound = lerp(smoothedSound, clapImpact, 0.28);

  if (micStarted) {
    targetWildness = constrain(map(smoothedSound, 0, 1, 0.08, 1), 0.08, 1);
  } else {
    targetWildness = 0;
  }

  currentWildness = lerp(currentWildness, targetWildness, 0.08);
}

function updateOceanTransition() {
  // When mic turns on, the active ocean flows in from the left.
  // When mic turns off, it retreats back toward the left, revealing calm water again.
  oceanReveal = lerp(oceanReveal, targetOceanReveal, 0.035);

  if (abs(oceanReveal - targetOceanReveal) < 0.5) {
    oceanReveal = targetOceanReveal;
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
  if (oceanReveal <= 1) return;

  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, height * 0.45, oceanReveal, height * 0.55);
  drawingContext.clip();

  drawStormOcean();

  drawingContext.restore();
  pop();

  drawRevealEdge();
}

function drawStormOcean() {
  let oceanTop = height * 0.45;
  let wildness = currentWildness;

  noStroke();
  fill(7, 20, 38, 195 + wildness * 45);
  rect(0, oceanTop, width, height - oceanTop);

  drawStormWaveBodies(oceanTop, wildness);
  drawStormBrushField(oceanTop, wildness);
  drawBrokenReflection(oceanTop, wildness);
  drawFoamHighlights(oceanTop, wildness);
}

function drawStormWaveBodies(oceanTop, wildness) {
  noStroke();

  let amplitude = map(wildness, 0, 1, 10, height * 0.16);
  let frequency = map(wildness, 0, 1, 0.008, 0.035);
  let speed = map(wildness, 0, 1, 1.4, 8.5);

  for (let y = oceanTop; y < height; y += 14) {
    beginShape();

    let depth = map(y, oceanTop, height, 0, 1);
    let alpha = map(depth, 0, 1, 80, 210);
    fill(12, 42 + wildness * 20, 74 + wildness * 25, alpha);

    vertex(0, height);

    for (let x = 0; x <= width + 30; x += 18) {
      let noiseWave = noise(x * frequency, y * 0.01, t * speed) - 0.5;
      let sineWave = sin(x * frequency * 1.8 + t * speed + y * 0.02);
      let brokenWave = sin(x * frequency * 4.2 - t * speed * 1.3 + y * 0.035);

      let wave =
        noiseWave * amplitude * 1.8 +
        sineWave * amplitude * 0.6 +
        brokenWave * amplitude * wildness * 0.45;

      vertex(x, y + wave * map(depth, 0, 1, 0.45, 1.25));
    }

    vertex(width, height);
    endShape(CLOSE);
  }
}

function drawStormBrushField(oceanTop, wildness) {
  rectMode(CENTER);
  noStroke();

  let speedMultiplier = map(wildness, 0, 1, 0.8, 4.8);
  let verticalChaos = map(wildness, 0, 1, 8, height * 0.13);
  let rotationAmount = map(wildness, 0, 1, 0.03, 0.42);

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    let depth = map(b.y, oceanTop, height, 0, 1);
    let localNoise = noise(b.x * 0.01, b.y * 0.015, t * (1 + wildness * 4));
    let yPush = map(localNoise, 0, 1, -verticalChaos, verticalChaos) * b.layer;
    let xShake = sin(t * 14 + b.noiseOffset) * wildness * 10;

    b.x += b.speed * speedMultiplier;

    if (b.x > width + b.w) {
      b.x = -b.w;
      b.y = random(oceanTop, height);
    }

    let brushW = b.w * map(wildness, 0, 1, 0.8, 1.45);
    let brushH = b.h * map(wildness, 0, 1, 0.8, 1.8);
    let angle = sin(t * 5 + b.noiseOffset) * rotationAmount;

    let c;
    if (b.colourPick < 0.34) {
      c = color(8, 28, 55, map(depth, 0, 1, 80, 190));
    } else if (b.colourPick < 0.68) {
      c = color(20, 70 + wildness * 35, 110 + wildness * 45, map(depth, 0, 1, 55, 165));
    } else if (b.colourPick < 0.9) {
      c = color(76, 116, 138, map(depth, 0, 1, 40, 130));
    } else {
      c = color(225, 229, 208, map(wildness, 0, 1, 35, 155));
    }

    push();
    translate(b.x + xShake, b.y + yPush);
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
  if (wildness < 0.18) return;

  stroke(235, 238, 220, map(wildness, 0.18, 1, 35, 150));
  strokeWeight(map(wildness, 0.18, 1, 1, 3));
  noFill();

  let lines = int(map(wildness, 0.18, 1, 8, 34));

  for (let i = 0; i < lines; i++) {
    let y = random(oceanTop + 20, height - 10);
    let xStart = random(width);
    let length = random(width * 0.04, width * 0.18);

    beginShape();
    for (let x = 0; x < length; x += 12) {
      let yy = y + sin(x * 0.08 + t * 8 + i) * random(2, 10) * wildness;
      vertex(xStart + x, yy);
    }
    endShape();
  }
}

function drawRevealEdge() {
  if (oceanReveal <= 1 || oceanReveal >= width - 1) return;

  noStroke();
  for (let i = 0; i < 45; i++) {
    let alpha = map(i, 0, 45, 75, 0);
    fill(235, 238, 220, alpha);
    rect(oceanReveal - i, height * 0.45, 1, height * 0.55);
  }
}

function drawMicDebug() {
  noStroke();
  fill(255, 220);
  textSize(14);

  if (!micStarted && oceanReveal <= 1) {
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
  oceanReveal = constrain(oceanReveal, 0, width);
  targetOceanReveal = micStarted ? width : 0;
}