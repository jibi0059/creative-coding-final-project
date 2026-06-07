let inputFollowMode = false;
let inputTargetBody = null; // 'sun' or 'moon'
let inputPos;

let inputBoatFollowMode = false;
let inputBoatPos;

let inputWasPressed = false;
let inputPaused = false;

function setupInputMechanic() {
  inputPos = createVector(0, 0);
  inputBoatPos = createVector(0, 0);
  patchTimeMechanic();
}

// Intercept timeMechanic methods so follow-mode overrides are injected before
// the time mechanic draws anything — avoids any duplicate/ghost body.
function patchTimeMechanic() {
  if (typeof timeMechanic === 'undefined' || timeMechanic._inputPatched) return;

  // --- Sun / Moon override via update() ---
  const _nativeUpdate = timeMechanic.update.bind(timeMechanic);
  timeMechanic.update = function () {
    const state = _nativeUpdate();
    if (inputFollowMode && inputTargetBody === 'sun') {
      state.sun.x = inputPos.x;
      state.sun.y = inputPos.y;
    } else if (inputFollowMode && inputTargetBody === 'moon') {
      state.moon.x = inputPos.x;
      state.moon.y = inputPos.y;
    }
    return state;
  };

  // --- Boat override via getBoatState() ---
  const _nativeGetBoatState = timeMechanic.getBoatState.bind(timeMechanic);
  timeMechanic.getBoatState = function (sceneState) {
    const state = _nativeGetBoatState(sceneState);
    if (inputBoatFollowMode) {
      state.x = inputBoatPos.x;
      state.y = inputBoatPos.y;
      state.alpha = 255; // keep boat fully visible while dragging
    }
    return state;
  };

  timeMechanic._inputPatched = true;
}

function drawInputMechanic() {
  if (!latestTimeSceneState) return;

  // Re-patch in case timeMechanic was recreated (e.g. after reset)
  patchTimeMechanic();

  const sceneState = latestTimeSceneState;
  const sun = sceneState.sun;
  const moon = sceneState.moon;

  // Boat hit-box dimensions (match time-mechanic's drawBoat values; scale is always 1)
  const boatState = timeMechanic.getBoatState(sceneState);
  const boatW = width * 0.18;
  const boatH = height * 0.06;
  const boatVisible = boatState.alpha > 10;

  // ---------- single-press detection ----------
  const justClicked = mouseIsPressed && !inputWasPressed;

  if (justClicked) {
    if (inputBoatFollowMode) {
      inputBoatFollowMode = false;
    } else if (inputFollowMode) {
      inputFollowMode = false;
      inputTargetBody = null;
    } else {
      // Boat (checked first — sits on top visually)
      if (boatVisible &&
          mouseX > boatState.x - boatW * 0.5 &&
          mouseX < boatState.x + boatW * 0.5 &&
          mouseY > boatState.y - boatH * 2.25 &&
          mouseY < boatState.y + boatH * 0.7) {
        inputBoatFollowMode = true;
        inputBoatPos.set(boatState.x, boatState.y);

      } else if (sun.visibility > 0.1 &&
                 dist(mouseX, mouseY, sun.x, sun.y) < sun.radius * 1.5) {
        inputFollowMode = true;
        inputTargetBody = 'sun';
        inputPos.set(sun.x, sun.y);

      } else if (moon.visibility > 0.1 &&
                 dist(mouseX, mouseY, moon.x, moon.y) < moon.radius * 1.5) {
        inputFollowMode = true;
        inputTargetBody = 'moon';
        inputPos.set(moon.x, moon.y);
      }
    }
  }
  inputWasPressed = mouseIsPressed;

  // ---------- position updates + cursor ----------
  if (inputBoatFollowMode) {
    inputBoatPos.x = lerp(inputBoatPos.x, mouseX, 0.05);
    const seaTargetY = constrain(mouseY, sceneState.horizonY + height * 0.02, height * 0.9);
    inputBoatPos.y = lerp(inputBoatPos.y, seaTargetY, 0.05);
    cursor(HAND);

  } else if (inputFollowMode) {
    inputPos.x = lerp(inputPos.x, mouseX, 0.05);
    inputPos.y = lerp(inputPos.y, constrain(mouseY, 0, sceneState.horizonY * 0.9), 0.05);
    cursor(HAND);

  } else {
    // ---------- hover glows + cursor ----------
    let hovered = false;

    if (boatVisible &&
        mouseX > boatState.x - boatW * 0.5 &&
        mouseX < boatState.x + boatW * 0.5 &&
        mouseY > boatState.y - boatH * 2.25 &&
        mouseY < boatState.y + boatH * 0.7) {
      hovered = true;
      noStroke();
      fill(255, 255, 255, 14);
      rect(boatState.x - boatW * 0.5, boatState.y - boatH * 2.25,
           boatW, boatH * 2.95, 4);
    }

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

  // ---------- pause overlay ----------
  if (inputPaused) {
    drawInputPauseOverlay();
  }
}

function drawInputPauseOverlay() {
  push();
  const pad = 16;
  const pw = 210;
  const ph = 62;
  const px = width - pw - pad;
  const py = pad;

  noStroke();
  fill(0, 0, 0, 150);
  rect(px, py, pw, ph, 8);

  textAlign(CENTER, CENTER);
  textSize(17);
  fill(255);
  text('PAUSED', px + pw / 2, py + ph * 0.34);

  textSize(11);
  fill(180);
  text('SPACE  resume    R  reset', px + pw / 2, py + ph * 0.72);
  pop();
}

function keyPressed() {
  // Space — toggle pause / resume
  if (key === ' ') {
    inputPaused = !inputPaused;
    if (inputPaused) {
      noLoop();
    } else {
      loop();
    }
    redraw(); // one extra frame to show / hide the pause indicator
    return false; // prevent the browser from scrolling on spacebar
  }

  // R — reset the entire scene
  if (key === 'r' || key === 'R') {
    // Release all drag states
    inputFollowMode = false;
    inputTargetBody = null;
    inputBoatFollowMode = false;

    // Resume draw loop if it was paused
    inputPaused = false;
    loop();

    // Reset perlin ocean and cloud painters to fresh random positions
    if (typeof resetOcean === 'function') resetOcean();
    if (typeof resetClouds === 'function') resetClouds();

    // Recreate the time mechanic (fresh star field; sky cycle continues from millis())
    if (typeof setupTimeMechanic === 'function') {
      setupTimeMechanic();
      // Clear patch flag so patchTimeMechanic() will re-apply to the new instance
      if (typeof timeMechanic !== 'undefined') {
        timeMechanic._inputPatched = false;
      }
      patchTimeMechanic();
    }
  }
}

function resizeInputMechanic() {
  // All mechanics read width/height fresh each frame — nothing to reset here
}
