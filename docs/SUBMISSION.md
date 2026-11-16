# Space Apps project page: ready-to-paste text and checklist

This follows the official Project Submission Guide and the Judging & Awards Guide. Fields marked * are required on the form, and everything must be in **English**.

---

## Project Title *
Stella Protocol

## High-Level Project Summary *
Stella Protocol is a browser game where you become NASA's Flight Director. You choose a destination (the Moon's south pole, Mars or Europa) and design a spacecraft within a real budget and mass limit. Then you defend it before Mission Control in a GO/NO-GO Flight Readiness Review, launch it, and live the mission day by day. Each morning you assign jobs to the crew, manage oxygen, water, food and power, repair failing systems, explore the surface with NASA-style vehicles, and decide how to face events based on real NASA hazards and missions. Every choice teaches the real fact behind it, so players learn why mission design is a chain of trade-offs: margins, redundancy, crew health and science.

## Link to Final Project *
https://github.com/Tomatito-bit/stella-protocol
(Playable at https://stella-protocol.vercel.app. Paste the repository here, and add the playable link in the description.)

## Link to Project Demo *
> TODO (team): ONE public link only. Either:
> - a video of **30 seconds or less**, with **English subtitles** if anyone speaks another language (YouTube, Google Drive or GitHub, set to public, no sign-in), or
> - **7 slides or fewer**, written in English.
>
> Judges stop at 30 s or slide 7, and the link must open without asking for permission.

## Detailed Project Description *
**What it does:** Stella Protocol is a mission-design and survival game in seven phases:

1. **Destination.** Moon, Mars or Europa, each with its own budget, distance, sunlight, signal delay and radiation.
2. **Crew.** Four astronauts with roles and command styles.
3. **Design.** Power, propulsion, comms, instruments, life support, shielding and exploration vehicles, under budget and launcher mass limits.
4. **Flight Readiness Review.** Seven Mission Control consoles vote GO or NO-GO, with a 5×5 risk matrix.
5. **Launch.** A cinematic launch with staging and orbit insertion.
6. **Mission.** A daily logbook where you assign jobs, manage consumables, repair systems, explore real sites and react to live events.
7. **Legacy.** Endings and crew epilogues, plus the real lesson NASA learned from each kind of failure.

**How it works:** the game runs entirely in the browser.
- **3D:** Three.js through React Three Fiber.
- **Simulation:** a seeded mission model tracks each crew member's health, energy and morale, along with radiation dose, electronics, five ship systems (wear and random failures), oxygen, water, food and power.
- **Events:** about 40 events drawn from NASA history and research, plus rare "classified files" that debunk popular myths. Each one shows the real fact. The odds change with the destination, the spacecraft design and the commander's style.
- **3D views:** the orbit view, the ship interior with astronauts walking door to door to their jobs, and a surface view with NASA's Perseverance, Ingenuity and Apollo LM models.

**Benefits and goals:** the game makes NASA's engineering mindset playable for students and the public. Choices like margins, redundancy, GO/NO-GO discipline and protecting the crew from the five hazards of human spaceflight become decisions with visible consequences. Our goal is that players leave knowing why missions are designed the way they are.

**Tools:**
- **Code:** JavaScript, React 19, Vite, Three.js / @react-three/fiber / @react-three/drei, zustand, Web Audio API.
- **3D:** Blender 5.3 to model the astronauts (from a Google Gemini reference image) and the ship, and to optimize NASA's models.
- **Hosting:** Vercel.
- **Testing:** oxlint plus an automated suite of about 87,000 checks and a browser smoke test.
- **AI assistance:** Anthropic's Claude helped write code and text under the team's direction, and Google Gemini generated the reference image for the astronauts, which the team modelled in Blender. See "Use of AI" in the README.
- **Design reference:** the home screen was inspired by a design found on Pinterest.

## Space Agency Data *
- **NASA 3D Resources:** Mars 2020 Perseverance Rover, Ingenuity Mars Helicopter and Apollo Lunar Module models, used as exploration vehicles in the 3D surface view.
- **NASA SVS CGI Moon Kit (LRO/LROC):** Moon texture.
- **Viking MDIM 2.1 mosaic (NASA/USGS):** Mars texture.
- **Voyager–Galileo mosaic (NASA/JPL/USGS):** Europa texture.
- **NASA Human Research Program:** the five hazards of human spaceflight and HRP risks shape the crew health model.
- **NASA Systems Engineering Handbook and NPR 7123.1:** the mission life cycle, the Flight Readiness Review and the risk matrix.
- **NASA mission records:** Apollo 13, Spirit, Curiosity, Perseverance (Cheyava Falls), Ingenuity, LRO lunar pits, Europa Clipper's radiation vault, Juno, Galileo, Mars Climate Orbiter and the ISS medical evacuation. They provide the event facts and the "real lessons" in the endings.

## Hackathon Journey
> TODO (team): describe it in your own words. Some ideas to start from:
> - why you chose this challenge;
> - how you split the work (research on risks and social problems, game design, 3D and code, pitch);
> - setbacks you solved: performance in the browser, making the logbook feel like a real notebook, keeping astronauts from walking through walls, an event network that blocked GitHub;
> - what you learned;
> - who you want to thank.

## References *
- NASA 3D Resources: https://github.com/nasa/NASA-3D-Resources
- NASA SVS CGI Moon Kit: https://svs.gsfc.nasa.gov/4720
- Mars Viking MDIM 2.1 and Europa Voyager–Galileo mosaics (NASA/USGS/JPL, public domain): see assets/textures/SOURCES.md
- NASA HRP hazards and risks: https://www.nasa.gov/hrp/hazards · https://www.nasa.gov/hrp/risks
- NASA Systems Engineering Handbook: https://www.nasa.gov/sites/default/files/atoms/files/nasa_systems_engineering_handbook_0.pdf
- Full list of research sources: research/05-sources.md and research/09-fan-theories.md
- Libraries (MIT License): React, Vite, Three.js, @react-three/fiber, @react-three/drei, zustand
- Fonts (SIL OFL): Space Grotesk, Orbitron, Caveat (Google Fonts)
- Music and sound effects: original, synthesized in code by the team
- AI assistance: Anthropic Claude (code and text, directed and reviewed by the team) and Google Gemini (reference image for the astronauts, modelled in Blender by the team)
- Home screen: inspired by a reference design found on Pinterest
  > TODO (team): add the Pinterest link or the original creator's name here if you have it.

---

## Submission checklist

- [ ] All team members (6 max) are registered and listed on the project page. Members can't be added after submission closes.
- [ ] Every required field is filled in, in **English**.
- [ ] **Final Project** link (GitHub) opens in a private/incognito window, with no sign-in.
- [ ] **Demo** link opens in a private/incognito window and is ONE link: a video of 30 s or less (with English subtitles if needed) or 7 slides or fewer, in English.
- [ ] The playable link https://stella-protocol.vercel.app is mentioned in the description.
- [ ] Both required boxes are checked: the submission requirements and terms, and the original-work statement with all external resources listed in References.
- [ ] No copyrighted material is used without permission: no NASA logo, original music, and public-domain textures and models, all credited. The Pinterest reference for the home screen is credited in References.
- [ ] Submitted before the deadline, in your local event's time zone.

**Judging criteria:** Impact, Creativity, Validity, Relevance and Presentation. Presentation weighs as much as the others, so the demo matters.
