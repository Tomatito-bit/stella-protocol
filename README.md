# Stella Protocol

**NASA International Space Apps Challenge 2026 · Challenge: Space Mission Design Game**

### ▶ Play: https://stella-protocol.vercel.app

Runs in any modern browser on desktop or phone, with nothing to install. The game opens in English; the **Español** button switches to Spanish.

---

## Summary

**Stella Protocol** is a browser game where you become NASA's Flight Director. You:

1. **Pick a destination**: the Moon's south pole, Mars or Europa.
2. **Choose a commander**.
3. **Design your spacecraft** within a real budget and mass limit.
4. **Defend it in a Flight Readiness Review**, where each Mission Control console votes GO or NO-GO.
5. **Launch it** and **live the mission day by day**.

Every morning you assign a job to each crew member, manage oxygen, water, food and power, repair failing systems, explore the surface with NASA-style vehicles, and decide how to face events. All the events are based on real NASA hazards and missions: solar storms, micrometeoroids, CO₂ scrubber failures, crew conflicts, a rover stuck in sand, and more. Each decision teaches the real fact behind it.

## Why it matters

Mission design is a chain of trade-offs that most people never see: mass against shielding, science against safety, schedule against crew health. Stella Protocol turns those trade-offs into play. To succeed, you must think like a NASA engineer and flight director:

- Keep margins.
- Avoid single-point failures.
- Respect the GO/NO-GO process.
- Protect the crew from the five hazards of human spaceflight.

These are the same ideas NASA uses, and losing a mission teaches the real lesson NASA learned from a similar failure.

## How it works

| Phase | What the player does | The real NASA concept behind it |
|---|---|---|
| Destination | Moon, Mars or Europa, each with budget, distance, signal delay and radiation | Mission objectives and environment |
| Crew | Four astronauts with different roles and command styles | Crew roles, team dynamics |
| Design | Build the spacecraft with power, propulsion, comms, instruments, life support, shielding and exploration vehicles | Mass, power and cost budgets; redundancy |
| Review | Seven Mission Control consoles (FIDO, EECOM, INCO, SURGEON, SRAG…) poll GO/NO-GO, plus a 5×5 risk matrix | Flight Readiness Review, risk management |
| Launch | Cinematic launch: staging, fairing separation, cruise, orbit insertion | Launch sequence |
| Mission | Daily logbook with jobs, consumables, failing systems, live events, surface exploration and story | Operations, the five hazards of human spaceflight, life support |
| Legacy | Endings, crew epilogues and the real lesson behind each kind of failure | Lessons learned |

**Highlights**
- **Real data and real stories.** Each event cites what really happened: Apollo 13's improvised CO₂ filter, Spirit stuck in Martian sand (2009), Perseverance's "Cheyava Falls" rock (2024), Ingenuity's 72 flights, LRO's lunar pits and the first ISS medical evacuation (2026).
- **"Classified files".** These rare events are built on popular myths about what NASA hides: the Face on Mars, the Black Knight satellite and the Wow! signal. Investigating one reveals the scientific explanation.
- **Surface exploration.** On a hand-drawn logbook map you pick where the rover drives: each real site has its distance, risk and reward. You collect rock samples (clay, olivine, sulfur, water ice…), each with the real discovery behind it, and you can complete the collection for a special ending. Events can open time-limited rover missions, such as a meteorite spotted from orbit, a methane spike or a silent Ingenuity.
- **Everything is visible.** The 3D ship interior shows the crew walking to their jobs. Failures flash red, events play out live in orbit or on the surface, and the rover drives across real-named sites.
- **Accessible.** It runs in a browser, adapts graphics quality to the device, works in English and Spanish, and includes a 4-card tutorial.

## Space agency data and resources used

| NASA resource | How we used it |
|---|---|
| [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources): Mars 2020 Perseverance Rover, Ingenuity Mars Helicopter, Apollo Lunar Module | Exploration vehicles in the 3D surface view (lightened in Blender for the web) |
| [NASA SVS – CGI Moon Kit](https://svs.gsfc.nasa.gov/4720) (LRO / LROC data) | Moon globe texture |
| Mars Viking MDIM 2.1 colour mosaic (NASA / USGS) | Mars globe and surface texture |
| Europa Voyager–Galileo SSI mosaic (NASA / JPL / USGS) | Europa globe texture |
| [NASA Human Research Program – five hazards of human spaceflight](https://www.nasa.gov/hrp/hazards) and [HRP risks](https://www.nasa.gov/hrp/risks) | Crew health model: radiation, isolation, distance, gravity and closed environments |
| [NASA Systems Engineering Handbook](https://www.nasa.gov/sites/default/files/atoms/files/nasa_systems_engineering_handbook_0.pdf) and NPR 7123.1 | Mission life cycle, Flight Readiness Review and risk matrix |
| NASA mission records (Apollo, Spirit, Curiosity, Perseverance, Ingenuity, LRO, Europa Clipper, Juno, Galileo, Mars Climate Orbiter, ISS) | Event facts, endings and the "real lesson" behind each failure |

Full research notes with links are in [`research/`](research/).

## Use of AI

The team designed the game and directed every decision. Most of the code, the Blender processing scripts and the text were written with the help of an AI coding assistant (Anthropic's Claude), working under the team's direction. The team reviewed every feature in the game and fact-checked the facts shown to players against the sources listed in `research/`. No AI-generated images or audio are used. The music is synthesized live in code, and the 3D astronauts and ship were modelled in Blender.

## Built with

- **Game:** React 19, Vite, Three.js through @react-three/fiber and @react-three/drei, zustand.
- **Graphics:** procedural shaders (the Earth is generated and baked on the GPU), Blender 5.3 for the astronauts, the ship deck and the NASA model optimization.
- **Sound:** Web Audio API, with an original organ score and sound effects synthesized in code (no audio files).
- **Quality:** oxlint, plus an automated test suite of about 87,000 checks (thousands of simulated missions, collision tests for the crew's walking paths, translations and assets) and a browser smoke test.
- **Hosting:** Vercel, deployed automatically from this repository.

## Run it locally

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run check      # logic, data and translation tests
npm run check:ui   # browser smoke test (needs the dev server running)
npm run build      # production build in app/dist
```

## Repository structure

| Folder | Contents |
|---|---|
| `app/` | Game source code |
| `app/public/models` | 3D models: astronaut and ship deck (made in Blender), and the lightened NASA vehicles |
| `assets/` | Source files: Blender scenes and texture sources |
| `research/` | NASA research behind the game, with sources |
| `docs/game-design/` | Game design notes |
| `docs/SUBMISSION.md` | Text and checklist for the Space Apps project page |

## Credits and references

- **3D vehicles:** [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources), free to use under the [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).
- **Planet textures:** NASA SVS, NASA / USGS and NASA / JPL / USGS, all public domain. See [`assets/textures/SOURCES.md`](assets/textures/SOURCES.md).
- **Fonts:** Space Grotesk, Orbitron and Caveat from Google Fonts (SIL Open Font License).
- **Libraries:** React, Vite, Three.js, @react-three/fiber, @react-three/drei and zustand (MIT License).
- **Research sources:** see [`research/05-sources.md`](research/05-sources.md) and [`research/09-fan-theories.md`](research/09-fan-theories.md).
- The NASA logo is not used, and this project is not endorsed by NASA.

> A Spanish twin of this repository exists for the team's local work. Everything submitted is in English.
