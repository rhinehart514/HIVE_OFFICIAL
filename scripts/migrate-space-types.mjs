#!/usr/bin/env node
/**
 * Space Type Migration Script
 *
 * Migrates Firestore space documents from legacy category values to canonical values:
 * - student_org → student_organizations
 * - university_org → university_organizations
 * - residential → campus_living
 * - greek_life_spaces → greek_life
 * - residential_spaces → campus_living
 *
 * Usage:
 *   node scripts/migrate-space-types.mjs --dry-run     # Preview changes
 *   node scripts/migrate-space-types.mjs              # Execute migration
 *
 * Options:
 *   --dry-run     Preview what would be migrated without writing
 *   --campus      Campus ID filter (default: all)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Legacy to Canonical Mapping
// =============================================================================

const CATEGORY_MIGRATION_MAP = {
  // Old DDD value object names (short form)
  'student_org': 'student_organizations',
  'university_org': 'university_organizations',
  'residential': 'campus_living',

  // Admin UI names (with _spaces suffix)
  'university_spaces': 'university_organizations',
  'residential_spaces': 'campus_living',
  'greek_life_spaces': 'greek_life',
  'student_spaces': 'student_organizations',

  // Old type field values
  'student_organization': 'student_organizations',
  'university_organization': 'university_organizations',
};

// =============================================================================
// Firebase Initialization
// =============================================================================

function initFirebase() {
  const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });

    const projectId = envVars.FIREBASE_PROJECT_ID || envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
    let privateKey = envVars.FIREBASE_PRIVATE_KEY;
    const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;

    if (privateKeyBase64) {
      privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    } else if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase credentials');
    }

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId
    });

    console.log(`Connected to Firebase project: ${projectId}`);
    return getFirestore();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// Migration Logic
// =============================================================================

async function migrateSpaceTypes(db, options = {}) {
  const { dryRun = false, campusId = null } = options;

  console.log('='.repeat(70));
  console.log('SPACE TYPE MIGRATION');
  console.log('='.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (campusId) console.log(`Campus filter: ${campusId}`);
  console.log('');

  // Fetch all spaces
  let query = db.collection('spaces');
  if (campusId) {
    query = query.where('campusId', '==', campusId);
  }

  const spacesSnapshot = await query.get();
  console.log(`Found ${spacesSnapshot.size} spaces to check\n`);

  const stats = {
    checked: 0,
    migrated: 0,
    alreadyCanonical: 0,
    errors: 0,
    byOldValue: {},
    byNewValue: {},
  };

  const spacesToMigrate = [];

  // Analyze spaces
  for (const doc of spacesSnapshot.docs) {
    const data = doc.data();
    stats.checked++;

    // Check both category and type fields
    const currentCategory = data.category;
    const currentType = data.type;

    let needsMigration = false;
    let newCategory = currentCategory;
    let newType = currentType;

    // Check if category needs migration
    if (currentCategory && CATEGORY_MIGRATION_MAP[currentCategory]) {
      newCategory = CATEGORY_MIGRATION_MAP[currentCategory];
      needsMigration = true;
      stats.byOldValue[currentCategory] = (stats.byOldValue[currentCategory] || 0) + 1;
    }

    // Check if type needs migration
    if (currentType && CATEGORY_MIGRATION_MAP[currentType]) {
      newType = CATEGORY_MIGRATION_MAP[currentType];
      needsMigration = true;
      stats.byOldValue[currentType] = (stats.byOldValue[currentType] || 0) + 1;
    }

    // Unify type to match category for consistency
    if (newCategory && newType !== newCategory) {
      newType = newCategory;
      needsMigration = true;
    }

    if (needsMigration) {
      spacesToMigrate.push({
        id: doc.id,
        name: data.name,
        oldCategory: currentCategory,
        oldType: currentType,
        newCategory,
        newType,
      });
      stats.byNewValue[newCategory] = (stats.byNewValue[newCategory] || 0) + 1;
    } else {
      stats.alreadyCanonical++;
    }
  }

  // Report analysis
  console.log('--- ANALYSIS RESULTS ---');
  console.log(`  Already canonical: ${stats.alreadyCanonical}`);
  console.log(`  Need migration: ${spacesToMigrate.length}`);
  console.log('');

  if (Object.keys(stats.byOldValue).length > 0) {
    console.log('--- OLD VALUES FOUND ---');
    Object.entries(stats.byOldValue).forEach(([value, count]) => {
      console.log(`  ${value}: ${count}`);
    });
    console.log('');
  }

  if (Object.keys(stats.byNewValue).length > 0) {
    console.log('--- WILL MIGRATE TO ---');
    Object.entries(stats.byNewValue).forEach(([value, count]) => {
      console.log(`  ${value}: ${count}`);
    });
    console.log('');
  }

  // Show samples
  if (spacesToMigrate.length > 0) {
    console.log('--- SAMPLE MIGRATIONS (first 10) ---');
    spacesToMigrate.slice(0, 10).forEach(space => {
      console.log(`  "${space.name}"`);
      console.log(`    category: ${space.oldCategory} → ${space.newCategory}`);
      if (space.oldType !== space.newType) {
        console.log(`    type: ${space.oldType} → ${space.newType}`);
      }
    });
    console.log('');
  }

  // Execute migration
  if (!dryRun && spacesToMigrate.length > 0) {
    console.log('--- EXECUTING MIGRATION ---');

    const BATCH_SIZE = 400;
    let migrated = 0;

    for (let i = 0; i < spacesToMigrate.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchSpaces = spacesToMigrate.slice(i, i + BATCH_SIZE);

      for (const space of batchSpaces) {
        const ref = db.collection('spaces').doc(space.id);
        const updateData = {
          category: space.newCategory,
          type: space.newType,
          updatedAt: FieldValue.serverTimestamp(),
          _migrationNote: `Migrated from ${space.oldCategory}/${space.oldType} at ${new Date().toISOString()}`,
        };
        batch.update(ref, updateData);
      }

      await batch.commit();
      migrated += batchSpaces.length;
      console.log(`  Migrated ${migrated}/${spacesToMigrate.length}...`);
    }

    stats.migrated = migrated;
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Checked: ${stats.checked}`);
  console.log(`Already canonical: ${stats.alreadyCanonical}`);
  console.log(`Need migration: ${spacesToMigrate.length}`);

  if (!dryRun) {
    console.log(`Migrated: ${stats.migrated}`);
    console.log(`Errors: ${stats.errors}`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] No changes made. Remove --dry-run to execute migration.');
  }

  return stats;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const campusId = args.find(a => a.startsWith('--campus='))?.split('=')[1] || null;

  const db = initFirebase();
  await migrateSpaceTypes(db, { dryRun, campusId });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
