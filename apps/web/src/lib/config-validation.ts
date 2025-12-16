/**
 * Configuration Validation
 *
 * Validates critical configuration at startup to fail fast
 * rather than encountering issues at runtime.
 */

import { logger } from './logger';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate email service configuration
 */
export function validateEmailConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // SendGrid configuration
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (isProduction) {
    // In production, SendGrid is required
    if (!sendGridApiKey) {
      errors.push('SENDGRID_API_KEY is required in production for email delivery');
    } else if (sendGridApiKey.length < 20) {
      errors.push('SENDGRID_API_KEY appears to be invalid (too short)');
    }

    if (!sendGridFromEmail) {
      warnings.push('SENDGRID_FROM_EMAIL not set, using default: hello@hive.college');
    } else if (!sendGridFromEmail.includes('@')) {
      errors.push('SENDGRID_FROM_EMAIL is not a valid email address');
    }
  } else if (isDevelopment) {
    // In development, warn if not configured
    if (!sendGridApiKey) {
      warnings.push('SENDGRID_API_KEY not set. Emails will be logged to console.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Session secret
  const sessionSecret = process.env.SESSION_SECRET;

  if (isProduction) {
    if (!sessionSecret) {
      errors.push('SESSION_SECRET is required in production');
    } else if (sessionSecret.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters in production');
    }
  } else {
    if (!sessionSecret) {
      warnings.push('SESSION_SECRET not set. Using auto-generated secret for development.');
    }
  }

  // Firebase configuration
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firebaseAdminKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;

  if (isProduction) {
    if (!firebaseProjectId) {
      errors.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
    }
    if (!firebaseAdminKey) {
      errors.push('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY is required for production');
    }
  }

  // Dev auth bypass check
  const devAuthBypass = process.env.DEV_AUTH_BYPASS;
  if (isProduction && devAuthBypass === 'true') {
    errors.push('DEV_AUTH_BYPASS must NOT be enabled in production!');
  }

  // Admin auto-grant check
  const adminAutoGrant = process.env.ALLOW_ADMIN_AUTO_GRANT;
  if (isProduction && adminAutoGrant === 'true') {
    warnings.push('ALLOW_ADMIN_AUTO_GRANT is enabled in production. Consider disabling for security.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all critical configuration
 */
export function validateAllConfig(): ConfigValidationResult {
  const emailResult = validateEmailConfig();
  const authResult = validateAuthConfig();

  const allErrors = [...emailResult.errors, ...authResult.errors];
  const allWarnings = [...emailResult.warnings, ...authResult.warnings];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Log configuration validation results
 */
export function logConfigValidation(): void {
  const result = validateAllConfig();
  const isProduction = process.env.NODE_ENV === 'production';

  // Log warnings
  for (const warning of result.warnings) {
    logger.warn(`Config Warning: ${warning}`, { component: 'config-validation' });
  }

  // Log errors
  for (const error of result.errors) {
    logger.error(`Config Error: ${error}`, { component: 'config-validation' });
  }

  // In production, fail if there are errors
  if (isProduction && !result.isValid) {
    throw new Error(
      `Critical configuration errors:\n${result.errors.map(e => `  - ${e}`).join('\n')}`
    );
  }

  // Log success
  if (result.isValid) {
    logger.info('Configuration validation passed', {
      component: 'config-validation',
      warningCount: result.warnings.length,
    });
  }
}

/**
 * Check if email service is available
 * Call this before attempting to send emails
 */
export function isEmailServiceAvailable(): boolean {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  const devBypass = process.env.DEV_AUTH_BYPASS === 'true';

  // In production, require SendGrid
  if (isProduction) {
    return !!sendGridApiKey;
  }

  // In development, allow if dev bypass is enabled or SendGrid is configured
  return devBypass || !!sendGridApiKey;
}

/**
 * Get email service status for health checks
 */
export function getEmailServiceStatus(): {
  available: boolean;
  provider: string;
  mode: 'production' | 'development' | 'disabled';
} {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  const devBypass = process.env.DEV_AUTH_BYPASS === 'true';

  if (sendGridApiKey) {
    return {
      available: true,
      provider: 'sendgrid',
      mode: 'production',
    };
  }

  if (!isProduction && devBypass) {
    return {
      available: true,
      provider: 'console',
      mode: 'development',
    };
  }

  return {
    available: false,
    provider: 'none',
    mode: 'disabled',
  };
}
