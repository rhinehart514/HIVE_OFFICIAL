# @hive/tokens

**HIVE Unified Design Token System**

World-class design tokens following patterns from Vercel, Linear, and top YC companies.

## Architecture

```
Foundation Tokens (Raw values)
    ↓
Semantic Tokens (Purpose-based)
    ↓
Component Tokens (Component-specific)
```

## Quick Start

### Installation

```bash
# Already installed as workspace dependency
import { semantic, components, foundation } from '@hive/tokens';
```

### Usage in Components

```tsx
// ✅ BEST: Use semantic tokens
<div className="bg-background-secondary text-text-primary border-border-default">

// ✅ GOOD: Use component tokens
<button className="bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]">

// ⚠️ OK: Use Tailwind utility classes
<div className="bg-hive-background-secondary">

// ❌ NEVER: Hard-code hex values
<div className="bg-[#171717]"> // WRONG!
```

## Token Layers

### 1. Foundation Tokens (Raw Values)

Direct color values - use sparingly, prefer semantic tokens.

```tsx
import { foundation } from '@hive/tokens';

foundation.black        // #000000
foundation.white        // #FFFFFF
foundation.gray[900]    // #171717
foundation.gold[500]    // #FFD700
```

**CSS Variables:**
```css
var(--hive-foundation-black)
var(--hive-foundation-gray-900)
var(--hive-foundation-gold-500)
```

### 2. Semantic Tokens (Purpose-Based) ⭐ **PRIMARY CHOICE**

Purpose-based tokens for common use cases.

```tsx
import { semantic } from '@hive/tokens';

// Background hierarchy
semantic.background.primary      // #000000 - Main app background
semantic.background.secondary    // #171717 - Cards, panels
semantic.background.tertiary     // #262626 - Elevated surfaces
semantic.background.interactive  // #404040 - Interactive elements

// Text hierarchy
semantic.text.primary      // #FFFFFF - Main content
semantic.text.secondary    // #D4D4D4 - Supporting text
semantic.text.tertiary     // #A3A3A3 - Metadata
semantic.text.muted        // #737373 - Placeholder

// Brand (Gold discipline)
semantic.brand.primary     // #FFD700 - HIVE gold
semantic.gold.cta          // #FFD700 - Primary CTAs only
semantic.gold.achievement  // #FFD700 - Ritual completion
semantic.gold.presence     // #FFD700 - Online indicators

// Interactive (Grayscale default - ChatGPT/Vercel aesthetic)
semantic.interactive.hover  // rgba(255, 255, 255, 0.04)
semantic.interactive.focus  // rgba(255, 255, 255, 0.20)
semantic.interactive.active // rgba(255, 255, 255, 0.08)

// Status colors
semantic.status.success  // #00D46A
semantic.status.warning  // #FFB800
semantic.status.error    // #FF3737
semantic.status.info     // #0070F3

// Borders
semantic.border.default  // rgba(255, 255, 255, 0.08)
semantic.border.hover    // rgba(255, 255, 255, 0.16)
semantic.border.focus    // rgba(255, 255, 255, 0.40)
```

**CSS Variables:**
```css
var(--hive-background-primary)
var(--hive-text-primary)
var(--hive-brand-primary)
var(--hive-interactive-hover)
var(--hive-status-success)
var(--hive-border-default)
```

**Tailwind Classes:**
```tsx
className="bg-background-primary text-text-primary border-border-default"
```

### 3. Component Tokens (Component-Specific)

Pre-configured tokens for specific components.

```tsx
import { components } from '@hive/tokens';

// Button variants
components.button.default.bg          // White background
components.button.primary.bg          // Gold background
components.button.secondary.bg        // Transparent
components.button.ghost.bg            // Transparent
components.button.destructive.bg      // Red background

// Card variants
components.card.default.bg            // #171717
components.card.elevated.bg           // #262626
components.card.interactive.bg        // #171717
components.card.outline.bg            // transparent

// Input variants
components.input.default.bg           // #171717
components.input.error.border         // #FF3737
components.input.success.border       // #00D46A

// Badge variants
components.badge.default.bg           // #262626
components.badge.gold.bg              // #FFD700
components.badge.success.bg           // #00D46A

// Toast variants
components.toast.default.bg           // #262626
components.toast.success.border       // #00D46A
components.toast.error.border         // #FF3737
```

**CSS Variables:**
```css
var(--button-default-bg)
var(--button-primary-bg)
var(--card-default-bg)
var(--input-default-border)
var(--badge-gold-bg)
```

**Tailwind Classes:**
```tsx
className="bg-button-primary-bg text-button-primary-text"
className="bg-card-elevated-bg border-card-elevated-border"
```

## Tailwind Integration

### In Components

```tsx
// Semantic tokens (recommended)
<div className="bg-background-secondary text-text-primary" />

// Component tokens
<button className="bg-button-primary-bg text-button-primary-text" />

// Foundation tokens (use sparingly)
<div className="bg-foundation-gray-900" />

// CSS variables (when Tailwind classes not available)
<div className="bg-[var(--hive-background-secondary)]" />
```

### Configuration

Already configured in `apps/web/tailwind.config.ts`:

```ts
import { hiveTailwindConfig } from '@hive/tokens/src/tailwind-config-unified';

export default {
  theme: {
    extend: {
      ...hiveTailwindConfig,
      colors: {
        ...hiveTailwindConfig.colors,
      }
    }
  }
};
```

## Gold Usage Guidelines

**Philosophy**: Gold is reserved for dopamine moments. Black/white/gray for 95% of UI.

### ✅ Allowed Gold Usage

- Primary CTA buttons (`Join Space`, `Create Tool`)
- Achievement moments (Ritual complete, level unlocked)
- Online presence indicators (`147 students online`)
- Featured content badges (`Hot Space`, `Featured Tool`)

### ❌ Forbidden Gold Usage

- Focus rings (use white glow: `var(--hive-interactive-focus)`)
- Hover states (use grayscale: `var(--hive-interactive-hover)`)
- Borders (use white/gray: `var(--hive-border-default)`)
- Decorative elements
- Secondary buttons

## Migration from Legacy

### Old System → New System

```tsx
// ❌ Old (Hard-coded)
className="bg-[#171717] text-[#FFFFFF] border-[#333333]"

// ✅ New (Semantic tokens)
className="bg-background-secondary text-text-primary border-border-default"
```

### Legacy Token Mappings

```tsx
// Old luxury names still work (backward compatible)
import { legacy } from '@hive/tokens';

legacy.obsidian  → foundation.gray[1000]
legacy.charcoal  → foundation.gray[900]
legacy.graphite  → foundation.gray[800]
legacy.platinum  → foundation.white
legacy.gold      → foundation.gold[500]
```

## Common Patterns

### Card Component

```tsx
<div className="
  bg-background-secondary
  border border-border-default
  rounded-radius-lg
  shadow-shadow-level2
  hover:bg-background-tertiary
  hover:border-border-hover
  hover:shadow-shadow-level3
">
  <h3 className="text-text-primary">Title</h3>
  <p className="text-text-secondary">Description</p>
</div>
```

### Button Component

```tsx
// Primary (Gold)
<button className="
  bg-button-primary-bg
  text-button-primary-text
  hover:bg-[var(--button-primary-hover-bg)]
  rounded-radius-md
">

// Secondary (Outline)
<button className="
  bg-button-secondary-bg
  text-button-secondary-text
  border border-button-secondary-border
  hover:bg-[var(--button-secondary-hover-bg)]
">

// Ghost
<button className="
  bg-transparent
  text-text-secondary
  hover:bg-interactive-hover
  hover:text-text-primary
">
```

### Input Component

```tsx
// Default
<input className="
  bg-input-default-bg
  text-input-default-text
  border border-input-default-border
  placeholder:text-text-muted
  focus:border-[var(--input-default-focus-border)]
  focus:ring-2 focus:ring-[var(--input-default-focus-ring)]
" />

// Error state
<input className="
  bg-input-error-bg
  border border-input-error-border
  focus:ring-2 focus:ring-[var(--input-error-focus-ring)]
" />
```

### Toast/Notification

```tsx
// Success
<div className="
  bg-toast-success-bg
  border-l-4 border-toast-success-border
  text-toast-success-text
">
  <Icon className="text-[var(--toast-success-icon)]" />
  <p>Success message</p>
</div>
```

## Development Tools

### VS Code IntelliSense

CSS variable autocomplete works automatically:

```css
background: var(--hive-background-primary); /* ✅ Autocomplete works */
```

### ESLint Rule (Coming Soon)

```json
{
  "rules": {
    "no-hardcoded-colors": "error"
  }
}
```

Will catch:

```tsx
// ❌ Error: Use semantic tokens instead
className="bg-[#171717]"
className="text-[#FFFFFF]"
```

## Token Hooks (Coming Soon)

```tsx
import { useTokens, useCognitiveBudget } from '@hive/hooks';

// Runtime token access
const tokens = useTokens();
tokens.semantic.background.primary // "#000000"
tokens.components.button.primary.bg // "#FFD700"

// Cognitive budget enforcement
const maxPins = useCognitiveBudget('spaceBoard', 'maxPins'); // 2
const maxRailWidgets = useCognitiveBudget('feed', 'maxRailWidgets'); // 3
```

## Philosophy

### Vercel/Linear Aesthetic

- **Minimal**: Black/white/gray for 95% of UI
- **Focused**: Gold only for dopamine moments
- **High Contrast**: WCAG 2.1 AA minimum
- **Disciplined**: Every color choice is intentional

### Token Hierarchy

1. **Try semantic first** - `semantic.background.primary`
2. **Use component tokens** - `components.button.primary.bg`
3. **Foundation as fallback** - `foundation.gray[900]`
4. **Never hard-code** - No hex values in components

### ChatGPT-Style Interactivity

- Grayscale hovers (white overlays, NOT gold)
- White focus rings (accessible, not distracting)
- Gold reserved for primary actions only

## Resources

- **Tokens Source**: `packages/tokens/src/colors-unified.ts`
- **Generated CSS**: `packages/tokens/src/hive-tokens-generated.css`
- **Tailwind Config**: `packages/tokens/src/tailwind-config-unified.ts`
- **Storybook**: `pnpm storybook` (token browser coming soon)

## Troubleshooting

### "Cannot find module '@hive/tokens'"

```bash
pnpm --filter @hive/tokens build
```

### "Tailwind class not working"

Ensure `apps/web/tailwind.config.ts` imports `hiveTailwindConfig`.

### "CSS variables not defined"

Ensure `hive-tokens-generated.css` is imported in `app/layout.tsx`:

```tsx
import '@hive/tokens/src/hive-tokens-generated.css';
```

---

**Maintained by**: HIVE Design System Team
**Version**: 1.0.0 (Unified System)
**Last Updated**: 2025-11-17
