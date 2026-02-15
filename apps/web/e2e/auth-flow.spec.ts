import { test, expect } from "@playwright/test";

/**
 * Auth Flow E2E Tests
 *
 * Tests the entry/onboarding flow:
 * Screen 1: Email input
 * Screen 2: OTP verification (+ name for new users)
 *
 * Note: We can't complete the full flow without a real email/OTP,
 * but we test every UI state we can reach.
 */

test.describe("Auth Flow - Email Screen", () => {
  const entryUrl = "/enter?schoolId=ub-buffalo&domain=buffalo.edu";

  test("renders email input with school domain hint", async ({ page }) => {
    await page.goto(entryUrl);
    await expect(page.getByPlaceholder(/buffalo\.edu/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  test("shows validation on empty submit", async ({ page }) => {
    await page.goto(entryUrl);
    await page.getByRole("button", { name: /continue/i }).click();
    // Should show some form of error/validation — page should not navigate
    await expect(page).toHaveURL(/\/enter/);
  });

  test("shows validation on non-school email", async ({ page }) => {
    await page.goto(entryUrl);
    await page.getByPlaceholder(/buffalo\.edu/i).fill("test@gmail.com");
    await page.getByRole("button", { name: /continue/i }).click();
    // Should stay on the page or show an error
    await expect(page).toHaveURL(/\/enter/);
  });

  test("accepts valid school email and advances to OTP", async ({ page }) => {
    await page.goto(entryUrl);
    await page.getByPlaceholder(/buffalo\.edu/i).fill("test@buffalo.edu");
    await page.getByRole("button", { name: /continue/i }).click();
    // Should advance to OTP/verification screen
    await expect(
      page.getByRole("heading", { name: /check your email/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Auth Flow - OTP Screen", () => {
  const entryUrl = "/enter?schoolId=ub-buffalo&domain=buffalo.edu";

  async function goToOtpScreen(page: any) {
    await page.goto(entryUrl);
    await page.getByPlaceholder(/buffalo\.edu/i).fill("test@buffalo.edu");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(
      page.getByRole("heading", { name: /check your email/i })
    ).toBeVisible({ timeout: 10000 });
  }

  test("shows 6 OTP input fields", async ({ page }) => {
    await goToOtpScreen(page);
    const inputs = page.locator('input[maxlength="1"]');
    await expect(inputs).toHaveCount(6);
  });

  test("OTP inputs accept digits and auto-advance", async ({ page }) => {
    await goToOtpScreen(page);
    const inputs = page.locator('input[maxlength="1"]');
    await inputs.first().click();
    await page.keyboard.type("123456");
    for (let i = 0; i < 6; i++) {
      await expect(inputs.nth(i)).toHaveValue(String(i + 1));
    }
  });

  test("OTP paste fills all inputs", async ({ page }) => {
    await goToOtpScreen(page);
    const inputs = page.locator('input[maxlength="1"]');
    await inputs.first().click();
    await page.evaluate(() => {
      const input = document.querySelector('input[maxlength="1"]') as HTMLInputElement;
      const paste = new ClipboardEvent("paste", {
        clipboardData: new DataTransfer(),
      });
      paste.clipboardData!.setData("text/plain", "654321");
      input.dispatchEvent(paste);
    });
    for (let i = 0; i < 6; i++) {
      await expect(inputs.nth(i)).toHaveValue("654321"[i]);
    }
  });

  test("shows resend code option", async ({ page }) => {
    await goToOtpScreen(page);
    // There should be a resend link/button
    await expect(
      page.getByText(/resend/i).or(page.getByRole("button", { name: /resend/i }))
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Auth - Entry Without School Params", () => {
  test("/enter without params still loads", async ({ page }) => {
    const response = await page.goto("/enter");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/login redirects or loads", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBeLessThan(500);
  });
});
