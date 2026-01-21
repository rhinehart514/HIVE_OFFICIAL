import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Regular E2E tests - multi-browser
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/stress/**',
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/stress/**',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/stress/**',
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: '**/stress/**',
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testIgnore: '**/stress/**',
    },

    // Stress tests - Chromium only, single worker, long timeouts
    {
      name: 'stress',
      testDir: './src/test/e2e/stress',
      use: {
        ...devices['Desktop Chrome'],
        // No retries for stress tests - we want accurate metrics
        trace: 'off',
        screenshot: 'off',
        video: 'off',
      },
      retries: 0,
      workers: 1, // Sequential execution for accurate metrics
      timeout: 600000, // 10 minute timeout per test
    },

    // Accessibility tests - axe-core audits
    {
      name: 'accessibility',
      testDir: './src/test/e2e/accessibility',
      use: {
        ...devices['Desktop Chrome'],
      },
      retries: 0,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
