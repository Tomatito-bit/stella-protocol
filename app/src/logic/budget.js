import { BASE, CREW_BASE, LAUNCHERS, TESTS, partById } from '../data/parts'

// Propellant tanks needed to reach and brake at each destination (crewed ships are heavier)
const TANKS_NEEDED = { moon: 2, mars: 3, europa: 3 }

export const count = (sel, id) => sel[id] || 0
const sum = (sel, fn) => Object.entries(sel).reduce((t, [id, n]) => t + fn(partById[id]) * n, 0)

// Every number the design screen and the review board need
export function summarize(dest, sel, launcherId, tests) {
  const launcher = LAUNCHERS.find((l) => l.id === launcherId) || null
  const base = dest.crewed ? { cost: BASE.cost + CREW_BASE.cost, mass: BASE.mass + CREW_BASE.mass, power: BASE.power + CREW_BASE.power } : BASE
  const testCost = TESTS.filter((t) => tests.includes(t.id)).reduce((t, x) => t + x.cost, 0)

  const cost = base.cost + sum(sel, (p) => p.cost) + (launcher ? launcher.cost : 0) + testCost
  const mass = base.mass + sum(sel, (p) => p.mass)
  const sunlight = 1 / (dest.distanceAU * dest.distanceAU)
  const generation = sum(sel, (p) => (p.power > 0 ? (p.solar ? p.power * sunlight : p.power) : 0))
  const use = -base.power - sum(sel, (p) => (p.power < 0 ? p.power : 0))
  const tanksNeeded = TANKS_NEEDED[dest.id] + (dest.crewed ? 1 : 0)

  return {
    launcher,
    cost,
    budgetLeft: dest.budget - cost,
    mass,
    capacity: launcher ? launcher.capacity : 0,
    massMargin: launcher ? (launcher.capacity - mass) / launcher.capacity : -1,
    generation: Math.round(generation),
    use: Math.round(use),
    powerMargin: use > 0 ? (generation - use) / use : 0,
    sunlight,
    tanks: count(sel, 'tank'),
    tanksNeeded,
    link: sum(sel, (p) => p.link || 0),
    shield: sum(sel, (p) => p.shield || 0),
    supplyDays: 4 + count(sel, 'supplies') * 4, // the cabin carries 4 days; each module adds 4
    batteries: count(sel, 'battery'),
    science: sum(sel, (p) => p.science || 0),
    goalsCovered: dest.goals.filter((g) => count(sel, g) > 0).length,
  }
}

// Critical systems with no backup (the Webb lesson: 344 of them, each one inspected to the limit)
export function singlePointFailures(dest, sel) {
  const list = []
  if (count(sel, 'engine') === 1) list.push('engine')
  if (count(sel, 'hga') === 1 && count(sel, 'lga') === 0) list.push('hga')
  if (dest.crewed && count(sel, 'eclss') === 1) list.push('eclss')
  const powerUnits = count(sel, 'solar') + count(sel, 'solarxl') + count(sel, 'rtg')
  if (powerUnits === 1) list.push(count(sel, 'rtg') ? 'rtg' : 'solar')
  return list
}
