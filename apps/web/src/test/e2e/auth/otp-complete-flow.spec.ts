/**
 * Complete OTP Authentication Flow E2E Tests
 *
 * Tests the full authentication flow from login page to authenticated session.
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_TIMEOUTS, logout } from '../config/test-fixtures';
import { getProfile, checkHealth } from '../config/api-helpers';

test.describe('OTP Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start logged out
    await page.goto('/auth/login');
  });

  test('should display login page with email input', async ({ page }) => {
    // Verify login page elements
    await expect(page.getByRole('button', { name: /Test University/i })).toBeVisible();

    // Click to expand email input
    await page.getByRole('button', { name: /Test University/i }).click();

    // Email input should be visible
    await expect(page.getByTestId('email-input')).toBeVisible();
  });

  test('should validate email format before submission', async ({ page }) => {
    await page.getByRole('button', { name: /Test University/i }).click();
    const emailInput = page.getByTestId('email-input');

    // Try invalid email
    await emailInput.fill('invalid-email');
    await page.keyboard.press('Enter');

    // Should show validation error or prevent submission
    // (check for error message or that we're still on login page)
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should reject non-buffalo.edu email addresses', async ({ page }) => {
    await page.getByRole('button', { name: /Test University/i }).click();
    const emailInput = page.getByTestId('email-input');

    // Try non-buffalo email
    await emailInput.fill('user@gmail.com');
    await page.keyboard.press('Enter');

    // Should show error or stay on page
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should complete login via dev magic link and redirect', async ({ page }) => {
    // Login flow
    await page.getByRole('button', { name: /Test University/i }).click();
    await page.getByTestId('email-input').fill(TEST_USERS.admin.email);
    await page.keyboard.press('Enter');

    // Click dev magic link button
    await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();

    // Should redirect to authenticated area
    await page.waitForURL(/(profile|onboarding|start|feed|spaces)/, {
      timeout: TEST_TIMEOUTS.navigation,
    });

    // Verify we're logged in by checking API access
    const profileResponse = await getProfile(page);
    expect(profileResponse.ok).toBe(true);
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login
    await page.getByRole('button', { name: /Test University/i }).click();
    await page.getByTestId('email-input').fill(TEST_USERS.admin.email);
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();
    await page.waitForURL(/(profile|onboarding|start|feed|spaces)/);

    // Get initial profile
    const initialProfile = await getProfile(page);
    expect(initialProfile.ok).toBe(true);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Session should still be valid
    const afterRefresh = await getProfile(page);
    expect(afterRefresh.ok).toBe(true);
  });

  test('should successfully logout and deny protected access', async ({ page }) => {
    // Login first
    await page.getByRole('button', { name: /Test University/i }).click();
    await page.getByTestId('email-input').fill(TEST_USERS.admin.email);
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();
    await page.waitForURL(/(profile|onboarding|start|feed|spaces)/);

    // Verify logged in
    const beforeLogout = await getProfile(page);
    expect(beforeLogout.ok).toBe(true);

    // Logout
    await logout(page);

    // Wait a moment for logout to complete
    await page.waitForTimeout(500);

    // Protected API should now be denied
    const afterLogout = await getProfile(page);
    expect(afterLogout.status).toBeGreaterThanOrEqual(400);
  });

  test('should get CSRF token for authenticated mutations', async ({ page }) => {
    // Login
    await page.getByRole('button', { name: /Test University/i }).click();
    await page.getByTestId('email-input').fill(TEST_USERS.admin.email);
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();
    await page.waitForURL(/(profile|onboarding|start|feed|spaces)/);

    // Get CSRF token
    const csrfToken = await page.evaluate(async () => {
      const res = await fetch('/api/auth/csrf', { credentials: 'include' });
      return res.headers.get('X-CSRF-Token');
    });

    expect(csrfToken).toBeTruthy();
    expect(typeof csrfToken).toBe('string');
    expect(csrfToken!.length).toBeGreaterThan(10);
  });

  test('should handle concurrent sessions correctly', async ({ browser }) => {
    // Create two browser contexts (simulating two tabs/devices)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Login in both contexts
      for (const page of [page1, page2]) {
        await page.goto('/auth/login');
        await page.getByRole('button', { name: /Test University/i }).click();
        await page.getByTestId('email-input').fill(TEST_USERS.admin.email);
        await page.keyboard.press('Enter');
        await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();
        await page.waitForURL(/(profile|onboarding|start|feed|spaces)/);
      }

      // Both should have valid sessions
      const profile1 = await getProfile(page1);
      const profile2 = await getProfile(page2);

      expect(profile1.ok).toBe(true);
      expect(profile2.ok).toBe(true);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Role-Based Access Control', () => {
  test('admin user should access admin endpoints', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /Test University/i }).click();
    await page.getByTestId('email-input').fill(TEST_USERS.admin.email);
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();
    await page.waitForURL(/(profile|onboarding|start|feed|spaces)/);

    // Admin endpoint should be accessible
    const adminStatus = await page.evaluate(async () => {
      const res = await fetch('/api/admin/moderation/stats', { credentials: 'include' });
      return res.status;
    });

    expect(adminStatus).toBeLessThan(400);
  });

  test('non-admin user should be denied admin access', async ({ page }) => {
    // Login as regular student
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /Test University/i }).click();
    await page.getByTestId('email-input').fill(TEST_USERS.student.email);
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();
    await page.waitForURL(/(profile|onboarding|start|feed|spaces)/);

    // Admin endpoint should be forbidden
    const adminStatus = await page.evaluate(async () => {
      const res = await fetch('/api/admin/moderation/stats', { credentials: 'include' });
      return res.status;
    });

    expect(adminStatus).toBe(403);
  });
});

test.describe('Health Check Integration', () => {
  test('health endpoint should be accessible and return status', async ({ page }) => {
    const health = await checkHealth(page, true);

    expect(health.ok).toBe(true);
    expect(health.data.status).toBeDefined();
    expect(health.data.checks).toBeDefined();
  });

  test('health check should include Redis status', async ({ page }) => {
    const health = await checkHealth(page, true);

    expect(health.ok).toBe(true);
    expect(health.data.checks.redis).toBeDefined();
    expect(health.data.checks.redis.status).toBeDefined();
  });
});
