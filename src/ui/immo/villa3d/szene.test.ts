import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { HIMMEL, STIMMUNGEN, baueVilla, standardStimmung } from './szene'

const zaehle = (g: THREE.Object3D): { meshes: number; lichter: number; dreiecke: number } => {
  let meshes = 0, lichter = 0, dreiecke = 0
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      meshes++
      const geo = (o as THREE.Mesh).geometry
      dreiecke += (geo.index ? geo.index.count : geo.attributes.position.count) / 3
    }
    if ((o as THREE.Light).isLight) lichter++
  })
  return { meshes, lichter, dreiecke }
}

describe('3D-Villa', () => {
  it('baut eine vollständige Szene mit endlichen Koordinaten', () => {
    const v = baueVilla({ seed: 4242, lage: 'top', flaeche: 420 })
    const z = zaehle(v.gruppe)
    expect(z.meshes).toBeGreaterThan(120)
    expect(z.lichter).toBeLessThanOrEqual(10)
    expect(z.dreiecke).toBeLessThan(60_000)
    v.gruppe.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const pos = m.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i))).toBe(true)
    })
    const box = new THREE.Box3().setFromObject(v.gruppe)
    expect(Number.isFinite(box.min.x + box.max.x)).toBe(true)
    expect(v.wasser.length).toBeGreaterThanOrEqual(1)
    expect(v.innenMaterial.length).toBeGreaterThan(2)
    expect(v.innenLichter.length).toBeGreaterThanOrEqual(1)
    expect(v.aussenLichter.length).toBeGreaterThanOrEqual(2)
    expect(() => v.entsorgen()).not.toThrow()
  })

  it('ist pro Seed reproduzierbar und verändert sich zwischen Objekten', () => {
    const a = baueVilla({ seed: 7, lage: 'mittel', flaeche: 400 })
    const b = baueVilla({ seed: 7, lage: 'mittel', flaeche: 400 })
    const c = baueVilla({ seed: 8, lage: 'mittel', flaeche: 400 })
    const farben = (v: ReturnType<typeof baueVilla>) => {
      const s: string[] = []
      v.gruppe.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh && (m.material as THREE.MeshStandardMaterial).color) s.push((m.material as THREE.MeshStandardMaterial).color.getHexString() + m.position.x.toFixed(2) + m.position.z.toFixed(2))
      })
      return s.join('|')
    }
    expect(farben(a)).toBe(farben(b))
    expect(farben(a)).not.toBe(farben(c))
    for (const v of [a, b, c]) v.entsorgen()
  })

  it('größere Villen werden länger', () => {
    const klein = baueVilla({ seed: 3, lage: 'mittel', flaeche: 280 })
    const gross = baueVilla({ seed: 3, lage: 'mittel', flaeche: 700 })
    expect(gross.groesse.breite).toBeGreaterThan(klein.groesse.breite)
    klein.entsorgen()
    gross.entsorgen()
  })

  it('jede Stimmung hat vollständige Lichtwerte; Standard folgt der Lage', () => {
    for (const s of STIMMUNGEN) {
      const h = HIMMEL[s.id]
      expect(h.sonneIntensitaet).toBeGreaterThan(0)
      expect(h.nebelDichte).toBeGreaterThan(0)
      expect(h.sonnePos.every(Number.isFinite)).toBe(true)
    }
    expect(HIMMEL.nacht.innenLicht).toBeGreaterThan(HIMMEL.abend.innenLicht)
    expect(HIMMEL.tag.innenLicht).toBe(0)
    expect(standardStimmung('einfach')).toBe('bedeckt')
    expect(standardStimmung('mittel')).toBe('tag')
    expect(standardStimmung('top')).toBe('abend')
  })
})
