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

### AI Philosophy

AI isn't the goal. AI expands what students can think.

- AI lets you explore ideas you couldn't explore alone
- AI connects you to knowledge you didn't know existed
- AI helps you build things beyond your current skill level
- AI is a thinking partner, not a replacement for thinking

### Winter 2025-26 Priority

**Win UB. Prove the model at density.**

| Build | Defer |
|-------|-------|
| Spaces (community, chat, real-time) | Feed enhancements |
| HiveLab (creation, tools, deployment) | Rituals |
| Social graph features | Marketplace |
| AI integration (catch-up, exploration) | University contracts |

### Launch Strategy

**University at Buffalo first. 32,000 students, 300+ orgs.**

- 400+ spaces pre-seeded from CampusLabs
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

**Element Tiers:**

| Tier | Count | Examples | Who Can Use |
|------|-------|----------|-------------|
| Universal | 15 | poll, timer, form, chart | Anyone |
| Connected | 5 | event-picker, user-selector, rsvp-button | Need data source |
| Space | 7 | member-list, announcements, role-gate | Space leaders |

**Current Element Inventory (27 total):**
- Universal: search-input, filter-selector, result-list, date-picker, tag-cloud, map-view, chart-display, form-builder, countdown-timer, timer, counter, poll-element, leaderboard, notification-center
- Connected: event-picker, space-picker, user-selector, rsvp-button, connection-list
- Space: member-list, member-selector, space-events, space-feed, space-stats, announcement, role-gate

**Deployment Targets:**
- Space sidebar (persistent tools)
- Inline in chat (interactive messages)
- Profile widgets
- Standalone pages

**"Everything is HiveLab" Philosophy:**
There are NO built-in UI code paths. Everything renders through HiveLab:
- Default space views = auto-deployed templates
- Widgets = simple tools
- Templates = pre-built tool compositions
- Leaders configure, they don't build from scratch

---

## Platform Architecture

### Multi-Campus Model

HIVE is built as single-tenant-per-campus with shared infrastructure.

**Campus Isolation:**
Every database query includes `campusId` filtering:
```typescript
.where("campusId", "==", campusId)  // Enforced in 50+ API routes
```

This prevents cross-campus data leakage at the query level.

**Current Campus:** `ub-buffalo` (University at Buffalo)
**Architecture:** Ready for additional campuses (just add domain config)

### Pre-Seeded Spaces (The Cold-Start Solution)

**The chicken-egg problem:**
- Students won't join without active communities
- Leaders won't move without student adoption
- Empty platforms die

**HIVE's solution:** Import 400+ organizations from CampusLabs Engage API

```javascript
// scripts/import-campuslabs.mjs
const CONFIG = {
  CAMPUSLABS_API: 'https://buffalo.campuslabs.com/engage/api/discovery/search/organizations',
  BRANCH_MAP: {
    1419: 'student_org',
    360210: 'university_org',
    360211: 'greek_life',
    360212: 'residential',
  }
};
```

**How it works:**
1. Spaces are pre-created with names, categories, descriptions
2. They exist in "stealth" mode until a leader claims them
3. Students can browse/discover immediately
4. Leaders claim → go "live" → full customization unlocked

**Space Categories:**
- `student_org` - Clubs, teams, academic groups
- `greek_life` - Fraternities, sororities
- `academic` - Course-related
- `university_org` - Official university organizations
- `sports`, `arts`, `social`, `professional`
- `residential` - Dorms (hidden, RA-only)

### Data Layer (The Moat)

HIVE owns the structured data about campus life:

```
┌─────────────────────────────────────────────────────────────┐
│                    STRUCTURED DATA                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│     SPACES      │     EVENTS      │       MEMBERS           │
│  - 400+ orgs    │  - All campus   │  - Profiles             │
│  - Categories   │  - RSVPs        │  - Connections          │
│  - Activity     │  - Attendance   │  - Interests            │
├─────────────────┴─────────────────┴─────────────────────────┤
│                    ENGAGEMENT                                │
│  - Messages, reactions, tool usage, event attendance        │
└─────────────────────────────────────────────────────────────┘
```

This data layer is what AI assistants and future tools will query:
- "What events match my interests?"
- "Which clubs are most active this week?"
- "Who should I connect with in my major?"

### The "Campus OS" Future

```
2025-26 (Now):     HIVE = Best place to discover and engage
2026+ (Future):    HIVE = Data layer that AI assistants plug into
```

Students won't just use HIVE's UI—their AI assistants will query HIVE's APIs.

---

## Current Platform State (December 2025)

**Honest Assessment:**

| Slice | Actual State | What's Working | What's Broken |
|-------|--------------|----------------|---------------|
| **Spaces + Chat** | 85% DONE | Full DDD stack, SSE streaming, ownership detection, chat with threading | Typing indicator spam (2s polling), some UI polish |
| **HiveLab/Tools** | 80% DONE | Full IDE, element system, deployment, runtime | Analytics mock data |
| **Auth/Onboarding** | 85% DONE | OTP auth, JWT sessions, 4-step onboarding, dev auth bypass | Edge cases in onboarding |
| **Feed** | 75% DONE | Privacy enforced, moderation | Ghost mode gaps |
| **Profiles** | 70% DONE | Basic flow works | Ghost mode incomplete |

**What's Actually Working:**
- `useChatMessages` - 953 lines, FULLY IMPLEMENTED (SSE, optimistic updates, threading, board switching)
- `useToolRuntime` - 596 lines, FULLY IMPLEMENTED (state persistence, auto-save, retry logic)
- `usePinnedMessages` - 161 lines, FULLY IMPLEMENTED
- `SpaceChatService` - 1,478 lines, complete DDD service with auto-General board creation
- SSE endpoint works with Firestore onSnapshot
- Space ownership detection confirmed working (createdBy + leaders array + spaceMembers)

**Real Issues (P1/P2):**
- P1: Typing indicator polling every 2s creates spam
- P2: Ghost mode incomplete
- P2: Analytics uses mock data

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
# Login page has dev buttons, or use curl:
curl -X POST http://localhost:3000/api/dev-auth \
  -H "Content-Type: application/json" \
  -d '{"email":"jwrhineh@buffalo.edu"}' \
  -c /tmp/hive_cookies.txt
```

---

## Technical Architecture

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
  config/
    eslint/         # Shared ESLint config
    typescript/     # TypeScript config presets (base, nextjs, react-library)

infrastructure/     # Firebase rules, deployment configs
tooling/           # Build scripts
scripts/           # Seed scripts, migrations
docs/              # Architecture docs, audits
```

### Path Aliases (tsconfig.json)

```typescript
@hive/ui           // packages/ui/src
@hive/core         // packages/core/src
@hive/hooks        // packages/hooks/src
@hive/firebase     // packages/firebase/src
@hive/tokens       // packages/tokens/src
@hive/validation   // packages/validation/src
@hive/auth-logic   // packages/auth-logic/src
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

### Domain-Driven Design (@hive/core)

The core package uses DDD with bounded contexts:
- `domain/profile/` - User profiles
- `domain/spaces/` - Space management (tabs, widgets)
- `domain/rituals/` - Ritual system
- `domain/feed/` - Feed domain
- `domain/hivelab/` - Tool composition

Each context has aggregates, value objects, and entities.

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

### Component Architecture (@hive/ui)

Follows atomic design with Radix UI as foundation:
- `atomic/` - atoms, molecules, organisms
- `patterns/` - compound components, slot pattern, polymorphic
- `motion/` - Framer Motion presets
- Uses CVA (Class Variance Authority) for type-safe variants

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

## Deployment

Vercel handles deployment. Key config in `vercel.json`:
- Build: `pnpm --filter=@hive/web build`
- Output: `apps/web/.next`
- Security headers configured for CSP, HSTS

---

## Vertical Slice: Space Chat Board

### Status: FULLY BUILT

| Component | Location | Lines | Status |
|-----------|----------|-------|--------|
| `SpaceChatBoard` | `@hive/ui/atomic/03-Spaces/organisms/space-chat-board.tsx` | 1,120 | DONE |
| `useChatMessages` | `apps/web/src/hooks/use-chat-messages.ts` | 953 | DONE |
| `usePinnedMessages` | `apps/web/src/hooks/use-pinned-messages.ts` | 161 | DONE |
| `SpaceChatService` | `packages/core/src/application/spaces/space-chat.service.ts` | 1,478 | DONE |
| Chat API | `apps/web/src/app/api/spaces/[spaceId]/chat/` | 266+ | DONE |
| SSE Stream | `apps/web/src/app/api/spaces/[spaceId]/chat/stream/route.ts` | 229 | DONE |
| Board Entity | `packages/core/src/domain/spaces/entities/board.ts` | ~200 | DONE |

**What's Implemented:**
- SSE real-time with Firestore onSnapshot
- Optimistic updates with rollback
- Threading support
- Board (channel) switching
- Auto-creation of "General" board
- Rate limiting (20 msg/min)
- XSS protection
- Message editing/deletion
- Reactions
- Typing indicators (but polling too frequently)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│ Space Page (apps/web/src/app/spaces/[spaceId]/page.tsx)     │
├───────────────────────────────────┬─────────────────────────┤
│                                   │                         │
│  CHAT BOARD (60%)                 │  SIDEBAR (40%)          │
│  useChatMessages hook             │  Tools, Events, Members │
│  SSE → /chat/stream endpoint      │  useToolRuntime hook    │
│                                   │                         │
├───────────────────────────────────┴─────────────────────────┤
│ Board tabs: auto-creates "General" via SpaceChatService     │
└─────────────────────────────────────────────────────────────┘
```

---

## Vertical Slice: HiveLab Canvas

### Status: MOSTLY BUILT

**Code in packages (ready for standalone):**

```
packages/ui/src/
├── components/hivelab/
│   ├── studio/                    # DnD canvas components
│   │   ├── DndStudioProvider.tsx  # DnD context
│   │   ├── CanvasDropZone.tsx     # Drop target
│   │   ├── DraggablePaletteItem.tsx
│   │   └── SortableCanvasElement.tsx
│   ├── AIPromptInput.tsx          # AI prompt input
│   ├── StreamingCanvasView.tsx    # Streaming generation view
│   ├── ToolDeployModal.tsx        # Deploy modal
│   ├── element-renderers.tsx      # Element renderers
│   ├── visual-tool-composer.tsx   # Visual composer
│   └── showcase/                  # Template browser, element cards
├── lib/hivelab/
│   ├── element-system.ts          # 20+ elements, 3 tiers
│   ├── tool-state-manager.ts      # State management
│   └── local-tool-storage.ts      # Local storage
├── hooks/hivelab/
│   └── use-tool-state.ts          # Tool state hook
└── pages/hivelab/
    ├── HiveLabToolsPage.tsx       # Tools list page
    ├── ToolEditPage.tsx           # Edit page component
    ├── ToolPreviewPage.tsx        # Preview component
    └── ToolAnalyticsPage.tsx      # Analytics component

packages/core/src/
├── domain/hivelab/
│   ├── element-registry.ts        # Element registry
│   └── tool-composition.types.ts  # Composition types
└── application/hivelab/
    ├── ai-tool-generator.service.ts  # AI generation
    └── prompts/tool-generation.prompt.ts

apps/web/src/app/
├── hivelab/page.tsx               # Currently redirects to /tools
├── tools/                         # Full CRUD routes exist
│   ├── page.tsx                   # List tools
│   ├── create/page.tsx            # Create new
│   └── [toolId]/                  # View, edit, preview, deploy, run, analytics
└── api/tools/                     # 15+ API routes (generate, execute, deploy, etc.)
```

**Runtime System (Working):**
- `useToolRuntime` hook - SSE real-time sync, state persistence, action execution
- Element renderers with `onAction` callbacks
- Connection cascade engine - data flows between elements
- Auto-save with 2s debounce

**Key Files:**
```
apps/hivelab/                          # Standalone HiveLab app (port 3002)
├── src/app/[toolId]/                  # Tool editing routes
│   ├── deploy/page.tsx                # Deployment flow
│   └── analytics/page.tsx             # Usage analytics

packages/ui/src/components/hivelab/    # Shared components
├── element-renderers.tsx              # 27 element renderers
├── StreamingCanvasView.tsx            # AI generation view
├── studio/                            # DnD canvas components
└── showcase/                          # Template browser

apps/web/src/app/api/tools/            # Backend APIs (shared)
├── execute/route.ts                   # Tool execution runtime
├── generate/route.ts                  # AI generation
└── [toolId]/state/route.ts            # State persistence
```

---

## API Endpoints Reference

### Spaces
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces` | GET | List spaces |
| `/api/spaces` | POST | Create space |
| `/api/spaces/[spaceId]` | GET | Get space |
| `/api/spaces/[spaceId]/chat` | GET/POST | Chat messages |
| `/api/spaces/[spaceId]/chat/stream` | GET | SSE real-time |
| `/api/spaces/[spaceId]/boards` | GET/POST | Board management |
| `/api/spaces/[spaceId]/members` | GET/POST | Member management |

### HiveLab/Tools
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools` | GET | List user's tools |
| `/api/tools` | POST | Create new tool |
| `/api/tools/[toolId]` | GET | Get tool definition |
| `/api/tools/[toolId]` | PATCH | Update tool |
| `/api/tools/[toolId]/deploy` | POST | Deploy to target |
| `/api/tools/[toolId]/publish` | POST | Publish version |
| `/api/tools/generate` | POST | AI generation |
| `/api/templates` | GET | Browse templates |
| `/api/templates/[templateId]/use` | POST | Create from template |

---

## Documentation Index

| Doc | Purpose |
|-----|---------|
| `docs/VISION.md` | **START HERE** — Full vision, student autonomy, AI philosophy, goals |
| `docs/VERTICAL_SLICES.md` | Spaces + HiveLab specs, feature flags, architecture, success criteria |
| `docs/VALUE.md` | Value proposition, what's built, competitive positioning |
| `docs/DATABASE_SCHEMA.md` | Firestore collections |
| `docs/FIREBASE_SETUP.md` | Firebase configuration and setup |

---

## Workflow Rules

### After User Says "Done"

**ALWAYS update TODO.md** when the user indicates a task is complete:
1. Mark completed items with checkmark
2. Update the "Last Updated" date
3. Revise completion percentages if applicable
4. Add any new issues discovered during the work
5. Move items between priority levels if needed

### AI Integration Notes

When working on any slice, consider AI opportunities:

| Slice | Near-term AI | Long-term AI |
|-------|--------------|--------------|
| Feed | Rule-based ranking | Intent prediction |
| Search | Query expansion | Semantic search |
| Moderation | Toxicity detection | Proactive detection |
| Tools | Template suggestion | NL generation |
| Notifications | Importance scoring | Predictive alerts |
