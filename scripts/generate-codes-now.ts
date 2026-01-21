#!/usr/bin/env tsx
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function main() {
  console.log('🔑 Generating 5 access codes...\n');

  const codes: string[] = [];
  for (let i = 0; i < 5; i++) {
    codes.push(generateCode());
  }

  for (const code of codes) {
    await setDoc(doc(db, 'access_codes', code), {
      active: true,
      createdAt: Timestamp.now(),
      createdBy: 'Jacob Fraass',
      notes: 'LinkedIn 72hr test - Jan 2026',
      useCount: 0,
      lastUsed: null,
    });
    console.log(`✓ ${code}`);
  }

  console.log('\n✅ Done! Copy these codes for your LinkedIn DMs.\n');
}

main().catch(console.error);
