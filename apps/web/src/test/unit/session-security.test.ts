/**
 * Unit tests for session security
 *
 * Tests the security constraints in session.ts without
 * actually importing it (which would trigger the guards).
 * Uses static analysis to verify security patterns.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Tests run from apps/web directory, so don't include apps/web prefix
const sessionFilePath = join(process.cwd(), 'src', 'lib', 'session.ts');
const sessionFileContent = readFileSync(sessionFilePath, 'utf8');

describe('Session Security Guards', () => {
  describe('SESSION_SECRET validation', () => {
    it('throws in production when SESSION_SECRET is missing', () => {
      // Verify the guard exists in the code
      expect(sessionFileContent).toContain('SESSION_SECRET is required in production');
      expect(sessionFileContent).toMatch(/if\s*\(\s*!rawSecret\s*&&\s*isProduction\s*\)/);
    });

    it('validates SESSION_SECRET minimum length in production', () => {
      // Verify length check exists
      expect(sessionFileContent).toContain('SESSION_SECRET must be at least 32 characters');
      expect(sessionFileContent).toMatch(/rawSecret\.length\s*<\s*32/);
    });

    it('uses cryptographically secure random for dev secret', () => {
      // Verify crypto.getRandomValues or crypto.randomBytes is used
      expect(sessionFileContent).toMatch(/crypto\.getRandomValues|crypto\.randomBytes/);
    });
  });

  describe('Cookie Security', () => {
    it('uses httpOnly cookies', () => {
      expect(sessionFileContent).toContain('httpOnly: true');
    });

    it('uses secure flag based on environment', () => {
      // Should set secure: true in production
      expect(sessionFileContent).toMatch(/secure:\s*(isProduction|process\.env\.NODE_ENV\s*===\s*['"]production['"])/);
    });

    it('uses SameSite attribute', () => {
      expect(sessionFileContent).toMatch(/sameSite:\s*['"]lax['"]/);
    });
  });

  describe('Token Configuration', () => {
    it('has short-lived access tokens', () => {
      // Access tokens should be 15 minutes
      expect(sessionFileContent).toMatch(/ACCESS_TOKEN_MAX_AGE\s*=\s*15\s*\*\s*60/);
    });

    it('has reasonable refresh token lifetime', () => {
      // Refresh tokens should be 7 days
      expect(sessionFileContent).toMatch(/REFRESH_TOKEN_MAX_AGE\s*=\s*7\s*\*\s*24/);
    });

    it('has shorter admin session lifetime', () => {
      // Admin sessions should be 4 hours
      expect(sessionFileContent).toMatch(/ADMIN_SESSION_MAX_AGE\s*=\s*4\s*\*\s*60\s*\*\s*60/);
    });
  });

  describe('Session Revocation', () => {
    it('imports session revocation module', () => {
      expect(sessionFileContent).toContain("from './session-revocation'");
    });

    it('checks for revoked sessions', () => {
      expect(sessionFileContent).toContain('isSessionInvalid');
    });
  });

  describe('CSRF Protection', () => {
    it('includes CSRF token in session data', () => {
      expect(sessionFileContent).toContain('csrf?: string');
    });
  });
});

describe('Session Cookie Names', () => {
  it('uses expected cookie names', () => {
    expect(sessionFileContent).toContain("SESSION_COOKIE_NAME = 'hive_session'");
    expect(sessionFileContent).toContain("REFRESH_COOKIE_NAME = 'hive_refresh'");
  });
});

describe('SessionData Interface', () => {
  it('includes required user identification fields', () => {
    expect(sessionFileContent).toContain('userId: string');
    expect(sessionFileContent).toContain('email: string');
    expect(sessionFileContent).toContain('campusId?: string');
  });

  it('includes session tracking fields', () => {
    expect(sessionFileContent).toContain('sessionId: string');
    expect(sessionFileContent).toContain('verifiedAt: string');
  });

  it('includes admin flag', () => {
    expect(sessionFileContent).toContain('isAdmin?: boolean');
  });

  it('includes onboarding tracking', () => {
    expect(sessionFileContent).toContain('onboardingCompleted?: boolean');
  });
});
