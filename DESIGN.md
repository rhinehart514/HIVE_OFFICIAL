# HIVE Design Direction — V1

**Created:** 2026-02-14
**Status:** Proposal — needs Jacob's review before implementation

---

## Design Philosophy

**HIVE should feel like a place, not an app.**

When a UB freshman opens HIVE, it should feel like walking into a building where things are happening — not like opening a productivity tool. The aesthetic is: alive, owned, warm in a dark way. Think late-night dorm common room, not Silicon Valley dashboard.

### Guiding Principles

1. **Warm dark, not cold dark.** The current `#0A0A09` base is good but everything on top feels clinical. Gold (#FFD700) is the accent — it's warm, premium, distinctive. Use it more boldly. The dark should feel like night, not like a terminal.

2. **Density = life.** Sparse UIs feel dead. Show activity numbers, online counts, avatars, recent messages. A space with "3 online · 12 messages today" feels alive. A space with just a name feels abandoned.

3. **Every surface has an owner.** Spaces aren't generic containers — they belong to someone. Accent colors, avatars, pinned messages. When a leader customizes their space, every member feels the identity.

4. **Creation is visible.** Tools people build should be everywhere — in space sidebars, on profiles, in the feed. "I built this" should be a badge of honor, not hidden in a lab.

5. **Mobile is the real product.** Web-first, but 90% of students browse on phones between classes. Every decision should work at 375px width first, then scale up.

---

## Color System

### Base Palette
```
Background:     #0A0A09  (the void — current, keep)
Surface-1:      #111110  (cards, sidebar, elevated surfaces)
Surface-2:      #1A1A18  (inputs, hover states, secondary surfaces)
Border:         rgba(255, 255, 255, 0.06)  (current, keep)
Border-hover:   rgba(255, 255, 255, 0.12)

Text-primary:   rgba(255, 255, 255, 0.92)
Text-secondary: rgba(255, 255, 255, 0.50)
Text-tertiary:  rgba(255, 255, 255, 0.30)

Gold:           #FFD700  (primary accent — CTAs, badges, creation)
Gold-subtle:    rgba(255, 215, 0, 0.15)  (gold tinted backgrounds)
Gold-text:      #FFD700  (used sparingly for emphasis)

Online:         #22C55E  (green — keep current)
Danger:         #EF4444
Warning:        #F59E0B
```

### Space Accent Colors (leader picks one)
```
Amber:    #F59E0B    — warm, energetic (default)
Rose:     #F43F5E    — bold, social
Violet:   #8B5CF6    — creative, alternative
Blue:     #3B82F6    — professional, academic
Emerald:  #10B981    — natural, sustainable
Cyan:     #06B6D4    — tech, modern
Orange:   #F97316    — fun, casual
Pink:     #EC4899    — expressive
Lime:     #84CC16    — fresh, sporty
Indigo:   #6366F1    — deep, intellectual
Teal:     #14B8A6    — calm, balanced
Red:      #EF4444    — intense, competitive
```

Accent color applies to:
- Space tab active indicator
- Space header subtle tint (very subtle — `rgba(accent, 0.08)` on header bg)
- Buttons inside that space (primary button uses accent)
- Online indicator ring
- Link color within space

Accent does NOT replace gold globally. Gold stays the HIVE brand color. Accent is per-space personality.

---

## Typography

```
Display:     Clash Display — space names, hero text, landing page
Headings:    System sans (Inter / SF Pro) — section headers, page titles
Body:        System sans — 14px / 1.5 line height — messages, descriptions
Mono:        JetBrains Mono / SF Mono — timestamps, counts, metadata, code
Caption:     11px mono uppercase tracking-wider — section labels ("TOOLS", "EVENTS")
```

### Hierarchy Rules
- **One display font per screen.** Clash Display for the space name OR the page title, not both.
- **Mono for data.** Anything that's a number, a time, or a status uses mono. This creates a consistent "data feel" without being technical.
- **Body text is generous.** 14px minimum, 1.5 line height. Students read on phones in bad lighting.

---

## Layout Architecture

### Option A: Rail + Content (RECOMMENDED)

```
Desktop (≥1024px):
┌──────┬─────────────────────────────────────────┐
│ Rail │  Content Area                            │
│ 64px │  (max-width: 960px, centered)            │
│      │                                          │
│ ⬡    │                                          │
│ 🏠   │                                          │
│ 📦   │                                          │
│ ✨   │                                          │
│ 👤   │                                          │
│      │                                          │
│      │                                          │
│ 🔔   │                                          │
└──────┴─────────────────────────────────────────┘

Tablet (768-1023px):
Same as desktop but content goes full-width (no max-width cap)

Mobile (<768px):
┌─────────────────────────────┐
│  Top bar: [⬡ HIVE]    [🔍🔔]│
│                             │
│  Content Area               │
│  (full width, padded 16px)  │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│  🏠    📦    ✨    👤       │
│ Home Spaces Create  You     │
└─────────────────────────────┘
```

**Why a rail instead of a 200px sidebar?**

The current 200px sidebar wastes space. It shows 4 text labels and a Create button — that's 200px for content that fits in 64px of icons. A narrow rail (like Linear, Figma, Spotify) gives you:
- More room for content
- Icon-based nav is faster to scan
- Hover/tooltip shows label if needed
- Scales better — the rail can show space avatars below the main nav (recent spaces, like Discord's server rail)

**The rail anatomy:**
```
Top:     HIVE mark (⬡ gold hexagon)
         ─────
         Home icon
         Spaces icon
         Create icon (gold, slightly larger or different shape)
         You icon
         ─────
Middle:  Recent spaces (avatar circles, max 5)
         ─────
Bottom:  Notification bell (with badge)
```

This is a significant departure from the current 200px sidebar. It's a better pattern for HIVE because:
1. Content gets more room (especially on space pages where the space ALSO has a sidebar)
2. The rail can show recent spaces — quick switching without going to /spaces
3. Create button is always visible and prominent
4. Notification bell is always accessible

### Space Page Layout (inside the rail)

```
Desktop with rail:
┌──────┬──────────┬────────────────────────────┐
│ Rail │ Space    │  Main Content               │
│ 64px │ Sidebar  │  (Chat / Events / Posts)    │
│      │ 220px    │                              │
│      │          │                              │
│      │ Identity │                              │
│      │ Tools    │                              │
│      │ Events   │                              │
│      │ Members  │                              │
│      │          ├────────────────────────────┤
│      │          │ Chat Input                  │
└──────┴──────────┴────────────────────────────┘

Mobile (no rail, no space sidebar):
┌─────────────────────────────┐
│ [←] Space Name  [···] [🔍] │
│ [Chat] [Events] [Posts]     │
│                             │
│  Content                    │
│                             │
│                             │
├─────────────────────────────┤
│ Chat Input                  │
├─────────────────────────────┤
│  🏠    📦    ✨    👤       │
└─────────────────────────────┘
```

On mobile, the space page is fullscreen — global bottom nav stays, but the rail disappears. Back arrow returns to spaces list. Space sidebar becomes a sheet you pull up from a button or swipe.

### Other Pages (Spaces Hub, Create, Profile)

```
Desktop:
┌──────┬──────────────────────────────────────┐
│ Rail │  Page Content                         │
│ 64px │  (max-width: 720px for text-heavy,    │
│      │   960px for grid/card layouts)        │
│      │                                       │
└──────┴──────────────────────────────────────┘

Mobile:
┌─────────────────────────────┐
│  Top bar                    │
│  Page Content (full width)  │
│                             │
├─────────────────────────────┤
│  Bottom nav                 │
└─────────────────────────────┘
```

---

## Component Patterns

### Cards
Everything is a card on HIVE. Spaces, tools, events, posts. Cards have:
- `Surface-1` background (#111110)
- `Border` (white/0.06) — NOT rounded-2xl. Use rounded-xl (12px) max.
- Hover: border brightens to white/0.12, subtle y-translate (-1px)
- No shadows. Depth comes from border brightness, not shadow.
- Consistent internal padding: 16px

### Activity Pulse (inline stats)
Every card that represents a living thing (space, tool, event) shows activity:
```
┌────────────────────────────────────┐
│  ⬡ UB Computer Science Club       │
│  23 members · 5 online · 3 events │  ← activity pulse
│  Last active 2 min ago            │  ← recency signal
└────────────────────────────────────┘
```
- Mono font for numbers
- `text-white/50` for the stats line
- Green dot before online count
- This replaces separate analytics pages

### Buttons
```
Primary:    Gold bg (#FFD700), black text, rounded-full, 36px height
            Inside spaces: uses space accent color instead of gold
Secondary:  Transparent, white/50 text, border white/0.08, rounded-full
Ghost:      Transparent, white/50 text, no border, hover bg white/0.06
Danger:     Red/10 bg, red text
```
All buttons are rounded-full (pill shape). This is distinctively HIVE — not the usual rounded-lg rectangle.

### Inputs
```
Background: Surface-2 (#1A1A18)
Border:     white/0.06, focus: gold/0.50 (or accent/0.50 in spaces)
Text:       white/0.92
Placeholder: white/0.30
Height:     40px (standard), 48px (hero inputs like search, chat)
Radius:     rounded-xl (12px)
```

### Avatars
```
Sizes:    24px (inline/small), 32px (list items), 40px (cards), 64px (profile/space header)
Shape:    Circular for people, rounded-lg (8px) for spaces
Fallback: First letter on colored background (use a hash of the name to pick color)
Border:   1px white/0.06 always (prevents visual merging on dark bg)
Online:   Green ring (2px) on bottom-right for 32px+
```

### Skeletons (loading states)
```
Base:     Surface-1 (#111110)
Shimmer:  Subtle left-to-right gradient animation (white/0.04 → white/0.08 → white/0.04)
Shape:    Match the content they replace (rounded avatar, text lines, card shapes)
Duration: 1.5s loop
```
No spinners. Skeletons everywhere. They set expectations about what's coming.

### Empty States
```
Layout:   Centered, max-width 320px
Icon:     Relevant lucide icon, 48px, white/0.20
Headline: 16px semibold, white/0.70
Body:     14px, white/0.40, 1-2 sentences max
Action:   Primary button if there's something to do
```
Every empty state has a specific message and (when possible) an action. Never "No data" or "Nothing here."

### Notifications Bell
```
Position:  Bottom of rail (desktop), top-right of top bar (mobile)
Badge:     Gold dot (no number) for unread, positioned top-right of bell icon
Panel:     Slides in from right (desktop) or bottom sheet (mobile)
           Max 20 recent notifications, grouped by today/earlier
           Each item: icon + title + body preview + timestamp + unread dot
           Tap: navigates to relevant content, marks as read
           "Mark all read" link at top
```

---

## Motion

Keep what exists in the token system but add these principles:

1. **Fast.** Nothing over 200ms. Students are impatient.
2. **Purposeful.** Motion shows relationship (this came from there) or state (this is loading). Never decorative.
3. **Page transitions:** Crossfade only (opacity 0→1, 100ms). No slides between pages.
4. **Tab switches:** Instant content swap, underline slides to active tab (150ms).
5. **Cards:** Hover lifts (-1px y, border brightens). Click scales down slightly (0.98).
6. **Sheets/drawers:** Slide up from bottom (200ms, ease-out).
7. **Notifications:** Slide in from right (150ms).

---

## Page-by-Page Direction

### Landing Page (`/`)
Full-bleed, no app shell. This is marketing.
- Hero: "Your club is already here." + search bar to find your space by name
- Below: 3 value props with product screenshots (not illustrations)
- CTA: "Find Your Space" (gold button)
- Dark bg, gold accents, Clash Display for headlines
- Must load in <2s, no heavy animations

### Entry (`/enter`)
Centered card on void background. Minimal.
- Email input → "Continue" (gold button)
- Code input → auto-focuses, 6 digits, auto-submits
- New user: name field appears inline, smooth
- HIVE mark at top, no other chrome
- Error: red inline text, not toast

### Spaces Hub (`/spaces`)
Your spaces, sorted by life.
- Search bar at top (subtle, not hero)
- Space cards in a list (not grid — list is faster to scan on mobile)
- Each card: avatar + name + activity pulse + unread indicator
- Unread spaces float to top
- "Browse Spaces" section below your spaces (or separate sub-tab)
- Empty: "Join your first space" with recommendations

### Space Page (`/s/[handle]`)
Already detailed above in layout section. Key additions:
- Header shows avatar + name + online count + accent color tint
- Context bar: next event, pinned post, featured tool (compact, dismissible)
- Chat is default tab, events and posts are secondary
- Mobile: tabs are full-width, swipeable between tabs

### Create (`/lab`)
Prompt-first, not dashboard-first.
- Hero input: "What do you want to make?" (large, centered, gold focus ring)
- Below: quick-start chips (Poll, Signup, Countdown, etc.)
- Below that: "Your Creations" grid (if any exist)
- Templates at bottom
- The prompt IS the page. Everything else is secondary.
- When you type and hit enter → streaming creation flow takes over

### Profile (`/u/[handle]`)
The creation showcase.
- Top: avatar (64px) + name + handle + bio (editable if yours)
- "Creations" section: tool cards showing name, deploy count, last used
- "Spaces" section: space avatars in a horizontal scroll
- Stats line: "4 tools · 3 spaces · joined Jan 2026" (mono)
- Other people's profiles: same minus edit, plus "X mutual spaces"
- Minimal — this page should be scannable in 3 seconds

---

## What This Changes From Current

| Current | Proposed | Effort |
|---------|----------|--------|
| 200px sidebar nav | 64px icon rail | Medium — rebuild AppSidebar |
| 3-tab nav (Discover/Spaces/You) | 4-tab: Home/Spaces/Create/You | Small — update navigation.ts |
| No notification bell | Bell in rail + panel | Medium — new component |
| No global search | Cmd+K overlay | Medium — new component |
| Space header: name only | Avatar + name + online + accent tint | Small |
| No space accent colors | 12-color palette, leader picks | Small — DB field + UI |
| No activity pulse | Inline stats on all cards | Medium — fetch/display |
| Spinners for loading | Skeletons everywhere | Medium — replace across app |
| Generic buttons (rounded-lg) | Pill buttons (rounded-full) | Small — global CSS change |
| "HiveLab" branding | "Create" | Small — rename |
| Profile: basic | Profile: creation showcase | Medium — rebuild page |
| Discover page as home | Home as activity dashboard | Large — new API + page (LAST) |

---

## Open Questions for Jacob

1. **Rail vs current sidebar:** The rail is a bigger change but a better long-term pattern. Worth doing for V1 or keep the 200px sidebar and iterate later?

2. **Space accent colors in DB:** This needs a new field on spaces in Firebase. Trivial backend change but wanted to flag it.

3. **Clash Display font:** Currently used for space names. Should it be used for ALL page titles or just space names + landing page? More usage = more personality, but also more visual weight.

4. **Create tab icon:** What icon represents creation? Current codebase uses BeakerIcon for lab. Options: sparkles (✨), plus (+), wand, pencil, hexagon with plus. Sparkles feels right for "AI creates things for you."

5. **Recent spaces in rail:** Discord-style quick-switch to your most active spaces via avatar circles in the sidebar rail. Include this for V1 or skip?
