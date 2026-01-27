import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      '**/__tests__/**/*.{test,spec}.{ts,tsx}',
      '**/test/integration/**/*.{test,spec}.{ts,tsx}',
      '**/test/unit/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.*',
        '**/__tests__/**',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // Mock Next.js server-only module for testing
      'server-only': resolve(__dirname, './src/test/__mocks__/server-only.ts'),
      '@': resolve(__dirname, './src'),
      '@hive/ui': resolve(__dirname, '../../packages/ui/src'),
      '@hive/tokens': resolve(__dirname, '../../packages/tokens/src'),
      '@hive/hooks': resolve(__dirname, '../../packages/hooks/src'),
      '@hive/utilities': resolve(__dirname, '../../packages/utilities/src'),
      '@hive/validation': resolve(__dirname, '../../packages/validation/src'),
      '@hive/i18n': resolve(__dirname, '../../packages/i18n/src'),
      '@hive/analytics': resolve(__dirname, '../../packages/analytics/src'),
      '@hive/api-client': resolve(__dirname, '../../packages/api-client/src'),
      '@hive/auth-logic': resolve(__dirname, '../../packages/auth-logic/src'),
      '@hive/firebase': resolve(__dirname, '../../packages/firebase/src'),
      '@hive/core': resolve(__dirname, '../../packages/core/src'),
    },
  },
});
