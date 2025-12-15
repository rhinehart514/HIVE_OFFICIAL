#!/usr/bin/env node
/**
 * Firebase Emulator Seed Script
 *
 * Seeds the Firebase emulator with test data for local development.
 * This script populates:
 * - School configuration
 * - Sample spaces (various categories)
 * - Sample events (upcoming and past)
 * - Test users with proper profiles
 * - Demo HiveLab tools
 *
 * Usage:
 *   node scripts/seed-emulator.mjs
 *
 * Prerequisites:
 *   - Firebase emulator running: firebase emulators:start
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  CAMPUS_ID: 'ub-buffalo',
  SCHOOL_NAME: 'University at Buffalo',
  EMAIL_DOMAIN: 'buffalo.edu',
};

// Initialize with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

initializeApp({ projectId: 'hive-9265c' });

const db = getFirestore();
const auth = getAuth();

// =============================================================================
// Seed Data
// =============================================================================

const SCHOOL_DATA = {
  id: CONFIG.CAMPUS_ID,
  name: CONFIG.SCHOOL_NAME,
  shortName: 'UB',
  emailDomain: CONFIG.EMAIL_DOMAIN,
  features: {
    spaces: true,
    rituals: true,
    hiveLab: true,
    directMessages: true,
    events: true,
  },
  settings: {
    maxSpacesPerUser: 5,
    maxMembersPerSpace: 1000,
    requireEmailVerification: true,
    minimumAccountAgeDays: 7,
  },
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};

const TEST_USERS = [
  {
    id: 'test-admin-001',
    email: 'admin@buffalo.edu',
    displayName: 'Admin User',
    handle: 'admin',
    role: 'admin',
    major: 'Computer Science',
    graduationYear: 2025,
  },
  {
    id: 'test-leader-001',
    email: 'leader@buffalo.edu',
    displayName: 'Club Leader',
    handle: 'clubleader',
    role: 'user',
    major: 'Business Administration',
    graduationYear: 2026,
  },
  {
    id: 'test-student-001',
    email: 'student@buffalo.edu',
    displayName: 'Test Student',
    handle: 'teststudent',
    role: 'user',
    major: 'Biology',
    graduationYear: 2027,
  },
  {
    id: 'test-student-002',
    email: 'student2@buffalo.edu',
    displayName: 'Another Student',
    handle: 'student2',
    role: 'user',
    major: 'Engineering',
    graduationYear: 2026,
  },
];

const SAMPLE_SPACES = [
  {
    id: 'space-cs-club',
    name: 'Computer Science Club',
    description: 'A community for CS majors to collaborate, learn, and grow together.',
    category: 'student_org',
    tags: ['programming', 'technology', 'coding', 'hackathons'],
    memberCount: 156,
    hasLeader: true,
    leaderId: 'test-leader-001',
  },
  {
    id: 'space-gaming',
    name: 'UB Esports & Gaming',
    description: 'For gamers of all skill levels. Weekly tournaments and casual play sessions.',
    category: 'student_org',
    tags: ['gaming', 'esports', 'tournaments'],
    memberCount: 234,
    hasLeader: false,
  },
  {
    id: 'space-pre-med',
    name: 'Pre-Med Society',
    description: 'Future doctors supporting each other through the medical school journey.',
    category: 'student_org',
    tags: ['pre-med', 'healthcare', 'mcat', 'medical-school'],
    memberCount: 89,
    hasLeader: true,
    leaderId: 'test-student-001',
  },
  {
    id: 'space-governors',
    name: 'Governors Residence Hall',
    description: 'Connect with your neighbors, plan events, and make the most of dorm life.',
    category: 'residential',
    tags: ['dorms', 'housing', 'residence-life'],
    memberCount: 312,
    hasLeader: false,
  },
  {
    id: 'space-alpha-beta',
    name: 'Alpha Beta Gamma',
    description: 'Brotherhood, leadership, and service. Rush ABG!',
    category: 'greek_life',
    tags: ['fraternity', 'greek', 'brotherhood'],
    memberCount: 45,
    hasLeader: true,
    leaderId: 'test-admin-001',
  },
  {
    id: 'space-student-gov',
    name: 'Student Government',
    description: 'Your voice on campus. Making UB better, one initiative at a time.',
    category: 'university_org',
    tags: ['leadership', 'governance', 'campus-life'],
    memberCount: 28,
    hasLeader: true,
    leaderId: 'test-admin-001',
  },
  {
    id: 'space-data-science',
    name: 'Data Science Club',
    description: 'Exploring the world through data. ML, AI, and analytics enthusiasts welcome.',
    category: 'student_org',
    tags: ['data-science', 'machine-learning', 'analytics', 'python'],
    memberCount: 78,
    hasLeader: false,
  },
  {
    id: 'space-debate',
    name: 'UB Debate Team',
    description: 'Sharpen your arguments and compete at the highest level.',
    category: 'student_org',
    tags: ['debate', 'public-speaking', 'competition'],
    memberCount: 32,
    hasLeader: false,
  },
];

const SAMPLE_EVENTS = [
  {
    id: 'event-hackathon',
    title: 'Spring Hackathon 2025',
    description: '24-hour coding competition with prizes worth $5,000. All skill levels welcome!',
    spaceId: 'space-cs-club',
    spaceName: 'Computer Science Club',
    location: 'Davis Hall, Room 101',
    startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    categories: ['hackathon', 'technology', 'competition'],
    rsvpCount: 45,
    maxCapacity: 100,
  },
  {
    id: 'event-study-session',
    title: 'MCAT Study Group',
    description: 'Weekly study session for MCAT preparation. Bring your notes!',
    spaceId: 'space-pre-med',
    spaceName: 'Pre-Med Society',
    location: 'Lockwood Library, 3rd Floor',
    startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
    categories: ['study', 'academic', 'mcat'],
    rsvpCount: 12,
    maxCapacity: 20,
  },
  {
    id: 'event-gaming-tournament',
    title: 'League of Legends Tournament',
    description: 'Show off your skills in our monthly LoL tournament. Solo or team entry.',
    spaceId: 'space-gaming',
    spaceName: 'UB Esports & Gaming',
    location: 'Student Union Gaming Lounge',
    startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    categories: ['gaming', 'esports', 'tournament'],
    rsvpCount: 28,
    maxCapacity: 50,
  },
  {
    id: 'event-rush',
    title: 'ABG Rush Week',
    description: 'Meet the brothers and learn what Alpha Beta Gamma is all about.',
    spaceId: 'space-alpha-beta',
    spaceName: 'Alpha Beta Gamma',
    location: 'Greek Row, ABG House',
    startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    categories: ['rush', 'greek', 'social'],
    rsvpCount: 67,
    maxCapacity: null,
  },
  {
    id: 'event-floor-meeting',
    title: 'Governors Floor 3 Meeting',
    description: 'Monthly floor meeting. Pizza provided!',
    spaceId: 'space-governors',
    spaceName: 'Governors Residence Hall',
    location: 'Governors Hall, Floor 3 Lounge',
    startAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    endAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
    categories: ['meeting', 'residential'],
    rsvpCount: 18,
    maxCapacity: 30,
  },
  {
    id: 'event-town-hall',
    title: 'Student Government Town Hall',
    description: 'Voice your concerns and hear updates on campus initiatives.',
    spaceId: 'space-student-gov',
    spaceName: 'Student Government',
    location: 'Student Union Ballroom',
    startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    categories: ['governance', 'town-hall', 'campus'],
    rsvpCount: 34,
    maxCapacity: 200,
  },
];

const DEMO_TOOLS = [
  {
    id: 'tool-weekly-poll',
    name: 'Weekly Poll',
    description: 'Get quick feedback from your community',
    type: 'poll',
    ownerId: 'test-leader-001',
    spaceId: 'space-cs-club',
    isPublic: true,
    status: 'published',
    elements: [
      {
        id: 'poll-1',
        type: 'poll-element',
        config: {
          question: 'What topic should we cover next week?',
          options: ['Web Development', 'Machine Learning', 'System Design', 'Interview Prep'],
          allowMultiple: false,
        },
      },
    ],
  },
  {
    id: 'tool-event-rsvp',
    name: 'Event RSVP',
    description: 'Track attendance for your events',
    type: 'form',
    ownerId: 'test-admin-001',
    spaceId: 'space-student-gov',
    isPublic: true,
    status: 'published',
    elements: [
      {
        id: 'rsvp-1',
        type: 'form-builder',
        config: {
          title: 'RSVP Form',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'email', type: 'email', required: true },
            { name: 'dietary', type: 'select', options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free'] },
          ],
        },
      },
    ],
  },
];

// =============================================================================
// Seeding Functions
// =============================================================================

async function seedSchool() {
  console.log('📚 Seeding school configuration...');
  await db.collection('schools').doc(CONFIG.CAMPUS_ID).set(SCHOOL_DATA);
  console.log('   ✅ School created: ' + CONFIG.SCHOOL_NAME);
}

async function seedUsers() {
  console.log('\n👤 Seeding test users...');

  for (const user of TEST_USERS) {
    // Create auth user
    try {
      await auth.createUser({
        uid: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: true,
        password: 'testpassword123',
      });

      // Set custom claims for admin
      if (user.role === 'admin') {
        await auth.setCustomUserClaims(user.id, { admin: true, campusId: CONFIG.CAMPUS_ID });
      } else {
        await auth.setCustomUserClaims(user.id, { campusId: CONFIG.CAMPUS_ID });
      }
    } catch (e) {
      // User might already exist
      console.log(`   ⚠️ User ${user.email} may already exist`);
    }

    // Create user document
    await db.collection('users').doc(user.id).set({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      campusId: CONFIG.CAMPUS_ID,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create profile document
    await db.collection('profiles').doc(user.id).set({
      userId: user.id,
      displayName: user.displayName,
      displayName_lowercase: user.displayName.toLowerCase(),
      handle: user.handle,
      email: user.email,
      major: user.major,
      graduationYear: user.graduationYear,
      campusId: CONFIG.CAMPUS_ID,
      bio: `Hi, I'm ${user.displayName}!`,
      isOnboarded: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`   ✅ User created: ${user.displayName} (${user.email})`);
  }
}

async function seedSpaces() {
  console.log('\n🏠 Seeding sample spaces...');

  for (const space of SAMPLE_SPACES) {
    const spaceData = {
      name: space.name,
      name_lowercase: space.name.toLowerCase(),
      description: space.description,
      category: space.category,
      tags: space.tags,
      campusId: CONFIG.CAMPUS_ID,
      status: 'active',
      isActive: true,
      visibility: 'public',
      claimStatus: space.hasLeader ? 'claimed' : 'unclaimed',
      publishStatus: 'live',
      metrics: {
        memberCount: space.memberCount,
        postCount: Math.floor(Math.random() * 50) + 5,
        eventCount: Math.floor(Math.random() * 10) + 1,
        toolCount: Math.floor(Math.random() * 5),
      },
      createdBy: space.leaderId || 'system',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('spaces').doc(space.id).set(spaceData);

    // Create General board for each space
    await db.collection('spaces').doc(space.id).collection('boards').doc('general').set({
      name: 'General',
      type: 'general',
      description: 'General discussion',
      canPost: 'members',
      isDefault: true,
      messageCount: 0,
      lastMessageAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Add leader as member if space has one
    if (space.hasLeader && space.leaderId) {
      const compositeId = `${space.id}_${space.leaderId}`;
      await db.collection('spaceMembers').doc(compositeId).set({
        spaceId: space.id,
        userId: space.leaderId,
        role: 'owner',
        isActive: true,
        joinMethod: 'seed',
        joinedAt: FieldValue.serverTimestamp(),
        campusId: CONFIG.CAMPUS_ID,
      });
    }

    console.log(`   ✅ Space created: ${space.name} (${space.category})`);
  }
}

async function seedEvents() {
  console.log('\n📅 Seeding sample events...');

  for (const event of SAMPLE_EVENTS) {
    const eventData = {
      title: event.title,
      title_lowercase: event.title.toLowerCase(),
      description: event.description,
      spaceId: event.spaceId,
      spaceName: event.spaceName,
      location: event.location,
      // Both formats for API compatibility
      startAt: Timestamp.fromDate(event.startAt),
      endAt: Timestamp.fromDate(event.endAt),
      startDate: event.startAt, // API format
      endDate: event.endAt, // API format
      type: event.categories[0] || 'social',
      categories: event.categories,
      tags: event.categories,
      rsvpCount: event.rsvpCount,
      maxAttendees: event.maxCapacity,
      campusId: CONFIG.CAMPUS_ID,
      status: 'scheduled',
      isHidden: false,
      organizerId: 'system',
      createdBy: 'system',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('events').doc(event.id).set(eventData);
    console.log(`   ✅ Event created: ${event.title}`);
  }
}

async function seedTools() {
  console.log('\n🔧 Seeding demo tools...');

  for (const tool of DEMO_TOOLS) {
    const toolData = {
      name: tool.name,
      name_lowercase: tool.name.toLowerCase(),
      description: tool.description,
      type: tool.type,
      ownerId: tool.ownerId,
      createdBy: tool.ownerId,
      spaceId: tool.spaceId,
      isPublic: tool.isPublic,
      status: tool.status,
      elements: tool.elements,
      currentVersion: '1.0.0',
      campusId: CONFIG.CAMPUS_ID,
      viewCount: 0,
      useCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('tools').doc(tool.id).set(toolData);
    console.log(`   ✅ Tool created: ${tool.name}`);
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('🐝 HIVE Firebase Emulator Seed Script');
  console.log('='.repeat(60));
  console.log('');
  console.log('Connecting to emulators...');
  console.log('  Firestore: localhost:8080');
  console.log('  Auth: localhost:9099');
  console.log('');

  try {
    await seedSchool();
    await seedUsers();
    await seedSpaces();
    await seedEvents();
    await seedTools();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Seeding Complete!');
    console.log('='.repeat(60));
    console.log(`
Summary:
  - 1 school (${CONFIG.SCHOOL_NAME})
  - ${TEST_USERS.length} test users
  - ${SAMPLE_SPACES.length} spaces (with General boards)
  - ${SAMPLE_EVENTS.length} events
  - ${DEMO_TOOLS.length} demo tools

Test Credentials:
  Admin:   admin@buffalo.edu / testpassword123
  Leader:  leader@buffalo.edu / testpassword123
  Student: student@buffalo.edu / testpassword123

Emulator UI: http://localhost:4000
    `);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
