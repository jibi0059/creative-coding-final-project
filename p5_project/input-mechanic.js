let inputFollowMode  = false;
let inputTargetBody  = null;   // 'sun' or 'moon'
let inputProgress    = 0;      // fake cycleProgress driven by mouse delta
let inputPrevMouseX  = 0;
let inputRealState   = null;   // always holds the real (millis-based) scene state

let inputBoatFollowMode = false;
let inputBoatPos;

let inputWasPressed = false;
let inputPaused     = false;

function setupInputMechanic() {
  inputBoatPos = createVector(0, 0);
  patchTimeMechanic();
}

// Intercept timeMechanic so the sky uses inputProgress while in follow mode,
// but the boat always keeps the real automatic time.
function patchTimeMechanic() {
  if (typeof timeMechanic === 'undefined' || timeMechanic._inputPatched) return;

  // ── Sky / celestial override ─────────────────────────────────────────────
  const _nativeUpdate = timeMechanic.update.bind(timeMechanic);
  timeMechanic.update = function () {
    const real = _nativeUpdate();
    inputRealState = real;            // always keep the real state for the boat

    if (inputFollowMode) {
      const p            = inputProgress;
      const dayAmount    = this.getDayAmount(p);
      const nightAmount  = 1 - dayAmount;
      const dawnAmount   = this.getTransitionAmount(p, 0.12, 0.32);
      const duskAmount   = this.getTransitionAmount(p, 0.56, 0.76);
      const twilightAmount = max(dawnAmount, duskAmount);
      return {
        cycleProgress  : p,
        dayAmount,
        nightAmount,
        dawnAmount,
        duskAmount,
        twilightAmount,
        sun      : this.getSunState(p, dayAmount, twilightAmount),
        moon     : this.getMoonState(p, nightAmount),
        horizonY : height * 0.5
      };
    }
    return real;
  };

  // ── Boat keeps the real automatic time ──────────────────────────────────
  const _nativeGetBoatState = timeMechanic.getBoatState.bind(timeMechanic);
  timeMechanic.getBoatState = function (sceneState) {
    // When dragging a celestial body, feed the boat the real scene state
    // so it continues its natural voyage unaffected by the sky scrub.
    const boatScene = (inputFollowMode && inputRealState) ? inputRealState : sceneState;
    const state = _nativeGetBoatState(boatScene);
    if (inputBoatFollowMode) {
      state.x     = inputBoatPos.x;
      state.y     = inputBoatPos.y;
      state.alpha = 255;
    }
    return state;
  };

  timeMechanic._inputPatched = true;
}

function drawInputMechanic() {
  if (!latestTimeSceneState) return;
  patchTimeMechanic();

  const sceneState  = latestTimeSceneState;
  const sun         = sceneState.sun;
  const moon        = sceneState.moon;

  const boatState  = timeMechanic.getBoatState(sceneState);
  const boatW      = width  * 0.18;
  const boatH      = height * 0.06;
  const boatVisible = boatState.alpha > 10;

  // ── single-press detection ───────────────────────────────────────────────
  const justClicked = mouseIsPressed && !inputWasPressed;

  if (justClicked) {
    if (inputBoatFollowMode) {
      inputBoatFollowMode = false;

    } else if (inputFollowMode) {
      inputFollowMode = false;
      inputTargetBody = null;

    } else {
      // Boat first (sits on top visually)
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
        // Seed from real cycle so there is no visible jump at click moment
        inputProgress   = sceneState.cycleProgress;
        inputPrevMouseX = mouseX;

      } else if (moon.visibility > 0.1 &&
                 dist(mouseX, mouseY, moon.x, moon.y) < moon.radius * 1.5) {
        inputFollowMode = true;
        inputTargetBody = 'moon';
        inputProgress   = sceneState.cycleProgress;
        inputPrevMouseX = mouseX;
      }
    }
  }
  inputWasPressed = mouseIsPressed;

  // ── position / progress updates + cursor ────────────────────────────────
  if (inputBoatFollowMode) {
    inputBoatPos.x = lerp(inputBoatPos.x, mouseX, 0.05);
    const seaY = constrain(mouseY, sceneState.horizonY + height * 0.02, height * 0.9);
    inputBoatPos.y = lerp(inputBoatPos.y, seaY, 0.05);
    cursor(HAND);

  } else if (inputFollowMode) {
    // Moving the full canvas width shifts time by 20 % of the day cycle.
    // Raise the sensitivity constant to make the sky react faster.
    const sensitivity = 0.5;
    const delta = (mouseX - inputPrevMouseX) / width * sensitivity;
    inputProgress   = ((inputProgress + delta) % 1 + 1) % 1;
    inputPrevMouseX = mouseX;
    cursor(HAND);

  } else {
    // ── hover glows + cursor ─────────────────────────────────────────────
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

  if (inputPaused) drawInputPauseOverlay();
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
