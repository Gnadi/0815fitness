import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ isSsrBuild }) => ({
  base: './',
  plugins: [
    react(),
    !isSsrBuild && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt'],
      workbox: {
        // Alles vorab cachen (Schriften sind zugeschnitten und klein), damit die App offline gleich aussieht
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/screenshots/**', '**/radl-icon-maskable.svg'],
      },
      manifest: {
        id: './',
        name: 'Die Radlbäckerin · Sonntagszettel',
        short_name: 'Radlbäckerin',
        description: 'Gebäck aus unserer Küche für Sonntag vorbestellen – frühmorgens mit dem Lastenrad an deine Tür.',
        lang: 'de-AT',
        dir: 'ltr',
        categories: ['food', 'shopping'],
        theme_color: '#e7dfcf',
        background_color: '#e7dfcf',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'radl-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'radl-icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'radl-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'radl-icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
        shortcuts: [
          { name: 'Zettel ausfüllen', short_name: 'Bestellen', url: './#was', icons: [{ src: 'radl-icon-192.png', sizes: '192x192' }] },
        ],
        screenshots: [
          { src: 'screenshots/handy.jpg', sizes: '780x1688', type: 'image/jpeg', form_factor: 'narrow', label: 'Der Sonntagszettel am Handy' },
          { src: 'screenshots/desktop.jpg', sizes: '1280x800', type: 'image/jpeg', form_factor: 'wide', label: 'Der Sonntagszettel am Computer' },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
}))
