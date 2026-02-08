# HIVE Design Direction

The unified design specification for HIVE. Every decision runs through one question: **does this help a student find their people, join something real, and come back tomorrow?**

This document is the canonical reference. When it conflicts with other docs, this wins.

---

## 1. The HIVE Design DNA

Five principles. Memorize them.

### 1.1 The Void is the Brand

The darkness is not a "dark theme." It is the canvas. Everything exists against `#0A0A09` -- a warm black that breathes. This is 3am energy. The moment when the dorm is quiet and the screen is the only light. Every surface, every card, every element floats in this void. The void is not empty -- it is waiting.

**Implementation**: Page background is always `--bg-ground: #0A0A09`. Never `#000000` (too cold) and never `#111111` (too lifted). The warmth comes from the slight tint in the last digit: `09` not `0A`.

### 1.2 Gold is Earned

Gold (`#FFD700`) appears in less than 2% of any screen. It is never decoration. It shows up when:
- Something is alive (presence indicators, "147 students online")
- Something was accomplished (tool deployed, ritual complete, handle claimed)
- The final action on a flow (the one "Enter HIVE" button, the one "Deploy" button)
- Content is featured or distinguished (Hot Space badge, Featured Tool)

Gold is the dopamine. If it is everywhere, it is nowhere. White buttons are the default CTA. Gold is the reward.

**Implementation**: Count gold pixels. If more than ~2% of the viewport is gold, remove some. Use `--life-gold: #FFD700` from tokens. Never approximate with `#FACC15` or `#EAB308` (Tailwind yellows). They are not HIVE gold.

### 1.3 100ms or It Doesn't Exist

Every tap, click, and hover responds within 100ms. Not 200ms. Not "fast enough." 100ms. This is the Superhuman rule applied to campus life. Hover states appear instantly. Buttons depress on contact. Navigation is immediate.

**Implementation**: Micro-interactions use `duration: 0.08-0.15s`. Hover backgrounds use `transition-duration: 150ms`. Tap/press states use spring physics with `stiffness: 400+, damping: 25+`. Never `transition-duration: 300ms` on a hover state.

### 1.4 People Before Pixels

Show faces first. Avatars, presence dots, member counts, active-now indicators. Before the user reads a single word, they should feel that other humans are here. This is not a tool -- it is a room.

**Implementation**: Every card that represents a space shows an `<AvatarGroup>` with presence indicators. Member counts are always visible. Online-now counts pulse gently (gold dot with `animate-breathe`). Empty states never say "Nothing here" -- they say "Be the first."

### 1.5 Progressive Density

First visit: breathing room, generous spacing, clear hierarchy. Week two: compact mode unlocks, keyboard shortcuts appear, power-user density becomes available. The product gets denser as the user grows. Never overwhelming on day one, never patronizing on day thirty.

**Implementation**: Default spacing uses `--space-6` (24px) between components. Compact mode (future) tightens to `--space-3` (12px). HiveLab (builder mode) ships at higher density from day one because builders self-select for it.

---

## 2. Color System

The current codebase has 6 overlapping color systems: `colors-unified.ts`, `design-system-v2.ts`, `monochrome.ts`, `tokens.css`, `patterns.ts`, and `spaces.ts`. This is the consolidation.

### 2.1 The One Source of Truth: `tokens.css`

CSS custom properties in `packages/ui/src/design-system/tokens.css` are the canonical color definitions. All TypeScript token files (`colors-unified.ts`, `design-system-v2.ts`, `monochrome.ts`) reference or duplicate these values. Over time, TypeScript files become re-exports only.

### 2.2 The Complete Palette

```
BACKGROUNDS (warm dark, ascending brightness)
--bg-void:           #050504    Deepest layer, behind everything
--bg-ground:         #0A0A09    Page background (THE default)
--bg-surface:        #141312    Cards, containers, inputs
--bg-surface-hover:  #1A1917    Hovered surfaces
--bg-surface-active: #252521    Active/pressed surfaces
--bg-elevated:       #1E1D1B    Modals, dropdowns, popovers

SUBTLE FILLS (white overlays for interactive surfaces)
--bg-subtle:         rgba(255, 255, 255, 0.03)    Barely visible
--bg-muted:          rgba(255, 255, 255, 0.06)    Default card fill
--bg-emphasis:       rgba(255, 255, 255, 0.10)    Hover states

TEXT (slightly warm whites, descending prominence)
--text-primary:      #FAF9F7    Main content (95% visible)
--text-secondary:    #A3A19E    Supporting content (65% visible)
--text-tertiary:     #6B6B70    Subtle text (40% visible)
--text-muted:        #3D3D42    Barely there (25% visible)
--text-ghost:        #2A2A2E    Hint (15% visible)
--text-inverse:      #0A0A09    On gold/light backgrounds

BORDERS (white overlays, ascending prominence)
--border-subtle:     rgba(255, 255, 255, 0.06)    Card borders at rest
--border-default:    rgba(255, 255, 255, 0.10)    Standard borders
--border-emphasis:   rgba(255, 255, 255, 0.15)    Hover/focus borders

INTERACTIVE
--interactive-default: rgba(255, 255, 255, 0.06)
--interactive-hover:   rgba(255, 255, 255, 0.10)
--interactive-active:  rgba(255, 255, 255, 0.15)

FOCUS (always white, never gold)
--focus-ring:        rgba(255, 255, 255, 0.50)
--focus-ring-offset: var(--bg-ground)

GOLD (the 2% budget)
--life-gold:         #FFD700                       Primary gold
--life-gold-hover:   #FFDF33                       Hover state
--life-gold-active:  #E5C200                       Pressed state
--life-pulse:        rgba(255, 215, 0, 0.60)       Pulsing dots
--life-glow:         rgba(255, 215, 0, 0.15)       Background glow
--life-subtle:       rgba(255, 215, 0, 0.08)       Barely-there warmth
--life-edge:         rgba(255, 215, 0, 0.12)       Edge warmth (inset shadows)

STATUS (functional, rare, only for explicit feedback)
--status-error:          #EF4444
--status-error-subtle:   rgba(239, 68, 68, 0.15)
--status-warning:        #F59E0B
--status-warning-subtle: rgba(245, 158, 11, 0.15)
--status-success:        #22C55E
--status-success-subtle: rgba(34, 197, 94, 0.15)
```

### 2.3 Background Rule

The warmth in HIVE backgrounds comes from the last hex digits: `#0A0A09` not `#0A0A0A`. The `09` and `12`/`17`/`21`/`1B` endings add an imperceptible warm shift. This is the difference between "dark mode" and "HIVE." Neutral grays (`#141414`, `#1A1A1A`) are reserved for HiveLab's workshop mode, where precision beats warmth.

### 2.4 Opacity-First Interactivity

Interactive states use `rgba(255, 255, 255, N)` overlays, not named gray steps. This ensures surfaces adapt to any background:

| State | Opacity | Usage |
|-------|---------|-------|
| Rest | `0.03` | Card backgrounds |
| Hover | `0.06`-`0.10` | Hover fills |
| Active/Pressed | `0.10`-`0.15` | Click/tap states |
| Selected | `0.08`-`0.12` | Current selection |
| Disabled | `0.03` + `opacity: 0.5` on text | Disabled elements |

### 2.5 What to Stop Doing

- Stop using `bg-white/[0.02]` in one place and `bg-[#141414]` in another for the same semantic purpose. Use `var(--bg-surface)` or `var(--bg-muted)`.
- Stop using Tailwind arbitrary values for grays (`bg-neutral-900`, `text-neutral-500`). Use HIVE tokens.
- Stop defining new hex colors inline. If a color is not in this palette, it should not exist.

---

## 3. Typography

### 3.1 Three Fonts, Three Jobs

| Font | Variable | Job | Where |
|------|----------|-----|-------|
| **Clash Display** | `--font-display` | Headlines, hero text, personality | `h1`, `h2`, `h3`, display-size text (32px+) |
| **Geist Sans** | `--font-body` | Everything else | Body, labels, buttons, UI chrome |
| **Geist Mono** | `--font-mono` | Technical content | Stats, code, timestamps, data |

### 3.2 Remove Unused Fonts

**Space Grotesk** and **JetBrains Mono** are loaded in `apps/web/src/app/layout.tsx` but never used meaningfully. Geist Mono replaces JetBrains Mono. Space Grotesk has no role.

**Action**: Remove from `layout.tsx`:
```diff
- import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

- const spaceGrotesk = Space_Grotesk({
-   subsets: ['latin'],
-   variable: '--font-space-grotesk',
-   display: 'swap',
- });

- const jetbrainsMono = JetBrains_Mono({
-   subsets: ['latin'],
-   variable: '--font-jetbrains-mono',
-   display: 'swap',
- });

  className={`${GeistSans.variable} ${GeistMono.variable}`}
```

This removes two network requests and ~80KB of font weight.

### 3.3 The Type Scale

Defined in `tokens.css`. Use these variable names everywhere:

```
CLASH DISPLAY (headlines only, 32px and above)
--text-hero:  72px    Landing hero only
--text-6xl:   56px    Major statements
--text-5xl:   48px    Landing headlines
--text-4xl:   40px    Hero sections
--text-3xl:   32px    Page titles (Clash begins here)

GEIST SANS (everything else)
--text-2xl:   24px    Section titles
--text-xl:    20px    Card titles, subheads
--text-lg:    16px    Emphasized body
--text-base:  14px    Default body (THE default)
--text-sm:    12px    Labels, captions, secondary
--text-xs:    11px    Timestamps, metadata, fine print
```

### 3.4 Weight Discipline

| Weight | Variable | Usage |
|--------|----------|-------|
| 400 (Regular) | `--font-regular` | Body text, conversations, most content |
| 500 (Medium) | `--font-medium` | Labels, emphasis, buttons, card titles |
| 600 (Semibold) | `--font-semibold` | Headlines, section headers |
| 700 (Bold) | `--font-bold` | Hero moments only (landing page). Never in app UI. |

Rule: inside the authenticated app, max weight is 600. Bold (700) and Black (900) are reserved for the landing page and marketing.

### 3.5 Letter Spacing

```
--tracking-tighter: -0.03em   Large Clash headlines (48px+)
--tracking-tight:   -0.02em   Display text, page titles
--tracking-normal:   0        Body text (the default)
--tracking-wide:     0.02em   All-caps labels
--tracking-wider:    0.05em   Mono text, spaced labels
```

### 3.6 Hierarchy Through Opacity

Text color uses `--text-primary` through `--text-ghost`. But for inline hierarchy within a single component, use opacity on `text-white`:

```
Emphasis:   text-white/90   (headlines, active states)
Primary:    text-white/70   (body text, labels)
Secondary:  text-white/50   (helper text, metadata)
Tertiary:   text-white/30   (disabled, placeholders)
```

---

## 4. Icons: Lucide Only

### 4.1 The Decision

**Consolidate to Lucide React.** Remove Heroicons over time.

Current state: 291 Heroicons imports across 280 files, 130 Lucide imports across 128 files. Heroicons is more entrenched but Lucide is the better long-term choice:

- **Tree-shaking**: Lucide ships individual ES modules per icon. Bundle only what you use.
- **Consistency**: 1px stroke weight across the entire set. Heroicons has visual weight inconsistencies between outline/solid/mini variants.
- **Size**: Lucide icons are smaller per-icon (~200B vs ~400B for Heroicons).
- **Framework alignment**: Lucide is the icon system used by shadcn/ui, which HIVE's Radix-based primitives align with.
- **Naming**: Lucide uses PascalCase component names (`<Search />`, `<Settings />`). Clean imports.

### 4.2 Icon Sizing Standard

| Context | Size | Lucide prop |
|---------|------|-------------|
| Inline with body text | 14px | `size={14}` |
| Buttons, inputs | 16px | `size={16}` |
| Navigation items | 18px | `size={18}` |
| Section headers | 20px | `size={20}` |
| Empty states, hero | 24px | `size={24}` |
| Feature cards, large | 32px | `size={32}` |

### 4.3 Migration Strategy

Do not do a big-bang migration. Migrate file-by-file as you touch components. When editing a file that imports from `@heroicons/react/24/outline` or `@heroicons/react/20/solid`:

1. Find the Lucide equivalent (almost always a 1:1 match)
2. Replace the import
3. Adjust `className` to Lucide's `size` + `strokeWidth` props
4. Default `strokeWidth` is `2`. Use `1.5` for a lighter feel in navigation.

### 4.4 The Heroicons-to-Lucide Mapping (Common Icons)

```
Heroicons (24/outline)          Lucide
--------------------------------------------
ArrowRightIcon               -> ArrowRight
ChevronDownIcon              -> ChevronDown
MagnifyingGlassIcon          -> Search
XMarkIcon                    -> X
PlusIcon                     -> Plus
Cog6ToothIcon                -> Settings
UserIcon                     -> User
BellIcon                     -> Bell
HomeIcon                     -> Home
ChatBubbleLeftIcon           -> MessageCircle
CalendarIcon                 -> Calendar
CheckIcon                    -> Check
ExclamationTriangleIcon      -> AlertTriangle
InformationCircleIcon        -> Info
EllipsisHorizontalIcon       -> MoreHorizontal
TrashIcon                    -> Trash2
PencilIcon                   -> Pencil
EyeIcon                      -> Eye
LinkIcon                     -> Link
ShareIcon                    -> Share2
FunnelIcon                   -> Filter
AdjustmentsHorizontalIcon   -> SlidersHorizontal
SparklesIcon                 -> Sparkles
RocketLaunchIcon             -> Rocket
WrenchScrewdriverIcon        -> Wrench
DocumentTextIcon             -> FileText
PhotoIcon                    -> Image
MapPinIcon                   -> MapPin
ClockIcon                    -> Clock
StarIcon                     -> Star
HeartIcon                    -> Heart
```

---

## 5. Motion System

The motion system is HIVE's strongest design asset (9/10 in audit). Keep everything. Extend with these additions.

### 5.1 The Three Tiers (Unchanged)

| Tier | Duration | Easing | Use |
|------|----------|--------|-----|
| **Micro** | 80-150ms | `ease-out` or spring `stiffness: 400+` | Hover, focus, toggles, press |
| **Standard** | 200-300ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Transitions, panels, navigation |
| **Cinematic** | 400-700ms | `cubic-bezier(0.165, 0.84, 0.44, 1)` or spring | Page entry, achievements, celebrations |

### 5.2 Signature Motions

These are the animations that make HIVE feel like HIVE:

**Reveal** (cards, list items, content entry):
```typescript
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }
```

**Surface** (modals, popovers, overlays):
```typescript
initial: { opacity: 0, scale: 0.95 }
animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
```

**Stagger** (lists, grids):
```typescript
parent: { transition: { staggerChildren: 0.05 } }   // 50ms between items
child:  revealVariants                                 // Each child uses Reveal
```

**SNAP** (navigation, sidebar items):
```typescript
transition: { type: 'spring', stiffness: 500, damping: 25, mass: 0.5 }
```

### 5.3 Missing Patterns to Add

**Presence Pulse** -- for "online now" indicators:
```typescript
// Gold dot with breathing glow
animate: {
  boxShadow: [
    '0 0 0 0 rgba(255, 215, 0, 0.4)',
    '0 0 0 6px rgba(255, 215, 0, 0)',
  ],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
}
```

**Room Entry** -- for when a user enters a Space:
```typescript
// Content fades in from slight blur
initial: { opacity: 0, filter: 'blur(8px)' }
animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
```

**Count Tick** -- for live member counts and stat changes:
```typescript
// Number scrolls vertically to new value
initial: { y: -20, opacity: 0 }
animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } }
exit: { y: 20, opacity: 0, transition: { duration: 0.15 } }
```

**Gold Moment** -- for achievements, deploy success, ritual completion:
```typescript
// Scale up with gold glow bloom
animate: {
  scale: [0, 1.15, 1],
  boxShadow: [
    '0 0 0 0 rgba(255, 215, 0, 0)',
    '0 0 40px 20px rgba(255, 215, 0, 0.3)',
    '0 0 20px 0 rgba(255, 215, 0, 0.1)',
  ],
  transition: { scale: { type: 'spring', stiffness: 400, damping: 12 }, boxShadow: { duration: 0.8 } }
}
```

### 5.4 Reduced Motion

Always provide a `prefers-reduced-motion` fallback. The system already handles this in `globals.css` with a blanket rule. Individual components should also check:

```typescript
const prefersReduced = useReducedMotion(); // from framer-motion
const variants = prefersReduced ? reducedMotionVariants.fadeOnly : revealVariants;
```

---

## 6. Component Patterns

The 15 core patterns that appear on every HIVE screen. Each one has exactly one way to be built.

### 6.1 Button

Four variants. No more.

| Variant | Appearance | Usage | Tailwind Pattern |
|---------|-----------|-------|-----------------|
| **Primary** | Solid white, black text | Main CTA per screen (1 per view) | `h-12 px-8 rounded-3xl bg-white text-black text-sm font-medium` |
| **Gold** | Solid gold, black text | Final/earned action (1% rule) | `h-12 px-8 rounded-3xl bg-[var(--life-gold)] text-black text-sm font-medium` |
| **Secondary** | Transparent + border | Supporting actions | `h-12 px-8 rounded-3xl bg-transparent text-white border border-white/[0.08]` |
| **Ghost** | Text only | Tertiary actions, links | `px-3 py-2 text-sm text-white/60 hover:text-white` |

All buttons use `rounded-3xl` (24px radius). Icon-only buttons use `rounded-xl` (16px) and are 44x44px minimum.

### 6.2 Card

```css
/* Default Card */
background: var(--bg-muted);              /* rgba(255,255,255,0.06) */
border: 1px solid var(--border-subtle);    /* rgba(255,255,255,0.06) */
border-radius: var(--radius-lg);           /* 12px */

/* Interactive Card (add hover) */
transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
&:hover {
  background: var(--bg-emphasis);          /* rgba(255,255,255,0.10) */
  border-color: var(--border-emphasis);    /* rgba(255,255,255,0.15) */
}
```

Cards use `12px` radius (`--radius-lg`). Large feature cards or modals use `16px` (`--radius-xl`). Hero sections use `24px` (`--radius-2xl`).

### 6.3 Input

```css
height: 44px;                               /* Touch target */
padding: 0 var(--space-4);                  /* 16px horizontal */
background: var(--bg-surface);             /* #141312 */
border: 1px solid var(--border-default);   /* rgba(255,255,255,0.10) */
border-radius: var(--radius-lg);           /* 12px */
color: var(--text-primary);
font-size: var(--text-base);               /* 14px */

&::placeholder { color: var(--text-tertiary); }
&:hover { border-color: var(--border-emphasis); }
&:focus {
  border-color: var(--focus-ring);          /* rgba(255,255,255,0.50) */
  outline: none;
}
```

Focus rings are always white. Never gold on inputs.

### 6.4 Modal

```css
/* Backdrop */
background: rgba(0, 0, 0, 0.60);
backdrop-filter: blur(4px);

/* Content */
background: var(--bg-elevated);            /* #1E1D1B */
border: 1px solid var(--border-subtle);
border-radius: var(--radius-xl);           /* 16px */
box-shadow: var(--shadow-xl);              /* 0 16px 48px rgba(0,0,0,0.6) */
```

Modals enter with `surfaceVariants` (scale 0.95 + fade, spring physics).

### 6.5 Avatar

```
Default:  32px (sidebar, messages)
Small:    24px (inline mentions, dense lists)
Medium:   40px (card headers, member lists)
Large:    64px (profile headers)
XL:       96px (profile page hero)
```

Avatars are always circular (`border-radius: 9999px`). Online indicators are 8px gold dots positioned at bottom-right with a 2px `--bg-ground` ring cutout.

### 6.6 AvatarGroup

Show up to 4 overlapping avatars with a `+N` overflow badge. Overlap is 25% of avatar diameter. Use this everywhere a space or group is referenced.

### 6.7 Badge

```css
/* Default */
display: inline-flex;
padding: 2px 8px;
border-radius: 9999px;
font-size: 11px;
font-weight: 500;
background: var(--bg-emphasis);
color: var(--text-secondary);

/* Gold (earned/featured only) */
background: var(--life-subtle);            /* rgba(255,215,0,0.08) */
color: var(--life-gold);
border: 1px solid rgba(255, 215, 0, 0.30);

/* Status (success/warning/error) */
background: var(--status-success-subtle);
color: var(--status-success);
```

### 6.8 Toast

Bottom-right positioned. Slide in from right. Auto-dismiss after 5s. Uses `--bg-elevated` background with left-colored border for status type.

### 6.9 Empty State

Centered, minimal, never illustrated. Shows:
1. A single line of text in `--text-secondary` at 15px
2. An optional action button (primary or secondary)

Never says "Nothing here." Always directs: "Create your first tool", "Join a space to see activity", "Be the first to post."

### 6.10 Loading State

A single spinner. 20x20px. White with 20% opacity track and 60% opacity rotating segment. Centered in the content area. No skeleton loaders, no shimmer effects. Spinners are honest.

```css
width: 20px;
height: 20px;
border: 2px solid rgba(255, 255, 255, 0.20);
border-top-color: rgba(255, 255, 255, 0.60);
border-radius: 50%;
animation: spin 0.6s linear infinite;
```

### 6.11 Tabs

Underline style. Active tab has a `--text-primary` label with a 2px bottom border. Inactive tabs use `--text-secondary`. No pill/button-style tabs in the main app.

### 6.12 Separator

1px height. `var(--border-subtle)` color. Full width. `margin: var(--space-4) 0` vertical spacing.

### 6.13 Tooltip

```css
background: var(--bg-elevated);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-md);           /* 8px */
padding: 6px 12px;
font-size: 12px;
color: var(--text-primary);
box-shadow: var(--shadow-lg);
```

Appears after 500ms hover delay. Enters with `surfaceVariants` motion.

### 6.14 Dropdown Menu

```css
background: var(--bg-elevated);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-lg);           /* 12px */
padding: 4px;
box-shadow: var(--shadow-xl);

/* Menu Item */
padding: 8px 12px;
border-radius: var(--radius-md);           /* 8px */
font-size: 14px;
&:hover { background: var(--interactive-hover); }
```

Enters with `dropdownVariants` (slide down + stagger children).

### 6.15 Presence Indicator

| State | Visual | Token |
|-------|--------|-------|
| Live (< 30s) | Solid gold dot + pulse animation | `--life-gold` with `animate-breathe` |
| Present (< 2min) | Gold ring, no fill | `rgba(255, 215, 0, 0.5)` ring |
| Recent (< 5min) | Dim gold dot | `rgba(255, 215, 0, 0.4)` |
| Away (> 5min) | Gray dot | `--text-muted` |

---

## 7. HiveLab: The Workshop

HiveLab is where students build tools. It has a different visual register from the rest of HIVE: colder, denser, more utilitarian. Think VS Code, not Instagram.

### 7.1 The Workshop Distinction

| Property | Main HIVE App | HiveLab Workshop |
|----------|--------------|-----------------|
| Background tint | Warm (`#0A0A09`) | Neutral (`#0A0A0A`) |
| Card radius | 12-16px | 8-12px |
| Spacing | Generous (24px gaps) | Compact (8-12px gaps) |
| Typography weight | Regular/Medium | Medium (labels are bolder) |
| Gold usage | Achievements, presence | Deploy button, publish status |
| Atmosphere | Warm, alive, social | Clean, precise, productive |
| Glass effects | Subtle backdrop blur | None -- flat surfaces |
| Interaction speed | 100-200ms | 80-150ms (snappier) |

### 7.2 Workshop Surfaces

```
--hivelab-bg:              #0A0A0A    Workshop page background (no warmth)
--hivelab-surface:         #141414    Panels, cards
--hivelab-surface-hover:   #1A1A1A    Hovered panels
--hivelab-panel:           #1A1A1A    Sidebar, rail backgrounds
--hivelab-canvas:          #0E0E0E    Main editing area
--hivelab-grid:            rgba(255, 255, 255, 0.04)   Canvas dot grid
```

### 7.3 Workshop Motion

Snappier than the rest of HIVE:

```
--workshop-duration: 150ms
--workshop-ease: cubic-bezier(0.22, 1, 0.36, 1)
```

Element palette items snap into place. Canvas interactions use `SPRING_SNAP_NAV` physics. Drag-and-drop uses `tinderSprings.snapBack`.

### 7.4 The Builder's Three Panels

```
LEFT:    Element Palette (200px, collapsible)
         - Element categories
         - Search/filter
         - Drag source

CENTER:  Canvas (fluid width)
         - Dot grid background
         - Draggable elements
         - Connection lines
         - Preview toggle

RIGHT:   Properties Panel (280px, collapsible)
         - Selected element config
         - Data bindings
         - Style overrides
```

### 7.5 Builder Identity

HiveLab should make students feel like creators, not users. The "Deploy" button is the gold moment. When a tool goes live, the gold glow blooms. Stats (views, uses, ratings) use Geist Mono for a technical, dashboard feel.

CSS class prefix: `.workshop-*` for all HiveLab-specific utilities.

---

## 8. Spaces: Walking Into a Room

Spaces are not folders. They are rooms. The design must convey occupancy, activity, and belonging.

### 8.1 The Room Metaphor

When you open a Space, you are "entering" it. The transition should feel spatial:
- Content fades in with a subtle blur clear (Room Entry motion, section 5.3)
- Member list shows who is "in the room" right now
- The first thing you see is people and recent activity, not settings or metadata

### 8.2 The Split Panel Layout

```
LEFT:     Sidebar (200px)
          - Space name + avatar (header)
          - Board list with unread indicators
          - Tools section
          - Members preview (faces, not names)

RIGHT:    Content (fluid)
          - Board header with member count
          - Message feed / board content
          - Sticky input at bottom
```

Sidebar collapses to a bottom sheet on mobile (< 768px). Board switching is instant (100ms crossfade, `contentSwitch` variant).

### 8.3 People-First Layout

Every Space screen shows:
1. **Member faces** -- `<AvatarGroup>` in the sidebar and board header
2. **Active now** -- "5 here now" with pulsing gold dot
3. **Recent posters** -- avatar next to every message
4. **Typing indicators** -- "Ava is typing..." with animated dots

### 8.4 Warmth Spectrum

Spaces get visually warmer as activity increases. This is subtle -- the background tint shifts by 1-2 hex digits, and borders gain a barely-perceptible gold tint:

| Activity Level | Background | Border | Glow |
|---------------|------------|--------|------|
| Empty (0 members) | `#0A0A0A` (cold) | `rgba(255,255,255,0.04)` | None |
| Quiet (1-5 active) | `#0B0A09` | `rgba(255,255,255,0.06)` | None |
| Active (5-20 active) | `#0C0B09` | `rgba(255,215,0,0.08)` | `0 0 40px rgba(255,215,0,0.03)` |
| Live (20+ active) | `#0D0B08` | `rgba(255,215,0,0.15)` | `0 0 60px rgba(255,215,0,0.06)` |

This is already implemented in `warmthSpectrum` in `monochrome.ts`. Use it.

### 8.5 The 30-Second Session

Most Space visits are 30 seconds: check for updates, read new messages, leave. Design for this:
- Unread counts in sidebar are gold badges
- New messages since last visit get an "unread divider" line
- Board switching is < 100ms
- Scroll position is remembered per board

### 8.6 Space Identity

Each Space has:
- A handle (`@design-club`)
- An avatar (circular, 48px in header)
- A optional banner image (gradient overlay to `--bg-ground`)
- A category color (academic blue, creative purple, social amber, professional emerald)

Category colors appear only as 4px vertical indicators and subtle badge tints. They do not override the gold system.

---

## 9. Action Items

Ordered by impact. Do them in this order.

### Priority 1: Immediate (This Sprint)

**1.1 Remove unused fonts**
- File: `apps/web/src/app/layout.tsx`
- Remove `Space_Grotesk` and `JetBrains_Mono` imports, declarations, and CSS variables
- Impact: ~80KB lighter, 2 fewer network requests
- Time: 10 minutes

**1.2 Standardize background tokens**
- Search for: `bg-\[#0A0A0A\]`, `bg-\[#141414\]`, `bg-\[#1A1A1A\]`, `bg-neutral-900`, `bg-neutral-950`, `bg-black`
- Replace with: `bg-[var(--bg-ground)]`, `bg-[var(--bg-surface)]`, `bg-[var(--bg-surface-hover)]`
- Impact: Visual consistency, single source of truth
- Time: 2-3 hours (search-and-replace, then spot-check)

**1.3 Standardize border tokens**
- Search for: `border-neutral-800`, `border-white/10`, `border-\[#2A2A2A\]`, `border-\[rgba(255,255,255,0.06)\]`
- Replace with: `border-[var(--border-subtle)]`, `border-[var(--border-default)]`, `border-[var(--border-emphasis)]`
- Impact: Consistent border appearance across all surfaces
- Time: 2-3 hours

### Priority 2: Near-Term (Next 2 Sprints)

**2.1 Begin icon migration (Lucide)**
- Do not bulk-migrate. Migrate per-file as you touch components.
- Start with the most-imported Heroicons: `XMarkIcon`, `ChevronDownIcon`, `MagnifyingGlassIcon`, `PlusIcon`
- Add a lint rule or codemod note: "Prefer lucide-react for new icons"
- Time: Ongoing, ~5 min per file

**2.2 Consolidate TypeScript token files**
- `colors-unified.ts`, `design-system-v2.ts`, and `monochrome.ts` contain overlapping color definitions
- Refactor: `design-system-v2.ts` becomes the TS re-export of `tokens.css` values
- `colors-unified.ts` becomes a backward-compat alias layer pointing to `design-system-v2.ts`
- `monochrome.ts` Tailwind class strings stay (they are patterns, not raw tokens)
- Remove the `legacy` export from `colors-unified.ts` once all consumers are updated
- Time: 4-6 hours

**2.3 Audit gold usage**
- Search for: `gold-500`, `#FFD700`, `life-gold`, `text-gold`, `bg-gold`
- Verify each usage matches the 2% budget (achievements, presence, final CTAs, featured badges)
- Remove decorative gold that does not signal earned status or final action
- Time: 2-3 hours

### Priority 3: Architectural (Next Month)

**3.1 Component token consumption audit**
- Verify every primitive in `packages/ui/src/design-system/primitives/` uses CSS variables from `tokens.css` (not hardcoded hex values or Tailwind utility colors)
- Fix any that don't
- Time: 1-2 days

**3.2 Add missing motion variants**
- Add `presencePulse`, `roomEntry`, `countTick`, and `goldMoment` variants to `packages/tokens/src/motion.ts`
- Export from `packages/ui/src/motion/index.ts`
- Time: 2-3 hours

**3.3 HiveLab workshop class standardization**
- Verify all HiveLab components use `.workshop-*` CSS classes or `--hivelab-*` / `--ide-*` tokens
- No main-app tokens (`--bg-surface`, warm variants) should leak into workshop mode
- Time: 4-6 hours

**3.4 Spaces warmth integration**
- Wire `getWarmthLevel()` from `monochrome.ts` into the Space shell
- Apply warmth spectrum to Space sidebar and content area background
- Time: 3-4 hours

### Priority 4: Polish (Ongoing)

**4.1 Focus ring consistency**
- Audit all interactive elements for `focus-visible` states
- Every focusable element must show `--focus-ring` (white, 50% opacity, 2px, offset by 2px)
- Time: Ongoing

**4.2 Touch target audit**
- Every button, link, and interactive element must be at least 44x44px on desktop, 48x48px on mobile
- Time: 1 day audit + fixes

**4.3 Empty state audit**
- Every page/view must have a non-dead-end empty state
- Text guides action. Never "Nothing here." Always "Create your first..." or "Join a space..."
- Time: 1 day

---

## 10. Quick Reference: The Cheat Sheet

### When building a new component:

1. Background? `var(--bg-surface)` for cards, `var(--bg-ground)` for page
2. Border? `var(--border-subtle)` at rest, `var(--border-emphasis)` on hover
3. Text? `var(--text-primary)` for content, `var(--text-secondary)` for supporting
4. Radius? `--radius-lg` (12px) for cards/inputs, `--radius-xl` (16px) for modals, `--radius-full` for badges/avatars
5. Motion? `revealVariants` for entry, `surfaceVariants` for overlays, `150ms ease-out` for hover
6. Icon? Import from `lucide-react`, size 16px default
7. Font? Body is Geist (`--font-body`). Only use Clash Display (`--font-display`) for 32px+ headlines
8. Gold? Only if it signals life, achievement, or final action. Otherwise white or gray.
9. Focus ring? White. Always. `focus-visible:ring-2 ring-white/50 ring-offset-2 ring-offset-[var(--bg-ground)]`
10. Empty state? Guide the user. Never a dead end.

### When in doubt:

- Less color, more whitespace
- Fewer words, more faces
- Faster feedback, subtler animation
- White button, not gold button
- 14px body text, not 16px
- 12px radius, not 24px radius
- `rgba(255,255,255,0.06)` border, not `1px solid #333`

---

## Appendix A: File Map for Design Tokens

| File | Role | Status |
|------|------|--------|
| `packages/ui/src/design-system/tokens.css` | **Canonical source.** All CSS custom properties. | Source of truth |
| `packages/tokens/src/design-system-v2.ts` | TS representation of tokens.css + component tokens | Keep, align to tokens.css |
| `packages/tokens/src/colors-unified.ts` | Semantic color hierarchy (foundation/semantic/component) | Keep as TS access layer |
| `packages/tokens/src/monochrome.ts` | Tailwind class string patterns + warmth spectrum | Keep (patterns, not raw tokens) |
| `packages/tokens/src/typography.ts` | Font families + type scale | Keep, align to tokens.css |
| `packages/tokens/src/motion.ts` | All motion values, springs, variants | Keep (primary motion source) |
| `packages/tokens/src/spacing.ts` | 4px-based spacing scale | Keep |
| `packages/tokens/src/radius.ts` | Border radius scale + semantic mappings | Keep |
| `packages/tokens/src/effects.ts` | Shadows, blur, opacity | Keep |
| `packages/tokens/src/layout.ts` | Max-widths, breakpoints, shell system | Keep |
| `packages/tokens/src/patterns.ts` | Pre-composed Tailwind class strings | Keep |
| `packages/tokens/src/spaces.ts` | Space-specific layout + motion tokens | Keep |
| `packages/tokens/src/ide.ts` | HiveLab IDE CSS variable references | Keep |
| `packages/ui/src/motion/presets.ts` | Framer Motion presets (re-exports from tokens) | Keep |
| `apps/web/src/app/globals.css` | Tailwind directives + utility classes | Keep |

## Appendix B: Radius Decision Table

| Element | Radius | Token | Tailwind |
|---------|--------|-------|----------|
| Small inline elements | 4px | `--radius-sm` | `rounded` |
| Inputs, nested cards | 8px | `--radius-md` | `rounded-lg` |
| Cards, containers | 12px | `--radius-lg` | `rounded-xl` |
| Modals, large cards | 16px | `--radius-xl` | `rounded-2xl` |
| Buttons (primary/secondary) | 24px | `--radius-2xl` | `rounded-3xl` |
| Badges, avatars, pills | 9999px | `--radius-full` | `rounded-full` |

## Appendix C: Shadow Scale

```
--shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.3)           Cards at rest
--shadow-md:  0 4px 12px rgba(0, 0, 0, 0.4)           Elevated cards
--shadow-lg:  0 8px 24px rgba(0, 0, 0, 0.5)           Dropdowns, tooltips
--shadow-xl:  0 16px 48px rgba(0, 0, 0, 0.6)          Modals, command palette
--shadow-glow-sm: 0 0 20px rgba(255, 215, 0, 0.15)    Subtle gold glow
--shadow-glow-md: 0 0 40px rgba(255, 215, 0, 0.20)    Medium gold glow
--shadow-glow-lg: 0 0 60px rgba(255, 215, 0, 0.25)    Achievement glow
```
