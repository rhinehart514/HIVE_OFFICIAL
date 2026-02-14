import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("shows email input on entry page", async ({ page }) => {
    await page.goto("/enter?schoolId=ub-buffalo&domain=buffalo.edu");
    await expect(page.getByRole("heading", { name: /email/i })).toBeVisible();
    await expect(page.getByPlaceholder(/buffalo\.edu/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  test("submits email and shows OTP screen", async ({ page }) => {
    await page.goto("/enter?schoolId=ub-buffalo&domain=buffalo.edu");
    await page.getByPlaceholder(/buffalo\.edu/i).fill("test@buffalo.edu");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 10000 });
  });

  test("OTP inputs accept digits and auto-advance", async ({ page }) => {
    await page.goto("/enter?schoolId=ub-buffalo&domain=buffalo.edu");
    await page.getByPlaceholder(/buffalo\.edu/i).fill("test@buffalo.edu");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 10000 });

    // Get all OTP input boxes
    const inputs = page.locator("input[maxlength=\"1\"]");
    await expect(inputs).toHaveCount(6);

    // Type digits one by one - each should auto-advance
    await inputs.first().click();
    await page.keyboard.type("123456");

    // All inputs should be filled
    for (let i = 0; i < 6; i++) {
      await expect(inputs.nth(i)).toHaveValue(String(i + 1));
    }
  });

  test("OTP paste fills all inputs", async ({ page }) => {
    await page.goto("/enter?schoolId=ub-buffalo&domain=buffalo.edu");
    await page.getByPlaceholder(/buffalo\.edu/i).fill("test@buffalo.edu");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 10000 });

    const inputs = page.locator("input[maxlength=\"1\"]");
    await inputs.first().click();

    // Simulate paste
    await page.evaluate(() => {
      const input = document.querySelector("input[maxlength=\"1\"]") as HTMLInputElement;
      const paste = new ClipboardEvent("paste", {
        clipboardData: new DataTransfer(),
      });
      paste.clipboardData!.setData("text/plain", "654321");
      input.dispatchEvent(paste);
    });

    // Verify all filled
    for (let i = 0; i < 6; i++) {
      await expect(inputs.nth(i)).toHaveValue("654321"[i]);
    }
  });
});
