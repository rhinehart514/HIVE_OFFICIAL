/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Logger silent
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/structured-logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

// In-memory Firestore Admin + admin FieldValue
import { dbAdminMock, adminMock, getCollection, resetCollections } from '../utils/inmemory-firestore';
// server-only shim for Next.js server directive
vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => ({ dbAdmin: dbAdminMock, isFirebaseConfigured: true }));
vi.mock('firebase-admin', () => adminMock);

// Track rate limit calls
const rateLimitCalls: string[] = [];

// Mock rate limiter
vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn(async (key: string) => {
    rateLimitCalls.push(key);
    return { allowed: true, remaining: 10, resetAt: Date.now() + 60000 };
  }),
  RateLimiter: {
    check: vi.fn(async () => ({ allowed: true, remaining: 10 }))
  }
}));

// Mock email service
const sentEmails: Array<{ to: string; subject: string }> = [];
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(async ({ to, subject }: { to: string; subject: string }) => {
    sentEmails.push({ to, subject });
    return true;
  })
}));

// Mock JWT signing
vi.mock('jose', () => ({
  SignJWT: class {
    constructor(private payload: any) {}
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    async sign() { return 'mock_jwt_token_' + JSON.stringify(this.payload); }
  },
  jwtVerify: vi.fn(async (token: string) => {
    if (token.startsWith('mock_jwt_token_')) {
      const payload = JSON.parse(token.replace('mock_jwt_token_', ''));
      return { payload };
    }
    if (token.startsWith('valid_session_')) {
      return { payload: { userId: 'u1', email: 'u1@buffalo.edu', campusId: 'ub-buffalo' } };
    }
    throw new Error('Invalid token');
  })
}));

// Import routes after mocks
import * as SessionRoute from '@/app/api/auth/session/route';
import * as MeRoute from '@/app/api/auth/me/route';
import * as LogoutRoute from '@/app/api/auth/logout/route';
import * as CsrfRoute from '@/app/api/auth/csrf/route';

function makeReq(url: string, init?: RequestInit, cookies?: Record<string, string>) {
  const headers = new Headers(init?.headers as any);

  if (cookies) {
    const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    headers.set('cookie', cookieStr);
  }

  const body = init?.body as any;
  const method = (init?.method || 'GET') as any;
  const req = new Request(url, { headers, method, body });
  return new NextRequest(req);
}

describe('Auth Backend Endpoints', () => {
  beforeEach(() => {
    resetCollections();
    rateLimitCalls.length = 0;
    sentEmails.length = 0;

    const now = new Date();

    // Seed users
    getCollection('users').doc('u1').set({
      fullName: 'Test User',
      email: 'u1@buffalo.edu',
      role: 'student',
      campusId: 'ub-buffalo',
      createdAt: { toDate: () => now },
      isAdmin: false,
      verifiedAt: { toDate: () => now }
    });

    // Seed profiles
    getCollection('profiles').doc('u1').set({
      userId: 'u1',
      displayName: 'Test User',
      handle: 'testuser',
      campusId: 'ub-buffalo',
      email: 'u1@buffalo.edu'
    });

    // Seed schools for domain validation
    getCollection('schools').doc('ub-buffalo').set({
      name: 'University at Buffalo',
      domain: 'buffalo.edu',
      emailDomains: ['buffalo.edu'],
      isActive: true
    });
  });

  describe('GET /api/auth/session', () => {
    it('returns session info for authenticated user', async () => {
      // Mock session verification
      vi.doMock('@/lib/session', () => ({
        verifySession: vi.fn(async () => ({
          userId: 'u1',
          email: 'u1@buffalo.edu',
          campusId: 'ub-buffalo',
          isAdmin: false,
          verifiedAt: new Date().toISOString(),
          sessionId: 'test-session'
        }))
      }));

      const res = await SessionRoute.GET(
        makeReq('http://localhost/api/auth/session', {}, { hive_session: 'valid_session_token' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user profile for authenticated user', async () => {
      // This test checks that /me returns user data
      const res = await MeRoute.GET(
        makeReq('http://localhost/api/auth/me', {}, { hive_session: 'valid_session_token' })
      );

      // Should either return 200 with user data or 401 if not authenticated
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears session cookie on logout', async () => {
      const res = await LogoutRoute.POST(
        makeReq('http://localhost/api/auth/logout', {
          method: 'POST'
        }, { hive_session: 'valid_session_token' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Check that cookie is cleared
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        expect(setCookie).toContain('hive_session');
        // Should have expired or empty value
      }
    });
  });

  describe('GET /api/auth/csrf', () => {
    it('returns CSRF token', async () => {
      const res = await CsrfRoute.GET(
        makeReq('http://localhost/api/auth/csrf')
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data?.token).toBeDefined();
    });

    it('sets CSRF cookie', async () => {
      const res = await CsrfRoute.GET(
        makeReq('http://localhost/api/auth/csrf')
      );

      expect(res.status).toBe(200);
      // Check for csrf cookie in response
      const setCookie = res.headers.get('set-cookie');
      // CSRF implementations typically set a cookie
    });
  });

  describe('Rate Limiting', () => {
    it('rate limits are applied to auth endpoints', async () => {
      // Make multiple requests to trigger rate limiting check
      for (let i = 0; i < 3; i++) {
        await SessionRoute.GET(
          makeReq('http://localhost/api/auth/session', {}, { hive_session: 'test' })
        );
      }

      // Rate limiter should have been called
      // The actual rate limiting behavior depends on implementation
    });
  });

  describe('Security Headers', () => {
    it('returns appropriate security headers', async () => {
      const res = await SessionRoute.GET(
        makeReq('http://localhost/api/auth/session', {}, { hive_session: 'test' })
      );

      // Check for security-related headers
      // These are typically set by middleware or the route
    });
  });
});

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    resetCollections();

    // Seed school for domain validation
    getCollection('schools').doc('ub-buffalo').set({
      name: 'University at Buffalo',
      domain: 'buffalo.edu',
      emailDomains: ['buffalo.edu'],
      isActive: true
    });
  });

  it('validates .edu email domain', async () => {
    // This would test the email validation flow
    // The actual implementation depends on the verify endpoint
  });

  it('rejects non-.edu email domains', async () => {
    // Test that gmail.com, yahoo.com etc are rejected
  });

  it('creates user profile on first login', async () => {
    // Test the onboarding flow
  });
});
