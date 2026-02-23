import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import type * as admin from 'firebase-admin';
import { logger } from "@/lib/logger";
import { validateSecureSpaceAccess } from "@/lib/secure-firebase-queries";
import { withOptionalAuth, getUser, ResponseFormatter } from '@/lib/middleware';

// Helper function to safely convert Firestore timestamp to Date
function toDateSafe(timestamp: unknown): Date | null {
  if (!timestamp) return null;
  if (typeof timestamp === 'string') return new Date(timestamp);
  const maybeTs = timestamp as { toDate?: () => Date };
  if (maybeTs && typeof maybeTs.toDate === 'function') return maybeTs.toDate();
  if (timestamp instanceof Date) return timestamp;
  return null;
}

const SearchUsersSchema = z.object({
  query: z.string().max(100).optional(), // Optional for browse mode
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  userType: z.enum(['student', 'faculty', 'admin']).optional(),
  major: z.string().optional(),
  graduationYear: z.coerce.number().optional(),
  spaceId: z.string().optional(), // Filter to users in a specific space
  sortBy: z.enum(['relevance', 'recent', 'alphabetical']).default('relevance'),
});

const db = dbAdmin;

export const POST = withOptionalAuth(async (
  request: Request,
  _context: unknown,
  respond: typeof ResponseFormatter
) => {
  // Optional auth: get user if authenticated, null otherwise
  const user = getUser(request as import("next/server").NextRequest);
  const userId = user?.uid || null;
  const campusId = user?.campusId || 'ub-buffalo'; // Default campus for public

  const body = await request.json();
  const searchParams = SearchUsersSchema.parse(body);
  const { query, limit, offset, userType, major, graduationYear, spaceId, sortBy } = searchParams;

  // Get viewer's connections for privacy checks (only if authenticated)
  const viewerConnectionIds = new Set<string>();
  if (userId) {
    try {
      const connectionsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('connections')
        .where('status', '==', 'connected')
        .get();
      connectionsSnapshot.docs.forEach(doc => viewerConnectionIds.add(doc.id));
    } catch {
      // Continue without connections - will be conservative with privacy
    }
  }

  interface RawUserDoc {
    id: string;
    privacy?: { profileVisibility?: string; bioVisibility?: string; academicVisibility?: string };
    fullName?: string;
    handle?: string;
    bio?: string;
    academic?: { major?: string; graduationYear?: number; school?: string };
    isVerified?: boolean;
    lastLoginAt?: unknown;
    createdAt?: unknown;
    userType?: string;
    photoURL?: string;
    [key: string]: unknown;
  }

  let usersToSearch: RawUserDoc[] = [];

  // If searching within a specific space, get space members first
  if (spaceId) {
    // Validate space access (campus isolation + active) - only if authenticated
    if (userId) {
      const validation = await validateSecureSpaceAccess(spaceId, userId);
      if (!validation.isValid) {
        return respond.error(validation.error || 'Access denied', 'FORBIDDEN');
      }
    }
    try {
      // campusId filter omitted — single-field index is exempted (FAILED_PRECONDITION).
      // spaceId is selective; campus isolation enforced in-memory below.
      const membersSnapshot = await db
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('isActive', '==', true)
        .limit(200)
        .get();

      const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);

      // Get user documents for these members
      if (memberIds.length > 0) {
        // Firestore 'in' queries are limited to 10 items, so batch them
        const batches = [];
        for (let i = 0; i < memberIds.length; i += 10) {
          const batch = memberIds.slice(i, i + 10);
          const batchQuery = dbAdmin.collection('users').where('__name__', 'in', batch.map(id => dbAdmin.collection('users').doc(id)));
          batches.push(batchQuery.get());
        }

        const batchResults = await Promise.all(batches);
        for (const snapshot of batchResults) {
          for (const doc of snapshot.docs) {
            usersToSearch.push({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as RawUserDoc);
          }
        }
      }
    } catch (error) {
      logger.warn(
        `Failed to fetch space members at /api/users/search`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  } else {
    // Search all users with basic filters.
    // campusId filter omitted — single-field index is exempted (FAILED_PRECONDITION).
    // Campus isolation enforced in-memory after fetch.
    let usersQuery: admin.firestore.Query<admin.firestore.DocumentData> = dbAdmin.collection('users');

    if (userType) {
      usersQuery = usersQuery.where('userType', '==', userType);
    }

    if (major) {
      usersQuery = usersQuery.where('academic.major', '==', major);
    }

    if (graduationYear) {
      usersQuery = usersQuery.where('academic.graduationYear', '==', graduationYear);
    }

    const usersSnapshot = await usersQuery.get();
    usersToSearch = usersSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as RawUserDoc));
  }

  const users = [];
  const queryLower = (query || '').toLowerCase();
  const isBrowseMode = !query || query.length < 2;

  // Process each user and apply text search + privacy filters
  for (const userData of usersToSearch) {
    // In-memory campus isolation (campusId Firestore filter is exempted from index)
    if (userData.campusId && userData.campusId !== campusId) continue;

    // SECURITY: Enforce privacy levels
    const profileVisibility = userData.privacy?.profileVisibility || 'public';
    const isOwnProfile = userData.id === userId;
    const isConnected = viewerConnectionIds.has(userData.id);

    // Skip based on privacy level
    if (!isOwnProfile) {
      if (profileVisibility === 'private') {
        continue;
      }
      if (profileVisibility === 'connections' && !isConnected) {
        continue;
      }
    }

    // Text matching (skip in browse mode - include all users)
    const fullName = (userData.fullName || '').toLowerCase();
    const handle = (userData.handle || '').toLowerCase();
    const bio = (userData.bio || '').toLowerCase();
    const userMajor = (userData.academic?.major || '').toLowerCase();

    let nameMatch = false;
    let handleMatch = false;
    let bioMatch = false;
    let majorMatch = false;

    if (!isBrowseMode) {
      nameMatch = fullName.includes(queryLower);
      handleMatch = handle.includes(queryLower);
      bioMatch = bio.includes(queryLower);
      majorMatch = userMajor.includes(queryLower);

      if (!nameMatch && !handleMatch && !bioMatch && !majorMatch) {
        continue;
      }
    }

    // Calculate relevance score
    let relevanceScore = 0;
    if (!isBrowseMode) {
      if (handleMatch) relevanceScore += handle === queryLower ? 100 : 90;
      if (nameMatch) relevanceScore += fullName === queryLower ? 95 : 80;
      if (bioMatch) relevanceScore += 50;
      if (majorMatch) relevanceScore += 40;
    }

    // Boost verified users
    if (userData.isVerified) relevanceScore += 20;

    // Boost active users (approximated by recent login)
    const lastLoginDate = toDateSafe(userData.lastLoginAt);
    const daysSinceLogin = lastLoginDate
      ? (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    if (daysSinceLogin < 7) relevanceScore += 15;
    else if (daysSinceLogin < 30) relevanceScore += 5;

    // Check if there's an existing connection (only if authenticated)
    let connectionStatus = 'none';
    if (userId) {
      try {
        const connectionDoc = await db
          .collection('users')
          .doc(userId)
          .collection('connections')
          .doc(userData.id)
          .get();

        if (connectionDoc.exists) {
          connectionStatus = connectionDoc.data()?.status || 'connected';
        }
      } catch (error) {
        logger.warn(
          `Failed to check connection status at /api/users/search`,
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    }

    // Get mutual spaces count (only if authenticated)
    let mutualSpacesCount = 0;
    if (userId) {
      try {
        if (spaceId) {
          mutualSpacesCount = 1;
        } else {
          // campusId filter omitted — single-field index is exempted (FAILED_PRECONDITION).
          // userId is selective enough; mutual spaces count only used for ranking.
          const currentUserSpacesSnapshot = await db
            .collection('spaceMembers')
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .limit(200)
            .get();
          const currentUserSpaceIds = currentUserSpacesSnapshot.docs
            .map(doc => doc.data().spaceId)
            .filter(Boolean);

          const otherUserSpacesSnapshot = await db
            .collection('spaceMembers')
            .where('userId', '==', userData.id)
            .where('isActive', '==', true)
            .limit(200)
            .get();
          const otherUserSpaceIds = otherUserSpacesSnapshot.docs
            .map(doc => doc.data().spaceId)
            .filter(Boolean);

          mutualSpacesCount = currentUserSpaceIds.filter(id => otherUserSpaceIds.includes(id)).length;
        }
      } catch (error) {
        logger.warn(
          `Failed to calculate mutual spaces at /api/users/search`,
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    }

    users.push({
      id: userData.id,
      fullName: userData.fullName,
      handle: userData.handle,
      photoURL: userData.photoURL || null,
      bio: userData.bio,
      userType: userData.userType,
      academic: {
        major: userData.academic?.major || null,
        graduationYear: userData.academic?.graduationYear || null,
        school: userData.academic?.school || null,
      },
      isVerified: userData.isVerified || false,
      connectionStatus,
      mutualSpacesCount,
      createdAt: toDateSafe(userData.createdAt)?.toISOString() || new Date().toISOString(),
      lastActive: toDateSafe(userData.lastLoginAt)?.toISOString() || null,
      relevanceScore,
      highlights: {
        fullName: nameMatch ? [fullName] : [],
        handle: handleMatch ? [handle] : [],
        bio: bioMatch && userData.privacy?.bioVisibility !== 'private' ? [bio.substring(
          Math.max(0, bio.indexOf(queryLower) - 30),
          Math.min(bio.length, bio.indexOf(queryLower) + queryLower.length + 30)
        )] : [],
        major: majorMatch && userData.privacy?.academicVisibility !== 'private' ? [userMajor] : []
      }
    });
  }

  // Sort results
  users.sort((a, b) => {
    switch (sortBy) {
      case 'recent': {
        const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return bTime - aTime;
      }
      case 'alphabetical':
        return (a.fullName || '').localeCompare(b.fullName || '');
      case 'relevance':
      default:
        if (b.mutualSpacesCount !== a.mutualSpacesCount) {
          return b.mutualSpacesCount - a.mutualSpacesCount;
        }
        return b.relevanceScore - a.relevanceScore;
    }
  });

  // Apply pagination
  const paginatedUsers = users.slice(offset, offset + limit);

  return respond.success({
    users: paginatedUsers,
    total: users.length,
    hasMore: users.length > offset + limit,
    pagination: {
      limit,
      offset,
      nextOffset: users.length > offset + limit ? offset + limit : null,
    },
    query: {
      ...searchParams,
      executedAt: new Date().toISOString(),
    }
  });
});
