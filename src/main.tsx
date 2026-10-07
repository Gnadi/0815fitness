import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'
import { initPwaInstall } from './ui/pwaInstall'
import { gespeichertesTheme, wendeThemeAn } from './ui/theme'

wendeThemeAn(gespeichertesTheme(), { speichern: false })
initPwaInstall()
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
