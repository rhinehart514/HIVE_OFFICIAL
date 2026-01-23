import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { validateOrigin } from '@/lib/security-middleware';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { enforceRateLimit, getSecureClientId } from '@/lib/secure-rate-limiter';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { signJwt } from '@/lib/jwt';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

const verifyCodeSchema = z.object({
  handle: z
    .string()
    .min(1, 'Handle is required')
    .max(30, 'Handle too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid handle format'),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be numeric'),
});

// Session config
const SESSION_DURATION_DAYS = 30;
const isProduction = process.env.NODE_ENV === 'production';
const MAX_ATTEMPTS = 5;

/**
 * Hash a code for comparison (SHA256)
 */
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * POST /api/auth/verify-signin-code
 * Verify the magic code and create session
 */
export async function POST(request: NextRequest) {
  const clientIp = getSecureClientId(request);

  try {
    // Origin validation
    if (!validateOrigin(request)) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid request origin', 'FORBIDDEN'),
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // Rate limiting (5 attempts per 5 minutes)
    const rateLimitResult = await enforceRateLimit('signinVerify', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        ApiResponseHelper.error('Too many attempts. Please wait before trying again.', 'RATE_LIMITED'),
        { status: rateLimitResult.status, headers: rateLimitResult.headers }
      );
    }

    // Parse and validate
    const body = await request.json();
    const validation = verifyCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid code format', 'INVALID_INPUT'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { handle, code } = validation.data;
    const normalizedHandle = handle.toLowerCase();

    // Dev mode without Firebase
    if (!isFirebaseConfigured) {
      logger.warn('Firebase not configured, using dev mode for signin verify');

      // In dev, accept any code
      const sessionId = nanoid(21);
      const token = await signJwt(
        {
          userId: `dev_${normalizedHandle}`,
          campusId: 'ub-buffalo',
          schoolId: 'ub-buffalo',
          isAdmin: false,
          onboardingCompleted: true,
          sessionId,
        },
        `${SESSION_DURATION_DAYS}d`
      );

      const cookieStore = await cookies();
      cookieStore.set('hive_session', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      });

      return NextResponse.json(
        ApiResponseHelper.success({ valid: true }),
        { status: HttpStatus.OK }
      );
    }

    // Look up signin code
    const codeDocRef = dbAdmin.collection('signin_codes').doc(normalizedHandle);
    const codeDoc = await codeDocRef.get();

    if (!codeDoc.exists) {
      logger.warn('Signin code not found', { ip: clientIp, handle: normalizedHandle });
      return NextResponse.json(
        ApiResponseHelper.error('No code found. Request a new one.', 'NOT_FOUND'),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    const codeData = codeDoc.data()!;
    const now = new Date();

    // Check if code expired
    const expiresAt = codeData.expiresAt?.toDate?.() || new Date(codeData.expiresAt);
    if (now > expiresAt) {
      await codeDocRef.delete();
      return NextResponse.json(
        ApiResponseHelper.error('Code expired. Request a new one.', 'EXPIRED'),
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // Check attempts
    if (codeData.attempts >= MAX_ATTEMPTS) {
      await codeDocRef.delete();
      return NextResponse.json(
        ApiResponseHelper.error('Too many failed attempts. Request a new code.', 'LOCKED_OUT'),
        { status: HttpStatus.TOO_MANY_REQUESTS }
      );
    }

    // Verify code
    const hashedInput = hashCode(code);
    if (hashedInput !== codeData.codeHash) {
      // Increment attempts
      const newAttempts = (codeData.attempts || 0) + 1;
      await codeDocRef.update({ attempts: newAttempts });

      const attemptsRemaining = MAX_ATTEMPTS - newAttempts;

      logger.warn('Invalid signin code', {
        ip: clientIp,
        handle: normalizedHandle,
        attemptsRemaining,
      });

      return NextResponse.json(
        ApiResponseHelper.error(
          `Invalid code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
          'INVALID_CODE'
        ),
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // Code is valid! Delete it and create session
    await codeDocRef.delete();

    // Get user data
    const userId = codeData.userId;
    const userDoc = await dbAdmin.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      logger.error('User not found after valid signin code', {
        ip: clientIp,
        handle: normalizedHandle,
        userId,
      });
      return NextResponse.json(
        ApiResponseHelper.error('Account not found. Please contact support.', 'NOT_FOUND'),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    const userData = userDoc.data()!;

    // Create session JWT
    const sessionId = nanoid(21);
    const sessionPayload = {
      userId,
      campusId: userData.campusId || 'ub-buffalo',
      schoolId: userData.schoolId || 'ub-buffalo',
      isAdmin: userData.isAdmin || false,
      onboardingCompleted: userData.onboardingCompleted || false,
      sessionId,
    };

    const token = await signJwt(sessionPayload, `${SESSION_DURATION_DAYS}d`);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('hive_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    });

    // Update last login
    await dbAdmin.collection('users').doc(userId).update({
      lastLoginAt: now,
      updatedAt: now,
    });

    logger.info('Signin successful', {
      ip: clientIp,
      handle: normalizedHandle,
      userId,
    });

    return NextResponse.json(
      ApiResponseHelper.success({
        valid: true,
        user: {
          id: userId,
          handle: userData.handle,
          firstName: userData.firstName,
          onboardingCompleted: userData.onboardingCompleted || false,
        },
      }),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    logger.error('Verify signin code error', {
      ip: clientIp,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      ApiResponseHelper.error('Unable to verify code. Please try again.', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
