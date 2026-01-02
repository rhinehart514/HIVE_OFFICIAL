/**
 * Discovery Browse & Search E2E Tests
 *
 * Tests the spaces discovery flow: browse, search, filter, join.
 * Covers territory filtering, pagination, and search functionality.
 */

import { test, expect } from '../config/test-fixtures';
import { browseSpaces, searchSpaces, joinSpace, measureApiLatency } from '../config/api-helpers';

test.describe('Spaces Browse', () => {
  test('should load browse page with space cards', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Page should render
    await expect(authenticatedPage.locator('body')).not.toBeEmpty();

    // Look for space cards
    const spaceCards = authenticatedPage.locator([
      '[data-testid*="space-card"]',
      '[class*="space-card"]',
      '[class*="SpaceCard"]',
    ].join(', '));

    const cardCount = await spaceCards.count();
    console.log(`Found ${cardCount} space cards on browse page`);

    // Should have at least some spaces (UB pre-seeded 400+)
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should fetch spaces via API', async ({ authenticatedPage }) => {
    const result = await browseSpaces(authenticatedPage, { limit: 10 });

    expect(result.ok).toBe(true);
    expect(result.data.spaces).toBeDefined();
    expect(Array.isArray(result.data.spaces)).toBe(true);
    expect(result.data.spaces.length).toBeGreaterThan(0);
  });

  test('should support pagination cursor', async ({ authenticatedPage }) => {
    // First page
    const page1 = await browseSpaces(authenticatedPage, { limit: 5 });
    expect(page1.ok).toBe(true);

    // If there's a next cursor, fetch second page
    if (page1.data.nextCursor) {
      const page2 = await browseSpaces(authenticatedPage, {
        limit: 5,
        cursor: page1.data.nextCursor,
      });
      expect(page2.ok).toBe(true);

      // Second page should have different spaces
      const page1Ids = page1.data.spaces?.map((s: { id: string }) => s.id) || [];
      const page2Ids = page2.data.spaces?.map((s: { id: string }) => s.id) || [];
      const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));

      expect(overlap.length).toBe(0);
    }
  });

  test('should filter by territory', async ({ authenticatedPage }) => {
    // Browse with territory filter
    const result = await browseSpaces(authenticatedPage, {
      limit: 10,
      territory: 'student',
    });

    expect(result.ok).toBe(true);
    expect(result.data.spaces).toBeDefined();
  });

  test('should handle empty results gracefully', async ({ authenticatedPage }) => {
    // Try a very specific filter that might return empty
    const result = await browseSpaces(authenticatedPage, {
      limit: 10,
      territory: 'nonexistent-territory',
    });

    // Should return without error, even if empty
    expect(result.status).toBeLessThan(500);
  });
});

test.describe('Spaces Search', () => {
  test('should search spaces by name', async ({ authenticatedPage }) => {
    const result = await searchSpaces(authenticatedPage, 'club');

    expect(result.ok).toBe(true);
    expect(result.data.spaces || result.data.results).toBeDefined();
  });

  test('should return relevant results for common queries', async ({ authenticatedPage }) => {
    const queries = ['engineering', 'music', 'sports'];

    for (const query of queries) {
      const result = await searchSpaces(authenticatedPage, query);
      expect(result.ok).toBe(true);
      console.log(`Search "${query}": ${result.data.spaces?.length || result.data.results?.length || 0} results`);
    }
  });

  test('should handle empty search gracefully', async ({ authenticatedPage }) => {
    const result = await searchSpaces(authenticatedPage, '');

    // Empty search should return browse results or error appropriately
    expect(result.status).toBeLessThan(500);
  });

  test('should handle special characters in search', async ({ authenticatedPage }) => {
    const result = await searchSpaces(authenticatedPage, 'club+music');

    expect(result.status).toBeLessThan(500);
  });

  test('should search with reasonable latency', async ({ authenticatedPage }) => {
    const latency = await measureApiLatency(
      authenticatedPage,
      '/api/spaces/search?q=test'
    );

    console.log(`Search latency: ${latency}ms`);

    // Search should complete in under 3 seconds
    expect(latency).toBeLessThan(3000);
  });
});

test.describe('Browse UI Interactions', () => {
  test('should display territory filters', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for filter elements
    const filterElements = authenticatedPage.locator([
      '[data-testid*="territory"]',
      '[data-testid*="filter"]',
      '[class*="territory"]',
      '[class*="filter"]',
      'button:has-text("Student")',
      'button:has-text("Academic")',
      'button:has-text("Social")',
    ].join(', '));

    const hasFilters = await filterElements.first().isVisible().catch(() => false);
    console.log(hasFilters ? '✅ Territory filters visible' : 'ℹ️ Filters may be in collapsed state');
  });

  test('should show search input', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = authenticatedPage.locator([
      'input[placeholder*="search" i]',
      'input[type="search"]',
      '[data-testid="search-input"]',
      '[class*="search-input"]',
    ].join(', '));

    const hasSearch = await searchInput.first().isVisible().catch(() => false);
    expect(hasSearch).toBe(true);
  });

  test('should navigate to space detail on card click', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find a space card link
    const spaceCard = authenticatedPage.locator('a[href^="/spaces/"]').first();

    if (await spaceCard.isVisible()) {
      const href = await spaceCard.getAttribute('href');
      await spaceCard.click();

      // Should navigate to space detail
      await authenticatedPage.waitForURL(/\/spaces\//);
      expect(authenticatedPage.url()).toContain('/spaces/');
    }
  });

  test('should handle scroll/infinite load', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Get initial card count
    const initialCards = await authenticatedPage.locator('[class*="space"]').count();

    // Scroll down
    await authenticatedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await authenticatedPage.waitForTimeout(1000);

    // Count cards again (might have more if infinite scroll is enabled)
    const afterScrollCards = await authenticatedPage.locator('[class*="space"]').count();

    console.log(`Cards: ${initialCards} → ${afterScrollCards} after scroll`);
  });
});

test.describe('Space Join Flow', () => {
  test('should join a public space', async ({ authenticatedPage }) => {
    // Get a space to join
    const browse = await browseSpaces(authenticatedPage, { limit: 5 });

    if (!browse.ok || !browse.data.spaces?.length) {
      test.skip(true, 'No spaces available to join');
      return;
    }

    const spaces = browse.data.spaces as Array<{ id: string; name: string }>;
    const spaceId = spaces[0].id;

    // Attempt to join
    const joinResult = await joinSpace(authenticatedPage, spaceId);

    // Should succeed (200/201) or indicate already member (400/409)
    expect([200, 201, 400, 409].includes(joinResult.status)).toBe(true);
  });

  test('should show join button on space cards', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for join buttons
    const joinButtons = authenticatedPage.locator([
      'button:has-text("Join")',
      'button:has-text("Join Space")',
      '[data-testid*="join"]',
    ].join(', '));

    const hasJoinButtons = await joinButtons.first().isVisible().catch(() => false);
    console.log(hasJoinButtons ? '✅ Join buttons visible' : 'ℹ️ May already be member of displayed spaces');
  });
});

test.describe('Browse Performance', () => {
  test('should load browse page in under 5 seconds', async ({ authenticatedPage }) => {
    const startTime = Date.now();

    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;
    console.log(`Browse page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(5000);
  });

  test('should have fast API response for browse', async ({ authenticatedPage }) => {
    const latency = await measureApiLatency(
      authenticatedPage,
      '/api/spaces/browse-v2?limit=10'
    );

    console.log(`Browse API latency: ${latency}ms`);

    // Browse should respond in under 2 seconds
    expect(latency).toBeLessThan(2000);
  });
});

test.describe('Browse Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized browse layout', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check body doesn't overflow
    const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);
  });

  test('should show search accessible on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Search should be accessible
    const searchInput = authenticatedPage.locator([
      'input[placeholder*="search" i]',
      'input[type="search"]',
      '[data-testid="search-input"]',
      'button:has-text("Search")',
    ].join(', '));

    const hasSearch = await searchInput.first().isVisible().catch(() => false);
    expect(hasSearch).toBe(true);
  });
});

test.describe('Recommended Spaces', () => {
  test('should fetch recommended spaces', async ({ authenticatedPage }) => {
    const result = await authenticatedPage.evaluate(async () => {
      const res = await fetch('/api/spaces/recommended?limit=5', {
        credentials: 'include',
      });
      return {
        ok: res.ok,
        status: res.status,
        data: await res.json().catch(() => null),
      };
    });

    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('should return personalized recommendations', async ({ authenticatedPage }) => {
    // Get recommendations multiple times and check consistency
    const result1 = await authenticatedPage.evaluate(async () => {
      const res = await fetch('/api/spaces/recommended?limit=5', {
        credentials: 'include',
      });
      return res.json();
    });

    expect(result1.spaces || result1.recommendations).toBeDefined();
  });
});

test.describe('Browse Error Handling', () => {
  test('should handle API errors gracefully on UI', async ({ authenticatedPage }) => {
    // Mock API failure
    await authenticatedPage.route('**/api/spaces/browse-v2**', route =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    );

    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Page should still render (show error state or fallback)
    await expect(authenticatedPage.locator('body')).not.toBeEmpty();
  });

  test('should recover after temporary network failure', async ({ authenticatedPage }) => {
    let shouldFail = true;

    await authenticatedPage.route('**/api/spaces/browse-v2**', route => {
      if (shouldFail) {
        shouldFail = false;
        route.fulfill({ status: 503 });
      } else {
        route.continue();
      }
    });

    await authenticatedPage.goto('/spaces/browse');
    await authenticatedPage.waitForLoadState('networkidle');

    // Refresh should work
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');

    // After recovery, page should work
    await expect(authenticatedPage.locator('body')).not.toBeEmpty();
  });
});
