#!/usr/bin/env node
/**
 * Backup and Clean Spaces Script
 *
 * 1. Exports all spaces to a JSON file (backup)
 * 2. Optionally deletes all spaces from Firestore
 * 3. Re-imports spaces with corrected canonical schema values
 *
 * Usage:
 *   node scripts/backup-and-clean-spaces.mjs --backup          # Just backup
 *   node scripts/backup-and-clean-spaces.mjs --clean           # Clean after backup
 *   node scripts/backup-and-clean-spaces.mjs --restore FILE    # Restore from backup
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Legacy to Canonical Mapping
// =============================================================================

const CATEGORY_MIGRATION_MAP = {
  'student_org': 'student_organizations',
  'university_org': 'university_organizations',
  'residential': 'campus_living',
  'university_spaces': 'university_organizations',
  'residential_spaces': 'campus_living',
  'greek_life_spaces': 'greek_life',
  'student_spaces': 'student_organizations',
  'student_organization': 'student_organizations',
  'university_organization': 'university_organizations',
};

function normalizeCategory(category) {
  if (!category) return 'student_organizations';
  return CATEGORY_MIGRATION_MAP[category] || category;
}

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
// Backup Spaces
// =============================================================================

async function backupSpaces(db) {
  console.log('\n📦 BACKING UP SPACES...\n');

  const spacesSnapshot = await db.collection('spaces').get();
  console.log(`Found ${spacesSnapshot.size} spaces to backup`);

  const spaces = [];
  for (const doc of spacesSnapshot.docs) {
    const data = doc.data();

    // Convert Firestore timestamps to ISO strings for JSON serialization
    const serialized = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      source: data.source ? {
        ...data.source,
        importedAt: data.source.importedAt?.toDate?.()?.toISOString() || data.source.importedAt,
        lastSyncedAt: data.source.lastSyncedAt?.toDate?.()?.toISOString() || data.source.lastSyncedAt,
      } : undefined,
    };

    spaces.push(serialized);
  }

  // Generate backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = join(__dirname, `spaces-backup-${timestamp}.json`);

  writeFileSync(backupPath, JSON.stringify(spaces, null, 2));
  console.log(`✅ Backup saved to: ${backupPath}`);

  // Category distribution
  const categoryCount = spaces.reduce((acc, s) => {
    const cat = s.category || 'unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  console.log('\nCategory distribution in backup:');
  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  return { backupPath, spaces };
}

// =============================================================================
// Clean Spaces
// =============================================================================

async function cleanSpaces(db) {
  console.log('\n🗑️  CLEANING SPACES COLLECTION...\n');

  const spacesSnapshot = await db.collection('spaces').get();
  console.log(`Found ${spacesSnapshot.size} spaces to delete`);

  if (spacesSnapshot.size === 0) {
    console.log('No spaces to delete.');
    return 0;
  }

  const BATCH_SIZE = 400;
  let deleted = 0;

  for (let i = 0; i < spacesSnapshot.docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchDocs = spacesSnapshot.docs.slice(i, i + BATCH_SIZE);

    for (const doc of batchDocs) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    deleted += batchDocs.length;
    console.log(`  Deleted ${deleted}/${spacesSnapshot.size}...`);
  }

  console.log(`✅ Deleted ${deleted} spaces`);
  return deleted;
}

// =============================================================================
// Restore Spaces with Canonical Schema
// =============================================================================

async function restoreSpaces(db, backupPath) {
  console.log('\n📥 RESTORING SPACES WITH CANONICAL SCHEMA...\n');

  if (!existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  const spaces = JSON.parse(readFileSync(backupPath, 'utf-8'));
  console.log(`Found ${spaces.length} spaces to restore`);

  const BATCH_SIZE = 400;
  let restored = 0;
  const categoryStats = {};

  for (let i = 0; i < spaces.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchSpaces = spaces.slice(i, i + BATCH_SIZE);

    for (const space of batchSpaces) {
      const docId = space.id;
      const ref = db.collection('spaces').doc(docId);

      // Normalize category and type to canonical values
      const normalizedCategory = normalizeCategory(space.category);
      const normalizedType = normalizeCategory(space.type);

      categoryStats[normalizedCategory] = (categoryStats[normalizedCategory] || 0) + 1;

      // Rebuild space with canonical schema
      const cleanedSpace = {
        ...space,
        category: normalizedCategory,
        type: normalizedType,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        _migratedAt: new Date().toISOString(),
        _originalCategory: space.category,
      };

      // Remove the id field (it's the doc ID, not a field)
      delete cleanedSpace.id;

      batch.set(ref, cleanedSpace);
    }

    await batch.commit();
    restored += batchSpaces.length;
    console.log(`  Restored ${restored}/${spaces.length}...`);
  }

  console.log(`\n✅ Restored ${restored} spaces with canonical schema`);
  console.log('\nCategory distribution after restore:');
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  return restored;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const doBackup = args.includes('--backup') || !args.includes('--restore');
  const doClean = args.includes('--clean');
  const restoreArg = args.find(a => a === '--restore');
  const restoreFile = restoreArg ? args[args.indexOf(restoreArg) + 1] : null;

  console.log('='.repeat(70));
  console.log('SPACES BACKUP & CLEAN UTILITY');
  console.log('='.repeat(70));

  const db = initFirebase();

  let backupPath = null;

  // Step 1: Backup (unless restoring from existing file)
  if (doBackup && !restoreFile) {
    const result = await backupSpaces(db);
    backupPath = result.backupPath;
  }

  // Step 2: Clean
  if (doClean) {
    console.log('\n⚠️  WARNING: This will delete all spaces from Firestore!');
    console.log('    Backup was saved to:', backupPath);
    console.log('\n    Proceeding with deletion in 3 seconds...');
    await new Promise(r => setTimeout(r, 3000));

    await cleanSpaces(db);
  }

  // Step 3: Restore
  if (restoreFile) {
    await restoreSpaces(db, restoreFile);
  } else if (doClean && backupPath) {
    console.log('\n📋 To restore spaces with canonical schema, run:');
    console.log(`   node scripts/backup-and-clean-spaces.mjs --restore ${backupPath}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('DONE');
  console.log('='.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Operation failed:', error);
    process.exit(1);
  });
