import { useEffect, useState } from 'react'
import { bestellschluss, datumLang, lieferSonntag } from '../lib/logik'

export function useJetzt(intervallMs = 1000) {
  const [jetzt, setJetzt] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setJetzt(new Date()), intervallMs)
    return () => clearInterval(t)
  }, [intervallMs])
  return jetzt
}

function Ziffer({ wert, label }: { wert: number; label: string }) {
  const text = String(wert).padStart(2, '0')
  return (
    <div className="ziffer">
      <span key={text} className="ziffer-wert">{text}</span>
      <small>{label}</small>
    </div>
  )
}

export function Countdown({ jetzt }: { jetzt: Date }) {
  const sonntag = lieferSonntag(jetzt)
  const schluss = bestellschluss(sonntag)
  const ms = Math.max(0, schluss.getTime() - jetzt.getTime())
  const s = Math.floor(ms / 1000)
  return (
    <div className="countdown">
      <div className="countdown-kopf">
        <span className="puls" aria-hidden />
        Nächste Lieferung: <strong>{datumLang(sonntag)}</strong>
      </div>
      <div className="ziffern" aria-label="Zeit bis Bestellschluss">
        <Ziffer wert={Math.floor(s / 86400)} label="Tage" />
        <Ziffer wert={Math.floor((s % 86400) / 3600)} label="Std" />
        <Ziffer wert={Math.floor((s % 3600) / 60)} label="Min" />
        <Ziffer wert={s % 60} label="Sek" />
      </div>
      <p className="countdown-fuss">bis Bestellschluss · Fr., {schluss.toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' })} um 20:00</p>
    </div>
  )
}
