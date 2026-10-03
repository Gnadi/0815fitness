import { vereinsfarben } from '../data/vereinsfarben'
import { vereinsPalette } from './farben'

export interface Theme {
  id: string
  name: string
  /** CSS-Hintergrund des Vorschau-Punkts. */
  farbe: string
  /** Kurzbeschreibung unter der Auswahl. */
  info?: string
}

export const VEREIN_THEME = 'verein'

export const THEMES: readonly Theme[] = [
  { id: VEREIN_THEME, name: 'Vereinsfarben', farbe: 'conic-gradient(#e2001a 0 33%, #ffffff 0 66%, #005ca9 0)', info: 'Passt sich automatisch an deinen aktuellen Verein an und wechselt bei Transfers mit.' },
  { id: 'gruen', name: 'Grün', farbe: '#3ddc84' },
  { id: 'blau', name: 'Blau', farbe: '#4aa8ff' },
  { id: 'orange', name: 'Orange', farbe: '#ff9f43' },
  { id: 'violett', name: 'Violett', farbe: '#b388ff' },
  { id: 'grau', name: 'Grau', farbe: '#e3e6ea' },
  { id: 'schwarzweiss', name: 'Schwarz-Weiß', farbe: '#ffffff' },
  { id: 'hell', name: 'Hell', farbe: '#1f9d55' },
]

const KEY = 'karriere:theme'
const OVERRIDES = ['--bg', '--card', '--line', '--text', '--muted', '--accent', '--on-accent', '--nav', '--toast'] as const

export function gespeichertesTheme(): string {
  try {
    const id = window.localStorage.getItem(KEY)
    return THEMES.some((t) => t.id === id) ? (id as string) : 'gruen'
  } catch {
    return 'gruen'
  }
}

interface Optionen {
  /** Aktueller Verein (für das Vereinsfarben-Theme). */
  vereinId?: string
  /** Auswahl dauerhaft merken. */
  speichern?: boolean
}

/** Setzt das Theme am Dokument, passt die Browser-Leistenfarbe an und merkt es sich. */
export function wendeThemeAn(id: string, { vereinId, speichern = true }: Optionen = {}): void {
  const root = document.documentElement
  root.dataset.theme = id
  for (const k of OVERRIDES) root.style.removeProperty(k)
  if (id === VEREIN_THEME && vereinId) {
    const [primaer, sekundaer] = vereinsfarben(vereinId)
    for (const [k, v] of Object.entries(vereinsPalette(primaer, sekundaer))) root.style.setProperty(k, v)
  }
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  if (!speichern) return
  try {
    window.localStorage.setItem(KEY, id)
  } catch {
    // Speicher nicht verfügbar: Theme gilt nur für diese Sitzung.
  }
}
