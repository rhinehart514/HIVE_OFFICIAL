# HIVE Frontend Rebuild Plan

## Organizing Principle: Vertical Slices × Design System

Every feature rebuilt to match the 10-level design system. No half-measures. Each vertical slice gets its full design treatment from WORLDVIEW to INSTANCES.

---

## The Contract

**Before:** 267 components scattered across atomic folders, inconsistent with design system
**After:** Every component embodies "Campus at 2am" — warmth in darkness, presence without pressure

---

## Rebuild Order

| Phase | Slice | Category | Template | Priority | Why First |
|-------|-------|----------|----------|----------|-----------|
| 1 | **Landing/Auth** | Portal | Focus | P0 | First impression, conversion |
| 2 | **Onboarding** | Portal | Focus (Reveal) | P0 | User journey foundation |
| 3 | **Spaces** | Home | Shell → Stream | P0 | Core product, where users live |
| 4 | **Discovery** | Discovery | Shell → Grid | P1 | How users find spaces |
| 5 | **HiveLab** | Creation | Workspace | P1 | Leader differentiator |
| 6 | **Profile** | Identity | Shell → Grid (Bento) | P2 | Self-expression |
| 7 | **Feed** | Home | Shell → Stream | P2 | Currently paused anyway |
| 8 | **Admin** | — | Shell → Grid | P3 | Internal tool |

---

## Phase 1: Portal Instances (Landing + Auth)

### Design System Mapping

| Level | Specification |
|-------|---------------|
| **Category** | Portal — "The doors to HIVE" |
| **Template** | Focus (Portal mode) |
| **Atmosphere** | Landing (spacious, atmospheric, ambient) |
| **Gravity** | Escape velocity — launch you elsewhere |
| **Character** | Anticipation, welcome, becoming |

### Instance: `/` — The Landing Portal

**From INSTANCES.md Canonical Spec:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [HIVE Logo]                          │
│                                                         │
│              "Where UB actually happens"                │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │        [Live activity ticker]                   │   │
│   │   "Someone joined Photography Club • 2 people   │   │
│   │    chatting in Code Club • New tool created"    │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│          ┌─────────────────────────────┐                │
│          │     [Enter HIVE →]          │  ← Gold CTA   │
│          └─────────────────────────────┘                │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │ 400+     │  │ 847      │  │ 27       │             │
│   │ Spaces   │  │ Students │  │ Elements │             │
│   └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Design Tokens Applied

```css
/* Landing Atmosphere */
--surface: var(--bg-ground);  /* #0A0A09 */
--atmosphere: var(--glow-warm);
--glass: var(--glass-atmospheric);  /* blur 12px, 60% opacity */

/* Typography */
--hero-text: var(--type-hero);  /* Clash Display 72px/700 */
--body: var(--type-body-lg);  /* Geist 16px */

/* Gold Budget: 1 CTA only */
--cta-bg: var(--life-gold);
--cta-glow: var(--shadow-glow-md);

/* Motion */
--transition: var(--duration-smooth) var(--ease-smooth);  /* 300ms */
```

### Components to Build

| Component | Source | Notes |
|-----------|--------|-------|
| `LandingHero` | NEW | Full viewport, atmospheric |
| `ActivityTicker` | NEW | Real activity, names anonymized |
| `StatsRow` | NEW | Geist Mono numbers |
| `GlassCard` | NEW | Glass surface system |
| `PrimaryCTA` | NEW | Gold, glow, single per section |

### Files to Create/Replace

```
apps/web/src/app/page.tsx                    → REBUILD
apps/web/src/components/landing/             → REBUILD ALL
  ├── landing-hero.tsx                       → NEW
  ├── activity-ticker.tsx                    → NEW
  ├── stats-row.tsx                          → NEW
  ├── glass-card.tsx                         → NEW (move to primitives later)
  └── landing-sections/                      → NEW folder
      ├── what-hive-offers.tsx
      ├── hivelab-preview.tsx
      └── spaces-grid-preview.tsx
```

### Instance Breathing (Context Adaptation)

| Context | Adaptation |
|---------|------------|
| High platform activity | Ticker moves faster, numbers update live |
| Late night (11pm-3am) | "Join the night owls" micro-copy |
| First visit | Full experience |
| Return visit (auth) | Redirect to `/feed` or last space |

### Transitions

| From → To | Effect |
|-----------|--------|
| Landing → Login | **Portal**: Content slides aside, login form enters as "stepping through" |
| Landing → Browse | **Reveal**: Shell assembles, grid fades in |

---

### Instance: `/auth/login` — The Verification Gate

**Template:** Focus (Portal mode)
**Atmosphere:** Landing

```
┌─────────────────────────────────────────────────────────┐
│░░░░░░░░░░░ AMBIENT LAYER ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ ╭─────────────────────╮ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ │     UB Email        │ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ │  [          ]       │ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ │                     │ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ │  [Send Magic Link]  │ ← Gold CTA               │
│░░░░░░░░ ╰─────────────────────╯ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────────────────────┘
```

### Files to Rebuild

```
apps/web/src/app/auth/login/page.tsx         → REBUILD
apps/web/src/app/auth/verify/page.tsx        → REBUILD
apps/web/src/app/auth/expired/page.tsx       → REBUILD
apps/web/src/components/auth/                → REBUILD ALL
```

---

## Phase 2: Onboarding Instance

### Design System Mapping

| Level | Specification |
|-------|---------------|
| **Category** | Portal |
| **Template** | Focus (Reveal mode) |
| **Atmosphere** | Landing → Comfortable transition |
| **Gravity** | Escape velocity |
| **Character** | Transformation, unwrapping |

### The Reveal Pattern (from Arc)

**Arc Insight:** Onboarding assembles the interface. Each step reveals a piece.

```
Step 1: Just question (minimal)
Step 2: Rail appears (sidebar fades in)
Step 3: Grid appears (content takes shape)
End: Full shell assembled — user built their interface
```

### Instance: `/onboarding/*` — The Unwrapping

**Steps:**
1. `user-type-step` — "What brings you to HIVE?" (sidebar: none)
2. `quick-profile-step` — Name + handle (sidebar: ghost appears)
3. `interests-cloud-step` — Tag cloud selection (sidebar: materializes)
4. `completion-step` — "You're in" → auto-join first space

### Components to Rebuild

| Component | Location | Behavior |
|-----------|----------|----------|
| `OnboardingContainer` | NEW | Focus template with reveal |
| `UserTypeStep` | REBUILD | Cards for member/leader |
| `QuickProfileStep` | REBUILD | Name + handle inputs |
| `InterestsCloudStep` | REBUILD | Animated tag cloud |
| `CompletionStep` | REBUILD | Celebration → redirect |
| `LivePreview` | REBUILD | Shows profile building |
| `ShellReveal` | NEW | Progressive shell assembly |

### Files to Rebuild

```
apps/web/src/app/onboarding/page.tsx                      → REBUILD
apps/web/src/components/onboarding/
  ├── onboarding-container.tsx                            → NEW
  ├── shell-reveal.tsx                                    → NEW
  └── steps/
      ├── user-type-step.tsx                              → REBUILD
      ├── quick-profile-step.tsx                          → REBUILD
      ├── interests-cloud-step.tsx                        → REBUILD
      └── completion-step.tsx                             → REBUILD
```

---

## Phase 3: Spaces Instances (Core Product)

### Design System Mapping

| Level | Specification |
|-------|---------------|
| **Category** | Home — "Where you live" |
| **Template** | Shell (Living Sidebar) → Stream (Conversational) |
| **Atmosphere** | Comfortable (standard density, familiar) |
| **Gravity** | High — time disappears here |
| **Character** | Belonging, conversation, presence |

### Instance: `/spaces/[id]` — The Space Home (Canonical)

**From INSTANCES.md:**

```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  [Search]  [⚡ Create]  [🔔]  [Avatar▾]         │  ← Global header
├────────────┬────────────────────────────────────────────┤
│            │  [Breadcrumb: Spaces > Chess Club]         │
│   Rail     │  ┌─────────────────────────────────────┐   │
│  [Home]    │  │                                     │   │
│  [Feed]    │  │         Message Stream              │   │
│  [...]     │  │                                     │   │
│            │  │  [Thread indicators] [Reactions]    │   │
│  ─────     │  │                                     │   │
│  Spaces    │  │                                     │   │
│  [Chess]●  │  └─────────────────────────────────────┘   │
│  [Photo]   │  ┌─────────────────────────────────────┐   │
│  [Code]    │  │  [Composer with slash commands]     │   │
│            │  └─────────────────────────────────────┘   │
├────────────┴────────────────────────────────────────────┤
│              [Typing: Alex, Jordan...]                  │  ← Presence bar
└─────────────────────────────────────────────────────────┘
```

### Shell Modes

| Mode | Width | When |
|------|-------|------|
| **Minimal Rail** | 48px | Browse, Profile, general |
| **Living Sidebar** | 240px | Inside a space (shows activity) |
| **Command-First** | 0px | Power user toggle, ⌘K for everything |
| **Hidden** | 0px | HiveLab, Auth |

### Living Sidebar Content (When in Space)

```
┌────────────────────┐
│ ⬡ HIVE         « │
│──────────────────│
│ ≡ Feed           │
│ □ Spaces         │
│ ⚙ Build          │
│══════════════════│
│ SPACE ACTIVITY   │  ← NEW section
│ [A][A][A] 5 online│
│ Recent Chat:     │
│ "Alex: Hey..."   │
│ typing...        │
│ Tools: Poll      │
│──────────────────│
│ 👤 Profile       │
└────────────────────┘
```

### Instance Memory

| State | How |
|-------|-----|
| Scroll position | localStorage keyed to space+user |
| Draft message | Auto-save every 3 seconds |
| Thread drawer state | Remember open/closed + position |
| Sidebar collapsed | User preference |

### Instance Breathing

| Context | Adaptation |
|---------|------------|
| Multiple typing | Composer bar expands, energy increases |
| No recent activity | "Be the first to say hi" subtle prompt |
| Late night (11pm-3am) | Slightly warmer tones, "night owl" micro-acknowledgment |
| First visit | Welcome banner with space description |
| Returning | "12 new messages since yesterday" |

### Components to Rebuild

| Component | Status | Notes |
|-----------|--------|-------|
| `UniversalShell` | REFACTOR | From 1,158 lines to ~200 |
| `ShellProvider` | EXISTS | Already created in shell refactor |
| `LivingSidebar` | EXISTS | Already created, needs polish |
| `MinimalSidebar` | EXISTS | Already created |
| `SpaceChatBoard` | REBUILD | Stream template |
| `MessageBubble` | REBUILD | iMessage-like intimacy |
| `ChatComposer` | REBUILD | Slash commands, typing |
| `PresenceBar` | NEW | Typing indicators, gold dots |
| `ThreadDrawer` | REBUILD | Rail component |

### Files to Rebuild

```
apps/web/src/app/spaces/[spaceId]/page.tsx                → REBUILD
packages/ui/src/shells/UniversalShell.tsx                 → SIMPLIFY
packages/ui/src/shells/LivingSidebar.tsx                  → EXISTS (polish)
packages/ui/src/atomic/03-Spaces/                         → REBUILD ALL (79 files)
packages/ui/src/atomic/03-Chat/                           → REBUILD ALL (17 files)
```

---

## Phase 4: Discovery Instance

### Design System Mapping

| Level | Specification |
|-------|---------------|
| **Category** | Discovery — "Where you explore" |
| **Template** | Shell (Minimal Rail) → Grid (Netflix/Territorial) |
| **Atmosphere** | Comfortable with Landing moments (hero sections) |
| **Gravity** | Medium — browse, compare, move on |
| **Character** | Curiosity, abundance, choice |

### Instance: `/spaces/browse` — Territory Exploration

**Netflix Row Model:**

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │  🔥 HAPPENING NOW                                   │ │
│ │  Live activity in trending spaces (hero)            │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  RECOMMENDED FOR YOU                        → see all   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ···   │
│  │        │  │        │  │        │  │        │        │
│  │  card  │  │  card  │  │  card  │  │  card  │        │
│  │        │  │        │  │        │  │        │        │
│  └────────┘  └────────┘  └────────┘  └────────┘        │
│                                                         │
│  ACADEMIC                                   → see all   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ···   │
│  └────────┘  └────────┘  └────────┘  └────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Card Hover Preview

When card is hovered/focused:
- Card expands slightly
- Shows: recent message preview, members online, "Join" button
- Reduces clicks to action

### Territory Distinction

Each category has its own "energy":
- Academic: Blue-tinted warmth
- Greek: Gold edge accent
- Culture: Purple subtle
- Student Org: Default

### Components to Rebuild

| Component | Notes |
|-----------|-------|
| `BrowseHero` | Live activity, "Happening Now" |
| `CategoryRow` | Netflix horizontal scroll |
| `SpaceDiscoveryCard` | With hover preview |
| `TerritoryHeader` | Category-specific styling |

### Files to Rebuild

```
apps/web/src/app/spaces/browse/page.tsx                   → REBUILD
apps/web/src/components/spaces/
  ├── browse-hero.tsx                                     → NEW
  ├── category-row.tsx                                    → NEW
  └── space-discovery-card.tsx                            → REBUILD
```

---

## Phase 5: HiveLab Instance (Creation)

### Design System Mapping

| Level | Specification |
|-------|---------------|
| **Category** | Creation — "Where you build" |
| **Template** | Shell (Hidden) → Workspace (Magic/Build) |
| **Atmosphere** | Workshop (compact, utilitarian) |
| **Gravity** | High (flow state) |
| **Character** | Focus, power, possibility |

### Instance: `/tools/create` — The Creation Studio (Canonical)

**Magic Mode (Default):**

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]  Tool Studio  [Preview] [Save▾] [Deploy]       │
├───────────────────────────────────────────┬─────────────┤
│                                           │             │
│                                           │  "Add a     │
│         LIVE CANVAS                       │  countdown  │
│         (see it build)                    │  timer"     │
│                                           │             │
│                                           │  → Building │
│                                           │  → Done!    │
│                                           │             │
├───────────────────────────────────────────┤  ────────── │
│ [📝][📊][🗳️][⏰]  ← Element dock          │   [Ask]    │
└───────────────────────────────────────────┴─────────────┘
```

**Build Mode (Toggle):**

```
┌─────────────────────────────────────────────────────────┐
│  [✨ Magic]  [🔧 Build]                    [Preview]    │
├─────────┬───────────────────────────────────┬───────────┤
│         │                                   │           │
│ PALETTE │                                   │ INSPECTOR │
│         │            CANVAS                 │           │
│  (full  │                                   │  (props   │
│   list) │                                   │   panel)  │
│         │                                   │           │
└─────────┴───────────────────────────────────┴───────────┘
```

### Workshop Atmosphere

```css
/* NO glass, NO gradients, NO ambient warmth */
--hivelab-bg: #0A0A0A;
--hivelab-surface: #141414;
--hivelab-panel: #1A1A1A;
--hivelab-canvas: #0E0E0E;

/* Tight spacing */
--gap: var(--space-3);  /* 12px */
--padding: var(--space-4);  /* 16px */

/* Gold only on active/success */
--deploy-button: var(--life-gold);
```

### Components to Rebuild

| Component | Notes |
|-----------|-------|
| `WorkspaceLayout` | NEW — Magic/Build toggle |
| `HiveLabCanvas` | REBUILD — Infinite, pannable |
| `ElementDock` | REBUILD — Compact, horizontal |
| `ElementPalette` | REBUILD — Full list (Build mode) |
| `PropertiesInspector` | REBUILD — All props exposed |
| `AIChat` | REBUILD — Magic mode rail |
| `ModeToggle` | NEW — ✨ Magic / 🔧 Build |

### Files to Rebuild

```
apps/web/src/app/tools/create/page.tsx                    → REBUILD
apps/web/src/app/tools/[toolId]/edit/page.tsx             → REBUILD
packages/ui/src/components/hivelab/
  ├── workspace-layout.tsx                                → NEW
  ├── ide/hivelab-ide.tsx                                 → REBUILD
  ├── ide/ide-canvas.tsx                                  → REBUILD
  ├── ide/element-dock.tsx                                → NEW
  ├── ide/element-palette.tsx                             → REBUILD
  ├── ide/properties-inspector.tsx                        → REBUILD
  └── ide/ai-chat.tsx                                     → NEW
```

---

## Phase 6: Profile Instance (Identity)

### Design System Mapping

| Level | Specification |
|-------|---------------|
| **Category** | Identity — "Where you reflect" |
| **Template** | Shell (Minimal Rail) → Grid (Bento) |
| **Atmosphere** | Comfortable to Landing (hero energy) |
| **Gravity** | Low — check and go |
| **Character** | Expression, control, privacy |

### Instance: `/profile/[id]` — Public Presence

**Bento Grid Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  ┌───────────────────────┬───────────────────────────┐  │
│  │                       │                           │  │
│  │    IDENTITY CARD      │     SPACES WIDGET         │  │
│  │    (large)            │                           │  │
│  │                       │                           │  │
│  ├───────────────────────┼─────────────┬─────────────┤  │
│  │                       │             │             │  │
│  │    CONNECTIONS        │   HIVELAB   │  ACTIVITY   │  │
│  │                       │             │             │  │
│  └───────────────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Files to Rebuild

```
apps/web/src/app/profile/[id]/ProfilePageContent.tsx      → REBUILD
packages/ui/src/atomic/04-Profile/                        → REBUILD ALL
```

---

## Shared Primitives (Build First)

Before rebuilding slices, establish shared primitives from design system:

### From PRIMITIVES.md / COMPONENTS.md

| Primitive | Design System | Notes |
|-----------|---------------|-------|
| `Button` | BUTTON system | Primary (gold), Secondary, Ghost |
| `Card` | CARD system | Interactive, Static, With Activity |
| `Input` | INPUT system | Base, Focus, Error states |
| `GlassCard` | GLASS system | Landing atmosphere only |
| `PresenceDot` | LIFE system | Gold, breathing animation |
| `Avatar` | — | With presence indicator |
| `Badge` | — | Activity counts |

### Files to Create

```
packages/ui/src/primitives/
  ├── button.tsx          → REBUILD from 00-Global
  ├── card.tsx            → REBUILD
  ├── input.tsx           → REBUILD
  ├── glass-card.tsx      → NEW
  ├── presence-dot.tsx    → NEW
  ├── avatar.tsx          → REBUILD
  └── badge.tsx           → REBUILD
```

---

## Design Tokens Implementation

### Create Token Files

```
packages/ui/src/tokens/
  ├── colors.css          → All color tokens
  ├── typography.css      → Type scale, fonts
  ├── spacing.css         → Spacing scale
  ├── motion.css          → Durations, easings, keyframes
  ├── depth.css           → Z-index, blur, shadows
  ├── atmosphere.css      → Glow, warmth tokens
  └── index.css           → Imports all
```

### Tailwind Config Update

```typescript
// packages/ui/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Backgrounds
        void: '#050504',
        ground: '#0A0A09',
        surface: {
          DEFAULT: '#141312',
          hover: '#1A1917',
          active: '#252521',
        },
        elevated: '#1E1D1B',

        // Text
        primary: '#FAF9F7',
        secondary: '#A3A19E',
        tertiary: '#6B6B70',
        muted: '#3D3D42',

        // Gold
        gold: {
          DEFAULT: '#FFD700',
          hover: '#FFDF33',
          active: '#E5C200',
          pulse: 'rgba(255, 215, 0, 0.60)',
          glow: 'rgba(255, 215, 0, 0.15)',
          subtle: 'rgba(255, 215, 0, 0.08)',
        },
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      transitionDuration: {
        snap: '100ms',
        fast: '150ms',
        quick: '200ms',
        smooth: '300ms',
        gentle: '400ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
}
```

---

## Implementation Sequence

### Week 1: Foundation
- [ ] Create token files
- [ ] Update Tailwind config
- [ ] Build primitives (Button, Card, Input, GlassCard)
- [ ] Build PresenceDot with breathing animation

### Week 2: Phase 1 (Portal)
- [ ] Rebuild Landing page (`/`)
- [ ] Rebuild Auth pages (`/auth/*`)
- [ ] Test transitions

### Week 3: Phase 2 (Onboarding)
- [ ] Build ShellReveal component
- [ ] Rebuild all onboarding steps
- [ ] Implement progressive reveal

### Week 4-5: Phase 3 (Spaces)
- [ ] Polish LivingSidebar
- [ ] Rebuild SpaceChatBoard
- [ ] Rebuild MessageBubble, ChatComposer
- [ ] Build PresenceBar
- [ ] Implement instance memory

### Week 6: Phase 4 (Discovery)
- [ ] Rebuild browse page
- [ ] Build Netflix row components
- [ ] Implement hover previews

### Week 7-8: Phase 5 (HiveLab)
- [ ] Build WorkspaceLayout
- [ ] Implement Magic/Build modes
- [ ] Rebuild canvas and panels

### Week 9: Phase 6 (Profile)
- [ ] Rebuild bento grid
- [ ] Polish identity cards

---

## Success Criteria

### Per Slice

| Slice | Criteria |
|-------|----------|
| **Landing** | Activity ticker shows real data, single gold CTA, glass cards feel premium |
| **Auth** | Glass card floats in atmospheric background, 2am energy |
| **Onboarding** | Shell assembles progressively, feels like unwrapping |
| **Spaces** | Living sidebar shows activity, messages feel intimate, presence dots breathe |
| **Discovery** | Netflix rows scroll smoothly, cards preview on hover |
| **HiveLab** | Workshop feels focused, Magic mode works, no glass/gradients |
| **Profile** | Bento grid responsive, identity clear |

### Design Tests (from PRINCIPLES.md)

- [ ] **2am Test**: Would this feel right at 3am with three real people?
- [ ] **Precision Test**: Can we explain every pixel placement?
- [ ] **Alive Test**: Does this feel like things are happening?
- [ ] **Gold Test**: Is gold only used for life/activity/achievement?
- [ ] **Cringe Test**: Would we be embarrassed if this went viral?

---

## File Deletion Plan

After rebuild, delete:
- All files in `packages/ui/src/atomic/` that weren't rebuilt
- Old landing components in `apps/web/src/components/landing/`
- Duplicate/unused shell components
- Any component not aligned with design system

---

*This plan is the source of truth for the frontend rebuild. Update as slices complete.*
