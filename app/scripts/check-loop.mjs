// Plays the real store loop (launch → logbook decisions → next day) until the ending
import { useGame } from '../src/store.js'
import { EVENTS } from '../src/data/events.js'

const g = useGame
g.setState({ destinationId: 'mars', commanderId: 'kwame', selection: { solar: 4, battery: 2, engine: 2, tank: 4, hga: 1, lga: 1, camera: 1, spectrometer: 1, radar: 1, eclss: 2, shielding: 1, supplies: 3, medkit: 1, spares: 1 }, launcherId: 'superheavy', tests: ['vacuum'] })
g.getState().launch()
let days = 0
while (g.getState().screen === 'mission' && days < 40) {
  const s = g.getState()
  // A morning with an event is first shown live; otherwise the logbook opens straight away
  if (!s.journalOpen && !(s.event && s.live === s.event)) throw new Error('logbook should open (or the event play live) every morning')
  if (!s.journalOpen) s.openJournal()
  if (g.getState().live) throw new Error('opening the logbook should end the live alert')
  if (s.event) {
    const o = EVENTS[s.event].options[0]
    s.startDay() // must refuse until a choice is made
    if (g.getState().mission.day !== s.mission.day) throw new Error('day advanced without a decision')
    g.getState().pickOption(o.id, o.risk)
  }
  g.getState().startDay()
  days++
}
const end = g.getState()
console.log('screen:', end.screen, '| days played:', days, '| science:', Math.round(end.mission.science), '/', end.mission.goal, '| journal pages:', end.mission.journal.length)
