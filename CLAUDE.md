# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Workflow Rules

### After User Says "Done"
**ALWAYS update TODO.md** when the user indicates a task is complete by saying "done", "finished", "completed", or similar:
1. Mark completed items with ✅
2. Update the "Last Updated" date
3. Revise completion percentages if applicable
4. Add any new issues discovered during the work
5. Move items between priority levels if needed

### Current Platform State (December 10, 2024)

**HONEST ASSESSMENT:**

| Slice | Actual State | What's Working | What's Broken |
|-------|--------------|----------------|---------------|
| **Spaces + Chat** | 85% DONE | Full DDD stack, SSE streaming, ownership detection, chat with threading | Typing indicator spam (2s polling), some UI polish |
| **HiveLab/Tools** | 80% DONE | Full IDE, element system, deployment, runtime | Analytics mock data |
| **Auth/Onboarding** | 70% DONE | Magic link, session management | Edge cases |
| **Feed** | 75% DONE | Privacy enforced, moderation | Ghost mode gaps |
| **Profiles** | 70% DONE | Basic flow works | Ghost mode incomplete |

**THE PLAN FILE WAS WRONG:** Previous documentation claimed hooks were "stubs" - they're NOT. Investigated December 10, 2024:
- `useChatMessages` - 953 lines, FULLY IMPLEMENTED (SSE, optimistic updates, threading, board switching)
- `useToolRuntime` - 596 lines, FULLY IMPLEMENTED (state persistence, auto-save, retry logic)
- `usePinnedMessages` - 161 lines, FULLY IMPLEMENTED
- `SpaceChatService` - 1,478 lines, complete DDD service with auto-General board creation
- SSE endpoint works with Firestore onSnapshot
- Space ownership detection confirmed working (createdBy + leaders array + spaceMembers)

**REAL Issues (not the imaginary ones):**
- P1: Typing indicator polling every 2s creates spam
- P1: Some deleted files referenced in imports may cause build errors
- P2: Ghost mode incomplete
- P2: Analytics uses mock data

**Stop re-auditing. Start shipping.**

## Build & Development Commands

```bash
# Development
pnpm dev                              # Run all dev servers via Turbo
pnpm --filter=@hive/web dev           # Web app only (port 3000)
pnpm --filter=@hive/admin dev         # Admin app only (port 3001)
pnpm --filter=@hive/hivelab dev       # HiveLab IDE (port 3002) ⭐ PRIMARY DEV TARGET

# Building
pnpm build                            # Build all packages
pnpm --filter=@hive/web build         # Build web app only
pnpm --filter=@hive/ui build          # Build UI package only

# Type checking & Linting
pnpm typecheck                        # Full TypeScript validation (uses NODE_OPTIONS for memory)
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
```

## Architecture Overview

**HIVE** is a pnpm monorepo with Turbo for build orchestration. Multi-tenant campus platform with Firebase backend.

### Workspace Structure

```
apps/
  web/              # Main Next.js 15 app (React 19) - port 3000
  admin/            # Admin panel - port 3001
  hivelab/          # HiveLab IDE - STANDALONE (port 3002) ⭐ BUILD HERE FIRST

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

Each context has aggregates, value objects, and entities.

### Component Architecture (@hive/ui)

Follows atomic design with Radix UI as foundation:
- `atomic/` - atoms, molecules, organisms
- `patterns/` - compound components, slot pattern, polymorphic
- `motion/` - Framer Motion presets
- Uses CVA (Class Variance Authority) for type-safe variants

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

## Firebase Emulators

```
Auth:       localhost:9099
Firestore:  localhost:8080
Storage:    localhost:9199
UI:         localhost:4000
```

## Deployment

Vercel handles deployment. Key config in `vercel.json`:
- Build: `pnpm --filter=@hive/web build`
- Output: `apps/web/.next`
- Security headers configured for CSP, HSTS

---

## ⭐ HiveLab Development Strategy

**VISION: Figma + Cursor. Canvas-first, AI-assisted via Cmd+K.**

See: `docs/PRD_HIVELAB_VISION.md` for full product vision.

### Core Philosophy: "Cursor for Visual Tools"

```
CURRENT (Chat-First):  User types → AI builds → User reviews
VISION (Cursor Model):  User works on canvas → Cmd+K when stuck → AI assists in-place
```

| Cursor | HiveLab |
|--------|---------|
| Code editor always visible | Canvas always visible |
| Cmd+K = inline AI | Cmd+K = element generation |
| Selection → AI context | Select elements → AI modifies |
| Tab to accept | Click accept / Esc dismiss |

The user should feel like **they built the tool**, with AI as their copilot.

### Development Workflow

```bash
# Primary development - HiveLab standalone app
pnpm --filter=@hive/hivelab dev       # Port 3002

# Secondary - Main web app (for API routes)
pnpm --filter=@hive/web dev           # Port 3000
```

### Immediate Priority

1. **Make IDE the primary entry point** - Remove chat-first `/create` flow
2. **Canvas polish** - Smart guides, snap to objects, better resize
3. **AI Command Palette** - Cmd+K with selection-aware prompts
4. **Properties panel** - Full config without modals

### Why Build Standalone First?

1. **Forces clean API boundaries** - HiveLab calls web APIs, can't cheat with direct imports
2. **Components stay in packages** - Must use `@hive/ui`, `@hive/core`, `@hive/hooks`
3. **SaaS-ready architecture** - Could spin off as separate product
4. **Easy to embed later** - Just import components into web app routes

### Current Element Inventory

| Tier | Count | Elements |
|------|-------|----------|
| Universal | 15 | search-input, filter-selector, result-list, date-picker, tag-cloud, map-view, chart-display, form-builder, countdown-timer, timer, counter, poll-element, leaderboard, notification-center |
| Connected | 5 | event-picker, space-picker, user-selector, rsvp-button, connection-list |
| Space (Leaders) | 7 | member-list, member-selector, space-events, space-feed, space-stats, announcement, role-gate |
| **TOTAL** | **27** | Renderers in `@hive/ui/components/hivelab/element-renderers.tsx` |

### Key Files

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

packages/core/src/domain/hivelab/      # Domain models
├── element-registry.ts                # Element definitions
└── tool-composition.types.ts          # Type definitions

apps/web/src/app/api/tools/            # Backend APIs (shared)
├── execute/route.ts                   # Tool execution runtime
├── generate/route.ts                  # AI generation
└── [toolId]/state/route.ts            # State persistence
```

### Runtime System (Working)

- `useToolRuntime` hook - SSE real-time sync, state persistence, action execution
- Element renderers with `onAction` callbacks
- Connection cascade engine - data flows between elements
- Auto-save with 2s debounce

---

## Product Vision: The Triangle

**Priority Focus:** HiveLab + Spaces + Profiles
**Deferred:** Rituals (platform-run), Feed enhancements, Marketplace

### Core Principle: Everything is HiveLab

There are NO "built-in" code paths. Everything renders through HiveLab:
- Widgets are simple tools
- Templates are pre-built tool compositions
- Default views are auto-deployed templates
- Leaders configure/customize, they don't build from scratch

### Spaces Architecture (60/40 Layout)

```
┌─────────────────────────────────────────────────────────────┐
│ Space Header (name, category, member count)                 │
├───────────────────────────────────┬─────────────────────────┤
│                                   │                         │
│   CHAT BOARD (60%)                │   SIDEBAR (40%)         │
│                                   │                         │
│   Real-time conversation          │   Persistent context    │
│   NOT a feed of posts             │   - Upcoming events     │
│                                   │   - Member highlights   │
│   Inline components:              │   - Deployed tools      │
│   - Polls in chat                 │   - Quick actions       │
│   - Signups inline                │                         │
│   - Interactive elements          │   All rendered via      │
│                                   │   HiveLab components    │
│   Think: Discord + ChatGPT        │                         │
│                                   │                         │
├───────────────────────────────────┴─────────────────────────┤
│ Boards Tab Bar (topic/event-specific chat rooms)            │
│ [General] [Spring Event] [Study Group] [+]                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Decisions:**
- Chat Board = real-time conversation model (like Discord)
- Sidebar = persistent components rendered via HiveLab
- Boards = topic/event-specific chat rooms (Discord channels)
- Inline Components = interactive elements in chat flow

### HiveLab Architecture (Canvas + IDE)

```
┌─────────────────────────────────────────────────────────────┐
│ HiveLab Workspace                                    [Save] │
├──────────────┬─────────────────────────┬────────────────────┤
│              │                         │                    │
│  ELEMENT     │      CANVAS             │    INSPECTOR       │
│  PALETTE     │                         │                    │
│              │   Visual builder        │   Selected element │
│  - Text      │   Figma-like feel       │   properties       │
│  - Button    │                         │                    │
│  - Poll      │   Drag, drop, arrange   │   - Data sources   │
│  - Event     │   Preview in context    │   - Styling        │
│  - List      │                         │   - Actions        │
│  - ...       │                         │   - Permissions    │
│              │                         │                    │
├──────────────┴─────────────────────────┴────────────────────┤
│ AI BAR: "Create a poll for event signup..."                 │
└─────────────────────────────────────────────────────────────┘
```

**Element Tiers:**
- `universal` - Work anywhere (text, button, image)
- `connected` - Need data source (event list, member grid)
- `space` - Space-specific (announcements, role-gated)

**Data Sources:**
- `space-events`, `space-members`, `space-feed`, `space-stats`
- `campus-events`, `campus-spaces`, `campus-users`

### Pre-seeded Spaces (400+)

- RSS import done by HIVE platform
- Spaces exist with events, waiting for leaders
- MUST work without a leader
- Templates auto-deploy based on category:
  - `academic` → course materials, study groups
  - `social` → event calendar, member introductions
  - `professional` → networking, opportunities
  - `interest` → discussions, resources

### HiveLab Scaling Model

```
Tools → Apps → Platforms → Ventures ("Hives")
```

- **Tools**: Single-purpose components (poll, signup, calendar)
- **Apps**: Multi-component compositions (event manager)
- **Platforms**: Full experiences (club management suite)
- **Ventures**: Revenue-generating businesses on HIVE

---

## Vertical Slice 1: Space Chat Board

### STATUS: ALREADY BUILT (December 10, 2024 Verification)

**This section was written as "to build" but the code ALREADY EXISTS:**

| Component | Location | Lines | Status |
|-----------|----------|-------|--------|
| `SpaceChatBoard` | `@hive/ui/atomic/03-Spaces/organisms/space-chat-board.tsx` | 1,120 | ✅ DONE |
| `useChatMessages` | `apps/web/src/hooks/use-chat-messages.ts` | 953 | ✅ DONE |
| `usePinnedMessages` | `apps/web/src/hooks/use-pinned-messages.ts` | 161 | ✅ DONE |
| `SpaceChatService` | `packages/core/src/application/spaces/space-chat.service.ts` | 1,478 | ✅ DONE |
| Chat API | `apps/web/src/app/api/spaces/[spaceId]/chat/` | 266+ | ✅ DONE |
| SSE Stream | `apps/web/src/app/api/spaces/[spaceId]/chat/stream/route.ts` | 229 | ✅ DONE |
| Board Entity | `packages/core/src/domain/spaces/entities/board.ts` | ~200 | ✅ DONE |

**What's actually implemented:**
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

**Remaining issues:**
- Typing indicator polls every 2 seconds (performance problem)
- Some edge cases in board switching
- UI polish needed

### Architecture (IMPLEMENTED)

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

### Key Files (Reference)

```
# Frontend hooks (FULLY IMPLEMENTED)
apps/web/src/hooks/use-chat-messages.ts     # 953 lines - SSE, optimistic updates
apps/web/src/hooks/use-pinned-messages.ts   # 161 lines - pin/unpin

# Backend API (DDD-compliant)
apps/web/src/app/api/spaces/[spaceId]/chat/route.ts        # CRUD
apps/web/src/app/api/spaces/[spaceId]/chat/stream/route.ts # SSE
apps/web/src/app/api/spaces/[spaceId]/boards/route.ts      # Board management

# Core domain (DDD)
packages/core/src/application/spaces/space-chat.service.ts  # 1,478 lines
packages/core/src/domain/spaces/entities/board.ts
packages/core/src/domain/spaces/entities/chat-message.ts

# UI Component
packages/ui/src/atomic/03-Spaces/organisms/space-chat-board.tsx # 1,120 lines
```

---

## Vertical Slice 2: HiveLab Canvas

### Vision
A visual creation studio where anyone can build interactive components without code. Figma-like canvas with an IDE feel - drag elements, configure properties, deploy anywhere.

### Current State (Already Built!)

**Most HiveLab code is already in packages - well-structured for standalone extraction.**

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
│   ├── element-system.ts          # 20+ elements, 3 tiers!
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

### Migration Plan: Build Standalone First

**Phase 1: Create `apps/hivelab` shell**
```bash
apps/hivelab/
├── package.json                   # @hive/hivelab
├── next.config.js                 # Shared config from @hive/web
├── src/app/
│   ├── layout.tsx                 # HiveLab-specific layout (no nav chrome)
│   ├── page.tsx                   # Dashboard (import HiveLabToolsPage)
│   ├── create/page.tsx            # New tool (import existing components)
│   └── [toolId]/
│       ├── page.tsx               # Canvas editor
│       ├── preview/page.tsx
│       └── deploy/page.tsx
└── src/lib/
    └── api-client.ts              # Calls apps/web/api/tools/*
```

**Phase 2: Migrate routes from apps/web**
- Move `/tools` routes to `/` in hivelab app
- Keep `/hivelab` redirect in web → standalone URL
- APIs stay in `apps/web/src/app/api/tools/` (shared backend)

**Phase 3: Embed back into web (optional)**
```tsx
// apps/web/src/app/(hivelab)/lab/page.tsx
import { HiveLabToolsPage } from '@hive/ui/pages/hivelab';
export default function LabPage() {
  return <HiveLabToolsPage embedded />;
}
```

### Why Build Standalone First?
- Forces clean API boundaries from day 1
- Components MUST stay in packages (can't cheat)
- SaaS-ready architecture
- Easy to embed later (just import components)
- Mental model: "HiveLab is a product"

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ HiveLab                                    [Preview] [Save] [Deploy]│
├────────────┬────────────────────────────────────────┬───────────────┤
│            │                                        │               │
│  ELEMENTS  │           CANVAS                       │   INSPECTOR   │
│  ════════  │           ══════                       │   ═════════   │
│            │                                        │               │
│  Layout    │   ┌────────────────────────────────┐   │  Element: Poll│
│  ├─ Stack  │   │                                │   │               │
│  ├─ Grid   │   │   ┌─────────────────────┐      │   │  Title        │
│  └─ Card   │   │   │    POLL ELEMENT     │      │   │  [What's...]  │
│            │   │   │                     │      │   │               │
│  Input     │   │   │  What's for lunch?  │      │   │  Options      │
│  ├─ Text   │   │   │  ○ Pizza            │      │   │  + Add option │
│  ├─ Button │   │   │  ○ Tacos            │      │   │               │
│  └─ Select │   │   │  ○ Sushi            │      │   │  Data Source  │
│            │   │   │                     │      │   │  [none]       │
│  Data      │   │   │  [Vote]             │      │   │               │
│  ├─ List   │   │   └─────────────────────┘      │   │  Actions      │
│  ├─ Table  │   │                                │   │  on_submit:   │
│  └─ Chart  │   │                                │   │  [record_vote]│
│            │   └────────────────────────────────┘   │               │
│  Space     │                                        │  Permissions  │
│  ├─ Events │   [Zoom: 100%] [Undo] [Redo]          │  [All members]│
│  ├─ Members│                                        │               │
│  └─ Stats  │                                        │               │
│            │                                        │               │
├────────────┴────────────────────────────────────────┴───────────────┤
│ AI: "Create a poll asking what food to order for the study session" │
│ [Generate] ─────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────────────┘
```

### Data Schema

```typescript
// Firestore: /tools/{toolId}
interface Tool {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  campusId: string;

  // Canvas state
  elements: ToolElement[];
  canvasSettings: {
    width: number;
    height: number;
    background: string;
  };

  // Metadata
  category: 'poll' | 'form' | 'display' | 'interactive' | 'custom';
  tags: string[];
  isTemplate: boolean;
  templateId?: string;  // If created from template

  // Stats
  useCount: number;
  deploymentCount: number;

  // Versioning
  version: number;
  publishedVersion?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Element within a tool
interface ToolElement {
  id: string;
  type: string;              // 'poll', 'button', 'text', 'event-list'
  tier: 'universal' | 'connected' | 'space';

  // Position & size
  position: { x: number; y: number };
  size: { width: number; height: number };

  // Element-specific config
  config: Record<string, unknown>;

  // Data binding
  dataSource?: {
    type: 'none' | 'space-events' | 'space-members' | 'custom';
    query?: Record<string, unknown>;
  };

  // Actions
  actions: ElementAction[];

  // Nesting
  children?: string[];  // Child element IDs
  parentId?: string;
}

// Firestore: /templates/{templateId}
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;

  // The tool definition to clone
  toolSnapshot: Tool;

  // Targeting
  targetCategories: string[];  // 'academic', 'social', etc.
  isDefault: boolean;          // Auto-deploy to matching spaces

  // Stats
  usageCount: number;

  createdBy: 'hive' | string;  // Platform or user
  createdAt: Timestamp;
}
```

### Components to Build

| Component | Location | Purpose |
|-----------|----------|---------|
| `HiveLabWorkspace` | `apps/hivelab/` or `@hive/ui` | Main canvas container |
| `ElementPalette` | `@hive/ui/components/hivelab/` | Draggable element list |
| `CanvasArea` | `@hive/ui/components/hivelab/` | Drop target, element rendering |
| `ElementInspector` | `@hive/ui/components/hivelab/` | Property editor |
| `AIBar` | `@hive/ui/components/hivelab/` | Natural language input |
| `DeployModal` | `@hive/ui/components/hivelab/` | Target selection |
| `PreviewPanel` | `@hive/ui/components/hivelab/` | Live preview |

### API Endpoints

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

### Implementation Steps

1. **Create HiveLab app structure**
   ```bash
   # Option A: Separate Next.js app
   apps/hivelab/

   # Option B: Route group in web app (faster start)
   apps/web/src/app/(hivelab)/lab/
   ```

2. **Build canvas with dnd-kit**
   - Element palette with drag sources
   - Canvas as drop target
   - Snap-to-grid positioning
   - Multi-select, grouping

3. **Implement element registry**
   - Type-safe element definitions
   - Config schemas per element type
   - Renderer components for each element

4. **Wire up persistence**
   - Auto-save to Firestore
   - Undo/redo with Zustand
   - Version history

5. **Add deployment flow**
   - Target picker (space sidebar, profile, etc.)
   - Permission configuration
   - Live preview in context

### Files: Current State vs Migration

```
# ALREADY EXISTS (in packages - ready for standalone):
packages/ui/src/components/hivelab/studio/  # DnD canvas ✓
packages/ui/src/components/hivelab/*.tsx    # AI, streaming, deploy ✓
packages/ui/src/lib/hivelab/element-system.ts  # 20+ elements ✓
packages/ui/src/pages/hivelab/*.tsx         # Page components ✓
packages/ui/src/hooks/hivelab/              # Hooks ✓
packages/core/src/domain/hivelab/           # Types, registry ✓
packages/core/src/application/hivelab/      # AI generation ✓

# CURRENTLY IN WEB (routes to migrate):
apps/web/src/app/tools/                     # → apps/hivelab/src/app/
apps/web/src/app/hivelab/                   # → redirect to standalone

# STAYS IN WEB (shared backend):
apps/web/src/app/api/tools/                 # 15+ API routes

# TO CREATE (standalone app):
apps/hivelab/
├── package.json
├── next.config.js
├── turbo.json entry
├── src/app/layout.tsx                      # Focused layout
├── src/app/page.tsx                        # Dashboard
├── src/app/create/page.tsx
├── src/app/[toolId]/page.tsx               # Canvas
└── src/lib/api-client.ts                   # Calls web API
```

---

## Implementation Priority

### Recommended Order: HiveLab Standalone First, Then Spaces

**Rationale:** HiveLab already has most code built. Creating standalone app is mostly scaffolding.

```
Week 1: HiveLab Standalone App
├── Create apps/hivelab shell (package.json, next.config, turbo)
├── Import existing page components from @hive/ui/pages/hivelab
├── Wire up API client to call apps/web/api/tools/*
├── Basic auth session sharing
└── Verify: can create, edit, preview, deploy tools

Week 2: HiveLab Polish + Canvas Improvements
├── Improve canvas UX (inspector panel, better DnD)
├── AI bar improvements
├── Deploy flow refinements
└── Template browser for pre-built tools

Week 3-4: Space Chat Board
├── Create RTDB hooks for real-time chat
├── Build SpaceChatBoard component
├── Replace feed with chat in space page
├── Add boards (channels) support

Week 5-6: Connect the Systems
├── Deploy HiveLab tools → Space sidebar
├── Inline components in chat board
├── Auto-deploy templates to pre-seeded spaces (400+)
└── Leader customization UI

Week 7-8: Integration + Polish
├── Embed HiveLab in web app (/lab route)
├── Cross-app navigation
├── Analytics dashboard
└── Template marketplace
```

### Why HiveLab First?
- Code already exists - just needs app shell
- Creates immediate value (power users can build)
- Deployment target (spaces) can use HiveLab outputs
- Validates architecture before spaces work

---

## Platform Readiness (UPDATED December 10, 2024)

**Previous assessment was wrong. Re-evaluated by actually reading the code:**

| Vertical Slice | Actual % | Status | Notes |
|----------------|----------|--------|-------|
| **Spaces + Chat** | 85% | ✅ WORKING | DDD, SSE, ownership all work. Just needs polish. |
| **HiveLab/Tools** | 80% | ✅ WORKING | IDE exists, deployment works. Analytics is mock. |
| **Auth/Onboarding** | 70% | ✅ WORKING | Magic link works. Some edge cases. |
| **Feed** | 75% | ✅ WORKING | Privacy enforced, moderation in place. |
| **Profiles** | 70% | ⚠️ PARTIAL | Ghost mode incomplete. |

### Architecture Quality Scores (REVISED)

| Dimension | Score | Actual Notes |
|-----------|-------|--------------|
| API Coverage | 9/10 | 50+ routes, comprehensive |
| Domain Model | 8/10 | DDD properly implemented in core |
| Frontend Components | 8/10 | Atomic design, well-structured |
| Real-time | **7/10** | SSE WORKS (contrary to old docs). Minor perf issues. |
| Testing | 6/10 | Domain good, API needs work |
| Validation | 6/10 | SecureSchemas applied in critical paths |

**Previous "SSE broken" claim was FALSE.** The SSE endpoint at `/api/spaces/[spaceId]/chat/stream/route.ts` uses Firestore onSnapshot and works correctly. Verified December 10.

### Critical Files Reference

**Spaces Chat Board:**
- `apps/web/src/app/spaces/[spaceId]/page.tsx` - Main view (refactor target)
- `apps/web/src/contexts/SpaceContext.tsx` - State management
- `packages/core/src/domain/spaces/entities/` - Board entity (new)

**HiveLab Canvas:**
- `packages/ui/src/lib/hivelab/element-system.ts` - Element registry
- `packages/ui/src/components/hivelab/` - Visual builder (extend)
- `apps/web/src/app/api/tools/` - Backend APIs

**Shared:**
- `apps/web/src/lib/tool-action-handlers.ts` - Action execution
- `apps/web/src/app/api/tools/execute/route.ts` - Runtime execution

---

## Vertical Slice Architecture

**Reference:** `docs/architecture/VERTICAL_SLICE_AUDIT.md`

### 22 Vertical Slices

**Core Journey:** Auth, Onboarding, Profiles, Spaces, Feed
**Engagement:** Tools/HiveLab, Rituals, Calendar/Events, Notifications, Social/Connections
**Infrastructure:** Real-time, Search, Privacy, Admin, Moderation, Campus/Schools
**Minor:** Feature Flags, Error Reporting, Feedback, Waitlist, Health/Cron

### Known Issues (CORRECTED December 10, 2024)

**WRONG - These were listed as broken but actually work:**
| "Issue" | Reality |
|---------|---------|
| ~~SSE Broadcast broken~~ | SSE works via Firestore onSnapshot in `/chat/stream/route.ts` |
| ~~SecureSchemas not applied~~ | SecurityScanner applied in chat routes, space updates |
| ~~Composite key migration~~ | Both patterns supported (composite + query fallback) |

**ACTUAL Current Issues:**
| Issue | Impact | File |
|-------|--------|------|
| Typing indicator spam | Performance - polls every 2s | `useChatMessages` |
| Analytics mock data | No real usage stats | HiveLab analytics |
| Ghost mode incomplete | Privacy gaps | Profile queries |
| Some deleted file imports | Build errors | Various hooks |

**What's actually working:**
- ✅ Space ownership detection (createdBy, leaders array, spaceMembers)
- ✅ SSE real-time chat with Firestore onSnapshot
- ✅ Rate limiting (20 msg/min on chat)
- ✅ XSS protection via SecurityScanner
- ✅ DDD architecture in @hive/core
- ✅ Optimistic updates in chat
- ✅ Auto "General" board creation
- ✅ Session management
- ✅ Campus isolation

### DDD Models (ACTUALLY INTEGRATED)

**Wrong again.** Many APIs DO use DDD models:

```typescript
// INTEGRATED - Used in API routes:
import { getServerSpaceRepository } from '@hive/core/server';     // Space routes
import { createServerSpaceChatService } from '@hive/core/server'; // Chat routes
import { toSpaceDetailDTO, toSpaceWithToolsDTO } from '@hive/core/server'; // DTOs

// Example from /api/spaces/[spaceId]/route.ts:
const spaceRepo = getServerSpaceRepository();
const result = await spaceRepo.findById(spaceId, { loadPlacedTools: true });
const space = result.getValue();
return respond.success(toSpaceWithToolsDTO(space));
```

The pattern: API routes use DDD services and repositories from `@hive/core/server`.

---

## AI Integration Notes

When working on any slice, consider AI opportunities:

| Slice | Near-term AI | Long-term AI |
|-------|--------------|--------------|
| Feed | Rule-based ranking | Intent prediction |
| Search | Query expansion | Semantic search |
| Moderation | Toxicity detection | Proactive detection |
| Tools | Template suggestion | NL generation |
| Notifications | Importance scoring | Predictive alerts |

---

## Documentation Index

| Doc | Purpose |
|-----|---------|
| `docs/architecture/VERTICAL_SLICE_AUDIT.md` | Complete slice analysis + technical status |
| `docs/architecture/IMPLEMENTATION_ROADMAP.md` | Ordered implementation with AI analysis |
| `docs/ARCHITECTURE.md` | Codebase structure overview |
| `docs/development/DATABASE_SCHEMA.md` | Firestore collections |
| `docs/features/FEATURES.md` | Feature specifications |
