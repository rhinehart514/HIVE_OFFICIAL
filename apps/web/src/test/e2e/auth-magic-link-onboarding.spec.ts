import { test, expect } from '@playwright/test';

test.describe('Authentication + Onboarding Flow', () => {
  test('login page displays correctly', async ({ page }) => {
    await page.goto('/auth/login');

    // Verify login page elements
    await expect(page.getByText('Sign in to HIVE')).toBeVisible();
    await expect(page.getByText('Use your')).toBeVisible();
    await expect(page.getByText('@buffalo.edu')).toBeVisible();

    // Email input should be present
    const emailInput = page.locator('input[type="text"], input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    // Continue button should be present
    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
  });

  test('onboarding page loads or redirects to login', async ({ page }) => {
    // Go directly to onboarding (simulating a new user redirect)
    // Use waitUntil: 'domcontentloaded' to avoid issues with slow loads
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for navigation to settle (may redirect to login)
    await page.waitForTimeout(2000);

    // Get final URL after any redirects
    const finalUrl = page.url();

    // Either we're on onboarding or redirected to login - both are valid
    const isOnOnboarding = finalUrl.includes('onboarding');
    const isOnLogin = finalUrl.includes('login');

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/onboarding-or-login.png' });

    expect(isOnOnboarding || isOnLogin).toBeTruthy();

    if (isOnLogin) {
      // Verify login page loads correctly
      await expect(page.getByText('Sign in to HIVE')).toBeVisible({ timeout: 10000 });
    }
  });

  test('complete onboarding flow - verify page renders', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for navigation to settle
    await page.waitForTimeout(3000);

    // Take screenshot to verify state
    await page.screenshot({ path: 'test-results/onboarding-flow.png' });

    const finalUrl = page.url();

    // If redirected to login, that's expected for unauthenticated users
    if (finalUrl.includes('login')) {
      console.log('Redirected to login - authentication required for onboarding');
      await expect(page.getByText('Sign in to HIVE')).toBeVisible({ timeout: 10000 });
      return;
    }

    // If on onboarding page, verify it rendered
    expect(finalUrl).toContain('onboarding');
  });
});

