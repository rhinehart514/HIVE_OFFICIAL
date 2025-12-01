# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
pnpm dev                              # Run all dev servers via Turbo
pnpm --filter=@hive/web dev           # Web app only (port 3000)
pnpm --filter=@hive/admin dev         # Admin app only (port 3001)

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

## Implementation Roadmap

**Reference:** `docs/architecture/IMPLEMENTATION_ROADMAP.md`

### Implementation Order (Follow This Sequence)

```
PHASE 1: Security & Data (P0)
├── Auth hardening (remove dev password, fix admin auth)
└── Onboarding data loss fix (save before redirect)

PHASE 2: Identity & Isolation
├── Profiles (integrate EnhancedProfile, fix handle cleanup)
└── Campus (fix CURRENT_CAMPUS_ID, runtime context)

PHASE 3: Core Experience
├── Spaces (unify permission model, enforce slugs)
└── Feed (implement ranking algorithm - currently stub)

PHASE 4: Infrastructure
├── Real-time (fix SSE null broadcast)
└── Notifications (implement generation triggers)

PHASE 5: Discovery
└── Search (replace mock data with real queries)

PHASE 6: Engagement
├── Social/Connections (fix hardcoded campus)
└── Events/Calendar (creation UI)

PHASE 7: Power Features
├── Tools/HiveLab (real execution handlers)
└── Rituals (CRUD APIs, participation tracking)

PHASE 8: Operations
├── Admin (complete audit logging)
├── Moderation (enforce isHidden in queries)
└── Privacy (enforce all settings)
```

### Platform Readiness (Current State)

| Tier | Slices | Ready | Critical Issues |
|------|--------|-------|-----------------|
| Core | Auth, Onboarding, Profile, Spaces, Feed | 50% | Data loss, feed stub |
| Engagement | Tools, Rituals, Calendar, Social, Notifications | 25% | AI mock, no generation |
| Infrastructure | Real-time, Search, Privacy, Admin, Moderation | 20% | SSE broken, search mock |

### Critical Files for Each Slice

**Auth:**
- `apps/web/src/app/api/auth/send-magic-link/route.ts`
- `apps/web/src/app/auth/login/page.tsx` (has dev password hint)

**Onboarding:**
- `apps/web/src/components/onboarding/hooks/use-onboarding.ts` (data loss here)
- `apps/web/src/components/onboarding/steps/leader-step.tsx`

**Feed:**
- `apps/web/src/app/api/feed/route.ts` (chronological only - needs algorithm)
- `apps/web/src/app/api/feed/algorithm/route.ts` (exists but not called)

**Real-time:**
- `apps/web/src/lib/sse-realtime-service.ts` (broadcasts with null controller)

**Search:**
- `apps/web/src/app/api/search/route.ts` (returns hardcoded mock data)

---

## Vertical Slice Architecture

**Reference:** `docs/architecture/VERTICAL_SLICE_AUDIT.md`

### 22 Vertical Slices

**Core Journey:** Auth, Onboarding, Profiles, Spaces, Feed
**Engagement:** Tools/HiveLab, Rituals, Calendar/Events, Notifications, Social/Connections
**Infrastructure:** Real-time, Search, Privacy, Admin, Moderation, Campus/Schools
**Minor:** Feature Flags, Error Reporting, Feedback, Waitlist, Health/Cron

### Known Broken Features (P0 Fixes Required)

| Feature | Issue | File |
|---------|-------|------|
| SSE Broadcast | Passes `null` controller | `lib/sse-realtime-service.ts` |
| Search | Returns mock data | `api/search/route.ts` |
| Feed Algorithm | Chronological only | `api/feed/route.ts` |
| Onboarding | Non-leaders lose data | `hooks/use-onboarding.ts` |
| Privacy | Settings not enforced | All query files |
| Moderation | isHidden not filtered | All query files |

### DDD Models (Exist but Not Integrated)

```typescript
// These exist in @hive/core but APIs use raw Firestore:
import { EnhancedProfile } from '@hive/core';  // packages/core/src/domain/profile/
import { EnhancedSpace } from '@hive/core';    // packages/core/src/domain/spaces/
import { EnhancedRitual } from '@hive/core';   // packages/core/src/domain/rituals/
```

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
