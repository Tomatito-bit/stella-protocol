import { useGame } from '../store'
import { useT } from '../i18n'
import { destinationById } from '../data/destinations'
import { crewById } from '../data/crew'
import { grade } from '../logic/mission'
import { Planet3D } from '../components/Planet3D'
import { endingOf, epilogueLine } from '../data/endings'
import { useEffect } from 'react'
import { playStinger } from '../music'
import { SAMPLE_GOAL } from '../data/exploration'

// Mission ending: result, decision profile, crew epilogue and the real mission it was based on
export default function Legacy() {
  const { t, L, lang } = useT()
  const { mission: m, restart } = useGame()
  const dest = destinationById[useGame((s) => s.destinationId)]
  const { pct, level } = grade(m)
  useEffect(() => { playStinger(level === 'success' || level === 'partial') }, [level])
  const risky = m.decisions.filter((d) => d.risk === 'risky').length
  const safe = m.decisions.filter((d) => d.risk === 'safe').length
  const profile = !m.decisions.length ? 'calm' : risky > safe ? 'bold' : safe > risky ? 'cautious' : 'balanced'
  const es = lang === 'es'

  return (
    <section className="legacy">
      <div className="legacy-planet"><Planet3D id={dest.id} stars speed={0.05} /></div>
      <div className="legacy-text">
        <p className="eyebrow">{L(dest.name)} · {dest.realMission ? L(dest.realMission) : ''}</p>
        <h1 className={`result ${level}`}>{t(`result_${level}`)}</h1>
        {m.lost && <p className="lead">{L(m.lost)}</p>}
        {(m.crew || m.lost || level === 'fail') && (() => { const e = endingOf(m, level); return <div className={`ending ${m.lost || level === 'fail' ? 'lost' : ''}`}><h3>{L(e.title)}</h3><p>{L(e.text)}</p>{e.lesson && <p className="lesson"><b>{t('realLesson')}:</b> {L(e.lesson)}</p>}</div> })()}
        <div className="stats legacy-stats">
          <div><dt>{t('science')}</dt><dd>{pct}%</dd></div>
          <div><dt>{t('days')}</dt><dd>{m.day} / {m.totalDays}</dd></div>
          <div><dt>{t('dose')}</dt><dd>{m.dose.toFixed(1)} mSv</dd></div>
          <div><dt>{t('electronics')}</dt><dd>{Math.round(m.electronics)}%</dd></div>
        </div>

        {m.explore && <p className="small secrets-found">{t('samplesCount', { n: m.explore.samples.length, goal: SAMPLE_GOAL })}</p>}
        {m.secrets && m.secrets.length > 0 && <p className="small secrets-found">{t('secretsFound', { n: m.secrets.length })}</p>}
        <h3>{t('profile')}: {t(`profile_${profile}`)}</h3>
        <p className="small">{t(`profile_${profile}_info`)} ({safe} {t('risk_safe').toLowerCase()} · {risky} {t('risk_risky').toLowerCase()})</p>

        {m.crew && (
          <>
            <h3>{t('epilogue')}</h3>
            <ul className="epilogue">
              {m.crew.map((c) => {
                const info = crewById[c.id]
                return <li key={c.id}><b style={{ color: info.color }}>{info.name}</b> {epilogueLine(c, c.duty, es)}</li>
              })}
            </ul>
          </>
        )}

        <button className="btn big" onClick={restart}>{t('again')}</button>
      </div>
    </section>
  )
}
