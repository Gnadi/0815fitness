import { countryById } from '../../data/countries'
import { alter, overall } from '../../engine/rating'
import { gruppenPlatz, istNationalspieler, kaderRang, naechstesTurnier, natRolle, natStaerke, natVon, nationName, turnierErgebnis, turnierNaechster } from '../../engine/nationalteam'
import { rangliste } from '../../engine/welt'
import type { Career, NatSpiel, Turnier } from '../../engine/types'
import { Meter } from './Header'

const STATUS: Record<string, string> = {
  gruppe: 'Gruppenphase', achtel: 'Achtelfinale', viertel: 'Viertelfinale', halb: 'Halbfinale', finale: 'Finale', aus: 'ausgeschieden', sieger: 'Turniersieger',
}
const EINSATZ = { startelf: 'Startelf', einwechslung: 'eingewechselt', 'nicht-eingesetzt': 'Bank' } as const
const komma = (n: number) => n.toFixed(1).replace('.', ',')

function Spiel({ s }: { s: NatSpiel }) {
  const art = s.tore > s.gegentore ? 'pos' : s.tore < s.gegentore ? 'neg' : ''
  return (
    <li>
      <span className="muted">{s.label}:</span> {s.gegner} <strong className={art}>{s.tore}:{s.gegentore}</strong>
      <span className="muted"> · {EINSATZ[s.einsatz]}{s.note !== null ? `, Note ${komma(s.note)}` : ''}{s.spielerTore ? `, ${s.spielerTore} Tor${s.spielerTore > 1 ? 'e' : ''}` : ''}</span>
    </li>
  )
}

function TurnierKarte({ c, t }: { c: Career; t: Turnier }) {
  const g = t.gruppe
  const rang = g ? rangliste(g.tabelle, g.teams.map((x) => x.id)) : []
  const name = (id: string) => g?.teams.find((x) => x.id === id)?.name ?? nationName(id)
  const naechster = turnierNaechster(c)
  const eigen = g ? gruppenPlatz(g) : null
  return (
    <section className="card">
      <div className="row">
        <h2 className="grow">🏆 {t.name}</h2>
        <span className={`risk ${t.status === 'sieger' ? 'sicher' : t.status === 'aus' ? 'riskant' : 'mittel'}`}>{STATUS[t.status]}</span>
      </div>
      {t.quali && <p className="muted small">{t.quali}. Dein Platz im Kader: {t.kader}.</p>}
      {naechster && <p><strong>Nächstes Spiel:</strong> {naechster.runde}{naechster.gegner !== 'noch offen' ? ` gegen ${naechster.gegner}` : ''}</p>}
      {t.status === 'aus' && <p className="neg">{turnierErgebnis(t)}</p>}
      {t.status === 'sieger' && <p className="pos">Ihr seid {t.name.startsWith('WM') ? 'Weltmeister' : 'Europameister'}!</p>}

      {g && (
        <>
          <h3 className="section">Gruppe</h3>
          <div className="table-scroll">
            <table className="tabelle">
              <thead><tr><th>#</th><th>Nation</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Pkt</th></tr></thead>
              <tbody>
                {rang.map((r, i) => (
                  <tr key={r.id} className={`${r.id === g.teams[0].id ? 'me' : ''} ${i < 2 ? 'europa' : ''}`}>
                    <td>{i + 1}</td><td>{name(r.id)}</td>
                    <td>{r.zeile[0]}</td><td>{r.zeile[1]}</td><td>{r.zeile[2]}</td><td>{r.zeile[3]}</td>
                    <td>{r.zeile[4]}:{r.zeile[5]}</td><td><strong>{r.pkt}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Die ersten beiden kommen weiter, der Dritte mit mindestens vier Punkten.{eigen && t.status === 'gruppe' && t.spiele > 0 ? ` Aktuell: Platz ${eigen.platz}.` : ''}</p>
          {g.ergebnisse.length > 0 && (
            <ul className="plain">
              {g.ergebnisse.map((e, i) => (
                <li key={i} className={e.heim === g.teams[0].id || e.aus === g.teams[0].id ? '' : 'muted'}>
                  <span className="muted">Spieltag {e.tag}:</span> {name(e.heim)} <strong>{e.th}:{e.ta}</strong> {name(e.aus)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {(t.verlauf?.length ?? 0) > 0 && (
        <>
          <h3 className="section">K.-o.-Runde</h3>
          <ul className="plain">
            {t.verlauf!.map((v, i) => (
              <li key={i}>
                <span className="muted">{v.runde}:</span> {v.gegner}{' '}
                <strong className={v.tore > v.gegentore || v.elfmeter === 'gewonnen' ? 'pos' : 'neg'}>{v.tore}:{v.gegentore}</strong>
                {v.elfmeter && <span className="muted"> (Elfmeterschießen {v.elfmeter})</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="grid2">
        <div><span className="muted">Deine Einsätze</span><strong>{t.einsaetze ?? 0} von {t.spiele + (t.verlauf?.length ?? 0)}</strong></div>
        <div><span className="muted">Deine Tore / Vorlagen</span><strong>{t.tore ?? 0} / {t.vorlagen ?? 0}</strong></div>
      </div>
    </section>
  )
}

export function NationalTeam({ c }: { c: Career }) {
  const land = countryById(c.spieler.nationalitaet)
  const nat = istNationalspieler(c)
  const nt = natVon(c)
  const ov = overall(c.spieler)
  const staerke = natStaerke(c)
  const naechstes = naechstesTurnier(c)
  const s = c.saison
  const schnitt = nt.notenAnzahl ? nt.notenSumme / nt.notenAnzahl : null
  const rolle = natRolle(c)

  if (!nat) {
    const alterOk = alter(c.spieler.geburtsdatum, c.uhr.saison) >= 18
    const ziel = staerke - 14
    return (
      <>
        <section className="card">
          <h2>{land?.flagge} Nationalmannschaft {land?.name}</h2>
          <p className="muted">Du bist noch kein Nationalspieler. Der Nationaltrainer beobachtet Spieler, die stark genug sind und im Verein überzeugen.</p>
          <ul className="plain">
            <li>{alterOk ? '✅' : '⬜'} <span className="muted">Mindestens 18 Jahre alt</span></li>
            <li>{ov >= ziel ? '✅' : '⬜'} <span className="muted">Stärke:</span> {komma(ov)} (benötigt ca. {Math.round(ziel)})</li>
            <li>{c.spieler.traits.ruf > 20 ? '✅' : '⬜'} <span className="muted">Ruf über 20:</span> {Math.round(c.spieler.traits.ruf)}</li>
            <li>{!s.jugend && c.vereinId ? '✅' : '⬜'} <span className="muted">Profi bei einem Verein</span></li>
          </ul>
          <p className="muted small">Die Einladung kommt als Ereignis, sobald alles erfüllt ist. Stärke des Teams: {staerke}.</p>
        </section>
        {naechstes && <p className="muted small">Nächstes Turnier: {naechstes.name}{naechstes.in === 0 ? ' (diese Saison)' : ` (in ${naechstes.in} Jahr${naechstes.in > 1 ? 'en' : ''})`}.</p>}
      </>
    )
  }

  return (
    <>
      <section className="card">
        <h2>{land?.flagge} Nationalmannschaft {land?.name}</h2>
        <div className="grid2">
          <div><span className="muted">Nationaltrainer</span><strong>{nt.trainer}</strong></div>
          <div><span className="muted">Teamstärke</span><strong>{staerke} (du: {komma(ov)})</strong></div>
          <div><span className="muted">Deine Rolle</span><strong>{rolle}{nt.kapitaen ? ' · Kapitän ©' : ''}</strong></div>
          <div><span className="muted">Rang im Kader</span><strong>ca. {kaderRang(c)} von 23</strong></div>
        </div>
        <Meter label="Vertrauen" value={nt.vertrauen} />
        <p className="muted small">Das Vertrauen des Trainers entscheidet über Einsatzzeit und die Nominierung zum Turnier. Es wächst mit Leistung im Verein und in der Nationalmannschaft.</p>
        <div className="grid2">
          <div><span className="muted">Länderspiele</span><strong>{c.laufbahn.laenderspiele}</strong></div>
          <div><span className="muted">Länderspieltore</span><strong>{c.laufbahn.laenderspielTore}</strong></div>
          <div><span className="muted">Minuten (protokolliert)</span><strong>{nt.minuten}</strong></div>
          <div><span className="muted">Ø Note</span><strong>{schnitt !== null ? komma(schnitt) : '–'}</strong></div>
        </div>
      </section>

      {s.turnier ? <TurnierKarte c={c} t={s.turnier} /> : (
        <section className="card">
          <h2>Turnier</h2>
          {s.turnierInfo ? <p>{s.turnierInfo.text}</p> : naechstes ? (
            <p className="muted">Nächstes Turnier: {naechstes.name}{naechstes.in === 0 ? ' (diese Saison)' : ` (in ${naechstes.in} Jahr${naechstes.in > 1 ? 'en' : ''})`}. Qualifikation und Nominierung werden zu Saisonbeginn entschieden.</p>
          ) : <p className="muted">Kein Turnier in Sicht.</p>}
        </section>
      )}

      {nt.spiele.length > 0 && (
        <section className="card">
          <h2>Letzte Länderspiele</h2>
          <ul className="plain">{[...nt.spiele].reverse().slice(0, 8).map((x, i) => <Spiel key={i} s={x} />)}</ul>
        </section>
      )}

      {nt.turniere.length > 0 && (
        <section className="card">
          <h2>Turnier-Historie</h2>
          <ul className="plain">
            {[...nt.turniere].reverse().map((x, i) => (
              <li key={i}><strong>{x.name}:</strong> {x.ergebnis}{x.einsaetze ? <span className="muted"> · {x.einsaetze} Einsätze, {x.tore} Tore</span> : null}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
