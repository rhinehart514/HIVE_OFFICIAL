# HIVE Platform Revolution: Launch-Ready Redesign

**Status:** DOCUMENTED (Ready for implementation)
**Scope:** Revolution (complete rethink)
**Timeline:** 1 month+
**Created:** 2026-01-29

---

## Executive Summary

Transform HIVE from 65% launch-ready to OpenAI-release quality through:
1. **IA Simplification** - 5-pillar → 4-pillar navigation, merge Feed+Spaces into unified Home
2. **VA Consolidation** - Single token source of truth, fix 476 hardcoded values
3. **UX Standardization** - 7 canonical motion patterns, unified state system

---

## Current State Assessment

| Area | Status | Key Issues |
|------|--------|------------|
| **IA** | ~65% | Core 4-pillar works. Missing: query-param views, `/u/[handle]`, `/explore` |
| **VA** | ~85% | Premium token system exists but 476 hardcoded values in app code |
| **UX** | ~75% | Entry flow polished. Inconsistent timing, missing async feedback |

### What Works Well
- Entry/onboarding flow is premium (emotional states, gold moments)
- 4-pillar IA is clean (Feed | Spaces | Lab | Profile)
- Design tokens are sophisticated (motion, density, warmth)
- Unified activity feed architecture
- Cold-start/empty states covered

### Critical Gaps
1. **Consistency** - Hardcoded colors/timing throughout app code
2. **Missing routes** - `/explore`, `/u/[handle]`, query-param views
3. **Async feedback** - Loading states during joins/creates/deletes
4. **Motion unification** - Tokens scattered across 5+ files

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Token Consolidation

**Goal:** Single source of truth for all visual values

**Current state:** 5+ token files with duplicates/conflicts
- `packages/tokens/src/motion.ts`
- `packages/ui/src/tokens/motion.ts`
- `packages/ui/src/tokens/spaces-motion.ts`
- `apps/web/src/components/entry/motion/entry-motion.ts`
- `packages/ui/src/lib/motion-variants.ts`

**New structure:**
```
packages/ui/src/tokens/
├── foundation.css     # All CSS variables (colors, spacing, radius)
├── motion.ts          # All motion values (TypeScript for Framer)
├── density.ts         # Density system (exists, keep)
├── variants/          # Framer Motion variants
│   ├── reveal.ts      # Page entrance
│   ├── surface.ts     # Cards, panels
│   ├── cascade.ts     # List stagger
│   ├── overlay.ts     # Modals
│   ├── snap.ts        # Micro interactions
│   └── celebrate.ts   # Gold moments
└── index.ts           # Single export point
```

**Files to modify:**
- `packages/ui/src/tokens/motion.ts` - Keep as source, align durations
- `packages/ui/src/design-system/tokens.css` - Consolidate with globals.css
- `apps/web/src/app/globals.css` - Remove duplicates, import tokens.css

### 1.2 Hardcoded Value Migration

**Goal:** Zero hardcoded colors in app code

**Current state:** 476 instances across 94 files

**Priority files (10+ instances each):**
1. `apps/web/src/app/resources/page.tsx` (18)
2. `apps/web/src/app/lab/[toolId]/components/element-popover.tsx` (15)
3. `apps/web/src/components/entry/screens/ClaimScreen.tsx` (14)
4. `apps/web/src/app/leaders/page.tsx` (12)
5. `apps/web/src/app/spaces/components/WelcomeOverlay.tsx` (11)

**Migration pattern:**
```tsx
// Before
<div className="bg-[#141414] text-[#A1A1A6]">

// After
<div className="bg-elevated text-secondary">
```

### 1.3 Primitive Standardization

**Rules (from VISUAL_DIRECTION.md):**
- Focus ring: `ring-white/50` (NEVER gold)
- Hover: brightness/opacity (NEVER scale)

**Files to audit:**
- `packages/ui/src/design-system/primitives/Button.tsx`
- `packages/ui/src/design-system/primitives/Input.tsx`
- `packages/ui/src/design-system/primitives/Card.tsx`
- All interactive primitives

---

## Phase 2: Information Architecture (Weeks 2-3)

### 2.1 Route Structure

**Current:** 5-pillar (Feed | Spaces | Explore | Lab | Profile)
**New:** 4-pillar (Home | Explore | Lab | You)

**New route hierarchy:**
```
/home              # Merge Feed + Spaces (new)
/explore           # Discovery hub with tabs
/lab               # Builder dashboard (unchanged)
/me                # Own profile + settings (new)
/u/[handle]        # Public profile URLs (new)
/s/[handle]        # Space residence (unchanged)
/s/[handle]?board=[id]   # Board view via query param (new)
/s/[handle]?thread=[id]  # Thread view via query param (new)
```

### 2.2 Create /home Route

**Goal:** Single unified dashboard replacing /feed and /spaces

**Sections (in order):**
1. Today (events + unread) - PRIMARY
2. Your Spaces (tiles with activity) - SECONDARY
3. This Week (upcoming) - SECONDARY
4. Your Creations (tools, if builder) - TERTIARY
5. Discover (recommendations) - TERTIARY

**Files to create/modify:**
- `apps/web/src/app/home/page.tsx` - New unified page
- `apps/web/src/app/feed/page.tsx` - Redirect to /home
- `apps/web/src/app/spaces/page.tsx` - Redirect to /home
- `apps/web/src/components/layout/AppShell.tsx` - Update nav

### 2.3 Add /u/[handle] Route

**Goal:** Shareable profile URLs

**Files to create:**
- `apps/web/src/app/u/[handle]/page.tsx` - Handle resolver + profile
- Update `apps/web/src/app/profile/[id]/page.tsx` - Redirect to /u/

### 2.4 Add /me Route

**Goal:** Own profile hub

**Files to create:**
- `apps/web/src/app/me/page.tsx` - Profile + settings
- `apps/web/src/app/me/edit/page.tsx` - Edit profile
- `apps/web/src/app/me/settings/page.tsx` - Settings

### 2.5 Navigation Update

**Desktop:** Sidebar with 4 items
```
Home | Explore | Lab | You
```

**Mobile:** Bottom nav
```
[Home] [Explore] [Lab] [You]
```

**Files to modify:**
- `apps/web/src/components/layout/AppShell.tsx`
- Create `apps/web/src/components/nav/BottomNav.tsx`

---

## Phase 3: Motion System (Weeks 3-4)

### 3.1 Seven Canonical Patterns

| Pattern | Duration | Easing | Use Case |
|---------|----------|--------|----------|
| **REVEAL** | 800ms | premium | Page entrances, major surfaces |
| **SURFACE** | spring | snappy | Cards, panels, drawers |
| **MORPH** | spring | base | Inline state transforms |
| **CASCADE** | 40ms stagger | smooth | List items, grids |
| **OVERLAY** | 200ms + spring | smooth | Modals, dialogs, command palette |
| **SNAP** | 150ms | sharp | Buttons, toggles, hover states |
| **CELEBRATE** | custom | bounce | Gold moments, achievements |

### REVEAL (Page Entrance)
```typescript
export const REVEAL = {
  initial: { opacity: 0, y: 24, scale: 0.97, filter: 'blur(6px)' },
  animate: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
  exit: { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.3 } },
};
```

### SURFACE (Cards, Panels)
```typescript
export const SURFACE = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.2 } },
};
```

### CASCADE (List Stagger)
```typescript
export const CASCADE = {
  container: {
    animate: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
  },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: {
      opacity: 1, y: 0,
      transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
    },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  },
};
```

### CELEBRATE (Gold Moments)
```typescript
export const CELEBRATE = {
  pulse: {
    scale: [1, 1.15, 1],
    transition: { type: 'spring', stiffness: 300, damping: 15 },
  },
  glow: {
    boxShadow: [
      '0 0 0 0px rgba(255, 215, 0, 0)',
      '0 0 0 8px rgba(255, 215, 0, 0.3)',
      '0 0 0 0px rgba(255, 215, 0, 0)',
    ],
    transition: { duration: 0.6 },
  },
};
```

### 3.2 Apply Patterns

**Entry Flow:** Keep premium (1.2-1.5s) - extract to shared
**Space Residence:** Use REVEAL for page, SURFACE for cards, CASCADE for messages
**HiveLab:** Use SURFACE for panels, CASCADE for tool grid

---

## Phase 4: State System (Weeks 4-5)

### 4.1 Loading States

**Skeleton pattern:**
- Staggered pulse animation (0.05s offset)
- Match final layout dimensions
- 1.5s cycle duration

**Spinner pattern:**
- Inline with buttons during async operations
- 3 sizes: sm (16px), md (20px), lg (24px)

### 4.2 Empty States

| Surface | New User | Filtered | Cleared |
|---------|----------|----------|---------|
| Home/Feed | "Join spaces" + CTA | "Nothing matches" | "All caught up" |
| Spaces | "Discover your community" | "No results" | "Claim first space" |
| Notifications | "Stay in the loop" | "Nothing in filter" | "All caught up" |
| Chat | "Start the conversation" | N/A | N/A |
| Calendar | "No events this week" | "Nothing on date" | "Week is clear" |

### 4.3 Error States

| Category | Icon | Actions |
|----------|------|---------|
| Network | WifiOff | Retry button |
| Validation | AlertCircle | Inline below field, shake |
| Application | ExclamationTriangle | "Try again" + "Go home" |

### 4.4 Feedback Decision Tree

```
User Action
    │
    ├── Takes < 200ms → No feedback needed
    │
    ├── Takes 200ms - 2s → Button loading state
    │   └── Success → Inline checkmark OR toast (if navigating)
    │
    ├── Takes > 2s → Progress indicator
    │   └── Success → Toast with undo option
    │
    └── Is destructive? → Confirmation modal first
        └── Success → Toast with undo
```

---

## Phase 5: Surface Polish (Weeks 5-6)

### 5.1 Entry Flow
- Extract motion patterns to shared
- Ensure gold moments use CELEBRATE pattern
- Add reduced motion support

### 5.2 Spaces Hub (/home)
- Build merged Feed+Spaces view
- Apply density system
- Welcome overlay for first-time users
- Cold-start elegance

### 5.3 Space Residence
- Query-param routing for boards/threads
- REVEAL on entrance
- CASCADE on message list
- SpaceThreshold polish for non-members

### 5.4 HiveLab
- Consistent motion to tool editor
- CELEBRATE on tool deploy
- CASCADE for template gallery

---

## Phase 6: Accessibility & QA (Week 6+)

### 6.1 Motion Accessibility
- All components check `useReducedMotion()`
- Instant fallback variants
- Test with system motion settings

### 6.2 Screen Reader Support
- `aria-live` regions for state changes
- Modal focus management
- Descriptive empty state text

### 6.3 Verification Scripts
```bash
# Find hardcoded colors (target: 0)
grep -r "#[0-9a-fA-F]\{6\}" apps/web/src --include="*.tsx" | wc -l

# Find gold focus rings (target: 0)
grep -r "ring-gold\|ring-yellow" packages/ui apps/web

# Find scale hovers (target: minimal)
grep -r "hover:scale-" apps/web/src --include="*.tsx"
```

---

## Critical Files Summary

### Must Modify
| File | Change |
|------|--------|
| `packages/ui/src/tokens/motion.ts` | Consolidate as source of truth |
| `apps/web/src/app/globals.css` | Remove duplicates, import tokens |
| `apps/web/src/components/layout/AppShell.tsx` | 4-item nav, mobile bottom nav |
| `apps/web/src/app/feed/page.tsx` | Merge into /home |
| `apps/web/src/app/spaces/page.tsx` | Merge into /home |
| `packages/ui/src/design-system/primitives/Button.tsx` | Add loading prop |

### Must Create
| File | Purpose |
|------|---------|
| `apps/web/src/app/home/page.tsx` | Unified dashboard |
| `apps/web/src/app/u/[handle]/page.tsx` | Shareable profile URLs |
| `apps/web/src/app/me/page.tsx` | Own profile hub |
| `apps/web/src/components/nav/BottomNav.tsx` | Mobile navigation |
| `packages/ui/src/tokens/variants/*.ts` | 7 canonical patterns |

### Routes to Deprecate
| Route | Action |
|-------|--------|
| `/feed` | Redirect to /home |
| `/spaces` (as standalone) | Redirect to /home |
| `/profile` (index) | Redirect to /me |
| `/hivelab` | Redirect to /lab |

---

## Verification Checklist

### Phase 1 Complete
- [ ] `grep "#[0-9a-fA-F]{6}"` returns < 50 instances
- [ ] All primitives use white focus rings
- [ ] Token imports consolidated

### Phase 2 Complete
- [ ] /home route renders merged view
- [ ] /u/[handle] resolves profiles
- [ ] Mobile bottom nav renders < 768px
- [ ] Old routes redirect correctly

### Phase 3 Complete
- [ ] 7 variant files created and exported
- [ ] Entry flow uses shared patterns
- [ ] Space residence uses REVEAL/CASCADE

### Phase 4 Complete
- [ ] All surfaces have loading/empty/error states
- [ ] Button has loading prop with spinner
- [ ] Toast supports undo

### Phase 5 Complete
- [ ] All 4 surfaces consistent motion
- [ ] Visual regression tests pass

### Phase 6 Complete
- [ ] Reduced motion works everywhere
- [ ] Lighthouse accessibility > 90
- [ ] Verification scripts pass

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| User confusion during route changes | 301 redirects, 2-week parallel running |
| Motion consistency drift | ESLint rule for hardcoded durations |
| Performance on merged /home | Progressive loading per section |
| Deep link breakage | Test existing links, redirect layer |

---

## Timeline Summary

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1-2 | Foundation | Token consolidation, hardcoded value migration |
| 2-3 | IA | /home, /me, /u/[handle], nav update |
| 3-4 | Motion | 7 canonical patterns, apply to entry + spaces |
| 4-5 | States | Loading/empty/error unification, feedback system |
| 5-6 | Polish | All 4 surfaces launch-ready |
| 6+ | QA | Accessibility, verification, edge cases |
