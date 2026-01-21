#!/usr/bin/env tsx

/**
 * Access Code Management - View and Manage
 *
 * Usage:
 *   pnpm tsx scripts/access-codes-manage.ts list
 *   pnpm tsx scripts/access-codes-manage.ts disable 123456
 *   pnpm tsx scripts/access-codes-manage.ts remove 123456
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';

// Firebase config from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

/**
 * List all access codes
 */
async function listCodes() {
  console.log('🔑 Access Codes\n');

  const snapshot = await getDocs(collection(db, 'access_codes'));

  if (snapshot.empty) {
    console.log('(no codes yet)');
    console.log('');
    console.log('Create codes with:');
    console.log('  pnpm tsx scripts/access-codes-add.ts --count 5');
    return;
  }

  const entries = snapshot.docs.map((doc) => ({
    code: doc.id,
    ...doc.data(),
  }));

  // Sort by createdAt
  entries.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  console.log(`Total: ${entries.length} code(s)\n`);

  entries.forEach((entry, i) => {
    const status = entry.active ? '✓ Active' : '✗ Inactive';
    const createdAt =
      entry.createdAt?.toDate?.()?.toLocaleDateString() || 'unknown';
    const useCount = entry.useCount || 0;
    const lastUsed = entry.lastUsed
      ? entry.lastUsed.toDate?.()?.toLocaleString()
      : 'never';
    const notes = entry.notes || '';

    console.log(`${i + 1}. ${entry.code}`);
    console.log(`   ${status} | Created: ${createdAt} | By: ${entry.createdBy || 'unknown'}`);
    console.log(`   Used: ${useCount} time(s) | Last used: ${lastUsed}`);
    if (notes) {
      console.log(`   Notes: ${notes}`);
    }
    console.log('');
  });
}

/**
 * Remove code (permanent delete)
 */
async function removeCode(code: string) {
  const docRef = doc(db, 'access_codes', code);

  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.log(`⚠️  Code not found: ${code}`);
    return;
  }

  await deleteDoc(docRef);
  console.log(`✓ Removed code: ${code}`);
}

/**
 * Disable code (soft delete - keeps record)
 */
async function disableCode(code: string) {
  const docRef = doc(db, 'access_codes', code);

  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.log(`⚠️  Code not found: ${code}`);
    return;
  }

  await updateDoc(docRef, {
    active: false,
    disabledAt: new Date(),
  });
  console.log(`✓ Disabled code: ${code}`);
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  pnpm tsx scripts/access-codes-manage.ts list');
    console.log('  pnpm tsx scripts/access-codes-manage.ts remove 123456');
    console.log('  pnpm tsx scripts/access-codes-manage.ts disable 123456');
    process.exit(1);
  }

  switch (command) {
    case 'list':
      await listCodes();
      break;

    case 'remove':
      if (!args[1]) {
        console.error('❌ Code required');
        process.exit(1);
      }
      await removeCode(args[1]);
      break;

    case 'disable':
      if (!args[1]) {
        console.error('❌ Code required');
        process.exit(1);
      }
      await disableCode(args[1]);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
