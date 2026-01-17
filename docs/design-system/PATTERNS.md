# HIVE PATTERNS

## Level 7: Complete User Experiences

*Last updated: January 2026*

---

## WHAT THIS DOCUMENT IS

Patterns are complete user experiences composed from primitives and components. They define how users accomplish specific goals within HIVE.

```
WORLDVIEW (what we believe)        <- docs/WORLDVIEW.md
    |
PHILOSOPHY (how it feels)          <- docs/PHILOSOPHY.md
    |
PRINCIPLES (rules that guide)      <- docs/PRINCIPLES.md
    |
LANGUAGE (visual vocabulary)       <- docs/LANGUAGE.md
    |
SYSTEMS (composition rules)        <- docs/SYSTEMS.md
    |
PRIMITIVES (building blocks)       <- docs/PRIMITIVES.md
    |
COMPONENTS (functional units)      <- docs/COMPONENTS.md
    |
PATTERNS (user experiences)        <- THIS DOCUMENT
    |
TEMPLATES (page layouts)
    |
INSTANCES (final pages)
```

---

## PATTERN ARCHITECTURE

### Macro-Pattern Structure

Each pattern contains:
- **Purpose**: What user goal does this accomplish?
- **Upstream Alignment**: How does this express philosophy/principles?
- **Micro-Patterns**: Component sequences that compose the experience
- **States**: Every possible state the pattern can be in
- **Decisions**: Confirmed design decisions with rationale

### The 8 Core Patterns

| Pattern | Purpose | Status |
|---------|---------|--------|
| **Space Participation** | Real-time community engagement | COMPLETE |
| **Gate & Onboarding** | First impression through verification | COMPLETE |
| **Discovery & Joining** | Finding and joining spaces | COMPLETE |
| **Command & Search** | Navigation and action | COMPLETE |
| **Profile & Identity** | Self-expression and connections | COMPLETE |
| **Tool Building** | Creating with HiveLab | COMPLETE |
| **Event Flow** | Creating and attending events | COMPLETE |
| **Connection Building** | Following and friending | COMPLETE |

---

# PATTERN 1: SPACE PARTICIPATION

## Purpose
Enable authentic, real-time community engagement in the "2am room" - where pretense drops and real connection happens.

## Upstream Alignment

| Principle | Expression |
|-----------|------------|
| 2am Energy | Warm, intimate, no pressure |
| Organized Chaos | Multiple threads, each trackable |
| Presence Without Pressure | See who's here, not surveillance |
| Gold = Activity | Presence dots, heated discussions |

## Micro-Patterns

### 1. Message Flow
How messages appear, group, and scroll

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Full row (Discord/Slack) | Natural reading flow |
| Scroll | Smart scroll (iMessage) | Stay pinned unless intentional scroll |
| Grouping | Author + time threshold | 2 min same author = group |
| History | Cursor pagination + skeleton | Smooth infinite scroll |

### 2. Interaction Layer
How users interact with messages

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hover actions | Apple-style context menu | Clean, no floating UI clutter |
| Reactions | Emoji picker + quick bar | Balance speed and expression |
| Reply | Thread drawer (side panel) | Keep main flow clean |
| Mention | Inline autocomplete | Natural typing flow |

### 3. Presence System
How users sense others in the space

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Typing | Wave animation | Ambient, not urgent |
| Multiple typing | Gold + "X others" at 3+ | Signals heated discussion |
| Online status | Gold dot | HIVE signature |
| Read receipts | None | No pressure, per philosophy |

### 4. Threading Model
How conversations branch

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Thread trigger | Reply action only | Intentional branching |
| Thread display | Side drawer | Keep main context |
| Thread notification | Subtle indicator | Not aggressive |

## States

| State | Visual Treatment |
|-------|------------------|
| Empty | Warm empty state, "Start the conversation" |
| Loading | Skeleton messages with pulse |
| Active | Full message display |
| Typing | Wave indicator bottom |
| Heated (3+) | Gold typing, increased warmth |
| Error | Inline retry, friendly copy |
| Offline | Queued indicator, auto-retry |

## Components Used
See `docs/COMPONENTS.md` - Space Participation Component Specifications

---

# PATTERN 2: GATE & ONBOARDING

## Purpose
Transform a curious visitor into a verified, activated HIVE member through the inside/outside boundary that makes HIVE valuable.

## Upstream Alignment

| Source | Principle | Expression |
|--------|-----------|------------|
| PHILOSOPHY | The Gate | .edu is the key, velvet rope aesthetic |
| PHILOSOPHY | The Monster | Outsiders see but can't enter |
| PHILOSOPHY | 2am Energy | No performance required, be weird |
| PRINCIPLES | Suggest Over Demand | Invitations, not requirements |
| PRINCIPLES | Never Dark Patterns | No gamified urgency |
| PRINCIPLES | The Velvet Rope | Scarcity creates value |

**Critical Boundary:**
> "Students share authentically because outsiders can't see. The gate creates safety."

This means: Non-.edu users can see artifacts (tools) but NEVER community content (spaces, profiles, messages).

---

## MACRO-STRUCTURE

```
LANDING (First Impression)
    |
    v
PREVIEW (Optional Tool Exploration)
    |
    v
GATE (Email + Verification)
    |
    v
ONBOARDING (Identity + Interests + Connection)
    |
    v
ACTIVATED (Inside the Living Campus)
```

---

## MICRO-PATTERN 1: LANDING

### Purpose
Show the monster. Create desire. Lead to the gate.

### Architecture: Product-Forward + Preview Access

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hero approach | Product showcase | Shows WHAT you get (HiveLab + Spaces) |
| Activity display | Activity Constellation | Abstract building viz, no people exposed |
| Social proof | Founding Class frame | "Early builders" not "400 spaces" |
| Preview access | HiveLab Sandbox + Tool Playground | "Play with artifacts" per philosophy |
| CTA primary | "Get Started" (gold) | Clear entry point |

### Activity Constellation Specification

Abstract visualization showing platform building activity without exposing individuals.

**Node Types:**

| Type | Visual | What It Represents |
|------|--------|-------------------|
| Creation | Burst animation | New tool deployed |
| Connection | Line drawing | Tool added to space |
| Space | Soft pulse | Active space |
| Activity | Ripple | High engagement |
| Growth | Expand animation | New member |

**Clustering:** Organic (category-based gravity) with hover reveal

**Animation Timing:**
- Ambient drift: 20s cycle
- New node appearance: 300ms ease-out
- Hover reveal: 150ms
- Pulse interval: 3s for active spaces

**Interaction:**
- Hover node: Tooltip with anonymized stat ("12 tools deployed today")
- Click node: Navigate to relevant discovery section
- No exposed usernames, space names, or identifiable content

**Cold Start:** Minimum 10 nodes, supplement with Founding Class integration

### Founding Class Frame

For pre-launch / cold start, emphasize early builder status:

```
"The first builders are shaping what comes next"
┌─────────────────────────────────────────┐
│  🛠️ 47 tools deployed this week        │
│  🎯 12 spaces actively building         │
│  ⚡ Join the founding class             │
└─────────────────────────────────────────┘
```

This is qualitative proof, not vanity metrics. "Founding class" creates scarcity without lying about scale.

### Preview Access Model

**HiveLab Sandbox:**
- Full tool builder with sample data
- Can create, cannot deploy
- Persistent across sessions (localStorage)
- Clear "Deploy requires .edu" messaging

**Tool Playground:**
- Explore deployed tools in demo mode
- Sample tools from different categories
- Shows infrastructure capability
- No community interaction

**What Preview Does NOT Include:**
- Space access (even read-only) - VIOLATES UPSTREAM
- Bot interaction or fake social - VIOLATES UPSTREAM
- Any user profiles or presence
- Chat or messaging of any kind

### Mobile Landing

| Adaptation | Approach |
|------------|----------|
| Activity Constellation | Simplified 2D with fewer nodes |
| Product preview | Carousel, not split |
| Preview access | HiveLab only (Tool Playground on tablet+) |
| Stats | Stack vertically |

---

## MICRO-PATTERN 2: GATE

### Purpose
Verify .edu status cleanly and create the moment of crossing the threshold.

### Flow

```
Email Input → OTP Sent → OTP Entry → Verified → Onboarding
```

### Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Code format | 6-digit numeric | Standard, accessible |
| Code delivery | Email only | .edu verification purpose |
| Expiry | 10 minutes | Generous without security risk |
| Resend | 60s cooldown | Prevent spam |
| Error handling | Inline, friendly | Never punishing |

### School Not Supported Flow

When .edu domain isn't recognized:

```
┌─────────────────────────────────────────┐
│  Your school isn't on HIVE yet          │
│                                         │
│  We're expanding campus by campus.      │
│  Join the waitlist and we'll let you    │
│  know when [school name] is added.      │
│                                         │
│  [Join Waitlist]  [Try Different Email] │
└─────────────────────────────────────────┘
```

Captures email for expansion, doesn't reject.

### Non-.edu Attempt Flow

When someone tries personal email:

```
┌─────────────────────────────────────────┐
│  HIVE is for students                   │
│                                         │
│  Use your .edu email to join.           │
│  If you're not a student, you can       │
│  still explore what's being built.      │
│                                         │
│  [Try .edu Email]  [Explore HiveLab]    │
└─────────────────────────────────────────┘
```

Directs to preview, maintains boundary.

### Visual Treatment

| State | Visual |
|-------|--------|
| Input ready | Subtle border, placeholder text |
| Input focus | White focus ring (never gold) |
| Code sent | Success message, input appears |
| Code invalid | Red text, clear retry |
| Verified | Gold checkmark, transition to onboarding |

---

## MICRO-PATTERN 3: ONBOARDING

### Purpose
Capture minimal identity and connect user to their first space within 120 seconds.

### Architecture: Split by User Type

```
Verified User
    |
    v
User Type Selection
    |
    +---> PARTICIPANT PATH (80%)
    |         |
    |         v
    |     Quick Profile (name, photo optional)
    |         |
    |         v
    |     Interest Cloud (tag selection)
    |         |
    |         v
    |     Space Recommendations
    |         |
    |         v
    |     Join First Space → ACTIVATED
    |
    +---> LEADER PATH (20%)
              |
              v
          Quick Profile (name, photo)
              |
              v
          Space Claim/Create
              |
              v
          Verification (automated tiers)
              |
              v
          Leader Dashboard → ACTIVATED
```

### Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Handle | Auto-generated, changeable in 60 days | Moderation control |
| Photo | Optional for participants, required for leaders | Identity balance |
| Interests | Tag cloud selection | Visual, fast, engaging |
| Space join | Recommended by leader activity | Active > large |
| Leader verify | Automated tiers, 5% manual | Scalable |

### Interest Tag Cloud

| Category | Example Tags |
|----------|-------------|
| Academic | CS, Engineering, Biology, Business, Arts |
| Social | Greek Life, Sports, Gaming, Music |
| Career | Startups, Research, Internships |
| Lifestyle | Fitness, Food, Photography |

Selection triggers space recommendations weighted toward:
1. Matching interests
2. Active leaders present
3. Recent activity
4. Appropriate size (not empty, not huge)

### Leader Verification Tiers

**Tier 1: Instant (0 admin burden)**
- Self-claim with accountability agreement
- "I confirm I'm authorized to manage [Space]"
- Logged for audit, reversible if fraudulent

**Tier 2: Automated (0 admin burden, ~95% of claims)**

| Method | Coverage | How It Works |
|--------|----------|--------------|
| CampusLabs Match | ~60% | Data shows them as org officer |
| Existing Leader Vouch | ~20% | Current verified leader confirms |
| Org Email | ~15% | exec@[org].com verification |

**Tier 3: Manual Review (5% only)**
- Fallback for edge cases
- Async (24-48h response time)
- Admin queue with context

### Handle Generation

Format: `@FirstL` or `@FirstL123` if taken

- Auto-assigned at verification
- Changeable once after 60 days
- Reserved list for moderation
- Cannot impersonate (no @UBPresident, etc.)

---

## MICRO-PATTERN 4: COMPLETION

### Purpose
Successful transition into the Living Campus.

### Participant Completion

```
┌─────────────────────────────────────────┐
│  Welcome to HIVE                        │
│                                         │
│  You're in. [First Space] is waiting.   │
│                                         │
│        [Enter Your Space]               │
│                                         │
│  (Subtle gold pulse on button)          │
└─────────────────────────────────────────┘
```

Direct to space, not dashboard. Immediate value.

### Leader Completion

```
┌─────────────────────────────────────────┐
│  [Space Name] is yours                  │
│                                         │
│  Your space is ready. Let's make it     │
│  feel like home.                        │
│                                         │
│        [Set Up Your Space]              │
│                                         │
│  (Leads to leader onboarding flow)      │
└─────────────────────────────────────────┘
```

Leader-specific setup wizard follows.

---

## STATES

### Landing States

| State | Treatment |
|-------|-----------|
| First visit | Full experience |
| Return visitor (not signed up) | "Welcome back" + resume CTA |
| Return visitor (signed in) | Redirect to spaces |
| Mobile | Adapted layout |
| Slow connection | Progressive loading |

### Gate States

| State | Treatment |
|-------|-----------|
| Email input | Clean form |
| Sending code | Loading state on button |
| Code sent | Success + OTP input |
| Code expired | Clear message + resend |
| Too many attempts | Cooldown message |
| Wrong code | Inline error |
| Verified | Gold celebration, transition |

### Onboarding States

| State | Treatment |
|-------|-----------|
| User type selection | Two clear paths |
| Profile step | Progressive form |
| Interests step | Tag cloud with minimums |
| Space recommendations | Loading → cards |
| Joining space | Progress indicator |
| Complete | Celebration, redirect |

### Error States

| Error | Treatment |
|-------|-----------|
| Network failure | "Connection lost" + retry |
| Server error | "Something went wrong" + retry |
| Invalid email format | Inline validation |
| Code expired | Clear message + resend option |
| Space join failed | Retry + alternative spaces |

---

## KEYBOARD SUPPORT

| Context | Keys |
|---------|------|
| Email input | Enter to submit |
| OTP input | Auto-advance on digit, backspace to previous |
| Tag cloud | Tab to navigate, Space to select |
| Space cards | Arrow keys, Enter to join |
| Throughout | Escape to go back |

---

## ANIMATION TIMELINE

### Landing Load
```
0ms     - Page shell
100ms   - Hero text fade in
200ms   - Product preview slide up
300ms   - Activity Constellation begins
400ms   - Stats row fade in
500ms   - CTA pulse begins
```

### Gate Transition
```
0ms     - Modal appears (scale from 0.95)
150ms   - Content fades in
300ms   - Input focus
```

### Verification Success
```
0ms     - Gold checkmark appears
150ms   - Pulse animation
300ms   - Transition begins
400ms   - Onboarding slides in
```

### Onboarding Progress
```
Step transition: 300ms slide
Tag selection: 150ms opacity
Space card hover: 150ms brightness (no lift)
Completion: 400ms celebration
```

---

## COMPONENTS REQUIRED

| Component | Purpose |
|-----------|---------|
| LandingHero | Hero section with product preview |
| ActivityConstellation | Abstract activity visualization |
| FoundingClassBanner | Cold start social proof |
| HiveLabSandbox | Preview tool builder |
| ToolPlayground | Preview deployed tools |
| GateModal | Email + OTP flow container |
| EmailInput | .edu email input with validation |
| OTPInput | 6-digit code input |
| SchoolNotSupported | Waitlist capture |
| UserTypeSelector | Participant vs Leader choice |
| QuickProfileForm | Name, photo, handle display |
| InterestTagCloud | Visual interest selection |
| SpaceRecommendationCard | Space preview with join CTA |
| LeaderClaimFlow | Space claim/create wizard |
| VerificationProgress | Leader verification status |
| OnboardingComplete | Celebration and redirect |

See next section for full component specifications.

---

# PATTERN 3: DISCOVERY & JOINING

## Purpose
Enable students to find their people organically - the spaces where they belong, without algorithmic manipulation or overwhelming choice.

## Upstream Alignment

| Source | Principle | Expression |
|--------|-----------|------------|
| PHILOSOPHY | Discovery Without Overwhelm | Find people organically, no algorithm manipulation |
| PHILOSOPHY | 2am Energy | Finding your people, not performing |
| PRINCIPLES | Show The Happening | Activity visible, life attracts life |
| PRINCIPLES | Organized Chaos | Structure enables exploration |
| PRINCIPLES | Reveal Over Dump | Progressive disclosure |
| PRINCIPLES | Warmth Through Activity | Denser = warmer, active spaces glow |

**Core insight:**
> "Natural gravity toward affinity. Spaces that feel right for you."

---

## SPACE CATEGORIES

HIVE spaces are categorized by WHO runs them, not WHAT they're about:

| Category | Volume | Nature |
|----------|--------|--------|
| **Student Org** | 400+ | Clubs, organizations, interest groups |
| **Uni** | ~10-20 | Institutional (departments, services) |
| **Residential** | ~20-30 | Dorms, housing communities |
| **Greek** | ~30-50 | Fraternities, sororities |

**Design Implication:** Categories are filters, not territories. Interest tags (CS, Music, Sports) are the primary discovery mechanism.

---

## MACRO-STRUCTURE

```
BROWSE (Grid Exploration)
    |
    v
SEARCH (Intent-Driven Finding)
    |
    v
PREVIEW (Space Assessment)
    |
    v
JOIN (Threshold Crossing)
    |
    v
WELCOMED (Inside the Space)
```

---

## MICRO-PATTERN 1: BROWSE

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary Organization | **Single Grid + Filter Chips** | One grid, filters change content |
| Filter Design | **Radio Chips** | Single select, clear state |
| "For You" Logic | **Cascading Fallback** | Never empty, cold start safe |
| Card Content | **With Description** | Context without activity metrics |
| Activity Signal | **None for launch** | Cold start safe |
| Affiliation Access | **Smart Filter Chip** | Shows only if profile data exists |

### Filter Chip Layout

```
[For You ●] [All] [Student Org] [Greek] [Residential] [Uni]

[Ellicott]  ← Smart chip: only appears if user's dorm is set
```

### "For You" Cascade Logic (Cold Start Safe)

```
Priority order:
1. Interest + Leader Active (best quality matches)
2. If < 6 results: Add Interest Match Only
3. If still < 6: Add spaces with most members
4. If still < 6: Add recently created spaces
5. NEVER show empty "For You"

Minimum: 6 spaces always displayed
```

### Space Card Structure

```
┌─────────────────────────┐
│ [Icon]  Space Name      │
│         127 members     │
│                         │
│ One-line description    │
│ that explains the...    │
│                         │
│       [Join]            │
└─────────────────────────┘

For new spaces (< 10 members):
┌─────────────────────────┐
│ [Icon]  Space Name [New]│  ← "New" badge
│         8 members       │
│ ...                     │
└─────────────────────────┘
```

### Browse States

| State | Visual Treatment |
|-------|------------------|
| Loading | Skeleton grid (3x3 minimum) |
| Normal | Full grid with cards |
| Filtered | "Showing X spaces" count |
| No Results | Message + suggestions + clear |
| Empty For You | Escape hatch (should never happen) |

---

## MICRO-PATTERN 2: SEARCH

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Placement | **Header Integrated** | Always visible, not dominant |
| Behavior | **Instant Results** | Grid filters as you type (300ms debounce) |
| Scope | **Name + Description + Tags** | Interest discovery via search |
| No Results | **Message + Suggestions + Clear** | Helpful recovery |

### Search Flow

```
User types → 300ms debounce → Grid filters instantly
                            → URL updates (?q=query)
                            → "Clear" button appears

No page change. Stays in browse context.
```

### No Results State

```
┌─────────────────────────────────────────────┐
│                                             │
│  No spaces match "quantum computing"        │
│                                             │
│  Try searching for:                         │
│  [Physics] [CS Club] [Research]             │
│                                             │
│  [Clear search]                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## MICRO-PATTERN 3: PREVIEW

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trigger | **Card Click → Modal** | Stays in browse context |
| Content | **Adaptive Social** | Shows social proof only if exists |
| Social Proof | **Adaptive Display** | Avatars if mutual, else count only |
| Actions | **Join Only** | Single clear action |

### Preview Modal Structure

```
┌─────────────────────────────────────────────┐
│  [Banner Image]                        [X]  │
├─────────────────────────────────────────────┤
│  [Icon]  Space Name                         │
│                                             │
│  Full description of the space goes here.   │
│  Can be multiple lines. Explains what the   │
│  community is about and what happens.       │
│                                             │
│  [Tag] [Tag] [Tag]                          │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  IF mutual members exist:                   │
│  [👤👤👤] 5 people you know are members     │
│                                             │
│  IF no mutual members:                      │
│  127 members                                │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│            [Join Space]                     │
│                                             │
└─────────────────────────────────────────────┘
```

### Adaptive Social Proof Logic

```
If mutual members ≥ 1:
  → Show avatar stack + "X people you know"

If no mutual members:
  → Show member count only
  → Never show "0 people you know"
```

---

## MICRO-PATTERN 4: JOIN

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Flow | **Leader Configured** | Default open, leaders can require request |
| Button States | **Join → Joined ✓ → Enter** | Clear progression |
| Request Flow | **Simple Request** | Low friction for gated spaces |
| Feedback | **Card Update + Toast** | Double confirmation |

### Join Button State Machine

```
OPEN SPACES:
[Join] → click → [Joining...] → [Joined ✓] → 1s → [Enter]

GATED SPACES:
[Request to Join] → click → [Requesting...] → [Requested ✓]
                                                    |
                    (when approved) ────────────────┘
                                                    v
                                              [Joined ✓] → [Enter]
```

### Post-Join Feedback

```
1. Card immediately shows "Joined ✓" state
2. Toast appears: "You joined [Space Name]" with [Enter] action
3. Sidebar badge appears on new space
4. User can enter from card, toast, or sidebar
```

---

## MICRO-PATTERN 5: WELCOMED

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Entry Points | **All** | Card, Toast, Sidebar |
| First View | **Adaptive** | Chat if messages, Welcome if empty |
| Banner Content | **Leader Message** | Fallback to description |

### Adaptive First View Logic

```
If space has messages:
  → Land on chat board
  → Show dismissible welcome banner at top

If space is empty (no messages):
  → Show full-screen Welcome state
  → "Be the first to say hello" CTA
```

### Welcome Banner (For Active Spaces)

```
┌─────────────────────────────────────────────────────────┐
│ 👋 Welcome to [Space Name]! [Leader's welcome message   │
│    or space description if no custom message]  [Got it] │
└─────────────────────────────────────────────────────────┘
```

Dismissible. Once dismissed, never shows again for this space.

### Empty Space Welcome (Cold Start)

```
┌─────────────────────────────────────────────┐
│                                             │
│            [Space Icon Large]               │
│                                             │
│        Welcome to [Space Name]              │
│                                             │
│   [Space description, centered, inviting]   │
│                                             │
│         ─────────────────────               │
│                                             │
│    You're one of the first here.            │
│    Start a conversation and set the tone.   │
│                                             │
│           [Say Hello]  ← Gold CTA           │
│                                             │
│          [Skip to chat]                     │
│                                             │
└─────────────────────────────────────────────┘
```

**Philosophy alignment:** "Founding class" energy. Being first is special, not awkward.

---

## STATES

### Browse States

| State | Visual |
|-------|--------|
| Loading | Skeleton grid |
| Normal | Full card grid |
| Searching | Instant filter, results update |
| No results | Helpful message + suggestions |
| Empty For You | Escape hatch with actions |

### Preview States

| State | Visual |
|-------|--------|
| Loading | Modal skeleton |
| Normal | Full content |
| Already member | "You're a member" + "Enter" |
| Private | "Request to Join" button |
| Requested | "Request Pending" |

### Join States

| State | Visual |
|-------|--------|
| Idle | "Join" button |
| Joining | Loading spinner |
| Joined | Checkmark + "Joined" |
| Error | Retry option |

### Welcome States

| State | Visual |
|-------|--------|
| Active space | Chat + banner |
| Empty space | Full welcome state |
| Banner dismissed | Just chat |

---

## KEYBOARD SUPPORT

| Context | Keys |
|---------|------|
| Browse grid | Arrow keys navigate, Enter opens preview |
| Filter chips | Tab between, Space/Enter to select |
| Search | Type to search, Escape clears |
| Preview modal | Escape closes, Enter joins |

---

## ANIMATION TIMELINE

### Browse Load
```
0ms     - Header appears
100ms   - Filter chips fade in
200ms   - First row of cards
300ms   - Second row
400ms   - Third row (staggered)
```

### Search
```
0ms     - User types
300ms   - Debounce complete
350ms   - Grid begins filtering
500ms   - New results visible
```

### Preview Open
```
0ms     - Modal backdrop fades (150ms)
50ms    - Modal scales from 0.95 (200ms)
150ms   - Content fades in
```

### Join
```
0ms     - Button shows loading
300ms   - Success state
600ms   - Morphs to "Enter"
```

---

## COMPONENTS REQUIRED

| Component | Purpose |
|-----------|---------|
| BrowseHeader | Page title + search input |
| FilterChipBar | Radio filter chips |
| SmartFilterChip | Contextual affiliation chip |
| SpaceGrid | Responsive card grid |
| SpaceCard | Individual space display |
| SpaceCardBadge | "New" badge for young spaces |
| SpaceCardSkeleton | Loading state |
| SearchInput | Integrated instant search |
| NoResultsState | Empty search feedback |
| ForYouEmptyState | Fallback escape hatch |
| SpacePreviewModal | Detail view before join |
| AdaptiveSocialProof | Avatars or count based on data |
| JoinButton | Multi-state join button |
| RequestButton | Request to join flow |
| WelcomeBanner | Dismissible first-time banner |
| EmptySpaceWelcome | Full welcome for empty spaces |

See next section for full component specifications.

---

# PATTERN 4: COMMAND & SEARCH

## Purpose
Enable keyboard-driven navigation and instant access to anything in HIVE. The power user layer that makes HIVE feel like infrastructure, not just a social app.

## Upstream Alignment

| Principle | Expression |
|-----------|------------|
| Premium Infrastructure | ⌘K command palette like Linear, VS Code |
| Builder Energy | Keyboard-first, power user friendly |
| Accessible | Discoverable for newcomers via header icon |
| No Pressure | Non-intrusive, appears when invoked |

## Pattern Philosophy

The tension: **Accessible to newcomers** vs **powerful for experts**. Must work for the student who's never seen a command palette AND the builder who lives in VS Code.

---

## MACRO-STRUCTURE

### Confirmed Decision: Unified Command Palette

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary Paradigm | Unified Command Palette (⌘K) | Single entry point, scales infinitely, feels like infrastructure |
| Organization | Frecency-first with flat list | Fast for regulars, discoverable for new queries |
| Trigger | ⌘K + header icon | Power users + discoverable |

**Why unified:** Matches builder tools (VS Code, Linear, Raycast). Single thing to learn. Scales infinitely by adding command categories.

---

## COMMAND CATEGORIES

| Category | Examples | Trigger |
|----------|----------|---------|
| **Navigate** | Go to Space, Go to Profile, Go to Tools | Type space/profile name |
| **Search** | Find message, Find person, Find tool | Type query |
| **Actions** | Create Space, New Tool, Edit Profile | Type action verb |
| **Quick Actions** | Toggle sidebar, Copy link | System shortcuts |
| **Space Commands** | (When in space) Pin message, Invite member | Context-aware |

---

## SEARCH RESULT TYPES

| Type | Visual | Information Shown |
|------|--------|-------------------|
| **Space** | Squircle icon + name | Category badge, member count (if >10) |
| **Person** | Avatar + name | Handle, mutual spaces (if any) |
| **Tool** | Tool icon + name | Creator, space deployed to |
| **Message** | Thread icon + preview | Space name, sender, date |
| **Action** | Command icon + label | Keyboard shortcut (if any) |

---

## MICRO-PATTERNS

### 1. Empty State

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Content | Recent items (suggested actions if cold) | Immediately useful |
| Cold start | 3 suggested actions | Never show empty |
| Returning user | Up to 6 recent items | Fast repeat access |

**Cold Start Safety:**
- New user: Show "Create your first tool", "Browse spaces", "Complete your profile"
- User with history: Show recent spaces/profiles/tools visited
- Always functional, never dead

### 2. Search Input

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Style | Full-width with icon | Clean, premium |
| Icon | ⌘ on left | Shows shortcut |
| Placeholder | "Search spaces, people, tools..." | Teaches scope |
| Height | 56px | Primary input prominence |

### 3. Result Item

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Icon + Text + Meta | Clear hierarchy |
| Height | 44px | Scannable |
| Selected state | bg-surface-2 + left border | Visible selection |
| Number shortcuts | 1-9 shown on right | Quick select |

### 4. Category Headers

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Style | Subtle divider + lowercase | Minimal, functional |
| Show more | Link on right | Access full results |
| Results shown | 3 per category | Scannable, expandable |

### 5. No Results State

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Content | Message + suggestions | Never dead end |
| Actions | "Browse spaces" / "Search all people" | Escape hatches |

### 6. Loading State

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Style | Skeleton results | Smooth, no flash |
| Count | 3 skeleton rows | Matches default results |

---

## VISUAL SPECIFICATIONS

```
COMMAND PALETTE CONTAINER
├── Width: 560px (centered)
├── Max Height: 480px
├── Background: var(--color-bg-card) with blur(16px)
├── Border: 1px solid var(--color-border-subtle)
├── Border Radius: 16px
├── Box Shadow: 0 24px 48px rgba(0,0,0,0.5)
└── Animation: Scale 0.96 → 1.0, 200ms ease-out

SEARCH INPUT
├── Height: 56px
├── Font Size: 16px
├── Placeholder: text-secondary
├── Icon: 20px, text-subtle
└── Border Bottom: 1px solid var(--color-border-subtle)

RESULT ITEM
├── Height: 44px
├── Padding: 8px 16px
├── Icon: 24px
├── Name: 14px, text-primary
├── Meta: 12px, text-secondary
├── Selected BG: var(--color-bg-surface-2)
└── Selected Border: 2px left, white

CATEGORY HEADER
├── Height: 32px
├── Font: 11px uppercase
├── Color: text-subtle
└── Padding: 8px 16px

NUMBER SHORTCUTS
├── Size: 16px circle
├── Font: 10px monospace
├── Background: var(--color-bg-surface-2)
└── Position: Right of meta
```

---

## KEYBOARD SHORTCUTS

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘K` | Open command palette | Global |
| `⌘/` | Focus search (if bar exists) | Global |
| `g then h` | Go home | Global (vim-style) |
| `g then s` | Go to spaces | Global |
| `g then p` | Go to profile | Global |
| `?` | Show keyboard shortcuts | Global |

### Palette Shortcuts

| Shortcut | Action |
|----------|--------|
| `↑/↓` | Navigate results |
| `Enter` | Select result |
| `Escape` | Close palette |
| `1-9` | Quick select result |
| `Tab` | Move to "Show more" |

---

## ANIMATION TIMELINE

### Open Palette
```
0ms     - Backdrop fade in (0 → 0.5 opacity)
0ms     - Modal scale (0.96 → 1.0)
50ms    - Input auto-focus
100ms   - Recent items fade in (stagger 50ms each)
```

### Typing
```
0ms     - User types character
150ms   - Debounce complete, search fires
150ms   - Skeleton appears immediately
~300ms  - Results replace skeletons (stagger 30ms)
```

### Close Palette
```
0ms     - Modal scale (1.0 → 0.96)
0ms     - Fade out (1.0 → 0)
150ms   - Remove from DOM
```

---

## STATES

| State | Behavior |
|-------|----------|
| **Closed** | Invisible, listening for ⌘K |
| **Open/Empty** | Shows recent items or suggested actions |
| **Open/Typing** | Debounce 150ms, show skeletons |
| **Open/Results** | Categorized results, max 3 per category |
| **Open/No Results** | Message + suggestions |
| **Open/Selected** | Highlighted row, ready for Enter |
| **Navigating** | Instant navigation, palette closes |

---

## GOLD USAGE

| Element | Gold Moment | Condition |
|---------|-------------|-----------|
| None | — | Command palette is infrastructure, not celebration |

**Rationale:** The command palette is pure utility. Gold is reserved for achievements and presence. Power tools should feel professional, not gamified.

---

## CONFIRMED DECISIONS SUMMARY

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary Paradigm** | Unified Command Palette | Single entry point, scales infinitely |
| **Organization** | Frecency-first with flat list | Fast for regulars, discoverable for new |
| **Trigger** | ⌘K + header icon | Power users + discoverable |
| **Empty State** | Recent items (suggested actions if cold) | Immediately useful, cold start safe |
| **Keyboard Nav** | Arrow keys + number shortcuts | Universal + power enhancement |
| **Result Density** | 3 per category with "Show more" | Scannable, access to all |
| **Input Style** | Full-width with icon | Clean, premium |
| **Result Layout** | Icon + Text + Meta | Clear hierarchy |
| **Category Headers** | Subtle divider + lowercase | Minimal, functional |
| **No Results** | Message + suggestions | Never dead end |
| **Loading** | Skeleton results | Smooth, no flash |

---

## COMPONENTS REQUIRED

| Component | Purpose |
|-----------|---------|
| CommandPalette | Root container with backdrop |
| CommandPaletteInput | Search input with icon |
| CommandPaletteResults | Categorized result list |
| CommandResultItem | Individual result row |
| CommandCategoryHeader | Section divider with label |
| CommandResultSkeleton | Loading state row |
| CommandEmptyState | Recent items or suggestions |
| CommandNoResults | No match feedback |
| CommandTriggerButton | Header icon button |
| KeyboardShortcutBadge | Shortcut display (⌘K) |

See next section for full component specifications.

---

# PATTERN 5: PROFILE & IDENTITY

## Purpose
Enable authentic self-expression without performance pressure. Profiles show who you are, not how popular you are.

## Upstream Alignment

| Principle | Expression |
|-----------|------------|
| Authenticity | No vanity metrics, no follower counts visible |
| Privacy Defaults High | 4-level privacy model, Ghost Mode |
| Presence Without Pressure | Online status optional, not surveillance |
| 2am Energy | Profiles that feel personal, not branded |

## Pattern Philosophy

The tension: **Expression vs privacy** — students should be able to share authentically while maintaining control over what others see.

---

## PROFILE TYPES

| Type | Who Sees | What's Shown |
|------|----------|--------------|
| **Own Profile** | Self | Full edit, all privacy settings, completion tracker |
| **Fellow Student** | Same campus | Based on privacy settings (4 levels) |
| **Non-Student** | Outsiders | Nothing — profiles are inside-only |

---

## MACRO-STRUCTURE

### Confirmed Decision: Bento Grid Layout

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Bento Grid | Visual, flexible, modern |
| Header | Centered, 96px avatar | Personal, focused |
| Grid | 2-3 columns responsive | Mobile-friendly |
| Presence | Gold dot, opt-in | Premium feel, privacy-first |

**Why Bento:** Visual interest without being overwhelming. Cards can be customized/rearranged by user. Different card sizes = information hierarchy.

---

## BENTO CARD TYPES

| Card | Purpose | Size |
|------|---------|------|
| **Identity** | Avatar, name, handle, bio | Large (2×2) |
| **Spaces** | Spaces they're in | Medium (2×1) |
| **Tools** | Tools they've built | Medium (2×1) |
| **Connections** | Mutual connections | Small (1×1) |
| **Activity** | Recent activity summary | Small (1×1) |
| **Interests** | Interest tags | Small (1×1) |
| **Contact** | How to reach them (if allowed) | Small (1×1) |
| **Coming Soon** | Placeholder for future cards | Small (1×1) |

---

## MICRO-PATTERNS

### 1. Profile Header

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Centered | Focus on the person |
| Avatar size | 96px | Prominent but not dominating |
| Presence | Gold dot, opt-in | Privacy-first, premium |
| Name display | Name + @handle + year/major | Quick identity |

### 2. Bento Grid

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Columns | 2 mobile, 3 desktop | Responsive |
| Card sizes | S (1×1), M (2×1), L (2×2) | Information hierarchy |
| Customization | Hideable + limited reorder | Control without complexity |

### 3. Privacy Model

**4-Level Privacy System:**

| Level | Label | Who Sees |
|-------|-------|----------|
| **1** | Public (Campus) | Anyone on campus |
| **2** | Connections | Only connected people |
| **3** | Mutual Spaces | People in shared spaces |
| **4** | Private | Only you |

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Granularity | Per-section | Meaningful control without overwhelm |
| Default | Level 2 (Connections) | Privacy-first |
| Ghost Mode | Toggle, off by default | Complete invisibility option |

### 4. Connections Display

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Display | Avatar stack of mutuals | Personal, relevant |
| Count | "5 people you know" | Framed as relevant, not status |
| Fallback | "12 connections" if no mutuals | Cold start safe |

### 5. Profile Completion

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Display | Checklist + percentage | Actionable, informational |
| Visibility | Own profile only | Not competitive |
| Gold moment | First tool built only | Achievement, not form-filling |

---

## GOLD USAGE

| Element | Gold Moment | Condition |
|---------|-------------|-----------|
| Presence dot | Online status | When online AND opted-in |
| Tool achievement | First tool built | Profile completion milestone |
| Badge (future) | Achievement badges | Specific achievements only |

**Philosophy:** Gold on profiles should be earned, not decorative.

---

## STATES

### Viewing Own Profile

| State | What's Shown |
|-------|--------------|
| Normal | Full bento grid, edit button, completion tracker |
| Editing | Inline edit mode on focused card |
| Settings | Privacy modal open |

### Viewing Others' Profile

| State | What's Shown |
|-------|--------------|
| Full access | All cards user allows |
| Partial access | Only cards at user's privacy level |
| No access | "This profile is private" message |
| Loading | Skeleton bento grid |

### Connection States

| State | Display |
|-------|---------|
| Not connected | "Connect" button |
| Request sent | "Request Pending" |
| Connected | "Connected" badge + "Message" button |
| Blocked | Profile not visible |

---

## ANIMATION TIMELINE

### Profile Load
```
0ms     - Header skeleton appears
100ms   - Avatar fades in
200ms   - Name/handle appears
300ms   - Bento cards begin (stagger 50ms each)
600ms   - All cards visible
```

### Presence Change
```
0ms     - Dot fades in/out (200ms)
```

### Connection Request
```
0ms     - Button changes to loading
200ms   - Success feedback
400ms   - Morphs to "Request Pending"
```

---

## CONFIRMED DECISIONS SUMMARY

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Layout** | Bento Grid | Visual, flexible, modern |
| **Header** | Centered, 96px avatar | Personal, focused |
| **Presence** | Gold dot, opt-in | Premium feel, privacy-first |
| **Grid** | 2-3 columns responsive | Mobile-friendly |
| **Customization** | Hideable + limited reorder | Control without complexity |
| **Privacy** | Per-section (4 levels) | Meaningful control |
| **Ghost Mode** | Toggle, off by default | Privacy option |
| **Connections** | Avatar stack of mutuals | Personal, relevant |
| **Completion** | Checklist + percentage | Actionable, informational |

---

## COMPONENTS REQUIRED

| Component | Purpose |
|-----------|---------|
| ProfileHeader | Avatar, name, handle, presence |
| ProfileBentoGrid | Container for cards |
| IdentityCard | Large card with bio, badges |
| SpacesCard | Spaces list with previews |
| ToolsCard | Tools built by user |
| ConnectionsCard | Mutual connections avatar stack |
| ActivityCard | Recent activity summary |
| InterestsCard | Interest tags |
| ComingSoonCard | Placeholder |
| ProfileCompletionTracker | Checklist for own profile |
| PrivacySettingsModal | Per-section privacy |
| GhostModeToggle | Privacy toggle |
| ConnectButton | Multi-state connection action |
| ProfileSkeleton | Loading state |

See next section for full component specifications.

---

# PATTERN 6: TOOL BUILDING

## Purpose
Transform students from consumers to creators. HiveLab is "Figma + Cursor for campus tools" — visual composition with AI assistance.

## Upstream Alignment

| Principle | Expression |
|-----------|------------|
| Building Without Permission | No waiting for admin approval |
| Builder Energy | Ship to your community today |
| Accessible | Non-coders create meaningful tools |
| Power | Power users not constrained |

## Pattern Philosophy

The tension: **Powerful vs accessible**. Non-coders should create meaningful tools, while power users shouldn't feel constrained.

---

## MACRO-STRUCTURE

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **IDE Layout** | Canvas center, elements left, properties right | Standard IDE pattern |
| **Entry Point** | Templates gallery OR blank canvas | Balance speed and control |
| **AI Integration** | Prompt bar for generation/modification | Natural language as primary input |
| **Preview** | Live preview panel | See changes instantly |

---

## CREATION FLOW

```
Templates → Customize → Name/Describe → Deploy → Share
    OR
Blank → AI Generate → Refine → Name/Describe → Deploy → Share
```

### Build Modes

| Mode | User Type | Entry |
|------|-----------|-------|
| **Template** | Most users | Pick template → customize |
| **AI Generate** | Adventurous | Describe → generate → refine |
| **Blank Canvas** | Power users | Manual element assembly |

---

## MICRO-PATTERNS

### 1. Element System

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Drag-drop | Visual assembly | Intuitive |
| Element types | 3 tiers (Universal, Connected, Space) | Clear capabilities |
| Properties | Panel when selected | Standard IDE |

### 2. AI Generation

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Input | Prompt bar at bottom | Natural position |
| Output | Streaming to canvas | Visual feedback |
| Iteration | "Refine" prompts | Conversational |

### 3. Deploy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Target | Space sidebar slot | Clear destination |
| Flow | Select space → confirm → done | Minimal friction |
| Visibility | Space members only | Scoped |

---

## ELEMENT TIERS

| Tier | Count | Examples |
|------|-------|----------|
| **Universal** | 15 | Text, Button, Input, Image, List, Card |
| **Connected** | 5 | User Display, Space Link, Event Card |
| **Space** | 7 | Member List, Chat Feed, Resource List |

---

## GOLD USAGE

| Element | Gold Moment | Condition |
|---------|-------------|-----------|
| First deploy | Celebration animation | First tool ever deployed |
| Tool stats | Active users indicator | When tool has users |

---

## STATES

| State | What's Shown |
|-------|--------------|
| Template Gallery | Grid of starting points |
| Building | Canvas + panels |
| Previewing | Live tool simulation |
| Deploying | Space selector modal |
| Deployed | Success + share options |

---

## CONFIRMED DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Layout** | IDE-style (canvas/panels) | Familiar to builders |
| **Entry** | Templates-first | Lower barrier |
| **AI** | Prompt bar + streaming | Modern, intuitive |
| **Elements** | 27 across 3 tiers | Comprehensive |
| **Deploy** | To space sidebar | Clear target |
| **Gold** | First deploy only | Achievement moment |

---

## COMPONENTS REQUIRED

| Component | Purpose |
|-----------|---------|
| HiveLabIDE | Main container |
| ElementPalette | Draggable elements |
| ToolCanvas | Drop zone for elements |
| PropertiesPanel | Element configuration |
| AIPromptBar | Natural language input |
| TemplateGallery | Starting points |
| DeployModal | Space selection |
| ToolPreview | Live simulation |

---

# PATTERN 7: EVENT FLOW

## Purpose

Events are convergence points — when async community becomes sync gathering. Events transform passive browsing into active participation, turning "I'm part of this space" into "I'm meeting these people."

**Core Tension:** Lightweight creation vs rich detail. The pattern must support both a quick "meeting in 30 min" and a detailed workshop with registration.

---

## Upstream Alignment

| HIVE Principle | Expression in Event Flow |
|----------------|--------------------------|
| **Organized Chaos** | Events surface through space noise naturally |
| **Show The Happening** | Live events get gold treatment, upcoming events always visible |
| **No Pressure** | RSVP is one-click, attendance isn't tracked punitively |
| **Human Scale** | Designed for 5-50 person gatherings, not stadium events |
| **Tools Over Features** | Events can trigger tools (check-in, polls, etc.) |
| **Privacy** | Events inherit space privacy level |

---

## Macro-Structure: The Event Journey

Events follow a 6-stage journey from discovery to reflection:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          THE EVENT JOURNEY                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. AWARENESS        2. INTEREST         3. COMMITMENT                       │
│  ┌──────────┐       ┌──────────┐        ┌──────────┐                        │
│  │ See it   │  →    │ Learn    │   →    │ RSVP     │                        │
│  │ in rail  │       │ more     │        │ Going    │                        │
│  └──────────┘       └──────────┘        └──────────┘                        │
│       ↑                                       │                              │
│       │                                       ↓                              │
│  6. ECHO             5. CONVERGENCE      4. ANTICIPATION                     │
│  ┌──────────┐       ┌──────────┐        ┌──────────┐                        │
│  │ See      │  ←    │ LIVE     │   ←    │ Get      │                        │
│  │ recap    │       │ ★ GOLD ★ │        │ reminder │                        │
│  └──────────┘       └──────────┘        └──────────┘                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Stage | User Goal | System Response | Gold Moment? |
|-------|-----------|-----------------|--------------|
| **1. Awareness** | "What's happening?" | Rail widget, calendar dots | No |
| **2. Interest** | "Tell me more" | Event details modal | No |
| **3. Commitment** | "I want to go" | Single-click RSVP | No |
| **4. Anticipation** | "Don't let me forget" | Reminder notification | No |
| **5. Convergence** | "It's happening!" | Live badge, gold pulse | **YES** |
| **6. Echo** | "What happened?" | Recap card, photos | No |

---

## Where Events Live

**DECISION: Space-Scoped Primary**

Events are created within spaces and belong to spaces. A global calendar aggregates events from the user's joined spaces.

| Option | Description | Industry Example | Recommendation |
|--------|-------------|------------------|----------------|
| **Space-scoped (Primary)** | Events live in spaces, calendar aggregates | Discord, Slack | ✅ **CHOSEN** |
| Platform-level | Events exist independently | Eventbrite, Facebook Events | ❌ Too impersonal |
| Hybrid | Both space and platform events | LinkedIn | ❌ Confusing |

**Rationale:** Events gain meaning from community context. "Chess Club Weekly" means more than "Chess Meetup" because it's tied to a space you belong to.

**Architecture:**
```
Space Events (Primary)
├── Created in /spaces/[spaceId]/events
├── Visible in space rail widget
├── Space-scoped RSVP list
└── Chat can reference events

Global Calendar (Aggregation)
├── /calendar page
├── Shows events from joined spaces
├── Color-coded by space
└── External calendar sync (Google, Apple)
```

---

## MICRO-PATTERN 1: Awareness

How users discover events exist.

### Decision: Rail Widget Position

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Above chat** | Events first, then chat | Apple Calendar widgets | ✅ **CHOSEN** - Upcoming events deserve prominence |
| Below chat | Chat first, events second | Discord (events buried) | ❌ Events get lost |
| Collapsible | User controls visibility | Linear | ❌ Hidden = forgotten |

### Decision: Calendar Indicator Style

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Dot indicator** | Small dot under date | Apple Calendar | ✅ **CHOSEN** - Minimal, elegant |
| Number badge | "3 events" | Google Calendar | ❌ Too busy |
| Preview text | Event titles visible | Outlook | ❌ Visual clutter |

### Decision: "Happening Now" Treatment

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Gold pulse** | Subtle gold glow animation | Apple live activities | ✅ **CHOSEN** - Gold = life |
| Red dot | Urgent indicator | Notifications | ❌ Feels like error |
| Highlight bar | Full-width accent | Zoom | ❌ Too aggressive |

---

## MICRO-PATTERN 2: Interest

How users learn event details.

### Decision: Detail Display Method

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Modal** | Overlay with full details | Apple Events | ✅ **CHOSEN** - Focus without navigation |
| Separate page | Full page for event | Eventbrite | ❌ Context-breaking |
| Inline expansion | Expand in place | Discord | ❌ Layout disruption |

### Decision: Information Hierarchy

| Level | Content | Visibility |
|-------|---------|------------|
| **Primary** | Title, Date/Time, Location | Always visible |
| **Secondary** | Description, Host, Attendee count | Below fold / expanded |
| **Tertiary** | Full attendee list, Comments | Deep dive only |

**Visual Structure:**
```
┌─────────────────────────────────────────────┐
│  ┌───┐                                      │
│  │📅│  Event Title                    [×]   │
│  └───┘  Jan 15, 2026 • 7:00 PM              │
│         📍 Student Union Room 304           │
├─────────────────────────────────────────────┤
│                                             │
│  Description text goes here. This can be    │
│  multiple lines of context about what       │
│  the event is and why people should come.   │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  👤 Hosted by @sarah_chen                   │
│                                             │
│  [👤👤👤👤+12] 16 going • 4 maybe           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [     RSVP: Going     ] [Maybe] [Can't]    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## MICRO-PATTERN 3: Commitment (RSVP)

How users indicate attendance intent.

### Decision: RSVP Options

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Going / Maybe / Can't** | Three clear options | Google Calendar | ✅ **CHOSEN** - Complete without overwhelming |
| Going / Not Going | Binary | Apple Calendar | ❌ Missing "maybe" nuance |
| Going / Interested / Can't | Facebook style | Facebook Events | ❌ "Interested" too passive |
| Going with +1 | Plus-one support | Eventbrite | 🟡 Future enhancement |

### Decision: RSVP Interaction Model

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Single-click primary** | One click for "Going", expand for others | Apple (primary action prominent) | ✅ **CHOSEN** - Optimizes for commitment |
| Equal buttons | All options same size | Google Calendar | ❌ Decision paralysis |
| Dropdown | Select from menu | Eventbrite | ❌ Extra click |

**Interaction Flow:**
```
Initial State:
┌──────────────────────────────┐
│  [      RSVP       ▾]        │  ← Single button, expands
└──────────────────────────────┘

Expanded State:
┌──────────────────────────────┐
│  [ ✓ Going ]                 │  ← Primary (larger)
│  [   Maybe  ]                │  ← Secondary
│  [ Can't make it ]           │  ← Tertiary (subtle)
└──────────────────────────────┘

Committed State:
┌──────────────────────────────┐
│  [✓ Going        ▾]          │  ← Filled, changeable
└──────────────────────────────┘
```

### Decision: Social Proof Display

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Avatar stack + count** | Show faces then number | Discord | ✅ **CHOSEN** - Human, not just numbers |
| Count only | "16 going" | Google Calendar | ❌ Impersonal |
| Full list | All names visible | Eventbrite | ❌ Overwhelming |

**Display:** `[👤👤👤👤+12] 16 going`

---

## MICRO-PATTERN 4: Anticipation (Reminders)

How users remember to attend.

### Decision: Default Reminder Time

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **1 hour before** | Reasonable prep time | Apple Calendar default | ✅ **CHOSEN** - Balanced urgency |
| 30 minutes | Short notice | Google Calendar | ❌ Too late for prep |
| 1 day before | Advance notice | Eventbrite | ❌ Easy to forget again |
| At event time | No buffer | None | ❌ Useless |

### Decision: Reminder Customization

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Preset options** | 15min, 1hr, 1day, 1week | Apple Calendar | ✅ **CHOSEN** - Simple choices |
| Custom input | Any time | Google Calendar | ❌ Over-engineering |
| None | No customization | Discord | ❌ Too rigid |

### Decision: Reminder Delivery

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **In-app notification** | Native app notification | Discord, Slack | ✅ **CHOSEN** - Platform-native |
| Push notification | System push | All calendar apps | 🟡 Phase 2 (requires setup) |
| Email | Email reminder | Eventbrite | ❌ Feels corporate |
| All channels | Multi-channel | Enterprise tools | ❌ Notification overload |

---

## MICRO-PATTERN 5: Convergence (Live Events)

How the system celebrates events happening NOW.

### Decision: Live Badge Style

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Gold pulse badge** | Subtle gold glow, "LIVE" text | Apple live activities | ✅ **CHOSEN** - Gold = life per HIVE philosophy |
| Red dot | Urgent indicator | YouTube Live | ❌ Feels like notification |
| Green dot | Active indicator | Zoom | ❌ Presence, not event |
| Animation only | No badge, just motion | Discord stages | ❌ Too subtle |

### Decision: Chat Integration

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **System message** | "🟡 [Event] is happening now" | Discord | ✅ **CHOSEN** - Non-intrusive awareness |
| Pinned banner | Banner at top of chat | Zoom | ❌ Intrusive |
| Nothing | No chat mention | Google Calendar | ❌ Missed opportunity |

### Decision: Quick Actions During Event

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Join link prominent** | Big "Join" button if virtual | Zoom, Google Meet | ✅ **CHOSEN** - Remove friction |
| Check-in button | Mark attendance | Eventbrite app | 🟡 Future (tool integration) |
| Live chat thread | Event-specific chat | Discord threads | 🟡 Future enhancement |

---

## MICRO-PATTERN 6: Echo (Post-Event)

How past events are remembered.

### Decision: Past Event Treatment

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Dimmed card** | Visually muted, still accessible | Apple Calendar | ✅ **CHOSEN** - History visible but not prominent |
| Hidden | Removed from view | Some calendar apps | ❌ Loses history |
| Archived section | Separate "Past" tab | Eventbrite | ❌ Extra navigation |

### Decision: Recap Features

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Photo gallery** | Host can add event photos | Facebook Events | 🟡 Phase 2 |
| Attendance record | Who actually came | Enterprise tools | ❌ Surveillance vibes |
| Discussion thread | Post-event comments | Discord | 🟡 Phase 2 |
| None | No recap | Most calendar apps | ✅ **MVP** - Keep it simple |

---

## MICRO-PATTERN 7: Creation

How leaders create events.

### Decision: Creation Entry Point

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **"+" in events panel** | Contextual add button | Apple apps | ✅ **CHOSEN** - Obvious location |
| Floating action button | Global FAB | Material Design | ❌ Generic |
| Chat command | "/event" | Discord bots | 🟡 Enhancement |
| Calendar click | Click date to create | Google Calendar | 🟡 Enhancement |

### Decision: Creation Mode

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Dual-mode** | Quick inline + Rich modal | Linear (quick add + full) | ✅ **CHOSEN** - Flexibility |
| Modal only | Always full form | Eventbrite | ❌ Friction for simple events |
| Inline only | Always minimal | Todoist | ❌ Can't add details |
| AI-assisted | Natural language parsing | Notion AI | 🟡 Phase 2 |

### Quick Create (Inline)
```
┌─────────────────────────────────────────────┐
│  [+] Quick event: "Study session 3pm"       │
│      ↳ Parsed: Today, 3:00 PM, "Study..."   │
└─────────────────────────────────────────────┘
```

### Rich Create (Modal)
- Full form with all fields
- Date picker, time picker
- Location or virtual link toggle
- Description (rich text)
- Capacity limit (optional)
- RSVP requirement toggle
- Board linkage (optional)
- Announce to space toggle

---

## EVENT TYPES

**DECISION: Simplify to 3 Types**

| Type | Icon | Use Case | Settings |
|------|------|----------|----------|
| **Meeting** | 📅 | Structured gatherings (club meetings, study groups) | Location, agenda |
| **Social** | 🎉 | Casual hangouts (parties, game nights, coffee) | Location, vibe |
| **Virtual** | 💻 | Online events (Zoom calls, watch parties) | Link required |

**Rejected Types:**
- Academic, Cultural, Recreational → Folded into Meeting/Social based on space context
- External → Handled via virtual link, not separate type

---

## GOLD USAGE

Gold represents life, activity, and convergence. Used sparingly per HIVE philosophy.

| Element | Condition | Gold Treatment | Duration |
|---------|-----------|----------------|----------|
| **Live badge** | Event happening NOW | Gold pulse animation | Event duration |
| **Today indicator** | Event within 24 hours | Gold dot in calendar | Until event ends |
| **Host badge** | Event creator viewing | Gold ring on avatar | Always in event view |
| **Countdown** | Final 5 minutes before | Gold countdown text | 5 minutes |

**NOT Gold:**
- RSVP button (white/primary)
- Past events (dimmed)
- Event creation (neutral)
- Reminder badges (muted)

---

## STATES

### Event Card States

| State | Visual Treatment | Badge | Action Available |
|-------|------------------|-------|------------------|
| **Upcoming** | Normal | Time badge | RSVP |
| **Today** | Subtle emphasis | "Today" gold dot | RSVP |
| **Happening Now** | Gold pulse | "LIVE" gold badge | Join |
| **Starting Soon** | Countdown visible | "In 30 min" | RSVP, Prepare |
| **Past** | 50% opacity | Date badge | View only |
| **Cancelled** | Strikethrough title | "Cancelled" badge | None |
| **Full** | Normal | "Full" badge | Waitlist |

### RSVP Button States

| State | Visual | Interaction |
|-------|--------|-------------|
| **Not responded** | Ghost button "RSVP" | Expand options |
| **Going** | Solid button "Going ✓" | Click to change |
| **Maybe** | Outline button "Maybe" | Click to change |
| **Can't make it** | Ghost "Can't" | Click to change |
| **Submitting** | Loading spinner | Disabled |
| **Full (no RSVP)** | Disabled "Full" | Show waitlist option |

### Creation States

| State | Visual | Next Action |
|-------|--------|-------------|
| **Empty** | Placeholder prompt | Click to create |
| **Quick mode** | Inline input active | Type and enter |
| **Rich mode** | Modal open | Fill form |
| **Saving** | Loading overlay | Wait |
| **Success** | Toast + card appears | Done |
| **Error** | Toast with message | Retry |

---

## ANIMATION TIMELINE

| Moment | Animation | Duration | Easing |
|--------|-----------|----------|--------|
| Event card enter | Fade in + slide up | 300ms | ease-out |
| RSVP expand | Height expand | 200ms | spring |
| RSVP submit | Button pulse | 150ms | ease-in-out |
| Live badge pulse | Gold glow | 2000ms | infinite sine |
| Modal open | Fade + scale | 300ms | ease-out |
| Modal close | Fade + scale down | 200ms | ease-in |
| Calendar dot appear | Scale from 0 | 200ms | spring |
| Toast notification | Slide in from bottom | 300ms | ease-out |

---

## KEYBOARD SHORTCUTS

| Shortcut | Action | Context |
|----------|--------|---------|
| `E` | Open events panel | Space view |
| `N` | New event (if leader) | Events panel |
| `Enter` | Quick submit | Quick create input |
| `Esc` | Close modal | Any modal |
| `G` | RSVP Going | Event details modal |
| `M` | RSVP Maybe | Event details modal |
| `←` `→` | Navigate calendar | Calendar view |

---

## CONFIRMED DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Event Location** | Space-scoped, calendar aggregates | Context matters more than global reach |
| **Rail Position** | Above chat | Events deserve prominence |
| **Calendar Indicators** | Dot style | Apple-level minimal elegance |
| **Live Treatment** | Gold pulse | Gold = life per HIVE philosophy |
| **Detail Display** | Modal | Focus without context loss |
| **RSVP Options** | Going / Maybe / Can't | Complete without overwhelming |
| **RSVP Model** | Single-click primary | Optimize for commitment |
| **Social Proof** | Avatars + count | Human-first |
| **Default Reminder** | 1 hour | Balanced urgency |
| **Reminder Delivery** | In-app notification | Platform-native |
| **Past Events** | Dimmed, visible | History without clutter |
| **Creation Entry** | "+" in panel | Contextual, obvious |
| **Creation Modes** | Quick + Rich | Flexibility for use cases |
| **Event Types** | 3 (Meeting, Social, Virtual) | Simple taxonomy |

---

## COMPONENTS REQUIRED

| Component | Purpose | Pattern Stage |
|-----------|---------|---------------|
| **UpcomingEventsWidget** | Rail widget showing next events | 1. Awareness |
| **EventCalendar** | Month/week grid with dot indicators | 1. Awareness |
| **EventCard** | Card display in lists/panels | 1. Awareness, 6. Echo |
| **EventDetailsModal** | Full event information overlay | 2. Interest |
| **RSVPButton** | Multi-state RSVP interaction | 3. Commitment |
| **EventReminder** | Notification component | 4. Anticipation |
| **LiveEventBadge** | Gold pulse "LIVE" indicator | 5. Convergence |
| **EventAnnouncement** | Chat system message for live events | 5. Convergence |
| **QuickEventInput** | Inline natural language create | 7. Creation |
| **EventCreateModal** | Full event creation form | 7. Creation |
| **EventFilters** | Filter by type, date, status | All stages |
| **AttendeeList** | Expandable list of RSVPs | 2. Interest |

---

# PATTERN 8: CONNECTIONS + FRIENDS

## Purpose

Enable organic relationship formation through shared activity, while preserving intentionality for deeper connections. Two tiers: **Connections** form automatically from shared spaces (your world), **Friends** require mutual acknowledgment (your people).

## Upstream Alignment

| Source | Principle | Expression |
|--------|-----------|------------|
| PHILOSOPHY | "Wait, you're in that space too?" | Connections auto-form from shared spaces |
| PHILOSOPHY | "The 2am people" | Friends = intentional inner circle |
| PHILOSOPHY | "Discovery Without Overwhelm" | Natural gravity, no algorithmic suggestions |
| PHILOSOPHY | "Real community forms through DOING" | Connections based on shared activity |
| PRINCIPLES | "No vanity metrics" | No counts visible to others |
| PRINCIPLES | "Presence without pressure" | Friends-only presence, opt-in |
| PRINCIPLES | "The gate creates safety" | Friends-only DMs |
| PRINCIPLES | "Gold = activity only" | Gold presence dots for friends online |

## Pattern Philosophy

The insight: **Relationships form through shared activity, not manual networking.**

HIVE isn't LinkedIn. You don't "build your network" — your network builds itself through the spaces you're in and the things you build together. Friends are the intentional layer on top: the 2am people you explicitly chose.

---

## THE TWO-TIER MODEL

### Architecture

| Tier | Name | Formation | Purpose | Visibility |
|------|------|-----------|---------|------------|
| **Tier 1** | Connections | Automatic (shared spaces) | Ambient network, discovery | Contextual ("people you know") |
| **Tier 2** | Friends | Mutual request/accept | Inner circle, DMs, presence | On profile (mutual only) |

### The Campus Reality

| Real Campus | HIVE Equivalent |
|-------------|-----------------|
| Recognize people from classes | **Connections** — people in shared spaces |
| Have friends you text | **Friends** — mutual, intentional |
| Know OF people in your club | **Connections** — shared space members |
| Have 2am people you'd call | **Friends** — your inner circle |

### Industry Comparison

| Platform | Tier 1 (Passive/Auto) | Tier 2 (Active/Intentional) | HIVE Advantage |
|----------|----------------------|----------------------------|----------------|
| Discord | Server members | Friends | HIVE: warmer, no server list clutter |
| Slack | Workspace members | DMs / Starred | HIVE: personal, not professional |
| LinkedIn | 2nd/3rd degree | 1st degree connections | HIVE: no counts, organic |
| Facebook | Group members | Friends | HIVE: cleaner separation |
| Apple Contacts | All contacts | Favorites | HIVE: auto-formation |
| BeReal | None | Friends only | HIVE: network from activity |

---

## TIER 1: CONNECTIONS (Automatic)

### Formation

Connections form automatically when you share a space with someone. No action required.

| Trigger | Behavior | Strength Bonus |
|---------|----------|----------------|
| Join same space | Instant connection | +1 base |
| Each additional shared space | Connection strengthened | +1 per space |
| Message in same thread | Interaction recorded | +0.5 |
| React to their message | Engagement signal | +0.5 |
| Reply to their message | Direct interaction | +1 |
| They reply to you | Mutual interaction | +1 |
| Build/use same tool | Collaboration | +2 |

**Connection Strength:** Hidden score used for sorting "people you know" displays. Higher strength = more prominent. Never shown as a number.

### Visibility

| Surface | What's Shown | Format |
|---------|--------------|--------|
| Space Browse | "5 people you know are here" | Avatar stack + count |
| Space Preview | "With @alex, @jordan, +3 more" | Names + count |
| Profile View | "Also in: CS Club, Photography" | Shared spaces |
| Search Results | Connections ranked higher | Priority sorting |
| Events | "3 connections attending" | Count only |

### What Connections Enable

- See "X people you know" when browsing spaces
- See mutual connections on profiles
- Surface in search results with priority
- Inform recommendations (without being creepy)

### What Connections Don't Enable

- Direct messaging (must be friends)
- Seeing their online status (must be friends)
- Appearing in their "friends" list
- Any notification to them

### Confirmed Decisions

| Decision | Choice | Rationale | Upstream Alignment |
|----------|--------|-----------|-------------------|
| Formation trigger | Space membership | Zero friction | "Natural gravity toward affinity" |
| Strength scoring | Hidden, affects sorting | No gamification | "No vanity metrics" |
| Display | Contextual only | Not overwhelming | "Discovery without overwhelm" |
| No dedicated page | Never list all connections | No network management | "No performance pressure" |

---

## TIER 2: FRIENDS (Intentional)

### Formation

Friends require mutual acknowledgment: request + accept.

| Aspect | Design | Rationale |
|--------|--------|-----------|
| Direction | Mutual (request → accept) | Equality, consent |
| Visibility | Mutual count only to viewers | No status games |
| Presence | Online status (if opted-in) | 2am awareness |
| DMs | Enabled | Direct communication |
| Purpose | Inner circle | The people you chose |

### What Friends Enable

- Direct messaging
- Presence visibility (gold dot when online)
- Priority in all surfaces
- "Friends in this space" surfacing
- Optional activity notifications

---

## MICRO-PATTERN 1: CONNECTION DISPLAY

### "People You Know" Format

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Format | Avatar stack (max 3) + count | Compact, warm |
| Sorting | By connection strength | Relevance |
| Interaction | Clickable to see full list | Progressive disclosure |
| Language | "5 people you know" | Friendly, not "5 connections" |

**Visual:**
```
[👤][👤][👤] 5 people you know
 ↑ highest strength first, clickable
```

### Where Connections Surface

| Context | Display |
|---------|---------|
| Space browse cards | Avatar stack if connections exist |
| Space preview modal | "With @alex, @jordan, +3" |
| Event cards | "3 people you know attending" |
| Profile pages | "Also in: [shared spaces]" |
| Search results | Connections sorted first |

### Where Connections Never Surface

- Dedicated "Network" or "Connections" page (never)
- "People you may know" suggestions (never)
- Any count of total connections (never)
- Push notifications about connections (never)

---

## MICRO-PATTERN 2: FRIEND REQUEST

### Entry Points

| Location | Format | When Shown |
|----------|--------|------------|
| Profile page | "👤+ Add Friend" button | Always for non-friends |
| Member list | Small "+" icon on hover | When hovering avatar |
| Command palette | `⌘K` → "Add @name as friend" | When typed |

**Never shown:**
- "People you may know" suggestions
- System prompts after interaction
- Notification-style nudges

### Request Flow

```
1. User clicks "Add Friend"
2. Confirmation appears:

   ┌─────────────────────────────────────────────────┐
   │  Add @alex as friend?                           │
   │                                                 │
   │  You're both in:                                │
   │  • Computer Science Club                        │
   │  • Photography Club                             │
   │                                                 │
   │  ▶ Add a note (optional)     [collapsed]        │
   │                                                 │
   │        [Send Request]    [Cancel]               │
   └─────────────────────────────────────────────────┘

3. Note field is collapsed by default (no pressure)
4. One click sends with auto-context
```

### Request Notification

| Element | Design |
|---------|--------|
| Indicator | Badge dot on notifications (not number) |
| Profile glow | Subtle warmth on own avatar when requests pending |
| Push notification | Never (too aggressive) |
| Toast | Never (interruptive) |

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Entry points | Profile + inline + ⌘K | Multiple intentional paths |
| Context | Auto-generated from shared spaces | Zero effort, relevant |
| Message | Optional, collapsed by default | No pressure |
| Notification | Badge + profile glow | Ambient, not urgent |

---

## MICRO-PATTERN 3: FRIEND RESPONSE

### Response Options

| Option | Behavior | Notification |
|--------|----------|--------------|
| Accept | Become friends | Both get toast |
| Ignore | Silent removal from pending | None to requester |

**No explicit "Decline" option.** Ignoring is softer — the requester sees "Request Sent" which could mean "hasn't seen it yet."

### Auto-Expiration

- Ignored requests expire after 30 days
- Requester can re-request once after expiration
- No "declined" state ever shown

### Accept Confirmation

```
To accepter: "You and @alex are now friends"  [Message] [Dismiss]
To requester: "@jordan accepted your friend request"
```

**No gold. No celebration. No "Say hi!" prompt.** Just warm acknowledgment.

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Options | Accept / Ignore only | No explicit rejection |
| Decline feedback | Silent | No awkwardness |
| Auto-expire | 30 days | Natural timeout |
| Accept notification | Simple toast to both | Warm, not celebratory |

---

## MICRO-PATTERN 4: PRESENCE (Friends-Only)

### Visibility Model

| Your Presence | Visible To |
|---------------|------------|
| Online | Friends only (if opted-in) |
| In same space | Friends in that space only |
| Typing | Everyone in that chat |
| Last active | Never shown |

### Presence Indicators

| State | Visual | Meaning |
|-------|--------|---------|
| Online | Gold dot (#FFD700) | Active in last 5 min |
| Recently active | Dim gray dot | Active 5-60 min ago |
| Offline | No indicator | 60+ min inactive |

**No "away" or "busy" statuses.** Just: here, was here, or not here.

### Presence Controls

```
Settings → Privacy
├── Show when I'm online: [On]  (to friends only)
└── Ghost Mode: [Off]           (completely invisible)
```

**Ghost Mode:** One toggle to disappear completely. No presence to anyone.

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visibility | Friends only | Privacy-first |
| Indicator | Gold dot (3 states) | HIVE aesthetic, "gold = activity" |
| Controls | Simple toggle + Ghost Mode | Meaningful control, not complex |
| Last active | Never shown | No surveillance |

---

## MICRO-PATTERN 5: DIRECT MESSAGING

### Access Model

| Relationship | Can DM? |
|--------------|---------|
| Stranger | No |
| Connection | No — use space chat |
| Friend | Yes |

**Friends-only DMs is a feature, not a limitation:**
- No cold DMs from strangers
- No "slide into DMs" culture
- Adding as friend = explicit consent to direct communication
- Want to DM someone? Become friends first.

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DM access | Friends only (strict) | "The gate creates safety" |
| Non-friend interaction | Space chat only | Use shared context |
| DM requests | Not implemented | Reduces friend meaning |

---

## MICRO-PATTERN 6: UNFRIENDING & PRIVACY

### Unfriending

| Action | Outcome | Notification |
|--------|---------|--------------|
| Remove friend | Downgrades to Connection | None |
| DMs | Disabled | — |
| Presence | No longer visible | — |
| Re-add | Can add as friend again | — |

**Why keep as Connection:** You're still in shared spaces. The organic relationship exists. You just removed the intentional layer.

### Hiding Connections

| Action | Effect |
|--------|--------|
| Hide | They don't appear in your "people you know" |
| Reversible | Unhide anytime |
| They know? | No |

### Blocking

| When Blocked | Effect |
|--------------|--------|
| Visibility | Mutual invisibility everywhere |
| Messages | Hidden from each other in shared spaces |
| Notification | None |
| Reversible | Yes, they don't know |

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Unfriend behavior | Downgrade to Connection | Soft, graduated |
| Hide option | Available | Personal curation |
| Block | Full mutual invisibility | Safety |
| Notifications | Never | No drama |

---

## MICRO-PATTERN 7: FRIENDS DISPLAY

### On Others' Profiles (What Viewers See)

```
Mutual Friends
[👤][👤][👤] You and @alex have 5 mutual friends
            ↑ clickable to see who
```

Only mutual friends shown. Never total count.

### On Own Profile (Private View)

```
Your Friends
[Grid of all friends with presence dots]
[Not visible to others]
```

### Friend Indicators in Context

| Context | Indicator |
|---------|-----------|
| Member lists | Friends appear first, subtle warmth |
| Chat messages | Friend avatars have subtle warmth |
| Search results | Friends prioritized |
| Events | "3 friends attending" |

**No explicit "Friend" badges.** Warmth is felt, not labeled.

---

## GOLD USAGE

| Element | Gold Usage | Condition |
|---------|------------|-----------|
| Presence dot | Gold | Friend is online (opted-in) |
| Friend's avatar | Subtle warmth | When in same space |
| First friend added | None | Not an achievement |
| Friend milestones | None | Not gamified |

**Philosophy:** The only gold in Pattern 8 is presence — knowing your 2am people are awake. Friendship itself is normal, not an achievement.

---

## STATES

### Connection States

| State | Visual | Behavior |
|-------|--------|----------|
| No shared spaces | Nothing | No connection exists |
| Connected | Implicit | Surfaces in "people you know" |
| Hidden | Nothing | You've hidden them |
| Blocked | Nothing | Mutual invisibility |

### Friend States

| State | Button | Behavior |
|-------|--------|----------|
| Not friends | "Add Friend" | Can add |
| Request sent | "Request Sent" (dimmed) | Waiting |
| Request received | "Accept" (highlighted) | Can accept |
| Friends | "Friends ✓" + Message | Full access |
| Unfriended | "Add Friend" | Reverted to connection |

### Friend Request Button State Machine

```
NOT FRIENDS
┌─────────────────┐
│   Add Friend    │  ← text-primary, border-subtle
└─────────────────┘
        │ click
        ▼
┌─────────────────┐
│  Sending...     │  ← subtle pulse
└─────────────────┘
        │ success
        ▼
┌─────────────────┐
│  Request Sent   │  ← text-secondary, checkmark
└─────────────────┘

THEY REQUESTED YOU
┌─────────────────┐
│     Accept      │  ← filled, prominent
└─────────────────┘
        │ click
        ▼
┌─────────────────┐
│   Friends ✓     │  ← subtle, with Message option
└─────────────────┘
```

### Presence States (Friends Only)

| State | Visual |
|-------|--------|
| Online | Gold dot |
| Recently active | Dim dot |
| Offline | No dot |
| In same space | Warm glow |
| Ghost Mode | No presence |

---

## ANIMATION TIMELINE

### Friend Request Send
```
0ms     - Button shows "Sending..."
150ms   - Request fires
300ms   - Success state
400ms   - Morphs to "Request Sent"
```

### Friend Accept
```
0ms     - Button shows loading
200ms   - Success
300ms   - Toast appears for both parties
400ms   - Button morphs to "Friends ✓"
```

### Presence Change
```
0ms     - Dot fades in/out (200ms ease)
```

---

## KEYBOARD SUPPORT

| Context | Keys |
|---------|------|
| Profile | `F` to add friend (if not friends) |
| Friend request notification | `A` accept, `I` ignore |
| Command palette | Type "friend @name" |
| DM from profile | `M` to message (if friends) |

---

## CONFIRMED DECISIONS SUMMARY

| Category | Decision | Choice | Upstream |
|----------|----------|--------|----------|
| **Architecture** | Relationship model | Two-tier (Connections + Friends) | "Natural gravity" + "2am people" |
| **Connections** | Formation | Auto from shared spaces | "Discovery without overwhelm" |
| **Connections** | Visibility | Contextual only, never counted | "No vanity metrics" |
| **Connections** | Strength | Hidden, affects sorting | "No gamification" |
| **Friends** | Formation | Mutual request/accept | "Intentional relationships" |
| **Friends** | Entry points | Profile + inline + ⌘K | "Accessible, not pushy" |
| **Friends** | Context | Auto-generated + optional note | "Zero friction" |
| **Friends** | Response | Accept / Ignore (no decline) | "No awkwardness" |
| **Presence** | Visibility | Friends only | "Presence without pressure" |
| **Presence** | Indicator | Gold dot (3 states) | "Gold = activity" |
| **DMs** | Access | Friends only | "The gate creates safety" |
| **Unfriend** | Behavior | Downgrade to Connection | "Soft, graduated" |
| **Display** | People you know | Avatar stack + count | "Warm, compact" |
| **Display** | Friends on profile | Mutual only | "No status games" |
| **Gold** | Usage | Presence dots only | "Not gamified" |

---

## COMPONENTS REQUIRED

| Component | Purpose | Priority |
|-----------|---------|----------|
| ConnectionContext | Shows "Also in: X, Y, Z" on profiles | P1 |
| PeopleYouKnow | Avatar stack with "5 people you know" | P1 |
| AddFriendButton | Multi-state friend request | P0 |
| FriendRequestCard | Incoming request with context | P0 |
| FriendRequestModal | Confirmation with auto-context | P0 |
| FriendsGrid | Own profile friends display | P1 |
| MutualFriendsStack | Clickable avatar stack | P1 |
| PresenceDot | Gold online indicator | P0 |
| DMButton | Only appears for friends | P1 |
| FriendBadge | Subtle indicator in member lists | P2 |
| GhostModeToggle | Privacy control | P1 |
| HideConnectionOption | Menu item to hide | P2 |
| BlockUserFlow | Full block flow | P1 |

---

## DATA MODEL IMPLICATIONS

### Connection Entity

```typescript
interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  strength: number;           // Hidden score
  sharedSpaces: string[];     // Space IDs
  interactionCount: number;   // For strength calculation
  createdAt: Timestamp;
  lastInteraction: Timestamp;
  hidden: boolean;            // User hid this connection
}
```

### Friend Entity

```typescript
interface Friendship {
  id: string;
  userIds: [string, string];  // Both users (sorted for consistency)
  status: 'pending' | 'accepted';
  requesterId: string;
  context: {
    sharedSpaces: string[];
    note?: string;
  };
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}
```

### Presence Entity

```typescript
interface UserPresence {
  userId: string;
  status: 'online' | 'recent' | 'offline';
  lastActive: Timestamp;
  currentSpaceId?: string;    // Only visible to friends in same space
  ghostMode: boolean;
}
```

---

## IMPLEMENTATION PRIORITY

| Priority | Item | Complexity | Impact |
|----------|------|------------|--------|
| **P0** | Connection auto-formation | Medium | Critical |
| **P0** | Friend request/accept flow | Medium | Critical |
| **P0** | Friends-only DMs | Medium | Critical |
| **P1** | "People you know" display | Low | High |
| **P1** | Presence system (friends) | Medium | High |
| **P1** | Connection strength scoring | Medium | Medium |
| **P1** | Ghost Mode | Low | Medium |
| **P2** | Hide/block functionality | Low | Medium |
| **P2** | Friend indicators in context | Low | Low |
| **P3** | Keyboard shortcuts | Low | Nice-to-have |

---

## PATTERN INTEGRATION

### Cross-Pattern Navigation

| From | To | Trigger |
|------|-----|---------|
| Landing | Gate | CTA click |
| Gate | Onboarding | Verification success |
| Onboarding | Space | Join space |
| Space | Profile | Avatar click |
| Space | Tool | Tool slot click |
| Profile | Friend Request | Add Friend click |
| Profile | DM | Message button (friends only) |
| Member List | Profile | Avatar click |
| Member List | Friend Request | + icon hover click |
| Anywhere | Command | ⌘K |
| Command | Friend Request | "friend @name" typed |

### Shared State

| State | Scope | Usage |
|-------|-------|-------|
| User identity | Global | Profile, presence |
| Current space | Space context | Chat, tools |
| Online status | Global | Presence indicators (friends only) |
| Theme | Global | Always dark |
| Connections | Global | Auto-formed from shared spaces |
| Friends | Global | Mutual relationships |
| Ghost Mode | Global | Presence invisibility |

### Connection/Friend State Flow

```
User joins Space A
        │
        ▼
Auto-connected to all Space A members
        │
        ▼
Connections surface in "people you know"
        │
        ▼
User clicks "Add Friend" on profile ──────► Friend Request sent
        │                                          │
        │                                          ▼
        │                                    Recipient accepts
        │                                          │
        ▼                                          ▼
Stays as Connection only              Becomes Friend
        │                                          │
        ▼                                          ▼
- Surfaces in discovery              - DMs enabled
- No DMs                             - Presence visible
- No presence                        - Priority in surfaces
```

---

## NEXT LEVEL

Patterns flow into **Templates (Level 8)** — the page-level structures that hold patterns and create the skeleton of each page type.

See: `TEMPLATES.md`

---

*Patterns define complete experiences. Components implement them. Templates layout them. Instances ship them.*
