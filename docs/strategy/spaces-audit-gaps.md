# Gap Analysis: Commuter Home Base + Space Autopilot

**Analyst:** gap-analyst
**Date:** 2026-02-07
**Inputs:** Product Strategy (06-product-strategy.md), Code Audit (spaces-audit-code.md), Strategy Alignment (spaces-audit-alignment.md), Codebase exploration
**Total Gaps Identified:** 28
**Total Estimated Effort:** 38-56 dev-days (~8-12 weeks for 1 dev, ~4-6 weeks for 2 devs)

---

## Priority Legend

| Priority | Meaning | Ship Gate |
|----------|---------|-----------|
| **P0** | Launch blocker -- cannot ship without this | Must complete before Activities Fair |
| **P1** | Ship in weeks 1-2 post-launch | Can ship without but hurts core loop |
| **P2** | Month 1 post-launch | Improves retention, not required for launch |
| **P3** | Later / nice-to-have | Build when there's signal |

---

## COMMUTER HOME BASE GAPS

### GAP-01: Schedule Input UI + Storage

**Size:** M (3-5 days)
**Priority:** P0 -- Launch blocker
**Dependency:** None
**Where it goes:**
- Page: `apps/web/src/app/me/schedule/page.tsx` (NEW)
- API: `apps/web/src/app/api/schedule/route.ts` (NEW -- CRUD for class blocks)
- Hook: `apps/web/src/hooks/use-schedule.ts` (NEW)
- Validation: `packages/validation/src/schedule.schema.ts` (NEW)
- Firestore collection: `schedules` (per-user, per-semester)

**What exists:**
- `/me/calendar` page exists but is read-only (shows space events, no class input)
- `use-calendar.ts` hook exists but only fetches events, no schedule entry
- Profile privacy already has `showSchedule: boolean` field
- No `/me/schedule` page exists. No schedule data model exists.

**Implementation hint:**
- Schedule block = `{ day: 'monday'|..., startTime: '09:00', endTime: '10:15', label: 'Bio 101', location?: 'Knox Hall', courseCode?: 'BIO101' }`
- Store in Firestore under `users/{userId}/schedules/{semesterId}` as array of blocks
- Support manual entry (day/time picker) and paste-from-text (parse UB HUB schedule text)
- Integrate into onboarding flow (post-email-verify, pre-dashboard)
- Use existing design system primitives (GlassSurface, Button, Input from `@hive/ui`)

**Acceptance criteria:**
- Student can add/edit/delete class blocks for each day of the week
- Schedule persists across sessions
- Schedule displays on `/me/schedule` and feeds gap detection
- 70%+ of test users complete schedule entry in < 2 minutes

---

### GAP-02: Gap Detection Algorithm

**Size:** S (1-2 days)
**Priority:** P0 -- Launch blocker
**Dependency:** GAP-01 (schedule storage)
**Where it goes:**
- Service: `packages/core/src/domain/profile/services/gap-detection.service.ts` (NEW)
- API: `apps/web/src/app/api/schedule/gaps/route.ts` (NEW)
- Alternatively extend: `apps/web/src/app/api/calendar/free-time/route.ts` (EXISTS -- partially does this)

**What exists:**
- `/api/calendar/free-time/route.ts` already computes free time slots between events. BUT it uses space events and personal events -- NOT class schedule blocks. It doesn't know about the student's class schedule because no schedule storage exists yet.

**Implementation hint:**
- Pure function: `computeGaps(classBlocks: ClassBlock[], date: Date) => Gap[]`
- A `Gap` = `{ startTime: Date, endTime: Date, durationMinutes: number, label: string }`
- Extend the existing `findFreeTimeSlotsForDay()` in `/api/calendar/free-time/route.ts` to accept class blocks as input alongside events
- Expose as both a utility function (for client-side rendering) and an API endpoint (for server-side event matching)

**Acceptance criteria:**
- Given a Monday schedule of [9-10:15, 13:00-14:00, 16:00-17:00], returns gaps [10:15-13:00, 14:00-16:00]
- Handles edge cases: no classes (whole day free), back-to-back classes (no gap), single class
- Duration is accurate to the minute

---

### GAP-03: "Your Campus Today" Dashboard

**Size:** M (3-5 days)
**Priority:** P0 -- Launch blocker
**Dependency:** GAP-01, GAP-02, GAP-04
**Where it goes:**
- Extend: `apps/web/src/app/home/page.tsx` (EXISTS -- currently an activity stream)
- New components: `apps/web/src/components/home/schedule-gaps-section.tsx` (NEW)
- New components: `apps/web/src/components/home/gap-events-card.tsx` (NEW)

**What exists:**
- `/home/page.tsx` already has: greeting header, "Happening Now", "Up Next", "Your Spaces", "Recent Activity", "Suggested". It's a solid foundation. BUT it has zero schedule awareness.
- The page fetches events from `/api/profile/dashboard` -- returns upcoming events without gap filtering.

**Implementation hint:**
- Replace/augment "Up Next" section with schedule-aware gap sections
- For each gap in today's schedule, show a collapsible card: "10:15am - 1:00pm: Your 2h45m gap" with events that fit inside that window
- Fetch events via the cross-space time-window query (GAP-04)
- Keep existing sections (Your Spaces, Happening Now) as secondary content below gaps
- New user flow: if no schedule entered, show CTA "Enter your schedule to see what's happening between your classes"

**Acceptance criteria:**
- Dashboard shows today's gaps with events that fit each gap
- Each gap card shows: gap time range, duration, and 0-5 matching events
- Empty gaps show "Nothing scheduled -- explore what's happening" with link to `/explore`
- Non-schedule-entered users see clear CTA to enter schedule
- Page loads in < 1.5s

---

### GAP-04: Cross-Space Event Aggregation API

**Size:** S (1-2 days)
**Priority:** P0 -- Launch blocker
**Dependency:** None (events collection already flat with campusId)
**Where it goes:**
- Extend: `apps/web/src/app/api/events/route.ts` (EXISTS -- already supports `from`/`to` params!)

**What exists:**
- `/api/events/route.ts` ALREADY queries events campus-wide by time range! It supports `from` and `to` ISO date params. It filters by `campusId`, handles visibility, batch-fetches organizers and spaces. This is much closer than the alignment audit suggested.
- `/api/events/personalized/route.ts` already ranks events by relevance (interests, friends, time proximity). BUT it uses `timeRange: 'tonight'|'today'|...` -- not schedule-gap-specific windows.

**Implementation hint:**
- The existing `/api/events?from=X&to=Y` already works for basic time-window queries. Main gap is:
  1. No `state=published` filter in the main events route (only personalized has it)
  2. No gap-specific endpoint that takes an array of gaps and returns events grouped by gap
  3. The `from`/`to` on the existing route is a single window -- need to call it per-gap or add batch support
- Option A: Call existing `/api/events?from=X&to=Y` once per gap on the client (simple, slightly more network)
- Option B: Add a `/api/events/by-gaps` endpoint that accepts `gaps: Array<{from, to}>` and returns events grouped by gap (efficient, one round-trip)
- Recommend Option B for launch -- better UX, one fetch

**Acceptance criteria:**
- Endpoint accepts array of time windows, returns events grouped per window
- All events are campus-wide (not limited to user's spaces)
- Events from private spaces excluded unless user is a member
- Response includes space name, event title, RSVP count, location
- Query completes in < 500ms for 5 gaps

---

### GAP-05: Location-Aware Suggestions

**Size:** S (1-2 days)
**Priority:** P2 -- Month 1
**Dependency:** GAP-01 (schedule with location data), campus buildings data
**Where it goes:**
- Extend: `apps/web/src/app/api/events/route.ts` or new `apps/web/src/app/api/events/nearby/route.ts`
- Uses: campus buildings data at `packages/core/src/domain/campus/` (EXISTS)

**What exists:**
- Campus buildings data exists in `packages/core/src/domain/campus/`
- Events have `location` field
- No proximity calculation or building-to-building distance data

**Implementation hint:**
- Map UB buildings to coordinates (static data, ~30 buildings)
- When a student's previous class location is known, sort events by proximity
- Simple linear distance is sufficient for a single campus
- Store building coordinates in `packages/core/src/domain/campus/buildings.ts`

**Acceptance criteria:**
- Events sorted by distance from student's last class location
- "Nearby" badge on events within 5-minute walk
- Graceful fallback when location data is missing (show all events unsorted)

---

### GAP-06: Daily Briefing Generation (AI)

**Size:** M (3-5 days)
**Priority:** P2 -- Month 1
**Dependency:** GAP-01, GAP-02, GAP-04
**Where it goes:**
- API: `apps/web/src/app/api/briefing/generate/route.ts` (NEW)
- Cron: `apps/web/src/app/api/cron/daily-briefing/route.ts` (NEW)
- Component: `apps/web/src/components/home/daily-briefing-card.tsx` (NEW)

**What exists:**
- AI generation patterns exist in HiveLab (tools/generate, goose-server.ts, firebase-ai-generator.ts)
- Notification system exists (`/api/notifications/route.ts`)
- No briefing generation system exists

**Implementation hint:**
- Morning cron job (7am campus time) generates personalized briefing per user with schedule
- Uses Gemini structured output: input = user's gaps + events in those gaps + weather + campus alerts
- Output = 2-3 sentence natural language briefing: "You have a 2h gap after Bio. The Photography Club has a walk-and-shoot at 11am near your building. Free coffee at the Engineering Welcome in Davis."
- Send as push notification (FCM infrastructure exists -- `use-fcm-registration.ts`, `use-push-notifications.ts`)
- Store generated briefing for dashboard display

**Acceptance criteria:**
- Each user with a schedule gets a daily briefing by 7:30am
- Briefing mentions specific events in specific gaps
- Cost < $0.001 per briefing (Gemini Flash)
- Briefing renders on dashboard if user opens app before events pass

---

## SPACE AUTOPILOT GAPS

### GAP-07: AI Event Generation Endpoint

**Size:** M (3-5 days)
**Priority:** P0 -- Launch blocker
**Dependency:** None
**Where it goes:**
- API: `apps/web/src/app/api/events/generate/route.ts` (NEW)
- Lib: `apps/web/src/lib/event-ai-generator.ts` (NEW)
- UI: Extend `packages/ui/src/design-system/components/spaces/EventCreateModal.tsx` (EXISTS)

**What exists:**
- HiveLab tool generation at `/api/tools/generate/route.ts` -- full streaming AI pipeline with Goose/Groq/Firebase backends, rate limiting, usage tracking
- `goose-server.ts` -- backend abstraction for Ollama/Groq/rules-based generation
- `firebase-ai-generator.ts` -- Gemini structured output via Firebase AI
- `ai-usage-tracker.ts` -- generation quotas and tracking
- `aiGenerationRateLimit` -- rate limiting for AI endpoints
- Existing `EventCreateModal.tsx` has full event form but no AI assist

**Implementation hint:**
- Adapt the Firebase AI generator pattern (NOT the full Goose pipeline -- events are simpler than tools)
- Input: `{ prompt: "Photo walk Wednesday 4pm Baird Point, beginners welcome", spaceId: string }`
- Output: Complete event object matching `CreateEventSchema` -- title, description, startDate, endDate, location, type, tags
- Use Gemini 2.0 Flash structured output with Zod schema as the type
- Inject campus context: building names, event type taxonomy, space name
- Add "AI Assist" button to EventCreateModal that opens a text input, generates, and pre-fills the form
- Reuse `canGenerate()`, `recordGeneration()`, `aiGenerationRateLimit` from existing AI infrastructure

**Acceptance criteria:**
- Leader types 1-3 lines, gets a complete event listing in < 3 seconds
- Generated event has: natural title, 2-3 sentence description, correct date/time parsing, inferred location, appropriate tags
- Leader can edit any field before publishing
- Rate limited to 20 generations/hour/user
- Cost < $0.001 per generation

---

### GAP-08: Leader Analytics Dashboard (Enhanced)

**Size:** M (3-5 days)
**Priority:** P1 -- Weeks 1-2 post-launch
**Dependency:** None (basic analytics endpoint exists)
**Where it goes:**
- Extend: `apps/web/src/app/s/[handle]/analytics/page.tsx` (EXISTS -- page exists)
- API extend: `apps/web/src/app/api/spaces/[spaceId]/analytics/route.ts` (EXISTS -- basic metrics)
- New components: `apps/web/src/components/spaces/analytics/` (NEW directory)

**What exists:**
- `/s/[handle]/analytics/page.tsx` -- analytics page exists
- `/api/spaces/[spaceId]/analytics/route.ts` -- endpoint exists, has period-based filtering (7d/30d/90d), validates leader permission. Likely returns basic member/post/event counts.
- Event RSVP data exists per event

**Implementation hint:**
- Add to existing analytics endpoint: event attendance trends, member growth curve, engagement health scores
- Engagement health: `active` (attended event in last 7d), `drifting` (no activity in 14d), `churned` (no activity in 30d)
- Show "optimal event timing" based on members' schedule data (if schedule sharing is enabled)
- Use existing GlassSurface cards for metrics display
- Chart library: lightweight (e.g., recharts or a simple SVG bar chart)

**Acceptance criteria:**
- Leader sees: total members, event attendance per event, member growth over time
- Engagement health breakdown: X active, Y drifting, Z churned
- Data loads for the selected period (7d/30d/90d)

---

### GAP-09: Simplified Leader Admin View

**Size:** S (1-2 days)
**Priority:** P1 -- Weeks 1-2 post-launch
**Dependency:** GAP-07 (AI event creation)
**Where it goes:**
- Extend: `apps/web/src/app/s/[handle]/page.tsx` (EXISTS)
- Extend: `packages/ui/src/design-system/components/spaces/SpaceHub.tsx` (EXISTS)
- Extend: `apps/web/src/components/spaces/panels/leader-onboarding-panel.tsx` (EXISTS)

**What exists:**
- SpaceHub.tsx (531 lines) -- full space entry with mode cards
- LeaderSetupProgress.tsx -- leader onboarding progress tracker
- SpaceLeaderOnboardingModal.tsx -- onboarding modal
- Current view shows ALL features: tabs, widgets, boards, tools, HiveLab builder

**Implementation hint:**
- Create a "leader mode" variant of SpaceHub that shows only:
  1. Quick event creation card (with AI assist button)
  2. Upcoming events list
  3. Member list with count
  4. Basic settings access
- Hide: tabs, widgets, tools mode, builder, webhooks, governance
- Controlled by role -- leaders/admins see simplified view by default with "Advanced" toggle
- Strip HiveLab references from LeaderSetupProgress (code audit flagged this)

**Acceptance criteria:**
- Leader's first view of their space shows 4 clear actions: create event, view members, see upcoming, edit settings
- No HiveLab, widget, or tab UI visible in default leader mode
- "Advanced" toggle reveals full space customization

---

### GAP-10: Institutional Memory / Knowledge Transfer

**Size:** M (3-5 days)
**Priority:** P2 -- Month 1
**Dependency:** Events + members data accumulation
**Where it goes:**
- API: `apps/web/src/app/api/spaces/[spaceId]/handoff/route.ts` (NEW)
- Component: `apps/web/src/components/spaces/panels/handoff-panel.tsx` (NEW)

**What exists:**
- Space analytics endpoint (basic)
- Event history (all past events stored in Firestore)
- Member data with roles and join dates
- Resources system (files, links stored per space)
- No handoff or transition document generation

**Implementation hint:**
- AI-generated transition document from space activity history
- Input: all events (titles, attendance, dates), member list, resources, space description
- Output: structured handoff doc -- "What worked" (highest attended events), "Regular schedule" (recurring events), "Key members" (most active), "Resources" (links/files), "Tips from activity patterns"
- Use Gemini structured output, same pattern as GAP-07
- Render as downloadable PDF or in-app view

**Acceptance criteria:**
- Leader can generate a handoff document from space dashboard
- Document summarizes: event history, attendance patterns, member roster, resources
- Takes < 10 seconds to generate
- Document is shareable (link or download)

---

### GAP-11: AI Notification Drafting

**Size:** S (1-2 days)
**Priority:** P2 -- Month 1
**Dependency:** GAP-07 (AI generation pattern)
**Where it goes:**
- API: `apps/web/src/app/api/notifications/draft/route.ts` (NEW)
- Extend event creation flow in `EventCreateModal.tsx`

**What exists:**
- Notification system at `/api/notifications/route.ts`
- Event creation triggers member notifications (in `/api/spaces/[spaceId]/events/route.ts`)
- No AI-assisted notification text

**Implementation hint:**
- When leader publishes event, AI generates notification text + optional Instagram caption
- Input: event details (title, time, location, description)
- Output: `{ pushNotification: string, instagramCaption: string }`
- Push notification: short, action-oriented ("Photography Club walk-and-shoot at 4pm. Baird Point. Bring your camera.")
- Instagram caption: longer, emoji-friendly, hashtag-included
- Leader previews and edits before sending

**Acceptance criteria:**
- After creating event, leader sees AI-drafted notification and Instagram caption
- Leader can edit both before publishing
- Push notification < 160 characters
- Instagram caption includes relevant hashtags

---

## INTEGRATION GAPS

### GAP-12: Events Queryable Campus-Wide by Time Window

**Size:** Already exists (0 days -- verified)
**Priority:** P0 -- Already shipped
**Dependency:** None

**What exists:**
- `/api/events/route.ts` already supports `from` and `to` ISO date params for campus-wide time-window queries
- Filters by `campusId`, handles visibility, batch-fetches related data

**Remaining work:** Only needs the batch-gaps wrapper from GAP-04. The underlying query capability exists.

---

### GAP-13: Space Activity Surfacing in Commuter Feed

**Size:** S (1-2 days)
**Priority:** P1 -- Weeks 1-2 post-launch
**Dependency:** GAP-03 (dashboard exists)
**Where it goes:**
- Extend: `/home/page.tsx` RecentActivity section
- Extend: `/api/activity-feed` endpoint

**What exists:**
- `/home/page.tsx` already has a "Recent Activity" section showing cross-space activity
- Activity types: new_messages, member_joined, event_created, tool_deployed
- `/api/activity-feed?limit=10` endpoint

**Implementation hint:**
- Add event-type activity items: "Photography Club has a walk-and-shoot tomorrow during your gap"
- Filter activity by relevance to user's schedule gaps
- Add "event_happening_soon" activity type that surfaces 30-60 min before events in user's gap windows

**Acceptance criteria:**
- Activity feed includes schedule-relevant event notifications
- Events during user's gaps get priority ranking
- Activity items link to event detail or space page

---

### GAP-14: Behavioral Signal Collection

**Size:** S (1-2 days)
**Priority:** P1 -- Weeks 1-2 post-launch
**Dependency:** GAP-03 (dashboard usage)
**Where it goes:**
- Lib: `apps/web/src/lib/analytics-events.ts` (NEW or extend existing)
- API: `apps/web/src/app/api/analytics/track/route.ts` (NEW)
- Firestore collection: `behavioralSignals`

**What exists:**
- No structured behavioral tracking system
- Basic activity logging exists in some API routes (via logger)
- No signals for: dashboard opens, event views, gap browsing, event-to-attendance conversion

**Implementation hint:**
- Track: `dashboard_opened`, `gap_browsed`, `event_viewed`, `event_rsvped`, `event_attended`, `schedule_updated`, `space_joined_from_dashboard`
- Store as lightweight Firestore documents with userId, eventType, metadata, timestamp
- These feed future Campus Mind recommendations (Layer 3)
- Keep it simple: fire-and-forget writes, no blocking

**Acceptance criteria:**
- Every key user action is tracked with timestamp and context
- Analytics dashboard (admin) can query signal counts
- No performance impact on user-facing flows (async writes)

---

### GAP-15: Semantic Search Infrastructure

**Size:** L (5-8 days)
**Priority:** P2 -- Month 1
**Dependency:** None
**Where it goes:**
- API: `apps/web/src/app/api/search/v2/route.ts` (EXISTS -- has vector search stub)
- Lib: `apps/web/src/lib/vector-search.ts` (NEW)
- Firebase extension: Firestore Vector Search

**What exists:**
- `/api/search/v2/route.ts` already exists with some vector/embedding references
- CommandBar search exists but is keyword-based
- No actual vector embeddings stored in Firestore
- No embedding generation pipeline

**Implementation hint:**
- Use Firestore Vector Search extension (Firebase built-in)
- Generate embeddings for: space descriptions, event titles+descriptions, resource titles
- On create/update, generate embedding via Gemini embedding API and store as vector field
- Search endpoint: user query -> embedding -> vector similarity search -> results
- Natural language queries: "where can I get food right now?", "clubs about photography"

**Acceptance criteria:**
- User can search in natural language and get relevant results
- Results ranked by semantic similarity
- Covers spaces, events, and resources
- Search completes in < 1 second

---

## CODE FIXES (from Code Audit)

### GAP-16: Validation Schema Drift Fix

**Size:** S (1-2 days)
**Priority:** P0 -- Launch blocker
**Dependency:** None
**Where it goes:**
- Fix: `packages/validation/src/space.schema.ts` (EXISTS)
- Reference: `packages/core/src/domain/spaces/aggregates/enhanced-space.ts`
- Reference: `packages/core/src/domain/spaces/value-objects/space-category.value.ts`

**What exists:**
- Validation schema: `SpaceStatus = 'draft' | 'live' | 'archived' | 'suspended'`
- Domain model: `SpaceLifecycleState = 'SEEDED' | 'CLAIMED' | 'PENDING' | 'LIVE' | 'SUSPENDED' | 'ARCHIVED'`
- Validation schema: `SpaceCategory = 'academics' | 'social' | 'professional' | 'interests' | 'cultural' | 'service' | 'official' | 'other'`
- Domain model: `SpaceCategory = 'STUDENT_ORGANIZATIONS' | 'UNIVERSITY_ORGANIZATIONS' | 'GREEK_LIFE' | 'CAMPUS_LIVING' | 'HIVE_EXCLUSIVE'`
- These enums DON'T MATCH. Validation will silently pass invalid data or reject valid data.

**Implementation hint:**
- Align validation schema enums with domain model enums
- Add lifecycle states to validation: SEEDED, CLAIMED, PENDING (these are real states used in the claim flow)
- Map old category names to new or unify on one set
- Add validation schemas for events, boards, chat messages (currently inline in each API route)

**Acceptance criteria:**
- `SpaceStatusSchema` matches `SpaceLifecycleState` enum from domain
- `SpaceCategorySchema` matches domain categories
- No runtime mismatches between validation and domain layer
- All API routes use shared schemas from validation package

---

### GAP-17: SpaceId Crypto Fix

**Size:** XS (< 1 day)
**Priority:** P0 -- Launch blocker (security)
**Dependency:** None
**Where it goes:**
- Fix: `packages/core/src/domain/spaces/value-objects/space-id.value.ts`

**What exists:**
- `SpaceId.generate()` uses `Math.random().toString(36).substr(2, 9)` -- predictable, not cryptographically secure
- Other parts of the codebase use `crypto.randomUUID()` correctly

**Implementation hint:**
- Replace `Math.random()` with `crypto.randomUUID()` or `crypto.getRandomValues()`
- Change: `const random = Math.random().toString(36).substr(2, 9)` -> use crypto
- One-line fix

**Acceptance criteria:**
- `SpaceId.generate()` uses cryptographically secure random values
- Existing space IDs remain valid (only affects new generation)

---

### GAP-18: Dead Code Cleanup

**Size:** S (1 day)
**Priority:** P1 -- Weeks 1-2 post-launch
**Dependency:** None
**Where it goes:**
- Delete: `apps/web/src/app/api/spaces/browse/route.ts` (deprecated, has browse-v2)
- Consolidate: `apps/web/src/app/api/spaces/my/route.ts` + `apps/web/src/app/api/spaces/mine/route.ts` -> single route
- Consolidate: `apps/web/src/app/api/spaces/transfer/route.ts` + `apps/web/src/app/api/spaces/[spaceId]/transfer-ownership/route.ts` -> single route
- Consolidate: `apps/web/src/components/spaces/unified-activity-feed.tsx` + `apps/web/src/components/spaces/homebase-activity-feed.tsx` -> single component

**What exists:**
- `browse/route.ts` has sunset date 2026-06-01 -- deprecated
- `my/` and `mine/` are duplicate endpoints for user's spaces
- Two transfer routes doing the same thing
- Two activity feed components with overlapping functionality

**Acceptance criteria:**
- No deprecated routes serve traffic
- No duplicate endpoints for the same resource
- Feed components consolidated into one

---

### GAP-19: Seed Route Production Gate

**Size:** XS (< 1 day)
**Priority:** P0 -- Launch blocker (security)
**Dependency:** None
**Where it goes:**
- Fix: `apps/web/src/app/api/spaces/seed/route.ts`

**What exists:**
- Seed route exists for populating test data
- Unclear if it's gated from production access

**Implementation hint:**
- Add environment check: `if (process.env.NODE_ENV === 'production') return respond.error('Not available', 'FORBIDDEN', { status: 403 })`
- Or use `withAdminAuthAndErrors` wrapper to restrict to admin users only

**Acceptance criteria:**
- Seed route returns 403 in production environment
- Only accessible in development or by admin users

---

## CONFIGURATION CHANGES (from Strategy Alignment)

### GAP-20: Kill Quorum / Activation Threshold

**Size:** XS (< 1 day)
**Priority:** P0 -- Launch blocker
**Dependency:** None
**Where it goes:**
- Fix: wherever `DEFAULT_ACTIVATION_THRESHOLD` is defined (likely in domain constants or space aggregate)

**What exists:**
- `ActivationStatus`: ghost (0), gathering (1-9), open (10+)
- `DEFAULT_ACTIVATION_THRESHOLD = 10`
- This BLOCKS the 30-leader pre-launch: leaders can't use full features until 10 members join

**Implementation hint:**
- Set `DEFAULT_ACTIVATION_THRESHOLD = 1`
- OR: skip activation check entirely for claimed spaces (claimed = fully active)
- One constant change + verify no downstream logic breaks

**Acceptance criteria:**
- Claimed spaces have full functionality immediately (no 10-member gate)
- Leader can create events, chat, invite members from moment of claim

---

### GAP-21: Default Governance to Hierarchical

**Size:** XS (< 1 day)
**Priority:** P1 -- Week 1 post-launch
**Dependency:** None
**Where it goes:**
- Fix: space creation flow, governance selection UI
- Default governance model to `hierarchical` in space creation
- Hide governance selector from space creation/settings UI

**What exists:**
- `GovernanceModel`: flat, emergent, hybrid, hierarchical
- UI allows selection during space creation

**Implementation hint:**
- Default to `hierarchical` in CreateSpace handler
- Hide governance selector from `SpaceCreationModal.tsx` and settings
- Keep the field in data model for future use

**Acceptance criteria:**
- New spaces default to hierarchical governance
- No governance selector visible to leaders at launch

---

### GAP-22: Hide HiveLab Features from Spaces

**Size:** S (1-2 days)
**Priority:** P1 -- Week 1 post-launch
**Dependency:** None
**Where it goes:**
- 19 files identified in code audit (HiveLab kill list)
- UI components: `ToolsMode.tsx`, `sidebar-tool-section.tsx`, `sidebar-tool-card.tsx`, `builder/BuilderShell.tsx`, `builder/TemplateCard.tsx`, `builder/AccessOption.tsx`
- Modals: `AddTabModal.tsx`, `AddWidgetModal.tsx`, `SpaceLeaderOnboardingModal.tsx`, `MobileActionBar.tsx`, `MobileDrawer.tsx`

**What exists:**
- Code audit identified 19 files as HiveLab-specific (K-rated)
- Several modals reference HiveLab concepts

**Implementation hint:**
- Use feature flags: `const { hiveLab } = useFeatureFlags(); if (!hiveLab) return null;`
- Feature flag system already exists (`use-feature-flags.ts`)
- Don't delete code -- just hide from UI via flags
- Strip HiveLab options from modals that mix HiveLab + non-HiveLab features

**Acceptance criteria:**
- No HiveLab tool deployment, builder, or tool mode visible in space UI
- Leader onboarding doesn't mention tools or HiveLab
- All hidden features toggleable back on via feature flags

---

### GAP-23: Hide Webhooks + Widget Builder UI

**Size:** XS (< 1 day)
**Priority:** P1 -- Week 1 post-launch
**Dependency:** None
**Where it goes:**
- Hide webhook management from space settings
- Hide widget/tab customization UI
- Keep API routes functional (just hide UI)

**What exists:**
- Webhook routes: `[spaceId]/webhooks/route.ts`, `[spaceId]/webhooks/[webhookId]/route.ts`
- Widget/tab modals: `AddTabModal.tsx`, `AddWidgetModal.tsx`

**Implementation hint:**
- Feature flag or conditional render: remove from settings navigation
- Templates still auto-deploy default tabs/widgets -- just don't let leaders manually customize

**Acceptance criteria:**
- No webhook management visible in space UI
- No "Add Tab" or "Add Widget" buttons visible
- Template defaults still apply on space creation/claim

---

## ONBOARDING & GROWTH GAPS

### GAP-24: Onboarding Flow with Schedule Entry

**Size:** M (3-5 days)
**Priority:** P0 -- Launch blocker
**Dependency:** GAP-01 (schedule input UI)
**Where it goes:**
- Extend: `apps/web/src/app/enter/page.tsx` (EXISTS -- entry/onboarding page)
- New step component: `apps/web/src/components/onboarding/schedule-step.tsx` (NEW)

**What exists:**
- Entry page at `/enter` handles auth flow
- Profile creation (name, year, major) likely in onboarding
- No schedule entry step in onboarding

**Implementation hint:**
- After email verification + profile basics, add "Enter your class schedule" step
- Show value: "Enter your schedule and we'll show you what's happening between your classes"
- Make it skippable but strongly encouraged (with reminder on dashboard)
- Paste-from-text parser for UB HUB schedule format
- Link to GAP-01 schedule input component

**Acceptance criteria:**
- Schedule entry appears as onboarding step after profile creation
- Step is skippable with "remind me later" option
- Pasted text from UB HUB is parsed correctly for common formats
- 70%+ completion target

---

### GAP-25: QR Code Space Join Flow

**Size:** S (1-2 days)
**Priority:** P0 -- Launch blocker
**Dependency:** None (invite system exists)
**Where it goes:**
- Extend: `apps/web/src/app/api/spaces/invite/[code]/route.ts` (EXISTS)
- New: QR code generation component

**What exists:**
- Invite code validation: `/api/spaces/invite/[code]/validate/route.ts`
- Invite code redemption: `/api/spaces/invite/[code]/redeem/route.ts`
- Invite link generation: `invite-link-modal.tsx`
- No QR code generation or display

**Implementation hint:**
- Generate QR code from invite URL using a lightweight library (e.g., `qrcode` npm package)
- Add "Show QR Code" button to invite-link-modal
- QR code resolves to `hive.app/join/[code]` which triggers join flow
- Critical for activities fair: leaders print QR cards from their space dashboard

**Acceptance criteria:**
- Leader can generate and display QR code for their space
- QR code scans to a working join URL
- QR code is downloadable/printable
- Join flow works for new users (triggers onboarding) and existing users (direct join)

---

## INFRASTRUCTURE GAPS

### GAP-26: Automations Rebrand as Space Autopilot Engine

**Size:** S (1-2 days)
**Priority:** P2 -- Month 1
**Dependency:** None
**Where it goes:**
- Extend: `apps/web/src/app/api/spaces/[spaceId]/automations/` (EXISTS -- 5 routes)
- Rebrand in UI: "Automations" -> "Autopilot"

**What exists:**
- Full automation system: discriminated union triggers (member_join, event_reminder, schedule, keyword), CRUD routes, toggle, trigger, from-template
- Cron job for scheduled automations: `/api/cron/automations/route.ts`
- Well-architected with Zod validation

**Implementation hint:**
- UI rebrand only at launch -- rename "Automations" to "Autopilot" in leader-facing UI
- Pre-configure "Space Autopilot" templates: welcome message on member join, event reminder 1h before, weekly digest
- The `from-template` route already supports one-click automation setup
- Post-launch: add AI-powered automation suggestions based on space activity

**Acceptance criteria:**
- "Autopilot" tab in space settings (was "Automations")
- 3 pre-built Autopilot templates available on space claim
- Existing automation functionality unchanged

---

### GAP-27: Schedule Text Parser

**Size:** S (1-2 days)
**Priority:** P0 -- Launch blocker (part of GAP-01 but distinct technical challenge)
**Dependency:** None
**Where it goes:**
- Lib: `apps/web/src/lib/schedule-parser.ts` (NEW)

**What exists:**
- Nothing. No schedule parsing exists.

**Implementation hint:**
- Parse common UB HUB schedule text format: "BIO 101 | MWF 9:00AM - 10:15AM | Knox 20"
- Support: tab-separated, pipe-separated, and common copy-paste formats
- Regex-based parser for time extraction (e.g., `(\d{1,2}:\d{2}\s*(?:AM|PM))`)
- Day mapping: M/MW/MWF/TR/T/R/W/F -> full day names
- Graceful fallback: if parsing fails, let user enter manually
- Consider using AI (Gemini) as fallback parser for non-standard formats

**Acceptance criteria:**
- Parses UB HUB copy-paste format correctly for 90%+ of schedules
- Handles MWF, TR, and irregular meeting patterns
- Returns structured array of ClassBlock objects
- Shows preview for user confirmation before saving

---

### GAP-28: Event Check-In / Attendance Confirmation

**Size:** S (1-2 days)
**Priority:** P1 -- Weeks 1-2 post-launch
**Dependency:** None
**Where it goes:**
- API: `apps/web/src/app/api/spaces/[spaceId]/events/[eventId]/checkin/route.ts` (NEW)
- Component: check-in button/QR on event detail view

**What exists:**
- RSVP system exists (going/interested/not_going)
- No actual attendance confirmation (did they show up?)
- Strategy demands attendance tracking for leader analytics

**Implementation hint:**
- QR code at event location that attendees scan to check in
- OR: "I'm here" button that appears when event is live (within 15 min of start time)
- Store check-ins as confirmed attendance in event document
- Feed into leader analytics (GAP-08): actual attendance vs. RSVPs

**Acceptance criteria:**
- Attendees can confirm attendance at events
- Leader sees RSVP count vs. actual attendance
- Check-in data feeds analytics dashboard

---

## Summary

### P0 Launch Blockers (9 items, ~16-23 dev-days)

| # | Gap | Size | Dev-Days |
|---|-----|------|----------|
| GAP-01 | Schedule Input UI + Storage | M | 3-5 |
| GAP-02 | Gap Detection Algorithm | S | 1-2 |
| GAP-03 | "Your Campus Today" Dashboard | M | 3-5 |
| GAP-04 | Cross-Space Event Batch Query | S | 1-2 |
| GAP-07 | AI Event Generation | M | 3-5 |
| GAP-16 | Validation Schema Drift Fix | S | 1-2 |
| GAP-17 | SpaceId Crypto Fix | XS | 0.5 |
| GAP-19 | Seed Route Production Gate | XS | 0.5 |
| GAP-20 | Kill Quorum Threshold | XS | 0.5 |
| GAP-24 | Onboarding with Schedule Entry | M | 3-5 |
| GAP-25 | QR Code Join Flow | S | 1-2 |
| GAP-27 | Schedule Text Parser | S | 1-2 |

### P1 Post-Launch Weeks 1-2 (8 items, ~10-14 dev-days)

| # | Gap | Size | Dev-Days |
|---|-----|------|----------|
| GAP-08 | Leader Analytics Dashboard | M | 3-5 |
| GAP-09 | Simplified Leader Admin View | S | 1-2 |
| GAP-13 | Activity Surfacing in Feed | S | 1-2 |
| GAP-14 | Behavioral Signal Collection | S | 1-2 |
| GAP-18 | Dead Code Cleanup | S | 1 |
| GAP-21 | Default Governance | XS | 0.5 |
| GAP-22 | Hide HiveLab Features | S | 1-2 |
| GAP-23 | Hide Webhooks + Widget Builder | XS | 0.5 |
| GAP-28 | Event Check-In | S | 1-2 |

### P2 Month 1 (5 items, ~12-19 dev-days)

| # | Gap | Size | Dev-Days |
|---|-----|------|----------|
| GAP-05 | Location-Aware Suggestions | S | 1-2 |
| GAP-06 | Daily Briefing AI | M | 3-5 |
| GAP-10 | Institutional Memory | M | 3-5 |
| GAP-11 | AI Notification Drafting | S | 1-2 |
| GAP-15 | Semantic Search | L | 5-8 |
| GAP-26 | Automations Rebrand | S | 1-2 |

### Critical Path

```
GAP-17 (SpaceId fix, 0.5d)
GAP-19 (Seed gate, 0.5d)
GAP-20 (Kill quorum, 0.5d)
GAP-16 (Schema drift, 1-2d)
        ↓
GAP-01 (Schedule input, 3-5d) ─→ GAP-27 (Parser, 1-2d)
        ↓
GAP-02 (Gap detection, 1-2d)
        ↓
GAP-04 (Event batch query, 1-2d) ──→ GAP-03 (Dashboard, 3-5d)
                                            ↓
                                     GAP-24 (Onboarding, 3-5d)

GAP-07 (AI event gen, 3-5d) ──→ parallel with schedule track

GAP-25 (QR join, 1-2d) ──→ parallel, no dependencies
```

**Two parallel tracks:**
1. **Commuter Track:** GAP-17 → GAP-16 → GAP-01+27 → GAP-02 → GAP-04 → GAP-03 → GAP-24 (~14-22 days serial)
2. **Autopilot Track:** GAP-20 → GAP-19 → GAP-07 → GAP-25 (~5-9 days serial)

With 2 devs working parallel tracks: **~3-4 weeks to P0 complete.**

---

### Reusability Confirmation

The code audit's 65-70% reuse estimate is **confirmed and slightly conservative**. Key findings from codebase exploration:

1. **`/api/events/route.ts` already supports `from`/`to` time-window queries** -- the alignment audit said this didn't exist. It does. Reduces GAP-04 to a wrapper.
2. **`/api/calendar/free-time/route.ts` already has gap detection logic** -- just needs to accept class schedule blocks as input instead of only calendar events.
3. **`/api/events/personalized/route.ts` already does relevance ranking** with interest matching, social proof, time proximity. Solid foundation for dashboard content ordering.
4. **AI generation infrastructure is production-ready** -- Firebase AI, Goose/Groq backends, rate limiting, usage tracking. Event generation is adapting an existing pattern, not building from scratch.
5. **Automations system is well-architected** -- discriminated union triggers, templates, cron execution. Rebranding to "Autopilot" is cosmetic.
6. **Feature flag system exists** -- HiveLab features can be hidden without deleting code.

The main NEW work is: schedule input UI (GAP-01), dashboard redesign (GAP-03), AI event generation (GAP-07), and onboarding flow (GAP-24). Everything else is extending, fixing, or configuring what already exists.
