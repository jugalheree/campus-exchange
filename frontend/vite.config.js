import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NOTE: vite-plugin-pwa is optional for Capacitor builds
// Capacitor handles its own native shell — PWA service worker is not needed
// when building the APK. The dist/ folder is what Capacitor bundles.

export default defineConfig({
  plugins: [react()],
  build: {
    // Capacitor needs assets in dist/
    outDir: 'dist',
    // Good chunk size for mobile
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          store: ['zustand'],
          http: ['axios'],
        }
      }
    }
  },
  // Needed so React Router works in Capacitor
  base: './',
})
