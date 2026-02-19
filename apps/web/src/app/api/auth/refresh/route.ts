import { type NextRequest, NextResponse } from 'next/server';
import {
  verifyRefreshToken,
  createTokenPair,
  setTokenPairCookies,
  getRefreshToken,
  clearAllSessionCookies,
  isSecureEnvironment,
} from '@/lib/session';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { auditAuthEvent } from '@/lib/middleware/auth';

/**
 * POST /api/auth/refresh
 * Refresh an expired access token using a valid refresh token
 *
 * Security:
 * - Only accepts refresh tokens (not access tokens)
 * - Validates user still exists and is active
 * - Issues new token pair (rotation for security)
 * - Revokes old refresh token on use (one-time use)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get refresh token from cookie
    const refreshToken = getRefreshToken(request);

    if (!refreshToken) {
      logger.warn('Refresh attempt without refresh token', { component: 'auth-refresh' });
      return NextResponse.json(
        { error: 'No refresh token provided', code: 'NO_REFRESH_TOKEN' },
        { status: 401 }
      );
    }

    // Verify the refresh token
    const refreshData = await verifyRefreshToken(refreshToken);

    if (!refreshData) {
      await auditAuthEvent('failure', request, {
        operation: 'refresh_token',
        error: 'invalid_refresh_token',
      });

      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' },
        { status: 401 }
      );
      clearAllSessionCookies(response);
      return response;
    }

    // Fetch current user data to ensure they're still valid
    let userData: {
      email: string;
      campusId?: string;
      isAdmin: boolean;
      onboardingCompleted: boolean;
      isActive: boolean;
    } | null = null;

    if (isFirebaseConfigured) {
      const userDoc = await dbAdmin.collection('users').doc(refreshData.userId).get();

      if (!userDoc.exists) {
        logger.warn('Refresh attempt for non-existent user', {
          component: 'auth-refresh',
          userId: refreshData.userId,
        });

        const response = NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 401 }
        );
        clearAllSessionCookies(response);
        return response;
      }

      const user = userDoc.data();

      // Check if user is still active
      if (user?.isActive === false) {
        logger.warn('Refresh attempt for deactivated user', {
          component: 'auth-refresh',
          userId: refreshData.userId,
        });

        const response = NextResponse.json(
          { error: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED' },
          { status: 403 }
        );
        clearAllSessionCookies(response);
        return response;
      }

      userData = {
        email: user?.email || '',
        campusId: typeof user?.campusId === 'string' ? user.campusId : undefined,
        isAdmin: user?.isAdmin || false,
        onboardingCompleted: user?.onboardingCompleted || user?.onboardingComplete || false,
        isActive: user?.isActive !== false,
      };
    } else {
      // Development mode - create placeholder user data
      if (!isSecureEnvironment()) {
        userData = {
          email: `dev-${refreshData.userId}@example.com`,
          campusId: 'ub-buffalo',
          isAdmin: false,
          onboardingCompleted: true,
          isActive: true,
        };
      } else {
        // In production without Firebase - this shouldn't happen
        logger.error('Production environment without Firebase configured', {
          component: 'auth-refresh',
        });

        return NextResponse.json(
          { error: 'Server configuration error', code: 'SERVER_ERROR' },
          { status: 500 }
        );
      }
    }

    // Create new token pair (rotation)
    const tokens = await createTokenPair({
      userId: refreshData.userId,
      email: userData.email,
      campusId: userData.campusId,
      isAdmin: userData.isAdmin,
      onboardingCompleted: userData.onboardingCompleted,
    });

    // Create response with new tokens
    const response = NextResponse.json({
      success: true,
      user: {
        id: refreshData.userId,
        email: userData.email,
        campusId: userData.campusId,
        onboardingCompleted: userData.onboardingCompleted,
      },
      expiresIn: tokens.accessTokenExpiresIn,
    });

    setTokenPairCookies(response, tokens, { isAdmin: userData.isAdmin });

    await auditAuthEvent('success', request, {
      operation: 'refresh_token',
      userId: refreshData.userId,
    });

    logger.info('Token refreshed successfully', {
      component: 'auth-refresh',
      userId: refreshData.userId,
    });

    return response;
  } catch (error) {
    logger.error('Token refresh failed', {
      component: 'auth-refresh',
      error: error instanceof Error ? error.message : String(error),
    });

    await auditAuthEvent('failure', request, {
      operation: 'refresh_token',
      error: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.json(
      { error: 'Failed to refresh token', code: 'REFRESH_FAILED' },
      { status: 500 }
    );
  }
}
