import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Assumes the app is already running (API on :4000, web on :5173)
 * with a live DATABASE_URL — start it with `npm run dev` in another terminal,
 * or let Playwright start it via the webServer block below.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    ...devices['iPhone 13'],
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
