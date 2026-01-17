# HIVE SYSTEMS

## Level 4: Composed Patterns

*Last updated: January 2026*

---

## WHAT THIS DOCUMENT IS

Systems are composed patterns — Language tokens combined into reusable recipes. If Language is ingredients, Systems are recipes.

```
Level 0: WORLDVIEW (what we believe)     ← WORLDVIEW.md
    ↓
Level 1: PHILOSOPHY (how it feels)       ← PHILOSOPHY.md
    ↓
Level 2: PRINCIPLES (rules that guide)   ← PRINCIPLES.md
    ↓
Level 3: LANGUAGE (visual vocabulary)    ← LANGUAGE.md
    ↓
Level 4: SYSTEMS (composed patterns)     ← THIS DOCUMENT
    ↓
Level 5: PRIMITIVES → Level 6: COMPONENTS → Level 7: PATTERNS
    ↓
Level 8: TEMPLATES → Level 9: INSTANCES
```

---

## THE CORE PHILOSOPHY

**HIVE is a tool that feels like a place.**

Not purely tool (ChatGPT, Linear) — those disappear entirely.
Not purely place (Discord, games) — those are environments first.

HIVE is infrastructure with life. Precision of Linear. Warmth of presence. Workshop when building. Room when gathering.

---

## THE ATMOSPHERE SPECTRUM

HIVE has three atmosphere contexts:

```
LANDING ──────────── SPACES ──────────── HIVELAB
(Apple-level rich)   (In between)        (Workshop)
   │                    │                    │
   ▼                    ▼                    ▼
Quality materials    Functional +         Zero atmosphere
Subtle gradients     subtle warmth        Tools + canvas
Glass depth          Presence visible     Pure function
Product heroes       Edge warmth          VS Code energy
Restraint            Activity responds    Creation is focus
```

Every system adapts across this spectrum.

---

## SYSTEM 1: SURFACE

### The Concept: Adaptive Materials

Apple's material philosophy, simplified. Surfaces respond to context but stay minimal like ChatGPT when focus is needed.

---

### Surface Tokens

```css
/* Foundation Surfaces (static, focus-oriented) */
--surface-void: #050504;
--surface-ground: #0A0A09;
--surface-raised: #141312;

/* Material Surfaces (responsive, depth-oriented) */
--surface-card: #141312;
--surface-card-hover: #1A1917;
--surface-card-active: #252521;
--surface-elevated: #1E1D1B;

/* Interactive Surfaces */
--surface-interactive: rgba(255, 255, 255, 0.06);
--surface-interactive-hover: rgba(255, 255, 255, 0.10);
--surface-interactive-active: rgba(255, 255, 255, 0.15);
```

---

### Surface by Context

| Context | Surfaces Used | Blur | Warmth |
|---------|--------------|------|--------|
| **Landing** | Foundation + Material + Glass | Yes, atmospheric | Subtle gradient |
| **Spaces** | Foundation + Material | Elevated only | Edge warmth on activity |
| **HiveLab** | Foundation only | None | None |
| **Modals** | Elevated + Glass | Always | Context-dependent |

---

### Surface Rules

```
LANDING:
├── Ground: --surface-ground with subtle warm gradient overlay
├── Cards: Glass (blur + transparency)
├── Elevated: Full glass treatment
└── Focus: Quality of materials, not quantity of effects

SPACES:
├── Ground: --surface-ground (solid, no gradient)
├── Cards: --surface-card (solid)
├── Active cards: Edge warmth (see Warmth System)
├── Elevated: Blur only when floating
└── Focus: Content and presence

HIVELAB:
├── Ground: --surface-ground (pure, flat)
├── Panels: --surface-raised (no blur, no effects)
├── Canvas: Slightly different from ground
├── Everything: Flat, utilitarian, workshop
└── Focus: The work, nothing else
```

---

## SYSTEM 2: GLASS

### The Concept: Contextual Depth

Apple's blur philosophy, applied by context. Blur means "floating" — use it intentionally.

---

### Glass Tokens

```css
/* Glass Surfaces */
--glass-subtle:
  background: rgba(20, 19, 18, 0.8);
  backdrop-filter: blur(4px);

--glass-elevated:
  background: rgba(30, 29, 27, 0.85);
  backdrop-filter: blur(8px);

--glass-atmospheric:
  background: rgba(20, 19, 18, 0.6);
  backdrop-filter: blur(12px);

--glass-deep:
  background: rgba(10, 10, 9, 0.7);
  backdrop-filter: blur(16px);
```

---

### Glass by Context

| Context | Glass Usage |
|---------|-------------|
| **Landing** | Liberal — hero cards, preview windows, depth layers |
| **Spaces** | Moderate — dropdowns, modals only |
| **HiveLab** | None — flat surfaces, no blur |

---

### Glass Rules

```
WHEN TO USE GLASS:
├── Element floats above content
├── Need to show depth
├── Modal or overlay
├── Landing page cards
└── Premium moment

WHEN NOT TO USE GLASS:
├── Ground-level elements
├── HiveLab (ever)
├── Performance-critical areas
├── Mobile (use sparingly)
└── Just for decoration
```

---

## SYSTEM 3: STATE

### The Concept: Physical + Context-Dependent

Different elements respond differently. Subtle things stay subtle. Physical things feel physical.

---

### State Definitions

```
RESTING
├── Default appearance
├── No special treatment
└── Ready to respond

HOVER
├── Background: +1 level or --surface-interactive-hover
├── Brightness: brightness-110 for cards (NO LIFT/SCALE - LOCKED)
├── Transition: 200ms ease-smooth
└── Cursor: pointer if interactive

FOCUS
├── Ring: --focus-ring (white, 2px, 2px offset)
├── Outline: none (we use ring)
├── Visible for keyboard nav
└── No ring on click (use :focus-visible)

ACTIVE
├── Background: +2 levels or --surface-interactive-active
├── Opacity: 0.8 for buttons (NO SCALE - LOCKED)
├── Transition: 100ms ease-out
└── Immediate feedback

DISABLED
├── Opacity: 0.4
├── Cursor: not-allowed
├── Pointer-events: none
└── No hover effects

LOADING
├── Opacity: 0.7
├── Cursor: wait
├── Shimmer animation on skeleton
└── Disable interaction
```

---

### State by Element Type

```
SUBTLE ELEMENTS (links, text buttons):
├── Hover: Color shift only (--text-primary from --text-secondary)
├── Active: Underline or slight dim
├── No movement, no lift
└── Minimal response

SURFACE ELEMENTS (cards, containers):
├── Hover: brightness-110 (NO LIFT/SCALE - LOCKED)
├── Active: (no change, hover state persists)
├── Premium restraint
└── Subtle response

BUTTON ELEMENTS (CTAs, actions):
├── Hover: opacity-90 + subtle glow (gold buttons)
├── Active: opacity-80 (NO SCALE - LOCKED)
├── Immediate feedback
└── Clear response

LIFE ELEMENTS (presence, indicators):
├── Default: Breathing animation (4s cycle)
├── Hover: Glow intensifies
├── No click interaction usually
└── Always alive
```

---

### State Tokens

```css
/* Transitions */
--transition-subtle: color 200ms ease-smooth;
--transition-surface: all 200ms ease-smooth;
--transition-button: all 150ms ease-smooth;

/* Opacity States (NO SCALE/LIFT - LOCKED) */
--hover-opacity: 0.9;
--active-opacity: 0.8;
--disabled-opacity: 0.5;

/* Focus */
--focus-ring: 0 0 0 2px rgba(255, 255, 255, 0.5);
--focus-offset: 2px;
```

---

## SYSTEM 4: MOTION

### The Concept: Purposeful Only

Motion answers questions or solves problems. If it doesn't, it's decoration. Decoration is AI generic.

---

### What Motion Is For

```
MOTION ANSWERS THESE QUESTIONS:
├── "Did my action work?" → Button feedback, state change
├── "What's happening?" → Loading state, progress
├── "Where did that come from?" → Page transition, modal enter
├── "Is anyone here?" → Presence indicator, typing
└── "Is this alive?" → Breathing on life elements

MOTION DOES NOT ANSWER:
├── "Is this website cool?" → NO
├── "Did designers work here?" → NO
├── "Should I be impressed?" → NO
└── "Is this modern?" → NO
```

---

### Motion Categories

```
TRANSITIONS (Yes, always):
├── State changes (hover, active, focus)
├── Page transitions (route changes)
├── Modal enter/exit
├── Content appear (once, on mount)
├── Dropdown open/close
└── Timing: 150-300ms, ease-smooth

INDICATORS (Yes, for life):
├── Typing indicator: pulse
├── Presence dot: breathe (4s)
├── Active count: smooth number change
├── Loading: skeleton shimmer
└── Timing: 2-4s cycles for life, 2s for loading

AMBIENT (No, except Landing):
├── Gradient shifts: Landing only, very subtle
├── Drift: None
├── Particles: None
├── Scroll-triggered: None
└── Parallax: None
```

---

### Motion Tokens

```css
/* Durations */
--duration-instant: 0ms;
--duration-press: 100ms;
--duration-fast: 150ms;
--duration-smooth: 200ms;
--duration-gentle: 300ms;
--duration-slow: 400ms;

/* Life Durations */
--duration-breathe: 4000ms;
--duration-shimmer: 2000ms;

/* Easings */
--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

### Motion Rules

```
DO:
├── Transition state changes
├── Animate presence indicators
├── Smooth page transitions
├── Fade content in on mount (once)
├── Shimmer loading skeletons
└── Keep it purposeful

DON'T:
├── Scroll-triggered animations
├── Staggered list reveals
├── Parallax effects
├── Decorative ambient motion
├── "Delightful" micro-interactions
├── Motion for motion's sake
└── Anything that says "AI made this"
```

---

### Motion Test

Before adding motion, ask:

> "What question does this motion answer?"

If you can't answer clearly in one sentence, don't add the motion.

---

## SYSTEM 5: LAYOUT

### The Concept: Density Modes

Spacious by default. Adaptable by context.

---

### Density Levels

```
SPACIOUS (Default):
├── Gap: 24-32px between elements
├── Padding: 24-48px in containers
├── Margins: 48-96px page edges
├── Use: Landing, onboarding, single focus
└── Feel: Apple, breathing room, premium

COMFORTABLE (App default):
├── Gap: 16-24px between elements
├── Padding: 16-24px in containers
├── Margins: 24-48px page edges
├── Use: Spaces, profiles, browse
└── Feel: Functional but not cramped

COMPACT (Dense contexts):
├── Gap: 8-16px between elements
├── Padding: 12-16px in containers
├── Margins: 16-24px page edges
├── Use: HiveLab panels, data tables
└── Feel: Information-rich, efficient
```

---

### Layout Tokens

```css
/* Containers */
--container-narrow: 640px;   /* Reading, forms */
--container-standard: 960px; /* Most content */
--container-wide: 1200px;    /* Dashboards */
--container-full: 100%;      /* Edge-to-edge */

/* Gaps by Density */
--gap-spacious: 32px;
--gap-comfortable: 20px;
--gap-compact: 12px;

/* Padding by Density */
--padding-spacious: 32px;
--padding-comfortable: 20px;
--padding-compact: 12px;
```

---

### Layout by Context

| Context | Density | Container | Notes |
|---------|---------|-----------|-------|
| **Landing** | Spacious | Wide/Full | Maximum breathing room |
| **Onboarding** | Spacious | Narrow | Focus on flow |
| **Spaces** | Comfortable | Standard | Balance of content |
| **Chat** | Comfortable | Standard | Message-focused |
| **HiveLab** | Compact | Full | Maximum canvas |
| **Admin** | Compact | Wide | Data-dense |

---

## SYSTEM 6: TYPE

### The Concept: Semantic Roles

Named by purpose, not size. Expandable for new roles and fonts.

---

### Type Roles

```
DISPLAY ROLES (Currently: Clash Display)
├── hero: 72px / 700 / 1.0 — Landing hero only
├── display-xl: 56px / 600 / 1.0 — Major page titles
├── display-lg: 48px / 600 / 1.1 — Section heroes
├── display: 40px / 600 / 1.1 — Page titles
├── display-sm: 32px / 600 / 1.1 — Large headings
└── Future: display-feature, display-compact

INTERFACE ROLES (Currently: Geist)
├── title-lg: 24px / 600 / 1.25 — Card headers
├── title: 20px / 600 / 1.25 — Subsections
├── body-lg: 16px / 400 / 1.5 — Emphasized body
├── body: 14px / 400 / 1.5 — Default content
├── body-sm: 13px / 400 / 1.5 — Secondary
├── label: 12px / 500 / 1.25 — Form labels
├── caption: 12px / 400 / 1.4 — Metadata
├── fine: 11px / 400 / 1.4 — Timestamps
└── Future: interface-condensed, interface-wide

DATA ROLES (Currently: Geist Mono)
├── stat-lg: 24px / 500 / 1.0 — Hero numbers
├── stat: 16px / 500 / 1.0 — Counters
├── code: 14px / 400 / 1.5 — Code blocks
├── code-sm: 12px / 400 / 1.5 — Inline code
└── Future: data-tabular
```

---

### Type Tokens

```css
/* Semantic Type (use these) */
--type-hero: 700 72px/1 var(--font-display);
--type-display-xl: 600 56px/1.0 var(--font-display);
--type-display-lg: 600 48px/1.1 var(--font-display);
--type-display: 600 40px/1.1 var(--font-display);
--type-display-sm: 600 32px/1.1 var(--font-display);

--type-title-lg: 600 24px/1.25 var(--font-body);
--type-title: 600 20px/1.25 var(--font-body);
--type-body-lg: 400 16px/1.5 var(--font-body);
--type-body: 400 14px/1.5 var(--font-body);
--type-body-sm: 400 13px/1.5 var(--font-body);
--type-label: 500 12px/1.25 var(--font-body);
--type-caption: 400 12px/1.4 var(--font-body);
--type-fine: 400 11px/1.4 var(--font-body);

--type-stat-lg: 500 24px/1 var(--font-mono);
--type-stat: 500 16px/1 var(--font-mono);
--type-code: 400 14px/1.5 var(--font-mono);
--type-code-sm: 400 12px/1.5 var(--font-mono);

/* Font Families (implementation, can change) */
--font-display: "Clash Display", sans-serif;
--font-body: "Geist", sans-serif;
--font-mono: "Geist Mono", monospace;
```

---

### Type by Context

| Context | Display | Body | Data |
|---------|---------|------|------|
| **Landing** | hero, display-xl | body-lg | stat-lg |
| **Pages** | display, display-sm | body, body-sm | stat |
| **Cards** | title, title-lg | body, caption | stat |
| **HiveLab** | title | body-sm, label | code, code-sm |

---

## SYSTEM 7: LIFE (Gold)

### The Concept: Budgeted

Gold is the campfire. One fire per room. 1-2% maximum. Scarcity = value.

---

### Life Budget

```
PER SCREEN MAXIMUM:
├── 1 primary CTA (gold background)
├── 1-3 presence indicators (gold dots)
├── 0-1 achievement/highlight
└── Total: Never more than 1-2% of pixels
```

---

### Life Tokens

```css
/* Gold Values */
--life-gold: #FFD700;
--life-gold-hover: #FFDF33;
--life-gold-active: #E5C200;
--life-pulse: rgba(255, 215, 0, 0.60);
--life-glow: rgba(255, 215, 0, 0.15);
--life-subtle: rgba(255, 215, 0, 0.08);
--life-edge: rgba(255, 215, 0, 0.15);
```

---

### Life Usage

```
PRESENCE (breathing):
├── Active dot: --life-gold, animation: breathe 4s
├── Typing indicator: --life-pulse, animation: breathe 3s
├── Active count number: --life-gold color only
└── Always animate, always breathe

ACTIONS (static until interaction):
├── Primary CTA: --life-gold background
├── CTA hover: --life-gold-hover + --life-glow shadow
├── CTA active: --life-gold-active
└── No breathing, responds to interaction

ACHIEVEMENTS (burst, then settle):
├── Moment: Gold glow burst
├── Settled: Gold badge/icon
├── Not continuous
└── Rare

EDGE WARMTH (for active containers):
├── Border: --life-edge
├── Shadow: 0 0 20px --life-subtle
├── Indicates activity within
└── Subtle, contained
```

---

### Life Rules

```
GOLD APPEARS ON:
├── Primary CTAs
├── Presence indicators (active users)
├── Typing indicators
├── Active counts (the number only)
├── Achievement moments
├── Active container edges (subtle)
└── That's it

GOLD NEVER APPEARS ON:
├── Decorative elements
├── Icons (unless indicating life)
├── Borders (unless indicating activity)
├── Hover states (those are grayscale)
├── Focus rings (white only)
├── Links
├── Backgrounds (except CTA buttons)
└── Anything "because it looks nice"
```

---

## SYSTEM 8: ATMOSPHERE

### The Concept: Minimal Core, Rich Edges

App is minimal. Spaces have subtle warmth. Landing is Apple-level rich. HiveLab is workshop.

---

### Atmosphere Contexts

```
LANDING (Apple-level rich):
├── Background: --surface-ground + subtle warm gradient
├── Glass: Yes, atmospheric treatment
├── Glow: Behind hero, behind key elements
├── Grain: None (Apple doesn't do grain)
├── Motion: Transitions only, no ambient
├── Content: Product is hero, materials create depth
└── Feel: Premium, spatial, quality over quantity

SPACES (In between):
├── Background: --surface-ground (solid)
├── Glass: Elevated elements only
├── Glow: None (warmth is edge-based)
├── Edge warmth: On active containers
├── Motion: Transitions + presence indicators
└── Feel: Functional with life, presence matters

HIVELAB (Workshop):
├── Background: --surface-ground (flat, pure)
├── Glass: None
├── Glow: None
├── Warmth: None
├── Motion: Transitions only, minimal
├── Everything: Utilitarian, tools visible
└── Feel: VS Code energy, creation is focus

CELEBRATION (Brief burst):
├── Context: Achievement, milestone
├── Gold glow burst
├── Brief (1-2 seconds)
├── Returns to normal context
└── Rare and meaningful
```

---

### Atmosphere Tokens

```css
/* Landing Atmosphere */
--atmosphere-landing-gradient: radial-gradient(
  ellipse 80% 50% at 50% 0%,
  rgba(255, 248, 240, 0.03) 0%,
  transparent 60%
);
--atmosphere-landing-glow: radial-gradient(
  ellipse at center,
  rgba(255, 215, 0, 0.05) 0%,
  transparent 70%
);

/* Spaces Warmth (edge-based) */
--warmth-edge-border: rgba(255, 215, 0, 0.15);
--warmth-edge-shadow: 0 0 20px rgba(255, 215, 0, 0.05);

/* HiveLab (no atmosphere) */
--hivelab-bg: #0A0A0A;
--hivelab-surface: #141414;
--hivelab-panel: #1A1A1A;
--hivelab-canvas: #0E0E0E;
```

---

### Warmth Response System

For Spaces, activity creates edge warmth:

```css
/* Inactive container */
.space-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
}

/* Active container (has presence) */
.space-card.has-activity {
  border: 1px solid var(--warmth-edge-border);
  box-shadow: var(--warmth-edge-shadow);
}

/* Rules:
   - Warmth is edge-based only
   - Not background, not glow source
   - Subtle, contained
   - Indicates "life inside"
*/
```

---

## SYSTEM 9: BUTTON

### Composed Button Recipes

```
BUTTON BASE:
├── Padding: 12px 24px (md), 8px 16px (sm)
├── Radius: --radius-md (8px)
├── Font: --type-label
├── Transition: --transition-button
├── Cursor: pointer

BUTTON PRIMARY (Gold):
├── Base: BUTTON BASE
├── Background: --life-gold
├── Text: --surface-ground (dark on gold)
├── Hover: opacity-90 + subtle glow
├── Active: opacity-80 (NO SCALE - LOCKED)
├── Focus: --focus-ring (white)
└── Use: Main CTA, one per section max

BUTTON SECONDARY:
├── Base: BUTTON BASE
├── Background: --surface-interactive
├── Border: --border-default
├── Text: --text-primary
├── Hover: --surface-interactive-hover
├── Active: --surface-interactive-active
└── Use: Secondary actions

BUTTON GHOST:
├── Base: BUTTON BASE
├── Background: transparent
├── Text: --text-secondary
├── Hover: --text-primary + --surface-interactive-hover
├── Active: --surface-interactive-active
└── Use: Tertiary actions, less important

BUTTON DANGER:
├── Base: BUTTON BASE
├── Background: --status-error
├── Text: white
├── Use: Destructive actions only, rare
```

---

## SYSTEM 10: CARD

### Composed Card Recipes

```
CARD BASE:
├── Background: --surface-card
├── Border: 1px solid --border-subtle
├── Radius: --radius-lg (12px)
├── Padding: --padding-comfortable (20px)

CARD INTERACTIVE:
├── Base: CARD BASE
├── Cursor: pointer
├── Hover: brightness-110 (NO LIFT/SCALE - LOCKED)
├── Active: (hover state persists)
├── Transition: --transition-surface
└── Use: Clickable cards

CARD STATIC:
├── Base: CARD BASE
├── No hover effects
└── Use: Display-only containers

CARD WITH ACTIVITY:
├── Base: CARD INTERACTIVE
├── Border: --warmth-edge-border
├── Shadow: --warmth-edge-shadow
└── Use: Containers with active users

CARD GLASS (Landing only):
├── Background: --glass-atmospheric
├── Border: 1px solid rgba(255,255,255,0.08)
├── Radius: --radius-lg
└── Use: Landing page feature cards
```

---

## SYSTEM 11: INPUT

### Composed Input Recipes

```
INPUT BASE:
├── Background: --surface-interactive
├── Border: 1px solid --border-subtle
├── Radius: --radius-md (8px)
├── Padding: 12px 16px
├── Font: --type-body
├── Text: --text-primary
├── Placeholder: --text-muted
├── Transition: border 200ms ease-smooth

INPUT FOCUS:
├── Border: --border-emphasis
├── Box-shadow: --focus-ring
├── Outline: none
└── Clear focus indication

INPUT ERROR:
├── Border: --status-error
├── Keep focus behavior
└── Show error message below

INPUT DISABLED:
├── Opacity: 0.4
├── Cursor: not-allowed
├── Background: slightly darker
└── No focus state
```

---

## QUICK REFERENCE

### By Context

| Context | Surface | Glass | Motion | Atmosphere | Density |
|---------|---------|-------|--------|------------|---------|
| **Landing** | Material | Atmospheric | Transitions | Apple-rich | Spacious |
| **Spaces** | Material | Elevated only | Trans + Life | Edge warmth | Comfortable |
| **HiveLab** | Foundation | None | Minimal | None | Compact |
| **Modal** | Elevated | Yes | Trans | Context | Context |

---

### Decision Shortcuts

| Question | Answer |
|----------|--------|
| "Should this have blur?" | Only if it floats (or Landing) |
| "Should this have gold?" | Only if it's life, CTA, or achievement |
| "Should this animate?" | Only if answering a clear question |
| "Should this have atmosphere?" | Only on Landing or celebrations |
| "How much spacing?" | More than you think (start spacious) |
| "What motion timing?" | 200ms for response, 300ms for transitions |

---

## IMPLEMENTATION NOTES

### CSS Structure

```css
/* Variables at root */
:root {
  /* All tokens from LANGUAGE.md */
  /* All composed values from SYSTEMS.md */
}

/* Context-specific overrides */
[data-context="landing"] {
  /* Landing atmosphere */
}

[data-context="hivelab"] {
  /* Workshop mode */
}
```

### Component Patterns

```jsx
// Button with system
<Button variant="primary" />  // Uses BUTTON PRIMARY system
<Button variant="secondary" /> // Uses BUTTON SECONDARY system

// Card with activity
<Card hasActivity={activeUsers > 0} /> // Applies warmth edge

// Context wrapper
<AtmosphereContext value="landing">
  {/* Landing atmosphere applied */}
</AtmosphereContext>
```

---

## NEXT LEVEL

Systems flow into **Primitives (Level 5)** — the basic building blocks that use these systems.

See: `PRIMITIVES.md`

---

*Systems are the recipes. When building components, reference these composed patterns. When in doubt, trace back to Principles.*
