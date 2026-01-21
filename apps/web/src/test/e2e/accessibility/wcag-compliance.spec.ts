/**
 * WCAG 2.1 AA Accessibility Compliance Tests
 *
 * Runs axe-core accessibility audits on key pages.
 * Target: 100% WCAG 2.1 AA compliance (Level A + AA)
 *
 * Key Rules:
 * - Perceivable: Text alternatives, adaptable content, distinguishable
 * - Operable: Keyboard accessible, enough time, navigable
 * - Understandable: Readable, predictable, input assistance
 * - Robust: Compatible with assistive technologies
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

// Pages to audit
const PAGES = [
  { path: '/', name: 'Landing Page' },
  { path: '/about', name: 'About Page' },
  { path: '/enter', name: 'Entry/Auth Page' },
  // Authenticated pages would require login setup
  // { path: '/feed', name: 'Feed' },
  // { path: '/spaces', name: 'Browse Spaces' },
];

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('WCAG 2.1 AA Compliance', () => {
  for (const page of PAGES) {
    test(`${page.name} should be WCAG 2.1 AA compliant`, async ({ page: browserPage }) => {
      // Navigate to page
      await browserPage.goto(page.path);

      // Wait for page to be fully loaded
      await browserPage.waitForLoadState('networkidle');

      // Inject axe-core
      await injectAxe(browserPage);

      // Run accessibility audit
      const violations = await getViolations(browserPage, null, {
        runOnly: {
          type: 'tag',
          values: WCAG_AA_TAGS,
        },
        rules: {
          // Color contrast - critical for readability
          'color-contrast': { enabled: true },
          // Landmark regions - critical for screen readers
          region: { enabled: true },
          // Headings - critical for navigation
          'heading-order': { enabled: true },
          // Form labels - critical for forms
          label: { enabled: true },
          // Alt text - critical for images
          'image-alt': { enabled: true },
          // Keyboard navigation
          'button-name': { enabled: true },
          'link-name': { enabled: true },
        },
      });

      // Log violations for debugging
      if (violations.length > 0) {
        console.log(`\n❌ ${page.name} has ${violations.length} accessibility violations:\n`);
        violations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.id} (${violation.impact})`);
          console.log(`   Description: ${violation.description}`);
          console.log(`   Help: ${violation.helpUrl}`);
          console.log(`   Affected elements: ${violation.nodes.length}`);
          violation.nodes.forEach((node) => {
            console.log(`   - ${node.html}`);
            console.log(`     ${node.failureSummary}`);
          });
          console.log('');
        });
      }

      // Assert no violations
      expect(violations, `${page.name} should have no WCAG 2.1 AA violations`).toHaveLength(0);
    });
  }
});

test.describe('Keyboard Navigation', () => {
  test('Landing page should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Press Tab multiple times and verify focus is visible
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(firstFocusable).toBeTruthy();

    // Verify focus indicators are visible (non-zero outline)
    const focusOutline = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const styles = window.getComputedStyle(element);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // At least one focus indicator should be present
    const hasFocusIndicator =
      focusOutline.outlineWidth !== '0px' ||
      focusOutline.outline !== 'none' ||
      focusOutline.boxShadow !== 'none';

    expect(hasFocusIndicator, 'Focused element should have visible focus indicator').toBe(true);
  });
});

test.describe('Reduced Motion', () => {
  test('Should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/about');

    // Check if animations are disabled or have zero duration
    const hasReducedMotion = await page.evaluate(() => {
      const elements = document.querySelectorAll('[style*="transition"], [style*="animation"]');
      let respectsReducedMotion = true;

      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const transitionDuration = parseFloat(styles.transitionDuration);
        const animationDuration = parseFloat(styles.animationDuration);

        // If either has non-zero duration, motion is not reduced
        if (transitionDuration > 0 || animationDuration > 0) {
          respectsReducedMotion = false;
        }
      });

      return respectsReducedMotion;
    });

    expect(hasReducedMotion, 'Page should respect prefers-reduced-motion').toBe(true);
  });
});

test.describe('Screen Reader', () => {
  test('Landing page should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Check for skip-to-content link
    const skipLink = await page.locator('a[href*="#main"], a[href*="#content"]').first();
    const hasSkipLink = (await skipLink.count()) > 0;
    expect(hasSkipLink, 'Page should have skip-to-content link').toBe(true);

    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length, 'Page should have headings').toBeGreaterThan(0);

    // First heading should be h1
    const firstHeading = headings[0];
    const firstHeadingTag = await firstHeading.evaluate((el) => el.tagName);
    expect(firstHeadingTag, 'First heading should be h1').toBe('H1');

    // Check for main landmark
    const main = await page.locator('main, [role="main"]').first();
    const hasMain = (await main.count()) > 0;
    expect(hasMain, 'Page should have main landmark').toBe(true);

    // Check for nav landmark
    const nav = await page.locator('nav, [role="navigation"]').first();
    const hasNav = (await nav.count()) > 0;
    expect(hasNav, 'Page should have navigation landmark').toBe(true);
  });
});
