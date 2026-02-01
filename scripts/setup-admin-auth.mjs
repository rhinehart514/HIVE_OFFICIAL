#!/usr/bin/env node
/**
 * Setup Admin User with Firebase Auth + Firestore
 *
 * Creates the Firebase Auth user and admin Firestore record
 *
 * Usage: node scripts/setup-admin-auth.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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
  console.log('✓ Firebase Admin initialized');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

const auth = getAuth();
const db = getFirestore();

// Admin user configuration
const ADMIN_USER = {
  email: 'jwrhineh@buffalo.edu',
  password: 'Flynn123!',
  displayName: 'Jacob Rhinehart',
  role: 'super_admin',
  permissions: ['read', 'write', 'moderate', 'delete_content', 'manage_users', 'manage_admins', 'system_config']
};

async function setupAdminUser() {
  console.log(`\nSetting up admin user: ${ADMIN_USER.email}\n`);

  let user;

  // Step 1: Check if user exists in Firebase Auth
  console.log('1. Checking Firebase Auth...');
  try {
    user = await auth.getUserByEmail(ADMIN_USER.email);
    console.log(`   ✓ Found existing user: ${user.uid}`);

    // Update password if needed
    await auth.updateUser(user.uid, {
      password: ADMIN_USER.password,
      displayName: ADMIN_USER.displayName,
    });
    console.log('   ✓ Updated password and display name');
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('   User not found, creating new user...');

      // Create new user
      user = await auth.createUser({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
        displayName: ADMIN_USER.displayName,
        emailVerified: true,
      });
      console.log(`   ✓ Created new user: ${user.uid}`);
    } else {
      throw error;
    }
  }

  // Step 2: Set custom claims
  console.log('\n2. Setting custom claims...');
  await auth.setCustomUserClaims(user.uid, {
    admin: true,
    adminRole: ADMIN_USER.role,
  });
  console.log('   ✓ Custom claims set');

  // Step 3: Create/update admin record in Firestore
  console.log('\n3. Creating admin record in Firestore...');
  const now = new Date();
  await db.collection('admins').doc(user.uid).set({
    userId: user.uid,
    email: ADMIN_USER.email,
    displayName: ADMIN_USER.displayName,
    role: ADMIN_USER.role,
    permissions: ADMIN_USER.permissions,
    active: true,
    grantedAt: now,
    grantedBy: 'setup-script',
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
  console.log('   ✓ Admin record created/updated');

  // Step 4: Create/update profile record
  console.log('\n4. Creating profile record...');
  await db.collection('profiles').doc(user.uid).set({
    userId: user.uid,
    email: ADMIN_USER.email,
    displayName: ADMIN_USER.displayName,
    handle: 'jwrhineh',
    campusId: 'ub-buffalo',
    isOnboardingComplete: true,
    isVerified: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
  console.log('   ✓ Profile record created/updated');

  console.log('\n' + '='.repeat(50));
  console.log('SUCCESS! Admin user configured');
  console.log('='.repeat(50));
  console.log(`Email: ${ADMIN_USER.email}`);
  console.log(`Password: ${ADMIN_USER.password}`);
  console.log(`Role: ${ADMIN_USER.role}`);
  console.log(`User ID: ${user.uid}`);
  console.log('='.repeat(50));
  console.log('\nYou can now log in at http://localhost:3001/auth/login');
}

setupAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
