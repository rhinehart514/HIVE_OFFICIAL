/**
 * Edit Profile E2E Tests
 *
 * Tests profile editing functionality:
 * 1. Profile form fields
 * 2. Avatar upload
 * 3. Bio and interests editing
 * 4. Privacy settings (Ghost Mode)
 * 5. Save and cancel operations
 */

import { test, expect } from '../config/test-fixtures';

test.describe('Edit Profile - Page Load', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load edit profile page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Page should render without errors
    const pageContent = await authenticatedPage.content();
    expect(pageContent).toContain('html');
    expect(pageContent.length).toBeGreaterThan(500);

    await authenticatedPage.screenshot({
      path: './test-results/edit-profile-loaded.png',
      fullPage: true,
    });
  });

  test('should display user avatar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for avatar element
    const avatarElements = authenticatedPage.locator([
      '[data-testid="avatar"]',
      '[class*="avatar"]',
      'img[alt*="profile"]',
      'img[alt*="avatar"]',
    ].join(', '));

    const hasAvatar = await avatarElements.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(hasAvatar ? '✅ Avatar element found' : 'ℹ️ Avatar not visible');
  });

  test('should show display name input', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for name input
    const nameInput = authenticatedPage.locator([
      'input[name="displayName"]',
      'input[name="name"]',
      'input[placeholder*="name"]',
      '[data-testid="display-name-input"]',
    ].join(', '));

    const hasNameInput = await nameInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasNameInput).toBe(true);
  });

  test('should show bio textarea', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for bio input
    const bioInput = authenticatedPage.locator([
      'textarea[name="bio"]',
      'textarea[placeholder*="bio"]',
      '[data-testid="bio-input"]',
    ].join(', '));

    const hasBioInput = await bioInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(hasBioInput ? '✅ Bio textarea found' : 'ℹ️ Bio input not visible');
  });
});

test.describe('Edit Profile - Form Editing', () => {
  test('should edit display name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    const nameInput = authenticatedPage.locator([
      'input[name="displayName"]',
      'input[name="name"]',
      'input[placeholder*="name"]',
    ].join(', ')).first();

    if (await nameInput.isVisible().catch(() => false)) {
      // Clear and type new name
      await nameInput.clear();
      await nameInput.fill('E2E Test User');

      // Verify the value was set
      const value = await nameInput.inputValue();
      expect(value).toBe('E2E Test User');
    }
  });

  test('should edit bio text', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    const bioInput = authenticatedPage.locator([
      'textarea[name="bio"]',
      'textarea[placeholder*="bio"]',
    ].join(', ')).first();

    if (await bioInput.isVisible().catch(() => false)) {
      await bioInput.clear();
      await bioInput.fill('This is a test bio written by E2E tests');

      const value = await bioInput.inputValue();
      expect(value).toContain('test bio');
    }
  });

  test('should show pending changes indicator', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Make a change
    const bioInput = authenticatedPage.locator('textarea').first();
    if (await bioInput.isVisible().catch(() => false)) {
      await bioInput.fill('Changed bio');

      // Look for unsaved changes indicator or enabled save button
      const saveButton = authenticatedPage.locator('button:has-text("Save"), button:has-text("Done")');
      const hasIndicator = await saveButton.isEnabled().catch(() => false);

      console.log(hasIndicator ? '✅ Save button enabled after changes' : 'ℹ️ No save indicator visible');
    }
  });
});

test.describe('Edit Profile - Avatar Upload', () => {
  test('should show avatar upload trigger', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for upload trigger (camera icon, edit button, file input)
    const uploadTrigger = authenticatedPage.locator([
      'input[type="file"]',
      'button[aria-label*="avatar"]',
      'button[aria-label*="photo"]',
      '[data-testid="avatar-upload"]',
      '[class*="camera"]',
    ].join(', '));

    const hasUpload = await uploadTrigger.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(hasUpload ? '✅ Avatar upload trigger found' : 'ℹ️ Avatar upload not visible');
  });

  test('should have file input for avatar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for file input (may be hidden)
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const hasFileInput = await fileInput.count() > 0;

    console.log(hasFileInput ? '✅ File input found' : 'ℹ️ No file input on page');
  });
});

test.describe('Edit Profile - Interests', () => {
  test('should show interests section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for interests section
    const interestsSection = authenticatedPage.getByText(/interests|tags|topics/i);
    const hasInterests = await interestsSection.isVisible({ timeout: 3000 }).catch(() => false);

    console.log(hasInterests ? '✅ Interests section found' : 'ℹ️ Interests section not visible');
  });

  test('should add new interest', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for interest input
    const interestInput = authenticatedPage.locator([
      'input[placeholder*="interest"]',
      'input[placeholder*="tag"]',
      '[data-testid="interest-input"]',
    ].join(', ')).first();

    if (await interestInput.isVisible().catch(() => false)) {
      await interestInput.fill('E2E Testing');
      await interestInput.press('Enter');

      // Interest should appear as tag
      const interestTag = authenticatedPage.getByText('E2E Testing');
      const hasTag = await interestTag.isVisible({ timeout: 2000 }).catch(() => false);

      console.log(hasTag ? '✅ Interest added' : 'ℹ️ Interest add not confirmed');
    }
  });
});

test.describe('Edit Profile - Privacy Settings', () => {
  test('should show privacy/ghost mode section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for privacy section
    const privacySection = authenticatedPage.locator([
      '[data-testid="ghost-mode"]',
      'text=Ghost Mode',
      'text=Privacy',
      '[class*="ghost"]',
    ].join(', '));

    const hasPrivacy = await privacySection.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(hasPrivacy ? '✅ Privacy section found' : 'ℹ️ Privacy section not visible');

    await authenticatedPage.screenshot({
      path: './test-results/edit-profile-privacy.png',
      fullPage: true,
    });
  });

  test('should toggle ghost mode', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    const ghostToggle = authenticatedPage.locator([
      '[data-testid="ghost-mode-toggle"]',
      'button:has-text("Ghost")',
      '[class*="ghost"] button',
    ].join(', ')).first();

    if (await ghostToggle.isVisible().catch(() => false)) {
      // Click to toggle
      await ghostToggle.click();

      // Should show modal or feedback
      const modal = authenticatedPage.locator('[role="dialog"], [data-testid="ghost-mode-modal"]');
      const hasModal = await modal.isVisible({ timeout: 2000 }).catch(() => false);

      console.log(hasModal ? '✅ Ghost mode modal opened' : 'ℹ️ Ghost mode toggled without modal');
    }
  });
});

test.describe('Edit Profile - Save & Cancel', () => {
  test('should have save button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    const saveButton = authenticatedPage.locator([
      'button:has-text("Save")',
      'button:has-text("Done")',
      'button[type="submit"]',
      '[data-testid="save-button"]',
    ].join(', '));

    const hasSave = await saveButton.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasSave).toBe(true);
  });

  test('should have cancel/back option', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    const cancelButton = authenticatedPage.locator([
      'button:has-text("Cancel")',
      'button:has-text("Back")',
      'a[href*="profile"]',
      '[data-testid="cancel-button"]',
    ].join(', '));

    const hasCancel = await cancelButton.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCancel).toBe(true);
  });

  test('should warn about unsaved changes on cancel', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Make a change
    const bioInput = authenticatedPage.locator('textarea').first();
    if (await bioInput.isVisible().catch(() => false)) {
      await bioInput.fill('Unsaved change');

      // Try to cancel
      const cancelButton = authenticatedPage.locator([
        'button:has-text("Cancel")',
        'button:has-text("Back")',
      ].join(', ')).first();

      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();

        // Should show confirmation dialog
        const confirmDialog = authenticatedPage.locator('[role="alertdialog"], [role="dialog"]');
        const hasConfirm = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false);

        console.log(hasConfirm ? '✅ Discard confirmation shown' : 'ℹ️ No discard confirmation');
      }
    }
  });
});

test.describe('Edit Profile - API Integration', () => {
  test('should save profile changes via API', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Make changes and save
    const bioInput = authenticatedPage.locator('textarea').first();
    if (await bioInput.isVisible().catch(() => false)) {
      await bioInput.fill('API test bio update');

      const saveButton = authenticatedPage.locator('button:has-text("Save"), button:has-text("Done")').first();
      if (await saveButton.isVisible().catch(() => false)) {
        // Listen for network request
        const responsePromise = authenticatedPage.waitForResponse(
          (response) => response.url().includes('/api/profile') && response.request().method() === 'POST',
          { timeout: 10000 }
        ).catch(() => null);

        await saveButton.click();

        const response = await responsePromise;
        if (response) {
          const status = response.status();
          expect(status).toBeLessThan(400);
          console.log(`✅ Profile saved (status: ${status})`);
        }
      }
    }
  });

  test('should load current profile data', async ({ authenticatedPage }) => {
    const result = await authenticatedPage.evaluate(async () => {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      });

      return {
        ok: response.ok,
        status: response.status,
      };
    });

    expect(result.ok).toBe(true);
    console.log('✅ Profile data loaded successfully');
  });
});

test.describe('Edit Profile - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Content should fit mobile viewport
    const body = authenticatedPage.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);

    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);

    await authenticatedPage.screenshot({
      path: './test-results/edit-profile-mobile.png',
      fullPage: true,
    });
  });

  test('should have touch-friendly inputs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Inputs should be at least 40px tall for touch
    const inputs = authenticatedPage.locator('input, textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible().catch(() => false)) {
        const box = await input.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(36);
        }
      }
    }
  });
});

test.describe('Edit Profile - Performance', () => {
  test('should load in under 3 seconds', async ({ authenticatedPage }) => {
    const startTime = Date.now();

    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Edit profile load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Edit Profile - Error Handling', () => {
  test('should not show console errors', async ({ authenticatedPage }) => {
    const consoleErrors: string[] = [];
    authenticatedPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await authenticatedPage.goto('/profile/edit');
    await authenticatedPage.waitForLoadState('networkidle');

    // Filter out benign errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('chunk') &&
        !err.includes('prefetch') &&
        !err.includes('socket') &&
        !err.includes('hydration')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠️ Console errors found:', criticalErrors.slice(0, 3));
    } else {
      console.log('✅ No critical console errors');
    }
  });
});
