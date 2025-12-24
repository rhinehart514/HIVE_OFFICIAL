# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Working Relationship

**You are a co-founder, not a contractor.**

We're building a startup. Be proactive. Push back when something doesn't make sense. Ask hard questions. Care about the outcome, not just the task.

When working on any feature, always filter through:
1. Does this give students more control over their own development?
2. Does it expand what they can think, create, or do?
3. Does it help them figure out their own path?

If yes, build it. If no, question it.

Full vision: **`docs/VISION.md`** — read this first if you haven't.

---

## Current Focus (December 2025)

**We're in soft launch prep.** The platform is 85%+ complete. Priority is getting the core experience bulletproof for the first 10-20 org leaders.

**This Week's Priorities:**
1. Landing page polish and waitlist flow
2. Spaces chat reliability (typing indicator fix, real analytics)
3. HiveLab template expansion (10+ quality templates)
4. Onboarding edge case fixes
5. Mobile responsiveness pass

**Do Not Touch Right Now:**
- Feed algorithm refinements
- Ghost mode / advanced privacy
- Push notifications
- Voice messages
- Marketplace

See `docs/LAUNCH_PLAN.md` for detailed timeline and success criteria.

---

## What is HIVE?

**HIVE is student autonomy infrastructure for a world where the old paths are dying.**

Most of what students are being taught is for a world that won't exist when they graduate. The career center is clueless. The curriculum is outdated. The credential system is crumbling. Students sense this—they're anxious and don't know why.

HIVE is where they figure it out. With communities of people exploring alongside them. With tools to build things that matter. With AI that expands what they can think and create.

### The Core Value: Student Autonomy

Student autonomy means control over your own development:
- **Community Autonomy** — Create spaces without permission. Own your communities.
- **Data Autonomy** — Your profile, connections, and activity belong to you.
- **Tool Autonomy** — Build what you need through HiveLab. Don't wait for us.
- **Attention Autonomy** — No dark patterns. No manipulation. You choose your experience.
- **Developmental Autonomy** — Explore, build, connect. Create your own path.

### The Four Layers

| Layer | What It Is |
|-------|------------|
| **Community** | Student-owned spaces for exploration and creation |
| **Creation** | HiveLab — students building things that matter |
| **Connection** | Real social graph of campus life |
| **Intelligence** | AI that expands thinking, not replaces it |

### Launch Timeline: Winter 2025-26

**Win UB. Prove the model at density.**

| Phase | Timing | Goal |
|-------|--------|------|
| **Soft Launch** | Dec 2025 - Jan 2026 | 10-20 org leaders testing, core flows validated |
| **Beta Launch** | Feb 2026 | 50+ spaces active, onboarding refined |
| **Full Launch** | Spring 2026 | Campus-wide rollout, density flywheel kicks in |

**Build Now vs. Defer:**

| Build Now | Defer to Spring+ |
|-----------|------------------|
| Spaces: chat, boards, real-time, moderation | Push notifications |
| HiveLab: AI gen, 24 elements, deployment | Collaboration features |
| Auth: OTP, onboarding, session management | Email digests |
| Basic analytics (real data, not mocks) | Advanced analytics |
| Mobile-responsive (usable, not perfect) | Voice messages |
| Social graph: profiles, connections | Marketplace |
| Landing page + waitlist | University contracts |

### Launch Strategy

**University at Buffalo first. 32,000 students, 300+ orgs.**

- 400+ spaces pre-seeded from CampusLabs data
- Leader-first GTM: 50 leaders → 10,000+ students
- Density at one campus before expanding
- Multi-campus architecture ready (campusId isolation)

---

## Two Core Systems

### 1. HIVE Spaces (Where Communities Live)

Spaces are Discord-like community hubs with a campus-native twist.

**Architecture: 60/40 Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ Space Header (name, category, member count)                 │
├───────────────────────────────────┬─────────────────────────┤
│                                   │                         │
│   CHAT BOARD (60%)                │   SIDEBAR (40%)         │
│                                   │                         │
│   Real-time conversation          │   Persistent context    │
│   Threading, reactions            │   - Upcoming events     │
│   Inline components (polls, etc)  │   - Deployed tools      │
│                                   │   - Member highlights   │
│   Think: Discord + ChatGPT        │   - Quick actions       │
│                                   │                         │
├───────────────────────────────────┴─────────────────────────┤
│ Boards Tab Bar [General] [Events] [Study Group] [+]         │
└─────────────────────────────────────────────────────────────┘
```

**Key Concepts:**
- **Boards** = Topic/event-specific chat rooms (like Discord channels)
- **Sidebar** = HiveLab tools deployed by leaders
- **Inline Components** = Interactive elements in chat (polls, signups)
- **Auto-General** = Every space gets a "General" board automatically

**Role Hierarchy:**
```
owner      → Full control, transfer ownership, delete space
admin      → Manage members, settings, deploy tools
moderator  → Moderate content, pin messages, manage boards
member     → Chat, react, use tools
guest      → Read-only (private spaces)
```

### 2. HiveLab (How Leaders Customize)

HiveLab is Figma + Cursor for campus tools. Visual builder, AI-assisted.

**The Vision:**
```
OLD WAY:  Leader wants a poll → asks dev → waits → gets generic solution
HIVE WAY: Leader wants a poll → drags poll element → configures → deploys
```

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│ HiveLab                                    [Save] [Deploy]  │
├────────────┬────────────────────────────────┬───────────────┤
│            │                                │               │
│  ELEMENTS  │         CANVAS                 │   INSPECTOR   │
│            │                                │               │
│  Universal │   Drag, drop, arrange          │   Properties  │
│  Connected │   Figma-like feel              │   Data source │
│  Space     │   Live preview                 │   Actions     │
│            │                                │   Permissions │
│            │                                │               │
├────────────┴────────────────────────────────┴───────────────┤
│ AI: "Create a poll for our next event location"             │
└─────────────────────────────────────────────────────────────┘
```

**Element Tiers (27 total):**

| Tier | Count | Examples | Who Can Use |
|------|-------|----------|-------------|
| Universal | 15 | poll, timer, form, chart | Anyone |
| Connected | 5 | event-picker, user-selector, rsvp-button | Need data source |
| Space | 7 | member-list, announcements, role-gate | Space leaders |

**Deployment Targets:**
- Space sidebar (persistent tools)
- Inline in chat (interactive messages)
- Profile widgets
- Standalone pages

---

## Platform Architecture

### Workspace Structure

```
apps/
  web/              # Main Next.js 15 app (React 19) - port 3000
  admin/            # Admin panel - port 3001
  hivelab/          # HiveLab IDE - STANDALONE (port 3002)

packages/
  ui/               # Component library (Radix UI + CVA + Storybook)
  core/             # Domain models, DDD bounded contexts, business logic
  firebase/         # Firebase SDK initialization
  auth-logic/       # Authentication state management
  hooks/            # Shared React hooks
  tokens/           # Design tokens (CSS variables + JS)
  validation/       # Zod schemas for runtime validation
  moderation/       # Content moderation (ML-based)

infrastructure/     # Firebase rules, deployment configs
scripts/           # Seed scripts, migrations
docs/              # Strategic documentation
```

### Package Details

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| `@hive/core` | Domain layer + DDD | Entities, services, repositories, DTOs |
| `@hive/ui` | Component library | 300+ components, atomic design, Storybook |
| `@hive/firebase` | Firebase wrapper | SDK initialization, collection refs |
| `@hive/auth-logic` | Auth state | Session management, JWT handling |
| `@hive/hooks` | Shared hooks | useAnalytics, useSpaces, useProfile |
| `@hive/tokens` | Design tokens | CSS variables, JS tokens, Tailwind integration |
| `@hive/validation` | Zod schemas | Runtime validation for all external data |
| `@hive/moderation` | Content safety | Text/image moderation via Vertex AI |

### Path Aliases (tsconfig.json)

```typescript
@hive/ui           // packages/ui/src
@hive/core         // packages/core/src
@hive/hooks        // packages/hooks/src
@hive/firebase     // packages/firebase/src
@hive/tokens       // packages/tokens/src
@hive/validation   // packages/validation/src
@hive/auth-logic   // packages/auth-logic/src
@hive/moderation   // packages/moderation/src
```

### Tech Stack

- **Runtime**: Node.js 18+, pnpm 9.1.1 (required)
- **Framework**: Next.js 15.5.6, React 19
- **Language**: TypeScript 5.9.3 (strict mode)
- **State**: Zustand for global state
- **Backend**: Firebase (Firestore, Auth, Storage, Realtime DB)
- **Validation**: Zod for runtime schemas
- **UI**: Radix UI primitives + Tailwind CSS + Framer Motion
- **Build**: Turbo for monorepo orchestration, tsup for library packages
- **DnD**: dnd-kit for drag-and-drop

### Domain-Driven Design (@hive/core)

The core package uses DDD with 9 bounded contexts:
- `domain/spaces/` - Space management, chat, boards, tools
- `domain/profile/` - User profiles, connections
- `domain/feed/` - Feed algorithm, ranking
- `domain/hivelab/` - Tool composition
- `domain/identity/` - Authentication
- `domain/rituals/` - Ritual system
- `domain/analytics/` - Event tracking
- `domain/creation/` - Content creation
- `domain/shared/` - Cross-cutting concerns

**DDD Integration Pattern:**
```typescript
// API routes use DDD services and repositories from @hive/core/server
import { getServerSpaceRepository } from '@hive/core/server';
import { createServerSpaceChatService } from '@hive/core/server';
import { toSpaceDetailDTO, toSpaceWithToolsDTO } from '@hive/core/server';

// Example from /api/spaces/[spaceId]/route.ts:
const spaceRepo = getServerSpaceRepository();
const result = await spaceRepo.findById(spaceId, { loadPlacedTools: true });
const space = result.getValue();
return respond.success(toSpaceWithToolsDTO(space));
```

---

## Build & Development Commands

```bash
# Development
pnpm dev                              # Run all dev servers via Turbo
pnpm --filter=@hive/web dev           # Web app only (port 3000)
pnpm --filter=@hive/admin dev         # Admin app only (port 3001)
pnpm --filter=@hive/hivelab dev       # HiveLab IDE (port 3002)

# Building
pnpm build                            # Build all packages
pnpm --filter=@hive/web build         # Build web app only
pnpm --filter=@hive/ui build          # Build UI package only

# Type checking & Linting
pnpm typecheck                        # Full TypeScript validation
pnpm lint                             # Lint all packages

# Testing
pnpm test                             # Run all tests
pnpm --filter=@hive/auth-logic test   # Run specific package tests
pnpm test:watch                       # Watch mode

# Storybook (UI components)
pnpm storybook:dev                    # Start Storybook (port 6006)
pnpm storybook:build                  # Build static Storybook

# Firebase Emulator
firebase emulators:start              # Start emulators
pnpm seed:emulator                    # Seed test data

# Cleanup
pnpm clean                            # Clean all build outputs + node_modules

# Dev Auth (local testing with production Firebase)
curl -X POST http://localhost:3000/api/dev-auth \
  -H "Content-Type: application/json" \
  -d '{"email":"jwrhineh@buffalo.edu"}' \
  -c /tmp/hive_cookies.txt
```

---

## Current Platform State (December 2025)

| Slice | Status | What's Working | Pre-Launch Blockers |
|-------|--------|----------------|---------------------|
| **Spaces + Chat** | 90% | Full DDD stack, SSE streaming, threading, boards | Typing indicator spam, real analytics |
| **HiveLab/Tools** | 85% | Full IDE, 27 elements, deployment, runtime | Undo/redo, more templates |
| **Auth/Onboarding** | 90% | OTP auth, JWT sessions, 4-step onboarding | Edge case polish |
| **Landing Page** | 95% | Hero, features, waitlist, legal modals | Final copy review |
| **Feed** | 75% | Privacy enforced, moderation | Deferred for soft launch |
| **Profiles** | 70% | Basic flow works | Ghost mode deferred |

**Soft Launch Critical Path:**
1. Spaces chat must feel instant and reliable
2. HiveLab deployment flow must work first-try
3. Onboarding must convert 80%+ of signups
4. Leader analytics must show real (not mock) data
5. Mobile must be usable (not perfect, but functional)

**Key Implementation Stats:**
| Component | Location | Lines |
|-----------|----------|-------|
| `useChatMessages` | `apps/web/src/hooks/use-chat-messages.ts` | 1,185 |
| `SpaceChatService` | `packages/core/src/application/spaces/space-chat.service.ts` | 1,484 |
| `SpaceChatBoard` | `packages/ui/src/atomic/03-Spaces/organisms/space-chat-board.tsx` | 1,131 |
| `useToolRuntime` | `apps/web/src/hooks/use-tool-runtime.ts` | 592 |
| `usePinnedMessages` | `apps/web/src/hooks/use-pinned-messages.ts` | 173 |
| `Board Entity` | `packages/core/src/domain/spaces/entities/board.ts` | 362 |

---

## API Reference (193 Routes)

### Auth (17 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/send-code` | POST | Send OTP code to email |
| `/api/auth/verify-code` | POST | Verify OTP and create session |
| `/api/auth/send-magic-link` | POST | Send magic link email |
| `/api/auth/verify-magic-link` | POST | Verify magic link token |
| `/api/auth/resend-magic-link` | POST | Resend magic link |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/refresh` | POST | Refresh session token |
| `/api/auth/logout` | POST | End session |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/csrf` | GET | Get CSRF token |
| `/api/auth/check-handle` | POST | Check handle availability |
| `/api/auth/complete-onboarding` | POST | Complete onboarding |
| `/api/auth/health` | GET | Auth health check |
| `/api/auth/dev-session` | POST | Dev session (dev only) |
| `/api/auth/check-admin-grant` | GET | Check admin access |
| `/api/auth/sessions` | GET | List active sessions |
| `/api/auth/sessions/[sessionId]` | DELETE | Revoke session |

### Spaces - Core (20 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces` | GET | List spaces |
| `/api/spaces` | POST | Create space |
| `/api/spaces/[spaceId]` | GET | Get space details |
| `/api/spaces/[spaceId]` | PATCH | Update space |
| `/api/spaces/[spaceId]` | DELETE | Delete space |
| `/api/spaces/browse-v2` | GET | Browse spaces (v2) |
| `/api/spaces/mine` | GET | Spaces I own |
| `/api/spaces/my` | GET | Spaces I'm a member of |
| `/api/spaces/search` | GET | Search spaces |
| `/api/spaces/recommended` | GET | Recommended spaces |
| `/api/spaces/templates` | GET | Space templates |
| `/api/spaces/join-v2` | POST | Join space |
| `/api/spaces/leave` | POST | Leave space |
| `/api/spaces/transfer` | POST | Transfer ownership |
| `/api/spaces/request-to-lead` | POST | Request leadership |
| `/api/spaces/check-create-permission` | GET | Check create permission |
| `/api/spaces/resolve-slug/[slug]` | GET | Resolve slug to ID |
| `/api/spaces/seed` | POST | Seed spaces (admin) |
| `/api/spaces/[spaceId]/go-live` | POST | Activate space |
| `/api/spaces/[spaceId]/structure` | GET | Get space structure |

### Spaces - Chat (14 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/chat` | GET | Get messages |
| `/api/spaces/[spaceId]/chat` | POST | Send message |
| `/api/spaces/[spaceId]/chat/stream` | GET | SSE real-time stream |
| `/api/spaces/[spaceId]/chat/[messageId]` | GET | Get message |
| `/api/spaces/[spaceId]/chat/[messageId]` | PATCH | Edit message |
| `/api/spaces/[spaceId]/chat/[messageId]` | DELETE | Delete message |
| `/api/spaces/[spaceId]/chat/[messageId]/react` | POST | Add reaction |
| `/api/spaces/[spaceId]/chat/[messageId]/pin` | POST | Pin message |
| `/api/spaces/[spaceId]/chat/[messageId]/replies` | GET | Get replies |
| `/api/spaces/[spaceId]/chat/pinned` | GET | Get pinned messages |
| `/api/spaces/[spaceId]/chat/search` | GET | Search messages |
| `/api/spaces/[spaceId]/chat/typing` | POST | Typing indicator |
| `/api/spaces/[spaceId]/chat/read` | POST | Mark as read |
| `/api/spaces/[spaceId]/chat/intent` | POST | AI intent detection |

### Spaces - Boards (3 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/boards` | GET | List boards |
| `/api/spaces/[spaceId]/boards` | POST | Create board |
| `/api/spaces/[spaceId]/boards/[boardId]` | GET/PATCH/DELETE | Board CRUD |

### Spaces - Members (5 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/members` | GET | List members |
| `/api/spaces/[spaceId]/members` | POST | Add member |
| `/api/spaces/[spaceId]/members/[memberId]` | GET/PATCH/DELETE | Member CRUD |
| `/api/spaces/[spaceId]/members/batch` | POST | Batch operations |
| `/api/spaces/[spaceId]/membership` | GET/POST | Check/update membership |

### Spaces - Events (4 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/events` | GET | List space events |
| `/api/spaces/[spaceId]/events` | POST | Create event |
| `/api/spaces/[spaceId]/events/[eventId]` | GET/PATCH/DELETE | Event CRUD |
| `/api/spaces/[spaceId]/events/[eventId]/rsvp` | POST | RSVP to event |

### Spaces - Tools & Widgets (6 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/tools` | GET | Get deployed tools |
| `/api/spaces/[spaceId]/tools/feature` | POST | Feature a tool |
| `/api/spaces/[spaceId]/tabs` | GET/POST | Tab management |
| `/api/spaces/[spaceId]/tabs/[tabId]` | GET/PATCH/DELETE | Tab CRUD |
| `/api/spaces/[spaceId]/widgets` | GET/POST | Widget management |
| `/api/spaces/[spaceId]/widgets/[widgetId]` | GET/PATCH/DELETE | Widget CRUD |

### Spaces - Automations (6 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/automations` | GET | List automations |
| `/api/spaces/[spaceId]/automations` | POST | Create automation |
| `/api/spaces/[spaceId]/automations/[automationId]` | GET/PATCH/DELETE | Automation CRUD |
| `/api/spaces/[spaceId]/automations/[automationId]/toggle` | POST | Toggle automation |
| `/api/spaces/[spaceId]/automations/trigger` | POST | Trigger automation |
| `/api/spaces/[spaceId]/automations/from-template` | POST | Create from template |

### Spaces - Inline Components (4 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/components` | GET | List components |
| `/api/spaces/[spaceId]/components` | POST | Create component |
| `/api/spaces/[spaceId]/components/[componentId]` | GET/PATCH/DELETE | Component CRUD |
| `/api/spaces/[spaceId]/components/[componentId]/participate` | POST | Participate in component |

### Spaces - Posts (5 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/posts` | GET | List posts |
| `/api/spaces/[spaceId]/posts` | POST | Create post |
| `/api/spaces/[spaceId]/posts/[postId]` | GET/PATCH/DELETE | Post CRUD |
| `/api/spaces/[spaceId]/posts/[postId]/comments` | GET/POST | Post comments |
| `/api/spaces/[spaceId]/posts/[postId]/reactions` | POST | Post reactions |

### Spaces - Other (9 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/sidebar` | GET | Sidebar config |
| `/api/spaces/[spaceId]/analytics` | GET | Space analytics |
| `/api/spaces/[spaceId]/activity` | GET | Activity feed |
| `/api/spaces/[spaceId]/moderation` | GET/POST | Moderation |
| `/api/spaces/[spaceId]/data` | GET | Export data |
| `/api/spaces/[spaceId]/feed` | GET | Space feed |
| `/api/spaces/[spaceId]/builder-status` | GET | Builder status |
| `/api/spaces/[spaceId]/apply-template` | POST | Apply template |
| `/api/spaces/[spaceId]/upload-banner` | POST | Upload banner |
| `/api/spaces/[spaceId]/seed-rss` | POST | Seed from RSS |
| `/api/spaces/[spaceId]/promote-post` | POST | Promote to feed |

### Tools/HiveLab (28 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools` | GET | List user's tools |
| `/api/tools` | POST | Create tool |
| `/api/tools/[toolId]` | GET | Get tool |
| `/api/tools/[toolId]` | PATCH | Update tool |
| `/api/tools/[toolId]` | DELETE | Delete tool |
| `/api/tools/[toolId]/state` | GET/POST | Tool state |
| `/api/tools/[toolId]/deploy` | POST | Deploy tool |
| `/api/tools/[toolId]/analytics` | GET | Tool analytics |
| `/api/tools/[toolId]/reviews` | GET/POST | Tool reviews |
| `/api/tools/[toolId]/share` | POST | Share tool |
| `/api/tools/[toolId]/publish-template` | POST | Publish as template |
| `/api/tools/[toolId]/upload-asset` | POST | Upload asset |
| `/api/tools/[toolId]/with-state` | GET | Tool with state |
| `/api/tools/generate` | POST | AI generation |
| `/api/tools/execute` | POST | Execute action |
| `/api/tools/browse` | GET | Browse marketplace |
| `/api/tools/search` | GET | Search tools |
| `/api/tools/recommendations` | GET | Recommendations |
| `/api/tools/personal` | GET | Personal tools |
| `/api/tools/publish` | POST | Publish tool |
| `/api/tools/review` | POST | Review tool |
| `/api/tools/install` | POST | Install tool |
| `/api/tools/migrate` | POST | Migrate tools |
| `/api/tools/usage-stats` | GET | Usage stats |
| `/api/tools/event-system` | POST | Tool events |
| `/api/tools/feed-integration` | POST | Feed integration |
| `/api/tools/deploy` | POST | Deploy endpoint |
| `/api/tools/deploy/[deploymentId]` | GET/DELETE | Deployment CRUD |
| `/api/tools/state/[deploymentId]` | GET/POST | Deployment state |

### Templates (3 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/templates` | GET | List templates |
| `/api/templates/[templateId]` | GET | Get template |
| `/api/templates/[templateId]/use` | POST | Use template |

### Profile (17 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile` | GET | Current user profile |
| `/api/profile` | PATCH | Update profile |
| `/api/profile/[userId]` | GET | User profile by ID |
| `/api/profile/handle/[handle]` | GET | Profile by handle |
| `/api/profile/v2` | GET | Profile v2 |
| `/api/profile-v2/[userId]` | GET | Profile v2 by ID |
| `/api/profile/completion` | GET | Profile completion |
| `/api/profile/stats` | GET | Profile stats |
| `/api/profile/dashboard` | GET | Dashboard data |
| `/api/profile/privacy` | GET/POST | Privacy settings |
| `/api/profile/spaces` | GET | User's spaces |
| `/api/profile/spaces/recommendations` | GET | Space recommendations |
| `/api/profile/spaces/actions` | POST | Space actions |
| `/api/profile/my-spaces` | GET | My spaces |
| `/api/profile/upload-photo` | POST | Upload photo |
| `/api/profile/fcm-token` | POST | Register FCM token |
| `/api/profile/notifications/preferences` | GET/POST | Notification prefs |
| `/api/profile/calendar/events` | GET | Calendar events |
| `/api/profile/calendar/conflicts` | GET | Calendar conflicts |

### Feed (8 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/feed` | GET | Main feed |
| `/api/feed/updates` | GET | Feed updates |
| `/api/feed/search` | GET | Search feed |
| `/api/feed/aggregation` | GET | Aggregated feed |
| `/api/feed/algorithm` | GET | Algorithm config |
| `/api/feed/space-filtering` | GET | Filter by space |
| `/api/feed/cache` | GET/POST | Cache operations |
| `/api/feed/content-validation` | POST | Validate content |

### Calendar & Events (5 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/calendar` | GET | User calendar |
| `/api/calendar/[eventId]` | GET | Event details |
| `/api/calendar/conflicts` | GET | Conflict check |
| `/api/calendar/free-time` | GET | Free time slots |
| `/api/events` | GET | Campus events |

### Realtime (10 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/realtime/sse` | GET | SSE connection |
| `/api/realtime/websocket` | GET | WebSocket upgrade |
| `/api/realtime/send` | POST | Send message |
| `/api/realtime/chat` | GET/POST | Chat realtime |
| `/api/realtime/typing` | POST | Typing indicator |
| `/api/realtime/presence` | GET/POST | Presence |
| `/api/realtime/notifications` | GET | Notification stream |
| `/api/realtime/channels` | GET | Channel list |
| `/api/realtime/metrics` | GET | Realtime metrics |
| `/api/realtime/tool-updates` | GET | Tool update stream |

### Admin (13 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/spaces` | GET | List all spaces |
| `/api/admin/spaces/[spaceId]` | GET/PATCH | Space admin |
| `/api/admin/analytics/comprehensive` | GET | Full analytics |
| `/api/admin/analytics/realtime` | GET | Realtime stats |
| `/api/admin/builder-requests` | GET/POST | Builder requests |
| `/api/admin/moderation/feedback` | GET | Moderation feedback |
| `/api/admin/seed-school` | POST | Seed school data |
| `/api/admin/tools/review-stats` | GET | Tool review stats |
| `/api/admin/ai-quality/metrics` | GET | AI quality metrics |
| `/api/admin/ai-quality/generations` | GET | AI generations log |
| `/api/admin/ai-quality/failures` | GET | AI failures log |
| `/api/admin/ai-quality/edits` | GET | AI edits log |

### Privacy (3 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/privacy` | GET/POST | Privacy settings |
| `/api/privacy/visibility` | GET/POST | Visibility settings |
| `/api/privacy/ghost-mode` | POST | Toggle ghost mode |

### Social & Connections (5 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social/posts` | GET/POST | Social posts |
| `/api/social/interactions` | POST | Interactions |
| `/api/connections` | GET/POST | User connections |
| `/api/users/search` | GET | User search |
| `/api/posts/[postId]/comments` | GET | Post comments |
| `/api/comments/[commentId]/like` | POST | Like comment |

### Content & Moderation (3 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/content/check` | POST | Text moderation |
| `/api/content/check-image` | POST | Image moderation |
| `/api/content/reports` | GET/POST | Content reports |

### Utility (15 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/dev-auth` | POST | Dev auth (dev only) |
| `/api/campus/detect` | GET | Detect campus |
| `/api/schools` | GET | List schools |
| `/api/search` | GET | Global search |
| `/api/search/v2` | GET | Search v2 |
| `/api/notifications` | GET | Notifications |
| `/api/onboarding/catalog` | GET | Onboarding catalog |
| `/api/feedback` | POST | Submit feedback |
| `/api/errors/report` | POST | Error reporting |
| `/api/analytics/metrics` | GET/POST | Analytics |
| `/api/feature-flags` | GET | Feature flags |
| `/api/automations/templates` | GET | Automation templates |
| `/api/activity` | GET | Activity log |
| `/api/waitlist/join` | POST | Join waitlist |
| `/api/debug-calendar` | GET | Debug calendar |

---

## Key Conventions

### Imports

```typescript
// External first
import { useState } from 'react';

// @hive packages
import { EnhancedProfile } from '@hive/core';
import { Button } from '@hive/ui';

// Local
import { helper } from './lib/helper';
```

### Named Constants

Use constants for all values:
```typescript
export const STATUS_OK = 200;
export const ENDPOINTS = { USERS: '/api/users' };
```

### Firebase Access

Always use the `@hive/firebase` wrapper, never direct Firebase imports.

### Validation

All external data must be validated with Zod schemas from `@hive/validation`.

---

## Firebase Emulators

```
Auth:       localhost:9099
Firestore:  localhost:8080
Storage:    localhost:9199
UI:         localhost:4000
```

---

## Multi-Campus Model

HIVE is built as single-tenant-per-campus with shared infrastructure.

**Campus Isolation:**
Every database query includes `campusId` filtering:
```typescript
.where("campusId", "==", campusId)  // Enforced in 50+ API routes
```

**Current Campus:** `ub-buffalo` (University at Buffalo)
**Architecture:** Ready for additional campuses (just add domain config)

---

## Key File Locations

| Component | Path |
|-----------|------|
| Space page | `apps/web/src/app/spaces/[spaceId]/page.tsx` |
| Chat hook | `apps/web/src/hooks/use-chat-messages.ts` |
| Chat service | `packages/core/src/application/spaces/space-chat.service.ts` |
| Chat component | `packages/ui/src/atomic/03-Spaces/organisms/space-chat-board.tsx` |
| HiveLab IDE | `packages/ui/src/components/hivelab/ide/hivelab-ide.tsx` |
| Element system | `packages/ui/src/lib/hivelab/element-system.ts` |
| Element renderers | `packages/ui/src/components/hivelab/element-renderers.tsx` |
| Tool runtime hook | `apps/web/src/hooks/use-tool-runtime.ts` |
| Space entities | `packages/core/src/domain/spaces/entities/` |
| Space repository | `packages/core/src/infrastructure/repositories/firebase-admin/space.repository.ts` |

---

## Documentation Index

| Doc | Purpose |
|-----|---------|
| `docs/VISION.md` | **START HERE** — Full vision, student autonomy, AI philosophy |
| `docs/VERTICAL_SLICES.md` | Detailed Spaces + HiveLab specs, feature flags, success criteria |
| `docs/VALUE.md` | Value proposition, competitive positioning |
| `docs/DATABASE_SCHEMA.md` | Firestore collections reference |
| `docs/FIREBASE_SETUP.md` | Firebase configuration and setup |

---

## Deployment

Vercel handles deployment. Key config in `vercel.json`:
- Build: `pnpm --filter=@hive/web build`
- Output: `apps/web/.next`
- Security headers configured for CSP, HSTS
