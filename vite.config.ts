import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The app is an Android app: Capacitor loads this build from the APK's assets, so every
// file is already on the device and there is nothing for a service worker to precache.
// The bundle that used to be a PWA shell is now just the WebView's payload.
export default defineConfig({
  plugins: [react()],
  build: {
    // Capacitor's WebView is Chrome on Android 8+, so there is no reason to ship
    // transforms for anything older than the baseline the app already targets.
    target: 'es2023',
  },
})
