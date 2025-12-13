#!/usr/bin/env node
/**
 * Migrate existing spaces to add publishStatus: 'live'
 *
 * This script:
 * 1. Reads all existing spaces
 * 2. Adds 'publishStatus: live' to spaces that don't have it
 * 3. This makes them visible in the browse-v2 API
 *
 * Usage:
 *   node scripts/migrate-publish-status.mjs --dry-run    # Preview changes
 *   node scripts/migrate-publish-status.mjs              # Execute migration
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// =============================================================================
// Configuration
// =============================================================================

const ENV_PATH = './apps/web/.env.local';
const BATCH_SIZE = 400;

// =============================================================================
// Firebase Init
// =============================================================================

function initFirebase() {
  const envContent = readFileSync(ENV_PATH, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });

  // Try different credential methods
  const serviceAccountKey = envVars.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    const credentials = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
    initializeApp({
      credential: cert(credentials),
      projectId: credentials.project_id || 'hive-9265c'
    });
  } else {
    const projectId = envVars.FIREBASE_PROJECT_ID;
    const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
    const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId
    });
  }

  return getFirestore();
}

// =============================================================================
// Migration Logic
// =============================================================================

async function migratePublishStatus(db, dryRun = false) {
  console.log('='.repeat(70));
  console.log('PUBLISH STATUS MIGRATION');
  console.log('='.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

  const snapshot = await db.collection('spaces').get();
  console.log(`Total spaces to process: ${snapshot.size}\n`);

  const stats = {
    total: 0,
    updated: 0,
    alreadyHasStatus: 0,
    byCategory: {
      student_org: 0,
      university_org: 0,
      greek_life: 0,
      residential: 0,
      other: 0,
    }
  };

  const spacesToUpdate = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const category = data.category || 'other';

    stats.total++;

    // Track category distribution
    if (stats.byCategory[category] !== undefined) {
      stats.byCategory[category]++;
    } else {
      stats.byCategory.other++;
    }

    // Check if already has publishStatus
    if (data.publishStatus) {
      stats.alreadyHasStatus++;
      console.log(`  [SKIP] ${doc.id} - already has publishStatus: ${data.publishStatus}`);
      return;
    }

    // Only update active spaces
    if (data.isActive !== false && data.status !== 'inactive') {
      spacesToUpdate.push({
        id: doc.id,
        name: data.name,
        category: category,
      });
    }
  });

  console.log(`\nSpaces needing update: ${spacesToUpdate.length}`);
  console.log(`Spaces already with publishStatus: ${stats.alreadyHasStatus}`);
  console.log('\nCategory distribution:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  if (spacesToUpdate.length === 0) {
    console.log('\nNo spaces need updating!');
    return stats;
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Would update:');
    spacesToUpdate.slice(0, 20).forEach(s => {
      console.log(`  - ${s.id}: ${s.name} (${s.category})`);
    });
    if (spacesToUpdate.length > 20) {
      console.log(`  ... and ${spacesToUpdate.length - 20} more`);
    }
    return stats;
  }

  // Batch update
  console.log('\nUpdating spaces...');

  for (let i = 0; i < spacesToUpdate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchSpaces = spacesToUpdate.slice(i, i + BATCH_SIZE);

    batchSpaces.forEach(space => {
      const ref = db.collection('spaces').doc(space.id);
      batch.update(ref, {
        publishStatus: 'live',
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    stats.updated += batchSpaces.length;
    console.log(`  Updated batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batchSpaces.length} spaces`);
  }

  console.log(`\nMigration complete! Updated ${stats.updated} spaces.`);
  return stats;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    const db = initFirebase();
    await migratePublishStatus(db, dryRun);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

main();
