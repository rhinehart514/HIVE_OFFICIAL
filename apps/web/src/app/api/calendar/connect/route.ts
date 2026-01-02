/**
 * Calendar Connect API Route
 *
 * GET /api/calendar/connect
 *
 * Initiates Google Calendar OAuth flow.
 * Redirects user to Google consent screen.
 *
 * @author HIVE Backend Team
 * @version 1.0.0
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAuthorizationUrl, isCalendarOAuthConfigured } from '@/lib/calendar/google-oauth';
import { logger } from '@/lib/structured-logger';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if OAuth is configured
    if (!isCalendarOAuthConfigured()) {
      logger.warn('Calendar OAuth not configured', {
        userId: session.userId,
        component: 'calendar-connect',
      });
      return NextResponse.json(
        { error: 'Calendar integration is not configured' },
        { status: 503 }
      );
    }

    // Generate authorization URL
    const authUrl = getAuthorizationUrl(session.userId);
    if (!authUrl) {
      return NextResponse.json(
        { error: 'Failed to generate authorization URL' },
        { status: 500 }
      );
    }

    logger.info('Calendar OAuth flow initiated', {
      userId: session.userId,
      component: 'calendar-connect',
    });

    // Redirect to Google consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    logger.error('Calendar connect error', { component: 'calendar-connect' }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
