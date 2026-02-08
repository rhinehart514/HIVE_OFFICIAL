# Spaces Feature Audit: Strategy Alignment

**Every feature rated against two products:**
1. **Commuter Home Base** -- daily-use dashboard, events surface by TIME not membership, schedule-aware
2. **Space Autopilot** -- AI handles club admin, 3-line event creation, auto-attendance, institutional memory

Rating scale: **CRITICAL** (must ship for launch) / **USEFUL** (adds real value, ship in Layer 2-3) / **NICE-TO-HAVE** (defer post-launch) / **KILL** (remove or hide, wastes attention)

---

## Feature Cluster Ratings

---

### 1. Events System

**Rating: CRITICAL**

**Commuter Home Base:** The events system is the beating heart of the commuter dashboard. Events with `startDate`, `endDate`, `location`, `type`, and RSVP data are exactly what the schedule-aware dashboard needs to answer "what's happening during my gap?" The flat `/events` collection with `spaceId` filter (already built at `/api/spaces/[spaceId]/events/route.ts`) was designed for cross-space queries. The `campusId` isolation is correctly enforced. Event types (`academic`, `social`, `recreational`, `cultural`, `meeting`, `virtual`) map well to commuter interest filtering.

**What's missing for Commuter Home Base:**
- No cross-space temporal query endpoint. Current GET only fetches events for ONE space. Need `/api/events/upcoming` that queries across ALL spaces by time window + campusId -- the single most important missing feature.
- No schedule-gap matching. Events need to be filtered against a user's class schedule to show "fits in your 2h gap."
- No "happening now" query. Need real-time filtering for events starting within the next 60 minutes.

**Space Autopilot:** Event creation (`POST /api/spaces/[spaceId]/events`) is solid -- Zod validation, security scanning, auto-linked chat boards, member notifications. This is the foundation for AI event generation. A leader types 3 lines, AI fills the `CreateEventSchema` fields, and the existing POST handler does the rest.

**What's missing for Autopilot:**
- No AI generation endpoint. Need `/api/events/generate` that takes minimal leader input and returns a complete `CreateEventSchema`-compatible object via Gemini structured output.
- No attendance tracking beyond RSVP count. Need check-in confirmation (did they actually show up?).

**Verdict:** Events are the #1 reuse asset. Extend, don't rebuild.

---

### 2. Chat / Boards System

**Rating: NICE-TO-HAVE**

**Commuter Home Base:** Chat adds zero value to the commuter dashboard. Commuters need to know what's happening during their gaps, not read a Discord-style message thread in a club they may not have joined. Chat is a retention feature for members who already belong, not a discovery or engagement tool for commuters.

**Space Autopilot:** Chat has marginal value for leaders. Auto-linked event boards (already built -- `autoLinkEventToBoard`) are genuinely useful: each event gets its own discussion thread. But the full chat infrastructure (typing indicators, reactions, pinned messages, search, read receipts, thread replies) is overbuilt for launch.

**What actually keeps people coming back?** Events and what happens at them. Not chat. GroupMe already owns group chat for campus orgs and switching cost is astronomical. HIVE's chat will always be the second-best option because it doesn't have the network. Events-first is the correct play.

**The real question:** Is any of this code harmful? No. It works. Leave it. Don't invest another hour in it for launch. Let leaders and members use it if they want, but don't feature it.

**Existing API surface (keep but don't extend):**
- `/api/spaces/[spaceId]/chat` -- messages, replies, reactions, typing, pinned, search, stream, read, intent
- `/api/spaces/[spaceId]/boards` -- board CRUD, reorder
- UI: `SpaceChatBoard.tsx`, `TheaterChatBoard.tsx`, `ChatRowMessage.tsx`, `ChatSearchModal.tsx`, `PinnedMessagesWidget.tsx`, `TypingDots.tsx`

**Verdict:** Leave it alone. Don't promote it. Don't extend it. Let it exist for the 5% who want it.

---

### 3. Templates (9 Types)

**Rating: USEFUL (for Autopilot) / NICE-TO-HAVE (for Commuter Home Base)**

**Templates defined:** Study Group, Research Lab, Student Club, Dorm Community, Greek Life, Career Network, Event Series, Hackathon, Minimal. Each pre-configures tabs, widgets, and settings.

**Commuter Home Base:** Templates are invisible to commuters. A commuter doesn't care if the Photography Club uses the "Student Club" template vs. "Event Series" template. Templates affect the internal structure of a space, not how events surface on the dashboard.

**Space Autopilot:** Templates have real value here. When a leader claims or creates a space, auto-deploying the right template (already happening in `/api/spaces/claim/route.ts` via `getSystemTemplateForCategory`) saves setup time. This IS the "zero-admin" promise. Leader claims space, template deploys tabs + widgets + tools, space is ready.

**But 9 templates is premature complexity.** For the 30-leader pre-launch:
- **Student Club** covers 80% of use cases
- **Study Group** covers another 10%
- **Minimal** covers the remaining 10%
- Greek Life, Dorm Community, Research Lab, Career Network, Hackathon, Event Series -- these serve real but low-priority segments

**Verdict:** Keep 3 templates for launch (Student Club, Study Group, Minimal). Hide the other 6 in code but don't surface them in the builder UI. Re-enable when there's demand signal.

---

### 4. Quorum / Activation (10-Member Threshold)

**Rating: KILL (for launch)**

**The system:** `ActivationStatus` has three states: `ghost` (0 members), `gathering` (1 to 9 members), `open` (10+ members). Full community features (chat) unlock at the threshold (`DEFAULT_ACTIVATION_THRESHOLD = 10`).

**Commuter Home Base:** This system is invisible to commuters. Events from a space show on the dashboard regardless of activation status. No impact.

**Space Autopilot:** This is a **direct barrier** to the 30-leader pre-launch strategy. The pitch is "claim your space, start posting events immediately." If a leader claims their space and can't access full features because they only have 3 members, HIVE just broke its promise. The leader bounces. In the 21-day window, speed matters more than community health gates.

**The theory was sound:** gathering -> open prevents dead spaces from cluttering discovery. But the strategy explicitly says "20-30 leaders create spaces over summer, students join at the activities fair." That means every space starts at 1-3 members (the e-board) for weeks before students arrive. Locking features behind a 10-member gate during the most critical adoption period is self-sabotage.

**Verdict:** Set `DEFAULT_ACTIVATION_THRESHOLD = 1` or remove the gate entirely for launch. Claimed spaces should be fully functional from moment of claim. Revisit quorum for user-created spaces after launch.

---

### 5. Widget / Tab System

**Rating: NICE-TO-HAVE**

**The system:** Spaces have custom tabs (feed, widget, resource, custom) with configurable widgets (calendar, poll, links, files, RSS, custom). Widgets have position, size, visibility. Tabs have ordering, archiving.

**Commuter Home Base:** Completely invisible. Commuters interact with events on the dashboard, not with space-internal tab layouts.

**Space Autopilot:** Marginal value. Templates auto-deploy reasonable defaults. Leaders rarely customize these on their own -- they're too busy running the actual club. The widget/tab system is a content management system for people who won't use a content management system.

**The honest question:** Has any college club leader ever said "I wish I could add a custom RSS widget to my club's second tab"? No. They want to post events and communicate with members.

**Existing code:**
- Entities: `Tab`, `Widget` with full DDD modeling
- API: `/api/spaces/[spaceId]/tabs`, `/api/spaces/[spaceId]/widgets`
- UI: `AddTabModal.tsx`, `AddWidgetModal.tsx`

**Verdict:** Leave the defaults from templates. Hide the "Add Tab" and "Add Widget" UI from the space builder for launch. The complexity is not worth the cognitive load for leaders in weeks 1-4.

---

### 6. Tool Deployment (HiveLab)

**Rating: NICE-TO-HAVE (defer)**

**The system:** Tools can be "placed" in spaces via a sidebar. The `PlacedTool` entity tracks tool deployments with placement location, visibility, config overrides, and state. The `system-tool-registry.ts` defines per-category tool bundles. The claim flow auto-deploys template tools.

**Commuter Home Base:** Not relevant. Commuters don't interact with space-internal tools.

**Space Autopilot:** The auto-deploy on claim is good -- it gives spaces immediate functionality. But the manual tool deployment UI, tool connections, and the broader HiveLab integration are post-launch concerns. Leaders need events and members, not a tool marketplace.

**Strategy doc says it directly:** "HiveLab tool creation for students -- Interesting but not core to the commuter/leader strategy. Distraction from launch. Deprioritize."

**Verdict:** Keep auto-deploy on claim. Hide manual tool management UI. Don't invest in HiveLab integration for spaces until post-launch.

---

### 7. Posts / Resources

**Rating: NICE-TO-HAVE**

**Posts API:** `/api/spaces/[spaceId]/posts` -- full CRUD with comments, reactions, promoted posts
**Resources API:** `/api/spaces/[spaceId]/resources` -- file/link management

**Commuter Home Base:** Posts from spaces could theoretically surface on the commuter dashboard, but events are the primary content type that matters for "what's happening during my gap." Posts are static content (announcements, updates) -- not time-bound, not actionable for a commuter with a 2-hour window.

**Space Autopilot:** Resources are useful for institutional memory (meeting minutes, bylaws, templates). Posts serve as announcement feeds within spaces. Both are secondary to events.

**Verdict:** Leave working. Don't extend. Events > posts for both products.

---

### 8. Webhooks

**Rating: KILL**

**The system:** Full webhook CRUD at `/api/spaces/[spaceId]/webhooks` with signing secrets, event types, failure tracking, duplicate detection, 10-webhook limit.

**Commuter Home Base:** Zero relevance.

**Space Autopilot:** Who uses webhooks in a campus club app? The answer is: nobody. Zero club leaders at UB will configure HTTPS webhook endpoints. This is enterprise integration infrastructure for a product that doesn't have enterprise users. It was probably built to enable external integrations (Slack, Discord, custom bots) but that's a post-traction concern.

**The code is well-built** -- proper Webhook entity with DDD modeling, signing secrets, failure handling. Good engineering. Wrong priority.

**Verdict:** Hide from UI. Keep the code because it's clean and might matter later (university IT integrations). Don't invest another minute. Don't show in leader dashboard.

---

### 9. Leader Verification / Claiming

**Rating: CRITICAL**

**The system:** `/api/spaces/claim` -- leaders claim pre-seeded UBLinked spaces. Gets provisional access immediately. Admin verifies within 7 days. Auto-deploys template tools. Notifies waitlist members. Full DDD with `SpaceStatus`: unclaimed -> claimed -> verified.

**Commuter Home Base:** Indirect but essential. Without claimed spaces with active leaders posting events, the commuter dashboard has nothing to show. Leader claiming is the supply side of the commuter marketplace.

**Space Autopilot:** This IS the onboarding funnel for the 30-leader pre-launch. Leader finds their org in browse -> claims it -> gets provisional access -> starts posting events. The "provisional access immediately" design is exactly right for the 21-day window. No waiting for admin approval to start doing real work.

**Also related:** `/api/spaces/request-to-lead` for non-seeded spaces, builder permission checks, leader onboarding modal (`SpaceLeaderOnboardingModal.tsx`), leader setup progress (`LeaderSetupProgress.tsx`).

**Verdict:** Ship as-is. This is one of the highest-value features in the entire codebase.

---

### 10. Governance Models

**Rating: KILL (for launch)**

**The system:** `GovernanceModel` type: `flat`, `emergent`, `hybrid`, `hierarchical`. Affects how roles and permissions work within a space.

**Commuter Home Base:** Completely invisible. Commuters don't know or care about a space's governance model.

**Space Autopilot:** A 20-person Photography Club does not need to choose between flat, emergent, hybrid, or hierarchical governance. This is academic organizational theory applied to a campus club app. Every club at launch needs one model: the leader and their e-board have admin, everyone else is a member. That's hierarchical, and it's the only model that matters for the 30-leader pre-launch.

**Verdict:** Default all spaces to hierarchical. Remove governance selection from space creation flow. Revisit governance complexity when there's evidence that clubs want anything other than "president runs things."

---

### 11. Identity Spaces (Major / Residential / Community)

**Rating: USEFUL**

**The system:** Discovery quadrants: Major (profile-driven), Community (student orgs), Home (campus living), Greek. Identity spaces (`/api/spaces/identity`) auto-surface spaces relevant to the user's identity (major, dorm, affiliation).

**Commuter Home Base:** Major-based identity spaces are useful for commuters. "Study groups for your major" is a strong commuter value proposition. Residential identity spaces are anti-useful for commuters (they don't live on campus). Community quadrant helps with discovery.

**Space Autopilot:** Identity spaces help with automatic member matching but aren't core to the leader workflow.

**Verdict:** Keep Major and Community quadrants. De-emphasize Home/Residential for commuter-first launch. These categories serve discovery, which feeds the commuter dashboard.

---

### 12. Space Types (5 types)

**Rating: USEFUL**

**The system:** `SPACE_TYPE`: student_organizations, university_organizations, greek_life, campus_living, hive_exclusive. With UBLinked branch mapping, legacy normalization, and UI metadata.

**Commuter Home Base:** Space types enable filtering on the commuter dashboard. "Show me events from student orgs" or "show me university events" is useful.

**Space Autopilot:** Space type determines which template auto-deploys on claim, which tools are suggested, and which category the space appears in for browse.

**The categorization is reasonable** for the strategy. `student_organizations` is the primary target (684 clubs at UB). `university_organizations` covers departments. `greek_life` and `campus_living` are secondary. `hive_exclusive` covers user-created spaces.

**Verdict:** Ship as-is. The UBLinked branch mapping (`CAMPUSLABS_BRANCH_TO_TYPE`) is valuable for the seed data pipeline.

---

### 13. Builder UI

**Rating: USEFUL (simplified)**

**The system:** Space creation and setup tools. Builder components: `BuilderShell.tsx`, `TemplateCard.tsx`, `AccessOption.tsx`. Builder API routes: `/api/spaces/[spaceId]/builder-permission`, `/api/spaces/[spaceId]/builder-status`, `/api/spaces/[spaceId]/apply-template`.

**Commuter Home Base:** Not relevant.

**Space Autopilot:** Leaders need to create and configure spaces. But the builder should be MINIMAL for launch. Claim space -> auto-template -> start posting events. The builder's value is in making setup feel like 30 seconds, not 30 minutes.

**What matters:** claim flow, template auto-deploy, basic space info editing (name, description, avatar).
**What doesn't matter for launch:** custom tab configuration, widget placement, tool deployment UI.

**Verdict:** Keep the claim flow + template auto-deploy. Simplify the builder to essential fields only. Hide advanced customization.

---

### 14. Analytics

**Rating: USEFUL (for Autopilot)**

**The system:** `/api/spaces/[spaceId]/analytics` -- space analytics endpoint.

**Commuter Home Base:** Not relevant.

**Space Autopilot:** Analytics serves two functions:
1. **Leader dashboard:** Show leaders "22 people attended, 4 were new members, attendance up 30%." This is the "your club is working" signal that keeps leaders posting events.
2. **AI context:** Analytics data feeds the AI's understanding of what works (optimal event times, attendance patterns, member engagement health).

**What's needed that probably doesn't exist:**
- Attendance trends over time
- Event-level analytics (which events get highest attendance)
- Member engagement scoring (active vs. drifting vs. churned)
- Optimal timing suggestions ("your commuter members are mostly free Tuesday 2-4pm")

**Verdict:** Extend analytics for the leader dashboard in Layer 2 (weeks 5-8). Basic event counts and member counts are sufficient for launch.

---

### 15. Member Management

**Rating: CRITICAL (core subset)**

**The system:**
- Members API: `/api/spaces/[spaceId]/members` -- list, add, remove, batch operations
- Membership: `/api/spaces/[spaceId]/membership/me` -- self-check membership
- Roles: owner, admin, moderator, member, guest
- Join flow: `/api/spaces/join-v2` -- join with various policies (open, approval, invite-only)
- Invite system: `/api/spaces/invite/[code]/validate`, `/api/spaces/invite/[code]/redeem`
- Leave: `/api/spaces/leave`
- Ghost mode: privacy filtering via `GhostModeService`
- Join requests: `/api/spaces/[spaceId]/join-requests`

**Commuter Home Base:** Membership determines which spaces a student "belongs to," which affects personalized event surfacing. But for the commuter dashboard, events from ALL spaces should surface based on time and interest, not just joined spaces. The join action becomes "save this space for follow-through."

**Space Autopilot:** Member management is core. Leaders need to see their members, invite people, manage roles (at least owner/admin/member). The QR code invite flow at the activities fair is critical for the 30-leader pre-launch.

**What matters for launch:**
- Join (open policy for most clubs)
- Leave
- Member list for leaders
- Invite links for QR codes at the fair
- Basic role assignment (owner, admin, member)

**What doesn't matter for launch:**
- Ghost mode (privacy feature, defer)
- Moderator role (admin is sufficient)
- Guest role (everything is campus-isolated already)
- Batch member operations
- Join request approval workflows (use open join for launch)

**Verdict:** Keep join/leave/invite/member-list. Simplify roles to owner/admin/member. Defer ghost mode, moderation workflows, and batch operations.

---

## Summary Table

| Feature | Rating | Commuter Home Base | Space Autopilot | Action |
|---------|--------|-------------------|-----------------|--------|
| **Events system** | CRITICAL | Core data for dashboard | Foundation for AI generation | Extend with cross-space queries |
| **Chat / boards** | NICE-TO-HAVE | No value | Marginal value | Leave working, don't extend |
| **Templates (9)** | USEFUL | Invisible | Saves leader setup time | Keep 3, hide 6 |
| **Quorum (10-member)** | KILL | No impact | Blocks leader adoption | Set threshold to 1 |
| **Widget / tab system** | NICE-TO-HAVE | Invisible | Marginal | Hide customization UI |
| **Tool deployment** | NICE-TO-HAVE | Not relevant | Auto-deploy is good | Keep auto-deploy, hide manual |
| **Posts / resources** | NICE-TO-HAVE | Events > posts | Secondary to events | Leave working, don't extend |
| **Webhooks** | KILL | Zero relevance | Zero user demand | Hide from UI |
| **Leader claiming** | CRITICAL | Enables content supply | THE onboarding funnel | Ship as-is |
| **Governance models** | KILL | Invisible | Premature complexity | Default to hierarchical |
| **Identity spaces** | USEFUL | Major-based discovery | Helps matching | Keep Major/Community, de-emphasize Residential |
| **Space types** | USEFUL | Enables filtering | Template selection | Ship as-is |
| **Builder UI** | USEFUL | Not relevant | Needs simplification | Simplify for launch |
| **Analytics** | USEFUL | Not relevant | Leader retention tool | Extend in Layer 2 |
| **Member management** | CRITICAL | Membership affects surfacing | Core leader workflow | Keep core, defer ghost/moderation |

---

## What's MISSING That the Strategy Demands

### 1. Cross-Space Event Query by Time Window (CRITICAL -- Layer 1)

**Current state:** Events are queried per-space at `/api/spaces/[spaceId]/events`. There is no endpoint to query events across all spaces filtered by time window.

**What's needed:** `GET /api/events/upcoming?from=2026-09-03T10:15:00&to=2026-09-03T12:45:00&campusId=ub` -- returns all events from all spaces that fall within the student's schedule gap. This is the single most important new endpoint for the commuter dashboard.

**Technical path:** The events are already in a flat `/events` collection with `campusId` and `startDate` fields. This is a Firestore compound query with campusId + startDate range. Straightforward.

### 2. AI Event Generation Endpoint (CRITICAL -- Layer 1)

**Current state:** No AI-assisted event creation exists. HiveLab has Gemini structured output patterns but for a different domain (tool generation).

**What's needed:** `POST /api/events/generate` -- accepts minimal leader input ("Photo walk Wednesday 4pm, meet at Baird Point, beginners welcome"), returns a complete event object matching `CreateEventSchema`. Uses Gemini structured output with campus-aware context (building names, locations, event type inference).

**Technical path:** Adapt HiveLab's Gemini integration pattern. Define a prompt template with campus context. Use Vercel AI SDK `generateObject` with the event schema as the Zod type. Estimated build: 2-3 days.

### 3. Schedule-Aware Surfacing Logic (CRITICAL -- Layer 1)

**Current state:** No schedule-gap detection exists. The calendar page exists but doesn't compute gaps.

**What's needed:**
- Schedule input/import at `/me/schedule` or integrated into onboarding
- Gap detection service that computes free windows from class blocks
- Dashboard sections organized by gap: "10:15am - 12:45pm: Your 2.5h gap" with events that fit

**Technical path:** Schedule blocks stored in user profile (the profile system already has `intelligence.schedule` fields). Gap detection is simple interval arithmetic. Dashboard renders events grouped by gap windows.

### 4. Leader Analytics Dashboard (USEFUL -- Layer 2)

**Current state:** Basic analytics endpoint exists. No leader-facing analytics UI with actionable insights.

**What's needed:** A dashboard at `/s/[handle]/analytics` (page likely exists) showing:
- Event attendance trends
- Member growth
- Engagement health (active/drifting/churned members)
- Optimal event timing suggestions based on member schedule data
- Comparison to previous period

**Technical path:** Extend the existing analytics API. Build a dashboard component. This is a Layer 2 feature (weeks 5-8).

### 5. Simplified Leader View (USEFUL -- Layer 1)

**Current state:** The space view has full complexity: tabs, widgets, boards, tools, all visible.

**What's needed:** A "leader mode" that shows only what matters:
- Quick event creation (with AI)
- Member list with attendance
- Basic settings
- Upcoming events

Hide tabs, widgets, tools, boards, governance, webhooks, and other complexity. Leaders should see a clean, focused admin surface.

### 6. Commuter Matching (USEFUL -- Layer 3)

**Current state:** No schedule overlap matching exists.

**What's needed:** "3 other students from your Psych 101 are usually in Capen during your Tuesday gap." Requires schedule data from multiple users, overlap computation, and privacy-safe surfacing.

**Technical path:** Once schedule data exists (Layer 1), batch compute overlaps. This is a Layer 3 feature (month 2-3) that requires density (100+ commuters with schedules entered).

---

## Top-Line Recommendations

**KILL or hide for launch:**
- Quorum/activation threshold (set to 1)
- Governance model selection (default hierarchical)
- Webhooks UI
- Widget/tab customization UI
- Tool deployment manual UI

**CRITICAL to ship:**
- Events system (existing, extend with cross-space queries)
- Leader claiming (existing, ship as-is)
- Member management core (existing join/leave/invite)
- AI event generation (new, ~2-3 day build)
- Cross-space temporal event queries (new, ~1-2 day build)
- Schedule input + gap detection (new, ~3-4 day build)

**The math:** ~65-70% of the spaces infrastructure is directly reusable. The critical missing pieces (cross-space queries, AI generation, schedule logic) are 1-2 weeks of focused work. The strategy is buildable on this codebase.
