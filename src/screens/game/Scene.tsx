import { SCENE_BY_ID } from '../../data/scenes'
import type { Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'

const RISIKO = { sicher: 'Sicher', mittel: 'Mittel', riskant: 'Riskant' } as const

export function Scene({ c }: { c: Career }) {
  const waehle = useCareer((s) => s.waehle)
  const weiter = useCareer((s) => s.weiterImSpiel)
  const m = c.match!
  const scene = SCENE_BY_ID[m.szenen[m.index]]
  const letzte = m.frueherEnde || m.index + 1 >= m.szenen.length

  return (
    <>
      <section className="card match">
        <p className="muted">
          {m.heim ? 'Heimspiel' : 'Auswärtsspiel'} gegen {m.gegner} · {m.einsatz === 'startelf' ? 'Startelf' : 'Eingewechselt'}
        </p>
        <p className="muted">Szene {m.index + 1} von {m.szenen.length}</p>
        <h2>{scene.titel}</h2>
        <p>{scene.text.replaceAll('{gegner}', m.gegner)}</p>
      </section>

      {m.ausgang === null ? (
        <div className="options">
          {scene.optionen.map((o, i) => (
            <button key={o.label} className="btn option" onClick={() => waehle(i)}>
              <span>{o.label}</span>
              <span className={`risk ${o.risiko}`}>{RISIKO[o.risiko]}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <section className="card outcome">
            <p>{m.ausgang}</p>
          </section>
          <button className="btn primary" onClick={weiter}>{letzte ? 'Abpfiff' : 'Weiter'}</button>
        </>
      )}
    </>
  )
}
