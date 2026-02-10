#!/usr/bin/env node
/**
 * CampusLabs Event Sync
 *
 * Fetches events from CampusLabs RSS feed and associates them with
 * the corresponding HIVE spaces (imported via import-campuslabs.mjs).
 *
 * Usage:
 *   node scripts/sync-campuslabs-events.mjs [--dry-run] [--campus ub-buffalo]
 *
 * Options:
 *   --dry-run     Preview what would be synced without writing to Firestore
 *   --campus      Campus ID to filter spaces (default: ub-buffalo)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // CampusLabs RSS feed (UB Buffalo)
  RSS_URL: 'https://buffalo.campuslabs.com/engage/events.rss',

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
// RSS Parsing
// =============================================================================

async function fetchAndParseRSS() {
  console.log('Fetching events from CampusLabs RSS feed...');

  const response = await fetch(CONFIG.RSS_URL);
  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const result = await parseStringPromise(xml, { explicitArray: false });

  const items = result.rss?.channel?.item || [];
  const events = Array.isArray(items) ? items : [items];

  console.log(`  Found ${events.length} events\n`);
  return events;
}

function parseEvent(item) {
  // Extract host organization name
  const hostRaw = item.host;
  const hosts = Array.isArray(hostRaw) ? hostRaw : (hostRaw ? [hostRaw] : []);

  // Parse timestamps
  const startTimestamp = parseInt(item.start, 10);
  const endTimestamp = parseInt(item.end, 10);
  const startAt = startTimestamp ? Timestamp.fromMillis(startTimestamp * 1000) : null;
  const endAt = endTimestamp ? Timestamp.fromMillis(endTimestamp * 1000) : null;
  const categories = Array.isArray(item.category) ? item.category : (item.category ? [item.category] : []);
  const eventType = inferEventType(categories, item.title, item.description);

  return {
    // Core fields
    title: item.title || 'Untitled Event',
    description: stripHtml(item.description || ''),
    location: item.location || 'TBD',

    // Timing (write both legacy and current fields for compatibility)
    startAt,
    endAt,
    startDate: startAt ? startAt.toDate() : null,
    endDate: endAt ? endAt.toDate() : (startAt ? startAt.toDate() : null),
    timezone: 'America/New_York',
    locationType: String(item.location || '').toLowerCase().includes('zoom') ? 'virtual' : 'physical',
    type: eventType,
    eventType,
    state: 'published',
    status: 'scheduled',
    isHidden: false,

    // Source tracking
    source: {
      platform: 'campuslabs',
      guid: item.guid?._ || item.guid || item.link,
      url: item.link,
      hosts: hosts,
      status: item.status || 'Confirmed',
    },

    // Categories from RSS
    categories,
    tags: categories,

    // Event image
    imageUrl: item.enclosure?.['$']?.url || null,

    // Campus isolation (required for security rules)
    campusId: 'ub-buffalo',

    // Metadata
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    importedAt: FieldValue.serverTimestamp(),
  };
}

function inferEventType(categories, title, description) {
  const text = [
    ...(Array.isArray(categories) ? categories : []),
    title || '',
    description || '',
  ].join(' ').toLowerCase();

  if (text.includes('workshop') || text.includes('lecture') || text.includes('study')) return 'academic';
  if (text.includes('career') || text.includes('professional') || text.includes('network')) return 'professional';
  if (text.includes('meeting') || text.includes('board')) return 'meeting';
  if (text.includes('virtual') || text.includes('zoom') || text.includes('online')) return 'virtual';
  if (text.includes('recreation') || text.includes('sport') || text.includes('fitness')) return 'recreational';
  return 'social';
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

// =============================================================================
// Space Matching
// =============================================================================

async function buildSpaceIndex(db, campusId) {
  console.log('Building space index from Firestore...');

  const spacesSnapshot = await db.collection('spaces')
    .where('campusId', '==', campusId)
    .where('source.platform', '==', 'campuslabs')
    .get();

  // Build index by name (lowercase) for fuzzy matching
  const byName = new Map();

  spacesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const key = data.name.toLowerCase().trim();
    byName.set(key, { id: doc.id, ...data });
  });

  console.log(`  Indexed ${byName.size} CampusLabs-imported spaces\n`);
  return byName;
}

function findMatchingSpace(hostName, spaceIndex) {
  // Handle case where hostName might be an object or non-string
  const hostStr = typeof hostName === 'string' ? hostName :
                  (hostName?._ || hostName?.name || String(hostName || ''));
  if (!hostStr) return null;

  const key = hostStr.toLowerCase().trim();

  // Exact match
  if (spaceIndex.has(key)) {
    return spaceIndex.get(key);
  }

  // Fuzzy match - check if host name is contained in space name or vice versa
  for (const [spaceName, space] of spaceIndex) {
    if (spaceName.includes(key) || key.includes(spaceName)) {
      return space;
    }
  }

  return null;
}

// =============================================================================
// Firestore Operations
// =============================================================================

async function syncEvents(db, events, spaceIndex, dryRun = false) {
  console.log(`\nSyncing ${events.length} events...`);

  if (dryRun) {
    console.log('  [DRY RUN] No changes will be made.\n');
  }

  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    noMatch: 0,
    errors: 0,
  };

  const unmatchedHosts = new Set();

  for (const rawEvent of events) {
    const event = parseEvent(rawEvent);

    // Find matching space(s)
    const hosts = event.source.hosts;
    if (hosts.length === 0) {
      stats.noMatch++;
      continue;
    }

    // Try to match first host
    const primaryHost = hosts[0];
    const space = findMatchingSpace(primaryHost, spaceIndex);

    if (!space) {
      stats.noMatch++;
      unmatchedHosts.add(primaryHost);
      continue;
    }

    // Create event document ID from source GUID
    // Extract event number from URL like https://buffalo.campuslabs.com/engage/event/11902571
    const guidStr = typeof event.source.guid === 'string' ? event.source.guid :
                    (event.source.guid?._ || event.source.url || `event-${Date.now()}-${Math.random()}`);

    // Extract the unique event ID from the URL
    const eventNum = guidStr.match(/event\/(\d+)/)?.[1] ||
                     Buffer.from(guidStr).toString('base64').replace(/[/+=]/g, '_').substring(0, 20);
    const eventId = `campuslabs-${eventNum}`;

    // Debug first few
    if (stats.created + stats.updated + stats.noMatch < 5) {
      console.log(`  ID: ${eventId} | GUID: ${guidStr.substring(0, 60)}`);
    }

    // Add space reference
    event.spaceId = space.id;
    event.spaceName = space.name;

    // Check if event exists
    const eventRef = db.collection('events').doc(eventId);
    const existing = await eventRef.get();

    if (!dryRun) {
      try {
        // Use set with merge to handle both create and update
        await eventRef.set(event, { merge: true });
        if (existing.exists) {
          stats.updated++;
        } else {
          stats.created++;
        }
      } catch (error) {
        console.error(`  Error syncing event ${eventId}:`, error.message);
        stats.errors++;
      }
    } else {
      if (existing.exists) {
        stats.updated++;
      } else {
        stats.created++;
      }
    }
  }

  // Report unmatched hosts
  if (unmatchedHosts.size > 0) {
    console.log(`\nUnmatched hosts (${unmatchedHosts.size}):`);
    [...unmatchedHosts].slice(0, 20).forEach(h => console.log(`  - ${h}`));
    if (unmatchedHosts.size > 20) {
      console.log(`  ... and ${unmatchedHosts.size - 20} more`);
    }
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

  console.log('='.repeat(60));
  console.log('CampusLabs Event Sync');
  console.log('='.repeat(60));
  console.log(`Campus: ${campusId}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log('');

  // Initialize Firebase
  const db = initFirebase();

  // Build space index
  const spaceIndex = await buildSpaceIndex(db, campusId);

  // Fetch and parse RSS
  const events = await fetchAndParseRSS();

  // Sync events
  const stats = await syncEvents(db, events, spaceIndex, dryRun);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Sync Complete');
  console.log('='.repeat(60));
  console.log(`Created: ${stats.created}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`No matching space: ${stats.noMatch}`);
  console.log(`Errors: ${stats.errors}`);

  if (dryRun) {
    console.log('\n[DRY RUN] No changes were made. Remove --dry-run to sync.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Sync failed:', error);
    process.exit(1);
  });
