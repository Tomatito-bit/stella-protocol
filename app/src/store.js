import { create } from 'zustand'
import { DEFAULT_LANG } from './config'
import { partById } from './data/parts'

export const SCREENS = ['home', 'destination', 'crew', 'design', 'review', 'mission', 'legacy']

export const useGame = create((set) => ({
  lang: DEFAULT_LANG,
  screen: 'home',
  destinationId: null,
  commanderId: null,
  selection: {},
  launcherId: null,
  tests: [],

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
  restart: () => set({ screen: 'home', destinationId: null, commanderId: null, selection: {}, launcherId: null, tests: [] }),
}))
