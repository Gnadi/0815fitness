export function Mengenwahl({ name, menge, setze }: { name: string; menge: number; setze: (m: number, el?: HTMLElement) => void }) {
  return (
    <div className="menge" role="group" aria-label={`Menge ${name}`}>
      <button type="button" onClick={() => setze(menge - 1)} aria-label={`${name} weniger`}>−</button>
      <span key={menge} aria-live="polite">{menge}</span>
      <button type="button" onClick={(e) => setze(Math.min(menge + 1, 30), e.currentTarget)} aria-label={`${name} mehr`}>+</button>
    </div>
  )
}
