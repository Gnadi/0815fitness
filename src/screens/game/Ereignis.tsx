import { EREIGNIS_BY_ID } from '../../data/events'
import { fuelleText, kostenVon, optionVerfuegbar } from '../../engine/ereignisse'
import type { Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtGeld } from '../../ui/format'

export function EreignisAnsicht({ c }: { c: Career }) {
  const waehle = useCareer((s) => s.ereignisOption)
  const weiter = useCareer((s) => s.ereignisWeiter)
  const z = c.ereignis!
  const def = EREIGNIS_BY_ID[z.id]
  return (
    <>
      <section className="card event">
        <p className="kategorie">{def.kategorie}</p>
        <h2>{fuelleText(c, def.titel)}</h2>
        <p>{fuelleText(c, def.text)}</p>
      </section>

      {z.gewaehlt === null ? (
        <div className="options">
          {def.optionen.map((o, i) => {
            const ok = optionVerfuegbar(c, o)
            const kosten = kostenVon(c, o)
            return (
              <button key={i} className="btn option" disabled={!ok} onClick={() => waehle(i)}>
                <span>{fuelleText(c, o.label)}</span>
                <span className="hints">
                  {kosten > 0 && <span className="risk">{fmtGeld(kosten)}</span>}
                  {o.hinweis && !o.hinweis.startsWith('kostet') && <span className={`risk ${o.hinweis.includes('sehr') ? 'riskant' : o.hinweis.includes('riskant') ? 'mittel' : ''}`}>{o.hinweis}</span>}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <>
          <section className="card outcome">
            <p>{z.ausgang}</p>
            {z.wirkung.length > 0 && (
              <p className="chips">{z.wirkung.map((w, i) => <span key={i} className={`chip ${/[−]/.test(w) && !/Fitness|Reha/.test(w) ? 'neg' : 'pos'}`}>{w}</span>)}</p>
            )}
          </section>
          <button className="btn primary" onClick={weiter}>Weiter</button>
        </>
      )}
    </>
  )
}
