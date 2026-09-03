import { test, expect } from '@playwright/test';

/**
 * F5 — manual add-vehicle form is present. F6 — the auto-fetch preview is
 * clearly labelled as a simulated demo (spec §F6: it must never imply a real
 * government fetch). This intentionally does not submit, to avoid writing rows.
 */
test('add-vehicle screen shows the form and the labelled auto-fetch demo', async ({ page }) => {
  await page.goto('/vehicles/new');

  // F5 — manual entry.
  await expect(page.getByText('Add a vehicle')).toBeVisible();
  await expect(page.getByLabel(/registration number/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Add vehicle$/i })).toBeVisible();

  // F6 — the fetch is present AND clearly labelled as a demo.
  await expect(page.getByText(/a live version fetches from VAHAN\/mParivahan/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /fetch challans \(demo\)/i })).toBeVisible();
});
