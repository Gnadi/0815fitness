import { Navigate, useParams } from 'react-router-dom'
import { hof } from '../storage'
import { CareerEnd } from './game/CareerEnd'

/** Karriereende-Screen einer archivierten Karriere. */
export default function HofAnsicht() {
  const { id = '' } = useParams()
  const karriere = hof.get(id)?.karriere
  if (!karriere) return <Navigate to="/" replace />
  return (
    <main className="screen">
      <CareerEnd c={karriere} archiv />
    </main>
  )
}
