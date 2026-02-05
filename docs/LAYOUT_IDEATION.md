# HIVE Layout Ideation
**Last Updated:** 2026-02-03

> Making every surface feel occupied, temporal, and alive.

---

## Diagnosis: Why HIVE Feels Static

Seven systems analyzed. One consistent finding: **HIVE has polished micro-interactions but no macro-life.** Cards hover. Modals spring. Buttons scale. But the platform itself doesn't breathe.

### The Static Stack

| Layer | Current State | Result |
|-------|--------------|--------|
| **Shell** | AppShell renders, UniversalShell built but unwired | No floating sidebar, no Cmd+K, no page-level context |
| **Templates** | Focus, Grid, Stream, Workspace — all built, none integrated | Every page hand-rolls its own layout |
| **Page transitions** | None. Hard swap on route change | Feels like clicking between static documents |
| **Real-time** | Only Space chat has live updates | Home, Explore, Profile, Lab all load-once-then-freeze |
| **Temporal awareness** | Greeting changes by hour. Nothing else | Same feed at 9am and midnight |
| **Social proof** | Online count exists as a number | No avatars, no "friends here", no "trending now" |
| **Streaks/milestones** | Data fetched, never rendered | No "7-day streak", no contribution graph |

### The Two HMVEs

HIVE currently has two motion tiers that don't meet in the middle:

**Entry flow** — Flawless. Every pixel animates. Blur transitions, gold glows, premium easing. 8.5/10 ceremony.

**Everything else** — Cards hover. Content fades in on mount. Then... nothing. The page is a photograph.

The gap between "entering HIVE" and "using HIVE" is the core design debt.

---

## Cross-System Layout Proposals

### 1. Shell Transition: AppShell → UniversalShell

**Current:** AppShell is a route-based wrapper. 260px fixed sidebar on desktop. Bottom nav on mobile. No collapse, no float, no context bar.

**Built but unwired:** UniversalShell with floating 220px sidebar (collapses to 64px), TopBar with breadcrumbs, spring animations on width change, Cmd+K CommandPalette.

**Proposal:**

Wire UniversalShell as the production shell. This unlocks:

- **Collapsible sidebar** — More canvas for content pages. Collapsed = 64px icon rail. Expanded = 220px with labels. Spring transition (SNAP preset).
- **TopBar with page context** — Shows current page title, breadcrumbs on deep routes (`/s/design-club/tools/poll`), search shortcut hint.
- **Cmd+K everywhere** — CommandPalette already has frosted glass, grouped items, keyboard nav. Wire it to: navigate pages, search spaces/people, quick-create (new tool, new event), recent items.
- **Floating sidebar** — Sidebar floats over content rather than pushing it. Content area stays full-width underneath. Sidebar has glass backdrop blur.

**Page-aware sidebar content:**

| Route | Sidebar Shows |
|-------|--------------|
| `/home` | Your spaces (with energy dots), upcoming events, online friends |
| `/explore` | Search filters, trending categories, recent searches |
| `/s/[handle]` | Boards list, tools, members preview, space actions |
| `/lab` | Your tools, recent templates, quick start |
| `/lab/[toolId]` | Element palette (collapsed rail becomes icon-only palette) |
| `/u/[handle]` | Profile nav (if own), mutual spaces (if other's) |

---

### 2. Home: From Daily Briefing to Live Dashboard

**Current layout:** Single column, `max-w-2xl`, 6 stacked sections. Load once. Static forever.

**Problems:**
- `streakInfo` fetched but never rendered
- No polling, no WebSocket subscription
- "Happening Now" disappears entirely if no one is online (instead of showing campus state)
- Sections hide silently when empty — user gets a blank column
- Same content at 9am and 2am

**Proposed layout:**

```
┌──────────────────────────────────────────────┐
│  Greeting + Campus Pulse (ambient bar)       │
│  "Good evening, Laney · 47 people active"    │
├──────────────────────┬───────────────────────┤
│                      │                       │
│  STREAM COLUMN       │  CONTEXT COLUMN       │
│  (primary, flex-1)   │  (secondary, 280px)   │
│                      │                       │
│  ┌──────────────┐    │  ┌─────────────────┐  │
│  │ Up Next      │    │  │ Your Spaces     │  │
│  │ (countdown)  │    │  │ (energy dots)   │  │
│  └──────────────┘    │  │ (online counts) │  │
│                      │  └─────────────────┘  │
│  ┌──────────────┐    │                       │
│  │ Activity     │    │  ┌─────────────────┐  │
│  │ Feed         │    │  │ Streaks &       │  │
│  │ (live)       │    │  │ Milestones      │  │
│  └──────────────┘    │  └─────────────────┘  │
│                      │                       │
│  ┌──────────────┐    │  ┌─────────────────┐  │
│  │ Suggested    │    │  │ People Online   │  │
│  │ (rotates)    │    │  │ (avatar stack)  │  │
│  └──────────────┘    │  └─────────────────┘  │
│                      │                       │
└──────────────────────┴───────────────────────┘
         Mobile: stacks to single column
```

**Life systems:**

- **Campus Pulse bar** — Replaces greeting-only header. Shows: time-of-day greeting, total active users across campus (polls every 60s), ambient color shift (warm gold at night, cool neutral in morning).
- **Up Next with countdown** — Events within 2 hours show live countdown timer (`CountdownTimer` primitive already exists). Events starting now get LIVE badge with gold pulse. Multiple events shown, not just one.
- **Activity feed with polling** — Poll `/api/activity-feed` every 30s. New items slide in from top with `revealVariants`. "X new" badge when scrolled down.
- **Streaks rendered** — `streakInfo` from dashboard API finally displayed. Flame icon, day count, "Personal best: 12 days" subtext. Streak break = muted state with "Start a new one" prompt.
- **People Online** — Avatar stack of friends currently active. Gold ring on avatars. Click to see which space they're in.

**Template integration:** Use `Stream` template (mode: `sectioned`) for the primary column. Use sidebar slot for context column.

---

### 3. Explore: From Directory to Discovery Surface

**Current:** Vertical scroll with 4 curated sections. "Popular" = sorted by member count (all-time). No social signals. Same feed all day.

**Problems:**
- "Popular This Week" doesn't actually track weekly activity
- "For You" matches interests against space *names* — fragile
- No "friends joined X" signal
- Ghost spaces (unclaimed) are visually muted when they should create FOMO
- No cross-content signals (spaces don't show event count, people don't show space count)

**Proposed layout:**

```
┌──────────────────────────────────────────────┐
│  Search bar (sticky, with scope indicator)    │
├──────────────────────────────────────────────┤
│                                              │
│  HAPPENING NOW (horizontal scroll)           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │Live│ │Live│ │ 3h │ │ 5h │  ← events     │
│  │Mtg │ │Wrk │ │Away│ │Away│    with time   │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
│  FOR YOU (grid, personalized)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Space    │ │ Space    │ │ Ghost    │    │
│  │ + 3 frnds│ │ + event  │ │ 503 wait │    │
│  │ 12 online│ │ tomorrow │ │ CLAIM IT │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  RISING (velocity-based, not total count)    │
│  ┌──────────────────────────────────────┐    │
│  │ +24 members this week · 3 events     │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  PEOPLE YOU SHOULD KNOW (mutual-first)       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  │    │ │    │ │    │ │    │ │    │        │
│  └────┘ └────┘ └────┘ └────┘ └────┘        │
│                                              │
└──────────────────────────────────────────────┘
```

**Life systems:**

- **Happening Now rail** — Horizontal scroll of live/upcoming events. Countdown chips. Gold pulse on live events. Auto-updates position as events start/end.
- **Rising section** — Replace "Popular This Week" with velocity-based ranking: `(joins_this_week * 3) + (messages_this_week * 1) + (events_this_week * 5)`. Shows growth arrow and weekly delta.
- **Friend signals on cards** — Space cards show: "Sarah, Alex + 2 friends" with avatar stack. People cards show: "in 4 of your spaces".
- **Ghost space promotion** — Ghost cards get more visual weight. Waitlist count in gold gradient. "Be the founder" instead of "Claim This Space". Pulsing border when waitlist crosses threshold (50+, 100+, 500+).
- **Search with recency** — Recent searches shown as pills below search bar. Trending searches shown when empty.

**Template integration:** Use `Grid` template (mode: `territorial`) for the main feed. Happening Now rail uses horizontal scroll outside the grid.

---

### 4. Spaces: Ambient Life in the Residence

**Current:** Linear-style split panel. Chat is real-time. Everything else (sidebar, members, tools) is stale after load.

**Problems:**
- Boards list doesn't auto-update when new board created
- Members list is stale until modal reopened
- No ambient activity signals when chat is quiet
- Empty spaces feel dead — no "who's been here" signals
- No page transition when entering a space

**Proposed additions (keep existing split-panel, enhance it):**

**Sidebar life:**
- Board unread counts update in real-time (subscribe to board message events)
- "New" badge pulses on sidebar when board is created by another leader
- Tools section shows deploy status animations (deploying → deployed transition)
- Members preview rotates to show recently active members, not static first-5

**Header life:**
- Online count animates on change (count-up/down with spring)
- Energy dots pulse with actual rhythm (faster pulse = more messages per minute)
- "X active today" stat next to online count
- When event is live in this space: gold banner below header with event name + attendee count

**Empty space treatment:**
- Instead of "Start the conversation" text: show recent joiners ("Laney, Alex, and 3 others joined this week"), show suggested conversation starters, show upcoming events in this space
- Ambient "X people are here" with avatar stack even when chat is empty

**Space entrance ceremony:**
- On first visit: `ArrivalTransition` already exists with zone-based stagger. Make it run.
- On return visits: Subtle fade-in (150ms) rather than hard swap
- When navigating between spaces: Cross-fade transition (exit current space header, enter new one)

---

### 5. Lab: From Solo IDE to Living Workshop

**Current:** Full visual IDE with canvas, drag-drop, deploy ceremony (4-phase DRAMA animation). Rich analytics with animated counters. But zero collaboration signals.

**Problems:**
- No real-time collaboration cursors
- No version history UI (drafts/published exists but no timeline)
- No "who else is building" ambient signal
- Setups are skeleton-only — no orchestration visualization
- Templates gallery is disconnected from IDE

**Proposed additions:**

**Hub life (`/lab`):**
- "Campus is building" ambient stat — Total tools created this week, total runs today
- Tool cards show real-time run count (poll every 60s, animate count change)
- "Recently deployed" section with deploy animations (mini version of DRAMA ceremony)
- Quick-create from AI prompt should show typing animation as tool generates

**IDE life (`/lab/[toolId]`):**
- Version timeline in header — Small dots showing save history, click to preview past versions
- "Last saved Xm ago" timestamp that updates live
- If tool is deployed: live usage counter in header bar (small, unobtrusive)
- Preview mode shows real usage data inline (not just in analytics sub-page)

**Template integration:** Lab hub uses `Grid` template (mode: `uniform`). IDE uses `Workspace` template (already designed for this — mode: `build` with left/right rails).

---

### 6. Profile: From Static Resume to Living Identity

**Current:** 3-zone vertical layout (Identity → Belonging → Activity). 70% static. Online dot exists. "Active 5 days this month" is the only dynamic stat.

**Problems:**
- No contribution graph (GitHub-style heatmap)
- No streaks visualization
- No "last active X hours ago" for other profiles
- Spaces show membership but not activity within them
- No featured project/tool showcase (component exists but unused)
- Badges have no "earned X days ago" context

**Proposed additions:**

**Identity zone enhancements:**
- "Last active Xh ago" or "Online now" text below name
- Badge hover shows when earned + what it means
- Featured tool showcase below bio (ProfileFeaturedToolCard wired to selection in settings)

**Belonging zone enhancements:**
- Space cards show user's role activity: "Led 3 events" / "Posted 12 times this week"
- "You're both here" badge on shared spaces (already exists — make it more prominent)
- Upcoming events the user is organizing shown with attendee count

**Activity zone transformation:**
- **Contribution heatmap** — `ProfileActivityHeatmap` component already exists in the profile index. Wire it. 52-week grid, gold intensity by activity level.
- **Streak display** — Current streak + longest streak. Flame icon. Gold glow when active today.
- **Recent activity timeline** — Last 5 actions: "Posted in Design Club", "Deployed Poll Tool", "RSVP'd to Hackathon". Relative timestamps.
- **Stats row** — Days active / Tools built / Spaces led / Events organized. Animated count-up on scroll-into-view.

---

## Ambient Life Systems

These are cross-cutting systems that make every surface feel occupied.

### A. Presence Layer

**Current:** `usePresence` hook exists. Online count shown as number. Green/amber/grey dots in members list.

**Proposed elevation:**

| Signal | Where | Implementation |
|--------|-------|---------------|
| **Avatar stacks** | Home sidebar, Explore cards, Space header | Show 3 friend avatars + "+N" instead of just a count |
| **Typing awareness** | Space chat (exists), extend to boards sidebar | "Sarah is writing..." appears in board list item |
| **Activity recency** | Profile, Members list, Home | "Active 2m ago" with live-updating relative time |
| **Campus heartbeat** | TopBar or Home header | Total campus active users, updates every 60s, subtle pulse animation |

### B. Temporal Layer

**Current:** `getGreeting()` changes by hour. Event times shown as relative. No countdowns. No "happening now" celebration.

**Proposed elevation:**

| Signal | Where | Implementation |
|--------|-------|---------------|
| **Event countdowns** | Home Up Next, Explore Happening Now, Space events | Live countdown: "Starting in 12m". Auto-transition to "LIVE" badge with gold pulse |
| **Time-aware content** | Home, Explore | Morning: show today's events. Evening: show tomorrow's. Late night: show "campus is quiet" with reduced UI density |
| **Streak timers** | Profile, Home sidebar | "12h left to keep your streak" with subtle urgency at <4h |
| **"Just now" markers** | Activity feeds, Space messages | Items from last 5 minutes get gold left-border accent |

### C. Social Proof Layer

**Current:** Member counts. Online counts. Waitlist counts on ghost spaces. No velocity, no mutual signals, no "trending."

**Proposed elevation:**

| Signal | Where | Implementation |
|--------|-------|---------------|
| **Growth velocity** | Explore cards, Space header | "+12 this week" with up-arrow. Green = growing. Grey = stable. |
| **Mutual connections** | Explore people cards, Profile | "3 mutual spaces" with avatar dots |
| **Trending indicator** | Explore, Home suggested | "Trending on campus" badge on spaces with velocity spike |
| **Social RSVP** | Events everywhere | "Sarah and 4 friends going" instead of just "12 going" |

---

## Page Transition System

**Current:** Zero page transitions. Route changes are hard swaps.

**Proposed:** Wrap main content area in `AnimatePresence` with `pageTransitionVariants` (already defined in `motion-variants.ts`).

```
Page exit:  opacity 1→0, y 0→-8, duration 250ms, EASE_PREMIUM
Page enter: opacity 0→1, y 8→0,  duration 400ms, EASE_PREMIUM
```

**Route-specific transitions:**

| Navigation | Transition | Rationale |
|-----------|-----------|-----------|
| Between pillars (Home → Explore → You) | Fade + subtle Y shift | Standard navigation, shouldn't be dramatic |
| Into a space (`/home` → `/s/handle`) | Zoom + fade (scale 0.98→1) | Entering a "place" — spatial metaphor |
| Into Lab IDE (`/lab` → `/lab/toolId`) | Workspace expand | Canvas grows from card position |
| Into profile (`any` → `/u/handle`) | Fade only | Clean, identity-focused |
| Back navigation | Reverse of forward (y: -8→0 instead of 8→0) | Directional consistency |

---

## Template Integration Plan

Four templates built. Here's where each one goes.

| Template | Mode | Target Page | Current Page Layout |
|----------|------|------------|-------------------|
| **Stream** | `sectioned` | `/home` (primary column) | Hand-rolled `max-w-2xl` stack |
| **Stream** | `conversational` | `/s/[handle]` message feed | Hand-rolled reverse-scroll div |
| **Grid** | `territorial` | `/explore` | Hand-rolled section grid |
| **Grid** | `uniform` | `/lab` hub (tool cards) | Hand-rolled responsive grid |
| **Workspace** | `build` | `/lab/[toolId]` IDE | Already using HiveLabIDE (wire to template) |
| **Workspace** | `magic` | `/lab/new` creation | Hand-rolled loading + redirect |
| **Focus** | default | `/u/[handle]` profile | Hand-rolled 3-zone stack |
| **Focus** | default | `/enter` entry flow | Hand-rolled `max-w-md` center |

---

## Priority Sequence

What to implement and in what order, based on impact.

### Wave 1: Shell + Transitions (Foundation)

1. Wire UniversalShell as production shell (replace AppShell)
2. Add `AnimatePresence` page transitions to layout
3. Wire Cmd+K CommandPalette to full navigation
4. Collapsible sidebar with spring animation

**Why first:** Every subsequent change benefits from the shell upgrade. Page transitions eliminate the "static document" feel instantly.

### Wave 2: Home + Presence (Heartbeat)

5. Render streaks from existing `streakInfo` data
6. Add 30s polling to Home activity feed
7. Event countdown timers on Up Next section
8. Campus Pulse bar (active user count, ambient update)
9. People Online avatar stack in sidebar

**Why second:** Home is the first page users see after entry. Making it alive sets the tone.

### Wave 3: Explore + Social (Discovery)

10. Velocity-based "Rising" section replacing "Popular"
11. Friend signals on space cards (mutual member avatars)
12. Happening Now event rail with live/countdown badges
13. Ghost space visual promotion (gold borders, pulsing at thresholds)

**Why third:** Discovery drives growth. Social proof signals drive joins.

### Wave 4: Profile + Activity (Identity)

14. Wire ProfileActivityHeatmap (contribution graph)
15. Streak display with flame icon
16. Recent activity timeline (last 5 actions)
17. "Last active Xh ago" on profiles
18. Featured tool showcase

**Why fourth:** Profile polish increases pride and sharing. Activity signals encourage return visits.

### Wave 5: Spaces + Lab (Depth)

19. Real-time sidebar updates in spaces (boards, tools, members)
20. Space entrance cross-fade transitions
21. Lab hub ambient stats ("campus is building")
22. IDE version timeline dots
23. Template integration across all pages

**Why last:** These are depth features for engaged users. Foundation and surface-level life matter more for first impressions.

---

## Design References

| Pattern | Reference | HIVE Application |
|---------|-----------|-----------------|
| Live activity feed | Linear's inbox | Home activity stream with real-time insertions |
| Contribution graph | GitHub profile | Profile activity zone heatmap |
| Presence indicators | Figma multiplayer | Space header + sidebar avatar stacks |
| Command palette | Linear, Raycast | Cmd+K for navigation + quick actions |
| Floating sidebar | Notion's collapsible nav | UniversalShell sidebar (already built) |
| Page transitions | Vercel dashboard | AnimatePresence with directional motion |
| Velocity badges | Product Hunt trending | Explore "Rising" section |
| Streak mechanics | Duolingo, GitHub | Home sidebar + Profile activity zone |
| Event countdowns | Luma | Home Up Next + Explore Happening Now |
| Social proof stacks | Superwall, Cal.com | "Sarah + 3 friends" avatar clusters |

---

## What This Document Is Not

This is not a spec. It's a direction document. Each wave above is a conversation about what ships and what waits.

The core thesis: **HIVE has built the infrastructure for life (presence hooks, motion tokens, template system, energy dots) but hasn't connected the wires.** The gap between "built" and "wired" is what makes the platform feel static.

Close that gap, and HIVE stops being a directory and starts being a place.

---
---

# Shell & Navigation Deep Dive

> The frame is the product. Everything the user touches, every second they spend,
> happens inside the shell. Get the frame wrong and nothing else matters.

Grounded in HIVE's actual codebase: AppShell (production, 260px fixed sidebar), UniversalShell (built, unwired -- 220px floating collapsible sidebar + TopBar + Cmd+K), BottomNav (4 pillars: Home, Spaces, Lab, You), CommandPalette (Raycast-style, frosted glass, keyboard nav).

---

## 1. Three Shell Options: ASCII Wireframes

### Option A: Keep AppShell (Fixed Sidebar)

The current production shell. 260px hard-left sidebar, no collapse, no TopBar.
ChatGPT-inspired. Content pushes right of sidebar.

**Desktop (>=1024px)**
```
+----------------------------------------------------------+
|                                                          |
| +----------+ +----------------------------------------+ |
| |          | |                                        | |
| |  HIVE    | |  (no top bar -- logo is in sidebar)    | |
| |  logo    | |                                        | |
| |          | |  +----------------------------------+  | |
| |----------| |  |                                  |  | |
| |          | |  |                                  |  | |
| |  Home    | |  |         PAGE CONTENT             |  | |
| |  Spaces  | |  |                                  |  | |
| |  Lab     | |  |    max-w-3xl mx-auto px-8        |  | |
| |  You     | |  |    (unless wide-content page)    |  | |
| |          | |  |                                  |  | |
| |----------| |  |                                  |  | |
| |          | |  |                                  |  | |
| | Messages | |  |                                  |  | |
| |          | |  |                                  |  | |
| |----------| |  +----------------------------------+  | |
| |          | |                                        | |
| | [avatar] | |                                        | |
| | Laney    | |                                        | |
| | @laney   | |                                        | |
| | Sign Out | |                                        | |
| +----------+ +----------------------------------------+ |
|   260px                    flex-1                        |
+----------------------------------------------------------+
```

**Mobile (<1024px)**
```
+---------------------------+
| +-----+  [HIVE mark]     |   <- 56px sticky header
| |=====|                   |      hamburger opens
| +-----+                   |      280px drawer overlay
+---------------------------+
|                           |
|      PAGE CONTENT         |
|                           |
|      full width           |
|      pb-20 (bottom nav    |
|       clearance)          |
|                           |
|                           |
|                           |
+---------------------------+
| Home | Spaces | Lab | You |   <- 64px BottomNav
+---------------------------+
     fixed, z-50, lg:hidden
```

**Tradeoffs:**
- Pro: Proven, shipping today, zero risk
- Pro: Simple mental model -- sidebar is always there
- Con: 260px is wide for a 4-item nav -- wasted space
- Con: No page context (no breadcrumbs, no search trigger)
- Con: No Cmd+K, no collapse, no floating feel
- Con: Content area is narrower than it needs to be
- Reference feel: ChatGPT sidebar, Slack sidebar

---

### Option B: UniversalShell (Collapsible Floating Sidebar + TopBar + Cmd+K)

Already built in `packages/ui/src/shells/UniversalShell.tsx`.
Floating 220px sidebar with 12px margin, collapses to 64px icon rail.
48px TopBar with breadcrumbs + search trigger + notifications.

**Desktop (>=1024px) -- Expanded**
```
+--------------------------------------------------------------+
| [  12px margin  ]                                            |
| +------------+  +------------------------------------------+ |
| |            |  | Breadcrumbs          [search] [bell] [av] | |
| | [av] Laney |  +------------------------------------------+ |
| | @laney     |     48px TopBar, left-offset = sidebar+margin |
| |------------|                                               |
| |            |  +------------------------------------------+ |
| | > Home     |  |                                          | |
| |   Spaces   |  |                                          | |
| |   Lab      |  |           PAGE CONTENT                   | |
| |   You      |  |                                          | |
| |------------|  |     marginLeft = 244px (220+12+12)       | |
| | SPACES     |  |     paddingTop = 48px                    | |
| | Design Clb |  |                                          | |
| | Eng Club   |  |                                          | |
| | Founders   |  |                                          | |
| | ...scroll  |  |                                          | |
| |------------|  |                                          | |
| | + Browse   |  |                                          | |
| |------------|  +------------------------------------------+ |
| |   << Coll  |                                               |
| +------------+                                               |
|    220px                                                     |
|    floating, glass, r-14, 12px inset from all edges          |
+--------------------------------------------------------------+
```

**Desktop (>=1024px) -- Collapsed**
```
+--------------------------------------------------------------+
|                                                              |
| +----+  +--------------------------------------------------+ |
| |    |  | Breadcrumbs              [search] [bell] [av]    | |
| | av |  +--------------------------------------------------+ |
| |----|                                                       |
| |    |  +--------------------------------------------------+ |
| | H  |  |                                                  | |
| | S  |  |                                                  | |
| | L  |  |               PAGE CONTENT                       | |
| | Y  |  |                                                  | |
| |----|  |     marginLeft = 88px (64+12+12)                 | |
| |    |  |     paddingTop = 48px                            | |
| | DC |  |                                                  | |
| | EC |  |     Content area grows by 156px                  | |
| | Fo |  |                                                  | |
| |    |  |                                                  | |
| |----|  |                                                  | |
| | +  |  |                                                  | |
| |----|  +--------------------------------------------------+ |
| | >> |                                                       |
| +----+                                                       |
|  64px                                                        |
+--------------------------------------------------------------+
```

**Mobile (<768px)**
```
+---------------------------+
| Breadcrumbs    [srch][bel]|   <- 48px TopBar
+---------------------------+
|                           |
|      PAGE CONTENT         |
|                           |
|      full width           |
|      paddingTop = 48px    |
|      paddingBottom = 72px |
|                           |
|                           |
|                           |
+---------------------------+
| Home | Spaces | Lab | You |   <- 72px MobileNav
+---------------------------+       with layoutId indicator
    no sidebar on mobile
    Cmd+K still works
```

**Tradeoffs:**
- Pro: Floating glass sidebar feels premium (Notion-grade)
- Pro: Collapse recovers 156px of content width
- Pro: TopBar gives page context (breadcrumbs, search, notifications)
- Pro: Cmd+K palette already wired with spaces, navigation, keyboard nav
- Pro: Spring animations on collapse/expand (SNAP preset)
- Pro: Keyboard shortcut `[` toggles sidebar
- Con: Two animation systems in play (sidebar spring + content margin spring)
- Con: Floating sidebar over content could obscure on narrow desktops (1024-1200px)
- Con: More complex responsive behavior to maintain
- Reference feel: Notion sidebar, Linear sidebar, VS Code Activity Bar

---

### Option C: Minimal Shell (No Sidebar, TopBar Only, Cmd+K as Primary Nav)

The most aggressive option. Kill the sidebar entirely on desktop.
TopBar becomes the single navigation surface. Cmd+K is the primary way to get around.

**Desktop (>=1024px)**
```
+--------------------------------------------------------------+
| [HIVE] Home Spaces Lab You     [search ⌘K] [bell] [avatar] |
+--------------------------------------------------------------+
|   48px TopBar, full width, nav items inline                  |
|                                                              |
|   +--------------------------------------------------------+ |
|   |                                                        | |
|   |                                                        | |
|   |                 PAGE CONTENT                           | |
|   |                                                        | |
|   |           Full width minus padding                     | |
|   |           No sidebar offset                            | |
|   |           Maximum content area                         | |
|   |                                                        | |
|   |                                                        | |
|   |                                                        | |
|   |                                                        | |
|   |                                                        | |
|   |                                                        | |
|   |                                                        | |
|   +--------------------------------------------------------+ |
|                                                              |
+--------------------------------------------------------------+
```

**Desktop with Cmd+K open (the real navigation)**
```
+--------------------------------------------------------------+
| [HIVE] Home Spaces Lab You     [search ⌘K] [bell] [avatar] |
+--------------------------------------------------------------+
|                                                              |
|          +--------------------------------------+            |
|          |  Search or type a command...  ⌘K  X |            |
|          +--------------------------------------+            |
|          | NAVIGATION                          |            |
|          |   Home         Your dashboard       |            |
|          |   Spaces       Your communities     |            |
|          |   Lab          Build tools           |            |
|          |   You          Profile & settings    |            |
|          |                                     |            |
|          | YOUR SPACES                         |            |
|          |   Design Club                       |            |
|          |   Engineering                       |            |
|          |   Founders Hub                      |            |
|          |                                     |            |
|          | ACTIONS                              |            |
|          |   Create new tool          ⌘N       |            |
|          |   Settings                 ⌘,       |            |
|          +--------------------------------------+            |
|          | arrows navigate  enter select  esc  |            |
|          +--------------------------------------+            |
|                                                              |
+--------------------------------------------------------------+
```

**Mobile (<768px)**
```
+---------------------------+
| [HIVE]     [search] [bel]|   <- 48px TopBar
+---------------------------+      no inline nav items
|                           |      (those live in bottom nav)
|      PAGE CONTENT         |
|                           |
|      full width           |
|      paddingTop = 48px    |
|      paddingBottom = 72px |
|                           |
+---------------------------+
| Home | Spaces | Lab | You |   <- 72px BottomNav
+---------------------------+
```

**Tradeoffs:**
- Pro: Maximum content area -- zero sidebar tax
- Pro: Clean, minimal, lets content breathe
- Pro: Forces investment in Cmd+K quality (search, frecency, AI)
- Pro: Feels like Arc browser -- navigation is invisible until summoned
- Con: Spaces list hidden behind Cmd+K -- requires extra keystrokes
- Con: No persistent "where am I" signal beyond TopBar breadcrumbs
- Con: Power users lose always-visible space switching
- Con: Discoverability problem -- new users won't know to press Cmd+K
- Con: Mobile users get no benefit (already have no sidebar)
- Reference feel: Arc browser, Raycast as OS, Vercel dashboard (minimal header)

---

## 2. Sidebar Anatomy (Detailed)

Based on UniversalShell's GlobalSidebar. Three states.

### Expanded State (220px)
```
+--------------------+
|  12px top margin   |
| +----------------+ |
| |                | |    radius: 14px
| | [av] Laney F   | |    bg: rgba(10,10,10,0.95)
| |      @laney    | |    border: rgba(255,255,255,0.04)
| |                | |    shadow: 0 4px 24px rgba(0,0,0,0.4)
| |----------------| |    backdrop-filter: blur(20px)
| |  ----divider-- | |
| |                | |
| | [H] Home    3  | |    3 = notification badge
| | [S] Spaces     | |    gold(15%)/gold badge bg
| | [L] Lab        | |
| | [Y] You        | |    Active item:
| |                | |      bg: rgba(255,255,255,0.04)
| | |              | |      left: 2px gold bar, 14px tall
| | ^ gold bar     | |      text: #FAFAFA
| |                | |    Inactive:
| |----------------| |      text: #666666 (icons)
| |  ----divider-- | |      text: #A1A1A1 (labels)
| |                | |
| | SPACES (label) | |    label: uppercase, xs, #666
| |                | |
| | [DC] Design Cl | |    Space items:
| | [EC] Eng Club  | |      24x24 avatar, rounded-md
| | [Fo] Founders  | |      unread: gold dot on avatar
| | [PS] Pre-Seed  | |      active: gold bar + light bg
| |   ...scroll    | |
| |                | |
| | [+] Browse     | |    Bottom button, muted text
| |                | |
| |----------------| |
| |  << Collapse   | |    Toggles with [ key
| |     (label)    | |    Rotates chevron 180deg
| +----------------+ |
|  12px bot margin   |
+--------------------+
  12px left margin
  12px right margin (gap to content)
```

### Collapsed State (64px)
```
+--------+
|  12px  |
| +----+ |
| |    | |
| | av | |     Avatar only, no name
| |    | |
| |----| |
| |    | |
| | H  | |     Icons only, centered
| | S  | |     10px padding all sides
| | L  | |     Active: gold dot on icon
| | Y  | |     Badge: 2px gold dot top-right
| |    | |
| |----| |
| |    | |
| | DC | |     Space initials or emoji only
| | EC | |     Unread: gold dot
| | Fo | |     Hover: shows tooltip with name
| |    | |
| |----| |
| | +  | |     Plus icon only
| |----| |
| | >> | |     Expand toggle
| +----+ |
|  12px  |
+--------+
```

### Hover Interactions
```
Expanded:
  Nav item hover:  bg rgba(255,255,255,0.03)
                   x: +2px (framer whileHover)
  Space hover:     bg rgba(255,255,255,0.03)
  Collapse hover:  bg rgba(255,255,255,0.03)

Collapsed:
  Nav item hover:  Same bg
  Space hover:     Tooltip appears right side
                   "[Space Name]" in small pill
  Any item click:  Expands sidebar THEN navigates

Transition:
  width:    SPRING_SNAP_NAV (stiffness: 500, damping: 35)
  opacity:  300ms ease
  labels:   fade out before width shrinks
            fade in after width expands
```

---

## 3. TopBar Anatomy (Detailed)

48px fixed header. Sits to the right of the sidebar (not full width).

```
+-------------------------------------------------------------------+
|                                                                   |
|  left-offset (animated)                                           |
|  +---------------------------------------------------------------+|
|  |                                                               ||
|  |  [Breadcrumbs]                              [Actions]         ||
|  |                                                               ||
|  +---------------------------------------------------------------+|
|                                                                   |
+-------------------------------------------------------------------+

Left side (breadcrumbs):
+-------------------------------------------+
|  Home                                     |   Single segment = page title
+-------------------------------------------+

+-------------------------------------------+
|  Spaces / Design Club                     |   Multi-segment with / divider
+-------------------------------------------+

+-------------------------------------------+
|  Spaces / Design Club / Tools / Poll      |   Deep route breadcrumbs
+-------------------------------------------+   Intermediate segments are clickable
                                                Last segment is bold, current page

Right side (actions):
+-------------------------------------------+
|               [magnifier] ⌘K   [bell]     |
+-------------------------------------------+
                 |              |      |
                 |              |      +-- NotificationBell
                 |              |          relative w-9 h-9 rounded-lg
                 |              |          count > 0: red dot, -top-0.5 -right-0.5
                 |              |
                 |              +-- Shortcut badge
                 |                  text-muted, bg rgba(255,255,255,0.06)
                 |                  rounded, label-xs
                 |
                 +-- Search icon
                     w-4 h-4, text-muted
                     hover: bg white/4%

Tokens:
  height:      48px
  bg:          #0A0A0A
  border:      1px solid rgba(255,255,255,0.06) (bottom)
  z-index:     50
  left-offset: animated with sidebar spring
  padding:     0 16px (px-4)
```

### TopBar Responsive Behavior
```
Desktop (>=768px):                    Mobile (<768px):
+----------------------------+        +----------------------------+
| Breadcrumbs   [srch][bell] |        | Breadcrumbs   [srch][bell] |
+----------------------------+        +----------------------------+
  left-offset from sidebar              left-offset = 0
  Shows full breadcrumb trail           Truncated breadcrumbs
                                        Search opens Cmd+K
                                        Bell opens notification sheet
```

---

## 4. Bottom Nav (Mobile) Anatomy

72px fixed bottom bar. 4 pillars. iOS safe area padding.

```
+-----------------------------------------------+
|                                               |
|   Home        Spaces       Lab         You    |
|                                               |
|  [house]     [grid]      [beaker]    [user]   |
|   Home        Spaces       Lab         You    |
|                                               |
|   ^^^^                                        |
|   active state below                          |
|                                               |
+-----------------------------------------------+
|  safe-area-inset-bottom (iOS)                 |
+-----------------------------------------------+
  fixed bottom-0 left-0 right-0 z-50 lg:hidden

Active State Detail:

Inactive item:            Active item:
+----------+              +----------+
|          |              | ======== |  <- gold bar, 32px wide, 2px tall
|  [icon]  |              |  [icon]  |     layoutId="bottom-nav-indicator"
|  Label   |              |  Label   |     box-shadow: gold glow
|          |              |          |     scale: 1 (vs 0.95 inactive)
+----------+              +----------+
text: white/40%           text: white/100%

Animation:
  Indicator bar uses framer layoutId
  Springs between positions on route change
  duration: 0.2s, EASE_PREMIUM
  icon scales 0.95 -> 1.0 on activate

Touch behavior:
  Navigator.vibrate(10) on tap (haptic)
  Immediate push to route
  No confirmation, no delay
```

### Bottom Nav Tab State Machine
```
                  tap
  INACTIVE ─────────────> ACTIVE
  (white/40%)              (white/100%)
  (scale 0.95)             (scale 1.0)
  (no indicator)           (gold bar + glow)

  Route match patterns:
    Home:   /home, /feed, /explore
    Spaces: /spaces, /s/*
    Lab:    /lab
    You:    /me, /profile, /settings, /u/*
```

---

## 5. Cmd+K Command Palette Anatomy

Raycast/Linear-style. Centered modal at 20% from top. max-w-xl (576px).
Frosted glass panel. Keyboard-first navigation.

### Closed State (Invisible)
```
Trigger methods:
  1. Keyboard: Cmd+K (Mac) / Ctrl+K (Win)
  2. TopBar search button click
  3. Sidebar search (if added)

No visual presence when closed.
Listeners registered globally via useEffect.
```

### Open State
```
BACKDROP (full screen, z-50):
  bg: rgba(0,0,0,0.6)
  backdrop-filter: blur(12px) saturate(1.5)
  click-to-dismiss

PALETTE (centered, 20% from top):
+--------------------------------------------------+
|                                                  |
|  [magnifier] Search or type a command... [⌘][K] X|
|                                                  |
+--------------------------------------------------+  <- border-b
|                                                  |
|  NAVIGATION                                      |  <- category label
|                                                  |     uppercase, xs, muted
|  +----------------------------------------------+|     tracking: 0.08em
|  | [icon] Home                              --> ||
|  |        Your dashboard                        ||  <- selected item
|  +----------------------------------------------+|     bg: var(--bg-hover)
|  | [icon] Spaces                                ||     inset box-shadow
|  |        Your communities and residences       ||
|  | [icon] Lab                                   ||
|  |        Build tools for your spaces           ||
|  | [icon] You                                   ||
|  |        Your profile and settings             ||
|  |                                              ||
|  | YOUR SPACES                                  ||
|  |                                              ||
|  | [#] Design Club                              ||
|  |     Go to space                              ||
|  | [#] Engineering                              ||
|  |     Go to space                              ||
|  | [#] Founders Hub                             ||
|  |     Go to space                              ||
|  |                                              ||
|  | ACTIONS                                      ||
|  |                                              ||
|  | [bolt] Create new tool          [⌘][N]      ||  <- featured: gold text
|  |        Quick start                           ||     gold icon bg
|  | [gear] Settings                 [⌘][,]      ||
|  |                                              ||
|  +----------------------------------------------+|
|                                                  |
+--------------------------------------------------+  <- border-t
|  [arrows] navigate  [enter] select  [esc] close |
+--------------------------------------------------+
     footer hints, label-xs, muted text

Panel styling:
  bg:              rgba(20,20,20,0.85)
  backdrop-filter:  blur(24px) saturate(1.5)
  border:          1px solid var(--border)/60%
  border-radius:   12px (rounded-xl)
  shadow:          0 24px 64px rgba(0,0,0,0.7)
                   0 8px 24px rgba(0,0,0,0.4)
                   inset 0 1px 0 rgba(255,255,255,0.04)
  max-height:      400px results (scrollable)
```

### Search Filtering
```
Query: "des"

+--------------------------------------------------+
|  [magnifier] des|                       [⌘][K] X |
+--------------------------------------------------+
|                                                  |
|  YOUR SPACES                                     |
|                                                  |
|  +----------------------------------------------+|
|  | [#] Design Club                          --> ||  <- matches "des"
|  |     Go to space                              ||
|  +----------------------------------------------+|
|                                                  |
|  No other matches.                               |
|                                                  |
+--------------------------------------------------+
|  [arrows] navigate  [enter] select  [esc] close |
+--------------------------------------------------+

Empty state (query "zzzzz"):
+--------------------------------------------------+
|  [magnifier] zzzzz|                     [⌘][K] X |
+--------------------------------------------------+
|                                                  |
|           [magnifier icon in box]                |
|                                                  |
|         No results for "zzzzz"                   |
|    Try a different search term or browse         |
|                                                  |
+--------------------------------------------------+
```

### Keyboard Navigation State Machine
```
  CLOSED ──[Cmd+K]──> OPEN (focus input, clear query)
    ^                    |
    |                    |── [Esc] ──> CLOSED
    |                    |── [Enter] ──> SELECT item, CLOSED
    |                    |── [ArrowDown] ──> selectedIndex++
    |                    |── [ArrowUp] ──> selectedIndex--
    |                    |── [typing] ──> filter items, reset index
    |                    |
    +── [click backdrop] ──+

  Selection wraps: last item -> first, first item -> last
  Mouse hover sets selectedIndex (hybrid keyboard/mouse)
  Selected item scrolls into view (block: nearest)
```

---

## 6. How AI Elevates Navigation in 2025-2026

The shell is not just a frame -- it is an intelligence surface. Here is how AI
transforms navigation from "click where you want to go" to "the app knows where
you need to be."

### 6.1 Predictive Navigation

The shell learns usage patterns and pre-positions the user.

```
Traditional nav:                 AI-elevated nav:
  User clicks Home               Shell detects:
  User clicks Spaces             - It is 2pm Tuesday
  User clicks Design Club        - User always opens Design Club
  User opens chat                  at 2pm on Tuesdays
                                  - Design Club has a meeting now

                                  Shell offers:
                                  "Design Club meeting starting"
                                  [Go to Design Club] <-- one click
```

**Implementation approach:** Track navigation sequences per user. After 3+
repetitions of a pattern at the same time/day, surface it as a suggestion
in the TopBar or as the first Cmd+K result. Store as `nav_patterns` in
Firestore per user, process client-side. No server-side ML needed.

### 6.2 Frecency-Based Ordering

Cmd+K results should not be alphabetical. They should be frecency-ordered:
most frequently accessed + most recently accessed = highest rank.

```
Current Cmd+K order:              Frecency order:
  NAVIGATION                        RECENT
    Home                              Design Club (2m ago)
    Spaces                            Lab (15m ago)
    Lab                               Home (1h ago)
    You
  YOUR SPACES                      FREQUENT
    Design Club                       Design Club (47 visits)
    Engineering                       Home (31 visits)
    Founders Hub                      Engineering (12 visits)

                                    EVERYTHING ELSE
                                      Spaces
                                      Lab
                                      You
                                      Founders Hub
```

**Implementation approach:** Maintain a `frecency_scores` map in localStorage.
On each navigation: `score = frequency_count * recency_decay_factor`. Decay
halves every 24 hours. Sort Cmd+K results by score descending. Show "Recent"
section for items accessed in last hour.

### 6.3 Smart Shortcuts (Context-Aware Actions)

The Cmd+K palette should surface different actions based on where you are.

```
On /home:                         On /s/design-club:
  QUICK ACTIONS                     SPACE ACTIONS
    Check what's new                  Send a message
    Go to most active space           View members
    Create a new event                Create an event
                                      Deploy a tool

On /lab:                          On /lab/[toolId]:
  BUILDER ACTIONS                   TOOL ACTIONS
    Create new tool                   Preview tool
    Browse templates                  Deploy to space
    View analytics                    View analytics
    Duplicate tool                    Duplicate
```

**Implementation approach:** Pass `contextItems` to CommandPalette based on
current route. The `useBreadcrumbs` hook already knows the route -- extend it
to return context-specific action sets. Each page can export a
`getCommandPaletteActions()` function.

### 6.4 Ghost Navigation (AI Anticipation)

The sidebar subtly highlights where the user is likely to go next.

```
User is on /home at 7pm:
+--------------------+
| [H] Home       <-- |   current (gold bar)
| [S] Spaces         |
| [L] Lab            |
| [Y] You            |
|                    |
| SPACES             |
| [DC] Design Club . |   <-- subtle dot: "meeting in 30m"
| [EC] Eng Club      |
| [Fo] Founders    . |   <-- subtle dot: "3 unread"
+--------------------+

The dots are NOT notification badges. They are predictive hints.
They say "you probably want to go here soon."
```

**Implementation approach:** Combine three signals into a `shouldHighlight`
score per nav item:
1. Upcoming events in that space (calendar data)
2. Unread messages above threshold
3. Frecency pattern match for current time

Display as a 4px muted dot (not gold -- predictive, not urgent) next to items
scoring above threshold. The dot is `rgba(255,255,255,0.2)` -- barely visible
unless you're looking for it.

### 6.5 Natural Language Navigation

Cmd+K should understand intent, not just match strings.

```
Query: "poll"                     Query: "who's online"
  Results:                          Results:
    [tool] Poll Builder               [page] Home (active users section)
    [space] Design Club Polls          [space] Design Club (4 online)
    [action] Create new poll           [space] Engineering (2 online)

Query: "my stuff"                 Query: "meeting tomorrow"
  Results:                          Results:
    [page] Your Profile               [event] Design Review - 2pm
    [page] Lab (your tools)            [event] Club Meeting - 4pm
    [page] Settings                    [action] Create new event
```

**Implementation approach:** For v1, use keyword expansion mapping (no LLM
needed). Map common phrases to entity types:
- "my" -> filter to user's own content
- "online"/"active" -> presence-related pages
- "meeting"/"event" -> calendar/event entities
- "build"/"create"/"new" -> creation actions

For v2, pass query + user context to a lightweight LLM call that returns
structured navigation intents. Cache responses aggressively.

---

## 7. What Makes a Shell S-Tier

The difference between "app wrapper" and "intelligent workspace frame."

### The Spectrum

```
F-TIER: Wrapper                   S-TIER: Intelligent Frame
  - Static sidebar                  - Adapts to context
  - Hard-coded nav items            - Learns your patterns
  - Click to navigate               - Anticipates your needs
  - Same view 24/7                  - Time-aware
  - Frame is invisible              - Frame is collaborative
  - Content sits inside             - Frame and content converse
```

### S-Tier Shell Characteristics (Observed in Linear, Notion, Arc, VS Code, Figma)

**1. The frame breathes with the content.**
Linear's sidebar shows unread counts that pulse. Notion's sidebar shows
recently edited pages that reorder themselves. The frame is not static --
it reflects the live state of what's inside.

HIVE equivalent: Sidebar space items show energy dots that pulse with
message velocity. Items with unread content rise to the top. Items with
upcoming events show countdown chips.

**2. Navigation is an act of thinking, not clicking.**
Raycast eliminates the desktop. You think "calculator" and type "calc" and
it appears. Linear's Cmd+K doesn't just search -- it understands "my issues
assigned this sprint."

HIVE equivalent: Cmd+K understands "design club meeting" and takes you to
the right space's events section. Not a search engine -- a navigation brain.

**3. The frame knows what time it is.**
Arc's sidebar shows different pinned tabs for work vs personal (spaces).
VS Code's Activity Bar changes icons based on active extensions. Slack shows
"catch up" mode when you've been away.

HIVE equivalent: Morning = show today's events prominently. Evening = show
tomorrow's preview. After absence = show "3 things happened while you were
away" in the TopBar. Late night = reduce visual density, dim gold to amber.

**4. Collapse is a feature, not a compromise.**
Figma's left panel collapses but retains quick-access. VS Code's Activity Bar
is the collapsed state -- it's not lesser, it's different. The collapsed state
is designed, not shrunk.

HIVE equivalent: Collapsed sidebar (64px) shows space avatars with unread
dots. Hovering a space shows a tooltip with name + online count + last message
preview. The collapsed state is a dashboard, not an icon dump.

**5. The frame remembers.**
Your collapse preference persists. Your sidebar scroll position persists. Your
last-used Cmd+K query is recoverable. The frame does not reset on navigation.

HIVE equivalent: `localStorage` key `hive-sidebar-collapsed` already exists.
Extend to: sidebar scroll position, last 10 Cmd+K queries, preferred sidebar
width (if resizable), last expanded section.

**6. Motion signals state, not decoration.**
Linear's sidebar items don't bounce when you hover -- they shift 2px right to
indicate "this is interactive." Notion's page list items don't scale -- they
highlight to indicate "you're here." Motion in S-tier shells is information,
not entertainment.

HIVE equivalent: Sidebar active indicator is a 2px gold bar with subtle glow.
Not a full highlight, not a bounce, not a scale. The bar says "you are here"
with maximum restraint. Collapse transition uses spring physics because the
sidebar is a physical object. Page transitions use opacity because pages are
ideas, not objects.

---

## 8. Responsive Breakpoints

How the shell transforms at each breakpoint. Based on current HIVE tokens.

### Breakpoint Map

```
  0px          768px         1024px        1280px        1536px
  |             |             |             |             |
  |  MOBILE     |  TABLET     |  DESKTOP    | WIDE        | ULTRA
  |             |             |             |             |
```

### Mobile: 0-767px
```
+---------------------------+
| TopBar (48px)             |    No sidebar
| Breadcrumbs  [srch][bell] |    TopBar is full-width
+---------------------------+    Content is full-width
|                           |    Bottom nav visible (72px)
|    PAGE CONTENT           |    Cmd+K available via search btn
|                           |    Hamburger menu for settings
|    width: 100%            |    (if AppShell: slide-out drawer)
|    px: 16px               |
|    pt: 48px               |
|    pb: 72px + safe-area   |
|                           |
+---------------------------+
| [H]   [S]   [L]   [Y]   |
+---------------------------+
| safe-area                 |
+---------------------------+

Mobile-specific behaviors:
  - No sidebar rendered at all
  - Bottom nav uses layoutId for indicator animation
  - Haptic feedback on nav tap
  - TopBar search opens Cmd+K overlay
  - Notifications open bottom sheet (not dropdown)
  - Content pages use full width
  - Settings pages use max-w-xl centered
```

### Tablet: 768-1023px
```
+-------------------------------------------+
| TopBar (48px)                             |
| Breadcrumbs            [srch][bell]       |
+-------------------------------------------+
|                                           |
|         PAGE CONTENT                      |
|                                           |
|    width: 100%                            |
|    px: 24px                               |
|    pt: 48px                               |
|    pb: 0 (no bottom nav)                  |
|                                           |
|    Grid pages: 2-column grid              |
|    Stream pages: max-w-2xl centered       |
|    IDE pages: full width                  |
|                                           |
+-------------------------------------------+

Tablet-specific behaviors:
  - No sidebar (or collapsed-only sidebar)
  - No bottom nav (tablet is "desktop-lite")
  - TopBar is full-width
  - Cmd+K is primary navigation method
  - Content gets tablet-optimized grids (2-col vs 3-col)
  - Space residence: no split panel, stacked layout
```

### Desktop: 1024-1279px
```
+----------------------------------------------------------+
|                                                          |
| +----------+ +----------------------------------------+ |
| | Sidebar  | | TopBar (48px)                          | |
| | 220px    | | Breadcrumbs        [srch][bell]        | |
| | floating | +----------------------------------------+ |
| |          | |                                        | |
| |          | |       PAGE CONTENT                     | |
| |          | |                                        | |
| |          | |  marginLeft: 244px                     | |
| |          | |  Available: ~780px                     | |
| |          | |  (tight -- consider auto-collapse)     | |
| |          | |                                        | |
| +----------+ +----------------------------------------+ |
|                                                          |
+----------------------------------------------------------+

Desktop-specific behaviors:
  - Sidebar visible (expanded or collapsed)
  - Consider auto-collapse at this breakpoint (220px sidebar
    leaves only ~780px for content)
  - TopBar offset by sidebar width
  - Full breadcrumb display
  - Cmd+K for power navigation
  - Grid pages: 2-3 column grids
  - IDE: full workspace with collapsible panels
```

### Wide Desktop: 1280-1535px
```
+------------------------------------------------------------------+
|                                                                  |
| +----------+ +--------------------------------------------------+|
| | Sidebar  | | TopBar (48px)                                    ||
| | 220px    | | Breadcrumbs                  [srch][bell][av]    ||
| | floating | +--------------------------------------------------+|
| |          | |                                                  ||
| | expanded | |              PAGE CONTENT                        ||
| | by       | |                                                  ||
| | default  | |  marginLeft: 244px                               ||
| |          | |  Available: ~1036px                               ||
| |          | |  Comfortable for 3-col grids                     ||
| |          | |  Home 2-column layout works here                  ||
| |          | |                                                  ||
| +----------+ +--------------------------------------------------+|
|                                                                  |
+------------------------------------------------------------------+

Wide-specific behaviors:
  - Sidebar expanded by default
  - Comfortable content width for all layouts
  - Home page: 2-column (stream + context)
  - Explore: 3-column grid
  - Profile: centered with breathing room
```

### Ultra Wide: 1536px+
```
+------------------------------------------------------------------------+
|                                                                        |
| +----------+ +--------------------------------------------------------+|
| | Sidebar  | | TopBar (48px)                                          ||
| | 220px    | | Breadcrumbs                        [srch][bell][av]    ||
| | floating | +--------------------------------------------------------+|
| |          | |                                                        ||
| |          | |                   PAGE CONTENT                          ||
| |          | |                                                        ||
| |          | |  marginLeft: 244px                                     ||
| |          | |  Available: ~1292px+                                   ||
| |          | |  Content max-widths prevent sprawl:                    ||
| |          | |    Dashboard: max-w-3xl (768px) centered               ||
| |          | |    Grid pages: max-w-7xl (1280px)                      ||
| |          | |    IDE: full width (no max)                             ||
| |          | |    Profile: max-w-4xl (896px) centered                  ||
| |          | |                                                        ||
| +----------+ +--------------------------------------------------------+|
|                                                                        |
+------------------------------------------------------------------------+

Ultra-wide behaviors:
  - Same as wide
  - Content max-widths prevent lines from becoming unreadable
  - Extra whitespace on sides is intentional -- premium feel
  - Consider: secondary sidebar or context panel on right side
    for ultra-wide only (like Notion's TOC or Figma's properties)
```

### Breakpoint Transition Summary

| Property | Mobile | Tablet | Desktop | Wide | Ultra |
|----------|--------|--------|---------|------|-------|
| Sidebar | none | none | floating 220/64px | floating 220px | floating 220px |
| TopBar | full-width | full-width | offset by sidebar | offset | offset |
| Bottom nav | 72px, visible | hidden | hidden | hidden | hidden |
| Cmd+K | via button | via button | via button + keyboard | keyboard | keyboard |
| Content px | 16px | 24px | 0 (page handles) | 0 | 0 |
| Grid cols | 1 | 2 | 2-3 | 3 | 3-4 |
| Sidebar collapse | n/a | n/a | manual or auto | manual | manual |

### Auto-Collapse Logic
```
if (windowWidth >= 1024 && windowWidth < 1280) {
  // Auto-collapse sidebar unless user explicitly expanded
  if (!userExplicitlyExpanded) {
    setSidebarCollapsed(true);
  }
}
if (windowWidth >= 1280) {
  // Default to expanded
  if (!userExplicitlyCollapsed) {
    setSidebarCollapsed(false);
  }
}
```

This respects user preference while providing sensible defaults. The user's
explicit action always wins over auto-behavior. Store `userExplicitlyExpanded`
and `userExplicitlyCollapsed` in localStorage alongside the current
`hive-sidebar-collapsed` key.

---

## Current State vs. Target State

| Component | Current (Production) | Target (UniversalShell) | Gap |
|-----------|---------------------|------------------------|-----|
| Sidebar | 260px fixed, no collapse | 220px floating, collapses to 64px | Built, needs wiring |
| TopBar | None (logo in sidebar header) | 48px with breadcrumbs, search, bell | Built, needs wiring |
| Bottom nav | 64px, basic (BottomNav.tsx) | 72px with layoutId animation | Built in UniversalShell |
| Cmd+K | Not wired | Frosted glass, grouped items, keyboard nav | Built, needs wiring |
| Breadcrumbs | None | Route-aware, clickable segments | Built in TopBar |
| Keyboard shortcuts | None | `[` toggle sidebar, Cmd+K search | Built in UniversalShell |
| Sidebar spaces | Not shown | Scrollable list with unread dots | Built in GlobalSidebar |
| Sidebar identity | Avatar + name in footer | Avatar + name at top | Built in IdentityCard |
| Page context | None | TopBar shows current section | Built in useBreadcrumbs |
| Collapse persistence | N/A | localStorage `hive-sidebar-collapsed` | Built |

The gap is not "build new things." The gap is "wire what exists."
