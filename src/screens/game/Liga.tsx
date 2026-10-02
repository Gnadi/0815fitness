import { LAENDER, LIGEN, VEREINE } from '../../data/clubs'
import { EUROPA_NAMEN } from '../../engine/kalender'
import type { Career } from '../../engine/types'
import { rangliste } from '../../engine/welt'

const EUROPA_STATUS: Record<string, string> = {
  liga: 'Ligaphase', playoff: 'Playoff', achtel: 'Achtelfinale', viertel: 'Viertelfinale',
  halb: 'Halbfinale', finale: 'Finale', aus: 'ausgeschieden', sieger: 'Sieger',
}
const TURNIER_STATUS: Record<string, string> = {
  gruppe: 'Gruppenphase', achtel: 'Achtelfinale', viertel: 'Viertelfinale', halb: 'Halbfinale', finale: 'Finale', aus: 'ausgeschieden', sieger: 'Sieger',
}

export function LigaTab({ c }: { c: Career }) {
  const s = c.saison
  const rang = rangliste(s.tabelle, s.teams)
  const liga = LIGEN[s.ligaId]
  const ab = liga.ab
  const eigen = rang.findIndex((r) => r.id === c.vereinId)
  const europa = LAENDER[liga.land].europa

  // Nächste Spiele des eigenen Vereins
  const idx = s.teams.indexOf(c.vereinId)
  const aktuellerTag = s.kalender.slice(0, c.uhr.woche - 1).filter((x) => x.t === 'L').length
  const naechste: { tag: number; heim: boolean; gegner: string }[] = []
  for (let t = aktuellerTag + 1; t <= s.spielplan.length && naechste.length < 4; t++) {
    const sp = s.spielplan[t - 1].find(([h, a]) => h === idx || a === idx)
    if (sp) naechste.push({ tag: t, heim: sp[0] === idx, gegner: VEREINE[s.teams[sp[0] === idx ? sp[1] : sp[0]]].name })
  }

  const zeigen = rang.length <= 20 ? rang : rang.filter((_, i) => i < 5 || i >= rang.length - 5 || Math.abs(i - eigen) <= 3)

  return (
    <>
      <section className="card">
        <h2>{s.jugend ? 'U19-Liga' : liga.name}</h2>
        <p className="muted">
          {s.jugend ? 'Jugendliga mit Vereinsmannschaften (ohne Auf- und Abstieg).' : `Platz ${eigen + 1} von ${rang.length}.`}
        </p>
        <div className="table-scroll">
          <table className="tabelle">
            <thead>
              <tr><th>#</th><th>Verein</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Pkt</th></tr>
            </thead>
            <tbody>
              {zeigen.map((r) => {
                const i = rang.indexOf(r)
                const zone = !s.jugend && liga.ebene === 1 && i < europa[0] + europa[1] + europa[2] ? 'europa'
                  : !s.jugend && ab > 0 && i >= rang.length - ab ? 'ab' : ''
                return (
                  <tr key={r.id} className={`${r.id === c.vereinId ? 'me' : ''} ${zone}`}>
                    <td>{i + 1}</td>
                    <td>{VEREINE[r.id].name}</td>
                    <td>{r.zeile[0]}</td><td>{r.zeile[1]}</td><td>{r.zeile[2]}</td><td>{r.zeile[3]}</td>
                    <td>{r.zeile[4]}:{r.zeile[5]}</td>
                    <td><strong>{r.pkt}</strong></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!s.jugend && <p className="muted small">Grün: Europapokal · Rot: Abstieg</p>}
      </section>

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
