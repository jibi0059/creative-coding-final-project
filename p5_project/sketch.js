let mechanicToggles = {
  audio: true,
  perlin: true,
  input: true,
  time: true
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupMechanicToggles();

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

function setupMechanicToggles() {
  const audioToggle = document.getElementById("toggle-audio");
  const perlinToggle = document.getElementById("toggle-perlin");
  const inputToggle = document.getElementById("toggle-input");
  const timeToggle = document.getElementById("toggle-time");

  if (audioToggle) {
    mechanicToggles.audio = audioToggle.checked;
    audioToggle.addEventListener("change", function () {
      mechanicToggles.audio = audioToggle.checked;
    });
  }

  if (perlinToggle) {
    mechanicToggles.perlin = perlinToggle.checked;
    perlinToggle.addEventListener("change", function () {
      mechanicToggles.perlin = perlinToggle.checked;
    });
  }

  if (inputToggle) {
    mechanicToggles.input = inputToggle.checked;
    inputToggle.addEventListener("change", function () {
      mechanicToggles.input = inputToggle.checked;
    });
  }

  if (timeToggle) {
    mechanicToggles.time = timeToggle.checked;
    timeToggle.addEventListener("change", function () {
      mechanicToggles.time = timeToggle.checked;
    });
  }
}