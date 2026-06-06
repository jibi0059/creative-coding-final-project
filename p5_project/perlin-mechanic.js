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
    const seaTop = height * SEA_TOP_RATIO;

    this.x = random(width);
    this.y = random(seaTop, height);
    this.size = random(8, 28);
    this.speed = random(0.7, 2.2);
    this.seed = random(1000);
    //aim to move to different routes
  }
  move() {
    const noiseValue = noise(
      this.x * 0.004,
      this.y * 0.008,
      time + this.seed
    );
    const angle = map(noiseValue, 0, 1, -PI * 0.15, PI * 0.15);
      this.x += cos(angle) * this.speed;
      this.y += sin(angle) * this.speed * 0.5;
    //move up and down randomly, do not hgher than seatop
    
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
