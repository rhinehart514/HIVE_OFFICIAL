# HIVE TEMPLATES

## Level 8: Page Structures

*Last updated: January 2026*

---

## WHAT THIS DOCUMENT IS

Templates are page-level structures that define WHERE content goes, not WHAT content is. They are the structural frames that hold patterns and components, creating the skeleton upon which experiences are built.

**But templates are more than layouts.** They are **emotional architectures** — each template creates a specific psychological container for the experience within it.

```
WORLDVIEW (what we believe)        ← WORLDVIEW.md
    ↓
PHILOSOPHY (how it feels)          ← PHILOSOPHY.md
    ↓
PRINCIPLES (rules that guide)      ← PRINCIPLES.md
    ↓
LANGUAGE (visual vocabulary)       ← LANGUAGE.md
    ↓
SYSTEMS (composed tokens)          ← SYSTEMS.md
    ↓
PRIMITIVES (atomic elements)       ← PRIMITIVES.md
    ↓
COMPONENTS (compositions)          ← COMPONENTS.md
    ↓
PATTERNS (user experiences)        ← PATTERNS.md
    ↓
TEMPLATES (page structures)        ← THIS DOCUMENT
    ↓
INSTANCES (final pages)            ← INSTANCES.md
```

---

## TEMPLATE PHILOSOPHY

### What Templates Are

Templates are **structural intent**. They answer the question: "What shape should this page take?"

| Templates Are | Templates Are Not |
|---------------|-------------------|
| Structural frames | Specific pages |
| Emotional containers | Component assignments |
| Region compositions | Implementation details |
| Design decisions | Code |

### The Deeper Truth

Each template encodes a **psychological contract** with the user:

| Template | The Contract |
|----------|--------------|
| **Focus** | "You have one thing to do. Nothing will distract you." |
| **Shell** | "You're home. Navigate freely. We're here when you need us." |
| **Stream** | "This is a conversation. Time flows. You're part of it." |
| **Grid** | "Here are your options. Browse. Compare. Choose." |
| **Workspace** | "This is your studio. Build anything. We have the tools." |

### Templates Compose

Templates are not mutually exclusive. They **nest**:

```
Shell Template (navigation frame)
    └── Contains: Stream Template (content structure)
            └── Supports: Space Participation Pattern (behavior)
                    └── Modified by: Comfortable Atmosphere (density)
```

A page like `/spaces/[id]` composes multiple layers. The Shell provides navigation. The Stream provides content structure. The Pattern provides behavior. The Atmosphere provides density and effects.

---

## UPSTREAM LINEAGE

Before diving into templates, we acknowledge the products that shaped modern page structures. HIVE learns from all of them, copies none of them.

### The Influences

| Product | What They Mastered | What We Take |
|---------|-------------------|--------------|
| **Arc** | Onboarding as product revelation | Focus template as "controlled reveal" |
| **Discord** | Servers as places, not links | Shell as spatial container |
| **Linear** | Minimal rail + command palette | Shell density and keyboard-first |
| **Figma** | Three-panel workspace | Workspace template structure |
| **Cursor** | AI-first creation | Workspace as conversation + canvas |
| **Netflix** | Horizontal row discovery | Grid as curated shelves |
| **TikTok** | Full-screen immersion | Stream as focused attention |
| **Slack** | Threaded conversations | Stream with thread rail |
| **Notion** | Blocks as universal primitive | Content flexibility |
| **Vercel** | Developer premium aesthetic | Focus atmospheric quality |
| **Superhuman** | Speed through density | Stream efficiency |
| **Apple** | Trust through reduction | Focus simplicity |

### The Synthesis

HIVE's templates are not copies. They are **synthesized responses** to the question: "How should student autonomy infrastructure feel?"

- **Arc's revelation** meets **HIVE's onboarding** → Focus as journey, not form
- **Discord's servers** meet **HIVE's spaces** → Shell as living neighborhood
- **TikTok's immersion** meets **HIVE's feed** → Stream as stories, not just scroll
- **Netflix's rows** meet **HIVE's discovery** → Grid as curated territories
- **Cursor's AI** meets **HIVE's HiveLab** → Workspace as magic + power

---

## STRUCTURAL VOCABULARY

Before defining templates, we need a vocabulary of **regions** — the building blocks of page structure.

### The 6 Structural Regions

| Region | Purpose | Behavior | Max Width |
|--------|---------|----------|-----------|
| **Content Column** | Primary content, reading flow | Centered horizontally | 768px (3xl) typical |
| **Sidebar** | Persistent navigation/context | Left-anchored, collapsible | 48-280px |
| **Rail** | Contextual details, secondary | Right-anchored, dismissible | 280-360px |
| **Canvas** | Workspace, creation surface | Fills available space | No constraint |
| **Sticky Zone** | Persistent UI (headers, bars) | Fixed position, z-layered | Full width |
| **Overlay** | Modals, drawers, popovers | Above all content, backdrop | Varies |

---

### Content Column

The reading/interaction spine. Everything flows through here.

```
┌─────────────────────────────────────┐
│                                     │
│         ┌───────────────┐           │
│         │               │           │
│         │    CONTENT    │           │
│         │    COLUMN     │           │
│         │               │           │
│         └───────────────┘           │
│                                     │
└─────────────────────────────────────┘
```

**Characteristics:**
- Horizontally centered in available space
- Max-width constrained (768px typical, 640px for intimate, 1024px for wide)
- Vertical scroll when content exceeds viewport
- Primary focus of user attention

**When to use:**
- Chat messages
- Feed items
- Form flows
- Article content
- Notifications

---

### Sidebar

Persistent navigation and context. The anchor for wayfinding.

```
┌────────┬────────────────────────────┐
│        │                            │
│  SIDE  │                            │
│  BAR   │         MAIN               │
│        │                            │
│        │                            │
└────────┴────────────────────────────┘
```

**Characteristics:**
- Left-anchored (HIVE convention)
- Variable width: 48px (rail), 64px (collapsed), 240px (expanded)
- Collapsible on interaction or viewport change
- Contains navigation, user identity, space switching
- Scrolls independently of main content

**Upstream insight (Arc):** Sidebar can contain CONTENT, not just navigation. In spaces, the sidebar might show activity, not just links.

**When to use:**
- Authenticated app pages
- When persistent navigation is needed
- Multi-page journeys

**When NOT to use:**
- Auth/onboarding flows (distraction)
- Creation workspaces (space is precious)
- Mobile viewports (becomes bottom nav)

---

### Rail

Contextual information and secondary actions. The detail panel.

```
┌────────────────────────────┬────────┐
│                            │        │
│                            │  RAIL  │
│         MAIN               │        │
│                            │        │
│                            │        │
└────────────────────────────┴────────┘
```

**Characteristics:**
- Right-anchored
- Width varies: 280-360px typical
- Dismissible (slides out)
- Contains details, properties, related items
- Appears on demand (click, hover, selection)

**Upstream insight (Slack):** Threads live in rails. The rail is where you go deeper without leaving context.

**When to use:**
- Thread views (messages)
- Property inspectors (IDE)
- Detail panels (profiles)
- AI conversation (workspace)
- Related content

**When NOT to use:**
- Primary content (use Content Column)
- Navigation (use Sidebar)
- Mobile viewports (becomes sheet/drawer)

---

### Canvas

The workspace. Where creation happens.

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│             CANVAS                  │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Characteristics:**
- Fills all available space
- No max-width constraint
- Often pannable/zoomable
- Background may show grid/guides
- Elements positioned absolutely within

**Upstream insight (Figma/tldraw):** Canvas should feel like infinite paper. The tool disappears; the work remains.

**When to use:**
- HiveLab IDE
- Visual editors
- Diagram tools
- Any spatial composition interface

**When NOT to use:**
- Text-heavy content (use Content Column)
- Lists and grids (use Grid)
- Sequential content (use Stream)

---

### Sticky Zone

Persistent UI that follows scroll. The anchors.

```
┌─────────────────────────────────────┐
│      STICKY ZONE (header)           │  ← z-40
├─────────────────────────────────────┤
│      STICKY ZONE (filters)          │  ← z-30
├─────────────────────────────────────┤
│                                     │
│            CONTENT                  │
│           (scrolls)                 │
│                                     │
├─────────────────────────────────────┤
│      STICKY ZONE (composer)         │  ← z-30
└─────────────────────────────────────┘
```

**Characteristics:**
- Fixed position relative to viewport
- Z-indexed to layer properly (header > filters > content)
- Multiple sticky zones can stack
- Backdrop blur optional (atmosphere-dependent)

**Types:**
- **Header:** Title, navigation, search
- **Filter Bar:** Category pills, sort options
- **Composer:** Chat input, action bar
- **Footer:** Summary, pagination

**When to use:**
- When content scrolls but actions should persist
- Navigation headers
- Chat composers
- Filter interfaces

---

### Overlay

Above everything. The modal layer.

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │          OVERLAY              │  │
│  │         (modal)               │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│         (backdrop blur)             │
└─────────────────────────────────────┘
```

**Characteristics:**
- Highest z-index (50+)
- Backdrop dims/blurs underlying content
- Dismissible (escape, click outside, close button)
- Traps focus for accessibility
- Can contain any other regions internally

**Types:**
- **Modal:** Centered dialog, action required
- **Drawer:** Slides from edge (bottom on mobile)
- **Sheet:** Large modal, often full-screen on mobile
- **Popover:** Small, anchored to trigger element
- **Command Palette:** Special overlay for quick actions (⌘K)

**Upstream insight (Linear/Raycast):** Command palette is the power user's escape hatch. Available everywhere, summons anything.

---

## THE 5 TEMPLATE ARCHETYPES

Templates are compositions of regions. HIVE has 5 core templates that cover all page types.

---

### Template 1: Focus

**Intent:** Controlled revelation of depth. Not "remove distraction" but "build anticipation."

**The Evolved Understanding:**
Focus template isn't about emptiness — it's about **atmospheric container** that makes the single task feel important. The user isn't filling a form in a void; they're **entering a world**.

```
┌─────────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░ AMBIENT LAYER ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░ (warmth, motion, ░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░  life signals) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ ╭─────────────────────╮ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ │                     │ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ │    GLASS CARD       │ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ │    (task here)      │ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ │                     │ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░ ╰─────────────────────╯ ░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────────────────────┘
```

#### Upstream Lineage

| Product | What They Do | What We Learn |
|---------|--------------|---------------|
| **Arc** | Onboarding assembles the browser | Each step reveals interface pieces |
| **Stripe** | Gradient mesh, glass cards | Premium feel without trying |
| **Linear** | Split ambient + task | Show value while collecting info |
| **Vercel** | Grid background, subtle motion | "Entering the matrix" energy |
| **Apple** | Max whitespace, centered | Trust through reduction |

#### Focus Modes

**Mode A: The Portal (Auth)**
```
Full-bleed atmosphere with glass card floating in energy.
Background hints at what's inside (blurred activity, warmth gradient).
User feels they're entering, not signing up.
```

**Mode B: The Reveal (Onboarding)**
```
Progressive disclosure. Each step literally assembles the shell.
Step 1: Just question (minimal)
Step 2: Rail appears (sidebar fades in)
Step 3: Grid appears (content takes shape)
End: Full shell assembled — user built their interface
```

**The Arc Insight Applied:**
> Arc doesn't have an "onboarding flow" separate from the product. The onboarding IS the product revealing itself. By completion, you've mentally assembled the interface.

For HIVE: Onboarding should feel like **unwrapping your workspace**, not filling out forms.

#### Regions Used
- Content Column (centered, constrained)
- Ambient Layer (background atmosphere)
- Overlay (optional, for modals)

#### Regions NOT Used
- Sidebar (distraction — appears during onboarding)
- Rail (distraction)
- Canvas (wrong metaphor)
- Sticky Zones (minimal or none)

#### Atmosphere Affinity
**Landing atmosphere** with enhancements:
- Maximum breathing room
- Ambient effects: subtle warmth gradient, gentle motion
- Life signals: activity counter, presence indicators
- Gold appears on CTA only
- Glass card with backdrop blur

#### Pattern Affinity
- Gate & Onboarding (primary)
- Error states
- Empty states
- Success confirmations

#### Selection Criteria
> Use Focus when the user has ONE thing to do, and that thing should feel important.

#### Content Width
480-640px (narrow, intimate)

#### Responsive Behavior
- Mobile: Full width with generous padding, ambient simplified
- Tablet: Centered, slightly wider
- Desktop: Centered, max-width enforced, full atmosphere

#### Examples
- `/auth/login` (Portal mode)
- `/auth/verify` (Portal mode)
- `/onboarding/*` (Reveal mode)
- Empty state overlays

---

### Template 2: Shell

**Intent:** The living frame. Not just navigation, but the **spatial container for your digital neighborhood**.

**The Evolved Understanding:**
Shell isn't a static frame — it's a **breathing organism** that expands and contracts based on context. In browse mode, it's minimal. In a space, it shows that space's life. The sidebar isn't just links; it can contain content.

```
┌──────────────┬──────────────────────────────────────────┐
│              │        STICKY ZONE (topbar)              │
│              ├──────────────────────────────────────────┤
│   SIDEBAR    │                                          │
│   (living)   │                                          │
│              │              CONTENT                     │
│  ┌────────┐  │         (other template)                 │
│  │activity│  │                                          │
│  └────────┘  │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

#### Upstream Lineage

| Product | What They Do | What We Learn |
|---------|--------------|---------------|
| **Discord** | Servers as places, server list shows identity | Spaces are places you inhabit |
| **Arc** | Sidebar contains actual content | Sidebar isn't just nav |
| **Linear** | Minimal rail + ⌘K for everything | Chrome should disappear |
| **Figma** | Context-specific panels | Shell can adapt to context |
| **Notion** | Workspace tree, nested navigation | Hierarchy in sidebar |

#### Shell Modes

**Mode A: Minimal Rail (Default)**
```
┌────┬────────────────────────────────┐
│ ▢  │                                │
│ ▢  │         CONTENT                │
│ ▢  │                                │
│ ▢  │                                │
└────┴────────────────────────────────┘
48px rail, icons only. Maximum content space.
Used for: Browse, Profile, general navigation.
```

**Mode B: Living Sidebar (In Space)**
```
┌────────────┬────────────────────────┐
│ SPACE      │                        │
│ ┌────────┐ │                        │
│ │ Mini   │ │       CONTENT          │
│ │ Chat   │ │                        │
│ │ Preview│ │                        │
│ └────────┘ │                        │
│ ○ Space 2  │                        │
│ ○ Space 3  │                        │
└────────────┴────────────────────────┘
240px sidebar with space content. Shows activity.
Used for: Inside a space, showing that space's life.
```

**Mode C: Command-First (Power User)**
```
No persistent sidebar. ⌘K summons everything.
Rail appears only when needed.
Maximum focus on content.
```

**The Arc/Discord Insight Applied:**
> Discord's servers feel like buildings you enter, not links you click. Arc's sidebar contains actual content, not just navigation to content.

For HIVE: When you're IN a space, the sidebar should show that space's heartbeat — recent chat, who's online, current activity.

#### Regions Used
- Sidebar (left, variable width, context-aware)
- Content (variable, holds other templates)
- Sticky Zone (topbar)
- Overlay (modals, command palette)

#### Regions NOT Used
- Canvas (Shell doesn't contain canvas directly)
- Rail (handled by content template)

#### Atmosphere Affinity
**Comfortable atmosphere** (adapts to content):
- Standard density
- No glass effects on shell chrome
- Edge warmth on active elements

#### Pattern Affinity
- All authenticated patterns
- Shell is the wrapper, not the content

#### Selection Criteria
> Use Shell for any authenticated page. Shell wraps other templates.

#### The Wrapper Concept

Shell is unique — it CONTAINS other templates:

```
Shell Template
    ├── Contains: Stream Template    (for chat)
    ├── Contains: Grid Template      (for browse)
    ├── Contains: Focus Template     (for settings)
    └── Contains: Workspace Template (for IDE)
```

#### Sidebar Behavior by Context

| Context | Sidebar Width | Sidebar Content |
|---------|---------------|-----------------|
| Browse | 48px (rail) | Icons only |
| Profile | 48px (rail) | Icons only |
| In Space | 240px | Space nav + activity preview |
| Settings | 48px (rail) | Icons only |
| HiveLab | Hidden | Workspace takes over |

#### Command Palette (⌘K)
Available in ALL shell modes:
- Navigation (go to space, profile, settings)
- Actions (create tool, start ritual, invite)
- Search (spaces, people, tools)
- Settings toggles

**This is the power user escape hatch.** Linear proved that minimal chrome + great ⌘K = best of both worlds.

#### Responsive Behavior
- Desktop (1024px+): Full sidebar or rail based on context
- Tablet (768-1023px): Rail only, 48px
- Mobile (<768px): No sidebar, bottom navigation bar

#### Examples
- Every authenticated page
- `/spaces/*`
- `/profile/*`
- `/tools/*`
- `/feed`

---

### Template 3: Stream

**Intent:** Flow state. Conversation. Time moves. You're part of it.

**The Evolved Understanding:**
Stream isn't just "content list" — it's about **temporal flow**. Different streams need different treatments:
- **Chat** is conversation (Discord model)
- **Feed** is discovery (Stories + Sections)
- **Notifications** is triage (sectioned, completable)

```
┌─────────────────────────────────────────────────────────┐
│              STICKY ZONE (header)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              ┌─────────────────────┐                    │
│              │       STREAM        │                    │
│              │    (scrolling)      │                    │
│              │                     │                    │
│              │    ┌─────────┐      │                    │
│              │    │ message │      │                    │
│              │    └─────────┘      │                    │
│              │    ┌─────────┐      │                    │
│              │    │ message │      │                    │
│              │    └─────────┘      │                    │
│              │                     │                    │
│              └─────────────────────┘                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│              STICKY ZONE (composer)                     │
└─────────────────────────────────────────────────────────┘
```

#### Upstream Lineage

| Product | What They Do | What We Learn |
|---------|--------------|---------------|
| **Discord** | Bottom-anchored chat, channels | Chat is conversation at bottom |
| **Slack** | Threads in side panel | Threads preserve context |
| **TikTok** | One item fills screen | Immersion = engagement |
| **Instagram** | Stories rail + feed | Two consumption modes |
| **Superhuman** | Sectioned by time | Completable feels good |
| **iMessage** | Bubbles, tapback | Intimacy through visuals |

#### Stream Modes

**Mode A: Conversational (Chat)**
```
┌─────────────────────────────────────┐
│  #channel-name                      │
├─────────────────────────────────────┤
│  ↑ older messages                   │
│                                     │
│  [Avatar] Name         12:34 PM     │
│  Message bubble here                │
│                                     │
│  [Avatar] Name         12:35 PM     │
│  Another message                    │
│       └─ [3 replies] ← thread       │
│                                     │
│  [Avatar] Name         12:36 PM     │
│  Latest message ← newest at bottom  │
├─────────────────────────────────────┤
│  [+] Type a message...    [Send]    │
└─────────────────────────────────────┘
Bottom-anchored, new at bottom. Composer always ready.
Thread opens in Rail on click.
```

**Mode B: Stories + Feed (Discovery)**
```
┌─────────────────────────────────────┐
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐  ← Space Stories│
│ │🔴│ │  │ │  │ │  │    (tap = dive) │
│ └──┘ └──┘ └──┘ └──┘                 │
├─────────────────────────────────────┤
│  TODAY IN YOUR SPACES               │
│  ┌─────────┐ ┌─────────┐            │
│  │ Update  │ │ Event   │            │
│  └─────────┘ └─────────┘            │
│                                     │
│  DISCOVER                           │
│  ┌─────────┐ ┌─────────┐            │
│  │ Trending│ │ New     │            │
│  └─────────┘ └─────────┘            │
└─────────────────────────────────────┘
Stories rail for space highlights.
Sectioned feed below for structured discovery.
Tap story = immersive full-screen mode.
```

**Mode C: Sectioned (Notifications)**
```
┌─────────────────────────────────────┐
│  TODAY                              │
│  ├─ [●] New message in Space A      │
│  ├─ [●] You were mentioned          │
│                                     │
│  YESTERDAY                          │
│  ├─ [○] Event reminder              │
│  ├─ [○] New member joined           │
│                                     │
│  THIS WEEK                          │
│  ├─ [○] Tool deployed               │
└─────────────────────────────────────┘
Time-sectioned for completability.
"I can finish this" psychology.
```

**The TikTok Insight Applied:**
> TikTok removed everything except the content. One video. Full screen. You're not browsing — you're IMMERSED.

For HIVE: Space Stories can go full-screen. Each space's daily highlights as an immersive experience. Swipe through what happened today.

**The Superhuman Insight Applied:**
> Sectioned by time makes email completable. "Inbox Zero" becomes achievable.

For HIVE: Notifications should feel finishable. Sections create psychological breaks.

#### Regions Used
- Content Column (centered, max-w-3xl)
- Sticky Zone: Header (space name, actions)
- Sticky Zone: Composer (chat input)
- Rail (optional, for threads)
- Overlay (for modals)
- Stories Rail (optional, for feed)

#### Regions NOT Used
- Sidebar (handled by Shell wrapper)
- Canvas (wrong metaphor)

#### Atmosphere Affinity
**Comfortable** for chat, **intimate** for DMs:
- Standard density in header/composer
- Comfortable spacing in message stream
- Gold on presence indicators, typing
- Glass effects on thread rail

#### Pattern Affinity
- Space Participation (primary)
- Feed
- Notifications

#### Selection Criteria
> Use Stream when content is sequential, time-ordered, or conversational.

#### Scroll Behavior (Chat Mode)
- Smart scroll: Pins to bottom unless user scrolls up
- Scroll to bottom on new message (if pinned)
- "New messages" indicator when unpinned
- Load more on scroll to top

#### Responsive Behavior
- Mobile: Full width, sticky composer, thread as sheet
- Tablet: Centered, moderate padding, thread as sheet
- Desktop: Centered, generous padding, thread in rail

#### Examples
- `/spaces/[id]` (chat view — Mode A)
- `/feed` (stories + sections — Mode B)
- `/notifications` (sectioned — Mode C)

---

### Template 4: Grid

**Intent:** Curated discovery. Not "here's everything" but "here's what matters, organized for you."

**The Evolved Understanding:**
Grid isn't just "cards in rows" — it's about **guided discovery with social proof**. The grid should show what's ALIVE, not just what exists. Netflix proved that horizontal rows feel like shelves you browse. Editorial curation creates hierarchy.

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │  🔥 HAPPENING NOW                                   │ │
│ │  Live activity in trending spaces (hero)            │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  RECOMMENDED FOR YOU                        → see all   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ···   │
│  │        │  │        │  │        │  │        │        │
│  │  card  │  │  card  │  │  card  │  │  card  │        │
│  │        │  │        │  │        │  │        │        │
│  └────────┘  └────────┘  └────────┘  └────────┘        │
│                                                         │
│  ACADEMIC                                   → see all   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ···   │
│  │        │  │        │  │        │  │        │        │
│  └────────┘  └────────┘  └────────┘  └────────┘        │
│                                                         │
│  CULTURE & ARTS                             → see all   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ···               │
│  └────────┘  └────────┘  └────────┘                    │
└─────────────────────────────────────────────────────────┘
```

#### Upstream Lineage

| Product | What They Do | What We Learn |
|---------|--------------|---------------|
| **Netflix** | Horizontal rows per category | Rows = shelves, scalable infinitely |
| **Spotify** | Same model, different content | Row paradigm is universal |
| **App Store** | Featured hero + category grids | Editorial curation matters |
| **Pinterest** | Masonry, content-sized | Content can dictate size |
| **Are.na** | Blocks in channels | Collections have relationships |

#### Grid Modes

**Mode A: Netflix Rows (Discovery)**
```
Horizontal scrolling rows by category.
Each row is a thesis: "For You", "Trending", "Academic".
Hero section at top shows live activity.
Hover/focus expands card to show preview.
```

**Mode B: Uniform Grid (Gallery)**
```
┌────┐ ┌────┐ ┌────┐ ┌────┐
│    │ │    │ │    │ │    │
└────┘ └────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐ ┌────┐
│    │ │    │ │    │ │    │
└────┘ └────┘ └────┘ └────┘
Traditional grid for equal-weight items.
Members, search results, tool gallery.
```

**Mode C: Territorial (Clustered)**
```
Spaces grouped by territory with visual distinction.
Each territory has its own "energy" (color accent, motion).
Creates sense of neighborhoods within campus.
```

**The Netflix Insight Applied:**
> Netflix doesn't show you a grid of 1000 movies. They show you curated rows — "Because you watched X", "Trending", "New Releases". Each row is a THESIS about what you might want.

For HIVE: Space discovery should be row-based. "For You" first (personalized), then territory rows. Horizontal scroll is thumb-natural on mobile.

**The Hero Section:**
Not a static feature — **live activity**:
- Shows spaces with current activity
- "🔥 Happening Now" with real-time updates
- Creates FOMO, proves platform is alive
- Auto-updates without refresh

**Card Preview on Hover:**
When card is hovered/focused:
- Card expands slightly
- Shows: recent message preview, members online, "Join" button
- Reduces clicks to action

#### Regions Used
- Hero section (featured/live)
- Row sections (horizontal scroll per category)
- Grid area (for uniform mode)
- Sticky Zone: Header (title, search)
- Sticky Zone: Filter bar (categories, pills)
- Sidebar: Filter panel (optional, desktop only)
- Overlay (for detail modals)

#### Regions NOT Used
- Content Column (grid, not column)
- Canvas (not spatial creation)
- Composer (not conversation)

#### Atmosphere Affinity
**Comfortable** atmosphere:
- Standard density
- Card warmth on hover/active
- Gold on activity indicators
- Subtle parallax on hero (optional)

#### Pattern Affinity
- Discovery & Joining (primary)
- Search results
- Gallery views
- Event browsing

#### Selection Criteria
> Use Grid when users browse, compare, and select from many items.

#### Row Behavior (Netflix Mode)
- Horizontal scroll per row
- "See all" expands to full grid
- First items have primacy (most important leftmost)
- Keyboard: Arrow keys navigate between rows and within rows

#### Grid Columns (Uniform Mode)
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns
- Wide: 4 columns max

#### Responsive Behavior
- Mobile: Stacked rows, horizontal scroll preserved
- Tablet: Rows intact, 2-up in uniform mode
- Desktop: Full layout, hover previews active

#### Examples
- `/spaces/browse` (Netflix rows — Mode A)
- `/tools` (Uniform grid — Mode B)
- Search results (Uniform grid — Mode B)
- Member directories (Uniform grid — Mode B)

---

### Template 5: Workspace

**Intent:** Creation studio. AI-first with power escape hatch.

**The Evolved Understanding:**
Workspace isn't just "IDE layout" — it's about **magic as default, power as option**. Cursor proved that AI shouldn't be bolted on; it should be the PRIMARY interface. But power users need escape hatches. Two modes: Magic (AI-first) and Build (full control).

```
Magic Mode (Default):
┌─────────────────────────────────────────────────────────┐
│  [✨ Magic]  [🔧 Build]                    [Preview]    │
├───────────────────────────────────────────┬─────────────┤
│                                           │             │
│                                           │  "Add a     │
│         LIVE CANVAS                       │  countdown  │
│         (see it build)                    │  timer"     │
│                                           │             │
│                                           │  → Building │
│                                           │  → Done!    │
│                                           │             │
├───────────────────────────────────────────┤  ────────── │
│ [📝][📊][🗳️][⏰]  ← Element dock          │   [Ask]    │
└───────────────────────────────────────────┴─────────────┘

Build Mode (Toggle):
┌─────────────────────────────────────────────────────────┐
│  [✨ Magic]  [🔧 Build]                    [Preview]    │
├─────────┬───────────────────────────────────┬───────────┤
│         │                                   │           │
│ PALETTE │                                   │ INSPECTOR │
│         │                                   │           │
│  (full  │            CANVAS                 │  (props   │
│   list) │                                   │   panel)  │
│         │                                   │           │
│         │                                   │           │
└─────────┴───────────────────────────────────┴───────────┘
```

#### Upstream Lineage

| Product | What They Do | What We Learn |
|---------|--------------|---------------|
| **Figma** | Palette + Canvas + Inspector | The proven three-panel model |
| **Cursor** | AI is the primary interface | Magic mode as default |
| **VS Code** | Extensible panels | Power users need customization |
| **Framer** | Visual + Code toggle | Two audiences, one tool |
| **Canva** | Templates first | Low barrier to start |
| **tldraw** | Canvas feels like paper | Tool should disappear |
| **Notion** | Blocks + slash commands | Consistent primitives |

#### Workspace Modes

**Mode A: Magic Mode (Default)**
```
AI chat rail on right.
Compact element dock at bottom (most-used, one-click).
Describe what you want → watch it appear on canvas.
Click elements to adjust in properties popover.
AI always ready: "What do you want to add?"
```

**Mode B: Build Mode (Power)**
```
Full element palette on left (categorized, searchable).
Properties inspector on right (all properties exposed).
Canvas in center.
AI still available via ⌘K or chat toggle.
For users who want direct control.
```

**Mode Toggle:**
- Top toolbar: [✨ Magic] [🔧 Build]
- Remembers preference per user
- Smooth transition between modes

**The Cursor Insight Applied:**
> Cursor didn't add AI to VS Code. They built an editor WHERE THE PRIMARY INTERFACE IS AI. You describe what you want. It builds. You refine.

For HIVE: HiveLab's default should be Magic Mode. New users describe tools in natural language. AI builds. Users refine. Power users toggle to Build Mode.

**The Framer Insight Applied:**
> Framer serves both designers (visual) and developers (code). Toggle between views. Same project, different interfaces.

For HIVE: Serve both casual creators (Magic) and power users (Build). Same tool, different modes.

#### Regions Used (varies by mode)

**Magic Mode:**
- Canvas (center, fills space)
- Rail: AI Chat (right, persistent)
- Element Dock (bottom, compact)
- Sticky Zone: Toolbar (top)
- Overlay (save dialogs, preview)

**Build Mode:**
- Canvas (center, fills space)
- Sidebar: Palette (left, full element list)
- Rail: Inspector (right, properties)
- Sticky Zone: Toolbar (top)
- Overlay (save dialogs, preview)

#### Atmosphere Affinity
**Workshop atmosphere** (compact, utilitarian):
- Tight density everywhere
- No glass effects
- No gradients
- No ambient warmth
- Focus entirely on the work
- Gold only on active/success states

#### Pattern Affinity
- Tool Building (primary)
- Any creation/editing flow

#### Selection Criteria
> Use Workspace when users create, edit, or compose. Default to Magic, offer Build.

#### Panel Behavior

**Magic Mode:**
- AI Rail: Always visible, 280px
- Element Dock: 48px height, horizontal, expandable
- Canvas: Fills remaining space

**Build Mode:**
- Palette: Collapsible, 240px expanded, 48px collapsed
- Inspector: Collapsible, 280px expanded, hidden when collapsed
- Canvas: Fills remaining space

#### Responsive Behavior
- Desktop: Full layout per mode
- Tablet: Magic Mode only (Build Mode too cramped), AI in sheet
- Mobile: Canvas only, all panels as sheets, AI via fab button

#### Canvas Behavior
- Pannable (drag to move view)
- Zoomable (scroll/pinch to zoom)
- Grid overlay (toggleable)
- Snap to grid (toggleable)
- Live preview (toggleable via toolbar)

#### Examples
- `/tools/create` (Magic Mode start)
- `/tools/[id]/edit` (respects mode preference)
- HiveLab IDE

---

## TEMPLATE COMPOSITION

Templates compose. This is crucial to understand.

### The Nesting Model

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    │           SHELL TEMPLATE            │
                    │         (Navigation Frame)          │
                    │                                     │
                    │    ┌───────────────────────────┐    │
                    │    │                           │    │
                    │    │    CONTENT TEMPLATE       │    │
                    │    │   (Stream/Grid/Focus/     │    │
                    │    │    Workspace)             │    │
                    │    │                           │    │
                    │    │    ┌───────────────┐      │    │
                    │    │    │               │      │    │
                    │    │    │   PATTERN     │      │    │
                    │    │    │               │      │    │
                    │    │    └───────────────┘      │    │
                    │    │                           │    │
                    │    └───────────────────────────┘    │
                    │                                     │
                    └─────────────────────────────────────┘
```

### Composition Rules

| Outer Template | Can Contain |
|----------------|-------------|
| None (root) | Focus, Shell |
| Shell | Stream, Grid, Focus, Workspace |
| Stream | Patterns only |
| Grid | Patterns only |
| Focus | Patterns only |
| Workspace | Patterns only |

### Common Compositions

| Page | Composition | Shell Mode |
|------|-------------|------------|
| Auth | Focus (Portal) | — |
| Onboarding | Focus (Reveal) | — |
| Chat | Shell → Stream (Conversational) | Living Sidebar |
| Browse | Shell → Grid (Netflix) | Minimal Rail |
| Feed | Shell → Stream (Stories) | Minimal Rail |
| Settings | Shell → Focus | Minimal Rail |
| IDE | Shell → Workspace | Hidden |
| Profile | Shell → Stream (variant) | Minimal Rail |

### Focus as Inner Template

Focus can appear inside Shell for settings-like pages:

```
┌──────────┬──────────────────────────────────────────────┐
│          │                                              │
│ SIDEBAR  │         ┌───────────────────┐                │
│ (rail)   │         │                   │                │
│          │         │  FOCUS CONTENT    │                │
│          │         │   (centered)      │                │
│          │         │                   │                │
│          │         └───────────────────┘                │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

This is Shell → Focus composition, used for settings pages where you want navigation but single-task focus in the content area.

---

## ATMOSPHERE APPLICATION

Atmosphere modifies templates. Same structure, different density and effects.

### Atmosphere × Template Matrix

| Template | Landing | Comfortable | Workshop |
|----------|---------|-------------|----------|
| Focus | ✓ (auth/onboarding) | - | - |
| Shell | - | ✓ (default) | - |
| Stream | - | ✓ (chat/feed) | - |
| Grid | ✓ (landing preview) | ✓ (browse) | - |
| Workspace | - | - | ✓ (IDE) |

### How Atmosphere Modifies Templates

**Landing Atmosphere** (Focus, Grid preview):
```css
/* Spacing */
--gap: 32px;
--padding: 48px;

/* Effects */
--blur: 12px;
--glass-opacity: 0.8;
--gradient: subtle warm (gold edge glow)
--ambient: particles, motion

/* Gold */
--gold-budget: CTA only
```

**Comfortable Atmosphere** (Shell, Stream, Grid):
```css
/* Spacing */
--gap: 16-24px;
--padding: 24px;

/* Effects */
--blur: none (except modals/rails);
--glass-opacity: n/a;
--gradient: none

/* Gold */
--gold-budget: presence, CTA, active counts
```

**Workshop Atmosphere** (Workspace):
```css
/* Spacing */
--gap: 8-12px;
--padding: 12-16px;

/* Effects */
--blur: none;
--glass-opacity: n/a;
--gradient: none

/* Gold */
--gold-budget: minimal (status/success only)
```

### Atmosphere Does NOT Change

- Region positions
- Template structure
- Responsive breakpoints
- Z-index layers

Atmosphere is a **modifier**, not an alternative structure.

---

## RESPONSIVE PRINCIPLES

### The 1024px Standard

HIVE uses 1024px as the primary breakpoint (documented in CLAUDE.md).

| Viewport | Classification | Shell Behavior |
|----------|----------------|----------------|
| < 768px | Mobile | No sidebar, bottom nav |
| 768-1023px | Tablet | Collapsed sidebar (48px rail) |
| 1024px+ | Desktop | Context-appropriate sidebar |

### Per-Template Responsive Behavior

**Focus Template:**
```
Mobile:   Full width, generous padding, simplified ambient
Tablet:   Centered, max-width 480px, full ambient
Desktop:  Centered, max-width 640px, full ambient + effects
```

**Shell Template:**
```
Mobile:   No sidebar, bottom nav, full content
Tablet:   Rail only (48px), full content
Desktop:  Context-appropriate (rail or expanded)
```

**Stream Template:**
```
Mobile:   Full width, sticky composer, thread as sheet
Tablet:   Centered 3xl, moderate padding, thread as sheet
Desktop:  Centered 3xl, generous padding, thread in rail
```

**Grid Template:**
```
Mobile:   Stacked rows (horizontal scroll preserved), 1-col uniform
Tablet:   Rows intact, 2-col uniform, filter in sheet
Desktop:  Full layout, 3-4 col uniform, hover previews, optional filter sidebar
```

**Workspace Template:**
```
Mobile:   Canvas only, panels as sheets, AI via FAB
Tablet:   Magic Mode only, AI as sheet
Desktop:  Full layout, mode toggle available
```

### Region Collapse Patterns

| Region | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| Sidebar | Bottom nav | Rail (48px) | Context-appropriate |
| Rail | Sheet | Sheet | Visible |
| Palette | Sheet | Collapsed | Visible (Build Mode) |
| Inspector | Sheet | Hidden | Visible (Build Mode) |
| AI Chat | Sheet/FAB | Sheet | Visible (Magic Mode) |
| Filter Sidebar | Sheet | Sheet | Visible (if complex) |

---

## TEMPLATE SELECTION

### Decision Tree

```
START
  │
  ├─ Is user authenticated?
  │   │
  │   ├─ NO → Focus Template
  │   │        ├─ Login/Verify → Portal mode
  │   │        └─ Onboarding → Reveal mode
  │   │
  │   └─ YES → Shell Template (wrapper)
  │             │
  │             └─ What is primary action?
  │                 │
  │                 ├─ Browse/Select many → Grid Template
  │                 │    └─ Discovery → Netflix mode
  │                 │    └─ Gallery → Uniform mode
  │                 │
  │                 ├─ Chat/Conversation → Stream Template
  │                 │    └─ Real-time chat → Conversational mode
  │                 │    └─ Feed → Stories mode
  │                 │    └─ Notifications → Sectioned mode
  │                 │
  │                 ├─ Create/Edit → Workspace Template
  │                 │    └─ New user → Magic mode
  │                 │    └─ Power user → Build mode (or preference)
  │                 │
  │                 └─ Settings/Single Task → Focus Template (inner)
```

### Quick Reference

| User Need | Template | Mode | Shell Mode | Atmosphere |
|-----------|----------|------|------------|------------|
| Log in | Focus | Portal | — | Landing |
| Onboard | Focus | Reveal | — | Landing |
| Browse spaces | Shell → Grid | Netflix | Rail | Comfortable |
| Search results | Shell → Grid | Uniform | Rail | Comfortable |
| Chat in space | Shell → Stream | Conversational | Living | Comfortable |
| View feed | Shell → Stream | Stories | Rail | Comfortable |
| Notifications | Shell → Stream | Sectioned | Rail | Comfortable |
| Build tool | Shell → Workspace | Magic/Build | Hidden | Workshop |
| Edit profile | Shell → Focus | — | Rail | Comfortable |
| Settings | Shell → Focus | — | Rail | Comfortable |

---

## PATTERN × TEMPLATE REFERENCE

### Pattern Compatibility Matrix

| Pattern | Focus | Shell | Stream | Grid | Workspace |
|---------|-------|-------|--------|------|-----------|
| Gate & Onboarding | ✓ | - | - | - | - |
| Space Participation | - | wrapper | ✓ | - | - |
| Discovery & Joining | - | wrapper | - | ✓ | - |
| Profile & Identity | - | wrapper | variant | - | - |
| Tool Building | - | wrapper | - | - | ✓ |
| Event Flow | - | wrapper | - | ✓ | - |
| Connection Building | - | wrapper | - | ✓ | - |
| Command & Search | - | overlay | overlay | overlay | overlay |

### Pattern → Template Mapping

| Pattern | Primary Template | Mode | Notes |
|---------|------------------|------|-------|
| **Gate & Onboarding** | Focus | Portal → Reveal | No shell, immersive |
| **Space Participation** | Stream | Conversational | Inside Shell (Living) |
| **Discovery & Joining** | Grid | Netflix | Inside Shell (Rail) |
| **Profile & Identity** | Stream variant | — | Bento grid in stream |
| **Tool Building** | Workspace | Magic default | Inside Shell (Hidden) |
| **Event Flow** | Grid + Modal | Uniform | Grid browse, modal details |
| **Connection Building** | Grid + Modal | Uniform | Grid browse, modal actions |
| **Command & Search** | Overlay | — | Appears in any template |

---

## SUMMARY

### The 5 Templates (Evolved)

| Template | Core Intent | Key Insight |
|----------|-------------|-------------|
| **Focus** | Controlled revelation | Not empty space, but atmospheric container |
| **Shell** | Living frame | Breathes with context, not static chrome |
| **Stream** | Temporal flow | Different streams need different treatments |
| **Grid** | Curated discovery | Show what's alive, not just what exists |
| **Workspace** | Magic + power | AI-first default, power escape hatch |

### Key Concepts

1. **Templates are emotional architectures**, not just layouts
2. **Templates compose** — Shell wraps content templates
3. **Templates have modes** — Same structure, different expressions
4. **Atmosphere modifies density**, not structure
5. **Upstream lineage matters** — We learn from Arc, Discord, Netflix, Cursor
6. **Responsive is built-in** — 1024px breakpoint

### The HIVE Synthesis

We're not copying any product. We're synthesizing:
- **Arc's revelation** → Focus onboarding
- **Discord's places** → Shell living sidebar
- **TikTok's immersion** → Stream stories
- **Netflix's curation** → Grid rows
- **Cursor's magic** → Workspace AI-first

### Using This Document

1. **Choosing a template:** Use the decision tree
2. **Understanding modes:** Read the mode descriptions per template
3. **Atmosphere selection:** Check the matrix
4. **Pattern compatibility:** Check the mapping table
5. **Responsive behavior:** Check per-template rules
6. **Upstream reference:** Understand why we made these choices

---

## NEXT LEVEL

Templates compose into **Instances** — the final embodiment of design philosophy.

**See:** `docs/INSTANCES.md` (Level 9)

An instance is where every upstream decision materializes:
- `/spaces/[id]` — Shell (Living) → Stream (Conversational)
- `/tools/create` — Shell (Hidden) → Workspace (Magic)
- `/` — Focus (Portal)

Instances are addresses, not pages. They breathe, remember, and have gravity.

---

*Templates define where. Patterns define what. Atmosphere defines how. Upstream informs why. Instances embody all of it.*
