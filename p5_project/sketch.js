

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Larry's audio mechanic
  if (typeof setupAudioMechanic === "function") {
    setupAudioMechanic();
  }

  // Perlin noise mechanic
  if (typeof setupPerlinMechanic === "function") {
    setupPerlinMechanic();
  }

  // Input mechanic
  if (typeof setupInputMechanic === "function") {
    setupInputMechanic();
  }

  // Time mechanic
  if (typeof setupTimeMechanic === "function") {
    setupTimeMechanic();
  }
}

function draw() {
  background(8, 12, 28);

  // Perlin noise mechanic
  if (typeof drawPerlinMechanic === "function") {
    drawPerlinMechanic();
  }

  // Input mechanic
  if (typeof drawInputMechanic === "function") {
    drawInputMechanic();
  }

  // Time mechanic
  if (typeof drawTimeMechanic === "function") {
    drawTimeMechanic();
  }

  // Larry's audio mechanic
  // Keep this near the end so audio reactions can sit on top visually if needed.
  if (typeof drawAudioMechanic === "function") {
    drawAudioMechanic();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Larry's audio mechanic
  if (typeof resizeAudioMechanic === "function") {
    resizeAudioMechanic();
  }

  // Perlin noise mechanic
  if (typeof resizePerlinMechanic === "function") {
    resizePerlinMechanic();
  }

  // Input mechanic
  if (typeof resizeInputMechanic === "function") {
    resizeInputMechanic();
  }

  // Time mechanic
  if (typeof resizeTimeMechanic === "function") {
    resizeTimeMechanic();
  }
}