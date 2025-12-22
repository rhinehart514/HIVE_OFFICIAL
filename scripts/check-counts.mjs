#!/usr/bin/env node
/**
 * Quick count of Firestore collections
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Load env
const envPath = './apps/web/.env.local';
let envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
} catch (e) {
  console.error('Could not read .env.local');
  process.exit(1);
}

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

const CAMPUS_ID = 'ub-buffalo';

async function main() {
  console.log('='.repeat(50));
  console.log('HIVE Firebase Collection Counts');
  console.log(`Campus: ${CAMPUS_ID}`);
  console.log('='.repeat(50));

  const collections = [
    { name: 'profiles', filter: null },
    { name: 'spaces', filter: ['campusId', '==', CAMPUS_ID] },
    { name: 'spaceMembers', filter: ['campusId', '==', CAMPUS_ID] },
    { name: 'events', filter: null }, // events may not have campusId
    { name: 'posts', filter: ['campusId', '==', CAMPUS_ID] },
    { name: 'tools', filter: ['campusId', '==', CAMPUS_ID] },
    { name: 'deployedTools', filter: ['campusId', '==', CAMPUS_ID] },
  ];

  for (const col of collections) {
    try {
      let query = db.collection(col.name);
      if (col.filter) {
        query = query.where(col.filter[0], col.filter[1], col.filter[2]);
      }
      const snapshot = await query.count().get();
      console.log(`${col.name.padEnd(20)} ${snapshot.data().count}`);
    } catch (e) {
      console.log(`${col.name.padEnd(20)} ERROR: ${e.message}`);
    }
  }

  console.log('='.repeat(50));
  process.exit(0);
}

main().catch(console.error);
