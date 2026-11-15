// Where each crew member goes on the deck, and what they do there, given the mission state
const DUTY_SPOT = { pilot: 'Spot_pilot', scientist: 'Spot_scientist', doctor: 'Spot_doctor', engineer: 'Spot_engineer' }
const ARGUE = ['conflict', 'routineClash', 'scienceVsSafety', 'enginesHot', 'authority', 'deadlock', 'pilotEngineer', 'analystParanoia', 'riskReport', 'catastrophe']

// Room each spot belongs to (routes go room door → corridor → room door)
export const SPOT_ROOM = {
  Spot_pilot: 'Bridge', Spot_scientist: 'Lab', Spot_doctor: 'Medbay', Spot_engineer: 'Engines',
  Spot_commons: 'Galley', Shelter: 'LifeSupport', Bed_1: 'Quarters', Bed_2: 'Quarters', Bed_3: 'Quarters', Bed_4: 'Quarters',
}

export function crewPlaces(crew, { plan, event }) {
  const storm = event === 'solarStorm' || event === 'radiationBelt'
  const panic = event === 'panic'
  const argue = ARGUE.includes(event)
  let arguing = 0
  return crew.map((c, i) => {
    if (storm) return { id: c.id, spot: 'Shelter', offset: [(i % 2) * 0.9 - 0.45, Math.floor(i / 2) * 0.9], mode: 'idle' }
    if (panic) return { id: c.id, spot: ['Spot_engineer', 'Spot_pilot', 'Spot_doctor', 'Spot_scientist'][i % 4], offset: [0, 0], mode: 'argue' }
    if (plan === 'rest' || c.energy < 30 || c.health < 35) return { id: c.id, spot: `Bed_${i + 1}`, offset: [0, 0.95], mode: 'sleep' }
    if (argue && arguing < 2) { arguing += 1; return { id: c.id, spot: 'Spot_commons', offset: [arguing === 1 ? -0.7 : 0.7, 0], mode: 'argue' } }
    return { id: c.id, spot: DUTY_SPOT[c.duty], offset: [0, 0], mode: 'work' }
  })
}
