import { IMMO_LAGEN } from '../data/immobilien'
import { createRng, type Rng } from './rng'
import type { ImmoLage, ImmoTyp } from './types'

/** Alles, was für ein Exposé gebraucht wird. Die Daten sind aus der Objekt-ID abgeleitet und ändern den Spielstand nicht. */
export interface ExposeQuelle {
  id: string
  typ: ImmoTyp
  lage: ImmoLage
  stadt: string
  preis: number
  /** Objekt wurde im Spiel modernisiert. */
  saniert?: boolean
}

export const ENERGIEKLASSEN = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
export type Energieklasse = (typeof ENERGIEKLASSEN)[number]
/** Typischer Endenergiebedarf in kWh/(m²·a) je Klasse. */
const ENERGIE_KWH = [24, 42, 62, 88, 118, 148, 182, 228, 285]

export interface Expose {
  /** Wohn-/Nutzfläche bzw. Grundstücksgröße (Bauland) in m². */
  flaeche: number
  grundstueck: number
  /** Zimmer (Wohnobjekte) bzw. Einheiten (Mehrfamilienhaus, Gewerbe); 0 bei Bauland. */
  zimmer: number
  einheitenName: 'Zimmer' | 'Wohneinheiten' | 'Einheiten' | ''
  baujahr: number | null
  /** Etage bzw. Geschosse als Anzeigetext. */
  geschoss: string
  etage: number
  etagen: number
  energie: Energieklasse | null
  energieKwh: number | null
  preisProQm: number
  titel: string
  beschreibung: string
  lageText: string
  ausstattung: string[]
  badges: string[]
  makler: { name: string; firma: string; initialen: string }
  /** Entfernungen für die Lagekarte. */
  lageDaten: { zentrum: string; bahn: string; schule: string; einkauf: string; park: string }
  /** Zufallswert 0–2^31 für die Gestaltung der Bilder (Farben, Fenster, Bäume). */
  seed: number
}

const hash = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 2 ** 31
}

const STADT_FAKTOR: Record<string, number> = {
  München: 1.35, Zürich: 1.5, Hamburg: 1.15, Wien: 1.1, Köln: 1.0, Leipzig: 0.8, Lissabon: 1.0, Porto: 0.85, Valencia: 0.9,
  Mailand: 1.2, Graz: 0.85, Rotterdam: 0.95, Antwerpen: 0.9, Krakau: 0.7, Prag: 0.85, Kopenhagen: 1.25, Split: 0.9, Málaga: 1.0,
}
const WAHRZEICHEN: Record<string, string> = {
  Hamburg: 'der Alster', München: 'der Isar', Köln: 'dem Rhein', Wien: 'der Donau', Zürich: 'dem Zürichsee', Leipzig: 'dem Auwald',
  Lissabon: 'dem Tejo', Porto: 'dem Douro', Valencia: 'dem Strand', Mailand: 'den Navigli', Graz: 'der Mur', Rotterdam: 'der Maas',
  Antwerpen: 'der Schelde', Krakau: 'der Weichsel', Prag: 'der Moldau', Kopenhagen: 'dem Hafen', Split: 'der Adria', Málaga: 'dem Mittelmeer',
}

/** Richtpreis pro m² (mittlere Lage, Stadtfaktor 1) und erlaubter Bereich der Fläche. */
const QM: Record<ImmoTyp, { ppm: number; min: number; max: number; raum: number }> = {
  apartment: { ppm: 3600, min: 16, max: 34, raum: 28 },
  wohnung: { ppm: 2800, min: 38, max: 150, raum: 27 },
  mfh: { ppm: 1700, min: 240, max: 900, raum: 70 },
  gewerbe: { ppm: 2400, min: 260, max: 2200, raum: 200 },
  ferienhaus: { ppm: 3200, min: 60, max: 220, raum: 28 },
  bauland: { ppm: 160, min: 300, max: 2200, raum: 1 },
  eigenheim: { ppm: 2900, min: 95, max: 260, raum: 33 },
  villa: { ppm: 7500, min: 260, max: 900, raum: 48 },
}

const pick = <T>(rng: Rng, liste: readonly T[]): T => liste[rng.int(0, liste.length - 1)]

const VORNAMEN = ['Anna', 'Julia', 'Sophie', 'Lena', 'Marie', 'Clara', 'Katharina', 'Elena', 'Paul', 'Lukas', 'Jonas', 'Felix', 'Maximilian', 'Tobias', 'Stefan', 'Marco', 'Nina', 'Carla']
const NACHNAMEN = ['Berger', 'Keller', 'Hartmann', 'Vogel', 'Lindner', 'Brandt', 'Neumann', 'Roth', 'Winkler', 'Albrecht', 'Sommer', 'Engel', 'Ferrari', 'Costa', 'Novak', 'Lund']
const FIRMEN = (stadt: string, nachname: string): string[] => [
  `${stadt} Immobilien ${nachname}`, `${nachname} & Partner Immobilien`, `Prime Estates ${stadt}`, `Hausgold ${stadt}`, `Kontor ${stadt} Real Estate`, `Stadtkern Immobilien`,
]

const ADJ: Record<ImmoTyp, readonly string[]> = {
  apartment: ['Kompaktes', 'Smartes', 'Gut geschnittenes', 'Helles'],
  wohnung: ['Lichtdurchflutete', 'Charmante', 'Moderne', 'Gepflegte', 'Großzügige'],
  mfh: ['Solides', 'Renditestarkes', 'Gepflegtes', 'Voll vermietetes'],
  gewerbe: ['Repräsentatives', 'Flexibel nutzbares', 'Modernes', 'Hochwertig ausgebautes'],
  ferienhaus: ['Gemütliches', 'Traumhaftes', 'Sonniges', 'Stilvolles'],
  bauland: ['Voll erschlossenes', 'Sonniges', 'Ruhig gelegenes', 'Baureifes'],
  eigenheim: ['Freistehendes', 'Familienfreundliches', 'Gepflegtes', 'Großzügiges'],
  villa: ['Exklusive', 'Architektonisch einzigartige', 'Spektakuläre', 'Repräsentative'],
}
const NOMEN: Record<ImmoTyp, string> = {
  apartment: 'Apartment', wohnung: 'Eigentumswohnung', mfh: 'Mehrfamilienhaus', gewerbe: 'Gewerbeobjekt', ferienhaus: 'Ferienhaus',
  bauland: 'Baugrundstück', eigenheim: 'Einfamilienhaus', villa: 'Villa',
}
const LAGE_ZUSATZ: Record<ImmoLage, readonly string[]> = {
  einfach: ['in ruhiger Wohnlage', 'mit guter Anbindung', 'zum fairen Preis'],
  mittel: ['in beliebter Lage', 'in gefragter Nachbarschaft', 'mit sehr guter Infrastruktur'],
  top: ['in absoluter Toplage', 'in exklusiver Lage', 'in begehrter Lage'],
}

const AUSSTATTUNG: Record<ImmoTyp, { basis: string[]; luxus: string[] }> = {
  apartment: { basis: ['Einbauküche', 'Laminat', 'Kellerabteil', 'Fahrradraum', 'Internet inklusive'], luxus: ['Balkon', 'Fußbodenheizung', 'Aufzug', 'Smart-Home'] },
  wohnung: { basis: ['Einbauküche', 'Parkett', 'Kellerabteil', 'Balkon', 'Aufzug'], luxus: ['Dachterrasse', 'Fußbodenheizung', 'Tiefgaragenstellplatz', 'Smart-Home', 'Concierge'] },
  mfh: { basis: ['Zentrale Heizung', 'Kellerräume', 'Waschküche', 'Balkone', 'Gepflegtes Treppenhaus'], luxus: ['Aufzug', 'Photovoltaik', 'Neue Fenster', 'Fassadendämmung'] },
  gewerbe: { basis: ['Klimaanlage', 'Glasfaser', 'Stellplätze', 'Barrierefrei', 'Teeküchen'], luxus: ['Empfang', 'Serverraum', 'Dachterrasse', 'Tiefgarage', 'Konferenzbereich'] },
  ferienhaus: { basis: ['Terrasse', 'Garten', 'Klimaanlage', 'Grillplatz', 'Stellplatz'], luxus: ['Meerblick', 'Pool', 'Sauna', 'Outdoor-Küche', 'Bootsliegeplatz'] },
  bauland: { basis: ['Voll erschlossen', 'Baureif', 'Ebene Fläche', 'Strom und Wasser am Grundstück', 'Kein Denkmalschutz'], luxus: ['Südausrichtung', 'Baugenehmigung liegt vor', 'Fernblick', 'Seezugang in der Nähe'] },
  eigenheim: { basis: ['Garten', 'Garage', 'Keller', 'Terrasse', 'Einbauküche'], luxus: ['Kamin', 'Fußbodenheizung', 'Photovoltaik', 'Wärmepumpe', 'Smart-Home', 'Sauna'] },
  villa: { basis: ['Parkgrundstück', 'Doppelgarage', 'Fußbodenheizung', 'Smart-Home', 'Videoüberwachung'], luxus: ['Pool', 'Heimkino', 'Wellnessbereich', 'Weinkeller', 'Gästehaus', 'Aufzug', 'Panoramafenster'] },
}

const BESCHREIBUNG: Record<ImmoTyp, readonly string[]> = {
  apartment: [
    'Dieses kompakte {zimmer}-Zimmer-Apartment mit {flaeche} m² ist ideal für Studierende und Berufseinsteiger. Der durchdachte Grundriss nutzt jeden Quadratmeter, und die Wohnung ist bei Mietern sehr gefragt.',
    'Clever geschnittenes Apartment auf {flaeche} m², Baujahr {baujahr}. Die Lage nahe {wahrzeichen} sorgt für konstant hohe Nachfrage und verlässliche Mieteinnahmen.',
  ],
  wohnung: [
    'Diese {zimmer}-Zimmer-Wohnung mit {flaeche} m² überzeugt durch einen hellen, offenen Wohnbereich und eine moderne Ausstattung. Baujahr {baujahr}, bezugsfertig und sofort vermietbar.',
    'Gepflegte Eigentumswohnung in einem gut verwalteten Haus. Auf {flaeche} m² verteilen sich {zimmer} Zimmer, großzügige Fensterflächen sorgen für viel Tageslicht. Eine sichere Kapitalanlage nahe {wahrzeichen}.',
  ],
  mfh: [
    'Solides Mehrfamilienhaus mit {zimmer} Wohneinheiten auf {flaeche} m² Wohnfläche. Baujahr {baujahr}, ein stabiler Mietermix und laufende Instandhaltung sorgen für verlässliche Erträge.',
    'Renditeobjekt mit {zimmer} Einheiten und gepflegtem Gemeinschaftsbereich. Das Haus liegt unweit von {wahrzeichen} und ist seit Jahren nahezu voll vermietet.',
  ],
  gewerbe: [
    'Repräsentatives Gewerbeobjekt mit {flaeche} m² Nutzfläche, aufgeteilt in {zimmer} flexibel nutzbare Einheiten. Hohe Frequenz, gute Verkehrsanbindung und moderne Gebäudetechnik.',
    'Büro- und Ladenflächen auf {flaeche} m², Baujahr {baujahr}. Die Mieterstruktur ist breit gestreut, das Objekt liegt in unmittelbarer Nähe zu {wahrzeichen}.',
  ],
  ferienhaus: [
    'Ihr Rückzugsort nahe {wahrzeichen}: {zimmer} Zimmer auf {flaeche} m² mit sonniger Terrasse und eigenem Garten. Ganzjährig vermietbar und selbst nutzbar.',
    'Charmantes Ferienhaus, Baujahr {baujahr}, mit {zimmer} Zimmern und viel Platz im Freien. Ideal für Urlauber, die Ruhe und Meeresbrise suchen.',
  ],
  bauland: [
    'Voll erschlossenes Baugrundstück mit {flaeche} m² in ruhiger Umgebung. Bebauung nach §34 BauGB möglich, Strom, Wasser und Kanal liegen an. Eine seltene Gelegenheit nahe {wahrzeichen}.',
    'Sonniges, ebenes Grundstück mit {flaeche} m², Ausrichtung nach Süden. Der Bebauungsplan erlaubt ein Einfamilienhaus mit Garten. Bodengutachten liegt vor.',
  ],
  eigenheim: [
    'Freistehendes Einfamilienhaus mit {zimmer} Zimmern auf {flaeche} m² Wohnfläche, Baujahr {baujahr}. Offener Wohn- und Essbereich, ein pflegeleichter Garten und viel Platz für die Familie.',
    'Ein Zuhause zum Ankommen: {flaeche} m² Wohnfläche, {zimmer} Zimmer, Terrasse und Garage. Die ruhige Nachbarschaft nahe {wahrzeichen} bietet Schulen und Einkauf in unmittelbarer Nähe.',
  ],
  villa: [
    'Architektonisches Meisterwerk auf {grundstueck} m² Parkgrundstück: {zimmer} Zimmer auf {flaeche} m², Panoramafenster und ein großzügiger Außenbereich mit Pool. Diskretion und Privatsphäre inklusive.',
    'Exklusive Villa, Baujahr {baujahr}, mit {zimmer} Zimmern, Wellnessbereich und separatem Gästebereich. Ein Anwesen der Spitzenklasse nahe {wahrzeichen}.',
  ],
}

const LAGE_BESCHREIBUNG: Record<ImmoLage, readonly string[]> = {
  einfach: [
    'Die ruhige Wohngegend liegt etwas abseits vom Zentrum. Einkaufsmöglichkeiten, Bus und Straßenbahn erreichen Sie in wenigen Minuten.',
    'Eine solide Nachbarschaft mit guter Anbindung: Supermarkt, Kita und Haltestelle sind fußläufig erreichbar.',
  ],
  mittel: [
    'Das beliebte Viertel bietet Cafés, Parks und eine hervorragende Infrastruktur. Das Stadtzentrum erreichen Sie in 15 Minuten.',
    'Gefragte Nachbarschaft mit Wochenmarkt, Schulen und guter Anbindung an Nahverkehr und Autobahn.',
  ],
  top: [
    'Absolute Spitzenlage in einer der gefragtesten Adressen der Stadt: Restaurants, Boutiquen und Promenade liegen vor der Haustür.',
    'Exklusive Adresse mit Blick ins Grüne und kurzen Wegen zur Altstadt. Diese Lage ist langfristig wertstabil.',
  ],
}

const LAGE_DATEN: Record<ImmoLage, { zentrum: [number, number]; bahn: [number, number]; schule: [number, number]; einkauf: [number, number]; park: [number, number] }> = {
  einfach: { zentrum: [4, 9], bahn: [600, 1400], schule: [500, 1100], einkauf: [400, 900], park: [600, 1500] },
  mittel: { zentrum: [1.5, 4], bahn: [250, 700], schule: [300, 800], einkauf: [150, 450], park: [200, 700] },
  top: { zentrum: [0.3, 1.5], bahn: [100, 350], schule: [300, 700], einkauf: [60, 250], park: [80, 400] },
}

export function exposeVon(q: ExposeQuelle): Expose {
  const seed = hash(q.id + q.typ)
  const rng = createRng(seed)
  const typ = QM[q.typ]
  const lage = IMMO_LAGEN[q.lage]
  const stadtFaktor = STADT_FAKTOR[q.stadt] ?? 1
  const wahrzeichen = WAHRZEICHEN[q.stadt] ?? 'dem Zentrum'

  // Fläche aus Preis und ortsüblichem Quadratmeterpreis
  const ppm = typ.ppm * lage.preis * stadtFaktor * (0.92 + rng.next() * 0.16)
  const flaeche = Math.round(Math.max(typ.min, Math.min(typ.max, q.preis / ppm)))
  const preisProQm = Math.round(q.preis / flaeche)

  // Baujahr: Toplagen eher modern, einfache eher älter
  const alter = rng.next()
  const modern = q.lage === 'top' ? 0.45 : q.lage === 'mittel' ? 0.3 : 0.15
  const alt = q.lage === 'einfach' ? 0.35 : 0.2
  const baujahr = q.typ === 'bauland' ? null : alter < modern ? rng.int(2014, 2024) : alter > 1 - alt ? rng.int(1890, 1959) : rng.int(1960, 2013)

  // Energieklasse aus dem Baujahr, Modernisierung verbessert um zwei Stufen
  let energie: Energieklasse | null = null
  let energieKwh: number | null = null
  if (baujahr !== null) {
    let idx = Math.round((2025 - baujahr) / 13) + rng.int(-1, 1)
    if (q.saniert) idx -= 2
    idx = Math.max(0, Math.min(ENERGIEKLASSEN.length - 1, idx))
    energie = ENERGIEKLASSEN[idx]
    energieKwh = ENERGIE_KWH[idx] + rng.int(-4, 4)
  }

  // Zimmer / Einheiten und Geschosse
  let zimmer = q.typ === 'bauland' ? 0 : Math.max(1, Math.round(flaeche / typ.raum))
  if (q.typ === 'apartment') zimmer = flaeche >= 28 ? 2 : 1
  const einheitenName = q.typ === 'bauland' ? '' : q.typ === 'mfh' ? 'Wohneinheiten' : q.typ === 'gewerbe' ? 'Einheiten' : 'Zimmer'
  const etagen = q.typ === 'apartment' || q.typ === 'wohnung' ? rng.int(3, 8) : q.typ === 'mfh' ? rng.int(3, 5) : q.typ === 'gewerbe' ? rng.int(3, 9) : q.typ === 'villa' ? 2 : q.typ === 'bauland' ? 0 : rng.int(1, 2)
  const etage = q.typ === 'apartment' || q.typ === 'wohnung' ? rng.int(1, etagen) : 1
  const geschoss = q.typ === 'apartment' || q.typ === 'wohnung'
    ? `${etage}. OG von ${etagen}`
    : q.typ === 'bauland' ? 'unbebaut' : `${etagen} ${etagen === 1 ? 'Geschoss' : 'Geschosse'}`

  const grundstueck = Math.round(
    q.typ === 'bauland' ? flaeche
      : q.typ === 'eigenheim' ? flaeche * (3 + rng.next() * 2)
        : q.typ === 'villa' ? flaeche * (5 + rng.next() * 3)
          : q.typ === 'ferienhaus' ? flaeche * (2.5 + rng.next() * 2)
            : q.typ === 'mfh' || q.typ === 'gewerbe' ? flaeche * (1 + rng.next() * 0.5)
              : 0,
  )

  const titel = `${pick(rng, ADJ[q.typ])} ${NOMEN[q.typ]} ${pick(rng, LAGE_ZUSATZ[q.lage])}`

  const fuelle = (t: string): string =>
    t.replaceAll('{zimmer}', String(zimmer)).replaceAll('{flaeche}', String(flaeche)).replaceAll('{grundstueck}', String(grundstueck))
      .replaceAll('{baujahr}', String(baujahr ?? '–')).replaceAll('{wahrzeichen}', wahrzeichen)
  let beschreibung = fuelle(pick(rng, BESCHREIBUNG[q.typ]))
  if (q.saniert) beschreibung += ' Das Objekt wurde kürzlich umfassend modernisiert.'
  const lageText = `${q.stadt}: ${pick(rng, LAGE_BESCHREIBUNG[q.lage])}`

  // Ausstattung: Basis plus bei guter Lage mehr Luxus
  const a = AUSSTATTUNG[q.typ]
  const nBasis = rng.int(2, 3)
  const nLuxus = q.lage === 'top' ? rng.int(3, 4) : q.lage === 'mittel' ? rng.int(1, 2) : rng.int(0, 1)
  const mische = (liste: string[], n: number): string[] => {
    const rest = [...liste]
    const out: string[] = []
    while (out.length < n && rest.length) out.push(rest.splice(rng.int(0, rest.length - 1), 1)[0])
    return out
  }
  const ausstattung = [...mische(a.basis, nBasis), ...mische(a.luxus, nLuxus)]
  if (q.saniert) ausstattung.unshift('Kernsaniert')

  const badges: string[] = []
  if (rng.chance(0.55)) badges.push('Neu im Angebot')
  if (rng.chance(0.3)) badges.push('Provisionsfrei')
  if (rng.chance(0.2)) badges.push('Preis gesenkt')
  if (q.lage === 'top' || q.typ === 'villa') badges.push('Exklusiv')
  if (q.saniert) badges.push('Saniert')

  const vorname = pick(rng, VORNAMEN)
  const nachname = pick(rng, NACHNAMEN)
  const makler = { name: `${vorname} ${nachname}`, firma: pick(rng, FIRMEN(q.stadt, pick(rng, NACHNAMEN))), initialen: `${vorname[0]}${nachname[0]}` }

  const ld = LAGE_DATEN[q.lage]
  const zahl = ([lo, hi]: [number, number]) => lo + rng.next() * (hi - lo)
  const km = (n: number) => `${n.toFixed(1).replace('.', ',')} km`
  const m = (n: number) => (n >= 1000 ? km(n / 1000) : `${Math.round(n / 10) * 10} m`)
  const lageDaten = { zentrum: km(zahl(ld.zentrum)), bahn: m(zahl(ld.bahn)), schule: m(zahl(ld.schule)), einkauf: m(zahl(ld.einkauf)), park: m(zahl(ld.park)) }

  return { flaeche, grundstueck, zimmer, einheitenName, baujahr, geschoss, etage, etagen, energie, energieKwh, preisProQm, titel, beschreibung, lageText, ausstattung, badges, makler, lageDaten, seed }
}

