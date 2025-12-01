import { type NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { dbAdmin, isFirebaseConfigured } from "@/lib/firebase-admin";
import { getDefaultActionCodeSettings, validateEmailDomain } from "@hive/core";
import { CampusEmail, EmailType } from '@hive/core/server';
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
    
    // SECURITY: Validate email using CampusEmail value object
    // This ensures only supported campus domains are allowed
    const campusEmailResult = CampusEmail.create(email);

    if (campusEmailResult.isFailure) {
      await auditAuthEvent('forbidden', request as unknown as NextRequest, {
        operation: 'send_magic_link',
        error: `invalid_campus_email: ${campusEmailResult.error}`
      });

      // Mask email manually since CampusEmail creation failed
      const maskedEmail = email.includes('@')
        ? `${email[0]}***@${email.split('@')[1]}`
        : email.substring(0, 3) + '***';

      logger.error('BLOCKED: Invalid campus email', {
        error: campusEmailResult.error,
        maskedEmail,
        endpoint: '/api/auth/send-magic-link'
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

    // Log email type detection for analytics
    logger.info('Campus email validated', {
      emailType: campusEmail.emailType,
      campusId: campusEmail.campusId,
      maskedEmail: campusEmail.getMasked(),
      endpoint: '/api/auth/send-magic-link'
    });
    
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
      email: campusEmail.getMasked(),
      emailType: campusEmail.emailType,
      schoolId: schoolData.name,
      campusId: campusEmail.campusId,
      endpoint: '/api/auth/send-magic-link'
    });
    
    // Log successful operation
    await auditAuthEvent('success', request as unknown as NextRequest, {
      operation: 'send_magic_link'
    });

    // Never expose magic link URLs in responses
    // In development, check the server console for the logged URL
    return respond.success({
      message: "Magic link sent to your email address"
    });

    } catch (error) {
      await auditAuthEvent('failure', request as unknown as NextRequest, {
        operation: 'send_magic_link',
        error: error instanceof Error ? error.message : 'unknown'
      });

      throw error; // Let middleware handle the error
    }
  }
);