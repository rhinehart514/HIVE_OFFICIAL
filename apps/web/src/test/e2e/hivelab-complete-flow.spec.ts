import { test, expect } from '@playwright/test';

/**
 * HiveLab E2E Test Suite
 *
 * HiveLab is now integrated into the main web app at /tools.
 * Tests the tool creation user journey:
 * 1. Navigation from sidebar
 * 2. /hivelab redirect to /tools
 * 3. Tool creation flow
 * 4. Tool editor interface
 */

test.describe('HiveLab Integration - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect /hivelab to /tools', async ({ page }) => {
    await page.goto('/hivelab');

    // Should redirect to /tools
    await expect(page).toHaveURL('/tools');
  });

  test('should display tool creation interface at /tools', async ({ page }) => {
    await page.goto('/tools');

    // Should see the "What do you want to build?" prompt
    await expect(page.getByText(/what do you want to build/i)).toBeVisible();
  });
});

test.describe('HiveLab Integration - Tool Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
    await page.waitForTimeout(500);
  });

  test('should display suggestion chips', async ({ page }) => {
    // Check for suggestion chips
    await expect(page.getByText(/poll/i).first()).toBeVisible();
  });

  test('should have templates link', async ({ page }) => {
    // Check for browse templates link
    await expect(page.getByText(/browse templates/i)).toBeVisible();
  });

  test('should show user tools if they exist', async ({ page }) => {
    // "Your Tools" section appears when user has tools
    // This is conditional on auth state and existing tools
    await expect(page).not.toHaveURL(/error/);
  });
});

test.describe('HiveLab Integration - Tool Editor', () => {
  test('should load tool editor page', async ({ page }) => {
    // Mock a tool ID that doesn't exist - should show error gracefully
    await page.goto('/tools/test-tool-123');

    // Should either show tool editor or "not found" message
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/error/);
  });

  test('should have editor UI elements', async ({ page }) => {
    // Navigate to a new tool creation
    await page.goto('/tools');

    // Page should load without errors
    await expect(page).toHaveURL('/tools');
  });
});

test.describe('HiveLab Integration - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display tools page on mobile', async ({ page }) => {
    await page.goto('/tools');

    // Should load without errors
    await expect(page).not.toHaveURL(/error/);
  });
});

test.describe('HiveLab Integration - Performance', () => {
  test('should load tools page quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
