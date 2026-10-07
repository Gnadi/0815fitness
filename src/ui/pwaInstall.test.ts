import { afterEach, describe, expect, it, vi } from 'vitest'

type Hoerer = (e: unknown) => void

const umgebung = (opts: { standalone?: boolean; ua?: string } = {}) => {
  const hoerer: Record<string, Hoerer> = {}
  const g = globalThis as unknown as Record<string, unknown>
  g.window = {
    addEventListener: (n: string, h: Hoerer) => { hoerer[n] = h },
    matchMedia: () => ({ matches: opts.standalone ?? false }),
    navigator: { userAgent: opts.ua ?? 'Chrome', maxTouchPoints: 0 },
  }
  Object.defineProperty(globalThis, 'navigator', { value: (g.window as { navigator: unknown }).navigator, configurable: true })
  return hoerer
}

afterEach(() => {
  vi.resetModules()
  delete (globalThis as Record<string, unknown>).window
})

describe('PWA-Installation', () => {
  it('erkennt iPhone, iPad und iPadOS', async () => {
    const { istIos } = await import('./pwaInstall')
    expect(istIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(true)
    expect(istIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true)
    expect(istIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false)
    expect(istIos('Mozilla/5.0 (Linux; Android 14)', 5)).toBe(false)
  })

  it('wird „bereit“, sobald der Browser die Installation anbietet, und löst den Dialog aus', async () => {
    const hoerer = umgebung()
    const m = await import('./pwaInstall')
    m.initPwaInstall()
    expect(m.installStatus()).toBe('nicht-verfuegbar')
    const prompt = vi.fn().mockResolvedValue(undefined)
    const preventDefault = vi.fn()
    hoerer.beforeinstallprompt({ preventDefault, prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) })
    expect(preventDefault).toHaveBeenCalled()
    expect(m.installStatus()).toBe('bereit')
    expect(await m.installieren()).toBe(true)
    expect(prompt).toHaveBeenCalledOnce()
    expect(m.installStatus()).toBe('installiert')
  })

  it('bleibt nach Ablehnen verfügbar nicht, aber ohne Fehler; ohne Ereignis passiert nichts', async () => {
    const hoerer = umgebung()
    const m = await import('./pwaInstall')
    m.initPwaInstall()
    expect(await m.installieren()).toBe(false)
    hoerer.beforeinstallprompt({ preventDefault: () => undefined, prompt: async () => undefined, userChoice: Promise.resolve({ outcome: 'dismissed' }) })
    expect(await m.installieren()).toBe(false)
    expect(m.installStatus()).toBe('nicht-verfuegbar')
  })

  it('gilt als installiert bei appinstalled und im Standalone-Modus', async () => {
    const hoerer = umgebung()
    const m = await import('./pwaInstall')
    m.initPwaInstall()
    hoerer.appinstalled({})
    expect(m.installStatus()).toBe('installiert')
    vi.resetModules()
    umgebung({ standalone: true })
    expect((await import('./pwaInstall')).installStatus()).toBe('installiert')
  })
})
