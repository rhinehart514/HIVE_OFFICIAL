import { test, expect } from "@playwright/test";

test.describe("Navigation - Desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("landing page header has nav links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=HIVE")).toBeVisible();
  });

  test("clicking Browse Spaces navigates to /spaces", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /browse spaces/i }).click();
    await page.waitForURL(/\/(spaces|enter)/);
    // Either loads spaces or redirects to enter (auth required)
  });

  test("clicking Get Started navigates to /enter", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /get started/i }).click();
    await page.waitForURL(/\/enter/);
  });
});

test.describe("Navigation - Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("landing page renders on mobile viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=HIVE")).toBeVisible();
  });

  test("entry page has no app shell on mobile", async ({ page }) => {
    await page.goto("/enter?schoolId=ub-buffalo&domain=buffalo.edu");
    // Entry page should be a clean, full-screen experience
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toHaveCount(0);
  });
});

test.describe("Entry Page Navigation", () => {
  test("entry page has no top header chrome", async ({ page }) => {
    await page.goto("/enter?schoolId=ub-buffalo&domain=buffalo.edu");
    await expect(page.locator("header")).toHaveCount(0);
  });
});
