# HIVE — Information Architecture Spec
> Feb 9 2026 — Locked.

## What HIVE Is
Campus operating system. Not SaaS. Not a tool. A place where campus life happens — built by students, powered by campus data. Discord's IA model + campus content + creation engine.

## Launch Context
- Launching to ALL of UB, not 5 people. Two years of hype.
- UB RSS events + 200+ pre-seeded spaces already in Firebase.
- Campus data (dining, buildings, study spots) already built.
- No cold start — campus is there before anyone signs up.

---

## IA Structure

### Sidebar (left, always visible on desktop)
```
┌────┐
│ 🏠 │  Home — campus feed, discover, events
│    │
│ ── │
│    │
│ CS │  Your spaces (joined/claimed UB orgs)
│    │  - Unread: solid yellow dot, static
│ PM │  - Active: yellow ring / highlight
│    │  - Shows space avatar/initials
│ DM │
│    │
│ GK │
│    │
│ ── │
│    │
│ +  │  Join / create a space
│    │
│ ── │
│    │
│ 👤 │  You — profile, creations, settings
└────┘
```

### Main Destinations

**Home (🏠)**
Your campus, alive. Not a directory — a feed of what's happening.
- HAPPENING NOW — active polls, signups, countdowns across campus
- UPCOMING EVENTS — from RSS + student-created, with RSVP counts
- SPACES TO JOIN — pre-populated UB orgs, browsable
- Campus data surfaces (dining, study spots) when relevant

**Space (/s/[handle])**
Where communities live. Chat-first with infrastructure.
- Chat (main view, real-time, inline tools via slash commands)
- Sidebar (200px): pinned tools, events, members
- Leader controls inline (create menu, reorder pins, stats)
- Threshold for non-members (simplified — one card, yellow join button)

**You (👤)**
Your identity on HIVE.
- Profile (/u/[handle]) — name, spaces, creations, activity
- Your creations — everything you've built
- Settings

**Lab (/lab)** — NOT in sidebar
Accessed via:
- FAB → "Open Builder"
- Profile → "Your Creations" → edit
- Space → "Add Tool" → "Build new"

Contains:
- Creations dashboard
- AI composition (one prompt → full system)
- Canvas IDE (power users)
- Templates (vertical solutions: Club, Greek Life, Study Group, Event, Dorm)

### Global FAB (+)
Always visible. Context-aware.

**In a space (leader):**
- Create poll / signup / RSVP / countdown / event (quick)
- Describe with AI
- Open Builder
- Dashboard

**On home / anywhere:**
- Create poll / signup / RSVP / countdown / event
- Describe with AI
- Open Builder
- Create a space

### Slash Commands (inside space chat)
Primary creation surface for 90% of users.
- `/poll "Question?" Option1 Option2`
- `/rsvp "Event Name"`
- `/countdown "Title" date`
- `/announce Message`
- `/automate type "Name"`
- `/welcome "Message"`
- `/remind minutes`
- `/help`

---

## Layouts

### Desktop (1440px+)

**Home:**
```
┌────┬──────────────────────────────────────┐
│    │ 🏠 UB                    [🔍] [+]   │
│ 🏠 ├──────────────────────────────────────┤
│    │                                      │
│ ── │ HAPPENING NOW                        │
│    │ ┌─────────────┐ ┌─────────────┐      │
│ CS │ │ SGA Poll    │ │ Rush Signup │      │
│    │ │ 89 votes    │ │ 3 days left │      │
│ PM │ └─────────────┘ └─────────────┘      │
│    │                                      │
│ DM │ UPCOMING EVENTS                      │
│    │ ├ Career Fair · Wed · 142 going      │
│ GK │ ├ SGA Meeting · Thu · poll open      │
│    │ └ Greek Social · Fri · signup        │
│ ── │                                      │
│    │ SPACES TO JOIN              See all → │
│ +  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│    │ │CS    │ │Eng   │ │Pre-  │ │Dorm  │ │
│ ── │ │Club  │ │Soc   │ │Med   │ │Gov   │ │
│ 👤 │ │48 mem│ │120mem│ │65 mem│ │30 mem│ │
│    │ └──────┘ └──────┘ └──────┘ └──────┘ │
└────┴──────────────────────────────────────┘
```

**Inside a Space:**
```
┌────┬────────┬─────────────────────────────┐
│    │SIDEBAR │ # general            [🔍]   │
│ 🏠 │200px   ├─────────────────────────────┤
│    │        │                             │
│ ── │ PINNED │  [avatar] Jake  2:41pm      │
│    │ ┊ RSVP │  who's coming friday?       │
│ CS │ ┊ Poll │                             │
│ ◉  │ ┊ Sign │  ┌─ POLL ─────────────┐    │
│ PM │        │  │ Friday?             │    │
│    │ EVENTS │  │ ■■■■■■■ Yes (24)    │    │
│ DM │ ┊ Fri  │  │ ■■■ No (11)        │    │
│    │ ┊ Sat  │  │ ■■ Maybe (7)       │    │
│ GK │        │  └────────────────────┘    │
│    │ ────── │                             │
│ ── │ MEMBERS│  [avatar] Sarah  2:43pm     │
│    │ 5 on   │  im down, what time?        │
│ +  │        │                             │
│    │        ├─────────────────────────────┤
│ ── │        │ [📎] [message...]    [Send] │
│ 👤 │        │                             │
└────┴────────┴─────────────────────────────┘
```

### Mobile (< 768px)

**Home:**
```
┌──────────────────────┐
│ 🏠 UB      [🔍] [+] │
├──────────────────────┤
│                      │
│ YOUR SPACES          │
│ [CS] [PM] [DM] [GK] │  ← horizontal scroll
│                      │
│ HAPPENING NOW        │
│ ┌──────────────────┐ │
│ │ SGA Poll · 89    │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ Rush Signup · 3d │ │
│ └──────────────────┘ │
│                      │
│ UPCOMING             │
│ ├ Career Fair · Wed  │
│ ├ SGA Meeting · Thu  │
│ └ Greek Social · Fri │
│                      │
│ SPACES TO JOIN       │
│ ┌──────┐ ┌──────┐   │
│ │CS    │ │Eng   │   │
│ │Club  │ │Soc   │   │
│ └──────┘ └──────┘   │
└──────────────────────┘
```

**Space (mobile):**
```
┌──────────────────────┐
│ ← CS Club   [≡] [+] │
├──────────────────────┤
│                      │
│  [Jake] 2:41pm       │
│  who's coming friday?│
│                      │
│  ┌─ POLL ──────────┐ │
│  │ ■■■■■ Yes (24)  │ │
│  │ ■■ No (11)      │ │
│  └─────────────────┘ │
│                      │
│  [Sarah] 2:43pm      │
│  im down, what time? │
│                      │
├──────────────────────┤
│ [📎] [message] [Send]│
└──────────────────────┘

[≡] → sidebar as bottom sheet (pinned tools, events, members)
[←] → back to Home
[+] → FAB / quick create
```

---

## Campus Isolation

Same IA, different data per campus.

**UB (launch):** 200+ pre-populated spaces, RSS events, dining/buildings/study spots. Full experience day one.

**New campus (no data yet):** Same structure. Students create spaces from scratch. FAB + slash commands carry the experience. Home shows student-created content only. As students build, campus fills up. When RSS data arrives, it explodes.

**Scaling:** Add campus = add data layer. IA never changes. `useCampusMode` hook already handles the switch.

---

## What Lives Where

| Thing | Where it lives |
|-------|---------------|
| Campus feed | Home |
| Events (RSS + created) | Home + space sidebar |
| Spaces discovery | Home |
| Space chat | Inside space |
| Inline creation | Space chat (slash commands) |
| Quick creation | FAB (anywhere) |
| Complex creation | Lab (behind FAB) |
| Pinned tools | Space sidebar |
| Your creations | Profile + Lab |
| Your spaces | Sidebar icons |
| Campus data (dining etc) | Home + connected elements |
| Settings | You (👤) |
| Standalone tool | /t/[id] (public URL, no nav) |

---

## Design System (applied to all layouts)

- Ground: `#000000`
- Text: `#FFFFFF` + `rgba(255,255,255,0.5)` — two tiers only
- Yellow `#FFD700`: primary buttons, active states, unread dots, FAB — action only
- Fonts: Clash Display (space names, headlines), Geist (body/UI), Geist Mono (labels, timestamps, handles)
- Buttons: `rounded-full` pills
- Cards/surfaces: `white/[0.06]` border, no shadow, no hover lift
- Space icons: `rounded-2xl`, white/6 border, yellow ring when active
- Section labels: Geist Mono, 10px, uppercase, tracking-wide, white/50
- Motion: state-communicating only. No decorative entrance animations.
- No: gradients, glass/blur, shadows, pulse animations, hover scale, warm grays

---

---

## Cleverness Layer

### Intelligent Slash Commands (with motion)
When user types `/`, suggestions are context-aware based on recent messages in chat:
- Someone asked "when should we meet?" → suggest `/poll` first
- Someone said "who's coming?" → suggest `/rsvp` first
- Default order otherwise: poll, rsvp, countdown, event, announce
- Menu items animate in with subtle stagger (state-communicating, not decorative)
- Selected suggestion has smooth highlight transition

### Claiming Feels Like Power
When a user claims an unclaimed space:
- Sidebar icon transitions from `white/10` (ghost) to full color/initials
- Leader badge appears on the space
- Pinned tools section unlocks ("Add your first tool" prompt)
- RSS events get "Add RSVP" buttons that weren't visible before
- One-time, subtle, earned moment — not a ceremony

### Time-Aware Home Feed
Home feed is urgency-sorted, not chronological:
- Poll closing in 2 hours → top
- Event tomorrow → above event next week
- Signup almost full → above empty signup
- New space with activity → above dormant space
- Sort key: `urgencyScore = f(deadline proximity, interaction velocity, recency)`

### Context-Aware FAB
FAB shows one smart suggestion based on context:
- On an RSS event with no RSVP → "Add RSVP"
- In a space with zero tools → "Add a tool"
- In a space with no events → "Create an event"
- Otherwise → default create menu
- Implementation: simple conditional logic, not AI. Check current page + space state.

### Alive Sidebar Icons
Space icons in sidebar show minimal live state:
- Unread: solid yellow dot (4px, static)
- Unclaimed spaces: `white/10` ghost appearance
- Claimed/active: full appearance
- Optional: tiny count badge (unread message count) — only if trivial to implement

---

*This is the locked IA spec. All implementation references this document.*
