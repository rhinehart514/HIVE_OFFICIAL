#!/usr/bin/env node
/**
 * Demo Event Seeding Script
 *
 * Creates demo events for spaces to ensure the platform feels alive.
 * Events are distributed across different spaces and time ranges.
 *
 * Usage:
 *   node scripts/seed-demo-events.mjs [--dry-run] [--campus ub-buffalo] [--count 50]
 *
 * Options:
 *   --dry-run     Preview what would be created without writing
 *   --campus      Campus ID (default: ub-buffalo)
 *   --count       Number of events to create (default: 30)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  BATCH_SIZE: 400,
};

// Event templates for realistic variety
const EVENT_TEMPLATES = [
  // Academic/Study
  { title: 'Study Session', description: 'Collaborative study session. Bring your notes!', categories: ['study', 'academic'], duration: 3 },
  { title: 'Exam Prep Workshop', description: 'Get ready for upcoming exams with peer tutoring.', categories: ['study', 'workshop'], duration: 2 },
  { title: 'Research Presentation', description: 'Students present their research projects.', categories: ['academic', 'presentation'], duration: 2 },
  { title: 'Guest Speaker Event', description: 'Industry professional sharing career insights.', categories: ['career', 'networking'], duration: 1.5 },

  // Social
  { title: 'Game Night', description: 'Board games, card games, and good company!', categories: ['social', 'games'], duration: 3 },
  { title: 'Movie Night', description: 'Join us for a movie screening with snacks.', categories: ['social', 'entertainment'], duration: 3 },
  { title: 'Mixer Event', description: 'Meet new people and make connections.', categories: ['social', 'networking'], duration: 2 },
  { title: 'Potluck Dinner', description: 'Bring a dish to share and enjoy together.', categories: ['social', 'food'], duration: 3 },

  // Professional/Career
  { title: 'Resume Workshop', description: 'Get your resume reviewed by professionals.', categories: ['career', 'workshop'], duration: 2 },
  { title: 'Interview Prep', description: 'Practice your interview skills with mock interviews.', categories: ['career', 'workshop'], duration: 2 },
  { title: 'Networking Night', description: 'Connect with professionals in your field.', categories: ['career', 'networking'], duration: 2 },
  { title: 'Company Info Session', description: 'Learn about opportunities at top companies.', categories: ['career', 'recruiting'], duration: 1.5 },

  // Sports/Fitness
  { title: 'Intramural Game', description: 'Cheer on our team or join the competition!', categories: ['sports', 'competition'], duration: 2 },
  { title: 'Fitness Class', description: 'Stay active with group fitness.', categories: ['fitness', 'health'], duration: 1 },
  { title: 'Outdoor Adventure', description: 'Explore the outdoors together.', categories: ['outdoors', 'adventure'], duration: 4 },

  // Creative/Arts
  { title: 'Art Workshop', description: 'Express yourself through creative activities.', categories: ['arts', 'workshop'], duration: 2 },
  { title: 'Music Jam Session', description: 'Bring your instrument and join the jam.', categories: ['music', 'creative'], duration: 3 },
  { title: 'Photography Walk', description: 'Capture the campus through your lens.', categories: ['photography', 'creative'], duration: 2 },

  // Tech
  { title: 'Hackathon', description: 'Build something amazing in 24 hours!', categories: ['tech', 'hackathon', 'competition'], duration: 24 },
  { title: 'Tech Talk', description: 'Learn about the latest technologies.', categories: ['tech', 'learning'], duration: 1.5 },
  { title: 'Coding Workshop', description: 'Hands-on coding session for all skill levels.', categories: ['tech', 'workshop'], duration: 2 },
  { title: 'Demo Day', description: 'See cool projects built by members.', categories: ['tech', 'showcase'], duration: 2 },

  // Community Service
  { title: 'Volunteer Day', description: 'Give back to the community together.', categories: ['service', 'community'], duration: 4 },
  { title: 'Fundraiser Event', description: 'Support our cause and have fun!', categories: ['service', 'fundraising'], duration: 3 },
  { title: 'Cleanup Event', description: 'Help keep our campus beautiful.', categories: ['service', 'environment'], duration: 2 },

  // General Meetings
  { title: 'General Body Meeting', description: 'Monthly meeting for all members. Updates and announcements.', categories: ['meeting', 'general'], duration: 1.5 },
  { title: 'E-Board Meeting', description: 'Leadership meeting to discuss club operations.', categories: ['meeting', 'leadership'], duration: 1 },
  { title: 'New Member Orientation', description: 'Welcome new members and introduce them to the club.', categories: ['meeting', 'onboarding'], duration: 1 },
];

const LOCATIONS = [
  'Student Union, Room 210',
  'Davis Hall, Room 101',
  'Lockwood Library, 3rd Floor',
  'Baldy Hall, Room 112',
  'Knox Hall, Lobby',
  'Capen Hall, Room 260',
  'Alumni Arena',
  'North Campus Green',
  'Ellicott Complex Commons',
  'Governors Hall Lounge',
  'Virtual (Zoom)',
  'TBD',
];

// =============================================================================
// Firebase Initialization
// =============================================================================

function initFirebase() {
  const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');

  try {
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
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found');
    }

    const credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));
    initializeApp({
      credential: cert(credentials),
      projectId: 'hive-9265c'
    });

    return getFirestore();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// Event Generation
// =============================================================================

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEventDates(daysFromNow) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + daysFromNow);

  // Random hour between 9 AM and 8 PM
  const hour = 9 + Math.floor(Math.random() * 11);
  startDate.setHours(hour, 0, 0, 0);

  return startDate;
}

function generateEvents(spaces, count) {
  const events = [];

  for (let i = 0; i < count; i++) {
    const space = getRandomElement(spaces);
    const template = getRandomElement(EVENT_TEMPLATES);

    // Distribute events across next 60 days, with more events in the near future
    // Use exponential distribution to favor nearer dates
    const daysFromNow = Math.floor(Math.pow(Math.random(), 0.5) * 60);
    const startDate = generateEventDates(daysFromNow);
    const endDate = new Date(startDate.getTime() + template.duration * 60 * 60 * 1000);

    // Generate unique-ish title by adding space name
    const titleVariant = Math.random() > 0.5
      ? template.title
      : `${space.name} ${template.title}`;

    events.push({
      id: `demo-event-${Date.now()}-${i}`,
      title: titleVariant,
      title_lowercase: titleVariant.toLowerCase(),
      description: template.description,
      spaceId: space.id,
      spaceName: space.name,
      location: getRandomElement(LOCATIONS),
      // Use both field names for API compatibility
      startAt: Timestamp.fromDate(startDate),
      endAt: Timestamp.fromDate(endDate),
      startDate: startDate, // API format
      endDate: endDate, // API format
      type: template.categories[0] || 'social', // API expects type field
      categories: template.categories,
      tags: template.categories,
      rsvpCount: Math.floor(Math.random() * 50),
      maxAttendees: Math.random() > 0.3 ? 20 + Math.floor(Math.random() * 80) : null,
      campusId: space.campusId,
      status: 'scheduled', // Match API status
      isHidden: false,
      organizerId: 'system',
      source: {
        platform: 'demo-seed',
        importedAt: FieldValue.serverTimestamp(),
      },
      createdBy: 'demo-seed',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return events;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const campusId = args.find(a => a.startsWith('--campus='))?.split('=')[1] || 'ub-buffalo';
  const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1]) || 30;

  console.log('='.repeat(60));
  console.log('Demo Event Seeding Script');
  console.log('='.repeat(60));
  console.log(`Campus: ${campusId}`);
  console.log(`Events to create: ${count}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log('');

  const db = initFirebase();

  // Fetch existing spaces to distribute events
  console.log('Fetching spaces...');
  const spacesSnapshot = await db.collection('spaces')
    .where('campusId', '==', campusId)
    .where('isActive', '==', true)
    .limit(100)
    .get();

  const spaces = spacesSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    campusId: doc.data().campusId,
    category: doc.data().category,
  }));

  console.log(`  Found ${spaces.length} active spaces\n`);

  if (spaces.length === 0) {
    console.log('❌ No spaces found. Run import-campuslabs.mjs first.');
    process.exit(1);
  }

  // Generate events
  console.log('Generating events...');
  const events = generateEvents(spaces, count);

  // Preview distribution
  const bySpace = events.reduce((acc, e) => {
    acc[e.spaceName] = (acc[e.spaceName] || 0) + 1;
    return acc;
  }, {});

  console.log('\nEvent distribution by space:');
  Object.entries(bySpace)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, cnt]) => {
      console.log(`  ${name}: ${cnt}`);
    });

  if (dryRun) {
    console.log('\n[DRY RUN] Would create these events:');
    events.slice(0, 10).forEach(e => {
      console.log(`  - ${e.title} @ ${e.spaceName}`);
    });
    if (events.length > 10) {
      console.log(`  ... and ${events.length - 10} more`);
    }
    console.log('\n[DRY RUN] No changes made.');
    return;
  }

  // Write events in batches
  console.log('\nWriting events to Firestore...');
  let written = 0;

  for (let i = 0; i < events.length; i += CONFIG.BATCH_SIZE) {
    const batch = db.batch();
    const batchEvents = events.slice(i, i + CONFIG.BATCH_SIZE);

    for (const event of batchEvents) {
      const ref = db.collection('events').doc(event.id);
      batch.set(ref, event);
    }

    await batch.commit();
    written += batchEvents.length;
    console.log(`  Written ${written}/${events.length}`);
  }

  // Update space event counts
  console.log('\nUpdating space event counts...');
  for (const [spaceName, count] of Object.entries(bySpace)) {
    const space = spaces.find(s => s.name === spaceName);
    if (space) {
      await db.collection('spaces').doc(space.id).update({
        'metrics.eventCount': FieldValue.increment(count),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Event Seeding Complete');
  console.log('='.repeat(60));
  console.log(`Created: ${events.length} events`);
  console.log(`Across: ${Object.keys(bySpace).length} spaces`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
