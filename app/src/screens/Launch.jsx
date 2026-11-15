import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { LAUNCHERS } from '../data/parts'
import { summarize } from '../logic/budget'
import { T, telemetry, phaseOf } from '../logic/launch'
import { LaunchScene } from '../components/LaunchScene'
import { PROLOGUE } from '../data/prologue'
import { sfx } from '../sound'

// Phase D: countdown, liftoff, staging, fairing, cruise and orbit insertion
export default function Launch() {
  const { t, L } = useT()
  const { selection, launcherId, tests, launch } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const start = useRef(0)
  const [sec, setSec] = useState(0)
  const [story, setStory] = useState(() => import.meta.env.DEV && new URLSearchParams(location.search).has('story'))
  const launcher = LAUNCHERS.find((l) => l.id === launcherId) || LAUNCHERS[1]
  const shield = summarize(dest, selection, launcherId, tests).shield

  useEffect(() => {
    // Dev only: ?t=9 jumps into the launch at that second
    start.current = performance.now() - (import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('t')) || 0 : 0) * 1000
    let id
    let last = -1
    const tick = () => {
      const s = (performance.now() - start.current) / 1000
      // Countdown beeps every second, then the rumble of liftoff
      const whole = Math.floor(s)
      if (whole !== last) { last = whole; if (s < T.liftoff - 0.5) sfx.beep(); else if (whole === Math.floor(T.liftoff)) sfx.liftoff() }
      setSec(s)
      if (s >= T.end) return setStory(true)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  const phase = phaseOf(sec)
  const tel = telemetry(sec)
  const countdown = Math.max(0, Math.ceil(T.liftoff - sec))
  const clock = sec < T.liftoff ? `T−${countdown}` : `T+${Math.floor(sec - T.liftoff)}`

  return (
    <section className="launch">
      <LaunchScene kind={launcher.id} destId={dest.id} sel={selection} crewed={dest.crewed} shield={shield} start={start} />
      <div className="launch-hud">
        <p className="eyebrow">{L(launcher.name)} → {L(dest.name)}</p>
        <h1 className="launch-clock">{clock}</h1>
        <p className="launch-phase">{t(`ph_${phase}`, { dest: L(dest.name) })}</p>
      </div>
      <div className="launch-telemetry">
        {tel.alt !== null && <div><span>{t('altitude')}</span><b>{tel.alt.toLocaleString()} km</b></div>}
        <div><span>{t('speed')}</span><b>{tel.speed.toLocaleString()} km/h</b></div>
        <div><span>{t('stage')}</span><b>{sec < T.meco ? 1 : sec < T.transfer ? 2 : t('spacecraft')}</b></div>
      </div>
      <div className="launch-steps">
        {['ignition', 'liftoff', 'maxq', 'meco', 'fairing', 'transfer', 'insertion'].map((p) => (
          <span key={p} className={sec >= T[p === 'ignition' ? 'ignition' : p === 'maxq' ? 'maxQ' : p] ? 'done' : ''}>{t(`step_${p}`)}</span>
        ))}
      </div>
      {!story && <button className="btn ghost skip" onClick={() => setStory(true)}>{t('skip')} »</button>}
      {story && (
        <div className="prologue">
          <div className="prologue-card">
            <p className="eyebrow">{t('prologue')}</p>
            <h2>{L(PROLOGUE.title)}</h2>
            {PROLOGUE.paragraphs.map((p, k) => (
              <p key={k} style={{ animationDelay: `${0.4 + k * 1.2}s` }}>{L(p).replace('{dest}', L(dest.name))}</p>
            ))}
            <button className="btn big glow" style={{ animationDelay: `${0.4 + PROLOGUE.paragraphs.length * 1.2}s` }} onClick={launch}>{t('beginMission')} →</button>
          </div>
        </div>
      )}
    </section>
  )
}
