import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import type * as admin from 'firebase-admin';
import { logger } from "@/lib/logger";
import { withAuthValidationAndErrors, getUserId, getCampusId, RATE_LIMIT_PRESETS } from "@/lib/middleware";

const SearchFeedSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  type: z.enum(['post', 'event', 'tool', 'space_update', 'announcement']).optional(),
  spaceId: z.string().optional(),
  timeRange: z.enum(['day', 'week', 'month', 'all']).default('all'),
  sortBy: z.enum(['relevance', 'recent', 'engagement']).default('relevance'),
  includeUserContent: z.coerce.boolean().default(true)
});

const db = dbAdmin;

export const POST = withAuthValidationAndErrors(
  SearchFeedSchema,
  async (request, _context, body, respond) => {
    const userId = getUserId(request);
    const campusId = getCampusId(request); // Now guaranteed by middleware

    // Destructure with explicit defaults to satisfy TypeScript
    // (Zod provides defaults but TS inference doesn't carry them through)
    const query = body.query;
    const limit = body.limit ?? 20;
    const offset = body.offset ?? 0;
    const type = body.type;
    const spaceId = body.spaceId;
    const timeRange = body.timeRange ?? 'all';
    const sortBy = body.sortBy ?? 'relevance';

    // Calculate time filter
    let timeFilter: Date | null = null;
    if (timeRange === 'day' || timeRange === 'week' || timeRange === 'month') {
      const now = new Date();
      const timeMap = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      } as const;
      timeFilter = new Date(now.getTime() - timeMap[timeRange]);
    }

    // Get user's spaces for filtering relevant content
    const userSpacesSnapshot = await db
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(200)
      .get();
    const userSpaceIds = userSpacesSnapshot.docs
      .map(doc => doc.data().spaceId as string)
      .filter((id): id is string => Boolean(id));

    const feedItems = [];
    const queryLower = query.toLowerCase();

    // Search posts
    if (!type || type === 'post') {
      let postsQuery: admin.firestore.Query<admin.firestore.DocumentData> = dbAdmin.collection('posts');

      if (spaceId) {
        postsQuery = postsQuery.where('spaceId', '==', spaceId);
      } else {
        // Only include posts from user's spaces
        if (userSpaceIds.length > 0) {
          postsQuery = postsQuery.where('spaceId', 'in', userSpaceIds.slice(0, 10)); // Firestore limit
        }
      }

      if (timeFilter) {
        postsQuery = postsQuery.where('createdAt', '>=', timeFilter);
      }

      const postsSnapshot = await postsQuery.get();

      // First pass: filter matching posts and collect IDs for batch fetch
      const matchingPosts: Array<{ doc: typeof postsSnapshot.docs[0]; postData: ReturnType<typeof postsSnapshot.docs[0]['data']>; contentMatch: boolean; titleMatch: boolean }> = [];
      const postAuthorIds = new Set<string>();
      const postSpaceIds = new Set<string>();

      for (const doc of postsSnapshot.docs) {
        const postData = doc.data();
        // campusId single-field index is exempted — filter in memory
        if (postData.campusId && postData.campusId !== campusId) continue;
        const content = (postData.content || '').toLowerCase();
        const title = (postData.title || '').toLowerCase();
        const contentMatch = content.includes(queryLower);
        const titleMatch = title.includes(queryLower);
        if (!contentMatch && !titleMatch) continue;

        matchingPosts.push({ doc, postData, contentMatch, titleMatch });
        if (postData.authorId) postAuthorIds.add(postData.authorId);
        if (postData.spaceId) postSpaceIds.add(postData.spaceId);
      }

      // Batch fetch authors and spaces (max 30 per Firestore 'in' query)
      const postAuthorMap = new Map<string, Record<string, unknown>>();
      if (postAuthorIds.size > 0) {
        const refs = Array.from(postAuthorIds).map(id => dbAdmin.collection('users').doc(id));
        try {
          const docs = await dbAdmin.getAll(...refs);
          for (const doc of docs) {
            if (doc.exists) postAuthorMap.set(doc.id, doc.data() as Record<string, unknown>);
          }
        } catch {
          logger.warn('Failed to batch fetch authors at /api/feed/search');
        }
      }

      const postSpaceMap = new Map<string, Record<string, unknown>>();
      if (postSpaceIds.size > 0) {
        const refs = Array.from(postSpaceIds).map(id => dbAdmin.collection('spaces').doc(id));
        try {
          const docs = await dbAdmin.getAll(...refs);
          for (const doc of docs) {
            if (doc.exists) postSpaceMap.set(doc.id, doc.data() as Record<string, unknown>);
          }
        } catch {
          logger.warn('Failed to batch fetch spaces at /api/feed/search');
        }
      }

      // Second pass: build feed items using batch-fetched data
      for (const { doc, postData, contentMatch, titleMatch } of matchingPosts) {
        const content = (postData.content || '').toLowerCase();
        const title = (postData.title || '').toLowerCase();

        const authorData = postData.authorId ? postAuthorMap.get(postData.authorId) : null;
        const author = authorData ? {
          id: postData.authorId,
          name: (authorData.fullName as string) || 'Unknown',
          avatar: (authorData.photoURL as string) || null,
          handle: (authorData.handle as string) || 'unknown',
        } : null;

        const spaceData = postData.spaceId ? postSpaceMap.get(postData.spaceId) : null;
        const space = spaceData ? {
          id: postData.spaceId,
          name: (spaceData.name as string) || 'Unknown Space',
        } : null;

        // Calculate relevance score
        let relevanceScore = 0;
        if (titleMatch) relevanceScore += title === queryLower ? 100 : 80;
        if (contentMatch) relevanceScore += 60;
        
        // Boost recent content
        const daysSinceCreated = (Date.now() - postData.createdAt?.toDate?.()?.getTime() || Date.now()) / (1000 * 60 * 60 * 24);
        relevanceScore += Math.max(0, 20 - daysSinceCreated);
        
        // Boost engagement
        const likeCount = postData.likeCount || 0;
        const commentCount = postData.commentCount || 0;
        relevanceScore += Math.min(30, (likeCount + commentCount * 2));

        feedItems.push({
          id: doc.id,
          type: 'post',
          title: postData.title,
          content: postData.content,
          createdAt: postData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          author,
          space,
          likeCount,
          commentCount,
          relevanceScore,
          highlights: {
            title: titleMatch ? [title] : [],
            content: contentMatch ? [content.substring(
              Math.max(0, content.indexOf(queryLower) - 50),
              Math.min(content.length, content.indexOf(queryLower) + queryLower.length + 50)
            )] : []
          }
        });
      }
    }

    // Search events
    if (!type || type === 'event') {
      for (const currentSpaceId of (spaceId ? [spaceId] : userSpaceIds.slice(0, 10))) {
        // When a specific spaceId is provided, ensure it's within current campus
        if (spaceId) {
          try {
            const spaceDoc = await dbAdmin.collection('spaces').doc(currentSpaceId).get();
            if (!spaceDoc.exists || (spaceDoc.data()?.campusId && spaceDoc.data()?.campusId !== campusId)) {
              continue;
            }
          } catch {
            // Silently ignore validation errors for spaceId check
          }
        }
        let eventsQuery: admin.firestore.Query<admin.firestore.DocumentData> = db
          .collection('spaces')
          .doc(currentSpaceId)
          .collection('events');
        
        if (timeFilter) {
          eventsQuery = eventsQuery.where('createdAt', '>=', timeFilter);
        }

        const eventsSnapshot = await eventsQuery.get();
        
        // First pass: filter matching events and collect IDs
        const matchingEvents: Array<{ doc: typeof eventsSnapshot.docs[0]; eventData: ReturnType<typeof eventsSnapshot.docs[0]['data']>; titleMatch: boolean; descriptionMatch: boolean }> = [];
        const eventOrganizerIds = new Set<string>();

        for (const doc of eventsSnapshot.docs) {
          const eventData = doc.data();
          const title = (eventData.title || '').toLowerCase();
          const description = (eventData.description || '').toLowerCase();
          const titleMatch = title.includes(queryLower);
          const descriptionMatch = description.includes(queryLower);
          if (!titleMatch && !descriptionMatch) continue;

          matchingEvents.push({ doc, eventData, titleMatch, descriptionMatch });
          if (eventData.organizerId) eventOrganizerIds.add(eventData.organizerId);
        }

        // Batch fetch organizers
        const eventOrganizerMap = new Map<string, Record<string, unknown>>();
        if (eventOrganizerIds.size > 0) {
          const refs = Array.from(eventOrganizerIds).map(id => dbAdmin.collection('users').doc(id));
          try {
            const docs = await dbAdmin.getAll(...refs);
            for (const doc of docs) {
              if (doc.exists) eventOrganizerMap.set(doc.id, doc.data() as Record<string, unknown>);
            }
          } catch {
            logger.warn('Failed to batch fetch organizers at /api/feed/search');
          }
        }

        // Batch fetch space info for the current space (single fetch, reused)
        let eventSpaceInfo: { id: string; name: string } | null = null;
        try {
          const spaceDoc = await dbAdmin.collection('spaces').doc(currentSpaceId).get();
          if (spaceDoc.exists) {
            const spaceData = spaceDoc.data();
            eventSpaceInfo = { id: spaceDoc.id, name: spaceData?.name || 'Unknown Space' };
          }
        } catch {
          logger.warn('Failed to fetch space info at /api/feed/search');
        }

        // Second pass: build feed items
        for (const { doc, eventData, titleMatch, descriptionMatch } of matchingEvents) {
          const title = (eventData.title || '').toLowerCase();
          const description = (eventData.description || '').toLowerCase();

          const organizerData = eventData.organizerId ? eventOrganizerMap.get(eventData.organizerId) : null;
          const organizer = organizerData ? {
            id: eventData.organizerId,
            name: (organizerData.fullName as string) || 'Unknown',
            avatar: (organizerData.photoURL as string) || null,
          } : null;

          // Calculate relevance score
          let relevanceScore = 0;
          if (titleMatch) relevanceScore += title === queryLower ? 100 : 80;
          if (descriptionMatch) relevanceScore += 60;
          
          // Boost upcoming events
          const isUpcoming = eventData.startDate && eventData.startDate.toDate() > new Date();
          if (isUpcoming) relevanceScore += 40;
          
          // Boost based on RSVP count (approximated)
          relevanceScore += Math.min(20, (eventData.currentAttendees || 0));

          feedItems.push({
            id: doc.id,
            type: 'event',
            title: eventData.title,
            description: eventData.description,
            startDate: eventData.startDate?.toDate?.()?.toISOString(),
            location: eventData.location,
            createdAt: eventData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            organizer,
            space: eventSpaceInfo,
            currentAttendees: eventData.currentAttendees || 0,
            relevanceScore,
            highlights: {
              title: titleMatch ? [title] : [],
              description: descriptionMatch ? [description.substring(
                Math.max(0, description.indexOf(queryLower) - 50),
                Math.min(description.length, description.indexOf(queryLower) + queryLower.length + 50)
              )] : []
            }
          });
        }
      }
    }

    // Search tools
    if (!type || type === 'tool') {
      let toolsQuery: admin.firestore.Query<admin.firestore.DocumentData> = dbAdmin.collection('tools');

      if (timeFilter) {
        toolsQuery = toolsQuery.where('createdAt', '>=', timeFilter);
      }

      const toolsSnapshot = await toolsQuery.get();

      // First pass: filter matching tools and collect creator IDs
      const matchingTools: Array<{ doc: typeof toolsSnapshot.docs[0]; toolData: ReturnType<typeof toolsSnapshot.docs[0]['data']>; nameMatch: boolean; descriptionMatch: boolean }> = [];
      const toolCreatorIds = new Set<string>();

      for (const doc of toolsSnapshot.docs) {
        const toolData = doc.data();
        // campusId single-field index is exempted — filter in memory
        if (toolData.campusId && toolData.campusId !== campusId) continue;
        if (toolData.isPrivate && toolData.creatorId !== userId) continue;

        const name = (toolData.name || '').toLowerCase();
        const description = (toolData.description || '').toLowerCase();
        const nameMatch = name.includes(queryLower);
        const descriptionMatch = description.includes(queryLower);
        if (!nameMatch && !descriptionMatch) continue;

        matchingTools.push({ doc, toolData, nameMatch, descriptionMatch });
        if (toolData.creatorId) toolCreatorIds.add(toolData.creatorId);
      }

      // Batch fetch creators
      const toolCreatorMap = new Map<string, Record<string, unknown>>();
      if (toolCreatorIds.size > 0) {
        const refs = Array.from(toolCreatorIds).map(id => dbAdmin.collection('users').doc(id));
        try {
          const docs = await dbAdmin.getAll(...refs);
          for (const doc of docs) {
            if (doc.exists) toolCreatorMap.set(doc.id, doc.data() as Record<string, unknown>);
          }
        } catch {
          logger.warn('Failed to batch fetch creators at /api/feed/search');
        }
      }

      // Second pass: build feed items
      for (const { doc, toolData, nameMatch, descriptionMatch } of matchingTools) {
        const name = (toolData.name || '').toLowerCase();
        const description = (toolData.description || '').toLowerCase();

        const creatorData = toolData.creatorId ? toolCreatorMap.get(toolData.creatorId) : null;
        const creator = creatorData ? {
          id: toolData.creatorId,
          name: (creatorData.fullName as string) || 'Unknown',
          avatar: (creatorData.photoURL as string) || null,
        } : null;

        // Calculate relevance score
        let relevanceScore = 0;
        if (nameMatch) relevanceScore += name === queryLower ? 100 : 80;
        if (descriptionMatch) relevanceScore += 60;
        
        // Boost popular tools
        const deploymentCount = toolData.deploymentCount || 0;
        relevanceScore += Math.min(30, deploymentCount * 2);
        
        // Boost verified tools
        if (toolData.isVerified) relevanceScore += 20;

        feedItems.push({
          id: doc.id,
          type: 'tool',
          name: toolData.name,
          description: toolData.description,
          category: toolData.category,
          deploymentCount,
          averageRating: toolData.averageRating || 0,
          createdAt: toolData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          creator,
          relevanceScore,
          highlights: {
            name: nameMatch ? [name] : [],
            description: descriptionMatch ? [description.substring(
              Math.max(0, description.indexOf(queryLower) - 50),
              Math.min(description.length, description.indexOf(queryLower) + queryLower.length + 50)
            )] : []
          }
        });
      }
    }

    // Sort results
    feedItems.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'engagement': {
          const aEngagement = (a.likeCount || 0) + (a.commentCount || 0) + (a.currentAttendees || 0) + (a.deploymentCount || 0);
          const bEngagement = (b.likeCount || 0) + (b.commentCount || 0) + (b.currentAttendees || 0) + (b.deploymentCount || 0);
          return bEngagement - aEngagement;
        }
        case 'relevance':
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });

    // Apply pagination
    const paginatedItems = feedItems.slice(offset, offset + limit);

    return respond.success({
      items: paginatedItems,
      total: feedItems.length,
      hasMore: feedItems.length > offset + limit,
      pagination: {
        limit,
        offset,
        nextOffset: feedItems.length > offset + limit ? offset + limit : null,
      },
      query: {
        ...body,
        executedAt: new Date().toISOString(),
      }
    });
  },
  { rateLimit: RATE_LIMIT_PRESETS.search }
);
