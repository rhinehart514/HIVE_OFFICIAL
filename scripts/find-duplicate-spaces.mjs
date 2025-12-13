#!/usr/bin/env node
/**
 * Find duplicate spaces in Firestore
 * Checks for duplicates by: name, slug, sourceId (CampusLabs ID)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const envPath = './apps/web/.env.local';
const envContent = readFileSync(envPath, 'utf-8');
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

const db = getFirestore();

async function findDuplicates() {
  console.log('='.repeat(70));
  console.log('FIRESTORE SPACES DUPLICATE FINDER');
  console.log('='.repeat(70));

  const snapshot = await db.collection('spaces').get();
  console.log(`\nTotal spaces in collection: ${snapshot.size}\n`);

  // Group by various fields
  const byName = {};
  const bySlug = {};
  const bySourceId = {};
  const byNormalizedName = {};

  const allSpaces = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const space = {
      id: doc.id,
      name: data.name,
      slug: data.slug,
      sourceId: data.sourceId,
      source: data.source,
      campusId: data.campusId,
      category: data.category,
      type: data.type,
      status: data.status,
      createdAt: data.createdAt,
      memberCount: data.memberCount || 0,
    };
    allSpaces.push(space);

    // Group by exact name
    if (data.name) {
      if (!byName[data.name]) byName[data.name] = [];
      byName[data.name].push(space);
    }

    // Group by slug
    if (data.slug) {
      if (!bySlug[data.slug]) bySlug[data.slug] = [];
      bySlug[data.slug].push(space);
    }

    // Group by sourceId (CampusLabs ID)
    if (data.sourceId) {
      if (!bySourceId[data.sourceId]) bySourceId[data.sourceId] = [];
      bySourceId[data.sourceId].push(space);
    }

    // Group by normalized name (lowercase, no special chars)
    const normalizedName = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedName) {
      if (!byNormalizedName[normalizedName]) byNormalizedName[normalizedName] = [];
      byNormalizedName[normalizedName].push(space);
    }
  }

  // Find duplicates
  const exactNameDupes = Object.entries(byName).filter(([_, spaces]) => spaces.length > 1);
  const slugDupes = Object.entries(bySlug).filter(([_, spaces]) => spaces.length > 1);
  const sourceIdDupes = Object.entries(bySourceId).filter(([_, spaces]) => spaces.length > 1);
  const normalizedNameDupes = Object.entries(byNormalizedName).filter(([_, spaces]) => spaces.length > 1);

  console.log('='.repeat(70));
  console.log('DUPLICATE SUMMARY');
  console.log('='.repeat(70));
  console.log(`Exact name duplicates: ${exactNameDupes.length} groups`);
  console.log(`Slug duplicates: ${slugDupes.length} groups`);
  console.log(`SourceId (CampusLabs) duplicates: ${sourceIdDupes.length} groups`);
  console.log(`Normalized name duplicates: ${normalizedNameDupes.length} groups`);

  // Detail: Exact name duplicates
  if (exactNameDupes.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('EXACT NAME DUPLICATES');
    console.log('='.repeat(70));
    exactNameDupes.forEach(([name, spaces]) => {
      console.log(`\n"${name}" (${spaces.length} copies):`);
      spaces.forEach(s => {
        console.log(`  - ID: ${s.id}`);
        console.log(`    slug: ${s.slug || 'none'}`);
        console.log(`    sourceId: ${s.sourceId || 'none'}`);
        console.log(`    source: ${s.source || 'none'}`);
        console.log(`    category: ${s.category || s.type || 'none'}`);
        console.log(`    members: ${s.memberCount}`);
      });
    });
  }

  // Detail: SourceId duplicates (most concerning - same CampusLabs org imported multiple times)
  if (sourceIdDupes.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('SOURCEID (CAMPUSLABS) DUPLICATES - CRITICAL');
    console.log('='.repeat(70));
    sourceIdDupes.forEach(([sourceId, spaces]) => {
      console.log(`\nSourceId "${sourceId}" (${spaces.length} copies):`);
      spaces.forEach(s => {
        console.log(`  - ID: ${s.id}`);
        console.log(`    name: ${s.name}`);
        console.log(`    slug: ${s.slug || 'none'}`);
        console.log(`    source: ${s.source || 'none'}`);
      });
    });
  }

  // Detail: Slug duplicates
  if (slugDupes.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('SLUG DUPLICATES - URL CONFLICT');
    console.log('='.repeat(70));
    slugDupes.forEach(([slug, spaces]) => {
      console.log(`\nSlug "${slug}" (${spaces.length} copies):`);
      spaces.forEach(s => {
        console.log(`  - ID: ${s.id}, name: "${s.name}"`);
      });
    });
  }

  // Detail: Normalized name duplicates (might be different orgs with similar names)
  if (normalizedNameDupes.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('SIMILAR NAMES (normalized) - MAY BE DIFFERENT ORGS');
    console.log('='.repeat(70));
    // Filter out exact name matches
    const onlySimilar = normalizedNameDupes.filter(([normalized, spaces]) => {
      const names = new Set(spaces.map(s => s.name));
      return names.size > 1; // Only show if names are different
    });

    if (onlySimilar.length > 0) {
      onlySimilar.slice(0, 20).forEach(([normalized, spaces]) => {
        console.log(`\nSimilar to "${normalized}":`);
        spaces.forEach(s => {
          console.log(`  - "${s.name}" (ID: ${s.id})`);
        });
      });
      if (onlySimilar.length > 20) {
        console.log(`\n... and ${onlySimilar.length - 20} more similar groups`);
      }
    } else {
      console.log('No similar (but different) names found.');
    }
  }

  // Stats
  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(70));

  const totalDuplicateRecords = exactNameDupes.reduce((sum, [_, spaces]) => sum + spaces.length - 1, 0) +
    sourceIdDupes.reduce((sum, [_, spaces]) => sum + spaces.length - 1, 0);

  console.log(`\nEstimated duplicate records to remove: ${totalDuplicateRecords}`);

  if (sourceIdDupes.length > 0) {
    console.log('\n1. CRITICAL: SourceId duplicates should be merged/deleted first');
    console.log('   These are the same CampusLabs org imported multiple times');
  }

  if (exactNameDupes.length > 0) {
    console.log('\n2. HIGH: Exact name duplicates need review');
    console.log('   May have different sourceIds (different orgs with same name)');
  }

  if (slugDupes.length > 0) {
    console.log('\n3. HIGH: Slug duplicates cause URL conflicts');
    console.log('   One will win, others unreachable by slug');
  }

  return {
    total: snapshot.size,
    exactNameDupes: exactNameDupes.length,
    slugDupes: slugDupes.length,
    sourceIdDupes: sourceIdDupes.length,
  };
}

findDuplicates()
  .then((stats) => {
    console.log('\n' + '='.repeat(70));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(70));
    process.exit(0);
  })
  .catch(e => {
    console.error('Audit failed:', e);
    process.exit(1);
  });
