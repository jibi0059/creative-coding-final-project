class TimeMechanic {
  constructor() {
    // This time-based sky mechanic was developed with help from ChatGPT.
    // It uses millis() to create a repeating natural sky cycle: night, dawn, day, dusk, and back to night.
    // The cycle is intentionally short during development so the full lighting sequence can be reviewed quickly.
    this.cycleLength = 20000;
    this.stars = this.createStars();
  }

  createStars() {
    // Fixed star data. The formula gives stable positions without using random().
    // This keeps the star field deterministic and avoids overlapping with the separate randomness mechanic.
    const stars = [];

    for (let i = 0; i < 85; i++) {
      stars.push({
        xRatio: this.positiveFraction(sin(i * 12.9898) * 43758.5453),
        yRatio: 0.04 + this.positiveFraction(cos(i * 78.233) * 24634.6345) * 0.9,
        size: 1.4 + (i % 4) * 0.45,
        blinkInterval: 1200 + (i % 5) * 420,
        blinkOffset: i * 173
      });
    }

    return stars;
  }

  positiveFraction(value) {
    // JavaScript remainder can be negative, so this keeps generated positions inside 0-1.
    return value - floor(value);
  }

  update() {
    // Convert real elapsed time into a 0-1 loop value.
    // All visible elements read from the same sceneState object so the sky, sun, moon, boat, and shadow stay synchronized.
    const cycleProgress = (millis() % this.cycleLength) / this.cycleLength;
    const dayAmount = this.getDayAmount(cycleProgress);
    const nightAmount = 1 - dayAmount;
    const dawnAmount = this.getTransitionAmount(cycleProgress, 0.12, 0.32);
    const duskAmount = this.getTransitionAmount(cycleProgress, 0.56, 0.76);
    const twilightAmount = max(dawnAmount, duskAmount);

    return {
      cycleProgress,
      dayAmount,
      nightAmount,
      dawnAmount,
      duskAmount,
      twilightAmount,
      sun: this.getSunState(cycleProgress, dayAmount, twilightAmount),
      moon: this.getMoonState(cycleProgress, nightAmount),
      horizonY: height * 0.45
    };
  }

  getDayAmount(progress) {
    // Controls how much daylight is present during the cycle.
    // The value rises during dawn, stays high through the day, and falls during dusk.
    if (progress < 0.12 || progress > 0.76) {
      return 0;
    }

    if (progress < 0.32) {
      return map(progress, 0.12, 0.32, 0, 1);
    }

    if (progress > 0.56) {
      return map(progress, 0.76, 0.56, 0, 1);
    }

    return 1;
  }

  getTransitionAmount(progress, start, end) {
    // Returns a simple linear transition value for dawn and dusk.
    if (progress < start || progress > end) {
      return 0;
    }

    return map(progress, start, end, 0, 1);
  }

  getSunState(progress, dayAmount, twilightAmount) {
    // The sun follows a smooth arc. Its colour and brightness are based on height.
    // The centre starts slightly below the horizon so the sea can visually mask it as it rises and sets.
    const sunTravel = constrain(map(progress, 0.12, 0.76, 0, 1), 0, 1);
    const sunX = lerp(width * 0.08, width * 0.92, sunTravel);
    const sunArc = sin(sunTravel * PI);
    const horizonY = height * 0.45;
    const sunRadius = min(width, height) * 0.046;
    const easedArc = this.smoothStep(sunArc);
    const sunY = lerp(horizonY + sunRadius * 1.05, height * 0.13, easedArc);
    const visibility = constrain(this.smoothStep(sunArc) * 0.88 + twilightAmount * 0.12, 0, 1);
    const warmth = 1 - sunArc;

    return {
      x: sunX,
      y: sunY,
      travel: sunTravel,
      arc: sunArc,
      radius: sunRadius,
      visibility,
      warmth,
      color: this.getSunColor(warmth)
    };
  }

  smoothStep(value) {
    // Smooths motion so rising and setting do not feel abrupt.
    const constrainedValue = constrain(value, 0, 1);
    return constrainedValue * constrainedValue * (3 - 2 * constrainedValue);
  }

  getSunColor(warmth) {
    // Low sun is orange; high midday sun becomes pale gold.
    // Warmth is derived from the sun's height rather than hard time cut-offs, preventing sudden colour jumps near noon.
    const noonSun = color(255, 250, 226);
    const morningGold = color(255, 198, 104);
    const lowSun = color(236, 119, 61);

    if (warmth > 0.45) {
      return lerpColor(morningGold, lowSun, map(warmth, 0.45, 1, 0, 1));
    }

    return lerpColor(noonSun, morningGold, map(warmth, 0, 0.45, 0, 1));
  }

  getMoonState(progress, nightAmount) {
    // The moon only appears during the night and travels on its own arc.
    // It is deliberately offset from the sun so the scene has a clear warm-day / cool-night contrast.
    const nightProgress = progress >= 0.76
      ? map(progress, 0.76, 1, 0, 0.72)
      : map(progress, 0, 0.12, 0.72, 1);
    const constrainedNightProgress = constrain(nightProgress, 0, 1);
    const moonArc = sin(constrainedNightProgress * PI);
    const horizonY = height * 0.45;
    const moonRadius = min(width, height) * 0.04;
    const moonX = lerp(width * 0.08, width * 0.92, constrainedNightProgress);
    const moonY = lerp(horizonY + moonRadius * 0.8, height * 0.12, this.smoothStep(moonArc));
    const visibility = constrain(this.smoothStep(moonArc) * nightAmount, 0, 1);
    const coolness = moonArc;

    return {
      x: moonX,
      y: moonY,
      progress: constrainedNightProgress,
      radius: moonRadius,
      visibility,
      coolness,
      color: this.getMoonColor(coolness)
    };
  }

  getMoonColor(coolness) {
    // Near the horizon the moon is warmer; higher in the sky it becomes cooler.
    // This imitates atmospheric scattering without simulating a physically accurate lunar model.
    const lowMoon = color(206, 190, 150);
    const highMoon = color(224, 235, 246);
    return lerpColor(lowMoon, highMoon, coolness);
  }

  drawSky(sceneState) {
    // Draw order: sky first, then moon/sun, then grain, then sea placeholder.
    // The boat is drawn last so it remains readable as a foreground silhouette.
    this.drawSkyGradient(sceneState);
    this.drawMoon(sceneState);
    this.drawSun(sceneState);
    this.drawStars(sceneState);
    this.drawSkyGrain(sceneState);
    this.drawLighthouse(sceneState);
    this.drawBoat(sceneState);
  }

  drawSkyGradient(sceneState) {
    // The sky uses several vertical colour stops to avoid a flat two-colour gradient.
    // Each stop is recalculated from the current time phase, then interpolated line by line down to the horizon.
    const skyStops = [
      this.getSkyColor(sceneState, 0),
      this.getSkyColor(sceneState, 0.28),
      this.getSkyColor(sceneState, 0.68),
      this.getSkyColor(sceneState, 1)
    ];

    for (let y = 0; y <= sceneState.horizonY; y++) {
      const verticalPosition = y / sceneState.horizonY;
      let skyColor;

      if (verticalPosition < 0.28) {
        skyColor = lerpColor(skyStops[0], skyStops[1], verticalPosition / 0.28);
      } else if (verticalPosition < 0.68) {
        skyColor = lerpColor(skyStops[1], skyStops[2], (verticalPosition - 0.28) / 0.4);
      } else {
        skyColor = lerpColor(skyStops[2], skyStops[3], (verticalPosition - 0.68) / 0.32);
      }

      stroke(skyColor);
      line(0, y, width, y);
    }
  }

  getSkyColor(sceneState, verticalPosition) {
    // Four palettes describe the major times of day.
    // The function blends between palettes in sequence instead of stacking them, which prevents sudden dark-light jumps.
    const nightPalette = [
      color(5, 7, 18),
      color(10, 15, 32),
      color(18, 24, 43),
      color(31, 36, 55)
    ];
    const dayPalette = [
      color(100, 166, 224),
      color(142, 197, 236),
      color(187, 220, 241),
      color(235, 230, 207)
    ];
    const dawnPalette = [
      color(22, 20, 45),
      color(63, 54, 91),
      color(142, 96, 111),
      color(226, 148, 108)
    ];
    const duskPalette = [
      color(16, 17, 41),
      color(55, 49, 86),
      color(126, 81, 96),
      color(207, 111, 78)
    ];

    const index = constrain(floor(verticalPosition * 3.99), 0, 3);
    const progress = sceneState.cycleProgress;

    if (progress < 0.12) {
      return nightPalette[index];
    }

    if (progress < 0.22) {
      return lerpColor(nightPalette[index], dawnPalette[index], map(progress, 0.12, 0.22, 0, 1));
    }

    if (progress < 0.32) {
      return lerpColor(dawnPalette[index], dayPalette[index], map(progress, 0.22, 0.32, 0, 1));
    }

    if (progress < 0.56) {
      return dayPalette[index];
    }

    if (progress < 0.66) {
      return lerpColor(dayPalette[index], duskPalette[index], map(progress, 0.56, 0.66, 0, 1));
    }

    if (progress < 0.76) {
      return lerpColor(duskPalette[index], nightPalette[index], map(progress, 0.66, 0.76, 0, 1));
    }

    return nightPalette[index];
  }

  drawSun(sceneState) {
    // Skip drawing if the sun is below the horizon or not visible.
    // The sun is split into halo, rays, and core so each layer can respond differently to time.
    if (sceneState.sun.visibility <= 0.02) {
      return;
    }

    this.drawSunHalo(sceneState);
    this.drawSunCorona(sceneState);
    this.drawSunCore(sceneState);
  }

  drawMoon(sceneState) {
    // Skip drawing if the moon is not visible during this part of the cycle.
    // The crescent is intentionally cooler and dimmer than the sun to strengthen the day-night contrast.
    if (sceneState.moon.visibility <= 0.02) {
      return;
    }

    this.drawMoonGlow(sceneState);
    this.drawMoonCrescent(sceneState);
  }

  drawMoonGlow(sceneState) {
    // A very soft glow keeps the crescent atmospheric but less intense than the sun.
    // The glow is slightly offset toward the thicker part of the crescent so it does not appear centred on empty space.
    const ctx = drawingContext;
    const glowCenterX = sceneState.moon.x - sceneState.moon.radius * 0.18;
    const glowCenterY = sceneState.moon.y;
    const radius = sceneState.moon.radius * 2.8;
    const alpha = sceneState.moon.visibility;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const gradient = ctx.createRadialGradient(
      glowCenterX,
      glowCenterY,
      sceneState.moon.radius * 0.25,
      glowCenterX,
      glowCenterY,
      radius
    );

    gradient.addColorStop(0, `rgba(222, 233, 244, ${0.32 * alpha})`);
    gradient.addColorStop(0.45, `rgba(149, 173, 207, ${0.11 * alpha})`);
    gradient.addColorStop(1, "rgba(149, 173, 207, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(glowCenterX, glowCenterY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawStars(sceneState) {
    // Stars fade with nightAmount and blink on fixed time intervals.
    // They only appear once the sky is mostly dark, keeping dusk and dawn visually clean.
    if (sceneState.nightAmount <= 0.78) {
      return;
    }

    noStroke();
    const darknessAmount = map(sceneState.nightAmount, 0.78, 1, 0, 1);

    for (const star of this.stars) {
      const blinkProgress = ((millis() + star.blinkOffset) % star.blinkInterval) / star.blinkInterval;
      const blinkAmount = blinkProgress < 0.5
        ? map(blinkProgress, 0, 0.5, 0.35, 1)
        : map(blinkProgress, 0.5, 1, 1, 0.35);
      const starAlpha = 255 * darknessAmount * blinkAmount;

      fill(246, 238, 210, starAlpha);
      circle(star.xRatio * width, star.yRatio * sceneState.horizonY, star.size);
    }
  }

  drawMoonCrescent(sceneState) {
    // The crescent is drawn on an off-screen layer so erasing does not damage the sky.
    // Drawing it directly on the main canvas with erase() would cut holes through the sky, so a temporary layer is safer.
    const moonColor = sceneState.moon.color;
    const alpha = 190 * sceneState.moon.visibility;
    const radius = sceneState.moon.radius;
    const layerSize = ceil(radius * 3.2);
    const moonLayer = createGraphics(layerSize, layerSize);

    push();
    translate(sceneState.moon.x, sceneState.moon.y);
    rotate(-0.12);
    imageMode(CENTER);
    this.drawCrescentLayer(moonLayer, radius, moonColor, alpha);
    image(moonLayer, 0, 0);
    imageMode(CORNER);
    pop();
  }

  drawCrescentLayer(layer, radius, moonColor, alpha) {
    // Draw a full circle, then erase an offset circle to create a crescent.
    // The erased circle is slightly smaller and shifted right, producing a classic crescent silhouette.
    const center = layer.width * 0.5;
    layer.clear();
    layer.noStroke();
    layer.fill(red(moonColor), green(moonColor), blue(moonColor), alpha);
    layer.circle(center, center, radius * 2);
    layer.erase();
    layer.circle(center + radius * 0.48, center - radius * 0.02, radius * 1.82);
    layer.noErase();
  }

  drawSunHalo(sceneState) {
    // Radial gradient creates a soft halo without stacking visible circles.
    // Canvas radial gradients make the light falloff smoother than drawing many transparent circles.
    const ctx = drawingContext;
    const radius = min(width, height) * (0.15 + sceneState.sun.warmth * 0.07);
    const innerRadius = min(width, height) * 0.025;
    const alpha = sceneState.sun.visibility;
    const sunColor = sceneState.sun.color;
    const warmRed = red(sunColor);
    const warmGreen = green(sunColor);
    const warmBlue = blue(sunColor);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const gradient = ctx.createRadialGradient(
      sceneState.sun.x,
      sceneState.sun.y,
      innerRadius,
      sceneState.sun.x,
      sceneState.sun.y,
      radius
    );

    gradient.addColorStop(0, `rgba(255, 252, 233, ${0.92 * alpha})`);
    gradient.addColorStop(0.16, `rgba(${warmRed}, ${warmGreen}, ${warmBlue}, ${0.52 * alpha})`);
    gradient.addColorStop(0.45, `rgba(238, 145, 82, ${0.18 * alpha * sceneState.sun.warmth})`);
    gradient.addColorStop(1, "rgba(238, 145, 82, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sceneState.sun.x, sceneState.sun.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSunCorona(sceneState) {
    // Uneven rays add layered sunlight instead of a perfectly mechanical starburst.
    // The ray lengths and line weights vary by index, which gives the sun a more organic optical-flare quality.
    const rayCount = 24;
    const baseLength = min(width, height) * (0.12 + sceneState.sun.warmth * 0.05);
    const alpha = 30 * sceneState.sun.visibility;

    const sunColor = sceneState.sun.color;

    for (let i = 0; i < rayCount; i++) {
      const angle = (TWO_PI / rayCount) * i + sin(i * 2.13) * 0.08;
      const lengthPattern = 0.5 + 0.5 * sin(i * 1.71 + frameCount * 0.008);
      const length = baseLength * (0.45 + lengthPattern * (i % 4 === 0 ? 0.9 : 0.45));
      const startRadius = min(width, height) * 0.052;
      const endRadius = startRadius + length;
      const weight = i % 6 === 0 ? 2.1 : i % 3 === 0 ? 1.25 : 0.65;
      const rayAlpha = alpha * (i % 4 === 0 ? 1 : 0.46 + lengthPattern * 0.22);

      strokeWeight(weight);
      stroke(red(sunColor), green(sunColor), blue(sunColor), rayAlpha);
      line(
        sceneState.sun.x + cos(angle) * startRadius,
        sceneState.sun.y + sin(angle) * startRadius,
        sceneState.sun.x + cos(angle) * endRadius,
        sceneState.sun.y + sin(angle) * endRadius
      );
    }
  }

  drawSunCore(sceneState) {
    // The sun core is also a radial gradient, so its inner colour changes smoothly.
    // The highlight is offset slightly upward-left to avoid a flat, uniform disc.
    const sunRadius = sceneState.sun.radius * (1 + sceneState.sun.warmth * 0.12);
    const coreAlpha = sceneState.sun.visibility;
    const sunColor = sceneState.sun.color;
    const ctx = drawingContext;

    ctx.save();

    const gradient = ctx.createRadialGradient(
      sceneState.sun.x - sunRadius * 0.18,
      sceneState.sun.y - sunRadius * 0.22,
      0,
      sceneState.sun.x,
      sceneState.sun.y,
      sunRadius
    );

    gradient.addColorStop(0, `rgba(255, 255, 238, ${0.96 * coreAlpha})`);
    gradient.addColorStop(0.45, `rgba(255, 235, 181, ${0.9 * coreAlpha})`);
    gradient.addColorStop(1, `rgba(${red(sunColor)}, ${green(sunColor)}, ${blue(sunColor)}, ${0.68 * coreAlpha})`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sceneState.sun.x, sceneState.sun.y, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSkyGrain(sceneState) {
    // Tiny moving points add subtle texture to the sky without using randomness or Perlin noise.
    // This is a deterministic texture layer, separate from the teammate-owned randomness mechanic.
    strokeWeight(1);

    for (let i = 0; i < 160; i++) {
      const x = (i * 83 + frameCount * 0.09) % width;
      const y = (i * 47) % max(1, sceneState.horizonY);
      const grainAlpha = 5 + sceneState.nightAmount * 10 + sceneState.twilightAmount * 7;

      stroke(255, 244, 220, grainAlpha);
      point(x, y);
    }
  }

  drawBoat(sceneState) {
    // The boat is controlled by time-based light: warm sunlight by day, cool moonlight by night.
    // Its silhouette remains dark, but the highlight and shadow respond to the active celestial light source.
    const boatX = width * 0.42;
    const boatY = sceneState.horizonY + height * 0.22;
    const boatWidth = width * 0.18;
    const boatHeight = height * 0.06;
    const lightColor = this.getMainLightColor(sceneState);
    const lightStrength = this.getMainLightStrength(sceneState);
    const lightPosition = this.getMainLightPosition(sceneState);
    const shadowColor = lerpColor(color(3, 5, 9), color(18, 18, 17), sceneState.dayAmount * 0.18);
    const boatColor = lerpColor(shadowColor, lightColor, lightStrength * 0.16);

    this.drawBoatReflection(boatX, boatY, boatWidth, boatHeight, lightColor, lightStrength, lightPosition, sceneState);
    this.drawBoatShape(boatX, boatY, boatWidth, boatHeight, boatColor, lightColor, lightStrength, 245, true);
  }

  drawBoatShape(boatX, boatY, boatWidth, boatHeight, boatColor, lightColor, lightStrength, alpha, showHighlight) {
    // This helper is reused for the visible boat only; the shadow uses a softer rectangle so it does not look like a duplicate boat.
    const mastX = boatX - boatWidth * 0.08;
    const hullTopY = boatY;
    const hullBottomY = boatY + boatHeight * 0.7;
    const mastTopY = boatY - boatHeight * 2.25;

    noStroke();
    fill(red(boatColor), green(boatColor), blue(boatColor), alpha);

    // Hull shape based on a simple sailboat icon.
    quad(
      boatX - boatWidth * 0.5,
      hullTopY,
      boatX + boatWidth * 0.5,
      hullTopY,
      boatX + boatWidth * 0.32,
      hullBottomY,
      boatX - boatWidth * 0.32,
      hullBottomY
    );

    rect(mastX - boatWidth * 0.012, mastTopY, boatWidth * 0.024, boatHeight * 2.25);

    triangle(
      mastX + boatWidth * 0.025,
      mastTopY,
      mastX + boatWidth * 0.025,
      hullTopY - boatHeight * 0.08,
      boatX + boatWidth * 0.34,
      hullTopY - boatHeight * 0.08
    );

    triangle(
      mastX - boatWidth * 0.035,
      mastTopY + boatHeight * 0.62,
      mastX - boatWidth * 0.035,
      hullTopY - boatHeight * 0.08,
      boatX - boatWidth * 0.34,
      hullTopY - boatHeight * 0.08
    );

    if (showHighlight) {
      stroke(red(lightColor), green(lightColor), blue(lightColor), 125 * lightStrength);
      strokeWeight(2);
      line(boatX - boatWidth * 0.47, hullTopY, boatX + boatWidth * 0.47, hullTopY);
    }

    noStroke();
    fill(red(lightColor), green(lightColor), blue(lightColor), 54 * lightStrength);
    triangle(
      mastX + boatWidth * 0.025,
      mastTopY,
      mastX + boatWidth * 0.025,
      hullTopY - boatHeight * 0.08,
      boatX + boatWidth * 0.34,
      hullTopY - boatHeight * 0.08
    );
  }

  getMainLightColor(sceneState) {
    // Blend between moonlight and sunlight so the boat inherits the current time-of-day colour.
    const sunLight = sceneState.sun.color;
    const moonLight = sceneState.moon.color;
    return lerpColor(moonLight, sunLight, sceneState.dayAmount);
  }

  getMainLightStrength(sceneState) {
    // Moonlight is intentionally weaker than sunlight, making night shadows much subtler than day shadows.
    const sunStrength = sceneState.sun.visibility;
    const moonStrength = sceneState.moon.visibility * 0.75;
    return constrain(max(sunStrength, moonStrength), 0, 1);
  }

  getMainLightPosition(sceneState) {
    // The stronger visible light source determines the direction of the boat's shadow.
    if (sceneState.sun.visibility >= sceneState.moon.visibility * 0.75) {
      return sceneState.sun;
    }

    return sceneState.moon;
  }

  drawBoatReflection(boatX, boatY, boatWidth, boatHeight, lightColor, lightStrength, lightPosition, sceneState) {
    // The reflection shifts opposite the light source, following simple shadow direction logic.
    // This is a stylised water shadow rather than a physically exact reflection.
    const lightDirection = constrain((lightPosition.x - boatX) / width, -1, 1);
    const reflectionOffsetX = -lightDirection * width * 0.035;
    const reflectionTopY = boatY + boatHeight * 0.46;
    const dayReflection = sceneState.sun.visibility * sceneState.dayAmount;
    const nightReflection = sceneState.moon.visibility * sceneState.nightAmount * 0.01;
    const reflectionStrength = constrain(dayReflection + nightReflection, 0, 1);
    const reflectionAlpha = 14 + 176 * reflectionStrength;
    const reflectionColor = color(0, 0, 0);
    const shadowScale = this.getShadowScale(sceneState);

    this.drawSoftBoatReflection(
      boatX + reflectionOffsetX,
      reflectionTopY,
      boatWidth,
      boatHeight,
      reflectionColor,
      reflectionAlpha,
      lightDirection,
      shadowScale
    );
  }

  getShadowScale(sceneState) {
    // Low sun creates larger shadows; high noon sun creates smaller shadows.
    // At night the remaining moon shadow uses a smaller, softer scale.
    const sunScale = map(sceneState.sun.arc, 0, 1, 1.55, 0.72);
    const moonScale = 0.9;
    return lerp(moonScale, sunScale, sceneState.dayAmount);
  }

  drawSoftBoatReflection(reflectionX, reflectionY, boatWidth, boatHeight, reflectionColor, reflectionAlpha, lightDirection, shadowScale) {
    // A soft rectangular shadow avoids looking like a second boat.
    // Multiple transparent rounded rectangles create a blur-like edge using only p5 drawing commands.
    noStroke();

    for (let i = 4; i >= 0; i--) {
      const spread = i * boatHeight * 0.08;
      const alpha = reflectionAlpha * (0.06 + (4 - i) * 0.09);
      const y = reflectionY + i * boatHeight * 0.018;
      const x = reflectionX + lightDirection * i * width * 0.003;
      const rectWidth = (boatWidth * 0.95 + spread * 2.4) * shadowScale;
      const rectHeight = (boatHeight * 0.34 + spread * 1.2) * shadowScale;

      fill(red(reflectionColor), green(reflectionColor), blue(reflectionColor), alpha);
      rect(x - rectWidth * 0.5, y, rectWidth, rectHeight, rectHeight * 0.45);
    }
  }

  drawLighthouse(sceneState) {
    // Draws the lighthouse from the user's SVG geometry.
    // The original SVG uses an 800 by 800 viewBox, so these coordinates are scaled into the p5 canvas.
    const lighthouseX = width * 0.9;
    const baseY = sceneState.horizonY + height * 0.2;
    const towerHeight = height * 0.4;
    const svgVisibleHeight = 689;
    const svgBaseY = 744;
    const svgCenterX = 527.5;
    const scale = towerHeight / svgVisibleHeight;
    const towerColor = this.getLighthouseBodyColor(sceneState);
    const landColor = this.getLighthouseLandColor(sceneState);
    const lanternX = lighthouseX;
    const lanternY = baseY + (169 - svgBaseY) * scale;

    push();
    this.drawLighthouseNightLight(sceneState, lanternX, lanternY, scale);
    this.drawSvgLighthouse(lighthouseX, baseY, scale, svgCenterX, svgBaseY, towerColor, landColor);
    this.drawLighthouseLampGlow(sceneState, lanternX, lanternY, scale);
    pop();
  }

  getLighthouseBodyColor(sceneState) {
    // The tower remains white, but it is tinted by the current environment light.
    // Daylight keeps it bright; night light cools and darkens it so it belongs to the scene.
    const nightWhite = color(116, 128, 148);
    const twilightWhite = color(205, 204, 194);
    const dayWhite = color(255, 255, 255);
    const twilightAmount = sceneState.twilightAmount;

    if (sceneState.dayAmount > 0.55) {
      return lerpColor(twilightWhite, dayWhite, sceneState.dayAmount);
    }

    return lerpColor(nightWhite, twilightWhite, twilightAmount);
  }

  getLighthouseLandColor(sceneState) {
    // The land stays deep grey, with a small lift in daylight and a cooler tone at night.
    const nightLand = color(24, 27, 37);
    const dayLand = color(46, 49, 63);
    return lerpColor(nightLand, dayLand, sceneState.dayAmount);
  }

  drawSvgLighthouse(originX, baseY, scale, svgCenterX, svgBaseY, towerColor, landColor) {
    // Recreates the supplied SVG with p5 primitives instead of loading an external file.
    // x and y values here come directly from the SVG, then are converted by svgX() and svgY().
    const svgX = (x) => originX + (x - svgCenterX) * scale;
    const svgY = (y) => baseY + (y - svgBaseY) * scale;

    noStroke();
    fill(red(landColor), green(landColor), blue(landColor), 255);
    beginShape();
    vertex(svgX(419.158), svgY(583));
    vertex(svgX(800), svgY(583));
    vertex(svgX(800), svgY(744));
    vertex(svgX(197), svgY(744));
    vertex(svgX(230.55), svgY(686.695));
    vertex(svgX(312.159), svgY(670.322));
    vertex(svgX(371.099), svgY(612.107));
    vertex(svgX(399.209), svgY(605.74));
    endShape(CLOSE);

    fill(red(towerColor), green(towerColor), blue(towerColor), 255);
    triangle(svgX(527.5), svgY(55), svgX(606.741), svgY(113.5), svgX(448.259), svgY(113.5));
    rect(svgX(465), svgY(112), 126 * scale, 21 * scale);
    rect(svgX(465), svgY(195), 125 * scale, 29 * scale);

    beginShape();
    vertex(svgX(481.448), svgY(224));
    vertex(svgX(574.552), svgY(224));
    vertex(svgX(609), svgY(583));
    vertex(svgX(447), svgY(583));
    endShape(CLOSE);

    rect(svgX(475), svgY(133), 15 * scale, 62 * scale);
    rect(svgX(567), svgY(133), 14 * scale, 62 * scale);

    this.drawLighthouseVolumeShadow(svgX, svgY, scale, towerColor);

    fill(red(towerColor) * 0.72, green(towerColor) * 0.72, blue(towerColor) * 0.72, 245);
    rect(svgX(513), svgY(159), 29 * scale, 36 * scale, 10 * scale, 10 * scale, 0, 0);
  }

  drawLighthouseVolumeShadow(svgX, svgY, scale, towerColor) {
    // Soft side shadows suggest that the lighthouse body is cylindrical rather than a flat cut-out.
    // The shadow follows the right edge of the tower and stays subtle so the tower still reads as white.
    const shadowRed = red(towerColor) * 0.55;
    const shadowGreen = green(towerColor) * 0.58;
    const shadowBlue = blue(towerColor) * 0.65;

    noStroke();
    fill(shadowRed, shadowGreen, shadowBlue, 42);
    beginShape();
    vertex(svgX(548), svgY(226));
    vertex(svgX(574.552), svgY(224));
    vertex(svgX(609), svgY(583));
    vertex(svgX(565), svgY(583));
    endShape(CLOSE);

    fill(shadowRed, shadowGreen, shadowBlue, 24);
    beginShape();
    vertex(svgX(527), svgY(226));
    vertex(svgX(548), svgY(226));
    vertex(svgX(565), svgY(583));
    vertex(svgX(535), svgY(583));
    endShape(CLOSE);

    fill(shadowRed, shadowGreen, shadowBlue, 28);
    rect(svgX(570), svgY(112), 21 * scale, 21 * scale);
    rect(svgX(570), svgY(195), 20 * scale, 29 * scale);
  }

  drawLighthouseNightLight(sceneState, lanternX, lanternY, scale) {
    // Real lighthouse lamps are most useful after dark, so the beam fades out through daylight.
    // The beam sweeps low across the sea, pivoting from the lantern rather than pointing into the sky.
    const nightVisibility = constrain(map(sceneState.nightAmount, 0.55, 1, 0, 1), 0, 1);

    if (nightVisibility <= 0.01) {
      return;
    }

    const nightProgress = sceneState.cycleProgress >= 0.76
      ? map(sceneState.cycleProgress, 0.76, 1, 0, 0.72)
      : map(sceneState.cycleProgress, 0, 0.12, 0.72, 1);
    const rotation = nightProgress * TWO_PI * 2;
    const sweep = sin(rotation);
    const facingViewer = pow(0.5 + 0.5 * cos(rotation), 1.4);
    const beamAngle = PI - 0.72 + sweep * 0.28;
    const beamLength = width * (0.34 + facingViewer * 0.18);
    const beamThickness = height * (0.055 + facingViewer * 0.035);
    const endX = lanternX + cos(beamAngle) * beamLength;
    const endY = lanternY + sin(beamAngle) * beamLength;
    const normalX = -sin(beamAngle);
    const normalY = cos(beamAngle);
    const ctx = drawingContext;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = `blur(${max(10, scale * 24)}px)`;

    const beamGradient = ctx.createLinearGradient(lanternX, lanternY, endX, endY);
    beamGradient.addColorStop(0, `rgba(255, 244, 198, ${0.28 * nightVisibility})`);
    beamGradient.addColorStop(0.35, `rgba(255, 232, 155, ${0.18 * nightVisibility * facingViewer})`);
    beamGradient.addColorStop(1, "rgba(255, 232, 155, 0)");

    ctx.fillStyle = beamGradient;
    ctx.beginPath();
    ctx.moveTo(lanternX, lanternY);
    ctx.quadraticCurveTo(
      lerp(lanternX, endX, 0.45) + normalX * beamThickness * 0.45,
      lerp(lanternY, endY, 0.45) + normalY * beamThickness * 0.45,
      endX + normalX * beamThickness,
      endY + normalY * beamThickness
    );
    ctx.lineTo(endX - normalX * beamThickness, endY - normalY * beamThickness);
    ctx.quadraticCurveTo(
      lerp(lanternX, endX, 0.45) - normalX * beamThickness * 0.45,
      lerp(lanternY, endY, 0.45) - normalY * beamThickness * 0.45,
      lanternX,
      lanternY
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawLighthouseLampGlow(sceneState, lanternX, lanternY, scale) {
    // The lamp glow is soft and local; the long beam is drawn separately behind the tower body.
    const nightVisibility = constrain(map(sceneState.nightAmount, 0.55, 1, 0, 1), 0, 1);

    if (nightVisibility <= 0.01) {
      return;
    }

    const nightProgress = sceneState.cycleProgress >= 0.76
      ? map(sceneState.cycleProgress, 0.76, 1, 0, 0.72)
      : map(sceneState.cycleProgress, 0, 0.12, 0.72, 1);
    const rotation = nightProgress * TWO_PI * 2;
    const facingViewer = pow(0.5 + 0.5 * cos(rotation), 1.4);

    const glowRadius = scale * 46;
    const glowAlpha = nightVisibility * (95 + facingViewer * 95);
    fill(255, 231, 154, glowAlpha);
    circle(lanternX, lanternY, glowRadius);
    fill(255, 248, 211, nightVisibility * 230);
    circle(lanternX, lanternY, scale * 18);
  }
}

let timeMechanic;

function setupTimeMechanic() {
  // Creates one shared instance for sketch.js to call during the main p5 setup phase.
  timeMechanic = new TimeMechanic();
}

function drawTimeMechanic() {
  // Bridges the class-based time mechanic with the team's function-based sketch.js structure.
  // Recreating the instance only if it is missing makes the preview more tolerant of load-order changes.
  if (!timeMechanic) {
    setupTimeMechanic();
  }

  const sceneState = timeMechanic.update();
  timeMechanic.drawSky(sceneState);
}

function resizeTimeMechanic() {
  // The time mechanic uses width and height directly each frame, so no cached canvas layer needs resizing here.
}
