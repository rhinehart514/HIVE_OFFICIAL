#!/usr/bin/env npx ts-node
/**
 * Migration Script: Tool State to Sharded Architecture
 *
 * Migrates existing tool state from inline storage to sharded format:
 *   - Counters: From sharedState.counters to sharedState/counters/{key}/shards/shard_0
 *   - Collections: From sharedState.collections to sharedState/collections/{key}/{entityId}
 *
 * This script is IDEMPOTENT - safe to run multiple times.
 *
 * Usage:
 *   DRY_RUN=true pnpm tsx scripts/migrate-tool-state-to-sharded.ts  # Preview changes
 *   pnpm tsx scripts/migrate-tool-state-to-sharded.ts               # Execute migration
 *
 * @author HIVE Engineering
 * @version 1.0.0
 */

import * as admin from 'firebase-admin';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 100; // Firestore batch limit is 500, use 100 for safety

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  // Use service account if available, otherwise default credentials
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (serviceAccountPath) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Use default credentials (works in Cloud environments)
    admin.initializeApp();
  }
}

const db = admin.firestore();

// ============================================================================
// TYPES
// ============================================================================

interface MigrationStats {
  deploymentsProcessed: number;
  countersMigrated: number;
  collectionsMigrated: number;
  entitiesMigrated: number;
  errors: string[];
  skipped: number;
}

interface SharedStateDoc {
  counters?: Record<string, number>;
  collections?: Record<string, Record<string, unknown>>;
  timeline?: unknown[];
  computed?: Record<string, unknown>;
  version?: number;
  lastModified?: string;
  campusId?: string;
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

async function migrateCounters(
  deploymentId: string,
  counters: Record<string, number>,
  stats: MigrationStats
): Promise<void> {
  const basePath = `deployedTools/${deploymentId}/sharedState/counters`;

  for (const [counterKey, value] of Object.entries(counters)) {
    if (value === 0) continue; // Skip zero counters

    const safeKey = counterKey.replace(/:/g, '_');
    const shardPath = `${basePath}/${safeKey}/shards/shard_0`;

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create shard at ${shardPath} with value ${value}`);
    } else {
      // Check if shard already exists (idempotency)
      const existingShard = await db.doc(shardPath).get();
      if (existingShard.exists) {
        console.log(`  [SKIP] Shard already exists at ${shardPath}`);
        stats.skipped++;
        continue;
      }

      await db.doc(shardPath).set({
        value,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`  [MIGRATED] Counter ${counterKey} = ${value}`);
    }
    stats.countersMigrated++;
  }
}

async function migrateCollections(
  deploymentId: string,
  collections: Record<string, Record<string, unknown>>,
  stats: MigrationStats
): Promise<void> {
  const basePath = `deployedTools/${deploymentId}/sharedState/collections`;

  for (const [collectionKey, entities] of Object.entries(collections)) {
    const safeKey = collectionKey.replace(/:/g, '_');
    const collectionPath = `${basePath}/${safeKey}`;

    for (const [entityId, entityData] of Object.entries(entities)) {
      const entityPath = `${collectionPath}/${entityId}`;

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would create entity at ${entityPath}`);
      } else {
        // Check if entity already exists (idempotency)
        const existingEntity = await db.doc(entityPath).get();
        if (existingEntity.exists) {
          console.log(`  [SKIP] Entity already exists at ${entityPath}`);
          stats.skipped++;
          continue;
        }

        await db.doc(entityPath).set({
          ...(entityData as Record<string, unknown>),
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`  [MIGRATED] Entity ${collectionKey}/${entityId}`);
      }
      stats.entitiesMigrated++;
    }
    stats.collectionsMigrated++;
  }
}

async function processDeployment(
  deploymentId: string,
  stats: MigrationStats
): Promise<void> {
  const sharedStateRef = db.doc(`deployedTools/${deploymentId}/sharedState/current`);
  const sharedStateDoc = await sharedStateRef.get();

  if (!sharedStateDoc.exists) {
    console.log(`  No sharedState found for deployment ${deploymentId}`);
    return;
  }

  const data = sharedStateDoc.data() as SharedStateDoc;
  const counters = data.counters || {};
  const collections = data.collections || {};

  const counterCount = Object.keys(counters).length;
  const collectionCount = Object.keys(collections).length;
  const entityCount = Object.values(collections).reduce(
    (sum, coll) => sum + Object.keys(coll).length,
    0
  );

  if (counterCount === 0 && collectionCount === 0) {
    console.log(`  No data to migrate for deployment ${deploymentId}`);
    return;
  }

  console.log(`  Found ${counterCount} counters, ${collectionCount} collections, ${entityCount} entities`);

  // Migrate counters
  if (counterCount > 0) {
    await migrateCounters(deploymentId, counters, stats);
  }

  // Migrate collections
  if (collectionCount > 0) {
    await migrateCollections(deploymentId, collections, stats);
  }

  stats.deploymentsProcessed++;
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function runMigration(): Promise<void> {
  console.log('========================================');
  console.log('Tool State Migration: Inline → Sharded');
  console.log('========================================');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}`);
  console.log('');

  const stats: MigrationStats = {
    deploymentsProcessed: 0,
    countersMigrated: 0,
    collectionsMigrated: 0,
    entitiesMigrated: 0,
    errors: [],
    skipped: 0,
  };

  try {
    // Get all deployed tools
    console.log('Fetching deployed tools...');
    const deploymentsSnapshot = await db.collection('deployedTools').get();
    console.log(`Found ${deploymentsSnapshot.size} deployed tools\n`);

    for (const deploymentDoc of deploymentsSnapshot.docs) {
      const deploymentId = deploymentDoc.id;
      console.log(`Processing deployment: ${deploymentId}`);

      try {
        await processDeployment(deploymentId, stats);
      } catch (err) {
        const errorMsg = `Error processing ${deploymentId}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`  [ERROR] ${errorMsg}`);
        stats.errors.push(errorMsg);
      }

      console.log('');
    }

    // Print summary
    console.log('========================================');
    console.log('MIGRATION SUMMARY');
    console.log('========================================');
    console.log(`Deployments processed: ${stats.deploymentsProcessed}`);
    console.log(`Counters migrated: ${stats.countersMigrated}`);
    console.log(`Collections migrated: ${stats.collectionsMigrated}`);
    console.log(`Entities migrated: ${stats.entitiesMigrated}`);
    console.log(`Skipped (already migrated): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\nErrors:');
      stats.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made.');
      console.log('Run without DRY_RUN=true to execute the migration.');
    } else {
      console.log('\n✅ Migration complete!');
      console.log('\nNext steps:');
      console.log('1. Verify data in Firebase Console');
      console.log('2. Enable feature flags:');
      console.log('   USE_SHARDED_COUNTERS=true');
      console.log('   USE_EXTRACTED_COLLECTIONS=true');
      console.log('3. Monitor for any issues');
      console.log('4. After verification, you can delete inline data from sharedState/current');
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// ============================================================================
// CLEANUP FUNCTION (Optional - run after migration is verified)
// ============================================================================

async function cleanupInlineData(): Promise<void> {
  console.log('========================================');
  console.log('Cleanup: Remove Inline Data');
  console.log('========================================');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE CLEANUP'}`);
  console.log('');

  if (!DRY_RUN) {
    console.log('⚠️  WARNING: This will DELETE inline counters and collections from sharedState/current');
    console.log('Only run this AFTER verifying the migration worked correctly!\n');
  }

  const deploymentsSnapshot = await db.collection('deployedTools').get();
  let cleaned = 0;

  for (const deploymentDoc of deploymentsSnapshot.docs) {
    const sharedStateRef = db.doc(`deployedTools/${deploymentDoc.id}/sharedState/current`);
    const sharedStateDoc = await sharedStateRef.get();

    if (!sharedStateDoc.exists) continue;

    const data = sharedStateDoc.data() as SharedStateDoc;
    if (!data.counters && !data.collections) continue;

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would remove inline data from ${deploymentDoc.id}`);
    } else {
      await sharedStateRef.update({
        counters: admin.firestore.FieldValue.delete(),
        collections: admin.firestore.FieldValue.delete(),
      });
      console.log(`[CLEANED] Removed inline data from ${deploymentDoc.id}`);
    }
    cleaned++;
  }

  console.log(`\nCleaned: ${cleaned} deployments`);
}

// ============================================================================
// ENTRY POINT
// ============================================================================

const command = process.argv[2];

if (command === 'cleanup') {
  cleanupInlineData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
