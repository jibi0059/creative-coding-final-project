let timeMechanic;
let audioMechanic;
let perlinMechanic;
let inputMechanic;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-holder");

  timeMechanic = new TimeMechanic();

  if (typeof AudioMechanic !== "undefined") {
    audioMechanic = new AudioMechanic();
  }

  if (typeof PerlinMechanic !== "undefined") {
    perlinMechanic = new PerlinMechanic();
  }

  if (typeof InputMechanic !== "undefined") {
    inputMechanic = new InputMechanic();
  }
}

function draw() {
  background(5, 7, 13);

  const sceneState = timeMechanic.update();

  timeMechanic.drawSky(sceneState);

  if (perlinMechanic && typeof perlinMechanic.drawClouds === "function") {
    perlinMechanic.drawClouds(sceneState);
  }

  if (perlinMechanic && typeof perlinMechanic.drawSea === "function") {
    perlinMechanic.drawSea(sceneState);
  }

  timeMechanic.drawLighthouse(sceneState);

  if (audioMechanic && typeof audioMechanic.drawAtmosphere === "function") {
    audioMechanic.drawAtmosphere(sceneState);
  }

  if (inputMechanic && typeof inputMechanic.drawRipples === "function") {
    inputMechanic.drawRipples(sceneState);
  }
}

function mousePressed() {
  if (inputMechanic && typeof inputMechanic.addRipple === "function") {
    inputMechanic.addRipple(mouseX, mouseY);
  }
}

function keyPressed() {
  if (inputMechanic && typeof inputMechanic.handleKey === "function") {
    inputMechanic.handleKey(key);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
