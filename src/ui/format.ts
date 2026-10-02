export const saisonLabel = (saison: number) => `${saison}/${String(saison + 1).slice(2)}`

export const fmtEuro = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export const fmtNote = (n: number) => n.toFixed(1).replace('.', ',')

export const fmtDelta = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1).replace('.', ',')}`
