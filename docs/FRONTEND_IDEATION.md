# HIVE Frontend Ideation Briefs
**Last Updated:** 2026-02-04

> **Purpose:** This document establishes global design standards, then provides per-page ideation briefs that enable an LLM to generate multiple creative directions for each surface. Each page brief documents current state, constraints, freedoms, adjacent flows, competitive context, and specific ideation prompts — all grounded in actual codebase evidence.
>
> **How to use:** The Global Design Constitution (Section 1) is the non-negotiable foundation. Every page-level brief (Sections 2-9) inherits from it. When ideating on any page, start by re-reading the Constitution, then explore the page brief's "What's Open" and "Ideation Prompts" sections.

---

## Table of Contents

0. [Platform Sitemap](#0-platform-sitemap)
1. [Global Design Constitution](#1-global-design-constitution)
2. [Landing Page](#2-landing-page)
3. [Entry Flow](#3-entry-flow)
4. [Home Dashboard](#4-home-dashboard)
5. [Explore / Discovery](#5-explore--discovery)
6. [Spaces System](#6-spaces-system)
7. [Profile & Settings](#7-profile--settings)
8. [Lab Ecosystem](#8-lab-ecosystem)
9. [Shell, Navigation, About & Notifications](#9-shell-navigation-about--notifications)

---

## 0. Platform Sitemap

> **Complete route inventory** — 64 pages, 335 API routes. Every ideation brief below operates within this structure.

### Navigation Pillars

4-pillar system defined in `apps/web/src/lib/navigation.ts`:

| Pillar | Hub | Match Pattern | Purpose |
|--------|-----|---------------|---------|
| **Home** | `/home` | `/home`, `/feed`, `/explore` | Dashboard + discovery |
| **Spaces** | `/spaces` | `/spaces`, `/s/` | Communities + residences |
| **Lab** | `/lab` | `/lab` | Tool builder + management |
| **You** | `/me` | `/me`, `/profile`, `/settings`, `/u/` | Profile + account |

### Public Pages (No Auth)

| Route | Purpose |
|-------|---------|
| `/` | Landing page + signup |
| `/login` | Authentication entry |
| `/enter` | Entry/onboarding flow |
| `/about` | About HIVE |
| `/legal/privacy` | Privacy policy |
| `/legal/terms` | Terms of service |
| `/legal/community-guidelines` | Community guidelines |
| `/schools` | School/campus discovery |
| `/offline` | Offline fallback |

### Protected Pages by Pillar

#### Home Pillar (4 pages)
| Route | Purpose |
|-------|---------|
| `/home` | Main dashboard + feed |
| `/feed` | Alternative feed view |
| `/feed/settings` | Feed preferences |
| `/explore` | Space discovery |

#### Spaces Pillar (8 pages)
| Route | Purpose |
|-------|---------|
| `/spaces` | Your spaces directory |
| `/s/[handle]` | Space residence view |
| `/s/[handle]/analytics` | Space analytics (admin) |
| `/s/[handle]/tools/[toolId]` | Space tool detail |
| `/spaces/[spaceId]/setups` | Space setup list |
| `/spaces/[spaceId]/setups/[deploymentId]` | Setup detail |
| `/spaces/[spaceId]/tools` | Space tools list |
| `/spaces/[spaceId]/tools/[deploymentId]` | Tool deployment view |

#### Lab Pillar (18 pages)
| Route | Purpose |
|-------|---------|
| `/lab` | Lab dashboard + tool list |
| `/lab/new` | Create new tool |
| `/lab/create` | Alternative create tool |
| `/lab/[toolId]` | Tool detail/editor |
| `/lab/[toolId]/edit` | Tool editor |
| `/lab/[toolId]/preview` | Tool preview |
| `/lab/[toolId]/settings` | Tool settings |
| `/lab/[toolId]/run` | Tool runner |
| `/lab/[toolId]/runs` | Tool run history |
| `/lab/[toolId]/analytics` | Tool analytics |
| `/lab/[toolId]/deploy` | Deploy tool |
| `/lab/setups` | Setup templates list |
| `/lab/setups/new` | Create new setup |
| `/lab/setups/[setupId]` | Setup detail |
| `/lab/setups/[setupId]/edit` | Setup editor |
| `/lab/setups/[setupId]/builder` | Setup builder |
| `/lab/templates` | Tool templates |

#### You Pillar (17 pages)
| Route | Purpose |
|-------|---------|
| `/me` | My profile hub |
| `/me/edit` | Edit my profile |
| `/me/settings` | Account settings |
| `/me/calendar` | My calendar |
| `/me/connections` | My connections |
| `/me/notifications` | My notifications |
| `/me/reports` | My reports |
| `/settings` | Global settings |
| `/profile` | Alternative profile view |
| `/profile/[id]` | User profile by ID |
| `/profile/edit` | Profile editor |
| `/profile/calendar` | Profile calendar |
| `/profile/connections` | Profile connections |
| `/profile/settings` | Profile settings |
| `/u/[handle]` | Public user profile by handle |
| `/calendar` | Calendar view |
| `/notifications` | Notifications hub |

#### Secondary Features (8 pages)
| Route | Purpose |
|-------|---------|
| `/notifications/settings` | Notification preferences |
| `/leaders` | Leaderboards |
| `/rituals` | Rituals/challenges list |
| `/rituals/[slug]` | Ritual detail |
| `/resources` | Resource library |
| `/templates` | Template gallery |
| `/hivelab` | Lab experiments |
| `/design-system` | Design system showcase |

### API Routes (335 Total)

| Domain | Routes | Complexity | Key Endpoints |
|--------|--------|-----------|---------------|
| **Spaces** | 96 | High | Chat, posts, members, tools, automations, boards, tabs, webhooks |
| **Admin** | 59 | High | Moderation, analytics, school management, permissions |
| **Tools** | 40 | High | Deploy, execute, versions, automations, capabilities |
| **Profile** | 26 | Medium | Identity, connections, privacy, preferences, stats |
| **Auth** | 17 | High | OTP flow, sessions, admin grants, handle check |
| **Rituals** | 10 | Medium | Participation, leaderboards, phases |
| **Setups** | 8 | High | Orchestration, templates, deployments |
| **Realtime** | 7 | High | WebSocket, presence, typing, notifications |
| **Calendar** | 7 | Medium | Google Calendar integration, free time, conflicts |
| **Campus** | 6 | Low | Buildings, dining, campus detection |
| **Other** | 59 | Varies | Waitlist, DM, posts, notifications, search, templates, feed, etc. |

### Auth & Middleware Rules

| Layer | Pattern | Rate Limit | Notes |
|-------|---------|-----------|-------|
| **Protected** | `withAuthAndErrors` | 100/min | Campus isolation enforced via `campusId` from session |
| **Admin** | `withAdminAuthAndErrors` | 50/min | CSRF always enabled, permission-gated |
| **Public** | `withErrors` | 200/min | Health checks, CSRF tokens, landing |
| **Optional Auth** | `withOptionalAuth` | 100/min | Different behavior logged-in vs guest |
| **Auth endpoints** | `withErrors` + rate limit | 5/min | Login, verify, refresh |
| **AI endpoints** | `withAuthAndErrors` + rate limit | 5/min | LLM operations |
| **Search** | `withAuthAndErrors` + rate limit | 30/min | Search queries |

**Validation:** All API inputs validated with Zod schemas. CSRF auto-applied to POST/PUT/PATCH/DELETE in production.

### Page Count Summary

| Category | Pages | Auth |
|----------|-------|------|
| Public | 9 | No |
| Home pillar | 4 | Yes |
| Spaces pillar | 8 | Yes |
| Lab pillar | 18 | Yes |
| You pillar | 17 | Yes |
| Secondary | 8 | Yes |
| **Total** | **64** | — |

---

## 1. Global Design Constitution

### Non-Negotiable Standards for Page-Level Ideation

**Extracted from codebase:** `/Users/laneyfraass/Desktop/HIVE` (February 2026)

---

### 1. VISUAL DNA

#### Color Palette (Exact Hex Values)

**Foundation — Neutral Gray Scale (No Tint)**
- `#0A0A0A` — Page background (bgGround) — THE VOID
- `#141414` — Card surfaces (bgSurface) — THE STAGE
- `#1A1A1A` — Hover/elevated states (bgElevated/bgHover) — ATTENTION
- `#242424` — Active/pressed states (bgActive) — TACTILE
- `#2A2A2A` — Border default
- `#3A3A3A` — Border hover
- `#4A4A4A` — Border strong
- `#52525B` — Text disabled
- `#71717A` — Text placeholder
- `#818187` — Text subtle (timestamps, metadata)
- `#A1A1A6` — Text secondary (supporting content)
- `#D4D4D8` — Light text (accents)
- `#FAFAFA` — Text primary (main content)

**Brand Accent — HIVE Gold (Single Canonical Value)**
- `#FFD700` — Primary gold (ONLY for dopamine moments)
- `#E6C200` — Gold hover state
- `#CC9900` — Gold dimmed/inactive
- `rgba(255, 215, 0, 0.15)` — Gold glow effect (for backgrounds)
- `rgba(255, 215, 0, 0.3)` — Gold borders
- `rgba(255, 215, 0, 0.1)` — Gold subtle backgrounds

**Status Colors (Rare)**
- `#00D46A` — Success (green)
- `#FFB800` — Warning (yellow)
- `#FF3737` — Error (red)
- `#0070F3` — Info (blue)

**Interactive Overlays**
- `rgba(255, 255, 255, 0.04)` — Hover state (white overlay)
- `rgba(255, 255, 255, 0.08)` — Active state
- `rgba(255, 255, 255, 0.5)` — Focus rings (white, never gold)

**Philosophy (Non-Negotiable)**
- 95% of UI = grayscale (neutral)
- Gold reserved ONLY for: Primary CTAs, achievements, presence indicators, featured badges
- No gold in: decorative borders, icons, links, secondary buttons, hover states
- White focus rings (not gold) — HIVE brand differentiation
- High contrast, WCAG 2.1 AA compliant minimum

---

#### Typography Scale (Exact Values)

**Fonts (Single Canonical Pairing)**
| Role | Font | Why |
|------|------|-----|
| **Display** | Clash Display | Personality, memorable, geometric warmth |
| **Body** | Geist | Builder credibility, clean, dark-mode optimized |
| **Mono** | Geist Mono | Technical content, stats, code |

**Font Stack**
```
--font-display: "Clash Display", "SF Pro Display", system-ui, sans-serif
--font-body: "Geist", "SF Pro Text", system-ui, sans-serif
--font-mono: "Geist Mono", "SF Mono", ui-monospace, monospace
```

**Size Scale** (Mobile-optimized from 10px to 72px)
| Name | Size | Use |
|------|------|-----|
| `display-2xl` | 40px (2.5rem) | Hero headlines |
| `display-xl` | 36px (2.25rem) | Large headlines |
| `display-lg` | 32px (2rem) | Section headlines |
| `display-md` | 28px (1.75rem) | Page titles |
| `display-sm` | 24px (1.5rem) | Subsection titles |
| `heading-xl` | 20px (1.25rem) | Main headings |
| `heading-lg` | 18px (1.125rem) | Section headings |
| `heading-md` | 16px (1rem) | Subsection headings |
| `body-lg` | 16px (1rem) | Large body text |
| `body-md` | 14px (0.875rem) | Standard body (DEFAULT) |
| `body-sm` | 12px (0.75rem) | Small body text |
| `body-meta` | 11px (0.6875rem) | Metadata, timestamps |
| `body-xs` | 10px (0.625rem) | Labels, badges |

**Weight Usage (4 weights only)**
- `400` — Regular (body text, conversation)
- `500` — Medium (labels, emphasis, buttons)
- `600` — Semibold (headlines, subheads)
- `700` — Bold (rare, hero moments only)

**When To Use What Font**
- **Clash Display at 32px and above** — All hero sections, page titles
- **Geist for everything else** — Body text, subheads (up to 24px), UI

**Line Height (Breathing)**
- `1` — Hero headlines only
- `1.25` — Display text, headlines
- `1.5` — Body text (DEFAULT)
- `1.75` — Long-form, rare

**Letter Spacing**
- `-0.04em` — Large Clash headlines (tension)
- `0` — Body text (DEFAULT)
- `0.18em` — All caps labels/badges (caps variant)

---

#### Spacing System (4px Base Unit)

**Core Scale** (Tailwind 4px base)
```
0px, 2px, 4px, 6px, 8px, 10px, 12px, 14px, 16px, 20px, 24px, 28px, 32px,
36px, 40px, 44px, 48px, 56px, 64px, 80px, 96px, 112px, 128px, 144px,
176px, 192px, 208px, 224px, 240px, 256px, 288px, 320px, 384px
```

**Named Tokens** (Metaphor: Relationships)
| Space | Relationship | Usage |
|-------|--------------|-------|
| 4px | Touching (same element) | `--space-1` |
| 8px | Intimate (closely related) | `--space-2` |
| 12px | Close (grouped items) | `--space-3` |
| 16px | Comfortable (DEFAULT) | `--space-4` |
| 24px | Breathing (section items) | `--space-6` |
| 32px | Roomy (distinct groups) | `--space-8` |
| 48px | Spacious (major sections) | `--space-12` |
| 64px | Vast (page divisions) | `--space-16` |
| 96px | Grand (hero spacing) | `--space-24` |

**Component Spacing Guidelines**
- Button padding: 12px horizontal, 8px vertical
- Form field gaps: 16px
- Card padding: 24px
- Between cards: 16-24px
- Section padding: 48-64px
- Page margins (mobile): 16-24px
- Page margins (desktop): 48-96px
- Between sections: 64-96px

**Philosophy:** When in doubt, add space. If it feels cramped, double it.

---

#### Border Radius (Heavy Radius Design)

**Token Values** (Exact)
- `0` — No radius
- `0.5rem` (8px) — `radius-sm` — Small elements
- `0.75rem` (12px) — `radius-md` — Standard (buttons, inputs)
- `1rem` (16px) — `radius-lg` — Cards
- `1.5rem` (24px) — `radius-xl` — Large cards
- `2rem` (32px) — `radius-2xl` — Hero elements
- `9999px` — `radius-full` — Perfect circles (avatars, pills)

**Component Mapping**
| Element | Radius | Token |
|---------|--------|-------|
| Buttons | 12px | `radius-md` |
| Inputs | 12px | `radius-md` |
| Cards | 16-32px | `radius-lg` to `radius-2xl` |
| Modals | 16-32px | `radius-lg` to `radius-2xl` |
| Avatars | Full | `radius-full` |
| Badges | Full | `radius-full` |

---

#### Opacity & Layering System

**Text Opacity Hierarchy**
- `100%` (primary) — Main content
- `65%` (secondary) — Supporting content
- `40%` (subtle) — Timestamps, metadata
- `25%` (muted) — Barely visible hints

**Interactive Opacity Tiers**
- `3%` — Subtle white overlay (hover baseline)
- `6%` — Muted fill (interactive default)
- `10%` — Emphasis (hover lift)
- `15%` — Active state

**Glass Effect**
- `blur(4px)` — Subtle secondary content
- `blur(8px)` — Glass surfaces
- `blur(12px)` — Modal overlays
- `blur(16px)` — Strong separation
- `blur(40px)` — Background atmosphere

---

### 2. MOTION SYSTEM

#### Duration Tiers (Timing is Non-Negotiable)

**Millisecond Scale** (What they feel like)
| Duration | Feeling | Use Case | Token |
|----------|---------|----------|-------|
| 50ms | Micro-feedback | State changes | `instant` |
| 100ms | Snap feedback | Toggles, micro-interactions | `micro` |
| 150ms | Quick gesture | Fast hovers | `snap` |
| 200ms | Looking at someone | Button hovers, focus | `quick` |
| 300ms | Walking across room | Default transitions, modals | `standard` (DEFAULT) |
| 400ms | Settling into chair | Smooth movements, panels | `smooth` |
| 500ms | Considered movement | Layout changes | `flowing` |
| 600ms | Gentle rhythm | Word reveals, gentle entrances | `gentle` |
| 700ms | Everyone notices | Celebrations ONLY | `dramatic` |
| 800ms | Substantial movement | Container animations | `slow` |
| 1200ms | Major reveals | Hero entrances, about page | `hero` |

**Philosophy:** Subtle, <300ms is default. Longer durations reserved for celebrations and major state changes. Reduced motion: 0.01ms fallback.

---

#### Easing Curves (Cubic-Bezier Arrays)

**Primary Easing — Use 90% of the time**
```
cubic-bezier(0.23, 1, 0.32, 1)
```
Smooth, natural, decelerate gracefully (Vercel-inspired)

**Snap Easing — Toggles, decisive feedback**
```
cubic-bezier(0.25, 0.1, 0.25, 1)
```
Quick, decisive (high snap point)

**Dramatic Easing — Achievements, celebrations ONLY**
```
cubic-bezier(0.165, 0.84, 0.44, 1)
```
Cinematic, special moments only

**Directional**
- `cubic-bezier(0, 0, 0.2, 1)` — Ease out (exits)
- `cubic-bezier(0.4, 0, 1, 1)` — Ease in (entrances)

**Never use:** Bouncy curves, aggressive in/out, linear (except progress bars)

---

#### Spring Physics Presets

**Named Presets** (Framer Motion config)
```typescript
{
  snappy: { stiffness: 400, damping: 30 },      // Buttons
  default: { stiffness: 200, damping: 25 },    // General
  gentle: { stiffness: 100, damping: 20 },     // Modals
  bouncy: { stiffness: 300, damping: 15 },     // Celebrations
  snapNav: { stiffness: 500, damping: 25, mass: 0.5 }  // Nav (HIVE signature)
}
```

**When To Use**
- **Spring for:** Hover effects, scale changes, entrance animations
- **Transition for:** Linear movements, page fades, quick feedback

---

#### Signature Motion Patterns

**Pattern 1: REVEAL** (Fade + slide up)
```
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0, transition: { duration: 300ms, ease: default } }
```
Use for: List items, cards, content entry

**Pattern 2: SURFACE** (Scale from 0.95 + fade)
```
initial: { opacity: 0, scale: 0.95 }
animate: { opacity: 1, scale: 1, transition: spring.default }
```
Use for: Modals, popovers, dropdowns

**Pattern 3: STAGGER** (Sequential reveals)
```
container: { transition: { staggerChildren: 0.05 } }  // 50ms between items
item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
```
Use for: List animations, feed items

**Pattern 4: BUTTON PRESS**
```
rest: { scale: 1, y: 0 }
hover: { scale: 1.02, y: -1, transition: spring.snappy }
tap: { scale: 0.97, y: 1, transition: spring.snappy }
```

**Pattern 5: BREATHING** (Life indicators)
```
animation: breathe 4s ease-in-out infinite;
@keyframes breathe {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
```

---

### 3. NAVIGATION ARCHITECTURE

#### 4-Pillar Structure (Feb 2026)

**THE FOUR PILLARS** (Non-negotiable, single source of truth)
```typescript
NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/home', icon: HomeIcon },
  { id: 'spaces', label: 'Spaces', href: '/spaces', icon: SpacesIcon },
  { id: 'lab', label: 'Lab', href: '/lab', icon: BeakerIcon },
  { id: 'you', label: 'You', href: '/me', icon: UserIcon },
]
```

**What Each Pillar Owns**
| Pillar | Routes | Purpose |
|--------|--------|---------|
| **Home** | `/home`, `/feed`, `/explore` | Dashboard + discovery (merged) |
| **Spaces** | `/spaces`, `/s/*` | Your communities & residences |
| **Lab** | `/lab` | Build tools for your spaces |
| **You** | `/me`, `/profile`, `/settings`, `/u/*` | Own profile + settings |

**Active State Detection** (Regex patterns in `navigation.ts`)
```typescript
matchPattern: /^\/home(\/|$)|^\/feed(\/|$)|^\/explore(\/|$)/
matchPattern: /^\/spaces(\/|$)|^\/s\/(\/|$)/
matchPattern: /^\/lab(\/|$)/
matchPattern: /^\/me(\/|$)|^\/profile(\/|$)|^\/settings(\/|$)|^\/u\//
```

---

#### Shell Architecture

**Desktop Layout**
- **Sidebar** (Floating, collapsible)
  - Identity Card (user avatar + name) — Top
  - Nav Card (4 pillars) — Prominent
  - Spaces Card (scrollable list of communities) — Bottom
  - Collapse toggle — Toggle width 256px ↔ 72px
  
- **Top Bar** (Fixed at top)
  - Left: Breadcrumbs (context)
  - Right: Search + Notifications
  
- **Main Content** (Responsive to sidebar state)
  - Sidebar margin: `sidebarWidth + margin*2`
  - Top margin: `topbarHeight` (64px)

**Mobile Layout**
- **Bottom Navigation** (Fixed, 72px height)
  - 4 pillar icons + badge for notifications
  - Full-width tap targets
  - No sidebar on mobile
  
- **Top Bar** (Fixed, 56px)
  - Search + Notifications
  - No breadcrumbs on mobile

**Spacing Constants** (Exported from `layout-tokens.ts`)
```typescript
HEADER_HEIGHT = 56px        // Both desktop & mobile
SIDEBAR_WIDTH = 260px       // Desktop sidebar
SIDEBAR_COLLAPSED_WIDTH = 72px
MOBILE_BREAKPOINT = 768px   // lg in Tailwind
```

**Keyboard Shortcuts**
- `Cmd/Ctrl + K` → Open command palette
- `[` key → Toggle sidebar collapse

---

### 4. COMPONENT PATTERNS (Vocabulary of UI Atoms)

#### Button Variants (4 Core Patterns)

**Variant 1: DEFAULT**
- Background: `rgba(255, 255, 255, 0.03)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Text: White
- Hover: `rgba(255, 255, 255, 0.06)`
- Use: Secondary actions, standard buttons

**Variant 2: PRIMARY**
- Background: `#FFFFFF`
- Text: `#0A0A09` (black)
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Hover: `rgba(255, 255, 255, 0.9)`
- Use: Main CTAs ONLY (sparingly)

**Variant 3: GHOST**
- Background: Transparent
- Text: `rgba(255, 255, 255, 0.5)`
- Border: Transparent
- Hover: `rgba(255, 255, 255, 0.04)` background + white text
- Use: Tertiary actions, light touch

**Variant 4: DESTRUCTIVE**
- Background: `rgba(255, 55, 55, 0.1)`
- Text: `#FF3737`
- Border: `1px solid rgba(255, 55, 55, 0.2)`
- Use: Delete, dangerous actions

**Sizes** (Consistent height: 44px minimum)
- Small: `h-9` (36px)
- Default: `h-11` (44px) — STANDARD
- Large: `h-12` (48px)

**Padding** (Horizontal, consistent vertical)
- Button padding: 12px horizontal, 8px vertical
- Button radius: 12px (radius-md)
- Font weight: 500 (medium)
- Transition: 200ms ease-out (quick duration)
- Focus ring: 2px white/50 with 2px offset

---

#### Card Variants (Elevation System)

**Base Card**
- Background: Gradient `from-[#1c1c1c]/95 to-[#121212]/92`
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Shadow: Layered (base + glow + inset light)
- Radius: 12-16px (lg-xl)

**States**
| State | Border | Shadow Strength | Use |
|-------|--------|-----------------|-----|
| Resting | `rgba(255,255,255,0.08)` | Subtle | Default |
| Raised (Hover) | `rgba(255,255,255,0.1)` | Medium | Interactive |
| Floating (Active) | `rgba(255,255,255,0.12)` | Strong | Featured |

**Padding Standard**
- Default: 24px (space-6)
- Compact: 16px (space-4)

**Interactive Cards**
- Hover state: Elevation shift + border emphasis
- Active state: Scale 0.98, shadow reduce
- Transition: 200ms ease-out

---

#### Input Pattern (Form Fields)

**Base Input**
- Background: `rgba(255, 255, 255, 0.03)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Text: White
- Placeholder: `rgba(255, 255, 255, 0.25)`
- Focus: Border `rgba(255, 255, 255, 0.2)`, bg `rgba(255, 255, 255, 0.05)`
- Focus ring: `2px ring-white/20` with offset
- Disabled: opacity 40%, cursor not-allowed

**Sizes**
- Small: `h-9` px-3
- Default: `h-11` px-4 (STANDARD)
- Large: `h-12` px-4

**Error State**
- Border: `1px solid rgba(255, 55, 55, 0.4)`
- Focus border: `rgba(255, 55, 55, 0.6)`

**Radius:** 12px (radius-xl — matches button radius for consistency)

---

#### Badge/Pill Pattern

**Base Badge**
- Padding: 4px horizontal, 2px vertical (space-1, space-0.5)
- Radius: Full (pill)
- Font size: 10px (body-xs)
- Font weight: 500 (medium)
- Background: `rgba(255, 255, 255, 0.06)`
- Text: `rgba(255, 255, 255, 0.7)`
- Border: Optional, subtle

**Variants**
- Default: Neutral gray
- Gold: For featured only (`#FFD700` background, black text)
- Status: Success/warning/error (dim background, colored text)

---

### 5. SHELL ARCHITECTURE

#### UniversalShell Structure (Layout Reference)

**Component Hierarchy**
```
UniversalShell
├── GlobalSidebar (desktop only)
│   ├── IdentityCard
│   ├── NavCard (4 pillars)
│   ├── SpacesCard (scrollable)
│   └── CollapseToggle
├── TopBar
│   ├── TopBarBreadcrumbs
│   └── TopBarActions (search, notifications)
├── main (responsive margin/padding)
│   └── children (page content)
├── MobileNav (mobile only, fixed bottom)
└── CommandPalette (keyboard-driven)
```

**Responsive Breakpoint**
- `< 768px` → Mobile (bottom nav, no sidebar)
- `>= 768px` → Desktop (floating sidebar, top bar)

**Sidebar Persistence**
- Collapsed state saved to `localStorage` key: `hive-sidebar-collapsed`
- Default: Expanded
- Toggle via `[` key shortcut

**Z-Index Layers**
```typescript
base: 0
dropdown: 10
sticky: 20
fixed: 30
modalBackdrop: 40
modal: 50
popover: 60
tooltip: 70
toast: 80
```

---

### 6. BRAND PERSONALITY

#### Design Philosophy: "Campus at 2am"

**The Core Metaphor**
> HIVE feels like campus at 2am — when the pretense drops, the real ones remain, and things actually happen.

**What 2am Means**
| Quality | Design Expression |
|---------|-------------------|
| **Warmth in the dark** | Dark mode, gold accents, warm glows |
| **Presence without pressure** | Ambient life indicators, breathing pulses |
| **Discovery** | Finding people organically, no algo manipulation |
| **Permission** | No performance metrics, no follower counts |
| **Momentum** | Things happening, activity visible, alive |

**Inside/Outside Dynamic**
- **Inside (students):** Full access, ownership, "it's yours"
- **Outside (non-students):** See the worldview, see the pulse, but can't enter
- **The gate:** `.edu` requirement makes inside meaningful

---

#### Voice & Tone (Copy Standards)

**Core Statement**
> "We stopped waiting for institutions. Students build what's missing. Your org, your rules, no permission."

**Voice Rules (Non-Negotiable)**
| DO | DON'T |
|----|-------|
| Short declaratives ("You're in.") | Exclamation marks (except celebrations) |
| Ownership language ("Yours", "Your rules") | Corporate warmth ("We're so glad!") |
| Builder verbs (Build, Create, Deploy, Ship) | Apology mode ("Coming soon") |
| Peer tone | Marketing superlatives |
| Action-first | Passive voice |

**CTA Patterns**
- Primary: `Enter HIVE`, `Claim`, `Build`, `Create`, `Deploy`
- Secondary: `Browse`, `Explore`, `Skip`
- Destructive: `Delete this? Can't undo.`

**Empty States (Canvas, Not Absence)**
- "No messages yet" → "Start the conversation"
- "No events" → "Events start here"
- "No members" → "Invite your people"

**Error Messages (Peer, Not Institution)**
- "Something went wrong" → "Something broke."
- "Please try again later" → "Try again"
- Pattern: `[What happened]. [What they can do].`

**Success (Minimal Celebration)**
- "Successfully created!" → "Created" (or nothing)
- "You're in." (at onboarding completion)

**The 2am Test**
> Would this feel right at 3am in a quiet space with three real people?

---

### 7. DATA PATTERNS & AUTH

#### Auth Flow (Campus Isolation)

**Non-Negotiable Security Rules**
1. **Campus isolation:** Every query filters by `campusId` from session (NEVER from client)
2. **Real identity:** Campus email verification required (`.edu` domain)
3. **No anonymous users:** All users must be authenticated
4. **Zod validation:** All API inputs validated with Zod schemas
5. **No hardcoded secrets:** Environment variables for all tokens

**Auth Pattern**
```typescript
// On route: GET session.campusId (server-side)
// On query: WHERE campusId = session.campusId
// Never: WHERE campusId = req.body.campusId
```

**Session Context**
- Campus ID (verified)
- User ID
- Roles (builder, member, leader, etc.)
- Email domain (verified `.edu`)

---

#### Feature Flags Pattern

**Usage Convention**
```typescript
import { useFeatureFlags } from '@/hooks/use-feature-flags';
const { dmsEnabled, labEnabled } = useFeatureFlags();
if (!dmsEnabled) return null;
```

**Flag Naming**
- Lowercase with camelCase
- End with feature name: `dmsEnabled`, `labEnabled`, `ritualsPilot`

---

### 8. FORBIDDEN PATHS & QUALITY GATES

#### What Must Never Happen

- ✗ Hardcoded colors (all from tokens)
- ✗ Hardcoded spacing (all from scale)
- ✗ Hardcoded durations (use motion tokens)
- ✗ Anonymous users (gate behind `.edu`)
- ✗ Buttons with no handlers (no `console.log` placeholders)
- ✗ Dead ends (every state shows next action)
- ✗ Motion > 300ms without reason (celebrate only)
- ✗ Exclamation marks in core UI (rare celebrations only)
- ✗ Client-side campus filtering (server-only)
- ✗ Duplicate components (reuse from `packages/ui` first)

---

### 9. QUALITY GATES (Before Every Merge)

**Visual Audit**
- [ ] All colors from `colors-unified.ts` (no hex values in components)
- [ ] All spacing from token scale (no px values inline)
- [ ] All motion < 300ms except celebrations
- [ ] Focus rings are white, not gold
- [ ] Gold used only for dopamine moments (max 1-2% of UI)
- [ ] Buttons have real handlers (no stubs)

**UX Audit**
- [ ] Empty states guide users (canvas language)
- [ ] Error messages are actionable ("Try again" not "Error 500")
- [ ] Navigation matches 4-pillar structure
- [ ] Mobile breakpoint tested (768px)
- [ ] Keyboard shortcuts work (`Cmd+K`, `[`)

**Code Audit**
- [ ] Zod validation on all API inputs
- [ ] Campus ID from session, not client
- [ ] No duplicate component logic
- [ ] Motion uses `@hive/tokens` presets
- [ ] Design tokens imported from `packages/tokens`

---

### 10. FILE MAP (Where Things Live)

| Need | Location |
|------|----------|
| Design tokens (colors, motion, spacing) | `packages/tokens/src/` |
| Component primitives (Button, Card, Input) | `packages/ui/src/design-system/primitives/` |
| Composed components (ChatComposer, TabNav) | `packages/ui/src/design-system/components/` |
| Shell/layout (UniversalShell, TopBar) | `packages/ui/src/shells/` |
| Pages | `apps/web/src/app/[route]/page.tsx` |
| API routes | `apps/web/src/app/api/[domain]/route.ts` |
| Hooks | `apps/web/src/hooks/use-[name].ts` |
| Feature components | `apps/web/src/components/[feature]/` |
| Navigation config | `apps/web/src/lib/navigation.ts` |
| Auth middleware | `apps/web/src/lib/middleware/auth.ts` |
| Campus context | `apps/web/src/lib/campus-context.ts` |

---

### 11. QUICK REFERENCE

#### Most-Used Tokens

**Colors**
```
--bg-ground: #0A0A0A (page bg)
--bg-surface: #141414 (cards)
--text-primary: #FAFAFA (main text)
--text-secondary: #A1A1A6 (supporting)
--life-gold: #FFD700 (dopamine only)
--focus-ring: rgba(255, 255, 255, 0.5) (white, not gold)
```

**Spacing**
```
--space-4: 16px (default gap)
--space-6: 24px (card padding)
--space-12: 48px (section padding)
```

**Motion**
```
--duration-quick: 200ms (hover)
--duration-smooth: 300ms (default)
--ease-smooth: cubic-bezier(0.23, 1, 0.32, 1)
```

**Radius**
```
--radius-md: 12px (buttons, inputs)
--radius-lg: 16px (cards)
--radius-full: pills, avatars
```

---

### 12. DECISION FILTER (Every Page Inherits This)

**Before designing anything, ask:**

**1. Does this help a student find their people, join something real, and come back tomorrow?**
- If no → kill it, defer it, or ignore it

**2. Is this in the 4 pillars or supporting them?**
- Home (dashboard + discovery)
- Spaces (communities)
- Lab (building)
- You (identity)

**3. Does it feel like 2am?**
- Warmth in dark? Presence without pressure? Discovery? Permission? Momentum?

**4. Would this work at 3am with three real people?**
- Cringe-free? No apology mode? Authentic? Real?

**5. Is gold used only for dopamine?**
- CTAs, achievements, presence, featured only
- No decorative gold

**6. Does every state show the next action?**
- Empty state → guide
- Error → recovery
- Success → next step
- Loading → what's happening

**7. Is motion subtle and purposeful?**
- Default duration: 300ms or less
- Celebrations only: 500ms+
- All from tokens, nothing hardcoded

---

### CODEBASE REFERENCE

All values in this document are extracted from:
- `/packages/tokens/src/colors-unified.ts` (color system)
- `/packages/tokens/src/typography.ts` (type scale)
- `/packages/tokens/src/spacing.ts` (spacing system)
- `/packages/tokens/src/radius.ts` (radius system)
- `/packages/tokens/src/motion.ts` (motion system)
- `/packages/ui/src/design-system/layout-tokens.ts` (layout constants)
- `/packages/ui/src/shells/UniversalShell.tsx` (shell architecture)
- `/apps/web/src/lib/navigation.ts` (nav structure)
- `/apps/web/src/app/globals.css` (CSS tokens)
- `/CLAUDE.md` and design docs (philosophy + voice)

This constitution is **the source of truth** for all page-level ideation.

---

## 2. Landing Page

### LANDING PAGE — IDEATION BRIEF

#### 1. Current State

HIVE's landing page is a **narrative editorial layout** with sophisticated motion choreography and a clear five-section structure: Hero ("Build together"), The Gap (institutional failure), The Pattern (student-led movement), Momentum (social proof metrics), and closing CTA. It uses **Clash Display headlines** (52–150px range) in a giant text-over-image style, **dark mode throughout** (#030303 background), **gold accents sparingly** (#FFD700), and **staggered text animations** with parallax effects. The page feels confident and designer-forward—like a manifesto that's been iterated. Motion is throughout: scroll-linked parallax, word-by-word stagger reveals, animated counters, and button hover states. It currently pitches the vision before you get to the app.

---

#### 2. User Intent

**Who:** First-time students arriving after seeing HIVE mentioned, or campuses evaluating the platform.  
**What they're thinking:** "What is this?" / "Is it worth my time?" / "Who is this for?"  
**Action we want:** "Enter HIVE" (via campus verification) or "Get notified when my campus is live" (waitlist).  
**Blocking question:** The page must convince them the problem is real before selling the solution.

---

#### 3. What's Working

From the code:

- **Powerful headline contrast** — "Build" in white, "together." in white/20 opacity creates intrigue
- **Parallax scale gives depth** — Big numbers (01, 02, 03) fade into the background; scroll-linked parallax on full sections adds visual momentum
- **Gold is disciplined** — Only on the logo, accent line, card borders, and stat labels. Never gratuitous. Feels precious.
- **Copy density is right** — Three problems (too slow, too rigid, too extractive) are scannable as labels + descriptions, not dense prose
- **Motion is purposeful** — 0.6–1.2s durations, spring easing (cubic-bezier premium), no unnecessary micro-interactions. Stagger text by 0.08s per word feels like speech.
- **Waitlist modal works** — Success state, validation, real submission. Not fake.
- **Section borders are subtle** — White/[0.04] hairlines separate sections without heavy visual breaks

---

#### 4. What's Locked (Non-negotiable)

**Brand elements:**
- Gold accent (#FFD700) — brand identity marker
- Logo (mark variant, small, gold) in header
- Clash Display font for headlines
- Dark theme (#030303 base)

**Navigation targets:**
- "Enter HIVE" → `/enter?schoolId=${activeSchool.id}&domain=${activeSchool.domain}`
- "About" → `/about`
- "Other campus" → Waitlist modal for schools not yet active
- Footer: Terms/Privacy links

**Responsive requirements:**
- Hero headline scales with `clamp(52px, 13vw, 150px)`
- Mobile-first: stacked sections, full-width padding (px-6)
- Grid layout uses md:col-span- for desktop, stacked on mobile

**Current copy anchors:**
- "Infrastructure for students who build" (value prop)
- "Spaces to organize. Tools to create. Community that persists." (three pillars)
- "Institutions can't build what students need" (problem thesis)
- "Students build what's missing" (pattern inversion)

---

#### 5. What's Open (Free to Reimagine)

**Section structure and ordering:**
- Current: Hero → Gap → Pattern → Momentum → CTA
- Could be: Hero → Momentum → Pattern → Deep Dive → CTA
- Could be: Hero → Visual demo of what "Spaces" means → Then problem/solution → Then proof
- Could be: Single continuous narrative vs. modular sections

**Copy and messaging hierarchy:**
- Tone: manifesto-like vs. invitational vs. conversational vs. credibility-focused
- Lead with vision or lead with proof?
- How much backstory (Jacob's two years) belongs here vs. on /about?

**Visual treatment of sections:**
- Current: minimal color, mostly white/gold/void
- Could add: subtle category colors (student-org blue, residential, greek accents)
- Could add: illustrated moments of campus life (without stock photos—maybe diagrams or data viz)
- Could add: student testimonials with real faces (if we have them)

**Animation choreography:**
- Current: scroll-linked parallax + entrance stagger
- Could add: interactive hover states on feature cards (expand, reveal detail)
- Could add: scroll-triggered counter animations that feel celebratory
- Could add: scroll-locked sections (sticky hero, then scroll into next section)

**Social proof / momentum:**
- Current: Three stats (400+ orgs, UB first campus, '26 expanding)
- Could be: Real user count, active posts/day, campus coverage map
- Could be: testimonial quotes from org leaders
- Could be: "X organizations launched" → "Y members joined" → "Z events organized"

**Mobile-specific experiences:**
- Current: responsive but desktop-first layout
- Could add: Mobile phone mockup of app interface (Spaces view, member list, etc.)
- Could add: Touch-optimized CTA placement (sticky bar at mobile bottom)

---

#### 6. Adjacent Flows

**Upstream (how they arrive here):**
- Organic search ("student org software")
- Social (LinkedIn, Twitter, campus Discord)
- Referral (word of mouth from early users)

**Downstream (where they go):**
- `/enter` — Email verification + onboarding (4-phase: gate, naming, field, crossing)
- `/about` — Full narrative (Jacob's story, BeforeAfter visualization, tool features)
- Waitlist modal → Email captured for campus notification
- Footer links → `/legal/terms`, `/legal/privacy`

**Key transition:** Landing page must feel like a preview of the vibe, not a duplicate of /about. Currently, they're distinct (landing is punch-you-in-face vision; about is long-form narrative). That's correct.

---

#### 7. Competitive Context

**Linear** (command palette for teams):
- Clean, minimal aesthetic (no color except for accent)
- Headline emphasis on "what" not "why"
- Social proof embedded in copy, not highlighted separately
- Motion is restrained (200-300ms max)

**Notion** (workspace OS):
- Visual metaphor (workspace = desktop) up front
- Multiple entry points (product, pricing, manifesto)
- Use case cards organized by persona
- Lots of whitespace; breathing room between sections

**Vercel** (deployment platform):
- Video hero (what it does in motion)
- Feature cards with small GIFs showing interaction
- "Deploy in 30 seconds" mentality—prove value immediately
- Social proof is testimonials, not just numbers

**Arc** (browser):
- Narrative-first (manifesto feel)
- Aesthetic is the pitch (design as proof of concept)
- Minimal copy, lots of empty space
- Scroll reveals the "why" progressively

**What's worth exploring:**
- **Video/interactive hero** (show a Space being used, not just headline)
- **Persona segmentation** (Student leader, org founder, campus admin see different narratives)
- **Fast proof of concept** (can you join a Space in <30 seconds on the landing page?)
- **Testimonial design** (real quotes from early users, not generic praise)
- **Abundance of space** (current page is packed; what if we slowed it down?)

---

#### 8. Ideation Prompts

**8.1** Should the landing page feel like a **manifesto or an invitation**?  
Manifesto = "We believe students deserve better" (current direction, confidence-led)  
Invitation = "Come see what your classmates are building" (social-proof led, FOMO-light)

**8.2** How might we **show the user experience without requiring login**?  
E.g., embedded iframe of a real Space, interactive demo card, clickable prototype, video walkthrough, or animated sequence that mimics the app UX?

**8.3** Should we **lead with the vision or lead with proof**?  
Current: Vision first (why the problem exists) → Proof later (metrics)  
Alternative: Proof first (look, real people are using this) → Vision (here's why it matters)

**8.4** How do we **display community/network effects visually**?  
Current: Three stat cards (400+, UB, '26)  
Could be: Network ripple (like the /about page), member count map by campus, "X tools built this month," activity heatmap, or testimonial carousel

**8.5** What if we **killed the "gap" section and opened with user work**?  
Instead of explaining why institutions fail, what if the first thing you see after the hero is a student org actually *using* HIVE—a glimpse of a Space, a posted event, a tool in action?

**8.6** Should the mobile experience be **a vertical scroll of the desktop sections, or a mobile-first redesign**?  
Current: Responsive desktop layout (works, but not optimized for thumb scroll)  
Could be: Mobile hero → Swipeable features → Full-screen CTA → Footer (each section is a "card" you swipe through)

**8.7** How prominent should **"Get Notified" be versus "Enter HIVE"**?  
Current: Secondary button, equal weight  
Question: Should it be hidden until they scroll? Or should there be a split-screen (active campuses vs. coming soon)?

---

#### Context for LLM Ideation

When you use this brief to generate creative directions, an LLM should be able to:

1. **Understand the constraints** — Gold only for brand moments; Clash Display headlines; dark mode; motion under 300ms
2. **Know what's proven** — Stagger animation works; parallax depth works; problem-first narrative works
3. **See the open questions** — Section order is flexible; tone can shift; proof can be weighted differently
4. **Reference competitors** — But stay true to HIVE's editorial, manifesto-like sensibility (not corporate, not cutesy)
5. **Generate multiple creative directions** — Not one "best" landing page, but 2-4 distinct approaches with different risk/reward profiles

**The output should describe:**
- Narrative arc (what story does the page tell?)
- Section structure (which sections in what order?)
- Visual treatment (colors, illustration, motion style)
- Proof strategy (how do you prove the claims?)
- Conversion path (where does the user click, and when?)

This brief is ready for LLM-powered creative generation.

---

## 3. Entry Flow

### 1. Current State

The Entry Flow is a 4-phase state machine (`Entry.tsx`) that guides students through real identity verification and profile initialization. It has been carefully designed with intentional naming ("THE WEDGE," "Crossing," etc.) and uses "About page-level" motion craft (Clash Display typography, gold accents, 1.2s premium easing). The flow executes in sequence: **Gate** (email + OTP code) → **Naming** (first/last name claim) → **Field** (graduation year + optional major) → **Crossing** (2-5 interests). Completion redirects to auto-joined spaces or `/home`. The architecture uses a centralized `useEntry` hook managing all state transitions, API calls, and handle availability checking; each phase has its own screen component (GateScreen, NamingScreen, FieldScreen, CrossingScreen) that renders into a shared container with AnimatePresence transitions.

**Completion rate assumptions:** Currently unknown, but the flow is being refined to be fast (6-digit OTP auto-verifies on completion, major is optional to reduce friction).

---

### 2. User Intent

**Emotional starting state:** Relief ("I found the right app") mixed with caution ("Will this actually let me in?"). They've probably clicked "Enter" from a landing page and are now at the threshold of membership.

**What they're afraid of:**
- Not being real enough / being rejected at the gate (verification anxiety)
- Losing anonymity (naming stage is scary—this is the wedge)
- Taking forever (impatience with forms)
- Making the wrong choice about major/interests (commitment anxiety)
- Being put in a box (too early profiling)

**What they want:**
- Proof they belong (verification is *good*, not a blocker)
- To express identity authentically (real names matter—it's a differentiator vs Discord)
- Control over what they share (optional major, flexible interests)
- Speed (don't make me think)
- A sense of *arrival* / celebration at the end (not just "welcome, here's home")

---

### 3. The Phases Today

| Phase | Input | Output | Message |
|-------|-------|--------|---------|
| **Gate** | Campus email + 6-digit OTP | Email verified, schoolId detected | "We don't let everyone in. Only builders." Exclusivity signal. |
| **Naming** | First/last name | Handle auto-generated (e.g., `johnsmith`), checked for collisions, variants offered if taken | "Claim your name. Real names. Real trust." THE WEDGE—first moment of irreversible commitment. |
| **Field** | Graduation year (required) + major (optional, searchable) | Year stored; major used to auto-join space if exists | "Class of..." → "What are you studying?" (morphing screen). Year is required; major optional to reduce friction. |
| **Crossing** | 2-5 interests (multi-select from 150+ interests across 8 categories) | Interests stored; used for feed personalization and community discovery | "What drives you?" 8 category tabs + search + "your picks" summary. Max 5 enforced. |

---

### 4. What's Locked (Non-Negotiable)

**Security & Identity:**
- Campus email verification (required; inferred from domain)
- OTP-based auth (no passwords; 6 digits, expires 10min)
- Real identity (first/last name; no anonymous users)
- Handle uniqueness (reserved atomically in Firestore transaction)
- Campus isolation (all queries filtered by `campusId` from session)

**Data We MUST Collect:**
- Email (verified)
- First/last name (identity claim)
- Handle (auto-generated from name or user-provided; if taken, API returns suggestions)
- Graduation year (required; determines class cohort)
- Interests (2-5 required; drives feed + community matching)

**OTP Pattern:**
- 6-digit input, auto-focuses next field, paste support
- Progressive gold intensity as digits fill (visual feedback)
- Auto-verifies when complete; shows success checkmark flash before transitioning
- Countdown to resend (60s), code expiry display

**API Contract** (`/api/auth/complete-entry`):
- Input: `firstName`, `lastName`, `role` ('student'|'faculty'|'alumni'), `major` (optional), `graduationYear`, `interests`, `handle` (optional; auto-generated if not provided)
- Output: User profile, handle (final), `autoJoinedSpaces`, redirect URL, tokens
- Error handling: `HANDLE_COLLISION` returns 3 suggestions; user can select one

---

### 5. What's Open (Free to Reimagine)

#### A. Phase Ordering & Grouping
- **Current:** 4 sequential phases (gate → naming → field → crossing), all at same URL `/enter`
- **Alternatives:**
  - **Collapse to 2 phases:** Gate + bulk form (name/year/major/interests on one screen, staggered reveals)
  - **Expand to 6 phases:** Separate handle customization, separate community identity checkboxes (international, first-gen, transfer, etc.), separate residence assignment
  - **Modal/drawer entry:** Instead of full-page, could be a modal overlay on home page
  - **Progressive profiling:** Collect only email + name at entry, defer interests to home page (faster initial onboarding, but loses "investment moment")

#### B. Visual Treatment of Each Phase
- **Current:** Large display typography (Clash Display), gold accents, subtle white/gold borders, blur transitions
- **Open questions:**
  - Should each phase have a unique visual theme? (e.g., Gate = austere/minimal, Naming = warm/golden, Field = academic/grid, Crossing = cosmic/expansive)
  - Should there be a "progression bar" beyond the 4 dots? (e.g., % complete, visual metaphor like "climbing a mountain")
  - Should backgrounds shift (void → warmer → more saturated)? Or stay consistent dark void?
  - Should phase labels change typeface or color per phase?

#### C. How Identity is Presented
- **Current:** Handle preview shown inline on naming screen with real-time availability check; collision recovery via suggestions
- **Alternatives:**
  - **Live profile preview card:** Show how their profile will look (avatar from Gravatar, name, handle, year, interests) progressively building up through phases
  - **Avatar upload at naming stage:** Instead of Gravatar auto-fetch, let them upload/select avatar
  - **Handle customization UI:** Allow editing handle beyond API suggestions (currently read-only after API collision)
  - **Name validation rules:** Could be stricter (no accents) or more permissive (allow special chars, allow display names)

#### D. Motion Choreography Between Phases
- **Current:** Framer Motion fade/blur/scale (24px y offset, 400-600ms, premium easing), staggered child animations
- **Open questions:**
  - Should phases *morph* rather than fade? (e.g., Gate inputs slide *into* Naming inputs)
  - Should there be a "progress line" that draws as you advance?
  - Should success moments have celebration motion? (checkmark, confetti, particle burst—currently only OTP has checkmark)
  - Should page *scroll to top* on phase change, or stay viewport-centered?
  - Should "going back" have different motion than "going forward"?

#### E. How Interests Are Selected
- **Current:** 8 categorized tabs + search + tag-style buttons, max 5, "your picks" summary below
- **Alternatives:**
  - **Conversation-style:** "If you had to pick 3 from these pairs, which?" (paired choice UX)
  - **Slider/ranking:** "Drag interests into order of importance"
  - **Swipe cards:** Tinder-style "yes/no" swipe for interests (faster, less cognitive load)
  - **AI-assisted:** "Based on your name/major, we think you'd like X, Y, Z" (with override)
  - **Expandable tree:** Interests organized hierarchically (Tech → Backend → Rust/Go/Python)
  - **Color-coded by affinity:** Show "distance" from their stated major/interests (e.g., if major is CS, show how related each interest is)

#### F. The "Crossing" Metaphor
- **Current:** Named "Crossing" (from Entry.tsx comment: "Narrative Arc: Outsider → Proven → Named → Claimed → Arrived"). But metaphor is subtle; not explicitly leveraged in UI.
- **Open questions:**
  - Does "crossing" resonate? Or is it too literary?
  - Should the metaphor be *visual*? (e.g., crossing a bridge, entering a gate, ascending levels)
  - Alternative metaphors: "Unlocking" (opening doors), "Joining" (tribal, inclusive), "Becoming" (transformation), "Building" (construction), "Rising" (leveling up)
  - Should phase names be user-facing? Or hidden (just numbers/progress)?

#### G. Progress Indication Style
- **Current:** 4 dots at bottom of page (filled = complete, active = larger/glow, future = subtle)
- **Alternatives:**
  - **Numbered steps:** "Step 1 of 4"
  - **Progress bar:** Horizontal bar showing % (25/50/75/100)
  - **Visual metaphor:** Staircase, climbing rope, path, constellation
  - **None:** Implicit progress via phase transitions (no visible indicator)
  - **Milestones:** Show phase name in top bar ("Prove Yourself" → "Identity" → "Timeline" → "Connect")

#### H. Completion Moment
- **Current:** Gold button "Enter HIVE" → API call → redirect to first auto-joined space or `/home` (silent, fast)
- **Open questions:**
  - Should there be a *celebration screen* before redirect? (e.g., "Welcome, [name]!" with confetti, 2-3s pause before auto-redirect)
  - Should they see their auto-joined spaces on this screen? ("You've joined Computer Science, First Gen, East Hall")
  - Should they be able to customize their profile right here (bio, avatar) or defer to settings?
  - Should the redirect be immediate (jarring) or animated (screen morphs into first space)?

---

### 6. Adjacent Flows

**Landing Page → Entry:**
- User clicks "Enter HIVE" or "Sign Up"
- Optionally selects school first (if multi-campus), which passes `schoolId` to `/enter?schoolId=...`
- Lands at Gate phase

**Entry → Home/Space:**
- After `completeEntry`, API returns `redirect` (either `/s/{spaceHandle}` for auto-joined space or `/home`)
- Browser redirects; user sees their profile + feed + spaces

**Waitlist Fork:**
- If school not yet active, Gate shows "Coming soon" screen with waitlist option
- Can join waitlist without full entry
- Returns to Gate email screen

---

### 7. Emotional Arc

| Phase | Should Feel | Currently Feels | Gap |
|-------|-------------|-----------------|-----|
| **Gate** | "Exclusive. I'm being vetted." | ✓ Austere, gate-like, gold accents signal preciousness | Minimal |
| **Naming** | "This is real. I'm committing." | ✓ Warm language ("Claim"), live handle check, border glow | Strong |
| **Field** | "I'm adding context. Okay to be incomplete." | ✓ Year is required (strong signal), major is optional (graceful opt-out), "Skip for now" button | Minimal |
| **Crossing** | "I'm finding my people. Investing." | ✓ Many interests to choose from, category tabs feel explorative, selected summary shows investment | Strong |
| **Completion** | "I made it. I belong. What's next?" | ? Silent redirect; no celebration. Lands on home/space (good if space is interesting, anticlimactic if home is empty) | **OPPORTUNITY** |

---

### 8. Competitive Context

**Discord Onboarding:**
- Minimal (username → select interests → done)
- Fast but forgettable
- No real identity requirement (pseudonymous)
- Feels like joining a channel, not a campus

**Figma Sign-up:**
- Email → password → name → team invite
- Professional but utilitarian
- No celebration; straight to product
- Works because product is immediately rewarding

**Linear Sign-up:**
- Email → workspace setup → invite teammates
- Task-focused
- Onboarding feels like configuration, not celebration
- Minimal motion; relies on product delight

**Notion Sign-up:**
- Email → workspace name → invite
- Fast (30 seconds)
- Minimal visual design; relies on empty state to guide
- No "celebration," but landing in Notion *is* the celebration

**Best Onboarding I've Experienced:**
- **Duolingo:** Gamified, immediate reward, adaptive difficulty, celebration at each milestone
- **Stripe:** Clear value prop at each step, progressive complexity, landing in dashboard feels earned
- **Mastodon (good instances):** Community-first, clear instance culture, onboarding explains federation, feels like joining something real
- **Superhuman:** Screenshare onboarding, personalized, white-glove, feels premium

**HIVE's Differentiator:** Real identity (vs. pseudonymous), campus-scoped (vs. global), relationship-focused (vs. task-focused). Lean into that.

---

### 9. Ideation Prompts

#### A. "What if the entry flow felt like unlocking something precious, not filling out a form?"

Currently: Input fields, progress dots, transitions.
Reimagine: What if each phase *revealed* something? (e.g., name entry unlocks a preview of the campus, year entry shows "your cohort," interests entry shows "people like you")

**Creative direction:** Physical metaphor of unlocking—keyholes, doors, vaults. Each phase is a key. By the end, they've unlocked access to the full platform.

---

#### B. "Should we show the user what they're building toward (a live profile preview that grows with each phase)?"

Currently: Real-time handle check, but no preview of final profile.
Reimagine: Naming screen shows "Your identity" card with name + generated handle. Field screen adds year + major to card. Crossing screen adds interests as badges. By completion, card is fully formed and looks like their profile.

**Benefit:** Investment loop—they see themselves taking shape. FOMO ("I look cool") and completion satisfaction.
**Risk:** Adds visual complexity; could distract from input focus.

---

#### C. "How might we make the OTP wait feel intentional rather than frustrating?"

Currently: Code sent → user pastes/enters → auto-verifies when complete → success checkmark flash.
Frustration: 10-minute expiry, "check your inbox" is passive.

Reimagine:
- **Hint about what's coming next:** While waiting for code, show teaser ("Next: you'll claim your name")
- **Micro-learning:** Show interesting fact about campus or HIVE while waiting
- **Ambient animation:** Instead of static wait, show a subtle breathing glow, constellation animation, or countdown
- **Resend as game mechanic:** "Resend in 45s" displayed with a visual countdown circle, not just text

---

#### D. "What if interests were discovered through a game rather than a grid?"

Currently: 8 category tabs + search + tag buttons. Works, but feels functional.
Reimagine:
- **Interest matching game:** "I show you 5 pairs; you pick which vibes more" (forced choice = faster, more engaging, less paralysis)
- **Serendipity mode:** "Surprise me with a random interest from X category" (adds delight, reduces decision fatigue)
- **Collaborative signals:** Show "50 people in your year picked this" (social proof, FOMO-lite)
- **Interest storylines:** Groups of related interests as "paths" or "journeys" (Software Engineering → AI/ML → Computer Vision as a coherent progression)

---

#### E. "Should the naming phase show handle collision recovery *differently*?"

Currently: "Taken — we'll pick a variant for you" + live-updating suggestions in preview. Feels good.
Reimagine:
- **More transparent variants:** Instead of 3 random suggestions at end, show the *process* of collision resolution in real-time (e.g., `johnsmith` taken → tries `johnsmith25` → available → "Your handle: @johnsmith25")
- **User-driven recovery:** Instead of auto-generating variants, let them customize (add number, change last name emphasis, use nickname) before final commit
- **Handle leaderboard:** "These similar handles are taken by X people; you'll be @johnsmith987" (reframe collision as "you're the 987th John Smith—that's okay!")

---

#### F. "What if we collapsed/expanded phases based on persona or entry friction?"

Currently: Fixed 4 phases for all users.
Reimagine:
- **Fast-track mode:** New user on campus → Gate + Naming + quick interests only (skip year/major)
- **Deep-dive mode:** Returning user adding new school → all 4 phases + community identity checkboxes
- **Friction detection:** If user abandons form at Field (major step), show modal: "Want to skip this? No problem. You can add later." (reduce drop-off)

---

#### G. "Should completion be a moment of celebration or a moment of arrival?"

Currently: Button press → API call → redirect to space/home.
Reimagine:

**Celebration option:**
- Full-screen confetti + checkmark animation (2-3s)
- "Welcome, [firstName]! You're officially part of HIVE."
- Then fade-transition to first space

**Arrival option:**
- Page morphs: completion form slowly fades out, space/home fades in
- Feeling: "You're crossing the threshold," not "You won"
- Aligns with "Crossing" metaphor

**Hybrid option:**
- Completion screen shows auto-joined spaces as cards
- User can preview before being auto-redirected
- Moment of control + anticipation ("Which space will I see first?")

---

#### H. "Could phases be completed out of order, or in a custom sequence?"

Currently: Strict sequence: Gate → Naming → Field → Crossing.
Reimagine:
- **Flexible order:** "What matters most to you to set up first? [Identity] [Timeline] [Interests] [Communities]" (user feels agency)
- **Progressive profiling:** Just Gate + Naming at entry; Field + Crossing deferred to post-entry (onboarding (lower initial friction)
- **Optional phases:** "Would you like to add your major now, or skip it?" (opt-in vs. required)

**Tradeoff:** Reduces commitment/investment; creates post-entry friction. Probably not worth it.

---

#### I. "How might we use the entry flow to signal campus culture?"

Currently: Generic language ("Claim your name," "What drives you?"). Gold accents and Clash Display are consistent across all campuses.
Reimagine:
- **Campus-specific copy:** Each campus gets custom phase labels and messaging (e.g., "Class of 2026" vs. "Cohort of 2026" vs. "Generation 2026")
- **Campus-specific interests:** Majors + interests are filtered to campus-relevant options (e.g., UB emphasizes engineering; smaller school emphasizes liberal arts)
- **Campus visual theme:** Subtle color/tone shifts per campus (not too much; should feel cohesive as HIVE)

---

### Summary for LLM Generation

When using this brief to generate creative directions, an LLM should:

1. **Respect constraints:** All directions must:
   - Verify email + OTP
   - Require real identity (first/last name, handle)
   - Collect graduation year
   - Collect 2-5 interests
   - Handle collisions gracefully
   - Filter by campus

2. **Explore tradeoffs:** Each direction should ask:
   - Does it reduce friction or add friction?
   - Does it increase investment/commitment or decrease it?
   - What's the completion rate impact?
   - What's the motion/design complexity?

3. **Reference competitors:** What are Discord, Figma, Linear, Notion doing? What can HIVE do *differently* (better)?

4. **Prioritize emotional arc:** Does it make the user feel exclusive → committed → invested → arriving? Or does it feel like filling a form?

5. **Consider post-entry:** What does the user see after entry? Does the onboarding setup them up for success on home page / in spaces?

---

Done. This brief is specific enough (references actual code: `useEntry`, `completeEntry`, `GateScreen`, OTPInput, `DURATION.smooth`, `GOLD.primary`, the state machine structure, the analytics events) while being creatively open (9 prompts, each exploring a different dimension of the experience).

---

## 4. Home Dashboard

### 1. Current State

**Built today:** A single-column activity stream for returning users (`/home/page.tsx`), with six stacked sections: greeting header → Happening Now (live presence count) → Up Next (next event within 24h) → Your Spaces (2-column grid with unread badges + online indicators) → Recent Activity (10-item timeline) → Suggested (one personalized space). New users (0 spaces) see an empty state with recommended spaces and a "Find your first space" CTA that triggers auto-join. Data comes from `/api/profile/dashboard` (dashboard data, events, recommendations) + `/api/profile/my-spaces` (space list with unread/online counts) + `/api/activity-feed` (activity timeline). **How it feels:** Clean, minimal, motion-forward (stagger reveals, card hovers), iOS-like. Greeting includes time-of-day awareness (`getGreeting()` returns "Good morning/afternoon/evening"). Every interaction is real: RSVP changes state, space clicks navigate, activity links go to spaces.

---

### 2. User Intent

Someone just logged in. They're asking three questions:
1. **"What's happening right now?"** → Happening Now + Up Next answer this (if data exists)
2. **"What do I belong to?"** → Your Spaces answers this
3. **"What should I do next?"** → Activity shows what's moving, Suggested shows what's adjacent

For new users: **"Where do I start?"** → Recommended spaces with direct join buttons.

---

### 3. What's Working

- **Presence awareness:** The "X people active across Y spaces" signal creates a sense of aliveness. Combined with online badges on space cards, students know their communities aren't empty.
- **Event surfacing:** Up Next with RSVP button + "going" state is friction-minimal and visible without navigation.
- **Unread signaling:** Badges on spaces with animation (`animate-pulse-gold` + glow shadow). Combined with activity feed, this tells the story: "Design Club moved since you left."
- **Space grid as primary entry:** The 2-column space grid is the right affordance—spaces are the product, so Home should make it obvious which ones have you.
- **New user onboarding:** Auto-recommend based on interests + major + popularity is working. Auto-redirect into first joined space prevents dead landing.
- **Motion as signal:** Stagger reveals + card hovers are subtle enough to feel premium, not playful. They say "this is interactive" without noise.

---

### 4. What's Locked

- **Route:** `/home` (not `/feed`, not `/dashboard`, not `/discover`)
- **Architecture:** Lives inside `AppShell` (fixed sidebar `Sidebar` component, desktop 260px offset, mobile bottom nav `BottomNav`). Max-width content area with `px-6 py-10` padding.
- **Campus isolation:** Every data fetch filters by `campusId` from `useAuth()` session. Client can never override campus context.
- **Nav pillar:** Home is the first of 4 nav items: Home → Spaces → Lab → You (from `/lib/navigation.ts`). The matchPattern regex includes `/home`, `/feed`, `/explore`—so Home owns attention aggregation across all three concepts per `IA_INVARIANTS.md`.
- **New user flow:** Once user joins first space, they're immediately redirected INTO that space (not staying on Home). Home is returning user view first.
- **Design language:** All shadows from `VISUAL_DIRECTION.md` (deep glass dark), all motion from `@hive/tokens` (`staggerContainerVariants`, `revealVariants`, `cardHoverVariants`), all colors must use CSS variables (`--color-gold`, `--bg-ground`), all text sizes use token class names (`text-body-lg`, `text-label`, etc.).

---

### 5. What's Open

**Layout model:**
- Is Home a single-column feed or a multi-column bento grid or a dashboard with widget movability?
- Should spaces grid be sticky/pinned at top, or does it scroll away?
- Should activity feed be infinite scroll or paginated?

**Data prioritization:**
- Should Home prioritize "your spaces" or "what's happening campus-wide"?
- Should activity timeline show only things from YOUR spaces, or things your connections are doing?
- How much context does an activity item need? (Current: 1-line with icon + 2-line description + timestamp.)

**Personalization depth:**
- Should Home have a settings panel for density (spacious/balanced/compact from `VISUAL_DIRECTION.md`)?
- Should students be able to pin/hide spaces from Home?
- Should recommended spaces rotate daily, or use a deeper algorithm?

**Time-of-day awareness:**
- Current: greeting changes, but layout stays the same.
- Could morning see "Happening Now + Events" prioritized, afternoon see spaces, evening see "Day recap"?

**Empty state design:**
- Current: New users see "Find your first space" + recommendations. What about returning users with 0 unread + 0 events? Do we show a motivational message, or just the spaces grid?

**How "activity" is represented:**
- Current: 10-item timeline with icons (chat, member joined, event created, tool deployed) + actor names + timestamp.
- Could we show a different lens? (e.g., "conversations you're in" vs. "things happening in your spaces"?)

**Whether Home is a dashboard or a feed:**
- **Dashboard model:** Fixed sections (Happening Now, Up Next, Your Spaces, Recent, Suggested) appear or disappear based on data. Widgets can be moved/hidden.
- **Feed model:** Single scrollable stream. Activity interleaved with spaces. More like Twitter/Discord.
- **Hybrid:** Sections are permanent but content is smart-filtered (show activity only if it's recent, hide sections with 0 items).

**Real-time update strategy:**
- Current: Fetch on mount, no live updates. Activity feed updates after 5 seconds (marks as viewed).
- Should Home poll for new activity? How often? Can we avoid the "stale data" problem without a full event loop?

**Connection between Home and Explore:**
- Current: "Browse all" link from Your Spaces takes you to `/explore`. But Home nav item also highlights on `/explore` per matchPattern regex. Should Home and Explore be more visually distinct, or is the unified nav correct?

---

### 6. Adjacent Flows

**Entry → Home:**
- User completes onboarding. Gets interest-based space recommendations. Clicks "Join" on one. Auto-redirects to `/s/[handle]`. **Gap:** If they close the redirect or navigate back, where do they land? Currently stays in space, but what if entry→join→back = Home? Should Home show "Just joined! Here's what's happening" or treat them like any returning user?

**Home → Spaces (`/s/[handle]`):**
- Click any space card → navigates to `/s/{handle}`. Space view is full-screen with split-panel layout (members list on left, chat/activity on right, settings drawer). Up Next event → navigate to space. Recent Activity item → navigate to space. All real navigation, no modal overlays.

**Home → Explore (`/explore`):**
- "Browse all" from Your Spaces section. `/explore` shows curated discovery: "For You" (interests-matched), "Popular This Week", "People in Your Major", "Upcoming Events". Search bar as secondary. Per `IA_INVARIANTS.md`, Explore owns discovery only—no join buttons here, previews only. To join, user navigates to space preview, then joins from space page.

**Home → You (`/me`):**
- Sidebar avatar button navigates to `/me`. Profile + settings + calendar + connections. Settings is a modal/sheet, not a separate page. Matches `IA_INVARIANTS.md`: `/me/*` owns private state (no social content), `/u/[handle]` owns public identity.

**Home → Lab (contextual):**
- HiveLab removed from main nav. Available from profile ("Your tools" → create button) or from space settings (leaders only). Direct `/lab` URL works for power users.

---

### 7. The Core Tension

**Command center vs. living room vs. newspaper front page.**

- **Command center** (Discord/Slack aesthetic): Emphasized activity counts. "You have 23 unread in 4 spaces." Quick actions. Jump to priority. Stressful energy, FOMO-driven. Feels like work.
  
- **Living room** (Notion dashboard aesthetic): Cozy, personal, reflects YOUR world. "Here's your spaces. Here's what your people are doing. Here's what's adjacent." Inviting energy, discovery-driven. Feels like home.
  
- **Newspaper front page** (Twitter/Reddit aesthetic): Curated by algorithm or community. "Here's what's trending on campus." Passive consumption. Feeds scroll infinitely. FOMO + addictive. Feels like an app.

**Current Home leans toward living room:** Greeting + presence awareness + your spaces grid + gentle activity timeline + one suggestion. Not overwhelming. Spaces-first, not activity-first. No infinite scroll. No algorithm juice. But it's static—every user's Home looks similar structure-wise. No personalization beyond content.

**The tension:** Should we move toward **living room + command center** (more density, more signals, more actions), or toward **newspaper** (infinite discovery, algorithmic prioritization, addictive loops), or **stay in living room** (cozy, simple, spaces-focused)?

**HIVE's directive per TODO.md:** "Spaces are the product. Everything else exists to get you into a space or bring you back to one." This locks us toward **living room** model—Home is a cozy way back to your communities, not a place to consume content forever.

---

### 8. Competitive Context

**Discord (living room + command center hybrid):**
- Shows servers vertically on left (1px icon width, label on hover). Online friends. DM threads. Clicking server takes you inside.
- Home equivalent: In the left sidebar, not a separate page. (HIVE puts spaces in sidebar too, but Home is a full page.)
- What works: Spaces are always visible. Unread badges are obvious. Presence is constant (not fetched on mount).

**Slack (command center):**
- Home shows: unread badges per channel, starred channels at top, recent threads, activity summary.
- Emphasis on "what needs your attention" with red badges, bolded channels.
- What works: Task orientation. "These channels need you." Fast triage.

**Notion (living room + dashboard):**
- Dashboard is user-customizable. Widgets for database views, calendar, recent pages. Spaces are called "Workspaces" (more enterprise). Notion home is about information organization, not social discovery.
- What works: Personal, customizable. Shows what you care about most. No algorithm.

**Linear (living room + command center):**
- Home shows: issues assigned to you, recent activity in teams, upcoming milestones. Sidebar has teams + projects. Dense but scannable.
- What works: Work-oriented (not social). Clear next actions. Grouped by team.

**Reddit/Twitter (newspaper):**
- Infinite feed. Algorithmic ranking. Communities (subreddits/spaces) are entry points, not always visible. Feed is the home.
- What works: Addictive engagement loops. FOMO drives return. Algorithm keeps new content fresh.

**Instagram (newspaper + living room):**
- Home feed mixes posts from people you follow + recommendations. Stories at top (ephemeral, don't scroll away). DM sidebar. Your profile separate.
- What works: FOMO + social proof. Stories expire, creating urgency. Follows = low-friction discovery.

**Takeaway for HIVE:** Home should feel more like Discord/Slack/Notion (intentional, spaces-first, curated) than Reddit/Twitter/Instagram (endless, algorithmic, content-first). Current design nails this. The question is: depth of personalization (stay simple?) vs. density of signals (add more real-time data?).

---

### 9. Ideation Prompts

#### A. Audience Segmentation
**"Should Home change based on user type?"**
- New user (0-3 spaces): "Find your first space" + auto-recommended spaces visible. No activity timeline (nothing to show).
- Growing user (4-10 spaces): Your spaces grid is primary. Activity timeline secondary.
- Power user (15+ spaces, 10+ events/week): Might want density settings. Might want to mute spaces from home view. Might want calendar-first view.
- Currently: Home treats all returning users the same. Should we segment?

#### B. Presence Signals
**"What if Home was truly 'alive' every second?"**
- Current: Presence updates on fetch (page load + occasional polling). Activity timeline is static.
- What if: Online counts in space cards update live (via Firebase listener). Activity feed streams in as things happen (chat, joins, events). Happening Now indicator bounces when someone comes online in a space you're in.
- Cost: More Firebase listeners = more reads/cost. Could use SSE polling instead.
- Benefit: Home feels less like a dashboard, more like a window into real activity.

#### C. Campus-Wide vs. Your-Spaces Activity
**"Should Home prioritize YOUR spaces or what's happening everywhere on campus?"**
- Current: Activity timeline = only things from spaces you're in.
- Alternative A (command center): Show campus-wide trending spaces at bottom. "Design Club has 12 new messages, 5 people online."
- Alternative B (newspaper): Show some campus-wide activity in activity feed. "Someone in CS 370 started a study group."
- Alternative C (living room): Stay current. Your spaces only.
- Trade: Command center = more awareness, more FOMO. Living room = focused, cozy.

#### D. Smart Empty States
**"Should Home show different messaging if you're not scrolling?"**
- Current: If 0 events + 0 recent activity, those sections hide. Space grid stays. Suggested shows one space.
- Alternative: If you haven't clicked a space in 7 days, show "Haven't seen you in a while" message. If you have 0 unread messages, show "All caught up!" with confetti or gold glow.
- Benefit: Recognizes users emotionally (celebratory, encouraging). Makes Home feel smarter.
- Cost: More state to track, more logic.

#### E. Event-Centric Home
**"What if Home was organized by your calendar, not spaces?"**
- Current: Spaces grid + activity. Up Next is sidebar-y.
- Alternative: "Your calendar" zone. Show RSVPed events (next 7 days) as cards. Below that, "In between events: spaces with new activity." Activity feed shows event posts/discussions.
- Benefit: Time-aware, action-oriented. "What am I doing this week?"
- Cost: Very different from current model. Might alienate students who don't RSVP to events.

#### F. Algorithmic Recommendations
**"What if the Suggested space learned from your clicks?"**
- Current: Interest-based scoring only. One space per day, shown once.
- Alternative: Track which spaces you've visited. Show spaces that 3+ people from your space also joined. Show spaces that match your major + recent activity (trending in CS major this week).
- Benefit: Better recommendations = more joins = retention.
- Cost: More data tracking, more algorithm complexity.

#### G. Density & Customization
**"Should Home have a settings panel?"**
- Current: No settings. Layout is fixed. All users see 6 sections in same order.
- Alternative A (dashboard): "Hide Suggested," "Show Trending," "Change density to compact" toggles.
- Alternative B (multiple views): Home can switch between "Activity Stream" (current), "Calendar" (event-focused), "Spaces Only" (just the grid), "Analytics" (DCC + power users).
- Benefit: Users feel ownership. Power users get depth.
- Cost: More UI surface. Cognitive load for discovery.

#### H. Connection to Presence System
**"Should Home show 'See who's online' as a primary action?"**
- Current: "X people active across Y spaces" text. Click takes you to spaces.
- Alternative: Add "Online in Design Club (5 people)" card. Click shows avatars + names with presence status. Could DM from there.
- Benefit: Encourages synchronous connection. Makes social aspects visible.
- Cost: DM feature (`useDM()` is wired but feature-flagged OFF per TODO.md).

---

### 10. Technical Constraints & Opportunities

**Firebase data model (from `use-presence.ts`):**
- Presence documents are cheap (TTL 90 min, stale after 5 min no heartbeat).
- Online users are queryable: `where('campusId', '==', campusId)` + `where('status', 'in', ['online', 'away'])`.
- Could stream presence with `onSnapshot()` instead of polling.

**Activity feed API (from `/api/activity-feed` implied in code):**
- Returns last 10 activities per space. No real-time subscription visible in code. Currently static on load.

**Dashboard endpoint (from `/api/profile/dashboard`):**
- Single API call that returns: quick actions, recent activity, upcoming events, stats, recommendations.
- Could be cached per user. Currently no caching visible.

**Recommendation algorithm (from `/api/profile/dashboard`):**
- Interest matching (+3 category, +2 name, +1 major), popularity (+0.1-0.5), sorted by match score.
- Runs on every fetch. Could cache client-side for 24h per user.

**Unread counts (from space card data in Home):**
- `unreadCount` is fetched from `/api/profile/my-spaces`. Not real-time. Could add Firestore listener.

**Performance:** Current Home fetches 3 APIs in parallel on mount. Could consolidate to 1 if needed (currently separate: spaces, dashboard, activity). Max-w-2xl constrains layout width.

---

### 11. Reference Materials

| What | Where | Key Quote |
|------|-------|-----------|
| Current Home structure | `/app/home/page.tsx` lines 1-120 | 6 sections: header, happening now, up next, your spaces, recent activity, suggested |
| App shell constraint | `/components/layout/AppShell.tsx` | 260px sidebar (desktop), 64px top nav (mobile), max-w content area |
| Navigation invariants | `/lib/navigation.ts` | Home matches `/home`, `/feed`, `/explore` — owns attention aggregation |
| IA rules | `docs/IA_INVARIANTS.md` | Home "owns attention aggregation, never stores data—only reflects it" |
| Visual direction | `docs/VISUAL_DIRECTION.md` | Glass dark surfaces, motion 200-400ms spring, gold 1% rule |
| Presence system | `/hooks/use-presence.ts` | 90min TTL, 5min stale threshold, per-campus queries |
| Design tokens | `@hive/tokens` exports | staggerContainerVariants, revealVariants, cardHoverVariants, motion durations |
| Product redesign goal | `TODO.md` | "Completion is not enough. Every system redesigned around the question: Does a student know what to do next?" |
| Campus isolation rule | `CLAUDE.md` (project file) | Every query filters by campusId from session, never accept from client |

---

### 12. Success Metrics (Implicit)

- **Returning user rate:** Does Home pull students back after entry?
- **Space engagement:** Do Home cards drive clicks into spaces?
- **Recommended space join rate:** Do students join spaces from suggestions?
- **Scroll depth:** Do students scroll to activity + suggestions, or stop at spaces grid?
- **Time on page:** Is Home a quick check-in (30s) or longer browsing (2m+)?
- **Navigation patterns:** Do students navigate to `/explore`, `/spaces`, or stay in Home?

---

### 13. Ready for Ideation

This brief describes a single-column activity stream for returning students that's working well (presence awareness, event surfacing, space grid, gentle motion). The core tension is **cozy living room vs. dense command center vs. infinite newspaper feed**. HIVE's product direction locks us toward living room. The open questions are about **depth** (should Home personalize more?), **aliveness** (should data be real-time?), **scope** (campus-wide vs. your-spaces?), and **affordances** (dashboard widgets vs. fixed sections vs. infinite feed?).

An LLM can now generate multiple creative directions (calming vs. energized, algorithm-driven vs. curated, dense vs. minimal, event-centric vs. space-centric, presence-forward vs. activity-forward) while staying coherent with the HIVE system (glass dark, gold accents, Framer Motion, campus isolation, spaces-first philosophy, 260px sidebar, `/home` route lock, no mock data).

---

## 5. Explore / Discovery

### EXPLORE / DISCOVERY — IDEATION BRIEF

#### 1. CURRENT STATE

**Route:** `/explore` (anchored in app shell via nav)

**Page Component:** `apps/web/src/app/explore/page.tsx` (850 lines)
- Curated feed with **5 discovery sections** in single-column scroll
- **For You**: Personalized space recommendations (0-3 cards) based on interests + major + popularity score
- **Popular This Week**: Highest-activity trending spaces (2-4 cards)
- **People in Your Major**: 6 compact person cards filtered by user's major
- **Upcoming Events**: Next 7 days, filtered to no RSVP yet (3 events max)
- **Search Results**: Multi-type results overlay (spaces, ghost spaces, people, events) when query entered

**Data Shape — Spaces:**
```typescript
SpaceCardData {
  id, name, handle, description?, memberCount, onlineCount, 
  lastActive?, category?, isMember?
}

GhostSpaceData {  // unclaimed/unclaimed spaces
  id, name, handle, category?, waitlistCount
}
```

**Data Shape — People:**
```typescript
PersonData {
  id, name, handle, avatarUrl, role (major), mutualSpaces, 
  isOnline, isConnected, spacesCount
}
```

**Data Shape — Events:**
```typescript
EventData {
  id, title, description?, startTime, location, spaceName, 
  spaceHandle, rsvpCount, isLive, userRsvp
}
```

**API Routes:**
- `GET /api/spaces/browse-v2?sort=trending&limit=30&search=query` — Main discovery endpoint with cold-start signals
  - Enriches results with: `upcomingEventCount`, `nextEvent`, `mutualCount`, `toolCount`
  - Supports full-text search across name + description
  - Returns both active spaces (`claimStatus !== 'unclaimed'`) and ghost spaces (`claimStatus === 'unclaimed'`)
  - Filter/sort: `trending`, `recommended`, `newest`, `popular`
- `GET /api/profile` — User interests + major (used to personalize "For You")
- `POST /api/users/search` — Find people by query + major filter
- `GET /api/events?upcoming=true&limit=10` — Upcoming events
- `GET /api/spaces/activity/recent` — Recent activity (messages, events, posts) across user's spaces
- `POST /api/spaces/waitlist` — Join waitlist for unclaimed/locked major spaces
- `GET /api/spaces/waitlist?spaceId=xxx` — Check waitlist status

**Search Behavior:**
- 300ms debounce on query input
- Parallel API calls: spaces + people + events all fire at same time
- Results replace feed sections when `query.length > 0`
- Empty state: centered glass surface "No results for X"

**Component Patterns:**
- `FeedSection`: wrapper with title + icon + optional action link
- `SpaceCard`: `revealVariants` entrance + `cardHoverVariants` on hover, `Tilt` effect
- `GhostSpaceCard`: dashed border, gold "Unclaimed" badge, "Notify Me" CTA to join waitlist + "Claim This Space" link
- `PersonCompactCard`: avatar + name + role + mutual spaces count
- `EventCompactCard`: date box + title + space name + RSVP button (working POST)

**Motion:**
- `staggerContainerVariants` on grid sections (stagger cards in)
- `cardHoverVariants` on individual cards
- `revealVariants` per card
- All duration: `MOTION.duration.base` (~200-250ms)

**Design Tokens:**
- `--life-gold` for online indicators, unclaimed space hover, hot signals
- `--bg-ground` for main bg
- Glass surfaces with `intensity="subtle"`
- Typography: heading-sm, body-lg, body, label

---

#### 2. USER INTENT

**Primary:** "I want to find communities I belong to — spaces aligned with my interests, major, social graph"

**Secondary:** "Who else is here? What's happening? Should I join?"

**Tertiary:** "What if my thing doesn't exist yet? (Ghost spaces)" → Join waitlist → Claim when ready

**Discovery Motivation Loop:**
1. Land on `/explore` (or nav from home)
2. Scroll curated sections (low friction, pre-filtered)
3. Find something relevant → Click to space residence or person profile
4. **or** Search for something specific → Get results across all types
5. **or** See unclaimed space → Join waitlist → Get notified when claimed

---

#### 3. WHAT'S WORKING

- **Personalization engine works.** The scoring algorithm (+3 category match, +2 description, +1 major, popularity boost) efficiently surfaces relevant spaces without ML.
- **Dual-track display** (active + ghost spaces) acknowledges that 400 pre-seeded orgs exist but not all are "claimed" yet. Clear visual distinction (dashed border, "Unclaimed" badge).
- **Waitlist signal for FOMO.** Showing "{N} students waiting" on ghost cards creates urgency without being pushy.
- **Search-first mentality respected.** Query in URL params (`?q=...`), 300ms debounce, parallel queries don't block UI.
- **For You logic uses real profile data.** Interests + major come from entry flow, not guessed.
- **Motion is subtle and consistent.** Stagger on sections, card hover effects, no jank.
- **Empty states are safe.** No section if no data; "No results" message is guided, not dead.
- **Events show **urgency signals.**" "Live" badge + time-relative display ("Today at 3pm", "Tomorrow") + RSVP count creates action bias.
- **Ghost cards have dual CTAs.** "Notify Me" (low friction) + "Claim This Space" (high intent) split the decision tree.
- **People section shows mutual spaces.** "2 mutual spaces" is a trust builder.

---

#### 4. WHAT'S LOCKED

- **Route:** `/explore` (canonical, anchored in nav item "Home" via match pattern `/explore\(/|$\)/`)
- **Page must show campus spaces only.** 400+ pre-seeded UB orgs (or Emory, Rice, etc. per campus). Filtered by `campusId` from session (never client-provided).
- **Campus isolation is enforced.** All API endpoints derive `campusId` from email (via `deriveCampusFromEmail()`) or session. No cross-campus leakage.
- **Real identity required.** Only authenticated users with campus email verification see explore (enforced at auth middleware).
- **Lives in AppShell layout.** Respects global sidebar, breadcrumb nav, spacing conventions.
- **Curated feed philosophy locked.** Jacob's decree: "Students don't search, they browse. Curate for them." So default state is sections, search is secondary.

---

#### 5. WHAT'S OPEN

**A. Discovery Mechanism — How do students browse 400+ spaces?**
- Browse-first (current) — Curated sections dominate, search is secondary
- vs. Map view — Show spaces by campus location (library, quad, etc.)
- vs. Category tree — Filter by: Academic, Social, Arts, Sports, etc.
- vs. Recommendation engine — ML-driven "See Also" on space cards
- vs. Onboarding funnel — "Welcome! Pick 3 spaces to start" → personalized recommendations → auto-join

**B. Card Design for Spaces — How much info per card?**
- Current: Minimal (name, handle, member count, online, category, description excerpt)
- vs. Richer: Add space avatar, emoji, trending chart, event preview
- vs. Denser grid: Show more cards per row with less info each
- vs. List view: Row-based, more descriptive, sortable columns

**C. Category/Filtering Taxonomy — How deep?**
- Current: Single optional `category` field on space (Academic, Social, Arts, etc.)
- vs. Multi-tag system: Space tagged with 2-3 interests (Design + Tech + Community)
- vs. User-driven filters: Browse → Filter by category, membership size, activity level
- vs. Seasonal browsing: "Trending This Week", "New This Month", "Happening Today"

**D. Surfacing "Hot" / "Trending" Spaces — What signals matter?**
- Current: Sort by `trending` (not fully defined; assuming activity velocity)
- vs. Trending = Recent high-activity spike (x new members + y new messages this week)
- vs. Trending = Event-driven (7 people RSVPed to an event today)
- vs. Viral signals: "Your friends joined this space" + "Popular in your major"

**E. Personalized Recommendations vs. Raw Browse — Scope?**
- Current: "For You" section uses interests + major to score spaces
- vs. Feed-style: "Recommended for you" section between sections
- vs. Post-space experience: "See Also" suggestions when inside `/s/[handle]`
- vs. Deeper ML: Collaborative filtering (people like you joined these spaces)

**F. Visual Density — Grid vs. List vs. Magazine?**
- Current: 3-column grid on desktop (md: 2-col, sm: 1-col)
- vs. 4-column for higher density
- vs. Asymmetric masonry (featured space = large, others = small)
- vs. List view with avatars, longer descriptions, metadata

**G. Ghost Spaces Visual Treatment — How to differentiate?**
- Current: Dashed border + "Unclaimed" badge + lower opacity text
- vs. Grayscale card (desaturated), "Coming soon" instead of "Unclaimed"
- vs. Overlay pattern (diagonal stripes) to signal "not ready"
- vs. Separate section entirely: "Spaces launching soon" at bottom
- vs. Richer ghost experience: Show founding team, estimated launch date, pre-launch chat

**H. Social Proof Signals — How prominent?**
- Current: Member count + online count + mutual spaces (on people cards)
- vs. Add to space cards: "3 friends are members", "Someone from your major just joined"
- vs. Activity heatmap: "Active every day this week" mini chart
- vs. Avatar row: Faces of recent joiners
- vs. Strength score: "83% match for you" based on interests

**I. Entry Point Psychology — What happens first?**
- Current: New user → entry flow → interest selection → auto-join spaces → see `/explore` in nav
- vs. New user → `/explore` as first landing (onboarding within discover)
- vs. Guided discovery: "Pick 3 spaces to start" modal
- vs. Question-driven: "What are you into?" → conversational discovery

**J. Conversational / AI-Driven Discovery**
- What if explore had a "Ask" button: "I'm interested in X, what communities should I join?"
- LLM generates curated list with explanations
- Reduces cognitive load vs. raw browsing

---

#### 6. ADJACENT FLOWS

**Home → Explore**
- `/home` has activity stream + joined spaces list
- CTA: "Find more spaces" button or nav link
- Explore should acknowledge the user already has joined spaces (don't show them in "For You" unless very relevant)

**Explore → Space Residence (`/s/[handle]`)**
- Click space card → lands in space threshold (if non-member) or space chat (if member)
- Post-join: breadcrumb or back button returns to `/explore` or `/home`

**Explore → Person Profile (`/u/[handle]`)**
- Click person card → see their profile, belongings, mutual spaces
- "Find more people like them" prompt?

**Entry Auto-Join → Explore**
- After completing entry, user auto-joins 3-5 recommended spaces
- Post-join: see `/home` (activity in just-joined spaces) or `/explore` (find more)
- Should explore acknowledge which spaces user JUST joined?

**Search → Explore Search Results**
- Query triggers overlay of results
- Each result type clickable (space → residence, person → profile, event → event page)

**Ghost Space Waitlist → Claimed Space**
- User joins waitlist for unclaimed space
- Space gets claimed by someone (via `/spaces/claim?handle=X`)
- User notified (not yet implemented, deferred)
- Next time user lands on explore, space is now active (not ghost)

---

#### 7. THE CORE TENSION

**Catalog vs. Curated Experience.**

400+ pre-seeded spaces is overwhelming. Unbounded choice = decision paralysis.

How do we make discovery feel intimate, not like a library catalog?

**Current answer:** Curate sections based on personalization signals (interests, major, popularity, friends). Let search be the safety valve.

**But this requires:** Updated interests data, accurate major filtering, stable trending metrics. If these decay, "For You" becomes stale and users retreat to search.

**Design decision required:** How aggressively to personalize?
- Too little personalization → Browse feels like a generic catalog (Discord server list, Reddit /r/all)
- Too much → Algorithmic bubble (only show what you already like)
- Goldilocks → Show 60% personalized, 40% surprising (trending, new)

---

#### 8. COMPETITIVE CONTEXT

**Discord Server Discovery**
- Browse by category (Gaming, Education, etc.)
- Sort by member count + boost (promoted servers)
- Social proof: "X members, Y online"
- Search is prominent secondary feature
- Uses server icons + descriptions

**Reddit /r/popular**
- Trending posts from large subreddits
- Sort: Hot, New, Top, Rising
- User's home feed = curated (subs they're in)
- Explore/Discover = wider catalog + trending
- No personalization based on profile (doesn't exist at that time)

**Meetup.com Browse**
- Category tree (tech, fitness, arts, networking, etc.)
- Filter by: distance, group size, activity frequency
- Event-driven discovery ("events happening this week")
- Social proof: "You have X friends in this group"
- Strongly uses location (map view, distance)

**University Club Fair / Activities Day**
- Physical analog: ~80-200 booths in student center
- Clusters by type: Academic, Greek, Arts, Sports, etc.
- Club officers staffing booths (presence signals engagement)
- Event-driven: "Club fair is THIS Saturday"
- Student browsing: Wander, stop at interesting booths, talk to members
- Take a flyer, RSVP on spot

**LinkedIn Job Search**
- Full-text search dominant
- Filters: Job title, company, location, salary, experience level
- Curated "trending" or "personalized picks" secondary
- Social proof: "X people viewing this job"
- Job carousel: "See similar roles"

---

#### 9. IDEATION PROMPTS

**I. Campus Activities Fair Vibes**
- What if Explore felt like walking through a campus activities fair?
- Visible sections: "Find Your Crew" (social), "Build Stuff" (project/maker), "Get Fit" (sports), "Think Deep" (academic)
- Each section is a "booth" with presences indicators (is leader active?)
- Events tease: "Tournament happening Saturday!"
- Ghost spaces: "Coming spring 2026 — save your spot"

**II. Friend-Graph Primacy**
- Should we show spaces the user's FRIENDS are in first?
- Toggle: "Popular in my network" (3 cards) vs. "Popular across campus" (3 cards)
- Social proof becomes discovery mechanism: people are the gravity wells, spaces orbit them
- Copy becomes: "Sarah, Marcus, and 12 others are in Design Club"

**III. 400 Spaces → Organized**
- How do we make 400 spaces feel curated, not overwhelming?
- Option A: Remove 300 (keep only active, claimed spaces)
- Option B: Segment: 20 featured (highlighted) + 100 active (browseable) + 280 ghost (waitlist-only)
- Option C: Personalize aggressively: Show 50 relevant spaces, bury the rest
- Option D: Hierarchical discovery: "See only spaces in your major → then browse others"

**IV. Conversational Discovery**
- What if discovery was conversational?
- "I'm interested in X" → AI matches spaces + explains why
- "Show me spaces with good events" → filter to upcoming activity
- "Who does Y?" → find people, spaces they're in via people
- Low-friction entry: Don't make user scan 400 cards

**V. Ghost Space Gamification**
- Unclaimed spaces are a resource. How to leverage?
- "Claim this space" CTAs + badges for space founder
- Leaderboard: "Top unclaimed spaces by waitlist size"
- Incentive: First person to claim gets "Founder" role + gets to invite the waiting members

**VI. Map View — Campus Geography**
- What if Explore had a map showing spaces by campus location?
- "Spaces in the Quad", "Spaces near the Library", "Spaces in Tech Building"
- For students who think geographically ("Where can I go right now?")
- Integrated with "Happening now" indicators
- Precedent: Meetup.com location-based discovery

**VII. Activity-First Timeline**
- What if Explore showed a timeline instead of grid?
- "Today at 3pm: Chess Club meets in game room"
- "Tomorrow 6pm: Design crits in Lab"
- "This Friday: Tournament signup opens"
- Spaces appear as context (not primary), events are the hook
- Reduces cognitive load: browse by when, not by category

**VIII. Trending Algorithm Transparency**
- How do we explain "trending" without overwhelming?
- "3 people joined this week" + "2 new events" + "Last active 2h ago"
- Badges: "New", "Hot", "Quieter (for focused work)"
- Trust signal: Why is this recommended? ("Matches your interests + 8 friends are in it")

**IX. Onboarding Integrated**
- What if new users had a light "pick your first 3" flow on Explore?
- Instead of separate onboarding, Explore becomes the post-entry funnel
- "Great! Now find your people" → Browse, search, or "tell me what you like" AI
- Auto-join is conditional: User confirms, then redirects to first space

**X. "See Also" on Space Cards**
- After clicking into a space (residence view), show "Students in this space also joined X"
- Recommendation at point of highest intent
- Avoids cold-start problem of recommending to everyone

---

#### 10. CODE PATTERNS & COMPONENT NAMES TO QUOTE

**Main Page:** `ExploreContent()` (844 lines, no SSR)
- Uses `useRouter()`, `useSearchParams()` for URL-driven search
- Fetches via: `fetchSpaces()`, `fetchPeople()`, `fetchEvents()`, `fetchUserProfile()`

**Sections as Sub-Components:**
- `ForYouSection()` — scoring algorithm, multi-factor personalization
- `PopularSection()` — just `.slice(0, 4)` of trending spaces
- `PeopleMajorSection()` — filters people by `major`
- `UpcomingEventsSection()` — filters events to next 7 days, working RSVP handler
- `SearchResultsSection()` — 4-type overlay (spaces, ghost spaces, people, events)

**Shared UI:**
- `FeedSection()` — wrapper with title + optional icon + optional action link
- `SpaceCard()` — from `@/components/explore/SpaceCard.tsx` (100 lines, `revealVariants`, `cardHoverVariants`, `Tilt`)
- `GhostSpaceCard()` — from `@/components/explore/GhostSpaceCard.tsx` (150 lines, dashed border, dual CTAs)
- `PersonCompactCard()` — inline; shows avatar + name + role + mutual spaces
- `EventCompactCard()` — inline; working RSVP button, date box, "Live" badge

**Skeletons (loading states):**
- `SpaceCardSkeleton()`, `PersonCompactSkeleton()`, `EventCardSkeleton()`

**Helpers:**
- `useDebounce<T>(value, 300ms)` — local hook for search debouncing
- `formatEventDate(date)` → `{ month: "Feb", day: "14" }`
- `getRelativeTime(date)` → `"2 hours ago"`, `"3 days ago"`

**API Data Fetchers (async):**
```typescript
fetchUserProfile(): Promise<{ interests, major }>
fetchSpaces(options): Promise<{ spaces, ghostSpaces }>
fetchPeople(options): Promise<PersonData[]>
fetchEvents(options): Promise<EventData[]>
```

**Motion Tokens Imported:**
- `staggerContainerVariants` (parent)
- `revealVariants` (per card)
- `cardHoverVariants` (hover state)
- `MOTION.duration.base`, `MOTION.ease.premium`

**Design System Imports:**
- `GlassSurface` (intensity="subtle")
- `SimpleAvatar`, `Badge`, `Button`, `MOTION` from `@hive/ui/design-system/primitives`
- `Tilt` effect on cards (from `@hive/ui`)

**Type Exports from `@/components/explore`:**
```typescript
export interface SpaceCardData { id, name, handle, description?, memberCount, onlineCount, lastActive?, category?, isMember? }
export interface GhostSpaceData { id, name, handle, category?, waitlistCount }
export interface PersonData { id, name, handle, avatarUrl, role, mutualSpaces, isOnline, isConnected, spacesCount? }
export interface EventData { id, title, description?, startTime, location, spaceName, spaceHandle, spaceId, rsvpCount, isLive, userRsvp? }
```

---

### CREATIVE IDEATION PROMPTS FOR LLM GENERATION

**Generate multiple creative directions for Explore/Discovery. Each direction should:**
1. Propose a new discovery mechanism (not just UI reskin)
2. Explain user psychology
3. Show how it surfaces the core tension (400 spaces → intimate feel)
4. Reference a competitive or analog experience
5. Sketch wireframe flow (what user sees/taps)
6. Identify what breaks if done wrong
7. Quote relevant code/component names that would change

**Dimensions to explore:**
- **Sequencing**: What does user see FIRST on Explore? (Grid? Search? Question? Map?)
- **Filtering**: Category tree? Tags? Algorithmic? Semantic search?
- **Social proof**: Friend-graph, mutual members, activity heatmap?
- **Ghost spaces**: Waitlist-only, or integrate with active spaces?
- **Motion/progression**: Smooth or jarring? Algorithmic or curated?
- **Mobile vs. desktop**: List view on mobile, grid on desktop?
- **New user vs. power user**: Different first impressions?

This brief provides all data shapes, API routes, component names, design tokens, and the strategic context needed for an LLM to generate thoughtful, implementable creative directions.

---

## 6. Spaces System

### Executive Summary

The HIVE Spaces system has two major surfaces: **Spaces HQ** (your spaces management) and **Space Residence** (individual space page). Both are built on compelling mental models—identity, warmth, energy—but face a core tension: how do we make spaces feel alive at all scales (5-person study group to 200-person org)?

This brief catalogs the current architecture, locked decisions, and open questions to enable creative reimagining.

---

### PART A: SPACES HQ (Your Spaces Management)

#### Current State

**Location:** `/spaces` (via nav pillar 2)  
**Entry Points:** 
- Top-nav "Spaces" link
- Search/browse via `/spaces/browse`
- Direct URL navigation
- Modal creation from `/spaces?create=true`

**Components:**
- `SpacesHQ.tsx` — Main orchestrator, 4 states (empty, onboarding, active, loading, error)
- `IdentityRow.tsx` — Your Major/Home/Greek spaces (3 identity cards)
- `OrganizationsPanel.tsx` / `OrganizationsGrid.tsx` — Grid of spaces you've joined
- `SpaceOrbit.tsx` — Individual space card with warmth glow + energy dots
- `hub-onboarding.tsx` — First 7-day variant (more prominent identity)
- `identity-constellation.tsx` — Reusable 3-card component with claimed/unclaimed states
- `SpaceCreationModal.tsx` — Modal form to create new space

**Data Model:**
```typescript
// From useSpacesHQ hook
interface Space {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  memberCount: number;
  onlineCount: number;
  unreadCount?: number;
  recentMessageCount?: number; // Drives "warmth" levels
  isMuted?: boolean;
}

interface IdentityClaim {
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  memberCount: number;
  onlineCount?: number;
  recentMessageCount?: number;
}
```

#### States & Transitions

**Empty State** (0 spaces joined):
- Hero card: "Every student has a shape on campus. Yours is waiting to be drawn."
- Identity quadrants (Major/Home/Greek) as placeholders
- 2 CTAs: "Discover Your Spaces" (→ browse) or "Create a Space"
- Motion: Cards fade in staggered; placeholders show pulse animation

**Onboarding State** (1-7 days in, <3 identity spaces claimed):
- Gold banner with progress dots (0/1/2 filled = claimed identity spaces)
- Prominent identity section (60% viewport height)
- Organizations below (collapsed if <2 spaces)
- "Claim your identity" prompt with gold glow

**Active State** (Typical user):
- Identity section at top (3 cards: Major, Home, Greek—claimed or empty)
- Your Organizations grid (2-4 columns, mobile-responsive)
- Browse link at bottom
- Optional header with "New" button to create space

**Loading State:**
- Skeleton loaders with pulse animation
- Grid of ~6 placeholder cards

**Error State:**
- Error icon, message, "Try again" button

#### Visual Language

**Warmth Metaphor:**
- `getWarmthConfig(recentMessageCount)` maps activity → glow intensity & color
  - Hot (20+): Gold glow + pulse animation
  - Warm (5-19): Subtle gold glow
  - Cool (1-4): Faint white glow
  - Dormant (0): No glow
- Energy dots: 1-3 small gold dots indicate activity level
- Unread badge: Small gold pill with count

**Motion:**
- Stagger delays via `SPACES_MOTION.stagger` constants
- Cards lift on hover (`orbitHoverY`)
- Glow intensifies on hover (`hoverGlowMultiplier`)
- All transitions <300ms (MOTION.duration.base/fast)

**Tokens from `@hive/ui/tokens`:**
- `SPACES_GOLD.primary` / `.glow` — Color values
- `SPACES_MOTION.card.duration`, `.orbitHoverY`, `.hoverGlowMultiplier`
- `getWarmthConfig()`, `getEnergyDotCount()` — Business logic helpers

#### Dropdown Actions (SpaceOrbit)
```typescript
// Right-click menu on each space card
- Copy link
- Mute (if onMute callback provided)
- Settings (navigate to space settings)
- Leave (if onLeave callback provided)
```

#### What's Locked

✅ **Campus isolation** — All queries filter by `campusId` from session  
✅ **Route is `/spaces`** — Defined in nav architecture  
✅ **3 identity spaces** — Major, Home, Greek (from profile model)  
✅ **Warmth metaphor** — Uses activity count to drive visual intensity  
✅ **Real data only** — No mock data; unread badges, member counts, online status are live  
✅ **Design tokens** — All colors/spacing from `packages/tokens`  

#### What's Open

**1. Identity Section Layout**
- Current: 3 equal-width cards in a row
- Alternative: Larger center card (claimed major?) flanked by smaller ones?
- Alternative: Vertical stack on mobile (separate from organizations)?
- Alternative: Treemap/organic layout vs. grid?

**2. Organization Grid Density**
- Current: 2-4 columns (responsive: 2 on mobile, 3 on tablet, 4 on desktop)
- Question: Should "founding team" spaces (very new, 0 members) look different?
- Question: Pinned spaces first, then by activity, then by name?
- Alternative: Organize by type (clubs, residential, classes)?

**3. Empty State Framing**
- Current: Manifesto-style copy + hero CTA
- Question: Should we show activity from friends/campus as social proof?
- Question: Should "create a space" be first-class CTA, not hidden in secondary section?

**4. Onboarding Tempo**
- Current: Gold banner visible only if onboarding=true AND state=onboarding
- Question: Does the 7-day window need to be clearer (day counter)?
- Question: Should completing identity trigger a celebratory animation?

**5. Space Card Contextuality**
- Current: Unread count, member count, online status, energy dots
- Question: Should we show "3 new people joined this week"?
- Question: Should leader-owned spaces have a crown badge?
- Question: Should trending/hot spaces float to top?

---

### PART B: Space Residence (Individual Space /s/[handle])

#### Current State

**Location:** `/s/[handle]` (dynamic route per space)  
**Page Structure (Split Panel Layout):** Jan 31, 2026 rebuild
```
┌─────────────────────────────────────────┐
│ SpaceHeader (handle, members, online) │
├──────────┬──────────────────────────────┤
│ Sidebar  │      Main Chat Feed          │
│ (200px)  │      + Message Input         │
│          │                              │
│ Boards   │    (60/40 split)             │
│ Tools    │                              │
│ Members  │                              │
└──────────┴──────────────────────────────┘
```

**Key Components:**
- `page.tsx` — 1200+ lines of orchestration (state machine)
- `SpaceHeader.tsx` — Identity bar with avatar, name, members, actions
- `SpaceSidebar.tsx` — Left panel: boards, tools, members preview
- `SpaceLayout.tsx` — Wrapper that manages 3-column structure
- `MainContent.tsx` — Right panel scroller
- `MessageFeed.tsx` — Virtualized message list with grouping
- `ChatInput.tsx` — Rich message input
- `MembersList.tsx` — Slide-over panel showing all members with roles
- `SpaceSettings.tsx` — Modal for leader controls (space info, boards, role management)
- `SpaceThreshold.tsx` — Join gate (for non-members)
- `GatheringThreshold.tsx` — Quorum gate (for ghost/gathering spaces)

**Feed Contents (Unified Feed):**
```typescript
type FeedItem = Message | Event | Tool
// Messages: grouped by author, reactions, threads, attachments
// Events: title, date, location, RSVP count, "Starting soon!" badges
// Tools: deployed space tools with live state
```

**Data Model:**
```typescript
interface Space {
  id: string;
  handle: string;
  name: string;
  description: string;
  avatarUrl?: string;
  memberCount: number;
  onlineCount: number;
  isMember: boolean;
  isLeader: boolean;
  isMuted?: boolean;
  activationStatus?: 'ghost' | 'gathering' | 'claimed' | 'open';
  activationThreshold?: number; // Quorum for gathering spaces
  gatherers?: Array<{ id, name, avatarUrl, isFoundingMember }>; // Who's waiting
  socialLinks?: { website, instagram, twitter, facebook, linkedin, youtube };
  // Energy signals (new in Sprint 3)
  recentMessageCount?: number;
  lastActivityAt?: string;
  newMembers7d?: number;
}

interface Board {
  id: string;
  name: string; // "general", "announcements", etc.
  unreadCount: number;
  isPinned: boolean;
}

interface Message {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  timestamp: string;
  reactions?: Array<{ emoji, count, userReacted }>;
  replyCount: number; // Thread size
  attachments?: Array<{ url, filename, mimeType }>;
  isEdited: boolean;
  editedAt?: string;
}
```

#### Non-Member Entry (Join Gates)

**GatheringThreshold** (for `activationStatus === 'ghost' | 'gathering'`):
- Shows: Space avatar, name, description
- Shows: Quorum progress: "N founding members so far" + avatars
- Shows: Threshold: "Need X more to launch"
- CTAs: "Join as founding member" or "RSVP" (but gate access)

**SpaceThreshold** (for regular spaces, `activationStatus === 'claimed' | 'open'`):
- Shows: Space avatar, name, description
- Shows: Member count, online count
- Shows: Recent activity ("Recently active")
- Shows: Upcoming events (if any)
- CTA: "Join Space"

#### Member Experience (Split Panel)

**Left Sidebar (200px, fixed width):**
- **Boards section:**
  - Pinned (e.g., "general")
  - Unpinned boards below
  - Unread badge on board name
  - "+" button to create board (leaders only)
  - Keyboard nav: Up/Down to switch boards, Cmd+K to search
  
- **Tools section:**
  - Space-deployed tools with small cards
  - Click to open tool full-view or in thread
  - "+" button to add/build tool (leaders only)
  
- **Members preview:**
  - Online count
  - Avatars of 5 currently online
  - Click to open members panel

**Header:**
- Space avatar (40px) + name + handle
- Verified badge if applicable
- Online count + health indicator (if no online)
- Action buttons: Members, Build Tool (leader), Create Event (leader), Moderation (leader), Mute, Settings

**Main Content (Right Panel):**
- **Board name** as section title
- **Message feed:**
  - Messages grouped by author (same author, close timestamps = group)
  - Author avatar shown only for first message in group
  - Reactions inline
  - Attachments (images) with lightbox
  - Delete + Report options on hover
  - Edit button for own messages
  - Thread indicator: "Reply (n)" to open thread panel
  
- **Unread divider:** 
  - Shows "You have n unread messages" across the feed
  - Dismissible
  - Visual line with label
  
- **Empty state per board:**
  - Variant per board type (general: "Start the conversation", announcements: "No announcements yet")
  - Leader prompt: "Be the first to share something"
  
- **Typing indicator:**
  - "X, Y, Z are typing..." animates briefly

**Input Area:**
- Rich textarea (Cmd+Enter to send)
- Upload button for attachments
- Emoji picker
- Character count
- Mentions detection (@handle autocomplete)

#### Modals & Panels

**Members Slide-Over:**
- Full member list grouped by role (Leaders/Admins, Moderators, Members)
- Search filter
- Member cards: avatar, name, handle, role badge, online/last-seen indicator
- Click to view member profile

**Space Settings Modal:**
- Tabs: Info, Boards, Members, Roles, Danger Zone
- Leaders can: Update space name/description, manage boards, invite members, change roles
- Members can: Leave space
- Owners can: Transfer ownership, delete space

**Create Board Modal:**
- Name + optional description
- Creates new board in space

**Create Event Modal:**
- Title, description, date/time, location (physical or virtual link)
- Creates event attached to space

**Moderation Panel:**
- Queue of flagged messages
- Approve/delete
- Ban user option

**Search Overlay (Cmd+K):**
- Full-text search across messages in this space
- Filter by author, date range
- Navigate to message (opens thread)

**Thread Panel (Right-side split):**
- Shows parent message
- Replies below
- Reply input
- Same message actions (react, report, delete own)

**Report Modal:**
- Reason dropdown (harassment, spam, inappropriate content, etc.)
- Free-text details
- Submit report

#### Real-Time Features

**Presence (via Firestore listeners):**
- Online member count
- Typing users in current board
- Heartbeat-based (update every 30s)

**Notifications Mute:**
- Dropdown: "Mute for 1h/8h/24h/indefinitely"
- Current state persisted to user profile
- Bell icon in header shows mute status

**Activity Metrics (displayed in header):**
- Energy level calculation: `getEnergyLevel(recentMessageCount)`
  - busy: 20+ (3 dots)
  - active: 5-19 (2 dots)
  - quiet: 1-4 (1 dot)
  - none: 0 (no dots)
- Health badge: "Very Active" / "Active" / "Quiet" / "Dormant"

#### API Routes

**`POST /api/spaces/[spaceId]/chat`** — Send message
- Input: `{ boardId, content, attachments?, replyToId?, componentData? }`
- Features:
  - Rate limiting (20 msg/min per user)
  - XSS scanning (block if "dangerous")
  - @mention detection → creates notifications for members
  - Keyword automation trigger (e.g., "!remind" → system message)
- Returns: `{ messageId, timestamp }`

**`GET /api/spaces/[spaceId]/chat`** — List messages
- Pagination: `limit`, `before`, `after` (timestamp-based)
- Returns: Messages + `lastReadAt` + `unreadCount` for "Since you left" feature

**`PATCH /api/spaces/[spaceId]/chat/[messageId]`** — Edit message

**`DELETE /api/spaces/[spaceId]/chat/[messageId]`** — Delete message

**`POST /api/spaces/[spaceId]/chat/[messageId]/react`** — Add reaction

**`POST /api/spaces/[spaceId]/join-request`** — Request to join (for controlled spaces)

#### What's Locked

✅ **Route is `/s/[handle]`** — Dynamic routing by space handle  
✅ **Split panel layout** — 200px sidebar (left) + 60% feed (right)  
✅ **Real-time chat** — Firestore listeners for messages, presence, typing  
✅ **Boards concept** — Spaces have multiple message boards (general + custom)  
✅ **Leader vs. member UX** — Leaders see tools/board management; members see read-only  
✅ **Member list** — Roles (owner/admin/moderator/member) with badges  
✅ **Unread tracking** — Divider in feed, mute state, read receipts per board  
✅ **Message edit/delete** — Only authors + leaders can delete; only authors can edit  
✅ **Design tokens** — All spacing, colors, motion from `packages/tokens`  
✅ **No anonymous users** — Verified email required; always shows real identity  

#### What's Open

**1. Sidebar vs. Modal Toggle**
- Current: Sidebar always visible on desktop (200px fixed)
- Question: Should mobile swipe in sidebar from left edge, or use modal?
- Question: Should tools always show, or collapse into a tab?
- Question: Should members preview be always-visible or click-to-open?

**2. Board Organization**
- Current: Pinned (general) at top, unpinned alphabetical below
- Question: Should users be able to customize board order (drag)?
- Question: Should archived boards hide but not delete?
- Question: Should sub-boards exist (general > announcements > events)?

**3. Feed Unified vs. Segregated**
- Current: Messages + Events + Tools combined in reverse-chrono feed
- Question: Should there be separate tabs (Messages, Events, Tools)?
- Question: Should announcements float to top (pinned)?
- Question: Should activity feed (member joined, settings changed) show inline?

**4. Empty Space Psychology**
- Current: "Start the conversation", "Be the first to say something"
- Question: For brand new spaces (0 messages), should we show suggested icebreaker?
- Question: Should "Activity from similar spaces" appear as examples?
- Question: Should onboarding checklist appear (add members, create event)?

**5. "Space Personality" / Vibe**
- Question: Should spaces have a personality/theme (color accent, emoji, vibe)?
- Question: Should dormant spaces (0 messages in 30d) show a "reawaken" prompt?
- Question: Should there be a space "status" users set (active, on break, archived)?

**6. Tools as First-Class Citizens?**
- Current: Tools deployed to space sidebar, click to open in modal or thread
- Question: Should tools be interactable inline in the feed (component rendering)?
- Question: Should tools have their own feed cards (auto-updates)?
- Question: Should space homepage be tool gallery (tools-first) vs. chat-first?

**7. Leader Control Panel**
- Current: Settings modal with tabs
- Question: Should there be a dedicated "Leader Dashboard" (analytics, moderation queue, member management)?
- Question: Should space leaders see analytics (messages/day, new members, engagement)?
- Question: Should there be automation rules UI (keyword triggers, auto-moderation)?

**8. Space Discovery from Residence**
- Current: Can navigate to explore/other spaces via nav only
- Question: Should space page show "similar spaces" or "related spaces"?
- Question: Should it show "friends in this space"?

**9. Scale Handling (5-person vs. 200-person)**
- Question: Should large spaces (100+ members) have different defaults (archive old messages, collapse threads)?
- Question: Should member search be required for large spaces (can't scroll 200 names)?
- Question: Should there be channel roles (moderators per board)?

---

### PART C: Open Questions for Creative Direction

#### Spaces HQ

**Q1: The Orbit Metaphor** 🌍  
- Status: Implemented but question remains
- Current: Cards have "warmth glow" that pulses based on activity
- Feeling: Somewhat planetary/celestial
- Question: Should we lean into this? (space cards literally orbit around you? responsive parallax?)
- Or pivot: Is it time for a different metaphor entirely (constellation, neighborhood, campus map)?

**Q2: Identity Prominence**  
- Status: 3 locked cards (Major/Home/Greek) at top
- Tension: For users with all 3 claimed, identity section feels redundant vs. organizations
- Question: Should claimed identity spaces roll into the organizations grid?
- Question: Or should identity remain sacred (separated, always shown)?

**Q3: Onboarding Clarity**  
- Status: Gold banner appears in first 7 days
- Question: Should there be a celebratory moment when 3rd identity is claimed?
- Question: Should the banner change per milestone (claimed 1 → "You're on your way" etc)?

#### Space Residence

**Q4: The "Residence" Metaphor** 🏠  
- Status: Implemented but underexplored
- Current: Header says "Space Residence page", layout is functional split-panel
- Question: Does a space feel like "entering a room" when you land on /s/[handle]?
- Question: Should there be a literal arrival animation (sliding doors, fade-in, etc)?
- Question: Or is "residence" just naming and the real UX is chat-centric?

**Q5: Leader Experience**  
- Status: Settings modal exists, tools button in header
- Tension: Leaders see same feed as members + extra buttons
- Question: Should leaders get a completely different view (dashboard, moderation queue first)?
- Question: Or should it stay memberlike, with "admin panel" as modal?
- Question: Should space leaders see member activity streams (who posted when)?

**Q6: Tool Integration**  
- Status: Tools deployed to sidebar, clickable
- Tension: Tools are first-class citizens in HIVE but feel bolted-on in spaces
- Question: Should tools render inline in chat (as component cards)?
- Question: Should tools have their own leaderboard/results feed?
- Question: Should there be a "Tools" tab alongside chat (architecture change)?

**Q7: The Cold Start Problem**  
- Status: "Start the conversation" messaging
- Tension: A new space with 0 messages feels dead
- Question: Should new spaces auto-create welcome message or bot-intro?
- Question: Should founder get guided tour (add members → create event → send first message)?
- Question: Should empty spaces show "Spaces like this have X members" social proof?

**Q8: Warmth & Vibrancy at Scale**  
- Status: Energy dots + online count + health badge
- Tension: A 5-person space with 1 message looks dormant vs. a 50-person space with 5 messages
- Question: Should engagement metrics be relative to space size (% active members)?
- Question: Should there be "space momentum" (trending up/down on activity)?
- Question: Should dormant spaces show "last active: N days ago" to set expectations?

**Q9: Search & Navigation**  
- Status: Cmd+K search overlay exists
- Question: Should sidebar boards be searchable/filterable?
- Question: Should member search be more powerful (filter by role, online status)?

**Q10: Event-Space Integration** 🎯  
- Status: Events appear in feed, RSVP inline
- Question: Should events have their own "Events" tab vs. mixed feed?
- Question: Should event details unfold inline, or link to dedicated event page?
- Question: Should "starting soon" events float to top or in banner?

**Q11: Notification/Presence Fidelity**  
- Status: Typing indicator shows, online count, mute state
- Question: Should there be richer presence signals (who's reading right now)?
- Question: Should "X is typing" show typing progress (character count)?

---

### PART D: Design Language Reference

#### Motion Tokens  
(All from `@hive/tokens/motion`)
```typescript
MOTION.duration.fast = 150ms
MOTION.duration.base = 250ms
MOTION.duration.slower = 400ms

MOTION.ease.premium = cubic-bezier(0.4, 0.0, 0.2, 1)
MOTION.ease.smooth = cubic-bezier(0.25, 0.46, 0.45, 0.94)
MOTION.ease.default = cubic-bezier(0.4, 0, 0.2, 1)

SPACES_MOTION.card.duration = MOTION.duration.base
SPACES_MOTION.card.orbitHoverY = -2 (pixels)
SPACES_MOTION.card.hoverGlowMultiplier = 2
SPACES_MOTION.stagger.grid = 0.05 (seconds between cards)
SPACES_MOTION.stagger.identity = 0.1
```

#### Color Palette  
```typescript
SPACES_GOLD.primary = '#FFD700' (or CSS var --color-gold)
SPACES_GOLD.glow = 'radial-gradient(ellipse, rgba(255,215,0,X), transparent)'

// Space category accents (SpaceHub)
CATEGORY_COLORS = {
  university: '#3B82F6' (blue),
  student_org: '#F59E0B' (amber),
  residential: '#10B981' (emerald),
  greek: '#8B5CF6' (purple),
}

// Text hierarchy
text-white/90 = primary
text-white/60 = secondary
text-white/40 = tertiary
text-white/20 = faint
```

#### Component Precedents

**From Similar Platforms:**
- **Linear:** Clean split panels, left nav is always-on, subtle hover states
- **Notion:** Identity at top, boards/databases in nav, card-based content
- **Discord:** Servers as left sidebar, channels, members panel, split feed
- **Slack:** Channels, threads, full-width chat, side panels (files, members, details)
- **Vercel:** Dashboard orientation, telemtry cards show "alive" data

---

### PART E: Ideation Prompts for LLM

These are designed to be handed off to a generative system to explore alternative directions:

#### Spaces HQ

1. **"What if your spaces were arranged like a solar system? Claimed identity spaces are larger, at center. Organizations orbit by activity. On hover, show gravitational 'pull' (member flow in/out)."**

2. **"Design a Spaces page that reframes as 'Places I Matter.' Identity cards become larger and more prominent. Organizations are secondary. Add a 'streak counter' for daily visits."**

3. **"What if Spaces HQ showed 'campus map' view? Spaces positioned geographically by type (academic buildings = north, residential = south, etc). Hover shows detail."**

4. **"Redesign the onboarding. First time, show a wizard: 'Pick your major' → 'Pick your home' → 'Join a club.' Each step visibly adds a space to your collection."**

5. **"Create a 'space dashboard' for each space card. Hover reveals mini-stats: messages today, new members, next event. Becomes rich information scent without modal."**

#### Space Residence

6. **"Imagine /s/[handle] like entering a Discord server, but the 'lobby' is animated. Space appears on-screen with a slide-in or fade-in. Sidebar unfolds. Chat loads bottom-up. Everything feels like you're 'arriving.'"**

7. **"Redesign for 'space-as-identity.' Space name/avatar takes up 30% of viewport (hero treatment). Below, the feed. Makes the space feel important, not the chat."**

8. **"What if leaders saw a completely different interface? Dashboard with member growth chart, activity heatmap, moderation queue, and upcoming events. Chat is a tab, not the default."**

9. **"Create a 'space companion' onboarding overlay. New space? Show checklist: 'Add members (X/10) → Invite Facebook group → Post first message → Create event.' Gamified."**

10. **"Design a tool palette. Tools aren't in sidebar—they're in a command palette (Cmd+T). Press it, search/browse tools, deploy to space. Tools then appear as sticky cards in chat where relevant."**

11. **"Imagine event-driven spaces. Instead of chat-first, Events are first-class. Calendar grid on left (events in this space). Right side shows event details + RSVP list + chat for this event."**

12. **"Redesign for 5-person vs. 200-person parity. Small spaces: sidebar collapsed, focus on people faces. Large spaces: sidebar expanded, member search prominent. Adapts to scale."**

#### Cross-System

13. **"What if 'Spaces' and 'Residence' were one seamless experience? Click a space card from HQ → it animates into the residence view. Click back → animates out. No page load feeling."**

14. **"Create a 'space vibe system.' Spaces have a personality (casual, academic, event-focused, study-group). UI adapts color, copy tone, features shown. A casual space doesn't emphasize moderation; an academic one emphasizes resources."**

---

### PART F: Manifest: What the System *Should* Feel Like

**Spaces HQ should feel like:** Your dashboard of communities. Not a feed. Not a directory. A personal map of where you belong.

**Space Residence should feel like:** Walking into your club's room. You see who's here (online), what just happened (recent messages), what's coming (events), and you can immediately participate (chat, RSVP, tools).

**The Tension:** How do we make a 5-person study group feel as alive and legitimate as a 200-person organization? Is that even the goal, or should small spaces feel different (more intimate, slower-paced)?

**The Metaphor:** Spaces are not feeds. They are places. Places have identity, energy, people, and purpose. The UI should reinforce that.

---

### Summary

This brief catalogs:
1. **Current state** of HQ and Residence with actual component names and code patterns
2. **Locked decisions** (routes, campus isolation, real data only, design tokens)
3. **Open questions** spanning layout, metaphor, scale, and UX
4. **Design language** (motion, colors, component precedents)
5. **Creative prompts** for exploring alternative directions
6. **The core tension** that drives ideation

**For the LLM:** Use this to generate multiple creative directions (3-5 per major question) that vary in philosophy (intimacy vs. scale, chat-centric vs. tools-centric, metaphorical vs. functional) without requiring implementation detail.

---

## 7. Profile & Settings

### Part A: Profile Page (`/u/[handle]`)

#### 1. Current State — 3-Zone Belonging-First Layout

**Zone 1: Identity (Unchanged)**
- `ProfileIdentityHero` component: 80px avatar (rounded-lg, not circle), full name + `@handle`, bio (2-3 lines max)
- Credentials: major · year · campus
- Up to 5 achievement badges (`ProfileBadge` type) — builder, student_leader, contributor, early_adopter, founding_leader, etc.
- Action buttons: Edit Profile (own) OR Connect + Message (others)
- Online presence indicator (`isOnline` prop)
- Report option for others' profiles

**Zone 2: Belonging (NEW — the redesign pivot)**
- `ProfileSharedBanner`: Shows "You're both in Design Club and 2 others" + mutual connections count
- **Spaces Grid**: 2-column (sm), 1-column (mobile) via `ProfileBelongingSpaceCard`
  - Each space card shows: emoji, name, role badge (Member/Leader/Owner), member count
  - Gold left border for leader spaces (role !== 'member')
  - Shared badge "You're both here" when viewer shares space
  - MAX_SPACES_VISIBLE = 6, then `ProfileOverflowChip` for "+N more spaces"
- **Upcoming Events**: Grid of `ProfileEventCard` — name, date, RSVP count, emoji
  - MAX_EVENTS_VISIBLE = 3
  - Links to `/events/{event.id}`
- Empty state (own profile): "Join spaces to build your profile" with dashed border

**Zone 3: Activity (Simplified)**
- **Active Days Stat**: Computed from `activityContributions` array (dates with `count > 0`)
  - Formula: `formatActiveDays(activeDaysThisMonth)` → "Active 12 days this month"
  - Icon: ⚡
- **Tools Built**: Only shows if `profileTools.length > 0`
  - Grid: 3-column (lg), 2-column (sm), 1-column (mobile)
  - `ProfileActivityCard` per tool: emoji, name, **gold bottom border if runs >= 100**, run count in bold
  - MAX_TOOLS_VISIBLE = 3, overflow chip for rest
  - "Build a tool for your spaces" prompt (own profile, no tools)
  - Link to `/lab` for viewing all

#### 2. User Intent — Two Divergent Paths

**Own Profile (isOwnProfile=true)**
- Intent: "Show off what I'm building and what I belong to"
- Actions: Edit profile, pin featured tool, explore spaces, navigate to Lab
- Visible: All zones, prompts to join spaces, empty state guides

**Viewing Others' Profile (isOwnProfile=false)**
- Intent: "Learn about this person — who are they? What do we have in common?"
- Actions: Connect, message, view their spaces, explore their tools
- Visible: `ProfileSharedBanner` (social proof), all zones but NO edit/management controls
- Hidden: Report button only visible to non-own profile

#### 3. What's Locked

| Constraint | Implementation |
|-----------|----------------|
| Route | `/u/[handle]` (immutable) |
| Real identity | Campus email, full name, handle required. Profile ID from session. |
| Validation | Zod on edit, campus context from session |
| Access | Own profile check via `isOwnProfile` boolean |
| Design tokens | All colors from `var(--bg-base)`, `var(--bg-surface)`, `var(--text-primary)`, gold `var(--life-gold)` |

#### 4. What's Open — Design Directions

##### Profile Layout (the bento vs. linear tension)

**A. Bento Grid** (CURRENT, Feb 2026)
- Uses `ProfileBentoGrid` primitive: responsive 1/2/3 columns, gap-4, staggered animation
- Cards: featured tool, stats, spaces, tools in visual blocks
- Feels like: Apple Music, Spotify widget boards
- Risk: Dense at mobile, can overwhelm new users with no data

**B. Linear/Stream** — Vertical story
- Single column, cards stack naturally top→bottom
- Feels like: Notion, Are.na, LinkedIn
- Risk: Feels passive, less about "profile as identity dashboard"

**C. Sidebar + Main** — Asymmetric
- `ProfileBentoSidebar` (left/right, 280px) for identity + featured
- `ProfileBentoMain` for scrollable zones
- Feels like: GitHub, Read.cv
- Risk: Breaks on small tablets, sidebar can feel ancillary

---

##### What Goes Above the Fold

**Current** (stacked vertically on all screens):
1. Identity hero
2. Shared banner (others' profiles)
3. First N spaces

**Alternative A**: Sidebar pattern
- Left: Hero + featured tool + stats (sticky on desktop)
- Right: Spaces, events, tools (scrolls)

**Alternative B**: Hero + Belonging merge
- Hero with integrated "You're both in X" inline
- Spaces as horizontal pill scroll below hero (like TikTok follows)

**Alternative C**: Portfolio-first
- Featured tool ABOVE hero (Instagram Stories style)
- "What did you build?" before "Who are you?"

---

##### How Spaces Membership Appears

**Current**: Card grid per space
- `ProfileBelongingSpaceCard`: emoji, name, role, member count
- Role badges only for leader/admin/owner (null for member)
- Gold left border as visual weight

**Alternative A**: Space pills with membership rings
- Horizontal scroll of emoji-only pills
- Concentric rings around emoji = role (gold ring = leader)
- Feels like: Discord roles, Figma team presence

**Alternative B**: Space timeline
- Chronological: "Joined [space] on [date]"
- Shows growth journey
- Feels like: LinkedIn experience timeline

**Alternative C**: Space constellation
- Network diagram showing leader/member relationships
- Nodes sized by member count
- Feels like: Physics simulation, Notion relational views

---

##### How Tools/Creations Are Showcased

**Current**: `ProfileActivityCard` grid
- Emoji, name, runs (large number), context (space name)
- Gold bottom border for runs >= 100 (earned visual reward)
- Sorted by runs descending

**Alternative A**: Featured tool HERO
- One tool takes up 2-3 cols in bento (via `colSpan`)
- Use `ProfileFeaturedToolCard` (gold accent, glow on high performer)
- "Spotlight your best" empty state
- Shows description + runs + deployed spaces
- Risk: Only works if user has tools; empty state needs guidance

**Alternative B**: Achievement badges
- Tools shown as badges/pills, not cards
- "3 tools, 5k runs, 50+ spaces"
- Feels like: Duolingo streak, GitHub contributions
- Risk: Loses narrative of "what each tool does"

**Alternative C**: Tool portfolio cards
- Each tool gets description + gallery of results/outputs
- Like design portfolio case studies
- Feels like: Dribbble, Behance
- Risk: Requires tool creator to upload images/data

---

##### Social Proof (Stats, Activity, Connections)

**Current**:
- `ProfileStatsWidget`: 4-stat card (Spaces, Tools, Activity, Streak)
  - Streak uses 🔥, gold color when > 0
  - Tools highlighted if >= 3
- `ProfileSharedBanner`: Shared spaces + mutual connections (inline text)

**Alternative A**: Compact hero stats
- Name, handle, 3 key stats inline below bio
- "12 spaces · 5 tools · 300 days active" as text
- Feels like: Twitter, GitHub at-a-glance

**Alternative B**: Contribution heatmap
- `ProfileActivityHeatmap` (visible in bento) — calendar grid of contribution days
- Similar to GitHub contributions graph
- Risk: Requires full year data; sparse for new users

**Alternative C**: Social graph bubble
- "500 connections" with avatars (3-5 random)
- "Mutual friends with Sarah, James, +3"
- Feels like: LinkedIn, Facebook mutual connections

---

##### Own Profile vs. Others' Profile Differences

**Current**:
- Own: All zones visible, edit prompts ("Join spaces", "Build a tool"), Edit Profile button
- Others: Same zones, NO edit prompts, Connect/Message buttons, Report option

**Alternative A**: Comparison view for viewing others
- Split screen: Me vs. Them (side-by-side tools, spaces, stats)
- "We both use X spaces"
- Risk: Complex, takes more space

**Alternative B**: "Inspire me" mode
- Suggest spaces/tools they're in but you're not
- "Sarah is in 5 spaces you're not. Explore them?"
- Feels like: Spotify Discovery Weekly

**Alternative C**: Creator vs. Connector badges
- Visual indicator: "More of a builder" vs. "More of a joiner"
- Computed from tools/spaces ratio
- Risk: Feels reductive

---

##### Profile as Portfolio vs. Profile as Social Card

**Portfolio Thesis** (what you've made, impact, skills):
- Featured work (tool with 1k+ runs)
- Credentials (major, year, school)
- Activity streak (commitment signal)
- Spaces LEDed (leadership)
- Feels like: GitHub, Dribbble, dev portfolio
- Best for: "Discover makers"

**Social Card Thesis** (who you are, where you belong, who you know):
- Identity (name, bio, avatar)
- Spaces you're in (belonging)
- Mutual connections (common ground)
- Events you're attending (social proof)
- Feels like: LinkedIn, Slack member card
- Best for: "Find your people"

**HIVE's Hybrid**: Currently leaning social card (Belonging-first redesign) with portfolio elements (featured tool, tool runs)

---

#### 5. The Core Tension

**WHO AM I?** vs. **WHAT HAVE I DONE?**

- Identity-first (current): "Here's my name, bio, credentials. I'm in these spaces. I made these tools."
- Builder-first: "I've made 12 tools with 50k runs. I lead the Design Club. Here's my latest."
- Belonging-first (current): "I'm part of 8 spaces. We're both in Design Club. I organize events."

Current HIVE leans **identity + belonging**. Space to explore **builder** as a distinct direction.

---

### Part B: Settings (`/me/settings`)

#### 1. Current State — 4 Sections

Accessed via `/me/settings` (canonical "You" pillar URL). Uses `SettingsContent` wrapper with section-based routing (`?section=profile|notifications|privacy|account`).

**Layout**: Grid of 4 card buttons → click to expand full-screen section detail

**Profile Section** (`activeSection === 'profile'`)
- `ProfileSection`: Name, bio editable text fields (via `useProfileForm`)
- `InterestsSection`: 
  - Input with suggestions dropdown (INTEREST_SUGGESTIONS array: Programming, AI/ML, Photography, etc.)
  - Max 10 interests
  - Pill UI with X to remove
  - Save button shows only if `hasChanges`
  - Interest validation: 2-50 chars, title case
  - Autocomplete filters existing suggestions, hides already-added

**Notifications Section** (`activeSection === 'notifications'`)
- `NotificationSections`: Email toggles, push toggles, quiet hours (time range)
- Space-specific: Select spaces to mute/unmute
- Saves to `privacySettings` object

**Privacy Section** (`activeSection === 'privacy'`)
- `PrivacySection`: 
  - Profile visibility (public/private toggle)
  - Show activity, show spaces, show connections toggles
  - Show online status toggle
  - Allow DMs toggle
  - Ghost Mode toggle (feature-flagged: `profile_ghost_mode`)
  - Confirm modal for Ghost Mode toggle
- Saves to `profile.privacy` object

**Account Section** (`activeSection === 'account'`)
- `AccountSection`:
  - Calendar integration (Google Calendar): Connect/Disconnect buttons
  - Data export: Download button (triggers `handleDownloadData` hook)
  - Logout button
  - Delete account button (opens `ConfirmModal` with `requireTyping: true, typingWord: 'DELETE'`)

#### 2. What's Locked

| Constraint | Implementation |
|-----------|----------------|
| Route | `/me/settings` (canonical "You" pillar from navigation.ts) |
| Account changes | Email/handle tied to session, requires Firebase auth |
| Validation | Zod on interests, interests.length <= 10, 2-50 char validation |
| Context | `ProfileContextProvider` wraps page, uses `useProfileContext` for `hiveProfile` data |
| Data persistence | All settings → API calls, toast feedback (success/error) |

#### 3. What's Open — Redesign Vectors

##### Settings Organization

**Current**: 4-section grid (Profile, Notifications, Privacy, Account)
- Each section expands to full-screen detail view
- Back button returns to grid

**Alternative A**: Nested sidebar
- Left: Category list (Profile, Notifications, etc.)
- Right: Section content (scrollable)
- Search box to filter all settings
- Feels like: Slack, Discord settings
- Risk: More complex navigation

**Alternative B**: Tab bar
- Horizontal tabs at top: Profile | Notifications | Privacy | Account
- Content swaps below tabs
- Feels like: Instagram settings, Twitter settings
- Risk: Tab overflow on mobile

**Alternative C**: Wizard/progressive disclosure
- First screen: "Pick what to change"
- Then: Focused flow for each (like onboarding)
- Feels like: Stripe, Notion setup flow
- Risk: More clicks, feels slower

**Alternative D**: Flat single page
- All sections stacked vertically
- No click-to-expand (save buttons next to each section)
- Feels like: GitHub settings, basic
- Risk: Long page, information overload

---

##### Notification Preferences UX

**Current**: 
- Toggles per notification type (email, push)
- Quiet hours: time range selector
- Space-specific mute: Checkboxes with space list from `userSpaces`

**Alternative A**: Notification granularity matrix
- Rows: Event types (new_connection, space_message, event_invitation, tool_mention)
- Columns: Channels (email, push, in_app)
- Feels like: Gmail, Slack notification settings
- Risk: Complex grid UI

**Alternative B**: Smart suggestions
- "You get a lot of notifications. We recommend:"
- Auto-disable low-engagement types
- Feels like: Twitter, LinkedIn smart digest
- Risk: Decisions made for user

**Alternative C**: Digest mode
- Toggle: Real-time vs. Daily Digest (1x per day email)
- Select digest time (morning/evening)
- Feels like: Newsletter SaaS, Slack digest
- Risk: Useful for overloaded, not all use cases

---

##### Privacy Controls Layout

**Current**:
- Toggles: public/private, show activity, show spaces, show connections, show online, allow DMs, ghost mode
- Separate toggle UI

**Alternative A**: Visibility levels
- Dropdown: Public → Friends Only → Private
- Auto-toggles related settings
- Feels like: Facebook, Instagram privacy
- Risk: Opinionated, less granular

**Alternative B**: Privacy card visualization
- Visual cards showing "What others see when they visit"
- Toggle each section: Profile, Spaces, Activity, Connections
- Feels like: Figma permissions, Notion share settings
- Risk: Requires more design space

**Alternative C**: Context-based (role-aware)
- Different privacy for: Leaders (spaces you run), Connections, Strangers
- Show "This role sees..."
- Feels like: GitHub private repo access, Google Drive sharing
- Risk: Complex mental model

---

##### Appearance Settings (Hidden Opportunity)

**Current**: None visible in code, but nav has `AppShell`, `globals.css` with dark theme

**Alternative A**: Theme picker
- Light / Dark / Auto
- Accent color (currently gold `var(--life-gold)`)
- Density: Compact / Normal / Spacious
- Feels like: Arc browser, Notion
- Risk: Requires token overrides, CSS variables

**Alternative B**: Accessibility settings
- Font size slider
- High contrast toggle
- Reduce motion toggle
- Feels like: Apple, Windows settings

**Alternative C**: No appearance — consistent dark mode
- HIVE's design is locked dark
- Risk: Not all users want dark mode

---

##### Interest Discovery vs. Typed-In

**Current**:
- Input with suggestions dropdown
- INTEREST_SUGGESTIONS hardcoded array
- Autocomplete on input change
- Can also type custom interests

**Alternative A**: Tag cloud/pills
- Visual display of popular interests on campus
- Click to add (vs. typing)
- Feels like: Tumblr tags, Twitter interests
- Risk: Discovery can feel pushy

**Alternative B**: Interest recommendations
- "Users like you also follow: [AI/ML, Design, Startups]"
- One-click add
- Feels like: Spotify follow suggestions
- Risk: Privacy concern

**Alternative C**: Open entry, no suggestions
- Just a text field + pills
- No autocomplete clutter
- Feels like: Minimalist (Arc, Superhuman)
- Risk: Users unsure what to add, duplicate interests

---

#### 6. Adjacent Flows (Profile ↔ Settings Context)

- **Space → Member Profile**: Click member card in space, view their `/u/[handle]` profile. From there, can Message or Connect.
- **Profile → Settings**: "Edit Profile" button on own profile → `/me/settings?section=profile`
- **Profile → Tool**: Click tool card on profile → `/lab/[toolId]` or tool modal
- **Profile Search**: `/home` or `/explore` → search/discover person → click → `/u/[handle]`

---

#### 7. Competitive Context

| Product | Profile Focus | Settings Approach |
|---------|---------------|------------------|
| **GitHub** | Portfolio (repos, contributions, stars) | Sidebar + detailed sections |
| **LinkedIn** | Social + portfolio (roles, skills, endorsements) | Modal-based editing or tab bar |
| **Read.cv** | Pure portfolio (projects, skills, writing) | Bento grid / card-based layout |
| **Are.na** | Community + collections (personal boards) | Inline editing, no dedicated settings page |
| **Bento.me** | Link-in-bio (customizable widgets) | Drag-drop builder UI |
| **Slack** | Social card (title, bio, status) | Nested sidebar settings |
| **Discord** | Social + gaming (activity, roles) | Tab-based settings |

**HIVE's Position**: Leaning Are.na + LinkedIn (community belonging) + GitHub (activity/contribution). Currently UNIQUE in emphasizing "Where you belong" over "What you've done."

---

### Part C: Ideation Prompts (LLM Creative Directions)

1. **"What if your profile was a living portfolio that updated itself?"**
   - Tool run counts auto-update in real-time
   - Spaces you've joined appear as you join them
   - Contribution heatmap refreshes daily
   - New featured tool auto-selects based on performance
   - Risk: Feels too automatic, loses human curation

2. **"Should profiles emphasize what you BUILD or what you BELONG TO?"**
   - Current: Balanced (both zones)
   - Build thesis: Hide spaces entirely, show only tools + runs + communities-led
   - Belong thesis: Hide tools, show spaces + events + connections
   - Hybrid: Card toggle "View as Builder" vs. "View as Joiner"

3. **"What if viewing someone's profile felt like visiting their personal space?"**
   - Profile styled as a "room" (space aesthetic)
   - Their spaces are furniture/decor they've collected
   - Tools are projects visible on their desk
   - Feels like: Natsume's Book of Friends homes, indie game bedroom scenes
   - Risk: Novelty over clarity

4. **"How should a profile look for someone who just joined vs. a power user?"**
   - New user: Onboarding nudges ("Join 3 spaces to fill your profile")
   - Power user: Mastery badges (100 tools, 10 spaces led, 365-day streak)
   - Feels like: Duolingo level system, WoW achievement tiers
   - Risk: Gamification can feel hollow

5. **"What's the one thing someone should know about you in 3 seconds?"**
   - Current hero: Name + bio + 1 space/tool (visual scan)
   - Alt: "I'm a builder" vs. "I'm a joiner" badge
   - Alt: Live status ("Organizing event", "Coding tool", "In Design Club chat")
   - Alt: One featured tool or space (highest-leverage)

---

### Part D: Actual Components Inventory

#### Profile Components
- `ProfileIdentityHero` — Zone 1, hero card
- `ProfileBelongingSpaceCard` — Space membership card (gold border for leaders)
- `ProfileSharedBanner` — Social proof inline banner
- `ProfileActivityCard` — Tool card (gold border if runs >= 100)
- `ProfileEventCard` — Event listing
- `ProfileOverflowChip` — "+N more" expander
- `ProfileFeaturedToolCard` — Large featured tool hero (gold accent for high performer)
- `ProfileStatsWidget` — 4-stat card (Spaces/Tools/Activity/Streak)
- `ProfileToolModal` — Tool detail modal

#### Profile Primitives
- `ProfileBentoGrid` / `ProfileBentoItem` — Responsive 1/2/3 col layout with stagger animation
- `ProfileBentoSidebar` / `ProfileBentoMain` / `ProfileBentoLayout` — Sidebar + main layout pattern
- `HandleStatusBadge` — Handle availability feedback (idle/checking/available/taken/invalid)

#### Settings Components
- `InterestsSection` — Interest pills + dropdown suggestions
- `ProfileSection` — Name/bio input
- `NotificationSections` — Email/push/quiet hours toggles
- `PrivacySection` — Visibility, ghost mode toggles
- `AccountSection` — Calendar, data export, logout, delete
- `CompletionCard` — Profile completion progress bar
- `ConfirmModal` — Destructive action confirmation

#### Design Tokens Used
- `var(--bg-base)` — Page background
- `var(--bg-surface)` — Card backgrounds
- `var(--text-primary)` — Headings
- `var(--text-secondary)` — Body copy
- `var(--text-tertiary)` — Muted labels
- `var(--life-gold)` — Achievement accent (rgba(255, 215, 0, ...))
- `var(--border-default)` — Default card borders

---

### Part E: Key Code Patterns to Preserve

**Profile Data Flow**:
```
useProfileByHandle() hook
  → state: { profileData, heroUser, profileSpaces, profileTools, ... }
  → computed: belongingSpaces (sorted leaders first), visibleSpaces (sliced), overflowCount
  → render: Zone 1 (hero) → Zone 2 (spaces/events) → Zone 3 (tools/activity)
```

**Settings Data Flow**:
```
ProfileContextProvider → useProfileContext()
  → formData (profile.tsx), notificationSettings, privacySettings, accountSettings
  → click section → activeSection state → render detail view
  → Save → updateProfile() API call → toast feedback
```

**Animation Defaults**:
- Container stagger: `staggerContainerVariants` (0.08s between items)
- Item fade-up: `staggerItemVariants` (fade + y: 16)
- Motion duration: `MOTION.duration.base`, ease: `MOTION.ease.premium`
- Hover: y: -2px, shadow increase

---

**End of Ideation Brief**

This brief captures the actual code state, design tension points, and open directions for creative exploration. It's grounded in component names (`ProfileBelongingSpaceCard`, `InterestsSection`), design tokens (`--life-gold`), and code patterns (MAX_SPACES_VISIBLE, staggerItemVariants) so an LLM can generate concrete, implementable directions.

---

## 8. Lab Ecosystem

### Part A: Lab Dashboard (`/lab`)

#### Current State

The lab dashboard presents **two distinct user experiences**:

**For new users (0 tools):**
- Full-screen welcome flow with word-reveal animation ("Welcome to your Lab")
- Value prop cards: "Engage members," "Organize events," "Track progress"
- Primary quick-start templates grid (5 featured: `quick-poll`, `event-rsvp`, `event-countdown`, `member-leaderboard`, `study-group-signup`)
- Divider labeled "or start from scratch"
- AI prompt input with gold-border animated focus state and arrow submit button
- Empty state hint with Zap icon

**For active builders (1+ tools):**
- "Your Lab" header with "+ New" button
- Tools grid (4-col responsive) showing: `ToolCard` components with status badges (`draft`, `Ready`, `Live`), useCount, updated timestamp
- NewToolCard (+ button) at end of grid with "View all X tools →" link
- Compact quick-start chips below (secondary variant, first 5 templates)
- Collapsed AI prompt section

#### User Intent

**New User:** "Show me what I can quickly build" → Trust through templates → Barrier-free entry
**Returning Builder:** "Get back to my tools" → See progress → Quick templates as power-ups, not onboarding

#### What's Locked

- Route `/lab` (BeakerIcon pillar in 4-pillar IA)
- Tool ownership tied to auth user via `campusId` session
- Status states: `draft | published | deployed`
- Tool → Space relationship (can deploy to multiple spaces)
- Creation entry from: blank ("name your tool") OR template (instant creation)

#### What's Open

**Dashboard Layout:**
- Grid (current) vs. list view? vs. card carousel with peek-ahead?
- Should recently edited tools float to top?
- Should deployed tools have distinct visual treatment (gold glow like `ProfileFeaturedToolCard`)?

**Template Presentation:**
- Currently: 5 featured templates hard-coded (`FEATURED_TEMPLATE_IDS` array)
- Should discovery be: category filters (events/engagement/resources/feedback/teams), complexity badges (simple vs app), or trending?
- Should "See all templates" lead to `/lab/templates` (separate page) or modal/popover?

**Tool Status Indicators:**
- Current: badge (Draft/Ready/Live) + useCount + timestamp
- Missing: # of spaces deployed to? # of active users right now? AI-generated description preview?
- Should draft tools show builder hints ("3 elements added") vs. published show ("Live in 2 spaces")?

**Tool ↔ Space Connection:**
- Current: tool creation preserves `?spaceId=` query param for deploy pre-selection
- Should dashboard show a "Deploy to..." button per tool, or only in IDE post-save?
- Should there be a "Deploy Checklist" (element coverage, connections tested, publish requirements)?

**Creation Flow Entry:**
- Text input → AI name generation → blank tool creation → redirect IDE with `?new=true&prompt=`
- Template click → instant composition → same IDE redirect
- Should there be a guided "setup wizard" for templates before IDE?

**Empty State:**
- Currently: Zap icon + "Tools you create will appear here"
- Should it prompt: "Build your first tool in 5 min" with a CTA + template preview?

---

### Part B: Tool Builder / IDE

#### Current State

The tool builder is referenced but NOT fully visible in these files. From context:

- **Elements System:** 35+ element types available (poll-element, form-builder, leaderboard, countdown-timer, photo-gallery, chart-display, etc.)
- **Composition Structure:** Elements have `instanceId`, `config`, `position`, `size`, `visibilityConditions`
- **Connections:** Data flow between elements via `{ from: {instanceId, output}, to: {instanceId, input} }`
- **Layouts:** `grid | flow | tabs | sidebar` (composition-level)
- **Setup Fields:** Templates can define customization fields (text, date, select, etc.) shown before deployment

**Runtime Context Injection:**
- `ToolRuntimeProvider` wraps IDE and provides: `spaceId`, `deploymentId`, `userId`, `campusId`
- `useToolRuntime` hook manages state, connections, autoSave, realtime sync
- Elements can access: `space`, `member` (role), `temporal` (current time/date), user identity

#### What's Open

**Builder Layout:**
- Canvas-first (current) vs. tree-inspector sidebar on left + viewport on right?
- Mobile-friendly: stacked layout? Or full IDE requires desktop?
- Undo/redo UI? History panel?

**Element Palette Organization:**
- Currently: 35 elements scattered across categories (inputs, outputs, displays, logic)
- Grouping: by category (Forms, Engagement, Events, Resources, Displays)? By complexity? By frequency?
- Search/filter? Favorites?
- Drag-to-canvas or click-to-add?

**Preview Experience:**
- Live preview alongside canvas? Or separate "Preview" mode?
- Can preview as if you're a space member? (show member-specific context)
- Mobile preview? Desktop preview?

**Non-Coder Empowerment:**
- **No-code challenge:** How do students without technical background learn element behavior without reading docs?
- **Discovery:** Hover tooltips? Interactive tutorials? Video demos (Loom embeds)?
- **Scaffolding:** Should templates have "next steps" (e.g., "Add a second question to this poll")?
- **Common Patterns:** Should there be "Recipe" cards? ("Create a Poll → Add Results Display → Connect them")

**Setup Wizard vs. Direct Editing:**
- Templates define `setupFields` (e.g., poll title, date for countdown)
- Should these auto-populate in a modal after creation, or appear inline in canvas?
- Should builders be able to skip setup and edit raw config?

---

### Part C: Tool Distribution

#### How Tools Live in Spaces

**Current States:**

From `/s/[handle]/tools/[toolId]`:
- Tools are **deployed to spaces** with `ToolDeployment` record
- Deployment stores: `surface` (sidebar | feed | page), `config` (elements + connections)
- A space can have **multiple tools in different surfaces**
- Tools are **accessed at route** `/s/[handle]/tools/[toolId]` (full-page view)

**Open Questions:**

- **Surface Strategy:** Should tools be:
  - **Sidebar widget** (compact, always visible, passive updates)? Current default.
  - **Feed item** (inline in space chat/activity stream)? Enables real-time engagement.
  - **Standalone page tab** (like "Tools" tab in space header)? Discoverable but less intrusive.
  - **Modal/popover** (triggered by button)? Interrupts but focused.

- **Tool as "App" vs. "Widget":**
  - Is a **10-element Photo Challenge** an "app" (needs dedicated space)?
  - Is a **1-element Poll** a "widget" (quick & lightweight)?
  - Should surface placement depend on complexity?

- **Tool Discoverability in Spaces:**
  - Should space members see a **"Tools"** card/section in the sidebar (like "Members," "Events")?
  - Should there be a **"Browse Tools"** modal when joining a space?
  - Should space leaders get **"Add Tool"** recommendations based on space activity?

#### Analytics

**Current:** `ToolAnalyticsPage` component displays:
- Overview: totalUsage, activeUsers, avgRating, downloads
- Usage: daily trends, spaces using tool, feature usage breakdown
- Feedback: rating distribution, user comments

**Open Questions:**

- **Builder View:** What does a tool creator need to know to iterate?
  - Which space is driving usage? (feature-space affinity)
  - Which elements are unused? (remove clutter)
  - At what point do users drop off? (UX friction)
  - Common error logs? (broken connections, API failures)

- **Space Leader View:** Should space leaders see analytics for their deployed tools?
  - **Engagement:** Are members using this tool?
  - **Adoption:** Is uptake growing or plateauing?
  - **Feedback:** What are members saying?

- **Campus-Wide View:** Should admins see:
  - Top-performing tools by campus?
  - Which spaces have high tool adoption?
  - Tool usage trends (what type of tools are trending)?

#### Templates

**Current:** 35 templates in `QUICK_TEMPLATES` array:
- **8 app-tier** (4+ elements, multi-step flows): Photo Challenge, Attendance Tracker, Resource Signup, Multi-Poll Dashboard, Event Series Hub, Suggestion Box, Study Group Matcher, Competition Tracker
- **27 simple-tier** (1-2 elements, instant use): Poll, Countdown, Links, Announcements, Leaderboard, RSVP, etc.
- **3 hero demos** (hidden/stub): "Tonight's Events," "What Should I Eat," "Study Spot Finder" (require missing dining/event APIs)

**Categories:**
- `apps` (featured), `events`, `engagement`, `resources`, `feedback`, `teams`

**Template Status:**
- `ready` (all elements live)
- `coming-soon` (has placeholder elements)
- `hidden` (incomplete APIs)

**Open Questions:**

- **Template Discovery:**
  - Current: linear list. Should it be:
  - **By use case** ("I want to engage members" → poll, leaderboard, voting templates)
  - **By surface** (sidebar widgets vs. inline apps)
  - **By setup time** (instant vs. 2-min customization)
  - **By popularity** (trending in your campus)

- **Template Customization:**
  - Should setup fields appear in a wizard modal (current design assumes), or guided in-IDE?
  - Should non-creators have **"Save as Template"** to preserve configurations?

- **Community Templates:**
  - Should high-performing tools be **promoted to template library**? ("Best in Campus")
  - Should creators **publish templates** for other spaces to use?
  - Would a **template marketplace** with ratings/reviews work?

---

### Part D: Adjacent Flows

**Lab → Create Tool → Deploy to Space:**
1. Builder opens `/lab`
2. New user: sees templates, clicks `event-rsvp` → creates tool → redirected to IDE with `?spaceId=xyz`
3. Builder: edits, saves
4. Opens deploy surface picker, selects space + sidebar surface
5. Tool live at `/s/[handle]/tools/[toolId]`

**Space → Tool:**
- Space page shows sidebar widget version of deployed tools
- Members interact, tool state syncs realtime
- Tool creator sees analytics

**Profile → Featured Tools:**
- `ProfileFeaturedToolCard` shows: tool name, emoji, **runs** (high-performer ≥100 gets gold border), **deployed spaces**
- Creator can "pin" a favorite tool to profile
- Clicked: goes to Lab or tool detail view?

---

### Part E: Core Tensions & Ideation Prompts

#### **Tension 1: Lab as Developer IDE vs. No-Code Builder**

**Current:** Hybrid. Dashboard is consumer-friendly (templates), but IDE is raw (canvas + elements + connections).

**If you optimize for developers:**
- Power user: full composition control, API hooks, custom element authoring
- Risk: non-coders abandon at IDE step

**If you optimize for non-coders:**
- Accessibility: guided workflows, pre-built patterns, low-tech setup
- Risk: power users feel constrained, can't build advanced tools

**Prompt:** "What if Lab had two entry points? (1) 'Quick Tool' for templates, (2) 'Advanced Studio' for composition?"

---

#### **Tension 2: Tool as Passive Widget vs. Active App**

**Current:** Tools live as sidebar widgets (passive, ambient) or full-page views (active, intentional).

**If widget-first:**
- Engagement: tools are always visible, passive awareness
- Example: countdown timer, leaderboard, weekly update
- Limitation: can't handle complex multi-step flows

**If app-first:**
- Depth: tools can be rich, interactive, stateful
- Example: Photo Challenge, Attendance Tracker, Study Group Matcher
- Limitation: requires deliberate navigation to discover

**Prompt:** "What if there were a 'widget mode' (simplified) vs. 'app mode' (full-featured) toggle for the same tool?"

---

#### **Tension 3: Creator-Centric vs. Community-Centric**

**Current:** Lab is creator workspace. Analytics exist, but sharing/discovery is minimal.

**If creator-first:**
- Focus: tool analytics, iteration, personal portfolio
- Incentive: "Build something great and deploy it widely"

**If community-first:**
- Focus: space leaders discover tools, rate them, remix them
- Incentive: "Share templates, reuse best practices, contribute to campus library"

**Prompt:** "What if the Lab dashboard had a 'Community' tab showing trending tools campus-wide, and builders could fork/remix them?"

---

#### **Tension 4: Instant Gratification vs. Guided Depth**

**Current:** New users see templates (instant) but IDE is unguided (depth unknown).

**If instant-first:**
- Friction: 10-second tool creation (pick template, name it, deploy)
- Limitation: tools are template clones, limited customization
- Metric: "% of tools deployed same day as creation"

**If depth-first:**
- Friction: 5-min onboarding wizard (choose use case, build elements, test, deploy)
- Benefit: tools are custom, builders understand composition
- Metric: "% of tools with 3+ custom elements"

**Prompt:** "What if every new tool started with an interactive 'Builder 101' checklist? (element added, connection tested, preview checked)"

---

### Part F: Competitive Context

**Notion templates:** Built by creators, shared in community, low friction, template-first
**Airtable interfaces:** Drag-to-build, form/gallery/grid views, power-user friendly
**Retool:** Developer-first, API-centric, requires coding
**Glide:** No-code app builder, mobile-first, template gallery, monetization support
**Webflow:** Designer-centric, visual hierarchy, CMS-powered

**HIVE opportunity:** "Campus-native tools for community leaders" — templates are solved problem, but **student-to-student discovery + remix culture** is gap.

---

### Part G: Ideation Prompts (LLM-Ready)

1. **"What if Lab felt like a creative studio rather than a developer tool?"**
   - Mood board approach to tool building
   - Inspiration from other tools on campus
   - Visual design-first, then functionality

2. **"Should tools be 'apps' or 'widgets' or 'automations'?"**
   - Apps = stateful, interactive, full-page
   - Widgets = ambient, passive, always-on
   - Automations = triggered, background, no UI
   - Or hybrid mode per tool?

3. **"How do we make a student with zero coding experience build something useful in <5 minutes?"**
   - Guided templates with inline help
   - "Copy + customize" model
   - Video walkthroughs per element type
   - Peer examples & comments

4. **"What if the best community tools got promoted campus-wide?"**
   - Editor's choice in template library
   - "Trending this week" leaderboard
   - Revenue share or recognition badges
   - Remix incentives

5. **"Should Lab have a marketplace/gallery of community-created tools?"**
   - Tool ratings & reviews
   - Creator profiles (top builders)
   - Remix + attribution model
   - What would make students willing to remix vs. just use?

6. **"What does the tool creation 'aha moment' look like?"**
   - Is it: deploying first tool? (proof of concept)
   - Seeing first members use it? (impact)
   - Analytics showing adoption? (validation)
   - Remixing a campus favorite? (creativity)
   - How do we choreograph that moment?

---

### Part H: Component & Element Inventory

#### Dashboard Components
- `ToolCard`: status badge, useCount, timestamp
- `NewToolCard`: "+ New" button
- `QuickStartChips`: horizontal template buttons (primary vs. secondary variant)
- `WordReveal`: animated text (new user welcome)
- `GoldBorderInput`: AI prompt input with animated focus
- `BrandSpinner`: loading state

#### IDE Components
- `ToolCanvas`: renders elements, manages state
- `ToolRuntimeProvider`: injects space/user context
- `ToolRuntimeContext`: space, member, temporal data
- `useToolRuntime`: state management, autoSave, realtime

#### Element Types (35 total)
- **Forms:** form-builder
- **Display:** leaderboard, chart-display, member-list, announcement, markdown-element, result-list, progress-indicator, counter
- **Engagement:** poll-element, space-events, space-stats
- **Specialized:** countdown-timer, rsvp-button, photo-gallery, filter-selector
- **Hero (hidden):** dining-picker, personalized-event-feed, study-spot-finder

#### Template Categories (6)
- `apps` — photo-challenge, attendance-tracker, resource-signup, multi-poll-dashboard, event-series-hub, suggestion-box, study-group-matcher, competition-tracker
- `events` — event-rsvp, event-countdown, event-checkin, tonights-events, upcoming-events, event-series-hub
- `engagement` — quick-poll, leaderboard, member-spotlight, anonymous-qa, space-stats, decision-maker
- `resources` — quick-links, office-hours, study-group-signup, budget-overview, weekly-update, what-should-i-eat, study-spot-finder
- `feedback` — anonymous-qa, feedback-form, suggestion-box
- `teams` — study-group-signup, announcements, meeting-notes, member-spotlight, progress-tracker, meeting-agenda, attendance-tracker

#### Template Status Distribution
- 27 `ready` (all elements implemented)
- 5 `coming-soon` (partial stubs)
- 3 `hidden` (missing APIs: dining, event discovery, study spots)

---

### Summary for LLM Ideation

**The HIVE Lab is positioned at the intersection of:**

1. **Ease of Use** (templates) ↔ **Power** (custom composition)
2. **Creator Tools** (personal studio) ↔ **Community Platform** (shared discovery)
3. **Instant Tools** (one-click widgets) ↔ **Rich Apps** (multi-element experiences)
4. **Student Building** (non-coders) ↔ **Creator Recognition** (portfolios, analytics)

**Locked in:** Route, auth, tool-space ownership, status states, element system, 35 templates
**Open for ideation:** Dashboard layout, template discovery, builder UX, analytics depth, sharing model, community discovery, marketplace, surface strategy, tool complexity categorization, creator incentives

Use these 6 ideation prompts + competitive context to generate 4-6 distinct creative directions for the Lab ecosystem.

---

## 9. Shell, Navigation, About & Notifications

### CROSS-CUTTING SYSTEMS — IDEATION BRIEF

**Date:** February 4, 2026  
**Focus:** Creative directions for Shell/Navigation, About Page, and Notification System  
**Purpose:** Enable LLM generation of multiple polished design approaches

---

#### PART A: SHELL & NAVIGATION

##### 1. CURRENT STATE

The shell uses a **dual-mode architecture**:

**Desktop (lg breakpoint, 768px+):**
- **Floating sidebar** (220px expanded, 64px collapsed) positioned at top-left with 12px margin
  - `GlobalSidebar` container: `rgba(10, 10, 10, 0.95)` background, 14px radius, blur(20px) backdrop
  - Structure: `IdentityCard` → `SidebarSpacer` → `NavCard` (4-pillar nav) → `SidebarSpacer` → `SpacesCard` (scrollable spaces list) → `SidebarCollapseToggle`
  - Gold (#FFD700) indicator on left edge of active nav items (2px bar)
  - Collapse toggle accessible via `[` key or button
- **TopBar** (48px height, fixed top) sits adjacent to sidebar
  - Left: Breadcrumbs (auto-generated from pathname)
  - Right: TopBarSearch (⌘K), TopBarNotifications (with gold badge)
  - Orange/red badge (#EF4444) for notification count
- **Main content** area receives `marginLeft` offset = sidebar width + (12px margin × 2)
- Command Palette accessible via ⌘K (keyboard-driven, Raycast-style)

**Mobile (<768px):**
- **BottomNav** (fixed bottom, 72px height with safe-area inset)
  - 4 nav items: Home | Spaces | Lab | You
  - Active indicator: gold bar at top of button with glow effect
  - Haptic feedback on click (if available)
- **No sidebar** — content full-width
- **Mobile header** (56px sticky): just HIVE logo mark centered
- Content shifts down `paddingTop: 56px` + `paddingBottom: 72px`

**Icons & Motion:**
- `shell-icons.tsx`: 18×18, 1.25 stroke width (OpenAI/Apple aesthetic)
  - HomeIcon, SpacesIcon (4-grid), LabIcon (beaker), YouIcon (user)
  - Plus, chevrons, search, settings, logout, bell, etc.
- Motion uses `@hive/tokens` springPresets: `.snappy` for nav transitions, `.default` for others
- Sidebar collapse: smooth width animation, fade on labels
- Mobile nav indicator: `layoutId="mobileActiveIndicator"`, spring animation

**4-Pillar Navigation Model:**
- **Home**: `/home` (also `/feed`, `/explore`) — Dashboard + discovery merged
- **Spaces**: `/spaces` (also `/s/[handle]`) — Your communities + individual space views
- **Lab**: `/lab` — Build tools, your deployments
- **You**: `/me` (also `/profile`, `/settings`, `/u/[handle]`) — Profile + account settings

---

##### 2. THE 4-PILLAR MODEL LOCKED DOWN

Each pillar is **immutable** in terms of core identity:
- Home = entry point, dashboard, discovery
- Spaces = community hub (residence view, chat, events, members)
- Lab = builder mode (create, deploy, manage tools)
- You = identity (profile, settings, connections)

The `/nav-items` config in `navigation.ts` defines the canonical structure. Currently **no sub-tabs or nested nav** within each pillar — each is self-contained.

---

##### 3. WHAT'S LOCKED (Non-negotiable)

1. **4 pillars fixed** — Do not change pillar names, order, or core function
2. **Responsive shell** — Sidebar ↔ bottom nav toggle at 768px breakpoint
3. **Campus context in TopBar** — Session-based campus isolation (not in sidebar, but present in architecture)
4. **Gold (#FFD700) for active states** — Only used for nav indicators, badges, featured items
5. **Motion tokens from @hive/tokens** — No custom easing, use `easingArrays.default`, `springPresets.snappy`, `durationSeconds.*`
6. **Layout token consistency** — SIDEBAR_WIDTH, TOPBAR_TOKENS.height, etc. all exported from `layout-tokens.ts`

---

##### 4. WHAT'S OPEN TO DESIGN

| Area | Question | Current | Possible |
|------|----------|---------|----------|
| **Sidebar content (expanded)** | What appears below SpacesCard? | Only nav + spaces list + collapse toggle | Recent spaces pinned, presence indicators, DM count (shown in AppShell as Messages), archived spaces, quick actions |
| **Sidebar collapsed state** | How do labels, badges, unread counts display? | Icons only, badges as dots on icon | Tooltip on hover, popover with space name, badge positioning, animation on expand |
| **TopBar left** | Just breadcrumbs? | Yes, auto-generated | Could show page title, back button, context menu, or nothing (minimal) |
| **TopBar right** | Search + notifications only? | Yes | Could add: profile avatar, campus switcher, theme toggle, help, quick commands |
| **Transition between pillars** | How do pages animate? | No explicit transition | Fade + scale, slide left/right, page wipe, or instant (no motion) |
| **Command palette scope** | What's searchable? | Nav items + first 10 spaces | Could include: recent posts, events, tools, settings pages, help articles, team members |
| **Shell adaptation** | Same shell for all page types? | Yes, one universal shell | Could have: space-specific sidebar (members, tools, events), builder-mode sidebar, dashboard-specific topbar |
| **Mobile bottom nav** | Icons + labels, or icons only? | Icons + labels under each | Swipe-to-reveal secondary actions, grouped tabs (Home > Feed/Explore/Discover), segmented control in header |
| **Sidebar spacing** | 220px expanded width right? | Yes | Could be 240px (more spacious) or 200px (tighter) |
| **Collapse animation** | Smooth width tween? | Yes, spring animation | Could be accordion-style collapse (sections hide independently), push vs. overlay reveal |

---

##### 5. IDEATION PROMPTS

**A. Sidebar as information dashboard**
- "What if the sidebar showed live campus data: active spaces count, online members, trending posts, or today's events? A live pulse view, not just nav?"
- Constraint: Don't let it become noisy. Must remain a nav-first component.

**B. Spatial memory & gesture navigation**
- "Swipe left/right on desktop to move between pillars? Or maintain that only on mobile?"
- "What if sidebar remembers scroll position per pillar? When you return to Spaces, scroll position is preserved?"

**C. Deep space awareness**
- "When you're inside `/s/[handle]` (a space), should the sidebar change? Show members, tools, space settings instead of your spaces list?"
- "Or keep sidebar static and move contextual nav to TopBar breadcrumbs?"

**D. Unread/notification integration**
- "Badge on Home nav item shows total unreads? Or per-pillar breakdown?"
- "Pulse animation on nav items with activity (breathing gold accent)?"

**E. Mobile bottom nav alternatives**
- "Vertical scroll/snap carousel at bottom (peek at next pillar)?"
- "Segmented control in mobile header instead of fixed bottom nav?"
- "Floating action button for primary action (new post, create space, etc.)?"

**F. Minimal shell variant**
- "Fully hidden sidebar on some pages (post detail, event page)? Slide in from left on demand?"
- "Breadcrumb-only header for focused reading?"

---

#### PART B: ABOUT PAGE

##### 1. CURRENT STATE

The page **exists** at `/about` and is **fully public** (skipped shell via `isStandalonePage` check in `AppShell`).

**Design Approach:**
- Manifesto + narrative, not feature list
- Uses premium motion: `.MOTION.ease.premium`, staggered reveals, parallax scroll effects
- 2-tab structure: **"Our Story"** | **"What's in the App"**
- Fixed header with tab toggle, back button to home
- Full-bleed sections with `RevealSection`, `NarrativeReveal`, `ParallaxText`, `AnimatedBorder` components

**Content Structure:**

*Our Story Tab:*
1. **Hero** — "We stopped waiting for institutions. So we built the infrastructure students were missing."
   - Scroll-driven opacity/scale (sticky position)
   - Scroll indicator at bottom
2. **"What HIVE is"** — 4 narrative paragraphs with staggered character reveal
   - Problem: scattered tools, lack of continuity, knowledge dies with graduation
   - Solution: durable Spaces that persist
3. **"The Belief"** — Gold-bordered container: "The feed isn't the product. The Space is. Legibility, memory, and ownership are."
4. **"Why it took two years"** — First-person narrative (Jacob)
   - Early team, planning paralysis, eventual solo build
   - Call to action: "Tell me what sucks"
5. **Contributors** — Alphabetical list with LinkedIn links, role badges

*What's in the App Tab:*
1. **Spaces** — "Permanent homes for organizations"
   - Before/After split-screen visualization (fragmented tools vs HIVE unified)
   - Feature cards (Feed & Events, Resources, Members & Roles, Analytics)
   - Time Collapse bar (8-10 weeks without HIVE → Day 1 with)
2. **HiveLab** — "The Tool That Builds Tools"
   - Emphasis card with gold gradient
   - Feature list (membership apps, event check-in, budget requests, project showcases)
   - Network Ripple visualization (1 tool → 10 orgs → 100 campuses → 1000+ problems solved)
3. **Profile** — "Identity that compounds"
   - Tracks: spaces led, events organized, tools built, contributions
4. **Feed** — "Campus pulse (more coming soon)"
   - Signal over noise, utility not slot machine

**Call-to-Action Section:**
- "Spaces are being claimed. Tools are being built. What happens next is up to students who show up."
- Closing statement: "The builders inherit what comes next."

**Visual Language:**
- Dark (bg-void: #0A0A0A) with 4% noise overlay
- Gold (#FFD700) for emphasis text and animations
- Framer Motion: staggered reveals, in-view animations, parallax at 0.05–0.15 speed
- Responsive: display-sm on mobile → display-lg on desktop

---

##### 2. USER INTENT

**Pre-signup (landing page visitor):**
- "What is HIVE?" → Need to understand the core thesis quickly
- "Why should I use it?" → Differentiation from GroupMe, Slack, Notion
- "Who else is using it?" → Social proof (contributors, campus count)

**Logged-in (exploration):**
- "What features exist beyond what I'm using?" → Feature discovery
- "Who built this and why?" → Trust/credibility building
- "What's the vision?" → Community alignment

---

##### 3. WHAT'S LOCKED

1. **Route: `/about`** — Public, accessible from landing page
2. **Page is standalone** — Not part of main shell (`isStandalonePage` check)
3. **Exists and is credible** — Can reference it without breaking the product
4. **Design is premium, not product** — Uses `.MOTION.ease.premium`, luxury animations
5. **Manifesto-style tone** — Narrative, not marketing-speak

---

##### 4. WHAT'S OPEN

| Element | Current | Open Options |
|---------|---------|--------------|
| **Tab structure** | 2 tabs (Our Story / What's in App) | Could be: single scrolling page, 3+ tabs (Add: Roadmap? Community? FAQ?), sidebar + main (left nav) |
| **Hero treatment** | Sticky scroll with opacity/scale | Parallax video, full-viewport hero with animated background, minimal text, or immersive canvas |
| **Visualizations** | Before/After split, Time Collapse bar, Network Ripple | Interactive 3D campus network, feature comparison matrix, timeline of milestones, interactive tour |
| **Narrative structure** | Jacob's first-person voice | Co-founder dialogue, team bios with photos, origin story as interactive timeline, student testimonials |
| **Contributors section** | Alphabetical grid with links | Card-based (photo + bio), leaderboard format, organized by role, "read more" bios, contribution impact (commits, PRs) |
| **Testimonials** | None currently | Student quotes (space leaders), campus adoption stories, early adopter case studies |
| **Feature showcase** | Text descriptions + card grids | Interactive demos (click to see space in action), video walkthroughs, side-by-side comparisons, live stats |
| **CTA** | Closing statement ("The builders inherit") | "Join now" button, newsletter signup, apply as early adopter, "See a demo" link |
| **Roadmap** | Not present | Public roadmap visible, feature voting, "coming soon" callouts with launch dates |
| **Footer** | Links to Terms, Privacy | Could add: Discord link, Twitter, email signup, copyright year |

---

##### 5. IDEATION PROMPTS

**A. Manifesto as interactive journey**
- "What if the page tells a story by scrolling? Each section reveals a new piece of the problem/solution?"
- "Could the narrative be voice-over with video? Or interactive choice-based storytelling?"

**B. Campus data living on the page**
- "What if the page shows real campus stats: live space count, active members, tools deployed, events this week? The page becomes a living dashboard of network effects?"
- "Refresh in real-time to show activity happening now?"

**C. Visitor personalization**
- "If user is logged in, should `/about` be different? Show their spaces, tools they could build, campus-specific stats?"
- "Or keep it a universal manifesto, accessible to all?"

**D. Narrative formats**
- "Timeline format: 2 years ago (problem identified) → today (MVP shipped) → future (campus at scale)?"
- "Comic/graphic novel style visual narrative?"
- "Vertical scroll becomes a river/flow metaphor: scattered (before) → unified (after)?"

**E. Community layer**
- "Should About feature testimonials from student leaders? 'Why I use HIVE' quotes?"
- "Could it highlight the most active spaces, most deployed tools, largest communities?"

**F. Call-to-action clarity**
- "Current CTA is subtle ('builders inherit'). Could it be explicit (big 'Join' button)?"
- "What action matters most at end of page? Join campus, join early-adopter list, request demo, watch video?"

---

#### PART C: NOTIFICATION SYSTEM

##### 1. CURRENT STATE

**Component: `HiveNotificationBell` (popover-based)**

Located in TopBar (right side), opens to a **popover panel** (340px wide, max-height 480px).

**Bell Icon:**
- `Bell` icon from lucide-react
- Animated gold badge: `min-w-[16px] h-4 px-1` with spring animation (`stiffness: 400, damping: 15`)
- Shows count (1–99, or "99+" for 100+)

**Popover Structure:**
```
┌─ Header (flex, justify-between) ─────────────┐
│ "Notifications"  [Mark all read] (CheckCheck) │
├─ Content (overflow-y-auto, flex-1) ──────────┤
│ [Collapsible Group 1]                         │
│  ├─ [Notification 1] (unread: gold dot)       │
│  ├─ [Notification 2]                          │
│  └─ "+ X more"                                │
│ [Collapsible Group 2]                         │
│  └─ (notifications)                           │
│ ... or "No notifications yet"                 │
├─ Footer ────────────────────────────────────┤
│ "View all notifications" (link)               │
└──────────────────────────────────────────────┘
```

**Notification Grouping:**
- By space (from `metadata.spaceId` and `metadata.spaceName`)
- Non-space notifications grouped under "General"
- Groups sorted by most recent notification timestamp
- Each group collapsible (first 3 expanded by default)
- Shows up to 5 notifications per group, with "+X more" fallback

**Notification Item:**
```
[Gold dot if unread] Title (10px font)
                      Body (11px, line-clamp-1)
                                              Time (10px muted)
```

**Notification Types (from `notification-service.ts`):**
- `comment`, `comment_reply` → Social category
- `like`, `mention` → Social
- `space_invite`, `space_join`, `space_role_change` → Spaces
- `builder_approved`, `builder_rejected` → Spaces
- `space_event_created`, `event_reminder`, `event_rsvp` → Events
- `connection_new` → Connections
- `tool_deployed` → Tools
- `ritual_joined`, `ritual_active`, `ritual_checkin` → Rituals
- `system` → System

**Notification Service Features:**
- User preference filtering (enabled? category subscriptions? quiet hours?)
- Per-space mute settings (temporary or indefinite)
- Duplicate prevention (same type/actor within 1 hour = blocked)
- Bulk notification support (e.g., space_event_created to all members)
- Convenience functions for each type (`notifyNewComment`, `notifySpaceInvite`, etc.)

**Real-time Hook:**
- `useRealtimeNotifications()` manages state, handles marking as read
- Listens to Firestore collection updates
- Tracks `unreadCount`, `notifications[]`, loading state

---

##### 2. ARCHITECTURE LAYER

Notifications flow through:
1. **Backend**: Event triggers `createNotification()` → preference check → duplicate check → space mute check → store in Firestore
2. **Delivery**: `deliverNotification()` async (separate concern, non-blocking)
3. **Frontend hook**: `useRealtimeNotifications()` subscribes to user's notifications collection
4. **UI**: `HiveNotificationBell` renders popover with groups

---

##### 3. WHAT'S LOCKED

1. **Bell in TopBar (right side)** — Fixed position, always accessible
2. **Notification service architecture** — Preference-based filtering, per-space muting
3. **Notification types defined** — Cannot arbitrarily create new types without backend support
4. **Gold badge (#FFD700)** — Unread indicator color
5. **Grouping by space** — Default organizational model

---

##### 4. WHAT'S OPEN TO DESIGN

| Area | Current | Possible Directions |
|------|---------|-------------------|
| **Panel location** | Popover (right-aligned) | Slide-over drawer (full height, left or right), full-page view, modal overlay, floating window, top-down dropdown |
| **Panel size** | 340px wide, max-h-480px | Responsive (60vw on tablet, full-height on mobile), expandable corners, resizable |
| **Grouping strategy** | By space | By type (all comments, all events, all spaces), by recency (latest first, oldest first), by importance (unread, then read), user-selectable categories |
| **Group expansion** | First 3 open by default | All open, all closed, only first open, collapsible with smooth animation |
| **Notification item design** | Icon + title + body + time | Avatar + name + title + action button, rich formatting (markdown), inline actions (reply, RSVP, accept), large card format |
| **Empty state** | Text + icon | Animated illustration, onboarding message, link to settings, "go explore spaces" CTA |
| **Sorting within group** | Most recent first (implicit) | User-sortable, date ranges (Today, Yesterday, This week, Older), priority-based |
| **Action on click** | Navigate to actionUrl + mark read | Inline actions (approve/reject, RSVP, reply), right-click context menu, swipe to archive, swipe to snooze |
| **Notification card style** | Minimal (text + time) | Rich cards with avatars, context thumbnails, color-coded by type, hover-triggered actions |
| **Read state visual** | Gold dot (unread) → no dot (read) | Opacity fade, strikethrough, background color, checkmark overlay, archive animation (slide out) |
| **Mark all read** | Button in header | Keyboard shortcut (A), batch selection, clear by space, clear by type |
| **Frequency control** | Per-category preferences exist but UI not shown | Settings link in popover footer, toggle switches in header, "Quiet until X time" option, digest mode |
| **Mobile behavior** | Popover becomes full modal | Bottom sheet, full-page view, simplified (icons only), native push notifications |
| **Notification badges** | Only on bell icon | Badges on sidebar nav items (Home shows count), per-space badges in sidebar, per-type indicators |
| **Snooze/Later** | Not implemented | Snooze until tomorrow, snooze until I'm online, "mark as read later", defer to digest |
| **Search within notifications** | Not present | Quick search (⌘F in popover), filter by sender, filter by space |

---

##### 5. IDEATION PROMPTS

**A. Notifications as actionable inbox, not feed**
- "What if the panel mimics a todo list? Each notification is actionable (Reply, RSVP, Review, Approve). Clicking the action completes the flow without leaving the panel?"
- "Swipe-to-archive? Delete permanently? Swipe to later/snooze?"

**B. Notification digest/smart bundling**
- "Instead of flat list, group intelligently: 'You have 3 comments on your posts', '2 events coming up', '1 space invite pending'. Summaries instead of individual items?"
- "Daily digest mode? 'Your weekly summary: 12 posts, 3 spaces, 5 events. Read all?'"

**C. Contextual richness**
- "What if each notification showed a thumbnail/preview? Comment notifications show the post, event notifications show the date/time, space invites show space avatar?"
- "Avatar of the sender (who commented, who invited you)?"

**D. Persistent notification center**
- "Popover is great for quick glance, but what about a full-page `/me/notifications` (already exists) that syncs with popover?"
- "Should the full page have filters, sorting, archives, labels (read/unread/later)?"

**E. Notification fatigue prevention**
- "Smart frequency: 'You have 8 comments across 3 posts. Click to expand.' Bundling by context, not individual items?"
- "Quiet hours + digest: turn off real-time during sleep (22:00–08:00), deliver as morning digest instead?"
- "Per-space notification control: mute 'General' for a day, but keep event reminders?"

**F. Mobile optimization**
- "Native push notifications (Web Push API)? Bell popover is too small on mobile."
- "Bottom sheet (half-height modal) instead of full screen?"
- "Simplify mobile: just unread count badge, tap to see list, swipe to mark read?"

**G. Notification types as visual hierarchy**
- "Color-code by type: Social = blue, Spaces = gold, Events = purple, System = gray?"
- "Icons for each type in notification item (comment bubble, calendar, etc.)?"
- "Priority levels: Critical (system, invites) → Medium (comments, events) → Low (likes)?"

**H. Integration with other systems**
- "Does the home page feed mirror recent notifications? Or are they separate concerns?"
- "Should notification preferences be in `/me/settings`? Current API exists but no UI."

---

#### SYNTHESIS & NEXT STEPS

**For Shell & Navigation:**
- Explore sidebar content expansion without clutter
- Test spatial memory (scroll position, collapse state persistence)
- Consider deep space awareness (context-switching in sidebar)
- Mobile nav: evaluate carousel/segmented alternatives

**For About Page:**
- Decide: manifesto-only or interactive feature showcase?
- Evaluate campus data integration (live stats on page)
- Consider visitor personalization (different for logged-in users)
- Test CTA clarity (explicit call-to-action vs. subtle narrative close)

**For Notifications:**
- Rich vs. minimal card design
- Actionable notifications (inline actions vs. navigation)
- Intelligent bundling (digest, grouping, priority)
- Mobile-first notification strategy (push + popover)

All three systems benefit from:
- **Clarity of intent**: What is the user trying to do? (Nav → find spaces, About → understand product, Notifications → stay informed)
- **Minimal but comprehensive**: Show only what matters, but don't hide power features
- **Consistency with brand**: Gold accents, dark theme, premium motion, no corporate-speak
- **Responsive elegance**: Desktop sidebar/popover, mobile bottom-nav/sheet, all feeling intentional

---

**End of Brief**

---

