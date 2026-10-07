import * as THREE from 'three'
import { createRng } from '../../../engine/rng'
import { dachBauer, fensterBauer, werkzeug } from './bausteine'
import type { VillaParameter, VillaSzene } from './szene'

const PUTZ = [0xf2efe8, 0xede0c6, 0xd9d9d6, 0xf1e3b5, 0xcfd8dc]
const DACH = [{ f: '#b5523a', fuge: '#8a3a28' }, { f: '#3d4349', fuge: '#25292d' }, { f: '#7a4a38', fuge: '#583226' }]
const LADEN = [0x4f7a58, 0x3e5a7a, 0x8a3f3a, 0x6b6f75]
const TUEREN = [0x2f5a8a, 0x2f6b4a, 0x8a2f2f, 0x6b4a2f]
const AUTOS = [0x1c2a3a, 0xd8dbe0, 0x7a2222, 0x3a4a42]
const BLUMEN = [0xe84a5f, 0xffd23f, 0xf78fb3, 0xffffff, 0xa268d8, 0xff8c42]

/** Einfamilienhaus mit Satteldach, Garage, Garten, Terrasse und Spielgeräten als 3D-Szene. */
export function baueEigenheim(p: VillaParameter): VillaSzene {
  const rng = createRng(p.seed)
  const w = werkzeug(rng)
  const { gruppe, innenLichter, aussenLichter, schwankend, std, kiste, innenWarm, glas, rundbaum } = w

  const L = Math.max(8.8, Math.min(14.5, p.flaeche / 14))
  const B = 8.2
  const H = 5.3
  const rh = 2.9
  const doppelgarage = p.flaeche > 190 || rng.chance(0.25)
  const gL = doppelgarage ? 6.0 : 3.6
  const putzFarbe = PUTZ[rng.int(0, PUTZ.length - 1)]
  const dachWahl = DACH[rng.int(0, DACH.length - 1)]
  const ladenFarbe = LADEN[rng.int(0, LADEN.length - 1)]
  const mitLaeden = rng.chance(0.6)
  const putz = std(putzFarbe, 0.95)
  const sockel = std(0x8a8d90, 0.9)
  const weiss = std(0xf6f4ee, 0.7)
  const holz = std(0x9a7650, 0.8)
  const dunkelHolz = std(0x6b4a33, 0.85)
  const stein = std(0xc2b9a6, 0.85)
  const kies = std(0xb4aea0, 1)
  const hecke = std(0x3f7a40, 1)
  const tuerFarbe = TUEREN[rng.int(0, TUEREN.length - 1)]

  // Dach: Prisma plus Ziegelflächen, Firstkappe und verputzte Giebelseiten
  const giebeldach = dachBauer(w, { putz, dachHex: dachWahl.f, fuge: dachWahl.fuge })

  // ---------------------------------------------------------------- Boden
  w.wiese(0x55904a)
  const frontZ = B / 2 + 9
  const garX = L / 2 + gL / 2
  kiste(gL + 0.5, 0.06, frontZ - (B / 2 - 0.4), kies, garX, 0.03, (B / 2 - 0.4 + frontZ) / 2, gruppe, false)
  kiste(L + gL + 4, 0.05, 2.2, stein, gL / 2, 0.025, B / 2 + 1.1, gruppe, false)

  // ---------------------------------------------------------------- Haus
  kiste(L + 0.3, 0.45, B + 0.3, sockel, 0, 0.225, 0)
  kiste(L, H, B, putz, 0, H / 2, 0)
  // Geschossband
  kiste(L + 0.08, 0.14, B + 0.08, weiss, 0, 2.7, 0, gruppe, false)
  const dach = giebeldach(B + 1.3, rh, L + 1.3)
  dach.position.y = H
  gruppe.add(dach)

  // Gaube auf der Vorderseite
  const dz = B / 2 - 0.2
  const ys = H + rh * (1 - dz / (B / 2 + 0.65))
  const gx = -L * 0.18
  kiste(2.4, 1.7, 1.9, putz, gx, ys + 0.62, dz - 0.95)
  const gaubenDach = giebeldach(2.9, 0.85, 2.5)
  gaubenDach.rotation.y = Math.PI / 2
  gaubenDach.position.set(gx, ys + 1.45, dz - 0.95)
  gruppe.add(gaubenDach)

  // Schornstein
  const kamin = kiste(0.85, 2.2, 0.85, std(0x9a5a48, 0.95), L * 0.26, H + rh * 0.85, -0.3)
  kiste(1.05, 0.14, 1.05, std(0x55575b, 0.7), kamin.position.x, kamin.position.y + 1.15, kamin.position.z)

  // Fenster (Rahmen, Scheibe, warmer Innenraum, optional Läden)
  const fenster = fensterBauer(w, { rahmen: weiss, bank: stein, ladenHex: ladenFarbe })
  const spalten = Math.max(3, Math.round(L / 3.3))
  const tuerSpalte = rng.int(0, spalten - 1)
  let eingangX = 0
  for (let i = 0; i < spalten; i++) {
    const x = -L / 2 + (L / spalten) * (i + 0.5)
    fenster(x, 4.0, B / 2, 1.5, 1.55, 0, mitLaeden)
    if (i === tuerSpalte) { eingangX = x; continue }
    fenster(x, 1.5, B / 2, 1.5, 1.55, 0, mitLaeden)
  }
  for (const z of [-1.8, 1.8]) {
    fenster(-L / 2, 4.0, z, 1.3, 1.5, -Math.PI / 2, false)
    fenster(-L / 2, 1.5, z, 1.3, 1.5, -Math.PI / 2, false)
  }
  for (let i = 0; i < spalten; i++) {
    const x = -L / 2 + (L / spalten) * (i + 0.5)
    fenster(x, 4.0, -B / 2, 1.4, 1.5, Math.PI, false)
  }
  fenster(-L / 2 + 1.8, 1.5, -B / 2, 1.3, 1.5, Math.PI, false)
  // Terrassentür
  fenster(L * 0.1, 1.45, -B / 2, 2.4, 2.3, Math.PI, false)

  // Haustür mit Vordach und Stufen
  kiste(1.15, 2.25, 0.1, std(tuerFarbe, 0.55), eingangX, 1.35, B / 2 + 0.05)
  kiste(0.5, 0.9, 0.04, glas, eingangX - 0.2, 1.9, B / 2 + 0.1, gruppe, false)
  kiste(0.05, 0.05, 0.06, std(0xd9c27a, 0.3, 0.8), eingangX + 0.4, 1.2, B / 2 + 0.12, gruppe, false)
  kiste(2.6, 0.14, 1.5, weiss, eingangX, 2.75, B / 2 + 0.7)
  for (const sx of [-1.1, 1.1]) kiste(0.1, 2.5, 0.1, weiss, eingangX + sx, 1.45, B / 2 + 1.35)
  for (let i = 0; i < 3; i++) kiste(2.0 - i * 0.2, 0.15, 0.4, stein, eingangX, 0.07 + i * 0.15 - 0.0, B / 2 + 1.5 - i * 0.4 + 0.2)
  const leuchteTuer = w.aussenLeucht(0xfff2cf, 0xffd48a)
  kiste(0.18, 0.28, 0.14, leuchteTuer, eingangX + 0.95, 2.1, B / 2 + 0.07, gruppe, false)
  const tuerLicht = new THREE.PointLight(0xffd9a0, 0, 10, 1.7)
  tuerLicht.position.set(eingangX, 2.3, B / 2 + 1.3)
  gruppe.add(tuerLicht)
  aussenLichter.push(tuerLicht)

  // Garage
  const gTiefe = 6.4
  const gH = 3.0
  const gZ = B / 2 - 0.4 - gTiefe / 2
  kiste(gL, gH, gTiefe, putz, garX, gH / 2, gZ)
  kiste(gL + 0.3, 0.3, gTiefe + 0.3, sockel, garX, 0.15, gZ)
  const gDach = giebeldach(gTiefe + 0.9, 1.5, gL + 0.9)
  gDach.position.set(garX, gH, gZ)
  gruppe.add(gDach)
  const gTor = std(0xe3e3e0, 0.6)
  const torB = doppelgarage ? gL - 0.8 : gL - 0.6
  for (let i = 0; i < 6; i++) kiste(torB, 0.36, 0.06, gTor, garX, 0.4 + i * 0.4, gZ + gTiefe / 2 + 0.03)
  kiste(torB + 0.2, 0.12, 0.1, weiss, garX, 2.85, gZ + gTiefe / 2 + 0.04, gruppe, false)
  const garagenLicht = w.aussenLeucht(0xfff2cf, 0xffd48a)
  kiste(0.2, 0.2, 0.16, garagenLicht, garX, 3.3 - 0.45, gZ + gTiefe / 2 + 0.08, gruppe, false)
  // Basketballkorb
  if (rng.chance(0.55)) {
    kiste(0.08, 3.0, 0.08, std(0x333333, 0.5, 0.5), garX + gL / 2 - 0.5, 2.6 + 0.0, gZ + gTiefe / 2 + 0.2)
    kiste(1.0, 0.7, 0.04, weiss, garX + gL / 2 - 0.5, 3.0, gZ + gTiefe / 2 + 0.28)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 6, 16), std(0xd9541e, 0.5))
    ring.rotation.x = Math.PI / 2
    ring.position.set(garX + gL / 2 - 0.5, 2.8, gZ + gTiefe / 2 + 0.55)
    gruppe.add(ring)
  }

  // Auto, Mülltonnen
  w.auto(garX, B / 2 + 5.4, Math.PI / 2 + (rng.next() - 0.5) * 0.06, AUTOS[rng.int(0, AUTOS.length - 1)], true)
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 1.0, 10), std([0x3a3d40, 0x2d6a3a, 0xc9b229][i], 0.8))
    t.position.set(garX + gL / 2 + 1.0 + i * 0.75, 0.5, gZ + 1.2)
    t.castShadow = true
    gruppe.add(t)
  }

  // ---------------------------------------------------------------- Vorgarten
  for (let i = 0; i < 8; i++) kiste(0.95, 0.06, 0.55, stein, eingangX + (i % 2 ? 0.15 : -0.15), 0.03, B / 2 + 2.3 + i * 0.85, gruppe, false)
  // Lattenzaun mit Lücken für Einfahrt und Pforte
  const zaunX0 = -L / 2 - 9
  const zaunX1 = garX + gL / 2 + 8
  const luecken: [number, number][] = [[garX - gL / 2 - 0.3, garX + gL / 2 + 0.3], [eingangX - 0.7, eingangX + 0.7]]
  const latten: number[] = []
  for (let x = zaunX0; x <= zaunX1; x += 0.24) if (!luecken.some(([a, b]) => x > a && x < b)) latten.push(x)
  const zaun = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 1.0, 0.05), weiss, latten.length)
  const m4 = new THREE.Matrix4()
  latten.forEach((x, i) => { m4.setPosition(x, 0.5, frontZ); zaun.setMatrixAt(i, m4) })
  zaun.castShadow = true
  gruppe.add(zaun)
  const schienen: [number, number][] = [[zaunX0, luecken[0][0]], [luecken[0][1], eingangX - 0.7], [eingangX + 0.7, zaunX1]]
  for (const [a, b] of schienen) if (b > a) for (const y of [0.3, 0.75]) kiste(b - a, 0.06, 0.05, weiss, (a + b) / 2, y, frontZ - 0.04, gruppe, false)
  // Briefkasten
  kiste(0.1, 1.1, 0.1, dunkelHolz, eingangX + 1.2, 0.55, frontZ + 0.1)
  kiste(0.45, 0.3, 0.3, std(0xd9b229, 0.5), eingangX + 1.2, 1.2, frontZ + 0.1)
  // Blumenbeete
  const beet = (x: number, z: number, b: number, t: number): void => {
    kiste(b, 0.3, t, std(0x4a3626, 1), x, 0.15, z)
    const n = Math.round(b * t * 9)
    const bl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.1, 0), std(0xffffff, 0.8), n)
    for (let i = 0; i < n; i++) {
      m4.makeScale(1, 1, 1).setPosition(x + (rng.next() - 0.5) * (b - 0.2), 0.42 + rng.next() * 0.1, z + (rng.next() - 0.5) * (t - 0.2))
      bl.setMatrixAt(i, m4)
      bl.setColorAt(i, new THREE.Color(BLUMEN[rng.int(0, BLUMEN.length - 1)]))
    }
    gruppe.add(bl)
    for (let i = 0; i < 4; i++) {
      const strauch = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + rng.next() * 0.12, 1), new THREE.MeshStandardMaterial({ color: 0x3f7a40, roughness: 1, flatShading: true }))
      strauch.position.set(x + (rng.next() - 0.5) * (b - 0.4), 0.45, z + (rng.next() - 0.5) * (t - 0.3))
      strauch.castShadow = true
      gruppe.add(strauch)
    }
  }
  beet(eingangX + (eingangX > 0 ? -3.0 : 3.0), B / 2 + 0.7, 3.0, 1.1)
  beet(-L / 2 + 1.8, B / 2 + 0.7, 2.6, 1.0)

  // ---------------------------------------------------------------- Garten hinter dem Haus
  const hinten = -B / 2
  // Holzterrasse mit Pergola, Tisch und Stühlen
  kiste(6.4, 0.14, 4.2, holz, 0, 0.07, hinten - 2.1, gruppe, false)
  for (const [px, pz] of [[-3.1, hinten - 4.0], [3.1, hinten - 4.0]] as const) kiste(0.18, 2.6, 0.18, weiss, px, 1.3, pz)
  for (let i = 0; i < 8; i++) kiste(0.1, 0.12, 4.4, weiss, -3.1 + i * 0.88, 2.65, hinten - 2.1)
  kiste(6.6, 0.14, 0.14, weiss, 0, 2.55, hinten - 4.05)
  kiste(2.2, 0.08, 1.0, dunkelHolz, 0, 0.78, hinten - 2.2)
  for (const sx of [-0.8, 0.8]) for (const sz of [-0.9, 0.9]) {
    kiste(0.5, 0.06, 0.5, std(0xe8e2d4, 0.9), sx, 0.5, hinten - 2.2 + sz)
    kiste(0.5, 0.5, 0.05, std(0xe8e2d4, 0.9), sx, 0.78, hinten - 2.2 + sz * 1.25)
  }
  const grill = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0x2a2a2a, 0.4, 0.4))
  grill.position.set(-2.4, 0.9, hinten - 3.4)
  grill.castShadow = true
  gruppe.add(grill)
  kiste(0.05, 0.8, 0.05, std(0x2a2a2a, 0.5), -2.4, 0.4, hinten - 3.4)
  // Trampolin
  const tx = L / 2 + 4.2
  const tz = hinten - 8.5
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.07, 8, 28), std(0x333333, 0.5, 0.4))
  ring.rotation.x = Math.PI / 2
  ring.position.set(tx, 0.85, tz)
  ring.castShadow = true
  gruppe.add(ring)
  const matte = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, 0.04, 28), std(0x1d2a38, 0.9))
  matte.position.set(tx, 0.85, tz)
  matte.receiveShadow = true
  matte.castShadow = true
  gruppe.add(matte)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    kiste(0.06, 0.85, 0.06, std(0x555555, 0.5, 0.4), tx + Math.cos(a) * 1.9, 0.42, tz + Math.sin(a) * 1.9, gruppe, false)
  }
  const netz = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.7, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x20262e, wireframe: true, transparent: true, opacity: 0.45 }))
  netz.position.set(tx, 1.75, tz)
  gruppe.add(netz)
  // Schaukel
  const sx0 = -L / 2 - 5.2
  const sz0 = hinten - 6
  for (const dx of [-1.6, 1.6]) {
    const a = kiste(0.12, 2.9, 0.12, dunkelHolz, sx0 + dx, 1.4, sz0 - 0.5)
    a.rotation.x = -0.22
    const b2 = kiste(0.12, 2.9, 0.12, dunkelHolz, sx0 + dx, 1.4, sz0 + 0.5)
    b2.rotation.x = 0.22
  }
  kiste(3.5, 0.14, 0.14, dunkelHolz, sx0, 2.78, sz0)
  for (const dx of [-0.6, 0.6]) {
    const pendel = new THREE.Group()
    pendel.position.set(sx0 + dx, 2.75, sz0)
    kiste(0.03, 1.9, 0.03, std(0x888888, 0.6), -0.2, -0.95, 0, pendel, false)
    kiste(0.03, 1.9, 0.03, std(0x888888, 0.6), 0.2, -0.95, 0, pendel, false)
    kiste(0.55, 0.06, 0.22, std(0xd9541e, 0.8), 0, -1.9, 0, pendel)
    gruppe.add(pendel)
    schwankend.push({ obj: pendel, phase: rng.next() * 6, amp: 0.1 })
  }
  // Sandkasten
  kiste(1.8, 0.28, 1.8, dunkelHolz, sx0 + 4.5, 0.14, sz0 + 0.5)
  kiste(1.55, 0.3, 1.55, std(0xe0c98a, 1), sx0 + 4.5, 0.15, sz0 + 0.5, gruppe, false)
  // Gartenhaus
  const hx = -L / 2 - 8.5
  const hz = hinten - 11
  kiste(3.0, 2.3, 2.4, holz, hx, 1.15, hz)
  const hDach = giebeldach(3.0, 0.9, 3.5)
  hDach.position.set(hx, 2.3, hz)
  gruppe.add(hDach)
  kiste(0.9, 1.8, 0.06, dunkelHolz, hx + 0.4, 0.95, hz + 1.23)
  kiste(0.8, 0.7, 0.05, glas, hx - 0.8, 1.35, hz + 1.22, gruppe, false)
  // Beete, Bäume, Hecken
  beet(-2.5, hinten - 5.4, 3.4, 1.0)
  beet(3.8, hinten - 5.4, 2.8, 1.0)
  const apfel = [0x5aa04e, 0x4e8f4a, 0x6aaa56]
  rundbaum(-L / 2 - 3.5, B / 2 + 5.5, 1.1, apfel)
  rundbaum(-L / 2 + 4, hinten - 8, 1.25, apfel)
  rundbaum(garX + gL / 2 + 9, 0, 1.3, apfel)
  rundbaum(garX + gL / 2 + 8.5, hinten - 4, 1.15, apfel)
  rundbaum(0, hinten - 12.5, 1.4, apfel)
  rundbaum(-L / 2 - 8, 9, 1.0, apfel)
  w.zypresse(-L / 2 - 8, hinten - 2, 0.85)
  w.zypresse(-L / 2 - 8, 4, 0.9)
  const xl = -L / 2 - 9.5
  const xr = garX + gL / 2 + 7.5
  const zt = hinten - 14
  for (const [bx, bz, bw, bt] of [[xl, (frontZ + zt) / 2, 1.1, frontZ - zt], [xr, (frontZ + zt) / 2, 1.1, frontZ - zt], [(xl + xr) / 2, zt, xr - xl, 1.1]] as const) kiste(bw, 1.6, bt, hecke, bx, 0.8, bz)

  // Gartenleuchten
  for (const [lx, lz] of [[eingangX - 1.4, B / 2 + 4], [eingangX + 1.4, B / 2 + 7]] as const) {
    kiste(0.12, 0.7, 0.12, std(0x333333, 0.5), lx, 0.35, lz)
    kiste(0.2, 0.18, 0.2, w.aussenLeucht(0xfff2cf, 0xffd48a), lx, 0.78, lz, gruppe, false)
    const l = new THREE.PointLight(0xffd48a, 0, 7, 1.8)
    l.position.set(lx, 1.0, lz)
    gruppe.add(l)
    aussenLichter.push(l)
  }

  // Innenlicht
  const innen1 = new THREE.PointLight(0xffc770, 0, 14, 1.6)
  innen1.position.set(0, 1.9, B / 2 - 1.8)
  gruppe.add(innen1)
  const innen2 = new THREE.PointLight(0xffc770, 0, 12, 1.6)
  innen2.position.set(0, 4.4, B / 2 - 1.5)
  gruppe.add(innen2)
  innenLichter.push(innen1, innen2)

  const gesamtB = L + gL
  return {
    gruppe, wasser: w.wasser, innenMaterial: w.innenMaterial, innenLichter, aussenLichter, aussenMaterial: w.aussenMaterial, schwankend,
    groesse: { breite: gesamtB + 22, tiefe: 38, hoehe: H + rh },
    ziel: [gL / 2 - 0.5, (H + rh) * 0.34, 0],
    kamera: [gesamtB * 0.62 + 4, 13, 31],
    entsorgen: w.entsorgen,
  }
}
