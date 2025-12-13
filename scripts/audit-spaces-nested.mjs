#!/usr/bin/env node
/**
 * Audit nested data inside spaces collection
 * Checks subcollections, orphaned data, and cruft
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

async function auditNestedData() {
  console.log('='.repeat(70));
  console.log('SPACES NESTED DATA AUDIT');
  console.log('='.repeat(70));

  const spacesSnapshot = await db.collection('spaces').get();
  console.log(`\nTotal spaces: ${spacesSnapshot.size}\n`);

  const stats = {
    subcollections: {},
    totalSubcollectionDocs: 0,
    spacesWithSubcollections: 0,
    emptySpaces: 0,
    fieldStats: {},
    suspiciousFields: [],
    largeDocuments: [],
  };

  // Expected fields for a space document
  const expectedFields = new Set([
    'id', 'name', 'description', 'slug', 'campusId', 'category', 'type',
    'status', 'visibility', 'isActive', 'memberCount', 'createdAt', 'updatedAt',
    'createdBy', 'ownerId', 'leaderId', 'source', 'sourceId', 'sourceUrl',
    'claimStatus', 'claimedBy', 'claimedAt', 'imageUrl', 'bannerUrl', 'logoUrl',
    'tags', 'settings', 'metadata', 'socialLinks', 'contactEmail', 'website',
    'location', 'meetingSchedule', 'features', 'widgets', 'tabs', 'tools',
    'pinnedPosts', 'announcements', 'rules', 'moderators', 'admins',
    'joinRequirements', 'membershipType', 'isVerified', 'verifiedAt',
  ]);

  let spacesProcessed = 0;

  for (const spaceDoc of spacesSnapshot.docs) {
    spacesProcessed++;
    if (spacesProcessed % 100 === 0) {
      console.log(`Processing space ${spacesProcessed}/${spacesSnapshot.size}...`);
    }

    const spaceData = spaceDoc.data();
    const spaceId = spaceDoc.id;

    // Check for unexpected fields
    for (const field of Object.keys(spaceData)) {
      stats.fieldStats[field] = (stats.fieldStats[field] || 0) + 1;

      if (!expectedFields.has(field)) {
        stats.suspiciousFields.push({
          spaceId,
          spaceName: spaceData.name,
          field,
          value: typeof spaceData[field] === 'object'
            ? JSON.stringify(spaceData[field]).substring(0, 100)
            : String(spaceData[field]).substring(0, 100)
        });
      }
    }

    // Check document size (rough estimate)
    const docSize = JSON.stringify(spaceData).length;
    if (docSize > 10000) {
      stats.largeDocuments.push({
        spaceId,
        spaceName: spaceData.name,
        sizeBytes: docSize
      });
    }

    // List all subcollections
    const subcollections = await spaceDoc.ref.listCollections();

    if (subcollections.length > 0) {
      stats.spacesWithSubcollections++;
    } else {
      stats.emptySpaces++;
    }

    for (const subcol of subcollections) {
      const subcolName = subcol.id;
      const countResult = await subcol.count().get();
      const count = countResult.data().count;

      if (!stats.subcollections[subcolName]) {
        stats.subcollections[subcolName] = {
          totalDocs: 0,
          spacesWithThis: 0,
          maxInSpace: 0,
          maxSpaceId: null,
          examples: []
        };
      }

      stats.subcollections[subcolName].totalDocs += count;
      stats.subcollections[subcolName].spacesWithThis++;
      stats.totalSubcollectionDocs += count;

      if (count > stats.subcollections[subcolName].maxInSpace) {
        stats.subcollections[subcolName].maxInSpace = count;
        stats.subcollections[subcolName].maxSpaceId = spaceId;
      }

      // Get sample doc from each subcollection type (first 3 spaces only)
      if (stats.subcollections[subcolName].examples.length < 3 && count > 0) {
        const sampleDocs = await subcol.limit(1).get();
        if (!sampleDocs.empty) {
          const sampleData = sampleDocs.docs[0].data();
          stats.subcollections[subcolName].examples.push({
            spaceId,
            spaceName: spaceData.name,
            docId: sampleDocs.docs[0].id,
            fields: Object.keys(sampleData),
            sample: JSON.stringify(sampleData).substring(0, 200)
          });
        }
      }
    }
  }

  // Report
  console.log('\n' + '='.repeat(70));
  console.log('SUBCOLLECTIONS FOUND');
  console.log('='.repeat(70));

  const sortedSubcols = Object.entries(stats.subcollections)
    .sort((a, b) => b[1].totalDocs - a[1].totalDocs);

  for (const [name, data] of sortedSubcols) {
    console.log(`\n📁 ${name}`);
    console.log(`   Total documents: ${data.totalDocs}`);
    console.log(`   Spaces with this: ${data.spacesWithThis}`);
    console.log(`   Max in one space: ${data.maxInSpace} (${data.maxSpaceId})`);

    if (data.examples.length > 0) {
      console.log(`   Sample fields: ${data.examples[0].fields.join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('FIELD USAGE ACROSS SPACES');
  console.log('='.repeat(70));

  const sortedFields = Object.entries(stats.fieldStats)
    .sort((a, b) => b[1] - a[1]);

  console.log('\nMost common fields:');
  sortedFields.slice(0, 20).forEach(([field, count]) => {
    const expected = expectedFields.has(field) ? '' : ' ⚠️ UNEXPECTED';
    console.log(`  ${field}: ${count} spaces${expected}`);
  });

  if (stats.suspiciousFields.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('UNEXPECTED/SUSPICIOUS FIELDS');
    console.log('='.repeat(70));

    // Group by field name
    const byField = {};
    stats.suspiciousFields.forEach(item => {
      if (!byField[item.field]) byField[item.field] = [];
      byField[item.field].push(item);
    });

    for (const [field, items] of Object.entries(byField)) {
      console.log(`\n⚠️ "${field}" found in ${items.length} spaces:`);
      items.slice(0, 3).forEach(item => {
        console.log(`   - ${item.spaceName} (${item.spaceId})`);
        console.log(`     Value: ${item.value}`);
      });
      if (items.length > 3) {
        console.log(`   ... and ${items.length - 3} more`);
      }
    }
  }

  if (stats.largeDocuments.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('LARGE DOCUMENTS (>10KB)');
    console.log('='.repeat(70));
    stats.largeDocuments
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .slice(0, 10)
      .forEach(doc => {
        console.log(`  ${doc.spaceName}: ${Math.round(doc.sizeBytes / 1024)}KB`);
      });
  }

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total spaces: ${spacesSnapshot.size}`);
  console.log(`Spaces with subcollections: ${stats.spacesWithSubcollections}`);
  console.log(`Empty spaces (no subcollections): ${stats.emptySpaces}`);
  console.log(`Total documents in subcollections: ${stats.totalSubcollectionDocs}`);
  console.log(`Unique subcollection types: ${Object.keys(stats.subcollections).length}`);
  console.log(`Unexpected fields found: ${stats.suspiciousFields.length}`);
  console.log(`Large documents (>10KB): ${stats.largeDocuments.length}`);

  return stats;
}

auditNestedData()
  .then(() => {
    console.log('\n' + '='.repeat(70));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(70));
    process.exit(0);
  })
  .catch(e => {
    console.error('Audit failed:', e);
    process.exit(1);
  });
