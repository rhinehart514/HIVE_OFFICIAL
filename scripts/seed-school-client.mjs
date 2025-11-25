/**
 * Seed script to create the UB Buffalo school document in Firestore
 * Uses Firebase Admin SDK with application default credentials
 * Run with: node scripts/seed-school-client.mjs
 *
 * Prerequisites:
 * - Run `gcloud auth application-default login` if not in a GCP environment
 * - Or set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');
let envVars = {};

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const projectId = envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || envVars.FIREBASE_PROJECT_ID || 'hive-9265c';

console.log('Initializing Firebase Admin with project:', projectId);

let app;
try {
  // Try service account key first (if available)
  const serviceAccountKey = envVars.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    console.log('Using FIREBASE_SERVICE_ACCOUNT_KEY');
    const credentials = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
    app = initializeApp({
      credential: cert(credentials),
      projectId
    });
  } else {
    // Fall back to application default credentials
    console.log('Using application default credentials (gcloud auth)');
    app = initializeApp({
      credential: applicationDefault(),
      projectId
    });
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  console.log('\nTo fix this, run: gcloud auth application-default login');
  console.log('Or add FIREBASE_SERVICE_ACCOUNT_KEY to apps/web/.env.local');
  process.exit(1);
}

const db = getFirestore(app);

async function seedSchool() {
  console.log('\nSeeding UB Buffalo school document...\n');

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
