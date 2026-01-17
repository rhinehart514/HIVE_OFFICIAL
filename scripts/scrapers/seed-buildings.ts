/**
 * UB Buildings Seeder
 *
 * Seeds campus buildings and study spaces to Firestore.
 *
 * Usage:
 *   npx ts-node scripts/scrapers/seed-buildings.ts [--dry-run] [--force]
 *
 * Flags:
 *   --dry-run  Preview what would be written without actually writing
 *   --force    Overwrite existing data
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { UB_BUILDINGS } from './ub-buildings-data';

const CAMPUS_ID = 'ub-buffalo';
const COLLECTION_PATH = `campusData/${CAMPUS_ID}/buildings`;

async function seedBuildings(dryRun = false, force = false) {
  console.log('\n🏛️  UB Buildings Seeder\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Force overwrite: ${force}`);
  console.log(`Buildings to seed: ${UB_BUILDINGS.length}`);
  console.log(`Total study spaces: ${UB_BUILDINGS.reduce((sum, b) => sum + b.studySpaces.length, 0)}`);
  console.log('');

  if (dryRun) {
    console.log('📋 Buildings that would be seeded:\n');
    for (const building of UB_BUILDINGS) {
      console.log(`  📍 ${building.name} (${building.abbreviation || 'N/A'})`);
      console.log(`     Type: ${building.type}`);
      console.log(`     Study Spaces: ${building.studySpaces.length}`);
      for (const space of building.studySpaces) {
        console.log(`       - ${space.name} (${space.noiseLevel}, ${space.seatingCapacity} seats)`);
      }
      console.log('');
    }
    console.log('✅ Dry run complete. Use without --dry-run to seed data.');
    return;
  }

  // Initialize Firebase Admin
  try {
    initializeApp({
      credential: cert(require('../../service-account.json')),
    });
  } catch {
    // App might already be initialized
  }

  const db = getFirestore();

  // Check for existing data
  if (!force) {
    const existing = await db.collection(COLLECTION_PATH).limit(1).get();
    if (!existing.empty) {
      console.log('⚠️  Buildings data already exists. Use --force to overwrite.');
      return;
    }
  }

  // Seed each building
  console.log('📤 Seeding buildings...\n');

  const batch = db.batch();

  for (const building of UB_BUILDINGS) {
    const docRef = db.collection(COLLECTION_PATH).doc(building.id);
    batch.set(docRef, {
      ...building,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`  ✓ ${building.name} (${building.studySpaces.length} study spaces)`);
  }

  await batch.commit();

  console.log('\n✅ Successfully seeded all buildings!');
  console.log(`   Collection: ${COLLECTION_PATH}`);
  console.log(`   Buildings: ${UB_BUILDINGS.length}`);
  console.log(`   Study Spaces: ${UB_BUILDINGS.reduce((sum, b) => sum + b.studySpaces.length, 0)}`);
}

// Parse args and run
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

seedBuildings(dryRun, force).catch(console.error);
