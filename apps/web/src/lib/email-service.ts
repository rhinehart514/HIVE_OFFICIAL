/**
 * Email Service Configuration
 * Supports both Firebase Email Auth and SendGrid
 */

import { logger } from "./logger";

export type EmailProvider = 'firebase' | 'sendgrid' | 'none';

interface EmailConfig {
  provider: EmailProvider;
  isConfigured: boolean;
  sendGridApiKey?: string;
  sendGridFromEmail?: string;
  sendGridTemplateId?: string;
  firebaseEmailEnabled?: boolean;
}

/**
 * Get the current email configuration
 */
export async function getEmailConfig(): Promise<EmailConfig> {
  // Check SendGrid configuration
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@hive.college';
  const sendGridTemplateId = process.env.SENDGRID_MAGIC_LINK_TEMPLATE_ID;

  if (sendGridApiKey && sendGridFromEmail) {
    return {
      provider: 'sendgrid',
      isConfigured: true,
      sendGridApiKey,
      sendGridFromEmail,
      sendGridTemplateId,
    };
  }

  // Check Firebase Email Auth configuration
  try {
    const { isFirebaseEmailAuthEnabled } = await import('./firebase-auth-email');
    const firebaseEnabled = await isFirebaseEmailAuthEnabled();

    if (firebaseEnabled) {
      return {
        provider: 'firebase',
        isConfigured: true,
        firebaseEmailEnabled: true,
      };
    }
  } catch (error) {
    logger.warn('Firebase Email Auth check failed', { error: { error: error instanceof Error ? error.message : String(error) } });
  }

  // No email provider configured
  return {
    provider: 'none',
    isConfigured: false,
  };
}

/**
 * Send magic link email using configured provider
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
  schoolName: string
): Promise<boolean> {
  const config = await getEmailConfig();

  if (!config.isConfigured) {
    logger.error('No email provider configured', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      endpoint: 'email-service'
    });

    // In development, log the link to console
    if (process.env.NODE_ENV === 'development') {
      return true; // Pretend it worked in dev
    }

    return false;
  }

  switch (config.provider) {
    case 'sendgrid':
      return sendViaSendGrid(email, magicLink, schoolName, config);

    case 'firebase':
      // Firebase handles email sending automatically when generating magic link
      logger.info('Email sent via Firebase Auth', {
        email: email.replace(/(.{3}).*@/, '$1***@'),
        schoolId: schoolName,
        endpoint: 'email-service'
      });
      return true;

    default:
      return false;
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(
  email: string,
  magicLink: string,
  schoolName: string,
  config: EmailConfig
): Promise<boolean> {
  if (!config.sendGridApiKey || !config.sendGridFromEmail) {
    logger.error('SendGrid not properly configured', { endpoint: 'email-service' });
    return false;
  }

  try {
    // Dynamic import to avoid loading SendGrid when not needed
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.sendGridApiKey);

    const msg = config.sendGridTemplateId ? {
      // Use dynamic template
      to: email,
      from: {
        email: config.sendGridFromEmail,
        name: 'HIVE'
      },
      templateId: config.sendGridTemplateId,
      dynamicTemplateData: {
        magic_link: magicLink,
        school_name: schoolName,
        user_email: email,
        expiry_time: '1 hour'
      }
    } : {
      // Use plain HTML email
      to: email,
      from: {
        email: config.sendGridFromEmail,
        name: 'HIVE'
      },
      subject: `Sign in to HIVE at ${schoolName}`,
      html: generateEmailHtml(magicLink, schoolName, email)
    };

    await sgMail.send(msg);

    logger.info('Email sent via SendGrid', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      schoolId: schoolName,
      endpoint: 'email-service'
    });

    return true;
  } catch (error) {
    logger.error('SendGrid email failed', {
      error,
      endpoint: 'email-service'
    });
    return false;
  }
}

/**
 * Generate HTML email template for magic link
 */
function generateEmailHtml(magicLink: string, schoolName: string, email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to HIVE</title>
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
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #FFD700;
      text-decoration: none;
    }
    .content {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 16px 0;
      color: #ffffff;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
      margin: 16px 0;
    }
    .school-badge {
      display: inline-block;
      background: rgba(255, 215, 0, 0.1);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 8px;
      padding: 8px 16px;
      margin: 20px 0;
      color: #FFD700;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background-color: #FFD700;
      color: #000000;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #E5C200;
    }
    .link-text {
      margin: 20px 0;
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      word-break: break-all;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 14px;
    }
    .footer a {
      color: #FFD700;
      text-decoration: none;
    }
    .warning {
      background: rgba(255, 59, 48, 0.1);
      border: 1px solid rgba(255, 59, 48, 0.3);
      border-radius: 8px;
      padding: 12px;
      margin: 20px 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${baseUrl}" class="logo">HIVE</a>
    </div>

    <div class="content">
      <h1>Sign in to HIVE</h1>

      <div class="school-badge">${schoolName}</div>

      <p>Hi there! Click the button below to sign in to your HIVE account:</p>

      <a href="${magicLink}" class="button">Sign in to HIVE</a>

      <p style="font-size: 14px; color: rgba(255, 255, 255, 0.5);">
        This magic link will expire in 1 hour for your security.
      </p>

      <div class="warning">
        If you didn't request this email, you can safely ignore it.
      </div>

      <div class="link-text">
        <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.4);">
          Or copy this link: ${magicLink}
        </p>
      </div>
    </div>

    <div class="footer">
      <p>
        Sent to ${email}<br>
        <a href="${baseUrl}/unsubscribe">Unsubscribe</a> •
        <a href="${baseUrl}/privacy">Privacy</a> •
        <a href="${baseUrl}/terms">Terms</a>
      </p>
      <p style="margin-top: 20px;">
        © 2025 HIVE. Connect. Coordinate. Thrive.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Check if email service is ready for production
 */
export async function isEmailServiceReady(): Promise<{
  ready: boolean;
  provider: EmailProvider;
  message: string;
}> {
  const config = await getEmailConfig();

  if (!config.isConfigured) {
    return {
      ready: false,
      provider: 'none',
      message: 'No email provider configured. Set up Firebase Email Auth or add SendGrid credentials.'
    };
  }

  return {
    ready: true,
    provider: config.provider,
    message: `Email service ready using ${config.provider}`
  };
}

/**
 * Get email service status for diagnostics
 */
export async function getEmailServiceStatus(): Promise<{
  provider: EmailProvider;
  configured: boolean;
  details: Record<string, unknown>;
}> {
  const config = await getEmailConfig();

  const details: Record<string, unknown> = {};

  if (config.provider === 'sendgrid') {
    details.fromEmail = config.sendGridFromEmail;
    details.hasApiKey = !!config.sendGridApiKey;
    details.hasTemplate = !!config.sendGridTemplateId;
  } else if (config.provider === 'firebase') {
    details.firebaseEnabled = config.firebaseEmailEnabled;
  }

  return {
    provider: config.provider,
    configured: config.isConfigured,
    details
  };
}

/**
 * Send sign-in code email
 */
export async function sendSigninCodeEmail(
  email: string,
  code: string,
  schoolName: string
): Promise<boolean> {
  const config = await getEmailConfig();

  if (!config.isConfigured) {
    logger.warn('No email provider configured for signin code', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      endpoint: 'email-service'
    });
    return false;
  }

  if (config.provider !== 'sendgrid' || !config.sendGridApiKey || !config.sendGridFromEmail) {
    logger.warn('SendGrid not configured for signin code', { endpoint: 'email-service' });
    return false;
  }

  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.sendGridApiKey);

    await sgMail.send({
      to: email,
      from: { email: config.sendGridFromEmail, name: 'HIVE' },
      subject: `Your HIVE sign-in code: ${code}`,
      html: generateSigninCodeHtml(code, schoolName, email),
    });

    logger.info('Signin code email sent', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      endpoint: 'email-service'
    });
    return true;
  } catch (error) {
    logger.error('Failed to send signin code email', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: 'email-service'
    });
    return false;
  }
}

/**
 * Send suspension notification email
 */
export async function sendSuspensionEmail(
  email: string,
  displayName: string,
  reason: string,
  duration: string,
  suspendedUntil: Date | null
): Promise<boolean> {
  const config = await getEmailConfig();

  if (!config.isConfigured || config.provider !== 'sendgrid') {
    logger.warn('SendGrid not configured for suspension email', { endpoint: 'email-service' });
    return false;
  }

  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.sendGridApiKey);

    const durationText = suspendedUntil
      ? `until ${suspendedUntil.toLocaleDateString('en-US', { dateStyle: 'long' })}`
      : 'permanently';

    await sgMail.send({
      to: email,
      from: { email: config.sendGridFromEmail!, name: 'HIVE' },
      subject: 'Your HIVE account has been suspended',
      html: generateSuspensionHtml(displayName, reason, durationText),
    });

    logger.info('Suspension email sent', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      endpoint: 'email-service'
    });
    return true;
  } catch (error) {
    logger.error('Failed to send suspension email', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: 'email-service'
    });
    return false;
  }
}

/**
 * Send restoration notification email
 */
export async function sendRestorationEmail(
  email: string,
  displayName: string
): Promise<boolean> {
  const config = await getEmailConfig();

  if (!config.isConfigured || config.provider !== 'sendgrid') {
    logger.warn('SendGrid not configured for restoration email', { endpoint: 'email-service' });
    return false;
  }

  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.sendGridApiKey);

    await sgMail.send({
      to: email,
      from: { email: config.sendGridFromEmail!, name: 'HIVE' },
      subject: 'Your HIVE account has been restored',
      html: generateRestorationHtml(displayName),
    });

    logger.info('Restoration email sent', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      endpoint: 'email-service'
    });
    return true;
  } catch (error) {
    logger.error('Failed to send restoration email', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: 'email-service'
    });
    return false;
  }
}

/**
 * Send report resolved notification to reporter
 */
export async function sendReportResolvedToReporter(
  email: string,
  actionTaken: string,
  actionDescription: string
): Promise<boolean> {
  const config = await getEmailConfig();

  if (!config.isConfigured || config.provider !== 'sendgrid') {
    logger.warn('SendGrid not configured for report notification', { endpoint: 'email-service' });
    return false;
  }

  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.sendGridApiKey);

    await sgMail.send({
      to: email,
      from: { email: config.sendGridFromEmail!, name: 'HIVE' },
      subject: 'Update on your report to HIVE',
      html: generateReportResolvedToReporterHtml(actionTaken, actionDescription),
    });

    logger.info('Report resolved email sent to reporter', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      endpoint: 'email-service'
    });
    return true;
  } catch (error) {
    logger.error('Failed to send report resolved email to reporter', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: 'email-service'
    });
    return false;
  }
}

/**
 * Send report resolved notification to target
 */
export async function sendReportResolvedToTarget(
  email: string,
  displayName: string,
  actionTaken: string,
  actionDescription: string
): Promise<boolean> {
  const config = await getEmailConfig();

  if (!config.isConfigured || config.provider !== 'sendgrid') {
    logger.warn('SendGrid not configured for report notification', { endpoint: 'email-service' });
    return false;
  }

  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.sendGridApiKey);

    await sgMail.send({
      to: email,
      from: { email: config.sendGridFromEmail!, name: 'HIVE' },
      subject: 'Action taken on your HIVE account',
      html: generateReportResolvedToTargetHtml(displayName, actionTaken, actionDescription),
    });

    logger.info('Report resolved email sent to target', {
      email: email.replace(/(.{3}).*@/, '$1***@'),
      endpoint: 'email-service'
    });
    return true;
  } catch (error) {
    logger.error('Failed to send report resolved email to target', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: 'email-service'
    });
    return false;
  }
}

// ============================================================
// Email HTML Templates
// ============================================================

function generateSigninCodeHtml(code: string, schoolName: string, email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your HIVE Sign-in Code</title>
  ${getEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${baseUrl}" class="logo">HIVE</a>
    </div>
    <div class="content">
      <h1>Your sign-in code</h1>
      <div class="school-badge">${schoolName}</div>
      <p>Enter this code to sign in to your HIVE account:</p>
      <div class="code-box">${code}</div>
      <p style="font-size: 14px; color: rgba(255, 255, 255, 0.5);">
        This code expires in 10 minutes.
      </p>
      <div class="warning">
        If you didn't request this code, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      <p>
        Sent to ${email}<br>
        <a href="${baseUrl}/privacy">Privacy</a> •
        <a href="${baseUrl}/terms">Terms</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateSuspensionHtml(displayName: string, reason: string, durationText: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Suspended</title>
  ${getEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${baseUrl}" class="logo">HIVE</a>
    </div>
    <div class="content">
      <h1>Account Suspended</h1>
      <p>Hi ${displayName},</p>
      <p>Your HIVE account has been suspended ${durationText}.</p>
      <div class="info-box">
        <strong>Reason:</strong><br>
        ${reason}
      </div>
      <p>If you believe this was a mistake, please contact support.</p>
    </div>
    <div class="footer">
      <p>
        <a href="mailto:support@hive.college">Contact Support</a> •
        <a href="${baseUrl}/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateRestorationHtml(displayName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Restored</title>
  ${getEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${baseUrl}" class="logo">HIVE</a>
    </div>
    <div class="content">
      <h1>Account Restored</h1>
      <p>Hi ${displayName},</p>
      <p>Your HIVE account has been restored. You can now sign in and use the platform again.</p>
      <a href="${baseUrl}/signin" class="button">Sign in to HIVE</a>
      <p style="font-size: 14px; color: rgba(255, 255, 255, 0.5);">
        Please review our community guidelines to avoid future issues.
      </p>
    </div>
    <div class="footer">
      <p>
        <a href="${baseUrl}/guidelines">Community Guidelines</a> •
        <a href="${baseUrl}/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateReportResolvedToReporterHtml(actionTaken: string, actionDescription: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college';
  const actionLabel = getActionLabel(actionTaken);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Update</title>
  ${getEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${baseUrl}" class="logo">HIVE</a>
    </div>
    <div class="content">
      <h1>Your report has been reviewed</h1>
      <p>Thank you for helping keep HIVE safe. Our team has reviewed your report and taken action.</p>
      <div class="info-box">
        <strong>Action taken:</strong> ${actionLabel}
      </div>
      <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">${actionDescription}</p>
      <p>We appreciate you reporting content that doesn't meet our community standards.</p>
    </div>
    <div class="footer">
      <p>
        <a href="${baseUrl}/guidelines">Community Guidelines</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateReportResolvedToTargetHtml(displayName: string, actionTaken: string, actionDescription: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college';
  const actionLabel = getActionLabel(actionTaken);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Action Taken on Your Account</title>
  ${getEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${baseUrl}" class="logo">HIVE</a>
    </div>
    <div class="content">
      <h1>Action taken on your account</h1>
      <p>Hi ${displayName},</p>
      <p>Our moderation team has reviewed content associated with your account.</p>
      <div class="info-box">
        <strong>Action:</strong> ${actionLabel}<br><br>
        <strong>Details:</strong> ${actionDescription}
      </div>
      <p>Please review our community guidelines to understand our policies.</p>
      <div class="warning">
        Repeated violations may result in account suspension.
      </div>
    </div>
    <div class="footer">
      <p>
        <a href="${baseUrl}/guidelines">Community Guidelines</a> •
        <a href="mailto:support@hive.college">Appeal</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'remove_content': 'Content removed',
    'warn_user': 'Warning issued',
    'suspend_user': 'Account suspended',
    'ban_user': 'Account banned',
    'dismiss': 'Report dismissed',
  };
  return labels[action] || action;
}

function getEmailStyles(): string {
  return `
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
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #FFD700;
      text-decoration: none;
    }
    .content {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 16px 0;
      color: #ffffff;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
      margin: 16px 0;
    }
    .school-badge {
      display: inline-block;
      background: rgba(255, 215, 0, 0.1);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 8px;
      padding: 8px 16px;
      margin: 20px 0;
      color: #FFD700;
      font-weight: 600;
    }
    .code-box {
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 8px;
      background: rgba(255, 215, 0, 0.1);
      border: 2px solid rgba(255, 215, 0, 0.5);
      border-radius: 12px;
      padding: 20px 40px;
      margin: 24px 0;
      color: #FFD700;
    }
    .info-box {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      text-align: left;
      color: rgba(255, 255, 255, 0.8);
    }
    .button {
      display: inline-block;
      background-color: #FFD700;
      color: #000000;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .warning {
      background: rgba(255, 59, 48, 0.1);
      border: 1px solid rgba(255, 59, 48, 0.3);
      border-radius: 8px;
      padding: 12px;
      margin: 20px 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 14px;
    }
    .footer a {
      color: #FFD700;
      text-decoration: none;
    }
  </style>`;
}