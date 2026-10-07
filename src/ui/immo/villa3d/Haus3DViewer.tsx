import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ImmoLage } from '../../../engine/types'
import { baueEigenheim } from './eigenheim'
import { HIMMEL, STIMMUNGEN, baueVilla, standardStimmung, type Stimmung, type VillaSzene } from './szene'

interface Props {
  typ: 'villa' | 'eigenheim'
  seed: number
  lage: ImmoLage
  flaeche: number
  titel: string
  onClose: () => void
}

/** Himmelskuppel mit Farbverlauf; liefert auch die Umgebungsreflexion für Glas und Wasser. */
function himmelKuppel(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { oben: { value: new THREE.Color() }, horizont: { value: new THREE.Color() }, unten: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 oben; uniform vec3 horizont; uniform vec3 unten; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(horizont, oben, pow(clamp(h*1.6,0.0,1.0), 0.8)) : mix(horizont, unten, clamp(-h*3.0,0.0,1.0)); gl_FragColor = vec4(c,1.0); }',
  })
  const m = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 20), mat)
  m.renderOrder = -10
  return m
}

function sterne(): THREE.Points {
  const n = 420
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2
    const v = Math.acos(Math.random() * 0.95 + 0.05)
    pos.set([Math.cos(u) * Math.sin(v) * 280, Math.cos(v) * 280, Math.sin(u) * Math.sin(v) * 280], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }))
}

/** Prüft, ob der Browser WebGL anbietet. */
export function webglVerfuegbar(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Drehbare 3D-Ansicht einer Villa oder eines Eigenheims im Vollbild, mit Tageszeit-Schalter. */
export default function Haus3DViewer({ typ, seed, lage, flaeche, titel, onClose }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [stimmung, setStimmung] = useState<Stimmung>(standardStimmung(lage))
  const [fehler, setFehler] = useState(false)
  const [bereit, setBereit] = useState(false)
  const stimmungRef = useRef<Stimmung>(stimmung)
  const wende = useRef<((s: Stimmung) => void) | null>(null)
  stimmungRef.current = stimmung

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      setFehler(true)
      return
    }
    const klein = Math.min(window.innerWidth, window.innerHeight) < 600
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, klein ? 1.75 : 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none'

    const scene = new THREE.Scene()
    const kamera = new THREE.PerspectiveCamera(38, 1, 0.5, 700)
    const szene: VillaSzene = typ === 'villa' ? baueVilla({ seed, lage, flaeche }) : baueEigenheim({ seed, lage, flaeche })
    scene.add(szene.gruppe)

    const kuppel = himmelKuppel()
    scene.add(kuppel)
    const stars = sterne()
    scene.add(stars)
    const sonnenKugel = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }))
    scene.add(sonnenKugel)

    const sonne = new THREE.DirectionalLight(0xffffff, 1)
    const karte = klein ? 1024 : 2048
    sonne.castShadow = true
    sonne.shadow.mapSize.set(karte, karte)
    sonne.shadow.camera.left = -34
    sonne.shadow.camera.right = 34
    sonne.shadow.camera.top = 34
    sonne.shadow.camera.bottom = -34
    sonne.shadow.camera.near = 1
    sonne.shadow.camera.far = 160
    sonne.shadow.bias = -0.0004
    sonne.shadow.normalBias = 0.04
    scene.add(sonne, sonne.target)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x446644, 0.7)
    scene.add(hemi)
    scene.fog = new THREE.FogExp2(0xcfe3f2, 0.004)

    const pmrem = new THREE.PMREMGenerator(renderer)
    let umgebung: THREE.WebGLRenderTarget | null = null

    const wendeStimmung = (id: Stimmung): void => {
      const h = HIMMEL[id]
      const u = (kuppel.material as THREE.ShaderMaterial).uniforms
      u.oben.value.setHex(h.oben)
      u.horizont.value.setHex(h.horizont)
      u.unten.value.setHex(h.nebel)
      const richtung = new THREE.Vector3(...h.sonnePos).normalize()
      sonne.position.copy(richtung).multiplyScalar(90)
      sonne.color.setHex(h.sonne)
      sonne.intensity = h.sonneIntensitaet
      sonnenKugel.position.copy(richtung).multiplyScalar(250)
      ;(sonnenKugel.material as THREE.MeshBasicMaterial).color.setHex(id === 'nacht' ? 0xdfe6ff : h.sonne)
      sonnenKugel.scale.setScalar(id === 'nacht' ? 0.55 : id === 'bedeckt' ? 0.0001 : id === 'abend' ? 1.6 : 1)
      hemi.color.setHex(h.hemiOben)
      hemi.groundColor.setHex(h.hemiUnten)
      hemi.intensity = h.hemiIntensitaet
      ;(scene.fog as THREE.FogExp2).color.setHex(h.nebel)
      ;(scene.fog as THREE.FogExp2).density = h.nebelDichte
      renderer.toneMappingExposure = h.belichtung
      ;(stars.material as THREE.PointsMaterial).opacity = h.sterne
      for (const m of szene.innenMaterial) m.emissiveIntensity = h.innenLicht * (Number(m.userData.staerke) || 1)
      for (const m of szene.aussenMaterial) m.emissiveIntensity = h.aussenLicht * 1.6
      for (const l of szene.innenLichter) l.intensity = h.innenLicht * 38
      szene.aussenLichter.forEach((l, i) => { l.intensity = h.aussenLicht * (i === 0 ? 30 : 9) })
      // Umgebungsreflexion aus dem Himmel neu berechnen
      const sky = new THREE.Scene()
      sky.add(kuppel.clone())
      const glanz = sonnenKugel.clone()
      glanz.scale.multiplyScalar(id === 'nacht' ? 2 : 3.2)
      sky.add(glanz)
      umgebung?.dispose()
      umgebung = pmrem.fromScene(sky, 0.02, 1, 1000)
      scene.environment = umgebung.texture
      scene.environmentIntensity = id === 'nacht' ? 0.35 : id === 'abend' ? 0.8 : 1
    }
    wende.current = wendeStimmung
    wendeStimmung(stimmungRef.current)

    // Kamera und Steuerung
    const b = szene.groesse
    if (szene.kamera) kamera.position.set(...szene.kamera)
    else kamera.position.set(b.breite * 0.55, b.hoehe * 1.7, b.tiefe * 0.62)
    const steuerung = new OrbitControls(kamera, renderer.domElement)
    steuerung.target.set(...szene.ziel)
    steuerung.enableDamping = true
    steuerung.dampingFactor = 0.08
    steuerung.enablePan = false
    steuerung.minDistance = 11
    steuerung.maxDistance = 58
    steuerung.minPolarAngle = 0.2
    steuerung.maxPolarAngle = Math.PI / 2 - 0.04
    const bewegung = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    steuerung.autoRotate = bewegung
    steuerung.autoRotateSpeed = 0.55
    steuerung.addEventListener('start', () => { steuerung.autoRotate = false })
    steuerung.update()

    const basisAbstand = kamera.position.distanceTo(steuerung.target)
    const groesse = (): void => {
      const w = Math.max(1, el.clientWidth)
      const h = Math.max(1, el.clientHeight)
      renderer.setSize(w, h, false)
      kamera.aspect = w / h
      // Im Hochformat etwas weiter weg, damit das Haus ins Bild passt
      kamera.fov = w / h < 0.8 ? 46 : 38
      kamera.updateProjectionMatrix()
      // Im Hochformat weiter weg, damit das ganze Haus ins Bild passt
      const abstand = Math.min(steuerung.maxDistance, basisAbstand * (w / h < 1 ? Math.pow(1 / (w / h), 0.55) : 1))
      const richtung = kamera.position.clone().sub(steuerung.target).normalize()
      kamera.position.copy(steuerung.target).addScaledVector(richtung, abstand)
    }
    groesse()
    const beobachter = new ResizeObserver(groesse)
    beobachter.observe(el)

    let laeuft = true
    let raf = 0
    const start = performance.now()
    const zeichne = (): void => {
      if (!laeuft) return
      raf = requestAnimationFrame(zeichne)
      const t = (performance.now() - start) / 1000
      if (bewegung) {
        for (const w of szene.wasser) {
          const map = (w.material as THREE.MeshPhysicalMaterial).map
          if (map) map.offset.set(t * 0.012, t * 0.008)
        }
        for (const s of szene.schwankend) {
          s.obj.rotation.z = Math.sin(t * 0.9 + s.phase) * s.amp
          s.obj.rotation.x = Math.cos(t * 0.7 + s.phase) * s.amp * 0.7
        }
      }
      steuerung.update()
      renderer.render(scene, kamera)
    }
    zeichne()
    setBereit(true)

    return () => {
      laeuft = false
      cancelAnimationFrame(raf)
      beobachter.disconnect()
      steuerung.dispose()
      szene.entsorgen()
      umgebung?.dispose()
      pmrem.dispose()
      ;(kuppel.material as THREE.Material).dispose()
      kuppel.geometry.dispose()
      stars.geometry.dispose()
      ;(stars.material as THREE.Material).dispose()
      sonnenKugel.geometry.dispose()
      ;(sonnenKugel.material as THREE.Material).dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      wende.current = null
    }
  }, [typ, seed, lage, flaeche])

  useEffect(() => {
    wende.current?.(stimmung)
  }, [stimmung])

  useEffect(() => {
    const taste = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [onClose])

  return (
    <div className="viewer3d" role="dialog" aria-modal="true" aria-label={`3D-Ansicht: ${titel}`}>
      <div className="viewer3d-leinwand" ref={host} data-bereit={bereit ? '1' : '0'} />
      <header className="viewer3d-kopf">
        <button type="button" className="btn small-text" onClick={onClose}>✕ Schließen</button>
        <span className="viewer3d-titel">{titel}</span>
      </header>
      {fehler && <p className="viewer3d-fehler">Dein Gerät unterstützt keine 3D-Grafik (WebGL). Die Illustration im Exposé bleibt verfügbar.</p>}
      {!bereit && !fehler && <p className="viewer3d-fehler">3D wird geladen …</p>}
      {!fehler && (
        <footer className="viewer3d-fuss">
          <div className="viewer3d-chips" role="group" aria-label="Tageszeit">
            {STIMMUNGEN.map((s) => (
              <button key={s.id} type="button" className={`viewer3d-chip${stimmung === s.id ? ' on' : ''}`} onClick={() => setStimmung(s.id)}>{s.label}</button>
            ))}
          </div>
          <p className="viewer3d-hinweis">Ziehen zum Drehen · Zwei Finger oder Mausrad zum Zoomen</p>
        </footer>
      )}
    </div>
  )
}
