import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';
import { validateOrigin } from '@/lib/security-middleware';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';

/**
 * POST /api/auth/alumni-waitlist
 *
 * Captures alumni who want to rejoin their old spaces.
 * Fire-and-forget from the frontend - gracefully handles errors.
 */

const alumniWaitlistSchema = z.object({
  spaces: z.string().min(1, 'Please tell us which spaces you were part of').max(500),
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

    // Rate limiting
    const rateLimitResult = await enforceRateLimit('apiGeneral', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        ApiResponseHelper.error(rateLimitResult.error || 'Rate limit exceeded', 'RATE_LIMITED'),
        { status: rateLimitResult.status, headers: rateLimitResult.headers }
      );
    }

    // Get session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        ApiResponseHelper.error('Not authenticated', 'UNAUTHORIZED'),
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    // Parse body
    const body = await request.json();
    const validation = alumniWaitlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        ApiResponseHelper.error(validation.error.errors[0]?.message || 'Invalid input', 'INVALID_INPUT'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { spaces } = validation.data;
    const campusId = session.campusId || 'ub-buffalo';

    // Store in Firestore
    if (isFirebaseConfigured) {
      await dbAdmin.collection('alumni_waitlist').add({
        userId: session.userId,
        email: session.email,
        campusId,
        spaces,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      logger.info('Alumni added to waitlist', {
        userId: session.userId,
        campusId,
        endpoint: '/api/auth/alumni-waitlist',
      });
    }

    return NextResponse.json(
      ApiResponseHelper.success({
        message: 'Added to alumni waitlist',
      }),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    logger.error('Alumni waitlist error', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/auth/alumni-waitlist',
    });

    return NextResponse.json(
      ApiResponseHelper.error('Failed to join waitlist', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
