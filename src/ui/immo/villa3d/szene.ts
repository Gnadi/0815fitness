import * as THREE from 'three'
import { createRng } from '../../../engine/rng'
import { kausticTextur, werkzeug } from './bausteine'
import type { ImmoLage } from '../../../engine/types'

/** Tageszeit bzw. Wetter der 3D-Ansicht. */
export type Stimmung = 'bedeckt' | 'tag' | 'abend' | 'nacht'
export const STIMMUNGEN: { id: Stimmung; label: string }[] = [
  { id: 'bedeckt', label: 'Bedeckt' },
  { id: 'tag', label: 'Tag' },
  { id: 'abend', label: 'Abend' },
  { id: 'nacht', label: 'Nacht' },
]

/** Lichtverhältnisse einer Stimmung (Farben als 0xRRGGBB). */
export interface Himmel {
  oben: number
  horizont: number
  sonne: number
  sonneIntensitaet: number
  sonnePos: [number, number, number]
  hemiOben: number
  hemiUnten: number
  hemiIntensitaet: number
  nebel: number
  nebelDichte: number
  belichtung: number
  /** Leuchtkraft der Innenräume (0 = aus). */
  innenLicht: number
  /** Gartenleuchten und Poolbeleuchtung. */
  aussenLicht: number
  sterne: number
}

export const HIMMEL: Record<Stimmung, Himmel> = {
  bedeckt: { oben: 0x8a9aa8, horizont: 0xd3dbe0, sonne: 0xffffff, sonneIntensitaet: 1.0, sonnePos: [20, 30, 18], hemiOben: 0xdfe8ee, hemiUnten: 0x7d8f6a, hemiIntensitaet: 1.2, nebel: 0xc4cdd3, nebelDichte: 0.006, belichtung: 0.95, innenLicht: 0, aussenLicht: 0, sterne: 0 },
  tag: { oben: 0x4f9fe0, horizont: 0xcfe8f8, sonne: 0xfff1d6, sonneIntensitaet: 3.7, sonnePos: [25, 34, 20], hemiOben: 0xbfe0ff, hemiUnten: 0x6c9a58, hemiIntensitaet: 0.5, nebel: 0xcfe3f2, nebelDichte: 0.0045, belichtung: 1.0, innenLicht: 0, aussenLicht: 0, sterne: 0 },
  abend: { oben: 0x4a5fb0, horizont: 0xffc58a, sonne: 0xffb87c, sonneIntensitaet: 2.4, sonnePos: [30, 10, 30], hemiOben: 0xbfd0f0, hemiUnten: 0x5b8a4e, hemiIntensitaet: 0.7, nebel: 0xe9c5a5, nebelDichte: 0.0032, belichtung: 0.95, innenLicht: 0.75, aussenLicht: 0.5, sterne: 0 },
  nacht: { oben: 0x070d22, horizont: 0x1f2c52, sonne: 0x9fb4ff, sonneIntensitaet: 0.7, sonnePos: [-20, 30, 25], hemiOben: 0x4a5a95, hemiUnten: 0x1c2a3c, hemiIntensitaet: 0.4, nebel: 0x0e1a3c, nebelDichte: 0.006, belichtung: 1.1, innenLicht: 1.4, aussenLicht: 1, sterne: 1 },
}

/** Passende Anfangsstimmung zur Lage des Objekts. */
export const standardStimmung = (lage: ImmoLage): Stimmung => (lage === 'einfach' ? 'bedeckt' : lage === 'mittel' ? 'tag' : 'abend')

export interface VillaParameter {
  seed: number
  lage: ImmoLage
  /** Wohnfläche in m²; bestimmt die Länge des Hauses. */
  flaeche: number
  /** Geschosse (Mehrfamilienhaus); ohne Angabe aus Seed und Fläche. */
  etagen?: number
  /** Zimmer bzw. Wohneinheiten (nur Mehrfamilienhaus). */
  zimmer?: number
}

export interface VillaSzene {
  gruppe: THREE.Group
  /** Wasserflächen, deren Textur animiert wird. */
  wasser: THREE.Mesh[]
  /** Materialien der leuchtenden Innenräume (Intensität nach Stimmung). */
  innenMaterial: THREE.MeshStandardMaterial[]
  /** Warme Lichtquellen im Haus. */
  innenLichter: THREE.PointLight[]
  /** Gartenleuchten (Lampen und Poolbeleuchtung). */
  aussenLichter: THREE.PointLight[]
  aussenMaterial: THREE.MeshStandardMaterial[]
  /** Objekte, die leicht im Wind schwanken (Baumkronen, Palmwedel). */
  schwankend: { obj: THREE.Object3D; phase: number; amp: number }[]
  /** Ungefähre Ausdehnung des Grundstücks für die Kamera. */
  groesse: { breite: number; tiefe: number; hoehe: number }
  /** Blickpunkt der Kamera. */
  ziel: [number, number, number]
  /** Startposition der Kamera (nur wenn vom Standard abweichend). */
  kamera?: [number, number, number]
  entsorgen: () => void
}

const PLASTER = [0xf1eee6, 0xe8e4da, 0xdcdad4]
const HOLZ = [0x8a6a4a, 0x9a7650, 0x6f5238]
const AUTOS = [0x1a1c20, 0xd8dbe0, 0x8a1f1f, 0x2d4a73]

export function baueVilla(p: VillaParameter): VillaSzene {
  const rng = createRng(p.seed)
  const w = werkzeug(rng)
  const { gruppe, wasser, innenMaterial, innenLichter, aussenLichter, aussenMaterial, schwankend, std, kiste, innenWarm } = w

  const skala = Math.max(0.85, Math.min(1.3, p.flaeche / 420))
  const L = 15 * skala
  const W = 6.6
  const H1 = 3.2
  const H2 = 3.0
  const L2 = L * 0.8
  const W2 = 5.6
  const luxus = p.lage === 'top' ? 1 : p.lage === 'mittel' ? 0.6 : 0.3

  // ---------------------------------------------------------------- Material
  const putz = std(PLASTER[rng.int(0, PLASTER.length - 1)], 0.92)
  const holz = std(HOLZ[rng.int(0, HOLZ.length - 1)], 0.75)
  const platte = std(0x2b2d31, 0.6, 0.15)
  const stein = std(0xc2b9a6, 0.85)
  const dunkel = std(0x33363b, 0.5, 0.3)
  const glas = w.glas
  const rahmen = w.rahmen
  const kies = std(0xb8b2a4, 1)
  const hecke = std(0x3f7a40, 1)

  // ---------------------------------------------------------------- Boden
  w.wiese(0x4f8c45)

  // Zufahrt und Hof
  kiste(4.6, 0.06, 26, kies, L / 2 - 0.12 * L, 0.03, W / 2 + 12, gruppe, false)
  kiste(L + 6, 0.06, 4.2, kies, 0, 0.03, W / 2 + 2.3, gruppe, false)

  // ---------------------------------------------------------------- Haus
  const haus = new THREE.Group()
  gruppe.add(haus)
  kiste(L, H1, W, putz, 0, H1 / 2, 0, haus)
  kiste(L + 1.0, 0.3, W + 1.0, platte, 0, H1 + 0.15, 0, haus)
  const x2 = L * 0.09
  kiste(L2, H2, W2, putz, x2, H1 + 0.3 + H2 / 2, -0.3, haus)
  kiste(L2 + 1.2, 0.35, W2 + 1.2, platte, x2, H1 + 0.3 + H2 + 0.175, -0.3, haus)
  // Dachgarten mit Pflanzkübeln
  for (let i = 0; i < 3; i++) kiste(1.2, 0.5, 0.5, stein, x2 - L2 / 2 + 1.5 + i * 2.2, H1 + 0.3 + H2 + 0.6, -0.3 + W2 / 2 - 0.2, haus)

  // Obergeschoss: Glasfront mit Rahmen und Innenleben
  const glasB2 = L2 * 0.8
  const glasZ2 = -0.3 + W2 / 2 + 0.03
  const y2 = H1 + 0.3 + H2 / 2
  kiste(glasB2, H2 - 0.6, 0.06, glas, x2 - L2 * 0.06, y2, glasZ2, haus, false)
  const pfosten2 = Math.round(glasB2 / 1.8)
  for (let i = 0; i <= pfosten2; i++) kiste(0.07, H2 - 0.6, 0.1, rahmen, x2 - L2 * 0.06 - glasB2 / 2 + (glasB2 / pfosten2) * i, y2, glasZ2 + 0.02, haus, false)
  kiste(glasB2 + 0.1, 0.08, 0.1, rahmen, x2 - L2 * 0.06, y2 + (H2 - 0.6) / 2, glasZ2 + 0.02, haus, false)
  kiste(L2 - 0.4, 0.1, W2 - 0.6, innenWarm(0.5), x2, H1 + 0.36, -0.3, haus, false)
  kiste(2.6, 0.5, 1.0, std(0x4a4f58, 0.9), x2 - 1.5, H1 + 0.7, -0.3 + W2 / 2 - 1.2, haus)
  kiste(2.0, 0.9, 0.9, std(0xf3efe6, 0.9), x2 + 2.8, H1 + 0.8, -0.3, haus)
  const lampe2 = new THREE.PointLight(0xffc770, 0, 14, 1.6)
  lampe2.position.set(x2, H1 + 2.6, -0.3)
  haus.add(lampe2)
  innenLichter.push(lampe2)

  // Erdgeschoss: Wohnbereich (Glas), Pfeiler, Eingang, Garage (Holz)
  const zF = W / 2 + 0.03
  const wohnB = L * 0.58
  const wohnX = -L / 2 + wohnB / 2 + 0.3
  kiste(wohnB, H1 - 0.5, 0.06, glas, wohnX, H1 / 2, zF, haus, false)
  const pf = Math.round(wohnB / 1.9)
  for (let i = 0; i <= pf; i++) kiste(0.07, H1 - 0.5, 0.1, rahmen, wohnX - wohnB / 2 + (wohnB / pf) * i, H1 / 2, zF + 0.02, haus, false)
  kiste(wohnB + 0.1, 0.08, 0.1, rahmen, wohnX, H1 / 2 + (H1 - 0.5) / 2, zF + 0.02, haus, false)
  kiste(wohnB - 0.3, 0.1, W - 0.6, innenWarm(0.6), wohnX, 0.12, 0, haus, false)
  // Sofa, Tisch, Pendelleuchten
  kiste(3.2, 0.5, 1.0, std(0x6b7078, 0.95), wohnX - 1.0, 0.45, 1.3, haus)
  kiste(3.2, 0.5, 0.3, std(0x6b7078, 0.95), wohnX - 1.0, 0.85, 0.8, haus)
  kiste(1.6, 0.35, 0.9, holz, wohnX - 1.0, 0.3, 2.3, haus)
  kiste(2.2, 0.08, 1.1, holz, wohnX + 3.0, 0.8, 1.2, haus)
  for (let i = 0; i < 2; i++) {
    const lampe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), innenWarm(1))
    lampe.position.set(wohnX + 2.4 + i * 1.2, H1 - 0.9, 1.2)
    haus.add(lampe)
  }
  const lampe1 = new THREE.PointLight(0xffc770, 0, 16, 1.6)
  lampe1.position.set(wohnX, H1 - 0.6, 1.0)
  haus.add(lampe1)
  innenLichter.push(lampe1)
  // Seitenwand links: großes Glas
  kiste(0.06, H1 - 0.5, W - 1.2, glas, -L / 2 - 0.03, H1 / 2, 0, haus, false)
  kiste(0.1, H1 - 0.5, 0.07, rahmen, -L / 2 - 0.04, H1 / 2, 0, haus, false)
  // Pfeiler, Eingang, Garage
  const stein2 = L * 0.05
  kiste(stein2, H1, 0.4, stein, -L / 2 + wohnB + 0.3 + stein2 / 2, H1 / 2, W / 2 + 0.2, haus)
  const eingX = -L / 2 + wohnB + 0.3 + stein2 + L * 0.06
  kiste(L * 0.12, H1 - 0.2, 0.2, putz, eingX, (H1 - 0.2) / 2, W / 2 - 0.15, haus)
  kiste(1.0, 2.3, 0.08, dunkel, eingX, 1.15, W / 2 + 0.0, haus)
  kiste(0.08, 0.6, 0.06, stein, eingX + 0.35, 1.1, W / 2 + 0.06, haus, false)
  const garX = L / 2 - L * 0.125
  kiste(L * 0.25, H1 - 0.2, 0.2, holz, garX, (H1 - 0.2) / 2, W / 2 + 0.05, haus)
  for (let i = 0; i < 9; i++) kiste(L * 0.23, 0.04, 0.05, dunkel, garX, 0.35 + i * 0.28, W / 2 + 0.16, haus, false)
  // Rückseite und rechte Seite: Holz und kleine Fenster
  kiste(0.12, H1 - 0.3, W - 0.6, holz, L / 2 + 0.02, H1 / 2, 0, haus)
  for (let i = 0; i < 4; i++) kiste(1.1, 0.9, 0.05, dunkel, -L / 2 + 2 + i * (L / 4.3), 1.6, -W / 2 - 0.03, haus, false)
  for (let i = 0; i < 3; i++) kiste(1.1, 0.9, 0.05, dunkel, x2 - L2 / 2 + 2 + i * (L2 / 3.4), y2, -0.3 - W2 / 2 - 0.03, haus, false)
  // Holzblende am Obergeschoss
  kiste(L2 * 0.22, H2 - 0.2, 0.12, holz, x2 + L2 / 2 - L2 * 0.11, y2, -0.3 + W2 / 2 + 0.06, haus)

  // ---------------------------------------------------------------- Pool und Terrasse
  const pB = L * 0.56
  const pT = 4.2
  const pX = -L / 2 + pB / 2 + 0.6
  const pZ = W / 2 + 2.2 + pT / 2
  const deck = new THREE.Shape()
  const dB = L + 4
  const dT = 10
  deck.moveTo(-dB / 2, 0)
  deck.lineTo(dB / 2, 0)
  deck.lineTo(dB / 2, dT)
  deck.lineTo(-dB / 2, dT)
  deck.lineTo(-dB / 2, 0)
  const loch = new THREE.Path()
  // Die Terrasse beginnt bei z = W/2 + 0.2; das Loch liegt in denselben Formkoordinaten
  const lochZ0 = pZ - pT / 2 - (W / 2 + 0.2)
  const lochZ1 = pZ + pT / 2 - (W / 2 + 0.2)
  loch.moveTo(pX - pB / 2, lochZ0)
  loch.lineTo(pX + pB / 2, lochZ0)
  loch.lineTo(pX + pB / 2, lochZ1)
  loch.lineTo(pX - pB / 2, lochZ1)
  loch.lineTo(pX - pB / 2, lochZ0)
  deck.holes.push(loch)
  const terrasse = new THREE.Mesh(new THREE.ExtrudeGeometry(deck, { depth: 0.14, bevelEnabled: false }), stein)
  terrasse.rotation.x = Math.PI / 2
  terrasse.position.set(0, 0.14, W / 2 + 0.2)
  terrasse.receiveShadow = true
  terrasse.castShadow = true
  gruppe.add(terrasse)
  // Becken (Innenseiten) und Wasser
  const becken = new THREE.Mesh(new THREE.BoxGeometry(pB, 1.7, pT), new THREE.MeshStandardMaterial({ color: 0x2f8fb0, roughness: 0.6, side: THREE.BackSide }))
  becken.position.set(pX, -0.7, pZ)
  becken.receiveShadow = true
  gruppe.add(becken)
  const wasserTex = kausticTextur(rng)
  const wasserMat = new THREE.MeshPhysicalMaterial({ color: 0x35b6d6, map: wasserTex, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.82, envMapIntensity: 1.4, clearcoat: 1 })
  const wasserFlaeche = new THREE.Mesh(new THREE.PlaneGeometry(pB - 0.05, pT - 0.05), wasserMat)
  wasserFlaeche.rotation.x = -Math.PI / 2
  wasserFlaeche.position.set(pX, 0.04, pZ)
  wasserFlaeche.receiveShadow = true
  gruppe.add(wasserFlaeche)
  wasser.push(wasserFlaeche)
  const poolLicht = new THREE.PointLight(0x4fe0ff, 0, 11, 1.8)
  poolLicht.position.set(pX, -0.2, pZ)
  gruppe.add(poolLicht)
  aussenLichter.push(poolLicht)
  // Wasser-Leuchtfläche (Unterwasserbeleuchtung) im Becken
  const leucht = std(0x9ff3ff, 0.4)
  leucht.emissive = new THREE.Color(0x4fe0ff)
  leucht.emissiveIntensity = 0
  aussenMaterial.push(leucht)
  kiste(pB - 0.4, 0.04, 0.12, leucht, pX, -0.5, pZ - pT / 2 + 0.07, gruppe, false)

  // Liegen und Sonnenschirm
  for (let i = 0; i < 3; i++) {
    const liege = new THREE.Group()
    kiste(0.7, 0.1, 1.5, std(0xf5f2ea, 0.8), 0, 0.38, 0, liege)
    const rueck = kiste(0.7, 0.1, 0.9, std(0xf5f2ea, 0.8), 0, 0.7, -0.95, liege)
    rueck.rotation.x = 0.55
    kiste(0.6, 0.38, 0.1, std(0x888888, 0.9), 0, 0.19, 0.6, liege)
    liege.position.set(pX - pB / 2 + 1.0 + i * 1.5, 0.14, pZ + pT / 2 + 1.3)
    liege.rotation.y = Math.PI + rng.next() * 0.2 - 0.1
    gruppe.add(liege)
  }
  const schirm = new THREE.Group()
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), dunkel)
  mast.position.y = 1.2
  schirm.add(mast)
  const dach = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.55, 12), std(rng.chance(0.5) ? 0xf2e9d4 : 0xd9f0f2, 0.9))
  dach.position.y = 2.5
  dach.castShadow = true
  schirm.add(dach)
  schirm.position.set(pX + pB / 2 + 1.4, 0.14, pZ + 0.4)
  gruppe.add(schirm)

  // ---------------------------------------------------------------- Auto
  w.auto(L / 2 - 0.12 * L, W / 2 + 9.5, Math.PI / 2 + (rng.next() - 0.5) * 0.1, AUTOS[rng.int(0, AUTOS.length - 1)])

  // ---------------------------------------------------------------- Garten
  const { rundbaum, zypresse, palme } = w
  const nachbar = L / 2 + 9
  const hinten = -W / 2 - 7
  zypresse(-nachbar, 2, 1.1)
  zypresse(-nachbar, 9, 1.0)
  zypresse(nachbar, -2, 1.15)
  zypresse(nachbar + 1, 7, 0.95)
  rundbaum(-L / 2 - 4.5, -3, 1.2)
  rundbaum(L / 2 + 5, -7, 1.3)
  rundbaum(0, hinten, 1.5)
  rundbaum(-L / 2 + 3, hinten + 1, 1.1)
  rundbaum(L / 2 - 4, hinten - 1, 1.2)
  rundbaum(-nachbar + 2, 18, 1.1)
  palme(pX - pB / 2 - 1.8, pZ - 1.4, 1.1)
  palme(pX + pB / 2 + 2.2, pZ + pT / 2 + 0.5, 1.0)
  if (luxus > 0.5) palme(-L / 2 + 0.4, W / 2 + 7.8, 0.95)

  // Hecken und Mauer
  const mauerZ = W / 2 + 21
  for (const [bx, bz, bw, bt] of [[-nachbar - 1, 8, 1.2, 28], [nachbar + 2, 8, 1.2, 28], [0, hinten - 5, nachbar * 2 + 4, 1.2]] as const) {
    const h = kiste(bw, 1.5, bt, hecke, bx, 0.75, bz, gruppe)
    h.receiveShadow = true
  }
  kiste(nachbar - 3, 0.9, 0.35, stein, -(nachbar - 3) / 2 - 3, 0.45, mauerZ, gruppe)
  kiste(nachbar - 3, 0.9, 0.35, stein, (nachbar - 3) / 2 + 6, 0.45, mauerZ, gruppe)
  for (const px of [L / 2 - 0.12 * L - 3, L / 2 - 0.12 * L + 3]) kiste(0.7, 1.7, 0.7, stein, px, 0.85, mauerZ, gruppe)

  // Gartenleuchten entlang der Zufahrt und am Haus
  for (let i = 0; i < 5; i++) {
    const poller = new THREE.Group()
    kiste(0.16, 0.8, 0.16, dunkel, 0, 0.4, 0, poller)
    const kopf = std(0xfff2cf, 0.4)
    kopf.emissive = new THREE.Color(0xffd48a)
    kopf.emissiveIntensity = 0
    aussenMaterial.push(kopf)
    kiste(0.2, 0.12, 0.2, kopf, 0, 0.86, 0, poller, false)
    poller.position.set(L / 2 - 0.12 * L + (i % 2 ? 2.6 : -2.6), 0, W / 2 + 5 + Math.floor(i / 2) * 7)
    gruppe.add(poller)
    if (i < 2) {
      const l = new THREE.PointLight(0xffd48a, 0, 8, 1.8)
      l.position.set(poller.position.x, 1.1, poller.position.z)
      gruppe.add(l)
      aussenLichter.push(l)
    }
  }

  // Wandleuchten und Eingangslicht
  const eingang = new THREE.PointLight(0xffd9a0, 0, 9, 1.8)
  eingang.position.set(eingX, 2.7, W / 2 + 1.2)
  gruppe.add(eingang)
  aussenLichter.push(eingang)

  return {
    gruppe, wasser, innenMaterial, innenLichter, aussenLichter, aussenMaterial, schwankend,
    groesse: { breite: L + 28, tiefe: 40, hoehe: H1 + H2 + 0.6 },
    ziel: [-1, (H1 + H2 + 0.6) * 0.38, 3],
    entsorgen: w.entsorgen,
  }
}
