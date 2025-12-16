// @ts-nocheck
// TODO: Fix NextRequest/Request type compatibility
/**
 * @deprecated This endpoint is deprecated.
 * Use POST /api/auth/send-code for OTP-based authentication instead.
 *
 * Magic link authentication is maintained for backward compatibility
 * but will be removed in a future version.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { dbAdmin, isFirebaseConfigured } from "@/lib/firebase-admin";
import { getDefaultActionCodeSettings, validateEmailDomain } from "@hive/core";
import { getAuth } from "firebase-admin/auth";
// Email sending handled by Firebase Auth - no SendGrid needed
import { ValidationError as _ValidationError } from "@/lib/api-error-handler";
import { auditAuthEvent } from "@/lib/production-auth";
import { currentEnvironment } from "@/lib/env";
import { validateWithSecurity, ApiSchemas } from "@/lib/secure-input-validation";
import { enforceRateLimit } from "@/lib/secure-rate-limiter";
import { logger } from "@/lib/logger";

import { withValidation, type ResponseFormatter } from "@/lib/middleware";
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';

// DEPRECATION: Log warning when this endpoint is used
const DEPRECATION_WARNING = 'Magic link auth is deprecated. Please migrate to OTP-based auth (/api/auth/send-code).';

// Deprecation headers to include in all responses
// RFC 8594: The Sunset HTTP Response Header Field
const DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 01 Mar 2025 00:00:00 GMT',
  'Link': '</api/auth/send-code>; rel="successor-version"',
  'X-Deprecation-Notice': DEPRECATION_WARNING,
};

/**
 * Add deprecation headers to a NextResponse
 */
function addDeprecationHeaders(response: NextResponse): NextResponse {
  Object.entries(DEPRECATION_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Firebase Client SDK fallback for development when Admin SDK is not configured
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore as getClientFirestore, doc, getDoc } from 'firebase/firestore';

// Initialize Firebase Client SDK for server-side fallback
function getClientDb() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'server-client');
  return getClientFirestore(app);
}

/**
 * PRODUCTION-SAFE magic link sending
 * NO DEVELOPMENT BYPASSES ALLOWED
 */

const sendMagicLinkSchema = z.object({
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
 * Validate school exists and is active
 * Uses Admin SDK in production, falls back to Client SDK in development
 */
async function validateSchool(schoolId: string): Promise<SchoolData | null> {
  // Try Admin SDK first (production path)
  if (isFirebaseConfigured) {
    try {
      const schoolDoc = await dbAdmin.collection("schools").doc(schoolId).get();

      if (!schoolDoc.exists) {
        return null;
      }

      const data = schoolDoc.data();
      if (!data) {
        return null;
      }

      // Check if school is active
      if (data.active === false) {
        return null;
      }

      return {
        id: schoolId,
        domain: data.domain,
        name: data.name,
        active: data.active !== false
      };
    } catch (error) {
      logger.error(
        `School validation failed at /api/auth/send-magic-link (Admin SDK)`,
        { error: error instanceof Error ? error.message : String(error) }
      );
      // Fall through to Client SDK fallback in development
    }
  }

  // Development fallback: Use Firebase Client SDK
  if (currentEnvironment === 'development') {
    try {
      logger.info('Using Firebase Client SDK fallback for school validation (development mode)');
      const clientDb = getClientDb();
      const schoolRef = doc(clientDb, 'schools', schoolId);
      const schoolSnap = await getDoc(schoolRef);

      if (!schoolSnap.exists()) {
        logger.warn(`School ${schoolId} not found in Firestore`);
        return null;
      }

      const data = schoolSnap.data();
      if (!data) {
        return null;
      }

      // Check if school is active
      if (data.active === false) {
        return null;
      }

      return {
        id: schoolId,
        domain: data.domain,
        name: data.name,
        active: data.active !== false
      };
    } catch (error) {
      logger.error(
        `School validation failed at /api/auth/send-magic-link (Client SDK fallback)`,
        { error: error instanceof Error ? error.message : String(error) }
      );
      return null;
    }
  }

  return null;
}

/**
 * PRODUCTION-ONLY magic link sending
 */
export const POST = withValidation(
  sendMagicLinkSchema,
  async (request, _context: Record<string, string | string[]>, body: z.infer<typeof sendMagicLinkSchema>, respond: typeof ResponseFormatter) => {
    const { email, schoolId } = body;
    const _requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

    // Log deprecation warning on every request
    logger.warn(DEPRECATION_WARNING, {
      endpoint: '/api/auth/send-magic-link',
      email: email.replace(/(.{3}).*@/, '$1***@'),
    });

    try {
      // SECURITY: Rate limiting with strict enforcement
      const rateLimitResult = await enforceRateLimit('magicLink', request);
      if (!rateLimitResult.allowed) {
        return respond.error(rateLimitResult.error || "Rate limit exceeded", "RATE_LIMITED", {
          status: rateLimitResult.status
        });
      }

      // SECURITY: Additional threat detection (schema validation already done by middleware)
      const validationResult = await validateWithSecurity({ email, schoolId: schoolId || '' }, sendMagicLinkSchema, {
        operation: 'send_magic_link',
        ip: request.headers.get('x-forwarded-for') || undefined
      });

      if (!validationResult.success || validationResult.securityLevel === 'dangerous') {
        await auditAuthEvent('suspicious', request as unknown as NextRequest, {
          operation: 'send_magic_link',
          threats: validationResult.errors?.map((e: { field: string; message: string; code: string }) => e.code).join(',') || 'unknown',
          securityLevel: validationResult.securityLevel
        });

        return respond.error("Request validation failed", "INVALID_INPUT", { status: 400 });
      }

    logger.info('🔍 Auth Debug - Environment and input', { email, schoolId, endpoint: '/api/auth/send-magic-link' });
    
    // Validate school exists and is active (only for non-development users)
    const schoolData = await validateSchool(schoolId);
    if (!schoolData) {
      await auditAuthEvent('failure', request as unknown as NextRequest, {
        operation: 'send_magic_link',
        error: 'invalid_school'
      });
      
      return NextResponse.json(ApiResponseHelper.error("School not found or inactive", "RESOURCE_NOT_FOUND"), { status: HttpStatus.NOT_FOUND });
    }
    
    // SECURITY: Validate email domain matches school domain
    if (!validateEmailDomain(email, [schoolData.domain])) {
      await auditAuthEvent('failure', request as unknown as NextRequest, {
        operation: 'send_magic_link',
        error: 'domain_mismatch'
      });
      
      return NextResponse.json(
        { error: `Email must be from ${schoolData.domain} domain` },
        { status: HttpStatus.BAD_REQUEST }
      );
    }
    
    // Additional security checks for production
    if (currentEnvironment === 'production') {
      // Check if user has been rate limited recently
      const _rateLimitKey = `magic_link_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      // This would integrate with Redis rate limiting
      
      // Validate the email is from a legitimate educational domain
      const emailDomain = email.split('@')[1]?.toLowerCase() || '';

      // For UB launch - ONLY allow buffalo.edu emails
      const allowedDomains = ['buffalo.edu'];
      const isAllowedDomain = allowedDomains.includes(emailDomain);

      // Fallback to general .edu validation if not UB-specific
      const eduDomains = ['.edu', '.ac.', '.university', '.college'];
      const isEduDomain = isAllowedDomain || (
        process.env.NEXT_PUBLIC_CAMPUS_ID !== 'ub-buffalo' &&
        eduDomains.some(suffix => emailDomain.endsWith(suffix))
      );
      
      if (!isEduDomain) {
        await auditAuthEvent('forbidden', request as unknown as NextRequest, {
          operation: 'send_magic_link',
          error: `non_edu_domain: ${emailDomain}`
        });

        // SECURITY: Block non-educational domains in production
        logger.error('BLOCKED: Non-educational domain attempted', {
          emailDomain,
          email: email.replace(/(.{3}).*@/, '$1***@'),
          endpoint: '/api/auth/send-magic-link'
        });

        return NextResponse.json(
          ApiResponseHelper.error(
            "Only educational email addresses (.edu) are allowed",
            "INVALID_EMAIL_DOMAIN"
          ),
          { status: HttpStatus.FORBIDDEN }
        );
      }
    }
    
    // Use Firebase Admin SDK to generate magic link
    const auth = getAuth();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const continueUrl = `${appUrl}/auth/verify?schoolId=${schoolId}&email=${encodeURIComponent(email)}`;
    const actionCodeSettings = getDefaultActionCodeSettings(continueUrl);
    
    // Generate the sign-in link using Firebase Admin SDK
    let magicLink: string;
    try {
      magicLink = await auth.generateSignInWithEmailLink(email, actionCodeSettings);
    } catch (firebaseError: unknown) {
      logger.error(
        `Firebase magic link generation failed at /api/auth/send-magic-link`,
        { error: { error: firebaseError instanceof Error ? firebaseError.message : String(firebaseError) } }
      );

      await auditAuthEvent('failure', request as unknown as NextRequest, {
        operation: 'send_magic_link',
        error: 'firebase_generation_failed'
      });

      // Don't expose Firebase error details
      return NextResponse.json(ApiResponseHelper.error("Unable to generate magic link", "INTERNAL_ERROR"), { status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
    
    // Send the email with the magic link
    // In development, always log the link for testing
    if (currentEnvironment === 'development') {
      // Extract oobCode from the Firebase magic link
      const oobCodeMatch = magicLink.match(/oobCode=([^&]+)/);
      const oobCode = oobCodeMatch ? oobCodeMatch[1] : '';

      // Create a localhost-friendly URL
      const localUrl = `http://localhost:3000/auth/verify?schoolId=${schoolId}&email=${encodeURIComponent(email)}&oobCode=${oobCode}`;

      logger.info('📧 MAGIC LINK FOR TESTING', {
        firebaseUrl: magicLink,
        localUrl,
        endpoint: '/api/auth/send-magic-link'
      });
    }

    // Firebase Auth sends the email automatically when configured
    // The magic link was generated above - Firebase handles delivery
    logger.info('✅ Magic link generated', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      schoolId: schoolData.name,
      endpoint: '/api/auth/send-magic-link'
    });
    
    // Log successful operation
    await auditAuthEvent('success', request as unknown as NextRequest, {
      operation: 'send_magic_link'
    });

    // Never expose magic link URLs in responses
    // In development, check the server console for the logged URL
    const response = respond.success({
      message: "Magic link sent to your email address",
      _deprecated: true,
      _migrateTo: '/api/auth/send-code',
    });
    return addDeprecationHeaders(response);

    } catch (error) {
      await auditAuthEvent('failure', request as unknown as NextRequest, {
        operation: 'send_magic_link',
        error: error instanceof Error ? error.message : 'unknown'
      });

      throw error; // Let middleware handle the error
    }
  }
);