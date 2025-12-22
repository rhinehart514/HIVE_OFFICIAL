import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:3000/auth/login');
console.log('✅ Browser open at http://localhost:3000/auth/login');
console.log('Press Ctrl+C to close');
await new Promise(() => {});
