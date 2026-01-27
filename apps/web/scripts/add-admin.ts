#!/usr/bin/env tsx
/**
 * Quick Admin Setup Script
 * Adds a single admin user using existing Firebase Admin config
 *
 * Usage: cd apps/web && pnpm tsx scripts/add-admin.ts
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

// Target admin
const ADMIN_EMAIL = 'rhinehart514@gmail.com';
const ADMIN_NAME = 'Flynn Rhinehart';
const ADMIN_PASSWORD = 'Flynn123';
const ADMIN_ROLE = 'super_admin';

async function main() {
  console.log('\n🔧 Setting up admin user...\n');

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    let credential: admin.credential.Credential | undefined;

    if (process.env.FIREBASE_PRIVATE_KEY_BASE64 && process.env.FIREBASE_CLIENT_EMAIL) {
      const decodedKey = Buffer.from(
        process.env.FIREBASE_PRIVATE_KEY_BASE64,
        'base64'
      ).toString('utf-8');
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: decodedKey,
      });
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    }

    if (!credential) {
      console.error('❌ No Firebase credentials found in .env.local');
      process.exit(1);
    }

    admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
    });
    console.log('✓ Firebase Admin initialized');
  }

  const auth = admin.auth();
  const db = admin.firestore();

  // Check if user exists
  let user: admin.auth.UserRecord;
  try {
    user = await auth.getUserByEmail(ADMIN_EMAIL);
    console.log(`✓ Found existing user: ${user.uid}`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // Create the user
      console.log('  Creating new user...');
      user = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
        emailVerified: true,
      });
      console.log(`✓ Created user: ${user.uid}`);
    } else {
      throw error;
    }
  }

  // Set admin custom claims
  await auth.setCustomUserClaims(user.uid, {
    admin: true,
    adminRole: ADMIN_ROLE,
  });
  console.log('✓ Set admin custom claims');

  // Add to admins collection
  await db.collection('admins').doc(user.uid).set({
    uid: user.uid,
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    role: ADMIN_ROLE,
    permissions: ['read', 'write', 'moderate', 'delete_content', 'manage_users', 'manage_admins', 'system_config'],
    active: true,
    createdAt: new Date().toISOString(),
  });
  console.log('✓ Added to admins collection');

  // Update/create user document
  await db.collection('users').doc(user.uid).set({
    email: ADMIN_EMAIL,
    displayName: ADMIN_NAME,
    isAdmin: true,
    adminRole: ADMIN_ROLE,
    status: 'active',
    campusId: 'buffalo',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('✓ Updated user document');

  console.log('\n✅ Admin setup complete!');
  console.log(`\n📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
  console.log(`👤 Role: ${ADMIN_ROLE}`);
  console.log('\n🚀 Login at: http://localhost:3001/auth/login\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
