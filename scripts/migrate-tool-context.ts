/**
 * Migration Script: Add originalContext field to all existing tools
 *
 * This script adds the `originalContext` field (set to null) to all existing tools
 * in the Firestore database. This is a non-destructive migration that allows the
 * context gatekeeping system to work with both old and new tools.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-tool-context.ts
 *
 * Safety:
 * - Non-destructive: Only adds a nullable field
 * - Idempotent: Safe to run multiple times
 * - Rollback: Remove field if needed
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = require('../infrastructure/firebase/service-account.json');

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

interface MigrationStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function migrateToolContext() {
  console.log('🔄 Starting tool context migration...\n');

  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all tools
    console.log('📊 Fetching all tools from database...');
    const toolsSnapshot = await db.collection('tools').get();
    stats.total = toolsSnapshot.size;
    console.log(`✓ Found ${stats.total} tools\n`);

    if (stats.total === 0) {
      console.log('⚠️  No tools found. Nothing to migrate.');
      return stats;
    }

    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    const batches: FirebaseFirestore.WriteBatch[] = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    console.log('🔨 Processing tools...');
    for (const doc of toolsSnapshot.docs) {
      const data = doc.data();

      // Skip if originalContext already exists
      if (data.originalContext !== undefined) {
        stats.skipped++;
        console.log(`  ⏭️  Skipped ${doc.id} - already has originalContext`);
        continue;
      }

      try {
        // Add originalContext: null to tool
        currentBatch.update(doc.ref, {
          originalContext: null,
          updatedAt: FieldValue.serverTimestamp(),
        });

        batchCount++;
        stats.updated++;

        // Create new batch if we hit the limit
        if (batchCount >= batchSize) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          batchCount = 0;
        }

        // Log progress every 10 tools
        if (stats.updated % 10 === 0) {
          console.log(`  ✓ Processed ${stats.updated}/${stats.total} tools`);
        }
      } catch (error) {
        stats.errors++;
        console.error(`  ❌ Error processing tool ${doc.id}:`, error);
      }
    }

    // Add the final batch if it has any operations
    if (batchCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    console.log(`\n📝 Committing ${batches.length} batch(es) to Firestore...`);
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`  ✓ Committed batch ${i + 1}/${batches.length}`);
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📈 Migration Statistics:');
    console.log(`  Total tools: ${stats.total}`);
    console.log(`  Updated: ${stats.updated}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Errors: ${stats.errors}`);

    return stats;
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToolContext()
  .then((stats) => {
    console.log('\n✨ Migration script finished');
    process.exit(stats.errors > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
