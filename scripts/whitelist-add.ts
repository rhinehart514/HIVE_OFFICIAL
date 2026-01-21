#!/usr/bin/env tsx

/**
 * Whitelist Management Script
 * Add emails to access whitelist for gated launch
 *
 * Usage:
 *   pnpm tsx scripts/whitelist-add.ts email1@buffalo.edu email2@buffalo.edu
 *   pnpm tsx scripts/whitelist-add.ts --batch emails.txt
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import * as readline from 'readline';
import * as fs from 'fs';

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

interface WhitelistEntry {
  active: boolean;
  addedAt: Timestamp;
  addedBy: string;
  notes: string;
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
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Add single email to whitelist
 */
async function addToWhitelist(
  email: string,
  addedBy: string,
  notes: string
): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  if (!isValidEmail(normalizedEmail)) {
    console.error(`❌ Invalid email format: ${email}`);
    return false;
  }

  try {
    // Check if already exists
    const docRef = doc(db, 'access_whitelist', normalizedEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`⚠️  Already whitelisted: ${normalizedEmail}`);
      return false;
    }

    // Add to whitelist
    await setDoc(docRef, {
      active: true,
      addedAt: Timestamp.now(),
      addedBy,
      notes,
    } satisfies WhitelistEntry);

    console.log(`✓ Added: ${normalizedEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add ${normalizedEmail}:`, error);
    return false;
  }
}

/**
 * Read emails from file (one per line)
 */
function readEmailsFromFile(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')); // Skip empty lines and comments
  } catch (error) {
    console.error(`❌ Failed to read file ${filePath}:`, error);
    return [];
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚪 HIVE Access Whitelist Manager\n');

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  pnpm tsx scripts/whitelist-add.ts email1@buffalo.edu email2@buffalo.edu');
    console.log('  pnpm tsx scripts/whitelist-add.ts --batch emails.txt');
    console.log('');
    console.log('File format (emails.txt):');
    console.log('  student1@buffalo.edu');
    console.log('  student2@buffalo.edu');
    console.log('  # Comments start with #');
    process.exit(1);
  }

  // Get metadata
  const addedBy = await prompt('Added by (your email): ');
  const notes = await prompt('Notes (e.g., "LinkedIn test group"): ');

  console.log('');

  let emails: string[] = [];

  // Batch mode
  if (args[0] === '--batch' && args[1]) {
    emails = readEmailsFromFile(args[1]);
    console.log(`📄 Read ${emails.length} emails from ${args[1]}\n`);
  } else {
    // Individual emails
    emails = args;
  }

  if (emails.length === 0) {
    console.error('❌ No emails to add');
    process.exit(1);
  }

  // Confirm
  console.log(`About to whitelist ${emails.length} email(s):`);
  emails.forEach((email) => console.log(`  - ${email}`));
  console.log('');

  const confirm = await prompt('Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled');
    process.exit(0);
  }

  console.log('');

  // Add emails
  let added = 0;
  for (const email of emails) {
    const success = await addToWhitelist(email, addedBy, notes);
    if (success) added++;
  }

  console.log('');
  console.log(`✅ Done! Added ${added}/${emails.length} emails to whitelist`);
  console.log('');
  console.log('💡 To enable access gate, set in .env:');
  console.log('   NEXT_PUBLIC_ACCESS_GATE_ENABLED=true');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
