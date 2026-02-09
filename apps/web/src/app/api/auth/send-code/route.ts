import { type NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { createHash, randomInt } from 'crypto';
import { dbAdmin, isFirebaseConfigured } from "@/lib/firebase-admin";
import { getSchoolFromEmailAsync, type SchoolLookupResult } from "@/lib/campus-context";
import { auditAuthEvent } from "@/lib/production-auth";
import { currentEnvironment } from "@/lib/env";
import { validateWithSecurity, ApiSchemas } from "@/lib/secure-input-validation";
import { enforceRateLimit } from "@/lib/secure-rate-limiter";
import { logger } from "@/lib/logger";
import { withValidation, type ResponseFormatter } from "@/lib/middleware";
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { validateOrigin } from "@/lib/security-middleware";
import { Resend } from 'resend';
import { isDevAuthBypassAllowed, logDevCode } from "@/lib/dev-auth-bypass";

// Firebase Client SDK for school validation fallback
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore as getClientFirestore, doc, getDoc } from 'firebase/firestore';

// Security constants
const CODE_TTL_SECONDS = 600; // 10 minutes
const MAX_CODES_PER_EMAIL_PER_HOUR = 10; // Temporarily increased for testing

// Access gate feature flag - enable limited access mode
const ACCESS_GATE_ENABLED = process.env.NEXT_PUBLIC_ACCESS_GATE_ENABLED === 'true';

// Firebase config for Client SDK fallback
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseClientApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig, 'server-client');
}

function getClientDb() {
  return getClientFirestore(getFirebaseClientApp());
}

const sendCodeSchema = z.object({
  email: ApiSchemas.magicLinkRequest.shape.email,
  schoolId: z.string()
    .max(50, "School ID too long")
    .regex(/^[a-zA-Z0-9_-]*$/, "Invalid school ID format")
    .optional(),
  mode: z.enum(['campus', 'global']).optional(),
});

interface SchoolData {
  domain: string;
  name: string;
  id: string;
  active?: boolean;
}

/**
 * Generate a cryptographically secure 6-digit code
 */
function generateSecureCode(): string {
  // randomInt is cryptographically secure and avoids modulo bias
  return randomInt(100000, 999999).toString();
}

/**
 * Hash code with SHA256 for storage
 */
function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/**
 * Invalidate any existing pending codes for this email
 */
async function invalidatePreviousCodes(email: string): Promise<void> {
  // DEV BYPASS: Skip code invalidation in development
  if (currentEnvironment === 'development') return;
  if (!isFirebaseConfigured) return;

  const pendingCodes = await dbAdmin
    .collection('verification_codes')
    .where('email', '==', email.toLowerCase())
    .where('status', '==', 'pending')
    .get();

  const batch = dbAdmin.batch();
  pendingCodes.docs.forEach(doc => {
    batch.update(doc.ref, {
      status: 'burned',
      burnedReason: 'superseded'
    });
  });

  if (!pendingCodes.empty) {
    await batch.commit();
  }
}

/**
 * Check rate limit for code generation (per email)
 */
async function checkEmailRateLimit(email: string): Promise<boolean> {
  // DEV BYPASS: Skip rate limit check in development
  if (currentEnvironment === 'development') return true;
  if (!isFirebaseConfigured) return true;

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentCodes = await dbAdmin
    .collection('verification_codes')
    .where('email', '==', email.toLowerCase())
    .where('createdAt', '>=', hourAgo)
    .get();

  return recentCodes.size < MAX_CODES_PER_EMAIL_PER_HOUR;
}

/**
 * Check if email is whitelisted for access during gated launch
 */
async function checkAccessWhitelist(email: string): Promise<boolean> {
  // If gate is disabled, allow all
  if (!ACCESS_GATE_ENABLED) {
    return true;
  }

  // Always allow in development
  if (currentEnvironment === 'development') {
    return true;
  }

  if (!isFirebaseConfigured) {
    return true;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Check Firestore whitelist collection
    const whitelistDoc = await dbAdmin
      .collection('access_whitelist')
      .doc(normalizedEmail)
      .get();

    if (whitelistDoc.exists && whitelistDoc.data()?.active === true) {
      logger.info('Access whitelist: Email allowed', {
        email: email.replace(/(.{3}).*@/, '$1***@'),
      });
      return true;
    }

    logger.info('Access whitelist: Email not whitelisted', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
    });
    return false;
  } catch (error) {
    logger.error('Access whitelist check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Fail open in case of errors
    return true;
  }
}

/**
 * Validate school exists and is active
 */
async function validateSchool(schoolId: string): Promise<SchoolData | null> {
  // DEV BYPASS: Return hardcoded school data for ub-buffalo in development
  // This avoids Firebase entirely when quota is exhausted
  if (currentEnvironment === 'development' && (schoolId === 'ub-buffalo' || schoolId === 'ub')) {
    logger.info('DEV MODE: Using hardcoded school data for ub-buffalo');
    return {
      id: 'ub-buffalo',
      domain: 'buffalo.edu',
      name: 'University at Buffalo',
      active: true
    };
  }

  if (isFirebaseConfigured) {
    try {
      const schoolDoc = await dbAdmin.collection("schools").doc(schoolId).get();

      if (!schoolDoc.exists) {
        return null;
      }

      const data = schoolDoc.data();
      if (!data || data.active === false) {
        return null;
      }

      return {
        id: schoolId,
        domain: data.domain,
        name: data.name,
        active: data.active !== false
      };
    } catch (error) {
      logger.error('School validation failed (Admin SDK)', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Development fallback
  if (currentEnvironment === 'development') {
    try {
      const clientDb = getClientDb();
      const schoolRef = doc(clientDb, 'schools', schoolId);
      const schoolSnap = await getDoc(schoolRef);

      if (!schoolSnap.exists()) {
        if (schoolId === 'ub-buffalo' || schoolId === 'ub') {
          return {
            id: 'ub-buffalo',
            domain: 'buffalo.edu',
            name: 'University at Buffalo',
            active: true
          };
        }
        return null;
      }

      const data = schoolSnap.data();
      if (!data || data.active === false) {
        return null;
      }

      return {
        id: schoolId,
        domain: data.domain,
        name: data.name,
        active: data.active !== false
      };
    } catch (error) {
      logger.error('School validation failed (Client SDK)', {
        error: error instanceof Error ? error.message : String(error)
      });

      if (schoolId === 'ub-buffalo' || schoolId === 'ub') {
        return {
          id: 'ub-buffalo',
          domain: 'buffalo.edu',
          name: 'University at Buffalo',
          active: true
        };
      }
    }
  }

  return null;
}

/**
 * Send verification code email via Resend (primary) or SendGrid (fallback)
 */
async function sendVerificationCodeEmail(
  email: string,
  code: string,
  schoolName: string
): Promise<boolean> {
  // In development with explicit bypass, just log the code
  if (isDevAuthBypassAllowed('send_verification_email', { email, endpoint: '/api/auth/send-code' })) {
    logDevCode(email, code);
    return true;
  }

  // Domain verified - using hello@hive.college via RESEND_FROM_EMAIL env var
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'hello@hive.college';
  const sendGridFromEmail = process.env.EMAIL_FROM || 'hello@hive.college';
  const resendApiKey = process.env.RESEND_API_KEY;
  const sendGridApiKey = process.env.SENDGRID_API_KEY;

  // Try Resend first (preferred)
  if (resendApiKey) {
    logger.info('Attempting to send email via Resend', {
      from: resendFromEmail,
      to: email.replace(/(.{3}).*@/, '$1***@'),
      apiKeyPrefix: resendApiKey.substring(0, 10) + '...',
    });

    try {
      const resend = new Resend(resendApiKey);

      const result = await resend.emails.send({
        from: `HIVE <${resendFromEmail}>`,
        to: email,
        subject: `Your HIVE verification code: ${code}`,
        html: generateVerificationCodeHtml(code, schoolName, email),
      });

      logger.info('Resend API response', {
        hasData: !!result.data,
        hasError: !!result.error,
        dataId: result.data?.id,
        errorMessage: result.error?.message,
        errorName: result.error?.name,
      });

      if (result.error) {
        const isDomainError = result.error.message?.includes('verify a domain') ||
                              result.error.message?.includes('only send testing emails');

        logger.error('Resend email failed', {
          error: result.error.message,
          errorName: result.error.name,
          component: 'send-code',
          from: resendFromEmail,
          to: email,
          isDomainVerificationIssue: isDomainError,
          hint: isDomainError ? 'Domain not verified in Resend. Go to resend.com/domains to verify hive.college' : undefined,
        });
        // Fall through to SendGrid if available
      } else if (result.data) {
        logger.info('Verification code email sent via Resend', {
          emailId: result.data.id,
          email: email.replace(/(.{3}).*@/, '$1***@'),
          schoolName,
        });
        return true;
      } else {
        logger.warn('Resend returned neither data nor error', {
          result: JSON.stringify(result),
        });
      }
    } catch (error) {
      logger.error('Resend exception thrown', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        component: 'send-code',
      });
      // Fall through to SendGrid
    }
  } else {
    logger.warn('RESEND_API_KEY not configured');
  }

  // Try SendGrid as fallback
  if (sendGridApiKey) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(sendGridApiKey);

      const msg = {
        to: email,
        from: {
          email: sendGridFromEmail,
          name: 'HIVE'
        },
        subject: `Your HIVE verification code: ${code}`,
        html: generateVerificationCodeHtml(code, schoolName, email)
      };

      await sgMail.send(msg);

      logger.info('Verification code email sent via SendGrid', {
        email: email.replace(/(.{3}).*@/, '$1***@'),
        schoolName
      });

      return true;
    } catch (error) {
      logger.error('SendGrid email failed', {
        error: error instanceof Error ? error.message : String(error),
        component: 'send-code',
      });
      return false;
    }
  }

  // No email provider configured
  logger.error('No email provider configured (need RESEND_API_KEY or SENDGRID_API_KEY)', {
    component: 'send-code',
    environment: currentEnvironment,
  });
  return false;
}

/**
 * Generate HTML email template for verification code
 * Design: Apple transactional style, dark theme
 */
function generateVerificationCodeHtml(code: string, _schoolName: string, _email: string): string {
  // Format code with spacing for readability: "427 851"
  const formattedCode = code.slice(0, 3) + ' ' + code.slice(3);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your HIVE Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 48px;">
              <span style="font-size: 15px; font-weight: 600; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.9);">HIVE</span>
            </td>
          </tr>

          <!-- Code -->
          <tr>
            <td align="center" style="padding-bottom: 16px;">
              <span style="font-size: 42px; font-weight: 600; letter-spacing: 0.15em; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;">${formattedCode}</span>
            </td>
          </tr>

          <!-- Label -->
          <tr>
            <td align="center" style="padding-bottom: 48px;">
              <span style="font-size: 15px; color: rgba(255, 255, 255, 0.5);">Verification code</span>
            </td>
          </tr>

          <!-- Expiry -->
          <tr>
            <td align="center" style="padding-bottom: 48px;">
              <span style="font-size: 13px; color: rgba(255, 255, 255, 0.35);">Expires in 10 minutes</span>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="width: 40px; height: 1px; background-color: rgba(255, 255, 255, 0.1);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <span style="font-size: 12px; color: rgba(255, 255, 255, 0.25); line-height: 1.6;">
                If you didn't request this, ignore this email.
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * POST /api/auth/send-code
 * Generate and send a 6-digit verification code
 */
export const POST = withValidation(
  sendCodeSchema,
  async (request, _context: Record<string, string | string[]>, body: z.infer<typeof sendCodeSchema>, respond: typeof ResponseFormatter) => {
    const { email, schoolId, mode } = body;
    const isGlobalMode = mode === 'global';

    try {
      // Origin validation (CSRF protection for pre-auth endpoints)
      if (!validateOrigin(request as NextRequest)) {
        await auditAuthEvent('suspicious', request as unknown as NextRequest, {
          operation: 'send_code',
          error: 'invalid_origin'
        });
        return respond.error("Invalid request origin", "FORBIDDEN", { status: 403 });
      }

      // Rate limiting - SECURITY: Use signinCode preset (10 requests per 5 min)
      const rateLimitResult = await enforceRateLimit('signinCode', request as NextRequest);
      if (!rateLimitResult.allowed) {
        return respond.error(rateLimitResult.error || "Rate limit exceeded", "RATE_LIMITED", {
          status: rateLimitResult.status
        });
      }

      // Security validation
      const validationResult = await validateWithSecurity({ email, schoolId, mode }, sendCodeSchema, {
        operation: 'send_code',
        ip: request.headers.get('x-forwarded-for') || undefined
      });

      if (!validationResult.success || validationResult.securityLevel === 'dangerous') {
        await auditAuthEvent('suspicious', request as unknown as NextRequest, {
          operation: 'send_code',
          threats: validationResult.errors?.map((e: { code: string }) => e.code).join(',') || 'unknown',
          securityLevel: validationResult.securityLevel
        });
        return respond.error("Request validation failed", "INVALID_INPUT", { status: 400 });
      }

      // Optional: Try to lookup school from email domain (for campusId association)
      // Skip in global mode (non-campus onboarding).
      let schoolLookup: SchoolLookupResult | null = null;
      if (!isGlobalMode) {
        try {
          schoolLookup = await getSchoolFromEmailAsync(email);
        } catch {
          // Email domain doesn't match a school - that's OK now
          // Users can sign up without a campus affiliation
          logger.info('Email domain not associated with a school', {
            email: email.replace(/(.{3}).*@/, '$1***@')
          });
        }
      }

      // If schoolId was explicitly provided, validate it
      if (schoolId && !isGlobalMode) {
        const schoolData = await validateSchool(schoolId);
        if (schoolData) {
          // Create SchoolLookupResult from explicit school
          schoolLookup = {
            campusId: schoolData.id,
            status: schoolData.active ? 'active' : 'waitlist',
            schoolName: schoolData.name,
            domain: schoolData.domain,
          };
        } else {
          await auditAuthEvent('failure', request as unknown as NextRequest, {
            operation: 'send_code',
            error: 'invalid_school'
          });
          return NextResponse.json(
            ApiResponseHelper.error("School not found or inactive", "RESOURCE_NOT_FOUND"),
            { status: HttpStatus.NOT_FOUND }
          );
        }
      }

      // Check if associated school is in waitlist mode (only if we found one)
      if (!isGlobalMode && schoolLookup && schoolLookup.status === 'waitlist') {
        await auditAuthEvent('forbidden', request as unknown as NextRequest, {
          operation: 'send_code',
          error: 'school_not_active',
          schoolId: schoolLookup.campusId,
          schoolName: schoolLookup.schoolName
        });
        return NextResponse.json(
          {
            success: false,
            error: 'SCHOOL_NOT_ACTIVE',
            code: 'SCHOOL_NOT_ACTIVE',
            schoolName: schoolLookup.schoolName,
            schoolId: schoolLookup.campusId,
            message: `${schoolLookup.schoolName} isn't on HIVE yet.`
          },
          { status: HttpStatus.FORBIDDEN }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check access whitelist (gated launch)
      const whitelisted = await checkAccessWhitelist(normalizedEmail);
      if (!whitelisted) {
        await auditAuthEvent('forbidden', request as unknown as NextRequest, {
          operation: 'send_code',
          error: 'not_whitelisted'
        });
        return NextResponse.json(
          ApiResponseHelper.error(
            "HIVE is currently in limited access mode. We're opening to select student leaders first. Check back soon!",
            "ACCESS_RESTRICTED"
          ),
          { status: HttpStatus.FORBIDDEN }
        );
      }

      // Check email-specific rate limit
      const emailAllowed = await checkEmailRateLimit(normalizedEmail);
      if (!emailAllowed) {
        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'send_code',
          error: 'email_rate_limit'
        });
        return respond.error("Too many codes requested. Please wait before trying again.", "RATE_LIMITED", {
          status: 429
        });
      }

      // Invalidate any previous pending codes
      await invalidatePreviousCodes(normalizedEmail);

      // Generate and hash code
      const code = generateSecureCode();
      const codeHash = hashCode(code);

      // Log code in development for testing
      if (currentEnvironment === 'development') {
        console.warn('\n========================================');
        console.warn(`DEV OTP CODE: ${code}`);
        console.warn(`Email: ${normalizedEmail}`);
        console.warn('========================================\n');
      }

      // Store in Firestore (skip in development to avoid quota issues)
      if (isFirebaseConfigured && currentEnvironment !== 'development') {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + CODE_TTL_SECONDS * 1000);

        await dbAdmin.collection('verification_codes').add({
          email: normalizedEmail,
          codeHash,
          schoolId: schoolId || null,
          campusId: schoolLookup?.campusId || null,
          status: 'pending',
          attempts: 0,
          createdAt: now,
          expiresAt,
        });
      }

      // Send email
      const emailSent = await sendVerificationCodeEmail(normalizedEmail, code, schoolLookup?.schoolName || 'HIVE');

      if (!emailSent && currentEnvironment === 'production') {
        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'send_code',
          error: 'email_send_failed'
        });
        return NextResponse.json(
          ApiResponseHelper.error("Unable to send verification code", "INTERNAL_ERROR"),
          { status: HttpStatus.INTERNAL_SERVER_ERROR }
        );
      }

      // Audit success
      await auditAuthEvent('success', request as unknown as NextRequest, {
        operation: 'send_code'
      });

      // Mask email for logging
      const maskedEmail = normalizedEmail.replace(/(.{3}).*@/, '$1***@');

      logger.info('Verification code sent', {
        email: maskedEmail,
        campusId: schoolLookup?.campusId || undefined,
        schoolName: schoolLookup?.schoolName || 'HIVE',
        mode: isGlobalMode ? 'global' : 'campus',
      });

      // Calculate exact expiry time for countdown display
      const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000);

      return respond.success({
        message: "Verification code sent to your email",
        expiresIn: CODE_TTL_SECONDS,
        expiresAt: expiresAt.toISOString(),
      });

    } catch (error) {
      await auditAuthEvent('failure', request as unknown as NextRequest, {
        operation: 'send_code',
        error: error instanceof Error ? error.message : 'unknown'
      });
      throw error;
    }
  }
);
