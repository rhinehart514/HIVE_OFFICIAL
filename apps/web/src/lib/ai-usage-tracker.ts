/**
 * AI Usage Tracker
 *
 * Tracks AI generation usage per user for rate limiting and subscription tiers.
 * Stores in Firestore for persistence across sessions.
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

// Usage limits by tier
export const USAGE_LIMITS = {
  free: 10,
  pro: 100,
  team: Infinity,
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

/**
 * Get current month key (YYYY-MM)
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get user's current tier
 */
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

/**
 * Get user's usage for current month
 */
export async function getMonthlyUsage(userId: string): Promise<UsageRecord> {
  const monthKey = getCurrentMonthKey();

  try {
    const usageDoc = await getDoc(doc(db, 'usage', userId, 'monthly', monthKey));

    if (!usageDoc.exists()) {
      // No usage yet this month
      return {
        generations: 0,
        tokensUsed: 0,
        lastGeneration: null,
        resetAt: getMonthEndTimestamp(),
      };
    }

    return usageDoc.data() as UsageRecord;
  } catch (error) {
    logger.error('Error getting monthly usage', { component: 'ai-usage-tracker' }, error instanceof Error ? error : undefined);
    return {
      generations: 0,
      tokensUsed: 0,
      lastGeneration: null,
      resetAt: getMonthEndTimestamp(),
    };
  }
}

/**
 * Check if user can generate (within limits)
 */
export async function canGenerate(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  tier: UserTier;
  limit: number;
}> {
  const [tier, usage] = await Promise.all([
    getUserTier(userId),
    getMonthlyUsage(userId),
  ]);

  const limit = USAGE_LIMITS[tier];
  const remaining = Math.max(0, limit - usage.generations);
  const allowed = usage.generations < limit;

  return { allowed, remaining, tier, limit };
}

/**
 * Record a generation (call after successful generation)
 */
export async function recordGeneration(
  userId: string,
  tokensUsed: number = 0
): Promise<void> {
  const monthKey = getCurrentMonthKey();
  const usageRef = doc(db, 'usage', userId, 'monthly', monthKey);

  try {
    const usageDoc = await getDoc(usageRef);

    if (!usageDoc.exists()) {
      // First generation this month
      await setDoc(usageRef, {
        generations: 1,
        tokensUsed,
        lastGeneration: serverTimestamp(),
        resetAt: getMonthEndTimestamp(),
        createdAt: serverTimestamp(),
      });
    } else {
      // Increment existing usage
      await updateDoc(usageRef, {
        generations: increment(1),
        tokensUsed: increment(tokensUsed),
        lastGeneration: serverTimestamp(),
      });
    }

    logger.debug('Recorded generation', { component: 'ai-usage-tracker', userId });
  } catch (error) {
    logger.error('Error recording generation', { component: 'ai-usage-tracker' }, error instanceof Error ? error : undefined);
    // Don't throw - usage tracking failure shouldn't block generation
  }
}

/**
 * Get timestamp for end of current month
 */
function getMonthEndTimestamp(): Timestamp {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Timestamp.fromDate(endOfMonth);
}

/**
 * Get usage summary for display
 */
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
    getMonthlyUsage(userId),
  ]);

  const limit = USAGE_LIMITS[tier];
  const remaining = Math.max(0, limit - usage.generations);
  const percentUsed = limit === Infinity ? 0 : Math.round((usage.generations / limit) * 100);

  return {
    used: usage.generations,
    limit,
    remaining,
    tier,
    percentUsed,
    resetsAt: usage.resetAt.toDate(),
  };
}
