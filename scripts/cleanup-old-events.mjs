#!/usr/bin/env node
/**
 * Clean up old event IDs with broken format
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const envPath = './apps/web/.env.local';
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const projectId = envVars.FIREBASE_PROJECT_ID || envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
let privateKey = envVars.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
const db = getFirestore();

async function main() {
  console.log('Checking events for old format IDs...');

  const snapshot = await db.collection('events').get();
  console.log('Total events:', snapshot.size);

  const toDelete = [];
  const goodPattern = /^campuslabs-\d+$/;

  snapshot.docs.forEach(doc => {
    const id = doc.id;
    if (id.startsWith('campuslabs-') && !goodPattern.test(id)) {
      console.log('Old format ID:', id);
      toDelete.push(doc.ref);
    }
  });

  if (toDelete.length > 0) {
    console.log(`\nDeleting ${toDelete.length} old format events...`);
    for (const ref of toDelete) {
      await ref.delete();
      console.log('Deleted:', ref.path);
    }
  } else {
    console.log('No old format events found.');
  }

  const finalCount = await db.collection('events').count().get();
  console.log('\nFinal events count:', finalCount.data().count);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
