import { useSyncExternalStore } from 'react'

/** Das (nicht standardisierte) Chromium-Ereignis, mit dem sich der Installationsdialog selbst auslösen lässt. */
interface InstallEreignis extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallStatus = 'installiert' | 'bereit' | 'ios' | 'nicht-verfuegbar'

let ereignis: InstallEreignis | null = null
let installiert = false
const hoerer = new Set<() => void>()
const melden = () => hoerer.forEach((h) => h())

/** Läuft die App bereits als installierte App (eigenes Fenster / Home-Bildschirm)? */
export const laeuftAlsApp = (): boolean => {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}

/** iPhone/iPad (inkl. iPadOS, das sich als Mac ausgibt): dort gibt es keinen Installationsdialog, nur „Zum Home-Bildschirm“. */
export const istIos = (ua: string, touchPunkte: number): boolean => /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && touchPunkte > 1)

export const installStatus = (): InstallStatus => {
  if (installiert || laeuftAlsApp()) return 'installiert'
  if (ereignis) return 'bereit'
  if (typeof navigator !== 'undefined' && istIos(navigator.userAgent, navigator.maxTouchPoints ?? 0)) return 'ios'
  return 'nicht-verfuegbar'
}

/** Muss früh (in main.tsx) aufgerufen werden, weil der Browser das Ereignis oft vor dem ersten Rendern feuert. */
export function initPwaInstall(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    ereignis = e as InstallEreignis
    melden()
  })
  window.addEventListener('appinstalled', () => {
    installiert = true
    ereignis = null
    melden()
  })
}

/** Öffnet den Installationsdialog des Browsers; true, wenn der Nutzer zugestimmt hat. */
export async function installieren(): Promise<boolean> {
  const e = ereignis
  if (!e) return false
  await e.prompt()
  const { outcome } = await e.userChoice
  ereignis = null // jedes Ereignis lässt sich nur einmal verwenden
  if (outcome === 'accepted') installiert = true
  melden()
  return outcome === 'accepted'
}

const abonnieren = (cb: () => void) => {
  hoerer.add(cb)
  return () => void hoerer.delete(cb)
}

export const useInstallStatus = (): InstallStatus => useSyncExternalStore(abonnieren, installStatus, () => 'nicht-verfuegbar')
