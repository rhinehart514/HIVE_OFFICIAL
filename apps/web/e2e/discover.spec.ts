import { test, expect } from "@playwright/test";

test.describe("Discover Page", () => {
  test("/discover loads without 500", async ({ page }) => {
    const response = await page.goto("/discover");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/discover shows content or redirects to auth", async ({ page }) => {
    await page.goto("/discover");
    const url = page.url();
    expect(url.includes("/discover") || url.includes("/enter")).toBeTruthy();
  });
});
