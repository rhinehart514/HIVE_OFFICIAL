/**
 * Global Setup for Audit Tests
 *
 * Authenticates once and saves the session state for reuse across all audit tests.
 * Handles the full onboarding flow if needed.
 */

import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_FILE = path.join(__dirname, '..', '..', '..', '..', 'audit-results', '.auth-state.json');

setup('authenticate for audit', async ({ page, context }) => {
  console.log('🔐 Setting up audit authentication...');

  // Ensure auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to /enter
  await page.goto('/enter');

  // Wait for email input
  const emailInput = page.locator('input[type="email"], input[placeholder*="@"]');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });

  // Fill email
  await emailInput.fill('jwrhineh@buffalo.edu');

  // Submit
  await page.keyboard.press('Enter');

  // Wait for response
  await page.waitForTimeout(3000);

  // Check if we got rate limited
  const hasRateLimitError = await page.locator('text=Rate limit').count();
  if (hasRateLimitError > 0) {
    console.warn('⚠️ Rate limited during auth setup. Waiting 60s...');
    await page.waitForTimeout(60000);
    // Retry
    await page.goto('/enter');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill('jwrhineh@buffalo.edu');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }

  // In dev mode, enter any 6-digit code
  const otpVisible = await page.locator('[data-testid="otp-input"], input[inputmode="numeric"]').first().isVisible({ timeout: 5000 }).catch(() => false);

  if (otpVisible) {
    await page.keyboard.type('123456');
    await page.waitForTimeout(1000);
  }

  // Wait for either authenticated area OR onboarding
  await page.waitForURL(/(profile|onboarding|start|feed|spaces|home|explore|enter)/, {
    timeout: 30000,
  });

  // Handle onboarding if we're in it (Naming screen)
  let maxOnboardingSteps = 5;
  while (maxOnboardingSteps > 0) {
    maxOnboardingSteps--;

    // Check if we're on the naming screen
    const firstNameInput = page.locator('input[placeholder*="First"], input[name="firstName"]').first();
    if (await firstNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('📝 Completing naming step...');
      await firstNameInput.fill('Test');

      const lastNameInput = page.locator('input[placeholder*="Last"], input[name="lastName"]').first();
      if (await lastNameInput.isVisible()) {
        await lastNameInput.fill('User');
      }

      // Click continue
      const continueBtn = page.locator('button:has-text("Continue")').first();
      if (await continueBtn.isEnabled()) {
        await continueBtn.click();
        await page.waitForTimeout(2000);
      }
      continue;
    }

    // Check if we're on the field screen (year/major)
    const yearSelect = page.locator('button:has-text("Freshman"), button:has-text("Sophomore"), button:has-text("Year")').first();
    if (await yearSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('📝 Completing field step...');
      // Click the first available year option
      await yearSelect.click();
      await page.waitForTimeout(500);

      // Click continue
      const continueBtn = page.locator('button:has-text("Continue")').first();
      if (await continueBtn.isEnabled()) {
        await continueBtn.click();
        await page.waitForTimeout(2000);
      }
      continue;
    }

    // Check if we're on the interests/crossing screen
    const interestTags = page.locator('[data-interest], button:has-text("Technology"), button:has-text("Design")').first();
    if (await interestTags.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('📝 Completing interests step...');
      // Click a few interests
      await interestTags.click();
      await page.waitForTimeout(500);

      // Click continue/finish
      const finishBtn = page.locator('button:has-text("Continue"), button:has-text("Finish"), button:has-text("Enter")').first();
      if (await finishBtn.isEnabled()) {
        await finishBtn.click();
        await page.waitForTimeout(2000);
      }
      continue;
    }

    // Check if we've made it to the app
    const url = page.url();
    if (url.includes('/spaces') || url.includes('/home') || url.includes('/explore') || url.includes('/feed')) {
      console.log('✅ Made it to authenticated area');
      break;
    }

    // If there's a "Skip" or "Continue" button, click it
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Continue"), a:has-text("Skip")').first();
    if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
      continue;
    }

    // Wait a bit and try again
    await page.waitForTimeout(1000);
  }

  // Final check - navigate to a known authenticated route
  await page.goto('/explore');
  await page.waitForLoadState('networkidle');

  // Verify we're authenticated
  const profileStatus = await page.evaluate(async () => {
    const res = await fetch('/api/profile', { credentials: 'include' });
    return res.status;
  });

  if (profileStatus >= 400) {
    console.error('❌ Authentication verification failed. Status:', profileStatus);
    await page.screenshot({ path: path.join(authDir, 'auth-verification-failure.png') });
    throw new Error('Authentication failed - profile API returned ' + profileStatus);
  }

  console.log('✅ Authentication successful');

  // Save storage state
  await context.storageState({ path: AUTH_FILE });
  console.log(`💾 Auth state saved to ${AUTH_FILE}`);
});
