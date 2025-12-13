#!/usr/bin/env node
/**
 * Delete All Archive Messages
 *
 * Deletes all messages from archive boards (the RSS-imported event posts).
 * Also optionally deletes the empty archive boards afterward.
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
  archiveBoardsFound: 0,
  messagesDeleted: 0,
  boardsDeleted: 0,
  errors: []
};

async function deleteArchiveMessages(spaceDoc) {
  const spaceId = spaceDoc.id;
  const spaceName = spaceDoc.data().name || spaceId;

  const boardsRef = db.collection('spaces').doc(spaceId).collection('boards');
  const boardsSnapshot = await boardsRef.get();

  for (const boardDoc of boardsSnapshot.docs) {
    // Only process archive boards
    if (!boardDoc.id.includes('archive')) {
      continue;
    }

    stats.archiveBoardsFound++;
    const messagesRef = boardDoc.ref.collection('messages');
    const messagesSnapshot = await messagesRef.get();

    if (messagesSnapshot.empty) {
      continue;
    }

    console.log(`\n📁 ${spaceName}: ${messagesSnapshot.size} messages in archive`);

    if (!DRY_RUN) {
      // Delete all messages in batches
      const batch = db.batch();
      let batchCount = 0;

      for (const messageDoc of messagesSnapshot.docs) {
        batch.delete(messageDoc.ref);
        batchCount++;
        stats.messagesDeleted++;

        // Firestore batch limit is 500
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      // Delete the archive board itself
      await boardDoc.ref.delete();
      stats.boardsDeleted++;
      console.log(`   Deleted ${messagesSnapshot.size} messages and archive board`);
    } else {
      stats.messagesDeleted += messagesSnapshot.size;
      stats.boardsDeleted++;
      console.log(`   Would delete ${messagesSnapshot.size} messages and archive board`);
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('DELETE ALL ARCHIVE MESSAGES');
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
      await deleteArchiveMessages(spaceDoc);
    } catch (error) {
      stats.errors.push({ spaceId: spaceDoc.id, error: error.message });
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('DELETION SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nSpaces processed: ${stats.spacesProcessed}`);
  console.log(`Archive boards found: ${stats.archiveBoardsFound}`);
  console.log(`Messages deleted: ${stats.messagesDeleted}`);
  console.log(`Boards deleted: ${stats.boardsDeleted}`);
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
