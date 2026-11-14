// Development only: open a screen with a sample spacecraft, e.g. ?demo=design&dest=mars
import { useGame } from './store'

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
  useGame.setState({ screen, destinationId: dest, commanderId: 'valeria', selection: q.has('empty') ? {} : SAMPLE[dest], launcherId: dest === 'europa' ? 'heavy' : 'superheavy', tests: ['vacuum', 'vibration'] })
}
