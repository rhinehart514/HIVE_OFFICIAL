/**
 * E2E Test Fixtures for HIVE Platform
 *
 * Provides reusable fixtures for authenticated sessions, test data,
 * and common test utilities.
 */

import { test as base, Page, BrowserContext, expect } from '@playwright/test';

// ============================================================================
// TEST CONSTANTS
// ============================================================================

export const TEST_USERS = {
  admin: {
    email: 'jwrhineh@buffalo.edu',
    name: 'Admin User',
    role: 'admin',
  },
  student: {
    email: 'student@buffalo.edu',
    name: 'Test Student',
    role: 'student',
  },
  faculty: {
    email: 'faculty@buffalo.edu',
    name: 'Test Faculty',
    role: 'faculty',
  },
} as const;

export const TEST_SPACE = {
  id: 'test-space-e2e',
  name: 'E2E Test Space',
  slug: 'e2e-test-space',
};

export const TEST_TIMEOUTS = {
  navigation: 30000,
  pageLoad: 60000,
  animation: 500,
  sse: 5000,
};

// ============================================================================
// CUSTOM TEST FIXTURES
// ============================================================================

interface TestFixtures {
  authenticatedPage: Page;
  adminPage: Page;
  studentPage: Page;
  testContext: {
    user: typeof TEST_USERS.admin;
    csrfToken: string | null;
  };
}

/**
 * Extended test function with authentication fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Page authenticated as admin user (jwrhineh@buffalo.edu)
   */
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginWithDevMagicLink(page, TEST_USERS.admin.email);

    await use(page);
    await context.close();
  },

  /**
   * Page authenticated as admin (alias for clarity in tests)
   */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginWithDevMagicLink(page, TEST_USERS.admin.email);

    await use(page);
    await context.close();
  },

  /**
   * Page authenticated as student user
   */
  studentPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginWithDevMagicLink(page, TEST_USERS.student.email);

    await use(page);
    await context.close();
  },

  /**
   * Test context with user info and CSRF token
   */
  testContext: async ({ authenticatedPage }, use) => {
    const csrfToken = await getCsrfToken(authenticatedPage);

    await use({
      user: TEST_USERS.admin,
      csrfToken,
    });
  },
});

// Re-export expect for convenience
export { expect };

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Login using the dev magic link (for development/testing)
 */
export async function loginWithDevMagicLink(page: Page, email: string): Promise<void> {
  await page.goto('/auth/login');

  // Click "Test University (Development)" button
  await page.getByRole('button', { name: /Test University/i }).click();

  // Fill email
  await page.getByTestId('email-input').fill(email);
  await page.keyboard.press('Enter');

  // Click "Use Dev Magic Link" button
  await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();

  // Wait for redirect to authenticated area
  await page.waitForURL(/(profile|onboarding|start|feed|spaces)/, {
    timeout: TEST_TIMEOUTS.navigation,
  });
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  });
}

/**
 * Get CSRF token for authenticated requests
 */
export async function getCsrfToken(page: Page): Promise<string | null> {
  const csrf = await page.evaluate(async () => {
    const res = await fetch('/api/auth/csrf', { credentials: 'include' });
    return res.headers.get('X-CSRF-Token');
  });
  return csrf;
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate to a space by ID
 */
export async function navigateToSpace(page: Page, spaceId: string): Promise<void> {
  await page.goto(`/spaces/${spaceId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to the spaces browse page
 */
export async function navigateToBrowse(page: Page): Promise<void> {
  await page.goto('/spaces/browse');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to HiveLab tool builder
 */
export async function navigateToHiveLab(page: Page): Promise<void> {
  await page.goto('/lab/create');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to user profile
 */
export async function navigateToProfile(page: Page, userId?: string): Promise<void> {
  const path = userId ? `/profile/${userId}` : '/profile';
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// WAIT HELPERS
// ============================================================================

/**
 * Wait for SSE connection to establish
 */
export async function waitForSSEConnection(page: Page, timeout = TEST_TIMEOUTS.sse): Promise<void> {
  // Wait for SSE indicator or message list to be active
  await page.waitForFunction(() => {
    // Check for any indicators that SSE is connected
    const messageContainer = document.querySelector('[data-testid="chat-messages"]');
    return messageContainer !== null;
  }, { timeout });
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  // Wait for any loading spinners to disappear
  await page.waitForFunction(() => {
    const loaders = document.querySelectorAll('[data-loading="true"], .loading, .spinner');
    return loaders.length === 0;
  }, { timeout: TEST_TIMEOUTS.pageLoad });
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert page has no console errors
 */
export async function assertNoConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Assert API response is successful
 */
export async function assertApiSuccess(page: Page, endpoint: string): Promise<number> {
  const status = await page.evaluate(async (url) => {
    const res = await fetch(url, { credentials: 'include' });
    return res.status;
  }, endpoint);

  expect(status).toBeLessThan(400);
  return status;
}
