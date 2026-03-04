# Feed: Product Strategy

**The surface that answers: "What's alive on my campus right now?"**

The feed is the front page of campus. It's where a student opens HIVE and sees everything that matters — events happening tonight, polls they can vote on, creations getting traction, spaces coming to life. It's not a funnel to somewhere else. It's a destination in its own right.

A student should be able to live in the feed and get full value from HIVE without ever joining a space. They RSVP to events, vote on polls, see what's alive on campus. The feed serves them directly.

Route: `/discover` (Home tab)

See `feed.md` for the existing technical spec. This document covers the strategic reframe.

---

## The Core Shift: From Events Calendar to Interactive Campus Feed

### What the feed is today
An events calendar. Four sections: Live Now (events happening), Today (upcoming events), Your Spaces (activity from joined spaces), Discover (space directory). Events are the primary content. Creations are invisible.

### What the feed needs to become
An **interactive campus feed** where events and creations are peers — both demanding action, both showing campus life. The student opens the feed and sees:
- An event tonight with 12 people going — they can RSVP right now
- A poll with 47 votes they can vote on in one tap
- A bracket matchup they have strong opinions about
- A new space that just got active

Events and creations serve different but equally important roles:
- **Events** drive real-world action. A student leaves their dorm because of an event. "Chess Night tonight, 12 going" is a reason to go somewhere.
- **Creations** drive digital engagement and connection. "Best dining hall?" with 47 votes creates campus conversation. Both are interactive. Both are first-class.

The unifying principle: **every feed item demands an action, not just awareness.** You don't just see that something exists — you vote, RSVP, rank, or join. The feed is a participation surface, not a reading surface.

### Why this matters
Two reasons the feed needs creations alongside events:
- AI generates a poll in UB Chess Club → nobody sees it → no engagement → the model fails
- A member creates a bracket in a space → only existing space members see it → no growth

With creations in the feed:
- AI generates "Best dining hall?" → appears in feed → 50 students vote → 15 join the space
- A member creates a bracket → appears in feed → students who never heard of the space engage

**The feed is how leaderless spaces come to life.**

---

## Role in the System

```
                    ┌──── Feed (the front page) ────┐
                    │                                │
Events ────────────→│   Events: real-world action    │
                    │   Creations: digital engagement │
Creations ─────────→│   Spaces: community discovery  │
  (human + AI)      │                                │
                    └────────────────────────────────┘
                              ↕           ↕
                          Spaces       Build
                       (go deeper)   (create own)
```

The feed is its own surface — the campus front page. It pulls in events (from CampusLabs + user-created), creations (from spaces, human + AI), and spaces (for discovery). A student can get full value from the feed alone.

The feed also connects to other surfaces:
- **Feed → Space:** A student engages with a creation and discovers its source space
- **Feed → Build:** A student sees "47 votes" on someone's poll and thinks "I could make one"
- **Feed → Profile:** A student taps a creator's name and sees their work

But these are optional paths, not the feed's purpose. The feed's purpose is: **show a student what's alive on their campus and give them something to do right now.**

---

## Feed Content: What Appears

### The Mix

The feed shows three types of content, ranked by engagement potential:

| Content Type | Source | Action | Why it matters |
|---|---|---|---|
| **Creations** | Spaces (AI + human) | Vote, rank, RSVP, respond | The differentiator. No other campus app has this. |
| **Events** | CampusLabs + user-created | RSVP Going/Maybe | Proven engagement. Real campus activity. |
| **Spaces** | Pre-seeded + user-created | Join | Growth engine. How spaces gain members. |

### Events and Creations are Peers

Events and creations serve different jobs. Neither is secondary.

**Events** answer "what should I go to?" — they drive physical action. A student sees an event, RSVPs, shows up. This is irreplaceable value. No campus app works without events.

**Creations** answer "what can I participate in right now?" — they drive digital engagement. A student votes on a poll from their dorm at 11pm. This is new value that didn't exist before HIVE.

The feed interleaves both. The ranking principle isn't "creations above events" — it's **"what's most alive right now?"** A live event with 12 people attending ranks above a stale poll. A trending poll with 47 votes ranks above tomorrow's info session. Recency + engagement velocity determines position, regardless of content type.

---

## Feed Sections (Revised)

The feed remains sectioned (not infinite scroll), but the sections shift to reflect creation-first thinking.

### Section Order

| # | Section | What it shows | Visible when |
|---|---------|--------------|-------------|
| 1 | **Campus Header** | "UB · 650 orgs · 12 events today" | Always |
| 2 | **Live Now** | Events happening right now or starting within the hour | Any live/imminent events |
| 3 | **Happening Today** | Today's upcoming events + trending creations, interleaved by engagement | Any today events OR any trending creations |
| 4 | **Your Spaces** | Activity from spaces you've joined (events, creations, messages) | User has joined 1+ space |
| 5 | **New on Campus** | Recently created apps/creations, newest first | Any creations exist |
| 6 | **This Week** | Events coming up this week | Today section has < 3 items |
| 7 | **Discover** | Spaces to join, sorted by trending | Always (650+ pre-seeded) |

### What changed

- **Happening Today (merged)** — Events and trending creations live together in one section, interleaved by what's most alive. A poll with 47 votes in the last 2 hours sits alongside tonight's event with 12 RSVPs. This eliminates the artificial separation between events and creations. At the section level, they're peers.
- **New on Campus (new)** — Recently created creations, chronological. Shows what's fresh. Both AI and human creations. Labeled "Created by HIVE" or "Created by [Name]." This is the "what can I participate in?" discovery section.
- **Live Now stays** — Events happening now are time-critical. Top billing.
- **Your Spaces stays** — Shows what your communities are up to. Events, creations, and messages from spaces you've joined.
- **Discover stays** — Always the floor. 650+ spaces means this is never empty.

### Section Visibility Rules

- Empty sections return `null` (disappear silently, no empty state text)
- "This Week" supplements Today only when Today has < 3 items
- The feed is never fully empty — Discover section is the floor
- On return visits, time-based sections naturally show different content

---

## The Creation Card (The Key New Component)

This is the most important new card type. It's what makes the feed different from every other campus app.

### What it shows

```
┌─────────────────────────────────────────┐
│                                          │
│  Best dining hall at UB?                 │
│  Created by HIVE · UB Dining · 47 votes │
│                                          │
│  ○ Sizzles          ████████░░  (21)     │
│  ○ Crossroads       █████░░░░░  (14)     │
│  ○ Hubies           ███░░░░░░░  (8)      │
│  ○ C3               ██░░░░░░░░  (4)      │
│                                          │
│  [Vote]                    [See space →] │
│                                          │
└─────────────────────────────────────────┘
```

### Key design decisions

1. **Inline engagement.** You vote ON the card without navigating anywhere. The feed is the interaction surface. This is critical — if you have to tap into a creation to vote, you lose 80% of potential voters.

2. **Attribution.** "Created by HIVE" for AI creations. "Created by [Name]" for human creations. Always shows the source space: "UB Dining" is tappable and goes to the space page.

3. **Engagement count.** "47 votes" is social proof. It tells you this is worth your time. It also triggers the "I could do that" moment.

4. **Space link.** "See space →" is the membership pipeline. Vote → curious about what else is in this space → tap → join. This is how feed engagement converts to space membership.

5. **Type-specific rendering.** Different creation types render differently inline:
   - **Poll:** Options with vote bars + vote button
   - **Bracket:** Current matchup with "pick a side" buttons
   - **RSVP:** Event details with Going/Maybe buttons
   - **Ranker:** Top 3 ranked items with "Add your ranking" button
   - **Quiz:** Question preview with "Take quiz" button
   - **Custom (code gen):** Preview image + title + "Try it" button (can't inline custom apps)

### After engagement

After you vote/respond, the card updates:
- Your selection highlighted
- Results visible (for polls: vote distribution)
- "47 → 48 votes" counter increments
- Brief "Join [Space]?" prompt appears below the card if you're not a member

This post-engagement join prompt is the feed-to-space conversion mechanism.

---

## Inline Engagement: The Feed is Interactive

The feed is not a list of links. It's a participation surface.

### What you can do without leaving the feed

| Content | Inline action | What happens |
|---------|--------------|-------------|
| Poll creation | Vote on an option | See results, vote count increments |
| Bracket creation | Pick a matchup winner | Next matchup loads or results shown |
| RSVP creation | Tap Going/Maybe | RSVP count increments, confirmation shown |
| Event | Tap Going/Maybe | RSVP registered, social proof updates |
| Space | Tap Join | Space disappears from Discover, appears in Your Spaces |
| Ranker | Tap "Rank these" | Expands inline or navigates to full view |
| Quiz/Custom | Tap "Try it" | Navigates to `/t/[toolId]` (can't inline complex experiences) |

### Why inline matters

At launch density (50 users), every interaction counts. If a student has to navigate to a separate page to vote on a poll, most won't. If they can vote with one tap in the feed, most will. The difference between a 10% interaction rate and a 40% interaction rate is the difference between the product feeling alive and feeling dead.

**Design rule: if the interaction takes less than 5 seconds, it happens in the feed.**

---

## Feed-to-Space Pipeline

The feed's job isn't just engagement — it's conversion. Every feed interaction is a potential space membership.

### The funnel

```
See creation in feed (impression)
        ↓
Engage with creation (vote, RSVP, etc.)
        ↓
See post-engagement prompt: "Join [Space]?"
        ↓
Join space
        ↓
See more creations in space → create own
```

### Post-engagement join prompt

After a non-member engages with a creation from a space:

```
┌─────────────────────────────────────────┐
│  You voted in UB Dining's poll          │
│  47 others voted · 12 members           │
│                                         │
│  [Join UB Dining]        [Not now]      │
└─────────────────────────────────────────┘
```

This prompt appears once per space per session. Dismissing "Not now" removes it until next session. Not intrusive — it's a nudge, not a gate.

### Space attribution on every creation

Every creation card in the feed shows its source space. The space name is always tappable. This ensures that even if the student doesn't join from the prompt, they know the space exists and can find it later.

For AI creations: "Created by HIVE · from UB Chess Club"
For human creations: "Created by Maya · UB Engineering"

---

## Ranking: How Content Surfaces

### Creation ranking (new)

Two modes:

**Trending (engagement velocity):**
```
trendingScore = engagementCount / hoursSinceCreation
```
A poll with 30 votes in 2 hours scores higher than one with 50 votes in 3 days. This surfaces "what's hot right now" — the TikTok energy.

**New on Campus (recency):**
Simple `createdAt desc`. Shows what's fresh. Both AI and human creations.

### Boost signals

| Signal | Boost | Why |
|--------|-------|-----|
| Human creation | +high | Human creations are more interesting than AI |
| From a space the user is in | +medium | Relevance |
| From a space with mutual friends | +medium | Social proof |
| High engagement rate (engagements / impressions) | +medium | Quality signal |
| AI creation with low engagement | -medium | Don't surface stale AI content |

### Events ranking (existing, no change)

Events rank by time proximity (soonest first). The existing relevance scoring (interest match, friends attending, space membership, popularity) works well and stays.

### Spaces ranking (existing, enhanced)

Trending sort currently uses memberCount as proxy. Enhance with:
- Has active creation with engagement in last 48h → big boost
- Has event in next 48h → medium boost
- Recently claimed → small boost (shows human activity)

---

## AI Creations in the Feed

AI-generated creations from leaderless spaces appear in the feed like any other creation, with two differences:

### Labeling
"Created by HIVE" — not a fake persona. Clear, honest attribution. Students should know when they're engaging with AI-generated content.

### Rotation
AI creations that go stale (< 5 new engagements in 48 hours) get deprioritized and eventually replaced by new AI creations. The feed should never show the same AI poll sitting there with the same vote count for a week. Freshness matters.

### Human takeover
When a human creates something in a space that previously only had AI content, the human creation gets priority in the feed. The space's representation in the feed shifts from "AI-generated poll" to "Maya's bracket tournament." This signals to other students: real people are here.

### Volume control
Not every AI creation should hit the feed. At launch with 650+ spaces, that could mean hundreds of AI creations flooding the feed. Controls:
- Max 3-5 AI creations visible in the Trending section at any time
- Max 5-10 AI creations visible in New on Campus at any time
- AI creations rotate — when one gets stale, a fresh one replaces it
- Human creations always take slots over AI creations

---

## Cold Start Strategy (Updated)

### Day 1: Events + AI Creations + Spaces

The feed is never empty because:

1. **Live Now / Today** — CampusLabs events are the reliable heartbeat. UB has 5-15 events daily.
2. **Trending** — AI-generated creations from top spaces (biggest orgs, most recognized names). 3-5 polls/brackets with "Be first to vote" energy.
3. **New on Campus** — Freshly generated AI creations. New ones appearing throughout the day.
4. **Discover** — 650+ spaces. Always full.

### Week 1: Human Creations Start Appearing

As early adopters create, their creations appear in the feed alongside AI content. Human creations get a natural boost. The feed transitions from "AI-populated campus" to "student-created campus."

### Month 1: AI Steps Back

If adoption hits targets (50 weekly active creators), human creations dominate the feed. AI creations only appear for spaces that still have no human activity. The feed feels organic.

### The Risk

If AI creations feel low-quality or repetitive, students will learn to ignore them. The AI generation quality bar is critical. Better to show 5 excellent AI creations than 50 mediocre ones.

---

## Connective Tissue

### Feed → Space
- Every creation card has a tappable space name → `/s/[handle]`
- Post-engagement join prompt → space join
- Every event card links to its source space via the EventDetailDrawer
- Discover section cards link to space pages

### Feed → Build
- "New on Campus" section footer: "Make your own →" → `/build`
- Post-engagement: "Make something like this →" → `/build?remix=[toolId]`
- The "I could do that" moment: seeing a creation with high engagement triggers creation intent

### Feed → Profile
- Creator name on human creations is tappable → `/u/[handle]`
- This closes the loop: see a creation → check the creator → see their other creations → follow or create your own

### Feed → Standalone
- Creation cards can also be shared as standalone URLs → `/t/[toolId]`
- "Share" action on creation cards generates the standalone link
- This is how HIVE content escapes the app and reaches non-users

---

## The Member Experience

### First open (never used HIVE)

```
┌─────────────────────────────────────────┐
│ UB · 650 orgs · 8 events today          │
│─────────────────────────────────────────│
│                                          │
│ LIVE NOW                                 │
│ ┌──────────┐ ┌──────────┐               │
│ │ LIVE     │ │ In 45m   │               │
│ │ Career   │ │ Chess    │ ──→           │
│ │ Fair     │ │ Night    │               │
│ └──────────┘ └──────────┘               │
│                                          │
│ TRENDING                                 │
│ ┌─────────────────────────────────────┐  │
│ │ Best dining hall at UB?             │  │
│ │ Created by HIVE · UB Dining        │  │
│ │ 47 votes                           │  │
│ │ ○ Sizzles (21) ○ Crossroads (14)   │  │
│ │ [Vote]                [See space →] │  │
│ └─────────────────────────────────────┘  │
│ ┌─────────────────────────────────────┐  │
│ │ Rate UB bathrooms                   │  │
│ │ Created by HIVE · UB Campus        │  │
│ │ 31 rankings                        │  │
│ │ [Rank these]          [See space →] │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ TODAY                                    │
│ ┌─────────────────────────────────────┐  │
│ │ Study Abroad Info Session  3:00 PM  │  │
│ │ UB Global · Clemens Hall           │  │
│ │ 8 going          [Going] [Maybe]   │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ DISCOVER SPACES                          │
│ ┌────────────┐ ┌────────────┐           │
│ │ UB Chess   │ │ Dance      │           │
│ │ 34 members │ │ Marathon   │           │
│ │ [Join]     │ │ 89 members │           │
│ │            │ │ [Join]     │           │
│ └────────────┘ └────────────┘           │
└─────────────────────────────────────────┘
```

The student sees: live events, interactive creations they can vote on, today's events, spaces to join. Every section has a next action.

### Return visit (joined 3 spaces, voted on 2 polls)

```
┌─────────────────────────────────────────┐
│ UB · 650 orgs · 5 events today          │
│─────────────────────────────────────────│
│                                          │
│ TRENDING                                 │
│ ┌─────────────────────────────────────┐  │
│ │ Best study spot? (NEW)              │  │
│ │ Created by Alex · UB Engineering    │  │
│ │ 23 votes                           │  │
│ │ [Vote]                [See space →] │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ YOUR SPACES                              │
│ │ UB Chess: New poll — "Best opening?" │  │
│ │ Dance Marathon: Event Saturday       │  │
│ │ UB Dining: 12 new votes on your poll │  │
│                                          │
│ TODAY                                    │
│ ...                                      │
│                                          │
│ NEW ON CAMPUS                            │
│ ┌─────────────────────────────────────┐  │
│ │ March Madness Bracket               │  │
│ │ Created by HIVE · UB Sports        │  │
│ │ 0 picks yet · Be first             │  │
│ │ [Pick matchups]       [See space →] │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ DISCOVER SPACES                          │
│ ...                                      │
└─────────────────────────────────────────┘
```

Different from first visit: Your Spaces section appears, new creations in Trending, human-created content mixed with AI. The feed proves the campus is alive and evolving.

---

## What Changes from Current Implementation

| Area | Current | New |
|------|---------|-----|
| **Feed identity** | Distribution layer for spaces | Its own surface — the campus front page |
| **Primary content** | Events only | Events + Creations as peers |
| **Creation visibility** | Not in feed at all | Interleaved with events in Happening Today + New on Campus |
| **Inline interaction** | RSVP only | Vote, rank, RSVP, bracket picks — all inline |
| **AI content** | None | AI-generated creations from leaderless spaces |
| **Feed purpose** | "What events are today?" | "What's alive on my campus?" |
| **Standalone value** | Must join spaces for real value | Full value from feed alone — vote, RSVP, discover |
| **Creator attribution** | N/A | "Created by [Name/HIVE]" on every creation |
| **Post-engagement** | Nothing | Subtle "Join [Space]?" prompt (optional, not a gate) |

---

## Key Metrics

| Metric | What it measures | Target |
|--------|-----------------|--------|
| **Feed engagement rate** | % of feed views with at least one interaction (vote, RSVP, join) | >50% |
| **Creation interaction rate** | % of creation card impressions → engagement | >25% |
| **Feed-to-space join rate** | % of creation engagements → space join | >15% |
| **Feed-to-create rate** | % of feed users who create something within 7 days | >5% |
| **Return rate** | % of feed users who come back within 48 hours | >40% |
| **AI vs human content ratio** | Human creations as % of total feed content | >30% by week 2 |
| **Time to first interaction** | Seconds from feed load to first vote/RSVP/join | <30s |
| **Feed freshness** | % of Trending items that are < 24 hours old | >80% |

---

## What We Are NOT Building

| Feature | Why not |
|---------|---------|
| Infinite scroll | Sectioned feed with natural stopping points. Prevents doom-scrolling. Explicit "show more." |
| ML-based personalization | Interest match + space membership + time proximity is enough at 50 users. ML needs scale. |
| "For You" algorithmic section | Too risky at low density. The model has nothing to learn from. |
| Social graph feed ("friends are doing X") | Social graph is too thin at launch. Friends-attending signals exist in events but aren't a section. |
| Content moderation on feed level | Moderation happens at the space/creation level. Feed just distributes what's approved. |
| Cross-campus content | Single campus (UB) only. |
| Ads or promoted content | Everything organic. |
| Text posts in feed | The feed shows interactive experiences, not text updates. Text lives in space chat. |

---

## Perspective Signals

### Lonely Freshman
**Test:** They open the feed on their second day at UB. Do they find something to do?
**What works:** A poll they can vote on in 2 seconds. An event tonight they can RSVP to. A space for their major they can join. Three actions, zero social cost.
**What breaks:** If every creation is from spaces they don't relate to. The relevance signals (major, interests from onboarding) need to surface the right content.

### Overwhelmed Org Leader
**Test:** They created a poll in their space. Does it appear in the feed? Can they see it getting engagement?
**What works:** Their creation in the Trending section with "23 votes" growing in real-time. Proof that HIVE distributes their content campus-wide. This is the moment they realize HIVE > GroupMe.
**What breaks:** If their creation is buried below 10 AI creations. Human creations must rank above AI. The leader needs to feel that creating on HIVE gives them reach they can't get elsewhere.

### Returning Skeptic
**Test:** They saw the feed yesterday. Today, is it different?
**What works:** Time-based events naturally change. New creations in Trending. Different spaces in Discover (cursor pagination). Their joined spaces showing activity. The feed is never the same twice.
**What breaks:** If the same AI polls are sitting there with the same vote counts. Staleness kills. AI rotation is critical.

### Commuter Student
**Test:** They're on the bus, 20 minutes before class. Anything worth doing?
**What works:** Vote on a poll in 3 seconds. See what's happening after class. Everything is one-tap. The feed respects their time.
**What breaks:** If the feed is all events that already happened or are tomorrow. Time-proximity boosting in ranking helps — show them what's relevant NOW.

### Thursday Night Sophomore
**Test:** It's 10pm Thursday. They open HIVE instead of texting the group chat.
**What works:** "What's happening tonight?" in Live Now. A trending bracket they have strong opinions about. Social proof — "47 people voted on this." FOMO without pressure.
**What breaks:** If the feed at 10pm shows tomorrow's career fair and nothing else. Nightlife/social content needs to surface. This is where human-created content matters most — AI won't capture the Thursday night energy.
