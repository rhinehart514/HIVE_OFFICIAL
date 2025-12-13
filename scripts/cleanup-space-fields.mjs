#!/usr/bin/env node
/**
 * Cleanup Non-Standard Space Fields
 *
 * This script removes non-standard fields from space documents to enforce
 * the canonical schema. Based on audit findings of ~1,121 unexpected field
 * instances across 685 spaces.
 *
 * Canonical Schema Fields (KEEP):
 * - Identity: id, name, description, slug
 * - Classification: category, campusId
 * - State: isActive, visibility, status, claimStatus
 * - Ownership: createdBy, createdAt, updatedAt
 * - Source: source, sourceId
 * - Media: logoUrl, bannerUrl
 * - Counts: memberCount
 * - Configuration: settings, tags
 *
 * Usage:
 *   node scripts/cleanup-space-fields.mjs           # Dry run (preview)
 *   node scripts/cleanup-space-fields.mjs --execute # Actually run cleanup
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

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

/**
 * Canonical fields that should be kept on space documents.
 * Any field NOT in this set will be deleted.
 */
const CANONICAL_FIELDS = new Set([
  // Identity
  'id',
  'name',
  'description',
  'slug',

  // Classification
  'category',
  'campusId',
  'type', // Alias for category in some spaces

  // State
  'isActive',
  'visibility',
  'status',
  'claimStatus',
  'claimedBy',
  'claimedAt',
  'isVerified',
  'verifiedAt',

  // Ownership
  'createdBy',
  'createdAt',
  'updatedAt',
  'ownerId', // Alias for createdBy
  'leaderId', // Primary leader reference

  // Source (CampusLabs import)
  'source',
  'sourceId',
  'sourceUrl',

  // Media
  'logoUrl',
  'bannerUrl',
  'imageUrl', // Alias for logoUrl

  // Counts (denormalized)
  'memberCount',

  // Configuration
  'settings',
  'tags',
  'metadata', // Generic metadata container

  // Contact/Social
  'socialLinks',
  'contactEmail',
  'website',
  'location',
  'meetingSchedule',

  // Features (used by frontend)
  'features',
  'widgets',
  'tabs',
  'tools',

  // Moderation
  'pinnedPosts',
  'announcements',
  'rules',
  'moderators',
  'admins',

  // Membership
  'joinRequirements',
  'membershipType',
]);

/**
 * Fields that are known garbage and should definitely be deleted.
 * Documented in the plan from audit findings.
 */
const DEFINITELY_DELETE = new Set([
  'name_lowercase',      // 402 spaces - redundant
  'metrics',             // 402 spaces - denormalized scoring garbage
  'memberRoles',         // 283 spaces - redundant with spaceMembers collection
  'subType',             // 7 spaces - unused null values
  'isPrivate',           // 7 spaces - use visibility field
  'schoolId',            // 1 space - use campusId
  'joinPolicy',          // 1 space - use settings.joinPolicy
  'onlineCount',         // 1 space - compute from presence
  'activityLevel',       // 1 space - compute from activity
  'anxietyReliefScore',  // 1 space - experimental garbage
  'socialProofScore',    // 1 space - experimental garbage
  'insiderAccessScore',  // 1 space - experimental garbage
  'joinToActiveRate',    // 1 space - analytics, not schema
  'promotedPostsToday',  // 1 space - posts removed
  'autoPromotionEnabled',// 1 space - posts removed
  'iconUrl',             // 1 space - use logoUrl
  'lastActivity',        // 1 space - compute from boards
  'leaders',             // 1 space - use spaceMembers with role
  'trendingScore',       // 1 space - compute on read
  'creatorId',           // 1 space - use createdBy
  'lastActivityAt',      // 1 space - compute from boards
  'rushModeEnabled',     // 1 space - greek-specific, use settings
  'postCount',           // 1 space - posts removed
  'rushModeEndDate',     // 1 space - greek-specific, use settings
  'memberIds',           // 1 space - use spaceMembers collection
]);

// Stats tracking
const stats = {
  spacesProcessed: 0,
  spacesModified: 0,
  fieldsRemoved: 0,
  fieldsByType: {},
  errors: []
};

/**
 * Clean a single space document
 */
async function cleanSpaceDocument(spaceDoc) {
  const spaceId = spaceDoc.id;
  const spaceData = spaceDoc.data();
  const spaceName = spaceData.name || spaceId;

  const fieldsToRemove = [];

  for (const field of Object.keys(spaceData)) {
    // Check if field should be removed
    if (!CANONICAL_FIELDS.has(field)) {
      fieldsToRemove.push(field);

      // Track stats
      stats.fieldsByType[field] = (stats.fieldsByType[field] || 0) + 1;
    }
  }

  if (fieldsToRemove.length === 0) {
    return false; // No changes needed
  }

  console.log(`\n📁 ${spaceName} (${spaceId})`);
  console.log(`   Removing ${fieldsToRemove.length} fields: ${fieldsToRemove.join(', ')}`);

  if (!DRY_RUN) {
    // Build update object with FieldValue.delete() for each field
    const updates = {};
    for (const field of fieldsToRemove) {
      updates[field] = FieldValue.delete();
    }

    await spaceDoc.ref.update(updates);
    stats.spacesModified++;
    stats.fieldsRemoved += fieldsToRemove.length;
  } else {
    stats.spacesModified++;
    stats.fieldsRemoved += fieldsToRemove.length;
  }

  return true;
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('='.repeat(70));
  console.log('SPACE FIELDS CLEANUP');
  console.log('='.repeat(70));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Run with --execute to perform actual cleanup\n');
  } else {
    console.log('\n🚀 EXECUTING CLEANUP - Changes will be permanent!\n');
  }

  console.log(`Canonical fields (${CANONICAL_FIELDS.size}): ${Array.from(CANONICAL_FIELDS).slice(0, 10).join(', ')}...`);
  console.log(`Known garbage fields to delete: ${DEFINITELY_DELETE.size}\n`);

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
      await cleanSpaceDocument(spaceDoc);
    } catch (error) {
      stats.errors.push({
        spaceId: spaceDoc.id,
        error: error.message
      });
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nSpaces processed: ${stats.spacesProcessed}`);
  console.log(`Spaces modified: ${stats.spacesModified}`);
  console.log(`Total fields removed: ${stats.fieldsRemoved}`);
  console.log(`Errors: ${stats.errors.length}`);

  // Field breakdown
  if (Object.keys(stats.fieldsByType).length > 0) {
    console.log('\nFields removed by type:');
    const sortedFields = Object.entries(stats.fieldsByType)
      .sort((a, b) => b[1] - a[1]);

    for (const [field, count] of sortedFields) {
      const isKnownGarbage = DEFINITELY_DELETE.has(field) ? ' (known garbage)' : '';
      console.log(`  ${field}: ${count}${isKnownGarbage}`);
    }
  }

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(e => console.log(`  - ${e.spaceId}: ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n' + '='.repeat(70));
    console.log('DRY RUN COMPLETE');
    console.log('Run with --execute to perform actual cleanup');
    console.log('='.repeat(70));
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('CLEANUP COMPLETE');
    console.log('='.repeat(70));
  }
}

cleanup()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  });
