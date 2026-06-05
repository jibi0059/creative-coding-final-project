let micButton;
let t = 0;

let mic;
let micStarted = false;
let rawMicLevel = 0;
let smoothedSound = 0;
let soundEnergy = 0;

let currentIntensity = 0.08;
let targetIntensity = 0.08;

let stars = [];
let currentStarEnergy = 0.15;
let targetStarEnergy = 0.15;

let waveLayers = [];
let oceanBrushes = [];
let foamBrushes = [];

function setup() {
  createCanvas(windowWidth, windowHeight);

  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(startMic);

  createStars();
  createOceanSystem();
}

function draw() {
  background(8, 12, 28);

  updateSoundLevel();
  drawStars();
  drawMoon();
  drawOcean();
  drawMicDebug();

  t += 0.01;
}

function startMic() {
  userStartAudio();
  getAudioContext().resume();

  mic.start(function() {
    micStarted = true;
    micButton.html("MIC ON — CLAP");

    for (let i = 0; i < waveLayers.length; i++) {
      waveLayers[i].targetEntrance = 1;
    }
  });
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  // Microphone values are tiny, so this makes voice/claps visible without making the waves twitchy.
  let boostedSound = constrain(rawMicLevel * 38, 0, 1);

  if (boostedSound > soundEnergy) {
    soundEnergy = boostedSound;
  }

  soundEnergy *= 0.91;
  smoothedSound = lerp(smoothedSound, soundEnergy, 0.11);

  if (micStarted) {
    targetIntensity = constrain(map(smoothedSound, 0, 1, 0.16, 0.95), 0.16, 0.95);
  } else {
    targetIntensity = 0.08;
  }

  currentIntensity = lerp(currentIntensity, targetIntensity, 0.06);
}

function drawMicDebug() {
  noStroke();
  fill(255, 180);
  textSize(14);

  if (!micStarted) {
    text("click START MIC, allow permission, then clap", 30, 75);
  } else {
    text("mic level: " + nf(rawMicLevel, 1, 4), 30, 75);
    text("visual energy: " + nf(smoothedSound, 1, 2), 30, 95);
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

  // soft glow
  fill(230, 225, 190, 35);
  circle(width * 0.5, height * 0.25, min(width, height) * 0.16);
  fill(230, 225, 190, 18);
  circle(width * 0.5, height * 0.25, min(width, height) * 0.24);
}

function createOceanSystem() {
  waveLayers = [];
  oceanBrushes = [];
  foamBrushes = [];

  let layerCount = 10;

  for (let i = 0; i < layerCount; i++) {
    let depth = i / (layerCount - 1);

    waveLayers.push({
      baseY: map(depth, 0, 1, height * 0.42, height * 0.94),
      baseAmp: map(depth, 0, 1, height * 0.025, height * 0.07) * random(0.85, 1.35),
      soundAmp: map(depth, 0, 1, height * 0.055, height * 0.16) * random(0.7, 1.45),
      wavelength: random(width * 0.32, width * 0.66),
      speed: random(0.45, 1.35),
      phase: random(TWO_PI),
      noiseScale: random(0.0018, 0.0045),
      entrance: 1,
      targetEntrance: 1,
      entranceDelay: i * 0.008 + random(0.002, 0.014),
      colourShift: random(),
      xOffset: random(-width * 0.2, width * 0.2)
    });
  }

  // Perlin-flow brushstrokes. This replaces the clean sine-wave look with a reconstructed-paint texture.
  for (let i = 0; i < 1800; i++) {
    oceanBrushes.push({
      x: random(width),
      y: random(height * 0.4, height),
      length: random(5, 20),
      weight: random(0.7, 2.1),
      speed: random(0.25, 1.7),
      layerIndex: floor(random(layerCount)),
      offset: random(1000),
      colourPick: random(),
      alpha: random(35, 140)
    });
  }

  for (let i = 0; i < 260; i++) {
    foamBrushes.push({
      x: random(width),
      y: random(height * 0.42, height),
      size: random(1, 5.5),
      layerIndex: floor(random(layerCount)),
      offset: random(1000),
      alpha: random(50, 170)
    });
  }
}

function drawOcean() {
  drawOceanBaseGradient();
  drawWaveBodies();
  drawFlowFieldBrushes();
  drawMoonReflection(currentIntensity);
  drawFoamBrushes();
}

function drawOceanBaseGradient() {
  let oceanTop = height * 0.42;

  noStroke();

  for (let y = oceanTop; y < height; y += 4) {
    let amt = map(y, oceanTop, height, 0, 1);
    let calmColour = color(13, 37, 61, 230);
    let deepColour = color(3, 13, 25, 245);
    let stormColour = color(4, 20 + currentIntensity * 20, 34 + currentIntensity * 32, 240);

    let c = lerpColor(lerpColor(calmColour, deepColour, amt), stormColour, currentIntensity * 0.75);
    fill(c);
    rect(0, y, width, 4);
  }
}

function drawWaveBodies() {
  for (let i = 0; i < waveLayers.length; i++) {
    let layer = waveLayers[i];
    layer.entrance = lerp(layer.entrance, layer.targetEntrance, layer.entranceDelay);
    drawSingleWaveLayer(layer, i);
  }
}

function drawSingleWaveLayer(layer, index) {
  let depth = index / max(waveLayers.length - 1, 1);
  let intensity = currentIntensity;

  let amp = layer.baseAmp + layer.soundAmp * intensity;
  let wavelength = layer.wavelength * map(intensity, 0, 1, 1.25, 0.86);
  let speed = layer.speed * map(intensity, 0, 1, 0.75, 1.55);

  let c;
  if (layer.colourShift < 0.38) {
    c = color(6, 28 + intensity * 22, 50 + intensity * 35, map(depth, 0, 1, 95, 205));
  } else if (layer.colourShift < 0.78) {
    c = color(12, 66 + intensity * 30, 88 + intensity * 45, map(depth, 0, 1, 75, 190));
  } else {
    // subtle terracotta warmth, inspired by the Perlin reconstruction reference
    c = color(120 + intensity * 50, 65 + intensity * 22, 35, map(depth, 0, 1, 35, 105));
  }

  noStroke();
  fill(c);

  beginShape();
  vertex(0, height + 40);

  for (let x = -40; x <= width + 40; x += 22) {
    let y = getWaveY(layer, x, amp, wavelength, speed, intensity);
    vertex(x, y);
  }

  vertex(width + 40, height + 40);
  endShape(CLOSE);

  if (intensity > 0.32) {
    drawCrestFoam(layer, amp, wavelength, speed, intensity);
  }
}

function getWaveY(layer, x, amp, wavelength, speed, intensity) {
  let travellingX = x + layer.xOffset + t * speed * width * 0.08;
  let main = sin((travellingX / wavelength) * TWO_PI + layer.phase) * amp;
  let secondary = sin((travellingX / (wavelength * 0.52)) * TWO_PI - layer.phase * 0.7) * amp * 0.26;
  let turbulent = (noise(travellingX * layer.noiseScale, layer.baseY * 0.006, t * speed * 0.35) - 0.5) * amp * 0.9;

  // Loud sound makes waves taller and more storm-like, not tighter like frequency bars.
  let peakLift = pow(max(0, main / max(amp, 1)), 2.5) * amp * intensity * 0.95;

  return layer.baseY - main - secondary - turbulent - peakLift;
}

function drawFlowFieldBrushes() {
  strokeCap(ROUND);

  for (let i = 0; i < oceanBrushes.length; i++) {
    let b = oceanBrushes[i];
    let layer = waveLayers[b.layerIndex];
    let fieldAngle = getFlowAngle(b.x, b.y, layer);

    let moveSpeed = b.speed * map(currentIntensity, 0, 1, 0.45, 2.1);

    b.x += cos(fieldAngle) * moveSpeed;
    b.y += sin(fieldAngle) * moveSpeed * 0.55;

    if (b.x > width + 30) {
      b.x = -30;
      b.y = random(height * 0.4, height);
    }

    if (b.y < height * 0.36) b.y = height + 20;
    if (b.y > height + 20) b.y = height * 0.4;

    stroke(getOceanBrushColour(b));
    strokeWeight(b.weight * map(currentIntensity, 0, 1, 0.75, 1.45));

    let dashLength = b.length * map(currentIntensity, 0, 1, 0.75, 1.55);
    let x2 = b.x + cos(fieldAngle) * dashLength;
    let y2 = b.y + sin(fieldAngle) * dashLength;

    line(b.x, b.y, x2, y2);
  }
}

function getFlowAngle(x, y, layer) {
  let waveDirection = sin((x / layer.wavelength) * TWO_PI + t * layer.speed + layer.phase);
  let noiseDirection = noise(x * 0.003, y * 0.004, t * 0.3) - 0.5;

  return waveDirection * 0.95 + noiseDirection * map(currentIntensity, 0, 1, 0.6, 1.5);
}

function getOceanBrushColour(b) {
  let alpha = b.alpha * map(currentIntensity, 0, 1, 0.65, 1.2);

  if (b.colourPick < 0.44) {
    return color(18, 74 + currentIntensity * 24, 86 + currentIntensity * 38, alpha);
  }

  if (b.colourPick < 0.76) {
    return color(4, 26, 40, alpha * 0.9);
  }

  if (b.colourPick < 0.93) {
    return color(150 + currentIntensity * 50, 78 + currentIntensity * 25, 35, alpha * 0.85);
  }

  return color(220, 220, 195, alpha * 0.9);
}

function drawCrestFoam(layer, amp, wavelength, speed, intensity) {
  noStroke();

  let foamAmount = int(map(intensity, 0.32, 1, 4, 18));

  for (let i = 0; i < foamAmount; i++) {
    let x = random(width);
    let y = getWaveY(layer, x, amp, wavelength, speed, intensity);

    if (y > layer.baseY - amp * 0.45) continue;

    fill(235, 232, 210, random(55, 135));
    ellipse(x, y + random(-4, 8), random(10, 34), random(2, 6));
  }
}

function drawFoamBrushes() {
  if (currentIntensity < 0.28) return;

  noStroke();

  let foamVisible = map(currentIntensity, 0.28, 1, 0.25, 1);
  let count = int(foamBrushes.length * foamVisible);

  for (let i = 0; i < count; i++) {
    let f = foamBrushes[i];
    let layer = waveLayers[f.layerIndex];
    let amp = layer.baseAmp + layer.soundAmp * currentIntensity;
    let wavelength = layer.wavelength * map(currentIntensity, 0, 1, 1.25, 0.86);
    let speed = layer.speed * map(currentIntensity, 0, 1, 0.75, 1.55);

    f.x += map(currentIntensity, 0, 1, 0.3, 2.1);
    if (f.x > width + 40) f.x = -40;

    let waveY = getWaveY(layer, f.x, amp, wavelength, speed, currentIntensity);
    let y = waveY + sin(t * 4 + f.offset) * 8;

    if (y > layer.baseY - amp * 0.18) continue;

    fill(235, 233, 214, f.alpha * foamVisible);
    circle(f.x, y, f.size * map(currentIntensity, 0, 1, 0.6, 1.55));
  }
}

function drawMoonReflection(intensity) {
  let centerX = width * 0.5;

  for (let i = 0; i < 45; i++) {
    let y = height * 0.48 + i * 10;
    let spread = map(i, 0, 45, 20, 170);
    let shimmer = sin(t * 8 + i * 0.7) * intensity * 45;

    stroke(230, 225, 190, map(i, 0, 45, 105, 5) * map(intensity, 0, 1, 0.75, 0.35));
    strokeWeight(map(i, 0, 45, 3, 1));

    let x1 = centerX - spread * 0.5 + shimmer;
    let x2 = centerX + spread * 0.5 + shimmer;

    line(x1, y, x2, y);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createStars();
  createOceanSystem();
}