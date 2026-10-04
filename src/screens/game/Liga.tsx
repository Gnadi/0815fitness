import { useState } from 'react'
import { Seg } from '../../ui/Seg'
import { NationalTeam } from './NationalTeam'
import { LAENDER, LIGEN, VEREINE } from '../../data/clubs'
import { EUROPA_NAMEN } from '../../engine/kalender'
import type { Career } from '../../engine/types'
import { TabellenKarte } from './Tabelle'

const EUROPA_STATUS: Record<string, string> = {
  liga: 'Ligaphase', playoff: 'Playoff', achtel: 'Achtelfinale', viertel: 'Viertelfinale',
  halb: 'Halbfinale', finale: 'Finale', aus: 'ausgeschieden', sieger: 'Sieger',
}
const TURNIER_STATUS: Record<string, string> = {
  gruppe: 'Gruppenphase', achtel: 'Achtelfinale', viertel: 'Viertelfinale', halb: 'Halbfinale', finale: 'Finale', aus: 'ausgeschieden', sieger: 'Sieger',
}

export function LigaTab({ c }: { c: Career }) {
  const [bereich, setBereich] = useState<'liga' | 'national'>('liga')
  return (
    <>
      <Seg wert={bereich} onChange={setBereich} optionen={[['liga', 'Liga & Pokale'], ['national', 'Nationalteam']]} />
      {bereich === 'liga' ? <LigaInhalt c={c} /> : <NationalTeam c={c} />}
    </>
  )
}

function LigaInhalt({ c }: { c: Career }) {
  const s = c.saison
  const liga = LIGEN[s.ligaId]

  // Nächste Spiele des eigenen Vereins
  const idx = s.teams.indexOf(c.vereinId)
  const aktuellerTag = s.kalender.slice(0, c.uhr.woche - 1).filter((x) => x.t === 'L').length
  const naechste: { tag: number; heim: boolean; gegner: string }[] = []
  for (let t = aktuellerTag + 1; t <= s.spielplan.length && naechste.length < 4; t++) {
    const sp = s.spielplan[t - 1].find(([h, a]) => h === idx || a === idx)
    if (sp) naechste.push({ tag: t, heim: sp[0] === idx, gegner: VEREINE[s.teams[sp[0] === idx ? sp[1] : sp[0]]].name })
  }

  return (
    <>
      <TabellenKarte c={c} />

      <section className="card">
        <h2>Nächste Spiele</h2>
        {naechste.length === 0 ? <p className="muted">Keine Ligaspiele mehr in dieser Saison.</p> : (
          <ul className="plain">
            {naechste.map((n) => <li key={n.tag}><span className="muted">Spieltag {n.tag}:</span> {n.heim ? 'Heim' : 'Auswärts'} gegen {n.gegner}</li>)}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Wettbewerbe</h2>
        <ul className="plain">
          {!s.jugend && <li><span className="muted">{LAENDER[liga.land].pokal}:</span> {s.pokal.status === 'aktiv' ? `Runde ${s.pokal.runde}/${s.pokal.runden}` : s.pokal.status === 'sieger' ? 'Sieger!' : 'ausgeschieden'}</li>}
          {s.europa.wb && <li><span className="muted">{EUROPA_NAMEN[s.europa.wb]}:</span> {EUROPA_STATUS[s.europa.status]}{s.europa.status === 'liga' ? ` (${s.europa.punkte} Punkte nach ${s.europa.spiele}/8)` : ''}</li>}
          {s.turnier && <li><span className="muted">{s.turnier.name}:</span> {TURNIER_STATUS[s.turnier.status]}</li>}
          {s.jugend && <li className="muted">Als Jugendspieler gibt es noch keine Pokale.</li>}
        </ul>
      </section>
    </>
  )
}
