# HIVE Component Spec (Storybook)

> Every component that exists in the app is defined here.
> If it's not in this spec, it shouldn't be in the codebase.
> Each component has: purpose, variants, exact styles, props, and size constraints.

---

## Design Tokens Reference

```
COLORS
  bg-void:          #000000
  bg-surface:       #0A0A0A
  bg-card:          #111111
  bg-card-hover:    #161616
  bg-input:         #111111
  bg-overlay:       rgba(0,0,0,0.8)
  border-subtle:    rgba(255,255,255,0.05)
  border-input:     rgba(255,255,255,0.10)
  border-focus:     rgba(255,255,255,0.20)
  text-primary:     #FFFFFF
  text-secondary:   rgba(255,255,255,0.5)
  text-tertiary:    rgba(255,255,255,0.3)
  text-inverse:     #000000
  accent-gold:      #FFD700
  accent-gold-hover:#E6C200
  status-success:   #22C55E
  status-error:     #EF4444

TYPOGRAPHY
  display-xl:       Clash Display / 56px / 700
  display-lg:       Clash Display / 32px / 600
  display-md:       Clash Display / 24px / 600
  display-stat:     Clash Display / 28px / 700
  body:             Geist / 15px / 400
  body-sm:          Geist / 14px / 400
  body-semibold:    Geist / 14px / 600
  label:            Geist Mono / 11px / 500 / uppercase
  mono:             Geist Mono / 11px / 400

SPACING (4px grid)
  1: 4px    2: 8px    3: 12px    4: 16px
  5: 20px   6: 24px   8: 32px   12: 48px   16: 64px

MOTION
  duration:         100ms (max)
  easing:           ease-out
  hover-lift:       translateY(-2px) 100ms ease-out
  gold-pulse:       3s ease-in-out infinite (opacity 0.6 → 1.0)
```

---

## Primitives

### Button

The only button in the system. Always a pill.

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| **primary** | `accent-gold` | `text-inverse` | none | `accent-gold-hover` |
| **ghost** | transparent | `text-primary` | `border-subtle` | `bg-card` |
| **text** | transparent | `text-secondary` | none | `text-primary` |
| **danger** | transparent | `status-error` | `status-error/20` | `status-error/10 bg` |

```
Props:
  variant:    'primary' | 'ghost' | 'text' | 'danger'
  size:       'sm' (h-8 px-4 text-13) | 'md' (h-10 px-5 text-14) | 'lg' (h-12 px-6 text-15)
  icon?:      ReactNode (left side)
  loading?:   boolean (shows inline spinner, disables)
  fullWidth?: boolean

Styles:
  All variants: rounded-full, font-semibold (600), transition-colors 100ms
  Focus: outline-2 outline-offset-2 outline-[#FFD700]
  Disabled: opacity-50 cursor-not-allowed

Max file size: ~60 lines
```

### Avatar

```
Variants:
  single:   Circle image with fallback initials on bg-card
  stack:    Overlapping circles (max 5 shown + "+N" counter)
  ghost:    Gray circle with subtle shimmer (social tease)

Props:
  src?:     string (image URL)
  name:     string (for fallback initials)
  size:     'sm' (24px) | 'md' (32px) | 'lg' (40px) | 'xl' (56px)

Styles:
  Fallback: bg-card, text-secondary, first initial centered
  Border: 2px solid bg-void (for stack overlap)
  Ghost: bg-card with opacity-40 pulse animation

AvatarStack props:
  users:    Array<{ src?, name }>
  max:      number (default 5)
  size:     same as Avatar
  ghost?:   number (adds N ghost circles after real avatars)
```

### Badge

```
Variants:
  dot:      6px circle, accent-gold (unread)
  ring:     8px circle, 2px accent-gold border, transparent fill (active content)
  count:    Min 16px pill, bg-[accent-gold], text-inverse, Geist Mono 10px

Props:
  variant:  'dot' | 'ring' | 'count'
  count?:   number (for count variant)
  pulse?:   boolean (adds gold-pulse animation)

Placement: absolute, positioned by parent
```

### Input

```
Variants:
  text:     Standard text input
  search:   Search input with magnifying glass icon
  chat:     Chat input with send button and slash command support

Styles (all variants):
  bg-input, border border-input, rounded-xl (NOT rounded-full)
  Placeholder: text-tertiary
  Focus: border-focus
  Height: 40px (text/search), 48px (chat)
  Padding: 12px horizontal

Chat variant additional:
  Right side: [+] button (gold circle, 32px)
  Slash detection: '/' at start shows command dropdown
  Submit: Enter key or send button

Props:
  variant:     'text' | 'search' | 'chat'
  placeholder: string
  value:       string
  onChange:    (value: string) => void
  onSubmit?:   (value: string) => void
  onSlash?:    () => void (chat variant — triggered on '/')
```

### ChipSelect

For onboarding and filters. Tappable chips in a row.

```
Props:
  options:    Array<{ value: string, label: string }>
  selected:   string | string[]
  onChange:    (value: string | string[]) => void
  multi?:     boolean (allow multiple selection)

Chip styles:
  Default:  bg-card, border-subtle, text-secondary, rounded-full, h-8, px-4
  Selected: accent-gold border, text-primary
  Hover:    bg-card-hover

Layout: flex-wrap, gap-2 (8px)
```

### SectionLabel

```
Text: Geist Mono, 11px, uppercase, text-secondary, letter-spacing 0.05em
Margin-bottom: 12px

Props:
  children: string

That's it. One line of text. ~10 lines of code max.
```

### Skeleton

Loading placeholder. Matches the shape of what it replaces.

```
Variants:
  text:     Rounded rectangle, h-4, variable width
  card:     Rounded rectangle matching card dimensions
  avatar:   Circle matching avatar size
  line:     Full-width rectangle, h-3

Styles:
  bg-card with animate-pulse (opacity 0.5 → 0.3, 1.5s)
  rounded-lg (cards) or rounded-full (avatar, text)

No spinners anywhere. Skeletons only.
```

---

## Composites

### FeedCard

Card in the Home feed. Contains an interactive creation.

```
┌─────────────────────────────────────┐
│  [icon] Type · Space Name     time  │
│  Title                              │
│                                     │
│  [interactive content area]         │
│                                     │
│  engagement stat · metadata         │
└─────────────────────────────────────┘

Styles:
  bg-card, border border-subtle, rounded-xl
  Padding: 16px
  Hover: bg-card-hover + translateY(-2px) 100ms
  Max-width: 640px (constrained by feed layout)

Props:
  type:       'poll' | 'bracket' | 'rsvp' | 'event' | 'space-activity' | 'milestone'
  space:      { name: string, handle: string }
  timestamp:  Date
  children:   ReactNode (the interactive content)

Header: [type icon] + type label + "·" + space name (link) + timestamp (right-aligned)
  Type/space: body-sm, text-secondary
  Timestamp: mono, text-secondary

Footer: engagement stat (display-stat if high, body otherwise) + metadata
  Gold number if engagement > threshold

Max file size: ~80 lines (delegates interactive content to children)
```

### PollCard

Inline poll in stream or feed.

```
┌─────────────────────────────────────┐
│  Question text                      │
│                                     │
│  ○ Option A    ████████████░░  67%  │
│  ○ Option B    ████████░░░░░░  28%  │
│  ○ Option C    ███░░░░░░░░░░░   5%  │
│                                     │
│  142 votes · 2h left                │
└─────────────────────────────────────┘

States:
  unvoted:  Radio buttons visible, bars hidden. Tap to vote.
  voted:    Radio disabled, bars visible with percentages. Your vote highlighted.
  closed:   Same as voted but "Closed" instead of time remaining.

Bar styles:
  Track: bg-white/5, h-8, rounded-full
  Fill: bg-white/20, rounded-full, width = percentage
  Your vote fill: accent-gold/30

Vote count: display-stat (28px) if > 50, body otherwise
Time remaining: mono, text-secondary

Props:
  question:    string
  options:     Array<{ id, text, votes, percentage }>
  totalVotes:  number
  userVote?:   string (option id)
  endsAt?:     Date
  onVote:      (optionId: string) => void

Max file size: ~100 lines
```

### BracketCard

Inline bracket matchup in stream or feed.

```
┌─────────────────────────────────────┐
│  Title                              │
│                                     │
│  ┌──────────┐    ┌──────────┐      │
│  │ Option A  │ vs │ Option B  │      │
│  │  [Vote]   │    │  [Vote]   │      │
│  └──────────┘    └──────────┘      │
│                                     │
│  67 matchups · Round 2              │
└─────────────────────────────────────┘

States:
  active:    Two options with vote buttons
  voted:     Your choice highlighted (gold border), waiting for results
  complete:  Winner shown, "Complete" badge

Option card styles:
  bg-void, border-subtle, rounded-lg, p-3, text-center
  Hover: border-white/10
  Voted: border accent-gold

Props:
  title:       string
  optionA:     { id, text, votes }
  optionB:     { id, text, votes }
  totalMatches:number
  round:       number
  userVote?:   string
  onVote:      (optionId: string) => void

Max file size: ~80 lines
```

### RSVPCard

Inline event RSVP in stream or feed.

```
┌─────────────────────────────────────┐
│  Event Title                        │
│  Day, Time · Location               │
│                                     │
│  [Going ✓]  [Maybe]     23 going    │
└─────────────────────────────────────┘

States:
  default:    Both buttons ghost style
  going:      "Going" button is primary (gold), "Maybe" is ghost
  maybe:      "Maybe" button has gold border, "Going" is ghost

Event title: display-md (24px)
Day/time/location: body-sm, text-secondary
Count: display-stat if > 20, body otherwise

Props:
  title:      string
  date:       Date
  location:   string
  goingCount: number
  userStatus?: 'going' | 'maybe' | null
  onRSVP:     (status: 'going' | 'maybe') => void

Max file size: ~60 lines
```

### MessageBubble

Chat message in Space stream.

```
│  Name                        2:34 PM │
│  message text goes here              │

Styles:
  Name: body-semibold, text-primary
  Timestamp: mono, text-secondary (right-aligned, same line as name)
  Message: body, text-primary

  No bubble background. No rounded container around messages.
  Messages are flat text on void. Like Discord.

  Hover: faint '+' appears right side (reaction tease)

  Spacing: 16px between messages from different users
           4px between consecutive messages from same user (grouped)

Props:
  author:     { name: string, avatar?: string }
  content:    string
  timestamp:  Date
  isGrouped:  boolean (consecutive message from same author)

Max file size: ~50 lines
```

### ContextBar

One-line urgent item below Space header.

```
│  Poll: Best IDE? ends in 2h                [Vote →]  │

Styles:
  bg-card, h-10, px-4, flex items-center justify-between
  border-b border-subtle
  Text: body-sm, text-secondary
  Action: body-sm, accent-gold

Only shows when there IS something urgent.
Auto-selects: active poll ending soonest, OR next event within 24h

Props:
  type:     'poll' | 'event'
  title:    string
  meta:     string ("ends in 2h" / "Saturday 2PM")
  action:   { label: string, onClick: () => void }

Max file size: ~30 lines
```

### SinceYouLeft

Divider in Space stream.

```
│  ── Since you left ──                                │

Styles:
  label, text-secondary, centered
  Horizontal lines on each side: border-subtle
  Margin: 24px vertical

Props:
  none (or optional message count: "3 new messages")

Max file size: ~15 lines
```

---

## Shell Components

### Rail (Desktop)

```
┌──────────┐
│   [logo]  │    <- HIVE logo, 32px
│           │
│   [H]     │    <- Home icon, 40px touch target
│           │
│   ───     │    <- Separator: border-subtle, 32px wide, centered
│           │
│   [CS]    │    <- Space icons, 36px circles
│   [DM]    │       with Badge overlay for indicators
│   [UB]    │
│           │
│   ───     │
│           │
│   [+]     │    <- Create button: 40px, accent-gold circle
│   [You]   │    <- Avatar (sm), bottom-pinned
└──────────┘

Styles:
  Width: 64px fixed
  bg-void, no border-right
  Flex column, items-center
  Padding: 12px vertical
  Gap between icons: 8px

RailIcon:
  Size: 36px circle (spaces), 40px (home, create)
  Default: bg-card, text-secondary
  Active: bg-card, text-primary + Badge dot (gold, left side)
  Hover: bg-card-hover
  Space icons: show first letter or space avatar

Props (Rail):
  currentPath:  string
  spaces:       Array<{ handle, name, avatar?, unread, hasActivity }>

Props (RailIcon):
  icon?:        ReactNode
  label:        string (for avatar fallback + aria-label)
  active:       boolean
  badge?:       'dot' | 'ring' | 'count'
  badgeCount?:  number
  onClick:      () => void

Max file size: Rail ~80 lines, RailIcon ~40 lines
```

### BottomBar (Mobile)

```
┌──────────────────────────────────┐
│  [Home]   [Spaces]   [+]   [You] │
└──────────────────────────────────┘

Styles:
  Height: 56px
  bg-void, border-t border-subtle
  Grid: 4 equal columns, items centered

Items:
  Icon: 24px
  Label: Geist Mono, 10px, uppercase
  Active: text-primary + gold dot below icon (6px)
  Inactive: text-secondary

[+] button: 44px gold circle, elevated (no label)

Props:
  currentTab:  'home' | 'spaces' | 'create' | 'you'
  onNavigate:  (tab: string) => void
  unreadCount?: number (for home badge)

Max file size: ~60 lines
```

### SpaceHeader

```
│  CompSci Club              ⚙  12 ●  [avatar stack] │

Styles:
  h-14, px-4, flex items-center justify-between
  border-b border-subtle

Left: Space name (display-lg at 20px — exception to scale for header fit)
Right: gear icon (text-secondary, 20px) + member count (mono) + online dot (gold, 6px) + AvatarStack

Props:
  name:          string
  memberCount:   number
  onlineCount:   number
  onSettings:    () => void

Max file size: ~40 lines
```

---

## Page-Level Components

### SpaceLanding (Unclaimed)

Full-page conversion layout for unclaimed spaces. NOT a stream.

```
Sections:
  1. Header: space name + category + campus
  2. Hero card: "This space is waiting for its leader" + Claim CTA
  3. Example prompts: 3 rows showing what's possible
  4. Members waiting: AvatarStack + count
  5. Alternative actions: "Join anyway" + "Send to your leader"

Props:
  space:         { name, category, campus, memberCount }
  members:       Array<{ name, avatar? }> (for avatar stack)
  onClaim:       () => void
  onJoin:        () => void
  onShareLink:   () => void

Max file size: ~120 lines
```

### LeaderNudge

In-stream card shown to space leaders when space is quiet.

```
┌──────────────────────────────────┐
│  Your space is live. 15 members.  │
│                                   │
│  Try: "What should we do for      │
│  our next event?"                 │
│                                   │
│  [Create something ●]             │
└──────────────────────────────────┘

Styles:
  bg-card, border border-subtle, rounded-xl, p-4
  Centered in stream area
  Suggested prompt: body, text-secondary, italic

Disappears after leader has 3+ creations.

Props:
  memberCount:    number
  suggestedPrompt: string
  onCreate:       () => void

Max file size: ~40 lines
```

### CreationView

Split-screen creation surface. Chat left, preview right.

```
Subcomponents:
  CreationChat:    AI conversation pane
  CreationPreview: Live app preview pane
  FormatChips:     Poll / Bracket / RSVP / Custom quick-start
  DeployBar:       Space selector + Deploy button

Layout:
  Desktop: 50/50 split (or chat 45% / preview 55%)
  Mobile: full-screen, swipe or tab between chat and preview

CreationChat max: ~150 lines
CreationPreview max: ~80 lines
CreationView (container) max: ~60 lines
```

---

## Component Inventory Rules

1. **If it's not in this spec, don't build it.** New components require adding to this spec first.
2. **Every component has a max file size.** Exceeding it means the component is doing too much.
3. **Every component has exact style definitions.** No "make it look good" — use the tokens.
4. **No component accepts a `className` prop** that overrides internal styles. Variants only.
5. **Every interactive component has defined states** (default, hover, active, disabled, loading).
6. **Every component renders correctly at 0 data** (empty state) and at max data (overflow handling).

## What Gets Deleted

These components/patterns currently exist and MUST be removed:

### Motion (packages/tokens/src/motion.ts)
- `buttonPressVariants` — buttons don't animate
- `tinderSprings` — no spring physics
- `creationPublishVariants` — no celebration animations
- `deployRippleVariants` — no ripple effects
- `milestoneVariants` — no milestone animations
- `staggerPresets` — no stagger
- `surfaceVariants` — surfaces don't animate
- CSS string motion duplicates
- Orchestration timing values
- Magnetic zone values
- All celebration/confetti/particle variants

### UI Components (packages/ui/src/)
- `NoiseOverlay` — no noise
- `AnimatedBorder` — no animated borders
- `WordReveal` — no word reveal
- `NarrativeReveal` — no narrative reveal
- `ParallaxText` — no parallax
- `Magnetic` — no magnetic effects
- `Stagger` — no stagger wrappers
- `ScrollSpacer` — no scroll spacers

### Tokens (packages/tokens/src/)
- `warmthSpectrum`, `getWarmthLevel` — no warmth system
- `IDE_TOKENS` — no IDE tokens
- `GLASS.surfaceBlur` — no glass
- `CARD.selected` gold border pattern — replaced by new card spec
- All exports not referenced by this component spec

### Target
- `packages/tokens/src/index.ts`: 245 exports → ~60
- `packages/tokens/src/motion.ts`: 668 lines → ~100
- `packages/ui/src/`: 75+ primitives → ~20
- Total components: 175+ → ~40
