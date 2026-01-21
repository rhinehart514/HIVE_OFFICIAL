import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuthValidationAndErrors, respond, getUserId, type ResponseFormatter, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { createSession, setSessionCookie, getSession, SESSION_CONFIG } from '@/lib/session';
import { checkHandleAvailabilityInTransaction, reserveHandleInTransaction, validateHandleFormat } from '@/lib/handle-service';
import { logger } from '@/lib/logger';
import { SecureSchemas } from '@/lib/secure-input-validation';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';

/**
 * Complete Entry - Simplified onboarding endpoint
 *
 * IA Spec: docs/IA_PHASE1_AUTH_ONBOARDING.md
 *
 * Only collects essential fields:
 * - firstName
 * - lastName
 * - handle
 *
 * All other fields (userType, interests, etc.) are collected via progressive profiling.
 */

// Development mode guard
const ALLOW_DEV_BYPASS =
  SESSION_CONFIG.isDevelopment &&
  !isFirebaseConfigured &&
  process.env.DEV_AUTH_BYPASS === 'true';

// Schema with identity fields for decision-reducing onboarding
const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  handle: SecureSchemas.handle,
  // Identity fields
  major: z.string().min(1).max(100),
  graduationYear: z.number().min(2015).max(2035).optional().nullable(),
  residenceType: z.enum(['on-campus', 'off-campus', 'commuter']),
  residentialSpaceId: z.string().max(100).optional().nullable(),
  // Interests (2-3 required)
  interests: z.array(z.string()).min(2).max(3),
  // Community identities (all optional)
  communityIdentities: z.object({
    international: z.boolean().optional(),
    transfer: z.boolean().optional(),
    firstGen: z.boolean().optional(),
    commuter: z.boolean().optional(),
    graduate: z.boolean().optional(),
    veteran: z.boolean().optional(),
  }).optional(),
});

type EntryBody = z.infer<typeof schema>;

export const POST = withAuthValidationAndErrors(schema, async (request, _ctx: Record<string, string | string[]>, body: EntryBody, _respondFmt: typeof ResponseFormatter) => {
  // Rate limit: 5 attempts per hour per IP
  const rateLimitResult = await enforceRateLimit('authStrict', request as NextRequest);
  if (!rateLimitResult.allowed) {
    logger.warn('Complete-entry rate limit exceeded', {
      component: 'complete-entry',
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

  // Normalize handle
  const normalizedHandle = body.handle.toLowerCase().trim();
  const fullName = `${body.firstName.trim()} ${body.lastName.trim()}`;

  // Development mode bypass
  if (ALLOW_DEV_BYPASS) {
    logger.warn('DEV MODE: Skipping Firestore transaction for entry', {
      userId,
      handle: normalizedHandle,
      campusId,
      endpoint: '/api/auth/complete-entry'
    });

    const formatResult = validateHandleFormat(normalizedHandle);
    if (!formatResult.isAvailable) {
      return respond.error(formatResult.error || 'Invalid handle format', 'BAD_REQUEST', { status: 400 });
    }

    const newToken = await createSession({
      userId,
      email: email || '',
      campusId,
      isAdmin,
      onboardingCompleted: true,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        handle: normalizedHandle,
        fullName,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
      },
      redirect: '/spaces',
      devMode: true,
    });

    setSessionCookie(response, newToken, { isAdmin });
    return response;
  }

  // Ensure Firebase is configured for production
  if (!isFirebaseConfigured) {
    logger.error('Firebase not configured and DEV_AUTH_BYPASS not enabled', {
      component: 'complete-entry',
      nodeEnv: process.env.NODE_ENV,
    });
    return respond.error(
      "Service unavailable. Please try again later.",
      "SERVICE_UNAVAILABLE",
      { status: 503 }
    );
  }

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
        if (userData?.campusId && userData.campusId !== campusId) {
          throw new Error('Campus mismatch - cannot complete entry for different campus');
        }
      }

      // Reserve the handle atomically
      reserveHandleInTransaction(transaction, normalizedHandle, userId, email || '');

      // Update user document with identity data
      transaction.set(userRef, {
        // Identity (from entry)
        fullName,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        handle: normalizedHandle,
        email: email || '',
        // Decision-reducing identity fields
        major: body.major,
        graduationYear: body.graduationYear || null,
        residenceType: body.residenceType,
        residentialSpaceId: body.residentialSpaceId || null,
        interests: body.interests || [],
        communityIdentities: body.communityIdentities || {},
        // Campus isolation
        campusId,
        schoolId: campusId,
        // Entry completion (replaces onboardingCompleted)
        entryCompletedAt: new Date().toISOString(),
        // Backward compatibility
        onboardingCompleted: true,
        onboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
        // Status
        isActive: true,
        userType: 'student', // Default, can be changed in profile
        // Timestamps
        updatedAt: new Date().toISOString(),
        createdAt: existingUser.exists ? existingUser.data()?.createdAt : new Date().toISOString(),
      }, { merge: true });

      // Auto-join: 1. Major space (find by majorName, join or waitlist)
      // Find major space for this major
      const majorSpacesSnapshot = await transaction.get(
        dbAdmin.collection('spaces')
          .where('campusId', '==', campusId)
          .where('identityType', '==', 'major')
          .where('majorName', '==', body.major)
          .limit(1)
      );

      let majorSpaceId: string | null = null;
      if (!majorSpacesSnapshot.empty) {
        const majorSpace = majorSpacesSnapshot.docs[0];
        majorSpaceId = majorSpace?.id || null;
        const majorSpaceData = majorSpace?.data();

        if (majorSpaceId && majorSpaceData) {
          const isUnlocked = majorSpaceData.isUnlocked || false;

          if (isUnlocked) {
            // Join the space
            const memberRef = dbAdmin.collection('spaceMembers').doc(`${majorSpaceId}_${userId}`);
            transaction.set(memberRef, {
              spaceId: majorSpaceId,
              userId: userId,
              role: 'member',
              joinedAt: new Date().toISOString(),
              campusId: campusId,
              isActive: true,
              userName: fullName,
              userHandle: normalizedHandle,
            });

            // Increment member count
            const spaceRef = dbAdmin.collection('spaces').doc(majorSpaceId);
            transaction.update(spaceRef, {
              memberCount: FieldValue.increment(1),
              'metrics.memberCount': FieldValue.increment(1),
            });

            // Save majorSpaceId to user profile
            transaction.update(userRef, { majorSpaceId });
          } else {
            // Add to waitlist
            const waitlistRef = dbAdmin.collection('spaceWaitlists').doc(`${majorSpaceId}_${userId}`);
            transaction.set(waitlistRef, {
              id: `${majorSpaceId}_${userId}`,
              spaceId: majorSpaceId,
              userId: userId,
              majorName: body.major,
              joinedAt: new Date().toISOString(),
              notified: false,
              campusId: campusId,
            });
          }
        }
      }

      // Auto-join: 2. Community spaces based on identity checkboxes
      const communitySpaceIds: string[] = [];
      if (body.communityIdentities) {
        const communityMappings = {
          international: 'international',
          transfer: 'transfer',
          firstGen: 'firstgen',
          commuter: 'commuter',
          graduate: 'graduate',
          veteran: 'veteran',
        } as const;

        for (const [key, communityType] of Object.entries(communityMappings)) {
          if (body.communityIdentities[key as keyof typeof body.communityIdentities]) {
            // Find universal community space for this type
            const communitySpacesSnapshot = await transaction.get(
              dbAdmin.collection('spaces')
                .where('campusId', '==', campusId)
                .where('identityType', '==', 'community')
                .where('communityType', '==', communityType)
                .where('isUniversal', '==', true)
                .limit(1)
            );

            if (!communitySpacesSnapshot.empty) {
              const communitySpace = communitySpacesSnapshot.docs[0];
              const communitySpaceId = communitySpace?.id;

              if (communitySpaceId) {
                communitySpaceIds.push(communitySpaceId);

                // Join the space
                const memberRef = dbAdmin.collection('spaceMembers').doc(`${communitySpaceId}_${userId}`);
                transaction.set(memberRef, {
                  spaceId: communitySpaceId,
                  userId: userId,
                  role: 'member',
                  joinedAt: new Date().toISOString(),
                  campusId: campusId,
                  isActive: true,
                  userName: fullName,
                  userHandle: normalizedHandle,
                });

                // Increment member count
                const spaceRef = dbAdmin.collection('spaces').doc(communitySpaceId);
                transaction.update(spaceRef, {
                  memberCount: FieldValue.increment(1),
                  'metrics.memberCount': FieldValue.increment(1),
                });
              }
            }
          }
        }
      }

      // Save community space IDs to user profile
      if (communitySpaceIds.length > 0) {
        transaction.update(userRef, { communitySpaceIds });
      }

      // Auto-join: 3. Residential space (home space)
      if (body.residentialSpaceId && body.residenceType === 'on-campus') {
        const memberRef = dbAdmin.collection('spaceMembers').doc(`${body.residentialSpaceId}_${userId}`);
        transaction.set(memberRef, {
          spaceId: body.residentialSpaceId,
          userId: userId,
          role: 'member',
          joinedAt: new Date().toISOString(),
          campusId: campusId,
          isActive: true,
          userName: fullName,
          userHandle: normalizedHandle,
        });

        // Increment member count on space
        const spaceRef = dbAdmin.collection('spaces').doc(body.residentialSpaceId);
        transaction.update(spaceRef, {
          memberCount: FieldValue.increment(1),
          'metrics.memberCount': FieldValue.increment(1),
        });

        // Save as homeSpaceId
        transaction.update(userRef, { homeSpaceId: body.residentialSpaceId });
      }
    });

    logger.info('Entry completed successfully', {
      userId,
      handle: normalizedHandle,
      campusId,
      endpoint: '/api/auth/complete-entry'
    });

    // Re-issue session cookie with completed state
    const newToken = await createSession({
      userId,
      email: email || '',
      campusId,
      isAdmin,
      onboardingCompleted: true,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        handle: normalizedHandle,
        fullName,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
      },
      redirect: '/spaces',
    });

    setSessionCookie(response, newToken, { isAdmin });
    return response;

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to complete entry';
    logger.error('Entry failed', {
      error: { error: e instanceof Error ? e.message : String(e) },
      userId,
      handle: normalizedHandle,
      endpoint: '/api/auth/complete-entry'
    });

    // Return specific error for handle conflicts
    if (errorMessage.includes('Handle') || errorMessage.includes('handle')) {
      return respond.error(errorMessage, 'CONFLICT', { status: 409 });
    }

    return respond.error(errorMessage, 'INTERNAL_ERROR', { status: 500 });
  }
});
