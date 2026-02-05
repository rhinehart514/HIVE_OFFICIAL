# Home & Feed

**Dimension:** What you see when you open the app. The daily touchpoint.
**Decision filter:** Does this help a student find their people, join something real, and come back tomorrow?
**North star:** Weekly Active Spaces
**Anti-pattern:** HIVE is NOT a feed to scroll. It is a place to do.

---

## Current State

### What Exists

The home page (`/home`) is a 1,100-line single-column activity stream. Six sections in fixed order:

1. **Greeting header** -- time-aware ("Good morning, Jordan") + today's date
2. **Happening Now** -- green pulse, total online count across spaces (disappears if zero)
3. **Up Next** -- next event within 24 hours, inline RSVP
4. **Your Spaces** -- 2-column grid with unread badges (gold pulse glow), online counts, last activity timestamps
5. **Recent Activity** -- last 10 items (new_messages, member_joined, event_created, tool_deployed), all identically weighted
6. **Suggested** -- one space recommendation per day based on interest scoring

New users (0 spaces) get a different path: centered empty state with interest-based recommendations and inline join buttons. First join redirects into the space.

### Data Architecture

Three parallel API calls on mount (no consolidation):
- `/api/profile/my-spaces` -- membership list
- `/api/profile/dashboard?includeRecommendations=true` -- events + suggestions
- `/api/activity-feed?limit=10` -- cross-space activity with 7-day window

React Query with 2-minute stale time. No real-time updates -- page refresh required for new activity. Mark-as-viewed fires after arbitrary 5-second timeout.

### What Works

- Time-aware greeting creates warmth without being gimmicky
- Stagger reveal animations (`staggerContainerVariants`) feel premium on first load
- Unread badges with gold pulse glow (`animate-pulse-gold shadow-glow-sm`) draw the eye correctly
- RSVP is inline -- no navigation required
- New user path is thoughtful (not an empty dead end)
- Skeleton loading states match final layout exactly

### What Breaks

- **No urgency hierarchy.** Everything has equal visual weight. A message mentioning you looks identical to someone joining a space you lurk in.
- **"Happening Now" vanishes.** If nobody is online, the section disappears entirely -- no "all quiet" state, no prediction of when things pick up.
- **Activity feed is a list, not intelligence.** No grouping by time, no distinction between types, no preview of actual content (just "5 new messages in CS 370").
- **Three parallel fetches** create a request waterfall. Dashboard API itself makes 3 more internal calls. Total: 6+ Firestore round trips per home load.
- **No real-time.** SSE infrastructure exists for notifications but home page uses raw `fetch()`. User has to pull-to-refresh to see new activity.
- **Unread counts hardcoded to 0.** `useTotalUnreadCount()` at line 284 of the hook returns a literal zero. The badge data exists in Firestore but is never read in real-time.
- **No "what did I miss" pattern.** A student who was gone for 3 days and a student who checked 10 minutes ago see the same page.

---

## The Opportunity

The home page is the single highest-leverage surface in HIVE. It is the first thing 32,000 students see when they open the app. Today it answers "what exists?" Tomorrow it should answer "what should I do right now?"

The core tension: **HIVE is not a feed. It is a launchpad.** Every element on home should propel the student INTO a space, not keep them on the home page. The metric is not time-on-home. The metric is time-to-action -- how fast does someone land somewhere they belong?

Three strategic gaps:

**1. No time awareness.** A student opening HIVE at 8am Monday needs their schedule. A student opening at 10pm Thursday needs to see what they missed. The page is static -- same sections, same order, regardless of when you arrive.

**2. No urgency signal.** The page treats "your event starts in 15 minutes" and "someone joined your space 3 days ago" with identical visual weight. There is no triage layer.

**3. No return-state intelligence.** The app does not know if you were gone for 10 minutes or 10 days. A "catch-up" mode would dramatically reduce the anxiety that makes students check Instagram instead -- at least Instagram tells you what you missed.

The opportunity is not to build a better feed. It is to build a **command center** -- a surface that collapses "what happened," "what is happening," and "what should I do" into a 5-second scan that launches you into action.

---

## Feature Ideas

### 1. Morning Brief / Evening Recap

**Problem:** Students open HIVE and don't know what to focus on. The page looks the same at 8am and 8pm.

**Shape:** Time-adaptive card at the top of home. Before noon: "Today you have 2 events. Design Club meets at 3pm. 8 unread messages across 3 spaces." After 6pm: "Tomorrow: CS 301 Lab at 10am. Your spaces were active today -- 47 messages in Hacker Space." If last visit was 8+ hours ago, show a "While you were away" summary: message counts per space, new members, events created.

**Wedge:** This is the "open and know" moment. Students currently piece this together from 6 different sections. Collapsing it into one card with action buttons ("Catch up" goes to highest-unread space, "See schedule" opens calendar) saves 15 seconds every open.

**Impact:** High. This is the first thing users see. If it answers their question, they trust the app. If it doesn't, they go to Instagram.

**Effort:** Medium. Data already exists across three API calls. New component, new time-branching logic, consolidated API endpoint.

**Tradeoffs:**
- Requires the consolidated `/api/home` endpoint (P2 task, not yet built)
- "While you were away" needs to track last-visit timestamp per user (new Firestore field)
- Risk of becoming too clever -- if the summary is wrong, it erodes trust faster than no summary
- Morning brief competes visually with "Up Next" event card -- need clear hierarchy

---

### 2. Priority Stack (Urgency Triage)

**Problem:** All home sections have equal visual weight. A direct mention buried in "Recent Activity" gets the same treatment as "Sarah joined Design Club."

**Shape:** Replace the flat activity list with a priority-ranked stack. Three tiers with distinct visual treatment:

- **Now** (gold left-border, elevated card): Events starting within 2 hours, live events. "Design Club meeting starts in 30 minutes -- 12 going." Action button: "Join."
- **For You** (white left-border, standard card): Direct mentions, messages in spaces you lead, RSVP'd events tomorrow. "3 unread in CS 370 -- Alex asked about the homework." Action: "Reply."
- **Around You** (no border, compact row): General activity -- new members, tool deployments, space suggestions. "7 people joined Startup Hub this week." Action: "View."

Server-side scoring: `isLive * 10 + mentionsUser * 8 + isLeader * 5 + isRSVP * 3 + recencyDecay`. Configurable weights via feature flag for A/B testing.

**Wedge:** Students with 5+ spaces currently scan the entire page trying to find what matters. Priority Stack puts the answer at the top. This is the difference between "what's new" and "what needs me."

**Impact:** Very high. Directly drives Weekly Active Spaces by routing students to the space that needs them most.

**Effort:** Medium. Requires `relevanceScore` field in activity API, new visual tiers in UI, server-side scoring logic.

**Tradeoffs:**
- Scoring that feels wrong is worse than no scoring at all. Bad ranking = "this app doesn't get me"
- Students who lead many spaces could see only "leader" items, missing casual content
- Requires mentions system to be wired (currently not implemented -- no `@mention` detection in chat)
- Need fallback for zero-urgency state: if nothing is urgent, the stack should feel calm, not empty

---

### 3. "What Did I Miss" Mode

**Problem:** A student returns after 3 days and sees the same page as someone who left 10 minutes ago. No catch-up, no summary. FOMO anxiety unresolved.

**Shape:** When `lastVisit > 8 hours ago`, home opens with a catch-up overlay:

```
While you were away (3 days)
--
CS 370: 24 messages, 2 events
Design Club: 8 messages, 1 new member
Startup Hub: quiet

[Catch up on CS 370]    [Mark all read]    [Skip]
```

"Catch up" navigates to the space with the highest unread count, scrolled to the "since you left" divider (which already exists in space chat). "Mark all read" clears all badges and shows the normal home. "Skip" dismisses and shows standard home.

After catch-up, the overlay never shows again until the next 8+ hour gap.

**Wedge:** This directly addresses the number one reason students stop using community apps -- the guilt of falling behind. By giving an explicit "catch up" action, HIVE says "we tracked what you missed so you don't have to." This is the anti-feed: not infinite scroll, but a finite summary you can clear.

**Impact:** Very high for retention. The "I'll check it later" → "it's been too long" → "I'll never catch up" death spiral is the #1 killer of community apps.

**Effort:** Medium. Needs `lastVisitedAt` timestamp (Firestore user field), catch-up summary API (aggregate unreads since timestamp), overlay component. Space chat "since you left" divider already exists.

**Tradeoffs:**
- Overlay on app open is interruptive. If it shows too often (8-hour threshold too low?), it becomes annoying
- "Mark all read" is destructive -- student might want to read those messages later
- Summary quality depends on having real unread counts (currently hardcoded to 0)
- The "3 days" absence display could make students feel guilty rather than informed -- tone matters

---

### 4. Space Pulse Cards (Replace Static Grid)

**Problem:** "Your Spaces" is a static 2-column grid with identical card sizes. A space with 50 unread messages looks the same as a dead space you joined but never visit.

**Shape:** Replace the uniform grid with pulse cards that breathe based on activity:

- **Hot space** (gold accent glow, slightly larger): 5+ unreads, people online now. Shows message preview: `"Alex: anyone free to study tonight?"` Tap goes directly to latest unread.
- **Active space** (standard card, green online dot): Some recent activity, 1-4 unreads. Shows last activity time.
- **Quiet space** (dimmed, compact): No unreads, no one online. Shows member count only. Collapses to single row if 3+ quiet spaces.

Pinned spaces (heart icon, stored in user preferences) always appear first regardless of activity.

**Wedge:** The space grid is the core of home. Making it responsive to activity means the grid itself becomes a heat map -- students can see at a glance where the action is. This pushes them into active spaces faster.

**Impact:** High. Directly increases space visit rate by making active spaces visually dominant.

**Effort:** Low-Medium. Space data already includes unread counts and online counts. New card variants, optional last-message-preview API field, pin storage in user document.

**Tradeoffs:**
- Quiet spaces being dimmed could discourage leaders of small spaces -- "my space looks dead"
- Last message preview requires an additional Firestore read per space with unreads
- Pinning is a new user preference to store and sync
- If most spaces are quiet, the grid looks anemic -- need a "your spaces are sleeping" empty state, not just dim cards

---

### 5. Time-Aware Section Reordering

**Problem:** Home always shows sections in the same order. But morning priorities are different from evening priorities.

**Shape:** Adaptive section ordering based on time of day and user state:

**Morning (6am-12pm):**
1. Morning Brief ("Today: 2 events, 8 unreads")
2. Today's Events (schedule view, not just "Up Next")
3. Your Spaces (with pulse cards)
4. Overnight Activity (what happened while you slept)

**Afternoon (12pm-6pm):**
1. Happening Now (who's online, what's active)
2. Your Spaces (pulse cards)
3. Up Next (next event, if any)
4. Recent Activity

**Evening (6pm-12am):**
1. Happening Now
2. Your Spaces
3. Tomorrow Preview (tomorrow's first event, if any)
4. Recent Activity

**Late Night (12am-6am):**
1. Your Spaces (compact)
2. "Campus is quiet. Get some rest."

**Wedge:** Time-adaptive home means the app feels like it understands your day. It is not reorganizing for novelty -- it is prioritizing what is actionable. In the morning, your schedule matters. In the evening, social activity matters.

**Impact:** Medium-High. Subtle but compounds -- students who feel "the app gets me" return more frequently.

**Effort:** Medium. Time-branching logic in the page component, new "Tomorrow Preview" card, no new API calls needed.

**Tradeoffs:**
- Four time modes = four layouts to test and maintain
- Students in different timezones on the same campus -- use user's local time, not campus time
- Late night "get some rest" could feel patronizing. Alternative: just show compact spaces with no editorial
- Risk of disorientation -- "where did my events section go?" if order changes mid-session. Solution: only reorder on fresh page load, not while viewing

---

### 6. Action Items Strip

**Problem:** Home shows information but does not surface actionable tasks. A pending join request, an unanswered RSVP, a space invite -- these are buried in notifications.

**Shape:** Horizontal scrollable strip below the greeting header. Each item is a compact action card:

- `"RSVP to Hackathon Kickoff (tomorrow 2pm)"` -- [Going] [Not going]
- `"3 pending join requests in Design Club"` -- [Review]
- `"@Alex mentioned you in CS 370"` -- [Reply]
- `"Complete your profile (add bio)"` -- [Add bio]

Strip shows max 4 items. If more exist, shows count: "2 more actions." Completed items animate out with a satisfying collapse. When all items cleared: "You're on top of it" -- brief gold checkmark, then strip disappears.

**Wedge:** This is the "inbox zero for campus life" pattern. Students who clear their action strip feel accomplished. The strip trains the habit: open HIVE, clear actions, then explore. The clearing is the dopamine, not the scrolling.

**Impact:** High. Directly drives engagement by surfacing tasks that would otherwise be missed.

**Effort:** Medium. Requires aggregating actions from multiple sources (notifications, join requests, profile completion, RSVP status). New strip component. API endpoint to fetch pending actions.

**Tradeoffs:**
- Aggregation logic is complex -- pulling from 4+ data sources with different schemas
- If the strip is always empty, it feels useless. Need minimum 1 item (even if it is a suggestion like "explore a new space")
- If the strip is always full, it becomes overwhelming -- cap at 4 visible, prioritize by urgency
- "Complete your profile" nudge could feel nagging after the 5th time. Show profile nudges max 3 times, then stop

---

### 7. Campus Rhythm Awareness

**Problem:** HIVE does not know it is finals week. Or orientation week. Or spring break. The app treats every Tuesday the same.

**Shape:** Academic calendar stored per campus in Firestore:

```
periods: [
  { type: 'orientation', start: '2026-08-24', end: '2026-08-28', name: 'Welcome Week' },
  { type: 'classes', start: '2026-09-01', end: '2026-12-10' },
  { type: 'finals', start: '2026-12-14', end: '2026-12-20' },
  { type: 'break', start: '2026-12-21', end: '2027-01-18', name: 'Winter Break' }
]
```

Home adapts:

- **Orientation:** "Welcome to UB. 400+ spaces are waiting." Recommendations boosted, "meet people" content promoted.
- **Finals:** "Finals mode. Study groups forming." Study-related spaces promoted, social event notifications quieted.
- **Break:** "Campus is on break. See you Jan 19." Reduced notification frequency, "semester recap" summary.
- **First week back:** "Welcome back. 12 new events this week." Re-engagement prompts, "what's new in your spaces."

**Wedge:** No competitor does this. Discord does not know it is finals week. GroupMe does not know it is orientation. This is HIVE's campus-native advantage.

**Impact:** High for retention at critical inflection points. The beginning and end of semesters are when students churn. If HIVE adapts, students feel the app is part of their campus life, not just another app.

**Effort:** High. Requires admin UI for setting academic calendar per campus, period detection logic, conditional rendering across home sections, notification frequency adjustment.

**Tradeoffs:**
- Manual calendar entry is fragile -- one wrong date and the whole system is wrong
- "Finals mode" could feel presumptuous -- not every student is stressed during finals
- Break mode risks reducing engagement precisely when some students are on campus
- Multi-campus adds complexity -- each campus has different calendars

---

### 8. Smart Space Recommendations (Context-Aware)

**Problem:** Current suggestion is one space per day based on major/interest matching. Static and easy to ignore.

**Shape:** Context-aware recommendations that surface at the right moment:

- **After joining a space:** "People in Design Club also joined UX Research Lab (8 shared members)." Social proof + timing.
- **After attending an event:** "Liked the hackathon? Join Hacker Space for weekly builds." Action-linked.
- **Based on schedule gaps:** "You're free Tuesdays 2-4pm. CS Study Group meets then." Calendar-aware.
- **Based on friend graph:** "3 of your connections are in Startup Hub. Check it out." Network-driven.
- **Seasonal:** During orientation: show 5 recommendations, not 1. During finals: suppress recommendations entirely.

Recommendations appear inline in the activity feed, not as a separate section. Max 1 per session unless user explicitly browses.

**Wedge:** The difference between "here's a random space" and "people like you are in this space" is the difference between a suggestion and social proof. Context-aware recommendations feel like the app knows you.

**Impact:** Medium-High. Directly drives space joins, which drives Weekly Active Spaces.

**Effort:** Medium. Most scoring logic exists. New triggers (post-join, post-event, calendar overlap). New recommendation card component.

**Tradeoffs:**
- "People in X also joined Y" requires cross-membership queries (expensive at scale)
- Calendar-aware suggestions require either Google Calendar sync or class schedule data (neither exists)
- Over-recommendation leads to banner blindness. Must respect "not now" and stop after 3 dismissals
- Network-driven recommendations risk filter bubbles -- students only see spaces their friends are in

---

### 9. Micro-Digest Notifications

**Problem:** Notifications are either a full-page inbox or a popover bell. There is no middle ground -- no "here's what happened in the last 2 hours" without opening the notification center.

**Shape:** Small, unobtrusive digest card that appears on home when 3+ notifications have accumulated since last visit:

```
Since 2pm (3 hours ago)
  CS 370: Alex replied to your message
  Design Club: New event "Portfolio Review"
  Hacker Space: 12 new messages

[See all]    [Clear]
```

The digest card sits below the greeting header, above everything else. It collapses when tapped ("See all" goes to notification center, "Clear" marks all read). If fewer than 3 notifications, they appear individually in the action strip instead.

**Wedge:** This is the "glanceable catch-up" that sits between "check the bell icon" and "open the notification page." It answers "what happened?" without requiring navigation. For students who check HIVE every few hours, this is the primary notification surface.

**Impact:** Medium. Reduces notification anxiety by surfacing what matters without the full inbox experience.

**Effort:** Low. Notification data already exists via SSE stream. New card component, timestamp comparison against last visit.

**Tradeoffs:**
- If SSE is disconnected (common), the digest shows stale data. Need fallback to polling count
- "Clear" marks all as read -- destructive for students who want to act on some later
- Overlap with "What Did I Miss" mode (idea #3) -- need clear threshold: <8 hours = micro-digest, 8+ hours = full catch-up
- Digest on home competes with notification bell for attention -- students might ignore the bell entirely

---

### 10. Happening Now: Live Activity Pulse

**Problem:** "Happening Now" only shows online count. It disappears entirely when nobody is online. No prediction, no context, no action.

**Shape:** Transform "Happening Now" from a counter into a live activity pulse:

**When people are online:**
```
Happening Now
  12 students in 4 spaces
  CS 370: Alex, Jordan, and 3 others are chatting
  Design Club: Sarah shared a file
  [Jump into CS 370]
```

**When nobody is online:**
```
All Quiet
  Campus usually picks up around 3pm
  Your spaces were busiest yesterday at 7pm
  [Set a reminder for 3pm]
```

The "usually picks up" prediction is derived from 7-day activity patterns per campus -- aggregate message timestamps into hourly buckets, find the peak.

**When an event is live:**
```
Live Now
  Hackathon Kickoff -- 23 attending, started 10 min ago
  [Join event]
```

**Wedge:** The pulse makes HIVE feel alive. Even the "all quiet" state adds value -- it tells the student this is normal, not broken. The prediction ("picks up around 3pm") creates a reason to come back.

**Impact:** Medium. Increases the "liveness" perception of the app. The prediction drives return visits at peak times.

**Effort:** Medium. Online count exists. Activity pattern analysis requires a 7-day rolling aggregate (new cron job or Firestore aggregation). Live event integration requires cross-referencing events with current time.

**Tradeoffs:**
- Activity prediction requires enough historical data to be accurate. At launch with low usage, predictions will be noisy
- "Jump into CS 370" when only 3 people are chatting could feel like surveillance -- "they'll know I'm watching"
- Live event indicator competes with "Up Next" card. Need to merge: if event is live, "Up Next" transforms into "Live Now"
- The hourly aggregate cron job adds infrastructure cost. Alternative: compute on the fly from last 7 days of activity feed (more reads, less infrastructure)

---

### 11. Personal Streak & Campus Pulse

**Problem:** No sense of personal momentum. No reason to come back specifically *today* vs tomorrow.

**Shape:** Two small indicators in the greeting header:

**Personal streak:** "Active 5 days in a row" with a subtle counter. Streak breaks after 24 hours of no space interaction (not just opening the app -- must send a message, RSVP, or react). No gamification fanfare -- just a quiet counter that resets.

**Campus pulse:** "847 students online today" or "UB is buzzing -- 3 events happening now." Shows aggregate campus activity. Updated in real-time via presence data.

Together they answer: "Am I engaged?" and "Is campus engaged?" without building a leaderboard or competition system.

**Wedge:** The streak creates a micro-habit without feeling manipulative. It is not Duolingo's guilt trip -- it is a quiet acknowledgment. Combined with the campus pulse, it creates a sense of "I'm part of something alive."

**Impact:** Medium for retention. Streaks are proven habit-formers. Campus pulse drives FOMO in a healthy way.

**Effort:** Low. Streak is a counter in the user document (`currentStreak`, `lastActiveDate`). Campus pulse is the existing `activeTodayCount` presence data.

**Tradeoffs:**
- Streaks can feel manipulative. HIVE's brand is "not the metrics game." Keep it very subtle -- small text, no celebrations, no shame on break
- "Active" definition matters. If opening the app counts, the streak is meaningless. If only messages count, lurkers never streak
- Campus pulse number (847 students) could be embarrassingly low at launch. Solution: show "X students active today" only when X > 50, otherwise show "Your spaces are waking up"
- Streak data requires a daily check/update -- but this is a single field update, minimal cost

---

### 12. Quick-Nav Space Switcher

**Problem:** Going from home to a specific space requires finding it in the grid and tapping. For students in 8+ spaces, this is slow.

**Shape:** Horizontal scrollable row of space avatars at the very top of home (below header, above everything else). Tap to jump directly into the space. Unread badges overlay the avatars. Most-recent-activity spaces sort left. Long-press to pin/unpin.

```
[ CS370 ] [ Design ] [ Hack ] [ Startup ] [ Chess ] [ ... ]
   *3        *1                                       +2 more
```

This is the WhatsApp/Telegram pattern: recent conversations as a top-level affordance.

**Wedge:** Reduces time-to-space from ~3 seconds (scroll grid, find space, tap) to ~1 second (tap avatar). For daily users with 5+ spaces, this is the primary navigation.

**Impact:** Medium. Reduces friction for power users. Less impactful for students with 1-2 spaces.

**Effort:** Low. Space data already loaded. New horizontal scroll component with avatar circles and unread overlays.

**Tradeoffs:**
- Competes with "Your Spaces" grid below. If both exist, the page has redundant navigation. Solution: when switcher is visible, grid can collapse to show fewer spaces
- On mobile, horizontal scroll is less discoverable than a grid. Need visual cue (peek of next avatar, scroll indicator)
- Avatars without labels are hard to distinguish for similar-looking spaces. Show name on long-press or below avatar in small text
- For new users with 1-2 spaces, the switcher looks empty. Only show when user has 3+ spaces

---

### 13. Contextual Empty States

**Problem:** When nothing is happening, home feels dead. Current "Happening Now" just vanishes. Activity feed shows nothing. The page loses its purpose.

**Shape:** Every section gets a contextual empty state that guides action:

- **No unreads:** "You're caught up across all spaces." (emerald checkmark, calm)
- **No events:** "No events today. Browse upcoming events across campus." [Browse events]
- **No activity:** "Your spaces are quiet. Start a conversation." [Go to most active space]
- **All quiet + evening:** "Nothing tonight. Here's what's happening tomorrow." [Tomorrow preview]
- **Truly empty (0 spaces, 0 activity):** "Your HIVE is waiting. Find your first space." [Explore]

Each empty state has a single CTA that moves the student toward action. Never just "Nothing here."

**Wedge:** Empty states are the app's voice when there's nothing to show. A well-written empty state builds trust: "the app isn't broken, things are just calm." A bad empty state (or a missing one) creates doubt: "is this thing even working?"

**Impact:** Medium. Prevents bounce at low-activity moments. Most impactful during launch when activity is sparse.

**Effort:** Low. Component work only. No API changes.

**Tradeoffs:**
- Too many empty states visible at once (no events AND no activity AND no one online) makes the page feel desolate. Solution: consolidate into a single "All quiet" card when 2+ sections are empty
- CTAs in empty states compete with existing navigation. Keep actions minimal and specific
- "Start a conversation" is a high-friction ask for introverts. Alternative: "See what people are talking about" (lurk-first)

---

### 14. Home as Dashboard (Leader Mode)

**Problem:** Space leaders have no at-a-glance dashboard. To see how their space is doing, they navigate to the space, then to analytics, then to a page that currently has no chart rendering.

**Shape:** When a student leads 1+ spaces, home gets an optional "Your Spaces" section expansion:

```
Design Club -- Leader view
  24 members (+3 this week) | 47 messages today | Next event: Portfolio Review (Thu)
  3 pending join requests [Review]
  [Open space]   [Quick post]
```

This is not a full analytics dashboard. It is a leader health check: is my space alive? Do I need to do anything? Can I post something quickly without leaving home?

"Quick post" opens a compose modal that posts to the space's default board from home.

**Wedge:** Leaders are the multiplier. One engaged leader activates 50+ members. Making their daily check faster and more actionable means they engage more, which means their members engage more.

**Impact:** High for the leader persona. Indirectly high for member retention (active leaders = active spaces).

**Effort:** Medium. Join request count comes from existing API. Member growth requires a 7-day diff (new query). Quick post requires posting from outside the space context (new API parameter or reuse existing post endpoint with spaceId).

**Tradeoffs:**
- Leader mode adds complexity to home for the 5-10% of users who lead spaces. Non-leaders should never see this
- "Quick post" from home means composing without seeing the conversation context. Risk of off-topic posts
- Pending join requests already trigger notifications. Surfacing them on home may be redundant
- Member growth stats require historical data that may not exist yet. Need to start tracking weekly snapshots

---

### 15. Deep Link Landing

**Problem:** When someone shares a HIVE link (space, event, profile), the recipient who is already a user lands on that specific page. But they never see the home page context. They have no way to "orient" before diving in.

**Shape:** When a logged-in user taps a deep link, show a brief (2-second) interstitial at the bottom of the target page:

```
From Home: 3 unreads in CS 370 | Hackathon starts in 2h
[Go to Home]
```

This thin bar provides context without blocking the deep link destination. Auto-dismisses after 5 seconds. Tapping "Go to Home" navigates there.

For push notifications that deep link: the bar shows "You have X other notifications" with a link to notification center.

**Wedge:** Deep links are the primary way HIVE content spreads (texted URLs, shared events). But deep links bypass home entirely. The interstitial ensures students who arrive via deep link are still aware of their pending actions.

**Impact:** Low-Medium. Niche but prevents the "I only use HIVE when someone sends me a link" pattern.

**Effort:** Low. Persistent bottom bar component, conditional render based on referrer or navigation source.

**Tradeoffs:**
- Any interstitial on a deep link adds friction. 2 seconds is fine; 5 seconds is annoying
- If the bar shows "3 unreads" but the student is trying to RSVP to an event, it is a distraction
- Implementation requires detecting "this navigation came from outside the app" vs internal routing
- Could feel like an ad for the home page. Keep it minimal and auto-dismiss quickly

---

## Quick Wins (Ship in Days)

These require no new API endpoints, no new data models, no infrastructure changes.

1. **Contextual empty states for all home sections.** When "Happening Now" has zero online, show "All quiet right now" instead of disappearing. When activity feed is empty, show "Your spaces are calm" with CTA. Pure component work, ~2 hours.

2. **Time-grouped activity feed.** Group the 10 activity items into "Now" (last 30 min), "Today," "Yesterday," "This Week" with subtle divider labels. Client-side grouping from existing timestamp data. ~4 hours.

3. **Notification badge color fix.** TopBar badge is RED (#EF4444), should be GOLD (#FFD700) per brand tokens. One-line CSS change. Also add notification badge to BottomNav home icon (currently missing).

4. **Activity type visual differentiation.** Messages get semibold text + subtle gold accent. Events get purple-tinted icon background. Member joins get green dot. Tool deploys get blue. Same data, different rendering. ~3 hours.

5. **Quick-nav space switcher.** Horizontal avatar row above "Your Spaces." Most-recently-active sort. Unread badge overlay. Pure client component using existing space data. ~6 hours.

---

## Medium Bets (Ship in Weeks)

6. **Consolidated Home API.** Merge 3 parallel fetches into single `/api/home` endpoint. Returns spaces + events + activity + recommendations in one response. Cuts 6 Firestore round trips to 2-3. This unblocks most other home features. ~1 week.

7. **Priority Stack.** Replace equal-weight sections with urgency-ranked cards. Requires `relevanceScore` on activity items, server-side scoring, new card variants. Needs the consolidated API first. ~1-2 weeks.

8. **Morning Brief / Evening Recap.** Time-adaptive summary card. Needs `lastVisitedAt` user field and time-branching render logic. Needs consolidated API. ~1 week.

9. **Space Pulse Cards.** Activity-responsive space grid. Hot/active/quiet visual tiers with optional message preview. Needs message preview in API response (1 additional read per space with unreads). ~1 week.

10. **Action Items Strip.** Aggregated pending actions from notifications, join requests, RSVP opportunities, profile completion. New aggregation endpoint. ~1-2 weeks.

11. **Real-time home updates.** Extend SSE notification stream to include activity events. New items slide in from top with gold highlight, fade after 5 seconds. Or: Firebase `onSnapshot` listener on user's activity feed. ~1 week.

---

## Moonshots (Ship in Months+)

12. **Campus Rhythm Engine.** Academic calendar per campus, auto-adaptive home sections, notification frequency modulation, semester transitions with space archival prompts. Requires admin UI, calendar data model, period detection, conditional rendering. ~2-3 months.

13. **"What Did I Miss" Mode.** Full catch-up overlay for returning students. Summary generation, per-space unread aggregation, "since you left" navigation integration. Requires real unread counts (currently hardcoded to 0). ~1-2 months.

14. **Widget System.** Composable home dashboard where students choose which widgets to show: next event, calendar day, space quick-access, tool usage, personal stats. Drag-to-reorder. CSS Grid layout with named areas. Needs widget framework, preference persistence, 6+ widget components. ~3 months.

15. **AI Daily Briefing.** "Here's your day, Jordan" -- an LLM-generated natural language summary of schedule, unreads, campus events, and recommendations. Runs once per morning, cached. Requires Claude API integration, prompt engineering, caching layer. Risk of hallucination makes this a post-launch feature. ~2 months.

---

## Competitive Analysis

### Instagram Home

**What it does well:**
- Stories row at top = quick-nav to people (HIVE parallel: space avatar switcher)
- Algorithm that surfaces content you engage with (HIVE parallel: priority stack)
- Pull-to-refresh with haptic feedback
- "Caught up" checkmark after seeing recent posts

**What it does poorly for HIVE's use case:**
- Infinite scroll is the anti-pattern. No concept of "done"
- Content-first, not action-first. You consume, you don't do
- No concept of "your groups" as a primary navigation element
- Stories create social obligation to post, not to participate

**Lesson for HIVE:** Steal the stories row pattern (space avatars) but reject infinite scroll. Home should be clearable. "You're caught up" should be the goal state.

### Discord Home

**What it does well:**
- Server list in left rail = instant switching (HIVE parallel: space switcher)
- Unread indicators on server icons with mention counts
- "Active Now" friends sidebar
- Server-specific notification settings (mute, @mentions only)

**What it does poorly for HIVE's use case:**
- No aggregate home view -- you pick a server and live there
- No "what happened across all my servers" summary
- Discovery is terrible -- you need an invite link
- New user experience is empty and confusing

**Lesson for HIVE:** Discord proves that server-level unread badges work. But Discord has no cross-server intelligence. HIVE's home page IS the differentiator -- the layer Discord never built.

### Slack Home

**What it does well:**
- Sidebar with bold unread channels = instant visual scan
- "All Unreads" view that aggregates across channels
- "Threads" view that shows conversations you're in
- Search that actually works
- Scheduled messages and reminders

**What it does poorly for HIVE's use case:**
- Work-oriented, not community-oriented. No events, no RSVP, no social graph
- No time-awareness (does not know if it is morning or evening)
- No recommendations (does not suggest channels)
- Channels are flat lists -- no visual hierarchy by activity

**Lesson for HIVE:** Slack's "All Unreads" is the closest analog to HIVE's Priority Stack. The aggregation across spaces is the key insight. But Slack does not prioritize -- everything unread is equal. HIVE should rank.

### Notion Home

**What it does well:**
- Clean, minimal, customizable
- "Quick Note" always available
- Recent pages with smart ordering
- Templates for different workflows
- Calm aesthetic -- no notification noise

**What it does poorly for HIVE's use case:**
- Personal tool, not community tool. No presence, no real-time
- No social signals (who's online, what's active)
- No urgency signals (everything is equally important)
- No campus-awareness

**Lesson for HIVE:** Notion's calm aesthetic is aspirational. Home should feel like a well-organized desk, not a news feed. The "recent pages" pattern maps to "recent spaces" -- surface what you were working on, not what's trending.

### Linear Home

**What it does well:**
- "My Issues" = your personal inbox of actionable items
- Priority labels (Urgent, High, Medium, Low) with distinct colors
- Keyboard-first navigation (j/k, Enter, e to close)
- "Inbox" that shows only things assigned to you or mentioning you
- Clean separation of "my work" vs "team activity"

**What it does poorly for HIVE's use case:**
- Built for work teams, not communities. No social layer
- No events, no calendar integration
- No discovery -- you're already on a team
- No emotional warmth -- purely functional

**Lesson for HIVE:** Linear's priority system is the direct model for the Priority Stack. "My Issues" maps to "My Actions." The keyboard shortcuts map to power-user navigation. But Linear lacks warmth -- HIVE's greeting + campus pulse adds the human layer.

---

## Wedge Opportunities

### Wedge 1: "Open and Know" (Fastest to Value)

The single most impactful improvement to home is reducing time-to-understanding. A student should open HIVE and know what to do within 5 seconds.

**Implementation path:**
1. Consolidated Home API (unblocks everything)
2. Morning Brief card (answers "what should I do?")
3. Priority Stack (answers "what's urgent?")
4. Space Pulse Cards (answers "where should I go?")

This sequence transforms home from a static dashboard into a command center. Each step builds on the previous.

**Signal that this wedge is working:** Average session depth increases (students go deeper into spaces from home, not just glance and leave). Time-on-home decreases while space-visit-rate increases.

### Wedge 2: "Come Back Tomorrow" (Retention-First)

The second wedge focuses on giving students a reason to return. Not notification spam -- genuine value awaiting them.

**Implementation path:**
1. Personal streak (quiet motivation)
2. Campus Pulse (FOMO done right)
3. "What Did I Miss" mode (catch-up without guilt)
4. Campus Rhythm Engine (the app knows your semester)

This sequence builds the habit loop: return -> see streak -> catch up -> explore -> leave. Repeat.

**Signal that this wedge is working:** D7 and D30 retention rates increase. Students who miss a day return the next day rather than churning.

### Wedge 3: "Leader Multiplier" (Network Effects)

The third wedge focuses on leaders as the growth engine. Every feature that makes a leader's life easier results in a more active space, which results in more engaged members.

**Implementation path:**
1. Leader home dashboard (health check without navigating)
2. Quick post from home (reduce friction to zero)
3. Join request surface (act on requests before they expire)
4. Space analytics in-home (growth trends at a glance)

**Signal that this wedge is working:** Leader posting frequency increases. Time between join request and approval decreases. Leader churn decreases.

---

## Open Questions

1. **Should home have a URL state?** Currently `/home` is a single static URL. If we add time-modes and catch-up overlays, should the state be in the URL (`/home?mode=catchup`) or purely client-side? URL state makes it linkable but adds complexity.

2. **How aggressive should real-time updates be on home?** If 10 new activities arrive while a student is looking at home, should they all slide in live? Or should a "5 new items" banner appear, requiring a tap to reveal? Live updates can feel chaotic. Batched reveals feel more controlled.

3. **Should the Morning Brief be AI-generated?** A template-based brief ("You have 2 events and 8 unreads") is deterministic and cheap. An LLM-generated brief ("Busy day ahead -- your CS 301 lab is at 10 and Design Club has been buzzing about the portfolio review") is warmer but expensive, slower, and could hallucinate. Start with templates, graduate to AI after launch?

4. **What is the right "stale" threshold?** Currently, activity feed shows last 7 days. But if a student checks daily, 7 days of history is noise. If they check weekly, 7 days is perfect. Should the window adapt to visit frequency? Show activity since last visit, capped at 7 days?

5. **How does home scale to multi-campus?** If HIVE expands to 5 campuses, does home show only your campus? Or cross-campus activity for shared-interest spaces? The current architecture hardcodes `ub-buffalo` in Firestore rules. Multi-campus home requires rethinking campus isolation at the home layer.

6. **Should "Your Spaces" show all spaces or only active ones?** A student in 15 spaces but only active in 3 gets a cluttered grid. Options: show all with quiet dimming, show only active with "show all" expansion, or auto-archive spaces with zero activity in 30 days. Each has retention implications.

7. **Where does the calendar live relative to home?** Currently calendar is at `/me/calendar`, completely separate from home. Should "Today's Schedule" on home deep-link to calendar? Or should home absorb calendar into a "my day" view? The more home absorbs, the more it risks becoming bloated.

8. **What does home look like on day 1 for campus 1?** With 32,000 potential users but maybe 50 actual users in week 1, the "Happening Now" section will show "2 people online." The campus pulse will show "12 students active today." Does this build excitement or expose how early we are? Need minimum thresholds before showing aggregate stats.

9. **Should home be the default route or should spaces?** Currently `/home` is the post-login destination. But if a student is in one space and visits daily, maybe they should land directly in that space. Home is most valuable for multi-space students. Single-space students might prefer direct-to-space routing.

10. **How does home interact with push notifications?** If a student gets a push "Alex mentioned you in CS 370" and taps it, they go to that space. But when they finish reading, back-navigating brings them to home. Should home at that point show the catch-up experience, or the normal view? The navigation stack matters.
