import { SYSTEMS } from './ship'

const SYSTEM_ROOM = Object.fromEntries(Object.entries(SYSTEMS).map(([id, s]) => [id, s.room]))

// Where each crew member goes on the deck, and what they do there, given the mission state
const DUTY_SPOT = { pilot: 'Spot_pilot', scientist: 'Spot_scientist', doctor: 'Spot_doctor', engineer: 'Spot_engineer' }
const ARGUE = ['conflict', 'routineClash', 'scienceVsSafety', 'enginesHot', 'authority', 'deadlock', 'pilotEngineer', 'analystParanoia', 'riskReport', 'catastrophe']

// Room each spot belongs to (routes go room door → corridor → room door)
export const SPOT_ROOM = {
  Spot_pilot: 'Bridge', Spot_scientist: 'Lab', Spot_doctor: 'Medbay', Spot_engineer: 'Engines',
  Spot_commons: 'Galley', Shelter: 'LifeSupport', Room_Airlock: 'Airlock', Bed_1: 'Quarters', Bed_2: 'Quarters', Bed_3: 'Quarters', Bed_4: 'Quarters',
}

// Where each daily job happens on the deck
const JOB_SPOT = { eva: 'Room_Airlock', science: 'Spot_scientist', comms: 'Spot_pilot', medbay: 'Spot_doctor', exercise: 'Spot_commons', recycle: 'Shelter' }
const ROOM_SPOT = { LifeSupport: 'Shelter', Bridge: 'Spot_pilot', Engines: 'Spot_engineer' }

export function crewPlaces(crew, { plan, event, tasks }) {
  const storm = event === 'solarStorm' || event === 'radiationBelt'
  const panic = event === 'panic'
  const argue = ARGUE.includes(event)
  let arguing = 0
  const crowd = {}
  // Two people at the same spot stand side by side instead of on top of each other
  const at = (c, spot, mode) => { const k = crowd[spot] = (crowd[spot] || 0) + 1; return { id: c.id, spot, offset: [(k - 1) * 0.8 - (k > 1 ? 0.4 : 0), (k - 1) * 0.5], mode } }
  return crew.map((c, i) => {
    if (storm) return { id: c.id, spot: 'Shelter', offset: [(i % 2) * 0.9 - 0.45, Math.floor(i / 2) * 0.9], mode: 'idle' }
    if (panic) return { id: c.id, spot: ['Spot_engineer', 'Spot_pilot', 'Spot_doctor', 'Spot_scientist'][i % 4], offset: [0, 0], mode: 'argue' }
    const job = tasks && (tasks[c.id] || 'rest').split(':')
    if (job && job[0] === 'rest') return { id: c.id, spot: `Bed_${i + 1}`, offset: [0, 0.95], mode: 'sleep' }
    if (!tasks && (plan === 'rest' || c.energy < 30 || c.health < 35)) return { id: c.id, spot: `Bed_${i + 1}`, offset: [0, 0.95], mode: 'sleep' }
    if (argue && arguing < 2) { arguing += 1; return { id: c.id, spot: 'Spot_commons', offset: [arguing === 1 ? -0.7 : 0.7, 0], mode: 'argue' } }
    if (job && job[0] === 'repair') return at(c, ROOM_SPOT[SYSTEM_ROOM[job[1]]] || 'Spot_engineer', 'work')
    if (job && JOB_SPOT[job[0]]) return at(c, JOB_SPOT[job[0]], 'work')
    return { id: c.id, spot: DUTY_SPOT[c.duty], offset: [0, 0], mode: 'work' }
  })
}
