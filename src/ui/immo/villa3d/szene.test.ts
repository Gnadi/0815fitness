import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { baueEigenheim } from './eigenheim'
import { baueHaus } from './modelle'
import { HIMMEL, STIMMUNGEN, baueVilla, standardStimmung } from './szene'
import { DREI_D_TYPEN } from './typen'

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

describe('3D-Eigenheim', () => {
  it('baut Haus, Garage, Garten und Spielgeräte mit endlichen Koordinaten', () => {
    const v = baueEigenheim({ seed: 99, lage: 'mittel', flaeche: 160 })
    const z = zaehle(v.gruppe)
    expect(z.meshes).toBeGreaterThan(150)
    expect(z.lichter).toBeLessThanOrEqual(10)
    expect(z.dreiecke).toBeLessThan(80_000)
    v.gruppe.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const pos = m.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i))).toBe(true)
    })
    expect(v.innenMaterial.length).toBeGreaterThan(5)
    expect(v.innenLichter.length).toBeGreaterThanOrEqual(2)
    expect(v.aussenLichter.length).toBeGreaterThanOrEqual(3)
    expect(v.schwankend.length).toBeGreaterThan(5)
    expect(v.kamera).toBeDefined()
    expect(v.ziel.every(Number.isFinite)).toBe(true)
    expect(() => v.entsorgen()).not.toThrow()
  })

  it('ist pro Seed reproduzierbar, verändert sich zwischen Objekten und wächst mit der Fläche', () => {
    const farben = (v: ReturnType<typeof baueEigenheim>) => {
      const s: string[] = []
      v.gruppe.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh && (m.material as THREE.MeshStandardMaterial).color) s.push((m.material as THREE.MeshStandardMaterial).color.getHexString() + m.position.x.toFixed(2) + m.position.z.toFixed(2))
      })
      return s.join('|')
    }
    const a = baueEigenheim({ seed: 5, lage: 'mittel', flaeche: 150 })
    const b = baueEigenheim({ seed: 5, lage: 'mittel', flaeche: 150 })
    const c = baueEigenheim({ seed: 6, lage: 'mittel', flaeche: 150 })
    expect(farben(a)).toBe(farben(b))
    expect(farben(a)).not.toBe(farben(c))
    const klein = baueEigenheim({ seed: 5, lage: 'mittel', flaeche: 100 })
    const gross = baueEigenheim({ seed: 5, lage: 'mittel', flaeche: 240 })
    expect(gross.groesse.breite).toBeGreaterThan(klein.groesse.breite)
    for (const v of [a, b, c, klein, gross]) v.entsorgen()
  })
})

describe('3D-Modelle aller Objektarten', () => {
  const farben = (v: ReturnType<typeof baueHaus>): string => {
    const s: string[] = []
    v.gruppe.traverse((o) => {
      const m = o as THREE.Mesh
      const mat = m.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] | undefined
      const einzel = Array.isArray(mat) ? mat[0] : mat
      if (m.isMesh && einzel?.color) s.push(einzel.color.getHexString() + m.position.x.toFixed(2) + m.position.z.toFixed(2))
    })
    return s.join('|')
  }

  for (const typ of DREI_D_TYPEN) {
    it(`${typ}: baut eine vollständige, endliche und leichte Szene`, () => {
      const v = baueHaus(typ, { seed: 123, lage: 'mittel', flaeche: typ === 'mfh' ? 520 : typ === 'villa' ? 420 : 150, etagen: 4, zimmer: 8 })
      const z = zaehle(v.gruppe)
      expect(z.meshes, typ).toBeGreaterThan(100)
      expect(z.lichter, typ).toBeLessThanOrEqual(14)
      expect(z.dreiecke, typ).toBeLessThan(140_000)
      v.gruppe.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        const pos = m.geometry.attributes.position
        for (let i = 0; i < pos.count; i++) expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i)), typ).toBe(true)
      })
      expect(v.ziel.every(Number.isFinite), typ).toBe(true)
      expect(v.groesse.breite, typ).toBeGreaterThan(20)
      expect(v.innenMaterial.length, typ).toBeGreaterThan(2)
      expect(v.aussenLichter.length, typ).toBeGreaterThanOrEqual(2)
      expect(() => v.entsorgen()).not.toThrow()
    })

    it(`${typ}: ist pro Seed reproduzierbar und verändert sich zwischen Objekten`, () => {
      const p = { lage: 'mittel' as const, flaeche: 300, etagen: 4, zimmer: 8 }
      const a = baueHaus(typ, { ...p, seed: 11 })
      const b = baueHaus(typ, { ...p, seed: 11 })
      const c = baueHaus(typ, { ...p, seed: 12 })
      expect(farben(a)).toBe(farben(b))
      expect(farben(a)).not.toBe(farben(c))
      for (const v of [a, b, c]) v.entsorgen()
    })
  }

  it('Mehrfamilienhaus: mehr Geschosse und Fläche machen das Haus größer', () => {
    const klein = baueHaus('mfh', { seed: 3, lage: 'mittel', flaeche: 260, etagen: 3 })
    const gross = baueHaus('mfh', { seed: 3, lage: 'mittel', flaeche: 880, etagen: 5 })
    expect(gross.groesse.breite).toBeGreaterThan(klein.groesse.breite)
    expect(gross.groesse.hoehe).toBeGreaterThan(klein.groesse.hoehe)
    klein.entsorgen()
    gross.entsorgen()
  })

  it('Ferienhaus: Meer und Steg gehören zur Szene, das Wasser wird animiert', () => {
    const v = baueHaus('ferienhaus', { seed: 8, lage: 'top', flaeche: 120 })
    expect(v.wasser.length).toBeGreaterThanOrEqual(1)
    expect(v.schwankend.length).toBeGreaterThan(5)
    v.entsorgen()
  })
})
