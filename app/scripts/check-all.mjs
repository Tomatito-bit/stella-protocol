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
