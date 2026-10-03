export const saisonLabel = (saison: number) => `${saison}/${String(saison + 1).slice(2)}`

export const fmtEuro = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/** Kompakte Darstellung großer Beträge (1,2 Mio. €). */
export function fmtGeld(n: number): string {
  const a = Math.abs(n)
  const v = a >= 1e9 ? `${(a / 1e9).toFixed(2)} Mrd. €` : a >= 1e6 ? `${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace('.', ',')} Mio. €` : a >= 1e4 ? `${Math.round(a / 1000)}.000 €` : fmtEuro(a)
  return n < 0 ? `−${v}` : v
}

export const fmtNote = (n: number) => n.toFixed(1).replace('.', ',')

export const fmtDelta = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1).replace('.', ',')}`

/** Kontostand: bis 1 Mio. € auf den Euro genau, darüber kompakt. */
export const fmtKonto = (n: number): string => (Math.abs(n) < 1_000_000 ? fmtEuro(n) : fmtGeld(n))
