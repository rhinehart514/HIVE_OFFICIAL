/**
 * Profile Feature Notifications API
 *
 * Stores user preferences for "Coming Soon" feature notifications.
 * When a feature launches, users who opted in can be notified.
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withSecureAuth } from '@/lib/api-auth-secure';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Valid feature keys that users can subscribe to
const VALID_FEATURES = ['ai_insights', 'campus_graph'] as const;
type FeatureKey = typeof VALID_FEATURES[number];

// Request body schema
const NotifyRequestSchema = z.object({
  feature: z.enum(VALID_FEATURES),
  subscribe: z.boolean().default(true),
});

// Response types
interface NotifyResponse {
  success: boolean;
  feature: FeatureKey;
  subscribed: boolean;
  subscribedFeatures: FeatureKey[];
}

/**
 * POST /api/profile/notify
 * Subscribe or unsubscribe from feature notifications
 */
export const POST = withSecureAuth(async (request: NextRequest, token) => {
  const userId = token.uid;

  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = NotifyRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parseResult.error.format()
        },
        { status: 400 }
      );
    }

    const { feature, subscribe } = parseResult.data;

    // Get user document reference
    const userRef = dbAdmin.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update featureNotifications array
    if (subscribe) {
      // Add feature to notifications array (avoid duplicates with arrayUnion)
      await userRef.update({
        featureNotifications: FieldValue.arrayUnion(feature),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Remove feature from notifications array
      await userRef.update({
        featureNotifications: FieldValue.arrayRemove(feature),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Get updated user data
    const updatedUserDoc = await userRef.get();
    const userData = updatedUserDoc.data();
    const subscribedFeatures = (userData?.featureNotifications || []) as FeatureKey[];

    logger.info('Feature notification preference updated', {
      userId,
      feature,
      subscribe,
      subscribedFeatures,
    });

    const response: NotifyResponse = {
      success: true,
      feature,
      subscribed: subscribe,
      subscribedFeatures,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to update feature notification', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/profile/notify
 * Get user's current feature notification preferences
 */
export const GET = withSecureAuth(async (_request: NextRequest, token) => {
  const userId = token.uid;

  try {
    const userRef = dbAdmin.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const subscribedFeatures = (userData?.featureNotifications || []) as FeatureKey[];

    return NextResponse.json({
      subscribedFeatures,
      availableFeatures: VALID_FEATURES,
    });
  } catch (error) {
    logger.error('Failed to get feature notifications', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
});
