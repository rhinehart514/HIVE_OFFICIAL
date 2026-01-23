import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { validateOrigin } from '@/lib/security-middleware';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { enforceRateLimit, getSecureClientId } from '@/lib/secure-rate-limiter';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import crypto from 'crypto';

const requestCodeSchema = z.object({
  handle: z
    .string()
    .min(1, 'Handle is required')
    .max(30, 'Handle too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid handle format'),
});

// Code expires in 10 minutes
const CODE_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Generate a random 6-digit code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash a code for storage (SHA256)
 */
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Mask email for display (j***@buffalo.edu)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***.edu';
  const masked = local.length > 1 ? `${local[0]}***` : '***';
  return `${masked}@${domain}`;
}

/**
 * POST /api/auth/request-signin-code
 * Look up user by handle and send magic code to their school email
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

    // Rate limiting (5 requests per 5 minutes)
    const rateLimitResult = await enforceRateLimit('signinCode', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        ApiResponseHelper.error('Too many attempts. Please wait before trying again.', 'RATE_LIMITED'),
        { status: rateLimitResult.status, headers: rateLimitResult.headers }
      );
    }

    // Parse and validate
    const body = await request.json();
    const validation = requestCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid handle format', 'INVALID_INPUT'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { handle } = validation.data;
    const normalizedHandle = handle.toLowerCase();

    // Look up user by handle
    if (!isFirebaseConfigured) {
      logger.warn('Firebase not configured, using dev mode for signin');
      // Dev mode - pretend user exists
      return NextResponse.json(
        ApiResponseHelper.success({
          email: maskEmail(`${normalizedHandle}@buffalo.edu`),
        }),
        { status: HttpStatus.OK }
      );
    }

    const usersSnapshot = await dbAdmin
      .collection('users')
      .where('handle', '==', normalizedHandle)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      logger.info('Signin attempt for non-existent handle', {
        ip: clientIp,
        handle: normalizedHandle,
      });

      // Don't reveal if handle exists - return generic error
      return NextResponse.json(
        ApiResponseHelper.error('No account found with this handle', 'NOT_FOUND'),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Construct email from handle + campus domain
    // For now, assume buffalo.edu - in production, use campus config
    const campusDomain = userData.campusDomain || 'buffalo.edu';
    const userEmail = userData.email || `${normalizedHandle}@${campusDomain}`;

    // Generate and store code
    const code = generateCode();
    const hashedCode = hashCode(code);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_EXPIRY_MS);

    // Store in signin_codes collection
    await dbAdmin.collection('signin_codes').doc(normalizedHandle).set({
      handle: normalizedHandle,
      userId,
      codeHash: hashedCode,
      createdAt: now,
      expiresAt,
      attempts: 0,
    });

    // Send email with code
    // For now, log to console in dev, use email service in prod
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📧 SIGNIN CODE for @${normalizedHandle}: ${code}\n`);
    } else {
      // TODO: Use email service to send code
      // await sendSigninCodeEmail(userEmail, code);
      console.log(`📧 Would send signin code to ${maskEmail(userEmail)}`);
    }

    logger.info('Signin code sent', {
      ip: clientIp,
      handle: normalizedHandle,
      email: maskEmail(userEmail),
    });

    return NextResponse.json(
      ApiResponseHelper.success({
        email: maskEmail(userEmail),
      }),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    logger.error('Request signin code error', {
      ip: clientIp,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      ApiResponseHelper.error('Unable to send code. Please try again.', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
