/**
 * Delete test user from Firebase Auth and Firestore
 * Run with: NODE_OPTIONS="" node scripts/delete-test-user.mjs <email>
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get email from command line
const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/delete-test-user.mjs <email>');
  process.exit(1);
}

// Load env file
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const serviceAccount = envVars.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
  process.exit(1);
}

try {
  const credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));

  initializeApp({
    credential: cert(credentials),
    projectId: 'hive-9265c'
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

const db = getFirestore();
const auth = getAuth();

async function deleteUser(email) {
  console.log(`\nDeleting user: ${email}\n`);

  // 1. Get user from Firebase Auth
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`Found Firebase Auth user: ${userRecord.uid}`);
  } catch (error) {
    console.log('User not found in Firebase Auth');
  }

  // 2. Delete from Firestore
  if (userRecord) {
    try {
      await db.collection('users').doc(userRecord.uid).delete();
      console.log(`✅ Deleted Firestore user document: ${userRecord.uid}`);
    } catch (error) {
      console.log('No Firestore document found or delete failed');
    }

    // 3. Delete from Firebase Auth
    try {
      await auth.deleteUser(userRecord.uid);
      console.log(`✅ Deleted Firebase Auth user: ${userRecord.uid}`);
    } catch (error) {
      console.error('Failed to delete from Firebase Auth:', error);
    }
  }

  // 4. Also check for any profiles by email
  try {
    const profilesSnap = await db.collection('users').where('email', '==', email).get();
    if (!profilesSnap.empty) {
      for (const doc of profilesSnap.docs) {
        await doc.ref.delete();
        console.log(`✅ Deleted additional profile: ${doc.id}`);
      }
    }
  } catch (error) {
    console.log('No additional profiles found');
  }

  console.log('\n✅ User cleanup complete!');
}

deleteUser(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Delete failed:', error);
    process.exit(1);
  });
