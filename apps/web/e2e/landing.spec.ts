import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders without crashing and shows HIVE branding", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("text=HIVE")).toBeVisible();
  });

  test("shows hero section with CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /browse spaces/i })).toBeVisible();
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HIVE/i);
  });

  test("renders header and footer", async ({ page }) => {
    await page.goto("/");
    // Landing has its own header/footer components
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Get Started CTA links to /enter", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /get started/i });
    await expect(cta).toHaveAttribute("href", /\/enter/);
  });

  test("Browse Spaces CTA links to /spaces", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /browse spaces/i });
    await expect(cta).toHaveAttribute("href", /\/spaces/);
  });
});
