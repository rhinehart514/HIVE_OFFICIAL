/**
 * Space Unlock Service
 *
 * Handles the unlock mechanic for major spaces.
 *
 * When a major space reaches 10 members:
 * 1. Set isUnlocked = true
 * 2. Get all waitlist members (notified = false)
 * 3. Send notifications
 * 4. Mark waitlist entries as notified
 * 5. Create default boards (General, Study Groups, Projects, Resources)
 *
 * CRITICAL: The unlock threshold (10 members) is NEVER exposed to clients.
 * This is a server-side constant only.
 */

import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { FieldValue } from 'firebase-admin/firestore';

const MAJOR_UNLOCK_THRESHOLD = 10;

interface UnlockResult {
  unlocked: boolean;
  newMemberCount?: number;
  notifiedCount?: number;
  error?: string;
}

/**
 * Check if a major space should unlock and process the unlock if threshold is met
 *
 * Called after every member join transaction for major spaces
 *
 * @param spaceId - The space ID to check
 * @returns UnlockResult indicating if space was unlocked
 */
export async function checkMajorSpaceUnlock(
  spaceId: string
): Promise<UnlockResult> {
  if (!isFirebaseConfigured) {
    logger.warn('Firebase not configured - skipping unlock check', {
      component: 'space-unlock-service',
      spaceId,
    });
    return { unlocked: false, error: 'Firebase not configured' };
  }

  try {
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    const spaceDoc = await spaceRef.get();

    if (!spaceDoc.exists) {
      return { unlocked: false, error: 'Space not found' };
    }

    const spaceData = spaceDoc.data();
    if (!spaceData) {
      return { unlocked: false, error: 'Space data not found' };
    }

    // Only process major spaces
    if (spaceData.identityType !== 'major') {
      return { unlocked: false };
    }

    // Already unlocked
    if (spaceData.isUnlocked) {
      return { unlocked: false };
    }

    // Check member count
    const memberCount = spaceData.memberCount || 0;
    const threshold = spaceData.unlockThreshold || MAJOR_UNLOCK_THRESHOLD;

    if (memberCount < threshold) {
      return {
        unlocked: false,
        newMemberCount: memberCount,
      };
    }

    // Threshold reached - unlock the space!
    logger.info('Major space reached unlock threshold', {
      component: 'space-unlock-service',
      spaceId,
      majorName: spaceData.majorName,
      memberCount,
      threshold,
    });

    // Run unlock in a transaction
    let notifiedCount = 0;
    await dbAdmin.runTransaction(async (transaction) => {
      // 1. Set isUnlocked = true
      transaction.update(spaceRef, {
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 2. Get waitlist members (notified = false)
      const waitlistSnapshot = await transaction.get(
        dbAdmin
          .collection('spaceWaitlists')
          .where('spaceId', '==', spaceId)
          .where('notified', '==', false)
      );

      // 3. Mark waitlist entries as notified
      for (const waitlistDoc of waitlistSnapshot.docs) {
        transaction.update(waitlistDoc.ref, {
          notified: true,
          notifiedAt: new Date().toISOString(),
        });
        notifiedCount++;
      }

      // 4. Create default boards
      const campusId = spaceData.campusId || 'ub-buffalo';
      const defaultBoards = [
        { name: 'General', order: 0 },
        { name: 'Study Groups', order: 1 },
        { name: 'Projects', order: 2 },
        { name: 'Resources', order: 3 },
      ];

      for (const board of defaultBoards) {
        const boardRef = dbAdmin.collection('boards').doc();
        transaction.set(boardRef, {
          name: board.name,
          spaceId: spaceId,
          campusId: campusId,
          order: board.order,
          isDefault: board.order === 0,
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    logger.info('Major space unlocked successfully', {
      component: 'space-unlock-service',
      spaceId,
      majorName: spaceData.majorName,
      memberCount,
      notifiedCount,
    });

    // TODO: Send notification emails to waitlist members
    // This would be handled by a separate notification service
    // For now, we just mark them as notified in the database

    return {
      unlocked: true,
      newMemberCount: memberCount,
      notifiedCount,
    };
  } catch (error) {
    logger.error('Failed to check/unlock major space', {
      error: { error: error instanceof Error ? error.message : String(error) },
      component: 'space-unlock-service',
      spaceId,
    });
    return {
      unlocked: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Manually trigger unlock check for a space (admin action)
 *
 * @param spaceId - The space ID to unlock
 * @returns UnlockResult
 */
export async function forceUnlockMajorSpace(
  spaceId: string
): Promise<UnlockResult> {
  // Same logic as checkMajorSpaceUnlock but bypasses threshold check
  // Used for admin actions or testing

  if (!isFirebaseConfigured) {
    return { unlocked: false, error: 'Firebase not configured' };
  }

  try {
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    const spaceDoc = await spaceRef.get();

    if (!spaceDoc.exists) {
      return { unlocked: false, error: 'Space not found' };
    }

    const spaceData = spaceDoc.data();
    if (!spaceData) {
      return { unlocked: false, error: 'Space data not found' };
    }

    if (spaceData.identityType !== 'major') {
      return { unlocked: false, error: 'Not a major space' };
    }

    if (spaceData.isUnlocked) {
      return { unlocked: false, error: 'Already unlocked' };
    }

    // Force unlock
    await spaceRef.update({
      isUnlocked: true,
      unlockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info('Major space force unlocked', {
      component: 'space-unlock-service',
      spaceId,
      majorName: spaceData.majorName,
    });

    return { unlocked: true };
  } catch (error) {
    logger.error('Failed to force unlock major space', {
      error: { error: error instanceof Error ? error.message : String(error) },
      component: 'space-unlock-service',
      spaceId,
    });
    return {
      unlocked: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
