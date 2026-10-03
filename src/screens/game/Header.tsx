import { VEREINE } from '../../data/clubs'
import { countryById } from '../../data/countries'
import { alter, overall } from '../../engine/rating'
import type { Career } from '../../engine/types'
import { wochenEinkommen } from '../../engine/wirtschaft'
import { fmtEuro, fmtKonto, saisonLabel } from '../../ui/format'

export function Header({ c }: { c: Career }) {
  const p = c.spieler
  const land = countryById(p.nationalitaet)
  const verein = c.vereinId ? VEREINE[c.vereinId].name : 'vereinslos'
  const slot = c.saison.kalender[c.uhr.woche - 1]
  const woche = c.phase === 'saisonende' || c.phase === 'karriereende' ? 'Saisonende' : `Woche ${c.uhr.woche}/${c.saison.kalender.length}`
  return (
    <header className="head">
      <div className="row">
        <h1 className="grow">{p.vorname} {p.nachname}</h1>
        <span className="pill ovr" title="Gesamtstärke">{Math.round(overall(p))}</span>
      </div>
      <p className="muted">
        {land?.flagge} {p.position} · {alter(p.geburtsdatum, c.uhr.saison)} Jahre · {verein}
        {c.saison.jugend && ' (U19)'}{c.leihe && ' (Leihe)'}
      </p>
      <p className="muted">
        Saison {saisonLabel(c.uhr.saison)} · {woche}
        {slot?.t === 'F' && slot.fenster && c.fenster ? ' · 🔁 Transferfenster offen' : ''}
      </p>
      <p className={`konto${p.geld < 0 ? ' minus' : ''}`} title={c.vertrag ? `Netto pro Woche: ${fmtEuro(wochenEinkommen(c))}` : undefined}>
        <span aria-hidden>💶</span> Kontostand <strong>{fmtKonto(p.geld)}</strong>
      </p>
    </header>
  )
}

export function Meter({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="bar"><div style={{ width: `${v}%` }} /></div>
      <span className="num">{Math.round(v)}</span>
    </div>
  )
}

export function Status({ c }: { c: Career }) {
  const t = c.spieler.traits
  return (
    <section className="card">
      <Meter label="Fitness" value={t.fitness} />
      <Meter label="Form" value={c.form} />
      <Meter label="Selbstvertr." value={t.selbstvertrauen} />
      <Meter label="Moral" value={t.moral} />
      {c.verletzung && (
        <p className="alert">🩹 {c.verletzung.name}: noch {c.verletzung.wochen} Woche{c.verletzung.wochen === 1 ? '' : 'n'}</p>
      )}
      {c.sperre > 0 && <p className="alert">🟥 Gesperrt für {c.sperre} Spiel{c.sperre === 1 ? '' : 'e'}</p>}
    </section>
  )
}
