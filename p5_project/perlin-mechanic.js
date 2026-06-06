const SEA_TOP_RATIO = 0.5;
const TIME_STEP = 0.006;
const FADE_ALPHA = 8;
const PAINTER_COUNT = 250;


let perlinLayer;
let painters = [];
let time = 0;

function setupPerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();



  resetOcean();
}





function drawPerlinMechanic() {
  const seaTop = height * SEA_TOP_RATIO;
// half of the canva is the sea
  drawOceanBackground(seaTop);

  

  for (let painter of painters) {
  painter.move();
  painter.paint();

  }

  time += TIME_STEP;
  image(perlinLayer, 0, 0);

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

  resetOcean();
}
