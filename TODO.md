# HIVE TODO

**Updated:** 2026-02-05
**Build:** `pnpm --filter=@hive/web build` (full monorepo may timeout)
**Stack:** Next.js 15 · React 19 · Firebase · TypeScript · Vercel

---

## Principles

Every task runs through these 5 filters:

1. **Does it help a student find their people?**
   If not → kill, defer, or deprioritize.

2. **Does it reduce clicks to real action?**
   Entry friction, navigation depth, time-to-value.

3. **Does it respect campus boundaries?**
   Every query filters by `campusId`. No exceptions.

4. **Does it uphold real identity?**
   Campus email verification required. No anonymous users.

5. **Does it ship complete?**
   No TODOs, no stubs, no "we'll finish later."

---

## Decision Log

Architectural choices made. Not up for debate unless context changes.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-04 | Keep dual chat implementations temporarily | DDD chat powers resident spaces, legacy chat powers standard spaces. Migration in Q1 2026. |
| 2026-02-04 | Real-time uses Firebase listeners + SSE, not WebSocket | Simpler architecture, Firebase already deployed, SSE good enough for notifications. |
| 2026-02-04 | HiveLab automations stored but not executed | Data layer ready, execution engine deferred to post-launch. |
| 2026-02-04 | Entry flow is multi-phase state machine | Gate → Naming → Field → Crossing. Single URL `/enter`, client-side state, no navigation jumps. |
| 2026-02-05 | Canonical profile URL: `/u/[handle]` | Kill `/user/[handle]` and `/profile/[id]`. Single source of truth for routing. |
| 2026-02-05 | Single Profile type source: `packages/core` | Domain type is canonical. App types extend it. No parallel definitions. |
| 2026-02-05 | Handle validation: 20 char max, alphanumeric + underscore | No periods, no special chars. Most restrictive regime wins (enforced across validation functions). |
| 2026-02-05 | Avatar field: `avatarUrl` canonical | Kill `photoURL` and `profileImageUrl`. Single field name across codebase. |
| 2026-02-05 | 31 Firestore collections confirmed | 17-agent audit mapped all collections. Only 3 composite indexes — need 10+ before launch scale. |
| 2026-02-05 | HiveLab actual counts: 41 routes, 32 elements, 30 templates | Previous docs overstated templates (35→30), understated routes (26→41) and elements (27→32). |
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

## 20-Agent Audit Summary (2026-02-04)

20 specialized agents audited the full codebase. Scores and critical findings:

| Agent | Score | Critical Finding |
|-------|-------|-----------------|
| Principal Architect | — | ~40 routes missing campusId, 7 realtime routes zero middleware |
| Spec Writer | — | Full acceptance specs written, cross-cutting gaps identified |
| Interface Librarian | — | 86 routes bypass `withAuthAndErrors`; `packages/validation` dead (zero imports) |
| Scaffolder | — | No Prettier, no pre-commit hooks, 8/10 packages lack lint scripts |
| Refactor Surgeon | — | Dual chat, AppShell vs UniversalShell, ~20 dead files |
| Security Auditor | — | `new Function()` sandbox escape in `tool-execution-runtime.ts:223` (CVSS 9.0); hardcoded admin password `Flynn123` in `scripts/add-admin.ts`; `MAX_CODES_PER_EMAIL_PER_HOUR` raised for testing |
| Data/DB Guardian | — | **Account deletion queries wrong collection** (`spaceMemberships` vs `spaceMembers`); misses `users`, `handles`, `notifications`, `connections`, `chatMessages`, `calendarTokens` |
| Test Engineer | — | <10% coverage, entry E2E deleted, 42/45 hooks untested |
| Performance Analyst | — | Dashboard N+1 (25+ reads/user), presence = 94% of Firestore cost ($1,036/mo at 10K DAU), space page 5 serial API calls, framer-motion in 169 files, zero `dynamic()` imports |
| Reliability/Chaos | **3/10** | Zero timeouts on any Firestore op, resilient API client built but has ZERO consumers (dead code), 40+ `.add()` calls (no idempotency), check-then-create race conditions |
| Observability Owner | **4.5/10** | WebVitals component exists but never mounted, Sentry scaffolded but `@sentry/nextjs` not installed, 157 raw `console.log` calls, no alerting |
| UX Edge-Case Assassin | **7/10** | Silent data fetch failures on Home + Explore, no chat message max length, 23 low-contrast text instances |
| Dependency Curator | — | `next@15.5.9` has 2 CVEs (needs >=15.5.10), 8 unused deps in `@hive/web`, 3 icon libraries, `motion` v12 redundant with `framer-motion`, 21 total audit vulns |
| Reviewer Gatekeeper | — | 85 routes missing `withAuthAndErrors`, 3,749 hardcoded colors, 1,073 scale transforms, 49 POST routes missing Zod |
| Release Manager | **4/10** | Zero git tags, no changelog, no staging env |
| Doc Scribe | **B-** | API docs F, Operations docs D-, Product/Design docs A |
| Red Team | — | **Cron endpoints open when `CRON_SECRET` unset** (one-line auth bypass), cross-campus via `checkSpacePermission`, unauthenticated search scraping, session JWT 30-day no rotation, admin JWT dev fallback secret hardcoded |
| Compliance/Policy | **3/10** | No terms/privacy acceptance in entry flow, account deletion misses many collections, no cookie consent, auto-delete UI is theater (no backend), Gravatar fetched from email hash without consent |
| Diff Cop | **4/10** | Dual `getCurrentUser` modules (`auth-server` vs `server-auth`), 4 competing API response patterns, 86 routes bypass middleware, 61 files use `useEffect+fetch` instead of React Query, `SpaceData` has 5 incompatible definitions, tsconfig drift across packages |

---

### 12-Agent Identity Deep Audit (2026-02-05)

| Agent | Focus | Critical Finding |
|-------|-------|-----------------|
| Entry Flow | 4-phase state machine, dead code | schoolId hardcoded to ub-buffalo, ~15 orphaned files |
| Auth API | 17 routes, security | No rate limit on refresh, token rotation broken, session ownership unverified |
| Profile Page | 3-zone layout, data loading | 8 parallel API calls, badges never render, edit goes to dead end |
| Profile UI Components | 25 files, design system | 183 hardcoded values, 3 aria attributes total, 3 design generations |
| Entry UI Components | EmailInput, OTP, Auth states | Missing focus-visible ring, OTP overflow on 360px |
| Settings | 4 sections, persistence | Account settings NEVER PERSISTED, 3 different save patterns |
| Handle System | Validation, reserved list | 3 validation regimes disagree (length 20 vs 30, periods), wrong API endpoint |
| Motion/Animation | Entry motion, global tokens | Inverted naming convention, identical phase transitions, dead exports |
| Mobile Experience | Safe-area, touch targets, breakpoints | viewport-fit missing, pb-safe undefined, 12+ touch target violations |
| Data Model | Profile types, field naming | 6 competing Profile types, 3 avatar field names, 4 onboarding flags |
| Privacy/Ghost Mode | Presence, DMs, visibility | Presence LEAKS online status, DM preference not enforced, expiry is stub |
| Integration | Cross-system connections | 3 conflicting URL patterns, 11 dead notification URLs, zero tool attribution |

### 17-Agent Cross-System Audit (2026-02-05)

17 agents audited all 5 systems (Identity, Spaces, Tools, Awareness, Discovery) plus cross-cutting concerns (design system, nav/shell, motion, Firebase, dead code).

| Agent | System | Critical Finding |
|-------|--------|-----------------|
| Identity API Routes | Identity | 43 total routes (17 auth + 26 profile), strong security, dev bypasses env-controlled |
| Identity Components | Identity | 37 components, 2 design token violations (EmailInput + OTPInput hardcode gold rgba), gold duplicated 3 places |
| Identity Hooks/State | Identity | 8 hooks, missing abort cleanup, race conditions in handle checking |
| Identity Types/Models | Identity | 4 conflicting onboarding fields, duplicate Handle/Email types, missing Zod on 7+ routes |
| Spaces API Routes | Spaces | 87 routes, join-request/waitlist bypass middleware (manual JWT), 20 msg/min rate limit |
| Spaces Components | Spaces | 50+ components, chat avatar broken (only AvatarFallback renders), accessibility 4/10 |
| Spaces Hooks/Services | Spaces | 18 hooks, 3 critical real-time bugs (presence ghost 90min, typing unmount race, SSE reconnect race), ~40KB dead DDD code |
| Tools API Routes | Tools | **41 routes (docs said 26)**, automation triggers NEVER fire, connection cascades don't propagate |
| Tools Components | Tools | **32 elements (docs said 27)**, **30 templates (docs said 35)**, IDE 80%, 4 critical UI blockers |
| Awareness API | Awareness | SendGrid not configured, push permission flow missing, polling 30s (spec says 10s), 6 notification types |
| Awareness Components | Awareness | Home 80% complete, notification bell 95%, dual shell (AppShell active vs UniversalShell unused), 3 parallel fetches |
| Discovery | Discovery | Simple `.includes()` search (no fuzzy), N+1 in user search, recommendation engine fully working |
| Design System | Cross-cutting | 123 primitives, 198 components, 164 stories, duplicate EmptyState, 8-12 unused exports |
| Nav/Shell | Cross-cutting | **THREE shells** (AppShell, UniversalShell, CampusShell), 65 pages, orphaned routes: /calendar, /rituals, /resources, /leaders |
| Motion System | Cross-cutting | 667-line token file, 90+ variants, **20+ components with hardcoded durations** violating 300ms constraint, entry uses 600-1500ms |
| Firebase/Data | Cross-cutting | **31 Firestore collections** (not 21+), only 3 composite indexes, hardcoded 'ub-buffalo' in Firestore rules, 5 files with client-side writes |
| Dead Code | Cross-cutting | Codebase very clean — only 1 finding: tools/updates line 898 commented-out `createNotification()` |

**Key Corrections:**
- HiveLab: 41 routes (not 26), 32 elements (not 27), 30 templates (not 35)
- Firestore: 31 collections (not 21+), only 3 composite indexes
- Shell: 3 implementations (not 2) — CampusShell is a third incomplete shell
- Motion: Entry flow uses 600-1500ms durations, violating the 300ms constraint

---

## 20-Agent Roles

Each agent owns a domain. No overlap. Every task in this doc maps to at least one owner.

| # | Agent | Owns |
|---|-------|------|
| 1 | **Principal Architect** | System invariants, boundaries, "what must never break" |
| 2 | **Spec Writer** | Turns goals into executable acceptance criteria + edge cases |
| 3 | **Interface Librarian** | API contracts, schemas, types, versioning, changelogs |
| 4 | **Scaffolder** | Repo structure, tooling, CI, test harnesses, lint/format, env wiring |
| 5 | **Feature Implementer(s)** | One agent per bounded module; only touches their slice |
| 6 | **Refactor Surgeon** | Untangles knots, reduces complexity, removes dead code |
| 7 | **Security Auditor** | Authn/authz, secrets, injection paths, dependency risk |
| 8 | **Data/DB Guardian** | Migrations, constraints, indexes, consistency, rollback plans |
| 9 | **Test Engineer** | Unit/integration/e2e coverage; failure-mode tests; fuzz where useful |
| 10 | **Performance Analyst** | Hot paths, load tests, profiling, caching, SLOs |
| 11 | **Reliability/Chaos Agent** | Timeouts, retries, idempotency, circuit breakers, fallbacks |
| 12 | **Observability Owner** | Logs/metrics/traces, dashboards, alert thresholds, runbooks |
| 13 | **UX/Edge-Case Assassin** | States, empty/error/loading, accessibility, weird inputs |
| 14 | **Dependency Curator** | Third-party libs, upgrades, license checks, pinned versions |
| 15 | **Reviewer Gatekeeper** | Enforces style, invariants, PR checklist, "no silent regressions" |
| 16 | **Release Manager** | Semantic versioning, rollout plan, feature flags, canary, rollback |
| 17 | **Doc Scribe** | README, architecture docs, ADRs, "how to operate this thing" |
| 18 | **Red Team** | Tries to break assumptions; adversarial misuse + abuse cases |
| 19 | **Compliance/Policy Agent** | Audit trails, retention, permissions, evidence (if regulated) |
| 20 | **Diff Cop** | Watches for drift across modules; keeps contracts consistent |

---

## TODO — Master Task List

### P0 — Pre-Launch Blockers

**Security**

- [ ] **Fix cron endpoint auth bypass** — `if (CRON_SECRET && authHeader !== ...)` allows anyone when env var unset. Change to `if (!CRON_SECRET || authHeader !== ...)`. One-line fix in 3 files: `api/cron/automations/route.ts:32`, `cron/setup-orchestration/route.ts:31`, `cron/tool-automations/route.ts:30`
- [ ] **Fix cross-campus permission gap** — `checkSpacePermission()` in `lib/space-permission-middleware.ts:95-295` does not validate campusId. Add `userCampusId` param and compare against `space.campusId`.
- [ ] **Remove admin JWT dev fallback secret** — `lib/middleware/auth.ts:15-17` falls back to `'dev-only-secret-do-not-use-in-production'` when `ADMIN_JWT_SECRET` unset. If preview deployment uses `NODE_ENV=development`, anyone can forge admin sessions.
- [ ] **Fix `new Function()` sandbox escape** — `lib/tool-execution-runtime.ts:223` uses `new Function()` for tool code execution. Users can escape via `this.constructor.constructor('return process')()` to get full Node.js access (CVSS 9.0). Replace with `vm2` or a WebAssembly sandbox, or move execution server-side in an isolated container.
- [ ] **Reset rate limit constant** — `MAX_CODES_PER_EMAIL_PER_HOUR = 10` in auth code has comment "Temporarily increased for testing". Reset to production value (3-5) before launch.
- [ ] **Remove hardcoded admin password** — `scripts/add-admin.ts` contains plaintext credentials (`Flynn123`). Delete or rotate immediately.
- [ ] **Add rate limiting to refresh token endpoint** — `apps/web/src/app/api/auth/refresh/route.ts` has no rate limiting — token brute-force vector open. Add per-IP + per-token rate limits.
- [ ] **Fix refresh token rotation** — `apps/web/src/app/api/auth/refresh/route.ts` creates new token pair but never revokes old refresh token. Attackers can reuse stolen tokens indefinitely.
- [ ] **Fix session ownership verification** — `apps/web/src/app/api/auth/sessions/[sessionId]/route.ts` DELETE handler doesn't verify session belongs to requesting user. Any authenticated user can delete any session.
- [ ] **Remove deprecated session endpoint** — `apps/web/src/app/api/auth/session/route.ts` is deprecated but still live with zero validation — bypasses all auth hardening. Delete file.
- [ ] **Fix ghost mode presence leak** — `apps/web/src/hooks/use-presence.ts` exposes online status regardless of ghost mode settings. Check `profile.settings.ghostMode` before broadcasting presence.
- [ ] **Enforce DM preferences** — `allowDirectMessages` preference exists in user settings but not enforced on DM creation routes. Add validation to `/api/messages` and `/api/realtime/chat`.

**Data Integrity**

- [ ] **Fix hardcoded schoolId in entry** — `apps/web/src/components/entry/hooks/useEntry.ts:139` hardcodes `schoolId: 'ub-buffalo'` — multi-campus broken at launch. Read from session or domain context.
- [ ] **Fix wrong schoolId in code verification** — `apps/web/src/components/entry/hooks/useEntry.ts:504` sends incorrect schoolId to `verifyCode()`. Use same source as entry creation.
- [ ] **Collapse profile URL patterns** — 3 conflicting patterns (`/u/[handle]`, `/user/[handle]`, `/profile/[id]`) cause 404s from notifications, search, explore. Standardize to `/u/[handle]` and migrate all links. 11 notification URLs use dead `/spaces/` path.
- [ ] **Fix account deletion wrong collection** — `api/profile/delete/route.ts:165` queries `spaceMemberships` but actual collection is `spaceMembers`. User memberships NOT deleted on account deletion.
- [ ] **Fix account deletion cascade** — Missing deletions: `users` doc (never deleted), `handles` (reserved forever), `notifications`, `connections`, `spaceJoinRequests`, `chatMessages` (anonymize), `calendarTokens` (contains OAuth creds), `verification_codes`, `activityEvents`, `tools`

**Mobile**

- [ ] **Add viewport-fit for iOS notch** — `apps/web/src/app/layout.tsx` missing `viewport-fit: 'cover'` in viewport export. All safe-area padding broken on iOS notch devices (iPhone X+).
- [ ] **Fix OTP input overflow on small screens** — `packages/ui/src/design-system/components/OTPInput.tsx` requires 314px but only 312px available on 360px screens. Entry flow broken on small Android devices.
- [ ] **Define pb-safe utility** — `pb-safe` class used throughout codebase but not defined in Tailwind config. Bottom padding doesn't work on any iOS device. Add to `tailwind.config.js`.

**Compliance**

- [ ] **Add terms/privacy acceptance to entry flow** — No proof of consent stored. GDPR Article 7 requires demonstrable acceptance. Add checkbox + `termsAcceptedAt` + `privacyAcceptedAt` timestamps to user record.
- [ ] **Remove automatic Gravatar fetch** — `api/auth/complete-entry/route.ts:20-56` sends email MD5 hash to Gravatar/Automattic without user consent. GDPR violation — get explicit consent or remove.

**Integration**

- [ ] Verify `DEV_AUTH_BYPASS` is disabled in production config — no dev credentials in prod
- [ ] Collapse dual chat implementations — kill `/api/realtime/chat` legacy, migrate offline-storage hook to `/api/spaces/.../chat` DDD
- [ ] Wire `enable_dms` feature flag — messaging UI exists, server-side and client-side gates already implemented, verify Firestore flag document exists

---

### P1 — Ship With Confidence

**Security:**
- [ ] **Require auth for search API** — `api/search/route.ts:946-955` falls back to `getDefaultCampusId()` for unauthenticated users, enabling scraping of all UB Buffalo data. Wrap with `withAuthAndErrors`.
- [ ] **Add rate limiting to all realtime routes** — All 7 `/api/realtime/*` routes (presence, typing, chat, websocket, channels, tool-updates, notifications) use raw `getCurrentUser()` with zero rate limiting. Firestore billing attack vector.
- [ ] **Add campusId filter to collectionGroup queries** — `collectionGroup('posts')` in `api/spaces/activity/recent/route.ts:171` and `api/tools/[toolId]/route.ts:268` can return cross-campus data.
- [ ] **Fix access whitelist fail-open** — `api/auth/send-code/route.ts:169` `checkAccessWhitelist()` returns `true` on error. Should fail closed.
- [ ] **Fix join request race condition** — `join-request/route.ts:111-141` checks then creates without transaction. Use deterministic doc ID `${spaceId}_${userId}` or wrap in transaction.
- [ ] **Add chat message idempotency keys** — every POST creates new message via `.add()`, double-click = duplicate. Use client-generated `messageId` with `.set()`.
- [ ] **Add timeouts to all Firestore operations** — zero timeout protection anywhere. Vercel 10s limit kills mid-flight. Add 8s default with AbortController pattern. OTP send-code route chains 7 sequential external calls.
- [ ] Migrate 3 routes to `withAuthAndErrors` — `join-request` GET/DELETE and `join-requests` GET use manual JWT parsing, bypassing rate limiting and campus enforcement
- [ ] Add Zod to 4 POST routes — `feedback`, `waitlist/join`, `waitlist/launch`, `friends` accept raw input without validation
- [ ] Test session revocation under load — `MAX_REVOCATION_AGE` (8 days) < session max (30 days) = 22-day gap where revocation expires but JWT lives
- [ ] **Upgrade `next` from 15.5.9 to >=15.5.10** — Image Optimizer `remotePatterns` bypass (GHSA-9g9p-9gw9-jx7f) + Unbounded Memory via PPR (GHSA-5f7q-jpqc-wp7h)
- [ ] **Add `pnpm.overrides`** to force patched transitives: `node-forge>=1.3.2`, `jws@4>=4.0.1`, `jws@3>=3.2.3`, `lodash>=4.17.23`
- [ ] Verify CSRF token extraction for form-encoded POST — `extractToken()` line 517-520 has comment with no implementation
- [ ] **Guard console.log in session.ts:57** — logs session secret info unconditionally in production
- [ ] Add campusId filter to dashboard space query — `api/profile/dashboard/route.ts:182-187` queries spaces without campusId filter

**Entry:**
- [ ] **Update graduation years** — `FieldScreen.tsx` includes 2025 (in the past). Update to 2026-2029.
- [ ] **Fix POPULAR_MAJORS mismatch** — `FieldScreen.tsx` includes "Engineering" but it's not in ALL_MAJORS dropdown. Add or remove.
- [ ] **Differentiate phase transitions** — `Entry.tsx` uses identical transition config for all 4 entry phases. Add phase-specific motion variants.
- [ ] **Wire confetti on completion** — `ConfettiBurst` component exists but never fires when user crosses entry finish line. Trigger on phase 4 complete.
- [ ] **Delete 15 dead entry files** — Orphaned files in `components/entry/`: morph-transition.ts, StepCounter, VerificationPending, acts/, screens/(BelongingScreen, ClaimScreen, EnterScreen, ProveScreen), sections/, states/(AlumniWaitlistState, ArrivalState, IdentityState, RoleState, SchoolState), primitives/(IdentityCard, OfflineBanner, RoleCard, SectionContainer), scenes/.

**Profile:**
- [ ] **Fix missing badges** — `ProfilePageContent.tsx` never passes `badges` prop to ProfileIdentityHero. User achievements invisible.
- [ ] **Fix Edit Profile dead link** — `ProfilePageContent.tsx` navigates to legacy editor route (non-existent). Should go to `/me/settings`.
- [ ] **Consolidate profile API calls** — `ProfilePageContent.tsx` makes 8 parallel requests on load. Merge into 2 endpoints: profile data + activity feed.
- [ ] **Display pronouns** — Profile components have pronouns partially wired but never rendered in UI. Add to ProfileIdentityHero.

**Settings:**
- [ ] **Fix account settings persistence** — `apps/web/src/app/me/settings/page.tsx` account section changes NEVER SAVED. No PUT/PATCH wired to backend. Add persistence handler.
- [ ] **Add bio character counter** — Settings page bio field has no validation or character count. Backend limits to 500 but UI gives no feedback.
- [ ] **Add dirty-state warning** — Settings page allows navigation away with unsaved changes. Add confirmation dialog or auto-save.
- [ ] **Unify persistence patterns** — 3 different save patterns across 4 settings sections. Consolidate to one approach.

**Handle:**
- [ ] **Fix handle length divergence** — Client validates max 20 chars, server SecureSchemas allows 30. Align both to 20.
- [ ] **Fix handle period validation** — Periods allowed server-side but blocked client-side. Enforce no-periods everywhere.
- [ ] **Expand reserved handle list** — `handle-service.ts` missing platform routes: explore, home, lab, me, settings, api, etc. Add full list to prevent handle squatting.
- [ ] **Fix handle check endpoint** — `useDramaticHandleCheck` points to wrong API endpoint. Should use `/api/auth/check-handle`.
- [ ] **Add handle change UI** — Full backend support exists for changing handles but no UI in Settings.

**Integration:**
- [ ] **Fix notification URLs** — 11 notifications in `notification-service.ts` link to dead `/spaces/` path. Update to `/s/[handle]`.
- [ ] **Fix chat avatars** — `chat-messages.tsx:207-209` only renders AvatarFallback, never AvatarImage despite avatar URLs in data. Wire image rendering.
- [ ] **Add tool creator attribution** — `ToolCard.tsx` displays tools with zero creator info. Add "by @handle" attribution.
- [ ] **Fix Explore people links** — `explore/page.tsx` uses dead `/profile/${id}` route. Update to `/u/[handle]`.
- [ ] **Fix search result URLs** — `search/route.ts` returns dead `/user/${handle}` URLs. Update to `/u/[handle]`.
- [ ] **Fix notification badge color** — TopBar badge uses RED (#EF4444), should be GOLD (#FFD700) per brand tokens.
- [ ] **Uncomment notification trigger** — `api/tools/updates/route.ts:898` has commented-out `createNotification()` call. Uncomment.
- [ ] **Add missing Firestore composite indexes** — Only 3 configured. Need indexes for: posts (spaceId+createdAt), events (campusId+startTime), spaceMembers (spaceId+joinedAt), tools (campusId+status).
- [ ] **Fix user search N+1** — `api/users/search` calculates mutual spaces per-user (O(n) queries). Batch with `where('__name__', 'in', spaceIds)`.
- [ ] **Fix ghost space claim notification** — Waitlist join works but no notification fires when ghost space is claimed. Wire trigger.

**Reliability:**
- [ ] Add retry logic to `deliverNotification()` — implementation exists at `lib/notification-delivery-service.ts` but has no retry on transient failures. Add 3-attempt exponential backoff.
- [ ] Wire unread count real-time sync — `useTotalUnreadCount()` hardcoded to 0 (line 284), `useSpaceUnreadCounts()` uses one-time fetch not `onSnapshot`
- [ ] Add Content Security Policy headers — only configured for `/admin/` in vercel.json, main app routes have none
- [ ] **Add cookie consent banner** — no cookie consent UI exists. Required for GDPR ePrivacy Directive.
- [ ] **Remove or implement auto-delete activity toggle** — `settings/components/account-section.tsx:187-215` UI toggle is theater with no backend. Either implement the cron job or remove the misleading toggle.
- [ ] **Add idempotency keys to posts + comments** — `api/posts/route.ts:93` and `api/posts/[postId]/comments/route.ts:131` use `.add()`. Double-click = duplicate.
- [ ] **Complete data export** — `settings/hooks/use-data-export.ts` misses chat messages, authored posts, notifications, tools. GDPR Article 20 requires complete copy.
- [ ] Add verification_codes TTL/cleanup — `CODE_TTL_SECONDS=600` but docs never deleted. Collection grows unbounded. Add Firestore TTL or cleanup cron.

---

### P2 — Core Experience

**Identity & Profile:**
- [ ] Profile API consolidation — 8 parallel calls into single endpoint
- [ ] Profile pronouns display — wired in backend but never rendered
- [ ] Settings missing fields — pronouns, social links, cover photo, device management
- [ ] Handle change UI — backend support exists, no frontend
- [ ] Mobile triple breakpoint mismatch — tokens vs Tailwind vs hooks
- [ ] Mobile touch target violations — 12+ items under 44px (back buttons, chips, tabs)
- [ ] Mobile profile page bottom padding — BottomNav overlap

**Spaces & Chat:**
- [ ] Build thread panel UI for Spaces — threading referenced but dedicated view incomplete
- [ ] Non-member space preview + social proof — blurred content, "X members joined," join CTA
- [ ] Offline message queue + retry — failed sends disappear silently, need queue + retry UI

**Home & Discovery:**
- [ ] Consolidate Home API calls — 3 separate fetches into 1 endpoint, cuts request waterfall
- [ ] Shared feed card library — extract SpaceCard, EventCard, ActivityCard into `packages/ui`
- [ ] Add search history — no saved searches, users restart every time
- [ ] Add faceted search filters — no category/type/date filtering in search UI
- [ ] Time-grouped activity on home — activity shows flat list, group by time window
- [ ] "All quiet" state for home — no empty-but-okay state when nothing happening
- [ ] Add notification badge to BottomNav home icon — no badge on mobile home
- [ ] Notification bell wiggle animation — missing per spec
- [ ] Keyboard navigation in notification popover — requires arrow key support
- [ ] Add "did you mean" suggestions to search — no typo tolerance currently

**Architecture:**
- [ ] Unify space type shapes — SpaceCardData vs SpaceData vs SpaceWithMetadata into one
- [ ] Consolidate AppShell + UniversalShell + CampusShell — THREE parallel nav systems, choose one
- [ ] Wire cross-tab unread sync via BroadcastChannel — mark-all-read across tabs
- [ ] Cache unread counts — event-driven invalidation on create/read, not recompute on fetch

---

### P3 — Growth & Retention

**Identity & Verification:**
- [ ] Profile completion rate tracking — target 80%+ within 7 days
- [ ] Identity verification badges — campus email auto, org leader manual, early adopter auto
- [ ] Profile belonging graph — shared spaces between users

**Entry & Onboarding:**
- [ ] Entry flow analytics — phase-by-phase timing, drop-off, handle collisions
- [ ] Progressive profiling — bio prompt at +3 days, connection suggestions after first interaction
- [ ] Conversion funnel analytics — track drop-off by entry phase, instrument transitions

**Discovery & Engagement:**
- [ ] Real trending calculation — replace member count with activity velocity (7-day window)
- [ ] Full-text search — upgrade from `.includes()` to Algolia or Firestore text search
- [ ] Recommendation caching — store `recommendedSpaces` per user, stop recomputing every visit
- [ ] Real-time unread badge on Home — wire SSE to show live counts
- [ ] Email digest service — batch notifications per user, respect quiet hours, weekly cadence
- [ ] Complete ghost mode — add real-time privacy violation detection, not just toggle
- [ ] Connection feed/discovery — buttons work but no integration into activity streams
- [ ] Space analytics dashboard — API exists, add chart rendering (Recharts or similar)

---

### P4 — HiveLab Completion

- [ ] Wire automation execution engine — `automateTool()` CRUD exists but triggers never fire, need scheduler
- [ ] Execute connection cascades on element state change — data flow paths stored but don't propagate
- [ ] Build AI element generation — integrate Claude API, name in → full element out
- [ ] Wire `notifyAffectedUsers()` — space members don't know when tools update
- [ ] Implement template versioning — lock deployed templates at creation version, opt-in updates
- [ ] Build community trust workflow — verification form, reviewer dashboard, trust badge
- [ ] Build community reviews UI — API routes exist, no frontend

---

### P5 — Performance & Infrastructure

**High Impact / Low Effort:**
- [ ] **Profile page API consolidation** — 8 calls → 1-2 endpoints
- [ ] **Profile type unification** — 6 competing definitions across codebase
- [ ] **Avatar field consolidation** — 3 names → 1 canonical `avatarUrl`
- [ ] **Denormalize RSVP counts onto event docs** — `api/profile/dashboard/route.ts:256-275` does N individual RSVP reads per dashboard load. Increment/decrement `rsvpCount` on event doc when RSVP created/updated.
- [ ] **Parallelize space page API calls** — `use-space-residence-state.ts:222-367` makes 5 serial API calls. Use `Promise.all` for independent requests. Saves 200-400ms.
- [ ] **Eliminate duplicate presence heartbeat** — Global `usePresence` hook AND per-space hook both send 60s heartbeats. Consolidate into one. Saves ~$500/mo at 10K DAU.
- [ ] **Add Cache-Control headers** to dashboard and activity feed routes — `private, max-age=60, stale-while-revalidate=300`.
- [ ] **Batch space doc reads in activity feed** — `api/activity-feed/route.ts:96-98` does N individual reads. Replace with `where('__name__', 'in', spaceIds)`.

**Medium Effort:**
- [ ] Space page code split — `/s/[handle]` at 1.04 MB total. Use `next/dynamic` for 7 modals. Zero `dynamic()` usage anywhere in codebase.
- [ ] Replace tool update polling with Firestore `onSnapshot` — 2s polling = 30 req/min per user.
- [ ] Convert 13 raw `<img>` tags to `next/image` — enables WebP, lazy loading, responsive srcSet
- [ ] Eliminate duplicate user doc reads in `join-v2/route.ts:421,456` — same doc fetched twice

**High Effort:**
- [ ] Presence cost reduction — 60s heartbeat × 10K DAU = 14.4M writes/day (~$1,036/mo). Increase to 120s with client-side optimism. Cuts cost ~75%.
- [ ] Restructure activity feed — per-space subcollection queries to flat `activityFeed` collection. O(1) instead of O(spaces).
- [ ] React Query cache tuning — spaces 5m, messages 30s, presence real-time. HomePage uses raw `fetch()` bypassing all caching.
- [ ] Move HomePage from raw `fetch()` to React Query hooks — bypasses all caching, dedup, and background refetch
- [ ] Firestore indexes audit — 11 ghost collections with indexes but no code references. Add TTL policies for `presence`, `verification_codes`, `deletion_requests`, `automationRuns`.
- [ ] Performance monitoring — Web Vitals component exists but never imported in any layout. Mount it.
- [ ] Typing cleanup background job — Cloud Task every 5min, remove docs older than 3s

---

## Systems

### Entry — The First 90 Seconds

**Status:** Production-ready with multi-campus gaps. 4-phase flow working, but schoolId hardcoded.

**What's Real:**
- 4-phase state machine (Gate → Naming → Field → Crossing) on single URL `/enter`
- Handle collision recovery: 8 deterministic fallback candidates with Firestore uniqueness check
- Rate limiting + SHA256 code hashing + 60s lockout on failed auth attempts
- Post-entry space recommendations by major+interests scoring with atomic transaction joining
- Alumni waitlist fallback for unverified schools
- Motion system with progressive gold animation as users complete phases

**Critical Bugs:**
- `schoolId` hardcoded to `'ub-buffalo'` in `useEntry.ts:139` — multi-campus broken at foundation
- `verifyCode()` sends `campusId` as `schoolId` parameter (useEntry.ts:504) — wrong field mapping
- Graduation years array starts with 2025 (FieldScreen.tsx) — past year in current selection
- "Engineering" in `POPULAR_MAJORS` but not in `ALL_MAJORS` (FieldScreen.tsx) — inconsistent majors
- All 4 phase transitions use identical timing — no phase-specific motion
- ConfettiBurst component exists but never fires on crossing completion

**Architecture Debt:**
- Entry motion tokens have INVERTED naming vs global tokens (entry smooth=0.6s vs global smooth=0.4s)
- ~15 dead/orphaned files from previous entry iterations
- section-motion.ts (330 lines) used only by 3 files
- morph-transition.ts exists but has zero imports — completely orphaned
- StepCounter.tsx exported but never imported in codebase

**Accessibility:**
- EmailInput missing `focus-visible:ring` on text input — keyboard nav violation
- OTP input width hardcoded, may overflow on 360px screens
- AuthSuccessState not using superior SuccessCheckmark primitive (duplicated animation)
- 3 LOCKED UI primitives have zero Storybook coverage

**Full Stack:**
| Layer | File | State |
|-------|------|-------|
| Frontend | `components/entry/Entry.tsx` | Solid — phase machine works |
| Hook | `components/entry/hooks/useEntry.ts` | **BROKEN** — schoolId hardcoded, wrong field mapping |
| Screen | `components/entry/screens/GateScreen.tsx` | Solid — email + OTP |
| Screen | `components/entry/screens/NamingScreen.tsx` | Solid — name + handle |
| Screen | `components/entry/screens/FieldScreen.tsx` | **BROKEN** — stale years, major mismatch |
| Screen | `components/entry/screens/CrossingScreen.tsx` | Solid — but no ConfettiBurst |
| Primitives | `packages/ui` EmailInput | **A11Y** — missing focus ring |
| Primitives | `packages/ui` OTPInput | **RESPONSIVE** — overflow on 360px |
| API | `api/auth/complete-entry/route.ts` | Solid — atomic transaction |
| API | `api/auth/alumni-waitlist/route.ts` | Solid — fallback waitlist |
| Motion | `components/entry/motion/entry-motion.ts` | Token mismatch |
| Motion | `components/entry/motion/morph-transition.ts` | **DEAD** — zero imports |
| Database | Firestore `users/{id}` + `handles/` | Solid — unique indexes |

**Signals to Watch:**
- Entry-to-first-space rate (>15s = latency issue)
- Handle collision frequency (>5% = strategy rethink)
- Post-entry drop-off (complete but never interact = recommendation mismatch)
- Multi-campus entry failures (currently 100% would fail without ub-buffalo)
- OTP input overflow reports on mobile

---

### Spaces — The Core Loop

**Status:** Chat works end-to-end with DDD service layer. Parallel implementations creating friction. Real-time sync incomplete.

**What's Real:**
- Split-panel chat (MessageFeed + sidebar) with boards, threading, reactions, read receipts — `app/s/[handle]/page.tsx` unified component
- Real-time presence (60s heartbeat), typing indicators (3s window), "since you left" unread divider — `useSpaceResidenceState(handle)` drives all state
- Join requests + moderation UI for private spaces — permission checks per operation, XSS scanning, 20 msg/min rate limit
- Leader tools: analytics API, member list with online status, space settings panels

**Tasks:**
- [ ] Collapse dual chat implementations — kill `/api/realtime/chat`, migrate to `/api/spaces/.../chat` DDD
- [ ] **Fix join request race condition** — `join-request/route.ts` check-then-create without transaction (lines 111-129)
- [ ] **Add chat message idempotency keys** — `.add()` creates duplicates on retry. Use client-generated `messageId` with `.set()`
- [ ] Wire unread count SSE across browser tabs — data exists, multi-tab sync doesn't flow
- [ ] Build thread panel UI — threading referenced but dedicated view incomplete
- [ ] Non-member preview + social proof — blurred content, "X members joined," join CTA
- [ ] Offline message queue + retry — failed sends disappear silently
- [ ] Space analytics dashboard — API exists, no chart rendering
- [ ] Collapse 3 state machines (`SpaceState`, `ResidenceState`, `SpaceStatus`) into single enum
- [ ] Remove redundant permission flags — derive from `role` only
- [ ] **Fix chat avatar rendering** — chat-messages.tsx:207-209 uses AvatarFallback only, never AvatarImage. Wire image rendering.
- [ ] **Fix 11 notification URLs** — notification-service.ts uses dead `/spaces/` path instead of `/s/[handle]`
- [ ] **Fix ghost mode presence leak** — use-presence.ts publishes online status regardless of ghost mode

**Full Stack:**
| Layer | File | State |
|-------|------|-------|
| Page | `app/s/[handle]/page.tsx` | Solid — unified SpacePageUnified |
| Chat UI | `app/s/[handle]/components/message-feed.tsx` | Solid — boards, reactions |
| Chat Avatars | `app/s/[handle]/components/chat-messages.tsx` | Broken — no image rendering |
| Presence | `hooks/use-presence.ts` | Partial — heartbeat works, ghost leak |
| State | `hooks/use-space-residence.ts` | Solid — single hook drives room state |
| API (DDD) | `api/spaces/[spaceId]/chat/route.ts` | Solid — POST/GET with validation |
| API (Legacy) | `api/realtime/chat/route.ts` | Partial — duplicate, marked for deprecation |
| Notifications | `lib/notification-service.ts` | Broken URLs — `/spaces/` dead route |
| Database | Firestore `spaces/{id}/boards/{id}/messages` | Solid — indexed |

**Signals to Watch:**
- Message send failure rate (no offline queue = re-engagement drops)
- Non-member join rate vs lurker count (<10% conversion = preview needs work)
- Leader analytics page bounce rate (no charts = leaders stop moderating)
- Ghost mode effectiveness (presence still leaking = privacy trust broken)

---

### Home & Discovery — The Daily Experience

**Status:** Core navigation working. UI complete. Inefficiencies blocking scale and real-time. URL routing broken.

**What's Real:**
- Home renders 6-section activity stream from 3 parallel API calls (happening now, upcoming, spaces, activity, suggestions, header)
- Explore dual-mode (curated feed + search) with interest/major scoring, trending by member count, event RSVP, ghost spaces
- Search with 300ms debounce and substring matching across spaces, people, events
- New user path recommending spaces to join with interest-based scoring

**Tasks:**
- [ ] Consolidate Home API calls — 3 fetches into 1 endpoint
- [ ] Shared feed card library — extract SpaceCard, EventCard, ActivityCard into `packages/ui`
- [ ] Unify space type shapes — SpaceCardData vs SpaceData into single type
- [ ] Real trending calculation — activity velocity instead of member count
- [ ] Recommendation caching — store per user in Firestore, stop recomputing
- [ ] Full-text search — upgrade from `.includes()` to Algolia or Firestore text search
- [ ] Real-time unread badge — wire SSE to show live counts on Home
- [ ] Extract Home into smaller components — 1,120 lines
- [ ] Extract Explore into smaller components — 1,137 lines
- [ ] **Fix Explore people links** — explore/page.tsx uses dead `/profile/${id}` route. Canonical is `/u/[handle]`
- [ ] **Fix Search API URLs** — search/route.ts returns dead `/user/${handle}` links. Canonical is `/u/[handle]`
- [ ] **Profile URL migration** — audit all profile link references, enforce `/u/[handle]` canonical pattern

**Full Stack:**
| Layer | File | State |
|-------|------|-------|
| Page — Home | `app/home/page.tsx` | 1,120 lines, extractable |
| Page — Explore | `app/explore/page.tsx` | 1,137 lines, broken profile links |
| API — Dashboard | `api/profile/dashboard/route.ts` | Split into 3 calls |
| API — Activity | `api/spaces/activity/recent/route.ts` | No dedup |
| API — Search | `api/search/route.ts` | Broken URLs |
| Components | `components/{home,explore}/` | Duplicated card logic |

**Signals to Watch:**
- Recommendation diversity (% joining from "For You" vs browsing — <40% = scoring needs adjustment)
- Search drop-off (% using search vs curated — <20% = search failing)
- Home section engagement time (if Suggested <10% = not resonating)
- Profile 404 rate (broken links = users can't find each other)

---

### Profiles & Navigation — Identity + Wayfinding

**Status:** 3-zone profile correct. 8 parallel API calls on load. Token compliance poor. Accessibility absent.

**What's Real:**
- 3-zone profile layout (identity → belonging → activity) with ProfileBelongingSpaceCard + ProfileSharedBanner components
- 3-item navigation (Home, Explore, You) stable across desktop (260px sidebar with gold accent) and mobile (bottom nav)
- Command palette (Cmd+K) fully wired
- Ghost mode settings persist; connection state machine (none/pending/connected) operational
- Handle resolution via `/api/profile/handle/{handle}` working

**What's Honest:**
- **8 parallel API calls on page load** — profile, badges, tools, posts, spaces, stats, presence, mutual connections
- **Badges never render** — ProfileIdentityHero accepts `badges` prop but ProfilePageContent never passes it
- **Pronouns partially wired** — data structure exists, never displayed in UI
- **"Edit Profile" dead end** — navigates to legacy editor route (non-existent)
- **Legacy route tree** — `/profile/[id]/` with 36 files = 0 traffic, full duplication
- **25 profile UI files, THREE design generations** — ProfileHero (legacy), ProfileIdentityHero (current), BentoProfileGrid (orphaned)
- **Token compliance POOR** — 183 hardcoded values, only 2/21 files import from `@hive/tokens`
- **Accessibility VERY POOR** — 3 aria attributes total across 21 files, zero keyboard navigation
- **6 duplicate formatNumber functions**, 3 duplicate getInitials functions
- **Settings persistence broken** — Account settings never saved to Firestore
- **Bio character counter missing** — no 500-char limit feedback
- **No dirty-state warning** — navigate away with unsaved changes = silent data loss
- **3 different persistence patterns** — profile uses `useProfileForm`, privacy uses inline handler, account never persists
- **Handle validation inconsistencies** — 3 separate regimes disagree on length and allowed characters
- **useDramaticHandleCheck points to wrong endpoint** — uses space handle check instead of user handle check
- **Ghost mode client leaks** — presence writes online status even when ghost mode enabled
- **allowDirectMessages not enforced** — setting exists, DM flows ignore it
- **No block user functionality** — ghost mode hides you, blocked users can still view profile

**Tasks:**
- [ ] Consolidate API calls — single endpoint returning profile + presence + connections + activity
- [ ] Wire badges — pass `profileData.badges` to ProfileIdentityHero
- [ ] Display pronouns — add to ProfileIdentityHero credentials line
- [ ] Fix Edit Profile link — navigate to `/me/settings` instead of dead route
- [ ] Delete `/profile/[id]/` route tree — 36 dead files, redirect to `/u/[handle]`
- [ ] Deduplicate profile UI — choose ProfileIdentityHero, delete legacy generations
- [ ] Fix token compliance — replace 183 hardcoded values with `@hive/tokens` imports
- [ ] Add accessibility — aria-labels, focus rings, keyboard navigation
- [ ] Extract formatNumber and getInitials to shared utils
- [ ] Persist account settings — wire language/timezone to Firestore
- [ ] Add bio character counter — show live feedback
- [ ] Add dirty-state warning — confirm modal on navigate with unsaved changes
- [ ] Consolidate settings persistence — one pattern, one mutation endpoint
- [ ] Unify handle validation — single source of truth, comprehensive reserved list
- [ ] Fix useDramaticHandleCheck endpoint — use `/api/auth/check-handle`
- [ ] Enforce ghost mode server-side — filter presence writes when enabled
- [ ] Enforce allowDirectMessages — block DM UI when disabled
- [ ] Add granular visibility controls — friends-only, campus-only, connections-only

**Full Stack:**
| Layer | File | State |
|-------|------|-------|
| Page | `app/u/[handle]/ProfilePageContent.tsx` | 8 parallel fetches |
| App Shell | `components/layout/AppShell.tsx` | Production nav |
| Shell (lib) | `packages/ui/shells/UniversalShell.tsx` | Duplicate — consolidate |
| Bottom Nav | `components/nav/BottomNav.tsx` | Mobile nav |
| Identity Hero | `packages/ui` ProfileIdentityHero | Missing badges/pronouns |
| Settings | `app/me/settings/page.tsx` | Account settings never persist |
| Handle Check | `packages/ui` useDramaticHandleCheck | Wrong endpoint |
| Legacy Tree | `app/profile/[id]/` | **36 dead files — delete** |

**Signals to Watch:**
- Profile load time (target <2s on 4G, currently 8 fetches)
- Bounce rate on `/u/[handle]` (if >40%, data consolidation urgent)
- Settings save failures (if >5%, persistence regression)
- Handle collision reports (if reserved list incomplete, user frustration)

---

### Auth & Security — The Fortress

**Status:** Multi-layer protection in place. Refresh token rotation broken. Deprecated routes active. Session ownership unverified.

**What's Real:**
- Email verification → OTP → JWT session (HS256, 30d) with campus isolation in token claims
- Rate limiting at three levels: edge (300/min global, 30/min sensitive), route handler, IP lockout
- CSRF: origin validation + signed token with session binding + fingerprint + single-use for mutations
- Zod validation on most API routes (4 routes still missing)
- Token pair infrastructure exists (`createTokenPair`, `verifyRefreshToken`, `setTokenPairCookies`)

**What's Honest:**
- **No rate limiting on `/api/auth/refresh`** — brute-force vector
- **Refresh token rotation broken** — creates new pair but does NOT revoke old token. Old tokens replayable for full 7-day lifetime.
- **Session ownership not verified on DELETE** — any authenticated user can delete any session
- **Deprecated `/api/auth/session` still active** — GET/POST both functional with zero migration enforcement. Uses SECOND JWT signing pattern.
- **Three session creation patterns** — inconsistent init across auth routes
- `scripts/add-admin.ts` contains hardcoded plaintext password `Flynn123`
- `lib/middleware/auth.ts:15-17` has hardcoded admin JWT fallback secret
- Cron endpoint auth bypassed when `CRON_SECRET` env var unset
- `MAX_REVOCATION_AGE` is 8 days but session max is 30 days — 22-day gap
- `checkSpacePermission()` does not validate campusId
- CSRF `extractToken()` comment-only for form-encoded POST
- 7 realtime routes with zero rate limiting — billing attack vector
- Search API allows unauthenticated access
- `/api/stats` fully public
- Rate limits in-memory only, reset on every Vercel cold start

**Tasks — Pre-Launch:**
- [ ] **Add rate limiting to `/api/auth/refresh`** — RATE_LIMIT_PRESETS.strict
- [ ] **Implement refresh token rotation** — revoke old token after creating new pair
- [ ] **Verify session ownership on DELETE** — query user sessions before revoking
- [ ] **Deprecate `/api/auth/session` for real** — return 410 Gone, force clients to `/api/auth/me`
- [ ] **Consolidate JWT signing** — all session creation uses `createTokenPair`
- [ ] **Remove admin JWT dev fallback** — delete `lib/middleware/auth.ts:15-17`
- [ ] **Remove hardcoded admin password** — delete `scripts/add-admin.ts` plaintext credentials
- [ ] **Fix cron endpoint auth** — change `if (CRON_SECRET && ...)` to `if (!CRON_SECRET || ...)`
- [ ] **Fix cross-campus permission gap** — add campusId param to `checkSpacePermission()`
- [ ] **Require auth for search** — remove `getDefaultCampusId()` fallback
- [ ] **Add rate limiting to realtime routes** — all 7 `/api/realtime/*` routes
- [ ] Verify `DEV_AUTH_BYPASS` is disabled in production
- [ ] Fix session revocation gap — `MAX_REVOCATION_AGE` must match session max
- [ ] Email masking in logs
- [ ] Implement CSRF for form-encoded POST
- [ ] Upgrade `next` from 15.5.9 to >=15.5.10 — 2 CVEs
- [ ] Migrate 3 routes to `withAuthAndErrors`
- [ ] Fix access whitelist fail-open

**Tasks — Post-Launch:**
- [ ] Content Security Policy headers
- [ ] Set up Dependabot/Renovate
- [ ] Session revocation caching strategy
- [ ] Rate limit telemetry — log 429s by path and IP
- [ ] Reduce session cookie from 30-day single JWT to 15min access + 7day refresh
- [ ] Add campusId filter to all `collectionGroup` queries
- [ ] Auth/rate limit `/api/stats`

**Full Stack:**
| Layer | File | State |
|-------|------|-------|
| Email + OTP | `api/auth/send-code` | Complete |
| JWT session | `packages/firebase` session | Complete |
| Refresh | `api/auth/refresh/route.ts` | **Rotation broken** |
| Session mgmt | `api/auth/sessions/[sessionId]/route.ts` | **Ownership unverified** |
| Deprecated | `api/auth/session/route.ts` | **Active with 2nd JWT pattern** |
| Campus isolation | `lib/middleware/auth.ts` | Enforced in token claims |
| Edge rate limiting | `middleware.ts` | Complete (300/30) |
| Realtime routes | `api/realtime/*` | **Zero rate limiting** |
| CSRF | `lib/middleware/csrf.ts` | Complete (JSON; partial form) |
| Dev auth bypass | `packages/firebase` session | **Needs verification** |

**Signals to Watch:**
- Refresh token reuse after rotation (should be 0%)
- Session DELETE 403s (ownership missing)
- Deprecated endpoint traffic to `/api/auth/session`
- Realtime route 429s after rate limiting

---

### HiveLab — The Builder IDE

**Status:** Canvas works. 32 elements ship. Automations stored but don't execute. AI generation is placeholder.

**What's Real:**
- Tool creation from blank or template, 32 composable elements persisted with versioning
- Canvas composition with real-time sync, deploy to any space surface (sidebar, feed, modal, embedded)
- Per-user state (selections, form data) + shared state (counters, collections, timeline) both working
- Dashboard with tool gallery, space deployments visible, template marketplace functional

**What's Honest:**
- **Automation execution:** CRUD complete. Triggers stored. `automateTool()` never fires — no scheduler.
- **Connection cascades:** Data flow paths stored. Cascades execute manually only.
- **AI element generation:** Placeholder. Only generates display label. No LLM composition.
- **User notifications:** `notifyAffectedUsers()` stubbed. Space members don't get notified.
- **Trust verification:** Schema exists. Zero verification process.
- **Template versioning:** Deployed templates don't track updates. Breaking changes corrupt silently.
- **Community reviews:** API routes exist, UI missing.
- **Creator attribution:** ToolCard.tsx shows ZERO creator/author info.
- **Connection URLs:** notification-service.ts uses dead `/user/` path.

**Tasks:**
- [ ] Wire automation triggers to real scheduler (Firebase Cloud Tasks or Vercel Cron)
- [ ] Execute connection cascades on element state change
- [ ] Build AI element generation on Claude API — name in, full element out
- [ ] Wire `notifyAffectedUsers()` — space members don't know when tools update
- [ ] Implement template versioning — lock at creation version, opt-in updates
- [ ] Build community trust workflow — verification form, reviewer dashboard
- [ ] Build community reviews UI — API routes exist, no frontend
- [ ] Add creator attribution to ToolCard — show author name/avatar/handle
- [ ] Fix connection notification URLs — replace `/user/` with `/u/`

**Full Stack:**
| Layer | File | State |
|-------|------|-------|
| Runtime | `hooks/useToolRuntime.ts` | Solid |
| Automation | `packages/core` automation | Stub — triggers don't fire |
| Cascades | `packages/core` element-cascades | Stored — execution missing |
| AI generation | `packages/core` ai-element-generator | Placeholder |
| Notifications | `lib/notify-tool-updates.ts` | Stub — never called |
| Templates | `packages/core` templates | Missing version lock |
| Trust system | `packages/firebase` verification | Schema only |
| Tool card UI | `components/hivelab/dashboard/ToolCard.tsx` | No creator attribution |

**Signals to Watch:**
- Automation creation vs execution rate (builders create but nothing fires)
- Template update breakage (deployed tools corrupt on upstream changes)
- Tool adoption per space (if <10%, discoverability failing)
- Creator discovery rate (users can't find who built tools)

---

### Notifications & Real-Time — The Come-Back Engine

**Status:** Types, preferences, and UI built. Delivery infrastructure missing. Real-time works for presence/typing/chat but lacks reliability.

**What's Real:**
- 15+ notification types across 7 categories with full Firestore persistence
- Preference system: global enable, per-category, quiet hours (timezone-aware), per-space mute with TTL
- Bell component with space grouping, 99+ cap, mark-all-read
- SSE streaming with 30s heartbeat; Firestore presence (60s heartbeat, 90min TTL); typing (3s window)
- Feature flags: 12 flags with rollout strategies (percentage, users, schools, roles)

**What's Honest:**
- `deliverNotification()` exists but has NO retry on transient failures
- Typing cleanup job STUBBED
- Presence history stats HARD-CODED to 0
- Unread counts recomputed on every fetch — `useTotalUnreadCount()` hardcoded to 0
- Tool updates use 2s polling instead of event-driven (30 req/min per user)
- WebSocket route simulates via Firestore documents — not true bidirectional
- No cross-tab unread sync
- Email digest not implemented
- Presence cost: 60s global + 60s space heartbeat (duplicate) × 10K DAU = 19.2M writes/day = ~$1,036/month
- **Presence leaks ghost mode status** — use-presence.ts writes before checking privacy settings
- **11 notification URLs use dead `/spaces/` path** instead of `/s/`
- **Missing actor avatars** in bell UI
- **Connection URLs use dead `/user/` path**

**Tasks:**
- [ ] Add retry logic to `deliverNotification()` — 3-attempt exponential backoff
- [ ] Typing cleanup background job — Cloud Task every 5min, remove docs older than 3s
- [ ] Cache unread counts — event-driven invalidation, not recompute
- [ ] Replace tool update polling with Firestore listener — cuts 30 req/min per user
- [ ] Email digest service — batch per user, respect quiet hours, weekly cadence
- [ ] Cross-tab unread sync via BroadcastChannel
- [ ] Message deduplication on retry — idempotency keys
- [ ] Fix presence privacy leak — check ghost mode BEFORE writing to Firestore
- [ ] Replace `/spaces/` with `/s/` in all notification URLs (11 instances)
- [ ] Replace `/user/` with `/u/` for connection notifications
- [ ] Add actor avatar display to notification bell

**Full Stack:**
| Layer | File | State |
|-------|------|-------|
| Types | `packages/core` notification types | Complete (15 types) |
| Preferences | `packages/core` notification preferences | Complete |
| Bell UI | `components/notifications/hive-notification-bell.tsx` | Missing actor avatars |
| Delivery | `lib/notification-delivery-service.ts` | **Needs retry logic** |
| Presence | `hooks/use-presence.ts` | **Leaks ghost mode status** |
| Typing | `hooks/use-typing-indicators.ts` | Works |
| Typing cleanup | Background job | **STUBBED** |
| Unread counts | Firestore query | **Uncached, O(n)** |
| SSE | `api/realtime/sse/route.ts` | Works |
| URLs | `lib/notification-service.ts` | **11 dead `/spaces/` + 1 dead `/user/`** |

**Signals to Watch:**
- Notification delivery failure rate
- Unread count drift (client vs server)
- Typing indicator lag (>1s = cleanup failing)
- Presence Firestore cost at scale
- Ghost mode leakage reports
- 404 rate on notification clicks (dead URLs)

---

### Design System & Motion — The Feel

**Status:** Tokens deployed, motion wired on ~40% of surfaces. Profile component audit reveals deep token violations and accessibility gaps.

**What's Real:**
- Full token library (colors, spacing, typography, motion) in `packages/tokens`, synced across 321 UI components via CVA
- Motion system live: spring physics, stagger animations, card hover variants, chat message fade-ins
- Layout archetypes established (OrientationLayout, DiscoveryLayout, ImmersionLayout, FocusFlowLayout)
- Design recipes (FormField, EmptyState, Stack, Grid, Masonry)

**What's Honest:**
- **Profile components:** 183 hardcoded color/spacing values, only 2/21 files import from `@hive/tokens`
- **Profile components:** 3 total aria attributes across 21 files, zero keyboard navigation
- **Profile components:** 3 coexisting design generations (legacy, transition, token-compliant)
- **Entry motion tokens:** INVERTED naming vs global tokens (entry smooth=0.6s vs global smooth=0.4s)
- **75% dead exports** in section-motion.ts
- Progressive ambient glow code exists but not wired
- EmailInput missing `focus-visible` ring
- 3 LOCKED UI primitives have zero Storybook coverage
- 6 duplicate formatNumber functions, 3 duplicate getInitials functions

**Tasks:**
- [ ] **Audit profile components for token violations** — 183 hardcoded values → `@hive/tokens`
- [ ] **Add keyboard navigation to profile components** — zero support currently
- [ ] **Consolidate profile design generations** — 3 patterns → single system
- [ ] **Fix entry motion token inversion** — align naming with global tokens
- [ ] **Remove dead exports from section-motion.ts** — 75% unused
- [ ] **Wire progressive ambient glow** — code exists, not integrated
- [ ] **Add focus-visible ring to EmailInput**
- [ ] **Add Storybook coverage for 3 LOCKED primitives**
- [ ] **Deduplicate utility functions** — 6 formatNumber, 3 getInitials → shared utils
- [ ] Wire PageTransition between all routes
- [ ] Animate space entry — threshold → member view, currently snaps
- [ ] Sidebar collapse/expand with spring motion
- [ ] Unify AppShell and UniversalShell
- [ ] Uniform motion audit — raw CSS `transition:` → tokens
- [ ] Storybook coverage audit — 321 components, unknown coverage

**Token Coverage:**
| Domain | Token File | Deployment |
|--------|-----------|------------|
| Color | `packages/tokens/src/colors.ts` | Full (except profiles: 183 hardcoded) |
| Spacing | `packages/tokens/src/spacing.ts` | Full (except profiles) |
| Typography | `packages/tokens/src/typography.ts` | Partial — some inline font stacks |
| Motion | `packages/tokens/src/motion.ts` | Partial — 40% of surfaces, entry naming inverted |
| Layout | `packages/tokens/src/layout.ts` | Full |

**Signals to Watch:**
- New pages shipping without PageTransition
- Motion variants copy-pasted instead of imported from tokens
- Profile token violations increasing with new features

---

### Data & Performance — The Engine

**Status:** Functional foundation, campus validation solid. Profile audit reveals 8 parallel API calls, 6 competing type definitions. Performance leaking through unoptimized fetches.

**What's Real:**
- 31 Firestore collections with ironclad campusId isolation (hardcoded 'ub-buffalo' in Firestore rules for vBETA)
- DDD layers in packages/core, Zod schemas shared client+server
- Zustand + React Query handling client state (defaults, not tuned)
- Firebase SDK with 50MB IndexedDB cache configured

**What's Honest:**
- **Profile page:** 8 parallel API calls on load
- **Profile types:** 6 competing definitions across packages
- **Onboarding completion:** 4 different field names checked
- **Avatar field names:** 3 conventions (`avatarUrl`, `photoURL`, `profileImageUrl`)
- **Cover photo names:** 3 conventions
- **trustLevel:** missing entirely
- **activityScore:** always 0, never computed
- **Badges:** schema exists, earning logic missing

**Bundle Report:**
| Page | First Load | Total | Notes |
|------|-----------|-------|-------|
| `/s/[handle]` | 51.7 kB | 1.04 MB | Largest — presence + chat + members |
| Shared JS | — | 102 kB | Across all routes |
| Middleware | — | 39.2 kB | Auth + campus filtering |

**Hot Paths:**
- Dashboard N+1: 10-25 individual Firestore reads per dashboard load
- Activity feed: 15-60 reads for 10 spaces
- Space page waterfall: 5 serial API calls, 500ms+ on 100ms latency
- Presence cost: 19.2M writes/day at 10K DAU (~$1,036/mo)
- Tool SSE polling: 30 reads/min per user
- Zero `next/dynamic` imports anywhere
- HomePage uses raw `fetch()` bypassing React Query caching

**Tasks:**
- [ ] **Consolidate profile API calls** — 8 → 1-2 endpoints
- [ ] **Unify Profile type definitions** — 6 → 1 canonical source
- [ ] **Standardize onboarding completion field** — 4 names → 1
- [ ] **Standardize avatar field naming** — `avatarUrl` canonical
- [ ] **Standardize cover photo field naming** — pick one
- [ ] **Implement trustLevel computation**
- [ ] **Implement activityScore computation**
- [ ] **Wire badge earning logic**
- [ ] Fix dashboard N+1 — batch RSVP queries
- [ ] Home API consolidation — 3 → 1 endpoint
- [ ] Space page code split — target <400 kB first paint
- [ ] Unread count caching — incremental strategy
- [ ] Presence aggregation — single subscription, 120s heartbeat
- [ ] React Query cache tuning
- [ ] Batch activity feed reads
- [ ] Firestore indexes audit
- [ ] Performance monitoring — mount WebVitals
- [ ] Memoization sweep

**Estimated Monthly Firestore Costs:**
| DAU | Reads | Writes | Total |
|-----|-------|--------|-------|
| 1K | ~$15 | ~$105 | ~$120/mo |
| 10K | ~$70 | ~$1,050 | ~$1,120/mo |
| 100K | ~$340 | ~$10,500 | ~$10,840/mo |

**Signals to Watch:**
- FCP on `/s/[handle]` (target <2s after code split)
- API requests per session (target 30% reduction)
- Middleware p95 latency (target <50ms)
- Profile type drift (new code using wrong definition)

---

## Strategic Options & Enhancement Opportunities

### Open Decisions
Decisions that block or shape implementation. Each needs a choice before work begins.

1. **URL Consolidation** — 3 profile URL patterns coexist (`/u/[handle]`, `/user/[handle]`, `/profile/[id]`). Recommendation: `/u/[handle]` canonical. But need to decide: redirects for old patterns? Or hard kill?
2. **Profile Type Unification** — 6 competing Profile types. Options: A) Single type in `packages/core`, all others import. B) New `@hive/types` shared package. C) Gradual migration with adapter layer.
3. **Avatar Field Canonical Name** — 3 names (`avatarUrl`, `photoURL`, `profileImageUrl`). Pick one, migrate all.
4. **Dead Code Strategy** — ~15 orphaned entry files, deprecated auth route, 75% dead motion exports, legacy profile routes. Options: A) Big cleanup PR now. B) Delete as you touch. C) Automated dead code detection in CI.
5. **Handle Validation Unification** — 3 regimes disagree on max length (20 vs 30), allowed characters (periods yes/no). Pick strictest and enforce everywhere.
6. **Settings Persistence Architecture** — 3 different patterns coexist. Options: A) Unified settings hook with auto-save. B) Form-level submit with dirty tracking. C) Optimistic per-field save.
7. **Presence Privacy Architecture** — Ghost mode toggle exists but presence leaks. Options: A) Server-side only presence (no client writes). B) Client-side privacy check before every write. C) Separate "visible" and "system" presence channels.

### Enhancement Opportunities
Features that would meaningfully improve the Identity system beyond fixing what's broken.

1. **Progressive Identity** — Bio prompt at +3 days, avatar nudge at +1 week, handle personalization after first space join. The profile builds itself through use.
2. **Identity Verification Badges** — Campus email verified (auto), student org leader (manual), early adopter (auto), tool creator (auto). Visible on profile, chat, member lists.
3. **Profile Belonging Graph** — Visual representation of shared spaces between you and another user. "You're both in 3 spaces" with clickable pills. Drives connection without friend requests.
4. **Handle Economy** — Handle change with 30-day cooldown, old handles reserved for 90 days, handle suggestions based on real name + interests. Premium handles for early adopters.
5. **Settings Intelligence** — Auto-detect settings that might matter based on behavior. If user is in 10+ spaces, surface notification batching. If user never opens email notifs, suggest turning them off.
6. **Entry Flow Analytics** — Phase-by-phase timing, drop-off points, handle collision frequency, recommendation acceptance rate. Instrument every transition for funnel analysis.
7. **Campus Memory** — Your profile remembers what you did: spaces joined, tools created, events attended, conversations contributed to. Builds over semesters. Exportable on graduation.
8. **Identity Portability** — Profile data export (GDPR Article 20 compliance + genuine user value). Export your spaces, tools, connections, activity history as structured data.

### Moat Analysis (from Strategic Lenses)
Which Identity features build durable advantage vs. temporary differentiation:

**Compounds over time (moat):**
- Campus memory (more valuable each semester)
- Belonging graph (network effects)
- Space reputation/activity history (can't be replicated elsewhere)
- Handle namespace (first-mover in campus handles)

**Copyable (not moat):**
- Profile layout/design (any app can copy)
- OTP auth flow (commodity)
- Settings UI (standard)
- Ghost mode (privacy toggle)

**Strategic implication:** Invest in features that accumulate data only HIVE has. Campus memory and belonging graph are the Identity system's moat builders.

---

## Debt — Track but Don't Block

**Architecture & Code Quality:**
- [ ] **Delete ~15 dead/orphaned entry files** — scenes, sections, states no longer used after entry refactor
- [ ] **Remove deprecated `/api/auth/session` route** — still active, superseded by `/api/auth/refresh`
- [ ] **Collapse dual JWT signing systems** — two parallel implementations
- [ ] **Consolidate three session creation patterns** — inconsistent session init across auth routes
- [ ] **Delete legacy `/profile/[id]/` route tree** — dead weight, superseded by `/u/[handle]`
- [ ] **Consolidate 3 profile URL conventions** — `/profile/[id]`, `/u/[handle]`, `/user/[handle]` all exist
- [ ] **Standardize avatar field naming across codebase** — 6 different names
- [ ] Collapse 3 space state machines (`SpaceState`, `ResidenceState`, `SpaceStatus`) into single enum
- [ ] Remove redundant permission flags — derive from `role` only
- [ ] Delete legacy `/api/realtime/*` routes after DDD migration
- [ ] Consolidate duplicate `SpaceCardData` type and `SpaceData` (3 locations)
- [ ] Delete dead `packages/validation` — 14 schemas, zero imports
- [ ] Split `space-settings.tsx` (1,946 lines) into section components
- [ ] Remove deprecated component exports from entry barrel files
- [ ] Standardize API response shapes — 4 patterns coexist, migrate to `withAuthAndErrors`
- [ ] Merge dual `getCurrentUser` modules — `@/lib/auth-server` and `@/lib/server-auth`
- [ ] Migrate 61 files from `useEffect` + `fetch` to React Query
- [ ] Fix `window.location.href` in `tool-navigation.ts` — 6 occurrences bypass Next.js routing
- [ ] Standardize tsconfig across packages
- [ ] Pin dependency versions across workspace

**Design Token Violations:**
- [ ] Replace 183 hardcoded values in profile components with design tokens
- [ ] Replace 26 `scale` transforms on hover/tap — violates VISUAL_DIRECTION.md
- [ ] Replace inline motion values with `@hive/tokens/motion` imports — 20+ components use hardcoded durations/easing
- [ ] Fix CSS animation hardcoded timing — pulseGold(2s), shineRotate(14s), borderBeam(12s), float(3s) should use motion tokens
- [ ] Fix entry flow motion constraint violations — uses 600-1500ms durations, confetti 2500ms, arrival glow 3000ms (constraint is <300ms)
- [ ] Migrate 13 raw `<img>` tags to `next/image`

**Dead Code / Unused Dependencies:**
- [ ] Delete `api-client-resilient.ts` + `error-resilience-system.ts` — ZERO consumers
- [ ] Remove 8 unused deps from `apps/web`: `@sendgrid/mail`, `@upstash/redis`, `@hookform/resolvers`, `react-hook-form`, `react-intersection-observer`, `@radix-ui/react-icons`, `@dnd-kit/*`
- [ ] Remove `motion` v12 from `packages/ui` — zero imports
- [ ] Remove `input-otp` from `packages/ui` — zero imports
- [ ] Consolidate 3 icon libraries → 1 (lucide-react recommended)
- [ ] Remove 8-12 unused design system exports — Callout, AspectRatio, Combobox, ritual stubs
- [ ] Consolidate duplicate EmptyState — local `apps/web/src/components/ui/empty-state.tsx` vs `packages/ui` design-system version
- [ ] Remove ~40KB dead DDD code in spaces services
- [ ] Remove orphaned nav routes — /calendar, /rituals, /resources, /leaders not reachable from any navigation
- [ ] Deduplicate nav configs — NAV_ITEMS in navigation.ts vs MobileNav in UniversalShell vs SpaceMobileNav
- [ ] Delete CampusShell (incomplete third shell) — `app/campus-provider.tsx`

**Tooling & CI:**
- [ ] Install Prettier — config exists but binary not in any `package.json`
- [ ] Add pre-commit hooks (husky + lint-staged)
- [ ] Add lint scripts to 7 packages
- [ ] Fix CI test gating — tests can fail without stopping deploy
- [ ] Remove `eslint: { ignoreDuringBuilds: true }` from `next.config.mjs`
- [ ] Add env validation (Zod or t3-env)
- [ ] Wire or delete `@hive/eslint-plugin-hive` — 5 rules written, plugin never referenced
- [ ] Delete `@hive/moderation` package — orphan
- [ ] Delete `@hive/auth-logic` duplicate vitest config
- [ ] Set up Dependabot or Renovate
- [ ] Remove `tooling/*` from `pnpm-workspace.yaml` — matches nothing
- [ ] Create `.env.local.example` from `.env.production.template`
- [ ] Evaluate `shamefully-hoist=true` in `.npmrc`
- [ ] Fix Node.js engine mismatch — root `node 20.x` vs functions `node 18`

**Data Integrity:**
- [ ] **Make join/leave member count atomic** — separate ops can leave ghost members
- [ ] Add negative-count protection to sharded counters
- [ ] Fix counter drift — `memberCount` without transactions
- [ ] Add denormalization fan-out — embedded names never propagate on change
- [ ] Add schema versioning/migration framework
- [ ] Standardize collection naming — `spaceMemberships` vs `spaceMembers`, `eventRSVPs` vs `rsvps`
- [ ] Clean up 11 ghost indexes
- [ ] Migrate client-side Firestore writes to API routes — 5 files bypass server: use-notifications.ts, use-presence.ts, real-time-feed-listeners.ts, ai-usage-tracker.ts, feed.repository.ts
- [ ] Add missing composite Firestore indexes — only 3 configured; need 10+ for production query patterns (posts, events, spaceMembers, tools)
- [ ] Fix Firebase admin mock fallback — init failure silently falls back to mock, hides real configuration errors

**Reliability:**
- [ ] Add circuit breaker for external services (SendGrid, FCM, Resend)
- [ ] Add OTP email send retry
- [ ] Add notification creation retry
- [ ] Fix multi-tab presence oscillation
- [ ] Add client-side 401 auto-refresh interceptor
- [ ] Add notification dedup transaction

**Compliance:**
- [ ] Add login attempt logging — in-memory only, lost on redeploy
- [ ] Clean up stale presence data
- [ ] FERPA: Audit academic info visibility defaults
- [ ] FERPA: Add consent notice for academic data
- [ ] CCPA/CPRA: Add "Do Not Sell" notice
- [ ] CAN-SPAM: Add physical address + unsubscribe to emails
- [ ] Community identities may be GDPR Article 9 special category data

**Ops & Observability:**
- [ ] Fix email masking in logs
- [ ] Session revocation caching strategy
- [ ] Rate limit telemetry
- [ ] Handle UX refinement — 1-2 suggestions instead of 8 on collision
- [ ] Add `/api/health` endpoint
- [ ] Install `@sentry/nextjs`
- [ ] Mount `WebVitals` component
- [ ] Replace mock data in admin dashboards
- [ ] Clean up 157 raw `console.log` calls
- [ ] Add `/api/stats` auth or rate limiting

---

## Infrastructure Reference

| What | Where |
|------|-------|
| API routes | `apps/web/src/app/api/` |
| Pages | `apps/web/src/app/` |
| Shared components | `packages/ui/src/` |
| Feature components | `apps/web/src/components/` |
| Hooks | `apps/web/src/hooks/` |
| Design tokens | `packages/tokens/src/` |
| Motion tokens | `packages/tokens/src/motion.ts` |
| Core types / DDD | `packages/core/src/` |
| Firebase admin | `packages/firebase/src/admin/` |
| Validation | `packages/validation/src/` |
| System docs | `docs/systems/` — Feature specs + UX specs for all 5 systems |
| Strategic docs | `docs/STRATEGIC_LENSES.md` — 20 ideation lenses |

**Commands:**
```bash
pnpm dev                      # Start all
pnpm --filter=@hive/web dev   # Web only
pnpm build && pnpm typecheck  # Before merge
```

**See `docs/INDEX.md` for complete documentation index.**
