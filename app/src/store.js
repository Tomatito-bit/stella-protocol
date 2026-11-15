import { create } from 'zustand'
import { DEFAULT_LANG } from './config'
import { partById, RECOMMENDED } from './data/parts'
import { destinationById } from './data/destinations'
import { startMission, rollEvent, nextDay, giveOrder } from './logic/mission'
import { defaultTasks, carryTasks, BROKEN } from './logic/ship'
import { sfx } from './sound'

// Events you watch in orbit; the rest happen inside the ship
const ORBIT_EVENTS = ['solarStorm', 'radiationBelt', 'micrometeoroid', 'dustStorm', 'dustDevil', 'dust', 'plume', 'opportunity', 'shadowIce', 'delay', 'conjunction', 'earthset', 'gyro', 'transistor']
const viewFor = (event, crewed) => (!crewed || ORBIT_EVENTS.includes(event) ? 'ship' : 'crew')
const DANGER = ['solarStorm', 'radiationBelt', 'micrometeoroid', 'co2', 'medical', 'panic', 'dustStorm', 'catastrophe', 'deadlock', 'disobedience']

export const SCREENS = ['home', 'destination', 'crew', 'design', 'review', 'launch', 'mission', 'legacy']

export const useGame = create((set, get) => ({
  lang: DEFAULT_LANG,
  screen: 'home',
  destinationId: null,
  commanderId: null,
  selection: {},
  launcherId: null,
  tests: [],
  mission: null,
  plan: 'science',
  event: null,

  toggleLang: () => set((s) => ({ lang: s.lang === 'es' ? 'en' : 'es' })),
  go: (screen) => set({ screen }),
  chooseDestination: (destinationId) => set({ destinationId, selection: {}, launcherId: null, tests: [], screen: 'crew' }),
  chooseCommander: (commanderId) => set({ commanderId, screen: 'design' }),
  changePart: (id, delta) =>
    set((s) => {
      const n = Math.max(0, Math.min(partById[id].max, (s.selection[id] || 0) + delta))
      return { selection: { ...s.selection, [id]: n } }
    }),
  chooseLauncher: (launcherId) => set({ launcherId }),
  // One click: a proven spacecraft, rocket and all three environmental tests
  useRecommended: () => set((s) => ({ selection: { ...RECOMMENDED[s.destinationId].parts }, launcherId: RECOMMENDED[s.destinationId].launcher, tests: ['vacuum', 'vibration', 'deployment'] })),
  clearDesign: () => set({ selection: {}, launcherId: null, tests: [] }),
  toggleTest: (id) => set((s) => ({ tests: s.tests.includes(id) ? s.tests.filter((t) => t !== id) : [...s.tests, id] })),

  // Mission
  launch: () => {
    const s = get()
    const dest = destinationById[s.destinationId]
    const mission = startMission(dest, s.selection, s.launcherId, s.tests, s.commanderId, Math.floor(Math.random() * 1e9))
    // 60 Parsecs-style loop: each morning the logbook opens with today's problem already waiting
    const event = rollEvent(mission, dest, s.commanderId)
    set({ mission, plan: 'science', tasks: mission.crew ? defaultTasks(mission) : null, ration: false, event, live: event, view: event ? viewFor(event, !!mission.crew) : mission.crew ? 'crew' : 'ship', pick: null, orderPick: null, journalOpen: !event, screen: 'mission' })
  },
  journalOpen: false,
  live: null, // today's event, shown in the 3D scene before the logbook opens
  view: 'ship', // 'ship' (orbit) or 'crew' (inside)
  setView: (view) => set({ view }),
  pick: null, // { option, risk } chosen for today's event
  orderPick: null, // { crewId, order } chosen for today
  openJournal: () => { sfx.page(); set({ journalOpen: true, live: null }) },
  closeJournal: () => set({ journalOpen: false }),
  setPlan: (plan) => set({ plan }),
  tasks: null, // { crewId: 'science' | 'repair:antenna' | ... }
  ration: false,
  setTask: (crewId, task) => set((s) => ({ tasks: { ...s.tasks, [crewId]: task } })),
  suggestTasks: () => set((s) => ({ tasks: defaultTasks(s.mission) })),
  toggleRation: () => set((s) => ({ ration: !s.ration })),
  pickOption: (option, risk) => set({ pick: { option, risk } }),
  pickOrder: (crewId, order) => set((s) => ({ orderPick: s.orderPick && s.orderPick.crewId === crewId && s.orderPick.order === order ? null : { crewId, order } })),
  // Live the day with everything decided in the logbook, then open the next page
  startDay: () => {
    const s = get()
    if (!s.mission || s.mission.over || (s.event && !s.pick)) return
    const dest = destinationById[s.destinationId]
    let m = s.mission
    if (s.orderPick) m = giveOrder(m, s.orderPick.crewId, s.orderPick.order)
    const choice = s.event ? { event: s.event, option: s.pick.option, risk: s.pick.risk } : null
    m = nextDay(m, dest, s.commanderId, s.plan, choice, { tasks: m.crew ? s.tasks : null, ration: s.ration })
    if (m.over) return set({ mission: m, event: null, pick: null, orderPick: null, journalOpen: false, screen: 'legacy' })
    // Sound cues: morning chime, an alarm if something just broke, a fanfare when Earth's voice returns
    const newlyBroken = m.systems && Object.keys(m.systems).some((id) => m.systems[id] < BROKEN && s.mission.systems[id] >= BROKEN)
    const event = rollEvent(m, dest, s.commanderId)
    if (newlyBroken || DANGER.includes(event)) sfx.alarm()
    else if (m.voiceBack && !s.mission.voiceBack) sfx.good()
    else sfx.day()
    // With an event, you first watch it happen; the logbook opens a few seconds later
    // The logbook closes: dawn breaks and you watch the crew go to work (or the event unfold); you open the logbook yourself
    set({ mission: m, tasks: m.crew ? carryTasks(s.tasks, m) : null, event, live: event, view: event ? viewFor(event, !!m.crew) : m.crew ? 'crew' : 'ship', pick: null, orderPick: null, journalOpen: false })
  },

  restart: () => set({ screen: 'home', destinationId: null, commanderId: null, selection: {}, launcherId: null, tests: [], mission: null, event: null, pick: null, orderPick: null, journalOpen: false }),
}))
