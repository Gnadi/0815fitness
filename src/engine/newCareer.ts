import { VEREINE } from '../data/clubs'
import { createRng } from './rng'
import { baueSaison } from './saisonAufbau'
import { neueSaisonStats } from './season'
import { neueMitarbeiter } from './transfers'
import { jugendGehalt } from './wirtschaft'
import { createWelt } from './welt'
import { betreteWoche } from './week'
import { SAVE_VERSION } from './version'
import type { Archetype, Background, Career, Foot, Player, Position, Skills, Traits } from './types'

export interface NewCareerInput {
  vorname: string
  nachname: string
  nationalitaet: string
  /** Verein, dessen Jugend (U19) du angehörst. */
  vereinId: string
  position: Position
  fuss: Foot
  hintergrund: Background
  archetyp: Archetype
  seed?: number
}

const BASE_SKILLS: Skills = {
  tempo: 40, schuss: 40, pass: 40, dribbling: 40,
  defensive: 40, physis: 40, technik: 40, positionsspiel: 40,
}

const ARCHETYPE_SKILLS: Record<Archetype, Partial<Skills>> = {
  strassenfussballer: { dribbling: 10, technik: 8, tempo: 5, positionsspiel: -6 },
  akademietalent: { positionsspiel: 8, pass: 6, technik: 5, physis: -4 },
  spaetzuender: { physis: 8, defensive: 5, tempo: -4, technik: -3 },
}

const POSITION_SKILLS: Record<Position, Partial<Skills>> = {
  TW: { positionsspiel: 10, physis: 5, tempo: -8 },
  IV: { defensive: 12, physis: 8, tempo: -3 },
  AV: { tempo: 8, defensive: 6, pass: 3 },
  ZDM: { defensive: 8, pass: 6, positionsspiel: 5 },
  ZM: { pass: 10, technik: 4, positionsspiel: 4 },
  ZOM: { pass: 8, technik: 8, dribbling: 5 },
  AF: { tempo: 10, dribbling: 8, schuss: 4 },
  ST: { schuss: 12, positionsspiel: 6, physis: 3 },
}

/** Start-Boni/-Mali der Herkunft auf (Geld, Disziplin, Ehrgeiz, Ruf). */
const BACKGROUND: Record<Background, { geld: number; disziplin: number; ehrgeiz: number; ruf: number }> = {
  arbeiterfamilie: { geld: 500, disziplin: 5, ehrgeiz: 15, ruf: 0 },
  fussballerfamilie: { geld: 3000, disziplin: 0, ehrgeiz: 5, ruf: 8 },
  akademiker: { geld: 2000, disziplin: 10, ehrgeiz: 0, ruf: 0 },
}

const clamp = (n: number, lo = 1, hi = 100) => Math.max(lo, Math.min(hi, n))

/** Potenzial schief verteilt: die meisten Talente bleiben Durchschnitt, wenige werden Weltklasse. */
function wuerfelPotenzial(archetyp: Archetype, rng: ReturnType<typeof createRng>): number {
  const basis = 50 + 45 * rng.next() ** 1.6
  const mod = archetyp === 'akademietalent' ? 5 : archetyp === 'spaetzuender' ? rng.int(0, 6) : rng.int(-4, 6)
  return Math.round(clamp(basis + mod, 45, 96))
}

export function createCareer(input: NewCareerInput, startSaison = 2026): Career {
  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 32)
  const rng = createRng(seed)
  const bg = BACKGROUND[input.hintergrund]

  const skills = { ...BASE_SKILLS }
  for (const mod of [ARCHETYPE_SKILLS[input.archetyp], POSITION_SKILLS[input.position]]) {
    for (const [k, v] of Object.entries(mod) as [keyof Skills, number][]) skills[k] += v
  }
  for (const k of Object.keys(skills) as (keyof Skills)[]) skills[k] = clamp(skills[k] + rng.int(-4, 4))

  const traits: Traits = {
    moral: 60, selbstvertrauen: 50, disziplin: clamp(50 + bg.disziplin, 0), professionalitaet: 45,
    ehrgeiz: clamp(50 + bg.ehrgeiz, 0), ruf: bg.ruf, fanbeliebtheit: 0, trainerBeziehung: 50,
    kabine: 50, fitness: 80, gesundheit: 100, privatglueck: 60,
  }

  const spieler: Player = {
    vorname: input.vorname.trim(),
    nachname: input.nachname.trim(),
    geburtsdatum: `${startSaison - 16}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`,
    nationalitaet: input.nationalitaet,
    position: input.position,
    fuss: input.fuss,
    hintergrund: input.hintergrund,
    archetyp: input.archetyp,
    skills,
    traits,
    potenzial: wuerfelPotenzial(input.archetyp, rng),
    geld: bg.geld,
  }

  const welt = createWelt()
  const verein = VEREINE[input.vereinId]
  const now = Date.now()
  const basis: Career = {
    id: `c${now.toString(36)}${rng.int(0, 1295).toString(36)}`,
    version: SAVE_VERSION,
    erstellt: now,
    geaendert: now,
    seed,
    rngState: 0,
    uhr: { saison: startSaison, woche: 1 },
    wochenGesamt: 1,
    spieler,
    vereinId: input.vereinId,
    vertrag: { gehalt: jugendGehalt(input.vereinId), endeSaison: startSaison + 1, rolle: 'Jugend' },
    leihe: null,
    welt,
    saison: undefined as never,
    form: 50,
    spielpraxis: 0.5,
    verletzung: null,
    sperre: 0,
    training: 'ausgewogen',
    phase: 'planung',
    match: null,
    bericht: null,
    saisonBericht: null,
    saisonStats: undefined as never,
    historie: [],
    fenster: null,
    angebote: [],
    wechselwunsch: false,
    personen: neueMitarbeiter(verein.land, rng),
    ereignis: null,
    ereignisSchlange: [],
    geplant: [],
    ereignisZeiten: {},
    laufbahn: { titel: [], auszeichnungen: [], laenderspiele: 0, laenderspielTore: 0, transfers: [], hoechsterMarktwert: 0, skandale: 0 },
    erfolge: [],
    einstellungen: { autoSzenen: false },
    flags: { beraterGuete: 1 },
    log: [],
  }
  basis.saison = baueSaison(basis, rng, true)
  basis.saisonStats = neueSaisonStats(spieler, startSaison, input.vereinId, basis.saison.ligaId)
  basis.rngState = rng.state()

  // Erste Woche betreten (kann bereits ein Ereignis auslösen)
  const rng2 = createRng(basis.rngState)
  const c = betreteWoche(basis, rng2, true)
  return { ...c, rngState: rng2.state() }
}
