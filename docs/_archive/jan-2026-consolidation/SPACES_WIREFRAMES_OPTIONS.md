# Discovery Hub (`/spaces`) — Design Options

**Decision Point:** The entry point for all Spaces experience
**Goal:** Help users answer "What spaces matter to me right now?"
**Traffic:** Highest-volume page in Spaces section

---

## Option A: Vertical Scroll Story (Recommended)

**Philosophy:** Discovery is a journey. Guide users through progressive disclosure.

### Layout

```
═══════════════════════════════════════════════════════════════
                        HERO / ABOVE FOLD
───────────────────────────────────────────────────────────────

                    Your Spaces on Campus

        Where you belong. Where things are happening.

        ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
        │  🎯     │  │  📚     │  │  🎮     │  │  🏀     │
        │  CSE    │  │  Study  │  │  Gaming │  │  Hoops  │
        │  250    │  │  Group  │  │  Club   │  │  Team   │
        │         │  │         │  │         │  │         │
        │ • 23    │  │ • 5     │  │ • 12    │  │ offline │
        │ online  │  │ online  │  │ online  │  │         │
        │         │  │         │  │         │  │         │
        │ 3 unread│  │ Event   │  │ Notes   │  │ Next    │
        │         │  │ in 2hrs │  │ posted  │  │ game 7pm│
        └─────────┘  └─────────┘  └─────────┘  └─────────┘

        [More...4 more spaces]              [View All →]

                                                    ↓ SCROLL
───────────────────────────────────────────────────────────────
                    ZONE 2: DISCOVER TERRITORIES
                    (Scroll trigger: -100px)
───────────────────────────────────────────────────────────────

                    Find Your People

        ┌───────────────────────┐  ┌───────────────────────┐
        │  🏛️  UNIVERSITY       │  │  ✨  STUDENT          │
        │                       │  │                       │
        │  Departments, labs,   │  │  Clubs, orgs,        │
        │  academic spaces      │  │  interest groups     │
        │                       │  │                       │
        │  • Computer Science   │  │  • Gaming Club ●     │
        │  • Physics Lab        │  │  • Debate Team ●     │
        │  • Engineering ●      │  │  • Photography       │
        │                       │  │                       │
        │  [Explore 47 →]       │  │  [Explore 89 →]      │
        └───────────────────────┘  └───────────────────────┘

        ┌───────────────────────┐  ┌───────────────────────┐
        │  👑  GREEK            │  │  🏠  RESIDENTIAL       │
        │                       │  │                       │
        │  Fraternities,        │  │  Dorms, halls,       │
        │  sororities, councils │  │  housing             │
        │                       │  │                       │
        │  • Alpha Chi Omega ● │  │  • Ellicott Complex  │
        │  • Sigma Nu          │  │  • Governors Hall ●  │
        │  • Panhellenic       │  │  • Richmond Hall     │
        │                       │  │                       │
        │  [Explore 23 →]       │  │  [Explore 12 →]      │
        └───────────────────────┘  └───────────────────────┘

                    [Browse All Spaces →]

                                                    ↓ SCROLL
───────────────────────────────────────────────────────────────
                    ZONE 3: START SOMETHING
                    (Scroll trigger: -200px)
───────────────────────────────────────────────────────────────

                    Start Your Own

        ┌─────────────────────────┬─────────────────────────┐
        │                         │                         │
        │  CLAIM EXISTING         │  CREATE NEW             │
        │                         │                         │
        │  Official departments,  │  Student clubs,         │
        │  dorms, greek orgs      │  interest groups        │
        │                         │                         │
        │  • Already exists       │  • Build from scratch   │
        │  • Get admin rights     │  • Full control         │
        │  • Instant members      │  • Grow your community  │
        │                         │                         │
        │  ┌─────────────────┐    │  ┌─────────────────┐   │
        │  │  🔍 Search...   │    │  │  ✨ Start       │   │
        │  └─────────────────┘    │  └─────────────────┘   │
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Motion Sequence

```
1. Page load (instant)
   └─ Hero fades in (400ms)
   └─ Your Spaces cards stagger in (80ms each, from index 0)

2. Scroll to Zone 2 (trigger: -100px before entering)
   └─ "Find Your People" heading fades up (400ms)
   └─ Territory cards stagger in (120ms each)
   └─ Gold borders draw in (800ms, clockwise from top-left)

3. Scroll to Zone 3 (trigger: -200px before entering)
   └─ "Start Your Own" heading fades up (400ms)
   └─ Split screen slides in from sides (600ms)
      └─ Left panel: x: -40 → 0
      └─ Right panel: x: 40 → 0
```

### Pros ✓
- **Narrative flow** — Guides users from familiar → explore → create
- **Scroll engagement** — Dramatic reveals like `/about`
- **Clear hierarchy** — Each zone has a job
- **Mobile-friendly** — Vertical scroll is natural
- **Performance** — Only animates what's in viewport

### Cons ✗
- **Hidden content** — Requires scroll to see all options
- **Longer to scan** — Not everything visible at once
- **May feel slow** — For power users who know what they want

### Best For
- **First-time users** who need orientation
- **Discovery-focused** sessions
- **Setting expectations** for the Spaces experience

---

## Option B: Dashboard / Command Center

**Philosophy:** Show everything at once. Optimize for speed and scanning.

### Layout

```
═══════════════════════════════════════════════════════════════
                        FULL VIEWPORT
───────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│  Your Spaces                            [🔍 Search] [View ▼]│
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │  CSE   │ │ Study  │ │ Gaming │ │ Hoops  │ │ Debate │   │
│  │  250   │ │ Group  │ │ Club   │ │ Team   │ │ Team   │   │
│  │  • 23  │ │  • 5   │ │  • 12  │ │  off   │ │  • 8   │   │
│  │ 3 unrd │ │ in 2hr │ │ posted │ │ Fri 7p │ │ active │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│  [+4 more...]                            [View All Spaces →]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Discover                     [🏛️] [✨] [👑] [🏠] [All]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏛️ UNIVERSITY            ✨ STUDENT                       │
│  ┌────────┐ ┌────────┐    ┌────────┐ ┌────────┐           │
│  │ Comp   │ │ Physics│    │ Gaming │ │ Photo  │           │
│  │ Sci ●  │ │ Lab    │    │ Club ● │ │ Club ● │           │
│  └────────┘ └────────┘    └────────┘ └────────┘           │
│  [+45 more]                [+87 more]                       │
│                                                             │
│  👑 GREEK                 🏠 RESIDENTIAL                    │
│  ┌────────┐ ┌────────┐    ┌────────┐ ┌────────┐           │
│  │ Alpha  │ │ Sigma  │    │ Ellict │ │ Govern │           │
│  │ Chi ● │ │ Nu     │    │ Cplx   │ │ Hall ● │           │
│  └────────┘ └────────┘    └────────┘ └────────┘           │
│  [+21 more]                [+10 more]                       │
│                                                             │
│                        [Browse All →]                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Quick Actions                                              │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Claim Existing Space]         [✨ Create New Space]   │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Motion Sequence

```
1. Page load (instant)
   └─ Entire page fades in (300ms) — no scroll triggers
   └─ Your Spaces cards stagger briefly (50ms each)
   └─ Territory cards stagger briefly (50ms each)

2. Interactions
   └─ Hover: Card brightens (150ms)
   └─ Click: Card scales slightly + route transition
   └─ Filter tabs: Smooth cross-fade between categories
```

### Pros ✓
- **Fast scanning** — Everything visible without scroll
- **Power user friendly** — Quick access to everything
- **Familiar pattern** — Dashboard metaphor is known
- **Efficient** — Minimal clicks to target

### Cons ✗
- **Dense** — May feel overwhelming on first visit
- **Less dramatic** — No scroll-triggered wow moments
- **Hierarchy unclear** — Everything competes equally
- **Mobile challenge** — Hard to fit this much in viewport

### Best For
- **Returning users** who know what they want
- **Quick access** sessions
- **Desktop-first** experiences

---

## Option C: Spatial / Territory Map

**Philosophy:** Spaces are places. Show campus as a visual landscape.

### Layout

```
═══════════════════════════════════════════════════════════════
                        HERO / ABOVE FOLD
───────────────────────────────────────────────────────────────

                    Your Campus, Visualized

        ┌───────────────────────────────────────────────────┐
        │                                                   │
        │         🏛️                    ✨                  │
        │      UNIVERSITY            STUDENT                │
        │                                                   │
        │    ┌─────────┐           ┌─────────┐            │
        │    │ Comp Sci│           │ Gaming  │            │
        │    │ • 247   │           │ • 89    │            │
        │    └─────────┘           └─────────┘            │
        │    ┌─────────┐           ┌─────────┐            │
        │    │ Physics │           │ Photo   │            │
        │    │ • 134   │           │ • 56 ●  │            │
        │    └─────────┘           └─────────┘            │
        │                                                   │
        │                                                   │
        │         👑                    🏠                  │
        │        GREEK              RESIDENTIAL            │
        │                                                   │
        │    ┌─────────┐           ┌─────────┐            │
        │    │ Alpha   │           │ Ellicott│            │
        │    │ Chi ●   │           │ • 312   │            │
        │    └─────────┘           └─────────┘            │
        │    ┌─────────┐           ┌─────────┐            │
        │    │ Sigma Nu│           │Governors│            │
        │    │ • 178   │           │ • 89 ●  │            │
        │    └─────────┘           └─────────┘            │
        │                                                   │
        └───────────────────────────────────────────────────┘

        [Filter: Show My Spaces] [Show Active Only] [Show All]

                                                    ↓ SCROLL
───────────────────────────────────────────────────────────────
                    YOUR SPACES (Pinned Bar)
───────────────────────────────────────────────────────────────

        ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
        │  CSE   │ │ Study  │ │ Gaming │ │ Debate │
        │  250   │ │ Group  │ │ Club   │ │ Team   │
        │  • 23  │ │  • 5   │ │  • 12  │ │  • 8   │
        └────────┘ └────────┘ └────────┘ └────────┘

═══════════════════════════════════════════════════════════════
```

### Motion Sequence

```
1. Page load
   └─ Territory quadrants fade in (stagger: 150ms each)
   └─ Space cards within territories float in (from their territory center)
   └─ Gold dots pulse on active spaces

2. Hover territory
   └─ Territory expands slightly (scale: 1.02)
   └─ Space cards within become brighter
   └─ Gold border appears around territory

3. Scroll down
   └─ Your Spaces bar sticks to top
   └─ Territory map remains scrollable below
```

### Pros ✓
- **Visual metaphor** — Spaces as physical locations
- **Unique** — No one else does this
- **Territory clarity** — Categories are spatial, not tabs
- **Playful** — Feels like exploring a map

### Cons ✗
- **Complex to build** — Requires layout algorithm
- **Unconventional** — Users may not understand initially
- **Scaling challenge** — What if 500+ spaces?
- **Mobile nightmare** — Pinch-zoom? Or redesign entirely?

### Best For
- **Brand differentiation** — Looks unlike any other platform
- **Campus identity** — Emphasizes place-based community
- **Exploration mindset** — Discovery over efficiency

---

## Side-by-Side Comparison

| Criteria | Option A: Scroll Story | Option B: Dashboard | Option C: Territory Map |
|----------|----------------------|-------------------|----------------------|
| **First impression** | Dramatic, guided | Dense, informative | Unique, playful |
| **Speed to target** | Medium (scroll) | Fast (scan) | Slow (explore) |
| **Mobile UX** | Excellent | Challenging | Difficult |
| **Motion appeal** | High (like /about) | Low | Medium |
| **New user clarity** | Excellent | Overwhelming | Confusing |
| **Power user efficiency** | Medium | High | Low |
| **Brand differentiation** | Medium | Low | Very High |
| **Build complexity** | Medium | Low | High |
| **Scalability** | Excellent | Good | Questionable |

---

## Recommendation: Option A (Scroll Story)

**Why:**

1. **Aligns with `/about` motion language** — You explicitly requested similar transitions
2. **Progressive disclosure** — Doesn't overwhelm, guides naturally
3. **Mobile-first** — Vertical scroll is native gesture
4. **Clear hierarchy** — Each zone has a purpose
5. **Scalable** — Works with 10 spaces or 1000
6. **Build-ready** — We have the motion primitives from `/about`

**The core insight:** Discovery Hub isn't just a directory. It's the **first moment** users understand what Spaces are. Option A tells that story with motion and structure, not just content density.

---

## Variations on Option A (to discuss)

### Variation 1: Compact Hero

**Change:** Reduce "Your Spaces" from 8 cards → 4 cards above fold

**Tradeoff:**
- ✓ Faster scroll to discover territories
- ✗ Less immediate visibility of your spaces

### Variation 2: Territory Previews Above Fold

**Change:** Show territory preview badges in hero, expand on scroll

```
Above fold:
  Your Spaces (4 cards)
  ─────────────────────
  Explore: [🏛️ University] [✨ Student] [👑 Greek] [🏠 Residential]
           (clicking scrolls to that territory zone)

Scroll:
  Each territory expands with full card grid
```

**Tradeoff:**
- ✓ Clearer navigation structure
- ✗ Adds complexity to hero

### Variation 3: Hybrid Sticky Nav

**Change:** After scroll past hero, "Your Spaces" becomes sticky top bar

```
┌─────────────────────────────────────────────────┐
│ [CSE 250 • 23] [Study] [Gaming • 12] [+5] [All]│ ← Sticky after scroll
└─────────────────────────────────────────────────┘
```

**Tradeoff:**
- ✓ Quick access to your spaces while browsing
- ✗ Reduces content viewport height

---

## Questions to Answer

1. **Do you want Option A as-is, or with one of the variations?**
2. **Should we prototype Option A first, or do you want to see Option C explored more?**
3. **How many "Your Spaces" cards should show above fold? (4, 6, or 8?)**
4. **Should territories have persistent nav, or only discoverable via scroll?**

---

**Next Step:** Lock Option A design, then I'll wireframe the remaining pages (Browse, Space Residence, etc.) one by one using the same ASCII style.
