# Feed Surface — The Pulse

> **Route:** `/feed`
> **Purpose:** Campus pulse dashboard
> **Status:** Active (D1 sprint)

---

## The Job

**"What's happening on my campus right now?"**

The Feed is not:
- A social feed (posts, likes, comments)
- A notification center (alerts, badges, queues)
- A content consumption surface (scroll, discover, engage)

The Feed IS:
- A **campus pulse dashboard** — glanceable activity summary
- A **navigation launchpad** — quick access to your spaces
- A **discovery surface** — recommendations based on your campus
- A **builder showcase** — your HiveLab creations

---

## Primary Actions

1. **See what's happening today** — Live events, unread messages, urgent items
2. **Quick-access your spaces** — Navigate to home bases in one tap
3. **Discover new communities** — Recommendations based on campus activity
4. **Launch into building** — Access HiveLab and your tools

---

## Section Hierarchy

Sections are ordered by time-sensitivity and user relevance.

```
HIERARCHY (top to bottom):

1. TODAY
   └─ Urgent, time-sensitive
   └─ Events starting, live events, unread messages
   └─ Always visible (even if empty state)

2. YOUR SPACES
   └─ Navigation tiles to home bases
   └─ Max 3 shown + "Browse All" tile
   └─ Activity indicators (online dots, unread badges)

3. THIS WEEK
   └─ Upcoming events (not today)
   └─ Max 4 shown
   └─ Collapses to "All events" link if empty

4. YOUR CREATIONS (builders only)
   └─ HiveLab tools you've built
   └─ Max 3 shown + "Create Tool" tile
   └─ Response counts, deploy stats

5. DISCOVER
   └─ Personalized recommendations
   └─ Max 2 shown
   └─ Based on interests, campus activity

6. QUICK ACTIONS (sidebar, lg+ only)
   └─ Build a Tool
   └─ Start a Space
   └─ Browse Events
```

---

## Empty State Rules

**Section-level:**
- If a section is empty, show single-line action link (e.g., "Browse events →")
- Never collapse to nothing — always offer a next action

**Page-level:**
- If ALL sections are empty, show unified "Campus is quiet" state
- Primary action: "Create a space" or "Browse events"

---

## Visual Hierarchy

| Section | Priority | Treatment |
|---------|----------|-----------|
| TODAY | Primary | Elevated background, prominent title |
| YOUR SPACES | Secondary | Standard cards, activity indicators |
| THIS WEEK | Secondary | Compact list, time-based ordering |
| YOUR CREATIONS | Tertiary | Builder-only, lower visual weight |
| DISCOVER | Tertiary | Subtle suggestions, dismissible |

---

## Data Sources

| Section | API | Refresh |
|---------|-----|---------|
| TODAY | `/api/profile/dashboard` | On mount, 30s polling |
| YOUR SPACES | `/api/profile/my-spaces` | On mount |
| THIS WEEK | `/api/profile/dashboard` | On mount |
| YOUR CREATIONS | `/api/tools?limit=10` | On mount |
| DISCOVER | `/api/profile/dashboard?includeRecommendations=true` | On mount |

---

## States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton cards per section |
| **Empty (section)** | Action link, no visual gap |
| **Empty (page)** | Unified empty state with CTA |
| **Error** | Per-section error with retry |
| **Success** | Section cards with activity |

---

## Design Tokens

See `apps/web/src/app/feed/feed-tokens.ts` for:
- `FEED_HIERARCHY` — Background, border, title styles per priority
- `FEED_DENSITY` — Spacing and item counts per density mode

---

## Density Modes

Users can switch between three density modes:

| Mode | Gap | Padding | Items |
|------|-----|---------|-------|
| **Compact** | 4 | 3 | More items, less whitespace |
| **Comfortable** | 6 | 4 | Balanced (default) |
| **Spacious** | 8 | 5 | Fewer items, more breathing room |

Persisted to localStorage as `feed-density`.

---

## Motion

- Section stagger: 0.1s delay per section
- Card enter: fade up (20px → 0, opacity 0 → 1)
- Tilt on hover: 4-6 degrees based on section priority
- Gold pulse: Live events, presence indicators

---

## Accessibility

- Sections use `<section>` with `<h2>` headings
- Cards are focusable with keyboard navigation
- Loading states announced via aria-live regions
- Density toggle has tooltip labels
