import { type NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { createHash, randomInt } from 'crypto';
import { dbAdmin, isFirebaseConfigured } from "@/lib/firebase-admin";
import { validateEmailDomain } from "@hive/core";
import { CampusEmail } from '@hive/core/server';
import { auditAuthEvent } from "@/lib/production-auth";
import { currentEnvironment } from "@/lib/env";
import { validateWithSecurity, ApiSchemas } from "@/lib/secure-input-validation";
import { enforceRateLimit } from "@/lib/secure-rate-limiter";
import { logger } from "@/lib/logger";
import { withValidation, type ResponseFormatter } from "@/lib/middleware";
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { SESSION_CONFIG } from "@/lib/session";
import { validateOrigin } from "@/lib/security-middleware";
import { Resend } from 'resend';

// Firebase Client SDK for school validation fallback
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore as getClientFirestore, doc, getDoc } from 'firebase/firestore';

// Security constants
const CODE_TTL_SECONDS = 600; // 10 minutes
const MAX_CODES_PER_EMAIL_PER_HOUR = 10; // Temporarily increased for testing

// Development mode guard - allow dev bypass for email sending in development
const ALLOW_DEV_BYPASS =
  SESSION_CONFIG.isDevelopment &&
  process.env.DEV_AUTH_BYPASS === 'true';

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
    .min(1, "School ID is required")
    .max(50, "School ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid school ID format")
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
 * Validate school exists and is active
 */
async function validateSchool(schoolId: string): Promise<SchoolData | null> {
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
  if (ALLOW_DEV_BYPASS) {
    logger.info('===========================================');
    logger.info(`DEV MODE: VERIFICATION CODE for ${email}: ${code}`);
    logger.info('===========================================');
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
 */
function generateVerificationCodeHtml(code: string, schoolName: string, email: string): string {
  // Format code with spacing for readability: "427 851"
  const formattedCode = code.slice(0, 3) + ' ' + code.slice(3);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your HIVE Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0A0A0B;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #FFD700;
      text-decoration: none;
    }
    .content {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 16px 0;
      color: #ffffff;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
      margin: 16px 0;
    }
    .school-badge {
      display: inline-block;
      background: rgba(255, 215, 0, 0.1);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 8px;
      padding: 8px 16px;
      margin: 20px 0;
      color: #FFD700;
      font-weight: 600;
    }
    .code-box {
      background: rgba(255, 215, 0, 0.1);
      border: 2px solid #FFD700;
      border-radius: 12px;
      padding: 24px 32px;
      margin: 32px 0;
      display: inline-block;
    }
    .code {
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #FFD700;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    }
    .expiry {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 24px;
    }
    .warning {
      background: rgba(255, 59, 48, 0.1);
      border: 1px solid rgba(255, 59, 48, 0.3);
      border-radius: 8px;
      padding: 12px;
      margin: 20px 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 14px;
    }
    .footer a {
      color: #FFD700;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://hive.college" class="logo">HIVE</a>
    </div>

    <div class="content">
      <h1>Your verification code</h1>

      <div class="school-badge">${schoolName}</div>

      <p>Enter this code to sign in to HIVE:</p>

      <div class="code-box">
        <span class="code">${formattedCode}</span>
      </div>

      <p class="expiry">This code expires in 10 minutes.</p>

      <div class="warning">
        If you didn't request this code, you can safely ignore this email.
      </div>
    </div>

    <div class="footer">
      <p>
        Sent to ${email}<br>
        <a href="https://hive.college/privacy">Privacy</a> &bull;
        <a href="https://hive.college/terms">Terms</a>
      </p>
      <p style="margin-top: 20px;">
        &copy; 2025 HIVE. Connect. Coordinate. Thrive.
      </p>
    </div>
  </div>
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
    const { email, schoolId } = body;

    try {
      // Origin validation (CSRF protection for pre-auth endpoints)
      if (!validateOrigin(request as NextRequest)) {
        await auditAuthEvent('suspicious', request as unknown as NextRequest, {
          operation: 'send_code',
          error: 'invalid_origin'
        });
        return respond.error("Invalid request origin", "FORBIDDEN", { status: 403 });
      }

      // Rate limiting
      const rateLimitResult = await enforceRateLimit('magicLink', request as NextRequest);
      if (!rateLimitResult.allowed) {
        return respond.error(rateLimitResult.error || "Rate limit exceeded", "RATE_LIMITED", {
          status: rateLimitResult.status
        });
      }

      // Security validation
      const validationResult = await validateWithSecurity({ email, schoolId }, sendCodeSchema, {
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

      // Validate school
      const schoolData = await validateSchool(schoolId);
      if (!schoolData) {
        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'send_code',
          error: 'invalid_school'
        });
        return NextResponse.json(
          ApiResponseHelper.error("School not found or inactive", "RESOURCE_NOT_FOUND"),
          { status: HttpStatus.NOT_FOUND }
        );
      }

      // Validate email domain
      if (!validateEmailDomain(email, [schoolData.domain])) {
        await auditAuthEvent('failure', request as unknown as NextRequest, {
          operation: 'send_code',
          error: 'domain_mismatch'
        });
        return NextResponse.json(
          { error: `Email must be from ${schoolData.domain} domain` },
          { status: HttpStatus.BAD_REQUEST }
        );
      }

      // Validate campus email
      const campusEmailResult = CampusEmail.create(email);
      if (campusEmailResult.isFailure) {
        await auditAuthEvent('forbidden', request as unknown as NextRequest, {
          operation: 'send_code',
          error: `invalid_campus_email: ${campusEmailResult.error}`
        });
        return NextResponse.json(
          ApiResponseHelper.error(
            campusEmailResult.error || "Only supported campus emails are allowed",
            "INVALID_EMAIL_DOMAIN"
          ),
          { status: HttpStatus.FORBIDDEN }
        );
      }

      const campusEmail = campusEmailResult.getValue();
      const normalizedEmail = email.toLowerCase().trim();

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

      // Store in Firestore
      if (isFirebaseConfigured) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + CODE_TTL_SECONDS * 1000);

        await dbAdmin.collection('verification_codes').add({
          email: normalizedEmail,
          codeHash,
          schoolId,
          campusId: campusEmail.campusId,
          status: 'pending',
          attempts: 0,
          createdAt: now,
          expiresAt,
        });
      }

      // Send email
      const emailSent = await sendVerificationCodeEmail(normalizedEmail, code, schoolData.name);

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

      logger.info('Verification code sent', {
        email: campusEmail.getMasked(),
        emailType: campusEmail.emailType,
        campusId: campusEmail.campusId,
        schoolName: schoolData.name
      });

      return respond.success({
        message: "Verification code sent to your email",
        expiresIn: CODE_TTL_SECONDS
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
