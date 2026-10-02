import { useNavigate } from 'react-router-dom'
import type { Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { saisonLabel } from '../../ui/format'

export function CareerEnd({ c }: { c: Career }) {
  const navigate = useNavigate()
  const close = useCareer((s) => s.close)
  const alle = [...c.historie]
  const sum = (f: (s: (typeof alle)[number]) => number) => alle.reduce((a, s) => a + f(s), 0)
  const spiele = sum((s) => s.spiele)

  return (
    <>
      <section className="card">
        <h2>Die Karriere ist vorbei</h2>
        <p>
          {spiele} Spiele · {sum((s) => s.tore)} Tore · {sum((s) => s.vorlagen)} Vorlagen
        </p>
        <p className="muted">
          {alle.length} Saison{alle.length === 1 ? '' : 'en'}
          {alle.length > 0 && <> · {saisonLabel(alle[0].saison)} bis {saisonLabel(alle[alle.length - 1].saison)}</>}
        </p>
        <p className="muted">Eine ausführliche Karrierebilanz folgt in einem späteren Meilenstein.</p>
      </section>
      <button className="btn" onClick={() => { close(); navigate('/') }}>Zum Hauptmenü</button>
    </>
  )
}
