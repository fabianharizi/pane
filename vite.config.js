// `defineConfig` comes from vitest/config rather than vite so the `test` block
// is recognised; it re-exports Vite's own, so the build side is unaffected.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // The suite covers pure geometry/math modules only — no components, no DOM,
  // so `node` rather than jsdom. Tests sit next to the module they cover and
  // are never imported by src, so `vite build` ignores them.
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
