/**
 * Admin Alert Configuration API
 *
 * GET: List all alert configurations
 * POST: Create or update an alert rule
 * DELETE: Remove an alert rule
 *
 * Alerts trigger based on metric thresholds and patterns.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withCache } from '../../../../lib/cache-headers';

const AlertRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  type: z.enum([
    'error_spike',
    'low_signups',
    'high_reports',
    'inactive_spaces',
    'tool_queue_backlog',
    'churn_spike',
  ]),
  threshold: z.number(),
  comparison: z.enum(['gt', 'lt', 'gte', 'lte', 'eq']),
  window: z.enum(['1h', '6h', '24h', '7d']),
  enabled: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

type AlertType = z.infer<typeof AlertRuleSchema>['type'];

interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  threshold: number;
  comparison: string;
  window: string;
  enabled: boolean;
  priority: string;
  campusId: string;
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastTriggered?: FirebaseFirestore.Timestamp;
  triggerCount: number;
}

interface TriggeredAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  type: AlertType;
  priority: string;
  currentValue: number;
  threshold: number;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

/**
 * GET /api/admin/alerts
 * List all alert configurations and triggered alerts
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);

  try {
    // Get alert rules
    const rulesSnapshot = await dbAdmin
      .collection('adminAlertRules')
      .where('campusId', '==', campusId)
      .orderBy('createdAt', 'desc')
      .get();

    const rules: AlertRule[] = rulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as AlertRule));

    // Get recent triggered alerts (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const triggeredSnapshot = await dbAdmin
      .collection('adminTriggeredAlerts')
      .where('campusId', '==', campusId)
      .where('triggeredAt', '>=', oneDayAgo)
      .orderBy('triggeredAt', 'desc')
      .limit(50)
      .get();

    const triggeredAlerts: TriggeredAlert[] = triggeredSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ruleId: data.ruleId,
        ruleName: data.ruleName,
        type: data.type,
        priority: data.priority,
        currentValue: data.currentValue,
        threshold: data.threshold,
        message: data.message,
        triggeredAt: data.triggeredAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        acknowledged: data.acknowledged || false,
        acknowledgedBy: data.acknowledgedBy,
        acknowledgedAt: data.acknowledgedAt?.toDate?.()?.toISOString(),
      };
    });

    // Calculate alert stats
    const activeAlerts = triggeredAlerts.filter(a => !a.acknowledged).length;
    const criticalAlerts = triggeredAlerts.filter(a => a.priority === 'critical' && !a.acknowledged).length;

    logger.info('Alert configurations fetched', {
      ruleCount: rules.length,
      triggeredCount: triggeredAlerts.length,
    });

    return respond.success({
      rules,
      triggeredAlerts,
      stats: {
        totalRules: rules.length,
        enabledRules: rules.filter(r => r.enabled).length,
        activeAlerts,
        criticalAlerts,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch alerts', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch alerts', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * POST /api/admin/alerts
 * Create or update an alert rule
 */
export const POST = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const body = await request.json();
  const validationResult = AlertRuleSchema.safeParse(body);

  if (!validationResult.success) {
    return respond.error('Invalid alert configuration', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: validationResult.error.flatten(),
    });
  }

  const data = validationResult.data;

  try {
    const now = FieldValue.serverTimestamp();

    if (data.id) {
      // Update existing rule
      const ruleRef = dbAdmin.collection('adminAlertRules').doc(data.id);
      const ruleDoc = await ruleRef.get();

      if (!ruleDoc.exists) {
        return respond.error('Alert rule not found', 'NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      await ruleRef.update({
        name: data.name,
        type: data.type,
        threshold: data.threshold,
        comparison: data.comparison,
        window: data.window,
        enabled: data.enabled,
        priority: data.priority,
        updatedAt: now,
      });

      logger.info('Alert rule updated', { ruleId: data.id, adminId });

      return respond.success({ id: data.id, message: 'Alert rule updated' });
    } else {
      // Create new rule
      const ruleRef = await dbAdmin.collection('adminAlertRules').add({
        name: data.name,
        type: data.type,
        threshold: data.threshold,
        comparison: data.comparison,
        window: data.window,
        enabled: data.enabled,
        priority: data.priority,
        campusId,
        createdBy: adminId,
        createdAt: now,
        updatedAt: now,
        triggerCount: 0,
      });

      logger.info('Alert rule created', { ruleId: ruleRef.id, adminId });

      return respond.success({ id: ruleRef.id, message: 'Alert rule created' });
    }
  } catch (error) {
    logger.error('Failed to save alert rule', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to save alert rule', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * DELETE /api/admin/alerts
 * Delete an alert rule
 */
export const DELETE = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const ruleId = searchParams.get('id');

  if (!ruleId) {
    return respond.error('Rule ID required', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  try {
    const ruleRef = dbAdmin.collection('adminAlertRules').doc(ruleId);
    const ruleDoc = await ruleRef.get();

    if (!ruleDoc.exists) {
      return respond.error('Alert rule not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    await ruleRef.delete();

    logger.info('Alert rule deleted', { ruleId, adminId });

    return respond.success({ message: 'Alert rule deleted' });
  } catch (error) {
    logger.error('Failed to delete alert rule', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to delete alert rule', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
