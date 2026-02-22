# LAUNCH-IA.md — HIVE Launch Information Architecture & UX
**Last updated:** 2026-02-22
**Authority:** This is the source of truth for launch UX. Every screen, every system.
**Rules:** Read alongside `DESIGN_RULES.md` (tokens, components) and `UI-TODO.md` (component fixes).

---

## The Model

4-tab navigation. Everything belongs to one of these systems.

```
Feed      /discover    Campus stream — events + space activity + tools
Spaces    /spaces      Community layer — your orgs, browse, space detail
Lab       /lab         Creation — conversation-first build + explore/discover
Profile   /me          Identity — portfolio, spaces, activity
```

Utilities (not nav destinations):
- Search (⌘K) — scopes: people → spaces → events → tools. NOT posts.
- Notifications (/notifications) — three types: social, campus, creation milestones
- RightRail — 280px contextual column on xl+ screens (currently empty, needs populating)

---

## SHELL — Layout & Navigation

### Current problem
`md:ml-[56px]` offsets content from sidebar. Pages use `<Container mx-auto>` which floats content centered in the remaining space. On wide screens: ~180px dead space on each side. Feels "middle-aligned."

### Fix
Content pages inside the shell should NOT use `mx-auto` centering. Shell defines three zones:

```
[56px sidebar] [main content, flex-1, max-w-2xl, left-anchored] [280px RightRail, xl+ only]
```

- Main content: `flex-1 min-w-0 max-w-2xl` — left-anchored, not centered
- RightRail: `hidden xl:block w-[280px] shrink-0` — already exists, needs content
- This fixes centering AND gives the RightRail structural purpose

### Sidebar (AppSidebar)
4 nav items. Current state is correct in structure. Needs token-correct active states (see UI-TODO):
- Active item: full opacity icon + label. Background pill only on Lab item.
- Lab item: gold `1px` left-border, gold icon color, 22px icon, separator above + below
- Inactive: `--text-muted` (40% opacity)
- Expand on hover (already implemented with spring animation) ✅
- Spaces quick-access below divider (already implemented) ✅
- NotificationBell at bottom (already implemented) ✅

### RightRail — Populate It
Currently empty. Three content zones, in order:

```
1. Upcoming in your spaces (next 48h events from spaces you're in)
2. Trending spaces (most active right now, by online count + recent messages)
3. Suggested people (mutual spaces signal — "also in Women's Ice Hockey")
```

Each zone: max 3 items, compact cards, "See all →" link. No zone renders if data is empty.
Component: use `SpaceCard` (compact variant), `EventCard`, `ProfileCardMemberRow`.
This is a new organism: `RightRailPanel` — build it.

### CreatePromptBar
Already built. Currently hidden/not prominent enough. 

**New behavior:** Always visible as a persistent bottom bar OR top bar within Lab context. Outside Lab, surfaces as the Lab nav item's click action — clicking Lab opens the prompt, not a page navigation.

Placeholder is context-aware (already implemented):
- In a Space: "Make something for [SpaceName]..."  
- On Profile: "Start a new project..."
- Default: "What do you want to make?"

Quick chips (Poll, Event, Signup, Countdown) pre-fill the prompt. This is the primary creation entry.

---

## SYSTEM 1: FEED (/discover)

### What it is
The campus stream. Content comes to you, ranked by relevance. Three card types.

### Content model (ranked, mixed)
```
EventCard    — from your spaces + campus personalization scoring engine
SpaceCard    — spaces you might join (mutual members, activity, category match)  
ToolCard     — tools deployed in your spaces, trending tools on campus
```

Event cards are the hero card type at launch — they have real data (2,467 events), personalization scoring, and real-world gravity. They fill the feed before users post anything.

### UX
- Feed groups by time for events: Tonight · This Week · Later (same as /events page)
- Non-event cards (spaces, tools) interleaved between event groups
- Pull-to-refresh on mobile
- Infinite scroll
- Empty state: "Join spaces to see what's happening in your communities" + Space suggestions

### FeedEvent card UX
- Uses EventCard component (LOCKED)
- Shows: title, date/time, location, RSVP count, Space origin (logo + name)
- "3 friends going" if mutual connections are going (use friendsAttending field)
- matchReasons shown subtly: "Recommended for you · Computer Science"
- RSVP button inline — toggle Going/Not Going without leaving feed

### What changes
- [ ] Verify all three card types (Event, Space, Tool) are rendering in /discover
- [ ] EventCard is the dominant card type — ensure scoring engine is called
- [ ] FeedSpace cards use `SpaceCard` (compact) — wire mutualCount
- [ ] FeedTool cards use `ToolCard` (compact) — wire useCount
- [ ] Add time grouping (Tonight / This Week / Later) to the feed, not just /events
- [ ] Fix container: remove mx-auto centering, left-anchor against RightRail

---

## SYSTEM 2: SPACES (/spaces + /s/[handle])

### /spaces — Browse
Directory of campus spaces. Current state: probably works. Needs:
- SpaceCard grid (already using design-system SpaceCard) ✅
- Filter by type: student_org · greek_life · university_org · campus_living · hive_exclusive
- Search within spaces
- "Your Spaces" section at top if user has joined spaces
- Territory gradient system (blue/purple/amber/emerald/rose) drives visual variety ✅

### /s/[handle] — Space Detail
Three-panel layout: space-sidebar (tools, events, members) + main content (chat/posts) + no right rail (space is immersive, no rail).

Space sidebar already has: tools-list, events-list, members-preview components ✅

**What changes:**
- [ ] Ensure SpaceCard on browse page passes lastActivityAt, onlineCount, recentMessageCount for health badge
- [ ] Mutual member count ("X you know") must be calculated and passed
- [ ] Space detail: "Create in this Space" — CreatePromptBar appears with spaceHandle pre-filled when user taps create action
- [ ] Events in space sidebar: link to /events?space=[spaceId] filtered view

---

## SYSTEM 3: LAB (/lab)

### What it is
Creation AND discovery. Two modes. NOT a traditional IDE as the primary entry.

### Primary entry: Conversation
`CreatePromptBar` is the hero element on the Lab page for new users.

```
New user (0 tools):
  ┌─────────────────────────────────────┐
  │  What do you want to make?          │
  │  [Poll] [Event] [Signup] [Countdown]│
  └─────────────────────────────────────┘
  ↓ Below: template gallery (browse without prompting)
```

Prompt navigates to `/lab/new?prompt=[text]` — the AI generation flow takes over.

### Active builder (1+ tools):
```
Stats bar: [X Tools] [X Total Uses] [X This Week]
Tool grid (ToolGrid organism — needs building)
+ CreatePromptBar persistent at top
```

### Explore tab (add this)
Inside Lab: two tabs — **My Tools** (current) + **Explore** (new).

Explore = campus tool discovery:
- Tools built by others on this campus
- Sorted by useCount desc (most-used first)
- Can remix/fork any tool → opens in conversation with pre-filled context
- Filter by category: Poll · RSVP · Countdown · Form · Leaderboard · Voting

This is the missing surface. Without it, tools are invisible after creation.

### Lab tool flow (keep as-is)
`/lab/[toolId]` — IDE canvas — hides shell for immersive build experience ✅
`/lab/[toolId]/preview` — preview before deploy ✅
`/lab/[toolId]/deploy` — deploy to Space ✅
`/lab/[toolId]/analytics` — usage stats ✅

### What changes
- [ ] Add Explore tab to /lab page — campus tool grid, sorted by useCount
- [ ] Ensure CreatePromptBar is the FIRST thing you see on /lab (not below the fold)
- [ ] Active builder: stat row uses StatAtom with Number Ticker animation
- [ ] ToolGrid organism: 2-col bento, pinned top 2, rest sorted by useCount
- [ ] Lab nav item behavior: clicking Lab from anywhere opens CreatePromptBar focus

---

## SYSTEM 4: PROFILE (/me + /u/[handle])

### /me — Your Profile
**Current:** Portrait card (large avatar, maroon gradient) + stats + spaces suggestion + tools list.
**New:** Slim header + stat row + ToolGrid + ActivityHeatmap.

```
┌─────────────────────────────────────────────┐
│ [48px avatar] Jacob Rhinehart               │
│               @jacobrhinehart27 · Junior     │
│               Building things at UB          │
│                              [Edit profile] │
├──────────┬──────────┬────────────────────────┤
│  4       │  127     │  3                     │
│  Tools   │  Views   │  Spaces                │
├─────────────────────────────────────────────┤
│ TOOLS                      [Open Lab →]     │
│ ┌────────────────┐ ┌────────────────┐       │
│ │ ★ Top Tool     │ │  Quick Poll    │       │
│ │  89 uses       │ │  47 uses       │       │
│ └────────────────┘ └────────────────┘       │
│ [tool] [tool] [tool] [tool]                 │
├─────────────────────────────────────────────┤
│ SPACES                                      │
│ [Ice Hockey] [CS Society] [+ 2 more]        │
├─────────────────────────────────────────────┤
│ ░░░▒▒▒███░░░▒▒███░  Activity · 90 days      │
└─────────────────────────────────────────────┘
```

### /u/[handle] — Viewing Someone Else
Same layout + social layer:
- "3 mutual spaces" shown under name (Space membership ∩ calculation)
- Connect + Message buttons in header (replace Edit profile)
- Tools are view-only

### Rules
- Hide zero stats — don't show "0 Spaces" or "0 Views"
- Avatar: 48px, rounded-square (not circle), no gradient background
- Stat numbers: StatAtom with Number Ticker animation on mount
- ToolGrid: first 2 tools are "pinned" (visually elevated), rest sorted by useCount
- ActivityHeatmap: already built, wire to tool creation + execute events
- Spaces row: SpaceCard compact variant, horizontal scroll

### What changes
- [ ] Rebuild ProfileCardFull → slim header (48px avatar, name, handle, bio, action buttons)
- [ ] Add mutual spaces calculation: currentUser.spaces ∩ profileUser.spaces → pass as mutualCount
- [ ] ToolGrid organism (new — see UI-TODO)
- [ ] Wire ProfileActivityHeatmap to real activity data
- [ ] Hide zero stats
- [ ] Stat row: StatAtom with Number Ticker

---

## SYSTEM 5: CAMPUS LAYER (Infrastructure)

### Not a nav destination
Feeds all other systems silently. Three tiers:

**Tier 1 — Scrapers:** Events from campus public calendars. Adapters for 25Live, Localist, CampusGroups, CollegiateLink. Write once per platform format, parameterize per school URL.

**Tier 2 — Org leader self-service:** Claim your Space, post events manually. Fills gaps scrapers miss.

**Tier 3 — .edu auto-detection:** New .edu signup → flag campus → queue for data import.

### Replication requirement
Adding school #2 must take <1 hour of setup (not a Jacob-manual-process). The scraper pipeline is the product for expansion.

---

## MISSING UX — Build These

### Tool Standalone Page (/t/[toolId])
When a tool URL is shared externally (GroupMe, iMessage), non-HIVE users land here.

```
[Tool name]                    [Creator: @handle]
[Space: Women's Ice Hockey]    [47 uses]
─────────────────────────────────────────────────
[Embedded, functional tool — works without auth]
─────────────────────────────────────────────────
"See more tools from Women's Ice Hockey on HIVE →"
[Create your own free tool →]
```

This page is the acquisition funnel. It must work without login. The tool must be functional (RSVP, vote, etc.) for anonymous users. The CTA captures them into HIVE.

### Notifications UX (/notifications)
Three categories, separated:
```
CAMPUS          Event reminder: Art Workshop tomorrow at 3pm
SOCIAL          @user used your "Quick Poll" tool
CREATION        Your poll hit 100 responses 🎉
```

Gold accent on creation milestones only. All others: monochrome.

### Empty States — Every Screen
Every empty state has: an icon, a one-line explanation, ONE action CTA. No paragraphs.

```
Feed empty:   "Join spaces to see what's happening" → [Browse Spaces]
Tools empty:  "Nothing built yet" → [What do you want to make?]
Spaces empty: "No spaces yet" → [Browse campus spaces]
```

---

## PRIORITY BUILD ORDER

Based on IA gaps and user impact:

### 🔴 Ship first (blocks activation loop)
1. **Feed content** — verify Event + Space + Tool cards all render in /discover. EventCards must use scoring engine.
2. **RightRail** — populate with upcoming events + trending spaces. Fixes centering AND adds content.
3. **CreatePromptBar** — make it the hero Lab entry. Always visible. First thing in Lab page.

### 🟠 Ship second (makes product feel designed)
4. **Lab Explore tab** — campus tool discovery. Without this, tools are invisible.
5. **ProfilePage rebuild** — slim header, ToolGrid, heatmap wire-up.
6. **UniversalNav** — token-correct active states, Lab gold treatment.
7. **Tool standalone page** — acquisition funnel for external sharing.

### 🟡 Ship third (polish)
8. **Notifications UX** — three-category separation, gold on milestones.
9. **Shell centering fix** — left-anchor content against RightRail.
10. **Empty states** — every screen gets the right empty state.

---

## LOCKED DECISIONS

| Decision | Rationale |
|----------|-----------|
| 4-tab nav (Feed, Spaces, Lab, Profile) | Confirmed. Do not add nav items at launch. |
| Events surface through Feed + Spaces — no dedicated nav tab | Events are content, not a destination. /events page exists but is under Feed tab. |
| Lab is conversation-first (CreatePromptBar), not IDE-first | IDE exists for power users. Most users never need it. |
| RightRail at 280px (xl+ only) | Fixes centering and adds contextual utility. Already exists as empty slot. |
| Tools as cross-campus currency in Year 2 | Communities stay campus-scoped. Templates/tools can spread across campuses. |
| Search scope: People → Spaces → Events → Tools (no posts) | Posts are too noisy at launch to be useful in search. |
