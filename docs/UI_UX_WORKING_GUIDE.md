# HIVE UI/UX Working Guide

> Daily reference for building and polishing HIVE interfaces.
> **Target**: December 9-13, 2025 - UB Production Launch

---

## Quick Reference

### Color Tokens (Semantic Only)

```css
/* Backgrounds */
--background-primary: #000000      /* Main surfaces */
--background-secondary: #0A0A0A    /* Elevated surfaces */
--background-tertiary: #141414     /* Cards, modals */

/* Text */
--text-primary: #FFFFFF            /* Headlines, primary content */
--text-secondary: #D4D4D4          /* Body text */
--text-tertiary: #A3A3A3           /* Captions, hints */
--text-muted: #525252              /* Disabled states */

/* Brand */
--brand-gold: #D4AF37              /* CTAs, achievements ONLY (5% rule) */

/* Interactive */
--hover: rgba(255,255,255,0.04)    /* Hover backgrounds */
--active: rgba(255,255,255,0.08)   /* Active/pressed */
--focus: rgba(255,255,255,0.20)    /* Focus rings */

/* Borders */
--border-default: rgba(255,255,255,0.10)
--border-subtle: rgba(255,255,255,0.05)
```

### Typography

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display-lg` | 40px | 600 | Hero headlines |
| `display-md` | 32px | 600 | Page titles |
| `heading-lg` | 24px | 600 | Section headers |
| `heading-md` | 20px | 600 | Card titles |
| `heading-sm` | 16px | 600 | Subsections |
| `body-lg` | 16px | 400 | Primary content |
| `body-md` | 14px | 400 | Secondary content |
| `body-sm` | 12px | 400 | Captions |
| `mono` | 14px | 400 | Handles, timestamps |

**Font Stack**: `Geist Sans` (UI), `JetBrains Mono` (code/handles)

### Spacing (4px Grid)

```css
--space-1: 4px    /* Tight gaps */
--space-2: 8px    /* Default gap */
--space-3: 12px   /* Component padding */
--space-4: 16px   /* Section padding */
--space-6: 24px   /* Card padding */
--space-8: 32px   /* Section gaps */
--space-12: 48px  /* Page sections */
```

### Border Radius

```css
--radius-xs: 6px      /* Badges, chips */
--radius-sm: 10px     /* Buttons, inputs */
--radius-md: 14px     /* Cards */
--radius-lg: 22px     /* Modals, sheets */
--radius-full: 9999px /* Avatars, pills */
```

---

## Component Patterns

### Buttons

```tsx
// Primary - Gold accent (sparingly)
<Button variant="primary">Create Post</Button>

// Secondary - Most common
<Button variant="secondary">View Details</Button>

// Ghost - Minimal weight
<Button variant="ghost">Cancel</Button>

// Destructive
<Button variant="destructive">Delete</Button>
```

**States**:
- Default: Base color
- Hover: +4% white overlay
- Active: +8% white overlay
- Disabled: 50% opacity, no pointer events

### Cards

```tsx
<Card className="bg-background-tertiary border border-border-default rounded-md p-6">
  <CardHeader>
    <CardTitle className="text-heading-md">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-body-md text-text-secondary">
    Content here
  </CardContent>
</Card>
```

### Inputs

```tsx
<Input
  placeholder="Search..."
  className="bg-background-secondary border-border-default focus:ring-2 focus:ring-focus"
/>
```

---

## Animation Tokens

### Durations

```css
--duration-instant: 50ms   /* Micro feedback */
--duration-fast: 150ms     /* Hovers, toggles */
--duration-normal: 200ms   /* Standard transitions */
--duration-slow: 300ms     /* Modals, reveals */
--duration-glacial: 500ms  /* Page transitions */
```

### Easings

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)      /* Enter animations */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)  /* Continuous motion */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) /* Bouncy feedback */
```

### Common Patterns

```css
/* Hover state */
transition: background-color var(--duration-fast) var(--ease-out);

/* Modal entry */
animation: slideUp var(--duration-slow) var(--ease-out);

/* Button press */
transform: scale(0.98);
transition: transform var(--duration-instant) var(--ease-spring);
```

---

## Cognitive Budgets

**Hard limits to prevent UI clutter:**

| Context | Constraint | Value |
|---------|------------|-------|
| Space Board | Max pinned posts | 2 |
| Space Board | Max rail widgets | 3 |
| Space Board | Max tool fields | 8 |
| Feed | Max rail widgets | 3 |
| Profile | Max rail widgets | 3 |
| Profile | Max card CTAs | 2 |
| HiveLab | Max tool fields | 12 |

```tsx
import { useCognitiveBudget, useEnforceBudget } from '@hive/hooks';

// Get budget value
const maxPins = useCognitiveBudget('spaceBoard', 'maxPins'); // 2

// Auto-enforce with array slice
const visiblePins = useEnforceBudget('spaceBoard', 'maxPins', allPins);
```

---

## Golden Rules

### 1. Gold Accent (5% Rule)
Use `--brand-gold` ONLY for:
- Primary CTAs
- Achievements/badges
- Active presence indicators
- Featured content

**NEVER** for: Hovers, borders, backgrounds, secondary actions

### 2. Mobile First (80% Usage)
- Touch targets: 44px minimum
- Bottom nav: 5 items max
- Swipe gestures: Back navigation
- Pull-to-refresh: All feeds

### 3. Loading States
Every data-dependent UI needs:
- Skeleton loader (shimmer animation)
- Error state with retry CTA
- Empty state with action prompt

### 4. Accessibility
- Focus visible on all interactive elements
- 4.5:1 contrast ratio minimum
- Keyboard navigation for all flows
- ARIA labels for icons

---

## State Patterns

### Loading
```tsx
{isLoading && <Skeleton className="h-20 w-full" />}
```

### Error
```tsx
{error && (
  <ErrorCard
    message={error.message}
    onRetry={refetch}
  />
)}
```

### Empty
```tsx
{data.length === 0 && (
  <EmptyState
    icon={<InboxIcon />}
    title="No posts yet"
    description="Be the first to share something"
    action={<Button>Create Post</Button>}
  />
)}
```

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px)  { /* sm: Tablet */ }
@media (min-width: 768px)  { /* md: Desktop */ }
@media (min-width: 1024px) { /* lg: Large screens */ }
@media (min-width: 1280px) { /* xl: Wide screens */ }
```

### Layout Patterns

**Mobile (<768px)**:
- Full width content
- Bottom navigation (5 tabs)
- Stacked layouts

**Desktop (≥768px)**:
- 240px sidebar
- Content with left margin
- Side-by-side layouts

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| FCP | < 1.8s | Varies |
| LCP | < 2.5s | Varies |
| CLS | < 0.1 | Good |
| FID | < 100ms | Good |

### Optimization Techniques
- Virtualize lists > 50 items
- Lazy load images
- Code split routes
- Preload critical fonts

---

## File References

| Document | Purpose |
|----------|---------|
| `UX-UI-TOPOLOGY.md` | Master design system |
| `DESIGN_TOKENS_GUIDE.md` | Token layer system |
| `UI_UX_POLISH_GUIDE.md` | 5-week polish framework |
| `FEATURE_TOPOLOGY_REGISTRY.md` | Route/component mapping |
| `COGNITIVE_BUDGETS.md` | SlotKit constraints |

---

## Development Workflow

1. **Before building**: Check existing components in `@hive/ui`
2. **Use semantic tokens**: Never hardcode colors
3. **Enforce budgets**: Use cognitive budget hooks
4. **Test states**: Loading, error, empty, success
5. **Check mobile**: Test at 375px width
6. **Verify a11y**: Keyboard nav, focus states

---

*Last updated: November 2025*
