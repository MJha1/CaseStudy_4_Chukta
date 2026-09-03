import { test, expect } from '@playwright/test';

/**
 * Definition of done (spec §9): a stranger can enter a real challan and get a
 * correct, copyable grievance letter + a calendar reminder, then track it —
 * end to end, in the deployed app.
 */
test('draft a dispute and see it in the tracker', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/hello/i).first()).toBeVisible();

  // Start the drafter via the Quick Actions grid.
  await page.getByRole('button', { name: /draft dispute/i }).click();

  // Step 1 — challan details.
  await page.getByLabel(/vehicle number/i).fill('DL3CAB1234');
  await page.getByLabel(/fine amount/i).fill('2000');
  await page.getByLabel(/challan date/i).fill('2026-07-15');
  await page.getByLabel(/^offence/i).fill('Overspeeding');
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 2 — ground.
  await page.getByText(/not my vehicle/i).click();
  await page.getByRole('button', { name: /generate letter/i }).click();

  // Step 3 — the letter is personalized.
  const letter = page.locator('textarea[readonly]');
  await expect(letter).toContainText('registered owner of vehicle DL3CAB1234');
  await expect(letter).toContainText('Overspeeding');

  // The calendar reminder link is present and prefilled.
  const reminder = page.getByRole('link', { name: /add reminder/i });
  await expect(reminder).toHaveAttribute('href', /calendar\.google\.com/);

  // Save & track.
  await page.getByRole('button', { name: /save & track/i }).click();

  // Lands on the tracker with the saved dispute.
  await expect(page).toHaveURL(/\/disputes/);
  await expect(page.getByText('DL3CAB1234').first()).toBeVisible();
  await expect(page.getByText(/not my vehicle/i).first()).toBeVisible();
});
