import * as THREE from 'three'
import { createRng } from '../../../engine/rng'
import { dachTextur } from './bausteine'
import { fensterBauer, kausticTextur, walmdach, wandTextur, werkzeug } from './bausteine'
import type { VillaParameter, VillaSzene } from './szene'

const WAENDE = [{ f: '#cfa979', l: '#9c7a52' }, { f: '#f0ead8', l: '#c9c2ae' }, { f: '#a9cdd1', l: '#7fa4a9' }]
const LADEN = [0x2fa6a6, 0xe8735a, 0x3a7ac2, 0xf2b94a]
const DAECHER = [{ f: '#c0623f', l: '#8f4630', reet: false }, { f: '#b99a5b', l: '#8a6f3a', reet: true }]
const BRETTER = [0xd9541e, 0x1d8fb0, 0xf2c14e, 0xf4f1ea, 0x6cc4a1]

/** Holzhaus auf Pfählen am Strand mit Veranda, Hängematte, Steg, Boot, Palmen und Meer. */
export function baueFerienhaus(p: VillaParameter): VillaSzene {
  const rng = createRng(p.seed)
  const w = werkzeug(rng)
  const { gruppe, aussenLichter, innenLichter, std, kiste, palme } = w

  const L = Math.max(8.5, Math.min(13, 6 + p.flaeche / 14))
  const B = 6.6
  const WH = 2.9
  const plat = 0.97
  const vd = 2.4
  const wandWahl = WAENDE[rng.int(0, WAENDE.length - 1)]
  const dachWahl = DAECHER[rng.int(0, DAECHER.length - 1)]
  const ladenFarbe = LADEN[rng.int(0, LADEN.length - 1)]
  const weiss = std(0xf6f4ee, 0.7)
  const holz = std(0xb08a5a, 0.85)
  const dunkelHolz = std(0x6b4a33, 0.85)
  const sand = std(0xe9dcae, 1)
  const stein = std(0xc2b9a6, 0.85)
  const metall = std(0x2f3338, 0.5, 0.5)

  w.wiese(0xe6d6a6)

  // ---------------------------------------------------------------- Meer und Strand (Meer liegt links, -x)
  const ufer = -24
  const kaustik = kausticTextur(rng)
  if (kaustik) kaustik.repeat.set(70, 70)
  const meerMat = new THREE.MeshPhysicalMaterial({ color: 0x2a9fc0, map: kaustik, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.93, envMapIntensity: 1.3, clearcoat: 1 })
  const meer = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), meerMat)
  meer.rotation.x = -Math.PI / 2
  meer.position.set(ufer - 260, 0.02, 0)
  meer.receiveShadow = true
  gruppe.add(meer)
  w.wasser.push(meer)
  kiste(7, 0.015, 520, std(0xcdbd8d, 1), ufer + 3.5, 0.012, 0, gruppe, false)
  for (let i = 0; i < 24; i++) kiste(1.6 + rng.next() * 2, 0.02, 0.22, std(0xffffff, 1), ufer + 0.4 + rng.next() * 0.6, 0.04, -60 + i * 5 + rng.next() * 3, gruppe, false)

  // ---------------------------------------------------------------- Haus auf Pfählen
  for (let ix = 0; ix <= Math.round(L / 2.6); ix++) {
    for (const z of [-B / 2 + 0.2, B / 2 + vd - 0.2]) kiste(0.26, plat, 0.26, dunkelHolz, -L / 2 + 0.3 + ix * ((L - 0.6) / Math.round(L / 2.6)), plat / 2, z)
  }
  const deckB = B + vd + 0.6
  const deckZ = (vd - 0.6) / 2
  kiste(L + 1.2, 0.14, deckB, holz, 0, plat - 0.07, deckZ)
  for (let i = 0; i < 12; i++) kiste(L + 1.2, 0.012, 0.03, std(0x7a5a3a, 1), 0, plat + 0.002, -B / 2 - 0.3 + i * (deckB / 12), gruppe, false)

  const wandTex = wandTextur('planken', wandWahl.f, wandWahl.l, rng)
  const wandMats = [0, 1, 2, 3, 4, 5].map((i) => {
    const t = wandTex ? wandTex.clone() : null
    if (t) { t.needsUpdate = true; t.repeat.set((i < 2 ? B : L) / 1.4, WH / 1.0) }
    return i === 2 || i === 3 ? std(0xb09064, 0.9) : new THREE.MeshStandardMaterial({ color: t ? 0xffffff : Number.parseInt(wandWahl.f.slice(1), 16), map: t, roughness: 0.9 })
  })
  const koerper = new THREE.Mesh(new THREE.BoxGeometry(L, WH, B), wandMats)
  koerper.position.set(0, plat + WH / 2, 0)
  koerper.castShadow = true
  koerper.receiveShadow = true
  gruppe.add(koerper)

  // Walmdach mit Reet- oder Ziegelstruktur; die Traufe überdeckt die Veranda
  const dachTex = dachWahl.reet ? wandTextur('reet', dachWahl.f, dachWahl.l, rng) : dachTextur(dachWahl.f, dachWahl.l)
  if (dachTex) dachTex.repeat.set(1, 1)
  const dachMat = new THREE.MeshStandardMaterial({ color: dachTex ? 0xffffff : Number.parseInt(dachWahl.f.slice(1), 16), map: dachTex, roughness: 0.95 })
  const dach = walmdach(B + vd + 1.6, L + 2.2, 2.4, dachMat)
  dach.position.set(0, plat + WH, vd / 2)
  gruppe.add(dach)

  // Veranda: Pfosten, Geländer, Treppe
  for (const x of [-L / 2 - 0.4, -L / 6, L / 6, L / 2 + 0.4]) kiste(0.18, WH, 0.18, dunkelHolz, x, plat + WH / 2, B / 2 + vd - 0.1)
  for (const x of [-L / 2 - 0.4, L / 2 + 0.4]) kiste(0.18, WH, 0.18, dunkelHolz, x, plat + WH / 2, -B / 2 - 0.2)
  const treppeX = L / 6 + 0.9
  const gelaenderX = (x0: number, x1: number, z: number): void => {
    kiste(x1 - x0, 0.07, 0.07, weiss, (x0 + x1) / 2, plat + 1.0, z, gruppe, false)
    const n = Math.max(2, Math.round((x1 - x0) / 0.18))
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), weiss, n)
    const m4 = new THREE.Matrix4()
    for (let i = 0; i < n; i++) { m4.setPosition(x0 + ((i + 0.5) * (x1 - x0)) / n, plat + 0.52, z); inst.setMatrixAt(i, m4) }
    gruppe.add(inst)
  }
  gelaenderX(-L / 2 - 0.4, treppeX - 0.7, B / 2 + vd - 0.1)
  gelaenderX(treppeX + 0.7, L / 2 + 0.4, B / 2 + vd - 0.1)
  for (const sx of [-1, 1]) {
    const n = 12
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), weiss, n)
    const m4 = new THREE.Matrix4()
    for (let i = 0; i < n; i++) { m4.setPosition(sx * (L / 2 + 0.4), plat + 0.52, -B / 2 - 0.2 + ((i + 0.5) * (B + vd + 0.1)) / n); inst.setMatrixAt(i, m4) }
    gruppe.add(inst)
    kiste(0.07, 0.07, B + vd + 0.2, weiss, sx * (L / 2 + 0.4), plat + 1.0, (vd - 0.2) / 2 + 0.0, gruppe, false)
  }
  for (let s = 0; s < 5; s++) kiste(1.4, 0.18, 0.4, holz, treppeX, plat - 0.1 - s * 0.19, B / 2 + vd + 0.2 + s * 0.4)

  // Fenster, Schiebetür und Läden
  const fensterB = fensterBauer(w, { rahmen: weiss, bank: holz, ladenHex: ladenFarbe })
  const wz = B / 2
  for (const x of [-L * 0.33, L * 0.33]) fensterB(x, plat + 1.5, wz, 1.5, 1.5, 0, true)
  fensterB(-L / 2, plat + 1.5, 0, 1.4, 1.5, -Math.PI / 2, true)
  fensterB(L / 2, plat + 1.5, 0, 1.4, 1.5, Math.PI / 2, true)
  fensterB(-L * 0.25, plat + 1.5, -B / 2, 1.4, 1.5, Math.PI, true)
  fensterB(L * 0.25, plat + 1.5, -B / 2, 1.4, 1.5, Math.PI, true)
  // Schiebetür in der Mitte
  kiste(2.6, 2.25, 0.08, w.glas, 0, plat + 1.2, wz + 0.08, gruppe, false)
  kiste(2.6, 2.1, 0.02, w.innenWarm(0.9), 0, plat + 1.2, wz + 0.02, gruppe, false)
  for (const x of [-1.3, 0, 1.3]) kiste(0.06, 2.3, 0.1, weiss, x, plat + 1.2, wz + 0.1, gruppe, false)
  kiste(2.7, 0.06, 0.1, weiss, 0, plat + 2.35, wz + 0.1, gruppe, false)

  // Veranda-Ausstattung: Hängematte, Tisch, Stühle, Surfbretter, Lichterkette
  const hang = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.8, 16, 1), new THREE.MeshStandardMaterial({ color: 0xf1a8b8, roughness: 0.95, side: THREE.DoubleSide }))
  const hp = hang.geometry.attributes.position
  for (let i = 0; i < hp.count; i++) { const u = (hp.getX(i) + 1.3) / 2.6; hp.setZ(i, 0.55 * Math.sin(Math.PI * u)) }
  hang.geometry.computeVertexNormals()
  hang.rotation.x = Math.PI / 2
  hang.position.set(-L / 2 + 1.8, plat + 1.35, B / 2 + vd - 1.0)
  hang.castShadow = true
  gruppe.add(hang)
  for (const sx of [-1.45, 1.45]) kiste(0.04, 0.04, 0.5, metall, -L / 2 + 1.8 + sx, plat + 1.3, B / 2 + vd - 1.0, gruppe, false)
  kiste(1.3, 0.08, 0.8, dunkelHolz, L * 0.33 + 1.0, plat + 0.72, B / 2 + 1.0)
  for (const sx of [-0.6, 0.6]) kiste(0.45, 0.45, 0.45, std(0xe8e2d4, 0.9), L * 0.33 + 1.0 + sx, plat + 0.3, B / 2 + 1.0 + (sx > 0 ? 0.6 : -0.6))
  for (let i = 0; i < 3; i++) {
    const brett = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.9, 4, 10), std(BRETTER[rng.int(0, BRETTER.length - 1)], 0.5))
    brett.scale.set(1, 1, 0.14)
    brett.position.set(L / 2 - 0.5 - i * 0.28, plat + 1.15, B / 2 + 0.1)
    brett.rotation.z = 0.06
    brett.castShadow = true
    gruppe.add(brett)
  }
  const lichter = w.aussenLeucht(0xfff2cf, 0xffd48a)
  const kette = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), lichter, 22)
  const m4 = new THREE.Matrix4()
  for (let i = 0; i < 22; i++) { const u = i / 21; m4.setPosition(-L / 2 - 0.4 + u * (L + 0.8), plat + WH - 0.25 - 0.22 * Math.sin(Math.PI * ((u * 4) % 1)), B / 2 + vd - 0.1); kette.setMatrixAt(i, m4) }
  gruppe.add(kette)

  // Außendusche
  kiste(1.0, 2.1, 1.0, holz, -L / 2 - 1.6, 1.05, -B / 2 + 1.0)
  kiste(0.12, 0.12, 0.5, metall, -L / 2 - 1.6, 2.0, -B / 2 + 1.55, gruppe, false)

  // ---------------------------------------------------------------- Strandweg, Steg, Boot
  const wegZ = B / 2 + vd + 2.4
  const bretter = Math.round((treppeX - ufer) / 0.5)
  const weg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.06, 1.3), holz, bretter)
  for (let i = 0; i < bretter; i++) { m4.setPosition(treppeX - i * 0.5, 0.05, wegZ); weg.setMatrixAt(i, m4) }
  weg.receiveShadow = true
  gruppe.add(weg)
  kiste(1.3, 0.05, 2.4, holz, treppeX, 0.05, B / 2 + vd + 1.6, gruppe, false)
  const steg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.1, 1.9), holz, 44)
  for (let i = 0; i < 44; i++) { m4.setPosition(ufer - 0.5 - i * 0.5, 0.45, wegZ); steg.setMatrixAt(i, m4) }
  steg.castShadow = true
  steg.receiveShadow = true
  gruppe.add(steg)
  for (let i = 0; i < 10; i++) for (const sz of [-0.85, 0.85]) kiste(0.18, 1.1, 0.18, dunkelHolz, ufer - 1 - i * 2.2, 0.0, wegZ + sz)
  const stegLeuchte = w.aussenLeucht(0xfff2cf, 0xffd48a)
  for (const x of [ufer - 6, ufer - 20]) {
    kiste(0.1, 0.9, 0.1, dunkelHolz, x, 0.95, wegZ + 0.85)
    kiste(0.2, 0.22, 0.2, stegLeuchte, x, 1.5, wegZ + 0.85, gruppe, false)
  }
  const stegLicht = new THREE.PointLight(0xffd48a, 0, 12, 1.7)
  stegLicht.position.set(ufer - 6, 1.6, wegZ + 0.85)
  gruppe.add(stegLicht)
  aussenLichter.push(stegLicht)
  // Boot am Steg
  const boot = new THREE.Group()
  kiste(3.4, 0.5, 1.3, std(0xf2efe6, 0.6), 0, 0.25, 0, boot)
  kiste(3.4, 0.14, 1.35, std(0x1d8fb0, 0.6), 0, 0.5, 0, boot)
  const bug = kiste(0.8, 0.5, 1.0, std(0xf2efe6, 0.6), 2.0, 0.28, 0, boot)
  bug.rotation.z = -0.5
  kiste(0.1, 2.6, 0.1, dunkelHolz, 0.4, 1.7, 0, boot)
  boot.position.set(ufer - 14, 0.1, wegZ - 2.4)
  boot.rotation.y = 0.15
  gruppe.add(boot)
  w.schwankend.push({ obj: boot, phase: 1.3, amp: 0.025 })

  // ---------------------------------------------------------------- Strand-Ausstattung
  const sx0 = ufer + 9
  const schirmFarbe = [0xe8735a, 0xf2c14e, 0x3a7ac2]
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group()
    kiste(0.05, 2.5, 0.05, dunkelHolz, 0, 1.25, 0, g)
    const dachS = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.55, 12), std(schirmFarbe[i + (p.seed % 2)], 0.9))
    dachS.position.y = 2.55
    dachS.castShadow = true
    g.add(dachS)
    for (const sz of [-0.6, 0.6]) {
      kiste(0.65, 0.09, 1.7, std(0xf5f2ea, 0.8), 0.0, 0.34, sz * 1.0 + 0.4, g)
      kiste(0.65, 0.09, 0.8, std(0xf5f2ea, 0.8), 0.0, 0.6, sz * 1.0 - 0.9, g).rotation.x = 0.5
    }
    g.position.set(sx0 - i * 3.5, 0, wegZ - 6 + i * 2.5)
    g.rotation.y = rng.next() * 0.5
    gruppe.add(g)
  }
  const handtuch = std(0xe8735a, 1)
  kiste(0.9, 0.02, 1.8, handtuch, sx0 + 1.4, 0.03, wegZ - 4.5, gruppe, false)
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), std(0xf2c14e, 0.5))
  ball.position.set(sx0 + 3.2, 0.3, wegZ - 7)
  ball.castShadow = true
  gruppe.add(ball)
  const kajak = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 3.0, 4, 10), std(0xe8735a, 0.5))
  kajak.rotation.z = Math.PI / 2
  kajak.scale.set(1, 1, 0.6)
  kajak.position.set(sx0 - 2, 0.3, wegZ - 11)
  kajak.rotation.y = 0.3
  kajak.castShadow = true
  gruppe.add(kajak)
  // Feuerstelle
  const fx = L / 2 + 7
  const fz = B / 2 + vd + 3.5
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), stein)
    s.position.set(fx + Math.cos(a) * 0.75, 0.15, fz + Math.sin(a) * 0.75)
    s.castShadow = true
    gruppe.add(s)
  }
  const flamme = w.aussenLeucht(0xff9a3a, 0xff7a1a)
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 7), flamme)
  f1.position.set(fx, 0.5, fz)
  gruppe.add(f1)
  w.schwankend.push({ obj: f1, phase: 0.5, amp: 0.1 })
  const feuerLicht = new THREE.PointLight(0xff9a3a, 0, 11, 1.7)
  feuerLicht.position.set(fx, 0.9, fz)
  gruppe.add(feuerLicht)
  aussenLichter.push(feuerLicht)
  for (const a of [0.6, 2.4, 4.4]) kiste(1.5, 0.28, 0.4, holz, fx + Math.cos(a) * 1.9, 0.14, fz + Math.sin(a) * 1.9).rotation.y = -a

  // Dünengras
  const gras = new THREE.InstancedMesh(new THREE.ConeGeometry(0.1, 0.9, 4), new THREE.MeshStandardMaterial({ color: 0xa9b15a, roughness: 1, flatShading: true }), 140)
  for (let i = 0; i < 140; i++) {
    let x = 0, z = 0
    do { x = (rng.next() - 0.5) * 60 + 4; z = (rng.next() - 0.5) * 50 } while (x < ufer + 5 || (Math.abs(x) < L / 2 + 2 && z > -B / 2 - 2 && z < B / 2 + vd + 2.5))
    m4.makeScale(1, 0.6 + rng.next() * 0.9, 1).setPosition(x, 0.4, z)
    gras.setMatrixAt(i, m4)
  }
  gruppe.add(gras)
  // Palmen
  palme(-L / 2 - 4.5, 5, 1.15)
  palme(L / 2 + 4.0, B / 2 + 2, 1.05)
  palme(L / 2 + 5.5, -4, 1.2)
  palme(-L / 2 - 3, -B / 2 - 3, 1.0)
  palme(ufer + 6.5, wegZ + 4.5, 1.25)
  palme(L / 2 + 12, 3, 1.1)

  // Beleuchtung innen und auf der Veranda
  const innen = new THREE.PointLight(0xffc770, 0, 15, 1.6)
  innen.position.set(0, plat + 2.2, 0.8)
  gruppe.add(innen)
  innenLichter.push(innen)
  const veranda = new THREE.PointLight(0xffd9a0, 0, 12, 1.7)
  veranda.position.set(0, plat + 2.4, B / 2 + vd - 0.8)
  gruppe.add(veranda)
  aussenLichter.push(veranda)
  void sand

  return {
    gruppe, wasser: w.wasser, innenMaterial: w.innenMaterial, innenLichter, aussenLichter, aussenMaterial: w.aussenMaterial, schwankend: w.schwankend,
    groesse: { breite: L + 40, tiefe: 40, hoehe: plat + WH + 2.4 },
    ziel: [-5, 2.0, 3],
    kamera: [L * 0.8 + 11, 9, 24],
    entsorgen: w.entsorgen,
  }
}
