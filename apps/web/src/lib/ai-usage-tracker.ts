/**
 * AI Usage Tracker
 *
 * Enforces per-user daily generation limits.
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { logger } from './logger';

export const DAILY_GENERATION_LIMIT = 50;

export const USAGE_LIMITS = {
  free: DAILY_GENERATION_LIMIT,
  pro: DAILY_GENERATION_LIMIT,
  team: DAILY_GENERATION_LIMIT,
} as const;

export type UserTier = keyof typeof USAGE_LIMITS;

interface UsageRecord {
  generations: number;
  tokensUsed: number;
  lastGeneration: Timestamp | null;
  resetAt: Timestamp;
}

interface UserSubscription {
  tier: UserTier;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodEnd?: Timestamp;
}

function getCurrentDayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getDayEndTimestamp(): Timestamp {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Timestamp.fromDate(endOfDay);
}

export async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return 'free';

    const data = userDoc.data();
    const subscription = data?.subscription as UserSubscription | undefined;
    if (!subscription || subscription.status !== 'active') {
      return 'free';
    }

    return subscription.tier || 'free';
  } catch (error) {
    logger.error('Error getting user tier', { component: 'ai-usage-tracker' }, error instanceof Error ? error : undefined);
    return 'free';
  }
}

export async function getDailyUsage(userId: string): Promise<UsageRecord> {
  const dayKey = getCurrentDayKey();

  try {
    const usageDoc = await getDoc(doc(db, 'usage', userId, 'daily', dayKey));
    if (!usageDoc.exists()) {
      return {
        generations: 0,
        tokensUsed: 0,
        lastGeneration: null,
        resetAt: getDayEndTimestamp(),
      };
    }

    return usageDoc.data() as UsageRecord;
  } catch (error) {
    logger.error('Error getting daily usage', { component: 'ai-usage-tracker' }, error instanceof Error ? error : undefined);
    return {
      generations: 0,
      tokensUsed: 0,
      lastGeneration: null,
      resetAt: getDayEndTimestamp(),
    };
  }
}

export async function canGenerate(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  tier: UserTier;
  limit: number;
  resetAt: Date;
}> {
  const [tier, usage] = await Promise.all([
    getUserTier(userId),
    getDailyUsage(userId),
  ]);

  const limit = DAILY_GENERATION_LIMIT;
  const remaining = Math.max(0, limit - usage.generations);
  const allowed = usage.generations < limit;

  return {
    allowed,
    remaining,
    tier,
    limit,
    resetAt: usage.resetAt.toDate(),
  };
}

export async function recordGeneration(
  userId: string,
  tokensUsed: number = 0
): Promise<void> {
  const dayKey = getCurrentDayKey();
  const usageRef = doc(db, 'usage', userId, 'daily', dayKey);

  try {
    const usageDoc = await getDoc(usageRef);

    if (!usageDoc.exists()) {
      await setDoc(usageRef, {
        generations: 1,
        tokensUsed,
        lastGeneration: serverTimestamp(),
        resetAt: getDayEndTimestamp(),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(usageRef, {
        generations: increment(1),
        tokensUsed: increment(tokensUsed),
        lastGeneration: serverTimestamp(),
      });
    }

    logger.debug('Recorded generation', { component: 'ai-usage-tracker', userId });
  } catch (error) {
    logger.error('Error recording generation', { component: 'ai-usage-tracker' }, error instanceof Error ? error : undefined);
    // Usage tracking failure should not block generation responses.
  }
}

export async function getUsageSummary(userId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  tier: UserTier;
  percentUsed: number;
  resetsAt: Date;
}> {
  const [tier, usage] = await Promise.all([
    getUserTier(userId),
    getDailyUsage(userId),
  ]);

  const limit = DAILY_GENERATION_LIMIT;
  const remaining = Math.max(0, limit - usage.generations);
  const percentUsed = Math.round((usage.generations / limit) * 100);

  return {
    used: usage.generations,
    limit,
    remaining,
    tier,
    percentUsed,
    resetsAt: usage.resetAt.toDate(),
  };
}
