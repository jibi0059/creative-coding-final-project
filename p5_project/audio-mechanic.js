let micButton;
let t = 0;

let mic;
let micStarted = false;
let rawMicLevel = 0;
let smoothedSound = 0;
let clapImpact = 0;

let currentIntensity = 5;
let targetIntensity = 5;
let stars = [];
let currentStarEnergy = 0.15;
let targetStarEnergy = 0.15;

function setupAudioMechanic() {

  mic = new p5.AudioIn();

  micButton = createButton("START MIC");
  micButton.position(30, 30);
  micButton.mousePressed(toggleMic);

  createStars();
}

function drawAudioMechanic() {
  background(8, 12, 28);

  updateSoundLevel();
  drawStars();
  drawMoon();
  drawOcean();
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
    });
  } else {
    mic.stop();
    micStarted = false;
    rawMicLevel = 0;
    smoothedSound = 0;
    clapImpact = 0;
    targetIntensity = 2;
    targetStarEnergy = 0.15;
    micButton.html("START MIC");
  }
}

function updateSoundLevel() {
  rawMicLevel = 0;

  if (micStarted) {
    rawMicLevel = mic.getLevel();
  }

  // Microphone values are usually tiny, so this boost makes claps visible.
  let boostedSound = constrain(rawMicLevel * 65, 0, 1);

  // Store sudden clap energy and let it fade out naturally.
  if (boostedSound > clapImpact) {
    clapImpact = boostedSound;
  }

  clapImpact *= 0.88;
  smoothedSound = lerp(smoothedSound, clapImpact, 0.35);
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
  circle(width * 0.5, height * 0.25, 90);

  // soft glow
  fill(230, 225, 190, 35);
  circle(width * 0.5, height * 0.25, 160);
  fill(230, 225, 190, 18);
  circle(width * 0.5, height * 0.25, 240);
}

function drawOcean() {
  if (micStarted) {
    targetIntensity = constrain(map(smoothedSound, 0, 1, 2, 90), 2, 90);
  } else {
    targetIntensity = 2;
  }

  currentIntensity = lerp(currentIntensity, targetIntensity, 0.12);
  let speed = map(currentIntensity, 2, 90, 0.005, 0.05);

  noStroke();

  for (let y = height * 0.45; y < height; y += 12) {
    beginShape();

    let alpha = map(y, height * 0.45, height, 90, 210);
    fill(20, 45, 75, alpha);

    vertex(0, height);

    for (let x = 0; x <= width; x += 20) {
      let wave =
        sin(x * 0.015 + t * 4 + y * 0.02) * currentIntensity +
        sin(x * 0.035 + t * 2) * currentIntensity * 0.35;

      let yy = y + wave;
      vertex(x, yy);
    }

    vertex(width, height);
    endShape(CLOSE);
  }

  drawMoonReflection(currentIntensity, speed);
}

function drawMoonReflection(intensity, speed) {
  let centerX = width * 0.5;

  for (let i = 0; i < 45; i++) {
    let y = height * 0.48 + i * 10;
    let spread = map(i, 0, 45, 20, 170);
    let shimmer = sin(t * 8 + i * 0.7) * intensity * 0.4;

    stroke(230, 225, 190, map(i, 0, 45, 130, 10));
    strokeWeight(map(i, 0, 45, 3, 1));

    let x1 = centerX - spread * 0.5 + shimmer;
    let x2 = centerX + spread * 0.5 + shimmer;

    line(x1, y, x2, y);
  }
}

function resizeAudioMechanic() {
  createStars();
}