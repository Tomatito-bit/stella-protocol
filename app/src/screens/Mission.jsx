import { useState } from 'react'
import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { crewById } from '../data/crew'
import { EVENTS } from '../data/events'
import { biometrics } from '../logic/mission'
import { MissionScene } from '../components/MissionScene'

const PLANS = ['science', 'transmit', 'rest']
const ORDERS = ['rest', 'medical', 'exercise', 'talk']

export default function Mission() {
  const { t, L, lang } = useT()
  const { mission: m, plan, event, setPlan, advance, answer, order } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const [journalOpen, setJournalOpen] = useState(false)
  const [picked, setPicked] = useState(null)
  const ev = event && EVENTS[event]
  const storm = event === 'solarStorm' || event === 'radiationBelt'
  const pct = Math.min(100, Math.round((m.science / m.goal) * 100))
  const last = m.journal[m.journal.length - 1]
  const canAct = (o) => (o.needs === 'fuel' ? m.spareTanks > 0 : o.needs === 'spares' ? m.spares > 0 : o.needs === 'medkit' ? (m.parts.medkit || 0) > 0 : true) && (!o.crewedOnly || !!m.crew)

  return (
    <section className="mission">
      <div className="mission-view">
        <MissionScene destId={dest.id} sel={m.parts} crewed={dest.crewed} shield={m.shield} storm={storm} safe={plan === 'rest'} />
        <div className="hud top">
          <div className="hud-box">
            <span className="hud-label">{L(dest.name)}</span>
            <b className="hud-big">{t('day')} {m.day} / {m.totalDays}</b>
          </div>
          <div className="hud-box grow">
            <span className="hud-label">{t('science')} {Math.round(m.science)} / {m.goal}</span>
            <div className="bar"><div style={{ width: `${pct}%` }} /></div>
          </div>
          <div className="hud-box"><span className="hud-label">{t('dose')}</span><b>{m.dose.toFixed(1)} mSv</b></div>
          <div className="hud-box"><span className="hud-label">{t('electronics')}</span><b className={m.electronics < 50 ? 'bad' : ''}>{Math.round(m.electronics)}%</b></div>
          <div className="hud-box"><span className="hud-label">{t('fuel')}</span><b>{m.spareTanks}</b></div>
          <div className="hud-box"><span className="hud-label">{t('sparesShort')}</span><b>{m.spares}</b></div>
          {m.crew && <div className="hud-box"><span className="hud-label">{t('supplies')}</span><b className={m.supplies < 3 ? 'bad' : ''}>{m.supplies} d</b></div>}
          {dest.delayMin > 1 && <div className="hud-box"><span className="hud-label">{t('delay')}</span><b>{dest.delayMin} min</b></div>}
        </div>
        <button className="journal-note" onClick={() => setJournalOpen(true)}>
          <span className="small">{t('journal')} · {t('day')} {last.day}</span>
          <span>{L(last.entries[0]?.text) || (lang === 'es' ? 'Día tranquilo.' : 'A quiet day.')}</span>
        </button>
      </div>

      <aside className="mission-panel">
        <h3>{t('todaysPlan')}</h3>
        <div className="plans">
          {PLANS.map((p) => (
            <button key={p} className={`choice ${plan === p ? 'on' : ''}`} onClick={() => setPlan(p)}>
              <b>{t(`plan_${p}`)}</b>
              <span className="small">{t(`plan_${p}_info`)}</span>
            </button>
          ))}
        </div>

        {m.crew && (
          <>
            <h3>{t('crewHud')}</h3>
            <p className="small">{m.orderDay === m.day ? t('orderGiven') : t('orderHint')}</p>
            <div className="crew-list">
              {m.crew.map((c) => {
                const info = crewById[c.id]
                const bio = biometrics(c, m.day)
                const open = picked === c.id
                return (
                  <div key={c.id} className={`crew-card ${open ? 'open' : ''}`} style={{ '--accent': info.color }}>
                    <button className="crew-row" onClick={() => setPicked(open ? null : c.id)}>
                      <span className="avatar sm">{info.name.split(' ').map((w) => w[0]).join('')}</span>
                      <span className="crew-name"><b>{info.name.split(' ')[0]}{c.commander ? ' ★' : ''}</b><small>{L(info.role)}</small></span>
                      <span className="bio">
                        <span className={bio.heart > 95 ? 'bad' : ''}>♥ {bio.heart}</span>
                        <span>{bio.pressure}</span>
                      </span>
                    </button>
                    <div className="vitals">
                      <Vital label={t('health')} v={c.health} />
                      <Vital label={t('morale')} v={c.morale} />
                      <Vital label={t('energy')} v={c.energy} />
                      <Vital label={t('fluids')} v={bio.fluid} invert />
                    </div>
                    {open && (
                      <div className="orders">
                        {ORDERS.map((o) => (
                          <button key={o} className="choice mini" disabled={m.orderDay === m.day} onClick={() => order(c.id, o)}>{t(`order_${o}`)}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <button className="btn big full" onClick={advance}>{m.day + 1 >= m.totalDays ? t('lastDay') : t('nextDay')} →</button>
      </aside>

      {ev && (
        <div className="modal-bg">
          <div className="modal event">
            <span className="eyebrow">{L(ev.hazard)} · {t('day')} {m.day + 1}</span>
            <h2>{L(ev.title)}</h2>
            <p>{L(ev.text)}</p>
            <div className="options">
              {ev.options.filter((o) => !o.crewedOnly || m.crew).map((o) => (
                <button key={o.id} className={`option risk-${o.risk}`} disabled={!canAct(o)} onClick={() => answer(o.id, o.risk)}>
                  <span className="option-top"><b>{L(o.label)}</b><span className="risk-tag">{t(`risk_${o.risk}`)}</span></span>
                  <span className="small">{canAct(o) ? L(o.detail) : t('cantDo')}</span>
                </button>
              ))}
            </div>
            <p className="small fact">{L(ev.fact)}</p>
          </div>
        </div>
      )}

      {journalOpen && <Journal journal={m.journal} onClose={() => setJournalOpen(false)} />}
    </section>
  )
}

function Vital({ label, v, invert }) {
  const level = invert ? (v > 70 ? 'bad' : v > 45 ? 'mid' : '') : v < 35 ? 'bad' : v < 60 ? 'mid' : ''
  return (
    <div className={`vital ${level}`}>
      <span>{label} <b>{Math.round(v)}</b></span>
      <div className="bar"><div style={{ width: `${v}%` }} /></div>
    </div>
  )
}

// Paper logbook: one page per day
function Journal({ journal, onClose }) {
  const { t, L } = useT()
  const [i, setI] = useState(journal.length - 1)
  const p = journal[i]
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="notebook" onClick={(e) => e.stopPropagation()}>
        <h3>{p.day === 0 ? t('arrival') : `${t('day')} ${p.day}`}</h3>
        {p.plan && <p className="plan-line">{t('todaysPlan')}: {t(`plan_${p.plan}`).toLowerCase()}</p>}
        <ul>{p.entries.map((e, k) => <li key={k} className={e.type}>{L(e.text)}</li>)}</ul>
        {!p.entries.length && <p>{t('quietDay')}</p>}
        {p.science > 0 && <p className="stamp">+{p.science} {t('science').toLowerCase()}</p>}
        <div className="notebook-foot">
          <button onClick={() => setI(i - 1)} disabled={i === 0}>← {t('before')}</button>
          <span>{i + 1} / {journal.length}</span>
          {i < journal.length - 1 ? <button onClick={() => setI(i + 1)}>{t('after')} →</button> : <button onClick={onClose}>{t('close')}</button>}
        </div>
      </div>
    </div>
  )
}
