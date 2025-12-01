#!/usr/bin/env node
/**
 * Clear Users Script
 * Deletes all users from Firestore and Firebase Auth for fresh testing
 *
 * Usage: node tooling/scripts/clear-users.mjs
 */

import admin from 'firebase-admin';

// Firebase configuration
const FIREBASE_PROJECT_ID = 'hive-9265c';
const FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@hive-9265c.iam.gserviceaccount.com';
const FIREBASE_PRIVATE_KEY_BASE64 = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQ3BYc1B1MXRuY2ZRWHEKM1U1RTd6ZzYxZmIvTUVoNHhjdDlOaytzaU8yRjlXa09ON0xqYnN0aVprR1JIOXNuSGF5K0RzdGxPaUNZeHNONwowU3dEajdxd2kzZURHcG1rL0ZWN2gxQUF2SitiQXhPSndaajNsZFFjaUNhNzNqV0pLTVVqZkphVDhHcXlmbm9DClpYZit6aHI1UXdsUlpuNjkwdFNRQStWT2JWSytjcC9VR3JXamRwVWtqbFhNaHVpdys2QnhMSDAzL0pQZUhpeXIKMHE3MlYzSENIOFJZeVB2b0tldkh2VUhCbVdEUDd4NkliQUxLVUNON3NvdlNGUjQ5RjAxRkNQWDJhZVhnRWRIOApnMnNrRnNJeDRKVnJiSkduYkl4ZUhXWVBOWUhHYjdPS01uSVo3YnpvUUkrNEJjRXFyTHNMVlNlZ3V3QkExdzVtCkZTcVJsYmsxQWdNQkFBRUNnZ0VBQWU3ZTlaN21KYW9Yb3pLYmJoWDg0azhHM3FyQ2FQNTQ4QmpxbCtHSU5IczAKazhEMi9ibUtBTG1DRGhIN0FsdElXWEw1eDFIK2hUL2ZnMDVEM2xhSm52STRqdnFDdm10UzNuSVE2N0U3Y1IxNwozNXFpRUZGWmRtbm5aMFdGL3ViRU9UOTJ5SUY1OWtlVFJPdTdqdUR6VmR6NkFqL1ZPbjFwaDZ0RHRyMXdzRlBCCjA5Nk01MXQ2REp1a1lPdlJRS0VRckk4K0JHcmhuZkpLMmRDeUU5b2JKZ3VwMW1TNUJPNzlDQ1FmK3ZTbmM0cngKMkVUTk4rajdzOEwwQittVFhBNDlra3pmSlNKNlVIYWFEOGZWTDhkQnVaL3oxQ0VTdXZIVm1BNk5vOHg5aGozVgowUDVIZ0MxZDIvT3E1aEo5dTBXQkZoT1Mzdkk5RmpmcjZMY0FMZ0dPa1FLQmdRRGVJUk5UdFA5U29ub3NoTkFnCkFZZndja0RDZGdnUEFTUXJOV2RqanlKa0pyZWxiZUJUSE9vK1hpbWpWNml6aXNxL0lIQVhkUW4zZE5WTmlsSlQKMTBBMmwrTi9lRGtZZC9OVGZtQTcrMExQOXhQdDcyRGlVYUJEN0RiT0dlR3pXaURtVFcyc3BkRFN6RDZFSTZFZApwdHVVcDJjbGpjam1IMmhHSFptM0xKWE1ld0tCZ1FERE1qY0lTMjB5RFNMaDVuTDF0WUR1YWJydTVUMi9jam9UCk9QaFdLdWk3YW9lbHZqbWhZZFdYem54TjlWd0F0ZktkUjVkNWRyN0dkNVRDRjB2d0s4dVVjQk1yNFpJd1ZnSkEKRXJWVm44Y2NYZEdoK3cxeHVZcGpMV2F5aUhMWEVpeU9xa0V1Qmt3aHlWaXZReVc3amFsVHRkZkh0dGdVZjR3cwpBRXlaWWFyYUR3S0JnUURDK1R0U3JUdXpsK1F2Y1lDUnAyWmdHcGxYVjIwcFpuSU43emxKL1ZoTm1tSjJOYVRDCnIwMjQ0c1FmbVJEK1QyUTVNVXJTZkN2OFpqUFlkUUpnano3UTdLK0dzc3RDKy82OEdlQjBwYzUyWnNTNmcvU0IKa3U1ZTBGY212emNLUzZFM0pWMlFQcGUyZ0FxYngvNWkzWlE5dmxiZWNyNlZwNW5LZWE3MFJwRlNRd0tCZ1FDKwp0ckZPU1dQSEkwNlJxTGRwbW96K1pBOWdtbHBhVXlDcTUxNjcwZkRTTEtPY0xOL2g3ZFRqSGJ3VjcwU1U3VEMrCnV0UWt1UUJzcVNtTytYUVlsTEd6dGswRThzQUN1Z1k0MUE2WU9pUXdjdm4vYVdzWlVrOEQxN2dmZDNHODhPVFgKLzBEdjF2ZExpNDQ2cjBDT256cHhyNW5FWjhGM1JhZU8xandCSUl2dHdRS0JnRzNXdlFUWU53OUpvMXRLblFKaQpMellFWkhUdWliSUNBcmdOaithRjFyQjR5Q3VmNVg4aFVkajExa0tJcGlkdEZqb3JuOTVtenprdEtza2JJRnBBCitGN1p3ekloRGNsT0R2TFdteFZMSmVWQUpwOXhLVUptZjVlWEJweTdkRHA0Z2x6UXcxSG5DK3RuR2hmNmJvcU0KdEx0VU9tWCtYYk1BcVJIY3NqclFJUXJICi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0KCg==';

// Decode the private key
const privateKey = Buffer.from(FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    projectId: FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function clearUsers() {
  console.log('Starting user cleanup...\n');

  // 1. Clear Firestore users collection
  console.log('1. Clearing Firestore users collection...');
  try {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    if (usersSnapshot.empty) {
      console.log('   No users found in Firestore.');
    } else {
      const batch = db.batch();
      let count = 0;

      usersSnapshot.docs.forEach((doc) => {
        console.log(`   - Deleting user: ${doc.id}`);
        batch.delete(doc.ref);
        count++;
      });

      await batch.commit();
      console.log(`   Deleted ${count} users from Firestore.\n`);
    }
  } catch (error) {
    console.error('   Error clearing Firestore users:', error.message);
  }

  // 2. Clear Firebase Auth users
  console.log('2. Clearing Firebase Auth users...');
  try {
    const listUsersResult = await auth.listUsers(1000);

    if (listUsersResult.users.length === 0) {
      console.log('   No users found in Firebase Auth.');
    } else {
      const uids = listUsersResult.users.map((user) => user.uid);
      console.log(`   Found ${uids.length} users in Firebase Auth.`);

      for (const uid of uids) {
        try {
          const user = listUsersResult.users.find(u => u.uid === uid);
          console.log(`   - Deleting auth user: ${user?.email || uid}`);
          await auth.deleteUser(uid);
        } catch (err) {
          console.error(`   - Failed to delete ${uid}:`, err.message);
        }
      }
      console.log(`   Deleted ${uids.length} users from Firebase Auth.\n`);
    }
  } catch (error) {
    console.error('   Error clearing Firebase Auth users:', error.message);
  }

  // 3. Clear related collections
  const relatedCollections = ['handles', 'sessions', 'profiles'];

  for (const collectionName of relatedCollections) {
    console.log(`3. Clearing ${collectionName} collection...`);
    try {
      const collRef = db.collection(collectionName);
      const snapshot = await collRef.get();

      if (snapshot.empty) {
        console.log(`   No documents found in ${collectionName}.`);
      } else {
        const batch = db.batch();
        let count = 0;

        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          count++;
        });

        await batch.commit();
        console.log(`   Deleted ${count} documents from ${collectionName}.\n`);
      }
    } catch (error) {
      console.error(`   Error clearing ${collectionName}:`, error.message);
    }
  }

  console.log('User cleanup complete!');
  process.exit(0);
}

clearUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
