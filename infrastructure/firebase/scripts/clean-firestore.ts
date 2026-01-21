import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.argv[2] || 'hive-9265c';

console.log(`🧹 Cleaning Firestore database: ${projectId}\n`);

// Initialize Firebase Admin with application default credentials
initializeApp({
  credential: applicationDefault(),
  projectId,
});

const db = getFirestore();

const COLLECTIONS_TO_CLEAN = [
  'users',
  'profiles', 
  'spaces',
  'tools',
  'tool_placements',
  'handles',
  'posts',
  'comments',
  'notifications',
  'friendships',
  'connections',
  'verification_codes',
  'alumni_waitlist',
  'memberships',
  'campuses',
  'waitlist',
  'presence',
  'rituals',
  'ritual_participation',
];

async function deleteCollection(collectionPath: string, batchSize = 500) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: () => void) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function main() {
  for (const collection of COLLECTIONS_TO_CLEAN) {
    try {
      const snapshot = await db.collection(collection).limit(1).get();
      if (!snapshot.empty) {
        console.log(`  Deleting ${collection}...`);
        await deleteCollection(collection);
        console.log(`  ✓ Deleted ${collection}`);
      } else {
        console.log(`  - ${collection} (empty)`);
      }
    } catch (error: any) {
      console.log(`  ⚠ ${collection}: ${error.message}`);
    }
  }

  console.log('\n✅ Database cleanup complete!');
}

main().catch(console.error);
