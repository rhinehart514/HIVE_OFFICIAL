import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/hive-screenshots';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
let screenshotIdx = 0;

function log(route, status, notes = []) {
  const entry = { route, status, notes };
  results.push(entry);
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${route}`);
  notes.forEach(n => console.log(`   → ${n}`));
}

async function screenshot(page, name) {
  const file = path.join(OUT, `${String(screenshotIdx++).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function checkRoute(page, route, opts = {}) {
  const url = BASE + route;
  const notes = [];
  const errors = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  let response;
  try {
    response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch (e) {
    log(route, 'FAIL', [`Timeout or navigation error: ${e.message}`]);
    return;
  }

  const status = response?.status();
  if (status >= 400) {
    log(route, 'FAIL', [`HTTP ${status}`]);
    return;
  }

  // Wait a bit for client-side render
  await page.waitForTimeout(2000);

  // Check for crash indicators
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const title = await page.title().catch(() => '');

  if (bodyText.includes('Application error') || bodyText.includes('Internal Server Error')) {
    notes.push('⛔ App crashed — "Application error" visible');
  }
  if (bodyText.includes('404') && bodyText.toLowerCase().includes('not found')) {
    notes.push('⛔ 404 page rendered');
  }
  if (errors.length) notes.push(`JS errors: ${errors.slice(0,2).join(' | ')}`);
  if (consoleErrors.length) notes.push(`Console errors: ${consoleErrors.slice(0,2).join(' | ')}`);

  // Check for completely blank pages
  const hasContent = await page.locator('main, [role="main"], #__next > div').count();
  if (!hasContent) notes.push('⚠️ No main content element found — possibly blank');

  // Check nav presence
  if (opts.checkNav) {
    const navLinks = await page.locator('nav a, [role="navigation"] a').count();
    notes.push(`Nav links found: ${navLinks}`);
  }

  // Check for loading spinners stuck
  await page.waitForTimeout(1500);
  const spinners = await page.locator('[class*="spinner"], [class*="loading"], [class*="skeleton"]').count();
  if (spinners > 3) notes.push(`⚠️ ${spinners} loading indicators still visible after 3.5s`);

  // Screenshot
  await screenshot(page, route.replace(/\//g, '_').replace(/^_/, '') || 'home');

  const overallStatus = notes.some(n => n.includes('⛔')) ? 'FAIL' :
                        notes.some(n => n.includes('⚠️')) ? 'WARN' : 'PASS';
  log(route, overallStatus, notes);
}

async function checkLinks(page, route) {
  const url = BASE + route;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const links = await page.locator('a[href]').evaluateAll(els =>
    els.map(el => el.getAttribute('href')).filter(h => h && h.startsWith('/') && !h.startsWith('//_'))
  );
  const unique = [...new Set(links)];
  console.log(`\n📎 Internal links on ${route}:`);
  unique.slice(0, 20).forEach(l => console.log(`   ${l}`));
  return unique;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });

  // Inject dev bypass cookie
  await context.addCookies([{
    name: 'hive-dev-bypass',
    value: 'true',
    domain: 'localhost',
    path: '/'
  }]);

  const page = await context.newPage();

  console.log('\n🔍 HIVE Frontend Audit — ' + new Date().toISOString());
  console.log('══════════════════════════════════════\n');

  // --- AUTH ROUTES ---
  console.log('📋 AUTH FLOW');
  await checkRoute(page, '/enter');
  await checkRoute(page, '/auth/verify');

  // --- MAIN APP ROUTES ---
  console.log('\n📋 MAIN NAVIGATION');
  await checkRoute(page, '/discover', { checkNav: true });
  await checkRoute(page, '/events');
  await checkRoute(page, '/spaces');
  await checkRoute(page, '/me');
  await checkRoute(page, '/notifications');

  // --- HIVELAB ---
  console.log('\n📋 HIVELAB');
  await checkRoute(page, '/lab');
  await checkRoute(page, '/lab/templates');
  await checkRoute(page, '/lab/new');

  // --- SPACES ---
  console.log('\n📋 SPACES');
  await checkRoute(page, '/spaces');
  // Try a known space handle
  await checkRoute(page, '/s/ub-computer-science');
  await checkRoute(page, '/s/ub-greek-life');

  // --- TOOLS ---
  console.log('\n📋 TOOLS');
  await checkRoute(page, '/t/nonexistent-tool-test');

  // --- MOBILE VIEWPORT check on key routes ---
  console.log('\n📋 MOBILE VIEWPORT CHECK');
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 }); // iPhone 15 Pro

  const mobileRoutes = ['/discover', '/events', '/spaces', '/lab'];
  for (const r of mobileRoutes) {
    await mobile.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await mobile.waitForTimeout(1500);
    const file = path.join(OUT, `mobile_${r.replace(/\//g,'_').replace(/^_/,'')}.png`);
    await mobile.screenshot({ path: file, fullPage: false });
    // Check bottom nav exists on mobile
    const bottomNav = await mobile.locator('[class*="bottom"], [class*="tab-bar"], [class*="mobile-nav"]').count();
    console.log(`📱 ${r} — mobile bottom nav elements: ${bottomNav}`);
  }
  await mobile.close();

  // --- LINK DISCOVERY ---
  console.log('');
  await checkLinks(page, '/discover');

  // --- SUMMARY ---
  console.log('\n══════════════════════════════════════');
  console.log('📊 AUDIT SUMMARY');
  console.log('══════════════════════════════════════');
  const pass = results.filter(r => r.status === 'PASS').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  console.log(`✅ Pass: ${pass}  ⚠️ Warn: ${warn}  ❌ Fail: ${fail}`);
  console.log(`\nScreenshots saved to: ${OUT}`);

  if (fail > 0 || warn > 0) {
    console.log('\n🔥 Issues to fix:');
    results.filter(r => r.status !== 'PASS').forEach(r => {
      console.log(`  ${r.status === 'FAIL' ? '❌' : '⚠️'} ${r.route}`);
      r.notes.forEach(n => console.log(`     ${n}`));
    });
  }

  await browser.close();
}

main().catch(console.error);
