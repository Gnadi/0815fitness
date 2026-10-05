import { useState } from 'react'
import { countryById } from '../../data/countries'
import { IMMO_TYPEN } from '../../data/immobilien'
import { PRIVAT, PRIVAT_KATEGORIEN, type PrivatPosten } from '../../data/privat'
import { hatWohnsitz, immoAktiv, immoName } from '../../engine/immobilien'
import { aktiverBesitz, glueckStufe, hatBesitz, privatLaufend, privatPruefung } from '../../engine/privat'
import type { Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtEuro, fmtGeld } from '../../ui/format'
import { Seg } from '../../ui/Seg'
import { Meter } from './Header'

type Bereich = 'uebersicht' | 'aktivitaeten' | 'besitz' | 'wohnen'

const WIRKUNG: Record<string, string> = {
  moral: 'Moral', selbstvertrauen: 'Selbstvertrauen', ruf: 'Ruf', fanbeliebtheit: 'Fans', fitness: 'Fitness', gesundheit: 'Gesundheit',
  privatglueck: 'Privatglück', kabine: 'Kabine', professionalitaet: 'Professionalität', disziplin: 'Disziplin', ehrgeiz: 'Ehrgeiz', trainerBeziehung: 'Trainer',
}

const wirkungen = (d: PrivatPosten['sofort']): string =>
  Object.entries(d ?? {}).filter(([, v]) => v).map(([k, v]) => `${WIRKUNG[k]} ${v! >= 0 ? '+' : '−'}${Math.abs(v!)}`).join(' · ')

const passivText = (d: PrivatPosten['passiv']): string =>
  Object.entries(d ?? {}).filter(([, v]) => v).map(([k]) => WIRKUNG[k]).join(', ')

function Karte({ c, p }: { c: Career; p: PrivatPosten }) {
  const nutzen = useCareer((s) => s.privat)
  const kuendigen = useCareer((s) => s.privatKuendigen)
  const besitzt = p.art === 'besitz' && hatBesitz(c, p.id)
  const grund = besitzt ? null : privatPruefung(c, p)
  const eigen = hatWohnsitz(c) && p.gruppe === 'wohnen'
  return (
    <section className={`card${grund && !besitzt ? ' gesperrt' : ''}`}>
      <div className="row">
        <h2 className="grow">{p.icon} {p.name}</h2>
        {besitzt && <span className="risk sicher">{eigen ? 'Ruht (Eigenheim)' : 'Vorhanden'}</span>}
      </div>
      <p className="muted small">{p.text}</p>
      <div className="grid2">
        <div><span className="muted">{p.art === 'aktion' ? 'Kosten' : p.gruppe === 'wohnen' ? 'Kaution' : 'Anschaffung'}</span><strong>{p.kosten > 0 ? fmtGeld(p.kosten) : 'keine'}</strong></div>
        {p.laufend ? <div><span className="muted">Laufend</span><strong>{fmtEuro(p.laufend)} / Jahr</strong></div> : null}
      </div>
      {p.sofort && <p className="muted small hinweis">{wirkungen(p.sofort)}</p>}
      {p.passiv && <p className="muted small hinweis">Wirkt jede Woche auf: {passivText(p.passiv)}</p>}
      <div className="row split">
        {!besitzt && <button className="btn small-text" disabled={grund !== null} onClick={() => nutzen(p.id)}>{p.art === 'aktion' ? 'Machen' : p.gruppe === 'wohnen' ? 'Einziehen' : 'Anschaffen'}</button>}
        {besitzt && p.laufend ? <button className="btn small-text" onClick={() => confirm(`${p.name} kündigen?`) && kuendigen(p.id)}>Kündigen</button> : null}
      </div>
      {grund && !besitzt && <p className="muted small hinweis">{grund}</p>}
    </section>
  )
}

const fmtFollower = (tsd: number): string => (tsd >= 1000 ? `${(tsd / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio.` : `${Math.round(tsd).toLocaleString('de-DE')} Tsd.`)

function Uebersicht({ c }: { c: Career }) {
  const p = c.spieler
  const stufe = glueckStufe(p.traits.privatglueck)
  const land = countryById(p.nationalitaet)
  const kinder = Number(c.flags.kinder ?? 0)
  const besitz = aktiverBesitz(c)
  const laufend = privatLaufend(c) + Number(c.flags.lebensstil ?? 0)
  const heim = immoAktiv(c).find((i) => IMMO_TYPEN[i.typ].wohnsitz)
  const miete = besitz.find((b) => b.gruppe === 'wohnen')
  const HERKUNFT: Record<string, string> = { arbeiterfamilie: 'Arbeiterfamilie', fussballerfamilie: 'Fußballer-Familie', akademiker: 'Akademikerfamilie' }
  return (
    <>
      <section className="card">
        <h2>Privatleben</h2>
        <Meter label="Privatglück" value={p.traits.privatglueck} />
        <p className={stufe.ton === 'gut' ? 'pos' : stufe.ton === 'schlecht' ? 'neg' : 'muted'}><strong>{stufe.text}</strong></p>
        <p className="muted small">Ein glückliches Privatleben stärkt Moral und Leistung. Plane Auszeiten, pflege Beziehungen und gönn dir etwas.</p>
      </section>

      <section className="card">
        <h2>Beziehung &amp; Familie</h2>
        <ul className="plain">
          <li><span className="muted">Beziehung:</span> {c.personen.partner ?? 'Single'}{c.flags.verheiratet === true ? ' (verheiratet)' : ''}</li>
          <li><span className="muted">Kinder:</span> {kinder > 0 ? kinder : 'keine'}</li>
          <li><span className="muted">Herkunft:</span> {HERKUNFT[p.hintergrund]}{land ? ` · ${land.flagge} ${land.name}` : ''}</li>
          <li><span className="muted">Bester Freund:</span> {c.personen.freund}</li>
          {Number(c.flags.follower ?? 0) > 0 && <li><span className="muted">Follower:</span> {fmtFollower(Number(c.flags.follower))}</li>}
          {hatBesitz(c, 'eltern-haus') && <li>🏡 Deine Eltern wohnen dank dir in einem neuen Haus.</li>}
        </ul>
      </section>

      <section className="card">
        <h2>Wohnen</h2>
        <p>{heim ? `${IMMO_TYPEN[heim.typ].icon} ${immoName(heim)}` : miete ? `${miete.icon} ${miete.name}` : c.flags.haus === true ? '🏡 Eigenes Haus' : '🏠 Einfache Mietwohnung'}</p>
        <p className="muted small">Ein eigenes Zuhause kaufst du im Tab Finanzen unter Immobilien. Mietwohnungen findest du hier im Bereich „Wohnen“.</p>
      </section>

      <section className="card">
        <h2>Besitz &amp; Lebensstil</h2>
        {besitz.length === 0 ? <p className="muted">Noch nichts angeschafft.</p> : (
          <ul className="plain">
            {besitz.map((b) => <li key={b.id}>{b.icon} {b.name}{b.laufend ? <span className="muted"> · {fmtEuro(b.laufend)} / Jahr</span> : null}</li>)}
          </ul>
        )}
        <div className="grid2">
          <div><span className="muted">Lebenshaltung &amp; Abos</span><strong>{fmtEuro(laufend)} / Jahr</strong></div>
          <div><span className="muted">Anschaffungen</span><strong>{besitz.length}</strong></div>
        </div>
      </section>
    </>
  )
}

export function PrivatTab({ c }: { c: Career }) {
  const [bereich, setBereich] = useState<Bereich>('uebersicht')
  const aktionen = PRIVAT.filter((p) => p.art === 'aktion')
  const besitz = PRIVAT.filter((p) => p.art === 'besitz' && p.kategorie !== 'Wohnen')
  const wohnen = PRIVAT.filter((p) => p.kategorie === 'Wohnen')
  const bereit = aktionen.filter((p) => privatPruefung(c, p) === null).length
  return (
    <>
      <Seg
        wert={bereich}
        onChange={setBereich}
        optionen={[['uebersicht', 'Übersicht'], ['aktivitaeten', `Aktivitäten${bereit ? ` (${bereit})` : ''}`], ['besitz', 'Besitz'], ['wohnen', 'Wohnen']]}
      />
      {bereich === 'uebersicht' && <Uebersicht c={c} />}
      {bereich === 'aktivitaeten' && (
        <>
          <p className="muted small">Einmalige Ausgaben mit direkter Wirkung. Danach ist eine Wartezeit nötig, bis du sie wiederholen kannst.</p>
          {PRIVAT_KATEGORIEN.map((k) => {
            const liste = aktionen.filter((p) => p.kategorie === k)
            if (!liste.length) return null
            return (
              <div key={k} className="stack">
                <h2 className="section">{k}</h2>
                {liste.map((p) => <Karte key={p.id} c={c} p={p} />)}
              </div>
            )
          })}
        </>
      )}
      {bereich === 'besitz' && (
        <>
          <p className="muted small">Dauerhafte Anschaffungen wirken jede Woche, kosten aber teils laufend Geld. Abos kannst du kündigen.</p>
          {PRIVAT_KATEGORIEN.map((k) => {
            const liste = besitz.filter((p) => p.kategorie === k)
            if (!liste.length) return null
            return (
              <div key={k} className="stack">
                <h2 className="section">{k}</h2>
                {liste.map((p) => <Karte key={p.id} c={c} p={p} />)}
              </div>
            )
          })}
        </>
      )}
      {bereich === 'wohnen' && (
        <>
          <p className="muted small">{hatWohnsitz(c) ? 'Du wohnst im Eigenheim, daher ruhen Mietwohnungen.' : 'Mehr Komfort kostet Miete. Ein Eigenheim oder eine Villa kaufst du im Tab Finanzen unter Immobilien.'}</p>
          {wohnen.map((p) => <Karte key={p.id} c={c} p={p} />)}
        </>
      )}
    </>
  )
}
