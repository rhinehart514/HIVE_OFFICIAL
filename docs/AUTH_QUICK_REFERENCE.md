# HIVE Auth System - Quick Reference & Action Items

## Critical Security Issues (Must Fix Before Production)

### 1. Issue #4: No Refresh Token Mechanism (HIGH)
**File**: `/apps/web/src/lib/session.ts:18`  
**Problem**: 30-day session tokens with no refresh capability  
**Severity**: HIGH - Compromised token valid for entire 30 days  
**Fix**: Implement OAuth2 refresh token flow (15-min access + 7-day refresh)  
**Time**: 4-6 hours

### 2. Issue #7: Dev JWT Signature Bypass (HIGH)
**File**: `/apps/web/src/lib/middleware/auth.ts:44-107`  
**Problem**: Development mode decodes JWT without verifying signature  
**Severity**: HIGH - Allows privilege escalation in dev  
**Fix**: Always verify JWT signatures, use `jwtVerify()` library  
**Time**: 2 hours

### 3. Issue #13: Campus Isolation Not Enforced (MEDIUM-HIGH)
**File**: `/packages/auth-logic/src/hooks/use-auth.ts:115, 136, 159`  
**Problem**: campusId defaults to 'ub-buffalo' without server validation  
**Risk**: Users could access other campus data if frontend sends different ID  
**Fix**: Store campusId in server-issued JWT, validate in all API routes  
**Time**: 3-4 hours

---

## Medium Priority Issues (High Impact)

### 4. Issue #1: Session Stored in sessionStorage (MEDIUM)
**File**: `/packages/auth-logic/src/session-manager.ts:120`  
**Problem**: Stores session metadata in sessionStorage (XSS accessible)  
**Fix**: Move to httpOnly cookies only  
**Time**: 2 hours

### 5. Issue #11: CSRF Tokens in Memory (MEDIUM)
**File**: `/apps/web/src/lib/csrf-protection.ts:68-69`  
**Problem**: Uses Map that's lost on server restart  
**Risk**: Multi-server deployment won't work; tokens reset on deploy  
**Fix**: Use Redis or Firestore for persistent token store  
**Time**: 2-3 hours

### 6. Issue #8: Predictable dev_token_ Format (MEDIUM)
**File**: `/apps/web/src/lib/middleware/auth.ts:122-149`  
**Problem**: dev_token_userId format can be forged  
**Fix**: Add HMAC signature to tokens  
**Time**: 1-2 hours

### 7. Issue #10: Heavy `any` Type Usage (MEDIUM)
**File**: `/apps/web/src/lib/middleware/index.ts:72-84`  
**Problem**: 10+ instances of `any` bypass TypeScript safety  
**Fix**: Use proper types (AuthenticatedRequest, etc.)  
**Time**: 4 hours

---

## Quick Status Dashboard

```
Authentication Status:
├── Firebase Integration ..................... ✓ GOOD
├── Session Management ....................... ⚠️ NEEDS WORK
│   ├── Token generation ..................... ✓ Secure
│   ├── Token storage ........................ ❌ sessionStorage issue
│   ├── Token refresh mechanism .............. ❌ MISSING
│   └── Token revocation ..................... ❌ MISSING
├── CSRF Protection .......................... ⚠️ MOSTLY GOOD
│   ├── Token generation ..................... ✓ Secure
│   ├── Validation logic ..................... ✓ Good
│   └── Storage .............................. ❌ In-memory only
├── Admin Routes ............................. ✓ GOOD
├── Campus Isolation ......................... ⚠️ INCOMPLETE
├── Rate Limiting ............................ ⚠️ PARTIAL
├── Error Handling ........................... ✓ GOOD
├── Type Safety .............................. ❌ POOR (many `any`)
└── Dev Mode Security ........................ ❌ POOR

Overall Score: 6.5/10
Production Ready: ⚠️ WITH CRITICAL FIXES
```

---

## File-by-File Severity Scores

| File | Issues | Critical | Score | Status |
|------|--------|----------|-------|--------|
| `auth.ts` | 4 | 2 | 3/10 | 🔴 CRITICAL |
| `session.ts` | 2 | 1 | 4/10 | 🔴 CRITICAL |
| `use-auth.ts` | 2 | 1 | 5/10 | 🟠 HIGH |
| `session-manager.ts` | 3 | 0 | 5/10 | 🟠 HIGH |
| `csrf-protection.ts` | 2 | 0 | 7/10 | 🟡 MEDIUM |
| `firebase-config.ts` | 1 | 0 | 6/10 | 🟡 MEDIUM |
| `error-handler.ts` | 0 | 0 | 9/10 | 🟢 GOOD |
| `response.ts` | 0 | 0 | 9/10 | 🟢 GOOD |
| `withAdminCampusIsolation.ts` | 0 | 0 | 9/10 | 🟢 GOOD |

---

## Exported Functions & Their Security Status

### @hive/auth-logic Exports

```typescript
// ✓ Safe - properly implemented
export { useAuth }
export { FirebaseErrorHandler }
export { handleAuthError, AuthenticationError }
export { SessionManager, trackUserActivity, useActivityTracking }
export { auth }

// ❌ Deprecated - throws error
export { getCurrentUser }  // Intentionally broken
```

### Middleware Exports

```typescript
// ✓ Safe - well implemented
export { withAuth }
export { withAdminAuth }
export { getUserId, getUserEmail }
export { withErrorHandling, handleApiError }
export { withResponse, respond }

// ⚠️ Needs improvement - has issues
export { withAuthAndErrors }  // 'any' types
export { withAdminAuthAndErrors }  // 'any' types
export { withValidation }  // 'any' types
```

---

## Testing Checklist Before Production Launch

### Authentication Flow
- [ ] Login with valid @buffalo.edu email works
- [ ] Login with non-@buffalo.edu email rejects
- [ ] Magic link validation works
- [ ] Session cookie set with httpOnly flag
- [ ] Session expires correctly
- [ ] Refresh token flow works (when implemented)
- [ ] Logout clears session properly

### Authorization
- [ ] Regular users can't access admin endpoints
- [ ] Admin users can access admin endpoints
- [ ] Campus isolation prevents cross-campus access
- [ ] Rate limiting blocks after N failed attempts

### CSRF Protection
- [ ] POST/PUT/DELETE without CSRF token rejects
- [ ] CSRF tokens validate correctly
- [ ] CSRF tokens expire after 1 hour
- [ ] Cross-origin requests are blocked
- [ ] Invalid referer headers are rejected

### Error Handling
- [ ] Firebase auth errors show friendly messages
- [ ] Network errors show retry option
- [ ] Invalid tokens show sign-in prompt
- [ ] Rate limit errors show wait time

### Development Mode
- [ ] Dev mode doesn't work in production env
- [ ] Dev mode logs are visible
- [ ] No dev mode tokens work in production
- [ ] Firebase is always required (no mocks)

---

## Code Patterns to Follow

### ✓ DO: Proper Auth Pattern
```typescript
export const POST = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request);
  const campusId = request.user.campusId;  // From JWT
  
  // All queries must include campusId check
  const query = query(
    collection(db, 'spaces'),
    where('campusId', '==', campusId),
    where('active', '==', true)
  );
  
  return respond.success(data);
});
```

### ❌ DON'T: Anti-patterns to Avoid
```typescript
// 1. No auth enforcement
export const POST = async (request) => {
  // Missing withAuthAndErrors!
};

// 2. Campus isolation optional
const campusId = request.query.campusId || 'ub-buffalo';
// Request could override campusId!

// 3. Using 'any' types
handler: (request: any, context: any) => {
  // Type safety lost
}

// 4. Trust dev tokens in production
if (isDevelopment && idToken.startsWith('dev_token_')) {
  // Would work in production if env misconfig!
}

// 5. Store sensitive data in sessionStorage
sessionStorage.setItem('token', actualToken);
// XSS accessible!
```

---

## Deployment Checklist

### Before Launch
- [ ] Fix Issues #4, #7, #13 (critical)
- [ ] Add comprehensive audit logging
- [ ] Test all 149 API routes for campus isolation
- [ ] Verify no `any` types in auth code
- [ ] Test with 100+ concurrent users
- [ ] Load test rate limiting
- [ ] Verify CSRF tokens work across servers

### Post-Launch Monitoring
- [ ] Monitor failed auth attempts
- [ ] Alert on unusual login patterns
- [ ] Track token refresh failures
- [ ] Monitor CSRF violations
- [ ] Check rate limit bucket usage

---

## Emergency Response

### If Token Compromised
1. Add token to blacklist immediately
2. Force user re-authentication
3. Invalidate all sessions for user
4. Check access logs for unauthorized activity

### If CSRF Bypass Detected
1. Invalidate all CSRF tokens
2. Force all users to refresh
3. Investigate origin

### If Campus Isolation Breached
1. Audit all inter-campus queries in logs
2. Invalidate sessions
3. Notify affected users

---

## Resources

- Full Audit: `docs/AUTH_SECURITY_AUDIT.md`
- Session Storage: `apps/web/src/lib/session.ts`
- Auth Middleware: `apps/web/src/lib/middleware/auth.ts`
- CSRF Protection: `apps/web/src/lib/csrf-protection.ts`
- Auth Logic: `packages/auth-logic/src/`

