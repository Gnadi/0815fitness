import * as THREE from 'three'
import type { Rng } from '../../../engine/rng'

/** Gemeinsame Bausteine für die 3D-Modelle (Villa, Eigenheim): Materialien, Pflanzen, Auto, Wasser, Aufräumen. */
export interface Werkzeug {
  gruppe: THREE.Group
  wasser: THREE.Mesh[]
  innenMaterial: THREE.MeshStandardMaterial[]
  innenLichter: THREE.PointLight[]
  aussenLichter: THREE.PointLight[]
  aussenMaterial: THREE.MeshStandardMaterial[]
  schwankend: { obj: THREE.Object3D; phase: number; amp: number }[]
  std: (farbe: number, rauheit?: number, metall?: number) => THREE.MeshStandardMaterial
  /** Quader mit Schatten; `eltern` ist standardmäßig die Gesamtgruppe. */
  kiste: (b: number, h: number, t: number, mat: THREE.Material, x: number, y: number, z: number, eltern?: THREE.Object3D, schatten?: boolean) => THREE.Mesh
  /** Warm leuchtendes Innenraum-Material (Intensität folgt der Stimmung). */
  innenWarm: (staerke?: number) => THREE.MeshStandardMaterial
  /** Leuchtende Außenfläche (Gartenleuchten, Unterwasserlicht). */
  aussenLeucht: (farbe: number, emissiv: number) => THREE.MeshStandardMaterial
  glas: THREE.MeshPhysicalMaterial
  rahmen: THREE.MeshStandardMaterial
  rundbaum: (x: number, z: number, s: number, farben?: number[]) => void
  zypresse: (x: number, z: number, s: number) => void
  palme: (x: number, z: number, s: number) => void
  auto: (x: number, z: number, drehung: number, farbe: number, kombi?: boolean) => void
  /** Rasen als große Kreisfläche. */
  wiese: (farbe: number) => void
  entsorgen: () => void
}

export function werkzeug(rng: Rng): Werkzeug {
  const gruppe = new THREE.Group()
  const wasser: THREE.Mesh[] = []
  const innenMaterial: THREE.MeshStandardMaterial[] = []
  const innenLichter: THREE.PointLight[] = []
  const aussenLichter: THREE.PointLight[] = []
  const aussenMaterial: THREE.MeshStandardMaterial[] = []
  const schwankend: Werkzeug['schwankend'] = []

  const std: Werkzeug['std'] = (farbe, rauheit = 0.85, metall = 0) => new THREE.MeshStandardMaterial({ color: farbe, roughness: rauheit, metalness: metall })
  const glas = new THREE.MeshPhysicalMaterial({ color: 0x9ec7e0, roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.34, envMapIntensity: 1.6, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.05 })
  const rahmen = std(0x1f2124, 0.5, 0.5)

  const kiste: Werkzeug['kiste'] = (b, h, t, mat, x, y, z, eltern = gruppe, schatten = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b, h, t), mat)
    m.position.set(x, y, z)
    m.castShadow = schatten
    m.receiveShadow = true
    eltern.add(m)
    return m
  }

  const innenWarm: Werkzeug['innenWarm'] = (staerke = 1) => {
    const m = new THREE.MeshStandardMaterial({ color: 0xf3e2c0, emissive: 0xffc770, emissiveIntensity: 0, roughness: 0.8 })
    m.userData.staerke = staerke
    innenMaterial.push(m)
    return m
  }

  const aussenLeucht: Werkzeug['aussenLeucht'] = (farbe, emissiv) => {
    const m = std(0xfff2cf, 0.4)
    m.emissive = new THREE.Color(emissiv)
    m.color.setHex(farbe)
    m.emissiveIntensity = 0
    aussenMaterial.push(m)
    return m
  }

  const laub = (farbe: number): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: farbe, roughness: 1, flatShading: true })
  const blob = (radius: number, mat: THREE.Material): THREE.Mesh => {
    const g = new THREE.IcosahedronGeometry(radius, 1)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const f = 1 + (rng.next() - 0.5) * 0.28
      pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f)
    }
    g.computeVertexNormals()
    const m = new THREE.Mesh(g, mat)
    m.castShadow = true
    m.receiveShadow = true
    return m
  }

  const rundbaum: Werkzeug['rundbaum'] = (x, z, s, farben = [0x4e8f4a, 0x5aa04e, 0x3f7d46]) => {
    const baum = new THREE.Group()
    const stamm = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 2.4 * s, 8), std(0x6b4a33, 1))
    stamm.position.y = 1.2 * s
    stamm.castShadow = true
    baum.add(stamm)
    const krone = new THREE.Group()
    const farbe = farben[rng.int(0, farben.length - 1)]
    for (const [dx, dy, dz, r] of [[0, 3.4, 0, 1.7], [-1.1, 2.9, 0.4, 1.2], [1.0, 3.0, -0.3, 1.3]] as const) {
      const b = blob(r * s, laub(farbe))
      b.position.set(dx * s, dy * s, dz * s)
      krone.add(b)
    }
    baum.add(krone)
    baum.position.set(x, 0, z)
    gruppe.add(baum)
    schwankend.push({ obj: krone, phase: rng.next() * 6, amp: 0.012 })
  }

  const zypresse: Werkzeug['zypresse'] = (x, z, s) => {
    const m = blob(1, laub(0x2f6b3a))
    m.scale.set(0.8 * s, 3.4 * s, 0.8 * s)
    m.position.set(x, 3.2 * s, z)
    gruppe.add(m)
    schwankend.push({ obj: m, phase: rng.next() * 6, amp: 0.006 })
  }

  const palme: Werkzeug['palme'] = (x, z, s) => {
    const p = new THREE.Group()
    const hoehe = 6.5 * s
    // Gebogener, nach oben dünner werdender Stamm aus einem Röhrenkörper
    const punkte = [0, 1, 2, 3, 4, 5, 6].map((i) => new THREE.Vector3(Math.sin(i * 0.5) * 0.35 * s - i * 0.04 * s, (hoehe / 6) * i, 0))
    const stamm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(punkte), 14, 0.2 * s, 8), std(0x8a6a4a, 1))
    stamm.castShadow = true
    p.add(stamm)
    const krone = new THREE.Group()
    krone.position.copy(punkte[6])
    const wedel = new THREE.MeshStandardMaterial({ color: 0x3f8f4a, roughness: 0.9, side: THREE.DoubleSide, flatShading: true })
    for (let i = 0; i < 10; i++) {
      const g = new THREE.ConeGeometry(0.34 * s, 3.4 * s, 3)
      g.translate(0, 1.7 * s, 0)
      const w = new THREE.Mesh(g, wedel)
      w.scale.set(1, 1, 0.25)
      w.castShadow = true
      const halter = new THREE.Group()
      halter.rotation.y = (i / 10) * Math.PI * 2
      w.rotation.z = -(1.15 + (i % 2) * 0.3)
      halter.add(w)
      krone.add(halter)
    }
    p.add(krone)
    p.position.set(x, 0, z)
    gruppe.add(p)
    schwankend.push({ obj: krone, phase: rng.next() * 6, amp: 0.02 })
  }

  const auto: Werkzeug['auto'] = (x, z, drehung, farbe, kombi = false) => {
    const a = new THREE.Group()
    const lack = new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.25, metalness: 0.6 })
    const laenge = kombi ? 4.6 : 4.4
    kiste(laenge, 0.55, 1.85, lack, 0, 0.55, 0, a)
    if (kombi) kiste(3.3, 0.6, 1.7, lack, -0.5, 1.12, 0, a)
    else kiste(2.3, 0.5, 1.6, lack, -0.2, 1.05, 0, a)
    kiste(kombi ? 3.2 : 2.15, 0.4, 1.72, glas, kombi ? -0.5 : -0.2, kombi ? 1.14 : 1.08, 0, a, false)
    for (const sx of [-1.4, 1.4]) for (const sz of [-0.9, 0.9]) {
      const rad = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14), std(0x15171a, 0.9))
      rad.rotation.x = Math.PI / 2
      rad.position.set(sx, 0.36, sz)
      rad.castShadow = true
      a.add(rad)
    }
    a.position.set(x, 0.06, z)
    a.rotation.y = drehung
    gruppe.add(a)
  }

  const wiese: Werkzeug['wiese'] = (farbe) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(230, 64), std(farbe, 1))
    m.rotation.x = -Math.PI / 2
    m.receiveShadow = true
    gruppe.add(m)
  }

  const entsorgen = (): void => {
    gruppe.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
      const mat = m.material as THREE.Material | THREE.Material[] | undefined
      for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) {
        const tx = (x as THREE.MeshStandardMaterial).map
        if (tx) tx.dispose()
        x.dispose()
      }
    })
  }

  return { gruppe, wasser, innenMaterial, innenLichter, aussenLichter, aussenMaterial, schwankend, std, kiste, innenWarm, aussenLeucht, glas, rahmen, rundbaum, zypresse, palme, auto, wiese, entsorgen }
}

/** Wellenmuster für das Wasser (nur im Browser; ohne Canvas bleibt das Wasser einfarbig). */
export function kausticTextur(rng: Rng): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#35b6d6'
  ctx.fillRect(0, 0, 256, 256)
  ctx.lineCap = 'round'
  for (let i = 0; i < 70; i++) {
    const x = rng.next() * 256
    const y = rng.next() * 256
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + rng.next() * 0.16})`
    ctx.lineWidth = 1 + rng.next() * 2.2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + 30, y - 20, x + 50, y + 30, x + 90, y + rng.next() * 20 - 10)
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 2)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Ziegelmuster für Dächer (nur im Browser; sonst bleibt das Dach einfarbig). */
export function dachTextur(farbe: string, fuge: string): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = farbe
  ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = fuge
  ctx.lineWidth = 2
  for (let r = 0; r < 8; r++) {
    const y = r * 16
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(128, y)
    ctx.stroke()
    for (let x = (r % 2) * 8; x < 128; x += 16) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + 16)
      ctx.stroke()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
