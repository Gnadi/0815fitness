import { Navigate, useNavigate } from 'react-router-dom'
import { useCareer } from '../store/careerStore'
import { CareerEnd } from './game/CareerEnd'
import { Header } from './game/Header'
import { Plan } from './game/Plan'
import { Report } from './game/Report'
import { Scene } from './game/Scene'
import { SeasonEnd } from './game/SeasonEnd'

export default function Game() {
  const navigate = useNavigate()
  const c = useCareer((s) => s.career)
  const close = useCareer((s) => s.close)
  if (!c) return <Navigate to="/" replace />

  return (
    <main className="screen">
      <Header c={c} />
      {c.phase === 'planung' && <Plan c={c} />}
      {c.phase === 'szene' && c.match && <Scene c={c} />}
      {c.phase === 'bericht' && c.bericht && <Report c={c} />}
      {c.phase === 'saisonende' && c.saisonBericht && <SeasonEnd c={c} />}
      {c.phase === 'karriereende' && <CareerEnd c={c} />}
      {c.phase !== 'karriereende' && (
        <button className="btn link" onClick={() => { close(); navigate('/') }}>Hauptmenü (Stand ist gespeichert)</button>
      )}
    </main>
  )
}
