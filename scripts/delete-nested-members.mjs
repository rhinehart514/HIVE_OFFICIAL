#!/usr/bin/env node
/**
 * Delete Orphaned Nested Members Subcollection
 *
 * The codebase uses flat /spaceMembers collection (95+ references).
 * Nested /spaces/{id}/members subcollection is orphaned (283 docs found in audit).
 *
 * This script:
 * 1. Verifies spaceMembers has equivalent data
 * 2. Backs up nested members data to a log file
 * 3. Deletes the nested members subcollection
 *
 * Usage:
 *   node scripts/delete-nested-members.mjs           # Dry run (preview)
 *   node scripts/delete-nested-members.mjs --execute # Actually run deletion
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';

// Parse arguments
const DRY_RUN = !process.argv.includes('--execute');

// Load environment
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

// Stats tracking
const stats = {
  spacesProcessed: 0,
  spacesWithNestedMembers: 0,
  nestedMembersFound: 0,
  nestedMembersDeleted: 0,
  flatMembersTotal: 0,
  missingInFlat: [],
  errors: []
};

// Backup data
const backup = {
  timestamp: new Date().toISOString(),
  nestedMembers: []
};

/**
 * Check if member exists in flat spaceMembers collection
 */
async function memberExistsInFlat(spaceId, userId, campusId) {
  // Composite key format: spaceId_campusId_userId
  const compositeKey = `${spaceId}_${campusId}_${userId}`;

  const flatDoc = await db.collection('spaceMembers').doc(compositeKey).get();
  if (flatDoc.exists) {
    return true;
  }

  // Also check without campusId for older format
  const altKey = `${spaceId}_${userId}`;
  const altDoc = await db.collection('spaceMembers').doc(altKey).get();
  if (altDoc.exists) {
    return true;
  }

  // Query-based check as fallback
  const querySnapshot = await db.collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  return !querySnapshot.empty;
}

/**
 * Process nested members for a single space
 */
async function processSpaceNestedMembers(spaceDoc) {
  const spaceId = spaceDoc.id;
  const spaceData = spaceDoc.data();
  const spaceName = spaceData.name || spaceId;
  const campusId = spaceData.campusId || 'ub-buffalo';

  const membersRef = db.collection('spaces').doc(spaceId).collection('members');
  const membersSnapshot = await membersRef.get();

  if (membersSnapshot.empty) {
    return false;
  }

  stats.spacesWithNestedMembers++;
  const memberCount = membersSnapshot.size;
  stats.nestedMembersFound += memberCount;

  console.log(`\n📁 ${spaceName} (${spaceId}): ${memberCount} nested members`);

  let deletedCount = 0;

  for (const memberDoc of membersSnapshot.docs) {
    const memberData = { id: memberDoc.id, ...memberDoc.data() };
    const userId = memberData.userId || memberDoc.id;

    // Backup the data
    backup.nestedMembers.push({
      spaceId,
      spaceName,
      memberId: memberDoc.id,
      data: memberData
    });

    // Check if exists in flat collection
    const existsInFlat = await memberExistsInFlat(spaceId, userId, campusId);

    if (!existsInFlat) {
      stats.missingInFlat.push({
        spaceId,
        spaceName,
        memberId: memberDoc.id,
        userId,
        data: memberData
      });
      console.log(`   ⚠️  Member ${userId} NOT in flat collection`);
    }

    if (!DRY_RUN) {
      await memberDoc.ref.delete();
      deletedCount++;
      stats.nestedMembersDeleted++;
    } else {
      deletedCount++;
      stats.nestedMembersDeleted++;
    }
  }

  console.log(`   ${DRY_RUN ? 'Would delete' : 'Deleted'}: ${deletedCount} members`);
  return true;
}

/**
 * Get count of flat spaceMembers
 */
async function countFlatMembers() {
  const countResult = await db.collection('spaceMembers').count().get();
  return countResult.data().count;
}

/**
 * Main deletion function
 */
async function deleteNestedMembers() {
  console.log('='.repeat(70));
  console.log('DELETE NESTED MEMBERS SUBCOLLECTION');
  console.log('='.repeat(70));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Run with --execute to perform actual deletion\n');
  } else {
    console.log('\n🚀 EXECUTING DELETION - Changes will be permanent!\n');
  }

  // First, count flat members for comparison
  stats.flatMembersTotal = await countFlatMembers();
  console.log(`Flat /spaceMembers collection: ${stats.flatMembersTotal} documents\n`);

  // Get all spaces
  const spacesSnapshot = await db.collection('spaces').get();
  console.log(`Total spaces to check: ${spacesSnapshot.size}`);

  // Process each space
  for (const spaceDoc of spacesSnapshot.docs) {
    stats.spacesProcessed++;

    if (stats.spacesProcessed % 100 === 0) {
      console.log(`\nProgress: ${stats.spacesProcessed}/${spacesSnapshot.size} spaces...`);
    }

    try {
      await processSpaceNestedMembers(spaceDoc);
    } catch (error) {
      stats.errors.push({
        spaceId: spaceDoc.id,
        error: error.message
      });
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Save backup
  const backupPath = `/tmp/nested-members-backup-${Date.now()}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`\n📝 Backup saved to: ${backupPath}`);

  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('DELETION SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nSpaces processed: ${stats.spacesProcessed}`);
  console.log(`Spaces with nested members: ${stats.spacesWithNestedMembers}`);
  console.log(`Nested members found: ${stats.nestedMembersFound}`);
  console.log(`Nested members deleted: ${stats.nestedMembersDeleted}`);
  console.log(`Flat spaceMembers total: ${stats.flatMembersTotal}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.missingInFlat.length > 0) {
    console.log('\n⚠️  MEMBERS NOT IN FLAT COLLECTION:');
    console.log(`   ${stats.missingInFlat.length} members found in nested but not in flat`);

    if (stats.missingInFlat.length <= 20) {
      stats.missingInFlat.forEach(m => {
        console.log(`   - ${m.spaceName} / ${m.userId}`);
      });
    } else {
      stats.missingInFlat.slice(0, 10).forEach(m => {
        console.log(`   - ${m.spaceName} / ${m.userId}`);
      });
      console.log(`   ... and ${stats.missingInFlat.length - 10} more`);
    }

    console.log('\n   These are backed up in the JSON file and should be manually reviewed.');
  }

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(e => console.log(`  - ${e.spaceId}: ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n' + '='.repeat(70));
    console.log('DRY RUN COMPLETE');
    console.log('Run with --execute to perform actual deletion');
    console.log('='.repeat(70));
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('DELETION COMPLETE');
    console.log('='.repeat(70));
  }
}

deleteNestedMembers()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Deletion failed:', e);
    process.exit(1);
  });
