import { LazyMotion, MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './fonts/schriften.css'
import App from './App'
import './styles.css'

registerSW({ immediate: true })

const ladeFeatures = () => import('./motion-features').then((m) => m.default)

// Das vorgerenderte HTML ist nur der schnelle erste Anblick; React rendert danach mit der echten Uhrzeit neu.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={ladeFeatures} strict>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
)
