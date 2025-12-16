/**
 * @deprecated This endpoint is deprecated.
 * Use POST /api/auth/verify-code for OTP-based authentication instead.
 *
 * Magic link verification is maintained for backward compatibility
 * but will be removed in a future version.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { type Timestamp as _Timestamp } from "firebase-admin/firestore";
import { handleApiError, AuthenticationError as _AuthenticationError, ValidationError } from "@/lib/api-error-handler";
import { auditAuthEvent } from "@/lib/production-auth";
import { currentEnvironment } from "@/lib/env";
import { validateWithSecurity, ApiSchemas } from "@/lib/secure-input-validation";
import { enforceRateLimit } from "@/lib/secure-rate-limiter";
import { logger } from "@/lib/structured-logger";
import { ApiResponseHelper, HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";
import { createSession, setSessionCookie } from "@/lib/session";
import { isAdminEmail, shouldGrantAdmin, getPermissionsForRole, logAdminOperation } from '@/lib/admin/roles';

// DEPRECATION: Log warning when this endpoint is used
const DEPRECATION_WARNING = 'Magic link auth is deprecated. Please migrate to OTP-based auth (/api/auth/verify-code).';

// Deprecation headers to include in all responses
const DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 01 Mar 2025 00:00:00 GMT',
  'Link': '</api/auth/verify-code>; rel="successor-version"',
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

/**
 * PRODUCTION-SAFE magic link verification
 * No test bypasses - all authentication goes through Firebase
 * @deprecated Use /api/auth/verify-code instead
 */

const verifyMagicLinkSchema = z.object({
  email: ApiSchemas.magicLinkVerify.shape.email,
  schoolId: z.string()
    .min(1, "School ID is required")
    .max(50, "School ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid school ID format"),
  token: ApiSchemas.magicLinkVerify.shape.token
});

/**
 * Validate school domain for security
 */
async function validateSchoolDomain(email: string, schoolId: string): Promise<boolean> {
  try {
    const schoolDoc = await dbAdmin.collection("schools").doc(schoolId).get();
    
    if (!schoolDoc.exists) {
      return false;
    }
    
    const schoolData = schoolDoc.data();
    if (!schoolData?.domain) {
      return false;
    }
    
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const schoolDomain = schoolData.domain.toLowerCase();
    
    return emailDomain === schoolDomain;
  } catch (error) {
    logger.error('School domain validation failed', { error: { error: error instanceof Error ? error.message : String(error) }, endpoint: '/api/auth/verify-magic-link' });
    return false;
  }
}

/**
 * PRODUCTION-ONLY magic link verification
 */
export async function POST(request: NextRequest) {
  const _requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  // Log deprecation warning on every request
  logger.warn(DEPRECATION_WARNING, {
    endpoint: '/api/auth/verify-magic-link',
  });

  try {
    // SECURITY: Rate limiting with strict enforcement
    const rateLimitResult = await enforceRateLimit('authentication', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: rateLimitResult.status,
          headers: rateLimitResult.headers
        }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => {
      throw new ValidationError('Invalid JSON in request body');
    });

    // SECURITY: Comprehensive input validation with threat detection
    const validationResult = await validateWithSecurity(body, verifyMagicLinkSchema, {
      operation: 'verify_magic_link',
      ip: request.headers.get('x-forwarded-for') || undefined
    });

    if (!validationResult.success || validationResult.securityLevel === 'dangerous') {
      await auditAuthEvent('suspicious', request, {
        operation: 'verify_magic_link',
        threats: validationResult.errors?.map((e: { field: string; message: string; code: string }) => e.code).join(',') || 'unknown',
        securityLevel: validationResult.securityLevel
      });

      return NextResponse.json(ApiResponseHelper.error("Request validation failed", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    if (!validationResult.data) {
      return NextResponse.json(ApiResponseHelper.error("Invalid validation data", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    const { email, schoolId, token } = validationResult.data;

    // Ensure all required fields are strings
    if (typeof email !== 'string' || typeof token !== 'string') {
      return NextResponse.json(ApiResponseHelper.error("Invalid input types", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    // NOTE: Dev token bypass removed for security
    // All authentication now goes through Firebase verification

    // SECURITY: Additional environment-based checks
    if (currentEnvironment === 'production') {
      // In production, validate school domain strictly
      if (!schoolId || typeof schoolId !== 'string') {
        return NextResponse.json(ApiResponseHelper.error("School ID is required", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
      }
      // At this point, schoolId is guaranteed to be a string
      const isValidDomain = await validateSchoolDomain(email, schoolId);
      if (!isValidDomain) {
        await auditAuthEvent('failure', request, {
          operation: 'verify_magic_link',
          error: 'invalid_school_domain'
        });

        return NextResponse.json(ApiResponseHelper.error("Email domain does not match school", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
      }
    }
    
    // PRODUCTION: Use Firebase Admin SDK for magic link verification
    const auth = getAuth();
    
    // Verify the magic link token
    let actionCodeInfo;

    try {
      // Verify as a Firebase action code (magic link)
      actionCodeInfo = await (auth as unknown as { checkActionCode: (token: string) => Promise<{ data: { email: string } }> }).checkActionCode(token);
    } catch (firebaseError) {
      logger.error('Firebase action code verification failed',
        { error: { error: firebaseError instanceof Error ? firebaseError.message : String(firebaseError) }, endpoint: '/api/auth/verify-magic-link' }
      );

      await auditAuthEvent('failure', request, {
        operation: 'verify_magic_link',
        error: 'invalid_magic_link_token'
      });

      // Don't expose Firebase error details
      return NextResponse.json(ApiResponseHelper.error("Invalid or expired magic link", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    // Verify the email matches
    if (actionCodeInfo.data.email !== email) {
      await auditAuthEvent('failure', request, {
        operation: 'verify_magic_link',
        error: 'email_mismatch'
      });

      return NextResponse.json(ApiResponseHelper.error("Email mismatch", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    // Apply the action code to complete the sign-in
    await (auth as unknown as { applyActionCode: (token: string) => Promise<void> }).applyActionCode(token);
    
    // Get or create user record
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email!);
    } catch {
      // Create new user if they don't exist
      userRecord = await auth.createUser({
        email,
        emailVerified: true });
    }
    
    // Ensure email is verified
    if (!userRecord.emailVerified) {
      await auth.updateUser(userRecord.uid, {
        emailVerified: true
      });
    }
    
    // Check if user document exists in Firestore
    const userDoc = await dbAdmin.collection("users").doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      // New user - create basic profile and require onboarding
      const now = new Date();
      const normalizedCampusId = schoolId || 'ub-buffalo';

      await dbAdmin.collection("users").doc(userRecord.uid).set({
        // Core identity
        id: userRecord.uid,
        email,
        emailVerified: true,

        // Campus association (standardized naming)
        campusId: normalizedCampusId,
        schoolId: normalizedCampusId, // Keep both for compatibility

        // Timestamps
        createdAt: now,
        updatedAt: now,

        // Profile fields - to be filled during onboarding
        fullName: null, // null indicates "not set" vs empty string
        handle: null,
        major: null,
        graduationYear: null,
        bio: null,
        avatarUrl: null,

        // Status flags
        onboardingCompleted: false,
        isPublic: false,
        isAdmin: false,
        isBuilder: false,
      });
      
      await auditAuthEvent('success', request, {
        userId: userRecord.uid,
        operation: 'verify_magic_link'
      });

      // Create signed JWT session
      const sessionToken = await createSession({
        userId: userRecord.uid,
        email,
        campusId: schoolId || 'ub-buffalo',
        isAdmin: isAdminEmail(email)
      });

      const response = NextResponse.json({
        success: true,
        needsOnboarding: true,
        userId: userRecord.uid,
        _deprecated: true,
        _migrateTo: '/api/auth/verify-code',
      });

      // Set signed session cookie and add deprecation headers
      return addDeprecationHeaders(setSessionCookie(response, sessionToken, {
        isAdmin: isAdminEmail(email)
      }));
    } else {
      // Existing user - they can proceed to app
      await auditAuthEvent('success', request, {
        userId: userRecord.uid,
        operation: 'verify_magic_link'
      });

      // Check if user should be granted admin permissions
      // SECURITY: Uses shouldGrantAdmin() which checks if auto-grant is enabled
      const adminCheck = shouldGrantAdmin(email);
      if (adminCheck.shouldGrant && adminCheck.role) {
        try {
          // Check if they already have admin claims
          const currentClaims = userRecord.customClaims || {};
          if (!currentClaims.isAdmin) {
            // Log admin grant attempt for audit
            logAdminOperation('admin_grant_attempt', userRecord.uid, email, {
              role: adminCheck.role,
              reason: adminCheck.reason,
            });

            const permissions = getPermissionsForRole(adminCheck.role);

            // Set admin claims
            await auth.setCustomUserClaims(userRecord.uid, {
              ...currentClaims,
              role: adminCheck.role,
              permissions,
              isAdmin: true,
              adminSince: new Date().toISOString()
            });

            // Update user document
            await userDoc.ref.set({
              isAdmin: true,
              adminRole: adminCheck.role,
              adminPermissions: permissions,
              adminGrantedAt: new Date().toISOString(),
              adminGrantedBy: 'auto-grant-login'
            }, { merge: true });

            // Log successful admin grant
            logAdminOperation('admin_grant_success', userRecord.uid, email, {
              role: adminCheck.role,
              permissions,
            });
          }
        } catch (adminError) {
          // Log failed admin grant attempt
          logAdminOperation('admin_grant_failed', userRecord.uid, email, {
            error: adminError instanceof Error ? adminError.message : String(adminError),
          });
          // Don't fail the login if admin grant fails
        }
      } else if (isAdminEmail(email)) {
        // Email is in admin list but auto-grant is disabled
        logger.warn('Admin auto-grant blocked', {
          userId: userRecord.uid,
          reason: adminCheck.reason,
          email: email.replace(/(.{3}).*@/, '$1***@'),
        });
      }

      // Create signed JWT session
      const isAdmin = isAdminEmail(email);
      const sessionToken = await createSession({
        userId: userRecord.uid,
        email,
        campusId: schoolId || 'ub-buffalo',
        isAdmin
      });

      const response = NextResponse.json({
        success: true,
        needsOnboarding: false,
        userId: userRecord.uid,
        isAdmin, // Include admin flag in response
        _deprecated: true,
        _migrateTo: '/api/auth/verify-code',
      });

      // Set signed session cookie and add deprecation headers
      return addDeprecationHeaders(setSessionCookie(response, sessionToken, { isAdmin }));
    }

  } catch (error) {
    await auditAuthEvent('failure', request, {
      operation: 'verify_magic_link',
      error: error instanceof Error ? error.message : 'unknown'
    });
    
    return handleApiError(error, request);
  }
}
