import { chromium } from 'playwright';

async function viewHive() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    // Test login page
    console.log('📱 Loading login page...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: './screenshots/login.png', fullPage: true });
    console.log('✅ Login page loaded');

    // Check page content
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);

    // Test API
    console.log('\n🔌 Testing API connection...');
    const healthCheck = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/health');
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('API Health:', healthCheck);

    console.log('\n✨ Browser open - interact manually');
    console.log('⏳ Auto-closing in 120 seconds...\n');
    
    await page.waitForTimeout(120000);
    await browser.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
  }
}

viewHive();
