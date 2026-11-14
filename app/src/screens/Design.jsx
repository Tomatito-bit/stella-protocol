import { useGame } from '../store'
import { useT } from '../i18n'
import { CATEGORIES, PARTS, LAUNCHERS, TESTS } from '../data/parts'
import { destinationById } from '../data/destinations'
import { summarize, singlePointFailures } from '../logic/budget'

export default function Design() {
  const { t, L } = useT()
  const { selection, launcherId, tests, changePart, chooseLauncher, toggleTest, go } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const s = summarize(dest, selection, launcherId, tests)
  const spf = singlePointFailures(dest, selection)
  const parts = PARTS.filter((p) => dest.crewed || !p.crewedOnly)

  return (
    <section className="design">
      <div className="catalog">
        <button className="link" onClick={() => go('crew')}>← {t('back')}</button>
        <h2>{t('design')}</h2>
        <p className="hint">{t('designHint')}</p>
        {CATEGORIES.filter((c) => parts.some((p) => p.cat === c.id)).map((c) => (
          <div key={c.id} className="category">
            <h3>{L(c.name)}</h3>
            <div className="parts">
              {parts.filter((p) => p.cat === c.id).map((p) => {
                const n = selection[p.id] || 0
                const goal = dest.goals.includes(p.id)
                return (
                  <div key={p.id} className={`part ${n ? 'on' : ''}`}>
                    <div className="part-head">
                      <b>{L(p.name)}</b>
                      {goal && <span className="tag goal">★</span>}
                      {spf.includes(p.id) && <span className="tag warn">{t('singlePoint')}</span>}
                      {p.critical && n >= 2 && <span className="tag ok">{t('backup')}</span>}
                    </div>
                    <p className="small">{L(p.info)}</p>
                    <div className="part-foot">
                      <span className="small">${p.cost}M · {p.mass} kg · {p.power > 0 ? '+' : ''}{p.power} W</span>
                      <span className="counter">
                        <button onClick={() => changePart(p.id, -1)} disabled={!n}>−</button>
                        <b>{n}</b>
                        <button onClick={() => changePart(p.id, 1)} disabled={n >= p.max}>+</button>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <aside className="summary">
        <Meter label={t('cost')} value={s.cost} max={dest.budget} unit="$M" />
        <Meter label={t('mass')} value={s.mass} max={s.capacity || 1} unit="kg" disabled={!s.launcher} />
        <Meter label={t('power')} value={s.use} max={Math.max(1, s.generation)} unit="W" text={`${s.use} / ${s.generation} W`} />
        <dl className="stats three">
          <div><dt>{t('fuel')}</dt><dd>{s.tanks} / {s.tanksNeeded}</dd></div>
          {dest.crewed && <div><dt>{t('supplies')}</dt><dd>{s.supplyDays} / {dest.days} d</dd></div>}
          <div><dt>{t('shielding')}</dt><dd>{s.shield}</dd></div>
        </dl>

        <h3>{t('launcher')}</h3>
        <div className="choices">
          {LAUNCHERS.map((l) => (
            <button key={l.id} className={`choice ${launcherId === l.id ? 'on' : ''}`} onClick={() => chooseLauncher(l.id)}>
              <b>{L(l.name)}</b>
              <span className="small">{l.capacity.toLocaleString()} kg · ${l.cost}M</span>
            </button>
          ))}
        </div>

        <h3>{t('tests')}</h3>
        <p className="small">{t('testsHint')}</p>
        <div className="choices">
          {TESTS.map((x) => (
            <button key={x.id} className={`choice ${tests.includes(x.id) ? 'on' : ''}`} onClick={() => toggleTest(x.id)}>
              <b>{L(x.name)}</b>
              <span className="small">${x.cost}M · {L(x.info)}</span>
            </button>
          ))}
        </div>

        <button className="btn big full" onClick={() => go('review')}>{t('toReview')} →</button>
      </aside>
    </section>
  )
}

// Budget bar: green under 80%, amber up to 100%, red when over
function Meter({ label, value, max, unit, text, disabled }) {
  const ratio = value / max
  const state = disabled ? 'off' : ratio > 1 ? 'over' : ratio > 0.8 ? 'tight' : 'ok'
  return (
    <div className={`meter ${state}`}>
      <div className="meter-top">
        <span>{label}</span>
        <b>{text || `${value.toLocaleString()} / ${disabled ? '—' : max.toLocaleString()} ${unit}`}</b>
      </div>
      <div className="bar"><div style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
    </div>
  )
}
