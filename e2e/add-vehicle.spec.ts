import { test, expect } from '@playwright/test';
import { enterAsGuest } from './_helpers';

/** F5 (manual add + validation) and F6 (labelled, simulated provider fetch). */

test.beforeEach(async ({ page }) => {
  await enterAsGuest(page);
  await page.goto('/vehicles/new');
  await expect(page.getByText('Add a vehicle')).toBeVisible();
});

test('V1 — registration under 6 chars is rejected', async ({ page }) => {
  await page.getByLabel(/registration number/i).fill('DL1');
  await page.getByRole('button', { name: /^Add vehicle$/i }).click();
  await expect(page.getByText(/valid registration number/i)).toBeVisible();
  // Still on the form, not navigated away.
  await expect(page).toHaveURL(/\/vehicles\/new/);
});

test('V2–V4 — manual add with class + sold date succeeds', async ({ page }) => {
  await page.getByLabel(/registration number/i).fill('KA05MJ2024');
  await page.getByLabel(/^model$/i).fill('Honda City');
  await page.getByRole('button', { name: /2-wheeler/i }).click(); // V3 class
  await page.getByLabel(/sold on/i).fill('2025-01-10'); // V4 sold date
  await page.getByRole('button', { name: /^Add vehicle$/i }).click();
  await expect(page).toHaveURL(/\/challans/);
});

test('V5–V7 — a plain demo vendor previews and confirms challans', async ({ page }) => {
  // V5 — the fetch panel is present, labelled as a demo, and lists vendors.
  await expect(
    page.getByText(/a live version fetches from a licensed VAHAN\/mParivahan data partner/i),
  ).toBeVisible();
  await expect(page.getByText('ChallanBridge')).toBeVisible();
  // The three plain vendors are badged "Demo" ("Live · demo" is a separate badge).
  await expect(page.getByText('Demo', { exact: true })).toHaveCount(3);

  // V6 — pick a plain demo vendor (no consent needed) and fetch; it returns 2–3.
  await page.getByRole('button', { name: /ChallanBridge/ }).click();
  await page.getByLabel(/registration number/i).fill('KA01AA1111');
  await page.getByRole('button', { name: /^Fetch challans$/i }).click();

  await expect(page.getByText(/\(demo\) returned these for KA01AA1111/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Found \d+ challans/i)).toBeVisible();

  // V7 — confirm the previewed challans; they are persisted and we land on Challans.
  await page.getByRole('button', { name: /^Add \d+ challans$/i }).click();
  await expect(page).toHaveURL(/\/challans/);
  await expect(page.getByText('KA01AA1111').first()).toBeVisible({ timeout: 15_000 });
});

test('V8 — Chukta Live (demo) is consent-gated and returns the curated case', async ({ page }) => {
  // Chukta Live is badged "Live · demo" and preselected first.
  await expect(page.getByText('Live · demo')).toBeVisible();

  await page.getByRole('button', { name: /Chukta Live/ }).click();
  await page.getByLabel(/registration number/i).fill('DL01CAB4321');

  // Consent is required: the fetch button is disabled until the box is checked.
  const fetchBtn = page.getByRole('button', { name: /^Fetch challans$/i });
  await expect(fetchBtn).toBeDisabled();
  await page.getByRole('checkbox').check();
  await expect(fetchBtn).toBeEnabled();

  await fetchBtn.click();
  await expect(page.getByText(/Chukta Live \(demo\) returned these for DL01CAB4321/i)).toBeVisible({
    timeout: 15_000,
  });
  // The curated flagship case is four detailed records.
  await expect(page.getByText(/Found 4 challans/i)).toBeVisible();
});
