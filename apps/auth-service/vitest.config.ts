import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@mindora/validation': path.resolve(__dirname, '../../packages/validation/src/index.ts'),
      '@mindora/auth-service': path.resolve(__dirname,'./src/index.ts'),
      '@mindora/auth-middleware': path.resolve(__dirname, '../../packages/auth-middleware/src/index.ts'),
      '@mindora/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
    }
  },
  test: {
    environment: 'node',
    testTimeout: 10000
  }
})