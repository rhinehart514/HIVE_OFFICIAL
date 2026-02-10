# HIVE — Build Plan

> Reference: `IA-SPEC.md` for architecture, `DESIGN-2026.md` for design system.
> Goal: Ship to all of UB. No cold start. Campus alive on arrival.

---

## Phase 1: App Shell (Do First — Everything Depends On This)

### Kill
- [ ] Current bottom nav (`BottomNav.tsx`)
- [ ] Current `CampusShellProvider` wrapper (CommandBar + CampusDock + CampusDrawer)
- [ ] Tab-based navigation (Discover | Spaces | You)

### Build: Sidebar Nav
**File:** New component `apps/web/src/components/shell/AppSidebar.tsx`

```
Desktop (≥768px): Fixed left, 72px wide
Mobile (<768px): Hidden, swipe from left edge or tap hamburger to reveal

Structure:
┌────┐
│ 🏠 │  ← Home icon. Active: yellow fill. Inactive: white/50.
│    │
│ ── │  ← 1px line, white/[0.06], 48px wide, centered
│    │
│ CS │  ← Space icons: 48px rounded-2xl, space avatar or initials
│ PM │     Active: yellow ring (2px border)
│ DM │     Unread: yellow dot (4px, top-right, static)
│ GK │     Unclaimed: white/10 opacity (ghost)
│    │     Hover: white/[0.06] bg
│ ── │
│    │
│ +  │  ← Join/create. 48px circle, dashed white/[0.06] border, white/50 "+"
│    │     Tap → dropdown: "Join a space" / "Create a space"
│ ── │
│    │
│ 👤 │  ← Your avatar, 48px rounded-full. Active: yellow ring.
└────┘
```

**Behavior:**
- Spaces ordered by: last activity (most recent at top)
- Tap space icon → loads space in main content area (no page navigation, client-side switch)
- Tap home → loads home feed
- Tap avatar → loads profile/settings
- Scrollable if many spaces (thin scrollbar, white/10)

**State:**
- `activeView: 'home' | 'space' | 'profile'`
- `activeSpaceHandle: string | null`
- Persist active view in URL: `/` = home, `/s/[handle]` = space, `/me` = profile

### Build: Main Layout Shell
**File:** Update `apps/web/src/app/layout.tsx` or new `apps/web/src/components/shell/AppShell.tsx`

```
Desktop:
┌────┬──────────────────────────────┐
│ 72 │         Main Content         │
│ px │      (home / space / me)     │
│    │                              │
│side│                              │
│bar │                              │
└────┴──────────────────────────────┘

Mobile:
┌──────────────────────────────┐
│ Header              [≡] [+] │
│                              │
│         Main Content         │
│                              │
└──────────────────────────────┘
[≡] reveals sidebar as overlay from left
```

### Build: Global FAB
**File:** New component `apps/web/src/components/shell/GlobalFAB.tsx`

```
Position: bottom-right, 24px from edges
Size: 56px circle, yellow #FFD700, black "+" icon
Shape: rounded-full

Tap → menu expands upward:
├── "Poll" (icon + label)
├── "RSVP" 
├── "Signup"
├── "Countdown"
├── "Event"
├── ── separator ──
├── "Describe with AI" 
├── "Open Builder" (→ /lab)
└── "Create a space" (if on home)

Context-aware (cheap conditionals):
- In a space with 0 tools → first item is "Add a tool" 
- On an RSS event → first item is "Add RSVP"
- In a space → items create within that space context
- On home → items create standalone

Menu items: black bg, white/[0.06] border, rounded-xl
Each item: icon (white/50) + label (Geist, 14px, white)
Hover: white/[0.06] bg
```

**Design rules:**
- No gradients on FAB (flat yellow)
- No shadow on FAB
- No hover scale on FAB
- Menu backdrop: click outside to close
- Menu animation: opacity + translateY, 150ms, no stagger

---

## Phase 2: Home Page (Campus Feed)

### Kill
- [ ] Current landing page for logged-in users (whatever they see now)
- [ ] Current discover page routing (merge into home)

### Build: Home Feed
**File:** New component `apps/web/src/app/home/HomeFeed.tsx` or update existing

**Sections (top to bottom):**

#### 1. HAPPENING NOW
- Label: `HAPPENING NOW` (Geist Mono, 10px, uppercase, white/50)
- Horizontal scroll of active creation cards
- Each card: tool name, type icon, key metric ("89 votes", "3 days left", "12/20 spots")
- Card: white/[0.06] border, rounded-xl, 200px wide, no shadow
- Tap → opens `/t/[toolId]` or navigates to the space
- Source: query active tools across all campus spaces, sort by interaction velocity
- API: `GET /api/tools/browse?campusId=ub&status=active&sort=velocity`

#### 2. UPCOMING EVENTS
- Label: `UPCOMING EVENTS` (Geist Mono, 10px, uppercase, white/50)
- Vertical list, max 5 shown, "See all →" link
- Each row: event name · date (Geist Mono, white/50) · RSVP count or status
- RSS events show `UB` badge (Geist Mono, 9px, white/20 border pill)
- Student-created events show space name
- Sort: urgency (soonest first, but events with tools/RSVPs boosted)
- Source: Firebase events collection, campus-scoped
- API: `GET /api/events?campusId=ub&upcoming=true&limit=5`

#### 3. SPACES TO JOIN
- Label: `SPACES TO JOIN` (Geist Mono, 10px, uppercase, white/50) + `See all →`
- Horizontal scroll or grid of space cards
- Each card: avatar + name (Clash Display, 14px) + member count (white/50) + claimed/unclaimed state
- Unclaimed: ghost styling (white/10 border, "Claim" badge)
- Claimed: normal styling
- Sort: member count desc, then activity
- Source: browse spaces API
- API: `GET /api/spaces/browse-v2?campusId=ub&limit=12`

#### 4. CAMPUS (conditional — only in campus mode)
- Dining spots open now
- Study spots with availability
- Only show if campus data exists
- Source: existing campus APIs

**Time-aware sorting logic:**
```
urgencyScore = (
  (hasDeadline ? (1 / hoursUntilDeadline) * 100 : 0) +
  (interactionsLastHour * 2) +
  (isToday ? 50 : 0) +
  (isTomorrow ? 25 : 0)
)
```

---

## Phase 3: Space Integration

### Already done (from today's work):
- [x] Boards killed, single chat view
- [x] Threshold simplified
- [x] Sidebar tools wired
- [x] Leader FAB created

### Wire into new shell:
- [ ] Space loads in main content area when sidebar icon tapped
- [ ] Space header adapts (no back button on desktop — sidebar handles nav)
- [ ] Mobile: space is full screen, ← back goes to home, [≡] opens space sidebar as sheet

### Remaining space work:
- [ ] Events section in space sidebar — fetch from Firebase, show next 3
- [ ] Claiming flow — "Claim This Space" button on threshold for unclaimed spaces, calls `POST /api/spaces/claim`
- [ ] Claiming moment — sidebar icon transitions from ghost to active
- [ ] Leader FAB design system fix — kill gradients/shadows/scale, flat yellow
- [ ] Intelligent slash commands — read last 5 messages, suggest relevant command first

### Space design system pass:
- [ ] Header: kill `animate-pulse`, kill health badge, kill crown → static dots, pill buttons
- [ ] Chat input: `rounded-full` pill, yellow send button, slash menu on `#000` bg
- [ ] Messages: no entrance animation, Geist Mono timestamps, two text tiers only
- [ ] Sidebar: Geist Mono section labels, white/[0.06] borders, no hover lift
- [ ] Threshold: kill `animate-pulse` on online dot → static
- [ ] Members preview: static online dot

---

## Phase 4: Global Design System Pass

After shell + home + spaces are wired, sweep everything else:

### Landing Page (logged out)
- [ ] Rewrite headline — specific to UB students
- [ ] Kill fake poll demo
- [ ] One CTA: "Join UB" yellow pill
- [ ] Design system: black bg, Clash headline, two text tiers, no entrance animations

### Enter/Login Flow
- [ ] Design system pass — pill buttons, cold surfaces, no warm grays
- [ ] Verify OTP flow works end-to-end

### Profile (/u/[handle])
- [ ] Design system pass
- [ ] "Your Creations" section shows tools with stats
- [ ] Loads in main content area when 👤 tapped

### Lab (/lab)
- [ ] Simplify entry: AI prompt prominent, vertical templates
- [ ] Accessible from FAB → "Open Builder"
- [ ] Design system pass

### Standalone Tool (/t/[toolId])
- [ ] Kill backdrop-blur on header
- [ ] Pill buttons
- [ ] "Back" → `/` for anonymous users (not /discover)
- [ ] Verify OG tags work for link sharing

### Settings
- [ ] Design system pass on all settings panels
- [ ] Pill buttons, two text tiers

---

## Phase 5: End-to-End Testing

Full user journeys — every one of these must work:

- [ ] **New user:** Land on homepage → "Join UB" → enter flow → OTP → land in app with sidebar full of UB spaces
- [ ] **Join a space:** See space on home → tap → threshold → join → in chat
- [ ] **Claim a space:** Find unclaimed space → claim → become leader → icon goes from ghost to active
- [ ] **Create inline:** In space chat → `/poll "Best day?" Mon Tue Wed` → poll appears inline → others vote
- [ ] **Create from FAB:** Tap + → "Poll" → create → it exists in current space or standalone
- [ ] **Share a tool:** Copy `/t/[id]` link → open in incognito → interact without account
- [ ] **Leader manages:** Pin a tool → reorder → see stats → create event
- [ ] **Mobile:** Everything above on phone-sized screen

---

## Phase 6: Ship

- [ ] Final grep sweep: `animate-pulse`, `backdrop-blur`, `hover:scale`, `bg-gradient`, `rounded-xl` on buttons, `shadow-lg`
- [ ] Mobile test on real device
- [ ] Deploy to production
- [ ] Verify RSS data shows in production Firebase
- [ ] Launch to UB

---

## Not This Week

- Leader dashboard panel (stats, tool performance)
- Space templates ("run your space like X")
- Automation status visibility
- Settings full reskin (functional, not pretty)
- Cross-tool connections
- Payments / dues
- Any new elements
- buffaloprojects.com (separate track)

---

## File Map (key files to create/modify)

### New Files
```
apps/web/src/components/shell/AppSidebar.tsx    — sidebar nav
apps/web/src/components/shell/AppShell.tsx       — main layout shell
apps/web/src/components/shell/GlobalFAB.tsx      — floating action button
apps/web/src/app/home/HomeFeed.tsx               — campus feed (or update existing)
```

### Key Modifications
```
apps/web/src/app/layout.tsx                      — swap shell
apps/web/src/app/page.tsx                        — home route
apps/web/src/app/s/[handle]/page.tsx             — wire into shell
apps/web/src/app/s/[handle]/components/*         — design system pass
apps/web/src/components/landing/*                — logged-out redesign
apps/web/src/app/enter/page.tsx                  — design system pass
apps/web/src/app/u/[handle]/*                    — design system pass
apps/web/src/app/t/[toolId]/*                    — design system pass
```

### Kill
```
apps/web/src/components/nav/BottomNav.tsx         — replaced by sidebar
apps/web/src/app/campus-provider.tsx              — replaced by shell (or simplify heavily)
apps/web/src/components/landing/ProductSection.tsx — kill or rewrite
apps/web/src/components/landing/CTASection.tsx     — kill
```

---

*Start with Phase 1. Everything else depends on the shell.*
