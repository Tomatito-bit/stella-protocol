// Hand-drawn supply doodles for the logbook (inline SVG, ink on paper)
const INK = '#23264a'
const ink = { fill: 'none', stroke: INK, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

// A ration pack per day of food
export function FoodPack({ i }) {
  return (
    <svg viewBox="0 0 30 38" className="doodle food" style={{ transform: `rotate(${((i * 37) % 9) - 4}deg)` }} aria-hidden>
      <path d="M5 6 Q15 2 25 6 L24 34 Q15 37 6 34 Z" {...ink} fill="#f3d9a4" />
      <path d="M8 13 H22 M8 18 H19" {...ink} strokeWidth="1.5" />
      <circle cx="15" cy="26" r="3.5" fill="#d64f5c" stroke={INK} strokeWidth="1.5" />
    </svg>
  )
}

// A level gauge drawn as a bottle (water), a tank (oxygen) or a battery (power)
export function LevelDoodle({ kind, level }) {
  const v = Math.max(0, Math.min(100, level))
  const color = v < 25 ? '#d64f5c' : kind === 'water' ? '#5aa9e6' : kind === 'o2' ? '#8fd3c7' : '#f2c14e'
  const top = (h, y0) => y0 + h * (1 - v / 100)
  if (kind === 'water') return (
    <svg viewBox="0 0 40 70" className="doodle level" aria-hidden>
      <clipPath id="bottle"><path d="M15 4 H25 V14 Q34 20 34 30 V62 Q34 66 30 66 H10 Q6 66 6 62 V30 Q6 20 15 14 Z" /></clipPath>
      <rect x="0" y={top(52, 14)} width="40" height="70" fill={color} clipPath="url(#bottle)" opacity="0.85" />
      <path d="M15 4 H25 V14 Q34 20 34 30 V62 Q34 66 30 66 H10 Q6 66 6 62 V30 Q6 20 15 14 Z" {...ink} />
      <path d="M13 2 H27" {...ink} strokeWidth="3" />
    </svg>
  )
  if (kind === 'o2') return (
    <svg viewBox="0 0 40 70" className="doodle level" aria-hidden>
      <clipPath id="tank"><rect x="7" y="12" width="26" height="54" rx="12" /></clipPath>
      <rect x="0" y={top(54, 12)} width="40" height="70" fill={color} clipPath="url(#tank)" opacity="0.85" />
      <rect x="7" y="12" width="26" height="54" rx="12" {...ink} />
      <path d="M16 12 V6 H24 V12 M20 6 V2 M14 2 H26" {...ink} />
      <text x="20" y="44" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="14" fill={INK}>O₂</text>
    </svg>
  )
  return (
    <svg viewBox="0 0 40 70" className="doodle level" aria-hidden>
      <clipPath id="batt"><rect x="8" y="10" width="24" height="56" rx="3" /></clipPath>
      <rect x="0" y={top(56, 10)} width="40" height="70" fill={color} clipPath="url(#batt)" opacity="0.85" />
      <rect x="8" y="10" width="24" height="56" rx="3" {...ink} />
      <path d="M15 10 V5 H25 V10 M22 30 L16 40 H24 L18 50" {...ink} />
    </svg>
  )
}

// One spare-part crate
export function SpareCrate({ i }) {
  return (
    <svg viewBox="0 0 36 32" className="doodle crate" style={{ transform: `rotate(${((i * 53) % 7) - 3}deg)` }} aria-hidden>
      <rect x="3" y="6" width="30" height="23" {...ink} fill="#c9a26b" />
      <path d="M3 13 H33 M10 6 V29 M26 6 V29" {...ink} strokeWidth="1.4" />
      <circle cx="18" cy="20" r="4" fill="#e6e6e6" stroke={INK} strokeWidth="1.5" />
      <path d="M18 14 V16 M18 24 V26 M12 20 H14 M22 20 H24" {...ink} strokeWidth="1.5" />
    </svg>
  )
}

// One spare propellant tank
export function FuelTank({ i }) {
  return (
    <svg viewBox="0 0 30 44" className="doodle fuel" style={{ transform: `rotate(${((i * 29) % 7) - 3}deg)` }} aria-hidden>
      <rect x="5" y="6" width="20" height="34" rx="10" {...ink} fill="#e9ecf2" />
      <path d="M5 20 H25 M5 26 H25" stroke="#d64f5c" strokeWidth="2" />
      <path d="M12 6 V2 H18 V6" {...ink} />
    </svg>
  )
}

// Crossed-out empty slot ("nothing left")
export function Empty() {
  return (
    <svg viewBox="0 0 30 30" className="doodle empty" aria-hidden>
      <rect x="4" y="4" width="22" height="22" {...ink} strokeDasharray="3 3" />
      <path d="M6 6 L24 24 M24 6 L6 24" stroke="#d64f5c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
