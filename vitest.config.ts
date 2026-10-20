import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // mirrors the "@/*" path in tsconfig.json
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: { include: ['lib/**/*.test.ts', 'components/**/*.test.ts?(x)'] },
});
