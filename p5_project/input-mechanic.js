let inputFollowMode = false;
let inputTargetBody = null; // 'sun' or 'moon'
let inputPos;

let inputBoatFollowMode = false;
let inputBoatPos;

let inputWasPressed = false;

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
      state.alpha = 255; // keep the boat fully visible while dragging
    }
    return state;
  };

  timeMechanic._inputPatched = true;
}

function drawInputMechanic() {
  if (!latestTimeSceneState) return;

  // Re-patch in case timeMechanic was recreated after setup
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
      // Any click while dragging the boat releases it
      inputBoatFollowMode = false;

    } else if (inputFollowMode) {
      // Any click while dragging a celestial body releases it
      inputFollowMode = false;
      inputTargetBody = null;

    } else {
      // Try to grab the boat first (it sits on top visually)
      if (boatVisible &&
          mouseX > boatState.x - boatW * 0.5 &&
          mouseX < boatState.x + boatW * 0.5 &&
          mouseY > boatState.y - boatH * 2.25 &&
          mouseY < boatState.y + boatH * 0.7) {
        inputBoatFollowMode = true;
        inputBoatPos.set(boatState.x, boatState.y);

      // Try to grab sun
      } else if (sun.visibility > 0.1 &&
                 dist(mouseX, mouseY, sun.x, sun.y) < sun.radius * 1.5) {
        inputFollowMode = true;
        inputTargetBody = 'sun';
        inputPos.set(sun.x, sun.y);

      // Try to grab moon
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
    // Constrain boat to the sea area
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

    // Boat hover highlight
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

    // Sun hover glow
    if (sun.visibility > 0.1 && dist(mouseX, mouseY, sun.x, sun.y) < sun.radius * 1.5) {
      hovered = true;
      noStroke();
      fill(255, 255, 200, 20);
      circle(sun.x, sun.y, sun.radius * 3);
    }

    // Moon hover glow
    if (moon.visibility > 0.1 && dist(mouseX, mouseY, moon.x, moon.y) < moon.radius * 1.5) {
      hovered = true;
      noStroke();
      fill(200, 220, 255, 20);
      circle(moon.x, moon.y, moon.radius * 3);
    }

    cursor(hovered ? HAND : ARROW);
  }
}

function resizeInputMechanic() {
  // All mechanics read width/height fresh each frame — nothing to reset here
}
