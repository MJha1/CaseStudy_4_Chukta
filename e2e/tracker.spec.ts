import { test, expect } from '@playwright/test';
import { enterAsGuest, tapTab } from './_helpers';

/** F3 Dispute Tracker: persisted disputes, view letter, mark filed, delete. */

async function draftOneDispute(page: import('@playwright/test').Page) {
  await page.goto('/dispute/new');
  await page.getByLabel(/vehicle number/i).fill('DL3CAB1234');
  await page.getByLabel(/fine amount/i).fill('2000');
  await page.getByLabel(/challan date/i).fill('2026-07-15');
  await page.getByLabel(/^offence/i).fill('Overspeeding');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByText(/not my vehicle/i).click();
  await page.getByRole('button', { name: /generate letter/i }).click();
  await page.getByRole('button', { name: /save & track/i }).click();
  await expect(page).toHaveURL(/\/disputes/);
  await expect(page.getByText('DL3CAB1234').first()).toBeVisible();
}

test('TR1 — empty tracker prompts drafting the first dispute', async ({ page }) => {
  await enterAsGuest(page);
  await tapTab(page, 'Disputes');
  await expect(page.getByText('No disputes yet')).toBeVisible();
  await expect(page.getByRole('button', { name: /draft a dispute/i })).toBeVisible();
});

test('TR2/TR3 — a saved dispute lists with its ground and opens the letter', async ({ page }) => {
  await enterAsGuest(page);
  await draftOneDispute(page);

  await expect(page.getByText('Not my vehicle / wrong vehicle class')).toBeVisible();
  await page.getByRole('button', { name: /view letter/i }).click();
  await expect(page.getByText('Grievance letter')).toBeVisible();
  await expect(page.getByText(/registered owner of vehicle DL3CAB1234/i)).toBeVisible();
  await page.getByRole('button', { name: /close/i }).click();
});

test('TR4/TR7 — mark filed persists across a reload', async ({ page }) => {
  await enterAsGuest(page);
  await draftOneDispute(page);

  await page.getByRole('button', { name: /^mark filed$/i }).click();
  await expect(page.getByText('Filed').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('Filed').first()).toBeVisible(); // survived reload (server-persisted)
});

test('TR6 — deleting a dispute removes it', async ({ page }) => {
  await enterAsGuest(page);
  await draftOneDispute(page);

  await page.getByRole('button', { name: /delete dispute/i }).click();
  await expect(page.getByText('No disputes yet')).toBeVisible();
});
