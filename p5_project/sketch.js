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

  // Larry's audio mechanic
  // Draw before the time foreground so clouds and sea sit behind the lighthouse.
  if (mechanicToggles.audio && typeof drawAudioMechanic === "function") {
    drawAudioMechanic();
  }

  // Time foreground: lighthouse, land, and boat
  if (mechanicToggles.time && typeof drawTimeForegroundMechanic === "function") {
    drawTimeForegroundMechanic();
  }

  // Input mechanic
  if (mechanicToggles.input && typeof drawInputMechanic === "function") {
    drawInputMechanic();
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Environment mechanic
  if (typeof resizeEnvironmentMechanic === "function") {
    resizeEnvironmentMechanic();
  }

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
