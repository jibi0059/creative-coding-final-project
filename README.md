# Moonlight Drift🌝
### An Interactive Reinterpretation of *A Seascape, Shipping by Moonlight* by Claude Monet

Below is a team pitch for the IDEA9103 Creative Coding Final Project. Monet’s atmospheric nocturnal seascape is transformed into a living, breathing digital environment driven by sound, time, generative motion, and audience interaction.

---

## Part 1: Inspiration⛵️

The outcome will reinterpret an existing artwork.

**Artwork**: *A Seascape, Shipping by Moonlight* (c. 1864) by **Claude Monet**

![A Seascape, Shipping by Moonlight](images/monet_original.jpg)
*Claude Monet, A Seascape, Shipping by Moonlight, c. 1864. National Galleries of Scotland.*

### Vision

The artwork is heavily inspired by A Seascape, Shipping by Moonlight by Claude Monet, the existing artwork selected for reinterpretation in this project. Rather than directly recreating the painting, the project transforms it into a living atmospheric environment using p5.js. The project explores how sound, movement, time, and interaction can influence the emotional condition of the seascape. Inspired by generative ocean simulations, cinematic fog systems, and atmospheric visual effects commonly found in interactive storytelling, the design focuses on immersion and environmental transformation.

Instead of presenting the artwork as a single frozen moment, the experience continuously evolves through interaction, environmental shifts, and atmospheric transitions. Through the transformation of the painting into a living system, the project aims to create a more emotional, immersive, and experiential interpretation of Monet’s original work.

---

## Part 2: Techniques

The project combines multiple p5.js techniques to transform Monet’s A Seascape, Shipping by Moonlight from a static painting into a living and interactive digital environment. Each mechanic contributes a different computational approach while sharing a common visual space.

### Time-Based Animation

...

### Perlin Noise and Generative Motion

...

### Audio Input and Sound Mapping

The audio mechanic uses the p5.Sound library and p5.AudioIn() to capture live microphone input. Sound levels are analysed using mic.getLevel() and mapped to environmental variables through interpolation and value remapping. Louder sounds increase wave height, wave speed, foam intensity, rainfall, and lightning activity, while quieter sounds gradually return the environment to a calmer state. Rather than visualising sound directly, audio is translated into environmental behaviour to create a more immersive experience.

### User Interaction

...

### Generative Systems and Randomness

Generative techniques are used throughout the project to create variation and prevent repetitive behaviour. Randomised values control the movement, position, timing, and appearance of environmental elements such as clouds, rain, ripples, foam, and atmospheric effects. This ensures that the artwork continuously changes over time and that no two interactions produce exactly the same outcome.

### Layered Visual Composition

The project is constructed using multiple visual layers that are rendered sequentially within a shared p5.js canvas. The time-based sky forms the background, Perlin-generated clouds and ocean create environmental motion, audio-driven storm effects modify the atmosphere, and user-generated interactions sit above these layers. This layered approach allows each mechanic to operate independently while contributing to a unified visual experience.

Together, these techniques transform Monet’s original painting into a responsive digital environment that evolves through time, sound, generative motion, and audience interaction.

---

## Part 3: Mechanics and Presentation🛠️

| Team Member | Mechanic |
|---|---|
| **Mingtao Qu** | Time-based |
| **Larry Hao** | Audio |
| **Yiming Wang** | Perlin Noise + Randomness |
| **Jiale Bi** | User Input |

---

### ⏱️ Time-based — Mingtao Qu

My mechanic mainly focuses on the changing sky and lighthouse through a time-based system. The original artwork presents a dramatic nighttime seascape. I want to reinterpret this originally static painting as a dynamic environment that continuously changes over time. By creating a time cycle in p5.js, the sky will transition through different stages of the day, including dawn, daytime, sunset, and nighttime. At the same time, the clouds, sun, moon, and stars in the sky will gradually change throughout the cycle, creating different visual atmospheres and scene variations.

The lighthouse will also respond to the passage of time. During the daytime, the lighthouse light will appear faint or remain inactive. As the environment gradually shifts into nighttime, the lighthouse will begin glowing and flashing rhythmically, simulating realistic harbour lighting effects. This mechanic allows "time" itself to become part of the visual storytelling. Rather than simply recreating a single frozen moment from the original painting, our project transforms it into a living and continuously evolving scene.


---

### 🎵 Audio — Larry Hao

The Audio Mechanic introduces a sound-reactive storm ocean that transforms the painting from a calm seascape into a dynamic and responsive environment. Using live microphone input, voice, clapping, and surrounding sounds are translated into environmental changes rather than traditional audio visualisations. As sound levels increase, waves become larger and more energetic, foam becomes more visible, rainfall intensifies, and occasional lightning appears across the sky. When sound levels decrease, the storm gradually settles, allowing the ocean to return towards a calmer state through smooth transitions that preserve the atmosphere of the artwork.

The mechanic creates a sense of participation by allowing human presence to influence the landscape in real time. Rather than directly controlling an object, sound becomes a force that shapes the behaviour and mood of the environment. Quiet moments create a calmer and more reflective atmosphere, while louder sounds generate a more dramatic and expressive storm. This contrast between calm and turbulence transforms the ocean from a static visual element into a living component of the artwork, encouraging exploration and creating a stronger connection between the audience and the painting.

---

### 🌊 Perlin Noise + Randomness — Yiming Wang

Perlin Noise is used to create natural and smooth flowing movements for the sea and clouds in this artwork. It generates soft, organic changes that make the waves gently rise, fall, ripple, and churn in a realistic way, giving the water a lively and restless feeling. At the same time, the dark storm clouds slowly drift, swirl, and change shape across the sky. This helps bring the original painting to life. The classic artwork shows a dramatic stormy sea and heavy clouds. With Perlin Noise, the water and sky are no longer static — they move continuously and feel alive. Meanwhile, as the boat moves when clicked, the sea surface creates ripples and waves trailing behind it, giving users more visual feedback in response to their input.

This direct interaction makes the audience feel connected to the sea, as if their actions can stir nature’s energy. Together with the ever‑moving clouds and churning waves driven by Perlin Noise, the artwork transforms from a static painting into a living, breathing digital world. Viewers not only witness the power of the ocean but also leave their own trace upon it, deepening their sense of presence and the passage of time.

---

### 🖱️ User Input — Jiale Bi

The User Input mechanic lets the audience directly drive the scene with the mouse and keyboard. Clicking and dragging the sun or moon scrubs the time-of-day cycle forwards or backwards, so the viewer can control sunrise, noon, sunset and night by hand. Clicking and dragging the boat lets the audience reposition it across the sea. A hover highlight shows which element is interactive. Pressing SPACE pauses the entire sketch and R resets the scene. This mechanic 
connects to our vision of "unfreezing" Monet's painting—instead of watching time pass on its own, the audience physically takes hold of the sun, moon and boat, becoming the author of each moment in the seascape.

---

## Part 3: Putting It Together👍

All four mechanics share a single canvas representing Monet’s seascape, layered from background to foreground: the time-based sky and lighthouse in the background, the Perlin-driven sea and clouds in the middle ground, the audio-driven waves and fog modulating motion throughout the environment, and the user-input ripples in the foreground. These mechanics actively influence one another—audio intensity amplifies Perlin wave motion, user-generated ripples temporarily disturb the water surface, and the time cycle affects every layer, from the sky and sea to the lighthouse glow.

The project is unified through a single concept: **Monet’s painting is no longer frozen—it lives, breathes, and responds to interaction.**

---

## Part 4: Interaction Instructions

### Experiencing the Artwork

Moonlight Drift is designed as an interactive seascape that responds to time, sound, motion, and audience participation.

### 🎵 Sound-Reactive Storm

* Click START MIC to enable microphone access.
* Speak, clap, or make sounds near the microphone.
* Louder sounds create larger waves, stronger foam, heavier rain, and occasional lightning.
* Quieter moments allow the storm to gradually settle and return towards a calmer state.

### ⏱️ Time and Environment

* Click and drag the sun or moon to manually adjust the time of day.
* Observe how the sky, stars, clouds, colours, and lighthouse change throughout the day-night cycle.
* The environment continuously evolves even when no interaction occurs.

### 🌊 Ocean Motion

* Watch the sea and clouds move through Perlin Noise-based animation.
* Ocean movement, cloud behaviour, and atmospheric effects are continuously generated, creating a living environment that never appears exactly the same twice.

### 🖱️ Direct Interaction

* 

### 🔍 Individual Mechanics

* Use the mechanic toggle buttons to enable or disable individual systems.
* This allows each mechanic to be viewed independently or as part of the complete interactive artwork

---

## Part 5: AI Acknowledgement

**Jiale Bi (User Input):** 

I used Claude (AI) to help plan the overall structure of my mechanic and to review my code for errors. 

All of the code was written and implemented by me.

**Larry Hao (Audio):** 

ChatGPT by OpenAI was used as a supplementary tool throughout this project. The mechanics were developed using concepts and techniques learned during IDEA9103 lectures and tutorials, alongside external resources such as p5.js.org, including p5.js animation, interaction, generative systems, and audio input.

ChatGPT assisted with debugging code, resolving technical issues, exploring alternative p5.js approaches, and improving code organisation and presentation. AI-generated suggestions were reviewed, tested, and refined before being integrated into the final project. Final creative decisions, implementation, and project development remained the responsibility of the project creator.

**Yiming Wang (Perlin Noise + Randomness):** 

In this project, I used Codex as a coding assistant during the development of my Perlin noise mechanic. Codex was mainly used to help me organise the code structure, connect my mechanic with the group’s shared sketch.js system, and adjust the code so it worked correctly with other teammates’ input and time mechanics.

I also used Codex to help identify and fix errors, such as function name mismatches, variable naming issues, layer ordering problems, and interaction bugs related to the moving boat and ripple effect. AI mainly served as an auxiliary tool; the final code design, visual adjustments, implementation methods, and development work were all completed by myself.