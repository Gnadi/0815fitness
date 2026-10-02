import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saves } from '../storage'
import { useCareer } from '../store/careerStore'

export default function Home() {
  const navigate = useNavigate()
  const open = useCareer((s) => s.open)
  const [list, setList] = useState(() => saves.list())

  return (
    <main className="screen">
      <h1>Karriere-Simulator</h1>
      <p className="muted">Vom 16-jährigen Talent zur Legende – oder zur Randnotiz.</p>

      <Link className="btn primary" to="/neu">Neue Karriere</Link>

      {list.length > 0 && <h2>Spielstände</h2>}
      <ul className="list">
        {list.map((s) => (
          <li key={s.id} className="card row">
            <button
              className="grow link"
              onClick={() => open(s.id) && navigate('/spiel')}
            >
              <strong>{s.name}</strong>
              <span className="muted"> · Saison {s.saison}/{String(s.saison + 1).slice(2)}</span>
            </button>
            <button
              className="btn small danger"
              aria-label={`${s.name} löschen`}
              onClick={() => {
                if (confirm(`Spielstand „${s.name}“ wirklich löschen?`)) {
                  saves.remove(s.id)
                  setList(saves.list())
                }
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
