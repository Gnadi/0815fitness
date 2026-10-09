import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hof, saves } from '../storage'
import { useCareer } from '../store/careerStore'
import { fmtGeld, saisonLabel } from '../ui/format'
import { InstallButton } from '../ui/InstallButton'
import { ThemeAuswahl } from '../ui/ThemeAuswahl'

export default function Home() {
  const navigate = useNavigate()
  const open = useCareer((s) => s.open)
  const [list, setList] = useState(() => saves.list())
  const [ruhmeshalle, setRuhmeshalle] = useState(() => hof.list())
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

      {ruhmeshalle.length > 0 && <h2>🏛️ Hall of Fame</h2>}
      <ul className="list">
        {ruhmeshalle.map((e, i) => (
          <li key={e.id} className="card row">
            <div className="grow">
              <strong>{i + 1}. {e.name}</strong> <span className="muted">· {e.klasse} · {e.punkte} Ruhm-Punkte</span>
              <div className="muted small">
                {saisonLabel(e.vonSaison)} – {saisonLabel(e.bisSaison)} · {e.spiele} Spiele, {e.tore} Tore, {e.vorlagen} Vorlagen · {e.titel} Titel &amp; Ehrungen · {e.laenderspiele} Länderspiele · max. Marktwert {fmtGeld(e.hoechsterMarktwert)}
              </div>
            </div>
            <button
              className="btn small danger"
              aria-label={`${e.name} aus der Hall of Fame entfernen`}
              onClick={() => {
                if (confirm(`„${e.name}“ aus der Hall of Fame entfernen?`)) {
                  hof.remove(e.id)
                  setRuhmeshalle(hof.list())
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
      <InstallButton />
      <ThemeAuswahl />
      <p className="muted small">Alle Daten liegen nur in diesem Browser. Mit ⬇ sicherst du einen Spielstand als Datei.</p>
    </main>
  )
}
