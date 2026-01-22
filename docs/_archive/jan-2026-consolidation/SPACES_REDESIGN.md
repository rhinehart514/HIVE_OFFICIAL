# HIVE Spaces — Complete Redesign

**Status:** Proposal
**Date:** January 2026
**Scope:** All Spaces-related pages, IA, UX, and UI

---

## Executive Summary

Current Spaces implementation is **functionally complete but experientially fragmented**. The redesign unifies the experience around three core truths:

1. **Spaces are identity containers** — not chat rooms with features bolted on
2. **Discovery must feel inevitable** — not browsed through filters
3. **Residence must feel ambient** — not "I'm in a space doing a thing"

**The North Star:** Spaces should feel like **walking into a building on campus at 2am**. You see who's there, what's happening, and where to go — all at once. No menus. No questions. Just presence.

---

## Current State Analysis

### What Works ✓

| Element | Why It Works |
|---------|-------------|
| **4 Territory System** | Clear mental model (university/student/greek/residential) |
| **SpaceThreshold** | Premium join gate creates intentionality |
| **Unified Feed** | Messages + events in one stream feels right |
| **Boards Sidebar** | Always-visible navigation is good IA |
| **Claim Flow** | Celebration moments feel earned |

### What's Broken ✗

| Problem | Impact | Root Cause |
|---------|--------|------------|
| **Browse feels like a database query** | Users don't discover, they search | List/grid toggle = feature creep |
| **Space detail has no hierarchy** | Everything screams equally | Boards sidebar competes with content |
| **No sense of "where am I"** | Spaces feel like tabs, not places | Missing spatial metaphor |
| **Motion is generic** | Fade-ins everywhere | No scroll-triggered drama |
| **Join flow is transactional** | Click → you're in → now what? | Missing onboarding moment |
| **No identity evolution** | Spaces are static containers | No growth, no story |

### The Core Issue

**Spaces are built like features, not like places.**

You join a space, and... then what? There's no sense of arrival, no sense of presence, no sense of "this is where we are." The current implementation optimizes for **functionality** (messages work, events work, boards work) but not for **feeling** (I belong here, things are happening, I matter).

---

## Design Principles (Redesign)

### 1. Identity-First Architecture

Spaces are **not** communication tools. They're **identity containers** that happen to have communication.

**This means:**
- Identity comes before utility
- Who you are in a space > what you do in a space
- Space design reflects space culture (greek ≠ dorm ≠ club)

### 2. Scroll as Narrative Device

Like `/about`, use **scroll to reveal story**. Each space has a narrative:
- **Above fold:** Identity (who we are)
- **Scroll 1:** Presence (who's here now)
- **Scroll 2:** Activity (what's happening)
- **Scroll 3:** History (what we've done)

### 3. Ambient Residence Pattern

When you're "in" a space, you should feel **ambient presence**:
- See who's online without looking for it
- Hear conversations without joining them
- Sense activity without notifications

**Visual rule:** Gold dots = life. No gold = empty.

### 4. Dramatic Reveals with Purpose

Motion should **explain structure**, not decorate:
- Borders draw in → "this is a container"
- Cards slide up → "this is a layer"
- Dots pulse → "this is alive"

Every animation answers: **"What is this thing?"**

### 5. No Dead Ends

Every state has a clear next action:
- Empty space → "Create first board"
- No messages → "Start conversation"
- Not a member → "Join to participate"

---

## New Information Architecture

### Current IA (Flat)

```
/spaces                    Browse all
/s/[handle]               Space detail
/spaces/create            Create
/spaces/claim             Claim
/spaces/join/[code]       Join via code
```

### Proposed IA (Hierarchical)

```
/spaces                              Discovery Hub (new)
├─ /spaces/browse                    Full directory (refactored)
│  ├─ /spaces/browse/university      Filtered by territory
│  ├─ /spaces/browse/student
│  ├─ /spaces/browse/greek
│  └─ /spaces/browse/residential
├─ /spaces/yours                     Your spaces (new)
└─ /spaces/claim                     Claim/create flow (unified)

/s/[handle]                          Space Residence (refactored)
├─ /s/[handle]/welcome               First-time member onboarding (new)
├─ /s/[handle]/[board-slug]          Board-specific view (new)
├─ /s/[handle]/events                Events archive (new)
├─ /s/[handle]/members               Member directory (new)
└─ /s/[handle]/settings              Space settings (leaders only)

/spaces/join/[code]                  Invite redemption (keep as-is)
```

**Key Changes:**

1. **Discovery Hub** (`/spaces`) becomes **your homepage for spaces**, not a directory
2. **Browse** moves to `/spaces/browse` with territory-specific routes
3. **Yours** is a dedicated view of spaces you're in (quick access)
4. **Claim + Create** unified into one smart flow
5. **Space Residence** gets deep-linkable sub-routes for boards/events/members

---

## Page-by-Page Redesign

---

## 1. `/spaces` — Discovery Hub (NEW)

**Job:** Answer "What spaces matter to me right now?"

### Current Problems
- 682-line monolith mixing "your spaces" + "browse" + "categories"
- Search + filters = database UI, not discovery
- No sense of what's active vs. dormant

### Redesign Vision

**Structure:** Three scroll-triggered zones

```
┌─────────────────────────────────────────────────┐
│  ZONE 1: YOUR SPACES (Above Fold)              │
│  ─────────────────────────────────────────────  │
│  "Where you belong"                             │
│  ─ Live presence indicators (gold dots)        │
│  ─ Recent activity previews                     │
│  ─ "3 unread in CSE 250", "Event in 2hrs"      │
│  ─ Grid of your spaces (max 8 visible)         │
│  ─ Scroll-triggered: Cards slide up + fade     │
│                                                 │
│  [View all →]                                   │
└─────────────────────────────────────────────────┘
                    ↓ SCROLL
┌─────────────────────────────────────────────────┐
│  ZONE 2: DISCOVER (Scroll Reveal 1)            │
│  ─────────────────────────────────────────────  │
│  "Find your people"                             │
│  ─ 4 Territories (university/student/greek/res) │
│  ─ Each territory: Animated border reveal      │
│  ─ Shows top 3 active spaces per territory     │
│  ─ Gold "live" indicators on active spaces     │
│  ─ Click territory → /spaces/browse/[category] │
│                                                 │
│  [Browse all spaces →]                          │
└─────────────────────────────────────────────────┘
                    ↓ SCROLL
┌─────────────────────────────────────────────────┐
│  ZONE 3: CREATE YOUR OWN (Scroll Reveal 2)     │
│  ─────────────────────────────────────────────  │
│  "Start something"                              │
│  ─ Two paths:                                   │
│    1. Claim existing (institutional)           │
│    2. Create new (student org)                 │
│  ─ Animated split-screen reveal                │
│  ─ Each side has preview of what you get       │
│                                                 │
│  [Claim Space] [Create Space]                  │
└─────────────────────────────────────────────────┘
```

### Motion Spec (Like /about)

```tsx
// Zone reveals
const zoneVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// Card staggers
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

// Border reveals (like /about)
const borderReveal = {
  scaleX: [0, 1],
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};
```

### Component Hierarchy

```tsx
<DiscoveryHub>
  <YourSpacesZone>
    {/* Scroll trigger: -100px margin */}
    <AnimatedBorder />
    <SpaceGrid>
      {spaces.map((space, i) => (
        <AnimatedSpaceCard
          key={space.id}
          custom={i}  // for stagger
          variants={cardVariants}
        >
          <LiveIndicator active={space.onlineCount > 0} />
          <ActivityPreview recent={space.recentActivity} />
        </AnimatedSpaceCard>
      ))}
    </SpaceGrid>
  </YourSpacesZone>

  <DiscoverZone>
    {/* Scroll trigger: -150px margin */}
    <TerritoryGrid>
      {territories.map(territory => (
        <TerritoryCard
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <AnimatedBorder />
          <ActiveSpacesPreviews territory={territory} />
        </TerritoryCard>
      ))}
    </TerritoryGrid>
  </DiscoverZone>

  <CreateZone>
    {/* Scroll trigger: -200px margin */}
    <SplitReveal>
      <ClaimPath />
      <CreatePath />
    </SplitReveal>
  </CreateZone>
</DiscoveryHub>
```

### Key Interactions

| Action | Response |
|--------|----------|
| **Hover space card** | Gold border glow + lift (brightness 110%) |
| **Click space** | → `/s/[handle]` |
| **Click territory** | → `/spaces/browse/[category]` |
| **Click "View all"** | → `/spaces/yours` |
| **Scroll down** | Zones reveal with animated borders |
| **No spaces joined** | Zone 1 shows "Get started" CTA instead |

---

## 2. `/spaces/browse` — Full Directory (REFACTORED)

**Job:** Browse all spaces on campus

### Current Problems
- List/grid toggle is noise
- Search by name is weak (no fuzzy, no ranking)
- Filters are hidden behind category tabs
- No sense of what's active vs. empty

### Redesign Vision

**Single canonical layout:** Grid only. No toggle.

```
┌─────────────────────────────────────────────────┐
│  HEADER                                         │
│  ───────────────────────────────────────────    │
│  "Explore Buffalo Spaces"                       │
│  [Search...]               [🏛️][✨][👑][🏠]    │
│  (category pills)                               │
│                                                 │
│  Showing 42 spaces · 18 active now              │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  GRID (3 columns desktop, 1 mobile)             │
│  ───────────────────────────────────────────    │
│  [Space Card]  [Space Card]  [Space Card]       │
│    • online       • 23 online    • offline      │
│                                                 │
│  [Space Card]  [Space Card]  [Space Card]       │
│    • 5 online     • offline      • 12 online    │
│                                                 │
│  ... scroll continues ...                       │
└─────────────────────────────────────────────────┘
```

### Space Card Anatomy (NEW)

```
┌──────────────────────────────────────┐
│  [Avatar]  Space Name                │
│            Category Badge            │  ← Subtle, not dominant
│                                      │
│  Brief description (2 lines max)     │
│                                      │
│  ────────────────────────────────    │
│  👥 247 members  •  23 online        │  ← Gold dot if active
│  📌 3 boards  •  12 events          │
│                                      │
│  [Join] or [View]                    │  ← Context-aware CTA
└──────────────────────────────────────┘
```

### Motion Spec

```tsx
// Cards enter on scroll (like /about)
const cardEnter = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
  viewport: { once: true, margin: '-50px' }
};

// Hover state (no scale, brightness only)
const cardHover = {
  filter: 'brightness(1.1)',
  transition: { duration: 0.15 }
};
```

### Smart Features

1. **Active-First Sorting**: Spaces with people online appear first
2. **Fuzzy Search**: "cse" matches "CSE 250 Study Crew"
3. **Category Routing**: `/spaces/browse/greek` pre-filters
4. **Empty State**: "No spaces found. [Request this space]"

---

## 3. `/spaces/yours` — Your Spaces (NEW)

**Job:** Quick access to all spaces you're in

### Why This Page?

Current `/spaces` mixes "your spaces" (max 8 shown) with discovery. This creates:
- No way to see ALL your spaces at once
- No way to organize/pin favorites
- No sense of "these are mine"

### Design Vision

**List view with rich context**

```
┌─────────────────────────────────────────────────┐
│  HEADER                                         │
│  ───────────────────────────────────────────    │
│  "Your Spaces" (12)                             │
│  [Pin favorites]  [Sort: Recent activity ▾]     │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  PINNED (if any)                                │
│  ───────────────────────────────────────────    │
│  ⭐ Space Row (expanded preview)                │
│     → Last message preview                      │
│     → Upcoming event preview                    │
│     → Gold dot if active                        │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  ALL SPACES                                     │
│  ───────────────────────────────────────────    │
│  Space Row                                      │
│  Space Row (• 23 online)                        │
│  Space Row                                      │
│  Space Row (• 5 online)                         │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

### Space Row Anatomy

```
┌──────────────────────────────────────────────────────┐
│  [Avatar] Space Name               [⋮ Menu] [Pin⭐]  │
│           Category · 247 members                     │
│                                                      │
│  Last active: 5m ago · "see you there!" (preview)   │
│  📌 General · 🎉 Party Friday 8pm                   │  ← Context row
│                                                      │
│  [Open Space]                                        │
└──────────────────────────────────────────────────────┘
```

### Motion Spec

```tsx
// Rows slide in with stagger
const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};
```

---

## 4. `/s/[handle]` — Space Residence (REFACTORED)

**Job:** Be present in a space

### Current Problems

- Boards sidebar competes visually with main content
- No sense of "who's here now"
- Unified feed is good, but no hierarchy (messages = events = tools)
- First-time members get dumped into feed with no orientation
- Board switching via URL params feels like a hack

### Redesign Vision

**Three-column layout with clear hierarchy**

```
┌────────┬──────────────────────────────┬────────┐
│ BOARDS │       MAIN CONTENT           │ PRESENCE│
│        │                              │        │
│ Sticky │  ┌─────────────────────────┐ │ Sticky │
│ Left   │  │  SPACE HEADER           │ │ Right  │
│ Rail   │  │  • Name, avatar         │ │        │
│ 240px  │  │  • Online count (gold)  │ │ 280px  │
│        │  │  • Event countdown      │ │        │
│        │  └─────────────────────────┘ │        │
│ 📋     │                              │ 👤     │
│ General│  ┌─────────────────────────┐ │ Online │
│        │  │  UNIFIED ACTIVITY FEED  │ │ (12)   │
│ 📋     │  │  Messages, events, etc  │ │        │
│ Events │  │  ↓                      │ │ Sarah  │
│        │  │  [Message]              │ │ typing │
│ 📋     │  │  [Event]                │ │        │
│ Notes  │  │  [Message]              │ │ Mike   │
│        │  │  [Tool]                 │ │ 2m     │
│ + New  │  │  [Message]              │ │        │
│        │  │                         │ │ Alex   │
│        │  └─────────────────────────┘ │ 15m    │
│        │                              │        │
│        │  ┌─────────────────────────┐ │ Recent │
│        │  │  CHAT INPUT             │ │ (8)    │
│        │  └─────────────────────────┘ │        │
└────────┴──────────────────────────────┴────────┘
```

### Key Changes

1. **Presence Panel (NEW)**: Right rail shows who's here + recent
2. **Boards Rail**: Cleaner, icon-first design
3. **Space Header**: Lives in main content, not floating
4. **Typing Indicators**: Show in presence panel, not in feed
5. **Board Deep Links**: `/s/[handle]/[board-slug]` (clean URLs)

### Motion Spec (Initial Load)

```tsx
// Entrance sequence (like /about)
const entranceSequence = {
  boards: {
    initial: { opacity: 0, x: -20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
  },
  header: {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
  },
  feed: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  },
  presence: {
    initial: { opacity: 0, x: 20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
  }
};

// Message appears (no scroll trigger, instant)
const messageEnter = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  }
};
```

### Presence Panel Anatomy

```
┌────────────────────────┐
│  ONLINE (12)           │
│  ────────────────────  │
│  [Avatar] Sarah        │
│           typing...    │  ← Gold dot
│                        │
│  [Avatar] Mike         │
│           2m ago       │  ← Dim
│                        │
│  [Avatar] Alex         │
│           15m ago      │
│  ...                   │
│                        │
│  RECENT (8)            │
│  ────────────────────  │
│  [Avatar] Jordan       │
│           1h ago       │
│  ...                   │
└────────────────────────┘
```

### Board Rail Anatomy

```
┌─────────────────────┐
│  📋 General         │  ← Active (gold accent)
│  🎉 Events          │
│  📝 Notes           │
│  🏀 Game Days       │
│  ───────────────    │
│  + New Board        │  ← Leaders only
└─────────────────────┘
```

### Unified Feed Item Types

| Type | Visual Treatment | Action |
|------|------------------|--------|
| **Message** | Avatar + text + reactions | Click → thread (future) |
| **Event** | Card with date + RSVP count | Click → event modal |
| **Tool** | Card with icon + use count | Click → open tool |
| **Announcement** | Full-width card with gold accent | Pinned to top |

---

## 5. `/s/[handle]/welcome` — First-Time Onboarding (NEW)

**Job:** Orient new members

### Why This Page?

Current flow: Join → dumped into feed → ???

**Problem:** New members have no idea:
- What this space is about
- What boards exist
- What events are coming
- Who to talk to

### Design Vision

**Full-screen overlay (dismissible)**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Welcome to [Space Name]!                       │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│  "This is where [purpose]. We meet [when]."    │
│  (Space description)                            │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ 📋       │  │ 🎉       │  │ 📝       │     │  ← Boards preview
│  │ General  │  │ Events   │  │ Notes    │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│  Upcoming Events:                               │
│  • Party Friday 8pm (23 going)                 │
│  • Study Session Sunday 2pm                    │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│  [Skip Tour]              [Let's Go →]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Motion Spec

```tsx
// Overlay entrance (dramatic)
const overlayEnter = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

// Boards preview stagger
const boardPreviewStagger = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.1,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};
```

### Trigger Logic

```tsx
// Show welcome overlay if:
// 1. User just joined (within last 5 minutes)
// 2. User hasn't dismissed it before
// 3. User hasn't sent a message yet

const shouldShowWelcome =
  spaceData.memberSince > Date.now() - 5 * 60 * 1000 &&
  !localStorage.getItem(`hive-welcome-${spaceId}-dismissed`) &&
  spaceData.userMessageCount === 0;
```

---

## 6. `/spaces/claim` — Claim/Create Flow (UNIFIED)

**Job:** Get ownership of a space (institutional or new)

### Current Problems

- `/spaces/create` (student orgs) and `/spaces/claim` (institutional) are separate flows
- User has to know the difference before starting
- Form-heavy, no sense of what you're getting

### Redesign Vision

**One flow, smart branching**

```
STEP 1: What kind of space?
┌─────────────────────────────────────────────────┐
│  Create Your Space                              │
│  ───────────────────────────────────────────    │
│                                                 │
│  I want to...                                   │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Claim Existing   │  │ Create New       │   │
│  │                  │  │                  │   │
│  │ For official     │  │ For student      │   │  ← Visual split
│  │ departments,     │  │ clubs, orgs,     │   │
│  │ dorms, greek     │  │ interest groups  │   │
│  │                  │  │                  │   │
│  │ [Search →]       │  │ [Start →]        │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**If CLAIM:**
```
STEP 2: Search for space
┌─────────────────────────────────────────────────┐
│  Find Your Space                                │
│  ───────────────────────────────────────────    │
│                                                 │
│  [Search: "Computer Science"]                   │
│                                                 │
│  Results:                                       │
│  ┌───────────────────────────────────────────┐ │
│  │ 🏛️ Computer Science & Engineering        │ │
│  │    University · 1,247 students · Unclaimed│ │  ← Gold "Unclaimed" badge
│  │    [Claim This Space →]                   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🏠 Ellicott Complex                       │ │
│  │    Residential · RA Only · Locked 🔒      │ │  ← Locked indicator
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘

STEP 3: Confirm + role
┌─────────────────────────────────────────────────┐
│  Claim: Computer Science & Engineering          │
│  ───────────────────────────────────────────    │
│                                                 │
│  You're about to become the admin for:          │
│                                                 │
│  [Large space preview card]                     │
│                                                 │
│  Your role (optional):                          │
│  [Dropdown: President, VP, Secretary...]        │
│                                                 │
│  As admin, you can:                             │
│  • Manage members and roles                     │
│  • Create and organize boards                   │
│  • Pin announcements                            │
│  • Generate invite links                        │
│                                                 │
│  ───────────────────────────────────────────    │
│  [Back]                    [Claim Space →]      │  ← Gold button
│                                                 │
└─────────────────────────────────────────────────┘

STEP 4: Success (celebration)
┌─────────────────────────────────────────────────┐
│                                                 │
│              ✨ It's Yours! ✨                  │  ← Gold glow
│                                                 │
│  You're now the admin of                        │
│  Computer Science & Engineering                 │
│                                                 │
│  [Animated gold border reveal around card]      │
│                                                 │
│  Next steps:                                    │
│  • Invite your team                             │
│  • Set up boards                                │
│  • Post your first announcement                 │
│                                                 │
│  [Go to Space →]                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**If CREATE:**
```
STEP 2: Name + description
┌─────────────────────────────────────────────────┐
│  Create Your Student Organization               │
│  ───────────────────────────────────────────    │
│                                                 │
│  Space Name                                     │
│  [Buffalo Gaming Club______________]            │
│  handle: gaming-club (editable)                 │
│                                                 │
│  Description (brief, 1-2 sentences)             │
│  [Competitive gaming and casual play...]        │
│                                                 │
│  Category: Student Organization                 │
│  (auto-selected)                                │
│                                                 │
│  □ I agree to follow HIVE Community Guidelines  │
│                                                 │
│  ───────────────────────────────────────────    │
│  [Back]                    [Create Space →]     │  ← Gold button
│                                                 │
└─────────────────────────────────────────────────┘

STEP 3: Success (same celebration as claim)
```

### Motion Spec (Celebration Screen)

```tsx
// Gold border reveal (like /about)
const celebrationBorders = {
  top: {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
    style: { transformOrigin: 'left' }
  },
  right: {
    initial: { scaleY: 0 },
    animate: {
      scaleY: 1,
      transition: { delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
    style: { transformOrigin: 'top' }
  },
  bottom: {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: { delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
    style: { transformOrigin: 'right' }
  },
  left: {
    initial: { scaleY: 0 },
    animate: {
      scaleY: 1,
      transition: { delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
    style: { transformOrigin: 'bottom' }
  }
};

// Gold glow pulse
const glowPulse = {
  boxShadow: [
    '0 0 20px rgba(255, 215, 0, 0.3)',
    '0 0 40px rgba(255, 215, 0, 0.5)',
    '0 0 20px rgba(255, 215, 0, 0.3)'
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};
```

---

## 7. `/spaces/join/[code]` — Invite Redemption (KEEP AS-IS, ENHANCE MOTION)

**Job:** Join via invite link

### Current Implementation: Solid ✓

The flow is clean:
1. Validate code
2. Show preview
3. Confirm join
4. Success → redirect

### Enhancement: Add /about-style Motion

```tsx
// Preview card entrance
const previewEnter = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

// Animated border on preview card
const borderReveal = {
  initial: { scaleX: 0 },
  animate: {
    scaleX: 1,
    transition: { delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

// Success state (gold celebration)
const successGlow = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(255, 215, 0, 0.3)',
      '0 0 40px rgba(255, 215, 0, 0.5)',
      '0 0 20px rgba(255, 215, 0, 0.3)'
    ],
    transition: { duration: 2, repeat: 2 }
  }
};
```

---

## Motion System Reference

### Core Easing (from /about)

```tsx
const EASE = [0.22, 1, 0.36, 1] as const;  // Premium easing
```

### Scroll Trigger Pattern (from /about)

```tsx
import { useInView } from '@hive/ui/design-system/primitives';

const ref = useRef(null);
const isInView = useInView(ref, {
  once: true,        // Only trigger once
  margin: '-100px'   // Trigger 100px before entering viewport
});

return (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 40 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.6, ease: EASE }}
  >
    {children}
  </motion.div>
);
```

### Border Reveal Pattern (from /about)

```tsx
<div className="relative">
  {/* Top border */}
  <motion.div
    className="absolute top-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
    initial={{ scaleX: 0 }}
    animate={isInView ? { scaleX: 1 } : {}}
    transition={{ duration: 0.8, ease: EASE }}
    style={{ transformOrigin: 'left' }}
  />
  {/* Repeat for right, bottom, left with different delays */}
</div>
```

### Stagger Pattern

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,  // 80ms between children
      delayChildren: 0.2      // Wait 200ms before starting
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE }
  }
};

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ `/spaces` Discovery Hub redesign
2. ✅ Motion system setup (scroll triggers, border reveals)
3. ✅ Presence panel component (for space residence)

### Phase 2: Core Experience (Week 2)
4. ✅ `/s/[handle]` three-column layout refactor
5. ✅ Welcome overlay (`/s/[handle]/welcome`)
6. ✅ Deep-linkable board routes (`/s/[handle]/[board-slug]`)

### Phase 3: Discovery (Week 3)
7. ✅ `/spaces/browse` refactor (grid-only, scroll triggers)
8. ✅ `/spaces/yours` new page
9. ✅ Category territory pages (`/spaces/browse/[category]`)

### Phase 4: Onboarding (Week 4)
10. ✅ Unified claim/create flow
11. ✅ Celebration moments (gold borders, glow)
12. ✅ Enhanced `/spaces/join/[code]` motion

### Phase 5: Polish (Week 5)
13. ✅ Scroll-triggered animations across all pages
14. ✅ Presence indicators (gold dots)
15. ✅ Empty states with clear CTAs
16. ✅ Mobile responsive refinements

---

## Success Metrics

### Qualitative
- **2am Test**: Does it feel like walking into a place at 2am?
- **Alive Test**: Can you sense activity without reading text?
- **Orientation Test**: Do new members know what to do?

### Quantitative
- **Discovery → Join**: % of browse visits that result in join
- **Join → First Message**: Time to first message after join
- **Space Retention**: % of members who return within 7 days
- **Presence Awareness**: Do users check who's online before posting?

---

## Key Files to Modify

| Current File | Action | New File (if applicable) |
|-------------|--------|-------------------------|
| `/apps/web/src/app/spaces/page.tsx` | Refactor | → Discovery Hub |
| `/apps/web/src/app/spaces/create/page.tsx` | Merge | → `/apps/web/src/app/spaces/claim/page.tsx` |
| `/apps/web/src/app/spaces/claim/page.tsx` | Refactor | → Unified flow |
| `/apps/web/src/app/s/[handle]/page.tsx` | Refactor | → Three-column layout |
| - | Create | `/apps/web/src/app/spaces/browse/page.tsx` |
| - | Create | `/apps/web/src/app/spaces/yours/page.tsx` |
| - | Create | `/apps/web/src/app/s/[handle]/welcome/page.tsx` |
| `/components/spaces/boards-sidebar.tsx` | Refactor | → Icon-first design |
| - | Create | `/components/spaces/presence-panel.tsx` |
| - | Create | `/components/spaces/animated-border.tsx` |
| - | Create | `/components/spaces/live-indicator.tsx` |

---

## Questions to Answer

### Before Implementation

1. **Presence data source**: Real-time or polling? (Firebase listener vs. interval)
2. **Board deep links**: Migrate existing board IDs to slugs?
3. **Claim eligibility**: How do we verify institutional roles (RA, department chair, etc.)?
4. **Mobile layout**: Does three-column collapse to tabs or stack?
5. **Scroll triggers**: Performance concern with many `useInView` hooks on long pages?

### Design Decisions Needed

1. **Gold budget**: How many gold elements per screen max?
2. **Presence threshold**: When does "5 online" become just "online" (icon only)?
3. **Empty states**: Show sample content or stark empty?
4. **Animation performance**: Reduce motion for low-end devices?

---

## Appendix: Design System Components Needed

### New Primitives

```tsx
<PresenceDot active={boolean} size="sm" | "md" />
<LiveCounter count={number} threshold={number} />
<AnimatedBorder
  variant="gold" | "white"
  delay={number}
  viewport={{ once: boolean, margin: string }}
/>
<ScrollReveal
  variants={object}
  viewport={{ once: boolean, margin: string }}
>
  {children}
</ScrollReveal>
```

### New Components

```tsx
<SpaceCard
  space={Space}
  variant="grid" | "list" | "expanded"
  showLiveIndicator={boolean}
  showActivity={boolean}
/>

<TerritoryCard
  territory={Territory}
  activeSpaces={Space[]}
  onClick={() => void}
/>

<PresencePanel
  online={User[]}
  recent={User[]}
  maxVisible={number}
/>

<WelcomeOverlay
  space={Space}
  boards={Board[]}
  upcomingEvents={Event[]}
  onDismiss={() => void}
/>
```

---

**Next Step:** Get approval on IA + motion direction, then proceed with Phase 1 implementation.
