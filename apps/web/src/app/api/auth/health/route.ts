import { type NextRequest, NextResponse } from 'next/server';
import { validateAllConfig, getEmailServiceStatus } from '@/lib/config-validation';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { SESSION_CONFIG } from '@/lib/session';

/**
 * Auth Health Check Endpoint
 * GET /api/auth/health
 *
 * Returns the health status of authentication services.
 * Useful for monitoring and debugging.
 *
 * In production, this endpoint only returns basic status.
 * In development, it returns detailed configuration info.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const configValidation = validateAllConfig();
  const emailStatus = getEmailServiceStatus();

  // Basic health status (always returned)
  const health = {
    status: configValidation.isValid ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      authentication: {
        status: 'operational',
        sessionCookieName: SESSION_CONFIG.SESSION_COOKIE_NAME,
      },
      firebase: {
        status: isFirebaseConfigured ? 'operational' : 'not_configured',
      },
      email: {
        status: emailStatus.available ? 'operational' : 'not_configured',
        provider: emailStatus.provider,
        mode: emailStatus.mode,
      },
    },
  };

  // In development, include more details
  if (SESSION_CONFIG.isDevelopment) {
    return NextResponse.json({
      ...health,
      config: {
        environment: process.env.NODE_ENV,
        isProduction: SESSION_CONFIG.isProduction,
        isDevelopment: SESSION_CONFIG.isDevelopment,
        devAuthBypass: process.env.DEV_AUTH_BYPASS === 'true',
        adminAutoGrant: process.env.ALLOW_ADMIN_AUTO_GRANT === 'true',
        hasSessionSecret: !!process.env.SESSION_SECRET,
        hasSendGridKey: !!process.env.SENDGRID_API_KEY,
      },
      tokenConfig: {
        accessTokenMaxAge: SESSION_CONFIG.ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge: SESSION_CONFIG.REFRESH_TOKEN_MAX_AGE,
        adminSessionMaxAge: SESSION_CONFIG.ADMIN_SESSION_MAX_AGE,
      },
      validation: {
        isValid: configValidation.isValid,
        errors: configValidation.errors,
        warnings: configValidation.warnings,
      },
    });
  }

  // Production: minimal info
  return NextResponse.json(health);
}
