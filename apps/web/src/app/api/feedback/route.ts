import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/logger";
import { getDefaultCampusId } from '@/lib/campus-context';
import { FieldValue } from 'firebase-admin/firestore';
import { withErrors } from '@/lib/middleware';

export const POST = withErrors(async (request, _context, respond) => {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.feedback !== 'string' || body.feedback.trim().length === 0) {
    return respond.error("Feedback content is required", "INVALID_INPUT", { status: 400 });
  }

  if (body.feedback.length > 500) {
    return respond.error("Feedback too long (max 500 characters)", "INVALID_INPUT", { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const feedbackData = {
    feedback: body.feedback.trim(),
    campusId: getDefaultCampusId(),
    ip,
    userAgent,
    submittedAt: body.timestamp || new Date().toISOString(),
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = await dbAdmin.collection('feedback').add(feedbackData);

  logger.info('Feedback persisted', { feedbackId: docRef.id });

  return respond.success({
    message: 'Feedback received successfully',
    id: docRef.id,
  });
}, { rateLimit: { maxRequests: 10, windowMs: 60000 } });
