import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
   resolve: {
    alias: {
      '@mindora/validation': path.resolve(__dirname, '../../packages/validation/src/index.ts'),
      '@mindora/auth-service': path.resolve(__dirname,'../auth-service/src/index.ts' )
    }
  },
    test: {
    environment: 'node',
    testTimeout: 10000
  }
})