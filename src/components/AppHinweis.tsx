import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const istStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const istIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)

/** Hinweis „Als App aufs Handy“ – mit Installieren-Knopf, auf dem iPhone mit kurzer Anleitung. */
export function AppHinweis() {
  const [ereignis, setEreignis] = useState<InstallEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [installiert, setInstalliert] = useState(true)

  useEffect(() => {
    setInstalliert(istStandalone())
    setIos(istIos())
    const vorher = (e: Event) => { e.preventDefault(); setEreignis(e as InstallEvent) }
    const fertig = () => { setInstalliert(true); setEreignis(null) }
    window.addEventListener('beforeinstallprompt', vorher)
    window.addEventListener('appinstalled', fertig)
    return () => { window.removeEventListener('beforeinstallprompt', vorher); window.removeEventListener('appinstalled', fertig) }
  }, [])

  const zeigen = !installiert && (ereignis !== null || ios)

  return (
    <AnimatePresence>
      {zeigen && (
        <m.section className="blatt app-hinweis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <h2>Den Zettel aufs Handy legen</h2>
          <p>Als App am Startbildschirm: jeden Sonntag mit zwei Tipps bestellt – und sie geht auch offline auf.</p>
          {ereignis ? (
            <button
              className="knopf"
              onClick={async () => {
                await ereignis.prompt()
                const { outcome } = await ereignis.userChoice
                if (outcome === 'accepted') setInstalliert(true)
                setEreignis(null)
              }}
            >
              Als App installieren
            </button>
          ) : (
            <p className="hand kuli">Am iPhone: unten auf „Teilen“ tippen, dann „Zum Home-Bildschirm“.</p>
          )}
        </m.section>
      )}
    </AnimatePresence>
  )
}

/** Kleiner Stempel, wenn die Verbindung weg ist. */
export function OfflineHinweis() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    const aktualisieren = () => setOffline(!navigator.onLine)
    aktualisieren()
    window.addEventListener('online', aktualisieren)
    window.addEventListener('offline', aktualisieren)
    return () => { window.removeEventListener('online', aktualisieren); window.removeEventListener('offline', aktualisieren) }
  }, [])
  return (
    <AnimatePresence>
      {offline && (
        <m.div className="offline" role="status" initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: -40 }}>
          Offline – ausfüllen geht trotzdem, abgeben sobald du wieder Netz hast.
        </m.div>
      )}
    </AnimatePresence>
  )
}
