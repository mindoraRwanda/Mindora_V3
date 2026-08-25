import { defineConfig } from 'vitest/config';

// Matches every other service. Without this, vitest also collects the
// compiled copies under dist/, so each suite ran twice and a stale build
// could pass or fail independently of the source it was built from.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
