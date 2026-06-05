let noiseArray = [];

let nPoints = 2000;
let k = 200;

let brushWeight = 35;
let brushMin = 15;
let brushMax = 40;
let alphaVal = 40;

// 0.5 = 海面占下半部分
// 0.67 = 海面占下三分之一
let seaTopRatio = 0.5;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();

  background(0, 0, 100);

  initializeNoise();
}

function draw() {
  // 上半部分保持白色
  fill(0, 0, 100, 100);
  rect(0, 0, width, height * seaTopRatio);

  for (let n of noiseArray) {
    n.getNoise();
    n.sketchNoise();
  }
}

function initializeNoise() {
  noiseArray = [];

  for (let i = 0; i < nPoints; i++) {
    noiseArray[i] = new OceanNoise();
  }
}

class OceanNoise {
  constructor() {
    this.getXYColor();

    let length = random(brushMin, brushMax);
    this.randomnessMax = length / (155 / k);
  }

  getXYColor() {
    let seaTop = height * seaTopRatio;

    this.x = random(width);
    this.y = random(seaTop, height);

    let depth = map(this.y, seaTop, height, 0, 1);

    let hue = map(depth, 0, 1, 190, 220);
    let saturation = map(depth, 0, 1, 45, 85);
    let brightness = map(depth, 0, 1, 65, 25);

    this.colorVal = color(hue, saturation, brightness, alphaVal);

    this.randomness = 0;
  }

  getNoise() {
    noiseDetail(7, 0.6);

    let seaTop = height * seaTopRatio;

    let noiseVal = noise(this.x / k, this.y / k) * k;
    let coord = createVector(sin(noiseVal), cos(noiseVal));

    this.x += coord.x * (155 / k) * 2.5;
    this.y += coord.y * (155 / k) * 0.6;

    this.randomness += 1;

    if (
      this.randomness > this.randomnessMax ||
      this.x < 0 ||
      this.x > width ||
      this.y < seaTop ||
      this.y > height
    ) {
      this.getXYColor();
    }
  }

  sketchNoise() {
    fill(this.colorVal);

    let size = brushWeight * noise(this.x / k, this.y / k) * 0.17;

    ellipse(this.x, this.y, size * 3, size);
  }
}

function keyPressed() {
  if (keyCode === BACKSPACE || keyCode === DELETE) {
    background(0, 0, 100);
    initializeNoise();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0, 0, 100);
  initializeNoise();
}
