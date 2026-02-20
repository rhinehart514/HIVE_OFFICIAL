# AGENT-QUICKSTART.md — HIVE Cheatsheet for AI Agents

Read this first. Then read `CLAUDE.md` at the repo root for the full reference.

---

## Run the Dev Server

```bash
pnpm dev                        # Next.js on http://localhost:3000
# Set HIVE_DEV_BYPASS=true in apps/web/.env.local to skip auth
# Dev user: dev-user-001 / campus: ub-buffalo
```

---

## 3 Files to Read First

1. **`CLAUDE.md`** (repo root) — Full architecture, ERD, API routes, gotchas
2. **`apps/web/src/lib/middleware.ts`** — Auth middleware pattern used by every API route
3. **`packages/ui/src/components/hivelab/elements/registry.tsx`** — All HiveLab elements

---

## 5 Things That Will Trip You Up

1. **Two `PlacedToolDTO` types exist.** The one in `@hive/core` has `titleOverride` but no `name`. The one in `@/hooks/use-space-tools` has `name` and `description`. In `apps/web/src/`, always use the hook version.

2. **Event time fields are inconsistent.** Events use `startDate`, `startAt`, or `startTime` depending on how they were created. Always use `getEventStartDate()` from `@/lib/events/event-time` — never query by one field alone.

3. **The collection is `tool_states`, not `toolStates`.** Doc IDs follow the pattern `{toolId}_{spaceId}_shared` (shared state) or `{toolId}_{spaceId}_{userId}` (personal state). They're flat documents, not subcollections.

4. **API routes must use `respond.success()` / `respond.error()`.** Never use `NextResponse.json()` directly — it bypasses the middleware response format.

5. **HiveLab connections don't actually work** between standard elements. Templates define `connections[]` but only `custom-block` can consume connected inputs. Don't build features that assume form output flows into result-list.

---

## Common Task Patterns

### Add a New API Route

```
apps/web/src/app/api/your-route/route.ts
```

```typescript
import { withAuthAndErrors, getUserId, getCampusId } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';

export const POST = withAuthAndErrors(async (req, { params }, respond) => {
  const userId = getUserId(req as AuthenticatedRequest);
  const campusId = getCampusId(req as AuthenticatedRequest);

  // Use repositories, not raw Firestore
  const spaceRepo = getServerSpaceRepository();

  return respond.success({ data });
});
```

### Add a New Page

```
apps/web/src/app/your-page/page.tsx
```

Next.js 15 App Router. Use `'use client'` for interactive pages. Import UI from `@hive/ui/design-system/primitives`. Use design tokens from `@hive/tokens` — never hardcode colors.

### Add a New HiveLab Element

1. Create component in `packages/ui/src/components/hivelab/elements/`
2. Register in `registry.tsx` with a unique ID
3. If interactive (writes state), add execute handler in `apps/web/src/app/api/tools/execute/route.ts`
4. Add to quick templates in `packages/ui/src/lib/hivelab/quick-templates.ts` if needed

### Add a React Query Hook

```
apps/web/src/hooks/use-your-thing.ts
```

```typescript
import { useQuery } from '@tanstack/react-query';

export function useYourThing(id: string) {
  return useQuery({
    queryKey: ['your-thing', id],
    queryFn: () => fetch(`/api/your-thing/${id}`).then(r => r.json()),
  });
}
```

### Work with Firestore Collections

Check the ERD in `CLAUDE.md` first — the collection almost certainly already exists. 164 collections are already in use. Use repositories in API routes, not raw `dbAdmin.collection()`.

---

## Architecture at a Glance

```
User → Next.js App Router → API Routes (withAuthAndErrors)
                                 ↓
                         @hive/core repositories
                                 ↓
                           Firestore / RTDB
```

- **8 packages:** core, ui, hooks, tokens, firebase, auth-logic, validation, config
- **DDD architecture:** Aggregates → Repositories → DTOs
- **Auth:** httpOnly JWT cookies (access + refresh tokens)
- **HiveLab:** 33 elements, 10 with execute handlers, 30 quick templates
- **Design:** Dark theme, monochrome + gold accent, `@hive/tokens` for everything
