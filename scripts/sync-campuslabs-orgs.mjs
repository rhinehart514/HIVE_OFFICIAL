#!/usr/bin/env node
/**
 * CampusLabs Organization Sync
 *
 * Syncs CampusLabs organizations with existing HIVE spaces:
 * 1. Matches existing spaces by name (fuzzy matching)
 * 2. Updates matched spaces with CampusLabs source data
 * 3. Optionally creates new spaces for unmatched orgs
 *
 * Usage:
 *   node scripts/sync-campuslabs-orgs.mjs --dry-run           # Preview matches
 *   node scripts/sync-campuslabs-orgs.mjs --update-only       # Only update existing
 *   node scripts/sync-campuslabs-orgs.mjs --create-new        # Also create new spaces
 *
 * Options:
 *   --dry-run       Preview what would be done without writing
 *   --update-only   Only update existing matched spaces (default)
 *   --create-new    Also create spaces for unmatched CampusLabs orgs
 *   --campus        Campus ID (default: ub-buffalo)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  CAMPUSLABS_API: 'https://buffalo.campuslabs.com/engage/api/discovery/search/organizations',
  CAMPUSLABS_BASE_URL: 'https://buffalo.campuslabs.com/engage',

  // Canonical HIVE space types mapped from CampusLabs branch IDs
  BRANCH_MAP: {
    1419: 'student_organizations',
    360210: 'university_organizations',
    360211: 'greek_life',
    360212: 'campus_living',
  },

  DEFAULT_CATEGORY: 'student_organizations',
};

// =============================================================================
// Firebase Init
// =============================================================================

function initFirebase() {
  const envPath = './apps/web/.env.local';
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });

  const projectId = envVars.FIREBASE_PROJECT_ID;
  const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
  const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId
  });

  return getFirestore();
}

// =============================================================================
// CampusLabs API
// =============================================================================

async function fetchAllOrganizations() {
  const orgs = [];
  let skip = 0;
  const top = 100;

  console.log('Fetching organizations from CampusLabs...');

  while (true) {
    const url = `${CONFIG.CAMPUSLABS_API}?top=${top}&skip=${skip}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const batch = data.value || [];
    if (batch.length === 0) break;

    orgs.push(...batch);
    skip += top;
    process.stdout.write(`  Fetched ${orgs.length}...\r`);

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`  Total: ${orgs.length} organizations\n`);
  return orgs;
}

// =============================================================================
// Name Matching
// =============================================================================

function normalizeForMatch(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function buildMatchIndex(campusLabsOrgs) {
  const index = new Map();

  for (const org of campusLabsOrgs) {
    const normalizedName = normalizeForMatch(org.Name);
    index.set(normalizedName, org);

    // Also index by short name if available
    if (org.ShortName) {
      index.set(normalizeForMatch(org.ShortName), org);
    }
  }

  return index;
}

function findBestMatch(hiveName, campusLabsIndex, campusLabsOrgs) {
  const normalized = normalizeForMatch(hiveName);

  // Exact match
  if (campusLabsIndex.has(normalized)) {
    return { match: campusLabsIndex.get(normalized), confidence: 'exact' };
  }

  // Substring match
  for (const org of campusLabsOrgs) {
    const orgNorm = normalizeForMatch(org.Name);
    if (normalized.includes(orgNorm) || orgNorm.includes(normalized)) {
      return { match: org, confidence: 'substring' };
    }
  }

  return null;
}

// =============================================================================
// Sync Logic
// =============================================================================

async function syncOrganizations(db, options = {}) {
  const { dryRun = false, createNew = false, campusId = 'ub-buffalo' } = options;

  console.log('='.repeat(70));
  console.log('CAMPUSLABS ORGANIZATION SYNC');
  console.log('='.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Create new spaces: ${createNew ? 'YES' : 'NO'}`);
  console.log(`Campus: ${campusId}\n`);

  // Fetch CampusLabs data
  const campusLabsOrgs = await fetchAllOrganizations();
  const campusLabsIndex = buildMatchIndex(campusLabsOrgs);

  // Fetch existing HIVE spaces
  console.log('Loading existing HIVE spaces...');
  const spacesSnapshot = await db.collection('spaces')
    .where('campusId', '==', campusId)
    .get();

  console.log(`  Found ${spacesSnapshot.size} existing spaces\n`);

  const stats = {
    matched: [],
    unmatched: [],
    newOrgs: [],
    updated: 0,
    created: 0,
    errors: 0,
  };

  // Track which CampusLabs orgs we've matched
  const matchedOrgIds = new Set();

  // Match existing spaces to CampusLabs orgs
  console.log('Matching spaces to CampusLabs organizations...');

  for (const doc of spacesSnapshot.docs) {
    const data = doc.data();
    const match = findBestMatch(data.name, campusLabsIndex, campusLabsOrgs);

    if (match) {
      stats.matched.push({
        hiveId: doc.id,
        hiveName: data.name,
        campusLabsId: match.match.Id,
        campusLabsName: match.match.Name,
        confidence: match.confidence,
        currentCategory: data.category || data.type,
        correctCategory: CONFIG.BRANCH_MAP[match.match.ParentOrganizationId] || CONFIG.DEFAULT_CATEGORY,
      });
      matchedOrgIds.add(match.match.Id);
    } else {
      stats.unmatched.push({
        hiveId: doc.id,
        hiveName: data.name,
      });
    }
  }

  // Find CampusLabs orgs that don't exist in HIVE
  for (const org of campusLabsOrgs) {
    if (!matchedOrgIds.has(org.Id)) {
      stats.newOrgs.push(org);
    }
  }

  // Report matches
  console.log(`\n--- MATCHING RESULTS ---`);
  console.log(`  Matched: ${stats.matched.length}`);
  console.log(`  Unmatched HIVE spaces: ${stats.unmatched.length}`);
  console.log(`  New CampusLabs orgs (not in HIVE): ${stats.newOrgs.length}`);

  // Show match samples
  console.log('\n--- SAMPLE MATCHES (first 10) ---');
  stats.matched.slice(0, 10).forEach(m => {
    console.log(`  ✓ "${m.hiveName}" → "${m.campusLabsName}" (${m.confidence})`);
  });

  // Show unmatched samples
  if (stats.unmatched.length > 0) {
    console.log('\n--- UNMATCHED HIVE SPACES (first 10) ---');
    stats.unmatched.slice(0, 10).forEach(m => {
      console.log(`  ? "${m.hiveName}"`);
    });
  }

  // Show new org samples
  if (stats.newOrgs.length > 0) {
    console.log('\n--- NEW CAMPUSLABS ORGS (first 10) ---');
    stats.newOrgs.slice(0, 10).forEach(org => {
      console.log(`  + "${org.Name}" (Branch: ${org.ParentOrganizationId})`);
    });
  }

  // Update matched spaces with source tracking
  if (!dryRun && stats.matched.length > 0) {
    console.log('\n--- UPDATING MATCHED SPACES ---');

    const batch = db.batch();
    let batchCount = 0;

    for (const match of stats.matched) {
      const ref = db.collection('spaces').doc(match.hiveId);

      const updateData = {
        // Add/update category
        category: match.correctCategory,

        // Add source tracking
        source: {
          platform: 'campuslabs',
          id: match.campusLabsId,
          name: match.campusLabsName,
          url: `${CONFIG.CAMPUSLABS_BASE_URL}/organization/${match.campusLabsId}`,
          matchedAt: FieldValue.serverTimestamp(),
          matchConfidence: match.confidence,
        },

        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.update(ref, updateData);
      batchCount++;

      // Commit every 400
      if (batchCount >= 400) {
        await batch.commit();
        stats.updated += batchCount;
        console.log(`  Updated ${stats.updated} spaces...`);
        batchCount = 0;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
      stats.updated += batchCount;
    }

    console.log(`  Total updated: ${stats.updated}`);
  }

  // Create new spaces for unmatched CampusLabs orgs
  if (!dryRun && createNew && stats.newOrgs.length > 0) {
    console.log('\n--- CREATING NEW SPACES ---');

    const batch = db.batch();
    let batchCount = 0;

    for (const org of stats.newOrgs) {
      const docId = `campuslabs-${org.Id}`;
      const ref = db.collection('spaces').doc(docId);

      const category = CONFIG.BRANCH_MAP[org.ParentOrganizationId] || CONFIG.DEFAULT_CATEGORY;
      const description = org.Summary || stripHtml(org.Description) || `Welcome to ${org.Name}`;

      const spaceData = {
        name: org.Name,
        name_lowercase: org.Name.toLowerCase(),
        slug: org.WebsiteKey || org.Id,
        description: description.substring(0, 500),
        category: category,
        type: categoryToType(category), // Keep old type field for compatibility

        source: {
          platform: 'campuslabs',
          id: org.Id,
          name: org.Name,
          branchId: org.ParentOrganizationId,
          websiteKey: org.WebsiteKey,
          url: `${CONFIG.CAMPUSLABS_BASE_URL}/organization/${org.WebsiteKey || org.Id}`,
          importedAt: FieldValue.serverTimestamp(),
        },

        status: org.Status === 'Active' ? 'active' : 'inactive',
        isActive: org.Status === 'Active',
        visibility: org.Visibility === 'Public' ? 'public' : 'private',
        claimStatus: 'unclaimed',

        campusId: campusId,
        createdBy: 'campuslabs-sync',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),

        metrics: { memberCount: 0, postCount: 0, eventCount: 0, toolCount: 0 },

        logoUrl: org.ProfilePicture
          ? `https://se-images.campuslabs.com/clink/images/${org.ProfilePicture}?preset=small-sq`
          : null,
      };

      batch.set(ref, spaceData);
      batchCount++;

      if (batchCount >= 400) {
        await batch.commit();
        stats.created += batchCount;
        console.log(`  Created ${stats.created} spaces...`);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      stats.created += batchCount;
    }

    console.log(`  Total created: ${stats.created}`);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SYNC SUMMARY');
  console.log('='.repeat(70));
  console.log(`Matched to CampusLabs: ${stats.matched.length}`);
  console.log(`Updated with source data: ${stats.updated}`);
  console.log(`Unmatched HIVE spaces: ${stats.unmatched.length}`);
  if (createNew) {
    console.log(`New spaces created: ${stats.created}`);
  } else {
    console.log(`CampusLabs orgs not in HIVE: ${stats.newOrgs.length} (use --create-new to import)`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] No changes made. Remove --dry-run to execute.');
  }

  return stats;
}

// =============================================================================
// Helpers
// =============================================================================

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Category and type are now unified - no transformation needed
function categoryToType(category) {
  return category;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const createNew = args.includes('--create-new');
  const campusId = args.find(a => a.startsWith('--campus='))?.split('=')[1] || 'ub-buffalo';

  const db = initFirebase();
  await syncOrganizations(db, { dryRun, createNew, campusId });
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Sync failed:', e);
    process.exit(1);
  });
