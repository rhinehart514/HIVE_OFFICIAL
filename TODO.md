# HIVE TODO

**Updated:** 2026-02-05
**Build:** `pnpm --filter=@hive/web build` (full monorepo may timeout)
**Stack:** Next.js 15 · React 19 · Firebase · TypeScript · Vercel

---

## Decision Log

Architectural choices made. Not up for debate unless context changes.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-04 | Real-time uses Firebase listeners + SSE, not WebSocket | Simpler architecture, Firebase already deployed, SSE good enough for notifications. |
| 2026-02-04 | HiveLab automations stored but not executed | Data layer ready, execution engine deferred to post-launch. |
| 2026-02-04 | Entry flow is multi-phase state machine | Gate → Naming → Field → Crossing. Single URL `/enter`, client-side state, no navigation jumps. |
| 2026-02-05 | Canonical profile URL: `/u/[handle]` | Kill `/user/[handle]` and `/profile/[id]`. Single source of truth for routing. |
| 2026-02-05 | Single Profile type source: `packages/core` | Domain type is canonical. App types extend it. No parallel definitions. |
| 2026-02-05 | Handle validation: 20 char max, alphanumeric + underscore | No periods, no special chars. Most restrictive regime wins. |
| 2026-02-05 | Avatar field: `avatarUrl` canonical | Kill `photoURL` and `profileImageUrl`. Single field name across codebase. |
| 2026-02-05 | Three shells exist, only AppShell is active | UniversalShell (built, unused) and CampusShell (incomplete) need cleanup. Consolidate to one. |

---

## Feature Flags

Runtime toggles for incomplete features. Check `use-feature-flags.ts` before using.

| Flag | Status | Notes |
|------|--------|-------|
| `dmsEnabled` | OFF | DM infrastructure complete, UI not ready |
| `notificationsEnabled` | OFF | SSE + data layer ready, push delivery not implemented |
| `alumniEnabled` | OFF | Alumni waitlist functional, campus verification incomplete |
| `ghost_mode` | OFF | Privacy enforcement incomplete, defer to post-launch |
| `handle_change` | OFF | Backend ready, no UI for handle editing |

---

## P0 — Pre-Launch Blockers

### Security

- [ ] **Fix cron endpoint auth bypass** — `if (CRON_SECRET && authHeader !== ...)` allows anyone when env var unset. Change to `if (!CRON_SECRET || authHeader !== ...)`. One-line fix in 3 files: `api/cron/automations/route.ts:32`, `cron/setup-orchestration/route.ts:31`, `cron/tool-automations/route.ts:30`
- [ ] **Fix cross-campus permission gap** — `checkSpacePermission()` in `lib/space-permission-middleware.ts:95-295` does not validate campusId. Add `userCampusId` param and compare against `space.campusId`.
- [ ] **Remove admin JWT dev fallback secret** — `lib/middleware/auth.ts:15-17` falls back to `'dev-only-secret-do-not-use-in-production'` when `ADMIN_JWT_SECRET` unset.
- [ ] **Fix `new Function()` sandbox escape** — `lib/tool-execution-runtime.ts:223` uses `new Function()` for tool code execution. CVSS 9.0. Replace with `vm2` or WebAssembly sandbox.
- [ ] **Reset rate limit constant** — `MAX_CODES_PER_EMAIL_PER_HOUR = 10` has comment "Temporarily increased for testing". Reset to 3-5.
- [ ] **Remove hardcoded admin password** — `scripts/add-admin.ts` contains plaintext credentials (`Flynn123`). Delete or rotate.
- [ ] **Add rate limiting to refresh token endpoint** — `api/auth/refresh/route.ts` has no rate limiting.
- [ ] **Fix refresh token rotation** — `api/auth/refresh/route.ts` creates new token pair but never revokes old refresh token.
- [ ] **Fix session ownership verification** — `api/auth/sessions/[sessionId]/route.ts` DELETE handler doesn't verify session belongs to requesting user.
- [ ] **Remove deprecated session endpoint** — `api/auth/session/route.ts` is deprecated but still live with zero validation. Delete file.
- [ ] **Fix ghost mode presence leak** — `hooks/use-presence.ts` exposes online status regardless of ghost mode settings.
- [ ] **Enforce DM preferences** — `allowDirectMessages` preference exists but not enforced on DM creation routes.

### Data Integrity

- [ ] **Fix hardcoded schoolId in entry** — `components/entry/hooks/useEntry.ts:139` hardcodes `schoolId: 'ub-buffalo'`.
- [ ] **Fix wrong schoolId in code verification** — `components/entry/hooks/useEntry.ts:504` sends incorrect schoolId to `verifyCode()`.
- [ ] **Fix all profile URLs to `/u/[handle]`** — 3 conflicting patterns coexist. Fix in: explore/page.tsx (`/profile/${id}`), search/route.ts (`/user/${handle}`), notification-service.ts (11 dead `/spaces/` paths + `/user/` paths). Delete legacy `/profile/[id]/` route tree.
- [ ] **Fix account deletion** — `api/profile/delete/route.ts:165` queries `spaceMemberships` but actual collection is `spaceMembers`. Also missing cascade deletions: `users` doc, `handles`, `notifications`, `connections`, `spaceJoinRequests`, `chatMessages`, `calendarTokens`, `verification_codes`, `activityEvents`, `tools`.

### Mobile

- [ ] **Add viewport-fit for iOS notch** — `app/layout.tsx` missing `viewport-fit: 'cover'`.
- [ ] **Fix OTP input overflow on small screens** — `packages/ui/.../OTPInput.tsx` requires 314px but only 312px available on 360px screens.
- [ ] **Define pb-safe utility** — `pb-safe` class used throughout but not defined in Tailwind config.

### Compliance

- [ ] **Add terms/privacy acceptance to entry flow** — No consent proof stored. Add checkbox + timestamps.
- [ ] **Remove automatic Gravatar fetch** — `api/auth/complete-entry/route.ts` sends email MD5 hash without user consent.

### Integration

- [ ] **Verify `DEV_AUTH_BYPASS` is disabled in production** — no dev credentials in prod.

---

## P1 — Ship With Confidence

### Security

- [ ] **Require auth for search API** — `api/search/route.ts` falls back to `getDefaultCampusId()` for unauthenticated users.
- [ ] **Add campusId filter to collectionGroup queries** — `api/spaces/activity/recent/route.ts:171` and `api/tools/[toolId]/route.ts:268` can return cross-campus data.
- [ ] **Fix access whitelist fail-open** — `api/auth/send-code/route.ts:169` returns `true` on error.
- [ ] **Fix join request race condition** — `join-request/route.ts:111-141` check-then-create without transaction.
- [ ] **Add chat message idempotency keys** — `.add()` creates duplicates on double-click. Use client-generated `messageId` with `.set()`.
- [ ] **Add timeouts to all Firestore operations** — zero timeout protection. Add 8s default with AbortController.
- [ ] Migrate `join-request` GET/DELETE and `join-requests` GET to `withAuthAndErrors`
- [ ] Add Zod to 4 POST routes — `feedback`, `waitlist/join`, `waitlist/launch`, `friends`
- [ ] Fix session revocation gap — `MAX_REVOCATION_AGE` (8 days) < session max (30 days)
- [ ] **Upgrade `next` from 15.5.9 to >=15.5.10** — 2 CVEs
- [ ] **Add `pnpm.overrides`** for patched transitives: `node-forge>=1.3.2`, `jws@4>=4.0.1`, `lodash>=4.17.23`
- [ ] Implement CSRF for form-encoded POST — `extractToken()` has comment-only, no implementation
- [ ] **Guard console.log in session.ts:57** — logs session secret info in production
- [ ] Add campusId filter to dashboard space query — `api/profile/dashboard/route.ts:182-187`

### Entry

- [ ] **Update graduation years** — `FieldScreen.tsx` includes 2025 (in the past). Update to 2026-2029.
- [ ] **Fix POPULAR_MAJORS mismatch** — "Engineering" in POPULAR_MAJORS but not in ALL_MAJORS.
- [ ] **Differentiate phase transitions** — identical transition config for all 4 entry phases.
- [ ] **Wire confetti on completion** — `ConfettiBurst` exists but never fires.
- [ ] **Delete dead entry files** — ~15 orphaned files in `components/entry/`

### Profile

- [ ] **Wire badges** — `ProfilePageContent.tsx` never passes `badges` prop to ProfileIdentityHero.
- [ ] **Fix Edit Profile link** — navigates to legacy route. Should go to `/me/settings`.
- [ ] **Consolidate profile API calls** — 8 parallel requests on load. Merge into 1-2 endpoints.
- [ ] **Display pronouns** — data exists, never rendered in UI.

### Settings

- [ ] **Fix account settings persistence** — account section changes NEVER SAVED. No PUT/PATCH wired.
- [ ] **Add bio character counter** — backend limits to 500, UI gives no feedback.
- [ ] **Add dirty-state warning** — navigation away with unsaved changes = silent data loss.
- [ ] **Unify persistence patterns** — 3 different save patterns across 4 sections.

### Handle

- [ ] **Fix handle length divergence** — client validates max 20 chars, server allows 30.
- [ ] **Fix handle period validation** — periods allowed server-side, blocked client-side.
- [ ] **Expand reserved handle list** — missing platform routes: explore, home, lab, me, settings, api.
- [ ] **Fix handle check endpoint** — `useDramaticHandleCheck` points to wrong API endpoint.
- [ ] **Add handle change UI** — backend support exists, no frontend.

### Integration

- [ ] **Fix chat avatars** — `chat-messages.tsx:207-209` only renders AvatarFallback, never AvatarImage.
- [ ] **Add tool creator attribution** — `ToolCard.tsx` shows zero creator info.
- [ ] **Fix notification badge color** — TopBar badge uses RED (#EF4444), should be GOLD (#FFD700).
- [ ] **Uncomment notification trigger** — `api/tools/updates/route.ts:898` has commented-out `createNotification()`.
- [ ] **Add missing Firestore composite indexes** — need indexes for: posts (spaceId+createdAt), events (campusId+startTime), spaceMembers (spaceId+joinedAt), tools (campusId+status).
- [ ] **Fix user search N+1** — `api/users/search` calculates mutual spaces per-user.
- [ ] **Fix ghost space claim notification** — waitlist join works but no notification fires.

### Reliability

- [ ] Add retry logic to `deliverNotification()` — 3-attempt exponential backoff.
- [ ] Wire unread count real-time sync — `useTotalUnreadCount()` hardcoded to 0.
- [ ] Add Content Security Policy headers — only configured for `/admin/`.
- [ ] **Add cookie consent banner** — required for GDPR.
- [ ] **Remove or implement auto-delete activity toggle** — settings UI toggle is theater with no backend.
- [ ] **Add idempotency keys to posts + comments** — `.add()` = double-click duplicates.
- [ ] **Complete data export** — misses chat messages, authored posts, notifications, tools. GDPR Article 20.
- [ ] Add verification_codes TTL/cleanup — docs never deleted, collection grows unbounded.

---

## P2 — Core Experience

- [ ] Settings missing fields — pronouns, social links, cover photo, device management
- [ ] Mobile triple breakpoint mismatch — tokens vs Tailwind vs hooks
- [ ] Mobile touch target violations — 12+ items under 44px
- [ ] Mobile profile page bottom padding — BottomNav overlap
- [ ] Build thread panel UI for Spaces
- [ ] Non-member space preview + social proof — blurred content, join CTA
- [ ] Offline message queue + retry — failed sends disappear silently
- [ ] Consolidate Home API calls — 3 fetches into 1 endpoint
- [ ] Shared feed card library — extract SpaceCard, EventCard, ActivityCard into `packages/ui`
- [ ] Add search history
- [ ] Add faceted search filters
- [ ] Time-grouped activity on home
- [ ] "All quiet" empty state for home
- [ ] Add notification badge to BottomNav home icon
- [ ] Notification bell wiggle animation
- [ ] Keyboard navigation in notification popover
- [ ] Add "did you mean" suggestions to search
- [ ] Unify space type shapes — SpaceCardData vs SpaceData vs SpaceWithMetadata
- [ ] Consolidate AppShell + UniversalShell + CampusShell into one
- [ ] Wire cross-tab unread sync via BroadcastChannel
- [ ] Cache unread counts — event-driven invalidation, not recompute on fetch

---

## P3 — Growth & Retention

- [ ] Profile completion rate tracking — target 80%+ within 7 days
- [ ] Identity verification badges — campus email auto, org leader manual, early adopter auto
- [ ] Profile belonging graph — shared spaces between users
- [ ] Entry flow analytics — phase-by-phase timing, drop-off, handle collisions
- [ ] Progressive profiling — bio prompt at +3 days, connection suggestions after first interaction
- [ ] Conversion funnel analytics
- [ ] Real trending calculation — activity velocity instead of member count
- [ ] Full-text search — upgrade from `.includes()` to Algolia or Firestore text search
- [ ] Recommendation caching — store per user, stop recomputing
- [ ] Real-time unread badge on Home — wire SSE
- [ ] Email digest service — batch per user, respect quiet hours
- [ ] Complete ghost mode — real-time privacy violation detection
- [ ] Connection feed/discovery
- [ ] Space analytics dashboard — API exists, add chart rendering

---

## P4 — HiveLab Completion

- [ ] Wire automation execution engine — triggers never fire, need scheduler
- [ ] Execute connection cascades on element state change
- [ ] Build AI element generation — Claude API, name in → full element out
- [ ] Wire `notifyAffectedUsers()` — space members don't get notified on tool updates
- [ ] Implement template versioning — lock deployed templates at creation version
- [ ] Build community trust workflow — verification form, reviewer dashboard
- [ ] Build community reviews UI — API routes exist, no frontend

---

## P5 — Performance & Infrastructure

### High Impact / Low Effort

- [ ] Profile type unification — 6 competing definitions → 1 canonical source
- [ ] Avatar field consolidation — 3 names → 1 canonical `avatarUrl`
- [ ] Denormalize RSVP counts onto event docs — N individual reads per dashboard load
- [ ] Parallelize space page API calls — `use-space-residence-state.ts` makes 5 serial calls. Use `Promise.all`.
- [ ] Eliminate duplicate presence heartbeat — global + per-space both send 60s heartbeats. Saves ~$500/mo at 10K DAU.
- [ ] Add Cache-Control headers to dashboard and activity feed routes
- [ ] Batch space doc reads in activity feed — N individual reads → `where('__name__', 'in', spaceIds)`

### Medium Effort

- [ ] Space page code split — `/s/[handle]` at 1.04 MB. Use `next/dynamic` for modals. Zero `dynamic()` usage anywhere.
- [ ] Replace tool update polling with Firestore `onSnapshot` — 2s polling = 30 req/min per user
- [ ] Convert 13 raw `<img>` tags to `next/image`
- [ ] Eliminate duplicate user doc reads in `join-v2/route.ts:421,456`

### High Effort

- [ ] Presence cost reduction — 60s heartbeat × 10K DAU = 14.4M writes/day (~$1,036/mo). Increase to 120s.
- [ ] Restructure activity feed — per-space queries to flat `activityFeed` collection
- [ ] React Query cache tuning — HomePage uses raw `fetch()` bypassing all caching
- [ ] Firestore indexes audit — 11 ghost collections with indexes but no code references. Add TTL policies.
- [ ] Performance monitoring — Web Vitals component exists but never mounted
- [ ] Typing cleanup background job — remove docs older than 3s

---

## Debt

### Architecture

- [ ] Collapse dual JWT signing systems — two parallel implementations
- [ ] Consolidate three session creation patterns
- [ ] Collapse 3 space state machines (`SpaceState`, `ResidenceState`, `SpaceStatus`) into single enum
- [ ] Remove redundant permission flags — derive from `role` only
- [ ] Consolidate duplicate `SpaceCardData` type and `SpaceData` (3 locations)
- [ ] Delete dead `packages/validation` — 14 schemas, zero imports
- [ ] Split `space-settings.tsx` (1,946 lines) into section components
- [ ] Standardize API response shapes — 4 patterns coexist
- [ ] Merge dual `getCurrentUser` modules — `@/lib/auth-server` and `@/lib/server-auth`
- [ ] Migrate 61 files from `useEffect` + `fetch` to React Query
- [ ] Fix `window.location.href` in `tool-navigation.ts` — 6 occurrences bypass Next.js routing
- [ ] Standardize tsconfig across packages

### Design Token Violations

- [ ] Replace 183 hardcoded values in profile components with design tokens
- [ ] Replace 26 `scale` transforms on hover/tap with opacity/brightness changes
- [ ] Replace inline motion values with `@hive/tokens/motion` imports — 20+ components
- [ ] Fix CSS animation hardcoded timing — pulseGold(2s), shineRotate(14s), borderBeam(12s), float(3s)
- [ ] Fix entry flow motion constraint violations — uses 600-1500ms durations (constraint is <300ms)
- [ ] Migrate 13 raw `<img>` tags to `next/image`

### Dead Code

- [ ] Delete `api-client-resilient.ts` + `error-resilience-system.ts` — zero consumers
- [ ] Remove 8 unused deps from `apps/web`: `@sendgrid/mail`, `@upstash/redis`, `@hookform/resolvers`, `react-hook-form`, `react-intersection-observer`, `@radix-ui/react-icons`, `@dnd-kit/*`
- [ ] Remove `motion` v12 from `packages/ui` — zero imports
- [ ] Remove `input-otp` from `packages/ui` — zero imports
- [ ] Consolidate 3 icon libraries → 1 (lucide-react)
- [ ] Remove 8-12 unused design system exports
- [ ] Consolidate duplicate EmptyState — local vs `packages/ui` version
- [ ] Remove ~40KB dead DDD code in spaces services
- [ ] Remove orphaned nav routes — /calendar, /rituals, /resources, /leaders
- [ ] Deduplicate nav configs — NAV_ITEMS vs MobileNav vs SpaceMobileNav
- [ ] Delete CampusShell — `app/campus-provider.tsx`

### Tooling & CI

- [ ] Install Prettier — config exists but binary not in any `package.json`
- [ ] Add pre-commit hooks (husky + lint-staged)
- [ ] Add lint scripts to 7 packages
- [ ] Fix CI test gating — tests can fail without stopping deploy
- [ ] Remove `eslint: { ignoreDuringBuilds: true }` from `next.config.mjs`
- [ ] Add env validation (Zod or t3-env)
- [ ] Set up Dependabot or Renovate
- [ ] Remove `tooling/*` from `pnpm-workspace.yaml` — matches nothing
- [ ] Create `.env.local.example`
- [ ] Fix Node.js engine mismatch — root `node 20.x` vs functions `node 18`

### Data Integrity

- [ ] Make join/leave member count atomic
- [ ] Add negative-count protection to sharded counters
- [ ] Fix counter drift — `memberCount` without transactions
- [ ] Add denormalization fan-out — embedded names never propagate on change
- [ ] Add schema versioning/migration framework
- [ ] Standardize collection naming — `spaceMemberships` vs `spaceMembers`, `eventRSVPs` vs `rsvps`
- [ ] Clean up 11 ghost indexes
- [ ] Migrate client-side Firestore writes to API routes — 5 files bypass server
- [ ] Fix Firebase admin mock fallback — init failure silently falls back to mock

### Reliability

- [ ] Add circuit breaker for external services (SendGrid, FCM, Resend)
- [ ] Add OTP email send retry
- [ ] Fix multi-tab presence oscillation
- [ ] Add client-side 401 auto-refresh interceptor

### Compliance

- [ ] Add login attempt logging — in-memory only, lost on redeploy
- [ ] FERPA: Audit academic info visibility defaults
- [ ] FERPA: Add consent notice for academic data
- [ ] CCPA/CPRA: Add "Do Not Sell" notice
- [ ] CAN-SPAM: Add physical address + unsubscribe to emails

### Observability

- [ ] Fix email masking in logs
- [ ] Add `/api/health` endpoint
- [ ] Install `@sentry/nextjs`
- [ ] Mount `WebVitals` component
- [ ] Replace mock data in admin dashboards
- [ ] Clean up 157 raw `console.log` calls
- [ ] Add `/api/stats` auth or rate limiting
