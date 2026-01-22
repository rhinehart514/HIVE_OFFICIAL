import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

const ACCESS_GATE_ENABLED = process.env.NEXT_PUBLIC_ACCESS_GATE_ENABLED === 'true';

const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be numeric'),
});

/**
 * POST /api/auth/verify-access-code
 * Verify 6-digit access code for gated launch
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
    // If gate is disabled, allow all
    if (!ACCESS_GATE_ENABLED) {
      return NextResponse.json(
        ApiResponseHelper.success({ valid: true }),
        { status: HttpStatus.OK }
      );
    }

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

    const { code } = validation.data;

    // SECURITY: Verify against hashed storage
    const result = await verifyAccessCode(code);

    if (result.valid) {
      // Success - clear any lockout state
      await recordSuccessfulAccessCode(clientIp);

      logger.info('Access code verified successfully', {
        ip: clientIp,
        codeId: result.codeId,
        useCount: result.useCount,
      });

      return NextResponse.json(
        ApiResponseHelper.success({ valid: true }),
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
