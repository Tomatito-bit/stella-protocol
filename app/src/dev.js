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
