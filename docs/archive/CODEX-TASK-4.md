# CODEX-TASK-4: Week 3 — Distribution & Real-Time

## Context
You're working on HIVE, a campus creation platform. Weeks 1-2 built the creation engine (custom blocks, 50 composition patterns, intent detection, space enrichment, rate limiting). Week 3 is about how tools spread and stay alive.

**Codebase**: Next.js 15 Turborepo monorepo. Firebase backend. `apps/web/` is the main app.

**Key files you'll need:**
- `apps/web/src/app/api/tools/` — tool API routes
- `apps/web/src/app/api/tools/[toolId]/clone/route.ts` — clone endpoint (exists but basic)
- `apps/web/src/app/api/tools/[toolId]/state/stream/route.ts` — SSE stream route (exists from Week 1)
- `apps/web/src/hooks/use-tool-runtime.ts` — client-side tool runtime (1,048 lines)
- `apps/web/src/app/api/notifications/` — notification system
- `apps/web/src/lib/notification-service.ts` — notification helpers
- `packages/core/src/domain/hivelab/custom-block.types.ts` — type definitions
- `apps/web/src/lib/ai-generator/composition-patterns.ts` — pattern system with `clonePattern()`

## Tasks

### Task 1: Fork/Remix One-Tap Flow
The clone API exists at `apps/web/src/app/api/tools/[toolId]/clone/route.ts`. Make it production-ready:

1. **Read the existing clone route** first to understand what's there
2. Add provenance tracking: every cloned tool stores `forkedFrom: { toolId, userId, timestamp }` and the original gets `forkCount` incremented
3. Add a remix mode: `POST /api/tools/[toolId]/clone` with `{ mode: 'fork' | 'remix' }`. Fork = exact copy. Remix = copy with tool opened in edit mode (set `status: 'draft'`).
4. Add permission check: tool must be `published` or `public` to be cloned. Creator can always clone their own.
5. Return the new tool ID so the client can redirect.

### Task 2: Real-Time State Sync (Wire SSE Client)
The SSE route exists at `apps/web/src/app/api/tools/[toolId]/state/stream/route.ts`. Wire the client side:

1. **Read the existing SSE route and `use-tool-runtime.ts`** first
2. Create `apps/web/src/hooks/use-tool-state-stream.ts` — a React hook that:
   - Connects to the SSE endpoint for a given toolId
   - Parses incoming state updates and merges them into local state
   - Handles reconnection with exponential backoff (1s, 2s, 4s, max 30s)
   - Cleans up on unmount
   - Exposes `{ state, isConnected, error }` 
3. Add optimistic updates: when user changes state locally, apply immediately and queue the server write. If server write fails, rollback.
4. Handle conflict resolution: last-write-wins with timestamp comparison. If server state is newer than local pending write, accept server state.

### Task 3: Cross-Space Tool Discovery
Tools created in one space should be discoverable by others. Build the discovery API:

1. Create `apps/web/src/app/api/tools/discover/route.ts` — `GET` endpoint that returns published tools with filters:
   - `?category=governance|scheduling|commerce|content|social|events|org-management|campus-life` (maps to composition pattern categories)
   - `?spaceType=student_org|university_org|greek_life|campus_living|hive_exclusive` 
   - `?sort=popular|recent|trending` (popular = most forks + uses, trending = most activity in 7 days)
   - `?q=search_term` — full-text search on title + description
   - `?limit=20&offset=0` — pagination
2. Each tool in results includes: `{ id, title, description, category, creator, spaceOrigin, forkCount, useCount, createdAt, thumbnail }`
3. Add `useCount` tracking: increment a counter each time a tool is loaded/executed (in the existing tool execution flow). Use a Firestore field, not a separate collection.
4. Trending algorithm: `score = (forks * 3 + uses) * recencyMultiplier` where recency = `1 / (1 + daysSinceCreation / 7)`

### Task 4: Notification Hooks for Tool Events
Wire tool lifecycle events into the existing notification system:

1. **Read `apps/web/src/lib/notification-service.ts`** to understand the existing pattern
2. Create `apps/web/src/lib/tool-notifications.ts` with functions that fire notifications for:
   - `tool.forked` — "Someone forked your [tool name]" → sent to original creator
   - `tool.deployed` — "[tool name] was added to [space name]" → sent to space members
   - `tool.milestone` — "Your [tool name] hit [10/50/100] uses!" → sent to creator (thresholds: 10, 50, 100, 500, 1000)
   - `tool.updated` — "[tool name] was updated" → sent to users who forked it
3. Each notification includes: `{ type, title, body, toolId, actionUrl, timestamp }`
4. Wire these into the relevant API routes (clone route for fork, deploy route for deployed, execution flow for milestones)
5. Don't create new notification infrastructure — use whatever pattern `notification-service.ts` already uses.

## Rules
- **Read existing code before writing.** Understand the patterns already in use.
- **TypeScript strict mode.** No `any` types unless absolutely necessary.
- **Use firebase-admin** for all server-side Firestore operations (not client SDK).
- **Don't modify existing tests.** If you add new code, it should typecheck.
- **Keep imports clean** — use existing barrel exports where they exist.
- **Commit when done** with message: `feat(hivelab): Week 3 - fork/remix, real-time sync, discovery, notifications`
- **Push with `LEFTHOOK=0 git push`**

When completely finished, run this command to notify me:
openclaw gateway wake --text "Done: Week 3 complete - fork/remix flow, SSE client wiring, cross-space discovery API, tool notification hooks" --mode now
