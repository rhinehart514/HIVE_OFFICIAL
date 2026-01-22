#!/usr/bin/env node
/**
 * CampusLabs Organization Importer
 *
 * Fetches all organizations from a CampusLabs Engage instance and creates
 * corresponding HIVE spaces with proper category mapping.
 *
 * Usage:
 *   node scripts/import-campuslabs.mjs [--dry-run] [--campus ub-buffalo]
 *
 * Options:
 *   --dry-run     Preview what would be imported without writing to Firestore
 *   --campus      Campus ID to associate spaces with (default: ub-buffalo)
 *   --limit       Limit number of orgs to import (for testing)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // CampusLabs API endpoint (UB Buffalo)
  CAMPUSLABS_API: 'https://buffalo.campuslabs.com/engage/api/discovery/search/organizations',
  CAMPUSLABS_BASE_URL: 'https://buffalo.campuslabs.com/engage',

  // Canonical HIVE space types mapped from CampusLabs branch IDs
  BRANCH_MAP: {
    1419: 'student_organizations',      // Student Organizations
    360210: 'university_organizations', // University Services
    360211: 'greek_life',               // Greek Life
    360212: 'campus_living',            // Residential / Campus Living
  },

  // Default for unknown branches
  DEFAULT_CATEGORY: 'student_organizations',

  // Batch size for Firestore writes
  BATCH_SIZE: 400,
};

// =============================================================================
// Firebase Initialization
// =============================================================================

function initFirebase() {
  const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });

    const projectId = envVars.FIREBASE_PROJECT_ID || envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
    let privateKey = envVars.FIREBASE_PRIVATE_KEY;
    const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;

    // Handle private key (could be base64 encoded or raw with escaped newlines)
    if (privateKeyBase64) {
      privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    } else if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
    }

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId
    });

    console.log(`Connected to Firebase project: ${projectId}`);
    return getFirestore();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// CampusLabs API
// =============================================================================

async function fetchAllOrganizations() {
  const orgs = [];
  let skip = 0;
  const top = 100; // Max per request

  console.log('Fetching organizations from CampusLabs...');

  while (true) {
    const url = `${CONFIG.CAMPUSLABS_API}?top=${top}&skip=${skip}`;
    console.log(`  Fetching ${skip} - ${skip + top}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const batch = data.value || [];

    if (batch.length === 0) break;

    orgs.push(...batch);
    skip += top;

    // Rate limiting - be nice to their API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`  Total: ${orgs.length} organizations\n`);
  return orgs;
}

// =============================================================================
// Data Transformation
// =============================================================================

function mapCategory(branchId) {
  return CONFIG.BRANCH_MAP[branchId] || CONFIG.DEFAULT_CATEGORY;
}

function generateSlug(name, shortName, websiteKey) {
  // Prefer websiteKey if it exists
  if (websiteKey && websiteKey.length > 0) {
    return websiteKey.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  // Fall back to shortName or name
  const base = shortName || name;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function transformOrganization(org, campusId) {
  const category = mapCategory(org.ParentOrganizationId);
  const slug = generateSlug(org.Name, org.ShortName, org.WebsiteKey);
  const description = org.Summary || stripHtml(org.Description) || `Welcome to ${org.Name}`;

  // Extract tags from CategoryNames
  const tags = (org.CategoryNames || [])
    .map(t => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'))
    .filter(t => t.length > 0 && t.length < 30)
    .slice(0, 10); // Max 10 tags

  return {
    // Core identification
    name: org.Name,
    name_lowercase: org.Name.toLowerCase(),
    slug: slug,
    description: description.substring(0, 500), // Cap description length
    category: category,

    // Source tracking for sync
    source: {
      platform: 'campuslabs',
      id: org.Id,
      branchId: org.ParentOrganizationId,
      websiteKey: org.WebsiteKey,
      url: `${CONFIG.CAMPUSLABS_BASE_URL}/organization/${org.WebsiteKey || org.Id}`,
      importedAt: FieldValue.serverTimestamp(),
      lastSyncedAt: FieldValue.serverTimestamp(),
    },

    // Status
    status: org.Status === 'Active' ? 'active' : 'inactive',
    isActive: org.Status === 'Active',
    visibility: org.Visibility === 'Public' ? 'public' : 'private',
    claimStatus: 'unclaimed', // Ready for real org leader to claim
    publishStatus: 'live', // Make visible in browse API

    // Tags for discovery
    tags: tags,
    campusLabsCategories: org.CategoryNames || [],

    // Campus association
    campusId: campusId,

    // Metadata
    createdBy: 'campuslabs-import',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),

    // Metrics (will be calculated from real data)
    metrics: {
      memberCount: 0,
      postCount: 0,
      eventCount: 0,
      toolCount: 0,
    },

    // Images
    logoUrl: org.ProfilePicture
      ? `https://se-images.campuslabs.com/clink/images/${org.ProfilePicture}?preset=small-sq`
      : null,
    bannerUrl: null,
  };
}

// =============================================================================
// Firestore Operations
// =============================================================================

async function importToFirestore(db, spaces, dryRun = false) {
  console.log(`\nImporting ${spaces.length} spaces to Firestore...`);

  if (dryRun) {
    console.log('  [DRY RUN] No changes will be made.\n');
  }

  const stats = {
    created: 0,
    skipped: 0,
    errors: 0,
    byCategory: {
      student_organizations: 0,
      university_organizations: 0,
      greek_life: 0,
      campus_living: 0,
    }
  };

  // Process in batches
  for (let i = 0; i < spaces.length; i += CONFIG.BATCH_SIZE) {
    const batchSpaces = spaces.slice(i, i + CONFIG.BATCH_SIZE);
    const batch = db.batch();

    for (const space of batchSpaces) {
      // Generate document ID from source
      const docId = `campuslabs-${space.source.id}`;
      const ref = db.collection('spaces').doc(docId);

      // Check if exists
      const existing = await ref.get();
      if (existing.exists) {
        stats.skipped++;
        continue;
      }

      if (!dryRun) {
        batch.set(ref, space);
      }

      stats.created++;
      stats.byCategory[space.category]++;
    }

    if (!dryRun && stats.created > 0) {
      await batch.commit();
    }

    console.log(`  Processed ${Math.min(i + CONFIG.BATCH_SIZE, spaces.length)}/${spaces.length}`);
  }

  return stats;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const campusId = args.find(a => a.startsWith('--campus='))?.split('=')[1] || 'ub-buffalo';
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 0;

  console.log('='.repeat(60));
  console.log('CampusLabs Organization Importer');
  console.log('='.repeat(60));
  console.log(`Campus: ${campusId}`);
  console.log(`Dry Run: ${dryRun}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log('');

  // Initialize Firebase
  const db = initFirebase();

  // Fetch organizations
  let orgs = await fetchAllOrganizations();

  // Apply limit if specified
  if (limit > 0) {
    orgs = orgs.slice(0, limit);
    console.log(`Limited to ${limit} organizations for testing.\n`);
  }

  // Transform to HIVE spaces
  console.log('Transforming organizations to HIVE spaces...');
  const spaces = orgs.map(org => transformOrganization(org, campusId));

  // Show category distribution
  const categoryCount = spaces.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});

  console.log('\nCategory distribution:');
  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  // Import to Firestore
  const stats = await importToFirestore(db, spaces, dryRun);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Import Complete');
  console.log('='.repeat(60));
  console.log(`Created: ${stats.created}`);
  console.log(`Skipped (already exists): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('\nBy category:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    if (count > 0) console.log(`  ${cat}: ${count}`);
  });

  if (dryRun) {
    console.log('\n[DRY RUN] No changes were made. Remove --dry-run to import.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
