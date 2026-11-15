import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadDemo } from './dev'
import { installClicks } from './sound'

if (import.meta.env.DEV) loadDemo()
installClicks()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
