import { create } from 'zustand'
import { DEFAULT_LANG } from './config'
import { partById, RECOMMENDED } from './data/parts'
import { destinationById } from './data/destinations'
import { startMission, rollEvent, nextDay, giveOrder } from './logic/mission'

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
    set({ mission, plan: 'science', event: rollEvent(mission, dest, s.commanderId), pick: null, orderPick: null, journalOpen: true, screen: 'mission' })
  },
  journalOpen: false,
  pick: null, // { option, risk } chosen for today's event
  orderPick: null, // { crewId, order } chosen for today
  openJournal: () => set({ journalOpen: true }),
  closeJournal: () => set({ journalOpen: false }),
  setPlan: (plan) => set({ plan }),
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
    m = nextDay(m, dest, s.commanderId, s.plan, choice)
    if (m.over) return set({ mission: m, event: null, pick: null, orderPick: null, journalOpen: false, screen: 'legacy' })
    set({ mission: m, event: rollEvent(m, dest, s.commanderId), pick: null, orderPick: null, journalOpen: true })
  },

  restart: () => set({ screen: 'home', destinationId: null, commanderId: null, selection: {}, launcherId: null, tests: [], mission: null, event: null, pick: null, orderPick: null, journalOpen: false }),
}))
