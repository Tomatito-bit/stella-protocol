// Launch timeline in seconds. The whole sequence lasts about 22 s and can be skipped.
export const T = {
  ignition: 3, // engines light at T-0
  liftoff: 4,
  maxQ: 6.5,
  boosters: 8.5, // side boosters drop (heavy rockets)
  meco: 11, // first stage separates
  fairing: 13, // nose cone opens: the player's spacecraft appears
  transfer: 15, // cruise toward the destination
  insertion: 20, // braking burn into orbit
  end: 22.5,
}

// Altitude (km) and speed (km/h) shown on the flight panel
export function telemetry(t) {
  if (t < T.liftoff) return { alt: 0, speed: 0 }
  const s = Math.min(t, T.fairing) - T.liftoff
  const alt = Math.round(s * s * 2.6 + s * 4)
  const speed = Math.round(s * s * 210 + s * 900)
  if (t < T.transfer) return { alt, speed }
  return { alt: null, speed: Math.round(39000 + (t - T.transfer) * 300) }
}

// Message for each phase (bilingual keys resolved in the screen)
export function phaseOf(t) {
  if (t < T.ignition) return 'count'
  if (t < T.liftoff) return 'ignition'
  if (t < T.maxQ) return 'liftoff'
  if (t < T.boosters) return 'maxq'
  if (t < T.meco) return 'boosters'
  if (t < T.fairing) return 'meco'
  if (t < T.transfer) return 'fairing'
  if (t < T.insertion) return 'transfer'
  return 'insertion'
}
