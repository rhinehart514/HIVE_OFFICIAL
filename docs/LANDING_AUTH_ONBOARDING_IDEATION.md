# Landing → Auth → Onboarding: Complete Ideation

> **Philosophy**: Campus at 2am. Warmth in darkness. Entering somewhere special.
> **The Journey**: Outsider glimpses → Gate opens → Identity forms → Community joins
> **Last Updated**: January 7, 2026

---

## The Complete Flow

```
OUTSIDER                         INSIDER
   │                                │
   ▼                                ▼
┌──────────┐   ┌───────────┐   ┌───────────┐   ┌─────────────┐
│ LANDING  │ → │   AUTH    │ → │ ONBOARDING│ → │   SPACES    │
│ (Glimpse)│   │  (Gate)   │   │ (Identity)│   │   (Home)    │
└──────────┘   └───────────┘   └───────────┘   └─────────────┘
     │              │               │                │
  See the       .edu is         Who are         You're
  artifacts     the key         you here?        home
```

---

## Part 1: Landing Page

### Current State Analysis

**What exists:**
- Scroll-based sections (Lenis smooth scroll)
- Monochrome discipline (99% grayscale, 1% gold on final CTA)
- Sections: Navbar → Hero → ProductShowcase → Credibility → CTA Footer
- SpacePreview component showing animated chat
- White scroll progress indicator

**What works:**
- Gold budget discipline is excellent
- Premium scroll feel
- Product preview gives taste of inside

**What needs examination:**
- Does it pass the 2am test? (Currently feels like marketing page)
- Does the gate feel valuable? (Currently explains product, not scarcity)
- Is there warmth or is it cold/corporate?

### Product Comparisons

| Product | Approach | Feeling | What to Learn |
|---------|----------|---------|---------------|
| **Linear** | Minimal hero, product demo, motion | Confidence without explanation | Less words, more implication |
| **Vercel** | Dark, grid aesthetic, ship focus | Developer energy | Competence as value prop |
| **Discord** | Playful, illustrated, community focus | Fun, accessible | Personality without cringe |
| **Notion** | Template gallery, use cases | Utility first | Show don't tell |
| **Superhuman** | Waitlist scarcity, minimal info | Desire through restraint | The power of less |
| **Clubhouse (2021)** | Invite-only, mystery | FOMO, exclusivity | Gate as feature |
| **Are.na** | Anti-corporate, quiet confidence | For people who get it | Not trying to convince |

### Landing Options

#### Option A: "The Glimpse" (Minimal Mystery)

**Philosophy**: Show just enough to create desire. Don't explain — imply.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ⬡ HIVE                             │
│                                                             │
│                                                             │
│                   "Where students build"                    │
│                                                             │
│                                                             │
│              ┌─────────────────────────────┐                │
│              │                             │                │
│              │    [Blurred space preview]  │                │
│              │    You can see activity     │                │
│              │    but can't read it        │                │
│              │                             │                │
│              └─────────────────────────────┘                │
│                                                             │
│                   [ Enter with .edu ]                       │
│                                                             │
│                  "400+ UB spaces waiting"                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Single viewport, no scroll
- Blurred preview of real activity (gate reinforcement)
- One CTA (gold)
- Social proof is minimal (just a number)
- Typography does the work

**Alignment:**
- ✅ 2am test: Quiet, intimate, not selling
- ✅ Gold budget: One CTA only
- ✅ Gate: The blur makes inside feel valuable
- ⚠️ Builder test: Doesn't emphasize creation

**Comparable to:** Are.na, early Superhuman

---

#### Option B: "The Window" (Activity Glimpse)

**Philosophy**: Let them see real activity happening. FOMO through visibility.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⬡ HIVE                               [ Enter with .edu ]  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│   │ CS Club    │ │ Pre-Med    │ │ Design Lab │              │
│   │ ● 127 now  │ │ ● 84 now   │ │ ● 56 now   │   (scrolls) │
│   │            │ │            │ │            │              │
│   │ [activity] │ │ [activity] │ │ [activity] │              │
│   │ [blurred]  │ │ [blurred]  │ │ [blurred]  │              │
│   └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│                                                             │
│             "Join 3,247 students building at UB"            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Real-time activity indicators (gold dots = life)
- Horizontal scroll of space cards (blurred content)
- Activity visible, content obscured
- CTA in header (persistent)
- Social proof with real number

**Alignment:**
- ✅ 2am test: Feels like seeing a party through a window
- ✅ Gold budget: Only presence dots and CTA
- ✅ Gate: Blur creates curiosity
- ✅ Alive test: Real-time numbers show life

**Comparable to:** Clubhouse vibes, Discord server discovery

---

#### Option C: "The Statement" (Manifesto)

**Philosophy**: Lead with worldview. Attract the right people, repel the wrong ones.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⬡ HIVE                                                     │
│                                                             │
│                                                             │
│                                                             │
│     "The institutions that were supposed to prepare you     │
│      for the future are still preparing you for the past.   │
│                                                             │
│                    We're building the alternative."         │
│                                                             │
│                                                             │
│                                                             │
│                      [ Enter with .edu ]                    │
│                                                             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│   Spaces      HiveLab      Events      (scrollable demo)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Manifesto-first typography
- Polarizing statement (attracts believers)
- Product demo below fold
- CTA centered, prominent

**Alignment:**
- ✅ 2am test: This is what they'd say at 2am
- ✅ Human test: Sounds like a person, not a brand
- ✅ Gold budget: One CTA
- ⚠️ Gate test: Less emphasis on exclusivity

**Comparable to:** Linear's "built for the way we work", Notion's early messaging

---

#### Option D: "The Artifact" (Show Don't Tell)

**Philosophy**: Ship something they can use without signing up. Prove value.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⬡ HIVE                               [ Enter with .edu ]  │
│                                                             │
│                                                             │
│     "What would you build if your school let you?"         │
│                                                             │
│     ┌─────────────────────────────────────────────────┐     │
│     │                                                 │     │
│     │     [ Interactive HiveLab mini-builder ]        │     │
│     │                                                 │     │
│     │     Drag elements, see result                   │     │
│     │     "Study Timer" "Event RSVP" "Poll"           │     │
│     │                                                 │     │
│     │     [ Deploy this to your space → ]             │     │
│     │                                                 │     │
│     └─────────────────────────────────────────────────┘     │
│                                                             │
│               Built by students. For students.              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Interactive element on landing page
- Let them build something (limited) before signup
- Deploy button is the gate (requires .edu)
- Shows capability, not just promises

**Alignment:**
- ✅ Builder test: Creation upfront
- ✅ 2am test: Let them play
- ⚠️ Gold budget: Might need gold on interactive elements
- ⚠️ Gate: Weaker initial gate

**Comparable to:** Notion's template gallery, Figma's "design in browser"

---

### Landing Recommendation

**Recommended: Option B "The Window" + elements of Option A**

Why:
1. Real-time activity creates FOMO (Alive test ✅)
2. Blurred content reinforces gate value
3. Gold presence dots stay within budget
4. Single CTA focus
5. Social proof with real numbers

**Key design decisions:**
- Single viewport hero OR minimal scroll (2 sections max)
- Blurred space cards with visible activity counts
- Gold only on: presence dots + CTA button
- No product explanations — implications only
- Footer: Just terms/privacy links, no sitemap

---

## Part 2: Auth (Login)

### Current State Analysis

**What exists:**
- Focus template (portal mode)
- Email → OTP → Success flow
- EmailInput with @buffalo.edu suffix
- OTPInput with progressive gold fill
- AuthSuccessState celebration
- Resend with cooldown
- Dev shortcuts

**What works:**
- Focus template creates immersion
- OTP animation is satisfying
- Domain enforcement is clear
- Error messages are warm

**What needs examination:**
- "Enter HIVE" — is this the right framing?
- Success celebration — too much or not enough?
- Background — is it atmospheric enough?

### Product Comparisons

| Product | Auth Approach | Feeling | What to Learn |
|---------|---------------|---------|---------------|
| **Stripe** | Magic link, minimal | Effortless, trusted | Simplicity is confidence |
| **Linear** | Magic link + SSO | Efficient, no friction | Speed = respect |
| **Superhuman** | Waitlist + email | Anticipation | The wait builds desire |
| **Discord** | Email + password or OAuth | Familiar | Sometimes standard wins |
| **Notion** | Google/Apple/Email magic | Options | Different users, different paths |
| **Slack** | Workspace-first, email second | Context before identity | Maybe spaces-first? |

### Auth Flow Options

#### Option A: "The Key" (Current, Refined)

**Flow:** Email → OTP → Success → Redirect

**Refinements:**
- Change "Enter HIVE" → "You're invited" or just "Enter"
- Background: Subtle blurred activity (hint at what's inside)
- Success: Brief gold pulse, then immediate redirect (no celebration delay)
- Copy: "Your @buffalo.edu email is your key" (the gate metaphor)

```
STATE 1: EMAIL INPUT
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ⬡                                  │
│                                                             │
│                        "Enter"                              │
│                                                             │
│              ┌─────────────────────────────┐                │
│              │ jwrhineh      │ @buffalo.edu│                │
│              └─────────────────────────────┘                │
│                        [ → ]                                │
│                                                             │
│            "Your .edu email is your key"                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STATE 2: OTP VERIFICATION
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ⬡                                  │
│                                                             │
│                   "Check your inbox"                        │
│                                                             │
│               ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐                       │
│               │_│ │_│ │_│ │_│ │_│ │_│                       │
│               └─┘ └─┘ └─┘ └─┘ └─┘ └─┘                       │
│                                                             │
│         Sent to jwrhineh@buffalo.edu                        │
│                                                             │
│                  Resend in 28s                              │
│                ← Different email                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STATE 3: SUCCESS (brief)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                          ⬡                                  │
│                     (gold pulse)                            │
│                                                             │
│                       "You're in"                           │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
(Auto-redirect after 1.5s)
```

**Alignment:**
- ✅ Gold budget: Only on OTP fill + success pulse
- ✅ 2am test: Minimal, intimate
- ✅ Gate test: "Key" metaphor reinforces exclusivity
- ✅ Human test: Simple, not clever

---

#### Option B: "The Threshold" (Atmospheric)

**Philosophy:** Make entering feel like crossing into a different space.

**Flow:** Same mechanics, different atmosphere

**Changes:**
- Background: Visible but blurred activity from inside
- As OTP fills, blur decreases (revealing what's inside)
- Success: The blur clears completely, then redirect

```
STATE 1: BLURRED BACKGROUND
┌─────────────────────────────────────────────────────────────┐
│   [████ heavily blurred space activity ███████████████]     │
│   [████ you can see shapes moving ████████████████████]     │
│                                                             │
│                          ⬡                                  │
│                                                             │
│              ┌─────────────────────────────┐                │
│              │ Email input                 │                │
│              └─────────────────────────────┘                │
│                                                             │
│   [████ blurred activity continues ███████████████████]     │
└─────────────────────────────────────────────────────────────┘

STATE 2: CLEARING (as OTP fills)
┌─────────────────────────────────────────────────────────────┐
│   [███ slightly less blurred ██████████████████████████]    │
│                                                             │
│                    ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐                  │
│                    │4│ │2│ │7│ │_│ │_│ │_│                  │
│                    └─┘ └─┘ └─┘ └─┘ └─┘ └─┘                  │
│                    (3/6 = 50% less blur)                    │
│                                                             │
│   [███ activity becoming clearer █████████████████████]     │
└─────────────────────────────────────────────────────────────┘

STATE 3: REVEAL (success)
┌─────────────────────────────────────────────────────────────┐
│   [Clear view of spaces, messages, activity]                │
│                                                             │
│                       "You're in"                           │
│                                                             │
│   [Full clarity - this is what you've unlocked]             │
└─────────────────────────────────────────────────────────────┘
```

**Alignment:**
- ✅ Gate test: Blur → clarity is powerful metaphor
- ✅ Alive test: Real activity visible
- ✅ 2am test: Theatrical but earned
- ⚠️ Performance: Need to ensure smooth blur animation

**Comparable to:** iOS unlock animations, game loading screens that reveal

---

#### Option C: "The Space-First" (Context Before Identity)

**Philosophy:** Show them where they're going first, then authenticate.

**Flow:** Browse spaces (blurred) → Select one → Auth to enter

```
STATE 1: BROWSE (unauthenticated)
┌─────────────────────────────────────────────────────────────┐
│  ⬡ HIVE                                                     │
│                                                             │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│   │ CS Club    │ │ Pre-Med    │ │ Robotics   │              │
│   │ ● 127 now  │ │ ● 84 now   │ │ ● 56 now   │              │
│   │ [blurred]  │ │ [blurred]  │ │ [blurred]  │              │
│   └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│                Click any space to enter                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STATE 2: CLICKED SPACE → AUTH APPEARS
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌───────────────────────────────────────────────────┐     │
│   │                                                   │     │
│   │     "Enter CS Club"                               │     │
│   │                                                   │     │
│   │     ┌─────────────────────────────────────┐       │     │
│   │     │ Email                    @buffalo.edu│      │     │
│   │     └─────────────────────────────────────┘       │     │
│   │                                                   │     │
│   └───────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Alignment:**
- ✅ Context before identity (like Slack workspaces)
- ✅ Destination is clear
- ⚠️ Adds complexity to flow
- ⚠️ What if they don't pick a space?

---

### Auth Recommendation

**Recommended: Option A refined + background elements from Option B**

- Keep the current flow (it works)
- Refine copy: "Enter" not "Enter HIVE"
- Add subtle blurred activity in background (whisper of what's inside)
- Success should be brief: gold pulse + "You're in" + immediate redirect
- No celebration delay for returning users

**Key decisions:**
- OTP gold fill: Keep (earned reveal)
- Success celebration: Minimal (1.5s max)
- Background: Subtle blur of activity
- Error states: Warm, not clinical

---

## Part 3: Onboarding

### Current State Analysis

**What exists:**
- Focus template (reveal mode)
- 3 steps: userType → quickProfile → interestsCloud
- Leader fork (skips interests, goes to claim)
- Draft recovery, offline handling, error recovery
- Progress indicator (dots)
- Auto-join recommended spaces at end

**What works:**
- Leader/student fork is smart
- Draft recovery is thoughtful
- Auto-join reduces friction

**What needs examination:**
- Does it feel like joining a community or filling a form?
- Is the progress indicator the right metaphor?
- Are we collecting the right things?

### Product Comparisons

| Product | Onboarding | Feeling | What to Learn |
|---------|------------|---------|---------------|
| **Twitter** | Topics + follows | Quick, personalized | Interests = instant value |
| **TikTok** | No onboarding, learns | Friction-free | Maybe learn instead of ask? |
| **Discord** | Server discovery | You pick your communities | Let them browse first? |
| **LinkedIn** | Resume builder | Utility, not personality | Don't become a form |
| **Spotify** | Genre picks | Taste-based | Interest selection is fun if quick |
| **Clubhouse** | Bio + interests | Identity first | Short bio matters |
| **BeReal** | Almost nothing | Get to the product | Speed as philosophy |

### Onboarding Flow Options

#### Option A: "The Three Questions" (Current, Refined)

**Philosophy:** Ask only what's essential. Get them in fast.

**Steps:**
1. **Who are you here?** (Student/Leader)
2. **Quick intro** (Name, one-liner bio, major)
3. **What interests you?** (Cloud selection)
4. → Auto-join + redirect

**Refinements:**
- Progress: Numbered steps (1 of 3) instead of dots
- Interests: Limit to 3-5 selections (not unlimited)
- Bio: Single line, optional
- Success: Show which spaces they auto-joined

```
STEP 1: WHO ARE YOU HERE?
┌─────────────────────────────────────────────────────────────┐
│  ⬡                                           1 of 3        │
│                                                             │
│                                                             │
│                  "Who are you here?"                        │
│                                                             │
│           ┌─────────────┐    ┌─────────────┐                │
│           │             │    │             │                │
│           │   Student   │    │   Leader    │                │
│           │             │    │             │                │
│           │  Exploring  │    │  Building   │                │
│           └─────────────┘    └─────────────┘                │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STEP 2: QUICK INTRO
┌─────────────────────────────────────────────────────────────┐
│  ⬡                                           2 of 3        │
│                                                             │
│                   "Quick intro"                             │
│                                                             │
│       ┌─────────────────────────────────────────────┐       │
│       │ Name                                        │       │
│       └─────────────────────────────────────────────┘       │
│       ┌─────────────────────────────────────────────┐       │
│       │ One line about you (optional)               │       │
│       └─────────────────────────────────────────────┘       │
│       ┌─────────────────────────────────────────────┐       │
│       │ Major ▾                                     │       │
│       └─────────────────────────────────────────────┘       │
│                                                             │
│                          [ Next ]                           │
└─────────────────────────────────────────────────────────────┘

STEP 3: INTERESTS
┌─────────────────────────────────────────────────────────────┐
│  ⬡                                           3 of 3        │
│                                                             │
│              "Pick a few things you're into"                │
│                  (we'll find your people)                   │
│                                                             │
│    ┌──────┐ ┌──────────┐ ┌─────┐ ┌──────────┐               │
│    │ CS   │ │ startups │ │ art │ │ gaming   │               │
│    └──────┘ └──────────┘ └─────┘ └──────────┘               │
│    ┌──────────┐ ┌──────┐ ┌───────────┐ ┌────────┐           │
│    │ pre-med  │ │ dance│ │ robotics  │ │ music  │           │
│    └──────────┘ └──────┘ └───────────┘ └────────┘           │
│                        ...                                  │
│                                                             │
│                    [ Get started → ]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

COMPLETION (brief)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ⬡                                  │
│                                                             │
│                    "You're all set"                         │
│                                                             │
│              Joined: CS Club, Robotics                      │
│                                                             │
│                  [ Go to CS Club → ]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Alignment:**
- ✅ 2am test: Quick, not invasive
- ✅ Human test: "Who are you here?" is personal
- ✅ Builder test: Leader path is distinct
- ✅ Precision: Only essential info

---

#### Option B: "The Tour" (Browse-First Onboarding)

**Philosophy:** Let them see spaces before defining themselves.

**Steps:**
1. **Name only** (bare minimum)
2. **Browse spaces** (see what exists, pick 1-3)
3. **Brief profile** (bio after they have context)
4. → Join selected + redirect

```
STEP 1: JUST YOUR NAME
┌─────────────────────────────────────────────────────────────┐
│  ⬡                                                         │
│                                                             │
│                   "What should we call you?"                │
│                                                             │
│              ┌─────────────────────────────────┐            │
│              │ Jordan                          │            │
│              └─────────────────────────────────┘            │
│                                                             │
│                        [ Next → ]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STEP 2: BROWSE AND PICK
┌─────────────────────────────────────────────────────────────┐
│  ⬡                                                         │
│                                                             │
│                 "Find your spaces"                          │
│            Pick 1-3 to get started                          │
│                                                             │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│   │ CS Club    │ │ Pre-Med    │ │ Design Lab │              │
│   │ ● 127 now  │ │ ● 84 now   │ │ ● 56 now   │              │
│   │ ☑ Selected │ │            │ │            │              │
│   └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│                 [ Show me 50 more... ]                      │
│                                                             │
│                        [ Next → ]                           │
└─────────────────────────────────────────────────────────────┘

STEP 3: QUICK PROFILE (context established)
┌─────────────────────────────────────────────────────────────┐
│  ⬡                                                         │
│                                                             │
│              "A bit about you for CS Club"                  │
│                                                             │
│              ┌─────────────────────────────────┐            │
│              │ Bio (optional)                  │            │
│              └─────────────────────────────────┘            │
│              ┌─────────────────────────────────┐            │
│              │ Major ▾                         │            │
│              └─────────────────────────────────┘            │
│                                                             │
│                     [ Get started → ]                       │
└─────────────────────────────────────────────────────────────┘
```

**Alignment:**
- ✅ Alive test: See real spaces with activity
- ✅ Gate creates context
- ⚠️ More screens than current
- ⚠️ What if they don't pick any?

---

#### Option C: "The Invisible" (Learn, Don't Ask)

**Philosophy:** Collect minimally, learn from behavior.

**Steps:**
1. **Name + major only**
2. → Redirect to /spaces/browse
3. Profile builds over time from behavior

```
ONLY STEP
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ⬡                                  │
│                                                             │
│                       "Hey there"                           │
│                                                             │
│              ┌─────────────────────────────────┐            │
│              │ Your name                       │            │
│              └─────────────────────────────────┘            │
│              ┌─────────────────────────────────┐            │
│              │ Major ▾                         │            │
│              └─────────────────────────────────┘            │
│                                                             │
│                   [ Start exploring → ]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Then:
- First 5 spaces joined → inferred interests
- Messages sent → activity profile
- Tools used → builder profile
- Bio prompt appears after day 3

**Alignment:**
- ✅ Speed to value
- ✅ BeReal philosophy
- ⚠️ No leader fork
- ⚠️ Empty profile at start

---

#### Option D: "The Identity" (Who You're Becoming)

**Philosophy:** Onboarding as aspiration, not demographics.

**Steps:**
1. **Who are you becoming?** (Aspirational framing)
2. **What do you want to build/join?** (Builder or joiner)
3. → Match to spaces/tools

```
STEP 1: ASPIRATION
┌─────────────────────────────────────────────────────────────┐
│  ⬡                                                         │
│                                                             │
│              "What are you trying to become?"               │
│                                                             │
│    ┌──────────────────┐    ┌──────────────────┐             │
│    │                  │    │                  │             │
│    │  A better        │    │  Someone who     │             │
│    │  engineer        │    │  ships things    │             │
│    │                  │    │                  │             │
│    └──────────────────┘    └──────────────────┘             │
│    ┌──────────────────┐    ┌──────────────────┐             │
│    │                  │    │                  │             │
│    │  A community     │    │  I don't know    │             │
│    │  builder         │    │  yet (that's ok) │             │
│    │                  │    │                  │             │
│    └──────────────────┘    └──────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Alignment:**
- ✅ 2am test: This is what they think about at 2am
- ✅ Human test: Aspirational, not bureaucratic
- ⚠️ Might feel too deep for quick onboarding
- ⚠️ Harder to map to spaces

---

### Onboarding Recommendation

**Recommended: Option A refined with speed from Option C**

**Final flow:**
1. **Who are you here?** (Student/Leader) — 1 tap
2. **Quick intro** (Name required, bio optional, major dropdown) — 30 seconds
3. **Interests** (Pick 3-5 max, cloud layout) — 30 seconds
4. → Auto-join top 3 matched spaces → redirect to first

**Leader fork at step 1:**
- Leader → Step 2 (profile) → /spaces/claim

**Key refinements:**
- Total time target: Under 90 seconds
- Progress: "1 of 3" text, not dots
- Interests: Cap at 5 selections
- Bio: One line, clearly optional
- Success: Show which spaces joined, single CTA to first space
- No celebration delay — straight to the community

---

## Part 4: Cross-Cutting Decisions

### Atmosphere Consistency

| Page | Template | Atmosphere | Background |
|------|----------|------------|------------|
| Landing | Custom (scroll) | Landing | Void + subtle glow |
| Auth | Focus (portal) | Landing | Blurred activity hint |
| Onboarding | Focus (reveal) | Landing | Ambient orb |
| First Space | Shell | Spaces | Solid surfaces |

**The transition:**
Landing (marketing) → Auth (gate) → Onboarding (identity) → Spaces (home)

Should feel like: Window → Door → Hallway → Room

### Gold Budget Across Flow

| Page | Gold Usage |
|------|------------|
| Landing | CTA button only |
| Auth | OTP fill animation + success pulse |
| Onboarding | "Get started" CTA only |
| Total | 3-4 gold moments across entire flow |

### Copy Voice

**Landing:** Confident, minimal ("Where students build")
**Auth:** Warm, direct ("Enter" / "Check your inbox")
**Onboarding:** Personal, quick ("Who are you here?" / "Pick a few things")
**Error states:** Warm, not clinical ("Too many attempts. Take a breath.")

### Motion Philosophy

**Landing:** Smooth scroll, subtle parallax, no bounce
**Auth:** Fade/slide transitions (300ms), OTP fill animation (progressive)
**Onboarding:** Step transitions (slide or fade), interest selection (immediate feedback)
**Success:** Brief pulse, then redirect (no delay)

---

## Summary: Recommended Approach

### Landing
- **Style:** "The Window" — see activity, content blurred
- **Gold:** CTA only
- **Scroll:** Minimal (1-2 viewports max)
- **CTA:** "Enter with .edu"

### Auth
- **Flow:** Email → OTP → Brief success → Redirect
- **Copy:** "Enter" (not "Enter HIVE")
- **Background:** Subtle blurred activity
- **Gold:** OTP fill + success pulse
- **Speed:** No celebration delay

### Onboarding
- **Steps:** 3 (userType → profile → interests)
- **Time:** Under 90 seconds total
- **Leader fork:** After step 1
- **End:** Auto-join + direct to first space
- **Gold:** Final CTA only

### The Feeling
- **Landing:** "There's something happening in there"
- **Auth:** "My key works"
- **Onboarding:** "They get me"
- **First Space:** "I'm home"

---

## Open Questions for Decision

1. **Landing scroll:** Single viewport or 2 sections?
2. **Auth background:** Blurred activity or pure ambient?
3. **Onboarding bio:** Required or optional?
4. **Interest selection:** Cloud or grid layout?
5. **Success screen:** Show joined spaces or skip straight to first?
6. **Leader path:** Same onboarding or completely separate?

---

*This document is a starting point for discussion. Each decision should be tested against the 7 critical tests before implementation.*
