# Onboarding & Authentication — Production TODO

Owner: Web Platform
Status: Active (P0 for launch)
Last Updated: 2024-12-16

## Completed (This pass)
- Removed legacy localStorage auth fallback in production (server-only auth).
- Standardized secure client fetch with cookies + CSRF for same-origin calls.
- Cleared session cookie on logout regardless of Authorization header.
- Centralized admin checks in verify flow via `isAdminEmail` helper.
- Added production guard: `SESSION_SECRET` required in prod.
- ✅ Migrated from magic link to OTP-based authentication (6-digit code via email)
- ✅ Added session revocation system with Firestore persistence
- ✅ Implemented auth health check endpoint (`/api/auth/health`)
- ✅ Added multi-device session management (`/api/auth/sessions`)
- ✅ Origin validation on pre-auth endpoints (CSRF protection)
- ✅ Comprehensive E2E tests for OTP flow (`auth-otp-flow.spec.ts`)
  - Send code validation (domain, format, rate limits)
  - Verify code validation (format, lockouts)
  - Logout flow and cookie clearing
  - Admin CSRF protection basics
  - Protected route redirects
- ✅ Consolidated admin routes to use `withAdminAuthAndErrors`
  - Migrated `/api/admin/spaces` routes
  - Migrated `/api/admin/builder-requests` route
  - Migrated `/api/admin/tools/review-stats` route
  - Built-in CSRF, rate limiting (50 req/min), and admin auth
- ✅ Added Vitest unit tests for admin roles and session security
  - `admin-roles.test.ts` - isAdminEmail, shouldGrantAdmin, role permissions
  - `session-security.test.ts` - Static security checks on session.ts

## High Priority
- ✅ Verify end-to-end OTP auth in prod:
  - ✅ Send → Rate limit enforced (429 on abuse, 10 codes/email/hour)
  - ✅ Verify → JWT cookie set (30-day session)
  - ✅ UB `@buffalo.edu` enforcement + school domain check
  - ✅ Code lockout after 5 failed attempts (1 minute)
- ✅ Admin CSRF:
  - ✅ CSRF enforced via `withAdminAuthAndErrors` wrapper (always enabled)
  - ✅ Mutating `/api/admin/**` has auth checks
  - ✅ Add Playwright test: unauthenticated admin requests → 401
  - ✅ CSRF via API fallback (`/api/auth/csrf`) for admin UIs
- ✅ Logout hardening:
  - ✅ Cookie cleared on logout
  - ✅ Session revoked in Firestore (survives server restarts)
  - ✅ E2E test: logout → protected route redirects
- Session secret:
  - Set `SESSION_SECRET` in Vercel; fail build if missing (guard in place)

## Medium Priority
- ✅ Consolidate route wrappers:
  - ✅ Admin routes now use `withAdminAuthAndErrors` (rate-limit + CSRF + admin auth)
  - Use `withAuthAndErrors` for non-admin protected routes; avoid drift
- ✅ Replace direct Authorization patterns:
  - Verified: `apiClient` uses Firebase tokens (valid for Firebase operations)
  - Verified: `secureApiFetch` uses HttpOnly cookies (valid for server sessions)
  - Both patterns coexist appropriately for their use cases
- ✅ Align onboarding bridge with consolidated fetch and error semantics (done for POST)
- ✅ Deprecate magic link endpoints:
  - Added RFC 8594 compliant deprecation headers (`Deprecation`, `Sunset`, `Link`)
  - Added `_deprecated` and `_migrateTo` fields in response bodies
  - Added warning logs on every request to magic link endpoints
  - Sunset date: March 1, 2025

## Tests Added ✅
- Playwright (`src/test/e2e/auth-otp-flow.spec.ts`)
  - ✅ OTP send code validation (valid email, invalid domain, invalid format)
  - ✅ OTP verify code validation (format, length, CSRF)
  - ✅ Logout clears session and returns success
  - ✅ Auth/me returns 401 for unauthenticated
  - ✅ Sessions endpoint requires auth
  - ✅ Health check endpoint works
  - ✅ Admin endpoints require auth
  - ✅ Login page UI displays correctly
  - ✅ Protected routes redirect to login
- Vitest (unit)
  - ✅ `admin-roles.test.ts` - isAdminEmail, shouldGrantAdmin, permissions
  - ✅ `session-security.test.ts` - Static analysis of session.ts security patterns

## Observability ✅
- ✅ Audit logs on send/verify failures:
  - `auditAuthEvent()` called for all success/failure/suspicious/forbidden events
  - Includes IP, user agent, threat codes, and context
  - Logged to structured logger with appropriate severity levels
- ✅ Rate limit headers on 429 responses:
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  - `Retry-After` header for blocked requests
  - Implemented in `secure-rate-limiter.ts` and all auth endpoints
- ✅ Security alerts endpoint (production-auth.ts):
  - `auditAuthEvent()` handles 4 event types: success, failure, suspicious, forbidden
  - Each type logged with appropriate severity (info/warn/error)

## Rollout Checklist
- Env:
  - `SESSION_SECRET` set
  - Firebase Admin vars set (no secrets in repo)
  - Redis/Upstash envs (if using distributed rate limits)
- Smoke:
  - Auth send/verify
  - Onboarding POST
  - Logout cookie clear
  - Admin CSRF (one POST)

## References
- apps/web/middleware.ts
- apps/web/src/lib/session.ts
- apps/web/src/app/api/auth/*
- apps/web/src/lib/secure-auth-utils.ts
