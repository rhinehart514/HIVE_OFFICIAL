#!/usr/bin/env node

/**
 * Migrate spaceMembers to Composite Key Format
 *
 * This script migrates legacy spaceMembers documents (auto-generated IDs)
 * to the new composite key format: {spaceId}_{userId}
 *
 * Benefits of composite keys:
 * - O(1) document lookup vs O(n) query
 * - Enforces uniqueness at document ID level
 * - Faster permission checks
 * - Firestore security rules can use exists() with predictable path
 *
 * Usage:
 *   node scripts/migrate-space-members-composite-keys.mjs --dry-run
 *   node scripts/migrate-space-members-composite-keys.mjs --execute
 *   node scripts/migrate-space-members-composite-keys.mjs --execute --campus=ub-buffalo
 *
 * Options:
 *   --dry-run    Preview changes without writing
 *   --execute    Actually perform the migration
 *   --campus=X   Only migrate documents for a specific campus
 *   --limit=N    Limit number of documents to process (default: 1000)
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || !args.includes('--execute');
const campusArg = args.find(a => a.startsWith('--campus='));
const targetCampus = campusArg ? campusArg.split('=')[1] : null;
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 1000;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Initialize Firebase Admin
function initFirebase() {
  // Try to find service account key
  const possiblePaths = [
    join(process.cwd(), 'infrastructure/firebase/hive-campus-firebase-adminsdk.json'),
    join(process.cwd(), 'serviceAccountKey.json'),
    join(process.cwd(), '.secrets/firebase-admin.json')
  ];

  let serviceAccountPath = null;
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      serviceAccountPath = p;
      break;
    }
  }

  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    log(`Using service account from: ${serviceAccountPath}`, 'dim');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    log('Using GOOGLE_APPLICATION_CREDENTIALS', 'dim');
  } else {
    log('No service account found. Set GOOGLE_APPLICATION_CREDENTIALS or add serviceAccountKey.json', 'red');
    process.exit(1);
  }

  return admin.firestore();
}

async function migrateSpaceMembers(db) {
  log('\n📦 Space Members Composite Key Migration', 'cyan');
  log('=========================================\n');

  if (isDryRun) {
    log('🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
  } else {
    log('⚠️  EXECUTE MODE - Changes will be written to Firestore\n', 'red');
  }

  // Query for legacy documents (those without composite key format in ID)
  let query = db.collection('spaceMembers').limit(limit);

  if (targetCampus) {
    query = query.where('campusId', '==', targetCampus);
    log(`Filtering by campus: ${targetCampus}`, 'dim');
  }

  const snapshot = await query.get();
  log(`Found ${snapshot.size} documents to check\n`);

  const stats = {
    alreadyMigrated: 0,
    needsMigration: 0,
    migrated: 0,
    errors: 0,
    duplicatesSkipped: 0
  };

  const toMigrate = [];

  // First pass: identify documents needing migration
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentId = doc.id;
    const expectedId = `${data.spaceId}_${data.userId}`;

    if (currentId === expectedId) {
      stats.alreadyMigrated++;
      continue;
    }

    // Validate required fields
    if (!data.spaceId || !data.userId) {
      log(`⚠️  Skipping ${currentId}: missing spaceId or userId`, 'yellow');
      stats.errors++;
      continue;
    }

    toMigrate.push({
      oldId: currentId,
      newId: expectedId,
      data: data,
      ref: doc.ref
    });
    stats.needsMigration++;
  }

  log(`\n📊 Analysis Complete:`);
  log(`   Already migrated: ${stats.alreadyMigrated}`, 'green');
  log(`   Needs migration:  ${stats.needsMigration}`, 'yellow');

  if (stats.needsMigration === 0) {
    log('\n✅ All documents are already using composite keys!', 'green');
    return stats;
  }

  if (isDryRun) {
    log('\n📋 Documents that would be migrated:', 'cyan');
    for (const item of toMigrate.slice(0, 10)) {
      log(`   ${item.oldId} → ${item.newId}`, 'dim');
    }
    if (toMigrate.length > 10) {
      log(`   ... and ${toMigrate.length - 10} more`, 'dim');
    }
    log('\nRun with --execute to apply changes', 'yellow');
    return stats;
  }

  // Execute migration in batches
  log('\n🚀 Starting migration...', 'cyan');
  const batchSize = 500; // Firestore batch limit

  for (let i = 0; i < toMigrate.length; i += batchSize) {
    const batch = db.batch();
    const batchItems = toMigrate.slice(i, i + batchSize);

    for (const item of batchItems) {
      // Check if target document already exists
      const targetDoc = await db.collection('spaceMembers').doc(item.newId).get();

      if (targetDoc.exists) {
        log(`⚠️  Duplicate: ${item.newId} already exists, skipping ${item.oldId}`, 'yellow');
        stats.duplicatesSkipped++;
        // Delete the legacy document since the new one exists
        batch.delete(item.ref);
        continue;
      }

      // Create new document with composite key
      const newRef = db.collection('spaceMembers').doc(item.newId);
      batch.set(newRef, {
        ...item.data,
        migratedFrom: item.oldId,
        migratedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Delete old document
      batch.delete(item.ref);
      stats.migrated++;
    }

    try {
      await batch.commit();
      log(`   Batch ${Math.floor(i / batchSize) + 1}: migrated ${batchItems.length} documents`, 'green');
    } catch (error) {
      log(`   Batch ${Math.floor(i / batchSize) + 1}: ERROR - ${error.message}`, 'red');
      stats.errors += batchItems.length;
      stats.migrated -= batchItems.length;
    }
  }

  log('\n📊 Migration Complete:', 'cyan');
  log(`   Migrated:         ${stats.migrated}`, 'green');
  log(`   Already migrated: ${stats.alreadyMigrated}`, 'green');
  log(`   Duplicates merged: ${stats.duplicatesSkipped}`, 'yellow');
  log(`   Errors:           ${stats.errors}`, stats.errors > 0 ? 'red' : 'green');

  return stats;
}

async function verifyMigration(db) {
  log('\n🔍 Verifying migration...', 'cyan');

  const snapshot = await db.collection('spaceMembers').limit(100).get();

  let legacyCount = 0;
  let compositeCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const expectedId = `${data.spaceId}_${data.userId}`;

    if (doc.id === expectedId) {
      compositeCount++;
    } else {
      legacyCount++;
    }
  }

  log(`   Composite key format: ${compositeCount}`, 'green');
  log(`   Legacy format:        ${legacyCount}`, legacyCount > 0 ? 'yellow' : 'green');

  if (legacyCount === 0) {
    log('\n✅ All checked documents use composite keys!', 'green');
  } else {
    log(`\n⚠️  ${legacyCount} documents still need migration`, 'yellow');
  }
}

// Main execution
async function main() {
  try {
    const db = initFirebase();
    await migrateSpaceMembers(db);
    await verifyMigration(db);

    log('\n✨ Done!', 'green');
    process.exit(0);
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
