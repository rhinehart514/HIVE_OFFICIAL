#!/usr/bin/env node
/**
 * Seed script to create Entrepreneurship Club space in Firestore
 * Run with: node scripts/seed-entrepreneurship-club.mjs
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
const projectId = envVars.FIREBASE_PROJECT_ID || 'hive-9265c';
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@hive-9265c.iam.gserviceaccount.com';

if (!privateKeyBase64) {
  console.error('FIREBASE_PRIVATE_KEY_BASE64 not found in .env.local');
  process.exit(1);
}

try {
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

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

// Configuration
const LEADER_EMAIL = 'jwrhineh@buffalo.edu';
const CAMPUS_ID = 'ub-buffalo';

async function seedEntrepreneurshipClub() {
  console.log('Seeding Entrepreneurship Club space...\n');

  // Step 1: Find the jwrhineh user by email
  console.log(`1. Looking up leader user: ${LEADER_EMAIL}`);
  const usersSnapshot = await db
    .collection('users')
    .where('email', '==', LEADER_EMAIL)
    .limit(1)
    .get();

  let leaderId;
  if (usersSnapshot.empty) {
    console.log(`   User not found in Firestore. Looking by handle...`);

    // Try to find by handle
    const handleSnapshot = await db
      .collection('users')
      .where('handle', '==', 'jwrhineh')
      .limit(1)
      .get();

    if (handleSnapshot.empty) {
      console.error('   ERROR: Could not find jwrhineh user. Please ensure the user exists.');
      console.log('   Creating space with system as owner (you can transfer later).');
      leaderId = 'system';
    } else {
      leaderId = handleSnapshot.docs[0].id;
      console.log(`   Found user by handle: ${leaderId}`);
    }
  } else {
    leaderId = usersSnapshot.docs[0].id;
    const userData = usersSnapshot.docs[0].data();
    console.log(`   Found user: ${leaderId} (${userData.displayName || userData.fullName || 'No name'})`);
  }

  // Step 2: Check if space already exists
  console.log('\n2. Checking if Entrepreneurship Club already exists...');
  const existingSpaceSnapshot = await db
    .collection('spaces')
    .where('campusId', '==', CAMPUS_ID)
    .where('name_lowercase', '==', 'ub entrepreneurship club')
    .limit(1)
    .get();

  if (!existingSpaceSnapshot.empty) {
    console.log('   Space already exists! Updating leader info...');
    const existingSpace = existingSpaceSnapshot.docs[0];
    const existingSpaceId = existingSpace.id;

    // Update space with new leader
    await existingSpace.ref.update({
      leaders: [leaderId],
      createdBy: leaderId,
      updatedAt: FieldValue.serverTimestamp()
    });
    console.log('   Updated existing space with new leader.');
    console.log(`   Space ID: ${existingSpaceId}`);

    // Check if membership already exists
    console.log('\n3. Checking/creating membership for leader...');
    const existingMemberSnapshot = await db
      .collection('spaceMembers')
      .where('spaceId', '==', existingSpaceId)
      .where('userId', '==', leaderId)
      .limit(1)
      .get();

    if (existingMemberSnapshot.empty) {
      // Create membership record
      const memberRef = db.collection('spaceMembers').doc();
      await memberRef.set({
        spaceId: existingSpaceId,
        userId: leaderId,
        campusId: CAMPUS_ID,
        schoolId: CAMPUS_ID,
        role: 'owner',
        joinedAt: FieldValue.serverTimestamp(),
        isActive: true,
        permissions: ['admin', 'moderate', 'post', 'invite'],
        joinMethod: 'created'
      });
      console.log('   Created new membership record for leader.');
    } else {
      // Update existing membership to owner role
      await existingMemberSnapshot.docs[0].ref.update({
        role: 'owner',
        permissions: ['admin', 'moderate', 'post', 'invite'],
        isActive: true
      });
      console.log('   Updated existing membership to owner role.');
    }

    console.log('\n' + '='.repeat(50));
    console.log('SUCCESS! Updated Entrepreneurship Club');
    console.log('='.repeat(50));
    return;
  }

  // Step 3: Create the space
  console.log('\n3. Creating Entrepreneurship Club space...');
  const spaceRef = db.collection('spaces').doc();
  const spaceId = spaceRef.id;
  const now = FieldValue.serverTimestamp();

  const spaceData = {
    // Basic info
    name: 'UB Entrepreneurship Club',
    name_lowercase: 'ub entrepreneurship club',
    description: 'Where future founders connect, learn, and build. Join us for startup workshops, pitch competitions, networking with alumni entrepreneurs, and collaborative projects. Whether you have an idea or want to join a team - this is your launchpad.',

    // Categorization
    category: 'student_org',
    type: 'student_organizations',
    subType: null,
    tags: [
      { sub_type: 'entrepreneurship' },
      { sub_type: 'startups' },
      { sub_type: 'business' },
      { sub_type: 'innovation' },
      { sub_type: 'networking' }
    ],

    // Campus isolation
    campusId: CAMPUS_ID,
    schoolId: CAMPUS_ID,

    // Status
    status: 'active',
    isActive: true,
    isPrivate: false,

    // Join settings
    joinPolicy: 'open',
    visibility: 'public',

    // Leadership
    createdBy: leaderId,
    leaders: [leaderId],
    moderators: [],

    // Settings
    settings: {
      maxPinnedPosts: 3,
      autoArchiveDays: 7,
      allowGuestView: true,
      requireApproval: false,
      notifyOnJoin: true
    },

    // Metrics
    memberCount: 1,
    onlineCount: 0,
    activityLevel: 'active',
    lastActivity: now,

    metrics: {
      memberCount: 1,
      postCount: 0,
      eventCount: 0,
      toolCount: 0,
      activeMembers: 1
    },

    // Behavioral scores
    anxietyReliefScore: 0.3,
    socialProofScore: 0.4,
    insiderAccessScore: 0,
    joinToActiveRate: 0,

    // Promotion
    promotedPostsToday: 0,
    autoPromotionEnabled: false,

    // Timestamps
    createdAt: now,
    updatedAt: now,

    // Optional fields
    bannerUrl: null,
    iconUrl: null,
    slug: 'ub-entrepreneurship-club'
  };

  // Step 4: Create membership for leader
  console.log('\n4. Creating membership record for leader...');
  const memberRef = db.collection('spaceMembers').doc();

  const memberData = {
    spaceId,
    userId: leaderId,
    campusId: CAMPUS_ID,
    schoolId: CAMPUS_ID,
    role: 'owner',
    joinedAt: now,
    isActive: true,
    permissions: ['admin', 'moderate', 'post', 'invite'],
    joinMethod: 'created'
  };

  // Step 5: Batch write
  console.log('\n5. Writing to Firestore...');
  const batch = db.batch();
  batch.set(spaceRef, spaceData);
  batch.set(memberRef, memberData);

  try {
    await batch.commit();
    console.log('\n' + '='.repeat(50));
    console.log('SUCCESS! Entrepreneurship Club created');
    console.log('='.repeat(50));
    console.log(`Space ID: ${spaceId}`);
    console.log(`Space Name: ${spaceData.name}`);
    console.log(`Leader ID: ${leaderId}`);
    console.log(`Campus: ${CAMPUS_ID}`);
    console.log(`Join Policy: ${spaceData.joinPolicy}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Failed to create space:', error);
    process.exit(1);
  }
}

seedEntrepreneurshipClub()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
