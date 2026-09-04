import { test, expect } from '@playwright/test';
import { enterAsGuest, loadDemoData, tapTab } from './_helpers';

/**
 * F5 challans list + F4 wrong-challan heuristics (computed live on GET /challans).
 * The demo dataset intentionally contains one of each flaggable case:
 *   - class mismatch: "Goods vehicle overloading" on an LMV
 *   - sold:           a challan dated after the vehicle's sold date
 *   - duplicate:      two identical Overspeeding challans
 */

const card = (page: import('@playwright/test').Page, text: string) =>
  page.locator('div.shadow-sm', { hasText: text }).first();

test.beforeEach(async ({ page }) => {
  await enterAsGuest(page);
  await loadDemoData(page);
  await tapTab(page, 'Challans');
  await expect(page.getByRole('heading', { name: 'Challans' })).toBeVisible();
});

test('C2–C3 — tabs, counts and the outstanding banner', async ({ page }) => {
  await expect(page.getByRole('button', { name: /^Pending/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Flagged/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^All/ })).toBeVisible();
  // Total outstanding banner (25,500).
  await expect(page.getByText('₹25,500')).toBeVisible();
});

test('C6 — overdue status is derived from the challan date', async ({ page }) => {
  await page.getByRole('button', { name: /^All/ }).click();
  await expect(page.getByText('overdue').first()).toBeVisible(); // 72-day red light
});

test('F4 — all three heuristics flag the right challans', async ({ page }) => {
  await page.getByRole('button', { name: /^Flagged/ }).click();
  await expect(
    page.getByText(/the offence implies a different vehicle class/i),
  ).toBeVisible(); // classMismatch
  await expect(page.getByText(/issued after you sold this vehicle/i)).toBeVisible(); // sold
  // The duplicate label appears on both challans of the identical pair.
  await expect(page.getByText(/duplicate of another challan/i).first()).toBeVisible();
  await expect(page.getByText(/duplicate of another challan/i)).toHaveCount(2);
});

test('C5 / F4→F1 — disputing a flagged challan pre-selects its ground', async ({ page }) => {
  await page.getByRole('button', { name: /^Flagged/ }).click();
  // The class-mismatch (goods-on-LMV) challan pre-selects the "wrong vehicle" ground.
  await card(page, 'Goods vehicle overloading')
    .getByRole('button', { name: /dispute this/i })
    .click();

  await expect(page).toHaveURL(/\/dispute\/new/);
  // Step 1 is prefilled from the challan — just continue.
  await expect(page.getByLabel(/vehicle number/i)).toHaveValue('DL3CAB1234');
  await page.getByRole('button', { name: /continue/i }).click();

  // Ground is already chosen (we never picked it) — generate straight away.
  await page.getByRole('button', { name: /generate letter/i }).click();
  const letter = page.locator('textarea[readonly]');
  await expect(letter).toContainText('different class or description'); // wrongvehicle paragraph
});
