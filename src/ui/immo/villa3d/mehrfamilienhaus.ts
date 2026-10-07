import * as THREE from 'three'
import { createRng } from '../../../engine/rng'
import { dachBauer, fensterBauer, wandTextur, werkzeug } from './bausteine'
import type { VillaParameter, VillaSzene } from './szene'

const PUTZ = [0xece4d2, 0xe0d5bb, 0xd7dde0, 0xe9d8c4]
const DACH = [{ f: '#7a4a38', fuge: '#583226' }, { f: '#3d4349', fuge: '#25292d' }, { f: '#b5523a', fuge: '#8a3a28' }]
const AUTOS = [0x1c2a3a, 0xd8dbe0, 0x7a2222, 0x3a4a42, 0xb8bcc2, 0x2a2a2e]

/** Mehrgeschossiges Mehrfamilienhaus (Klinker oder Putz) mit Treppenhäusern, Balkonen, Straße und Hinterhof. */
export function baueMehrfamilienhaus(p: VillaParameter): VillaSzene {
  const rng = createRng(p.seed)
  const w = werkzeug(rng)
  const { gruppe, innenLichter, aussenLichter, std, kiste, glas, rundbaum } = w

  const etagen = Math.max(3, Math.min(5, p.etagen ?? 3 + (p.seed % 3)))
  const fh = 2.9
  const sockelH = 0.5
  const H = sockelH + etagen * fh
  const L = Math.max(15, Math.min(30, p.flaeche / (etagen * 7.4)))
  const B = 11
  const rh = 3.2
  const ziegel = rng.chance(0.5)
  const putzFarbe = PUTZ[rng.int(0, PUTZ.length - 1)]
  const dachWahl = DACH[rng.int(0, DACH.length - 1)]

  // Wandmaterial je Seite (Texturen mit passender Wiederholung, damit Fugen nicht verzerrt werden)
  const wand = (breite: number): THREE.MeshStandardMaterial => {
    if (!ziegel) return std(putzFarbe, 0.95)
    const t = wandTextur('ziegel', '#a85a44', '#7a3f2e', rng)
    if (t) t.repeat.set(breite / 2.4, H / 1.1)
    return new THREE.MeshStandardMaterial({ color: t ? 0xffffff : 0xa85a44, map: t, roughness: 0.95 })
  }
  const putz = std(ziegel ? 0xe9e3d5 : putzFarbe, 0.95)
  const weiss = std(0xf6f4ee, 0.7)
  const stein = std(0xc2b9a6, 0.85)
  const sockel = std(0x76797c, 0.9)
  const beton = std(0xb9b6ae, 0.9)
  const metall = std(0x2f3338, 0.5, 0.5)
  const asphalt = std(0x3a3d42, 1)
  const gehweg = std(0xb8b2a6, 1)
  const hecke = std(0x3f7a40, 1)
  const dunkel = std(0x1b1d22, 0.9)

  w.wiese(0x55904a)

  // ---------------------------------------------------------------- Straße und Gehweg (vorn, +z)
  const strasseZ = B / 2 + 10
  kiste(L + 60, 0.08, 4.0, gehweg, 0, 0.04, B / 2 + 3.2, gruppe, false)
  kiste(L + 60, 0.14, 0.25, stein, 0, 0.07, B / 2 + 5.3, gruppe, false)
  kiste(L + 60, 0.06, 8.2, asphalt, 0, 0.03, strasseZ, gruppe, false)
  for (let x = -L / 2 - 24; x < L / 2 + 24; x += 3.4) kiste(1.6, 0.02, 0.14, std(0xf2f2ee, 0.9), x, 0.065, strasseZ + 0.4, gruppe, false)
  for (let i = 0; i < 3; i++) w.auto(-L / 2 + 3 + i * (L / 3.1) + rng.next() * 2, B / 2 + 6.8, (rng.next() - 0.5) * 0.04, AUTOS[rng.int(0, AUTOS.length - 1)], rng.chance(0.5))

  // ---------------------------------------------------------------- Baukörper
  kiste(L + 0.3, sockelH, B + 0.3, sockel, 0, sockelH / 2, 0)
  // Vier Wandseiten als eigene Flächen, damit Klinker nicht verzerrt wird
  const front = new THREE.Mesh(new THREE.BoxGeometry(L, H - sockelH, B), [wand(B), wand(B), putz, putz, wand(L), wand(L)])
  front.position.set(0, sockelH + (H - sockelH) / 2, 0)
  front.castShadow = true
  front.receiveShadow = true
  gruppe.add(front)
  for (let f = 1; f <= etagen; f++) kiste(L + 0.16, 0.14, B + 0.16, weiss, 0, sockelH + f * fh - 0.07, 0, gruppe, false)

  // Dach mit Gauben und Schornsteinen
  const giebeldach = dachBauer(w, { putz, dachHex: dachWahl.f, fuge: dachWahl.fuge })
  const dach = giebeldach(B + 1.4, rh, L + 1.4)
  dach.position.y = H
  gruppe.add(dach)
  const dz = B / 2 - 0.1
  const ys = H + rh * (1 - dz / (B / 2 + 0.7))
  const gauben = Math.max(2, Math.round(L / 6))
  const fensterB = fensterBauer(w, { rahmen: weiss, bank: stein, licht: () => rng.chance(0.5) })
  for (let i = 0; i < gauben; i++) {
    const gx = -L / 2 + (L / gauben) * (i + 0.5)
    kiste(1.9, 1.5, 1.7, putz, gx, ys + 0.55, dz - 0.85)
    const gd = giebeldach(2.3, 0.7, 2.1)
    gd.rotation.y = Math.PI / 2
    gd.position.set(gx, ys + 1.3, dz - 0.85)
    gruppe.add(gd)
    fensterB(gx, ys + 0.55, dz - 0.0, 1.1, 1.0, 0)
  }
  for (const k of [-0.28, 0.3]) {
    const kamin = kiste(0.9, 2.2, 0.9, std(0x9a5a48, 0.95), L * k, H + rh * 0.85, -0.4)
    kiste(1.1, 0.14, 1.1, std(0x55575b, 0.7), kamin.position.x, kamin.position.y + 1.15, kamin.position.z)
  }

  // ---------------------------------------------------------------- Fassade vorn: Fenster, Eingänge, Balkone
  const spalten = Math.max(5, Math.round(L / 2.9))
  const eing = [Math.round(spalten * 0.25 - 0.5), Math.round(spalten * 0.75 - 0.5)]
  const colX = (c: number): number => -L / 2 + (L / spalten) * (c + 0.5)
  const balkonMuster = rng.int(0, 2)
  for (let f = 0; f < etagen; f++) {
    const y = sockelH + f * fh + fh * 0.55
    for (let c = 0; c < spalten; c++) {
      const x = colX(c)
      if (eing.includes(c)) {
        // Treppenhausfenster: hoch, schmal, immer erleuchtet
        if (f > 0) fensterB(x, y + 0.1, B / 2, 0.9, 1.7, 0)
        continue
      }
      fensterB(x, y, B / 2, 1.3, 1.6, 0)
      if (f > 0 && (c + f + balkonMuster) % 3 === 0) {
        kiste(2.0, 0.16, 1.2, beton, x, sockelH + f * fh + 0.02, B / 2 + 0.6)
        kiste(2.0, 0.9, 0.05, glas, x, sockelH + f * fh + 0.62, B / 2 + 1.18, gruppe, false)
        kiste(2.04, 0.05, 0.07, metall, x, sockelH + f * fh + 1.1, B / 2 + 1.18, gruppe, false)
        for (const sx of [-1, 1]) kiste(0.05, 0.9, 1.2, glas, x + sx * 1.0, sockelH + f * fh + 0.62, B / 2 + 0.6, gruppe, false)
      }
    }
  }
  // Eingänge mit Tür, Vordach, Stufen, Klingeltableau und Hausnummer
  const nameSchild = std(0xdedad0, 0.6)
  eing.forEach((c, i) => {
    const x = colX(c)
    kiste(1.5, 2.35, 0.1, metall, x, sockelH + 1.18, B / 2 + 0.06)
    kiste(1.2, 2.0, 0.05, glas, x, sockelH + 1.2, B / 2 + 0.12, gruppe, false)
    kiste(0.06, 2.0, 0.07, metall, x, sockelH + 1.2, B / 2 + 0.13, gruppe, false)
    kiste(2.8, 0.14, 1.5, beton, x, sockelH + 2.65, B / 2 + 0.75)
    for (const sx of [-1.3, 1.3]) kiste(0.08, 2.5, 0.08, metall, x + sx, sockelH + 1.3, B / 2 + 1.45)
    for (let s = 0; s < 3; s++) kiste(2.2 - s * 0.2, 0.17, 0.5, stein, x, 0.09 + s * 0.17, B / 2 + 1.5 - s * 0.45 + 0.2)
    kiste(0.45, 0.7, 0.04, nameSchild, x + 1.1, sockelH + 1.3, B / 2 + 0.06, gruppe, false)
    kiste(0.3, 0.3, 0.04, std(0x1f3a5f, 0.5), x - 1.1, sockelH + 1.7, B / 2 + 0.06, gruppe, false)
    const lampe = w.aussenLeucht(0xfff2cf, 0xffd48a)
    kiste(0.22, 0.14, 0.2, lampe, x, sockelH + 2.5, B / 2 + 1.0, gruppe, false)
    const l = new THREE.PointLight(0xffd9a0, 0, 9, 1.8)
    l.position.set(x, sockelH + 2.3, B / 2 + 1.4)
    gruppe.add(l)
    aussenLichter.push(l)
    // Fahrradständer mit Rädern
    for (let r = 0; r < 3; r++) {
      const rad = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 6, 14), metall)
      rad.position.set(x + (i ? -3.0 : 3.0) + r * 0.45, 0.4, B / 2 + 2.0)
      rad.rotation.y = Math.PI / 2
      rad.rotation.x = (rng.next() - 0.5) * 0.1
      gruppe.add(rad)
      const rad2 = rad.clone()
      rad2.position.z += 0.85
      gruppe.add(rad2)
      kiste(0.03, 0.04, 0.9, metall, rad.position.x, 0.62, B / 2 + 2.4, gruppe, false)
    }
  })
  // Seitenwände und Rückseite
  for (let f = 0; f < etagen; f++) {
    const y = sockelH + f * fh + fh * 0.55
    for (const z of [-2.8, 0, 2.8]) {
      if (f === 0 && z === 0) continue
      fensterB(-L / 2, y, z, 1.2, 1.5, -Math.PI / 2)
      fensterB(L / 2, y, z, 1.2, 1.5, Math.PI / 2)
    }
    for (let c = 0; c < spalten; c++) {
      if (f === 0 && eing.includes(c)) { kiste(1.2, 2.2, 0.08, metall, colX(c), sockelH + 1.1, -B / 2 - 0.05); continue }
      fensterB(colX(c), y, -B / 2, 1.3, 1.6, Math.PI)
    }
  }

  // ---------------------------------------------------------------- Nachbargebäude als Kulisse
  const nachbar = (x: number, breite: number, geschosse: number, farbe: number): void => {
    const nh = sockelH + geschosse * fh
    kiste(breite, nh, B - 1, std(farbe, 0.95), x, nh / 2, -0.5)
    kiste(breite + 0.5, 0.35, B - 0.6, std(0x55585c, 0.8), x, nh + 0.17, -0.5)
    const spalte = Math.max(2, Math.round(breite / 2.8))
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 1.5, 0.08), glas, spalte * geschosse)
    const m4 = new THREE.Matrix4()
    let n = 0
    for (let f = 0; f < geschosse; f++) for (let c = 0; c < spalte; c++) {
      m4.setPosition(x - breite / 2 + (breite / spalte) * (c + 0.5), sockelH + f * fh + fh * 0.55, B / 2 - 0.5 + 0.05)
      inst.setMatrixAt(n++, m4)
    }
    gruppe.add(inst)
  }
  nachbar(-L / 2 - 5.6, 9, Math.max(3, etagen - 1), 0xd9c9ae)
  nachbar(L / 2 + 5.6, 9, etagen + 1, 0xc9d1d6)

  // ---------------------------------------------------------------- Straßenmöbel
  for (let i = 0; i < Math.round((L + 24) / 8); i++) rundbaum(-L / 2 - 8 + i * 8.5, B / 2 + 4.3, 0.55, [0x5aa04e, 0x4e8f4a])
  for (const lx of [-L / 2 + 2, L / 2 - 2]) {
    kiste(0.14, 5.6, 0.14, metall, lx, 2.8, B / 2 + 5.0)
    const arm = kiste(1.2, 0.1, 0.1, metall, lx, 5.6, B / 2 + 5.5)
    arm.rotation.z = 0
    kiste(0.7, 0.14, 0.3, w.aussenLeucht(0xfff2cf, 0xffd48a), lx, 5.5, B / 2 + 5.95, gruppe, false)
    const l = new THREE.PointLight(0xffd9a0, 0, 15, 1.7)
    l.position.set(lx, 5.3, B / 2 + 5.9)
    gruppe.add(l)
    aussenLichter.push(l)
  }

  // ---------------------------------------------------------------- Hinterhof
  const hinten = -B / 2
  kiste(L + 6, 0.05, 8, stein, 0, 0.025, hinten - 4, gruppe, false)
  // Fahrradschuppen und Mülleinhausung
  kiste(5.5, 2.4, 2.6, std(0x8a6a4a, 0.85), -L * 0.28, 1.2, hinten - 3.5)
  kiste(5.9, 0.16, 3.0, std(0x4a5058, 0.7), -L * 0.28, 2.5, hinten - 3.5)
  kiste(3.0, 1.5, 1.4, std(0x6b6f75, 0.8), L * 0.3, 0.75, hinten - 3.2)
  for (let i = 0; i < 3; i++) kiste(0.8, 1.0, 0.8, std([0x2f3338, 0x2d6a3a, 0x2f5a8a][i], 0.8), L * 0.3 - 1.0 + i * 1.0, 0.5, hinten - 3.2 + 0.1)
  // Bank, Sandkasten und Bäume
  kiste(1.8, 0.1, 0.5, std(0x9a7650, 0.8), 0, 0.5, hinten - 5.5)
  kiste(0.1, 0.5, 0.5, metall, -0.8, 0.25, hinten - 5.5)
  kiste(0.1, 0.5, 0.5, metall, 0.8, 0.25, hinten - 5.5)
  kiste(2.2, 0.28, 2.2, std(0x6b4a33, 0.85), L * 0.12, 0.14, hinten - 8.5)
  kiste(1.9, 0.3, 1.9, std(0xe0c98a, 1), L * 0.12, 0.15, hinten - 8.5, gruppe, false)
  rundbaum(-L * 0.3, hinten - 10, 1.4)
  rundbaum(L * 0.38, hinten - 9, 1.5)
  rundbaum(-L / 2 - 2, hinten - 6, 1.2)
  rundbaum(L / 2 + 2, hinten - 7, 1.3)
  for (const [bx, bz, bw, bt] of [[0, hinten - 14, L + 14, 1.2], [-L / 2 - 7, hinten - 7, 1.2, 14], [L / 2 + 7, hinten - 7, 1.2, 14]] as const) kiste(bw, 1.6, bt, hecke, bx, 0.8, bz)
  void dunkel

  // Treppenhaus- und Wohnungsbeleuchtung
  for (const c of eing) {
    const l = new THREE.PointLight(0xffc770, 0, 16, 1.6)
    l.position.set(colX(c), sockelH + fh * (etagen * 0.5), B / 2 - 2)
    gruppe.add(l)
    innenLichter.push(l)
  }

  return {
    gruppe, wasser: w.wasser, innenMaterial: w.innenMaterial, innenLichter, aussenLichter, aussenMaterial: w.aussenMaterial, schwankend: w.schwankend,
    groesse: { breite: L + 30, tiefe: 46, hoehe: H + rh },
    ziel: [0, (H + rh) * 0.36, 3],
    kamera: [L * 0.42 + 9, H * 0.7 + 4, 32 + L * 0.28],
    entsorgen: w.entsorgen,
  }
}
