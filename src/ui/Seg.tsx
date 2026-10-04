/** Segmentierte Umschaltung für Unterbereiche eines Tabs. */
export function Seg<T extends string>({ wert, optionen, onChange }: { wert: T; optionen: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {optionen.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={wert === id} className={wert === id ? 'on' : ''} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  )
}
