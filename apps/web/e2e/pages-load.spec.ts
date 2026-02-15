import { test, expect } from "@playwright/test";

/**
 * Page Load Tests — verify every major route returns a non-500 response.
 * These catch build errors, missing imports, and server-side crashes.
 * Auth-protected pages will redirect (302/307) which is expected and fine.
 */

const publicPages = [
  { path: "/", name: "Landing" },
  { path: "/about", name: "About" },
  { path: "/legal", name: "Legal" },
  { path: "/enter?schoolId=ub-buffalo&domain=buffalo.edu", name: "Enter (auth)" },
  { path: "/offline", name: "Offline" },
];

const protectedPages = [
  { path: "/discover", name: "Discover" },
  { path: "/spaces", name: "Spaces Hub" },
  { path: "/me", name: "Profile Redirect" },
  { path: "/settings", name: "Settings" },
  { path: "/notifications", name: "Notifications" },
  { path: "/lab", name: "HiveLab" },
  { path: "/lab/new", name: "HiveLab New" },
  { path: "/lab/create", name: "HiveLab Create" },
  { path: "/lab/templates", name: "HiveLab Templates" },
];

test.describe("Public Pages Load", () => {
  for (const { path, name } of publicPages) {
    test(`${name} (${path}) loads without error`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(500);
    });
  }
});

test.describe("Protected Pages Load (may redirect to auth)", () => {
  for (const { path, name } of protectedPages) {
    test(`${name} (${path}) does not 500`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(500);
    });
  }
});
