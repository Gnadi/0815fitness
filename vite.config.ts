import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // Der 3D-Viewer (Three.js) ist groß und wird nur bei Bedarf geladen: nicht vorab cachen, sondern beim ersten Öffnen
        globIgnores: ['**/Villa3DViewer-*.js'],
        runtimeCaching: [{ urlPattern: /\/assets\/Villa3DViewer-.*\.js$/, handler: 'CacheFirst', options: { cacheName: 'viewer-3d', expiration: { maxEntries: 2 } } }],
      },
      manifest: {
        name: 'Karriere-Simulator',
        short_name: 'Karriere',
        description: 'Fußball-Karriere-Simulator: vom 16-jährigen Talent zur Legende.',
        lang: 'de',
        theme_color: '#0b1d12',
        background_color: '#0b1d12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
})
