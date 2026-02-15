import { test, expect } from "@playwright/test";

test.describe("HiveLab", () => {
  test("/lab loads without 500", async ({ page }) => {
    const response = await page.goto("/lab");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/lab/new loads without 500", async ({ page }) => {
    const response = await page.goto("/lab/new");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/lab/create loads without 500", async ({ page }) => {
    const response = await page.goto("/lab/create");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/lab/templates loads without 500", async ({ page }) => {
    const response = await page.goto("/lab/templates");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/lab/setups loads without 500", async ({ page }) => {
    const response = await page.goto("/lab/setups");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/lab/nonexistent-tool-id does not 500", async ({ page }) => {
    const response = await page.goto("/lab/nonexistent-tool-id-12345");
    expect(response?.status()).toBeLessThan(500);
  });
});
