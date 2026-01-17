#!/usr/bin/env npx ts-node
/**
 * UB Dining Data Seeder
 *
 * Seeds Firestore with UB campus dining location data.
 * Run with: npx ts-node scripts/scrapers/seed-dining.ts
 *
 * Options:
 *   --dry-run    Show what would be written without actually writing
 *   --force      Overwrite existing data even if unchanged
 */

import * as admin from 'firebase-admin';
import { UB_DINING_LOCATIONS, TOTAL_LOCATIONS } from './ub-dining-data';

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  './infrastructure/firebase/service-account.json';

try {
  // Check if already initialized
  admin.app();
} catch {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: process.env.FIREBASE_PROJECT_ID || 'hive-ub',
  });
}

const db = admin.firestore();

interface SeedOptions {
  dryRun: boolean;
  force: boolean;
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };
}

async function seedDiningLocations(options: SeedOptions): Promise<void> {
  const { dryRun, force } = options;

  console.log('\n🍽️  UB Dining Data Seeder');
  console.log('========================');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Force: ${force ? 'Yes (overwrite all)' : 'No (skip unchanged)'}`);
  console.log(`Total locations to seed: ${TOTAL_LOCATIONS}\n`);

  const campusId = 'ub-buffalo';
  const collectionPath = `campusData/${campusId}/dining`;

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const location of UB_DINING_LOCATIONS) {
    try {
      const docRef = db.collection(collectionPath).doc(location.id);
      const existingDoc = await docRef.get();

      if (existingDoc.exists && !force) {
        const existingData = existingDoc.data();
        const existingUpdated = existingData?.lastUpdated;
        const newUpdated = location.lastUpdated;

        // Skip if data hasn't changed (based on lastUpdated comparison)
        if (existingUpdated === newUpdated) {
          console.log(`⏭️  Skipped (unchanged): ${location.name}`);
          skipped++;
          continue;
        }
      }

      const action = existingDoc.exists ? 'Updated' : 'Created';

      if (dryRun) {
        console.log(`🔍 Would ${action.toLowerCase()}: ${location.name}`);
        console.log(`   Type: ${location.type} | Building: ${location.building}`);
        console.log(`   Hours: ${location.hours.filter(h => h.isOpen).length} days open`);
        console.log(`   Dietary: ${location.dietaryOptions.join(', ')}`);
      } else {
        await docRef.set({
          ...location,
          _metadata: {
            seededAt: admin.firestore.FieldValue.serverTimestamp(),
            version: 1,
          },
        });
        console.log(`✅ ${action}: ${location.name}`);
      }

      if (action === 'Updated') {
        updated++;
      } else {
        created++;
      }
    } catch (error) {
      console.error(`❌ Error seeding ${location.name}:`, error);
      errors++;
    }
  }

  // Create/update metadata document
  const metaDocRef = db.collection('campusData').doc(campusId);
  if (!dryRun) {
    await metaDocRef.set({
      id: campusId,
      name: 'University at Buffalo',
      dining: {
        totalLocations: TOTAL_LOCATIONS,
        lastSeeded: admin.firestore.FieldValue.serverTimestamp(),
        dataSource: 'manual',
      },
    }, { merge: true });
  }

  console.log('\n📊 Seeding Summary');
  console.log('==================');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors:  ${errors}`);
  console.log(`Total:   ${TOTAL_LOCATIONS}`);

  if (dryRun) {
    console.log('\n⚠️  This was a dry run. No data was written.');
    console.log('   Run without --dry-run to actually seed the data.');
  } else {
    console.log('\n✅ Dining data seeded successfully!');
  }
}

// Run the seeder
const options = parseArgs();
seedDiningLocations(options)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
