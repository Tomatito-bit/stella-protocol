import { useGame } from '../store'
import { useT } from '../i18n'

// Temporary screen until the mission days are built
export default function Placeholder() {
  const { lang } = useT()
  const go = useGame((s) => s.go)
  return (
    <section className="page center">
      <h2>{lang === 'es' ? 'Días de misión: en construcción' : 'Mission days: under construction'}</h2>
      <p className="hint">{lang === 'es' ? 'Siguiente paso del día 1.' : 'Next step of day 1.'}</p>
      <button className="btn" onClick={() => go('review')}>← Review</button>
    </section>
  )
}
