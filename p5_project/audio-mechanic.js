let micButton;
let t = 0;

let mic;
let micStarted = false;
let rawMicLevel = 0;
let smoothedSound = 0;
let soundEnergy = 0;

let oceanFront = 0;
let oceanTail = 0;
let stormLeaving = false;

let currentIntensity = 0.08;
let targetIntensity = 0.08;

let stars = [];
let currentStarEnergy = 0.15;
let targetStarEnergy = 0.15;

let calmBrushes = [];
let stormBrushes = [];
let stormWaveLayers = [];
let foamBrushes = [];

function setupAudioMechanic() {
  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(toggleMic);

  createStars();
  createCalmOceanBrushes();
  createStormOceanSystem();
}

function drawAudioMechanic() {
  background(8, 12, 28);

  updateSoundLevel();
  updateOceanTransition();

  drawStars();
  drawMoon();
  drawCalmOcean();
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
      oceanTail = 0;
      oceanFront = max(oceanFront, width * 0.03);
    });
  } else {
    mic.stop();
    micStarted = false;
    rawMicLevel = 0;
    smoothedSound = 0;
    soundEnergy = 0;
    targetIntensity = 0.08;
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
    targetIntensity = constrain(map(smoothedSound, 0, 1, 0.12, 0.92), 0.12, 0.92);
  } else {
    targetIntensity = 0.08;
  }

  currentIntensity = lerp(currentIntensity, targetIntensity, 0.075);
}

function updateOceanTransition() {
  if (micStarted) {
    // Mic on: the storm ocean grows from the left and covers the calm ocean.
    oceanFront = lerp(oceanFront, width + width * 0.25, 0.018);
    oceanTail = 0;
  } else if (stormLeaving) {
    // Mic off: the storm ocean keeps flowing to the right and leaves the calm ocean behind.
    oceanTail = lerp(oceanTail, width + width * 0.25, 0.022);
    oceanFront = width + width * 0.25;

    if (oceanTail > width + width * 0.12) {
      stormLeaving = false;
      oceanFront = 0;
      oceanTail = 0;
      currentIntensity = 0.08;
    }
  }
}

function drawMicDebug() {
  noStroke();
  fill(255, 180);
  textSize(14);

  if (!micStarted && !stormLeaving) {
    text("click START MIC, allow permission, then clap", 30, 75);
  } else if (!micStarted && stormLeaving) {
    text("mic off: storm waves leaving to the right", 30, 75);
  } else {
    text("mic level: " + nf(rawMicLevel, 1, 4), 30, 75);
    text("wave energy: " + nf(currentIntensity, 1, 2), 30, 95);
  }
}

function createStars() {
  stars = [];

  for (let i = 0; i < 90; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.05, height * 0.42),
      size: random(1, 3),
      blinkSpeed: random(0.02, 0.08),
      growSpeed: random(0.01, 0.04),
      offset: random(TWO_PI),
      growOffset: random(TWO_PI)
    });
  }
}

function drawStars() {
  if (micStarted) {
    targetStarEnergy = constrain(map(smoothedSound, 0, 1, 0.15, 1.0), 0.15, 1.0);
  } else {
    targetStarEnergy = 0.15;
  }

  currentStarEnergy = lerp(currentStarEnergy, targetStarEnergy, 0.08);

  noStroke();

  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];

    let blink = sin(frameCount * star.blinkSpeed * (1 + currentStarEnergy * 4) + star.offset);
    let grow = sin(frameCount * star.growSpeed + star.growOffset);

    let brightness = map(blink, -1, 1, 35, 180 + currentStarEnergy * 75);
    let randomGrowth = map(grow, -1, 1, 0.6, 1.8);
    let starCoreSize = star.size * randomGrowth + currentStarEnergy * 1.2;
    let glowRadius = starCoreSize * (2.4 + currentStarEnergy * 2.8);

    fill(255, 255, 255, brightness * 0.18);
    circle(star.x, star.y, glowRadius);

    fill(255, 255, 255, brightness);
    circle(star.x, star.y, starCoreSize);
  }
}

function drawMoon() {
  noStroke();
  fill(230, 225, 190);
  circle(width * 0.5, height * 0.25, min(width, height) * 0.09);

  fill(230, 225, 190, 35);
  circle(width * 0.5, height * 0.25, min(width, height) * 0.16);

  fill(230, 225, 190, 18);
  circle(width * 0.5, height * 0.25, min(width, height) * 0.24);
}

function createCalmOceanBrushes() {
  calmBrushes = [];

  let oceanTop = height * 0.45;
  let shorter = min(width, height);

  for (let i = 0; i < 520; i++) {
    calmBrushes.push({
      x: random(width),
      y: random(oceanTop, height),
      w: random(shorter * 0.012, shorter * 0.055),
      h: random(2, 7),
      speed: random(0.12, 0.42),
      noiseOffset: random(1000),
      colourPick: random()
    });
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
      baseY: map(depth, 0, 1, height * 0.36, height * 0.94),
      baseAmp: map(depth, 0, 1, height * 0.035, height * 0.085) * random(0.8, 1.35),
      soundAmp: map(depth, 0, 1, height * 0.065, height * 0.17) * random(0.7, 1.45),
      wavelength: random(width * 0.28, width * 0.56),
      speed: random(0.55, 1.55),
      phase: random(TWO_PI),
      noiseScale: random(0.0022, 0.006),
      noiseStrength: random(0.35, 0.95),
      colourType: random(),
      xDrift: random(-width * 0.12, width * 0.12)
    });
  }

  for (let i = 0; i < 520; i++) {
    stormBrushes.push({
      x: random(width * 1.35),
      y: random(height * 0.34, height),
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

function drawCalmOcean() {
  let oceanTop = height * 0.45;

  noStroke();
  fill(14, 35, 62, 235);
  rect(0, oceanTop, width, height - oceanTop);

  drawCalmWaveBands(oceanTop);
  drawCalmBrushField(oceanTop);
  drawMoonReflection(oceanTop, 0.12);
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

function drawStormOceanLayer() {
  if (oceanFront <= 1 && !stormLeaving) return;

  push();
  drawingContext.save();
  drawingContext.beginPath();

  let leftEdge = oceanTail;
  let rightEdge = oceanFront;

  // The mask only controls where the storm ocean appears. The storm itself is made of individual wave layers.
  drawingContext.rect(leftEdge, height * 0.28, rightEdge - leftEdge, height * 0.72);
  drawingContext.clip();

  drawStormBase(leftEdge, rightEdge);
  drawStormBrushField(leftEdge, rightEdge);

  for (let i = 0; i < stormWaveLayers.length; i++) {
    drawSingleStormWave(stormWaveLayers[i], i, leftEdge, rightEdge);
  }

  drawFoamBrushes(leftEdge, rightEdge);
  drawMoonReflection(height * 0.42, currentIntensity);

  drawingContext.restore();
  pop();
}

function drawStormBase(leftEdge, rightEdge) {
  noStroke();
  fill(5, 18, 36, 218);
  rect(leftEdge - 2, height * 0.28, rightEdge - leftEdge + 4, height * 0.72);
}

function drawStormBrushField(leftEdge, rightEdge) {
  rectMode(CENTER);
  noStroke();

  let speedMultiplier = map(currentIntensity, 0, 1, 0.45, 2.0);
  let verticalMovement = map(currentIntensity, 0, 1, 3, height * 0.04);

  for (let i = 0; i < stormBrushes.length; i++) {
    let b = stormBrushes[i];
    let depth = map(b.y, height * 0.34, height, 0, 1);
    let smoothWave = sin(b.x * 0.012 + t * (1.1 + currentIntensity * 2.0) + b.noiseOffset);
    let yPush = smoothWave * verticalMovement * b.layer;

    b.x += b.speed * speedMultiplier;

    if (b.x > width * 1.35 + b.w) {
      b.x = -b.w;
      b.y = random(height * 0.34, height);
    }

    let c;
    if (b.colourPick < 0.45) {
      c = color(8, 34, 66, map(depth, 0, 1, 80, 175));
    } else if (b.colourPick < 0.82) {
      c = color(22, 72 + currentIntensity * 18, 108 + currentIntensity * 28, map(depth, 0, 1, 55, 145));
    } else {
      c = color(190, 205, 198, map(currentIntensity, 0, 1, 18, 72));
    }

    fill(c);
    rect(b.x, b.y + yPush, b.w, b.h, b.h);
  }

  rectMode(CORNER);
}

function drawSingleStormWave(layer, index, leftEdge, rightEdge) {
  let depth = index / max(stormWaveLayers.length - 1, 1);
  let amp = layer.baseAmp + layer.soundAmp * currentIntensity;
  let speed = layer.speed * map(currentIntensity, 0, 1, 0.8, 1.95);
  let wavelength = layer.wavelength * map(currentIntensity, 0, 1, 1.16, 0.82);
  let localOffset = layer.xDrift + t * speed * width * 0.035;

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
  let mainWave = sin((x / wavelength) * TWO_PI + layer.phase + t * speed) * amp;
  let secondWave = sin((x / (wavelength * 0.47)) * TWO_PI - layer.phase + t * speed * 0.62) * amp * 0.26;
  let randomWave = (noise(x * layer.noiseScale, layer.baseY * 0.005, t * 0.28 * speed) - 0.5) * amp * layer.noiseStrength;

  // Louder sound makes waves taller and more violent, not visually tighter.
  let peakLift = pow(max(0, mainWave / max(amp, 1)), 2.25) * amp * currentIntensity * 0.85;

  return layer.baseY - mainWave - secondWave - randomWave - peakLift;
}

function drawStormCrestFoam(layer, amp, wavelength, speed, leftEdge, rightEdge, localOffset) {
  if (currentIntensity < 0.22) return;

  noStroke();

  let foamAmount = int(map(currentIntensity, 0.22, 1, 3, 16));

  for (let i = 0; i < foamAmount; i++) {
    let x = random(leftEdge, rightEdge);
    let y = getStormWaveY(layer, x + localOffset, amp, wavelength, speed);

    if (y > layer.baseY - amp * 0.45) continue;

    fill(235, 232, 210, random(45, 130));
    ellipse(x, y + random(-4, 8), random(10, 32), random(2, 6));
  }
}

function drawFoamBrushes(leftEdge, rightEdge) {
  if (currentIntensity < 0.26) return;

  rectMode(CENTER);
  noStroke();

  let visibleWidth = max(rightEdge - leftEdge, 1);
  let foamCount = int(map(currentIntensity, 0.26, 1, 25, 130));

  for (let i = 0; i < foamCount; i++) {
    let f = foamBrushes[i % foamBrushes.length];
    let layer = stormWaveLayers[f.layerIndex % stormWaveLayers.length];

    let amp = layer.baseAmp + layer.soundAmp * currentIntensity;
    let speed = layer.speed * map(currentIntensity, 0, 1, 0.8, 1.95);
    let wavelength = layer.wavelength * map(currentIntensity, 0, 1, 1.16, 0.82);
    let x = leftEdge + ((f.xRatio * width + t * 42 + i * 17) % visibleWidth);
    let y = getStormWaveY(layer, x, amp, wavelength, speed) + random(-4, 12);

    fill(230, 236, 224, f.alpha * map(currentIntensity, 0.26, 1, 0.45, 1.25));
    rect(x, y, f.size * random(1.3, 3.5), f.size * random(0.35, 0.75), f.size);
  }

  rectMode(CORNER);
}

function drawMoonReflection(oceanTop, intensity) {
  let centerX = width * 0.5;

  for (let i = 0; i < 45; i++) {
    let y = oceanTop + 18 + i * 10;
    let spread = map(i, 0, 45, 20, 170);
    let shimmer = sin(t * 8 + i * 0.7) * intensity * 50;

    stroke(230, 225, 190, map(i, 0, 45, 105, 5) * map(intensity, 0, 1, 0.8, 0.38));
    strokeWeight(map(i, 0, 45, 3, 1));

    let x1 = centerX - spread * 0.5 + shimmer;
    let x2 = centerX + spread * 0.5 + shimmer;

    line(x1, y, x2, y);
  }
}

function resizeAudioMechanic() {
  createStars();
  createCalmOceanBrushes();
  createStormOceanSystem();
  oceanFront = constrain(oceanFront, 0, width + width * 0.25);
  oceanTail = constrain(oceanTail, 0, width + width * 0.25);
}