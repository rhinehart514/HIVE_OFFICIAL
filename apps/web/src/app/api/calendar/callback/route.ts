/**
 * Calendar OAuth Callback Route
 *
 * GET /api/calendar/callback
 *
 * Handles OAuth2 callback from Google.
 * Exchanges auth code for tokens and stores encrypted in Firestore.
 *
 * @author HIVE Backend Team
 * @version 1.0.0
 */

import { type NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { parseState, exchangeCodeForTokens } from '@/lib/calendar/google-oauth';
import { encryptTokens } from '@/lib/calendar/token-encryption';
import { logger, logSecurityEvent } from '@/lib/structured-logger';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    logger.warn('Calendar OAuth denied', {
      error,
      component: 'calendar-callback',
    });
    return NextResponse.redirect(
      new URL('/settings?calendar_error=denied', request.url)
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=invalid_request', request.url)
    );
  }

  try {
    // Parse and validate state
    const stateData = parseState(state);
    if (!stateData) {
      logSecurityEvent('auth', {
        operation: 'calendar_oauth_invalid_state',
        tags: { state: state.substring(0, 20) },
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=invalid_state', request.url)
      );
    }

    const { userId } = stateData;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens) {
      logger.error('Failed to exchange calendar auth code', {
        userId,
        component: 'calendar-callback',
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=token_exchange_failed', request.url)
      );
    }

    // Encrypt tokens before storage
    const encryptedTokens = encryptTokens(tokens);

    // Store in Firestore under user's calendar_connections
    const connectionRef = dbAdmin
      .collection('calendar_connections')
      .doc(userId);

    await connectionRef.set(
      {
        userId,
        provider: 'google',
        encryptedTokens,
        connectedAt: FieldValue.serverTimestamp(),
        lastSyncedAt: null,
        isActive: true,
        // Sharing preferences (default to sharing with joined spaces)
        sharing: {
          enabled: true,
          spaceIds: [], // Empty = share with all joined spaces
        },
      },
      { merge: true }
    );

    logger.info('Calendar connected successfully', {
      userId,
      provider: 'google',
      component: 'calendar-callback',
    });

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/settings?calendar_connected=true', request.url)
    );
  } catch (error) {
    logger.error('Calendar callback error', { component: 'calendar-callback' }, error instanceof Error ? error : undefined);
    return NextResponse.redirect(
      new URL('/settings?calendar_error=internal_error', request.url)
    );
  }
}
