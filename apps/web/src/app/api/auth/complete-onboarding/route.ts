import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { withAuthValidationAndErrors, respond, getUserId, type ResponseFormatter, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { currentEnvironment as _currentEnvironment } from '@/lib/env';
import { createSession, setSessionCookie, getSession } from '@/lib/session';
import { checkHandleAvailabilityInTransaction, reserveHandleInTransaction } from '@/lib/handle-service';
import { logger } from '@/lib/logger';

const schema = z.object({
  fullName: z.string().min(1),
  userType: z.enum(['student', 'alumni', 'faculty']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  major: z.string().min(1),
  graduationYear: z.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 10),
  handle: z.string().min(3).max(20),
  avatarUrl: z.string().url().optional(),
  interests: z.array(z.string()).optional(),
  builderRequestSpaces: z.array(z.string()).optional(),
  consentGiven: z.boolean().refine(v => v === true, 'Consent is required'),
  academicLevel: z.enum(['undergraduate', 'graduate', 'doctoral']).optional(),
  bio: z.string().max(200).optional(),
  livingSituation: z.enum(['on-campus', 'off-campus', 'commuter', 'not-sure']).optional(),
  // Leadership status - important for space builder requests
  isLeader: z.boolean().optional(),
  // Initial spaces to join during onboarding
  initialSpaceIds: z.array(z.string()).optional(),
});

type OnboardingBody = z.infer<typeof schema>;

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

  // ALWAYS use transaction to prevent handle race condition (dev and prod)
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
        academicLevel: body.academicLevel || null,
        // Profile
        bio: body.bio || null,
        interests: body.interests || [],
        livingSituation: body.livingSituation || null,
        // Status
        userType: body.userType,
        isLeader: body.isLeader || false,
        // Campus isolation
        campusId,
        schoolId: campusId, // Keep both for compatibility
        // State
        onboardingCompleted: true,
        onboardingComplete: true, // Both formats for compatibility
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
      if (body.isLeader && body.builderRequestSpaces && body.builderRequestSpaces.length > 0) {
        for (const spaceId of body.builderRequestSpaces) {
          const requestRef = dbAdmin.collection('builderRequests').doc();
          transaction.set(requestRef, {
            userId,
            spaceId,
            campusId,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            userHandle: normalizedHandle,
            userName: body.fullName,
          });
        }
      }

      // Join initial spaces if provided
      if (body.initialSpaceIds && body.initialSpaceIds.length > 0) {
        for (const spaceId of body.initialSpaceIds) {
          const memberRef = dbAdmin.collection('spaceMembers').doc();
          transaction.set(memberRef, {
            userId,
            spaceId,
            campusId,
            role: 'member',
            joinedAt: new Date().toISOString(),
            isActive: true,
            permissions: ['post', 'comment', 'react'],
            joinMethod: 'onboarding',
          });

          // Increment space member count
          const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
          transaction.update(spaceRef, {
            'metrics.memberCount': admin.firestore.FieldValue.increment(1),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });

    logger.info('Onboarding completed successfully', {
      userId,
      handle: normalizedHandle,
      campusId,
      endpoint: '/api/auth/complete-onboarding'
    });

    // Re-issue session cookie to update state
    const newToken = await createSession({
      userId,
      email: email || '',
      campusId,
      isAdmin
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
