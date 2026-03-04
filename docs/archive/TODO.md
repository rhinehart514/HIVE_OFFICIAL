# HIVE — Complete Implementation TODO

**Generated:** 2026-03-01 | **Source:** 22 parallel audit agents across all surfaces, systems, and cross-cutting concerns | **Scope:** Everything between current state and UB launch-ready

---

## How to Read This

- **P0** = Broken. Silent failures, security violations, dead UI. Fix before any user touches this.
- **P1** = Launch-critical. The spec demands it, users will notice it's missing day one.
- **P2** = Launch-quality. Makes the difference between "interesting" and "I'm telling my friends."
- **P3** = Post-launch. Good ideas that don't gate the first 50 users loving it.
- **Approaches** are listed where genuine technical tradeoffs exist. Where there's one obvious path, it's just stated.

---

## PART 0: P0 BUGS (Silent Failures — Fix First)

These are live in the codebase right now. They make the product look broken or leak data.

### 0.1 — Notifications: All Invisible (Field Name Mismatch)
**File:** `apps/web/src/hooks/use-unread-notifications.ts`
**Bug:** Client queries `where('recipientId', ...)` + `orderBy('createdAt')`. Firestore documents store `userId` + `timestamp`. Every notification query returns empty. Zero users see any notifications.
**Fix:** Change `recipientId` → `userId`, `createdAt` → `timestamp` in the query.
**Effort:** 15 min

### 0.2 — Social Graph: 3 Incompatible Connection Schemas
**Files:** `api/profile/[userId]/follow/route.ts`, `api/spaces/browse-v2/route.ts`, `api/profile/connections/route.ts`
**Bug:** Follow route writes `{ profileId1, profileId2 }`. Browse-v2 reads `{ fromProfileId, toProfileId }`. Connections route hedges across both. Compound `in` query on different fields silently returns empty. All friend signals are broken — mutual connections always 0, "friends attending" always empty.
**Fix:** Canonicalize to one schema. Add denormalized `friendIds[]` array to user doc for fast lookups.
**Approaches:**
- **A — Canonical `connections` with sorted IDs (recommended):** Write `{ userA: min(id1,id2), userB: max(id1,id2) }`. Query with `where('userA', '==', myId)` UNION `where('userB', '==', myId)`. Denormalize `friendIds[]` on the user doc for card-level signals. ~20 hours total.
- **B — Directed edges (Twitter model):** `{ followerId, followingId }`. Simpler queries, but "mutual" requires two reads. Better for asymmetric social graphs.
- **C — Adjacency list on user doc only:** Skip the connections collection entirely. `users/{id}.connections: string[]`. Fast for small graphs (<500 connections). Breaks at scale.
**Effort:** 2-3 days

### 0.3 — Events: GET Route Reads Wrong Collection
**File:** `apps/web/src/app/api/spaces/[spaceId]/events/[eventId]/route.ts`
**Bug:** GET reads from `spaces/{spaceId}/events/{eventId}` (subcollection) but events are stored in the flat `events` collection with a `spaceId` field. Every event detail fetch 404s.
**Fix:** Change to `db.collection('events').doc(eventId).get()` with `spaceId` verification.
**Effort:** 30 min

### 0.4 — Event Reminder Cron: Fires Once/Day Instead of Every 5min
**File:** `vercel.json`
**Bug:** `"schedule": "0 4 * * *"` (4am daily). Should be `"*/5 * * * *"` (every 5 minutes) to catch events starting in the next 15-30 minutes.
**Fix:** Change cron expression.
**Effort:** 5 min

### 0.5 — Campus RSVP Broken for Campus-Wide Events
**Bug:** Events without a `spaceId` (campus-wide) can't be RSVP'd because the RSVP route requires `spaceId` in the path.
**Fix:** Add a campus-level RSVP route or make `spaceId` optional with a `campusId` fallback.
**Effort:** 1 hour

### 0.6 — RSVP Count Invisible on Discover
**File:** `apps/web/src/app/(shell)/discover/page.tsx`
**Bug:** RSVP count rendered at `text-white/25` (25% opacity). Social proof is invisible.
**Fix:** Change to `text-white/70` or use token color.
**Effort:** 5 min

### 0.7 — Profile: Mutual Context Banner Never Fires
**Bug:** `isShared` flag in mutual context logic is never set to `true`. Banner that says "You're both in [Space]" never renders.
**Fix:** Compute `isShared` from intersection of viewer's spaces and profile owner's spaces.
**Effort:** 1 hour

### 0.8 — Profile: Connections Count Expects Array, Gets Integer
**Bug:** UI expects `connections` as an array to call `.length`, API returns a count integer. Renders as `0` always.
**Fix:** Align the type — either return the array or read the integer correctly.
**Effort:** 30 min

### 0.9 — useOnlineUsers: No Campus Isolation (Security)
**File:** `apps/web/src/hooks/use-presence.ts` (line ~177)
**Bug:** Presence query has no `campusId` filter. Every client subscribes to the entire presence collection across all campuses. Privacy violation + performance bomb.
**Fix:** Add `where('campusId', '==', campusId)` + composite index.
**Effort:** 30 min

### 0.10 — Hardcoded Campus Fallback in Events Route
**File:** `apps/web/src/app/api/events/personalized/route.ts` (line ~212)
**Bug:** `getCampusId(request) || 'ub-buffalo'` — fallback leaks UB events to other campuses.
**Fix:** Return 401 if campusId is null.
**Effort:** 5 min

### 0.11 — ⌘K Search Button: Dead UI
**File:** `apps/web/src/components/shell/AppSidebar.tsx`
**Bug:** Search button dispatches a synthetic `KeyboardEvent` that nothing listens to. Clicking search does nothing. No command palette exists.
**Fix:** See Task 4.1 (Shell: ⌘K Command Palette).
**Effort:** 1 day (part of Shell surface work)

### 0.12 — `/build/[toolId]` Is a 404
**Bug:** Middleware redirects `/lab/[toolId]` → `/build/[toolId]`, but no page exists at that route. Every user who tries to edit an existing creation gets a 404.
**Fix:** See Task 10.1 (Build Studio route).
**Effort:** Part of Build Studio surface work

### 0.13 — PWA Install Blocked (No Raster Icons)
**File:** `public/manifest.json`
**Bug:** Only SVG icons. Chrome/Android require 192px and 512px PNG icons to show install prompt. No browser will offer "Add to Home Screen."
**Fix:** Generate PNG icons, add to manifest with `id` and `shortcuts` fields.
**Effort:** 2 hours

### 0.14 — PWA Service Worker: Only Registers After Push Permission
**File:** `apps/web/src/lib/fcm-client.ts`
**Bug:** SW registers inside `requestFCMToken()` only. Users who deny push get no SW — no offline, no install.
**Fix:** Register SW unconditionally on app load in providers.
**Effort:** 30 min

### 0.15 — Push Permission: Dead Code
**File:** `apps/web/src/hooks/use-push-notifications.ts`
**Bug:** `autoRequest` guards on `localStorage.getItem('hive:push-prompted')` but this key is never written anywhere. Push permission is never requested.
**Fix:** Write the key after first space join, trigger permission request explicitly with in-app explainer.
**Effort:** 2 hours

---

## PART 1: FORMAT SHELL SYSTEM (Unblocks Build Entry, Landing, Creation View)

Priority: P1 — This is the technical foundation. Three surfaces depend on it.

### 1.1 — Shell Registry & Type System
Define shell types: `bracket | poll | quiz | countdown | hot-take | decider | whos-down | signup`. Each shell has a config schema (Zod), an HTML template, and a stream-card-type mapping.
**Approaches:**
- **A — TypeScript registry with template literals (recommended):** `SHELL_REGISTRY: Record<ShellType, ShellDefinition>` where `ShellDefinition = { schema: ZodSchema, template: (config) => string, cardType: StreamCardType }`. Templates are tagged template literals returning HTML strings. No React — these render inside iframes.
- **B — File-based registry:** Each shell is a directory (`shells/bracket/`) with `schema.ts`, `template.html`, `preview.png`. More modular, harder to type-check across boundaries.
- **C — React Server Components per shell:** Render shells as RSC, serialize to HTML. Leverages React but adds complexity for what is fundamentally string interpolation.
**Effort:** 1 day

### 1.2 — Classification API (Groq Structured Output)
`POST /api/tools/classify` — takes user prompt, returns `{ shellType, confidence, config }`. Uses Groq structured output with the shell schemas as the response format.
**Approaches:**
- **A — Groq `response_format: { type: "json_schema" }` (recommended):** Send all 8 shell schemas as a discriminated union. Groq returns the classified shell + populated config in ~300ms. Single API call.
- **B — Two-step: classify then populate:** First call returns `shellType` only, second call populates the config for that specific shell. More reliable classification but 2x latency.
- **C — Client-side keyword matching + LLM fallback:** Regex/keyword matching for obvious cases ("bracket" → bracket shell). LLM only for ambiguous prompts. Fastest for common cases, fragile for edge cases.
**Effort:** 1 day

### 1.3 — Campus Data Injection
Static JSON (`campus-data/ub.json`) provides campus-specific content (dorm names, dining halls, landmarks) that feeds into shell templates. The classification API injects campus context into the Groq prompt.
**Effort:** 4 hours

### 1.4 — Shell HTML Templates (8 templates)
Each template is a self-contained HTML/CSS/JS string with HIVE SDK integration (`window.HIVE.getState()`, etc.) and CSS custom properties for theming.
**Effort:** 2-3 days (the bulk of format shell work)

### 1.5 — Preview Panel Integration
Render classified shell in an iframe preview within Build Entry. PostMessage bridge for live config updates.
**Effort:** 4 hours

### 1.6 — 3-Tier Escalation State Machine
Client-side state: `idle → classifying → shell-match → customizing → full-codegen`. Shell match (Tier 1-2, 1-2s) → customization (5-10s) → full code gen (15-30s). User never sees tier boundaries.
**Approaches:**
- **A — `useState` + reducer (recommended):** Simple state machine with `useReducer`. States: `idle | classifying | matched | customizing | generating | complete | error`. Transitions driven by API responses.
- **B — XState:** Formal state machine with guards and actions. More correct, adds a dependency. Overkill for 6 states.
**Effort:** 4 hours

---

## PART 2: BUILD ENTRY (The Wedge — Highest User-Facing Impact)

Priority: P1 — This is the acquisition surface. "Describe what you need → see it in 2 seconds."

### 2.1 — Build Entry Page Rebuild
Prompt input → classification → shell preview → deploy. Full dependency on format shells (Part 1).
**Effort:** 2 days

### 2.2 — Split Panel Layout (Prompt Left, Preview Right)
Desktop: side-by-side. Mobile: stacked with preview below prompt.
**Effort:** 4 hours

### 2.3 — Draft Persistence ("Haunting")
Unsaved creations survive browser close via localStorage. Authenticated creations persist to Firestore temp doc.
**Effort:** 4 hours

### 2.4 — Deploy-as-Conversion Gate
Non-users create on Landing/Build Entry. Signup triggers at deployment, not at creation start. Auth sheet overlays creation (no navigation away). Creation survives auth flow via localStorage + URL token.
**Effort:** 1 day

---

## PART 3: SPACE HOME (Where Members Spend Time — GroupMe Replacement)

Priority: P1

### 3.1 — Kill Tab Bar, Unify Stream
Remove Chat | Events | Posts | Apps tabs. Single stream with 4 interactive card types: event, poll, tool, action.
**Effort:** 2 days

### 3.2 — Interactive Card Types (4 types)
Event card (RSVP inline), poll card (vote inline), tool card (interact inline), action card (structured message with buttons).
**Effort:** 2 days

### 3.3 — Public Event Pages (Critical for GroupMe Strategy)
Events shared in GroupMe need a public landing page at `/e/[eventId]` with RSVP for non-users.
**Effort:** 1 day

### 3.4 — Space History Line (Continuity — One Line)
Context bar: "This space has been active since Jan 2025 · 47 events · 12 tools built." Uses Firestore COUNT aggregation on existing data.
**Effort:** 2 hours

---

## PART 4: SHELL (4 Fixes)

Priority: P1

### 4.1 — ⌘K Command Palette
**Approaches:**
- **A — cmdk library (recommended):** 7KB gzipped, used by Vercel/Linear/Raycast. Portal in `layout.tsx`. Debounced search hits `/api/search`. Results grouped by type + static navigation commands.
- **B — Roll own with Radix Dialog:** No new package, 2x the code, manual keyboard nav.
- **C — Route to `/discover?q=`:** Skip palette, open discover with search prefilled. Viable V1 but loses ⌘K ergonomics.
**Effort:** 1 day

### 4.2 — Mobile Active Indicator
Bottom nav active state. Currently no visual indicator of which tab is active on mobile.
**Effort:** 2 hours

### 4.3 — Bell Icon + Unread Badge
Notification bell in header with unread dot. Depends on fixing notification field names (0.1).
**Effort:** 4 hours

### 4.4 — Mobile Search Sheet
Search entry point for mobile users (no keyboard shortcut). Full-screen overlay on tap.
**Effort:** 4 hours

---

## PART 5: ENTRY & ONBOARDING (7 Screens → 3)

Priority: P1

### 5.1 — Kill Interest Picker Screen
Remove `InterestPicker.tsx` from onboarding flow. Repurpose at `/me/edit` for progressive collection.
**Effort:** 1 hour

### 5.2 — Kill Campus Live + Create Preview Screens
Remove 2 screens. New flow: Email → OTP → Name/Handle → Spaces (auto-join by campus).
**Effort:** 2 hours

### 5.3 — Ambient OTP Activity Screen
While waiting for OTP, show live campus activity (spaces, events, recent creations) instead of a blank "check your email" screen. Builds desire during the wait.
**Effort:** 4 hours

### 5.4 — Path-Aware Entry
If entering from `/t/[toolId]`, redirect to that tool after signup. If from space invite, redirect to space. Read `?redirect=` and `?from_tool=` params.
**Effort:** 2 hours

---

## PART 6: LANDING (Product-as-Landing-Page)

Priority: P1 (depends on format shells)

### 6.1 — Prompt IS the Hero
Replace marketing copy above the fold with a live creation prompt. User types → sees result → hits deploy → signup gate.
**Effort:** 1 day

### 6.2 — Copy Rewrite: "Build" → "Make"
50+ string changes across 12 files. "Build" implies coding ability. "Make" is inclusive. Core messaging shift.
**Key files:** `navigation.ts`, `HeroSection.tsx`, `CTASection.tsx`, `LandingHeader.tsx`, `AppSidebar.tsx`, `ShellCreateBar.tsx`, build page, about page.
**Effort:** 2 hours

### 6.3 — Live Campus Activity Below Fold
Show real UB data: "47 events this week · 12 spaces active · 230 creations made." Proves the platform is alive.
**Effort:** 4 hours

### 6.4 — OG Image for Landing
Custom OG image for `hive.college` — not the generic one. Shows the creation prompt + campus context.
**Effort:** 2 hours

---

## PART 7: DISCOVER (The Daily Open)

Priority: P2

### 7.1 — Remove Tools Filter Bar
Makes discover feel like a directory, not a feed. Events + spaces + trending creations, not a filterable list.
**Effort:** 1 hour

### 7.2 — Add Infinite Scroll
Currently loads one page. No pagination, no scroll-to-load.
**Effort:** 4 hours

### 7.3 — "Happening Now" Section
Live events + active spaces surfaced at the top. Uses existing `/api/spaces/live` endpoint.
**Effort:** 3 hours

### 7.4 — Trending Section
Pre-computed trending scores (cron) for spaces, events, and creations. New `/api/trending` endpoint.
**Effort:** 1 day

### 7.5 — Search Bar on Discover (Mobile Entry Point)
No search affordance on discover page currently. Add input at top, debounced search, inline results.
**Effort:** 4 hours

---

## PART 8: CREATION VIEW — Viral Surface (`/t/[toolId]`)

Priority: P2 — This is the acquisition surface. Every shared link lands here.

### 8.1 — Ghost Voting (Non-Users Can Interact)
**Approaches:**
- **A — Firebase Anonymous Auth (recommended):** Temporary UID, votes count server-side, merge to real account on signup via `linkWithCredential`. No custom fingerprinting.
- **B — Client-side with canvas fingerprint:** Write to `ghost_votes` subcollection tagged with fingerprint. Retroactive attribution on signup. More custom code.
- **C — localStorage only:** Votes don't aggregate server-side. Kills social proof for non-users.
**Effort:** 1 day

### 8.2 — Identity Hook (Conversion Gate)
After interaction, show one line of withheld social context: "3 people from UB voted the same — sign up to see who." Replace generic "Create your own" CTA (currently 10px gray text at 30% opacity).
**Effort:** 4 hours

### 8.3 — Personalized Result Card (Screenshot-Bait)
After voting: "You picked CFA. 34% of UB seniors agree." Styled card with native share. Dynamic OG for shared result URLs.
**Effort:** 1 day

### 8.4 — Per-Creation-Type OG Images
Bracket OG shows bracket. Poll OG shows question + live vote bars. Extend existing `/api/og/tool/[toolId]` with type-aware templates.
**Effort:** 1 day

### 8.5 — Live Participation Pulse
"47 votes · 12 in the last hour" — RTDB counter, realtime listener. Makes every shared link feel live.
**Effort:** 3 hours

### 8.6 — Reaction Rail (No Account Required)
5 emoji reactions below the tool. RTDB counters. Anonymous writes. Social energy for spectators.
**Effort:** 4 hours

### 8.7 — Referral Attribution Token
Append `?ref=creatorHandle` to share URLs. Entry flow writes `referredByTool` + `referredByUser` to new user doc.
**Effort:** 3 hours

### 8.8 — Post-Signup Redirect to Space
After signing up from `/t/[toolId]`, auto-join the tool's space and redirect there. Currently lands on `/discover`.
**Effort:** 2 hours

---

## PART 9: SOCIAL GRAPH (Horizontal Epic — Unblocks Friend Signals Everywhere)

Priority: P2 (parallel track)

### 9.1 — Canonicalize Connection Schema
Pick one schema, migrate existing data, update all read/write paths. See 0.2 for approaches.
**Effort:** 2 days

### 9.2 — Denormalized `friendIds[]` on User Doc
Fast array-contains lookups for card-level friend signals ("Tyler is in this space").
**Effort:** 4 hours

### 9.3 — Space Membership Cross-Reference
Cheapest social signal: "2 CS majors are here" → query who shares spaces with the viewer. No follow data needed.
**Effort:** 4 hours

### 9.4 — Friend Presence on Cards
"Tyler and 2 others are here" on space cards, event cards. Requires 9.1 + 9.2.
**Effort:** 1 day

---

## PART 10: BUILD STUDIO (Refinement Loop)

Priority: P2

### 10.1 — Create `/build/[toolId]` Route
Server component fetches tool (ownership check), mounts Studio client component. `loading.tsx` + `error.tsx`.
**Effort:** 2 hours

### 10.2 — Conversation Persistence API
`tools/{toolId}/conversations/{threadId}` subcollection. GET loads latest thread, POST appends message. Messages as array (bounded ~50).
**Effort:** 4 hours

### 10.3 — `useStudioChat` Hook
New hook (not extending `useLabChat`). Accepts `toolId` as required arg, loads history from Firestore, writes on each turn. Skips pre-creation flow entirely.
**Effort:** 4 hours

### 10.4 — Three-Panel Layout
Chat left (360px), preview center (flex), code panel right (collapsible, default closed). Mobile: tabbed.
**Approaches:**
- **A — CSS Grid + Framer Motion (recommended):** Three named columns, animate `grid-template-columns` on code panel toggle. No drag-to-resize.
- **B — Resizable panels with drag handles:** Power-user UX. ~200 lines of pointer event management.
- **C — `react-resizable-panels` library:** Overkill for a panel that's closed by default.
**Effort:** 4 hours

### 10.5 — Live Preview Panel
Fills center column. Mobile toggle (375px frame). Toggles between Preview and Data (state JSON).
**Effort:** 4 hours

### 10.6 — Code Panel (CodeMirror 6) — Post-Launch
**New package:** `@uiw/react-codemirror` (~50KB). Lazy-loaded when panel opens. 10% of users will open this.
**Effort:** 1 day

### 10.7 — Version History Dropdown
Header pill shows current version. Click → dropdown with version list + one-tap restore.
**Effort:** 4 hours

### 10.8 — Auto-Snapshot on Deploy
Deploy API writes to `tools/{toolId}/versions/{v}` automatically. Currently versions are only created by restore flow.
**Effort:** 2 hours

### 10.9 — Deploy Confirmation Sheet
Bottom sheet showing: target space, member count, changes since last deploy. API needs `memberCount` in response.
**Effort:** 4 hours

### 10.10 — "Edit" Entry Point on Deployed Creations
Add "Edit" button to `/t/[toolId]` (for owner) and space feed `tool_output` cards (for owner + leader). Routes to `/build/[toolId]`.
**Effort:** 2 hours

### 10.11 — Studio System Prompt: Direct-to-Generation
In Studio, every message triggers a generation (no pre-generation conversation phase). Tool already exists — "Add a deadline" should immediately produce an updated preview.
**Effort:** 2 hours

---

## PART 11: EVENTS SYSTEM

Priority: P2

### 11.1 — Event Detail Page
Currently no `/events/[eventId]` page. Events link nowhere. Need: title, description, date, location, RSVP button, attendee list with social proof.
**Effort:** 1 day

### 11.2 — Fix Date Schema (ISO vs Timestamp)
Events store dates as ISO strings (`startDate`) AND Firestore Timestamps (`startAt`). Queries use both inconsistently. Normalize to Firestore Timestamps.
**Effort:** 4 hours + migration

### 11.3 — Event Creation Flow for Leaders
Currently no way to create events in the app (only via admin or API). Add creation flow in Space Home.
**Effort:** 1 day

### 11.4 — Fix Reminder Scheduling
Beyond the cron fix (0.4), event reminders need to fire at `eventStart - 30min`, not on a fixed schedule.
**Approaches:**
- **A — Fine-grained cron (every 5 min) + time-range query:** Cron queries events starting in next 30min, sends reminders. Simple, already the pattern.
- **B — Inngest scheduled jobs:** On event creation, schedule an Inngest function at `startTime - 30min`. Exact timing, durable. Requires Inngest setup.
**Effort:** 2-4 hours depending on approach

---

## PART 12: NOTIFICATIONS SYSTEM

Priority: P2

### 12.1 — Fix Field Name Mismatch (See 0.1)
This is the P0 bug. After fix, also normalize notification preferences: client sends `{ push, email, inApp }`, API expects `{ pushEnabled, emailEnabled }`. Pick one schema.
**Effort:** 2 hours total

### 12.2 — Notification Delivery Service: Fix campusId
**File:** `apps/web/src/lib/notification-service.ts`
**Bug:** `campusId` hardcoded as `CURRENT_CAMPUS_ID`. Should come from the triggering user's session/doc.
**Effort:** 30 min

### 12.3 — Firebase Messaging Service Worker
No `firebase-messaging-sw.js` exists. FCM's default fallback for token refresh will fail. Add minimal SW file or ensure existing `sw.js` handles all FCM paths.
**Effort:** 1 hour

---

## PART 13: ANALYTICS & BUILDER FEEDBACK

Priority: P2

### 13.1 — Fix Usage Counter Pipeline
`wau`, `weeklyInteractions`, `useCount` on tool docs are never written. Builder dashboard shows zeros for everything.
**Approaches:**
- **A — Atomic increment at event write time (recommended):** When `analytics_events` is written, also increment `tools/{toolId}.useCount` and a weekly bucket.
- **B — Firestore aggregation on demand:** `count()` queries filtered by toolId + time range. Expensive per request.
- **C — Inngest background job:** Emit event, async function increments counters.
**Effort:** 2-3 hours

### 13.2 — Wire Milestone Notifications (Call Sites Only)
`notifyToolMilestone` is fully implemented, never called. Add a call after every `useCount` increment that checks thresholds `[10, 50, 100, 500, 1000]`.
**Effort:** 30 min

### 13.3 — Wire `awardXP` to Missing Events
Currently fires for publish (+20) and promote (+30) only. Missing: deploy (+10), remix received (+15), milestones (+25/50/75), feedback (+5).
**Effort:** 1 hour

### 13.4 — XP/Level Display in Builder UI
`builderXp` and `builderLevel` exist on user doc but appear nowhere. Add to StatsBar on `/build` and as badge on Profile. Fix collection mismatch (`awardXP` writes to `users`, profile reads from `profiles`).
**Effort:** 2 hours

### 13.5 — Builder Analytics Panel
`/api/tools/[toolId]/analytics` exists and returns real data. No UI renders it. Build a slide-over panel on `/build` triggered from `ToolCard`.
**Effort:** 3 hours

### 13.6 — Tool Feedback Write Path
`tool_feedback` collection is queried but no write path exists. No user can leave a rating. Add `POST /api/tools/[toolId]/feedback` + in-tool prompt after interaction.
**Effort:** 2 hours

### 13.7 — `analytics_events` Schema Normalization
Some writes use `metadata.toolId` (nested), others use `toolId` (top-level). Analytics route queries the nested path — events with top-level `toolId` are invisible.
**Effort:** 3 hours

---

## PART 14: REAL-TIME ARCHITECTURE

Priority: P2-P3

### 14.1 — Fix Typing Indicator: Wire Keypress
`useTypingIndicator` exists but `setTyping(true)` is only called on send, not keypress. Add debounced (500ms) `onTypingChange(true)` on `ChatInput` onChange.
**Effort:** 1 hour

### 14.2 — Migrate Chat SSE → Firestore Client `onSnapshot`
SSE violates CLAUDE.md ("no new SSE endpoints"), risks Vercel 60s timeout. Replace with direct Firestore `onSnapshot` on `spaces/{spaceId}/boards/main/messages`. Delete `stream/route.ts`.
**Effort:** 3 hours

### 14.3 — Space Online Count via RTDB
Current approach derives count client-side by crossing campus users with members. Make reactive: `space_presence/{spaceId}/{uid}` in RTDB, write on mount, delete on unmount.
**Effort:** 4 hours

### 14.4 — Eliminate Tool State SSE
Two real-time connections per tool (RTDB + SSE). Replace SSE with Firestore client `onSnapshot`. Delete `/api/tools/[toolId]/state/stream`.
**Effort:** 3 hours

### 14.5 — Reduce Presence Heartbeat Interval
`usePresence` fires Firestore write every 60s. Stale threshold is 5 min. Change to 240s — same UX, 4x fewer writes.
**Effort:** 5 min

---

## PART 15: PWA & SERVICE WORKER

Priority: P1 (install + push are distribution)

### 15.1 — Register SW Unconditionally (See 0.14)
**Effort:** 30 min

### 15.2 — Raster Icons + Manifest Fix (See 0.13)
**Effort:** 2 hours

### 15.3 — Push Permission Prompt Timing (See 0.15)
After first space join, show in-app explainer before OS prompt.
**Effort:** 2 hours

### 15.4 — Install Prompt Intercept + Timing
Capture `beforeinstallprompt`, suppress native, show after first value moment (space join).
**Effort:** 4 hours

### 15.5 — Offline Fallback Routing
SW tries `caches.match('/offline')` but offline page is server-rendered, not precached. Fix with Serwist or manual precache.
**Effort:** 1-3 hours

### 15.6 — Navigation Preload
Enable in SW `activate` handler. Use `event.preloadResponse` in fetch. ~20 lines, measurable load time improvement in installed PWA.
**Effort:** 30 min

### 15.7 — Serwist Migration (Post-Launch)
Replace hand-rolled 262-line `sw.js` with `@serwist/next` plugin. Auto-precache Next.js chunks, proper runtime caching strategies.
**Effort:** 2-3 days

### 15.8 — iOS Safari: Splash Screens + Safe Area
No `apple-touch-startup-image` (white flash on launch). Top padding may not account for `env(safe-area-inset-top)` in standalone mode.
**Effort:** 3 hours

### 15.9 — Delete Duplicate FCM Hook
`use-fcm-registration.ts` is dead code (old version of `use-push-notifications.ts`). Delete.
**Effort:** 10 min

---

## PART 16: GROWTH LOOPS & VIRAL

Priority: P2

### 16.1 — Leader: Post-Deploy Invite Prompt
After first tool deploy, modal: "Share this with your org." Pre-composed GroupMe message with invite link.
**Effort:** 4 hours

### 16.2 — Leader: Space QR Code (API Exists, Not Surfaced)
Wire existing `/api/qr` endpoint into `InviteLinkModal`. Add download button.
**Effort:** 2 hours

### 16.3 — Leader: Space Deep Link for Non-Users
`/join/[handle]` public route with space preview + signup CTA. After signup, auto-join space.
**Effort:** 1 day

### 16.4 — Creator: Engagement Overlay on `/t/[toolId]`
When `user.uid === tool.ownerId`, show live metrics drawer: votes/min, total interactions, unique viewers.
**Effort:** 4 hours

### 16.5 — Campus Builder Leaderboard
Ranked by total tool usage, updated daily via cron. Surfaces in Discover.
**Effort:** 3 hours

---

## PART 17: SEARCH & DISCOVERY ENGINE

Priority: P2-P3

### 17.1 — Search Analytics (Zero Visibility Today)
Log every query: `{ campusId, userId, query, resultCount, clickedResultId, timestamp }`. Admin endpoint for top queries, zero-result queries.
**Effort:** 2 hours

### 17.2 — Infix Search + Typo Tolerance
Current search is prefix-only. "science" won't find "Computer Science Club."
**Approaches:**
- **A — Algolia (recommended):** Free tier covers UB. Typo tolerance, faceting, 30ms p50. Cloud Function syncs Firestore → Algolia.
- **B — Typesense self-hosted:** Open source, same API surface. More ops overhead.
- **C — Bigram tokens in Firestore:** `searchTokens: string[]` with all substrings. No typo tolerance. Token bloat.
**Effort:** 2-3 days

### 17.3 — Firestore `_lowercase` Field Audit
Search assumes `name_lowercase`, `title_lowercase` etc. exist on all docs. Events and posts may not have verified write paths for these fields. Audit + backfill.
**Effort:** 3 hours

---

## PART 18: REMAINING SURFACES

### Spaces Hub (P2)
- 18.1 — Fix browse-v2 compound `in` query (Firestore doesn't support compound `in` on different fields)
- 18.2 — Friend presence on cards (depends on 9.1-9.2)
- 18.3 — Activity signals (last message time, event count)

### Profile (P3)
- 18.4 — Impact line: "230 people participated in Sarah's creations"
- 18.5 — Mutual context banner (fix in 0.7 + compute shared spaces)
- 18.6 — Creation portfolio with iframe previews
- 18.7 — Activity heatmap data model

### Settings (P3)
- 18.8 — Account deletion: 30-day grace period (currently immediate)
- 18.9 — Remove dead calendar UI ("Coming this spring" for a feature that doesn't exist)
- 18.10 — Live profile preview in settings
- 18.11 — "Currently building" status field

---

## IMPLEMENTATION ORDER (Recommended)

### Week 1: Stop the Bleeding
P0 bugs (Part 0): ~1 day total. Fix notifications, events, presence, RSVP visibility, manifest, SW registration, push prompt.

### Week 2-3: Foundation
- Format Shell System (Part 1): 4-5 days
- PWA essentials (15.1-15.4): 1 day
- Copy rewrite (6.2): 2 hours

### Week 3-4: The Wedge
- Build Entry (Part 2): 2-3 days
- Entry & Onboarding (Part 5): 1 day
- Landing (Part 6): 1-2 days

### Week 4-5: Where Users Live
- Space Home (Part 3): 3-4 days
- Shell (Part 4): 1-2 days
- Social Graph (Part 9): 2-3 days (parallel track)

### Week 5-6: Growth & Polish
- Creation View viral surface (Part 8): 3-4 days
- Events system (Part 11): 2 days
- Notifications fix (Part 12): 1 day
- Analytics wiring (Part 13): 1 day

### Week 6-7: Refinement
- Build Studio (Part 10): 3-4 days
- Discover (Part 7): 2 days
- Growth loops (Part 16): 2 days

### Post-Launch
- Search engine (Part 17)
- Real-time architecture cleanup (Part 14)
- Profile, Settings, Spaces Hub polish (Part 18)
- Serwist migration (15.7)
- Code panel in Build Studio (10.6)

---

## TOTAL SCOPE ESTIMATE

- **P0 bugs:** ~1 day
- **P1 launch-critical:** ~3-4 weeks
- **P2 launch-quality:** ~2-3 weeks
- **P3 post-launch:** ~2 weeks
- **Total to UB-ready:** ~6-7 weeks of focused work

---

*This document is the contract between what exists and what ships. Every task has been verified against the codebase by specialized audit agents. Approaches are divergent where genuine tradeoffs exist, stated where there's one obvious path.*
