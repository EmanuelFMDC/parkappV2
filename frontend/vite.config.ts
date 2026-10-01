import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, type Plugin } from 'vitest/config'

/** The MSW worker is a dev/e2e tool: a real build must not ship it. */
function stripMockWorker(mode: string): Plugin {
  return {
    name: 'parkapp:strip-mock-worker',
    apply: 'build',
    enforce: 'post',
    closeBundle: {
      order: 'post',
      handler() {
        if (mode !== 'e2e') rmSync(resolve('dist/mockServiceWorker.js'), { force: true })
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    stripMockWorker(mode),
    VitePWA({
      registerType: 'autoUpdate',
      // The mock API (MSW) needs the only service worker slot, so the mock build does not register the PWA one.
      injectRegister: mode === 'e2e' ? false : 'auto',
      includeAssets: ['favicon.svg'],
      workbox: { globIgnores: ['**/mockServiceWorker.js'] },
      manifest: {
        name: 'ParkApp',
        short_name: 'ParkApp',
        description: 'Renta cocheras por horas cerca de tu evento.',
        lang: 'es-MX',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0F3D91',
        background_color: '#F6F7FA',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    env: { VITE_API_URL: 'http://localhost:8000' },
  },
}))
