# HIVE Visual Direction

**Updated:** 2026-01-29

## Summary

Design-forward + future-native aesthetic. Apple-level craft that feels 2-3 years ahead of current campus apps, while remaining accessible to everyone.

---

## Color System

### Backgrounds
```
--bg-base:        #0a0a0a    (true dark, warm tint)
--bg-elevated:    #141414    (cards, modals)
--bg-hover:       #1a1a1a    (hover states)
--bg-active:      #242424    (pressed states)
```

### Foreground
```
--fg-primary:     #ffffff    (primary text)
--fg-secondary:   #a1a1a1    (secondary text)
--fg-tertiary:    #6b6b6b    (disabled, placeholder)
--fg-muted:       #404040    (borders, dividers)
```

### Brand (Gold)
```
--gold:           #ffd700    (brand moments ONLY)
--gold-muted:     #ffd70033  (20% for subtle backgrounds)
```

**Gold usage rules:**
- Logo and brand identity
- Onboarding highlights
- Celebration moments (success, milestones)
- CTA buttons (the "1% rule" - use sparingly)
- NOT on regular buttons, links, or icons

---

## Typography

### Fonts
- **Display:** Clash Display (headlines, space names)
- **Body:** Geist (everything else)
- **Mono:** Geist Mono (code, data)

### Scale
```
hero:        72px  (Clash, -3% tracking)
display-xl:  56px
display-lg:  48px
display:     40px
display-sm:  32px
title-lg:    24px  (Geist)
title:       20px
body-lg:     16px
body:        14px
body-sm:     13px
label:       12px
caption:     12px
fine:        11px
```

---

## Spacing

4px base scale. Use Tailwind spacing utilities.

### Density System

| Context | Padding | Gap | Use Case |
|---------|---------|-----|----------|
| **Spacious** | p-6 (24px) | gap-6 | Browse, discovery, landing |
| **Balanced** | p-4 (16px) | gap-4 | Chat, forms, settings |
| **Compact** | p-2 (8px) | gap-2 | Dropdowns, lists, sidebar |

Import from tokens:
```ts
import { DENSITY, getDensityClasses } from '@hive/ui';

// Get Tailwind classes
const classes = getDensityClasses('spacious');
// { padding: 'p-6', gap: 'gap-6', ... }
```

---

## Border Radius

Rounded, approachable feel (16px+ default).

```
sm:       8px     (small buttons, inputs)
DEFAULT:  12px    (standard cards)
lg:       16px    (larger cards)
xl:       20px    (modals, hero elements)
2xl:      24px    (extra large)
3xl:      32px    (special cases)
full:     9999px  (pills, avatars)
```

---

## Shadows (Layered Depth)

Apple Glass Dark treatment with deep shadows.

```
sm:   0 1px 2px rgba(0,0,0,0.3)
md:   0 4px 12px rgba(0,0,0,0.4)
lg:   0 8px 24px rgba(0,0,0,0.5)
xl:   0 16px 48px rgba(0,0,0,0.6)
```

### Glass Surface Recipe
```css
background: linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92));
box-shadow: 0 0 0 1px rgba(255,255,255,0.08),
            0 8px 32px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1);
```

---

## Interactive Elements

### Buttons

**Default behavior:** Ghost/outline style (minimal fill, border-defined)

| Variant | Use Case |
|---------|----------|
| `default` | Standard actions (ghost/outline) |
| `cta` | Gold gradient - the 1% rule |
| `solid` | High emphasis white button |
| `secondary` | Less prominent actions |
| `ghost` | Invisible until hovered |
| `destructive` | Dangerous actions |

### Focus Treatment

**All components use WHITE focus ring, never gold.**

```css
focus-visible:ring-2 focus-visible:ring-white/50
focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]
```

### Hover Behavior

**Opacity/brightness changes, NOT scale transforms.**

Scale feels "playful/cheap" - restraint = premium.

---

## Motion

Expressive but purposeful. 200-400ms with spring physics.

### Durations
```
instant:   0ms      (system state changes)
snap:      100ms    (micro-interactions)
fast:      150ms    (hover, focus)
quick:     200ms    (dropdowns, tooltips)
smooth:    300ms    (standard transitions)
gentle:    400ms    (modals, panels)
slow:      500ms    (page transitions)
dramatic:  700ms    (hero animations)
```

### Easing
```
smooth:   cubic-bezier(0.22, 1, 0.36, 1)   (default - premium feel)
out:      cubic-bezier(0, 0, 0.2, 1)       (exit animations)
in-out:   cubic-bezier(0.4, 0, 0.2, 1)     (symmetric)
spring:   { stiffness: 400, damping: 30 }  (physics-based)
```

---

## Component Patterns

### Cards
- Use `rounded-2xl` (16px)
- Apple Glass Dark surface
- `warmth` prop for gold edge glow (activity indicator)
- `interactive` prop uses brightness hover, not scale

### Modals
- Use `rounded-3xl` (24px)
- 150ms scale animation (0.96 → 1)
- 60% black backdrop with blur

### Inputs
- Use `rounded-xl` (16px)
- Gradient background + shadow
- Focus: brighten + white ring

### Tabs
- Pill shape (`rounded-full`)
- Glass pill for active state
- Spring animation for sliding indicator

### Badges
- Pill shape (`rounded-full`)
- Glass treatment for all variants
- Gold variant uses glass gold, not solid

---

## Implementation Checklist

When building UI:

- [ ] Use density tokens for context-appropriate spacing
- [ ] Use ghost/outline buttons by default
- [ ] Reserve gold for brand moments only
- [ ] Use white focus rings everywhere
- [ ] Use opacity/brightness hover, not scale
- [ ] Use layered shadows for depth
- [ ] Use rounded corners (16px+ default)
- [ ] Use expressive motion (200-400ms, spring)

---

## Motion Implementation (CRITICAL)

**Status:** Motion system exists but is NOT implemented in app shell.
**Reference:** `/about` page shows correct motion. App shell has none.
**Full audit:** `docs/DESIGN_AUDIT.md`

### Required Motion Patterns

Every component in the app shell needs motion. Import from `@hive/tokens`:

#### Card Entrance (revealVariants)
```tsx
import { revealVariants } from '@hive/tokens';

<motion.div
  variants={revealVariants}
  initial="initial"
  animate="animate"
>
  <Card />
</motion.div>
```

#### List Stagger (staggerContainerVariants)
```tsx
import { staggerContainerVariants, revealVariants } from '@hive/tokens';

<motion.div
  variants={staggerContainerVariants}
  initial="initial"
  animate="animate"
>
  {items.map(item => (
    <motion.div key={item.id} variants={revealVariants}>
      <Card />
    </motion.div>
  ))}
</motion.div>
```

#### Card Hover (cardHoverVariants)
```tsx
import { cardHoverVariants } from '@hive/tokens';

<motion.div
  variants={cardHoverVariants}
  initial="rest"
  whileHover="hover"
>
  <Card />
</motion.div>
```

#### Page Transitions (pageTransitionVariants)
```tsx
import { pageTransitionVariants } from '@hive/tokens';

<motion.main
  variants={pageTransitionVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {children}
</motion.main>
```

### Motion Variants Reference

All variants are defined in `packages/tokens/src/motion.ts`:

| Variant | Use For | Duration |
|---------|---------|----------|
| `revealVariants` | Card/item entrance | 300ms |
| `surfaceVariants` | Modals, popovers | spring |
| `staggerContainerVariants` | List parent | 50ms stagger |
| `cardHoverVariants` | Interactive cards | spring |
| `buttonPressVariants` | Button press | spring |
| `messageEntryVariants` | Chat messages | 250ms |
| `modalVariants` | Modal overlay + content | spring |
| `dropdownVariants` | Dropdown menus | spring + stagger |
| `pageTransitionVariants` | Route changes | 400ms |

### Spring Presets

| Preset | Use For | Config |
|--------|---------|--------|
| `snappy` | Buttons, toggles | stiffness: 400, damping: 30 |
| `default` | General UI | stiffness: 200, damping: 25 |
| `gentle` | Modals, sheets | stiffness: 100, damping: 20 |
| `bouncy` | Celebrations | stiffness: 300, damping: 15 |

---

## Files Changed (2026-01-29)

1. `packages/ui/src/design-system/primitives/Button.tsx`
   - Default variant changed to ghost/outline
   - Added `solid` variant for white buttons
   - `primary` alias added for backward compatibility

2. `packages/ui/src/design-system/primitives/Input.tsx`
   - Added white focus ring (was shadow-only)

3. `packages/ui/tailwind.config.ts`
   - Bumped radius scale (sm: 8px, DEFAULT: 12px, lg: 16px, xl: 20px)

4. `packages/ui/src/tokens/density.ts` (NEW)
   - Added density token system
   - Spacious, balanced, compact configurations

5. `packages/ui/src/tokens/index.ts`
   - Exports density tokens
