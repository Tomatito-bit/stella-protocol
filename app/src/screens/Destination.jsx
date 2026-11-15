import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { useT } from '../i18n'
import { DESTINATIONS } from '../data/destinations'
import { Planet3D } from '../components/Planet3D'

// Game-style mission select: one big 3D world, its briefing on the left, and a selector below
export default function Destination() {
  const { t, L } = useT()
  const choose = useGame((s) => s.chooseDestination)
  const go = useGame((s) => s.go)
  const [i, setI] = useState(0)
  const d = DESTINATIONS[i]
  const move = (k) => setI((x) => (x + k + DESTINATIONS.length) % DESTINATIONS.length)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') move(1)
      if (e.key === 'ArrowLeft') move(-1)
      if (e.key === 'Enter') choose(DESTINATIONS[i].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const sun = Math.round(100 / (d.distanceAU * d.distanceAU))
  const delay = d.delayMin < 1 ? '~1 s' : `~${d.delayMin} min`

  return (
    <section className="select" style={{ '--accent': d.color }}>
      <div className="select-planet">
        <Planet3D id={d.id} stars speed={0.08} camera={3} />
      </div>

      <div className="select-info" key={`info-${d.id}`}>
        <button className="link" onClick={() => go('home')}>← {t('back')}</button>
        <p className="eyebrow">{t('missionOf', { n: i + 1, total: DESTINATIONS.length })} · {d.crewed ? t('crewed') : t('robotic')}</p>
        <h1>{L(d.name)}</h1>
        <p className="lead">{L(d.summary)}</p>
        <dl className="stats select-stats">
          <div><dt>{t('budget')}</dt><dd>${d.budget}M</dd></div>
          <div><dt>{t('days')}</dt><dd>{d.days}</dd></div>
          <div><dt>{t('sunlight')}</dt><dd>{sun}%</dd></div>
          <div><dt>{t('delay')}</dt><dd>{delay}</dd></div>
        </dl>
        <p className="small"><b>{t('realMission')}:</b> {L(d.realMission)}</p>
        <p className="small risk"><b>{t('keyRisk')}:</b> {L(d.keyRisk)}</p>
        <button className="btn big glow" onClick={() => choose(d.id)}>{t('chooseThis')} →</button>
      </div>

      <div className="select-bar">
        <button className="arrow" onClick={() => move(-1)} aria-label="previous">‹</button>
        {DESTINATIONS.map((x, k) => (
          <button key={x.id} className={`select-thumb ${k === i ? 'on' : ''}`} style={{ '--accent': x.color }} onClick={() => setI(k)}>
            <span className="thumb-dot" style={{ backgroundImage: `url(/textures/${x.id}.jpg)` }} />
            <span>{L(x.name)}</span>
          </button>
        ))}
        <button className="arrow" onClick={() => move(1)} aria-label="next">›</button>
      </div>
    </section>
  )
}
