let inputFollowMode = false;
let inputTargetBody = null; // 'sun' or 'moon'
let inputPos;
let inputWasPressed = false;

function setupInputMechanic() {
  inputPos = createVector(0, 0);
  patchTimeMechanic();
}

// Intercept timeMechanic.update() so follow-mode overrides are injected before
// the time mechanic draws anything. This avoids a duplicate body being visible.
function patchTimeMechanic() {
  if (typeof timeMechanic === 'undefined' || timeMechanic._inputPatched) return;

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
  timeMechanic._inputPatched = true;
}

function drawInputMechanic() {
  if (!latestTimeSceneState) return;

  // Re-apply patch in case timeMechanic was recreated after setup
  patchTimeMechanic();

  const sceneState = latestTimeSceneState;
  const sun = sceneState.sun;
  const moon = sceneState.moon;

  // Single-press detection — fires once per click, not every frame while held
  const justClicked = mouseIsPressed && !inputWasPressed;

  if (justClicked) {
    if (inputFollowMode) {
      // Any click releases the grabbed body
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

  if (inputFollowMode) {
    // Lerp toward mouse; keep the body above the horizon
    inputPos.x = lerp(inputPos.x, mouseX, 0.05);
    inputPos.y = lerp(inputPos.y, constrain(mouseY, 0, sceneState.horizonY * 0.9), 0.05);
    cursor(HAND);
  } else {
    // Hover glow + cursor change when near a visible body
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

function resizeInputMechanic() {
  // timeMechanic.update is already patched and reads width/height fresh each frame
}
