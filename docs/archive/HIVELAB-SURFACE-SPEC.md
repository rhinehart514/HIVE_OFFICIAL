# HiveLab

**The system that answers: "I have an idea — watch what happens."**

HiveLab is HIVE's creation engine. A student types a sentence. HiveLab figures out the best format, produces a live interactive experience, and puts it in front of their campus. The student doesn't build anything. They don't configure anything. They express intent, and HiveLab makes it real.

The tab in the nav bar is labeled **Make**.

---

## Why HiveLab Matters

HiveLab is not a feature. It is the product. Everything else in HIVE — spaces, feed, profile, notifications — is distribution and feedback for what HiveLab creates. Without HiveLab, HIVE is another campus directory. With it, HIVE is the only place where a student can say one sentence and have their entire campus respond.

### Transformational Value Props

These are not incremental improvements to existing tools. These are things that were literally impossible before HIVE.

**1. Zero-to-audience in one sentence**
Before HIVE, reaching 200 people on your campus required a following, a platform, and a distribution channel. A freshman with zero followers could not do it. HiveLab makes it possible — type a sentence, it becomes a thing, it enters the campus, people engage. You went from zero to audience without earning it first. That's TikTok's fundamental insight applied to campus.

**2. Campus becomes responsive**
Before HIVE, campus is static infrastructure. You can't ask your campus a question and get an answer. With HiveLab, the campus becomes something you talk to and get a response from. "Best dining hall?" — your campus answers. "Who's coming Saturday?" — your campus answers. The campus stops being a place and becomes a thing that responds.

**3. Ideas become real without skills**
The gap between "I had a thought" and "people are using it" is enormous for most students. With HiveLab, the gap is one sentence. No code. No form builder. No design skills. You said it, now it exists, now 50 people are using it.

**4. Participation without social cost**
Joining a community normally means showing up physically and introducing yourself. With HiveLab creations, you vote on a poll, RSVP to an event, play a quiz. You're participating in your campus before you walk into a room. You belong through action, not introduction.

### What Students Actually Say

Students don't think in value props. They think in moments:

- "I made a poll 2 hours ago and 200 people voted??"
- "bro I literally just typed a sentence and it made the whole thing"
- "I found this club through a bracket and now I'm going thursday"
- "I asked which dining hall is best and the whole campus has opinions"

The value is felt, not understood. The product's job is to engineer these moments.

---

## The Capability Model

HiveLab isn't a fixed set of formats. It's an AI that can build anything a student thinks of. The capability surface has three tiers:

### Tier 1: Native Shells (instant, reliable, real-time)

Pre-built interactive formats with structured config, RTDB real-time state, and polished UI. The classifier routes common prompts here. This is where 80% of student intent should land.

| Format | Student says... | Interaction | State |
|--------|----------------|-------------|-------|
| **Poll** | "best dining hall" | Vote on options, see live % | `votes`, `voteCounts`, `closed` |
| **Bracket** | "rate the professors" | Head-to-head matchups, round progression | `matchups`, `currentRound`, `winner` |
| **RSVP** | "who's coming saturday" | Toggle attending, see attendee list | `attendees`, `count` |
| **Signup List** | "volunteer for the bake sale" | Claim slots with capacity limits | `signups` per slot |
| **Quiz** | "how well do you know UB" | Multi-question, scoring, results | `responses`, `scores` |
| **Hot Take** | "pineapple on pizza" | Agree/disagree binary, see live % | `votes`, `agreeCount`, `disagreeCount` |
| **Ranked Choice** | "rank the campus cafes" | Drag-to-rank, aggregate results | `rankings`, `aggregateOrder` |
| **Countdown** | "days until spring fest" | Passive — visual timer | None (computed client-side) |
| **Q&A** | "ask me anything about rush" | Submit questions, upvote | `questions`, `upvotes` |
| **Tier List** | "tier list campus buildings" | Drag items into S/A/B/C/D/F | `placements`, `aggregateTiers` |

**Architectural pattern:** Each shell has a config type (what the creator sets up), a state type (what changes at runtime via interaction), a React component, a Zod validation schema, and classifier hints. Adding a new shell is 1-2 days of work.

**Current state:** Poll, Bracket, RSVP exist. The remaining 7 need to be built.

### Tier 2: AI-Generated Experiences (10-15s, HIVE SDK, variable quality)

For intents that don't match any shell — the weird, specific, creative ideas. HiveLab generates HTML/CSS/JS that uses the HIVE SDK for persistence, real-time state, and user identity.

Examples of what Tier 2 handles:
- "Bathroom ranker for UB campus"
- "Anonymous confession board"
- "Campus bingo card"
- "Find your study buddy matcher"
- "Best campus outfit photo wall"
- "Predict the game score"

These work because the HIVE SDK (`window.HIVE`) gives generated code:
- `HIVE.getState()` / `HIVE.setState()` — persistent shared state via RTDB
- `HIVE.onStateChange(cb)` — real-time updates across users
- `HIVE.getContext()` — user identity (userId, displayName, role)
- `HIVE.createPost()` — post to space feed
- `HIVE.getMembers()` — read space member list
- HIVE design tokens — CSS custom properties for native look and feel

The generated code runs in a sandboxed iframe with a postMessage bridge to the parent app. The parent handles all RTDB reads/writes on behalf of the iframe.

**Quality depends on the AI model.** Current: Groq llama-3.3-70b (~5-8s, medium quality). Upgrade path: Claude Sonnet or GPT-4o (~10-15s, high quality). The infrastructure is model-agnostic — upgrading the model is a config change, not a rewrite.

### Tier 3: Open Canvas (full creative freedom)

Same code gen path as Tier 2, but for prompts so novel that no pattern helps. The AI generates its best attempt. Quality varies. This is where the ambiguity and surprise lives — "I don't know what it'll make, and that's exciting."

### Graduation Path

As students create via Tier 2/3, patterns emerge. Popular patterns graduate upward:
- Many students create confession boards via code gen → build a Confession shell (Tier 1)
- Many students create rankers via code gen → build a Ranker shell (Tier 1)

The capability surface expands organically based on what students actually want.

```
Tier 3 (novel) → observe patterns → Tier 2 (template hint) → prove demand → Tier 1 (native shell)
```

---

## Creation Flow

### The Pipeline

```
Student types prompt
        |
        v
  ┌────────────┐
  │ Classifier  │  Groq llama-3.3-70b, ~500ms
  │             │  Returns: format, confidence, config
  └──────┬─────┘
         |
    confidence > 0.5        confidence <= 0.5
    + native format?         or format = 'custom'
         |                        |
         v                        v
  ┌──────────────┐        ┌──────────────┐
  │ Shell Match  │        │ Code Gen     │  Streaming, 10-15s
  │ Instant      │        │ HIVE SDK     │
  │ Config editor│        │ Live preview │
  └──────┬───────┘        └──────┬───────┘
         |                       |
         v                       v
  ┌──────────────────────────────────┐
  │ Deploy                           │
  │ Standalone URL + campus feed     │
  │ Optional: place in a space       │
  └──────────────────────────────────┘
```

### What the Student Sees

**Idle:** Prompt textarea + example chips. "Make something. Describe it — we figure out the format."

**Classifying (~500ms):** Spinner — "Understanding your idea..."

**Shell matched (instant):** Format badge ("Poll detected") + live preview + inline config editor. Student can edit question/options/settings. "Deploy" button + "Make it custom" escape hatch.

**Generating (10-15s, streaming):** Live iframe preview building in real-time. Status text updates as code streams in. The student watches their idea become real.

**Live:** The creation exists. (See "Output Model" below.)

**Error:** "Something went wrong. Try again." Always recoverable.

### Auth Gate

Non-authenticated users can create and preview. Auth wall appears at deploy. Pending state saves to localStorage. After auth, creation restores and deploys automatically. This lets anyone feel the magic before asking for signup.

---

## Output Model

### Principle: The Student Never Manages Distribution

The student creates. The platform distributes. The student's only job is to share the link if they want to.

### What Happens on Deploy

Every creation, regardless of type, gets:

1. **A standalone URL** (`/t/{toolId}`) — always, automatically. Works without auth for viewers. This is the shareable artifact.
2. **Campus feed visibility** — new creations surface in the feed. This is passive discovery.
3. **A place on the creator's profile** — under "My Apps." This is the creator feedback loop.

Optionally:
4. **Space placement** — if the creator came from a space (via `?spaceId`), the creation auto-places there and members get notified. If not, space placement is offered as a gentle suggestion, not a gate.

### Post-Creation Screen

```
┌─────────────────────────────────────────┐
│                                         │
│  Your [name] is live                    │
│                                         │
│  [Live preview with engagement counter] │
│  0 [interactions] so far                │
│                                         │
│  [ Share link ]                         │
│                                         │
│  Visible on campus · Edit anytime       │
│                                         │
│  ┌─ Optional ─────────────────────┐     │
│  │ Add to a space?                │     │
│  │ [Space 1]  [Space 2]  [Skip]  │     │
│  └────────────────────────────────┘     │
│                                         │
│  [Make something else]                  │
│                                         │
└─────────────────────────────────────────┘
```

- Primary action: **Share link.** This is what they came for.
- Status: "Visible on campus" — it's in the feed. No decision needed.
- Optional: Add to a space. This is a bonus, not a gate.
- Engagement counter starts at 0 and updates in real-time.

### For Org Leaders (from space context)

When a leader creates from within their space:

```
┌─────────────────────────────────────────┐
│                                         │
│  Your poll is live in SDA @ UB          │
│                                         │
│  [Live preview]                         │
│  0 votes so far                         │
│                                         │
│  Members will be notified               │
│                                         │
│  [ Share link ]  [ Back to SDA ]        │
│                                         │
└─────────────────────────────────────────┘
```

No decisions. Auto-placed. Members notified. Done.

---

## The HIVE SDK

The bridge that makes "build anything" work. Every AI-generated experience gets access to `window.HIVE`.

### API Surface

```typescript
// State — persistent, shared across all users, real-time
HIVE.getState()                    // → { personal: {}, shared: {} }
HIVE.setState(updates)             // optimistic local + persisted to RTDB
HIVE.onStateChange(callback)       // real-time subscription

// Identity
HIVE.getContext()                  // → { userId, displayName, spaceId, spaceName, role }

// Social
HIVE.createPost({ content })       // post to space feed
HIVE.getMembers({ limit })         // read space members

// UX
HIVE.notify(message, type)         // toast notification
```

### Architecture

```
┌──────────────────────────┐     ┌──────────────────────────┐
│  Sandboxed iframe        │     │  HIVE parent app         │
│                          │     │                          │
│  Generated HTML/CSS/JS   │ ←→  │  postMessage bridge      │
│  window.HIVE SDK         │     │  RTDB reads/writes       │
│                          │     │  API proxy               │
│  sandbox="allow-scripts" │     │  State management        │
└──────────────────────────┘     └──────────────────────────┘
```

The SDK is injected as a `<script>` tag into every generated app's iframe document. All state operations go through postMessage to the parent app, which handles RTDB persistence. The iframe never touches Firebase directly.

### Current State

The HIVE SDK, postMessage bridge, and parent-side handler **all exist and are implemented**:
- SDK: `packages/ui/src/lib/hivelab/hive-sdk.ts`
- Renderer: `packages/ui/src/design-system/components/hivelab/CustomBlockRenderer.tsx`
- Handler: `packages/ui/src/components/hivelab/elements/custom/custom-block-element.tsx`

### What Needs Fixing

1. The `/build` page preview does not inject the HIVE SDK. Creators can't test interactive features until after deploy.
2. The system prompt tells the AI about `window.HIVE` but needs more examples of correct SDK usage patterns.
3. The standalone page (`/t/[toolId]`) needs to render shell-type tools via `ShellRenderer`, not just `ToolCanvas`.

---

## Classifier

### Current Implementation

- Model: Groq `llama-3.3-70b-versatile`
- Latency: ~500ms
- Output: `{ format, confidence, config }`
- Fallback: on any error, returns `{ format: 'custom', confidence: 0, config: null }`

### Format Routing

| Confidence | Format | Route |
|------------|--------|-------|
| > 0.5 | Native shell (poll, bracket, rsvp, ...) | Tier 1: Shell match — instant preview + config editor |
| > 0.5 | template hint (ranker, confession, bingo, ...) | Tier 2: Code gen with pattern guidance |
| <= 0.5 | custom | Tier 2/3: Open code gen |

### Expansion Plan

The classifier's system prompt currently handles 4 formats (poll, bracket, rsvp, custom). As shells are added, the prompt expands. If accuracy drops below 80% with 10+ formats, move to two-stage classification: broad category first (opinion, coordination, competition, expression, open), then specific format within category.

---

## Shell System

### Architecture

Each shell is a self-contained format:

```
Shell = {
  displayName: string          // "Poll"
  icon: string                 // "bar-chart-2"
  configSchema: ZodSchema      // validates creator input
  defaultConfig: Config        // blank starting config
  component: LazyComponent     // React component
}
```

**Config** = what the creator sets up (question, options, title, date)
**State** = what changes at runtime via user interaction (votes, RSVPs, scores)
**Component** = the interactive UI that renders config + state

State lives in Firebase RTDB at `shell_states/{toolId}`. Real-time via `useShellState` hook. All interactions are optimistic with RTDB reconciliation.

### Registry

All shells register in `SHELL_REGISTRY` (`apps/web/src/lib/shells/index.ts`). The registry is the single source of truth for available formats.

### Current Shells (3)

| Shell | Config | State | Component | Status |
|-------|--------|-------|-----------|--------|
| Poll | question, options, multiSelect, timer, anonymous | votes, voteCounts, closed | PollCard | Ships |
| Bracket | topic, entries, roundDuration | matchups, currentRound, winner | BracketCard | Ships |
| RSVP | title, dateTime, location, capacity, deadline | attendees, count | RSVPCard | Ships |

### Planned Shells (7)

| Shell | Priority | Effort | Classifier hints |
|-------|----------|--------|-----------------|
| Signup List | P0 | 1-2 days | "sign up", "volunteer", "slots", "who wants to" |
| Hot Take | P0 | 1 day | "agree or disagree", "hot take", "do you think", binary opinion |
| Countdown | P0 | 1 day | "countdown", "days until", "how long until" |
| Quiz | P1 | 2-3 days | "quiz", "trivia", "how well do you know", "test" |
| Ranked Choice | P1 | 2 days | "rank", "order", "top 5", "favorite to least" |
| Q&A | P1 | 2 days | "ask me anything", "AMA", "questions for", "Q&A" |
| Tier List | P2 | 2 days | "tier list", "S tier", "rank into tiers" |

---

## Iterate / Edit

### Shell Apps

Shell apps edit by changing config fields. Inline editors exist for poll, bracket, RSVP on the `/build` page. The studio page (`/build/[toolId]`) needs shell config editors (currently only supports code iteration).

| Format | Editable after deploy | Constraint |
|--------|----------------------|------------|
| Poll | Question, options | Editing options after votes resets counts (with confirmation) |
| Bracket | Topic, entries | Locked after first round of voting |
| RSVP | All fields | Existing RSVPs preserved |

### Code Gen Apps

Iterate via natural language prompts on the studio page:
1. Creator types "add more bathrooms" or "make the stars bigger"
2. `POST /api/tools/generate` with `existingCode` + `isIteration: true`
3. AI generates updated code, streaming to preview
4. Auto-saved on completion

---

## Campus Context

AI-generated experiences should feel campus-aware. The generation prompt can be enriched with:

- **Campus data:** building names, common locations, dining halls
- **Space context:** if creating for a specific space — org name, member count, category
- **Temporal context:** current events, time of year, semester phase

This context injection makes "bathroom ranker for UB" produce a ranker pre-populated with actual UB buildings, not generic placeholders.

Implementation: enrich the `spaceContext` field already accepted by `/api/tools/generate` with campus-level data from the CampusLabs seed.

---

## Engagement Feedback

The creator's reward for creating is watching the numbers move. Every creation needs visible, real-time engagement signals:

### Live Counter
Every creation — shell or code gen — shows an engagement count:
- Polls: "X votes"
- RSVPs: "X attending"
- Brackets: "X votes"
- Code gen: "X interactions" (tracked via HIVE SDK `setState` calls)

The counter appears on: the standalone page, the space apps tab, the campus feed card, the creator's profile, and the My Apps section on Build home.

### Creator Notifications
- First interaction: "Someone voted on your poll"
- Milestones: "Your poll hit 50 votes"
- Daily digest: "23 people used your creations yesterday"

### Profile Impact
The creator's profile shows total engagement across all creations. The hero stat is not "3 apps" — it's "412 people engaged with your stuff."

---

## What Exists (Code Assessment)

### Ships

| Component | Location | Status |
|-----------|----------|--------|
| Build page (prompt + preview) | `apps/web/src/app/(shell)/build/page.tsx` | Ships |
| Build machine (state machine) | `apps/web/src/hooks/use-build-machine.ts` | Ships |
| Classify API (Groq) | `apps/web/src/app/api/tools/classify/route.ts` | Ships |
| Generate API (streaming) | `apps/web/src/app/api/tools/generate/route.ts` | Ships |
| Shell registry | `apps/web/src/lib/shells/index.ts` | Ships |
| Shell components (3) | `apps/web/src/components/shells/` | Ships |
| HIVE SDK | `packages/ui/src/lib/hivelab/hive-sdk.ts` | Ships |
| postMessage bridge | `packages/ui/src/components/hivelab/elements/custom/` | Ships |
| Sandboxed renderer | `packages/ui/src/design-system/components/hivelab/CustomBlockRenderer.tsx` | Ships |
| Build studio (iterate) | `apps/web/src/app/(shell)/build/[toolId]/page.tsx` | Ships |
| Browse page | `apps/web/src/app/(shell)/build/browse/page.tsx` | Ships with fixes |
| Standalone page | `apps/web/src/app/t/[toolId]/` | Ships with fixes |
| Tool CRUD APIs | `apps/web/src/app/api/tools/` | Ships |
| Deploy API | `apps/web/src/app/api/tools/[toolId]/deploy/route.ts` | Ships |
| Auth gate + pending deploy | `use-build-machine.ts` localStorage flow | Ships |

### Broken (P0 fixes needed)

| Issue | Impact | Fix |
|-------|--------|-----|
| Shell tools render empty on `/t/[toolId]` | Voting impossible | Branch on `tool.type === 'shell'` → render `ShellRenderer` |
| RTDB state never initialized for shells | Vote counts undefined/NaN | Write initial `shell_states/{toolId}` in `acceptShell()` |
| `acceptShell()` doesn't deploy to space | Placement loop broken | Call deploy route when `originSpaceId` present |
| Build preview has no HIVE SDK | Code gen preview non-interactive | Use `CustomBlockRenderer` or inject SDK |
| Browse empty state links to `/lab` | Dead navigation | Fix to `/build` |
| Error boundary links to `/lab/create` | Dead navigation | Fix to `/build` |

### Missing (to build)

| Component | Priority | Purpose |
|-----------|----------|---------|
| 7 new shell formats | P0-P2 | Expand capability surface |
| My Apps section on Build home | P0 | Creator sees what they've built |
| Post-creation share screen | P0 | Share link + optional space placement |
| Push notification on placement | P0 | Reach mechanism |
| Campus feed "New" section for creations | P1 | Passive discovery |
| Live engagement counter (all surfaces) | P1 | Creator feedback loop |
| Campus context injection in gen prompt | P1 | UB-aware generation |
| Creator milestone notifications | P2 | Retention |
| Remix flow (fork someone's creation) | P2 | Already exists on standalone page, needs polish |

---

## What We Are NOT Building

| Feature | Why not |
|---------|---------|
| Full code IDE / drag-and-drop canvas | Killed. Prompt-first is the bet. |
| Template gallery | If classification + shells work, templates are unnecessary. |
| Visual tool composer (27-element system) | Dead code, removed. Too complex. |
| Automation builder (triggers, conditions) | Way too complex for launch. |
| Analytics dashboard per tool | Stats on cards are enough. Dedicated analytics is post-launch. |
| Cross-campus marketplace | Campus-scoped only at launch. |
| Payment-enabled tools | Requires payment infra we don't have. |
| Multi-page apps | Single iframe limitation. One creation = one page. |
| External API access from generated code | Security boundary. Sandboxed. |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Classification latency | < 800ms |
| Shell preview render | Instant (< 100ms after classification) |
| Code gen streaming start | < 2s (first chunk visible) |
| Code gen total time | < 15s for typical prompts |
| Deploy (save + init state) | < 1s |
| Standalone page load | < 1.5s LCP |
| Vote/RSVP/interaction response | < 200ms (optimistic UI) |
| Real-time state sync | < 500ms across users |

---

## The Student's Mental Model

The student doesn't know about shells, code gen, HIVE SDK, RTDB, or tiers. They know:

1. **I type what I'm thinking.**
2. **Something appears.** Sometimes instantly, sometimes I watch it build.
3. **I share the link.** Or it just shows up on campus.
4. **People use it.** The number goes up.
5. **I make another one.** Because that felt good.

Everything in this spec exists to make those five steps feel like magic.

---

## Capability Benchmarks

Instead of feature checklists, HiveLab's progress is measured by what students can DO:

| Benchmark | Target | How |
|-----------|--------|-----|
| Can a student reach 10 people from one action? | Launch | Space placement + push notification |
| Can a student reach 50 people? | Launch | Campus feed + standalone URL |
| Can a student reach people NOT on HIVE? | Launch | Standalone URLs work without auth |
| Idea to live in 60 seconds? | Launch | Shell classification path |
| Idea to live in 15 seconds? | Launch | Inline slash commands in spaces |
| Idea to 50 responses in 24 hours? | Month 1 | Distribution + notification + feed |
| Can students create 10+ distinct types of experiences? | Launch | 10 shells + code gen |
| Can the AI build something it's never seen before? | Launch | Tier 2/3 code gen with HIVE SDK |
| Does the platform get smarter over time? | Month 2+ | Pattern graduation: Tier 3 → 2 → 1 |
