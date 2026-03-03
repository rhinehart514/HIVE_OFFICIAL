# Feed Surface Spec

**Route:** `/discover` (Home tab)
**Job:** Answer "what's happening on my campus right now?"
**User:** Every student — but especially the lonely freshman who needs a reason to leave their room, and the org leader who needs proof their event is getting reach.
**Stage constraint:** Pre-launch, single campus (UB), 650+ pre-seeded spaces, 0 users. The feed must feel alive from day 1 with zero user-generated activity.

---

## Existing Code Assessment

### What ships

| Component | Location | Status |
|-----------|----------|--------|
| Discover page (sectioned feed) | `apps/web/src/app/(shell)/discover/page.tsx` | **Ships.** 4-section layout: Live Now, Today, Your Spaces, Discover. Fetches from `/api/events/personalized`. |
| Feed component library | `apps/web/src/components/feed/` | **Ships.** CampusHeader, LiveNowSection, TodayEventsSection, SpacesActivitySection, DiscoverSection, EventDetailDrawer, FeedSkeleton. |
| Personalized events API | `apps/web/src/app/api/events/personalized/route.ts` | **Ships.** Interest match, social context, space membership, time proximity scoring. Supports time ranges, pagination, sort modes. |
| Events page (grouped timeline) | `apps/web/src/app/(shell)/events/page.tsx` | **Ships.** Tonight/Today/Tomorrow/This Week/Later grouping with inline RSVP. |
| Feed types | `apps/web/src/components/feed/types.ts` | **Ships.** FeedEvent, FeedSpace, CampusStats. |
| Time utilities | `apps/web/src/components/feed/time-utils.ts` | **Ships.** isHappeningNow, startsWithinHour, isToday, timeLabel, dayLabel, eventGradient. |
| Browse spaces API | `apps/web/src/app/api/spaces/browse-v2/route.ts` | **Ships.** Cursor-paginated, trending sort, category filter. |
| Spaces activity API | `/api/spaces/activity/recent` | **Ships.** Recent activity from user's joined spaces. |
| Campus stats API | `/api/campus/stats` | **Ships.** Space count, events today. |

### What changes

| Component | Change |
|-----------|--------|
| Discover page | Add "New Apps" card type for apps created by spaces the user follows. Add "Happening This Week" section below Today when Today is sparse. |
| CampusHeader | Add pulse indicator when events are live. Show "X students here now" when presence data is available (post-launch). |
| Empty/cold-start state | Replace generic empty state with pre-seeded content strategy (see Section 5). |
| Feed ranking | Add "has event within 48 hours" boost to space discovery cards. |

### What we're NOT building

- No algorithmic feed ranking beyond the existing relevance scoring. The 8-factor FeedRankingService from spec 03 is aspirational — not launch.
- No infinite scroll. The feed is sectioned with explicit "show more" actions. Natural stopping points per the anti-patterns spec.
- No ML-based personalization. Interest match + space membership + time proximity is the entire ranking model.
- No DM integration or social graph-based "friends are doing X" beyond what RSVP data already provides.
- No post/text feed. The feed is events + spaces + apps. Text posts are a space-level feature, not a campus-level feed item.
- No cross-campus content. Single campus (UB) only.
- No "For You" AI-curated section. Too risky at 0 users — the model has nothing to learn from.

---

## 1. Feed Object Model

The feed is not a single stream. It is a **sectioned surface** — each section answers a different temporal question. This is intentional: sections give the feed structure even when individual sections are empty, and they create natural stopping points.

### Feed sections (top to bottom)

| Section | Question it answers | Source | Visible when |
|---------|-------------------|--------|--------------|
| **Campus Header** | "Where am I?" | `/api/campus/stats` | Always |
| **Live Now** | "What's happening RIGHT NOW?" | Events where `now >= start && now <= end`, or starting within 1 hour | Any live/imminent events exist |
| **Today** | "What's happening later today?" | Today's events, excluding live ones, sorted by start time | Any non-live today events exist |
| **This Week** | "What's coming up?" | Events in next 7 days, excluding today | Today section has < 3 items |
| **Your Spaces** | "What are my communities up to?" | Recent activity from joined spaces (events, posts) | User has joined >= 1 space |
| **New Apps** | "What can I use?" | Recently created apps from spaces the user follows, or trending campus apps | Any apps exist (new section) |
| **Discover** | "What should I join?" | Unjoined spaces, sorted by trending, cursor-paginated | Always (this is the growth engine) |

### Feed item: Event

The primary feed object. Already defined in `FeedEvent` type at `apps/web/src/components/feed/types.ts`.

```typescript
interface FeedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;          // ISO
  endDate?: string;           // ISO
  location?: string;
  isOnline?: boolean;
  rsvpCount: number;
  isUserRsvped?: boolean;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  spaceName?: string;         // attribution
  spaceHandle?: string;       // link target
  spaceId?: string;
  spaceAvatarUrl?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  eventType?: string;
  category?: string;
  friendsAttending?: number;
  friendsAttendingNames?: string[];
  matchReasons?: string[];
  relevanceScore?: number;
}
```

### Feed item: Space (discovery)

Already defined in `FeedSpace` type.

```typescript
interface FeedSpace {
  id: string;
  handle?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  isVerified?: boolean;
  isJoined?: boolean;
  category?: string;
  mutualCount?: number;
  upcomingEventCount?: number;
  nextEventTitle?: string;
  recentActivityAt?: string;
}
```

### Feed item: App Card (new)

Apps created by spaces — this is what differentiates HIVE from every other campus app.

```typescript
interface FeedApp {
  id: string;                 // tool/deployment ID
  name: string;
  description?: string;
  previewImageUrl?: string;   // OG image or screenshot
  spaceName: string;          // "Made by [Space]"
  spaceHandle?: string;
  spaceId: string;
  creatorName?: string;
  category?: string;          // poll, bracket, rsvp, custom
  createdAt: string;          // ISO
  useCount?: number;          // how many people have interacted
}
```

### Feed item: Space Activity

Already implemented in `SpacesActivitySection`. Activity from joined spaces.

```typescript
interface ActivityItem {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceHandle?: string;
  spaceAvatarUrl?: string;
  type: 'message' | 'event' | 'post';
  preview: string;
  authorName?: string;
  timestamp: string;
}
```

---

## 2. Feed Ranking

No ML. No recommendation engine. Simple, debuggable, implementable.

### Events ranking (existing, ships as-is)

The personalized events API already implements a solid scoring model:

| Signal | Points | Logic |
|--------|--------|-------|
| Interest match | 0-100 | User interests vs event category/tags/title/description |
| Friends attending | 0-50 | 10 per friend, capped at 5 |
| Space membership | 20 | Event is from a space the user joined |
| Time proximity | 0-30 | <= 3hrs: 30pts, <= 6hrs: 20pts, <= 12hrs: 10pts |
| Popularity | 0-20 | >= 20 RSVPs: 20pts, >= 10: 10pts |

**Sort modes:** `relevance` (score desc), `soonest` (start time asc), `newest` (start time desc). The feed uses `soonest` by default — chronological is more trustworthy at low volume than relevance scoring with sparse signals.

### Discover spaces ranking

The browse-v2 API sorts by `trending`. Boost factors for launch:

| Signal | Boost | Why |
|--------|-------|-----|
| Has event in next 48 hours | +high | Spaces with upcoming events feel alive |
| Recently active (post/event in last 7 days) | +medium | Activity = life |
| Member velocity (joins in last 7 days) | +medium | Social proof |
| Mutual friends joined | +high | Strongest signal at low density |
| Verified space | +low | Pre-seeded spaces are all verified |

### App cards ranking (new)

Simple: newest first, boosted by use count. At launch volume, recency is the only signal that matters.

### Section ordering logic

Sections are **not** dynamically reordered. The fixed order (Live Now > Today > This Week > Your Spaces > New Apps > Discover) respects temporal urgency. The only dynamic behavior is **section visibility** — empty sections are hidden, and "This Week" only appears when Today has fewer than 3 items.

---

## 3. Feed Card Types

### Live Now Card (existing)

**Component:** `LiveNowSection` — horizontal scroll of 260px-wide cards.
**Visual:** Cover image/gradient background, LIVE badge (red pulse) or "In 23m" countdown badge, space avatar + name, title, location, RSVP count.
**Action:** Tap opens EventDetailDrawer (bottom sheet on mobile, centered modal on desktop).
**Connective action:** Drawer links to space via space card at bottom.

### Today Event Card (existing)

**Component:** `TodayEventsSection` — vertical list with thumbnail + content layout.
**Visual:** 96px thumbnail left, space avatar + name + time top-right, title, location + social signal, Going/Maybe buttons.
**Action:** Tap opens EventDetailDrawer. Going/Maybe buttons fire RSVP mutations with optimistic update.
**Connective action:** Drawer links to space. RSVP confirmation could show "See what else [Space] is doing" nudge (future).

### This Week Event Card (new section, reuses Today card)

**Component:** Reuse `TodayEventsSection` component with a different section header ("This Week") and date label instead of time label.
**Visible when:** Today section has < 3 items. This prevents the feed from feeling empty on slow days.

### Your Spaces Activity Card (existing)

**Component:** `SpacesActivitySection` — compact list rows.
**Visual:** Space avatar (28px), "[Space] posted a new event: [title]" or "[Space] shared a post", relative timestamp.
**Action:** Tap navigates to `/s/[handle]`.
**Connective action:** The link IS the connective action — it pulls users into spaces.

### App Card (new)

**Component:** `FeedAppCard` (to build)
**Visual:** App preview image or placeholder gradient, app name, "Made by [Space]" attribution, category chip (Poll, Bracket, RSVP, etc.), use count if > 0.
**Layout:** Grid card (same grid as Discover spaces, 1-col mobile / 2-col tablet).
**Action:** Tap navigates to `/s/[spaceHandle]/tools/[toolId]` (app within space context) or `/t/[toolId]` (standalone).
**Connective action:** "Made by [Space]" links to space. "Make your own" link at section bottom goes to `/build`.

### Discover Space Card (existing)

**Component:** `DiscoverSection` — grid cards with join button.
**Visual:** Space avatar (40px), name + verified badge, member count or mutual friends count, next event title or upcoming event count, Join button.
**Action:** Tap navigates to `/s/[handle]`. Join button fires join mutation with optimistic update + PWA value moment emit.
**Connective action:** Space page is the destination. Joining a space populates "Your Spaces" section on next feed load.

---

## 4. Event Detail Drawer

Already built at `apps/web/src/components/feed/EventDetailDrawer.tsx`. Ships as-is.

**Behavior:**
- Bottom sheet on mobile (slides up), centered modal on desktop
- Cover image/gradient header with title overlay
- Time, location, RSVP count with friend names
- Description (HTML-stripped)
- Match reasons as chips
- Space link card (avatar + name + "View space")
- Sticky footer with Attend/Going button
- Close on Escape, backdrop click, X button
- Scroll lock on body while open

**Connective actions from the drawer:**
- "View space" card links to `/s/[handle]`
- Space avatar/name in header links to `/s/[handle]`
- After RSVP: no extra action (the confirmation IS the value moment)

---

## 5. Cold-Start & Empty States

This is existential. Day 1 has 0 users and 650+ pre-seeded spaces. The feed must feel alive.

### Strategy: Pre-seeded events as the heartbeat

The 650+ pre-seeded spaces from CampusLabs include real events with real dates, locations, and descriptions. These events are the cold-start content engine. The feed does NOT need user-generated content to feel useful.

**Day 1 feed for any student:**

1. **Live Now** — If any pre-seeded event is currently happening (likely — UB has dozens of events daily), it shows here. If none are live, section hides gracefully.
2. **Today** — Pre-seeded events from CampusLabs sorted by start time. UB typically has 5-15 events on any given day. This section will not be empty.
3. **Discover** — 650+ spaces with real names, descriptions, member counts, and upcoming events. Cursor-paginated, 10 at a time. This section is always full.

### Empty state by section

| Section | Empty state | Design |
|---------|-------------|--------|
| Live Now | Hidden (no section header shown) | N/A — absence is better than "nothing live" |
| Today | Hidden if This Week shows. If both empty: "No events today. Check back tomorrow or browse spaces below." + arrow pointing to Discover section | Brief copy, no icon, directs attention downward |
| This Week | Hidden if Today has >= 3 items | Only shows as a supplement |
| Your Spaces | Hidden until user joins 1+ space. After joining but no activity: "Your spaces are quiet. Things will show up here as they happen." | Calm, no pressure |
| New Apps | Hidden until apps exist on campus | N/A at launch — apps come from creators |
| Discover | Never empty (650+ pre-seeded spaces) | Always renders |

### Returning-user empty state

For the `returning-skeptic` perspective: the feed must look different on second visit.

- Events naturally change daily (time-based content solves this)
- Discover section uses cursor pagination — second visit shows different spaces if they scrolled last time
- After joining spaces, "Your Spaces" section appears — new content the user hasn't seen
- After RSVPing, events show "Going" state — evidence of the user's own activity

### Hard rule

**Never show a fully empty feed.** The Discover section with 650+ pre-seeded spaces is the floor. Even if every other section is empty, the student sees spaces to explore. The feed always has a next action.

---

## 6. Connective Actions

Every card must lead somewhere deeper. The feed is a hallway, not a room.

| Card type | Primary action | Secondary action | Destination |
|-----------|---------------|------------------|-------------|
| Live Now event | Tap card | — | EventDetailDrawer |
| Today event | Tap card | Going/Maybe buttons | EventDetailDrawer / RSVP mutation |
| EventDetailDrawer | Attend button | "View space" card | RSVP mutation / `/s/[handle]` |
| Space activity | Tap row | — | `/s/[handle]` |
| App card | Tap card | "Made by [Space]" | `/s/[handle]/tools/[toolId]` or `/t/[toolId]` |
| Discover space | Tap card | Join button | `/s/[handle]` / Join mutation |
| Section "Make your own" | Tap link | — | `/build` |

### Cross-surface links from the feed

- **Feed -> Space:** Every event card and space card links to `/s/[handle]`
- **Feed -> Build:** "New Apps" section has "Make your own" footer link to `/build`
- **Feed -> Profile:** (Future) Activity cards could show creator profile links
- **Feed -> Events:** "See all events" link in Today section header goes to `/events`

---

## 7. Performance Requirements

Per the 2026 standards spec:

| Metric | Target |
|--------|--------|
| LCP | < 1.5s |
| Time to useful content | < 2s (skeleton -> real data) |
| API response (personalized events) | < 300ms p95 |
| Section render (after data arrives) | < 100ms |
| RSVP optimistic update | Instant (< 50ms perceived) |

### Implementation notes

- **Skeleton states:** Already built (`FeedSkeleton`). Matches actual content layout per 2026 standards.
- **Stale-while-revalidate:** Feed events query has 60s staleTime + 60s refetchInterval. Spaces activity query has 60s staleTime. Discover spaces query has 5m staleTime. Campus stats has 5m staleTime.
- **Optimistic updates:** RSVP mutations already use optimistic UI with rollback on error.
- **Pagination:** Discover section uses cursor-based infinite query, loads 10 at a time with explicit "Load more" button (not infinite scroll).
- **Image loading:** Event cover images are lazy-loaded. Space avatars use a color-hash fallback (`SpaceAvatar` component).

---

## 8. API Routes

### Existing (ship as-is)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/events/personalized` | GET | Personalized events with relevance scoring. Params: timeRange, maxItems, sort, page. |
| `/api/spaces/browse-v2` | GET | Browse unjoined spaces. Params: category, sort, limit, cursor, showAll. |
| `/api/spaces/activity/recent` | GET | Recent activity from user's joined spaces. Params: limit. |
| `/api/campus/stats` | GET | Campus-level stats (space count, events today). |
| `/api/spaces/[spaceId]/events/[eventId]/rsvp` | POST | RSVP to a space event. Body: { status }. |
| `/api/events/[eventId]/rsvp` | POST | RSVP to a standalone event. Body: { status }. |

### New (to build)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/recent` | GET | Recently created apps, filterable by campus. Returns FeedApp[] for the New Apps section. Params: limit, campusId (from session). |

---

## 9. Component List

### Existing (no changes needed)

| Component | File |
|-----------|------|
| CampusHeader | `apps/web/src/components/feed/CampusHeader.tsx` |
| LiveNowSection | `apps/web/src/components/feed/LiveNowSection.tsx` |
| TodayEventsSection | `apps/web/src/components/feed/TodayEventsSection.tsx` |
| SpacesActivitySection | `apps/web/src/components/feed/SpacesActivitySection.tsx` |
| DiscoverSection | `apps/web/src/components/feed/DiscoverSection.tsx` |
| EventDetailDrawer | `apps/web/src/components/feed/EventDetailDrawer.tsx` |
| FeedSkeleton | `apps/web/src/components/feed/FeedSkeleton.tsx` |
| SpaceAvatar | `apps/web/src/components/feed/SpaceAvatar.tsx` |

### New (to build)

| Component | File | Purpose |
|-----------|------|---------|
| FeedAppCard | `apps/web/src/components/feed/FeedAppCard.tsx` | App card for New Apps section |
| NewAppsSection | `apps/web/src/components/feed/NewAppsSection.tsx` | Section wrapper for app cards with "Make your own" footer |
| ThisWeekSection | `apps/web/src/components/feed/ThisWeekSection.tsx` | Reuses TodayEventsSection card style with week-level date labels |

### Changes to existing

| Component | Change |
|-----------|--------|
| `apps/web/src/app/(shell)/discover/page.tsx` | Add ThisWeekSection (conditional), NewAppsSection. Update section ordering. |
| `apps/web/src/components/feed/index.ts` | Export new components and FeedApp type. |
| `apps/web/src/components/feed/types.ts` | Add FeedApp interface. |

---

## 10. Data Flow

```
/discover (page)
  |
  |-- useQuery('feed-events') --> GET /api/events/personalized?timeRange=upcoming&maxItems=50&sort=soonest
  |     |-- LiveNowSection (filters: isHappeningNow || startsWithinHour)
  |     |-- TodayEventsSection (filters: isToday && !isHappeningNow)
  |     |-- ThisWeekSection (filters: !isToday, visible when Today < 3 items)
  |
  |-- useQuery('feed-spaces-activity') --> GET /api/spaces/activity/recent?limit=6
  |     |-- SpacesActivitySection
  |
  |-- useQuery('feed-new-apps') --> GET /api/tools/recent?limit=6
  |     |-- NewAppsSection
  |
  |-- useInfiniteQuery('feed-discover-spaces') --> GET /api/spaces/browse-v2?sort=trending&limit=10
  |     |-- DiscoverSection
  |
  |-- useQuery('campus-header-stats') --> GET /api/campus/stats
        |-- CampusHeader
```

All queries fire in parallel on mount. Skeleton states render immediately. Sections appear as their data arrives (progressive disclosure).

---

## Evals

### Value prop
The feed answers "what's happening" for every student on campus — the lonely freshman looking for a reason to go somewhere, the org leader checking if their event is getting reach, and the commuter with 45 minutes to kill.

### Scenario
A student opens HIVE for the first time. They just finished onboarding (3 minutes ago). They see the feed. What do they do next?

### Perspectives to run
- `lonely-freshman` — Do they see something they'd actually go to? Does anything feel like an invitation?
- `overwhelmed-org-leader` — Can they see that their event will get reach? Is there a path to creation?
- `thursday-night-sophomore` — Is there a reason to open this instead of texting the group chat?
- `commuter-student` — Can they find something happening in the next hour?
- `returning-skeptic` — Does the feed look different on second visit?

### Implementation files
- `apps/web/src/app/(shell)/discover/page.tsx`
- `apps/web/src/components/feed/*`
- `apps/web/src/app/api/events/personalized/route.ts`
- `apps/web/src/app/api/spaces/browse-v2/route.ts`
