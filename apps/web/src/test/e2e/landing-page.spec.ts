/**
 * Landing Page E2E Tests
 *
 * Tests the public landing page renders correctly with all sections and CTAs.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders all sections without auth', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should NOT redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).not.toContain('/enter');

    // Hero section
    const hero = page.locator('h1');
    await expect(hero).toBeVisible({ timeout: 10000 });
    const heroText = await hero.textContent();
    expect(heroText?.toLowerCase()).toContain('club');

    // "UB CLUBS ARE LIVE" badge
    const liveBadge = page.locator('text=LIVE');
    await expect(liveBadge.first()).toBeVisible();
  });

  test('has claim CTA that links to entry flow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find "Claim" or "Find your club" CTA
    const claimCta = page.locator('a', { hasText: /claim|find/i }).first();
    const hasClaimCta = await claimCta.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasClaimCta).toBe(true);

    if (hasClaimCta) {
      const href = await claimCta.getAttribute('href');
      expect(href).toBeTruthy();
      // Should point to enter or spaces flow
      expect(href).toMatch(/enter|spaces|discover/);
    }
  });

  test('has browse CTA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const browseCta = page.locator('a', { hasText: /browse|discover|explore/i }).first();
    const hasBrowseCta = await browseCta.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasBrowseCta).toBe(true);
  });

  test('renders header and footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Footer
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('responsive: renders on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 }, // iPhone X
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hero = page.locator('h1');
    await expect(hero).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('no console errors on landing page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('hydration') && 
      !e.includes('Loading chunk') &&
      !e.includes('net::ERR')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
