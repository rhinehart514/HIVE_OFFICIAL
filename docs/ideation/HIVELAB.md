# HiveLab: Making It Flawless

Comprehensive ideation document based on deep codebase research. Every option references actual files, patterns, and architectural decisions already in the codebase.

---

## 1. The Magic Moment

**Scenario:** A student types "a poll for where to eat lunch" into the HiveLab prompt bar.

### What Happens Today

The generate route (`apps/web/src/app/api/tools/generate/route.ts`) receives the prompt. It tries backends in order: Goose/Ollama > Groq > Firebase AI (Gemini 2.0 Flash) > rules-based fallback. The rules-based generator (`apps/web/src/lib/mock-ai-generator.ts`) pattern-matches keywords and assembles a `ToolComposition` from the element catalog in `packages/core/src/application/hivelab/prompts/tool-generation.prompt.ts`. The streaming protocol sends `element_added` chunks followed by `generation_complete`. The IDE receives each chunk and places elements on the canvas. Then the user has to manually deploy to a space or profile.

**Broken flow:** The dashboard prompt creates a blank tool instead of triggering AI generation. The `StartZone` component in `packages/ui/src/components/hivelab/ide/start-zone.tsx` has the right hooks (`onOpenAI`, `onQuickPrompt`) but the dashboard-level creation path skips them.

### The Ideal Flow (Prompt to Deployed in 30 Seconds)

1. Student types "poll for where to eat lunch" anywhere -- the dashboard, a space sidebar, the command palette (`packages/ui/src/components/hivelab/ide/ai-command-palette.tsx`).
2. The prompt hits `/api/tools/generate` with space context (if available) injected automatically. The `spaceContext` field already exists in the Zod schema.
3. AI generates a `poll-element` with options like "Dining Hall", "Student Union", "Off Campus", "Skip lunch". The `ELEMENT_CATALOG` in the prompt file already has `poll-element` with use case "lunch poll" explicitly listed.
4. The `generation-overlay.tsx` shows elements appearing on canvas in real time via the streaming protocol.
5. The quality pipeline (`packages/core/src/application/hivelab/validation/ai-quality-pipeline.ts`) validates the composition. If score >= 85, accepted immediately. If fixable, auto-fixes via `QualityGateService`.
6. Instead of dropping the student into the full IDE, show a **preview-first** screen: the actual poll rendered live, with "Looks good? Deploy" as the primary CTA and "Edit in IDE" as secondary.
7. One tap deploys to the current space sidebar. The deploy route (`apps/web/src/app/api/tools/deploy/route.ts`) already supports `surface: "pinned"` placement.
8. The poll is live. Other students see it in the space sidebar immediately.

### What Makes It Magic vs a Chore

Magic: The student never sees the IDE for simple tools. Prompt, preview, deploy. Three steps, thirty seconds.

Chore: Being dumped into a canvas with elements positioned at x:0 y:0, having to understand what "connections" are, having to find the deploy button, having to configure which space.

### Three Options

**Option A: Preview-first flow (skip IDE for simple tools)**
Generate the tool, show a live preview with the tool actually running (poll options visible, voteable), and a big "Deploy to [Space Name]" button. The IDE is an "Edit" option, not the default destination.
What breaks: Users who want to customize immediately have an extra click. Complex multi-element tools need a different entry point.

**Option B: Inline generation (generate inside the space, not the lab)**
Add a "Create Tool" prompt directly in the space sidebar. Generate, preview, and deploy without ever leaving the space context. The `ToolRuntimeContext` (`apps/web/src/contexts/tool/ToolRuntimeContext.tsx`) already composes space metadata.
What breaks: The HiveLab brand/identity becomes invisible. Power users who want the full IDE have to navigate to it separately. Template browsing needs a different surface.

**Option C: Smart routing (auto-detect complexity)**
Simple prompts (1-2 elements, matching a template pattern) get the preview-first flow. Complex prompts ("build a suggestion box with triage and trend visualization") route to the IDE with the composition pre-loaded on the canvas. The `TemplateComplexity` type in `packages/ui/src/lib/hivelab/quick-templates.ts` already distinguishes `'simple'` from `'app'`.
What breaks: Edge cases where the routing gets it wrong frustrate users. The heuristic for "simple vs complex" needs tuning -- too aggressive toward simple means power users feel patronized, too aggressive toward complex means casual users bounce.

**Recommendation:** Option C. The infrastructure is already split between simple (1 element) and app (4+ element) templates. Use the same heuristic for AI generation.

---

## 2. Tool Templates & Archetypes

### Current State

29 templates exist in `packages/ui/src/lib/hivelab/quick-templates.ts`, organized by category:

| Category | Templates | Count |
|----------|-----------|-------|
| apps | Photo Challenge, Attendance Tracker, Resource Signup, Multi-Poll Dashboard, Event Series Hub, Suggestion Box, Study Group Matcher, Competition Tracker | 8 |
| events | Event Countdown, Event RSVP, Event Check-In, Upcoming Events, Tonight's Events | 5 |
| engagement | Quick Poll, Leaderboard, Member Spotlight, Stats Dashboard, Decision Maker | 5 |
| resources | Quick Links, Office Hours, Budget Overview, What Should I Eat?, Study Spot Finder | 5 |
| feedback | Anonymous Q&A, Feedback Form | 2 |
| teams | Study Group Signup, Announcements, Meeting Notes, Progress Tracker, Meeting Agenda, Weekly Update | 6 |

Some templates are marked `status: 'hidden'` (What Should I Eat, Study Spot Finder) because they reference element types that don't have renderers yet (`dining-picker`, `study-spot-finder`).

### Top 20 Tools College Students Actually Need

Based on the existing template analysis and gaps:

**Already have good templates for:**
1. Quick Poll (voting on anything)
2. Event RSVP (sign up for events)
3. Event Countdown (deadline awareness)
4. Feedback Form (post-event surveys)
5. Leaderboard (gamification)
6. Attendance Tracker (check-in with points)
7. Suggestion Box (anonymous feedback)
8. Meeting Notes (shared documents)
9. Study Group Signup (find study partners)
10. Anonymous Q&A (safe questions)

**Missing or incomplete:**
11. **Dues Tracker** -- Who has paid, who hasn't. The automation types in `packages/core/src/domain/hivelab/tool-automation.types.ts` already support threshold triggers and email notifications for this exact use case (the exit criteria mention "dues reminder sends email 7 days before deadline").
12. **Room/Resource Booking** -- Time slot selection with conflict detection. The Office Hours template is close but lacks true calendar booking.
13. **Election/Ballot** -- Formal voting with term limits, candidacy, ranked choice. Different from polls because it needs identity verification and one-person-one-vote enforcement.
14. **Group Photo Wall** -- The `photo-gallery` element exists in templates but the renderer needs completion.
15. **Shared Playlist** -- Collaborative music queue for events. Would need a new element type.
16. **Budget Request Form** -- Members submit expense requests, leaders approve. The form-builder + role-gate combo could handle this.
17. **Rideshare Board** -- Post rides to/from campus events. Form + result-list template.
18. **Lost & Found** -- Post items with photos, mark as found. Needs photo upload element.
19. **Meeting Scheduler** -- When2Meet-style availability grid. The `availability-heatmap` element is referenced in system templates but not in the quick templates.
20. **Challenge/Streak Tracker** -- Daily challenges with streak counting. Counter + leaderboard combo.

### Template Organization Options

**Option A: Intent-based categories (current approach, refined)**
Keep the 6 categories but rename for student language: "Run Events", "Get Feedback", "Organize Your Team", "Track Stuff", "Make Decisions", "Fun & Engagement". The `TemplateCategory` type in `quick-templates.ts` just needs the labels updated in `CATEGORY_LABELS` inside `template-gallery.tsx`.
What breaks: Students who don't know what category their need falls into browse all 29+ templates.

**Option B: Scenario-based discovery**
Replace categories with scenarios: "I'm running a meeting", "I'm planning an event", "I need my club to decide something", "I want to track participation". Each scenario shows 3-4 relevant templates. This is closer to how students think.
What breaks: Some templates fit multiple scenarios. Maintenance burden increases -- every new template needs scenario mapping. The `TemplateGallery` component needs a rewrite.

**Option C: AI-suggested templates**
When a student opens the template gallery, show "Popular in [Space Category]" at the top based on the space's category. The `getTemplateForCategory` function in `system-tool-templates.ts` already maps HIVE categories to template categories. Extend this to rank quick templates by relevance to the current space.
What breaks: Cold start problem -- new campuses have no usage data. Requires analytics pipeline to track which templates are used where.

**Recommendation:** Option A as the foundation, Option C layered on top. Keep simple categories for browsing, add "Suggested for your space" section using the existing category mapping infrastructure.

---

## 3. AI Generation Quality

### Current Provider Architecture

The generate route (`apps/web/src/app/api/tools/generate/route.ts`) implements a 4-provider chain:

| Provider | Model | Cost | Latency | Quality |
|----------|-------|------|---------|---------|
| Goose (Ollama) | Fine-tuned Phi-3 | $0 (self-hosted) | ~500ms | Trained on HiveLab schemas |
| Goose (Groq) | Llama 3.1 8b/70b | $0.0001-$0.001 | ~300-800ms | General-purpose, needs prompt |
| Firebase AI | Gemini 2.0 Flash | ~$0.001 | ~2000ms | Best reasoning, most expensive |
| Rules-based | Pattern matching | $0 | ~100ms | Deterministic, limited |

The Goose system prompt (`packages/core/src/hivelab/goose/system-prompt.ts`) has a separate, more concise element catalog than the Gemini prompt (`packages/core/src/application/hivelab/prompts/tool-generation.prompt.ts`). They can drift apart.

### Quality Infrastructure Already Built

This is genuinely impressive infrastructure:

- **Composition Validator** (`composition-validator.service.ts`): Validates element IDs, configs, connections, positions.
- **Quality Gate** (`quality-gate.service.ts`): Three-tier decision (accepted >= 85, partial_accept >= 60, rejected). Auto-fixes invalid elements, orphan connections, position bounds, size bounds, duplicate IDs, missing required fields.
- **Generation Tracker** (`generation-tracker.service.ts`): Records every generation with prompt, model, score, outcome.
- **Failure Classifier** (`failure-classifier.service.ts`): Categorizes failures for debugging.
- **Edit Tracker** (`edit-tracker.service.ts`): Tracks what users change after AI generates.
- **Config Learner** (`config-learner.service.ts`): Detects config drift -- when users consistently change AI defaults. Minimum 5 samples, 25% change rate threshold.
- **Prompt Enhancer** (`prompt-enhancer.service.ts`): Enriches prompts with learned patterns.
- **Benchmark Runner** (`benchmark-runner.service.ts`): Systematic testing of generation quality.

### How Providers Should Work Together

**Option A: Cascade with quality scoring**
Try the fastest provider first (Goose/Groq). Run through the quality pipeline. If score < 60, retry with the next provider up the chain (Firebase AI/Gemini). This means most requests are fast and cheap, with fallback to higher quality for hard prompts.
What breaks: Latency doubles on cascade. Users see a delay when the first provider fails. Two generations cost double the tokens/money.

**Option B: Prompt-complexity routing**
Classify the prompt before choosing a provider. Simple prompts ("make a poll") go to rules-based or Groq 8b. Medium prompts ("event RSVP with meal preferences and waitlist") go to Groq 70b. Complex prompts ("multi-poll dashboard with deadline and anonymous voting for board elections") go to Gemini. The `constraints` field in `GenerateToolRequestSchema` could carry this classification.
What breaks: The classifier itself needs to be good. Misclassification sends a hard prompt to a weak model, producing garbage. The classifier is another piece to maintain.

**Option C: A/B testing with user feedback**
Run all providers in parallel for a small percentage of requests. Show the highest-scoring result. Track which provider's output users actually keep vs edit heavily. Feed this into the Config Learner to auto-tune provider selection. The `GenerationTrackerService` already records model and outcome -- this is an extension.
What breaks: Cost scales with the percentage you're testing. Parallel generation for every request is prohibitively expensive. Meaningful A/B results need thousands of samples.

**Recommendation:** Option A for production, Option C for development/tuning. The cascade approach is simple, leverages the existing quality pipeline, and degrades gracefully. Run A/B tests periodically (weekly batch) to retune cascade thresholds.

### Making AI Output Actually Useful

The single biggest lever: **the training data**. The Goose training pipeline (`packages/core/src/hivelab/goose/training/`) has JSONL training data, template-to-example conversion, and a dataset generator. The Config Learner can feed drift patterns back into training data. Close the loop:

1. User types prompt, AI generates.
2. Quality pipeline scores the output.
3. User edits the output (or doesn't).
4. Edit Tracker records what changed.
5. Config Learner detects drift patterns.
6. Prompt Enhancer adjusts generation prompts.
7. Training data generator creates new examples from high-scoring, minimally-edited outputs.
8. Goose fine-tune picks up the improved data.

This loop already has every piece built. The missing connection is step 7 feeding into step 8 automatically.

---

## 4. The IDE Experience

### Current IDE Architecture

The IDE lives in `packages/ui/src/components/hivelab/ide/` with these components:

| Component | Purpose |
|-----------|---------|
| `start-zone.tsx` | Empty state with 3 workflow cards (Describe it, Use template, Build manually) |
| `element-palette.tsx` | Draggable element picker (27 elements across tiers) |
| `element-belt.tsx` | Compact element access |
| `contextual-inspector.tsx` | Property panel for selected element |
| `template-gallery.tsx` | Full-screen template browser with search and categories |
| `ai-command-palette.tsx` | CMD+K prompt bar for AI generation |
| `command-bar.tsx` | Quick actions and commands |
| `layers-panel.tsx` | Element z-order management |
| `canvas-minimap.tsx` | Zoom/pan overview |
| `smart-guides.tsx` | Alignment guides during drag |
| `generation-overlay.tsx` | AI generation progress display |
| `ghost-element.tsx` | Drag preview |
| `onboarding-overlay.tsx` | First-time user guide |
| `ide-toolbar.tsx` | Top toolbar with actions |

The studio system (`packages/ui/src/components/hivelab/studio/`) has `DndStudioProvider`, `CanvasDropZone`, `DraggablePaletteItem` -- a full drag-and-drop infrastructure built on `@dnd-kit`.

### The Right Level of Complexity

A sociology major needs to build a poll. A CS student wants to build a multi-tool suggestion system with automations. The IDE needs to serve both without patronizing one or overwhelming the other.

**Option A: Two modes -- Simple and Advanced**
Simple mode: Linear layout, no canvas, no connections. Just a list of elements with property panels. Think Google Forms. Advanced mode: Full canvas, connections, layers, automations. Think Figma. Toggle in the toolbar. The `StartZone` already has "Describe it" (simple) and "Build manually" (advanced) paths.
What breaks: Two modes means two codepaths to maintain. Features get duplicated or forgotten. Users who start in simple mode and hit a wall need a migration path to advanced.

**Option B: Progressive disclosure (recommended)**
One IDE, but complexity reveals itself as needed. Start with a vertical flow layout (elements stack top-to-bottom, no coordinates). When a user drags an element to rearrange, the grid snaps appear. When they add a second element that could connect, suggest the connection. When they need automations, the automation panel appears.
The `layout` field on `ToolComposition` already supports `'flow'` (linear) vs `'grid'` (positioned). Default everything to `'flow'` and only switch to `'grid'` when the user explicitly repositions.
What breaks: The progressive reveal needs careful sequencing. If too much reveals too fast, it's overwhelming. If too little, power users feel constrained. Testing this with real students is essential.

**Option C: Prompt-only (no visual IDE for most users)**
Double down on AI. The IDE becomes a preview + refine loop. "Make a poll" generates a poll. "Add a countdown" adds a countdown above it. "Connect the countdown to the poll so it closes when time runs out" wires the connection. The AI command palette (`ai-command-palette.tsx`) already supports iteration with `existingComposition` and `isIteration: true`.
What breaks: Non-deterministic output frustrates users who want precise control. "Make the options bigger" doesn't map well to JSON config changes. The AI needs to understand layout intent, which is hard.

**Recommendation:** Option B. The canvas infrastructure is already built. The key change is making `'flow'` layout the default so elements just stack vertically, and only revealing grid positioning when users need it. The property panel (`contextual-inspector.tsx`) already works for per-element configuration.

### Critical Missing Feature: Live Preview

The preview page exists (`apps/web/src/app/lab/[toolId]/preview/page.tsx`) but preview state doesn't persist. Students can't test a poll before deploying it. The fix:

The `ToolRuntimeContext` already composes shared state and user state. For preview, create a `PreviewStateProvider` that stores state in `localStorage` or `sessionStorage` instead of Firestore. The `local-tool-storage.ts` file in `packages/ui/src/lib/hivelab/` already implements local storage for tool compositions. Extend this pattern to preview state.

---

## 5. Tool Sharing & Virality

### Current Sharing Infrastructure

The share route (`apps/web/src/app/api/tools/[toolId]/share/route.ts`) supports two actions:

1. **create_share_link**: Generates a `shareToken`, creates a URL like `/tools/shared/{token}`. Supports view/edit permissions.
2. **fork**: Deep-copies the tool with fresh IDs. Records analytics events (`tool_forked`, `tool_fork_source`). Increments `forkCount` on the original.

The publish route (`apps/web/src/app/api/tools/publish/route.ts`) and review pipeline (`apps/web/src/app/api/admin/tools/pending/route.ts`, `apps/admin/src/app/tool-review/page.tsx`) exist for a moderated marketplace.

### Viral Loop Options

**Option A: "Use This Tool" embeds**
Any deployed tool can be embedded in other platforms via an iframe or web component. A "Powered by HIVE" badge links back to the creation flow. Students share polls on GroupMe/Discord, non-HIVE users interact, see the badge, sign up.
What breaks: iframes are blocked by many platforms. Web components need a separate bundle. The tool execution runtime (`apps/web/src/app/api/tools/execute/route.ts`) needs to support unauthenticated interactions for embeds, which conflicts with the campus identity requirement.

**Option B: "Fork This Tool" marketplace**
Build a public gallery of published tools. Students browse, find a "Weekly Meeting Agenda" tool, fork it into their space, customize it. The fork infrastructure already exists including fork counting and analytics. The template gallery (`template-gallery.tsx`) could surface community tools alongside built-in templates.
What breaks: Content moderation. Someone creates an offensive poll, publishes it, and it shows up in the gallery. The admin review pipeline exists (`apps/admin/src/app/tool-review/page.tsx`) but needs to be robust enough for real moderation at scale.

**Option C: "Remix This Tool" chain**
Every tool shows its lineage: "Originally by @sarah, remixed by @mike, remixed by you." Remixing preserves attribution and creates a social graph of tools. The `originalToolId` field is already set on forked tools. Extend this to a chain. Surface "Top Remixed Tools" on the HiveLab landing page.
What breaks: Attribution chains get messy. If Sarah's tool was itself a fork, the chain grows indefinitely. Display complexity increases. Students may not care about attribution -- they just want the tool.

**Recommendation:** Option B first, Option C as an enhancement. The fork infrastructure is the most complete. Add a "Community Tools" tab to the template gallery alongside the existing "All Templates" view. Gate it behind the existing admin review pipeline. Attribution comes free with `originalToolId`.

### The Real Viral Loop

The viral loop isn't sharing tools outside HIVE. It's **tools pulling non-members into spaces**.

1. A club leader deploys a poll to their space.
2. They share the space link in their GroupMe: "Vote on our next social!"
3. Non-members land on the space page, see the poll in the sidebar.
4. To vote, they need to join the space (which requires campus email).
5. Now they're a HIVE user.

This loop already works architecturally. The space tools page (`apps/web/src/app/spaces/[spaceId]/tools/page.tsx`) shows deployed tools. The authentication middleware requires campus email. The gap: making the "join to interact" flow feel natural rather than like a wall.

---

## 6. Real-Time & Interactive Tools

### Current Real-Time Architecture

The shared state system in `tool-composition.types.ts` provides four real-time primitives:

| Primitive | Type | Use Case |
|-----------|------|----------|
| `counters` | `Record<string, number>` | Vote totals, RSVP counts, headcounts |
| `collections` | `Record<string, Record<string, ToolSharedEntity>>` | Attendee lists, submissions, responses |
| `timeline` | `ToolTimelineEvent[]` | Activity feeds, submission history |
| `computed` | `Record<string, unknown>` | Derived values (rankings, aggregates) |

**Sharded counters** (`ShardedCounterConfig` in `tool-composition.types.ts`): Distributes writes across 10-100 shards to overcome Firestore's ~25 writes/sec/document limit. 10 shards = 200 writes/sec. 100 shards = 2,000 writes/sec. The `shardedCounterService` is imported in the execute route.

**RTDB broadcast** (`toolStateBroadcaster` in execute route): Real-time Database broadcast for pushing state changes to clients. Controlled by `USE_RTDB_BROADCAST` env var, enabled by default.

**Extracted collections and timelines**: Feature-flagged (`USE_EXTRACTED_COLLECTIONS`, `USE_EXTRACTED_TIMELINE`) -- moves large sub-structures out of the main shared state document into subcollections for reduced document size.

### What Real-Time Primitives Should HiveLab Offer

The current four primitives cover most cases. Gaps:

**Presence**: Who is viewing this tool right now. For collaborative tools (live polls during a meeting), knowing "23 people are here" matters. Firebase RTDB handles presence natively. Add a `presence` field to `ToolSharedState`.

**Ephemeral state**: Data that doesn't persist. Chat messages during a live session, cursor positions for collaborative editing. Currently everything persists to Firestore. Ephemeral state should live only in RTDB and expire.

**Locks**: Prevent concurrent editing of the same resource. For booking tools, two students shouldn't book the same slot. Firestore transactions handle this, but the lock intent needs to be expressible in the element config.

### Scaling Options

**Option A: Keep current architecture, tune shard counts**
The sharded counter system already scales to 2,000 writes/sec with 100 shards. For a campus of 30,000 students, even if 10% are voting simultaneously, that's 3,000 writes/sec -- achievable with a few hundred shards. The `ElementCounterConfig` allows per-element shard tuning.
What breaks: Reads become expensive. Reading a sharded counter requires reading all shards and summing. With 100 shards, that's 100 reads per counter display. Caching mitigates this but adds staleness.

**Option B: Move hot paths to RTDB entirely**
Use Firebase Realtime Database for all tool state during active sessions. Sync back to Firestore when sessions end. RTDB handles 200,000+ concurrent connections and 1,000 writes/sec per node.
What breaks: Data model needs to be flat (RTDB is a JSON tree, not document-based). The current `ToolSharedState` structure is nested. Migration complexity is significant. Two sources of truth during sessions.

**Option C: Hybrid (current approach, extended)**
Keep Firestore as the source of truth. Use RTDB for real-time broadcast (already implemented). Add RTDB presence tracking. Keep sharded counters for high-write scenarios. This is what the codebase is already heading toward.
What breaks: Complexity. Two databases in play for every tool interaction. Debugging state issues requires checking both Firestore and RTDB. The `toolStateBroadcaster` service is the synchronization point -- if it fails, clients see stale data.

**Recommendation:** Option C. The hybrid approach is already implemented and working. Add presence via RTDB. The sharded counter migration status tracking (`CounterMigrationStatus`) shows this was planned from the start.

---

## 7. Tool Analytics

### Current State

The analytics page (`apps/web/src/app/lab/[toolId]/analytics/page.tsx`) shows:

- **4 stat counters**: Total Uses, Active Users, Avg Rating, This Week
- **Usage chart**: Line chart with 7d/30d/90d time ranges, animated line drawing
- **Feedback cards**: Star ratings with comments, author, timestamp
- **Export**: JSON download of analytics data
- **Empty state**: "No Analytics Yet" with CTA to share the tool

The analytics API (`apps/web/src/app/api/tools/[toolId]/analytics/route.ts`) feeds this data.

### What a Tool Creator Should See

**Already there:**
- Usage volume over time
- Active user count
- User ratings and comments

**Missing and critical:**

1. **Response data breakdown**: For a poll, show what percentage voted for each option. For a form, show aggregated responses. The shared state has this data (`counters` for polls, `collections` for form submissions) but the analytics page doesn't surface element-specific data.

2. **Engagement funnel**: Views > Interactions > Completions. How many people saw the tool vs how many actually used it. The execute route already tracks execution events -- the analytics API needs to aggregate them.

3. **Demographic breakdown**: By role (leader vs member), by time of day, by device. The `ToolContext` injected into execution already has `userRole`. Log it.

4. **Comparative analytics**: "Your poll got 2x more votes than the average poll on campus." This requires cross-tool aggregation that doesn't exist yet.

5. **Export as CSV/PDF**: The current export is JSON, which is useless for most student leaders. They need something they can paste into a report for their advisor. Add CSV export for tabular data and a "Share this report" link.

### Options for Element-Specific Analytics

**Option A: Generic element analytics**
Every element type surfaces its shared state in the analytics panel. Polls show vote distribution. Forms show submission count and field-level completion rates. RSVPs show attendee count over time. Parse the `ToolSharedState.counters` and `ToolSharedState.collections` generically.
What breaks: Generic display is generic. A poll vote distribution as a table of counter keys is ugly. Each element type needs custom visualization.

**Option B: Element-registered analytics views**
Each element type registers its own analytics component. The `poll-element` registers a pie chart of vote distribution. The `form-builder` registers a field completion heatmap. The `rsvp-button` registers a sign-up curve. This is a component registry pattern.
What breaks: Every new element needs an analytics view. Development velocity decreases. Elements without analytics views show nothing.

**Option C: AI-generated insights**
Feed the shared state data into a lightweight AI model that generates natural language insights: "Your poll got 47 votes in 24 hours. The most popular option was 'Student Union' with 38% of votes. Most activity happened between 11am-1pm." The AI generation infrastructure already exists.
What breaks: AI insights can be wrong or misleading. Cost per analytics view. Students may not trust AI-generated analysis of their data.

**Recommendation:** Option A as the foundation, with Option B for the top 5 element types (poll, form, RSVP, leaderboard, counter). These cover 80%+ of tool usage. Option C as a future differentiator.

---

## 8. Advanced Tool Capabilities

### Current Capability System

The codebase has a full governance model in the deploy route and `@hive/core`:

**Three capability lanes** (`CAPABILITY_PRESETS` imported in deploy route):

| Lane | Capabilities | Use Case |
|------|-------------|----------|
| SAFE | read_space_context, read_space_members | Display-only tools, polls, counters |
| SCOPED | + write_shared_state, objects_read, objects_write | Interactive tools, forms, RSVPs |
| POWER | + create_posts, send_notifications, trigger_automations, objects_delete | Automation-driven tools, notification senders |

**Budgets** (`DEFAULT_BUDGETS` in deploy route):
- Notifications per day (capped)
- Posts per day (capped)
- Automations per day (capped)
- Executions per user per hour (capped)

**Governance status** (`DeploymentGovernanceStatus`): Tools in the POWER lane may require admin approval.

### Automation Architecture

Two automation systems exist:

1. **Tool-level automations** (`packages/core/src/domain/hivelab/tool-automation.types.ts`): Event triggers, schedule triggers, threshold triggers. Actions: notify (email/push), mutate state, trigger other tools. Rate limits (100 runs/day default, 60s cooldown). Execution logging with last 100 runs kept.

2. **Space-level automations** (`packages/core/src/domain/hivelab/entities/automation.ts`): Member join, event reminder, schedule, keyword, reaction threshold triggers. Actions: send message, create component, assign role, notify.

The cron route (`apps/web/src/app/api/cron/tool-automations/route.ts`) handles scheduled execution.

### Tool-to-Tool Connections

The connection system (`packages/core/src/domain/hivelab/tool-connection.types.ts`) enables data flow between deployed tools:

- Source tool exposes outputs (`ToolOutputManifest`)
- Target tool declares inputs
- Connections have transforms (`toArray`, `toCount`, `toBoolean`, `toSorted`, `toTop5`, etc.)
- Connections are validated (no circular deps, cross-space checks, type compatibility)
- Resolved connections are cached with type-specific TTLs (counters: 5min, timeline: 30sec)
- Max 20 connections per tool

### Where's the Line

**Option A: Stay visual, no code (recommended)**
The automation and connection UIs should be visual: "When [trigger] and [condition], do [action]." The `automation-awareness-panel.tsx` in the lab components already exists. Connections should be drag-and-drop wires in the IDE, which the `ElementConnection` type supports. No scripting, no expressions, no code blocks.
What breaks: Power users hit ceilings. "I want to send a different message depending on which option won the poll" requires conditional logic that visual builders struggle with.

**Option B: Expression language**
Add a simple expression language for conditions and transforms. Something like `{{poll_001.results.winner}}` for template variables and `count > 10 ? "High" : "Low"` for conditions. The automation `ToolAutomationCondition` already supports operators (`equals`, `greaterThan`, `contains`, etc.) -- this extends that to element configs.
What breaks: Once you have an expression language, you have debugging, syntax errors, documentation, and a learning curve. The distance from "visual builder" to "no-code platform" collapses quickly.

**Option C: Webhook escape hatch**
For anything the visual builder can't handle, offer a webhook that fires on tool events. Students who know how to code can build custom integrations. The `TriggerToolAction` type already supports triggering external events with arbitrary data.
What breaks: Webhook endpoints need hosting. Most students can't set up a server. The "everything built-in" promise breaks. Security -- webhooks can exfiltrate data.

**Recommendation:** Option A with the POWER lane as the ceiling. The three-lane capability model is the right constraint. SAFE tools are dead simple. SCOPED tools can read and write state. POWER tools can send notifications and trigger automations. If someone needs more, they're building something that should be a proper app, not a HiveLab tool.

### POWER Lane Features That Matter Most

Ranked by student leader value:

1. **Scheduled notifications**: "Remind everyone about dues every Monday at 9am." Already fully typed.
2. **Threshold alerts**: "Notify me when RSVP hits 50." Already fully typed.
3. **Event-triggered actions**: "When someone submits the feedback form, post a thank-you in the space." Already typed but the post-creation action needs implementation.
4. **Tool-to-tool data flow**: "Show only paid members in the voting tool." The connection system is fully built.
5. **Conditional logic**: "If the poll has more than 10 votes, auto-close it." The `ToolThresholdTrigger` + `MutateAction` combo handles this.

---

## 9. Tool Lifecycle

### Current State

The tool data model supports:

- **Versions**: `apps/web/src/app/api/tools/[toolId]/versions/route.ts` -- create versions, list versions. Version restore at `[version]/restore/route.ts`.
- **Deployment**: Tools deploy to spaces (sidebar/pinned/inline) or profiles. The deploy route handles placement, permissions, capabilities, budgets.
- **Publishing**: Tools can be published to a campus-wide directory. Admin review pipeline (pending, approve, reject) exists.
- **Sharing**: Share links with tokens, fork/copy functionality.

### Missing Lifecycle Stages

**Draft state**: Tools are either saved or not. There's no explicit "draft" flag. The `status` field on deployments is `'active'` | `'inactive'` but tools themselves don't have a draft concept.

**Preview/testing**: As noted in Section 4, preview state doesn't persist. Students can't test interactive tools before deploying.

**Update propagation**: When a tool creator edits a tool, existing deployments don't update. The version system tracks versions but there's no "push update to all deployments" mechanism.

**Deprecation/archival**: No way to mark a tool as deprecated. Old tools accumulate forever.

### Lifecycle Options

**Option A: Explicit state machine**
`draft` -> `testing` -> `published` -> `deployed` -> `archived`

Each transition has rules:
- `draft` -> `testing`: Composition must validate (quality score >= 60)
- `testing` -> `published`: Creator marks as ready
- `published` -> `deployed`: Deploy to specific space/profile
- Any state -> `archived`: Creator or admin archives

Store lifecycle state on the tool document. Add a `lifecycle` field to the tool schema in `packages/validation/src/`.

What breaks: More states = more UI to build. Students don't want to manage lifecycle -- they want to make a poll and deploy it. The state machine adds friction for simple tools.

**Option B: Implicit lifecycle (recommended)**
Tools are always editable. Deployments are snapshots. When a tool is edited, deployments keep the old version until the creator explicitly "pushes" an update. This is how the version system already works conceptually.

- **Creating**: Tool exists with elements. Autosaved.
- **Deployed**: A deployment references a tool version. Deployments have their own `active`/`inactive` status.
- **Updated**: Creator edits the tool, creating a new version. A "Push updates" button on the deploy page sends the new version to all active deployments.
- **Archived**: Creator toggles a tool to archived. Existing deployments keep running but show "This tool is no longer maintained."

What breaks: "Push updates" is destructive -- if the update has a bug, all deployments break simultaneously. Need a way to roll back.

**Option C: Deployment-first (no separate tool concept)**
Remove the distinction between tools and deployments. A tool IS a deployment. Editing a deployment updates it in place. Version history is automatic (every save creates a snapshot). Forking creates a new deployment.

What breaks: The entire current architecture. Tools have a `tools` collection, deployments have `deployedTools`. The IDE edits tools, the runtime reads deployments. This would be a major refactor with cascading changes across dozens of files.

**Recommendation:** Option B. It matches the existing version system. The key implementation:

1. Add `latestVersion` field to tool documents (string, e.g., "1.2.0").
2. When deploying, record `deployedVersion` on the deployment document (already exists as version tracking).
3. On the deploy management page (`apps/web/src/app/lab/[toolId]/deploy/page.tsx`), show which deployments are behind the latest version.
4. "Push update" button updates the deployment's composition to the latest version and increments `deployedVersion`.
5. The version restore route (`[version]/restore/route.ts`) already handles rollback.

### Versioning Strategy

Auto-increment patch versions on every save. Minor versions on explicit "publish." Major versions on breaking changes (element removed, connection changed). The version route already supports creating versions with changelogs. The `restore` endpoint enables rollback.

---

## Summary: Priority Order

If shipping fast is the goal, here's what moves the needle most with the least work:

1. **Fix the dashboard prompt** -- Connect the dashboard's "Create Tool" flow to the AI generation pipeline instead of creating blank tools. This is a routing bug, not a feature.

2. **Preview-first flow for simple tools** -- After AI generates a 1-2 element tool, show a live preview with "Deploy" as the primary CTA. Skip the IDE for simple tools.

3. **Fix the hardcoded campusId** -- Replace `'ub-buffalo'` with `getCampusId(req)` from session. This is in the IDE somewhere.

4. **Preview state persistence** -- Store preview tool state in localStorage/sessionStorage so students can test polls before deploying.

5. **Element-specific analytics** -- Show poll vote distributions and form response summaries on the analytics page.

6. **Push updates to deployments** -- When a tool is edited, let creators push the new version to all deployments.

Everything else is enhancement. These six items make HiveLab go from "interesting prototype" to "thing students actually use."
