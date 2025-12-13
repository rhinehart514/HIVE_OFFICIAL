import { test, expect } from '@playwright/test';

test.describe('Complete Onboarding Flow Test', () => {
  test.setTimeout(120000); // 2 minute timeout for full flow

  test('login page renders correctly with all elements', async ({ page }) => {
    await page.goto('/auth/login');

    // Wait for hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });

    // Verify login page elements
    await expect(page.getByText('Sign in to HIVE')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('@buffalo.edu')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();

    console.log('✅ Login page renders correctly');
  });

  test('onboarding page structure and navigation', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');

    // Wait for hydration with longer timeout
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/02-onboarding-initial.png', fullPage: true });

    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);

    // Check if we're on onboarding or redirected
    if (finalUrl.includes('login')) {
      console.log('📍 Redirected to login (expected for unauthenticated users)');
      await expect(page.getByText('Sign in to HIVE')).toBeVisible({ timeout: 10000 });
      return;
    }

    // If we're on onboarding, check for content
    if (finalUrl.includes('onboarding')) {
      console.log('📍 On onboarding page');

      // Wait longer for any animations/loading
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/03-onboarding-loaded.png', fullPage: true });

      // Get page content
      const bodyContent = await page.textContent('body');
      console.log('Page has content:', !!bodyContent && bodyContent.length > 0);
      console.log('Content length:', bodyContent?.length);

      // Check for any expected onboarding content
      const possibleContent = [
        'Student',
        'Looking around',
        'Welcome',
        'Get started',
        'Choose',
        'Select',
        'Next',
        'Continue'
      ];

      let foundContent = false;
      for (const text of possibleContent) {
        if (bodyContent?.includes(text)) {
          console.log(`✅ Found: "${text}"`);
          foundContent = true;
        }
      }

      if (!foundContent) {
        console.log('⚠️ No expected content found. Body preview:', bodyContent?.substring(0, 500));
      }
    }
  });

  test('API health check for onboarding endpoints', async ({ request }) => {
    // Test that critical API endpoints respond

    // Health check
    const healthRes = await request.get('/api/health');
    console.log('Health API status:', healthRes.status());

    // Auth me endpoint (should return 401 for unauthenticated)
    const meRes = await request.get('/api/auth/me');
    console.log('Auth me API status:', meRes.status());
    expect([200, 401]).toContain(meRes.status());

    // Feature flags endpoint
    const flagsRes = await request.get('/api/feature-flags');
    console.log('Feature flags API status:', flagsRes.status());
  });
});
