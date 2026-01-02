/**
 * Admin Activity Logger
 *
 * Logs administrative actions for audit trail
 */

import { dbAdmin } from './firebase-admin';
import { logger } from './structured-logger';

interface AdminActivityLog {
  adminId: string;
  action: string;
  targetType: 'user' | 'space' | 'tool' | 'content' | 'system' | 'users';
  targetId: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin activity for audit trail
 */
export async function logAdminActivity(activity: AdminActivityLog): Promise<void> {
  try {
    const logEntry = {
      ...activity,
      timestamp: activity.timestamp || new Date(),
      createdAt: new Date(),
    };

    await dbAdmin.collection('adminActivityLogs').add(logEntry);

    logger.info('Admin activity logged', {
      action: activity.action,
      adminId: activity.adminId,
      targetType: activity.targetType,
      targetId: activity.targetId,
    });
  } catch (error) {
    // Don't throw - logging should not break the main operation
    logger.error('Failed to log admin activity', {
      error: error instanceof Error ? error.message : String(error),
      activity,
    });
  }
}

/**
 * Get admin activity logs
 */
export async function getAdminActivityLogs(options: {
  adminId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  limit?: number;
  startAfter?: Date;
}): Promise<AdminActivityLog[]> {
  let query = dbAdmin
    .collection('adminActivityLogs')
    .orderBy('timestamp', 'desc');

  if (options.adminId) {
    query = query.where('adminId', '==', options.adminId);
  }

  if (options.targetType) {
    query = query.where('targetType', '==', options.targetType);
  }

  if (options.targetId) {
    query = query.where('targetId', '==', options.targetId);
  }

  if (options.action) {
    query = query.where('action', '==', options.action);
  }

  if (options.startAfter) {
    query = query.startAfter(options.startAfter);
  }

  const snapshot = await query.limit(options.limit || 50).get();

  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as unknown as AdminActivityLog[];
}
