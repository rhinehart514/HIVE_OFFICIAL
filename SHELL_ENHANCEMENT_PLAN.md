# Shell Enhancement Plan — Add Drama to Existing Navigation

**Goal:** Introduce the side rail with /about-level drama without rebuilding the architecture.

**Strategy:** Enhance the existing AppShell.tsx with premium motion and life signals.

---

## What We Keep

✅ Collapsible sidebar (64px → 240px)
✅ Current nav structure (Feed, Spaces, Tools, Profile, Settings)
✅ Gold active indicator with layoutId
✅ Mobile drawer
✅ Premium easing (already using EASE from /about)
✅ Page transitions

---

## What We Add

### 1. **Noise Texture** (2am atmosphere)

```tsx
import { NoiseOverlay } from '@hive/ui/design-system/primitives';

<motion.aside className="...">
  {/* Add this */}
  <NoiseOverlay opacity={0.03} />

  {/* Rest of sidebar content */}
</motion.aside>
```

**Effect:** Subtle grain like /about. Makes the dark feel rich, not flat.

---

### 2. **Gradient Edge Glow** (when expanded)

```tsx
<motion.aside className="...">
  {/* Add after NoiseOverlay */}
  <motion.div
    className="absolute right-0 top-0 bottom-0 w-[1px] pointer-events-none"
    style={{
      background: 'linear-gradient(180deg, transparent 0%, var(--color-gold)/20 50%, transparent 100%)',
    }}
    initial={{ opacity: 0 }}
    animate={{ opacity: isExpanded ? 1 : 0 }}
    transition={{ duration: 0.6, ease: EASE }}
  />

  {/* Rest of sidebar */}
</motion.aside>
```

**Effect:** Gold gradient appears on right edge when expanded. Ceremonial.

---

### 3. **Hover Lift + Glass Reveal** (nav items)

**Current:**
```tsx
<button
  className={cn(
    'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
    active ? '...' : 'text-white/40 hover:text-white/70 ...'
  )}
>
```

**Enhanced:**
```tsx
<motion.button
  className={cn(
    'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
    active ? 'text-white' : 'text-white/40'
  )}
  whileHover={{ scale: 1.02, x: 4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.3, ease: EASE }}
>
  {/* Glass container that appears on hover */}
  <motion.div
    className="absolute inset-0 rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm"
    initial={{ opacity: 0 }}
    whileHover={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  />

  {/* Active indicator - keep existing */}
  {active && (
    <motion.div
      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
      style={{
        background: 'linear-gradient(90deg, var(--color-gold) 0%, transparent 100%)',
        boxShadow: '0 0 8px 2px rgba(255,215,0,0.3)',
      }}
      layoutId="active-indicator"
      transition={{ duration: 0.2, ease: EASE }}
    />
  )}

  {/* Icon + Label - keep existing logic */}
  <Icon className="flex-shrink-0 relative z-10" size={20} />

  <AnimatePresence mode="wait">
    {isExpanded && (
      <motion.span
        className="text-[14px] font-medium whitespace-nowrap relative z-10"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
      >
        {item.label}
      </motion.span>
    )}
  </AnimatePresence>
</motion.button>
```

**Changes:**
- Button is now `motion.button` not plain `button`
- `whileHover={{ scale: 1.02, x: 4 }}` — Lift + shift right
- `whileTap={{ scale: 0.98 }}` — Press down feedback
- Glass container `motion.div` appears on hover
- Active indicator gets glow shadow
- Icon and label get `relative z-10` to sit above glass

---

### 4. **Breathing Logo** (life signal)

**Current:**
```tsx
<Logo variant={isExpanded ? "wordmark" : "mark"} size="sm" color="gold" />
```

**Enhanced:**
```tsx
<motion.div
  className="relative"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  {/* Subtle breathing animation */}
  <motion.div
    animate={{
      opacity: [1, 0.8, 1],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <Logo
      variant={isExpanded ? "wordmark" : "mark"}
      size="sm"
      color="gold"
    />
  </motion.div>
</motion.div>
```

**Effect:** Logo subtly pulses (opacity 1 → 0.8 → 1) over 4 seconds. Like breathing.

---

### 5. **Expand Button — Ceremonial**

**Current:**
```tsx
{!isExpanded && (
  <button
    onClick={onToggle}
    className="mx-2 mb-4 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
  >
    <Menu size={20} className="text-white/40" />
  </button>
)}
```

**Enhanced:**
```tsx
{!isExpanded && (
  <motion.button
    onClick={onToggle}
    className="relative mx-2 mb-4 p-2.5 rounded-xl overflow-hidden"
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    transition={{ duration: 0.3, ease: EASE }}
  >
    {/* Gold glow on hover */}
    <motion.div
      className="absolute inset-0 rounded-xl"
      style={{
        background: 'radial-gradient(circle at center, var(--color-gold)/10 0%, transparent 70%)',
      }}
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    />

    {/* Icon */}
    <Menu size={20} className="text-white/40 relative z-10" />
  </motion.button>
)}
```

**Effect:** Button scales on hover/tap. Gold radial gradient appears behind icon.

---

### 6. **Animated Section Dividers**

**Current:**
```tsx
<div className="py-4 px-2 space-y-1 border-t border-white/[0.06]">
```

**Enhanced:**
```tsx
<div className="py-4 px-2 space-y-1">
  {/* Animated divider */}
  <motion.div
    className="h-[1px] mb-4 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
  />

  {/* Bottom items */}
</div>
```

**Effect:** Divider draws itself in from center when sidebar mounts.

---

### 7. **Sign Out — Subtle Drama**

**Current:**
```tsx
<button
  onClick={handleSignOut}
  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.02] transition-colors"
>
  <LogOut size={20} />
  {isExpanded && <span>Sign Out</span>}
</button>
```

**Enhanced:**
```tsx
<motion.button
  onClick={handleSignOut}
  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40"
  whileHover={{
    scale: 1.02,
    color: 'rgba(255, 255, 255, 0.7)',
  }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.3, ease: EASE }}
>
  {/* Glass on hover */}
  <motion.div
    className="absolute inset-0 rounded-xl bg-white/[0.02]"
    initial={{ opacity: 0 }}
    whileHover={{ opacity: 1 }}
  />

  <LogOut size={20} className="relative z-10" />
  {isExpanded && (
    <motion.span
      className="relative z-10"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
    >
      Sign Out
    </motion.span>
  )}
</motion.button>
```

---

## Implementation Steps

### Step 1: Add Imports

```tsx
// At top of AppShell.tsx
import { NoiseOverlay } from '@hive/ui/design-system/primitives';
```

### Step 2: Enhance Sidebar Component

Add these elements to the `<motion.aside>`:
- NoiseOverlay
- Gradient edge glow
- Animated dividers

### Step 3: Replace Buttons with motion.button

Change all `<button>` elements in nav to `<motion.button>` with:
- `whileHover={{ scale: 1.02, x: 4 }}`
- `whileTap={{ scale: 0.98 }}`
- Glass container div

### Step 4: Add Breathing Logo

Wrap Logo component in motion.div with opacity animation.

### Step 5: Polish Active Indicator

Add `boxShadow` to the gold active line for glow effect.

### Step 6: Test Motion

- Hover each nav item → Should lift + shift right
- Click nav item → Should press down then expand
- Expand sidebar → Should see gold edge glow fade in
- Logo → Should breathe subtly

---

## Mobile Considerations

Mobile drawer already has good transitions. Add:
- NoiseOverlay
- Glass containers on nav items
- Same hover/tap states (for touch feedback)

---

## Performance Notes

All animations use GPU-accelerated properties:
- ✅ `transform` (scale, translate)
- ✅ `opacity`
- ✅ `filter` (backdrop-blur)

Avoid:
- ❌ Animating `width` on individual items (only on sidebar)
- ❌ Animating `color` (use opacity on colored overlays instead)
- ❌ Layout-shifting animations

---

## Visual Diff

### Before (Current)
```
Flat icon → Flat color change → Static line
```

### After (Enhanced)
```
Icon + lift → Glass reveal → Glowing gold line
     ↓              ↓              ↓
  Drama        Depth          Ceremony
```

---

## Gold Budget Check

Gold appears:
1. Logo (always visible)
2. Active indicator (current route + glow)
3. Expand button hover (radial behind icon)
4. Edge glow when expanded (gradient)

**Total:** ~1% of sidebar. Within budget.

---

## The Feeling

**Current:** Clean, functional, works.

**Enhanced:**
- Breathes (logo pulse)
- Anticipates (hover lift)
- Responds (tap scale)
- Glows (gold accents)
- Has depth (glass, noise, gradients)
- Feels premium (weighted transitions)

**Still:** Same structure, same routes, same behavior. Just feels alive.

---

## Files to Modify

```
apps/web/src/components/layout/AppShell.tsx
  - Add NoiseOverlay import
  - Change buttons to motion.button
  - Add glass containers
  - Add gradient edge
  - Add breathing logo
  - Add animated dividers
```

No new files. Just enhance existing component.

---

## Next Action

Should I:
1. **Write the enhanced AppShell.tsx** with all these changes?
2. **Create a separate DramaticAppShell.tsx** to test alongside current?
3. **Make a PR-ready diff** showing exact line changes?

What feels right?
