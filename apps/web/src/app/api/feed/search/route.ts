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

type SearchFeedParams = z.infer<typeof SearchFeedSchema>;

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
      .where('campusId', '==', campusId)
      .limit(200)
      .get();
    const userSpaceIds = userSpacesSnapshot.docs
      .map(doc => doc.data().spaceId as string)
      .filter((id): id is string => Boolean(id));

    const feedItems = [];
    const queryLower = query.toLowerCase();

    // Search posts
    if (!type || type === 'post') {
      let postsQuery: admin.firestore.Query<admin.firestore.DocumentData> = dbAdmin.collection('posts')
        .where('campusId', '==', campusId);
      
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
      
      for (const doc of postsSnapshot.docs) {
        const postData = doc.data();
        
        // Text matching
        const content = (postData.content || '').toLowerCase();
        const title = (postData.title || '').toLowerCase();
        
        const contentMatch = content.includes(queryLower);
        const titleMatch = title.includes(queryLower);
        
        if (!contentMatch && !titleMatch) continue;

        // Get author info
        let author = null;
        if (postData.authorId) {
          try {
            const authorDoc = await dbAdmin.collection('users').doc(postData.authorId).get();
            if (authorDoc.exists) {
              const authorData = authorDoc.data();
              author = {
                id: authorDoc.id,
                name: authorData?.fullName || 'Unknown',
                avatar: authorData?.photoURL || null,
                handle: authorData?.handle || 'unknown',
              };
            }
          } catch {
            // Silently ignore author fetch errors - not critical to search results
            logger.warn(
      `Failed to fetch author info at /api/feed/search`
    );
          }
        }

        // Get space info
        let space = null;
        if (postData.spaceId) {
          try {
            const spaceDoc = await dbAdmin.collection('spaces').doc(postData.spaceId).get();
            if (spaceDoc.exists) {
              const spaceData = spaceDoc.data();
              space = {
                id: spaceDoc.id,
                name: spaceData?.name || 'Unknown Space',
              };
            }
          } catch {
            // Silently ignore space fetch errors - not critical to search results
            logger.warn(
      `Failed to fetch space info at /api/feed/search`
    );
          }
        }

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
        
        for (const doc of eventsSnapshot.docs) {
          const eventData = doc.data();
          
          // Text matching
          const title = (eventData.title || '').toLowerCase();
          const description = (eventData.description || '').toLowerCase();
          
          const titleMatch = title.includes(queryLower);
          const descriptionMatch = description.includes(queryLower);
          
          if (!titleMatch && !descriptionMatch) continue;

          // Get organizer info
          let organizer = null;
          if (eventData.organizerId) {
            try {
              const organizerDoc = await dbAdmin.collection('users').doc(eventData.organizerId).get();
              if (organizerDoc.exists) {
                const organizerData = organizerDoc.data();
                organizer = {
                  id: organizerDoc.id,
                  name: organizerData?.fullName || 'Unknown',
                  avatar: organizerData?.photoURL || null,
                };
              }
            } catch {
              logger.warn(
      `Failed to fetch organizer info at /api/feed/search`
    );
            }
          }

          // Get space info
          let space = null;
          try {
            const spaceDoc = await dbAdmin.collection('spaces').doc(currentSpaceId).get();
            if (spaceDoc.exists) {
              const spaceData = spaceDoc.data();
              space = {
                id: spaceDoc.id,
                name: spaceData?.name || 'Unknown Space',
              };
            }
          } catch {
            logger.warn(
      `Failed to fetch space info at /api/feed/search`
    );
          }

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
            space,
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
      let toolsQuery: admin.firestore.Query<admin.firestore.DocumentData> = dbAdmin.collection('tools')
        .where('campusId', '==', campusId);
      
      if (timeFilter) {
        toolsQuery = toolsQuery.where('createdAt', '>=', timeFilter);
      }

      const toolsSnapshot = await toolsQuery.get();
      
      for (const doc of toolsSnapshot.docs) {
        const toolData = doc.data();
        
        // Skip private tools unless they belong to the user
        if (toolData.isPrivate && toolData.creatorId !== userId) continue;
        
        // Text matching
        const name = (toolData.name || '').toLowerCase();
        const description = (toolData.description || '').toLowerCase();
        
        const nameMatch = name.includes(queryLower);
        const descriptionMatch = description.includes(queryLower);
        
        if (!nameMatch && !descriptionMatch) continue;

        // Get creator info
        let creator = null;
        if (toolData.creatorId) {
          try {
            const creatorDoc = await dbAdmin.collection('users').doc(toolData.creatorId).get();
            if (creatorDoc.exists) {
              const creatorData = creatorDoc.data();
              creator = {
                id: creatorDoc.id,
                name: creatorData?.fullName || 'Unknown',
                avatar: creatorData?.photoURL || null,
              };
            }
          } catch {
            // Silently ignore creator fetch errors - not critical to search results
            logger.warn(
      `Failed to fetch creator info at /api/feed/search`
    );
          }
        }

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
