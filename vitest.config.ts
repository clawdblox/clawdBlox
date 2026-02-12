import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['apps/server/src/**/*.ts', 'packages/shared/src/**/*.ts'],
      exclude: ['**/index.ts', '**/run-migrations.ts'],
    },
    setupFiles: [],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@clawdblox/memoryweave-shared': path.resolve(__dirname, 'packages/shared/src'),
    },
  },
});
