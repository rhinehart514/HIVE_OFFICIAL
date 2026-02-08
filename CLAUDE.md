# HIVE

Creation platform for students. Build tools in seconds, share them anywhere. Polls, signups, countdowns, leaderboards — no code, just results.

---

## Decision Filter

Every decision runs through one question:

**Does this help a student build something useful and share it with their campus?**

If no → kill it, ignore it, or defer it.

---

## Constraints

Non-negotiable. Every PR.

| Rule | Implementation |
|------|----------------|
| Campus isolation | Every query filters by `campusId` from session. Never accept from client. |
| Real identity | Campus email verification required. No anonymous users. |
| Validation | Zod schemas on all API inputs. Never trust client data. |
| Design tokens | All visual values from `@hive/tokens`. No hardcoded colors/spacing/radii. |
| Real handlers | Every button does real work. No console.log placeholders. |
| No dead ends | Every state shows next action. Empty states guide, never "Nothing here". |
| Motion | All transitions use `@hive/ui/motion` or `@hive/ui/tokens/motion`. Subtle, <300ms. |

---

## Patterns

**Adding an API route:**
```
apps/web/src/app/api/[domain]/route.ts
```
- Use `withAuthAndErrors` wrapper from `@/lib/middleware`
- Get user info: `getUserId(req)`, `getUserEmail(req)`, `getCampusId(req)`
- Validate with Zod: `const body = schema.parse(await req.json())`
- Return via `respond.success({ data })` or `respond.error('msg', 'CODE')`
- For admin routes: use `withAdminAuthAndErrors`
- For public routes: use `withErrors`
- For routes with body validation: use `withAuthValidationAndErrors(schema, handler)`
- **Approved alternatives** (do NOT migrate to standard):
  - `withSecureAuth` (`@/lib/api-auth-secure`) — Redis rate limiting, cookie auth fallback, campus isolation. Used by feed/posts routes.
  - `withValidation` (`@/lib/validation-middleware`) — Threat scanning (SQL injection, XSS detection). Used by pre-auth routes (send-code, verify-code).

```typescript
// Example: most common pattern
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';

export const GET = withAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);
  // ... query filtered by campusId
  return respond.success({ data });
});
```

**Adding a component:**
```
packages/ui/src/design-system/primitives/ComponentName.tsx       # Base primitives (Button, Input, Card, etc.)
packages/ui/src/design-system/components/[domain]/Component.tsx  # Domain components (spaces/, profile/, campus/, hivelab/)
packages/ui/src/design-system/templates/TemplateName.tsx         # Page shells (AppShell, SpaceShell, PageTransition)
apps/web/src/components/[feature]/ComponentName.tsx              # Feature-specific (landing/, spaces/, profile/, etc.)
```
- Check `packages/ui` first — don't duplicate
- Use design tokens for all values
- Import motion from `@hive/ui/motion` or `@hive/ui/tokens/motion`

**Adding a hook:**
```
apps/web/src/hooks/use-[name].ts       # Feature hooks (use-session, use-feed, use-spaces-browse, etc.)
packages/hooks/src/use-[name].ts       # Shared hooks (use-hive-query, use-realtime-document, etc.)
```

**Adding a page:**
```
apps/web/src/app/[route]/page.tsx
```

**Adding a Zod schema:**
```
packages/validation/src/[domain].schema.ts
```

**Using feature flags:**
```typescript
import { useFeatureFlags } from '@/hooks/use-feature-flags';
const { dmsEnabled } = useFeatureFlags();
if (!dmsEnabled) return null;
```

---

## Monorepo Packages

| Package | Name | Purpose |
|---------|------|---------|
| `apps/web` | `@hive/web` | Main Next.js 15 app |
| `apps/admin` | `@hive/admin` | Admin dashboard (port 3001) |
| `packages/ui` | `@hive/ui` | Design system: primitives, components, templates, motion |
| `packages/tokens` | `@hive/tokens` | Design tokens: colors, spacing, typography, motion, layout |
| `packages/core` | `@hive/core` | Domain logic, types, services (DDD structure) |
| `packages/hooks` | `@hive/hooks` | Shared React hooks (queries, realtime, analytics) |
| `packages/firebase` | `@hive/firebase` | Firebase client config, App Check |
| `packages/validation` | `@hive/validation` | Zod schemas for all domains |
| `packages/auth-logic` | `@hive/auth-logic` | Auth flow logic |
| `packages/config/*` | `@hive/config-*` | Shared TypeScript and ESLint configs |
| `infrastructure/firebase` | — | Firebase cloud functions |

---

## File Map

| Need | Location |
|------|----------|
| API routes | `apps/web/src/app/api/` |
| Pages | `apps/web/src/app/` |
| Middleware (edge) | `apps/web/src/middleware.ts` |
| API middleware | `apps/web/src/lib/middleware/` (`withAuthAndErrors`, etc.) |
| Server libs | `apps/web/src/lib/` (session, firebase-admin, rate-limit, etc.) |
| Feature components | `apps/web/src/components/` (landing/, spaces/, profile/, hivelab/, etc.) |
| Context providers | `apps/web/src/contexts/` (space/, tool/) |
| App hooks | `apps/web/src/hooks/` |
| Shared hooks | `packages/hooks/src/` |
| Primitives | `packages/ui/src/design-system/primitives/` |
| Domain components | `packages/ui/src/design-system/components/` (spaces/, profile/, campus/, hivelab/) |
| Templates/shells | `packages/ui/src/design-system/templates/` (AppShell, SpaceShell) |
| Motion variants | `packages/ui/src/motion/` and `packages/ui/src/tokens/motion.ts` |
| Design tokens | `packages/tokens/src/` (colors, spacing, typography, motion, layout, radius, effects) |
| Core domain logic | `packages/core/src/domain/` (spaces/, profile/, feed/, rituals/, creation/, campus/, identity/) |
| Core server exports | `packages/core/src/server.ts` |
| Zod schemas | `packages/validation/src/` |
| Firebase client | `packages/firebase/src/` |
| Firebase admin | `apps/web/src/lib/firebase-admin.ts` |

---

## Commands

```bash
pnpm dev                        # Start all (turbo)
pnpm --filter=@hive/web dev     # Web only
pnpm --filter=@hive/admin dev   # Admin only (port 3001)
pnpm build && pnpm typecheck    # Before merge
pnpm lint                       # Lint all packages
pnpm test                       # Run tests (vitest)
pnpm storybook:dev              # Storybook on port 6006
pnpm seed:production            # Seed production data
pnpm seed:production:dry        # Dry run seed
pnpm launch:verify              # Verify launch readiness
pnpm migration:run              # Run migrations
pnpm migration:status           # Check migration status
```

---

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Firebase (Firestore, Auth, Storage) · Radix UI · Framer Motion · Zod · TanStack Query · Zustand · jose (JWT) · Vercel

---

## Reference

| Topic | Location |
|-------|----------|
| Current priorities | `TODO.md` |
| System architecture | `docs/ARCHITECTURE.md` |
| API routes reference | `docs/API.md` |
| All pages/routes | `docs/PAGES.md` |
| Design system guide | `docs/DESIGN_SYSTEM.md` |
| Data model (Firebase) | `docs/DATA_MODEL.md` |
| Hooks reference | `docs/HOOKS.md` |
