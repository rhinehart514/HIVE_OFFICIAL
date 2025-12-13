#!/usr/bin/env node
/**
 * Migrate existing spaces to add trendingScore: 0
 *
 * This script:
 * 1. Reads all existing spaces
 * 2. Adds 'trendingScore: 0' to spaces that don't have it
 * 3. This allows the findTrending query to work properly
 *
 * Usage:
 *   node scripts/migrate-trending-score.mjs --dry-run    # Preview changes
 *   node scripts/migrate-trending-score.mjs              # Execute migration
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
  // Use default credentials (set via GOOGLE_APPLICATION_CREDENTIALS env var)
  initializeApp({ projectId: 'hive-9265c' });
  return getFirestore();
}

// =============================================================================
// Migration Logic
// =============================================================================

async function migrateTrendingScore(db, dryRun = false) {
  console.log('='.repeat(70));
  console.log('TRENDING SCORE MIGRATION');
  console.log('='.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

  const snapshot = await db.collection('spaces').get();
  console.log(`Total spaces to process: ${snapshot.size}\n`);

  const stats = {
    total: 0,
    needsTrendingScore: 0,
    needsMemberCount: 0,
    alreadyHasBoth: 0,
    updated: 0,
  };

  const spacesToUpdate = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    stats.total++;

    const hasTrendingScore = 'trendingScore' in data;
    const hasMemberCount = 'memberCount' in data;

    if (hasTrendingScore && hasMemberCount) {
      stats.alreadyHasBoth++;
      return;
    }

    const updates = {};
    if (!hasTrendingScore) {
      stats.needsTrendingScore++;
      updates.trendingScore = 0;
    }
    if (!hasMemberCount) {
      stats.needsMemberCount++;
      updates.memberCount = 0;
    }

    if (Object.keys(updates).length > 0) {
      spacesToUpdate.push({
        id: doc.id,
        name: data.name,
        updates,
      });
    }
  });

  console.log(`Spaces with both fields: ${stats.alreadyHasBoth}`);
  console.log(`Spaces needing trendingScore: ${stats.needsTrendingScore}`);
  console.log(`Spaces needing memberCount: ${stats.needsMemberCount}`);
  console.log(`Total spaces to update: ${spacesToUpdate.length}\n`);

  if (spacesToUpdate.length === 0) {
    console.log('No spaces need updating!');
    return stats;
  }

  if (dryRun) {
    console.log('[DRY RUN] Would update:');
    spacesToUpdate.slice(0, 10).forEach(s => {
      console.log(`  - ${s.id}: ${s.name} (adding: ${Object.keys(s.updates).join(', ')})`);
    });
    if (spacesToUpdate.length > 10) {
      console.log(`  ... and ${spacesToUpdate.length - 10} more`);
    }
    return stats;
  }

  // Batch update
  console.log('Updating spaces...');

  for (let i = 0; i < spacesToUpdate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchSpaces = spacesToUpdate.slice(i, i + BATCH_SIZE);

    batchSpaces.forEach(space => {
      const ref = db.collection('spaces').doc(space.id);
      batch.update(ref, {
        ...space.updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    stats.updated += batchSpaces.length;
    console.log(`  Updated batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batchSpaces.length} spaces (total: ${stats.updated})`);
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
    await migrateTrendingScore(db, dryRun);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

main();
