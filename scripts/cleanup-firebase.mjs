#!/usr/bin/env node
/**
 * Firebase Cleanup Script
 *
 * Cleans up orphaned, stale, and test data from Firestore.
 * Run with --dry-run first to see what would be deleted.
 *
 * Usage:
 *   node scripts/cleanup-firebase.mjs --dry-run    # Preview changes
 *   node scripts/cleanup-firebase.mjs --execute    # Actually delete
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Parse args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run') || !args.includes('--execute');

if (DRY_RUN) {
  console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
  console.log('Run with --execute to actually delete data\n');
} else {
  console.log('\n⚠️  EXECUTE MODE - Data will be permanently deleted!\n');
}

// Load env from apps/web/.env.local
const envPath = './apps/web/.env.local';
let envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
} catch (e) {
  console.error('Could not read .env.local file');
  process.exit(1);
}

const projectId = envVars.FIREBASE_PROJECT_ID || envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
let privateKey = envVars.FIREBASE_PRIVATE_KEY;
const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;

if (!projectId) {
  console.error('Missing FIREBASE_PROJECT_ID in .env.local');
  process.exit(1);
}

// Handle private key (could be base64 encoded or raw with escaped newlines)
if (privateKeyBase64) {
  privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
} else if (privateKey) {
  // Handle escaped newlines in the key
  privateKey = privateKey.replace(/\\n/g, '\n');
  // Remove surrounding quotes if present
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
}

let credential = null;
if (clientEmail && privateKey) {
  try {
    credential = cert({ projectId, clientEmail, privateKey });
    console.log('Using service account credentials');
  } catch (e) {
    console.log('Service account error:', e.message);
    console.log('Falling back to default credentials');
  }
}

initializeApp(credential ? { credential, projectId } : { projectId });
const db = getFirestore();

const CAMPUS_ID = 'ub-buffalo';

// Stats tracking
const stats = {
  profiles: { checked: 0, deleted: 0 },
  spaces: { checked: 0, deleted: 0, duplicates: 0 },
  spaceMembers: { checked: 0, deleted: 0 },
  activityEvents: { checked: 0, deleted: 0 },
  presence: { checked: 0, deleted: 0 },
  messages: { checked: 0, deleted: 0 },
  tools: { checked: 0, deleted: 0 },
  deployedTools: { checked: 0, deleted: 0 },
};

/**
 * Delete a document (respects dry run)
 */
async function deleteDoc(ref, reason) {
  if (DRY_RUN) {
    console.log(`  Would delete: ${ref.path} (${reason})`);
    return true;
  } else {
    await ref.delete();
    console.log(`  Deleted: ${ref.path} (${reason})`);
    return true;
  }
}

/**
 * Delete documents in batches
 */
async function batchDelete(docs, reason, statKey) {
  const BATCH_SIZE = 500;
  let deleted = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    chunk.forEach(doc => {
      if (DRY_RUN) {
        console.log(`  Would delete: ${doc.ref.path} (${reason})`);
      } else {
        batch.delete(doc.ref);
      }
      deleted++;
    });

    if (!DRY_RUN && chunk.length > 0) {
      await batch.commit();
      console.log(`  Deleted batch of ${chunk.length} (${reason})`);
    }
  }

  stats[statKey].deleted += deleted;
  return deleted;
}

/**
 * 1. Clean up test/fake profiles
 */
async function cleanupProfiles() {
  console.log('\n📧 Checking profiles...');

  const snapshot = await db.collection('profiles').get();
  stats.profiles.checked = snapshot.size;

  const toDelete = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const email = data.email || '';

    // Test email patterns
    if (
      email.includes('test@') ||
      email.includes('@test.com') ||
      email.includes('@example.com') ||
      email.includes('fake@') ||
      email.startsWith('test') && email.includes('@')
    ) {
      toDelete.push(doc);
    }
  });

  if (toDelete.length > 0) {
    console.log(`  Found ${toDelete.length} test profiles`);
    await batchDelete(toDelete, 'test email', 'profiles');
  } else {
    console.log('  No test profiles found');
  }
}

/**
 * 2. Clean up duplicate spaces (same handle)
 */
async function cleanupDuplicateSpaces() {
  console.log('\n🏠 Checking for duplicate spaces...');

  const snapshot = await db.collection('spaces')
    .where('campusId', '==', CAMPUS_ID)
    .get();

  stats.spaces.checked = snapshot.size;
  console.log(`  Total spaces: ${snapshot.size}`);

  // Group by handle
  const handleMap = new Map();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const handle = (data.handle || data.name || '').toLowerCase().trim();
    if (!handleMap.has(handle)) {
      handleMap.set(handle, []);
    }
    handleMap.get(handle).push(doc);
  });

  // Find duplicates (keep the oldest one)
  const toDelete = [];
  handleMap.forEach((docs, handle) => {
    if (docs.length > 1) {
      // Sort by createdAt, keep oldest
      docs.sort((a, b) => {
        const aTime = a.data().createdAt?.toMillis?.() || 0;
        const bTime = b.data().createdAt?.toMillis?.() || 0;
        return aTime - bTime;
      });

      // Delete all but the first (oldest)
      for (let i = 1; i < docs.length; i++) {
        toDelete.push(docs[i]);
        stats.spaces.duplicates++;
      }
    }
  });

  if (toDelete.length > 0) {
    console.log(`  Found ${toDelete.length} duplicate spaces`);
    await batchDelete(toDelete, 'duplicate handle', 'spaces');
  } else {
    console.log('  No duplicate spaces found');
  }
}

/**
 * 3. Clean up orphaned spaceMembers (space doesn't exist)
 */
async function cleanupOrphanedMembers() {
  console.log('\n👥 Checking for orphaned space members...');

  // Get all valid space IDs
  const spacesSnapshot = await db.collection('spaces')
    .where('campusId', '==', CAMPUS_ID)
    .get();
  const validSpaceIds = new Set(spacesSnapshot.docs.map(d => d.id));

  // Check all members
  const membersSnapshot = await db.collection('spaceMembers')
    .where('campusId', '==', CAMPUS_ID)
    .get();

  stats.spaceMembers.checked = membersSnapshot.size;

  const toDelete = membersSnapshot.docs.filter(doc => {
    const spaceId = doc.data().spaceId;
    return !validSpaceIds.has(spaceId);
  });

  if (toDelete.length > 0) {
    console.log(`  Found ${toDelete.length} orphaned members`);
    await batchDelete(toDelete, 'space does not exist', 'spaceMembers');
  } else {
    console.log('  No orphaned members found');
  }
}

/**
 * 4. Clean up old activity events (>90 days)
 */
async function cleanupOldActivity() {
  console.log('\n📊 Checking for old activity events...');

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  try {
    // Try with compound query first
    const snapshot = await db.collection('activityEvents')
      .where('campusId', '==', CAMPUS_ID)
      .where('timestamp', '<', ninetyDaysAgo)
      .limit(5000)
      .get();

    stats.activityEvents.checked = snapshot.size;

    if (snapshot.size > 0) {
      console.log(`  Found ${snapshot.size} old activity events (>90 days)`);
      await batchDelete(snapshot.docs, 'older than 90 days', 'activityEvents');
    } else {
      console.log('  No old activity events found');
    }
  } catch (error) {
    if (error.message?.includes('index')) {
      console.log('  Skipping - requires Firestore index (not critical)');
    } else {
      throw error;
    }
  }
}

/**
 * 5. Clean up stale presence records (>24h)
 */
async function cleanupStalePresence() {
  console.log('\n🟢 Checking for stale presence records...');

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const snapshot = await db.collection('presence')
      .where('lastActive', '<', oneDayAgo)
      .limit(5000)
      .get();

    stats.presence.checked = snapshot.size;

    if (snapshot.size > 0) {
      console.log(`  Found ${snapshot.size} stale presence records (>24h)`);
      await batchDelete(snapshot.docs, 'stale >24h', 'presence');
    } else {
      console.log('  No stale presence records found');
    }
  } catch (error) {
    if (error.message?.includes('index')) {
      console.log('  Skipping - requires Firestore index (not critical)');
    } else {
      throw error;
    }
  }
}

/**
 * 6. Clean up orphaned deployed tools
 */
async function cleanupOrphanedDeployments() {
  console.log('\n🔧 Checking for orphaned tool deployments...');

  // Get all valid tool IDs
  const toolsSnapshot = await db.collection('tools')
    .where('campusId', '==', CAMPUS_ID)
    .get();
  const validToolIds = new Set(toolsSnapshot.docs.map(d => d.id));

  // Get all valid space IDs
  const spacesSnapshot = await db.collection('spaces')
    .where('campusId', '==', CAMPUS_ID)
    .get();
  const validSpaceIds = new Set(spacesSnapshot.docs.map(d => d.id));

  // Check deployments
  const deploymentsSnapshot = await db.collection('deployedTools')
    .where('campusId', '==', CAMPUS_ID)
    .get();

  stats.deployedTools.checked = deploymentsSnapshot.size;

  const toDelete = deploymentsSnapshot.docs.filter(doc => {
    const data = doc.data();
    const toolExists = validToolIds.has(data.toolId);
    const spaceExists = validSpaceIds.has(data.spaceId);
    return !toolExists || !spaceExists;
  });

  if (toDelete.length > 0) {
    console.log(`  Found ${toDelete.length} orphaned deployments`);
    await batchDelete(toDelete, 'tool or space missing', 'deployedTools');
  } else {
    console.log('  No orphaned deployments found');
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(50));

  const mode = DRY_RUN ? '(DRY RUN)' : '(EXECUTED)';
  console.log(`\nMode: ${mode}\n`);

  console.log('Collection        Checked    Deleted');
  console.log('-'.repeat(40));

  Object.entries(stats).forEach(([key, val]) => {
    if (val.checked > 0 || val.deleted > 0) {
      console.log(`${key.padEnd(18)}${String(val.checked).padEnd(10)}${val.deleted}`);
    }
  });

  const totalDeleted = Object.values(stats).reduce((sum, v) => sum + v.deleted, 0);
  console.log('-'.repeat(40));
  console.log(`${'TOTAL'.padEnd(18)}${' '.repeat(10)}${totalDeleted}`);

  if (DRY_RUN && totalDeleted > 0) {
    console.log('\n⚠️  Run with --execute to actually delete these items');
  }

  console.log('');
}

/**
 * Main
 */
async function main() {
  console.log('='.repeat(50));
  console.log('HIVE FIREBASE CLEANUP');
  console.log(`Campus: ${CAMPUS_ID}`);
  console.log(`Project: ${projectId}`);
  console.log('='.repeat(50));

  try {
    await cleanupProfiles();
    await cleanupDuplicateSpaces();
    await cleanupOrphanedMembers();
    await cleanupOldActivity();
    await cleanupStalePresence();
    await cleanupOrphanedDeployments();

    printSummary();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
