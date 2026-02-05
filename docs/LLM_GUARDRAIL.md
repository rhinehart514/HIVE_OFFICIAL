# HIVE AI Development Guardrail
**Last Updated:** 2026-01-02

**Purpose:** Prevent aesthetic drift, architectural drift, and scope creep when using AI coding assistants.

Copy and prepend this to prompts when working with any AI model on HIVE.

---

## The Prompt

```
You are helping build HIVE, a student autonomy platform. BEFORE suggesting ANY code changes, validate against these constraints:

═══════════════════════════════════════════════════════════════════════════════
AESTHETIC CONSTRAINTS (Non-Negotiable)
═══════════════════════════════════════════════════════════════════════════════

MONOCHROME DISCIPLINE ("99% grayscale, 1% gold"):
- Gold (#FFD700) is PRECIOUS and EARNED
- Gold appears ONLY when user accomplishes something
- Ask: "Has the user EARNED this moment?" If no → use grayscale
- Gold is LIGHT (text, borders, glow) — NEVER SURFACE (backgrounds)

THE 1% GOLD RULE:
- Gold should appear on ~1% of screens
- Max 1 gold CTA button per view
- Gold only for: achievements, final CTAs, presence indicators

COLOR:
- 99% grayscale, 1% gold (#FFD700)
- Dark mode ONLY - #0A0A0A page background
- Gold = final CTAs, achievements, presence ONLY
- Focus rings = WHITE (ring-white/50), NEVER gold
- No gradients, no rainbow accents, no trendy effects
- Neutral grays (no cool/warm tint)

TYPOGRAPHY:
- Geist Sans (body), Space Grotesk (display), JetBrains Mono (code)
- Chat messages: 15px
- High contrast: #FAFAFA primary, #A1A1A6 secondary

SPACING:
- 4px base unit
- Generous padding (20-24px for cards)
- ChatGPT-style breathing room

MOTION TIERS:
- T1 (500-700ms): Celebrations/achievements ONLY — dramatic easing
- T2 (300ms): Standard interactions — default easing (90% of animations)
- T3 (150-200ms): Hovers, toggles, micro-feedback — snap easing
- T4 (0-50ms): Reduced motion fallback — accessibility

MOTION:
- Subtle and functional (T2: 300ms default)
- Dramatic animations (T1: 700ms+) ONLY for achievements/rituals
- Default easing: (0.23, 1, 0.32, 1)
- Snap easing for toggles: (0.25, 0.1, 0.25, 1)
- Buttery springs have mass: stiffness 80-200, damping 15-25

GLASS MORPHISM:
- Standard blur: 8px
- Background: rgba(255,255,255,0.02-0.08)
- No gold glows on glass

COMPONENT DEFAULTS:
- Button: White pill (bg-white/95), gold only for `primary` variant
- Input: Boxed (default) or Underline (onboarding/hero only)
- Card: Glass gray, gold only on `selected` state (earned)
- Badge: Gray default, gold only for achievements
- Focus ring: ALWAYS white (ring-white/50), NEVER gold

INPUT VARIANTS:
- `default`: Boxed with border — forms, settings, data entry
- `underline`: Border-bottom only — onboarding, hero, single-field flows
- Gold focus: NEVER — focus border is white/50

═══════════════════════════════════════════════════════════════════════════════
ARCHITECTURE CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

VERTICAL SLICES - Stay within boundaries:
- Spaces: apps/web/src/app/spaces/, packages/ui/src/atomic/03-Spaces/
- HiveLab: apps/web/src/app/tools/, packages/ui/src/components/hivelab/
- Profiles: apps/web/src/app/profile/, packages/ui/src/atomic/04-Profile/
- Onboarding: apps/web/src/app/onboarding/, packages/ui/src/components/onboarding/
- Landing: apps/web/src/app/landing/, packages/ui/src/components/landing/
- Admin: apps/admin/, packages/ui/src/atomic/07-Admin/

ATOMIC DESIGN - Follow the hierarchy:
- 00-Global: Shared atoms, molecules, organisms
- 02-Feed, 03-Spaces, 04-Profile, etc.: Feature-specific components
- atoms → molecules → organisms → templates

DDD PATTERN:
- Domain entities: packages/core/src/domain/
- Application services: packages/core/src/application/
- Infrastructure: packages/core/src/infrastructure/
- UI components: packages/ui/src/

DO NOT:
- Create new packages without explicit approval
- Add new dependencies without discussing alternatives
- Create new contexts/providers/stores without justification
- Break existing patterns to "improve" them
- Move files between slices without approval

═══════════════════════════════════════════════════════════════════════════════
SCOPE CONSTRAINTS (Dec 2025 - Soft Launch)
═══════════════════════════════════════════════════════════════════════════════

BUILD NOW (Priority Order):
1. Landing page polish and waitlist flow
2. Spaces chat reliability (typing indicator, real analytics)
3. HiveLab template expansion (10+ quality templates)
4. Onboarding edge case fixes
5. Mobile responsiveness pass
6. Basic analytics (real data, not mocks)

DO NOT BUILD:
- Push notifications
- Voice messages
- Marketplace
- Feed algorithm changes
- Ghost mode UI
- Email digests
- Advanced analytics
- Multi-campus features
- Collaboration features

═══════════════════════════════════════════════════════════════════════════════
RED FLAGS - STOP AND ASK BEFORE:
═══════════════════════════════════════════════════════════════════════════════

□ Adding gold to anything other than CTAs/achievements
□ Creating new component folders or packages
□ Adding npm dependencies
□ Building features not in "BUILD NOW" list
□ Refactoring working code without a bug or clear requirement
□ Creating new contexts, providers, or stores
□ Moving files between vertical slices
□ Adding motion/animation beyond subtle (300ms)
□ Using gradients, parallax, or 3D transforms
□ Adding light mode support

═══════════════════════════════════════════════════════════════════════════════
CODE STYLE
═══════════════════════════════════════════════════════════════════════════════

- Minimal code, maximum function
- Prefer editing existing files over creating new ones
- No over-engineering or premature abstraction
- Production-ready or nothing
- No "we'll fix it later" shortcuts
- Delete code that doesn't serve the product
- Simple working > elegant theoretical
```

---

## Usage Examples

### When Starting a Session
```
[Paste the guardrail prompt above]

Now, help me [your actual request]...
```

### When AI Suggests Something Suspicious
```
Before implementing that, check against the guardrail:
- Does this add gold for non-CTA use? ❌
- Does this create a new package? ❌
- Is this in the "BUILD NOW" list? ✓/❌
```

### For Code Reviews
```
Review this PR against HIVE constraints:
1. Any gold usage violations?
2. Any architectural boundary crossings?
3. Any scope creep beyond soft launch priorities?
```

---

## Quick Reference Card

### Gold Usage (The 1% Rule)
| ✅ Allowed (Earned) | ❌ Forbidden |
|---------------------|--------------|
| Final CTAs ("Enter HIVE") | Focus rings (use white) |
| Achievement unlocks | Input borders |
| Presence indicators | Hover states |
| Verified/earned badges | Secondary buttons |
| Handle claim success | Navigation items |
| Ritual completion | Card backgrounds |
| Gold text on dark | Gold surface/fill |

### Focus States
```css
/* CORRECT */
box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);

/* WRONG - Never gold focus */
box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.5);
```

### Motion Tiers
| Tier | Duration | Easing | Use For |
|------|----------|--------|---------|
| T1 | 500-700ms | dramatic | Achievements, celebrations |
| T2 | 300ms | default | Cards, modals, most UI |
| T3 | 150-200ms | snap | Hovers, toggles, micro |
| T4 | 0-50ms | linear | Reduced motion |

### Motion Defaults
| Interaction | Tier | Duration | Easing |
|-------------|------|----------|--------|
| Toggle/click | T3 | 150ms | snap |
| Hover | T3 | 200ms | default |
| Layout/Modal | T2 | 300ms | default |
| Achievements | T1 | 700ms | dramatic |

### Backgrounds
| Layer | Hex |
|-------|-----|
| Page | #0A0A0A |
| Card | #141414 |
| Hover | #1A1A1A |
| Active | #242424 |

---

## Why This Matters

HIVE's design is intentionally restrained. Every choice serves student autonomy:
- **Dark mode** = focused, distraction-free
- **Minimal gold** = dopamine hits are earned, not given
- **Generous spacing** = breathing room for thought
- **Subtle motion** = tools that don't demand attention

AI assistants love to add flair. This guardrail keeps them aligned with our philosophy: **minimal, functional, and intentional**.

---

## Updates

This document reflects December 2025 soft launch priorities. Update the BUILD NOW / DO NOT BUILD sections as focus shifts.

Last updated: December 2025
