# HIVE Design Principles

**Visual Identity: "ChatGPT/Apple/Vercel Fusion with HIVE Gold"**

This document codifies HIVE's design foundation. All design decisions must align with these principles.

---

## Core Philosophy

| Principle | Rule |
|-----------|------|
| **Color Discipline** | 95% grayscale, 5% gold |
| **Dark-First** | No light mode. #0A0A0A is home. |
| **Neutral Warmth** | Grays have no cool/warm tint—gold brings the warmth |
| **Generous Spacing** | ChatGPT-style breathing room |
| **Minimal Motion** | Subtle and functional. Dramatic only for achievements. |

---

## The Gold Rule

Gold (#FFD700) is sacred. It's not decoration—it's dopamine.

### Allowed (Use Sparingly)
- Primary CTA buttons (Join Space, Create Tool)
- Achievement moments (Ritual complete, level up)
- Online presence indicators ("147 students online")
- Featured content badges (Hot Space, Featured Tool)
- Text selection highlight

### Forbidden
- Focus rings (use white: `rgba(255, 255, 255, 0.5)`)
- Secondary buttons
- Borders (except achievement badges)
- Hover states
- Navigation items
- Decorative elements
- Background colors (except subtle tints on badges)

---

## Monochrome Discipline

**"99% grayscale, 1% gold"** — HIVE uses a monochrome aesthetic where gold is precious and earned.

### The 1% Rule

Gold should appear on approximately 1% of screens. Ask: **"Has the user EARNED this moment?"**

| Gold Appears When | Example |
|-------------------|---------|
| User **accomplishes** something | Handle claimed, profile completed |
| User takes **final action** | "Enter HIVE" button, "Submit" |
| Something is **live/active** | Presence indicators, "Now Live" |
| User is **rewarded** | Achievement unlock, ritual complete |

### Component Rules

| Component | Default State | Gold Allowed |
|-----------|---------------|--------------|
| **Button** | White pill (`bg-white/95`) | Only `primary` variant, 1 per view max |
| **Input** | Boxed with gray border | Never |
| **Card** | Glass gray surface | Only when selected/earned |
| **Badge** | Gray text/border | Only `primary` for achievements |
| **Focus ring** | White (`ring-white/50`) | **Never gold** |
| **Link** | Gray/white text | Never |
| **Icon** | Gray stroke | Gold fill only for earned states |

### Input Variants

| Variant | When to Use | Styling |
|---------|-------------|---------|
| `default` (boxed) | Forms, settings, data entry | `border-[#2A2A2A] bg-[#141414]` |
| `underline` | Onboarding, hero sections, single-field flows | `border-0 border-b border-neutral-800` |
| `ghost` | Search, inline editing | Transparent until focus |

### Gold is Light, Not Surface

Gold **illuminates** — it does not fill.

```tsx
// ✅ CORRECT — Gold as accent/light
<span className="text-[#FFD700]">It's yours.</span>
<Badge className="border-[#FFD700]/30 text-[#FFD700]" />
<div className="ring-2 ring-[#FFD700]/30" />

// ❌ WRONG — Gold as surface
<button className="bg-[#FFD700]">Submit</button>  // Too much gold
<div className="bg-gold-500/20">Section</div>     // Gold bleeds
```

### Focus Ring Standard

**All focus rings are WHITE.** Gold is for rewards, not UI states.

```css
/* ✅ Standard focus ring */
focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]

/* ❌ Never do this */
focus-visible:ring-gold-500  /* Gold is earned, not given */
```

---

## Color Tokens

### Backgrounds (Dark-First Hierarchy)
| Token | Hex | Use |
|-------|-----|-----|
| `base` | #0A0A0A | Page background |
| `surface` | #141414 | Cards, inputs, elevated |
| `elevated` | #1A1A1A | Hover states |
| `active` | #242424 | Active/pressed states |
| `overlay` | rgba(0,0,0,0.6) | Modal backdrops |

### Text Hierarchy
| Token | Hex | Use |
|-------|-----|-----|
| `primary` | #FAFAFA | Main content |
| `secondary` | #A1A1A6 | Supporting content |
| `subtle` | #818187 | Timestamps, metadata |
| `placeholder` | #71717A | Input placeholders |
| `disabled` | #52525B | Disabled states |
| `inverse` | #000000 | Text on gold/white |

### Brand Gold
| Token | Value | Use |
|-------|-------|-----|
| `primary` | #FFD700 | CTAs, achievements |
| `hover` | #E6C200 | Gold button hover |
| `dim` | #CC9900 | Inactive gold |
| `glow` | rgba(255,215,0,0.15) | Achievement glow |
| `subtle` | rgba(255,215,0,0.1) | Badge backgrounds |

### Status Colors (Functional Only)
| Status | Color | Use |
|--------|-------|-----|
| Success | #00D46A | Confirmations, online |
| Warning | #FFB800 | Cautions, away status |
| Error | #FF3737 | Errors, destructive |
| Info | #0070F3 | Information, links |

---

## Typography

### Fonts
| Type | Font | Use |
|------|------|-----|
| Primary | Geist Sans | Body text, UI |
| Display | Space Grotesk | Hero headlines |
| Mono | JetBrains Mono | Code, metadata |

### Scale (Mobile-Optimized)
| Token | Size | Use |
|-------|------|-----|
| `display-2xl` | 40px | Hero headlines |
| `display-md` | 28px | Page titles |
| `heading-xl` | 20px | Main headings |
| `heading-lg` | 18px | Section headings |
| `body-lg` | 16px | Large body |
| `body-chat` | 15px | Chat messages |
| `body-md` | 14px | Standard body |
| `body-sm` | 12px | Small text |
| `body-meta` | 11px | Timestamps |
| `body-xs` | 10px | Labels, badges |

### Hierarchy Rules
- High contrast: Primary (#FAFAFA) vs Secondary (#A1A1A6)
- Line height: 1.5 for body, 1.25 for headings
- Negative letter spacing for display/heading fonts (premium feel)

---

## Spacing

### Base Unit: 4px
| Token | Size | Common Use |
|-------|------|------------|
| 1 | 4px | Tight gaps |
| 2 | 8px | Element gaps |
| 3 | 12px | Component gaps |
| 4 | 16px | Section gaps |
| 5 | 20px | Card padding |
| 6 | 24px | Generous padding |
| 8 | 32px | Large gaps |

### ChatGPT-Style Guidelines
- **Card padding**: 20-24px
- **Grouped messages**: 4px gap
- **Different authors**: 20px gap
- **Composer padding**: 20px horizontal, 16px vertical
- **Modal max-width**: 1024px
- **Content max-width**: 800px (centered)

### Layout Sizes
| Component | Size |
|-----------|------|
| Header | 64px |
| Button | 40px (32px small, 48px large) |
| Input | 40px (32px small, 48px large) |
| Avatar | 40px (32px small, 64px large) |
| Sidebar | 256px (64px collapsed) |

---

## Border Radius

| Token | Size | Use |
|-------|------|-----|
| `sm` | 8px | Small elements |
| `md` | 12px | Standard |
| `lg` | 16px | Buttons, inputs |
| `xl` | 24px | Large cards |
| `2xl` | 32px | Hero elements, modals |
| `full` | 9999px | Circles, pills |

---

## Motion

### Motion Tier System

HIVE uses a 4-tier motion system. Match animation intensity to action importance.

| Tier | Duration | Easing | Use For |
|------|----------|--------|---------|
| **T1** | 500-700ms | Dramatic | Celebrations, achievements, major milestones |
| **T2** | 300ms | Default | Standard interactions, cards, filters, modals |
| **T3** | 150-200ms | Snap | Ambient, hovers, toggles, micro-feedback |
| **T4** | 0-50ms | Linear | Reduced motion fallback (accessibility) |

### Easing (Use These)
| Name | Value | When |
|------|-------|------|
| **Default** | (0.23, 1, 0.32, 1) | 90% of animations (T2) |
| **Snap** | (0.25, 0.1, 0.25, 1) | Toggles, checkboxes (T3) |
| **Dramatic** | (0.165, 0.84, 0.44, 1) | Achievements ONLY (T1) |
| **Premium** | (0.22, 1, 0.36, 1) | Apple/OpenAI feel |

### Duration
| Token | Time | Use |
|-------|------|-----|
| `instant` | 50ms | Micro-feedback |
| `snap` | 150ms | Button presses |
| `quick` | 200ms | Fast interactions |
| `standard` | 300ms | Default transitions |
| `smooth` | 400ms | Smooth movements |
| `flowing` | 500ms | Layout changes |
| `dramatic` | 700ms | Special moments |

### Buttery Spring Presets

Premium motion has **mass** — not snappy, not floaty, buttery.

| Preset | Stiffness | Damping | Mass | Feels Like |
|--------|-----------|---------|------|------------|
| **Butter** | 120 | 20 | 1 | Weighted, deliberate |
| **Silk** | 80 | 25 | 0.8 | Effortless, floating |
| **Honey** | 60 | 15 | 1.2 | Luxurious, cinematic |
| **Snap** | 400 | 30 | 0.5 | Responsive, decisive |

### Standard Springs
| Preset | Stiffness | Damping | Use |
|--------|-----------|---------|-----|
| Snappy | 400 | 30 | Buttons, toggles |
| Default | 200 | 25 | Balanced |
| Gentle | 100 | 20 | Modals, sheets |
| Bouncy | 300 | 15 | Achievements |

### Stagger Timing
| Speed | Delay | Use |
|-------|-------|-----|
| Fast | 30ms | Fast lists |
| Default | 50ms | Standard stagger |
| Slow | 100ms | Dramatic reveals |

### State Animation Patterns

| State Change | Animation | Duration | Easing |
|--------------|-----------|----------|--------|
| Select | Ring expand outward | 200ms | spring (stiff) |
| Deselect | Ring contract | 150ms | spring (stiff) |
| Expand | Height + fade | 250ms | spring (gentle) |
| Collapse | Height + fade | 200ms | spring (gentle) |
| Success | Draw check + settle | 400ms | ease-out + spring |
| Error | Shake with physics | 400ms | spring (bouncy) |
| Hover | Lift + shadow | 150ms | ease-out |
| Press | Scale down | 50ms | ease-in |

---

## Glass Morphism

### Standard Glass
```css
backdrop-filter: blur(8px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.06);
```

### Elevated Glass
```css
backdrop-filter: blur(8px);
background: rgba(255, 255, 255, 0.12);
border: 1px solid rgba(255, 255, 255, 0.12);
```

### Rules
- Standard blur: **8px** (never higher for performance)
- No gold glows on glass (reserved for achievements)
- Use for modals, cards, overlays

---

## Shadows (Elevation)

| Level | Shadow | Use |
|-------|--------|-----|
| 1 | 0 1px 2px rgba(0,0,0,0.3) | Subtle |
| 2 | 0 2px 4px + 0 1px 2px | Cards |
| 3 | 0 4px 8px -2px + layer | Elevated |
| 4 | 0 8px 16px -4px + layer | Dropdowns |
| 5 | 0 16px 32px -8px + layer | Modals |

### Gold Glow (Achievements Only)
```css
box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
```

---

## Interactive States

### Hover
```css
background: rgba(255, 255, 255, 0.04);
transform: translateY(-2px); /* optional lift */
```

### Focus
```css
outline: none;
box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
/* NEVER gold - always white */
```

### Active/Pressed
```css
background: rgba(255, 255, 255, 0.08);
```

### Disabled
```css
color: #52525B;
pointer-events: none;
opacity: 0.5;
```

---

## Button Variants

| Variant | Background | Text | Border | Use |
|---------|------------|------|--------|-----|
| **Default** | #FFFFFF | #000000 | none | Primary action |
| **Primary** | #FFD700 | #000000 | none | CTAs (sparingly) |
| **Secondary** | rgba(255,255,255,0.06) | #FFFFFF | white/0.08 | Secondary actions |
| **Ghost** | transparent | #A1A1A6 | none | Tertiary actions |
| **Destructive** | #FF3737 | #FFFFFF | none | Dangerous actions |

---

## What We DON'T Do

| Anti-Pattern | Why |
|--------------|-----|
| Gradients | Keep it flat and minimal |
| Rainbow/multi-color accents | Gold is the only accent |
| Light mode | Dark-first, always |
| Parallax/3D transforms | Unless earned by achievement |
| Decorative gold | Gold is functional, not pretty |
| Gold focus rings | White only for accessibility |
| Cool/warm gray tints | Stay neutral, let gold warm |
| Excessive animation | Subtle and purposeful |
| Trendy effects | Timeless over fashionable |

---

## Token File References

| Purpose | Path |
|---------|------|
| **Monochrome** | `packages/tokens/src/monochrome.ts` |
| **Layout** | `packages/tokens/src/layout.ts` |
| **Patterns** | `packages/tokens/src/patterns.ts` |
| Colors | `packages/tokens/src/colors-unified.ts` |
| Motion | `packages/tokens/src/motion.ts` |
| Motion Variants | `packages/ui/src/lib/motion-variants.ts` |
| Glass | `packages/ui/src/lib/glass-morphism.ts` |
| Premium | `packages/ui/src/lib/premium-design.ts` |

### Key Token Exports

```typescript
// Monochrome tokens (gold-as-reward)
import { MONOCHROME, monochromeValues, monochromePatterns } from '@hive/tokens';

// Layout tokens (max-widths, spacing, shells)
import { MAX_WIDTHS, BREAKPOINTS, SPACING, SHELLS } from '@hive/tokens';

// Pattern tokens (pre-composed classes)
import { GLASS, CARD, BUTTON, BADGE, INPUT, FOCUS } from '@hive/tokens';

// Motion tokens
import { MOTION, motionTiers, butteryPresets } from '@hive/tokens';
```

---

## Landing Page Energy ("Rap Video Aesthetic")

The landing page breaks from typical SaaS patterns. It's not a feature tour—it's a lifestyle glimpse.

### Core Philosophy

| Principle | Traditional SaaS | HIVE Landing |
|-----------|------------------|--------------|
| **Approach** | Explain features | Show outcomes |
| **Emotion** | Interest | FOMO |
| **Content** | Demo placeholders | Real-feeling content |
| **Motion** | Smooth corporate | Snap/hold/punch |
| **Layout** | Grid sections | Organic fragments |
| **Copy** | "Our platform helps you..." | No explanation |

### What "Rap Video Energy" Means

> Show lifestyle, not features. Aspirational, not explanatory. Swagger, not pitch.

- **Break rules**: Ignore typical landing page structure
- **Confidence without explanation**: The product speaks for itself
- **Glimpse, not tour**: See fragments of life happening
- **Gen Z aesthetic**: Fast but not overwhelming, cool but not try-hard

### Content Principles

| Element | Wrong | Right |
|---------|-------|-------|
| **Message** | "Chat with your community" | "this tool literally saved my grade" |
| **Space** | "Join Study Groups" | "CSE 250 Study Crew • 23 online now" |
| **Tool** | "Grade Calculator" | "Study Room Finder • 847 uses today" |
| **Proof** | "500+ users" | Reactions: 💀 12, 🔥 8 |

**Key**: Show OUTCOMES and PROOF, not capabilities.

### Motion Rhythm (SNAP → HOLD → SNAP)

Unlike the rest of HIVE's buttery motion, landing uses rhythmic tension:

| Phase | Duration | Feel |
|-------|----------|------|
| **SNAP** | 100-200ms | Instant appearance, decisive |
| **HOLD** | 600-800ms | Let content breathe, build anticipation |
| **SNAP** | 100-200ms | Next element punches in |

```typescript
// Landing page easing - NOT the default buttery feel
const SNAP_EASE = [0.22, 1, 0.36, 1];  // Quick settle

// Fragment timing
const FRAGMENT_DELAY = 400;  // Hold between punches
const FRAGMENT_DURATION = 200;  // Fast appearance
```

### Fragment Design

Fragments float organically—not in a grid.

| Position | Placement | Rotation |
|----------|-----------|----------|
| top-left | `top: 8%, left: 4%` | -1° to 1° |
| top-right | `top: 10%, right: 4%` | 0.5° |
| top-center | `top: 6%, left: 50%` | 0° |
| center-left | `top: 38%, left: 3%` | -0.5° |
| center-right | `top: 35%, right: 3%` | 1° |
| bottom-left | `bottom: 15%, left: 5%` | -0.5° |
| bottom-right | `bottom: 12%, right: 4%` | 0.5° |

**Rules**:
- Never perfectly aligned
- Slight rotation adds humanity
- z-index creates depth (later = higher)
- Overlap is okay—it's organic

### Gold on Landing (Exception Zone)

Landing page uses gold differently than the app:

| Element | Gold Usage |
|---------|------------|
| **Hot indicator** | Pulsing dot on trending spaces |
| **Usage stats** | `text-[#FFD700]/60` for credibility |
| **Live badges** | "• 23 online" indicators |
| **Enter CTA** | The ONE gold button |

Gold here = **live/happening now**, not achievement.

### Social Proof Integration

Every fragment should imply activity:

```typescript
// Messages have reactions
reactions: [{ emoji: '💀', count: 12 }, { emoji: '🔥', count: 8 }]

// Spaces show live status
activity: "23 online"
recentAction: "notes just dropped"

// Tools show traction
stat: "3 open now"
uses: "847 today"

// Activity notifications
action: "Sarah found a study room in 30 seconds"
when: "just now"
```

### Entrance Flow (Email Input)

The entrance is minimal—no marketing copy:

| Element | Style |
|---------|-------|
| **Social proof** | "847 students online now" (above input) |
| **Input** | Underline variant, centered |
| **Context** | "campus-only • 400+ spaces active" |
| **CTA** | Gold "Enter" after valid .edu |

**School detection**: Input transforms when recognizing school domain.

### World Background (Continuity Layer)

Fragments persist across landing → auth → onboarding:

| Context | Opacity | Fragment Count |
|---------|---------|----------------|
| Landing | 1.0 | All (7+) |
| Auth | 0.3 | 5 |
| Onboarding | 0.2-0.4 | Progressive reveal |

This creates visual memory—users recognize the world they're joining.

### File References

| File | Purpose |
|------|---------|
| `apps/web/src/components/landing/content-library.ts` | Fragment content |
| `apps/web/src/components/landing/motion-rhythm.ts` | Snap/hold timing |
| `apps/web/src/components/landing/window-landing.tsx` | Main landing |
| `apps/web/src/components/landing/world-background.tsx` | Shared ambient |
| `apps/web/src/components/auth/auth-shell.tsx` | Auth with fragments |

---

## Quick Decision Tree

**Adding color?**
→ Is it gold? Only if CTA/achievement/presence/featured
→ Is it status? Only green/red/amber/blue for function
→ Otherwise: Use grayscale

**Adding motion?**
→ Is it a toggle/button? Use snap (150ms)
→ Is it layout/transition? Use standard (300ms)
→ Is it an achievement? Use dramatic (700ms)
→ Otherwise: Use default easing

**Adding focus state?**
→ Always white glow: `rgba(255, 255, 255, 0.5)`
→ Never gold

**Adding a shadow?**
→ Use level 1-5 scale
→ Gold glow only for achievements

**Adding spacing?**
→ Use 4px base unit (4, 8, 12, 16, 20, 24, 32)
→ Generous padding (20-24px for cards)
