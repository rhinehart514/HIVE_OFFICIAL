import { test, expect } from "@playwright/test";

/**
 * Basic accessibility and SEO checks
 */

test.describe("Accessibility Basics", () => {
  test("landing page has lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
  });

  test("landing page has meta viewport", async ({ page }) => {
    await page.goto("/");
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("width=");
  });

  test("landing page has meta description", async ({ page }) => {
    await page.goto("/");
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(10);
  });

  test("entry page email input has accessible label or placeholder", async ({ page }) => {
    await page.goto("/enter?schoolId=ub-buffalo&domain=buffalo.edu");
    const emailInput = page.getByPlaceholder(/\.edu/i);
    await expect(emailInput).toBeVisible();
  });

  test("images on landing page have alt text", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      // alt can be empty string (decorative) but should exist
      expect(alt).not.toBeNull();
    }
  });
});
