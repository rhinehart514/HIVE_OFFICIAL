import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import {
  computeLevel,
  getNextLevelThreshold,
  getLevelThreshold,
  LEVEL_THRESHOLDS,
  type BuilderLevel,
} from '@/lib/builder-xp';

// GET /api/tools/builder-profile - Returns builder level, XP, and progression info
export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);

  const userDoc = await dbAdmin.collection('users').doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};

  const xp = (userData.builderXp as number) || 0;
  const storedLevel = (userData.builderLevel as BuilderLevel) || undefined;
  const level = storedLevel || computeLevel(xp);

  const currentThreshold = getLevelThreshold(level);
  const nextThreshold = getNextLevelThreshold(level);

  return respond.success({
    level,
    levelLabel: currentThreshold.label,
    xp,
    currentLevelMinXp: currentThreshold.minXp,
    nextLevelXp: nextThreshold ? nextThreshold.minXp : null,
    nextLevelName: nextThreshold ? nextThreshold.label : null,
    xpToNextLevel: nextThreshold ? nextThreshold.minXp - xp : 0,
    progressPercent: nextThreshold
      ? Math.min(
          100,
          Math.round(
            ((xp - currentThreshold.minXp) /
              (nextThreshold.minXp - currentThreshold.minXp)) *
              100
          )
        )
      : 100,
    isMaxLevel: !nextThreshold,
    achievements: (userData.builderAchievements as string[]) || [],
  });
});
