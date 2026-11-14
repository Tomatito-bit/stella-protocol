// Quick sanity check of the budget and review logic (run: node scripts/check-review.mjs)
import { DESTINATIONS } from '../src/data/destinations.js'
import { summarize } from '../src/logic/budget.js'
import { reviewBoard } from '../src/logic/review.js'

const sample = {
  moon: { solar: 3, battery: 1, engine: 2, tank: 3, hga: 1, lga: 1, camera: 1, spectrometer: 1, drill: 1, eclss: 2, shielding: 1, supplies: 2, medkit: 1, spares: 1 },
  mars: { solar: 4, battery: 2, engine: 2, tank: 4, hga: 1, lga: 1, camera: 1, spectrometer: 1, radar: 1, eclss: 2, shielding: 1, supplies: 3, medkit: 1, spares: 1 },
  europa: { solarxl: 2, rtg: 1, battery: 1, engine: 1, tank: 3, hga: 1, lga: 1, camera: 1, radar: 1, magnetometer: 1, shielding: 3, spares: 1 },
}
const launcher = { moon: 'superheavy', mars: 'superheavy', europa: 'heavy' }
for (const d of DESTINATIONS) {
  const tests = ['vacuum', 'vibration', 'deployment']
  const s = summarize(d, sample[d.id], launcher[d.id], tests)
  const b = reviewBoard(d, sample[d.id], s, tests)
  console.log(d.id.padEnd(7), `cost ${s.cost}/${d.budget}`, `mass ${s.mass}/${s.capacity}`, `power ${s.generation}/${s.use}`, `NO-GO: ${b.consoles.filter((c) => !c.go).map((c) => c.id).join(',') || 'none'}`, `risks ${b.risks.length}`)
}
