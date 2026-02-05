# HIVE Product Map & Information Architecture

> **Purpose:** Master document for all page structure, navigation, layouts, and user journeys.
> **Last Updated:** 2026-01-17
> **Status:** Redesign in progress

---

## The Core Insight

HIVE is not a website to navigate. It's a world to inhabit.

```
OLD WEB THINKING              HIVE THINKING
─────────────────────         ─────────────────────
Homepage → Feature → Sub      You're outside → Find your place → You're home
Click through pages           Move between rooms
Navigate a product            Live somewhere
```

---

## The Four Pillars

Every page belongs to one of four pillars:

| Pillar | What It Is | Primary URL | Status |
|--------|------------|-------------|--------|
| **Community** | Student-owned Spaces | `/spaces`, `/s/[handle]` | 96% |
| **Creation** | HiveLab tools | `/tools`, `/tools/[id]` | 100% |
| **Connection** | Social graph | `/u/[handle]`, `/profile` | 75% |
| **Intelligence** | AI enhancement | Invisible layer | Integrated |

---

## User Archetypes & Their Journeys

### The Leader
> "I want to OWN something. Build my community. See my impact."

**Journey:** Land → Find org → Claim → Build → Grow
**Key pages:** `/spaces/claim`, `/s/[handle]?view=settings`, `/s/[handle]/analytics`
**Success metric:** Time to first claimed Space

### The Lost Freshman
> "I don't know anyone. Where do I belong?"

**Journey:** Land → Browse → Preview → Join → Participate
**Key pages:** `/spaces`, `/s/[handle]` (preview), Join flow
**Success metric:** Spaces joined in first session

### The Builder
> "I want to create tools. See them used. Get credit."

**Journey:** Idea → Create → Test → Deploy → Track
**Key pages:** `/tools/create`, `/tools/[id]`, `/tools/[id]/deploy`
**Success metric:** Tools deployed to Spaces

### The Connector
> "Who knows who? How do I meet the right people?"

**Journey:** Browse → Find people → See connections → Reach out
**Key pages:** `/s/[handle]?view=members`, `/u/[handle]`
**Success metric:** Cross-Space connections made

---

## Page Hierarchy (Complete)

### Tier 1: Entry Points
Pages where users enter HIVE. Maximum polish required.

```
/                       Landing (Living Glass)
/auth/login             Email entry
/auth/verify            OTP verification
/onboarding             3-step wizard
```

### Tier 2: Territory (Discovery)
Where users find their place. High traffic, high stakes.

```
/spaces                 Territory map (all Spaces)
/spaces?q=...           Search
/spaces?category=...    Filter by type
/spaces/browse          Member-first discovery
/spaces/create          Create new Space (wizard)
/spaces/claim           Claim ghost Space (wizard)
```

### Tier 3: Residence (Home)
Where users live. Most time spent here.

```
/s/[handle]                   Space home (chat default)
/s/[handle]?view=events       Events view
/s/[handle]?view=members      Members view
/s/[handle]?view=calendar     Calendar view
/s/[handle]?view=resources    Resources view
/s/[handle]?view=tools        Deployed tools
/s/[handle]?view=analytics    Leader analytics
/s/[handle]?view=settings     Leader settings
/s/[handle]/[board]           Specific board deep link
```

### Tier 4: Creation (Workshop)
Where users build. Focus and power required.

```
/tools                  Tool gallery
/tools/create           AI tool creator
/tools/[id]             Tool studio (edit)
/tools/[id]/preview     Test run
/tools/[id]/deploy      Deploy to Space
/tools/[id]/analytics   Usage stats
/tools/[id]/settings    Configuration
```

### Tier 5: Identity (Profile)
Where users express themselves.

```
/u/[handle]             Public profile
/profile                Own profile dashboard
/profile/edit           Edit profile
/profile/calendar       Personal calendar
/profile/connections    Friend graph
/profile/settings       Account settings
```

### Tier 6: Utility
Supporting pages that enable core experiences.

```
/calendar               Combined calendar
/events                 Campus-wide events
/notifications          Notification center
/settings               Global settings
/leaders                Notable users
```

### Tier 7: System
Administrative and legal.

```
/legal/privacy          Privacy policy
/legal/terms            Terms of service
/legal/community-guidelines   Community rules
/offline                Offline state
/not-found              404
```

### Tier 8: Gated/Future
Not yet launched or behind feature flags.

```
/feed                   Activity feed (PAUSED → "Coming Soon")
/rituals                Rituals hub (GATED)
/rituals/[slug]         Ritual detail (GATED)
```

---

## URL Architecture

### The Golden Rules

1. **Handles over IDs** — `/s/ubconsulting` not `/spaces/abc123`
2. **Views over routes** — `?view=events` not `/s/ubconsulting/events`
3. **Shareable always** — Every state has a URL someone can text

### URL Patterns

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `/s/[handle]` | `/s/ubconsulting` | Space addresses |
| `/u/[handle]` | `/u/jane-smith` | User profiles |
| `?view=X` | `?view=events` | Views within a place |
| `?modal=X` | `?modal=create-event` | Overlay on current view |
| `?q=X` | `?q=consulting` | Search/filter |
| `/[id]` | `/tools/abc123` | Resources without handles |

### Deep Link Spec

Every meaningful state must have a URL:

```
SPACE STATES
/s/ubconsulting                    → Chat view (default)
/s/ubconsulting?view=events        → Events list
/s/ubconsulting?view=events&id=123 → Specific event open
/s/ubconsulting/general            → Specific board
/s/ubconsulting?modal=create-event → Event creation modal

TOOL STATES
/tools/abc123                      → Tool studio
/tools/abc123?tab=code             → Code tab active
/tools/abc123/preview?input=...    → Preview with prefilled input

PROFILE STATES
/u/jane-smith                      → Public profile
/u/jane-smith?tab=spaces           → Spaces membership tab
/profile/edit?section=bio          → Edit specific section
```

---

## Navigation Architecture

### Level 1: Global Shell

Persistent everywhere. "Where am I in HIVE?"

```
┌─────────────────────────────────────────────────────────────┐
│  [HIVE]  [Spaces]  [Lab]  [Profile]           [⌘K]  [●]     │
└─────────────────────────────────────────────────────────────┘
```

- **HIVE** → Home (last Space or browse)
- **Spaces** → `/spaces`
- **Lab** → `/tools`
- **Profile** → `/profile`
- **⌘K** → Command palette
- **●** → Notifications

### Level 2: Section Sidebar

Within a section. Context-aware content.

| Section | Sidebar Shows |
|---------|---------------|
| **Spaces** | Your Spaces, Browse CTA, Claim CTA |
| **Inside Space** | Back, Space nav, Tools, Members online |
| **HiveLab** | Your tools, Templates |
| **Profile** | Settings nav, Quick actions |

### Level 3: View Tabs

Within a page. Horizontal switching.

```
SPACE TABS
[Chat] [Events] [Members] [Calendar] [Resources] [Tools]   [Analytics ▾]

TOOL TABS
[Editor] [Preview] [Deploy] [Analytics] [Settings]

PROFILE TABS
[Overview] [Spaces] [Tools] [Activity]
```

### Level 4: Command Palette (⌘K)

Keyboard-first power navigation.

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Type to search...                                       │
├─────────────────────────────────────────────────────────────┤
│  RECENT                                                     │
│  → @ubconsulting                                            │
│  → @premed-society                                          │
│                                                             │
│  ACTIONS                                                    │
│  → Create Space                                             │
│  → Create Tool                                              │
│  → Browse Spaces                                            │
│  → Go to Settings                                           │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                    [Content Area]                           │
├─────────────────────────────────────────────────────────────┤
│  [🏠 Feed]  [📍 Spaces]  [🔧 Lab]  [👤 Profile]             │
└─────────────────────────────────────────────────────────────┘
```

---

## Shell System

### Shell Types

| Shell | Use For | Key Feature |
|-------|---------|-------------|
| **VoidShell** | Auth, onboarding | Centered, minimal, breathing orb |
| **ConversationShell** | Chat, feed | Centered column, sticky composer |
| **BrowseShell** | Discovery, lists | Sticky filters, responsive grid |
| **CanvasShell** | Tool editor, dashboards | Sidebar + canvas + inspector |
| **ProfileShell** | User profiles | Hero + parallax + content |
| **StreamShell** | Activity feed | Centered stream, presence |
| **GridShell** | Visual discovery | Masonry grid, filters |

### Shell Selection Matrix

| Page | Shell | Why |
|------|-------|-----|
| `/auth/*` | VoidShell | Focus on single task |
| `/onboarding` | VoidShell | Step-by-step focus |
| `/spaces` | BrowseShell | Discovery grid |
| `/s/[handle]` (chat) | ConversationShell | Chat-first |
| `/s/[handle]` (events) | BrowseShell | Event cards |
| `/tools` | BrowseShell | Tool gallery |
| `/tools/[id]` | CanvasShell | IDE experience |
| `/u/[handle]` | ProfileShell | Identity showcase |
| `/feed` | StreamShell | Activity stream |

---

## Layout Zones

### Zone Pattern Library

```
CENTERED (Auth, Onboarding, Focus)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌───────────────┐                        │
│                    │   Content     │                        │
│                    │   max-w-sm    │                        │
│                    └───────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SPLIT 60/40 (Space Chat)
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├───────────────────────────────────┬─────────────────────────┤
│                                   │                         │
│   Main Content (60%)              │   Sidebar (40%)         │
│   Chat / Events / etc             │   Context panel         │
│                                   │                         │
└───────────────────────────────────┴─────────────────────────┘

BROWSE GRID (Discovery)
┌─────────────────────────────────────────────────────────────┐
│  Header + Search                                            │
├─────────────────────────────────────────────────────────────┤
│  [Filter] [Filter] [Filter]                    [View ▾]     │
├─────────────────────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐                             │
│  │Card│  │Card│  │Card│  │Card│                             │
│  └────┘  └────┘  └────┘  └────┘                             │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐                             │
│  │Card│  │Card│  │Card│  │Card│                             │
│  └────┘  └────┘  └────┘  └────┘                             │
└─────────────────────────────────────────────────────────────┘

CANVAS (Tool Editor)
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├────────┬────────────────────────────────────┬───────────────┤
│        │                                    │               │
│ Tool   │   Canvas (Code/Preview)            │  Inspector    │
│ Palette│                                    │  Panel        │
│        │                                    │               │
└────────┴────────────────────────────────────┴───────────────┘

PROFILE (Hero + Content)
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Hero (parallax)                    │  │
│  │                    Avatar + Name                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  [Tab] [Tab] [Tab]                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Content Area                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Inventory (Redesign Scope)

### Navigation Components
- [ ] `GlobalNav` — Top-level 4-section nav
- [ ] `SidebarShell` — Collapsible sidebar container
- [ ] `SpaceNav` — Inside-space navigation
- [ ] `ViewTabs` — Horizontal view switcher
- [ ] `CommandPalette` — ⌘K overlay
- [ ] `MobileBottomNav` — Mobile fixed nav
- [ ] `Breadcrumbs` — Location trail

### Space Components
- [ ] `SpaceCard` — Discovery card with activity signals
- [ ] `SpaceHeader` — Space identity + presence
- [ ] `SpaceChat` — Chat interface
- [ ] `SpaceSidebar` — Context panel (events, members, tools)
- [ ] `BoardTabs` — Board switcher
- [ ] `MemberList` — Online-first member grid
- [ ] `EventCard` — Event with RSVP

### Profile Components
- [ ] `ProfileHero` — Avatar + banner + identity
- [ ] `ProfileCard` — Compact profile reference
- [ ] `SpaceMembership` — Spaces I'm in
- [ ] `ConnectionGraph` — Who I know

### Tool Components
- [ ] `ToolCard` — Gallery card
- [ ] `ToolEditor` — Code/preview canvas
- [ ] `ToolPreview` — Runtime sandbox
- [ ] `DeployFlow` — Space selection + deploy

### Utility Components
- [ ] `EmptyState` — Canvas-style empty states
- [ ] `LoadingState` — Skeleton patterns
- [ ] `ErrorState` — Recovery patterns
- [ ] `PresenceIndicator` — Online dots + counts
- [ ] `UnreadBadge` — Notification counts

---

## Page Specifications

### Priority 1: Core Loop

#### `/spaces` — Territory Map
**Purpose:** Find your place
**Shell:** BrowseShell
**Layout:** Header + filters + grid

```
┌─────────────────────────────────────────────────────────────┐
│  SPACES                                     [+ Create]      │
│  432 spaces · 2,847 students                                │
├─────────────────────────────────────────────────────────────┤
│  [Search...]  [All ▾] [Student Orgs] [Greek] [Residential]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ @ubconsult   │  │ @premed      │  │ @ub-finance  │       │
│  │ ●47 online   │  │ ●23 online   │  │ Unclaimed    │       │
│  │ 234 members  │  │ 156 members  │  │ 8 waiting    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Signals required:**
- Online count (life)
- Member count (size)
- "Unclaimed" badge (FOMO)
- Waitlist count (pressure)

---

#### `/s/[handle]` — Space Home
**Purpose:** You're home
**Shell:** ConversationShell
**Layout:** Header + tabs + split (chat + sidebar)

```
┌─────────────────────────────────────────────────────────────┐
│  @ubconsulting · UB Consulting          ●47 online    [⚙]   │
├─────────────────────────────────────────────────────────────┤
│  [Chat] [Events] [Members] [Calendar] [Resources] [Tools]   │
├─────────────────────────────────────────────────────────────┤
│  [#general] [#events] [#case-prep] [+]                      │
├───────────────────────────────────┬─────────────────────────┤
│                                   │  UPCOMING               │
│   Chat messages...                │  ┌─────────────────┐    │
│                                   │  │ Case Comp       │    │
│                                   │  │ Tomorrow 7pm    │    │
│                                   │  └─────────────────┘    │
│                                   │                         │
│                                   │  ONLINE (12)            │
│                                   │  ○ ○ ○ ○ ○ +7           │
│                                   │                         │
├───────────────────────────────────┼─────────────────────────┤
│  [Message input...]          [→]  │                         │
└───────────────────────────────────┴─────────────────────────┘
```

**Key behaviors:**
- Chat is default view
- Sidebar shows context (events, members, tools)
- Boards are horizontal tabs
- Input always visible

---

#### `/tools/[id]` — Tool Studio
**Purpose:** Build something
**Shell:** CanvasShell
**Layout:** Toolbar + sidebar + canvas + inspector

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back   Study Timer              [Preview] [Deploy] [⚙]   │
├────────┬────────────────────────────────────┬───────────────┤
│        │                                    │               │
│ Files  │   // Your code here                │  Properties   │
│ ──────│                                    │  ──────────── │
│ main   │   export function run() {          │  Name: Study  │
│ style  │     return <Timer />;              │  Icon: ⏱      │
│ config │   }                                │  Visibility:  │
│        │                                    │  [Public ▾]   │
│        │                                    │               │
│ +Add   │                                    │  Inputs       │
│        │                                    │  ──────────── │
│        │                                    │  duration     │
│        │                                    │  [Number]     │
│        │                                    │               │
└────────┴────────────────────────────────────┴───────────────┘
```

---

### Priority 2: Entry Points

#### `/auth/login` — Enter HIVE
**Purpose:** Get in
**Shell:** VoidShell
**Layout:** Centered (max-w-sm)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         HIVE                                │
│                                                             │
│                    Enter your email                         │
│                    ┌───────────────────┐                    │
│                    │ you@buffalo.edu   │                    │
│                    └───────────────────┘                    │
│                                                             │
│                    [Continue with email]                    │
│                                                             │
│                    ──── or ────                             │
│                                                             │
│                    [Continue with Google]                   │
│                                                             │
│                    By continuing, you agree to              │
│                    Terms and Privacy Policy                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### `/onboarding` — Become You
**Purpose:** Set up identity
**Shell:** VoidShell + progress dots
**Layout:** Centered (max-w-sm), 3 steps

```
Step 1: WHO (user type)
Step 2: YOU (name, handle, avatar)
Step 3: INTERESTS or SPACES (based on user type)
```

---

### Priority 3: Identity

#### `/u/[handle]` — Public Profile
**Purpose:** See someone
**Shell:** ProfileShell
**Layout:** Hero + tabs + content

```
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │                    [Avatar]                           │  │
│  │                    Jane Smith                         │  │
│  │                    @jane-smith                        │  │
│  │                    CS '26 · UB Consulting             │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  [Overview] [Spaces (5)] [Tools (3)] [Activity]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   SPACES                                                    │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │
│   │ UB     │  │ Premed │  │ WiCS   │  │ ACM    │           │
│   │ Consult│  │ Society│  │        │  │        │           │
│   └────────┘  └────────┘  └────────┘  └────────┘           │
│                                                             │
│   TOOLS CREATED                                             │
│   ┌────────────────────┐  ┌────────────────────┐           │
│   │ Study Timer        │  │ GPA Calculator     │           │
│   │ 47 uses            │  │ 23 uses            │           │
│   └────────────────────┘  └────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Empty State Philosophy

Empty states are **canvases**, not **absences**.

| Context | Wrong | Right |
|---------|-------|-------|
| No messages | "No messages yet" | "Start the conversation" + input |
| No events | "No events" | "Events start here" + create button |
| No members | "No members" | "Invite your people" + invite flow |
| No tools | "No tools deployed" | "Add your first tool" + browse |
| Search no results | "No results" | "Nothing matches. Try another search." |

---

## FOMO Architecture

### Ghost Spaces
400+ UB orgs pre-seeded. Unclaimed = visible + claimable.

```
UNCLAIMED SPACE CARD
┌──────────────────────────────────────┐
│  ○ UB Finance Club                   │
│  [Unclaimed]                         │
│                                      │
│  8 students waiting                  │
│                                      │
│  [Claim This Space]                  │
└──────────────────────────────────────┘
```

### Activity Signals
Every list needs life indicators:

- **Online count** — `●47 online`
- **Last active** — `Active 2m ago`
- **Member count** — `234 members`
- **Unread indicator** — Gold dot on sidebar item

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| `sm` | 640px | Single column, bottom nav |
| `md` | 768px | Single column, sidebar possible |
| `lg` | 1024px | Split layouts, full sidebar |
| `xl` | 1280px | Max-width containers |
| `2xl` | 1536px | Extra whitespace |

### Mobile Transformations

| Desktop | Mobile |
|---------|--------|
| Sidebar visible | Bottom sheet on demand |
| Split 60/40 | Single column + tabs |
| Hover interactions | Touch only |
| Modal dialogs | Full-screen sheets |
| Command palette | Full-screen search |

---

## Implementation Phases

### Phase 1: Core Navigation (Now)
- [ ] Redesign global shell (nav + sidebar)
- [ ] Implement new shell system
- [ ] Mobile bottom nav
- [ ] Command palette

### Phase 2: Space Experience
- [ ] Space browse redesign
- [ ] Space home redesign
- [ ] Chat experience
- [ ] Event/member views

### Phase 3: Creation Flow
- [ ] Tool gallery
- [ ] Tool studio
- [ ] Deploy flow

### Phase 4: Identity
- [ ] Profile redesign
- [ ] Onboarding polish
- [ ] Settings consolidation

### Phase 5: Polish
- [ ] Empty states
- [ ] Loading states
- [ ] Error recovery
- [ ] Animations

---

## Decision Log

### LOCKED (Do Not Change)

```
[2026-01] Handle-based Space URLs (/s/[handle])
[2026-01] Views via query params (?view=events)
[2026-01] 4-section primary nav (Spaces, Lab, Profile, Feed)
[2026-01] VoidShell for auth/onboarding
[2026-01] Ghost Spaces visible in browse
[2026-01] Gold for CTAs/presence only
```

### SOFT (Can Iterate)

```
[2026-01] Chat as default Space view
[2026-01] Sidebar always visible on desktop
[2026-01] 60/40 split ratio for chat
```

---

## Quick Reference

### When Building a New Page

1. **Which tier?** Entry, Territory, Residence, Creation, Identity, Utility
2. **Which shell?** Void, Conversation, Browse, Canvas, Profile, Stream, Grid
3. **Which layout zone?** Centered, Split, Browse, Canvas, Profile
4. **What's the single-session win?**
5. **Does the URL work when texted to a friend?**

### The Tests

- **60-Second Test:** Can a new user accomplish something in 60 seconds?
- **Text Test:** Would someone text this URL?
- **Canvas Test:** Does empty feel like potential, not absence?
- **Calm Test:** If quiet, does user feel calm or anxious?

---

## Related Docs

- `docs/DESIGN_PRINCIPLES.md` — Visual design rules
- `docs/design-system/VOICE.md` — Copy patterns
- `docs/VERTICAL_SLICES.md` — Feature ownership
- `docs/design-system/DECISIONS.md` — Locked design decisions
