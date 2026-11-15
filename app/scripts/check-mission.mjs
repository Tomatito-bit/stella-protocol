// Plays many missions automatically to check balance and that nothing crashes
import { DESTINATIONS } from '../src/data/destinations.js'
import { EVENTS } from '../src/data/events.js'
import { startMission, rollEvent, nextDay, grade } from '../src/logic/mission.js'

const SAMPLE = {
  moon: { solar: 3, battery: 1, engine: 2, tank: 3, hga: 1, lga: 1, camera: 1, spectrometer: 1, drill: 1, eclss: 2, shielding: 1, supplies: 2, medkit: 1, spares: 1 },
  mars: { solar: 4, battery: 2, engine: 2, tank: 4, hga: 1, lga: 1, camera: 1, spectrometer: 1, radar: 1, eclss: 2, shielding: 1, supplies: 3, medkit: 1, spares: 1 },
  europa: { solarxl: 2, rtg: 1, battery: 1, engine: 1, tank: 3, hga: 1, lga: 1, camera: 1, radar: 1, magnetometer: 1, shielding: 3, spares: 1 },
}
const L = { moon: 'superheavy', mars: 'superheavy', europa: 'heavy' }
for (const d of DESTINATIONS) for (const cmd of ['valeria', 'diego', 'mei', 'kwame']) for (const policy of ['safe', 'risky']) {
  const res = { success: 0, partial: 0, fail: 0, lost: 0 }
  const seen = {}
  let pctSum = 0
  for (let i = 0; i < 200; i++) {
    let m = startMission(d, SAMPLE[d.id], L[d.id], ['vacuum', 'vibration'], cmd, i * 31 + 7)
    while (!m.over) {
      const ev = rollEvent(m, d, cmd)
      let choice = null
      if (ev) {
        seen[ev] = (seen[ev] || 0) + 1
        const opts = EVENTS[ev].options.filter((o) => !o.crewedOnly || d.crewed)
        const o = policy === 'safe' ? opts.find((x) => x.risk === 'safe') || opts[0] : opts.find((x) => x.risk === 'risky') || opts[0]
        choice = { event: ev, option: o.id, risk: o.risk }
      }
      const tired = m.crew && m.crew.some((c) => c.energy < 30)
      m = nextDay(m, d, cmd, tired ? 'rest' : m.day % 4 === 3 ? 'transmit' : 'science', choice)
    }
    const g = grade(m)
    res[g.level]++
    pctSum += g.pct
  }
  const social = ['routineClash','pilotEngineer','scienceVsSafety','enginesHot','fatigueIgnored','thirdQuarter','disobedience','deadlock','authority','panic', 'analystParanoia', 'riskReport', 'catastrophe'].map((k) => `${k}:${seen[k] || 0}`).join(' ')
  console.log(d.id.padEnd(7), cmd.padEnd(7), policy.padEnd(5), `avg ${Math.round(pctSum / 200)}%`, JSON.stringify(res), process.env.SOCIAL ? social : `events: ${Object.keys(seen).length}`)
}
