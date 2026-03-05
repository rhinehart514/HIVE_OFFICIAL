# HIVE Frontend Spec

> Living document. Decisions locked through collaborative ideation sessions.
> This is the source of truth for all UI/UX implementation.
> Status: IN PROGRESS — locked decisions below, more sessions needed.

---

## Platform

- **Primary:** Web-first, desktop PWA
- **NOT mobile-first** — mobile is an adaptation of desktop
- **Desktop model:** Discord energy (persistent rail + fluid main content)

---

## Aesthetic

- **Direction:** Dark + Expressive (Fizz attitude + Linear craft)
- **Philosophy:** Bold, opinionated, human-designed. Typography IS the design.

### Color

- **Background:** Black void `#000000`
- **Gold accent:** `#FFD700` at 5-8% of any screen
- **Gold used for:** Labels, accent lines, CTAs, active indicators, dots, engagement numbers above threshold
- **Gold NOT used for:** Body text, borders, large backgrounds
- **Text:** 2 tiers only — `text-white` (primary) + `text-white/50` (secondary)
- **Card backgrounds:** `#111111` on `#000000`
- **Subtle borders:** `rgba(255,255,255,0.05)` — only on cards

### Typography

- **Display:** Clash Display — 48-64px page titles, 24px card titles, 20px stat numbers
- **Body:** Geist (already in use)
- **Mono:** Geist Mono — labels, timestamps, metadata
- **Scale:** Big + aggressive. Typography is the primary visual element.

### Surfaces

- **Pure flat.** No texture, no grain, no glass, no blur (except overlays)
- **No gradients** on surfaces
- **No glow effects**

### Motion

- **Philosophy:** Instant + confident. Animation = latency.
- **All transitions:** 0-100ms
- **No decorative motion.** Period.
- **Exception 1:** Gold dot pulse — 3s cycle, aliveness indicator
- **Exception 2:** Card hover lift — 100ms `translateY(-2px)`, physical not decorative
- **All buttons:** Pills (`rounded-full`)

---

## Layout — Desktop

### 2-Column: Rail + Main

```
RAIL (64px)          MAIN (fluid)
┌──────────┐ ┌──────────────────────────┐
│           │ │                            │
│   [H]     │ │  [content changes based    │
│           │ │   on what's selected       │
│   ───     │ │   in the rail]             │
│           │ │                            │
│   [CS]    │ │                            │
│   [DM]    │ │                            │
│   [UB]    │ │                            │
│           │ │                            │
│   ───     │ │                            │
│   [+]     │ │                            │
│   [You]   │ │                            │
└──────────┘ └──────────────────────────┘
```

### Rail (64px fixed)

- `bg-black`, no border-right
- **Contents top to bottom:**
  - [H] Home icon (campus stream)
  - Separator line
  - Space icons — joined spaces, sorted by recent activity
  - Separator line
  - [+] Create button (gold)
  - [You] Profile/settings (bottom-pinned, like Discord)
- **Indicators on space icons:**
  - Gold dot = unread messages
  - Gold ring = active poll/event (something to interact with)
  - Number badge = unread count
  - No indicator = dormant
- **No hover-expand animation.** Fixed 64px always.
- **No channel list / middle column.** Spaces are single-stream.

---

## Layout — Mobile PWA

### Bottom Bar (4 items)

```
┌──────────────────────────────┐
│                                │
│   [main content area]          │
│                                │
├────────────────────────────────┤
│  Home    Spaces    [+]    You  │
└────────────────────────────────┘
```

- **Home** = campus stream (same as desktop [H])
- **Spaces** = space list view (rail icons don't work at mobile scale)
- **[+]** = creation (full-screen experience)
- **You** = profile
- Tapping a Space from list → full-screen stream, back button returns

---

## Navigation / Information Architecture

### 4 Items

| Item | Desktop | Mobile | Behavior |
|------|---------|--------|----------|
| **Home** | [H] icon in rail | Bottom bar tab | Campus-wide feed |
| **Spaces** | Space icons in rail | Bottom bar → list view | Your joined spaces |
| **[+] Create** | Gold button in rail | Bottom bar action | Opens creation surface |
| **You** | Bottom of rail | Bottom bar tab | Profile |

### Home vs Space

Home and Space are **different surfaces** with different purposes:

| | Home Feed | Space Stream |
|---|-----------|-------------|
| **Direction** | Newest at top (scroll down for older) | Newest at bottom (scroll up for older) |
| **Content** | Activity cards across campus | Chat messages + inline cards |
| **Energy** | Browse, discover, interact | Hang out, converse, create |
| **Purpose** | "What's happening?" | "I'm here with my people" |
| **Width** | Max 640px centered | Full width of main area |

Home is where you find things. Space is where you stay. Every feed card is a door into a Space.

### Discover

- NOT a primary nav item
- Accessed via search icon in rail or "Browse all spaces" link on Home
- Full browse/search experience for finding new spaces

---

## Surfaces

### Space Stream (Critical Surface)

The unified chat stream. No tabs. Messages and interactive cards interleave.

```
┌──────────────────────────────────────┐
│  CompSci Club              ⚙  12 ●   │
│  ─────────────────────────────────── │
│  [context bar: 1 urgent item]        │
│                                      │
│  ── Today ──                         │
│                                      │
│  Jake                        2:34 PM │
│  anyone going to hackathon?          │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  Poll · by Maria                  │
│  │  Best IDE for the project?        │
│  │  VS Code   ████████████░░  67%    │
│  │  24 votes · 3h left               │
│  └──────────────────────────────┘    │
│                                      │
│  ── Since you left ──                │
│                                      │
│  Alex                       11:02 AM │
│  just pushed the PR                  │
│                                      │
├──────────────────────────────────────┤
│  [/ type or create...]          [+]  │
└──────────────────────────────────────┘
```

- **Newest at bottom** (chat energy, not feed energy — like Discord/iMessage)
- **Interactive cards inline** — bordered container, compact, interact without leaving stream
- **Card types:** Polls (bars + votes), Events (time + location + RSVP), Brackets (matchups), Custom apps
- **"Since you left" divider** — aliveness/retention hook
- **Context bar** — below header, 1 line, most urgent item (poll ending soon OR upcoming event)
- **Input bar** — bottom-pinned
  - Plain text = chat message
  - `/` = slash commands (power user creation)
  - `+` button = opens full creation surface

### Home Feed

Interactive activity feed. Not a stream, not a dashboard — a scrollable feed of actionable cards.

```
RAIL    FEED
┌────┐ ┌──────────────────────────────────────────┐
│    │ │                                            │
│ H● │ │  HIVE                          🔍          │
│    │ │                                            │
│ ── │ │  ┌────────────────────────────────────┐   │
│    │ │  │  📊 Poll · CompSci Club              │   │
│ CS │ │  │  Best IDE for the project?           │   │
│ DM │ │  │  VS Code   ████████████░░░  67%     │   │
│ UB │ │  │  142 votes · 2h left                │   │
│    │ │  └────────────────────────────────────┘   │
│ ── │ │                                            │
│ +  │ │  ┌────────────────────────────────────┐   │
│ Me │ │  │  📅 Event · UB Dance Marathon        │   │
│    │ │  │  Spring Showcase · Sat 7PM           │   │
│    │ │  │  [Going]  [Maybe]       89 going    │   │
│    │ │  └────────────────────────────────────┘   │
│    │ │                                            │
│    │ │  ┌────────────────────────────────────┐   │
│    │ │  │  🏆 Bracket · UB Eats Club           │   │
│    │ │  │  Best Study Spots at UB              │   │
│    │ │  │  Lockwood vs Capen                   │   │
│    │ │  │  [Vote]        [Vote]               │   │
│    │ │  │  67 matchups · Round 2               │   │
│    │ │  └────────────────────────────────────┘   │
│    │ │                                            │
│    │ │  ┌────────────────────────────────────┐   │
│    │ │  │  🔥 CompSci Club                     │   │
│    │ │  │  12 active · 3 new apps today        │   │
│    │ │  │                          [Open →]   │   │
│    │ │  └────────────────────────────────────┘   │
│    │ │                                            │
└────┘ └──────────────────────────────────────────┘
```

**Card types in the feed:**

| Card Type | What It Shows | Action |
|-----------|--------------|--------|
| **Creation** | Poll/Bracket/RSVP/Custom with live state | Vote, play, RSVP — interact inline |
| **Event** | Time, location, headcount | RSVP inline |
| **Active Space** | Member count, recent activity summary | "Open" → enter stream |
| **Milestone** | "Best Study Spots hit 100 matchups" | Tap to engage |

**Feed behavior:**

- **Newest at top**, scroll down for older (feed energy, not chat energy)
- **Single column, max-width ~640px centered** in main content area
- **Every card shows Space breadcrumb** — tap to enter that Space
- **Every card is interactive** — vote, RSVP, open. No passive content.
- **No infinite scroll** — paginated or "Load more"
- **At launch:** chronological. **At scale:** algorithmic (highest engagement surfaces first)

**Why it works at 50 users:**

Feed pulls from structured data, not chat volume:
- Every creation = a card
- Every event = a card (50+ events/week pre-seeded from CampusLabs)
- Active spaces = cards
- Milestones = system-generated

The feed is always full because it's activity-driven, not message-driven.

### Space States

600+ spaces pre-seeded from CampusLabs. At launch, ~95% unclaimed. Each state has ONE job.

#### Unclaimed — "Convert browser to claimer"

Purpose-built landing page. NOT an empty stream.

```
┌──────────────────────────────────────────┐
│                                            │
│  CompSci Club                              │
│  Computer Science · UB                     │
│  8 students joined · No leader yet         │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │   This space is waiting            │   │
│  │   for its leader.                  │   │
│  │                                    │   │
│  │   Claim it. Create a poll, event,  │   │
│  │   or bracket. 8 members see it     │   │
│  │   instantly.                       │   │
│  │                                    │   │
│  │        [Claim this space ●]        │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ── One sentence away ──                   │
│                                            │
│  "Best professor?"    → Poll in 10 sec     │
│  "Meeting Thursday"   → RSVP in 10 sec     │
│  "Rank our projects"  → Bracket in 10 sec  │
│                                            │
│  ── Members waiting ──                     │
│                                            │
│  [avatar] [avatar] [avatar] +5             │
│                                            │
│  Not the leader?                           │
│  [Join anyway]  [Send to your leader →]    │
│                                            │
└──────────────────────────────────────────┘
```

- Members CAN join unclaimed spaces (creates demand for leader)
- "Send to your leader" = viral link to recruit the actual org leader
- Example prompts show what's possible (value prop in action)
- Social proof: "8 students joined" with avatar stack
- No empty stream visible — purpose-built conversion page

#### Claimed (Quiet) — "Nudge leader to create"

Stream exists but is sparse. Different views for leader vs member.

**Leader sees contextual nudge (in-stream, not banner):**

```
│                                            │
│    ┌──────────────────────────────────┐   │
│    │  Your space is live. 15 members.  │   │
│    │                                   │   │
│    │  Try: "What should we do for      │   │
│    │  our next event?"                 │   │
│    │                                   │   │
│    │  [Create something ●]             │   │
│    └──────────────────────────────────┘   │
│                                            │
```

- Nudge sits where messages would be — feels native, not intrusive
- Suggested prompt is contextual (AI-generated based on club type)
- Disappears after leader has 3+ creations
- Input bar + creation button still visible at bottom

**Member sees acknowledgment:**

```
│                                            │
│         This space is just getting         │
│         started. Jump in.                  │
│                                            │
```

- One line, not a big empty state
- Implicit invitation to chat or interact with whatever exists

#### Active — Full experience

The complete stream as designed: messages + inline interactive cards, context bar, "since you left" divider, input bar with slash commands. No special states needed.

#### State Progression

```
UNCLAIMED           CLAIMED (QUIET)         ACTIVE
"Waiting for        "Just getting           "This is where
 a leader"           started"                things happen"

 [Claim ●]     →    [Create ●]         →   [stream flowing]

 Members can        Leader gets             Full experience
 join + wait        nudges to create
```

No setup wizards. No configuration flows. Claim → stream → nudge → create → engage → active.

---

### Creation Surface (HiveLab)

Chat + live preview. Like Claude artifacts / v0 / ChatGPT canvas.

```
RAIL    CREATION CHAT              LIVE PREVIEW
┌────┐ ┌───────────────────┐ ┌──────────────────────┐
│    │ │                     │ │                        │
│    │ │  HIVE               │ │  [live preview of      │
│    │ │  What do you want   │ │   app being built]     │
│    │ │  to make?           │ │                        │
│    │ │                     │ │                        │
│    │ │  You                │ │  Placing in:           │
│    │ │  rank the best      │ │  CompSci Club (change) │
│    │ │  study spots        │ │                        │
│    │ │                     │ │       [Deploy ●]       │
│    │ ├─────────────────────┤ │                        │
│    │ │ [message...]        │ │                        │
└────┘ └─────────────────────┘ └────────────────────────┘
```

- **Left:** Conversational AI chat — talk to HIVE, it builds
- **Right:** Live preview of the app being created
- **AI behavior adapts:**
  - Simple intent → one turn, instant preview, deploy button (sub-3s for shells)
  - Vague intent → AI asks clarifying questions
  - Complex/novel → full conversation, code-gen streams (15-30s)
- **Format chips:** Poll / Bracket / RSVP / Custom — quick-start shortcuts
- **Space context:** Pre-fills target Space if opened from within a Space
- **After deploy:** Returns to Space stream, card appears live, no success screen
- **Slash commands** in Space chat input still exist as power-user fast path

### Profile

Bento grid portfolio. The "see impact → create again" surface.

```
┌──────────────────────────────────────────┐
│                                            │
│    Name                                    │
│    @handle              142 total eng.     │
│                                            │
│  ┌───────────────────┐  ┌──────────┐      │
│  │                   │  │  Study   │      │
│  │  Best Dining      │  │  Spots   │      │
│  │  Hall?            │  │  Bracket │      │
│  │  ██████████░ 67%  │  │  67      │      │
│  │  142 votes        │  ├──────────┤      │
│  │                   │  │  Sat     │      │
│  └───────────────────┘  │  Meetup  │      │
│                         │  23 going│      │
│  ┌──────────┐ ┌──────┐ └──────────┘      │
│  │  Bingo   │ │ Rate │                    │
│  │  89 plays│ │ 34   │                    │
│  └──────────┘ └──────┘                    │
│                                            │
│  ── Spaces ──                              │
│  CompSci Club · UB Dance · Debate          │
│                                            │
│  ── Connections ──                         │
│  [ghost avatars] Coming this month.        │
│                                            │
│          [Build your next app →]           │
│                                            │
└──────────────────────────────────────────┘
```

- **Bento grid** — featured tile (2x2) for highest-engagement creation + standard tiles (1x1)
- **Live mini-previews** on each card — actual app UI rendered small (poll bars, bracket matchups, etc.)
- **Engagement numbers:** BIG, Clash Display, gold if above threshold
- **Grid:** 3 columns desktop, 2 tablet, 1 mobile (swipeable carousel)
- **Card hover:** Subtle lift — 100ms `translateY(-2px)`
- **Spaces:** Text list, name + member count
- **Connections:** Ghost avatar circles + "Coming this month" (social tease)
- **Own profile:** Gold pill CTA "Build your next app" (loop closure)
- **Other profiles:** Same layout, no CTA. The "I could do that" moment.

---

## Anticipatory UX (Social Feature Teasing)

**Philosophy:** Tease the social layer, not individual features. "People are here, you'll be more connected soon."

**Max 3 teases per screen. Never more.**

| Placement | What | Purpose |
|-----------|------|---------|
| **Profile** | Connections section — ghost avatar circles + "Coming this month" | Tease follow/friend graph |
| **Space header** | Avatar stack showing who's here (real data: online members) | Scaffold for richer presence (typing indicators, "creating..." status) |
| **Chat messages** | Faint `+` on hover → grayed reaction emoji bar + "Reactions coming soon" | Plant seed for social interaction layer |

**NOT doing:**
- Coming soon pages or modals
- Locked nav items that go nowhere
- Countdown timers or waitlist energy inside the product
- Banners or toast notifications about upcoming features

---

## Onboarding

### Philosophy

- **Chips, not forms.** No typing during onboarding. Every input is a tap.
- **No tutorials.** The product teaches itself through the feed and space states.
- **Progressive profiling.** Collect minimum upfront, learn more over time.
- **Three user paths** with different speeds to value.

### Data Collected at Sign-Up

| Data Point | Input | Why |
|-----------|-------|-----|
| **Year** | 5 chips: Fr / So / Jr / Sr / Grad | Freshman vs senior = different needs. Future social matching. |
| **Major/College** | ~8 chips: CS / Biz / Eng / Arts / Pre-Med / Science / Nursing / Other | Personalizes space recommendations. AI creation context. |
| **Housing** | 4 chips: Ellicott / Governors / South / Off campus | Dorm-specific spaces. Location context. "45 in Ellicott are on HIVE." |

Three taps. Five seconds. No typing.

### Flow

```
STEP 1: AUTH               STEP 2: YOU                    STEP 3: YOUR PEOPLE
┌──────────────────┐      ┌──────────────────────┐      ┌──────────────────────────┐
│                    │      │                        │      │                            │
│      HIVE          │      │  Tell us about you.    │      │  Spaces for you.           │
│                    │      │                        │      │                            │
│  Say something.    │      │  What year?            │      │  ── Based on CS + Soph ──  │
│  Your campus       │      │  [Fr] [So] [Jr] [Sr]  │      │                            │
│  responds.         │      │                        │      │  CompSci Club      45 [+]  │
│                    │      │  What's your thing?    │      │  ACM Chapter       32 [+]  │
│  [Google]          │      │  [CS] [Biz] [Eng]     │      │  HackUB            28 [+]  │
│  [Email]           │      │  [Arts] [Pre-Med]     │      │                            │
│                    │      │                        │      │  ── Popular at UB ──       │
│  .edu required     │      │  Where do you live?    │      │  UB Dance         120 [+]  │
│                    │      │  [Ellicott] [Gov]      │      │  UB Eats Club      89 [+]  │
│                    │      │  [South] [Off campus]  │      │                            │
│                    │      │                        │      │  650+ spaces                │
│                    │      │        [Continue →]    │      │  [Skip]        [Done →]    │
└──────────────────┘      └──────────────────────┘      └──────────────────────────┘
```

**Step 3 is personalized** based on Step 2 data — CS students see CS spaces first.

### Three User Paths

| User | Steps | Time to Value |
|------|-------|---------------|
| **Leader** | Auth → Profile chips → Find club → Claim → Create first app | ~2 min |
| **Curious student** | Auth → Profile chips → Join spaces → Feed → interact | ~1 min |
| **Invited member** | Tap link → Vote/RSVP (no auth) → sign up later | ~10 sec |

**Leader divergence:** If a user claims a space (instead of joining), they go directly to the creation surface: "CompSci Club is yours. 45 members are waiting. What's the first thing you want to ask them?" Sign-up to first live creation in under 2 minutes.

**Invited member:** No auth required to vote/RSVP on standalone URLs. "Made with HIVE" footer + "Create your own" CTA converts them later.

### What We DON'T Do at Onboarding

- No avatar upload (Google avatar works)
- No bio or username
- No tutorial or walkthrough
- No interest picker beyond major
- No notification permission prompt (ask later at moment of relevance)

### Progressive Profiling (Post-Onboarding)

**Automatic (from behavior):**
- Active spaces → interest signal
- Creation patterns → creator vs consumer
- Voting patterns → engagement preferences
- Activity times → when they're online

**Manual (one field at a time, at moments of relevance):**

| Moment | Ask | Why It Converts |
|--------|-----|-----------------|
| After first creation | "Add a profile photo?" | Creator identity — they just made something public |
| After joining 3+ spaces | "Write a one-line bio?" | Social identity — they're invested |
| After 1 week | "Pick a handle? (@name)" | Identity — if they haven't set one |

### Notification Permission (Moment of Relevance)

Never during onboarding. Ask when they have a reason to want notifications:

| Moment | Ask | Why It Converts |
|--------|-----|-----------------|
| After first creation | "Know when people interact?" | They want to see if their thing works |
| After RSVP | "Remind you about Saturday?" | They committed, reminder is useful |
| After joining 3 spaces | "Updates from your spaces?" | They're invested, want to stay connected |

---

## Landing Page

Pre-auth experience at hive.app.

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│  HIVE                                    [Sign in →]       │
│                                                            │
│                                                            │
│          Say something.                                    │
│          Your campus responds.                             │
│                                                            │
│          ┌────────────────────────────────────┐           │
│          │  "rank the best study spots"       │           │
│          └────────────────────────────────────┘           │
│                                                            │
│          ┌──────────────────────────────────┐             │
│          │  🏆 Best Study Spots at UB        │             │
│          │  Lockwood vs Capen               │             │
│          │  [Vote]        [Vote]            │             │
│          │  67 matchups · CompSci Club       │             │
│          └──────────────────────────────────┘             │
│                                                            │
│          One sentence. Your campus uses it.                │
│                                                            │
│          [Get started →]                                   │
│                                                            │
│  ─────────────────────────────────────────────            │
│                                                            │
│  650+ spaces at UB        142 votes today                  │
│  50+ events this week     "best thing on campus" — @jake   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

- **Show the product, don't describe it.** Hero is input sentence → output app. No marketing speak.
- **One live example** — real creation with real engagement numbers
- **Social proof bar** — space count, engagement, student quote
- **Two CTAs:** "Sign in" (top-right, returning), "Get started" (hero, new)
- **No video, no animation, no carousel.** The example card IS the demo.
- **Same dark aesthetic as the app** — no jarring transition after sign-in

---

## Search

- **Desktop:** Search icon in rail → overlay in main content area
- **Mobile:** Search icon in header → full-screen search

**What it searches:** Spaces, Creations, People, Events

**Behavior:**
- Instant results as you type (debounced 200ms)
- Categorized: spaces first, then creations, people, events
- Recent searches shown before typing
- No separate search page — results in overlay/dropdown
- Empty state: "Search 650+ spaces, apps, and people at UB"

---

## Notifications

**What gets notified:**

| Event | Who | Channel |
|-------|-----|---------|
| Interaction with your creation | Creator | Push + in-app |
| New creation in your space | Members | In-app only |
| Event reminder (1hr before) | RSVPed users | Push |
| Space join | Leader | In-app only |
| Milestone ("50 votes!") | Creator | Push + in-app |

**In-app:** Bell icon in rail (desktop) / header (mobile) → notification panel
**Push format:** "Your poll 'Best Dining Hall' hit 100 votes · CompSci Club · 2 min ago"

---

## Error & Loading States

**Errors:** Honest and helpful. No "Oops!" No sad robot illustrations.
- Page not found → "This page doesn't exist." + [Go home]
- Network error → top banner: "You're offline. Reconnecting..."
- Creation failed → inline: "That didn't work. Try again."
- Empty feed → "Nothing here yet. Join spaces to see activity." + [Browse spaces]

**Loading:** Skeleton screens only. No spinners.
- Feed: gray card-shaped rectangles
- Stream: gray message-shaped lines
- Creation preview: "Building..." with subtle text pulse

---

## Mobile PWA

### Layout Adaptation

| Desktop | Mobile |
|---------|--------|
| Rail (64px) + Main (fluid) | Full-width + Bottom bar (56px) |
| Feed: 640px centered | Full-width, 16px padding |
| Space stream: full main | Full-width |
| Creation: chat + preview side by side | Full-screen, swipe between |
| Profile: 3-col bento | 1-col, swipeable carousel |

### Gestures
- Swipe right on stream → back to spaces list
- Pull-to-refresh on feed
- No swipe between tabs (tap only)

### PWA Manifest
- `display: standalone`, `theme_color: #000`, `background_color: #000`

---

## Accessibility

- **Contrast:** Gold on black = 12.8:1. White on black = 21:1. white/50 on black = ~8.5:1. All pass WCAG AA.
- **Keyboard:** All elements focusable. Focus ring: 2px `accent-gold` outline.
- **Screen readers:** All icons have `aria-label`. Interactive cards have `role="article"`.
- **Reduced motion:** Respect `prefers-reduced-motion`. Disable hover lift and gold pulse.
- **Min font:** 11px (labels), 14px (body).

---

## Related Documents

- **Component Storybook:** `docs/design-system/COMPONENT-SPEC.md` — every component defined with exact styles, props, and size limits
- **UI Generation Rules:** `.claude/rules/ui-generation.md` — 56 hard constraints for Claude Code to prevent AI slop
- **Design System (legacy):** `docs/design-system/DESIGN-2026.md` — superseded by this spec + COMPONENT-SPEC

---

## Decision Log

- [x] Aesthetic — Dark + Expressive, black/gold, Clash Display big, pure flat
- [x] Motion — Instant + confident, 0-100ms, 2 exceptions only
- [x] Platform — Web-first desktop PWA
- [x] Layout — Discord 2-column (64px rail + fluid main), mobile bottom bar
- [x] Navigation — 4 items (Home, Spaces, [+], You), Home = feed, Space = stream
- [x] Home/Feed — Interactive activity cards, 640px centered, newest-at-top
- [x] Space Stream — Chat + inline cards, newest-at-bottom, context bar, "since you left"
- [x] Space States — Unclaimed (conversion landing), Claimed (leader nudge), Active (full stream)
- [x] Creation Surface — Chat + live preview, AI one-turn-smart, format chips
- [x] Profile — Bento grid portfolio, live mini-previews, engagement numbers
- [x] Onboarding — 3 steps (auth → chips → personalized spaces), progressive profiling
- [x] Anticipatory UX — 3 surgical social teases, ghost avatars, reaction tease
- [x] Landing Page — Show the product, input→output hero, social proof
- [x] Typography Scale — Clash Display / Geist / Geist Mono, 3 opacity tiers
- [x] Spacing System — 4px grid, defined tokens
- [x] Color Tokens — 14 tokens, black/white/gold + status only
- [x] Component System — ~20 primitives, ~40 total components, kill list defined
- [x] Mobile PWA — Bottom bar, gestures, manifest
- [x] Search — Overlay, instant results, categorized
- [x] Notifications — Moment-of-relevance permission, push + in-app
- [x] Error/Loading States — Honest errors, skeleton loaders, no spinners
- [x] Accessibility — WCAG AA, keyboard nav, reduced motion, min font sizes
- [x] Anti-Slop Rules — 56 hard constraints in .claude/rules/ui-generation.md
