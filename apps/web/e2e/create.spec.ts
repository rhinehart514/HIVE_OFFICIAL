import { test, expect } from "@playwright/test";

test.describe("Create Flow", () => {
  test("/lab/new page loads", async ({ page }) => {
    // Will redirect to auth but should not crash
    const response = await page.goto("/lab/new");
    expect(response?.status()).toBeLessThan(500);
  });
});
