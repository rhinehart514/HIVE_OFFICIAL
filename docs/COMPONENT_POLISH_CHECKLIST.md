# Component Polish Checklist

Use this checklist when auditing each component for expressive consistency.

---

## Motion Standards

| Property | Standard | Anti-pattern |
|----------|----------|--------------|
| Duration | `200ms` (quick) / `300ms` (standard) | Spring physics, 500ms+ |
| Easing | `ease-out` for exits, `ease-in-out` for transforms | `ease-in`, bounce |
| Hover | Subtle opacity change (`/90`) or background shift | Scale, glow, shadow |
| Focus | Ring only, no glow | `shadow-[0_0_*]` |
| Enter | Fade + small translate (`y: 4px`) | Scale, spring, elaborate |
| Exit | Fade out | Scale down, slide away |

**Framer Motion defaults:**
```tsx
transition={{ duration: 0.2 }}  // 200ms
initial={{ opacity: 0, y: 4 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0 }}
```

---

## Spacing Rhythm

Use the 4px base unit: `4, 8, 12, 16, 24, 32, 48, 64`

| Context | Gap | Tailwind |
|---------|-----|----------|
| Inline elements (icon + text) | 8px | `gap-2` |
| Form fields | 12px | `gap-3` |
| Section items | 16px | `gap-4` |
| Major sections | 24px | `gap-6` |
| Page sections | 32px | `gap-8` |

**Rule:** Adjacent similar items use tighter spacing. Different items use looser spacing.

---

## Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page title | `text-2xl` / `text-3xl` | `font-semibold` | `leading-tight` |
| Section heading | `text-lg` / `text-xl` | `font-semibold` | `leading-snug` |
| Card title | `text-base` | `font-medium` | `leading-normal` |
| Body | `text-sm` | `font-normal` | `leading-relaxed` |
| Caption/meta | `text-xs` | `font-normal` | `leading-normal` |

---

## Color Usage

| Context | Token | Anti-pattern |
|---------|-------|--------------|
| Primary background | `bg-background-primary` | `bg-black`, `bg-[#000]` |
| Card background | `bg-background-secondary` | `bg-white/10` |
| Tertiary surface | `bg-background-tertiary` | `bg-white/5` |
| Primary text | `text-text-primary` | `text-white` |
| Secondary text | `text-text-secondary` | `text-white/70` |
| Muted text | `text-text-muted` | `text-white/50` |
| Border default | `border-border-default` | `border-white/10` |
| Border subtle | `border-border-subtle` | `border-white/6` |

**Gold rule (5%):** Only for CTAs, achievements, featured content. Never on hover.

---

## Shadow & Elevation

**Minimal shadows.** Most components should be `shadow-none`.

| Use Case | Shadow | When |
|----------|--------|------|
| Default card | None | Most cards |
| Elevated modal | `shadow-lg` | Modals, dropdowns |
| Floating element | `shadow-md` | Tooltips, popovers |

**Anti-pattern:** `shadow-xl`, `shadow-2xl`, `shadow-[0_25px_*]`, glow effects

---

## Border Radius

| Element | Radius | Tailwind |
|---------|--------|----------|
| Button | Full | `rounded-full` |
| Card | Large | `rounded-xl` |
| Input | Medium | `rounded-lg` |
| Badge | Full | `rounded-full` |
| Modal | XL | `rounded-2xl` |

---

## Interactive States

### Hover
```tsx
// Buttons
hover:bg-{color}/90  // Opacity shift only

// Cards
hover:bg-background-tertiary/50  // Subtle background change

// Links
hover:underline  // Text decoration only
```

### Focus
```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-interactive-focus
focus-visible:ring-offset-2
focus-visible:ring-offset-background-primary
```

### Disabled
```tsx
disabled:opacity-50
disabled:cursor-not-allowed
disabled:pointer-events-none
```

### Active
```tsx
active:translate-y-[1px]  // Subtle press feedback
```

---

## Checklist Per Component

When auditing a component, verify:

- [ ] **Motion**: Uses 200ms/300ms, no spring physics
- [ ] **Hover**: Opacity or background only, no scale/glow/shadow
- [ ] **Focus**: Ring only, no glow shadows
- [ ] **Spacing**: Uses rhythm (gap-2, gap-3, gap-4, gap-6, gap-8)
- [ ] **Typography**: Uses standard sizes/weights
- [ ] **Colors**: Uses semantic tokens, no hardcoded values
- [ ] **Shadows**: Minimal or none
- [ ] **Borders**: Uses token colors (border-default, border-subtle)
- [ ] **Radius**: Consistent with component type

---

## Priority Components

### P0 - High Impact (polish first)
1. Button
2. Input
3. Card / Surface
4. Badge
5. Avatar
6. Modal / Dialog

### P1 - Medium Impact
7. Dropdown / Select
8. Toast / Alert
9. Tabs
10. Navigation items

### P2 - Lower Impact
11. Progress
12. Skeleton
13. Tooltip
14. Checkbox / Radio

---

## Example Audit

### Before (StatCard)
```tsx
className="shadow-[0_25px_65px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur-xl"
// Plus gradient overlay
```

### After (StatCard)
```tsx
className="border border-white/6 bg-background-tertiary"
// No overlay, no shadow, no blur
```

**What changed:**
- Removed excessive shadow
- Removed ring
- Removed backdrop-blur
- Removed gradient overlay
- Simplified to semantic token + border
