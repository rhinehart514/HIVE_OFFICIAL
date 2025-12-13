#!/usr/bin/env node
/**
 * Create General board for a space
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;
const privateKeyDirect = envVars.FIREBASE_PRIVATE_KEY;
const projectId = envVars.FIREBASE_PROJECT_ID || 'hive-9265c';
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;

let privateKey;
if (privateKeyBase64) {
  privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
} else {
  privateKey = privateKeyDirect.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
}

initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
  projectId
});

const db = getFirestore();
const spaceId = 'c3gjRK2PNDSSjAasnwFf';

async function createGeneralBoard() {
  console.log('Checking boards for space:', spaceId);

  // Check if board already exists
  const boardsSnap = await db.collection('spaces').doc(spaceId).collection('boards').get();
  console.log('Existing boards:', boardsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

  // Create General board if needed
  const generalRef = db.collection('spaces').doc(spaceId).collection('boards').doc('general');
  const generalSnap = await generalRef.get();

  if (!generalSnap.exists) {
    console.log('Creating General board...');
    await generalRef.set({
      name: 'General',
      type: 'general',
      description: 'General discussion',
      canPost: 'members',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      messageCount: 0,
      lastMessageAt: null,
      isDefault: true
    });
    console.log('✅ General board created!');
  } else {
    console.log('General board already exists:', generalSnap.data());
  }
}

createGeneralBoard()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
