import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@mindora/events': fileURLToPath(new URL('../../packages/events/src/index.ts', import.meta.url)),
      '@mindora/queue': fileURLToPath(new URL('../../packages/queue/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    testTimeout: 10000,
  },
})
