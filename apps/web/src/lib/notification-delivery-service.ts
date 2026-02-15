/**
 * Notification Delivery Service
 *
 * Handles actual delivery of notifications via email and push.
 * Called asynchronously after notification is created in Firestore.
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { sendPushToUser } from '@/lib/server-push-notifications';
import type { NotificationCategory } from '@/lib/notification-service';

interface NotificationDocument {
  userId: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  actionUrl: string;
  isRead: boolean;
  timestamp: string;
  campusId: string;
  metadata: Record<string, unknown>;
}

interface DeliveryResult {
  notificationId: string;
  emailSent: boolean;
  pushSent: boolean;
  emailError?: string;
  pushError?: string;
}

interface UserPreferences {
  enabled: boolean;
  categories: {
    social: boolean;
    spaces: boolean;
    events: boolean;
    connections: boolean;
    tools: boolean;
    rituals: boolean;
    system: boolean;
  };
  email?: {
    enabled: boolean;
    categories?: Record<string, boolean>;
  };
  push?: {
    enabled: boolean;
    tokens?: string[];
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  enabled: true,
  categories: {
    social: true,
    spaces: true,
    events: true,
    connections: true,
    tools: true,
    rituals: true,
    system: true,
  },
  email: {
    enabled: true,
  },
  push: {
    enabled: true,
  },
};

/**
 * Get user's notification delivery preferences
 */
async function getUserDeliveryPreferences(userId: string): Promise<{
  preferences: UserPreferences;
  email: string | null;
  fcmTokens: string[];
}> {
  try {
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { preferences: DEFAULT_PREFERENCES, email: null, fcmTokens: [] };
    }

    const userData = userDoc.data()!;
    const preferences = userData.notificationPreferences || DEFAULT_PREFERENCES;
    const email = userData.email || null;
    const fcmTokens = userData.fcmTokens || [];

    return { preferences, email, fcmTokens };
  } catch (error) {
    logger.error('Failed to get user delivery preferences', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return { preferences: DEFAULT_PREFERENCES, email: null, fcmTokens: [] };
  }
}

/**
 * Check if email delivery is enabled for this notification category
 */
function isEmailEnabled(
  preferences: UserPreferences,
  category: NotificationCategory
): boolean {
  // Global email toggle
  if (!preferences.email?.enabled) return false;

  // Category-specific email toggle
  if (preferences.email?.categories && preferences.email.categories[category] === false) {
    return false;
  }

  // Fall back to general category preference
  if (!preferences.categories[category]) return false;

  return true;
}

/**
 * Check if push delivery is enabled
 */
function isPushEnabled(preferences: UserPreferences): boolean {
  return preferences.push?.enabled !== false;
}

/**
 * Send email notification via SendGrid
 */
async function sendEmailNotification(
  email: string,
  notification: NotificationDocument
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SendGrid is configured
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@hive.college';

    if (!sendGridApiKey) {
      logger.warn('SendGrid not configured - email notifications disabled', {
        notificationType: notification.type,
        hint: 'Set SENDGRID_API_KEY in .env.local to enable email delivery',
      });
      return { success: false, error: 'SendGrid not configured' };
    }

    logger.debug('Attempting to send email via SendGrid', {
      to: email.replace(/(.{3}).*@/, '$1***@'),
      from: sendGridFromEmail,
      notificationType: notification.type,
    });

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sendGridApiKey);

    // Generate notification email HTML
    const html = generateNotificationEmailHtml(notification);

    await sgMail.send({
      to: email,
      from: { email: sendGridFromEmail, name: 'HIVE' },
      subject: notification.title,
      html,
    });

    logger.info('Notification email sent successfully', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      notificationType: notification.type,
      category: notification.category,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: number })?.code;

    logger.error('Failed to send notification email', {
      error: errorMessage,
      errorCode,
      notificationType: notification.type,
      category: notification.category,
      hint: errorCode === 401 ? 'Invalid SENDGRID_API_KEY' :
            errorCode === 403 ? 'Sender email not verified in SendGrid' : undefined,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Send push notification via server-side FCM service
 */
async function sendPushNotification(
  userId: string,
  notification: NotificationDocument
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendPushToUser(userId, {
      title: notification.title,
      body: notification.body || undefined,
      data: {
        type: notification.type,
        category: notification.category,
        actionUrl: notification.actionUrl || '',
        timestamp: notification.timestamp,
      },
    });

    logger.info('Push notification sent', {
      notificationType: notification.type,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    return { success: result.success };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to send push notification', {
      error: errorMessage,
      notificationType: notification.type,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Generate HTML email for notification
 */
function generateNotificationEmailHtml(notification: NotificationDocument): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college';
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : baseUrl;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0A0A0B;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #FFD700;
      text-decoration: none;
    }
    .content {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
    }
    .category-badge {
      display: inline-block;
      background: rgba(255, 215, 0, 0.1);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 6px;
      padding: 4px 10px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #FFD700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 20px;
      margin: 0 0 12px 0;
      color: #ffffff;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 24px 0;
    }
    .button {
      display: inline-block;
      background-color: #FFD700;
      color: #000000;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 13px;
    }
    .footer a {
      color: #FFD700;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${baseUrl}" class="logo">HIVE</a>
    </div>

    <div class="content">
      <div class="category-badge">${notification.category}</div>
      <h1>${notification.title}</h1>
      ${notification.body ? `<p>${notification.body}</p>` : ''}
      <a href="${actionUrl}" class="button">View on HIVE</a>
    </div>

    <div class="footer">
      <p>
        <a href="${baseUrl}/settings">Notification Settings</a> •
        <a href="${baseUrl}/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin-top: 12px;">
        © 2026 HIVE. Connect. Coordinate. Thrive.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Deliver a notification to a user via email and push
 */
export async function deliverNotification(
  notificationId: string,
  notification: NotificationDocument,
  userId: string
): Promise<DeliveryResult> {
  const result: DeliveryResult = {
    notificationId,
    emailSent: false,
    pushSent: false,
  };

  try {
    // Get user preferences and contact info
    const { preferences, email, fcmTokens: _fcmTokens } = await getUserDeliveryPreferences(userId);

    // Check if notifications are globally disabled
    if (!preferences.enabled) {
      logger.debug('Notifications disabled for user', { userId, notificationId });
      return result;
    }

    // Check category preference
    if (!preferences.categories[notification.category]) {
      logger.debug('Category disabled for user', {
        userId,
        notificationId,
        category: notification.category,
      });
      return result;
    }

    // Send email if enabled and email exists
    if (email && isEmailEnabled(preferences, notification.category)) {
      const emailResult = await sendEmailNotification(email, notification);
      result.emailSent = emailResult.success;
      result.emailError = emailResult.error;
    }

    // Send push if enabled (token lookup happens inside sendPushNotification)
    if (isPushEnabled(preferences)) {
      const pushResult = await sendPushNotification(userId, notification);
      result.pushSent = pushResult.success;
      result.pushError = pushResult.error;
    }

    // Update notification document with delivery status
    await dbAdmin.collection('notifications').doc(notificationId).update({
      deliveryStatus: {
        emailSent: result.emailSent,
        pushSent: result.pushSent,
        deliveredAt: new Date().toISOString(),
      },
    });

    logger.info('Notification delivered', {
      notificationId,
      userId,
      emailSent: result.emailSent,
      pushSent: result.pushSent,
    });
  } catch (error) {
    logger.error('Notification delivery failed', {
      error: error instanceof Error ? error.message : String(error),
      notificationId,
      userId,
    });
  }

  return result;
}
