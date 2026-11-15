export interface Zeitpunkt { id: string; label: string; zeit: (basis: Date) => Date | null }

function wochentag(basis: Date, tag: number, h: number, m = 0): Date {
  // nächster bzw. aktueller Wochentag (0 = So) in derselben Bestellwoche
  const d = new Date(basis)
  d.setHours(h, m, 0, 0)
  const diff = (tag - d.getDay() + 7) % 7
  d.setDate(d.getDate() + diff)
  return d
}

export const ZEITPUNKTE: Zeitpunkt[] = [
  { id: 'jetzt', label: 'Jetzt', zeit: () => null },
  { id: 'mi', label: 'Mi 18:00', zeit: (b) => wochentag(b, 3, 18) },
  { id: 'fr', label: 'Fr 21:00', zeit: (b) => wochentag(b, 5, 21) },
  { id: 'ofen', label: 'So 5:30', zeit: (b) => wochentag(wochentag(b, 5, 21), 0, 5, 30) },
  { id: 'rad', label: 'So 8:15', zeit: (b) => wochentag(wochentag(b, 5, 21), 0, 8, 15) },
  { id: 'danke', label: 'So 11:00', zeit: (b) => wochentag(wochentag(b, 5, 21), 0, 11) },
]

/** Nur fürs Mockup: die Seite zu verschiedenen Zeiten der Woche ansehen. */
export function Zeitmaschine({ aktiv, waehle }: { aktiv: string; waehle: (id: string) => void }) {
  return (
    <div className="zeitmaschine" role="group" aria-label="Mockup: Wochenzeit ansehen">
      <span className="zeitmaschine-label">Mockup · Woche ansehen:</span>
      {ZEITPUNKTE.map((z) => (
        <button key={z.id} className={aktiv === z.id ? 'aktiv' : ''} onClick={() => waehle(z.id)}>{z.label}</button>
      ))}
    </div>
  )
}
