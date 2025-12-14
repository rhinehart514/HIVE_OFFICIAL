import { type NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { createHash } from 'crypto';
import { SignJWT } from 'jose';
import { dbAdmin, isFirebaseConfigured } from "@/lib/firebase-admin";
import { auditAuthEvent } from "@/lib/production-auth";
import { enforceRateLimit } from "@/lib/secure-rate-limiter";
import { logger } from "@/lib/logger";
import { withValidation, type ResponseFormatter } from "@/lib/middleware";

// Security constants
const MAX_ATTEMPTS_PER_CODE = 5;
const LOCKOUT_DURATION_SECONDS = 60; // 1 minute lockout after max attempts

const verifyCodeSchema = z.object({
  email: z.string().email().max(254),
  code: z.string()
    .min(6, "Code must be 6 digits")
    .max(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
  schoolId: z.string()
    .min(1, "School ID is required")
    .max(50, "School ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid school ID format")
});

/**
 * Hash code with SHA256 (same as send-code)
 */
function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/**
 * Check if email is locked out due to too many attempts
 */
async function checkLockout(email: string): Promise<{ locked: boolean; retryAfter?: number }> {
  if (!isFirebaseConfigured) return { locked: false };

  const lockoutDoc = await dbAdmin
    .collection('verification_lockouts')
    .doc(email.toLowerCase())
    .get();

  if (!lockoutDoc.exists) return { locked: false };

  const data = lockoutDoc.data();
  if (!data?.lockedUntil) return { locked: false };

  const lockedUntil = data.lockedUntil.toDate();
  const now = new Date();

  if (now < lockedUntil) {
    const retryAfter = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
    return { locked: true, retryAfter };
  }

  // Lockout expired, remove it
  await lockoutDoc.ref.delete();
  return { locked: false };
}

/**
 * Apply lockout after max attempts
 */
async function applyLockout(email: string): Promise<void> {
  if (!isFirebaseConfigured) return;

  const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_SECONDS * 1000);

  await dbAdmin
    .collection('verification_lockouts')
    .doc(email.toLowerCase())
    .set({
      email: email.toLowerCase(),
      lockedUntil,
      createdAt: new Date()
    });
}

/**
 * POST /api/auth/verify-code
 * Verify the 6-digit code and create a session
 */
export const POST = withValidation(
  verifyCodeSchema,
  async (request, _context: Record<string, string | string[]>, body: z.infer<typeof verifyCodeSchema>, respond: typeof ResponseFormatter) => {
    const { email, code, schoolId } = body;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.replace(/\s/g, ''); // Remove any spaces

    try {
      // Rate limiting
      const rateLimitResult = await enforceRateLimit('magicLink', request as NextRequest);
      if (!rateLimitResult.allowed) {
        return respond.error(rateLimitResult.error || "Rate limit exceeded", "RATE_LIMITED", {
          status: rateLimitResult.status
        });
      }

      // Check lockout
      const lockout = await checkLockout(normalizedEmail);
      if (lockout.locked) {
        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'verify_code',
          error: 'lockout_active'
        });
        return respond.error(
          `Too many attempts. Please wait ${lockout.retryAfter} seconds.`,
          "RATE_LIMITED",
          { status: 429 }
        );
      }

      // Find the most recent pending code for this email
      if (!isFirebaseConfigured) {
        // Development fallback - accept any 6-digit code
        logger.warn('Firebase not configured, using development mode verification');
        if (normalizedCode.length === 6 && /^\d+$/.test(normalizedCode)) {
          // Create session in dev mode
          return await createSessionResponse(normalizedEmail, schoolId, true, respond);
        }
        return respond.error("Invalid code", "INVALID_CODE", { status: 400 });
      }

      const pendingCodes = await dbAdmin
        .collection('verification_codes')
        .where('email', '==', normalizedEmail)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (pendingCodes.empty) {
        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'verify_code',
          error: 'no_pending_code'
        });
        return respond.error("Invalid or expired code. Please request a new one.", "INVALID_CODE", { status: 400 });
      }

      const codeDoc = pendingCodes.docs[0];
      const codeData = codeDoc.data();

      // Check if code has expired
      const expiresAt = codeData.expiresAt?.toDate?.() || new Date(codeData.expiresAt);
      if (new Date() > expiresAt) {
        await codeDoc.ref.update({ status: 'expired' });
        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'verify_code',
          error: 'code_expired'
        });
        return respond.error("Code has expired. Please request a new one.", "CODE_EXPIRED", { status: 400 });
      }

      // Check attempt count
      const currentAttempts = codeData.attempts || 0;
      if (currentAttempts >= MAX_ATTEMPTS_PER_CODE) {
        await codeDoc.ref.update({
          status: 'burned',
          burnedReason: 'max_attempts'
        });
        await applyLockout(normalizedEmail);
        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'verify_code',
          error: 'max_attempts_exceeded'
        });
        return respond.error(
          "Too many incorrect attempts. Please request a new code.",
          "MAX_ATTEMPTS",
          { status: 429 }
        );
      }

      // Increment attempt count BEFORE verification (prevents race conditions)
      await codeDoc.ref.update({
        attempts: currentAttempts + 1,
        lastAttemptAt: new Date()
      });

      // Verify the code
      const inputHash = hashCode(normalizedCode);
      if (inputHash !== codeData.codeHash) {
        const remainingAttempts = MAX_ATTEMPTS_PER_CODE - currentAttempts - 1;

        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'verify_code',
          error: 'invalid_code',
          attemptNumber: currentAttempts + 1
        });

        if (remainingAttempts > 0) {
          return respond.error(
            `Invalid code. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.`,
            "INVALID_CODE",
            { status: 400 }
          );
        } else {
          // This was the last attempt
          await codeDoc.ref.update({
            status: 'burned',
            burnedReason: 'max_attempts'
          });
          await applyLockout(normalizedEmail);
          return respond.error(
            "Too many incorrect attempts. Please request a new code.",
            "MAX_ATTEMPTS",
            { status: 429 }
          );
        }
      }

      // Code is valid! Mark it as verified
      await codeDoc.ref.update({
        status: 'verified',
        verifiedAt: new Date()
      });

      // Create session
      const response = await createSessionResponse(normalizedEmail, codeData.campusId || schoolId, false, respond);

      await auditAuthEvent('success', request as unknown as NextRequest, {
        operation: 'verify_code'
      });

      logger.info('Code verified successfully', {
        email: normalizedEmail.replace(/(.{3}).*@/, '$1***@'),
        campusId: codeData.campusId
      });

      return response;

    } catch (error) {
      await auditAuthEvent('failure', request as unknown as NextRequest, {
        operation: 'verify_code',
        error: error instanceof Error ? error.message : 'unknown'
      });
      throw error;
    }
  }
);

/**
 * Create session and return response with cookie
 */
async function createSessionResponse(
  email: string,
  campusId: string,
  isDevMode: boolean,
  _respond: typeof ResponseFormatter
): Promise<NextResponse> {
  // Get or create user
  let userId: string;
  let needsOnboarding = true;
  let isAdmin = false;

  if (isFirebaseConfigured) {
    // Check if user exists
    const existingUsers = await dbAdmin
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (existingUsers.empty) {
      // Create new user
      const userRef = dbAdmin.collection('users').doc();
      userId = userRef.id;

      await userRef.set({
        id: userId,
        email,
        campusId,
        schoolId: campusId,
        emailVerified: true,
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      needsOnboarding = true;
    } else {
      // Update existing user
      const userDoc = existingUsers.docs[0];
      userId = userDoc.id;
      const userData = userDoc.data();

      await userDoc.ref.update({
        emailVerified: true,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Check multiple indicators for onboarding completion
      needsOnboarding = !(
        userData?.onboardingCompleted ||
        userData?.onboardingComplete ||
        userData?.onboardingCompletedAt ||
        (userData?.handle && userData?.fullName) // Legacy check: has handle + name means completed
      );
      isAdmin = userData?.isAdmin || false;
    }
  } else {
    // Development mode - generate a deterministic user ID
    userId = `dev-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  // Create session token
  const sessionSecret = process.env.SESSION_SECRET || 'dev-session-secret-for-local-testing-only-b3c4d0375e506cb6cb30f1d922b4062f';
  const secret = new TextEncoder().encode(sessionSecret);

  const sessionToken = await new SignJWT({
    userId,
    email,
    campusId,
    isAdmin,
    onboardingCompleted: !needsOnboarding,
    verifiedAt: new Date().toISOString(),
    sessionId: `session-${Date.now()}`,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  // Create response
  const response = NextResponse.json({
    success: true,
    needsOnboarding,
    user: {
      id: userId,
      email,
      campusId,
      onboardingCompleted: !needsOnboarding,
    },
  });

  // Set session cookie
  response.cookies.set('hive_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });

  logger.info('Session created via code verification', {
    userId,
    needsOnboarding,
    isDevMode,
  });

  return response;
}
