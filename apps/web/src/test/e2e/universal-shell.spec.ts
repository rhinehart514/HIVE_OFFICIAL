import { test, expect } from '@playwright/test';

test.describe('Phase 1 Route + Shell Gates', () => {
  test('landing is public and exposes primary entry CTAs', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /your club is already here/i })
    ).toBeVisible();
    await expect(page.getByTestId('cta-primary')).toBeVisible();
    await expect(page.getByRole('link', { name: /browse campus spaces/i })).toBeVisible();

    // Logged-out landing should not render authenticated shell controls.
    await expect(page.getByLabel('Open navigation')).toHaveCount(0);
    await expect(page.getByLabel('Open create menu')).toHaveCount(0);
  });

  test('legacy /home permanently redirects to /discover', async ({ page }) => {
    const response = await page.request.get('/home', { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe('/discover');
  });

  test('legacy /feed permanently redirects to /discover', async ({ page }) => {
    const response = await page.request.get('/feed', { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe('/discover');
  });

  test('legacy /explore preserves query params when redirecting', async ({ page }) => {
    const response = await page.request.get('/explore?tab=events&q=test', {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe('/discover?tab=events&q=test');
  });

  test('discover is auth-gated and bounces unauthenticated users to landing', async ({ page }) => {
    await page.goto('/discover');

    await expect(page).toHaveURL(/\/\?redirect=%2Fdiscover$/);
    await expect(page.getByTestId('cta-primary')).toBeVisible();
  });

  test('entry flow remains publicly accessible', async ({ page }) => {
    await page.goto('/enter');

    await expect(page).toHaveURL(/\/enter/);
    await expect(page.getByRole('heading', { name: /what's your email\?/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /you@buffalo\.edu/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });
});
