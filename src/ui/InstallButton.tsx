import { useState } from 'react'
import { installieren, useInstallStatus } from './pwaInstall'

/** „App installieren“: Browser-Dialog (Chrome/Edge/Android) oder Anleitung für iOS; verschwindet, sobald die App installiert ist. */
export function InstallButton() {
  const status = useInstallStatus()
  const [hinweis, setHinweis] = useState(false)
  if (status === 'installiert') return null
  if (status === 'bereit') {
    return <button type="button" className="btn" onClick={() => void installieren()}>📲 App installieren</button>
  }
  return (
    <>
      <button type="button" className="btn" aria-expanded={hinweis} onClick={() => setHinweis((h) => !h)}>📲 App installieren</button>
      {hinweis && (
        <p className="card small install-hinweis">
          {status === 'ios'
            ? 'Tippe in Safari auf „Teilen“ (Quadrat mit Pfeil) und wähle „Zum Home-Bildschirm“.'
            : 'Öffne das Browser-Menü (⋮) und wähle „App installieren“ bzw. „Zum Startbildschirm hinzufügen“. Je nach Browser ist das nicht möglich.'}
        </p>
      )}
    </>
  )
}
