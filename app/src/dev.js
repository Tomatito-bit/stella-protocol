// Development only: open a screen with a sample spacecraft, e.g. ?demo=design&dest=mars
import { useGame } from './store'
import { destinationById } from './data/destinations'
import { startMission, nextDay } from './logic/mission'
import { defaultTasks } from './logic/ship'

const SAMPLE = {
  moon: { solar: 3, battery: 1, engine: 2, tank: 3, hga: 1, lga: 1, camera: 1, spectrometer: 1, drill: 1, eclss: 2, shielding: 1, supplies: 2, medkit: 1, spares: 1 },
  mars: { solar: 4, battery: 2, engine: 2, tank: 4, hga: 1, lga: 1, camera: 1, spectrometer: 1, radar: 1, eclss: 2, shielding: 1, supplies: 3, medkit: 1, spares: 1 },
  europa: { solarxl: 2, rtg: 1, battery: 1, engine: 1, tank: 3, hga: 1, lga: 1, camera: 1, radar: 1, magnetometer: 1, shielding: 3, spares: 1 },
}

export function loadDemo() {
  const q = new URLSearchParams(location.search)
  const screen = q.get('demo')
  if (q.get('lang')) useGame.setState({ lang: q.get('lang') })
  if (!screen) return
  const dest = q.get('dest') || 'mars'
  const LITE = { solar: 0, rtg: 1, engine: 1, tank: 3, hga: 1, camera: 1, eclss: 1, supplies: 1, spares: 1 }
  const base = { destinationId: dest, commanderId: q.get('cmd') || 'valeria', selection: q.has('lite') ? LITE : SAMPLE[dest], launcherId: dest === 'europa' ? 'heavy' : 'superheavy', tests: ['vacuum', 'vibration'] }
  if (screen === 'launch') {
    useGame.setState({ ...base, screen })
    return
  }
  if (screen === 'mission' || screen === 'legacy') {
    const d = destinationById[dest]
    let m = startMission(d, base.selection, base.launcherId, base.tests, base.commanderId, 4242)
    const days = screen === 'legacy' ? m.totalDays : q.has('day0') ? 0 : 3
    for (let i = 0; i < days && !m.over; i++) m = nextDay(m, d, base.commanderId, 'science', null, { tasks: m.crew ? defaultTasks(m) : null })
    const tasks = m.crew ? defaultTasks(m) : null
    if (tasks && q.get('plan') === 'rest') Object.keys(tasks).forEach((k) => { tasks[k] = 'rest' })
    useGame.setState({ ...base, screen, mission: m, tasks, ration: false, event: q.get('event'), journalOpen: q.has('logbook'), live: q.has('live') ? q.get('event') : null, view: q.has('inside') ? 'crew' : 'ship', plan: q.get('plan') || 'science' })

    return
  }
  useGame.setState({ screen, destinationId: dest, commanderId: 'valeria', selection: q.has('empty') ? {} : SAMPLE[dest], launcherId: dest === 'europa' ? 'heavy' : 'superheavy', tests: ['vacuum', 'vibration'] })
}

// Dev only: ?coverat=0.4 freezes the logbook opening at that second to check how it looks
const coverAt = new URLSearchParams(location.search).get('coverat')
if (coverAt) {
  const st = document.createElement('style')
  st.textContent = `.logbook, .cover-face, .open-mask { animation-play-state: paused !important; animation-delay: -${coverAt}s !important; }`
  document.head.appendChild(st)
}

// Dev only: ?widthcheck lists elements wider than the screen (for phone layouts)
if (new URLSearchParams(location.search).has('widthcheck')) {
  setTimeout(() => {
    const w = document.documentElement.clientWidth
    console.log('WIDTH viewport', w, 'innerWidth', innerWidth)
    const seen = new Set()
    document.querySelectorAll('body *').forEach((e) => {
      const r = e.getBoundingClientRect()
      const key = `${e.tagName}.${e.className}`
      if (r.right > w + 2 && !seen.has(key) && seen.size < 15) { seen.add(key); console.log('WIDE', key, Math.round(r.left), Math.round(r.right)) }
    })
  }, 2500)
}

// Dev only: lets the recording bot read the game state (it still plays by clicking the real buttons)
if (import.meta.env.DEV) window.__game = useGame
