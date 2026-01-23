/**
 * Script to delete all users from Firestore
 * Run with: npx tsx --env-file=apps/web/.env.local scripts/delete-all-users.ts
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin from environment variables
function initFirebase() {
  if (admin.apps.length) {
    return admin.firestore();
  }

  let credential: admin.credential.Credential | undefined;

  if (process.env.FIREBASE_PRIVATE_KEY_BASE64 && process.env.FIREBASE_CLIENT_EMAIL) {
    const decodedKey = Buffer.from(
      process.env.FIREBASE_PRIVATE_KEY_BASE64,
      'base64'
    ).toString('utf-8');
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: decodedKey,
    });
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    throw new Error('No Firebase credentials found. Set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL');
  }

  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
  });

  return admin.firestore();
}

async function deleteCollection(db: admin.firestore.Firestore, collectionName: string) {
  const ref = db.collection(collectionName);
  const snapshot = await ref.get();

  if (snapshot.empty) {
    console.log(`  ${collectionName}: No documents found`);
    return 0;
  }

  console.log(`\n🗑️  Deleting ${snapshot.size} documents from ${collectionName}...`);

  const batchSize = 500;
  const docs = snapshot.docs;
  let deleted = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + batchSize);

    for (const doc of chunk) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    deleted += chunk.length;
  }

  console.log(`  ✅ Deleted ${deleted} from ${collectionName}`);
  return deleted;
}

async function main() {
  console.log('🚀 Starting database cleanup...\n');

  try {
    const db = initFirebase();
    console.log('✅ Firebase Admin initialized\n');

    // Delete users and related collections
    const collections = ['users', 'sessions', 'profiles'];
    let totalDeleted = 0;

    for (const collection of collections) {
      totalDeleted += await deleteCollection(db, collection);
    }

    console.log(`\n🎉 Database cleanup complete! Deleted ${totalDeleted} total documents.`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
