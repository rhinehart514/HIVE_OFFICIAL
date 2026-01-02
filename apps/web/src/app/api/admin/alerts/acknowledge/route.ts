/**
 * Admin Alert Acknowledge API
 *
 * POST: Acknowledge a triggered alert
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const AcknowledgeSchema = z.object({
  alertId: z.string().min(1),
  note: z.string().optional(),
});

/**
 * POST /api/admin/alerts/acknowledge
 * Acknowledge a triggered alert
 */
export const POST = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const body = await request.json();
  const validationResult = AcknowledgeSchema.safeParse(body);

  if (!validationResult.success) {
    return respond.error('Invalid request', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: validationResult.error.flatten(),
    });
  }

  const { alertId, note } = validationResult.data;

  try {
    const alertRef = dbAdmin.collection('adminTriggeredAlerts').doc(alertId);
    const alertDoc = await alertRef.get();

    if (!alertDoc.exists) {
      return respond.error('Alert not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    await alertRef.update({
      acknowledged: true,
      acknowledgedBy: adminId,
      acknowledgedAt: FieldValue.serverTimestamp(),
      acknowledgeNote: note || null,
    });

    logger.info('Alert acknowledged', { alertId, adminId });

    return respond.success({ message: 'Alert acknowledged' });
  } catch (error) {
    logger.error('Failed to acknowledge alert', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to acknowledge alert', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
