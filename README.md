# Moonlight Drift
### An Interactive Reinterpretation of *A Seascape, Shipping by Moonlight* by Claude Monet

This README documents the final IDEA9103 Creative Coding Major Project. Monet’s atmospheric nocturnal seascape is transformed into a living, breathing digital environment driven by sound, time, generative motion, and audience interaction.

---

## Part 1: Inspiration

The project reinterprets an existing artwork.

**Artwork**: *A Seascape, Shipping by Moonlight* (c. 1864) by **Claude Monet**

![A Seascape, Shipping by Moonlight](images/monet_original.jpg)
*Claude Monet, A Seascape, Shipping by Moonlight, c. 1864. National Galleries of Scotland.*

### Vision

The artwork is heavily inspired by *A Seascape, Shipping by Moonlight* by Claude Monet, the existing artwork selected for reinterpretation in this project. Rather than directly recreating the painting, the project transforms it into a living atmospheric environment using p5.js. The project explores how sound, movement, time, and interaction can influence the emotional condition of the seascape. Inspired by generative ocean simulations, cinematic fog systems, and atmospheric visual effects commonly found in interactive storytelling, the design focuses on immersion and environmental transformation.

Instead of presenting the artwork as a single frozen moment, the experience continuously evolves through interaction, environmental shifts, and atmospheric transitions. Through the transformation of the painting into a living system, the project aims to create a more emotional, immersive, and experiential interpretation of Monet’s original work.

---

## Part 2: Techniques

The project combines several p5.js techniques to transform Monet's *A Seascape, Shipping by Moonlight* from a static painting into a living and interactive digital environment. Each mechanic has its own script file and contributes a different kind of behaviour to the shared canvas.

### Time-Based Animation

The time-based mechanic uses a repeating p5.js time cycle to move the scene through night, dawn, day, dusk, and back to night. A shared scene state controls the sky colour, sun position, moon position, star visibility, boat movement, lighthouse body colour, lighthouse beam, and light reflections, so all of these elements remain synchronized.

Interpolation is used throughout this mechanic to avoid sudden visual jumps. For example, `lerp()` gradually moves the sun and moon along their arcs, while colour interpolation blends the sky and celestial colours between night, sunrise, midday, sunset, and moonlight. The lighthouse also uses the same time cycle: it remains inactive in daylight, then begins glowing at night and sweeps a soft beam across the sea. This makes time feel like an active force within the artwork rather than a simple background animation.

### Perlin Noise and Generative Motion

Perlin noise is used to create smooth and natural movement throughout the ocean and cloud systems. Unlike abrupt random values, Perlin noise produces gradual changes, which helps the water and clouds feel more organic. In the ocean, generated marks and particles move through noise-based motion fields to suggest flowing water, shifting currents, foam, and wave energy. In the sky, cloud forms drift and change slowly so they sit naturally over the time-based sky.

Random values are used by the Perlin mechanic to vary the initial positions, sizes, speeds, lifespans, and visual qualities of waves, particles, and clouds. These generated elements are recycled over time, so the sea continues to evolve without repeating exactly. This gives the scene a more painterly and unstable surface, echoing the brushwork and atmosphere of the source painting.

### Audio Input and Sound Mapping

The audio mechanic uses the p5.Sound library and `p5.AudioIn()` to capture live microphone input. Sound levels are analysed with `mic.getLevel()` and mapped to environmental variables using `map()`, `constrain()`, and smoothing values. Louder sounds increase the intensity of the storm ocean, including stronger wave motion, more foam, heavier rain, and lightning effects. Quieter sound levels gradually return the atmosphere toward a calmer state.

Rather than visualising sound as a separate equaliser or waveform, the project translates audio into environmental behaviour. Human voices, clapping, and surrounding sounds become forces that affect the weather and sea surface, allowing the audience to shape the mood of the seascape in real time.

### User Interaction

User interaction allows the audience to directly control parts of the seascape through mouse and keyboard input. Mouse movement and clicking are used to detect when the viewer hovers over or drags the sun, moon, or boat. Dragging the sun or moon manually adjusts the time-of-day cycle, while dragging the boat repositions it across the sea. Visual hover highlights guide the audience toward interactive elements.

The input mechanic also uses keyboard controls, allowing the user to press SPACE to pause or resume the experience and R to reset the scene. It connects to the time system so the audience can temporarily take control of the sky cycle while the wider scene remains coherent. This turns the audience from passive viewers into active participants who can shape the atmosphere of the artwork.

### Generative Systems and Randomness

Generative techniques are used throughout the project to create variation and prevent repetitive behaviour. Randomised values and reusable particle systems control the movement, position, timing, and appearance of clouds, rain, ripples, foam, storm marks, and atmospheric effects. This keeps the artwork changing over time while still remaining visually connected to the same seascape.

### Layered Visual Composition

The project is constructed through multiple visual layers rendered in sequence within a shared p5.js canvas. The time-based sky is drawn first as the background. Perlin-generated clouds and sea movement sit above it, audio-driven storm effects add atmospheric intensity, and the time-based foreground objects such as the lighthouse, land, boat, and light reflections are drawn above the water so they remain visible. User-input highlights and interactions sit on top of these layers. This structure allows each mechanic to stay modular while still forming one unified scene.

Together, these techniques transform Monet’s original painting into a responsive digital environment that evolves through time, sound, generative motion, and audience interaction.

---

## Part 3: Mechanics and Presentation

| Team Member | Mechanic |
|---|---|
| **Mingtao Qu** | Time-based |
| **Larry Hao** | Audio |
| **Yiming Wang** | Perlin Noise + Randomness |
| **Jiale Bi** | User Input |

---

### Time-based — Mingtao Qu

This mechanic focuses on the changing sky and lighthouse through a time-based system. The original artwork presents a dramatic nighttime seascape. This mechanic reinterprets the originally static painting as a dynamic environment that continuously changes over time. By creating a time cycle in p5.js, the sky will transition through different stages of the day, including dawn, daytime, sunset, and nighttime. At the same time, the sun, moon, stars, boat, lighthouse, and light reflections gradually change throughout the cycle, creating different visual atmospheres and scene variations.

The lighthouse will also respond to the passage of time. During the daytime, the lighthouse light will appear faint or remain inactive. As the environment gradually shifts into nighttime, the lighthouse will begin glowing and sweeping across the sea, simulating realistic harbour lighting effects. This mechanic allows "time" itself to become part of the visual storytelling. Rather than simply recreating a single frozen moment from the original painting, our project transforms it into a living and continuously evolving scene.


---

### Audio — Larry Hao

The Audio Mechanic introduces a sound-reactive storm ocean that transforms the painting from a calm seascape into a dynamic and responsive environment. Using live microphone input, voice, clapping, and surrounding sounds are translated into environmental changes rather than traditional audio visualisations. As sound levels increase, waves become larger and more energetic, foam becomes more visible, rainfall intensifies, and occasional lightning appears across the sky. When sound levels decrease, the storm gradually settles, allowing the ocean to return towards a calmer state through smooth transitions that preserve the atmosphere of the artwork.

The mechanic creates a sense of participation by allowing human presence to influence the landscape in real time. Rather than directly controlling an object, sound becomes a force that shapes the behaviour and mood of the environment. Quiet moments create a calmer and more reflective atmosphere, while louder sounds generate a more dramatic and expressive storm. This contrast between calm and turbulence transforms the ocean from a static visual element into a living component of the artwork, encouraging exploration and creating a stronger connection between the audience and the painting.

---

### Perlin Noise + Randomness — Yiming Wang

Perlin Noise is used to create natural and smooth flowing movements for the sea and clouds in this artwork. It generates soft, organic changes that make the waves gently rise, fall, ripple, and churn in a realistic way, giving the water a lively and restless feeling. At the same time, the dark storm clouds slowly drift, swirl, and change shape across the sky. This helps bring the original painting to life. The classic artwork shows a dramatic stormy sea and heavy clouds. With Perlin Noise, the water and sky are no longer static — they move continuously and feel alive. Meanwhile, as the boat moves when clicked, the sea surface creates ripples and waves trailing behind it, giving users more visual feedback in response to their input.

This direct interaction makes the audience feel connected to the sea, as if their actions can stir nature’s energy. Together with the ever‑moving clouds and churning waves driven by Perlin Noise, the artwork transforms from a static painting into a living, breathing digital world. Viewers not only witness the power of the ocean but also leave their own trace upon it, deepening their sense of presence and the passage of time.

---

### User Input — Jiale Bi

The User Input mechanic lets the audience directly drive the scene with the mouse and keyboard. Clicking and dragging the sun or moon scrubs the time-of-day cycle forwards or backwards, so the viewer can control sunrise, noon, sunset and night by hand. Clicking and dragging the boat lets the audience reposition it across the sea. A hover highlight shows which element is interactive. Pressing SPACE pauses the entire sketch and R resets the scene. This mechanic 
connects to our vision of "unfreezing" Monet's painting—instead of watching time pass on its own, the audience physically takes hold of the sun, moon and boat, becoming the author of each moment in the seascape.

---

## Part 4: Putting It Together

All four mechanics share a single canvas representing Monet’s seascape, layered from background to foreground: the time-based sky in the background, the lighthouse and boat as foreground elements, the Perlin-driven sea and clouds in the middle ground, the audio-driven waves and fog modulating motion throughout the environment, and the user-input ripples in the foreground. These mechanics actively influence one another—audio intensity amplifies Perlin wave motion, user-generated ripples temporarily disturb the water surface, and the time cycle affects every layer, from the sky and sea to the lighthouse glow.

The project is unified through a single concept: **Monet’s painting is no longer frozen—it lives, breathes, and responds to interaction.**

---

## Part 5: Interaction Instructions

### Experiencing the Artwork

Moonlight Drift is designed as an interactive seascape that responds to time, sound, motion, and audience participation.

### Sound-Reactive Storm

* Click START MIC to enable microphone access.
* Speak, clap, or make sounds near the microphone.
* Louder sounds create larger waves, stronger foam, heavier rain, and occasional lightning.
* Quieter moments allow the storm to gradually settle and return towards a calmer state.

### Time and Environment

* Watch the automatic day-night cycle move through dawn, daytime, sunset, and night.
* Notice how the sun, moon, stars, boat, lighthouse, and light reflections change with the time cycle.
* Click and drag the sun or moon to manually adjust the time of day.
* At night, watch the lighthouse glow and sweep a soft beam across the sea.
* The environment continuously evolves even when no interaction occurs.

### Ocean Motion

* Watch the sea and clouds move through Perlin Noise-based animation.
* Ocean movement, cloud behaviour, and atmospheric effects are continuously generated, creating a living environment that never appears exactly the same twice.

### Individual Mechanics

* Use the mechanic toggle buttons to enable or disable individual systems.
* This allows each mechanic to be viewed independently or as part of the complete interactive artwork.

### Direct Interaction

* Click **START MIC** to enable microphone interaction.
* Speak, clap, or make sounds to influence the storm environment.
* Click and drag the **sun** or **moon** to control the time of day.
* Click and drag the **boat** to reposition it across the sea.
* Hover over the sun, moon, or boat to discover interactive elements.
* Press **SPACE** to pause or resume the experience.
* Press **R** to reset the scene.

---

## Part 6: AI Acknowledgement

**Mingtao Qu (Time-based):**

I used Codex by OpenAI as a coding assistant while developing my time-based mechanic. Codex helped me organise the code, debug p5.js drawing issues, refine the day-night cycle, and improve the comments.

The final mechanic was reviewed, tested, and adjusted through my own creative decisions. It uses p5.js time functions to control the sky colour cycle, sun and moon movement, star blinking, boat timing, lighthouse lighting, and light reflections.

**Jiale Bi (User Input):** 

I used Claude (AI) to help plan the overall structure of my mechanic and to review my code for errors. 

All of the code was written and implemented by me.

**Larry Hao (Audio):** 

ChatGPT by OpenAI was used as a supplementary tool throughout this project. The mechanics were developed using concepts and techniques learned during IDEA9103 lectures and tutorials, alongside external resources such as p5.js.org, including p5.js animation, interaction, generative systems, and audio input.

ChatGPT assisted with debugging code, resolving technical issues, exploring alternative p5.js approaches, and improving code organisation and presentation. AI-generated suggestions were reviewed, tested, and refined before being integrated into the final project. Final creative decisions, implementation, and project development remained the responsibility of the project creator.

**Yiming Wang (Perlin Noise + Randomness):** 

In this project, I used Codex as a coding assistant during the development of my Perlin noise mechanic. Codex was mainly used to help me organise the code structure, connect my mechanic with the group’s shared sketch.js system, and adjust the code so it worked correctly with other teammates’ input and time mechanics.

I also used Codex to help identify and fix errors, such as function name mismatches, variable naming issues, layer ordering problems, and interaction bugs related to the moving boat and ripple effect. AI mainly served as an auxiliary tool; the final code design, visual adjustments, implementation methods, and development work were all completed by myself.

---

## Part 7: External References

### Claude Monet, A Seascape, Shipping by Moonlight (c. 1864)
National Galleries of Scotland  
https://www.nationalgalleries.org/

Source artwork selected for reinterpretation. The visual composition, atmosphere, colour palette, and maritime setting of the project are inspired by Monet’s original painting.

### p5.js Reference
https://p5js.org/reference/

Used to understand and implement p5.js functions including animation, drawing, interaction, audio input, responsive canvas behaviour, and generative visual systems.

### IDEA9103 Creative Coding Lectures and Tutorials
The University of Sydney

Course lectures, tutorials, and workshop exercises provided the foundation for techniques used throughout the project, including Perlin Noise, generative systems, animation principles, user interaction, and creative coding workflows.
