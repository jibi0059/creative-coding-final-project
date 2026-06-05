


let perlinLayer;



function setupPerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();



}





function drawPerlinMechanic() {
  image(perlinLayer, 0, 0);
}


function resizePerlinMechanic() {
  perlinLayer = createGraphics(width, height);
  perlinLayer.noStroke();
}
