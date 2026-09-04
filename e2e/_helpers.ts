import { expect, type Page } from '@playwright/test';

/**
 * Shared E2E helpers. Every Playwright test runs in a fresh browser context, so
 * localStorage (and therefore the anonymous device id that scopes server data)
 * is unique per test — tests are naturally isolated from each other.
 */

/** Pass the sign-in gate as a guest and land on Home. */
export async function enterAsGuest(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /continue as guest/i }).click();
  await expect(page.getByRole('heading', { name: /hello/i })).toBeVisible();
}

/**
 * From a fresh Home (no vehicles), load the opt-in demo dataset and wait for the
 * garage to populate. Demo = 3 vehicles / 5 challans with a class-mismatch, a
 * sold-after-sale and a duplicate pair to exercise the F4 heuristics engine.
 */
export async function loadDemoData(page: Page): Promise<void> {
  await page.getByRole('button', { name: /load demo data/i }).click();
  await expect(page.getByRole('button', { name: /DL3CAB1234/ })).toBeVisible({ timeout: 15_000 });
}

/** Navigate via the bottom tab bar. */
export async function tapTab(page: Page, name: 'Home' | 'Challans' | 'Disputes' | 'Pro') {
  await page.getByRole('link', { name, exact: true }).click();
}
