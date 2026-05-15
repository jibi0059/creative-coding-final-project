# Moonlight Drift
### An Interactive Reinterpretation of *A Seascape, Shipping by Moonlight* by Claude Monet

A team pitch for our IDEA9103 Creative Coding final project. We transform Monet's atmospheric nocturnal seascape into a living, breathing digital environment driven by sound, time, generative motion, and audience interaction.

---

## Part 1: Project Direction

**Project path**: Option 1 — Reinterpret an existing artwork

**Artwork**: *A Seascape, Shipping by Moonlight* (c. 1864) by **Claude Monet**

![A Seascape, Shipping by Moonlight](images/monet_original.jpg)
*Claude Monet, A Seascape, Shipping by Moonlight, c. 1864. National Galleries of Scotland.*

### Our Vision

Our team has been heavily inspired by *A Seascape, Shipping by Moonlight* by Claude Monet as the existing artwork chosen for reinterpretation in this project. Rather than directly recreating the painting, we aim to transform it into a living atmospheric environment using p5.js. The project explores how sound, movement, time, and interaction can influence the emotional condition of the seascape. Inspired by generative ocean simulations, cinematic fog systems, and atmospheric visual effects seen in interactive storytelling, our design focuses on immersion and environmental transformation. Instead of presenting the artwork as a single frozen moment, our goal is to create a continuously evolving experience where the seascape gradually changes through interaction, environmental shifts, and atmospheric transitions. By transforming the painting into a living system, we aim to create a more emotional, immersive, and experiential interpretation of Monet's original work.


---

## Part 2: Mechanics

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


---

### 🌊 Perlin Noise + Randomness — Yiming Wang

Perlin Noise is used to create natural and smooth flowing movements for the sea and clouds in this artwork. It generates soft, organic changes that make the waves gently rise, fall, ripple, and churn in a realistic way, giving the water a lively and restless feeling. At the same time, the dark storm clouds slowly drift, swirl, and change shape across the sky. This helps bring the original painting to life. The classic artwork shows a dramatic stormy sea and heavy clouds. With Perlin Noise, the water and sky are no longer static — they move continuously and feel alive. Viewers can see the powerful ocean waves and the changing clouds, which creates a stronger sense of nature's energy, movement, and the passing of time. It turns the still painting into a dynamic and breathing digital experience.


---

### 🖱️ User Input — Jiale Bi

The User Input mechanic turns the audience's cursor into the **wind that animates Monet's frozen seascape**. As the mouse moves across the canvas, ripples spread outward from the cursor—gentle when slow, turbulent when fast—using mouse velocity to control intensity. Clicking on the water generates expanding concentric ripples that propagate outward and fade, temporarily breaking the moon's golden reflection into shimmering fragments. Clicking on the sky "blows" clouds apart, briefly revealing the moon. Keyboard inputs shift the mood: `1`, `2`, `3` switch between calm moonlight, stormy weather, and pre-dawn warmth; `SPACE` pauses everything; `R` resets the canvas. This mechanic serves our vision of *unfreezing* Monet's painting—the audience becomes a participant who breathes life into the canvas, leaving a unique trail of ripples with every visit.


---

## Part 3: Putting It Together👍

All four mechanics share a single canvas representing Monet's seascape, layered from background to foreground: the Time-based sky and lighthouse at the back, the Perlin-driven sea and clouds in the middle, the Audio-driven waves and fog modulating motion throughout, and the User Input ripples on top. The mechanics actively influence one another—audio intensity amplifies Perlin wave motion; user ripples temporarily disturb the Perlin water surface; the time cycle colours every layer, from sky to sea to lighthouse glow. Conceptually, the project is held together by one idea: **Monet's painting is no longer frozen — it lives, breathes, and responds to you.**

---
