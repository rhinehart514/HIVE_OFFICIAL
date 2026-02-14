import { z } from "zod";
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { getServerSpaceRepository, type EnhancedSpace } from "@hive/core/server";
import { logger } from "@/lib/logger";
import { withCache } from '../../../../lib/cache-headers';

/**
 * Zod schema for recommended query params validation
 */
const RecommendedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  includePrivate: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
});

/**
 * Zod schema for POST body validation (used by onboarding)
 */
const RecommendedBodySchema = z.object({
  interests: z.array(z.string()).optional().default([]),
  limit: z.number().min(1).max(50).optional().default(20),
});

/**
 * SPEC.md Behavioral Psychology Algorithm:
 * Score = (AnxietyRelief × 0.4) + (SocialProof × 0.3) + (InsiderAccess × 0.3)
 */
interface BehavioralSpace {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  memberCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  anxietyReliefScore: number;
  socialProofScore: number;
  insiderAccessScore: number;
  recommendationScore: number;
  joinToActiveRate: number;
  mutualConnections: number;
  friendsInSpace: number;
}

/**
 * GET /api/spaces/recommended - Get personalized space recommendations
 *
 * Uses behavioral psychology algorithm from SPEC.md:
 * - Anxiety Relief: Spaces that address common student anxieties
 * - Social Proof: Spaces with friends/connections
 * - Insider Access: Exclusive/invite-only spaces
 */
const _GET = withAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);
  const { searchParams } = new URL(request.url);

  // Validate query params
  const parseResult = RecommendedQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );

  if (!parseResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: 400,
      details: parseResult.error.flatten()
    });
  }

  const { limit } = parseResult.data;

  try {
    // Get user profile for personalization (optional - graceful fallback)
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    const userData = userDoc.data() ?? {}; // Empty object if no profile

    // Get user's connections for social proof
    // SCALING FIX: Add limit to prevent loading thousands of connections
    const connectionsSnapshot = await dbAdmin
      .collection('connections')
      .where('userId', '==', userId)
      .where('status', '==', 'connected')
      .limit(500)
      .get();
    const connectionIds = connectionsSnapshot.docs.map(doc => doc.data().connectedUserId);

    // Get user's friends
    // SCALING FIX: Add limit to prevent loading thousands of friends
    const friendsSnapshot = await dbAdmin
      .collection('friends')
      .where('userId', '==', userId)
      .where('status', '==', 'accepted')
      .limit(500)
      .get();
    const friendIds = friendsSnapshot.docs.map(doc => doc.data().friendId);

    // Use DDD repository to get spaces
    const spaceRepo = getServerSpaceRepository();
    const spacesResult = await spaceRepo.findByCampus(campusId, 100);

    if (spacesResult.isFailure) {
      logger.error('Failed to load spaces for recommendations', { error: spacesResult.error });
      return respond.error("Failed to generate recommendations", "INTERNAL_ERROR", { status: 500 });
    }

    const allSpaces = spacesResult.getValue();

    // Get user's spaces to check if they're a leader (for stealth mode visibility)
    // SCALING FIX: Use lightweight membership query instead of loading full spaces
    const membershipsResult = await spaceRepo.findUserMemberships(userId);
    const leaderSpaceIds = new Set<string>();
    if (membershipsResult.isSuccess) {
      for (const membership of membershipsResult.getValue()) {
        if (membership.role === 'owner' || membership.role === 'admin') {
          leaderSpaceIds.add(membership.spaceId);
        }
      }
    }

    // Filter out stealth spaces (unless user is a leader of that space)
    const visibleSpaces = allSpaces.filter(space => {
      if (space.isLive) return true;
      if (space.isStealth && leaderSpaceIds.has(space.spaceId.value)) return true;
      return false;
    });

    const scoredSpaces: BehavioralSpace[] = [];

    // PERFORMANCE FIX: Batch fetch all member data instead of N+1 queries
    // Get all space IDs (only for visible spaces)
    const spaceIds = visibleSpaces.map(s => s.spaceId.value);

    // Batch fetch member counts per space using a single aggregation query
    // Firestore doesn't support GROUP BY, so we use a different approach:
    // Fetch all active members for all spaces in batches, then group client-side
    const membersBySpace = new Map<string, string[]>();

    // Firestore 'in' queries are limited to 30 items, so chunk the space IDs
    const BATCH_SIZE = 30;
    for (let i = 0; i < spaceIds.length; i += BATCH_SIZE) {
      const batchIds = spaceIds.slice(i, i + BATCH_SIZE);
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', 'in', batchIds)
        .where('isActive', '==', true)
        .select('spaceId', 'userId') // Only fetch needed fields
        .get();

      for (const doc of membersSnapshot.docs) {
        const data = doc.data();
        const spaceId = data.spaceId;
        if (!membersBySpace.has(spaceId)) {
          membersBySpace.set(spaceId, []);
        }
        membersBySpace.get(spaceId)!.push(data.userId);
      }
    }

    // Calculate behavioral scores for each space (no more N+1!)
    for (const space of visibleSpaces) {
      const memberIds = membersBySpace.get(space.spaceId.value) || [];

      // Calculate mutual connections
      const mutualConnections = memberIds.filter(id => connectionIds.includes(id)).length;
      const friendsInSpace = memberIds.filter(id => friendIds.includes(id)).length;

      // Calculate behavioral scores
      const anxietyReliefScore = calculateAnxietyReliefScore(space, userData);
      const socialProofScore = calculateSocialProofScore(
        mutualConnections,
        friendsInSpace,
        space.memberCount
      );
      const insiderAccessScore = calculateInsiderAccessScore(space);

      // Overall recommendation score (SPEC.md formula)
      const recommendationScore =
        (anxietyReliefScore * 0.4) +
        (socialProofScore * 0.3) +
        (insiderAccessScore * 0.3);

      // Calculate join-to-active rate
      const joinToActiveRate = calculateJoinToActiveRate(space.memberCount, memberIds.length);

      scoredSpaces.push({
        id: space.spaceId.value,
        name: space.name.value,
        slug: space.slug?.value,
        description: space.description.value,
        category: space.category.value,
        memberCount: space.memberCount,
        isVerified: space.isVerified,
        isPrivate: !space.isPublic,
        anxietyReliefScore,
        socialProofScore,
        insiderAccessScore,
        recommendationScore,
        joinToActiveRate,
        mutualConnections,
        friendsInSpace
      });
    }

    // Sort by recommendation score
    scoredSpaces.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Categorize spaces for SPEC.md sections
    const panicRelief = scoredSpaces
      .filter(s => s.anxietyReliefScore > 0.6)
      .slice(0, 5);

    const whereYourFriendsAre = scoredSpaces
      .filter(s => s.socialProofScore > 0.5 && (s.friendsInSpace > 0 || s.mutualConnections > 2))
      .slice(0, 5);

    const insiderAccess = scoredSpaces
      .filter(s => s.insiderAccessScore > 0.7)
      .slice(0, 5);

    return respond.success({
      panicRelief,
      whereYourFriendsAre,
      insiderAccess,
      recommendations: scoredSpaces.slice(0, limit),
      meta: {
        totalSpaces: visibleSpaces.length,
        userConnections: connectionIds.length,
        userFriends: friendIds.length
      }
    });

  } catch (error) {
    logger.error('Error generating space recommendations', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    return respond.error("Failed to generate recommendations", "INTERNAL_ERROR", { status: 500 });
  }
});

/**
 * POST /api/spaces/recommended - Get personalized recommendations based on interests
 *
 * Used by onboarding flow to get recommendations based on selected interests
 */
export const POST = withAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return respond.error('Invalid JSON body', 'VALIDATION_ERROR', { status: 400 });
  }

  const parseResult = RecommendedBodySchema.safeParse(body);
  if (!parseResult.success) {
    return respond.error('Invalid request body', 'VALIDATION_ERROR', {
      status: 400,
      details: parseResult.error.flatten()
    });
  }

  const { interests, limit } = parseResult.data;

  try {
    // Get user profile for personalization
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    const userData = userDoc.data() ?? {};

    // Use DDD repository to get spaces
    const spaceRepo = getServerSpaceRepository();
    const spacesResult = await spaceRepo.findByCampus(campusId, 100);

    if (spacesResult.isFailure) {
      logger.error('Failed to load spaces for recommendations', { error: spacesResult.error });
      return respond.error("Failed to generate recommendations", "INTERNAL_ERROR", { status: 500 });
    }

    const allSpaces = spacesResult.getValue();

    // Filter to only live spaces (stealth spaces are hidden during onboarding)
    const visibleSpaces = allSpaces.filter(space => space.isLive);

    // Score spaces with interest matching
    const scoredSpaces = visibleSpaces.map(space => {
      const anxietyReliefScore = calculateAnxietyReliefScore(space, userData);
      const interestScore = calculateInterestScore(space, interests);
      const insiderAccessScore = calculateInsiderAccessScore(space);

      // Weighted score: interests heavily weighted for onboarding
      const recommendationScore =
        (interestScore * 0.5) +
        (anxietyReliefScore * 0.3) +
        (insiderAccessScore * 0.2);

      return {
        id: space.spaceId.value,
        name: space.name.value,
        slug: space.slug?.value,
        description: space.description.value,
        category: space.category.value,
        memberCount: space.memberCount,
        isVerified: space.isVerified,
        isPrivate: !space.isPublic,
        interestScore,
        recommendationScore,
      };
    });

    // Sort by recommendation score
    scoredSpaces.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Return top recommendations in the format onboarding expects
    return respond.success({
      spaces: scoredSpaces.slice(0, limit),
      meta: {
        totalSpaces: visibleSpaces.length,
        interestsMatched: interests.length
      }
    });

  } catch (error) {
    logger.error('Error generating interest-based recommendations', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      interests
    });
    return respond.error("Failed to generate recommendations", "INTERNAL_ERROR", { status: 500 });
  }
});

/**
 * Calculate interest matching score
 * Matches user interests against space name, description, and category
 */
function calculateInterestScore(space: EnhancedSpace, interests: string[]): number {
  if (!interests.length) return 0;

  let matchCount = 0;
  const spaceName = space.name.value.toLowerCase();
  const spaceDesc = space.description.value.toLowerCase();
  const spaceCategory = space.category.value.toLowerCase();

  for (const interest of interests) {
    const interestLower = interest.toLowerCase();
    // Check for matches in name, description, or category
    if (
      spaceName.includes(interestLower) ||
      spaceDesc.includes(interestLower) ||
      spaceCategory.includes(interestLower) ||
      interestLower.includes(spaceCategory)
    ) {
      matchCount++;
    }
  }

  // Return score from 0-1 based on match ratio
  return Math.min(matchCount / Math.max(interests.length, 1), 1);
}

/**
 * Calculate anxiety relief score based on space characteristics
 * Higher scores for spaces that address common student anxieties
 * Uses canonical categories: student_organizations, university_organizations, greek_life, campus_living, hive_exclusive
 */
function calculateAnxietyReliefScore(space: EnhancedSpace, user: Record<string, unknown>): number {
  let score = 0;
  const category = space.category.value;

  // Study stress relief - student orgs are the primary academic support
  if (category === 'student_organizations' || category === 'hive_exclusive') {
    score += 0.3;
  }

  // University resources for official support
  if (category === 'university_organizations') {
    score += 0.25;
  }

  // Community building - campus living and greek life
  if (category === 'campus_living' || category === 'greek_life') {
    score += 0.2;
  }

  // FOMO relief - trending or popular spaces
  if (space.memberCount > 50) {
    score += 0.2;
  }

  // Major-specific anxiety relief
  if (user.major && space.name.value.toLowerCase().includes((user.major as string).toLowerCase())) {
    score += 0.3;
  }

  return Math.min(score, 1);
}

/**
 * Calculate social proof score based on connections
 */
function calculateSocialProofScore(
  mutualConnections: number,
  friendsInSpace: number,
  totalMembers: number
): number {
  let score = 0;

  // Friends are highest signal
  if (friendsInSpace > 0) {
    score += Math.min(friendsInSpace * 0.2, 0.4);
  }

  // Connections are medium signal
  if (mutualConnections > 0) {
    score += Math.min(mutualConnections * 0.1, 0.3);
  }

  // Popular spaces have social proof
  if (totalMembers > 100) {
    score += 0.2;
  } else if (totalMembers > 50) {
    score += 0.1;
  }

  // Network effect bonus
  const networkRatio = (mutualConnections + friendsInSpace) / Math.max(totalMembers, 1);
  score += Math.min(networkRatio * 0.2, 0.2);

  return Math.min(score, 1);
}

/**
 * Calculate insider access score based on exclusivity
 * Uses canonical categories: student_organizations, university_organizations, greek_life, campus_living, hive_exclusive
 */
function calculateInsiderAccessScore(space: EnhancedSpace): number {
  let score = 0;

  // Smaller spaces feel more exclusive
  if (space.memberCount < 30) {
    score += 0.3;
  } else if (space.memberCount < 50) {
    score += 0.1;
  }

  // Greek life is inherently exclusive
  if (space.category.value === 'greek_life') {
    score += 0.3;
  }

  // Campus living spaces have natural exclusivity (dorm residents only)
  if (space.category.value === 'campus_living') {
    score += 0.2;
  }

  // Private spaces are exclusive
  if (!space.isPublic) {
    score += 0.4;
  }

  // Settings-based exclusivity
  if (space.settings.requireApproval) {
    score += 0.2;
  }

  return Math.min(score, 1);
}

/**
 * Calculate the join-to-active member conversion rate
 * SPEC.md target: 70% for optimal behavioral change
 */
function calculateJoinToActiveRate(totalMembers: number, activeMembers: number): number {
  const rate = activeMembers / Math.max(totalMembers, 1);
  return Math.max(0, Math.min(1, rate));
}

export const GET = withCache(_GET, 'SHORT');
