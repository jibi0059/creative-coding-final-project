// perlin-mechanic.js
// Perlin Noise and Randomness - Yiming Wang
//
// Purpose of this file:
// This file is responsible for the calm ocean, sky clouds, and boat ripple
// interaction in the group artwork. Through Perlin noise and randomness,
// countless floating wave particles are scattered across the sea surface,
// creating a realistic ocean look, while clouds drift randomly across the sky.
// When the boat is moved through the input mechanic, expanding ripple rings are
// generated around the boat to make the water respond to interaction.
//
// What this mechanic brings to the artwork:
// It gives the painting a natural, organic motion. The movement of wave
// particles and clouds is smooth and unpredictable, which enhances the sense of
// depth and liveliness in both the sea and the sky. The boat ripple effect also
// connects the interactive boat with the ocean, making the scene feel more
// responsive and physically connected.
//
// Main p5.js techniques used:
// - noise() generates Perlin noise to control the movement direction of wave
//   particles and clouds, making the motion more natural and smooth.
// - map(), lerp(), sin(), cos(), and dist() convert noise values and movement
//   distance into angles, colors, sizes, speeds, and ripple timing.
// - ellipse() and rect() draw sea brushstrokes, base water areas, cloud shapes,
//   and expanding boat ripple rings.
// - random() generates initial positions, sizes, speeds, lifespans, and different
//   movement paths for particles, clouds, and ripple variation.
// - class creates independent wave particles, cloud objects, and boat ripple
//   objects, each with its own position, lifetime, and variation pattern.
// - Alpha transparency in fill() and stroke() creates semi-transparent overlays,
//   giving the sea a sense of trailing, layering, painterly quality, and fading
//   ripple movement.
//
// AI acknowledgement:
// Developed with support from Codex for code structure and error checking.
// Final design decisions, testing, tuning, and integration were reviewed and
// adjusted manually.




//FOR BOAT MOVING INTERACTION: Boat ripples
//boat ripple settings
//these control how often ripples appear and how long each ripple stays visible
const RIPPLE_DISTANCE = 18;
const RIPPLE_LIFE = 70;

const SEA_TOP_RATIO = 0.5;
const TIME_STEP = 0.006;
const FADE_ALPHA = 8;
const PAINTER_COUNT = 1500;
//test clouds : same logic with ocean
const CLOUD_COUNT = 15;
//test clouds
let cloudPart;
let clouds = [];

let perlinLayer;
let painters = [];
let time = 0;
//FOR BOAT MOVING INTERACTION: Boat ripples
let boatRipples = [];
//remembers the last boat position where a ripple was created
//this prevents the sketch from creating too many ripples every frame
let previousBoatRipplePos = null;


function setupPerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();

  //test clouds
  cloudPart = createGraphics(width, height);
  cloudPart.noStroke();
  resetClouds();


  resetOcean();
}


function drawPerlinMechanic() {
  const seaTop = height * SEA_TOP_RATIO;
// half of the canva is the sea
  drawOceanBackground(seaTop);
  drawCloudBackground();
  

  for (let painter of painters) {
  painter.move();
  painter.paint();

  }

  //boat 
  updateBoatRipples(seaTop);
  drawBoatRipples();
  
  image(perlinLayer, 0, 0);


  //test clouds
  for (let cloud of clouds) {
  cloud.move();
  cloud.paint();
  }

  image(cloudPart, 0, 0);




  time += TIME_STEP;
}




//test clouds
function resetClouds() {
  clouds = [];

  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push(new CloudPainter());
  }
}

function drawCloudBackground() {
  cloudPart.clear();
}

//test clouds
class CloudPainter {
  constructor() {
    this.reset();
  }

  reset() {
    const seaTop = height * SEA_TOP_RATIO;

    this.x = random(width);
    this.y = random(40, seaTop - 40);
    this.size = random(25, 80);
    this.speed = random(0.15, 0.6);
    this.seed = random(1000);
    this.alpha = random(18, 45);
  }

  move() {
    const seaTop = height * SEA_TOP_RATIO;

    const noiseValue = noise(
      this.x * 0.003,
      this.y * 0.006,
      time + this.seed
    );

    const angle = map(noiseValue, 0, 1, -PI * 0.08, PI * 0.08);

    this.x += cos(angle) * this.speed;
    this.y += sin(angle) * this.speed * 0.4;

    if (
      this.x > width + this.size ||
      this.y < 20 ||
      this.y > seaTop - 20
    ) {
      this.reset();
      this.x = -this.size;
    }
  }

  paint() {
    const noiseValue = noise(
      this.x * 0.01,
      this.y * 0.01,
      time + this.seed
    );

    const cloudWidth = this.size * map(noiseValue, 0, 1, 1.2, 2.2);
    const cloudHeight = this.size * map(noiseValue, 0, 1, 0.25, 0.55);

    cloudPart.fill(0, 0, 100, this.alpha);
    cloudPart.ellipse(this.x, this.y, cloudWidth, cloudHeight);

    cloudPart.fill(0, 0, 100, this.alpha * 0.7);
    cloudPart.ellipse(
      this.x + this.size * 0.25,
      this.y + this.size * 0.08,
      cloudWidth * 0.8,
      cloudHeight * 0.8
    );

    cloudPart.ellipse(
      this.x - this.size * 0.3,
      this.y + this.size * 0.05,
      cloudWidth * 0.7,
      cloudHeight * 0.7
    );
  }
}



function resetOcean() {
  painters = [];
  boatRipples = [];
  previousBoatRipplePos = null;

  for (let i = 0; i < PAINTER_COUNT; i++) {
    painters.push(new OceanPainter());
  }
  //for to draw painters
}

function drawOceanBackground(seaTop) {
  perlinLayer.noStroke();

  perlinLayer.fill(8, 12, 28, FADE_ALPHA);
  perlinLayer.rect(0, seaTop, width, height - seaTop);
//Trail layer

  perlinLayer.fill(20, 80, 140, 35);
  perlinLayer.rect(0, seaTop, width, height - seaTop);
}
//make sea look like real



function updateBoatRipples(seaTop) {
//the boat position comes from the input mechanic.
//if the input mechanic does not exist, or the boat is not being dragged,
//do not create ripples.
  if (
    typeof inputBoatFollowMode === "undefined" ||
    typeof inputBoatPos === "undefined" ||
    !inputBoatFollowMode
  ) {
    previousBoatRipplePos = null;
    return;
  }
//current boat position as the ripple origin
//y offset places the ripple slightly below the boat hull
  const boatX = inputBoatPos.x;
  const boatY = inputBoatPos.y + height * 0.02;

  if (boatY < seaTop || boatY > height) {
    return;
  }
//compare with next frame
  if (previousBoatRipplePos === null) {
    previousBoatRipplePos = createVector(boatX, boatY);
    return;
  }

  const movement = dist(
    boatX,
    boatY,
    previousBoatRipplePos.x,
    previousBoatRipplePos.y
  );
//new ripple after the boat has moved far enough
  if (movement > RIPPLE_DISTANCE) {
    boatRipples.push(new BoatRipple(boatX, boatY));
    previousBoatRipplePos.set(boatX, boatY);
  }
}

function drawBoatRipples() {
  //finished ripples can be removed safely
  for (let i = boatRipples.length - 1; i >= 0; i--) {
    boatRipples[i].update();
    boatRipples[i].paint();

    if (boatRipples[i].isDead()) {
      boatRipples.splice(i, 1);
    }
  }
}


class OceanPainter {
  constructor() {
    this.reset();
  }
  
  
  reset(){
    const seaTop = height * SEA_TOP_RATIO;

    this.x = random(width);
    this.y = random(seaTop, height);
    this.size = random(8, 28);
    this.speed = random(0.7, 2.2);
    this.life = random(90, 180);
    this.age = 0;
    //limite life to kill some painters
    this.seed = random(1000);
    //aim to move to different routes
  }



  move() {

    const seaTop = height * SEA_TOP_RATIO;
    const noiseValue = noise(
      this.x * 0.004,
      this.y * 0.008,
      time + this.seed
    );
    const angle = map(noiseValue, 0, 1, -PI * 0.15, PI * 0.15);
      this.x += cos(angle) * this.speed;
      this.y += sin(angle) * this.speed;
    //move up and down randomly
    
    this.age++;

    if (
      this.x > width + 40 || 
      this.x < -40 ||
      //disappearing after going off‑screen feels more natural.

      this.y < seaTop ||
      this.y > height ||
      this.age > this.life
    
    ) {
      this.reset();
      //reycycle
  }
}
   
  

  paint() {
    const seaTop = height * SEA_TOP_RATIO;
    const depth = map(this.y, seaTop, height, 0, 1, true);

    const noiseValue = noise(
      this.x * 0.018,
      this.y * 0.018,
      time + this.seed
      //the larger, the more changes
    );
    
    //bright blue to dark blue
    const r = map(depth, 0, 1, 50, 5);
    const g = map(depth, 0, 1, 150, 55);
    const b = map(depth, 0, 1, 210, 120);
    //gradients enhance realism
    
    const alpha = map(noiseValue, 0, 1, 25, 70);
    //alpha follows noise to change
    const w = this.size * map(noiseValue, 0, 1, 0.6, 1.6);
    const h = w * 0.18;
    //keep waves

    perlinLayer.fill(r, g, b, alpha);
    perlinLayer.ellipse(this.x, this.y, w * 2.5, h);

  }
}


//boat
class BoatRipple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;

   //for temporary existence
    this.life = RIPPLE_LIFE;
    this.seed = random(1000);
  }

  update() {
    this.age++;
  }

  paint() {
    const progress = this.age / this.life;

    //ripple gets older, it becomes larger and more transparent
    const alpha = map(progress, 0, 1, 90, 0);
    const rippleWidth = map(progress, 0, 1, 20, 150);
    const rippleHeight = rippleWidth * 0.18;
    
    //a small vertical wobble so the ripple feels less mechanical
    const wobble = noise(
      this.x * 0.01,
      this.y * 0.01,
      time + this.seed
    );

    const yOffset = map(wobble, 0, 1, -4, 4);

    perlinLayer.noFill();
    perlinLayer.stroke(210, 235, 255, alpha);
    perlinLayer.strokeWeight(2);
    perlinLayer.ellipse(this.x, this.y + yOffset, rippleWidth, rippleHeight);
    

    //a smaller second ripple to create more water detail
    perlinLayer.stroke(180, 220, 255, alpha * 0.45);
    perlinLayer.strokeWeight(1);
    perlinLayer.ellipse(
      this.x,
      this.y + yOffset + 5,
      rippleWidth * 0.65,
      rippleHeight * 0.6
    );

    //Turn stroke off
    perlinLayer.noStroke();
  }

  isDead() {
    return this.age > this.life;
  }
}





function resizePerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();
  
  
  //test clouds
  cloudPart = createGraphics(width, height);
  cloudPart.noStroke();
  
  resetClouds();
  
  resetOcean();
}
