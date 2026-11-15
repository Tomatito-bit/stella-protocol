// Internal test suite: game logic, data integrity, translations and assets.
// Run: node --import ./scripts/hooks.mjs scripts/check-all.mjs
import { existsSync, readFileSync } from 'node:fs'
import { DESTINATIONS } from '../src/data/destinations.js'
import { EVENTS } from '../src/data/events.js'
import { SECRET_EVENTS } from '../src/data/secretEvents.js'
import { CREW } from '../src/data/crew.js'
import { RECOMMENDED, PARTS, LAUNCHERS } from '../src/data/parts.js'
import { startMission, rollEvent, nextDay, grade } from '../src/logic/mission.js'
import { defaultTasks, carryTasks, TASKS, SYSTEMS } from '../src/logic/ship.js'
import { summarize } from '../src/logic/budget.js'
import { reviewBoard } from '../src/logic/review.js'
import { endingOf, epilogueLine } from '../src/data/endings.js'
import { storyFor, PAST } from '../src/data/story.js'
import { quoteOfDay } from '../src/data/quotes.js'
import { STRINGS } from '../src/i18n.js'
import { useGame } from '../src/store.js'
import * as THREE from 'three'
import { route, regionOf } from '../src/logic/deckRoute.js'
import { ROOM_SLOTS } from '../src/logic/crewPlaces.js'
import { SITES, SAMPLES, SAMPLES_FOR, SAMPLE_GOAL, QUEST_SITES, QUEST_EVENTS, siteChoices, exploreTarget } from '../src/data/exploration.js'

let fails = 0
let checks = 0
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('  FALLA:', msg) } }
const section = (name) => console.log(`\n== ${name}`)
const both = (o) => o && typeof o.es === 'string' && typeof o.en === 'string' && o.es.length > 0 && o.en.length > 0

// ---------- 1. Data integrity ----------
section('Datos: eventos, tripulación, piezas, historia')
for (const [id, ev] of Object.entries(EVENTS)) {
  if (!ev.options) continue // defect texts live elsewhere
  ok(both(ev.title), `evento ${id}: título en ambos idiomas`)
  ok(both(ev.text), `evento ${id}: texto en ambos idiomas`)
  ok(both(ev.fact), `evento ${id}: dato real en ambos idiomas`)
  ok(ev.options.length >= 2 || (ev.options.length === 1 && ev.options[0].risk === 'safe'), `evento ${id}: opciones válidas (las buenas noticias pueden tener una)`)
  ev.options.forEach((o) => {
    ok(both(o.label) && both(o.detail), `evento ${id}/${o.id}: textos de la opción`)
    ok(['safe', 'medium', 'risky'].includes(o.risk), `evento ${id}/${o.id}: riesgo válido (${o.risk})`)
  })
}
for (const [id, s] of Object.entries(SECRET_EVENTS)) ok(both(s.reveal) && s.dests.length, `secreto ${id}: revelación y destinos`)
CREW.forEach((c) => {
  ok(both(c.role) && both(c.bio || { es: 'x', en: 'x' }) && both(c.quote), `tripulante ${c.id}: textos`)
  ok(both(PAST[c.id]), `tripulante ${c.id}: pasado`)
  ok(existsSync(`public/portraits/${c.name.split(' ')[0].toLowerCase()}.png`), `tripulante ${c.id}: foto de la bitácora`)
})
Object.values(TASKS).forEach((t) => ok(both(t.name) && both(t.tip), 'tarea con nombre y ayuda'))
Object.values(SYSTEMS).forEach((s) => ok(both(s.name), 'sistema con nombre'))
ok(PARTS.length > 10 && LAUNCHERS.length >= 3, 'catálogo de piezas y cohetes')

// ---------- 2. Assets ----------
section('Archivos: modelos y texturas')
;['models/astronaut.glb', 'models/deck.glb', 'textures/moon.jpg', 'textures/mars.jpg', 'textures/europa.jpg'].forEach((f) => ok(existsSync(`public/${f}`), `existe public/${f}`))
const glb = readFileSync('public/models/astronaut.glb')
ok(glb.slice(0, 4).toString() === 'glTF' && glb.length > 100000, 'astronaut.glb es un glTF válido')
ok(['Kit_engineer', 'Kit_pilot', 'Kit_doctor', 'Kit_analyst', 'ShoulderL', 'HipR'].every((n) => glb.includes(n)), 'astronauta trae accesorios por rol y articulaciones')
const deck = readFileSync('public/models/deck.glb')
ok(['Spot_pilot', 'Bed_1', 'Shelter', 'Room_Airlock', 'Door_Bridge'].every((n) => deck.includes(n)), 'la cubierta trae los puntos de caminata')

// ---------- 3. Translations ----------
section('Traducciones')
const es = Object.keys(STRINGS.es)
const en = Object.keys(STRINGS.en)
es.filter((k) => !en.includes(k)).forEach((k) => ok(false, `falta en inglés: ${k}`))
en.filter((k) => !es.includes(k)).forEach((k) => ok(false, `falta en español: ${k}`))
ok(es.length === en.length, `mismas claves en ambos idiomas (${es.length})`)
// every t('key') used in the screens exists
const files = ['App.jsx', 'screens/Home.jsx', 'screens/Destination.jsx', 'screens/Crew.jsx', 'screens/Design.jsx', 'screens/Review.jsx', 'screens/Launch.jsx', 'screens/Mission.jsx', 'screens/Legacy.jsx']
files.forEach((f) => {
  const src = readFileSync(`src/${f}`, 'utf8')
  for (const m of src.matchAll(/\bt\('([a-zA-Z_]+)'/g)) ok(es.includes(m[1]) || m[1].includes('_'), `${f}: la clave '${m[1]}' existe`)
})

// ---------- 4. Recommended designs pass review ----------
section('Naves recomendadas pasan la revisión GO / NO-GO')
for (const d of DESTINATIONS) {
  const r = RECOMMENDED[d.id]
  const s = summarize(d, r.parts, r.launcher, ['vacuum', 'vibration', 'deployment'])
  const board = reviewBoard(d, r.parts, s, ['vacuum', 'vibration', 'deployment'])
  ok(board.noGo === 0, `${d.id}: todas las consolas GO (NO-GO: ${board.consoles.filter((c) => !c.go).map((c) => c.id).join(', ') || 'ninguno'})`)
  ok(s.budgetLeft >= 0, `${d.id}: dentro del presupuesto`)
}

// ---------- 5. Thousands of simulated missions: no impossible values ----------
section('Simulación: 4 800 misiones (3 destinos × 4 comandantes × 2 estrategias × 200)')
const endings = {}
const firstEvent = {}
let bad = 0
for (const d of DESTINATIONS) for (const cmd of CREW.map((c) => c.id)) for (const policy of ['safe', 'risky']) {
  for (let i = 0; i < 200; i++) {
    const r = RECOMMENDED[d.id]
    let m = startMission(d, r.parts, r.launcher, ['vacuum', 'vibration'], cmd, i * 131 + 7)
    let tasks = m.crew ? defaultTasks(m) : null
    let guard = 0
    while (!m.over && guard++ < 60) {
      const ev = rollEvent(m, d, cmd)
      if (ev && firstEvent[d.id] == null) firstEvent[d.id] = m.day + 1
      if (ev && m.day < 2) { ok(false, `evento antes del día 3 (${ev})`); bad++ }
      let choice = null
      if (ev) {
        ok(!!EVENTS[ev], `evento desconocido: ${ev}`)
        const opts = EVENTS[ev].options.filter((o) => !o.crewedOnly || d.crewed)
        const o = policy === 'safe' ? opts.find((x) => x.risk === 'safe') || opts[0] : opts.find((x) => x.risk === 'risky') || opts[0]
        choice = { event: ev, option: o.id, risk: o.risk }
      }
      m = nextDay(m, d, cmd, 'science', choice, { tasks, ration: i % 7 === 0 })
      if (m.crew) tasks = i % 2 ? defaultTasks(m) : carryTasks(tasks, m)
      // invariants
      const nums = [m.science, m.dose, m.electronics, m.o2, m.water, m.spares, m.spareTanks]
      if (nums.some((x) => typeof x !== 'number' || Number.isNaN(x))) { bad++; ok(false, `${d.id}: valor no numérico el día ${m.day}`) }
      if (m.electronics < 0 || m.electronics > 100 || m.spares < 0 || m.spareTanks < 0) { bad++; ok(false, `${d.id}: valor fuera de rango el día ${m.day}`) }
      if (m.crew && m.crew.some((c) => [c.health, c.energy, c.morale].some((v) => v < 0 || v > 100 || Number.isNaN(v)))) { bad++; ok(false, `${d.id}: signos vitales fuera de 0–100`) }
      if (m.systems && Object.values(m.systems).some((v) => v < 0 || v > 100)) { bad++; ok(false, `${d.id}: sistema fuera de 0–100`) }
    }
    ok(m.over, `${d.id}/${cmd}: la misión termina`)
    const g = grade(m)
    const e = endingOf(m, g.level)
    if (m.crew || m.lost || g.level === 'fail') ok(both(e.title) && both(e.text), `final con textos (${m.lostWhy || g.level})`)
    endings[m.lostWhy || g.level] = (endings[m.lostWhy || g.level] || 0) + 1
    if (m.crew) m.crew.forEach((c) => ok(epilogueLine(c, c.duty, true).length > 10, 'epílogo de tripulante'))
    ok(m.journal.length === m.day + 1, 'una página de bitácora por día')
  }
}
console.log('  Finales:', JSON.stringify(endings))
ok(bad === 0, 'ningún valor imposible en toda la simulación')
ok(Object.keys(endings).length >= 4, 'se alcanzan varios finales distintos')

// ---------- 6. Story and quotes ----------
section('Historia y notas')
const mars = DESTINATIONS.find((d) => d.id === 'mars')
const crew = CREW.map((c) => ({ id: c.id, duty: c.duty, commander: c.id === 'valeria', health: 80, energy: 80, morale: 80 }))
let beats = 0
for (let day = 1; day <= 14; day++) beats += storyFor(day, mars, crew, 14).length
ok(beats >= 8, `momentos de historia en una misión a Marte: ${beats}`)
ok(both(quoteOfDay(crew, 3).text), 'nota del tripulante en ambos idiomas')

// ---------- 6b. Astronauts never walk through walls ----------
section('Caminatas en la nave: siempre por las puertas')
{
  const glb = readFileSync('public/models/deck.glb')
  const json = JSON.parse(glb.slice(20, 20 + glb.readUInt32LE(12)).toString())
  const nodes = {}
  json.nodes.forEach((n) => { if (/^(Room_|Door_|Hall_|Spot_|Bed_|Shelter)/.test(n.name || '')) { const [x, y, z] = n.translation || [0, 0, 0]; nodes[n.name] = new THREE.Vector3(x, y, z) } })
  const spots = Object.keys(nodes).filter((k) => /^(Spot_|Bed_|Shelter|Room_)/.test(k))
  const offsets = [[0, 0], [0.55, 0], [-0.55, 0], [0, 0.5], [0, 0.95]]
  let walks = 0
  let crossings = 0
  const walk = (from, to, off) => {
    const pts = [from.clone(), ...route(nodes, from, to, off)]
    for (let i = 0; i + 1 < pts.length; i++) {
      let prev = regionOf(nodes, pts[i])
      for (let k = 1; k <= 40; k++) {
        const p = pts[i].clone().lerp(pts[i + 1], k / 40)
        const r = regionOf(nodes, p)
        if (r !== prev) {
          crossings++
          const room = r === 'hall' ? prev : prev === 'hall' ? r : null
          ok(room !== null, `${to}: pasa de ${prev} a ${r} sin el pasillo`)
          if (room) ok(Math.abs(p.x - nodes[`Door_${room}`].x) < 0.9 && Math.abs(p.z - nodes[`Door_${room}`].z) < 0.9, `${to}: entra/sale de ${room} por la puerta`)
          prev = r
        }
      }
    }
    walks++
    return pts
  }
  // Same offsets the game uses: beds always [0, 0.95]; shared job spots use the side-by-side slots
  for (const a of spots) for (const b of spots) for (const off of (/^Bed_/.test(b) ? [[0, 0.95]] : /^Room_/.test(b) ? [[0, 0], ...ROOM_SLOTS] : [[0, 0], [0.55, 0], [-0.55, 0]])) {
    const path = walk(nodes[a].clone(), b, off)
    // change of plans mid-walk: from a point halfway along the first leg, head somewhere else
    if (path.length > 2) for (const c of spots.slice(0, 6)) walk(path[0].clone().lerp(path[1], 0.5), c, [0, 0])
  }
  console.log(`  ${walks} caminatas, ${crossings} cruces de puerta revisados`)
}

// ---------- 6c. Rover: map choices, samples, rover missions ----------
section('Rover: mapa, muestras y misiones por evento')
for (const [dest, list] of Object.entries(SITES)) {
  list.forEach((st, i) => {
    ok(Array.isArray(st.pos) && st.pos.every((v) => v >= 5 && v <= 95), `${dest}/${i}: sitio dentro del mapa`)
    ok(['safe', 'medium', 'risky'].includes(st.risk), `${dest}/${i}: riesgo del sitio`)
    ok(SAMPLES[st.sample] && SAMPLES_FOR[dest].includes(st.sample), `${dest}/${i}: muestra del sitio existe`)
  })
  ok(SAMPLES_FOR[dest].length >= SAMPLE_GOAL, `${dest}: hay suficientes muestras para completar la colección`)
}
for (const [id, smp] of Object.entries(SAMPLES)) ok(both(smp.name) && both(smp.fact) && /^#[0-9a-f]{6}$/.test(smp.color), `muestra ${id}: nombre, dato y color`)
for (const [id, q] of Object.entries(QUEST_SITES)) {
  ok(QUEST_EVENTS[id] && both(q) && both(q.fact) && q.sci > 0, `misión ${id}: sitio con textos y ciencia`)
  if (q.sample) ok(SAMPLES_FOR[QUEST_EVENTS[id].dests[0]].includes(q.sample), `misión ${id}: su muestra pertenece al destino`)
}
{
  const d = DESTINATIONS.find((x) => x.id === 'mars')
  const r = RECOMMENDED.mars
  const base = startMission(d, r.parts, r.launcher, ['vacuum', 'vibration'], 'kwame', 42)
  ok(base.explore && base.explore.at === -1 && base.explore.samples.length === 0, 'el rover empieza junto al módulo, sin muestras')
  const ch = siteChoices('mars', base.explore)
  ok(ch.length === 3 && ch.every((c) => c.km > 0), 'el mapa ofrece 3 sitios con distancia')
  // The player's pick is respected: drive to the farthest choice
  const far = ch[ch.length - 1].key
  const driver = base.crew.find((c) => c.duty === 'pilot')
  const tasks = { ...defaultTasks(base), [driver.id]: `explore:${far}` }
  ok(exploreTarget('mars', base.explore, tasks[driver.id]) === far, 'el destino elegido es el que se usa')
  const m1 = nextDay(base, d, 'kwame', 'science', null, { tasks })
  ok(m1.explore.at === far && m1.explore.visited.includes(far), 'el rover llega al sitio elegido')
  ok(m1.explore.samples.includes(SITES.mars[far].sample), 'y guarda la muestra de ese sitio')
  ok(base.explore.visited.length === 0 && base.explore.samples.length === 0, 'el día anterior no se modifica (sin efectos secundarios)')
  ok(m1.journal[m1.journal.length - 1].entries.some((e) => /km/.test(e.text.es)), 'la bitácora dice cuántos km manejó')
  // A visited site is not offered again while new ones remain
  ok(!siteChoices('mars', m1.explore).some((c) => c.key === far), 'el sitio visitado no se vuelve a ofrecer')
  // Rover mission: accept it, it shows on the map, and driving there completes it
  const m2 = nextDay(m1, d, 'kwame', 'science', { event: 'brightSpot', option: 'go', risk: 'medium' }, { tasks: defaultTasks(m1) })
  ok(m2.explore.questsDone.includes('brightSpot'), 'la misión del rover queda registrada')
  const open = m2.explore.quest
  if (open) {
    ok(siteChoices('mars', m2.explore)[0].key === 'q', 'la misión aparece primero en el mapa')
    const t2 = { ...defaultTasks(m2), [driver.id]: 'explore:q' }
    const m3 = nextDay({ ...m2, explore: { ...m2.explore, stuck: 0 } }, d, 'kwame', 'science', null, { tasks: t2 })
    ok(!m3.explore.quest && m3.explore.samples.includes('meteorite'), 'llegar al sitio cumple la misión y da el meteorito')
  } else ok(m2.explore.samples.includes('meteorite'), 'la misión se cumplió el mismo día')
  // Deadline: ignore it and it expires
  let mx = nextDay(m1, d, 'kwame', 'science', { event: 'methaneSpike', option: 'go', risk: 'medium' }, { tasks: { ...defaultTasks(m1), [driver.id]: 'science' } })
  for (let k = 0; k < 4 && mx.explore.quest; k++) mx = nextDay(mx, d, 'kwame', 'science', null, { tasks: { ...defaultTasks(mx), [driver.id]: 'science' } })
  ok(!mx.explore.quest && !mx.explore.samples.includes('air'), 'si no vas, la misión caduca a los 3 días')
  // Rover missions never repeat and only one is open at a time
  let seen = 0
  for (let day = 2; day < 40; day++) { const e = rollEvent({ ...m2, day }, d, 'kwame'); if (e === 'brightSpot' || (m2.explore.quest && QUEST_EVENTS[e])) seen++ }
  ok(seen === 0, 'una misión del rover a la vez y nunca repetida')
  // Special ending for a full collection
  const full = { ...m1, explore: { ...m1.explore, samples: SAMPLES_FOR.mars.slice(0, SAMPLE_GOAL) }, voiceBack: true, science: m1.goal * 1.2 }
  ok(/piedras/.test(endingOf(full, 'success').title.es), 'colección completa + éxito = final especial')
}
// Over the big simulation, rover days must keep finding samples
{
  let samples = 0, runs = 0
  for (const dest of ['mars', 'moon']) for (let i = 0; i < 100; i++) {
    const d = DESTINATIONS.find((x) => x.id === dest)
    const r = RECOMMENDED[dest]
    let m = startMission(d, r.parts, r.launcher, ['vacuum', 'vibration'], 'kwame', i * 97 + 3)
    let tasks = defaultTasks(m)
    for (let g = 0; g < 60 && !m.over; g++) {
      const ev = rollEvent(m, d, 'kwame')
      const o = ev && (EVENTS[ev].options.find((x) => x.risk === 'safe') || EVENTS[ev].options[0])
      m = nextDay(m, d, 'kwame', 'science', ev ? { event: ev, option: o.id, risk: o.risk } : null, { tasks })
      if (m.crew) tasks = carryTasks(defaultTasks(m), m)
    }
    samples += m.explore.samples.length; runs++
    ok(m.explore.samples.every((id) => SAMPLES_FOR[dest].includes(id)), `${dest}: solo muestras del destino`)
    ok(new Set(m.explore.samples).size === m.explore.samples.length, `${dest}: sin muestras repetidas`)
  }
  console.log(`  muestras por misión (promedio): ${(samples / runs).toFixed(1)}`)
  ok(samples / runs >= 2, 'el rover junta muestras en una misión normal')
}

// ---------- 7. The real game loop through the store, every destination ----------
section('Ciclo real del juego (tienda de estado) en los 3 destinos')
for (const d of DESTINATIONS) {
  const g = useGame
  g.getState().restart()
  g.getState().chooseDestination(d.id)
  ok(g.getState().screen === 'crew', `${d.id}: pasa a tripulación`)
  g.getState().chooseCommander('kwame')
  ok(g.getState().screen === 'design', `${d.id}: pasa a diseño`)
  g.getState().useRecommended()
  g.getState().launch()
  ok(g.getState().screen === 'mission', `${d.id}: lanzamiento lleva a la misión`)
  let days = 0
  while (g.getState().screen === 'mission' && days < 40) {
    const s = g.getState()
    if (!s.journalOpen) s.openJournal()
    ok(!g.getState().live, `${d.id}: abrir la bitácora termina la alerta en vivo`)
    if (s.event) {
      const before = s.mission.day
      g.getState().startDay()
      ok(g.getState().mission.day === before, `${d.id}: no avanza sin decidir el evento`)
      const o = EVENTS[s.event].options.find((x) => x.risk === 'safe') || EVENTS[s.event].options[0]
      g.getState().pickOption(o.id, o.risk)
    }
    g.getState().startDay()
    if (g.getState().screen === 'mission') ok(!g.getState().journalOpen, `${d.id}: la bitácora se cierra al vivir el día`)
    days++
  }
  ok(g.getState().screen === 'legacy', `${d.id}: llega al final (días: ${days})`)
}

console.log(`\n${checks - fails} de ${checks} comprobaciones correctas${fails ? ` · ${fails} fallas` : ''}`)
process.exit(fails ? 1 : 0)
