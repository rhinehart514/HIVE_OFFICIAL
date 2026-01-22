#!/usr/bin/env tsx

/**
 * Access Code Management - View and Manage (SECURE VERSION)
 *
 * SECURITY: Codes are stored as SHA256 hashes and cannot be recovered.
 * Manage codes by their document ID, not the code itself.
 *
 * Usage:
 *   pnpm tsx scripts/access-codes-manage.ts list
 *   pnpm tsx scripts/access-codes-manage.ts disable <document-id>
 *   pnpm tsx scripts/access-codes-manage.ts remove <document-id>
 *   pnpm tsx scripts/access-codes-manage.ts verify <code>
 *   pnpm tsx scripts/access-codes-manage.ts stats
 */

import { createHash } from 'crypto';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  where,
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
 * Hash an access code using SHA256
 */
function hashCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

/**
 * List all access codes (shows metadata only, NOT the codes)
 */
async function listCodes() {
  console.log('🔐 Access Codes (Secure - Hashed Storage)\n');

  const snapshot = await getDocs(collection(db, 'access_codes'));

  if (snapshot.empty) {
    console.log('(no codes yet)');
    console.log('');
    console.log('Create codes with:');
    console.log('  pnpm tsx scripts/access-codes-add.ts --count 5');
    return;
  }

  const entries = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort by createdAt
  entries.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  // Calculate stats
  const active = entries.filter((e) => e.active).length;
  const inactive = entries.length - active;
  const totalUses = entries.reduce((sum, e) => sum + (e.useCount || 0), 0);

  console.log(`Total: ${entries.length} code(s) (${active} active, ${inactive} inactive)`);
  console.log(`Total uses: ${totalUses}`);
  console.log('');
  console.log('─'.repeat(60));
  console.log('');

  entries.forEach((entry, i) => {
    const status = entry.active ? '✓ Active' : '✗ Disabled';
    const createdAt =
      entry.createdAt?.toDate?.()?.toLocaleDateString() || 'unknown';
    const useCount = entry.useCount || 0;
    const lastUsed = entry.lastUsed
      ? entry.lastUsed.toDate?.()?.toLocaleString()
      : 'never';
    const notes = entry.notes || '';

    // Show partial hash for identification (first 8 chars)
    const hashPreview = entry.codeHash
      ? entry.codeHash.substring(0, 8) + '...'
      : entry.id.substring(0, 8) + '... (legacy)';

    console.log(`${i + 1}. ID: ${entry.id}`);
    console.log(`   ${status} | Hash: ${hashPreview}`);
    console.log(`   Created: ${createdAt} | By: ${entry.createdBy || 'unknown'}`);
    console.log(`   Used: ${useCount} time(s) | Last used: ${lastUsed}`);
    if (notes) {
      console.log(`   Notes: ${notes}`);
    }
    console.log('');
  });

  console.log('─'.repeat(60));
  console.log('');
  console.log('🔒 Security: Codes are stored as SHA256 hashes');
  console.log('   The actual codes cannot be retrieved.');
  console.log('   Use document ID for disable/remove operations.');
}

/**
 * Show statistics
 */
async function showStats() {
  console.log('📊 Access Code Statistics\n');

  const snapshot = await getDocs(collection(db, 'access_codes'));

  if (snapshot.empty) {
    console.log('No codes yet.');
    return;
  }

  const entries = snapshot.docs.map((doc) => doc.data());

  const active = entries.filter((e) => e.active).length;
  const inactive = entries.length - active;
  const totalUses = entries.reduce((sum, e) => sum + (e.useCount || 0), 0);
  const usedCodes = entries.filter((e) => (e.useCount || 0) > 0).length;
  const unusedCodes = entries.length - usedCodes;

  // Find most used code
  const mostUsed = entries.reduce(
    (max, e) => ((e.useCount || 0) > (max.useCount || 0) ? e : max),
    { useCount: 0 }
  );

  console.log(`Total codes:     ${entries.length}`);
  console.log(`Active:          ${active}`);
  console.log(`Disabled:        ${inactive}`);
  console.log('');
  console.log(`Total uses:      ${totalUses}`);
  console.log(`Codes used:      ${usedCodes}`);
  console.log(`Codes unused:    ${unusedCodes}`);
  console.log('');
  if (mostUsed.useCount > 0) {
    console.log(`Most used code:  ${mostUsed.useCount} uses`);
  }
}

/**
 * Verify a code (check if it exists and is active)
 */
async function verifyCode(code: string) {
  console.log(`🔍 Verifying code: ${code}\n`);

  if (!/^\d{6}$/.test(code)) {
    console.error('❌ Invalid code format (must be 6 digits)');
    return;
  }

  const codeHash = hashCode(code);

  // Check for hashed code
  const q = query(
    collection(db, 'access_codes'),
    where('codeHash', '==', codeHash)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    const status = data.active ? '✓ VALID (active)' : '✗ INVALID (disabled)';
    console.log(`Status: ${status}`);
    console.log(`Doc ID: ${doc.id}`);
    console.log(`Uses:   ${data.useCount || 0}`);
    if (data.notes) {
      console.log(`Notes:  ${data.notes}`);
    }
    return;
  }

  // Check for legacy plaintext code (document ID = code)
  const legacyDoc = await getDoc(doc(db, 'access_codes', code));
  if (legacyDoc.exists()) {
    const data = legacyDoc.data();
    const status = data?.active ? '✓ VALID (legacy, active)' : '✗ INVALID (legacy, disabled)';
    console.log(`Status: ${status}`);
    console.log(`⚠️  WARNING: This is a legacy plaintext code!`);
    console.log(`   Consider migrating to hashed storage.`);
    return;
  }

  console.log('Status: ✗ NOT FOUND');
}

/**
 * Remove code (permanent delete)
 */
async function removeCode(id: string) {
  const docRef = doc(db, 'access_codes', id);

  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.log(`⚠️  Document not found: ${id}`);
    return;
  }

  await deleteDoc(docRef);
  console.log(`✓ Removed code document: ${id}`);
}

/**
 * Disable code (soft delete - keeps record)
 */
async function disableCode(id: string) {
  const docRef = doc(db, 'access_codes', id);

  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.log(`⚠️  Document not found: ${id}`);
    return;
  }

  await updateDoc(docRef, {
    active: false,
    disabledAt: new Date(),
  });
  console.log(`✓ Disabled code document: ${id}`);
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('🔐 HIVE Access Code Manager (Secure Version)\n');
    console.log('Usage:');
    console.log('  pnpm tsx scripts/access-codes-manage.ts list');
    console.log('  pnpm tsx scripts/access-codes-manage.ts stats');
    console.log('  pnpm tsx scripts/access-codes-manage.ts verify <6-digit-code>');
    console.log('  pnpm tsx scripts/access-codes-manage.ts disable <document-id>');
    console.log('  pnpm tsx scripts/access-codes-manage.ts remove <document-id>');
    console.log('');
    console.log('Note: Codes are stored as SHA256 hashes and cannot be recovered.');
    console.log('      Use document IDs from "list" for disable/remove operations.');
    process.exit(1);
  }

  switch (command) {
    case 'list':
      await listCodes();
      break;

    case 'stats':
      await showStats();
      break;

    case 'verify':
      if (!args[1]) {
        console.error('❌ Code required');
        process.exit(1);
      }
      await verifyCode(args[1]);
      break;

    case 'remove':
      if (!args[1]) {
        console.error('❌ Document ID required');
        console.error('   Use "list" to find document IDs');
        process.exit(1);
      }
      await removeCode(args[1]);
      break;

    case 'disable':
      if (!args[1]) {
        console.error('❌ Document ID required');
        console.error('   Use "list" to find document IDs');
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
