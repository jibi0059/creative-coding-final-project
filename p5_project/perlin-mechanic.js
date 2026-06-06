const SEA_TOP_RATIO = 0.5;
const TIME_STEP = 0.006;
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

  perlinLayer.noStroke();
  perlinLayer.fill(20, 80, 140, 35);
  perlinLayer.rect(0, seaTop, width, height - seaTop);
  //extent of the sea
  for (let painter of painters) {
  painter.move();
  painter.paint();

  time += TIME_STEP;
  image(perlinLayer, 0, 0);
}
}


function resetOcean() {
  painters = [];

  for (let i = 0; i < PAINTER_COUNT; i++) {
    painters.push(new OceanPainter());
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
      this.y > seaTop ||
      this.y > height ||
      this.age > this.life
    
    ) {
      this.reset();
      //reycycle
  }
}
   
  

  paint() {
    perlinLayer.fill(80, 160, 220, 80);
    perlinLayer.ellipse(this.x, this.y, this.size * 2.5, this.size * 0.18);

  }
}












function resizePerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();

  resetOcean();
}
