import { LIGEN, VEREINE } from '../../data/clubs'
import { countryById } from '../../data/countries'
import type { Angebot, Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtGeld, saisonLabel } from '../../ui/format'
import { marktwert } from '../../engine/wirtschaft'
import { ligaVonVerein } from '../../engine/welt'

/** „🇩🇪 Bundesliga (1. Liga)“ für einen Verein. */
function ligaText(c: Career, vereinId: string): string {
  const v = VEREINE[vereinId]
  const liga = LIGEN[ligaVonVerein(c.welt, vereinId) ?? v.ligaStart]
  return `${countryById(v.land)?.flagge ?? ''} ${liga.name} (${liga.ebene}. Liga)`
}

const ART: Record<Angebot['art'], string> = {
  transfer: 'Transferangebot',
  leihe: 'Leihangebot',
  verlaengerung: 'Vertragsverlängerung',
  profivertrag: 'Profivertrag',
  vereinslos: 'Vertragsangebot',
}

function AngebotKarte({ a, c }: { a: Angebot; c: Career }) {
  const annehmen = useCareer((s) => s.annehmen)
  const ablehnen = useCareer((s) => s.ablehnen)
  const verhandeln = useCareer((s) => s.verhandeln)
  const v = VEREINE[a.vereinId]
  const staerke = Math.round(c.welt.staerke[a.vereinId])
  const kann = a.verhandelt < 2 && a.art !== 'leihe'
  return (
    <section className="card offer">
      <p className="muted small">{ART[a.art]}</p>
      <h3>{v.name}</h3>
      <p className="liga">{ligaText(c, a.vereinId)}</p>
      <p className="muted">Stärke {staerke} · {a.art === 'leihe' ? 'bis Saisonende' : `${a.jahre} Jahre`}</p>
      <div className="grid2">
        <div><span className="muted">Gehalt</span><strong>{fmtGeld(a.gehalt)} / Jahr</strong></div>
        <div><span className="muted">Rolle</span><strong>{a.rolle}</strong></div>
        {a.ablose > 0 && a.art !== 'leihe' && <div><span className="muted">Ablöse</span><strong>{fmtGeld(a.ablose)}</strong></div>}
      </div>
      <div className="row split">
        <button className="btn primary" onClick={() => annehmen(a.id)}>Annehmen</button>
        <button className="btn danger" onClick={() => ablehnen(a.id)}>Ablehnen</button>
      </div>
      {kann && (
        <div className="row split three">
          <button className="btn small-text" onClick={() => verhandeln(a.id, 'gehalt')}>Mehr Gehalt</button>
          <button className="btn small-text" onClick={() => verhandeln(a.id, 'rolle')}>Bessere Rolle</button>
          <button className="btn small-text" onClick={() => verhandeln(a.id, 'laufzeit')}>Längere Laufzeit</button>
        </div>
      )}
    </section>
  )
}

export function VertragTab({ c }: { c: Career }) {
  const leiheAnfragen = useCareer((s) => s.leiheAnfragen)
  const wechselwunsch = useCareer((s) => s.wechselwunsch)
  const pausenjahr = useCareer((s) => s.pausenjahr)
  const v = c.vertrag
  const verein = c.vereinId ? VEREINE[c.vereinId] : null
  return (
    <>
      <section className="card">
        <h2>Dein Vertrag</h2>
        {v && verein ? (
          <div className="grid2">
            <div><span className="muted">Verein</span><strong>{verein.name}</strong></div>
            <div><span className="muted">Liga</span><strong>{ligaText(c, verein.id)}</strong></div>
            <div><span className="muted">Gehalt</span><strong>{fmtGeld(v.gehalt)} / Jahr</strong></div>
            <div><span className="muted">Läuft bis</span><strong>Ende {saisonLabel(v.endeSaison)}</strong></div>
            <div><span className="muted">Rolle</span><strong>{v.rolle}</strong></div>
            <div><span className="muted">Marktwert</span><strong>{fmtGeld(marktwert(c.spieler, c.uhr.saison))}</strong></div>
            {c.leihe && <div><span className="muted">Stammverein</span><strong>{VEREINE[c.leihe.vonVerein].name}</strong></div>}
          </div>
        ) : <p className="alert">Du bist vereinslos. {c.fenster ? 'Im Transferfenster findest du Angebote.' : 'Im nächsten Transferfenster melden sich vielleicht wieder Vereine.'}</p>}
      </section>

      {!c.fenster && c.angebote.some((a) => a.art === 'verlaengerung') && (
        <>
          <h2 className="section">Vertragsangebot</h2>
          {c.angebote.filter((a) => a.art === 'verlaengerung').map((a) => <AngebotKarte key={a.id} a={a} c={c} />)}
        </>
      )}

      {c.fenster ? (
        <>
          <h2 className="section">Angebote ({c.angebote.length})</h2>
          {c.angebote.length === 0 && <p className="muted">Aktuell liegt nichts auf dem Tisch. Spiele gut, dann melden sich Vereine.</p>}
          {c.angebote.map((a) => <AngebotKarte key={a.id} a={a} c={c} />)}
          {!c.leihe && v && !c.saison.jugend && (
            <button className="btn" onClick={leiheAnfragen}>Leihe anfragen (zum Spielen)</button>
          )}
        </>
      ) : (
        <p className="muted">Außerhalb der Transferfenster (Winter- und Sommerpause) kannst du nicht wechseln.</p>
      )}

      {!v && c.fenster === 'sommer' && !c.saison.jugend && (
        <section className="card">
          <h2>Ein Jahr ohne Verein</h2>
          <p className="muted">
            Wenn kein Angebot passt (oder niemand dich will), kannst du ein Jahr ohne Verein verbringen: Du trainierst weiter und lebst von deinem Geld,
            spielst aber nicht. Im Winter und im nächsten Sommer melden sich vielleicht neue Vereine. Nimmst du vorher ein Angebot an, entfällt das Pausenjahr.
          </p>
          <button className={`btn${c.flags.pausenjahrWunsch === true ? ' primary' : ''}`} onClick={pausenjahr}>
            {c.flags.pausenjahrWunsch === true ? 'Pausenjahr geplant (zurücknehmen)' : 'Ein Jahr vereinslos bleiben'}
          </button>
        </section>
      )}

      {v && !c.saison.jugend && (
        <section className="card">
          <h2>Wechselwunsch</h2>
          <p className="muted">
            Ein öffentlicher Wechselwunsch bringt mehr Angebote, belastet aber das Verhältnis zu Trainer und Kabine.
          </p>
          <button className={`btn${c.wechselwunsch ? ' primary' : ''}`} onClick={wechselwunsch}>
            {c.wechselwunsch ? 'Wechselwunsch aktiv (zurückziehen)' : 'Wechselwunsch äußern'}
          </button>
        </section>
      )}
    </>
  )
}
