import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LAENDER, LIGEN, VEREINE, ligaIds } from '../data/clubs'
import { COUNTRIES } from '../data/countries'
import { useCareer } from '../store/careerStore'
import type { Archetype, Background, Foot, Position } from '../engine/types'

const POSITIONS: [Position, string][] = [
  ['TW', 'Torwart'], ['IV', 'Innenverteidiger'], ['AV', 'Außenverteidiger'], ['ZDM', 'Defensives Mittelfeld'],
  ['ZM', 'Zentrales Mittelfeld'], ['ZOM', 'Offensives Mittelfeld'], ['AF', 'Flügelspieler'], ['ST', 'Stürmer'],
]
const BACKGROUNDS: [Background, string, string][] = [
  ['arbeiterfamilie', 'Arbeiterfamilie', 'Wenig Geld, riesiger Hunger.'],
  ['fussballerfamilie', 'Fußballer-Familie', 'Papa kennt Leute. Erwartungen sind hoch.'],
  ['akademiker', 'Akademiker-Haushalt', 'Disziplin und Plan B in der Schublade.'],
]
const ARCHETYPES: [Archetype, string, string][] = [
  ['strassenfussballer', 'Straßenfußballer', 'Dribbling und Technik, taktisch roh.'],
  ['akademietalent', 'Akademie-Talent', 'Sauber ausgebildet, weniger Wucht.'],
  ['spaetzuender', 'Spätzünder', 'Körperlich stark, technisch noch unfertig.'],
]

/** Verein, dessen U19 (Stärke − 12) etwa zum Startniveau eines 16-Jährigen passt. */
function empfehlung(land: string): string {
  const alle = Object.values(VEREINE).filter((v) => v.land === land)
  return [...alle].sort((a, b) => Math.abs(a.basis - 60) - Math.abs(b.basis - 60))[0].id
}

export default function NewCareer() {
  const navigate = useNavigate()
  const start = useCareer((s) => s.start)
  const laender = useMemo(() => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'de')), [])

  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [land, setLand] = useState('DE')
  const [vereinId, setVereinId] = useState(() => empfehlung('DE'))
  const [position, setPosition] = useState<Position>('ST')
  const [fuss, setFuss] = useState<Foot>('rechts')
  const [hintergrund, setHintergrund] = useState<Background>('arbeiterfamilie')
  const [archetyp, setArchetyp] = useState<Archetype>('strassenfussballer')

  const valid = vorname.trim() !== '' && nachname.trim() !== ''
  const verein = VEREINE[vereinId]

  const wechsleLand = (l: string) => {
    setLand(l)
    setVereinId(empfehlung(l))
  }

  return (
    <main className="screen">
      <h1>Neue Karriere</h1>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          start({ vorname, nachname, nationalitaet: land, vereinId, position, fuss, hintergrund, archetyp })
          navigate('/spiel')
        }}
      >
        <label>Vorname<input value={vorname} onChange={(e) => setVorname(e.target.value)} autoComplete="off" /></label>
        <label>Nachname<input value={nachname} onChange={(e) => setNachname(e.target.value)} autoComplete="off" /></label>
        <label>Heimatland
          <select value={land} onChange={(e) => wechsleLand(e.target.value)}>
            {laender.map((c) => <option key={c.id} value={c.id}>{c.flagge} {c.name}</option>)}
          </select>
        </label>
        <label>Jugendverein (U19)
          <select value={vereinId} onChange={(e) => setVereinId(e.target.value)}>
            {ligaIds(land).map((lid) => (
              <optgroup key={lid} label={LIGEN[lid].name}>
                {Object.values(VEREINE).filter((v) => v.ligaStart === lid).map((v) => (
                  <option key={v.id} value={v.id}>{v.name} (Stärke {v.basis})</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <p className="muted small">
          {LAENDER[land].ligen.length > 0 && verein && `${verein.name}: Die U19 hat etwa Stärke ${Math.round(verein.basis - 12)}. Du startest mit ca. 45–55. Starke Vereine heißen viel Konkurrenz, schwache viel Spielzeit.`}
        </p>
        <label>Position
          <select value={position} onChange={(e) => setPosition(e.target.value as Position)}>
            {POSITIONS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label>Starker Fuß
          <select value={fuss} onChange={(e) => setFuss(e.target.value as Foot)}>
            <option value="rechts">Rechts</option>
            <option value="links">Links</option>
            <option value="beidfüßig">Beidfüßig</option>
          </select>
        </label>

        <fieldset>
          <legend>Herkunft</legend>
          {BACKGROUNDS.map(([id, name, desc]) => (
            <label key={id} className={`card choice${hintergrund === id ? ' on' : ''}`}>
              <input type="radio" name="hg" checked={hintergrund === id} onChange={() => setHintergrund(id)} />
              <strong>{name}</strong><span className="muted">{desc}</span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Spielertyp</legend>
          {ARCHETYPES.map(([id, name, desc]) => (
            <label key={id} className={`card choice${archetyp === id ? ' on' : ''}`}>
              <input type="radio" name="at" checked={archetyp === id} onChange={() => setArchetyp(id)} />
              <strong>{name}</strong><span className="muted">{desc}</span>
            </label>
          ))}
        </fieldset>

        <button className="btn primary" disabled={!valid}>Karriere starten</button>
        <button type="button" className="btn" onClick={() => navigate('/')}>Zurück</button>
      </form>
    </main>
  )
}
