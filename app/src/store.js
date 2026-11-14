import { create } from 'zustand'
import { DEFAULT_LANG } from './config'
import { partById } from './data/parts'
import { destinationById } from './data/destinations'
import { startMission, rollEvent, nextDay, giveOrder } from './logic/mission'

export const SCREENS = ['home', 'destination', 'crew', 'design', 'review', 'mission', 'legacy']

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
  toggleTest: (id) => set((s) => ({ tests: s.tests.includes(id) ? s.tests.filter((t) => t !== id) : [...s.tests, id] })),

  // Mission
  launch: () => {
    const s = get()
    const dest = destinationById[s.destinationId]
    const mission = startMission(dest, s.selection, s.launcherId, s.tests, s.commanderId, Math.floor(Math.random() * 1e9))
    set({ mission, plan: 'science', event: null, screen: 'mission' })
  },
  setPlan: (plan) => set({ plan }),
  // Advancing a day may raise an event; the day resolves after the player answers
  advance: () => {
    const s = get()
    if (!s.mission || s.mission.over || s.event) return
    const dest = destinationById[s.destinationId]
    const ev = rollEvent(s.mission, dest, s.commanderId)
    if (ev) set({ event: ev })
    else get().resolve(null)
  },
  answer: (option, risk) => get().resolve({ event: get().event, option, risk }),
  resolve: (choice) => {
    const s = get()
    const dest = destinationById[s.destinationId]
    const mission = nextDay(s.mission, dest, s.commanderId, s.plan, choice)
    set({ mission, event: null, screen: mission.over ? 'legacy' : 'mission' })
  },
  order: (crewId, order) => set((s) => ({ mission: giveOrder(s.mission, crewId, order) })),

  restart: () => set({ screen: 'home', destinationId: null, commanderId: null, selection: {}, launcherId: null, tests: [], mission: null, event: null }),
}))
