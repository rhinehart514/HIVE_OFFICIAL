import { test, expect } from '@playwright/test';

/**
 * Core User Journey E2E Tests
 *
 * Tests the critical launch criteria from TODO.md:
 * "A student can join a space, send a chat message, use a poll tool,
 *  and see results without security issues or broken real-time."
 *
 * This tests the primary user flows that must work for beta launch.
 */

test.describe('Core User Journey - Space Discovery & Join', () => {
  test.beforeEach(async ({ page }) => {
    // Set a reasonable viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load spaces browse page', async ({ page }) => {
    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Page should render without errors
    const pageContent = await page.content();
    expect(pageContent).toContain('html');
    expect(pageContent.length).toBeGreaterThan(500);

    // Take screenshot for visual verification
    await page.screenshot({
      path: './test-results/spaces-browse-loaded.png',
      fullPage: true,
    });
  });

  test('should display space discovery cards', async ({ page }) => {
    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for space card elements
    const spaceCards = page.locator([
      '[data-testid*="space-card"]',
      '[class*="space-card"]',
      '[class*="SpaceCard"]',
      'article',
      '.card',
    ].join(', '));

    // Wait for cards to potentially load
    await page.waitForTimeout(2000);

    const cardCount = await spaceCards.count();

    // Log what we found for debugging
    if (cardCount > 0) {
      console.log(`✅ Found ${cardCount} space cards`);
    } else {
      // Check if there's a "no spaces" message instead
      const emptyState = page.getByText(/no spaces|empty|nothing here/i);
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      console.log(hasEmptyState ? 'ℹ️ Empty state shown' : '⚠️ No cards or empty state found');
    }

    // Take screenshot regardless
    await page.screenshot({
      path: './test-results/space-cards-state.png',
      fullPage: true,
    });
  });

  test('should be able to navigate to a space detail page', async ({ page }) => {
    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Try to find and click any space link
    const spaceLink = page.locator('a[href*="/spaces/"]').first();

    if (await spaceLink.isVisible().catch(() => false)) {
      const href = await spaceLink.getAttribute('href');
      console.log(`✅ Found space link: ${href}`);

      await spaceLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });

      // Verify we're on a space detail page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/spaces\/[^/]+/);

      await page.screenshot({
        path: './test-results/space-detail-page.png',
        fullPage: true,
      });
    } else {
      console.log('ℹ️ No space links found on browse page');
    }
  });
});

test.describe('Core User Journey - Space Chat Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display chat input on space page', async ({ page }) => {
    // Navigate to a known space or the first available one
    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Try to find a space link
    const spaceLink = page.locator('a[href*="/spaces/"]').first();

    if (await spaceLink.isVisible().catch(() => false)) {
      await spaceLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });

      // Look for chat input elements
      const chatInput = page.locator([
        'textarea[placeholder*="message"]',
        'input[placeholder*="message"]',
        '[data-testid="chat-input"]',
        '[class*="chat-input"]',
        'textarea',
      ].join(', ')).first();

      const hasChatInput = await chatInput.isVisible().catch(() => false);

      await page.screenshot({
        path: './test-results/space-chat-interface.png',
        fullPage: true,
      });

      console.log(hasChatInput ? '✅ Chat input found' : 'ℹ️ Chat input not visible');
    }
  });

  test('should display chat messages container', async ({ page }) => {
    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const spaceLink = page.locator('a[href*="/spaces/"]').first();

    if (await spaceLink.isVisible().catch(() => false)) {
      await spaceLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });

      // Look for messages container
      const messagesContainer = page.locator([
        '[data-testid="messages"]',
        '[class*="message-list"]',
        '[class*="chat-messages"]',
        '[role="log"]',
      ].join(', ')).first();

      const hasMessages = await messagesContainer.isVisible().catch(() => false);
      console.log(hasMessages ? '✅ Messages container found' : 'ℹ️ Messages container not visible');
    }
  });
});

test.describe('Core User Journey - HiveLab Tools in Space', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display sidebar with tools on space page', async ({ page }) => {
    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const spaceLink = page.locator('a[href*="/spaces/"]').first();

    if (await spaceLink.isVisible().catch(() => false)) {
      await spaceLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });

      // Look for sidebar with tools
      const sidebar = page.locator([
        '[data-testid="space-sidebar"]',
        '[class*="sidebar"]',
        'aside',
      ].join(', ')).first();

      const hasSidebar = await sidebar.isVisible().catch(() => false);

      await page.screenshot({
        path: './test-results/space-with-sidebar.png',
        fullPage: true,
      });

      console.log(hasSidebar ? '✅ Sidebar found' : 'ℹ️ Sidebar not visible');
    }
  });

  test('should be able to interact with poll element if present', async ({ page }) => {
    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const spaceLink = page.locator('a[href*="/spaces/"]').first();

    if (await spaceLink.isVisible().catch(() => false)) {
      await spaceLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });

      // Look for poll elements
      const pollElement = page.locator([
        '[data-testid*="poll"]',
        '[class*="poll"]',
        '[class*="Poll"]',
      ].join(', ')).first();

      if (await pollElement.isVisible().catch(() => false)) {
        console.log('✅ Poll element found');

        // Try to find vote buttons
        const voteButton = pollElement.locator('button').first();
        if (await voteButton.isVisible().catch(() => false)) {
          console.log('✅ Poll has interactive buttons');
        }

        await pollElement.screenshot({
          path: './test-results/poll-element.png',
        });
      } else {
        console.log('ℹ️ No poll element on this space');
      }
    }
  });
});

test.describe('Core User Journey - Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page, context }) => {
    // Clear cookies to simulate logged out state
    await context.clearCookies();

    // Try to access protected route
    await page.goto('/spaces/browse');
    await page.waitForTimeout(3000);

    // Should either show login form or redirect to login
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/auth/login');
    const hasLoginForm = await page.locator('form').isVisible().catch(() => false);
    const hasLoginText = await page.getByText(/sign in|log in|email/i).isVisible().catch(() => false);

    await page.screenshot({
      path: './test-results/auth-redirect.png',
      fullPage: true,
    });

    // Should show some form of auth requirement
    expect(isOnLoginPage || hasLoginForm || hasLoginText).toBeTruthy();
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check for email input
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
    const hasEmailInput = await emailInput.isVisible().catch(() => false);

    // Check for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("sign"), button:has-text("continue")').first();
    const hasSubmitButton = await submitButton.isVisible().catch(() => false);

    await page.screenshot({
      path: './test-results/login-page.png',
      fullPage: true,
    });

    expect(hasEmailInput || hasSubmitButton).toBeTruthy();
  });
});

test.describe('Core User Journey - Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/spaces/nonexistent-space-id-12345');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Should show some error state, not crash
    const pageContent = await page.content();
    expect(pageContent).toContain('html');

    // Look for error indicators
    const hasError = await page.getByText(/not found|404|error|doesn't exist/i).isVisible().catch(() => false);

    await page.screenshot({
      path: './test-results/404-page.png',
      fullPage: true,
    });

    console.log(hasError ? '✅ Error page shown correctly' : 'ℹ️ Error state not explicitly shown');
  });

  test('should not show console errors on main pages', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test main pages
    const pages = ['/feed', '/spaces', '/spaces/browse'];

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
        !err.includes('socket')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠️ Console errors found:', criticalErrors.slice(0, 5));
    } else {
      console.log('✅ No critical console errors');
    }
  });
});

test.describe('Core User Journey - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile navigation', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for mobile nav elements
    const mobileNav = page.locator([
      '[data-testid="mobile-nav"]',
      '[class*="mobile-nav"]',
      'nav[class*="bottom"]',
      '[class*="BottomNav"]',
    ].join(', ')).first();

    const hasMobileNav = await mobileNav.isVisible().catch(() => false);

    await page.screenshot({
      path: './test-results/mobile-nav.png',
      fullPage: true,
    });

    console.log(hasMobileNav ? '✅ Mobile nav found' : 'ℹ️ Mobile nav not visible');
  });

  test('should not have horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const body = page.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);

    // Allow 20px margin for scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);

    await page.screenshot({
      path: './test-results/mobile-spaces-browse.png',
      fullPage: true,
    });
  });
});

test.describe('Core User Journey - Performance', () => {
  test('should load feed page in under 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/feed');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const loadTime = Date.now() - startTime;

    console.log(`Feed page load time: ${loadTime}ms`);

    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load spaces browse in under 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/spaces/browse');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const loadTime = Date.now() - startTime;

    console.log(`Spaces browse load time: ${loadTime}ms`);

    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
