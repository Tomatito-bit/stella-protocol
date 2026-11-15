import { useGame } from '../store'
import { useT } from '../i18n'
import { HomeScene } from '../components/HomeScene'

// Three-pane observation window of the Astraea (drawn in SVG over the 3D Earth)
const PANES = [
  '-40,170 450,170 335,600 -40,600',
  '535,170 1065,170 1180,600 420,600',
  '1150,170 1640,170 1640,600 1265,600',
]

function WindowFrame() {
  return (
    <svg className="home-frame" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1f29" />
          <stop offset="0.2" stopColor="#262d3a" />
          <stop offset="0.68" stopColor="#1c222d" />
          <stop offset="1" stopColor="#0c0f15" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141922" />
          <stop offset="1" stopColor="#07090d" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe6ff" stopOpacity="0.08" />
          <stop offset="0.45" stopColor="#bfe6ff" stopOpacity="0" />
          <stop offset="1" stopColor="#bfe6ff" stopOpacity="0.04" />
        </linearGradient>
        <mask id="panes">
          <rect width="1600" height="900" fill="white" />
          {PANES.map((p) => <polygon key={p} points={p} fill="black" stroke="black" strokeWidth="34" strokeLinejoin="round" />)}
        </mask>
      </defs>
      <rect width="1600" height="900" fill="url(#metal)" mask="url(#panes)" />
      {/* floor with perspective seams */}
      <path d="M0 700 L1600 700 L1600 900 L0 900 Z" fill="url(#floor)" />
      {[-700, -350, 0, 350, 700].map((x) => <line key={x} x1={800 + x * 0.35} y1="700" x2={800 + x * 1.6} y2="900" stroke="#2a3342" strokeWidth="1.5" />)}
      <line x1="0" y1="760" x2="1600" y2="760" stroke="#1f2733" />
      <line x1="0" y1="700" x2="1600" y2="700" stroke="#3b4757" strokeWidth="2" />
      {/* pane rims, glass sheen and status lights */}
      {PANES.map((p) => <polygon key={p} points={p} fill="url(#glass)" stroke="#3d4a5c" strokeWidth="5" strokeLinejoin="round" />)}
      <rect x="730" y="128" width="140" height="22" rx="11" fill="#11161e" stroke="#3d4a5c" strokeWidth="3" />
      <rect x="730" y="620" width="140" height="22" rx="11" fill="#11161e" stroke="#3d4a5c" strokeWidth="3" />
      <path d="M40 140 H690 M910 140 H1560" stroke="#3d4a5c" strokeWidth="3" fill="none" />
      <path d="M60 630 H690 M910 630 H1540" stroke="#2c3644" strokeWidth="3" fill="none" />
      {[90, 1510].map((x) => <circle key={x} className="home-led" cx={x} cy="140" r="6" />)}
      <circle className="home-led slow" cx="800" cy="139" r="4" />
      <circle className="home-led slow" cx="800" cy="631" r="4" />
    </svg>
  )
}

// Home screen: looking out of the Astraea's observation window at a living 3D Earth
export default function Home() {
  const { t } = useT()
  const go = useGame((s) => s.go)
  return (
    <section className="home home-deck">
      <div className="home-space"><HomeScene /></div>
      <WindowFrame />
      <div className="home-console">
        <p className="eyebrow">NASA Space Apps Challenge 2026 · Astraea</p>
        <h1>{t('title')}</h1>
        <p className="lead">{t('tagline')}</p>
        <div className="home-row">
          <button className="btn big glow" onClick={() => go('destination')}>{t('start')}</button>
        </div>
      </div>
    </section>
  )
}
