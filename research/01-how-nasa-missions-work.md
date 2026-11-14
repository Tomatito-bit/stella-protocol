# How a NASA Mission Really Works

## 1. From idea to approved mission
1. **Science priorities.** Roughly every 10 years the science community publishes the *Decadal Surveys*, which rank the most important open questions. Missions like Europa Clipper and Dragonfly come from them.
2. **Announcement of Opportunity (AO).** For small and medium missions, NASA runs cost-capped competitions:
   - **Discovery**: small missions.
   - **New Frontiers**: medium missions, such as Dragonfly.
   - **Flagship**: large missions like Webb and Europa Clipper; these are assigned directly.
3. **Selection.** Teams from universities and centers (JPL, Goddard, APL…) propose missions. They are chosen on science value, technical risk and cost.

## 2. Life cycle: phases and "gates"
NASA splits every project into phases. Each phase ends at a **Key Decision Point (KDP)**, where the project is continued, corrected or cancelled.

| Phase | What happens | Main review |
|---|---|---|
| **Pre-A** · Concept studies | Explore ideas that fit cost and schedule | MCR: is the mission worth it? |
| **A** · Concept and technology development | Requirements and needed technologies | SRR / MDR: are requirements clear? |
| **B** · Preliminary design | Design of each system with margins | **PDR**: does the design work on paper? |
| **C** · Final design and fabrication | Final drawings, parts are built | **CDR**: ready to build? |
| **D** · Assembly, test and launch | Spacecraft integrated and tested (vibration, thermal vacuum) | SIR, ORR, **FRR**: ready to fly? |
| **E** · Operations | Science, maneuvers, communications | Mission extension reviews |
| **F** · Closeout | Safe decommissioning and data analysis | Decommissioning plan |

Acronyms:
- **MCR**: Mission Concept Review.
- **SRR**: System Requirements Review.
- **MDR**: Mission Definition Review.
- **PDR**: Preliminary Design Review.
- **CDR**: Critical Design Review.
- **SIR**: System Integration Review.
- **ORR**: Operational Readiness Review.
- **FRR**: Flight Readiness Review.

The official rules are NPR 7120.5 (project management) and NPR 7123.1 (systems engineering).

## 3. How the spacecraft is designed (what the game can simulate)
- **Mass, power, data and propellant (Δv) budgets.** Every part consumes something, and the total must fit the rocket.
- **Margins.** Extra mass and power are reserved early because everything ends up heavier.
- **Concurrent design.** At JPL's *Team X*, about 20 experts design power, communications, propulsion and cost at the same time.
- **Single-point failures.** Parts with no backup: if one fails, the mission is lost. Webb had **344**, about 80% of them in deployment. They get extra testing and inspection.
- **5×5 risk matrix.** Each risk is rated **likelihood × consequence** (green, yellow, red) and gets a mitigation plan.

## 4. Launch day
- **Launch Commit Criteria:** weather, winds and the status of every system. If one is not met, there is no launch.
- **GO / NO-GO poll:** the Flight Director polls every console. One "NO-GO" stops the count.
- **Launch windows:** Mars is reachable about every 26 months. Jupiter and Saturn missions use gravity assists.

## 5. During the mission
- **Deep Space Network (DSN):** 34 m and 70 m antennas at Goldstone (USA), Madrid (Spain) and Canberra (Australia), shared by all missions.
- **Communication delay:**
  - Moon: ~1.3 s.
  - Mars: 3 to ~22 min one way.
  - Jupiter: 33 to 53 min.
- **Safe mode:** when something unexpected happens, the spacecraft shuts down non-essential systems, points its panels at the Sun and waits for instructions. Hubble has done this several times.
- **Failure Review Board:** when something fails, a team finds the root cause before continuing.
- **Crewed missions:** Mission Control has specialized consoles:
  - Flight Director.
  - CAPCOM, the voice to the crew.
  - FIDO, trajectory.
  - Life support.
  - Flight Surgeon, among others.

## 6. Astronauts
- NASA keeps selecting and training crews for the Moon and Mars.
- Basic training takes about 2 years: spacecraft systems, spacewalks (in a pool), robotics, survival, languages and flying.
- Medical and psychological checks happen before, during and after every mission.
