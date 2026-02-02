#!/usr/bin/env npx ts-node
/**
 * Space Lifecycle Migration Script (ADR-007)
 *
 * Migrates existing spaces to the new unified lifecycle state.
 * Computes lifecycleState from existing status, publishStatus, and activationStatus fields.
 *
 * Usage:
 *   npx ts-node apps/web/scripts/migrate-space-lifecycle.ts [--dry-run] [--limit N]
 *
 * Options:
 *   --dry-run   Print what would be changed without making changes
 *   --limit N   Only process N spaces (useful for testing)
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev',
  });
}

const db = admin.firestore();

// Lifecycle states matching the enum
type SpaceLifecycleState = 'seeded' | 'claimed' | 'pending' | 'live' | 'suspended' | 'archived';

interface SpaceData {
  id: string;
  status?: string;
  publishStatus?: string;
  activationStatus?: string;
  isActive?: boolean;
  createdBy?: string;
  lifecycleState?: string;
}

/**
 * Compute lifecycle state from legacy fields
 */
function computeLifecycleState(space: SpaceData): SpaceLifecycleState {
  // Already has lifecycle state - skip
  if (space.lifecycleState) {
    return space.lifecycleState as SpaceLifecycleState;
  }

  // Archived: inactive spaces
  if (space.isActive === false) {
    return 'archived';
  }

  // Live: published and open
  if (space.publishStatus === 'live' && space.activationStatus === 'open') {
    return 'live';
  }

  // Pending: gathering members
  if (space.activationStatus === 'gathering') {
    return 'pending';
  }

  // Claimed: has owner but not yet live
  if (space.status === 'claimed' || space.createdBy) {
    return 'claimed';
  }

  // Default: seeded (pre-seeded, unclaimed)
  return 'seeded';
}

async function migrateSpaces(options: { dryRun: boolean; limit?: number }) {
  console.log('🚀 Starting Space Lifecycle Migration...');
  console.log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (options.limit) {
    console.log(`   Limit: ${options.limit} spaces`);
  }
  console.log('');

  // Get all spaces
  let query: admin.firestore.Query = db.collection('spaces');
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  console.log(`📊 Found ${snapshot.size} spaces to process`);
  console.log('');

  const stats = {
    total: snapshot.size,
    skipped: 0,
    updated: 0,
    byState: {} as Record<SpaceLifecycleState, number>,
  };

  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as SpaceData;
    data.id = doc.id;

    // Skip if already migrated
    if (data.lifecycleState) {
      stats.skipped++;
      continue;
    }

    const newState = computeLifecycleState(data);
    stats.byState[newState] = (stats.byState[newState] || 0) + 1;

    if (options.dryRun) {
      console.log(`  [DRY] ${doc.id.slice(0, 8)}... → ${newState}`);
      console.log(`         status=${data.status}, publishStatus=${data.publishStatus}, activationStatus=${data.activationStatus}`);
    } else {
      batch.update(doc.ref, {
        lifecycleState: newState,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batchCount++;
      stats.updated++;

      // Commit every 500 updates (Firestore batch limit)
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  ✓ Committed batch of ${batchCount} updates`);
        batchCount = 0;
      }
    }
  }

  // Commit remaining updates
  if (!options.dryRun && batchCount > 0) {
    await batch.commit();
    console.log(`  ✓ Committed final batch of ${batchCount} updates`);
  }

  console.log('');
  console.log('📈 Migration Summary:');
  console.log(`   Total spaces: ${stats.total}`);
  console.log(`   Already migrated (skipped): ${stats.skipped}`);
  console.log(`   ${options.dryRun ? 'Would update' : 'Updated'}: ${stats.updated}`);
  console.log('');
  console.log('   By lifecycle state:');
  for (const [state, count] of Object.entries(stats.byState)) {
    console.log(`     ${state}: ${count}`);
  }
  console.log('');
  console.log(options.dryRun ? '✅ Dry run complete' : '✅ Migration complete');
}

// Parse CLI arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;

// Run migration
migrateSpaces({ dryRun, limit })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
