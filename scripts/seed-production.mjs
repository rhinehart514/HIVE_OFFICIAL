#!/usr/bin/env node
/**
 * Production Seed Runner
 *
 * Orchestrates all seeding operations for a production-ready HIVE deployment.
 * This script runs all necessary seeds in the correct order.
 *
 * Usage:
 *   node scripts/seed-production.mjs [--dry-run] [--campus ub-buffalo]
 *
 * Options:
 *   --dry-run     Preview all operations without writing
 *   --campus      Campus ID (default: ub-buffalo)
 *   --skip-orgs   Skip CampusLabs organization import
 *   --skip-events Skip event seeding
 *   --skip-tools  Skip tool template seeding
 *
 * Seeding Order:
 *   1. School configuration
 *   2. CampusLabs organizations (400+ spaces)
 *   3. CampusLabs events (from RSS)
 *   4. Demo events (fills gaps)
 *   5. Tool templates
 *
 * Prerequisites:
 *   - FIREBASE_SERVICE_ACCOUNT_KEY in apps/web/.env.local
 *   - Network access to CampusLabs API and RSS
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  CAMPUS_ID: 'ub-buffalo',
  SCHOOL_NAME: 'University at Buffalo',
  EMAIL_DOMAIN: 'buffalo.edu',
};

// =============================================================================
// Firebase Initialization
// =============================================================================

function initFirebase() {
  const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');

  if (!existsSync(envPath)) {
    console.error('❌ Missing .env.local file at:', envPath);
    console.error('   Please create it with FIREBASE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
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
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
    }

    const credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));
    initializeApp({
      credential: cert(credentials),
      projectId: 'hive-9265c'
    });

    return getFirestore();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// Script Runner
// =============================================================================

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Running: node ${scriptPath} ${args.join(' ')}`);
    console.log('─'.repeat(60));

    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// =============================================================================
// Direct Seeding Functions
// =============================================================================

async function seedSchool(db, campusId, dryRun) {
  console.log('\n📚 Step 1: Seeding school configuration...');

  const schoolData = {
    id: campusId,
    name: CONFIG.SCHOOL_NAME,
    shortName: 'UB',
    emailDomain: CONFIG.EMAIL_DOMAIN,
    features: {
      spaces: true,
      rituals: true,
      hiveLab: true,
      directMessages: true,
      events: true,
      search: true,
      notifications: true,
    },
    settings: {
      maxSpacesPerUser: 5,
      maxMembersPerSpace: 1000,
      requireEmailVerification: true,
      minimumAccountAgeDays: 7,
      allowSpaceCreation: true,
    },
    branding: {
      primaryColor: '#005BBB', // UB Blue
      accentColor: '#FFD200', // UB Gold
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (dryRun) {
    console.log('   [DRY RUN] Would create school:', schoolData.name);
    return;
  }

  const schoolRef = db.collection('schools').doc(campusId);
  const existing = await schoolRef.get();

  if (existing.exists) {
    console.log('   School already exists, updating...');
    await schoolRef.update({
      ...schoolData,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await schoolRef.set(schoolData);
  }

  console.log('   ✅ School configured:', CONFIG.SCHOOL_NAME);
}

// =============================================================================
// Verification Functions
// =============================================================================

async function verifySeeding(db, campusId) {
  console.log('\n🔍 Verifying seeded data...');

  // Count spaces
  const spacesSnapshot = await db.collection('spaces')
    .where('campusId', '==', campusId)
    .count()
    .get();
  const spaceCount = spacesSnapshot.data().count;

  // Count events
  const eventsSnapshot = await db.collection('events')
    .where('campusId', '==', campusId)
    .count()
    .get();
  const eventCount = eventsSnapshot.data().count;

  // Count tools
  const toolsSnapshot = await db.collection('tools')
    .where('campusId', '==', campusId)
    .where('isPublic', '==', true)
    .count()
    .get();
  const toolCount = toolsSnapshot.data().count;

  // Check school exists
  const schoolDoc = await db.collection('schools').doc(campusId).get();
  const schoolExists = schoolDoc.exists;

  // Space category breakdown
  const categoryBreakdown = {};
  const categoriesSnapshot = await db.collection('spaces')
    .where('campusId', '==', campusId)
    .select('category')
    .get();

  categoriesSnapshot.docs.forEach(doc => {
    const cat = doc.data().category || 'unknown';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  });

  return {
    schoolExists,
    spaceCount,
    eventCount,
    toolCount,
    categoryBreakdown,
  };
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const campusId = args.find(a => a.startsWith('--campus='))?.split('=')[1] || CONFIG.CAMPUS_ID;
  const skipOrgs = args.includes('--skip-orgs');
  const skipEvents = args.includes('--skip-events');
  const skipTools = args.includes('--skip-tools');

  console.log('='.repeat(60));
  console.log('🐝 HIVE Production Seed Runner');
  console.log('='.repeat(60));
  console.log(`Campus: ${campusId}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log(`Skip Orgs: ${skipOrgs}`);
  console.log(`Skip Events: ${skipEvents}`);
  console.log(`Skip Tools: ${skipTools}`);
  console.log('');

  const startTime = Date.now();
  const db = initFirebase();

  try {
    // Step 1: School configuration (always run)
    await seedSchool(db, campusId, dryRun);

    // Step 2: CampusLabs organizations
    if (!skipOrgs) {
      console.log('\n📦 Step 2: Importing CampusLabs organizations...');
      const scriptArgs = dryRun ? ['--dry-run'] : [];
      scriptArgs.push(`--campus=${campusId}`);
      await runScript('scripts/import-campuslabs.mjs', scriptArgs);
    } else {
      console.log('\n⏭️  Step 2: Skipping CampusLabs organizations (--skip-orgs)');
    }

    // Step 3: CampusLabs events
    if (!skipEvents) {
      console.log('\n📅 Step 3: Syncing CampusLabs events...');
      const scriptArgs = dryRun ? ['--dry-run'] : [];
      scriptArgs.push(`--campus=${campusId}`);
      await runScript('scripts/sync-campuslabs-events.mjs', scriptArgs);
    } else {
      console.log('\n⏭️  Step 3: Skipping CampusLabs events (--skip-events)');
    }

    // Step 4: Demo events (fills gaps)
    if (!skipEvents) {
      console.log('\n🎭 Step 4: Seeding demo events...');
      const scriptArgs = dryRun ? ['--dry-run'] : [];
      scriptArgs.push(`--campus=${campusId}`, '--count=50');
      await runScript('scripts/seed-demo-events.mjs', scriptArgs);
    } else {
      console.log('\n⏭️  Step 4: Skipping demo events (--skip-events)');
    }

    // Step 5: Tool templates
    if (!skipTools) {
      console.log('\n🔧 Step 5: Seeding tool templates...');
      // Tool templates script doesn't have dry-run support yet
      if (!dryRun) {
        await runScript('scripts/seed-tool-templates.mjs', []);
      } else {
        console.log('   [DRY RUN] Would seed tool templates');
      }
    } else {
      console.log('\n⏭️  Step 5: Skipping tool templates (--skip-tools)');
    }

    // Verification
    if (!dryRun) {
      const stats = await verifySeeding(db, campusId);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log('\n' + '='.repeat(60));
      console.log('✅ Production Seeding Complete');
      console.log('='.repeat(60));
      console.log(`
Summary:
  Campus: ${campusId}
  Duration: ${duration}s

Data Created:
  ✓ School: ${stats.schoolExists ? 'Configured' : 'Missing!'}
  ✓ Spaces: ${stats.spaceCount}
  ✓ Events: ${stats.eventCount}
  ✓ Public Tools: ${stats.toolCount}

Space Categories:
${Object.entries(stats.categoryBreakdown).map(([cat, count]) => `  - ${cat}: ${count}`).join('\n')}

Next Steps:
  1. Verify at: https://your-domain.com/spaces
  2. Test search functionality
  3. Create test user accounts
  4. Configure admin users in Firestore

Commands for ongoing maintenance:
  # Re-sync events from CampusLabs RSS
  node scripts/sync-campuslabs-events.mjs

  # Add more demo events
  node scripts/seed-demo-events.mjs --count=20
      `);
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('[DRY RUN] Production Seeding Preview Complete');
      console.log('='.repeat(60));
      console.log('\nRemove --dry-run to execute the seeding.');
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
