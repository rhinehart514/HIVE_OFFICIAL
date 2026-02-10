# HIVE — IA + System Spec

> Campus operating system. Discord-style sidebar IA.
> Pre-populated from UB RSS data. No cold start. Launching to all of UB.

---

## What Exists Today (Audit Summary)

### Built & Working
- Split-panel layout (200px sidebar + chat + input)
- Space header with identity, member count, social links, health badge, mute, leader actions
- Chat with real-time Firebase, replies, reactions, pins, typing indicators, image upload
- Slash command parser (poll, rsvp, countdown, announce, automate, welcome, remind, help)
- Slash command autocomplete menu in chat input
- Sidebar: boards list, tools list (with SidebarToolCard), members preview
- Threshold/join gate: gathering threshold, glass barrier, join ceremony
- Member management + moderation
- Events tab
- Analytics panel
- Space settings
- Board system (multiple boards per space, unread badges)
- Inline tool rendering in chat messages (InlineElementRenderer)
- Tool deployment to spaces (pinned tools)
- 337 API routes backing everything

### What's Wrong (Design System Violations)
- `animate-pulse` on online indicator (AI-ish)
- `backdrop-blur-sm` on mobile sidebar (frosted glass)
- `rounded-xl` / `rounded-2xl` buttons instead of `rounded-full` pills
- `bg-white/[0.04]`, `bg-white/[0.06]`, `bg-white/[0.08]` — too many opacity tiers (should be 2: white and white/50)
- Warm grays, zinc references may exist
- SpaceHealthBadge with animated dots (AI-ish)
- Entrance animations everywhere (motion should communicate state, not decorate)
- Crown icon for verified (not in design system)

### What's Missing
- Leader dashboard / management view INSIDE the space
- Claiming flow for pre-populated UB spaces
- RSS event integration (events from UB data surfaced in spaces)
- Leader reordering of pinned tools (drag to reorder)
- Leadership transfer flow
- Space templates ("run your space like X")
- Analytics that matter (engagement visibility, not vanity)
- Automation status visibility for leaders
- Quick inline creation beyond slash commands (FAB or "+" in sidebar)

---

## Redesigned Space Architecture

### Layout

```
┌────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ [Avatar] Space Name @handle · 42 members                │
│                                    [Members] [+] [⚙]   │
├──────────┬─────────────────────────────────────────────┤
│ SIDEBAR  │ MAIN CONTENT                                │
│ 200px    │                                              │
│          │ #board-name                        [search]  │
│ PINNED   │─────────────────────────────────────────────│
│ ┊ RSVP   │                                              │
│ ┊ Poll   │  Chat messages                               │
│ ┊ Signup │  with inline tools                           │
│          │                                              │
│ EVENTS   │                                              │
│ ┊ Fri 8p │                                              │
│ ┊ Sat 2p │                                              │
│          │                                              │
│ ─────── │                                              │
│ MEMBERS  │                                              │
│ 5 online │                                              │
│          │──────────────────────────────────────────────│
│          │ INPUT                                         │
│          │ [📎] [Type a message... /commands]    [Send] │
└──────────┴─────────────────────────────────────────────┘
```

### Mobile
- Sidebar collapses to bottom sheet (swipe up)
- Header compresses to avatar + name + hamburger
- Input stays fixed at bottom
- Pinned tools accessible from sheet

---

## Header

### All Users
- Space avatar (40px)
- Space name (Clash Display, semibold)
- `@handle` (Geist Mono, white/50)
- Member count (white/50)
- Online count — static dot (NOT animated pulse), emerald color, only if > 0

### Members Only (additional)
- Mute/unmute notifications
- Settings (leads to space settings or leave)

### Leaders Only (additional)
- `[+]` button — quick create menu (poll, RSVP, signup, countdown, event, AI prompt, open builder)
- Members management shortcut
- Moderation queue indicator (if items pending)

### Design Rules
- Height: 56px
- No entrance animation on header
- No health badge (remove — AI-ish gamification)
- No crown icon for verified (use simple checkmark or nothing)
- Social links: keep but simplify — icons only, white/50, no border separator

---

## Sidebar (200px)

### Sections (top to bottom)

**1. Pinned Infrastructure**
Label: `PINNED` (Geist Mono, 10px, uppercase, white/50)

Each pinned item:
- Icon + name (Geist, 14px, white)
- Unread indicator: solid yellow dot (4px, static, NOT animated)
- Click → opens tool in main content area (overlay or inline, TBD)
- Leaders can drag to reorder
- Leaders see `[+ Add]` button at bottom (dashed border)

**2. Events**
Label: `EVENTS` (Geist Mono, 10px, uppercase, white/50)

- Next 3 upcoming events
- Each: name + date/time (Geist Mono, white/50)
- Source badge: `UB` for RSS events, none for student-created
- Click → event detail (RSVP + countdown + details)
- Leaders see `[+ Event]` button

**3. Members (bottom, border-top)**
- Online count + avatar stack (max 5)
- Click → full members list

### Leader Mode (sidebar additions)
- Drag handles on pinned items (visible on hover)
- `[+ Add]` under pinned section — opens tool picker:
  - "Create new" (poll, signup, RSVP, countdown, event)
  - "From your builds" (pick from HiveLab creations)
  - "From templates" (pick a template)
  - "Describe with AI" (text input)

### Design Rules
- 12px padding
- No boards list (REMOVED — simplify to single chat + pinned tools)
- Section gap: 16px
- No hover lift/scale on items
- Transition: colors only, 150ms

---

## Main Content (Chat)

### Board Header
- Simplified: just `# general` or space name
- Search icon (opens search overlay)
- No board switching (single board per space for now — simplification)

### Message Feed
- Messages grouped by sender (consecutive messages within 5 min)
- Avatar (32px) + display name (Geist, medium, white) + timestamp (Geist Mono, 10px, white/50)
- Message text (Geist, 14px, white)
- Replies: indented with thin left border (white/10)
- Reactions: pill badges below message
- Inline tools: rendered via InlineElementRenderer within message flow
- Unread divider: horizontal line with "New" label (yellow)
- Load more: subtle "Load earlier messages" at top

### Design Rules
- No message entrance animations (messages appear instantly)
- No hover background change on messages
- Pin indicator: small 📌 icon next to timestamp, static
- Image attachments: rounded-lg (12px), max-width 400px

---

## Chat Input

### Layout
```
[📎] [                                          ] [Send]
       Type a message... or /command
```

### Behavior
- Textarea, auto-resize (max 120px height)
- Enter to send, Shift+Enter for newline
- `/` triggers slash command menu (above input)
- Image upload via attachment button
- Send button: yellow fill when content present, disabled state otherwise

### Slash Commands (existing, keep all)
- `/poll "Question?" Option1 Option2` — creates inline poll
- `/rsvp "Event Name"` — creates inline RSVP
- `/countdown "Title" date` — creates inline countdown
- `/announce Message` — posts announcement
- `/automate type "Name"` — creates automation
- `/welcome "Message"` — sets welcome message
- `/remind minutes` — sets event reminders
- `/help` — shows help

### Slash Menu Design
- Floating above input, same width
- Dark surface (`#000` with white/6 border)
- Items: icon + command name + description
- Keyboard nav (↑↓ + Tab/Enter)
- No decorative icons — Geist Mono for command names

### Design Rules
- Input: `rounded-full` (pill shape), bg white/4, border white/6
- Send button: `rounded-full`, yellow when active
- Attachment button: `rounded-full`, ghost
- No focus ring glow — just border change to white/10
- No typing indicator dots (AI-ish) — text-based "X is typing..." in white/30

---

## Threshold / Join Flow

When a non-member visits a space:

### What They See
- Space identity (name, avatar, member count, description)
- Preview of pinned infrastructure (read-only, blurred or dimmed)
- Preview of recent chat (last 5 messages, blurred)
- `[Join Space]` button (yellow pill, primary CTA)
- `[View Events]` button (ghost pill) — can see events without joining

### After Joining
- Immediate access to chat + pinned tools
- Welcome message if configured (via `/welcome` automation)
- Appear in members list

### Claiming (Pre-populated Spaces)
When a space exists from RSS data but no one has claimed it:
- All users see the space with its UB data (events, description)
- `[Claim This Space]` CTA (yellow pill)
- Claiming requires: .edu verified account
- After claiming: user becomes leader, can customize, add infrastructure

### Design Rules
- Kill: glass-barrier.tsx (frosted glass effect)
- Kill: join-ceremony.tsx (ceremonial animation)
- Kill: gathering-threshold.tsx (complex gathering state)
- Replace with: clean, minimal threshold. Black bg, white text, yellow CTA. Done.

---

## Events in Spaces

### Sources
1. **RSS/UB data** — pre-populated from Firebase. These events exist before any user action.
2. **Student-created** — via `/event` slash command, sidebar `[+ Event]`, or HiveLab

### Event Display
- Upcoming events in sidebar (next 3)
- Full events list accessible via "See all events"
- Each event card:
  - Name (Clash Display, 16px)
  - Date/time (Geist Mono, white/50)
  - Source badge: `UB` for RSS (Geist Mono, 10px, white/30 border pill)
  - RSVP count if has RSVP tool attached
  - Status: upcoming / live / past

### RSS → RSVP Bridge
Key feature: a leader (or any member) can "enhance" an RSS event:
- Tap RSS event → "Add RSVP" → creates an RSVP tool linked to this event
- Now the event has interactive infrastructure on top of the static RSS data
- This is the core loop: existing data → student enhancement → infrastructure compounds

---

## Leader Dashboard (NEW — inside the space)

Not a separate page. A panel or overlay within the space.

### Access
- Leader taps their avatar/settings or a dashboard icon in header
- Slides in from right or opens as a tab

### Contents

**Quick Stats**
- Members: total, active this week, new this week
- Messages: this week vs last week
- Tool interactions: total this week
- Trend arrows (up/down vs last period)

**Pinned Tools Performance**
- Each pinned tool: name + interactions this week
- Which tools are used vs ignored
- Suggestion: "Your signup sheet has 0 interactions — consider unpinning"

**Automation Status**
- Active automations list
- Last fired, next scheduled
- Error count

**Quick Actions**
- Invite link (copy)
- Transfer leadership
- Export member list
- Space settings

### Design Rules
- Minimal. Numbers + labels. No charts for now.
- White text, white/50 secondary. Yellow for attention items.
- No decorative elements.

---

## UB Data Integration

### What's in Firebase (from RSS ingestion)
- Campus spaces (orgs from UBLinked)
- Campus events (from UB event feeds)
- Campus data (dining, buildings, study spots)

### How It Surfaces

**Discover page:**
- Pre-populated spaces appear in campus discover
- Pre-populated events appear in campus events
- Spaces show "Claim" vs "Join" based on whether someone has claimed them

**Inside a space:**
- RSS events auto-populate the events section
- Space description/metadata from UBLinked data
- Social links from UBLinked data

**The enhancement loop:**
1. Student finds their club on Discover (pre-populated from UB data)
2. They claim it (become leader)
3. RSS events are already showing in the events section
4. They add RSVP tools to events, create polls in chat, pin signup sheets
5. Infrastructure builds on top of existing data
6. Next semester's leaders inherit everything

---

## What to Kill

| Component | Why |
|-----------|-----|
| `glass-barrier.tsx` | Frosted glass effect |
| `join-ceremony.tsx` | Ceremonial animation, AI-ish |
| `gathering-threshold.tsx` | Over-engineered, complex state |
| `SpaceHealthBadge` | Gamification, AI-ish animated dots |
| `boards-list.tsx` | Simplify to single board (chat) |
| `board-item.tsx` | Goes with boards removal |
| `board-creation-modal.tsx` | Goes with boards removal |
| Online pulse animation | Static dot instead |
| `activity-preview.tsx` | Part of threshold overhaul |
| `familiar-faces.tsx` | Part of threshold overhaul |

## What to Wire (exists but broken/disconnected)

| Fix | Priority | Complexity |
|-----|----------|------------|
| Wire `_sidebarTools` → sidebar `tools` prop (currently `[]`) | P0 | Trivial |
| Wire claiming flow (backend `claim/route.ts` exists, need UI) | P0 | Low |
| Wire events from Firebase into sidebar (data exists, not surfaced) | P0 | Low |
| Wire `transfer-ownership` API to UI (API exists, UI has dropdown) | P0 | Trivial |

## What to Build

| Feature | Priority | Complexity |
|---------|----------|------------|
| Leader `[+]` create menu | P0 | Medium |
| Clean threshold (replace 5 files with 1) | P0 | Low |
| Events section in sidebar (from Firebase data) | P0 | Medium |
| Claiming flow UI for unclaimed spaces | P0 | Low (backend exists) |
| RSS → RSVP bridge ("Add RSVP to event") | P1 | Medium |
| Leader dashboard panel | P1 | Medium |
| Automation status visibility | P2 | Low |
| Space templates | P2 | Medium |
| Single-board simplification (remove board switching) | P0 | Low |

## What to Reskin (Design System)

Every component gets rebuilt on the cold design system:
- All buttons → `rounded-full` pills
- All text → two tiers only (white, white/50)
- All surfaces → `#000000` ground, white/6 borders
- All motion → state-communicating only, no decorative entrance animations
- Typography → Clash Display headlines, Geist body, Geist Mono labels
- Yellow `#FFD700` → primary buttons and active states ONLY

---

## Implementation Order

### Phase 1: Foundation (Day 1)
1. Kill listed components (boards system, threshold ceremony, health badge)
2. Simplify layout to single-board chat
3. Reskin header, sidebar, input, main content on design system
4. Clean threshold: one component, black bg, yellow CTA

### Phase 2: Leader Experience (Day 2)
5. Leader `[+]` create menu in header
6. Pinned tools reordering
7. Events section in sidebar (read from Firebase)
8. Claiming flow for unclaimed spaces

### Phase 3: Enhancement (Day 3)
9. RSS → RSVP bridge
10. Leader dashboard panel
11. Leadership transfer
12. Polish, test end-to-end

---

*This spec is the source of truth for the Spaces rebuild. All implementation should reference this document.*
