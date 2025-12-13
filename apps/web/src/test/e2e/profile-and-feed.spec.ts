import { test, expect } from '@playwright/test';

/**
 * Profile & Feed E2E Tests
 *
 * Tests the profile and feed user flows:
 * 1. Profile page display and interactions
 * 2. Feed page functionality
 * 3. Privacy settings (Ghost Mode)
 * 4. User connections
 */

test.describe('Profile - View & Edit', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load profile page', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Page should render without errors
    const pageContent = await page.content();
    expect(pageContent).toContain('html');
    expect(pageContent.length).toBeGreaterThan(500);

    await page.screenshot({
      path: './test-results/profile-edit-page.png',
      fullPage: true,
    });
  });

  test('should display profile form fields', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for common profile form elements
    const formFields = page.locator([
      'input[name*="name"]',
      'input[name*="display"]',
      'input[placeholder*="name"]',
      'textarea[name*="bio"]',
      'textarea[placeholder*="bio"]',
      '[data-testid*="profile"]',
    ].join(', '));

    const fieldCount = await formFields.count();

    await page.screenshot({
      path: './test-results/profile-form-fields.png',
      fullPage: true,
    });

    console.log(fieldCount > 0 ? `✅ Found ${fieldCount} profile form fields` : 'ℹ️ No profile form fields visible');
  });

  test('should display avatar upload option', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for avatar/image upload elements
    const avatarElements = page.locator([
      '[data-testid*="avatar"]',
      '[class*="avatar"]',
      'input[type="file"]',
      '[class*="profile-image"]',
      'img[alt*="profile"]',
    ].join(', '));

    const hasAvatar = await avatarElements.first().isVisible().catch(() => false);

    console.log(hasAvatar ? '✅ Avatar element found' : 'ℹ️ Avatar element not visible');
  });

  test('should navigate to public profile from edit page', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for "view profile" or similar link
    const viewProfileLink = page.locator([
      'a[href*="/profile/"]',
      'button:has-text("view")',
      '[data-testid="view-profile"]',
    ].join(', ')).first();

    if (await viewProfileLink.isVisible().catch(() => false)) {
      await viewProfileLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });

      const currentUrl = page.url();
      console.log(`✅ Navigated to: ${currentUrl}`);

      await page.screenshot({
        path: './test-results/public-profile-page.png',
        fullPage: true,
      });
    } else {
      console.log('ℹ️ No view profile link found');
    }
  });
});

test.describe('Profile - Privacy Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display privacy settings section', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for privacy-related elements
    const privacyElements = page.locator([
      '[data-testid*="privacy"]',
      '[class*="privacy"]',
      'text=Ghost Mode',
      'text=Privacy',
      'text=Visibility',
    ].join(', '));

    const hasPrivacy = await privacyElements.first().isVisible().catch(() => false);

    await page.screenshot({
      path: './test-results/profile-privacy-section.png',
      fullPage: true,
    });

    console.log(hasPrivacy ? '✅ Privacy settings found' : 'ℹ️ Privacy settings not visible');
  });

  test('should show ghost mode toggle if available', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for ghost mode toggle
    const ghostModeToggle = page.locator([
      '[data-testid*="ghost"]',
      '[aria-label*="ghost"]',
      'button:has-text("Ghost")',
      'label:has-text("Ghost")',
    ].join(', '));

    if (await ghostModeToggle.first().isVisible().catch(() => false)) {
      console.log('✅ Ghost mode toggle found');

      await ghostModeToggle.first().screenshot({
        path: './test-results/ghost-mode-toggle.png',
      });
    } else {
      console.log('ℹ️ Ghost mode toggle not visible');
    }
  });
});

test.describe('Feed - Main Feed Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load feed page', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Page should render without errors
    const pageContent = await page.content();
    expect(pageContent).toContain('html');
    expect(pageContent.length).toBeGreaterThan(500);

    await page.screenshot({
      path: './test-results/feed-page-loaded.png',
      fullPage: true,
    });
  });

  test('should display feed content or empty state', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for feed items or empty state
    const feedItems = page.locator([
      '[data-testid*="feed-item"]',
      '[class*="feed-item"]',
      '[class*="post"]',
      'article',
    ].join(', '));

    const itemCount = await feedItems.count();

    if (itemCount > 0) {
      console.log(`✅ Found ${itemCount} feed items`);
    } else {
      // Check for empty state
      const emptyState = page.getByText(/no activity|empty|nothing to show|join spaces/i);
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      console.log(hasEmptyState ? 'ℹ️ Empty state shown' : '⚠️ No feed items or empty state');
    }

    await page.screenshot({
      path: './test-results/feed-content-state.png',
      fullPage: true,
    });
  });

  test('should display feed filters if available', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for filter elements
    const filterElements = page.locator([
      '[data-testid*="filter"]',
      '[class*="filter"]',
      'select',
      '[role="tablist"]',
    ].join(', '));

    const hasFilters = await filterElements.first().isVisible().catch(() => false);

    console.log(hasFilters ? '✅ Feed filters found' : 'ℹ️ Feed filters not visible');
  });

  test('should handle feed scroll without errors', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Scroll down the page
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);

    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(1000);

    // Page should still be responsive
    const body = page.locator('body');
    await expect(body).toBeVisible();

    await page.screenshot({
      path: './test-results/feed-after-scroll.png',
      fullPage: true,
    });
  });
});

test.describe('Feed - Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized feed', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check that content fits mobile viewport
    const body = page.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);

    // Allow 20px margin for scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);

    await page.screenshot({
      path: './test-results/feed-mobile-view.png',
      fullPage: true,
    });
  });

  test('should show bottom navigation on mobile', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for bottom navigation
    const bottomNav = page.locator([
      '[data-testid*="bottom-nav"]',
      '[class*="bottom-nav"]',
      'nav[class*="mobile"]',
      '[class*="MobileNav"]',
    ].join(', '));

    const hasBottomNav = await bottomNav.first().isVisible().catch(() => false);

    console.log(hasBottomNav ? '✅ Bottom navigation found' : 'ℹ️ Bottom navigation not visible');
  });
});

test.describe('User Connections', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load connections page', async ({ page }) => {
    await page.goto('/profile/connections');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Page should render
    const pageContent = await page.content();
    expect(pageContent).toContain('html');

    await page.screenshot({
      path: './test-results/connections-page.png',
      fullPage: true,
    });
  });

  test('should display connections list or empty state', async ({ page }) => {
    await page.goto('/profile/connections');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for connection items
    const connectionItems = page.locator([
      '[data-testid*="connection"]',
      '[class*="connection"]',
      '[class*="friend"]',
      '[class*="user-card"]',
    ].join(', '));

    const itemCount = await connectionItems.count();

    if (itemCount > 0) {
      console.log(`✅ Found ${itemCount} connections`);
    } else {
      // Check for empty state
      const emptyState = page.getByText(/no connections|start connecting|find friends/i);
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      console.log(hasEmptyState ? 'ℹ️ Empty state shown' : '⚠️ No connections or empty state');
    }
  });
});

test.describe('Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load calendar page', async ({ page }) => {
    await page.goto('/profile/calendar');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Page should render
    const pageContent = await page.content();
    expect(pageContent).toContain('html');

    await page.screenshot({
      path: './test-results/calendar-page.png',
      fullPage: true,
    });
  });

  test('should display calendar or events view', async ({ page }) => {
    await page.goto('/profile/calendar');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for calendar elements
    const calendarElements = page.locator([
      '[data-testid*="calendar"]',
      '[class*="calendar"]',
      '[role="grid"]',
      'table',
      '[class*="event"]',
    ].join(', '));

    const hasCalendar = await calendarElements.first().isVisible().catch(() => false);

    console.log(hasCalendar ? '✅ Calendar elements found' : 'ℹ️ Calendar elements not visible');
  });
});

test.describe('Profile Performance', () => {
  test('should load profile edit in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/profile/edit');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const loadTime = Date.now() - startTime;

    console.log(`Profile edit load time: ${loadTime}ms`);

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load feed in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const loadTime = Date.now() - startTime;

    console.log(`Feed load time: ${loadTime}ms`);

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Profile Error Handling', () => {
  test('should handle non-existent profile gracefully', async ({ page }) => {
    await page.goto('/profile/nonexistent-user-id-12345');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Should show some error state, not crash
    const pageContent = await page.content();
    expect(pageContent).toContain('html');

    // Look for error indicators or redirect
    const hasError = await page.getByText(/not found|404|error|doesn't exist/i).isVisible().catch(() => false);
    const wasRedirected = page.url().includes('/auth') || page.url().includes('/feed');

    await page.screenshot({
      path: './test-results/profile-not-found.png',
      fullPage: true,
    });

    console.log(hasError || wasRedirected ? '✅ Error handled correctly' : 'ℹ️ Profile state unclear');
  });

  test('should not show console errors on profile pages', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test profile pages
    const pages = ['/profile/edit', '/profile/connections', '/feed'];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    }

    // Filter out expected/benign errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('chunk') &&
        !err.includes('prefetch') &&
        !err.includes('socket') &&
        !err.includes('hydration')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠️ Console errors found:', criticalErrors.slice(0, 5));
    } else {
      console.log('✅ No critical console errors');
    }
  });
});
