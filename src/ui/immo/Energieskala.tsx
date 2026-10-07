import { ENERGIEKLASSEN, type Energieklasse } from '../../engine/expose'

const FARBEN = ['#0f8a4a', '#2fa04a', '#7bb739', '#bcc72f', '#f0d12b', '#f3a52a', '#ee7a2a', '#e0472b', '#b3262a']

/** Energieausweis-Skala von A+ (grün) bis H (rot) mit Markierung. */
export function Energieskala({ klasse, kwh }: { klasse: Energieklasse; kwh: number | null }) {
  const idx = ENERGIEKLASSEN.indexOf(klasse)
  return (
    <div className="energie" role="img" aria-label={`Energieeffizienzklasse ${klasse}${kwh ? `, ${kwh} kWh pro Quadratmeter und Jahr` : ''}`}>
      <div className="energie-leiste">
        {ENERGIEKLASSEN.map((k, i) => (
          <span key={k} className={`energie-stufe${i === idx ? ' aktiv' : ''}`} style={{ background: FARBEN[i], flexGrow: i === idx ? 1.9 : 1 }}>{k}</span>
        ))}
      </div>
      <p className="muted small">{kwh ? `${kwh} kWh/(m²·a)` : ''} Endenergiebedarf · Klasse {klasse}</p>
    </div>
  )
}
