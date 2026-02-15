# HIVE E2E Testing

## Quick Start

```bash
cd apps/web

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests (starts dev server automatically)
npx playwright test

# Run with UI mode (interactive)
npx playwright test --ui

# Run a specific test file
npx playwright test e2e/auth-flow.spec.ts

# Run tests matching a pattern
npx playwright test -g "landing"
```

## Test Files

| File | What it covers |
|---|---|
| `e2e/landing.spec.ts` | Landing page renders, CTAs, title, header/footer |
| `e2e/auth-flow.spec.ts` | Email entry → OTP screen, validation, OTP input behavior |
| `e2e/navigation.spec.ts` | Desktop/mobile nav, entry page shell isolation |
| `e2e/pages-load.spec.ts` | Every major route returns non-500 (smoke tests) |
| `e2e/api-health.spec.ts` | `/api/health`, auth endpoints, content APIs |
| `e2e/spaces.spec.ts` | Spaces hub, individual space pages |
| `e2e/discover.spec.ts` | Discover page |
| `e2e/profile.spec.ts` | /me redirect, /u/[handle], /settings |
| `e2e/hivelab.spec.ts` | HiveLab pages (lab, new, create, templates) |
| `e2e/accessibility.spec.ts` | Lang attr, viewport meta, descriptions, alt text |
| `e2e/shell.spec.ts` | App shell basics (existing) |
| `e2e/auth.spec.ts` | Auth UI details (existing) |
| `e2e/create.spec.ts` | Create flow basics (existing) |

## Configuration

- **Config:** `playwright.config.ts`
- **Base URL:** `http://localhost:3000`
- **Browsers:** Desktop Chrome + Mobile Safari (iPhone 14)
- **Dev server:** Auto-started via `pnpm dev` (reuses existing if running)

## Writing New Tests

Tests go in `e2e/`. Follow the pattern:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("description of behavior", async ({ page }) => {
    await page.goto("/route");
    await expect(page.locator("...")).toBeVisible();
  });
});
```

## Notes

- **Auth-protected pages** redirect to `/enter` when unauthenticated — tests verify no 500s, not full authenticated flows
- **API tests** use `request` fixture (no browser needed) for faster execution
- To test authenticated flows, you'd need to set up auth state via `storageState` in Playwright
