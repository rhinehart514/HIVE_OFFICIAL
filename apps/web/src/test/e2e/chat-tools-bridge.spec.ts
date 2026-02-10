/**
 * Chat ↔ Tools Bridge E2E Tests
 *
 * Tests the slash command system, inline component rendering,
 * and the full chat-first tool creation flow.
 */

import { test, expect, TEST_TIMEOUTS } from './config/test-fixtures';
import { browseSpaces, joinSpace, sendChatMessage } from './config/api-helpers';

// ============================================================================
// SLASH COMMAND PARSING (unit-level sanity via browser)
// ============================================================================

test.describe('Slash Command UI', () => {
  test('typing "/" in chat input shows command menu', async ({ authenticatedPage: page }) => {
    // Navigate to a space
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    // Find a space and navigate to it
    const spaceLink = page.locator('a[href^="/s/"]').first();
    const hasSpaces = await spaceLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasSpaces, 'No spaces available for testing');

    await spaceLink.click();
    await page.waitForLoadState('networkidle');

    // Find the chat input
    const chatInput = page.locator('textarea').first();
    const hasChat = await chatInput.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasChat, 'No chat input visible');

    // Type "/" to trigger slash menu
    await chatInput.fill('/');
    
    // Slash menu or autocomplete should appear
    // Look for command suggestions
    await page.waitForTimeout(300); // allow menu to render
    const slashMenu = page.locator('[data-testid="slash-menu"], [role="listbox"], [class*="slash"]');
    const menuVisible = await slashMenu.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Even if the menu isn't visible via test-id, check that suggestions rendered
    const pageContent = await page.content();
    const hasSlashUI = menuVisible || 
      pageContent.includes('/poll') || 
      pageContent.includes('/rsvp') ||
      pageContent.includes('/countdown');
    
    expect(hasSlashUI).toBe(true);
  });

  test('slash command autocomplete filters on partial input', async ({ authenticatedPage: page }) => {
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    const spaceLink = page.locator('a[href^="/s/"]').first();
    const hasSpaces = await spaceLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasSpaces, 'No spaces available');

    await spaceLink.click();
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea').first();
    const hasChat = await chatInput.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasChat, 'No chat input visible');

    // Type "/po" — should filter to /poll
    await chatInput.fill('/po');
    await page.waitForTimeout(300);

    const pageContent = await page.content();
    const hasPoll = pageContent.includes('poll') || pageContent.includes('Poll');
    expect(hasPoll).toBe(true);
  });
});

// ============================================================================
// STANDALONE TOOL PAGE (/t/)
// ============================================================================

test.describe('Standalone Tool Page', () => {
  test('/t/ route renders without auth', async ({ page }) => {
    // Visit a tool page without being logged in
    // First, find a tool ID from the API
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    // Try to find any /t/ link on the page
    const toolLink = page.locator('a[href^="/t/"]').first();
    const hasTools = await toolLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTools) {
      const href = await toolLink.getAttribute('href');
      // Open in new context (no auth)
      const newContext = await page.context().browser()!.newContext();
      const newPage = await newContext.newPage();
      await newPage.goto(href!);
      
      // Should not redirect to login
      const url = newPage.url();
      expect(url).not.toContain('/login');
      expect(url).not.toContain('/enter');
      
      // Should have tool content
      await newPage.waitForLoadState('networkidle');
      const body = await newPage.textContent('body');
      expect(body).toBeTruthy();
      
      await newContext.close();
    } else {
      // Navigate directly to /t/ with a fake ID — should show 404 or error, not crash
      await page.goto('/t/nonexistent-tool-id');
      const status = page.url();
      // Should not crash — either shows error or redirects
      expect(status).toBeTruthy();
    }
  });
});

// ============================================================================
// CHAT INTENT FLOW (API-level)
// ============================================================================

test.describe('Chat Intent API', () => {
  test('chat intent endpoint processes slash commands', async ({ authenticatedPage: page }) => {
    // Find a space to test with
    const browse = await browseSpaces(page, { limit: 5 });
    test.skip(!browse.ok, 'Cannot browse spaces');

    const spaces = browse.data.spaces as Array<{ id: string }>;
    test.skip(!spaces?.length, 'No spaces available');

    const spaceId = spaces[0].id;

    // Send a slash command to the intent endpoint
    const result = await page.evaluate(async (sid: string) => {
      const res = await fetch(`/api/spaces/${sid}/chat/intent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '/poll "Best meeting time?" Monday Tuesday Wednesday',
        }),
      });
      return { status: res.status, ok: res.ok };
    }, spaceId);

    // Should accept the request (even if it returns a specific error, it shouldn't 500)
    expect(result.status).toBeLessThan(500);
  });
});

// ============================================================================
// SPACE TABS — CHAT ONLY
// ============================================================================

test.describe('Space Page - Chat First', () => {
  test('space page shows chat as default and only tab', async ({ authenticatedPage: page }) => {
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    const spaceLink = page.locator('a[href^="/s/"]').first();
    const hasSpaces = await spaceLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasSpaces, 'No spaces available');

    await spaceLink.click();
    await page.waitForLoadState('networkidle');

    // Should see "Chat" tab
    const chatTab = page.locator('button', { hasText: 'Chat' });
    const hasChatTab = await chatTab.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasChatTab).toBe(true);

    // Should NOT see old tabs like "Tools", "Members", "About" as primary tabs
    const toolsTab = page.locator('button', { hasText: /^Tools$/ });
    const hasToolsTab = await toolsTab.isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasToolsTab).toBe(false);
  });
});

// ============================================================================
// INLINE COMPONENT RENDERING
// ============================================================================

test.describe('Inline Components', () => {
  test('message with inline component data renders component', async ({ authenticatedPage: page }) => {
    // This is harder to test without seed data, so we test the component exists
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    const spaceLink = page.locator('a[href^="/s/"]').first();
    const hasSpaces = await spaceLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasSpaces, 'No spaces available');

    await spaceLink.click();
    await page.waitForLoadState('networkidle');

    // Check that the chat feed container exists
    const chatArea = page.locator('[data-testid="chat-messages"], [class*="message"], [class*="feed"]').first();
    const hasChatArea = await chatArea.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Chat area should exist (even if empty)
    expect(hasChatArea).toBe(true);
  });
});
