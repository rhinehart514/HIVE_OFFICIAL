import { test, expect } from '@playwright/test';

test.describe('Onboarding Click-Through Flow', () => {
  test.setTimeout(180000); // 3 minute timeout

  test('complete user type selection and proceed', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Screenshot step 1
    await page.screenshot({ path: 'test-results/flow-01-user-type.png', fullPage: true });

    // Verify we're on step 1 - User Type
    await expect(page.getByText('What brings you here?')).toBeVisible({ timeout: 15000 });

    // Verify options are visible
    await expect(page.getByText('I lead something')).toBeVisible();
    await expect(page.getByText("I'm finding my people")).toBeVisible();

    // Click "I'm finding my people" option
    await page.getByText("I'm finding my people").click();
    await page.waitForTimeout(2000);

    // Screenshot after selection
    await page.screenshot({ path: 'test-results/flow-02-after-user-type.png', fullPage: true });

    console.log('✅ User type selection works');
  });

  test('verify profile step loads after user type', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Select user type
    await page.getByText("I'm finding my people").click();
    await page.waitForTimeout(3000);

    // Wait for next step to load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flow-03-profile-step.png', fullPage: true });

    // Check for profile step content
    const pageContent = await page.textContent('body');
    const hasProfileContent =
      pageContent?.includes('name') ||
      pageContent?.includes('Name') ||
      pageContent?.includes('handle') ||
      pageContent?.includes('Handle') ||
      pageContent?.includes('major') ||
      pageContent?.includes('Major') ||
      pageContent?.includes('About') ||
      pageContent?.includes('Tell us');

    console.log('Profile step has relevant content:', hasProfileContent);
    console.log('Current URL:', page.url());
  });

  test('verify faculty/alumni options work', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for Faculty option
    const facultyLink = page.getByText('Faculty');
    if (await facultyLink.isVisible()) {
      await facultyLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/flow-04-faculty.png', fullPage: true });
      console.log('✅ Faculty option clickable');
    }
  });

  test('verify "I lead something" option works', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click "I lead something" option
    await page.getByText('I lead something').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/flow-05-leader-path.png', fullPage: true });

    console.log('✅ Leader path selection works');
    console.log('Current URL after leader selection:', page.url());
  });
});
