let micButton;
let t = 0;

let mic;
let micStarted = false;
let rawMicLevel = 0;
let smoothedSound = 0;
let soundEnergy = 0;
let currentIntensity = 0;
let targetIntensity = 0;

let waveLayers = [];
let brushParticles = [];
let foamParticles = [];

function setupAudioMechanic() {
  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(toggleMic);

  createStormSystem();
}

function drawAudioMechanic() {
  updateSoundLevel();
  drawStormBackground();
  updateAndDrawWaveLayers();
  updateAndDrawBrushParticles();
  updateAndDrawFoamParticles();
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

      // Each wave enters at its own timing, so it feels like individual waves arriving.
      for (let i = 0; i < waveLayers.length; i++) {
        waveLayers[i].targetEntrance = 1;
      }
    });
  } else {
    mic.stop();
    micStarted = false;
    rawMicLevel = 0;
    smoothedSound = 0;
    soundEnergy = 0;
    targetIntensity = 0;
    micButton.html("START MIC");

    // Each wave exits independently to the right.
    for (let i = 0; i < waveLayers.length; i++) {
      waveLayers[i].targetEntrance = 0;
      waveLayers[i].exitOffset = 0;
    }
  }
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  let boostedSound = constrain(rawMicLevel * 36, 0, 1);

  if (boostedSound > soundEnergy) {
    soundEnergy = boostedSound;
  }

  soundEnergy *= 0.91;
  smoothedSound = lerp(smoothedSound, soundEnergy, 0.11);

  if (micStarted) {
    targetIntensity = constrain(map(smoothedSound, 0, 1, 0.18, 0.95), 0.18, 0.95);
  } else {
    targetIntensity = 0.08;
  }

  currentIntensity = lerp(currentIntensity, targetIntensity, 0.06);
}

function createStormSystem() {
  waveLayers = [];
  brushParticles = [];
  foamParticles = [];

  let layerCount = 10;

  for (let i = 0; i < layerCount; i++) {
    let depth = i / (layerCount - 1);

    waveLayers.push({
      baseY: map(depth, 0, 1, height * 0.18, height * 0.9),
      baseAmp: map(depth, 0, 1, height * 0.06, height * 0.15) * random(0.75, 1.35),
      soundAmp: map(depth, 0, 1, height * 0.07, height * 0.18) * random(0.6, 1.4),
      wavelength: random(width * 0.36, width * 0.68),
      speed: random(0.45, 1.35),
      phase: random(TWO_PI),
      noiseScale: random(0.0018, 0.0045),
      entrance: 0,
      targetEntrance: 0,
      entranceDelay: i * 0.008 + random(0.002, 0.014),
      exitSpeed: random(0.012, 0.026),
      exitOffset: 0,
      colourShift: random(),
      xOffset: random(-width * 0.2, width * 0.2),
      thickness: random(0.85, 1.4)
    });
  }

  // Flow-field brush particles: short dashes travelling along the wave direction.
  for (let i = 0; i < 2600; i++) {
    brushParticles.push({
      x: random(width),
      y: random(height),
      length: random(5, 18),
      weight: random(0.7, 1.9),
      speed: random(0.35, 1.8),
      layerIndex: floor(random(layerCount)),
      offset: random(1000),
      colourPick: random(),
      alpha: random(45, 160)
    });
  }

  for (let i = 0; i < 360; i++) {
    foamParticles.push({
      x: random(width),
      y: random(height),
      size: random(1, 5.5),
      layerIndex: floor(random(layerCount)),
      offset: random(1000),
      alpha: random(60, 190)
    });
  }
}

function drawStormBackground() {
  // No calm-ocean layer behind the storm. This is the whole visual world.
  let topColour = color(3, 10, 18);
  let middleColour = color(6, 22, 34);
  let bottomColour = color(2, 7, 13);

  for (let y = 0; y < height; y += 3) {
    let amt = y / height;
    let c;

    if (amt < 0.5) {
      c = lerpColor(topColour, middleColour, amt * 2);
    } else {
      c = lerpColor(middleColour, bottomColour, (amt - 0.5) * 2);
    }

    stroke(c);
    strokeWeight(3);
    line(0, y, width, y);
  }
}

function updateAndDrawWaveLayers() {
  // Draw back waves first, front waves last.
  for (let i = 0; i < waveLayers.length; i++) {
    let layer = waveLayers[i];

    if (layer.targetEntrance === 1) {
      layer.entrance = lerp(layer.entrance, 1, layer.entranceDelay);
      layer.exitOffset = 0;
    } else {
      layer.exitOffset = lerp(layer.exitOffset, width * 1.35, layer.exitSpeed);
      if (layer.exitOffset > width * 1.15) {
        layer.entrance = 0;
      }
    }

    if (layer.entrance > 0.01 || layer.exitOffset < width * 1.1) {
      drawWaveBody(layer, i);
    }
  }
}

function drawWaveBody(layer, index) {
  let depth = index / max(waveLayers.length - 1, 1);
  let intensity = max(currentIntensity, layer.targetEntrance === 1 ? 0.14 : 0.08);
  let entranceWidth = width * layer.entrance;
  let startX = -width * 0.15 + layer.exitOffset;
  let endX = startX + entranceWidth + width * 0.28;

  if (endX < 0 || startX > width) return;

  let amp = layer.baseAmp + layer.soundAmp * intensity;
  let wavelength = layer.wavelength * map(intensity, 0, 1, 1.25, 0.86);
  let speed = layer.speed * map(intensity, 0, 1, 0.75, 1.55);

  let c;
  if (layer.colourShift < 0.4) {
    c = color(5, 26 + intensity * 20, 42 + intensity * 35, map(depth, 0, 1, 120, 225));
  } else if (layer.colourShift < 0.75) {
    c = color(10, 58 + intensity * 30, 72 + intensity * 50, map(depth, 0, 1, 95, 210));
  } else {
    c = color(80 + intensity * 40, 44 + intensity * 16, 23, map(depth, 0, 1, 70, 160));
  }

  noStroke();
  fill(c);

  beginShape();
  vertex(startX, height + 40);

  for (let x = startX; x <= endX; x += 22) {
    let y = getWaveY(layer, x, amp, wavelength, speed, intensity);
    vertex(x, y);
  }

  vertex(endX, height + 40);
  endShape(CLOSE);

  // Subtle crest highlight only, not white contour lines.
  if (intensity > 0.32) {
    drawCrestFoam(layer, startX, endX, amp, wavelength, speed, intensity);
  }
}

function getWaveY(layer, x, amp, wavelength, speed, intensity) {
  let travellingX = x + layer.xOffset + t * speed * width * 0.08;
  let main = sin((travellingX / wavelength) * TWO_PI + layer.phase) * amp;
  let secondary = sin((travellingX / (wavelength * 0.52)) * TWO_PI - layer.phase * 0.7) * amp * 0.26;
  let turbulent = (noise(travellingX * layer.noiseScale, layer.baseY * 0.006, t * speed * 0.35) - 0.5) * amp * 0.9;

  // Thunderstorm waves should become taller and more jagged, not tighter/frequent like voice frequency.
  let peakOnly = pow(max(0, main / max(amp, 1)), 2.5) * amp * intensity * 0.95;

  return layer.baseY - main - secondary - turbulent - peakOnly;
}

function drawCrestFoam(layer, startX, endX, amp, wavelength, speed, intensity) {
  noStroke();

  let foamAmount = int(map(intensity, 0.32, 1, 5, 22));

  for (let i = 0; i < foamAmount; i++) {
    let x = random(startX, endX);
    let y = getWaveY(layer, x, amp, wavelength, speed, intensity);

    // Only draw foam on high parts of the wave.
    if (y > layer.baseY - amp * 0.45) continue;

    fill(235, 232, 210, random(70, 155));
    ellipse(x, y + random(-4, 8), random(12, 40), random(2, 7));
  }
}

function updateAndDrawBrushParticles() {
  strokeCap(ROUND);

  for (let i = 0; i < brushParticles.length; i++) {
    let p = brushParticles[i];
    let layer = waveLayers[p.layerIndex];

    // Hide particles belonging to waves that have not entered yet.
    if (p.x > width * layer.entrance + 80 && layer.targetEntrance === 1) continue;

    let fieldAngle = getFlowAngle(p.x, p.y, layer);
    let intensity = max(currentIntensity, 0.08);
    let moveSpeed = p.speed * map(intensity, 0, 1, 0.45, 2.1);

    p.x += cos(fieldAngle) * moveSpeed;
    p.y += sin(fieldAngle) * moveSpeed * 0.55;

    // During mic off, particles drift right with the leaving waves.
    if (!micStarted) {
      p.x += moveSpeed * 1.2;
    }

    if (p.x > width + 30) {
      p.x = -30;
      p.y = random(height);
    }
    if (p.y < -20) p.y = height + 20;
    if (p.y > height + 20) p.y = -20;

    let c = getBrushColour(p, intensity);
    stroke(c);
    strokeWeight(p.weight * map(intensity, 0, 1, 0.7, 1.35));

    let dashLength = p.length * map(intensity, 0, 1, 0.75, 1.45);
    let x2 = p.x + cos(fieldAngle) * dashLength;
    let y2 = p.y + sin(fieldAngle) * dashLength;

    line(p.x, p.y, x2, y2);
  }
}

function getFlowAngle(x, y, layer) {
  let intensity = max(currentIntensity, 0.08);
  let waveDirection = sin((x / layer.wavelength) * TWO_PI + t * layer.speed + layer.phase);
  let noiseDirection = noise(x * 0.003, y * 0.004, t * 0.3) - 0.5;

  // Mostly horizontal flow, bent upward/downward by the invisible wave field.
  return waveDirection * 0.95 + noiseDirection * map(intensity, 0, 1, 0.6, 1.5);
}

function getBrushColour(p, intensity) {
  let alpha = p.alpha * map(intensity, 0, 1, 0.65, 1.2);

  if (p.colourPick < 0.44) {
    return color(18, 74 + intensity * 24, 86 + intensity * 38, alpha);
  }

  if (p.colourPick < 0.76) {
    return color(4, 26, 40, alpha * 0.9);
  }

  if (p.colourPick < 0.93) {
    return color(150 + intensity * 50, 78 + intensity * 25, 35, alpha * 0.85);
  }

  return color(220, 220, 195, alpha * 0.9);
}

function updateAndDrawFoamParticles() {
  if (currentIntensity < 0.28) return;

  noStroke();

  let foamVisible = map(currentIntensity, 0.28, 1, 0.25, 1);
  let count = int(foamParticles.length * foamVisible);

  for (let i = 0; i < count; i++) {
    let f = foamParticles[i];
    let layer = waveLayers[f.layerIndex];
    let amp = layer.baseAmp + layer.soundAmp * currentIntensity;
    let wavelength = layer.wavelength * map(currentIntensity, 0, 1, 1.25, 0.86);
    let speed = layer.speed * map(currentIntensity, 0, 1, 0.75, 1.55);

    f.x += map(currentIntensity, 0, 1, 0.3, 2.1);
    if (!micStarted) f.x += 2.2;
    if (f.x > width + 40) f.x = -40;

    let waveY = getWaveY(layer, f.x, amp, wavelength, speed, currentIntensity);
    let y = waveY + sin(t * 4 + f.offset) * 8;

    // Foam sits on upper ridges, not randomly everywhere.
    if (y > layer.baseY - amp * 0.18) continue;

    fill(235, 233, 214, f.alpha * foamVisible);
    circle(f.x, y, f.size * map(currentIntensity, 0, 1, 0.6, 1.55));
  }
}

function drawMicDebug() {
  noStroke();
  fill(255, 225);
  textSize(14);

  if (!micStarted) {
    text("click START MIC to activate storm flow field", 30, 75);
  } else {
    text("mic level: " + nf(rawMicLevel, 1, 4), 30, 75);
    text("storm intensity: " + nf(currentIntensity, 1, 2), 30, 95);
  }
}

function resizeAudioMechanic() {
  createStormSystem();
}