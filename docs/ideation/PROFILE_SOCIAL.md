# Profile + Social Graph + DMs: Ideation Document

**Date:** 2026-02-07
**Status:** Ideation
**Codebase version:** main @ 3155b15

---

## Current System Inventory

Before options: what actually exists today.

**Profile aggregate** (`packages/core/src/domain/profile/aggregates/enhanced-profile.ts`):
- PersonalInfo (name, bio, major, gradYear, dorm, phone, photos)
- AcademicInfo (major, minor, gradYear, GPA, courses, standing)
- SocialInfo (interests, clubs, sports, greek, social links)
- ProfilePrivacy value object with 4 levels: public, campus_only, connections_only, private
- Per-field visibility: showEmail, showPhone, showDorm, showSchedule, showActivity
- Interest similarity calculation between profiles (0-100 score)
- Academic standing derivation from graduation year (Freshman through Alumni)
- 10-interest cap with InterestCollection validation

**Connection aggregate** (`packages/core/src/domain/profile/aggregates/connection.ts`):
- Types: FRIEND, FOLLOWER, FOLLOWING, BLOCKED, PENDING
- Sources: SEARCH, SUGGESTION, MUTUAL, SPACE, EVENT, QR_CODE
- Deterministic IDs from sorted profile pairs (`conn_{id1}_{id2}`)
- Mutual space tracking, interaction counting
- Full accept/reject/block/unblock lifecycle

**Connection strength** (`packages/core/src/domain/profile/value-objects/connection-strength.value.ts`):
- 0-100 score with 5 tiers: acquaintance, familiar, friend, close_friend, best_friend
- Weighted calculation: interactions 25%, shared spaces 20%, messages 20%, interests 15%, age 10%, recency 5%, mutuals 5%
- Server-side calculation in `/api/profile/[userId]/connection-strength/route.ts` that queries Firestore for all factors

**Ghost Mode** (`packages/core/src/domain/profile/services/ghost-mode.service.ts`):
- 4 levels: invisible, minimal, selective, normal
- 6 hide flags: directory, activity, space memberships, last seen, online status, search
- Viewer-context-aware filtering (always visible to self + admins)
- Level-based rules: invisible = hidden from everyone, minimal = visible to space-mates, selective = visible to 2+ shared spaces

**DM infrastructure** (`apps/web/src/contexts/dm-context.tsx` + `/api/dm/` routes):
- Full CRUD: list conversations, create/get conversation, list/send messages
- SSE streaming via Firestore onSnapshot for real-time delivery
- Deterministic conversation IDs (`dm_{sorted_ids}`)
- Read state tracking with per-user unread counts
- Feature-flagged OFF via `ENABLE_DMS` in `use-feature-flags.ts`
- DMProvider with panel open/close, optimistic message sending, SSE auto-reconnect

**UI components** (`packages/ui/src/design-system/components/profile/`):
- 3-zone layout: Identity Hero, Belonging (spaces/events), Activity (tools/stats)
- ProfileIdentityHero: 80px square avatar, name, handle, credentials, bio, badges, Connect + Message buttons
- ConnectButton: 4-state machine (none, pending_outgoing, pending_incoming, friends)
- ProfileSharedBanner: "You're both in Design Club and 2 others"
- ProfileConnectionsCard: avatar stack of mutuals + counts
- PeopleYouMayKnow: horizontal scroll of suggestion cards with reason text
- ProfileStatsWidget: bento grid showing spaces, tools, activity, streak
- ProfileBelongingSpaceCard: space membership with role badges and "You're both here"
- ProfileLeadershipCard: gold-accented leader spaces
- ProfileActivityCard: tool with run counts, gold bottom border at 100+ runs
- ProfileToolsCard: grid of built tools with performance indicators

**Feature flags** (`apps/web/src/hooks/use-feature-flags.ts`):
- `enable_dms`: OFF
- `enable_connections`: ON
- `ghost_mode`: available
- `calendar_sync`: available

---

## 1. Profile as Identity

What should a student's profile communicate at a glance?

### Option A: Belonging-First (current trajectory)

Profiles answer "Where do they belong?" before "Who are they?"

The 3-zone layout already leans this way: Identity Hero up top, then Belonging (spaces, events, leadership), then Activity (tools, stats). The `ProfileBelongingSpaceCard` and `ProfileLeadershipCard` dominate the visual hierarchy.

**Strengthen by:** Making the belonging zone the default expanded section. The identity hero stays compact -- name, handle, credentials, bio (3 lines max). The bulk of the profile is spaces with role badges, events they're organizing, and leadership positions.

**What breaks:** New users with zero spaces have an empty profile. Students who are lurkers (join spaces but don't lead) look uninteresting. The "builder identity" (tools created, tools deployed) gets buried below the fold.

**Implementation touch points:**
- `ProfileIdentityHero` stays as-is but bio is de-emphasized (already line-clamped to 3)
- `ProfileBelongingSpaceCard` becomes primary real estate
- Empty state in `ProfileConnectionsCard` already says "Building your network" -- same pattern for zero-space profiles, but with a CTA to browse spaces

### Option B: Action-First

Profiles answer "What have they done?" before "Where do they hang out?"

Flip the layout: Identity Hero, then Activity (tools built, events organized, posts created), then Belonging. The `ProfileActivityCard` with run counts and the `ProfileToolsCard` grid become the profile's centerpiece. A student who built a poll tool with 500 runs tells you more than their space list.

**What breaks:** Most students won't build tools. HiveLab is for a subset. The majority of users would have empty Activity zones. You'd need to expand "activity" to include non-builder actions (RSVP'd events, chat participation, board posts) to make this work broadly, which means new tracking infrastructure.

**Implementation touch points:**
- Reorder zones in the profile page (`apps/web/src/app/profile/page.tsx` and `[id]/page.tsx`)
- `ProfileStatsWidget` (spaces, tools, activity, streak) moves to zone 2
- Need new activity types beyond tools -- the `MotionEntrySchema` in `packages/validation/src/profile.schema.ts` already defines liked_post, replied_to_post, created_tool, joined_space, rsvp_event, but these aren't surfaced on profile yet

### Option C: Context-Adaptive (recommended)

The profile shows different things depending on who's viewing.

When a space-mate views your profile: shared spaces and mutual connections are promoted (the `ProfileSharedBanner` already does this). When a stranger from the same campus views: your leadership roles and popular tools surface. When you view your own profile: completion nudges, activity stats, and a "how others see you" preview.

**What breaks:** More rendering logic, more API work. The `ProfileContextProvider` at `apps/web/src/components/profile/ProfileContextProvider.tsx` would need to carry viewer relationship data and conditionally render zones. Ghost Mode's viewer-context system (`GhostModeService.applyVisibilityRules`) already does relationship-based visibility, so the pattern exists.

**Implementation touch points:**
- Extend `ProfileContextProvider` to include connection type (friend, space-mate, stranger, self)
- The connection-strength API (`/api/profile/[userId]/connection-strength`) already computes the relationship tier -- use that to determine layout
- `ProfileSharedBanner` renders conditionally today -- extend this pattern to zone ordering

---

## 2. The Social Graph

### Option A: Mutual Friends Model (Facebook-style)

Connections are always mutual. You send a request, they accept, you're "connected." No asymmetry.

This is essentially what the `Connection` aggregate does when `type === FRIEND` and `acceptedBy` is set. The `ConnectButton` already implements the full state machine: none -> pending_outgoing -> (they accept) -> friends.

**What breaks:** No way to passively follow someone interesting (a campus organizer, a prolific tool builder) without them needing to accept. Forces reciprocity, which adds friction. The follower/following types in `ConnectionType` go unused.

**Implementation touch points:**
- Already mostly built. The `ConnectButton` handles all 4 states.
- `PeopleYouMayKnow` with `UserSuggestion.context` (sharedSpaces, mutualConnections, sameMajor) drives discovery.
- Connection strength tiers (acquaintance -> best_friend) add depth to mutual relationships.

### Option B: Asymmetric Follow Model (Instagram-style)

Anyone can follow anyone. No approval needed. Followers see your activity in their feed.

**What breaks:** Creates a popularity dynamic. Students with lots of followers become "campus influencers" -- the exact vanity project HIVE is trying to avoid. Also creates a privacy gap: someone you don't know is following your activity unless you block them. Ghost Mode partially mitigates this (hideActivity, hideFromDirectory).

**Implementation touch points:**
- The `ConnectionType.FOLLOWER` and `ConnectionType.FOLLOWING` already exist in the aggregate
- The connections API (`/api/connections/route.ts`) already filters by type: friends, following, followers
- Would need to change the `ConnectButton` to show "Follow" instead of "Connect" and remove the acceptance step

### Option C: Space-Mates Model (recommended for campus)

Connections are implicit, not explicit. When you share a space with someone, you're automatically "connected" at the acquaintance level. The more spaces you share, the stronger the connection. Friend requests upgrade acquaintances to friends.

This leverages what already exists: `ConnectionSource.SPACE` for auto-detected connections, `connection-strength` calculation that weights shared spaces at 20%, and `PeopleYouMayKnow` suggestions based on shared spaces.

**What breaks:** Students who join many spaces get overwhelmed with implicit connections. Need a threshold (2+ shared spaces?) before someone appears as a "connection." Also, leaving a space would affect your social graph, which feels weird.

**Implementation touch points:**
- The connections API's `POST` handler at `/api/connections/route.ts` already has `detectConnections` logic that auto-discovers connections from shared affiliations
- `useConnections` hook calls `detectConnections` on first load when connections list is empty
- Connection strength calculation at `/api/profile/[userId]/connection-strength/route.ts` already queries `spaceMembers` for shared spaces
- `ProfileSharedBanner` shows "You're both in X and Y" -- this becomes the primary relationship indicator
- Threshold logic: `GhostModeService.applyVisibilityRules` already uses "2+ shared spaces" for the `selective` level -- repurpose this pattern

### Recommended Hybrid

Use Space-Mates as the base layer (implicit, no friction), with explicit Friend Requests as an upgrade. Display connection tiers from `ConnectionStrength` (acquaintance through best_friend) instead of a binary "friends or not." This maps naturally to campus reality: you know people from shared classes and clubs, and some of them become actual friends.

---

## 3. DMs That Drive Action

The infrastructure is complete. The question is what DMs enable when the flag flips.

### Option A: Minimal 1:1 Messaging

Turn on the flag. Surface the DM panel. Let people message each other. Done.

The `DMProvider` context already handles panel state, conversation lists, message sending, and SSE streaming. The `ProfileIdentityHero` already renders a "Message" button controlled by `showMessageButton`. Connect the button to `useDM().openConversation(userId)`.

**What breaks:** Nothing -- this is the safe launch. But DMs become a generic chat feature disconnected from HIVE's identity. Students already have iMessage, GroupMe, Discord. Why would they use HIVE DMs?

**Implementation touch points:**
- Flip `ENABLE_DMS` flag to ON
- Build the `DMPanel` component (slide-out panel with conversation list + active conversation view)
- Wire `ProfileIdentityHero`'s Message button to `openConversation(user.id)` via `useDM()`
- Add DM icon to AppShell nav with unread badge from `useDM().totalUnread`

### Option B: Context-Triggered Messaging

DMs always carry context. "Message about Poll Results" from a tool. "Message about Design Club" from a shared space. "Message about Friday's Event" from an event page. The conversation thread shows the context banner at the top.

**What breaks:** More complex message creation. Every entry point needs to pass context metadata. The `DMMessage` type in `dm-context.tsx` currently only supports `type: 'text'` -- would need a `context` field. More API surface area.

**Implementation touch points:**
- Extend `DMMessage` interface to include `context?: { type: 'space' | 'tool' | 'event'; id: string; name: string; }`
- Extend `openConversation` in `DMProvider` to accept optional context
- The POST `/api/dm/conversations/[conversationId]/messages` would store context alongside messages
- Build `ContextBanner` (already exists in profile components) variant for DM thread headers

### Option C: Space-Scoped Group DMs (recommended)

DMs are not just 1:1. They're also small-group conversations between space members. "Message the study group from CS 101 Space." This bridges the gap between space chat (public, everyone sees it) and DMs (private, 1:1).

**What breaks:** The current DM infrastructure assumes exactly 2 participants. `getDMConversationId` generates deterministic IDs from sorted pairs. Group DMs need different ID generation, participant management, and the `DMConversation.participants` record needs to scale beyond 2. The SSE stream architecture works but needs per-participant read state tracking for N participants (already partially there -- `readState` is keyed by userId).

**Implementation touch points:**
- New conversation type: `dm_group_{sorted_participant_ids_hash}` or UUID-based
- Extend `DMConversation` to include `type: '1:1' | 'group'` and `name?: string`
- The existing `participantIds` array in Firestore already supports N participants
- Group creation API: new endpoint or extend POST `/api/dm/conversations` with `recipientIds: string[]`
- Space integration: "Create group DM" button on space member list, pre-populated with selected members

### Phased Recommendation

Phase 1: Minimal 1:1 (Option A). Ship it. Get real usage data.
Phase 2: Context-triggered messaging (Option B). Once DM adoption is measurable.
Phase 3: Group DMs (Option C). Once 1:1 volume proves students want private conversation within HIVE.

---

## 4. Profile Customization

The bento grid exists. What tiles matter?

### Option A: Curated Tile Library

Ship a fixed set of tiles that all serve a purpose. No decorative widgets.

**Tile set:**
1. **Spaces** (exists: `ProfileBelongingSpaceCard`) -- where they belong
2. **Tools Built** (exists: `ProfileToolsCard`) -- what they've created
3. **Stats** (exists: `ProfileStatsWidget`) -- spaces, tools, activity, streak
4. **Leadership** (exists: `ProfileLeadershipCard`) -- where they lead
5. **Events** (exists: `ProfileEventCard`) -- upcoming events they're attending/organizing
6. **Connections** (exists: `ProfileConnectionsCard`) -- mutual connection avatar stack
7. **Activity Heatmap** (exists: `ProfileActivityHeatmap`) -- GitHub-style contribution grid
8. **Interests** (exists: `ProfileInterestsCard`) -- tag cloud of interests
9. **Featured Tool** (exists: `ProfileFeaturedToolCard`) -- pinned best tool with full stats
10. **Availability** (new) -- schedule availability tile showing "Free after 3pm" or "In class until 2"

**What breaks:** Limited self-expression. Students can't make their profile feel "theirs." But every tile is functional -- there's nothing decorative to maintain.

**Implementation touch points:**
- All 9 existing tiles are already built in `packages/ui/src/design-system/components/profile/`
- Bento grid layout already exists via `ProfileCard` (`ProfileBentoCard`)
- New: tile reordering + visibility toggles stored in user preferences (Firestore `users/{userId}/profileLayout`)
- Availability tile needs calendar integration (the `calendar_sync` feature flag and `/api/profile/calendar/` routes exist)

### Option B: Expressive Customization

Beyond tiles: custom cover photos, profile themes (dark gold, midnight blue, etc.), pinned status messages, music/Spotify widget, "currently working on" project pin.

**What breaks:** Maintenance burden. Every new widget type needs a component, an API, and a data model. Music widgets need Spotify OAuth. Theme customization means variant tokens in `@hive/tokens`. Status messages need presence infrastructure. You're building BeReal/Linktree features instead of shipping core campus functionality.

**Implementation touch points:**
- Cover photos: `PersonalInfo.coverPhoto` already exists in the domain model but isn't surfaced
- Status messages: `UserData.statusMessage` exists in the completion config but has no UI
- Theme customization: would require extending `packages/tokens/src/` with theme variants per user
- Spotify widget: new OAuth integration, new API route, new component -- significant scope

### Option C: Functional Customization Only (recommended)

Students can reorder tiles and toggle visibility, but every available tile serves a purpose. The profile is a dashboard, not a social media page.

Add 3 new tiles to the existing 9:
1. **Availability** -- pulls from calendar sync to show current/next free block
2. **Pinned Space** -- one space they want to represent them (like "CS 101 Study Group")
3. **Current Status** -- one-line text status ("Working on final project", "Looking for project partners")

These three fill gaps: availability answers "can I reach them now?", pinned space answers "what matters most to them?", and status answers "what are they up to?"

**Implementation touch points:**
- Tile ordering: new Firestore field `users/{userId}.profileLayout: string[]` (ordered tile IDs)
- Tile visibility: `users/{userId}.hiddenTiles: string[]`
- Availability tile: uses existing `/api/profile/calendar/events` route
- Pinned space: new field `users/{userId}.pinnedSpaceId: string`
- Current status: `UserData.statusMessage` exists -- just needs a settings UI and a profile tile component

---

## 5. Privacy & Safety

### Current State

Ghost Mode with 4 levels (invisible, minimal, selective, normal) and 6 granular hide flags. Privacy levels (public, campus_only, connections_only, private) on the profile aggregate. Per-field visibility (email, phone, dorm, schedule, activity). Block support in the Connection aggregate. Feature-flagged ghost mode.

### Option A: Enhanced Block System

Extend the existing `ConnectionType.BLOCKED` with real consequences. Blocked users cannot: view your profile, send you DMs, see you in member lists, see your tool deployments.

**What breaks:** Need to check block status on every profile view, every DM send, every member list render. Performance cost on hot paths. The `Connection.block()` method exists but the enforcement layer (checking blocks before rendering) isn't wired through every API route.

**Implementation touch points:**
- Block check middleware: new utility in `apps/web/src/lib/middleware/` that checks `connections` collection for blocks before serving profile data
- The `/api/profile/[userId]/route.ts` needs a block check before returning profile data
- DM conversation creation at `/api/dm/conversations` POST needs to reject when either user has blocked the other
- `PeopleYouMayKnow` suggestions need to filter out blocked users (and users who blocked you)

### Option B: Restricted Messaging Tiers

DMs are gated by connection level. Strangers can't message you. Space-mates can send one intro message. Friends can message freely. Leaders in spaces you're in can always message you (for announcements, event coordination).

**What breaks:** Friction on legitimate first-contact. A student who wants to reach out about a shared interest but isn't in any shared spaces is blocked. The "intro message" concept needs a separate queue/approval flow.

**Implementation touch points:**
- Extend `DMProvider.openConversation` to check connection type before creating conversation
- New API check in POST `/api/dm/conversations`: query connection strength between participants
- Use `ConnectionTier` thresholds: acquaintance = 1 intro message, familiar+ = unlimited
- Leader bypass: query `spaceMembers` for role = admin/owner in shared spaces

### Option C: Layered Privacy with Smart Defaults (recommended)

Keep Ghost Mode as the power-user tool. Add sensible defaults that don't require configuration:

1. **Default: campus_only** (already the default in `ProfilePrivacy.createDefault()`) -- only students on the same campus see your profile
2. **DM gating: connections + space-mates** -- you can message anyone you share a space with or are connected to. Strangers see a "Connect first" prompt.
3. **Block = total invisibility** -- blocked users see nothing. You don't appear in their search, suggestions, or space member lists.
4. **Anonymous browsing: no** -- HIVE requires real identity (campus email verification). Don't add anonymity. If students need anonymous support, they need a different tool.
5. **Content reporting** -- the "Report Profile" button already exists in `ProfileIdentityHero` (`onReport` prop). Extend to report messages, report space content.

**What breaks:** DM gating adds friction for cold outreach. Students who want to message someone they met at an event (but aren't in a shared space) can't until they connect. Mitigation: the `ConnectionSource.EVENT` already tracks event-based connections -- if two students RSVP'd the same event, treat them as space-mates for messaging.

**Implementation touch points:**
- Block enforcement: new utility function `isBlockedBy(viewerId, targetId)` that checks the connections collection
- DM gating: extend POST `/api/dm/conversations` to verify `sharedSpaces > 0 OR connectionType === 'friend'`
- Event co-attendance as connection source: the `/api/profile/[userId]/events/route.ts` can be used to detect event overlap
- Report flow: new `/api/reports` route with Zod schema, stored in Firestore `reports` collection

---

## 6. Connection Discovery

### Option A: Mutual-Space-First Discovery

The primary discovery vector is shared spaces. "People in your spaces" dominates the suggestion feed.

The `PeopleYouMayKnow` component already uses `UserSuggestion.context.sharedSpaces` as the primary signal. The `/api/profile/spaces/recommendations` route generates friend-activity-based space recommendations by finding other members of the user's spaces.

**What breaks:** Echo chamber. Students only discover people in their existing circles. Doesn't help a freshman with one space meet people outside that bubble.

**Implementation touch points:**
- Already built via `PeopleYouMayKnow` and the space recommendations API
- Strengthen: weight suggestions by space activity (someone active in your shared space > someone who joined and went silent)
- Add "People also in [Space Name]" sections on space member lists

### Option B: Interest-Graph Discovery

Surface people who share interests, regardless of shared spaces. "Students who also like Machine Learning, Rock Climbing, and Film."

The `InterestCollection.similarityWith()` method in the `EnhancedProfile` aggregate already calculates interest overlap (0-100 score). The `InterestCategory` enum categorizes interests for distribution analysis.

**What breaks:** Interest labels are free-text strings. "ML" vs "Machine Learning" vs "AI/ML" are different strings. Need normalization. The `Interest.normalize()` value object handles basic lowercasing but not semantic deduplication. Also, interest-based discovery without shared-space overlap feels more like a dating app than a campus platform.

**Implementation touch points:**
- New discovery API: `/api/discover/by-interests` that queries users with overlapping interests within the same campus
- Use `EnhancedProfile.getInterestSimilarity(otherProfile)` for scoring
- Normalization: extend `Interest` value object with an alias map (ML -> machine_learning, etc.)
- Surface in `PeopleYouMayKnow` with reason text: "Also interested in Machine Learning"

### Option C: Campus-Signal Discovery (recommended)

Multiple signals, weighted by campus relevance:

1. **Shared spaces** (strongest signal, 40% weight) -- you're in the same communities
2. **Shared interests** (25% weight) -- topical overlap
3. **Same major/year** (15% weight) -- academic cohort
4. **Event co-attendance** (10% weight) -- you were at the same event
5. **Mutual connections** (10% weight) -- your friends know them

The connection strength calculation at `/api/profile/[userId]/connection-strength/route.ts` already uses a similar multi-factor weighted model. Adapt it for discovery.

**What breaks:** More Firestore reads per suggestion calculation. Each factor requires a separate query (space memberships, user interests, user profiles, event RSVPs, connections). Caching helps but adds infrastructure.

**Implementation touch points:**
- New `/api/discover/suggestions` endpoint that combines all signals
- Reuse `calculateConnectionFactors` logic from the connection-strength route
- Cache suggestions in Firestore `users/{userId}/suggestions` with a TTL (recalculate daily)
- The `PeopleYouMayKnow` component already displays `reason` text -- populate with the top matching signal
- `UserSuggestion.context` already has `sharedSpaces`, `mutualConnections`, `sameMajor` -- add `sharedEvents` and `interestSimilarity`

---

## 7. Social Proof on Profiles

### Option A: Earned Badges Only

Badges that reflect real activity, not vanity metrics. The badge system already exists in `ProfileIdentityHero` with `BADGE_CONFIG`:

- `builder`: Built 1+ tools
- `student_leader`: Leads 1+ spaces
- `contributor`: Active contributor
- `early_adopter`: Joined in first semester
- `founding_leader`: Space leader since founding
- `founding_member`: Early space member
- `verified_leader`: Admin-verified leader

**What breaks:** Limited social proof signals. A badge says "they did X" but not "they're active" or "they're trusted." No ongoing engagement signal.

**Implementation touch points:**
- Already built. Badges render in `ProfileIdentityHero` with emoji icons and gold variants.
- New badges to add: `tool_star` (tool with 100+ runs, the `isHighPerformer` threshold already exists), `space_anchor` (member of 5+ spaces), `connector` (10+ connections)
- Badge award logic: Firebase Cloud Function that checks criteria on profile update events

### Option B: Activity-Derived Labels

Instead of badges, show contextual labels. "Most active in Design Club." "Built the most-used poll on campus." "Organized 5 events this semester."

**What breaks:** Competitive dynamics. "Most active" labels create a leaderboard mindset. Students might game activity metrics. Also, labels change over time -- the "most active" person last week might not be this week.

**Implementation touch points:**
- New `/api/profile/[userId]/activity/route.ts` already exists -- extend to compute relative rankings within spaces
- New component: `ProfileActivityLabel` that renders contextual text below the identity hero
- Data: aggregate activity counts from space tools, chat, board posts per user per space

### Option C: Contextual Social Proof (recommended)

Show proof that's relevant to the viewer's relationship with the profile:

- **Stranger viewing:** "Leads 3 spaces" + "Built 2 tools with 500+ total runs" (credibility signals)
- **Space-mate viewing:** "You're both in Design Club and CS 101" (the `ProfileSharedBanner` already does this) + "3 mutual connections" (the `ProfileConnectionsCard` does this)
- **Friend viewing:** Connection tier label ("Close Friend" from `ConnectionStrength.getTierLabel()`) + shared activity stats

**What breaks:** More conditional rendering. The profile page needs to know the viewer's relationship and render different proof signals. But the viewer context pattern already exists in Ghost Mode.

**Implementation touch points:**
- Use connection-strength API response to determine viewer type
- Stranger view: show badge row (already in `ProfileIdentityHero`) + stats widget
- Space-mate view: `ProfileSharedBanner` (exists) + `ProfileConnectionsCard` with mutuals highlighted
- Friend view: connection tier display (new small component using `ConnectionStrength.getTierLabel()` and `getTierEmoji()`)
- The `ConnectButton` already changes state based on relationship -- extend this pattern to the entire profile layout

---

## 8. Presence & Availability

### Option A: Simple Online/Offline

Binary presence indicator. Green dot = online, nothing = offline.

The `ProfileIdentityHero` already renders an online indicator (`isOnline` prop with a gold dot at the avatar corner). Ghost Mode's `hideOnlineStatus` flag controls visibility.

**What breaks:** Binary presence is meaningless on a campus where "online" could mean "in class with phone in pocket" or "actively browsing HIVE." Students on mobile get marked online from background app refresh.

**Implementation touch points:**
- Already partially built. The gold dot renders in `ProfileIdentityHero`.
- Need: presence tracking via Firebase RTDB `presence/{userId}` with heartbeat
- Ghost Mode integration: `GhostModeService.shouldHideOnlineStatus()` already handles the privacy check
- Client-side: update presence on tab focus/blur, with 5-minute idle timeout

### Option B: Rich Status

"In class until 2pm." "Studying at Capen Library." "Free to chat." "Working on CS 101 project."

**What breaks:** Students won't maintain it. Manual status updates decay within a week of launch. Calendar-synced statuses could work but require calendar integration (Google Calendar OAuth or `.ics` import). The `calendar_sync` feature flag exists but the integration isn't built.

**Implementation touch points:**
- `UserData.statusMessage` field already exists in the completion config
- New component: `ProfileStatusBadge` that renders status text below handle
- Manual set: status input in profile edit page (`/profile/edit`)
- Calendar-synced: extend `/api/profile/calendar/events` to derive current status from calendar
- Auto-expire: status messages expire after 24 hours unless manually refreshed

### Option C: Schedule-Aware Availability (recommended)

Don't show "online" -- show "available." Derive availability from calendar data or manual schedule blocks.

Three states:
1. **Available** (green) -- no calendar events, or explicitly marked as available
2. **Busy** (amber) -- in a calendar event (class, meeting)
3. **Away** (gray) -- no recent activity, or after hours

**What breaks:** Requires calendar integration to be useful. Without it, falls back to basic online/offline. The `/api/profile/calendar/events` and `/api/profile/calendar/conflicts` routes exist, suggesting calendar infrastructure is partially there.

**Implementation touch points:**
- Extend the existing `isOnline` prop in `ProfileIdentityHero` to a 3-state: `availability: 'available' | 'busy' | 'away'`
- Calendar integration: query `/api/profile/calendar/events` for current time block
- Manual override: "Set as available" toggle in nav/profile dropdown
- Ghost Mode: `hideOnlineStatus` hides availability too (already wired)
- Display: replace the gold dot with a 3-color indicator (green/amber/gray) with tooltip showing next free slot
- DM integration: when messaging someone who's "busy," show "They may not respond immediately -- in class until 2pm"

---

## Summary of Recommended Path

| Area | Recommendation | Immediate Action |
|------|---------------|-----------------|
| Profile as Identity | Context-Adaptive (C) | Extend ProfileContextProvider with viewer relationship |
| Social Graph | Space-Mates + Explicit Friends hybrid | Ship current friend system; add space-mate auto-connections |
| DMs | Phase 1: Minimal 1:1 | Flip flag, build DMPanel, wire Message button |
| Customization | Functional tiles only (C) | Add availability, pinned space, status tiles |
| Privacy & Safety | Layered defaults (C) | Enforce blocks across all views, gate DMs by connection |
| Discovery | Campus-signal multi-factor (C) | New /api/discover/suggestions with cached results |
| Social Proof | Contextual per-viewer (C) | Conditional rendering based on connection strength |
| Presence | Schedule-aware availability (C) | 3-state indicator, calendar-derived when available |

The throughline: everything adapts to the relationship between viewer and profile. A stranger sees credibility signals. A space-mate sees shared context. A friend sees closeness. This makes profiles feel personal without being a vanity project -- they're a mirror of real campus relationships.
