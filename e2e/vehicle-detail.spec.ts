import { test, expect } from '@playwright/test';
import { enterAsGuest, loadDemoData } from './_helpers';

/** Vehicle detail: hero + details, challan history, dispute-from-detail, delete. */

test('VD1–VD4 — detail shows info, history and can dispute a challan', async ({ page }) => {
  await enterAsGuest(page);
  await loadDemoData(page);
  await page.getByRole('button', { name: /DL3CAB1234/ }).click();

  await expect(page.getByText('Vehicle Details')).toBeVisible();
  await expect(page.getByText('Maruti Swift')).toBeVisible();
  await expect(page.getByText('Registration')).toBeVisible();
  await expect(page.getByText('Challan history')).toBeVisible();
  await expect(page.getByText('Jumping red light')).toBeVisible();

  // VD4 — dispute a challan straight from the history.
  await page.getByRole('button', { name: /dispute this/i }).first().click();
  await expect(page).toHaveURL(/\/dispute\/new/);
  await expect(page.getByLabel(/vehicle number/i)).toHaveValue('DL3CAB1234');
});

test('VD2 — a sold vehicle shows its sold status and date', async ({ page }) => {
  await enterAsGuest(page);
  await loadDemoData(page);
  await page.getByRole('button', { name: /HR26DK8337/ }).click();
  await expect(page.getByText('Sold').first()).toBeVisible();
  await expect(page.getByText('Sold on')).toBeVisible();
});

test('VD5 — deleting a vehicle returns to Home and removes it', async ({ page }) => {
  await enterAsGuest(page);
  await loadDemoData(page);
  await page.getByRole('button', { name: /MH12AB0001/ }).click();
  await expect(page.getByText('Vehicle Details')).toBeVisible();
  await page.getByRole('button', { name: /delete vehicle/i }).click();
  await expect(page).toHaveURL(/localhost:5173\/$/);
  await expect(page.getByText('MH12AB0001')).toHaveCount(0);
});

test('VD6 — an unknown vehicle id shows a not-found state', async ({ page }) => {
  await enterAsGuest(page);
  await page.goto('/vehicles/does-not-exist');
  await expect(page.getByText(/vehicle not found/i)).toBeVisible();
});
