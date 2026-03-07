import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173/petakarta/',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Start the Vite dev server automatically before running E2E tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/petakarta/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
