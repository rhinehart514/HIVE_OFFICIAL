/**
 * Firestore Collection Paths - Centralized Configuration
 *
 * This module defines all Firestore collection paths in one place.
 * It supports both the legacy flat structure and the target nested structure.
 *
 * MIGRATION STATUS:
 * ✅ boards       - Nested under spaces (correct)
 * ✅ messages     - Nested under boards (correct)
 * ✅ typing       - Nested under boards (correct)
 * ✅ tabs         - Nested under spaces (correct)
 * ✅ widgets      - Nested under spaces (correct)
 * ✅ placed_tools - Nested under spaces (correct)
 * ⚠️ posts        - MIXED: Some code uses flat /posts, some uses /spaces/{id}/posts
 * ⚠️ events       - MIXED: Some code uses flat /events, some uses /spaces/{id}/events
 * ⚠️ spaceMembers - FLAT only, should be nested as 'members'
 * ⚠️ rsvps        - FLAT only, should be nested under events
 *
 * NAMING INCONSISTENCIES FOUND:
 * - spaceMembers (124 refs) vs space_members (10 refs) - USE spaceMembers
 * - users (107 refs) vs profiles (7 refs) - profiles is for extended data
 *
 * Collection Group Queries: When data moves to subcollections, cross-space
 * queries must use collectionGroup() instead of collection().
 */

import type { Firestore, CollectionReference, DocumentReference } from 'firebase-admin/firestore';

// =============================================================================
// Collection Names
// =============================================================================

export const COLLECTIONS = {
  // Top-level collections (global/cross-space)
  SPACES: 'spaces',
  USERS: 'users',
  PROFILES: 'profiles',
  HANDLES: 'handles',
  SCHOOLS: 'schools',
  TOOLS: 'tools',
  DEPLOYED_TOOLS: 'deployedTools',
  TOOL_STATES: 'tool_states',
  CONNECTIONS: 'connections',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_EVENTS: 'activityEvents',
  BUILDER_REQUESTS: 'builderRequests',
  CONTENT_REPORTS: 'contentReports',
  // HiveLab automation tracking
  SENT_REMINDERS: 'sentReminders',
  AUTOMATIONS: 'automations',
  // Campus-wide tool deployments
  CAMPUS_TOOLS: 'campus_tools',

  // Legacy flat collections (to be migrated)
  /** @deprecated Use getPostsCollection(spaceId) for nested access */
  POSTS_FLAT: 'posts',
  /** @deprecated Use getEventsCollection(spaceId) for nested access */
  EVENTS_FLAT: 'events',
  /** @deprecated Use getMembersCollection(spaceId) for nested access */
  SPACE_MEMBERS_FLAT: 'spaceMembers',
  /** @deprecated Use getRsvpsCollection(spaceId, eventId) for nested access */
  RSVPS_FLAT: 'rsvps',
  /** @deprecated Use getTypingCollection(spaceId, boardId) for nested access */
  TYPING_INDICATORS_FLAT: 'typingIndicators',

  // Subcollection names (used under parent docs)
  BOARDS: 'boards',
  MESSAGES: 'messages',
  TYPING: 'typing',
  READ_RECEIPTS: 'read_receipts',
  TABS: 'tabs',
  WIDGETS: 'widgets',
  PLACED_TOOLS: 'placed_tools',
  STATE: 'state',
  RESPONSES: 'responses',
  ACTIVITY: 'activity',
  VERSIONS: 'versions',

  // Target nested names (for migration)
  MEMBERS: 'members',      // Will replace spaceMembers
  POSTS: 'posts',          // Subcollection under spaces
  EVENTS: 'events',        // Subcollection under spaces
  RSVPS: 'rsvps',          // Subcollection under events
  COMMENTS: 'comments',    // Subcollection under posts
} as const;

// =============================================================================
// Migration Flags - Toggle between flat and nested
// =============================================================================

/**
 * Migration flags control whether to use flat or nested collections.
 * Set to true to use nested subcollections, false for legacy flat.
 *
 * IMPORTANT: When migrating, you must:
 * 1. Create the nested data first (dual-write)
 * 2. Verify data integrity
 * 3. Switch the flag to true
 * 4. Remove flat collection writes
 * 5. Eventually clean up flat collection data
 */
export const MIGRATION_FLAGS = {
  /** Use /spaces/{id}/posts instead of /posts */
  USE_NESTED_POSTS: false,
  /** Use /spaces/{id}/events instead of /events */
  USE_NESTED_EVENTS: false,
  /** Use /spaces/{id}/members instead of /spaceMembers */
  USE_NESTED_MEMBERS: false,
  /** Use /spaces/{id}/events/{id}/rsvps instead of /rsvps */
  USE_NESTED_RSVPS: false,
  /** Use board-level typing instead of /typingIndicators */
  USE_NESTED_TYPING: true, // Already using nested for chat
} as const;

// =============================================================================
// Collection Path Helpers
// =============================================================================

/**
 * Get the spaces collection reference
 */
export function getSpacesCollection(db: Firestore): CollectionReference {
  return db.collection(COLLECTIONS.SPACES);
}

/**
 * Get a specific space document reference
 */
export function getSpaceDoc(db: Firestore, spaceId: string): DocumentReference {
  return db.collection(COLLECTIONS.SPACES).doc(spaceId);
}

// -----------------------------------------------------------------------------
// Posts
// -----------------------------------------------------------------------------

/**
 * Get posts collection - either flat or nested based on migration flag
 */
export function getPostsCollection(db: Firestore, spaceId?: string): CollectionReference {
  if (MIGRATION_FLAGS.USE_NESTED_POSTS && spaceId) {
    return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.POSTS);
  }
  return db.collection(COLLECTIONS.POSTS_FLAT);
}

/**
 * Get a specific post document reference
 */
export function getPostDoc(db: Firestore, postId: string, spaceId?: string): DocumentReference {
  if (MIGRATION_FLAGS.USE_NESTED_POSTS && spaceId) {
    return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.POSTS).doc(postId);
  }
  return db.collection(COLLECTIONS.POSTS_FLAT).doc(postId);
}

/**
 * Get posts collection group for cross-space queries (when using nested)
 */
export function getPostsCollectionGroup(db: Firestore) {
  return db.collectionGroup(COLLECTIONS.POSTS);
}

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

/**
 * Get events collection - either flat or nested based on migration flag
 */
export function getEventsCollection(db: Firestore, spaceId?: string): CollectionReference {
  if (MIGRATION_FLAGS.USE_NESTED_EVENTS && spaceId) {
    return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.EVENTS);
  }
  return db.collection(COLLECTIONS.EVENTS_FLAT);
}

/**
 * Get a specific event document reference
 */
export function getEventDoc(db: Firestore, eventId: string, spaceId?: string): DocumentReference {
  if (MIGRATION_FLAGS.USE_NESTED_EVENTS && spaceId) {
    return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.EVENTS).doc(eventId);
  }
  return db.collection(COLLECTIONS.EVENTS_FLAT).doc(eventId);
}

/**
 * Get events collection group for cross-space queries (when using nested)
 */
export function getEventsCollectionGroup(db: Firestore) {
  return db.collectionGroup(COLLECTIONS.EVENTS);
}

// -----------------------------------------------------------------------------
// Members
// -----------------------------------------------------------------------------

/**
 * Get members collection - either flat or nested based on migration flag
 */
export function getMembersCollection(db: Firestore, spaceId?: string): CollectionReference {
  if (MIGRATION_FLAGS.USE_NESTED_MEMBERS && spaceId) {
    return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.MEMBERS);
  }
  return db.collection(COLLECTIONS.SPACE_MEMBERS_FLAT);
}

/**
 * Get a specific member document reference
 */
export function getMemberDoc(db: Firestore, memberId: string, spaceId?: string): DocumentReference {
  if (MIGRATION_FLAGS.USE_NESTED_MEMBERS && spaceId) {
    return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.MEMBERS).doc(memberId);
  }
  return db.collection(COLLECTIONS.SPACE_MEMBERS_FLAT).doc(memberId);
}

/**
 * Get members collection group for cross-space queries (when using nested)
 */
export function getMembersCollectionGroup(db: Firestore) {
  return db.collectionGroup(COLLECTIONS.MEMBERS);
}

// -----------------------------------------------------------------------------
// RSVPs
// -----------------------------------------------------------------------------

/**
 * Get RSVPs collection - either flat or nested based on migration flag
 */
export function getRsvpsCollection(db: Firestore, spaceId?: string, eventId?: string): CollectionReference {
  if (MIGRATION_FLAGS.USE_NESTED_RSVPS && spaceId && eventId) {
    return db
      .collection(COLLECTIONS.SPACES).doc(spaceId)
      .collection(COLLECTIONS.EVENTS).doc(eventId)
      .collection(COLLECTIONS.RSVPS);
  }
  return db.collection(COLLECTIONS.RSVPS_FLAT);
}

// -----------------------------------------------------------------------------
// Boards & Messages (already nested - correct structure)
// -----------------------------------------------------------------------------

/**
 * Get boards collection for a space
 */
export function getBoardsCollection(db: Firestore, spaceId: string): CollectionReference {
  return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.BOARDS);
}

/**
 * Get a specific board document reference
 */
export function getBoardDoc(db: Firestore, spaceId: string, boardId: string): DocumentReference {
  return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.BOARDS).doc(boardId);
}

/**
 * Get messages collection for a board
 */
export function getMessagesCollection(db: Firestore, spaceId: string, boardId: string): CollectionReference {
  return db
    .collection(COLLECTIONS.SPACES).doc(spaceId)
    .collection(COLLECTIONS.BOARDS).doc(boardId)
    .collection(COLLECTIONS.MESSAGES);
}

/**
 * Get typing collection for a board
 */
export function getTypingCollection(db: Firestore, spaceId: string, boardId: string): CollectionReference {
  return db
    .collection(COLLECTIONS.SPACES).doc(spaceId)
    .collection(COLLECTIONS.BOARDS).doc(boardId)
    .collection(COLLECTIONS.TYPING);
}

/**
 * Get read receipts collection for a board
 * Stores per-user lastReadTimestamp for efficient unread counting
 */
export function getReadReceiptsCollection(db: Firestore, spaceId: string, boardId: string): CollectionReference {
  return db
    .collection(COLLECTIONS.SPACES).doc(spaceId)
    .collection(COLLECTIONS.BOARDS).doc(boardId)
    .collection(COLLECTIONS.READ_RECEIPTS);
}

// -----------------------------------------------------------------------------
// Tabs & Widgets (already nested - correct structure)
// -----------------------------------------------------------------------------

/**
 * Get tabs collection for a space
 */
export function getTabsCollection(db: Firestore, spaceId: string): CollectionReference {
  return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.TABS);
}

/**
 * Get widgets collection for a space
 */
export function getWidgetsCollection(db: Firestore, spaceId: string): CollectionReference {
  return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.WIDGETS);
}

// -----------------------------------------------------------------------------
// Placed Tools (already nested - correct structure)
// -----------------------------------------------------------------------------

/**
 * Get placed tools collection for a space
 */
export function getPlacedToolsCollection(db: Firestore, spaceId: string): CollectionReference {
  return db.collection(COLLECTIONS.SPACES).doc(spaceId).collection(COLLECTIONS.PLACED_TOOLS);
}

/**
 * Get state collection for a placed tool
 */
export function getToolStateCollection(db: Firestore, spaceId: string, toolId: string): CollectionReference {
  return db
    .collection(COLLECTIONS.SPACES).doc(spaceId)
    .collection(COLLECTIONS.PLACED_TOOLS).doc(toolId)
    .collection(COLLECTIONS.STATE);
}

// -----------------------------------------------------------------------------
// Tools (top-level - correct structure)
// -----------------------------------------------------------------------------

/**
 * Get tools collection
 */
export function getToolsCollection(db: Firestore): CollectionReference {
  return db.collection(COLLECTIONS.TOOLS);
}

/**
 * Get tool versions collection
 */
export function getToolVersionsCollection(db: Firestore, toolId: string): CollectionReference {
  return db.collection(COLLECTIONS.TOOLS).doc(toolId).collection(COLLECTIONS.VERSIONS);
}

// =============================================================================
// Query Helpers for Cross-Space Operations
// =============================================================================

/**
 * Build a query for posts across all spaces (for feed)
 * Uses collection group when nested, flat collection when not
 */
export function buildCrossSpacePostsQuery(db: Firestore, campusId: string) {
  if (MIGRATION_FLAGS.USE_NESTED_POSTS) {
    return db.collectionGroup(COLLECTIONS.POSTS);
  }
  return db.collection(COLLECTIONS.POSTS_FLAT);
}

/**
 * Build a query for events across all spaces (for calendar)
 * Uses collection group when nested, flat collection when not
 */
export function buildCrossSpaceEventsQuery(db: Firestore, campusId: string) {
  if (MIGRATION_FLAGS.USE_NESTED_EVENTS) {
    return db.collectionGroup(COLLECTIONS.EVENTS);
  }
  return db.collection(COLLECTIONS.EVENTS_FLAT);
}

/**
 * Build a query for user's space memberships
 * Uses collection group when nested, flat collection when not
 */
export function buildUserMembershipsQuery(db: Firestore, userId: string, campusId: string) {
  if (MIGRATION_FLAGS.USE_NESTED_MEMBERS) {
    return db.collectionGroup(COLLECTIONS.MEMBERS)
      .where('userId', '==', userId);
  }
  return db.collection(COLLECTIONS.SPACE_MEMBERS_FLAT)
    .where('userId', '==', userId);
}

// -----------------------------------------------------------------------------
// Campus Tools (nested under campuses)
// -----------------------------------------------------------------------------

/**
 * Get campus tools collection for a campus
 * Path: campuses/{campusId}/campus_tools
 */
export function getCampusToolsCollection(db: Firestore, campusId: string): CollectionReference {
  return db.collection('campuses').doc(campusId).collection(COLLECTIONS.CAMPUS_TOOLS);
}

/**
 * Get a specific campus tool document
 */
export function getCampusToolDoc(db: Firestore, campusId: string, placementId: string): DocumentReference {
  return db.collection('campuses').doc(campusId).collection(COLLECTIONS.CAMPUS_TOOLS).doc(placementId);
}
