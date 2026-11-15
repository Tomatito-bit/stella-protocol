import { useState } from 'react'
import { useGame } from './store'
import { isMuted, setMuted } from './sound'
import { useT } from './i18n'
import Home from './screens/Home'
import Destination from './screens/Destination'
import Crew from './screens/Crew'
import Design from './screens/Design'
import Review from './screens/Review'
import Launch from './screens/Launch'
import Mission from './screens/Mission'
import Legacy from './screens/Legacy'

const SCREENS = { home: Home, destination: Destination, crew: Crew, design: Design, review: Review, launch: Launch, mission: Mission, legacy: Legacy }
const STEP_OF = { destination: 0, crew: 1, design: 2, review: 3, launch: 4, mission: 5, legacy: 6 }

export default function App() {
  const screen = useGame((s) => s.screen)
  const Screen = SCREENS[screen]
  return (
    <div className="app">
      <Header />
      <main className="content">
        <Screen />
      </main>
    </div>
  )
}

function SoundToggle() {
  const { t } = useT()
  const [off, setOff] = useState(isMuted)
  return <button className="lang" onClick={() => { setMuted(!off); setOff(!off) }}>{off ? t('soundOff') : t('soundOn')}</button>
}

function Header() {
  const { t } = useT()
  const screen = useGame((s) => s.screen)
  const toggleLang = useGame((s) => s.toggleLang)
  const restart = useGame((s) => s.restart)
  const step = STEP_OF[screen]
  return (
    <header className="header">
      <button className="brand" onClick={restart}>{t('title')}</button>
      {step !== undefined && (
        <ol className="steps">
          {t('steps').map((name, i) => (
            <li key={name} className={i < step ? 'done' : i === step ? 'current' : ''}>
              <span>{i + 1}</span> {name}
            </li>
          ))}
        </ol>
      )}
      <div className="header-tools">
        <SoundToggle />
        <button className="lang" onClick={toggleLang}>{t('lang')}</button>
      </div>
    </header>
  )
}
