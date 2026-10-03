/** Farbhilfen für das Vereinsfarben-Theme. */

interface Rgb { r: number; g: number; b: number }
interface Hsl { h: number; s: number; l: number }

export function hexZuRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbZuHsl({ r, g, b }: Rgb): Hsl {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return { h: (h * 60 + 360) % 360, s, l }
}

export const hsl = (h: number, s: number, l: number): string => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`

/** Relative Helligkeit nach WCAG (0 = schwarz, 1 = weiß). */
export function leuchtdichte(hex: string): number {
  const { r, g, b } = hexZuRgb(hex)
  const f = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** Stabile Farbe aus einem Namen (für Vereine ohne hinterlegte Farben). */
export function farbeAusName(name: string): [string, string] {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619)
  const hue = (h >>> 0) % 360
  const toHex = (hh: number, s: number, l: number) => {
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
      const k = (n + hh / 30) % 12
      const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
      return Math.round(255 * c).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }
  return [toHex(hue, 0.65, 0.5), '#ffffff']
}

export type Palette = Record<'--bg' | '--card' | '--line' | '--text' | '--muted' | '--accent' | '--on-accent' | '--nav' | '--toast', string>

/**
 * Dunkles Theme in den Vereinsfarben: Akzent = lesbarste Vereinsfarbe, Hintergründe leicht in dieser Farbe getönt.
 * Sehr dunkle Hauptfarben (Schwarz, Dunkelblau) werden durch die Zweitfarbe oder eine aufgehellte Variante ersetzt.
 */
export function vereinsPalette(primaer: string, sekundaer: string): Palette {
  const kandidaten = [primaer, sekundaer]
  const lesbar = kandidaten.find((k) => leuchtdichte(k) >= 0.12)
  let akzent = lesbar ?? primaer
  if (!lesbar) {
    const z = rgbZuHsl(hexZuRgb(primaer))
    akzent = hsl(z.h, Math.max(z.s, 0.5), 0.6)
  }
  // Tönung bevorzugt aus der gesättigteren Vereinsfarbe
  const pHsl = rgbZuHsl(hexZuRgb(primaer))
  const sHsl = rgbZuHsl(hexZuRgb(sekundaer))
  const ton = pHsl.s >= 0.25 ? pHsl : sHsl.s >= 0.25 ? sHsl : { h: 0, s: 0, l: 0 }
  const s = ton.s === 0 ? 0 : Math.min(0.45, Math.max(0.2, ton.s * 0.5))
  const h = ton.h
  const akzentHex = akzent.startsWith('hsl') ? akzent : akzent
  const hell = akzent.startsWith('hsl') ? 0.6 : leuchtdichte(akzent)
  return {
    '--bg': hsl(h, s, 0.07),
    '--card': hsl(h, s, 0.12),
    '--line': hsl(h, s * 0.9, 0.22),
    '--text': hsl(h, s === 0 ? 0 : 0.15, 0.95),
    '--muted': hsl(h, s === 0 ? 0 : 0.14, 0.68),
    '--accent': akzentHex,
    '--on-accent': hell > 0.4 ? '#0a0a0a' : '#ffffff',
    '--nav': hsl(h, s, 0.09),
    '--toast': hsl(h, s, 0.17),
  }
}
