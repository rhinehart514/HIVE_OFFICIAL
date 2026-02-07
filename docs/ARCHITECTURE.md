# Architecture

System architecture for HIVE — a web-first platform for student organizations. Turborepo monorepo, Next.js 15 App Router, Firebase, Vercel.

---

## Monorepo Structure

```
hive-ui/                          # Root (pnpm 9.1.1, Node 20.x, Turborepo)
  apps/
    web/                          # @hive/web — Next.js 15 app (port 3000)
    admin/                        # @hive/admin — Admin dashboard (port 3001)
  packages/
    core/                         # @hive/core — Domain logic, types, DDD services
    ui/                           # @hive/ui — Design system (primitives, components, templates)
    tokens/                       # @hive/tokens — Design tokens (colors, spacing, motion, layout)
    hooks/                        # @hive/hooks — Shared React hooks
    firebase/                     # @hive/firebase — Firebase client SDK setup
    auth-logic/                   # @hive/auth-logic — Auth hook (useAuth), error handlers
    validation/                   # @hive/validation — Zod schemas for API validation
    config/
      eslint/                     # @hive/config-eslint — Shared ESLint config
      typescript/                 # @hive/config-typescript — Shared tsconfig
  infrastructure/
    dataconnect/                  # Firebase Data Connect config
    deploy/                       # Deployment scripts
    docker/                       # Docker configs
    firebase/                     # Firebase project config (rules, indexes)
    kubernetes/                   # K8s manifests
  scripts/                        # Seed scripts, migrations, benchmarks
```

All workspace packages are transpiled by Next.js at build time (no separate compilation step). The `build` script for most packages is `echo 'Transpiled by Next.js'`.

### Package Dependency Graph

```
@hive/web ─────┬── @hive/ui ────── @hive/tokens
               ├── @hive/core ──── @hive/firebase
               ├── @hive/hooks ─── @hive/core
               ├── @hive/auth-logic
               ├── @hive/firebase
               ├── @hive/validation
               └── @hive/tokens

@hive/admin ───┬── @hive/ui
               ├── @hive/core
               ├── @hive/hooks
               ├── @hive/auth-logic
               ├── @hive/firebase
               └── @hive/tokens
```

---

## Authentication Architecture

JWT cookie-based auth. No Firebase client SDK for auth state. No localStorage tokens.

### Session Flow

```
User enters campus email
  → /api/auth/enter sends verification code via SendGrid/Resend
  → User submits code
  → /api/auth/verify checks code against Firebase Auth
  → Server creates signed JWT (HS256) with session data
  → JWT set as httpOnly cookie (hive_session)
  → Client auth state via useAuth() hook → fetches /api/auth/me
```

### Token Strategy

| Token | Cookie | Lifetime | Scope |
|-------|--------|----------|-------|
| Access token | `hive_session` | 15 minutes | Full session data (userId, email, campusId, isAdmin, onboardingCompleted) |
| Refresh token | `hive_refresh` | 7 days | Minimal data (userId, sessionId). Path restricted to `/api/auth` |
| Legacy session | `hive_session` | 30 days | Backward compatibility mode (single token, no refresh) |
| Admin session | `hive_session` | 4 hours | Shorter lifetime + CSRF token embedded in JWT |

Cookie settings: `httpOnly: true`, `secure: true` (production), `sameSite: lax` (access) / `strict` (refresh).

### JWT Payload (SessionData)

```typescript
// apps/web/src/lib/session.ts
interface SessionData {
  userId: string;
  email: string;
  campusId: string;         // Campus isolation key
  isAdmin?: boolean;
  verifiedAt: string;
  sessionId: string;        // For session revocation
  csrf?: string;            // CSRF token (admin sessions only)
  onboardingCompleted?: boolean;
  tokenType?: 'access' | 'refresh';
}
```

Signing: `HS256` via `jose` library. Secret from `SESSION_SECRET` env var (min 32 chars in production). Development auto-generates a random secret per server start.

### Edge Middleware (`apps/web/src/middleware.ts`)

Runs on every request. Responsibilities:

1. **API routes** — Rate limiting only (auth handled by route-level middleware)
   - Global: 300 req/min
   - Sensitive endpoints (`/api/auth/`, `/api/admin/`, `/api/tools/generate`): 30 req/min
2. **Page routes** — Authentication + authorization
   - Public routes: `/`, `/enter`, `/about`, `/legal`, `/login`, `/schools`
   - Unauthenticated visitors redirected to `/` with `?redirect=` param
   - Unfinished onboarding redirected to `/enter?state=identity`
   - Admin routes require `isAdmin` flag in JWT
3. **Route redirects** — Permanent (301) redirects for legacy/alias routes
   - `/browse` -> `/spaces`, `/build` -> `/lab/create`, `/you` -> `/me`, etc.
   - `/spaces/join/:code` -> `/spaces?join=:code` (modals replaced pages)

Lightweight JWT verification at edge (checks structure + expiry). Full verification in API route middleware.

### Route-Level Auth (`apps/web/src/lib/middleware/`)

All API routes use middleware wrappers that compose: auth + CSRF + rate limiting + error handling + response formatting.

```typescript
// Most common pattern — auth + validation + rate limiting
export const POST = withAuthValidationAndErrors(
  createSpaceSchema,                    // Zod schema
  async (request, context, body, respond) => {
    const userId = getUserId(request);  // From JWT
    const campusId = getCampusId(request); // From JWT — never from client
    // ... handler logic
    return respond.success({ data });
  }
);
```

**Middleware wrappers:**

| Wrapper | Auth | CSRF | Rate Limit | Use Case |
|---------|------|------|------------|----------|
| `withAuthAndErrors` | JWT required | Auto for POST/PUT/PATCH/DELETE | 100/min | Most protected routes |
| `withAuthValidationAndErrors` | JWT required | Auto | 100/min | Protected + Zod body validation |
| `withAdminAuthAndErrors` | Admin JWT required | Always | 50/min | Admin operations |
| `withAdminPermission` | Admin + RBAC check | Always | 50/min | Permission-gated admin ops |
| `withErrors` | None | None | 200/min | Public routes |
| `withOptionalAuth` | Optional JWT | None | 200/min | Mixed public/auth routes |

**Rate limit presets:** `standard` (100/min), `strict` (10/min), `auth` (5/min), `ai` (5/min), `search` (30/min), `public` (200/min), `admin` (50/min).

### Client Auth Hook (`@hive/auth-logic`)

```typescript
import { useAuth } from '@hive/auth-logic';

const { user, loading, error } = useAuth();
// user.uid, user.email, user.campusId, user.handle, user.isAdmin, etc.
```

Fetches from `/api/auth/me` which reads the httpOnly cookie. Features:
- Proactive token refresh (2 min before expiry)
- Cross-tab synchronization via localStorage events
- Visibility-aware refresh (refreshes when tab becomes visible)
- No Firebase client SDK dependency for auth state

---

## API Architecture

All API routes live under `apps/web/src/app/api/`. 40+ route groups:

```
api/
  auth/           activity/       activity-feed/   admin/
  analytics/      automations/    calendar/        campus/
  comments/       connections/    content/         cron/
  dm/             elements/       errors/          events/
  feature-flags/  feed/           feedback/        friends/
  health/         internal/       notifications/   onboarding/
  placements/     posts/          privacy/         profile/
  profile-v2/     rituals/        schools/         search/
  setups/         social/         spaces/          stats/
  templates/      tools/          users/           waitlist/
```

### Security Invariants

Every API route enforces:

1. **Campus isolation** — `campusId` extracted from JWT session, never accepted from client input. All Firestore queries filter by `campusId`.
2. **Input validation** — Zod schemas on all request bodies. XSS scanning via `SecurityScanner` on user-generated content.
3. **CSRF protection** — Origin/referer header validation on state-changing methods (POST/PUT/PATCH/DELETE) in production.
4. **Rate limiting** — Per-user (or per-IP for unauthenticated) rate limits on all routes.

### Response Format

```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: { message: string, code: string } }
```

Standard error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `PERMISSION_DENIED`, `RATE_LIMIT`, `CONFLICT`, `INTERNAL_ERROR`, `FORBIDDEN`, `CSRF_VALIDATION_FAILED`.

---

## Data Layer

Firebase Firestore with Admin SDK on the server. Client SDK for real-time subscriptions.

### Server-Side (`apps/web/src/lib/firebase-admin.ts`)

Uses `firebase-admin` SDK. All server queries go through this. Campus isolation enforced via `addSecureCampusMetadata()` helper that stamps `campusId` on every document write.

### Client-Side (`@hive/firebase`)

`packages/firebase/src/index.ts` initializes the Firebase client SDK (Auth, Firestore, Storage, Analytics, AI). Exports `app`, `auth`, `db`, `storage`, `analytics`, `ai`.

Configuration: Firestore with 50MB IndexedDB cache, offline persistence enabled, WebSocket transport.

Emulator support: Set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` to connect to local Auth (9099), Firestore (8080), Storage (9199) emulators.

### Domain Architecture (`@hive/core`)

DDD-structured domain logic in `packages/core/src/domain/`:

```
domain/
  analytics/      # Analytics aggregation
  campus/         # Campus entities
  creation/       # Tool/element creation (HiveLab)
  feed/           # Feed ranking, curation
  hivelab/        # HiveLab/Goose AI system
  identity/       # User identity
  profile/        # Profile entities, ghost mode, value objects
  rituals/        # Recurring activities
  shared/         # Shared value objects (Result, ViewerContext)
  spaces/         # Space entities, categories, management
  webhooks/       # Webhook processing
```

Exported via path aliases:
- `@hive/core` — Main types, templates, feature flags
- `@hive/core/domain` — Domain entities and value objects
- `@hive/core/server` — Server-only services (DDD repositories)
- `@hive/core/application` — Application services
- `@hive/core/infrastructure` — Infrastructure adapters

---

## Design System

Four layers, bottom to top.

### Layer 1: Tokens (`@hive/tokens`)

Design tokens as TypeScript constants. Exported as JS objects + CSS custom properties.

```
packages/tokens/src/
  design-system-v2.ts    # Scale, spacing, radius, typography, animation, shadows, breakpoints, zIndex
  colors-unified.ts      # Foundation, semantic, component color tokens
  monochrome.ts          # 99% grayscale palette + gold reward color, warmth spectrum
  motion.ts              # Spring presets, easing, durations, micro-interaction variants
  layout.ts              # Max widths, breakpoints, touch targets, shells, chat spacing
  patterns.ts            # Glass, card, input, button, badge, focus, elevation, modal, toast
  spaces.ts              # Space-specific layout, colors, typography, motion tokens
  ide.ts                 # HiveLab IDE-specific tokens (surfaces, borders, text, status)
  css-generator.ts       # Generates CSS custom properties from token objects
  tailwind-config-unified.ts  # Extends Tailwind config with token values
```

CSS variables generated and loaded via `packages/ui/src/design-system/tokens.css`.

Tailwind integration: `hiveTailwindConfig` extends Tailwind with all token values (colors, spacing, radii, typography, animations).

### Layer 2: Primitives (`packages/ui/src/design-system/primitives/`)

Unstyled, composable building blocks. Built on Radix UI primitives.

```
Avatar, AvatarGroup, Badge, Button, Card, Checkbox, DisplayText, Heading,
Icon, Input, Label, Link, Modal, Mono, Progress, Radio, Select, Separator,
Skeleton, Switch, Tabs, Text, Textarea, Toast, Tooltip, ...
```

Plus specialized primitives: `PresenceDot`, `LiveCounter`, `CanvasArea`, `HandleDot`, `ActivityEdge`, `WarmthDots`, `CategoryScroller`, `TemplateScroller`.

Sub-directories: `feedback/`, `input/`, `landing/`, `layout/`, `motion/`.

### Layer 3: Components (`packages/ui/src/design-system/components/`)

Composed, styled components built from primitives + tokens.

Major component groups:
- **Cards**: SpaceCard, EventCard, ProfileCard (5 variants), ToolCard, StatCard, FileCard
- **Chat**: ChatMessage, MessageGroup, ChatComposer, ThreadDrawer, ReactionPicker, ReactionBadge
- **Navigation**: TopNavBar, CommandBar, CommandPalette, TopBar, TabNav, Breadcrumb
- **Forms**: FormField, SearchInput, DatePicker, TagInput, ImageUploader, MentionAutocomplete, NumberInput, Combobox
- **Data**: DataTable, EventCalendar, Pagination
- **Feedback**: EmptyState, ErrorState, LoadingOverlay, NotificationBanner, ConfirmDialog
- **Overlays**: Drawer, Sheet, Dialog, Popover, HoverCard, Accordion, Collapsible
- **Spaces**: SpaceHub, ModeCard (Chat/Events/Tools/Members), TheaterChatBoard, modals (AddTab, MemberInvite, EventCreate, etc.)
- **Profile**: 3-Zone layout (IdentityHero, ActivityCard, LeadershipCard, EventCard, ConnectionFooter) + legacy Bento layout
- **HiveLab**: IDEButton, IDEInput, IDEPanel

Sub-directories: `campus/`, `hivelab/`, `mobile/`, `moderation/`, `profile/`, `spaces/`.

### Layer 4: Patterns & Templates

**Patterns** (`packages/ui/src/design-system/patterns/`): Layout compositions.
- `FormLayout`, `GridLayout`, `ListLayout`, `SplitView`

**Templates** (`packages/ui/src/design-system/templates/`): Full page shells.
- `AppShell`, `SpaceShell`, `PageTransition`

### Atmosphere System

Context-aware theming via `AtmosphereProvider`. Components adapt based on atmosphere level (warmth, density). Monochrome palette (99% grayscale) with gold as the reward/accent color.

### Imports

```typescript
import { Button, Card } from '@hive/ui/design-system/primitives';
import { SpaceCard, ChatMessage } from '@hive/ui/design-system/components';
import { AppShell } from '@hive/ui/design-system/templates';
import { MONOCHROME, MOTION, GLASS } from '@hive/tokens';
```

---

## Routing Architecture

Next.js 15 App Router. File-based routing under `apps/web/src/app/`.

### Page Routes

```
/                     Landing page (public)
/enter                Entry/auth flow (public)
/about                Marketing page (public)
/legal/*              Legal pages (public)
/login                Login (public)
/schools              School selection (public)
/spaces               Space browser (authenticated)
/s/[handle]           Individual space view
/explore              Discovery (tabs: spaces, people, events)
/feed                 Activity feed
/me                   User profile
/me/calendar          Personal calendar
/me/notifications     Notifications
/me/settings          Settings
/u/[handle]           Public user profile
/lab                  HiveLab (tool creation)
/lab/create           Create new tool
/hivelab              HiveLab IDE
/rituals              Recurring activities
/profile/[userId]     Profile by ID
/elements             Elements browser
/resources            Resources
/admin                Admin dashboard (admin only)
```

### Redirects

Defined in two places:

1. **Edge middleware** (`apps/web/src/middleware.ts`) — Runtime redirects for route aliases and legacy URLs. 301 permanent redirects.
2. **next.config.mjs** — Build-time redirects for legacy auth routes (`/auth/login` -> `/enter`), renamed features (`/tools` -> `/lab`, `/hivelab` -> `/lab`), and relocated pages (`/calendar` -> `/me/calendar`).

---

## Build & Deploy

### Build Pipeline

```bash
pnpm dev                         # Start all apps + packages in dev mode
pnpm --filter=@hive/web dev      # Web app only
pnpm build                       # Build all (Turborepo, 15 concurrent tasks)
pnpm typecheck                   # TypeScript check all packages
pnpm test                        # Run tests (Vitest for unit, Playwright for e2e)
pnpm storybook:dev               # Storybook on port 6006
```

Turborepo config: `build` depends on `^build` (packages build before apps). Typecheck depends on `^build`. Outputs cached: `.next/**`, `dist/**`, `storybook-static/**`.

### Testing

- **Unit tests**: Vitest (`apps/web/src/**/*.test.ts`, `packages/core/src/**/*.test.ts`)
- **E2E tests**: Playwright (`apps/web/e2e/`)
- **Audit tests**: Playwright projects for smoke, API health, core journeys, visual capture
- **Stress tests**: Playwright stress project
- **Storybook**: Component stories throughout `packages/ui/`

### Deployment

- **Platform**: Vercel
- **Apps**: `apps/web` deploys as the primary site. `apps/admin` on port 3001.
- **Framework**: Next.js 15 with React Compiler enabled (`experimental.reactCompiler: true`)
- **Build optimization**: `optimizePackageImports` for all `@hive/*` packages. Bundle analyzer available via `pnpm --filter=@hive/web build:analyze`.
- **Image optimization**: Remote patterns for `dicebear.com`, `storage.googleapis.com`, `firebasestorage.googleapis.com`.

### Environment Variables

**Required in production:**
- `SESSION_SECRET` (min 32 chars) — JWT signing key
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config (6 vars)
- Firebase Admin credentials (service account)

**Optional:**
- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` — Enable local emulators
- `ADMIN_JWT_SECRET` — Separate secret for admin sessions
- `ANALYZE` — Enable bundle analyzer

---

## Key Libraries

| Library | Version | Usage |
|---------|---------|-------|
| Next.js | 15.5.9 | App Router, React Server Components |
| React | 19 | UI framework (with React Compiler) |
| Firebase | 11.x client, 13.x admin | Auth, Firestore, Storage, Analytics, AI (Gemini) |
| jose | 5.10.0 | JWT signing/verification (HS256) |
| Zod | 3.24.x | Schema validation on all API inputs |
| Framer Motion | 11.x | Animation and motion |
| Radix UI | Various | Accessible unstyled primitives |
| TanStack React Query | 5.x | Server state management, caching |
| Tailwind CSS | 3.4.x | Utility-first CSS |
| class-variance-authority | 0.7.x | Component variant styling |
| Zustand | 5.x | Client state management |
| Storybook | 8.4.x | Component development and documentation |
| Vitest | 2.x | Unit testing |
| Playwright | 1.57.x | E2E and audit testing |
| Recharts | 2.x / 3.x | Charts (admin dashboard) |
| SendGrid / Resend | Latest | Email delivery |
