/**
 * Seed Featured Spaces with Content
 * 
 * Run with: npx tsx scripts/seed-featured-content.ts
 * 
 * Seeds 5 key spaces with:
 * - Welcome message (chat)
 * - Pinned intro post
 * - 1-2 upcoming events
 * 
 * Requires FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS env var.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const CAMPUS_ID = 'ub-buffalo';
const SYSTEM_USER = 'system-hive';

interface SeedSpace {
  /** Slug to match in spaces collection */
  slugPattern: string;
  /** Fallback: document ID to try if slug not found */
  fallbackId?: string;
  welcomeMessage: string;
  pinnedPost: {
    content: string;
    type: 'announcement' | 'regular';
  };
  events: Array<{
    title: string;
    description: string;
    location: string;
    daysFromNow: number;
    durationHours: number;
  }>;
}

const SEED_SPACES: SeedSpace[] = [
  {
    slugPattern: 'hive-official',
    fallbackId: 'hive-official',
    welcomeMessage: '🐝 Welcome to HIVE! This is the official space for platform updates, tips, and community announcements. Say hi!',
    pinnedPost: {
      content: `# Welcome to HIVE 🐝

HIVE is your campus social hub — built by UB students, for UB students.

**Here's how to get started:**
1. **Join spaces** for your major, dorm, and interests
2. **Explore tools** built by the community in the Lab
3. **Connect** with classmates and organizations

Have feedback? Drop it right here. We read everything.

— The HIVE Team`,
      type: 'announcement',
    },
    events: [
      {
        title: 'HIVE Launch Party 🎉',
        description: 'Celebrate the official launch of HIVE at UB! Free food, swag, and demos of the coolest student-built tools.',
        location: 'Student Union, Room 330',
        daysFromNow: 7,
        durationHours: 2,
      },
    ],
  },
  {
    slugPattern: 'student-association',
    welcomeMessage: '👋 Welcome to the Student Association space! Stay updated on campus policies, events, and how to get involved in student government.',
    pinnedPost: {
      content: `# Student Association @ UB

Your voice in campus governance. We represent **30,000+ students** and advocate for your interests.

**What we do:**
- Allocate the student activity fee
- Advocate for student needs with administration
- Host campus-wide events and initiatives

**Get involved:** Attend our weekly senate meetings (Tuesdays, 7 PM, SU 330) or run for a position!

Questions? Drop them below 👇`,
      type: 'announcement',
    },
    events: [
      {
        title: 'SA Senate Meeting',
        description: 'Weekly student senate meeting. All students welcome to attend and voice concerns.',
        location: 'Student Union, Room 330',
        daysFromNow: 3,
        durationHours: 1.5,
      },
      {
        title: 'Town Hall: Spring Budget',
        description: 'Open town hall to discuss spring semester budget allocations. Your activity fee, your say.',
        location: 'Student Union Theater',
        daysFromNow: 10,
        durationHours: 2,
      },
    ],
  },
  {
    slugPattern: 'ub-computer-science',
    fallbackId: 'ub-computer-science',
    welcomeMessage: '💻 Welcome to UB CS! Share projects, find study partners, and stay in the loop on hackathons and career events.',
    pinnedPost: {
      content: `# UB Computer Science Club

Whether you're grinding LeetCode or building your first project, you belong here.

**Resources:**
- Study groups for CSE 116, 191, 250, 331, and more
- Hackathon team formation
- Interview prep and resume reviews
- Industry speaker events

**Pro tip:** Check out the Tools tab for student-built CS tools!

Drop your current project below — let's see what you're building 🚀`,
      type: 'announcement',
    },
    events: [
      {
        title: 'Weekly Coding Workshop',
        description: 'Beginner-friendly coding workshop. This week: intro to React and Next.js. Bring your laptop!',
        location: 'Davis Hall, Room 101',
        daysFromNow: 5,
        durationHours: 2,
      },
      {
        title: 'Mock Technical Interviews',
        description: "Practice whiteboard interviews with peers. Get feedback from upperclassmen who've landed FAANG offers.",
        location: 'Capen Hall, Room 212',
        daysFromNow: 12,
        durationHours: 3,
      },
    ],
  },
  {
    slugPattern: 'sub-board-inc',
    welcomeMessage: "🎬 Welcome to Sub Board! We bring the biggest concerts, comedians, and events to UB. Stay tuned for what's coming up!",
    pinnedPost: {
      content: `# Sub Board, Inc. — Campus Events & Entertainment

We're the student-run organization that brings **major events** to UB's campus.

**What to expect:**
- Concerts and music events
- Comedy shows
- Movie screenings
- Spring Fest & Fall Fest

**Want to help plan events?** We're always looking for new members. No experience needed — just enthusiasm!

Follow us here for first access to event announcements 🎟️`,
      type: 'announcement',
    },
    events: [
      {
        title: 'Movie Night: Free Screening',
        description: 'Free movie screening with popcorn and drinks. Movie TBA — vote in the poll!',
        location: 'Student Union Theater',
        daysFromNow: 4,
        durationHours: 2.5,
      },
    ],
  },
  {
    slugPattern: 'interfraternity-council',
    welcomeMessage: '🏛️ Welcome to IFC! Your hub for fraternity recruitment info, Greek life events, and chapter updates at UB.',
    pinnedPost: {
      content: `# Interfraternity Council (IFC) at UB

IFC governs UB's fraternities and coordinates recruitment, philanthropy, and community standards.

**Thinking about going Greek?**
- Rush events happen every semester
- Meet brothers from all chapters
- No commitment to attend rush events

**Current chapters:** Check our events tab for rush schedules and info sessions.

Questions about Greek life? Ask here — current members are happy to help! 🤝`,
      type: 'announcement',
    },
    events: [
      {
        title: 'Greek Life Info Session',
        description: 'Learn about all UB fraternities and the recruitment process. Free pizza and Q&A with current members.',
        location: 'Student Union, Room 210',
        daysFromNow: 8,
        durationHours: 1.5,
      },
    ],
  },
];

async function findSpaceBySlug(slug: string): Promise<string | null> {
  // Try by slug field
  const bySlug = await db.collection('spaces')
    .where('slug', '==', slug)
    .where('campusId', '==', CAMPUS_ID)
    .limit(1)
    .get();
  
  if (!bySlug.empty) return bySlug.docs[0]!.id;

  // Try by name_lowercase containing the slug words
  const slugWords = slug.replace(/-/g, ' ');
  const byName = await db.collection('spaces')
    .where('name_lowercase', '==', slugWords)
    .where('campusId', '==', CAMPUS_ID)
    .limit(1)
    .get();
  
  if (!byName.empty) return byName.docs[0]!.id;

  return null;
}

async function seedSpace(seed: SeedSpace): Promise<void> {
  // Find the space
  let spaceId = await findSpaceBySlug(seed.slugPattern);
  
  if (!spaceId && seed.fallbackId) {
    const doc = await db.collection('spaces').doc(seed.fallbackId).get();
    if (doc.exists) spaceId = doc.id;
  }

  if (!spaceId) {
    console.log(`⚠️  Space not found: ${seed.slugPattern} — creating it`);
    // Create the space
    const ref = db.collection('spaces').doc(seed.fallbackId || seed.slugPattern);
    await ref.set({
      name: seed.slugPattern.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      name_lowercase: seed.slugPattern.replace(/-/g, ' '),
      slug: seed.slugPattern,
      description: seed.pinnedPost.content.substring(0, 280),
      category: 'student_organizations',
      type: 'student_organizations',
      campusId: CAMPUS_ID,
      visibility: 'public',
      publishStatus: 'live',
      status: 'active',
      source: 'user-created',
      isActive: true,
      isVerified: false,
      memberCount: 0,
      postCount: 0,
      trendingScore: 0,
      createdBy: SYSTEM_USER,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      isFeatured: true,
    });
    spaceId = ref.id;
    console.log(`   Created space: ${spaceId}`);
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // 1. Add welcome chat message
  const chatRef = db.collection('spaces').doc(spaceId).collection('messages').doc();
  batch.set(chatRef, {
    content: seed.welcomeMessage,
    authorId: SYSTEM_USER,
    authorName: 'HIVE Bot',
    type: 'system',
    campusId: CAMPUS_ID,
    createdAt: now,
    updatedAt: now,
    pinned: false,
    reactions: {},
  });

  // 2. Add pinned intro post
  const postRef = db.collection('spacePosts').doc();
  batch.set(postRef, {
    spaceId,
    campusId: CAMPUS_ID,
    content: seed.pinnedPost.content,
    type: seed.pinnedPost.type,
    authorId: SYSTEM_USER,
    authorName: 'HIVE Bot',
    pinned: true,
    pinnedAt: now,
    pinnedBy: SYSTEM_USER,
    promoted: false,
    isThread: false,
    replyCount: 0,
    reactions: {},
    engagementScore: 0,
    createdAt: now,
    updatedAt: now,
  });

  // 3. Add events
  for (const event of seed.events) {
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + event.daysFromNow);
    startAt.setHours(18, 0, 0, 0); // Default to 6 PM

    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + event.durationHours);

    const eventRef = db.collection('events').doc();
    batch.set(eventRef, {
      spaceId,
      campusId: CAMPUS_ID,
      title: event.title,
      description: event.description,
      type: 'event',
      status: 'published',
      startAt: admin.firestore.Timestamp.fromDate(startAt),
      endAt: admin.firestore.Timestamp.fromDate(endAt),
      isAllDay: false,
      location: {
        type: 'physical',
        venue: event.location,
      },
      visibility: 'public',
      featured: true,
      isLive: false,
      currentAttendees: 0,
      rsvps: [],
      createdBy: SYSTEM_USER,
      createdByName: 'HIVE Bot',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 4. Mark space as featured
  const spaceRef = db.collection('spaces').doc(spaceId);
  batch.update(spaceRef, {
    isFeatured: true,
    updatedAt: now,
  });

  await batch.commit();
  console.log(`✅ Seeded: ${seed.slugPattern} (${spaceId})`);
}

async function main() {
  console.log('🐝 Seeding featured spaces with content...\n');

  for (const seed of SEED_SPACES) {
    try {
      await seedSpace(seed);
    } catch (err) {
      console.error(`❌ Failed to seed ${seed.slugPattern}:`, err);
    }
  }

  console.log('\n✅ Done! Seeded 5 key spaces with welcome messages, pinned posts, and events.');
}

main().catch(console.error);
