import { test, expect } from '@playwright/test';
import { enterAsGuest, loadDemoData } from './_helpers';

/**
 * Auth session state machine + dark-mode theming.
 *
 * Real Google sign-in is deliberately NOT driven here: it needs a genuine Google
 * ID token, which cannot be minted in an E2E browser. The server side of it
 * (verify token → upsert user → claim the guest's rows) is covered by the API
 * contract tests in apps/api/src/routes/auth.test.ts. These specs cover every
 * part of the flow that IS reachable without Google: the gate, guest mode,
 * persistence, returning to sign-in, and per-device data isolation.
 */

test.describe('Auth & session', () => {
  test('A1 — first visit is gated by the sign-in screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Chukta' })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue as guest/i })).toBeVisible();
    // Not yet inside the app.
    await expect(page.getByRole('heading', { name: /hello/i })).toHaveCount(0);
  });

  test('A2 — continue as guest lands on Home with a generic greeting', async ({ page }) => {
    await enterAsGuest(page);
    await expect(page.getByRole('heading', { name: /^hello/i })).toBeVisible();
  });

  test('A3 — guest choice persists across a reload', async ({ page }) => {
    await enterAsGuest(page);
    await page.reload();
    // Straight back into the app, not the gate.
    await expect(page.getByRole('heading', { name: /hello/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue as guest/i })).toHaveCount(0);
  });

  test('A4 — a guest can return to the sign-in screen from Home', async ({ page }) => {
    await enterAsGuest(page);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByRole('button', { name: /continue as guest/i })).toBeVisible();
  });

  test('A6 — each device sees only its own data', async ({ browser }) => {
    // Device 1 loads demo data.
    const ctx1 = await browser.newContext();
    const p1 = await ctx1.newPage();
    await enterAsGuest(p1);
    await loadDemoData(p1);
    await expect(p1.getByRole('button', { name: /DL3CAB1234/ })).toBeVisible();

    // Device 2 (separate context => separate device id) starts empty.
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await enterAsGuest(p2);
    await expect(p2.getByText('No vehicles yet')).toBeVisible();
    await expect(p2.getByText('DL3CAB1234')).toHaveCount(0);

    await ctx1.close();
    await ctx2.close();
  });
});

test.describe('Theme', () => {
  test('T1 — dark mode is the default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('T2 — toggling to light persists across a reload', async ({ page }) => {
    await enterAsGuest(page);
    await page.getByRole('button', { name: /switch to light mode/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('T3 — Appearance selector on Profile sets the theme', async ({ page }) => {
    await enterAsGuest(page);
    // Guests reach Profile via the sign-in icon? No — Profile is for signed-in;
    // guests open it directly.
    await page.goto('/profile');
    await page.getByRole('button', { name: /^light$/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: /^dark$/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
