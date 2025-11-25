# Design Tokens Usage Guide

**Last Updated**: 2025-11-17
**Owner**: Design System Team
**Status**: Production

## Quick Decision Tree

```
Are you creating/editing a component?
├─ YES → Is it an atom? (Button, Input, Badge, etc.)
│  ├─ YES → Use Component Tokens
│  │  └─ Example: `var(--button-primary-bg)`, `var(--input-default-border)`
│  └─ NO → Is it a molecule/organism/template?
│     └─ YES → Use Semantic Tokens
│        └─ Example: `var(--hive-background-secondary)`, `var(--hive-text-primary)`
└─ NO → Are you styling a page?
   └─ Use Semantic Tokens only for structure
      └─ Example: `bg-background-primary`, `text-text-primary`
```

---

## Token System Architecture

HIVE uses a **3-layer token system** based on industry best practices (Vercel, Linear, shadcn/ui):

```
┌─────────────────────────────────────────┐
│  Layer 3: Component Tokens              │  ← Atoms use these
│  --button-primary-bg: #FFD700           │
│  --card-elevated-shadow: 0 4px 12px...  │
└─────────────────────────────────────────┘
              ↑ references
┌─────────────────────────────────────────┐
│  Layer 2: Semantic Tokens               │  ← Everything else uses these
│  --hive-background-primary: #000000     │
│  --hive-text-primary: #F7F7FF           │
│  --hive-brand-primary: #FFD700          │
└─────────────────────────────────────────┘
              ↑ references
┌─────────────────────────────────────────┐
│  Layer 1: Foundation Tokens             │  ← Never use directly
│  foundation.black: '#000000'            │
│  foundation.gray[900]: '#171717'        │
│  foundation.gold[500]: '#FFD700'        │
└─────────────────────────────────────────┘
```

### Layer 1: Foundation Tokens
**DO NOT USE DIRECTLY** - These are raw color values

```typescript
import { foundation } from '@hive/tokens';

foundation.black      // '#000000'
foundation.white      // '#FFFFFF'
foundation.gray[900]  // '#171717'
foundation.gold[500]  // '#FFD700'
```

### Layer 2: Semantic Tokens
**USE FOR**: Molecules, Organisms, Templates, and all non-atom components

```typescript
import { semantic } from '@hive/tokens';

// Backgrounds
semantic.background.primary       // '#000000' - Main app background
semantic.background.secondary     // '#0A0A0F' - Cards, panels
semantic.background.interactive   // '#171717' - Hover states

// Text
semantic.text.primary             // '#F7F7FF' - Main text
semantic.text.secondary           // '#A0A0B0' - Subtle text
semantic.text.muted               // '#6B6B7F' - Disabled text

// Brand (Gold)
semantic.brand.primary            // '#FFD700' - Gold accent
semantic.brand.hover              // '#FFE54D' - Gold hover
semantic.brand.onGold             // '#000000' - Text on gold

// Interactive States
semantic.interactive.hover        // '#1F1F27' - Generic hover
semantic.interactive.focus        // '#2D3145' - Focus rings
semantic.interactive.active       // '#3A3E5A' - Active states

// Status Colors
semantic.status.success.default   // '#34D399' - Success
semantic.status.warning.default   // '#FBBF24' - Warning
semantic.status.error.default     // '#EF4444' - Error
```

### Layer 3: Component Tokens
**USE FOR**: Atoms only (Button, Input, Badge, Card, Toast, etc.)

```typescript
import { components } from '@hive/tokens';

// Button variants
components.button.default.bg      // '#171717'
components.button.default.text    // '#F7F7FF'
components.button.default.border  // '#2D3145'

components.button.primary.bg      // '#FFD700'
components.button.primary.text    // '#000000'
components.button.primary.hover   // '#FFE54D'

// Card variants
components.card.default.bg        // '#0A0A0F'
components.card.default.border    // '#2D3145'
components.card.elevated.shadow   // '0 4px 12px rgba(0, 0, 0, 0.4)'
```

---

## Usage Patterns by Component Type

### Atoms (Use Component Tokens)

**Button Component**:
```tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  "rounded-lg font-medium transition-colors",
  {
    variants: {
      variant: {
        default: [
          "bg-button-default-bg",           // Component token
          "text-button-default-text",       // Component token
          "border border-button-default-border",
          "hover:bg-button-default-hover"
        ],
        primary: [
          "bg-button-primary-bg",           // Component token
          "text-button-primary-text",       // Component token
          "hover:bg-button-primary-hover"
        ],
      }
    }
  }
);
```

**Input Component**:
```tsx
const inputVariants = cva(
  "w-full rounded-md transition-colors",
  {
    variants: {
      variant: {
        default: [
          "bg-input-default-bg",            // Component token
          "border border-input-default-border",
          "text-input-default-text",
          "focus:border-input-default-focus"
        ],
        error: [
          "bg-input-error-bg",              // Component token
          "border-2 border-input-error-border",
          "text-input-error-text"
        ]
      }
    }
  }
);
```

### Molecules (Use Semantic Tokens)

**ProfileCard Component**:
```tsx
export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className={cn(
      "rounded-lg p-4",
      "bg-background-secondary",          // Semantic token
      "border border-border-default",     // Semantic token
      "hover:bg-background-interactive"   // Semantic token
    )}>
      <h3 className="text-text-primary font-semibold"> {/* Semantic */}
        {user.name}
      </h3>
      <p className="text-text-secondary text-sm"> {/* Semantic */}
        {user.bio}
      </p>
      <Badge variant="gold">{user.gradYear}</Badge> {/* Atom */}
    </div>
  );
}
```

### Organisms (Use Semantic Tokens + Composition)

**SpaceBoard Component**:
```tsx
export function SpaceBoard({ space }: SpaceBoardProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header - Semantic tokens */}
      <div className={cn(
        "rounded-lg p-6",
        "bg-background-secondary",        // Semantic
        "border-l-4 border-brand-primary" // Semantic (gold accent)
      )}>
        <h1 className="text-text-primary text-2xl font-bold">
          {space.name}
        </h1>
        <p className="text-text-secondary">
          {space.description}
        </p>
      </div>

      {/* Content - Composition of molecules/atoms */}
      <div className="grid gap-4">
        {space.posts.map(post => (
          <PostCard key={post.id} post={post} /> {/* Molecule */}
        ))}
      </div>
    </div>
  );
}
```

### Templates (Use Semantic Tokens for Structure)

**PageLayout Template**:
```tsx
export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background-primary"> {/* Semantic */}
      <header className={cn(
        "sticky top-0 z-50",
        "bg-background-secondary/90",      // Semantic with opacity
        "backdrop-blur-md",
        "border-b border-border-default"   // Semantic
      )}>
        <Navigation />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-background-secondary border-t border-border-default">
        <Footer />
      </footer>
    </div>
  );
}
```

---

## Tailwind CSS Integration

All tokens are available as Tailwind utility classes:

### Background Colors
```tsx
// Semantic tokens
<div className="bg-background-primary">       {/* #000000 */}
<div className="bg-background-secondary">     {/* #0A0A0F */}
<div className="bg-background-interactive">   {/* #171717 */}

// Component tokens (atoms only)
<button className="bg-button-primary-bg">     {/* #FFD700 */}
<div className="bg-card-elevated-bg">         {/* #0F0F14 */}
```

### Text Colors
```tsx
// Semantic tokens
<p className="text-text-primary">             {/* #F7F7FF */}
<p className="text-text-secondary">           {/* #A0A0B0 */}
<p className="text-text-muted">               {/* #6B6B7F */}

// Component tokens (atoms only)
<button className="text-button-primary-text"> {/* #000000 */}
```

### Border Colors
```tsx
<div className="border border-border-default">   {/* #2D3145 */}
<div className="border border-border-strong">    {/* #3A3E5A */}
<input className="border-input-error-border">    {/* #EF4444 */}
```

### Opacity Modifiers (Tailwind built-in)
```tsx
<div className="bg-background-secondary/90">  {/* 90% opacity */}
<div className="bg-brand-primary/10">         {/* 10% gold overlay */}
<div className="border-border-default/50">    {/* 50% border opacity */}
```

---

## React Hooks (Runtime Access)

For dynamic token access in JavaScript/TypeScript:

```tsx
import { useTokens, useBackgroundTokens, useButtonTokens } from '@hive/hooks';

function MyComponent() {
  // Full token system
  const tokens = useTokens();
  const bgColor = tokens.semantic.background.primary; // '#000000'

  // Shorthand for specific layers
  const backgrounds = useBackgroundTokens();
  const primary = backgrounds.primary; // '#000000'

  // Component-specific tokens
  const buttonTokens = useButtonTokens();
  const primaryBg = buttonTokens.primary.bg; // '#FFD700'

  return (
    <div style={{ backgroundColor: bgColor }}>
      Dynamic background
    </div>
  );
}
```

---

## Gold Usage Rules (Critical)

Gold (`#FFD700`) is HIVE's signature color. **Use it sparingly** for maximum impact.

### ✅ Correct Gold Usage (5% of UI)

1. **Primary CTAs** (1-2 per page)
   ```tsx
   <Button variant="primary">Join Space</Button>
   ```

2. **Achievements & Badges**
   ```tsx
   <Badge variant="gold">Founding Class</Badge>
   ```

3. **Featured Content**
   ```tsx
   <div className="border-l-4 border-brand-primary">
     Featured Space
   </div>
   ```

4. **Active Presence Indicators**
   ```tsx
   <div className="bg-brand-primary w-2 h-2 rounded-full" />
   ```

### ❌ Incorrect Gold Usage

1. **Never use gold for hover states**
   ```tsx
   // ❌ WRONG
   <button className="hover:bg-brand-primary">

   // ✅ CORRECT - Use white/gray hovers
   <button className="hover:bg-interactive-hover">
   ```

2. **Never use gold for secondary actions**
   ```tsx
   // ❌ WRONG
   <Button variant="primary">Cancel</Button>

   // ✅ CORRECT
   <Button variant="ghost">Cancel</Button>
   ```

3. **Never use gold backgrounds for large areas**
   ```tsx
   // ❌ WRONG
   <div className="bg-brand-primary p-20">...</div>

   // ✅ CORRECT - Use as accent only
   <div className="bg-background-secondary border-l-2 border-brand-primary">
   ```

### Gold Discipline = ChatGPT/Vercel Aesthetic

**95% grayscale + 5% gold** = Premium, focused, dopamine-driven UX

---

## Common Patterns & Recipes

### Pattern 1: Card with Hover State
```tsx
<div className={cn(
  "rounded-lg p-4",
  "bg-background-secondary",
  "border border-border-default",
  "hover:bg-background-interactive",
  "transition-colors"
)}>
  Content
</div>
```

### Pattern 2: Input with Error State
```tsx
<input
  className={cn(
    "w-full rounded-md px-3 py-2",
    error
      ? "bg-input-error-bg border-2 border-input-error-border"
      : "bg-input-default-bg border border-input-default-border",
    "focus:outline-none focus:ring-2 focus:ring-interactive-focus"
  )}
/>
```

### Pattern 3: Status Badge
```tsx
function StatusBadge({ status }: { status: 'active' | 'pending' | 'error' }) {
  const variants = {
    active: "bg-status-success-default/10 text-status-success-default border-status-success-default",
    pending: "bg-status-warning-default/10 text-status-warning-default border-status-warning-default",
    error: "bg-status-error-default/10 text-status-error-default border-status-error-default"
  };

  return (
    <span className={cn("px-2 py-1 rounded-full border text-xs", variants[status])}>
      {status}
    </span>
  );
}
```

### Pattern 4: Modal Overlay
```tsx
<div className={cn(
  "fixed inset-0 z-50",
  "bg-overlay-modal",              // Component token for modals
  "backdrop-blur-md",
  "flex items-center justify-center"
)}>
  <div className={cn(
    "bg-background-primary",
    "border border-border-default",
    "rounded-lg p-6 max-w-lg"
  )}>
    Modal Content
  </div>
</div>
```

### Pattern 5: Feature Highlight (Gold Accent)
```tsx
<div className={cn(
  "rounded-lg p-6",
  "bg-background-secondary",
  "border-l-4 border-brand-primary",  // Gold left border
  "shadow-lg"
)}>
  <h3 className="text-text-primary font-bold">Featured Tool</h3>
  <p className="text-text-secondary">
    This is a featured item with gold accent
  </p>
  <Button variant="primary">Try Now</Button>
</div>
```

---

## Migration Checklist

When migrating existing components to the new token system:

- [ ] Identify component type (Atom, Molecule, Organism, Template)
- [ ] Choose correct token layer (Component for atoms, Semantic for everything else)
- [ ] Replace hard-coded hex values with token classes
- [ ] Remove defensive fallbacks like `var(--hive-text-primary, #F7F7FF)`
- [ ] Test in light/dark modes (if applicable)
- [ ] Verify hover/focus states work correctly
- [ ] Check gold usage follows 5% rule
- [ ] Run ESLint to catch any remaining hard-coded values

---

## VS Code IntelliSense

CSS variable autocomplete is available in VS Code. Just type `--hive-` or `--button-` to see all available tokens with descriptions.

**Example**:
```css
/* Type "--hive-" to see: */
--hive-background-primary       /* Main app background (#000000) */
--hive-background-secondary     /* Cards, panels (#0A0A0F) */
--hive-text-primary            /* Main text (#F7F7FF) */
```

---

## Troubleshooting

### Issue: "Token not working in Tailwind"
**Solution**: Make sure you're using the token class correctly
```tsx
// ❌ WRONG
<div className="bg-[var(--hive-background-primary)]">

// ✅ CORRECT
<div className="bg-background-primary">
```

### Issue: "Color looks different than expected"
**Solution**: Check for opacity modifiers
```tsx
<div className="bg-background-secondary/90">  {/* 90% opacity */}
```

### Issue: "Which token should I use?"
**Solution**: Follow the decision tree at the top of this guide

### Issue: "Can I use foundation tokens?"
**Solution**: No, never use foundation tokens directly. Always use semantic or component tokens.

---

## Related Documentation

- [`packages/tokens/README.md`](../packages/tokens/README.md) - Token system API reference
- [`docs/COMPONENT_CREATION_GUIDE.md`](./COMPONENT_CREATION_GUIDE.md) - Step-by-step component creation
- [`docs/TOKEN_MIGRATION_GUIDE.md`](./TOKEN_MIGRATION_GUIDE.md) - Migration examples
- [`docs/UX-UI-TOPOLOGY.md`](./UX-UI-TOPOLOGY.md) - UI patterns and layouts

---

**Questions?** Refer to existing components in `packages/ui/src/atomic/` for examples.
