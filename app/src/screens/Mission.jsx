import { useState } from 'react'
import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { crewById } from '../data/crew'
import { EVENTS } from '../data/events'
import { biometrics } from '../logic/mission'
import { MissionScene } from '../components/MissionScene'
import { CrewInterior } from '../components/CrewInterior'

const PLANS = ['science', 'transmit', 'rest']
const ORDERS = ['rest', 'medical', 'exercise', 'talk']

export default function Mission() {
  const { t, L } = useT()
  const { mission: m, plan, event, journalOpen, openJournal } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const storm = event === 'solarStorm' || event === 'radiationBelt'
  const pct = Math.min(100, Math.round((m.science / m.goal) * 100))
  const [view, setView] = useState(() => (import.meta.env.DEV && new URLSearchParams(location.search).has('inside') ? 'crew' : 'ship'))
  const inside = !!m.crew && view === 'crew'

  return (
    <section className="mission">
      <div className="mission-view">
        {inside
          ? <CrewInterior crew={m.crew} plan={plan} event={event} destId={dest.id} />
          : <MissionScene destId={dest.id} sel={m.parts} crewed={dest.crewed} shield={m.shield} storm={storm} safe={plan === 'rest'} />}
        {m.crew && (
          <div className="view-toggle">
            <button className={!inside ? 'on' : ''} onClick={() => setView('ship')}>{t('viewShip')}</button>
            <button className={inside ? 'on' : ''} onClick={() => setView('crew')}>{t('viewCrew')}</button>
          </div>
        )}
        <div className="hud top">
          <div className="hud-box">
            <span className="hud-label">{L(dest.name)}</span>
            <b className="hud-big">{t('day')} {m.day} / {m.totalDays}</b>
          </div>
          <div className="hud-box grow">
            <span className="hud-label">{t('science')} {Math.round(m.science)} / {m.goal}</span>
            <div className="bar"><div style={{ width: `${pct}%` }} /></div>
          </div>
          <Stat label={t('dose')} value={`${m.dose.toFixed(1)} mSv`} />
          <Stat label={t('electronics')} value={`${Math.round(m.electronics)}%`} bad={m.electronics < 50} />
          <Stat label={t('fuel')} value={m.spareTanks} />
          <Stat label={t('sparesShort')} value={m.spares} />
          {m.crew && <Stat label={t('supplies')} value={`${m.supplies} d`} bad={m.supplies < 3} />}
          {dest.delayMin > 1 && <Stat label={t('delay')} value={`${dest.delayMin} min`} />}
        </div>
        {!journalOpen && (
          <button className="open-logbook" onClick={openJournal}>
            <b>{t('openLogbook')}</b>
            <span>{event ? t('pendingDecision') : t('readyForDay', { n: m.day + 1 })}</span>
          </button>
        )}
      </div>

      <aside className="mission-panel">
        {m.crew ? (
          <>
            <h3>{t('crewHud')}</h3>
            <div className="crew-list">
              {m.crew.map((c) => <CrewCard key={c.id} c={c} day={m.day} />)}
            </div>
          </>
        ) : (
          <>
            <h3>{t('probeStatus')}</h3>
            <p className="small">{t('probeStatusInfo')}</p>
          </>
        )}
        <button className="btn big full" onClick={openJournal}>{t('openLogbook')}</button>
      </aside>

      {journalOpen && <Logbook />}
    </section>
  )
}

function Stat({ label, value, bad }) {
  return (
    <div className="hud-box">
      <span className="hud-label">{label}</span>
      <b className={bad ? 'bad' : ''}>{value}</b>
    </div>
  )
}

function CrewCard({ c, day }) {
  const { t, L } = useT()
  const info = crewById[c.id]
  const bio = biometrics(c, day)
  return (
    <div className="crew-card" style={{ '--accent': info.color }}>
      <div className="crew-row">
        <span className="avatar sm">{info.name.split(' ').map((w) => w[0]).join('')}</span>
        <span className="crew-name"><b>{info.name.split(' ')[0]}{c.commander ? ' ★' : ''}</b><small>{L(info.role)}</small></span>
        <span className="bio">
          <span className={bio.heart > 95 ? 'bad' : ''}>♥ {bio.heart}</span>
          <span>{bio.pressure}</span>
        </span>
      </div>
      <div className="vitals">
        <Vital label={t('health')} v={c.health} />
        <Vital label={t('morale')} v={c.morale} />
        <Vital label={t('energy')} v={c.energy} />
        <Vital label={t('fluids')} v={bio.fluid} invert />
      </div>
    </div>
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

// How a crew member "reads" in the logbook, in words instead of numbers (60 Parsecs style)
function mood(c, t) {
  if (c.health < 40) return t('mood_sick')
  if (c.energy < 30) return t('mood_tired')
  if (c.morale < 35) return t('mood_down')
  if (c.health > 85 && c.energy > 70 && c.morale > 70) return t('mood_great')
  return t('mood_ok')
}

// The logbook: left page = what happened, right page = today's decisions
function Logbook() {
  const { t, L } = useT()
  const { mission: m, event, pick, orderPick, plan, setPlan, pickOption, pickOrder, startDay, closeJournal } = useGame()
  const destId = useGame((s) => s.destinationId)
  const [back, setBack] = useState(0) // pages back in history
  const page = m.journal[m.journal.length - 1 - back]
  const ev = event && EVENTS[event]
  const canAct = (o) => (o.needs === 'fuel' ? m.spareTanks > 0 : o.needs === 'spares' ? m.spares > 0 : o.needs === 'medkit' ? (m.parts.medkit || 0) > 0 : true) && (!o.crewedOnly || !!m.crew)
  const ready = !ev || !!pick

  return (
    <div className="modal-bg logbook-bg">
      <div className="logbook">
        <div className="rings" aria-hidden />
        {/* Left page: the report */}
        <div className="page left">
          <div className="coffee" aria-hidden />
          <figure className="polaroid">
            <div className="polaroid-img" style={{ backgroundImage: `url(/textures/${destId}.jpg)` }} />
            <figcaption>{t('day')} {m.day}</figcaption>
          </figure>
          <div className="page-head">
            <span className="tiny">{t('journal')}</span>
            <h2>{page.day === 0 ? t('arrival') : `${t('day')} ${page.day}`}</h2>
            {page.plan && <p className="hand muted">{t('todaysPlan')}: {t(`plan_${page.plan}`).toLowerCase()}</p>}
          </div>
          <ul className="hand entries">
            {page.entries.length ? page.entries.map((e, k) => <li key={k} className={e.type}>{L(e.text)}</li>) : <li>{t('quietDay')}</li>}
          </ul>
          {page.science > 0 && <p className="stamp">+{page.science} {t('science').toLowerCase()}</p>}
          {back === 0 && m.crew && (
            <div className="hand crew-lines">
              {m.crew.map((c) => <p key={c.id}><b>{crewById[c.id].name.split(' ')[0]}</b>: {mood(c, t)}</p>)}
            </div>
          )}
          {back === 0 && (
            <p className="hand muted resources">
              {m.crew ? `${t('supplies')}: ${m.supplies} d · ` : ''}{t('sparesShort')}: {m.spares} · {t('fuel')}: {m.spareTanks} · {t('electronics')}: {Math.round(m.electronics)}%
            </p>
          )}
          <div className="page-nav">
            <button onClick={() => setBack(back + 1)} disabled={back >= m.journal.length - 1}>← {t('before')}</button>
            {back > 0 && <button onClick={() => setBack(back - 1)}>{t('after')} →</button>}
          </div>
        </div>

        {/* Right page: today's decisions */}
        <div className="page right">
          <span className="tiny">{t('today')} · {t('day')} {m.day + 1}</span>
          {ev ? (
            <div className="today-event">
              <h3>{L(ev.title)}</h3>
              <p className="hand">{L(ev.text)}</p>
              <div className="hand-options">
                {ev.options.filter((o) => !o.crewedOnly || m.crew).map((o) => {
                  const ok = canAct(o)
                  const on = pick && pick.option === o.id
                  return (
                    <button key={o.id} className={`hand-option ${on ? 'on' : ''} risk-${o.risk}`} disabled={!ok} onClick={() => pickOption(o.id, o.risk)}>
                      <span className="box">{on ? '✓' : ''}</span>
                      <span>
                        <b>{L(o.label)}</b> <em className="risk-word">({t(`risk_${o.risk}`).toLowerCase()})</em>
                        <small>{ok ? L(o.detail) : t('cantDo')}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="fact-note"><span className="tape" aria-hidden />{L(ev.fact)}</p>
            </div>
          ) : (
            <p className="hand calm">{t('noEvent')}</p>
          )}

          <h4>{t('todaysPlan')}</h4>
          <div className="hand-row">
            {PLANS.map((p) => (
              <button key={p} className={`chip-hand ${plan === p ? 'on' : ''}`} onClick={() => setPlan(p)}>{t(`plan_${p}`)}</button>
            ))}
          </div>

          {m.crew && (
            <>
              <h4>{t('crewOrder')}</h4>
              <div className="order-grid">
                {m.crew.map((c) => (
                  <div key={c.id} className="order-line">
                    <b style={{ color: crewById[c.id].color }}>{crewById[c.id].name.split(' ')[0]}</b>
                    {ORDERS.map((o) => (
                      <button key={o} className={`chip-hand small ${orderPick && orderPick.crewId === c.id && orderPick.order === o ? 'on' : ''}`} onClick={() => pickOrder(c.id, o)}>{t(`order_${o}`)}</button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="logbook-actions">
            <button className="link dark" onClick={closeJournal}>{t('lookAround')}</button>
            <button className="btn" disabled={!ready} onClick={startDay}>{ready ? (m.day + 1 >= m.totalDays ? t('lastDay') : t('liveDay')) : t('chooseFirst')} →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
