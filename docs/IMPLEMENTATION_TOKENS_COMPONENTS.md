# HIVE Implementation: Tokens & Components

> Mapping existing system → new design direction

---

## Token Changes

### Colors: Current → New

**Current location:** `packages/tokens/src/design-system-v2.ts`, `colors.ts`, `colors-prd-aligned.ts`

| Token | Current Value | New Value | Notes |
|-------|---------------|-----------|-------|
| `background.primary` | `oklch(0.145 0 0)` / `#000000` | `#0C0C0E` | Warmer black |
| `background.secondary` | `oklch(0.185 0 0)` / `#171717` | `#141416` | Charcoal |
| `background.tertiary` | `oklch(0.225 0 0)` / `#262626` | `#1A1A1C` | Graphite |
| `background.interactive` | `oklch(0.265 0 0)` / `#404040` | `#242428` | Slate |
| `border.default` | `oklch(1 0 0 / 10%)` | `#2E2E33` | Steel |
| `text.primary` | `oklch(0.985 0 0)` / `#FFFFFF` | `#FAFAFA` | Slightly off-white |
| `text.secondary` | `oklch(0.855 0 0)` / `#D4D4D4` | `#A1A1A6` | Silver |
| `text.muted` | `oklch(0.665 0 0)` / `#A3A3A3` | `#71717A` | Mercury |
| `text.disabled` | `oklch(0.555 0 0)` / `#525252` | `#52525B` | Smoke |
| `gold` | `#FFD700` | `#FFD700` | **KEEP** |

**New tokens to add:**

```typescript
// Depth/elevation backgrounds
surface: {
  L0: '#0C0C0E',    // Page background
  L1: '#141416',    // Cards, elevated
  L2: '#1A1A1C',    // Hover states
  L3: '#242428',    // Active states
}

// Glow effects
glow: {
  gold: '0 0 20px rgba(255, 215, 0, 0.15)',
  goldStrong: '0 0 30px rgba(255, 215, 0, 0.25)',
}

// Blur
blur: {
  sm: '8px',
  md: '12px',
  lg: '16px',
}
```

---

### Typography: Current → New

**Current location:** `packages/tokens/src/typography.ts`, `design-system-v2.ts`

| Token | Current | New | Notes |
|-------|---------|-----|-------|
| `fontFamily.display` | `Space Grotesk` | `Space Grotesk` | **KEEP** |
| `fontFamily.sans` | `Geist Sans` | `Inter` | Change to Inter |
| `fontFamily.mono` | `JetBrains Mono` | `JetBrains Mono` | **KEEP** |

**New typography scale:**

```typescript
fontSize: {
  // Display (Space Grotesk)
  'display-hero': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.03em' }],    // 48px
  'display-xl': ['2.25rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }], // 36px
  'display-lg': ['1.75rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.02em' }],  // 28px
  'display-md': ['1.5rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.01em' }],  // 24px

  // Body (Inter)
  'body-lg': ['1.125rem', { lineHeight: '1.6' }],   // 18px
  'body-md': ['1rem', { lineHeight: '1.5' }],       // 16px
  'body-sm': ['0.875rem', { lineHeight: '1.5' }],   // 14px
  'body-xs': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }], // 12px

  // Mono (JetBrains Mono)
  'mono-md': ['0.875rem', { lineHeight: '1.5' }],   // 14px
  'mono-sm': ['0.75rem', { lineHeight: '1.4' }],    // 12px
}
```

---

### Shadows: Current → New

**Current location:** `packages/tokens/src/design-system-v2.ts`

| Token | Current | New |
|-------|---------|-----|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | `0 1px 2px rgba(0,0,0,0.3)` |
| `shadow-md` | Standard Tailwind | `0 4px 12px rgba(0,0,0,0.25)` |
| `shadow-lg` | Standard Tailwind | `0 8px 24px rgba(0,0,0,0.3)` |
| `shadow-xl` | Standard Tailwind | `0 12px 32px rgba(0,0,0,0.4)` |
| **NEW** `shadow-glow` | N/A | `0 0 20px rgba(255,215,0,0.15)` |

---

### Border Radius: Current → New

**Current location:** `packages/tokens/src/radius.ts`, `design-system-v2.ts`

| Token | Current | New | Usage |
|-------|---------|-----|-------|
| `radius-none` | `0` | `0` | Brutalist elements (rare) |
| `radius-sm` | `calc(var(--radius) - 4px)` | `4px` | Subtle rounding |
| `radius-md` | `calc(var(--radius) - 2px)` | `8px` | Standard cards |
| `radius-lg` | `var(--radius)` | `12px` | Buttons, inputs |
| `radius-xl` | `calc(var(--radius) + 4px)` | `16px` | Large cards, modals |
| `radius-full` | `9999px` | `9999px` | Pills, avatars |

**Update `--radius` base:** `10px` → `12px`

---

### Motion: Current → New

**Current location:** `packages/tokens/src/motion.ts`

Motion tokens are **mostly good**. Minor adjustments:

| Token | Current | New | Notes |
|-------|---------|-----|-------|
| `duration.instant` | `0.1s` | `0.075s` | Faster micro-feedback |
| `duration.snap` | `0.15s` | `0.15s` | **KEEP** |
| `duration.quick` | `0.2s` | `0.15s` | Slightly faster |
| `duration.smooth` | `0.25s` | `0.25s` | **KEEP** |
| `easing.default` | `cubic-bezier(0.23, 1, 0.32, 1)` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Standard smooth |
| `easing.snappy` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | `cubic-bezier(0.4, 0, 0.2, 1)` | Quick settle |

---

### Spacing: No Changes Needed

**Current location:** `packages/tokens/src/spacing.ts`

The 4px-based spacing scale is solid. **Keep as-is.**

---

## Component Mapping

### Existing Components to UPDATE

| Component | Location | Changes Needed |
|-----------|----------|----------------|
| **Button** | `atomic/00-Global/atoms/button.tsx` | Add glow on hover for primary, update colors |
| **Input** | `atomic/00-Global/atoms/input.tsx` | Add gold focus glow, update bg color |
| **Card** | `atomic/00-Global/atoms/card.tsx` | Add hover lift, update shadows |
| **HiveCard** | `atomic/00-Global/atoms/hive-card.tsx` | Update motion, add depth |
| **Avatar** | `atomic/00-Global/atoms/avatar.tsx` | Add online ring states (gold) |
| **Badge** | `atomic/00-Global/atoms/badge.tsx` | Update colors, add gold variant |
| **Dialog/Modal** | `atomic/00-Global/atoms/dialog.tsx` | Add backdrop blur, update animation |
| **Command** | `atomic/00-Global/atoms/command.tsx` | Restyle for new palette |
| **Sheet** | `atomic/00-Global/atoms/sheet.tsx` | Update backdrop blur |
| **Tabs** | `atomic/00-Global/atoms/tabs.tsx` | Gold active indicator |

---

### NEW Components to CREATE

#### 1. Hero Input (Chat Input)

**Location:** `atomic/00-Global/molecules/hero-input.tsx`

```typescript
interface HeroInputProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  actions?: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
  }[];
  slashCommands?: boolean;
  mentions?: boolean;
}
```

**Specs:**
- Min-height: 56px
- Background: `#141416`
- Border: `1px #2E2E33`
- Focus: gold glow `0 0 0 3px rgba(255,215,0,0.2)`
- Radius: `12px`
- Padding: `16px 20px`

---

#### 2. Dock

**Location:** `atomic/00-Global/organisms/dock.tsx`

```typescript
interface DockProps {
  spaces: {
    id: string;
    name: string;
    icon?: string;
    hasUnread: boolean;
    onlineCount?: number;
  }[];
  onSpaceClick: (id: string) => void;
  onAddClick: () => void;
  onCommandPalette: () => void;
}
```

**Specs:**
- Position: fixed bottom
- Height: 56px
- Background: `#0C0C0E` with blur
- Border-top: `1px #2E2E33`
- Items: 5-6 max + add + ⌘K
- Gold dot for unread

---

#### 3. Command Palette (Enhanced)

**Location:** `atomic/00-Global/organisms/command-palette.tsx`

Extends existing `Command` component with:
- Instant open (no animation delay on trigger)
- Live presence counts on spaces
- Recent spaces section
- Actions section with shortcuts
- Fuzzy search
- Keyboard navigation

---

#### 4. Context Panel

**Location:** `atomic/00-Global/organisms/context-panel.tsx`

```typescript
interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}
```

**Specs:**
- Position: fixed right
- Width: 320px
- Animation: slide in from right (250ms, spring)
- Background: `#141416`
- Backdrop: subtle blur on main content

---

#### 5. Board Tabs

**Location:** `atomic/03-Spaces/molecules/board-tabs.tsx`

```typescript
interface BoardTabsProps {
  boards: {
    id: string;
    name: string;
    isActive: boolean;
  }[];
  onBoardClick: (id: string) => void;
  onAddBoard: () => void;
}
```

**Specs:**
- Horizontal scroll if overflow
- Gold dot (●) for active
- `+` button to add
- Height: 44px

---

#### 6. Presence Indicator

**Location:** `atomic/00-Global/atoms/presence-indicator.tsx`

```typescript
interface PresenceIndicatorProps {
  status: 'online' | 'offline' | 'away';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}
```

**Specs:**
- Online: gold `#FFD700`, subtle pulse every 3s
- Offline: gray `#52525B`
- Away: gold outline, no fill

---

#### 7. Avatar Stack

**Location:** `atomic/00-Global/molecules/avatar-stack.tsx`

Already exists at `atomic/00-Global/molecules/avatar-stack.tsx`. Update with:
- Compress/overlap based on count
- Online indicators
- "+N more" badge

---

#### 8. Featured Tool Slot

**Location:** `atomic/03-Spaces/molecules/featured-tool-slot.tsx`

```typescript
interface FeaturedToolSlotProps {
  tool: {
    id: string;
    name: string;
    type: string;
    component: ReactNode;
  } | null;
  onRemove?: () => void;
}
```

**Specs:**
- Appears above conversation
- Full width
- Subtle border
- Removable by leader

---

### HiveLab-Specific Components

#### 9. Element Belt

**Location:** `atomic/05-HiveLab/molecules/element-belt.tsx`

```typescript
interface ElementBeltProps {
  elements: Element[];
  onElementDrag: (element: Element) => void;
  onMoreClick: () => void;
  highlightedElement?: string;
}
```

**Specs:**
- Horizontal bar at bottom
- 6-8 visible elements
- "More" expands full palette
- Drag to canvas

---

#### 10. Contextual Inspector

**Location:** `atomic/05-HiveLab/molecules/contextual-inspector.tsx`

```typescript
interface ContextualInspectorProps {
  element: CanvasElement | null;
  position: 'floating' | 'docked';
  onPropertyChange: (key: string, value: any) => void;
  onClose: () => void;
}
```

**Specs:**
- Floating for simple elements
- Auto-dock for complex elements
- Pin/unpin option

---

## CSS Variables Update

**Location:** `apps/web/src/app/globals.css`

```css
:root {
  /* Background */
  --hive-background-primary: #0C0C0E;
  --hive-background-secondary: #141416;
  --hive-background-tertiary: #1A1A1C;
  --hive-background-interactive: #242428;

  /* Text */
  --hive-text-primary: #FAFAFA;
  --hive-text-secondary: #A1A1A6;
  --hive-text-muted: #71717A;
  --hive-text-disabled: #52525B;

  /* Border */
  --hive-border-default: #2E2E33;
  --hive-border-hover: #3E3E43;
  --hive-border-focus: #FFD700;

  /* Brand */
  --hive-brand-primary: #FFD700;
  --hive-brand-glow: rgba(255, 215, 0, 0.15);

  /* Status */
  --hive-status-success: #00D46A;
  --hive-status-error: #FF3737;
  --hive-status-warning: #FFB800;

  /* Blur */
  --hive-blur-sm: 8px;
  --hive-blur-md: 12px;
  --hive-blur-lg: 16px;

  /* Radius */
  --hive-radius-sm: 4px;
  --hive-radius-md: 8px;
  --hive-radius-lg: 12px;
  --hive-radius-xl: 16px;
  --hive-radius-full: 9999px;

  /* Shadows */
  --hive-shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --hive-shadow-md: 0 4px 12px rgba(0,0,0,0.25);
  --hive-shadow-lg: 0 8px 24px rgba(0,0,0,0.3);
  --hive-shadow-xl: 0 12px 32px rgba(0,0,0,0.4);
  --hive-shadow-glow: 0 0 20px rgba(255,215,0,0.15);

  /* Motion */
  --hive-duration-instant: 75ms;
  --hive-duration-fast: 150ms;
  --hive-duration-smooth: 250ms;
  --hive-duration-dramatic: 400ms;
  --hive-easing-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --hive-easing-snappy: cubic-bezier(0.4, 0, 0.2, 1);
  --hive-easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Remove light mode - dark only */
/* .light { ... } - DELETE */
```

---

## Implementation Order

### Phase 1: Token Foundation
1. Update `packages/tokens/src/design-system-v2.ts` with new color values
2. Update `apps/web/src/app/globals.css` with new CSS variables
3. Remove light mode styles
4. Update typography font stack (Geist → Inter for body)

### Phase 2: Core Components
1. **Button** — Add gold glow, update variants
2. **Input** — Add gold focus glow
3. **Card** — Add hover lift, depth
4. **Avatar** — Add online states
5. **Badge** — Add gold variant
6. **Modal/Dialog** — Add backdrop blur

### Phase 3: Navigation Components
1. **Hero Input** — New component
2. **Dock** — New component
3. **Command Palette** — Enhance existing
4. **Context Panel** — New component
5. **Board Tabs** — New component

### Phase 4: Presence Components
1. **Presence Indicator** — New component
2. **Avatar Stack** — Update existing
3. **Typing Indicator** — Update existing

### Phase 5: HiveLab Components
1. **Element Belt** — New component
2. **Contextual Inspector** — New/refactor existing
3. **Canvas** — Add texture, physical feel

---

## File Changes Summary

| File | Action | Priority |
|------|--------|----------|
| `packages/tokens/src/design-system-v2.ts` | UPDATE | P0 |
| `apps/web/src/app/globals.css` | UPDATE | P0 |
| `packages/ui/src/atomic/00-Global/atoms/button.tsx` | UPDATE | P1 |
| `packages/ui/src/atomic/00-Global/atoms/input.tsx` | UPDATE | P1 |
| `packages/ui/src/atomic/00-Global/atoms/card.tsx` | UPDATE | P1 |
| `packages/ui/src/atomic/00-Global/atoms/avatar.tsx` | UPDATE | P1 |
| `packages/ui/src/atomic/00-Global/atoms/dialog.tsx` | UPDATE | P1 |
| `packages/ui/src/atomic/00-Global/molecules/hero-input.tsx` | CREATE | P1 |
| `packages/ui/src/atomic/00-Global/organisms/dock.tsx` | CREATE | P2 |
| `packages/ui/src/atomic/00-Global/organisms/command-palette.tsx` | CREATE | P2 |
| `packages/ui/src/atomic/00-Global/organisms/context-panel.tsx` | CREATE | P2 |
| `packages/ui/src/atomic/03-Spaces/molecules/board-tabs.tsx` | CREATE | P2 |
| `packages/ui/src/atomic/00-Global/atoms/presence-indicator.tsx` | CREATE | P2 |
| `packages/ui/src/atomic/05-HiveLab/molecules/element-belt.tsx` | CREATE | P3 |
| `packages/ui/src/atomic/05-HiveLab/molecules/contextual-inspector.tsx` | CREATE | P3 |

---

## Quick Reference: Token Values

```
BACKGROUNDS
#0C0C0E  — Page background (L0)
#141416  — Cards, inputs (L1)
#1A1A1C  — Hover states (L2)
#242428  — Active states (L3)

TEXT
#FAFAFA  — Primary
#A1A1A6  — Secondary
#71717A  — Muted
#52525B  — Disabled

BORDERS
#2E2E33  — Default
#3E3E43  — Hover

BRAND
#FFD700  — Gold (primary)
#CC9900  — Gold (muted)

STATUS
#00D46A  — Success
#FF3737  — Error
#FFB800  — Warning

RADIUS
4px   — sm
8px   — md
12px  — lg (buttons, inputs)
16px  — xl (modals)
full  — avatars, pills

SHADOWS
sm:   0 1px 2px rgba(0,0,0,0.3)
md:   0 4px 12px rgba(0,0,0,0.25)
lg:   0 8px 24px rgba(0,0,0,0.3)
glow: 0 0 20px rgba(255,215,0,0.15)

MOTION
instant: 75ms
fast:    150ms
smooth:  250ms
```
