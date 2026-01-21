/**
 * Migration script: Migrate existing spaces to identity-based classification
 *
 * Classifies existing spaces into identity types:
 * - university_org → Check if major (matches catalog) → identityType: 'major'
 * - university_org (non-major) → identityType: 'interest'
 * - student_org → identityType: 'interest'
 * - greek_life → identityType: 'community', communityType: 'greek'
 * - residential → identityType: 'residence'
 *
 * For major spaces:
 * - Set isUnlocked = memberCount >= 10
 * - Set unlockThreshold = 10
 *
 * Run with: npx ts-node scripts/migrate-spaces-to-identity.ts --campus=ub-buffalo [--dry-run]
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
const isDryRun = args.includes('--dry-run');

// Common major names (UB Buffalo example - extend for your campus)
const MAJOR_KEYWORDS = [
  'computer science', 'cs', 'biology', 'chemistry', 'physics', 'mathematics', 'math',
  'engineering', 'business', 'economics', 'psychology', 'sociology', 'anthropology',
  'history', 'english', 'philosophy', 'political science', 'communications',
  'mechanical engineering', 'electrical engineering', 'civil engineering',
  'biomedical engineering', 'chemical engineering', 'aerospace engineering',
  'neuroscience', 'pre-med', 'nursing', 'pharmacy', 'architecture',
  'accounting', 'finance', 'marketing', 'management', 'information systems',
  'media study', 'journalism', 'film', 'theater', 'music', 'art',
];

function isMajorSpace(name: string, category: string): boolean {
  const lowerName = name.toLowerCase();

  // Check if name contains major keywords
  for (const keyword of MAJOR_KEYWORDS) {
    if (lowerName.includes(keyword)) {
      return true;
    }
  }

  // Check category
  if (category === 'academic' || category === 'department') {
    return true;
  }

  return false;
}

function classifySpace(space: any): {
  identityType: 'major' | 'residence' | 'interest' | 'community';
  communityType?: string;
  isUnlocked: boolean;
  unlockThreshold: number;
  majorName?: string;
} {
  const category = space.category || space.spaceType || 'student';
  const name = space.name || '';
  const memberCount = space.memberCount || 0;

  // Residential spaces
  if (category === 'residential') {
    return {
      identityType: 'residence',
      isUnlocked: true,
      unlockThreshold: 0,
    };
  }

  // Greek life → community
  if (category === 'greek' || category === 'greek_life') {
    return {
      identityType: 'community',
      communityType: 'greek',
      isUnlocked: true,
      unlockThreshold: 0,
    };
  }

  // University orgs → check if major
  if (category === 'university' || category === 'uni' || category === 'academic' || category === 'university_org') {
    if (isMajorSpace(name, category)) {
      return {
        identityType: 'major',
        majorName: name,
        isUnlocked: memberCount >= 10,
        unlockThreshold: 10,
      };
    } else {
      // Non-major university org → interest
      return {
        identityType: 'interest',
        isUnlocked: true,
        unlockThreshold: 0,
      };
    }
  }

  // Student orgs → interest
  if (category === 'student' || category === 'student_org' || category === 'social') {
    return {
      identityType: 'interest',
      isUnlocked: true,
      unlockThreshold: 0,
    };
  }

  // Default → interest
  return {
    identityType: 'interest',
    isUnlocked: true,
    unlockThreshold: 0,
  };
}

async function migrateSpaces() {
  console.log(`\n🔄 Migrating spaces to identity-based classification`);
  console.log(`   Campus: ${campusId}`);
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

  try {
    // Fetch all spaces for campus
    const spacesSnapshot = await db
      .collection('spaces')
      .where('campusId', '==', campusId)
      .get();

    console.log(`📊 Found ${spacesSnapshot.size} spaces to process\n`);

    let processed = 0;
    let skipped = 0;
    let majorSpaces = 0;
    let unlockedMajors = 0;

    for (const doc of spacesSnapshot.docs) {
      const space = doc.data();
      const spaceId = doc.id;

      // Skip if already has identityType
      if (space.identityType) {
        skipped++;
        continue;
      }

      // Classify space
      const classification = classifySpace(space);

      console.log(`📝 ${space.name}`);
      console.log(`   Current: ${space.category || space.spaceType || 'unknown'}`);
      console.log(`   New: identityType=${classification.identityType}`);

      if (classification.identityType === 'major') {
        majorSpaces++;
        console.log(`   Major: ${classification.majorName}`);
        console.log(`   Members: ${space.memberCount || 0}`);
        console.log(`   Status: ${classification.isUnlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}`);
        if (classification.isUnlocked) unlockedMajors++;
      }

      if (classification.communityType) {
        console.log(`   Community Type: ${classification.communityType}`);
      }

      console.log('');

      // Update space (unless dry run)
      if (!isDryRun) {
        const updates: any = {
          identityType: classification.identityType,
          isUnlocked: classification.isUnlocked,
          unlockThreshold: classification.unlockThreshold,
          updatedAt: new Date().toISOString(),
        };

        if (classification.majorName) {
          updates.majorName = classification.majorName;
        }

        if (classification.communityType) {
          updates.communityType = classification.communityType;
        }

        // Set isUniversal = false for regular spaces (only universal community spaces have this true)
        if (classification.identityType === 'community' && classification.communityType !== 'greek') {
          updates.isUniversal = false;
        }

        await db.collection('spaces').doc(spaceId).update(updates);
      }

      processed++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total spaces: ${spacesSnapshot.size}`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Skipped (already migrated): ${skipped}`);
    console.log(`   Major spaces identified: ${majorSpaces}`);
    console.log(`   Unlocked majors: ${unlockedMajors}`);
    console.log(`   Locked majors: ${majorSpaces - unlockedMajors}\n`);

    if (isDryRun) {
      console.log('⚠️  DRY RUN - No changes were made');
      console.log('   Run without --dry-run to apply changes\n');
    } else {
      console.log('✅ Migration complete!\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateSpaces()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
