import { config } from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const result = config({ path: path.resolve(process.cwd(), '.env.test') });
if (!result.parsed) {
  throw new Error(`Failed to load .env.test from ${path.resolve(process.cwd(), '.env.test')}`);
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: result.parsed as Record<string, string>,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.test.ts', '**/node_modules/**', '**/dist/**'],
    },
  },
});