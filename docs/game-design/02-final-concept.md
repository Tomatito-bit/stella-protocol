# Final Concept

**Working title:** *Houston, You Decide*. It can be changed.

**In one sentence:** you design a real NASA mission at your own pace, defend it before a GO / NO-GO board, and then live it **day by day** as Flight Director, taking care of the spacecraft and the crew until the end.

## Game loop
```
Destination → Crew → Spacecraft design → GO / NO-GO review → Launch → Mission days → Legacy
```

### 1. Destination (based on real missions)
We build 3 in 48 h, and more if there is time:

| Destination | Type | Real mission | Signature risk |
|---|---|---|---|
| Moon, South Pole | Crewed | Artemis | Lunar dust, cold, heat shield |
| Mars | Crewed | Future crewed / Perseverance | Communication delay, dust, isolation |
| Europa (Jupiter) | Robotic | Europa Clipper | Accumulated radiation |

### 2. Crew (crewed missions)
- You pick the **commander** from 4 profiles. Their style changes the route and their advice.
- The other 3 fly as crew in their roles: pilot, doctor, engineer and scientist.
- Each has **health, morale and energy**, plus a trait, sometimes hidden.
- On robotic missions, the team sits in Mission Control on Earth.

### 3. Spacecraft design (no timer, thoughtful)
- Parts by category: power, propulsion, communications, instruments and life support.
- **Mass, power, cost and propellant** budgets, plus a **reserve margin**.
- Some parts are **single-point failures**: cheap but with no backup. Adding a backup costs more but protects you.
- **Supplies** for crewed missions: food, water, medicine and spare parts.

### 4. GO / NO-GO review (like the real FRR)
- Each console reviews your design and votes GO or NO-GO, explaining why with a real fact:
  - Navigation
  - Power
  - Communications
  - Medical
  - Science
- At the end you see a **risk matrix** with your weak points.
- You can fix the design or launch anyway (with consequences).

### 5. Mission days (the core, 60 Parsecs-style)
- **Each day:**
  1. You choose the day's plan: science, transmit data, or rest / safe mode.
  2. You give **one order** to a crew member: rest, medical check, extra ration or repair.
  3. **An event** may arrive, based on the 5 hazards or real incidents:
     - solar storm
     - high CO₂
     - blood clot or illness
     - leak
     - micrometeoroid
     - dust
     - conflict
     - gyroscope failure
     - a part that won't deploy
  4. At night a page is written in the **journal**.
- **Cutaway view** of the spacecraft with the crew in their modules, and a button to see the spacecraft from outside.
- **Destination specials:**
  - Mars: orders arrive delayed.
  - Europa: a radiation dosimeter.
  - Moon: lunar dust after every outing.
- **Safe mode** when something serious happens: the spacecraft protects itself and a day is lost.
- **Optional spacewalk** to repair, with risk.

### 6. Legacy (ending)
- **Journal epilogue:** what happened to each crew member and what the mission discovered.
- **Decision profile:** cautious, balanced or bold, and how much you listened to your experts.
- **Comparison with the real mission** and a NASA lesson (Challenger, Mars Climate Orbiter, Apollo 13…).

## 48-hour scope

### Day 1 (Saturday): playable core
1. New project: React + Vite, and publish early.
2. Data: destinations, parts, crew and events with their real facts.
3. Screens: Destination, Crew, Design, GO / NO-GO, Days and Legacy (no 3D at first).
4. Day simulation, events and balance.

### Day 2 (Sunday): make it look good and present it
5. 3D: spacecraft exterior and interior with the crew.
6. Journal, music, tutorial and mobile version.
7. Demo mode for the judges, 30-second video and Space Apps page.

## Team split
- **Code, 3D and balance:** Tom (with an AI coding assistant).
- **Teammates:**
  - Verify the event facts against sources.
  - Write the journal and epilogue texts.
  - Make the video, the Space Apps page and the pitch.
  - Playtest the game with people.
