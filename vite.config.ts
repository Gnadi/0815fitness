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
        // Nur die lateinischen Schnitte der Schriften vorab cachen, damit die App offline gleich aussieht
        globPatterns: ['**/*.{js,css,html,svg,png}', '**/*-latin-wght-normal-*.woff2'],
      },
      manifest: {
        name: 'Die Radlbäckerin · Linz',
        short_name: 'Radlbäckerin',
        description: 'Gebäck für Sonntag vorbestellen – geliefert mit dem Lastenrad in Linz.',
        lang: 'de',
        theme_color: '#111111',
        background_color: '#f4f1ea',
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
