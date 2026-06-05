// User paints impressionist brush strokes on the canvas by clicking and dragging.
// Single taps place stars in the sky or ripples on the ocean depending on position.
// Strokes, stars, and ripples all borrow colours from the scene's night palette
// and slowly fade over time — like marks on a living painting.

let userPaintStrokes = [];       // All brush strokes the user has painted
let activeStroke = null;         // The stroke currently being drawn
let brushRadius = 16;            // Half the brush width; scroll wheel adjusts this
let isPainting = false;
let dragDistanceSincePress = 0;  // Total mouse travel since last click; distinguishes taps from drags

let waterRipples = [];  // Expanding ring effects spawned by tapping the ocean
let paintedStars = [];  // Twinkling stars spawned by tapping the sky

// Each stroke: { points: [{x, y}], r, g, b, alpha }
// Each ripple: { x, y, radius, maxRadius, growSpeed }
// Each star:   { x, y, size, alpha, twinkleOffset }

function setupInputMechanic() {
  // Hide the default cursor so the brush circle acts as the real cursor
  noCursor();
}

function drawInputMechanic() {
  drawAndUpdateRipples();
  drawAndUpdateStars();
  fadeAndDrawAllStrokes();

  // Draw the live stroke without fading while the mouse button is held down
  if (activeStroke) {
    drawSingleStroke(activeStroke);
  }

  drawBrushPreview();
  drawInputInstructions();
}

// ── Brush stroke system ──────────────────────────────────────────────────────

function fadeAndDrawAllStrokes() {
  // Walk backwards so splicing a finished stroke does not skip the next index
  for (let i = userPaintStrokes.length - 1; i >= 0; i--) {
    let s = userPaintStrokes[i];

    // Each frame the stroke dries a little; lower value = marks last longer
    s.alpha -= 0.5;

    if (s.alpha <= 0) {
      userPaintStrokes.splice(i, 1);
    } else {
      drawSingleStroke(s);
    }
  }
}

// Renders one stroke as overlapping short segments to mimic bristle texture
function drawSingleStroke(s) {
  if (s.points.length < 2) return;

  strokeCap(ROUND);
  noFill();

  for (let i = 1; i < s.points.length; i++) {
    let prev = s.points[i - 1];
    let curr = s.points[i];

    // Tiny random jitter per segment gives the mark a hand-painted, impressionist feel
    let jitter = brushRadius * 0.18;
    stroke(s.r, s.g, s.b, s.alpha);
    strokeWeight(brushRadius * random(0.75, 1.25));

    line(
      prev.x + random(-jitter, jitter),
      prev.y + random(-jitter, jitter),
      curr.x + random(-jitter, jitter),
      curr.y + random(-jitter, jitter)
    );
  }
}

// ── Water ripple system ──────────────────────────────────────────────────────

// Creates 3 concentric rings staggered in starting radius, simulating a raindrop splash
function spawnRipple(x, y) {
  for (let i = 0; i < 3; i++) {
    waterRipples.push({
      x: x,
      y: y,
      radius: i * 14,        // Each ring starts further out so they spread apart over time
      maxRadius: 70 + i * 28,
      growSpeed: 1.4 + i * 0.3
    });
  }
}

// Grows each ring outward and fades it as it approaches its maximum radius
function drawAndUpdateRipples() {
  noFill();

  for (let i = waterRipples.length - 1; i >= 0; i--) {
    let r = waterRipples[i];
    r.radius += r.growSpeed;

    // Alpha fades naturally to zero as the ring expands — energy dissipating in water
    let alpha = map(r.radius, 0, r.maxRadius, 200, 0);

    if (r.radius >= r.maxRadius) {
      waterRipples.splice(i, 1);
      continue;
    }

    // Squash the ellipse vertically so it reads as a flat ring on the water surface
    stroke(160, 205, 230, alpha);
    strokeWeight(1.5);
    ellipse(r.x, r.y, r.radius * 2, r.radius * 0.55);
  }
}

// ── Painted star system ──────────────────────────────────────────────────────

// Places a new glowing star at (x, y) in the sky region
function spawnStar(x, y) {
  paintedStars.push({
    x: x,
    y: y,
    size: random(2, 5),
    alpha: 230,
    twinkleOffset: random(TWO_PI)  // Random phase so stars don't all pulse in sync
  });
}

// Draws each star with a layered glow and gentle twinkle, then fades it out slowly
function drawAndUpdateStars() {
  noStroke();

  for (let i = paintedStars.length - 1; i >= 0; i--) {
    let s = paintedStars[i];

    // Stars linger longer than brush strokes — they feel more permanent in the sky
    s.alpha -= 0.25;

    if (s.alpha <= 0) {
      paintedStars.splice(i, 1);
      continue;
    }

    // Modulate brightness with a slow sine wave to produce a gentle twinkle
    let twinkle = map(sin(frameCount * 0.06 + s.twinkleOffset), -1, 1, 0.55, 1.0);
    let displayAlpha = s.alpha * twinkle;

    // Outer halo — large and very transparent, giving a soft moonlit glow
    fill(235, 228, 200, displayAlpha * 0.25);
    ellipse(s.x, s.y, s.size * 5, s.size * 5);

    // Mid glow — tighter ring of warm light
    fill(240, 235, 210, displayAlpha * 0.55);
    ellipse(s.x, s.y, s.size * 2.5, s.size * 2.5);

    // Star point — small, bright, and sharp
    fill(250, 245, 220, displayAlpha);
    ellipse(s.x, s.y, s.size, s.size);
  }
}

// ── Brush cursor and UI ──────────────────────────────────────────────────────

// Shows a circular cursor so the user can gauge brush size before painting.
// White outline is always visible against the dark night-scene background.
function drawBrushPreview() {
  noFill();
  stroke(255, 255, 255, 160);
  strokeWeight(1.5);
  ellipse(mouseX, mouseY, brushRadius * 2, brushRadius * 2);

  // Small centre dot marks the exact point registered as the stroke position
  fill(255, 255, 255, 130);
  noStroke();
  ellipse(mouseX, mouseY, 4, 4);
}

// Returns a colour drawn from the painting's night palette at position (x, y).
// Sky area → cool silver-blue; ocean surface → bright teal; deep water → dark navy.
function sceneColourAt(x, y) {
  let horizonY = height * 0.45;

  if (y < horizonY) {
    // Upper sky is cooler silver; colour warms gradually toward the sea horizon
    let blend = map(y, 0, horizonY, 0, 1);
    return {
      r: int(lerp(210, 140, blend)),
      g: int(lerp(218, 170, blend)),
      b: int(lerp(238, 200, blend))
    };
  } else {
    // Bright teal at the ocean surface deepens to near-black navy at the bottom
    let blend = map(y, horizonY, height, 0, 1);
    return {
      r: int(lerp(70, 12, blend)),
      g: int(lerp(130, 38, blend)),
      b: int(lerp(170, 62, blend))
    };
  }
}

// Shows context-aware instructions that change based on where the cursor is
function drawInputInstructions() {
  noStroke();
  fill(255, 200);
  textSize(14);

  let nothingPlaced = userPaintStrokes.length === 0
    && waterRipples.length === 0
    && paintedStars.length === 0;

  if (nothingPlaced) {
    // First-time hint: introduce all three gestures at once
    text("drag to paint  |  tap sky for stars  |  tap ocean for ripples  |  scroll to resize  |  C to clear", 30, height - 30);
  } else if (mouseY < height * 0.45) {
    text("sky  —  tap to place a star  |  drag to paint  |  C to clear", 30, height - 30);
  } else {
    text("ocean  —  tap to create ripples  |  drag to paint  |  C to clear", 30, height - 30);
  }
}

// ── Input event handlers ─────────────────────────────────────────────────────

function mousePressed(event) {
  // Use the native browser event.button: 0 = left, 1 = middle, 2 = right.
  // Avoids relying on p5.js's LEFT constant which can behave unexpectedly.
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
    // Short tap: spawn context-aware effect based on where in the scene the click landed
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

// Scroll wheel resizes the brush in real time; return false stops the page from scrolling
function mouseWheel(event) {
  brushRadius = constrain(brushRadius - event.delta * 0.04, 4, 55);
  return false;
}

// Press C to wipe all user marks and reveal the base scene underneath
function keyPressed() {
  if (key === 'c' || key === 'C') {
    userPaintStrokes = [];
    waterRipples = [];
    paintedStars = [];
    activeStroke = null;
  }
}

function resizeInputMechanic() {
  // Strokes, ripples, and stars are stored as absolute pixel coordinates;
  // they stay in place and need no repositioning when the canvas resizes
}
