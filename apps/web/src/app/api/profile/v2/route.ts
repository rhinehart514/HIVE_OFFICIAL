import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/profile/v2
 * Enhanced profile data — merges users/{userId} and profiles/{userId}
 * into a single response. Returns defaults if profile doc doesn't exist.
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  // Fetch user and profile docs in parallel
  const [userDoc, profileDoc] = await Promise.all([
    dbAdmin.collection('users').doc(userId).get(),
    dbAdmin.collection('profiles').doc(userId).get(),
  ]);

  if (!userDoc.exists) {
    return respond.error('User not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  const userData = userDoc.data()!;
  const profileData = profileDoc.exists ? profileDoc.data()! : {};

  // Normalize timestamps
  const createdAt = userData.createdAt?.toDate?.()?.toISOString() ||
    (typeof userData.createdAt === 'string' ? userData.createdAt : undefined);

  return respond.success({
    uid: userId,
    email: (userData.email as string) || '',
    displayName: (userData.displayName as string) || (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : ''),
    handle: (userData.handle as string) || (profileData.handle as string) || '',
    campusId: (userData.campusId as string) || '',
    avatarUrl: (profileData.avatarUrl as string) || (userData.avatarUrl as string) || (userData.profilePhoto as string) || '',
    interests: (profileData.interests as string[]) || [],
    yearOfStudy: (profileData.yearOfStudy as string) || '',
    housing: (profileData.housing as string) || '',
    builderLevel: (profileData.builderLevel as string) || 'beginner',
    xp: (profileData.xp as number) || 0,
    bio: (profileData.bio as string) || (userData.bio as string) || '',
    firstName: (userData.firstName as string) || '',
    lastName: (userData.lastName as string) || '',
    createdAt,
  });
});

export const GET = withCache(_GET, 'PRIVATE');
