import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Assumes the app is already running (API on :4000, web on :5173)
 * with a live DATABASE_URL — start it with `npm run dev` in another terminal,
 * or let Playwright start it via the webServer block below.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  // This is an integration suite against a single API process + a shared (remote
  // Neon) database, and the simulated providers add artificial latency. Run
  // serially so parallel workers don't contend for that one backend and time out.
  fullyParallel: false,
  workers: 1,
  expect: { timeout: 10_000 },
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
