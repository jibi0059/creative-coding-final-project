const SEA_TOP_RATIO = 0.5;


let perlinLayer;
let painter;


function setupPerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();

  painter = new OceanPainter();

}





function drawPerlinMechanic() {
  const seaTop = height * SEA_TOP_RATIO;
// half of the canva is the sea

  perlinLayer.noStroke();
  perlinLayer.fill(20, 80, 140, 35);
  perlinLayer.rect(0, seaTop, width, height - seaTop);
  //extent of the sea
  
  painter.move();
  painter.paint();

  image(perlinLayer, 0, 0);
}

class OceanPainter {
  constructor() {
    const seaTop = height * SEA_TOP_RATIO;

    this.x = random(width);
    this.y = random(seaTop, height);
    this.size = 30;
    this.speed = 2;
  }
  move() {
    this.x += this.speed;

    if (this.x > width) {
      this.x = 0;
      //if it goes off the right side, it reappears from the left side.
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
}
