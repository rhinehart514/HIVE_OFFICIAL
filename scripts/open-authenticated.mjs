import { chromium } from 'playwright';

async function openHive() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  
  // First hit login page
  console.log('Loading login page...');
  await page.goto('http://localhost:3000/auth/login');
  
  // Use dev auth via fetch in the page context
  console.log('Authenticating as jwrhineh@buffalo.edu...');
  const authResult = await page.evaluate(async () => {
    const res = await fetch('/api/dev-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jwrhineh@buffalo.edu' }),
      credentials: 'include'
    });
    return res.json();
  });
  
  console.log('Auth result:', JSON.stringify(authResult, null, 2));
  
  // Navigate to feed
  console.log('Navigating to feed...');
  await page.goto('http://localhost:3000/feed');
  await page.waitForTimeout(2000);
  
  console.log('Browser ready - you are signed in!');
  console.log('Press Ctrl+C to close');
  
  await new Promise(() => {});
}

openHive().catch(console.error);
