import { test, expect } from '@playwright/test';
import { enterAsGuest, loadDemoData } from './_helpers';

/**
 * F5 — Home dashboard: empty state, sample-labelled demo data, computed stats,
 * DL-risk banner, garage search, and drill-in to a vehicle.
 *
 * Demo dataset (dates relative to today):
 *   DL3CAB1234 (LMV)  — Jumping red light ₹1,000 (72d, overdue) + Goods overloading ₹20,000 (20d)
 *   HR26DK8337 (2W)   — sold 120d ago; No parking ₹500 (40d, due)
 *   MH12AB0001 (LMV)  — Overspeeding ₹2,000 x2 (15d, identical => duplicate pair)
 * Outstanding = 25,500 · Disputable (flagged) = 24,500 · Overdue = 1
 */

test('H1 — empty Home shows the no-vehicles state with add + demo CTAs', async ({ page }) => {
  await enterAsGuest(page);
  await expect(page.getByText('No vehicles yet')).toBeVisible();
  // "Add vehicle" also appears as a quick action and the nav FAB; the empty-state CTA is first.
  await expect(page.getByRole('button', { name: /^add vehicle$/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /load demo data/i })).toBeVisible();
});

test('H2–H8 — dashboard renders demo data, stats, banner, search and drill-in', async ({ page }) => {
  await enterAsGuest(page);
  await loadDemoData(page);

  // H2 — sample data is badged "Demo".
  await expect(page.getByRole('button', { name: /DL3CAB1234/ })).toBeVisible();
  await expect(page.getByText('Demo').first()).toBeVisible();

  // H3 — computed stats.
  await expect(page.getByText('₹25,500')).toBeVisible(); // Outstanding
  await expect(page.getByText('₹24,500')).toBeVisible(); // Disputable (flagged)

  // H4 — DL-risk banner (one overdue challan).
  await expect(page.getByText(/1 overdue — licence at risk/i)).toBeVisible();

  // H7 — upcoming deadlines section.
  await expect(page.getByText(/upcoming deadlines/i)).toBeVisible();

  // H5 — search filters the garage by plate (the garage cards are buttons).
  await page.getByPlaceholder(/search by vehicle no/i).fill('HR26');
  await expect(page.getByRole('button', { name: /HR26DK8337/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /DL3CAB1234/ })).toHaveCount(0);
  await page.getByPlaceholder(/search by vehicle no/i).fill('');

  // H8 — tapping a vehicle card opens its detail page.
  await page.getByRole('button', { name: /DL3CAB1234/ }).click();
  await expect(page.getByText('Vehicle Details')).toBeVisible();
  await expect(page.getByText('Maruti Swift')).toBeVisible();
});

test('H6 — quick actions navigate to their destinations', async ({ page }) => {
  await enterAsGuest(page);
  await page.getByRole('button', { name: /^draft dispute$/i }).click();
  await expect(page).toHaveURL(/\/dispute\/new/);
});

test('H9 — search submits: known plate opens it, unknown plate starts an add', async ({ page }) => {
  await enterAsGuest(page);
  await loadDemoData(page);
  const search = page.getByPlaceholder(/search by vehicle no/i);

  // A plate in the garage → opens that vehicle.
  await search.fill('DL3CAB1234');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Vehicle Details')).toBeVisible();

  // A plate that isn't in the garage → Add vehicle, prefilled with it.
  await page.goto('/');
  await search.fill('KA09XY7777');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\/vehicles\/new/);
  await expect(page.getByLabel(/registration number/i)).toHaveValue('KA09XY7777');
});

test('H10 — the bell opens live notifications derived from the data', async ({ page }) => {
  await enterAsGuest(page);
  await loadDemoData(page);
  await page.getByRole('button', { name: 'Notifications' }).click();

  await expect(page.getByText('Notifications')).toBeVisible(); // panel header
  await expect(page.getByText(/Overdue — licence at risk/i).first()).toBeVisible(); // overdue alert
  await expect(page.getByText(/worth disputing/i).first()).toBeVisible(); // flagged alert
});
