/**
 * @deprecated Use /api/auth/complete-entry instead
 * This endpoint is maintained for backward compatibility.
 * New integrations should use /api/auth/complete-entry.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { withAuthValidationAndErrors, respond, getUserId, type ResponseFormatter, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { createSession, setSessionCookie, getSession, SESSION_CONFIG } from '@/lib/session';
import { checkHandleAvailabilityInTransaction, reserveHandleInTransaction, validateHandleFormat } from '@/lib/handle-service';
import { logger } from '@/lib/logger';
import { SecureSchemas } from '@/lib/secure-input-validation';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';
import {
  incrementMemberCount,
  isShardedMemberCountEnabled
} from '@/lib/services/sharded-member-counter.service';

// DEPRECATION: This endpoint is deprecated in favor of /api/auth/complete-entry
const DEPRECATION_MESSAGE = 'This endpoint is deprecated. Use /api/auth/complete-entry instead.';

// Development mode guard - ONLY allow dev bypass when ALL conditions are met:
// 1. NODE_ENV is explicitly 'development'
// 2. Firebase is not configured
// 3. DEV_AUTH_BYPASS env var is set to 'true' (explicit opt-in)
const ALLOW_DEV_BYPASS =
  SESSION_CONFIG.isDevelopment &&
  !isFirebaseConfigured &&
  process.env.DEV_AUTH_BYPASS === 'true';

// Use SecureSchemas for security validation on user inputs
// UPDATED Jan 12, 2026: Made major and graduationYear OPTIONAL
// Rationale: Don't collect data we're not using to deliver value
// These fields can be collected later via progressive profiling when we build features that use them
const schema = z.object({
  fullName: SecureSchemas.name,
  userType: z.enum(['student', 'alumni', 'faculty']),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  // OPTIONAL: Will collect via progressive profiling when we build "Find students in your program"
  major: z.string().max(100).optional().default(''),
  // OPTIONAL: Only required for alumni (past year) - students can add later
  graduationYear: z.number().int().min(1950).max(new Date().getFullYear() + 10).optional().nullable(),
  handle: SecureSchemas.handle,
  avatarUrl: SecureSchemas.url.optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  builderRequestSpaces: z.array(SecureSchemas.id).max(10).optional(),
  consentGiven: z.boolean().refine(v => v === true, 'Consent is required'),
  academicLevel: z.enum(['undergraduate', 'graduate', 'doctoral']).optional(),
  bio: z.string().max(200).optional(),
  livingSituation: z.enum(['on-campus', 'off-campus', 'commuter', 'not-sure']).nullish(),
  // Leadership status - important for space builder requests
  isLeader: z.boolean().optional(),
  // Initial spaces to join during onboarding
  initialSpaceIds: z.array(SecureSchemas.id).max(20).optional(),
});
// NOTE: Removed graduation year validation - field is now optional
// When we add progressive profiling, we can validate at that point

type OnboardingBody = z.infer<typeof schema>;

/**
 * Infer academic level from major and graduation year
 * Graduate programs typically indicated by major name or longer timelines
 * Returns null if insufficient data to infer
 */
function inferAcademicLevel(major?: string, graduationYear?: number | null): 'undergraduate' | 'graduate' | 'doctoral' | null {
  // If no data provided, can't infer
  if (!major && !graduationYear) return null;

  const currentYear = new Date().getFullYear();
  const majorLower = (major || '').toLowerCase();

  // Graduate programs typically indicated by major name
  const gradIndicators = ['mba', 'phd', 'masters', 'md', 'jd', 'law', 'mfa', 'mph', 'msw', 'ms ', 'ma '];
  if (majorLower && gradIndicators.some(g => majorLower.includes(g))) {
    if (graduationYear) {
      const yearsToGrad = graduationYear - currentYear;
      return yearsToGrad > 4 ? 'doctoral' : 'graduate';
    }
    return 'graduate';
  }

  // Doctoral indicators
  const doctoralIndicators = ['doctoral', 'doctorate', 'phd'];
  if (majorLower && doctoralIndicators.some(d => majorLower.includes(d))) {
    return 'doctoral';
  }

  // If graduating 5+ years out, likely doctoral
  if (graduationYear) {
    const yearsToGrad = graduationYear - currentYear;
    if (yearsToGrad > 5) return 'doctoral';
  }

  // Default undergraduate if we have any data
  return 'undergraduate';
}

// Cast schema to match inferred type - the default() transforms make the Zod type inference tricky
export const POST = withAuthValidationAndErrors(schema as z.ZodType<OnboardingBody>, async (request, _ctx: Record<string, string | string[]>, body: OnboardingBody, _respondFmt: typeof ResponseFormatter) => {
  // Log deprecation warning
  logger.warn('Deprecated endpoint called: /api/auth/complete-onboarding', {
    component: 'complete-onboarding',
    deprecation: DEPRECATION_MESSAGE,
    suggestedEndpoint: '/api/auth/complete-entry',
  });

  // Rate limit: 5 onboarding attempts per hour per IP
  const rateLimitResult = await enforceRateLimit('authStrict', request as NextRequest);
  if (!rateLimitResult.allowed) {
    logger.warn('Complete-onboarding rate limit exceeded', {
      component: 'complete-onboarding',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return respond.error(
      rateLimitResult.error || 'Too many attempts. Please try again later.',
      'RATE_LIMITED',
      { status: rateLimitResult.status }
    );
  }

  const userId = getUserId(request as unknown as AuthenticatedRequest);

  // Get session for campus isolation
  const session = await getSession(request as unknown as NextRequest);
  if (!session) {
    return respond.error('Session not found', 'UNAUTHORIZED', { status: 401 });
  }

  const campusId = session.campusId || 'ub-buffalo';
  const email = session.email;
  const isAdmin = session.isAdmin || false;

  // Normalize handle for storage
  const normalizedHandle = body.handle.toLowerCase().trim();

  // Development mode bypass: Skip Firestore transaction to allow local testing
  // ONLY allowed when explicitly enabled via DEV_AUTH_BYPASS
  if (ALLOW_DEV_BYPASS) {
    logger.warn('DEV MODE: Skipping Firestore transaction for onboarding', {
      userId,
      handle: normalizedHandle,
      campusId,
      endpoint: '/api/auth/complete-onboarding'
    });

    // Validate handle format only (no DB check in dev)
    const formatResult = validateHandleFormat(normalizedHandle);
    if (!formatResult.isAvailable) {
      return respond.error(formatResult.error || 'Invalid handle format', 'BAD_REQUEST', { status: 400 });
    }

    // Re-issue session cookie with onboarding completed state
    const newToken = await createSession({
      userId,
      email: email || '',
      campusId,
      isAdmin,
      onboardingCompleted: true, // Mark onboarding as complete in session
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        handle: normalizedHandle,
        fullName: body.fullName,
        onboardingCompleted: true
      },
      devMode: true,
      message: 'Onboarding completed in development mode (no Firestore)'
    });

    setSessionCookie(response, newToken, { isAdmin });
    return response;
  }

  // Ensure Firebase is configured for production
  if (!isFirebaseConfigured) {
    logger.error('Firebase not configured and DEV_AUTH_BYPASS not enabled', {
      component: 'complete-onboarding',
      nodeEnv: process.env.NODE_ENV,
    });
    return respond.error(
      "Service unavailable. Please try again later.",
      "SERVICE_UNAVAILABLE",
      { status: 503 }
    );
  }

  // ALWAYS use transaction to prevent handle race condition (prod)
  // Track new member space IDs for sharded counter update after transaction
  const newMemberSpaceIds: string[] = [];

  try {
    await dbAdmin.runTransaction(async (transaction) => {
      // =========================================================================
      // PHASE 1: ALL READS FIRST (Firebase requires all reads before any writes)
      // =========================================================================

      // Check handle availability atomically
      const handleResult = await checkHandleAvailabilityInTransaction(transaction, normalizedHandle);

      if (!handleResult.isAvailable) {
        throw new Error(handleResult.error || 'Handle is not available');
      }

      const userRef = dbAdmin.collection('users').doc(userId);

      // Get existing user data to verify campus
      const existingUser = await transaction.get(userRef);
      if (existingUser.exists) {
        const userData = existingUser.data();
        // Verify campus isolation - user must belong to the same campus
        if (userData?.campusId && userData.campusId !== campusId) {
          throw new Error('Campus mismatch - cannot complete onboarding for different campus');
        }
      }

      // Pre-fetch all space membership docs if joining spaces
      const membershipReads: { spaceId: string; memberRef: FirebaseFirestore.DocumentReference; snapshot: FirebaseFirestore.DocumentSnapshot }[] = [];
      if (body.initialSpaceIds && body.initialSpaceIds.length > 0) {
        for (const spaceId of body.initialSpaceIds) {
          const memberRef = dbAdmin.collection('spaceMembers').doc(`${spaceId}-${userId}`);
          const snapshot = await transaction.get(memberRef);
          membershipReads.push({ spaceId, memberRef, snapshot });
        }
      }

      // =========================================================================
      // PHASE 2: ALL WRITES (after all reads are complete)
      // =========================================================================

      // Reserve the handle atomically
      reserveHandleInTransaction(transaction, normalizedHandle, userId, email || '');

      // Calculate early access expiration for alumni and faculty (2 months)
      const isEarlyAccess = body.userType === 'alumni' || body.userType === 'faculty';
      const earlyAccessExpiresAt = isEarlyAccess
        ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
        : null;

      // Update user document with all onboarding data
      // Academic fields are now optional - only include if provided
      const inferredAcademicLevel = body.academicLevel || inferAcademicLevel(body.major, body.graduationYear);

      transaction.set(userRef, {
        // Identity
        fullName: body.fullName,
        firstName: body.firstName || body.fullName.split(' ')[0] || '',
        lastName: body.lastName || body.fullName.split(' ').slice(1).join(' ') || '',
        handle: normalizedHandle,
        email: email || '',
        // Academic (optional - collected via progressive profiling when needed)
        ...(body.major && { major: body.major }),
        ...(body.graduationYear && { graduationYear: body.graduationYear }),
        ...(inferredAcademicLevel && { academicLevel: inferredAcademicLevel }),
        // Profile
        bio: body.bio || null,
        interests: body.interests || [],
        livingSituation: body.livingSituation || null,
        // Status
        userType: body.userType,
        isLeader: body.isLeader || false,
        // Early access for alumni/faculty (2 months to build excitement)
        ...(isEarlyAccess && {
          earlyAccess: true,
          earlyAccessExpiresAt,
          earlyAccessGrantedAt: new Date().toISOString(),
        }),
        // Campus isolation
        campusId,
        schoolId: campusId, // Keep both for compatibility
        // Entry completion - single source of truth
        // JWT still uses onboardingCompleted for backward compat (derived from entryCompletedAt)
        entryCompletedAt: new Date().toISOString(),
        isActive: true,
        // Timestamps
        updatedAt: new Date().toISOString(),
        createdAt: existingUser.exists ? existingUser.data()?.createdAt : new Date().toISOString(),
        // Avatar
        ...(body.avatarUrl && {
          avatarUrl: body.avatarUrl,
          profileImageUrl: body.avatarUrl
        }),
      }, { merge: true });

      // Create builder requests for spaces if user indicated leadership interest
      // Use composite key (userId-spaceId) for idempotency - prevents duplicates on transaction retry
      if (body.isLeader && body.builderRequestSpaces && body.builderRequestSpaces.length > 0) {
        for (const spaceId of body.builderRequestSpaces) {
          const requestRef = dbAdmin.collection('builderRequests').doc(`${userId}-${spaceId}`);
          transaction.set(requestRef, {
            userId,
            spaceId,
            campusId,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            userHandle: normalizedHandle,
            userName: body.fullName,
          }, { merge: true }); // merge: true ensures idempotency
        }
      }

      // Join initial spaces using pre-fetched membership data
      for (const { spaceId, memberRef, snapshot } of membershipReads) {
        const isNewMember = !snapshot.exists;

        transaction.set(memberRef, {
          odcId: `${spaceId}-${userId}`, // Document ID for querying
          odcRefs: { spaceId, userId }, // Reference fields for compound queries
          userId,
          spaceId,
          campusId,
          role: 'member',
          joinedAt: snapshot.exists ? snapshot.data()?.joinedAt : new Date().toISOString(),
          isActive: true,
          permissions: ['post', 'comment', 'react'],
          joinMethod: 'onboarding',
        }, { merge: true }); // merge: true ensures idempotency

        // Only increment member count for new memberships
        // SCALING FIX: Use sharded counter when enabled (handled after transaction)
        if (isNewMember && !isShardedMemberCountEnabled()) {
          const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
          transaction.update(spaceRef, {
            'metrics.memberCount': admin.firestore.FieldValue.increment(1),
            updatedAt: new Date().toISOString(),
          });
        }

        // Track new members for post-transaction sharded counter update
        if (isNewMember) {
          newMemberSpaceIds.push(spaceId);
        }
      }
    });

    // SCALING FIX: Update sharded counters after transaction completes (if enabled)
    // Sharded counters can't be updated inside transactions since they write to random shards
    if (isShardedMemberCountEnabled() && newMemberSpaceIds.length > 0) {
      await Promise.all(
        newMemberSpaceIds.map(spaceId => incrementMemberCount(spaceId, 1))
      );
      logger.debug('[complete-onboarding] Updated sharded member counters', {
        spaceIds: newMemberSpaceIds,
        count: newMemberSpaceIds.length
      });
    }

    logger.info('Onboarding completed successfully', {
      userId,
      handle: normalizedHandle,
      campusId,
      endpoint: '/api/auth/complete-onboarding'
    });

    // Re-issue session cookie with onboardingCompleted: true
    // This is CRITICAL - without this flag, middleware will redirect back to /onboarding
    const newToken = await createSession({
      userId,
      email: email || '',
      campusId,
      isAdmin,
      onboardingCompleted: true, // Mark onboarding as complete in session
    });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email, onboardingCompleted: true },
      deprecated: true,
      deprecationMessage: DEPRECATION_MESSAGE,
    });

    // Add deprecation header
    response.headers.set('X-Deprecated', 'Use /api/auth/complete-entry');
    response.headers.set('Deprecation', 'true');
    response.headers.set('Link', '</api/auth/complete-entry>; rel="successor-version"');

    setSessionCookie(response, newToken, { isAdmin });
    return response;

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to complete onboarding';
    logger.error('Onboarding failed', {
      error: { error: e instanceof Error ? e.message : String(e) },
      userId,
      handle: normalizedHandle,
      endpoint: '/api/auth/complete-onboarding'
    });

    // Return specific error for handle conflicts
    if (errorMessage.includes('Handle') || errorMessage.includes('handle')) {
      return respond.error(errorMessage, 'CONFLICT', { status: 409 });
    }

    return respond.error(errorMessage, 'INTERNAL_ERROR', { status: 500 });
  }
});
