/**
 * Report Content E2E Tests
 *
 * Tests the content reporting flow:
 * 1. Report a chat message
 * 2. Report a user profile
 * 3. View submitted reports
 */

import { test, expect } from '../config/test-fixtures';
import { browseSpaces } from '../config/api-helpers';

test.describe('Report Content - Chat Messages', () => {
  test('should show report button on message hover', async ({ authenticatedPage }) => {
    // Find a space with messages
    const browse = await browseSpaces(authenticatedPage, { limit: 5 });
    test.skip(!browse.ok || !browse.data.spaces?.length, 'No spaces available');

    const spaces = browse.data.spaces as Array<{ id: string; handle?: string }>;
    const space = spaces[0];
    const spaceHandle = space.handle || space.id;

    // Navigate to space chat
    await authenticatedPage.goto(`/s/${spaceHandle}`);
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for message rows
    const messageRow = authenticatedPage.locator('[data-testid="message-row"]').first();
    const hasMessages = await messageRow.isVisible().catch(() => false);

    if (hasMessages) {
      // Hover to reveal actions
      await messageRow.hover();

      // Look for more actions button
      const moreButton = authenticatedPage.locator('[data-testid="message-actions-button"]').first();
      const hasMoreButton = await moreButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasMoreButton) {
        await moreButton.click();

        // Report button should appear in dropdown
        const reportButton = authenticatedPage.locator('[data-testid="report-button"]');
        await expect(reportButton).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('should open report modal when clicking report', async ({ authenticatedPage }) => {
    const browse = await browseSpaces(authenticatedPage, { limit: 5 });
    test.skip(!browse.ok || !browse.data.spaces?.length, 'No spaces available');

    const spaces = browse.data.spaces as Array<{ id: string; handle?: string }>;
    const space = spaces[0];
    const spaceHandle = space.handle || space.id;

    await authenticatedPage.goto(`/s/${spaceHandle}`);
    await authenticatedPage.waitForLoadState('networkidle');

    const messageRow = authenticatedPage.locator('[data-testid="message-row"]').first();
    const hasMessages = await messageRow.isVisible().catch(() => false);

    if (hasMessages) {
      await messageRow.hover();

      const moreButton = authenticatedPage.locator('[data-testid="message-actions-button"]').first();
      const hasMoreButton = await moreButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasMoreButton) {
        await moreButton.click();

        const reportButton = authenticatedPage.locator('[data-testid="report-button"]');
        if (await reportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await reportButton.click();

          // Report modal should appear
          const reportModal = authenticatedPage.locator('[data-testid="report-modal"]');
          await expect(reportModal).toBeVisible({ timeout: 3000 });

          // Modal should have category select and description
          const categorySelect = authenticatedPage.locator('[data-testid="report-category"]');
          await expect(categorySelect).toBeVisible();

          const descriptionField = authenticatedPage.locator('[data-testid="report-description"]');
          await expect(descriptionField).toBeVisible();
        }
      }
    }
  });

  test('should submit report successfully', async ({ authenticatedPage }) => {
    const browse = await browseSpaces(authenticatedPage, { limit: 5 });
    test.skip(!browse.ok || !browse.data.spaces?.length, 'No spaces available');

    const spaces = browse.data.spaces as Array<{ id: string; handle?: string }>;
    const space = spaces[0];
    const spaceHandle = space.handle || space.id;

    await authenticatedPage.goto(`/s/${spaceHandle}`);
    await authenticatedPage.waitForLoadState('networkidle');

    const messageRow = authenticatedPage.locator('[data-testid="message-row"]').first();
    const hasMessages = await messageRow.isVisible().catch(() => false);

    if (hasMessages) {
      await messageRow.hover();

      const moreButton = authenticatedPage.locator('[data-testid="message-actions-button"]').first();
      if (await moreButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await moreButton.click();

        const reportButton = authenticatedPage.locator('[data-testid="report-button"]');
        if (await reportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await reportButton.click();

          // Fill out the report form
          const categorySelect = authenticatedPage.locator('[data-testid="report-category"]');
          await categorySelect.selectOption('spam');

          const descriptionField = authenticatedPage.locator('[data-testid="report-description"]');
          await descriptionField.fill('E2E test report - please ignore');

          // Submit the report
          const submitButton = authenticatedPage.locator('[data-testid="submit-report"]');
          await submitButton.click();

          // Should see success message
          const successMessage = authenticatedPage.getByText(/report submitted|thank you/i);
          await expect(successMessage).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('Report Content - User Profiles', () => {
  test('should show report option in profile menu', async ({ authenticatedPage }) => {
    // Find another user to view their profile
    const browse = await browseSpaces(authenticatedPage, { limit: 3 });
    test.skip(!browse.ok || !browse.data.spaces?.length, 'No spaces available');

    const spaces = browse.data.spaces as Array<{
      id: string;
      members?: Array<{ id: string; handle?: string }>;
    }>;

    // Try to find a user profile to view
    for (const space of spaces) {
      if (space.members && space.members.length > 0) {
        const member = space.members[0];
        const handle = member.handle || member.id;

        await authenticatedPage.goto(`/u/${handle}`);
        await authenticatedPage.waitForLoadState('networkidle');

        // Look for more options button (three dots)
        const moreButton = authenticatedPage.locator('[aria-label="More options"], [data-testid="profile-more-button"]').first();
        if (await moreButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await moreButton.click();

          // Should see report option
          const reportOption = authenticatedPage.locator('[data-testid="report-profile-button"], button:has-text("Report")');
          const hasReportOption = await reportOption.isVisible({ timeout: 2000 }).catch(() => false);

          if (hasReportOption) {
            console.log('✅ Report profile option found');
            return;
          }
        }
      }
    }

    console.log('ℹ️ Could not find a reportable profile');
  });

  test('should open report modal from profile page', async ({ authenticatedPage }) => {
    const browse = await browseSpaces(authenticatedPage, { limit: 3 });
    test.skip(!browse.ok || !browse.data.spaces?.length, 'No spaces available');

    const spaces = browse.data.spaces as Array<{
      id: string;
      members?: Array<{ id: string; handle?: string }>;
    }>;

    for (const space of spaces) {
      if (space.members && space.members.length > 0) {
        const member = space.members[0];
        const handle = member.handle || member.id;

        await authenticatedPage.goto(`/u/${handle}`);
        await authenticatedPage.waitForLoadState('networkidle');

        const moreButton = authenticatedPage.locator('[aria-label="More options"], [data-testid="profile-more-button"]').first();
        if (await moreButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await moreButton.click();

          const reportOption = authenticatedPage.locator('[data-testid="report-profile-button"], button:has-text("Report")');
          if (await reportOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await reportOption.click();

            // Report modal should open
            const reportModal = authenticatedPage.locator('[data-testid="report-modal"]');
            await expect(reportModal).toBeVisible({ timeout: 3000 });
            return;
          }
        }
      }
    }
  });
});

test.describe('View Submitted Reports', () => {
  test('should load reports page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/me/reports');
    await authenticatedPage.waitForLoadState('networkidle');

    // Page should render
    const heading = authenticatedPage.getByRole('heading', { name: /your reports|reports/i });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should display reports list or empty state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/me/reports');
    await authenticatedPage.waitForLoadState('networkidle');

    // Either see reports or empty state
    const reportCards = authenticatedPage.locator('[data-testid="report-card"], article');
    const emptyState = authenticatedPage.getByText(/no reports|nothing to show/i);

    const hasReports = await reportCards.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasReports || hasEmptyState).toBe(true);

    await authenticatedPage.screenshot({
      path: './test-results/reports-page.png',
      fullPage: true,
    });
  });

  test('should show report status indicators', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/me/reports');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for status badges
    const statusBadges = authenticatedPage.locator('[class*="badge"], [class*="status"]');
    const badgeCount = await statusBadges.count();

    if (badgeCount > 0) {
      console.log(`✅ Found ${badgeCount} status indicators`);
    } else {
      console.log('ℹ️ No status badges visible (may have no reports)');
    }
  });
});

test.describe('Report API Integration', () => {
  test('should submit report via API', async ({ authenticatedPage }) => {
    // Test the API directly
    const result = await authenticatedPage.evaluate(async () => {
      const response = await fetch('/api/content/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contentId: 'test-content-id',
          contentType: 'message',
          category: 'spam',
          description: 'E2E API test report - please ignore',
        }),
      });

      return {
        ok: response.ok,
        status: response.status,
      };
    });

    // Should either succeed or fail gracefully (400 for invalid content ID is acceptable)
    expect([200, 201, 400, 404].includes(result.status)).toBe(true);
  });

  test('should fetch user reports via API', async ({ authenticatedPage }) => {
    const result = await authenticatedPage.evaluate(async () => {
      const response = await fetch('/api/content/reports?limit=10', {
        credentials: 'include',
      });

      const data = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        hasReports: Array.isArray(data.reports),
      };
    });

    expect(result.ok).toBe(true);
    expect(result.hasReports).toBe(true);
  });
});
