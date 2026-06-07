// input-mechanic.js
// User Input Mechanic - Jiale Bi
//
// Lets the audience drive the scene with the mouse and keyboard.
// Clicking and dragging the sun or moon scrubs the time-of-day
// cycle; clicking and dragging the boat repositions it on the
// sea; SPACE pauses the sketch and R resets it.
//
// This mechanic works by "patching" the time mechanic at runtime
// so mouse input can override the sky while the boat keeps using
// real time. Parts of this file were developed with assistance
//
// AI Acknowledgement
// I used Claude (AI) to help me plan the overall structure of
// this mechanic and to review my code for errors. All of the
// actual code was written and implemented by me.
let inputFollowMode = false;
let inputTargetBody = null; // 'sun' or 'moon'
let inputProgress = 0; // fake cycleProgress controlled by mouse
let inputPrevMouseX = 0;
let inputRealState = null; // real millis-based state, kept so the boat is unaffected

let inputBoatFollowMode = false;
let inputBoatPos;

let inputWasPressed = false;
let inputPaused = false;

function setupInputMechanic() {
  inputBoatPos = createVector(0, 0);
  patchTimeMechanic();
}

// Replaces (monkey-patches) two timeMechanic methods at runtime so
// the user can scrub the sky with the mouse while the boat keeps
// using real time. We store the original method (_nativeUpdate) with
// .bind() to keep its `this` pointing at timeMechanic, then call it
// inside our replacement so default behaviour still works when follow
// mode is off.
// Technique outside course - JavaScript monkey-patching:
// https://developer.mozilla.org/en-US/docs/Glossary/Monkey_patch
function patchTimeMechanic() {
  if (typeof timeMechanic === 'undefined' || timeMechanic._inputPatched) return;

  // Replace update() so the sky rebuilds from inputProgress while the boat uses real time
  const _nativeUpdate = timeMechanic.update.bind(timeMechanic);
  timeMechanic.update = function () {
    const real = _nativeUpdate();
    inputRealState = real;

    if (inputFollowMode) {
      const p = inputProgress;
      const dayAmount = this.getDayAmount(p);
      const nightAmount = 1 - dayAmount;
      const dawnAmount = this.getTransitionAmount(p, 0.12, 0.32);
      const duskAmount = this.getTransitionAmount(p, 0.56, 0.76);
      const twilightAmount = max(dawnAmount, duskAmount);
      return {
        cycleProgress: p,
        dayAmount,
        nightAmount,
        dawnAmount,
        duskAmount,
        twilightAmount,
        sun: this.getSunState(p, dayAmount, twilightAmount),
        moon: this.getMoonState(p, nightAmount),
        horizonY: height * 0.5
      };
    }
    return real;
  };

  // Replace getBoatState() so the boat always follows real time, not the mouse-driven sky
  const _nativeGetBoatState = timeMechanic.getBoatState.bind(timeMechanic);
  timeMechanic.getBoatState = function (sceneState) {
    const boatScene = (inputFollowMode && inputRealState) ? inputRealState : sceneState;
    const state = _nativeGetBoatState(boatScene);
    if (inputBoatFollowMode) {
      state.x = inputBoatPos.x;
      state.y = inputBoatPos.y;
      state.alpha = 255;
    }
    return state;
  };

  timeMechanic._inputPatched = true;
}

function drawInputMechanic() {
  if (!latestTimeSceneState) return;
  patchTimeMechanic();

  const sceneState = latestTimeSceneState;
  const sun = sceneState.sun;
  const moon = sceneState.moon;

  // Boat hit area matches the hull and mast bounds from time-mechanic's drawBoat
  const boatState = timeMechanic.getBoatState(sceneState);
  const boatW = width * 0.18;
  const boatH = height * 0.06;
  const boatVisible = boatState.alpha > 10;

  // Detect a fresh click without firing every frame the button is held
  const justClicked = mouseIsPressed && !inputWasPressed;

  if (justClicked) {
    if (inputBoatFollowMode) {
      inputBoatFollowMode = false;

    } else if (inputFollowMode) {
      inputFollowMode = false;
      inputTargetBody = null;

    } else {
      // Check boat first since it sits on top of the water layer
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
        // Start from the current real progress to avoid a jump in the sky
        inputProgress = sceneState.cycleProgress;
        inputPrevMouseX = mouseX;

      } else if (moon.visibility > 0.1 &&
                 dist(mouseX, mouseY, moon.x, moon.y) < moon.radius * 1.5) {
        inputFollowMode = true;
        inputTargetBody = 'moon';
        inputProgress = sceneState.cycleProgress;
        inputPrevMouseX = mouseX;
      }
    }
  }
  inputWasPressed = mouseIsPressed;

  if (inputBoatFollowMode) {
    inputBoatPos.x = lerp(inputBoatPos.x, mouseX, 0.05);
    // Constrain the boat to the sea area below the horizon
    const seaY = constrain(mouseY, sceneState.horizonY + height * 0.02, height * 0.9);
    inputBoatPos.y = lerp(inputBoatPos.y, seaY, 0.05);
    cursor(HAND);

  } else if (inputFollowMode) {
    // Moving the full canvas width advances the cycle by the sensitivity fraction
    const sensitivity = 0.6;
    const delta = (mouseX - inputPrevMouseX) / width * sensitivity;
    inputProgress = ((inputProgress + delta) % 1 + 1) % 1;
    inputPrevMouseX = mouseX;
    cursor(HAND);

  } else {
    let hovered = false;

    // Draw a faint highlight over whichever interactive element the mouse is near
    push();
    noStroke();
    if (boatVisible &&
        mouseX > boatState.x - boatW * 0.5 &&
        mouseX < boatState.x + boatW * 0.5 &&
        mouseY > boatState.y - boatH * 2.25 &&
        mouseY < boatState.y + boatH * 0.7) {
      hovered = true;
      fill(255, 255, 255, 14);
      rect(boatState.x - boatW * 0.5, boatState.y - boatH * 2.25, boatW, boatH * 2.95, 4);
    }

    if (sun.visibility > 0.1 && dist(mouseX, mouseY, sun.x, sun.y) < sun.radius * 1.5) {
      hovered = true;
      fill(255, 255, 200, 20);
      circle(sun.x, sun.y, sun.radius * 3);
    }

    if (moon.visibility > 0.1 && dist(mouseX, mouseY, moon.x, moon.y) < moon.radius * 1.5) {
      hovered = true;
      fill(200, 220, 255, 20);
      circle(moon.x, moon.y, moon.radius * 3);
    }
    pop();

    cursor(hovered ? HAND : ARROW);
  }

  if (inputPaused) drawInputPauseOverlay();
}

// Draws a small overlay in the top-right corner when the sketch is paused
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
  if (key === ' ') {
    inputPaused = !inputPaused;
    if (inputPaused) {
      noLoop();
    } else {
      loop();
    }
    redraw(); // draw one more frame so the pause indicator appears immediately
    return false; // stop the browser scrolling when space is pressed
  }

  if (key === 'r' || key === 'R') {
    inputFollowMode = false;
    inputTargetBody = null;
    inputBoatFollowMode = false;
    inputPaused = false;
    loop();

    if (typeof resetOcean === 'function') resetOcean();
    if (typeof resetClouds === 'function') resetClouds();

    // Recreate the time mechanic, then re-apply the patch to the new instance
    if (typeof setupTimeMechanic === 'function') {
      setupTimeMechanic();
      patchTimeMechanic();
    }
  }
}

function resizeInputMechanic() {
  // Reset the previous mouse position so the next delta is zero, not a stale difference
  inputPrevMouseX = mouseX;
}
