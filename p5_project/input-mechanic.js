let inputFollowMode = false;
let inputTargetBody = null; // 'sun' or 'moon'
let inputPos;
let inputWasPressed = false;
let inputMoonLayer;

function setupInputMechanic() {
  inputPos = createVector(0, 0);
  const layerSize = max(ceil(min(width, height) * 0.04 * 3.2), 10);
  inputMoonLayer = createGraphics(layerSize, layerSize);
}

function drawInputMechanic() {
  if (!latestTimeSceneState) return;

  const sceneState = latestTimeSceneState;
  const sun = sceneState.sun;
  const moon = sceneState.moon;

  // Single-press detection — fires once per click, not every frame held
  const justClicked = mouseIsPressed && !inputWasPressed;

  if (justClicked) {
    if (inputFollowMode) {
      // Any click while following releases the body
      inputFollowMode = false;
      inputTargetBody = null;
    } else {
      // Try to grab sun
      if (sun.visibility > 0.1 && dist(mouseX, mouseY, sun.x, sun.y) < sun.radius * 1.5) {
        inputFollowMode = true;
        inputTargetBody = 'sun';
        inputPos.set(sun.x, sun.y);
      // Try to grab moon
      } else if (moon.visibility > 0.1 && dist(mouseX, mouseY, moon.x, moon.y) < moon.radius * 1.5) {
        inputFollowMode = true;
        inputTargetBody = 'moon';
        inputPos.set(moon.x, moon.y);
      }
    }
  }
  inputWasPressed = mouseIsPressed;

  if (inputFollowMode && inputTargetBody) {
    // Lerp toward mouse, keep body above horizon
    inputPos.x = lerp(inputPos.x, mouseX, 0.05);
    inputPos.y = lerp(inputPos.y, constrain(mouseY, 0, sceneState.horizonY * 0.9), 0.05);

    cursor(HAND);

    const origBody = inputTargetBody === 'sun' ? sun : moon;

    // Soft gradient cover over the time-mechanic's original position
    const ctx = drawingContext;
    ctx.save();
    const coverR = origBody.radius * 2.8;
    const isNight = inputTargetBody === 'moon';
    const cr = isNight ? 5 : 70;
    const cg = isNight ? 7 : 130;
    const cb = isNight ? 18 : 195;
    const cover = ctx.createRadialGradient(origBody.x, origBody.y, 0, origBody.x, origBody.y, coverR);
    cover.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.82)`);
    cover.addColorStop(0.6, `rgba(${cr}, ${cg}, ${cb}, 0.4)`);
    cover.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
    ctx.fillStyle = cover;
    ctx.beginPath();
    ctx.arc(origBody.x, origBody.y, coverR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw the grabbed body at the lerped mouse position
    if (inputTargetBody === 'sun') {
      drawInputSunAt(inputPos.x, inputPos.y, sun);
    } else {
      drawInputMoonAt(inputPos.x, inputPos.y, moon);
    }

  } else {
    // Hover effects and cursor change
    let hovered = false;

    if (sun.visibility > 0.1 && dist(mouseX, mouseY, sun.x, sun.y) < sun.radius * 1.5) {
      hovered = true;
      noStroke();
      fill(255, 255, 200, 20);
      circle(sun.x, sun.y, sun.radius * 3);
    }

    if (moon.visibility > 0.1 && dist(mouseX, mouseY, moon.x, moon.y) < moon.radius * 1.5) {
      hovered = true;
      noStroke();
      fill(200, 220, 255, 20);
      circle(moon.x, moon.y, moon.radius * 3);
    }

    cursor(hovered ? HAND : ARROW);
  }
}

function drawInputSunAt(x, y, sun) {
  const ctx = drawingContext;
  const r = sun.radius;
  const col = sun.color;
  const vis = constrain(sun.visibility, 0, 1);

  // Halo using screen blend for soft light
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const halo = ctx.createRadialGradient(x, y, r * 0.15, x, y, r * 3.5);
  halo.addColorStop(0,    `rgba(255, 252, 233, ${0.88 * vis})`);
  halo.addColorStop(0.18, `rgba(${red(col)}, ${green(col)}, ${blue(col)}, ${0.5 * vis})`);
  halo.addColorStop(0.5,  `rgba(238, 145, 82, ${0.15 * vis})`);
  halo.addColorStop(1,    'rgba(238, 145, 82, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Solid core disc
  noStroke();
  fill(255, 250, 220, 240 * vis);
  circle(x, y, r * 2);
}

function drawInputMoonAt(x, y, moon) {
  const ctx = drawingContext;
  const r = moon.radius;
  const col = moon.color;
  const vis = constrain(moon.visibility, 0, 1);

  // Atmospheric glow via screen blend
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(x - r * 0.18, y, r * 0.25, x - r * 0.18, y, r * 2.8);
  glow.addColorStop(0,    `rgba(222, 233, 244, ${0.32 * vis})`);
  glow.addColorStop(0.45, `rgba(149, 173, 207, ${0.11 * vis})`);
  glow.addColorStop(1,    'rgba(149, 173, 207, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x - r * 0.18, y, r * 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Crescent on the reusable offscreen layer so erase() doesn't cut through the main canvas
  const sz = inputMoonLayer.width;
  const cx = sz / 2;
  const cy = sz / 2;
  inputMoonLayer.clear();
  inputMoonLayer.noStroke();
  inputMoonLayer.fill(red(col), green(col), blue(col), 190 * vis);
  inputMoonLayer.circle(cx, cy, r * 2);
  inputMoonLayer.erase();
  inputMoonLayer.circle(cx + r * 0.48, cy - r * 0.02, r * 1.82);
  inputMoonLayer.noErase();

  push();
  translate(x, y);
  rotate(-0.12);
  imageMode(CENTER);
  image(inputMoonLayer, 0, 0);
  imageMode(CORNER);
  pop();
}

function resizeInputMechanic() {
  const layerSize = max(ceil(min(width, height) * 0.04 * 3.2), 10);
  if (inputMoonLayer) inputMoonLayer.remove();
  inputMoonLayer = createGraphics(layerSize, layerSize);
}
