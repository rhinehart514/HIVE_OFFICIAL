import { type NextRequest } from 'next/server';
// Use admin SDK methods since we're in an API route
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { logger } from "@/lib/logger";
import {
  getPrivacySettings,
  getConnectionType,
  ConnectionType
} from '@/lib/profile-security';
import { getServerProfileRepository } from '@hive/core/server';

// Space recommendation interface
interface SpaceRecommendation {
  spaceId: string;
  spaceName: string;
  spaceDescription: string;
  spaceType: string;
  memberCount: number;
  isActive: boolean;
  matchScore: number;
  matchReasons: string[];
  commonMembers: number;
  recentActivity: number;
  tags: string[];
  recommendationType: 'similar_interests' | 'friend_activity' | 'trending' | 'new_spaces' | 'academic_match';
}

function getSpaceMemberCount(space: Record<string, unknown>): number {
  const spaceMetrics = space.metrics as Record<string, unknown> | undefined;
  return (
    (spaceMetrics?.memberCount as number | undefined) ??
    (space.memberCount as number | undefined) ??
    (spaceMetrics?.activeMembers as number | undefined) ??
    0
  );
}

// GET - Get space recommendations for user
export const GET = withAuthAndErrors(async (request: NextRequest, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  // Check if user has opted out of discovery
  const privacySettings = await getPrivacySettings(userId);
  if (!privacySettings.discoveryParticipation) {
    return respond.success({
      recommendations: [],
      totalAvailable: 0,
      currentMemberships: 0,
      recommendationType: 'opted_out',
      message: 'Discovery recommendations disabled in privacy settings'
    });
  }

  const { searchParams } = new URL(request.url);
  const limit_param = parseInt(searchParams.get('limit') || '10');
  const type = searchParams.get('type') || 'all'; // all, similar_interests, trending, new_spaces

  // Get user's current memberships
  const currentMembershipsQuery = dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('campusId', '==', campusId)
    .where('isActive', '==', true);

  const currentMembershipsSnapshot = await currentMembershipsQuery.get();
  const currentSpaceIds = currentMembershipsSnapshot.docs
    .map((doc) => doc.data().spaceId)
    .filter(Boolean);

  // Try DDD repository for profile data (interests, connections)
  const profileRepository = getServerProfileRepository();
  const profileResult = await profileRepository.findById(userId);

  let dddProfileData: {
    interests: string[];
    major: string | undefined;
    connectionCount: number;
    spaceCount: number;
  } | null = null;

  if (profileResult.isSuccess) {
    const profile = profileResult.getValue();
    dddProfileData = {
      interests: profile.interests,
      major: profile.major,
      connectionCount: profile.connectionCount,
      spaceCount: profile.spaces.length,
    };
    logger.debug('Using DDD profile for recommendations', { userId, interestCount: profile.interests.length });
  }

  // Get user profile for interest matching (fallback/supplement)
  const userDoc = await dbAdmin.collection('users').doc(userId).get();
  const userData = userDoc.exists ? (userDoc.data() ?? null) : null;

  // Merge DDD interests with Firestore interests for better matching
  if (dddProfileData?.interests.length && userData) {
    const mergedInterests = [...new Set([
      ...(dddProfileData.interests || []),
      ...((userData.interests as string[]) || [])
    ])];
    (userData as Record<string, unknown>).interests = mergedInterests;
  }

  // Get all available spaces (excluding current memberships) with campus isolation
  const allSpacesQuery = dbAdmin.collection('spaces')
    .where('campusId', '==', campusId)
    .where('status', '==', 'active')
    .orderBy('metrics.memberCount', 'desc')
    .limit(100); // Limit for performance

  const allSpacesSnapshot = await allSpacesQuery.get();
  const availableSpaces = allSpacesSnapshot.docs
    .filter(doc => !currentSpaceIds.includes(doc.id))
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  // Generate recommendations based on type
  const recommendations: SpaceRecommendation[] = [];

  if (type === 'all' || type === 'similar_interests') {
    const interestRecommendations = await generateInterestBasedRecommendations(
      availableSpaces,
      userData,
      currentSpaceIds
    );
    recommendations.push(...interestRecommendations);
  }

  if (type === 'all' || type === 'trending') {
    const trendingRecommendations = await generateTrendingRecommendations(
      availableSpaces,
      currentSpaceIds
    );
    recommendations.push(...trendingRecommendations);
  }

  if (type === 'all' || type === 'new_spaces') {
    const newSpaceRecommendations = await generateNewSpaceRecommendations(
      availableSpaces,
      currentSpaceIds
    );
    recommendations.push(...newSpaceRecommendations);
  }

  // Add friend activity recommendations
  const friendActivityRecommendations = await generateFriendActivityRecommendations(
    availableSpaces,
    userId,
    campusId,
    currentSpaceIds
  );
  recommendations.push(...friendActivityRecommendations);

  // Add academic match recommendations
  const academicRecommendations = await generateAcademicRecommendations(
    availableSpaces,
    userData,
    currentSpaceIds
  );
  recommendations.push(...academicRecommendations);

  // Remove duplicates and sort by match score
  const uniqueRecommendations = recommendations
    .reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.spaceId === current.spaceId);
      if (existingIndex >= 0) {
        // Keep the one with higher match score
        if (current.matchScore > acc[existingIndex].matchScore) {
          acc[existingIndex] = current;
        }
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as SpaceRecommendation[])
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit_param);

  return respond.success({
    recommendations: uniqueRecommendations,
    totalAvailable: availableSpaces.length,
    currentMemberships: currentSpaceIds.length,
    recommendationType: type,
    // Include DDD profile context for recommendations
    profile: dddProfileData ? {
      interestCount: dddProfileData.interests.length,
      connectionCount: dddProfileData.connectionCount,
      currentSpaceCount: dddProfileData.spaceCount,
    } : null
  });
});

// Helper function to generate interest-based recommendations
async function generateInterestBasedRecommendations(
  availableSpaces: Record<string, unknown>[],
  userData: Record<string, unknown> | null,
  _currentSpaceIds: string[]
): Promise<SpaceRecommendation[]> {
  const interests = userData?.interests as string[] | undefined;
  if (!interests || interests.length === 0) {
    return [];
  }

  const userInterests = interests.map((interest: string) => interest.toLowerCase());

  return availableSpaces
    .map(space => {
      const spaceTags = ((space.tags as string[]) || []).map((tag: string) => tag.toLowerCase());
      const spaceKeywords = ((space.name as string || '') + ' ' + (space.description as string || '')).toLowerCase().split(/\s+/);

      // Calculate interest match score
      const tagMatches = spaceTags.filter((tag: string) => userInterests.includes(tag)).length;
      const keywordMatches = spaceKeywords.filter((keyword: string) =>
        userInterests.some((interest: string) => interest.includes(keyword) || keyword.includes(interest))
      ).length;

      const matchScore = (tagMatches * 2) + keywordMatches;

      if (matchScore > 0) {
        const matchReasons = [];
        if (tagMatches > 0) matchReasons.push(`${tagMatches} matching interests`);
        if (keywordMatches > 0) matchReasons.push(`Related to your interests`);

        return {
          spaceId: space.id,
          spaceName: space.name,
          spaceDescription: space.description,
          spaceType: space.type || 'general',
          memberCount: getSpaceMemberCount(space),
          isActive: space.status === 'active',
          matchScore: Math.min(100, matchScore * 10),
          matchReasons,
          commonMembers: 0,
          recentActivity: space.recentActivity || 0,
          tags: space.tags || [],
          recommendationType: 'similar_interests' as const
        };
      }

      return null;
    })
    .filter(Boolean) as SpaceRecommendation[];
}

// Helper function to generate trending recommendations
async function generateTrendingRecommendations(
  availableSpaces: Record<string, unknown>[],
  _currentSpaceIds: string[]
): Promise<SpaceRecommendation[]> {
  return availableSpaces
    .filter(space => getSpaceMemberCount(space) > 10) // Only spaces with decent activity
    .sort((a, b) => ((b.recentActivity as number) || 0) - ((a.recentActivity as number) || 0))
    .slice(0, 5)
    .map(space => ({
      spaceId: space.id as string,
      spaceName: space.name as string,
      spaceDescription: space.description as string,
      spaceType: (space.type as string) || 'general',
      memberCount: getSpaceMemberCount(space),
      isActive: space.status === 'active',
      matchScore: Math.min(100, ((space.recentActivity as number) || 0) / 10),
      matchReasons: ['Trending on campus', 'High recent activity'],
      commonMembers: 0,
      recentActivity: (space.recentActivity as number) || 0,
      tags: (space.tags as string[]) || [],
      recommendationType: 'trending' as const
    }));
}

// Helper function to generate new space recommendations
async function generateNewSpaceRecommendations(
  availableSpaces: Record<string, unknown>[],
  _currentSpaceIds: string[]
): Promise<SpaceRecommendation[]> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return availableSpaces
    .filter(space => {
      const createdAtValue = space.createdAt as { toDate?: () => Date } | string | undefined;
      const createdAt = (createdAtValue && typeof createdAtValue === 'object' && 'toDate' in createdAtValue)
        ? createdAtValue.toDate?.()
        : (createdAtValue ? new Date(createdAtValue as string) : null);
      if (!createdAt) {
        return false;
      }
      return createdAt > oneWeekAgo;
    })
    .sort((a, b) => {
      const aCreatedAt = a.createdAt as { toDate?: () => Date } | string | undefined;
      const bCreatedAt = b.createdAt as { toDate?: () => Date } | string | undefined;
      const aDate = (aCreatedAt && typeof aCreatedAt === 'object' && 'toDate' in aCreatedAt)
        ? aCreatedAt.toDate?.()
        : (aCreatedAt ? new Date(aCreatedAt as string) : null);
      const bDate = (bCreatedAt && typeof bCreatedAt === 'object' && 'toDate' in bCreatedAt)
        ? bCreatedAt.toDate?.()
        : (bCreatedAt ? new Date(bCreatedAt as string) : null);
      return (bDate ? bDate.getTime() : 0) - (aDate ? aDate.getTime() : 0);
    })
    .slice(0, 3)
    .map(space => ({
      spaceId: space.id as string,
      spaceName: space.name as string,
      spaceDescription: space.description as string,
      spaceType: (space.type as string) || 'general',
      memberCount: getSpaceMemberCount(space),
      isActive: space.status === 'active',
      matchScore: 60,
      matchReasons: ['New space', 'Recently created'],
      commonMembers: 0,
      recentActivity: (space.recentActivity as number) || 0,
      tags: (space.tags as string[]) || [],
      recommendationType: 'new_spaces' as const
    }));
}

// Helper function to generate friend activity recommendations
async function generateFriendActivityRecommendations(
  availableSpaces: Record<string, unknown>[],
  userId: string,
  campusId: string,
  currentSpaceIds: string[]
): Promise<SpaceRecommendation[]> {
  try {
    // Get user's current space memberships to find "friends" (other members)
    const currentMembershipsQuery = dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true);

    const currentMembershipsSnapshot = await currentMembershipsQuery.get();
    const userSpaceIds = currentMembershipsSnapshot.docs.map(doc => doc.data().spaceId);

    // Get other members from user's spaces
    const friendsQuery = dbAdmin
      .collection('spaceMembers')
      .where('spaceId', 'in', userSpaceIds.slice(0, 10)) // Limit for performance
      .where('campusId', '==', campusId)
      .where('isActive', '==', true);

    const friendsSnapshot = await friendsQuery.get();
    const potentialFriendIds = [...new Set(friendsSnapshot.docs
      .map(doc => doc.data().userId)
      .filter(id => id !== userId))];

    // Filter out users in ghost mode (unless they're actual friends)
    const friendIds = [];
    for (const friendId of potentialFriendIds) {
      const privacySettings = await getPrivacySettings(friendId);
      if (!privacySettings.ghostMode || await getConnectionType(userId, friendId) === ConnectionType.FRIEND) {
        friendIds.push(friendId);
      }
    }

    if (friendIds.length === 0) {
      return [];
    }

    // Get spaces where friends are active
    const friendMembershipsQuery = dbAdmin
      .collection('spaceMembers')
      .where('userId', 'in', friendIds.slice(0, 10)) // Limit for performance
      .where('campusId', '==', campusId)
      .where('isActive', '==', true);

    const friendMembershipsSnapshot = await friendMembershipsQuery.get();
    const friendSpaceIds = friendMembershipsSnapshot.docs
      .map(doc => doc.data().spaceId)
      .filter(Boolean);

    // Count common members per space
    const spaceFriendCounts: Record<string, number> = {};
    friendSpaceIds.forEach(spaceId => {
      if (!currentSpaceIds.includes(spaceId)) {
        spaceFriendCounts[spaceId] = (spaceFriendCounts[spaceId] || 0) + 1;
      }
    });

    // Generate recommendations based on friend activity
    return availableSpaces
      .filter(space => spaceFriendCounts[space.id as string] > 0)
      .map(space => ({
        spaceId: space.id as string,
        spaceName: space.name as string,
        spaceDescription: space.description as string,
        spaceType: (space.type as string) || 'general',
        memberCount: getSpaceMemberCount(space),
        isActive: space.status === 'active',
        matchScore: Math.min(100, spaceFriendCounts[space.id as string] * 15),
        matchReasons: [`${spaceFriendCounts[space.id as string]} people you know are members`],
        commonMembers: spaceFriendCounts[space.id as string],
        recentActivity: (space.recentActivity as number) || 0,
        tags: (space.tags as string[]) || [],
        recommendationType: 'friend_activity' as const
      }))
      .sort((a, b) => b.commonMembers - a.commonMembers)
      .slice(0, 5);
  } catch (error) {
    logger.error(
      `Error generating friend activity recommendations at /api/profile/spaces/recommendations`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return [];
  }
}

// Helper function to generate academic recommendations
async function generateAcademicRecommendations(
  availableSpaces: Record<string, unknown>[],
  userData: Record<string, unknown> | null,
  _currentSpaceIds: string[]
): Promise<SpaceRecommendation[]> {
  if (!userData?.major && !userData?.academicYear) {
    return [];
  }

  const userMajor = (userData.major as string | undefined)?.toLowerCase();
  const userYear = userData.academicYear as string | undefined;

  return availableSpaces
    .filter(space => {
      const spaceName = ((space.name as string) || '').toLowerCase();
      const spaceDescription = ((space.description as string) || '').toLowerCase();
      const spaceType = (space.type as string | undefined)?.toLowerCase();

      // Check for academic relevance
      const isMajorMatch = userMajor && (
        spaceName.includes(userMajor) ||
        spaceDescription.includes(userMajor) ||
        ((space.tags as string[]) || []).some((tag: string) => tag.toLowerCase().includes(userMajor))
      );

      const isYearMatch = userYear && (
        spaceName.includes(userYear) ||
        spaceDescription.includes(userYear)
      );

      const isAcademicType = spaceType === 'academic' || spaceType === 'study';

      return isMajorMatch || isYearMatch || isAcademicType;
    })
    .map(space => {
      const matchReasons: string[] = [];
      const spaceName = ((space.name as string) || '').toLowerCase();
      const spaceDescription = ((space.description as string) || '').toLowerCase();

      if (userMajor && (spaceName.includes(userMajor) || spaceDescription.includes(userMajor))) {
        matchReasons.push(`Matches your major: ${userData.major}`);
      }

      if (userYear && (spaceName.includes(userYear) || spaceDescription.includes(userYear))) {
        matchReasons.push(`Relevant to ${userYear}s`);
      }

      if (space.type === 'academic' || space.type === 'study') {
        matchReasons.push('Academic focus');
      }

      return {
        spaceId: space.id as string,
        spaceName: space.name as string,
        spaceDescription: space.description as string,
        spaceType: (space.type as string) || 'general',
        memberCount: getSpaceMemberCount(space),
        isActive: space.status === 'active',
        matchScore: matchReasons.length * 25,
        matchReasons,
        commonMembers: 0,
        recentActivity: (space.recentActivity as number) || 0,
        tags: (space.tags as string[]) || [],
        recommendationType: 'academic_match' as const
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}
