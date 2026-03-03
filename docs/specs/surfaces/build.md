# Build Surface (`/build`)

The system that answers: "I have an idea -- how do I make it real and get it to my people?"

Build is the creation hub. Prompt-first, classification-routed, mobile-native. A student types what they want, HIVE figures out the best format, and within 60 seconds they have a live app they can place in their space and share. The tab in the nav bar is labeled **Make**.

**Decision filter:** Does this get a working app into a space and in front of members faster?

**Core insight:** Creation without distribution is useless. The hardest part is not making the poll -- it's getting 50 people to vote on it. Build must own the full loop: prompt -> create -> place -> share -> see impact. If any step breaks, the creator never comes back.

---

## Existing Code Assessment

### What Ships (Ready or Near-Ready)

| Component | Location | Status |
|-----------|----------|--------|
| Build page (prompt + split preview) | `apps/web/src/app/(shell)/build/page.tsx` | **Ships.** Prompt input, shell config editors, code preview, deploy gate, auth redirect. |
| Build machine (state machine) | `apps/web/src/hooks/use-build-machine.ts` | **Ships.** 6-phase reducer: idle -> classifying -> shell-matched/generating -> complete -> error. Solid. |
| Classify API (Groq llama-3.3-70b) | `apps/web/src/app/api/tools/classify/route.ts` | **Ships.** ~500ms, structured JSON output, graceful fallback to custom. |
| Generate API (streaming code gen) | `apps/web/src/app/api/tools/generate/route.ts` | **Ships.** NDJSON streaming, rate limiting, iteration support, usage tracking. |
| Shell registry (poll/bracket/rsvp) | `apps/web/src/lib/shells/index.ts` | **Ships.** Zod schemas, lazy-loaded components, config defaults. |
| Shell types + state types | `apps/web/src/lib/shells/types.ts` | **Ships.** Full config + realtime state types for all 3 formats. |
| Tool creation utility | `apps/web/src/lib/hivelab/create-tool.ts` | **Ships.** createBlankTool, generateToolName, formatRelativeTime. |
| Browse page (campus tools directory) | `apps/web/src/app/(shell)/build/browse/page.tsx` | **Ships with changes.** Category filter + Rising section. Needs "My Apps" and remix. |
| Build studio (edit/iterate page) | `apps/web/src/app/(shell)/build/[toolId]/page.tsx` | **Ships.** Preview + iterate chat, deploy-to-space picker, version history. |
| QuickStartChips | `apps/web/src/components/hivelab/dashboard/QuickStartChips.tsx` | **Ships.** Two variants (primary grid / secondary pills). |
| Space deployment service | `packages/core/src/application/spaces/space-deployment.service.ts` | **Ships.** PlaceToolInput with placement location, visibility, state isolation. |
| Navigation config | `apps/web/src/lib/navigation.ts` | **Ships.** 4-tab model, "Make" label on Build tab with green accent. |

### What Changes

| Component | Change Required |
|-----------|----------------|
| Build page (`/build`) | Add "My Apps" section below prompt. Add "Place in Space" step after creation. |
| Browse page | Wire up to real data (currently calls `/api/campus/tools` which may not exist). Add remix/use button. |
| Build studio | Add shell-format editing (currently only supports code iteration). Add usage stats header. |
| Complete phase | Add "Place in Space" as primary CTA instead of just "Copy link". |

### What's Missing

| Component | Priority |
|-----------|----------|
| My Apps query + UI | **P0** -- creators can't see what they've built |
| Place-in-Space flow (post-creation) | **P0** -- apps die if they aren't placed somewhere |
| Share mechanics (link + push notification) | **P0** -- the distribution step |
| Usage stats (votes, RSVPs, views per app) | **P1** -- creator feedback loop |
| Shell editing for deployed apps | **P1** -- change poll options after deploy |
| New shell formats (signup-list, countdown, quiz) | **P1** -- expand what's instant |

---

## 1. Build Home (`/build`)

### Layout (Mobile-First)

```
/build
+--------------------------------------------------+
|  [Make] tab active, green accent                  |
+--------------------------------------------------+
|                                                   |
|  "Make something"                                 |
|  Describe it. We figure out the format.           |
|                                                   |
|  +--------------------------------------------+  |
|  | [textarea: "Best dining hall on campus"]  > |  |
|  +--------------------------------------------+  |
|                                                   |
|  [Quick-start chips: Poll | Bracket | RSVP | ...] |
|                                                   |
|  ---- My Apps ----                                |
|  [App card] [App card] [App card]                 |
|  See all ->                                       |
|                                                   |
|  ---- Browse Campus Apps ----                     |
|  [Rising: 3 cards]                                |
|  Explore all ->                                   |
|                                                   |
+--------------------------------------------------+
|  [Home] [Spaces] [Make*] [You]                    |
+--------------------------------------------------+
```

### Prompt Input (exists -- ships as-is)
- Textarea with auto-resize (56px min, 160px max)
- Send button right-aligned inside field
- Auto-submit from `?prompt=` query param (for deep links from spaces)
- Example chips below in idle state: "Best dining hall on campus", "Who's coming to the pregame", "Rate the professors bracket", "Study group signup sheet"

### Quick-Start Chips (exists -- wire to shell creation)
- One chip per native shell format: **Poll**, **Bracket**, **RSVP**
- Click -> pre-fill prompt with format hint -> submit through classify pipeline
- Uses `QuickStartChips` component in secondary variant

### My Apps Section (NEW -- P0)

Shows the creator's own apps, most recent first. This is the "what have I built" view that currently doesn't exist.

**Query:** `GET /api/tools?mine=true&limit=6&sort=updatedAt`

**Card layout (compact):**
```
+------------------------------------------+
| [icon]  Best Dining Hall Poll            |
|         23 votes  ·  in SDA Space        |
|         2h ago                           |
+------------------------------------------+
```

Each card shows:
- App name
- Key metric (votes for poll, entries for bracket, RSVPs for rsvp, views for code)
- Which space it's placed in (if any) -- or "Not placed yet" in amber
- Relative time since last activity

**Actions on card:**
- Tap -> navigate to `/build/{toolId}` (edit/iterate page)
- "Not placed yet" -> open Place-in-Space sheet

**Empty state:** "Apps you make show up here. Try typing what you need above."

### Browse Section (exists -- link to `/build/browse`)
- Show top 3 Rising apps inline
- "Explore all" link to full browse page

---

## 2. Creation Flow (State Machine)

### The Build Machine (exists -- document as-is)

Location: `apps/web/src/hooks/use-build-machine.ts`

```
                    submitPrompt(text)
                          |
                          v
                    +----------+
                    |   idle   |
                    +----------+
                          |
                          v
                    +--------------+
                    | classifying  |  POST /api/tools/classify (~500ms)
                    +--------------+
                       /         \
              native+conf>0.5   custom or low conf
                     /             \
                    v               v
          +---------------+   +------------+
          | shell-matched |   | generating |  POST /api/tools/generate (streaming)
          +---------------+   +------------+
           |      |               |
     editConfig  escalateToCustom |
           |      |               |
           v      +--------->-----+
       acceptShell                |
           |                      v
           v               +----------+
      +----------+         | complete |
      | complete |         +----------+
      +----------+
           |
           v
     DEPLOY_COMPLETE (toolId set)
```

**States:**

| Phase | What's happening | User sees |
|-------|-----------------|-----------|
| `idle` | Waiting for input | Prompt textarea + example chips |
| `classifying` | POST to `/api/tools/classify` | Spinner: "Understanding your idea..." |
| `shell-matched` | Native format detected (conf > 0.5) | Shell preview + config editor + "Deploy" / "Make it custom" |
| `generating` | Streaming code from `/api/tools/generate` | Live iframe preview with status text |
| `complete` | App created, toolId assigned | "Your app is live" + Share/Edit/Place actions |
| `error` | Something broke | Error message + "Try again" |

**Key transitions:**
- `submitPrompt(text)` -> idle to classifying, then auto-routes based on classification
- `updateShellConfig(config)` -> edits the shell config in shell-matched phase
- `acceptShell()` -> creates tool via API, sets status to published, transitions to complete
- `escalateToCustom()` -> abandons shell match, kicks off full code generation
- `reset()` -> back to idle

### Classification API

Location: `apps/web/src/app/api/tools/classify/route.ts`

- Model: Groq `llama-3.3-70b-versatile`, temperature 0.1
- Schema: `{ format: poll|bracket|rsvp|custom, confidence: 0-1, config: {...} | null }`
- Latency: ~500ms
- Fallback: if Groq fails, returns `{ format: 'custom', confidence: 0, config: null }`
- Rate limit: AI preset

### Generation API

Location: `apps/web/src/app/api/tools/generate/route.ts`

- Streaming NDJSON response
- Chunk types: `thinking`, `code`, `complete`, `error`
- Supports iteration: `existingCode` + `isIteration: true` for edits
- Rate limited per user (authenticated) or per IP (anonymous)
- Daily usage cap with `canGenerate()` / `recordGeneration()`

### Auth Gate

Non-authenticated users can create (see preview) but hit a signup wall at deploy:
1. Creation state saved to `localStorage` (`hive_pending_deploy`)
2. Redirect to `/enter?redirect=/build`
3. On return, `loadPendingDeploy()` restores state and auto-submits

---

## 3. Placement Flow (Post-Creation) -- NEW, P0

**The gap:** After creation, the user sees "Copy link" and "Edit". But most apps are useless without being placed in a space where members can see them. A poll with 0 voters is a dead poll.

### Place-in-Space Step

After `complete` phase, the primary CTA changes based on context:

**Case 1: Created from a space** (`?spaceId=xxx` in URL)
- Primary CTA: "Add to [Space Name]" (auto-place, one tap)
- Secondary: "Place somewhere else" (open picker)

**Case 2: Created from /build (no space context)**
- Primary CTA: "Place in a Space" (open space picker sheet)
- Secondary: "Just share the link"

### Space Picker Sheet

Bottom sheet (mobile) / dropdown (desktop) showing spaces where the user has placement permission (owner, admin, moderator, leader, builder roles).

```
+------------------------------------------+
|  Place this app                           |
|                                           |
|  Your Spaces                              |
|  +--------------------------------------+ |
|  | [avatar] SDA @ UB          [Place]   | |
|  | [avatar] CS Club           [Place]   | |
|  | [avatar] Pre-Med Society   [Place]   | |
|  +--------------------------------------+ |
|                                           |
|  Or share a direct link                   |
|  [Copy link]                              |
+------------------------------------------+
```

**API:** `POST /api/tools/{toolId}/deploy` with `{ spaceId }` (already exists on build studio page)

**After placement:**
- Toast: "Added to [Space Name]"
- CTA updates to "Share with members" (next step)

### Data Model (PlacedTool -- exists)

From `space-deployment.service.ts`:

```typescript
interface PlaceToolInput {
  spaceId: string;
  toolId: string;
  placement: PlacementLocation;  // 'sidebar' | 'inline' | 'modal' | 'tab'
  order?: number;
  configOverrides?: Record<string, unknown>;
  visibility?: PlacementVisibility;
  titleOverride?: string;
  stateMode?: 'shared' | 'isolated';
}
```

Default placement for apps created from Build: `placement: 'tab'` (appears in the space's Apps tab).

---

## 4. Share Flow (Post-Placement) -- NEW, P0

Placement gets the app into the space. Sharing gets members to actually open it.

### Share Options (in order of reach)

**1. Copy link** (exists)
- `{origin}/t/{toolId}` for standalone
- `{origin}/s/{spaceHandle}?app={toolId}` for in-space context
- Already implemented in build page and build studio

**2. Push notification to space members** (NEW -- high leverage)
- After placing an app in a space, offer: "Notify members?"
- Sends FCM push to all space members: "[Creator] added [App Name] to [Space]"
- One notification per placement, not per edit
- Uses existing `notification-delivery-service.ts`

**3. Share to feed** (NEW -- medium leverage)
- Creates a feed post: "[Creator] made [App Name]" with inline preview card
- The preview card is interactive -- members can vote/RSVP directly from the feed
- Deferred to post-launch if needed, but the inline card pattern is powerful

### Share UX Sequence

```
[App created] -> [Place in Space] -> [Share sheet]

Share sheet:
+------------------------------------------+
|  [App Name] is live in [Space]!           |
|                                           |
|  [x] Notify [Space] members              |
|  [ ] Post to campus feed                 |
|                                           |
|  [Share]                [Copy link]       |
+------------------------------------------+
```

---

## 5. My Apps Dashboard -- NEW, P0

### Route: `/build` (integrated into Build home, not a separate page)

The My Apps section lives below the prompt input on the Build home page. It's the creator's portfolio + control center.

### Data Requirements

**Firestore query:** Tools where `createdBy == currentUserId`, ordered by `updatedAt desc`.

**Per-tool stats** (from RTDB `shell_states/{toolId}` or Firestore `tool_analytics/{toolId}`):

| Format | Key Metric | Source |
|--------|-----------|--------|
| Poll | Total votes | `shell_states/{toolId}.voteCounts` (sum) |
| Bracket | Total votes | `shell_states/{toolId}.matchups[].votes` (count) |
| RSVP | Attendee count | `shell_states/{toolId}.count` |
| Code (custom) | View count | `tool_analytics/{toolId}.views` |

### Card States

**Active (placed in a space, has engagement):**
```
[icon]  Best Dining Hall Poll           [...]
        142 votes  ·  SDA @ UB
        Live  ·  Updated 2h ago
```

**Placed but no engagement:**
```
[icon]  Study Group Signup              [...]
        0 RSVPs  ·  CS Club
        Live  ·  Share to get started
```

**Created but not placed (amber warning):**
```
[icon]  Rate the Professors             [!]
        Not in any space yet
        [Place in a Space]
```

### Full My Apps View (`/build?tab=my-apps` or scroll section)

When there are more than 6 apps, "See all" expands to a full list view with:
- Search/filter by name
- Sort by: Recent, Most engagement, Format type
- Bulk actions: delete (with confirmation)

---

## 6. Edit / Iterate Flow

### Shell Apps (poll, bracket, rsvp)

Shell apps have structured config -- editing means changing config fields, not regenerating code.

**Edit actions by format:**

| Format | Editable Fields | When |
|--------|----------------|------|
| Poll | Question, options (add/remove/reorder), timer | Before AND after deploy. Editing after deploy resets votes (with confirmation). |
| Bracket | Topic, entries (add/remove) | Before first round starts. Locked after voting begins. |
| RSVP | Title, date/time, location, capacity | Anytime. Existing RSVPs preserved. |

**Implementation:** The shell config editors already exist in `build/page.tsx` (PollConfigEditor, BracketConfigEditor, RSVPConfigEditor). Reuse them on the `/build/[toolId]` page for shell-type tools.

**What changes in `/build/[toolId]`:**
- Detect tool type (shell vs code) from tool data
- Shell tools: show config editor instead of code iterate input
- Save via `PUT /api/tools/{toolId}` with updated `shellConfig`

### Code Apps (custom AI-generated)

Code apps iterate through conversational prompts, which already works:

1. User types "make the button bigger" in iterate input
2. `POST /api/tools/generate` with `existingCode` + `isIteration: true`
3. Streaming response updates the tool's code
4. Auto-saved via `PUT /api/tools/{toolId}`

**What exists:** Full iterate flow on `/build/[toolId]` page with streaming, version history, and restore.

**What's missing:** Clear indication of what changed (diff view). Deferred -- not launch-critical.

---

## 7. Shell Format Roadmap

### Current Shells (3)

| Format | Use Case | Status |
|--------|----------|--------|
| `poll` | "Best dining hall", "Movie night pick" | Ships. Config editor, realtime votes, anonymous option. |
| `bracket` | "Rate the professors", "Best pizza place" | Ships. Tournament matchups, round progression. |
| `rsvp` | "Who's coming to the pregame" | Ships. Attendee list, capacity, date/time. |

### Next 3 Shells (P1 -- post-launch, in priority order)

**1. `signup-list`** -- Highest leverage
- **Use case:** "Sign up for the bake sale", "Who wants to carpool to the game", "Study group slots"
- **Why highest priority:** Org leaders use Google Forms for this constantly. It's their #1 pain point. A native signup list with realtime count, slot limits, and push notifications crushes Google Forms.
- **Config:** `{ title, slots: [{ label, capacity? }], deadline? }`
- **State:** `{ signups: Record<slotId, { userId, displayName, signedUpAt }[]> }`
- **Classifier hint:** "sign up", "signup", "slots", "who wants to", "volunteers needed"

**2. `quiz`** -- Engagement magnet
- **Use case:** "How well do you know UB?", "Guess the org leader", "Midterm study quiz"
- **Why:** Quizzes are inherently viral -- people share results. High engagement per creation. BuzzFeed proved this in 2014 and it still works.
- **Config:** `{ title, questions: [{ text, options: string[], correctIndex }], showResults: boolean }`
- **State:** `{ responses: Record<userId, { answers: number[], score: number, completedAt }> }`
- **Classifier hint:** "quiz", "test", "how well", "guess", "trivia"

**3. `countdown`** -- Event amplifier
- **Use case:** "Days until Spring Fest", "Midterms countdown", "Application deadline"
- **Why:** Lightweight to create (just a title + date), visually striking in a space, creates anticipation. Pairs perfectly with RSVP.
- **Config:** `{ title, targetDate: string, message?: string }`
- **State:** None needed (computed client-side from targetDate)
- **Classifier hint:** "countdown", "days until", "how long until", "deadline"

### Formats We're NOT Building

- **Ticket/payment** -- requires payment infra we don't have
- **Chat/messaging** -- not a creation format, it's a communication channel
- **Calendar** -- too complex for shell format, better as a space-level feature
- **Form builder** -- slippery slope to Google Forms clone. Signup-list covers the 80% case.

---

## 8. Browse / Marketplace (`/build/browse`)

### What Exists

The browse page at `/build/browse` has:
- Category filter pills (All, Exchange, Social, Academic, Org Tools, Campus Life, Utility)
- Rising section (top 3 by weekly users)
- Tool cards with name, description, category badge, weekly user count

### What Changes

**1. Wire to real data**
The page currently calls `/api/campus/tools` -- ensure this endpoint returns published tools for the user's campus.

**2. Add "Use" / "Remix" actions**
Each browse card needs:
- **"Use"** -- place this app in one of your spaces (opens space picker)
- **"Remix"** -- fork this app as a starting point for your own version

**3. Creator attribution**
Show who made each app. Campus social proof: "Made by @mike from SDA"

**4. Inline preview**
Long-press or expand a card to see a live preview of the app without navigating away.

### Data Model

Browse pulls from Firestore `tools` collection where:
- `status == 'published'`
- `visibility == 'public'`
- `campusId == currentUser.campusId`

Sorted by `weeklyUseCount` (computed, updated daily) with category filter.

---

## 9. What We're NOT Building

| Feature | Why Not |
|---------|---------|
| Full code IDE | The old HiveLab IDE was 100+ files of complexity. Removed. Iterate-via-prompt is the interface. |
| Drag-and-drop canvas | Same -- killed in the cleanup. Prompt-first is the bet. |
| Template gallery / system | Templates were a crutch for bad AI. If classification + shells work, templates are unnecessary overhead. |
| Automation builder | Triggers, conditions, actions -- way too complex for launch. If we need automation, it happens in space settings. |
| Visual tool composer | The 27-element composition system was powerful but nobody could use it. Dead code, removed. |
| Tool versioning UI | Version history exists on `/build/[toolId]` -- that's sufficient. No full version comparison/diff view. |
| Analytics dashboard | Per-tool stats on My Apps cards are enough. A dedicated analytics page is post-launch. |
| Cross-campus marketplace | Campus-scoped only at launch. Apps don't travel between campuses. |

---

## 10. Component Inventory

### Existing (ships)

| Component | File | Used Where |
|-----------|------|-----------|
| `PromptInput` | `build/page.tsx` (inline) | Build home |
| `PollConfigEditor` | `build/page.tsx` (inline) | Build home (shell-matched), Build studio (shell edit) |
| `BracketConfigEditor` | `build/page.tsx` (inline) | Build home (shell-matched), Build studio (shell edit) |
| `RSVPConfigEditor` | `build/page.tsx` (inline) | Build home (shell-matched), Build studio (shell edit) |
| `ShellConfigEditor` | `build/page.tsx` (inline) | Build home, Build studio |
| `PhaseIndicator` | `build/page.tsx` (inline) | Build home |
| `CodePreview` | `build/page.tsx` (inline) | Build home (generating/complete) |
| `QuickStartChips` | `components/hivelab/dashboard/QuickStartChips.tsx` | Build home |
| `ShellRenderer` | `components/shells/ShellRenderer.tsx` | Build home preview, space apps tab |
| `ToolCanvas` | `@hive/ui` (lazy loaded) | Build studio |

### New (to build)

| Component | Purpose | Priority |
|-----------|---------|----------|
| `MyAppsSection` | Creator's app list on Build home | P0 |
| `MyAppCard` | Compact card with name, metric, space, time | P0 |
| `SpacePlacementSheet` | Bottom sheet to pick a space for placement | P0 |
| `ShareSheet` | Post-placement share options (notify, copy link) | P0 |
| `ShellEditPanel` | Reuse config editors for deployed shell apps on studio page | P1 |
| `AppUsageStats` | Inline stat display (votes, views, RSVPs) | P1 |

---

## 11. API Routes

### Existing

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/classify` | POST | Classify prompt into format |
| `/api/tools/generate` | POST | Stream code generation |
| `/api/tools` | POST | Create blank tool |
| `/api/tools` | GET | List tools (needs `?mine=true` filter) |
| `/api/tools/{toolId}` | GET | Get tool details |
| `/api/tools/{toolId}` | PUT | Update tool (name, config, status) |
| `/api/tools/{toolId}/deploy` | POST | Place tool in a space |
| `/api/tools/{toolId}/versions` | GET | List version history |
| `/api/tools/{toolId}/versions/{v}/restore` | POST | Restore a version |

### New / Modified

| Route | Method | Purpose | Priority |
|-------|--------|---------|----------|
| `/api/tools?mine=true` | GET | Filter to current user's tools | P0 |
| `/api/tools/{toolId}/stats` | GET | Return engagement stats (votes, views, RSVPs) | P1 |
| `/api/campus/tools` | GET | Published tools for current campus (browse) | P0 (may already exist) |

---

## 12. Firestore Data Model

### Tool Document (`tools/{toolId}`)

```typescript
interface ToolDocument {
  id: string;
  name: string;
  description?: string;
  createdBy: string;          // userId
  campusId: string;           // from server session
  type: 'shell' | 'code';
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'space_only' | 'private';

  // Shell-specific
  shellFormat?: ShellFormat;   // 'poll' | 'bracket' | 'rsvp'
  shellConfig?: ShellConfig;   // format-specific config object

  // Code-specific
  elements?: ToolElement[];    // code stored in custom-block element

  // Placement tracking
  placedIn?: string[];         // spaceIds where this tool is placed

  // Metadata
  prompt?: string;             // original creation prompt
  currentVersion?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Shell State (`shell_states/{toolId}` -- Firebase RTDB)

Realtime state for interactive shells. Types defined in `libs/shells/types.ts`:
- `PollState` -- votes, voteCounts, closed
- `BracketState` -- matchups, currentRound, winner
- `RSVPState` -- attendees, count

### Tool Analytics (`tool_analytics/{toolId}` -- Firestore)

```typescript
interface ToolAnalytics {
  toolId: string;
  views: number;
  uniqueUsers: number;
  weeklyUseCount: number;      // computed daily, used for browse ranking
  lastActivityAt: Timestamp;

  // Format-specific (denormalized for fast reads)
  totalVotes?: number;         // poll
  totalRSVPs?: number;         // rsvp
  totalBracketVotes?: number;  // bracket
}
```

---

## 13. Perspective Signals

Running the core perspectives mentally against the full create -> place -> share loop:

### overwhelmed-org-leader
Creates a "Who's coming to the study session" RSVP from her space. Classified instantly. Edits the time and location. Deploys. **Gap:** After deploy, she needs to notify her 60 members. If she has to manually copy-paste a link into GroupMe, we failed. **Signal (pain):** The "notify members" push notification after placement is the single highest-leverage feature in this spec. Without it, she's still using GroupMe for distribution.

### lonely-freshman
Sees a "Rate the Professors" bracket trending in the browse section. Votes in it. Thinks "I could make one of these." Goes to Build, types "Best study spots on campus." Gets a poll. Deploys to a space they're in. **Gap:** If they're not in any spaces yet, placement is a dead end. **Signal (pain):** "Place in a Space" needs a fallback for students with no spaces: "Share a direct link" or "Post to campus feed." The app shouldn't require space membership to have value.

### thursday-night-sophomore
8pm Thursday. In a group chat deciding what to do. Opens HIVE, types "pregame at my place tonight." Gets an RSVP. **Gap:** They need to share this outside HIVE since their friend group isn't all on the platform yet. The `/t/{toolId}` standalone URL is critical -- it must work without auth for viewers. **Signal (gain):** Standalone URLs that work without login are the viral hook. Someone gets sent a link, votes on a poll, sees "Made with HIVE", downloads the app. This is how the platform grows.

### commuter-student
Has 45 minutes between classes. Sees a "carpool to the game" signup in a space they're in. Signs up. Thinks "I should make one for the study group." Goes to Build, types "study group for CSE 116 Tuesday." Gets an RSVP. **Signal (gain):** The speed matters enormously. If classification + shell preview takes under 2 seconds, a commuter can create and deploy an app in the time between classes. If it takes a minute of fiddling, they'll text their group chat instead.

### returning-skeptic
Opened HIVE twice, nothing hooked them. Opens Build tab. Sees an empty My Apps section with "Apps you make show up here." Tries the prompt. Gets a bracket. **Signal (pivot):** The Build tab might be the hook that other surfaces failed to provide. Creation is what iMessage can't do. But only if the creation -> result loop is under 10 seconds. If it feels slow or confusing, the skeptic closes the app for the last time.

---

## Evals

**Value prop:** "I can make something useful for my people in under a minute and get it in front of them instantly."

**Scenario:** Org leader creates a poll for a meeting topic, places it in their space, notifies members. 2 hours later, checks results.

**Perspectives:** overwhelmed-org-leader, lonely-freshman, thursday-night-sophomore, commuter-student, returning-skeptic

**Implementation files:**
- `apps/web/src/app/(shell)/build/page.tsx`
- `apps/web/src/hooks/use-build-machine.ts`
- `apps/web/src/app/(shell)/build/[toolId]/page.tsx`
- `apps/web/src/app/(shell)/build/browse/page.tsx`
- `apps/web/src/lib/shells/`
- `apps/web/src/app/api/tools/classify/route.ts`
- `apps/web/src/app/api/tools/generate/route.ts`
