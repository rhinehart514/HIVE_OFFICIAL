# Interaction States

Consistent state feedback across all interactive elements.

---

## State Conventions

Every interactive element must handle these states:

| State | Purpose | User Signal |
|-------|---------|-------------|
| **Default** | Resting appearance | "I exist" |
| **Hover** | Mouse over (desktop) | "You can interact" |
| **Focus** | Keyboard/tab selection | "I'm selected" |
| **Active/Pressed** | Being clicked/tapped | "Action in progress" |
| **Disabled** | Cannot interact | "Not available" |
| **Loading** | Processing | "Working on it" |

---

## Hover State

Subtle acknowledgment of interaction potential.

### For Text & Icons

```css
/* Muted → Full opacity */
opacity: 0.5 → 1
transition: opacity 150ms ease-out
```

```tsx
<button className="text-white/50 hover:text-white transition-opacity">
  Click me
</button>
```

### For Cards & Surfaces

```css
/* Add subtle highlight */
background: transparent → white/[0.02]
border-color: white/[0.06] → white/[0.12]
transition: all 150ms ease-out
```

```tsx
<div className="bg-transparent hover:bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all">
  Card content
</div>
```

### Hover Rules

1. **Never scale on hover** — Breaks HIVE's calm aesthetic
2. **Never use colored hovers** — White only (gold is earned)
3. **Keep it subtle** — Opacity changes, not dramatic effects
4. **150ms transition** — Fast enough to feel responsive

---

## Focus State

For keyboard navigation. White ring, never colored.

```css
/* Standard focus ring */
outline: none
ring: 2px solid white/20
ring-offset: 0
```

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-white/20">
  Focusable
</button>

/* Or with focus-visible for mouse users */
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20">
  Focusable
</button>
```

### Focus Rules

1. **Always white ring** — Never gold, never colored
2. **Always visible** — Never remove focus indicators
3. **Use focus-visible** — Hide for mouse, show for keyboard
4. **2px ring** — Consistent width

---

## Active/Pressed State

Immediate feedback on interaction.

```css
/* Slight opacity reduction */
opacity: 0.9
transform: none  /* No scale */
transition: opacity 100ms ease-out
```

```tsx
<button className="active:opacity-90 transition-opacity">
  Press me
</button>
```

### Active Rules

1. **No scale transforms** — Calm, not bouncy
2. **Subtle opacity** — 90% is enough
3. **Fast transition** — 100ms or less
4. **No color change** — Stays same color family

---

## Disabled State

Clear indication that interaction is blocked.

```css
opacity: 0.5
pointer-events: none
cursor: not-allowed
```

```tsx
<button
  disabled
  className="disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
>
  Can't click
</button>
```

### Disabled Rules

1. **50% opacity** — Clearly muted
2. **Remove pointer events** — Prevent accidental clicks
3. **Not-allowed cursor** — Visual confirmation
4. **Preserve layout** — Don't hide disabled elements

---

## Loading State

Show progress without losing context.

### Button Loading

```tsx
<Button loading>
  <Spinner className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
```

Rules:
- **Preserve button text** — Shows what's happening
- **Add spinner** — Visual progress indicator
- **Disable interaction** — Prevent double-submit
- **Same dimensions** — Don't change button size

### Content Loading (Skeleton)

```tsx
<div className="animate-pulse">
  <div className="h-4 bg-white/[0.06] rounded w-3/4 mb-2" />
  <div className="h-4 bg-white/[0.06] rounded w-1/2" />
</div>
```

Rules:
- **Match content shape** — Skeleton matches final layout
- **Subtle animation** — Pulse, not shimmer
- **White/6% background** — Consistent with surface system

### Full Page Loading

```tsx
<div className="flex items-center justify-center min-h-[200px]">
  <Spinner className="h-8 w-8 text-white/50" />
</div>
```

---

## Color in States

Color signals meaning. Use sparingly.

| State | Color | When |
|-------|-------|------|
| Default | `white/50-70` | Normal content |
| Hover | `white/90-100` | Interactive feedback |
| Focus | `white` ring | Keyboard navigation |
| Success | `life-gold` | Earned moments only |
| Error | `red-400` | Validation failures |
| Warning | `amber-400` | Caution states |

### Success State

```tsx
// Success feedback
<div className="text-life-gold">
  ✓ Saved successfully
</div>

// Success border
<div className="border-life-gold/50">
  Complete
</div>
```

### Error State

```tsx
// Error message
<p className="text-red-400 text-sm mt-1">
  This field is required
</p>

// Error border
<input className="border-red-400 focus:border-red-400" />
```

---

## Gold Usage (Earned Only)

Gold (`life-gold`, `#FFD700`) signals accomplishment, not decoration.

### Gold Appears When:

- ✅ User accomplishes something (task complete, goal reached)
- ✅ User takes final action ("Enter HIVE", "Submit")
- ✅ Something is live/active (presence dot, "Now Live")
- ✅ Achievement unlocks

### Gold Never Appears For:

- ❌ Decoration or emphasis
- ❌ Hover states
- ❌ Focus rings (always white)
- ❌ Default CTAs (gold is earned)
- ❌ "Making it pop"

### Gold Implementation

```tsx
// Presence indicator (live)
<span className="h-2 w-2 rounded-full bg-life-gold animate-pulse" />

// Success message
<p className="text-life-gold">Profile complete!</p>

// Primary CTA (final action)
<Button variant="gold">Enter HIVE</Button>
```

---

## Button State Summary

Complete button state pattern:

```tsx
<button
  className={cn(
    // Base
    "px-4 py-2 rounded-lg font-medium",
    "bg-white/10 text-white",

    // States
    "hover:bg-white/[0.15]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
    "active:opacity-90",
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",

    // Transition
    "transition-all duration-150"
  )}
>
  Button
</button>
```

---

## Input State Summary

Complete input state pattern:

```tsx
<input
  className={cn(
    // Base
    "w-full px-3 py-2 rounded-lg",
    "bg-white/[0.06] border border-white/[0.08]",
    "text-white placeholder:text-white/40",

    // States
    "hover:border-white/[0.12]",
    "focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20",
    "disabled:opacity-50 disabled:cursor-not-allowed",

    // Error state (conditional)
    error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",

    // Transition
    "transition-all duration-150"
  )}
/>
```

---

## Card State Summary

Complete card state pattern:

```tsx
<div
  className={cn(
    // Base
    "rounded-xl p-4",
    "bg-white/[0.04] border border-white/[0.06]",

    // States
    "hover:bg-white/[0.06] hover:border-white/[0.10]",
    "focus-within:ring-2 focus-within:ring-white/20",

    // Transition
    "transition-all duration-150"
  )}
>
  Card content
</div>
```

---

## Accessibility Requirements

1. **Focus visible for keyboard** — Never hide focus indicators
2. **Color is not the only indicator** — Use icons/text with color
3. **Disabled states are clear** — Opacity + cursor change
4. **Loading states are announced** — Use aria-busy, aria-live
5. **Touch targets are 44px minimum** — Mobile accessibility

```tsx
// Announce loading
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? "Loading..." : content}
</div>

// Touch target
<button className="min-h-[44px] min-w-[44px]">
  <Icon className="h-5 w-5" />
</button>
```

---

## Animation Timing

From the motion tier system:

| State Change | Duration | Easing |
|-------------|----------|--------|
| Hover in/out | 150ms | ease-out |
| Focus ring | 150ms | ease-out |
| Active press | 100ms | ease-out |
| Loading appear | 200ms | ease-out |
| Skeleton pulse | 1500ms | ease-in-out |

---

## Anti-Patterns

**Don't do this:**

```tsx
// ❌ Scale on hover
<div className="hover:scale-105">

// ❌ Colored focus rings
<button className="focus:ring-blue-500">

// ❌ Gold on hover
<button className="hover:text-life-gold">

// ❌ Remove focus indicators
<button className="focus:outline-none">  // Without replacement ring

// ❌ Inconsistent disabled opacity
<button className="disabled:opacity-30">  // Should be 50
```

**Do this instead:**

```tsx
// ✓ Opacity on hover
<div className="hover:bg-white/[0.06]">

// ✓ White focus rings
<button className="focus:ring-white/20">

// ✓ Gold only for earned states
<button className="text-life-gold">✓ Complete</button>

// ✓ Visible focus with ring
<button className="focus:outline-none focus:ring-2 focus:ring-white/20">

// ✓ Consistent disabled
<button className="disabled:opacity-50">
```

---

## Reference

| Token File | Purpose |
|------------|---------|
| `packages/tokens/src/motion.ts` | Animation timing |
| `packages/ui/src/design-system/primitives/` | Component implementations |
| `docs/design-system/PRINCIPLES.md` | Design rules |

---

*States communicate system response. Consistency builds trust. Gold is earned, not given.*
