import { test, expect } from '@playwright/test';

test.describe('Entry CTA routing', () => {
  test('primary CTA routes to entry with claim redirect', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    const cta = page.getByTestId('cta-primary');
    await expect(cta).toBeVisible();
    // Click and assert navigation to /enter with claim fallback redirect
    await cta.click();
    await expect(page).toHaveURL(
      /\/enter\?schoolId=ub-buffalo&domain=buffalo\.edu&redirect=%2Fspaces%3Fclaim%3Dtrue$/,
      { timeout: 120000 }
    );
  });
});
