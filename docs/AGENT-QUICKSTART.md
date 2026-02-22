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

## Boot Order

1. **`CLAUDE.md`** (repo root) — architecture, monorepo structure, full gotchas list, which docs to load for which task
2. **This file** — trip-wires, task patterns, broken route status

Then load only what your task needs. See CLAUDE.md → Reference Docs table for the load signal.

---

## Critical Gotchas (top 4 — full list in CLAUDE.md → What NOT To Do)

1. **`startDate` is an ISO string.** CampusLabs events store it as `"2026-02-24T14:00:00.000Z"`. Never pass `new Date()` to `where('startDate', '>=', ...)` — use `.toISOString()`. The `startAt` Timestamp field accepts `Date` objects.

2. **`campusId` index is exempted.** `where('campusId', '==', campusId)` throws `FAILED_PRECONDITION`. Never filter by campusId. Use `where('startDate', '>=', now.toISOString())` instead.

3. **Two `PlacedToolDTO` types.** In `apps/web/src/`, always import from `@/hooks/use-space-tools` (has `name`/`description`). Never import from `@hive/core` in app code.

4. **Collection is `tool_states` not `toolStates`.** Pattern: `{toolId}_{spaceId}_shared` / `{toolId}_{spaceId}_{userId}`.

**Current broken routes (load `docs/KNOWN_STATE.md` for full specs):**
- `/api/events/personalized` — events return but `coverImageUrl` is null (field is `imageUrl`) and `spaceHandle` is null (doesn't exist on events — batch-resolve from spaces).
- `/api/events?spaceId=...` — returns 0 (Date vs ISO string in `fetchDocsForTimeField`).

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
