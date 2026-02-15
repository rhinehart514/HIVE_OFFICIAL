import { test, expect } from "@playwright/test";

/**
 * Spaces E2E Tests
 *
 * Tests the spaces hub and individual space pages.
 * Without auth, these redirect — we verify no crashes.
 */

test.describe("Spaces Hub", () => {
  test("/spaces loads without 500", async ({ page }) => {
    const response = await page.goto("/spaces");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/spaces shows content or redirects to auth", async ({ page }) => {
    await page.goto("/spaces");
    // Either we see the spaces hub or we're redirected to /enter
    const url = page.url();
    const isSpaces = url.includes("/spaces");
    const isEntry = url.includes("/enter");
    expect(isSpaces || isEntry).toBeTruthy();
  });
});

test.describe("Individual Space Page", () => {
  test("/s/test-space does not 500", async ({ page }) => {
    const response = await page.goto("/s/test-space");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/spaces/nonexistent does not 500", async ({ page }) => {
    const response = await page.goto("/spaces/nonexistent-space-id");
    expect(response?.status()).toBeLessThan(500);
  });
});
