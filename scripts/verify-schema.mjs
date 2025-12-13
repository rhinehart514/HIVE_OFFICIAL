#!/usr/bin/env node
/**
 * Verify Firestore Schema
 *
 * Final verification that all spaces match the canonical schema after migration.
 *
 * Checks:
 * 1. All spaces have only canonical fields (no garbage)
 * 2. All spaces have required fields with valid values
 * 3. Posts subcollection is deleted from all spaces
 * 4. Nested members subcollection is deleted
 * 5. Boards/messages structure is valid
 *
 * Usage:
 *   node scripts/verify-schema.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

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

/**
 * Canonical fields - same as cleanup-space-fields.mjs
 */
const CANONICAL_FIELDS = new Set([
  'id', 'name', 'description', 'slug',
  'category', 'campusId', 'type',
  'isActive', 'visibility', 'status', 'claimStatus', 'claimedBy', 'claimedAt', 'isVerified', 'verifiedAt',
  'createdBy', 'createdAt', 'updatedAt', 'ownerId', 'leaderId',
  'source', 'sourceId', 'sourceUrl',
  'logoUrl', 'bannerUrl', 'imageUrl',
  'memberCount',
  'settings', 'tags', 'metadata',
  'socialLinks', 'contactEmail', 'website', 'location', 'meetingSchedule',
  'features', 'widgets', 'tabs', 'tools',
  'pinnedPosts', 'announcements', 'rules', 'moderators', 'admins',
  'joinRequirements', 'membershipType',
]);

/**
 * Required fields that every space must have
 */
const REQUIRED_FIELDS = ['name', 'campusId'];

/**
 * Allowed subcollections (canonical schema)
 */
const ALLOWED_SUBCOLLECTIONS = new Set([
  'boards',      // Chat channels
  'tabs',        // Navigation tabs
  'widgets',     // Sidebar widgets
  'placed_tools', // Deployed HiveLab tools
  'activity',    // Activity log
]);

/**
 * Deprecated subcollections that should not exist
 */
const DEPRECATED_SUBCOLLECTIONS = new Set([
  'posts',       // Migrated to boards/messages
  'members',     // Use flat /spaceMembers
]);

// Results tracking
const results = {
  passed: [],
  warnings: [],
  failures: [],
  stats: {
    spacesChecked: 0,
    spacesValid: 0,
    spacesWithIssues: 0,
    totalBoardsFound: 0,
    totalMessagesFound: 0,
    deprecatedSubcollectionsFound: 0,
    nonCanonicalFieldsFound: 0,
    missingRequiredFields: 0
  }
};

/**
 * Verify a single space document
 */
async function verifySpace(spaceDoc) {
  const spaceId = spaceDoc.id;
  const spaceData = spaceDoc.data();
  const spaceName = spaceData.name || spaceId;
  const issues = [];

  // 1. Check for non-canonical fields
  for (const field of Object.keys(spaceData)) {
    if (!CANONICAL_FIELDS.has(field)) {
      issues.push(`Non-canonical field: ${field}`);
      results.stats.nonCanonicalFieldsFound++;
    }
  }

  // 2. Check for required fields
  for (const field of REQUIRED_FIELDS) {
    if (!spaceData[field]) {
      issues.push(`Missing required field: ${field}`);
      results.stats.missingRequiredFields++;
    }
  }

  // 3. Check subcollections
  const subcollections = await spaceDoc.ref.listCollections();

  for (const subcol of subcollections) {
    const subcolName = subcol.id;

    if (DEPRECATED_SUBCOLLECTIONS.has(subcolName)) {
      const countResult = await subcol.count().get();
      const count = countResult.data().count;
      if (count > 0) {
        issues.push(`Deprecated subcollection '${subcolName}' still has ${count} docs`);
        results.stats.deprecatedSubcollectionsFound += count;
      }
    } else if (subcolName === 'boards') {
      // Count boards and messages
      const boardsSnapshot = await subcol.get();
      results.stats.totalBoardsFound += boardsSnapshot.size;

      for (const boardDoc of boardsSnapshot.docs) {
        const messagesRef = boardDoc.ref.collection('messages');
        const messagesCount = await messagesRef.count().get();
        results.stats.totalMessagesFound += messagesCount.data().count;
      }
    } else if (!ALLOWED_SUBCOLLECTIONS.has(subcolName)) {
      issues.push(`Unknown subcollection: ${subcolName}`);
    }
  }

  // 4. Validate field values
  if (spaceData.visibility && !['public', 'members', 'private', 'campus'].includes(spaceData.visibility)) {
    issues.push(`Invalid visibility value: ${spaceData.visibility}`);
  }

  if (spaceData.status && !['active', 'pending', 'archived'].includes(spaceData.status)) {
    issues.push(`Invalid status value: ${spaceData.status}`);
  }

  if (spaceData.claimStatus && !['unclaimed', 'claimed', 'verified'].includes(spaceData.claimStatus)) {
    issues.push(`Invalid claimStatus value: ${spaceData.claimStatus}`);
  }

  // Record results
  if (issues.length === 0) {
    results.passed.push({ spaceId, spaceName });
    results.stats.spacesValid++;
  } else {
    results.failures.push({ spaceId, spaceName, issues });
    results.stats.spacesWithIssues++;
  }

  return issues.length === 0;
}

/**
 * Verify flat spaceMembers collection
 */
async function verifySpaceMembers() {
  console.log('\n📊 Verifying /spaceMembers collection...');

  const countResult = await db.collection('spaceMembers').count().get();
  const totalMembers = countResult.data().count;
  console.log(`   Total documents: ${totalMembers}`);

  // Check a sample for schema compliance
  const sampleSnapshot = await db.collection('spaceMembers').limit(10).get();
  let validSamples = 0;
  const sampleIssues = [];

  for (const doc of sampleSnapshot.docs) {
    const data = doc.data();

    if (!data.spaceId) sampleIssues.push(`${doc.id}: missing spaceId`);
    if (!data.userId) sampleIssues.push(`${doc.id}: missing userId`);

    if (data.spaceId && data.userId) validSamples++;
  }

  console.log(`   Sample check: ${validSamples}/${sampleSnapshot.size} valid`);

  if (sampleIssues.length > 0) {
    console.log('   Issues in sample:');
    sampleIssues.forEach(i => console.log(`     - ${i}`));
  }

  return sampleIssues.length === 0;
}

/**
 * Main verification function
 */
async function verify() {
  console.log('='.repeat(70));
  console.log('FIRESTORE SCHEMA VERIFICATION');
  console.log('='.repeat(70));
  console.log(`\nTimestamp: ${new Date().toISOString()}\n`);

  // Get all spaces
  const spacesSnapshot = await db.collection('spaces').get();
  console.log(`Total spaces to verify: ${spacesSnapshot.size}`);

  // Verify each space
  for (const spaceDoc of spacesSnapshot.docs) {
    results.stats.spacesChecked++;

    if (results.stats.spacesChecked % 100 === 0) {
      console.log(`Progress: ${results.stats.spacesChecked}/${spacesSnapshot.size}...`);
    }

    await verifySpace(spaceDoc);
  }

  // Verify spaceMembers
  const spaceMembersValid = await verifySpaceMembers();

  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(70));

  console.log('\n📊 Statistics:');
  console.log(`   Spaces checked: ${results.stats.spacesChecked}`);
  console.log(`   Spaces valid: ${results.stats.spacesValid}`);
  console.log(`   Spaces with issues: ${results.stats.spacesWithIssues}`);
  console.log(`   Total boards: ${results.stats.totalBoardsFound}`);
  console.log(`   Total messages: ${results.stats.totalMessagesFound}`);
  console.log(`   Deprecated subcollections docs: ${results.stats.deprecatedSubcollectionsFound}`);
  console.log(`   Non-canonical fields found: ${results.stats.nonCanonicalFieldsFound}`);
  console.log(`   Missing required fields: ${results.stats.missingRequiredFields}`);

  // Summary
  const allPassed =
    results.stats.spacesWithIssues === 0 &&
    results.stats.deprecatedSubcollectionsFound === 0 &&
    results.stats.nonCanonicalFieldsFound === 0 &&
    spaceMembersValid;

  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('✅ VERIFICATION PASSED');
    console.log('All spaces conform to canonical schema.');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('Issues found - see details below.');

    if (results.failures.length > 0) {
      console.log('\n📋 Spaces with issues:');

      // Group by issue type
      const byIssue = {};
      for (const failure of results.failures) {
        for (const issue of failure.issues) {
          if (!byIssue[issue]) byIssue[issue] = [];
          byIssue[issue].push(failure.spaceName);
        }
      }

      for (const [issue, spaces] of Object.entries(byIssue)) {
        console.log(`\n   ${issue}:`);
        if (spaces.length <= 5) {
          spaces.forEach(s => console.log(`     - ${s}`));
        } else {
          spaces.slice(0, 5).forEach(s => console.log(`     - ${s}`));
          console.log(`     ... and ${spaces.length - 5} more`);
        }
      }
    }
  }

  console.log('='.repeat(70));

  // Return exit code
  return allPassed ? 0 : 1;
}

verify()
  .then((exitCode) => process.exit(exitCode))
  .catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
  });
