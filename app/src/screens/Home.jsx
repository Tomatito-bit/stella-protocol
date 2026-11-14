import { useGame } from '../store'
import { useT } from '../i18n'
import { Planet3D } from '../components/Planet3D'

export default function Home() {
  const { t, lang } = useT()
  const go = useGame((s) => s.go)
  return (
    <section className="home">
      <div className="home-planet">
        <Planet3D id="mars" stars speed={0.06} camera={3.3} />
      </div>
      <div className="home-text">
        <p className="eyebrow">NASA Space Apps Challenge 2026</p>
        <h1>{t('title')}</h1>
        <p className="lead">{t('tagline')}</p>
        <button className="btn big glow" onClick={() => go('destination')}>{t('start')}</button>
        <ul className="home-chips">
          <li>{lang === 'es' ? 'Diseña tu nave' : 'Build your spacecraft'}</li>
          <li>GO / NO-GO</li>
          <li>{lang === 'es' ? 'Día con día' : 'Day by day'}</li>
          <li>{lang === 'es' ? 'Riesgos reales de la NASA' : 'Real NASA risks'}</li>
        </ul>
      </div>
    </section>
  )
}
