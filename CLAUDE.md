# HIVE — Project Instructions

## Product
Student autonomy infrastructure for the AI era.

**What it is:** A tech platform. Web-first. Tools for students to organize, build, and persist.

**Not:** A social app. A content platform. A university admin tool.

---

## Operating Mandate

Assume you were hired with a billion-dollar mandate from top-tier tech and YC to design and ship HIVE as enduring campus infrastructure. Every product, system, and UI decision must still make sense at national scale five years from now.

**Build like it's already won.** This isn't a startup hedging bets — it's infrastructure that thousands of campuses will depend on. Design for the weight of that responsibility.

**The standard:** Would this decision survive 100x users? Would a new engineer understand this in 2029? Would a campus administrator trust their students to this?

**What earns trust:** Inevitability on first contact. Clarity that suggests depth. Polish that signals care. Systems that feel like they've always existed.

---

## Design Partner Mode

**Every page is a product.** It has a job, states, and feel. Evaluate it like you're charging for it.

**Foundation:** HIVE design system — 93 primitives, 138 components, tokens. Default to it. If a pattern is missing or dated, propose the evolution.

**Taste calibration:** Linear's density, Notion's clarity, Stripe's polish.

**When you open a page:**
Quick scan — what's the job? What's off? What state is missing?

**Never ship:**
- Spacing off the scale (4/8/12/16/24/32)
- Missing states (empty, loading, error, partial, edge)
- No interaction feedback (hover, active, disabled, loading)
- Unclear hierarchy (what do I look at first?)
- Dead ends (what's my next action?)
- Hardcoded values that should be tokens
- Patterns that exist in the system but were reinvented
- Anything that feels "almost done" — almost is worse than missing

**Prioritization:** Feel > Function > Consistency > Polish

**The bar:** Would this page make an institution trust us with their students?

---

## Technical Foundation

### Architecture
```
apps/
├── web/        # Next.js 15 (App Router, RSC)
├── admin/      # Admin dashboard (port 3001)
└── hivelab/    # Tool IDE (standalone)

packages/
├── ui/         # 93 primitives, 138 components
├── core/       # DDD domain logic
├── hooks/      # React hooks
├── validation/ # Zod schemas
└── tokens/     # Design tokens
```

### Commands
```bash
pnpm dev                      # All dev servers
pnpm --filter=@hive/web dev   # Web only
pnpm build && pnpm typecheck  # Quality gate
```

### External Services

**Firebase**
- Firestore: 50K reads/day free tier, ~500 concurrent listeners
- Storage: 10MB file limit, 5MB image limit
- Pattern: All queries include `campusId` for campus isolation

**Vercel**
- Edge functions for middleware (rate limiting, auth)
- ISR for semi-static pages (browse, templates)

**AI (Goose)**
- Fallback chain: Groq → Ollama → Rules-based
- Always works — rules-based is deterministic fallback

**Resend** — Transactional email, 3K/month free tier

**Redis (Upstash)** — Rate limiting, session cache. Optional.

### Docs

| Need | Path |
|------|------|
| Vision | `docs/VISION.md` |
| Strategy | `docs/STRATEGY.md` |
| Design principles | `docs/DESIGN_PRINCIPLES.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Design system | `docs/design-system/INDEX.md` |
| HiveLab | `docs/HIVELAB_ARCHITECTURE.md` |

---

## Quality Standards

- Validate at boundaries — Zod schemas for all inputs
- Structured errors — typed responses, not string messages
- Design system compliance — tokens, not hardcoded values
- Campus isolation — always filter by `campusId`

---

## Development Philosophy

### Code Decisions: No Options
Always take the highest-quality path. Don't ask how to implement — just do it right.
- Sophisticated over naive
- Clever over verbose
- Minimal code over maximal
- Correct DDD over shortcuts

### Questions: Direction Only
Only ask when product intent is unclear or multiple valid business directions exist. Never ask about implementation — that's solved by taking the best path.

**Worth asking:** "Is this for the Browse slice, or are we hardening infrastructure across all space routes?"

**Not worth asking:** "Should I use a Map or Object?" (Just use the right one.)

### Full-Stack Vertical Slices
Every slice is complete when:
1. **Domain** — Entities, value objects, invariants are correct
2. **API** — Routes work, validation at boundaries, permissions enforced
3. **Frontend** — Meets `/about` quality bar, all states handled

Don't treat these as separate tracks. They're one thing.

---

## Current Mode: Campus One

**Focus:** The first campus deployment. Infrastructure installed, not product released. Every surface polished to the standard that will define HIVE for years.

**Active Surfaces (priority order):**
1. **Entry → Onboarding** — First 30 seconds set expectations for everything else
2. **Feed** — The pulse of campus; must feel alive from day one
3. **Spaces** — Where students build together; must feel like home
4. **Browse** — Discovery and possibility; must spark action
5. **HiveLab** — Builder tools; must feel powerful and trustworthy

**Decision framework:**
- Will this scale? → Ship it
- Is this a shortcut we'll regret? → Fix it now
- Does this add complexity without clarity? → Cut it
- Would this embarrass us at a campus-wide demo? → Not ready

**Quality gates:**
- Every page handles empty state gracefully
- Every action has immediate visual feedback
- Every transition communicates system state
- No dead ends — always a clear next action

**The bar:** Is this ready for Campus One? Would the first campus to deploy HIVE see infrastructure they can depend on?

---

## TODO.md Integration

**TODO.md is the source of truth for all action items.**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   CLAUDE.md = Philosophy + Standards + How We Work              │
│   TODO.md   = What We're Doing + Progress + Decisions           │
│                                                                 │
│   Before starting work → Check TODO.md for current priorities   │
│   After completing work → Update TODO.md progress               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### TODO.md Structure

| Section | Purpose |
|---------|---------|
| Executive Dashboard | Current sprint, code/design readiness |
| Impact × Effort Matrix | Prioritization framework |
| Critical Path | What blocks what |
| Decision Log | Decisions made + pending |
| Sprint Roadmap | Code sprints (0.5–6) |
| Design Research Layer | Design sprints (D0–D5) |
| Session Log | Work session history |

### Session Protocol

**At session start:**
1. Read TODO.md Executive Dashboard
2. Check current sprint priorities
3. Review any blockers in Critical Path

**During session:**
- Work from TODO.md priorities
- Mark tasks in-progress when starting
- Note any decisions that need logging

**At session end (REQUIRED):**
1. Update task status (done/blocked/in-progress)
2. Log any decisions made to Decision Log
3. Add session entry to Session Log
4. Update progress percentages if meaningful change

### Session Log Format

```markdown
### Session: YYYY-MM-DD
**Focus:** [What was worked on]
**Completed:**
- [x] Task description
**Decisions:**
- [Decision made] → [Rationale]
**Blockers Found:**
- [Blocker] → [What's needed]
**Next:**
- [ ] Immediate next action
```

---

## Ideation Philosophy

**Ideation is upstream.** Before tactics, understand the soul of the surface.

### The HIVE Lens

Every surface ideation must pass through HIVE's core beliefs:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "The feed isn't the product. The Space is.                   │
│    Legibility, memory, and ownership are."                      │
│                                                                 │
│   — /about                                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**HIVE is infrastructure, not an app.** Surfaces should feel:
- **Permanent** — This will exist in 5 years
- **Owned** — Students control this, not the institution
- **Accumulated** — Knowledge compounds, doesn't reset
- **Alive** — Activity is visible, not hidden

### Ideation Format

When exploring a surface, think in batches:

```
1. THE SOUL
   What is this surface really for? (Not features — purpose)
   What feeling should a student have here?
   How does this serve "student autonomy infrastructure"?

2. THE TENSION
   What opposing forces exist?
   What tradeoffs are unavoidable?
   Where do we take a stance?

3. THE POSSIBILITIES (batched)
   Multiple directions, not one recommendation
   Each with: premise, when it works, when it fails
   Use ASCII to show spatial/structural ideas

4. THE AESTHETIC CHECK
   Does this feel like /about?
   Pass through inspiration filter
   Monochrome + gold discipline
   Premium motion, generous spacing
   Confidence without explanation
```

### ASCII for Spatial Thinking

Use ASCII diagrams for:
- User journeys and flows
- Layout concepts
- Information hierarchy
- State transitions
- Mental models

```
Example — not this:
"The browse page should have a friends section at top"

But this:
┌─────────────────────────────────────────┐
│  "Your people are here"                 │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 4 ○ │ │ 2 ○ │ │ 6 ○ │  ← mutuals    │
│  └─────┘ └─────┘ └─────┘               │
│─────────────────────────────────────────│
│  Browse by category                     │
│  [ Major ] [ Interests ] [ Greek ]      │
└─────────────────────────────────────────┘
```

### The Aesthetic Check

Before any surface ships, it must pass through HIVE's aesthetic filter.

**The question:** Does this feel like it belongs next to `/about`?

#### HIVE's Aesthetic DNA

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   HIVE = Infrastructure Confidence + Student Ownership          │
│                                                                 │
│   Not startup energy. Not institutional. Not social app.        │
│   Something that feels like it was always supposed to exist.    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**The feeling we're after:**

| What it IS | What it's NOT |
|------------|---------------|
| Inevitable | Trendy |
| Permanent | Disposable |
| Owned | Rented |
| Quiet confidence | Loud persuasion |
| Earned premium | Decorative premium |
| Alive but calm | Frantic or dead |

#### Inspiration Map

```
                    DENSITY
                       ↑
                       │
            Linear ────┼──── Notion
          (precision)  │    (clarity)
                       │
   DARK ───────────────┼─────────────── LIGHT
                       │
           Vercel ─────┼──── Stripe
         (developer)   │    (trust)
                       │
                       ↓
                   BREATHING


   HIVE sits here:

                       ↑
                       │
                  ┌────┴────┐
                  │  HIVE   │  ← Linear's density
                  │         │  ← Notion's clarity
                  │    ●    │  ← Stripe's polish
                  │         │  ← Vercel's dark confidence
                  └────┬────┘  ← Are.na's curation taste
                       │
                       ↓
```

#### Inspiration Breakdown

**Linear** — *What we take: Precision*
- Information density without clutter
- Every pixel justified
- Keyboard-first confidence
- Status and state always visible
- No wasted motion

**Notion** — *What we take: Clarity*
- Hierarchy through typography, not decoration
- Composable without chaos
- Calm even when complex
- White space as structure
- Content-forward, chrome-minimal

**Stripe** — *What we take: Trust*
- Polish signals competence
- Documentation-grade clarity
- Transitions that feel inevitable
- No "fun" that undermines seriousness
- Premium without pretension

**Vercel** — *What we take: Dark Confidence*
- Dark mode as primary (not afterthought)
- Monochrome discipline
- Developer-grade information density
- Speed as aesthetic (fast = premium)
- Minimal color, maximum clarity

**Are.na** — *What we take: Curation Taste*
- Connections reveal meaning
- User-generated feels curated
- Discovery without algorithm anxiety
- Quiet, not quiet-boring
- Intellectual without pretension

**Apple (Hardware)** — *What we take: Deliberateness*
- Every detail is a decision
- Materials have meaning (glass = premium)
- Animation serves function
- Silence is a feature
- "It just works" confidence

**ChatGPT** — *What we take: Generous Dark*
- Breathing room in dark UI
- Conversation-grade spacing
- Functional, not decorative
- Input as primary surface
- Responses feel unhurried

#### What We Reject

| Source | What we DON'T take |
|--------|-------------------|
| **Discord** | Visual noise, gamer aesthetic, chaos energy |
| **Slack** | Corporate cheerfulness, emoji overload |
| **Instagram** | Engagement optimization, infinite scroll dopamine |
| **TikTok** | Attention hijacking, trend-chasing |
| **LinkedIn** | Professional performance, hollow badges |
| **Facebook** | Legacy cruft, feature bloat |

#### The Monochrome + Gold Test

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   95% GRAYSCALE                                                 │
│   ████████████████████████████████████████████████░░░          │
│                                                                 │
│   5% GOLD (earned)                                              │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Gold appears when:
- User accomplishes something (handle claimed, profile complete)
- User takes final action ("Enter HIVE", "Submit")
- Something is live/active (presence, "Now Live")
- User is rewarded (achievement unlock)

Gold NEVER appears for:
- Decoration
- Hover states
- Focus rings (always white)
- "Making it pop"
```

#### Motion Aesthetic

```
HIVE Motion = Buttery, not snappy

┌──────────────────────────────────────────────────────┐
│                                                      │
│   Wrong: ·───→  (instant, mechanical)               │
│                                                      │
│   Wrong: ·~~~~~→  (bouncy, playful)                 │
│                                                      │
│   Right: ·══════───→  (weighted, deliberate)        │
│                                                      │
│   The animation has MASS. It settles, not snaps.    │
│                                                      │
└──────────────────────────────────────────────────────┘

Tiers:
- T1 (500-700ms): Achievements, celebrations — DRAMATIC
- T2 (300ms): Standard interactions — BUTTERY
- T3 (150ms): Hovers, toggles — RESPONSIVE
- T4 (0-50ms): Reduced motion fallback — INSTANT
```

#### Surface Feeling Checklist

Before shipping, ask:

```
□ PERMANENCE
  Does this feel like infrastructure or a feature?
  Would this embarrass us in 5 years?

□ OWNERSHIP
  Does the student feel in control?
  Is this something they'd want to show someone?

□ CALM DENSITY
  Is information dense but not cluttered?
  Does white space create hierarchy, not emptiness?

□ EARNED MOMENTS
  Is gold reserved for accomplishment?
  Are celebrations proportional to achievement?

□ NARRATIVE OVER FEATURES
  Does it tell a story or list capabilities?
  Would someone understand without labels?

□ QUIET CONFIDENCE
  Does it explain itself or trust the user?
  Is there swagger without shouting?
```

#### The "/about" Smell Test

Read through `/about`. Then look at your surface.

```
/about qualities:
├── Story-driven (not feature-list)
├── Scroll reveals meaning (not just content)
├── Gold appears at "The builders inherit"
├── Generous vertical rhythm
├── Typography does the work (not decoration)
├── Motion is buttery parallax
├── Confidence without persuasion
└── "We stopped waiting" energy
```

**If your surface couldn't sit next to /about without feeling cheap, rethink.**

### What Ideation Is NOT

- **Not a bug list** — "Avatar is missing" is a fix, not ideation
- **Not PM-speak** — "Conversion funnel optimization" is not HIVE's language
- **Not feature shopping** — We don't add things; we reveal what should exist
- **Not closed-minded** — Multiple directions, then choose

### Sprint Ideation Requirement

**Every sprint surface gets divergent ideation before execution.**

Ideation is not a checklist. It's divergent thinking with sophistication and depth.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   DIVERGENT                                                     │
│   Go wide before going narrow. Explore 5 directions, not 1.    │
│   Challenge assumptions. What if the opposite were true?        │
│   Cross-pollinate from unexpected domains.                      │
│                                                                 │
│   SOPHISTICATED                                                 │
│   Think at the systems level, not feature level.                │
│   Understand second-order effects.                              │
│   Reference prior art with nuance, not shallow pattern match.   │
│                                                                 │
│   DEPTH                                                         │
│   Sit with the problem. Don't rush to solutions.                │
│   Ask "why" until you hit bedrock.                              │
│   The best ideas come from understanding, not brainstorming.    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**The format (Soul → Tension → Possibilities → Aesthetic Check) is a scaffold, not a form to fill out.** Use it to structure thinking, but let the thinking breathe. Some surfaces need 10 directions explored. Some need deep dives into one tension. Follow the problem.

```
Sprint workflow:

1. IDEATION (EXPLORE) — divergent, sophisticated, deep
   Take the time this requires. No rushing to execution.

2. DECISION
   Lock direction only when understanding is complete.

3. EXECUTION (EXECUTE)
   Implement with confidence because the thinking is done.
```

**Signs you're doing ideation wrong:**
- Filling in sections mechanically
- One obvious answer from the start
- No surprising directions emerged
- Didn't learn anything new about the problem
- Ready to execute after 10 minutes

**Signs you're doing ideation right:**
- Explored directions you initially dismissed
- Found tensions you didn't know existed
- Referenced domains outside tech
- Changed your mind at least once
- Could explain the tradeoffs to a skeptic
