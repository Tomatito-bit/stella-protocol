import { CREW, crewById } from '../data/crew'
import { DEFECTS } from '../data/events'
import { TESTS, partById } from '../data/parts'
import { summarize, count } from './budget'

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
const GOAL = { moon: 120, mars: 160, europa: 150 }

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
    ? [crewById[commanderId], ...CREW.filter((c) => c.id !== commanderId)].map((c) => ({ id: c.id, duty: c.duty, commander: c.id === commanderId, health: 100, morale: 85, energy: 90, hiddenFound: false }))
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
    over: false,
    lost: null,
    decisions: [],
    journal: [{ day: 0, entries: [{ type: 'good', text: { es: `Llegamos a ${dest.name.es}. Inicia la operación.`, en: `We have arrived at ${dest.name.en}. Operations begin.` } }, ...log] }],
  }
}

// Picks today's event (or none). Destination and commander style change the odds.
export function rollEvent(m, dest, commanderId) {
  const r = rng(m.seed + m.day * 977 + 13)
  const st = styleOf(commanderId)
  const pool = []
  const add = (id, w) => pool.push([id, w])
  add('solarStorm', 0.09 * dest.radiation * st.danger)
  if (dest.id === 'europa') add('radiationBelt', 0.22 * st.danger)
  add('micrometeoroid', 0.07 * st.danger)
  add('opportunity', 0.1 * st.opportunity)
  if (dest.crewed) {
    add('co2', 0.07 * st.danger)
    add('medical', 0.05 + m.day * 0.004)
    add('conflict', (0.03 + m.day * 0.01) * (st.conflict || 1))
    if (m.day === 1) add('gravity', 0.7)
  } else add('gyro', 0.06)
  if (dest.id === 'moon') { add('dust', 0.1); add('shadowIce', 0.1); add('earthset', 0.08) }
  if (dest.id === 'mars') { add('dustDevil', 0.06); add('conjunction', m.day > 4 && !m.conjunctionSeen ? 0.12 : 0) }
  if (dest.id === 'europa') { add('plume', 0.1); add('transistor', 0.08) }
  if (dest.crewed) { add('homeMessage', 0.06); add('harvest', m.day > 3 ? 0.05 : 0); add('drill', m.drilled ? 0 : 0.06) }
  if (dest.id === 'mars') add('dustStorm', 0.08)
  if (dest.delayMin > 5) add('delay', 0.07)
  for (const [id, w] of pool) if (r() < w) return id
  return null
}

const working = (m, id) => (m.parts[id] || 0) > 0

// Advances one day. plan: 'science' | 'transmit' | 'rest'. choice: { event, option } or null.
export function nextDay(m0, dest, commanderId, plan, choice) {
  const r = rng(m0.seed + m0.day * 7919 + 1)
  const st = styleOf(commanderId)
  const m = { ...m0, parts: { ...m0.parts }, crew: m0.crew && m0.crew.map((c) => ({ ...c })), decisions: [...m0.decisions] }
  const day = m.day + 1
  const notes = []
  const note = (type, es, en) => notes.push({ type, text: { es, en } })
  let sciFactor = plan === 'science' ? 1 : plan === 'transmit' ? 0.3 : 0
  let doseToday = 0.4 * dest.radiation // galactic cosmic rays, always there
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
      }
    }
    if (event === 'co2') {
      const eng = m.crew.find((c) => c.duty === 'engineer')
      if (option === 'repair' && takeSpare()) note('good', 'Filtro nuevo: el aire está limpio.', 'New filter: the air is clean.')
      else if (option === 'improvise' && (eng.energy > 50 || m.drilled)) note('good', 'La ingeniera improvisó un filtro como en el Apolo 13. ¡Funcionó!', 'The engineer rigged a filter like Apollo 13. It worked!')
      else { crewHit('health', -12); note('bad', 'El CO₂ alto dejó a todos con dolor de cabeza.', 'High CO₂ left everyone with headaches.') }
    }
    if (event === 'medical') {
      const sick = m.crew[1 + Math.floor(r() * 3)]
      if (option === 'treat' && working(m, 'medkit')) { sick.health = clamp(sick.health - 5); note('good', 'Tratamiento en la enfermería: el coágulo se controló.', 'Treated in the medical bay: the clot is under control.') }
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
    if (event === 'opportunity') {
      if (option === 'study') {
        const has = dest.goals.some((g) => working(m, g))
        if (has) { m.science += 15; note('good', '¡Descubrimiento! +15 de ciencia.', 'Discovery! +15 science.') }
        else note('bad', 'No llevabas el instrumento adecuado para estudiarlo.', 'You lacked the right instrument to study it.')
      }
    }
  }

  // 2. Hidden defects from skipped tests
  m.defects.filter((d) => d.day === day).forEach((d) => {
    const def = DEFECTS[d.test]
    if (m.parts[def.part] > 0) m.parts[def.part] -= 1
    else breakPart(() => true)
    note('bad', def.text.es, def.text.en)
  })

  // 3. Science and data: instruments that still work, power, electronics and crew shape
  const s = summarize(dest, m.parts, null, [])
  const power = s.use > 0 ? Math.min(1, s.generation / s.use) : 1
  if (power < 1) note('warn', `Energía al ${Math.round(power * 100)} %.`, `Power at ${Math.round(power * 100)}%.`)
  const crewShape = m.crew ? m.crew.reduce((a, c) => a + (0.5 + 0.25 * c.energy / 100 + 0.25 * c.morale / 100) * (c.health / 100), 0) / m.crew.length : 1
  const raw = s.science * 2.2 * sciFactor * power * (m.electronics / 100) * crewShape * st.science * m.gyroPenalty
  const link = s.link > 0 ? s.link * (plan === 'transmit' ? 12 : 4) : 0
  m.dataPending += raw
  const sent = Math.min(m.dataPending, link)
  m.dataPending -= sent
  m.science += sent
  if (s.link === 0) note('bad', 'Sin antena funcionando: los datos no llegan a la Tierra.', 'No working antenna: data can’t reach Earth.')

  // 4. Crew: fatigue, morale, food and dose
  if (m.crew) {
    m.supplies -= 1
    m.crew.forEach((c) => {
      c.energy = clamp(c.energy + (plan === 'rest' ? 25 : plan === 'transmit' ? -4 : -9 * st.fatigue))
      c.morale = clamp(c.morale - (2 + day * 0.4) * st.morale + (c.duty === 'doctor' ? 1 : 0))
      if (c.energy < 15) c.health = clamp(c.health - 4)
      if (m.supplies < 0) { c.health = clamp(c.health - 10); c.morale = clamp(c.morale - 10) }
    })
    if (m.supplies < 0) note('bad', 'Se acabaron las provisiones: la tripulación sufre.', 'Supplies ran out: the crew is suffering.')
  }
  m.dose += doseToday * Math.max(0.3, 1 - m.shield * 0.15)

  // 5. Losing the mission
  if (s.link === 0 && !dest.crewed) m.lost = { es: 'Se perdió todo contacto con la sonda.', en: 'All contact with the probe was lost.' }
  if (m.crew && m.crew.some((c) => c.health <= 0)) m.lost = { es: 'Un tripulante quedó en estado crítico: la misión se aborta.', en: 'A crew member is in critical condition: the mission is aborted.' }
  if (m.electronics <= 0) m.lost = { es: 'La radiación destruyó la electrónica de la nave.', en: 'Radiation destroyed the spacecraft’s electronics.' }

  m.day = day
  m.over = !!m.lost || day >= m.totalDays
  m.journal = [...m.journal, { day, plan, science: Math.round(sent), entries: notes }]
  return m
}

// One order per day to a crew member
export function giveOrder(m0, crewId, order) {
  if (!m0.crew || m0.orderDay === m0.day) return m0
  const m = { ...m0, crew: m0.crew.map((c) => ({ ...c })) }
  const c = m.crew.find((x) => x.id === crewId)
  if (order === 'rest') c.energy = clamp(c.energy + 35)
  if (order === 'medical') c.health = clamp(c.health + 15)
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
