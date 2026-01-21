/**
 * Seed script to create universal community spaces
 *
 * Creates 6 identity-based community spaces that are always unlocked:
 * 1. International Students
 * 2. Transfer Students
 * 3. First-Gen Students
 * 4. Commuter Students
 * 5. Graduate Students
 * 6. Veterans
 *
 * Run with: npx ts-node scripts/seed-universal-communities.ts --campus=ub-buffalo
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
  process.exit(1);
}

try {
  const credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));

  initializeApp({
    credential: cert(credentials),
    projectId: 'hive-9265c'
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

const db = getFirestore();

// Parse command line args
const args = process.argv.slice(2);
const campusArg = args.find(arg => arg.startsWith('--campus='));
const campusId = campusArg ? campusArg.split('=')[1] : 'ub-buffalo';

interface CommunitySpace {
  name: string;
  description: string;
  communityType: 'international' | 'transfer' | 'firstgen' | 'commuter' | 'graduate' | 'veteran';
  emoji: string;
}

const communitySpaces: CommunitySpace[] = [
  {
    name: 'International Students',
    description: 'Connect with students from around the world. Share experiences, celebrate cultures, and support each other.',
    communityType: 'international',
    emoji: '🌍',
  },
  {
    name: 'Transfer Students',
    description: 'Navigate your transfer journey with fellow students. Get advice, share tips, and build your new community.',
    communityType: 'transfer',
    emoji: '🔄',
  },
  {
    name: 'First-Gen Students',
    description: 'First in your family to go to college? You belong here. Share experiences and support each other.',
    communityType: 'firstgen',
    emoji: '🎓',
  },
  {
    name: 'Commuter Students',
    description: 'Connect with fellow commuters. Share transportation tips, study spots, and stay connected to campus.',
    communityType: 'commuter',
    emoji: '🚗',
  },
  {
    name: 'Graduate Students',
    description: 'Graduate student community. Research, funding, teaching, and navigating grad school together.',
    communityType: 'graduate',
    emoji: '📚',
  },
  {
    name: 'Veterans',
    description: 'Veterans and active military students. Support, resources, and community for those who served.',
    communityType: 'veteran',
    emoji: '🎖️',
  },
];

async function seedUniversalCommunities() {
  console.log(`\nSeeding universal community spaces for campus: ${campusId}\n`);

  for (const community of communitySpaces) {
    const spaceId = `${campusId}_community_${community.communityType}`;
    const handle = `${community.communityType}-students`;

    const spaceData = {
      // Identity
      id: spaceId,
      name: community.name,
      handle: handle,
      slug: handle,
      description: community.description,

      // Classification
      category: 'community',
      spaceType: 'student',
      identityType: 'community',
      communityType: community.communityType,

      // Universal community space (always unlocked, auto-join)
      isUniversal: true,
      isUnlocked: true,

      // Campus isolation
      campusId: campusId,
      schoolId: campusId,

      // Settings
      visibility: 'public',
      isPublic: true,
      isActive: true,
      isVerified: true,
      publishStatus: 'live',

      // Metrics
      memberCount: 0,
      postCount: 0,
      trendingScore: 0,

      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      wentLiveAt: new Date().toISOString(),

      // Source
      source: 'system',
    };

    try {
      await db.collection('spaces').doc(spaceId).set(spaceData, { merge: true });
      console.log(`✅ Created community space: ${community.name} (${community.emoji})`);
      console.log(`   ID: ${spaceId}`);
      console.log(`   Handle: /${handle}`);
      console.log(`   Type: ${community.communityType}\n`);
    } catch (error) {
      console.error(`❌ Failed to create ${community.name}:`, error);
    }
  }

  console.log('✅ Universal community spaces seeding complete!\n');
  console.log('📋 Next steps:');
  console.log('   1. Users with matching identity checkboxes will auto-join these spaces during onboarding');
  console.log('   2. These spaces are always visible and unlocked');
  console.log('   3. Create default boards for each space (General, Events, Resources)\n');
}

seedUniversalCommunities()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
