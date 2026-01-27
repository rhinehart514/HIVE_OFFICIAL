# Layout System

HIVE's spatial foundation. Consistent constraints across all pages.

---

## Container Tiers

Containers constrain content width. Choose based on content type.

| Tier | Max Width | Tailwind | Use Case |
|------|-----------|----------|----------|
| `narrow` | 480px | `max-w-md` | Focus pages (auth, single action) |
| `default` | 768px | `max-w-3xl` | Content pages (profile, settings, stream) |
| `wide` | 1024px | `max-w-5xl` | Browse pages (explore, spaces grid) |
| `full` | 100% | `max-w-full` | Immersive (workspace, canvas) |

### Usage

```tsx
// Import from layout tokens
import { MAX_CONTENT_WIDTH } from '@hive/ui/design-system/layout-tokens';

// Or use Tailwind directly
<div className="mx-auto max-w-3xl px-6">
  {/* Default container */}
</div>
```

### Container Decisions

- **Narrow** — User has ONE thing to do. Minimizes eye travel.
- **Default** — Comfortable reading width. ~65-75 characters per line.
- **Wide** — Discovery mode. Grid layouts need horizontal space.
- **Full** — Canvas mode. Tool disappears, work fills screen.

---

## Layout Tokens

All values exported from `packages/ui/src/design-system/layout-tokens.ts`:

```tsx
import {
  HEADER_HEIGHT,        // 56px (h-14)
  SIDEBAR_WIDTH,        // 260px
  SIDEBAR_COLLAPSED_WIDTH, // 72px
  MOBILE_NAV_WIDTH,     // 280px
  MAX_CONTENT_WIDTH,    // 768px
  CONTENT_PADDING_X,    // 32px (px-8)
  CONTENT_PADDING_Y,    // 24px (py-6)
  SPACING,
  RADIUS,
  Z_INDEX,
} from '@hive/ui/design-system/layout-tokens';
```

---

## Spacing Scale

HIVE uses Tailwind's 4px base. Standard increments only.

| Token | Value | Tailwind | Use Case |
|-------|-------|----------|----------|
| `1` | 4px | `gap-1` | Micro spacing (icon-text) |
| `2` | 8px | `gap-2` | Tight groups |
| `3` | 12px | `gap-3` | Related items |
| `4` | 16px | `gap-4` | Standard gap |
| `6` | 24px | `gap-6` | Section spacing |
| `8` | 32px | `gap-8` | Major sections |
| `12` | 48px | `gap-12` | Page sections |
| `16` | 64px | `gap-16` | Generous breathing |

### Spacing Rules

1. **Never use arbitrary values** — `gap-[17px]` is wrong
2. **Vertical rhythm matters** — Consistent spacing creates hierarchy
3. **Generous > cramped** — When in doubt, use more space
4. **py-32 between sections** — Landing pages need room to breathe

---

## Border Radius Scale

Consistent rounding across all elements.

```tsx
RADIUS = {
  sm: 6,      // rounded     — inputs, small cards
  md: 8,      // rounded-lg  — buttons, badges
  lg: 12,     // rounded-xl  — cards, containers
  xl: 16,     // rounded-2xl — modals, large cards
  '2xl': 24,  // rounded-3xl — hero sections
  full: 9999, // rounded-full — avatars, pills
}
```

### Radius Decisions

- **sm (6px)** — Inputs, small interactive elements
- **md (8px)** — Buttons (standard)
- **lg (12px)** — Cards, containers
- **xl (16px)** — Modals, drawers
- **2xl (24px)** — Landing page hero cards
- **full** — Avatars, status dots, pills

---

## Z-Index Scale

Consistent layering prevents z-index wars.

```tsx
Z_INDEX = {
  base: 0,           // Default content
  dropdown: 10,      // Dropdowns, popovers
  sticky: 20,        // Sticky headers, filter bars
  fixed: 30,         // Fixed elements
  modalBackdrop: 40, // Modal backdrop blur
  modal: 50,         // Modal content
  popover: 60,       // Popovers above modals
  tooltip: 70,       // Tooltips (highest priority info)
  toast: 80,         // Toast notifications (always visible)
}
```

### Layering Rules

1. **Never use arbitrary z-index** — Use the scale
2. **Modals above everything** — But toasts above modals
3. **Sticky below dropdowns** — Menus should cover headers

---

## Breakpoints

HIVE uses 1024px as the primary breakpoint (per CLAUDE.md).

| Name | Width | Columns | Shell Behavior |
|------|-------|---------|----------------|
| `sm` | 640px | 1 | — |
| `md` | 768px | 2 | Bottom nav |
| `lg` | 1024px | 3-4 | Rail (48px) |
| `xl` | 1280px | 4+ | Full sidebar |

### Responsive Patterns

```tsx
// Mobile-first
<div className="px-4 md:px-6 lg:px-8">

// Grid columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Container width
<div className="max-w-full md:max-w-3xl lg:max-w-5xl mx-auto">
```

---

## Grid System

For discovery layouts (spaces, tools, browse).

### Basic Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id}>{/* ... */}</Card>
  ))}
</div>
```

### Netflix Rows

```tsx
<div className="space-y-8">
  <section>
    <h2 className="text-lg font-medium mb-4">Recommended for You</h2>
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      {items.map(item => (
        <Card key={item.id} className="flex-shrink-0 w-64 snap-start">
          {/* ... */}
        </Card>
      ))}
    </div>
  </section>
</div>
```

---

## Stack Pattern

Vertical rhythm for content flow.

```tsx
// Standard content stack
<div className="space-y-6">
  <section>{/* ... */}</section>
  <section>{/* ... */}</section>
</div>

// Tight stack (forms, lists)
<div className="space-y-4">
  <Input />
  <Input />
  <Button />
</div>

// Generous stack (landing sections)
<div className="space-y-16">
  <LandingSection />
  <LandingSection />
</div>
```

---

## Shell Layout

The authenticated frame. All pages inside Shell use this structure.

```
┌──────────────────────────────────────────────────────────┐
│                    STICKY HEADER (56px)                  │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  SIDEBAR   │              CONTENT AREA                   │
│  (260px)   │                                             │
│            │              ┌───────────────┐              │
│            │              │   CONTAINER   │              │
│            │              │  (max-width)  │              │
│            │              └───────────────┘              │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

### Shell Dimensions

```tsx
// Header
height: 56px         // HEADER_HEIGHT
z-index: 20          // sticky

// Sidebar
width: 260px         // expanded (SIDEBAR_WIDTH)
width: 72px          // collapsed (SIDEBAR_COLLAPSED_WIDTH)
width: 0px           // hidden (workspace)

// Content
padding-left: SIDEBAR_WIDTH
padding-top: HEADER_HEIGHT
```

---

## Page-Level Patterns

### Focus Page (Auth, Onboarding)

```tsx
<div className="min-h-screen flex items-center justify-center px-4">
  <div className="w-full max-w-md space-y-6">
    {/* Centered, narrow content */}
  </div>
</div>
```

### Stream Page (Feed, Chat)

```tsx
<div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
  {/* Vertically stacked content */}
</div>
```

### Grid Page (Browse, Explore)

```tsx
<div className="max-w-5xl mx-auto px-4 py-6">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards */}
  </div>
</div>
```

### Workspace Page (HiveLab)

```tsx
<div className="h-screen flex">
  <aside className="w-60 border-r">{/* Palette */}</aside>
  <main className="flex-1">{/* Canvas */}</main>
  <aside className="w-72 border-l">{/* Inspector */}</aside>
</div>
```

---

## Anti-Patterns

**Don't do this:**

```tsx
// ❌ Hardcoded values
<div className="max-w-[732px]">

// ❌ Inconsistent spacing
<div className="gap-[17px]">

// ❌ Arbitrary z-index
<div className="z-[9999]">

// ❌ Missing responsive
<div className="max-w-5xl">  // Always the same width
```

**Do this instead:**

```tsx
// ✓ Use standard widths
<div className="max-w-3xl">

// ✓ Use spacing scale
<div className="gap-4">

// ✓ Use z-index scale
<div className="z-50">  // modal level

// ✓ Responsive widths
<div className="max-w-full md:max-w-3xl lg:max-w-5xl">
```

---

## Reference

| Token File | Purpose |
|------------|---------|
| `packages/ui/src/design-system/layout-tokens.ts` | All layout constants |
| `packages/tokens/src/motion.ts` | Animation durations (related) |
| `tailwind.config.ts` | Extended theme values |

---

*Layout defines where things go. Spacing defines the rhythm. Both serve clarity.*
