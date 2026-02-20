# CLAUDE.md — HIVE Codebase Guide

HIVE is a campus social platform where students create tools for their communities.
Spaces (orgs, greek life, dorms) are the core unit. HiveLab is the creation runtime
that lets org leaders build interactive tools (polls, RSVPs, leaderboards, forms)
deployed directly into their space — no separate hosting, no cold start.

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

The codebase uses DDD. API routes should use repositories, not raw Firestore.

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
// Always use repositories in API routes — not raw dbAdmin queries
import { getServerSpaceRepository } from '@hive/core/server';
const spaceRepo = getServerSpaceRepository();
const result = await spaceRepo.findById(spaceId);
```

| Repository | Factory | Import |
|-----------|---------|--------|
| SpaceRepository | `getServerSpaceRepository()` | `@hive/core/server` |
| ProfileRepository | `getServerProfileRepository()` | `@hive/core/server` |
| BoardRepository | `getServerBoardRepository()` | `@hive/core/server` |
| MessageRepository | `getServerMessageRepository()` | `@hive/core/server` |
| InlineComponentRepository | `getServerInlineComponentRepository()` | `@hive/core/server` |
| TemplateRepository | `getServerTemplateRepository()` | `@hive/core/server` |
| UnitOfWork | `getServerUnitOfWork()` | `@hive/core/server` |

### Application Services (from `@hive/core/server`)

```typescript
createServerSpaceManagementService(context, callbacks)
createServerSpaceDeploymentService(context, callbacks)
createServerSpaceChatService(context, callbacks)
```

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

tool_states/{toolId}_{spaceId}_shared    ← shared state doc ID format
  └─ counters{}, collections{}, timeline[], version, lastModified, metadata{}
tool_states/{toolId}_{spaceId}_{userId}  ← personal state doc ID format
  └─ selections{}, participation{}, userId, scope, metadata{}

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

### Additional Collections Used in Code

These exist in the codebase but are secondary — you'll encounter them in admin, moderation, and analytics routes:

```
# Access control
access_codes, access_code_lockouts, access_whitelist, verification_codes,
verification_lockouts, emailVerifications, pendingAdminGrants

# Admin & moderation
admins, adminActivityLogs, adminAlertRules, adminAnnouncements,
contentReports, reports, appeals, violations, moderationLog,
moderationQueues, moderation_feedback, flaggedContent, deletedContent

# Space management
spaceAuditLog, spaceBans, spaceInvites, spaceJoinRequests,
spaceMemberships, spacePresence, spaceRequests, spaceWaitlists

# User data
handles, userBans, userFcmTokens, userPresence, userSessions,
userSuspensions, userWarnings, user_achievements, user_follows,
user_engagement_metrics, privacySettings, notificationPreferences

# HiveLab
toolInstallations, toolPlacements, toolPublishRequests,
tool_analytics, tool_states_archived, tool_templates,
inline_components, inline_component_state, automations, setupDeployments

# Social
follows, likes, reactions, mutes, saved_events, say_hello

# Analytics
analytics_aggregates, analytics_metrics, ai_generations, ai_edits,
platform_metrics, budget_usage

# Other
schools, schoolAdminInvitations, waitlist, waitlist_entries,
builderRequests, claims, tabs, presence, typing, readMarkers
```

### Key Relationships

```
Campus → Spaces (1:many, via spaces.campusId)
Space → SpaceMembers (1:many, composite key spaceId_userId)
Space → Events (1:many, via events.spaceId)
Space → PlacedTools (1:many, via placedTools.spaceId)
Tool → PlacedTools (1:many, a tool can be deployed to multiple spaces)
Tool → tool_states (1:many, keyed by {toolId}_{spaceId}_shared)
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

### Element Registry (33 elements + 2 aliases)

Located in `packages/ui/src/components/hivelab/elements/registry.tsx`

### Element Execute Handlers

Only these element types have server-side execute handlers in `/api/tools/execute/route.ts`:
`poll-element`, `counter`, `rsvp-button`, `checklist-tracker`, `signup-sheet`,
`form-builder`, `leaderboard`, `progress-indicator`, `timer`, `announcement`

Everything else is display-only (no state write on interaction).

### HiveLab Element Status

| Element | Type | Execute Handler | Works E2E | Notes |
|---------|------|:---:|:---:|-------|
| `poll-element` | Interactive | Y | Y | Vote recording, anonymous mode |
| `counter` | Interactive | Y | Y | Inc/dec/reset with bounds |
| `rsvp-button` | Interactive | Y | Y | Capacity + waitlist |
| `timer` | Interactive | Y | Y | Start/stop/lap tracking |
| `leaderboard` | Interactive | Y | Y | Score updates, reset |
| `checklist-tracker` | Interactive | Y | Y | Per-user completion |
| `signup-sheet` | Interactive | Y | Y | Slot capacity enforced |
| `form-builder` | Interactive | Y | Y | Multi-submit, validation |
| `progress-indicator` | Display | Y | Y | Set/increment/reset |
| `announcement` | Space | Y | Y | Leader-only pin/unpin |
| `countdown-timer` | Display | - | Y | Client-side time only |
| `event-picker` | Connected | - | Y | Reads from events collection |
| `personalized-event-feed` | Connected | - | Y | Interest-matched events |
| `dining-picker` | Connected | - | Y | Campus dining data |
| `study-spot-finder` | Connected | - | Y | Location-based |
| `member-list` | Space | - | Y | Display only |
| `space-events` | Space | - | Y | Display only |
| `space-feed` | Space | - | Y | Display only |
| `space-stats` | Space | - | Y | Display only |
| `connection-list` | Connected | - | Y | Display only |
| `custom-block` | Sandbox | - | Partial | Only element with connection input support |
| `search-input` | Input | - | Y | Display only |
| `date-picker` | Input | - | Y | Display only |
| `user-selector` | Input | - | Y | Display only |
| `filter-selector` | Filter | - | Y | Display only |
| `result-list` | Display | - | Y | Display only |
| `chart-display` | Display | - | Y | Display only |
| `tag-cloud` | Display | - | Y | Display only |
| `map-view` | Display | - | Y | Display only |
| `photo-gallery` | Display | - | Y | Display only |
| `directory-list` | Display | - | Y | Display only |
| `qr-code-generator` | Display | - | Y | Display only |
| `notification-center` | Display | - | Y | Display only |

**Aliases:** `counter-element` → `counter`, `notification-display` → `notification-center`

### Connection System Status

**Connections are spec'd but NOT functional for standard elements.** Templates define `connections[]` but only `custom-block` can actually consume connected inputs via `resolveConnectedInput()`. Standard elements (poll, form, etc.) have no output ports. Don't build features that rely on form→result-list data flow — it doesn't work yet.

### Generation

Controlled by env var `GOOSE_BACKEND`:
- `GOOSE_BACKEND=groq` → uses Groq (llama-3.1-8b-instant) as primary
- Default → rules-based regex generator (free, ~100ms)

Quick templates (no AI): `getQuickTemplate(id)` from `@hive/ui`
AI generation: `POST /api/tools/generate` streams NDJSON

### Templates

30 quick templates in `packages/ui/src/lib/hivelab/quick-templates.ts`:
- 22 simple templates (single element, `quickDeploy: true`)
- 8 app templates (4-5 elements each, multi-element compositions)

### State Architecture

```typescript
// sharedState — visible to all users
// Doc ID: tool_states/{toolId}_{spaceId}_shared
sharedState.counters["poll-1:option-a"] = 12      // vote counts
sharedState.collections["form-1:submissions"]      // form responses
sharedState.timeline                               // last 100 events

// userState — per user
// Doc ID: tool_states/{toolId}_{spaceId}_{userId}
userState.participation["poll-1:hasVoted"] = true
userState.selections["poll-1:choice"] = "option-a"
```

Real-time sync: Firestore `onSnapshot()` listeners via SSE at `/api/tools/[toolId]/state/stream`
(Note: uses Firestore, NOT Firebase RTDB despite earlier docs suggesting otherwise)

---

## Full API Route Map

### Auth Routes (14 routes)

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/auth/send-code` | POST | None | Complete |
| `/api/auth/verify-code` | POST | None | Complete |
| `/api/auth/refresh` | POST | None | Complete |
| `/api/auth/me` | GET | Session cookie | Complete |
| `/api/auth/complete-entry` | POST | withAuth | Complete |
| `/api/auth/csrf` | GET | withAuth | Complete |
| `/api/auth/logout` | POST | withAuth | Complete |
| `/api/auth/check-admin-grant` | POST | withAuth | Complete |
| `/api/auth/check-handle` | GET, POST | None | Complete |
| `/api/auth/health` | GET | None | Complete |
| `/api/auth/sessions` | DELETE, GET | withAuth | Complete |
| `/api/auth/sessions/[sessionId]` | DELETE | withAuth | Complete |
| `/api/auth/alumni-waitlist` | POST | None | **Stub** (no export) |
| `/api/auth/verify-access-code` | POST | None | **Stub** (no export) |

### Space Routes (~60 routes)

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/spaces` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/spaces/[spaceId]/members` | DELETE, GET, PATCH, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/members/[memberId]` | DELETE, PATCH | withAuth | Complete |
| `/api/spaces/[spaceId]/members/batch` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/membership` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/membership/me` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/invite` | DELETE, GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/join-request` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/join-requests` | GET, PATCH | withAuth | Complete |
| `/api/spaces/invite/[code]/validate` | GET | None | Complete |
| `/api/spaces/invite/[code]/redeem` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/posts` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/posts/[postId]` | DELETE, GET, PATCH, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/posts/[postId]/comments` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/posts/[postId]/reactions` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/[messageId]` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/[messageId]/replies` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/[messageId]/react` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/[messageId]/pin` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/pinned` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/read` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/search` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/typing` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/intent` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/stream` | POST | withAuth | Complete (SSE) |
| `/api/spaces/[spaceId]/events` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/events/[eventId]` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/spaces/[spaceId]/events/[eventId]/rsvp` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/tools` | DELETE, GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/tools/feature` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/feed` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/activity` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/analytics` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/data` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/go-live` | POST | None | Complete |
| `/api/spaces/[spaceId]/moderation` | GET, POST, PUT | withAuth | Complete |
| `/api/spaces/[spaceId]/preview` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/transfer-ownership` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/upload-avatar` | DELETE, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/upload-banner` | DELETE, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/upload` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/builder-permission` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/builder-status` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/apply-template` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/promote-post` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/apps/[deploymentId]` | GET | withAuth | Complete |
| `/api/spaces/browse-v2` | GET | None | Complete |
| `/api/spaces/live` | GET | withAuth | Complete |
| `/api/spaces/mine` | GET | withAuth | Complete |
| `/api/spaces/recommended` | GET, POST | withAuth | Complete |
| `/api/spaces/residential` | GET | None | Complete |
| `/api/spaces/search` | POST | withAuth | Complete |
| `/api/spaces/templates` | GET | withAuth | Complete |
| `/api/spaces/check-create-permission` | GET | withAuth | Complete |
| `/api/spaces/check-handle` | GET | withAuth | Complete |
| `/api/spaces/claim` | GET, POST | withAuth | Complete |
| `/api/spaces/identity` | DELETE, GET, POST | withAuth | Complete |
| `/api/spaces/request-to-lead` | GET, POST | withAuth | Complete |
| `/api/spaces/waitlist` | GET, POST | withAuth | Complete |
| `/api/spaces/join-v2` | POST | withAuth | Complete |
| `/api/spaces/leave` | POST | withAuth | Complete |
| `/api/spaces/activity/recent` | GET | withAuth | Complete |
| `/api/spaces/transfer` | GET, POST | withAuth | Complete |
| `/api/spaces/route/[slug]` | GET, POST | None | Complete |

### Tools/HiveLab Routes (14 routes)

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/tools` | GET, POST, PUT | withAuth | Complete |
| `/api/tools/[toolId]` | DELETE, GET, PUT | withAuth | Complete |
| `/api/tools/[toolId]/deploy` | DELETE, GET, POST | withAuth | Complete |
| `/api/tools/[toolId]/clone` | POST | withAuth | Complete |
| `/api/tools/[toolId]/state` | DELETE, GET, POST | withAuth | Complete |
| `/api/tools/[toolId]/state/stream` | POST | withAuth | Complete (SSE) |
| `/api/tools/[toolId]/with-state` | GET | withAuth | Complete |
| `/api/tools/execute` | POST | withAuth | Complete |
| `/api/tools/generate` | POST | validateApiAuth | Complete (streaming) |
| `/api/tools/publish` | GET, POST | withAuth | Complete |
| `/api/tools/install` | POST | withAuth | Complete |
| `/api/tools/discover` | GET | withAuth | Complete |
| `/api/tools/browse` | GET | None | **Stub** (no export) |
| `/api/tools/recommendations` | GET | None | **Stub** (returns empty) |

### Profile Routes (14 routes)

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/profile` | GET, PATCH, POST, PUT | withAuth | Complete |
| `/api/profile/[userId]` | GET | None | Complete |
| `/api/profile/[userId]/activity` | GET | withAuth | Complete |
| `/api/profile/[userId]/events` | GET | withAuth | Complete |
| `/api/profile/[userId]/connections` | GET | None | Complete |
| `/api/profile/[userId]/follow` | DELETE, GET, POST | withAuth | Complete |
| `/api/profile/my-spaces` | GET | withAuth | Complete |
| `/api/profile/spaces` | GET | withAuth | Complete |
| `/api/profile/tools` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/profile/delete` | DELETE, POST | withAuth | Complete |
| `/api/profile/upload-photo` | POST | withAuth | Complete |
| `/api/profile/fcm-token` | DELETE, POST | withAuth | Complete |
| `/api/profile/notifications/preferences` | GET, PUT | withAuth | Complete |
| `/api/profile/privacy` | GET, PATCH | withAuth | Complete |

### Events Routes

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/events` | GET, POST | withAuth | Complete |
| `/api/events/personalized` | GET | withAuth | Complete |

### Feed Routes

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/feed/global` | GET | None | Complete |
| `/api/feed/search` | POST | withAuth | Complete |

### Templates Routes

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/templates` | GET, POST | withAuth | Complete |
| `/api/templates/[templateId]` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/templates/[templateId]/use` | POST | withAuth | Complete |

### Placements Routes

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/placements` | GET | withAuth | Complete |
| `/api/placements/[placementId]` | DELETE, GET, PATCH | withAuth | Complete |

### Campus Routes

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/campus/detect` | GET | None | **Stub** |
| `/api/campus/buildings` | GET | None | Complete |
| `/api/campus/buildings/study-spots` | GET | None | Complete |
| `/api/campus/catalogs` | GET | None | Complete |
| `/api/campus/dining` | GET | None | **Stub** (no export) |
| `/api/campus/dining/[id]` | GET | None | **Stub** (no export) |
| `/api/campus/dining/recommend` | POST | None | **Stub** (no export) |

### Notifications, Content, Search, Users

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/notifications` | GET, POST, PUT | withAuth | Complete |
| `/api/notifications/stream` | POST | None | **Stub** (SSE, no export) |
| `/api/content/check` | POST | withAuth | Complete |
| `/api/content/check-image` | POST | withAuth | Complete |
| `/api/content/reports` | GET | None | Complete |
| `/api/comments/[commentId]/like` | POST | withAuth | Complete |
| `/api/search` | GET | None | Complete |
| `/api/users/search` | POST | None | Complete |
| `/api/users/suggestions` | GET | withAuth | Complete |

### Cron Routes (secured by CRON_SECRET header)

| Route | Methods | Status |
|-------|---------|--------|
| `/api/cron/event-reminders` | GET | Complete |
| `/api/cron/automations` | GET | Complete |
| `/api/cron/sync-events` | GET | Complete |
| `/api/cron/tool-lifecycle` | GET | Complete |
| `/api/cron/setup-orchestration` | GET | Complete |

All crons run daily (downgraded for Vercel Hobby plan).

### Utility & Other Routes

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/health` | GET | None | Complete |
| `/api/schools` | GET | None | Complete |
| `/api/feature-flags` | GET | None | Complete |
| `/api/analytics/track` | POST | withAuthValidation | Complete |
| `/api/analytics/metrics` | GET | None | Complete |
| `/api/activity` | GET | getCurrentUser | Complete |
| `/api/onboarding/catalog` | GET | None | Complete |
| `/api/onboarding/matched-spaces` | GET | None | **Stub** (no export) |
| `/api/automations/templates` | GET | None | Complete |
| `/api/errors/report` | POST | withAuth | Complete |
| `/api/feedback` | POST | None | **Stub** (logs only) |
| `/api/verify/[slug]` | GET | None | Complete |
| `/api/privacy` | GET | None | Complete |
| `/api/privacy/visibility` | GET | None | Complete |
| `/api/privacy/ghost-mode` | GET | None | Complete |
| `/api/qr` | GET | None | **Stub** (no export) |

### Admin Routes (~60 routes under `/api/admin/`)

All admin routes require admin role verification. Categories:
- **Analytics:** `/admin/analytics/{comprehensive,growth,onboarding-funnel,realtime,retention}`
- **Users:** `/admin/users`, `/admin/users/[userId]`, `/admin/users/[userId]/{suspend,unsuspend}`, `/admin/users/{bulk,export}`
- **Spaces:** `/admin/spaces`, `/admin/spaces/[spaceId]`, `/admin/spaces/[spaceId]/{activity,feature,members,moderation}`, `/admin/spaces/{analytics,health}`
- **Tools:** `/admin/tools/{pending,review-stats}`, `/admin/tools/[toolId]/{approve,reject}`
- **Moderation:** `/admin/moderation/{reports,appeals,feedback,queue,violations}`, `/admin/content-moderation`
- **Command Center:** `/admin/command/{pulse,momentum,impact,health,territory}`
- **Schools:** `/admin/schools`, `/admin/schools/[schoolId]`, `/admin/school-admins`
- **Config:** `/admin/config`, `/admin/feature-flags`
- **AI Quality:** `/admin/ai-quality/{metrics,generations,edits,failures}`
- **Other:** `/admin/{activity-logs,alerts,announcements,builder-requests,claims,logs}`, `/admin/toolbar/{data-factory,impersonate}`

---

## Package Exports

### @hive/core

```typescript
// Server-side (API routes only)
import { getServerSpaceRepository, getServerProfileRepository,
         getServerBoardRepository, getServerMessageRepository,
         getServerTemplateRepository, getServerUnitOfWork,
         createServerSpaceManagementService,
         createServerSpaceDeploymentService,
         createServerSpaceChatService,
         getDomainEventPublisher,
         getCategoryRules, canRequestLeadership } from '@hive/core/server';

// Client-safe types (components)
import { type ToolComposition } from '@hive/core/client';

// Domain types (shared)
import { PlacedToolDTO, SpaceDTO, ProfileDTO, TemplateDTO } from '@hive/core';
```

Package.json exports: `.`, `./server`, `./domain`, `./application`, `./infrastructure`, `./client`

### @hive/ui

```typescript
// Design system
import { Button, Input, Card, Badge, Avatar, Modal, Tabs } from '@hive/ui/design-system/primitives';
import { SpaceCard, ProfileCard, ChatMessage } from '@hive/ui/design-system/components';

// Motion
import { FadeIn, SlideUp, StaggerList, HoverLift } from '@hive/ui/motion';

// HiveLab
import { ToolCanvas, VisualToolComposer, HiveLabIDE } from '@hive/ui';
import { getQuickTemplate } from '@hive/ui'; // Quick templates

// Design tokens (also re-exported)
import { MOTION, LAYOUT } from '@hive/ui/tokens';
```

### @hive/tokens

```typescript
import { MONOCHROME, MOTION, LAYOUT, GLASS, ELEVATION, TYPOGRAPHY,
         CARD, BUTTON, BADGE, INPUT, IDE_TOKENS,
         SPACE_LAYOUT, SPACE_COLORS, SPACE_MOTION,
         hiveTailwindConfig } from '@hive/tokens';
```

### @hive/hooks

```typescript
import { useSpaces, useSpace, useProfile, useAnalytics,
         useHiveQuery, useHiveMutation, useOptimisticToggle,
         useStreamingGeneration, useToolExecution,
         useRealtimeCollection, useRealtimeDocument,
         useDebounce, useDebouncedCallback } from '@hive/hooks';
```

### @hive/firebase

```typescript
import { app, db, auth, storage, analytics } from '@hive/firebase';
// Server-side: use firebase-admin directly, not this package
```

### @hive/auth-logic

```typescript
import { useAuth } from '@hive/auth-logic';
// httpOnly JWT cookies, fetches from /api/auth/me
```

### @hive/validation

Zod schemas: `user`, `profile`, `feed`, `space`, `tool`, `chat`, `event`, `settings`, `waitlist`

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
| `placed_tools` | `placedTools` (camelCase is canonical) |

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

### 8. tool_states doc ID format
Shared state: `{toolId}_{spaceId}_shared`
Personal state: `{toolId}_{spaceId}_{userId}`
Collections are NOT subcollections — they're flat documents in `tool_states`.

### 9. Connection system is incomplete
Templates define `connections[]` but only `custom-block` element actually resolves connected inputs. Standard elements don't participate in data flow. Don't build features that depend on element-to-element connections yet.

### 10. Repository singletons
Server repositories are singletons — call the factory once and reuse the instance:
```typescript
const spaceRepo = getServerSpaceRepository();
// Don't call getServerSpaceRepository() repeatedly
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
4-tab layout: Feed → Spaces → Lab → Profile

Routes:
- `/discover` — campus feed (home)
- `/events` — campus events (personalized)
- `/spaces` — browse spaces
- `/s/[handle]` — individual space
- `/s/[handle]/analytics` — space analytics
- `/s/[handle]/tools/[toolId]` — tool in space context
- `/lab` — creator dashboard
- `/lab/templates` — template-first creation (8 core templates + 22 simple)
- `/lab/new` — AI prompt creation
- `/lab/[toolId]` — tool editor (deploy, analytics, settings)
- `/t/[toolId]` — standalone tool view
- `/me` — profile
- `/me/edit` — profile editing
- `/me/settings` — user settings
- `/u/[handle]` — public user profile
- `/notifications` — notifications
- `/settings` — global settings (account, privacy, interests, notifications)
- `/legal` — terms, privacy, community guidelines
- `/about` — about page
- `/design-system` — design system showcase

---

## Dev Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server (port 3000)
pnpm build                  # Build all packages + apps
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript checking

# Testing
pnpm test                   # Unit tests (Vitest)
pnpm test:watch             # Watch mode
cd apps/web && pnpm test:e2e       # Playwright E2E tests
cd apps/web && pnpm test:stress    # Stress tests

# Storybook
pnpm storybook:dev          # Storybook on port 6006

# Data seeding
pnpm seed:emulator          # Seed Firebase emulator
pnpm seed:production --dry-run  # Dry-run production seed
pnpm seed:tools             # Seed HiveLab templates

# Migrations
pnpm migration:run          # Run pending migrations
pnpm migration:status       # Check migration status
pnpm migration:rollback     # Rollback last migration
pnpm migration:create       # Create new migration

# Admin app
cd apps/admin && pnpm dev   # Admin dashboard (port 3001)

# Quality
pnpm audit                  # Full audit suite (apps/web)
```

Key env vars: `HIVE_DEV_BYPASS=true` (skip auth), `GOOSE_BACKEND=groq` (AI generation)

---

## Scripts Reference

81 scripts in `/scripts/`. Key ones:

| Script | Purpose |
|--------|---------|
| `seed-emulator.mjs` | Populate Firebase emulator with test data |
| `seed-production.mjs` | Production seeding (supports `--dry-run`, `--campus`) |
| `import-campuslabs.mjs` | Import 400+ orgs from CampusLabs API |
| `sync-campuslabs-events.mjs` | Sync events from CampusLabs RSS |
| `cleanup-firebase.mjs` | Remove orphaned/stale/test data (`--dry-run` safe) |
| `verify-ub-launch.mjs` | UB campus launch readiness check |
| `benchmark-ai.ts` | AI generation performance testing |
| `migrations/runner.ts` | Migration framework (run, status, rollback, create) |

---

## CI/CD

- **GitHub Actions:** lint → typecheck → build → E2E (on PRs)
- **Vercel:** Preview deploys on PRs, production on main
- **Quality gates:** Bundle size, Lighthouse, accessibility (axe-core), design token compliance

---

## Known State (as of Feb 2026)

### Recently Fixed
- Vercel build errors and warnings (dead imports, stale exports)
- Crons downgraded to daily for Hobby plan
- getFeedRepository null assertion stub

### Working Well
- All 10 interactive HiveLab elements with execute handlers
- Real-time state sync via SSE
- 30 quick templates with quick deploy
- Full space management (CRUD, members, chat, events, tools)
- Auth flow (OTP → JWT cookies)
- ~248/268 API routes fully implemented

### Stubs / Not Implemented
- `/api/tools/browse` — no export
- `/api/tools/recommendations` — returns empty
- `/api/campus/dining/*` — no exports (3 routes)
- `/api/auth/alumni-waitlist` — no export
- `/api/auth/verify-access-code` — no export
- `/api/onboarding/matched-spaces` — no export
- `/api/notifications/stream` — SSE, no export
- `/api/qr` — no export
- `/api/feedback` — logs only, no persistence

### Architectural Gaps
- Element-to-element connections don't flow data (only custom-block supports it)
- Computed fields in tool_states mentioned but no handlers
- Automations UI exists but backend logic is minimal
- Some admin routes use raw dbAdmin queries instead of repositories
- Mix of `NextResponse.json()` and `respond.*` in older routes

---

## What NOT To Do

- **Never create new Firestore collections** without checking the ERD above — it probably already exists
- **Never use `NextResponse.json()` directly** in API routes — use `respond.*`
- **Never import core `PlacedToolDTO` in `apps/web/src/`** — use the hook version
- **Never import `@hive/core/server` in client components** — server-only
- **Never hardcode colors** — use design tokens
- **Never query events by `startDate` only** — use `getEventStartDate()` helper
- **Never write to `toolStates`** — the collection is `tool_states`
- **Never await non-critical side effects** (feed writes, analytics) — fire and forget with try/catch
- **Never modify `/lab/new`** flow — it's the AI path; template path is `/lab/templates`
- **Never delete routes under `/api/spaces/[spaceId]/`** without checking for legacy redirects
- **Never call repository factory functions repeatedly** — they're singletons
