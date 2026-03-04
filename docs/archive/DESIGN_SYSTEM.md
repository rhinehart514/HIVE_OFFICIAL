# HIVE Design System

Comprehensive reference for the HIVE design system. Dark-first, Apple/Vercel craft with HIVE warmth (gold). Neutral grays for 95% of the UI; gold reserved for key dopamine moments.

---

## Architecture

The design system flows through five layers:

```
tokens (TS values) --> CSS variables (tokens.css) --> Tailwind config --> primitives --> components
```

- **Tokens** (`packages/tokens/src/`) -- TypeScript source of truth for all visual values
- **CSS Variables** (`packages/ui/src/design-system/tokens.css`) -- Runtime custom properties consumed by components
- **Tailwind Config** (`packages/tokens/src/tailwind-config-unified.ts`) -- Token-backed Tailwind theme extension
- **Primitives** (`packages/ui/src/design-system/primitives/`) -- Low-level reusable building blocks
- **Components** (`packages/ui/src/design-system/components/`) -- Higher-level composed UI elements

---

## 1. Design Tokens

All tokens live in `packages/tokens/src/`. Import via `@hive/tokens`.

### 1.1 Colors (`colors-unified.ts`)

Three-tier architecture: Foundation --> Semantic --> Component.

#### Foundation (raw values)

| Token | Value | Purpose |
|-------|-------|---------|
| `foundation.black` | `#000000` | Pure black |
| `foundation.white` | `#FFFFFF` | Pure white |
| `foundation.gray.1000` | `#0A0A0A` | Page background |
| `foundation.gray.900` | `#141414` | Surface (cards, inputs) |
| `foundation.gray.800` | `#1A1A1A` | Elevated (hover states) |
| `foundation.gray.750` | `#242424` | Active (pressed states) |
| `foundation.gray.700` | `#2A2A2A` | Border default |
| `foundation.gray.600` | `#3A3A3A` | Border hover |
| `foundation.gray.500` | `#4A4A4A` | Border strong |
| `foundation.gray.400` | `#52525B` | Text disabled |
| `foundation.gray.350` | `#71717A` | Text placeholder |
| `foundation.gray.300` | `#818187` | Text subtle |
| `foundation.gray.200` | `#A1A1A6` | Text secondary |
| `foundation.gray.100` | `#D4D4D8` | Light text |
| `foundation.gray.50` | `#FAFAFA` | Text primary |
| `foundation.gold.500` | `#FFD700` | Canonical HIVE gold |
| `foundation.gold.hover` | `#E6C200` | Gold hover state |
| `foundation.gold.dim` | `#CC9900` | Dimmed/inactive gold |
| `foundation.gold.glow` | `rgba(255,215,0,0.15)` | Glow effect |
| `foundation.gold.border` | `rgba(255,215,0,0.3)` | Gold borders |
| `foundation.gold.subtle` | `rgba(255,215,0,0.1)` | Subtle gold backgrounds |

Status colors: `green.500` (#00D46A success), `yellow.500` (#FFB800 warning), `red.500` (#FF3737 error), `blue.500` (#0070F3 info). Each has a `.dim` variant at 15% opacity.

#### Semantic (purpose-based)

| Category | Tokens | Notes |
|----------|--------|-------|
| `semantic.background` | `base`, `surface`, `elevated`, `active`, `overlay` | Hierarchy: base (#0A0A0A) -> surface (#141414) -> elevated (#1A1A1A) -> active (#242424) |
| `semantic.text` | `primary`, `secondary`, `subtle`, `placeholder`, `disabled`, `inverse` | primary (#FAFAFA) -> secondary (#A1A1A6) -> subtle (#818187) |
| `semantic.brand` | `primary`, `hover`, `dim`, `glow`, `onGold` | Gold system |
| `semantic.interactive` | `hover`, `active`, `focus`, `focusRing`, `disabled` | White-based interaction states |
| `semantic.gold` | `primary`, `achievement`, `presence`, `featured`, `subtle`, `border`, `glow` | Reserved for dopamine moments |
| `semantic.status` | `success`, `successDim`, `warning`, `warningDim`, `error`, `errorDim`, `info`, `infoDim` | Functional feedback |
| `semantic.border` | `default`, `hover`, `strong`, `focus`, `subtle`, `medium`, `visible` | Border hierarchy |

#### Component (component-specific)

Pre-mapped tokens for specific components:

- **`components.button`** -- `default` (white/black), `primary` (gold), `secondary` (subtle bg), `outline`, `ghost`, `destructive`
- **`components.card`** -- `default`, `elevated`, `interactive`, `outline`
- **`components.input`** -- `default`, `error`, `success` (each with `bg`, `border`, `text`, `focus`)
- **`components.badge`** -- `default`, `gold`, `success`, `warning`, `error`, `outline`
- **`components.avatar`** -- `border` (gold), `fallback` (elevated bg)
- **`components.toast`** -- `default`, `success`, `warning`, `error`
- **`components.overlay`** -- `modal`, `popover`, `dropdown`, `commandPalette`
- **`components.presence`** -- `online` (success), `away` (warning), `busy` (error), `offline` (disabled)

#### Gold Usage Rules

**Allowed:**
- Primary CTA buttons (Join Space, Create Tool) -- sparingly
- Achievement moments (Ritual complete, level up)
- Online presence (147 students online)
- Featured content badges (Hot Space, Featured Tool)
- Text selection highlight

**Forbidden:**
- Focus rings (use white)
- Secondary buttons
- Decorative elements
- Background colors (except subtle tints)
- Navigation items

### 1.2 Typography (`typography.ts`)

Font pairing: **Clash Display** (headlines), **Geist** (body), **Geist Mono** (code/stats).

```typescript
typography.fontFamily.display  // ['Clash Display', 'SF Pro Display', 'system-ui', 'sans-serif']
typography.fontFamily.body     // ['Geist', 'SF Pro Text', 'system-ui', 'sans-serif']
typography.fontFamily.mono     // ['Geist Mono', 'SF Mono', 'ui-monospace', 'monospace']
```

**Display Scale** (Clash Display, hero/marketing):

| Token | Size | Usage |
|-------|------|-------|
| `display-2xl` | 40px | Hero headlines |
| `display-xl` | 36px | Large headlines |
| `display-lg` | 32px | Section headlines |
| `display-md` | 28px | Page titles |
| `display-sm` | 24px | Subsection titles |

**Heading Scale** (Geist):

| Token | Size | Usage |
|-------|------|-------|
| `heading-xl` | 20px | Main headings |
| `heading-lg` | 18px | Section headings |
| `heading-md` | 16px | Subsection headings |
| `heading-sm` | 14px | Small headings |

**Body Scale** (Geist):

| Token | Size | Usage |
|-------|------|-------|
| `body-lg` | 16px | Large body |
| `body-chat` | 15px | Chat messages |
| `body-md` | 14px | Standard body |
| `body-sm` | 12px | Small body |
| `body-meta` | 11px | Metadata, timestamps |
| `body-xs` | 10px | Labels, badges |

**Weights:** light (300), normal (400), medium (500), semibold (600), bold (700), extrabold (800), black (900)

**Letter Spacing:** `caps` (0.18em) for uppercase labels, `caps-wide` (0.24em) for section headers, `caps-wider` (0.32em) for hero labels. Negative tracking: `tightest` (-0.04em) for headlines.

### 1.3 Spacing (`spacing.ts`)

4px base unit. Full scale from `0` to `96` (384px).

| Token | Value | Pixels |
|-------|-------|--------|
| `1` | 0.25rem | 4px |
| `2` | 0.5rem | 8px |
| `3` | 0.75rem | 12px |
| `4` | 1rem | 16px |
| `6` | 1.5rem | 24px |
| `8` | 2rem | 32px |
| `12` | 3rem | 48px |
| `16` | 4rem | 64px |

**Layout Sizes:**

| Token | Value | Purpose |
|-------|-------|---------|
| `height.header` | 64px | App header |
| `height.button` | 40px | Standard button |
| `height.input` | 40px | Standard input |
| `height.avatar` | 40px | Standard avatar |
| `width.sidebar` | 256px | Sidebar |
| `width.content-max` | 1152px | Max content width |
| `width.modal` | 512px | Standard modal |

### 1.4 Border Radius (`radius.ts`)

Heavy radius design. Everything is rounded.

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | No radius |
| `sm` | 8px | Small elements |
| `md` | 12px | Standard elements |
| `lg` | 16px | Cards, buttons |
| `xl` | 24px | Large cards |
| `2xl` | 32px | Hero elements |
| `full` | 9999px | Circles, pills |

**Semantic radius** maps components to foundation values:
- `button`, `input`: 16px (lg)
- `badge`, `chip`: 9999px (full/pill)
- `card`, `modal`: 32px (2xl)
- `popover`, `toast`, `alert`: 24px (xl)
- `avatar`: full (circular), `avatarSquare`: 16px (lg)

### 1.5 Motion (`motion.ts`)

Three tiers: Micro (150-200ms), Standard (300-400ms), Cinematic (500-800ms).

**Signature motions:**
- **Reveal**: Fade + slide up (y: 20px -> 0)
- **Surface**: Scale from 0.95 + fade
- **Blur transition**: Filter blur for screen changes
- **Stagger**: 50-80ms between list items

#### Duration (milliseconds)

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 50ms | Micro feedback |
| `micro` | 100ms | State changes |
| `snap` | 150ms | Toggles |
| `quick` | 200ms | Hover effects |
| `standard` | 300ms | Most animations (default) |
| `smooth` | 400ms | Modals |
| `flowing` | 500ms | Page transitions |
| `gentle` | 600ms | Word reveals |
| `dramatic` | 700ms | Celebrations only |
| `hero` | 1200ms | Hero entrances |

#### Easing Curves

| Name | Value | Usage |
|------|-------|-------|
| `default` / `silk` | `cubic-bezier(0.23, 1, 0.32, 1)` | 90% of animations |
| `snap` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Toggles, instant feedback |
| `dramatic` | `cubic-bezier(0.165, 0.84, 0.44, 1)` | Achievements, celebrations |
| `out` | `cubic-bezier(0, 0, 0.2, 1)` | Entrances |
| `in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits |

#### Spring Presets (Framer Motion)

| Name | Stiffness | Damping | Usage |
|------|-----------|---------|-------|
| `snappy` | 400 | 30 | Buttons, toggles |
| `default` | 200 | 25 | General purpose |
| `gentle` | 100 | 20 | Modals, sheets |
| `bouncy` | 300 | 15 | Celebrations |
| `snapNav` | 500 | 25 (mass: 0.5) | Navigation motion |

#### Pre-built Framer Motion Variants

| Export | Purpose |
|--------|---------|
| `buttonPressVariants` | rest/hover/tap for buttons |
| `cardHoverVariants` | rest/hover for cards (lift + shadow) |
| `messageEntryVariants` | initial/animate/exit for chat messages |
| `successVariants` | Scale bounce for success moments |
| `errorShakeVariants` | Horizontal shake for errors |
| `pageTransitionVariants` | Fade + shift for page transitions |
| `modalVariants` | Overlay + content variants |
| `dropdownVariants` | Container + staggered items |
| `revealVariants` | Fade + slide up (signature) |
| `surfaceVariants` | Scale from 0.95 (signature) |
| `reducedMotionVariants` | Accessible fallbacks |

#### Stagger Presets

| Name | Value | Usage |
|------|-------|-------|
| `fast` | 30ms | Fast lists |
| `word` | 30ms | Word-by-word reveals |
| `default` | 50ms | Standard stagger |
| `section` | 80ms | Section stagger |
| `slow` | 100ms | Dramatic reveals |

### 1.6 Effects (`effects.ts`)

**Box Shadows** (dark theme, layered):

| Token | Usage |
|-------|-------|
| `level1` | Subtle elevation |
| `level2` | Cards (default) |
| `level3` | Moderate elevation |
| `level4` | High elevation |
| `level5` | Maximum elevation (modals) |
| `goldGlow` | Gold glow (`0 0 20px rgba(255,215,0,0.3)`) |
| `goldGlowStrong` | Strong gold glow |
| `ring` | Focus ring |
| `ringOffset` | Focus ring with offset |

**Backdrop Blur:** `sm` (4px), `DEFAULT` (8px), `md` (12px), `lg` (16px), `xl` (24px), `2xl` (40px), `3xl` (64px)

### 1.7 Tailwind Config (`tailwind-config-unified.ts`)

Exports `hiveTailwindConfig` to extend Tailwind's theme. All token categories are mapped:

```typescript
import { hiveTailwindConfig } from '@hive/tokens/tailwind-config-unified';

export default {
  theme: { extend: hiveTailwindConfig }
};
```

Or use the utility:

```typescript
import { extendTailwindConfig } from '@hive/tokens/tailwind-config-unified';

export default extendTailwindConfig({
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
});
```

Color classes reference CSS variables for runtime theming:
- `bg-background-primary` -> `var(--hive-background-primary)`
- `text-text-secondary` -> `var(--hive-text-secondary)`
- `border-border-DEFAULT` -> `var(--hive-border-default)`
- `text-brand-primary` -> `var(--hive-brand-primary)`

Component-specific classes:
- `bg-button-primary-bg`, `text-button-primary-text`
- `bg-card-default-bg`, `border-card-default-border`
- `bg-badge-gold-bg`, `bg-badge-success-bg`

### 1.8 Barrel Exports (`index.ts`)

The barrel file re-exports everything from all token modules. Key exports:

- **Colors**: `foundation`, `semantic`, `components`, `legacy`
- **Monochrome system**: `MONOCHROME`, `monochromeValues`, `warmthSpectrum`, `presenceStates`
- **Layout**: `MAX_WIDTHS`, `BREAKPOINTS`, `TOUCH_TARGETS`, `SPACING`, `SHELLS`, `HEIGHTS`, `CHAT_SPACING`
- **Patterns**: `GLASS`, `CARD`, `INPUT`, `BUTTON`, `BADGE`, `FOCUS`, `MOTION_TIERS`, `ELEVATION`, `EMPTY_STATE`, `LOADING`, `MODAL`, `TOAST`
- **Motion**: All variants, springs, staggers, signature transitions
- **Tailwind**: `hiveTailwindConfig`, `extendTailwindConfig`
- **IDE tokens**: `IDE_TOKENS` (HiveLab-specific design tokens)
- **Space tokens**: `SPACE_LAYOUT`, `SPACE_COLORS`, `SPACE_MOTION`, `SPACE_COMPONENTS`
- **Slot kit**: `slotKit` (cognitive budget management)

---

## 2. CSS Variables (`tokens.css`)

Located at `packages/ui/src/design-system/tokens.css`. All variables are defined in `:root` (dark-first, no light theme toggle).

### Naming Convention

```
--{category}-{property}        # Core tokens
--color-{category}-{property}  # Alias layer for primitives
--hive-{category}-{property}   # Alias layer for Tailwind
```

### Part 1: Typography Variables

```css
--font-display    /* Clash Display stack */
--font-body       /* Geist stack */
--font-mono       /* Geist Mono stack */
--text-xs through --text-hero   /* 11px to 72px */
--font-regular through --font-bold  /* 400 to 700 */
--leading-none through --leading-relaxed  /* 1 to 1.75 */
--tracking-tighter through --tracking-wider  /* -0.03em to 0.05em */
```

### Part 2: Color Variables

**Backgrounds** (warm dark tones):
```css
--bg-void: #050504           /* Deepest background */
--bg-ground: #0A0A09         /* Page background (default) */
--bg-surface: #141312        /* Cards, containers */
--bg-surface-hover: #1A1917  /* Hovered surfaces */
--bg-surface-active: #252521 /* Active/pressed */
--bg-elevated: #1E1D1B       /* Modals, dropdowns */
--bg-subtle: rgba(255,255,255,0.03)
--bg-muted: rgba(255,255,255,0.06)
--bg-emphasis: rgba(255,255,255,0.10)
```

**Text** (slightly warm whites):
```css
--text-primary: #FAF9F7    /* 95% visible */
--text-secondary: #A3A19E  /* 65% visible */
--text-tertiary: #6B6B70   /* 40% visible */
--text-muted: #3D3D42      /* 25% visible */
--text-ghost: #2A2A2E      /* 15% visible */
--text-inverse: #0A0A09    /* For light surfaces */
```

**Gold / Life Colors** (1-2% budget):
```css
--life-gold: #FFD700
--life-gold-hover: #FFDF33
--life-gold-active: #E5C200
--life-pulse: rgba(255,215,0,0.60)
--life-glow: rgba(255,215,0,0.15)
--life-subtle: rgba(255,215,0,0.08)
```

**Interactive States:**
```css
--interactive-default: rgba(255,255,255,0.06)
--interactive-hover: rgba(255,255,255,0.10)
--interactive-active: rgba(255,255,255,0.15)
--focus-ring: rgba(255,255,255,0.50)  /* White, never gold */
```

**Borders:**
```css
--border-subtle: rgba(255,255,255,0.06)
--border-default: rgba(255,255,255,0.10)
--border-emphasis: rgba(255,255,255,0.15)
```

### Part 3: Opacity Scale

```css
--opacity-ghost: 0.04
--opacity-subtle: 0.06
--opacity-muted: 0.08
--opacity-soft: 0.10
--opacity-medium: 0.12
--opacity-visible: 0.15
--opacity-strong: 0.20
--opacity-prominent: 0.30
--opacity-dominant: 0.50
```

### Part 4: Motion Variables

```css
--duration-snap: 100ms
--duration-quick: 200ms
--duration-smooth: 300ms      /* Default */
--duration-gentle: 400ms
--duration-dramatic: 700ms    /* Achievements only */
--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1)  /* Default */
--ease-out: cubic-bezier(0, 0, 0.2, 1)
```

### Part 5: Depth, Shadows, Blur

```css
--z-base: 0    --z-raised: 10    --z-dropdown: 20    --z-sticky: 30
--z-modal: 40  --z-overlay: 50   --z-toast: 60       --z-tooltip: 70

--shadow-sm through --shadow-xl
--shadow-glow-sm through --shadow-glow-lg  /* Gold glow */
--blur-glass: 8px  /* Standard glass */
--blur-heavy: 16px  /* Strong separation */
```

### Part 6: Atmosphere

Ambient glow gradients, grain texture, warmth system (edge-based via box-shadow inset):
```css
--warmth-none: none
--warmth-low: inset 0 0 0 1px rgba(255,215,0,0.04)
--warmth-medium: inset 0 0 0 1px rgba(255,215,0,0.08)
--warmth-high: inset 0 0 0 1px rgba(255,215,0,0.12)
```

### Alias Layers

The CSS file provides two alias layers bridging core tokens to consumers:

- **`--color-*`** aliases for primitives (e.g., `--color-bg-surface`, `--color-text-primary`, `--color-gold`)
- **`--hive-*`** aliases for Tailwind (e.g., `--hive-background-primary`, `--hive-text-secondary`, `--hive-brand-primary`)

### Composite Tokens

Pre-built CSS transition shorthand:
```css
--transition-colors: color 200ms ease-smooth, background-color 200ms ease-smooth, border-color 200ms ease-smooth
--transition-transform: transform 300ms ease-smooth
--focus-ring-style: 0 0 0 2px var(--focus-ring-offset), 0 0 0 4px var(--focus-ring)
--glass-bg: rgba(20,19,18,0.80)
```

### HiveLab / Workshop Tokens

Separate token set for HiveLab (IDE mode) -- flat, no glass, VS Code energy:
```css
--hivelab-bg: #0A0A0A
--hivelab-surface: #141414
--hivelab-panel: #1A1A1A
--workshop-duration: 150ms
--workshop-ease: cubic-bezier(0.22, 1, 0.36, 1)
```

### Keyframe Animations

Defined in `tokens.css`: `breathe`, `pulse`, `drift`, `shimmer`, `fade-in`, `fade-in-up`, `scale-in`. Utility classes: `.animate-breathe`, `.animate-fade-in`, `.animate-scale-in`, etc.

### Workshop Utility Classes

Pre-built CSS classes for HiveLab surfaces: `.workshop`, `.workshop-panel`, `.workshop-surface`, `.workshop-canvas`, `.workshop-btn`, `.workshop-input`, `.workshop-card`, `.workshop-grid`.

---

## 3. Primitives

Located at `packages/ui/src/design-system/primitives/`. Low-level building blocks. Most use CVA (class-variance-authority) for variants and Framer Motion for animation.

### 3.1 Motion Primitives (`primitives/motion/`)

The motion subsystem provides animation building blocks built on Framer Motion.

#### Core Motion (`motion/index.tsx`)

**Hooks:**
- `useMouse()` -- Returns `{ x, y }` of global mouse position
- `useScrollProgress(offset?)` -- Returns `{ ref, scrollYProgress }` for scroll tracking

**Components:**

| Component | Props | Purpose |
|-----------|-------|---------|
| `Tilt` | `intensity?`, `stiffness?`, `damping?` | 3D tilt effect on hover -- cards rotate toward mouse |
| `Magnetic` | `strength?`, `stiffness?`, `damping?` | Element follows cursor when nearby |
| `TextReveal` | `text`, `delay?`, `charDuration?`, `stagger?` | Character-by-character text animation |
| `FadeUp` | `delay?`, `duration?`, `offset?` | Fade + slide up on viewport entry (once) |
| `Stagger` | `staggerDelay?` | Container that staggers children animations |
| `Parallax` | `speed?` | Parallax scroll effect |
| `CursorGlow` | `color?`, `size?`, `opacity?` | Cursor-following glow effect |
| `NoiseOverlay` | `opacity?` | Grain texture overlay |

#### Reveal Primitives (`motion/Reveal.tsx`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `RevealSection` | `margin?`, `duration?`, `ease?`, `delay?`, `as?` | Section that fades in on scroll. Standard pattern for page sections. |
| `NarrativeReveal` | `children` (string), `stagger?`, `duration?`, `ease?` | Word-by-word text reveal on scroll. Controls reading rhythm. |
| `AnimatedBorder` | `variant?` ('horizontal'\|'container'), `duration?`, `delay?` | Border that draws itself in. Horizontal = section divider, Container = 4-sided reveal. |

#### Glass Primitives (`motion/Glass.tsx`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `GlassSurface` | `intensity?` ('subtle'\|'standard'\|'heavy'\|'atmosphere'), `backgroundOpacity?`, `border?`, `interactive?`, `animate?`, `as?` | Primary surface primitive. Blur: subtle=4px, standard=8px, heavy=16px, atmosphere=40px |
| `GlassPanel` | Same as GlassSurface + `inset?`, `warmth?` | Panel with optional inset shadow and gold warmth edge |
| `GlassOverlay` | `visible`, `onClose?`, `intensity?`, `darkness?` | Full-screen overlay for modals. Handles backdrop blur and click-outside. |
| `GlassPill` | `size?` ('sm'\|'md'\|'lg'), `active?`, `onClick?` | Pill-shaped glass button for tabs, tags, filters |
| `FrostedEdge` | `position?` ('top'\|'bottom'\|'left'\|'right'), `size?` | Gradient fade at scroll container edges |

#### WordReveal (`motion/WordReveal.tsx`)

```typescript
interface WordRevealProps {
  text: string;
  delay?: number;
  stagger?: number;       // Default: MOTION.stagger.words (0.03s)
  duration?: number;      // Default: MOTION.duration.fast
  variant?: 'default' | 'gold' | 'muted';
  onComplete?: () => void;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}
```

Word-by-word text animation for peak moments. Respects `prefers-reduced-motion`.

#### ThresholdReveal (`motion/ThresholdReveal.tsx`)

```typescript
interface ThresholdRevealProps {
  children: ReactNode;
  isReady?: boolean;
  preparingMessage?: string;   // Default: 'Preparing...'
  pauseDuration?: number;      // Default: 600ms
  onPreparing?: () => void;
  onReveal?: () => void;
}
```

Dramatic pause -> reveal pattern. Phases: idle -> preparing (pulsing indicator) -> revealing (fade + slide up) -> complete.

#### ArrivalTransition (`motion/ArrivalTransition.tsx`)

```typescript
interface ArrivalTransitionProps {
  children: ReactNode;
  skipAnimation?: boolean;
  onArrivalComplete?: () => void;
}

interface ArrivalZoneProps {
  children: ReactNode;
  zone: 'header' | 'sidebar' | 'content' | 'item';
  index?: number;  // For staggered items
}
```

Space entry animation. Sequence: header fades (0s) -> sidebar slides (0.2s) -> content fades (0.3s) -> items stagger (0.4s+).

#### Border Glow Primitives (`motion/BorderGlow.tsx`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `GlowBorder` | `variant?` ('gold'\|'white'\|'success'\|'error'), `intensity?`, `spread?`, `mode?` ('always'\|'hover'\|'focus') | Static or hover-triggered glow border |
| `PulseBorder` | `color?`, `duration?`, `active?` | Pulsing glow border for live indicators |
| `TrailBorder` | `color?`, `duration?`, `active?`, `borderWidth?` | Rotating conic gradient light around border perimeter |
| `BreatheBorder` | `color?` ('gold'\|'white'\|'warm'), `duration?`, `active?` | Subtle breathing border opacity for ambient life |
| `CursorTrailBorder` | `color?`, `glowSize?` | Border glow that follows cursor position |

#### Gradient Primitives (`motion/Gradient.tsx`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `GradientBackground` | `variant?` ('void'\|'gold-glow'\|'warm'\|'soft'\|'custom'), `animated?`, `followCursor?`, `opacity?` | Atmosphere background gradient |
| `GradientText` | `variant?` ('gold'\|'silver'\|'warm'\|'custom'), `animated?`, `as?` | Text with gradient fill. Gold sparingly (1-2% budget). |
| `GradientOrb` | `color?`, `size?`, `opacity?`, `position?`, `animated?` | Floating gradient orb for ambient background depth |

#### Scroll Primitives (`motion/Scroll.tsx` and `motion/ScrollTransform.tsx`)

From `Scroll.tsx`: `ParallaxText`, `ScrollIndicator`, `HeroParallax`, `ScrollProgress`, `ScrollSpacer`

From `ScrollTransform.tsx`: `ScrollTransform`, `ScrollFade`, `ScrollSticky`, `ScrollCounter`, `ScrollProgressBar`, `useScrollTransform`

### 3.2 Base Primitives

#### Text (`primitives/Text.tsx`)

Body text using Geist font. Uses CVA.

```typescript
interface TextProps {
  size?: 'default' | 'sm' | 'xs' | 'lg';     // 16px, 14px, 13px, 18px
  tone?: 'primary' | 'secondary' | 'muted' | 'subtle' | 'inverse' | 'error' | 'success';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  truncate?: boolean;
  as?: 'p' | 'span' | 'div' | 'label';
}
```

#### Heading (`primitives/Heading.tsx`)

Section headers. Clash Display for h1-h2, Geist for h3-h6. Uses CVA.

```typescript
interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
}
```

| Level | Font | Size | Weight |
|-------|------|------|--------|
| 1 | Clash Display | 36px | semibold |
| 2 | Clash Display | 28px | semibold |
| 3 | Geist | 22px | semibold |
| 4 | Geist | 18px | semibold |
| 5 | Geist | 16px | semibold |
| 6 | Geist | 14px | semibold |

#### Avatar (`primitives/Avatar.tsx`)

**Uses Radix UI** (`@radix-ui/react-avatar`). LOCKED design: always `rounded-lg` (8px), never circles. Rounded squares differentiate HIVE.

```typescript
interface SimpleAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl';  // 24-80px
  status?: 'online' | 'away' | 'offline' | 'dnd';
  onClick?: () => void;
}
```

Sizes: xs=24px, sm=32px, default=40px, lg=48px, xl=64px, 2xl=80px. Fallback has glass gradient style. Status uses ring indicator (not corner dot).

#### Other Base Primitives

| Primitive | Purpose | Key Props |
|-----------|---------|-----------|
| `DisplayText` | Large display/hero text (Clash Display) | `size`, `weight`, `gradient?` |
| `Mono` | Monospace text for stats/code | `size`, `tone` |
| `Label` | Form labels | `htmlFor`, `required` |
| `Link` | Styled navigation link | `href`, `variant` |
| `Icon` | Icon wrapper with sizing | `size`, `color` |
| `Tag` | Tag/chip element | `variant`, `removable` |
| `Separator` | Visual divider line | `orientation` |
| `Tooltip` | Tooltip popup | `content`, `side` |
| `Switch` | Toggle switch | `checked`, `onCheckedChange` |
| `Radio` | Radio button group | `value`, `options` |
| `Toggle` | Toggle button | `pressed`, `onPressedChange` |
| `Progress` | Progress bar | `value`, `max`, `variant` |
| `Tabs` | Tab container | `value`, `onValueChange`, `items` |
| `Toast` / `use-toast` | Toast notifications | `title`, `description`, `variant` |
| `Checkbox` | Checkbox input | `checked`, `onCheckedChange` |
| `SelectionCard` | Selectable card | `selected`, `onSelect` |
| `EmailInput` | Email input with validation | `value`, `onChange`, `domain?` |
| `HandleInput` | @handle input | `value`, `onChange`, `isAvailable?` |

#### Presence & Activity Primitives

| Primitive | Purpose |
|-----------|---------|
| `LiveIndicator` | Pulsing gold dot for live status |
| `LiveCounter` | Animated number counter (e.g., "147 online") |
| `PresenceDot` | Colored presence indicator (online/away/busy/offline) |
| `ActivityBar` | Activity level bar visualization |
| `ActivityHeartbeat` | Heartbeat animation for active spaces |
| `ActivityEdge` | Edge glow for activity indication |
| `WarmthDots` | Warmth spectrum dot indicators |
| `FriendStack` | Overlapping avatar stack |
| `AvatarGroup` | Multiple avatars in a group |
| `ConnectionStrengthIndicator` | Visual connection strength |

#### HiveLab-Specific Primitives

| Primitive | Purpose |
|-----------|---------|
| `CanvasArea` | Drawing/building canvas area |
| `HandleDot` | Connection handle dot for node editor |
| `PropertyField` | Property editor field |
| `DeploymentTarget` | Deploy target indicator |
| `ElementGroup` | Grouped elements |
| `TemplateScroller` | Template horizontal scroller |
| `CategoryScroller` | Category filter scroller |

#### Navigation Primitives

| Primitive | Purpose |
|-----------|---------|
| `BottomNav` | Mobile bottom navigation |
| `SpaceModeNav` | Space mode navigation tabs |
| `ProfileCompletionNudge` | Profile completion prompt |

### 3.3 Layout Primitives (`primitives/layout/`)

| Primitive | Props | Purpose |
|-----------|-------|---------|
| `Section` | `gap?`, `bg?`, `padded?` | Page section with optional background |
| `Container` | `size?` ('sm'\|'md'\|'lg'\|'xl'\|'2xl'\|'full'), `center?`, `px?` | Max-width container. Default: lg, centered, px-6/md:px-8 |
| `Stack` | `gap?` ('none'\|'xs'\|'sm'\|'md'\|'lg'\|'xl'\|'2xl'\|'3xl'), `align?`, `justify?` | Vertical flex container. Default: gap-md |
| `Cluster` | `gap?`, `align?`, `justify?`, `wrap?` | Horizontal flex (row) container |
| `Grid` | `cols?`, `gap?`, `responsive?` | CSS grid container |
| `Spacer` | `size?` | Fixed-size spacer element |
| `LandingSection` | `id?`, `bg?` | Landing page section variant |

### 3.4 Landing Primitives (`primitives/landing/`)

| Primitive | Purpose |
|-----------|---------|
| `LandingNav` | Landing page navigation bar |
| `Hero` | Hero section with variants (CVA) |
| `Feature` | Feature showcase card (CVA) |
| `Footer` | Landing page footer |
| `SpacePreviewCard` | Space preview for landing (CVA) |
| `LandingWindow` | Window chrome for screenshots/demos |

### 3.5 Feedback Primitives (`primitives/feedback/`)

| Primitive | Purpose |
|-----------|---------|
| `EmptyCanvas` | Empty state for HiveLab canvas |

### 3.6 Input Primitives (`primitives/input/`)

| Primitive | Purpose |
|-----------|---------|
| `useDramaticHandleCheck` | Hook for animated handle availability checking |

---

## 4. Components

Located at `packages/ui/src/design-system/components/`. Higher-level composed UI elements. Many wrap Radix UI primitives.

### 4.1 Overlay Components

#### Sheet (`Sheet.tsx`)

**Uses Radix UI** (`@radix-ui/react-dialog`). Slide-out panel from screen edge.

Exports: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`

```typescript
interface SheetContentProps {
  side?: 'right' | 'left' | 'bottom' | 'top';  // Default: right
  showClose?: boolean;     // Default: true
  closeAriaLabel?: string;
}
```

Decisions: 60% black overlay, Apple Glass Dark panel, 300ms slide animation, white focus ring.

#### Drawer (`Drawer.tsx`)

**Uses Radix UI** (`@radix-ui/react-dialog`). Slide-out drawer with size variants.

Exports: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerBody`, `DrawerFooter`, `DrawerClose`

```typescript
interface DrawerContentProps {
  side?: 'right' | 'left' | 'bottom' | 'top';
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';  // 320px to 100%
  showClose?: boolean;
  showHandle?: boolean;  // Pill handle for bottom drawer
}
```

#### Popover (`Popover.tsx`)

**Uses Radix UI** (`@radix-ui/react-popover`, `@radix-ui/react-hover-card`).

Exports: `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`, `PopoverBody`, `PopoverFooter`, `PopoverCard`, `HoverCard`, `HoverCardTrigger`, `HoverCardContent`

Animation: scale + fade (0.96 -> 1, 150ms). Apple Glass Dark surface. No arrow by default.

#### ConfirmDialog

Modal confirmation dialog with destructive action support.

### 4.2 Data Display

#### Accordion (`Accordion.tsx`)

**Uses Radix UI** (`@radix-ui/react-accordion`). CVA variants.

Exports: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, `SimpleAccordion`

```typescript
type AccordionProps = {
  variant?: 'default' | 'bordered' | 'ghost';
};

interface SimpleAccordionProps {
  items: SimpleAccordionItem[];
  multiple?: boolean;
  variant?: 'default' | 'bordered' | 'ghost';
}
```

Decisions: Glass highlight hover (bg-white/[0.08]), 200ms chevron rotation, white focus ring.

#### Command (`Command.tsx`)

**Uses Radix UI** (`@radix-ui/react-dialog`) + **cmdk**. Command palette / search.

Exports: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`

#### Alert (`Alert.tsx`)

Static notification boxes. CVA variants.

Exports: `Alert`, `AlertTitle`, `AlertDescription`, `InlineAlert`

```typescript
interface AlertProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gold';
  accent?: boolean;       // Left accent border
  title?: string;
  icon?: ReactNode;
  onClose?: () => void;   // Dismissible
  action?: ReactNode;     // Action button
}
```

Gold variant reserved for achievements/special moments.

#### ErrorState (`ErrorState.tsx`)

Error display with retry support. CVA variants.

```typescript
interface ErrorStateProps {
  variant?: 'full' | 'inline' | 'toast';
  severity?: 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  details?: string;      // Collapsible technical details
  code?: string | number;
  onRetry?: () => void;
  onDismiss?: () => void;  // Toast variant
}
```

Includes `ErrorStatePresets` for common errors (networkError, serverError, notFound, unauthorized, timeout, validationError).

#### Other Data Display

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `PostCard` | Feed post card | `post`, `onLike`, `onComment` |
| `StatCard` | Statistics display card | `label`, `value`, `trend` |
| `Pagination` | Page navigation | `page`, `totalPages`, `onPageChange` |
| `DataTable` | Data table | `columns`, `data`, `sortable` |
| `Slot` | Cognitive budget slot | `surface`, `maxItems` |
| `PresenceIndicator` | Online presence | `status`, `count` |

### 4.3 Form Components

#### FormField (`FormField.tsx`)

Wrapper for form inputs with label, description, error, and character counter.

```typescript
interface FormFieldProps {
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  showCounter?: boolean;
  charCount?: number;
  maxLength?: number;
  disabled?: boolean;
  htmlFor?: string;
  children: ReactNode;  // The form control
}
```

Also exports `FormFieldGroup` (group multiple fields) and `FormSection` (major form section with heading).

#### Other Form Components

| Component | Purpose | Radix UI |
|-----------|---------|----------|
| `TagInput` | Multi-tag input | No |
| `DatePicker` | Date selection | No |
| `Slider` | Range slider | Yes (`@radix-ui/react-slider`) |
| `Combobox` | Searchable select | Yes (cmdk-based) |
| `ToggleGroup` | Grouped toggle buttons | Yes (`@radix-ui/react-toggle-group`) |
| `ChatComposer` | Chat message input | No |
| `ImageUploader` | Image upload with preview | No |
| `NumberInput` | Numeric input with stepper | No |

### 4.4 Navigation

| Component | Purpose |
|-----------|---------|
| `TabNav` | Horizontal tab navigation |
| `TopBar` | App top bar |
| `SpaceSwitcher` | Space selection switcher |
| `Stepper` | Multi-step wizard stepper |
| `ScrollArea` | Custom scrollbar area (Radix `@radix-ui/react-scroll-area`) |

### 4.5 Feedback

| Component | Purpose |
|-----------|---------|
| `NotificationBanner` | Banner notification |
| `LoadingOverlay` | Full-screen loading overlay |
| `ProgressBar` | Linear progress indicator |

### 4.6 Domain Components

#### Spaces (`components/spaces/`)

| Component | Purpose |
|-----------|---------|
| `SpaceChatBoard` | Chat board for space |
| `ChatRowMessage` | Individual chat message |
| `TypingDots` | Typing indicator animation |
| `PinnedMessagesWidget` | Pinned messages display |
| `EventCreateModal` | Event creation modal |
| `EventsMode` | Events view mode |
| `MembersMode` | Members view mode |
| `MemberInviteModal` | Member invitation modal |
| `SpaceLeaderOnboardingModal` | Leader onboarding flow |
| `SpaceWelcomeModal` | Welcome modal for new members |
| `LeaderSetupProgress` | Leader setup progress tracker |
| `AddWidgetModal` | Widget addition modal |
| `AddTabModal` | Tab addition modal |
| `ModeCard` | Space mode selection card |
| `ModeTransition` | Animated mode transition |
| `SpaceEntryAnimation` | Space entry arrival animation |
| `ContextPill` | Context indicator pill |
| `IntentConfirmationInline` | Inline confirmation |
| `MobileDrawer` | Mobile-specific drawer |
| `MobileActionBar` | Mobile action bar |

#### Profile (`components/profile/`)

| Component | Purpose |
|-----------|---------|
| `ProfileCard` | User profile card |
| `ProfileStatsRow` | Profile statistics row |
| `ProfileSpacesCard` | User's spaces card |
| `ProfileToolsCard` | User's tools card |
| `ProfileInterestsCard` | User's interests card |
| `ProfileConnectionsCard` | User's connections card |
| `ProfileActivityHeatmap` | Activity heatmap |
| `ProfileToolModal` | Tool detail modal |
| `ContextBanner` | Profile context banner |

#### Campus (`components/campus/`)

| Component | Purpose |
|-----------|---------|
| `DockOrb` | Campus dock orb navigation |
| `CampusProvider` | Campus context provider |
| `CommandBar` | Campus command bar |

#### HiveLab (`components/hivelab/`)

IDE-specific components for the tool builder.

#### Mobile (`components/mobile/`)

Mobile-specific component overrides.

---

## 5. Usage Patterns

### Using Tokens in Components

```typescript
// Import TS tokens directly
import { semantic, foundation, MOTION } from '@hive/tokens';

// Use in inline styles
<div style={{ backgroundColor: semantic.background.surface }} />

// Use motion tokens with Framer Motion
import { revealVariants, springPresets } from '@hive/tokens';
<motion.div variants={revealVariants} initial="initial" animate="animate" />
```

### Using CSS Variables

```tsx
// Reference CSS variables from tokens.css (most common approach)
<div className="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)]" />

// Use the color-* alias layer
<div className="bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]" />

// Use composite tokens
<div style={{ transition: 'var(--transition-colors)' }} />
<div style={{ boxShadow: 'var(--focus-ring-style)' }} />
```

### Using Tailwind Classes

```tsx
// Semantic color classes (preferred)
<div className="bg-background-primary text-text-secondary border-border-DEFAULT" />

// Brand colors
<button className="bg-brand-primary text-brand-on-gold" />

// Status colors
<span className="text-status-error bg-badge-error-bg" />

// Component-specific classes
<button className="bg-button-primary-bg text-button-primary-text" />
<div className="bg-card-default-bg border-card-default-border" />

// Motion classes
<div className="transition-colors duration-quick ease-default" />
```

### Motion Patterns

```tsx
// 1. Use pre-built variants
import { revealVariants, surfaceVariants, modalVariants } from '@hive/tokens';

<motion.div variants={revealVariants} initial="initial" animate="animate" exit="exit">
  Content fades + slides up
</motion.div>

// 2. Use spring presets
import { springPresets } from '@hive/tokens';

<motion.div
  whileHover={{ scale: 1.02 }}
  transition={springPresets.snappy}
/>

// 3. Use motion primitives
import { FadeUp, Stagger, GlassSurface, RevealSection } from '@hive/ui/primitives/motion';

<Stagger staggerDelay={0.05}>
  <FadeUp><Card /></FadeUp>
  <FadeUp><Card /></FadeUp>
</Stagger>

// 4. Use CSS variables for simple transitions
<div className="transition-colors duration-[var(--duration-quick)]" />

// 5. Respect reduced motion
import { reducedMotionVariants } from '@hive/tokens';
const shouldReduce = useReducedMotion();
<motion.div variants={shouldReduce ? reducedMotionVariants.fadeOnly : revealVariants} />
```

### Glass Surface Pattern

```tsx
// Standard glass card
<GlassSurface className="p-6 rounded-xl">
  <CardContent />
</GlassSurface>

// Modal overlay with heavy blur
<GlassSurface intensity="heavy" backgroundOpacity={0.9} className="p-8 rounded-2xl">
  <ModalContent />
</GlassSurface>

// Sidebar panel with warmth and inset
<GlassPanel inset warmth className="p-4 rounded-lg">
  <SidebarContent />
</GlassPanel>
```

### Arrival Transition Pattern (Space Entry)

```tsx
import { ArrivalTransition, ArrivalZone } from '@hive/ui/primitives/motion';

<ArrivalTransition skipAnimation={hasVisitedBefore}>
  <ArrivalZone zone="header">
    <SpaceHeader />
  </ArrivalZone>
  <ArrivalZone zone="content">
    <SpaceContent />
  </ArrivalZone>
  {feedItems.map((item, i) => (
    <ArrivalZone zone="item" index={i} key={item.id}>
      <FeedCard item={item} />
    </ArrivalZone>
  ))}
</ArrivalTransition>
```

### Focus Ring Convention

Always white, never gold:
```css
focus-visible:ring-2 focus-visible:ring-white/50
```

Or using the composite token:
```css
focus-visible:outline-none
box-shadow: var(--focus-ring-style);
```
