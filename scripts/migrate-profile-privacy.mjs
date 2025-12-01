#!/usr/bin/env node

/**
 * Migration Script: Profile Privacy + Bento Config
 *
 * This script migrates existing user documents to:
 * 1. Add 4-tier privacy level (privacySettings.level)
 * 2. Add default bento grid configuration (profileGrid)
 *
 * Usage:
 *   node scripts/migrate-profile-privacy.mjs --dry-run    # Preview changes
 *   node scripts/migrate-profile-privacy.mjs              # Execute migration
 *
 * Prerequisites:
 *   - Firebase Admin SDK credentials (GOOGLE_APPLICATION_CREDENTIALS or firebase emulator)
 *   - Run from project root: node scripts/migrate-profile-privacy.mjs
 */

import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Constants
const COLLECTION = 'users';
const BATCH_SIZE = 500;
const DEFAULT_PRIVACY_LEVEL = 'campus_only';

const DEFAULT_BENTO_GRID = {
  cards: [
    { id: 'friends', type: 'friends_network', position: { x: 0, y: 0 }, size: '2x2', visible: true },
    { id: 'spaces', type: 'spaces_hub', position: { x: 2, y: 0 }, size: '2x1', visible: true },
    { id: 'mutual', type: 'mutual_friends', position: { x: 2, y: 1 }, size: '2x1', visible: true },
    { id: 'streak', type: 'streak', position: { x: 0, y: 2 }, size: '1x1', visible: true },
    { id: 'rep', type: 'stats_rep', position: { x: 1, y: 2 }, size: '1x1', visible: true },
    { id: 'shared', type: 'shared_spaces', position: { x: 2, y: 2 }, size: '2x1', visible: true },
  ],
  mobileLayout: [
    { id: 'friends_m', type: 'friends_network', position: { x: 0, y: 0 }, size: '2x1', visible: true },
    { id: 'spaces_m', type: 'spaces_hub', position: { x: 0, y: 1 }, size: '2x1', visible: true },
    { id: 'streak_m', type: 'streak', position: { x: 0, y: 2 }, size: '1x1', visible: true },
    { id: 'rep_m', type: 'stats_rep', position: { x: 1, y: 2 }, size: '1x1', visible: true },
  ],
  lastModified: null,
};

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Initialize Firebase Admin
function initFirebase() {
  // Check if running against emulator
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('🔧 Using Firestore Emulator:', process.env.FIRESTORE_EMULATOR_HOST);
    admin.initializeApp({ projectId: 'hive-emulator' });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('🔐 Using service account credentials');
    admin.initializeApp();
  } else {
    console.error('❌ No Firebase credentials found.');
    console.error('   Set GOOGLE_APPLICATION_CREDENTIALS or FIRESTORE_EMULATOR_HOST');
    process.exit(1);
  }

  return admin.firestore();
}

// Determine updates needed for a user document
function getUpdatesForDoc(data) {
  const updates = {};

  // 1. Check privacy level
  const hasPrivacyLevel = data.privacySettings?.level != null;
  if (!hasPrivacyLevel) {
    const existingSettings = data.privacySettings || {};
    updates['privacySettings'] = {
      ...existingSettings,
      level: DEFAULT_PRIVACY_LEVEL,
      // Ensure field-level defaults exist
      showEmail: existingSettings.showEmail ?? false,
      showPhone: existingSettings.showPhone ?? false,
      showDorm: existingSettings.showDorm ?? true,
      showSchedule: existingSettings.showSchedule ?? false,
      showActivity: existingSettings.showActivity ?? true,
    };
  }

  // 2. Check bento grid
  const hasProfileGrid = data.profileGrid?.cards?.length > 0;
  if (!hasProfileGrid) {
    updates['profileGrid'] = DEFAULT_BENTO_GRID;
  }

  return updates;
}

// Main migration
async function migrate() {
  console.log('\n📦 Profile Privacy + Bento Migration');
  console.log('=====================================');
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '⚡ LIVE MIGRATION'}\n`);

  const db = initFirebase();
  const usersRef = db.collection(COLLECTION);

  // Get total count
  const countSnap = await usersRef.count().get();
  const totalUsers = countSnap.data().count;
  console.log(`📊 Total users: ${totalUsers}\n`);

  let processed = 0;
  let needsPrivacyUpdate = 0;
  let needsBentoUpdate = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches
  let lastDoc = null;

  while (true) {
    let query = usersRef.orderBy('__name__').limit(BATCH_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    const batch = db.batch();
    let batchUpdates = 0;

    for (const doc of snapshot.docs) {
      processed++;
      const data = doc.data();
      const updates = getUpdatesForDoc(data);

      if (Object.keys(updates).length === 0) {
        skipped++;
        if (isVerbose) console.log(`  ⏭️  ${doc.id}: No updates needed`);
        continue;
      }

      // Track what needs updating
      if (updates.privacySettings) needsPrivacyUpdate++;
      if (updates.profileGrid) needsBentoUpdate++;

      if (isDryRun) {
        if (isVerbose) {
          console.log(`  📝 ${doc.id}: Would update:`, Object.keys(updates).join(', '));
        }
      } else {
        batch.update(doc.ref, updates);
        batchUpdates++;
      }
    }

    // Commit batch
    if (!isDryRun && batchUpdates > 0) {
      try {
        await batch.commit();
        updated += batchUpdates;
      } catch (err) {
        console.error(`❌ Batch commit failed:`, err.message);
        errors += batchUpdates;
      }
    } else {
      updated += batchUpdates;
    }

    // Progress
    const pct = ((processed / totalUsers) * 100).toFixed(1);
    process.stdout.write(`\r  Processing: ${processed}/${totalUsers} (${pct}%)`);

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log('\n');

  // Summary
  console.log('📈 Migration Summary');
  console.log('====================');
  console.log(`  Total processed:    ${processed}`);
  console.log(`  Needs privacy:      ${needsPrivacyUpdate}`);
  console.log(`  Needs bento:        ${needsBentoUpdate}`);
  console.log(`  Updated:            ${isDryRun ? `${updated} (dry run)` : updated}`);
  console.log(`  Skipped (no-op):    ${skipped}`);
  console.log(`  Errors:             ${errors}`);
  console.log('');

  if (isDryRun) {
    console.log('💡 Run without --dry-run to apply changes');
  } else if (updated > 0) {
    console.log('✅ Migration complete!');
  } else {
    console.log('✅ No updates needed - all users already migrated');
  }
}

// Run
migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
