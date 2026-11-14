import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { LAUNCHERS } from '../data/parts'
import { summarize } from '../logic/budget'
import { T, telemetry, phaseOf } from '../logic/launch'
import { LaunchScene } from '../components/LaunchScene'

// Phase D: countdown, liftoff, staging, fairing, cruise and orbit insertion
export default function Launch() {
  const { t, L } = useT()
  const { selection, launcherId, tests, launch } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const start = useRef(0)
  const [sec, setSec] = useState(0)
  const launcher = LAUNCHERS.find((l) => l.id === launcherId) || LAUNCHERS[1]
  const shield = summarize(dest, selection, launcherId, tests).shield

  useEffect(() => {
    start.current = performance.now()
    let id
    const tick = () => {
      const s = (performance.now() - start.current) / 1000
      setSec(s)
      if (s >= T.end) return launch()
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [launch])

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
      <button className="btn ghost skip" onClick={launch}>{t('skip')} »</button>
    </section>
  )
}
