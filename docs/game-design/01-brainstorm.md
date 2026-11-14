# Brainstorm · Space Mission Design Game

Based on the research in `research/`. Pacing inspiration: 60 Parsecs. We borrow the journal, the daily dilemmas and the day-by-day rhythm, but copy nothing.

## Concepts

### A. "GO / NO-GO" · Flight Director simulator
- **Player's role:** the Flight Director.
- **How it plays:** each decision is a card with a real risk (solar storm, leak, sick astronaut).
  - Before deciding, every console gives its opinion (Navigation, Systems, Medical, Science), and the opinions clash.
  - The player calls GO or NO-GO.
- **Strength:** very NASA, easy to understand and fast to build.
- **Weakness:** almost no actual mission design.

### B. "From Phase A to F" · Build the whole mission
- **How it plays:** you design the mission through the real phases. At each gate (PDR, CDR, FRR), a review board can approve it, request changes or cancel it.
- **Resources:** budget, time, mass and power.
- **Strength:** matches the challenge exactly.
- **Weakness:** can feel like a spreadsheet if we're not careful.

### C. "Day by day" · 60 Parsecs-style survival
- **How it plays:** the trip day by day, with the crew visible in a cutaway of the spacecraft and a journal.
- **Each day:** events arrive from the 5 hazards and from real incidents.
- **Ending:** you either make it or you don't, and you compare your mission with real ones.
- **Strength:** very fun, replayable and emotional.
- **Weakness:** must not depend on luck alone.

> A timed "pack the ship in 60 seconds" mechanic was discarded: it doesn't fit a NASA event.

### D. "Deep Space Network" · Run a fleet
- **How it plays:** you manage several probes at once (Webb, Parker, Clipper, Dragonfly) and share time on 3 antennas. Each command takes time to arrive depending on distance.
- **Strength:** very original, a real NASA puzzle.
- **Weakness:** harder to explain in 30 seconds.

## Mechanics bank

### Priority 1, core
- [ ] Spacecraft design with mass, power, budget and margin
- [ ] GO / NO-GO review board with a risk matrix
- [ ] Days with events from the 5 hazards, each with a real fact
- [ ] Crew with health, morale and energy, and roles (pilot, doctor, engineer, scientist)
- [ ] Mission journal / logbook
- [ ] Ending with an epilogue and a comparison to a real mission

### Priority 2, what makes it special
- [ ] Single-point failures: parts with no backup that end the mission if they fail (like Webb)
- [ ] Safe mode: the spacecraft protects itself and you lose a day
- [ ] Communication delay: at Mars, commands execute 1 turn later
- [ ] Accumulated radiation dosimeter (like Europa Clipper)
- [ ] Spacewalk to repair, with risk
- [ ] Lunar dust on the Artemis mission

### Priority 3, polish
- [ ] 3D view of the spacecraft interior
- [ ] Music and sound
- [ ] Spanish version
- [ ] 2-minute demo mode for the judges
- [ ] Installable on phones (PWA)

## Possible destinations (each based on a real mission)
| Destination | Real mission | Signature risk |
|---|---|---|
| Earth orbit | Hubble / ISS | Gyroscopes, space debris, medical evacuation |
| Moon (South Pole) | Artemis | Lunar dust, cold, heat shield on return |
| Mars | Perseverance / future crewed | 20-min delay, dust storms, isolation |
| Near the Sun | Parker Solar Probe | Extreme heat: the shield must face the Sun |
| Europa (Jupiter) | Europa Clipper | Accumulated radiation |
| Titan (Saturn) | Dragonfly | −179 °C cold, autonomous flight |

## Possible names
- Launch Window
- Houston, You Decide
- Zero Margin
- GO / NO-GO
- Red Logbook
