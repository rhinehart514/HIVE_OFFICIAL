/**
 * UB Places API Scraper
 *
 * Fetches building/location data from UB's public Places API.
 * Outputs to Firestore as campus locations for map and autocomplete.
 *
 * Usage:
 *   pnpm exec tsx scripts/scrapers/ub-places.ts --dry-run
 *   pnpm exec tsx scripts/scrapers/ub-places.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ============================================
// TYPES
// ============================================

interface UBPlace {
  locationid: string;
  stateid: string;
  title: string;
  campus: string;
  areas: string[];
  category: {
    id: string;
    title: string;
  };
  latlng: [string, string];
  keywords: string[];
}

interface HiveLocation {
  id: string;
  externalId: string;
  name: string;
  name_lowercase: string;
  campus: string;
  campusId: string;
  category: string;
  categoryTitle: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  keywords: string[];
  areas: string[];
  source: 'ub-places-api';
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// ============================================
// CONFIGURATION
// ============================================

const PLACES_API_URL = 'https://www.buffalo.edu/places_api/v1/markers';
const CAMPUS_ID = 'ub-buffalo';

// Category mapping to HIVE location types
// Based on actual API values: academic, adm-serv, residen, arts, athletics, etc.
const CATEGORY_MAP: Record<string, string> = {
  'academic': 'academic',
  'adm-serv': 'administrative',
  'residen': 'residential',
  'arts': 'recreation',
  'athletics': 'athletics',
  'health': 'health',
  'dining': 'dining',
  'shops': 'commercial',
  'iconic': 'landmark',
  'parking': 'parking',
  'transit': 'transit',
};

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('\n🏛️  UB Places API Scraper\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`API: ${PLACES_API_URL}\n`);

  // Fetch places
  console.log('📥 Fetching places from UB API...');
  const response = await fetch(PLACES_API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch places: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const places: UBPlace[] = data.results || [];
  console.log(`   Found ${places.length} locations\n`);

  // Transform to HIVE format
  const locations: HiveLocation[] = places.map(place => transformPlace(place));

  // Stats
  const stats = {
    total: locations.length,
    byCampus: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
  };

  locations.forEach(loc => {
    stats.byCampus[loc.campus] = (stats.byCampus[loc.campus] || 0) + 1;
    stats.byCategory[loc.category] = (stats.byCategory[loc.category] || 0) + 1;
  });

  console.log('📊 Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log('\n   By Campus:');
  Object.entries(stats.byCampus)
    .sort((a, b) => b[1] - a[1])
    .forEach(([campus, count]) => {
      console.log(`     - ${campus}: ${count}`);
    });
  console.log('\n   By Category:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`     - ${cat}: ${count}`);
    });
  console.log('');

  // Dry run output
  if (dryRun) {
    console.log('📋 Sample locations:\n');
    locations.slice(0, 10).forEach(loc => {
      console.log(`  📍 ${loc.name}`);
      console.log(`     ID: ${loc.id}`);
      console.log(`     Campus: ${loc.campus}`);
      console.log(`     Category: ${loc.categoryTitle}`);
      console.log(`     Coords: ${loc.coordinates.lat}, ${loc.coordinates.lng}`);
      if (verbose) {
        console.log(`     Keywords: ${loc.keywords.join(', ')}`);
      }
      console.log('');
    });
    console.log(`... and ${locations.length - 10} more\n`);
    console.log('✅ Dry run complete. Remove --dry-run to write to Firestore.');
    return;
  }

  // Initialize Firebase
  if (getApps().length === 0) {
    try {
      initializeApp({
        credential: cert(require('../../service-account.json')),
      });
    } catch (error) {
      console.error('❌ Failed to initialize Firebase. Make sure service-account.json exists.');
      process.exit(1);
    }
  }

  const db = getFirestore();

  // Write to Firestore
  console.log('📤 Writing to Firestore...');

  const BATCH_SIZE = 500;
  let written = 0;

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchLocations = locations.slice(i, i + BATCH_SIZE);

    for (const location of batchLocations) {
      const ref = db.collection('locations').doc(location.id);
      batch.set(ref, location, { merge: true });
    }

    await batch.commit();
    written += batchLocations.length;
    console.log(`   Written ${written}/${locations.length} locations...`);
  }

  console.log('\n✅ Successfully imported all locations!');
  console.log(`   Collection: locations`);
  console.log(`   Campus: ${CAMPUS_ID}`);
  console.log(`   Total: ${locations.length}`);
}

// ============================================
// TRANSFORM
// ============================================

function transformPlace(place: UBPlace): HiveLocation {
  const category = mapCategory(place.category.id);

  return {
    id: `${CAMPUS_ID}-loc-${place.locationid.toLowerCase()}`,
    externalId: place.locationid,
    name: place.title,
    name_lowercase: place.title.toLowerCase(),
    campus: place.campus,
    campusId: CAMPUS_ID,
    category,
    categoryTitle: place.category.title,
    coordinates: {
      lat: parseFloat(place.latlng[0]),
      lng: parseFloat(place.latlng[1]),
    },
    keywords: place.keywords.map(k => k.toLowerCase()),
    areas: place.areas,
    source: 'ub-places-api',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function mapCategory(categoryId: string): string {
  return CATEGORY_MAP[categoryId] || 'other';
}

// ============================================
// RUN
// ============================================

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
