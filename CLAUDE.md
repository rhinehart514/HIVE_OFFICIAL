# CLAUDE.md — HIVE Codebase Guide

HIVE is a campus social platform where students create tools for their communities.
Spaces (orgs, greek life, dorms) are the core unit. HiveLab is the creation runtime
that lets org leaders build interactive tools (polls, RSVPs, leaderboards, forms)
deployed directly into their space — no separate hosting, no cold start.

## Reference Docs (read on-demand, not loaded every session)

- **Firestore Schema:** `docs/FIRESTORE_SCHEMA.md` — full ERD, all collections, relationships
- **API Routes:** `docs/API_ROUTES.md` — all 268+ routes by category
- **HiveLab Elements:** `docs/HIVELAB_ELEMENTS.md` — 33 elements, execute handlers, status
- **Package Exports:** `docs/PACKAGE_EXPORTS.md` — import reference for all @hive packages
- **Known State:** `docs/KNOWN_STATE.md` — stubs, gaps, and implementation status
- **Design Rules:** `docs/DESIGN_RULES.md` — **read before building any UI.** Custom vs. library decisions, approved packages, token rules, anti-patterns.
- **Design System:** `docs/DESIGN_SYSTEM.md` — full token reference, component API, motion patterns

---

## Monorepo Structure

```
HIVE/
├── apps/
│   ├── web/                     Next.js 15 app (main product, port 3000)
│   │   ├── src/app/             Routes + API routes (~268 API routes)
│   │   ├── src/components/      Shared app components
│   │   ├── src/hooks/           React Query hooks
│   │   └── src/lib/             Utilities, middleware, feature flags
│   └── admin/                   Admin dashboard (Next.js, port 3001)
├── packages/
│   ├── core/                    Domain logic (DDD) — aggregates, repos, DTOs
│   ├── ui/                      Design system + HiveLab elements + Storybook
│   ├── hooks/                   Shared React Query hooks
│   ├── tokens/                  Design tokens (colors, motion, layout)
│   ├── firebase/                Firebase client SDK wrapper
│   ├── auth-logic/              JWT auth with httpOnly cookies
│   ├── validation/              Zod schemas
│   └── config/                  Shared ESLint + TypeScript configs
├── functions/                   Firebase Cloud Functions
├── infrastructure/              Docker, Kubernetes, Firebase configs
├── scripts/                     81 utility scripts (migrations, seeding, scrapers)
└── docs/                        Architecture docs, specs, research
```

**Stack:** Next.js 15.5.9 · React 19 · TypeScript 5.9.3 · pnpm · Turborepo · Firestore · Vercel

---

## Architecture: Domain-Driven Design

API routes use repositories, not raw Firestore.

### Aggregates (packages/core/src/domain/)

| Aggregate | File | What it owns |
|-----------|------|--------------|
| **Space** | `spaces/aggregates/enhanced-space.ts` | Members, tools, boards, events, tabs |
| **Profile** | `profile/aggregates/enhanced-profile.ts` | User identity, interests, builder level |
| **Connection** | `profile/aggregates/connection.ts` | Friend graph, follow relationships |
| **Feed** | `feed/enhanced-feed.ts` | Campus activity feed logic |
| **Ritual** | `rituals/aggregates/enhanced-ritual.ts` | Streaks, recurring behaviors |

### Repositories

```typescript
import { getServerSpaceRepository } from '@hive/core/server';
const spaceRepo = getServerSpaceRepository(); // singleton — call once, reuse
```

All from `@hive/core/server`: `getServerSpaceRepository`, `getServerProfileRepository`, `getServerBoardRepository`, `getServerMessageRepository`, `getServerInlineComponentRepository`, `getServerTemplateRepository`, `getServerUnitOfWork`

### Application Services (from `@hive/core/server`)

`createServerSpaceManagementService`, `createServerSpaceDeploymentService`, `createServerSpaceChatService`

### DTOs — CRITICAL GOTCHA

**Two `PlacedToolDTO` types exist. Use the right one.**

| Import | Use when |
|--------|----------|
| `import type { PlacedToolDTO } from '@/hooks/use-space-tools'` | App components (has `name`, `description`, `version`) |
| `import { PlacedToolDTO } from '@hive/core'` | Core domain layer only (has `titleOverride`, no `name`) |

---

## HiveLab Architecture

### Three Tiers

| Tier | What | Elements |
|------|------|---------|
| **T1** | Standalone — work anywhere | Poll, RSVP, Form, Counter, Leaderboard, Timer, SignupSheet, ChecklistTracker |
| **T2** | Space-deployed — need spaceId | MemberList, SpaceEvents, Announcement, ConnectionList, EventPicker |
| **T3** | Agents + campus data (future) | CustomBlock (iframe sandbox) |

10 interactive elements with execute handlers: `poll-element`, `counter`, `rsvp-button`, `checklist-tracker`, `signup-sheet`, `form-builder`, `leaderboard`, `progress-indicator`, `timer`, `announcement`. Everything else is display-only. Full list in `docs/HIVELAB_ELEMENTS.md`.

### Connection System — NOT functional for standard elements
Only `custom-block` resolves connected inputs. Don't build features relying on element-to-element data flow.

### Generation

`GOOSE_BACKEND=groq` → Groq (llama-3.1-8b-instant). Default → rules-based regex (~100ms).
Quick templates: `getQuickTemplate(id)` from `@hive/ui`. AI: `POST /api/tools/generate` (NDJSON stream).

### State Architecture

```typescript
// Shared: tool_states/{toolId}_{deploymentId}_shared
// Personal: tool_states/{toolId}_{deploymentId}_{userId}
// deploymentId = spaceId (space tools) or "standalone"
sharedState.counters["poll-1:option-a"] = 12
userState.participation["poll-1:hasVoted"] = true
```

Real-time sync: Firestore `onSnapshot()` via SSE at `/api/tools/[toolId]/state/stream`

---

## Key Gotchas

### 1. Event time fields — use all three
`startDate`, `startAt`, OR `startTime` depending on creation. Always use `getEventStartDate()` from `@/lib/events/event-time`.

### 2. Collection name drift
| Wrong | Right |
|-------|-------|
| `toolStates` | `tool_states` |
| `spaceTools` / `toolDeployments` / `placed_tools` | `placedTools` |
| `eventRsvps` | `rsvps` (canonical, check both) |

### 3. Auth middleware
```typescript
import { withAuthAndErrors, getUserId, getCampusId } from '@/lib/middleware';
export const POST = withAuthAndErrors(async (req, { params }, respond) => {
  const userId = getUserId(req as AuthenticatedRequest);
  return respond.success(data);
});
```

### 4. Dev auth bypass
`HIVE_DEV_BYPASS=true` → skips JWT. Dev user: `dev-user-001` / campus `ub-buffalo`.

### 5. Feed architecture — two separate feeds
| Feed | Route | Source collection |
|------|-------|-------------------|
| Space feed | `/api/spaces/[spaceId]/feed` | `space_feed` |
| Global feed | `/api/feed/global` | `analytics_events` |
| Personalized events | `/api/events/personalized` | `events` (ranked) |

### 6. Feature flags
`NEXT_PUBLIC_HIVELAB_PUBLIC=true` → HiveLab visible to all. `NEXT_PUBLIC_ACCESS_GATE_ENABLED=true` → signup gate.

### 7. Error responses — always use `respond`
```typescript
return respond.error('Message', 'ERROR_CODE', { status: 400 });
// Never: return NextResponse.json(...)
```

---

## Design System

Tokens from `@hive/tokens`. Never hardcode colors.

```
bg-black / bg-[#080808]                    // void / surface
border-white/[0.06] / border-white/[0.1]   // default / hover
text-white / text-white/50 / text-white/30 // primary / secondary / tertiary
text-[#FFD700] / bg-[#FFD700]              // gold — CTA, active, brand only
rounded-2xl (cards) / rounded-xl (inputs)
font-mono text-[11px] uppercase tracking-[0.14em]  // section headers
```

Motion: `MOTION.ease.premium` from `@hive/tokens` for all animations.

---

## Navigation

4-tab layout: Feed -> Spaces -> Lab -> Profile. Nav in `apps/web/src/lib/navigation.ts`.

Key routes: `/discover` (home), `/spaces`, `/s/[handle]` (space), `/lab` (creator), `/lab/templates` (template creation), `/lab/new` (AI creation), `/t/[toolId]` (standalone tool), `/me` (profile), `/u/[handle]` (public profile), `/settings`, `/notifications`

---

## Dev Commands

```bash
pnpm dev          # port 3000
pnpm build        # all packages + apps
pnpm lint / pnpm typecheck
pnpm test / pnpm test:watch
pnpm storybook:dev   # port 6006
pnpm seed:emulator / pnpm seed:production --dry-run
pnpm migration:run / pnpm migration:status / pnpm migration:rollback
```

Key env: `HIVE_DEV_BYPASS=true` (skip auth), `GOOSE_BACKEND=groq` (AI gen)

---

## What NOT To Do

- **Never create new Firestore collections** without checking `docs/FIRESTORE_SCHEMA.md`
- **Never use `NextResponse.json()` directly** — use `respond.*`
- **Never import core `PlacedToolDTO` in `apps/web/src/`** — use the hook version
- **Never import `@hive/core/server` in client components**
- **Never hardcode colors** — use design tokens
- **Never query events by `startDate` only** — use `getEventStartDate()`
- **Never write to `toolStates`** — the collection is `tool_states`
- **Never await non-critical side effects** — fire and forget with try/catch
- **Never modify `/lab/new` flow** — it's the AI path; templates are `/lab/templates`
- **Never call repository factories repeatedly** — they're singletons
