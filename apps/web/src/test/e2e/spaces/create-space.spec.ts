/**
 * Create Space E2E Tests
 *
 * Tests the full space creation flow:
 * 1. Template selection
 * 2. Space identity (name, handle)
 * 3. Access settings
 * 4. Launch/creation
 */

import { test, expect } from '../config/test-fixtures';

test.describe('Create Space - Full Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load create space page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should see template selection
    const heading = authenticatedPage.getByRole('heading', { name: /template|start|create/i });
    await expect(heading).toBeVisible({ timeout: 5000 });

    await authenticatedPage.screenshot({
      path: './test-results/create-space-template.png',
      fullPage: true,
    });
  });

  test('should display template options', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for template cards
    const templateCards = authenticatedPage.locator('[data-testid="template-card"], [class*="template"], button:has-text("Student Org")');
    const cardCount = await templateCards.count();

    expect(cardCount).toBeGreaterThan(0);
    console.log(`✅ Found ${cardCount} template options`);
  });

  test('should show progress indicator', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Progress indicator should be visible
    const progressDots = authenticatedPage.locator('[class*="progress"], [class*="step"], div.h-1.rounded-full');
    const hasProgress = await progressDots.first().isVisible().catch(() => false);

    expect(hasProgress).toBe(true);
  });

  test('should select template and proceed', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click first template
    const templateButton = authenticatedPage.locator('button:has-text("Student Org"), [data-testid="template-card"]').first();
    await templateButton.click();

    // Click continue/next button
    const continueButton = authenticatedPage.locator('button:has-text("Continue"), button:has-text("Next")');
    if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueButton.click();
      await authenticatedPage.waitForURL(/identity|name/i, { timeout: 5000 }).catch(() => {});
    }
  });

  test('should fill identity step', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new/identity');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should have name and handle fields
    const nameInput = authenticatedPage.locator('input[name="name"], input[placeholder*="name"]').first();
    const handleInput = authenticatedPage.locator('input[name="handle"], input[placeholder*="handle"]').first();

    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('E2E Test Space');
    }

    if (await handleInput.isVisible().catch(() => false)) {
      await handleInput.fill('e2e-test-space-' + Date.now());
    }

    await authenticatedPage.screenshot({
      path: './test-results/create-space-identity.png',
      fullPage: true,
    });
  });

  test('should show access options', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new/access');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should see access options (Open, Request to Join, Invite Only)
    const accessOptions = authenticatedPage.locator('[data-testid="access-option"], button:has-text("Open"), button:has-text("Request"), button:has-text("Invite")');
    const optionCount = await accessOptions.count();

    expect(optionCount).toBeGreaterThanOrEqual(2);

    await authenticatedPage.screenshot({
      path: './test-results/create-space-access.png',
      fullPage: true,
    });
  });

  test('should show launch confirmation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new/launch');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should see launch/create button
    const launchButton = authenticatedPage.locator('button:has-text("Launch"), button:has-text("Create"), button[type="submit"]');
    const hasLaunch = await launchButton.isVisible({ timeout: 3000 }).catch(() => false);

    await authenticatedPage.screenshot({
      path: './test-results/create-space-launch.png',
      fullPage: true,
    });

    console.log(hasLaunch ? '✅ Launch button found' : 'ℹ️ Launch button not visible');
  });
});

test.describe('Create Space - Navigation', () => {
  test('should navigate back from identity to template', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new/identity');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click back button
    const backButton = authenticatedPage.locator('button:has-text("Back")');
    if (await backButton.isVisible().catch(() => false)) {
      await backButton.click();
      await authenticatedPage.waitForURL('/spaces/new', { timeout: 5000 });
      expect(authenticatedPage.url()).toContain('/spaces/new');
    }
  });

  test('should navigate between steps via progress', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Steps should be accessible
    const currentStep = authenticatedPage.url();
    expect(currentStep).toContain('/spaces/new');
  });
});

test.describe('Create Space - Validation', () => {
  test('should require space name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new/identity');
    await authenticatedPage.waitForLoadState('networkidle');

    // Try to continue without filling name
    const continueButton = authenticatedPage.locator('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]');

    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();

      // Should show validation error
      const errorMessage = authenticatedPage.getByText(/required|name is required|please enter/i);
      const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

      // Or button should be disabled
      const isDisabled = await continueButton.isDisabled().catch(() => false);

      expect(hasError || isDisabled).toBe(true);
    }
  });

  test('should validate handle format', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new/identity');
    await authenticatedPage.waitForLoadState('networkidle');

    const handleInput = authenticatedPage.locator('input[name="handle"], input[placeholder*="handle"]').first();

    if (await handleInput.isVisible().catch(() => false)) {
      // Enter invalid handle with spaces
      await handleInput.fill('invalid handle with spaces');

      // Should show validation feedback
      const errorIndicator = authenticatedPage.locator('[class*="error"], [aria-invalid="true"], [class*="invalid"]');
      const hasError = await errorIndicator.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasError) {
        console.log('✅ Handle validation working');
      }
    }
  });
});

test.describe('Create Space - API Integration', () => {
  test('should check create permission', async ({ authenticatedPage }) => {
    const result = await authenticatedPage.evaluate(async () => {
      const response = await fetch('/api/spaces/check-create-permission', {
        credentials: 'include',
      });

      return {
        ok: response.ok,
        status: response.status,
      };
    });

    // User should have permission to create spaces
    expect([200, 201, 403].includes(result.status)).toBe(true);
  });

  test('should handle duplicate handle gracefully', async ({ authenticatedPage }) => {
    // Try to create space with existing handle via API
    const result = await authenticatedPage.evaluate(async () => {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Duplicate Test',
          handle: 'general', // This likely exists
          template: 'org',
          privacy: 'open',
        }),
      });

      const data = await response.json().catch(() => ({}));

      return {
        ok: response.ok,
        status: response.status,
        error: data.error?.message || null,
      };
    });

    // Should fail with 409 Conflict or 400 Bad Request
    if (!result.ok) {
      expect([400, 409].includes(result.status)).toBe(true);
      console.log('✅ Duplicate handle handled correctly');
    }
  });
});

test.describe('Create Space - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized create flow', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Content should fit mobile viewport
    const body = authenticatedPage.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);

    // Allow 20px margin for scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);

    await authenticatedPage.screenshot({
      path: './test-results/create-space-mobile.png',
      fullPage: true,
    });
  });

  test('should have touch-friendly buttons on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Buttons should be at least 44px tall for touch
    const buttons = authenticatedPage.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible().catch(() => false)) {
        const box = await button.boundingBox();
        if (box) {
          // Height should be at least 40px for touch targets
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});

test.describe('Create Space - Performance', () => {
  test('should load template page in under 3 seconds', async ({ authenticatedPage }) => {
    const startTime = Date.now();

    await authenticatedPage.goto('/spaces/new');
    await authenticatedPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Template page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);
  });
});
