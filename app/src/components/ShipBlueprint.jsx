import { useT } from '../i18n'

// Live blueprint: every part the player adds appears attached to the spacecraft.
// Missing critical systems are drawn as dashed red ghosts so the player sees what to build.
const n = (sel, id) => sel[id] || 0

export default function ShipBlueprint({ sel, crewed, shield }) {
  const { lang } = useT()
  const es = lang === 'es'
  const tanks = n(sel, 'tank')
  const engines = n(sel, 'engine')
  const solar = n(sel, 'solar')
  const solarxl = n(sel, 'solarxl')
  const rtg = n(sel, 'rtg')
  const instruments = ['camera', 'spectrometer', 'radar', 'magnetometer', 'drill'].filter((id) => n(sel, id))
  const missing = []
  if (!engines) missing.push(es ? 'Falta motor' : 'No engine')
  if (!n(sel, 'hga') && !n(sel, 'lga')) missing.push(es ? 'Falta antena' : 'No antenna')
  if (!solar && !solarxl && !rtg) missing.push(es ? 'Falta energía' : 'No power')
  if (crewed && !n(sel, 'eclss')) missing.push(es ? 'Falta soporte vital' : 'No life support')

  const cx = 200
  const busTop = crewed ? 92 : 70
  const busH = 70
  const tankW = 18
  const tanksW = Math.max(1, tanks) * (tankW + 4)

  return (
    <div className="blueprint">
      <svg viewBox="0 0 400 300" role="img" aria-label={es ? 'Plano de la nave' : 'Spacecraft blueprint'}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="rgba(120,170,255,0.12)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#grid)" />

        {/* Solar arrays: panels alternate left and right */}
        {Array.from({ length: solar }).map((_, i) => {
          const side = i % 2 ? 1 : -1
          const k = Math.floor(i / 2)
          const x = side < 0 ? cx - 40 - 46 * (k + 1) : cx + 40 + 46 * k
          return <g key={`s${i}`} className="appear"><line x1={side < 0 ? x + 44 : x} y1={busTop + 30} x2={side < 0 ? cx - 30 : cx + 30} y2={busTop + 30} stroke="#9fb3d9" strokeWidth="2" /><rect x={x} y={busTop + 14} width="44" height="32" rx="2" fill="#1d3f8f" stroke="#5ad1ff" /><path d={`M${x + 11} ${busTop + 14}v32M${x + 22} ${busTop + 14}v32M${x + 33} ${busTop + 14}v32M${x} ${busTop + 30}h44`} stroke="#5ad1ff" strokeWidth="0.6" /></g>
        })}
        {Array.from({ length: solarxl }).map((_, i) => {
          const side = i % 2 ? 1 : -1
          const x = side < 0 ? 8 : cx + 40
          return <g key={`x${i}`} className="appear"><rect x={x} y={busTop + 52} width={cx - 48} height="22" rx="2" fill="#1d3f8f" stroke="#8b5cf6" /><path d={`M${x} ${busTop + 63}h${cx - 48}`} stroke="#8b5cf6" strokeWidth="0.6" /></g>
        })}

        {/* Main bus with shielding outline (thicker = more shielding) */}
        <rect x={cx - 34} y={busTop} width="68" height={busH} rx="6" fill="#c9a24a" stroke={shield ? '#cbd5e1' : '#8a6f2e'} strokeWidth={2 + shield * 2.5} />
        <path d={`M${cx - 34} ${busTop + 23}h68M${cx - 34} ${busTop + 46}h68`} stroke="#8a6f2e" strokeWidth="1" />
        {Array.from({ length: n(sel, 'battery') }).map((_, i) => <rect key={`b${i}`} className="appear" x={cx - 28 + i * 12} y={busTop + 6} width="9" height="12" rx="1" fill="#4ade80" />)}
        {instruments.map((id, i) => <g key={id} className="appear"><rect x={cx - 30 + (i % 3) * 21} y={busTop + 27 + Math.floor(i / 3) * 21} width="17" height="17" rx="3" fill="#0b1124" stroke="#fbbf24" /><text x={cx - 21.5 + (i % 3) * 21} y={busTop + 39 + Math.floor(i / 3) * 21} fontSize="8" textAnchor="middle" fill="#fbbf24">{{ camera: 'C', spectrometer: 'E', radar: 'R', magnetometer: 'M', drill: 'T' }[id]}</text></g>)}

        {/* Crew cabin on top */}
        {crewed && <path className="appear" d={`M${cx - 30} ${busTop}L${cx - 14} ${busTop - 40}H${cx + 14}L${cx + 30} ${busTop}Z`} fill="#e2e8f0" stroke="#94a3b8" />}
        {crewed && <circle cx={cx} cy={busTop - 20} r="6" fill="#0b1124" stroke="#5ad1ff" />}

        {/* Life support and supplies on the sides */}
        {Array.from({ length: n(sel, 'eclss') }).map((_, i) => <rect key={`e${i}`} className="appear" x={i ? cx + 36 : cx - 52} y={busTop + 4} width="16" height="40" rx="4" fill="#64748b" stroke="#cbd5e1" />)}
        {Array.from({ length: n(sel, 'supplies') }).map((_, i) => <rect key={`f${i}`} className="appear" x={cx - 52 + i * 14} y={busTop + busH - 2} width="12" height="10" fill="#a16207" stroke="#facc15" strokeWidth="0.8" />)}
        {n(sel, 'medkit') > 0 && <g className="appear"><rect x={cx + 38} y={busTop + 48} width="14" height="14" rx="2" fill="#f8fafc" /><path d={`M${cx + 45} ${busTop + 51}v8M${cx + 41} ${busTop + 55}h8`} stroke="#ef4444" strokeWidth="2" /></g>}
        {n(sel, 'spares') > 0 && <rect className="appear" x={cx + 20} y={busTop + busH - 2} width="12" height="10" fill="#334155" stroke="#94a3b8" />}

        {/* Antennas */}
        {n(sel, 'hga') > 0 && <g className="appear"><line x1={cx + 20} y1={busTop} x2={cx + 46} y2={busTop - 26} stroke="#cbd5e1" strokeWidth="2" /><path d={`M${cx + 30} ${busTop - 44}Q${cx + 60} ${busTop - 30} ${cx + 64} ${busTop - 4}`} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" /></g>}
        {n(sel, 'hga') > 1 && <path className="appear" d={`M${cx - 30} ${busTop - 44}Q${cx - 60} ${busTop - 30} ${cx - 64} ${busTop - 4}`} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />}
        {n(sel, 'lga') > 0 && <g className="appear"><line x1={cx - 24} y1={busTop} x2={cx - 24} y2={busTop - 22} stroke="#cbd5e1" strokeWidth="2" /><circle cx={cx - 24} cy={busTop - 24} r="3" fill="#cbd5e1" /></g>}

        {/* Nuclear generators on booms */}
        {Array.from({ length: rtg }).map((_, i) => <g key={`r${i}`} className="appear"><line x1={cx - 30} y1={busTop + busH - 6} x2={cx - 70 - i * 14} y2={busTop + busH + 20 + i * 10} stroke="#9fb3d9" strokeWidth="2" /><rect x={cx - 82 - i * 14} y={busTop + busH + 14 + i * 10} width="12" height="22" rx="3" fill="#475569" stroke="#f97316" /></g>)}

        {/* Propellant tanks and engines below the bus */}
        {Array.from({ length: tanks }).map((_, i) => <rect key={`t${i}`} className="appear" x={cx - tanksW / 2 + i * (tankW + 4)} y={busTop + busH + 2} width={tankW} height="34" rx="9" fill="#e5e7eb" stroke="#94a3b8" />)}
        {Array.from({ length: engines }).map((_, i) => {
          const ex = cx + (engines === 1 ? 0 : i ? 16 : -16)
          const ey = busTop + busH + (tanks ? 38 : 2)
          return <path key={`g${i}`} className="appear" d={`M${ex - 6} ${ey}h12l8 24h-28z`} fill="#475569" stroke="#cbd5e1" />
        })}
        {!engines && <path d={`M${cx - 6} ${busTop + busH + (tanks ? 38 : 2)}h12l8 24h-28z`} fill="none" stroke="#f87171" strokeDasharray="4 3" />}
      </svg>
      {missing.length > 0 && <div className="missing">{missing.map((m) => <span key={m}>{m}</span>)}</div>}
    </div>
  )
}
