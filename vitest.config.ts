import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      include: ['src/__tests__/**/*.test.{ts,tsx}'],
      testTimeout: 15000,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        all: true,
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'node_modules/',
          'dist/',
          'src/__tests__/',
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/**/*.d.ts',
        ],
      },
    },
  }),
);
