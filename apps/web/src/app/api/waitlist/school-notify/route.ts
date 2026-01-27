import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';
import { validateOrigin } from '@/lib/security-middleware';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';

/**
 * POST /api/waitlist/school-notify
 *
 * Captures users who want to be notified when their school is added.
 * Fire-and-forget from the frontend - gracefully handles errors.
 */

const schoolNotifySchema = z.object({
  email: z.string().email('Invalid email format').max(254),
  schoolName: z.string().min(1, 'School name is required').max(200),
});

export async function POST(request: NextRequest) {
  try {
    // Origin validation
    if (!validateOrigin(request)) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid request origin', 'FORBIDDEN'),
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // Rate limiting - strict to prevent spam
    const rateLimitResult = await enforceRateLimit('authStrict', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        ApiResponseHelper.error(rateLimitResult.error || 'Rate limit exceeded', 'RATE_LIMITED'),
        { status: rateLimitResult.status, headers: rateLimitResult.headers }
      );
    }

    // Parse body
    const body = await request.json();
    const validation = schoolNotifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        ApiResponseHelper.error(validation.error.errors[0]?.message || 'Invalid input', 'INVALID_INPUT'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { email, schoolName } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Store in Firestore
    if (isFirebaseConfigured) {
      // Use email as doc ID to prevent duplicates
      const docId = `${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${schoolName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}`;

      await dbAdmin.collection('school_waitlist').doc(docId).set({
        email: normalizedEmail,
        schoolName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      logger.info('User added to school waitlist', {
        email: normalizedEmail.replace(/(.{3}).*@/, '$1***@'),
        schoolName,
        endpoint: '/api/waitlist/school-notify',
      });
    }

    return NextResponse.json(
      ApiResponseHelper.success({
        message: "We'll let you know when your school is added!",
      }),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    logger.error('School notify waitlist error', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/waitlist/school-notify',
    });

    return NextResponse.json(
      ApiResponseHelper.error('Failed to join waitlist', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
