// Nur für den Build: rendert den Zettel einmal zu statischem HTML, damit er sofort sichtbar ist.
import { domMax, LazyMotion, MotionConfig } from 'motion/react'
import { renderToString } from 'react-dom/server'
import App from './App'

export function render(): string {
  return renderToString(
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </LazyMotion>,
  )
}
