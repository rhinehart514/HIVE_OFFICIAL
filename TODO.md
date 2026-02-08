# HIVE TODO

**Updated:** 2026-02-08
**Focus:** Ship HiveLab to production. A student should be able to create a tool from a template, deploy it to their space, and have members actually use it — without hitting a single broken screen.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-04 | Real-time uses Firebase listeners + SSE, not WebSocket | Simpler architecture, Firebase already deployed. |
| 2026-02-04 | HiveLab automations stored but not executed | Execution engine deferred to post-HiveLab-polish. |
| 2026-02-04 | Entry flow is multi-phase state machine | Gate > Naming > Field > Crossing. Single URL `/enter`. |
| 2026-02-07 | HiveLab is the priority. Everything else is frozen. | Builder experience IS adoption. Vercel's lesson: DX is growth. |
| 2026-02-07 | Tools use predefined action handlers, not custom code | No `new Function()`, no `eval()`. Safe by design. Flexibility via new handlers. |
| 2026-02-07 | Tools exist on 3 surfaces: Spaces, Profiles, Feed | Spaces first. Profiles and Feed come after HiveLab is excellent standalone. |
| 2026-02-07 | 4 creation levels: Instant / Template / AI-Assisted / Full Builder | 60% instant, 25% template, 12% AI, 3% full builder. Target distribution. |
| 2026-02-07 | No app store. Social discovery only. | Tools live in profiles and feeds, not a catalog. |
| 2026-02-07 | Remix is the primary creation pattern | Fork any tool, customize, deploy. More powerful than templates alone. |
| 2026-02-07 | Grid/stack layout deferred. Ship with flow only. | Grid is broken, stack is untested. Flow works. Ship what works. |
| 2026-02-08 | Killed "Commuter Home Base" framing. HIVE serves entire campus. | Product is Spaces (social) + HiveLab (creation) + Discovery (finding things). |

---

## Platform State (Feb 8, 2026)

### Fully Working — Don't Touch
| Area | Score | Details |
|------|-------|---------|
| Auth + Entry | 9/10 | 4-phase entry, JWT sessions, token refresh, state persistence, campus isolation |
| Spaces + Chat | 9/10 | Split panel, real-time chat, typing indicators, reactions, moderation, mobile sidebar |
| HiveLab IDE | 9/10 | 27 elements, canvas, inspector, deploy modal, AI generation, auto-save |
| Explore/Discovery | 8/10 | Spaces, people, events, tools sections. ToolGallery integrated. |
| Design System | 9/10 | 694 UI files, tokens-first, motion system, full primitives. Zero hardcoded colors. |
| Middleware + Security | 9/10 | Edge auth, rate limiting, CSRF, campus isolation, content moderation |
| Landing + About | 9/10 | Marketing site with hero, product, social proof, comparison |
| Navigation | 9/10 | AppShell sidebar (desktop), bottom nav + hamburger (mobile), gold active indicators |
| Profile | 8/10 | Server-rendered, gallery, activity, connections |

### Recently Fixed (This Session)
- [x] Removed `/lab` from PUBLIC_ROUTES (was unauthenticated)
- [x] Fixed Spaces nav regex (didn't match `/s/handle` paths)
- [x] Fixed hardcoded `campusId: 'ub-buffalo'` (uses session now)
- [x] Added mobile hamburger to AppShell + Space layout
- [x] Fixed DM badge duplication
- [x] Consolidated deploy/preview pages to IDE params
- [x] Fixed auto-save false positive on initial load
- [x] Replaced all `window.confirm()` with inline confirmation UI
- [x] Added search Enter-to-select
- [x] Fixed optimistic message author info (was 'current-user'/'You')
- [x] Fixed loading skeleton layout mismatch
- [x] Added token refresh before entry completion
- [x] Added entry state persistence (sessionStorage)
- [x] Fixed dynamic Tailwind class in moderation panel
- [x] Removed dead `/explore/people` link
- [x] Fixed event card links to use space routes
- [x] Added ToolGallery to explore page
- [x] Standardized 34+ background tokens to CSS vars
- [x] Standardized border tokens (removed zinc/hex outliers)
- [x] Removed unused fonts (Space Grotesk, JetBrains Mono)

---

## What Exists (Working)

Don't rebuild these — extend them.

| Component | Status | Location |
|-----------|--------|----------|
| 27 elements | Registry complete | `packages/core/src/domain/hivelab/element-registry.ts` |
| 23 templates | All `ready` | `packages/ui/src/lib/hivelab/quick-templates.ts` |
| Builder canvas | Working (flow layout) | `packages/ui/src/components/hivelab/StreamingCanvasView.tsx` |
| Element renderers | Working (some stubs) | `packages/ui/src/components/hivelab/element-renderers.tsx` |
| Tool state (shared + user) | Working | `apps/web/src/hooks/use-tool-runtime.ts` |
| Real-time RTDB sync | Working | Firebase RTDB broadcast on action execution |
| Action execution API | Working | `apps/web/src/app/api/tools/execute/route.ts` |
| Publishing flow | Working | `apps/web/src/app/api/tools/publish/route.ts` |
| Deploy to space flow | Working | `packages/ui/src/components/hivelab/ToolDeployModal.tsx` |
| PlacedTool data model | Working | `packages/core/src/domain/spaces/entities/placed-tool.ts` |
| Space tools API | Working | `apps/web/src/app/api/spaces/[spaceId]/tools/route.ts` |
| Capability governance | Working | `packages/core/src/domain/hivelab/capabilities.ts` |
| AI generation (Gemini) | Working | `apps/web/src/lib/firebase-ai-generator.ts` |
| Sidebar tool cards | Working | `apps/web/src/components/spaces/sidebar-tool-section.tsx` |
| Creator dashboard | Working | `apps/web/src/app/lab/page.tsx` |
| IDE editor | Working | `apps/web/src/app/lab/[toolId]/page.tsx` |
| Template gallery | Working | `apps/web/src/app/lab/templates/page.tsx` |
| Conversational creator | Working | `apps/web/src/components/hivelab/conversational/` |
| Builder level + stats | Working | `apps/web/src/components/hivelab/dashboard/` |
| Feedback modal | Working | `apps/web/src/components/hivelab/FeedbackModal.tsx` |

---

## PRODUCTION GATE: Must Ship

Everything below this line blocks launch. No exceptions.

---

### 1. Fix Element Renderers (The Big One)

Element registry says 27 elements. Runtime renderers for several are stubs returning mock data or empty containers. A user deploys a "Leaderboard" template and gets hardcoded fake data — that's a broken product.

**Audit and fix the top-used elements:**

- [ ] **Poll element** — Verify: vote submission, results display, percentage bars, multi-option. Must work end-to-end with execute API.
- [ ] **Counter element** — Verify: increment/decrement, display, shared state sync across users.
- [ ] **RSVP element** — Verify: RSVP action, attendee count, user's own RSVP status, capacity limits.
- [ ] **Countdown element** — Verify: target date config, live countdown, expired state.
- [ ] **Leaderboard element** — Replace hardcoded mock data with real shared state. Render sorted entries from tool state.
- [ ] **Chart display element** — Wire up Recharts. Render data from shared state (bar, line, pie based on config). Currently empty container.
- [ ] **Form builder element** — Dynamic field rendering from config. Currently no fields render. Minimum: text input, select, checkbox.
- [ ] **Result list element** — Render collection from shared state. Filter, sort, pagination.
- [ ] **Progress indicator element** — Render percentage from shared state. Visual bar + label.
- [ ] **Tag cloud element** — Render tags from shared state with frequency-based sizing.

**Acceptance:** Deploy each of the 23 templates. Every element in every template must render real data and respond to user interaction. No mock data, no empty containers.

---

### 2. Consumer Tool View

The page at `/s/[handle]/tools/[toolId]` is where real users interact with tools. It's functional but raw. This is the most-visited page in HiveLab's lifecycle — every tool user hits it.

- [ ] **Tool header** — Tool name, creator name with link, usage count, back to space nav. Currently minimal.
- [ ] **Share button** — Copy link to clipboard. That's it for v1. No QR, no social.
- [ ] **Loading state** — Element-shaped skeleton placeholders instead of generic shimmer grid. Match the tool's actual layout.
- [ ] **Empty states** — Every element type needs a guided empty state. Poll with no votes: "Be the first to vote." RSVP with no attendees: "No one has RSVPed yet." Never "No data."
- [ ] **Error recovery** — When an action fails, show what happened and a retry button with context. Not just "Error."
- [ ] **Mobile layout** — Test all elements at 375px. Fix overflow, touch targets (min 44px), text truncation. Flow layout should stack to single column on mobile.
- [ ] **Interaction feedback** — Micro-animation on every user action. Vote submitted: bar grows. RSVP: checkmark appears. Counter: number ticks. Use motion tokens, <200ms.

**Acceptance:** Hand phone to a friend. They open a tool link, understand what it does, interact with it, and see their action reflected. No confusion, no broken screens.

---

### 3. Template Quick-Deploy (Happy Path)

60% of tools should come from templates. The current flow works but has friction. The happy path should be: browse templates → pick one → fill 2-3 fields → deploy to space → done.

- [ ] **One-tap deploy for simple templates** — For 1-2 element templates (Quick Poll, Countdown, Announcements), skip the builder. Tap → configure fields in modal → deploy. QuickDeployModal exists but verify it works end-to-end.
- [ ] **Template preview** — Show a visual preview of what the tool looks like before committing. Static render of the composition, not interactive.
- [ ] **Deploy success → tool link** — After deploy, show the tool URL and a "View in space" button. Currently success animation plays but no clear next action.
- [ ] **Template categories in gallery** — Group templates by function (events, engagement, feedback, teams). Currently flat list.

**Acceptance:** New user goes from `/lab` to a working deployed tool in under 2 minutes using a template. Time it.

---

### 4. Kill Broken Features

Shipping broken features is worse than shipping no features. Remove or gate anything that doesn't work.

- [ ] **Remove grid/stack layout options from UI** — Only flow layout works. Remove the layout selector from the builder until grid/stack are real. Don't let users pick a broken option.
- [ ] **Gate element connections UI** — Connections aren't functional at runtime. If connection UI exists in the IDE, hide it. Show it when connections actually work.
- [ ] **Hide incomplete elements from palette** — If an element renderer is a stub (returns mock data), don't show it in the element palette. Users shouldn't be able to add broken elements.
- [ ] **Audit new elements** — Checklist, Signup Sheet, Directory, QR Code have stub implementations. Either finish them or remove from registry until they work.
- [ ] **Remove unused builder-level/XP UI** — If builder levels aren't calculated, don't show the level display. Empty progress bars are worse than no progress bars.

**Acceptance:** Every button does something real. Every element renders real data. Every option in the UI leads to a working feature.

---

### 5. Deploy + Publish Flow

The path from "I built a tool" to "people are using it" must be bulletproof.

- [ ] **Deploy to space — end-to-end test** — Create tool → deploy to space → verify tool appears in space sidebar → verify tool opens and works → verify interactions are recorded. Manual test, document any failures.
- [ ] **Deploy validation** — Before deploy, validate the tool composition. No broken elements, no empty required fields. Show specific errors ("Your poll needs at least 2 options") not generic "Invalid tool."
- [ ] **Permissions on deployed tools** — Verify canView/canInteract/canEdit permissions work. A space member who can view but not interact should see the tool but buttons should be disabled.
- [ ] **Deploy to profile** — Verify the profile deployment path works (separate from space deploy). Tool should appear on creator's profile.
- [ ] **Undeploy/remove** — Space leaders need to remove a deployed tool. Verify the remove flow works.

**Acceptance:** Deploy a tool to a space. 3 different test accounts interact with it. All interactions visible. Remove the tool. It's gone.

---

### 6. Creator Dashboard (Minimum Viable)

The `/lab` page is the builder's home. It works but some displayed data is incomplete.

- [ ] **My tools list** — Verify `/api/tools/my-tools` returns real data. Each card should show: name, status (draft/deployed/published), deployment count, last edited.
- [ ] **Stats accuracy** — Stats bar shows total tools, total users, weekly interactions. Verify these numbers are real, not 0 or stale.
- [ ] **Create new tool flow** — "Name a new tool..." input → routes to builder. Verify the routing works and the tool is created in Firestore.
- [ ] **Delete/archive tool** — Creator should be able to remove a tool they built. Verify this works and removes from all deployed locations.

**Acceptance:** Builder logs in, sees their tools with accurate stats, creates a new one, deletes an old one. All real data.

---

### 7. AI Generation (Minimum Viable)

AI generation works (Gemini integration is live). It needs to produce usable output.

- [ ] **Generate → review → deploy** — User describes tool → AI generates composition → user sees it in builder → can deploy immediately. Verify this full flow.
- [ ] **Generation quality** — AI output should only use elements whose renderers are functional. If chart/form renderers are stubs, exclude those elements from AI generation prompts.
- [ ] **Template suggestion** — Before generating from scratch, check if user's description matches a template. "Sounds like Quick Poll — use it?" Saves generation time and produces better results.
- [ ] **Error handling** — If generation fails (API error, timeout, bad output), show a clear message and offer to retry or start from template instead.

**Acceptance:** Describe "a poll for picking our next event" → get a working poll tool → deploy it → it works.

---

## TECH DEBT: Fix Before Scale

Not launch blockers, but fix before adding users.

### Security (P1)
- [ ] **57 API routes bypass standard middleware** — Admin schools, feature-flags, AI quality routes use raw `async function` instead of `withAdminAuthAndErrors`. Audit and wrap.
- [ ] **Standardize admin auth** — Replace all `validateApiAuth` with `withAdminAuthAndErrors`. One pattern.
- [ ] **Add Zod to remaining admin routes** — 37% of routes lack validation. Admin routes especially need it.

### Code Cleanup (P2)
- [ ] **Re-enable ESLint** — `ignoreDuringBuilds: true` in next.config.mjs. Fix warnings incrementally.
- [ ] **Fix admin build** — `useSearchParams()` needs Suspense boundary on `/users` page.
- [ ] **Delete duplicate hooks** — `use-chat-messages.ts` vs `chat/use-chat-messages.ts`, `use-unread-count.ts` vs `queries/use-unread-count.ts`.
- [ ] **Delete unused Zustand store** — `useUnifiedStore` in unified-state-management.ts is dead code.
- [ ] **Remove deprecated `use-session.ts`** — Migrate remaining consumers to `useAuth`.
- [ ] **Install missing Radix deps** — ScrollArea, AspectRatio (@radix-ui packages).
- [ ] **Consolidate real-time transport** — Chat (SSE) vs notifications (Firestore) vs space events (Firestore). Pick one.

---

## POST-LAUNCH: Next Up

Ship the production gate first. Then these, roughly in order:

### Remix System
- Remix button on published tools
- Copy composition + open in builder
- Creator credit on remixed tools
- Remix count metric

### Element Connections
- UI to connect element outputs → inputs in IDE
- Runtime evaluation of connections
- Data flow between elements

### New Elements (finish stubs)
- Signup Sheet (slot-based signups)
- Checklist Tracker (shared progress)
- Directory List (searchable member list)
- QR Code Generator (physical distribution)
- Schedule Picker (When2Meet alternative)
- Voting Board (ranked choice)

### Creator Analytics
- Per-tool usage dashboard
- Interaction trends over time
- User feedback inbox
- Usage milestone notifications

### AI Refinement
- Iterative editing ("add a counter to this")
- Regenerate individual elements
- Quality gate before publish

### External Connections
- Google Calendar sync
- GroupMe bot notifications
- Discord/Slack webhooks
- iCal import/export

---

## Platform Numbers

| Metric | Count |
|--------|-------|
| Pages | 66 |
| API Routes | 333 |
| Feature Components | 138 |
| UI Package Files | 694 |
| App Hooks | 77 |
| Shared Hooks | 20 |
| Design Token Files | 19 |
| Cloud Functions | 47 |
| Zod Schemas | 50+ |
| Core Domain Files | 130 |
| HiveLab Elements | 27 |
| HiveLab Templates | 23 |

---

## Spec Reference

Full spec: `docs/specs/HIVELAB_SPEC.md`
Research: `docs/research/` (12 documents)
Strategy: `docs/strategy/` (12 documents)
Design: `docs/DESIGN_DIRECTION.md`
