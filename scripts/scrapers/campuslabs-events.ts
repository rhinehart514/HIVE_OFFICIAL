/**
 * CampusLabs Events Scraper
 *
 * Fetches events from CampusLabs/Engage API and seeds to Firestore.
 * Can import historical events or just upcoming ones.
 *
 * Usage:
 *   pnpm exec tsx scripts/scrapers/campuslabs-events.ts --dry-run
 *   pnpm exec tsx scripts/scrapers/campuslabs-events.ts --upcoming-only
 *   pnpm exec tsx scripts/scrapers/campuslabs-events.ts --school nyu --campus-id nyu-main
 *
 * Options:
 *   --school <subdomain>   CampusLabs subdomain (default: buffalo)
 *   --campus-id <id>       HIVE campus ID (default: ub-buffalo)
 *   --dry-run              Preview without writing
 *   --upcoming-only        Only fetch future events (default: true)
 *   --limit <n>            Max events to fetch
 *   --days-ahead <n>       Days of events to fetch (default: 90)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ============================================
// TYPES
// ============================================

interface CampusLabsEvent {
  id: string;
  institutionId: number;
  organizationId: number;
  organizationIds: string[];
  branchId: number;
  branchIds: string[];
  organizationName: string;
  organizationNames: string[];
  organizationProfilePicture: string | null;
  name: string;
  description: string;
  location: string | null;
  startsOn: string;
  endsOn: string;
  imagePath: string | null;
  theme: string;
  categoryIds: string[];
  categoryNames: string[];
  benefitNames: string[];
  visibility: string;
  status: string;
  latitude: string | null;
  longitude: string | null;
  rsvpTotal: number;
  recScore: number | null;
}

interface CampusLabsEventResponse {
  '@odata.count': number;
  value: CampusLabsEvent[];
}

interface HiveEvent {
  id: string;
  campusLabsId: string;
  name: string;
  name_lowercase: string;
  description: string;
  descriptionHtml: string;
  location: string | null;
  coordinates: { lat: number; lng: number } | null;
  startTime: Date;
  endTime: Date;
  imageUrl: string | null;
  theme: string;
  categories: string[];
  benefits: string[];
  visibility: 'public' | 'private';
  status: 'approved' | 'pending' | 'cancelled';
  rsvpCount: number;

  // Organization links
  organizationId: string;
  organizationName: string;
  coHostNames: string[];
  spaceId: string | null; // Link to HIVE space if exists

  // Campus
  campusId: string;
  source: 'campuslabs';
  sourceUrl: string;

  // Timestamps
  createdAt: FieldValue;
  updatedAt: FieldValue;
  importedAt: FieldValue;
}

// ============================================
// CONFIGURATION
// ============================================

interface ScraperConfig {
  school: string;
  campusId: string;
  dryRun: boolean;
  upcomingOnly: boolean;
  limit: number | null;
  daysAhead: number;
  pageSize: number;
  rateLimitMs: number;
}

const IMAGE_BASE_URL = 'https://se-images.campuslabs.com/clink/images';

// ============================================
// API CLIENT
// ============================================

class CampusLabsEventsClient {
  private baseUrl: string;
  private school: string;

  constructor(school: string) {
    this.school = school;
    this.baseUrl = `https://${school}.campuslabs.com/engage/api/discovery/event`;
  }

  async fetchEvents(
    skip: number,
    take: number,
    startsAfter?: string
  ): Promise<CampusLabsEventResponse> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set('orderByField', 'startsOn');
    url.searchParams.set('orderByDirection', 'ascending');
    url.searchParams.set('status', 'Approved');
    url.searchParams.set('take', String(take));
    url.searchParams.set('skip', String(skip));

    if (startsAfter) {
      url.searchParams.set('startsAfter', startsAfter);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async *fetchAllEvents(
    pageSize: number,
    rateLimitMs: number,
    limit: number | null,
    startsAfter?: string
  ): AsyncGenerator<CampusLabsEvent, void, unknown> {
    let skip = 0;
    let totalFetched = 0;
    let totalCount = 0;

    do {
      const response = await this.fetchEvents(skip, pageSize, startsAfter);
      totalCount = response['@odata.count'];

      for (const event of response.value) {
        yield event;
        totalFetched++;

        if (limit && totalFetched >= limit) {
          return;
        }
      }

      skip += pageSize;

      if (skip < totalCount) {
        await sleep(rateLimitMs);
      }
    } while (skip < totalCount && (!limit || totalFetched < limit));
  }

  getImageUrl(imagePath: string | null): string | null {
    if (!imagePath) return null;
    return `${IMAGE_BASE_URL}/${imagePath}`;
  }

  getEventUrl(eventId: string): string {
    return `https://${this.school}.campuslabs.com/engage/event/${eventId}`;
  }
}

// ============================================
// TRANSFORMER
// ============================================

function transformToHiveEvent(
  event: CampusLabsEvent,
  config: ScraperConfig,
  client: CampusLabsEventsClient
): HiveEvent {
  // Clean description
  const cleanDescription = stripHtml(event.description || '');

  // Generate HIVE space ID to link (may not exist yet)
  const spaceId = `${config.campusId}-cl-${event.organizationId}`;

  // Parse coordinates
  const coordinates =
    event.latitude && event.longitude
      ? { lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) }
      : null;

  return {
    id: `${config.campusId}-evt-${event.id}`,
    campusLabsId: event.id,
    name: event.name.trim(),
    name_lowercase: event.name.trim().toLowerCase(),
    description: cleanDescription.slice(0, 1000),
    descriptionHtml: event.description,
    location: event.location,
    coordinates,
    startTime: new Date(event.startsOn),
    endTime: new Date(event.endsOn),
    imageUrl: client.getImageUrl(event.imagePath),
    theme: event.theme || 'Unknown',
    categories: event.categoryNames || [],
    benefits: event.benefitNames || [],
    visibility: event.visibility === 'Public' ? 'public' : 'private',
    status: event.status === 'Approved' ? 'approved' : 'pending',
    rsvpCount: event.rsvpTotal || 0,

    organizationId: String(event.organizationId),
    organizationName: event.organizationName,
    coHostNames: event.organizationNames?.slice(1) || [],
    spaceId,

    campusId: config.campusId,
    source: 'campuslabs',
    sourceUrl: client.getEventUrl(event.id),

    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    importedAt: FieldValue.serverTimestamp(),
  };
}

// ============================================
// UTILITIES
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    upcomingOnly: !args.includes('--all-time'),
    limit: args.includes('--limit') ? parseInt(getArg('limit', '0'), 10) : null,
    daysAhead: parseInt(getArg('days-ahead', '90'), 10),
    pageSize: 50,
    rateLimitMs: 200,
  };
}

// ============================================
// MAIN
// ============================================

async function main() {
  const config = parseArgs();

  console.log('\n📅 CampusLabs Events Scraper\n');
  console.log(`School: ${config.school}.campuslabs.com`);
  console.log(`Campus ID: ${config.campusId}`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Upcoming only: ${config.upcomingOnly}`);
  console.log(`Days ahead: ${config.daysAhead}`);
  if (config.limit) console.log(`Limit: ${config.limit} events`);
  console.log('');

  const client = new CampusLabsEventsClient(config.school);

  // Calculate date filter
  const startsAfter = config.upcomingOnly
    ? new Date().toISOString().split('T')[0]
    : undefined;

  console.log(`📥 Fetching events${startsAfter ? ` starting after ${startsAfter}` : ''}...`);

  const events: HiveEvent[] = [];
  const stats = {
    total: 0,
    byTheme: {} as Record<string, number>,
    byBenefit: {} as Record<string, number>,
    withLocation: 0,
    withImage: 0,
    withRsvp: 0,
  };

  for await (const event of client.fetchAllEvents(
    config.pageSize,
    config.rateLimitMs,
    config.limit,
    startsAfter
  )) {
    const hiveEvent = transformToHiveEvent(event, config, client);
    events.push(hiveEvent);

    stats.total++;
    stats.byTheme[hiveEvent.theme] = (stats.byTheme[hiveEvent.theme] || 0) + 1;
    hiveEvent.benefits.forEach((b) => {
      stats.byBenefit[b] = (stats.byBenefit[b] || 0) + 1;
    });
    if (hiveEvent.location) stats.withLocation++;
    if (hiveEvent.imageUrl) stats.withImage++;
    if (hiveEvent.rsvpCount > 0) stats.withRsvp++;

    if (stats.total % 100 === 0) {
      console.log(`   Fetched ${stats.total} events...`);
    }
  }

  console.log(`\n✅ Fetched ${stats.total} events`);
  console.log(`   With location: ${stats.withLocation}`);
  console.log(`   With image: ${stats.withImage}`);
  console.log(`   With RSVPs: ${stats.withRsvp}`);
  console.log('\n   By theme:');
  Object.entries(stats.byTheme)
    .sort((a, b) => b[1] - a[1])
    .forEach(([theme, count]) => {
      console.log(`     - ${theme}: ${count}`);
    });
  console.log('\n   By benefit:');
  Object.entries(stats.byBenefit)
    .sort((a, b) => b[1] - a[1])
    .forEach(([benefit, count]) => {
      console.log(`     - ${benefit}: ${count}`);
    });
  console.log('');

  // Dry run output
  if (config.dryRun) {
    console.log('📋 Sample events:\n');
    events.slice(0, 5).forEach((event) => {
      console.log(`  📅 ${event.name}`);
      console.log(`     ID: ${event.id}`);
      console.log(`     When: ${event.startTime.toLocaleDateString()} ${event.startTime.toLocaleTimeString()}`);
      console.log(`     Where: ${event.location || 'TBD'}`);
      console.log(`     Theme: ${event.theme}`);
      console.log(`     Org: ${event.organizationName}`);
      if (event.benefits.length) console.log(`     Perks: ${event.benefits.join(', ')}`);
      if (event.rsvpCount) console.log(`     RSVPs: ${event.rsvpCount}`);
      console.log('');
    });
    console.log(`... and ${events.length - 5} more\n`);
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

  // Write to Firestore
  console.log('📤 Writing to Firestore...');

  const BATCH_SIZE = 500;
  let written = 0;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchEvents = events.slice(i, i + BATCH_SIZE);

    for (const event of batchEvents) {
      const ref = db.collection('events').doc(event.id);
      batch.set(ref, event, { merge: true });
    }

    await batch.commit();
    written += batchEvents.length;
    console.log(`   Written ${written}/${events.length} events...`);
  }

  console.log('\n✅ Successfully imported all events!');
  console.log(`   Collection: events`);
  console.log(`   Campus: ${config.campusId}`);
  console.log(`   Total: ${events.length}`);
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
