# HIVE Design Direction

> Apple craft. HIVE warmth. ChatGPT focus.

**Last Updated:** December 2024
**Status:** Approved Direction

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Art Direction](#art-direction)
3. [Visual Language](#visual-language)
4. [Spaces Design](#spaces-design)
5. [HiveLab Design](#hivelab-design)
6. [Navigation Model](#navigation-model)
7. [Component Specifications](#component-specifications)
8. [Motion System](#motion-system)
9. [Implementation Priorities](#implementation-priorities)

---

## Philosophy

### The Core Formula

```
Apple/YC/SF visual craft
         +
HIVE warmth (gold, alive, collective)
         +
ChatGPT interaction model (input-centric, minimal chrome)
         =
Something distinctly HIVE
```

### What HIVE Is

HIVE is the operating system for campus communities. The interface should feel like:

- **Premium tech product** — Apple-level obsessive craft
- **Alive with presence** — You feel the collective, not just see a member list
- **Warm, not cold** — Gold accent, organic energy, student-owned
- **Dark-first** — Students are nocturnal; the interface is designed FOR darkness

### What HIVE Is Not

| Not This | This |
|----------|------|
| Polished startup template | Distinctive, memorable |
| Discord clone in dark mode | Something students screenshot and share |
| Corporate-friendly | Student-owned energy |
| Generic SaaS | "This is OURS" |
| Flat and sterile | Layered with depth and presence |

### The Test

**Would a student screenshot this and send it to a friend?**

If yes → we're on track.
If no → not bold enough.

---

## Art Direction

### The Mood: "Campus at Night"

The interface feels like **11pm on campus**. Dark because it's night. Alive because people are everywhere — lights in windows, paths of activity, the hum of collective energy.

- **Dark backgrounds** = night sky
- **Gold glows** = warm light spilling from spaces
- **Activity indicators** = people moving between buildings
- **Smooth transitions** = walking between places, not clicking pages
- **Ambient presence** = you feel others even in quiet moments

### The Metaphor

**Spaces = Coffee Shop** (warm, social, conversational)
**HiveLab = Artist's Studio** (creative, focused, making things)

Both are HIVE. Both are warm. Different modes for different activities.

### Visual Principles

1. **Gold is Light** — Gold means life, activity, presence. Where there's gold, something is alive.
2. **Depth You Can Feel** — Not flat, not skeuomorphic. Layered glass. Subtle shadows.
3. **Typography Declares** — Headlines hit hard. Body text disappears. Data is monospace.
4. **Motion Has Mass** — Everything moves like it has weight. Springs, not linear easing.
5. **Chrome Disappears** — UI gets out of the way. Content is sacred.

### Signature Moments

| Moment | Experience |
|--------|------------|
| Entering a space | Space name fills screen (1s), fades to conversation. You ARRIVE. |
| Receiving a message | Slides in from sender's side. Avatar pulses gold. Visual "weight." |
| Opening command palette | Instant. No delay. Background blurs. You feel POWER. |
| Activity spike | Ambient warmth increases. Avatar stack compresses. Space heats up. |
| Shipping a tool | Tool pulses gold once, strong. Confident flash of "it's live." |

---

## Visual Language

### Color System

**Foundation (Dark Warmth)**
```
void:       #000000    // Pure black - rare, maximum contrast
obsidian:   #0C0C0E    // Primary background (slight warmth)
charcoal:   #141416    // Elevated surfaces, input backgrounds
graphite:   #1A1A1C    // Cards, containers
slate:      #242428    // Interactive elements
steel:      #2E2E33    // Borders, dividers
```

**Text Hierarchy**
```
white:      #FAFAFA    // Primary text - crisp
silver:     #A1A1A6    // Secondary text
mercury:    #71717A    // Muted text
smoke:      #52525B    // Disabled, subtle
```

**Brand Accent**
```
gold:       #FFD700    // Primary accent - HIVE gold (unchanged)
gold-dim:   #CC9900    // Muted/disabled gold
gold-glow:  rgba(255, 215, 0, 0.4)  // Glow effect
```

**Status Colors**
```
success:    #00D46A    // Bright green
error:      #FF3737    // Bright red
warning:    #FFB800    // Amber
info:       #FAFAFA    // White (no blue)
```

**Gold = Life Rule**
Gold is reserved for:
- Online/active status
- Primary CTAs
- Unread indicators
- Selected/active states
- Achievement moments

Everything else is grayscale. Gold is earned.

### Typography

**Font Stack**
```
display:    'Space Grotesk', system-ui, sans-serif   // Headlines
body:       'Inter', system-ui, sans-serif           // Body text
mono:       'JetBrains Mono', monospace              // Data, timestamps
```

**Scale**
```
// Display - Bold, tight tracking
display-hero:   48px / 700 / -0.03em    // Space entry moments
display-xl:     36px / 700 / -0.02em    // Page titles
display-lg:     28px / 600 / -0.02em    // Section headers
display-md:     24px / 600 / -0.01em    // Card titles

// Body - Clean, readable
body-lg:        18px / 400 / 0          // Lead paragraphs
body-md:        16px / 400 / 0          // Standard body
body-sm:        14px / 400 / 0          // Secondary text
body-xs:        12px / 500 / 0.02em     // Labels

// Mono - Data
mono-md:        14px / 400 / 0          // Timestamps, counts
mono-sm:        12px / 400 / 0          // Metadata
```

**Rules**
1. Headlines in Space Grotesk — bold, tight tracking, they OWN the space
2. Body in Inter — invisible, you read the words not the font
3. Monospace for data — timestamps, counts, IDs clearly marked
4. All-caps labels with wide tracking (0.1em+)

### Depth System

**Elevation Layers**
```
L0: Page background      #0C0C0E
L1: Cards, surfaces      #141416
L2: Elevated (hover)     #1A1A1C
L3: Modal backdrop       rgba(0,0,0,0.6) + blur(16px)
L4: Modal surface        #141416 + shadow-lg
L5: Dropdown/popover     #1A1A1C + shadow-xl
```

**Shadows**
```
shadow-sm:    0 1px 2px rgba(0,0,0,0.3)
shadow-md:    0 4px 12px rgba(0,0,0,0.25)
shadow-lg:    0 8px 24px rgba(0,0,0,0.3)
shadow-xl:    0 12px 32px rgba(0,0,0,0.4)
shadow-glow:  0 0 20px rgba(255,215,0,0.15)
```

**Blur**
```
blur-sm:      8px     // Tooltips
blur-md:      12px    // Sheets
blur-lg:      16px    // Modals, command palette
```

### Border Radius

**Mixed Intentionally** — Not everything is pills.
```
radius-none:    0          // Brutalist elements (rare)
radius-sm:      4px        // Subtle rounding
radius-md:      8px        // Standard cards
radius-lg:      12px       // Buttons, inputs
radius-xl:      16px       // Large cards, modals
radius-full:    9999px     // Pills, avatars, badges
```

---

## Spaces Design

### Layout: Conversation-First

```
┌─────────────────────────────────────────────────────────────┐
│ ← UB Design Club                               ◉◉◉ 23   ⌘K │
├─────────────────────────────────────────────────────────────┤
│ [● General]  [Events]  [Resources]  [+]                     │ ← board tabs
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────────────────────────────────────────────────┐ │
│   │  📊 QUICK POLL: Where should we meet?    [12 votes]   │ │ ← featured tool
│   │     ○ Library  ○ Union  ○ Cafe                        │ │   (always visible)
│   └───────────────────────────────────────────────────────┘ │
│                                                             │
│   ◉ Sarah    │ I think we should meet at the library       │
│              │ tomorrow around 7pm                          │
│                                                             │
│                                    │ Works for me!   │ You  │
│                                                             │
│   ◉ Mike     │ I'll bring the project files                │
│              │ 📎 design-v2.fig                             │
│                                                             │
│                                                             │
│         ╭─────────────────────────────────────────────╮     │
│         │                                             │     │
│         │   Message #general...                   ↵   │     │ ← hero input
│         │                                             │     │
│         ╰─────────────────────────────────────────────╯     │
│                                                             │
│   ◉ Sarah typing...                 📎  /  @   ⚡  👥  📅   │ ← actions
│                                                             │
├─────────────────────────────────────────────────────────────┤
│        ◉ Design   ○ Photo   ○ CS101   ○ Gym   │  +  │  ⌘K  │ ← dock
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

**1. No Persistent Sidebar**

The traditional sidebar is replaced by:
- **Command palette** (⌘K) for navigation
- **Dock** for pinned spaces (bottom)
- **Context panel** (slide-in from right) for tools, members, events

Why: Screen real estate goes to conversation. Sidebar ate 240px constantly.

**2. Featured Tool Slot**

Each space can have ONE featured tool that's always visible above the conversation.
- Leader chooses which tool to feature on deploy
- Guarantees tool visibility without cluttering the conversation
- Secondary tools live in the context panel (⚡ button)

**3. Message Layout**

| Context | Layout |
|---------|--------|
| Spaces (many people) | Linear list, your messages subtly right-aligned or tinted |
| DMs (1:1) | Left/right bubble style |

Why: Left/right bubbles get crowded with many participants.

**4. Board Tabs**

Visible row below header, not hidden. Boards are core navigation within a space.
- Active board has gold indicator (●)
- Horizontal scroll if many boards
- `+` to create new board
- Also accessible via `⌘K → #boardname`

**5. Threading**

Threads open in the context panel (right side).
- Click "3 replies" → thread opens beside conversation
- You stay in main flow while viewing/replying to thread
- Thread has its own input field

```
┌────────────────────────────────────┬────────────────────────┐
│                                    │                        │
│  Main conversation                 │  THREAD           ✕    │
│                                    │                        │
│  ◉ Sarah: Check out this design    │  ◉ Sarah:              │
│      ↳ 3 replies              ←────│  Check this out        │
│                                    │                        │
│                                    │    ◉ Mike:             │
│                                    │    Love the colors     │
│                                    │                        │
│  [input]                           │  [reply to thread]     │
└────────────────────────────────────┴────────────────────────┘
```

### The Hero Input

**Specifications:**
- Minimum height: 56px (feels substantial, not an afterthought)
- Background: `#141416` (slightly elevated)
- Border: `1px #2E2E33`, gold glow on focus
- Radius: `12px`
- Placeholder: "Message #general..." (tells you where you are)

**Actions below input:**
- `📎` — Attach file
- `/` — Slash commands
- `@` — Mentions
- `⚡` — Tools panel
- `👥` — Members panel
- `📅` — Events panel

**Slash commands work inline:**
```
/poll "Where should we meet?" "Library" "Union" "Cafe"
/event Friday 7pm "Design Review"
/tool deploy poll-widget
```

### Presence Layer

**The interface should never feel static.** The UI breathes.

**Header presence:**
```
← UB Design Club                    ◉◉◉○○ 23 here    ⌘K
                                    ↑
                            stacked avatars (online)
```

**Online indicators:**
```
◉ = online (gold, subtle pulse every 3s)
○ = offline (gray, static)
◐ = away/idle (gold outline, no fill)
```

**Typing indicators:**
```
◉ Sarah typing... ← avatar has subtle gold ripple
```

**Activity energy:**
When a space is busy, the ambient warmth increases subtly. Avatar stack compresses and overlaps more. The space literally heats up.

### Context Panels

Accessed via action buttons or keyboard shortcuts. Slide in from right.

**Tools Panel (⚡ or ⌘T):**
```
┌──────────────────────┐
│ TOOLS           ✕    │
├──────────────────────┤
│ ▢ Poll Widget        │
│ ▢ Event Signup       │
│ ▢ Study Timer        │
│                      │
│ + Deploy new tool    │
└──────────────────────┘
```

**Members Panel (👥 or ⌘M):**
```
┌──────────────────────┐
│ 23 HERE NOW     ✕    │
├──────────────────────┤
│ ◉ Sarah Chen         │
│ ◉ Mike Johnson       │
│ ◉ Alex Rivera        │
│ ○ 147 members        │
└──────────────────────┘
```

**Events Panel (📅 or ⌘E):**
```
┌──────────────────────┐
│ UPCOMING        ✕    │
├──────────────────────┤
│ Tomorrow 7pm         │
│ Design Review        │
│                      │
│ Friday 3pm           │
│ Workshop             │
│                      │
│ + Create event       │
└──────────────────────┘
```

---

## HiveLab Design

### Philosophy: Creative Playground with a Smart Partner

HiveLab is not an IDE. It's a **creative workshop** where you build tools alongside an AI collaborator.

| Aspect | IDE Feel | HiveLab Feel |
|--------|----------|--------------|
| Vibe | Cold, professional | Warm, creative |
| Building | You alone with complex tools | You + AI collaborating |
| Learning | Steep curve | Gentle (talk OR drag) |
| Output | Code | Live interactive tools |

### Layout: The Workshop

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   POLL WIDGET                              [Preview] [Ship] │
│   by you · draft                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│            ┌─────────────────────────────────┐              │
│            │                                 │              │
│            │      YOUR TOOL                  │              │
│            │      on the canvas              │              │
│            │                                 │              │
│            │      (casts subtle shadow,      │              │
│            │       feels physical)           │              │
│            │                                 │              │
│            └─────────────────────────────────┘              │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│   ╭────╮ ╭────╮ ╭────╮ ╭────╮ ╭────╮ ╭────╮ ╭────╮        │
│   │ 📝 │ │ 🗳️ │ │ ⏱️ │ │ 📊 │ │ 📅 │ │ ✚  │ │ ••• │        │ ← element belt
│   │text│ │poll│ │timr│ │chrt│ │evnt│ │more│ │srch│        │
│   ╰────╯ ╰────╯ ╰────╯ ╰────╯ ╰────╯ ╰────╯ ╰────╯        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  "add a submit button that saves responses"            ↵    │ ← AI input
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

**1. Element Belt, Not Sidebar Palette**

Elements are a horizontal bar at bottom, like a tool belt.
- Shows 6-8 most common elements
- "More" button opens full categorized palette
- AI can highlight relevant elements ("try adding a timer")

**Full palette (when expanded):**
```
┌──────────────────────────────────────────┐
│  ELEMENTS                           ✕    │
├──────────────────────────────────────────┤
│  Universal                               │
│  ╭────╮ ╭────╮ ╭────╮ ╭────╮ ╭────╮     │
│  │ 📝 │ │ 🗳️ │ │ ⏱️ │ │ 📊 │ │ 📋 │     │
│  ╰────╯ ╰────╯ ╰────╯ ╰────╯ ╰────╯     │
│                                          │
│  Connected                               │
│  ╭────╮ ╭────╮ ╭────╮ ╭────╮            │
│  │ 👤 │ │ 📅 │ │ 🔗 │ │ ✓  │            │
│  ╰────╯ ╰────╯ ╰────╯ ╰────╯            │
│                                          │
│  Space                                   │
│  ╭────╮ ╭────╮ ╭────╮                   │
│  │ 👥 │ │ 📢 │ │ 🔐 │                   │
│  ╰────╯ ╰────╯ ╰────╯                   │
└──────────────────────────────────────────┘
```

**2. Contextual Inspector**

No persistent right panel. Inspector appears near the selected element.

```
Simple element (timer):              Complex element (form):

   ┌───────────┐ ┌──────────┐       ┌───────────────┬─────────────────┐
   │  TIMER    │ │Duration  │       │               │ FORM BUILDER    │
   │  03:00    │ │[5:00]    │       │   Form on     │                 │
   └───────────┘ │          │       │   canvas      │ Fields:         │
                 │[Start]   │       │               │ □ Name          │
                 └──────────┘       │               │ □ Email         │
                                    │               │ + Add field     │
    floating, small                 └───────────────┴─────────────────┘

                                     docked for complex elements
```

Simple elements: floating inspector
Complex elements: inspector auto-docks to right
User can manually pin/unpin

**3. Three Ways to Build**

| Method | When to Use |
|--------|-------------|
| **Talk to AI** | "Create a signup form with name and email" |
| **Drag from belt** | Precise control, manual placement |
| **Hybrid** | Drag element, then "connect this to poll results" |

The AI watches and offers contextual suggestions (dismissable):
```
┌─────────────────────────────────────────────────────────────┐
│  ░░ Suggestion: "Add a chart to visualize results?"    [+]  │
└─────────────────────────────────────────────────────────────┘
```

**4. AI Generation UX**

AI generation has latency. Make it feel progressive, not blocking.

```
User: "add a signup form with name and email"

Immediately:
│  ░░░░░ Creating signup form...  ░░░░░   │ ← subtle pulse

1 second later:
│  ┌─────────────────────┐               │
│  │  ▢ Name             │ ← appears     │
│  └─────────────────────┘               │

1.5 seconds:
│  ┌─────────────────────┐               │
│  │  ▢ Name             │               │
│  │  ▢ Email            │ ← appears     │
│  └─────────────────────┘               │

2 seconds:
│  ┌─────────────────────┐               │
│  │  ▢ Name             │               │
│  │  ▢ Email            │               │
│  │  [Submit]           │ ← appears     │
│  └─────────────────────┘               │
│                                         │
│  ✓ Form created. Click to edit.         │
```

If AI fails: "Couldn't generate. Try dragging from elements?"

**5. Canvas Has Presence**

The canvas isn't flat. It has subtle texture and your tool has physical presence.

```css
.canvas {
  background:
    radial-gradient(circle, #1a1a1c 1px, transparent 1px),
    #141416;
  background-size: 24px 24px;
}

.tool-on-canvas {
  box-shadow:
    0 4px 12px rgba(0,0,0,0.3),
    0 1px 3px rgba(0,0,0,0.2);
}
```

**6. Deployment Flow**

Two deployment modes:

| Mode | Visibility | Use Case |
|------|------------|----------|
| **Featured** | Always visible above conversation | Primary tool (poll, signup) |
| **Embedded** | In tools panel | Secondary tools |

Deploy modal:
```
┌─────────────────────────────────────────┐
│  SHIP TOOL                         ✕    │
├─────────────────────────────────────────┤
│                                         │
│  Deploy "Quick Poll" to:                │
│                                         │
│  ○ UB Design Club                       │
│                                         │
│  Display as:                            │
│  ● Featured (always visible)            │
│  ○ Embedded (in tools panel)            │
│                                         │
│                          [Cancel] [Ship]│
└─────────────────────────────────────────┘
```

### Element Interaction

**Dragging:**
- Element lifts (scale 1.02, shadow increases)
- Canvas shows drop zone with subtle gold outline
- On drop: element bounces slightly, settles with weight

**Selecting:**
- Gold border appears
- Inspector floats nearby (or docks for complex elements)
- Delete/duplicate actions appear

**Connecting elements:**
- Lines draw between connected elements
- Gold pulse travels along connection when data flows
- Visual logic, not just configuration

---

## Navigation Model

### Primary: Command Palette (⌘K)

The command palette is the nervous system. Raycast/Linear quality.

```
┌─────────────────────────────────────────────────────────────┐
│  ⌘K                                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ○ Search spaces, people, commands...                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  RECENT                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ◉ UB Design Club              12 online        ↵    │   │
│  │ ○ Photography Society          3 online             │   │
│  │ ○ CS 101 Study Group           8 online             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ACTIONS                                                    │
│  │ + Create new space                               ⌘N │   │
│  │ ⚡ Deploy a tool                                  ⌘T │   │
│  │ 📅 Create event                                  ⌘E │   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**
- Opens instantly (no animation delay)
- Fuzzy search everything (spaces, people, messages, commands)
- Recent spaces show live presence counts
- Keyboard navigable (↑↓ to move, ↵ to select)
- Context-aware (shows relevant actions for current location)

### Secondary: Dock

Horizontal bar at bottom. Pinned spaces for quick access.

```
        ◉ Design   ○ Photo   ○ CS101   ○ Gym   │  +  │  ⌘K
           ↑                                    ↑      ↑
    pinned spaces (5-6)                      add   palette
```

**Behaviors:**
- Gold dot = unread activity
- Hover = space name + online count
- Click = navigate
- Drag to reorder
- Right-click = unpin, mute, settings
- `⌘1-6` = jump to pinned space by position

**On desktop:** Dock visible at bottom, slides away when scrolling conversation (optional)
**On mobile:** Transforms to standard bottom navigation

### Keyboard Shortcuts

```
⌘K          Command palette (go anywhere)
⌘1-6        Jump to pinned space 1-6
⌘T          Tools panel
⌘M          Members panel
⌘E          Events panel
⌘B          Board switcher
⌘N          New space
⌘/          Slash command mode in input
Esc         Close panel/modal
```

### Mobile Adaptation

```
┌─────────────────────────────────────────┐
│ ← UB Design Club              ◉◉◉  ≡   │ ← hamburger for more
├─────────────────────────────────────────┤
│ [General] [Events] [+]                  │ ← board tabs (scroll)
├─────────────────────────────────────────┤
│                                         │
│            CONVERSATION                 │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Message...                      ↵   │ │ ← sticky input
│ └─────────────────────────────────────┘ │
│   📎   /   @   ⚡   👥                   │
├─────────────────────────────────────────┤
│   🏠    🔍    +    💬    👤            │ ← bottom nav
└─────────────────────────────────────────┘
```

- Bottom nav replaces dock
- Command palette becomes full-screen search
- Context panels become bottom sheets
- Swipe gestures for space switching

---

## Component Specifications

### Buttons

**Primary (Gold CTA)**
```
Background:     #FFD700
Text:           #0C0C0E (dark)
Border:         none
Radius:         12px
Padding:        12px 24px
Font:           14px / 500
Hover:          brightness(1.1) + shadow-glow
Active:         scale(0.98)
```

**Secondary**
```
Background:     transparent
Text:           #FAFAFA
Border:         1px #2E2E33
Radius:         12px
Padding:        12px 24px
Hover:          background #1A1A1C
```

**Ghost**
```
Background:     transparent
Text:           #A1A1A6
Border:         none
Hover:          text #FAFAFA, background rgba(255,255,255,0.05)
```

### Inputs

**Standard Input**
```
Background:     #141416
Text:           #FAFAFA
Placeholder:    #52525B
Border:         1px #2E2E33
Radius:         12px
Padding:        12px 16px
Height:         44px (touch target)
Focus:          border #FFD700, shadow-glow
```

**Hero Input (Chat)**
```
Background:     #141416
Border:         1px #2E2E33
Radius:         12px
Min-height:     56px
Padding:        16px 20px
Focus:          gold glow (0 0 0 3px rgba(255,215,0,0.2))
```

### Cards

**Standard Card**
```
Background:     #141416
Border:         1px #2E2E33 (or none)
Radius:         12px
Padding:        16px
Shadow:         shadow-sm
Hover:          border #3E3E43, translateY(-2px), shadow-md
```

**Interactive Card**
```
Same as standard +
Cursor:         pointer
Transition:     all 150ms ease
Hover:          scale(1.01), shadow-md
Active:         scale(0.99)
```

### Avatar

```
Sizes:          24px (xs), 32px (sm), 40px (md), 56px (lg)
Radius:         full (circle)
Border:         2px #0C0C0E (creates separation)
Online ring:    2px #FFD700 (gold)
```

### Badge / Pill

```
Background:     #1A1A1C
Text:           #A1A1A6
Radius:         full
Padding:        4px 10px
Font:           12px / 500
```

**Gold badge (notification):**
```
Background:     #FFD700
Text:           #0C0C0E
```

### Modal

```
Backdrop:       rgba(0,0,0,0.6) + blur(16px)
Surface:        #141416
Radius:         16px
Shadow:         shadow-xl
Max-width:      500px (small), 700px (medium), 900px (large)
Padding:        24px
Animation:      fade in + scale from 0.95
```

---

## Motion System

### Timing

```
instant:    75ms     // Micro-feedback (button press)
fast:       150ms    // Standard transitions (hover)
smooth:     250ms    // Layout changes
dramatic:   400ms    // Page transitions, modals
```

### Easing

```
default:    cubic-bezier(0.25, 0.1, 0.25, 1)    // Smooth
snappy:     cubic-bezier(0.4, 0, 0.2, 1)        // Quick settle
spring:     spring(stiffness: 400, damping: 30)  // Physical
bounce:     cubic-bezier(0.34, 1.56, 0.64, 1)   // Overshoot
```

### Principles

1. **Fast by default** — 150ms for most things
2. **Springs for interaction** — Buttons, cards feel physical
3. **No decorative animation** — Every motion serves feedback
4. **Instant command palette** — Zero delay, respect power users

### Specific Animations

**Message arriving:**
- Slide in from left (others) or right (you)
- Duration: 200ms
- Slight bounce on land

**Modal opening:**
- Backdrop fades in (200ms)
- Modal scales from 0.95 to 1 + fades in (250ms)
- Spring easing

**Hover states:**
- Instant (75ms)
- No delay

**Panel sliding:**
- 250ms
- Slight overshoot (spring)

**Space entry:**
- Space name display: fade in (300ms)
- Hold (800ms)
- Fade to conversation (400ms)

---

## Implementation Priorities

### Phase 1: Foundation
1. Update color tokens to new system (dark warmth)
2. Set dark mode as only mode
3. Update typography with Space Grotesk for display
4. Implement depth/shadow system
5. Update globals.css

### Phase 2: Core Components
1. Hero input component
2. Button variants with glow states
3. Card components with hover lift
4. Avatar with online states
5. Badge/pill variants

### Phase 3: Navigation
1. Command palette (⌘K)
2. Dock component
3. Context panel (slide-in)
4. Keyboard shortcuts system

### Phase 4: Spaces
1. Conversation layout (messages)
2. Featured tool slot
3. Board tabs
4. Presence indicators
5. Thread panel

### Phase 5: HiveLab
1. Canvas with texture
2. Element belt
3. Contextual inspector
4. AI input with progressive generation
5. Deployment flow

---

## Anti-Patterns

**Never do these:**

1. ❌ Light mode (dark only for now)
2. ❌ Blue accent colors (gold only)
3. ❌ Persistent sidebar (use dock + command palette)
4. ❌ Cute empty state illustrations (functional messaging only)
5. ❌ Decorative animations (motion serves function)
6. ❌ Heavy drop shadows (subtle depth only)
7. ❌ Rounded everything (mix sharp and rounded)
8. ❌ Generic startup template feel
9. ❌ Skeleton loaders (simple spinners or instant)
10. ❌ Stock photography (real or abstract only)

---

## Success Criteria

**We've succeeded when:**

- [ ] Screenshots are distinctly HIVE, not "any startup app"
- [ ] Students say "this looks sick" not "this looks nice"
- [ ] The interface feels alive after 5 minutes of use
- [ ] New users immediately understand it's for students
- [ ] The dark + gold feels intentional, not trendy
- [ ] Power users feel fast (keyboard-first works)
- [ ] The presence layer makes you feel the collective

---

*"Apple craft. HIVE warmth. ChatGPT focus."*
