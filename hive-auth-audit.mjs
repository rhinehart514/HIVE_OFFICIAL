import { chromium } from 'playwright';
import { SignJWT } from 'jose';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/hive-auth-screenshots';
fs.mkdirSync(OUT, { recursive: true });

const SESSION_SECRET = '1nAoYHV4mxtDZWBD3hkSwhCx4QycGYpqIKPBvP7wbb4=';

async function createDevJWT() {
  const secret = new TextEncoder().encode(SESSION_SECRET);
  const jwt = await new SignJWT({
    userId: 'dev-user-001',
    email: 'rhinehart514@gmail.com',
    campusId: 'ub-buffalo',
    isAdmin: false,
    onboardingCompleted: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secret);
  return jwt;
}

const results = [];
let idx = 0;

function log(route, status, notes = []) {
  results.push({ route, status, notes });
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${route}`);
  notes.forEach(n => console.log(`   → ${n}`));
}

async function shot(page, name) {
  const file = path.join(OUT, `${String(idx++).padStart(2,'0')}-${name.replace(/\//g,'_').replace(/^_/,'')}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function audit(page, route, opts = {}) {
  const notes = [];
  const jsErrors = [];
  const networkErrors = [];

  const errHandler = err => jsErrors.push(err.message.substring(0, 100));
  const consoleHandler = msg => {
    if (msg.type() === 'error') networkErrors.push(msg.text().substring(0, 100));
  };
  page.on('pageerror', errHandler);
  page.on('console', consoleHandler);

  let finalUrl;
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500); // animations + data load
    finalUrl = page.url();

    const status = resp?.status();
    if (status >= 400) {
      notes.push(`HTTP ${status}`);
      log(route, 'FAIL', notes);
      return;
    }
  } catch (e) {
    log(route, 'FAIL', [`Nav error: ${e.message.substring(0, 100)}`]);
    return;
  } finally {
    page.off('pageerror', errHandler);
    page.off('console', consoleHandler);
  }

  // Redirect check
  if (finalUrl !== BASE + route && !finalUrl.includes(route)) {
    notes.push(`Redirected → ${finalUrl.replace(BASE, '')}`);
  }

  // Crash check
  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (bodyText.includes('Application error') || bodyText.includes('Something went wrong')) {
    notes.push('⛔ App crash message visible');
  }
  if (bodyText.trim().length < 50) {
    notes.push('⚠️ Very little body text — possibly blank/empty page');
  }

  // Navigation check
  if (opts.checkNav) {
    const bottomNav = await page.locator('nav, [role="navigation"]').count();
    notes.push(`Nav elements: ${bottomNav}`);
  }

  // Check for key content presence
  if (opts.expectText) {
    for (const text of opts.expectText) {
      const found = await page.locator(`text=${text}`).count();
      if (!found) notes.push(`⚠️ Expected text not found: "${text}"`);
    }
  }

  // Error reports
  if (jsErrors.length) notes.push(`JS errors: ${jsErrors[0]}`);
  const relevantNetErrors = networkErrors.filter(e => !e.includes('favicon') && !e.includes('ERR_NAME_NOT_RESOLVED'));
  if (relevantNetErrors.length) notes.push(`Console errors: ${relevantNetErrors[0]}`);

  // Stuck loading
  const spinnerCount = await page.locator('[class*="animate-spin"], [class*="skeleton"]').count();
  if (spinnerCount > 5) notes.push(`⚠️ ${spinnerCount} loading indicators still visible`);

  await shot(page, route || 'root');

  const status = notes.some(n => n.includes('⛔')) ? 'FAIL'
    : notes.some(n => n.includes('⚠️')) ? 'WARN'
    : 'PASS';
  log(route, status, notes);
}

async function checkInteractions(page, route, label, interactFn) {
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  try {
    await interactFn(page);
    log(`${route} [${label}]`, 'PASS', ['Interaction succeeded']);
  } catch (e) {
    log(`${route} [${label}]`, 'WARN', [`Interaction failed: ${e.message.substring(0, 100)}`]);
  }
}

async function main() {
  console.log('🔐 Creating dev session JWT...');
  const jwt = await createDevJWT();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Inject session cookies
  await context.addCookies([
    { name: 'hive_session', value: jwt, domain: 'localhost', path: '/' },
    { name: 'hive_refresh', value: jwt, domain: 'localhost', path: '/' },
  ]);

  const page = await context.newPage();

  console.log('\n🔍 HIVE Authenticated Audit — ' + new Date().toISOString());
  console.log('══════════════════════════════════════\n');

  // ── LANDING (should redirect away since authenticated) ──────────────
  console.log('📋 LANDING / AUTH ROUTES (authenticated user)');
  await audit(page, '/');            // Should redirect to /discover
  await audit(page, '/enter');       // Should redirect away

  // ── MAIN APP ROUTES ──────────────────────────────────────────────────
  console.log('\n📋 CORE NAVIGATION');
  await audit(page, '/discover', { checkNav: true });
  await audit(page, '/spaces', { checkNav: true });
  await audit(page, '/me', { checkNav: true });
  await audit(page, '/notifications');

  // ── EVENTS (redirects to /discover?tab=events per middleware) ────────
  console.log('\n📋 EVENTS');
  await audit(page, '/events');

  // ── HIVELAB ──────────────────────────────────────────────────────────
  console.log('\n📋 HIVELAB');
  await audit(page, '/lab');
  await audit(page, '/lab/templates');
  await audit(page, '/lab/new');

  // ── SPACE ROUTES ─────────────────────────────────────────────────────
  console.log('\n📋 SPACE ROUTES');
  await audit(page, '/spaces');
  // Try a few space handles — these may 404 in dev
  await audit(page, '/s/ub-computer-science');
  await audit(page, '/s/ub-greek-life');

  // ── SETTINGS ─────────────────────────────────────────────────────────
  console.log('\n📋 SETTINGS');
  await audit(page, '/me/settings');
  await audit(page, '/me/edit');

  // ── REDIRECT RULES ───────────────────────────────────────────────────
  console.log('\n📋 REDIRECT RULES');
  await audit(page, '/browse');        // → /spaces
  await audit(page, '/explore');       // → /discover
  await audit(page, '/notifications/settings');  // → /me/settings?section=notifications
  await audit(page, '/hivelab');       // → /lab
  await audit(page, '/profile');       // → /me
  await audit(page, '/you');           // → /me

  // ── TOOL ROUTES ──────────────────────────────────────────────────────
  console.log('\n📋 TOOL ROUTES');
  await audit(page, '/t/nonexistent-tool-id-test');  // Should render graceful 404

  // ── MOBILE VIEWPORT ──────────────────────────────────────────────────
  console.log('\n📋 MOBILE (390px — iPhone 15 Pro)');
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });

  for (const r of ['/discover', '/spaces', '/lab', '/me']) {
    await mobile.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await mobile.waitForTimeout(2000);
    const mUrl = mobile.url().replace(BASE, '');
    const bodyLen = (await mobile.locator('body').innerText().catch(() => '')).trim().length;
    const file = path.join(OUT, `mobile_${r.replace(/\//g,'_').replace(/^_/,'')}.png`);
    await mobile.screenshot({ path: file, fullPage: false });
    const bottomNav = await mobile.locator('nav').count();
    console.log(`📱 ${r} → ${mUrl} | body chars: ${bodyLen} | nav: ${bottomNav}`);
  }
  await mobile.close();

  // ── INTERACTIONS ─────────────────────────────────────────────────────
  console.log('\n📋 KEY INTERACTIONS');

  // Test search/cmd-k
  await checkInteractions(page, '/discover', 'Cmd+K', async (p) => {
    await p.keyboard.press('Meta+k');
    await p.waitForTimeout(500);
    const modal = await p.locator('[role="dialog"], [class*="command"], [class*="search"]').count();
    if (!modal) throw new Error('No command palette appeared');
  });

  // Test space browse UI
  await checkInteractions(page, '/spaces', 'Space grid loads', async (p) => {
    const cards = await p.locator('[class*="card"], [class*="space-card"]').count();
    if (cards === 0) throw new Error('No space cards found');
  });

  // Test lab new prompt
  await checkInteractions(page, '/lab/new', 'AI prompt input', async (p) => {
    const input = await p.locator('textarea, input[placeholder*="Describe"], input[placeholder*="prompt"]').first();
    await input.fill('A poll for next meeting topic');
    await p.waitForTimeout(300);
  });

  // ── SUMMARY ──────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log('📊 AUDIT SUMMARY');
  console.log('══════════════════════════════════════');
  const pass = results.filter(r => r.status === 'PASS').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  console.log(`✅ Pass: ${pass}  ⚠️ Warn: ${warn}  ❌ Fail: ${fail}`);
  console.log(`Screenshots: ${OUT}`);

  if (fail + warn > 0) {
    console.log('\n🔥 Issues:');
    results.filter(r => r.status !== 'PASS').forEach(r => {
      console.log(`  ${r.status === 'FAIL' ? '❌' : '⚠️'} ${r.route}`);
      r.notes.forEach(n => console.log(`     ${n}`));
    });
  }

  await browser.close();
}

main().catch(console.error);
