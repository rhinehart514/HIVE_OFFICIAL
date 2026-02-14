# HIVE Auth Middleware Guide

## Recommended Patterns (from `@/lib/middleware`)

### 1. `withAuthAndErrors` — **Default for all authenticated routes**
- Auth + CSRF + Rate Limiting + Error Handling + Response Formatting
- Handler receives `(request: AuthenticatedRequest, context, respond)`
- Access user via `request.user.uid`, `request.user.email`, `request.user.campusId`

```ts
import { withAuthAndErrors, getUserId, getCampusId } from '@/lib/middleware';

export const GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request);
  const data = await fetchData(userId);
  return respond.success(data);
});
```

### 2. `withAuthValidationAndErrors` — **Authenticated + Zod body validation**
- Same as above + validates request body against a Zod schema
- Handler receives `(request, context, body, respond)`

```ts
import { withAuthValidationAndErrors } from '@/lib/middleware';
import { z } from 'zod';

const Schema = z.object({ name: z.string() });

export const POST = withAuthValidationAndErrors(Schema, async (request, context, body, respond) => {
  // body is typed as { name: string }
  return respond.success({ created: true });
});
```

### 3. `withOptionalAuth` — **Public routes that behave differently when authenticated**
- Attempts auth silently; doesn't fail if missing
- Use `getUser(request)` to check if auth succeeded

```ts
import { withOptionalAuth, getUser } from '@/lib/middleware';

export const GET = withOptionalAuth(async (request, context, respond) => {
  const user = getUser(request);
  // user is UserContext | undefined
  return respond.success({ authenticated: !!user });
});
```

### 4. `withErrors` — **Public routes (no auth)**
- Error handling + rate limiting only

### 5. `withAdminAuthAndErrors` — **Admin-only routes**
- Full admin verification with Firestore check

### 6. `withAdminPermission` — **Admin routes with RBAC**
- Verifies specific admin permissions

---

## DEPRECATED Patterns — Do Not Use

| Pattern | Location | Why Deprecated |
|---------|----------|----------------|
| `withAuth` from `api-auth-middleware` | `@/lib/api-auth-middleware` | No CSRF, no rate limiting, no error handling, different signature |
| `withAuthAndErrors` from `api-auth-middleware` | `@/lib/api-auth-middleware` | No CSRF, no rate limiting, weaker error handling |
| `validateApiAuth` direct calls | `@/lib/api-auth-middleware` | Raw function, no middleware wrapping |
| `getCurrentUser` from `auth-server` / `server-auth` | `@/lib/auth-server`, `@/lib/server-auth` | No error handling, no CSRF, no rate limiting, no campus resolution, returns null instead of 401 |
| Manual Bearer token parsing | Various routes | Reimplements auth poorly |

## Logger

Use `import { logger } from '@/lib/logger'` (canonical).

`@/lib/structured-logger` is a re-export wrapper for backward compat — imports from it are fine but new code should use `@/lib/logger` directly.
