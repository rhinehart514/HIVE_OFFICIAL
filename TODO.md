# HIVE TODO

**Updated:** 2026-02-08
**Focus:** HIVE is a creation platform. Students build tools, share them anywhere, see results. Ship the creation experience first — social features are distribution, not the product.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-04 | Real-time uses Firebase listeners + SSE, not WebSocket | Simpler architecture, Firebase already deployed. |
| 2026-02-04 | HiveLab automations stored but not executed | Execution engine deferred to post-HiveLab-polish. |
| 2026-02-04 | Entry flow is multi-phase state machine | Gate > Naming > Field > Crossing. Single URL `/enter`. |
| 2026-02-07 | Tools use predefined action handlers, not custom code | No `new Function()`, no `eval()`. Safe by design. Flexibility via new handlers. |
| 2026-02-07 | Tools exist on 3 surfaces: Spaces, Profiles, Feed | Spaces first. Profiles and Feed come after standalone is excellent. |
| 2026-02-07 | 4 creation levels: Instant / Template / AI-Assisted / Full Builder | 60% instant, 25% template, 12% AI, 3% full builder. Target distribution. |
| 2026-02-07 | No app store. Social discovery only. | Tools live in profiles and feeds, not a catalog. |
| 2026-02-07 | Remix is the primary creation pattern | Fork any tool, customize, deploy. More powerful than templates alone. |
| 2026-02-07 | Grid/stack layout deferred. Ship with flow only. | Grid is broken, stack is untested. Flow works. Ship what works. |
| 2026-02-08 | **HIVE is a creation platform, not a social platform.** | The moat is "build tools in seconds, share anywhere." Social is distribution, not the product. |
| 2026-02-08 | Navigation leads with Create, not Home. | Creator dashboard is the first thing you see after auth. Spaces and Explore are secondary. |
| 2026-02-08 | Tools need standalone URLs, independent of spaces. | Distribution is the student's choice: GroupMe, iMessage, QR codes, flyers, anywhere. Not locked to HIVE. |
| 2026-02-08 | Landing page sells creation, not org management. | "Build it. Share it." not "One place to run your org." |

---

## Platform State (Feb 8, 2026)

### Creation Engine (The Product)
| Area | Score | Details |
|------|-------|---------|
| HiveLab IDE | 9/10 | 27 elements, canvas, inspector, deploy modal, AI generation, auto-save |
| Template Gallery | 9/10 | 23 templates, quick-start chips, category browsing |
| AI Generation | 8/10 | Gemini integration, conversational creator, works end-to-end |
| Creator Dashboard | 8/10 | Stats bar, tool grid, builder level, quick-start |
| Element Registry | 7/10 | 27 registered but several renderers are stubs. Top priority. |
| Standalone Tool URLs | 0/10 | Share token generation exists, but `/t/[id]` route doesn't. Blocker. |

### Distribution Layer (Supports the Product)
| Area | Score | Details |
|------|-------|---------|
| Spaces + Chat | 9/10 | Split panel, real-time chat, typing indicators, reactions, moderation |
| Deploy to Space | 8/10 | Modal works, sidebar integration, permissions |
| Explore/Discovery | 8/10 | Spaces, people, events, tools sections |

### Platform Infrastructure
| Area | Score | Details |
|------|-------|---------|
| Auth + Entry | 9/10 | 4-phase entry, JWT sessions, token refresh, state persistence, campus isolation |
| Design System | 9/10 | 694 UI files, tokens-first, motion system, full primitives |
| Middleware + Security | 9/10 | Edge auth, rate limiting, CSRF, campus isolation, content moderation |
| Navigation | 9/10 | Create-first nav, AppShell sidebar (desktop), bottom nav (mobile) |
| Landing Page | 9/10 | Creation-focused messaging, "build it. share it." |
| Profile | 8/10 | Server-rendered, gallery, activity, connections |

### Recently Fixed (This Session)
- [x] Restructured navigation: Create → Spaces → Explore → You (creation first)
- [x] Middleware redirects authenticated users to `/lab` (creator dashboard)
- [x] `/home` redirects to `/lab`
- [x] Rewrote entire landing page for creation platform positioning
- [x] Updated page metadata: "HIVE — build it. share it."
- [x] Previous session fixes: dead code cleanup, ESLint re-enabled, logger migration, token standardization, Zod validation on 8 high-risk routes

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
| Share token generation | Working | `apps/web/src/app/api/tools/[toolId]/share/route.ts` |
| Deploy to space flow | Working | `packages/ui/src/components/hivelab/ToolDeployModal.tsx` |
| PlacedTool data model | Working | `packages/core/src/domain/spaces/entities/placed-tool.ts` |
| Space tools API | Working | `apps/web/src/app/api/spaces/[spaceId]/tools/route.ts` |
| Capability governance | Working | `packages/core/src/domain/hivelab/capabilities.ts` |
| AI generation (Gemini) | Working | `apps/web/src/lib/firebase-ai-generator.ts` |
| Conversational creator | Working | `apps/web/src/components/hivelab/conversational/` |
| Creator dashboard | Working | `apps/web/src/app/lab/page.tsx` |
| IDE editor | Working | `apps/web/src/app/lab/[toolId]/page.tsx` |
| Template gallery | Working | `apps/web/src/app/lab/templates/page.tsx` |

---

## PRODUCTION GATE: Must Ship

Everything below this line blocks launch. No exceptions.

---

### 1. Fix Element Renderers (The Big One)

Element registry says 27 elements. Runtime renderers for several are stubs returning mock data or empty containers. This is the actual product — if elements don't work, nothing works.

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

### 2. Standalone Tool URLs (Share Anywhere)

The entire value prop is "build it, share it anywhere." Tools MUST work outside of HIVE spaces. A student drops a link in GroupMe — their friends open it — it works. No HIVE account required for viewing.

**Current state:** Share token generation exists at `/api/tools/[toolId]/share`. It produces tokens and URLs. But the actual page at that URL doesn't exist.

- [ ] **Create `/t/[toolId]` route** — Standalone tool page. No space chrome, no sidebar. Just the tool, full screen, mobile-first. Authenticated users see full interaction; unauthenticated see read-only view with "Sign in to interact" prompt.
- [ ] **Decouple ToolRuntimeProvider from space context** — Make `spaceId` optional. Standalone tools use a `standalone:{toolId}` deployment context for state.
- [ ] **Copy-link sharing** — One-tap "Copy link" on any tool. Format: `hive.app/t/{toolId}`. Works immediately.
- [ ] **Open Graph tags** — Tool name, description, and preview in link unfurls. When someone pastes a tool link in iMessage/GroupMe, it should look good.
- [ ] **QR code generation** — Generate QR code for any tool. One tap to download/share. For physical distribution (flyers, posters, event tables).
- [ ] **Mobile-first consumer view** — The standalone page is optimized for phone screens first. 375px minimum. Touch targets 44px+.

**Acceptance:** Build a poll. Copy the link. Text it to a friend who doesn't have HIVE. They open it on their phone, see the poll, sign in with campus email, vote. Result appears live for both of you.

---

### 3. Consumer Tool View (Polish)

Whether accessed via `/t/[toolId]` or `/s/[handle]/tools/[toolId]`, the tool view is where real users interact. It's the most-visited surface.

- [ ] **Tool header** — Tool name, creator name with link, usage count, share button. Clean, minimal.
- [ ] **Loading state** — Element-shaped skeleton placeholders instead of generic shimmer grid. Match the tool's actual layout.
- [ ] **Empty states** — Every element type needs a guided empty state. Poll with no votes: "Be the first to vote." RSVP with no attendees: "No one has RSVPed yet." Never "No data."
- [ ] **Error recovery** — When an action fails, show what happened and a retry button with context. Not just "Error."
- [ ] **Interaction feedback** — Micro-animation on every user action. Vote submitted: bar grows. RSVP: checkmark appears. Counter: number ticks. Use motion tokens, <200ms.

**Acceptance:** Hand phone to a friend. They open a tool link, understand what it does, interact with it, and see their action reflected. No confusion, no broken screens.

---

### 4. Template Quick-Deploy (Happy Path)

60% of tools should come from templates. The happy path: browse templates → pick one → fill 2-3 fields → get a link. Under 2 minutes.

- [ ] **One-tap deploy for simple templates** — For 1-2 element templates (Quick Poll, Countdown, Announcements), skip the builder. Tap → configure fields in modal → get shareable link immediately.
- [ ] **Template preview** — Show a visual preview of what the tool looks like before committing. Static render of the composition.
- [ ] **Deploy success → shareable link** — After deploy, show the tool URL, a copy button, and a QR code. The next action is always "share this."
- [ ] **Template categories in gallery** — Group templates by function (events, engagement, feedback, teams). Currently flat list.

**Acceptance:** New user goes from `/lab` to a working shareable tool link in under 2 minutes using a template. Time it.

---

### 5. Kill Broken Features

Shipping broken features is worse than shipping no features. Remove or gate anything that doesn't work.

- [ ] **Remove grid/stack layout options from UI** — Only flow layout works. Remove the layout selector from the builder.
- [ ] **Gate element connections UI** — Connections aren't functional at runtime. Hide until they work.
- [ ] **Hide incomplete elements from palette** — If an element renderer is a stub, don't show it in the element palette.
- [ ] **Audit new elements** — Checklist, Signup Sheet, Directory, QR Code have stub implementations. Either finish them or remove from registry.
- [ ] **Remove unused builder-level/XP UI** — If builder levels aren't calculated, don't show the level display.

**Acceptance:** Every button does something real. Every element renders real data. Every option in the UI leads to a working feature.

---

### 6. Deploy + Publish Flow

The path from "I built a tool" to "people are using it" must be bulletproof.

- [ ] **Deploy end-to-end test** — Create tool → deploy → verify tool works → verify interactions are recorded. Manual test, document any failures.
- [ ] **Deploy validation** — Before deploy, validate the tool composition. No broken elements, no empty required fields. Show specific errors ("Your poll needs at least 2 options") not generic "Invalid tool."
- [ ] **Permissions on deployed tools** — Verify canView/canInteract/canEdit permissions work for space-deployed tools.
- [ ] **Deploy to profile** — Verify the profile deployment path works (separate from space deploy).
- [ ] **Undeploy/remove** — Space leaders need to remove a deployed tool. Verify the remove flow works.

**Acceptance:** Deploy a tool. 3 different test accounts interact with it via standalone link. All interactions visible. Remove the tool. It's gone.

---

### 7. Creator Dashboard (Home Screen)

The `/lab` page is now HOME. It's the first thing every user sees. It needs to sell creation immediately.

- [ ] **My tools list** — Verify `/api/tools/my-tools` returns real data. Each card should show: name, status (draft/live), share count, last edited.
- [ ] **Stats accuracy** — Stats bar shows total tools, total users, weekly interactions. Verify these numbers are real, not 0 or stale.
- [ ] **Create new tool flow** — "Name a new tool..." input → routes to builder. Verify routing works and tool is created in Firestore.
- [ ] **Delete/archive tool** — Creator should be able to remove a tool they built. Verify this works and removes from all deployed locations.
- [ ] **Empty state optimization** — For new users, the hero and template cards must be compelling enough to start building immediately.

**Acceptance:** New user lands on `/lab`, understands what HIVE is within 3 seconds, starts building within 10 seconds.

---

### 8. AI Generation (Minimum Viable)

AI generation works (Gemini integration is live). It needs to produce usable output.

- [ ] **Generate → review → share** — User describes tool → AI generates composition → user sees it in builder → can share immediately.
- [ ] **Generation quality** — AI output should only use elements whose renderers are functional. Exclude broken elements from prompts.
- [ ] **Template suggestion** — Before generating from scratch, check if description matches a template. "Sounds like Quick Poll — use it?"
- [ ] **Error handling** — If generation fails, show clear message and offer retry or template fallback.

**Acceptance:** Describe "a poll for picking our next event" → get a working poll tool → share the link → it works.

---

## TECH DEBT: Fix Before Scale

Not launch blockers, but fix before adding users.

### Security (P1)
- [ ] **93 API routes bypass standard middleware** — Migrate to standard wrappers from `@/lib/middleware/`.
- [ ] **Add Zod to remaining routes** — ~37% of routes lack body validation. Prioritize mutation endpoints.

### Code Quality (P2)
- [ ] **Consolidate real-time transport** — Chat uses SSE, notifications use Firestore `onSnapshot`, tools use Firebase RTDB. Document or consolidate.

---

## POST-LAUNCH: Next Up

Ship the production gate first. Then these, roughly in order:

### Remix System
- Remix button on published tools
- Copy composition + open in builder
- Creator credit on remixed tools
- Remix count metric

### Distribution Expansion
- Embed tools in external sites (iframe/widget)
- Canvas LMS integration
- Social media card previews
- Tool collections / bundles

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
- Share tracking (where are clicks coming from)
- Usage milestone notifications

### AI Refinement
- Iterative editing ("add a counter to this")
- Regenerate individual elements
- Quality gate before publish

### Social Layer (Distribution)
- Spaces as tool deployment surfaces (already working)
- Profile tool showcase
- Feed integration for tool discovery
- Tool recommendations based on campus activity

---

## Platform Numbers

| Metric | Count |
|--------|-------|
| Pages | 66 |
| API Routes | 336 |
| Feature Components | 138 |
| UI Package Files | 694 |
| App Hooks | 58 |
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
