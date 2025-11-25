# HIVE Design System Architecture

> Modern, type-safe component styling combining patterns from Radix UI, Tailwind CSS, shadcn/ui, and Tailwind Variants.

---

## Architecture Overview

### 3-Layer Token System

```
Layer 1: Foundation (design-system-v2.ts)
  └── Raw OKLCH colors (gray.1-12, gold.1-12)
  └── Spacing, typography, animation scales

Layer 2: CSS Variables (globals.css)
  └── Semantic tokens (--background, --primary, --border)
  └── Runtime-themeable values

Layer 3: Tailwind Variants (tv.ts)
  └── Type-safe component styling
  └── Variants, slots, compound variants
```

### Why This Approach?

1. **Type Safety** - TypeScript-first with `VariantProps<typeof component>`
2. **Composability** - Reuse variants across components
3. **Performance** - Static analysis, tree-shaking, no runtime CSS-in-JS
4. **Consistency** - Single source of truth for all styling
5. **Modern Patterns** - OKLCH colors, CSS variables, Radix slots

---

## Quick Start

### Using a Component Variant

```tsx
import { buttonVariants } from '@hive/ui/lib/tv';

// Apply variant classes
<button className={buttonVariants({ variant: 'primary', size: 'lg' })}>
  Join Space
</button>

// Get type-safe props
import type { ButtonVariants } from '@hive/ui/lib/tv';
const MyButton: React.FC<ButtonVariants & { children: React.ReactNode }> = ({
  variant,
  size,
  children
}) => (
  <button className={buttonVariants({ variant, size })}>
    {children}
  </button>
);
```

### Using Slot Variants

```tsx
import { cardVariants } from '@hive/ui/lib/tv';

const { root, header, content, footer } = cardVariants({ variant: 'interactive' });

<div className={root()}>
  <div className={header()}>Title</div>
  <div className={content()}>Content</div>
  <div className={footer()}>Actions</div>
</div>
```

### Using CSS Variables

```tsx
// Tailwind classes reference CSS vars
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Gold CTA
  </button>
</div>

// Direct CSS var usage
<div style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
  Custom styled element
</div>
```

---

## File Structure

```
packages/
├── tokens/
│   └── src/
│       └── design-system-v2.ts    # Foundation tokens + scales
├── ui/
│   └── src/
│       └── lib/
│           └── tv.ts              # Tailwind Variants config
apps/
└── web/
    └── src/
        └── app/
            └── globals.css        # CSS variables
```

---

## Component Patterns

### Pattern 1: Simple Variants

For components with single-root elements:

```typescript
export const badgeVariants = tv({
  base: [
    'inline-flex items-center rounded-md px-2.5 py-0.5',
    'text-xs font-medium transition-colors',
  ],
  variants: {
    variant: {
      default: 'bg-secondary text-secondary-foreground',
      primary: 'bg-primary text-primary-foreground',
      destructive: 'bg-destructive/20 text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
```

### Pattern 2: Slot Variants

For components with multiple named parts:

```typescript
export const cardVariants = tv({
  slots: {
    root: 'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
    header: 'flex flex-col space-y-1.5 p-6',
    title: 'text-lg font-semibold leading-none tracking-tight',
    content: 'p-6 pt-0',
    footer: 'flex items-center p-6 pt-0',
  },
  variants: {
    variant: {
      default: {},
      interactive: {
        root: 'cursor-pointer transition-colors hover:bg-accent/50',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
```

### Pattern 3: Compound Variants

For combinations of variants:

```typescript
export const buttonVariants = tv({
  base: '...',
  variants: {
    variant: { primary: '...', secondary: '...' },
    size: { sm: '...', lg: '...' },
  },
  compoundVariants: [
    {
      variant: 'primary',
      size: 'lg',
      class: 'font-semibold', // Extra styling for primary + large
    },
  ],
});
```

---

## Color System

### 12-Step Scale (Radix Pattern)

| Steps | Purpose | Example Usage |
|-------|---------|---------------|
| 1-2 | Backgrounds | App background, subtle backgrounds |
| 3-5 | Interactive | UI elements, hover states, active states |
| 6-8 | Borders | Subtle borders, element borders, hover borders |
| 9-10 | Solid | Solid backgrounds, hovered solid |
| 11-12 | Text | Low contrast text, high contrast text |

### OKLCH Format

```css
--primary: oklch(0.855 0.30 85);
```

Benefits:
- **Perceptual uniformity** - Colors look equally bright across hues
- **Better gradients** - Smoother transitions
- **Accessibility** - Easier contrast ratio maintenance

### Gold 5% Rule

Use gold (`--primary`) ONLY for:
- Primary CTA buttons
- Achievement celebrations
- Online presence indicators
- Featured content badges

NEVER use gold for:
- Focus rings (use `--ring`)
- Hover states
- Borders
- Decorative elements

---

## Available Variants

### Core Components

| Component | Variants | Sizes | Slots |
|-----------|----------|-------|-------|
| `buttonVariants` | default, primary, secondary, outline, ghost, destructive, link | xs, sm, md, lg, xl, icon | - |
| `cardVariants` | default, interactive, elevated, outline | - | root, header, title, description, content, footer |
| `inputVariants` | - | sm, md, lg | - |
| `badgeVariants` | default, primary, outline, success, warning, destructive, muted | - | - |
| `alertVariants` | default, destructive, success, warning | - | root, icon, title, description |

### HIVE-Specific

| Component | Variants | Slots |
|-----------|----------|-------|
| `feedCardVariants` | post, event, tool, system | root, header, avatar, meta, author, timestamp, content, media, actions, actionButton |
| `spaceHeaderVariants` | compact, default, large | root, banner, content, avatar, info, name, description, stats, actions |
| `ritualCardVariants` | active, completed, locked | root, header, badge, title, description, content, progress, progressBar, progressFill, footer, cta |

### Utility Variants

| Variant | Purpose |
|---------|---------|
| `focusRingVariants` | Standard focus styling |
| `interactiveVariants` | Hover/active states |
| `truncateVariants` | Text truncation (1-3 lines) |

---

## Migration Guide

### From Hardcoded Colors

```tsx
// Before
<div className="bg-gray-900 text-white border-gray-700">

// After
<div className="bg-background text-foreground border-border">
```

### From Custom Button Styles

```tsx
// Before
<button className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600">

// After
import { buttonVariants } from '@hive/ui/lib/tv';
<button className={buttonVariants({ variant: 'primary' })}>
```

### From Inline Slots

```tsx
// Before
<div className="rounded-xl border border-gray-800 bg-gray-900">
  <div className="p-6">Header</div>
  <div className="p-6 pt-0">Content</div>
</div>

// After
const { root, header, content } = cardVariants();
<div className={root()}>
  <div className={header()}>Header</div>
  <div className={content()}>Content</div>
</div>
```

---

## TypeScript Integration

### Extract Variant Props

```typescript
import type { VariantProps } from 'tailwind-variants';
import { buttonVariants } from '@hive/ui/lib/tv';

type ButtonProps = VariantProps<typeof buttonVariants> & {
  children: React.ReactNode;
  onClick?: () => void;
};

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  children,
  onClick,
}) => (
  <button
    className={buttonVariants({ variant, size })}
    onClick={onClick}
  >
    {children}
  </button>
);
```

### Type-Safe Slot Components

```typescript
import { cardVariants, type CardVariants } from '@hive/ui/lib/tv';

type CardProps = CardVariants & {
  title: string;
  children: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({ variant, title, children }) => {
  const { root, header, title: titleSlot, content } = cardVariants({ variant });

  return (
    <div className={root()}>
      <div className={header()}>
        <h3 className={titleSlot()}>{title}</h3>
      </div>
      <div className={content()}>{children}</div>
    </div>
  );
};
```

---

## Best Practices

### DO

- Use CSS variables for all colors (`bg-background`, `text-foreground`)
- Use Tailwind Variants for component styling
- Extract types with `VariantProps<typeof variant>`
- Use slots for multi-part components
- Test with dark theme (default for HIVE)
- Verify 4.5:1 contrast ratios
- Enforce cognitive budgets

### DON'T

- Hardcode hex colors (`#000000`, `#FFFFFF`)
- Use inline styles for themeable values
- Create one-off button styles
- Skip TypeScript types
- Exceed animation durations > 500ms
- Use gold for hover states

---

## Performance Considerations

1. **Static Analysis** - Tailwind Variants generates classes at build time
2. **Tree Shaking** - Unused variants are removed
3. **No Runtime CSS** - No CSS-in-JS overhead
4. **Caching** - CSS classes are cached by the browser

---

## Dependencies

```json
{
  "tailwind-variants": "^3.1.1",
  "tailwind-merge": "^3.0.0",
  "tailwindcss": "^3.4.0"
}
```

---

## Related Documentation

- [DESIGN_SYSTEM_V2.md](./DESIGN_SYSTEM_V2.md) - Token definitions and color scales
- [COMPONENT_MIGRATION_TODO.md](./COMPONENT_MIGRATION_TODO.md) - Migration tracking
- [DESIGN_TOKENS_GUIDE.md](./DESIGN_TOKENS_GUIDE.md) - Original token usage guide
- [UI_UX_WORKING_GUIDE.md](./UI_UX_WORKING_GUIDE.md) - Daily reference

---

*Last updated: November 2025*
