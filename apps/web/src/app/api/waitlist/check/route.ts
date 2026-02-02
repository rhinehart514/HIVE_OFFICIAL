import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';

/**
 * GET /api/waitlist/check
 *
 * Check if a user is already on the waitlist for a school.
 * Returns { onWaitlist: boolean, joinedAt?: string }
 */

const checkWaitlistSchema = z.object({
  email: z.string().email('Invalid email format').max(254),
  schoolId: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - permissive since this is just a check
    const rateLimitResult = await enforceRateLimit('authLoose', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        ApiResponseHelper.error(rateLimitResult.error || 'Rate limit exceeded', 'RATE_LIMITED'),
        { status: rateLimitResult.status, headers: rateLimitResult.headers }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const schoolId = searchParams.get('schoolId');

    const validation = checkWaitlistSchema.safeParse({ email, schoolId });

    if (!validation.success) {
      return NextResponse.json(
        ApiResponseHelper.error(validation.error.errors[0]?.message || 'Invalid input', 'INVALID_INPUT'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const normalizedEmail = validation.data.email.toLowerCase().trim();

    // Check Firestore for existing waitlist entry
    if (!isFirebaseConfigured) {
      return NextResponse.json(
        ApiResponseHelper.success({ onWaitlist: false }),
        { status: HttpStatus.OK }
      );
    }

    // Query school_waitlist collection
    // Doc ID format: {email}_{schoolName} (sanitized)
    // Since we may not know the exact school name, query by email
    let query = dbAdmin.collection('school_waitlist').where('email', '==', normalizedEmail);

    if (validation.data.schoolId) {
      query = query.where('schoolId', '==', validation.data.schoolId);
    }

    const snapshot = await query.limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json(
        ApiResponseHelper.success({ onWaitlist: false }),
        { status: HttpStatus.OK }
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    logger.info('Waitlist check: user found on waitlist', {
      email: normalizedEmail.replace(/(.{3}).*@/, '$1***@'),
      schoolId: data.schoolId,
      endpoint: '/api/waitlist/check',
    });

    return NextResponse.json(
      ApiResponseHelper.success({
        onWaitlist: true,
        joinedAt: data.createdAt,
        schoolName: data.schoolName,
      }),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    logger.error('Waitlist check error', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/waitlist/check',
    });

    // Return false on error to not block the UI
    return NextResponse.json(
      ApiResponseHelper.success({ onWaitlist: false }),
      { status: HttpStatus.OK }
    );
  }
}
