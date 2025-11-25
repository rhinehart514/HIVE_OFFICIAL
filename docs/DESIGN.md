# HIVE Design System

**Last Updated**: 2025-11-22
**Status**: Production
**Deadline**: December 9-13, 2025
**Single Source of Truth**: This document defines all design decisions for HIVE.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Visual Identity](#visual-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing System](#spacing-system)
6. [Depth System](#depth-system)
7. [Motion System](#motion-system)
8. [Interaction System](#interaction-system)
9. [Component Patterns](#component-patterns)
10. [Page Composition](#page-composition)
11. [Decision Framework](#decision-framework)
12. [Implementation Checklist](#implementation-checklist)

---

## Philosophy

### Why HIVE

**Problem:** Every campus app is built top-down by admins. They feel like homework.

**Solution:** HIVE is the student-run platform. You build your own tools (HiveLab). You run your own spaces. You define campus culture.

**For:** Students who want to own their campus experience, not just consume it.

### Design Formula

```
Confident Clarity = Layered Structure + Spring Motion + Gold Accents + Contextual Depth
```

### Core Principles

| Principle | Expression |
|-----------|------------|
| **Autonomy over institution** | Student names, not admin titles. User-generated content front and center. |
| **Confidence over caution** | Bold statements, not hedging. "You're in" not "You have been added." |
| **Precision + Payoff** | Interactions: snappy, confident. Celebrations: playful, earned. |
| **Clarity over decoration** | Information density without clutter. Effects serve function. |

---

## Visual Identity

### "Autonomous Rebellion"

HIVE is not another uni app made FOR students. It's a platform for students to take control of their campus. The visual language is confident, tech-forward, and celebrates action.

**The restraint IS the rebellion.** Every other app throws colors at you. HIVE is confident enough to be monochrome with ONE earned color: gold.

### YC/SF DNA

HIVE should feel like it was built by YC founders, not a college project:

| Reference | What We Take |
|-----------|--------------|
| **OpenAI** | Confidence in simplicity. Massive whitespace. Typography does the work. |
| **Vercel** | Developer-grade precision. Snappy interactions. Dark mode done right. |
| **Linear** | Keyboard-first. Command palette. Dense but never cluttered. |
| **Raycast** | Delightful details. Satisfying micro-animations. Premium without cold. |

### Performance Standards

| Metric | Target | Why |
|--------|--------|-----|
| **Interaction feedback** | < 100ms | Feels instant |
| **Page transition** | < 300ms | Confident, not sluggish |
| **Feed load** | < 1s cold, < 500ms warm | Core loop speed |
| **Animation duration** | 200-400ms | Snappy, not slow |
| **LCP** | < 2.5s | Core Web Vital |
| **FID** | < 100ms | Core Web Vital |
| **CLS** | < 0.1 | Core Web Vital |

### Accessibility Standards

- **WCAG 2.1 AA** minimum, AAA where possible
- **Keyboard navigation** for all interactions
- **Focus indicators** visible and consistent
- **Screen reader** labels on all interactive elements
- **Reduced motion** respected via `prefers-reduced-motion`
- **Color contrast** 4.5:1 minimum (text), 3:1 (large text)
- **Touch targets** 44x44px minimum on mobile

---

## Color System

### Palette Distribution

```
95% Monochrome (backgrounds, text, borders)
 5% Gold (CTAs, achievements, active states)
```

### Foundation Colors (OKLCH Modern Token System)

**Canonical Gold: `#FFD700` = `oklch(0.884 0.199 97)`**

```typescript
// See: packages/tokens/hive-tokens.css for full token reference

// Background (OKLCH Grayscale)
--hive-background-primary    = var(--hive-gray-1)   // oklch(0.145 0 0) ≈ #0A0A0B
--hive-background-secondary  = var(--hive-gray-2)   // oklch(0.185 0 0) ≈ #111113
--hive-background-tertiary   = var(--hive-gray-3)   // oklch(0.225 0 0) ≈ #1A1A1C
--hive-background-interactive = var(--hive-gray-4)  // oklch(0.265 0 0) ≈ #222225

// Text (OKLCH)
--hive-text-primary   = var(--hive-gray-12)  // oklch(0.985 0 0) ≈ #E5E5E7
--hive-text-secondary = var(--hive-gray-11)  // oklch(0.855 0 0) ≈ #C1C1C4
--hive-text-muted     = var(--hive-gray-9)   // oklch(0.665 0 0) ≈ #9B9B9F

// Brand (Gold OKLCH)
--hive-brand-primary  = var(--hive-gold-9)   // oklch(0.884 0.199 97) = #FFD700 (CANONICAL)
--hive-brand-hover    = var(--hive-gold-10)  // oklch(0.90 0.18 97) ≈ #FFE033
--hive-brand-on-gold  = var(--hive-gray-1)   // Dark text on gold

// Border (OKLCH Transparent)
--hive-border-default = oklch(1 0 0 / 8%)    // Subtle white border
--hive-border-strong  = var(--hive-gray-7)   // oklch(0.445 0 0) ≈ #525252

// Status (OKLCH)
--hive-status-success = var(--hive-green-9)  // oklch(0.696 0.17 162.48) ≈ #10B981
--hive-status-warning = var(--hive-yellow-9) // oklch(0.769 0.188 70.08) ≈ #F59E0B
--hive-status-error   = var(--hive-red-9)    // oklch(0.577 0.245 27.325) ≈ #EF4444
--hive-status-info    = var(--hive-blue-9)   // oklch(0.488 0.243 264.376) ≈ #3B82F6
```

### Gold Usage Rules

**Correct (5% of UI):**
- Primary CTAs (1-2 per page)
- Achievements and badges
- Featured content indicators
- Selected states with glow
- Active presence dots

**Incorrect:**
- Hover states (use white/gray shifts)
- Secondary actions
- Large background areas
- Decorative elements
- Multiple gold elements competing

---

## Typography

### Font Stack

```css
--font-sans: 'Geist', system-ui, sans-serif;
--font-mono: 'Geist Mono', monospace;
```

### Scale

```typescript
const typography = {
  // Display (heroes, celebrations)
  display: 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight',

  // Headings
  h1: 'text-2xl md:text-3xl font-bold tracking-tight',
  h2: 'text-xl md:text-2xl font-semibold',
  h3: 'text-lg font-semibold',
  h4: 'text-base font-medium',

  // Body
  body: 'text-base leading-relaxed',
  bodySmall: 'text-sm leading-relaxed',

  // UI
  label: 'text-sm font-medium',
  caption: 'text-xs text-[var(--hive-text-tertiary)]',

  // Mono (code, stats)
  mono: 'font-mono text-sm',
}
```

### Letter Spacing

```css
tracking-tight: -0.025em   /* Headlines */
tracking-normal: 0         /* Body */
tracking-wide: 0.025em     /* Labels */
tracking-caps: 0.1em       /* Uppercase */
```

### Microcopy Voice

| Instead of | Use |
|------------|-----|
| "No results found" | "Nothing here. Yet." |
| "Error occurred" | "That didn't work." |
| "Loading..." | "One sec." |
| "You have been added" | "You're in." |
| "Successfully created" | "Done." |
| "Are you sure?" | "This can't be undone." |

---

## Spacing System

### 9-Step Scale (Radix-aligned)

```typescript
const spacing = {
  1: '4px',   // Tight gaps, icon padding
  2: '8px',   // Default gap, small padding
  3: '12px',  // Component padding
  4: '16px',  // Card padding, section gaps
  5: '24px',  // Large component padding
  6: '32px',  // Section spacing
  7: '40px',  // Page section gaps
  8: '48px',  // Major section breaks
  9: '64px',  // Hero spacing
}
```

### Usage Rules

| Context | Spacing |
|---------|---------|
| Component internal | `space-2` to `space-4` |
| Between components | `space-4` to `space-6` |
| Page sections | `space-7` to `space-9` |
| Icon to text | `space-2` |
| Form field gap | `space-2` |
| Card padding | `space-4` |
| Modal padding | `space-6` |

### Responsive Insets

```typescript
// Page padding
'px-4 md:px-6 lg:px-8'  // 16px → 24px → 32px
'py-6 md:py-8 lg:py-12' // 24px → 32px → 48px
```

---

## Depth System

HIVE uses 5 depth strategies. Use them appropriately based on context.

### Strategy 1: Elevation (Primary - 70% of depth)

Shadows define hierarchy without transparency cost.

```typescript
const elevation = {
  flat: 'shadow-none',                    // Level 0 - Inline
  raised: 'shadow-sm',                    // Level 1 - Cards
  floating: 'shadow-md',                  // Level 2 - Dropdowns
  overlay: 'shadow-lg',                   // Level 3 - Popovers
  modal: 'shadow-xl',                     // Level 4 - Modals
  prominent: 'shadow-2xl',                // Level 5 - Toasts
}
```

### Strategy 2: Layered Borders (20% of depth)

Subtle borders + inner glow create depth without shadows.

```tsx
// Standard card depth
className="
  border border-[var(--hive-border-default)]
  shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
"
```

### Strategy 3: Background Layers (Always)

Stacked backgrounds define spatial hierarchy.

```typescript
const layers = {
  base: 'bg-[var(--hive-background-primary)]',      // Page background
  surface: 'bg-[var(--hive-background-secondary)]', // Cards, panels
  elevated: 'bg-[var(--hive-background-tertiary)]', // Nested elements
}
```

### Strategy 4: Glassmorphism (8% - Overlays only)

Frosted glass for floating elements that need context visibility.

```tsx
// Use ONLY for:
// - Sticky headers
// - Modal overlays
// - Command palettes
// - Bottom sheets

// Glass header
className="
  backdrop-blur-xl
  bg-[var(--hive-background-primary)]/80
  border-b border-[var(--hive-border-default)]/50
"

// Glass modal
className="
  bg-[var(--hive-background-secondary)]/95
  backdrop-blur-xl
  border border-[var(--hive-border-default)]/50
"
```

### Strategy 5: Golden Glow (2% - Celebrations only)

Reserved for achievements, selections, and celebration moments.

```tsx
// Selected state with gold glow
className="
  bg-[var(--hive-brand-primary)]
  shadow-lg shadow-[var(--hive-brand-primary)]/25
"

// Achievement glow
className="
  shadow-2xl shadow-[var(--hive-brand-primary)]/30
"
```

### Depth Decision Matrix

| Component | Primary Depth | Secondary |
|-----------|---------------|-----------|
| Feed cards | Elevation + Border | - |
| Modals | Glass overlay + Solid panel | Elevation |
| Headers | Glass blur | Border |
| Buttons | Elevation | Golden glow (primary) |
| Forms | Flat with focus ring | - |
| Toasts | High elevation | - |
| Selections | Accent background | Golden glow |
| Celebrations | Golden glow | Motion |

---

## Motion System

### Core Configuration

```typescript
const motion = {
  // Durations
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,

  // Spring configs
  snappy: { type: "spring", stiffness: 500, damping: 30 },
  smooth: { type: "spring", stiffness: 400, damping: 25 },
  gentle: { type: "spring", stiffness: 300, damping: 20 },
  bouncy: { type: "spring", stiffness: 400, damping: 15 },

  // Silk easing (non-spring)
  silk: [0.22, 1, 0.36, 1],

  // Stagger delays
  listStagger: 0.06,
  gridStagger: 0.04,
}
```

### Standard Animation Patterns

**Enter Animation:**
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
```

**Exit Animation:**
```tsx
exit={{ opacity: 0, y: -10 }}
transition={{ duration: 0.2 }}
```

**Stagger List:**
```tsx
<motion.ul
  variants={{
    visible: { transition: { staggerChildren: 0.06 } }
  }}
  initial="hidden"
  animate="visible"
>
  {items.map(item => (
    <motion.li
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.ul>
```

**Layout Animation:**
```tsx
<motion.div layout layoutId="unique-id" />
```

**Scroll-Triggered:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
/>
```

### Animation by Component

| Component | Animation | Config |
|-----------|-----------|--------|
| Button press | `whileTap={{ scale: 0.98 }}` | Instant |
| Card hover | `whileHover={{ y: -2 }}` | 200ms spring |
| List render | Stagger enter | 0.06s delay |
| Modal open | Scale + fade | Spring smooth |
| Page transition | Fade + slide | 300ms silk |
| Toast enter | Slide from edge | Spring snappy |

---

## Interaction System

### Gesture Hierarchy

Every interactive element needs defined states at the appropriate level.

**Level 1: Subtle (Links, text buttons)**
```tsx
const subtleInteraction = {
  whileHover: { opacity: 0.8 },
  whileTap: { opacity: 0.6 },
  transition: { duration: 0.15 }
}
```

**Level 2: Standard (Buttons, cards)**
```tsx
const standardInteraction = {
  whileHover: { y: -2, scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 25 }
}
```

**Level 3: Prominent (Primary CTAs)**
```tsx
const prominentInteraction = {
  whileHover: {
    y: -3,
    scale: 1.02,
    boxShadow: "0 20px 40px -10px rgba(255,215,0,0.3)"
  },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 300, damping: 20 }
}
```

**Level 4: Draggable**
```tsx
const draggableInteraction = {
  drag: true,
  whileDrag: {
    scale: 1.05,
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    cursor: "grabbing"
  },
  transition: { type: "spring", stiffness: 200, damping: 20 }
}
```

### State Visual Matrix

| State | Visual Change | Timing |
|-------|---------------|--------|
| Default | Base appearance | - |
| Hover | Lift + brighten | 150ms |
| Active/Pressed | Compress + darken | Instant |
| Focus | Ring + outline | Instant |
| Disabled | 50% opacity | - |
| Loading | Pulse + spinner | - |
| Selected | Accent color + check | 200ms |
| Error | Red border + shake | 300ms |

---

## Component Patterns

### Component DNA

Every HIVE component should follow this structure:

```tsx
<motion.div
  // 1. LAYOUT
  className="relative flex flex-col"

  // 2. SPACING (use 9-step scale)
  className="p-4 gap-3"

  // 3. SURFACE
  className="
    bg-[var(--hive-background-secondary)]
    border border-[var(--hive-border-default)]
    rounded-xl
  "

  // 4. ELEVATION
  className="shadow-sm"

  // 5. INTERACTION
  whileHover={{ y: -2 }}
  whileTap={{ scale: 0.98 }}

  // 6. TRANSITION
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>
  {/* Content */}
</motion.div>
```

### Card Pattern

```tsx
<motion.article
  layout
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -2 }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
  className="
    bg-[var(--hive-background-secondary)]
    border border-[var(--hive-border-default)]
    rounded-xl
    p-4
    shadow-sm
    hover:shadow-md
    transition-shadow
  "
>
  {/* Card content */}
</motion.article>
```

### Input Pattern

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-[var(--hive-text-primary)]">
    Label
  </label>
  <input
    className="
      w-full
      px-3 py-2.5
      bg-[var(--hive-background-primary)]
      border border-[var(--hive-border-default)]
      rounded-lg
      text-[var(--hive-text-primary)]
      placeholder:text-[var(--hive-text-tertiary)]
      focus:border-[var(--hive-brand-primary)]
      focus:ring-2
      focus:ring-[var(--hive-brand-primary)]/20
      transition-colors
    "
  />
  <p className="text-xs text-[var(--hive-text-tertiary)]">
    Helper text
  </p>
</div>
```

### Button Patterns

```tsx
// Primary (gold) - 1-2 per page max
<motion.button
  whileHover={{ y: -2 }}
  whileTap={{ scale: 0.98 }}
  className="
    px-4 py-2.5
    bg-[var(--hive-brand-primary)]
    text-[var(--hive-obsidian)]
    font-semibold
    rounded-lg
    shadow-lg
    shadow-[var(--hive-brand-primary)]/25
  "
>
  Primary Action
</motion.button>

// Secondary
<motion.button
  whileHover={{ y: -1 }}
  whileTap={{ scale: 0.98 }}
  className="
    px-4 py-2.5
    bg-[var(--hive-background-secondary)]
    border border-[var(--hive-border-default)]
    text-[var(--hive-text-primary)]
    font-medium
    rounded-lg
  "
>
  Secondary
</motion.button>

// Ghost
<motion.button
  whileTap={{ scale: 0.98 }}
  className="
    px-4 py-2.5
    text-[var(--hive-text-secondary)]
    hover:text-[var(--hive-text-primary)]
    hover:bg-[var(--hive-background-secondary)]
    rounded-lg
    transition-colors
  "
>
  Ghost
</motion.button>
```

### Modal Patterns

**Dialog (Solid):**
```tsx
<Dialog>
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="
      bg-[var(--hive-background-secondary)]
      rounded-xl
      p-6
      max-w-sm
      shadow-xl
      border border-[var(--hive-border-default)]
    "
  >
    {/* Dialog content */}
  </motion.div>
</Dialog>
```

**Command Palette (Glass):**
```tsx
<Command>
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="
      bg-[var(--hive-background-secondary)]/95
      backdrop-blur-xl
      rounded-xl
      border border-[var(--hive-border-default)]/50
      shadow-2xl
      max-w-lg w-full
      overflow-hidden
    "
  >
    {/* Command content */}
  </motion.div>
</Command>
```

**Bottom Sheet (Glass):**
```tsx
<Sheet>
  <motion.div
    initial={{ y: "100%" }}
    animate={{ y: 0 }}
    exit={{ y: "100%" }}
    transition={{ type: "spring", damping: 30, stiffness: 300 }}
    className="
      fixed bottom-0 inset-x-0
      bg-[var(--hive-background-secondary)]/95
      backdrop-blur-xl
      rounded-t-2xl
      border-t border-[var(--hive-border-default)]/50
      pb-safe
    "
  >
    {/* Sheet content */}
  </motion.div>
</Sheet>
```

---

## Page Composition

### Content Width Constraints

| Content Type | Max Width | Use Case |
|--------------|-----------|----------|
| Reading | `max-w-prose` (65ch) | Long text, articles |
| Forms | `max-w-md` (448px) | Auth, onboarding |
| Cards | `max-w-lg` (512px) | Modals, dialogs |
| Content | `max-w-2xl` (672px) | Feed, lists |
| Wide | `max-w-4xl` (896px) | Dashboards |
| Full | `max-w-6xl` (1152px) | Admin, grids |

### Standard Page Structure

```tsx
<div className="min-h-screen flex flex-col bg-[var(--hive-background-primary)]">
  {/* Sticky Header - Glass */}
  <header className="
    sticky top-0 z-50
    backdrop-blur-xl
    bg-[var(--hive-background-primary)]/80
    border-b border-[var(--hive-border-default)]/50
  ">
    <div className="px-4 py-3 flex items-center justify-between">
      {/* Nav content */}
    </div>
  </header>

  {/* Main Content */}
  <main className="flex-1 px-4 md:px-6 py-8 md:py-12">
    <div className="max-w-md mx-auto">
      {/* Page content */}
    </div>
  </main>

  {/* Footer */}
  <footer className="p-4 text-center border-t border-[var(--hive-border-default)]">
    <p className="text-xs text-[var(--hive-text-tertiary)]">
      University at Buffalo
    </p>
  </footer>
</div>
```

### Experience Shells (Layout System 2025)

HIVE uses 5 distinct page shells, each designed for a specific user experience. Import from `@hive/ui`:

```tsx
import {
  VoidShell,
  StreamShell,
  CanvasShell,
  ProfileShell,
  GridShell,
} from '@hive/ui';
```

#### Shell 1: VoidShell

**Purpose:** Auth, onboarding, verification
**Energy:** OpenAI - Confident emptiness
**Feel:** You are the focus. Nothing else matters.

```tsx
<VoidShell
  maxWidth="sm"
  showOrb={true}
  showLogo={true}
  showFooter={true}
  footerText="University at Buffalo"
>
  {/* Floating centered content */}
</VoidShell>
```

**Features:**
- Breathing ambient orb (gold glow, 8s animation)
- Floating centered content
- Minimal chrome
- Auto-focus first input

**Use for:** Login, sign up, email verification, onboarding steps

#### Shell 2: StreamShell

**Purpose:** Feed, lists, notifications
**Energy:** Social + AI - Intelligent content flow
**Feel:** Information flowing through you

```tsx
<StreamShell
  maxWidth="md"
  showPresence={true}
  onlineCount={42}
  showBottomNav={true}
  bottomNavContent={<MobileNav />}
>
  <motion.div variants={streamItemVariants}>
    {/* Feed items with stagger */}
  </motion.div>
</StreamShell>
```

**Features:**
- Glass header with presence pulse
- Stagger reveals (0.08s delay between items)
- Mobile bottom nav
- Scroll position memory

**Use for:** Feed, search results, notifications, activity lists

#### Shell 3: CanvasShell

**Purpose:** Tools, editors, HiveLab
**Energy:** Notion/Linear - Tools that feel alive
**Feel:** Powerful but not overwhelming

```tsx
<CanvasShell
  sidebar={<ToolPalette />}
  sidebarPosition="left"
  sidebarWidth="md"
  headerContent={<EditorHeader />}
  showFab={true}
  fabContent={<PlusIcon />}
  onFabClick={handleCreate}
>
  {/* Canvas content */}
</CanvasShell>
```

**Features:**
- Collapsible sidebar (tool palette)
- Floating action button
- Command palette ready
- Auto-save indicator

**Use for:** HiveLab editor, post creation, space management

#### Shell 4: ProfileShell

**Purpose:** Profile, space pages
**Energy:** Instagram meets portfolio - Identity as expression
**Feel:** This is who I am

```tsx
<ProfileShell
  heroContent={<CoverImage />}
  heroHeight="md"
  stickyHeader={<CompactHeader />}
  parallax={true}
  contentMaxWidth="lg"
>
  <motion.div variants={profileCardVariants}>
    {/* Profile content */}
  </motion.div>
</ProfileShell>
```

**Features:**
- Parallax hero (cover image)
- Sticky header on scroll
- Bento grid layout
- Stats with spring animations

**Use for:** User profile, space page, organization page

#### Shell 5: GridShell

**Purpose:** Discovery, galleries
**Energy:** Pinterest/Dribbble - Visual discovery
**Feel:** Endless possibility

```tsx
<GridShell
  headerContent={<FiltersHeader />}
  filtersSidebar={<FilterPanel />}
  showFilters={true}
  columns="auto"
  gap="md"
  masonry={false}
>
  <motion.div variants={gridItemVariants}>
    {/* Grid items with fast stagger */}
  </motion.div>
</GridShell>
```

**Features:**
- Responsive grid (2→3→4 columns)
- Filter sidebar
- Fast stagger (0.04s)
- Hover lift on cards

**Use for:** Explore spaces, tools gallery, search results

#### Shell Selection Guide

| Page | Shell | Why |
|------|-------|-----|
| Login/Signup | VoidShell | Focus on single action |
| Onboarding | VoidShell | Step-by-step focus |
| Feed | StreamShell | Content consumption |
| Notifications | StreamShell | List-based |
| HiveLab Editor | CanvasShell | Tool-based creation |
| Post Creation | CanvasShell | Focused creation |
| User Profile | ProfileShell | Identity expression |
| Space Page | ProfileShell | Community identity |
| Explore Spaces | GridShell | Visual discovery |
| Tools Gallery | GridShell | Grid browsing |

### Sidebar Patterns

Sidebars are **solid backgrounds**, not glass. They're primary UI surfaces.

#### Standard Styling

```tsx
// Sidebar - solid background
className="
  bg-[var(--hive-background-secondary)]
  border-r border-[var(--hive-border-default)]
"

// Header - glass (floating over content)
className="
  backdrop-blur-xl
  bg-[var(--hive-background-primary)]/80
  border-b border-[var(--hive-border-default)]/50
"
```

#### Width Tokens

| Size | Width | Use Case |
|------|-------|----------|
| `sm` | 224px (w-56) | Nav rail expanded |
| `md` | 256px (w-64) | Standard sidebar |
| `lg` | 320px (w-80) | Inspector panels |

#### CanvasShell Layout

```tsx
<CanvasShell
  sidebar={<ToolPalette />}       // Left - element palette
  sidebarWidth="md"
  inspector={<PropertiesPanel />}  // Right - edit selected
  inspectorOpen={selectedId !== null}
  inspectorWidth="lg"
>
  {/* Canvas content */}
</CanvasShell>
```

#### Desktop vs Mobile

| Element | Desktop | Mobile |
|---------|---------|--------|
| Left sidebar | Visible | Drawer (slide from left) |
| Right inspector | Visible | Bottom sheet |
| Nav rail | 64px collapsed | Bottom tab bar |

### Responsive Breakpoints

```typescript
// Mobile first
sm: '640px'   // Small tablets
md: '768px'   // Tablets
lg: '1024px'  // Laptops
xl: '1280px'  // Desktops
```

---

## Decision Framework

### When to Use What

| Scenario | Depth | Motion | Interaction Level |
|----------|-------|--------|-------------------|
| Feed cards | Elevation + Border | Stagger enter | Standard |
| Modals | Glass overlay + Solid | Scale spring | - |
| Headers | Glass blur | Slide down | - |
| Primary buttons | Golden glow | Hover lift | Prominent |
| Secondary buttons | Border | Hover lift | Standard |
| Forms | Flat + focus ring | None | Subtle |
| Toasts | High elevation | Slide + fade | - |
| Selections | Accent background | Instant | - |
| Celebrations | Golden glow + motion | Bouncy spring | - |

### The "Worth It" Test

Before adding any visual effect, ask:
1. Does it improve usability? (navigation, feedback)
2. Does it reinforce hierarchy? (what's important)
3. Does it fit the moment? (celebration vs. work)
4. Is it performant on mobile?

**If not 3/4, skip it.**

### Anti-Patterns

```tsx
// ❌ Hard-coded hex values
className="bg-[#000000]"

// ❌ Defensive fallbacks
style={{ color: 'var(--text-primary, #F7F7FF)' }}

// ❌ Gold for hovers
className="hover:bg-[var(--hive-brand-primary)]"

// ❌ Heavy blur everywhere
className="backdrop-blur-xl" // Only for overlays

// ❌ Bounce easing
transition={{ type: "spring", bounce: 0.5 }}

// ❌ Multiple gold elements competing
// Only 1-2 gold CTAs per page
```

### Correct Patterns

```tsx
// ✅ Semantic tokens only
className="bg-[var(--hive-background-primary)] text-[var(--hive-text-primary)]"

// ✅ Gold only for primary CTAs
<Button variant="primary">Join Space</Button>

// ✅ Spring physics
transition={{ type: "spring", stiffness: 400, damping: 25 }}

// ✅ Silk easing for non-spring
transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
```

---

## Implementation Checklist

### For Every New Component

- [ ] Uses semantic tokens (no hardcoded colors)
- [ ] Follows 9-step spacing scale
- [ ] Has defined hover/active/focus states
- [ ] Uses spring physics for motion
- [ ] Respects cognitive budgets
- [ ] Works on mobile viewport (80% usage)
- [ ] Keyboard accessible
- [ ] Loading/error states handled
- [ ] Screen reader labels

### For Every New Page

- [ ] Sticky header with glass
- [ ] Constrained content width
- [ ] Staggered content entry
- [ ] Footer with campus branding
- [ ] Skeleton loading states
- [ ] Mobile-first layout
- [ ] Error boundaries

---

## Cognitive Budgets

UX constraints enforced programmatically via `useCognitiveBudget` hook:

| Context | Constraint | Value |
|---------|------------|-------|
| Space Board | Max pinned posts | 2 |
| Space Board | Max rail widgets | 3 |
| HiveLab | Max tool fields | 12 |
| Profile | Max rail widgets | 3 |
| Profile | Card primary CTAs | 2 |
| Feed | Max rail widgets | 3 |

---

## Signature Moments

**RSVP confirmed:**
- Number ticks up in real-time
- Your avatar joins the stack
- "You're in." toast with confetti

**Space joined:**
- Welcome by name
- See who else is there
- Gold pulse on your avatar

**First post:**
- "Nice." toast
- Subtle confetti (once)
- Live indicator

**Achievement unlocked:**
- Gold shimmer
- Big number display
- Shareable moment

---

## The HIVE Design Stack

```
┌─────────────────────────────────────┐
│  CELEBRATION LAYER (2%)             │
│  Gold glows, confetti, bouncy       │
│  springs                            │
├─────────────────────────────────────┤
│  OVERLAY LAYER (8%)                 │
│  Glassmorphism, frosted headers,    │
│  modal backdrops                    │
├─────────────────────────────────────┤
│  INTERACTION LAYER (20%)            │
│  Spring hovers, lift effects,       │
│  stagger animations                 │
├─────────────────────────────────────┤
│  STRUCTURE LAYER (70%)              │
│  Layered borders, elevation,        │
│  background stacking                │
└─────────────────────────────────────┘
```

---

## Quick Reference

### CSS Variables (use these, not hex)

```css
/* Backgrounds */
var(--hive-background-primary)
var(--hive-background-secondary)
var(--hive-background-tertiary)

/* Text */
var(--hive-text-primary)
var(--hive-text-secondary)
var(--hive-text-tertiary)

/* Brand */
var(--hive-brand-primary)
var(--hive-obsidian)

/* Border */
var(--hive-border-default)

/* Status */
var(--hive-status-success)
var(--hive-status-warning)
var(--hive-status-error)
var(--hive-status-info)
```

### Motion Presets

```typescript
// Springs
smooth: { type: "spring", stiffness: 400, damping: 25 }
snappy: { type: "spring", stiffness: 500, damping: 30 }
gentle: { type: "spring", stiffness: 300, damping: 20 }

// Easing
silk: [0.22, 1, 0.36, 1]

// Stagger
list: 0.06
grid: 0.04
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [DESIGN_TOKENS_GUIDE.md](./DESIGN_TOKENS_GUIDE.md) | Token layer system details |
| [COMPONENT_CREATION_GUIDE.md](./COMPONENT_CREATION_GUIDE.md) | Step-by-step creation |
| [COGNITIVE_BUDGETS.md](./COGNITIVE_BUDGETS.md) | SlotKit UX constraints |

---

**Remember**: HIVE's design should feel like the future of campus coordination - confident, premium, and effortless. When in doubt, remove rather than add.
