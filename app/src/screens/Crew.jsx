import { useGame } from '../store'
import { useT } from '../i18n'
import { CREW } from '../data/crew'
import { destinationById } from '../data/destinations'

export default function Crew() {
  const { t, L } = useT()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const choose = useGame((s) => s.chooseCommander)
  const go = useGame((s) => s.go)
  return (
    <section className="page">
      <button className="link" onClick={() => go('destination')}>← {t('back')}</button>
      <h2>{dest.crewed ? t('chooseCommander') : t('teamOnEarth')}</h2>
      <p className="hint">{dest.crewed ? t('commanderHint') : t('teamOnEarthHint')}</p>
      <div className="cards four">
        {CREW.map((c) => (
          <button key={c.id} className="card person" style={{ '--accent': c.color }} onClick={() => choose(c.id)}>
            <div className="avatar">{c.name.split(' ').map((w) => w[0]).join('')}</div>
            <span className="style">{L(c.styleName)}</span>
            <h3>{c.name}</h3>
            <p className="small">{L(c.role)}</p>
            <p className="quote">“{L(c.quote)}”</p>
            <p className="small good">+ {L(c.perk)}</p>
            <p className="small bad">− {L(c.drawback)}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
