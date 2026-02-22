# DESIGN_RULES.md — Rules for Claude Code

These are prescriptive build rules. When building any UI in HIVE, follow these exactly.
Do not invent new patterns. Do not pull new libraries without checking this file first.
When in doubt: use what exists. Add to this file when you establish a new pattern.

---

## 1. THE DECISION TREE — Custom vs. Library vs. Already Built

**Ask in this order:**

1. **Does it exist in `@hive/ui`?** → Use it. Don't rebuild it.
2. **Is it invisible infrastructure (dialogs, overlays, form controls)?** → Use shadcn/Radix. Skin it to HIVE tokens.
3. **Is it a motion/effect layer (glow, beam, shine)?** → Pull from Magic UI. Use surgically (see §5).
4. **Is it HIVE-identity (nav, profile, cards, stats)?** → Build custom. Reference token system.
5. **Still unsure?** → Ask before building.

---

## 2. APPROVED EXTERNAL LIBRARIES

These are the only approved external UI libraries. Do not `npm install` anything else for UI without explicit approval.

### Foundation
| Library | Package | Use for |
|---------|---------|---------|
| Radix UI | `@radix-ui/*` | Dialog, Popover, Tooltip, Switch, Checkbox, Radio, Select, Accordion, ScrollArea, Tabs — all accessible primitives |
| Framer Motion | `framer-motion` | All animation. Use pre-built variants from `@hive/tokens` first. |
| CVA | `class-variance-authority` | Component variant systems |
| clsx / cn | `clsx` + `tailwind-merge` | Classname merging. Always use the `cn()` util from `@hive/ui/lib/utils` |

### Motion Effects (surgical use only — see §5)
| Library | Package | Approved components |
|---------|---------|---------------------|
| Magic UI | copy-paste only (no npm package) | `border-beam`, `shine-border`, `glow-effect`, `sparkles-text`, `number-ticker` |

Already pulled into: `packages/ui/src/components/motion-primitives/`

### Data / State
| Library | Package | Use for |
|---------|---------|---------|
| React Query | `@tanstack/react-query` | All data fetching. Use existing hooks in `@hive/hooks` first. |
| Zod | `zod` | All validation. Schemas live in `@hive/validation`. |

---

## 3. FOUNDATIONS — Rules

### Colors
- **Always use CSS variables.** Never hardcode hex values in components.
- Primary reference: `var(--bg-surface)`, `var(--text-primary)`, `var(--border-default)`
- For Tailwind: `bg-[var(--bg-surface)]` pattern
- Full token reference: `packages/ui/src/design-system/tokens.css`

```tsx
// ✅ Correct
<div className="bg-[var(--bg-surface)] border-[var(--border-default)]" />

// ❌ Wrong
<div className="bg-[#141312] border-[rgba(255,255,255,0.10)]" />
```

### Gold — 1-2% budget rule
Gold (`--life-gold`, `#FFD700`) is a **dopamine signal**. It means: alive, featured, earned.

**Gold IS allowed on:**
- Featured/trending badges on ToolCard and SpaceCard
- "X you know" mutual spaces indicator
- SpaceHealthBadge active/thriving states
- Primary CTA in Lab context (Join, Create Tool)
- Achievement moments (first tool created, milestone)
- Nav active state for Lab item ONLY

**Gold is FORBIDDEN on:**
- Focus rings (always white: `focus-visible:ring-white/50`)
- Secondary buttons
- Section headers or labels
- Background fills (except `--life-subtle` tint sparingly)
- More than 2 gold elements visible at once

### Typography
```tsx
// Display/Hero: Clash Display
<DisplayText>Big Moment</DisplayText>
// or: className="font-[var(--font-clash)]"

// Body: Geist (default, no declaration needed)
<Text>Normal content</Text>

// Stats/Numbers: Geist Mono
<Mono>127</Mono>
// or: className="font-[var(--font-mono)]"
```

### Radius
| Context | Value | Token |
|---------|-------|-------|
| Small elements (badges, chips) | pill | `--radius-full` |
| Inputs, buttons | 16px | `--radius-xl` |
| Cards | 16px | `--radius-xl` |
| Large cards, modals | 24px | `--radius-2xl` |
| Avatars | rounded-lg (8px) | `--radius-sm` — NEVER circles |

### Shadows
Black-only. No colored shadows except through the warmth system.
```tsx
// Use elevation levels, not manual shadows
<Card elevation="raised">   // --shadow-md
<Card elevation="floating"> // --shadow-xl
```

### Icons
All icons use Lucide (`lucide-react`). The `Icon` primitive from `@hive/ui` is the canonical wrapper.

| Property | Value |
|----------|-------|
| Stroke width | `1.5px` (always — never 1 or 2) |
| Sizes | `16px` (inline/tight), `20px` (default), `24px` (hero/large) |
| Color | `currentColor` — inherits from parent text opacity |

```tsx
// ✅ Correct
<Icon className="h-5 w-5" strokeWidth={1.5} />
<Search className="h-4 w-4" strokeWidth={1.5} />

// ❌ Wrong — mixing stroke widths or using non-standard sizes
<Icon className="h-6 w-6" strokeWidth={2} />
<Icon className="h-[18px] w-[18px]" />
```

---

## 4. COMPONENTS — What to Use

### Always use these from `@hive/ui` — never rebuild:

| Need | Import from |
|------|------------|
| Any card surface | `Card` from `@hive/ui` — use `elevation`, `warmth`, `interactive` props |
| User avatar | `Avatar`, `AvatarGroup` from `@hive/ui` |
| Text/heading | `Text`, `Heading`, `DisplayText`, `Mono` from `@hive/ui` |
| Badge / status | `Badge`, `SpaceHealthBadge` from `@hive/ui` |
| Presence | `PresenceDot`, `LiveIndicator`, `LiveCounter` from `@hive/ui` |
| Tool display | `ToolCard` (default or compact variant) — canonical, no alternatives |
| Space display | `SpaceCard` (default or compact variant) |
| Profile display | Use context-specific variant: `ProfileCardMemberRow`, `ProfileCardHover`, `ProfileCardSearchRow`, `ProfileCardMention`, `ProfileCardFull` |
| Stats | `StatCard` or `StatAtom` from `@hive/ui` |
| Dialog / Sheet | shadcn-based `Dialog`, `Sheet`, `Drawer` from `@hive/ui` |
| Tooltip / Popover | Radix-based from `@hive/ui` |
| Form fields | `FormField` wrapper + Radix-based inputs from `@hive/ui` |
| Tabs | `Tabs` or `TabNav` from `@hive/ui` |
| Command palette | `Command`, `CommandDialog` from `@hive/ui` |

### Component rules:

**ToolCard:**
- Use `ToolCard` — there is one canonical version. `ToolCardAtom` is legacy, do not use.
- Always pass `useCount` — never render a ToolCard without it
- `status="featured"` or `status="trending"` triggers gold edge warmth automatically

**ProfileCard variants:**
- Member lists → `ProfileCardMemberRow`
- Hover states → `ProfileCardHover`  
- Search results → `ProfileCardSearchRow`
- @mentions → `ProfileCardMention`
- Full profile → `ProfileCardFull`
- The legacy `ProfileCard` is deprecated — never use it

**SpaceCard:**
- Always pass `lastActivityAt`, `onlineCount`, `recentMessageCount` for health calculation
- Pass `mutualCount` when available — renders "X you know" in gold automatically
- Never override the territory gradient system

**Card primitive:**
- `elevation`: `resting` (subtle) | `raised` (standard cards) | `floating` (dropdowns, modals)
- `warmth`: comes from `getWarmthFromActiveUsers(onlineCount)` — never hardcode warmth level
- `interactive`: adds hover states — use whenever card is clickable
- `noPadding`: for cards with custom internal layout (images, full-bleed content)

---

## 5. MOTION — Rules

### The motion hierarchy (use in this order):

1. **CSS transitions** — for color, border, opacity changes: `transition-[var(--transition-colors)]`
2. **Pre-built Framer variants** from `@hive/tokens` — `revealVariants`, `surfaceVariants`, `modalVariants`, `cardHoverVariants`
3. **Motion primitives** from `@hive/ui/primitives/motion` — `FadeUp`, `Stagger`, `RevealSection`, `GlassSurface`
4. **Magic UI effects** — border-beam, shine-border, glow-effect from `packages/ui/src/components/motion-primitives/` — SURGICAL USE ONLY

### Motion rules:

```tsx
// ✅ Correct — use pre-built variants
import { revealVariants, springPresets } from '@hive/tokens';
<motion.div variants={revealVariants} initial="initial" animate="animate" />

// ✅ Correct — spring presets
<motion.div whileHover={{ scale: 1.01 }} transition={springPresets.snappy} />

// ❌ Wrong — never scale cards on hover (LOCKED decision)
<motion.div whileHover={{ scale: 1.05 }} />  // Never. Use opacity or glow instead.

// ❌ Wrong — never use duration > 300ms for UI interactions
<motion.div transition={{ duration: 0.8 }} />  // Only for celebrations/achievements
```

### Where Magic UI effects are approved:
| Effect | Where | Not allowed |
|--------|-------|-------------|
| `border-beam` | Lab entry button, featured Tool Cards only | Navigation, regular cards |
| `shine-border` | "Create Tool" CTA, milestone moments | Form inputs, section headers |
| `glow-effect` | ToolCard hover (replace `hover:opacity-90`) | Everywhere else |
| `sparkles-text` | First tool creation, achievement unlocks | Section labels, nav items |
| `number-ticker` | StatAtom/StatCard on mount | Loading states, inline counts |

### Always respect reduced motion:
```tsx
import { useReducedMotion } from 'framer-motion';
import { revealVariants, reducedMotionVariants } from '@hive/tokens';

const shouldReduce = useReducedMotion();
<motion.div variants={shouldReduce ? reducedMotionVariants.fadeOnly : revealVariants} />
```

---

## 6. PATTERNS — What Exists, What to Build

### Existing patterns — use them:
| Pattern | Location | Notes |
|---------|----------|-------|
| Space entry animation | `ArrivalTransition` + `ArrivalZone` | Use for all space/page entrances |
| Glass surfaces | `GlassSurface`, `GlassPanel` | Standard card surfaces |
| Form recipes | `packages/ui/src/patterns/form-recipes.tsx` | Auth forms, settings |
| Layout recipes | `packages/ui/src/patterns/layout-recipes.tsx` | Page layouts |

### Patterns that need building (in priority order):
1. **UniversalNav rebuild** — current version doesn't use token system for active states. Lab item needs gold accent + separator zones. See `packages/ui/src/navigation/UniversalNav.tsx`.
2. **ProfilePage organism** — `ProfileCardFull` portrait direction is being redesigned. Build as: slim header (avatar 48px + name + handle + bio) + stat row + ToolGrid + ActivityHeatmap.
3. **ToolGrid** — 2-col bento grid of ToolCards. Pinned slots at top (max 2). Sorted by `useCount` desc. No such pattern exists yet.

---

## 7. ANTI-PATTERNS — Never Do These

```tsx
// ❌ Hardcoded colors
style={{ color: '#FFD700' }}  // Use var(--life-gold)
style={{ background: '#141312' }}  // Use var(--bg-surface)

// ❌ Scale on hover for cards (LOCKED)
whileHover={{ scale: 1.05 }}

// ❌ Colored focus rings
focus-visible:ring-yellow-400  // Always white: focus-visible:ring-white/50

// ❌ Using legacy ProfileCard
import { ProfileCard } from '@hive/ui'  // Deprecated. Use context-specific variants.

// ❌ Using ToolCardAtom
import { ToolCardAtom } from '@hive/ui'  // Dead. Use ToolCard.

// ❌ Gold on navigation items (except Lab)
<NavItem className="text-[var(--life-gold)]" />  // Gold = Lab only in nav

// ❌ Building a modal from scratch
// Use Sheet, Drawer, or Dialog from @hive/ui — they're already built.

// ❌ Custom font declarations
className="font-['Clash_Display']"  // Use font-[var(--font-clash)] or DisplayText component

// ❌ Pulling a new npm package for UI without checking this file
npm install some-animation-library  // Check §2 first
```

---

## 8. WHEN TO ADD TO THIS FILE

When you establish a new pattern, lock a new decision, or approve a new library:
1. Add the decision here with the rationale
2. Add the date
3. Note what it replaces if anything

This file is the source of truth for build decisions. DESIGN_SYSTEM.md is the reference. This file is the rulebook.
