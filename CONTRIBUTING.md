# Contributing to HIVE

Internal development guide for the HIVE team.

## Branch Strategy

```
main              # Production-ready code
feature/*         # New features (feature/add-dark-mode)
fix/*             # Bug fixes (fix/login-redirect)
chore/*           # Maintenance (chore/update-deps)
```

## Commit Convention

Use conventional commits:

```
feat: Add dark mode toggle
fix: Resolve login redirect loop
refactor: Simplify auth middleware
chore: Update dependencies
docs: Add API documentation
test: Add profile hook tests
```

## PR Process

1. Branch from `main`
2. Make changes
3. Run quality gate: `pnpm build && pnpm typecheck`
4. Create PR with description of changes
5. Address review feedback
6. Squash merge to `main`

## File Organization

### Pages (`apps/web/src/app/`)
```
app/
├── (routes)/           # Route groups
│   └── [page]/
│       ├── page.tsx    # Page component (RSC)
│       └── components/ # Page-specific components
└── api/                # API routes
```

### Components (`packages/ui/`)
```
ui/src/
├── primitives/         # Base components (Button, Input)
└── components/         # Composed components (Card, Modal)
```

### Domain Logic (`packages/core/`)
```
core/src/
├── domain/             # Entity definitions
├── services/           # Business logic
└── repositories/       # Data access
```

### API Routes (`apps/web/src/app/api/`)
```
api/
└── [resource]/
    ├── route.ts        # Collection endpoints (GET, POST)
    └── [id]/
        └── route.ts    # Item endpoints (GET, PATCH, DELETE)
```

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions for AI assistants |
| `docs/CURRENT_STATE.md` | Current platform state by vertical |
| `docs/DATABASE_SCHEMA.md` | Firestore schema reference |

## Common Tasks

### Add a new page
1. Create route in `apps/web/src/app/(routes)/`
2. Add page-specific components in `components/` subfolder
3. Add API routes if needed

### Add a new component
1. Check if primitive exists in `packages/ui/src/primitives/`
2. If composing, add to `packages/ui/src/components/`
3. Export from package index

### Add an API endpoint
1. Create route in `apps/web/src/app/api/`
2. Define Zod schema in `packages/validation/`
3. Validate all inputs at boundary

## Quality Gate

Before every PR:

```bash
pnpm build && pnpm typecheck
```

Both must pass. No exceptions.
