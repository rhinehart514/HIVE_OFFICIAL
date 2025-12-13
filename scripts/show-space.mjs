import { chromium } from 'playwright';

async function showSpace() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Create dev session with longer timeout
  console.log('Creating dev session...');
  try {
    const sessionResponse = await page.request.post('http://localhost:3000/api/auth/dev-session', {
      headers: { 'Content-Type': 'application/json' },
      data: { email: 'jwrhineh@buffalo.edu' },
      timeout: 120000
    });
    const sessionData = await sessionResponse.json();
    console.log('Session created for user:', sessionData.user?.userId);
  } catch (e) {
    console.log('Session creation failed, trying navigation anyway...');
  }
  
  // Navigate to space by ID (more reliable)
  console.log('Navigating to Startup Founders Club...');
  try {
    await page.goto('http://localhost:3000/spaces/lcnTdpZd0yYaqcmquJad', {
      waitUntil: 'domcontentloaded',
      timeout: 180000
    });
  } catch (e) {
    console.log('Navigation timeout, taking screenshot anyway...');
  }
  
  console.log('Waiting for page to fully load...');
  await page.waitForTimeout(45000);
  
  console.log('Current URL:', page.url());
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/hive-space-desktop.png', fullPage: false });
  console.log('Desktop screenshot: /tmp/hive-space-desktop.png');
  
  // Mobile screenshot  
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/hive-space-mobile.png', fullPage: false });
  console.log('Mobile screenshot: /tmp/hive-space-mobile.png');
  
  await browser.close();
  console.log('Done!');
}

showSpace().catch(e => {
  console.error('Script error:', e.message);
  process.exit(1);
});
