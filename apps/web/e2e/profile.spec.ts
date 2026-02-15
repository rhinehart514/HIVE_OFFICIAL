import { test, expect } from "@playwright/test";

test.describe("Profile Pages", () => {
  test("/me redirects (to profile or auth)", async ({ page }) => {
    const response = await page.goto("/me");
    expect(response?.status()).toBeLessThan(500);
    // Should redirect to /u/[handle] or /enter
    const url = page.url();
    expect(url.includes("/u/") || url.includes("/enter")).toBeTruthy();
  });

  test("/u/nonexistent-handle does not 500", async ({ page }) => {
    const response = await page.goto("/u/nonexistent-handle-12345");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/settings loads or redirects", async ({ page }) => {
    const response = await page.goto("/settings");
    expect(response?.status()).toBeLessThan(500);
  });
});
