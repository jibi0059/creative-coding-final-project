const SEA_TOP_RATIO = 0.5;
const TIME_STEP = 0.006;
const FADE_ALPHA = 8;
const PAINTER_COUNT = 250;
//test clouds
const CLOUD_COUNT = 15;
//test clouds
let cloudPart;
let clouds = [];

let perlinLayer;
let painters = [];
let time = 0;

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





function resizePerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();
  
  
  //test clouds
  cloudPart = createGraphics(width, height);
  cloudPart.noStroke();
  
  resetClouds();
  
  resetOcean();
}
