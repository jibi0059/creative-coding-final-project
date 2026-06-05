const PERLIN_SEA_TOP_RATIO = 0.5;


let perlinLayer;



function setupPerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();



}





function drawPerlinMechanic() {
  const seaTop = height * PERLIN_SEA_TOP_RATIO;
// half of the canva is the sea

  perlinLayer.noStroke();
  perlinLayer.fill(20, 80, 140, 35);
  perlinLayer.rect(0, seaTop, width, height - seaTop);
  //extent of the sea
  
  image(perlinLayer, 0, 0);
}















function resizePerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();
}
