# HIVE Design Direction: Underground Network

> "Tech that's here. For campus. Rebellious."

---

## The Vibe

HIVE is not another startup SaaS. It's the underground network that students built for themselves.

**Not this:**
- Polished Vercel clone
- Corporate-friendly
- Safe, forgettable
- Generic startup template

**This:**
- Raw but precise
- Student-owned energy
- Dark, neon-accented
- Underground network
- Unapologetic

---

## Interface Metaphor

**Primary:** Underground transit system / late-night campus / digital zine

- Spaces are **stations** on a network you traverse
- Navigation feels like moving through a **map**, not clicking menus
- The vibe is **2am in the library** - when real work happens
- Built by students, for students - not handed down from admin

**ChatGPT Influence:**
- Input is the hero (the text field is the center of everything)
- Conversation-first (content flows, not trapped in boxes)
- Dark + warm (not cold, has presence)
- Minimal chrome (UI disappears, content stays)
- One focus at a time (not overwhelming)

---

## Color System: "Neon Underground"

### Foundation
```
void:       #000000    // Pure black - rare, maximum contrast only
obsidian:   #0A0A0B    // Primary background - the darkness
charcoal:   #121214    // Elevated surfaces
graphite:   #1A1A1D    // Cards, containers
slate:      #242428    // Interactive elements
steel:      #2E2E33    // Borders, dividers
```

### Text Hierarchy
```
white:      #FAFAFA    // Primary text - crisp
silver:     #A1A1A6    // Secondary text
mercury:    #71717A    // Muted text
smoke:      #52525B    // Disabled, subtle
```

### Neon Accents (The Rebellion)
```
// Primary - Electric Gold (evolved from brand gold)
neon-gold:      #FFDD00    // Brighter, more electric than #FFD700
neon-gold-dim:  #CC9900    // Muted state

// Status - Vivid, unapologetic
neon-green:     #00FF88    // Success - electric mint
neon-red:       #FF3366    // Error - hot pink-red
neon-cyan:      #00DDFF    // Info - electric cyan
neon-orange:    #FF8800    // Warning - vivid amber

// Accent palette (for variety, used sparingly)
neon-purple:    #AA66FF    // Rare accent
neon-pink:      #FF66AA    // Rare accent
```

### Glow Effects
```
glow-gold:    0 0 20px rgba(255, 221, 0, 0.4)
glow-cyan:    0 0 20px rgba(0, 221, 255, 0.3)
glow-green:   0 0 20px rgba(0, 255, 136, 0.3)
glow-red:     0 0 15px rgba(255, 51, 102, 0.3)
```

---

## Typography: "Bold Grotesque"

### Font Stack
```
display:    'Space Grotesk', system-ui, sans-serif   // Headlines - geometric, bold
body:       'Inter', system-ui, sans-serif           // Body - clean, readable
mono:       'JetBrains Mono', monospace              // Code, data, timestamps
```

### Scale (Tighter, Bolder)
```
// Display - Impact
display-hero:   4rem / 700 / -0.03em     // 64px - Landing heroes
display-xl:     3rem / 700 / -0.02em     // 48px - Page titles
display-lg:     2.25rem / 600 / -0.02em  // 36px - Section headers
display-md:     1.75rem / 600 / -0.01em  // 28px - Card titles

// Body - Clarity
body-lg:        1.125rem / 400 / 0       // 18px - Lead paragraphs
body-md:        1rem / 400 / 0           // 16px - Standard body
body-sm:        0.875rem / 400 / 0       // 14px - Secondary text
body-xs:        0.75rem / 500 / 0.02em   // 12px - Labels, caps

// Mono - Data
mono-md:        0.875rem / 400 / 0       // 14px - Code, timestamps
mono-sm:        0.75rem / 400 / 0        // 12px - Metadata
```

### Typography Rules
1. Headlines in Space Grotesk - always bold, slightly tight tracking
2. Body in Inter - clean, never decorative
3. All-caps labels with wide tracking (0.1em+)
4. Monospace for anything data-like (timestamps, counts, IDs)

---

## Texture System: "Raw Precision"

### Noise Overlay
Subtle grain texture on backgrounds - not sterile, has presence.

```css
.texture-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}
```

### Border Treatment
Mix of sharp and rounded - not everything is pills.

```
radius-none:    0          // Brutalist elements
radius-sm:      4px        // Subtle rounding
radius-md:      8px        // Standard cards
radius-lg:      12px       // Buttons, inputs
radius-xl:      16px       // Large cards
radius-full:    9999px     // Pills, avatars
```

### Glow/Blur
Subtle glow on focus states, neon accents bloom slightly.

---

## Layout Paradigm: "Focus + Context"

### ChatGPT-Style Hierarchy
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Minimal, space name, quick actions                 │
├───────────────────────────────────────────────────────────── │
│                                                             │
│                    MAIN CONTENT                             │
│                                                             │
│            (conversation, feed, canvas)                     │
│                                                             │
│              Content is the focus.                          │
│              UI chrome is minimal.                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              INPUT FIELD (THE HERO)                  │   │
│  │  Large, prominent, inviting. This is where you act.  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar: Context, Not Navigation
The sidebar (when present) is for context:
- Active tools
- Members online
- Upcoming events
- Quick actions

NOT for primary navigation. Navigation is command palette + breadcrumbs.

### Information Density
- Default: Comfortable (not cramped)
- Chat: Dense message list, clear visual breaks between conversations
- HiveLab: IDE-density, inspector panels, property editors

---

## Motion Design: "Snappy + Subtle Glitch"

### Core Principles
1. **Fast by default** - 150-200ms for most transitions
2. **Springs for interaction** - Buttons, cards feel physical
3. **No decorative animation** - Everything serves purpose
4. **Occasional glitch** - Subtle digital artifacts on special moments

### Timing
```
instant:    50ms     // Micro-feedback
snap:       100ms    // Toggle states
quick:      150ms    // Button press
standard:   200ms    // Most transitions
smooth:     300ms    // Layout changes
dramatic:   500ms    // Page transitions (rare)
```

### Easing
```
default:    cubic-bezier(0.25, 0.1, 0.25, 1)     // Smooth
snappy:     cubic-bezier(0.4, 0, 0.2, 1)         // Quick in/out
bounce:     cubic-bezier(0.34, 1.56, 0.64, 1)    // Playful overshoot
```

### Glitch Moments (Use Sparingly)
- Achievement unlocked
- New message from space you follow
- Successful action completion
- Error states (subtle shake)

```css
@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, 2px); }
  80% { transform: translate(1px, -2px); }
}
```

---

## Component Philosophy

### Buttons
```
Primary:    Neon gold background, dark text, glow on hover
Secondary:  Transparent, subtle border, text color on hover
Ghost:      No border, text only, subtle background on hover
Danger:     Neon red background on hover, not default
```

### Inputs
```
Background:     Slightly lighter than surface (#1A1A1D)
Border:         Subtle (#2E2E33), neon accent on focus
Placeholder:    Muted (#52525B)
Text:           White (#FAFAFA)
Focus ring:     Neon gold glow
```

### Cards
```
Background:     Graphite (#1A1A1D)
Border:         Steel (#2E2E33) or none
Hover:          Slight lift, border brightens
Interactive:    Entire card clickable, subtle glow on hover
```

### The Hero Input (ChatGPT-style)
```
- Centered or bottom-fixed
- Large (min-height 56px)
- Prominent border radius (12-16px)
- Subtle inner shadow
- Neon gold focus glow
- Placeholder that inspires action: "Ask anything..." / "Start typing..."
- Actions (attach, send) subtly inside
```

---

## Dark Mode = Only Mode

We are dark-first. There is no light mode initially.

**Why:**
1. Students are nocturnal - dark mode respects their environment
2. Neon accents pop on dark backgrounds
3. Underground/rebellious aesthetic requires darkness
4. Reduces eye strain for long sessions
5. Differentiation - every SaaS is light-mode-default

**Future consideration:** If we add light mode, it should feel like a "day mode" toggle, not the default.

---

## Anti-Patterns (What We Avoid)

1. **No gradient backgrounds** - Flat colors only
2. **No heavy drop shadows** - Subtle elevation, not floating cards
3. **No rounded everything** - Mix sharp and rounded intentionally
4. **No decorative animations** - Motion serves function
5. **No blue links** - Neon gold or white for links
6. **No corporate stock imagery** - Real photos or abstract graphics
7. **No empty states with cute illustrations** - Functional, clear messaging
8. **No excessive whitespace** - Comfortable density, not wasteful
9. **No skeleton loaders** - Simple spinners or instant states

---

## Reference Touchstones

### Interfaces to Study
- **ChatGPT** - Input-centric, conversation flow, dark warmth
- **Linear** - Snappy motion, command palette, data density
- **Vercel** - Typography, minimal chrome, professional darkness
- **Figma** - Tool interface, inspector patterns, canvas
- **Discord** - Community chat patterns (but less playful)
- **Raycast** - Command palette perfection, keyboard-first

### Aesthetic References
- Subway signage (high contrast, clear hierarchy)
- Zine culture (raw, DIY, bold typography)
- Neon signs at night (glow, presence, warmth)
- Underground clubs (dark, intentional, curated)
- Developer tools (dense information, functional beauty)

---

## Implementation Priorities

### Phase 1: Foundation
1. Update color tokens to new Neon Underground palette
2. Set dark mode as default (remove light mode temporarily)
3. Update typography system with Space Grotesk headers
4. Add noise texture utility

### Phase 2: Components
1. Hero input component (ChatGPT-style)
2. Update button variants with glow states
3. Update card components with new border treatment
4. Command palette styling

### Phase 3: Pages
1. Space chat page - conversation flow
2. Landing page - bold statement
3. HiveLab - tool density

---

## Success Metrics

**You'll know we succeeded when:**
- Screenshots look distinctly like HIVE, not "any startup app"
- Students say "this looks sick" not "this looks nice"
- The interface feels *alive* after 5 minutes, not generic
- New users immediately understand it's for students, by students
- The dark + neon feels intentional, not just trendy

---

*"We built this ourselves. Welcome to the underground."*
