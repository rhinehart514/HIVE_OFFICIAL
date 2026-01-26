/**
 * CampusLabs Organization Scraper
 *
 * Fetches organizations from any CampusLabs/Engage instance and seeds to Firestore.
 * Uses their public REST API - no browser automation needed.
 *
 * Usage:
 *   npx ts-node scripts/scrapers/campuslabs-scraper.ts [options]
 *
 * Options:
 *   --school <subdomain>   CampusLabs subdomain (default: buffalo)
 *   --campus-id <id>       HIVE campus ID (default: ub-buffalo)
 *   --dry-run              Preview without writing to Firestore
 *   --force                Overwrite existing spaces
 *   --limit <n>            Limit number of orgs to fetch (for testing)
 *
 * Examples:
 *   npx ts-node scripts/scrapers/campuslabs-scraper.ts --dry-run
 *   npx ts-node scripts/scrapers/campuslabs-scraper.ts --school nyu --campus-id nyu-main
 *   npx ts-node scripts/scrapers/campuslabs-scraper.ts --limit 50 --dry-run
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

// ============================================
// TYPES
// ============================================

interface CampusLabsOrg {
  Id: string;
  InstitutionId: number;
  BranchId: number;
  Name: string;
  ShortName: string | null;
  WebsiteKey: string;
  ProfilePicture: string | null;
  Description: string | null;
  Summary: string | null;
  CategoryIds: string[];
  CategoryNames: string[];
  Status: string;
  Visibility: string;
}

interface CampusLabsBranch {
  id: number;
  name: string;
  websiteKey: string;
  summary: string | null;
  profilePicture: string | null;
}

interface CampusLabsCategory {
  id: number;
  name: string;
  description: string | null;
}

interface CampusLabsSearchResponse {
  '@odata.count': number;
  value: CampusLabsOrg[];
}

interface CampusLabsListResponse<T> {
  totalItems: number;
  items: T[];
}

// HIVE space categories mapped from CampusLabs branches
type HiveSpaceCategory = 'student_org' | 'university_org' | 'greek_life' | 'residential';

interface HiveSpace {
  id: string;
  campusLabsId: string;
  name: string;
  name_lowercase: string;
  slug: string;
  description: string;
  category: HiveSpaceCategory;
  status: 'active' | 'inactive';
  isActive: boolean;
  visibility: 'public' | 'private';
  claimStatus: 'unclaimed' | 'pending' | 'claimed';
  publishStatus: 'draft' | 'live';
  tags: string[];
  logoUrl: string | null;
  bannerUrl: string | null;
  campusId: string;
  source: 'campuslabs';
  sourceUrl: string;
  metrics: {
    memberCount: number;
    postCount: number;
    eventCount: number;
    toolCount: number;
  };
  createdBy: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// ============================================
// CONFIGURATION
// ============================================

interface ScraperConfig {
  school: string;           // CampusLabs subdomain
  campusId: string;         // HIVE campus ID
  dryRun: boolean;
  force: boolean;
  limit: number | null;
  pageSize: number;
  rateLimitMs: number;
}

// Known branch ID → HIVE category mappings
// These are institution-specific and need to be configured per school
const BRANCH_MAPPINGS: Record<string, Record<number, HiveSpaceCategory>> = {
  buffalo: {
    1419: 'student_org',      // Student Organizations (555)
    360210: 'university_org', // University Departments (73)
    360211: 'greek_life',     // Fraternity & Sorority Life (18)
    360212: 'residential',    // Campus Living (21)
  },
  // Add more schools as needed
  // nyu: { ... },
  // michigan: { ... },
};

// Default category if branch not mapped
const DEFAULT_CATEGORY: HiveSpaceCategory = 'student_org';

// ============================================
// API CLIENT
// ============================================

class CampusLabsClient {
  private baseUrl: string;
  private imageBaseUrl = 'https://se-images.campuslabs.com/clink/images';

  constructor(school: string) {
    this.baseUrl = `https://${school}.campuslabs.com/engage/api/discovery`;
  }

  /**
   * Fetch organizations with pagination
   */
  async fetchOrganizations(skip: number, top: number): Promise<CampusLabsSearchResponse> {
    const url = new URL(`${this.baseUrl}/search/organizations`);
    url.searchParams.set('orderBy[0]', 'UpperName asc');
    url.searchParams.set('top', String(top));
    url.searchParams.set('skip', String(skip));
    url.searchParams.set('filter', '');
    url.searchParams.set('query', '');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch all organizations with automatic pagination
   */
  async *fetchAllOrganizations(
    pageSize: number,
    rateLimitMs: number,
    limit: number | null = null
  ): AsyncGenerator<CampusLabsOrg, void, unknown> {
    let skip = 0;
    let totalFetched = 0;
    let totalCount = 0;

    do {
      const response = await this.fetchOrganizations(skip, pageSize);
      totalCount = response['@odata.count'];

      for (const org of response.value) {
        yield org;
        totalFetched++;

        if (limit && totalFetched >= limit) {
          return;
        }
      }

      skip += pageSize;

      // Rate limiting
      if (skip < totalCount) {
        await sleep(rateLimitMs);
      }
    } while (skip < totalCount && (!limit || totalFetched < limit));
  }

  /**
   * Fetch branch metadata
   */
  async fetchBranches(): Promise<CampusLabsBranch[]> {
    const url = new URL(`${this.baseUrl}/branch`);
    url.searchParams.set('take', '100');
    url.searchParams.set('orderByField', 'name');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch branches: ${response.status}`);
    }
    const data: CampusLabsListResponse<CampusLabsBranch> = await response.json();
    return data.items;
  }

  /**
   * Fetch category metadata
   */
  async fetchCategories(): Promise<CampusLabsCategory[]> {
    const url = new URL(`${this.baseUrl}/organization/category`);
    url.searchParams.set('take', '100');
    url.searchParams.set('orderByField', 'name');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    const data: CampusLabsListResponse<CampusLabsCategory> = await response.json();
    return data.items;
  }

  /**
   * Get full image URL from ProfilePicture filename
   */
  getImageUrl(profilePicture: string | null): string | null {
    if (!profilePicture) return null;
    return `${this.imageBaseUrl}/${profilePicture}`;
  }

  /**
   * Get organization page URL
   */
  getOrgUrl(school: string, websiteKey: string): string {
    return `https://${school}.campuslabs.com/engage/organization/${websiteKey}`;
  }
}

// ============================================
// TRANSFORMER
// ============================================

function transformToHiveSpace(
  org: CampusLabsOrg,
  config: ScraperConfig,
  branchMapping: Record<number, HiveSpaceCategory>,
  client: CampusLabsClient
): HiveSpace {
  // Determine category from branch
  const category = branchMapping[org.BranchId] || DEFAULT_CATEGORY;

  // Clean description (strip HTML)
  const cleanDescription = org.Summary ||
    (org.Description ? stripHtml(org.Description) : '') ||
    `${org.Name} at ${config.school.toUpperCase()}`;

  // Generate slug from WebsiteKey or name
  const slug = org.WebsiteKey && org.WebsiteKey !== 'nowebsite'
    ? org.WebsiteKey
    : slugify(org.Name);

  // Generate document ID
  const docId = `${config.campusId}-cl-${org.Id}`;

  // Map CampusLabs categories to tags
  const tags = org.CategoryNames
    .map(name => slugify(name))
    .filter(tag => tag.length > 0 && tag.length < 30)
    .slice(0, 10); // Limit tags

  return {
    id: docId,
    campusLabsId: org.Id,
    name: org.Name.trim(),
    name_lowercase: org.Name.trim().toLowerCase(),
    slug,
    description: cleanDescription.slice(0, 500), // Limit length
    category,
    status: org.Status === 'Active' ? 'active' : 'inactive',
    isActive: org.Status === 'Active',
    visibility: org.Visibility === 'Public' ? 'public' : 'private',
    claimStatus: 'unclaimed',
    publishStatus: 'live',
    tags,
    logoUrl: client.getImageUrl(org.ProfilePicture),
    bannerUrl: null,
    campusId: config.campusId,
    source: 'campuslabs',
    sourceUrl: client.getOrgUrl(config.school, org.WebsiteKey),
    metrics: {
      memberCount: 0,
      postCount: 0,
      eventCount: 0,
      toolCount: 0,
    },
    createdBy: 'system',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

// ============================================
// UTILITIES
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 50);
}

function parseArgs(): ScraperConfig {
  const args = process.argv.slice(2);

  const getArg = (name: string, defaultValue: string): string => {
    const index = args.indexOf(`--${name}`);
    if (index !== -1 && args[index + 1]) {
      return args[index + 1];
    }
    return defaultValue;
  };

  return {
    school: getArg('school', 'buffalo'),
    campusId: getArg('campus-id', 'ub-buffalo'),
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    limit: args.includes('--limit') ? parseInt(getArg('limit', '0'), 10) : null,
    pageSize: 50,
    rateLimitMs: 200, // 200ms between API calls
  };
}

// ============================================
// MAIN
// ============================================

async function main() {
  const config = parseArgs();

  console.log('\n🐝 CampusLabs Organization Scraper\n');
  console.log(`School: ${config.school}.campuslabs.com`);
  console.log(`Campus ID: ${config.campusId}`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Force overwrite: ${config.force}`);
  if (config.limit) console.log(`Limit: ${config.limit} organizations`);
  console.log('');

  const client = new CampusLabsClient(config.school);

  // Fetch metadata first
  console.log('📋 Fetching metadata...');
  const [branches, categories] = await Promise.all([
    client.fetchBranches(),
    client.fetchCategories(),
  ]);

  console.log(`   Found ${branches.length} branches:`);
  branches.forEach(b => console.log(`     - ${b.name} (ID: ${b.id})`));
  console.log(`   Found ${categories.length} categories`);
  console.log('');

  // Get branch mapping for this school
  const branchMapping = BRANCH_MAPPINGS[config.school] || {};
  if (Object.keys(branchMapping).length === 0) {
    console.log('⚠️  No branch mapping found for this school.');
    console.log('   All organizations will be categorized as "student_org".');
    console.log('   Add mappings to BRANCH_MAPPINGS for proper categorization.\n');
  }

  // Fetch organizations
  console.log('📥 Fetching organizations...');

  const spaces: HiveSpace[] = [];
  const stats = {
    total: 0,
    active: 0,
    byCategory: {} as Record<HiveSpaceCategory, number>,
  };

  for await (const org of client.fetchAllOrganizations(config.pageSize, config.rateLimitMs, config.limit)) {
    const space = transformToHiveSpace(org, config, branchMapping, client);
    spaces.push(space);

    stats.total++;
    if (space.isActive) stats.active++;
    stats.byCategory[space.category] = (stats.byCategory[space.category] || 0) + 1;

    // Progress indicator
    if (stats.total % 100 === 0) {
      console.log(`   Fetched ${stats.total} organizations...`);
    }
  }

  console.log(`\n✅ Fetched ${stats.total} organizations`);
  console.log(`   Active: ${stats.active}`);
  console.log('   By category:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`     - ${cat}: ${count}`);
  });
  console.log('');

  // Dry run - just show what would be written
  if (config.dryRun) {
    console.log('📋 DRY RUN - Sample spaces that would be created:\n');
    spaces.slice(0, 10).forEach(space => {
      console.log(`  📍 ${space.name}`);
      console.log(`     ID: ${space.id}`);
      console.log(`     Category: ${space.category}`);
      console.log(`     Tags: ${space.tags.slice(0, 3).join(', ')}${space.tags.length > 3 ? '...' : ''}`);
      console.log(`     Logo: ${space.logoUrl ? '✓' : '✗'}`);
      console.log('');
    });
    console.log(`... and ${spaces.length - 10} more\n`);
    console.log('✅ Dry run complete. Remove --dry-run to write to Firestore.');
    return;
  }

  // Initialize Firebase
  if (getApps().length === 0) {
    try {
      initializeApp({
        credential: cert(require('../../service-account.json')),
      });
    } catch (error) {
      console.error('❌ Failed to initialize Firebase. Make sure service-account.json exists.');
      process.exit(1);
    }
  }

  const db = getFirestore();

  // Check for existing data
  if (!config.force) {
    const existing = await db
      .collection('spaces')
      .where('campusId', '==', config.campusId)
      .where('source', '==', 'campuslabs')
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log('⚠️  CampusLabs spaces already exist for this campus.');
      console.log('   Use --force to overwrite existing data.');
      return;
    }
  }

  // Write to Firestore in batches
  console.log('📤 Writing to Firestore...');

  const BATCH_SIZE = 500; // Firestore batch limit
  let written = 0;

  for (let i = 0; i < spaces.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchSpaces = spaces.slice(i, i + BATCH_SIZE);

    for (const space of batchSpaces) {
      const ref = db.collection('spaces').doc(space.id);
      batch.set(ref, space, { merge: config.force });
    }

    await batch.commit();
    written += batchSpaces.length;
    console.log(`   Written ${written}/${spaces.length} spaces...`);
  }

  console.log('\n✅ Successfully seeded all spaces!');
  console.log(`   Collection: spaces`);
  console.log(`   Campus: ${config.campusId}`);
  console.log(`   Total: ${spaces.length}`);
  console.log(`   Source: CampusLabs (${config.school})`);
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
