# HIVE LANGUAGE

## Level 3: The Visual Vocabulary

*Last updated: January 2026*

---

## WHAT THIS DOCUMENT IS

Language is where principles become concrete. These are the actual tokens, values, and named elements that implement everything upstream. When you need a color, spacing value, or font — this is the source of truth.

```
Level 0: WORLDVIEW (what we believe)     ← WORLDVIEW.md
    ↓
Level 1: PHILOSOPHY (how it feels)       ← PHILOSOPHY.md
    ↓
Level 2: PRINCIPLES (rules that guide)   ← PRINCIPLES.md
    ↓
Level 3: LANGUAGE (visual vocabulary)    ← THIS DOCUMENT
    ↓
Level 4: SYSTEMS → Level 5: PRIMITIVES → Level 6: COMPONENTS
    ↓
Level 7: PATTERNS → Level 8: TEMPLATES → Level 9: INSTANCES
```

---

## THE ANALOGY: THE ROOM AT 3AM

Before the tokens, understand the metaphor. HIVE is a room at 3am.

**The darkness** — Layers of black, not a single void. Your eyes adjust. You see corners (void), floor (ground), furniture (surface), faces (content).

**The warmth** — Not cold tech. Warm screens, body heat, presence. The darks have subtle warmth. Activity adds more.

**The campfire** — Gold is the singular heat source. Rare. Precious. When you see it, it means life.

**The breathing** — Everything alive has a pulse. 3-5 second rhythm. The UI breathes.

**The conversation** — Typography is voice. Headlines announce (Clash). Body text converses (Geist). Both are confident, unhurried.

---

## PART 1: TYPOGRAPHY

### The Pairing

| Role | Font | Why |
|------|------|-----|
| **Display** | Clash Display | Personality, memorable, geometric but warm |
| **Body** | Geist | Builder credibility, clean, dark-mode optimized |
| **Mono** | Geist Mono | Technical content, stats, code |

### Font Stack

```css
--font-display: "Clash Display", "SF Pro Display", system-ui, sans-serif;
--font-body: "Geist", "SF Pro Text", system-ui, sans-serif;
--font-mono: "Geist Mono", "SF Mono", ui-monospace, monospace;
```

### When To Use What

| Context | Font | Size Range |
|---------|------|------------|
| Hero headlines | Clash Display | 48px - 72px+ |
| Page titles | Clash Display | 32px - 40px |
| Section headers | Geist Semibold | 20px - 24px |
| Body text | Geist Regular | 14px - 16px |
| Captions, labels | Geist Medium | 11px - 12px |
| Stats, numbers | Geist Mono | Any |
| Code | Geist Mono | 13px - 14px |

**The Rule:** Clash Display at 32px and above. Geist for everything else.

---

### Type Scale

```css
--text-xs: 11px;      /* Whisper - timestamps, fine print */
--text-sm: 12px;      /* Caption - labels, secondary info */
--text-base: 14px;    /* Body - default, conversation */
--text-lg: 16px;      /* Lead - emphasized body */
--text-xl: 20px;      /* Subhead - section titles (Geist) */
--text-2xl: 24px;     /* Title - card headers (Geist) */
--text-3xl: 32px;     /* Display - page titles (Clash begins) */
--text-4xl: 40px;     /* Display - hero sections (Clash) */
--text-5xl: 48px;     /* Hero - landing headlines (Clash) */
--text-6xl: 56px;     /* Hero - major statements (Clash) */
--text-hero: 72px;    /* Massive - landing hero only (Clash) */
```

---

### Weights

```css
--font-regular: 400;   /* Body text, conversation */
--font-medium: 500;    /* Labels, emphasis, buttons */
--font-semibold: 600;  /* Headlines, subheads, important */
--font-bold: 700;      /* Rare - only hero moments */
```

**Usage by font:**

| Font | Weights Used |
|------|--------------|
| Clash Display | 600 (primary), 700 (rare hero) |
| Geist | 400 (body), 500 (labels), 600 (subheads) |
| Geist Mono | 400 (default), 500 (emphasis) |

---

### Line Height

```css
--leading-none: 1;       /* Hero headlines only */
--leading-tight: 1.1;    /* Display text, headlines */
--leading-snug: 1.25;    /* Subheads, short text */
--leading-normal: 1.5;   /* Body text - the default */
--leading-relaxed: 1.75; /* Long-form, rare */
```

**The Rule:** Headlines tight. Body normal. When in doubt, 1.5.

---

### Letter Spacing

```css
--tracking-tighter: -0.03em;  /* Large Clash headlines */
--tracking-tight: -0.02em;    /* Display text */
--tracking-normal: 0;         /* Body - the default */
--tracking-wide: 0.02em;      /* All caps labels */
--tracking-wider: 0.05em;     /* Mono, spaced labels */
```

---

### Typography Tokens (Combined)

```css
/* Display - Clash Display */
--type-hero: 700 72px/1 var(--font-display);       /* tracking-tighter */
--type-display-xl: 600 56px/1.1 var(--font-display); /* tracking-tighter */
--type-display-lg: 600 48px/1.1 var(--font-display); /* tracking-tight */
--type-display: 600 40px/1.1 var(--font-display);    /* tracking-tight */
--type-display-sm: 600 32px/1.1 var(--font-display); /* tracking-tight */

/* Headings - Geist */
--type-heading-lg: 600 24px/1.25 var(--font-body);
--type-heading: 600 20px/1.25 var(--font-body);
--type-heading-sm: 600 16px/1.25 var(--font-body);

/* Body - Geist */
--type-body-lg: 400 16px/1.5 var(--font-body);
--type-body: 400 14px/1.5 var(--font-body);
--type-body-sm: 400 13px/1.5 var(--font-body);

/* UI - Geist */
--type-label: 500 12px/1.25 var(--font-body);      /* tracking-wide */
--type-caption: 400 12px/1.5 var(--font-body);
--type-fine: 400 11px/1.5 var(--font-body);

/* Mono - Geist Mono */
--type-mono: 400 14px/1.5 var(--font-mono);
--type-mono-sm: 400 12px/1.5 var(--font-mono);
--type-stat: 500 14px/1 var(--font-mono);          /* For numbers */
```

---

## PART 2: COLOR

### The Philosophy

- **Monochrome discipline:** 95% grayscale
- **Warm dark:** Subtle warmth in the blacks, felt not seen
- **Ultra-rare gold:** 1-2% for life only
- **White accents:** 4% for your actions, focus

### The Metaphor

| Layer | What It Is | Color |
|-------|------------|-------|
| **Void** | The corners you can't see | #050504 |
| **Ground** | The floor, the walls | #0A0A09 |
| **Surface** | Furniture, shapes | #141312 |
| **Hover** | When you look directly | #1A1917 |
| **Active** | When you touch | #252521 |
| **Content** | Faces, text | #FAF9F7 → #3D3D42 |
| **Life** | The campfire | #FFD700 |

---

### Background Colors

```css
/* Core backgrounds - warm dark */
--bg-void: #050504;           /* Deepest - behind everything */
--bg-ground: #0A0A09;         /* Page background - the default */
--bg-surface: #141312;        /* Cards, containers */
--bg-surface-hover: #1A1917;  /* Hovered surfaces */
--bg-surface-active: #252521; /* Active/pressed surfaces */
--bg-elevated: #1E1D1B;       /* Modals, dropdowns */

/* Subtle fills - for interactive elements */
--bg-subtle: rgba(255, 255, 255, 0.03);
--bg-muted: rgba(255, 255, 255, 0.06);
--bg-emphasis: rgba(255, 255, 255, 0.10);
```

---

### Text Colors

```css
/* Text hierarchy - slightly warm whites */
--text-primary: #FAF9F7;      /* Main content - 95% visible */
--text-secondary: #A3A19E;    /* Supporting text - 65% visible */
--text-tertiary: #6B6B70;     /* Subtle text - 40% visible */
--text-muted: #3D3D42;        /* Barely there - 25% visible */
--text-ghost: #2A2A2E;        /* Hint - 15% visible */

/* Inverse - for light surfaces (rare) */
--text-inverse: #0A0A09;
```

---

### Interactive Colors

```css
/* Interactive surfaces */
--interactive-default: rgba(255, 255, 255, 0.06);
--interactive-hover: rgba(255, 255, 255, 0.10);
--interactive-active: rgba(255, 255, 255, 0.15);

/* Focus - white, not gold */
--focus-ring: rgba(255, 255, 255, 0.50);
--focus-ring-offset: var(--bg-ground);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.10);
--border-emphasis: rgba(255, 255, 255, 0.15);
```

---

### Life Colors (Gold)

```css
/* Gold - the campfire - use sparingly */
--life-gold: #FFD700;                    /* Pure gold - CTAs, presence */
--life-gold-hover: #FFDF33;              /* Slightly lighter on hover */
--life-gold-active: #E5C200;             /* Slightly darker on press */
--life-pulse: rgba(255, 215, 0, 0.60);   /* Pulsing indicators */
--life-glow: rgba(255, 215, 0, 0.15);    /* Background glow */
--life-subtle: rgba(255, 215, 0, 0.08);  /* Barely there warmth */
--life-text: #FFD700;                    /* Gold text (rare) */
```

### When To Use Gold

| Use Case | Token | Example |
|----------|-------|---------|
| Primary CTA | `--life-gold` on text/bg | "Get Started" button |
| Typing indicator | `--life-pulse` | "..." animation |
| Presence dot | `--life-gold` | Active user indicator |
| Achievement | `--life-gold` + `--life-glow` | Badge, milestone |
| Active count | `--life-text` | "127 active" number only |
| Hover glow | `--life-subtle` | Button hover background |

### When NOT To Use Gold

- Decorative borders
- Icons (unless indicating life)
- Links
- Hover states (use grayscale)
- Random accents
- "It would look nice here"

---

### Status Colors

```css
/* Status - use only for explicit feedback, very rare */
--status-error: #EF4444;
--status-error-subtle: rgba(239, 68, 68, 0.15);
--status-warning: #F59E0B;
--status-warning-subtle: rgba(245, 158, 11, 0.15);
--status-success: #22C55E;
--status-success-subtle: rgba(34, 197, 94, 0.15);
```

**Note:** Status colors should be rare. Most feedback should use motion, position, or copy — not color.

---

### Color Composition

**The 100% breakdown:**

| Percentage | Color Type | Usage |
|------------|------------|-------|
| 70% | Dark backgrounds | Void, ground, surfaces |
| 20% | Text grays | Content hierarchy |
| 5% | Interactive whites | Fills, borders, focus |
| 4% | White accents | Your actions, highlights |
| 1% | Gold | Life indicators only |

---

## PART 3: SPACING

### The Philosophy

- **Generous by default:** More space than you think you need
- **Breathing room:** The 3am room isn't crowded
- **4px base:** Everything divisible by 4

### The Metaphor

| Spacing | Relationship | Token |
|---------|--------------|-------|
| 4px | Touching - same element | `--space-1` |
| 8px | Intimate - closely related | `--space-2` |
| 12px | Close - grouped items | `--space-3` |
| 16px | Comfortable - default | `--space-4` |
| 24px | Breathing - section items | `--space-6` |
| 32px | Roomy - distinct groups | `--space-8` |
| 48px | Spacious - major sections | `--space-12` |
| 64px | Vast - page divisions | `--space-16` |
| 96px | Grand - hero spacing | `--space-24` |

---

### Spacing Scale

```css
--space-px: 1px;
--space-0: 0;
--space-0.5: 2px;
--space-1: 4px;
--space-1.5: 6px;
--space-2: 8px;
--space-2.5: 10px;
--space-3: 12px;
--space-3.5: 14px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-9: 36px;
--space-10: 40px;
--space-11: 44px;
--space-12: 48px;
--space-14: 56px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-28: 112px;
--space-32: 128px;
```

---

### Spacing Guidelines

| Context | Recommended | Token |
|---------|-------------|-------|
| Inside buttons | 12px horizontal, 8px vertical | `--space-3`, `--space-2` |
| Between form fields | 16px | `--space-4` |
| Card padding | 24px | `--space-6` |
| Between cards | 16px - 24px | `--space-4` - `--space-6` |
| Section padding | 48px - 64px | `--space-12` - `--space-16` |
| Page margins (mobile) | 16px - 24px | `--space-4` - `--space-6` |
| Page margins (desktop) | 48px - 96px | `--space-12` - `--space-24` |
| Between sections | 64px - 96px | `--space-16` - `--space-24` |

**The Rule:** When in doubt, add space. If it feels cramped, double it.

---

## PART 4: MOTION

### The Philosophy

- **Smooth continuous:** 300ms+ for most transitions
- **Premium feel:** Ease curves that decelerate gracefully
- **Minimal in spots:** Fast for high-frequency interactions
- **Ambient life:** Background drift, breathing indicators

### The Metaphor

| Speed | Like... | Duration |
|-------|---------|----------|
| Instant | Flick of eyes | 0ms |
| Snap | Quick gesture | 100ms |
| Fast | Turning your head | 150ms |
| Quick | Looking at someone | 200ms |
| Smooth | Walking across room | 300ms |
| Gentle | Settling into chair | 400ms |
| Slow | Considered movement | 500ms |
| Dramatic | Everyone notices | 700ms |
| Breathe | Natural rhythm | 3000ms |
| Drift | Smoke, ambient | 20000ms |

---

### Duration Tokens

```css
--duration-instant: 0ms;
--duration-snap: 100ms;
--duration-fast: 150ms;
--duration-quick: 200ms;
--duration-smooth: 300ms;     /* The default */
--duration-gentle: 400ms;
--duration-slow: 500ms;
--duration-dramatic: 700ms;   /* Rare */
--duration-breathe: 3000ms;   /* Pulse animations */
--duration-drift: 20000ms;    /* Background ambient */
```

---

### Easing Tokens

```css
/* Premium smooth - the default, use for most transitions */
--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);

/* Standard out - decelerate into place */
--ease-out: cubic-bezier(0, 0, 0.2, 1);

/* In-out - for looping animations */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Linear - only for progress bars, never UI */
--ease-linear: linear;
```

### Easings We NEVER Use

```css
/* NO - Too bouncy, not 3am */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* NO - Too aggressive */
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* NO - Robotic */
--ease-linear: linear; /* except progress bars */
```

---

### Motion By Context

| Context | Duration | Easing | Notes |
|---------|----------|--------|-------|
| Button hover | 200ms | ease-smooth | Quick but smooth |
| Button press | 100ms | ease-out | Snap feedback |
| Card hover brightness | 150ms | ease-snap | No lift - brightness only |
| Dropdown open | 200ms | ease-smooth | Quick reveal |
| Modal enter | 300ms | ease-smooth | Deliberate |
| Modal exit | 200ms | ease-out | Faster out |
| Page transition | 400-500ms | ease-smooth | Premium |
| Fade in content | 300ms | ease-out | Settle in |
| Toast appear | 300ms | ease-smooth | Slide + fade |
| Toast dismiss | 200ms | ease-out | Quick exit |
| Skeleton shimmer | 2000ms | ease-in-out | Looping |
| Typing indicator | 3000ms | ease-in-out | Breathe |
| Presence pulse | 4000ms | ease-in-out | Heartbeat |
| Background drift | 20000ms | linear | Subliminal |
| Toggle switch | 150ms | ease-out | Snap |
| Checkbox | 100ms | ease-out | Instant feel |

---

### Animation Patterns

**The Breathe (for life indicators):**
```css
@keyframes breathe {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
/* Use: animation: breathe 4s ease-in-out infinite; */
```

**The Pulse (for gold elements):**
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}
/* Use: animation: pulse 3s ease-in-out infinite; */
```

**The Drift (for background elements):**
```css
@keyframes drift {
  0% { transform: translate(0, 0); }
  50% { transform: translate(10px, 5px); }
  100% { transform: translate(0, 0); }
}
/* Use: animation: drift 20s ease-in-out infinite; */
```

**The Shimmer (for loading):**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* Use on gradient background, animation: shimmer 2s linear infinite; */
```

---

## PART 5: DEPTH

### The Philosophy

- **Layers, not lines:** Depth through z-space, not borders
- **Atmosphere:** Blur creates focus and depth
- **Subtle shadows:** Used sparingly, for float only

### The Stage Metaphor

```
z-0   [VOID]      → The backdrop, pure black
z-10  [GROUND]    → The stage floor
z-20  [SURFACE]   → Set pieces, cards
z-30  [DROPDOWN]  → Menus floating above
z-40  [STICKY]    → Headers that follow
z-50  [MODAL]     → Spotlight moments
z-60  [OVERLAY]   → Stage dims except focus
z-70  [TOAST]     → Quick announcements
z-100 [MAX]       → Above everything (rare)
```

---

### Z-Index Scale

```css
--z-base: 0;
--z-raised: 10;
--z-dropdown: 20;
--z-sticky: 30;
--z-modal: 40;
--z-overlay: 50;
--z-toast: 60;
--z-tooltip: 70;
--z-max: 100;
```

---

### Blur Tokens

```css
--blur-none: 0;
--blur-subtle: 4px;      /* Secondary content */
--blur-glass: 8px;       /* Glass surfaces */
--blur-medium: 12px;     /* Overlays */
--blur-heavy: 16px;      /* Strong separation */
--blur-atmosphere: 40px; /* Background atmosphere */
```

### When To Blur

| Element | Blur | Example |
|---------|------|---------|
| Glass card | `--blur-glass` | Floating containers |
| Modal backdrop | `--blur-medium` | Behind modals |
| Dropdown | `--blur-subtle` | Menus |
| Background atmosphere | `--blur-atmosphere` | Ambient glows |

---

### Shadow Tokens

```css
/* Shadows - use sparingly, only for float */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);

/* Gold glow - for life elements */
--shadow-glow-sm: 0 0 20px rgba(255, 215, 0, 0.15);
--shadow-glow-md: 0 0 40px rgba(255, 215, 0, 0.20);
--shadow-glow-lg: 0 0 60px rgba(255, 215, 0, 0.25);

/* White glow - for focus/hover */
--shadow-glow-white: 0 0 30px rgba(255, 255, 255, 0.10);
```

---

### Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;
--radius-md: 8px;       /* Default for most elements */
--radius-lg: 12px;      /* Cards, containers */
--radius-xl: 16px;      /* Large cards */
--radius-2xl: 24px;     /* Hero elements */
--radius-full: 9999px;  /* Pills, avatars */
```

### Radius Guidelines

| Element | Radius | Token |
|---------|--------|-------|
| Buttons | 8px | `--radius-md` |
| Inputs | 8px | `--radius-md` |
| Small cards | 12px | `--radius-lg` |
| Large cards | 16px | `--radius-xl` |
| Modals | 16px - 24px | `--radius-xl` - `--radius-2xl` |
| Avatars | Full | `--radius-full` |
| Tags/badges | Full | `--radius-full` |
| Tooltips | 8px | `--radius-md` |

---

## PART 6: ATMOSPHERE

### The Philosophy

Atmosphere is what makes it 3am, not just dark mode.

### Glow Tokens

```css
/* Ambient glows - for background atmosphere */
--glow-warm: radial-gradient(
  ellipse 80% 50% at 50% -20%,
  rgba(255, 245, 235, 0.03) 0%,
  transparent 60%
);

--glow-gold: radial-gradient(
  ellipse at center,
  rgba(255, 215, 0, 0.08) 0%,
  transparent 70%
);

--glow-soft: radial-gradient(
  ellipse at center,
  rgba(255, 255, 255, 0.02) 0%,
  transparent 70%
);

/* Behind active elements */
--glow-behind: radial-gradient(
  circle at center,
  rgba(255, 215, 0, 0.05) 0%,
  transparent 50%
);
```

### Grain Texture

```css
/* Apply via pseudo-element or mix-blend-mode */
--grain-opacity-subtle: 0.02;  /* Barely there */
--grain-opacity-texture: 0.05; /* Visible texture */
```

### Usage

```css
/* Adding warmth to a section */
.section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--glow-warm);
  pointer-events: none;
}

/* Behind a gold CTA */
.cta-container::before {
  content: '';
  position: absolute;
  inset: -20px;
  background: var(--glow-gold);
  filter: blur(var(--blur-atmosphere));
  pointer-events: none;
}
```

---

## PART 7: VOCABULARY & VOICE

> **Full voice documentation: `VOICE.md`**

### The Voice

> We stopped waiting for institutions. Students build what's missing. Your org, your rules, no permission. The builders inherit what comes next.

This is the filter for every word HIVE writes.

### Voice Rules (Summary)

| Do | Don't |
|----|-------|
| Short declaratives | Exclamation marks |
| Ownership language ("Yours") | Corporate warmth |
| Builder verbs (Build, Create, Deploy) | Apology mode ("Coming soon") |
| Peer tone | Marketing superlatives |
| Assume they get it | Over-explanation |

### What We Call Things

| We Say | Not | Why |
|--------|-----|-----|
| **Space** | Group, Server, Channel | A place you inhabit |
| **Member** | User, Follower | Part of something |
| **Builder** | Creator, Maker | You build, you ship |
| **Tool** | App, Widget | Something useful |
| **Deploy** | Publish, Launch | Ship to production |
| **Active** | Online, Available | Alive, present |
| **Here** | Online, Present | In this place |
| **Territory** | Platform, Network | Land you claim |
| **Canvas** | Empty state | Potential, not absence |

### Tone Patterns

| Instead Of | Say |
|------------|-----|
| "Welcome to HIVE!" | "You're in." |
| "Create your first Space" | "Start a Space" |
| "Submit" | "Done" or action-specific |
| "Click here to learn more" | Just make it a link |
| "Error occurred" | "That didn't work" |
| "Successfully created" | "Created" (or nothing) |
| "Are you sure you want to delete?" | "Delete this? Can't undo." |
| "Coming Soon" | "Building" |
| "No messages yet" | "Start the conversation" |
| "Something went wrong" | "Something broke." |

### Context-Specific Voice

| Context | Energy | Example |
|---------|--------|---------|
| Landing | Manifesto, rebellion | "We stopped waiting." |
| Auth | Ownership transfer | "You're in." |
| Onboarding | Anticipation | "It's yours." |
| Spaces | Territory, control | "Claim your territory" |
| Errors | Peer recovery | "Something broke. Try again." |
| Empty states | Canvas, potential | "Your canvas" |

**See `VOICE.md` for complete patterns, context guides, and tests.**

---

## PART 8: UNIQUE ELEMENTS

### The Philosophy

Generous spacing is the canvas. Unique elements are the art. Every screen gets 1-2 maximum.

### What Makes An Element Unique

1. **Scale contrast** — One huge thing among small things
2. **Motion contrast** — One moving thing among still things
3. **Gold accent** — The rare life indicator
4. **Typography shift** — Clash Display in a sea of Geist
5. **Asymmetric placement** — Intentionally off-grid
6. **Depth pop** — Floats above the rest

### Examples

| Screen | Unique Element |
|--------|----------------|
| Landing hero | The headline (Clash, 56px+, generous space) |
| Space view | Pinned message card (larger, gold border, glows) |
| HiveLab | Deploy button (gold, pulsing glow) |
| Profile | Activity widget (live numbers, breathing) |
| Empty state | Single illustration or statement |

---

## QUICK REFERENCE

### Most Used Tokens

```css
/* Backgrounds */
--bg-ground: #0A0A09;
--bg-surface: #141312;
--bg-surface-hover: #1A1917;

/* Text */
--text-primary: #FAF9F7;
--text-secondary: #A3A19E;
--text-muted: #3D3D42;

/* Interactive */
--interactive-hover: rgba(255, 255, 255, 0.10);
--focus-ring: rgba(255, 255, 255, 0.50);

/* Gold */
--life-gold: #FFD700;
--life-glow: rgba(255, 215, 0, 0.15);

/* Spacing */
--space-4: 16px;   /* Default */
--space-6: 24px;   /* Card padding */
--space-12: 48px;  /* Section padding */

/* Motion */
--duration-smooth: 300ms;
--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);

/* Radius */
--radius-md: 8px;
--radius-lg: 12px;

/* Blur */
--blur-glass: 8px;
```

---

## IMPLEMENTATION NOTES

### CSS Custom Properties

All tokens should be defined as CSS custom properties in a global stylesheet:

```css
:root {
  /* All tokens here */
}
```

### Tailwind Integration

Map tokens to Tailwind config for utility class usage:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ground: '#0A0A09',
        surface: '#141312',
        'surface-hover': '#1A1917',
        gold: '#FFD700',
        // etc.
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      // etc.
    }
  }
}
```

### Font Loading

Load Clash Display from Fontshare (free) and Geist from Vercel:

```html
<!-- Clash Display -->
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">

<!-- Geist (via npm or CDN) -->
```

---

## NEXT LEVEL

Language flows into **Systems (Level 4)** — the composed tokens and reusable value combinations.

See: `SYSTEMS.md`

---

*This document is the source of truth for visual values. When in doubt, reference these tokens. When tokens conflict with principles, principles win.*
