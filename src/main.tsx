import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled rather than fetched: the app is meant to work outdoors, where the
// network often isn't there. Latin only — the app's own text is ASCII, and the screens
// it renders are numerals. The full packages ship cyrillic, greek, vietnamese and
// latin-ext faces for every weight, which is a megabyte of shell to precache for
// glyphs nothing here draws; a title typed in one of those scripts falls back to the
// system font, which is what it already did for the arrows the subsets never covered.
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-700.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker, requestPersistentStorage } from './lib/pwa.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
void requestPersistentStorage()
