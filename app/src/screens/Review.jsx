import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { summarize } from '../logic/budget'
import { reviewBoard } from '../logic/review'

export default function Review() {
  const { t, L } = useT()
  const { selection, launcherId, tests, go } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const s = summarize(dest, selection, launcherId, tests)
  const board = reviewBoard(dest, selection, s, tests)

  return (
    <section className="page">
      <button className="link" onClick={() => go('design')}>← {t('fix')}</button>
      <h2>{t('review')}</h2>
      <p className="hint">{t('reviewHint')}</p>
      <p className={`verdict ${board.noGo ? 'nogo' : 'go'}`}>{board.noGo ? t('someNoGo', { n: board.noGo }) : t('allGo')}</p>

      <div className="consoles">
        {board.consoles.map((c) => (
          <div key={c.id} className={`console ${c.go ? 'go' : 'nogo'}`}>
            <div className="console-head">
              <b>{L(c.name)}</b>
              <span className="vote">{c.go ? 'GO' : 'NO-GO'}</span>
            </div>
            <p>{L(c.reason)}</p>
            <p className="small fact">{L(c.fact)}</p>
          </div>
        ))}
      </div>

      <h3>{t('riskMatrix')}</h3>
      <div className="matrix-wrap">
        <Matrix risks={board.risks} />
        <ol className="risk-list">
          {board.risks.map((r, i) => (
            <li key={r.id} className={level(r.score)}><span className="dot">{i + 1}</span> {L(r.label)}</li>
          ))}
        </ol>
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={() => go('design')}>{t('fix')}</button>
        <button className={`btn big ${board.noGo ? 'danger' : ''}`} onClick={() => go('launch')}>{board.noGo ? t('launchAnyway') : t('launch')}</button>
      </div>
    </section>
  )
}

const level = (score) => (score >= 12 ? 'red' : score >= 6 ? 'amber' : 'green')

// 5×5 grid: risks are numbered dots placed by likelihood (up) and consequence (right)
function Matrix({ risks }) {
  const { t } = useT()
  const cells = []
  for (let l = 5; l >= 1; l--)
    for (let c = 1; c <= 5; c++) {
      const here = risks.map((r, i) => ({ ...r, n: i + 1 })).filter((r) => r.likelihood === l && r.consequence === c)
      cells.push(
        <div key={`${l}-${c}`} className={`cell ${level(l * c)}`}>
          {here.map((r) => <span key={r.id} className="dot">{r.n}</span>)}
        </div>,
      )
    }
  return (
    <div className="matrix">
      <span className="axis y">{t('likelihood')} →</span>
      <div className="grid">{cells}</div>
      <span className="axis x">{t('consequence')} →</span>
    </div>
  )
}
