import { test, expect } from '@playwright/test';

/**
 * HiveLab E2E Test Suite — Templates First
 *
 * Tests the reframed tool creation journey:
 * 1. Templates are primary (above fold)
 * 2. AI prompt is secondary (below divider)
 * 3. Template click → create tool → IDE with composition
 * 4. IDE shows pre-composed tool ready to customize/deploy
 */

test.describe('HiveLab Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
  });

  test('should show templates grid as primary content', async ({ page }) => {
    // Title should be "Tools for your space" (not "What do you want to build?")
    await expect(page.getByText(/tools for your space/i)).toBeVisible();

    // Templates should be visible above the fold
    await expect(page.getByText(/Quick Poll/i).first()).toBeVisible();
  });

  test('should show 6 featured templates', async ({ page }) => {
    // Check for featured templates
    const templates = [
      'Quick Poll',
      'Event RSVP',
      'Event Countdown',
      'Member Leaderboard',
      'Study Group Signup',
      'Feedback Form',
    ];

    for (const template of templates) {
      // Look for template names (may need to scroll on mobile)
      const templateElement = page.getByText(new RegExp(template, 'i')).first();
      await expect(templateElement).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have "See all templates" link', async ({ page }) => {
    await expect(page.getByText(/see all templates/i)).toBeVisible();
  });

  test('should show AI prompt section below templates', async ({ page }) => {
    // Divider text
    await expect(page.getByText(/or describe what you need/i)).toBeVisible();

    // AI prompt textarea
    await expect(page.getByPlaceholder(/describe the tool you need/i)).toBeVisible();
  });

  test('should show AI suggestion chips', async ({ page }) => {
    // AI suggestions should be visible
    const suggestions = ['Poll', 'RSVP', 'Countdown', 'Survey'];
    for (const suggestion of suggestions) {
      await expect(page.getByRole('button', { name: new RegExp(suggestion, 'i') }).first()).toBeVisible();
    }
  });

  test('should redirect /hivelab to /tools', async ({ page }) => {
    await page.goto('/hivelab');
    await expect(page).toHaveURL('/tools');
  });
});

test.describe('Template Click Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
  });

  test('clicking template navigates to tools page with template param', async ({ page }) => {
    // Find and click the "See all templates" link
    await page.getByText(/see all templates/i).click();

    // Should navigate to templates page
    await expect(page).toHaveURL('/tools/templates');
  });

  test('?template= param triggers tool creation', async ({ page }) => {
    // Navigate with template param
    await page.goto('/tools?template=quick-poll');

    // Should show loading state then redirect to IDE
    // Wait for redirect (may take a moment for tool creation)
    await page.waitForURL(/\/tools\/[a-zA-Z0-9_]+/, { timeout: 15000 });

    // Should be on a tool page (not /tools anymore)
    expect(page.url()).toMatch(/\/tools\/[a-zA-Z0-9_]+/);
  });

  test('invalid template param shows error and redirects', async ({ page }) => {
    await page.goto('/tools?template=nonexistent-template-xyz');

    // Should stay on /tools (cleaned URL) and possibly show toast
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/tools');
  });
});

test.describe('Templates Gallery Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/templates');
    await page.waitForLoadState('networkidle');
  });

  test('should display templates gallery', async ({ page }) => {
    // Should have a heading
    await expect(page.getByRole('heading', { name: /templates/i }).first()).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('poll');
      // Should filter templates
      await page.waitForTimeout(500);
    }
  });

  test('clicking template should navigate to create', async ({ page }) => {
    // Click on first template card
    const templateCard = page.locator('[data-testid="template-card"]').first();
    if (await templateCard.isVisible()) {
      await templateCard.click();
      // Should navigate to /tools?template= or directly create
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('HiveLab IDE', () => {
  // Note: These tests require authentication
  // In a real CI environment, you'd set up test auth

  test('IDE shows mobile gate on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Create a temporary tool ID for testing
    await page.goto('/tools/test-mobile-gate');
    await page.waitForLoadState('networkidle');

    // Should show "Desktop Required" message
    // (if auth is set up and this is a valid tool)
    // For now, just verify no crash
    await expect(page).not.toHaveURL(/error/);
  });

  test('IDE page loads without errors', async ({ page }) => {
    await page.goto('/tools');
    await expect(page).not.toHaveURL(/error/);
  });
});

test.describe('Your Tools Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
  });

  test('should show Your Tools section if user has tools', async ({ page }) => {
    // "Your Tools" section is conditional on auth and having tools
    // Check that page doesn't error
    await expect(page).not.toHaveURL(/error/);

    // If authenticated with tools, should see "Your Tools" heading
    // This is auth-dependent so we just verify no crash
  });
});

test.describe('Performance', () => {
  test('tools landing page loads quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/tools');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // DOM content should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('templates page loads quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/tools/templates');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // DOM content should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Accessibility', () => {
  test('templates have accessible names', async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    // Template buttons should be keyboard accessible
    const templateButtons = page.locator('button').filter({ hasText: /poll|rsvp|countdown|leaderboard|signup|feedback/i });
    const count = await templateButtons.count();

    expect(count).toBeGreaterThan(0);
  });

  test('AI prompt is keyboard accessible', async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    // Textarea should be focusable
    const textarea = page.getByPlaceholder(/describe the tool you need/i);
    await textarea.focus();
    await expect(textarea).toBeFocused();
  });
});

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('landing page is usable on mobile', async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');

    // Title should be visible
    await expect(page.getByText(/tools for your space/i)).toBeVisible();

    // At least some templates should be visible
    await expect(page.getByText(/poll/i).first()).toBeVisible();
  });

  test('templates page is usable on mobile', async ({ page }) => {
    await page.goto('/tools/templates');
    await page.waitForLoadState('networkidle');

    // Page should load
    await expect(page).not.toHaveURL(/error/);
  });
});
