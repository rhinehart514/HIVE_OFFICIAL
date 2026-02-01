import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuthValidationAndErrors, respond, getUserId, type ResponseFormatter, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { createSession, setSessionCookie, getSession, SESSION_CONFIG } from '@/lib/session';
import { checkHandleAvailabilityInTransaction, reserveHandleInTransaction, validateHandleFormat } from '@/lib/handle-service';
import { logger } from '@/lib/logger';
import { SecureSchemas } from '@/lib/secure-input-validation';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';
import { COMPLETION_REQUIREMENTS } from '@hive/core';

/**
 * Generate Gravatar URL from email hash.
 * Uses d=404 to return 404 if no Gravatar exists.
 */
function getGravatarUrl(email: string, size = 200): string {
  const hash = createHash('md5')
    .update(email.toLowerCase().trim())
    .digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}

/**
 * Check if Gravatar exists for email.
 * Returns URL if found, null if not.
 */
async function checkGravatar(email: string): Promise<string | null> {
  try {
    const url = getGravatarUrl(email);
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      // Gravatar exists - return URL without d=404 for actual use
      const hash = createHash('md5')
        .update(email.toLowerCase().trim())
        .digest('hex');
      return `https://www.gravatar.com/avatar/${hash}?s=200&d=mp`;
    }
    return null;
  } catch {
    // Network error or timeout - don't block entry
    return null;
  }
}

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

// Schema with identity fields for The Threshold entry flow
// UPDATED: Jan 28, 2026 - Handle now auto-generated if not provided
const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  // Handle is now optional - auto-generated from name if not provided
  handle: SecureSchemas.handle.optional(),
  // Role field from entry flow
  role: z.enum(['student', 'faculty', 'alumni']),
  // Identity fields - optional for flexibility
  major: z.string().max(100).optional().nullable(),
  graduationYear: z.number().min(2015).max(2035).optional().nullable(),
  residenceType: z.enum(['on-campus', 'off-campus', 'commuter']).optional().nullable(),
  residentialSpaceId: z.string().max(100).optional().nullable(),
  // Interests (2-5 for The Threshold)
  interests: z.array(z.string()).min(2).max(5),
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

  const fullName = `${body.firstName.trim()} ${body.lastName.trim()}`;

  // Auto-generate handle from name if not provided
  // Format: firstnamelastname (lowercase, no special chars)
  // If taken, append random digits
  let normalizedHandle: string;
  if (body.handle) {
    normalizedHandle = body.handle.toLowerCase().trim();
  } else {
    // Generate base handle from name
    const baseHandle = `${body.firstName}${body.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20); // Max 20 chars for base
    normalizedHandle = baseHandle;
  }

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
    // Start Gravatar check early but don't await - fire and forget
    // We'll check the result after the transaction completes
    const gravatarPromise = checkGravatar(email || '');

    // For auto-generated handles, find an available variant before transaction
    // This avoids transaction retries for handle collisions
    const wasAutoGenerated = !body.handle;
    if (wasAutoGenerated) {
      const baseHandle = normalizedHandle;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const handleDoc = await dbAdmin.collection('handles').doc(normalizedHandle).get();
        if (!handleDoc.exists) {
          break; // Handle is available
        }
        // Try with random suffix
        attempts++;
        const suffix = Math.floor(Math.random() * 9000) + 1000; // 4-digit random
        normalizedHandle = `${baseHandle}${suffix}`.slice(0, 24); // Max 24 chars
      }

      if (attempts >= maxAttempts) {
        logger.error('Failed to generate unique handle', { baseHandle, attempts });
        return respond.error('Unable to generate unique handle. Please try again.', 'CONFLICT', { status: 409 });
      }
    }

    await dbAdmin.runTransaction(async (transaction) => {
      // =========================================================================
      // PHASE 1: ALL READS FIRST (Firebase requires all reads before any writes)
      // =========================================================================

      // Check handle availability atomically (final verification)
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

      // Pre-fetch major space if major is provided
      let majorSpaceSnapshot: FirebaseFirestore.QuerySnapshot | null = null;
      if (body.major) {
        majorSpaceSnapshot = await transaction.get(
          dbAdmin.collection('spaces')
            .where('campusId', '==', campusId)
            .where('identityType', '==', 'major')
            .where('majorName', '==', body.major)
            .limit(1)
        );
      }

      // Pre-fetch community spaces based on identity checkboxes
      const communityMappings = {
        international: 'international',
        transfer: 'transfer',
        firstGen: 'firstgen',
        commuter: 'commuter',
        graduate: 'graduate',
        veteran: 'veteran',
      } as const;

      const communitySpaceReads: Array<{
        key: string;
        communityType: string;
        snapshot: FirebaseFirestore.QuerySnapshot;
      }> = [];

      if (body.communityIdentities) {
        for (const [key, communityType] of Object.entries(communityMappings)) {
          if (body.communityIdentities[key as keyof typeof body.communityIdentities]) {
            const snapshot = await transaction.get(
              dbAdmin.collection('spaces')
                .where('campusId', '==', campusId)
                .where('identityType', '==', 'community')
                .where('communityType', '==', communityType)
                .where('isUniversal', '==', true)
                .limit(1)
            );
            communitySpaceReads.push({ key, communityType, snapshot });
          }
        }
      }

      // =========================================================================
      // PHASE 2: ALL WRITES (after all reads are complete)
      // =========================================================================

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
        // Decision-reducing identity fields (now optional)
        ...(body.major && { major: body.major }),
        graduationYear: body.graduationYear || null,
        ...(body.residenceType && { residenceType: body.residenceType }),
        residentialSpaceId: body.residentialSpaceId || null,
        interests: body.interests || [],
        communityIdentities: body.communityIdentities || {},
        // Campus isolation
        campusId,
        schoolId: campusId,
        // Entry completion - single source of truth
        // JWT still uses onboardingCompleted for backward compat (derived from entryCompletedAt)
        entryCompletedAt: new Date().toISOString(),
        // Status
        isActive: true,
        userType: body.role || 'student',
        // Timestamps
        updatedAt: new Date().toISOString(),
        createdAt: existingUser.exists ? existingUser.data()?.createdAt : new Date().toISOString(),
      }, { merge: true });

      // Auto-join: 1. Major space (if major provided and space exists)
      let majorSpaceId: string | null = null;
      if (majorSpaceSnapshot && !majorSpaceSnapshot.empty) {
        const majorSpace = majorSpaceSnapshot.docs[0];
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

      // Auto-join: 2. Community spaces using pre-fetched data
      const communitySpaceIds: string[] = [];
      for (const { snapshot } of communitySpaceReads) {
        if (!snapshot.empty) {
          const communitySpace = snapshot.docs[0];
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

    // Resolve Gravatar (already started, just await result - fast if cached)
    const avatarUrl = await gravatarPromise;

    // Update avatar in background if found (non-blocking)
    if (avatarUrl && isFirebaseConfigured) {
      dbAdmin.collection('users').doc(userId).update({ avatarUrl }).catch(() => {
        // Ignore errors - avatar is optional enhancement
      });
    }

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
        ...(avatarUrl && { avatarUrl }),
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
