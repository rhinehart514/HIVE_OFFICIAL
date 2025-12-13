import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { withAuthValidationAndErrors, respond, getUserId, type ResponseFormatter, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { currentEnvironment } from '@/lib/env';
import { createSession, setSessionCookie, getSession } from '@/lib/session';
import { checkHandleAvailabilityInTransaction, reserveHandleInTransaction, validateHandleFormat } from '@/lib/handle-service';
import { logger } from '@/lib/logger';
import { SecureSchemas } from '@/lib/secure-input-validation';

// Check if we're in development mode without Firebase
const isDevelopmentMode = currentEnvironment === 'development' || process.env.NODE_ENV === 'development';

// Use SecureSchemas for security validation on user inputs
const schema = z.object({
  fullName: SecureSchemas.name,
  userType: z.enum(['student', 'alumni', 'faculty']),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  major: z.string().min(1).max(100),
  // FIX: Allow past graduation years for alumni/faculty (1950+) and future for students
  graduationYear: z.number().int().min(1950).max(new Date().getFullYear() + 10),
  handle: SecureSchemas.handle,
  avatarUrl: SecureSchemas.url.optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  builderRequestSpaces: z.array(SecureSchemas.id).max(10).optional(),
  consentGiven: z.boolean().refine(v => v === true, 'Consent is required'),
  academicLevel: z.enum(['undergraduate', 'graduate', 'doctoral']).optional(),
  bio: z.string().max(200).optional(),
  livingSituation: z.enum(['on-campus', 'off-campus', 'commuter', 'not-sure']).optional(),
  // Leadership status - important for space builder requests
  isLeader: z.boolean().optional(),
  // Initial spaces to join during onboarding
  initialSpaceIds: z.array(SecureSchemas.id).max(20).optional(),
}).refine((data) => {
  // Validate graduation year based on user type
  const currentYear = new Date().getFullYear();
  if (data.userType === 'student') {
    // Students must have future or current graduation year
    return data.graduationYear >= currentYear;
  }
  // Alumni/faculty can have any valid year
  return true;
}, {
  message: 'Students must have a current or future graduation year',
  path: ['graduationYear']
});

type OnboardingBody = z.infer<typeof schema>;

/**
 * Infer academic level from major and graduation year
 * Graduate programs typically indicated by major name or longer timelines
 */
function inferAcademicLevel(major: string, graduationYear: number): 'undergraduate' | 'graduate' | 'doctoral' {
  const currentYear = new Date().getFullYear();
  const yearsToGrad = graduationYear - currentYear;
  const majorLower = major.toLowerCase();

  // Graduate programs typically indicated by major name
  const gradIndicators = ['mba', 'phd', 'masters', 'md', 'jd', 'law', 'mfa', 'mph', 'msw', 'ms ', 'ma '];
  if (gradIndicators.some(g => majorLower.includes(g))) {
    return yearsToGrad > 4 ? 'doctoral' : 'graduate';
  }

  // Doctoral indicators
  const doctoralIndicators = ['doctoral', 'doctorate', 'phd'];
  if (doctoralIndicators.some(d => majorLower.includes(d))) {
    return 'doctoral';
  }

  // If graduating 5+ years out, likely doctoral
  if (yearsToGrad > 5) return 'doctoral';

  // Default undergraduate
  return 'undergraduate';
}

export const POST = withAuthValidationAndErrors(schema, async (request, _ctx: Record<string, string | string[]>, body: OnboardingBody, _respondFmt: typeof ResponseFormatter) => {
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
  // In dev mode, we just validate the handle format and create the session
  if (isDevelopmentMode) {
    logger.info('Development mode: Skipping Firestore transaction for onboarding', {
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

  // ALWAYS use transaction to prevent handle race condition (prod)
  try {
    await dbAdmin.runTransaction(async (transaction) => {
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

      // Reserve the handle atomically
      reserveHandleInTransaction(transaction, normalizedHandle, userId, email || '');

      // Calculate early access expiration for alumni and faculty (2 months)
      const isEarlyAccess = body.userType === 'alumni' || body.userType === 'faculty';
      const earlyAccessExpiresAt = isEarlyAccess
        ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
        : null;

      // Update user document with all onboarding data
      transaction.set(userRef, {
        // Identity
        fullName: body.fullName,
        firstName: body.firstName || body.fullName.split(' ')[0] || '',
        lastName: body.lastName || body.fullName.split(' ').slice(1).join(' ') || '',
        handle: normalizedHandle,
        email: email || '',
        // Academic
        major: body.major,
        graduationYear: body.graduationYear,
        academicLevel: body.academicLevel || inferAcademicLevel(body.major, body.graduationYear),
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
        // State
        onboardingCompleted: true,
        onboardingComplete: true, // Both formats for compatibility
        onboardingCompletedAt: new Date().toISOString(), // Timestamp for consistency
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

      // Join initial spaces if provided
      // Use composite key (spaceId-userId) for idempotency - prevents duplicates on transaction retry
      if (body.initialSpaceIds && body.initialSpaceIds.length > 0) {
        for (const spaceId of body.initialSpaceIds) {
          const memberRef = dbAdmin.collection('spaceMembers').doc(`${spaceId}-${userId}`);

          // Check if membership already exists to avoid double-incrementing member count
          const existingMember = await transaction.get(memberRef);
          const isNewMember = !existingMember.exists;

          transaction.set(memberRef, {
            odcId: `${spaceId}-${userId}`, // Document ID for querying
            odcRefs: { spaceId, userId }, // Reference fields for compound queries
            userId,
            spaceId,
            campusId,
            role: 'member',
            joinedAt: existingMember.exists ? existingMember.data()?.joinedAt : new Date().toISOString(),
            isActive: true,
            permissions: ['post', 'comment', 'react'],
            joinMethod: 'onboarding',
          }, { merge: true }); // merge: true ensures idempotency

          // Only increment member count for new memberships
          if (isNewMember) {
            const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
            transaction.update(spaceRef, {
              'metrics.memberCount': admin.firestore.FieldValue.increment(1),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    });

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
    });

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
