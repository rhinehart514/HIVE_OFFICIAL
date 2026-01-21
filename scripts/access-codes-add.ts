#!/usr/bin/env tsx

/**
 * Access Code Management - Add Codes
 *
 * Usage:
 *   pnpm tsx scripts/access-codes-add.ts --count 5
 *   pnpm tsx scripts/access-codes-add.ts --specific 123456 789012
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
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

interface AccessCode {
  code: string;
  active: boolean;
  createdAt: Timestamp;
  createdBy: string;
  notes: string;
  useCount: number;
  lastUsed: Timestamp | null;
}

/**
 * Generate random 6-digit code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
 * Add access code to Firestore
 */
async function addCode(
  code: string,
  createdBy: string,
  notes: string
): Promise<boolean> {
  try {
    // Check if already exists
    const docRef = doc(db, 'access_codes', code);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`⚠️  Code already exists: ${code}`);
      return false;
    }

    // Add to Firestore
    await setDoc(docRef, {
      active: true,
      createdAt: Timestamp.now(),
      createdBy,
      notes,
      useCount: 0,
      lastUsed: null,
    } satisfies Omit<AccessCode, 'code'>);

    console.log(`✓ Added code: ${code}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add code ${code}:`, error);
    return false;
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔑 HIVE Access Code Manager\n');

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

    // Generate random codes
    for (let i = 0; i < count; i++) {
      codes.push(generateCode());
    }

    console.log(`Generated ${count} random codes\n`);
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
  console.log(`About to add ${codes.length} access code(s):`);
  codes.forEach((code) => console.log(`  ${code}`));
  console.log('');

  const confirm = await prompt('Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled');
    process.exit(0);
  }

  console.log('');

  // Add codes
  let added = 0;
  for (const code of codes) {
    const success = await addCode(code, createdBy, notes);
    if (success) added++;
  }

  console.log('');
  console.log(`✅ Done! Added ${added}/${codes.length} codes`);
  console.log('');
  console.log('💡 Share these codes with your test users');
  console.log('💡 To enable access gate, set in .env:');
  console.log('   NEXT_PUBLIC_ACCESS_GATE_ENABLED=true');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
