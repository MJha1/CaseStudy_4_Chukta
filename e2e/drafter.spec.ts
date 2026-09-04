import { test, expect } from '@playwright/test';
import { enterAsGuest } from './_helpers';

/**
 * F1 Dispute Drafter (the shippable core) + F2 deadline pieces surfaced in the
 * letter step + F7 analytics. This is the product's definition of done: a
 * stranger enters a real challan and gets a correct, copyable grievance letter
 * with a calendar reminder, then tracks it.
 */

async function fillStep1(
  page: import('@playwright/test').Page,
  o: { plate: string; amount: string; date: string; offence: string },
) {
  await page.getByLabel(/vehicle number/i).fill(o.plate);
  await page.getByLabel(/fine amount/i).fill(o.amount);
  await page.getByLabel(/challan date/i).fill(o.date);
  await page.getByLabel(/^offence/i).fill(o.offence);
  await page.getByRole('button', { name: /continue/i }).click();
}

test.beforeEach(async ({ page }) => {
  await enterAsGuest(page);
});

test('D2 — step 1 blocks on missing required fields', async ({ page }) => {
  await page.goto('/dispute/new');
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText(/valid registration number/i)).toBeVisible();
  await expect(page.getByText(/enter the fine amount/i)).toBeVisible();
  await expect(page.getByText(/enter the challan date/i)).toBeVisible();
  await expect(page.getByText(/enter the offence/i)).toBeVisible();
  await expect(page.getByText(/step 1 of 3/i)).toBeVisible(); // did not advance
});

test('D3/D7/G3/TR — happy path: draft, reminder, save & track', async ({ page }) => {
  await page.goto('/dispute/new');
  await fillStep1(page, {
    plate: 'DL3CAB1234',
    amount: '2000',
    date: '2026-07-15',
    offence: 'Overspeeding',
  });

  // Step 2 — pick a ground.
  await page.getByText(/not my vehicle/i).click();
  await page.getByRole('button', { name: /generate letter/i }).click();

  // Step 3 — the letter is personalized (D7).
  const letter = page.locator('textarea[readonly]');
  await expect(letter).toContainText('registered owner of vehicle DL3CAB1234');
  await expect(letter).toContainText('Overspeeding');
  await expect(letter).toContainText('₹2,000');

  // G3 — the calendar reminder is a prefilled Google Calendar link.
  const reminder = page.getByRole('link', { name: /add reminder/i });
  await expect(reminder).toHaveAttribute('href', /calendar\.google\.com/);
  await expect(reminder).toHaveAttribute('href', /DL3CAB1234/);

  // TR — save & track lands on the tracker with the dispute.
  await page.getByRole('button', { name: /save & track/i }).click();
  await expect(page).toHaveURL(/\/disputes/);
  await expect(page.getByText('DL3CAB1234').first()).toBeVisible();
});

test('D4/D5 — "sold" ground shows the sale-date field and letter paragraph', async ({ page }) => {
  await page.goto('/dispute/new');
  await fillStep1(page, {
    plate: 'HR26DK8337',
    amount: '500',
    date: '2026-06-20',
    offence: 'No parking',
  });
  await page.getByText('Vehicle already sold').click();
  await page.getByLabel(/date the vehicle was sold/i).fill('2025-06-01'); // conditional extra field
  await page.getByRole('button', { name: /generate letter/i }).click();

  const letter = page.locator('textarea[readonly]');
  await expect(letter).toContainText('I sold and handed over possession');
  await expect(letter).toContainText('1 June 2025'); // prettyDate(saleDate)
  await expect(letter).toContainText('Forms 29 & 30'); // evidence enclosure
});

test('D4/D5 — "already paid" ground carries the receipt id into the letter', async ({ page }) => {
  await page.goto('/dispute/new');
  await fillStep1(page, {
    plate: 'MH12AB0001',
    amount: '1000',
    date: '2026-06-20',
    offence: 'Using mobile while driving',
  });
  await page.getByRole('button', { name: /^Already paid/i }).click();
  await page.getByLabel(/receipt \/ transaction id/i).fill('UPI-REF-98765');
  await page.getByRole('button', { name: /generate letter/i }).click();

  const letter = page.locator('textarea[readonly]');
  await expect(letter).toContainText('UPI-REF-98765');
  await expect(letter).toContainText('reflect as pending');
});

test('D9 — an attached screenshot never leaves the device', async ({ page }) => {
  await page.goto('/dispute/new');
  // A tiny 1x1 PNG.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: 'challan.png',
    mimeType: 'image/png',
    buffer: png,
  });
  await expect(page.getByAltText('Challan screenshot')).toBeVisible();

  await fillStep1(page, {
    plate: 'DL3CAB1234',
    amount: '2000',
    date: '2026-07-15',
    offence: 'Overspeeding',
  });
  await page.getByText(/not my vehicle/i).click();
  await page.getByRole('button', { name: /generate letter/i }).click();

  // The letter lists the screenshot as an enclosure but contains no image data.
  const letter = page.locator('textarea[readonly]');
  await expect(letter).toContainText('Screenshot of the e-challan');
  await expect(letter).not.toContainText('data:image');

  // The persisted dispute carries only a boolean flag — no image bytes to the server.
  const reqP = page.waitForRequest(
    (r) => r.url().includes('/api/disputes') && r.method() === 'POST',
  );
  await page.getByRole('button', { name: /save & track/i }).click();
  const body = (await reqP).postDataJSON();
  expect(body.hasScreenshot).toBe(true);
  expect(JSON.stringify(body)).not.toContain('data:image');
  expect(JSON.stringify(body)).not.toContain('screenshot');
});

test('F7 — opening the drafter fires a real analytics event', async ({ page }) => {
  const reqP = page.waitForRequest(
    (r) => r.url().includes('/api/analytics') && r.method() === 'POST',
  );
  await page.goto('/dispute/new');
  const body = (await reqP).postDataJSON();
  expect(body.name).toBe('drafter_opened');
});
