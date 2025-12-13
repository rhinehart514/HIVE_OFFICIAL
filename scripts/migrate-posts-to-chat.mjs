#!/usr/bin/env node
/**
 * Migrate Posts to Chat Messages
 *
 * This script migrates the orphaned posts from /spaces/{id}/posts subcollection
 * to the new chat board structure at /spaces/{id}/boards/{boardId}/messages
 *
 * Posts ARE chat messages that were never migrated when architecture shifted to chat-first.
 *
 * Migration mapping:
 * - post.content → message.content
 * - post.authorId → message.authorId
 * - post.createdAt → message.timestamp
 * - post.reactions → message.reactions (converted format)
 * - post.comments → separate messages with replyToId
 *
 * Usage:
 *   node scripts/migrate-posts-to-chat.mjs           # Dry run (preview)
 *   node scripts/migrate-posts-to-chat.mjs --execute # Actually run migration
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

// Stats tracking
const stats = {
  spacesProcessed: 0,
  spacesWithPosts: 0,
  postsFound: 0,
  messagesMigrated: 0,
  commentsConverted: 0,
  boardsCreated: 0,
  errors: [],
  skipped: []
};

/**
 * Convert old post reactions format to new chat message format
 * Old: { [emoji]: userId[] } or { [emoji]: count }
 * New: { emoji, count, userIds }[]
 */
function convertReactions(oldReactions) {
  if (!oldReactions || typeof oldReactions !== 'object') {
    return [];
  }

  const newReactions = [];
  for (const [emoji, value] of Object.entries(oldReactions)) {
    if (Array.isArray(value)) {
      // Format: { emoji: [userId1, userId2] }
      newReactions.push({
        emoji,
        count: value.length,
        userIds: value
      });
    } else if (typeof value === 'number') {
      // Format: { emoji: count } (no user tracking)
      newReactions.push({
        emoji,
        count: value,
        userIds: []
      });
    } else if (typeof value === 'object' && value.userIds) {
      // Already in new format
      newReactions.push({
        emoji,
        count: value.count || value.userIds.length,
        userIds: value.userIds
      });
    }
  }
  return newReactions;
}

/**
 * Convert a post document to chat message format
 */
function postToMessage(post, boardId, spaceId, replyToId = null) {
  const timestamp = post.createdAt?.toDate?.() || post.createdAt || new Date();

  return {
    boardId,
    spaceId,
    authorId: post.authorId || post.userId || 'unknown',
    authorName: post.authorName || post.displayName || 'Unknown User',
    authorAvatarUrl: post.authorAvatarUrl || post.photoURL || null,
    authorRole: post.authorRole || null,
    type: 'text',
    content: post.content || post.text || post.body || '',
    timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
    editedAt: post.editedAt?.toDate?.() || post.editedAt || null,
    reactions: convertReactions(post.reactions),
    replyToId,
    threadCount: 0,
    isDeleted: post.isDeleted || false,
    isPinned: post.isPinned || post.pinned || false,
    // Track migration source
    _migratedFrom: 'posts',
    _originalPostId: post.id,
    _migrationDate: new Date().toISOString()
  };
}

/**
 * Ensure a board exists for the space, create "archive" board if needed
 */
async function ensureArchiveBoard(spaceId) {
  const boardsRef = db.collection('spaces').doc(spaceId).collection('boards');
  const boardId = `${spaceId}_archive`;

  const existingBoard = await boardsRef.doc(boardId).get();
  if (existingBoard.exists) {
    return boardId;
  }

  // Check if general board exists
  const generalBoard = await boardsRef.doc(`${spaceId}_general`).get();
  if (generalBoard.exists) {
    // Use general board for migrated posts
    return `${spaceId}_general`;
  }

  // Create archive board for migrated posts
  if (!DRY_RUN) {
    await boardsRef.doc(boardId).set({
      id: boardId,
      name: 'Archive',
      type: 'general',
      description: 'Archived posts migrated from old feed system',
      order: 99,
      isDefault: false,
      canPost: 'members',
      canReact: 'all',
      messageCount: 0,
      participantCount: 0,
      createdBy: 'system',
      createdAt: new Date(),
      isArchived: false,
      isLocked: false,
      pinnedMessageIds: []
    });
    stats.boardsCreated++;
  }

  return boardId;
}

/**
 * Migrate posts for a single space
 */
async function migrateSpacePosts(spaceDoc) {
  const spaceId = spaceDoc.id;
  const spaceName = spaceDoc.data().name || spaceId;

  const postsRef = db.collection('spaces').doc(spaceId).collection('posts');
  const postsSnapshot = await postsRef.get();

  if (postsSnapshot.empty) {
    return;
  }

  stats.spacesWithPosts++;
  const postCount = postsSnapshot.size;
  console.log(`\n📁 ${spaceName} (${spaceId}): ${postCount} posts`);

  // Ensure board exists
  const boardId = await ensureArchiveBoard(spaceId);
  const messagesRef = db.collection('spaces').doc(spaceId).collection('boards').doc(boardId).collection('messages');

  let migratedCount = 0;
  let commentCount = 0;

  for (const postDoc of postsSnapshot.docs) {
    const post = { id: postDoc.id, ...postDoc.data() };
    stats.postsFound++;

    // Check if already migrated
    if (post.migrated === true) {
      stats.skipped.push(`${spaceId}/${post.id}: already migrated`);
      continue;
    }

    // Skip empty posts
    const content = post.content || post.text || post.body || '';
    if (!content && !post.reactions) {
      stats.skipped.push(`${spaceId}/${post.id}: empty content`);
      continue;
    }

    // Convert post to message
    const messageData = postToMessage(post, boardId, spaceId);
    const messageId = `migrated_${postDoc.id}`;

    if (!DRY_RUN) {
      // Create the message
      await messagesRef.doc(messageId).set(messageData);

      // Handle comments as replies
      if (post.comments && Array.isArray(post.comments)) {
        for (let i = 0; i < post.comments.length; i++) {
          const comment = post.comments[i];
          const replyData = postToMessage(comment, boardId, spaceId, messageId);
          const replyId = `${messageId}_reply_${i}`;
          await messagesRef.doc(replyId).set(replyData);
          commentCount++;
        }
      }

      // Check for comments subcollection
      const commentsSubcol = await postDoc.ref.collection('comments').get();
      if (!commentsSubcol.empty) {
        for (const commentDoc of commentsSubcol.docs) {
          const comment = { id: commentDoc.id, ...commentDoc.data() };
          const replyData = postToMessage(comment, boardId, spaceId, messageId);
          const replyId = `${messageId}_reply_${commentDoc.id}`;
          await messagesRef.doc(replyId).set(replyData);
          commentCount++;
        }
      }

      // Mark original post as migrated
      await postDoc.ref.update({
        migrated: true,
        migratedAt: FieldValue.serverTimestamp(),
        migratedToBoard: boardId,
        migratedToMessage: messageId
      });

      migratedCount++;
      stats.messagesMigrated++;
    } else {
      // Dry run - just count
      migratedCount++;
      stats.messagesMigrated++;

      if (post.comments && Array.isArray(post.comments)) {
        commentCount += post.comments.length;
      }
    }
  }

  stats.commentsConverted += commentCount;
  console.log(`   ✅ Migrated: ${migratedCount} posts, ${commentCount} comments → board: ${boardId}`);

  // Update board message count
  if (!DRY_RUN && migratedCount > 0) {
    const boardRef = db.collection('spaces').doc(spaceId).collection('boards').doc(boardId);
    await boardRef.update({
      messageCount: FieldValue.increment(migratedCount + commentCount)
    });
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('='.repeat(70));
  console.log('POSTS → CHAT MESSAGES MIGRATION');
  console.log('='.repeat(70));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Run with --execute to perform actual migration\n');
  } else {
    console.log('\n🚀 EXECUTING MIGRATION - Changes will be permanent!\n');
  }

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
      await migrateSpacePosts(spaceDoc);
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
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nSpaces processed: ${stats.spacesProcessed}`);
  console.log(`Spaces with posts: ${stats.spacesWithPosts}`);
  console.log(`Posts found: ${stats.postsFound}`);
  console.log(`Messages migrated: ${stats.messagesMigrated}`);
  console.log(`Comments converted: ${stats.commentsConverted}`);
  console.log(`Boards created: ${stats.boardsCreated}`);
  console.log(`Skipped: ${stats.skipped.length}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.skipped.length > 0 && stats.skipped.length <= 10) {
    console.log('\nSkipped items:');
    stats.skipped.forEach(s => console.log(`  - ${s}`));
  } else if (stats.skipped.length > 10) {
    console.log(`\nFirst 10 skipped:`);
    stats.skipped.slice(0, 10).forEach(s => console.log(`  - ${s}`));
    console.log(`  ... and ${stats.skipped.length - 10} more`);
  }

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(e => console.log(`  - ${e.spaceId}: ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n' + '='.repeat(70));
    console.log('DRY RUN COMPLETE');
    console.log('Run with --execute to perform actual migration');
    console.log('='.repeat(70));
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(70));
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  });
