import { countryById } from '../../data/countries'
import { overall, SKILL_KEYS, SKILL_LABELS } from '../../engine/rating'
import type { Career, Traits } from '../../engine/types'
import { marktwert } from '../../engine/wirtschaft'
import { fmtGeld } from '../../ui/format'
import { Meter } from './Header'

const TRAIT_LABEL: [keyof Traits, string][] = [
  ['ruf', 'Ruf'], ['fanbeliebtheit', 'Fans'], ['trainerBeziehung', 'Trainer'], ['kabine', 'Kabine'],
  ['disziplin', 'Disziplin'], ['professionalitaet', 'Professionalität'], ['ehrgeiz', 'Ehrgeiz'], ['privatglueck', 'Privatglück'],
]

const POS: Record<string, string> = {
  TW: 'Torwart', IV: 'Innenverteidiger', AV: 'Außenverteidiger', ZDM: 'Defensives Mittelfeld',
  ZM: 'Zentrales Mittelfeld', ZOM: 'Offensives Mittelfeld', AF: 'Flügelspieler', ST: 'Stürmer',
}

/** Scouting-Einschätzung des Potenzials in halben Sternen, bewusst unscharf. */
function potenzialSterne(c: Career): string {
  const p = c.spieler.potenzial
  const halb = Math.max(1, Math.min(10, Math.round((p + ((c.spieler.vorname.length + c.spieler.nachname.length) % 5) - 2) / 10)))
  return '★'.repeat(Math.floor(halb / 2)) + (halb % 2 ? '½' : '') + '☆'.repeat(5 - Math.ceil(halb / 2))
}

export function SpielerTab({ c }: { c: Career }) {
  const p = c.spieler
  const land = countryById(p.nationalitaet)
  const p2 = c.personen
  return (
    <>
      <section className="card">
        <h2>{POS[p.position]}</h2>
        <p className="muted">{land?.flagge} {land?.name} · starker Fuß: {p.fuss}</p>
        <div className="grid2">
          <div><span className="muted">Marktwert</span><strong>{fmtGeld(marktwert(p, c.uhr.saison))}</strong></div>
          <div><span className="muted">Vermögen</span><strong>{fmtGeld(p.geld)}</strong></div>
          <div><span className="muted">Gesamtstärke</span><strong>{overall(p).toFixed(1).replace('.', ',')}</strong></div>
          <div><span className="muted">Scouting-Potenzial</span><strong title="Grobe Einschätzung der Scouts">{potenzialSterne(c)}</strong></div>
        </div>
      </section>

      <section className="card">
        <h2>Attribute</h2>
        {SKILL_KEYS.map((k) => (
          <div key={k} className="stat">
            <span>{SKILL_LABELS[k]}</span>
            <div className="bar"><div style={{ width: `${p.skills[k]}%` }} /></div>
            <span className="num">{Math.round(p.skills[k])}</span>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Persönlichkeit &amp; Umfeld</h2>
        {TRAIT_LABEL.map(([k, l]) => <Meter key={k} label={l} value={p.traits[k]} />)}
      </section>

      <section className="card">
        <h2>Dein Umfeld</h2>
        <ul className="plain">
          <li><span className="muted">Trainer:</span> {p2.trainer}</li>
          <li><span className="muted">Kapitän:</span> {p2.kapitaen}</li>
          <li><span className="muted">Rivale:</span> {p2.rivale}</li>
          <li><span className="muted">Bester Freund:</span> {p2.freund}</li>
          <li><span className="muted">Berater:</span> {p2.berater} {'★'.repeat(Number(c.flags.beraterGuete ?? 1))}</li>
          <li><span className="muted">Beziehung:</span> {p2.partner ?? 'Single'}{c.flags.verheiratet === true ? ' (verheiratet)' : ''}</li>
          {Number(c.flags.kinder ?? 0) > 0 && <li><span className="muted">Kinder:</span> {String(c.flags.kinder)}</li>}
          <li><span className="muted">Journalist:</span> {p2.reporter}</li>
        </ul>
      </section>
    </>
  )
}
