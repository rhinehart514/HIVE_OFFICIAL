#!/usr/bin/env npx tsx
/**
 * CampusLabs Unified Importer
 *
 * Production-grade importer for organizations and events from CampusLabs.
 * Designed for semester imports (not continuous sync).
 *
 * Features:
 * - Uses detail endpoints for FULL data (not just search)
 * - Aligns with HIVE domain schemas
 * - Captures: email, contact, founding date, social media, org type
 * - Imports both organizations (spaces) and events
 * - Clean replace mode for semester refreshes
 *
 * Usage:
 *   pnpm exec tsx scripts/scrapers/campuslabs-importer.ts --dry-run
 *   pnpm exec tsx scripts/scrapers/campuslabs-importer.ts --json-only        # Just fetch and save JSON (no Firebase needed)
 *   pnpm exec tsx scripts/scrapers/campuslabs-importer.ts --replace          # Clean replace (recommended for semester imports)
 *   pnpm exec tsx scripts/scrapers/campuslabs-importer.ts --orgs-only
 *   pnpm exec tsx scripts/scrapers/campuslabs-importer.ts --events-only
 *   pnpm exec tsx scripts/scrapers/campuslabs-importer.ts --school nyu --campus-id nyu-main
 *
 * Semester Import (recommended):
 *   pnpm exec tsx scripts/scrapers/campuslabs-importer.ts --json-only        # Step 1: Fetch data
 *   pnpm exec tsx scripts/scrapers/campuslabs-importer.ts --replace          # Step 2: Import to Firestore (needs credentials)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================
// DOMAIN TYPES (aligned with packages/core)
// ============================================

/**
 * Space types - canonical values from domain
 */
type SpaceType =
  | 'student_organizations'
  | 'university_organizations'
  | 'greek_life'
  | 'campus_living'
  | 'hive_exclusive';

/**
 * Space source - must be 'ublinked' for imported data
 */
type SpaceSource = 'ublinked' | 'user-created';

/**
 * Space status
 */
type SpaceStatus = 'unclaimed' | 'active' | 'claimed' | 'verified';

/**
 * Publish status
 */
type PublishStatus = 'stealth' | 'live' | 'rejected';

/**
 * Governance model
 */
type GovernanceModel = 'flat' | 'emergent' | 'hybrid' | 'hierarchical';

/**
 * Event type - aligned with validation schema
 */
type EventType =
  | 'meeting'
  | 'workshop'
  | 'social'
  | 'academic'
  | 'sports'
  | 'cultural'
  | 'professional'
  | 'other';

/**
 * Event status
 */
type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

// ============================================
// CAMPUSLABS API TYPES
// ============================================

interface CLOrgDetail {
  id: number;
  institutionId: number;
  name: string;
  shortName: string | null;
  websiteKey: string;
  email: string | null;
  description: string | null;
  summary: string | null;
  status: string;
  visibility: string;
  startDate: string | null;
  modifiedOn: string | null;
  profilePicture: string | null;
  organizationType: {
    id: number;
    branchId: number;
    name: string;
  };
  primaryContact: {
    firstName: string;
    lastName: string;
  } | null;
  contactInfo: Array<{
    city: string | null;
    state: string | null;
    country: string | null;
  }>;
  socialMedia: {
    ExternalWebsite?: string;
    InstagramUrl?: string;
    TwitterUrl?: string;
    FacebookUrl?: string;
    LinkedInUrl?: string;
    YoutubeUrl?: string;
  };
  categories: Array<{ id: number; name: string }>;
}

interface CLEventDetail {
  id: number;
  institutionId: number;
  organizationId: number;
  organizationIds: number[];
  name: string;
  description: string | null;
  startsOn: string;
  endsOn: string;
  imagePath: string | null;
  imageUrl: string | null;
  theme: string;
  visibility: string;
  address: {
    name: string | null;
    address: string | null;
    line1: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    latitude: string | null;
    longitude: string | null;
    onlineLocation: string | null;
  };
  benefits: string[];
  categories: Array<{ id: number; name: string }>;
  rsvpSettings: {
    totalRsvps: number;
    totalGuests: number;
    isInviteOnly: boolean;
    totalAllowed: number | null;
  };
  submittedById: {
    campusEmail: string;
  } | null;
  state: {
    status: string;
  };
}

interface CLSearchResponse<T> {
  '@odata.count': number;
  value: T[];
}

// ============================================
// HIVE DOCUMENT TYPES
// ============================================

interface HiveSpace {
  // Identity
  id: string;
  externalId: string;
  name: string;
  name_lowercase: string;
  slug: string;

  // Description
  description: string;
  descriptionHtml: string | null;

  // Type & Status
  spaceType: SpaceType;
  source: SpaceSource;
  status: SpaceStatus;
  publishStatus: PublishStatus;
  governance: GovernanceModel;
  visibility: 'public' | 'private';

  // Branding
  iconURL: string | null;
  coverImageURL: string | null;

  // Contact
  email: string | null;
  contactName: string | null;
  location: {
    city: string | null;
    state: string | null;
  } | null;

  // Social
  socialLinks: {
    website: string | null;
    instagram: string | null;
    twitter: string | null;
    facebook: string | null;
    linkedin: string | null;
    youtube: string | null;
  };

  // Organization metadata
  orgTypeName: string;
  foundedDate: Date | null;
  tags: string[];

  // Campus
  campusId: string;
  sourceUrl: string;

  // Metrics (initialized)
  memberCount: number;
  postCount: number;

  // Timestamps
  createdAt: FieldValue;
  updatedAt: FieldValue;
  importedAt: FieldValue;
  lastModifiedExternal: Date | null;
}

interface HiveEvent {
  // Identity
  id: string;
  externalId: string;
  title: string;
  title_lowercase: string;

  // Content
  description: string;
  descriptionHtml: string | null;
  coverImageUrl: string | null;

  // Timing
  startAt: Date;
  endAt: Date;

  // Location
  location: {
    type: 'in_person' | 'virtual' | 'hybrid';
    name: string | null;
    address: string | null;
    coordinates: { lat: number; lng: number } | null;
    virtualLink: string | null;
  } | null;

  // Classification
  type: EventType;
  theme: string;
  tags: string[];
  benefits: string[];

  // Status
  status: EventStatus;
  visibility: 'public' | 'members' | 'private';

  // RSVP
  attendeeCount: number;
  maxAttendees: number | null;
  requireApproval: boolean;

  // Relations
  spaceId: string;
  organizerId: string | null;
  coHostSpaceIds: string[];

  // Campus
  campusId: string;
  source: 'ublinked' | 'user-created';  // For query filtering
  sourceUrl: string;

  // Timestamps
  createdAt: FieldValue;
  updatedAt: FieldValue;
  importedAt: FieldValue;
}

// ============================================
// CONFIGURATION
// ============================================

interface ImporterConfig {
  school: string;
  campusId: string;
  dryRun: boolean;
  replace: boolean;  // Delete existing before import
  jsonOnly: boolean; // Only save JSON, skip Firestore
  orgsOnly: boolean;
  eventsOnly: boolean;
  limit: number | null;
  daysAhead: number;
  outputDir: string;
  pageSize: number;
  rateLimitMs: number;
}

const IMAGE_BASE_URL = 'https://se-images.campuslabs.com/clink/images';

/**
 * CampusLabs branch ID to HIVE SpaceType mapping
 * Source: packages/core/src/domain/spaces/constants/space-categories.ts
 */
const BRANCH_TO_SPACE_TYPE: Record<number, SpaceType> = {
  1419: 'student_organizations',       // Student Organizations
  360210: 'university_organizations',  // University Departments
  360211: 'greek_life',                // Fraternity & Sorority Life
  360212: 'campus_living',             // Campus Living Branch
};

/**
 * CampusLabs event theme to HIVE event type mapping
 */
const THEME_TO_EVENT_TYPE: Record<string, EventType> = {
  Social: 'social',
  Cultural: 'cultural',
  ThoughtfulLearning: 'academic',
  Athletics: 'sports',
  Arts: 'cultural',
  Spirituality: 'other',
  GroupBusiness: 'meeting',
  CommunityService: 'other',
  Fundraising: 'other',
};

// ============================================
// API CLIENT
// ============================================

class CampusLabsClient {
  private baseUrl: string;

  constructor(private school: string) {
    this.baseUrl = `https://${school}.campuslabs.com/engage/api/discovery`;
  }

  /**
   * Search organizations (for getting IDs)
   */
  async searchOrganizations(skip: number, take: number): Promise<CLSearchResponse<{ Id: string }>> {
    const url = `${this.baseUrl}/search/organizations?top=${take}&skip=${skip}&orderBy[0]=UpperName%20asc`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Org search failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get FULL organization detail
   */
  async getOrganizationDetail(orgId: string): Promise<CLOrgDetail> {
    const url = `${this.baseUrl}/organization/${orgId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Org detail failed: ${res.status}`);
    return res.json();
  }

  /**
   * Search events (for getting IDs)
   */
  async searchEvents(skip: number, take: number, startsAfter?: string): Promise<CLSearchResponse<{ id: string }>> {
    const url = new URL(`${this.baseUrl}/event/search`);
    url.searchParams.set('take', String(take));
    url.searchParams.set('skip', String(skip));
    url.searchParams.set('status', 'Approved');
    url.searchParams.set('orderByField', 'startsOn');
    url.searchParams.set('orderByDirection', 'ascending');
    if (startsAfter) {
      url.searchParams.set('startsAfter', startsAfter);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Event search failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get FULL event detail
   */
  async getEventDetail(eventId: string): Promise<CLEventDetail> {
    const url = `${this.baseUrl}/event/${eventId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Event detail failed: ${res.status}`);
    return res.json();
  }

  /**
   * Generator for all organizations with full detail
   */
  async *fetchAllOrganizations(
    pageSize: number,
    rateLimitMs: number,
    limit: number | null,
    onProgress?: (count: number, total: number) => void
  ): AsyncGenerator<CLOrgDetail> {
    let skip = 0;
    let fetched = 0;

    // First get total count
    const initial = await this.searchOrganizations(0, 1);
    const totalCount = initial['@odata.count'];

    do {
      const searchResult = await this.searchOrganizations(skip, pageSize);

      for (const org of searchResult.value) {
        // Fetch full detail for each org
        const detail = await this.getOrganizationDetail(org.Id);
        yield detail;
        fetched++;

        if (onProgress) onProgress(fetched, Math.min(totalCount, limit || totalCount));
        if (limit && fetched >= limit) return;

        await sleep(rateLimitMs);
      }

      skip += pageSize;
    } while (skip < totalCount && (!limit || fetched < limit));
  }

  /**
   * Generator for all events with full detail
   */
  async *fetchAllEvents(
    pageSize: number,
    rateLimitMs: number,
    limit: number | null,
    startsAfter?: string,
    onProgress?: (count: number, total: number) => void
  ): AsyncGenerator<CLEventDetail> {
    let skip = 0;
    let fetched = 0;

    // First get total count
    const initial = await this.searchEvents(0, 1, startsAfter);
    const totalCount = initial['@odata.count'];

    do {
      const searchResult = await this.searchEvents(skip, pageSize, startsAfter);

      for (const event of searchResult.value) {
        // Fetch full detail for each event
        const detail = await this.getEventDetail(event.id);
        yield detail;
        fetched++;

        if (onProgress) onProgress(fetched, Math.min(totalCount, limit || totalCount));
        if (limit && fetched >= limit) return;

        await sleep(rateLimitMs);
      }

      skip += pageSize;
    } while (skip < totalCount && (!limit || fetched < limit));
  }

  getImageUrl(path: string | null): string | null {
    if (!path) return null;
    return `${IMAGE_BASE_URL}/${path}`;
  }

  getOrgUrl(websiteKey: string): string {
    return `https://${this.school}.campuslabs.com/engage/organization/${websiteKey}`;
  }

  getEventUrl(eventId: string | number): string {
    return `https://${this.school}.campuslabs.com/engage/event/${eventId}`;
  }
}

// ============================================
// TRANSFORMERS
// ============================================

function transformOrganization(org: CLOrgDetail, config: ImporterConfig, client: CampusLabsClient): HiveSpace {
  const branchId = org.organizationType?.branchId;
  const spaceType = BRANCH_TO_SPACE_TYPE[branchId] || 'student_organizations';

  const slug = org.websiteKey && org.websiteKey !== 'nowebsite'
    ? org.websiteKey
    : slugify(org.name);

  const cleanDescription = org.summary || (org.description ? stripHtml(org.description) : '');

  // Extract social links
  const social = org.socialMedia || {};
  const socialLinks = {
    website: cleanUrl(social.ExternalWebsite) || null,
    instagram: cleanUrl(social.InstagramUrl) || null,
    twitter: cleanUrl(social.TwitterUrl) || null,
    facebook: cleanUrl(social.FacebookUrl) || null,
    linkedin: cleanUrl(social.LinkedInUrl) || null,
    youtube: cleanUrl(social.YoutubeUrl) || null,
  };

  // Extract location from contactInfo
  const contact = org.contactInfo?.[0];
  const location = contact ? {
    city: contact.city || null,
    state: contact.state || null,
  } : null;

  // Extract contact name
  const contactName = org.primaryContact
    ? `${org.primaryContact.firstName} ${org.primaryContact.lastName}`.trim()
    : null;

  // Map categories to tags
  const tags = (org.categories || [])
    .map(c => slugify(c.name))
    .filter(t => t.length > 0 && t.length < 30)
    .slice(0, 10);

  return {
    // Identity
    id: `${config.campusId}-space-${org.id}`,
    externalId: String(org.id),
    name: org.name.trim(),
    name_lowercase: org.name.trim().toLowerCase(),
    slug,

    // Description
    description: cleanDescription.slice(0, 500),
    descriptionHtml: org.description || null,

    // Type & Status
    spaceType,
    source: 'ublinked',  // Canonical source name
    status: 'unclaimed',
    publishStatus: 'live',
    governance: 'hybrid',
    visibility: org.visibility === 'Public' ? 'public' : 'private',

    // Branding
    iconURL: client.getImageUrl(org.profilePicture),
    coverImageURL: null,

    // Contact
    email: org.email || null,
    contactName,
    location,

    // Social
    socialLinks,

    // Organization metadata
    orgTypeName: org.organizationType?.name || 'Student Organization',
    foundedDate: org.startDate ? new Date(org.startDate) : null,
    tags,

    // Campus
    campusId: config.campusId,
    sourceUrl: client.getOrgUrl(org.websiteKey),

    // Metrics
    memberCount: 0,
    postCount: 0,

    // Timestamps
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    importedAt: FieldValue.serverTimestamp(),
    lastModifiedExternal: org.modifiedOn ? new Date(org.modifiedOn) : null,
  };
}

function transformEvent(event: CLEventDetail, config: ImporterConfig, client: CampusLabsClient): HiveEvent {
  const cleanDescription = event.description ? stripHtml(event.description) : '';

  // Determine location type
  const addr = event.address || {};
  const hasPhysical = !!(addr.name || addr.address || addr.line1);
  const hasVirtual = !!addr.onlineLocation;
  const locationType: 'in_person' | 'virtual' | 'hybrid' =
    hasPhysical && hasVirtual ? 'hybrid' :
    hasVirtual ? 'virtual' : 'in_person';

  // Build location object
  const location = (hasPhysical || hasVirtual) ? {
    type: locationType,
    name: addr.name || null,
    address: [addr.line1, addr.city, addr.state, addr.zip].filter(Boolean).join(', ') || null,
    coordinates: addr.latitude && addr.longitude
      ? { lat: parseFloat(addr.latitude), lng: parseFloat(addr.longitude) }
      : null,
    virtualLink: addr.onlineLocation || null,
  } : null;

  // Map theme to event type
  const eventType = THEME_TO_EVENT_TYPE[event.theme] || 'other';

  // Map categories to tags
  const tags = (event.categories || [])
    .map(c => slugify(c.name))
    .filter(t => t.length > 0 && t.length < 30)
    .slice(0, 5);

  // Co-host space IDs (excluding primary)
  const coHostSpaceIds = (event.organizationIds || [])
    .filter(id => id !== event.organizationId)
    .map(id => `${config.campusId}-space-${id}`);

  return {
    // Identity
    id: `${config.campusId}-event-${event.id}`,
    externalId: String(event.id),
    title: event.name.trim(),
    title_lowercase: event.name.trim().toLowerCase(),

    // Content
    description: cleanDescription.slice(0, 2000),
    descriptionHtml: event.description || null,
    coverImageUrl: event.imageUrl || client.getImageUrl(event.imagePath),

    // Timing
    startAt: new Date(event.startsOn),
    endAt: new Date(event.endsOn),

    // Location
    location,

    // Classification
    type: eventType,
    theme: event.theme || 'Other',
    tags,
    benefits: event.benefits || [],

    // Status
    status: event.state?.status === 'Approved' ? 'published' : 'draft',
    visibility: event.visibility === 'Public' ? 'public' : 'members',

    // RSVP
    attendeeCount: event.rsvpSettings?.totalRsvps || 0,
    maxAttendees: event.rsvpSettings?.totalAllowed || null,
    requireApproval: event.rsvpSettings?.isInviteOnly || false,

    // Relations
    spaceId: `${config.campusId}-space-${event.organizationId}`,
    organizerId: event.submittedById?.campusEmail || null,
    coHostSpaceIds,

    // Campus
    campusId: config.campusId,
    source: 'ublinked',  // Imported from CampusLabs
    sourceUrl: client.getEventUrl(event.id),

    // Timestamps
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    importedAt: FieldValue.serverTimestamp(),
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
    .replace(/&#39;/g, "'")
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

function cleanUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;
  return url.trim();
}

function parseArgs(): ImporterConfig {
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
    replace: args.includes('--replace'),  // Clean replace mode
    jsonOnly: args.includes('--json-only'), // Skip Firestore, save JSON only
    orgsOnly: args.includes('--orgs-only'),
    eventsOnly: args.includes('--events-only'),
    limit: args.includes('--limit') ? parseInt(getArg('limit', '0'), 10) : null,
    daysAhead: parseInt(getArg('days-ahead', '90'), 10),
    outputDir: join(process.cwd(), 'scripts/scrapers/import-output'),
    pageSize: 20,  // Smaller batches since we fetch detail for each
    rateLimitMs: 150,
  };
}

// ============================================
// MAIN
// ============================================

async function main() {
  const config = parseArgs();
  const timestamp = new Date().toISOString().split('T')[0];

  console.log('\n======================================');
  console.log('   HIVE CampusLabs Importer');
  console.log('======================================\n');
  console.log(`School:     ${config.school}.campuslabs.com`);
  console.log(`Campus ID:  ${config.campusId}`);
  console.log(`Mode:       ${config.jsonOnly ? 'JSON ONLY (no Firestore)' : config.dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`);
  console.log(`Replace:    ${config.replace ? 'YES - will delete existing first' : 'No - merge only'}`);
  console.log(`Scope:      ${config.orgsOnly ? 'Orgs only' : config.eventsOnly ? 'Events only' : 'Orgs + Events'}`);
  if (config.limit) console.log(`Limit:      ${config.limit}`);
  console.log('');

  mkdirSync(config.outputDir, { recursive: true });

  const client = new CampusLabsClient(config.school);

  // ========================================
  // IMPORT ORGANIZATIONS
  // ========================================

  const spaces: HiveSpace[] = [];
  const spaceStats = {
    total: 0,
    byType: {} as Record<string, number>,
    withEmail: 0,
    withSocial: 0,
  };

  if (!config.eventsOnly) {
    console.log('--- Organizations ---\n');
    console.log('Fetching with full detail (this takes time)...\n');

    for await (const org of client.fetchAllOrganizations(
      config.pageSize,
      config.rateLimitMs,
      config.limit,
      (count, total) => {
        process.stdout.write(`\r  Progress: ${count}/${total} orgs`);
      }
    )) {
      const space = transformOrganization(org, config, client);
      spaces.push(space);

      spaceStats.total++;
      spaceStats.byType[space.spaceType] = (spaceStats.byType[space.spaceType] || 0) + 1;
      if (space.email) spaceStats.withEmail++;
      if (Object.values(space.socialLinks).some(Boolean)) spaceStats.withSocial++;
    }

    console.log('\n\n  Summary:');
    console.log(`    Total:      ${spaceStats.total}`);
    console.log(`    With email: ${spaceStats.withEmail}`);
    console.log(`    With social: ${spaceStats.withSocial}`);
    console.log('    By type:');
    Object.entries(spaceStats.byType).forEach(([type, count]) => {
      console.log(`      - ${type}: ${count}`);
    });

    // Save to JSON (full data if --json-only, otherwise sample)
    const spacesToSave = config.jsonOnly ? spaces : spaces.slice(0, 50);
    writeFileSync(
      join(config.outputDir, `${config.school}-spaces-${timestamp}.json`),
      JSON.stringify(spacesToSave, null, 2)
    );
    console.log(`\n  ${config.jsonOnly ? 'Full export' : 'Sample'} saved: ${config.outputDir}/${config.school}-spaces-${timestamp}.json (${spacesToSave.length} spaces)`);
  }

  // ========================================
  // IMPORT EVENTS
  // ========================================

  const events: HiveEvent[] = [];
  const eventStats = {
    total: 0,
    byType: {} as Record<string, number>,
    byTheme: {} as Record<string, number>,
    withLocation: 0,
    withRsvp: 0,
  };

  if (!config.orgsOnly) {
    console.log('\n--- Events ---\n');
    console.log('Fetching upcoming events with full detail...\n');

    const startsAfter = new Date().toISOString().split('T')[0];

    for await (const event of client.fetchAllEvents(
      config.pageSize,
      config.rateLimitMs,
      config.limit,
      startsAfter,
      (count, total) => {
        process.stdout.write(`\r  Progress: ${count}/${total} events`);
      }
    )) {
      const hiveEvent = transformEvent(event, config, client);
      events.push(hiveEvent);

      eventStats.total++;
      eventStats.byType[hiveEvent.type] = (eventStats.byType[hiveEvent.type] || 0) + 1;
      eventStats.byTheme[hiveEvent.theme] = (eventStats.byTheme[hiveEvent.theme] || 0) + 1;
      if (hiveEvent.location) eventStats.withLocation++;
      if (hiveEvent.attendeeCount > 0) eventStats.withRsvp++;
    }

    console.log('\n\n  Summary:');
    console.log(`    Total:         ${eventStats.total}`);
    console.log(`    With location: ${eventStats.withLocation}`);
    console.log(`    With RSVPs:    ${eventStats.withRsvp}`);
    console.log('    By type:');
    Object.entries(eventStats.byType).forEach(([type, count]) => {
      console.log(`      - ${type}: ${count}`);
    });
    console.log('    By theme:');
    Object.entries(eventStats.byTheme).forEach(([theme, count]) => {
      console.log(`      - ${theme}: ${count}`);
    });

    // Save to JSON (full data if --json-only, otherwise sample)
    const eventsToSave = config.jsonOnly ? events : events.slice(0, 50);
    writeFileSync(
      join(config.outputDir, `${config.school}-events-${timestamp}.json`),
      JSON.stringify(eventsToSave, null, 2)
    );
    console.log(`\n  ${config.jsonOnly ? 'Full export' : 'Sample'} saved: ${config.outputDir}/${config.school}-events-${timestamp}.json (${eventsToSave.length} events)`);
  }

  // ========================================
  // DRY RUN / JSON ONLY OUTPUT
  // ========================================

  if (config.dryRun || config.jsonOnly) {
    console.log('\n======================================');
    console.log(config.jsonOnly ? '   JSON EXPORT COMPLETE' : '   DRY RUN COMPLETE');
    console.log('======================================\n');

    if (spaces.length > 0) {
      console.log('Sample Space:\n');
      const sample = spaces[0];
      console.log(`  Name:        ${sample.name}`);
      console.log(`  ID:          ${sample.id}`);
      console.log(`  Type:        ${sample.spaceType}`);
      console.log(`  Email:       ${sample.email || '(none)'}`);
      console.log(`  Contact:     ${sample.contactName || '(none)'}`);
      console.log(`  Founded:     ${sample.foundedDate?.toLocaleDateString() || '(unknown)'}`);
      console.log(`  Org Type:    ${sample.orgTypeName}`);
      console.log(`  Icon:        ${sample.iconURL ? 'Yes' : 'No'}`);
      console.log(`  Social:      ${Object.entries(sample.socialLinks).filter(([, v]) => v).map(([k]) => k).join(', ') || '(none)'}`);
    }

    if (events.length > 0) {
      console.log('\nSample Event:\n');
      const sample = events[0];
      console.log(`  Title:       ${sample.title}`);
      console.log(`  ID:          ${sample.id}`);
      console.log(`  Type:        ${sample.type} (${sample.theme})`);
      console.log(`  When:        ${sample.startAt.toLocaleString()}`);
      console.log(`  Location:    ${sample.location?.name || sample.location?.virtualLink || '(none)'}`);
      console.log(`  RSVPs:       ${sample.attendeeCount}`);
      console.log(`  Benefits:    ${sample.benefits.join(', ') || '(none)'}`);
      console.log(`  Space ID:    ${sample.spaceId}`);
    }

    if (config.jsonOnly) {
      console.log('\nJSON files saved to:');
      console.log(`  ${config.outputDir}/buffalo-spaces-*.json`);
      console.log(`  ${config.outputDir}/buffalo-events-*.json`);
      console.log('\nTo import to Firestore later, run:');
      console.log('  pnpm exec tsx scripts/scrapers/import-from-json.ts');
    } else {
      console.log('\nRemove --dry-run to write to Firestore.');
    }
    return;
  }

  // ========================================
  // WRITE TO FIRESTORE
  // ========================================

  console.log('\n======================================');
  console.log('   WRITING TO FIRESTORE');
  console.log('======================================\n');

  // Initialize Firebase (using same credential strategy as the codebase)
  if (getApps().length === 0) {
    try {
      const { applicationDefault } = await import('firebase-admin/app');

      // Try application default credentials first (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
      // This works with Firebase CLI login credentials
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
      });
      console.log('🔐 Using application default credentials');
      console.log('✅ Firebase Admin initialized\n');
    } catch (adcError) {
      // Fall back to service account file
      try {
        const serviceAccount = require('../../service-account.json');
        initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || 'hive-dev-2025',
        });
        console.log('🔐 Using service-account.json');
        console.log('✅ Firebase Admin initialized\n');
      } catch {
        console.error('\n❌ No Firebase credentials found!');
        console.error('   Options:');
        console.error('   1. Run: gcloud auth application-default login');
        console.error('   2. Set GOOGLE_APPLICATION_CREDENTIALS env var');
        console.error('   3. Create service-account.json in project root');
        console.error('\n   Error:', adcError);
        process.exit(1);
      }
    }
  }

  const db = getFirestore();
  const BATCH_SIZE = 500;

  // ========================================
  // DELETE EXISTING (if --replace)
  // ========================================

  if (config.replace) {
    console.log('Deleting existing imported data...\n');

    // Delete existing spaces from this campus with source=ublinked
    if (!config.eventsOnly) {
      const existingSpaces = await db
        .collection('spaces')
        .where('campusId', '==', config.campusId)
        .where('source', '==', 'ublinked')
        .get();

      if (!existingSpaces.empty) {
        console.log(`  Deleting ${existingSpaces.size} existing spaces...`);
        const deleteSpaceBatches = Math.ceil(existingSpaces.size / BATCH_SIZE);
        let deletedSpaces = 0;

        for (let i = 0; i < deleteSpaceBatches; i++) {
          const batch = db.batch();
          const docs = existingSpaces.docs.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
          docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          deletedSpaces += docs.length;
          console.log(`    ${deletedSpaces}/${existingSpaces.size} deleted`);
        }
      } else {
        console.log('  No existing spaces to delete.');
      }
    }

    // Delete existing events from this campus with source=ublinked
    if (!config.orgsOnly) {
      const existingEvents = await db
        .collection('events')
        .where('campusId', '==', config.campusId)
        .where('source', '==', 'ublinked')
        .get();

      if (!existingEvents.empty) {
        console.log(`  Deleting ${existingEvents.size} existing events...`);
        const deleteEventBatches = Math.ceil(existingEvents.size / BATCH_SIZE);
        let deletedEvents = 0;

        for (let i = 0; i < deleteEventBatches; i++) {
          const batch = db.batch();
          const docs = existingEvents.docs.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
          docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          deletedEvents += docs.length;
          console.log(`    ${deletedEvents}/${existingEvents.size} deleted`);
        }
      } else {
        console.log('  No existing events to delete.');
      }
    }

    console.log('');
  }

  // Write spaces
  if (spaces.length > 0) {
    console.log(`Writing ${spaces.length} spaces...`);
    let written = 0;

    for (let i = 0; i < spaces.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchItems = spaces.slice(i, i + BATCH_SIZE);

      for (const space of batchItems) {
        const ref = db.collection('spaces').doc(space.id);
        batch.set(ref, space, { merge: true });
      }

      await batch.commit();
      written += batchItems.length;
      console.log(`  ${written}/${spaces.length} spaces written`);
    }
  }

  // Write events
  if (events.length > 0) {
    console.log(`\nWriting ${events.length} events...`);
    let written = 0;

    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchItems = events.slice(i, i + BATCH_SIZE);

      for (const event of batchItems) {
        const ref = db.collection('events').doc(event.id);
        batch.set(ref, event, { merge: true });
      }

      await batch.commit();
      written += batchItems.length;
      console.log(`  ${written}/${events.length} events written`);
    }
  }

  console.log('\n======================================');
  console.log('   IMPORT COMPLETE');
  console.log('======================================\n');
  console.log(`Campus:  ${config.campusId}`);
  console.log(`Spaces:  ${spaces.length}`);
  console.log(`Events:  ${events.length}`);
  console.log('');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
