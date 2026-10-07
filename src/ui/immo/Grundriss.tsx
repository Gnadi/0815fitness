import type { ReactNode } from 'react'
import { createRng, type Rng } from '../../engine/rng'
import type { Expose } from '../../engine/expose'
import type { ImmoTyp } from '../../engine/types'

interface Raum {
  name: string
  /** Anteil an der Gesamtfläche. */
  anteil: number
  /** Außenbereich (Balkon, Terrasse) wird schraffiert gezeichnet. */
  aussen?: boolean
  /** Räume ohne Fenster (Bad, Flur) bekommen keinen Wandschlitz. */
  innen?: boolean
}
interface Platte {
  x: number
  y: number
  w: number
  h: number
  raum: Raum
}

const WAND = '#2d2a26'
const PAPIER = '#f7f3e8'

/** Teilt die Räume nach dem Prinzip der Slice-and-dice-Treemap auf ein Rechteck auf. */
function schneide(raeume: Raum[], x: number, y: number, w: number, h: number, aus: Platte[]): void {
  if (raeume.length === 0) return
  if (raeume.length === 1) {
    aus.push({ x, y, w, h, raum: raeume[0] })
    return
  }
  const summe = raeume.reduce((a, r) => a + r.anteil, 0)
  let teil = 0
  let k = 0
  while (k < raeume.length - 1 && teil + raeume[k].anteil / 2 < summe / 2) {
    teil += raeume[k].anteil
    k++
  }
  k = Math.max(1, k)
  const a = raeume.slice(0, k)
  const b = raeume.slice(k)
  const fa = a.reduce((s, r) => s + r.anteil, 0) / summe
  if (w >= h) {
    schneide(a, x, y, w * fa, h, aus)
    schneide(b, x + w * fa, y, w * (1 - fa), h, aus)
  } else {
    schneide(a, x, y, w, h * fa, aus)
    schneide(b, x, y + h * fa, w, h * (1 - fa), aus)
  }
}

function wohnRaeume(zimmer: number, rng: Rng, typ: ImmoTyp, etage: 'EG' | 'OG' | 'ganz'): Raum[] {
  const schlaf = Math.max(1, zimmer - 1)
  const namen = ['Schlafzimmer', 'Kinderzimmer', 'Arbeitszimmer', 'Gästezimmer', 'Ankleide', 'Schlafzimmer 2']
  const mitBalkon = typ === 'apartment' || typ === 'wohnung'
  const mitTerrasse = typ === 'eigenheim' || typ === 'ferienhaus' || typ === 'villa'
  if (etage === 'EG') {
    const liste: Raum[] = [
      { name: 'Wohnen / Essen', anteil: 0.34 },
      { name: 'Küche', anteil: 0.12 },
      { name: 'Diele', anteil: 0.08, innen: true },
      { name: 'Gäste-WC', anteil: 0.04, innen: true },
      { name: 'Arbeitszimmer', anteil: 0.12 },
    ]
    if (typ === 'villa') liste.push({ name: 'Wellness', anteil: 0.14 }, { name: 'Heimkino', anteil: 0.1, innen: true })
    if (mitTerrasse) liste.push({ name: 'Terrasse', anteil: 0.12, aussen: true })
    return liste
  }
  if (etage === 'OG') {
    const n = Math.max(2, Math.min(5, schlaf))
    const liste: Raum[] = [{ name: 'Elternschlafzimmer', anteil: 0.24 }, { name: 'Bad', anteil: 0.1, innen: true }, { name: 'Flur', anteil: 0.08, innen: true }]
    for (let i = 1; i < n; i++) liste.push({ name: namen[(i + rng.int(0, 1)) % namen.length], anteil: 0.17 })
    if (typ === 'villa') liste.push({ name: 'Ankleide', anteil: 0.1 }, { name: 'Bad 2', anteil: 0.08, innen: true }, { name: 'Dachterrasse', anteil: 0.14, aussen: true })
    else liste.push({ name: 'Balkon', anteil: 0.06, aussen: true })
    return liste
  }
  const liste: Raum[] = [
    { name: 'Wohnen / Essen', anteil: zimmer <= 1 ? 0.5 : 0.3 },
    { name: 'Küche', anteil: zimmer <= 1 ? 0.12 : 0.12 },
    { name: 'Bad', anteil: 0.09, innen: true },
    { name: 'Flur', anteil: 0.08, innen: true },
  ]
  if (zimmer > 1) {
    for (let i = 0; i < schlaf; i++) liste.push({ name: i === 0 ? 'Schlafzimmer' : namen[i % namen.length], anteil: i === 0 ? 0.17 : 0.12 })
  }
  if (mitBalkon) liste.push({ name: 'Balkon', anteil: 0.06, aussen: true })
  return liste
}

const m2 = (n: number): string => `${Math.round(n)} m²`

const KURZ: Record<string, string> = {
  'Wohnen / Essen': 'Wohnen', Elternschlafzimmer: 'Eltern', Schlafzimmer: 'Schlafen', Kinderzimmer: 'Kinder', Arbeitszimmer: 'Arbeiten',
  Gästezimmer: 'Gäste', 'Gäste-WC': 'WC', Dachterrasse: 'Dach', Terrasse: 'Terrasse', 'Schlafzimmer 2': 'Schlafen 2', Heimkino: 'Kino', Wellness: 'Spa', Ankleide: 'Ankleide',
}
/** Beschriftung, die in den Raum passt: erst der volle Name, dann die Kurzform, sonst nichts. */
const beschrifte = (name: string, breite: number, schrift: number): string | null => {
  const passt = (t: string) => t.length * schrift * 0.58 <= breite - 4
  if (passt(name)) return name
  const kurz = KURZ[name]
  return kurz && passt(kurz) ? kurz : null
}

function Raeume({ platten, flaeche, ox, oy, gesamtW, gesamtH }: { platten: Platte[]; flaeche: number; ox: number; oy: number; gesamtW: number; gesamtH: number }) {
  const summe = platten.reduce((a, p) => a + p.raum.anteil, 0)
  const nodes: ReactNode[] = []
  platten.forEach((p, i) => {
    const gross = p.w > 44 && p.h > 26
    const schrift = gross ? 8.4 : 7
    const text = beschrifte(p.raum.name, p.w, schrift)
    const klein = p.h < 14
    const x = ox + p.x
    const y = oy + p.y
    nodes.push(
      <g key={i}>
        <rect x={x} y={y} width={p.w} height={p.h} fill={p.raum.aussen ? 'url(#schraffur)' : i % 2 ? '#fffdf6' : '#f0ead8'} stroke={WAND} strokeWidth="1.4" />
        {!klein && text && (
          <text x={x + p.w / 2} y={y + p.h / 2 - (gross ? 2 : 0)} textAnchor="middle" fontSize={schrift} fontWeight="600" fill={WAND} fontFamily="system-ui, sans-serif">{text}</text>
        )}
        {!klein && gross && text && (
          <text x={x + p.w / 2} y={y + p.h / 2 + 8} textAnchor="middle" fontSize="7" fill="#6a645a" fontFamily="system-ui, sans-serif">{m2((p.raum.anteil / summe) * flaeche)}</text>
        )}
      </g>,
    )
  })
  nodes.push(<rect key="aussen" x={ox} y={oy} width={gesamtW} height={gesamtH} fill="none" stroke={WAND} strokeWidth="3" />)
  // Fenster: Wandschlitze an Außenwänden
  platten.forEach((p, i) => {
    if (p.raum.innen || p.raum.aussen) return
    const x = ox + p.x
    const y = oy + p.y
    if (p.y < 1 && p.w > 30) nodes.push(<line key={`ft${i}`} x1={x + p.w * 0.3} x2={x + p.w * 0.7} y1={y} y2={y} stroke="#7cc3ee" strokeWidth="3.4" />)
    if (Math.abs(p.y + p.h - gesamtH) < 1 && p.w > 30) nodes.push(<line key={`fb${i}`} x1={x + p.w * 0.3} x2={x + p.w * 0.7} y1={y + p.h} y2={y + p.h} stroke="#7cc3ee" strokeWidth="3.4" />)
    if (p.x < 1 && p.h > 26) nodes.push(<line key={`fl${i}`} y1={y + p.h * 0.3} y2={y + p.h * 0.7} x1={x} x2={x} stroke="#7cc3ee" strokeWidth="3.4" />)
    if (Math.abs(p.x + p.w - gesamtW) < 1 && p.h > 26) nodes.push(<line key={`fr${i}`} y1={y + p.h * 0.3} y2={y + p.h * 0.7} x1={x + p.w} x2={x + p.w} stroke="#7cc3ee" strokeWidth="3.4" />)
  })
  return <>{nodes}</>
}

function Rahmen({ titel, unter, children }: { titel: string; unter: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 320 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label={titel} style={{ display: 'block' }}>
      <defs>
        <pattern id="schraffur" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="#eef3e6" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="#9db58a" strokeWidth="1.4" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={PAPIER} />
      <text x="14" y="17" fontSize="9" fontWeight="700" fill={WAND} fontFamily="system-ui, sans-serif" letterSpacing="0.6">{titel.toUpperCase()}</text>
      <g transform="translate(298 14)">
        <circle r="8" fill="none" stroke={WAND} strokeWidth="1" />
        <path d="M0 -6 L3 4 L0 2 L-3 4 Z" fill={WAND} />
        <text y="-10" fontSize="6" textAnchor="middle" fill={WAND} fontFamily="system-ui, sans-serif">N</text>
      </g>
      {children}
      <text x="14" y="194" fontSize="6.4" fill="#7a7468" fontFamily="system-ui, sans-serif">{unter}</text>
    </svg>
  )
}

/** Mehrere Einheiten pro Geschoss (Mehrfamilienhaus, Gewerbe) rund um ein Treppenhaus. */
function Etagenplan({ e, typ, rng }: { e: Expose; typ: ImmoTyp; rng: Rng }) {
  const einheiten = Math.max(2, Math.min(6, typ === 'mfh' ? Math.round(e.zimmer / Math.max(2, e.etagen - 0)) || 2 : Math.round(e.zimmer / 2) || 2))
  const e1 = Math.min(6, Math.max(2, einheiten + (typ === 'mfh' ? 1 : 0)))
  const ox = 22
  const oy = 28
  const w = 276
  const h = 148
  const kernB = 34
  const links = Math.ceil(e1 / 2)
  const rechts = e1 - links
  const platten: Platte[] = []
  const bez = typ === 'gewerbe' ? ['Büro', 'Praxis', 'Laden', 'Agentur', 'Kanzlei', 'Lager'] : ['WE']
  const flaecheEinheit = e.flaeche / (typ === 'mfh' ? e.zimmer : e.zimmer) || 80
  const spalteW = (w - kernB) / 2
  const einheitenInfo = (i: number) => (typ === 'gewerbe' ? `${bez[i % bez.length]} ${i + 1}` : `WE ${i + 1}`)
  for (let i = 0; i < links; i++) platten.push({ x: 0, y: (h / links) * i, w: spalteW, h: h / links, raum: { name: einheitenInfo(i), anteil: 1 } })
  for (let i = 0; i < rechts; i++) platten.push({ x: spalteW + kernB, y: (h / rechts) * i, w: spalteW, h: h / rechts, raum: { name: einheitenInfo(links + i), anteil: 1 } })
  void rng
  return (
    <>
      {platten.map((p, i) => (
        <g key={i}>
          <rect x={ox + p.x} y={oy + p.y} width={p.w} height={p.h} fill={i % 2 ? '#fffdf6' : '#f0ead8'} stroke={WAND} strokeWidth="1.4" />
          <text x={ox + p.x + p.w / 2} y={oy + p.y + p.h / 2 - 2} fontSize="8.6" fontWeight="600" textAnchor="middle" fill={WAND} fontFamily="system-ui, sans-serif">{p.raum.name}</text>
          <text x={ox + p.x + p.w / 2} y={oy + p.y + p.h / 2 + 9} fontSize="7" textAnchor="middle" fill="#6a645a" fontFamily="system-ui, sans-serif">{m2(flaecheEinheit)}</text>
        </g>
      ))}
      <rect x={ox + spalteW} y={oy} width={kernB} height={h} fill="#e4ded0" stroke={WAND} strokeWidth="1.4" />
      <text x={ox + spalteW + kernB / 2} y={oy + 22} fontSize="6.6" textAnchor="middle" fill={WAND} fontFamily="system-ui, sans-serif">Treppen-</text>
      <text x={ox + spalteW + kernB / 2} y={oy + 30} fontSize="6.6" textAnchor="middle" fill={WAND} fontFamily="system-ui, sans-serif">haus</text>
      <rect x={ox + spalteW + 7} y={oy + 62} width="20" height="22" fill="none" stroke={WAND} strokeWidth="1" />
      <line x1={ox + spalteW + 7} y1={oy + 62} x2={ox + spalteW + 27} y2={oy + 84} stroke={WAND} strokeWidth="0.8" />
      <line x1={ox + spalteW + 27} y1={oy + 62} x2={ox + spalteW + 7} y2={oy + 84} stroke={WAND} strokeWidth="0.8" />
      <text x={ox + spalteW + kernB / 2} y={oy + 96} fontSize="6" textAnchor="middle" fill={WAND} fontFamily="system-ui, sans-serif">Aufzug</text>
      <rect x={ox} y={oy} width={w} height={h} fill="none" stroke={WAND} strokeWidth="3" />
    </>
  )
}

function Parzelle({ e, rng }: { e: Expose; rng: Rng }) {
  const breite = Math.sqrt(e.flaeche * (1 + rng.next() * 0.25))
  const tiefe = e.flaeche / breite
  const b = `${breite.toFixed(1).replace('.', ',')} m`
  const t = `${tiefe.toFixed(1).replace('.', ',')} m`
  const sk = rng.int(-8, 8)
  return (
    <>
      <polygon points={`40,${40 + sk} 276,40 ${268 + sk},150 46,${154}`} fill="#e6efd8" stroke={WAND} strokeWidth="2" />
      <polygon points={`72,${64 + sk / 2} 240,62 ${236 + sk / 2},124 76,128`} fill="none" stroke="#c0623f" strokeWidth="1.2" strokeDasharray="5 3" />
      <text x="158" y="92" fontSize="8" textAnchor="middle" fontWeight="600" fill="#c0623f" fontFamily="system-ui, sans-serif">Baufenster (GRZ 0,4)</text>
      <text x="158" y="103" fontSize="7" textAnchor="middle" fill="#6a645a" fontFamily="system-ui, sans-serif">ca. {Math.round(e.flaeche * 0.4)} m² bebaubar</text>
      <text x="158" y="35" fontSize="7.6" textAnchor="middle" fill={WAND} fontFamily="system-ui, sans-serif">{b}</text>
      <text x="22" y="98" fontSize="7.6" textAnchor="middle" fill={WAND} transform="rotate(-90 22 98)" fontFamily="system-ui, sans-serif">{t}</text>
      <rect x="40" y="160" width="230" height="16" fill="#cfd1d4" stroke={WAND} strokeWidth="1" />
      <line x1="46" y1="168" x2="264" y2="168" stroke="#fff" strokeWidth="1.4" strokeDasharray="10 7" />
      <text x="156" y="187" fontSize="6.6" textAnchor="middle" fill="#6a645a" fontFamily="system-ui, sans-serif">Straße / Zufahrt</text>
      <rect x="140" y="148" width="30" height="12" fill="#e6efd8" stroke={WAND} strokeWidth="1" strokeDasharray="3 2" />
      <text x="262" y="60" fontSize="7" fill="#6a645a" fontFamily="system-ui, sans-serif">{e.flaeche} m²</text>
    </>
  )
}

/** Grundriss als Zeichnung. `ebene` wählt Erd- oder Obergeschoss bei Häusern mit zwei Geschossen. */
export function Grundriss({ typ, e, ebene = 'EG' }: { typ: ImmoTyp; e: Expose; ebene?: 'EG' | 'OG' }) {
  const rng = createRng(e.seed + (ebene === 'OG' ? 99 : 0))
  if (typ === 'bauland') {
    return <Rahmen titel="Lageplan Grundstück" unter={`Parzelle ca. ${e.flaeche} m² · Angaben ohne Gewähr`}><Parzelle e={e} rng={rng} /></Rahmen>
  }
  if (typ === 'mfh' || typ === 'gewerbe') {
    return <Rahmen titel="Regelgeschoss" unter={`Gesamtfläche ca. ${e.flaeche} m² · ${e.etagen} Geschosse · Angaben ohne Gewähr`}><Etagenplan e={e} typ={typ} rng={rng} /></Rahmen>
  }
  const zweigeschossig = (typ === 'eigenheim' || typ === 'villa' || typ === 'ferienhaus') && e.zimmer >= 4
  const modus: 'EG' | 'OG' | 'ganz' = zweigeschossig ? ebene : 'ganz'
  const raeume = wohnRaeume(e.zimmer, rng, typ, modus)
  // Größe der Zeichnung wächst leicht mit der Fläche
  const flaecheEbene = zweigeschossig ? e.flaeche / 2 : e.flaeche
  const skala = Math.max(0.72, Math.min(1, 0.5 + flaecheEbene / 200))
  const gesamtW = Math.round(276 * skala)
  const gesamtH = Math.round(144 * Math.max(0.6, skala))
  const platten: Platte[] = []
  schneide(raeume, 0, 0, gesamtW, gesamtH, platten)
  const ox = 22 + (276 - gesamtW) / 2
  const oy = 28 + (148 - gesamtH) / 2
  const titel = zweigeschossig ? (ebene === 'OG' ? 'Obergeschoss' : 'Erdgeschoss') : 'Grundriss'
  return (
    <Rahmen titel={titel} unter={`Wohnfläche ca. ${e.flaeche} m² · ${e.zimmer} ${e.zimmer === 1 ? 'Zimmer' : 'Zimmer'} · Angaben ohne Gewähr`}>
      <Raeume platten={platten} flaeche={flaecheEbene} ox={ox} oy={oy} gesamtW={gesamtW} gesamtH={gesamtH} />
    </Rahmen>
  )
}

export const hatObergeschoss = (typ: ImmoTyp, e: Expose): boolean => (typ === 'eigenheim' || typ === 'villa' || typ === 'ferienhaus') && e.zimmer >= 4
