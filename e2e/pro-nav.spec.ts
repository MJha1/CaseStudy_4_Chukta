import { test, expect } from '@playwright/test';
import { enterAsGuest, tapTab } from './_helpers';

/** F8 Pro (display-only revenue screens) + bottom-tab navigation shell. */

test('P1/P2 — Pro shows plans + guardrails and simulates payment', async ({ page }) => {
  await enterAsGuest(page);
  await tapTab(page, 'Pro');

  await expect(page.getByText('Dispute success-fee')).toBeVisible();
  await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Fleet / B2B')).toBeVisible();
  await expect(page.getByText(/no pay-to-skip/i)).toBeVisible(); // guardrail

  // Payments are display-only.
  await page.getByRole('button', { name: /choose plan/i }).first().click();
  await expect(page.getByText(/payments simulated/i)).toBeVisible();
});

test('N1 — the bottom tab bar navigates across the app', async ({ page }) => {
  await enterAsGuest(page);
  await tapTab(page, 'Challans');
  await expect(page.getByRole('heading', { name: 'Challans' })).toBeVisible();
  await tapTab(page, 'Disputes');
  await expect(page.getByRole('heading', { name: 'Disputes' })).toBeVisible();
  await tapTab(page, 'Pro');
  await expect(page.getByRole('heading', { name: 'Chukta Pro' })).toBeVisible();
  await tapTab(page, 'Home');
  await expect(page.getByRole('heading', { name: /hello/i })).toBeVisible();
});

test('N2 — focused flows hide the tab bar', async ({ page }) => {
  await enterAsGuest(page);
  await page.goto('/dispute/new');
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveCount(0);
  await page.goto('/vehicles/new');
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveCount(0);
});
