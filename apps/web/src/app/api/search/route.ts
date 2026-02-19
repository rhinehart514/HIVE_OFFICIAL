/**
 * Platform-wide Search API Route
 *
 * Searches across:
 * - Spaces (name, description, category)
 * - Profiles (display name, handle, bio)
 * - Posts (content, title)
 * - Tools (name, description)
 *
 * Uses Firestore queries with campus isolation.
 * For better full-text search, consider Algolia/Typesense integration.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { HttpStatus } from '@/lib/api-response-types';
import {
  GhostModeService,
  ViewerContext,
  ContentModerationService
} from '@hive/core';
import type { GhostModeUser } from '@hive/core';
import { getCurrentUser } from '@/lib/middleware/auth';
import { searchRateLimit } from '@/lib/rate-limit-simple';
import { getCampusFromEmail, getDefaultCampusId } from '@/lib/campus-context';
import { withCache } from '../../../lib/cache-headers';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'space' | 'tool' | 'person' | 'event' | 'post';
  category: string;
  url: string;
  metadata?: Record<string, unknown>;
  relevanceScore: number;
}

type SearchCategory = 'spaces' | 'tools' | 'people' | 'posts' | 'events' | 'all';

/**
 * Relevance scoring weights
 * Tuned for campus discovery use case
 */
const SCORING_WEIGHTS = {
  // Text match quality
  EXACT_MATCH: 100,
  PREFIX_MATCH: 80,
  CONTAINS_MATCH: 60,
  PARTIAL_WORD_MATCH: 40,
  CATEGORY_MATCH: 30,

  // Recency boost (decays over time)
  RECENCY_MAX_BOOST: 25,
  RECENCY_HALF_LIFE_DAYS: 14, // After 2 weeks, recency boost is halved

  // Engagement/popularity
  ENGAGEMENT_MAX_BOOST: 30,
  VERIFIED_BOOST: 15,

  // Activity signals
  ACTIVE_RECENTLY_BOOST: 10, // Was active in last 7 days
};

/**
 * Calculate text match quality score
 */
function calculateTextMatchScore(
  text: string,
  query: string,
  isTitle: boolean = false
): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match (title equals query)
  if (textLower === queryLower) {
    return SCORING_WEIGHTS.EXACT_MATCH;
  }

  // Prefix match (starts with query)
  if (textLower.startsWith(queryLower)) {
    return SCORING_WEIGHTS.PREFIX_MATCH;
  }

  // Word-boundary match (query appears at start of a word)
  const wordBoundaryRegex = new RegExp(`\\b${queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  if (wordBoundaryRegex.test(text)) {
    return isTitle ? SCORING_WEIGHTS.CONTAINS_MATCH + 10 : SCORING_WEIGHTS.CONTAINS_MATCH;
  }

  // Contains match (query appears anywhere)
  if (textLower.includes(queryLower)) {
    return SCORING_WEIGHTS.PARTIAL_WORD_MATCH;
  }

  return 0;
}

/**
 * Calculate recency boost using exponential decay
 * More recent content gets higher scores, with smooth decay over time
 */
function calculateRecencyBoost(timestamp: Date | undefined | null): number {
  if (!timestamp) return 0;

  const now = Date.now();
  const itemTime = timestamp.getTime();
  const daysSinceCreated = (now - itemTime) / (1000 * 60 * 60 * 24);

  // Exponential decay: score = max * (0.5 ^ (days / halfLife))
  const decayFactor = Math.pow(0.5, daysSinceCreated / SCORING_WEIGHTS.RECENCY_HALF_LIFE_DAYS);
  return Math.round(SCORING_WEIGHTS.RECENCY_MAX_BOOST * decayFactor);
}

/**
 * Calculate engagement/popularity boost
 * Uses logarithmic scaling to prevent very popular items from dominating
 */
function calculateEngagementBoost(metrics: {
  memberCount?: number;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  rsvpCount?: number;
  deploymentCount?: number;
}): number {
  // Weighted engagement score
  const engagementScore =
    (metrics.memberCount || 0) * 2 +
    (metrics.likeCount || 0) * 1 +
    (metrics.commentCount || 0) * 1.5 +
    (metrics.viewCount || 0) * 0.1 +
    (metrics.rsvpCount || 0) * 2 +
    (metrics.deploymentCount || 0) * 3;

  // Logarithmic scaling: log10(score + 1) * multiplier
  // This gives diminishing returns for very high engagement
  if (engagementScore <= 0) return 0;

  const logScore = Math.log10(engagementScore + 1);
  return Math.min(SCORING_WEIGHTS.ENGAGEMENT_MAX_BOOST, Math.round(logScore * 10));
}

/**
 * Convert Firestore timestamp to Date safely
 */
function toDate(timestamp: unknown): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  const maybeTs = timestamp as { toDate?: () => Date };
  if (maybeTs && typeof maybeTs.toDate === 'function') return maybeTs.toDate();
  return null;
}

/**
 * Search spaces collection with relevance ranking
 */
async function searchSpaces(
  query: string,
  campusId: string,
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();
  const seenIds = new Set<string>();

  try {
    // Search by name_lowercase prefix - most likely to be relevant
    const nameSnapshot = await dbAdmin
      .collection('spaces')
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .where('name_lowercase', '>=', lowercaseQuery)
      .where('name_lowercase', '<=', lowercaseQuery + '\uf8ff')
      .limit(limit * 2) // Fetch more to allow for scoring and re-ranking
      .get();

    for (const doc of nameSnapshot.docs) {
      if (seenIds.has(doc.id)) continue;
      seenIds.add(doc.id);

      const data = doc.data();
      const name = data.name || 'Unnamed Space';
      const memberCount = data.memberCount || data.metrics?.memberCount || 0;
      const createdAt = toDate(data.createdAt);
      const lastActivityAt = toDate(data.lastActivityAt || data.updatedAt);
      const isVerified = data.isVerified || data.status === 'verified';

      // Calculate composite relevance score
      let relevanceScore = 0;

      // Text match quality (primary signal)
      relevanceScore += calculateTextMatchScore(name, query, true);

      // Description match adds to score
      if (data.description) {
        const descScore = calculateTextMatchScore(data.description, query, false);
        relevanceScore += Math.round(descScore * 0.5); // Weight description less than title
      }

      // Recency boost
      relevanceScore += calculateRecencyBoost(createdAt);

      // Engagement boost (member count is primary engagement metric for spaces)
      relevanceScore += calculateEngagementBoost({ memberCount });

      // Verified spaces get a boost
      if (isVerified) {
        relevanceScore += SCORING_WEIGHTS.VERIFIED_BOOST;
      }

      // Recently active boost
      if (lastActivityAt) {
        const daysSinceActivity = (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActivity < 7) {
          relevanceScore += SCORING_WEIGHTS.ACTIVE_RECENTLY_BOOST;
        }
      }

      results.push({
        id: doc.id,
        title: name,
        description: data.description,
        type: 'space',
        category: 'spaces',
        url: data.slug ? `/spaces/s/${data.slug}` : `/spaces/${doc.id}`,
        metadata: {
          memberCount,
          category: data.category,
          type: data.type,
          isVerified,
          lastActivityAt: lastActivityAt?.toISOString()
        },
        relevanceScore
      });
    }

    // Also search by category if query matches known categories
    const categoryMatches = ['student_organizations', 'university_organizations', 'greek_life', 'campus_living', 'hive_exclusive']
      .filter(cat => cat.toLowerCase().includes(lowercaseQuery) || lowercaseQuery.includes(cat.split('_')[0]));

    if (categoryMatches.length > 0 && results.length < limit * 2) {
      const categorySnapshot = await dbAdmin
        .collection('spaces')
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .where('category', 'in', categoryMatches)
        .orderBy('memberCount', 'desc')
        .limit(limit)
        .get();

      for (const doc of categorySnapshot.docs) {
        if (seenIds.has(doc.id)) continue;
        seenIds.add(doc.id);

        const data = doc.data();
        const name = data.name || 'Unnamed Space';
        const memberCount = data.memberCount || data.metrics?.memberCount || 0;
        const createdAt = toDate(data.createdAt);
        const isVerified = data.isVerified || data.status === 'verified';

        // Category match gets lower base score
        let relevanceScore = SCORING_WEIGHTS.CATEGORY_MATCH;

        // Still apply engagement and recency boosts
        relevanceScore += calculateRecencyBoost(createdAt);
        relevanceScore += calculateEngagementBoost({ memberCount });

        if (isVerified) {
          relevanceScore += SCORING_WEIGHTS.VERIFIED_BOOST;
        }

        results.push({
          id: doc.id,
          title: name,
          description: data.description,
          type: 'space',
          category: 'spaces',
          url: data.slug ? `/spaces/s/${data.slug}` : `/spaces/${doc.id}`,
          metadata: {
            memberCount,
            category: data.category,
            isVerified
          },
          relevanceScore
        });
      }
    }
  } catch (error) {
    logger.error('Error searching spaces', { error: String(error), query });
  }

  // Sort by relevance and return top results
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

/**
 * Search profiles collection with relevance ranking
 * @param viewerContext - Optional viewer context for ghost mode filtering
 */
async function searchProfiles(
  query: string,
  campusId: string,
  limit: number,
  viewerContext?: ViewerContext
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();

  // Collect profile IDs to batch-fetch privacy settings for ghost mode
  const profileIds: string[] = [];
  const profileData: Map<string, { doc: FirebaseFirestore.QueryDocumentSnapshot; matchType: 'handle' | 'name' }> = new Map();

  try {
    // Search by handle prefix (handles are lowercase)
    // BOUNDED QUERY: Cap at 100 docs to prevent OOM, even with filtering
    const handleSnapshot = await dbAdmin
      .collection('profiles')
      .where('campusId', '==', campusId)
      .where('handle', '>=', lowercaseQuery)
      .where('handle', '<=', lowercaseQuery + '\uf8ff')
      .limit(Math.min(limit * 2, 100))
      .get();

    for (const doc of handleSnapshot.docs) {
      const data = doc.data();
      // Respect privacy settings
      if (data.privacy?.profileVisibility === 'private') continue;
      profileIds.push(doc.id);
      profileData.set(doc.id, { doc, matchType: 'handle' });
    }

    // Search by displayName_lowercase if we have room
    // BOUNDED QUERY: Cap at 100 total docs to prevent OOM
    const maxProfiles = Math.min(limit * 2, 100);
    if (profileIds.length < maxProfiles) {
      const nameSnapshot = await dbAdmin
        .collection('profiles')
        .where('campusId', '==', campusId)
        .where('displayName_lowercase', '>=', lowercaseQuery)
        .where('displayName_lowercase', '<=', lowercaseQuery + '\uf8ff')
        .limit(maxProfiles - profileIds.length)
        .get();

      for (const doc of nameSnapshot.docs) {
        if (profileData.has(doc.id)) continue;
        const data = doc.data();
        if (data.privacy?.profileVisibility === 'private') continue;
        profileIds.push(doc.id);
        profileData.set(doc.id, { doc, matchType: 'name' });
      }
    }

    // Batch fetch privacy settings for ghost mode filtering
    const privacyById = new Map<string, FirebaseFirestore.DocumentData>();
    if (viewerContext && profileIds.length > 0) {
      const privacyRefs = profileIds.map(id => dbAdmin.collection('privacySettings').doc(id));
      const privacyDocs = await dbAdmin.getAll(...privacyRefs);
      privacyDocs.forEach(doc => {
        if (doc.exists) {
          privacyById.set(doc.id, doc.data()!);
        }
      });
    }

    // Process profiles with ghost mode filtering and relevance scoring
    for (const profileId of profileIds) {
      const entry = profileData.get(profileId);
      if (!entry) continue;

      const data = entry.doc.data();

      // Ghost mode filtering if viewer context is available
      if (viewerContext) {
        const privacyData = privacyById.get(profileId);
        const ghostModeUser: GhostModeUser = {
          id: profileId,
          ghostMode: privacyData?.ghostMode
        };

        if (GhostModeService.shouldHideFromSearch(ghostModeUser, viewerContext)) {
          continue; // Skip - user has ghost mode hiding from search
        }
      }

      // Calculate composite relevance score
      let relevanceScore = 0;

      // Text match quality
      const handle = data.handle || '';
      const displayName = data.displayName || '';

      if (entry.matchType === 'handle') {
        relevanceScore += calculateTextMatchScore(handle, query, true);
      } else {
        relevanceScore += calculateTextMatchScore(displayName, query, true);
      }

      // Bio match adds secondary signal
      if (data.bio) {
        const bioScore = calculateTextMatchScore(data.bio, query, false);
        relevanceScore += Math.round(bioScore * 0.3);
      }

      // Recency boost based on account creation
      const createdAt = toDate(data.createdAt);
      relevanceScore += calculateRecencyBoost(createdAt);

      // Engagement boost (follower count is primary engagement metric for profiles)
      relevanceScore += calculateEngagementBoost({
        memberCount: data.followerCount || 0
      });

      // Recently active users get a boost
      const lastActiveAt = toDate(data.lastActiveAt || data.lastLoginAt);
      if (lastActiveAt) {
        const daysSinceActive = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActive < 7) {
          relevanceScore += SCORING_WEIGHTS.ACTIVE_RECENTLY_BOOST;
        }
      }

      // Verified users get a boost
      if (data.isVerified) {
        relevanceScore += SCORING_WEIGHTS.VERIFIED_BOOST;
      }

      results.push({
        id: profileId,
        title: displayName || handle || 'Anonymous',
        description: data.bio || `${data.major || ''} ${data.graduationYear ? '• ' + data.graduationYear : ''}`.trim(),
        type: 'person',
        category: 'people',
        url: `/u/${handle || profileId}`,
        metadata: {
          handle: data.handle,
          photoURL: data.photoURL,
          major: data.major,
          year: data.graduationYear,
          followerCount: data.followerCount || 0,
          isVerified: data.isVerified
        },
        relevanceScore
      });
    }
  } catch (error) {
    logger.error('Error searching profiles', { error: String(error), query });
  }

  // Sort by relevance and return top results
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

/**
 * Search posts collection with relevance ranking
 * Uses ContentModerationService for consistent moderation checks
 */
async function searchPosts(
  query: string,
  campusId: string,
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();
  const seenIds = new Set<string>();

  try {
    // Search by title if posts have titles
    // BOUNDED QUERY: Cap at 100 docs to prevent OOM, even with moderation filtering
    const titleSnapshot = await dbAdmin
      .collection('posts')
      .where('campusId', '==', campusId)
      .where('title_lowercase', '>=', lowercaseQuery)
      .where('title_lowercase', '<=', lowercaseQuery + '\uf8ff')
      .limit(Math.min(limit * 2, 100))
      .get();

    for (const doc of titleSnapshot.docs) {
      if (seenIds.has(doc.id)) continue;
      seenIds.add(doc.id);

      const data = doc.data();
      // Use ContentModerationService for consistent moderation checks
      if (ContentModerationService.isHidden(data)) continue;

      const title = data.title || data.content?.substring(0, 50) || 'Post';
      const createdAt = toDate(data.createdAt);

      // Get engagement metrics (handle legacy field names)
      const likes = data.engagement?.likes || data.likeCount || data.likes || 0;
      const comments = data.engagement?.comments || data.commentCount || 0;
      const views = data.engagement?.views || data.viewCount || 0;

      // Calculate composite relevance score
      let relevanceScore = 0;

      // Text match quality
      relevanceScore += calculateTextMatchScore(title, query, true);

      // Content match adds secondary signal
      if (data.content) {
        const contentScore = calculateTextMatchScore(data.content, query, false);
        relevanceScore += Math.round(contentScore * 0.4);
      }

      // Recency is very important for posts
      relevanceScore += calculateRecencyBoost(createdAt);

      // Engagement boost
      relevanceScore += calculateEngagementBoost({
        likeCount: likes,
        commentCount: comments,
        viewCount: views
      });

      // Pinned posts get a boost
      if (data.isPinned) {
        relevanceScore += 20;
      }

      results.push({
        id: doc.id,
        title,
        description: data.content?.substring(0, 150),
        type: 'post',
        category: 'posts',
        url: data.spaceId ? `/spaces/${data.spaceId}?post=${doc.id}` : `/posts/${doc.id}`,
        metadata: {
          authorId: data.authorId,
          authorName: data.authorName,
          spaceId: data.spaceId,
          spaceName: data.spaceName,
          likes,
          comments,
          createdAt: createdAt?.toISOString()
        },
        relevanceScore
      });
    }

    // Search by tags if available
    // BOUNDED QUERY: Cap at 100 docs to prevent OOM
    if (results.length < limit * 2) {
      const tagSnapshot = await dbAdmin
        .collection('posts')
        .where('campusId', '==', campusId)
        .where('tags', 'array-contains', lowercaseQuery)
        .limit(Math.min(limit * 2, 100))
        .get();

      for (const doc of tagSnapshot.docs) {
        if (seenIds.has(doc.id)) continue;
        seenIds.add(doc.id);

        const data = doc.data();
        // Use ContentModerationService for consistent moderation checks
        if (ContentModerationService.isHidden(data)) continue;

        const title = data.title || data.content?.substring(0, 50) || 'Post';
        const createdAt = toDate(data.createdAt);
        const likes = data.engagement?.likes || data.likeCount || data.likes || 0;
        const comments = data.engagement?.comments || data.commentCount || 0;

        // Tag match gets lower base score
        let relevanceScore = SCORING_WEIGHTS.CATEGORY_MATCH;

        // Still apply recency and engagement boosts
        relevanceScore += calculateRecencyBoost(createdAt);
        relevanceScore += calculateEngagementBoost({
          likeCount: likes,
          commentCount: comments
        });

        results.push({
          id: doc.id,
          title,
          description: data.content?.substring(0, 150),
          type: 'post',
          category: 'posts',
          url: data.spaceId ? `/spaces/${data.spaceId}?post=${doc.id}` : `/posts/${doc.id}`,
          metadata: {
            authorId: data.authorId,
            tags: data.tags,
            likes,
            createdAt: createdAt?.toISOString()
          },
          relevanceScore
        });
      }
    }
  } catch (error) {
    logger.error('Error searching posts', { error: String(error), query });
  }

  // Sort by relevance and return top results
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

/**
 * Search events collection with relevance ranking
 * Events get special treatment: upcoming events rank higher
 */
async function searchEvents(
  query: string,
  campusId: string,
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();
  const seenIds = new Set<string>();
  const now = new Date();

  try {
    // Search by title prefix
    const titleSnapshot = await dbAdmin
      .collection('events')
      .where('campusId', '==', campusId)
      .where('title_lowercase', '>=', lowercaseQuery)
      .where('title_lowercase', '<=', lowercaseQuery + '\uf8ff')
      .limit(limit * 2)
      .get();

    for (const doc of titleSnapshot.docs) {
      if (seenIds.has(doc.id)) continue;
      seenIds.add(doc.id);

      const data = doc.data();
      const startTime = toDate(data.startTime);
      const endTime = toDate(data.endTime);

      // Only include future or ongoing events
      if (endTime && endTime < now) continue;

      const title = data.title || 'Unnamed Event';
      const rsvpCount = data.rsvpCount || data.attendeeCount || 0;

      // Calculate composite relevance score
      let relevanceScore = 0;

      // Text match quality
      relevanceScore += calculateTextMatchScore(title, query, true);

      // Description match
      if (data.description) {
        const descScore = calculateTextMatchScore(data.description, query, false);
        relevanceScore += Math.round(descScore * 0.4);
      }

      // For events, "recency" means how soon the event is happening
      // Events happening sooner should rank higher
      if (startTime) {
        const daysUntilEvent = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysUntilEvent <= 0) {
          // Event is happening now - maximum boost
          relevanceScore += SCORING_WEIGHTS.RECENCY_MAX_BOOST;
        } else if (daysUntilEvent <= 7) {
          // Within a week - high boost
          relevanceScore += Math.round(SCORING_WEIGHTS.RECENCY_MAX_BOOST * 0.8);
        } else if (daysUntilEvent <= 30) {
          // Within a month - moderate boost with decay
          const factor = 1 - (daysUntilEvent - 7) / 23; // Linear decay from day 7 to day 30
          relevanceScore += Math.round(SCORING_WEIGHTS.RECENCY_MAX_BOOST * 0.5 * factor);
        }
      }

      // Engagement boost (RSVP count)
      relevanceScore += calculateEngagementBoost({ rsvpCount });

      results.push({
        id: doc.id,
        title,
        description: data.description,
        type: 'event',
        category: 'events',
        url: data.spaceId ? `/s/${data.spaceId}` : `/discover?tab=events`,
        metadata: {
          startTime: startTime?.toISOString(),
          endTime: endTime?.toISOString(),
          spaceId: data.spaceId,
          spaceName: data.spaceName,
          location: data.location,
          rsvpCount,
          isVirtual: data.isVirtual
        },
        relevanceScore
      });
    }

    // Also search by location if we have room
    if (results.length < limit * 2) {
      const locationSnapshot = await dbAdmin
        .collection('events')
        .where('campusId', '==', campusId)
        .where('location_lowercase', '>=', lowercaseQuery)
        .where('location_lowercase', '<=', lowercaseQuery + '\uf8ff')
        .limit(limit)
        .get();

      for (const doc of locationSnapshot.docs) {
        if (seenIds.has(doc.id)) continue;
        seenIds.add(doc.id);

        const data = doc.data();
        const startTime = toDate(data.startTime);
        const endTime = toDate(data.endTime);

        if (endTime && endTime < now) continue;

        const title = data.title || 'Unnamed Event';
        const rsvpCount = data.rsvpCount || data.attendeeCount || 0;

        // Location match gets lower base score
        let relevanceScore = SCORING_WEIGHTS.PARTIAL_WORD_MATCH;

        // Still apply time-based and engagement boosts
        if (startTime) {
          const daysUntilEvent = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          if (daysUntilEvent <= 7) {
            relevanceScore += Math.round(SCORING_WEIGHTS.RECENCY_MAX_BOOST * 0.6);
          }
        }

        relevanceScore += calculateEngagementBoost({ rsvpCount });

        results.push({
          id: doc.id,
          title,
          description: data.description,
          type: 'event',
          category: 'events',
          url: data.spaceId ? `/s/${data.spaceId}` : `/discover?tab=events`,
          metadata: {
            startTime: startTime?.toISOString(),
            endTime: endTime?.toISOString(),
            spaceId: data.spaceId,
            spaceName: data.spaceName,
            location: data.location,
            rsvpCount
          },
          relevanceScore
        });
      }
    }
  } catch (error) {
    logger.error('Error searching events', { error: String(error), query });
  }

  // Sort by relevance and return top results
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

/**
 * Search tools collection with relevance ranking
 */
async function searchTools(
  query: string,
  campusId: string,
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();
  const seenIds = new Set<string>();

  try {
    // Search by name_lowercase
    const nameSnapshot = await dbAdmin
      .collection('tools')
      .where('name_lowercase', '>=', lowercaseQuery)
      .where('name_lowercase', '<=', lowercaseQuery + '\uf8ff')
      .where('isPublic', '==', true)
      .limit(limit * 2)
      .get();

    for (const doc of nameSnapshot.docs) {
      if (seenIds.has(doc.id)) continue;
      seenIds.add(doc.id);

      const data = doc.data();
      // Filter by campus if tool has campusId
      if (data.campusId && data.campusId !== campusId) continue;

      const name = data.name || 'Unnamed Tool';
      const createdAt = toDate(data.createdAt);
      const lastUsedAt = toDate(data.lastUsedAt);
      const deploymentCount = data.deploymentCount || 0;
      const usageCount = data.usageCount || data.analytics?.views || 0;

      // Calculate composite relevance score
      let relevanceScore = 0;

      // Text match quality
      relevanceScore += calculateTextMatchScore(name, query, true);

      // Description match
      if (data.description) {
        const descScore = calculateTextMatchScore(data.description, query, false);
        relevanceScore += Math.round(descScore * 0.4);
      }

      // Recency boost (when tool was created)
      relevanceScore += calculateRecencyBoost(createdAt);

      // Engagement boost (deployment and usage count are key metrics for tools)
      relevanceScore += calculateEngagementBoost({
        deploymentCount,
        viewCount: usageCount
      });

      // Recently used tools get a boost
      if (lastUsedAt) {
        const daysSinceUsed = (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUsed < 7) {
          relevanceScore += SCORING_WEIGHTS.ACTIVE_RECENTLY_BOOST;
        }
      }

      // Verified/official tools get a boost
      if (data.isVerified || data.isTemplate) {
        relevanceScore += SCORING_WEIGHTS.VERIFIED_BOOST;
      }

      results.push({
        id: doc.id,
        title: name,
        description: data.description,
        type: 'tool',
        category: 'tools',
        url: `/lab/${doc.id}`,
        metadata: {
          type: data.type,
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          deploymentCount,
          usageCount,
          rating: data.rating,
          isTemplate: data.isTemplate
        },
        relevanceScore
      });
    }

    // Search by type/category
    const toolTypes = ['poll', 'form', 'calculator', 'timer', 'scheduler', 'tracker', 'survey', 'quiz']
      .filter(t => t.includes(lowercaseQuery) || lowercaseQuery.includes(t));

    if (toolTypes.length > 0 && results.length < limit * 2) {
      const typeSnapshot = await dbAdmin
        .collection('tools')
        .where('type', 'in', toolTypes)
        .where('isPublic', '==', true)
        .orderBy('usageCount', 'desc')
        .limit(limit)
        .get();

      for (const doc of typeSnapshot.docs) {
        if (seenIds.has(doc.id)) continue;
        seenIds.add(doc.id);

        const data = doc.data();
        if (data.campusId && data.campusId !== campusId) continue;

        const name = data.name || 'Unnamed Tool';
        const deploymentCount = data.deploymentCount || 0;

        // Type match gets lower base score
        let relevanceScore = SCORING_WEIGHTS.CATEGORY_MATCH;

        // Still apply engagement boost (important for type-based searches)
        relevanceScore += calculateEngagementBoost({
          deploymentCount,
          viewCount: data.usageCount || 0
        });

        if (data.isVerified || data.isTemplate) {
          relevanceScore += SCORING_WEIGHTS.VERIFIED_BOOST;
        }

        results.push({
          id: doc.id,
          title: name,
          description: data.description,
          type: 'tool',
          category: 'tools',
          url: `/lab/${doc.id}`,
          metadata: {
            type: data.type,
            creatorId: data.creatorId,
            deploymentCount
          },
          relevanceScore
        });
      }
    }
  } catch (error) {
    logger.error('Error searching tools', { error: String(error), query });
  }

  // Sort by relevance and return top results
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

async function _GET(request: NextRequest) {
  try {
    // Rate limit check - use IP for client identification
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const rateLimitResult = searchRateLimit.check(`ip:${clientIp}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          results: [],
          totalCount: 0,
          error: 'Rate limit exceeded',
          message: 'Too many search requests. Please wait before trying again.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const category = (searchParams.get('category') || 'all') as SearchCategory;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // SECURITY: Get campusId from user auth session, not query params
    // This prevents cross-campus data access
    const user = await getCurrentUser(request);
    let campusId: string;
    if (user?.email) {
      try {
        campusId = getCampusFromEmail(user.email);
      } catch {
        campusId = getDefaultCampusId();
      }
    } else {
      campusId = getDefaultCampusId();
    }

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        totalCount: 0,
        query: query || '',
        category,
        campusId,
        message: query ? 'Query must be at least 2 characters' : 'No query provided'
      });
    }

    // Build viewer context for ghost mode filtering
    const viewerContext = user
      ? ViewerContext.authenticated({
          userId: user.uid,
          campusId,
          isAdmin: false // Could check admin role here if needed
        })
      : ViewerContext.anonymous(campusId);

    const startTime = Date.now();
    let allResults: SearchResult[] = [];

    // Execute searches based on category filter
    const searchPromises: Promise<SearchResult[]>[] = [];

    if (category === 'all' || category === 'spaces') {
      searchPromises.push(searchSpaces(query, campusId, limit));
    }
    if (category === 'all' || category === 'people') {
      searchPromises.push(searchProfiles(query, campusId, limit, viewerContext));
    }
    if (category === 'all' || category === 'posts') {
      searchPromises.push(searchPosts(query, campusId, limit));
    }
    if (category === 'all' || category === 'tools') {
      searchPromises.push(searchTools(query, campusId, limit));
    }
    if (category === 'all' || category === 'events') {
      searchPromises.push(searchEvents(query, campusId, limit));
    }

    // Execute all searches in parallel
    const searchResults = await Promise.all(searchPromises);
    allResults = searchResults.flat();

    // Sort by relevance score and limit
    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const finalResults = allResults.slice(0, limit);

    const searchDuration = Date.now() - startTime;

    logger.info('Search completed', {
      query,
      category,
      campusId,
      resultCount: finalResults.length,
      durationMs: searchDuration
    });

    return NextResponse.json({
      results: finalResults,
      totalCount: finalResults.length,
      query,
      category,
      campusId,
      metadata: {
        searchDurationMs: searchDuration,
        searchedCategories: category === 'all'
          ? ['spaces', 'people', 'events', 'posts', 'tools']
          : [category]
      },
      suggestions: query.length >= 3 ? generateSuggestions(query, finalResults) : []
    });

  } catch (error) {
    logger.error('Search error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Search failed', results: [], totalCount: 0 },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * Generate search suggestions based on results
 */
function generateSuggestions(query: string, results: SearchResult[]): string[] {
  const suggestions: string[] = [];

  // Suggest specific categories if results span multiple types
  const types = new Set(results.map(r => r.type));
  if (types.size > 1) {
    if (types.has('space')) suggestions.push(`${query} in spaces`);
    if (types.has('person')) suggestions.push(`${query} people`);
    if (types.has('event')) suggestions.push(`${query} events`);
    if (types.has('tool')) suggestions.push(`${query} tools`);
  }

  return suggestions.slice(0, 3);
}

export const GET = withCache(_GET, 'SHORT');
