import { Navigate, useNavigate } from 'react-router-dom'
import { countryById } from '../data/countries'
import { useCareer } from '../store/careerStore'
import type { Skills } from '../engine/types'

const LABELS: Record<keyof Skills, string> = {
  tempo: 'Tempo', schuss: 'Schuss', pass: 'Pass', dribbling: 'Dribbling',
  defensive: 'Defensive', physis: 'Physis', technik: 'Technik', positionsspiel: 'Positionsspiel',
}

export default function Game() {
  const navigate = useNavigate()
  const career = useCareer((s) => s.career)
  const close = useCareer((s) => s.close)
  if (!career) return <Navigate to="/" replace />

  const { spieler: p, uhr } = career
  const land = countryById(p.nationalitaet)

  return (
    <main className="screen">
      <h1>{p.vorname} {p.nachname}</h1>
      <p className="muted">
        {land?.flagge} {p.position} · 16 Jahre · Saison {uhr.saison}/{String(uhr.saison + 1).slice(2)}, Woche {uhr.woche}
      </p>

      <section className="card">
        <h2>Attribute</h2>
        {(Object.keys(LABELS) as (keyof Skills)[]).map((k) => (
          <div key={k} className="stat">
            <span>{LABELS[k]}</span>
            <div className="bar"><div style={{ width: `${p.skills[k]}%` }} /></div>
            <span className="num">{p.skills[k]}</span>
          </div>
        ))}
      </section>

      <p className="muted">Die Wochenschleife (Training, Spiel, Ereignisse) folgt in Meilenstein 2.</p>
      <button className="btn" onClick={() => { close(); navigate('/') }}>Zum Hauptmenü</button>
    </main>
  )
}
