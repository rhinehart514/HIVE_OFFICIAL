# Spaces Execution Plan

**Author:** exec-planner
**Date:** 2026-02-07
**Inputs:** Product Strategy, Code Audit (178 files, 53% ship / 28% fix / 19% kill), Strategy Alignment (15 feature clusters rated), Gap Analysis (28 gaps, 38-56 dev-days)
**Team:** 2 developers, targeting Fall 2026 Activities Fair launch
**Total P0 effort:** ~15-21 dev-days with 2 devs in parallel = ~3 weeks to launch-ready

---

## 1. Kill List

Everything below gets removed or hidden BEFORE any new features are built. Estimated total: **1.5 days, 1 dev.**

### 1.1 Quorum Gate -- REMOVE NOW

The 10-member activation threshold blocks the entire 30-leader pre-launch. Leaders claim spaces with 1-3 e-board members and can't use full features for weeks. Self-sabotage.

**File:** `packages/core/src/domain/spaces/aggregates/enhanced-space.ts` (line ~100)
**Change:** `export const DEFAULT_ACTIVATION_THRESHOLD = 10;` --> `export const DEFAULT_ACTIVATION_THRESHOLD = 1;`
**Verify:** Check all references in `apps/admin/` that display activation progress bars still render correctly with threshold=1.
**Effort:** 30 minutes

### 1.2 SpaceId Crypto Fix -- FIX NOW (Security)

`SpaceId.generate()` uses `Math.random()` -- predictable IDs.

**File:** `packages/core/src/domain/spaces/value-objects/space-id.value.ts` (line ~36)
**Change:** Replace `Math.random().toString(36).substr(2, 9)` with `crypto.randomUUID().replace(/-/g, '').slice(0, 12)`
**Effort:** 15 minutes

### 1.3 Seed Route Production Gate -- FIX NOW (Security)

**File:** `apps/web/src/app/api/spaces/seed/route.ts`
**Change:** Add early return: `if (process.env.NODE_ENV === 'production') return respond.error('Not available in production', 'FORBIDDEN', { status: 403 });` OR switch to `withAdminAuthAndErrors` wrapper.
**Effort:** 15 minutes

### 1.4 Deprecated Browse Route -- DELETE

**File:** `apps/web/src/app/api/spaces/browse/route.ts`
**Action:** Delete the file. `browse-v2/route.ts` is the replacement.
**Verify:** Search codebase for imports/calls to `/api/spaces/browse` -- update any remaining references to `/api/spaces/browse-v2`.
**Effort:** 30 minutes

### 1.5 HiveLab Features -- HIDE VIA FEATURE FLAGS

Don't delete code. Use existing feature flag system (`apps/web/src/hooks/use-feature-flags.ts`). Add a `hiveLabInSpaces: false` flag.

**UI Components to gate (6 files):**
- `packages/ui/src/design-system/components/spaces/ToolsMode.tsx` -- return null when flag off
- `apps/web/src/components/spaces/sidebar-tool-section.tsx` -- return null when flag off
- `apps/web/src/components/spaces/sidebar-tool-card.tsx` -- return null when flag off
- `apps/web/src/components/spaces/builder/BuilderShell.tsx` -- return null when flag off
- `apps/web/src/components/spaces/builder/TemplateCard.tsx` -- return null when flag off
- `apps/web/src/components/spaces/builder/AccessOption.tsx` -- return null when flag off

**Modals to strip HiveLab options from (4 files):**
- `packages/ui/src/design-system/components/spaces/AddTabModal.tsx` -- filter out HiveLab tab types
- `packages/ui/src/design-system/components/spaces/AddWidgetModal.tsx` -- filter out HiveLab widget types
- `packages/ui/src/design-system/components/spaces/SpaceLeaderOnboardingModal.tsx` -- remove "deploy tools" steps
- `packages/ui/src/design-system/components/spaces/MobileActionBar.tsx` -- remove HiveLab drawer options

**Domain files (leave in code, not user-facing):**
- `packages/core/src/domain/spaces/entities/inline-component.ts` -- no action needed, not surfaced
- `packages/core/src/domain/spaces/entities/placed-tool.ts` -- no action needed
- `packages/core/src/domain/spaces/space-capabilities.ts` -- no action needed

**Effort:** 3-4 hours

### 1.6 Governance Model -- DEFAULT TO HIERARCHICAL

**File:** `packages/core/src/domain/spaces/aggregates/enhanced-space.ts`
**Change:** Default governance model to `hierarchical` in space creation logic.

**File:** `packages/validation/src/schemas/space.schema.ts`
**Change:** Set governance default to `hierarchical`.

**UI:** Hide governance selector from `SpaceCreationModal.tsx` (check `apps/web/src/components/spaces/SpaceCreationModal.tsx`).
**Effort:** 30 minutes

### 1.7 Webhooks -- HIDE FROM UI

**API routes exist and are clean -- leave them:**
- `apps/web/src/app/api/spaces/[spaceId]/webhooks/route.ts`
- `apps/web/src/app/api/spaces/[spaceId]/webhooks/[webhookId]/route.ts`

**Action:** Remove any webhook management UI from space settings. Feature-flag it like HiveLab.
**Effort:** 30 minutes

### 1.8 Widget/Tab Customization -- HIDE UI

Templates still auto-deploy defaults. Just hide "Add Tab" and "Add Widget" buttons.

**Files:**
- `packages/ui/src/design-system/components/spaces/AddTabModal.tsx` -- don't render trigger button (flag gate)
- `packages/ui/src/design-system/components/spaces/AddWidgetModal.tsx` -- don't render trigger button (flag gate)

**Effort:** 15 minutes

### Kill List Verification Note

The code audit listed several routes as "Kill" that **do not exist on disk**:
- `[spaceId]/tools/route.ts` -- NOT FOUND
- `[spaceId]/tools/feature/route.ts` -- NOT FOUND
- `[spaceId]/apps/[deploymentId]/route.ts` -- NOT FOUND
- `[spaceId]/tool-connections/route.ts` -- NOT FOUND
- `[spaceId]/tool-connections/[connectionId]/route.ts` -- NOT FOUND
- `[spaceId]/builder-permission/route.ts` -- NOT FOUND
- `[spaceId]/builder-status/route.ts` -- NOT FOUND
- `[spaceId]/components/route.ts` -- NOT FOUND (all three)
- `[spaceId]/seed-rss/route.ts` -- NOT FOUND
- `[spaceId]/feed/route.ts` -- NOT FOUND
- `[spaceId]/promote-post/route.ts` -- NOT FOUND

These were likely reported from type definitions or barrel exports, not actual route files. No action needed.

---

## 2. Fix List (by priority)

### FIX-01: Validation Schema Drift (P0 -- LAUNCH BLOCKER)

**Files:**
- `packages/validation/src/space.schema.ts` (root-level)
- `packages/validation/src/schemas/space.schema.ts` (schemas/ subdirectory -- TWO schema files exist, another problem)

**What's wrong:**
- Schema `SpaceStatus = 'draft' | 'live' | 'archived' | 'suspended'`
- Domain `SpaceLifecycleState = 'SEEDED' | 'CLAIMED' | 'PENDING' | 'LIVE' | 'SUSPENDED' | 'ARCHIVED'`
- Schema `SpaceCategory = 'academics' | 'social' | 'professional' | ...` (8 values)
- Domain `SpaceCategory = 'STUDENT_ORGANIZATIONS' | 'UNIVERSITY_ORGANIZATIONS' | 'GREEK_LIFE' | 'CAMPUS_LIVING' | 'HIVE_EXCLUSIVE'` (5 values)
- Two separate schema files exist -- consolidate

**Fix:**
1. Delete `packages/validation/src/space.schema.ts` (root) if it's a duplicate. Keep `packages/validation/src/schemas/space.schema.ts`.
2. Align `SpaceStatusSchema` to: `z.enum(['SEEDED', 'CLAIMED', 'PENDING', 'LIVE', 'SUSPENDED', 'ARCHIVED'])`
3. Align `SpaceCategorySchema` to: `z.enum(['STUDENT_ORGANIZATIONS', 'UNIVERSITY_ORGANIZATIONS', 'GREEK_LIFE', 'CAMPUS_LIVING', 'HIVE_EXCLUSIVE'])`
4. Search all API routes for inline status/category enums and update to reference shared schema.

**Effort:** 4-6 hours
**Blocks:** Nothing directly, but silent bugs will surface in production if not fixed.

### FIX-02: Duplicate Routes Consolidation (P1)

**Duplicate 1: `my` vs `mine`**
- `apps/web/src/app/api/spaces/my/route.ts`
- `apps/web/src/app/api/spaces/mine/route.ts`
- **Fix:** Keep `mine/route.ts`. Delete `my/route.ts`. Search and replace all references.

**Duplicate 2: `transfer` vs `transfer-ownership`**
- `apps/web/src/app/api/spaces/transfer/route.ts`
- `apps/web/src/app/api/spaces/[spaceId]/transfer-ownership/route.ts`
- **Fix:** Keep `[spaceId]/transfer-ownership/route.ts` (more RESTful). Delete `transfer/route.ts`. Update references.

**Effort:** 2 hours

### FIX-03: Activity Feed Component Duplication (P1)

**Files:**
- `apps/web/src/components/spaces/unified-activity-feed.tsx` (739 lines)
- `apps/web/src/components/spaces/homebase-activity-feed.tsx`

**Fix:** Determine which is actively used. Consolidate into one. Delete the unused one.
**Effort:** 2-3 hours

### FIX-04: Widget Type Safety (P1)

**File:** `packages/core/src/domain/spaces/entities/widget.ts`
**What's wrong:** Uses `Record<string, any>` for config -- potential injection.
**Fix:** Define `WidgetConfig` discriminated union type per widget type (calendar, poll, links, etc.).
**Effort:** 2 hours

### FIX-05: Real-time Hook Memory Leak Check (P1)

**File:** `apps/web/src/hooks/use-space-realtime.ts`
**What's wrong:** Potential Firestore `onSnapshot` listener leak if cleanup isn't correct.
**Fix:** Verify unsubscribe in useEffect cleanup. Add listener tracking if missing.
**Effort:** 1 hour

### FIX-06: Enhanced Space Aggregate Dual Status (P2)

**File:** `packages/core/src/domain/spaces/aggregates/enhanced-space.ts` (~1000+ lines)
**What's wrong:** Has both `publishStatus` and `lifecycleState` fields -- confusing, error-prone.
**Fix:** Collapse into single `lifecycleState`. Migrate all references.
**Effort:** 4-6 hours

### FIX-07: Leader Onboarding Alignment (P1)

**Files:**
- `packages/ui/src/design-system/components/spaces/LeaderSetupProgress.tsx`
- `packages/ui/src/design-system/components/spaces/SpaceLeaderOnboardingModal.tsx`
- `apps/web/src/components/spaces/panels/leader-onboarding-panel.tsx`
- `apps/web/src/components/spaces/onboarding-overlay.tsx`

**What's wrong:** Setup steps reference HiveLab actions ("deploy tools", "quick deploy templates").
**Fix:** Replace with Autopilot-aligned steps: "Create your first event", "Invite your e-board", "Set up your Autopilot", "Share your QR code".
**Effort:** 3-4 hours

---

## 3. Build List (by priority)

### BUILD-01: Schedule Input UI + Storage (P0)

**What:** Students enter their weekly class schedule. The core data that enables everything.

**Where:**
- NEW page: `apps/web/src/app/me/schedule/page.tsx`
- NEW API: `apps/web/src/app/api/schedule/route.ts` (CRUD for class blocks)
- NEW hook: `apps/web/src/hooks/use-schedule.ts`
- NEW schema: `packages/validation/src/schedule.schema.ts`
- NEW parser: `apps/web/src/lib/schedule-parser.ts`
- Firestore: `users/{userId}/schedules/{semesterId}` -- array of `ClassBlock` objects

**Data model:**
```typescript
interface ClassBlock {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  startTime: string; // "09:00"
  endTime: string;   // "10:15"
  label: string;     // "Bio 101"
  location?: string; // "Knox Hall"
  courseCode?: string; // "BIO101"
}
```

**Existing code to extend:**
- `/me/calendar` page exists (read-only events) -- do NOT reuse, create fresh `/me/schedule`
- `use-calendar.ts` hook pattern -- follow same React Query pattern
- Profile system has `intelligence.schedule` and `showSchedule` fields

**Dependencies:** None
**Effort:** 4-5 days (includes schedule parser for UB HUB paste format)
**Acceptance criteria:**
- Add/edit/delete class blocks per day via visual time picker
- Paste UB HUB schedule text and parse 90%+ correctly
- Schedule persists in Firestore, loads on return
- < 2 minutes for a student to enter a full week

### BUILD-02: Gap Detection Service (P0)

**What:** Pure function that computes free-time gaps between class blocks for a given day.

**Where:**
- NEW service: `packages/core/src/domain/profile/services/gap-detection.service.ts`
- EXTEND: `apps/web/src/app/api/calendar/free-time/route.ts` -- this already computes free time from events; add class-block input

**Existing code to extend:**
- `findFreeTimeSlotsForDay()` in `/api/calendar/free-time/route.ts` (line ~56) already does interval arithmetic on events. Adapt to accept `ClassBlock[]` as occupied slots instead of only calendar events.

**Dependencies:** BUILD-01 (schedule storage)
**Effort:** 1 day
**Acceptance criteria:**
- `computeGaps([{9:00-10:15}, {13:00-14:00}, {16:00-17:00}], date)` returns `[{10:15-13:00, 165min}, {14:00-16:00, 120min}]`
- Handles: no classes (full day free), back-to-back (no gap), single class
- Exposed as utility function AND API endpoint

### BUILD-03: Cross-Space Event Batch Query (P0)

**What:** Given an array of time windows (gaps), return all campus-wide events grouped per gap. One round-trip.

**Where:**
- NEW route: `apps/web/src/app/api/events/by-gaps/route.ts`
- EXTEND: Uses the existing query pattern from `apps/web/src/app/api/events/route.ts` (verified: already supports `from`/`to` ISO params with Firestore compound query)

**Existing code to reuse:**
- `/api/events/route.ts` lines 60-80: the Firestore query with `campusId` + `startDate` range filter. Extract this into a shared utility function, call it N times (once per gap), aggregate results.
- Batch optimization: use `Promise.all()` to query all gaps in parallel.

**Dependencies:** None (events collection exists, from/to query verified)
**Effort:** 1 day
**Acceptance criteria:**
- `POST /api/events/by-gaps` with body `{ gaps: [{from, to}, ...], campusId }` returns `{ gapEvents: [{gap, events}] }`
- All events campus-wide (not limited to user's spaces)
- Private space events excluded unless user is member
- Response includes: event title, space name, RSVP count, location, start/end time
- < 500ms for 5 gaps

### BUILD-04: "Your Campus Today" Dashboard (P0)

**What:** Transform the existing `/home` page into a schedule-aware commuter dashboard. Show today's gaps with events that fit each window.

**Where:**
- EXTEND: `apps/web/src/app/home/page.tsx` (currently: greeting + happening now + up next + your spaces + recent activity + suggested)
- NEW component: `apps/web/src/components/home/schedule-gaps-section.tsx`
- NEW component: `apps/web/src/components/home/gap-events-card.tsx`

**Existing code to reuse:**
- The home page structure (sections, GlassSurface cards, motion variants) -- 80% reuse
- "Happening Now" section -- keep as-is
- "Your Spaces" section -- keep as-is
- "Up Next" section -- replace with gap-aware sections

**Implementation:**
1. Fetch user schedule via `use-schedule.ts` hook
2. Compute today's gaps via gap detection
3. For each gap, fetch events via `/api/events/by-gaps`
4. Render gap cards: "10:15am - 1:00pm: Your 2h45m gap" with 0-5 matching events
5. If no schedule entered, show CTA: "Enter your schedule to see what's happening between your classes" linking to `/me/schedule`
6. Keep existing sections below gaps: Your Spaces, Happening Now, Suggested

**Dependencies:** BUILD-01, BUILD-02, BUILD-03
**Effort:** 3-4 days
**Acceptance criteria:**
- Today's gaps rendered with matching events inside each
- Empty gaps: "Nothing scheduled -- explore what's happening" with link to `/explore`
- No-schedule users see clear, prominent CTA
- Page loads < 1.5s
- Mobile responsive

### BUILD-05: AI Event Generation Endpoint (P0)

**What:** Leader types 1-3 lines, AI returns a complete event object. The "wow" moment for leaders.

**Where:**
- NEW route: `apps/web/src/app/api/events/generate/route.ts`
- NEW lib: `apps/web/src/lib/event-ai-generator.ts`
- EXTEND UI: `packages/ui/src/design-system/components/spaces/EventCreateModal.tsx` -- add "AI Assist" button

**Existing code to reuse:**
- `apps/web/src/lib/firebase-ai-generator.ts` -- the Firebase AI (Gemini) structured output pattern. Uses `getGenerativeModel()`, `Schema`, quality pipeline, rate limiting. Adapt this pattern for events. Do NOT reuse the full Goose pipeline (overkill for events).
- `apps/web/src/lib/ai-usage-tracker.ts` -- `canGenerate()`, `recordGeneration()`
- Rate limiting: `aiGenerationRateLimit` from existing AI infrastructure
- The existing `EventCreateModal.tsx` form fields define the exact output schema

**Implementation:**
1. Create `event-ai-generator.ts` that:
   - Takes `{ prompt: string, spaceId: string, spaceName: string }`
   - Builds system prompt with campus context (UB building names, event types, location inference)
   - Uses Gemini 2.0 Flash structured output with event Zod schema as type
   - Returns complete event object: title, description, startDate, endDate, location, type, tags
2. Create API route with `withAuthAndErrors`, rate limit 20/hr, campus isolation
3. Add "AI Assist" button to EventCreateModal that opens a text input, calls generate, pre-fills form

**Dependencies:** None (independent of commuter track)
**Effort:** 3-4 days
**Acceptance criteria:**
- "Photo walk Wednesday 4pm Baird Point, beginners welcome" -> complete event listing in < 3 seconds
- Generated events have natural titles, 2-3 sentence descriptions, correct date/time parsing
- Leader can edit any field before publishing
- Rate limited, < $0.001/generation
- Error states handled (AI timeout, rate limit exceeded, invalid input)

### BUILD-06: Onboarding Flow with Schedule Entry (P0)

**What:** After email verification + profile basics, prompt students to enter their class schedule. The funnel determines whether the dashboard has data to work with.

**Where:**
- EXTEND: `apps/web/src/app/enter/page.tsx` (existing entry/onboarding page)
- NEW component: `apps/web/src/components/onboarding/schedule-step.tsx`

**Existing code to reuse:**
- `/enter/page.tsx` has existing onboarding flow (email verify, profile creation)
- BUILD-01's schedule input component -- embed a streamlined version in onboarding

**Implementation:**
1. After profile step (name, year, major, commuter?), add "Enter your schedule" step
2. Show value prop: "Enter your schedule and we'll show you what's happening between your classes"
3. Make skippable: "I'll do this later" with reminder on dashboard
4. Use the paste-from-text parser prominently -- fastest path
5. Store commuter flag from onboarding for dashboard personalization

**Dependencies:** BUILD-01 (schedule component)
**Effort:** 2-3 days
**Acceptance criteria:**
- Schedule entry appears after profile creation in onboarding
- "Skip" option available with "Remind me later"
- Pasted UB HUB text parsed and previewed for confirmation
- Target: 70%+ completion rate

### BUILD-07: QR Code Space Join Flow (P0)

**What:** Leaders generate printable QR codes for their space. Students scan at activities fair. Critical distribution mechanic.

**Where:**
- EXTEND: `apps/web/src/components/spaces/invite-link-modal.tsx` (513 lines, already handles invite links)
- NEW: QR code rendering (use `qrcode` or `qrcode.react` npm package)
- Existing invite system: `/api/spaces/invite/[code]/validate/route.ts` + `/api/spaces/invite/[code]/redeem/route.ts` -- already works

**Implementation:**
1. Add `qrcode.react` dependency (lightweight, React-native QR rendering)
2. In `invite-link-modal.tsx`, add a "Show QR Code" tab/section
3. QR encodes the invite URL: `https://hive.app/join/[code]`
4. Add "Download as PNG" and "Print" buttons
5. QR code sized for a table card (3x3 inches, ~150 DPI)

**Dependencies:** None (invite system already exists)
**Effort:** 1 day
**Acceptance criteria:**
- Leader clicks "Show QR Code" in invite modal -> QR renders immediately
- QR scans correctly to join URL (test with phone camera)
- Downloadable as PNG (suitable for printing)
- New users who scan -> full onboarding flow -> join space
- Existing users who scan -> direct join

### BUILD-08: Leader Analytics Dashboard (P1)

**What:** Show leaders "your club is working" data: attendance, growth, engagement. The retention hook for leaders.

**Where:**
- EXTEND: `apps/web/src/app/s/[handle]/analytics/page.tsx` (page exists)
- EXTEND: `apps/web/src/app/api/spaces/[spaceId]/analytics/route.ts` (endpoint exists, basic metrics)
- NEW directory: `apps/web/src/components/spaces/analytics/`

**Existing code to reuse:**
- Analytics page and endpoint already exist with period filtering (7d/30d/90d)
- Event RSVP data per event
- Member data with join dates and roles
- GlassSurface card primitives for metric display

**Implementation:**
1. Extend analytics endpoint to return: event attendance per event, member growth curve, engagement health scores
2. Engagement health: `active` (event in last 7d), `drifting` (no activity 14d), `churned` (no activity 30d)
3. Build analytics components: `MetricCard.tsx`, `AttendanceTrend.tsx`, `EngagementHealth.tsx`
4. Use simple SVG bar charts (no heavy chart library needed for v1)

**Dependencies:** None
**Effort:** 3-4 days
**Acceptance criteria:**
- Leader sees: total members, per-event attendance, member growth over time
- Engagement health breakdown: X active / Y drifting / Z churned
- Period selector: 7d / 30d / 90d

### BUILD-09: Event Check-In / Attendance Confirmation (P1)

**What:** Track who actually shows up (not just RSVPs). Feeds leader analytics.

**Where:**
- NEW route: `apps/web/src/app/api/spaces/[spaceId]/events/[eventId]/checkin/route.ts`
- EXTEND: `packages/ui/src/design-system/components/spaces/EventDetailsModal.tsx` -- add check-in button

**Implementation:**
1. "I'm here" button appears when event is live (within 15 min of start, 30 min after start)
2. Store check-in in `events/{eventId}/checkins/{userId}` subcollection
3. Leader sees RSVP vs actual attendance in analytics

**Dependencies:** None
**Effort:** 1-2 days

### BUILD-10: Behavioral Signal Collection (P1)

**What:** Track dashboard opens, event views, gap browsing, conversions. Feeds future Campus Mind.

**Where:**
- NEW or EXTEND: `apps/web/src/lib/analytics-events.ts`
- NEW route: `apps/web/src/app/api/analytics/track/route.ts`
- Firestore collection: `behavioralSignals`

**Implementation:**
- Fire-and-forget async writes
- Track: `dashboard_opened`, `gap_browsed`, `event_viewed`, `event_rsvped`, `space_joined_from_dashboard`
- Lightweight: no blocking on user flows

**Dependencies:** BUILD-04 (dashboard)
**Effort:** 1-2 days

### BUILD-11: Simplified Leader Admin View (P1)

**What:** Leaders see a clean, focused space admin: create event, view members, upcoming events, settings. Not the full complexity.

**Where:**
- EXTEND: `packages/ui/src/design-system/components/spaces/SpaceHub.tsx` (531 lines)
- EXTEND: `apps/web/src/components/spaces/panels/leader-onboarding-panel.tsx`

**Implementation:**
1. Add role-based view: if user is owner/admin, show simplified "leader mode" by default
2. Leader mode shows 4 cards: Quick Event Create (with AI), Upcoming Events, Member List, Settings
3. "Advanced" toggle reveals full space (tabs, widgets, boards)
4. Strip HiveLab references from leader setup progress

**Dependencies:** BUILD-05 (AI event create)
**Effort:** 2 days

### BUILD-12: Automations Rebrand to Autopilot (P2)

**What:** Rename "Automations" to "Autopilot" in UI. Pre-configure 3 templates.

**Where:**
- EXTEND: `apps/web/src/app/api/spaces/[spaceId]/automations/from-template/route.ts` (exists)
- UI: Rename labels in space settings

**Effort:** 1-2 days

### BUILD-13: Daily Briefing Generation (P2)

**What:** Morning AI-generated "your campus today" push notification.

**Where:**
- NEW route: `apps/web/src/app/api/briefing/generate/route.ts`
- NEW cron: `apps/web/src/app/api/cron/daily-briefing/route.ts`
- NEW component: `apps/web/src/components/home/daily-briefing-card.tsx`

**Existing:** FCM infrastructure (`use-fcm-registration.ts`, `use-push-notifications.ts`), Gemini structured output pattern.

**Dependencies:** BUILD-01, BUILD-02, BUILD-03
**Effort:** 3-5 days

### BUILD-14: Semantic Search (P2)

**What:** Natural language search over spaces, events, resources. "Where can I get food right now?"

**Where:**
- EXTEND: `apps/web/src/app/api/search/v2/route.ts` (exists with vector search stub)
- NEW lib: `apps/web/src/lib/vector-search.ts`

**Dependencies:** Firestore Vector Search extension setup
**Effort:** 5-8 days

---

## 4. Week-by-Week Sprint Plan

### Pre-Work: Day 0 (Kill Day)

**Both devs, 1 day.**

- [ ] Kill quorum gate (30 min) -- FIX-01.1
- [ ] Fix SpaceId crypto (15 min) -- FIX-01.2
- [ ] Gate seed route (15 min) -- FIX-01.3
- [ ] Delete deprecated browse route (30 min) -- FIX-01.4
- [ ] Fix validation schema drift (4-6 hrs) -- FIX-01
- [ ] Add `hiveLabInSpaces` feature flag, gate 10 UI files (3-4 hrs) -- Kill 1.5
- [ ] Default governance to hierarchical (30 min) -- Kill 1.6
- [ ] Hide webhooks + widget/tab builder UI (45 min) -- Kill 1.7, 1.8
- [ ] Run `pnpm build && pnpm typecheck` -- verify nothing breaks

**End of Day 0:** Codebase is clean. All kill/fix items that touch existing code are done. Both devs have verified context.

---

### Week 1-2: Foundation Sprint

**Dev A: Commuter Track**

| Day | Task | Output |
|-----|------|--------|
| W1 D1-D2 | BUILD-01: Schedule Input UI | `/me/schedule` page with day/time picker, ClassBlock CRUD |
| W1 D3 | BUILD-01 contd: Schedule text parser | `schedule-parser.ts` -- parse UB HUB paste format |
| W1 D4 | BUILD-01 contd: Schedule API + Firestore | `POST /api/schedule`, `GET /api/schedule`, Firestore `users/{uid}/schedules/{sem}` |
| W1 D5 | BUILD-02: Gap detection service | `gap-detection.service.ts` + extend `/api/calendar/free-time` |
| W2 D1 | BUILD-03: Cross-space event batch query | `POST /api/events/by-gaps` -- query events per gap window |
| W2 D2-D4 | BUILD-04: "Your Campus Today" dashboard | Extend `/home/page.tsx` with gap sections, event cards, no-schedule CTA |
| W2 D5 | BUILD-04: Polish + mobile responsive | Test on phone, verify motion, empty states, loading skeletons |

**Dev B: Autopilot Track**

| Day | Task | Output |
|-----|------|--------|
| W1 D1-D3 | BUILD-05: AI event generation | `event-ai-generator.ts`, `POST /api/events/generate`, Gemini prompt engineering |
| W1 D4 | BUILD-05 contd: EventCreateModal AI integration | "AI Assist" button in EventCreateModal, pre-fill form |
| W1 D5 | BUILD-07: QR code join flow | Add QR rendering to `invite-link-modal.tsx`, download/print |
| W2 D1 | FIX-02: Consolidate duplicate routes | Delete `my/route.ts`, delete `transfer/route.ts`, update refs |
| W2 D1 | FIX-03: Consolidate activity feed components | Merge `unified-activity-feed.tsx` and `homebase-activity-feed.tsx` |
| W2 D2-D4 | BUILD-06: Onboarding flow + schedule step | Extend `/enter/page.tsx` with schedule step, skip option, paste parser |
| W2 D5 | FIX-07: Leader onboarding alignment | Update setup steps to Autopilot actions, strip HiveLab refs |

**End of Week 2:** Commuter dashboard works end-to-end. AI event creation works. QR codes work. Onboarding includes schedule entry. The P0 scope is feature-complete. Run `pnpm build && pnpm typecheck`.

---

### Week 3: Integration + QA Sprint

**Dev A: Integration & Polish**

| Day | Task | Output |
|-----|------|--------|
| W3 D1-D2 | Integration testing | End-to-end: onboarding -> schedule -> dashboard -> event discovery |
| W3 D2 | FIX-04: Widget type safety | Define `WidgetConfig` discriminated union in `widget.ts` |
| W3 D3 | FIX-05: Real-time hook memory leak check | Verify `use-space-realtime.ts` cleanup |
| W3 D4-D5 | BUILD-10: Behavioral signal collection | Analytics events, tracking endpoint, fire-and-forget writes |

**Dev B: Leader Experience**

| Day | Task | Output |
|-----|------|--------|
| W3 D1-D2 | BUILD-11: Simplified leader admin view | Leader mode in SpaceHub, 4-card layout, advanced toggle |
| W3 D3 | BUILD-09: Event check-in | "I'm here" button, checkin API, attendance tracking |
| W3 D4-D5 | QA: Leader flow end-to-end | Claim space -> AI event create -> publish -> QR code -> member joins |

**End of Week 3:** Launch-ready. Both flows (commuter + leader) tested end-to-end. Behavioral tracking active.

---

### Week 4: Pre-Launch Prep

**Both devs, 1 week.**

- [ ] Seed 30 club spaces from UBLinked data (existing `pnpm seed:production`)
- [ ] Personal outreach to 30 club leaders (non-dev work, but devs support)
- [ ] Leader onboarding sessions -- fix bugs discovered during real usage
- [ ] Performance testing: dashboard load time < 1.5s
- [ ] Mobile testing on iOS Safari and Android Chrome
- [ ] Run `pnpm launch:verify` -- verify launch readiness
- [ ] Deploy to production via Vercel

---

### Week 5-6: Launch + Weeks 1-2 (Activities Fair)

**Dev A: Student-facing iteration**

| Day | Task | Output |
|-----|------|--------|
| W5 D1-D3 | Monitor dashboards, fix bugs | Respond to student feedback within hours |
| W5 D4-D5 | BUILD-08: Leader analytics dashboard (start) | Extend analytics API, build metric components |
| W6 D1-D3 | BUILD-08: Leader analytics dashboard (finish) | Attendance trends, engagement health, period selector |
| W6 D4-D5 | Iterate on schedule input based on completion rate | If < 70%, simplify; if parsing fails, add AI fallback |

**Dev B: Retention + growth mechanics**

| Day | Task | Output |
|-----|------|--------|
| W5 D1-D3 | Monitor leader usage, fix bugs | Respond to leader feedback |
| W5 D4-D5 | Follow-through nudges v1 | Push notifications before events in user's gap: "Photography Club in 45 min, 12 going" |
| W6 D1-D2 | Social proof on dashboard | "14 people going, 3 from your major" on event cards |
| W6 D3-D5 | Notification pipeline for schedule-aware reminders | "This happens during your gap tomorrow" notifications |

---

### Week 7-8: Iteration Sprint

**Dev A:**
- BUILD-12: Rebrand automations to Autopilot (1-2 days)
- BUILD-13: Daily briefing generation (3-5 days)
- Iterate based on metrics: if dashboard opens low, add more content types; if schedule completion low, add AI fallback parser

**Dev B:**
- Location-aware suggestions (2 days) -- sort events by proximity to last class
- AI notification drafting (2 days) -- generate push + Instagram caption on event publish
- Institutional memory / handoff document (3-5 days) -- AI-generated transition docs

---

### Week 9-12: Campus Mind Activation

**Both devs:**
- BUILD-14: Semantic search infrastructure (5-8 days) -- Firestore vector embeddings, natural language queries
- Campus Mind v1: weekly personalized recommendation digest based on behavioral signals accumulated since launch
- Commuter-to-commuter matching: "3 other students from your Psych 101 are in Capen during your Tuesday gap"
- Growth mechanics: invite system, referral tracking, QR event check-in for non-users

---

## 5. Critical Path

```
                     CRITICAL PATH (longest serial chain)
                     ====================================

Day 0: Kill Day (both devs, 1 day)
       ↓
BUILD-01: Schedule Input UI + Storage + Parser (4-5 days) ← THIS IS THE BOTTLENECK
       ↓
BUILD-02: Gap Detection Service (1 day)
       ↓
BUILD-03: Cross-Space Event Batch Query (1 day)
       ↓
BUILD-04: "Your Campus Today" Dashboard (3-4 days)
       ↓
BUILD-06: Onboarding + Schedule Step (2-3 days)
       ↓
Integration Testing (2 days)
       ↓
                     =============================
                     Total critical path: 14-17 days
                     =============================

BUILD-05 (AI Event Gen, 3-4 days) runs PARALLEL on Dev B -- not on critical path
BUILD-07 (QR Codes, 1 day) runs PARALLEL on Dev B -- not on critical path
```

**The single dependency that determines ship date:** BUILD-01 (Schedule Input). If schedule input is delayed, everything downstream -- gap detection, dashboard, onboarding -- is delayed. This is the one feature that has zero existing code to build from.

**Mitigation:** Start schedule input on Day 1. Assign your stronger frontend dev to it. If it's taking longer than 5 days, cut the text parser and ship manual-only entry. Parser can come in week 3.

---

## 6. Day 1 Checklist

Exactly what must work when the first student opens HIVE at the Activities Fair:

- [ ] **Email verification:** Student enters buffalo.edu email, gets code, verifies
- [ ] **Profile creation:** Name, year, major, commuter status
- [ ] **Schedule entry:** Student enters or pastes weekly class schedule
- [ ] **Dashboard loads:** "Your Campus Today" shows gaps with events
- [ ] **Event cards render:** Each gap shows 0-5 matching events with title, time, location, RSVP count
- [ ] **No-schedule fallback:** Students who skip schedule see CTA + generic "Happening Now" + "Explore"
- [ ] **QR code scan:** Student scans leader's QR card at fair table -> joins space
- [ ] **Space join works:** Open join policy, instant membership, space appears in "Your Spaces"
- [ ] **Space pages load:** `/s/[handle]` shows space hub, events mode, members mode
- [ ] **Leader space claim:** Leaders have already claimed their spaces and created events
- [ ] **AI event creation:** Leaders type 3 lines -> complete event listing generated
- [ ] **Event RSVP:** Student taps "I'm in" on an event -> RSVP recorded, reflected in count
- [ ] **Space discovery:** `/explore` page shows campus-wide spaces, search works
- [ ] **Mobile responsive:** Entire flow works on phone (primary device for students)
- [ ] **Auth session:** JWT session persists across app reloads, edge middleware protects routes
- [ ] **Campus isolation:** All queries scoped to `campusId` -- no cross-campus data leaks
- [ ] **Performance:** Dashboard loads < 1.5s, event generation < 3s
- [ ] **Empty states:** Every zero-state guides the user to an action, never "Nothing here"

---

## 7. Risk Register

### Risk 1: Schedule Input Takes Too Long

**What breaks:** Every feature downstream (gap detection, dashboard, onboarding) is blocked.
**Probability:** Medium -- no existing schedule code to build from, text parser is fiddly.
**Mitigation:** Cut the text parser if behind schedule. Ship manual-only entry in week 2. Add parser in week 3. The manual picker is the MVP; the parser is a convenience.
**Fallback:** If manual entry is too slow for students (< 50% completion), build a Gemini-powered "paste anything" parser that uses AI to extract schedule blocks from any text format. Budget: 1 day.

### Risk 2: AI Event Generation Quality Is Mediocre

**What breaks:** Leaders don't have a "wow" moment. They create events manually (slower but still works). Autopilot story weakens.
**Probability:** Medium -- Gemini structured output is reliable but prompt engineering determines quality.
**Mitigation:** Spend 1 full day on prompt engineering before integrating. Build a test harness with 20 real-world leader inputs and verify output quality. Inject UB-specific context: building names, event type taxonomy, location abbreviation mapping.
**Fallback:** If generation is poor, downgrade to "smart autocomplete" (leader fills some fields, AI fills the rest). Lower wow factor but still useful.

### Risk 3: Leader Activation Rate < 60%

**What breaks:** Dashboard has thin content. Students see 2-3 events during their gap. Not enough to form a habit. Most dangerous failure mode (see strategy doc).
**Probability:** Medium-high -- this is an ops risk, not a code risk.
**Mitigation:** White-glove onboarding for all 30 leaders. Personally walk them through event creation. Follow up weekly during summer. Make sure 25+ leaders have created at least 2 events before the fair. This is human work, not dev work. Budget time for it.

### Risk 4: Two Validation Schema Files

**What breaks:** Fixes to one schema don't propagate to the other. Silent validation bugs.
**Probability:** High -- two files exist: `packages/validation/src/space.schema.ts` AND `packages/validation/src/schemas/space.schema.ts`.
**Mitigation:** Day 0 fix. Determine which is canonical, delete the other, update all imports. This is a 30-minute task with high leverage.

### Risk 5: Scope Creep During Summer

**What breaks:** With 12 weeks between now and launch, feature requests pile up. Semantic search, commuter matching, Campus Mind -- all interesting, all distracting.
**Probability:** High -- this team has a history of building ambitious features (HiveLab, governance models, inline components).
**Mitigation:** Nothing ships in weeks 1-3 that isn't on the P0 list. No exceptions. P1 starts in week 3, P2 starts in week 5. If a new feature request comes in, it goes to P3 unless both devs agree it's a launch blocker. The rule is: the dashboard with schedule awareness and AI event creation IS the launch. Everything else is post-launch.

---

## 8. Definition of Done

HIVE v1 is ready to ship when:

**Core Flows:**
- [ ] A new student can: verify email -> enter profile -> enter schedule -> see gap-aware dashboard with events -> RSVP to an event -> join a space via QR code. Entire flow < 5 minutes.
- [ ] A leader can: claim their space -> create an event via AI in < 60 seconds -> see member list -> generate QR code for printing.
- [ ] A returning student can: open HIVE -> see today's gaps with events -> tap an event -> RSVP. Total time < 30 seconds.

**Quality:**
- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes (or only non-blocking warnings)
- [ ] No `Math.random()` in security-sensitive code
- [ ] No seed/debug routes accessible in production
- [ ] All API routes use `campusId` from session, never from client
- [ ] All API inputs validated via Zod schemas
- [ ] Validation schemas match domain model enums

**Performance:**
- [ ] Dashboard loads < 1.5s on 4G connection
- [ ] AI event generation < 3 seconds
- [ ] Event batch query < 500ms for 5 gaps
- [ ] No memory leaks in real-time hooks

**Content:**
- [ ] 25+ club spaces claimed and active (with events)
- [ ] At least 50 events in the system across all spaces
- [ ] All 9 space templates render correctly
- [ ] Empty states on every page guide to next action

**Mobile:**
- [ ] Full flow works on iOS Safari
- [ ] Full flow works on Android Chrome
- [ ] Touch targets >= 44px
- [ ] No horizontal scroll issues

---

## Effort Summary

| Phase | Dev-Days | Calendar (2 devs) |
|-------|----------|-------------------|
| Kill Day | 2 (1 per dev) | 1 day |
| P0 Builds (Foundation) | 18-22 | 2 weeks |
| Integration + QA | 10 | 1 week |
| Pre-Launch Prep | 10 | 1 week |
| **Total to launch-ready** | **40-44** | **~5 weeks** |
| P1 (Weeks 1-2 post-launch) | 10-14 | +2 weeks |
| P2 (Month 1 post-launch) | 12-19 | +2-3 weeks |

**Ship date with 2 devs starting Monday: ~5 weeks to launch-ready code, then 1 week of leader prep = 6 weeks total.** If starting mid-February, launch-ready by end of March. Activities fair prep through summer. Ship at scale in late August.
