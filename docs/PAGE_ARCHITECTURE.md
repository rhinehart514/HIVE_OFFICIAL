# HIVE Page Architecture
**Last Updated:** 2026-02-03

> The grounded result of what pages we will have, how each one looks, and why.

Synthesized from 5 parallel research agents: HIVE visual DNA, complete page inventory, premium design patterns (Linear/Vercel/Notion/Apple/Arc), about page teardowns (Linear/Notion/Figma/Discord/Luma/Apple/Stripe), and competitive landscape (Fizz/Geneva/Discord/Partiful/Luma/Mighty).

---

## Design Position

HIVE sits in white space no platform currently occupies: campus-isolated, real-identity, action-oriented, premium dark. The aesthetic references are Linear (restraint, craft, dark mode as identity), Stripe (layered proof of depth), and Arc (personalization as belonging). Not Discord (gamer-coded density), not Partiful (maximalist expression), not CampusGroups (enterprise-ugly).

**The thesis:** Dark mode is not a preference -- it's a position. Opacity/brightness hover, not scale. Ghost buttons by default. Gold at 1%. Clash Display for personality, Geist for everything else. Spring physics. Staggered entrances with blur + scale depth. One idea per viewport on marketing surfaces. Content max-width 700px inside 1200px containers.

---

## Page Inventory: What Ships

### Tier 1: Ship for Launch (Core Loop)

These pages must exist and feel premium. They ARE the product.

| Route | Purpose | Max Width | Density |
|-------|---------|-----------|---------|
| `/` | Landing/marketing | 1200px container, 700px text | Spacious |
| `/enter` | Onboarding (Email > Code > Identity) | 400px centered | Spacious |
| `/login` | Returning user auth | 400px centered | Spacious |
| `/home` | Attention aggregator dashboard | 640px centered | Balanced |
| `/explore` | Discovery (spaces, people, events) | 1200px (grid) | Spacious |
| `/s/[handle]` | Space residence (split panel) | Full width in shell | Balanced/Compact |
| `/u/[handle]` | Profile (public identity) | 800px centered | Spacious |
| `/me/settings` | Account control | 640px centered | Balanced |
| `/lab` | Builder dashboard | 1200px | Spacious |
| `/lab/[toolId]` | Tool IDE | Full width | Compact |
| `/about` | Philosophy and story | 1200px container, 700px text | Spacious |

### Tier 2: Ship Soon After (Depth)

| Route | Purpose | Max Width | Density |
|-------|---------|-----------|---------|
| `/lab/templates` | Template gallery | 1200px (grid) | Spacious |
| `/lab/new` | Tool creation | 640px centered | Balanced |
| `/lab/[toolId]/preview` | Tool preview | Full width | Balanced |
| `/lab/[toolId]/deploy` | Deploy flow | 640px centered | Spacious |
| `/me/calendar` | Time commitments | 800px centered | Balanced |
| `/me/notifications` | Notification inbox | 640px centered | Balanced |

### Tier 3: Post-Launch (Growth)

| Route | Purpose | Max Width | Density |
|-------|---------|-----------|---------|
| `/leaders` | Campus leaderboard | 800px centered | Spacious |
| `/lab/setups` | Setup gallery | 1200px (grid) | Spacious |
| `/lab/setups/*` | Setup detail/builder | Variable | Balanced |
| `/rituals` | Community rituals | 800px centered | Balanced |

### Kill List (Delete or Redirect)

| Route | Action | Reason |
|-------|--------|--------|
| `/spaces` | Already redirects to `/home` | Deprecated, merged into home |
| `/profile/[id]` | 301 to `/u/[handle]` | Legacy ID-based route |
| `/profile/edit` | 301 to `/me/settings` | Consolidated |
| `/profile/settings` | 301 to `/me/settings` | Consolidated |
| `/profile/calendar` | 301 to `/me/calendar` | Consolidated |
| `/profile/connections` | 301 to `/me/connections` | Consolidated |
| `/settings` | 301 to `/me/settings` | Consolidated |
| `/feed/settings` | Merge into `/me/settings` | Duplicate settings surface |
| `/notifications/settings` | Merge into `/me/settings` | Duplicate settings surface |
| `/design-system` | Keep dev-only or remove | Not user-facing |
| `/elements` | Keep dev-only or remove | Not user-facing |

---

## Layout Options Per Page

### `/` Landing Page

The landing page is the single most important design surface. It answers: "What is HIVE and why should I care?"

**Option A: The Declaration** (Linear/Stripe approach)
- Hero: One bold statement in Clash Display 56-64px. No explanation. "Where students who do things find their people." Dark background, subtle warm glow.
- Proof of life: Animated space visualization or live campus stats counter.
- Philosophy: One paragraph, max 700px wide. Why this exists.
- Social proof: Campus logos or "400+ organizations at UB."
- CTA: Single gold button. "Enter with your campus email."
- Feels like: Linear's confidence. Stripe's layered credibility.
- Risk: Requires the product to back up the confidence.

**Option B: The Story** (Notion approach)
- Hero: Relatable hook in first person. "Every campus has thousands of students. Most never find their people."
- Narrative: Scroll-triggered sections showing the problem > the vision > the product.
- Video or interactive demo showing spaces in action.
- CTA woven into the narrative.
- Feels like: Notion's philosophical depth. Apple's scroll-driven storytelling.
- Risk: Longer page, more content to maintain, less direct.

**Option C: The Product** (Luma/Vercel approach)
- Hero: Headline + immediately interactive. Show a space, let visitors browse.
- The product IS the landing page. Explore spaces directly on the homepage.
- Minimal text. Let the craft speak.
- Feels like: Luma's "the product is the marketing." Vercel's code-first demos.
- Risk: Requires the product to be visually stunning with zero context.

**Recommended for launch: Option A.** HIVE needs to establish a position before it can let the product speak. Post-launch, evolve toward C as the space ecosystem grows.

---

### `/enter` Entry Flow

The entry flow is already HIVE's highest-craft surface (8.5/10 ceremony). The existing pattern works.

**Layout:** Centered column, 400px max-width. Full-screen dark with warm glow. 5-dot progress indicator.

**What to preserve:**
- Staggered transitions (1.2s reveal, 0.8s exit) with blur + scale depth
- GoldCheckmark celebration on completion
- ConfettiBurst for arrival moment
- Word-by-word Clash Display reveals
- Animated top border gradient line

**What to add:**
- The entry should feel like being admitted, not signing up (Superhuman insight)
- After completion: a "membership card" moment (Arc's onboarding artifact) showing handle, campus, arrival date
- This card becomes shareable -- viral loop

---

### `/home` Dashboard

The most functionally important page. Answers: "What needs my attention right now?"

**Option A: The Stream** (Linear-inspired)
- Single column, 640px, vertical stack of attention signals
- Sections: Happening Now (live spaces) > Up Next (calendar) > Your Spaces (grid) > Suggested
- Each section stagger-enters on load
- Real-time: presence dots on spaces, unread counts pulse
- Feels like: Linear's issue list. Clean, scannable, actionable.
- Risk: Can feel sparse if user has few spaces

**Option B: The Dashboard** (Notion-inspired)
- Wider layout (800px), card-based
- Greeting + time-aware context at top
- 2-column grid below: Left = activity stream, Right = quick actions + upcoming
- Cards with warmth prop based on activity level
- Feels like: Notion's home. Personalized, organized.
- Risk: More complex, more empty states to handle

**Recommended: Option A for launch.** Simpler to build, easier to fill with real content. The stream can evolve into a dashboard as data accumulates.

---

### `/explore` Discovery

Answers: "What's happening on campus that I don't know about?"

**Option A: The Grid** (Vercel/Bento approach)
- Full 1200px width, responsive grid of space cards
- Category tabs: For You / Popular / People / Events
- Search at top, filters as pills
- Cards stagger-enter by category switch (exit left, enter right)
- Feels like: App Store Discover. Browsable.
- Risk: Requires enough content to fill the grid

**Option B: The Feed** (Pinterest/Explore approach)
- Masonry layout, mixed card types (spaces, events, people)
- Infinite scroll with progressive loading
- AI-curated "For You" ranking
- Feels like: Pinterest exploration. Serendipitous.
- Risk: Hard to implement well, needs recommendation engine

**Recommended: Option A.** Grid is simpler, more predictable, and works with HIVE's existing 400+ pre-seeded UB organizations. Save masonry for when there's enough content diversity.

---

### `/s/[handle]` Space Residence

The core product surface. Where action happens.

**Current:** Split panel (200px sidebar + remaining width chat). This is correct.

**Layout refinements:**
- Sidebar: Boards/channels list (collapsible), tool shortcuts, member avatars (compact)
- Main: Chat feed with typing indicators, reactions, thread previews
- Header: Space name (Clash Display), member count with presence dots, mode switcher
- Threshold: Non-members see a join gate with space preview (description, member count, recent activity)

**What makes it alive:**
- Presence dots on member avatars in sidebar (green = online, dim = away)
- Typing indicator with actual user avatars
- Unread indicator on boards
- Temporal awareness: "3 messages since you left" on return
- Sound design consideration: subtle notification sounds (optional)

---

### `/u/[handle]` Profile

Public identity surface. Shows what you've built and where you belong.

**Option A: The Portfolio** (3-zone layout, already partially built)
- Hero zone: Avatar, name, handle, bio, campus badge, connection count
- Activity zone: Featured tools, recent contributions, leadership roles
- Belonging zone: Space pills showing where they're active
- Single column, 800px, staggered entrance
- Feels like: A personal page on a portfolio site. Substance over style.

**Option B: The Bento** (Legacy approach, already built)
- Grid of cards: stats, spaces, tools, connections, interests
- More visual, more information density
- Feels like: Notion profile widget system.

**Recommended: Option A.** The portfolio approach better serves HIVE's identity as "where students who do things go." Bento can feel decorative. The portfolio says "look what I've built."

---

### `/about` About Page

The page that establishes HIVE's position in the world.

**Section Architecture** (synthesized from Linear/Notion/Stripe teardowns):

```
1. DECLARATION (Hero)
   Clash Display, 56px. One statement.
   "The campus platform for students who do things."
   Dark bg, subtle warm glow, no explanation.

2. PROOF OF LIFE (Immediately after hero)
   Animated space visualization or campus stats.
   Not a screenshot -- something that moves.
   "400+ organizations. 12,000+ students. UB's digital campus."

3. PHILOSOPHY (Why this exists)
   700px max-width text block. First person.
   "Every campus has thousands of students trying to
   find their people. Most never do."
   The story of why HIVE exists, told in 3-4 paragraphs.

4. THE PRODUCT (Show, don't tell)
   Interactive preview or scroll-triggered demo.
   Show a space in action. Show a tool being built.
   Show a profile. Let the craft speak.

5. SOCIAL PROOF
   Campus affiliation. Organization count.
   Featured space leaders (named humans with photos).
   Press if available. Investor credibility if available.

6. INVITATION (CTA)
   "Enter with your campus email."
   Single gold button. Campus email badge.
   The CTA is an invitation, not a signup form.
```

**Motion pattern:** Scroll-triggered section reveals. Each section fades up (y: 24 > 0, opacity: 0 > 1, 300ms, ease-smooth). Hero loads immediately. Sections below trigger at 20% viewport intersection.

---

### `/lab` Builder Dashboard

**Layout:** Two states based on tool count.

**New builder (0 tools):**
- Welcome message in Clash Display
- "What do you want to build?" prompt (ChatGPT-style input)
- Quick start template grid (3x2 or 4x2)
- Templates stagger-enter with hover glow

**Active builder (1+ tools):**
- "Your Tools" grid at top (your work first)
- Quick start chips (compact, below)
- Create new tool FAB or prompt

**Max width:** 1200px for grid, cards fill responsively.

---

### `/lab/[toolId]` Tool IDE

**Layout:** Full width within shell. Workshop density (compact spacing, flat surfaces, no glass).

**Structure:**
- Top bar: Tool name, save status, mode tabs (Code/Canvas/Settings)
- Left panel: Element tree or file list (collapsible)
- Center: Canvas or code editor
- Right panel: Properties or preview (collapsible)

**Design mode:** Workshop tokens (flat #0A0A0A bg, #141414 surfaces, #1A1A1A panels). No glass. No warmth. Pure utility. VS Code energy.

---

### `/me/settings` Settings

**Layout:** 640px centered. Vertical sections with clear headers.

**Sections:**
- Profile (name, bio, avatar, handle)
- Notifications (per-channel preferences)
- Privacy (ghost mode, visibility)
- Account (email, campus, danger zone)

**Pattern:** Each section is a card with balanced density. Save actions at section level, not page level. Immediate feedback on save (success checkmark, not alert).

---

## Cross-Cutting Layout Rules

### Container Strategy
```
Marketing pages:     max-w-[1200px] mx-auto px-6 lg:px-8
Content pages:       max-w-3xl mx-auto px-4 (700px text)
Dashboard pages:     max-w-2xl mx-auto px-4 (640px content)
Full-width pages:    w-full (IDE, space residence)
```

### Motion Rules (Every Page)
1. Page enter: `opacity 0>1, y 12>0, 300ms ease-smooth`
2. Section stagger: `40ms between siblings`
3. Card entrance: `opacity 0>1, scale 0.96>1, y 24>0, spring silk`
4. Card hover: `brightness 1.05, shadow grow, y -2px`
5. No scale on hover (ever)
6. Respect `prefers-reduced-motion`

### Text Width Constraint
Body text never exceeds 700px regardless of container width. This is the single most impactful readability rule. Headings can span wider.

### Section Spacing
- Between major sections: 80-120px (spacious pages), 48-64px (dashboard pages)
- Between cards in grid: 24px (gap-6)
- Between content blocks within section: 16-24px

### Dark Mode Elevation
```
Level 0 (page):     #0A0A09  (--bg-ground)
Level 1 (card):     #141312  (--bg-surface)
Level 2 (hover):    #1A1917  (--bg-surface-hover)
Level 3 (modal):    #1E1D1B  (--bg-elevated)
Level 4 (tooltip):  #252521  (--bg-surface-active)
```

Never more than 4-5 levels. Each level is a slight lightening, not a color change.

### Gold Budget
- Logo: always
- Entry flow celebrations: yes
- Success states (checkmark, confetti): yes
- CTA buttons on marketing pages: yes (the 1% rule)
- Everything else: no

---

## Implementation Priority

**Wave 1: Core surfaces feel premium**
- Landing page (Option A: Declaration)
- Entry flow (preserve existing, add membership card)
- Home dashboard (Option A: Stream)
- Space residence (refine split panel)
- Profile (Option A: Portfolio)

**Wave 2: Discovery and depth**
- Explore page (Option A: Grid)
- About page (full section architecture)
- Settings (card-based sections)
- Lab dashboard (state-based layout)

**Wave 3: Builder ecosystem**
- Tool IDE (workshop density)
- Tool preview, deploy flows
- Template gallery
- Setup system

**Wave 4: Growth surfaces**
- Leaders page
- Rituals
- Calendar views
- Advanced profile features

---

## What Makes HIVE Feel Different From Everything Else

Based on competitive analysis:

1. **Dark mode as identity.** Every campus app is light-mode-default. HIVE's darkness is a statement.
2. **Restraint as luxury.** No emoji reactions on the landing page. No rainbow gradients. Ghost buttons. The whitespace IS the design.
3. **Spaces as rooms, not feeds.** You walk into a space. You don't scroll past it.
4. **Profile as portfolio.** Not a bio page. Proof of what you've built and where you belong.
5. **Entry as admission.** Not "sign up free." You enter with your campus email. The gate is the brand.
6. **No infinite scroll anywhere.** You come to do something, then leave. Attention aggregation, not attention extraction.

This is the position. Every layout decision serves it.
