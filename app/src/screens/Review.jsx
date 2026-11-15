import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { summarize } from '../logic/budget'
import { reviewBoard } from '../logic/review'
import { Ship3D } from '../components/Ship3D'
import { sfx } from '../sound'

// Real Mission Control call signs for each console
const CALL = { budget: 'BUDGET', fido: 'FIDO', power: 'EECOM', comms: 'INCO', science: 'SCIENCE', surgeon: 'SURGEON', radiation: 'SRAG' }
const POLL_MS = 650

// Flight Readiness Review as a control room: the Flight Director polls every console one by one
export default function Review() {
  const { t, L } = useT()
  const { selection, launcherId, tests, go } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const s = summarize(dest, selection, launcherId, tests)
  const board = reviewBoard(dest, selection, s, tests)
  const [polled, setPolled] = useState(0)
  const [open, setOpen] = useState(null)
  const [matrix, setMatrix] = useState(false)
  const total = board.consoles.length
  const done = polled >= total

  // Each console answers with a tone: high for GO, low buzz for NO-GO
  const votes = board.consoles.map((c) => (c.go ? 1 : 0)).join('')
  useEffect(() => {
    let n = 0
    const id = setInterval(() => {
      if (n >= votes.length) return clearInterval(id)
      if (votes[n] === '1') sfx.go()
      else sfx.nogo()
      n += 1
      setPolled(n)
    }, POLL_MS)
    return () => clearInterval(id)
  }, [votes])

  const gauges = [
    { k: t('rv_budget'), v: `$${dest.budget - s.budgetLeft}M / $${dest.budget}M`, f: (dest.budget - s.budgetLeft) / dest.budget },
    { k: t('rv_mass'), v: `${s.mass} / ${s.capacity || 0} kg`, f: s.capacity ? s.mass / s.capacity : 1.2 },
    { k: t('rv_power'), v: `${s.use} / ${s.generation} W`, f: s.generation ? s.use / s.generation : 1.2 },
  ]

  return (
    <section className="frr">
      <header className="frr-top">
        <button className="link" onClick={() => go('design')}>← {t('fix')}</button>
        <div>
          <p className="eyebrow">{t('rv_room')} · {L(dest.name)}</p>
          <h2>{t('review')}</h2>
        </div>
        <div className={`frr-banner ${!done ? 'polling' : board.noGo ? 'hold' : 'go'}`}>
          {!done ? t('rv_polling', { n: polled, total }) : board.noGo ? t('rv_hold', { n: board.noGo }) : t('rv_go')}
        </div>
      </header>

      <div className="frr-grid">
        <aside className="frr-pad">
          <div className="frr-ship"><Ship3D sel={selection} crewed={dest.crewed} shield={s.shield} /></div>
          <div className="frr-gauges">
            {gauges.map((g) => (
              <div key={g.k} className={`gauge ${g.f > 1 ? 'over' : g.f > 0.9 ? 'tight' : ''}`}>
                <span>{g.k}</span><b>{g.v}</b>
                <i style={{ '--f': `${Math.min(100, g.f * 100)}%` }} />
              </div>
            ))}
          </div>
        </aside>

        <div className="frr-poll">
          <p className="frr-fd">{t('rv_fd')}</p>
          {board.consoles.map((c, i) => {
            const state = i >= polled ? 'wait' : c.go ? 'go' : 'nogo'
            return (
              <button key={c.id} className={`frr-row ${state} ${open === c.id ? 'open' : ''}`} onClick={() => setOpen(open === c.id ? null : c.id)} disabled={state === 'wait'}>
                <span className="frr-light" />
                <span className="frr-call">{CALL[c.id] || c.id.toUpperCase()}</span>
                <span className="frr-name">{L(c.name)}</span>
                <span className="frr-vote">{state === 'wait' ? '· · ·' : c.go ? 'GO' : 'NO-GO'}</span>
                {state !== 'wait' && <span className="frr-reason">{L(c.reason)}</span>}
                {open === c.id && <span className="frr-fact">{L(c.fact)}</span>}
              </button>
            )
          })}
          <button className="link frr-matrix-toggle" onClick={() => setMatrix(!matrix)}>{matrix ? '▾' : '▸'} {t('riskMatrix')} ({board.risks.length})</button>
          {matrix && (
            <div className="matrix-wrap">
              <Matrix risks={board.risks} />
              <ol className="risk-list">
                {board.risks.map((r, i) => (
                  <li key={r.id} className={level(r.score)}><span className="dot">{i + 1}</span> {L(r.label)}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      <div className="frr-actions">
        <button className="btn ghost" onClick={() => go('design')}>{t('fix')}</button>
        <button className={`btn big ${done && !board.noGo ? 'glow' : ''} ${board.noGo ? 'danger' : ''}`} disabled={!done} onClick={() => go('launch')}>
          {board.noGo ? t('launchAnyway') : t('launch')}
        </button>
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
