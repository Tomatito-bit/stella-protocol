import { summarize } from './budget'

// Ship systems and daily crew tasks (60 Seconds-style: every crew member gets a job each day)

// Below this a system is broken and stops doing its job
export const BROKEN = 40

export const SYSTEMS = {
  scrubber: { room: 'LifeSupport', name: { es: 'Filtro de CO₂', en: 'CO₂ scrubber' } },
  recycler: { room: 'LifeSupport', name: { es: 'Reciclador de agua', en: 'Water recycler' } },
  antenna: { room: 'Bridge', name: { es: 'Antena principal', en: 'Main antenna' } },
  solar: { room: 'Engines', name: { es: 'Paneles solares', en: 'Solar arrays' } },
  engine: { room: 'Engines', name: { es: 'Motor principal', en: 'Main engine' } },
}

// energy: change per day · spot: where on the deck they go
export const TASKS = {
  science: { short: { es: 'Ciencia', en: 'Science' }, energy: -12, name: { es: 'Investigar', en: 'Research' }, tip: { es: 'Genera ciencia. La analista rinde el doble.', en: 'Produces science. The analyst does twice as much.' } },
  repair: { short: { es: 'Reparar', en: 'Repair' }, energy: -15, name: { es: 'Reparar', en: 'Repair' }, tip: { es: 'Arregla un sistema. Si está roto gasta una refacción. La ingeniera casi nunca falla.', en: 'Fixes a system. Broken ones use a spare part. The engineer rarely fails.' } },
  comms: { short: { es: 'Radio', en: 'Radio' }, energy: -6, name: { es: 'Comunicaciones', en: 'Comms' }, tip: { es: 'Envía más datos a la Tierra. El capitán es el mejor.', en: 'Sends more data to Earth. The captain is best at it.' } },
  medbay: { short: { es: 'Curar', en: 'Heal' }, energy: -8, name: { es: 'Enfermería', en: 'Medbay' }, tip: { es: 'Cura al más lastimado. El doctor cura mucho más.', en: 'Treats whoever is worst off. The doctor heals far more.' } },
  exercise: { short: { es: 'Ejercicio', en: 'Workout' }, energy: -10, name: { es: 'Ejercicio', en: 'Exercise' }, tip: { es: 'Evita la pérdida de hueso y músculo, y sube el ánimo.', en: 'Prevents bone and muscle loss, and lifts morale.' } },
  recycle: { short: { es: 'Soporte', en: 'Life sup.' }, energy: -10, name: { es: 'Soporte vital', en: 'Life support' }, tip: { es: 'Recupera agua y oxígeno a mano.', en: 'Recovers water and oxygen by hand.' } },
  explore: { short: { es: 'Rover', en: 'Rover' }, energy: -10, name: { es: 'Explorar con el rover', en: 'Explore with the rover' }, tip: { es: 'Maneja el rover desde la cabina hasta el siguiente sitio: ciencia de la superficie. Puede atascarse.', en: 'Drives the rover from the bridge to the next site: surface science. It can get stuck.' } },
  eva: { short: { es: 'EVA', en: 'EVA' }, energy: -25, name: { es: 'Caminata espacial', en: 'Spacewalk (EVA)' }, tip: { es: 'Sale de la nave: repara antena o paneles sin refacciones y recoge muestras (+ciencia). Arriesgado: radiación y posibles lesiones.', en: 'Goes outside: fixes the antenna or arrays without spares and collects samples (+science). Risky: radiation and possible injury.' } },
  rest: { short: { es: 'Dormir', en: 'Sleep' }, energy: 28, name: { es: 'Descansar', en: 'Rest' }, tip: { es: 'Recupera energía.', en: 'Recovers energy.' } },
}

export const taskKind = (task) => (task || 'rest').split(':')[0]
export const taskTarget = (task) => (task || '').split(':')[1]

// Systems present on this spacecraft (solar only if it carries arrays)
export function initialSystems(dest, parts) {
  const has = (id) => (parts[id] || 0) > 0
  const sys = {
    scrubber: has('eclss') ? 95 : 25,
    recycler: has('eclss') ? 92 : 20,
    // The prologue: micrometeoroids and radiation damaged the main antenna on the way out
    antenna: has('hga') ? 32 : 0,
    engine: has('engine') ? 96 : 0,
  }
  if (has('solar') || has('solarxl')) sys.solar = 94
  return sys
}

export function worstSystem(systems) {
  return Object.entries(systems || {}).sort((a, b) => a[1] - b[1])[0]?.[0]
}

// A sensible suggestion for each role; the player can change any of them every morning
export function defaultTasks(m) {
  const worst = worstSystem(m.systems)
  // Only the most overdue person goes to the treadmill each day, so the ship keeps running
  const gym = [...m.crew].filter((c) => c.energy >= 25).sort((x, y) => (x.lastExercise || 0) - (y.lastExercise || 0))[0]
  const due = (c) => c === gym && m.day - (c.lastExercise || 0) >= 3
  const antennaUp = (m.systems.antenna ?? 0) >= BROKEN
  const tasks = {}
  m.crew.forEach((c) => {
    let t = 'science'
    if (c.energy < 25) t = 'rest'
    else if (c.duty === 'engineer') t = worst && m.systems[worst] < 85 ? `repair:${worst}` : due(c) ? 'exercise' : m.o2 < 70 || m.water < 70 ? 'recycle' : 'science'
    else if (c.duty === 'doctor') t = m.crew.some((x) => x.health < 75) ? 'medbay' : due(c) ? 'exercise' : 'science'
    else if (due(c)) t = 'exercise'
    else if (c.duty === 'pilot') t = m.explore && !m.explore.stuck && m.day % 2 === 1 ? 'explore' : antennaUp && m.dataPending > 15 ? 'comms' : 'science'
    tasks[c.id] = t
  })
  return tasks
}

// Next morning the crew keeps yesterday's jobs, except finished repairs and people about to collapse
export function carryTasks(prev, m) {
  const tasks = {}
  m.crew.forEach((c) => {
    const t = (prev && prev[c.id]) || 'science'
    const target = taskTarget(t)
    const done = taskKind(t) === 'repair' && (!target || (m.systems[target] ?? 100) >= 95)
    tasks[c.id] = c.energy < 15 ? 'rest' : done ? 'science' : t
  })
  return tasks
}

// Power available vs. needed today (solar arrays lose output as they get damaged)
export function powerLevel(m, dest) {
  const s = summarize(dest, m.parts, null, [])
  const v = m.systems?.solar
  const solar = v == null ? 1 : v >= BROKEN ? 0.6 + 0.4 * v / 100 : 0.4
  return s.use > 0 ? Math.min(1, (s.generation * solar) / s.use) : 1
}
