let mechanicToggles = {
  environment: true,
  audio: true,
  perlin: true,
  input: true,
  time: true
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupMechanicToggles();

  // Environment mechanic: moon + calm sea preview layer
  if (typeof setupEnvironmentMechanic === "function") {
    setupEnvironmentMechanic();
  }

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

  // Environment mechanic: draw first so other mechanics can sit on top
  if (mechanicToggles.environment && typeof drawEnvironmentMechanic === "function") {
    drawEnvironmentMechanic();
  }

  // Time mechanic
  if (mechanicToggles.time && typeof drawTimeMechanic === "function") {
    drawTimeMechanic();
  }

  // Perlin noise mechanic
  if (mechanicToggles.perlin && typeof drawPerlinMechanic === "function") {
    drawPerlinMechanic();
  }

  // Input mechanic
  if (mechanicToggles.input && typeof drawInputMechanic === "function") {
    drawInputMechanic();
  }

  // Larry's audio mechanic
  // Keep this near the end so audio reactions can sit on top visually if needed.
  if (mechanicToggles.audio && typeof drawAudioMechanic === "function") {
    drawAudioMechanic();
  }
}

