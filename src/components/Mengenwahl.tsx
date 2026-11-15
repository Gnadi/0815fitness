export function Mengenwahl({ name, menge, setze }: { name: string; menge: number; setze: (m: number) => void }) {
  return (
    <div className="menge" role="group" aria-label={`Menge ${name}`}>
      <button onClick={() => setze(menge - 1)} aria-label={`${name} weniger`}>−</button>
      <span aria-live="polite">{menge}</span>
      <button onClick={() => setze(Math.min(menge + 1, 30))} aria-label={`${name} mehr`}>+</button>
    </div>
  )
}
