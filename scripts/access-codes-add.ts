#!/usr/bin/env tsx

/**
 * Access Code Management - Add Codes (SECURE VERSION)
 *
 * SECURITY: Codes are hashed with SHA256 before storage.
 * The plaintext codes are displayed ONCE during generation - save them!
 *
 * Usage:
 *   pnpm tsx scripts/access-codes-add.ts --count 5
 *   pnpm tsx scripts/access-codes-add.ts --specific 123456 789012
 */

import { createHash, randomInt } from 'crypto';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import * as readline from 'readline';

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
 * SECURITY: Never store plaintext codes
 */
function hashCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

/**
 * Generate cryptographically secure random 6-digit code
 */
function generateCode(): string {
  return String(randomInt(100000, 999999));
}

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Check if a code hash already exists
 */
async function codeHashExists(codeHash: string): Promise<boolean> {
  const q = query(
    collection(db, 'access_codes'),
    where('codeHash', '==', codeHash)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Add access code to Firestore (HASHED)
 */
async function addCode(
  code: string,
  createdBy: string,
  notes: string
): Promise<{ success: boolean; id?: string }> {
  try {
    const codeHash = hashCode(code);

    // Check if hash already exists
    if (await codeHashExists(codeHash)) {
      console.log(`⚠️  Code already exists (hash collision)`);
      return { success: false };
    }

    // Add to Firestore with hash, NOT the plaintext code
    const docRef = await addDoc(collection(db, 'access_codes'), {
      codeHash, // SECURITY: Only store the hash
      active: true,
      createdAt: Timestamp.now(),
      createdBy,
      notes,
      useCount: 0,
      lastUsed: null,
    });

    console.log(`✓ Added code: ${code} (ID: ${docRef.id.substring(0, 8)}...)`);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error(`❌ Failed to add code:`, error);
    return { success: false };
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔐 HIVE Access Code Manager (Secure Version)\n');
  console.log('⚠️  IMPORTANT: Codes are hashed before storage.');
  console.log('⚠️  The plaintext codes shown below are displayed ONCE.');
  console.log('⚠️  Save them securely - they cannot be recovered!\n');

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  Generate random codes:');
    console.log('    pnpm tsx scripts/access-codes-add.ts --count 5');
    console.log('');
    console.log('  Add specific codes:');
    console.log(
      '    pnpm tsx scripts/access-codes-add.ts --specific 123456 789012'
    );
    process.exit(1);
  }

  let codes: string[] = [];

  if (args[0] === '--count') {
    const count = parseInt(args[1]);
    if (isNaN(count) || count < 1 || count > 100) {
      console.error('❌ Count must be between 1 and 100');
      process.exit(1);
    }

    // Generate cryptographically secure random codes
    for (let i = 0; i < count; i++) {
      codes.push(generateCode());
    }

    console.log(`Generated ${count} cryptographically secure codes\n`);
  } else if (args[0] === '--specific') {
    codes = args.slice(1);

    // Validate codes
    for (const code of codes) {
      if (!/^\d{6}$/.test(code)) {
        console.error(`❌ Invalid code format: ${code} (must be 6 digits)`);
        process.exit(1);
      }
    }

    console.log(`Adding ${codes.length} specific codes\n`);
  } else {
    console.error('❌ Unknown option. Use --count or --specific');
    process.exit(1);
  }

  // Get metadata
  const createdBy = await prompt('Created by (your name/email): ');
  const notes = await prompt('Notes (e.g., "LinkedIn test - Jan 2026"): ');

  console.log('');
  console.log(`About to add ${codes.length} access code(s)`);
  console.log('');

  const confirm = await prompt('Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled');
    process.exit(0);
  }

  console.log('');

  // Add codes
  let added = 0;
  const addedCodes: Array<{ code: string; id: string }> = [];

  for (const code of codes) {
    const result = await addCode(code, createdBy, notes);
    if (result.success && result.id) {
      added++;
      addedCodes.push({ code, id: result.id });
    }
  }

  console.log('');
  console.log('═'.repeat(50));
  console.log(`✅ Successfully added ${added}/${codes.length} codes`);
  console.log('═'.repeat(50));
  console.log('');
  console.log('🔐 SAVE THESE CODES - THEY CANNOT BE RECOVERED:');
  console.log('');

  addedCodes.forEach(({ code, id }) => {
    console.log(`   ${code}  (ID: ${id.substring(0, 8)}...)`);
  });

  console.log('');
  console.log('─'.repeat(50));
  console.log('💡 Share these codes with your test users');
  console.log('💡 To enable access gate, set in .env:');
  console.log('   NEXT_PUBLIC_ACCESS_GATE_ENABLED=true');
  console.log('');
  console.log('🔒 Security: Codes are stored as SHA256 hashes');
  console.log('   They cannot be retrieved from the database');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
