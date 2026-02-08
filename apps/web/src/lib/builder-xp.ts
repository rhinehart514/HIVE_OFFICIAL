/**
 * Builder XP System
 *
 * Awards XP to tool creators based on activity.
 * Handles atomic increments, level computation, and daily caps.
 *
 * Level thresholds:
 *   Creator:   0 - 99 XP
 *   Builder:   100 - 499 XP
 *   Architect: 500 - 1999 XP
 *   Innovator: 2000+ XP
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';

export type BuilderLevel = 'creator' | 'builder' | 'architect' | 'innovator';

interface LevelThreshold {
  name: BuilderLevel;
  minXp: number;
  maxXp: number;
  label: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { name: 'creator', minXp: 0, maxXp: 99, label: 'Creator' },
  { name: 'builder', minXp: 100, maxXp: 499, label: 'Builder' },
  { name: 'architect', minXp: 500, maxXp: 1999, label: 'Architect' },
  { name: 'innovator', minXp: 2000, maxXp: Infinity, label: 'Innovator' },
];

export function computeLevel(xp: number): BuilderLevel {
  if (xp >= 2000) return 'innovator';
  if (xp >= 500) return 'architect';
  if (xp >= 100) return 'builder';
  return 'creator';
}

export function getLevelThreshold(level: BuilderLevel): LevelThreshold {
  return LEVEL_THRESHOLDS.find((t) => t.name === level)!;
}

export function getNextLevelThreshold(level: BuilderLevel): LevelThreshold | null {
  const index = LEVEL_THRESHOLDS.findIndex((t) => t.name === level);
  if (index < LEVEL_THRESHOLDS.length - 1) {
    return LEVEL_THRESHOLDS[index + 1];
  }
  return null;
}

/** Daily XP cap for usage-based XP (tool executions) */
const DAILY_USAGE_XP_CAP = 50;

interface AwardResult {
  newXp: number;
  level: BuilderLevel;
  leveledUp: boolean;
  newLevel?: BuilderLevel;
  capped?: boolean;
}

/**
 * Award XP to a user atomically.
 * Checks daily cap for usage-based XP, updates level if threshold crossed.
 */
export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  options?: { checkDailyCap?: boolean }
): Promise<AwardResult> {
  const userRef = dbAdmin.collection('users').doc(userId);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Daily cap check for usage XP
  if (options?.checkDailyCap) {
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    const dailyXpDate = userData.builderDailyXpDate as string | undefined;
    const dailyXpAwarded = (userData.builderDailyXpAwarded as number) || 0;

    if (dailyXpDate === today && dailyXpAwarded >= DAILY_USAGE_XP_CAP) {
      return {
        newXp: (userData.builderXp as number) || 0,
        level: (userData.builderLevel as BuilderLevel) || 'creator',
        leveledUp: false,
        capped: true,
      };
    }

    // Clamp amount to not exceed daily cap
    const remaining = DAILY_USAGE_XP_CAP - (dailyXpDate === today ? dailyXpAwarded : 0);
    amount = Math.min(amount, remaining);
    if (amount <= 0) {
      return {
        newXp: (userData.builderXp as number) || 0,
        level: (userData.builderLevel as BuilderLevel) || 'creator',
        leveledUp: false,
        capped: true,
      };
    }
  }

  // Atomic increment
  const updateData: Record<string, unknown> = {
    builderXp: admin.firestore.FieldValue.increment(amount),
  };

  if (options?.checkDailyCap) {
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    const dailyXpDate = userData.builderDailyXpDate as string | undefined;

    if (dailyXpDate === today) {
      updateData.builderDailyXpAwarded = admin.firestore.FieldValue.increment(amount);
    } else {
      updateData.builderDailyXpDate = today;
      updateData.builderDailyXpAwarded = amount;
    }
  }

  await userRef.update(updateData);

  // Read back new total to compute level
  const updatedDoc = await userRef.get();
  const updatedData = updatedDoc.data() || {};
  const newXp = (updatedData.builderXp as number) || 0;
  const oldLevel = (updatedData.builderLevel as BuilderLevel) || 'creator';
  const newLevel = computeLevel(newXp);

  const leveledUp = newLevel !== oldLevel;

  if (leveledUp) {
    await userRef.update({ builderLevel: newLevel });
    logger.info('[builder-xp] Level up', {
      userId,
      oldLevel,
      newLevel,
      xp: newXp,
    });
  }

  logger.info('[builder-xp] XP awarded', {
    userId,
    amount,
    reason,
    newXp,
    level: newLevel,
  });

  return {
    newXp,
    level: newLevel,
    leveledUp,
    ...(leveledUp ? { newLevel } : {}),
  };
}
