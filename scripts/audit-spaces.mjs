#!/usr/bin/env node
/**
 * Audit existing Firestore spaces for category standardization
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

// The 4 canonical categories
const CANONICAL_CATEGORIES = ['student_org', 'university_org', 'greek_life', 'residential'];

// Mapping from old type values to new category values
const TYPE_TO_CATEGORY_MAP = {
  'student_organization': 'student_org',
  'student_organizations': 'student_org',
  'university_organization': 'university_org',
  'university_organizations': 'university_org',
  'greek_life': 'greek_life',
  'residential': 'residential',
  'residential_spaces': 'residential',
};

async function auditSpaces() {
  const snapshot = await db.collection('spaces').get();

  console.log('='.repeat(70));
  console.log('FIRESTORE SPACES AUDIT');
  console.log('='.repeat(70));
  console.log(`Total spaces: ${snapshot.size}\n`);

  const stats = {
    byTypeField: {},
    byCategoryField: {},
    hasType: 0,
    hasCategory: 0,
    hasBoth: 0,
    hasNeither: 0,
    needsMigration: [],
    alreadyCorrect: [],
    unknown: [],
  };

  const sampleDocs = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasType = 'type' in data;
    const hasCategory = 'category' in data;

    if (hasType) stats.hasType++;
    if (hasCategory) stats.hasCategory++;
    if (hasType && hasCategory) stats.hasBoth++;
    if (!hasType && !hasCategory) stats.hasNeither++;

    // Track type field values
    if (hasType) {
      stats.byTypeField[data.type] = (stats.byTypeField[data.type] || 0) + 1;
    }

    // Track category field values
    if (hasCategory) {
      stats.byCategoryField[data.category] = (stats.byCategoryField[data.category] || 0) + 1;
    }

    // Classify migration status
    if (hasCategory && CANONICAL_CATEGORIES.includes(data.category)) {
      stats.alreadyCorrect.push({ id: doc.id, name: data.name, category: data.category });
    } else if (hasType && TYPE_TO_CATEGORY_MAP[data.type]) {
      stats.needsMigration.push({
        id: doc.id,
        name: data.name,
        oldType: data.type,
        newCategory: TYPE_TO_CATEGORY_MAP[data.type],
        hasCategory: hasCategory,
        currentCategory: data.category,
      });
    } else {
      stats.unknown.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        category: data.category,
      });
    }

    // Sample first 3 docs
    if (sampleDocs.length < 3) {
      sampleDocs.push({ id: doc.id, ...data });
    }
  }

  console.log('--- FIELD USAGE ---');
  console.log(`  Has 'type' field: ${stats.hasType}`);
  console.log(`  Has 'category' field: ${stats.hasCategory}`);
  console.log(`  Has both: ${stats.hasBoth}`);
  console.log(`  Has neither: ${stats.hasNeither}`);

  console.log('\n--- TYPE FIELD VALUES ---');
  Object.entries(stats.byTypeField).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    const mapsTo = TYPE_TO_CATEGORY_MAP[type] || '⚠️ UNKNOWN';
    console.log(`  ${type}: ${count} → ${mapsTo}`);
  });

  if (Object.keys(stats.byCategoryField).length > 0) {
    console.log('\n--- CATEGORY FIELD VALUES ---');
    Object.entries(stats.byCategoryField).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      const isCanonical = CANONICAL_CATEGORIES.includes(cat) ? '✓' : '⚠️';
      console.log(`  ${cat}: ${count} ${isCanonical}`);
    });
  }

  console.log('\n--- MIGRATION SUMMARY ---');
  console.log(`  Already correct (has canonical category): ${stats.alreadyCorrect.length}`);
  console.log(`  Needs migration (type → category): ${stats.needsMigration.length}`);
  console.log(`  Unknown/needs review: ${stats.unknown.length}`);

  if (stats.unknown.length > 0) {
    console.log('\n--- UNKNOWN SPACES (need manual review) ---');
    stats.unknown.slice(0, 10).forEach(s => {
      console.log(`  - ${s.name} (type: ${s.type}, category: ${s.category})`);
    });
    if (stats.unknown.length > 10) {
      console.log(`  ... and ${stats.unknown.length - 10} more`);
    }
  }

  console.log('\n--- SAMPLE DOCUMENT STRUCTURE ---');
  sampleDocs.forEach((doc, i) => {
    console.log(`\nSample ${i + 1}: ${doc.name}`);
    console.log(JSON.stringify({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      category: doc.category,
      campusId: doc.campusId,
      status: doc.status,
      isActive: doc.isActive,
      visibility: doc.visibility,
      claimStatus: doc.claimStatus,
      source: doc.source,
    }, null, 2));
  });

  return stats;
}

auditSpaces()
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
