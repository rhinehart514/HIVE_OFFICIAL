#!/usr/bin/env node
/**
 * Spaces UI Audit Script
 * Uses Playwright to navigate through spaces and capture screenshots
 */

import { chromium } from 'playwright';

const SESSION_TOKEN = process.env.SESSION || 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyLWp3cmhpbmVoIiwiZW1haWwiOiJqd3JoaW5laEBidWZmYWxvLmVkdSIsImNhbXB1c0lkIjoidWItYnVmZmFsbyIsImlzQWRtaW4iOmZhbHNlLCJ2ZXJpZmllZEF0IjoiMjAyNS0xMi0wOFQwMTozOToyNS41NTRaIiwic2Vzc2lvbklkIjoic2Vzc2lvbi0xNzY1MTU3OTY1NTYyIiwic3ViIjoidXNlci1qd3JoaW5laCIsImlhdCI6MTc2NTE1Nzk2NSwiZXhwIjoxNzY3NzQ5OTY1fQ.0P49h3eSGLsPEvYKFXbsenqn1LnrOLGd_7BUqPpKo1w';

const BASE_URL = 'http://localhost:3000';

async function auditSpaces() {
  console.log('🚀 Starting Spaces UI Audit...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Set session cookie
  await context.addCookies([{
    name: 'hive_session',
    value: SESSION_TOKEN,
    domain: 'localhost',
    path: '/'
  }]);

  const page = await context.newPage();
  const issues = [];

  try {
    // 1. Spaces Browse Page
    console.log('📍 1. Checking /spaces/browse...');
    await page.goto(`${BASE_URL}/spaces/browse`, { timeout: 120000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const browseTitle = await page.title();
    console.log(`   Title: ${browseTitle}`);

    // Check for space cards
    const spaceCards = await page.locator('[class*="space"], [class*="card"]').count();
    console.log(`   Space cards found: ${spaceCards}`);

    // Check for errors
    const errorText = await page.locator('text=error, text=Error, text=failed').count();
    if (errorText > 0) {
      issues.push('Spaces Browse: Error text visible on page');
    }

    await page.screenshot({ path: '/tmp/spaces-browse.png', fullPage: true });
    console.log('   ✅ Screenshot saved: /tmp/spaces-browse.png\n');

    // 2. Click first space if available
    console.log('📍 2. Navigating to a space detail...');
    const firstSpaceLink = page.locator('a[href*="/spaces/"]').first();
    if (await firstSpaceLink.count() > 0) {
      await firstSpaceLink.click();
      await page.waitForTimeout(2000);

      const spaceUrl = page.url();
      console.log(`   URL: ${spaceUrl}`);

      // Check for chat board
      const chatArea = await page.locator('[class*="chat"], [class*="message"], [class*="board"]').count();
      console.log(`   Chat/board elements: ${chatArea}`);

      // Check for sidebar
      const sidebar = await page.locator('[class*="sidebar"], aside').count();
      console.log(`   Sidebar elements: ${sidebar}`);

      await page.screenshot({ path: '/tmp/space-detail.png', fullPage: true });
      console.log('   ✅ Screenshot saved: /tmp/space-detail.png\n');

      // 3. Check members tab
      console.log('📍 3. Checking members...');
      const membersLink = page.locator('a[href*="members"], button:has-text("Members")').first();
      if (await membersLink.count() > 0) {
        await membersLink.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: '/tmp/space-members.png', fullPage: true });
        console.log('   ✅ Screenshot saved: /tmp/space-members.png\n');
      }

      // 4. Check events/calendar
      console.log('📍 4. Checking events/calendar...');
      const eventsLink = page.locator('a[href*="events"], a[href*="calendar"], button:has-text("Events")').first();
      if (await eventsLink.count() > 0) {
        await eventsLink.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: '/tmp/space-events.png', fullPage: true });
        console.log('   ✅ Screenshot saved: /tmp/space-events.png\n');
      }
    } else {
      issues.push('No space links found on browse page');
      console.log('   ⚠️ No space links found\n');
    }

    // 5. Check search
    console.log('📍 5. Testing space search...');
    await page.goto(`${BASE_URL}/spaces/browse`, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('study');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/spaces-search.png', fullPage: true });
      console.log('   ✅ Screenshot saved: /tmp/spaces-search.png\n');
    } else {
      console.log('   ⚠️ No search input found\n');
    }

    // 6. Console errors check
    console.log('📍 6. Checking for console errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/spaces/browse`, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    if (consoleErrors.length > 0) {
      console.log(`   ⚠️ ${consoleErrors.length} console errors found`);
      consoleErrors.slice(0, 3).forEach(e => console.log(`      - ${e.substring(0, 100)}`));
    } else {
      console.log('   ✅ No console errors\n');
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 AUDIT SUMMARY');
    console.log('═══════════════════════════════════════');

    if (issues.length === 0) {
      console.log('✅ No critical issues found!');
    } else {
      console.log(`⚠️ ${issues.length} issues found:`);
      issues.forEach(i => console.log(`   - ${i}`));
    }

    console.log('\n📸 Screenshots saved to /tmp/');
    console.log('   - spaces-browse.png');
    console.log('   - space-detail.png');
    console.log('   - space-members.png');
    console.log('   - space-events.png');
    console.log('   - spaces-search.png');

    // Keep browser open for inspection
    console.log('\n🔍 Browser open for inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('❌ Audit error:', error.message);
  } finally {
    await browser.close();
  }
}

auditSpaces();
