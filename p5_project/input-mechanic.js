// User paints impressionist brush strokes on the canvas by clicking and dragging.
// Single taps place stars in the sky or ripples on the ocean depending on position.
//
// All effects are drawn on a separate overlay canvas that sits in front of the
// p5.js canvas in the DOM. This means the input layer always appears on top of
// the scene regardless of the draw order in sketch.js.

// ── Overlay canvas ───────────────────────────────────────────────────────────
// A second HTML canvas element created in setupInputMechanic and appended to
// the body. pointer-events: none lets all mouse clicks pass through to p5.js.
let overlayCanvas;
let ctx;

// ── State ────────────────────────────────────────────────────────────────────
let userPaintStrokes = [];       // All completed brush strokes
let activeStroke = null;         // The stroke currently being drawn
let brushRadius = 16;            // Half the brush width; scroll wheel adjusts this
let isPainting = false;
let dragDistanceSincePress = 0;  // Accumulated mouse travel; distinguishes tap from drag

let waterRipples = [];  // Expanding ring effects spawned by tapping the ocean
let paintedStars = [];  // Twinkling stars spawned by tapping the sky

// Each stroke: { points: [{x, y}], r, g, b, alpha }
// Each ripple: { x, y, radius, maxRadius, growSpeed }
// Each star:   { x, y, size, alpha, twinkleOffset }

function setupInputMechanic() {
  // Create a transparent overlay canvas that floats above the p5.js canvas
  overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = windowWidth;
  overlayCanvas.height = windowHeight;

  // z-index 10 keeps it above the scene; pointer-events none lets clicks reach p5.js
  overlayCanvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:10;';
  document.body.appendChild(overlayCanvas);
  ctx = overlayCanvas.getContext('2d');

  // Hide the system cursor so the brush circle on the overlay replaces it
  document.body.style.cursor = 'none';
}

function drawInputMechanic() {
  if (!ctx) return;

  // Clear the overlay each frame and redraw everything at its current alpha value
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  overlayUpdateRipples();
  overlayUpdateStars();
  overlayFadeStrokes();

  // Draw the live stroke without fading while the mouse button is held
  if (activeStroke) overlayDrawSingleStroke(activeStroke);

  overlayDrawBrushCursor();
  overlayDrawInstructions();
}

// ── Brush stroke system ──────────────────────────────────────────────────────

function overlayFadeStrokes() {
  // Walk backwards so splicing a finished stroke does not skip the next index
  for (let i = userPaintStrokes.length - 1; i >= 0; i--) {
    let s = userPaintStrokes[i];

    // Each frame the stroke dries a little; lower value = marks last longer
    s.alpha -= 0.5;

    if (s.alpha <= 0) {
      userPaintStrokes.splice(i, 1);
    } else {
      overlayDrawSingleStroke(s);
    }
  }
}

// Renders one stroke as overlapping jittered segments to mimic bristle texture
function overlayDrawSingleStroke(s) {
  if (s.points.length < 2) return;

  ctx.lineCap = 'round';

  for (let i = 1; i < s.points.length; i++) {
    let prev = s.points[i - 1];
    let curr = s.points[i];

    // Tiny random jitter per segment gives the mark a hand-painted, impressionist feel
    let jitter = brushRadius * 0.18;
    let weight  = brushRadius * (0.75 + Math.random() * 0.5);

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${(s.alpha / 255).toFixed(3)})`;
    ctx.lineWidth = weight;
    ctx.moveTo(prev.x + (Math.random() - 0.5) * jitter * 2,
               prev.y + (Math.random() - 0.5) * jitter * 2);
    ctx.lineTo(curr.x + (Math.random() - 0.5) * jitter * 2,
               curr.y + (Math.random() - 0.5) * jitter * 2);
    ctx.stroke();
  }
}

// ── Water ripple system ──────────────────────────────────────────────────────

// Creates 3 concentric rings staggered in starting radius, simulating a raindrop splash
function spawnRipple(x, y) {
  for (let i = 0; i < 3; i++) {
    waterRipples.push({
      x: x,
      y: y,
      radius:    i * 14,         // Each ring starts further out so they spread apart
      maxRadius: 70 + i * 28,
      growSpeed: 1.4 + i * 0.3
    });
  }
}

// Grows each ring outward and fades it as it approaches its maximum radius
function overlayUpdateRipples() {
  for (let i = waterRipples.length - 1; i >= 0; i--) {
    let r = waterRipples[i];
    r.radius += r.growSpeed;

    // Alpha fades to zero as the ring expands — energy dissipating in water
    let alpha = map(r.radius, 0, r.maxRadius, 0.8, 0);

    if (r.radius >= r.maxRadius) {
      waterRipples.splice(i, 1);
      continue;
    }

    // Squash the ellipse vertically so it reads as a flat ring on the water surface
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.scale(1, 0.28);
    ctx.beginPath();
    ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(160,205,230,${alpha.toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

// ── Painted star system ──────────────────────────────────────────────────────

// Places a new glowing star at (x, y) in the sky region
function spawnStar(x, y) {
  paintedStars.push({
    x: x,
    y: y,
    size: 2 + Math.random() * 3,
    alpha: 230,
    twinkleOffset: Math.random() * Math.PI * 2  // Random phase so stars don't all pulse in sync
  });
}

// Draws each star with a radial-gradient glow and gentle twinkle, then fades it slowly
function overlayUpdateStars() {
  for (let i = paintedStars.length - 1; i >= 0; i--) {
    let s = paintedStars[i];

    // Stars linger longer than brush strokes — they feel more permanent in the sky
    s.alpha -= 0.25;

    if (s.alpha <= 0) {
      paintedStars.splice(i, 1);
      continue;
    }

    // Slow sine wave modulates brightness to produce a gentle twinkle
    let twinkle = 0.55 + 0.45 * Math.sin(frameCount * 0.06 + s.twinkleOffset);
    let a = (s.alpha / 255) * twinkle;

    // Radial gradient gives a soft moonlit glow that fades to transparent at the edges
    let glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 4);
    glow.addColorStop(0,   `rgba(250,245,220,${(a * 0.9).toFixed(3)})`);
    glow.addColorStop(0.4, `rgba(240,235,210,${(a * 0.5).toFixed(3)})`);
    glow.addColorStop(1,   `rgba(235,228,200,0)`);

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Bright star point at the centre
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,250,230,${a.toFixed(3)})`;
    ctx.fill();
  }
}

// ── Brush cursor and UI ──────────────────────────────────────────────────────

// White circle replaces the hidden system cursor; always visible on the dark scene
function overlayDrawBrushCursor() {
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, brushRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Small centre dot marks the exact stroke registration point
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
}

// Returns a scene palette colour for the brush stroke based on cursor position.
// Sky → cool silver-blue; ocean surface → bright teal; deep water → dark navy.
function sceneColourAt(x, y) {
  let horizonY = height * 0.45;

  if (y < horizonY) {
    // Upper sky is cooler silver; colour warms gradually toward the sea horizon
    let t = y / horizonY;
    return {
      r: Math.round(210 + (140 - 210) * t),
      g: Math.round(218 + (170 - 218) * t),
      b: Math.round(238 + (200 - 238) * t)
    };
  } else {
    // Bright teal at the ocean surface deepens to near-black navy at the bottom
    let t = (y - horizonY) / (height - horizonY);
    return {
      r: Math.round(70  + (12  - 70)  * t),
      g: Math.round(130 + (38  - 130) * t),
      b: Math.round(170 + (62  - 170) * t)
    };
  }
}

// Shows context-aware instructions that change based on where the cursor is
function overlayDrawInstructions() {
  let nothingPlaced = userPaintStrokes.length === 0
    && waterRipples.length === 0
    && paintedStars.length === 0
    && !activeStroke;

  ctx.font = '14px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';

  if (nothingPlaced) {
    ctx.fillText(
      'drag to paint  |  tap sky for stars  |  tap ocean for ripples  |  scroll to resize  |  C to clear',
      30, overlayCanvas.height - 30
    );
  } else if (mouseY < height * 0.45) {
    ctx.fillText('sky — tap to place a star  |  drag to paint  |  C to clear', 30, overlayCanvas.height - 30);
  } else {
    ctx.fillText('ocean — tap to create ripples  |  drag to paint  |  C to clear', 30, overlayCanvas.height - 30);
  }
}

// ── Input event handlers ─────────────────────────────────────────────────────

function mousePressed(event) {
  // Use native event.button: 0 = left click. Avoids relying on p5.js LEFT constant.
  if (event && event.button !== 0) return;

  isPainting = true;
  dragDistanceSincePress = 0;
  let col = sceneColourAt(mouseX, mouseY);

  // Start a new stroke at full opacity; it begins fading only after the mouse is released
  activeStroke = {
    points: [{ x: mouseX, y: mouseY }],
    r: col.r,
    g: col.g,
    b: col.b,
    alpha: 200
  };
}

function mouseDragged() {
  if (!isPainting || !activeStroke) return;

  // Accumulate total travel to distinguish a real drag from an accidental micro-movement
  dragDistanceSincePress += dist(mouseX, mouseY, pmouseX, pmouseY);

  // Only record a new point when the mouse has moved far enough to avoid over-sampling
  let last = activeStroke.points[activeStroke.points.length - 1];
  if (dist(mouseX, mouseY, last.x, last.y) > brushRadius * 0.35) {
    activeStroke.points.push({ x: mouseX, y: mouseY });
  }
}

function mouseReleased() {
  if (!isPainting) return;
  isPainting = false;

  if (dragDistanceSincePress < 18) {
    // Short tap: spawn a context-aware effect based on where in the scene the click landed
    if (mouseY < height * 0.45) {
      spawnStar(mouseX, mouseY);
    } else {
      spawnRipple(mouseX, mouseY);
    }
    activeStroke = null;
  } else {
    // Long drag: save the stroke so it begins fading
    if (activeStroke) {
      userPaintStrokes.push(activeStroke);
      activeStroke = null;
    }
  }
}

// Scroll wheel resizes the brush in real time; return false stops the page scrolling
function mouseWheel(event) {
  brushRadius = constrain(brushRadius - event.delta * 0.04, 4, 55);
  return false;
}

// Press C to wipe all user marks and reveal the base scene underneath
function keyPressed() {
  if (key === 'c' || key === 'C') {
    userPaintStrokes = [];
    waterRipples    = [];
    paintedStars    = [];
    activeStroke    = null;
  }
}

function resizeInputMechanic() {
  // Resize the overlay canvas to match the new window dimensions
  if (overlayCanvas) {
    overlayCanvas.width  = windowWidth;
    overlayCanvas.height = windowHeight;
    // getContext must be re-fetched after resizing a canvas element
    ctx = overlayCanvas.getContext('2d');
  }
}
