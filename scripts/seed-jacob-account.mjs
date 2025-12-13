#!/usr/bin/env node
/**
 * Seed script to create Jacob Rhinehart's account and a space for him
 * Run with: node scripts/seed-jacob-account.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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
const auth = getAuth();

// User configuration
const USER_CONFIG = {
  handle: 'jacobrhinehart',
  email: 'jwrhineh@buffalo.edu',
  displayName: 'Jacob Rhinehart',
  fullName: 'Jacob Rhinehart',
  campusId: 'ub-buffalo',
  schoolId: 'ub-buffalo'
};

// Space configuration
const SPACE_CONFIG = {
  name: 'Startup Founders Club',
  slug: 'startup-founders',
  description: 'A community for student entrepreneurs to connect, share ideas, and build the next generation of startups. Weekly meetups, pitch practice, and networking events.',
  category: 'professional',
  isPublic: true,
  tags: ['entrepreneurship', 'startups', 'networking', 'business']
};

async function seedUser() {
  console.log('Creating Jacob Rhinehart account...\n');

  // Check if user already exists by email
  console.log('1. Checking if user already exists...');

  // Check Firebase Auth first
  let firebaseUid = null;
  try {
    const existingAuthUser = await auth.getUserByEmail(USER_CONFIG.email);
    firebaseUid = existingAuthUser.uid;
    console.log(`   Found existing Firebase Auth user: ${firebaseUid}`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('   No Firebase Auth user found, will create one...');
    } else {
      console.error('   Error checking Firebase Auth:', error.message);
    }
  }

  // Check Firestore users
  const existingByEmail = await db
    .collection('users')
    .where('email', '==', USER_CONFIG.email)
    .limit(1)
    .get();

  if (!existingByEmail.empty) {
    const existingUser = existingByEmail.docs[0];
    console.log(`   User already exists in Firestore: ${existingUser.id}`);
    console.log(`   Handle: ${existingUser.data().handle}`);
    return existingUser.id;
  }

  // Check handles collection
  const handleDoc = await db.collection('handles').doc(USER_CONFIG.handle).get();
  if (handleDoc.exists) {
    console.log(`   Handle '${USER_CONFIG.handle}' already taken by: ${handleDoc.data().userId}`);
    return handleDoc.data().userId;
  }

  // Create Firebase Auth user if needed
  if (!firebaseUid) {
    console.log('\n2. Creating Firebase Auth user...');
    try {
      const authUser = await auth.createUser({
        email: USER_CONFIG.email,
        displayName: USER_CONFIG.displayName,
        emailVerified: true
      });
      firebaseUid = authUser.uid;
      console.log(`   Created Firebase Auth user: ${firebaseUid}`);
    } catch (error) {
      console.error('   Failed to create Firebase Auth user:', error.message);
      // Continue with a generated ID
      firebaseUid = db.collection('users').doc().id;
      console.log(`   Using generated ID instead: ${firebaseUid}`);
    }
  }

  // Create Firestore user
  console.log('\n3. Creating Firestore user document...');
  const userRef = db.collection('users').doc(firebaseUid);
  const userId = firebaseUid;
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
    bio: 'Student entrepreneur and founder. Building the future one startup at a time.',
    avatarUrl: null,
    interests: ['entrepreneurship', 'technology', 'startups', 'innovation'],

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
  console.log('4. Reserving handle...');
  const handleRef = db.collection('handles').doc(USER_CONFIG.handle);
  const handleData = {
    userId,
    handle: USER_CONFIG.handle,
    createdAt: now
  };

  // Batch write user
  console.log('5. Writing user to Firestore...');
  const batch = db.batch();
  batch.set(userRef, userData);
  batch.set(handleRef, handleData);

  try {
    await batch.commit();
    console.log('\n   User created successfully!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Handle: ${USER_CONFIG.handle}`);
    console.log(`   Email: ${USER_CONFIG.email}`);
    return userId;
  } catch (error) {
    console.error('Failed to create user:', error);
    process.exit(1);
  }
}

async function seedSpace(userId) {
  console.log('\n' + '='.repeat(50));
  console.log('Creating space for Jacob...\n');

  // Check if space already exists
  console.log('1. Checking if space already exists...');
  const existingBySlug = await db
    .collection('spaces')
    .where('slug', '==', SPACE_CONFIG.slug)
    .limit(1)
    .get();

  if (!existingBySlug.empty) {
    const existingSpace = existingBySlug.docs[0];
    console.log(`   Space already exists: ${existingSpace.id}`);
    console.log(`   Name: ${existingSpace.data().name}`);
    return existingSpace.id;
  }

  // Create space
  console.log('\n2. Creating new space...');
  const spaceRef = db.collection('spaces').doc();
  const spaceId = spaceRef.id;
  const now = FieldValue.serverTimestamp();

  const spaceData = {
    // Identity
    name: SPACE_CONFIG.name,
    slug: SPACE_CONFIG.slug,
    description: SPACE_CONFIG.description,
    category: SPACE_CONFIG.category,

    // Campus
    campusId: USER_CONFIG.campusId,
    schoolId: USER_CONFIG.schoolId,

    // Ownership
    createdBy: userId,
    leaders: [userId],

    // Visibility
    isPublic: SPACE_CONFIG.isPublic,
    isVerified: false,
    isActive: true,
    publishStatus: 'live',

    // Content
    tags: SPACE_CONFIG.tags,
    iconUrl: null,
    bannerUrl: null,

    // Stats
    memberCount: 1,
    onlineCount: 0,
    postCount: 0,
    eventCount: 0,

    // Settings
    settings: {
      allowMemberPosts: true,
      allowMemberEvents: false,
      moderationLevel: 'low',
      joinApproval: 'auto'
    },

    // Timestamps
    createdAt: now,
    updatedAt: now
  };

  // Create default "General" board
  console.log('3. Creating default General board...');
  const boardRef = db.collection('spaces').doc(spaceId).collection('boards').doc();
  const boardId = boardRef.id;

  const boardData = {
    name: 'General',
    description: 'General discussion for the community',
    type: 'chat',
    isDefault: true,
    order: 0,
    createdBy: userId,
    createdAt: now,
    updatedAt: now
  };

  // Add user as member
  console.log('4. Adding Jacob as space owner/member...');
  const memberRef = db.collection('spaces').doc(spaceId).collection('members').doc(userId);
  const memberData = {
    userId,
    role: 'owner',
    joinedAt: now,
    isActive: true
  };

  // Batch write
  console.log('5. Writing space to Firestore...');
  const batch = db.batch();
  batch.set(spaceRef, spaceData);
  batch.set(boardRef, boardData);
  batch.set(memberRef, memberData);

  try {
    await batch.commit();
    console.log('\n   Space created successfully!');
    console.log(`   Space ID: ${spaceId}`);
    console.log(`   Name: ${SPACE_CONFIG.name}`);
    console.log(`   Slug: ${SPACE_CONFIG.slug}`);
    console.log(`   Board ID: ${boardId}`);
    return spaceId;
  } catch (error) {
    console.error('Failed to create space:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('HIVE Account & Space Seeder');
  console.log('='.repeat(50));
  console.log(`Email: ${USER_CONFIG.email}`);
  console.log(`Name: ${USER_CONFIG.fullName}`);
  console.log(`Space: ${SPACE_CONFIG.name}`);
  console.log('='.repeat(50) + '\n');

  try {
    // Create user
    const userId = await seedUser();

    // Create space
    const spaceId = await seedSpace(userId);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SUCCESS! Account and space created');
    console.log('='.repeat(50));
    console.log(`User ID: ${userId}`);
    console.log(`Handle: @${USER_CONFIG.handle}`);
    console.log(`Email: ${USER_CONFIG.email}`);
    console.log(`Space ID: ${spaceId}`);
    console.log(`Space URL: /spaces/${spaceId}`);
    console.log(`Space Slug URL: /spaces/s/${SPACE_CONFIG.slug}`);
    console.log('='.repeat(50));
    console.log('\nTo log in:');
    console.log('1. Go to http://localhost:3000/auth/login');
    console.log(`2. Enter email: ${USER_CONFIG.email}`);
    console.log('3. Check email for magic link (or use dev bypass if enabled)');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('\nSeed failed:', error);
    process.exit(1);
  }
}

main();
