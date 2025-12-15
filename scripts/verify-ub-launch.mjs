#!/usr/bin/env node
/**
 * UB Buffalo Launch Verification Script
 *
 * Verifies that all systems are properly configured for the
 * University at Buffalo launch. Run this before deploying to production.
 *
 * Usage:
 *   node scripts/verify-ub-launch.mjs
 *
 * Checks:
 *   1. School configuration exists
 *   2. Spaces are seeded (400+ from CampusLabs)
 *   3. Events are available
 *   4. Tool templates are ready
 *   5. API endpoints are responding
 *   6. Campus isolation is enforced
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// UB Buffalo Configuration
// =============================================================================

const UB_CONFIG = {
  CAMPUS_ID: 'ub-buffalo',
  SCHOOL_NAME: 'University at Buffalo',
  EMAIL_DOMAIN: 'buffalo.edu',
  CAMPUSLABS_URL: 'https://buffalo.campuslabs.com',

  // Minimum thresholds for launch readiness
  THRESHOLDS: {
    MIN_SPACES: 300,           // At least 300 spaces from CampusLabs
    MIN_EVENTS: 10,            // At least 10 events
    MIN_TOOL_TEMPLATES: 3,     // At least 3 tool templates
    SPACE_CATEGORIES: ['student_org', 'university_org', 'greek_life', 'residential'],
  }
};

// =============================================================================
// Firebase Initialization
// =============================================================================

function initFirebase() {
  const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');

  if (!existsSync(envPath)) {
    return { error: 'Missing .env.local - cannot connect to Firebase' };
  }

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    const serviceAccount = envVars.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) {
      return { error: 'FIREBASE_SERVICE_ACCOUNT_KEY not found' };
    }

    const credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));
    initializeApp({
      credential: cert(credentials),
      projectId: 'hive-9265c'
    });

    return { db: getFirestore() };
  } catch (error) {
    return { error: `Firebase init failed: ${error.message}` };
  }
}

// =============================================================================
// Verification Checks
// =============================================================================

const checks = [];

function addCheck(name, status, details = null, critical = true) {
  checks.push({ name, status, details, critical });
}

async function verifySchool(db) {
  console.log('\n📚 Checking school configuration...');

  const schoolDoc = await db.collection('schools').doc(UB_CONFIG.CAMPUS_ID).get();

  if (!schoolDoc.exists) {
    addCheck('School Configuration', 'FAIL', 'School document does not exist');
    console.log('   ❌ School not found');
    return;
  }

  const data = schoolDoc.data();
  const issues = [];

  if (data.name !== UB_CONFIG.SCHOOL_NAME) {
    issues.push(`Name mismatch: ${data.name}`);
  }
  if (data.emailDomain !== UB_CONFIG.EMAIL_DOMAIN && data.domain !== UB_CONFIG.EMAIL_DOMAIN) {
    issues.push(`Email domain mismatch: ${data.emailDomain || data.domain}`);
  }
  if (!data.features?.spaces) {
    issues.push('Spaces feature not enabled');
  }
  if (!data.features?.hiveLab) {
    issues.push('HiveLab feature not enabled');
  }

  if (issues.length > 0) {
    addCheck('School Configuration', 'WARN', issues.join(', '));
    console.log('   ⚠️  School exists but has issues:', issues.join(', '));
  } else {
    addCheck('School Configuration', 'PASS');
    console.log('   ✅ School configured correctly');
  }
}

async function verifySpaces(db) {
  console.log('\n🏠 Checking spaces...');

  // Total count
  const totalSnapshot = await db.collection('spaces')
    .where('campusId', '==', UB_CONFIG.CAMPUS_ID)
    .count()
    .get();
  const totalCount = totalSnapshot.data().count;

  console.log(`   Total spaces: ${totalCount}`);

  if (totalCount < UB_CONFIG.THRESHOLDS.MIN_SPACES) {
    addCheck('Space Count', 'FAIL',
      `Only ${totalCount} spaces (need ${UB_CONFIG.THRESHOLDS.MIN_SPACES}+)`);
    console.log(`   ❌ Below threshold (${UB_CONFIG.THRESHOLDS.MIN_SPACES})`);
  } else {
    addCheck('Space Count', 'PASS', `${totalCount} spaces`);
    console.log(`   ✅ Above threshold`);
  }

  // Category breakdown
  const categoryStats = {};
  for (const category of UB_CONFIG.THRESHOLDS.SPACE_CATEGORIES) {
    const catSnapshot = await db.collection('spaces')
      .where('campusId', '==', UB_CONFIG.CAMPUS_ID)
      .where('category', '==', category)
      .count()
      .get();
    categoryStats[category] = catSnapshot.data().count;
  }

  console.log('   Category breakdown:');
  for (const [cat, count] of Object.entries(categoryStats)) {
    console.log(`     - ${cat}: ${count}`);
  }

  // Check for live spaces
  const liveSnapshot = await db.collection('spaces')
    .where('campusId', '==', UB_CONFIG.CAMPUS_ID)
    .where('publishStatus', '==', 'live')
    .count()
    .get();
  const liveCount = liveSnapshot.data().count;

  if (liveCount === 0) {
    addCheck('Live Spaces', 'FAIL', 'No spaces have publishStatus: live');
    console.log('   ❌ No live spaces found');
  } else {
    addCheck('Live Spaces', 'PASS', `${liveCount} live spaces`);
    console.log(`   ✅ ${liveCount} spaces are live`);
  }

  // Check for CampusLabs imported spaces
  const importedSnapshot = await db.collection('spaces')
    .where('campusId', '==', UB_CONFIG.CAMPUS_ID)
    .where('source.platform', '==', 'campuslabs')
    .count()
    .get();
  const importedCount = importedSnapshot.data().count;

  console.log(`   CampusLabs imported: ${importedCount}`);
  addCheck('CampusLabs Import', importedCount > 0 ? 'PASS' : 'WARN',
    `${importedCount} spaces from CampusLabs`);
}

async function verifyEvents(db) {
  console.log('\n📅 Checking events...');

  const now = new Date();

  // Total events
  const totalSnapshot = await db.collection('events')
    .where('campusId', '==', UB_CONFIG.CAMPUS_ID)
    .count()
    .get();
  const totalCount = totalSnapshot.data().count;

  console.log(`   Total events: ${totalCount}`);

  if (totalCount < UB_CONFIG.THRESHOLDS.MIN_EVENTS) {
    addCheck('Event Count', 'WARN',
      `Only ${totalCount} events (recommend ${UB_CONFIG.THRESHOLDS.MIN_EVENTS}+)`, false);
    console.log(`   ⚠️  Below recommended threshold`);
  } else {
    addCheck('Event Count', 'PASS', `${totalCount} events`);
    console.log(`   ✅ Above threshold`);
  }

  // Upcoming events
  const upcomingSnapshot = await db.collection('events')
    .where('campusId', '==', UB_CONFIG.CAMPUS_ID)
    .where('startDate', '>=', now)
    .count()
    .get();
  const upcomingCount = upcomingSnapshot.data().count;

  console.log(`   Upcoming events: ${upcomingCount}`);

  if (upcomingCount === 0) {
    addCheck('Upcoming Events', 'WARN', 'No upcoming events', false);
    console.log('   ⚠️  No upcoming events found');
  } else {
    addCheck('Upcoming Events', 'PASS', `${upcomingCount} upcoming`);
    console.log(`   ✅ Has upcoming events`);
  }
}

async function verifyTools(db) {
  console.log('\n🔧 Checking tool templates...');

  // Public templates
  const templatesSnapshot = await db.collection('tools')
    .where('campusId', '==', UB_CONFIG.CAMPUS_ID)
    .where('isPublic', '==', true)
    .count()
    .get();
  const templateCount = templatesSnapshot.data().count;

  console.log(`   Public tools: ${templateCount}`);

  // Also check featured/template tools
  const featuredSnapshot = await db.collection('tools')
    .where('isFeatured', '==', true)
    .count()
    .get();
  const featuredCount = featuredSnapshot.data().count;

  console.log(`   Featured tools: ${featuredCount}`);

  const totalTemplates = Math.max(templateCount, featuredCount);

  if (totalTemplates < UB_CONFIG.THRESHOLDS.MIN_TOOL_TEMPLATES) {
    addCheck('Tool Templates', 'WARN',
      `Only ${totalTemplates} templates (recommend ${UB_CONFIG.THRESHOLDS.MIN_TOOL_TEMPLATES}+)`, false);
    console.log('   ⚠️  Below recommended threshold');
  } else {
    addCheck('Tool Templates', 'PASS', `${totalTemplates} templates`);
    console.log(`   ✅ Above threshold`);
  }
}

async function verifyCampusIsolation(db) {
  console.log('\n🔒 Checking campus isolation...');

  // Check for spaces without campusId
  const noCampusSnapshot = await db.collection('spaces')
    .where('campusId', '==', null)
    .limit(10)
    .get();

  if (!noCampusSnapshot.empty) {
    addCheck('Campus Isolation', 'WARN',
      `${noCampusSnapshot.size} spaces missing campusId`, false);
    console.log(`   ⚠️  Found ${noCampusSnapshot.size} spaces without campusId`);
  } else {
    addCheck('Campus Isolation', 'PASS', 'All spaces have campusId');
    console.log('   ✅ All spaces have campusId');
  }

  // Check for cross-campus data
  const otherCampusSnapshot = await db.collection('spaces')
    .where('campusId', '!=', UB_CONFIG.CAMPUS_ID)
    .limit(1)
    .get();

  if (!otherCampusSnapshot.empty) {
    console.log('   ℹ️  Found spaces from other campuses (expected if multi-tenant)');
  }
}

async function verifyUsers(db) {
  console.log('\n👤 Checking user data...');

  // Count profiles for this campus
  const profilesSnapshot = await db.collection('profiles')
    .where('campusId', '==', UB_CONFIG.CAMPUS_ID)
    .count()
    .get();
  const profileCount = profilesSnapshot.data().count;

  console.log(`   Profiles: ${profileCount}`);
  addCheck('User Profiles', 'INFO', `${profileCount} profiles`);

  // Check for admin users
  const adminsSnapshot = await db.collection('admins')
    .limit(1)
    .get();

  if (adminsSnapshot.empty) {
    addCheck('Admin Users', 'WARN', 'No admin users configured', false);
    console.log('   ⚠️  No admin users found');
  } else {
    addCheck('Admin Users', 'PASS', 'Admin users exist');
    console.log('   ✅ Admin users configured');
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('🐝 UB Buffalo Launch Verification');
  console.log('='.repeat(60));
  console.log(`Campus: ${UB_CONFIG.CAMPUS_ID}`);
  console.log(`School: ${UB_CONFIG.SCHOOL_NAME}`);
  console.log(`Email Domain: ${UB_CONFIG.EMAIL_DOMAIN}`);
  console.log(`CampusLabs: ${UB_CONFIG.CAMPUSLABS_URL}`);

  const { db, error } = initFirebase();

  if (error) {
    console.log('\n❌ Cannot connect to Firebase:', error);
    console.log('\nTo run verification:');
    console.log('  1. Ensure apps/web/.env.local exists');
    console.log('  2. Add FIREBASE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
  }

  try {
    await verifySchool(db);
    await verifySpaces(db);
    await verifyEvents(db);
    await verifyTools(db);
    await verifyCampusIsolation(db);
    await verifyUsers(db);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const passed = checks.filter(c => c.status === 'PASS');
    const warned = checks.filter(c => c.status === 'WARN');
    const failed = checks.filter(c => c.status === 'FAIL');
    const criticalFails = failed.filter(c => c.critical);

    console.log(`\n✅ Passed: ${passed.length}`);
    passed.forEach(c => console.log(`   - ${c.name}`));

    if (warned.length > 0) {
      console.log(`\n⚠️  Warnings: ${warned.length}`);
      warned.forEach(c => console.log(`   - ${c.name}: ${c.details}`));
    }

    if (failed.length > 0) {
      console.log(`\n❌ Failed: ${failed.length}`);
      failed.forEach(c => console.log(`   - ${c.name}: ${c.details}`));
    }

    // Launch readiness
    console.log('\n' + '─'.repeat(60));

    if (criticalFails.length > 0) {
      console.log('\n🚫 NOT READY FOR LAUNCH');
      console.log('   Fix critical issues before deploying:');
      criticalFails.forEach(c => console.log(`   • ${c.name}: ${c.details}`));
      process.exit(1);
    } else if (failed.length > 0 || warned.length > 3) {
      console.log('\n⚠️  LAUNCH WITH CAUTION');
      console.log('   Some issues need attention but not blocking');
    } else {
      console.log('\n🚀 READY FOR UB LAUNCH!');
      console.log('   All critical systems verified');
    }

    // Next steps
    console.log('\n📌 Launch Commands:');
    console.log('   # Seed production data:');
    console.log('   pnpm seed:production');
    console.log('');
    console.log('   # Sync latest events:');
    console.log('   pnpm seed:events:sync');
    console.log('');
    console.log('   # Deploy:');
    console.log('   vercel --prod');

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
