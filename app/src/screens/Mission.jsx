import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { startHum, stopHum, sfx } from '../sound'
import { TUTORIAL } from '../data/tutorial'
import { quoteOfDay } from '../data/quotes'
import { EventDoodle } from '../components/Doodles'
import { FoodPack, LevelDoodle, SpareCrate, FuelTank, Empty, TaskIcon } from '../components/Doodles'
import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { crewById } from '../data/crew'
import { EVENTS } from '../data/events'
import { biometrics } from '../logic/mission'
import { MissionScene } from '../components/MissionScene'
import { CrewInterior } from '../components/CrewInterior'
import { SurfaceScene } from '../components/SurfaceScene'
import { SITES, SAMPLES, SAMPLES_FOR, SAMPLE_GOAL, QUEST_SITES, SITE_SCIENCE, LANDING, siteChoices, exploreTarget } from '../data/exploration'
import { TASKS, SYSTEMS, BROKEN, taskKind, taskTarget, worstSystem, powerLevel } from '../logic/ship'

const PLANS = ['science', 'transmit', 'rest']
const ORDERS = ['rest', 'medical', 'exercise', 'talk']

export default function Mission() {
  const { t, L } = useT()
  const { mission: m, plan, event, journalOpen, openJournal, tasks, live, view: storeView, setView } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const storm = event === 'solarStorm' || event === 'radiationBelt'
  const pct = Math.min(100, Math.round((m.science / m.goal) * 100))
  const view = storeView
  const surface = !!m.explore && view === 'surface'
  const inside = !surface && !!m.crew && view === 'crew'
  // Life-support fans hum in the background during the mission
  useEffect(() => { startHum(); return stopHum }, [])

  return (
    <section className="mission">
      <div className="mission-view">
        {surface
          ? <SurfaceScene destId={dest.id} heli={(m.parts.helicopter || 0) > 0} stuck={m.explore.stuck > 0} event={event} paused={journalOpen} pos={m.explore.pos} prevPos={m.explore.prevPos} day={m.day} visited={m.explore.visited} quest={m.explore.quest && m.explore.quest.id} />
          : inside
          ? <CrewInterior crew={m.crew} plan={plan} event={event} destId={dest.id} sel={m.parts} shield={m.shield} tasks={tasks} systems={m.systems} paused={journalOpen} />
          : <MissionScene destId={dest.id} sel={m.parts} crewed={dest.crewed} shield={m.shield} storm={storm} safe={plan === 'rest'} event={event} paused={journalOpen} />}
        {m.crew && (
          <div className="view-toggle">
            <button className={!inside && !surface ? 'on' : ''} onClick={() => setView('ship')}>{t('viewShip')}</button>
            <button className={inside ? 'on' : ''} onClick={() => setView('crew')}>{t('viewCrew')}</button>
            {m.explore && <button className={surface ? 'on' : ''} onClick={() => setView('surface')}>{t('viewSurface')}</button>}
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

// Breaking news on board: the event plays out in 3D, then the logbook opens so you can decide
function LiveAlert({ event, onOpen }) {
  const { t, L } = useT()
  const ev = EVENTS[event]
  useEffect(() => {
    const id = setTimeout(onOpen, 8000)
    return () => clearTimeout(id)
  }, [event, onOpen])
  if (!ev) return null
  return (
    <div className={`live-alert ${ev.secret ? 'secret' : ev.tier ? 'social' : ''}`} key={event}>
      <span className="live-dot" /> <span className="live-tag">{ev.secret ? t('unknownSignal') : t('liveNow')}</span>
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
  // While the cover swings open, the left page stays hidden under it
  const [opening, setOpening] = useState(true)
  // ...and once it has landed, the cover itself goes away (the real left page is underneath, identical)
  const [coverOn, setCoverOn] = useState(true)
  useEffect(() => {
    const a = setTimeout(() => setOpening(false), 640)
    const b = setTimeout(() => setCoverOn(false), 760)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  const spreads = m.systems
    ? [['report', 'crew'], ['supplies', 'event'], ...(m.explore ? [['map', 'samples']] : []), ['tasks', 'plan']]
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
  // Each spread is ONE text flowing in two columns: what doesn't fit on the left page continues on the right
  const target = active ? active.to : spread
  // While a page turns, each half of the book shows the right spread: the old one where the sheet
  // hasn't passed yet, the new one where it has
  const leftIdx = active && active.dir < 0 ? active.to : spread
  const rightIdx = active && active.dir > 0 ? active.to : spread
  return (
    <div className="modal-bg logbook-bg">
      <div className={`logbook ${opening ? 'opening' : ''}`} style={{ '--cover': cover.color }}>
        {/* Opening: the cover swings open over the spiral while the left page is revealed */}
        {coverOn && <div className="cover-opening" aria-hidden>
          <div className="cover-face front"><span>{t('journal')}</span><b>{t('day')} {m.day + 1}</b></div>
          <div className="cover-face back page left"><SpreadFlow kinds={spreads[spread]} inFace="left" /></div>
        </div>}
        <div className="page left" aria-hidden />
        <div className="page right" aria-hidden />
        <div className="rings" aria-hidden />
        {leftIdx === rightIdx
          ? <SpreadFlow key={`f-${leftIdx}`} kinds={spreads[leftIdx]} />
          : <>
            <SpreadFlow key={`l-${leftIdx}`} kinds={spreads[leftIdx]} half="left" />
            <SpreadFlow key={`r-${rightIdx}`} kinds={spreads[rightIdx]} half="right" />
          </>}
        <div className="spread-nav">
          {target > 0 ? <button onClick={() => turn(-1)}>← {t('prevPage')}</button> : <button onClick={closeJournal}>{t('lookAround')}</button>}
          {target < spreads.length - 1 && <button onClick={() => turn(1)}>{t('nextPage')} →</button>}
        </div>
        {active && (
          <div className={`flip-sheet ${active.dir > 0 ? 'fwd' : 'back'}`} onAnimationEnd={flip ? done : undefined} style={frozen ? { animationDelay: `-${freeze}s`, animationPlayState: 'paused' } : undefined} aria-hidden>
            {/* Front: the half of the old spread the sheet carries away; back: the half of the new one it lays down */}
            <div className={`page flip-face front ${active.dir > 0 ? 'right' : 'left'}`}>
              <SpreadFlow kinds={spreads[spread]} inFace={active.dir > 0 ? 'right' : 'left'} />
            </div>
            <div className={`page flip-face rear ${active.dir > 0 ? 'left' : 'right'}`}>
              <SpreadFlow kinds={spreads[active.to]} inFace={active.dir > 0 ? 'left' : 'right'} />
            </div>
          </div>
        )}
        <div className="page-dots">
          {spreads.map((_, i) => <button key={i} className={i === target ? 'on' : ''} onClick={() => turn(i - spread)} aria-label={`${i + 1}`} />)}
        </div>
      </div>
    </div>
  )
}

// The content of a two-page spread laid out as two columns (left page → right page).
// half: show only one page of it (during a page turn); inFace: drawn inside the turning sheet.
// If it ever needs more than two pages, it falls back to scrolling.
function SpreadFlow({ kinds, half, inFace }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // If the first section fits on the left page, the second starts on the right page;
    // if it doesn't fit, its overflow continues on the right page and the second follows it.
    const layout = () => {
      const [first, second] = el.querySelectorAll(':scope > .flow-part')
      el.classList.remove('overflow')
      if (second) {
        second.classList.remove('col-break')
        const mid = el.getBoundingClientRect().left + el.clientWidth / 2
        if (second.getBoundingClientRect().left < mid && first) second.classList.add('col-break')
      }
      if (!inFace) el.classList.toggle('overflow', el.scrollWidth > el.clientWidth + 4)
    }
    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(el)
    return () => ro.disconnect()
  }, [inFace, kinds])
  return (
    <div ref={ref} className={`spread-flow ${half ? `half-${half}` : ''} ${inFace ? `in-face face-${inFace}` : ''}`}>
      {kinds.map((k) => <section key={k} className="flow-part"><LogPage kind={k} /></section>)}
    </div>
  )
}

function LogPage({ kind }) {
  if (kind === 'report') return <ReportPage />
  if (kind === 'crew') return <CrewPage />
  if (kind === 'supplies') return <SuppliesPage />
  if (kind === 'event') return <EventPage />
  if (kind === 'tasks') return <TasksPage />
  if (kind === 'map') return <MapPage />
  if (kind === 'samples') return <SamplesPage />
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
  const icon = { good: '✓', bad: '✗', warn: '!', story: '✎' }
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

// A small bar drawn in ink: green, amber or red
function HandBar({ label, v }) {
  const level = v < 35 ? 'bad' : v < 60 ? 'mid' : ''
  return (
    <span className={`hand-bar ${level}`}>
      <small className="hand">{label}</small>
      <i><b style={{ width: `${Math.max(0, Math.min(100, v))}%` }} /></i>
    </span>
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
              <div className="hand-vitals">
                <HandBar label={t('health')} v={c.health} />
                <HandBar label={t('energy')} v={c.energy} />
                <HandBar label={t('morale')} v={c.morale} />
                <span className="pulse hand">♥ {biometrics(c, m.day).heart}</span>
              </div>
              {m.systems && tasks && tasks[c.id] && (
                <div className="photo-task hand"><TaskIcon kind={taskKind(tasks[c.id])} /> {t('taskToday')}: {L(TASKS[taskKind(tasks[c.id])].name).toLowerCase()}{taskKind(tasks[c.id]) === 'repair' && SYSTEMS[taskTarget(tasks[c.id])] ? ` · ${L(SYSTEMS[taskTarget(tasks[c.id])].name).toLowerCase()}` : ''}</div>
              )}
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
  const { mission: m, ration, setTask, tasks } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const engineer = m.crew && (m.crew.find((c) => c.duty === 'engineer') || m.crew[0])
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
                {v < 85 && (tasks && tasks[engineer.id] === `repair:${id}`
                  ? <span className="fix-sent">✓ {t('fixSent', { n: crewById[engineer.id].name.split(' ')[0] })}</span>
                  : <button className="fix-link" onClick={() => { sfx.repair(); setTask(engineer.id, `repair:${id}`) }} title={t('sendEngineer')}>{t('fixShort')} →</button>)}
              </li>
            ))}
          </ul>
          {m.explore && (
            <div className="explore-note hand">
              <b>{t('exploreTitle')}</b>{' '}
              {m.explore.stuck >= 900 ? t('roverLost') : m.explore.stuck > 0 ? t('roverStuck', { n: m.explore.stuck }) : t('roverOk')}
              {' · '}{t('sitesVisited', { n: m.explore.idx })}
              {' · '}{t('samplesCount', { n: m.explore.samples.length, goal: SAMPLE_GOAL })}
              {m.explore.quest && <> · <b className="quest-tag">{t('questLeft', { n: m.explore.quest.left })}</b></>}
              {(m.parts.helicopter || 0) > 0 && <> · {t('heliOk')}</>}
            </div>
          )}
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
        <div className={`today-event ${ev.secret ? 'classified' : ''}`}>
          {ev.secret ? <span className="classified-stamp">{t('classified')}</span> : <EventDoodle event={event} />}
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

// Name of the place the rover is heading to with this task
function siteName(m, task) {
  const dest = destinationById[useGame.getState().destinationId]
  const key = exploreTarget(dest.id, m.explore, task)
  return key === 'q' ? QUEST_SITES[m.explore.quest.id] : SITES[dest.id][key]
}

// Who does what today
function TasksPage() {
  const { t, L } = useT()
  const { mission: m, tasks, suggestTasks, ration, toggleRation } = useGame()
  return (
    <>
      <span className="tiny">{t('tasksToday')}</span>
      <div className="task-board">
        {m.crew.map((c) => (
          <div key={c.id} className="task-row">
            <div className="task-who">
              <b className="hand" style={{ color: crewById[c.id].color }}>{crewById[c.id].name.split(' ')[0]}</b>
              <small className="hand">{taskKind(tasks && tasks[c.id]) === 'explore' && m.explore && m.explore.stuck === 0 ? t('drivingTo', { n: L(siteName(m, tasks[c.id])) }) : L(TASKS[taskKind(tasks && tasks[c.id])].tip)}</small>
            </div>
            <TaskPicker c={c} />
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

// Jobs as hand-drawn stickers: tap one and it gets circled in red. Repair asks which system.
const STICKERS = ['science', 'repair', 'comms', 'medbay', 'exercise', 'recycle', 'eva', 'explore', 'rest']
function TaskPicker({ c }) {
  const { L } = useT()
  const { mission: m, tasks, setTask } = useGame()
  const value = (tasks && tasks[c.id]) || 'rest'
  const kind = taskKind(value)
  const target = taskTarget(value)
  const pick = (k) => { sfx.select(); setTask(c.id, k === 'repair' ? `repair:${target || worstSystem(m.systems)}` : k) }
  return (
    <div className="task-picker">
      <div className="stickers" style={{ '--n': m.explore ? 9 : 8 }}>
        {STICKERS.filter((k) => k !== 'explore' || m.explore).map((k) => (
          <button key={k} className={`sticker ${kind === k ? 'on' : ''}`} onClick={() => pick(k)} title={L(TASKS[k].tip)}>
            <TaskIcon kind={k} />
            <span className="hand">{L(TASKS[k].short || TASKS[k].name)}</span>
          </button>
        ))}
      </div>
      {kind === 'repair' && (
        <div className="repair-targets">
          {Object.entries(m.systems).map(([id, v]) => (
            <button key={id} className={`chip-hand small ${target === id ? 'on' : ''} ${v < BROKEN ? 'broken' : ''}`} onClick={() => setTask(c.id, `repair:${id}`)}>
              {L(SYSTEMS[id].name)} · {Math.round(v)}%
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


const LETTERS = ['A', 'B', 'C', 'D']

// Who drives the rover today: whoever has the job, otherwise the pilot
const driverOf = (m, tasks) => (m.crew.find((c) => taskKind(tasks && tasks[c.id]) === 'explore') || m.crew.find((c) => c.duty === 'pilot') || m.crew[0])

// Hand-drawn map of the landing region: where the rover has been and where it can go next
function MapPage() {
  const { t, L } = useT()
  const { mission: m, tasks, setTask } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const x = m.explore
  const sites = SITES[dest.id]
  const driver = driverOf(m, tasks)
  const driving = taskKind(tasks && tasks[driver.id]) === 'explore'
  const choices = siteChoices(dest.id, x)
  const target = driving ? exploreTarget(dest.id, x, tasks[driver.id]) : null
  const go = (key) => { sfx.select(); setTask(driver.id, `explore:${key}`) }
  const pos = x.pos || LANDING
  const trail = [LANDING, ...x.trail || []]
  const q = x.quest && QUEST_SITES[x.quest.id]
  const blocked = x.stuck > 0
  return (
    <>
      <span className="tiny">{t('mapPage')}</span>
      <svg className="rover-map" viewBox="0 0 100 100" role="img" aria-label={t('mapPage')}>
        {/* terrain doodles */}
        <path d="M5 70 Q25 60 40 66 T75 62 T98 70" className="contour" />
        <path d="M2 35 Q20 28 38 33 T70 26 T98 32" className="contour" />
        <ellipse cx="46" cy="20" rx="9" ry="5" className="crater" />
        <ellipse cx="80" cy="90" rx="7" ry="4" className="crater" />
        <ellipse cx="12" cy="88" rx="6" ry="3.5" className="crater" />
        <path d="M90 8 l0 10 M85 13 l10 0" className="compass" /><text x="88.6" y="6" className="map-n">N</text>
        {/* where the rover has driven */}
        <polyline points={[...trail, pos].map((p) => p.join(',')).join(' ')} className="trail" />
        {/* the lander */}
        <path d={`M${LANDING[0] - 3} ${LANDING[1] + 2.5} L${LANDING[0]} ${LANDING[1] - 3} L${LANDING[0] + 3} ${LANDING[1] + 2.5} Z`} className="lander" />
        {sites.map((s, i) => {
          const c = choices.find((k) => k.key === i)
          const seen = x.visited.includes(i)
          return (
            <g key={i} className={`site risk-${s.risk} ${seen ? 'seen' : ''} ${c ? 'choice' : ''} ${target === i ? 'target' : ''}`} onClick={c && !blocked ? () => go(i) : undefined}>
              <circle cx={s.pos[0]} cy={s.pos[1]} r={c ? 3.2 : 2.2} />
              {seen && <path d={`M${s.pos[0]} ${s.pos[1]} v-6 l4 1.5 l-4 1.5`} className="flag" />}
              {target === i && <ellipse cx={s.pos[0]} cy={s.pos[1]} rx="6" ry="5" className="ring" />}
              {c && <text x={s.pos[0] + 4} y={s.pos[1] + 1.6} className="site-letter">{LETTERS[choices.indexOf(c)]}</text>}
            </g>
          )
        })}
        {q && (
          <g className={`site quest ${target === 'q' ? 'target' : ''}`} onClick={!blocked ? () => go('q') : undefined}>
            <path d={`M${q.pos[0]} ${q.pos[1] - 4} l1.2 2.8 3 .2 -2.3 2 .8 3 -2.7 -1.6 -2.7 1.6 .8 -3 -2.3 -2 3 -.2 Z`} />
            {target === 'q' && <ellipse cx={q.pos[0]} cy={q.pos[1]} rx="6.5" ry="5.5" className="ring" />}
            <text x={q.pos[0] + 4.5} y={q.pos[1] + 1.6} className="site-letter">{LETTERS[0]}</text>
          </g>
        )}
        {/* the rover, where it is now */}
        <g className={`map-rover ${blocked ? 'stuck' : ''}`} transform={`translate(${pos[0]} ${pos[1]})`}>
          <rect x="-2.6" y="-1.8" width="5.2" height="2.6" rx="0.6" />
          <circle cx="-1.8" cy="1.4" r="0.9" /><circle cx="0" cy="1.4" r="0.9" /><circle cx="1.8" cy="1.4" r="0.9" />
        </g>
      </svg>
      {x.stuck >= 900 ? <p className="hand map-warn">{t('roverLost')}</p> : blocked && <p className="hand map-warn">{t('roverStuck', { n: x.stuck })}</p>}
      <ul className="site-list hand">
        {choices.map((c, n) => (
          <li key={c.key}>
            <button className={`site-pick ${target === c.key ? 'on' : ''} ${c.quest ? 'quest' : ''}`} disabled={blocked} onClick={() => go(c.key)}>
              <span className="box">{target === c.key ? '✓' : ''}</span>
              <span>
                <b>{LETTERS[n]}. {L(c.site)}</b> <em className={`risk-word risk-${c.risk}`}>({t(`risk_${c.risk}`).toLowerCase()})</em>
                <small>
                  {c.km.toFixed(1)} km · +{c.quest ? c.site.sci : Math.round(SITE_SCIENCE[c.risk] * (c.seen ? 0.4 : 1))} {t('science').toLowerCase()}
                  {c.site.sample && !x.samples.includes(c.site.sample) ? ` · ${t('newSample')}: ${L(SAMPLES[c.site.sample].name)}` : c.seen ? ` · ${t('siteSeen')}` : ''}
                  {c.quest ? ` · ${t('questLeft', { n: x.quest.left })}` : ''}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="hand muted small-line">{driving ? t('mapDriver', { n: crewById[driver.id].name.split(' ')[0] }) : t('mapPick', { n: crewById[driver.id].name.split(' ')[0] })}</p>
    </>
  )
}

// The rock collection: a jar per sample, filled in as the rover finds them
function SamplesPage() {
  const { t, L } = useT()
  const { mission: m } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const got = m.explore.samples
  return (
    <>
      <span className="tiny">{t('samplesPage')}</span>
      <h4>{t('samplesCount', { n: got.length, goal: SAMPLE_GOAL })}</h4>
      <div className="sample-progress" aria-hidden>{Array.from({ length: SAMPLE_GOAL }, (_, i) => <span key={i} className={i < got.length ? 'on' : ''} />)}</div>
      <div className="sample-grid">
        {SAMPLES_FOR[dest.id].map((id) => {
          const s = SAMPLES[id]
          const have = got.includes(id)
          return (
            <div key={id} className={`sample-jar ${have ? 'have' : ''}`} title={have ? L(s.fact) : ''}>
              <svg viewBox="0 0 40 44" aria-hidden>
                <rect x="9" y="3" width="22" height="6" rx="1.5" className="lid" />
                <path d="M8 10 H32 V38 Q32 41 29 41 H11 Q8 41 8 38 Z" className="glass" />
                {have ? <path d="M12 38 L15 28 L20 31 L24 25 L28 38 Z" fill={s.color} stroke="#23264a" strokeWidth="1.2" /> : <text x="20" y="31" textAnchor="middle" className="q">?</text>}
              </svg>
              <span className="hand">{have ? L(s.name) : s.event ? t('sampleEvent') : '…'}</span>
            </div>
          )
        })}
      </div>
      {got.length > 0 && <p className="fact-note"><span className="tape" aria-hidden />{L(SAMPLES[got[got.length - 1]].fact)}</p>}
      <p className="hand muted small-line">{got.length >= SAMPLE_GOAL ? t('samplesDone') : t('samplesGoal', { n: SAMPLE_GOAL })}</p>
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
