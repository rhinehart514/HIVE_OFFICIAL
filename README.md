# HIVE

Student autonomy infrastructure for the AI era.

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9.1.1+
- Firebase CLI (for local emulators)

### Development
```bash
pnpm install
pnpm dev                      # All servers (web:3000, admin:3001)
pnpm --filter=@hive/web dev   # Web only
```

### Quality Gate
```bash
pnpm build && pnpm typecheck  # Must pass before PR
```

## Architecture

```
apps/
├── web/        # Next.js 15 App Router - Main student app
└── admin/      # Admin dashboard (port 3001)

packages/
├── ui/         # Design system (93 primitives, 138 components)
├── core/       # DDD domain logic
├── hooks/      # React hooks
├── validation/ # Zod schemas
└── tokens/     # Design tokens
```

## Key Documentation

| Purpose | File |
|---------|------|
| Product vision | `docs/VISION.md` |
| Strategy | `docs/STRATEGY.md` |
| Current state | `docs/CURRENT_STATE.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| ERD | `docs/ERD.md` |
| Design system | `docs/design-system/INDEX.md` |
| Project config | `CLAUDE.md` |

## Tech Stack

- **Frontend:** Next.js 15, React Server Components
- **State:** TanStack Query, Zustand
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth with OTP
- **Styling:** Tailwind CSS with design tokens
- **Validation:** Zod at all boundaries

## Internal Team

See `CONTRIBUTING.md` for development workflow.
