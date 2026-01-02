#!/usr/bin/env node
/**
 * Multi-School Event Sync
 *
 * Iterates all schools in Firestore and syncs events from their configured RSS feeds.
 * Replaces the UB-specific sync-campuslabs-events.mjs with a generic solution.
 *
 * Usage:
 *   node scripts/sync-school-events.mjs [--dry-run] [--school <schoolId>]
 *
 * Options:
 *   --dry-run           Preview what would be synced without writing to Firestore
 *   --school <id>       Only sync events for a specific school
 *   --verbose           Show detailed progress
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

    if (privateKeyBase64) {
      privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    } else if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase credentials');
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

async function fetchAndParseRSS(url, sourceType) {
  console.log(`  Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const result = await parseStringPromise(xml, { explicitArray: false });

  // Handle different feed formats
  let items = [];

  if (result.rss?.channel?.item) {
    // Standard RSS 2.0
    items = result.rss.channel.item;
  } else if (result.feed?.entry) {
    // Atom feed
    items = result.feed.entry;
  }

  const events = Array.isArray(items) ? items : (items ? [items] : []);
  console.log(`    Found ${events.length} events`);

  return events;
}

function parseEvent(item, sourceType, campusId) {
  // Normalize fields based on source type
  let title, description, location, startAt, endAt, hosts, guid, url, categories, imageUrl;

  if (sourceType === 'campuslabs' || sourceType === 'presence' || sourceType === 'generic_rss') {
    // RSS 2.0 format
    title = item.title || 'Untitled Event';
    description = stripHtml(item.description || '');
    location = item.location || 'TBD';

    const startTimestamp = parseInt(item.start, 10);
    const endTimestamp = parseInt(item.end, 10);
    startAt = startTimestamp ? Timestamp.fromMillis(startTimestamp * 1000) : null;
    endAt = endTimestamp ? Timestamp.fromMillis(endTimestamp * 1000) : null;

    const hostRaw = item.host;
    hosts = Array.isArray(hostRaw) ? hostRaw : (hostRaw ? [hostRaw] : []);

    guid = item.guid?._ || item.guid || item.link;
    url = item.link;
    categories = Array.isArray(item.category) ? item.category : (item.category ? [item.category] : []);
    imageUrl = item.enclosure?.['$']?.url || null;

  } else if (sourceType === 'atom') {
    // Atom format
    title = item.title?._ || item.title || 'Untitled Event';
    description = stripHtml(item.summary?._ || item.summary || item.content?._ || item.content || '');
    location = item['georss:point'] || 'TBD';

    const pubDate = item.published || item.updated;
    startAt = pubDate ? Timestamp.fromDate(new Date(pubDate)) : null;
    endAt = null;

    hosts = [];
    if (item.author?.name) hosts.push(item.author.name);

    guid = item.id;
    url = item.link?.href || item.link;
    categories = [];
    imageUrl = null;
  }

  return {
    title,
    description,
    location,
    startAt,
    endAt,
    source: {
      platform: sourceType,
      guid,
      url,
      hosts,
      status: item.status || 'Confirmed',
    },
    categories,
    imageUrl,
    campusId,
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
  const spacesSnapshot = await db.collection('spaces')
    .where('campusId', '==', campusId)
    .get();

  const byName = new Map();
  spacesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const key = data.name.toLowerCase().trim();
    byName.set(key, { id: doc.id, ...data });
  });

  return byName;
}

function findMatchingSpace(hostName, spaceIndex) {
  const hostStr = typeof hostName === 'string' ? hostName :
                  (hostName?._ || hostName?.name || String(hostName || ''));
  if (!hostStr) return null;

  const key = hostStr.toLowerCase().trim();

  if (spaceIndex.has(key)) {
    return spaceIndex.get(key);
  }

  for (const [spaceName, space] of spaceIndex) {
    if (spaceName.includes(key) || key.includes(spaceName)) {
      return space;
    }
  }

  return null;
}

// =============================================================================
// Event Sync
// =============================================================================

async function syncSchoolEvents(db, school, source, dryRun, verbose) {
  const campusId = school.campusId || school.id;
  console.log(`\n  Syncing from ${source.type}: ${source.url}`);

  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    noMatch: 0,
    campusWide: 0,
    errors: 0,
  };

  try {
    // Build space index for this campus
    const spaceIndex = await buildSpaceIndex(db, campusId);
    console.log(`    Found ${spaceIndex.size} spaces to match against`);

    // Fetch events
    const rawEvents = await fetchAndParseRSS(source.url, source.type);

    for (const rawEvent of rawEvents) {
      const event = parseEvent(rawEvent, source.type, campusId);
      const hosts = event.source.hosts;

      let space = null;
      if (hosts.length > 0) {
        space = findMatchingSpace(hosts[0], spaceIndex);
      }

      // Generate event ID from source
      const guidStr = event.source.guid || event.source.url || `${campusId}-event-${Date.now()}`;
      const eventNum = guidStr.match(/event\/(\d+)/)?.[1] ||
                       Buffer.from(guidStr).toString('base64').replace(/[/+=]/g, '_').substring(0, 20);
      const eventId = `${source.type}-${eventNum}`;

      // Add space reference if found, otherwise mark as campus-wide
      if (space) {
        event.spaceId = space.id;
        event.spaceName = space.name;
      } else {
        // Campus-wide event (no space)
        event.spaceId = null;
        event.spaceName = null;
        event.isCampusWide = true;
        stats.campusWide++;
      }

      const eventRef = db.collection('events').doc(eventId);
      const existing = await eventRef.get();

      if (!dryRun) {
        try {
          await eventRef.set(event, { merge: true });
          if (existing.exists) {
            stats.updated++;
          } else {
            stats.created++;
          }
        } catch (error) {
          if (verbose) console.error(`      Error syncing ${eventId}:`, error.message);
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

    // Update last sync time on source
    if (!dryRun) {
      const schoolRef = db.collection('schools').doc(school.id);
      const schoolData = (await schoolRef.get()).data();
      const eventSources = schoolData.eventSources || [];
      const sourceIndex = eventSources.findIndex(s => s.url === source.url);

      if (sourceIndex >= 0) {
        eventSources[sourceIndex].lastSyncAt = new Date();
        await schoolRef.update({ eventSources });
      }
    }

  } catch (error) {
    console.error(`    Error: ${error.message}`);
    stats.errors++;
  }

  console.log(`    Results: ${stats.created} created, ${stats.updated} updated, ${stats.campusWide} campus-wide, ${stats.errors} errors`);
  return stats;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  const schoolIdArg = args.find(a => a.startsWith('--school='))?.split('=')[1];

  console.log('='.repeat(60));
  console.log('Multi-School Event Sync');
  console.log('='.repeat(60));
  console.log(`Dry Run: ${dryRun}`);
  if (schoolIdArg) console.log(`School Filter: ${schoolIdArg}`);
  console.log('');

  const db = initFirebase();

  // Load schools
  let schoolsQuery = db.collection('schools').where('status', 'in', ['beta', 'active']);
  if (schoolIdArg) {
    schoolsQuery = db.collection('schools').where('campusId', '==', schoolIdArg);
  }

  const schoolsSnapshot = await schoolsQuery.get();
  console.log(`Found ${schoolsSnapshot.size} school(s) to sync\n`);

  const totalStats = {
    schools: 0,
    created: 0,
    updated: 0,
    campusWide: 0,
    errors: 0,
  };

  for (const schoolDoc of schoolsSnapshot.docs) {
    const school = { id: schoolDoc.id, ...schoolDoc.data() };
    const eventSources = school.eventSources || [];
    const enabledSources = eventSources.filter(s => s.enabled);

    if (enabledSources.length === 0) {
      console.log(`[${school.name}] No enabled event sources, skipping`);
      continue;
    }

    console.log(`[${school.name}] (${school.campusId})`);
    console.log(`  ${enabledSources.length} enabled event source(s)`);
    totalStats.schools++;

    for (const source of enabledSources) {
      const stats = await syncSchoolEvents(db, school, source, dryRun, verbose);
      totalStats.created += stats.created;
      totalStats.updated += stats.updated;
      totalStats.campusWide += stats.campusWide;
      totalStats.errors += stats.errors;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Sync Complete');
  console.log('='.repeat(60));
  console.log(`Schools synced: ${totalStats.schools}`);
  console.log(`Events created: ${totalStats.created}`);
  console.log(`Events updated: ${totalStats.updated}`);
  console.log(`Campus-wide events: ${totalStats.campusWide}`);
  console.log(`Errors: ${totalStats.errors}`);

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
