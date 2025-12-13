#!/usr/bin/env node
/**
 * Delete Migrated Posts
 *
 * Deletes posts that were successfully migrated to chat messages.
 * Only deletes posts with migrated: true flag.
 *
 * Usage:
 *   node scripts/delete-migrated-posts.mjs           # Dry run
 *   node scripts/delete-migrated-posts.mjs --execute # Delete
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

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

const stats = {
  spacesProcessed: 0,
  spacesWithPosts: 0,
  postsFound: 0,
  postsDeleted: 0,
  postsSkipped: 0,
  errors: []
};

async function deleteSpacePosts(spaceDoc) {
  const spaceId = spaceDoc.id;
  const spaceName = spaceDoc.data().name || spaceId;

  const postsRef = db.collection('spaces').doc(spaceId).collection('posts');
  const postsSnapshot = await postsRef.get();

  if (postsSnapshot.empty) {
    return;
  }

  stats.spacesWithPosts++;
  console.log(`\n📁 ${spaceName} (${spaceId}): ${postsSnapshot.size} posts`);

  let deleted = 0;
  let skipped = 0;

  for (const postDoc of postsSnapshot.docs) {
    const postData = postDoc.data();
    stats.postsFound++;

    // Only delete if migrated
    if (postData.migrated === true) {
      if (!DRY_RUN) {
        // Delete any comments subcollection first
        const commentsRef = postDoc.ref.collection('comments');
        const commentsSnapshot = await commentsRef.get();
        for (const commentDoc of commentsSnapshot.docs) {
          await commentDoc.ref.delete();
        }

        await postDoc.ref.delete();
      }
      deleted++;
      stats.postsDeleted++;
    } else {
      skipped++;
      stats.postsSkipped++;
    }
  }

  console.log(`   ${DRY_RUN ? 'Would delete' : 'Deleted'}: ${deleted}, Skipped (not migrated): ${skipped}`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('DELETE MIGRATED POSTS');
  console.log('='.repeat(70));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Run with --execute to perform deletion\n');
  } else {
    console.log('\n🚀 EXECUTING DELETION\n');
  }

  const spacesSnapshot = await db.collection('spaces').get();
  console.log(`Total spaces to check: ${spacesSnapshot.size}`);

  for (const spaceDoc of spacesSnapshot.docs) {
    stats.spacesProcessed++;

    if (stats.spacesProcessed % 100 === 0) {
      console.log(`\nProgress: ${stats.spacesProcessed}/${spacesSnapshot.size}...`);
    }

    try {
      await deleteSpacePosts(spaceDoc);
    } catch (error) {
      stats.errors.push({ spaceId: spaceDoc.id, error: error.message });
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('DELETION SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nSpaces processed: ${stats.spacesProcessed}`);
  console.log(`Spaces with posts: ${stats.spacesWithPosts}`);
  console.log(`Posts found: ${stats.postsFound}`);
  console.log(`Posts deleted: ${stats.postsDeleted}`);
  console.log(`Posts skipped (not migrated): ${stats.postsSkipped}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(e => console.log(`  - ${e.spaceId}: ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n' + '='.repeat(70));
    console.log('DRY RUN COMPLETE');
    console.log('Run with --execute to perform deletion');
    console.log('='.repeat(70));
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('DELETION COMPLETE');
    console.log('='.repeat(70));
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Failed:', e);
    process.exit(1);
  });
