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

  return {
    // Core fields
    title: item.title || 'Untitled Event',
    description: stripHtml(item.description || ''),
    location: item.location || 'TBD',

    // Timing
    startAt: startTimestamp ? Timestamp.fromMillis(startTimestamp * 1000) : null,
    endAt: endTimestamp ? Timestamp.fromMillis(endTimestamp * 1000) : null,

    // Source tracking
    source: {
      platform: 'campuslabs',
      guid: item.guid?._ || item.guid || item.link,
      url: item.link,
      hosts: hosts,
      status: item.status || 'Confirmed',
    },

    // Categories from RSS
    categories: Array.isArray(item.category) ? item.category : (item.category ? [item.category] : []),

    // Event image
    imageUrl: item.enclosure?.['$']?.url || null,

    // Metadata
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    importedAt: FieldValue.serverTimestamp(),
  };
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
  const key = hostName.toLowerCase().trim();

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
    const eventId = `campuslabs-${Buffer.from(event.source.guid).toString('base64').replace(/[/+=]/g, '_').substring(0, 40)}`;

    // Add space reference
    event.spaceId = space.id;
    event.spaceName = space.name;

    // Check if event exists
    const eventRef = db.collection('events').doc(eventId);
    const existing = await eventRef.get();

    if (!dryRun) {
      if (existing.exists) {
        // Update existing event
        await eventRef.update({
          ...event,
          updatedAt: FieldValue.serverTimestamp(),
        });
        stats.updated++;
      } else {
        // Create new event
        await eventRef.set(event);
        stats.created++;
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
