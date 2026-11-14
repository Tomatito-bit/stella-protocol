import { useGame } from '../store'
import { useT } from '../i18n'
import { DESTINATIONS } from '../data/destinations'

export default function Destination() {
  const { t, L } = useT()
  const choose = useGame((s) => s.chooseDestination)
  const go = useGame((s) => s.go)
  return (
    <section className="page">
      <button className="link" onClick={() => go('home')}>← {t('back')}</button>
      <h2>{t('chooseDestination')}</h2>
      <p className="hint">{t('destinationHint')}</p>
      <div className="cards">
        {DESTINATIONS.map((d) => {
          const sun = Math.round(100 / (d.distanceAU * d.distanceAU))
          const delay = d.delayMin < 1 ? '~1 s' : `~${d.delayMin} min`
          return (
            <button key={d.id} className="card destination" style={{ '--accent': d.color }} onClick={() => choose(d.id)}>
              <div className="planet" />
              <div className="card-top">
                <h3>{L(d.name)}</h3>
                <span className="tag">{d.crewed ? t('crewed') : t('robotic')}</span>
              </div>
              <p>{L(d.summary)}</p>
              <dl className="stats">
                <div><dt>{t('budget')}</dt><dd>${d.budget}M</dd></div>
                <div><dt>{t('days')}</dt><dd>{d.days}</dd></div>
                <div><dt>{t('sunlight')}</dt><dd>{sun}%</dd></div>
                <div><dt>{t('delay')}</dt><dd>{delay}</dd></div>
              </dl>
              <p className="small"><b>{t('realMission')}:</b> {d.realMission}</p>
              <p className="small risk"><b>{t('keyRisk')}:</b> {L(d.keyRisk)}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
