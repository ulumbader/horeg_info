import { defineConfig } from 'vitest/config';
import path from 'path';

const databaseUrl = process.env.TEST_DATABASE_URL ?? 'postgresql://test:test@127.0.0.1:5432/horeg_test?schema=vitest';
const directUrl = process.env.TEST_DIRECT_URL ?? databaseUrl;

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/global-setup.ts',
    fileParallelism: false,
    env: {
      DATABASE_URL: databaseUrl,
      DIRECT_URL: directUrl,
    },
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './tests/server-only.ts'),
    },
  },
});
