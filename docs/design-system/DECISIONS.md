# Design System Decisions

**Living document of locked-in design choices.**

When we experiment and find winners, they go here. This is the source of truth for "what we decided and why."

---

## USE THE PRIMITIVES (LOCKED)

**Don't interpret a style. Use the locked primitives.**

```typescript
import { Button, Card, Input, Avatar, Badge, Text } from '@hive/ui/design-system/primitives';
```

The primitives implement all visual rules. You don't need to write CSS.

| Instead of... | Use |
|---------------|-----|
| Custom card styling | `<Card interactive warmth="low">` |
| Custom button | `<Button variant="cta">` or `<Button variant="default">` |
| Custom input | `<Input>` or `<Textarea>` |
| Raw `<div>` container | `<Card>` |
| Raw text elements | `<Text>`, `<Heading>`, `<DisplayText>` |

### Visual Paradigm (Reference)

For understanding only — **the primitives handle this:**

HIVE uses "Apple Glass Dark" (NOT neumorphism):
- Single shadow direction (down) — not dual opposing shadows
- Gradient bg distinct from parent — not same-color embossing
- Top edge = 1px light reflection — not soft diffused glow

**Visual test:** Cards = floating glass panels. NOT embossed clay.

---

## How to Use This File

After any experiment concludes:
1. Add entry under the relevant category
2. Include: decision, rationale, implementation
3. Mark as LOCKED (won't revisit) or SOFT (may iterate)

Format:
```markdown
### [Component/Pattern Name]
**Decision:** [What we're doing]
**Why:** [Rationale from experiment]
**Implementation:** [Specific code/values]
**Status:** LOCKED | SOFT
**Date:** YYYY-MM-DD
```

---

## PRIMITIVES

### Button (All 12 Variables)
**Decision:** Apple-style pill buttons with gradient CTA
**Why:** Apple aesthetic - minimal, premium, tactile feedback via subtle gradients
**Implementation:**
- Shape: `rounded-full` (pill)
- Gap: `gap-1.5` (6px)
- Typography: `font-medium tracking-tight`
- CTA: Gradient gold with inset highlight, gradient shift on hover
- Loading: Ring spinner (`border-t-transparent`)
- Icons: 16px (`h-4 w-4`)
- Hover: Opacity 90% (default), gradient shift (CTA)
- Press: Opacity 80% (default), darker gradient (CTA)
**Status:** LOCKED
**Date:** 2026-01-10

### Card (Surface Treatment)
**Decision:** Apple Glass Dark - gradient bg, inset highlight, deep shadows
**Why:** Dark glass pops without being too gray, creates depth via single-direction shadow (NOT neumorphism), warmth for activity
**Implementation:**
- Background: `linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92))`
- Shadow: `0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`
- Radius: 2xl (default), xl (compact), 3xl (modal), lg (tooltip)
- Hover: `brightness-110` (NOT scale)
- Warmth: Gold edge glow for active spaces
**Status:** LOCKED
**Date:** 2026-01-10

### Input (All Variables)
**Decision:** Pure Float - elevated input with shadow-based focus, NO ring/outline
**Why:** Inputs should pop/float (not recess). Shadow focus feels tech + premium. No ring avoids generic feel.
**Implementation:**
- Shape: `rounded-xl` (default), `rounded-full` (pill variant)
- Background: `linear-gradient(180deg, rgba(48,48,48,1), rgba(38,38,38,1))`
- Shadow: `0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
- Focus: Brighten bg (`rgba(56,56,56)` → `rgba(44,44,44)`), deepen shadow
- Error: Red-tinted bg + red glow shadow (no border)
- NO focus ring - shadow only
**Status:** LOCKED
**Date:** 2026-01-10

### Toggle (Checkbox, Radio, Switch)
**Decision:** White solid checkbox, White fill radio, Gold gradient switch with slow glide
**Why:** White solid is high contrast and matches well. Gold switch is one of the few allowed gold uses. Slow glide (300ms) feels deliberate and smooth.
**Implementation:**
- Checkbox: White solid bg when checked, dark checkmark, snap 100ms
- Radio: White fill when selected, center dot indicator, snap 100ms
- Switch: Gold gradient track on (`#B8860B` → `#FFD700`), subtle glass off (`rgba(255,255,255,0.1)`)
- Switch thumb: White off, dark (#0a0a09) on for contrast
- Switch animation: Slow glide 300ms (not spring)
- Sizes: sm (16px), default (20px), lg (24px)
**Status:** LOCKED
**Date:** 2026-01-10

### Textarea
**Decision:** Pure Float surface, shadow-based focus, smooth auto-grow option
**Why:** Must match Input exactly. Auto-grow with 150ms smooth transition for chat/composer UX.
**Implementation:**
- Surface: Pure Float gradient (matches Input)
- Focus: Shadow deepen (no ring)
- Radius: rounded-xl (12px)
- Resize: None default
- autoGrow prop: 150ms ease-out height transition
- Props: rows, autoGrow, minRows, maxRows, error
**Status:** LOCKED
**Date:** 2026-01-10

### Link (All Variables)
**Decision:** Slide-in underline, opacity fade hover, diagonal arrow external
**Why:** Slide-in animation is premium/distinctive without being flashy. Opacity fade is consistent with Button. Diagonal arrow is minimal and doesn't break text flow.
**Implementation:**
- Underline: Slide-in from left, 400ms ease-out, `bg-current opacity-50`
- Hover: Opacity 60% (matches premium pattern)
- External: Minimal diagonal arrow (↗), 2.5px stroke, inline
- Variants: default (white), subtle (secondary), muted (footer style)
- Focus: WHITE ring, never gold
**Status:** LOCKED
**Date:** 2026-01-10

### PresenceDot Breathing
**Decision:** [skipped - user request]
**Why:**
**Implementation:**
**Status:** SKIPPED
**Date:** 2026-01-10

### HandleDot (HiveLab Resize Handles)
**Decision:** White handles, brighten hover (no scale), white glow active
**Why:** Matches system rules (no scale on hover, opacity-based feedback). White is functional, gold reserved for activity. Glow on active shows engagement.
**Implementation:**
- Color: White with 80% opacity (`bg-white/80`), brightens to 100% on hover
- Border: Dark border (`border-2 border-[#0a0a09]`) for contrast against canvas
- Hover: Brighten ONLY (`hover:bg-white`), NO SCALE
- Active: White glow (`box-shadow: 0 0 12px rgba(255,255,255,0.6)`)
- Sizes: sm (8px), default (10px), lg (12px)
- Positions: corners, edges, center (9 positions with appropriate cursors)
**Status:** LOCKED
**Date:** 2026-01-10

### ActivityEdge (HiveLab Warmth Glow)
**Decision:** Inset gold border, 4-level warmth progression (none/low/medium/high)
**Why:** Inset doesn't expand element bounds. Gold IS allowed here (activity = life). Subtle progression feels premium.
**Implementation:**
- Style: Inset shadow (`shadow-[inset_0_0_0_Xpx_rgba(255,215,0,opacity)]`)
- none: No edge (inactive)
- low (1-2 users): `inset 0 0 0 1px rgba(255,215,0,0.15)`
- medium (3-10 users): `inset 0 0 0 2px rgba(255,215,0,0.3)`
- high (10+ users): `inset 0 0 0 2px rgba(255,215,0,0.5), 0 0 12px rgba(255,215,0,0.15)`
- Rounded variants: none, sm, default (lg), lg (xl), full
**Status:** LOCKED
**Date:** 2026-01-10

### CanvasArea (HiveLab Canvas Surface)
**Decision:** Dots grid pattern, gold ring drop target, white solid selection outline
**Why:** Dots are clean/Figma-like. Gold drop target = activity/life (allowed). White selection = high contrast, clear. Inset glow doesn't expand bounds.
**Implementation:**
- Grid: Dots pattern (`radial-gradient(circle, color 1px, transparent 1px)`)
- Grid size: 20px default, scales with zoom
- Drop target: Gold ring (`box-shadow: 0 0 0 2px rgba(255,215,0,0.5)`) + subtle gold bg tint (`rgba(255,215,0,0.03)`)
- Selection (CanvasElement): White solid ring (`ring-2 ring-[var(--color-interactive-active)]`)
- Hover: White ring at lower opacity (`ring-1 ring-[var(--color-interactive-hover)]`)
- Backgrounds: solid, elevated, dots, grid, transparent
**Status:** LOCKED
**Date:** 2026-01-10

### Slider (All Variables)
**Decision:** Opacity-based thumb, gold/white track, white glow drag, Glass Dark tooltip
**Why:** NO SCALE rule applies to all interactive elements. Opacity brighten is subtle/premium. White glow matches HandleDot. Glass Dark matches Tooltip primitive.
**Implementation:**
- Thumb default: `bg-white/80` (80% opacity)
- Thumb hover: `hover:bg-white` (100% opacity, NO SCALE)
- Thumb focus: `focus-visible:ring-2 focus-visible:ring-white/50` (WHITE, not gold)
- Drag state: White glow shadow `0 0 12px rgba(255,255,255,0.6)`
- Track colors: Gold (`bg-life-gold`) for CTAs, White (`bg-white`) for neutral
- Track sizes: sm (4px), default (6px), lg (8px)
- Tooltip: Glass Dark (`bg-[rgba(20,20,20,0.85)] backdrop-blur-[20px] border-white/[0.06]`)
**Status:** LOCKED
**Date:** 2026-01-10

### Popover (All Variables)
**Decision:** Apple Glass Dark surface, no arrow, Scale+Fade animation
**Why:** Matches Modal for visual consistency. No arrow is cleaner (matches Tooltip). Scale origin feels natural.
**Implementation:**
- Surface: Apple Glass Dark (gradient bg, inset highlight, deep shadow, 20px blur)
- Arrow: Disabled by default (`showArrow = false`)
- Animation: Scale 0.96→1 + Fade, 150ms open, 100ms close
- Radius: `rounded-xl` (12px)
- Padding: `p-4`
- HoverCard: Same treatment as Popover
**Status:** LOCKED
**Date:** 2026-01-10

### ToggleGroup (All Variables)
**Decision:** Outline Contained, Glass highlight selection, Gold text only (not bg)
**Why:** Outline contained matches Button/Input container feel. Glass highlight is consistent system-wide. Gold-as-light rule: gold text not gold background.
**Implementation:**
- Variant: Outline Contained (default) - rounded-xl container with border
- Selected: `bg-white/10 text-white`
- Hover: `bg-white/[0.06]` glass hover
- Gold variant: `bg-white/10 text-[#FFD700]` (gold TEXT, not gold background)
- Sizes: sm (28px/h-7), default (36px/h-9), lg (44px/h-11)
- Focus: `ring-white/50` (WHITE, not gold)
**Status:** LOCKED
**Date:** 2026-01-11

### Combobox (All Variables)
**Decision:** Pure Float trigger, Glass hover options, Gold text create CTA
**Why:** Matches Input (Pure Float) and Dropdown (Glass hover + check) patterns. Gold-as-light for create CTA.
**Implementation:**
- Trigger: Pure Float gradient (matches Input exactly)
- Options: Glass hover `bg-white/[0.06]`, check icon for selected
- Create CTA: `text-[#FFD700]` gold text (not gold background)
- Empty: Simple "No results found" text
- Loading: Spinner (matches Button loading)
- Focus: `ring-white/50` (WHITE, not gold)
**Status:** LOCKED
**Date:** 2026-01-11

### Sheet (All Variables)
**Decision:** 60% overlay, Apple Glass Dark panel, 300ms slide, X icon close
**Why:** 60% matches Modal overlay. Apple Glass Dark is consistent. 300ms is smooth (user chose over 200ms). X icon is accessible.
**Implementation:**
- Overlay: `bg-black/60 backdrop-blur-sm` (matches Modal)
- Panel: Apple Glass Dark gradient + inset highlight + deep shadow
- Animation: `duration-300` for slide-in/slide-out
- Close: X icon top-right, `h-8 w-8`, glass hover
- Sides: right (default), left, top, bottom with appropriate rounding
- Focus: `ring-white/50` (WHITE, not gold)
**Status:** LOCKED
**Date:** 2026-01-11

### Drawer (All Variables)
**Decision:** 60% overlay, Apple Glass Dark panel, 300ms slide, pill handle
**Why:** Consistency with Sheet/Modal. Pill handle is familiar iOS/Android pattern.
**Implementation:**
- Overlay: `bg-black/60 backdrop-blur-sm` (matches Sheet)
- Panel: Apple Glass Dark gradient + inset highlight + deep shadow
- Animation: `duration-300` for slide-in/slide-out (matches Sheet)
- Handle: Pill style `w-10 h-1 rounded-full bg-white/30` for bottom drawer
- Sides: right (default 400px), left, top, bottom with size variants
- Sizes: sm (320px), default (400px), lg (500px), xl (600px), full
- Focus: `ring-white/50` (WHITE, not gold)
**Status:** LOCKED
**Date:** 2026-01-11

---

## MOTION

### Default Easing
**Decision:** Use `cubic-bezier(0.22, 1, 0.36, 1)` for all standard transitions
**Why:** Feels premium, decelerates naturally, matches Apple/Vercel feel
**Implementation:** `--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1)`
**Status:** LOCKED
**Date:** 2026-01-10 (inherited from design system)

### Default Duration
**Decision:** 300ms for transitions, 150ms for quick feedback
**Why:** 300ms is perceptible but not slow; 150ms for immediate response
**Implementation:** `--duration-smooth: 300ms`, `--duration-fast: 150ms`
**Status:** LOCKED
**Date:** 2026-01-10 (inherited from design system)

### Hover Scale Amount
**Decision:** NO SCALE - use opacity instead
**Why:** Scale transforms feel playful/cheap. Minimal opacity shift is premium.
**Implementation:** Do not use `hover:scale-*` on buttons
**Status:** LOCKED
**Date:** 2026-01-10

### Press Scale Amount
**Decision:** NO SCALE - use opacity instead
**Why:** Consistent with Minimal approach. Opacity 80% provides tactile feedback.
**Implementation:** Do not use `active:scale-*` on buttons
**Status:** LOCKED
**Date:** 2026-01-10

---

## COLOR & TOKENS

### Gold Budget
**Decision:** Gold appears on 1-2% of any screen, maximum
**Why:** Scarcity creates meaning; gold = life/activity/earned moments
**Implementation:** CTAs, presence dots, achievements only
**Status:** LOCKED
**Date:** 2026-01-10 (inherited from design system)

### Focus Rings
**Decision:** WHITE only, never gold
**Why:** Focus is functional (accessibility), gold is semantic (life)
**Implementation:** `focus-visible:ring-white/50`
**Status:** LOCKED
**Date:** 2026-01-10 (inherited from design system)

### Warm Dark Palette
**Decision:** Use warm blacks (#0A0A09, #141312), never cold (slate, zinc)
**Why:** Warmth creates approachability; cold feels corporate
**Implementation:** `--bg-ground: #0A0A09`, `--bg-surface: #141312`
**Status:** LOCKED
**Date:** 2026-01-10 (inherited from design system)

### Avatar (All Variables)
**Decision:** rounded-lg (8px) all sizes, glass initials fallback, ring status, overlap stack
**Why:** Circles = social media generic; consistent 8px radius is distinctive. Ring status cleaner than corner dot.
**Implementation:**
- Shape: `rounded-lg` (8px) for ALL sizes, never circles
- Fallback: Glass gradient (`rgba(255,255,255,0.1)` → `rgba(255,255,255,0.05)`) with inset highlight
- Status: Ring indicator (`ring-2 ring-offset-2`), green/amber/white/red for online/away/offline/dnd
- Groups: Overlap stack with `ring-2 ring-[#1c1c1c]` separator
**Status:** LOCKED
**Date:** 2026-01-10

### Badge (All Variables)
**Decision:** Glass style, Pill shape, Dot+Label status, Glass-like gold, Floating removable tags
**Why:** Glass treatment matches Avatar fallback. Pill matches Button. Dot+Label is clearer than tinted-only. Gold as glass preserves gold budget.
**Implementation:**
- Style: Glass gradient (`rgba(255,255,255,0.1)` → `rgba(255,255,255,0.05)`) with inset highlight
- Shape: `rounded-full` (pill)
- Status: Dot + Label (colored dot before text, tinted glass bg)
- Gold: Glass-like (`rgba(255,215,0,0.15)` → `rgba(255,215,0,0.08)`), NOT solid gold
- Verified: Checkmark icon + "Verified" label in gold glass
- Count: Gold gradient count badge with dark text
- Tags: Floating style (shadow: `0 2px 8px rgba(0,0,0,0.3)`), optional X button
**Status:** LOCKED
**Date:** 2026-01-10

### Tabs (All Variables)
**Decision:** Glass pill active indicator, sliding spring motion, no container
**Why:** Glass pill matches Badge and Avatar glass treatment. Pill shape matches Button. Spring motion feels premium/responsive. No container keeps it clean.
**Implementation:**
- Container: None (clean flex with gap)
- Active: Glass pill (`rgba(255,255,255,0.1)` → `rgba(255,255,255,0.05)`) with floating shadow
- Shape: `rounded-full` (pill)
- Motion: Spring (stiffness: 400, damping: 30)
- Sizes: sm (`px-3 py-1`), default (`px-4 py-2`), lg (`px-5 py-2.5`)
- Focus: WHITE ring, never gold
**Status:** LOCKED
**Date:** 2026-01-10

### Select (All Variables)
**Decision:** Pure Float trigger, Apple Glass Dark dropdown, Scale+Fade motion
**Why:** Trigger matches Input (shadow-based). Dropdown matches Modal (glass dark). Motion matches Modal (150ms scale). Options use glass highlight like Badge.
**Implementation:**
- Trigger: Pure Float gradient + shadow (matches Input)
- Dropdown: Apple Glass Dark with deep shadow
- Motion: Scale 0.96→1 + Fade, 150ms ease-smooth
- Options: Glass highlight on selected, rounded-lg
- Indicator: White checkmark
- Shape: rounded-xl trigger, rounded-xl dropdown, rounded-lg options
- Sizes: sm, default, lg
**Status:** LOCKED
**Date:** 2026-01-10

---

## TYPOGRAPHY

### Display Font Threshold
**Decision:** Clash Display at 32px+, Geist for everything smaller
**Why:** Clash is distinctive but heavy; works at scale, not body
**Implementation:** `--font-display` for 32px+, `--font-body` otherwise
**Status:** LOCKED
**Date:** 2026-01-10 (inherited from design system)

---

## COMPONENTS

### ChatMessage (Discord × Apple Hybrid)
**Decision:** Glass Bubbles (V2) — frosted glass for all, gold-tinted glass for own messages, Discord hover action bar
**Why:** Combines Discord's efficiency (hover action bar, always-visible timestamps) with Apple's polish (glass bubbles, rounded corners, gold accent for self). Glass morphism creates premium feel without being heavy.
**Implementation:**
- Other messages: `bg-white/5 backdrop-blur-sm`, `border border-white/10`, `rounded-2xl rounded-tl-sm`
- Own messages: `bg-[var(--color-accent-gold)]/15 backdrop-blur-sm`, `border border-[var(--color-accent-gold)]/20`, `rounded-2xl rounded-tr-sm`
- Name: Gold text for own messages (`text-[var(--color-accent-gold)]`)
- Action bar: Discord-style hover bar (`bg-[var(--color-bg-card)]`, appears on hover)
- Reactions: Pill chips with counts, ring for own reactions
- Avatar: Every message (first in group for grouped mode)
- Timestamps: Always visible inline
**Status:** LOCKED
**Date:** 2026-01-11

### ProfileCard — Member List Context
**Decision:** Discord-style member list with section grouping, presence dots, hover menu actions
**Why:** Familiar Discord pattern (section headers by role), clean presence indication, actions on demand. Balances information density with scannability.
**Implementation:**
- Information Density: Name + @handle (role shown via sections, not badges)
- Presence: Dot indicator bottom-right of avatar (green/yellow/gray)
- Role Treatment: Section headers ("LEADERS (2)", "MODERATORS (1)", "MEMBERS (15)")
- Actions: Three-dot hover menu (···) on row hover
- Scale: 40px row height, sm avatar, gap-3
- Hover: `hover:bg-white/5` on rows
**Status:** LOCKED
**Date:** 2026-01-11

### ProfileCard — Hover Card Context
**Decision:** Horizontal layout, 280px width, bio + mutuals, single Message CTA
**Why:** Compact horizontal matches member list pattern. Bio gives context, mutuals build trust. Single CTA avoids clutter on transient hover state.
**Implementation:**
- Layout: Horizontal (avatar left, content right)
- Size: 280px width, p-4 padding
- Info: Name + @handle + bio (2-line clamp) + mutual connections count
- Avatar: md size with presence dot
- Actions: Single "Message" button (secondary variant)
- Surface: Apple Glass Dark (`bg-[var(--color-bg-card)]`, `rounded-xl`, `border`)
**Status:** LOCKED
**Date:** 2026-01-11

### ProfileCard — Search Result Context
**Decision:** Standard 44px rows, name + handle + major + mutuals, no inline actions
**Why:** Search is for finding, not acting. Mutuals help distinguish similar names. Click navigates to profile.
**Implementation:**
- Row: 44px height, gap-3, px-2
- Info: Name + @handle + major, mutual count on right (if > 0)
- Avatar: sm size
- Actions: None (click entire row to select)
- Hover: `hover:bg-white/5`, `cursor-pointer`
**Status:** LOCKED
**Date:** 2026-01-11

### ProfileCard — Inline Chip Context (@mentions)
**Decision:** Blue pill background, no avatar, hover triggers hover card
**Why:** Pill makes mentions scannable in long messages. Blue is consistent (not gold — save for achievements). No avatar is too heavy for inline text.
**Implementation:**
- Style: `bg-[var(--color-interactive-active)]/20 text-[var(--color-interactive-active)]`
- Shape: `px-1.5 py-0.5 rounded`
- Hover: `hover:bg-[var(--color-interactive-active)]/30`, shows hover card (Context 2)
- Content: `@handle` text only, no avatar
**Status:** LOCKED
**Date:** 2026-01-11

### ProfileCard — Full Card Context (Profile Page)
**Decision:** Left-aligned layout, portrait card avatar, glass-style action buttons
**Why:** Left-aligned is easier to scan (F-pattern reading). Portrait card gives premium feel. Glass buttons match Card primitive depth.
**Implementation:**
- Layout: Left-aligned (avatar left, content right), gap-6
- Avatar: Portrait Card (`w-36 h-48`, `elevation="raised"`, initials)
- Presence: Subtle dot (`w-3 h-3`, 80% opacity green, inside portrait corner)
- Info: Name + badge + @handle + major + bio + stats (connections/spaces)
- Actions: Card-as-button with `elevation="raised"`, `rounded-full`, `interactive`
- Connect: Gold text (`text-[var(--color-accent-gold)]`)
- Message: Default white text
**Status:** LOCKED
**Date:** 2026-01-11

### EventCard — Time Display
**Decision:** Absolute time format ("3:00 PM")
**Why:** Absolute times are more actionable — users can plan around "3:00 PM". Relative ("in 2h") is ambiguous. Countdown is too urgent for general events.
**Implementation:**
- Format: `date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })`
- Display: `<Text size="sm" weight="medium">3:00 PM</Text>`
**Status:** LOCKED
**Date:** 2026-01-11

### EventCard — RSVP Style
**Decision:** Toggle Chip ("Going?" / "✓ Going")
**Why:** Toggle shows clear state. Gold tint for "Going" matches achievement/earned feel. Less aggressive than CTA button (events aren't conversions).
**Implementation:**
- Default: `px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/15`
- Toggled: `bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]` with "✓ Going" text
**Status:** LOCKED
**Date:** 2026-01-11

### EventCard — Live Indicator
**Decision:** Edge Warmth + LIVE badge
**Why:** Gold warmth = activity/life (locked system pattern). Matches SpaceCard warmth for active spaces. LIVE badge provides explicit label.
**Implementation:**
- Card: `<Card elevation="resting" warmth="edge">`
- Badge: `<Badge variant="gold" size="sm">LIVE</Badge>` inline with title
**Status:** LOCKED
**Date:** 2026-01-11

### EventCard — Information Density
**Decision:** Standard (title + time + location + count + RSVP action)
**Why:** Covers 90% of use cases. Minimal lacks actionable info. Dense is overwhelming for feed/list contexts.
**Implementation:**
- Title: `<Text size="lg" weight="semibold">`
- Time + Location: `<Text size="sm" tone="muted">3:00 PM · Davis Hall 101</Text>`
- Count: `<Text size="xs" tone="muted">12 going</Text>`
- Action: Toggle chip (see RSVP Style)
**Status:** LOCKED
**Date:** 2026-01-11

### ToolCard — Visual Identity
**Decision:** Category Icon (system icons like Heroicons/Lucide, not emojis)
**Why:** Category icons are consistent and load instantly. Screenshots require generation/storage, can become stale. Space logo good but not all tools have spaces.
**Implementation:**
- Icon container: `<Card elevation="resting" noPadding className="w-12 h-12 rounded-xl">`
- Icons: Use Heroicons/Lucide for categories (Academic, Housing, Productivity, Social)
- Fallback: Gradient placeholder with first letter if no category
**Status:** LOCKED
**Date:** 2026-01-11

### ToolCard — Status Indicators
**Decision:** Badge for status (Draft, Featured), edge warmth for featured/trending
**Why:** Badge provides explicit label (matches EventCard, ProfileCard patterns). Featured gets edge warmth + gold badge.
**Implementation:**
- Draft: `<Badge variant="default" size="sm">Draft</Badge>`
- Featured/Trending: `<Card warmth="edge">` + `<Badge variant="gold" size="sm">Trending</Badge>`
**Status:** LOCKED
**Date:** 2026-01-11

### ToolCard — Action Treatment
**Decision:** Click-through only (entire card is clickable)
**Why:** Browse → click → opens tool page. Simple mental model. Actions (save, deploy, share) belong on tool detail page, not discovery.
**Implementation:**
- Card: `<Card elevation="resting" interactive noPadding className="cursor-pointer">`
- No inline actions, hover menus, or CTAs on browse cards
**Status:** LOCKED
**Date:** 2026-01-11

### ToolCard — Information Density
**Decision:** Standard (name + description + use count)
**Why:** Name + description + use count is enough to decide to click. Minimal lacks context. Dense shows author + category which belongs on detail page.
**Implementation:**
- Title: `<Text size="lg" weight="semibold">`
- Description: `<Text size="sm" tone="muted" className="line-clamp-2">`
- Stats: `<Text size="xs" tone="muted">{uses} uses</Text>`
**Status:** LOCKED
**Date:** 2026-01-11

### ToolCard — Distinctive Layout (Workshop Card)
**Decision:** Category icon in corner, space logo origin, category label, edge warmth for trending
**Why:** Feels like browsing student creations from spaces, not app store. Category icon matches EventCard time card pattern. Space logo shows tool origin (tools belong to communities).
**Implementation:**
```tsx
<Card elevation="raised" interactive noPadding className="overflow-hidden cursor-pointer">
  <div className="p-5">
    {/* Header */}
    <div className="flex justify-between items-start mb-4">
      <div>
        <Text size="xs" tone="muted" className="uppercase tracking-wider mb-1">{category}</Text>
        <Text size="xl" weight="semibold">{name}</Text>
      </div>
      <CategoryIcon category={category} />
    </div>
    {/* Description */}
    <Text size="sm" tone="secondary" className="mb-4 line-clamp-2">{description}</Text>
    {/* Footer */}
    <div className="flex items-center justify-between pt-4 border-t border-white/10">
      <div className="flex items-center gap-2">
        <SpaceLogo space={space} />
        <Text size="sm" tone="muted">{space?.name || author.name}</Text>
      </div>
      <Text size="sm" tone="muted">{uses} uses</Text>
    </div>
  </div>
</Card>
```
**Status:** LOCKED
**Date:** 2026-01-11

### SpaceCard — Visual Identity
**Decision:** Full Header with territory gradient + badge
**Why:** Territory system (academic, creative, social, professional, wellness) gives spaces distinct visual identity. Gradient header + badge communicates category instantly.
**Implementation:**
- Header: `<div className="h-16 bg-gradient-to-br {territoryGradient}">`
- Badge: `<Badge variant="outline" className="{territoryColor}">{territory.label}</Badge>`
- Avatar: Floats over gradient with border ring
**Status:** LOCKED
**Date:** 2026-01-11

### SpaceCard — Activity Indicators
**Decision:** Card warmth via primitive (gold edge glow)
**Why:** Card primitive already has warmth prop. Use `getWarmthFromActiveUsers()` to auto-calculate level from active member count.
**Implementation:**
- Warmth: `<Card warmth={getWarmthFromActiveUsers(activeMembers)}>`
- Levels: none (0), low (1-2), medium (3-10), high (10+)
**Status:** LOCKED
**Date:** 2026-01-11

### SpaceCard — Information Density
**Decision:** Standard (name + description + member count)
**Why:** Enough to decide to click. "X you know" in gold highlights connections. Dense info (founders, tools) belongs on detail page.
**Implementation:**
- Title: `<Text size="lg" weight="medium">`
- Description: `<Text size="sm" muted className="line-clamp-2">`
- Members: `<Text size="xs" muted>{count} members</Text>`
- Connections: `<Text size="xs" className="text-[var(--color-accent-gold)]">{count} you know</Text>`
**Status:** LOCKED
**Date:** 2026-01-11

### SpaceCard — Distinctive Layout (Immersive Portal)
**Decision:** Apple-style hero card with floating avatar, generous padding, stat columns
**Why:** Full-bleed gradient, large floating avatar with ring/shadow, vertical stat columns. Feels like entering a world, not joining a server.
**Implementation:**
```tsx
<Card elevation="raised" warmth={warmthLevel} interactive noPadding className="overflow-hidden">
  {/* Hero gradient */}
  <div className="h-28 bg-gradient-to-br {territoryGradient} relative">
    <Badge variant="outline" className="absolute top-4 right-4 backdrop-blur-sm {territoryColor}">
      {territory.label}
    </Badge>
    {/* Large floating avatar */}
    <div className="absolute -bottom-10 left-6">
      <Avatar className="w-20 h-20 rounded-2xl shadow-2xl ring-4 ring-[rgba(18,18,18,0.92)]">
        <AvatarFallback className="rounded-2xl text-2xl {territoryColor}">{initials}</AvatarFallback>
      </Avatar>
    </div>
  </div>
  {/* Content with generous padding */}
  <div className="pt-14 pb-5 px-6">
    <Text size="xl" weight="medium">{name}</Text>
    <Text size="sm" muted className="mt-2 line-clamp-2">{description}</Text>
    {/* Stat columns */}
    <div className="flex items-center gap-6 mt-5 pt-4 border-t border-white/[0.06]">
      <div className="flex flex-col">
        <Text size="lg" weight="medium">{memberCount}</Text>
        <Text size="xs" muted>members</Text>
      </div>
      <div className="flex flex-col">
        <Text size="lg" weight="medium" className="text-[var(--color-accent-gold)]">{mutuals}</Text>
        <Text size="xs" muted>you know</Text>
      </div>
    </div>
  </div>
</Card>
```
**Status:** LOCKED
**Date:** 2026-01-11

### SpaceCard — Future Enhancement (HIVE Logo Watermark)
**Decision:** Consider subtle HIVE logo watermark on gradient at low opacity
**Why:** Would add brand personality without competing with content. Logo at 3-5% opacity as background texture.
**Implementation:** TBD - `<img src="/assets/hive-logo-white.svg" className="absolute opacity-[0.03] ..." />`
**Status:** SOFT (enhancement, not blocking)
**Date:** 2026-01-11

### CommandBar — Container Style
**Decision:** Full Modal with backdrop blur
**Why:** VS Code / Raycast style - centered modal gives full focus. Backdrop blur dims context without hiding it. Most comprehensive for keyboard-first navigation.
**Implementation:**
- Backdrop: `bg-black/60 backdrop-blur-md`
- Container: `<Card elevation="floating" noPadding className="w-[560px]">`
- Position: centered, top third of viewport
**Status:** LOCKED
**Date:** 2026-01-11

### CommandBar — Search Input
**Decision:** Integrated (icon + ESC hint)
**Why:** ⌘ icon on left reinforces trigger shortcut. ESC hint on right shows how to dismiss. Input is borderless within card.
**Implementation:**
- Icon: `<div className="w-6 h-6 rounded-lg bg-white/10">⌘</div>`
- Input: Borderless, `placeholder="Search spaces, people, tools..."`
- Hint: `<Mono size="xs" className="text-white/30">ESC</Mono>`
**Status:** LOCKED
**Date:** 2026-01-11

### CommandBar — Result Grouping
**Decision:** Smart Groups (type headers only when multiple results)
**Why:** Shows category context without overwhelming. Count badge helps scanning. Flat list loses context; full categories too rigid.
**Implementation:**
- Header: `<Label size="xs" className="uppercase tracking-wider text-white/40">`
- Count: `<Text size="xs" muted>N results</Text>`
- Only show header when 2+ results in category
**Status:** LOCKED
**Date:** 2026-01-11

### CommandBar — Keyboard Hints
**Decision:** Contextual Footer (navigation hints + close)
**Why:** Power users see shortcuts; new users aren't overwhelmed. Footer is always visible but subtle. Action shortcuts inline with rows.
**Implementation:**
- Footer: `bg-white/[0.02] border-t border-white/[0.06]`
- Hints: `<Mono inline size="xs">↑↓</Mono>` + `<Text size="xs" muted>navigate</Text>`
- Row shortcuts: `<Mono inline size="xs">{shortcut}</Mono>` on right
**Status:** LOCKED
**Date:** 2026-01-11

### Modal Choreography
**Decision:** Minimal - fast 150ms scale, Apple Glass Dark surface
**Why:** Apple-like restraint. Fast feels responsive. Subtle scale (0.96) avoids flashy.
**Implementation:**
- Backdrop: `bg-black/60 backdrop-blur-sm`
- Surface: Apple Glass Dark (gradient + floating shadow)
- Animation: 150ms, scale(0.96 → 1), ease-smooth
- Radius: `rounded-3xl` (modal size)
- Close button: opacity hover, no ring
**Status:** LOCKED
**Date:** 2026-01-10

### Toast Lifecycle
**Decision:** Rich - card with gold progress bar, slide from right
**Why:** Progress bar shows time remaining. Card format allows title + description. Premium feel.
**Implementation:**
- Surface: Apple Glass Dark (slightly more opaque)
- Position: `bottom-right`
- Animation: 200ms slide-x + scale(0.95 → 1)
- Progress: Gold bar at top, auto-decrements
- Icons: Circular badges (green/red/amber/blue)
- Duration: 4000ms default
**Status:** LOCKED
**Date:** 2026-01-10

---

## PATTERNS

### Interactive Element Feedback
**Decision:** All clickable elements have hover + active states via opacity
**Why:** Tactile feedback confirms user actions. Minimal/Apple approach.
**Implementation:** `hover:opacity-90` + `active:opacity-80`
**Status:** LOCKED
**Date:** 2026-01-10

### Loading States
**Decision:** Skeletons with shimmer, not spinners
**Why:** Skeletons preserve layout; spinners feel corporate
**Implementation:** shimmer animation with gradient overlay
**Status:** LOCKED
**Date:** 2026-01-10 (inherited from design system)

---

## REJECTED OPTIONS

Document what we tried and rejected, so we don't revisit.

### ~~Spring/Bounce Animations for Standard UI~~
**Tried:** Spring physics on buttons and cards
**Rejected:** Feels playful, not premium. Save for celebrations only.
**Date:** 2026-01-10

### ~~Gold Focus Rings~~
**Tried:** Using gold for focus states
**Rejected:** Confuses accessibility with semantic meaning
**Date:** 2026-01-10

### ~~Circular Avatars~~
**Tried:** Standard circular avatars
**Rejected:** Too social-media-generic. Squares are distinctive.
**Date:** 2026-01-10

### ~~Ring/Outline Focus on Inputs~~
**Tried:** Standard focus rings on inputs
**Rejected:** Feels generic. Shadow-based focus is more premium/tech.
**Date:** 2026-01-10

### ~~Recessed/Inset Inputs~~
**Tried:** Inputs that look carved into the card surface
**Rejected:** Inputs should pop/float, not sink. Elevated style matches ChatGPT composer feel.
**Date:** 2026-01-10

### ~~Flat/Solid Badges~~
**Tried:** Flat background badges with borders
**Rejected:** Feels generic. Glass treatment is more premium and consistent with Avatar fallback.
**Date:** 2026-01-10

### ~~Solid Gold Badges~~
**Tried:** Solid gold background on special badges
**Rejected:** Violates gold budget (1-2%). Glass-like gold tint preserves scarcity.
**Date:** 2026-01-10

### ~~Corner Dot Status on Badges~~
**Tried:** Status indicated by corner dot only
**Rejected:** Dot + Label is clearer. Corner dot saved for Avatar where image is primary.
**Date:** 2026-01-10

---

## SHELLS & LAYOUTS

### AuthShell — Background Treatment
**Decision:** Plain Dark (no ambient orb)
**Why:** Plain dark is sophisticated and allows glass card to shine. Animated gold orb competed for attention. Dark background matches 2am test.
**Implementation:**
- Background: `bg-[var(--bg-ground)]` only
- No gold orb animation
- Content centered in viewport
**Status:** LOCKED
**Date:** 2026-01-12

### AuthShell — Content Container
**Decision:** Glass Card (Card primitive wraps all content)
**Why:** Card primitive provides Apple Glass Dark styling. Consistent with design system. Creates premium feel for auth flow.
**Implementation:**
- Container: `<Card>` wrapping all auth content
- Uses locked Card primitive with glass effect
- Focus rings WHITE (inherited from primitives)
**Status:** LOCKED
**Date:** 2026-01-12

### AuthShell — Logo Presentation
**Decision:** Large Centered (current)
**Why:** Logo is the identity anchor. Centered creates balance. Large size (lg) is authoritative.
**Implementation:**
- Position: Centered above card, `mb-12` spacing
- Size: `lg` variant
- Variant: `white` on dark background
**Status:** LOCKED
**Date:** 2026-01-12

### AuthShell — Button Variant
**Decision:** Button primitive with `default` variant (white button)
**Why:** Login is not an achievement (no gold CTA). White button has sufficient contrast and uses locked primitive styling.
**Implementation:**
- Import: `import { Button } from '@hive/ui/design-system/primitives'`
- Usage: `<Button variant="default" loading={isLoading}>Continue</Button>`
- Loading: Uses Button's built-in loading spinner
**Status:** LOCKED
**Date:** 2026-01-12

### AuthShell — Focus Rings
**Decision:** WHITE focus rings (not gold)
**Why:** Locked system pattern - focus is functional (accessibility), gold is semantic (life/achievement).
**Implementation:**
- All inputs: `focus-visible:ring-2 focus-visible:ring-white/50`
- Focus-within: `focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/20`
**Status:** LOCKED
**Date:** 2026-01-12

### CampusDrawer — Mobile Navigation Drawer
**Decision:** Left Side drawer with all recommended options
**Why:** Left side is natural swipe gesture (thumb reaches left edge). Matches Android/iOS patterns. User profile context makes it feel personalized.
**Implementation:**
- Direction: Left side slide-in (75% screen width)
- Overlay: Dark dim 60% (`bg-black/60`)
- Animation: Spring (damping: 25, stiffness: 300)
- Content: User Header + Grouped Sections layout
- Handle: No pill handle (left drawer uses X close or tap-out)
- Close: Tap overlay or X button in header
**Recommended Combo:**
```tsx
// Slide Direction: A (Left Side)
// Overlay Style: A (Dark Dim 60%)
// Content Layout: E (User Header + List)
// Handle Style: D (Title + Close X)
```
**Status:** LOCKED
**Date:** 2026-01-12

### Login Page — Vertical Stack Layout
**Decision:** Apple Checkout style - cardless, generous vertical rhythm
**Why:** Card-based felt generic. Vertical stack feels premium, focused, tech-forward. Apple Checkout is the gold standard for form UX.
**Implementation:**
- Container: `AuthShell variant="vertical"` (not card)
- Max width: 320px (narrower than card)
- Spacing: `mb-16` logo, `space-y-12` sections, `space-y-10` within states
- Background: Void dark (#050504) - darker than ground
- Logo: md size, icon only (no text)
- States: input → code → success (AnimatePresence transitions)
```tsx
<AuthShell variant="vertical">
  <EmailInput domain="buffalo.edu" ... />
  <OTPInput value={code} onComplete={handleVerify} ... />
  <Button variant="default" size="lg">Continue</Button>
</AuthShell>
```
**Status:** LOCKED
**Date:** 2026-01-12

### EmailInput — Composite Primitive
**Decision:** Input + domain suffix composite for campus email entry
**Why:** Campus login always uses @school.edu format. Suffix should be non-editable, visually integrated.
**Implementation:**
- Base: Pure Float style from Input primitive
- Layout: Flex container with input + suffix span
- Suffix: `text-white/50 font-medium select-none` (non-editable)
- Props: domain, error, size (sm/default/lg)
```tsx
<EmailInput domain="buffalo.edu" value={email} onChange={setEmail} />
```
**Status:** LOCKED
**Date:** 2026-01-12

### OTPInput — Composite Primitive
**Decision:** 6-digit OTP input with auto-advance and auto-submit
**Why:** OTP is a standard pattern. Auto-advance reduces friction. Gold highlight shows progress (earned).
**Implementation:**
- Inputs: Array of 6 single-character inputs
- Auto-advance: Move to next on digit entry
- Backspace: Navigate to previous
- Paste: Handle full code paste
- Auto-submit: Call onComplete when all filled
- Style: Pure Float (filled digits get gold edge warmth)
```tsx
<OTPInput value={code} onChange={setCode} onComplete={handleVerify} />
```
**Status:** LOCKED
**Date:** 2026-01-12

---

## DECISION LOG

Chronological record of decisions made during sprints.

| Date | Component | Decision | Status |
|------|-----------|----------|--------|
| 2026-01-13 | System | Visual Paradigm: Apple Glass Dark (NOT neumorphism) | LOCKED |
| 2026-01-10 | System | Gold budget 1-2% | LOCKED |
| 2026-01-10 | System | White focus rings | LOCKED |
| 2026-01-10 | System | Warm dark palette | LOCKED |
| 2026-01-10 | Avatar | Rounded squares | LOCKED |
| 2026-01-10 | Typography | Clash at 32px+ | LOCKED |
| 2026-01-10 | Motion | ease-smooth default | LOCKED |
| 2026-01-10 | Motion | 300ms default duration | LOCKED |
| 2026-01-10 | Button | Apple-style pill, gradient CTA, ring spinner | LOCKED |
| 2026-01-10 | Card | Apple Glass Dark, brightness hover, gold warmth | LOCKED |
| 2026-01-10 | Input | Pure Float, shadow focus, no ring/outline | LOCKED |
| 2026-01-10 | Modal | Minimal, 150ms scale, Apple Glass Dark | LOCKED |
| 2026-01-10 | Toast | Rich, gold progress bar, slide-right | LOCKED |
| 2026-01-10 | Avatar | rounded-lg, glass fallback, ring status | LOCKED |
| 2026-01-10 | Badge | Glass style, pill shape, dot+label status | LOCKED |
| 2026-01-10 | Tabs | Glass pill, sliding spring, no container | LOCKED |
| 2026-01-10 | Select | Pure Float trigger, Scale+Fade dropdown | LOCKED |
| 2026-01-10 | Toggle | Glass + Gold check, Glass switch + Spring | LOCKED |
| 2026-01-10 | Textarea | Pure Float, shadow focus, smooth auto-grow | LOCKED |
| 2026-01-10 | Tooltip | Glass Dark, rounded-lg, no arrow, 0 delay | LOCKED |
| 2026-01-10 | Skeleton | Staggered wave, 1.5s, 0.15s stagger | LOCKED |
| 2026-01-10 | Progress | Inset track, white/gold gradient, 0.5s ease | LOCKED |
| 2026-01-10 | TypingIndicator | Pulse animation, gray/gold, 1.2s cycle | LOCKED |
| 2026-01-10 | Separator | Inset shadow, dark + light highlight | LOCKED |
| 2026-01-10 | Link | Slide-in underline, opacity fade, diagonal arrow | LOCKED |
| 2026-01-10 | Typography | Text, Heading, DisplayText, Label, Mono - token application | LOCKED |
| 2026-01-10 | Icon | 1.75 stroke weight, 16/20/24px sizes | LOCKED |
| 2026-01-10 | AvatarGroup | Medium overlap, page ring, glass overflow, z-index stack | LOCKED |
| 2026-01-10 | Checkbox | White solid bg, standard checkmark, snap 100ms | LOCKED |
| 2026-01-10 | Radio | White fill, center dot, snap 100ms | LOCKED |
| 2026-01-10 | Switch | Gold gradient track, subtle glass off, slow glide 300ms | LOCKED |
| 2026-01-10 | LiveCounter | Gold numbers, no dot, muted gray zero state | LOCKED |
| 2026-01-10 | HandleDot | White handles, brighten hover (no scale), white glow active | LOCKED |
| 2026-01-10 | ActivityEdge | Inset gold border, 4-level warmth progression | LOCKED |
| 2026-01-10 | CanvasArea | Dots grid pattern, gold ring drop target | LOCKED |
| 2026-01-10 | Slider | Opacity thumb, white glow drag, Glass Dark tooltip | LOCKED |
| 2026-01-10 | Popover | Apple Glass Dark, no arrow, Scale+Fade 0.96→1 | LOCKED |
| 2026-01-10 | Dropdown | Apple Glass Dark, glass hover, inset separator | LOCKED |
| 2026-01-10 | Accordion | Glass hover, 300ms chevron rotation, white focus | LOCKED |
| 2026-01-10 | ToggleGroup | Glass selected/hover, gold only for CTAs | LOCKED |
| 2026-01-11 | Combobox | Pure Float trigger, Glass hover options, Gold text CTA | LOCKED |
| 2026-01-11 | Sheet | 60% overlay, Apple Glass Dark, 300ms slide, X icon | LOCKED |
| 2026-01-11 | Drawer | 60% overlay, Apple Glass Dark, 300ms slide, pill handle | LOCKED |
| 2026-01-11 | ScrollArea | Subtle thumb, thin 6px, auto visibility, pill shape | LOCKED |
| 2026-01-11 | Alert | Full border, 10% tint, semantic colors, gold for achievements | LOCKED |
| 2026-01-11 | PresenceDot | Gold online, gold/50 away, gray offline, red DND | LOCKED |
| 2026-01-11 | PropertyField | Horizontal 120px label, vertical/full layouts | LOCKED |
| 2026-01-11 | ChatMessage | Glass Bubbles (Discord×Apple), gold-tint self, hover bar | LOCKED |
| 2026-01-11 | ProfileCard (Member List) | Section grouping, presence dots, hover menu, 40px rows | LOCKED |
| 2026-01-11 | ProfileCard (Hover Card) | Horizontal 280px, bio+mutuals, single Message CTA | LOCKED |
| 2026-01-11 | ProfileCard (Search Result) | 44px rows, name+handle+major+mutuals, no actions | LOCKED |
| 2026-01-11 | ProfileCard (Inline Chip) | Blue pill, no avatar, hover triggers hover card | LOCKED |
| 2026-01-11 | ProfileCard (Full Card) | Left-aligned, portrait card avatar, glass buttons | LOCKED |
| 2026-01-11 | EventCard (Time Display) | Absolute format ("3:00 PM") | LOCKED |
| 2026-01-11 | EventCard (RSVP Style) | Toggle Chip ("Going?" / "✓ Going") | LOCKED |
| 2026-01-11 | EventCard (Live Indicator) | Edge Warmth + LIVE badge | LOCKED |
| 2026-01-11 | EventCard (Info Density) | Standard (title+time+location+count) | LOCKED |
| 2026-01-11 | ToolCard (Visual Identity) | Category Icon (Heroicons/Lucide) | LOCKED |
| 2026-01-11 | ToolCard (Status) | Badge + edge warmth for featured | LOCKED |
| 2026-01-11 | ToolCard (Actions) | Click-through only | LOCKED |
| 2026-01-11 | ToolCard (Info Density) | Standard (name+desc+uses) | LOCKED |
| 2026-01-11 | ToolCard (Layout) | Workshop Card (icon corner, space origin) | LOCKED |
| 2026-01-12 | AuthShell (Background) | Plain Dark, no gold orb | LOCKED |
| 2026-01-12 | AuthShell (Container) | Glass Card wraps all content | LOCKED |
| 2026-01-12 | AuthShell (Logo) | Large Centered | LOCKED |
| 2026-01-12 | AuthShell (Button) | Button default variant (white) | LOCKED |
| 2026-01-12 | AuthShell (Focus Rings) | WHITE focus rings, not gold | LOCKED |
| 2026-01-12 | CampusDrawer | Left Side, 60% dim, User Header + List, Title+Close | LOCKED |
| 2026-01-12 | Login Page | Vertical Stack (Apple Checkout), cardless, 320px max-width | LOCKED |
| 2026-01-12 | EmailInput | NEW PRIMITIVE: Input + domain suffix composite | LOCKED |
| 2026-01-12 | OTPInput | NEW PRIMITIVE: 6-digit auto-advance, auto-submit | LOCKED |
| 2026-01-12 | AuthShell | Added variant="vertical" for Vertical Stack layout | LOCKED |
| 2026-01-12 | System | Primitive-First Development workflow established | LOCKED |
| 2026-01-14 | AuthShell | "The Void" layout - left-aligned, logo bottom-right | LOCKED |
| 2026-01-14 | OnboardingLayout | "The Reveal" - dots only (no labels), matches AuthShell | LOCKED |
| 2026-01-14 | Tag | NEW PRIMITIVE: Interactive selection tag (glass/gold) | LOCKED |
| 2026-01-14 | SelectionCard | NEW PRIMITIVE: Large selection button with icon | LOCKED |
| 2026-01-14 | Voice | Auth/onboarding voice patterns ("Enter", "Check your email") | LOCKED |

---

---

## LANDING PAGE (Living Glass Design)

### Landing Architecture
**Decision:** "Living Glass" single-page design with 6 sections
**Why:** Shows the product alive, doesn't just talk about it. Floating glass cards prove activity. Progressive disclosure builds to gold CTA.
**Implementation:**
- Sections: ThinNav → HeroLiving → ProductPillars → HowItWorksNew → GatePhilosophyNew → CTAFinal → FooterMinimal
- Background: LivingAtmosphere (subtle animated gradient)
- Scroll: Lenis smooth scroll (1.2s duration)
- Progress: Thin white progress bar at top
**Status:** LOCKED
**Date:** 2026-01-12

### Landing Hero (Living Glass Cards)
**Decision:** Floating glass cards showing simulated space activity
**Why:** Proves HIVE is alive. Shows real product patterns (typing, member counts, warmth). Cards use locked primitives.
**Implementation:**
- Cards: Use Card, LiveCounter, TypingDots, Badge, SimpleAvatar primitives
- Positions: 3 cards at offset angles (x:-60/y:0, x:80/y:-40, x:40/y:80)
- Motion: 0.8s staggered entrance, ease-smooth
- Warmth: Simulated via Card warmth prop (high/medium/low)
- Headline: DisplayText "Where campus actually happens"
**Status:** LOCKED
**Date:** 2026-01-12

### Landing Nav (ThinNav)
**Decision:** Minimal top navigation with centered links
**Why:** Doesn't compete with hero. Logo left, links center, CTAs right.
**Implementation:**
- Layout: Logo left, links center (Safety, HiveLab, Campuses), CTAs right
- Gold budget: ONLY "Get Started" button gets gold
- Sign In: Ghost/secondary button
- Scroll behavior: Background becomes more opaque on scroll
- Mobile: Hamburger menu
**Status:** LOCKED
**Date:** 2026-01-12

### Landing CTA (Final Section)
**Decision:** Gold CTA button ONLY at page bottom (earned)
**Why:** Gold budget preserved. User reads full value prop before seeing gold. Creates narrative arc.
**Implementation:**
- Button: `variant="cta"` (gold gradient glass)
- Above: Value proposition recap
- Below: FooterMinimal with legal links
**Status:** LOCKED
**Date:** 2026-01-12

### Landing Primitives Used
**Decision:** All landing sections must use design system primitives
**Why:** Consistency with app experience. No one-off custom components.
**Implementation:**
- Card, Button, DisplayText, Text, Heading from primitives
- LiveCounter, TypingDots, Badge, SimpleAvatar from primitives
- Link uses design system patterns (slide-in underline)
**Status:** LOCKED
**Date:** 2026-01-12

---

---

## PROFILE PAGE

### Profile Page — Layout Pattern
**Decision:** Dashboard with floating portrait, stats cards, bento grid
**Why:** Dashboard feel shows activity and engagement. Floating portrait creates visual hierarchy. Cards use primitives for consistency.
**Implementation:**
- Layout: Floating portrait left (280px), card grid right
- Portrait: `rounded-2xl` container with image or initials fallback
- Stats: Top bar with `Mono` numbers, pill badges with `Progress`
- Cards: Use `Card` primitive with `elevation` and `warmth` props
- Buttons: Use `Button` primitive (`cta` for Connect, `secondary` for Edit)
- Text: All text uses `Text`, `Heading`, `Mono` primitives
- Interests: Use `Badge` primitive with `gold`/`neutral` variants
**Status:** LOCKED
**Date:** 2026-01-13

### Profile Page — No Scale Transforms
**Decision:** Removed all `whileHover={{ scale: X }}` transforms
**Why:** LOCKED system rule: Scale feels "playful/cheap". Opacity/brightness is premium.
**Implementation:**
- Cards: `hover:brightness-110` via Card `interactive` prop
- Buttons: `hover:opacity-90` via Button primitive
- Nav items: `hover:bg-white/[0.04]` for subtle state
**Status:** LOCKED
**Date:** 2026-01-13

### Profile Page — Gold Budget
**Decision:** Gold used for: Connect CTA, "Leading X" badge, interest matches, tool runs, online indicator
**Why:** Gold = life/activity/achievement. Connect is earning a connection. Leading is earned status. Matches are meaningful.
**Implementation:**
- Connect button: `Button variant="cta"` (gold gradient glass)
- Leading badge: `Badge variant="gold"`
- Shared interests: `Badge variant="gold"`
- Tool runs: `Mono className="text-[var(--color-accent-gold)]"`
- Online dot: `bg-[var(--color-accent-gold)]`
**Status:** LOCKED
**Date:** 2026-01-13

### Profile Page — Card Warmth Levels
**Decision:** Cards use warmth to indicate activity/importance
**Why:** Warmth = activity = life. Higher warmth = more important/active content.
**Implementation:**
- Progress card: `warmth="low"` (subtle engagement)
- Time tracker: `warmth="medium"` (active session)
- Tools section: `warmth="medium"` (builder achievement)
- Space items: `warmth="low"` if leader, `warmth="none"` otherwise
- Regular cards: `warmth="none"` or omit
**Status:** LOCKED
**Date:** 2026-01-13

---

## PHASE 1: AUTH/ONBOARDING REDESIGN (Jan 14, 2026)

### Auth Layout — "The Void"
**Decision:** Ultra-minimal, left-aligned, logo bottom-right
**Why:** Login should be invisible. Get them in. Don't make it an experience.
**Implementation:**
- Background: #0A0A09 (warm dark)
- Content: Left-aligned within 380px container
- Logo: Bottom-right corner, 40% opacity (small, confident)
- No card container, no progress dots
- Subtle ambient glow at bottom
**Status:** LOCKED
**Date:** 2026-01-14

### Onboarding Layout — "The Reveal"
**Decision:** Start minimal → build to celebration. Progress dots ONLY, NO labels.
**Why:** Content explains itself. Labels add clutter. Gold moment is earned at completion.
**Implementation:**
- Matches AuthShell (left-aligned, 380px, logo bottom-right)
- Progress: 3 dots bottom-center (gold current, white complete, gray upcoming)
- Steps: userType → quickProfile → interestsCloud/spaceClaim → completion
- Completion: Gold checkmark celebration, no sidebar preview
**Status:** LOCKED
**Date:** 2026-01-14

### Onboarding Progress — Dots Only
**Decision:** Simple dots, no labels
**Why:** Content explains itself. Labels add visual clutter.
**Implementation:**
- 3 dots at bottom center
- Gold for current step
- White at 50% opacity for completed
- White at 15% opacity for upcoming
- Hidden on completion step
**Status:** LOCKED
**Date:** 2026-01-14

### Tag Primitive — Interactive Selection Tag
**Decision:** Glass default, gold selected, removable option
**Why:** Consistent selection pattern across interests, spaces, filters
**Implementation:**
- Default: Glass surface (`bg-white/[0.06]`, `border-white/10`, `text-white/60`)
- Selected: Gold glass (`bg-[#FFD700]/12`, `border-[#FFD700]/30`, `text-[#FFD700]`)
- Removable: X icon appears on hover
- Hover: `opacity-90` (NO SCALE per system rules)
- Focus: WHITE ring (never gold)
**Status:** LOCKED
**Date:** 2026-01-14

### SelectionCard Primitive — Large Selection Button
**Decision:** Card with icon, title, description, arrow, optional goldHover
**Why:** Reusable for any "pick one of these" UI (onboarding, settings, etc.)
**Implementation:**
- Layout: `[Icon] [Title + Description] [Arrow →]`
- Shape: `rounded-full` pill
- Default hover: Glass brighten
- Gold hover: Gold border + gold text on hover (for premium options)
- Selected: Gold glass surface
- Height: 72px default, 56px compact
**Status:** LOCKED
**Date:** 2026-01-14

### Voice — Auth/Onboarding
**Decision:** HIVE voice patterns for auth flow
**Why:** Voice should feel like a peer, not an institution.
**Implementation:**
| Instead of | Say |
|------------|-----|
| "Sign in" | "Enter" |
| "Enter code" | "Check your email" |
| "Choose your path" | (remove - obvious) |
| "Tap to select your interests" | "Pick a few" |
| "The builders are here." | "Find your people." |
| "Your request will be reviewed..." | "We'll review and email you." |
**Status:** LOCKED
**Date:** 2026-01-14

---

*Last updated: 2026-01-14*
