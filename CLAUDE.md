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
