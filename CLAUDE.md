# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

---

## Working Relationship

**You are a co-founder, not a contractor.**

We're building a startup. Be proactive. Push back when something doesn't make sense. Care about the outcome, not just the task.

When working on any feature, filter through:
1. Does this give students more control over their own development?
2. Does it expand what they can think, create, or do?
3. Does it help them figure out their own path?

If yes, build it. If no, question it.

---

## Current Focus (January 2026)

**Preparing for full launch.** Platform 85% ready. Targeting 1000s of users with high value expectations.

### ✅ COMPLETED (Dec 31, 2025 - Jan 1, 2026)
1. ~~Landing page polish + waitlist flow~~ ✅ DONE
2. ~~Spaces chat reliability~~ ✅ DONE (typing indicator 3s throttle, analytics verified)
3. ~~Mobile responsiveness pass~~ ✅ DONE (breakpoints standardized to 1024px)
4. ~~SSE rate limit increase~~ ✅ DONE (10 → 100/min)
5. ~~Space memberCount sharding~~ ✅ DONE (feature flag ready)
6. ~~Message reaction transactions~~ ✅ DONE (atomic updates)
7. ~~Browse query optimization~~ ✅ DONE
8. ~~Search cache headers~~ ✅ DONE

### BUILD NOW (Launch Readiness)
**Infrastructure:**
1. Deploy Redis for distributed rate limiting
2. Refactor presence system (space-specific queries)
3. SSE connection cleanup with timeout
4. Enable scaling feature flags

**Stability:**
5. Session secret hardening
6. Onboarding auto-join transaction safety
7. Error boundaries on critical pages

**User Experience:**
8. Feed "Coming Soon" HIVE-branded design (intentional, not broken)
9. Events placeholder in spaces

**Confidence:**
10. Load test (100 → 500 → 1000 VUs)
11. E2E test suite for core flows

### DO NOT TOUCH
- Rituals (feature-gated, 75% built — launch later)
- Push notifications
- Voice messages
- Marketplace

See `docs/TODO.md` for detailed status.

---

## What is HIVE?

**Student autonomy infrastructure for a world where the old paths are dying.**

| Layer | What It Is |
|-------|------------|
| **Community** | Student-owned Spaces for exploration |
| **Creation** | HiveLab — AI-assisted tool building |
| **Connection** | Real social graph of campus life |
| **Intelligence** | AI that expands thinking, not replaces it |

**Strategy:** Win UB (32,000 students). 400+ spaces pre-seeded. Leader-first GTM.

Full vision: `docs/VISION.md`

---

## Vertical Slices

Each slice owns a complete feature from UI to data. **Stay within slice boundaries.**

### Spaces (96% Complete) ✅
Discord-like community hubs with real-time chat, boards, and sidebar tools.

| Layer | Files |
|-------|-------|
| **Pages** | `apps/web/src/app/spaces/[spaceId]/page.tsx` (1,262 lines) |
| | `apps/web/src/app/spaces/browse/page.tsx` (1,186 lines) |
| | `apps/web/src/app/spaces/create/page.tsx`, `claim/page.tsx` |
| **Components** | `packages/ui/src/atomic/03-Spaces/` (86 files, 27K+ lines) |
| | `packages/ui/src/atomic/03-Chat/` (17 files) |
| **Hooks** | `apps/web/src/hooks/use-chat-messages.ts` (1,185 lines) |
| | `apps/web/src/hooks/use-pinned-messages.ts` |
| **Core** | `packages/core/src/domain/spaces/` (6 entities) |
| | `packages/core/src/application/spaces/space-chat.service.ts` (1,525 lines) |
| **API** | `/api/spaces/*` (66 routes) |

**All P0/P1 blockers resolved** (Dec 31, 2025): Typing throttle (3s), analytics verified, mobile breakpoints fixed

**Scaling:** Grade A- — SSE limit fixed (100/min), memberCount sharding ready, reactions atomic

Full spec: `docs/VERTICAL_SLICE_SPACES.md`

---

### HiveLab (100% Complete) ✅
Visual tool builder — Figma + Cursor for campus tools.

| Layer | Files |
|-------|-------|
| **Pages** | `apps/web/src/app/tools/create/page.tsx` |
| | `apps/web/src/app/tools/[toolId]/page.tsx` |
| | `apps/web/src/app/tools/[toolId]/deploy/page.tsx` |
| **IDE** | `packages/ui/src/components/hivelab/ide/hivelab-ide.tsx` |
| | `packages/ui/src/components/hivelab/ide/element-palette.tsx` |
| | `packages/ui/src/components/hivelab/ide/properties-panel.tsx` |
| **Elements** | `packages/ui/src/lib/hivelab/element-system.ts` |
| | `packages/ui/src/components/hivelab/element-renderers.tsx` |
| **Hooks** | `apps/web/src/hooks/use-tool-runtime.ts` (592 lines) |
| **Core** | `packages/core/src/domain/hivelab/` |
| **API** | `/api/tools/*` (28 routes) |

**27 elements** across 3 tiers: Universal (15), Connected (5), Space (7)

**35 templates** available: 8 system tools + 5 universal layouts + 20 quick templates

**Scaling:** Grade A — Sharded counters, RTDB broadcast built. Enable with feature flags when needed.

Full spec: `docs/VERTICAL_SLICE_HIVELAB.md`

---

### Onboarding (90% Complete) ✅
Landing → OTP Auth → 3-step onboarding → Auto-join first space.

| Layer | Files |
|-------|-------|
| **Pages** | `apps/web/src/app/auth/login/page.tsx` (822 lines) |
| | `apps/web/src/app/onboarding/page.tsx` (342 lines) |
| **Components** | `apps/web/src/components/onboarding/steps/` (7 step components) |
| | `apps/web/src/components/onboarding/hooks/use-onboarding.ts` (580 lines) |
| **Landing** | `apps/web/src/components/landing/landing-page.tsx` |
| **API** | `/api/auth/*` (7 routes), `/api/auth/complete-onboarding` (365 lines) |

**Flow (Phase 6):** OTP → userType → quickProfile → interestsCloud → auto-join (120s target)

Full spec: `docs/VERTICAL_SLICE_ONBOARDING.md`

---

### Profiles (75% Complete) ✅
User identity, connections, privacy, and bento grid layout.

| Layer | Files |
|-------|-------|
| **Pages** | `apps/web/src/app/profile/[id]/ProfilePageContent.tsx` (605 lines) |
| | `apps/web/src/app/profile/edit/page.tsx` (599 lines) |
| **Components** | `packages/ui/src/atomic/04-Profile/` (13 files) |
| | `profile-bento-grid.tsx` (1,233 lines) - 15+ card types |
| **Core** | `packages/core/src/domain/profile/` (11 value objects) |
| | `ghost-mode.service.ts` (370 lines) - Domain logic complete |
| **API** | `/api/profile/*` (18 routes) |

**Working:** Bento grid, privacy settings (4-level), presence system, completion tracking

**Remaining:** Ghost mode UI modal, connections "View All" button

Full spec: `docs/VERTICAL_SLICE_PROFILES.md`

---

### Discovery (80% Complete) ✅
Browse, search, and join spaces with territory-based styling.

| Layer | Files |
|-------|-------|
| **Pages** | `apps/web/src/app/spaces/browse/page.tsx` (1,186 lines) |
| | `territory-config.ts` (113 lines) - Category-specific motion |
| **Components** | `space-discovery-card.tsx` (224 lines) - Warmth-based styling |
| **API** | `/api/spaces/browse-v2` (191 lines) - Cursor pagination + caching |
| | `/api/spaces/search` (266 lines) - Full-text + relevance scoring |
| | `/api/spaces/recommended` (478 lines) - Behavioral psychology algorithm |

**Pre-seeded:** 400+ UB organizations from CampusLabs

**Scaling:** Grade B+ — Edge caching enabled (60s/5m stale)

Full spec: `docs/VERTICAL_SLICE_DISCOVERY.md`

---

### Admin (70% Complete)
Platform control dashboard on port 3001 with 7-tab interface.

| Layer | Files |
|-------|-------|
| **App** | `apps/admin/src/app/dashboard/page.tsx` |
| **Components** | `apps/admin/src/components/` (36 files) |
| | `comprehensive-admin-dashboard.tsx` - Tab orchestrator |
| **API** | `/api/admin/*` (41 routes) - Analytics, users, spaces, moderation |

**Tabs:** Overview, Users, Spaces, Schools, Content Moderation, Builders, Analytics, System

**Scaling:** Grade B — Some stub components, needs pagination on heavy queries

Full spec: `docs/VERTICAL_SLICE_ADMIN.md`

---

### Feed (60% Built - PAUSED) ⏸️
Privacy-enforced feed with moderation. **Showing "Coming Soon" since Dec 16, 2025.**

| Layer | Files |
|-------|-------|
| **Pages** | `apps/web/src/app/feed/page.tsx` (509 lines) |
| **Components** | `packages/ui/src/atomic/02-Feed/` (24 components) |
| **Core** | `packages/core/src/domain/feed/` (EnhancedFeed, FeedRankingService) |
| **API** | `/api/feed/*` (8 routes defined) |

**What's Built:** Full page with virtual scrolling, 8-factor ranking algorithm, post/event/tool/system cards.

**Why Paused:** No aggregation pipeline, privacy not enforced, returns mock data.

---

### Rituals (75% Built - Feature Gated) ⏸️
Gamification layer with 9 archetypes.

| Layer | Files |
|-------|-------|
| **Pages** | `apps/web/src/app/rituals/` (list, detail, layout) |
| **Components** | `packages/ui/src/atomic/06-Rituals/` (21 components) |
| **Core** | `packages/core/src/domain/rituals/` (EnhancedRitual, RitualEngineService) |
| **API** | `/api/rituals/*` (9 routes implemented) |

**Archetypes Ready:** FoundingClass, Survival, Tournament, BetaLottery, LaunchCountdown, UnlockChallenge, Leak, FeatureDrop, RuleInversion

**Why Gated:** Participation scoring incomplete, no admin creation panel, load testing not done.

---

## Component Architecture

### Atomic Design Structure
```
packages/ui/src/atomic/
├── 00-Global/           # Shared baseline (atoms, molecules, organisms)
├── 02-Feed/             # Feed-specific components
├── 03-Chat/             # Chat components (17 files)
├── 03-Spaces/           # Space components (72 files)
├── 04-Profile/          # Profile components
├── 05-HiveLab/          # HiveLab IDE components
├── 06-Rituals/          # Ritual system components
└── 07-Admin/            # Admin dashboard components
```

### When to Use What
| Need | Use |
|------|-----|
| Button, Input, Card, Dialog | `00-Global/atoms/` |
| Avatar Stack, Filter Chips | `00-Global/molecules/` |
| Command Palette, Navigation | `00-Global/organisms/` |
| Space-specific UI | `03-Spaces/` |
| Chat messages, input | `03-Chat/` |
| Profile widgets | `04-Profile/` |
| Tool builder | `packages/ui/src/components/hivelab/` |

### DDD Layers (@hive/core)
```
packages/core/src/
├── domain/              # Entities, value objects, aggregates
│   ├── spaces/          # Space management, chat, boards
│   ├── profile/         # User profiles, connections
│   ├── hivelab/         # Tool composition
│   ├── feed/            # Feed algorithm
│   ├── rituals/         # Ritual system
│   └── shared/          # Cross-cutting concerns
├── application/         # Services, use cases, DTOs
└── infrastructure/      # Repositories, Firebase mappers
```

### API Pattern
```typescript
// Route → Service → Repository
import { getServerSpaceRepository } from '@hive/core/server';
import { toSpaceWithToolsDTO } from '@hive/core/server';

const spaceRepo = getServerSpaceRepository();
const result = await spaceRepo.findById(spaceId, { loadPlacedTools: true });
return respond.success(toSpaceWithToolsDTO(result.getValue()));
```

---

## Design Foundation

**Visual Identity:** 95% grayscale, 5% gold (#FFD700). ChatGPT/Apple/Vercel fusion.

| Rule | Details |
|------|---------|
| **Gold** | CTAs, achievements, presence ONLY. Never focus rings, borders, decoration. |
| **Focus rings** | WHITE (`rgba(255,255,255,0.5)`), never gold |
| **Backgrounds** | #0A0A0A (page) → #141414 (cards) → #1A1A1A (hover) |
| **Text** | #FAFAFA (primary), #A1A1A6 (secondary), #818187 (subtle) |
| **Motion** | 300ms default, 150ms snap, 700ms dramatic (achievements only) |
| **Blur** | 8px standard for glass morphism |

Full specification: `docs/DESIGN_PRINCIPLES.md`
AI guardrail prompt: `docs/LLM_GUARDRAIL.md`

---

## Workspace Structure

```
apps/
  web/              # Next.js 15 app (React 19) - port 3000
  admin/            # Admin panel - port 3001

packages/
  ui/               # Component library (Radix + Tailwind + Framer Motion)
  core/             # Domain models, DDD, business logic
  firebase/         # Firebase SDK wrapper
  auth-logic/       # Authentication state
  hooks/            # Shared React hooks
  tokens/           # Design tokens (colors, typography, motion)
  validation/       # Zod schemas
  moderation/       # Content moderation (Vertex AI)
```

### Tech Stack
- **Runtime:** Node.js 18+, pnpm 9.1.1
- **Framework:** Next.js 15.5.6, React 19
- **Language:** TypeScript 5.9.3 (strict)
- **State:** Zustand
- **Backend:** Firebase (Firestore, Auth, Storage, Realtime DB)
- **UI:** Radix UI + Tailwind CSS + Framer Motion
- **Build:** Turbo, tsup

---

## Build Commands

```bash
# Development
pnpm dev                              # All dev servers (Turbo)
pnpm --filter=@hive/web dev           # Web only (port 3000)
pnpm --filter=@hive/admin dev         # Admin only (port 3001)

# Build
pnpm build                            # Build all
pnpm --filter=@hive/web build         # Web app only

# Quality
pnpm typecheck                        # TypeScript validation
pnpm lint                             # Lint all packages

# Test
pnpm test                             # Run all tests
pnpm test:watch                       # Watch mode

# Storybook
pnpm storybook:dev                    # Start Storybook (port 6006)

# Firebase
firebase emulators:start              # Start emulators
pnpm seed:emulator                    # Seed test data
```

### Firebase Emulators
```
Auth:       localhost:9099
Firestore:  localhost:8080
Storage:    localhost:9199
UI:         localhost:4000
```

---

## API Reference (193 Routes)

### By Domain
| Domain | Routes | Key Endpoints |
|--------|--------|---------------|
| Auth | 17 | `/api/auth/send-code`, `/api/auth/verify-code`, `/api/auth/session` |
| Spaces | 70+ | `/api/spaces/[spaceId]`, `/api/spaces/[spaceId]/chat`, `/api/spaces/browse-v2` |
| Tools | 28 | `/api/tools`, `/api/tools/generate`, `/api/tools/[toolId]/deploy` |
| Profile | 17 | `/api/profile`, `/api/profile/[userId]`, `/api/profile/privacy` |
| Feed | 8 | `/api/feed`, `/api/feed/updates` |
| Admin | 13 | `/api/admin/spaces`, `/api/admin/analytics/comprehensive` |
| Realtime | 10 | `/api/realtime/sse`, `/api/realtime/typing` |

### Core Chat Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/[spaceId]/chat` | GET/POST | Messages |
| `/api/spaces/[spaceId]/chat/stream` | GET | SSE real-time |
| `/api/spaces/[spaceId]/chat/typing` | POST | Typing indicator |
| `/api/spaces/[spaceId]/chat/[messageId]/react` | POST | Reactions |
| `/api/spaces/[spaceId]/chat/[messageId]/pin` | POST | Pin message |

### Core Tool Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools` | GET/POST | List/create tools |
| `/api/tools/generate` | POST | AI generation |
| `/api/tools/[toolId]/deploy` | POST | Deploy to space |
| `/api/tools/[toolId]/state` | GET/POST | Tool state |

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

### Constants
```typescript
export const STATUS_OK = 200;
export const ENDPOINTS = { USERS: '/api/users' };
```

### Firebase
Always use `@hive/firebase` wrapper, never direct imports.

### Validation
All external data validated with Zod from `@hive/validation`.

### Multi-Campus
Every query includes `campusId` filtering:
```typescript
.where("campusId", "==", campusId)
```

Current campus: `ub-buffalo`

---

## Documentation Index

### Core Docs
| Doc | Purpose |
|-----|---------|
| `docs/VISION.md` | **START HERE** — Full vision, student autonomy |
| `docs/DESIGN_PRINCIPLES.md` | Visual identity, tokens, color/motion rules |
| `docs/LLM_GUARDRAIL.md` | AI prompt template to prevent drift |
| `docs/LAUNCH_PLAN.md` | Launch strategy, success criteria |
| `docs/SCALING_READINESS.md` | **SCALING** — Capacity limits, hotspots, fixes |

### Vertical Slice Specs
| Doc | Status | Scaling | What It Covers |
|-----|--------|---------|----------------|
| `docs/VERTICAL_SLICES.md` | Master | — | Overview of all slices |
| `docs/VERTICAL_SLICE_SPACES.md` | 90% | C+ | Chat, boards, sidebar, roles |
| `docs/VERTICAL_SLICE_HIVELAB.md` | 100% ✅ | A | IDE, elements, deployment |
| `docs/VERTICAL_SLICE_ONBOARDING.md` | 90% | A- | Auth, 4-step flow |
| `docs/VERTICAL_SLICE_PROFILES.md` | 70% | A- | Identity, connections |
| `docs/VERTICAL_SLICE_DISCOVERY.md` | 80% | B | Browse, search, join |
| `docs/VERTICAL_SLICE_ADMIN.md` | 70% | B- | Dashboard, moderation |

### Technical Docs
| Doc | Purpose |
|-----|---------|
| `docs/DATABASE_SCHEMA.md` | Firestore collections |
| `docs/FIREBASE_SETUP.md` | Firebase configuration |
| `docs/HIVELAB_SPACES_HANDOFF.md` | Tool deployment architecture |
| `docs/SPACES_HIVELAB_SPEC.md` | Integration spec |
| `docs/SCALING_READINESS.md` | Scaling architecture & fixes |

### Strategy Docs
| Doc | Purpose |
|-----|---------|
| `docs/VALUE.md` | Value proposition, positioning |
| `docs/STRATEGY.md` | Business strategy |
| `docs/PRODUCT_VISION.md` | Product vision |

### Audit Docs
| Doc | Purpose |
|-----|---------|
| `docs/UI_UX_AUDIT.md` | UI/UX audit findings |
| `docs/UI_AUDIT_CLEANUP.md` | Cleanup tasks |
| `docs/UX_AUDIT.md` | UX improvements |
| `docs/LAYOUTS_AND_FLOWS.md` | Layout documentation |
| `docs/TODO.md` | Active todos |

---

## Deployment

Vercel handles deployment.
- Build: `pnpm --filter=@hive/web build`
- Output: `apps/web/.next`
- Security headers: CSP, HSTS configured
