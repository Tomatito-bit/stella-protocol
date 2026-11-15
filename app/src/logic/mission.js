import { CREW, crewById } from '../data/crew'
import { DEFECTS } from '../data/events'
import { TESTS, partById } from '../data/parts'
import { summarize, count } from './budget'
import { SECRET_EVENTS } from '../data/secretEvents'
import { storyFor } from '../data/story'
import { SITES, EXPLORE_EVENTS, SAMPLES, QUEST_SITES, QUEST_DAYS, SITE_SCIENCE, SITE_STUCK, LANDING, exploreTarget, distKm } from '../data/exploration'
import { BROKEN, SYSTEMS, TASKS, taskKind, taskTarget, initialSystems, worstSystem } from './ship'

// Seeded random numbers so a mission can be replayed
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (v) => Math.max(0, Math.min(100, v))
const STYLE = {
  cautious: { danger: 0.65, science: 0.95, extraDays: 0, fatigue: 1, morale: 1, opportunity: 1 },
  bold: { danger: 1, science: 1, extraDays: 2, fatigue: 1, morale: 1, opportunity: 1 },
  science: { danger: 1, science: 1.1, extraDays: 0, fatigue: 1.25, morale: 1, opportunity: 2 },
  diplomat: { danger: 1, science: 1, extraDays: 0, fatigue: 1, morale: 0.5, opportunity: 1, conflict: 0.4 },
}
export const styleOf = (commanderId) => STYLE[crewById[commanderId].style]

// Science each destination needs for full success
const GOAL = { moon: 140, mars: 160, europa: 150 }

export function startMission(dest, sel, launcherId, tests, commanderId, seed) {
  const r = rng(seed)
  const s = summarize(dest, sel, launcherId, tests)
  const st = styleOf(commanderId)
  const parts = { ...sel }
  const log = []
  // Defects that the skipped tests would have caught show up during the mission
  const defects = TESTS.filter((t) => !tests.includes(t.id) && r() < 0.6).map((t) => ({ test: t.id, day: 2 + Math.floor(r() * (dest.days - 3)) }))
  if (st.extraDays && r() < 0.3) {
    const victim = ['solar', 'lga', 'battery', 'spares'].find((id) => parts[id] > 0)
    if (victim) {
      parts[victim] -= 1
      log.push({ type: 'bad', text: { es: `El paso cercano de la ruta rápida dañó: ${partById[victim].name.es.toLowerCase()}.`, en: `The close flyby on the fast route damaged: ${partById[victim].name.en.toLowerCase()}.` } })
    }
  }
  const crew = dest.crewed
    ? [crewById[commanderId], ...CREW.filter((c) => c.id !== commanderId)].map((c) => ({ id: c.id, duty: c.duty, commander: c.id === commanderId, health: 100, morale: 85, energy: 90, hiddenFound: false, lastExercise: 0 }))
    : null
  return {
    seed,
    day: 0,
    totalDays: dest.days + st.extraDays,
    goal: GOAL[dest.id],
    science: 0,
    dataPending: 0,
    parts,
    spareTanks: Math.max(0, s.tanks - s.tanksNeeded),
    spares: count(parts, 'spares'),
    supplies: dest.crewed ? s.supplyDays : null,
    dose: 0,
    electronics: 100,
    gyroPenalty: 1,
    crew,
    defects,
    shield: s.shield,
    orderDay: -1,
    systems: dest.crewed ? initialSystems(dest, parts) : null,
    o2: 100,
    water: 100,
    voiceBack: false,
    explore: (parts.rover || 0) > 0 && SITES[dest.id] && dest.crewed ? { idx: 0, stuck: 0, route: 0, at: -1, pos: LANDING, prevPos: LANDING, visited: [], samples: [], quest: null, questsDone: [] } : null,
    effects: { apathy: false, panic: 0, frustrated: 0, medicBusy: 0, divided: false, halfDays: 0, errorRisk: 0 },
    lastStorm: false,
    over: false,
    lost: null,
    decisions: [],
    journal: [{ day: 0, entries: [{ type: 'good', text: { es: `Llegamos a ${dest.name.es}. Inicia la operación.`, en: `We have arrived at ${dest.name.en}. Operations begin.` } }, ...log] }],
  }
}

// Picks today's event (or none). Destination and commander style change the odds.
export function rollEvent(m, dest, commanderId) {
  // The first two days are calm so the crew can settle in; events start on day 3 and build up
  if (m.day < 2) return null
  const ramp = Math.min(1, (m.day - 1) / 3)
  const r = rng(m.seed + m.day * 977 + 13)
  const st = styleOf(commanderId)
  const pool = []
  const add = (id, w) => pool.push([id, w])
  // Exploration: once the rover has started visiting sites, surface events can happen
  if (m.explore && m.explore.idx > 0 && m.explore.stuck < 900) {
    for (const [id, ev] of Object.entries(EXPLORE_EVENTS)) {
      if (ev.dests && !ev.dests.includes(dest.id)) continue
      if (ev.needsHeli && !(m.parts.helicopter > 0)) continue
      if (id === 'roverStuck' && m.explore.stuck) continue
      // Rover missions: one at a time, each at most once
      if (ev.quest && (m.explore.quest || m.explore.questsDone.includes(id) || m.explore.stuck)) continue
      add(id, ev.quest ? 0.07 : 0.05)
    }
  }
  // Classified files (fan theories): rare, at most one per mission
  if (m.day >= 3 && !m.secretSeen) {
    const ids = Object.keys(SECRET_EVENTS).filter((id) => SECRET_EVENTS[id].dests.includes(dest.id))
    add(ids[Math.floor(r() * ids.length)], 0.05)
  }
  if (dest.crewed && m.crew) {
    const avg = (f) => m.crew.reduce((a, c) => a + c[f], 0) / m.crew.length
    const morale = avg('morale')
    const energy = avg('energy')
    const stressed = morale < 45 || m.dose > 15 || m.supplies < 3
    const phase = m.day / m.totalDays
    if (stressed && morale < 32) add('panic', 0.35)
    if (m.lastStorm && morale < 60) add('deadlock', 0.4)
    if (energy < 40 || m.dose > 18) add('authority', 0.18)
    if (dest.radiation >= 2) add('disobedience', stressed ? 0.1 : 0.04)
    if (phase >= 0.45 && phase <= 0.75 && !m.thirdSeen) add('thirdQuarter', 0.35)
    if (energy < 50) add('fatigueIgnored', 0.25)
    add('scienceVsSafety', 0.05)
    add('enginesHot', 0.04)
    add('routineClash', 0.07)
    add('pilotEngineer', 0.05)
    add('analystParanoia', 0.05)
    if (phase > 0.2) add('riskReport', 0.05)
    if (m.supplies <= 3 && !m.catastropheSeen) add('catastrophe', 0.3)
  }
  add('solarStorm', 0.09 * dest.radiation * st.danger)
  if (dest.id === 'europa') add('radiationBelt', 0.22 * st.danger)
  add('micrometeoroid', 0.07 * st.danger)
  add('opportunity', 0.1 * st.opportunity)
  if (dest.crewed) {
    add('co2', 0.07 * st.danger)
    add('medical', 0.05 + m.day * 0.004)
    add('conflict', (0.03 + m.day * 0.01) * (st.conflict || 1))
    if (m.day === 2) add('gravity', 1)
  } else add('gyro', 0.06)
  if (dest.id === 'moon') { add('dust', 0.1); add('shadowIce', 0.1); add('earthset', 0.08) }
  if (dest.id === 'mars') { add('dustDevil', 0.06); add('conjunction', m.day > 4 && !m.conjunctionSeen ? 0.12 : 0) }
  if (dest.id === 'europa') { add('plume', 0.1); add('transistor', 0.08) }
  if (dest.crewed) { add('homeMessage', 0.06); add('harvest', m.day > 3 ? 0.05 : 0); add('drill', m.drilled ? 0 : 0.06) }
  if (dest.id === 'mars') add('dustStorm', 0.08)
  if (dest.delayMin > 5) add('delay', 0.07)
  for (const [id, w] of pool) if (r() < w * ramp) return id
  return null
}

const working = (m, id) => (m.parts[id] || 0) > 0

// Advances one day. plan: 'science' | 'transmit' | 'rest'. choice: { event, option } or null.
// Crewed missions pass opts.tasks (a job per crew member) and opts.ration; the plan is then derived from the jobs.
export function nextDay(m0, dest, commanderId, planIn, choice, opts = {}) {
  let plan = planIn
  const r = rng(m0.seed + m0.day * 7919 + 1)
  const st = styleOf(commanderId)
  const m = { ...m0, parts: { ...m0.parts }, crew: m0.crew && m0.crew.map((c) => ({ ...c })), decisions: [...m0.decisions], systems: m0.systems && { ...m0.systems }, explore: m0.explore && { ...m0.explore, visited: [...m0.explore.visited], samples: [...m0.explore.samples], questsDone: [...m0.explore.questsDone], quest: m0.explore.quest && { ...m0.explore.quest } } }
  const tasks = m.crew && m.systems && opts.tasks
  const jobOf = (c) => taskKind(tasks && tasks[c.id])
  const nJob = (k) => (tasks ? m.crew.filter((c) => jobOf(c) === k).length : 0)
  if (tasks) plan = nJob('rest') >= 3 ? 'rest' : nJob('comms') >= 2 ? 'transmit' : 'science'
  const day = m.day + 1
  const notes = []
  const note = (type, es, en) => notes.push({ type, text: { es, en } })
  let sciFactor = plan === 'science' ? 1 : plan === 'transmit' ? 0.3 : 0
  // With jobs, science comes from whoever is researching (the analyst counts double)
  if (tasks) sciFactor = m.crew.reduce((a, c) => a + (jobOf(c) === 'science' ? (c.duty === 'scientist' ? 1.5 : 0.75) * (0.4 + 0.6 * c.energy / 100) : 0), 0) * 0.85
  let doseToday = 0.4 * dest.radiation // galactic cosmic rays, always there
  let powerPenalty = 1
  const crewHit = (field, d) => m.crew && m.crew.forEach((c) => { c[field] = clamp(c[field] + d) })
  const takeSpare = () => { if (m.spares > 0) { m.spares -= 1; return true } return false }
  const breakPart = (pred) => {
    const ids = Object.keys(m.parts).filter((id) => m.parts[id] > 0 && pred(partById[id]))
    if (!ids.length) return null
    const id = ids[Math.floor(r() * ids.length)]
    m.parts[id] -= 1
    return partById[id]
  }

  // 1. The player's answer to today's event
  if (choice) {
    const { event, option, risk } = choice
    m.decisions.push({ day, event, option, risk })
    if (event === 'solarStorm' || event === 'radiationBelt') {
      const strength = event === 'radiationBelt' ? 3 : 2
      if (option === 'shelter') { sciFactor = 0; doseToday += 0.2; note('good', 'Refugio activado: la tormenta pasó sin daños.', 'Shelter activated: the storm passed with no damage.') }
      else if (option === 'orbit' && m.spareTanks > 0) { m.spareTanks -= 1; doseToday += 1; note('good', 'Cambiaste de órbita y saliste de lo peor.', 'You changed orbit and got out of the worst of it.') }
      else {
        const protect = Math.max(0.4, 1 - m.shield * 0.18)
        doseToday += 7 * strength * protect
        m.electronics = clamp(m.electronics - 13 * strength * protect)
        crewHit('health', -7 * strength * protect)
        sciFactor *= event === 'radiationBelt' ? 1.15 : 1
        note('bad', `Seguiste trabajando: dosis alta y electrónica dañada (${Math.round(m.electronics)}%).`, `You kept working: high dose and damaged electronics (${Math.round(m.electronics)}%).`)
        // A burst of particles can fry an instrument outright (single-event upset)
        if (r() < 0.35 * protect) {
          const p = breakPart((x) => x.cat === 'instruments' || x.cat === 'comms')
          if (p) note('bad', `Una partícula de alta energía quemó: ${p.name.es.toLowerCase()}.`, `A high-energy particle fried the ${p.name.en.toLowerCase()}.`)
        }
      }
    }
    if (event === 'micrometeoroid') {
      if (option === 'repair' && takeSpare()) note('good', 'Reparaste el daño con una refacción.', 'You repaired the damage with a spare part.')
      else if (option === 'eva' && m.crew) {
        const ok = r() < 0.75
        if (ok) note('good', 'Caminata espacial exitosa: el daño quedó reparado.', 'Successful spacewalk: the damage is fixed.')
        else { m.crew[1].health = clamp(m.crew[1].health - 25); note('bad', 'Durante la caminata un guante se dañó: lesión en la mano.', 'During the spacewalk a glove was damaged: hand injury.') }
        doseToday += 1.5
      } else {
        const p = breakPart((x) => x.cat !== 'life')
        if (p) note('bad', `El impacto inutilizó: ${p.name.es.toLowerCase()}.`, `The impact knocked out: ${p.name.en.toLowerCase()}.`)
        if (m.systems) { const ids = Object.keys(m.systems); const id = ids[Math.floor(r() * ids.length)]; m.systems[id] = Math.max(0, m.systems[id] - 40); note('bad', `El impacto dañó: ${SYSTEMS[id].name.es.toLowerCase()}.`, `The impact damaged the ${SYSTEMS[id].name.en.toLowerCase()}.`) }
      }
    }
    if (event === 'co2') {
      const eng = m.crew.find((c) => c.duty === 'engineer')
      if (option === 'repair' && takeSpare()) note('good', 'Filtro nuevo: el aire está limpio.', 'New filter: the air is clean.')
      else if (option === 'improvise' && (eng.energy > 50 || m.drilled) && !(m0.effects && m0.effects.frustrated)) note('good', 'La ingeniera improvisó un filtro como en el Apolo 13. ¡Funcionó!', 'The engineer rigged a filter like Apollo 13. It worked!')
      else { crewHit('health', -12); note('bad', 'El CO₂ alto dejó a todos con dolor de cabeza.', 'High CO₂ left everyone with headaches.') }
    }
    if (event === 'medical') {
      const sick = m.crew[1 + Math.floor(r() * 3)]
      if (option === 'treat' && working(m, 'medkit') && !(m0.effects && m0.effects.medicBusy)) { sick.health = clamp(sick.health - 5); note('good', 'Tratamiento en la enfermería: el coágulo se controló.', 'Treated in the medical bay: the clot is under control.') }
      else if (option === 'ground') { sciFactor *= 0.4; sick.health = clamp(sick.health - 10); note('good', 'Los médicos en Tierra guiaron el tratamiento. Se perdió tiempo de ciencia.', 'Doctors on Earth guided the treatment. Science time was lost.') }
      else { sick.health = clamp(sick.health - 35); note('bad', 'El coágulo empeoró. El tripulante necesita reposo absoluto.', 'The clot got worse. The crew member needs full bed rest.') }
    }
    if (event === 'conflict') {
      if (option === 'talk') { const up = st.conflict ? 20 : 8; crewHit('morale', up); note('good', 'La mediación calmó los ánimos.', 'Mediation calmed things down.') }
      else if (option === 'rest') { sciFactor = 0; crewHit('morale', 15); crewHit('energy', 20); note('good', 'Un día libre devolvió el buen humor.', 'A day off brought the mood back.') }
      else { crewHit('morale', -15); note('bad', 'La discusión siguió y el ambiente se puso tenso.', 'The argument dragged on and the mood soured.') }
    }
    if (event === 'gravity') {
      if (option === 'adapt') { sciFactor = 0; note('good', 'Tras un día de adaptación, todos se mueven con seguridad.', 'After a day to adapt, everyone moves confidently.') }
      else if (r() < 0.4) { m.crew[2].health = clamp(m.crew[2].health - 20); note('bad', 'Un tropiezo por la nueva gravedad causó un esguince.', 'A stumble in the new gravity caused a sprain.') }
      else note('good', 'Trabajaron mareados, pero sin accidentes.', 'They worked dizzy, but without accidents.')
    }
    if (event === 'dust') {
      if (option === 'clean') { sciFactor *= 0.5; note('good', 'Limpieza a fondo: el polvo quedó fuera.', 'Deep clean: the dust is out.') }
      else { crewHit('health', -10); note('bad', 'El polvo irritó ojos y garganta: “fiebre del heno lunar”.', 'The dust irritated eyes and throats: “lunar hay fever”.') }
    }
    if (event === 'dustStorm') {
      if (option === 'save') { sciFactor *= 0.5; note('good', 'Ahorraste energía hasta que pasó la tormenta.', 'You saved power until the storm cleared.') }
      else if (!working(m, 'battery') && !working(m, 'rtg')) { const p = breakPart((x) => x.cat === 'instruments'); if (p) note('bad', `Sin energía suficiente se apagó: ${p.name.es.toLowerCase()}.`, `Without enough power it shut down: ${p.name.en.toLowerCase()}.`) }
      else note('good', 'Las baterías aguantaron la tormenta.', 'The batteries carried you through the storm.')
    }
    if (event === 'delay') {
      if (option === 'wait') { sciFactor = 0; note('good', 'Llegaron las instrucciones de la Tierra y todo salió bien.', 'Earth’s instructions arrived and all went well.') }
      else {
        const fit = m.crew ? m.crew.reduce((a, c) => a + c.energy + c.morale, 0) / (m.crew.length * 200) : m.electronics / 100
        if (r() < Math.min(0.95, fit * (st.conflict ? 0.85 : 1) + (m.drilled ? 0.2 : 0))) note('good', 'La solución autónoma funcionó sin ayuda de Houston.', 'The autonomous fix worked without Houston.')
        else { const p = breakPart((x) => x.cat === 'power' || x.cat === 'comms'); note('bad', `La reparación autónoma falló${p ? `: se perdió ${p.name.es.toLowerCase()}` : ''}.`, `The autonomous fix failed${p ? `: lost the ${p.name.en.toLowerCase()}` : ''}.`) }
      }
    }
    if (event === 'gyro') {
      if (option === 'repair' && takeSpare()) note('good', 'Reconfiguraste los giroscopios con refacciones.', 'You reconfigured the gyros with spare parts.')
      else { m.gyroPenalty = 0.8; note('bad', 'Operas en modo de un giroscopio: menos ciencia.', 'Now in one-gyro mode: less science.') }
    }
    if (event === 'shadowIce') {
      if (option === 'sample') {
        m.science += 25
        if (r() < 0.35) { m.crew[1].health = clamp(m.crew[1].health - 20); note('bad', '¡Muestra de hielo conseguida! Pero el frío de −230 °C congeló un guante.', 'Ice sample secured! But the −230 °C cold froze a glove.') }
        else note('good', '¡Muestra de hielo de un cráter eterno! +25 de ciencia.', 'Ice sample from an eternal crater! +25 science.')
      } else if (working(m, 'spectrometer') || working(m, 'radar')) { m.science += 10; note('good', 'Mapeaste el hielo desde arriba. +10 de ciencia.', 'You mapped the ice from above. +10 science.') }
      else note('warn', 'Sin espectrómetro ni radar no se pudo medir.', 'Without a spectrometer or radar it couldn’t be measured.')
    }
    if (event === 'earthset') {
      if (option === 'climb') { m.crew[0].energy = clamp(m.crew[0].energy - 35); note('good', 'Llevaron la antena a la cresta: el enlace siguió vivo.', 'They hauled the antenna up the ridge: the link stayed alive.') }
      else { sciFactor *= 0.5; note('good', 'Guardaron los datos hasta que la Tierra volvió a salir.', 'They stored data until Earth rose again.') }
    }
    if (event === 'dustDevil') { m.science += 10; note('good', 'El remolino limpió los paneles: energía y ciencia extra.', 'The dust devil cleaned the panels: extra power and science.') }
    if (event === 'conjunction') {
      m.conjunctionSeen = true
      if (option === 'freeze') { sciFactor = 0; note('good', 'Comandos congelados durante la conjunción, como hace la NASA.', 'Commands frozen during conjunction, just like NASA does.') }
      else if (r() < 0.5) { m.electronics = clamp(m.electronics - 15); note('bad', 'Un comando corrupto reinició la computadora.', 'A corrupted command rebooted the computer.') }
      else note('good', 'Hubo suerte: los datos llegaron completos.', 'Lucky: the data arrived intact.')
    }
    if (event === 'plume') {
      if (option === 'fly' && m.spareTanks > 0) { m.spareTanks -= 1; m.science += 35; doseToday += 4; note('good', '¡Atravesaste la pluma! Moléculas del océano de Europa: +35 de ciencia.', 'You flew through the plume! Molecules from Europa’s ocean: +35 science.') }
      else if (working(m, 'camera')) { m.science += 12; note('good', 'Fotografiaste la pluma desde lejos. +12 de ciencia.', 'You photographed the plume from afar. +12 science.') }
      else note('warn', 'Sin cámara, la pluma se perdió de vista.', 'Without a camera, the plume was lost from view.')
    }
    if (event === 'transistor') {
      if (option === 'anneal') { sciFactor *= 0.5; m.electronics = clamp(m.electronics + 15); note('good', 'El calentamiento recuperó parte de la electrónica.', 'Annealing recovered some of the electronics.') }
      else { m.electronics = clamp(m.electronics - 12); note('bad', 'La electrónica sigue degradándose.', 'Electronics keep degrading.') }
    }
    if (event === 'homeMessage') {
      if (option === 'watch') { sciFactor *= 0.7; crewHit('morale', 15); note('good', 'Hubo risas y alguna lágrima: el ánimo subió.', 'Laughter and a few tears: morale went up.') }
      else { crewHit('morale', 6); note('good', 'Vieron los mensajes por la noche.', 'They watched the messages at night.') }
    }
    if (event === 'harvest') { crewHit('morale', 10); m.supplies += 1; note('good', 'Ensalada fresca en el espacio: +ánimo y un día más de comida.', 'Fresh salad in space: more morale and one more day of food.') }
    if (event === 'drill') {
      if (option === 'train') { sciFactor *= 0.5; m.drilled = true; note('good', 'Simulacro completado: la tripulación responde mejor a emergencias.', 'Drill complete: the crew handles emergencies better.') }
      else note('warn', 'Se pospuso el simulacro.', 'The drill was postponed.')
    }
    const role = (duty) => m.crew && (m.crew.find((c) => c.duty === duty) || m.crew[0])
    const captain = m.crew && m.crew.find((c) => c.commander)
    if (event === 'routineClash') {
      if (option === 'rules') note('good', 'Acordaron reglas de convivencia: menos roces.', 'They agreed on house rules: less friction.')
      else { crewHit('morale', -5); note('warn', 'Los roces siguen: −5% de ánimo.', 'The friction goes on: −5% morale.') }
    }
    if (event === 'pilotEngineer') {
      if (option === 'protocol') note('good', 'Nuevo protocolo: cada maniobra se anuncia antes.', 'New protocol: every maneuver is called out first.')
      else { powerPenalty = 0.85; note('warn', 'Se gastó energía de más este turno.', 'Extra power was used this turn.') }
    }
    if (event === 'analystParanoia') {
      if (option === 'private') note('good', 'Los reportes ahora son privados: se acabó el señalamiento.', 'Reports are private now: no more finger-pointing.')
      else { crewHit('morale', -5); note('warn', 'Crece la desconfianza: −5% de ánimo.', 'Distrust grows: −5% morale.') }
    }
    if (event === 'riskReport') {
      if (option === 'detour') { sciFactor *= 0.5; m.supplies = Math.max(0, m.supplies - 1); note('good', 'Rodeo completado: la nave evitó la zona de riesgo.', 'Detour complete: the craft avoided the danger zone.') }
      else { crewHit('morale', -10); m.effects.errorRisk = Math.max(m.effects.errorRisk || 0, 0.15); note('warn', 'Mantuvieron la ruta; la tripulación vuela con los nervios de punta.', 'They kept the route; the crew flies on edge.') }
    }
    if (event === 'catastrophe') {
      m.catastropheSeen = true
      if (option === 'ration') { m.supplies += 3; crewHit('health', -12); crewHit('morale', -10); note('bad', 'Raciones recortadas: alcanzará la comida, pero todos están más débiles.', 'Rations cut: the food will last, but everyone is weaker.') }
      else if (option === 'seal') { m.supplies += 2; crewHit('morale', -22); sciFactor *= 0.5; note('bad', 'Se selló un módulo. Sobreviven los números; el ánimo, no tanto.', 'A module was sealed. The numbers survive; morale, not so much.') }
      else { const an = role('scientist'); an.morale = clamp(an.morale - 20); note('warn', 'Rechazaste el informe. La analista se aísla y el problema sigue ahí.', 'You rejected the report. The analyst withdraws and the problem remains.') }
    }
    if (event === 'scienceVsSafety') {
      if (option === 'science') { sciFactor *= 1.35; captain.morale = clamp(captain.morale - 15); note('good', 'Más datos de la zona inestable; el capitán queda tenso.', 'More data from the unstable zone; the captain is tense.') }
      else { sciFactor = 0; note('good', 'Sensores apagados por seguridad.', 'Sensors off for safety.') }
    }
    if (event === 'enginesHot') {
      if (option === 'engineer') { role('pilot').morale = clamp(role('pilot').morale - 10); note('good', 'Motores protegidos. El piloto acepta a regañadientes.', 'Engines protected. The pilot grudgingly agrees.') }
      else { m.effects.frustrated = 2; note('warn', 'La ingeniera, frustrada, rendirá menos en reparaciones.', 'The frustrated engineer will do worse at repairs.') }
    }
    if (event === 'fatigueIgnored') {
      if (option === 'rest') { sciFactor = 0; crewHit('energy', 35); note('good', 'Descanso obligatorio: todos durmieron.', 'Mandatory rest: everyone slept.') }
      else { crewHit('health', -8); m.effects.errorRisk = 0.25; note('bad', 'Siguieron sin dormir: sube el riesgo de error humano.', 'They kept going without sleep: human error risk is up.') }
    }
    if (event === 'thirdQuarter') {
      m.thirdSeen = true
      if (option === 'call') { sciFactor *= 0.5; crewHit('morale', 15); note('good', 'Llamada con casa y una tarde libre: vuelve la energía.', 'A call home and a free afternoon: the spark is back.') }
      else { m.effects.apathy = true; note('warn', 'Apatía general: −20% de rendimiento hasta tomar un respiro.', 'General apathy: −20% performance until they get a break.') }
    }
    if (event === 'disobedience') {
      if (option === 'order') { sciFactor *= 0.7; note('good', 'Volvió al refugio. Se perdió el experimento, pero nadie se dañó.', 'She returned to shelter. The experiment was lost, but nobody got hurt.') }
      else { m.science += 15; const sp = role('scientist'); sp.health = clamp(sp.health - 25); doseToday += 3; m.effects.medicBusy = 2; note('bad', 'Terminó el experimento (+15 ciencia), pero recibió radiación y el médico la atiende.', 'She finished the experiment (+15 science), but took radiation and the doctor is treating her.') }
    }
    if (event === 'deadlock') {
      if (option === 'safe') { sciFactor = 0; note('good', 'Tomaste el mando: modo seguro y la nave a salvo.', 'You took command: safe mode and the craft is secure.') }
      else { sciFactor = 0; m.electronics = clamp(m.electronics - 12); crewHit('morale', -10); note('bad', 'Se perdió el turno discutiendo y la nave quedó expuesta.', 'The turn was lost to arguing and the craft was left exposed.') }
    }
    if (event === 'authority') {
      if (option === 'mediate') { sciFactor *= 0.4; crewHit('morale', 8); note('good', 'Mediaste: la cadena de mando se restableció.', 'You mediated: the chain of command is restored.') }
      else if (option === 'doctor') { m.effects.halfDays = 2; crewHit('energy', 20); note('good', 'El médico tenía razón: dos días a medio ritmo para recuperarse.', 'The doctor was right: two half-pace days to recover.') }
      else { m.effects.divided = true; crewHit('morale', -12); note('bad', 'Seguiste, pero la tripulación quedó dividida.', 'You carried on, but the crew is divided.') }
    }
    if (event === 'panic') {
      if (option === 'safe') { sciFactor = 0; crewHit('energy', 30); crewHit('morale', 10); m.effects.panic = 0; note('good', 'Todo se detuvo, descansaron y se recuperó la calma.', 'Everything stopped, they rested and calm returned.') }
      else { m.effects.panic = 2; note('bad', 'El pánico sigue: dos días de castigo en todo.', 'The panic continues: two days of penalties across the board.') }
    }
    if (event === 'opportunity') {
      if (option === 'study') {
        const has = dest.goals.some((g) => working(m, g))
        if (has) { m.science += 15; note('good', '¡Descubrimiento! +15 de ciencia.', 'Discovery! +15 science.') }
        else note('bad', 'No llevabas el instrumento adecuado para estudiarlo.', 'You lacked the right instrument to study it.')
      }
    }
  }

  // 1a. Classified files: investigate (pay a price, learn the truth) or leave it
  if (choice && SECRET_EVENTS[choice.event]) {
    const sec = SECRET_EVENTS[choice.event]
    m.secretSeen = true
    if (choice.option === 'investigate') {
      m.secrets = [...(m.secrets || []), choice.event]
      if (sec.options[0].needs === 'fuel' && m.spareTanks > 0) m.spareTanks -= 1
      if (choice.event === 'marsDoor' || choice.event === 'moonLights') sciFactor *= 0.5
      if (choice.event === 'wowSignal') crewHit('energy', -15)
      if (choice.event === 'blackKnight' && r() < 0.3) { m.electronics = clamp(m.electronics - 10); note('bad', 'Un roce con el objeto dañó un poco la electrónica.', 'A brush with the object damaged the electronics a little.') }
      m.science += 15
      crewHit('morale', 10)
      note('good', `ARCHIVO DESCLASIFICADO: ${sec.reveal.es} (+15 ciencia)`, `FILE DECLASSIFIED: ${sec.reveal.en} (+15 science)`)
    } else note('warn', 'El archivo se queda cerrado. Nadie a bordo deja de pensar en eso.', 'The file stays closed. Nobody on board stops thinking about it.')
  }

  // A new rock for the collection (returns true if it wasn't there yet)
  const addSample = (id) => { const x = m.explore; if (!x || !id || x.samples.includes(id)) return false; x.samples.push(id); note('good', `Muestra nueva en la colección: ${SAMPLES[id].name.es}.`, `New sample in the collection: ${SAMPLES[id].name.en}.`); return true }

  // 1a'. Surface exploration events
  if (choice && EXPLORE_EVENTS[choice.event] && m.explore) {
    const x = m.explore
    const ev = choice.event
    const o = choice.option
    if (ev === 'roverStuck') {
      if (o === 'slow') { x.stuck = 3; note('warn', 'El rover avanza milímetro a milímetro: dos días para salir.', 'The rover inches forward: two days to get out.') }
      else if (r() < 0.5) note('good', '¡Salió a la primera! El rover sigue su camino.', 'It got out on the first try! The rover drives on.')
      else { x.stuck = 4; note('bad', 'Las ruedas se hundieron más: el rover quedará parado varios días.', 'The wheels sank deeper: the rover will be stuck for days.') }
    }
    if (ev === 'leopardRock') {
      if (o === 'core') { m.science += 25; sciFactor *= 0.7; addSample('leopard'); note('good', 'Muestra guardada en un tubo sellado: +25 de ciencia. Algún día volverá a la Tierra.', 'Sample cached in a sealed tube: +25 science. Someday it will come back to Earth.') }
      else { m.science += 8; note('good', 'Fotos de alta resolución de la roca: +8 de ciencia.', 'High-resolution photos of the rock: +8 science.') }
    }
    if (ev === 'scoutFlight') {
      if (o === 'fly') {
        if (r() < 0.85) { x.route = 3; note('good', 'El helicóptero encontró una ruta con buenos sitios: más ciencia en las próximas exploraciones.', 'The helicopter found a route with good sites: more science on the next drives.') }
        else { m.parts.helicopter = 0; note('bad', 'Una ráfaga tumbó al helicóptero: rotor roto, ya no vuela.', 'A gust knocked the helicopter down: broken rotor, it won’t fly again.') }
      } else note('good', 'El helicóptero esperó en tierra.', 'The helicopter waited on the ground.')
    }
    if (ev === 'surfaceStorm') {
      if (o === 'park') { x.stuck = Math.max(x.stuck, 2); note('good', 'El rover esperó la tormenta estacionado.', 'The rover waited out the storm parked.') }
      else if (r() < 0.55) { m.science += 8; note('good', 'Llegaste al siguiente sitio justo antes del polvo: +8 de ciencia.', 'You reached the next site just ahead of the dust: +8 science.') }
      else { x.stuck = 3; m.electronics = clamp(m.electronics - 5); note('bad', 'La tormenta alcanzó al rover y cubrió sus cámaras.', 'The storm caught the rover and covered its cameras.') }
    }
    if (ev === 'regolithJam') {
      if (o === 'clean') { if (!takeSpare()) x.stuck = Math.max(x.stuck, 2); note('good', 'Ruedas limpias y selladas otra vez.', 'Wheels clean and sealed again.') }
      else if (r() < 0.5) { x.stuck = 4; note('bad', 'Las articulaciones se trabaron por el polvo.', 'The joints locked up with dust.') }
    }
    if (ev === 'lavaTube') {
      if (o === 'probe') {
        if (r() < 0.6) { m.science += 30; addSample('basalt'); note('good', '¡Imágenes del interior del tubo de lava! Un refugio natural para futuras bases: +30 de ciencia.', 'Images from inside the lava tube! A natural shelter for future bases: +30 science.') }
        else { x.stuck = 999; note('bad', 'El borde cedió y el rover cayó al pozo. Sus últimas fotos son espectaculares.', 'The edge gave way and the rover fell into the pit. Its last photos are spectacular.') }
      } else { m.science += 10; note('good', 'Mapeaste el pozo desde lejos: +10 de ciencia.', 'You mapped the pit from afar: +10 science.') }
    }
    // Rover missions: the special site goes on the map with a deadline
    if (EXPLORE_EVENTS[ev].quest) {
      x.questsDone.push(ev)
      const q = QUEST_SITES[ev]
      if (o === 'go') { x.quest = { id: ev, left: QUEST_DAYS }; note('warn', `Nueva misión del rover: llegar a ${q.es} en ${QUEST_DAYS} días. Está marcada en el mapa.`, `New rover mission: reach the ${q.en.toLowerCase()} within ${QUEST_DAYS} days. It's marked on the map.`) }
      else if (ev === 'heliLost') {
        if (r() < 0.4) note('good', 'Contra todo pronóstico, Ingenuity se reconectó solo al día siguiente.', 'Against all odds, Ingenuity reconnected on its own the next day.')
        else { m.parts.helicopter = 0; note('bad', 'Ingenuity nunca volvió a contestar. Se quedó en silencio en la arena.', 'Ingenuity never answered again. It went silent on the sand.') }
      } else note('good', 'Lo anotaste para la siguiente misión.', 'You logged it for the next mission.')
    }
  }

  // 1b. Ongoing social effects
  const fx = m.effects = { ...(m0.effects || {}) }
  if (fx.apathy) { sciFactor *= 0.8; if (plan === 'rest') { fx.apathy = false; note('good', 'El descanso cortó la apatía.', 'The rest broke the apathy.') } }
  if (fx.panic > 0) {
    if (plan === 'rest') { fx.panic = 0; note('good', 'El modo seguro y el descanso terminaron con el pánico.', 'Safe mode and rest ended the panic.') }
    else { fx.panic -= 1; sciFactor *= 0.5; crewHit('health', -8); crewHit('energy', -12); note('bad', 'Pánico a bordo: todo rinde a la mitad.', 'Panic on board: everything runs at half.') }
  }
  if (fx.halfDays > 0) { fx.halfDays -= 1; sciFactor *= 0.5 }
  if (fx.divided) { sciFactor *= 0.9; if (choice && choice.event === 'conflict' && choice.option === 'talk') fx.divided = false }
  if (fx.frustrated > 0) fx.frustrated -= 1
  if (fx.medicBusy > 0) fx.medicBusy -= 1
  if (fx.errorRisk > 0 && plan !== 'rest' && r() < fx.errorRisk) {
    const p = breakPart((x) => x.cat === 'instruments' || x.cat === 'power')
    note('bad', `Error humano por cansancio${p ? `: se dañó ${p.name.es.toLowerCase()}` : ''}.`, `Human error from fatigue${p ? `: the ${p.name.en.toLowerCase()} was damaged` : ''}.`)
  }
  if (plan === 'rest') fx.errorRisk = 0

  // 1c. Crew jobs, ship systems and consumables (crewed missions)
  let commsBoost = 0
  let solarFactor = 1
  if (tasks) {
    const sys = m.systems
    const nameOf = (c) => crewById[c.id].name
    if (m.explore && m.explore.stuck > 0 && m.explore.stuck < 900) m.explore.stuck -= 1
    m.crew.forEach((c) => {
      const k = jobOf(c)
      const eff = 0.5 + 0.5 * c.energy / 100
      if (k === 'repair') {
        const id = sys[taskTarget(tasks[c.id])] != null ? taskTarget(tasks[c.id]) : worstSystem(sys)
        const sysName = SYSTEMS[id].name
        if (sys[id] < BROKEN && !takeSpare()) note('warn', `${nameOf(c)} no pudo reparar ${sysName.es.toLowerCase()}: no quedan refacciones.`, `${nameOf(c)} couldn't fix the ${sysName.en.toLowerCase()}: no spare parts left.`)
        else {
          const engineer = c.duty === 'engineer'
          const odds = (engineer ? 0.95 : 0.7) * (engineer && fx.frustrated ? 0.65 : 1) * (0.6 + 0.4 * eff)
          if (r() < odds) {
            sys[id] = Math.min(100, sys[id] + (engineer ? 55 : 30) * eff)
            note('good', `${nameOf(c)} reparó ${sysName.es.toLowerCase()} (${Math.round(sys[id])}%).`, `${nameOf(c)} repaired the ${sysName.en.toLowerCase()} (${Math.round(sys[id])}%).`)
          } else note('bad', `${nameOf(c)} intentó reparar ${sysName.es.toLowerCase()}, pero falló.`, `${nameOf(c)} tried to fix the ${sysName.en.toLowerCase()}, but failed.`)
        }
      }
      if (k === 'medbay') {
        if (!working(m, 'medkit')) note('warn', 'Sin enfermería a bordo solo hubo primeros auxilios.', 'With no medical bay there was only first aid.')
        const patient = [...m.crew].sort((a, b) => a.health - b.health)[0]
        const heal = (c.duty === 'doctor' ? 22 : 8) * (working(m, 'medkit') ? 1 : 0.4) * (fx.medicBusy ? 0.5 : 1)
        patient.health = clamp(patient.health + heal)
        if (heal >= 10 && patient.health < 100) note('good', `${nameOf(c)} atendió a ${nameOf(patient)} en la enfermería.`, `${nameOf(c)} treated ${nameOf(patient)} in the medbay.`)
      }
      if (k === 'exercise') { c.health = clamp(c.health + 5); c.morale = clamp(c.morale + 6); c.lastExercise = day }
      if (k === 'recycle') { m.water = Math.min(100, m.water + 18); m.o2 = Math.min(100, m.o2 + 8) }
      if (k === 'comms') commsBoost += c.duty === 'pilot' ? 1.4 : 1
      if (k === 'explore') {
        const x = m.explore
        if (!x) note('warn', `${nameOf(c)} no tiene rover que manejar.`, `${nameOf(c)} has no rover to drive.`)
        else if (x.stuck >= 900) note('warn', 'El rover se perdió: ya no se puede explorar.', 'The rover is lost: no more exploring.')
        else if (x.stuck > 0) note('warn', `El rover sigue atascado (${x.stuck} día${x.stuck > 1 ? 's' : ''} más).`, `The rover is still stuck (${x.stuck} more day${x.stuck > 1 ? 's' : ''}).`)
        else {
          // The player chose the site on the logbook map (or the best one is picked)
          const key = exploreTarget(dest.id, x, tasks[c.id])
          const quest = key === 'q'
          const site = quest ? QUEST_SITES[x.quest.id] : SITES[dest.id][key]
          const from = x.pos || LANDING
          const km = distKm(from, site.pos)
          const seen = !quest && x.visited.includes(key)
          const base = quest ? site.sci : SITE_SCIENCE[site.risk]
          const gain = Math.round((base * (seen ? 0.4 : 1) + (x.route > 0 ? 8 : 0) + (m.parts.helicopter > 0 ? 3 : 0)) * eff)
          m.science += gain
          x.idx += 1
          x.prevPos = from
          x.trail = [...(x.trail || []), site.pos]
          x.pos = site.pos
          x.at = key
          if (!quest && !seen) x.visited.push(key)
          if (x.route > 0) x.route -= 1
          note('good', `${nameOf(c)} llevó el rover ${km.toFixed(1)} km hasta ${site.es}. ${site.fact.es} (+${gain} ciencia)`, `${nameOf(c)} drove the rover ${km.toFixed(1)} km to the ${site.en}. ${site.fact.en} (+${gain} science)`)
          addSample(site.sample)
          if (quest) {
            if (x.quest.id === 'heliLost') note('good', '¡Ingenuity vuelve a contestar! El rover le sirve de antena y el helicóptero está a salvo.', 'Ingenuity answers again! The rover relays its signal and the helicopter is safe.')
            else note('good', '¡Misión del rover cumplida!', 'Rover mission accomplished!')
            crewHit('morale', 8)
            x.quest = null
          }
          // Risky ground and long drives get the rover stuck more often; a scouting helicopter helps
          if (r() < (SITE_STUCK[site.risk] + km * 0.01) * (m.parts.helicopter > 0 ? 0.5 : 1)) { x.stuck = 3; note('bad', 'En el camino, el rover se atascó en terreno suave.', 'On the way, the rover got stuck in soft ground.') }
        }
      }
      if (k === 'eva') {
        // Outside the hull: external repairs need no spares, samples go straight into the science count
        const outside = ['antenna', 'solar'].filter((id) => sys[id] != null && sys[id] < 85).sort((a, b) => sys[a] - sys[b])[0]
        if (outside) { sys[outside] = Math.min(100, sys[outside] + 40 * eff); note('good', `${nameOf(c)} salió en caminata espacial y reparó ${SYSTEMS[outside].name.es.toLowerCase()} por fuera.`, `${nameOf(c)} went on a spacewalk and fixed the ${SYSTEMS[outside].name.en.toLowerCase()} from outside.`) }
        else { m.science += 12 * eff; note('good', `${nameOf(c)} salió en caminata espacial y recogió muestras: +${Math.round(12 * eff)} de ciencia.`, `${nameOf(c)} went on a spacewalk and collected samples: +${Math.round(12 * eff)} science.`) }
        doseToday += 1.5
        const storm = choice && (choice.event === 'solarStorm' || choice.event === 'radiationBelt')
        if (r() < (storm ? 0.45 : 0.12) + (c.energy < 40 ? 0.1 : 0)) { c.health = clamp(c.health - 25); note('bad', `Durante la caminata, ${nameOf(c)} se lastimó: un micrometeorito rozó el traje.`, `During the spacewalk, ${nameOf(c)} got hurt: a micrometeoroid grazed the suit.`) }
      }
      c.energy = clamp(c.energy + TASKS[k].energy * (k === 'rest' ? 1 : st.fatigue))
      // In weightlessness bones and muscles weaken without daily exercise (ISS crews train ~2 h a day)
      if (day - (c.lastExercise || 0) > 3) c.health = clamp(c.health - 2)
    })

    // The rover mission's clock
    const xq = m.explore && m.explore.quest
    if (xq) {
      xq.left -= 1
      if (xq.left <= 0 || m.explore.stuck >= 900) {
        if (xq.id === 'heliLost') { m.parts.helicopter = 0; note('bad', 'El rover no llegó a tiempo: Ingenuity se quedó sin batería y en silencio.', 'The rover didn’t make it in time: Ingenuity ran out of battery and went silent.') }
        else note('warn', `Se acabó el tiempo: ${QUEST_SITES[xq.id].es} quedó sin visitar.`, `Time ran out: the ${QUEST_SITES[xq.id].en.toLowerCase()} was never reached.`)
        m.explore.quest = null
      }
    }

    // Wear and tear, plus the odd sudden failure
    const ids = Object.keys(sys)
    // The engine sits idle in orbit, so it barely wears; everything else runs all day
    ids.forEach((id) => { sys[id] = Math.max(0, sys[id] - (id === 'engine' ? 0.4 : 1 + r() * 3)) })
    if (r() < 0.14 + day * 0.008) {
      const pool = ids.filter((id) => id !== 'engine' || r() < 0.3)
      const id = pool[Math.floor(r() * pool.length)]
      const was = sys[id]
      sys[id] = Math.max(0, sys[id] - (35 + r() * 25))
      if (was >= BROKEN) note('bad', `¡Falla a bordo! ${SYSTEMS[id].name.es} bajó a ${Math.round(sys[id])}%.`, `Failure on board! The ${SYSTEMS[id].name.en.toLowerCase()} dropped to ${Math.round(sys[id])}%.`)
    }

    // Air and water: the crew breathes and drinks; working machines recycle
    const ok = (id) => (sys[id] >= BROKEN ? sys[id] / 100 : 0)
    m.o2 = Math.max(0, Math.min(100, m.o2 - 7 + 7.6 * ok('scrubber')))
    m.water = Math.max(0, Math.min(100, m.water - 6 + 5.4 * ok('recycler')))
    if (sys.scrubber < BROKEN) note('bad', 'El filtro de CO₂ está roto: el oxígeno baja.', 'The CO₂ scrubber is broken: oxygen is dropping.')
    if (sys.recycler < BROKEN) note('warn', 'El reciclador de agua no funciona.', 'The water recycler is down.')
    if (m.o2 < 25) { crewHit('health', -8); crewHit('energy', -8); note('bad', 'Aire viciado: mareos y dolor de cabeza.', 'Stale air: dizziness and headaches.') }
    if (m.water < 20) { crewHit('health', -5); crewHit('morale', -5); note('bad', 'Agua racionada al mínimo.', 'Water rationed to the bare minimum.') }
    if (opts.ration) { m.supplies += 0.5; crewHit('morale', -6); crewHit('energy', -5) }
    solarFactor = sys.solar == null ? 1 : sys.solar >= BROKEN ? 0.6 + 0.4 * sys.solar / 100 : 0.4

    // The story thread from the prologue: getting Earth's voice back
    if (!m.voiceBack && sys.antenna >= 70) {
      m.voiceBack = true
      crewHit('morale', 15)
      note('good', '¡Antena reparada! Después de días de silencio, se escucha la voz de control de misión. Hay lágrimas en la cabina.', 'Antenna fixed! After days of silence, Mission Control’s voice comes through. There are tears in the cabin.')
    }
  }
  m.lastStorm = !!choice && (choice.event === 'solarStorm' || choice.event === 'radiationBelt')

  // 2. Hidden defects from skipped tests
  m.defects.filter((d) => d.day === day).forEach((d) => {
    const def = DEFECTS[d.test]
    if (m.parts[def.part] > 0) m.parts[def.part] -= 1
    else breakPart(() => true)
    note('bad', def.text.es, def.text.en)
  })

  // 3. Science and data: instruments that still work, power, electronics and crew shape
  const s = summarize(dest, m.parts, null, [])
  const power = (s.use > 0 ? Math.min(1, (s.generation * solarFactor) / s.use) : 1) * powerPenalty
  if (power < 1) note('warn', `Energía al ${Math.round(power * 100)} %.`, `Power at ${Math.round(power * 100)}%.`)
  const crewShape = m.crew ? m.crew.reduce((a, c) => a + (0.5 + 0.25 * c.energy / 100 + 0.25 * c.morale / 100) * (c.health / 100), 0) / m.crew.length : 1
  const raw = s.science * 2.2 * sciFactor * power * (m.electronics / 100) * crewShape * st.science * m.gyroPenalty
  const antennaUp = !m.systems || m.systems.antenna >= BROKEN
  const link = s.link <= 0 ? 0 : !antennaUp ? (working(m, 'lga') ? 3 : 0) : tasks ? s.link * (4 + 5 * commsBoost) : s.link * (plan === 'transmit' ? 12 : 4)
  m.dataPending += raw
  const sent = Math.min(m.dataPending, link)
  m.dataPending -= sent
  m.science += sent
  // Last day: whatever is stored on board goes home in one final downlink if the antenna works
  if (day >= m.totalDays && antennaUp && m.dataPending > 0) { m.science += m.dataPending * 0.8; m.dataPending = 0 }
  if (s.link === 0) note('bad', 'Sin antena funcionando: los datos no llegan a la Tierra.', 'No working antenna: data can’t reach Earth.')
  else if (!antennaUp) note('warn', 'La antena principal sigue dañada: los datos se acumulan a bordo.', 'The main antenna is still damaged: data piles up on board.')

  // 4. Crew: fatigue, morale, food and dose
  if (m.crew) {
    m.supplies -= 1
    m.crew.forEach((c) => {
      if (!tasks) c.energy = clamp(c.energy + (plan === 'rest' ? 25 : plan === 'transmit' ? -4 : -9 * st.fatigue))
      c.morale = clamp(c.morale - (2 + day * 0.4) * st.morale + (c.duty === 'doctor' ? 1 : 0))
      if (c.energy < 15) c.health = clamp(c.health - 4)
      if (m.supplies < 0) { c.health = clamp(c.health - 10); c.morale = clamp(c.morale - 10) }
    })
    if (m.supplies < 0) note('bad', 'Se acabaron las provisiones: la tripulación sufre.', 'Supplies ran out: the crew is suffering.')
  }
  m.dose += doseToday * Math.max(0.3, 1 - m.shield * 0.15)

  // 5. Losing the mission
  if (s.link === 0 && !dest.crewed) m.lostWhy = 'probe'
  if (m.crew && m.crew.some((c) => c.health <= 0)) m.lostWhy = 'crew'
  if (m.o2 <= 0) m.lostWhy = 'o2'
  if (m.systems && day >= m.totalDays && m.systems.engine < BROKEN) m.lostWhy = 'engine'
  if (m.electronics <= 0) m.lostWhy = 'radiation'
  if (s.link === 0 && !dest.crewed) m.lost = { es: 'Se perdió todo contacto con la sonda.', en: 'All contact with the probe was lost.' }
  if (m.crew && m.crew.some((c) => c.health <= 0)) m.lost = { es: 'Un tripulante quedó en estado crítico: la misión se aborta.', en: 'A crew member is in critical condition: the mission is aborted.' }
  if (m.o2 <= 0) m.lost = { es: 'Se acabó el oxígeno respirable: la misión se aborta.', en: 'Breathable oxygen ran out: the mission is aborted.' }
  if (m.systems && day >= m.totalDays && m.systems.engine < BROKEN) m.lost = { es: 'El motor principal no encendió para la maniobra de regreso.', en: 'The main engine failed to fire for the return burn.' }
  if (m.electronics <= 0) m.lost = { es: 'La radiación destruyó la electrónica de la nave.', en: 'Radiation destroyed the spacecraft’s electronics.' }

  m.day = day
  m.over = !!m.lost || day >= m.totalDays
  // Story moments of the day go first in the logbook
  storyFor(day, dest, m.crew, m.totalDays).reverse().forEach((st) => notes.unshift({ type: 'story', text: { es: st.es, en: st.en } }))
  m.journal = [...m.journal, { day, plan, science: Math.round(sent), entries: notes, snap: { dose: m.dose, food: m.supplies, o2: m.o2, water: m.water } }]
  return m
}

// One order per day to a crew member
export function giveOrder(m0, crewId, order) {
  if (!m0.crew || m0.orderDay === m0.day) return m0
  const m = { ...m0, crew: m0.crew.map((c) => ({ ...c })) }
  const c = m.crew.find((x) => x.id === crewId)
  if (order === 'rest') c.energy = clamp(c.energy + 35)
  if (order === 'medical' && !(m0.effects && m0.effects.medicBusy)) c.health = clamp(c.health + 15)
  if (order === 'exercise') { c.health = clamp(c.health + 8); c.energy = clamp(c.energy - 10) }
  if (order === 'talk') c.morale = clamp(c.morale + 12)
  m.orderDay = m.day
  return m
}

// Biometric HUD numbers (team idea: heart rate, blood pressure, fluid shift instead of a health bar)
export function biometrics(c, day) {
  return {
    heart: Math.round(62 + (100 - c.energy) * 0.25 + (100 - c.morale) * 0.15 + (100 - c.health) * 0.2),
    pressure: `${Math.round(112 + (100 - c.health) * 0.3 + day * 0.6)}/${Math.round(72 + (100 - c.energy) * 0.1)}`,
    fluid: Math.min(100, Math.round(20 + day * 5)),
  }
}

export function grade(m) {
  const pct = Math.round((m.science / m.goal) * 100)
  const level = m.lost ? 'lost' : pct >= 100 ? 'success' : pct >= 60 ? 'partial' : 'fail'
  return { pct, level }
}
