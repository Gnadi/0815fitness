import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useCareer } from '../store/careerStore'
import { CareerEnd } from './game/CareerEnd'
import { EreignisAnsicht } from './game/Ereignis'
import { Header } from './game/Header'
import { FinanzenTab } from './game/Finanzen'
import { KarriereTab } from './game/Karriere'
import { LigaTab } from './game/Liga'
import { PrivatTab } from './game/Privat'
import { Report } from './game/Report'
import { Scene } from './game/Scene'
import { SeasonEnd } from './game/SeasonEnd'
import { SpielerTab } from './game/Spieler'
import { VertragTab } from './game/Vertrag'
import { Woche } from './game/Woche'

type Tab = 'woche' | 'spieler' | 'liga' | 'vertrag' | 'finanzen' | 'privat' | 'karriere'
const TABS: [Tab, string, string][] = [
  ['woche', '⚽', 'Woche'], ['spieler', '👤', 'Spieler'], ['liga', '📊', 'Liga'], ['vertrag', '📝', 'Vertrag'], ['finanzen', '💰', 'Finanzen'], ['privat', '🏡', 'Privat'], ['karriere', '🏆', 'Karriere'],
]

export default function Game() {
  const navigate = useNavigate()
  const c = useCareer((s) => s.career)
  const meldung = useCareer((s) => s.meldung)
  const setzeMeldung = useCareer((s) => s.setzeMeldung)
  const close = useCareer((s) => s.close)
  const [tab, setTab] = useState<Tab>('woche')
  if (!c) return <Navigate to="/" replace />

  const planung = c.phase === 'planung'
  const tabs = planung

  return (
    <main className={`screen${tabs ? ' with-tabs' : ''}`}>
      <Header c={c} />
      {meldung && (
        <button className="toast" onClick={() => setzeMeldung(null)}>{meldung} <span aria-hidden>✕</span></button>
      )}

      {planung && tab === 'woche' && <Woche c={c} zuVertrag={() => setTab('vertrag')} />}
      {planung && tab === 'spieler' && <SpielerTab c={c} />}
      {planung && tab === 'liga' && <LigaTab c={c} />}
      {planung && tab === 'vertrag' && <VertragTab c={c} />}
      {planung && tab === 'finanzen' && <FinanzenTab c={c} />}
      {planung && tab === 'privat' && <PrivatTab c={c} />}
      {planung && tab === 'karriere' && <KarriereTab c={c} />}

      {c.phase === 'szene' && c.match && <Scene c={c} />}
      {c.phase === 'bericht' && c.bericht && <Report c={c} />}
      {c.phase === 'ereignis' && c.ereignis && <EreignisAnsicht c={c} />}
      {c.phase === 'saisonende' && c.saisonBericht && <SeasonEnd c={c} />}
      {c.phase === 'karriereende' && <CareerEnd c={c} />}

      {c.phase !== 'karriereende' && (
        <button className="btn link" onClick={() => { close(); navigate('/') }}>Hauptmenü (Stand ist gespeichert)</button>
      )}

      {planung && (
        <nav className="tabbar" aria-label="Bereiche">
          {TABS.map(([id, icon, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
              <span aria-hidden>{icon}</span>
              <span>{label}{id === 'vertrag' && c.fenster && c.angebote.length > 0 ? ' •' : ''}</span>
            </button>
          ))}
        </nav>
      )}
    </main>
  )
}
