# HIVE Deep Codebase Audit

**Auditor:** Hex (Systems Engineer)
**Date:** February 19, 2026
**Codebase:** Next.js 15 + Firebase + Turborepo monorepo

---

## Architecture Overview

```
apps/
  web/          — Main Next.js app (consumer-facing)
  admin/        — Separate Next.js admin dashboard
packages/
  core/         — Domain logic, services, Firestore collections, types
  ui/           — Design system (primitives, components, Storybook)
  auth-logic/   — Auth hooks and Firebase auth wrapper
  hooks/        — Shared React hooks
  tokens/       — Design tokens (colors, spacing, motion)
  validation/   — Zod schemas
  firebase/     — Firebase client SDK wrapper
functions/      — Firebase Cloud Functions (automations)
infrastructure/ — Firebase functions (legacy), firestore rules, scripts
```

**Verdict: The monorepo structure is sound. The problem is SCOPE CREEP — there's 3x more code than needed for an MVP.**

---

## 1. AUTH

### What Exists & Works ✅
- **Entry flow** (`/enter` → `EntryFlowV2`): Email → OTP code → name for new users. Clean 2-screen flow.
- **API routes**: `send-code` (674 LOC), `verify-code` (386 LOC), `complete-entry` (715 LOC) — all substantial, real implementations.
- **JWT sessions** via `jose` in middleware. Cookie-based auth with refresh tokens.
- **Edge middleware** with rate limiting, route protection, onboarding redirects.
- **`.edu` email verification** — validates UB/campus emails.
- **Access code system** — gated entry for controlled rollout.
- **Session management** (`/api/auth/sessions`, `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout`).
- **CSRF protection**, alumni waitlist, handle uniqueness checking.
- **`packages/auth-logic`** — `useAuth` hook, Firebase auth wrapper, error handling.

### Half-Built / Broken ⚠️
- **Multiple auth abstraction layers**: `lib/auth-server.ts`, `lib/server-auth.ts`, `lib/production-auth.ts`, `lib/api-auth-middleware.ts`, `lib/api-auth-secure.ts`, `lib/secure-auth-utils.ts`, `lib/middleware/auth.ts`, `lib/dev-auth-bypass.ts`. That's **8 files** doing overlapping auth work. Consolidate to 2 max.
- **Session revocation** (`session-revocation.ts`) — exists but unclear if wired up end-to-end.
- **Admin auth grant** (`check-admin-grant`) — niche, possibly unused.

### Cut ✂️
- `lib/dev-auth-bypass.ts` — **remove before production**. Dev shortcuts in prod code is a security hole.
- `lib/production-auth.ts` vs `lib/server-auth.ts` vs `lib/auth-server.ts` — pick ONE, delete the others.
- `infrastructure/firebase/functions/src/auth/sendMagicLink.ts` / `verifyMagicLink.ts` — **legacy magic link flow**. You switched to OTP. Delete these.

### Missing for Real Students 🚫
- **Password reset / account recovery** — if someone loses access to their .edu email, they're locked out.
- **Session timeout UX** — no visible "you've been logged out" state.

### Completion: 85% — Auth is the strongest system. Needs consolidation, not new features.

---

## 2. EVENTS

### What Exists & Works ✅
- **API**: `/api/events` (606 LOC), `/api/events/personalized`, `/api/spaces/[spaceId]/events` with full CRUD + RSVP.
- **Components**: `create-event-modal.tsx`, `event-details-modal.tsx`, `EventCard` (design system).
- **Firebase collections**: `events` (flat), with migration path to nested under spaces.
- **Space-scoped events** with RSVP support (`/api/spaces/[spaceId]/events/[eventId]/rsvp`).
- **Event sync cron** (`/api/cron/sync-events`) — scrapes CampusLabs events.
- **Discover page** (`/discover`) — event feed with categories (social, academic, professional, etc.), RSVP inline.
- **Design system**: `EventCard`, `EventCalendar`, `EventCreateModal`, `EventDetailsModal`, `EventEditModal`, `EventsMode`, `RSVPButton`.

### Half-Built ⚠️
- **CampusLabs scraper** (`scripts/scrapers/campuslabs-*`) — 6 files. Unclear if actually producing data in production.
- **Personalized events** (`/api/events/personalized`) — exists but recommendation logic quality unknown.
- **Event reminders** (`infrastructure/firebase/functions/src/events/reminders.ts`) — Cloud Function exists but may not be deployed.

### Cut ✂️
- `event-board-auto-link.ts` — over-engineered linking between events and boards.
- `event_state_transitions.ts` — complex state machine for event lifecycle. Overkill for MVP.

### Missing 🚫
- **Calendar view** — `/calendar` redirects to `/discover?tab=events`. No actual calendar UI.
- **iCal/Google Calendar export** — students want to add events to their calendar apps.
- **Event notifications** — "event starting in 30 min" push notifications.

### Completion: 70% — Core CRUD + RSVP works. Discovery feed works. Missing calendar UX and push notifications.

---

## 3. SPACES

### What Exists & Works ✅
- **Route**: `/s/[handle]` — full space residence page with split-panel layout (sidebar + chat).
- **Spaces hub**: `/spaces` → `SpacesHub` component for browsing/joining.
- **Massive API surface**: 40+ API routes under `/api/spaces/[spaceId]/` covering:
  - Chat (messages, reactions, pins, threads, typing, search, streaming)
  - Members (CRUD, batch, join requests, roles)
  - Posts (CRUD, comments, reactions)
  - Events (scoped to space)
  - Tools (deploy, feature)
  - Settings (avatar, banner, moderation, analytics, transfer ownership)
- **Space types**: clubs/orgs, residential, identity spaces.
- **Join flow**: `SpaceJoinModal`, `SpaceThreshold` (gate for non-members), invite codes.
- **Claim flow**: Pre-seeded UB orgs that student leaders can claim.
- **Chat system**: Real-time messages via Firestore, typing indicators, read receipts, pinned messages, thread replies.
- **Leader dashboard**: `leader-dashboard.tsx`, member management, moderation panel.
- **Design system**: `SpaceCard`, `SpaceHeader`, `SpaceChatBoard`, `SpaceHub`, `SpaceEntryAnimation`, etc.

### Half-Built ⚠️
- **Firestore migration**: Posts, events, members, RSVPs still on FLAT collections with migration flags set to `false`. This means cross-space queries work but nested security rules don't.
- **Space templates** (`/api/spaces/templates`) — API exists but unclear if templates are seeded.
- **Space analytics** (`/api/spaces/[spaceId]/analytics`) — route exists, unclear data quality.
- **Boards/tabs system** — `boards`, `tabs`, `widgets` subcollections exist but the UI seems to default to a single chat board. Multi-board is half-built.
- **Go-live flow** (`/api/spaces/[spaceId]/go-live`) — space launch ceremony, may be over-designed.

### Cut ✂️
- **Boards/tabs/widgets system** — massive complexity for a feature nobody asked for. Spaces should be: Chat + Events + Members. Period. Cut `boards`, `tabs`, `widgets` subcollections and all related UI (`BoardTabs`, `AddTabModal`, `AddWidgetModal`).
- **Inline components** (`inline-components.tsx`, `IntentConfirmationInline`) — chat slash commands that auto-create components. Cool tech demo, not MVP.
- **Space "modes"** (`EventsMode`, `MembersMode`, `ToolsMode`, `ModeCard`, `ModeTransition`) — over-designed navigation within spaces. Use simple tabs.
- **Theater chat board** (`TheaterChatBoard`) — what even is this? Cut.
- **Space celebrations** (`space-celebrations.tsx`) — confetti when space goes live. Fun but fluff.
- **Sharded member counter** (`sharded-member-counter.service.ts`) — premature optimization. You don't have scale problems yet.

### Missing 🚫
- **Push notifications for new messages** — critical for a chat-based product.
- **Image/file sharing in chat** — students need to share photos, PDFs, links.
- **Mobile-optimized chat UX** — the split-panel layout is desktop-first.

### Completion: 65% — The API surface is massive but the UX is over-engineered. Simplify to Chat + Events + Members and it jumps to 85%.

---

## 4. DISCOVERY / FEED

### What Exists & Works ✅
- **Route**: `/discover` — event feed with category filters, RSVP, search.
- **API**: `/api/feed/global` (210 LOC), `/api/feed/search`, `/api/spaces/browse-v2`, `/api/spaces/recommended`, `/api/search`.
- **Space browsing**: `/spaces` with `SpacesHub` showing your spaces + discovery.
- **Feed ranking**: `packages/core/src/domain/feed/services/feed-ranking.service.ts` — actual ranking logic exists.
- **Personalized feed query**: `get-personalized-feed.query.ts` in core package.

### Half-Built ⚠️
- **Global feed** (`/api/feed/global`) is only 210 LOC — suspiciously thin. Likely returns recent posts without real ranking.
- **Search** (`/api/search`) — exists but quality of results unknown. No Algolia/Typesense — probably just Firestore `where` queries.
- **Browse V2** (`/api/spaces/browse-v2`) — the "V2" suffix means V1 is probably dead code somewhere.

### Cut ✂️
- **Feed ranking service** in `packages/core` — premature. With <1000 users, chronological is fine. Remove the complex ranking algorithm.
- **Cognitive budget hooks** (`use-cognitive-budget.ts`) — managing "information load" for users. Academic concept, not product feature.
- **`packages/core/src/domain/feed/enhanced-feed.ts`** — DDD aggregate for feed items. Over-architecture.

### Missing 🚫
- **Unified discovery page** that shows Events + Spaces + People in one view. Currently `/discover` is events-only.
- **"Happening now" section** — real-time pulse of campus activity.
- **Trending spaces/events** — social proof for what's popular.

### Completion: 55% — Event discovery works. Space browsing works. But there's no unified "here's what's happening at UB right now" view. That's the killer feature for students.

---

## 5. PROFILE

### What Exists & Works ✅
- **Routes**: `/u/[handle]` (public profile), `/me` (own profile), `/me/edit`, `/me/settings`.
- **Settings page**: `/settings` with sections for profile, account, privacy, notifications, interests. Well-structured with dedicated components.
- **API**: `/api/profile` (655 LOC) with GET/PUT, photo upload, FCM token, privacy settings, connections, activity, spaces, tools.
- **Design system**: 20+ profile components (`ProfileHero`, `ProfileCard`, `ProfileSpacesCard`, `ProfileInterestsCard`, `ProfileStatsRow`, etc.)
- **Profile completion tracking** (`use-profile-completion.ts`, `completion-card.tsx`).
- **Ghost mode** (`GhostModeModal`, `GhostModeCountdown`) — privacy feature to go invisible.
- **Follow system** (`/api/profile/[userId]/follow`).
- **Connections** (`/api/profile/[userId]/connections`).

### Half-Built ⚠️
- **Profile by handle** (`use-profile-by-handle.ts`) — lookup works but profile pages may not handle all edge cases (deleted user, suspended, etc.).
- **Privacy controls** are extensive (`ghost-mode`, visibility settings, profile privacy value objects) but may not all be wired to the actual Firestore queries that filter content.
- **Activity feed on profile** (`/api/profile/[userId]/activity`) — exists but unclear what it actually shows.

### Cut ✂️
- **Ghost mode** — cool concept but niche. Cut for MVP, add later if students ask for it.
- **Connection strength** (`connection-strength.value.ts`) — calculating relationship strength between users. Way too early.
- **"People You May Know"** (`PeopleYouMayKnow.tsx`) — recommendation engine for people. Premature.
- **Profile activity heatmap** (`ProfileActivityHeatmap.tsx`) — GitHub-style contribution graph. Fluff.
- **Builder level / XP system** (`builder-xp.ts`, `BuilderLevel.tsx`) — gamification. Cut.

### Missing 🚫
- **Profile photo cropping** — `image-cropper.tsx` exists but unclear if integrated into the upload flow.
- **Profile QR code** for quick follow/connect at events.

### Completion: 75% — Core profile works well. Over-built with social features nobody's using yet.

---

## 6. HIVELAB (Tool Builder)

### What Exists & Works ✅
- **Routes**: `/lab` (dashboard), `/lab/create`, `/lab/new`, `/lab/[toolId]` (edit/preview/deploy/analytics/settings/feedback/runs).
- **AI tool generation**: `/api/tools/generate`, `/api/tools/create-from-intent` — AI generates tool compositions from natural language.
- **Element system**: 30+ element types (poll, timer, countdown, checklist, leaderboard, signup sheet, RSVP, chart, form builder, QR code, etc.) in `packages/ui/src/components/hivelab/elements/`.
- **IDE**: Full visual tool editor (`hivelab-ide.tsx`) with element palette, properties panel, canvas, layers, connections.
- **Deploy flow**: `ToolDeployModal`, deploy API, space deployment targeting.
- **Conversational creator** (`ConversationalCreator`, `PromptHero`, `RefinementBar`, `StreamingPreview`) — AI-powered creation flow.
- **Template system**: Template gallery, save-as-template, template suggestions.
- **Tool runtime**: `tool-execution-runtime.ts`, `tool-runtime-provider.tsx`, `tool-runtime-modal.tsx` — tools actually run with state.
- **Standalone tool pages**: `/t/[toolId]` — shareable tool links.
- **Setups system**: `/lab/setups` — higher-level automation workflows.

### Half-Built ⚠️
- **AI quality pipeline** (`ai-quality-pipeline.ts`, `quality-gate.service.ts`) — validation exists but unclear if it actually blocks bad generations.
- **Automation system** (`automations-panel.tsx`, `automation-builder-modal.tsx`, `automation-executor.service.ts`) — complex trigger/action system. Partially built.
- **Custom blocks** (`custom-block-generator.service.ts`, `custom-block-element.tsx`) — user-defined elements. Advanced feature, likely unstable.
- **Tool state streaming** (`/api/tools/[toolId]/state/stream`) — SSE for real-time tool state. May have reliability issues.
- **Setups/orchestration** — entire subsystem (`/lab/setups`, `/api/setups/*`) for multi-step workflows. Very complex, unclear if it works.
- **Goose integration** (`packages/core/src/hivelab/goose/`) — AI model integration with training data. Unclear status.

### Cut ✂️
- **Setups/orchestration system** — `/lab/setups/*`, `/api/setups/*`. This is a workflow automation engine. Way too complex for MVP. **Cut the entire vertical.**
- **Custom blocks** — let users build from the existing 30+ elements. Custom blocks add massive complexity.
- **Automation builder** — triggers, conditions, actions. This is Zapier-level complexity. Cut entirely.
- **Connection system** (`connections-panel.tsx`, `connection-builder-modal.tsx`, `connection-resolver.service.ts`) — tool-to-tool data connections. Over-engineered.
- **Learning system** (`packages/core/src/application/hivelab/learning/`) — AI that learns from user edits. 5 files of ML infrastructure. Cut.
- **Benchmarks** (`packages/core/src/application/hivelab/benchmarks/`) — AI quality benchmarking. Internal tool, not user-facing.
- **Canvas minimap** (`canvas-minimap.tsx`) — for when you have so many elements you need a minimap. You won't.
- **Smart guides** (`smart-guides.tsx`) — Figma-style alignment guides. Over-built.
- **Showcase** (`packages/ui/src/components/hivelab/showcase/`) — demo gallery. Not needed for MVP.

### Missing 🚫
- **Simple "create a poll/signup" flow** — the conversational AI creator is great but there should be a 2-click path for common tools.
- **Tool analytics that actually matter** — installs, active users, engagement. Not the complex dashboard that exists.

### Completion: 60% — The core tool builder works. But it's buried under an IDE, automation engine, ML pipeline, and orchestration system. **Strip it to: AI prompt → preview → deploy to space. That's it.**

---

## 7. NOTIFICATIONS

### What Exists & Works ✅
- **Route**: `/me/notifications` — full notification center with filters (all, mentions, likes, follows, events), mark all read, delete, click-to-navigate.
- **API**: `/api/notifications` (201 LOC) — GET (list), POST (mark read/delete), PUT (mark individual read).
- **Streaming**: `/api/notifications/stream` — SSE for real-time notifications.
- **Firebase collection**: `notifications` (top-level).
- **FCM integration**: `fcm-client.ts`, `use-fcm-registration.ts`, `server-push-notifications.ts`, `/api/users/fcm-token`.
- **Notification service**: `notification-service.ts`, `notification-delivery-service.ts`.
- **Notification preferences**: `/api/profile/notifications/preferences`.
- **Service worker**: `public/sw.js` for push notifications.

### Half-Built ⚠️
- **Push notifications** — FCM registration exists, service worker exists, but unclear if notifications are actually being SENT for key events (new message, event reminder, etc.).
- **Notification delivery service** may not be wired to all the events that should trigger notifications.
- **SSE stream** (`/api/notifications/stream`) — may have connection reliability issues.

### Cut ✂️
- **`notification-center-element.tsx`** in HiveLab — a notification widget as a tool element. Nobody needs this.

### Missing 🚫
- **Reliable push notification triggers** — need to verify: chat mentions, event RSVPs, space invites, etc. actually fire notifications.
- **Email notification digests** — daily/weekly email summary for students who don't check the app.
- **Notification batching** — "3 new messages in Chess Club" not 3 separate notifications.

### Completion: 65% — The notification UI is solid. The backend plumbing exists. The gap is in TRIGGERING — making sure notifications actually fire for the right events.

---

## 8. NAVIGATION / LAYOUT

### What Exists & Works ✅
- **AppShell** (`AppShell.tsx`) — top bar + mobile bottom bar + content area. Clean.
- **Route structure**:
  - `/` — Landing page (no shell)
  - `/enter` — Auth flow (no shell)
  - `/discover` — Event feed
  - `/spaces` — Space hub
  - `/s/[handle]` — Space residence
  - `/lab` — Tool builder
  - `/me` — Profile
  - `/me/notifications` — Notifications
  - `/settings` — Settings
  - `/u/[handle]` — Public profile
  - `/t/[toolId]` — Standalone tool
- **Middleware redirects**: Proper 301 redirects for dead routes (`/browse` → `/spaces`, `/home` → `/discover`, etc.).
- **Admin toolbar**: Dev-only floating toolbar for impersonation, debug, feature flags.

### Half-Built ⚠️
- **Mobile bottom nav** (`MobileBottomBar` in `AppSidebar.tsx`) — exists but quality of mobile experience unknown.
- **CreatePromptBar** — floating AI prompt bar. Hidden on mobile. Purpose unclear in context of navigation.

### Cut ✂️
- **CreatePromptBar** in the shell — the AI creation prompt doesn't belong in the global nav. It belongs in `/lab`.
- **Campus dock** (`CampusDock.tsx`, `DockOrb.tsx`, `DockPreviewCard.tsx`) — macOS-style dock for campus apps. Experimental UI pattern. Cut.
- **Campus drawer** (`CampusDrawer.tsx`) — mobile campus navigation. Cut — use standard bottom nav.
- **Multiple layout systems**: `packages/ui/src/layouts/` has `DiscoveryLayout`, `FocusFlowLayout`, `ImmersionLayout`, `OrientationLayout`, `ProfileBentoLayout`. These are design experiments. Pick ONE layout strategy.
- **Page transitions** (`page-transitions.tsx`, `PageTransition.tsx`) — animated route transitions. Nice-to-have, not MVP.
- **Spatial depth system** (`spatial-depth.ts`) — z-index management library. Over-built.

### Missing 🚫
- **Breadcrumbs** — when deep in `/s/chess-club/tools/poll-123`, users need to know where they are.
- **Search in nav** — global search accessible from top bar.

### Completion: 75% — Navigation works. Routes are well-organized. Cut the experimental UI patterns.

---

## 9. ADMIN (Bonus — not requested but notable)

The admin app (`apps/admin/`) is **enormous** — 40+ dashboard pages covering analytics, moderation, space health, user management, feature flags, AI quality monitoring, leader health, system alerts, and more. This is a fully-built ops dashboard for a platform that has ~0 users.

**Cut 90% of admin.** Keep: user lookup, space management, feature flags. Delete everything else until you have users generating data worth dashboarding.

---

## FIREBASE COLLECTIONS SUMMARY

| Collection | Status | Notes |
|---|---|---|
| `users` | ✅ Active | Core user profiles |
| `spaces` | ✅ Active | With subcollections (boards, messages, tabs, widgets, placed_tools) |
| `handles` | ✅ Active | Handle uniqueness |
| `schools` | ✅ Active | Campus config |
| `tools` | ✅ Active | HiveLab tools |
| `deployedTools` | ✅ Active | Tool deployments to spaces |
| `notifications` | ✅ Active | User notifications |
| `spaceMembers` | ⚠️ Flat | Should migrate to nested `members` subcollection |
| `events` | ⚠️ Flat | Should migrate to nested under spaces |
| `posts` | ⚠️ Flat | Should migrate to nested under spaces |
| `rsvps` | ⚠️ Flat | Should migrate to nested under events |
| `connections` | ⚠️ Active | Social graph — premature, cut for MVP |
| `activityEvents` | ⚠️ Active | Activity tracking — may be over-collecting |
| `builderRequests` | ✅ Active | Builder role requests |
| `contentReports` | ✅ Active | Moderation reports |
| `toolStates` | ✅ Active | Runtime tool state |
| `automations` | ⚠️ Active | HiveLab automations — cut |
| `sentReminders` | ⚠️ Active | Event reminders — keep |

---

## CODE HEALTH

### Dead Code / Duplication
- **8 auth middleware files** — consolidate to 2
- **Multiple rate limiter implementations** (`rate-limit.ts`, `rate-limit-simple.ts`, `rate-limiter-redis.ts`, `secure-rate-limiter.ts`) — pick one
- **Duplicate profile types** (`profile-system.ts` exists as `.ts`, `.js`, and `.d.ts`)
- **Legacy Firebase functions** in `infrastructure/firebase/functions/` AND `functions/` — two separate function directories
- **Stale migration scripts** in `scripts/` (tool context migration, icon migration, etc.)
- **12 `.png` screenshots** in repo root — remove from git

### Package Bloat
- `packages/core` is trying to be a DDD/Clean Architecture framework with aggregates, value objects, repositories, domain events, specifications. **This is a Firebase CRUD app.** The DDD patterns add complexity without value at this scale.

### Test Coverage
- Good E2E test structure (`apps/web/e2e/`, `apps/web/src/test/e2e/`)
- Integration tests exist for most backend routes
- Unit tests for auth, spaces, feed, tools
- **Problem**: Many test files may be stale/broken given the rapid UI changes

---

## THE RUTHLESS VERDICT

### Keep & Finish (Core Product)
1. **Auth** — 85% done. Consolidate the 8 middleware files. Ship it.
2. **Spaces** — Simplify to Chat + Events + Members. Cut boards/tabs/widgets/modes.
3. **Events** — Add calendar view and push notifications. 70% → 90%.
4. **Discovery** — Build the "What's happening at UB right now" page. 55% → 80%.
5. **Profile** — Strip to essentials. Cut ghost mode, connection strength, activity heatmap.
6. **Notifications** — Wire up triggers for all key events. 65% → 85%.
7. **Navigation** — Already good. Cut experimental patterns.

### Simplify Drastically (Over-Built)
8. **HiveLab** — Strip to: AI prompt → preview → deploy. Cut IDE, automations, setups, custom blocks, learning, benchmarks.
9. **Admin** — Keep user lookup + feature flags. Delete the rest.

### Delete Entirely
- Setups/orchestration system (~15 files)
- Automation engine (~10 files)
- Learning/ML pipeline (~5 files)
- Campus dock/drawer (~5 files)
- DDD infrastructure in `packages/core` (aggregates, value objects, specifications)
- All `.png` screenshots from repo root
- Legacy Firebase functions directory
- Ghost mode (4 files)
- Connection strength / People You May Know
- Builder XP / gamification

### Lines of Code Estimate
- **Current**: ~80,000+ LOC (excluding tests and node_modules)
- **After cuts**: ~45,000 LOC
- **Reduction**: ~44%

---

## PRIORITY ORDER FOR NOON SHIP

If you have to pick 3 things to make HIVE usable for a UB student TODAY:

1. **Auth works** ✅ — it does
2. **Discovery page shows real UB events** — verify CampusLabs sync is running, fix the feed
3. **Spaces let you chat** — verify the chat flow works end-to-end on mobile

Everything else is polish. Ship the core, cut the fluff, iterate with real users.

---

*— Hex, 11:45 AM EST*
