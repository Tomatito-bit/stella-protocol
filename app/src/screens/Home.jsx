import { useGame } from '../store'
import { useT } from '../i18n'

export default function Home() {
  const { t } = useT()
  const go = useGame((s) => s.go)
  return (
    <section className="home">
      <p className="eyebrow">NASA Space Apps Challenge 2026</p>
      <h1>{t('title')}</h1>
      <p className="lead">{t('tagline')}</p>
      <button className="btn big" onClick={() => go('destination')}>{t('start')}</button>
    </section>
  )
}
