# HiveLab Design System

> Workshop atmosphere. Pure function. No glass.

HiveLab is HIVE's tool-building IDE. It follows a distinct aesthetic separate from the main HIVE app — darker, denser, and purely functional. Think VS Code meets Linear, not Notion.

---

## Core Philosophy

### Workshop Atmosphere

HiveLab is a workshop, not a showroom. Every visual element earns its place through function, not decoration.

| Principle | Implementation |
|-----------|----------------|
| **Dark** | Canvas is true black (#0A0A0A), not off-black |
| **Dense** | Information-rich panels, minimal padding |
| **Functional** | No glass morphism, no gradients, no decorative shadows |
| **Precise** | Pixel-perfect alignment, consistent spacing |
| **Quiet** | UI recedes, user's creation takes focus |

### Gold Discipline

Gold (`--life-gold`) appears **only** at earned moments:

**Gold DOES appear:**
- Deploy success celebration
- Tool live/active indicators
- Connection lines between elements
- Unsaved changes indicator
- Toggle active states

**Gold NEVER appears:**
- Focus rings (always white)
- Hover states (use surface elevation)
- Decorative purposes
- "Making it pop"

---

## Token Reference

### Canvas & Surfaces

```css
--hivelab-canvas: #0A0A0A          /* Darkest - base layer */
--hivelab-bg: #0A0A0A              /* Alias for canvas */
--hivelab-grid: rgba(255,255,255,0.04)  /* Grid lines */

--hivelab-surface: #141414         /* Panels, cards */
--hivelab-surface-elevated: #1A1A1A  /* Floating elements */
--hivelab-surface-active: #242424   /* Active/selected */
--hivelab-surface-hover: #1F1F1F    /* Hover state */
--hivelab-panel: #1A1A1A           /* Panel background */
```

### Borders

```css
--hivelab-border: rgba(255,255,255,0.08)        /* Default */
--hivelab-border-hover: rgba(255,255,255,0.12)  /* Hover */
--hivelab-border-emphasis: rgba(255,255,255,0.16) /* Emphasized */
--hivelab-border-focus: rgba(255,255,255,0.2)   /* Focus rings */
```

### Text

```css
--hivelab-text-primary: #FAF9F7    /* Primary content */
--hivelab-text-secondary: #8A8A8A  /* Secondary, labels */
--hivelab-text-tertiary: #5A5A5A   /* Tertiary, hints */
--hivelab-text-muted: #4A4A4A      /* Disabled, placeholder */
```

### Node Elements

```css
--hivelab-node-body: #1A1A1A                    /* Node background */
--hivelab-node-header: #242424                  /* Node header */
--hivelab-node-border: rgba(255,255,255,0.08)   /* Default border */
--hivelab-node-border-hover: rgba(255,255,255,0.12)  /* Hover */
--hivelab-node-border-selected: rgba(212,175,55,0.5) /* Selected (gold) */
```

### Category Indicators

Each element category has a distinct dot color:

```css
--hivelab-dot-input: #FF6B6B    /* Red - input elements */
--hivelab-dot-display: #64B5F6  /* Blue - display elements */
--hivelab-dot-action: #FFB74D   /* Orange - action elements */
--hivelab-dot-logic: #BA68C8    /* Purple - logic elements */
--hivelab-dot-data: #D4AF37     /* Gold - data elements */
```

### Connections

```css
--hivelab-connection: #D4AF37                   /* Line color */
--hivelab-connection-glow: rgba(212,175,55,0.3) /* Glow effect */
```

---

## Motion Tiers

HiveLab uses a tiered motion system. All animations feel weighted and deliberate, never snappy or bouncy.

| Tier | Duration | Use Case | Token |
|------|----------|----------|-------|
| T4 | 100ms | Instant feedback, reduced motion fallback | `--hivelab-duration-instant` |
| T3 | 150ms | Hovers, toggles, micro-interactions | `--hivelab-duration-fast` |
| T2 | 200ms | Standard transitions, panel opens | `--hivelab-duration-normal` |
| T1 | 300ms | Emphasis transitions, mode changes | `--hivelab-duration-slow` |
| T0 | 700ms | Celebrations (deploy success) | `--hivelab-duration-celebration` |

### Easing

Always use premium easing for weighted, deliberate motion:

```typescript
const EASE = [0.22, 1, 0.36, 1]; // Framer Motion
// CSS: cubic-bezier(0.22, 1, 0.36, 1)
```

### Duration Classes

```css
/* Tailwind utilities */
duration-[var(--hivelab-duration-fast)]   /* T3: 150ms */
duration-[var(--hivelab-duration-normal)] /* T2: 200ms */
duration-200  /* T2 shorthand */
duration-150  /* T3 shorthand */
```

**Avoid:** `duration-160`, `duration-175`, or other non-standard values.

---

## Interaction States

### Focus Rings

All interactive elements must have visible focus states for keyboard navigation:

```css
focus-visible:ring-2
focus-visible:ring-white/50
focus-visible:ring-offset-2
focus-visible:ring-offset-[var(--hivelab-canvas)]
```

**Never use gold for focus rings.** Focus is about visibility, not celebration.

### Hover States

Use surface elevation, not color change:

```css
hover:bg-[var(--hivelab-surface-hover)]
/* or */
hover:bg-white/[0.04]
```

### Active/Selected States

```css
bg-[var(--hivelab-surface-active)]
border-[var(--hivelab-node-border-selected)]  /* Gold border for selected */
```

### Disabled States

```css
opacity-50 cursor-not-allowed
/* or */
text-[var(--hivelab-text-muted)]
```

---

## Empty States

Every container that can be empty must have an empty state.

### Pattern

```tsx
<div className="p-4 rounded-lg border border-dashed border-[var(--hivelab-border)] bg-[var(--hivelab-surface)]/30">
  <div className="text-center">
    <IconComponent className="h-6 w-6 text-[var(--hivelab-text-secondary)]/50 mx-auto mb-2" />
    <p className="text-sm text-[var(--hivelab-text-secondary)]">
      Primary message
    </p>
    <p className="text-xs text-[var(--hivelab-text-secondary)]/70 mt-1">
      Secondary suggestion
    </p>
  </div>
</div>
```

### Required Empty States

- Tools grid (no tools created)
- Deploy modal spaces list (no spaces led)
- Element palette search (no results)
- Layers panel (no elements on canvas)

---

## Loading States

### Skeleton Pattern

Replace spinners with content-shaped skeletons where possible:

```tsx
<div className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
```

Stagger animation delay for grid items:

```tsx
{Array.from({ length: 4 }).map((_, i) => (
  <div
    key={i}
    className="h-24 rounded-xl bg-white/[0.03] animate-pulse"
    style={{ animationDelay: `${i * 100}ms` }}
  />
))}
```

### When to Use Spinners

- Single-action loading (deploy button)
- Initial page load (before layout is known)
- Background operations

---

## Celebration Moments

### Deploy Success

Space deployments trigger the FlightAnimation celebration:
- 100ms: Card shrinks
- 200ms: Card begins flying
- 400ms: Particle trail appears
- 600ms: Card reaches destination
- 800ms: Burst effect at landing

Profile deployments use a simple gold checkmark (no animation).

### When Celebration is Earned

- Deploy to space (major accomplishment)
- Tool creation complete
- First tool built (onboarding milestone)

**Not celebration-worthy:**
- Save actions
- Navigation
- Form submissions

---

## Component Checklist

Before shipping any HiveLab component:

```
[ ] Uses --hivelab-* tokens (not --hive-*)
[ ] No hardcoded colors (#FFD700, #0A0A09, etc.)
[ ] Focus visible state defined
[ ] Hover state uses surface elevation
[ ] Empty state if applicable
[ ] Loading state if async
[ ] Motion uses token durations
[ ] Gold only at earned moments
```

---

## Migration Notes

When updating existing HiveLab components:

| Old Token | New Token |
|-----------|-----------|
| `--hive-text-primary` | `--hivelab-text-primary` |
| `--hive-text-secondary` | `--hivelab-text-secondary` |
| `--hive-border-primary` | `--hivelab-border` |
| `--hive-background-secondary` | `--hivelab-surface` |
| `--hive-brand-primary` | `--life-gold` |
| `text-hive-brand-on-gold` | `text-black` |
| `bg-hive-brand-hover` | `bg-[var(--life-gold)]/90` |
| `#FFD700` | `var(--life-gold)` |
| `#0A0A09` | `var(--hivelab-canvas)` |

---

## Related Docs

- `docs/DESIGN_PRINCIPLES.md` — Core HIVE design philosophy
- `docs/design-system/INDEX.md` — Design system index
- `packages/ui/src/tokens/motion.ts` — Motion constants
