export interface Theme {
  id: string
  name: string
  /** Farbe des Vorschau-Punkts. */
  farbe: string
}

export const THEMES: readonly Theme[] = [
  { id: 'gruen', name: 'Grün', farbe: '#3ddc84' },
  { id: 'blau', name: 'Blau', farbe: '#4aa8ff' },
  { id: 'orange', name: 'Orange', farbe: '#ff9f43' },
  { id: 'violett', name: 'Violett', farbe: '#b388ff' },
  { id: 'grau', name: 'Grau', farbe: '#e3e6ea' },
  { id: 'hell', name: 'Hell', farbe: '#1f9d55' },
]

const KEY = 'karriere:theme'

export function gespeichertesTheme(): string {
  try {
    const id = window.localStorage.getItem(KEY)
    return THEMES.some((t) => t.id === id) ? (id as string) : 'gruen'
  } catch {
    return 'gruen'
  }
}

/** Setzt das Theme am Dokument, passt die Browser-Leistenfarbe an und merkt es sich. */
export function wendeThemeAn(id: string, speichern = true): void {
  document.documentElement.dataset.theme = id
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  if (!speichern) return
  try {
    window.localStorage.setItem(KEY, id)
  } catch {
    // Speicher nicht verfügbar: Theme gilt nur für diese Sitzung.
  }
}
