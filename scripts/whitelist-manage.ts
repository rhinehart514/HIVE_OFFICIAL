#!/usr/bin/env tsx

/**
 * Whitelist Management Script - View and Remove
 *
 * Usage:
 *   pnpm tsx scripts/whitelist-manage.ts list
 *   pnpm tsx scripts/whitelist-manage.ts remove email@buffalo.edu
 *   pnpm tsx scripts/whitelist-manage.ts disable email@buffalo.edu
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
 * List all whitelisted emails
 */
async function listWhitelist() {
  console.log('📋 Access Whitelist\n');

  const snapshot = await getDocs(collection(db, 'access_whitelist'));

  if (snapshot.empty) {
    console.log('(empty)');
    return;
  }

  const entries = snapshot.docs.map((doc) => ({
    email: doc.id,
    ...doc.data(),
  }));

  // Sort by addedAt
  entries.sort((a, b) => {
    const aTime = a.addedAt?.toMillis?.() || 0;
    const bTime = b.addedAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  console.log(`Total: ${entries.length} email(s)\n`);

  entries.forEach((entry, i) => {
    const status = entry.active ? '✓ Active' : '✗ Inactive';
    const addedAt = entry.addedAt?.toDate?.()?.toLocaleDateString() || 'unknown';
    const notes = entry.notes || '';

    console.log(`${i + 1}. ${entry.email}`);
    console.log(`   ${status} | Added: ${addedAt} | By: ${entry.addedBy || 'unknown'}`);
    if (notes) {
      console.log(`   Notes: ${notes}`);
    }
    console.log('');
  });
}

/**
 * Remove email from whitelist (permanent delete)
 */
async function removeFromWhitelist(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const docRef = doc(db, 'access_whitelist', normalizedEmail);

  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.log(`⚠️  Email not in whitelist: ${normalizedEmail}`);
    return;
  }

  await deleteDoc(docRef);
  console.log(`✓ Removed: ${normalizedEmail}`);
}

/**
 * Disable email (soft delete - keeps record)
 */
async function disableEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const docRef = doc(db, 'access_whitelist', normalizedEmail);

  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.log(`⚠️  Email not in whitelist: ${normalizedEmail}`);
    return;
  }

  await updateDoc(docRef, {
    active: false,
    disabledAt: new Date(),
  });
  console.log(`✓ Disabled: ${normalizedEmail}`);
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  pnpm tsx scripts/whitelist-manage.ts list');
    console.log('  pnpm tsx scripts/whitelist-manage.ts remove email@buffalo.edu');
    console.log('  pnpm tsx scripts/whitelist-manage.ts disable email@buffalo.edu');
    process.exit(1);
  }

  switch (command) {
    case 'list':
      await listWhitelist();
      break;

    case 'remove':
      if (!args[1]) {
        console.error('❌ Email required');
        process.exit(1);
      }
      await removeFromWhitelist(args[1]);
      break;

    case 'disable':
      if (!args[1]) {
        console.error('❌ Email required');
        process.exit(1);
      }
      await disableEmail(args[1]);
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
