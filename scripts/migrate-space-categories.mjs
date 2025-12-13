#!/usr/bin/env node
/**
 * Migrate existing Firestore spaces from 'type' field to 'category' field
 *
 * This script:
 * 1. Reads all existing spaces
 * 2. Maps old type values to new canonical categories
 * 3. Adds 'category' field while keeping 'type' for backwards compatibility
 * 4. Optionally matches against CampusLabs data to add source tracking
 *
 * Usage:
 *   node scripts/migrate-space-categories.mjs --dry-run    # Preview changes
 *   node scripts/migrate-space-categories.mjs              # Execute migration
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// =============================================================================
// Configuration
// =============================================================================

const ENV_PATH = './apps/web/.env.local';

// Mapping from old type values to new canonical categories
const TYPE_TO_CATEGORY = {
  'student_organization': 'student_org',
  'student_organizations': 'student_org',
  'university_organization': 'university_org',
  'university_organizations': 'university_org',
  'greek_life': 'greek_life',
  'residential': 'residential',
  'residential_spaces': 'residential',
  // Legacy values that might exist
  'student_org': 'student_org',
  'university_org': 'university_org',
};

const CANONICAL_CATEGORIES = ['student_org', 'university_org', 'greek_life', 'residential'];

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

  const projectId = envVars.FIREBASE_PROJECT_ID;
  const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
  const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId
  });

  return getFirestore();
}

// =============================================================================
// Migration Logic
// =============================================================================

async function migrateSpaces(db, dryRun = false) {
  console.log('='.repeat(70));
  console.log('SPACE CATEGORY MIGRATION');
  console.log('='.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

  const snapshot = await db.collection('spaces').get();
  console.log(`Total spaces to process: ${snapshot.size}\n`);

  const stats = {
    alreadyMigrated: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    byCategory: {},
  };

  const updates = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const docId = doc.id;
    const name = data.name || docId;

    // Determine the correct category
    let targetCategory = null;

    // Check if already has correct category
    if (data.category && CANONICAL_CATEGORIES.includes(data.category)) {
      stats.alreadyMigrated++;
      stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
      continue;
    }

    // Map from type field
    if (data.type && TYPE_TO_CATEGORY[data.type]) {
      targetCategory = TYPE_TO_CATEGORY[data.type];
    } else if (data.type) {
      // Unknown type - log and skip
      console.log(`  ⚠️  Unknown type "${data.type}" for "${name}" - skipping`);
      stats.skipped++;
      continue;
    } else {
      // No type field - default to student_org
      console.log(`  ⚠️  No type field for "${name}" - defaulting to student_org`);
      targetCategory = 'student_org';
    }

    stats.byCategory[targetCategory] = (stats.byCategory[targetCategory] || 0) + 1;

    // Prepare update
    const updateData = {
      category: targetCategory,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Add claimStatus if not present
    if (!data.claimStatus) {
      updateData.claimStatus = 'unclaimed';
    }

    // Normalize visibility field
    if (!data.visibility) {
      updateData.visibility = data.isPrivate ? 'private' : 'public';
    }

    updates.push({ docId, name, targetCategory, updateData });
  }

  console.log(`\nPrepared ${updates.length} updates:\n`);

  // Show sample updates
  console.log('--- SAMPLE UPDATES (first 5) ---');
  updates.slice(0, 5).forEach(u => {
    console.log(`  ${u.name}: → ${u.targetCategory}`);
  });
  if (updates.length > 5) {
    console.log(`  ... and ${updates.length - 5} more\n`);
  }

  // Execute updates
  if (!dryRun && updates.length > 0) {
    console.log('Executing updates...');

    // Process in batches of 400 (Firestore limit is 500)
    const batchSize = 400;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = db.batch();
      const batchUpdates = updates.slice(i, i + batchSize);

      for (const { docId, updateData } of batchUpdates) {
        const ref = db.collection('spaces').doc(docId);
        batch.update(ref, updateData);
      }

      await batch.commit();
      stats.migrated += batchUpdates.length;
      console.log(`  Committed batch ${Math.floor(i / batchSize) + 1}: ${batchUpdates.length} docs`);
    }
  } else if (dryRun) {
    stats.migrated = updates.length; // Would be migrated
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Already had correct category: ${stats.alreadyMigrated}`);
  console.log(`${dryRun ? 'Would migrate' : 'Migrated'}: ${stats.migrated}`);
  console.log(`Skipped (unknown type): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('\nBy category:');
  Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  if (dryRun) {
    console.log('\n[DRY RUN] No changes made. Remove --dry-run to execute.');
  }

  return stats;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const db = initFirebase();
  await migrateSpaces(db, dryRun);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  });
