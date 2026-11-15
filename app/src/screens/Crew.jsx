import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { useT } from '../i18n'
import { CREW, SHIP_NAME } from '../data/crew'
import { destinationById } from '../data/destinations'
import { AstronautShowcase } from '../components/AstronautShowcase'

// How each style rates (0-5) on what matters during the mission
const RATINGS = {
  cautious: { safety: 5, science: 3, speed: 2, morale: 3 },
  bold: { safety: 2, science: 4, speed: 5, morale: 3 },
  science: { safety: 3, science: 5, speed: 3, morale: 2 },
  diplomat: { safety: 3, science: 3, speed: 3, morale: 5 },
}

// Game-style character select: big 3D astronaut, profile on the left, roster below
export default function Crew() {
  const { t, L } = useT()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const choose = useGame((s) => s.chooseCommander)
  const go = useGame((s) => s.go)
  const [i, setI] = useState(() => Math.max(0, CREW.findIndex((x) => x.id === new URLSearchParams(location.search).get('cmd'))))
  const c = CREW[i]
  const move = (k) => setI((x) => (x + k + CREW.length) % CREW.length)
  const others = CREW.filter((x) => x.id !== c.id)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') move(1)
      if (e.key === 'ArrowLeft') move(-1)
      if (e.key === 'Enter') choose(CREW[i].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section className="select crew-select" style={{ '--accent': c.color }}>
      <div className="select-planet crew-figure" key={c.id}>
        <AstronautShowcase person={c} pose={c.style} />
      </div>

      <div className="select-info" key={`info-${c.id}`}>
        <button className="link" onClick={() => go('destination')}>← {t('back')}</button>
        <p className="eyebrow">{dest.crewed ? t('chooseCommander') : t('teamOnEarth')} · {SHIP_NAME} · {L(dest.name)}</p>
        <h1>{c.name}</h1>
        <p className="role-line"><span className="style-chip">{L(c.styleName)}</span> {L(c.role)}</p>
        <p className="lead quote-big">“{L(c.quote)}”</p>
        {c.bio && <p className="small crew-bio">{L(c.bio)}</p>}

        <div className="ratings">
          {Object.entries(RATINGS[c.style]).map(([k, v]) => (
            <div key={k} className="rating">
              <span>{t(`rate_${k}`)}</span>
              <span className="pips">{[1, 2, 3, 4, 5].map((p) => <i key={p} className={p <= v ? 'on' : ''} />)}</span>
            </div>
          ))}
        </div>

        <p className="small good">+ {L(c.perk)}</p>
        <p className="small bad">− {L(c.drawback)}</p>
        {dest.crewed && (
          <p className="small crew-aboard">
            {t('withYou')}: {others.map((o) => <b key={o.id} style={{ color: o.color }}>{o.name.split(' ')[0]} </b>)}
          </p>
        )}
        <button className="btn big glow" onClick={() => choose(c.id)}>{t('chooseCmd')} →</button>
      </div>

      <div className="select-bar">
        <button className="arrow" onClick={() => move(-1)} aria-label="previous">‹</button>
        {CREW.map((x, k) => (
          <button key={x.id} className={`select-thumb ${k === i ? 'on' : ''}`} style={{ '--accent': x.color }} onClick={() => setI(k)}>
            <span className="thumb-dot initials">{x.name.split(' ').map((w) => w[0]).join('')}</span>
            <span>{x.name.split(' ')[0]}</span>
          </button>
        ))}
        <button className="arrow" onClick={() => move(1)} aria-label="next">›</button>
      </div>
    </section>
  )
}
