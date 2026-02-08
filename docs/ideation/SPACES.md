# Spaces System Ideation

Grounded in the actual HIVE codebase as of Feb 2026. Every option references real files and patterns.

---

## 1. Space Creation Experience

### Current State

The creation flow lives in `apps/web/src/components/spaces/SpaceCreationModal.tsx` -- a 3-step modal wizard (Template > Identity > Access) that posts to `POST /api/spaces` in `apps/web/src/app/api/spaces/route.ts`. After creation, `autoDeployTemplate()` fires asynchronously to set up tabs and widgets from `packages/core/src/domain/spaces/templates/index.ts` (9 templates: Study Group, Research Lab, Student Club, Dorm Community, Greek Life, Career Network, Event Series, Hackathon, Minimal).

Blockers: 7-day account age gate (`apps/web/src/app/api/spaces/route.ts` line 166), email verification required, 3 spaces/day limit. Category restrictions block non-admins from `university_organizations` and unverified users from `greek_life`.

The creation modal hardcodes 4 template options (Club, Study, Interest, Project) that don't map cleanly to the 9 rich templates in the domain layer. The `category` field sent to the API is always `student_org` regardless of template choice.

### Option A: Instant Spaces (30-Second Creation)

Collapse the wizard to a single screen: name + template selection. Auto-generate handle from name. Default to `open` access. Skip the access step entirely -- leaders can change it later from settings.

What breaks: The "dramatic" handle claim ceremony (`ThresholdReveal`, `WordReveal` in the launch step) goes away. The creation experience loses emotional weight. Some leaders will forget to set access controls and end up with open spaces they wanted to be private. The handle auto-generation could create awkward slugs (e.g., "ub-consulting-club-2" for name conflicts).

Where to implement: Modify `SpaceCreationModal.tsx` to remove step state machine. Keep `HandleInput` with `useDramaticHandleCheck()` but make it inline with name field. The `POST /api/spaces` route stays the same -- just send different defaults.

### Option B: Template-First Creation with AI Description

Keep the template step but make it smarter. When a user picks "Study Group" and types "CSE 250 Final Prep," generate a description, suggest tags, and pre-fill settings automatically. The template system in `packages/core/src/domain/spaces/templates/index.ts` already has `suggestedDescription` and `suggestedTags` on every template -- surface them.

Wire the actual 9 domain templates into the creation modal instead of the 4 hardcoded ones. Map template selection to the correct `category` value (the Dorm template should create a `campus_living` space, not `student_org`).

What breaks: AI description generation adds latency and an API dependency. If the AI service is down, creation flow stalls. Students might accept bad descriptions without reading them. The template-to-category mapping means some templates (Greek Life) will hit the verification gate, creating a dead-end in the wizard if the user isn't verified.

Where to implement: Add a new `POST /api/spaces/generate-description` route. Update `SpaceCreationModal.tsx` template list to pull from `getAllTemplates()`. Fix the category mapping bug where template choice doesn't influence the `category` sent to the API.

### Option C: Quick-Start Presets (Copy From Living Spaces)

Add a "Start from an existing space" option. Show top 5 most popular spaces on campus with a "Use this layout" button. This copies the tab structure, widget configuration, and settings from a live space into a new one.

The infrastructure exists: `POST /api/spaces/[spaceId]/apply-template` route already handles template application. The `autoDeployTemplate()` function in `apps/web/src/app/api/spaces/route.ts` (line 303) already runs post-creation. Extend it to accept a `sourceSpaceId` instead of just category-based templates.

What breaks: Privacy -- you'd be exposing the internal structure (tab names, widget configs) of existing spaces. If a popular space has custom/sensitive tab names, those leak. Performance -- fetching live space structure adds a Firestore read to the creation flow. There's also a chicken-and-egg problem: new campuses have no popular spaces to copy from.

---

## 2. Space Discovery & Onboarding

### Current State

Discovery has two API paths: `GET /api/spaces/browse-v2` (cursor-paginated, supports search/sort/category filter, cold-start enrichment with events + mutual friends) and `GET /api/spaces/recommended` (behavioral psychology scoring: AnxietyRelief * 0.4 + SocialProof * 0.3 + InsiderAccess * 0.3).

The browse route uses `withOptionalAuth` so unauthenticated users can browse. It enriches results with `upcomingEventCount`, `nextEvent`, `mutualCount`, and `toolCount` ("cold start signals" per the route comments).

The join flow has a "Threshold" experience (`apps/web/src/app/s/[handle]/components/threshold/threshold-view.tsx`) -- a split-panel layout showing the space identity (60%) and a blurred activity preview behind a glass barrier (40%). Mutual connections show as "familiar faces." The join ceremony has its own animation component (`join-ceremony.tsx`).

Invite links are supported via `POST /api/spaces/[spaceId]/invite` -- UUID codes, max 5 active per space, 30-day max expiry, 100-use max. Redemption at `POST /api/spaces/invite/[code]/redeem`.

Space preview modals (`apps/web/src/components/spaces/space-preview-modal.tsx`) show before join/enter, pulling from `GET /api/spaces/[spaceId]/preview` which returns recent message, upcoming event, online count, and deployed tools count.

### Option A: QR Code + Deep Link Joins

Generate per-space QR codes that leaders can print and post at events, meetings, or on campus bulletin boards. Scan goes to `hive.college/s/[handle]` which shows the Threshold view for non-members.

This leverages the existing handle system (`/s/[handle]` route in `apps/web/src/app/s/[handle]/page.tsx`) and invite code infrastructure. Add a QR generator component that encodes the invite link URL from the existing `POST /api/spaces/[spaceId]/invite` endpoint.

What breaks: QR codes become stale when invite links expire (max 30 days). If the leader doesn't generate new codes, physical materials become dead links. Students scanning QR codes on mobile will hit the auth wall before they can even see the space -- they need a HIVE account first, which requires campus email verification. The "cool factor" of QR codes wears off fast.

Where to implement: New component in `apps/web/src/components/spaces/qr-code-generator.tsx`. Use `invite.link` from the existing POST response (`https://hive.college/spaces/join/${code}`). Add QR generation library (e.g., `qrcode` package).

### Option B: "Spaces Near You" -- Location-Aware Discovery

Use the `campus_living` space type to surface spaces relevant to where students are physically located. If a student's profile says they live in Governors Hall, auto-surface the Governors dorm space. Extend to buildings: if a student's schedule puts them in Davis Hall on Tuesdays, surface CS-related spaces.

The data model already supports this: `identityType: 'residence'` exists on `EnhancedSpaceProps` (line 336 of `enhanced-space.ts`), and `communityType` supports identity-based matching. The `QUADRANT_META` in `space-categories.ts` already maps `HOME` quadrant to `campus_living` spaces with `filterSource: 'profile'`.

What breaks: Requires schedule data or location data HIVE doesn't currently collect. Building the profile-to-space matching for academic buildings is a massive data problem (every campus has different building/department mappings). Privacy concerns with location tracking. Also, most discovery happens when students are in their dorm room, not walking past a building.

### Option C: Social Graph-Powered Discovery ("Your Friends Joined")

Double down on the existing social proof scoring. The recommendation engine already calculates `friendsInSpace` and `mutualConnections` (line 165-166 of `recommended/route.ts`). Surface this more aggressively: push notifications when 3+ friends join a space, show "Sarah, Mike, and 4 others are in this space" on browse cards.

The browse-v2 route already fetches mutual enrichment (`fetchMutualEnrichment` function, line 93) and returns avatar URLs for up to 3 mutual friends per space. The infrastructure is there -- just make it more visible.

What breaks: New users with no connections get zero social proof, making the feature useless for the people who need discovery most (freshmen). The friend graph in Firestore (`connections` collection) needs critical mass -- if nobody has connected yet, this is a cold-start dead zone. Also, showing "0 friends in this space" is worse than showing nothing.

---

## 3. Space Engagement Loops

### Current State

Activity tracking exists via `activityEvents` collection (queried in analytics, line 271 of `analytics/route.ts`). Chat is real-time via Firestore streaming (`apps/web/src/app/api/spaces/[spaceId]/chat/stream/route.ts`). Boards support pinned messages (max 10), threads, reactions, and typing indicators. Events have RSVP tracking. The analytics API calculates `engagementRate` and `peakActivityTimes`.

Automations exist (`apps/web/src/app/api/spaces/[spaceId]/automations/route.ts`) with triggers: `member_join`, `event_reminder`, `schedule`, `keyword`. Actions: `send_message`, `create_component`, `assign_role`, `notify`. But these are leader-configured, not system-driven.

### Option A: Weekly Digest Emails for Space Members

Every Sunday, email members a summary: "Your spaces this week" -- new messages count, upcoming events, new members who joined. Link back into HIVE for each space.

The data is already queryable: `activityEvents` with timestamps, `events` with `startAt`, `spaceMembers` with `joinedAt`. The analytics endpoint already groups by day. Extract that logic into a Cloud Function in `infrastructure/firebase/`.

What breaks: Email is anti-HIVE. The platform exists because campus email is noise. Adding more email risks being filtered or ignored. Building a reliable email pipeline (templates, send infrastructure, unsubscribe compliance with CAN-SPAM) is a significant project. Also, if members get the digest and never visit HIVE because the summary was enough, you've reduced engagement instead of increasing it.

### Option B: Streak Mechanics + "Space Alive" Indicators

Track daily active presence per member. Show a streak counter on profiles: "5-day streak in UB Consulting Club." At the space level, show a pulse indicator: green (active today), amber (active this week), grey (no activity in 7+ days). This uses the existing `lastActivityAt` field on boards (`Board` entity, line 37) and the space-level `lastActivityAt` on `EnhancedSpaceProps` (line 322).

Create a new automation trigger type `inactivity` -- if no messages for 48 hours, auto-post a prompt: "It's been quiet here. What's everyone working on?"

What breaks: Streaks create anxiety. A student who misses a day feels punished. The "space alive" indicator publicly shames dead spaces, which is 90% of the 400+ seeded UBLinked spaces that have no real activity. The inactivity auto-post feels robotic and could be annoying in spaces that are legitimately seasonal (e.g., a hackathon space between events). And counting "presence" requires solving the online/offline tracking problem, which the `spacePresence` collection in the preview API hints at but isn't fully built.

### Option C: Leader-Triggered Engagement Nudges

Give leaders a "Nudge" button on the analytics dashboard. Based on the `generateInsights()` function (line 480 of `analytics/route.ts`) that already produces actionable text ("No posts this period. Encourage members to share content."), present 1-click actions: "Send a prompt," "Create an event," "Start a poll."

These map directly to existing capabilities: `POST /api/spaces/[spaceId]/chat` for messages, the events API, and inline tools (`system:inline-poll` from `system-tool-registry.ts`). The automation system supports `send_message` and `create_component` actions -- wrap them in a simpler leader UX.

What breaks: This only works if leaders are active themselves. If the leader goes dormant, there's nobody to nudge. It doesn't solve the fundamental problem of spaces without engaged leadership. Also, the nudge button adds cognitive load to the analytics panel, which is already dense (`AnalyticsPanel` component has health score, 4 metric cards, peak times, top contributors, and top content).

---

## 4. Space Customization

### Current State

Tabs are first-class entities (`packages/core/src/domain/spaces/entities/tab.ts`) with types: `feed`, `widget`, `resource`, `custom`. Leaders can create, reorder, and delete tabs via `/api/spaces/[spaceId]/tabs/`. Widgets (`entities/widget.ts`) support types: `calendar`, `poll`, `links`, `files`, `rss`, `custom`. The sidebar shows boards, tools, and member previews.

Branding: `iconURL` and `coverImageURL` exist on `EnhancedSpaceProps` (lines 247-249). Upload endpoints exist: `POST /api/spaces/[spaceId]/upload-avatar` and `POST /api/spaces/[spaceId]/upload-banner`.

The space layout (`apps/web/src/app/s/[handle]/components/space-layout.tsx`) is a fixed split-panel: 200px sidebar + fluid content, 56px header, 64px input area.

### Option A: Theme System (Color Palettes + Accent Colors)

Let leaders pick an accent color that tints the header, sidebar highlights, and CTA buttons within their space. Store a `theme` object on the space document: `{ accentColor: '#hexvalue', headerStyle: 'solid' | 'gradient' }`. The design tokens in `packages/tokens/src/` would define safe ranges.

Render the theme via CSS custom properties on the `SpaceLayout` component (it already uses inline `style` blocks for CSS variables at lines 71-74).

What breaks: If leaders pick bad colors (low contrast, clashing with the dark theme), readability suffers. Every text element would need contrast checking. "A space that looks broken" damages trust in the platform. Also, this breaks the design system consistency promise -- `@hive/tokens` exists to prevent hardcoded values. You'd be intentionally introducing per-space overrides.

### Option B: Pinned Content + Custom Widgets

Let leaders pin any message/post to the top of any board. Let them create "info cards" -- static content blocks that appear in the sidebar or tab header. The pinning infrastructure exists: `Board.pinMessage()` (line 270 of `board.ts`), max 10 pins. Extend it with a `pinnedWidget` concept -- a widget that appears above the feed.

The `AddWidgetModal` (`packages/ui/src/design-system/components/spaces/AddWidgetModal.tsx`) and `AddTabModal` already exist. Extend them with a "Pin to top" toggle.

What breaks: If leaders pin too much, the space becomes cluttered. 10 pinned messages per board times 5 boards = 50 pinned items. Information overload. Also, pinned content goes stale -- a pinned "Welcome to our Fall Rush!" message in February looks abandoned.

### Option C: Configurable Sidebar Sections

Let leaders reorder and hide sidebar sections (boards, tools, members). Add custom link sections. The sidebar component (`apps/web/src/app/s/[handle]/components/space-sidebar.tsx`) currently renders boards-list, tools-list, and members-preview in a fixed order. Make order configurable via a `sidebarConfig` array on the space document.

The `POST /api/spaces/[spaceId]/structure` route and the sidebar route already handle structural changes.

What breaks: If a leader hides the members section, new members can't see who else is there -- destroying social proof. If they hide boards, navigation breaks. You need guardrails: some sections must always be visible. The DX complexity of drag-to-reorder sidebar sections is high for a student who just wants to run their club.

---

## 5. Space Types & Templates

### Current State

Five canonical space types in `packages/core/src/domain/spaces/constants/space-categories.ts`: `student_organizations`, `university_organizations`, `greek_life`, `campus_living`, `hive_exclusive`.

The `SpaceType` enum on the aggregate uses a different vocabulary: `uni`, `student`, `greek`, `residential` (line 60 of `enhanced-space.ts`). The `LEGACY_CATEGORY_MAP` in `space-categories.ts` (line 168) maps between them.

Each type gets different system tools from `system-tool-registry.ts`: `student` gets events + poll + links, `greek` gets events + points tracker + poll, `residential` gets floor poll + events + meet your neighbors.

Governance models exist but are passive: `flat`, `emergent`, `hybrid`, `hierarchical` (line 68 of `enhanced-space.ts`). Default mapping: `uni` and `greek` get `hierarchical`, `student` gets `hybrid`, `residential` gets `flat`. These don't currently affect behavior -- they're metadata only.

Nine templates in the template library with difficulty ratings (starter/standard/advanced) and estimated setup times (1-10 minutes).

### Option A: Type-Driven Feature Gates

Make `SpaceType` actually unlock different features. Greek spaces get rush mode (the `RushMode` interface at line 231 exists but is unused), attendance tracking (points tracker system tool), and secret ballot polls. Study group spaces get shared document editing and study session scheduling. Dorm spaces get marketplace features (the Dorm template already has a Marketplace tab defined at line 386).

Wire governance to actual permission checks: `flat` governance removes the concept of moderators (everyone can moderate), `hierarchical` restricts posting announcements to admins only.

What breaks: Feature gates create "why can't I do this?" frustration. A study group that evolves into a club can't access club features without changing type (which isn't currently supported -- there's no "change space type" API). The rush mode infrastructure is a stub. Building out type-specific features is months of work per type.

### Option B: Archetype Templates with Progressive Disclosure

Keep types as metadata but make templates the primary differentiator. Add 5 new templates: "Project Team" (kanban-style boards, deadline widgets), "Intramural Team" (schedule, roster, stats), "Academic Department" (office hours, course listings), "Cultural Organization" (heritage calendar, multilingual support), "Event Committee" (planning boards, vendor lists, budget tracker).

Deploy templates progressively: start with Minimal, suggest upgrades as the space grows. "You have 20 members now -- would you like to add an Events tab?"

What breaks: 14+ templates becomes overwhelming. The template picker in the creation modal (currently 4 options) would need search or categories. Progressive template suggestions require activity tracking that the current `activityEvents` system doesn't granularly support. Also, the `autoDeployTemplate()` function already runs on creation -- re-deploying a template on a live space could overwrite leader customizations.

### Option C: User-Created Space Types (HIVE Exclusive)

Let `hive_exclusive` spaces define their own type label. Instead of picking from 5 categories, let the creator type a custom type: "Study Pod," "Capstone Team," "Pickup Basketball." Store it as a `customType` string. Use the custom type for discovery: other students searching "basketball" find it.

This extends the `SPACE_TYPE.HIVE_EXCLUSIVE` value. Keep the system types for seeded spaces. Custom types only apply to user-created ones.

What breaks: Free-text types create chaos: "pickup basketball," "Basketball Pickup," "bball" are three versions of the same thing. No standardization means the discovery search is keyword-dependent. The browse-v2 category filter won't work for custom types. You'd need to keep category as a top-level filter and custom type as a secondary descriptor.

---

## 6. Cross-Space Interactions

### Current State

Spaces are fully isolated. No cross-space references exist in the data model. Events, posts, and members are scoped to a single space. The `campusId` filter enforces campus isolation, not space isolation.

The closest thing to cross-space is the browse/discovery layer -- spaces appear together in search results. The "mutual friends" enrichment on browse-v2 indirectly connects spaces (same friends appear in multiple space cards).

### Option A: Co-Hosted Events

Add a `coHostSpaceIds: string[]` field to events. Events created in one space can be surfaced in partner spaces' event lists. RSVP data is shared. The event creator picks co-host spaces from their memberships.

The events API (`POST /api/spaces/[spaceId]/events`) creates events in a flat `events` collection with `spaceId`. Add `coHostSpaceIds` and modify the events query to include `where('coHostSpaceIds', 'array-contains', spaceId)`.

What breaks: Firestore `array-contains` + `where` compound queries have limitations. Event moderation gets complicated: if Space A hides an event, does it disappear from Space B? Who controls the event -- the creator or the co-host leaders? Notification routing (which space's members get notified?) is ambiguous.

### Option B: Space Alliances (Federated Groups)

Create an `alliance` collection. Spaces can form named alliances (e.g., "STEM Council" linking CS Club, Math Club, Engineering Club). Alliance members see a shared feed of cross-posted announcements.

This requires a new aggregate, a new API surface, and UI for alliance management. It's the most architecturally invasive option.

What breaks: Alliances create governance complexity. Who leads the alliance? What if Space A posts something Space B's members find offensive? Moderation across space boundaries is unsolved. The DDD architecture doesn't have an Alliance aggregate, and bolting one on top of the existing Space aggregate would be a significant refactor. The `campusId` isolation still applies, so alliances are campus-internal only.

### Option C: Shared Tools Across Spaces

Let a tool deployed in one space be "linked" in another. The `PlacedTool` entity (`packages/core/src/domain/spaces/entities/placed-tool.ts`) already has `toolId`, `placement`, and `visibility`. Add a `linkedFromSpaceId` field. The tool's data lives in the source space, but it renders in both.

Example: A campus-wide calendar tool deployed in the Student Government space can be linked into every club space, showing all campus events.

What breaks: Permission model collapses. If a tool in Space A requires `members` visibility, who counts as a member when it's rendered in Space B? Data writes become cross-space, violating the current space-scoped Firestore security rules. Performance: every tool render would need to check the source space's permissions.

---

## 7. Space Analytics for Leaders

### Current State

The analytics API (`GET /api/spaces/[spaceId]/analytics`) returns: member growth (total, new in period, growth timeline, role distribution), post activity (total, likes, comments, activity timeline, type distribution, average engagement), events (total, RSVPs, upcoming, activity timeline), and engagement (total actions, unique active users, action breakdown, engagement rate, peak activity times, hourly/daily breakdown). Health score (0-100) and text insights ("No new members this period. Consider promoting your space.").

The `AnalyticsPanel` component (`apps/web/src/app/s/[handle]/components/analytics-panel.tsx`) renders as a full-screen modal overlay with period selector (7d/30d/90d), metric cards, peak activity chart, top contributors list, and top content list.

The `SetupProgress` interface on `EnhancedSpaceProps` (line 206) tracks leader onboarding: `welcomeMessagePosted`, `firstToolDeployed`, `coLeaderInvited`, `minimumMembersTarget`, `isComplete`.

### Option A: Embedded Analytics Tab (Not a Modal)

Move analytics from a modal overlay to a dedicated `/s/[handle]/analytics` page (the route file `apps/web/src/app/s/[handle]/analytics/page.tsx` already exists). Show key metrics inline in the sidebar for leaders. Add sparkline charts next to member count and post count.

Surface the `SetupProgress` as a checklist directly in the space sidebar, not hidden in a modal.

What breaks: Analytics visible in the sidebar means non-leaders see metrics they can't access (the API returns 403 for non-leaders). The sidebar is already dense. Adding sparklines requires a charting library (Recharts, Chart.js) that increases bundle size. The dedicated analytics page route exists but may not be wired up -- need to verify routing.

### Option B: Comparative Analytics ("How Are You Doing?")

Show leaders how their space compares to similar spaces on campus. "Your engagement rate (34%) is higher than 78% of student organizations." This requires aggregating metrics across spaces -- a new API that runs analytics across all spaces of the same type.

The data exists: every space has `memberCount`, `postCount`, `trendingScore` on the aggregate. Build a `GET /api/spaces/benchmarks?category=student_organizations` endpoint that returns percentile rankings.

What breaks: Comparison creates competition. Leaders of small niche spaces (3-member Chess Club) will feel demoralized seeing they're in the bottom 10%. The benchmark calculation is expensive -- it requires reading metrics from all spaces in a category. Caching helps but adds staleness. Also, benchmarks need enough spaces per category to be meaningful -- `campus_living` might only have 10 spaces.

### Option C: Actionable Nudges with One-Click Actions

The `generateInsights()` function already produces text recommendations. Make them actionable: each insight comes with a pre-configured action button.

- "No upcoming events" -> "Create an Event" (opens `EventCreateModal`)
- "Low engagement" -> "Start a Poll" (creates inline poll in general board)
- "No new members" -> "Share Invite Link" (generates invite via existing API)

Map each insight to an existing API action. The automation system's `create_component` action type already supports `poll`, `countdown`, `rsvp`, `announcement`.

What breaks: Insights are text-matched heuristics. "Low post engagement" could mean many things -- a poll might not be the right fix. One-click actions without context lead to thoughtless content: leaders spam polls because the button is easy. The insight-to-action mapping is static and can't account for space-specific context.

---

## 8. Space Moderation

### Current State

Full moderation API at `GET/POST/PUT /api/spaces/[spaceId]/moderation` in `apps/web/src/app/api/spaces/[spaceId]/moderation/route.ts`. Supports: flag, unflag, hide, unhide, remove, restore, approve. Bulk moderation (PUT) for up to 50 items. Moderation queue with filter by content type (post/comment/event) and status (flagged/hidden/all). Moderation log stored in `spaces/[spaceId]/moderationLog` subcollection.

Role-based access: owner, admin, moderator can moderate. Security scanner (`SecurityScanner.scanInput`) checks for XSS in moderation reasons. The `ModerationPanel` component exists at `apps/web/src/app/s/[handle]/components/moderation-panel.tsx`.

Content moderation uses `@/lib/content-moderation` with helpers: `isContentHidden()`, `isContentFlagged()`, `getModerationStatus()`, `buildModerationUpdate()`.

### Option A: Auto-Moderation with Keyword Filters

Let leaders define a word blocklist per space. Messages containing blocked words are auto-hidden and added to the moderation queue. Use the existing automation system: create a `keyword` trigger (already defined in the automation schema, line 56 of `automations/route.ts`) with a `hide` action.

Store the blocklist in `spaces/[spaceId]/settings/moderation` in Firestore. Check messages against it in the chat message creation flow (`POST /api/spaces/[spaceId]/chat`).

What breaks: Keyword filters are easily circumvented (l33tspeak, spacing, zero-width characters). False positives silence legitimate messages ("this class is killer" triggers "kill"). Maintaining a blocklist is work leaders won't do. The automation keyword trigger currently only supports `exact` and `contains` matching (line 62 of automations schema) -- no regex, no fuzzy matching.

### Option B: Community Reporting with Escalation Tiers

Add a "Report" button on every message/post. Reports from N distinct members auto-hide content and flag it for leader review. If leaders don't act within 48 hours, escalate to campus admins (the admin app at `apps/admin`).

Extend the existing `flagCount` field on content documents. The moderation API already reads `flagCount` and `flaggedAt`. Add a `reporters: string[]` array to track who reported.

What breaks: Report abuse -- students weaponize reports against people they don't like. Brigading (coordinated reporting) can silence legitimate content. The 48-hour escalation requires a scheduled function (Cloud Function cron) that doesn't exist yet. Campus admin escalation crosses the space isolation boundary, which conflicts with the "spaces govern themselves" philosophy.

### Option C: Transparent Moderation Logs

Make the moderation log (already stored in `moderationLog` subcollection) visible to all members, not just moderators. Show "This message was hidden by [moderator] on [date] -- Reason: [reason]." Let members see that moderation is happening and why.

This is purely a UI change -- the data exists. Add a "Moderation Activity" section to the space feed or a new tab.

What breaks: Transparency can embarrass both the moderator and the moderated member. Public moderation reasons create social pressure on moderators to not act ("everyone will see if I hide this"). It can also reveal moderator identity, which some moderators prefer to keep private. In a campus context, students know each other -- public moderation creates interpersonal tension.

---

## Cross-Cutting Priorities

Ranked by impact-to-effort ratio, grounded in what the codebase can support today:

1. **Fix the template-to-category mapping bug in SpaceCreationModal.tsx.** The modal sends `category: 'student_org'` for every template. This is a 10-line fix that unlocks correct system tool deployment, proper governance defaults, and accurate discovery filtering. Every downstream feature depends on spaces being correctly typed.

2. **Wire the 9 domain templates into the creation modal.** The templates exist in `packages/core/src/domain/spaces/templates/index.ts` with full tab/widget/settings configs. The creation modal hardcodes 4. Connecting them is a UI-only change with massive functional impact.

3. **Surface SetupProgress in the space UI.** The `SetupProgress` interface exists on the aggregate. Track it. Show it. The leader onboarding modal (`SpaceLeaderOnboardingModal`) already has the UX -- just connect it to persisted state.

4. **Make analytics actionable.** The insights engine exists and produces good text. Add action buttons. Each maps to an existing API endpoint. No new backend work.

5. **Build the QR code invite flow.** The invite system is fully built. Add QR generation. Physical-to-digital bridge for campus events.

---

## File Reference

| Area | Key Files |
|------|-----------|
| Space aggregate | `packages/core/src/domain/spaces/aggregates/enhanced-space.ts` |
| Templates library | `packages/core/src/domain/spaces/templates/index.ts` |
| System tools | `packages/core/src/domain/spaces/system-tool-registry.ts` |
| Space types/categories | `packages/core/src/domain/spaces/constants/space-categories.ts` |
| Capabilities | `packages/core/src/domain/spaces/space-capabilities.ts` |
| Board entity | `packages/core/src/domain/spaces/entities/board.ts` |
| Tab entity | `packages/core/src/domain/spaces/entities/tab.ts` |
| Widget entity | `packages/core/src/domain/spaces/entities/widget.ts` |
| Creation modal | `apps/web/src/components/spaces/SpaceCreationModal.tsx` |
| Creation API | `apps/web/src/app/api/spaces/route.ts` |
| Join API v2 | `apps/web/src/app/api/spaces/join-v2/route.ts` |
| Browse API v2 | `apps/web/src/app/api/spaces/browse-v2/route.ts` |
| Recommendations API | `apps/web/src/app/api/spaces/recommended/route.ts` |
| Analytics API | `apps/web/src/app/api/spaces/[spaceId]/analytics/route.ts` |
| Moderation API | `apps/web/src/app/api/spaces/[spaceId]/moderation/route.ts` |
| Automations API | `apps/web/src/app/api/spaces/[spaceId]/automations/route.ts` |
| Invite API | `apps/web/src/app/api/spaces/[spaceId]/invite/route.ts` |
| Preview API | `apps/web/src/app/api/spaces/[spaceId]/preview/route.ts` |
| Threshold view | `apps/web/src/app/s/[handle]/components/threshold/threshold-view.tsx` |
| Space layout | `apps/web/src/app/s/[handle]/components/space-layout.tsx` |
| Analytics panel | `apps/web/src/app/s/[handle]/components/analytics-panel.tsx` |
| Leader onboarding | `packages/ui/src/design-system/components/spaces/SpaceLeaderOnboardingModal.tsx` |
| Space preview modal | `apps/web/src/components/spaces/space-preview-modal.tsx` |
