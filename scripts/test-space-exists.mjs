import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load env
const envPath = './apps/web/.env.local';
try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) { console.log('Error loading env:', e); }

// Initialize
if (!admin.apps.length) {
  const decodedKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: decodedKey,
    })
  });
}

const db = admin.firestore();

// Test query
const spaceDoc = await db.collection('spaces').doc('3U24C6iOuXa4U0a52Jy6').get();
console.log('Space exists:', spaceDoc.exists);
if (spaceDoc.exists) {
  const data = spaceDoc.data();
  console.log('Space name:', data?.name);
  console.log('Space campusId:', data?.campusId);
  console.log('Space slug:', data?.slug);
  console.log('Space keys:', Object.keys(data || {}));
}
