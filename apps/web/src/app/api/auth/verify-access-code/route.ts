import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { validateOrigin } from '@/lib/security-middleware';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { enforceRateLimit, getSecureClientId } from '@/lib/secure-rate-limiter';
import {
  checkAccessCodeLockout,
  recordFailedAccessCodeAttempt,
  recordSuccessfulAccessCode,
  verifyAccessCode,
} from '@/lib/access-code-security';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { signJwt } from '@/lib/jwt';
import { nanoid } from 'nanoid';

const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be numeric'),
  schoolId: z.string().optional(),
  campusId: z.string().optional(),
});

// Session config
const SESSION_DURATION_DAYS = 30;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * POST /api/auth/verify-access-code
 * Verify 6-digit entry code and create session
 *
 * This is the PRIMARY entry mechanism - users enter a 6-digit code
 * distributed by admins to gain access and create their account.
 *
 * SECURITY: Multi-layer brute force protection:
 * 1. Rate limiting (3 attempts per 5 minutes per IP)
 * 2. IP-based lockouts (15min after 5 failures, escalating)
 * 3. Hashed code storage (SHA256, never plaintext)
 * 4. CSRF protection via origin validation
 */
export async function POST(request: NextRequest) {
  const clientIp = getSecureClientId(request);

  try {
    // Origin validation (CSRF protection)
    if (!validateOrigin(request)) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid request origin', 'FORBIDDEN'),
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // SECURITY: Check IP-based lockout BEFORE rate limiting
    // This catches repeat offenders even after rate limit window resets
    const lockoutStatus = await checkAccessCodeLockout(clientIp);
    if (lockoutStatus.locked) {
      const remainingMinutes = Math.ceil((lockoutStatus.remainingMs || 0) / 60000);

      logger.warn('Access code attempt blocked by lockout', {
        ip: clientIp,
        remainingMinutes,
        violations: lockoutStatus.violations,
      });

      return NextResponse.json(
        ApiResponseHelper.error(
          `Too many failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
          'LOCKED_OUT'
        ),
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          headers: {
            'Retry-After': String(Math.ceil((lockoutStatus.remainingMs || 0) / 1000)),
          },
        }
      );
    }

    // Rate limiting (3 attempts per 5 minutes)
    const rateLimitResult = await enforceRateLimit('accessCode', request);
    if (!rateLimitResult.allowed) {
      // Record as failed attempt for lockout tracking
      await recordFailedAccessCodeAttempt(clientIp);

      return NextResponse.json(
        ApiResponseHelper.error(
          'Too many attempts. Please wait before trying again.',
          'RATE_LIMITED'
        ),
        {
          status: rateLimitResult.status,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = verifyCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid code format', 'INVALID_INPUT'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { code, schoolId, campusId } = validation.data;
    const effectiveSchoolId = schoolId || process.env.NEXT_PUBLIC_SCHOOL_ID || 'ub-buffalo';
    const effectiveCampusId = campusId || process.env.NEXT_PUBLIC_CAMPUS_ID || 'ub-buffalo';

    // SECURITY: Verify against hashed storage
    const result = await verifyAccessCode(code);

    if (result.valid) {
      // Success - clear any lockout state
      await recordSuccessfulAccessCode(clientIp);

      logger.info('Entry code verified successfully', {
        ip: clientIp,
        codeId: result.codeId,
        useCount: result.useCount,
      });

      // Create or find user by code
      // For entry codes, we create a user tied to the code itself
      // The user will complete their profile in the onboarding flow
      const userId = `code_${result.codeId}_${nanoid(8)}`;
      let user: {
        id: string;
        entryCodeId?: string;
        campusId?: string;
        schoolId?: string;
        onboardingCompleted?: boolean;
        firstName?: string;
        handle?: string;
        createdAt?: Date;
        updatedAt?: Date;
      } | null = null;
      let needsOnboarding = true;

      if (isFirebaseConfigured) {
        // Check if there's already a user created from this code
        const existingUsers = await dbAdmin
          .collection('users')
          .where('entryCodeId', '==', result.codeId)
          .limit(1)
          .get();

        if (!existingUsers.empty) {
          // Returning user
          const existingDoc = existingUsers.docs[0];
          const userData = existingDoc.data();
          user = {
            id: existingDoc.id,
            entryCodeId: userData.entryCodeId,
            campusId: userData.campusId,
            schoolId: userData.schoolId,
            onboardingCompleted: userData.onboardingCompleted,
            firstName: userData.firstName,
            handle: userData.handle,
          };
          needsOnboarding = !user.onboardingCompleted && !user.handle;
        } else {
          // New user - create with minimal info
          const newUserId = nanoid(21);
          const now = new Date();

          const newUserData = {
            id: newUserId,
            entryCodeId: result.codeId,
            campusId: effectiveCampusId,
            schoolId: effectiveSchoolId,
            onboardingCompleted: false,
            createdAt: now,
            updatedAt: now,
          };

          await dbAdmin.collection('users').doc(newUserId).set(newUserData);
          user = newUserData;
          needsOnboarding = true;
        }
      } else {
        // Development mode without Firebase
        user = {
          id: userId,
          entryCodeId: result.codeId,
          campusId: effectiveCampusId,
          schoolId: effectiveSchoolId,
          onboardingCompleted: false,
        };
      }

      // Create session JWT
      const sessionId = nanoid(21);
      const sessionPayload = {
        userId: user.id,
        campusId: effectiveCampusId,
        schoolId: effectiveSchoolId,
        isAdmin: false,
        onboardingCompleted: user.onboardingCompleted || false,
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

      return NextResponse.json(
        ApiResponseHelper.success({
          valid: true,
          user: {
            id: user.id,
            firstName: user.firstName || null,
            handle: user.handle || null,
            onboardingCompleted: user.onboardingCompleted || false,
          },
          needsOnboarding,
        }),
        { status: HttpStatus.OK }
      );
    }

    // Invalid code - record failed attempt
    const lockoutResult = await recordFailedAccessCodeAttempt(clientIp);

    logger.warn('Access code verification failed', {
      ip: clientIp,
      attemptsRemaining: lockoutResult.attemptsRemaining,
      locked: lockoutResult.locked,
    });

    // Provide helpful feedback without revealing too much
    if (lockoutResult.locked) {
      const remainingMinutes = Math.ceil(
        ((lockoutResult.lockedUntil?.getTime() || Date.now()) - Date.now()) / 60000
      );

      return NextResponse.json(
        ApiResponseHelper.error(
          `Too many failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
          'LOCKED_OUT'
        ),
        { status: HttpStatus.TOO_MANY_REQUESTS }
      );
    }

    const attemptsMsg = lockoutResult.attemptsRemaining
      ? ` ${lockoutResult.attemptsRemaining} attempt${lockoutResult.attemptsRemaining !== 1 ? 's' : ''} remaining.`
      : '';

    return NextResponse.json(
      ApiResponseHelper.error(`Invalid code.${attemptsMsg}`, 'INVALID_CODE'),
      { status: HttpStatus.FORBIDDEN }
    );
  } catch (error) {
    logger.error('Access code verification error', {
      ip: clientIp,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      ApiResponseHelper.error('Unable to verify code. Please try again.', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
