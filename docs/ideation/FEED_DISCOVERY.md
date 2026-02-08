# Feed, Discovery & Recommendations: Making HIVE Flawless

**Date:** February 2026
**Status:** Ideation / Pre-implementation
**Philosophy:** "Not a feed to scroll. A place to do."

---

## Table of Contents

1. [The Anti-Feed](#1-the-anti-feed)
2. [Discovery Engine](#2-discovery-engine)
3. [Activity Events Architecture](#3-activity-events-architecture)
4. [Real-Time Signals](#4-real-time-signals)
5. [Personalization](#5-personalization)
6. [Search & Browse](#6-search--browse)
7. [Notification-Driven Engagement](#7-notification-driven-engagement)
8. [Social Proof & FOMO](#8-social-proof--fomo)

---

## Current State Audit

Before proposing changes, here is the honest state of the system based on reading every relevant file:

**Home (`/home` in `apps/web/src/app/home/page.tsx`):**
- 6 sections: Greeting, Happening Now, Up Next, Your Spaces, Recent Activity, Suggested
- Activity feed is real but thin: only 4 event types (`new_messages`, `member_joined`, `event_created`, `tool_deployed`) from `apps/web/src/app/api/activity-feed/route.ts`
- Online counts (`onlineCount`) always return 0 -- no presence system implemented
- Unread counts (`unreadCount`) always return 0 -- no read tracking aggregation exists
- New user path exists with join CTA -- this is good

**Explore (`/explore` in `apps/web/src/app/explore/page.tsx`):**
- Single-scroll feed: For You, Popular This Week, People in Major, Upcoming Events
- Client-side interest scoring: keyword matching against `name` (+3), `description` (+2), `category` (+2)
- Search works across spaces, people, events via parallel API calls
- No persistent search history, no trending queries, no filters beyond text input

**Feed Ranking (`packages/core/src/domain/feed/services/feed-ranking.service.ts`):**
- 8-factor algorithm exists but is partially hollow
- Social signals weight set to 0.00 (correct for HIVE's philosophy)
- `loadUserEngagementData()` in `get-personalized-feed.query.ts` returns empty defaults -- no actual engagement tracking is consumed
- Feed route (`apps/web/src/app/api/feed/route.ts`) filters OUT `user_post` content type entirely -- activity stream only

**Recommendations (`apps/web/src/app/api/spaces/recommended/route.ts`):**
- Behavioral psychology scoring: `AnxietyRelief * 0.4 + SocialProof * 0.3 + InsiderAccess * 0.3`
- Social proof score is near-zero in production -- `connections` and `friends` collections have minimal data
- Interest-based POST endpoint exists for onboarding flow

**Notifications (`apps/web/src/components/notifications/hive-notification-bell.tsx`):**
- SSE streaming via `use-notification-stream` hook -- real-time delivery works
- Grouped by space in the bell popover
- Notification creation only happens in Cloud Functions (`infrastructure/firebase/functions/`)
- No notification preferences UI that actually controls frequency

**Activity Tracking (`apps/web/src/app/api/activity/route.ts`):**
- Logs to `activityEvents` collection with daily summaries
- Tracks: `space_visit`, `tool_interaction`, `content_creation`, `social_interaction`, `session_start`, `session_end`
- This data is NOT consumed by the feed ranking algorithm or recommendations

---

## 1. The Anti-Feed

HIVE is not Instagram. The home screen should answer one question: **"What should I do right now?"**

The current `/home` page is close. It has 6 sections that surface information. But the information is passive -- it shows state, not action. Every card should have a verb attached to it.

### Option A: Action Queue (Recommended)

Replace the current section-based layout with a single prioritized queue of action cards. Each card type has exactly one primary CTA.

**Card types and their verbs:**

| Card | Verb | Source |
|------|------|--------|
| Event starting soon | RSVP / Join | `events` collection, filtered by `startDate` within 24h |
| Unread messages in board | Open | `spaces/{id}/boards/{id}/read_receipts` delta |
| New member in your space | Say hi | `spaceMembers` recent joins |
| Poll open in your space | Vote | `deployedTools` where tool type is poll |
| Tool result ready | View | `deployedTools/{id}/events` |
| Space you might like | Join | Recommendation engine output |
| Event your friends are going to | RSVP | `rsvps` cross-referenced with connections |
| Someone in your major joined HIVE | Connect | `users` recent signups filtered by major |

**Implementation:** The `/api/activity-feed/route.ts` already gathers 4 activity types across user spaces. Extend it to produce `ActionCard[]` instead of `ActivityItem[]`. Each card includes a `primaryAction: { label: string; href: string; method?: string; body?: object }` so the client can render a button that does real work.

**What breaks:** The current 6-section layout disappears. Users lose the spatial consistency of "Your Spaces is always in the same spot." Orientation becomes temporal instead of categorical. For users who check HIVE 10+ times a day, the queue will often be empty or repetitive. Need a clear "all caught up" state that feels rewarding, not dead.

**Key files to modify:**
- `apps/web/src/app/home/page.tsx` -- replace section components with ActionQueue
- `apps/web/src/app/api/activity-feed/route.ts` -- extend activity types, add action metadata
- New: `apps/web/src/app/api/home/actions/route.ts` -- dedicated action queue endpoint

### Option B: Section-Based with Inline Actions

Keep the current 6-section layout but make every item actionable. Add inline buttons to space cards (open, mute), event cards (RSVP), activity items (go to space, reply). The "Recent Activity" section becomes "Things That Need You."

**What breaks:** Less opinionated. Students still scroll past sections they don't care about. The "Your Spaces" grid becomes a 2x2 wall of identical cards with no urgency signal. Does not force prioritization. But it ships faster and feels familiar.

**Key files to modify:**
- `apps/web/src/app/home/page.tsx` -- add CTAs to existing components
- Activity feed items get `actionUrl` and `actionLabel` fields

### Option C: Daily Briefing Model

Show a time-aware summary: "Today you have 1 event at 3pm, 3 unread threads, and 2 spaces with activity." Below it, the action cards. Above it, nothing. No greeting fluff.

**What breaks:** Only works if data is good. If events, unreads, and activity are all zero (which is the current state for most users), the briefing is literally "You have nothing." That is the dead end HIVE's constraints explicitly forbid. Requires unread counts and presence to actually work first. Do not attempt this until Section 4 (Real-Time Signals) is implemented.

**Recommendation:** Start with Option B (inline actions on existing sections) as an incremental step. Migrate to Option A (action queue) once unread counts and presence are working. Option C becomes the evolution of Option A once data density is high enough.

---

## 2. Discovery Engine

Discovery answers: "I don't know what I'm looking for, but I want to find it." The current `/explore` page does client-side interest matching, which is the right starting point but has hard limits.

### Cold Start Problem

A new user has: email domain (campus), major (from onboarding), interests (from onboarding, max 20), and nothing else. No social graph, no behavior history, no engagement data.

**Option A: Onboarding-Seeded Discovery (Recommended)**

The onboarding flow already collects major and interests. The POST endpoint at `/api/spaces/recommended` already uses these for scoring. The gap is that this data flows into the recommendation API but NOT into the `/explore` page's `ForYouSection`.

Fix: When `/explore` loads, if the user has fewer than 3 spaces, call the recommendation API with their onboarding interests and use THAT for the "For You" section instead of the client-side keyword matching in `ForYouSection`. The `fetchUserProfile()` function already gets interests -- pipe them to the server recommendation endpoint rather than doing client-side string matching.

**What breaks:** Server-side scoring adds latency to the explore page load. Currently, spaces are fetched once and scored client-side. Moving to server-side scoring means either a separate API call or extending `browse-v2` to accept interests as input parameters.

**Key files:**
- `apps/web/src/app/explore/page.tsx` -- replace `personalizedSpaces` useMemo with server-scored data
- `apps/web/src/app/api/spaces/recommended/route.ts` -- already exists, can be reused
- `apps/web/src/app/api/spaces/browse-v2/route.ts` -- extend to accept `interests[]` param for server-side scoring

**Option B: Category-First Discovery**

New users see spaces grouped by category (`student_organizations`, `greek_life`, `campus_living`, `hive_exclusive`, `university_organizations`) instead of a flat "For You" grid. Categories feel navigable. Each category shows 3-4 spaces. User taps into a category to see all.

**What breaks:** Requires enough spaces per category to look full. If a campus has 2 greek life spaces and 40 student orgs, the categories feel lopsided. Also, the current canonical category list is limited to 5 types. Real campuses have more: academic departments, club sports, arts organizations, identity groups, professional societies.

**Option C: Quiz-Driven Discovery**

On first explore visit, show 5 binary questions: "Do you want to find study groups?" "Are you into sports?" "Do you care about campus events?" Use answers to immediately filter the explore grid.

**What breaks:** Adds friction. Users who just want to browse have to answer questions first. HIVE's philosophy is "a place to do" -- quizzes are not doing. Skip this unless cold start is a proven retention problem after launch.

### Warm Recommendations

Once a user has joined 3+ spaces, the system has behavioral signals. The ranking service in `feed-ranking.service.ts` already defines `UserRankingContext` with `spaceEngagementScores`, `preferredSpaceIds`, and `preferredContentTypes`. The problem is `loadUserEngagementData()` returns empty defaults.

**Implementation plan:**

1. Actually consume the `activityEvents` collection. The `/api/activity` route already writes `space_visit`, `tool_interaction`, etc. to Firestore. Build a Cloud Function or cron job that materializes per-user per-space engagement scores into a `user_engagement_metrics` document (this collection already exists in the data model but appears unused).

2. Feed those scores into `buildUserContext()` in `apps/web/src/app/api/feed/route.ts` (line 59). Replace the role-only engagement scoring with actual behavioral data.

3. For the `/explore` page recommendations, cross-reference: spaces the user's most-active space members also belong to. This is the "collaborative filtering" signal -- people who are active in Space A tend to also be in Space B.

**What matters most on campus:** Based on the data model and user document shape:
- **Major** -- strongest identity signal. Students in the same major share courses, career goals, anxiety.
- **Graduation year** -- cohort affinity. Freshmen explore differently than seniors.
- **Interests array** -- explicit preferences, already collected.
- **Residence type** -- on-campus students have different needs than commuters.
- **Community identities** -- international, first-gen, transfer, veteran -- these drive belonging.

**Key files:**
- `packages/core/src/application/feed/queries/get-personalized-feed.query.ts` -- `loadUserEngagementData()` on line 213 needs real implementation
- `apps/web/src/app/api/feed/route.ts` -- `buildUserContext()` on line 59 needs engagement data
- `apps/web/src/app/api/activity/route.ts` -- already writes activity events, data source is ready

---

## 3. Activity Events Architecture

The current activity feed fetches 4 event types. HIVE needs a richer vocabulary of events that capture everything meaningful that happens on campus without being noisy.

### Event Taxonomy

**Tier 1: High-Signal (always show)**

| Event Type | Source Collection | Trigger |
|---|---|---|
| `event_starting` | `events` | Event `startDate` is within 30 minutes |
| `event_created` | `events` | New event document created |
| `member_joined` | `spaceMembers` | New membership, `joinedAt` within window |
| `tool_deployed` | `spaces/{id}/placed_tools` | New tool placement |
| `space_created` | `spaces` | New space goes live (`isLive: true`) |

**Tier 2: Medium-Signal (show if user is in space)**

| Event Type | Source Collection | Trigger |
|---|---|---|
| `new_messages` | `spaces/{id}/boards/{id}/messages` | Message count > 0 since last visit |
| `poll_opened` | `deployedTools` | Poll tool state change to active |
| `poll_closed` | `deployedTools` | Poll tool state change to closed |
| `announcement_posted` | `spaces/{id}/posts` | Post with type `announcement` |
| `rsvp_milestone` | `rsvps` | Event hits 10, 25, 50, 100 RSVPs |

**Tier 3: Low-Signal (aggregate, don't itemize)**

| Event Type | Source Collection | Trigger |
|---|---|---|
| `messages_summary` | `spaceMessages` | "12 messages in 3 spaces today" |
| `weekly_digest` | Computed | "This week: 2 events, 5 new members, 1 new tool" |
| `space_milestone` | `spaces` | Space hits 50, 100, 250 members |

### Architecture Options

**Option A: Event Collection + Materialized Feed (Recommended)**

Write a Firestore Cloud Function triggered on document creates for `spaceMembers`, `events`, `spaces/{id}/placed_tools`, and `spaces/{id}/posts`. Each trigger writes a normalized `feedEvents` document:

```
feedEvents/{autoId}
{
  type: 'member_joined',
  campusId: string,
  spaceId: string,
  actorId: string,
  targetId?: string,
  metadata: { ... },
  timestamp: Timestamp,
  visibility: 'space_members' | 'campus' | 'public',
  ttl: Timestamp  // auto-delete after 30 days
}
```

The `/api/activity-feed` route then queries `feedEvents` instead of doing 4 separate collection scans. This is dramatically faster and cheaper on Firestore reads.

**What breaks:** Requires new Cloud Functions for every trigger. The current `infrastructure/firebase/functions/` already has feed functions but they're not wired to this pattern. Dual-write risk during migration. TTL-based cleanup requires a scheduled function or Firestore TTL policy.

**Key files to create:**
- `infrastructure/firebase/functions/src/triggers/activity-events.ts` -- Firestore triggers
- Modify `apps/web/src/app/api/activity-feed/route.ts` -- read from `feedEvents` instead of scanning 4 collections

**Option B: Keep Current Pattern, Add More Queries**

Extend the existing `/api/activity-feed/route.ts` to query more collections (polls, announcements, milestones). Keep the fan-out-on-read pattern.

**What breaks:** The current route already makes `O(spaces * 4)` Firestore calls per request. Adding more event types multiplies this. At 20 spaces and 8 event types, that is 160 Firestore reads per home page load. At scale, this costs money and is slow. The route already has a `try/catch` around each subcollection query because indexes may not exist -- this is a sign of fragility.

**Option C: Client-Side Event Aggregation with Firebase Listeners**

Use Firestore onSnapshot listeners on the client to watch for changes across collections. Aggregate in-memory.

**What breaks:** Firebase client SDK reads cost money per listener. A user with 20 spaces watching 4 subcollections each = 80 active listeners. This is expensive and battery-draining on mobile. Also, HIVE uses server-side auth (`firebase-admin`) for API routes, not client-side Firestore SDK directly. This would require changing the security model.

**Recommendation:** Option A. Write events on create via Cloud Functions, read from a single collection on the home page. This is the standard pattern for activity feeds at scale and Firebase specifically recommends it.

---

## 4. Real-Time Signals

The home page shows `onlineCount` and `unreadCount` but both are always 0. This makes spaces feel dead. A campus platform needs to feel alive.

### Online Presence

**Option A: Firestore Presence with Cloud Functions (Recommended)**

Use Firebase Realtime Database (RTDB) for presence, mirror to Firestore via Cloud Function:

1. Client writes to RTDB: `presence/{userId}/online: true, lastSeen: serverTimestamp, spaceId: currentSpaceId`
2. Client sets `onDisconnect().set({ online: false, lastSeen: serverTimestamp })`
3. Cloud Function triggers on RTDB write, updates `spaces/{spaceId}/presenceCount` in Firestore
4. Home page reads `presenceCount` from space documents (already fetched)

Cost model: RTDB is cheap for presence (tiny documents, connection-based). The Cloud Function only fires on connect/disconnect, not continuously.

**What breaks:** Requires Firebase RTDB, which is not currently in the stack. The `packages/firebase/src/` package only configures Firestore, Auth, and Storage. Need to add RTDB config. Also, "online" on a web app is ambiguous -- does having a tab open count? HIVE should define "online" as "has had the tab focused in the last 5 minutes" to avoid showing inflated counts.

**Key files to modify:**
- `packages/firebase/src/config.ts` -- add RTDB initialization
- New: `apps/web/src/hooks/use-presence.ts` -- client-side presence heartbeat
- New: `infrastructure/firebase/functions/src/triggers/presence.ts` -- mirror RTDB to Firestore

**Option B: Polling-Based Presence**

Client POSTs to `/api/presence/heartbeat` every 60 seconds with current spaceId. Server writes to `users/{id}/lastSeen`. Presence is computed server-side as "lastSeen within 5 minutes."

**What breaks:** 60-second polling means presence is always 0-60 seconds stale. At 1000 concurrent users, that is 1000 requests/minute to the heartbeat endpoint. Vercel serverless functions handle this fine, but it is 1000 Firestore writes/minute, which costs ~$0.18/hour. Scales linearly with users.

**Option C: Do Not Implement Presence, Show "Last Active" Instead**

Remove `onlineCount` from the UI. Replace with "Last active 2h ago" on space cards using `lastActivityAt` (which already exists in the `SpaceData` interface).

**What breaks:** Nothing technically. But "last active 2h ago" on every space makes the platform feel abandoned. The green dot indicator is a powerful signal that humans are here. For a campus platform trying to build belonging, presence matters.

**Recommendation:** Option A if you can add RTDB. Option C as a fallback while building Option A. Do not ship Option B -- polling presence is wasteful.

### Unread Counts

The space card shows `unreadCount` but it is always 0 because nothing writes or reads this value.

**Implementation:**

1. On message send to `spaces/{spaceId}/boards/{boardId}/messages`, the existing Cloud Function should increment `spaces/{spaceId}/boards/{boardId}/read_receipts/{userId}/unreadCount` for all board members except the sender.

2. On space visit (user opens `/s/{handle}`), POST to `/api/spaces/{spaceId}/mark-read` which resets the user's `read_receipts` across all boards.

3. On home page load, the `/api/profile/my-spaces` endpoint (which already fetches user spaces) should also read the user's `read_receipts` for each space and sum unread counts. This is `O(spaces)` additional reads.

**What breaks:** Read receipts subcollections (`spaces/{id}/boards/{id}/read_receipts`) already exist in the data model. The Cloud Function trigger on message create needs to fan out to all board members. For a board with 200 members, that is 200 Firestore writes per message. Batched writes help but there is a 500 operation limit per batch. For active boards, this gets expensive.

**Optimization:** Instead of per-message fan-out, track per-board "last message timestamp" and per-user "last read timestamp." Unread = `lastMessage > lastRead`. One write per message (update board metadata), one write per read event (update user read cursor). Unread count becomes a query: count messages where `createdAt > lastRead`.

**Key files:**
- `infrastructure/firebase/functions/src/` -- add trigger on message create
- `apps/web/src/app/api/profile/my-spaces/route.ts` -- extend to include unread counts
- New: `apps/web/src/app/api/spaces/[spaceId]/mark-read/route.ts`

### Live Event Indicators

The `EventCompactCard` in `apps/web/src/app/explore/page.tsx` already checks `isLive` and shows a gold badge. This works. The gap is that `isLive` is computed client-side from `startTime <= now && endTime > now`. There is no server push when an event goes live.

**Quick win:** Add a `liveEvents` count to the home page header. "1 event happening now" with a pulse dot. No real-time needed -- just check event times on page load.

---

## 5. Personalization

The current system matches on keyword overlap between user interests and space names/descriptions. This is a floor, not a ceiling.

### Option A: Signal-Weighted Scoring (Recommended)

Build a scoring function that combines multiple signals, weighted by reliability:

| Signal | Weight | Source | Available Now? |
|---|---|---|---|
| Major match | 0.25 | `users.major` vs `spaces.name/description` | Yes |
| Interest overlap | 0.20 | `users.interests[]` vs space keywords | Yes |
| Friend activity | 0.20 | Connections in space | Partially (connections collection exists but sparse) |
| Graduation year cohort | 0.10 | `users.graduationYear` | Yes |
| Residence match | 0.05 | `users.residenceType` vs `campus_living` spaces | Yes |
| Community identity | 0.05 | `users.communityIdentities` vs space tags | Yes |
| Engagement history | 0.10 | `activityEvents` aggregated | Exists but not consumed |
| Time-of-day | 0.05 | Current hour vs space peak activity | Needs implementation |

This scoring function replaces the client-side `personalizedSpaces` useMemo in `/explore` and the server-side `calculateAnxietyReliefScore` in `/api/spaces/recommended`. One scoring model, two consumers.

**What breaks:** Moving scoring server-side adds latency. The client-side approach is instant but crude. The server-side approach is accurate but requires a network call. Caching the recommendation for 5 minutes via React Query's `staleTime` (already set to `1000 * 60 * 2` in the home page) makes this acceptable.

**Key files:**
- New: `packages/core/src/domain/spaces/services/space-scoring.service.ts` -- unified scoring
- `apps/web/src/app/api/spaces/recommended/route.ts` -- use new scoring service
- `apps/web/src/app/explore/page.tsx` -- fetch server-scored results for "For You"

### Option B: Time-of-Day Awareness

College students have rhythms: morning classes, afternoon activities, evening study, late-night socializing. The home page should reflect this.

- 7-11am: Show study spaces, class-related spaces, events today
- 11am-2pm: Show social spaces, dining-related content, midday events
- 2-6pm: Show activity spaces, club meetings, afternoon events
- 6-10pm: Show event previews for tonight, study groups, project spaces
- 10pm-2am: Show social spaces, late-night activity, tomorrow's agenda

**What breaks:** Requires enough activity data to know when spaces are most active. Currently, `peakActivityHour` is tracked in `activitySummaries` but per-user, not per-space. Need to compute per-space activity patterns. Also, time zones -- the `users` document has no timezone field. HIVE would need to infer from campus location or browser `Intl.DateTimeFormat().resolvedOptions().timeZone`.

### Option C: Class Schedule Integration

Import student class schedules (from university APIs or manual input) to suggest spaces related to current courses, show "gap" time where they could engage with events, and suggest study groups for upcoming exams.

**What breaks:** University API integrations are school-specific and often require institutional partnerships. Manual class entry is high friction. This is a v2+ feature after product-market fit. Do not build this now.

**Recommendation:** Option A for launch, with time-of-day bucketing from Option B added once you have 2+ weeks of activity data per campus.

---

## 6. Search & Browse

### Current State

Search exists in two places:
1. `/explore` -- `ExploreSearch` component, client-side debounce, parallel API calls to `browse-v2`, `users/search`, and `events`
2. `/api/feed/search` -- POST endpoint with full-text search across posts, events, and tools using Firestore string matching (`.includes()`)

Both use naive substring matching. No fuzzy search. No search suggestions. No search history.

### Option A: Algolia-Powered Search (Recommended for Production)

Replace Firestore substring matching with Algolia. Sync `spaces`, `events`, `users`, and `tools` collections to Algolia indexes via Cloud Functions. Use Algolia's InstantSearch on the client.

**What breaks:** Adds a third-party dependency. Algolia's free tier covers 10k records and 10k searches/month. A single campus with 100 spaces, 500 events/year, and 5000 users is within free tier. But multi-campus scaling will require a paid plan (~$1/1000 searches). Also, HIVE's campus isolation constraint means search results must be filtered by `campusId` -- Algolia supports this via facets.

### Option B: Improve Firestore Search (Recommended for Now)

Enhance the current search without adding dependencies:

1. **Trigram indexing**: On space/event/user create, compute 3-character substrings and store as array fields. Use Firestore `array-contains` for matching. This enables fuzzy-ish search without Algolia.

2. **Search suggestions**: Store the top 20 searches per campus in a `searchQueries` collection. Show as typeahead suggestions when the search input is focused.

3. **Recent searches**: Store last 5 searches per user in localStorage (no server persistence needed). Show as quick-access pills below the search bar.

4. **Category filters**: Add filter chips below the search bar: Spaces, People, Events, Tools. Currently, the `/explore` page searches all types simultaneously. Letting users narrow by type reduces noise.

5. **Trending searches**: Track search queries server-side (anonymized). Surface "Trending on campus" queries when the search bar is empty.

**What breaks:** Trigram indexing increases document size. A space name "Computer Science Club" generates ~18 trigrams. Stored as an array field, this adds ~200 bytes per document. At 1000 spaces, that is 200KB of additional storage -- negligible. But the write cost on space create/update increases. Also, `array-contains` only matches one value at a time, so multi-word queries require multiple queries OR client-side intersection.

**Key files:**
- `apps/web/src/components/explore/ExploreSearch.tsx` -- add suggestions, recent searches, category filters
- `apps/web/src/app/api/feed/search/route.ts` -- add trigram matching, track search queries
- New: `apps/web/src/hooks/use-search-history.ts` -- localStorage-based recent searches

### Option C: Dedicated Browse Page

Add a `/browse` route that is NOT the explore feed but a pure category browser:
- Left sidebar: Categories (Academic, Social, Greek, Campus Life, Tools, Events)
- Main content: Grid of items in selected category
- Sort by: Popular, Recent, Alphabetical

**What breaks:** Another page to maintain. The `/explore` page already serves this purpose with its sections. Adding `/browse` fragments the navigation. Unless explore is demonstrably failing at browsing, this is premature.

**Recommendation:** Option B now. Migrate to Option A (Algolia) when search volume exceeds what Firestore can handle efficiently, or when multi-campus search becomes important.

---

## 7. Notification-Driven Engagement

The notification system exists and uses SSE streaming. The infrastructure is solid. The gap is: what notifications actually bring people back?

### Notification Types That Drive Return Visits

**Tier 1: High-Return (send immediately)**

| Notification | Trigger | Copy Example |
|---|---|---|
| Event reminder | 1 hour before event start | "Study Group starts in 1 hour at Lockwood Library" |
| Direct message | New DM received | "Sarah sent you a message" |
| Mentioned in board | `@username` in message | "Alex mentioned you in CS Club" |
| RSVP'd event going live | Event transitions to live | "Hackathon is starting now -- join the space" |

**Tier 2: Medium-Return (batch, send at optimal time)**

| Notification | Trigger | Copy Example |
|---|---|---|
| Friend joined a space | Connection joins new space | "3 people in your major joined Photography Club" |
| Space milestone | Space hits member threshold | "Design Club just hit 100 members" |
| New event in your space | Event created by space leader | "New event: Portfolio Review Night" |
| Tool result ready | Async tool completes | "Your poll results are in -- 47 votes" |

**Tier 3: Low-Return (weekly digest only)**

| Notification | Trigger | Copy Example |
|---|---|---|
| Weekly activity summary | Cron, Sunday 6pm | "This week: 3 events, 12 new members across your spaces" |
| Trending spaces | Weekly computation | "Robotics Club is trending on campus" |
| New people in your major | Weekly new user batch | "5 new CS students joined HIVE this week" |

### Delivery Channels

| Channel | When to Use | Implementation |
|---|---|---|
| In-app (SSE) | Always, for all tiers | Already working via `use-notification-stream` |
| Push (FCM) | Tier 1 only, when app is not focused | `users.fcmTokens` field exists, FCM setup needed in Cloud Functions |
| Email | Weekly digest only | Not implemented, need SendGrid/Resend integration |

### Frequency Optimization

**Option A: Smart Batching (Recommended)**

Do not send more than 5 push notifications per user per day. Batch Tier 2 notifications into a single push at the user's `peakActivityHour` (from `activitySummaries`). Default to 6pm if no data.

Allow users to set their own threshold in notification preferences at `/notifications/settings` (page exists as `apps/web/src/app/notifications/settings/page.tsx` but needs implementation).

**What breaks:** Delayed notifications feel less real-time. A friend joining a space at 2pm that the user finds out about at 6pm is stale. But 15 push notifications in a day makes users disable notifications entirely, which is worse.

**Option B: User-Controlled Per-Space Muting**

Each space card has a "mute" option. Muted spaces send no notifications except Tier 1 (event reminders the user RSVP'd to). This is per-space granularity.

**What breaks:** Users must manually configure each space. Default should be "all notifications on" for spaces they join, with easy mute. The mute infrastructure partially exists -- `infrastructure/firebase/functions/src/feed/mute.ts` has mute logic for the feed.

**Key files:**
- `apps/web/src/app/notifications/settings/page.tsx` -- build real preferences UI
- `apps/web/src/app/api/profile/notifications/preferences/route.ts` -- already exists
- `infrastructure/firebase/functions/src/` -- add notification triggers for new event types

---

## 8. Social Proof & FOMO

Social proof signals make students feel like they are part of something real. HIVE needs these signals without being manipulative.

### What Works for College Students

**Signals grounded in truth (use these):**

| Signal | Where to Show | Implementation |
|---|---|---|
| "12 people in your major are in this space" | Space card on explore, recommendation cards | Cross-reference `spaceMembers` with `users.major` matching current user |
| "Sarah and 3 others you know are going" | Event RSVP card | Cross-reference `rsvps` with user's `connections` |
| "This event is 80% full" | Event card, when capacity is set | `currentCapacity / maxCapacity`, only show above 50% |
| "Active today" badge on space | Space card | Based on `feedEvents` or messages in last 24h |
| "New this week" badge on space | Space card | Space `createdAt` within last 7 days |
| "5 new members this week" | Space detail page | Count `spaceMembers.joinedAt` within last 7 days |

**Signals that feel manipulative (avoid these):**

| Signal | Why It is Bad |
|---|---|
| "You're missing out on 47 messages" | Anxiety-inducing. HIVE explicitly measures AnxietyRelief. |
| "Everyone is on HIVE right now" | Vague, unverifiable, feels like an ad. |
| "This space is trending" without explanation | Black-box. "Trending" means nothing to a student. |
| Fake scarcity ("Only 3 spots left") | Only acceptable if the space literally has a capacity limit. |
| Notification counts as social pressure | "You have 99+ notifications" is a failure state, not a feature. |

### Implementation Options

**Option A: Context-Aware Social Proof (Recommended)**

Show social proof only when it is relevant to the user. "People in your major" only appears if the space actually has people in the user's major. "Friends going" only appears if the user has connections who RSVP'd.

This requires the social proof scoring in `/api/spaces/recommended/route.ts` to actually have connection data. The current `calculateSocialProofScore()` function works correctly but `connectionIds` and `friendIds` are typically empty arrays because the `connections` and `friends` collections are sparse.

**Fix:** Instead of relying on explicit connection/friend records, derive social proximity from shared space membership. Two users in 3+ of the same spaces are implicitly connected. This requires a materialized view:

```
// Cloud Function, runs nightly
For each user:
  Get their spaceIds
  For each other user in any of those spaces:
    Count shared spaces
    If shared >= 3: write to mutual_connections collection
```

This makes social proof work without requiring users to explicitly "connect" or "friend" each other. The `mutual_connections` collection already exists in the data model (`{user1Id}_{user2Id}`).

**What breaks:** The nightly computation is `O(users * spaces * members)`. At 5000 users with 20 spaces averaging 50 members each, this is ~50 million comparisons. Need to be smart about it: only compute for users who were active in the last 7 days, and use Set intersection instead of nested loops. Also, "3+ shared spaces" is an arbitrary threshold -- needs tuning per campus size.

**Key files:**
- `apps/web/src/app/api/spaces/recommended/route.ts` -- use `mutual_connections` for social proof
- New: `infrastructure/firebase/functions/src/scheduled/compute-mutual-connections.ts`
- `apps/web/src/app/explore/page.tsx` -- display social proof on space cards

**Option B: Live Activity Signals**

Instead of social proof about people, show proof about activity:
- "14 messages today" on a space card
- "2 events this week" on a space card
- "Last active 3 minutes ago" on a space card

This does not require social graph data at all. Just activity counts, which can be computed from existing data.

**What breaks:** Activity counts can make quiet spaces look dead. A space with "0 messages today" is a negative signal. Only show activity counts when they are positive (> 0). For spaces with no recent activity, show member count or "Est. 2024" founding date instead.

**Option C: Peer Activity Feed**

A "Friends" tab on the explore page showing what people in the user's network are doing: joining spaces, attending events, deploying tools. Like a lightweight social feed scoped to discovery.

**What breaks:** This pushes HIVE toward being a social network, which it explicitly is not. "Not a feed to scroll. A place to do." A peer activity feed is exactly a feed to scroll. The right version of this is: surface peer activity AS social proof on action cards, not as a standalone feed.

**Recommendation:** Option A (context-aware social proof using shared space membership) combined with Option B (live activity counts on space cards). Skip Option C.

---

## Implementation Priority

Based on what ships the fastest and has the most impact on "does this help a student find their people, join something real, and come back tomorrow":

| Priority | What | Why | Effort |
|---|---|---|---|
| 1 | Unread counts on space cards | Spaces feel dead without them. Single highest-impact fix. | Medium -- read cursors + Cloud Function |
| 2 | Action buttons on home page cards | Every card should have a verb. Inline CTAs on existing sections. | Low -- UI changes only |
| 3 | Event-driven activity collection | Replace 4-collection scan with materialized `feedEvents`. | Medium -- Cloud Functions + API change |
| 4 | Server-side recommendation scoring | Replace client-side keyword matching with real scoring. | Medium -- service extraction + API |
| 5 | Presence system | Green dots make campus feel alive. | Medium-High -- RTDB setup + Cloud Function |
| 6 | Search improvements | Recent searches, suggestions, category filters. | Low-Medium -- client-side mostly |
| 7 | Notification triggers for new event types | Event reminders, mentions, friend activity. | Medium -- Cloud Functions |
| 8 | Mutual connections materialization | Social proof that actually works. | Medium -- scheduled Cloud Function |

---

## File Reference

| Purpose | Path |
|---|---|
| Home page | `apps/web/src/app/home/page.tsx` |
| Explore page | `apps/web/src/app/explore/page.tsx` |
| Feed API route | `apps/web/src/app/api/feed/route.ts` |
| Activity feed API | `apps/web/src/app/api/activity-feed/route.ts` |
| Feed ranking service | `packages/core/src/domain/feed/services/feed-ranking.service.ts` |
| Personalized feed query | `packages/core/src/application/feed/queries/get-personalized-feed.query.ts` |
| Space recommendations API | `apps/web/src/app/api/spaces/recommended/route.ts` |
| Notification bell | `apps/web/src/components/notifications/hive-notification-bell.tsx` |
| Notifications API | `apps/web/src/app/api/notifications/route.ts` |
| Realtime notifications hook | `apps/web/src/hooks/use-realtime-notifications.ts` |
| Activity tracking API | `apps/web/src/app/api/activity/route.ts` |
| Recent activity API | `apps/web/src/app/api/spaces/activity/recent/route.ts` |
| Feed search API | `apps/web/src/app/api/feed/search/route.ts` |
| Feed hook | `apps/web/src/hooks/use-feed.ts` |
| Feature flags hook | `apps/web/src/hooks/use-feature-flags.ts` |
| Explore search component | `apps/web/src/components/explore/ExploreSearch.tsx` |
| Space card component | `apps/web/src/components/explore/SpaceCard.tsx` |
| Feed cloud functions | `infrastructure/firebase/functions/src/feed/` |
| Data model reference | `docs/DATA_MODEL.md` |
