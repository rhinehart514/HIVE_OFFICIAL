"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEventsFromRSS = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");
const xml2js = require("xml2js");

/**
 * Multi-School Event Sync Cloud Function
 *
 * Iterates all schools in Firestore and syncs events from their configured RSS feeds.
 * Supports campus-wide events (events that don't belong to a specific space).
 *
 * Triggered by a schedule (once a week on Monday at 2am)
 */
exports.syncEventsFromRSS = functions.pubsub
    .schedule('0 2 * * 1') // Run once a week on Monday at 2:00 AM
    .timeZone('America/New_York')
    .onRun(async () => {
    console.log('Starting multi-school RSS event sync...');

    const db = admin.firestore();
    const totalStats = {
        schools: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        campusWide: 0,
        errors: 0,
    };

    try {
        // Load all active/beta schools with enabled event sources
        const schoolsSnapshot = await db.collection('schools')
            .where('status', 'in', ['beta', 'active'])
            .get();

        console.log(`Found ${schoolsSnapshot.size} schools to sync`);

        for (const schoolDoc of schoolsSnapshot.docs) {
            const school = { id: schoolDoc.id, ...schoolDoc.data() };
            const eventSources = school.eventSources || [];
            const enabledSources = eventSources.filter(s => s.enabled);

            if (enabledSources.length === 0) {
                console.log(`[${school.name}] No enabled event sources, skipping`);
                continue;
            }

            console.log(`[${school.name}] Syncing ${enabledSources.length} source(s)`);
            totalStats.schools++;

            // Build space index for this campus
            const spaceIndex = await buildSpaceIndex(db, school.campusId || school.id);
            console.log(`  Found ${spaceIndex.size} spaces to match against`);

            for (const source of enabledSources) {
                try {
                    const stats = await syncSchoolEvents(db, school, source, spaceIndex);
                    totalStats.created += stats.created;
                    totalStats.updated += stats.updated;
                    totalStats.skipped += stats.skipped;
                    totalStats.campusWide += stats.campusWide;

                    // Update lastSyncAt on the source
                    const sourceIndex = eventSources.findIndex(s => s.url === source.url);
                    if (sourceIndex >= 0) {
                        eventSources[sourceIndex].lastSyncAt = new Date();
                        await schoolDoc.ref.update({ eventSources });
                    }
                } catch (error) {
                    console.error(`  Error syncing ${source.url}:`, error.message);
                    totalStats.errors++;
                }
            }
        }

        // Update sync metadata
        await db.collection('metadata').doc('rss_sync').set({
            last_sync_timestamp: admin.firestore.FieldValue.serverTimestamp(),
            schools_synced: totalStats.schools,
            events_created: totalStats.created,
            events_updated: totalStats.updated,
            events_skipped: totalStats.skipped,
            campus_wide_events: totalStats.campusWide,
            errors: totalStats.errors,
            status: totalStats.errors > 0 ? 'partial_success' : 'success'
        }, { merge: true });

        console.log(`Sync complete: ${totalStats.schools} schools, ${totalStats.created} created, ${totalStats.updated} updated, ${totalStats.campusWide} campus-wide, ${totalStats.errors} errors`);
        return null;
    } catch (error) {
        console.error('Multi-school sync failed:', error);

        await db.collection('metadata').doc('rss_sync').set({
            last_sync_timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'error',
            error_message: error.message || 'Unknown error'
        }, { merge: true });

        throw error;
    }
});

/**
 * Build space index for matching events to spaces
 */
async function buildSpaceIndex(db, campusId) {
    const spacesSnapshot = await db.collection('spaces')
        .where('campusId', '==', campusId)
        .get();

    const byName = new Map();
    spacesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = (data.name || '').toLowerCase().trim();
        if (key) {
            byName.set(key, { id: doc.id, ...data });
        }
    });

    return byName;
}

/**
 * Find matching space for an event host
 */
function findMatchingSpace(hostName, spaceIndex) {
    const hostStr = typeof hostName === 'string' ? hostName :
                    (hostName?._ || hostName?.name || String(hostName || ''));
    if (!hostStr) return null;

    const key = hostStr.toLowerCase().trim();

    // Exact match
    if (spaceIndex.has(key)) {
        return spaceIndex.get(key);
    }

    // Partial match
    for (const [spaceName, space] of spaceIndex) {
        if (spaceName.includes(key) || key.includes(spaceName)) {
            return space;
        }
    }

    return null;
}

/**
 * Sync events from a single school's event source
 */
async function syncSchoolEvents(db, school, source, spaceIndex) {
    const campusId = school.campusId || school.id;
    console.log(`  Syncing from ${source.type}: ${source.url}`);

    const stats = {
        created: 0,
        updated: 0,
        skipped: 0,
        campusWide: 0,
    };

    // Fetch events from RSS
    const rawEvents = await fetchEventsFromRSS(source.url, source.type);
    console.log(`    Fetched ${rawEvents.length} events`);

    for (const rawEvent of rawEvents) {
        const event = parseEvent(rawEvent, source.type, campusId);
        const hosts = event.source.hosts;

        // Try to match to a space
        let space = null;
        if (hosts.length > 0) {
            space = findMatchingSpace(hosts[0], spaceIndex);
        }

        // Generate event ID from source
        const guidStr = event.source.guid || event.source.url || `${campusId}-event-${Date.now()}`;
        const eventNum = (guidStr.match(/event\/(\d+)/) || [])[1] ||
                         Buffer.from(guidStr).toString('base64').replace(/[/+=]/g, '_').substring(0, 20);
        const eventId = `${source.type}-${eventNum}`;

        // Set space reference or mark as campus-wide
        if (space) {
            event.spaceId = space.id;
            event.spaceName = space.name;
        } else {
            event.spaceId = null;
            event.spaceName = null;
            event.isCampusWide = true;
            stats.campusWide++;
        }

        const eventRef = db.collection('events').doc(eventId);
        const existing = await eventRef.get();

        // Check if user-modified
        if (existing.exists) {
            const existingData = existing.data();
            if (existingData.isUserModified) {
                stats.skipped++;
                continue;
            }
        }

        // Mark as external/RSS event
        event.source.platform = source.type;
        event.isUserModified = false;
        event.synced_at = admin.firestore.FieldValue.serverTimestamp();

        await eventRef.set(event, { merge: true });

        if (existing.exists) {
            stats.updated++;
        } else {
            stats.created++;
        }
    }

    console.log(`    Results: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.campusWide} campus-wide`);
    return stats;
}

/**
 * Fetch events from an RSS feed
 */
async function fetchEventsFromRSS(url, sourceType) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : require('http');

        protocol.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`RSS fetch failed: ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    const parser = new xml2js.Parser({ explicitArray: false });
                    const result = await parser.parseStringPromise(data);

                    let items = [];
                    if (result.rss?.channel?.item) {
                        // RSS 2.0
                        items = result.rss.channel.item;
                    } else if (result.feed?.entry) {
                        // Atom
                        items = result.feed.entry;
                    }

                    const events = Array.isArray(items) ? items : (items ? [items] : []);
                    resolve(events);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Parse an RSS item into event format
 */
function parseEvent(item, sourceType, campusId) {
    let title, description, location, startAt, endAt, hosts, guid, url, categories, imageUrl;

    if (sourceType === 'campuslabs' || sourceType === 'presence' || sourceType === 'generic_rss') {
        // RSS 2.0 format
        title = item.title || 'Untitled Event';
        description = stripHtml(item.description || '');
        location = item.location || 'TBD';

        const startTimestamp = parseInt(item.start, 10);
        const endTimestamp = parseInt(item.end, 10);
        startAt = startTimestamp ? new Date(startTimestamp * 1000) : null;
        endAt = endTimestamp ? new Date(endTimestamp * 1000) : null;

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
        startAt = pubDate ? new Date(pubDate) : null;
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
        startAt: startAt || null,
        endAt: endAt || null,
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        importedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
}

/**
 * Strip HTML tags from text
 */
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
//# sourceMappingURL=events_sync.js.map
