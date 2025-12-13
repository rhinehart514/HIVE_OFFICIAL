#!/usr/bin/env node
/**
 * Seed script to create jwrhineh user in Firestore
 * Run with: node scripts/seed-jwrhineh-user.mjs
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
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('Could not read .env.local file:', error.message);
  process.exit(1);
}

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
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@hive-9265c.iam.gserviceaccount.com';

if (!privateKeyBase64 && !privateKeyDirect) {
  console.error('Neither FIREBASE_PRIVATE_KEY_BASE64 nor FIREBASE_PRIVATE_KEY found in .env.local');
  process.exit(1);
}

try {
  let privateKey;
  if (privateKeyBase64) {
    privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
  } else {
    privateKey = privateKeyDirect.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    }),
    projectId
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

const db = getFirestore();

// User configuration
const USER_CONFIG = {
  handle: 'jwrhineh',
  email: 'jwrhineh@buffalo.edu',
  displayName: 'Justin Rhineh',
  fullName: 'Justin Rhineh',
  campusId: 'ub-buffalo',
  schoolId: 'ub-buffalo'
};

async function seedUser() {
  console.log('Creating jwrhineh user...\n');

  // Check if user already exists by handle
  console.log('1. Checking if user already exists...');
  const existingByHandle = await db
    .collection('users')
    .where('handle', '==', USER_CONFIG.handle)
    .limit(1)
    .get();

  if (!existingByHandle.empty) {
    const existingUser = existingByHandle.docs[0];
    console.log(`   User already exists: ${existingUser.id}`);
    console.log(`   Handle: ${existingUser.data().handle}`);
    console.log('\n   Skipping user creation.');
    return existingUser.id;
  }

  // Also check handles collection
  const handleDoc = await db.collection('handles').doc(USER_CONFIG.handle).get();
  if (handleDoc.exists) {
    console.log(`   Handle '${USER_CONFIG.handle}' already taken by: ${handleDoc.data().userId}`);
    return handleDoc.data().userId;
  }

  // Create user
  console.log('\n2. Creating new user...');
  const userRef = db.collection('users').doc();
  const userId = userRef.id;
  const now = FieldValue.serverTimestamp();

  const userData = {
    // Identity
    handle: USER_CONFIG.handle,
    email: USER_CONFIG.email,
    displayName: USER_CONFIG.displayName,
    fullName: USER_CONFIG.fullName,

    // Campus
    campusId: USER_CONFIG.campusId,
    schoolId: USER_CONFIG.schoolId,

    // Status
    isOnboardingComplete: true,
    isVerified: true,
    isActive: true,

    // Profile
    bio: 'Entrepreneur and student leader',
    avatarUrl: null,

    // Privacy
    privacySettings: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowDirectMessages: true
    },

    // Timestamps
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now
  };

  // Reserve handle
  console.log('3. Reserving handle...');
  const handleRef = db.collection('handles').doc(USER_CONFIG.handle);
  const handleData = {
    userId,
    handle: USER_CONFIG.handle,
    createdAt: now
  };

  // Batch write
  console.log('4. Writing to Firestore...');
  const batch = db.batch();
  batch.set(userRef, userData);
  batch.set(handleRef, handleData);

  try {
    await batch.commit();
    console.log('\n' + '='.repeat(50));
    console.log('SUCCESS! User created');
    console.log('='.repeat(50));
    console.log(`User ID: ${userId}`);
    console.log(`Handle: ${USER_CONFIG.handle}`);
    console.log(`Email: ${USER_CONFIG.email}`);
    console.log(`Campus: ${USER_CONFIG.campusId}`);
    console.log('='.repeat(50));
    return userId;
  } catch (error) {
    console.error('Failed to create user:', error);
    process.exit(1);
  }
}

seedUser()
  .then((userId) => {
    console.log(`\nUser ID for next steps: ${userId}`);
    console.log('Now run: node scripts/seed-entrepreneurship-club.mjs');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
