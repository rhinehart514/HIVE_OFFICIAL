# CLAUDE.md — HIVE Codebase Guide

HIVE is a campus social platform where students create tools for their communities.
Spaces (orgs, greek life, dorms) are the core unit. HiveLab is the creation runtime
that lets org leaders build interactive tools (polls, RSVPs, leaderboards, forms)
deployed directly into their space — no separate hosting, no cold start.

---

## Monorepo Structure

```
HIVE/
├── apps/web/                    Next.js 15 app (main product)
│   ├── src/app/                 Routes + API routes
│   ├── src/components/          Shared app components
│   ├── src/hooks/               React Query hooks
│   └── src/lib/                 Utilities, middleware, feature flags
├── packages/core/               Domain logic (DDD)
│   └── src/domain/              Aggregates, entities, repositories, DTOs
└── packages/ui/                 Shared UI components + HiveLab elements
    └── src/components/hivelab/  Element registry, canvas, IDE, templates
```

---

## Architecture: Domain-Driven Design

The codebase uses DDD. API routes should use repositories, not raw Firestore.

### Aggregates (packages/core/src/domain/)

| Aggregate | File | What it owns |
|-----------|------|--------------|
| **Space** | `spaces/aggregates/enhanced-space.ts` | Members, tools, boards, events, tabs |
| **Profile** | `profile/profile.aggregate.ts` | User identity, interests, builder level |
| **Connection** | `connections/connection.ts` | Friend graph, follow relationships |
| **Feed** | `feed/enhanced-feed.ts` | Campus activity feed logic |
| **Ritual** | `rituals/enhanced-ritual.ts` | Streaks, recurring behaviors |

### Repositories

```typescript
// Always use repositories in API routes — not raw dbAdmin queries
import { getServerSpaceRepository } from '@hive/core/server';
const spaceRepo = getServerSpaceRepository();
const result = await spaceRepo.findById(spaceId);
```

| Repository | Method |
|-----------|--------|
| `SpaceRepository` | `getServerSpaceRepository()` from `@hive/core/server` |
| `TemplateRepository` | `getServerTemplateRepository()` from `@hive/core/domain/hivelab/templates/template.repository` |

### DTOs — CRITICAL GOTCHA

**There are two `PlacedToolDTO` types. Use the right one.**

| Import | Use when |
|--------|----------|
| `import type { PlacedToolDTO } from '@/hooks/use-space-tools'` | App components (has `name`, `description`, `version`) |
| `import { PlacedToolDTO } from '@hive/core'` | Core domain layer only (has `titleOverride`, no `name`) |

The hook version is the enriched UI type. Never use the core DTO in `apps/web/src/`.

---

## ERD — Firestore Collections

### Core Collections

```
campuses/{campusId}
  └─ id, name, domain (e.g. buffalo.edu)

users/{userId}
  └─ uid, email, campusId, displayName, createdAt

profiles/{userId}
  └─ interests[], yearOfStudy, housing, builderLevel, xp, avatarUrl

spaces/{spaceId}
  └─ name, handle, campusId, category, visibility, isLeader(userId),
     memberCount, description, iconURL, bannerImage

spaceMembers/{spaceId_userId}   ← composite key
  └─ spaceId, userId, role (member|leader|admin|moderator), joinedAt

events/{eventId}
  └─ spaceId, campusId, title, startDate|startAt|startTime (use all 3 in queries),
     location, rsvpCount, createdAt

rsvps/{rsvpId}                  ← canonical
  └─ eventId, userId, status (going|maybe|not_going), createdAt
eventRsvps/{id}                 ← legacy, check both in queries

tools/{toolId}
  └─ campusId, createdBy, name, description, status (draft|published|archived),
     composition (elements[], connections[]), remixedFrom, remixCount

placedTools/{placementId}       ← canonical deployment record
  └─ spaceId, toolId, placement, order, isActive, visibility, titleOverride, placedAt
deployedTools/{id}              ← legacy overlap, prefer placedTools

tool_states/{toolId}            ← HiveLab element runtime state (NOT toolStates)
  └─ sharedState: { counters{}, collections{}, timeline[], computed{} }
     userState/{userId}: { selections{}, participation{}, personal{}, ui{} }

posts/{postId}
  └─ spaceId, authorId, content, createdAt, likes, comments

boards/{boardId}
  └─ spaceId, title, linkedEventId (optional)

messages / spaceMessages        ← both exist, prefer spaceMessages for new queries
  └─ spaceId, authorId, content, createdAt, reactions{}

notifications/{notifId}
  └─ userId, type, category, title, body, read, createdAt

analytics_events/{id}           ← feeds global feed, NOT Firestore analytics
  └─ eventType (tool_created|tool_deployed|event_created|...), userId, spaceId,
     campusId, timestamp, metadata{}

fcmTokens/{userId}
  └─ token, platform, updatedAt

connections/{connectionId}
  └─ userId, connectedUserId, status, createdAt

friends/{id}
  └─ userId, friendId, status

featureFlags/{flagId}
  └─ key, enabled, description

campusData/{campusId}/dining/{id}   ← subcollection
  └─ hall, menu, hours
```

### Key Relationships

```
Campus → Spaces (1:many, via spaces.campusId)
Space → SpaceMembers (1:many, composite key spaceId_userId)
Space → Events (1:many, via events.spaceId)
Space → PlacedTools (1:many, via placedTools.spaceId)
Tool → PlacedTools (1:many, a tool can be deployed to multiple spaces)
Tool → tool_states (1:1, runtime state keyed by toolId)
Event → RSVPs (1:many, via rsvps.eventId)
User → Profiles (1:1, same userId)
User → Connections (many:many, via connections collection)
```

---

## HiveLab Architecture

### Three Tiers

| Tier | What | Elements |
|------|------|---------|
| **T1** | Standalone tools — work anywhere | Poll, RSVP, Form, Counter, Leaderboard, Timer, SignupSheet, ChecklistTracker |
| **T2** | Space-deployed — need spaceId context | MemberList, SpaceEvents, Announcement, ConnectionList, EventPicker |
| **T3** | Agents + campus data (future) | CustomBlock (iframe sandbox, spec'd not fully live) |

### Element Execute Handlers

Only these element types have server-side execute handlers in `/api/tools/execute/route.ts`:
`poll-element`, `counter`, `rsvp-button`, `checklist-tracker`, `signup-sheet`,
`form-builder`, `leaderboard`, `progress-indicator`, `timer`, `announcement`

Everything else is display-only (no state write on interaction).

### Generation

Controlled by env var `GOOSE_BACKEND`:
- `GOOSE_BACKEND=groq` → uses Groq (llama-3.3-70b-versatile) as primary
- Default → rules-based regex generator

Quick templates (no AI): `getQuickTemplate(id)` from `@hive/ui`
AI generation: `POST /api/tools/generate` streams NDJSON

### State Architecture

```typescript
// sharedState — visible to all users, in tool_states/{toolId}
sharedState.counters["poll-1:option-a"] = 12      // vote counts
sharedState.collections["form-1:submissions"]      // form responses
sharedState.timeline                               // last 100 events

// userState — per user, in tool_states/{toolId}/userState/{userId}
userState.participation["poll-1:hasVoted"] = true
userState.selections["poll-1:choice"] = "option-a"
```

Real-time sync: Firebase RTDB (not Firestore) via SSE at `/api/tools/[toolId]/state/stream`

---

## Key Gotchas

### 1. Event time fields — use all three
Events store time in `startDate`, `startAt`, OR `startTime` depending on how they were created.
Always query with fallback: `getEventStartDate()` from `@/lib/events/event-time`.

### 2. Collection name drift
| Wrong | Right |
|-------|-------|
| `toolStates` | `tool_states` |
| `spaceTools` | `placedTools` |
| `eventRsvps` | `rsvps` (canonical, but check both) |
| `toolDeployments` | `placedTools` |

### 3. Auth middleware
All authenticated API routes use `withAuthAndErrors` or `withAuthValidationAndErrors`:
```typescript
import { withAuthAndErrors, getUserId, getCampusId } from '@/lib/middleware';
export const POST = withAuthAndErrors(async (req, { params }, respond) => {
  const userId = getUserId(req as AuthenticatedRequest);
  const campusId = getCampusId(req as AuthenticatedRequest);
  // ...
  return respond.success(data);
});
```

### 4. Dev auth bypass
`HIVE_DEV_BYPASS=true` in `.env.local` → skips JWT validation.
Dev user: `dev-user-001` / `rhinehart514@gmail.com` / campus `ub-buffalo`.

### 5. Feed architecture — two separate feeds
| Feed | Route | What it shows |
|------|-------|---------------|
| Space feed | `/api/spaces/[spaceId]/feed` | Activity within one space (posts, events, tool_deploy, member_join) |
| Global feed | `/api/feed/global` | Campus-wide activity (reads `analytics_events` collection) |
| Personalized events | `/api/events/personalized` | Ranked events for a user (interest match + social + space + time) |

Writing to global feed = write to `analytics_events` collection.
Writing to space feed = write to `space_feed` collection with `spaceId`.

### 6. Feature flags
Check `apps/web/src/lib/feature-flags.ts`. Key flags:
- `NEXT_PUBLIC_HIVELAB_PUBLIC=true` → HiveLab visible to all users (not just leaders)
- `NEXT_PUBLIC_ACCESS_GATE_ENABLED=true` → waitlist/invite gate on signup

### 7. Error responses — always use `respond`
```typescript
return respond.error('Message', 'ERROR_CODE', { status: 400 });
return respond.success({ data });
// Never: return NextResponse.json(...)  ← bypasses middleware
```

---

## Design System

Design tokens from `@hive/tokens`. Never hardcode colors.

```typescript
// Background
bg-black          // void (#000000)
bg-[#080808]      // surface

// Borders (always hairline)
border-white/[0.06]   // default
border-white/[0.1]    // hover

// Text
text-white            // primary
text-white/50         // secondary
text-white/30         // tertiary

// Accent (use sparingly)
text-[#FFD700]    // gold — only for CTA, active states, brand marks
bg-[#FFD700]

// Radius
rounded-2xl       // cards (16px)
rounded-xl        // inputs, buttons (12px)

// Mono labels
font-mono text-[11px] uppercase tracking-[0.14em]   // section headers
```

Motion: use `MOTION.ease.premium` from `@hive/tokens` for all animations.

---

## Navigation

Nav items defined in `apps/web/src/lib/navigation.ts`.
Mobile bottom bar: Home → Events → [Create] → Spaces → You
Desktop top bar: same items, text labels, no create button (lab link in sidebar)

Routes:
- `/discover` — campus feed (home)
- `/events` — campus events (personalized)
- `/spaces` — browse spaces
- `/s/[handle]` — individual space
- `/lab` — creator dashboard
- `/lab/templates` — template-first creation (8 core templates)
- `/lab/new` — AI prompt creation
- `/t/[toolId]` — standalone tool view
- `/me` — profile
- `/notifications` — notifications

---

## What NOT To Do

- **Never create new Firestore collections** without checking the ERD above — it probably already exists
- **Never use `NextResponse.json()` directly** in API routes — use `respond.*`
- **Never import core `PlacedToolDTO` in `apps/web/src/`** — use the hook version
- **Never hardcode colors** — use design tokens
- **Never query events by `startDate` only** — use `getEventStartDate()` helper
- **Never write to `toolStates`** — the collection is `tool_states`
- **Never await non-critical side effects** (feed writes, analytics) — fire and forget with try/catch
- **Never modify `/lab/new`** flow — it's the AI path; template path is `/lab/templates`
- **Never delete routes under `/api/spaces/[spaceId]/`** without checking for legacy redirects
