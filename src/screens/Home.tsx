import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saves } from '../storage'
import { useCareer } from '../store/careerStore'
import { saisonLabel } from '../ui/format'

export default function Home() {
  const navigate = useNavigate()
  const open = useCareer((s) => s.open)
  const [list, setList] = useState(() => saves.list())
  const [fehler, setFehler] = useState<string | null>(null)
  const datei = useRef<HTMLInputElement>(null)

  const exportieren = (id: string, name: string) => {
    const json = saves.exportJson(id)
    if (!json) return
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `karriere-${name.replaceAll(' ', '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importieren = async (file: File | undefined) => {
    if (!file) return
    try {
      saves.importJson(await file.text())
      setList(saves.list())
      setFehler(null)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Import fehlgeschlagen.')
    }
  }

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
              disabled={!s.kompatibel}
              onClick={() => open(s.id) && navigate('/spiel')}
            >
              <strong>{s.name}</strong>
              <span className="muted"> · Saison {saisonLabel(s.saison)}{!s.kompatibel && ' · veraltetes Format'}</span>
            </button>
            {s.kompatibel && <button className="btn small" aria-label={`${s.name} exportieren`} onClick={() => exportieren(s.id, s.name)}>⬇</button>}
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

      <input ref={datei} type="file" accept="application/json" hidden onChange={(e) => importieren(e.target.files?.[0])} />
      <button className="btn" onClick={() => datei.current?.click()}>Spielstand importieren</button>
      {fehler && <p className="alert">{fehler}</p>}
      <p className="muted small">Alle Daten liegen nur in diesem Browser. Mit ⬇ sicherst du einen Spielstand als Datei.</p>
    </main>
  )
}
