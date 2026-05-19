import { defineConfig } from 'vitest/config'

console.info  ('vitest.config.ts loaded')

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['e2e/**', 'node_modules', 'dist'],
  },
})