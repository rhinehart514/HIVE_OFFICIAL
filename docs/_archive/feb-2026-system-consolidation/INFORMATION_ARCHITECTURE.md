# HIVE Information Architecture

> **Status:** ACTIVE
> **Last Updated:** January 26, 2026
> **Sprint:** D0 — Foundation
> **Purpose:** Canonical reference for site structure, navigation, and URL conventions

---

## Overview

This document defines HIVE's complete information architecture:
- **87 pages** across web and admin apps
- **3-tier navigation model** (Primary, Secondary, Tertiary)
- **URL conventions** with rationale
- **Vocabulary glossary** for consistent terminology

---

# 1. Site Map

## 1.1 Visual Hierarchy

```
HIVE SITE ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

/ (Gate)
├── PUBLIC ENTRY
│   ├── /                           Gate (code entry)
│   ├── /about                      Manifesto
│   ├── /enter                      Code verification
│   ├── /login                      Returning user
│   └── /offline                    PWA fallback
│
├── ONBOARDING
│   └── /welcome/*                  4-step flow
│       ├── /welcome                Step 0: Recognition
│       ├── /welcome/identity       Step 1: Name, pronouns, bio
│       ├── /welcome/territory      Step 2: Campus selection
│       └── /welcome/claimed        Step 3: Completion
│
├── CORE SURFACES (Authenticated)
│   │
│   ├── FEED (/feed)                ────────────────────────────────────────
│   │   ├── /feed                   Dashboard / Proto-feed
│   │   └── /feed/settings          Feed preferences
│   │
│   ├── SPACES (/spaces, /s)        ────────────────────────────────────────
│   │   ├── /spaces                 Spaces HQ (my spaces + quick actions)
│   │   ├── /spaces/browse          Discovery by category
│   │   ├── /spaces/create          Direct create form
│   │   ├── /spaces/claim           Claim official org
│   │   ├── /spaces/new/*           Guided creation flow
│   │   │   ├── /spaces/new/access      Step 1: Access type
│   │   │   ├── /spaces/new/identity    Step 2: Name, handle
│   │   │   └── /spaces/new/launch      Step 3: Review & launch
│   │   ├── /spaces/join/[code]     Join via invite
│   │   │
│   │   └── /s/[handle]             Space Residence (primary surface)
│   │       └── /s/[handle]/tools/[deploymentId]  Deployed tool
│   │
│   ├── EXPLORE (/explore)          ────────────────────────────────────────
│   │   ├── /explore                Main discovery hub
│   │   ├── /people                 Browse users
│   │   ├── /leaders                Leaderboard
│   │   ├── /resources              Campus resources
│   │   ├── /schools                Participating campuses
│   │   └── /templates              Tool templates (public)
│   │
│   ├── LAB (/lab)                  ────────────────────────────────────────
│   │   ├── /lab                    Builder dashboard
│   │   ├── /lab/new                Create blank tool
│   │   ├── /lab/create             Legacy create (redirect)
│   │   ├── /lab/templates          Browse templates
│   │   │
│   │   ├── /lab/[toolId]           Tool detail page
│   │   │   ├── /lab/[toolId]/edit      IDE: visual builder
│   │   │   ├── /lab/[toolId]/preview   Live preview
│   │   │   ├── /lab/[toolId]/run       Single test run
│   │   │   ├── /lab/[toolId]/runs      Run history
│   │   │   ├── /lab/[toolId]/analytics Response metrics
│   │   │   ├── /lab/[toolId]/deploy    Deploy to space
│   │   │   └── /lab/[toolId]/settings  Tool settings
│   │   │
│   │   └── /lab/setups/*           Automations
│   │       ├── /lab/setups             List all
│   │       ├── /lab/setups/new         Create new
│   │       └── /lab/setups/[setupId]/*
│   │           ├── /lab/setups/[setupId]          Detail
│   │           ├── /lab/setups/[setupId]/edit     Edit rules
│   │           └── /lab/setups/[setupId]/builder  Visual builder
│   │
│   ├── PROFILE (/profile)          ────────────────────────────────────────
│   │   ├── /profile                Redirect to own profile
│   │   ├── /profile/[id]           Public profile view
│   │   ├── /profile/edit           Edit own profile
│   │   ├── /profile/calendar       Personal calendar
│   │   └── /profile/connections    Connections/mutuals
│   │
│   ├── SETTINGS (/settings)        ────────────────────────────────────────
│   │   ├── /settings               Unified settings hub
│   │   ├── /profile/settings       Account settings (legacy, redirect)
│   │   └── /notifications/settings Notification prefs (legacy, redirect)
│   │
│   └── OTHER SURFACES              ────────────────────────────────────────
│       ├── /notifications          Notification center
│       ├── /calendar               Integrated calendar
│       ├── /events                 Campus events
│       │   ├── /events/[eventId]       Event detail
│       │   └── /events/[eventId]/attendees  Attendee list
│       └── /rituals                Rituals dashboard
│           └── /rituals/[slug]     Ritual detail
│
├── STATIC & LEGAL
│   ├── /legal/privacy              Privacy policy
│   ├── /legal/terms                Terms of service
│   └── /legal/community-guidelines Community guidelines
│
├── DEV/SHOWCASE
│   ├── /design-system              Component library
│   ├── /elements                   Design tokens
│   └── /hivelab                    Embedded demo
│
└── ADMIN (/admin — separate app)
    ├── /                           Dashboard overview
    ├── /users                      User management
    ├── /spaces                     Space management
    ├── /moderation                 Content moderation
    ├── /analytics                  Platform analytics
    ├── /feature-flags              Feature toggles
    └── /settings                   Admin settings
```

## 1.2 Complete Route Table

### Public Routes (No Auth Required)

| Route | Purpose | Layout | Notes |
|-------|---------|--------|-------|
| `/` | Gate — code entry | Standalone | Landing page with 6-digit code input |
| `/about` | Manifesto | Standalone | HIVE philosophy, public marketing |
| `/enter` | Code verification | Standalone | Entry code → onboarding flow |
| `/login` | Return user login | Standalone | Email → OTP flow |
| `/offline` | PWA offline fallback | Standalone | Service worker fallback |
| `/explore` | Discovery hub | AppShell | Public browse (auth optional) |
| `/people` | User directory | AppShell | Browse by major/interests |
| `/leaders` | Leaderboard | AppShell | Verified community leaders |
| `/resources` | Campus resources | AppShell | Resource library |
| `/schools` | Campus list | Standalone | Participating institutions |
| `/templates` | Tool templates | AppShell | Public template gallery |
| `/events` | Campus events | AppShell | Public event browse |
| `/events/[eventId]` | Event detail | AppShell | Event info, RSVP |
| `/events/[eventId]/attendees` | Attendee list | AppShell | Event participants |
| `/s/[handle]` | Space view | AppShell | Public space residence |
| `/s/[handle]/tools/[deploymentId]` | Deployed tool | AppShell | Tool runner |
| `/rituals/[slug]` | Ritual detail | AppShell | Public ritual participation |
| `/design-system` | Component showcase | Standalone | Dev reference |
| `/elements` | Design tokens | Standalone | Token reference |
| `/hivelab` | HiveLab demo | Standalone | Embedded demo iframe |
| `/hivelab/demo` | Tool demo | Standalone | Tool showcase |
| `/legal/privacy` | Privacy policy | Legal | Static content |
| `/legal/terms` | Terms of service | Legal | Static content |
| `/legal/community-guidelines` | Guidelines | Legal | Static content |

### Authenticated Routes

| Route | Purpose | Layout | Auth Level |
|-------|---------|--------|------------|
| `/welcome` | Onboarding Step 0 | Standalone | User |
| `/welcome/identity` | Onboarding Step 1 | Standalone | User |
| `/welcome/territory` | Onboarding Step 2 | Standalone | User |
| `/welcome/claimed` | Onboarding Step 3 | Standalone | User |
| `/feed` | Dashboard / Proto-feed | AppShell | User |
| `/feed/settings` | Feed preferences | AppShell | User |
| `/spaces` | Spaces HQ | AppShell | User |
| `/spaces/browse` | Discovery | AppShell | User |
| `/spaces/create` | Create form | AppShell | User |
| `/spaces/claim` | Claim official | AppShell | User |
| `/spaces/new` | Creation flow | AppShell | User |
| `/spaces/new/access` | Step 1: Access | AppShell | User |
| `/spaces/new/identity` | Step 2: Identity | AppShell | User |
| `/spaces/new/launch` | Step 3: Launch | AppShell | User |
| `/spaces/join/[code]` | Join via invite | AppShell | User |
| `/spaces/[spaceId]/tools` | Space tools | AppShell | User |
| `/spaces/[spaceId]/tools/[deploymentId]` | Tool instance | AppShell | User |
| `/spaces/[spaceId]/setups` | Space automations | AppShell | User |
| `/spaces/[spaceId]/setups/[deploymentId]` | Setup detail | AppShell | User |
| `/lab` | Builder dashboard | AppShell | User |
| `/lab/new` | Create tool | AppShell | User |
| `/lab/create` | Legacy create | AppShell | User |
| `/lab/templates` | Browse templates | AppShell | User |
| `/lab/[toolId]` | Tool detail | AppShell | User |
| `/lab/[toolId]/edit` | Tool IDE | AppShell | User |
| `/lab/[toolId]/preview` | Tool preview | AppShell | User |
| `/lab/[toolId]/run` | Tool test | AppShell | User |
| `/lab/[toolId]/runs` | Run history | AppShell | User |
| `/lab/[toolId]/analytics` | Tool metrics | AppShell | User |
| `/lab/[toolId]/deploy` | Deploy tool | AppShell | User |
| `/lab/[toolId]/settings` | Tool settings | AppShell | User |
| `/lab/setups` | Automations list | AppShell | User |
| `/lab/setups/new` | Create automation | AppShell | User |
| `/lab/setups/[setupId]` | Automation detail | AppShell | User |
| `/lab/setups/[setupId]/edit` | Edit automation | AppShell | User |
| `/lab/setups/[setupId]/builder` | Visual builder | AppShell | User |
| `/profile` | Redirect to own | AppShell | User |
| `/profile/[id]` | Profile view | AppShell | User |
| `/profile/edit` | Edit profile | AppShell | User |
| `/profile/settings` | Account settings | AppShell | User |
| `/profile/calendar` | Personal calendar | AppShell | User |
| `/profile/connections` | Connections | AppShell | User |
| `/settings` | Unified settings | AppShell | User |
| `/notifications` | Notification center | AppShell | User |
| `/notifications/settings` | Notification prefs | AppShell | User |
| `/calendar` | Calendar view | AppShell | User |
| `/rituals` | Rituals dashboard | AppShell | User |

### Admin Routes (Separate App — Port 3001)

| Route | Purpose | Auth Level |
|-------|---------|------------|
| `/` | Admin dashboard | Admin |
| `/users` | User management | Admin |
| `/users/[userId]` | User detail | Admin |
| `/spaces` | Space management | Admin |
| `/spaces/[spaceId]` | Space detail | Admin |
| `/moderation` | Moderation queue | Admin |
| `/moderation/reports` | Content reports | Admin |
| `/analytics` | Platform analytics | Admin |
| `/feature-flags` | Feature toggles | Admin |
| `/settings` | Admin settings | Admin |

---

# 2. Navigation Model

## 2.1 Three-Tier System

```
NAVIGATION TIERS
═══════════════════════════════════════════════════════════════════════════════

TIER 1: PRIMARY NAVIGATION (Global)
─────────────────────────────────────
Always visible. Defines the product structure.
Location: Left sidebar (desktop), bottom tabs (mobile)

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   DESKTOP (5 items)              MOBILE (4 items)                          │
│   ─────────────────              ──────────────────                        │
│                                                                            │
│   ● Feed (/feed)                 ● Feed (/feed)                            │
│   ● Spaces (/spaces)             ● Spaces (/spaces)                        │
│   ● Explore (/explore)           ● Explore (/explore)                      │
│   ● Lab (/lab)                   ● Profile (/profile)                      │
│   ● Profile (/profile)           ─────────────────────                     │
│   ─────────────────────          DRAWER:                                   │
│   ● Settings (bottom)            ● Lab (/lab)                              │
│                                  ● Settings (/settings)                    │
│                                  ● Sign Out                                │
│                                                                            │
│   RATIONALE: Mobile bottom bar has 64px height constraint.                 │
│   5 items would require icon-only mode (loses clarity).                    │
│   Lab is power-user feature, better in drawer on mobile.                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

TIER 2: SECONDARY NAVIGATION (Contextual)
───────────────────────────────────────────
Appears within surfaces. Context-specific.
Location: Below header, tabs, or sidebar within content area

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   SPACES                                                                   │
│   └── Space Residence Tabs: [Activity] [Events] [Tools] [Members] [Settings]
│                                                                            │
│   LAB                                                                      │
│   └── Tool Tabs: [Edit] [Preview] [Runs] [Analytics] [Settings]            │
│                                                                            │
│   PROFILE                                                                  │
│   └── Profile Tabs: [Activity] [Spaces] [Tools] [Calendar]                 │
│                                                                            │
│   EXPLORE                                                                  │
│   └── Explore Tabs: [Spaces] [Events] [People] [Tools]                     │
│       (URL: /explore?tab=spaces)                                           │
│                                                                            │
│   SETTINGS                                                                 │
│   └── Settings Sections: [Account] [Privacy] [Notifications] [Sessions]    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

TIER 3: TERTIARY NAVIGATION (Deep)
───────────────────────────────────
Deep page navigation for complex surfaces.
Location: Within content, breadcrumbs, or sub-panels

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   LAB TOOL IDE                                                             │
│   └── Element palette, properties panel, preview toggle                    │
│                                                                            │
│   SPACE SETTINGS                                                           │
│   └── Sections: General, Members, Permissions, Integrations, Danger Zone   │
│                                                                            │
│   AUTOMATION BUILDER                                                       │
│   └── Trigger selection, action configuration, condition editor            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Navigation Rules

### Primary Navigation Rules

| Rule | Implementation |
|------|----------------|
| **Maximum 5 items** | Feed, Spaces, Explore, Lab, Profile |
| **Settings always bottom** | Separates core nav from utility |
| **Icons + labels** | Always show both (no icon-only collapsed state) |
| **Gold active indicator** | Left edge line, 2px, gold color |
| **Match pattern routing** | `/s/*` matches Spaces, `/lab/*` matches Lab |

### Secondary Navigation Rules

| Rule | Implementation |
|------|----------------|
| **Tabs for parallel content** | Space sections, tool tabs |
| **URL persistence** | Tab state in URL: `/explore?tab=people` |
| **Max 6 tabs** | Beyond 6 → use dropdown or sections |
| **Default tab defined** | First tab is default, no "none" state |
| **Keyboard accessible** | Arrow keys navigate between tabs |

### Tertiary Navigation Rules

| Rule | Implementation |
|------|----------------|
| **Breadcrumbs for depth > 2** | Lab → Tool → Settings shows breadcrumbs |
| **No more than 4 levels deep** | Flatten if needed |
| **Back button behavior** | Browser back = previous page, not parent |
| **Panel collapse persists** | Remember collapsed state in localStorage |

## 2.3 Mobile Navigation

```
MOBILE NAVIGATION
═══════════════════════════════════════════════════════════════════════════════

BOTTOM TAB BAR (4 items)
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌──────────┬──────────┬──────────┬──────────┐                            │
│   │   Feed   │  Spaces  │  Explore │  Profile │                            │
│   │    🏠    │    👥    │    🧭    │    👤    │                            │
│   └──────────┴──────────┴──────────┴──────────┘                            │
│                                                                             │
│   ACTIVE STATE: Gold indicator line, gold text                              │
│   TAP: Navigate to section                                                  │
│                                                                             │
│   NOTE: Lab moved to drawer to fit 64px bottom bar constraint.              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

HAMBURGER DRAWER (Lab + Settings + More)
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   Accessed via: Header hamburger icon (top-left)                            │
│   Contains:                                                                 │
│   ├── Lab (primary nav items that overflow)                                 │
│   ├── Settings                                                              │
│   └── Sign Out                                                              │
│                                                                             │
│   NOTE: Lab is desktop-oriented (builder tools), acceptable in drawer.      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

GESTURES
┌─────────────────────────────────────────────────────────────────────────────┐
│   Swipe right from edge: Back (system)                                      │
│   Pull down: Refresh (on scrollable content)                                │
│   Swipe on message: React (in chat)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. URL Conventions

## 3.1 URL Philosophy

```
URL DESIGN PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

READABLE: URLs should be human-readable and memorable.
PREDICTABLE: Users should guess URLs correctly.
PERMANENT: URLs should not change (cool URIs don't change).
MEANINGFUL: URL structure reflects information architecture.
```

## 3.2 Canonical Patterns

| Entity Type | Pattern | Example | Rationale |
|-------------|---------|---------|-----------|
| **Space** | `/s/[handle]` | `/s/premed-society` | Handle-based for shareability, short prefix |
| **Profile** | `/profile/[id]` | `/profile/abc123` | ID-based for stability (handles can change) |
| **Tool** | `/lab/[toolId]` | `/lab/xyz789` | ID-based, owned by creator |
| **Event** | `/events/[eventId]` | `/events/evt456` | ID-based, calendar integration |
| **Ritual** | `/rituals/[slug]` | `/rituals/finals-week` | Slug-based for discoverability |

## 3.3 URL Patterns by Surface

### Spaces

```
/spaces                           Spaces HQ
/spaces/browse                    Discovery
/spaces/create                    Create form
/spaces/new/*                     Guided creation
/spaces/join/[code]               Invite join
/s/[handle]                       Space residence
/s/[handle]/tools/[deploymentId]  Deployed tool
```

**Decision:** Spaces use `/s/[handle]` (short prefix + handle) because:
- Handles are human-memorable and shareable
- `/s/` is short for social sharing
- Handles are validated unique at creation

### Lab

```
/lab                              Builder dashboard
/lab/new                          Create blank
/lab/templates                    Browse templates
/lab/[toolId]                     Tool detail
/lab/[toolId]/edit                IDE
/lab/[toolId]/preview             Preview
/lab/[toolId]/runs                History
/lab/[toolId]/analytics           Metrics
/lab/[toolId]/deploy              Deploy
/lab/[toolId]/settings            Settings
/lab/setups                       Automations
/lab/setups/[setupId]             Automation detail
```

**Decision:** Tools use `/lab/[toolId]` (ID-based) because:
- Tools are creator-owned, not community-facing
- IDs are stable when tool names change
- No need for vanity URLs

### Profile

```
/profile                          Redirect to own
/profile/[id]                     Profile view
/profile/edit                     Edit own
/profile/settings                 Account settings
/profile/calendar                 Calendar
/profile/connections              Connections
```

**Decision:** Profiles use `/profile/[id]` (ID-based) because:
- User handles can change
- Profile permalinks must be stable
- Query by ID is more performant

### Explore & Discovery

```
/explore                          Discovery hub
/explore?tab=spaces               Spaces tab
/explore?tab=events               Events tab
/explore?tab=people               People tab
/explore?tab=tools                Tools tab
/people                           User directory (alias)
/leaders                          Leaderboard
/resources                        Resources
/schools                          Campus list
```

**Decision:** Explore tabs use query params because:
- Tabs are parallel content views
- Deep linking to specific tabs is common
- State persists on refresh

## 3.4 Share/Invite URLs

| Use Case | Pattern | Example |
|----------|---------|---------|
| Space invite | `/spaces/join/[code]` | `/spaces/join/ABC123` |
| Event share | `/events/[eventId]` | `/events/evt789` |
| Tool share | `/c/[shortcode]` | `/c/TOOL42` |
| Profile share | `/profile/[id]` | `/profile/user123` |

**Note:** Short share codes (`/c/TOOL42`) are generated for external sharing, distinct from internal IDs.

---

# 4. Vocabulary

## 4.1 Labeling Glossary

```
VOCABULARY DECISIONS
═══════════════════════════════════════════════════════════════════════════════

These are the canonical terms used in HIVE. Use consistently everywhere.
```

| Concept | Term | NOT | Rationale |
|---------|------|-----|-----------|
| Community container | **Space** | Group, Community, Channel, Room | "Space" implies ownership, persistence, place |
| Home view | **Feed** | Home, Dashboard, Timeline | "Feed" is familiar, scalable from proto-feed |
| Builder platform | **Lab** | Studio, Builder, IDE, Workshop | "Lab" implies experimentation, creation |
| Discovery hub | **Explore** | Browse, Discover, Search | "Explore" is active, inviting |
| Builder tool | **Tool** | App, Widget, Form, Creation | "Tool" is functional, purposeful |
| Automation rule | **Setup** | Automation, Rule, Workflow | "Setup" is approachable, non-technical |
| User identity | **Profile** | Account, User, Page | "Profile" is personal, complete |
| Configuration | **Settings** | Preferences, Config, Options | "Settings" is universally understood |
| User connection | **Connection** | Friend, Follower, Contact | "Connection" is professional, flexible |
| Space leader | **Leader** | Admin, Owner, Moderator | "Leader" is empowering, student-focused |
| Space member | **Member** | User, Participant, Joiner | "Member" implies belonging |
| Campus | **Campus** | School, University, Institution | "Campus" is universal, inclusive |

## 4.2 UI Label Standards

### Navigation Labels

| Surface | Label | Icon | Pattern |
|---------|-------|------|---------|
| Dashboard | Feed | Home | Always noun |
| Communities | Spaces | Users | Plural noun |
| Discovery | Explore | Search/Compass | Active verb |
| Builder | Lab | Beaker | Short noun |
| Identity | Profile | User | Singular noun |
| Configuration | Settings | Gear | Plural noun |

### Action Labels

| Action | Label | NOT |
|--------|-------|-----|
| Create space | "Create Space" | "New Space", "Add Space" |
| Join space | "Join" | "Enter", "Subscribe" |
| Leave space | "Leave Space" | "Exit", "Quit", "Unsubscribe" |
| Create tool | "Create Tool" | "New Tool", "Build Tool" |
| Deploy tool | "Deploy" | "Publish", "Launch", "Ship" |
| Share link | "Share" | "Copy Link", "Invite" |
| Edit profile | "Edit Profile" | "Update", "Modify" |

### State Labels

| State | Label | NOT |
|-------|-------|-----|
| Loading | "Loading..." | "Please wait", "Fetching" |
| Empty | "No [items] yet" | "Nothing here", "Empty" |
| Error | "Something went wrong" | "Error", "Failed" |
| Success | "Done" or silent | "Success!", "Completed!" |

---

# 5. Decisions

## 5.1 Decisions Made

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| **Where does Browse/Explore live?** | Separate nav item | Discovery deserves primary visibility. Hidden discovery = hidden value. | 2026-01-26 |
| **Settings: Unified or split?** | Unified at `/settings` | One location for all settings. Matches Notion/Linear mental model. Reduces cognitive load. | 2026-01-26 |
| **Space URLs: ID or Handle?** | Handle (`/s/[handle]`) | Shareability matters. Handles are memorable. IDs are for APIs. | 2026-01-26 |
| **Profile URLs: ID or Handle?** | ID (`/profile/[id]`) | Handles can change. Profile permalinks must be stable. | 2026-01-26 |
| **Tool URLs: ID or Handle?** | ID (`/lab/[toolId]`) | Tools are creator-owned. No community-facing handle needed. | 2026-01-26 |
| **Nav item count** | Desktop: 5 items, Mobile: 4 items | Cognitive limit + mobile space constraint. Lab in drawer on mobile. | 2026-01-26 |
| **Tab state persistence** | URL query params | Deep linking, shareability, refresh persistence. | 2026-01-26 |
| **Mobile nav strategy** | 4 primary + drawer | 64px bottom bar can't fit 5 items legibly. Lab is power-user, acceptable in drawer. | 2026-01-26 |
| **Settings redirects** | Implemented | `/feed/settings` → `/settings?section=account`, `/notifications/settings` → `/settings?section=notifications` | 2026-01-26 |
| **Browse vs Explore relationship** | Keep both, differentiate via IA | Complementary surfaces: Browse (category-first, emotional) + Explore (search-first, multi-entity). Not redundant. | 2026-01-26 |

---

## 5.2 Discovery Architecture: Browse vs Explore

### Overview

Browse and Explore are **complementary surfaces** serving **different discovery modes**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   /explore          =  "I know what I want"                                 │
│                        Search-first, multi-tab, fast                        │
│                        ChatGPT-style unified hub                            │
│                                                                             │
│   /spaces/browse    =  "Show me what's out there"                           │
│                        Category-first, narrative, emotional                 │
│                        Apple-like manifesto-driven discovery                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**This is NOT redundancy. It's intentional complementary design.**

### Mental Models

| Surface | URL | Purpose | User Stage |
|---------|-----|---------|------------|
| **Your Spaces** | `/spaces` | My memberships | All users |
| **Browse** | `/spaces/browse` | Category discovery | New/exploring |
| **Explore** | `/explore` | Search-first hub | Power users |

### When to Use Each

| User Mindset | Surface | Why |
|--------------|---------|-----|
| "What groups exist for my major?" | Browse | Category-first, emotional narrative |
| "Find @sarah" | Explore | Search-first, multi-entity |
| "What's popular right now?" | Explore → Trending tab | Quick scan |
| "I'm new, help me find my people" | Browse | Guided, onboarding-friendly |

### Implementation Notes

- **Onboarding** → Routes to Browse (emotional discovery)
- **Return visits** → Routes to Your Spaces (home base)
- **Cmd+K search** → Opens Explore (fast access)

---

## 5.3 Decisions Pending (With Recommendations)

### Where do Notifications live?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A) Badge on Profile | Bell icon in profile area of sidebar | Minimal nav clutter | Hidden, requires scan |
| B) Separate nav item | 6th nav item (breaks 5-item rule) | Always visible | Nav bloat |
| **C) Top bar** | Persistent bell icon in header | Visible without nav change | Needs header redesign |

**Recommendation:** Option C (Top bar)

```
HEADER LAYOUT
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Search ⌘K]                                      [🔔 Notifications]  [👤]  │
└─────────────────────────────────────────────────────────────────────────────┘

Rationale:
- Notifications are time-sensitive, deserve visibility
- Doesn't bloat primary nav
- Matches industry pattern (GitHub, Linear, Notion)
- Badge count shows unread
- Clicking opens dropdown or navigates to /notifications
```

### Where does Search live?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A) Top bar persistent | Always visible search field | Discoverable | Takes space |
| **B) Cmd+K only** | No visible field, keyboard shortcut | Clean, power-user | Discoverability issue |
| C) Per-surface | Search within current context | Contextual | Inconsistent |

**Recommendation:** Option B (Cmd+K) with discovery hint

```
SEARCH APPROACH
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PRIMARY: Command palette (Cmd+K / Ctrl+K)                                  │
│  - Fuzzy search across all content                                          │
│  - Recent searches shown                                                    │
│  - Keyboard navigable                                                       │
│                                                                             │
│  DISCOVERY: Show "⌘K to search" hint in:                                    │
│  - Empty states ("No results. Try ⌘K to search all of HIVE")                │
│  - Top bar (subtle text, not a full field)                                  │
│  - Onboarding tooltip                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Rationale:
- Command palettes are the modern standard
- Power users expect ⌘K
- Keeps UI clean
- Hint text solves discoverability
```

### Profile URL: Support vanity handles?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A) Keep ID only | `/profile/[id]` only | Simple, stable | Not shareable |
| **B) Support both** | `/profile/[id]` canonical, `/@[handle]` vanity | Best of both | Two URL patterns |
| C) Switch to handle | `/@[handle]` only | Clean, shareable | Handle changes break links |

**Recommendation:** Option B (Support both)

```
PROFILE URL STRATEGY
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  CANONICAL: /profile/[id]                                                   │
│  - Used internally, in APIs, in stored references                           │
│  - Never changes                                                            │
│                                                                             │
│  VANITY: /@[handle]                                                         │
│  - User-facing, shareable                                                   │
│  - Redirects to /profile/[id] with 301                                      │
│  - Shown in "Share Profile" UI                                              │
│                                                                             │
│  IMPLEMENTATION:                                                            │
│  - /app/@[handle]/page.tsx → lookup handle → redirect to /profile/[id]      │
│  - Handle changes don't break old links (old handle 404s or redirects)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Rationale:
- Users want shareable profile links
- Handles are memorable (/@sarah vs /profile/abc123)
- ID-based canonical ensures stability
- Redirect pattern is industry standard
```

---

# 6. Appendix

## 6.1 Route Statistics

```
ROUTE STATISTICS
═══════════════════════════════════════════════════════════════════════════════

Total Pages:        87 (web: 74, admin: 7, shared: 6)
Public Pages:       24 (28%)
Authenticated:      63 (72%)

Layout Files:       13
Dynamic Segments:   8 unique ([handle], [id], [toolId], [eventId],
                      [spaceId], [setupId], [slug], [code], [deploymentId])

Deepest Nesting:    5 levels (/spaces/[spaceId]/tools/[deploymentId])
Auth Boundaries:    5 layout wrappers

API Routes:         315+ endpoints
```

## 6.2 Auth Boundary Reference

```
AUTH BOUNDARIES
═══════════════════════════════════════════════════════════════════════════════

STANDALONE (No shell, no auth check in layout):
├── / (Gate)
├── /about
├── /enter
├── /login
├── /offline
├── /schools
├── /design-system
├── /elements
├── /hivelab
└── /legal/*

APP SHELL (Sidebar, auth check):
├── /feed/*
├── /spaces/*
├── /s/*
├── /explore
├── /people
├── /leaders
├── /resources
├── /templates
├── /lab/*
├── /profile/*
├── /settings/*
├── /notifications/*
├── /calendar
├── /events/*
└── /rituals/*

ADMIN SHELL (Separate app, admin auth):
└── apps/admin/*
```

## 6.3 Migration Notes

### Legacy Routes — Implemented Redirects

| Legacy | New | Status |
|--------|-----|--------|
| `/profile/settings` | `/settings` | ✅ Implemented |
| `/notifications/settings` | `/settings?section=notifications` | ✅ Implemented |
| `/feed/settings` | `/settings?section=account` | ✅ Implemented |
| `/spaces/[id]` | `/s/[handle]` | Pending (lookup + 301) |
| `/lab/create` | `/lab/new` | Pending (301 redirect) |

### Routes to Add

| Route | Purpose | Priority | Status |
|-------|---------|----------|--------|
| `/@[handle]` | Vanity profile URL | P1 — Post-launch | Deferred |
| `/explore?tab=*` | Tab state persistence | P0 — Pre-launch | ✅ Working |
| `/settings` with sections | Unified settings | P0 — Pre-launch | ✅ Working |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-26 | Implemented: Explore in primary nav, mobile nav strategy (4+drawer), settings redirects | Claude |
| 2026-01-26 | Complete rewrite: Site map, Navigation model, URL conventions, Vocabulary, Decisions | Claude |
| 2026-01 | Initial launch IA document | Previous |

---

*This document is the canonical reference for HIVE's information architecture. All navigation and URL decisions should reference this document.*
