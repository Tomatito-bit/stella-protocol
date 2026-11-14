// Development only: open a screen with a sample spacecraft, e.g. ?demo=design&dest=mars
import { useGame } from './store'
import { destinationById } from './data/destinations'
import { startMission, nextDay } from './logic/mission'

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
  const base = { destinationId: dest, commanderId: 'valeria', selection: SAMPLE[dest], launcherId: dest === 'europa' ? 'heavy' : 'superheavy', tests: ['vacuum', 'vibration'] }
  if (screen === 'mission' || screen === 'legacy') {
    const d = destinationById[dest]
    let m = startMission(d, base.selection, base.launcherId, base.tests, 'valeria', 4242)
    const days = screen === 'legacy' ? m.totalDays : 3
    for (let i = 0; i < days && !m.over; i++) m = nextDay(m, d, 'valeria', 'science', null)
    useGame.setState({ ...base, screen, mission: m, event: q.get('event'), journalOpen: q.has('logbook') })
    return
  }
  useGame.setState({ screen, destinationId: dest, commanderId: 'valeria', selection: q.has('empty') ? {} : SAMPLE[dest], launcherId: dest === 'europa' ? 'heavy' : 'superheavy', tests: ['vacuum', 'vibration'] })
}
