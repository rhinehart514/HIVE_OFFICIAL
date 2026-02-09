# HIVE Design Language — 2026

> OpenAI's restraint. Vercel's confidence. Apple's reduction.
> Black and yellow. Nothing else.

---

## Identity

HIVE is black and yellow. A student sees a screenshot and knows it's HIVE because nothing else looks like this. The yellow isn't an accent — it's the signal. Everything else gets out of the way.

---

## Canvas

```
Background:  #000000
```

Pure black. Not warm, not off-black. Black.

---

## Color

```
Canvas:         #000000
Text primary:   #FFFFFF
Text secondary: rgba(255, 255, 255, 0.5)
Yellow:         #FFD700
Yellow hover:   #FFDF33
Error:          #EF4444
Success:        #22C55E
```

That's the entire palette. No other colors in the core UI.

Yellow appears on:
- Primary buttons / CTAs
- Live indicators (the pulsing dot)
- Selected / active states
- The HIVE logo mark
- Unread / attention indicators

When yellow isn't on screen, the UI is black and white. That's what makes yellow hit.

### Text: Two tiers only

```
Primary:    #FFFFFF
Secondary:  rgba(255, 255, 255, 0.5)
```

No white/30. No white/40. No white/60. If the text matters, it's white. If it's supporting, it's 50%. If it's neither, delete it.

---

## Typography

```
Headlines:  Clash Display — semibold
Body / UI:  Geist — regular / medium
Mono:       Geist Mono — timestamps, labels, status badges
```

### Scale

```
Hero:          clamp(56px, 12vw, 120px)  — Clash
Page title:    32–40px                    — Clash
Section head:  20–24px                    — Clash
Card title:    16px                       — Geist medium
Body:          14–15px                    — Geist regular
Caption:       12px                       — Geist regular
Label:         10–11px                    — Geist Mono, uppercase, tracked
```

### Rule

Clash Display shows up on every surface. Space names, page titles, tool names, profile display names. It's the font people associate with HIVE. If there's a headline, it's Clash.

---

## Surfaces

Not glass. Not frosted. **Solid.**

```css
/* Standard surface — cards, containers */
background: #0A0A0A;
border-radius: 16px;
border: 1px solid rgba(255, 255, 255, 0.08);

/* Subtle surface — list items, inputs */
background: rgba(255, 255, 255, 0.03);
border-radius: 12px;
border: none;

/* Overlay — modals, sheets, dropdowns (the ONLY thing that gets blur) */
background: rgba(10, 10, 10, 0.9);
backdrop-filter: blur(20px);
border-radius: 20px;
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 0 24px 48px rgba(0, 0, 0, 0.8);
```

Blur is reserved for things that overlay other content. Modals, dropdowns, the nav bar on scroll. If nothing is behind it, no blur. Solid fill.

---

## Borders

Rare. Most separation comes from spacing and background changes.

```
When needed:  1px solid rgba(255, 255, 255, 0.08)
Dividers:     1px solid rgba(255, 255, 255, 0.06)
```

---

## Radius

```
Buttons, badges:     9999px (pill)
Modals, sheets:      20px
Cards:               16px
Inputs:              12px
Messages:            0 (no radius — text sits on canvas)
```

---

## Interactive States

```
Hover:      background lightens (0.03 → 0.06)
Active:     background dims
Focus:      0 0 0 2px rgba(255, 255, 255, 0.5)
Disabled:   opacity 0.3
Transition: 150ms cubic-bezier(0.22, 1, 0.36, 1)
```

No scale. No y-shift. No spring physics. Surface changes only.

---

## Motion

### Do:
- Fade on route change (opacity 0→1, 150ms)
- Poll bars animate when votes arrive
- Yellow dot pulses on live elements (3s breathe cycle)
- Modals slide up from bottom on mobile (200ms)

### Don't:
- `whileHover={{ y: -2 }}`
- Word-by-word text reveals
- Parallax
- Stagger animations on lists
- Scale on hover
- Anything over 300ms

---

## Buttons

```css
/* Primary — yellow, one per screen max */
background: #FFD700;
color: #000000;
font: Geist medium, 14px;
padding: 10px 24px;
border-radius: 9999px;

/* Secondary — solid dark */
background: #1A1A1A;
color: #FFFFFF;
border: 1px solid rgba(255, 255, 255, 0.1);
padding: 10px 24px;
border-radius: 9999px;

/* Ghost — invisible until hover */
background: transparent;
color: rgba(255, 255, 255, 0.5);
padding: 8px 16px;
border-radius: 9999px;
```
```
hover: ghost → background rgba(255,255,255,0.06), color #FFFFFF
```

All buttons are pills.

---

## Icons

Lucide. 20px default, 16px compact.

Default: `rgba(255, 255, 255, 0.5)`. Hover/active: `#FFFFFF`.

---

## The Signature

The yellow pulsing dot. It appears on:
- Live tools (votes coming in)
- Active spaces (people chatting now)
- Online presence on profiles
- The "LIVE" badge on landing page
- Unread indicators

It's a 6px circle, `#FFD700`, with a breathe animation (3s cycle, opacity 0.6→1→0.6). Everywhere something is alive on HIVE, the dot is there. It's the heartbeat of the platform.

---

# LAYOUTS

Every surface has its own layout. No universal container. The layout matches the job.

---

## Landing Page (`/`)

**Job:** Convert a student in 15 seconds.

**Layout:** Full bleed. No max-width container. Edge to edge.

```
Desktop:
┌──────────────────────────────────────────────────┐
│ [logo]                              [Join UB]    │ ← thin bar, no bg
│                                                  │
│                                                  │
│   The app UB              ┌──────────────────┐   │
│   was missing.            │                  │   │
│                           │   Live poll      │   │
│   One line of what        │   ● LIVE         │   │
│   HIVE does.              │                  │   │
│                           │   [vote options] │   │
│   [Join UB] [Create]      │                  │   │
│                           └──────────────────┘   │
│                                                  │
│                                                  │
│                                                  │
│  ┌────────────────────┐ ┌──────────┐             │
│  │                    │ │          │             │
│  │    Discover        │ │  Create  │             │
│  │    (screenshot)    │ │ (screen) │             │
│  │                    │ │          │             │
│  └────────────────────┘ └──────────┘             │
│  ┌───────────────────────────────────┐           │
│  │         Spaces (screenshot)       │           │
│  └───────────────────────────────────┘           │
│                                                  │
│                                                  │
│                                                  │
│           Your club is already here.             │
│           [Join UB]  [Create a space]            │
│                                                  │
└──────────────────────────────────────────────────┘

Mobile:
┌────────────────────┐
│ [logo]   [Join UB] │
│                    │
│  The app UB        │
│  was missing.      │
│                    │
│  Subline.          │
│                    │
│  [Join UB]         │
│  [Create a space]  │
│                    │
│  ┌──────────────┐  │
│  │ Live poll    │  │
│  │ ● LIVE       │  │
│  │ [options]    │  │
│  └──────────────┘  │
│                    │
│  ┌──────────────┐  │
│  │ Discover     │  │
│  │ (screenshot) │  │
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │ Create       │  │
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │ Spaces       │  │
│  └──────────────┘  │
│                    │
│  Your club is      │
│  already here.     │
│  [Join UB]         │
│  [Create]          │
└────────────────────┘
```

**Key rules:**
- Nav bar has no background. Logo + one button. Transparent on black.
- Hero: headline left, poll right. Text is on the void — no container around it.
- Product section: real screenshots in solid `#0A0A0A` cards. Uneven grid.
- CTA: Clash headline, two pills, nothing else. Maximum black space around it.
- Mobile: CTAs above the fold. Poll below. Screenshots stack.

---

## Entry Flow (`/enter`)

**Job:** Get info and get out. Minimal friction.

**Layout:** Single centered column. One thing at a time. OpenAI energy.

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│                                      │
│                                      │
│         What's your email?           │  ← Clash, 24px, white
│                                      │
│         ┌────────────────────┐       │
│         │                    │       │  ← input, 12px radius
│         └────────────────────┘       │
│                                      │
│         [Continue]                   │  ← yellow pill, full width of input
│                                      │
│                                      │
│              ● ● ○ ○                 │  ← progress dots
│                                      │
│                                      │
└──────────────────────────────────────┘
```

**Key rules:**
- No card wrapping the form. Headline + input + button directly on black void.
- Max width 400px for the input area.
- Each phase: headline changes, input changes, button changes. Nothing else on screen.
- Progress dots: white filled = done, `white/20` = upcoming. 6px circles.
- Skip links: "Skip for now" as ghost text below the button. `text-white/50`, 12px.
- No logo on this page. No nav. You're in a tunnel.
- Phase transition: content fades (100ms out, 150ms in). Nothing moves.

---

## App Shell (nav + chrome)

**Job:** Navigate without thinking. Get out of the way of content.

**Layout:** Thin sidebar on desktop. Bottom bar on mobile.

```
Desktop:
┌─────────┬────────────────────────────────────┐
│         │                                    │
│  ● HIVE │         Content area               │
│         │         (each page owns this)       │
│  Disc.  │                                    │
│  Spaces │                                    │
│  You    │                                    │
│         │                                    │
│         │                                    │
│         │                                    │
│         │                                    │
│  ──     │                                    │
│  [+]    │                                    │
│         │                                    │
└─────────┴────────────────────────────────────┘
  200px                  rest

Mobile:
┌────────────────────────┐
│                        │
│    Content area        │
│    (full screen)       │
│                        │
│                        │
│                   [+]  │  ← yellow FAB, 56px circle
│                        │
├────────────────────────┤
│ ◇ Disc  ◇ Spaces  ◇ U │  ← bottom bar, frosted
└────────────────────────┘
```

**Sidebar (desktop):**
- Width: 200px fixed.
- Background: `#000000` — same as canvas. No panel. No border on the right. Items just sit on the void.
- Logo: HIVE mark in yellow, 24px. Top left.
- Nav items: Geist medium, 14px. Vertically stacked. `text-white/50` default.
- Active item: `text-white`. Small yellow dot (6px) to the left of the text. No background highlight.
- Create button: at the bottom. Yellow pill. `[+ Create]`.
- Spacing between items: 8px. Compact.

**Bottom bar (mobile):**
- Background: `rgba(0, 0, 0, 0.8) backdrop-blur(12px)`. This is an overlay — blur is justified.
- Border top: `1px solid rgba(255, 255, 255, 0.06)`.
- Three items with icons + labels. Geist Mono 10px uppercase.
- Active: `text-white` + yellow dot below icon.
- Inactive: `text-white/50`.
- Height: 56px + safe area.

**Create FAB (mobile, campus mode only):**
- `position: fixed`, `bottom: 80px`, `right: 16px`.
- 56px yellow circle. Black `+` icon, 24px.
- No shadow. Just the circle on the void.

---

## Discover (`/discover`)

**Job:** Campus dashboard. What's happening right now. Dense and scannable.

**Layout:** Vercel dashboard energy. Dense grid. Information-first.

```
Desktop:
┌─────────────────────────────────────────────┐
│                                             │
│  Discover                    [Campus Mode]  │  ← Clash 32px + badge
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🔍 Search tools, spaces, events... │    │  ← full-width input
│  └─────────────────────────────────────┘    │
│                                             │
│  OPEN NOW                                   │  ← Geist Mono label
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐   │
│  │Ellicott│ │CFA     │ │Putnam  │ │+2  │   │  ← horizontal scroll
│  │Closing │ │Open til│ │Lunch   │ │    │   │
│  │ 20min  │ │ 9pm   │ │ now    │ │    │   │
│  └────────┘ └────────┘ └────────┘ └────┘   │
│                                             │
│  EVENTS TONIGHT                             │
│  ┌──────────────────────┐ ┌──────────────┐  │
│  │ SGA Meeting          │ │ Pub Trivia   │  │
│  │ 7pm · Student Union  │ │ 9pm · SU 330 │  │
│  └──────────────────────┘ └──────────────┘  │
│                                             │
│  TRENDING TOOLS                ● 4 live now │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Poll     │ │ Signup   │ │ Counter  │    │
│  │ 47 votes │ │ 12/20    │ │ 2d left  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  SPACES TO JOIN                             │
│  CompSci Club · Dance Marathon · UB Esports │  ← simple text list
│                                             │
└─────────────────────────────────────────────┘
```

**Key rules:**
- Page title "Discover" in Clash, 32px, white. Top left.
- "Campus Mode" badge top right: yellow text on `#FFD700/15` bg, pill shape, Geist Mono 10px.
- Section labels in Geist Mono, 11px, uppercase, tracked, `text-white/50`.
- **Dining cards have urgency.** Closing soon = yellow text for the time. Open for hours = `text-white/50` for the time. The data changes the component.
- **Events tonight = bigger cards.** These are time-sensitive. They get more visual weight than trending tools.
- **Trending tools show live state.** Yellow dot + count if people are using it right now.
- **Spaces to join = text list, not cards.** Don't over-design the lowest-priority section. Names with `→` arrows. Dense.
- Horizontal scroll on dining (mobile and desktop). Not a grid that wraps.
- Max-width: 960px centered. This is a dashboard, not a marketing page.

---

## Spaces Hub (`/spaces`)

**Job:** Your home. See your spaces. Open the one you want.

**Layout:** List, not grid. iMessage / Slack energy.

```
┌─────────────────────────────────────────┐
│                                         │
│  Spaces                          [+]    │  ← Clash 32px + create button
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ● CompSci Club          2m ago │    │  ← yellow dot = unread
│  │   "who's going to the hack..." │    │
│  ├─────────────────────────────────┤    │
│  │   Dance Marathon        1h ago │    │  ← no dot = read
│  │   "reminder: practice t..."    │    │
│  ├─────────────────────────────────┤    │
│  │ ● UB Esports             5m ago│    │
│  │   "tournament bracket i..."    │    │
│  ├─────────────────────────────────┤    │
│  │   Floor 7 Govs          3d ago │    │
│  │   "anyone want dominos?"       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Browse all spaces →                    │  ← ghost link
│                                         │
└─────────────────────────────────────────┘
```

**Key rules:**
- **It's a list.** Not cards. Not a grid. A list of spaces with the last message preview, timestamp, and unread indicator.
- Space name in Geist medium, 15px, white.
- Last message preview in Geist regular, 13px, `text-white/50`. Single line, truncated.
- Timestamp in Geist Mono, 11px, `text-white/50`. Right-aligned.
- Unread indicator: yellow dot (6px) to the left of the space name. Unread spaces have `text-white` name. Read spaces have `text-white/50` name.
- Each row: `hover: bg rgba(255,255,255,0.03)`. Subtle.
- Dividers between rows: `1px solid rgba(255,255,255,0.04)`. Barely visible.
- Max-width: 640px centered. This is a list, not a dashboard.
- "Browse all spaces →" links to Discover.
- Create button: small yellow pill top right. Or just a `+` icon in yellow.
- **No identity constellation. No onboarding states. No hub shells.** A list. Simple.

---

## Space Page (`/s/[handle]`)

**Job:** Where you spend time. Chat is the main event.

**Layout:** Chat-first. Full height. Split pane on desktop.

```
Desktop:
┌──────────────────────────────────────────────────┐
│  CompSci Club                    [⚙] [👥 24]    │  ← Clash 20px + member count
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│  Jake: anyone going to the hackathon?     2:34p  │
│  Maria: yep, need a team tho              2:35p  │
│  Jake: let's do it                        2:35p  │
│                                                  │
│  Maria: /poll "Best day to prep?" Sat Sun        │
│  ┌──────────────────────────────────────┐        │
│  │  Best day to prep?          ● LIVE   │        │
│  │  ○ Saturday          3 (60%)         │        │
│  │  ● Sunday            2 (40%)  ← voted│        │
│  │                        5 votes       │        │
│  └──────────────────────────────────────┘        │
│                                                  │
│  Tyler: sunday works for me               2:41p  │
│                                                  │
│                                                  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  / Try /poll, /rsvp, /countdown         │    │  ← chat input
│  │                                    [➤]  │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘

Mobile: (identical but full width, no split pane)
```

**Key rules:**
- **Chat takes the full screen.** No tabs. No sidebar by default. The space IS the chat.
- Space name top left in Clash, 20px. Member count as a pill badge top right.
- Settings gear icon, ghost style.
- Messages: no backgrounds on individual messages. Author name in Geist medium, white. Content in Geist regular, `white/80`. Timestamp in Geist Mono 11px, `white/30`. Right aligned or inline.
- **Inline components (polls, RSVPs, countdowns)** appear below the message that created them. Solid `#0A0A0A` surface, 16px radius. Yellow accent on selected options and live indicators.
- Chat input: bottom of screen. `bg rgba(255,255,255,0.03)`, 12px radius. Placeholder text: `/ Try /poll, /rsvp, /countdown` in `white/30`. Send button: yellow circle with arrow.
- When user types `/`: slash command menu appears above input. Solid `#0A0A0A` surface, list of commands.
- **Tools and Events access:** gear icon opens a drawer/panel from the right (desktop) or bottom sheet (mobile) with tools list and upcoming events. Not a tab. An overlay you summon when you need it.
- **No Tools | Chat | Events tabs.** Chat is the default and only view. Everything else is accessible but doesn't compete with the conversation.

---

## Profile (`/u/[handle]` and `/me`)

**Job:** Who you are on HIVE. What you've built.

**Layout:** Single centered column. Apple "about" energy.

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│              Jake Chen                   │  ← Clash, 40px, white, centered
│              @jakechen                   │  ← Geist Mono, 14px, white/50
│                                          │
│              Computer Science · 2026     │  ← Geist, 14px, white/50
│                                          │
│              ● Online                    │  ← yellow dot + text
│                                          │
│  ────────────────────────────────────    │
│                                          │
│  TOOLS BUILT                             │  ← Geist Mono label
│                                          │
│  ┌────────────┐  ┌────────────┐          │
│  │ 📊 Poll    │  │ 📝 Signup  │          │
│  │ 142 uses   │  │ 38 uses    │          │
│  └────────────┘  └────────────┘          │
│                                          │
│  SPACES                                  │
│  CompSci Club · UB Esports · Floor 7     │  ← text list
│                                          │
│  Member since Jan 2026                   │  ← Geist Mono, 11px, white/30
│                                          │
└──────────────────────────────────────────┘
```

**Key rules:**
- Name in Clash, 40px, centered. The biggest text on the page.
- Handle in Geist Mono, `white/50`.
- Bio / major / year in Geist, `white/50`. One line.
- Online status: yellow dot + "Online" in Geist, 12px.
- Divider: single `1px solid white/06` line. Full width of content column.
- Tools built: small cards, 2-column grid. Tool emoji + name + usage count. Solid `#0A0A0A` surface.
- Spaces: text list, not cards. Minimal.
- Max-width: 480px centered. Narrow. Intentionally constrained.
- Edit profile (own profile): ghost "Edit" button top right. Opens a modal.
- **No social metrics. No follower counts. No connections section.** Tools built is the proof of work.

---

## Lab (`/lab`)

**Job:** Build tools. IDE energy.

**Layout:** Sidebar + main area. Vercel / VS Code hybrid.

```
┌──────────┬───────────────────────────────────┐
│          │                                   │
│ My Tools │   Tool Editor / Preview           │
│          │                                   │
│ Poll     │   ┌──────────────────────────┐    │
│ Signup ● │   │                          │    │  ← ● = yellow dot on active
│ Counter  │   │   Live preview            │    │
│          │   │                          │    │
│          │   │                          │    │
│ ──       │   └──────────────────────────┘    │
│ [+ New]  │                                   │
│          │   [Deploy]  [Share]               │
│          │                                   │
└──────────┴───────────────────────────────────┘
  220px                 rest
```

**Key rules:**
- Left sidebar: tool list. Name + yellow dot if tool is live/active.
- Main area: the editor, preview, settings for the selected tool.
- Deploy button: yellow pill. The main action.
- This surface can be denser and more technical than the rest of HIVE.
- Max-width: none. Full width of the content area.

---

## Standalone Tool (`/t/[toolId]`)

**Job:** The shared link. Someone tapped a link in GroupMe and landed here.

**Layout:** Frameless. The tool IS the page.

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│    ┌────────────────────────┐    │
│    │                        │    │
│    │     The tool itself    │    │
│    │     (poll, signup,     │    │
│    │      countdown, etc)   │    │
│    │                        │    │
│    └────────────────────────┘    │
│                                  │
│            ● HIVE                │  ← tiny watermark, yellow dot + text
│                                  │
│    [Sign up to build your own]   │  ← ghost text link
│                                  │
└──────────────────────────────────┘
```

**Key rules:**
- No nav bar. No app shell. No sidebar. No bottom bar.
- Pure black canvas. Tool centered. Max-width 480px.
- Tool renders in a solid `#0A0A0A` surface, 16px radius.
- HIVE watermark: tiny. Yellow dot + "HIVE" in Geist Mono 10px, `white/30`. Bottom center. Not a logo — a mark.
- CTA below: "Sign up to build your own →" as ghost text. Links to `/enter`.
- This page needs to load fast. No design system imports. Minimal JS.
- **This is the most important surface for growth.** It's what people see when they get a link. It has to be instant and clean.

---

## About (`/about`)

**Job:** The story. For people who want to know.

**Layout:** Single column editorial. Apple newsroom energy.

```
Max-width 640px, centered. Long-scroll.

Headline: Clash, 48px, white.
Body: Geist, 16px, white. (Not white/50 — this is for reading.)
Pull quotes: Clash, 24px, yellow.
Section spacing: 120px between sections.
```

**Key rules:**
- No tabs. One continuous scroll.
- Reduce to: What HIVE Is → Why It Took Two Years → What's In It → Contributors → CTA.
- Body text is full white. This is a reading page. Readability > aesthetic.
- Pull quotes / key statements in Clash, yellow. These break up the text and give the eye places to land.
- No visualizations (BeforeAfterSplit, TimeCollapseBar, NetworkRipple). The writing is strong enough. Let it work.
- Contributors section: names in a horizontal wrap. Minimal.
- CTA at bottom: "Your club is already here." + two pill buttons.

---

# WHAT DIES

From the current codebase, kill:

- [ ] `tokens.css` warmth system (`--warmth-low/medium/high`)
- [ ] `NoiseOverlay` component
- [ ] `AnimatedBorder` component
- [ ] `WordReveal` / `NarrativeReveal` components
- [ ] `ParallaxText` / `Parallax` components
- [ ] `ScrollIndicator` component
- [ ] `ScrollSpacer` component
- [ ] `Magnetic` wrapper component
- [ ] `Stagger` / `staggerContainerVariants`
- [ ] `whileHover={{ y: -2 }}` everywhere
- [ ] `cardHoverVariants` / `revealVariants`
- [ ] `BeforeAfterSplit` / `TimeCollapseBar` / `NetworkRipple` components
- [ ] 6-tier text opacity system (white/20, white/30, white/40, white/50, white/60, white/80)
- [ ] `bg-foundation-gray-1000` / warm background tokens
- [ ] Space tabs (Tools | Chat | Events) — chat is the only view
- [ ] Identity constellation in SpacesHub
- [ ] Hub states (empty/onboarding/active) — always show the list
- [ ] Emotional state system in entry flow

---

# THE TEST

Open any surface. Ask:

1. Is this OpenAI-level restrained?
2. Is it Vercel-level confident?
3. Is it Apple-level reduced?
4. Is it black and yellow?
5. Would a student think a human designed this?

If #5 is no, keep going.

---

*This is the source of truth. Every surface answers to this document.*
