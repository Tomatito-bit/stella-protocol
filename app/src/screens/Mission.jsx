import { useEffect, useState } from 'react'
import { startHum, stopHum, sfx } from '../sound'
import { TUTORIAL } from '../data/tutorial'
import { quoteOfDay } from '../data/quotes'
import { EventDoodle } from '../components/Doodles'
import { FoodPack, LevelDoodle, SpareCrate, FuelTank, Empty } from '../components/Doodles'
import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { crewById } from '../data/crew'
import { EVENTS } from '../data/events'
import { biometrics } from '../logic/mission'
import { MissionScene } from '../components/MissionScene'
import { CrewInterior } from '../components/CrewInterior'
import { TASKS, SYSTEMS, BROKEN, taskKind, powerLevel } from '../logic/ship'

const PLANS = ['science', 'transmit', 'rest']
const ORDERS = ['rest', 'medical', 'exercise', 'talk']

export default function Mission() {
  const { t, L } = useT()
  const { mission: m, plan, event, journalOpen, openJournal, tasks, live, view: storeView, setView } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const storm = event === 'solarStorm' || event === 'radiationBelt'
  const pct = Math.min(100, Math.round((m.science / m.goal) * 100))
  const view = storeView
  const inside = !!m.crew && view === 'crew'
  // Life-support fans hum in the background during the mission
  useEffect(() => { startHum(); return stopHum }, [])

  return (
    <section className="mission">
      <div className="mission-view">
        {inside
          ? <CrewInterior crew={m.crew} plan={plan} event={event} destId={dest.id} sel={m.parts} shield={m.shield} tasks={tasks} systems={m.systems} />
          : <MissionScene destId={dest.id} sel={m.parts} crewed={dest.crewed} shield={m.shield} storm={storm} safe={plan === 'rest'} event={event} />}
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
          {m.systems ? (
            <>
              <Meter label="O₂" v={m.o2} />
              <Meter label={t('water')} v={m.water} />
              <Stat label={t('supplies')} value={`${Math.floor(m.supplies)} d`} bad={m.supplies < 3} />
              <Meter label={t('powerHud')} v={powerLevel(m, dest) * 100} />
              <Stat label={t('sparesShort')} value={m.spares} bad={m.spares === 0} />
              <Stat label={t('dose')} value={`${m.dose.toFixed(1)} mSv`} />
            </>
          ) : (
            <>
              <Stat label={t('dose')} value={`${m.dose.toFixed(1)} mSv`} />
              <Stat label={t('electronics')} value={`${Math.round(m.electronics)}%`} bad={m.electronics < 50} />
              <Stat label={t('fuel')} value={m.spareTanks} />
              <Stat label={t('sparesShort')} value={m.spares} />
            </>
          )}
          {dest.delayMin > 1 && <Stat label={t('delay')} value={`${dest.delayMin} min`} />}
        </div>
        {m.day > 0 && !m.over && (
          <div className="day-flash" key={m.day} aria-hidden>
            <small>{t('dawn')}</small>
            <b>{t('day')} {m.day + 1}</b>
          </div>
        )}
        {live && !journalOpen && <LiveAlert event={live} onOpen={openJournal} />}
        {!journalOpen && (
          <ClosedLogbook day={m.day + 1} pending={!!event} onOpen={openJournal} />
        )}
      </div>

      <aside className="mission-panel">
        {m.crew ? (
          <>
            <SystemsPanel />
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

      {journalOpen && <Logbook key={m.day} />}
      {m.systems && m.day === 0 && <Tutorial />}
    </section>
  )
}

// Resource gauge that turns amber and then red as it runs low
function Meter({ label, v }) {
  const level = v < 25 ? 'bad' : v < 50 ? 'mid' : ''
  return (
    <div className={`hud-box meter ${level}`}>
      <span className="hud-label">{label}</span>
      <b>{Math.round(v)}%</b>
      <div className="bar"><div style={{ width: `${Math.max(0, Math.min(100, v))}%` }} /></div>
    </div>
  )
}

// Ship systems: wear down every day, break suddenly, and get fixed by sending someone to repair
function SystemsPanel() {
  const { t, L } = useT()
  const { mission: m, setTask } = useGame()
  const engineer = m.crew.find((c) => c.duty === 'engineer') || m.crew[0]
  return (
    <div className="systems">
      <h3>{t('systemsHud')}</h3>
      {Object.entries(m.systems).map(([id, v]) => (
        <div key={id} className={`system-row ${v < BROKEN ? 'broken' : v < 60 ? 'worn' : ''}`}>
          <span className="system-name">{L(SYSTEMS[id].name)}</span>
          <div className="bar"><div style={{ width: `${v}%` }} /></div>
          <b>{v < BROKEN ? t('brokenShort') : `${Math.round(v)}%`}</b>
          {v < 85 && <button className="sys-fix" onClick={() => setTask(engineer.id, `repair:${id}`)} title={t('sendEngineer')}>{t('fixShort')}</button>}
        </div>
      ))}
      {!m.voiceBack && <p className="small story-goal">{t('goalAntenna')}</p>}
    </div>
  )
}

// The job a crew member does today, picked from a list (repairs name the system and its state)
function TaskSelect({ c }) {
  const { L } = useT()
  const { mission: m, tasks, setTask } = useGame()
  const value = (tasks && tasks[c.id]) || 'rest'
  return (
    <select className={`task-select task-${taskKind(value)}`} value={value} onChange={(e) => setTask(c.id, e.target.value)} onClick={(e) => e.stopPropagation()}>
      {['science', 'comms', 'medbay', 'exercise', 'recycle', 'eva', 'rest'].map((k) => <option key={k} value={k}>{L(TASKS[k].name)}</option>)}
      {Object.entries(m.systems).map(([id, v]) => <option key={id} value={`repair:${id}`}>{L(TASKS.repair.name)}: {L(SYSTEMS[id].name)} ({Math.round(v)}%)</option>)}
    </select>
  )
}

// Breaking news on board: the event plays out in 3D, then the logbook opens so you can decide
function LiveAlert({ event, onOpen }) {
  const { t, L } = useT()
  const ev = EVENTS[event]
  useEffect(() => {
    const id = setTimeout(onOpen, 6000)
    return () => clearTimeout(id)
  }, [event, onOpen])
  if (!ev) return null
  return (
    <div className={`live-alert ${ev.tier ? 'social' : ''}`} key={event}>
      <span className="live-dot" /> <span className="live-tag">{t('liveNow')}</span>
      <h3>{L(ev.title)}</h3>
      <p>{L(ev.text)}</p>
      <button className="btn glow" onClick={onOpen}>{t('decideNow')} →</button>
      <i className="live-timer" />
    </div>
  )
}

// Shown once, on the first crewed mission
function Tutorial() {
  const { t, L } = useT()
  const [step, setStep] = useState(() => { try { return localStorage.getItem('stella-tutorial') === 'done' ? -1 : 0 } catch { return 0 } })
  if (step < 0) return null
  const finish = () => { try { localStorage.setItem('stella-tutorial', 'done') } catch { /* private mode */ } setStep(-1) }
  const card = TUTORIAL[step]
  return (
    <div className="tutorial-bg">
      <div className="tutorial">
        <p className="eyebrow">{t('tutorial')} · {step + 1} / {TUTORIAL.length}</p>
        <h3>{L(card.title)}</h3>
        <p>{L(card.text)}</p>
        <div className="tutorial-dots">{TUTORIAL.map((_, i) => <i key={i} className={i === step ? 'on' : ''} />)}</div>
        <div className="tutorial-actions">
          <button className="link" onClick={finish}>{t('skipTutorial')}</button>
          <button className="btn glow" onClick={() => (step + 1 < TUTORIAL.length ? setStep(step + 1) : finish())}>{step + 1 < TUTORIAL.length ? t('next') : t('gotIt')} →</button>
        </div>
      </div>
    </div>
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
      {useGame.getState().mission?.systems && <div className="crew-task"><span>{t('taskToday')}</span><TaskSelect c={c} /></div>}
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

// The logbook: left page = what happened, right page = today's decisions
// The commander's colour dresses the logbook cover
function useCover() {
  const cmd = crewById[useGame((s) => s.commanderId)]
  return { color: cmd ? cmd.color : '#5ad1ff', name: cmd ? cmd.name : '' }
}

// Closed logbook resting in the corner: leather cover in the commander's colour, elastic band and a label
function ClosedLogbook({ day, pending, onOpen }) {
  const { t } = useT()
  const cover = useCover()
  const destId = useGame((s) => s.destinationId)
  return (
    <button className={`closed-logbook ${pending ? 'pending' : ''}`} style={{ '--cover': cover.color }} onClick={onOpen} title={t('openLogbook')}>
      <span className="cover-spine" aria-hidden />
      <span className="cover-band" aria-hidden />
      <span className="cover-label">
        <small>{t('journal')}</small>
        <b>{t('day')} {day}</b>
        <em>{cover.name}</em>
      </span>
      <span className="cover-patch" style={{ backgroundImage: `url(/textures/${destId}.jpg)` }} aria-hidden />
      {pending && <span className="cover-flag">!</span>}
      <span className="cover-hint">{pending ? t('pendingDecision') : t('readyForDay', { n: day })}</span>
    </button>
  )
}

// The logbook: several pages per day, like the 60 Seconds journal.
// Crewed: report + crew → supplies + today's problem → jobs + the day's plan. Robotic: report + probe → problem + plan.
function Logbook() {
  const { t } = useT()
  const { mission: m, closeJournal } = useGame()
  const cover = useCover()
  const [spread, setSpread] = useState(() => (import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('lpage')) || 0 : 0))
  const spreads = m.systems
    ? [['report', 'crew'], ['supplies', 'event'], ['tasks', 'plan']]
    : m.crew ? [['report', 'crew'], ['event', 'plan']] : [['report', 'supplies'], ['event', 'plan']]
  // A real page turn: the sheet swings over the spiral showing the old page on its front and the new one on its back
  const [flip, setFlip] = useState(null) // { to, dir }
  // Dev only: ?flipat=0.35 freezes a forward turn mid-way to check how it looks
  const freeze = import.meta.env.DEV ? new URLSearchParams(location.search).get('flipat') : null
  const [frozen] = useState(() => (freeze ? { to: 1, dir: 1 } : null))
  const active = flip || frozen
  const turn = (k) => {
    if (flip || k === 0) return
    sfx.page()
    setFlip({ to: spread + k, dir: k > 0 ? 1 : -1 })
  }
  const done = () => { setSpread(flip.to); setFlip(null) }
  const [cl, cr] = spreads[spread]
  const [nl, nr] = active ? spreads[active.to] : [cl, cr]
  // Underneath the moving sheet the destination page is already in place
  const left = active && active.dir < 0 ? nl : cl
  const right = active && active.dir > 0 ? nr : cr
  const nav = (side, kind, idx) => (
    side === 'left'
      ? <div className="page-turn">{idx > 0 ? <button onClick={() => turn(-1)}>← {t('prevPage')}</button> : <button onClick={closeJournal}>{t('lookAround')}</button>}</div>
      : <div className="page-turn right">{idx < spreads.length - 1 && <button onClick={() => turn(1)}>{t('nextPage')} →</button>}</div>
  )
  const leftIdx = active && active.dir < 0 ? active.to : spread
  const rightIdx = active && active.dir > 0 ? active.to : spread
  return (
    <div className="modal-bg logbook-bg">
      <div className="logbook" style={{ '--cover': cover.color }}>
        {/* Opening: the cover swings open over the spiral while the left page is revealed */}
        <div className="open-mask" aria-hidden />
        <div className="cover-opening" aria-hidden>
          <div className="cover-face front"><span>{t('journal')}</span><b>{t('day')} {m.day + 1}</b></div>
          <div className="cover-face back" />
        </div>
        <div className="rings" aria-hidden />
        <div className="page left" key={`l-${left}`}>
          <LogPage kind={left} />
          {nav('left', left, leftIdx)}
        </div>
        <div className="page right" key={`r-${right}`}>
          <LogPage kind={right} />
          {nav('right', right, rightIdx)}
        </div>
        {active && (
          <div className={`flip-sheet ${active.dir > 0 ? 'fwd' : 'back'}`} onAnimationEnd={flip ? done : undefined} style={frozen ? { animationDelay: `-${freeze}s`, animationPlayState: 'paused' } : undefined} aria-hidden>
            <div className={`page flip-face front ${active.dir > 0 ? 'right' : 'left'}`}>
              <LogPage kind={active.dir > 0 ? cr : cl} />
            </div>
            <div className={`page flip-face rear ${active.dir > 0 ? 'left' : 'right'}`}>
              <LogPage kind={active.dir > 0 ? nl : nr} />
            </div>
          </div>
        )}
        <div className="page-dots">
          {spreads.map((_, i) => <button key={i} className={i === (flip ? flip.to : spread) ? 'on' : ''} onClick={() => turn(i - spread)} aria-label={`${i + 1}`} />)}
        </div>
      </div>
    </div>
  )
}

function LogPage({ kind }) {
  if (kind === 'report') return <ReportPage />
  if (kind === 'crew') return <CrewPage />
  if (kind === 'supplies') return <SuppliesPage />
  if (kind === 'event') return <EventPage />
  if (kind === 'tasks') return <TasksPage />
  return <PlanPage />
}

// Yesterday, written down. Older days can be browsed.
function ReportPage() {
  const { t, L } = useT()
  const { mission: m } = useGame()
  const destId = useGame((s) => s.destinationId)
  const dest = destinationById[destId]
  const [back, setBack] = useState(0)
  const idx = m.journal.length - 1 - back
  const page = m.journal[idx]
  const prev = m.journal[idx - 1]
  const quote = back === 0 ? quoteOfDay(m.crew, m.day) : null
  // What changed today (from the end-of-day snapshots)
  const d = page.snap && prev && prev.snap ? {
    dose: page.snap.dose - prev.snap.dose,
    food: page.snap.food != null && prev.snap.food != null ? page.snap.food - prev.snap.food : null,
    o2: m.systems ? page.snap.o2 - prev.snap.o2 : null,
  } : null
  const pct = Math.min(100, Math.round((m.science / m.goal) * 100))
  const icon = { good: '✓', bad: '✗', warn: '!' }
  return (
    <>
      <figure className="polaroid">
        <div className="polaroid-img" style={{ backgroundImage: `url(/textures/${destId}.jpg)` }} />
        <figcaption>{L(dest.name)}</figcaption>
      </figure>
      <div className="page-head">
        <span className="tiny">{t('journal')} · Astraea</span>
        <h2>{page.day === 0 ? t('arrival') : `${t('day')} ${page.day}`}</h2>
      </div>
      {/* Mission calendar: past days crossed out, today circled */}
      <div className="calendar" aria-label={`${t('day')} ${m.day} / ${m.totalDays}`}>
        {Array.from({ length: m.totalDays }, (_, i) => <span key={i} className={i < page.day ? 'past' : i === page.day ? 'today' : ''}>{i + 1}</span>)}
      </div>
      {d && (
        <div className="day-stamps">
          {page.science > 0 && <span className="stamp good">+{page.science} {t('science').toLowerCase()}</span>}
          {d.dose > 0.05 && <span className={`stamp ${d.dose > 3 ? 'bad' : ''}`}>+{d.dose.toFixed(1)} mSv</span>}
          {d.food != null && d.food < 0 && <span className="stamp">{Math.round(d.food * 10) / 10} {t('daysShort')} {t('supplies').toLowerCase()}</span>}
          {d.o2 != null && Math.abs(d.o2) >= 1 && <span className={`stamp ${d.o2 < 0 ? 'bad' : 'good'}`}>O₂ {d.o2 > 0 ? '+' : ''}{Math.round(d.o2)}%</span>}
        </div>
      )}
      <p className="hand muted section">{t('whatHappened')}</p>
      <ul className="hand entries marked">
        {page.entries.length ? page.entries.map((e, k) => <li key={k} className={e.type}><i>{icon[e.type] || '·'}</i>{L(e.text)}</li>) : <li className="good"><i>✓</i>{t('quietDay')}</li>}
      </ul>
      <div className="sci-progress">
        <span className="hand">{t('science')} {Math.round(m.science)} / {m.goal}</span>
        <div className="hatch"><div style={{ width: `${pct}%` }} /></div>
      </div>
      {quote && (
        <p className="sticky" style={{ '--accent': crewById[quote.id].color }}>
          “{L(quote.text)}”
          <b>— {crewById[quote.id].name.split(' ')[0]}</b>
        </p>
      )}
      <div className="page-nav">
        <button onClick={() => setBack(back + 1)} disabled={back >= m.journal.length - 1}>← {t('before')}</button>
        {back > 0 && <button onClick={() => setBack(back - 1)}>{t('after')} →</button>}
      </div>
    </>
  )
}

// The crew, as taped photos (rendered in Blender) that change with how each person is doing
function CrewPage() {
  const { t, L } = useT()
  const { mission: m, tasks } = useGame()
  const word = (v, hi, mid, lo) => (v > 66 ? hi : v > 33 ? mid : lo)
  return (
    <>
      <span className="tiny">{t('crewPage')}</span>
      <div className="crew-photos">
        {m.crew.map((c, i) => {
          const info = crewById[c.id]
          const first = info.name.split(' ')[0]
          const sore = m.systems && m.day - (c.lastExercise || 0) > 3
          const state = [c.health <= 33 && 'critical', c.health <= 66 && 'hurt', c.energy <= 33 && 'sleepy', c.morale <= 33 && 'sad'].filter(Boolean).join(' ')
          return (
            <figure key={c.id} className={`crew-photo ${state}`} style={{ '--accent': info.color, '--tilt': `${(i % 2 ? 1 : -1) * (1.5 + (i % 3))}deg` }}>
              <span className="tape" aria-hidden />
              <div className="photo" style={{ backgroundImage: `url(/portraits/${first.toLowerCase()}.png)` }}>
                {c.health <= 66 && <span className="bandage" aria-hidden />}
                {c.energy <= 33 && <span className="zzz" aria-hidden>Zzz</span>}
              </div>
              <figcaption className="hand"><b>{first}{c.commander ? ' ★' : ''}</b></figcaption>
              <p className="hand">
                {word(c.health, t('w_healthy'), t('w_hurt'), t('w_critical'))}, {word(c.energy, t('w_rested'), t('w_tired'), t('w_exhausted'))}, {word(c.morale, t('w_upbeat'), t('w_calm'), t('w_down'))}.
                {sore && <span className="sore"> {t('w_sore')}</span>}
              </p>
              {tasks && tasks[c.id] && <small className="hand muted">{t('taskToday')}: {L(TASKS[taskKind(tasks[c.id])].name).toLowerCase()}</small>}
            </figure>
          )
        })}
      </div>
    </>
  )
}

// Inventory drawn like a supply shelf: ration packs, bottles, tanks, crates
function SuppliesPage() {
  const { t, L } = useT()
  const { mission: m, ration } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const food = m.crew ? Math.max(0, Math.floor(m.supplies)) : null
  const power = Math.round(powerLevel(m, dest) * 100)
  const many = (n, max, Item) => (n > 0 ? Array.from({ length: Math.min(n, max) }, (_, i) => <Item key={i} i={i} />) : <Empty />)
  return (
    <>
      <span className="tiny">{t('suppliesPage')}</span>
      {food != null && (
        <div className="shelf">
          <div className="shelf-head hand"><b>{t('supplies')}</b> <span className={food < 3 ? 'low' : ''}>{food} {t('daysShort')}{ration ? ` · ${t('rationShort')}` : ''}</span></div>
          <div className="shelf-items">{many(food, 16, FoodPack)}{food > 16 && <span className="hand more">+{food - 16}</span>}</div>
        </div>
      )}
      <div className="gauges-row">
        {m.systems && <div className={`gauge-doodle ${m.water < 30 ? 'low' : ''}`}><LevelDoodle kind="water" level={m.water} /><span className="hand">{t('water')} {Math.round(m.water)}%</span></div>}
        {m.systems && <div className={`gauge-doodle ${m.o2 < 30 ? 'low' : ''}`}><LevelDoodle kind="o2" level={m.o2} /><span className="hand">O₂ {Math.round(m.o2)}%</span></div>}
        <div className={`gauge-doodle ${power < 70 ? 'low' : ''}`}><LevelDoodle kind="power" level={power} /><span className="hand">{t('powerHud')} {power}%</span></div>
      </div>
      <div className="shelf two">
        <div>
          <div className="shelf-head hand"><b>{t('sparesShort')}</b> <span className={m.spares === 0 ? 'low' : ''}>{m.spares}</span></div>
          <div className="shelf-items">{many(m.spares, 8, SpareCrate)}</div>
        </div>
        <div>
          <div className="shelf-head hand"><b>{t('fuel')}</b> <span className={m.spareTanks === 0 ? 'low' : ''}>{m.spareTanks}</span></div>
          <div className="shelf-items">{many(m.spareTanks, 8, FuelTank)}</div>
        </div>
      </div>
      <p className="hand muted small-line">{t('electronics')} {Math.round(m.electronics)}% · {t('dose')} {m.dose.toFixed(1)} mSv</p>
      {m.systems && (
        <>
          <h4>{t('systemsHud')}</h4>
          <ul className="hand inventory systems-list">
            {Object.entries(m.systems).map(([id, v]) => (
              <li key={id} className={v < BROKEN ? 'low circled' : ''}>
                <span>{L(SYSTEMS[id].name)}</span>
                <b>{v < BROKEN ? t('w_broken') : v < 60 ? t('w_worn') : t('w_ok')} ({Math.round(v)}%)</b>
              </li>
            ))}
          </ul>
          {!m.voiceBack && <p className="fact-note"><span className="tape" aria-hidden />{t('goalAntenna')}</p>}
        </>
      )}
    </>
  )
}

// Today's problem and the options
function EventPage() {
  const { t, L } = useT()
  const { mission: m, event, pick, pickOption } = useGame()
  const ev = event && EVENTS[event]
  const canAct = (o) => (o.needs === 'fuel' ? m.spareTanks > 0 : o.needs === 'spares' ? m.spares > 0 : o.needs === 'medkit' ? (m.parts.medkit || 0) > 0 : true) && (!o.crewedOnly || !!m.crew)
  return (
    <>
      <span className="tiny">{t('today')} · {t('day')} {m.day + 1}</span>
      {ev ? (
        <div className="today-event">
          <EventDoodle event={event} />
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
    </>
  )
}

// Who does what today
function TasksPage() {
  const { t, L } = useT()
  const { mission: m, tasks, suggestTasks, ration, toggleRation } = useGame()
  return (
    <>
      <span className="tiny">{t('tasksToday')}</span>
      <div className="task-grid">
        {m.crew.map((c) => (
          <div key={c.id} className="task-line">
            <b style={{ color: crewById[c.id].color }}>{crewById[c.id].name.split(' ')[0]}</b>
            <TaskSelect c={c} />
            <small>{L(TASKS[taskKind(tasks && tasks[c.id])].tip)}</small>
          </div>
        ))}
      </div>
      <button className="link dark" onClick={suggestTasks}>{t('suggest')}</button>
      <label className="ration hand">
        <input type="checkbox" checked={ration} onChange={toggleRation} /> {t('rationLabel')}
      </label>
    </>
  )
}

// Final page: the day's plan in words, warnings, and the button to live it
function PlanPage() {
  const { t, L } = useT()
  const { mission: m, event, pick, plan, setPlan, startDay, tasks, ration, orderPick, pickOrder } = useGame()
  const ready = !event || !!pick
  const warn = []
  if (m.systems && tasks) {
    const job = (c) => taskKind(tasks[c.id])
    if (!m.crew.some((c) => job(c) === 'science')) warn.push(t('warnNoScience'))
    m.crew.filter((c) => c.energy < 25 && job(c) !== 'rest').forEach((c) => warn.push(t('warnExhausted', { n: crewById[c.id].name })))
    if (Object.values(m.systems).some((v) => v < BROKEN) && !m.crew.some((c) => job(c) === 'repair' || job(c) === 'eva')) warn.push(t('warnBroken'))
    if (m.o2 < 40 && !m.crew.some((c) => job(c) === 'recycle')) warn.push(t('warnAir'))
    if (m.crew.some((c) => job(c) === 'repair' && m.systems[(tasks[c.id] || '').split(':')[1]] < BROKEN) && m.spares === 0) warn.push(t('warnSpares'))
  }
  if (event && !pick) warn.push(t('warnEvent'))
  return (
    <>
      <span className="tiny">{t('planPage')}</span>
      {m.systems ? (
        <ul className="hand entries plan-lines">
          {m.crew.map((c) => {
            const task = tasks && tasks[c.id]
            const target = task && task.split(':')[1]
            return <li key={c.id}><b>{crewById[c.id].name.split(' ')[0]}</b>: {L(TASKS[taskKind(task)].name).toLowerCase()}{target ? ` · ${L(SYSTEMS[target].name).toLowerCase()}` : ''}</li>
          })}
          {ration && <li className="warn">{t('rationOn')}</li>}
        </ul>
      ) : (
        <>
          <h4>{t('todaysPlan')}</h4>
          <div className="hand-row">
            {PLANS.map((p) => <button key={p} className={`chip-hand ${plan === p ? 'on' : ''}`} onClick={() => setPlan(p)}>{t(`plan_${p}`)}</button>)}
          </div>
          {m.crew && (
            <>
              <h4>{t('crewOrder')}</h4>
              <div className="order-grid">
                {m.crew.map((c) => (
                  <div key={c.id} className="order-line">
                    <b style={{ color: crewById[c.id].color }}>{crewById[c.id].name.split(' ')[0]}</b>
                    {ORDERS.map((o) => <button key={o} className={`chip-hand small ${orderPick && orderPick.crewId === c.id && orderPick.order === o ? 'on' : ''}`} onClick={() => pickOrder(c.id, o)}>{t(`order_${o}`)}</button>)}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {warn.length > 0 && <ul className="hand warnings">{warn.map((w) => <li key={w}>{w}</li>)}</ul>}
      <div className="logbook-actions">
        <span />
        <button className="btn" disabled={!ready} onClick={startDay}>{ready ? (m.day + 1 >= m.totalDays ? t('lastDay') : t('liveDay')) : t('chooseFirst')} →</button>
      </div>
    </>
  )
}
