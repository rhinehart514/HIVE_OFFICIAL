#!/usr/bin/env node
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const envContent = readFileSync('./apps/web/.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const projectId = envVars.FIREBASE_PROJECT_ID;
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
const privateKey = Buffer.from(envVars.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
const db = getFirestore();

async function check() {
  let messagesFound = 0;
  const spaces = await db.collection('spaces').get();

  console.log('Searching for boards with messages...\n');

  for (const spaceDoc of spaces.docs) {
    const boards = await spaceDoc.ref.collection('boards').get();

    for (const boardDoc of boards.docs) {
      const messages = await boardDoc.ref.collection('messages').limit(3).get();
      if (messages.size > 0) {
        console.log('=== Space:', spaceDoc.data().name, '===');
        console.log('Board ID:', boardDoc.id);
        console.log('Board data:', JSON.stringify(boardDoc.data(), null, 2));
        console.log('\nSample messages:');

        for (const m of messages.docs) {
          const data = m.data();
          console.log('\n  Message ID:', m.id);
          console.log('  All fields:', JSON.stringify(data, null, 2));
          messagesFound++;
        }
        console.log('\n---\n');

        if (messagesFound >= 10) break;
      }
    }
    if (messagesFound >= 10) break;
  }

  console.log('\nTotal messages sampled:', messagesFound);

  // Also show events collection sample
  console.log('\n=== EVENTS COLLECTION SAMPLE ===');
  const events = await db.collection('events').limit(3).get();
  for (const e of events.docs) {
    console.log('\nEvent ID:', e.id);
    console.log('Data:', JSON.stringify(e.data(), null, 2).substring(0, 800));
  }
}

check().then(() => process.exit(0));
