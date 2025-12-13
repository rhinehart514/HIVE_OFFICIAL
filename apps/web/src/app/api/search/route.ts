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
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { logger } from '@/lib/structured-logger';
import { HttpStatus } from '@/lib/api-response-types';
import {
  GhostModeService,
  ViewerContext,
  ContentModerationService
} from '@hive/core';
import type { GhostModeUser } from '@hive/core';
import { getCurrentUser } from '@/lib/server-auth';
import { searchRateLimit } from '@/lib/rate-limit-simple';

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

type SearchCategory = 'spaces' | 'tools' | 'people' | 'posts' | 'all';

/**
 * Search spaces collection
 */
async function searchSpaces(
  query: string,
  campusId: string,
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();

  try {
    // Search by name_lowercase prefix
    const nameSnapshot = await dbAdmin
      .collection('spaces')
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .where('name_lowercase', '>=', lowercaseQuery)
      .where('name_lowercase', '<=', lowercaseQuery + '\uf8ff')
      .limit(limit)
      .get();

    for (const doc of nameSnapshot.docs) {
      const data = doc.data();
      results.push({
        id: doc.id,
        title: data.name || 'Unnamed Space',
        description: data.description,
        type: 'space',
        category: 'spaces',
        url: data.slug ? `/spaces/s/${data.slug}` : `/spaces/${doc.id}`,
        metadata: {
          memberCount: data.memberCount || data.metrics?.memberCount || 0,
          category: data.category,
          type: data.type
        },
        relevanceScore: 100 // Exact prefix match
      });
    }

    // Also search by category if query matches known categories
    const categoryMatches = ['student_org', 'residential', 'greek_life', 'university_org', 'academic']
      .filter(cat => cat.includes(lowercaseQuery));

    if (categoryMatches.length > 0 && results.length < limit) {
      const categorySnapshot = await dbAdmin
        .collection('spaces')
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .where('category', 'in', categoryMatches)
        .limit(limit - results.length)
        .get();

      for (const doc of categorySnapshot.docs) {
        // Avoid duplicates
        if (results.some(r => r.id === doc.id)) continue;

        const data = doc.data();
        results.push({
          id: doc.id,
          title: data.name || 'Unnamed Space',
          description: data.description,
          type: 'space',
          category: 'spaces',
          url: data.slug ? `/spaces/s/${data.slug}` : `/spaces/${doc.id}`,
          metadata: {
            memberCount: data.memberCount || data.metrics?.memberCount || 0,
            category: data.category
          },
          relevanceScore: 70 // Category match
        });
      }
    }
  } catch (error) {
    logger.error('Error searching spaces', { error: String(error), query });
  }

  return results;
}

/**
 * Search profiles collection
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
  const profileData: Map<string, { doc: FirebaseFirestore.QueryDocumentSnapshot; score: number }> = new Map();

  try {
    // Search by handle prefix (handles are lowercase)
    const handleSnapshot = await dbAdmin
      .collection('profiles')
      .where('campusId', '==', campusId)
      .where('handle', '>=', lowercaseQuery)
      .where('handle', '<=', lowercaseQuery + '\uf8ff')
      .limit(limit * 2) // Fetch extra to account for filtering
      .get();

    for (const doc of handleSnapshot.docs) {
      const data = doc.data();
      // Respect privacy settings
      if (data.privacy?.profileVisibility === 'private') continue;
      profileIds.push(doc.id);
      profileData.set(doc.id, { doc, score: 100 });
    }

    // Search by displayName_lowercase if we have room
    if (profileIds.length < limit * 2) {
      const nameSnapshot = await dbAdmin
        .collection('profiles')
        .where('campusId', '==', campusId)
        .where('displayName_lowercase', '>=', lowercaseQuery)
        .where('displayName_lowercase', '<=', lowercaseQuery + '\uf8ff')
        .limit((limit * 2) - profileIds.length)
        .get();

      for (const doc of nameSnapshot.docs) {
        if (profileData.has(doc.id)) continue;
        const data = doc.data();
        if (data.privacy?.profileVisibility === 'private') continue;
        profileIds.push(doc.id);
        profileData.set(doc.id, { doc, score: 90 });
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

    // Process profiles with ghost mode filtering
    for (const profileId of profileIds) {
      if (results.length >= limit) break;

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

      results.push({
        id: profileId,
        title: data.displayName || data.handle || 'Anonymous',
        description: data.bio || `${data.major || ''} • ${data.graduationYear || ''}`.trim(),
        type: 'person',
        category: 'people',
        url: data.handle ? `/user/${data.handle}` : `/profile/${profileId}`,
        metadata: {
          handle: data.handle,
          photoURL: data.photoURL,
          major: data.major,
          year: entry.score === 100 ? data.graduationYear : undefined
        },
        relevanceScore: entry.score
      });
    }
  } catch (error) {
    logger.error('Error searching profiles', { error: String(error), query });
  }

  return results;
}

/**
 * Search posts collection
 * Uses ContentModerationService for consistent moderation checks
 */
async function searchPosts(
  query: string,
  campusId: string,
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();

  try {
    // Search by title if posts have titles
    const titleSnapshot = await dbAdmin
      .collection('posts')
      .where('campusId', '==', campusId)
      .where('title_lowercase', '>=', lowercaseQuery)
      .where('title_lowercase', '<=', lowercaseQuery + '\uf8ff')
      .limit(limit * 2) // Fetch extra to account for moderation filtering
      .get();

    for (const doc of titleSnapshot.docs) {
      if (results.length >= limit) break;
      const data = doc.data();
      // Use ContentModerationService for consistent moderation checks
      if (ContentModerationService.isHidden(data)) continue;

      results.push({
        id: doc.id,
        title: data.title || data.content?.substring(0, 50) || 'Post',
        description: data.content?.substring(0, 150),
        type: 'post',
        category: 'posts',
        url: data.spaceId ? `/spaces/${data.spaceId}?post=${doc.id}` : `/posts/${doc.id}`,
        metadata: {
          authorId: data.authorId,
          spaceId: data.spaceId,
          likes: data.likes || data.engagement?.likes || 0,
          createdAt: data.createdAt
        },
        relevanceScore: 80
      });
    }

    // Search by tags if available
    if (results.length < limit) {
      const tagSnapshot = await dbAdmin
        .collection('posts')
        .where('campusId', '==', campusId)
        .where('tags', 'array-contains', lowercaseQuery)
        .limit((limit - results.length) * 2)
        .get();

      for (const doc of tagSnapshot.docs) {
        if (results.length >= limit) break;
        if (results.some(r => r.id === doc.id)) continue;

        const data = doc.data();
        // Use ContentModerationService for consistent moderation checks
        if (ContentModerationService.isHidden(data)) continue;

        results.push({
          id: doc.id,
          title: data.title || data.content?.substring(0, 50) || 'Post',
          description: data.content?.substring(0, 150),
          type: 'post',
          category: 'posts',
          url: data.spaceId ? `/spaces/${data.spaceId}?post=${doc.id}` : `/posts/${doc.id}`,
          metadata: {
            authorId: data.authorId,
            tags: data.tags
          },
          relevanceScore: 60 // Tag match
        });
      }
    }
  } catch (error) {
    logger.error('Error searching posts', { error: String(error), query });
  }

  return results;
}

/**
 * Search tools collection
 */
async function searchTools(
  query: string,
  campusId: string,
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();

  try {
    // Search by name_lowercase
    const nameSnapshot = await dbAdmin
      .collection('tools')
      .where('name_lowercase', '>=', lowercaseQuery)
      .where('name_lowercase', '<=', lowercaseQuery + '\uf8ff')
      .where('isPublic', '==', true)
      .limit(limit)
      .get();

    for (const doc of nameSnapshot.docs) {
      const data = doc.data();
      // Filter by campus if tool has campusId
      if (data.campusId && data.campusId !== campusId) continue;

      results.push({
        id: doc.id,
        title: data.name || 'Unnamed Tool',
        description: data.description,
        type: 'tool',
        category: 'tools',
        url: `/tools/${doc.id}`,
        metadata: {
          type: data.type,
          creatorId: data.creatorId,
          deploymentCount: data.deploymentCount || 0,
          rating: data.rating
        },
        relevanceScore: 100
      });
    }

    // Search by type/category
    const toolTypes = ['poll', 'form', 'calculator', 'timer', 'scheduler', 'tracker']
      .filter(t => t.includes(lowercaseQuery));

    if (toolTypes.length > 0 && results.length < limit) {
      const typeSnapshot = await dbAdmin
        .collection('tools')
        .where('type', 'in', toolTypes)
        .where('isPublic', '==', true)
        .limit(limit - results.length)
        .get();

      for (const doc of typeSnapshot.docs) {
        if (results.some(r => r.id === doc.id)) continue;

        const data = doc.data();
        if (data.campusId && data.campusId !== campusId) continue;

        results.push({
          id: doc.id,
          title: data.name || 'Unnamed Tool',
          description: data.description,
          type: 'tool',
          category: 'tools',
          url: `/tools/${doc.id}`,
          metadata: {
            type: data.type,
            creatorId: data.creatorId
          },
          relevanceScore: 70
        });
      }
    }
  } catch (error) {
    logger.error('Error searching tools', { error: String(error), query });
  }

  return results;
}

export async function GET(request: NextRequest) {
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
    const campusId = searchParams.get('campusId') || CURRENT_CAMPUS_ID;

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

    // Get current user for viewer context (ghost mode filtering)
    const user = await getCurrentUser(request);
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
          ? ['spaces', 'people', 'posts', 'tools']
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
    if (types.has('tool')) suggestions.push(`${query} tools`);
  }

  return suggestions.slice(0, 3);
}
