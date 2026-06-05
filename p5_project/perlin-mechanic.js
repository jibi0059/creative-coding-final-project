const seaTopRatio = 0.5;
//The sea accounts for half.




function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();
}

function draw() {
  background(0, 0, 100);

  let seaTop = height * seaTopRatio;

  fill(200, 80, 45);
  rect(0, seaTop, width, height - seaTop);
  //The extent of the sea.
}
