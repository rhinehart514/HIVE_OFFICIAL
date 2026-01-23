/**
 * Script to set up a specific access code
 * Run with: npx tsx --env-file=apps/web/.env.local scripts/setup-access-code.ts
 */

import * as admin from 'firebase-admin';
import { createHash } from 'crypto';

const TARGET_CODE = '716514';

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
    throw new Error('No Firebase credentials found');
  }

  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
  });

  return admin.firestore();
}

function hashCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

async function main() {
  console.log('🔐 Setting up access code...\n');

  const db = initFirebase();
  console.log('✅ Firebase Admin initialized\n');

  // Delete all existing access codes
  const codesSnapshot = await db.collection('access_codes').get();
  if (!codesSnapshot.empty) {
    console.log(`🗑️  Deleting ${codesSnapshot.size} existing access codes...`);
    const batch = db.batch();
    codesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log('  ✅ Deleted\n');
  }

  // Create the specific access code
  const codeHash = hashCode(TARGET_CODE);

  await db.collection('access_codes').add({
    codeHash,
    active: true,
    createdAt: new Date(),
    createdBy: 'system',
    notes: 'Primary entry code',
    useCount: 0,
    lastUsed: null,
  });

  console.log(`✅ Access code "${TARGET_CODE}" is now the only valid code\n`);
  console.log('🎉 Setup complete!');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
