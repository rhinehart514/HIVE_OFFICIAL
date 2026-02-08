import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuthValidationAndErrors, respond, getUserId, type ResponseFormatter, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { createTokenPair, setTokenPairCookies, getSession } from '@/lib/session';
import { checkHandleAvailabilityInTransaction, reserveHandleInTransaction, validateHandleFormat } from '@/lib/handle-service';
import { logger } from '@/lib/logger';
import { SecureSchemas } from '@/lib/secure-input-validation';
import { isDevAuthBypassAllowed } from '@/lib/dev-auth-bypass';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';


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
 * Has 5 second timeout to avoid blocking entry.
 */
async function checkGravatar(email: string): Promise<string | null> {
  try {
    const url = getGravatarUrl(email);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

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
  const userId = getUserId(request as unknown as AuthenticatedRequest);

  // Get session for campus isolation
  const session = await getSession(request as unknown as NextRequest);
  if (!session) {
    return respond.error('Session not found', 'UNAUTHORIZED', { status: 401 });
  }

  if (!session.campusId) {
    return respond.error('Campus identification required', 'UNAUTHORIZED', { status: 401 });
  }
  const campusId = session.campusId;
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
  if (isDevAuthBypassAllowed('complete_entry', { email: email || undefined, endpoint: '/api/auth/complete-entry' })) {
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

    const tokens = await createTokenPair({
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
      autoJoinedSpaces: [],
      redirect: '/home',
      devMode: true,
      expiresIn: tokens.accessTokenExpiresIn,
    });

    setTokenPairCookies(response, tokens, { isAdmin });
    return response;
  }

  // Rate limit (after dev bypass so devs don't get blocked during testing)
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

  // Track the final handle (may be modified inside transaction, needs to be accessible in catch)
  let finalHandle = normalizedHandle;

  // Track auto-joined spaces for the response (populated inside transaction)
  const autoJoinedSpaces: Array<{ id: string; handle: string; name: string }> = [];

  try {
    // Start Gravatar check early but don't await - fire and forget
    // We'll check the result after the transaction completes
    const gravatarPromise = checkGravatar(email || '');

    // Track if handle was auto-generated (for collision recovery)
    const wasAutoGenerated = !body.handle;
    const baseHandle = normalizedHandle;

    await dbAdmin.runTransaction(async (transaction) => {
      // =========================================================================
      // PHASE 1: ALL READS FIRST (Firebase requires all reads before any writes)
      // =========================================================================

      // For auto-generated handles, find an available variant INSIDE the transaction
      // This is atomic and eliminates race conditions
      if (wasAutoGenerated) {
        // Generate DETERMINISTIC candidate handles based on userId hash
        // This prevents concurrent users from checking the same random candidates
        const currentYear = new Date().getFullYear() % 100;
        const userHash = createHash('md5').update(userId).digest('hex');
        const userSuffix1 = parseInt(userHash.slice(0, 4), 16) % 9000 + 1000; // 1000-9999
        const userSuffix2 = parseInt(userHash.slice(4, 8), 16) % 9000 + 1000;
        const userSuffix3 = parseInt(userHash.slice(8, 12), 16) % 9000 + 1000;

        const candidateHandles = [
          baseHandle,                           // johnsmith
          `${baseHandle}${currentYear}`,        // johnsmith26
          `${baseHandle}${currentYear + 1}`,    // johnsmith27
          `${baseHandle}${userSuffix1}`,        // johnsmith4821 (deterministic per user)
          `${baseHandle}${userSuffix2}`,        // johnsmith7392
          `${baseHandle}${userSuffix3}`,        // johnsmith1847
          `${baseHandle}${Date.now() % 10000}`, // johnsmith5923 (timestamp-based fallback)
          `${baseHandle}${Math.floor(Date.now() / 1000) % 10000}`, // Different granularity
        ].map(h => h.slice(0, 24)); // Max 24 chars

        // Read all candidate handle docs in parallel (still in read phase)
        const handleDocs = await Promise.all(
          candidateHandles.map(h => transaction.get(dbAdmin.collection('handles').doc(h)))
        );

        // Find first available handle
        let foundAvailable = false;
        for (let i = 0; i < handleDocs.length; i++) {
          if (!handleDocs[i].exists) {
            finalHandle = candidateHandles[i];
            foundAvailable = true;
            break;
          }
        }

        if (!foundAvailable) {
          // All candidates taken - throw with error (will be caught and return suggestions)
          throw new Error('HANDLE_EXHAUSTED:' + baseHandle);
        }
      } else {
        // User provided explicit handle - check availability
        const handleResult = await checkHandleAvailabilityInTransaction(transaction, normalizedHandle);
        if (!handleResult.isAvailable) {
          throw new Error(handleResult.error || 'Handle is not available');
        }
        finalHandle = normalizedHandle;
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

      // Pre-fetch and validate residential space if provided
      let validatedResidentialSpaceId: string | null = null;
      let residentialSpaceData: FirebaseFirestore.DocumentData | undefined;
      if (body.residentialSpaceId && body.residenceType === 'on-campus') {
        const residentialSpaceDoc = await transaction.get(
          dbAdmin.collection('spaces').doc(body.residentialSpaceId)
        );
        if (residentialSpaceDoc.exists) {
          const spaceData = residentialSpaceDoc.data();
          // Validate space belongs to user's campus and is a residential space
          if (spaceData?.campusId === campusId && spaceData?.identityType === 'residential') {
            validatedResidentialSpaceId = body.residentialSpaceId;
            residentialSpaceData = spaceData;
          } else {
            logger.warn('Invalid residential space', {
              spaceId: body.residentialSpaceId,
              spaceCampusId: spaceData?.campusId,
              userCampusId: campusId,
              spaceIdentityType: spaceData?.identityType,
            });
          }
        } else {
          logger.warn('Residential space not found', { spaceId: body.residentialSpaceId });
        }
      }

      // =========================================================================
      // PHASE 2: ALL WRITES (after all reads are complete)
      // =========================================================================

      // Reserve the handle atomically
      reserveHandleInTransaction(transaction, finalHandle, userId, email || '');

      // Update user document with identity data
      transaction.set(userRef, {
        // Identity (from entry)
        fullName,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        handle: finalHandle,
        email: email || '',
        // Decision-reducing identity fields (now optional)
        ...(body.major && { major: body.major }),
        graduationYear: body.graduationYear || null,
        ...(body.residenceType && { residenceType: body.residenceType }),
        residentialSpaceId: validatedResidentialSpaceId, // Only store if validated
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
              userHandle: finalHandle,
            });

            // Increment member count
            const spaceRef = dbAdmin.collection('spaces').doc(majorSpaceId);
            transaction.update(spaceRef, {
              memberCount: FieldValue.increment(1),
              'metrics.memberCount': FieldValue.increment(1),
            });

            // Save majorSpaceId to user profile
            transaction.update(userRef, { majorSpaceId });

            // Track for response
            autoJoinedSpaces.push({
              id: majorSpaceId,
              handle: (majorSpaceData.slug as string) || (majorSpaceData.handle as string) || majorSpaceId,
              name: (majorSpaceData.name as string) || '',
            });
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
          const communitySpaceData = communitySpace?.data();

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
              userHandle: finalHandle,
            });

            // Increment member count
            const spaceRef = dbAdmin.collection('spaces').doc(communitySpaceId);
            transaction.update(spaceRef, {
              memberCount: FieldValue.increment(1),
              'metrics.memberCount': FieldValue.increment(1),
            });

            // Track for response
            if (communitySpaceData) {
              autoJoinedSpaces.push({
                id: communitySpaceId,
                handle: (communitySpaceData.slug as string) || (communitySpaceData.handle as string) || communitySpaceId,
                name: (communitySpaceData.name as string) || '',
              });
            }
          }
        }
      }

      // Save community space IDs to user profile
      if (communitySpaceIds.length > 0) {
        transaction.update(userRef, { communitySpaceIds });
      }

      // Auto-join: 3. Residential space (home space) - only if validated
      if (validatedResidentialSpaceId) {
        const memberRef = dbAdmin.collection('spaceMembers').doc(`${validatedResidentialSpaceId}_${userId}`);
        transaction.set(memberRef, {
          spaceId: validatedResidentialSpaceId,
          userId: userId,
          role: 'member',
          joinedAt: new Date().toISOString(),
          campusId: campusId,
          isActive: true,
          userName: fullName,
          userHandle: finalHandle,
        });

        // Increment member count on space
        const spaceRef = dbAdmin.collection('spaces').doc(validatedResidentialSpaceId);
        transaction.update(spaceRef, {
          memberCount: FieldValue.increment(1),
          'metrics.memberCount': FieldValue.increment(1),
        });

        // Save as homeSpaceId
        transaction.update(userRef, { homeSpaceId: validatedResidentialSpaceId });

        // Track for response
        if (residentialSpaceData) {
          autoJoinedSpaces.push({
            id: validatedResidentialSpaceId,
            handle: (residentialSpaceData.slug as string) || (residentialSpaceData.handle as string) || validatedResidentialSpaceId,
            name: (residentialSpaceData.name as string) || '',
          });
        }
      }
    });

    logger.info('Entry completed successfully', {
      userId,
      handle: finalHandle,
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

    // Re-issue token pair with completed state
    const tokens = await createTokenPair({
      userId,
      email: email || '',
      campusId,
      isAdmin,
      onboardingCompleted: true,
    });

    // Determine best redirect: first auto-joined space or home
    const firstSpace = autoJoinedSpaces[0];
    const redirect = firstSpace ? `/s/${firstSpace.handle}` : '/home';

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        handle: finalHandle,
        fullName,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        ...(avatarUrl && { avatarUrl }),
      },
      autoJoinedSpaces,
      redirect,
      expiresIn: tokens.accessTokenExpiresIn,
    });

    setTokenPairCookies(response, tokens, { isAdmin });
    return response;

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to complete entry';
    logger.error('Entry failed', {
      error: { error: e instanceof Error ? e.message : String(e) },
      userId,
      handle: finalHandle,
      endpoint: '/api/auth/complete-entry'
    });

    // Handle exhausted - all candidate handles were taken (rare but possible under high concurrency)
    if (errorMessage.startsWith('HANDLE_EXHAUSTED:')) {
      const baseHandle = errorMessage.split(':')[1] || finalHandle;
      // Generate fresh suggestions with random suffixes
      const suggestions = [
        `${baseHandle}${Math.floor(Math.random() * 9000) + 1000}`,
        `${baseHandle}${Math.floor(Math.random() * 9000) + 1000}`,
        `${baseHandle}${Math.floor(Math.random() * 9000) + 1000}`,
      ].map(h => h.slice(0, 24));

      return NextResponse.json({
        success: false,
        error: 'All handle variants taken. Please try a different name.',
        code: 'HANDLE_EXHAUSTED',
        suggestedHandles: suggestions,
      }, { status: 409 });
    }

    // Return specific error for handle conflicts with suggested alternatives
    if (errorMessage.includes('Handle') || errorMessage.includes('handle')) {
      // Generate 3 alternative handle suggestions
      const baseName = finalHandle.replace(/\d+$/, ''); // Remove trailing numbers
      const suggestions: string[] = [];

      // Try year-based suffixes (e.g., john25, john26)
      const currentYear = new Date().getFullYear() % 100;
      suggestions.push(`${baseName}${currentYear}`);
      suggestions.push(`${baseName}${currentYear + 1}`);

      // Try random suffix
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      suggestions.push(`${baseName}${randomSuffix}`);

      return NextResponse.json({
        success: false,
        error: 'Handle not available',
        code: 'HANDLE_COLLISION',
        suggestedHandles: suggestions.slice(0, 3).map(h => h.slice(0, 24)), // Max 24 chars
      }, { status: 409 });
    }

    return respond.error(errorMessage, 'INTERNAL_ERROR', { status: 500 });
  }
});
