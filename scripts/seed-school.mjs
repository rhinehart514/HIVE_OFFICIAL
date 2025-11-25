/**
 * Seed script to create the UB Buffalo school document in Firestore
 * Run with: node scripts/seed-school.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

const serviceAccount = envVars.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
  process.exit(1);
}

try {
  const credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));

  initializeApp({
    credential: cert(credentials),
    projectId: 'hive-9265c'
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

const db = getFirestore();

async function seedSchool() {
  console.log('Seeding UB Buffalo school document...\n');

  const schoolData = {
    id: 'ub-buffalo',
    name: 'University at Buffalo',
    domain: 'buffalo.edu',
    active: true,
    campusId: 'ub-buffalo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      allowedEmailDomains: ['buffalo.edu'],
      features: {
        spaces: true,
        rituals: true,
        hiveLab: true
      }
    }
  };

  try {
    await db.collection('schools').doc('ub-buffalo').set(schoolData, { merge: true });
    console.log('✅ Created school: ub-buffalo');
    console.log(JSON.stringify(schoolData, null, 2));
  } catch (error) {
    console.error('❌ Failed to create school:', error);
    process.exit(1);
  }

  console.log('\n✅ School seeding complete!');
}

seedSchool()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
