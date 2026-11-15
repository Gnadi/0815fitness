import { useEffect, useState } from 'react'
import { bestellschluss, datumLang, lieferSonntag, restzeit } from '../lib/logik'

export function useJetzt(intervallMs = 30_000) {
  const [jetzt, setJetzt] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setJetzt(new Date()), intervallMs)
    return () => clearInterval(t)
  }, [intervallMs])
  return jetzt
}

export function Countdown({ jetzt }: { jetzt: Date }) {
  const sonntag = lieferSonntag(jetzt)
  const schluss = bestellschluss(sonntag)
  return (
    <div className="countdown">
      <div>
        <span className="countdown-label">Nächste Lieferung</span>
        <strong>{datumLang(sonntag)}</strong>
      </div>
      <div>
        <span className="countdown-label">Bestellschluss in</span>
        <strong>{restzeit(jetzt, schluss)}</strong>
        <span className="countdown-sub">Fr., {schluss.toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' })} um 20:00</span>
      </div>
    </div>
  )
}
