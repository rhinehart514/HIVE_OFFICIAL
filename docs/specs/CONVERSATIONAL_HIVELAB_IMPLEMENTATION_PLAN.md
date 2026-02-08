# Conversational HiveLab: Implementation Plan

**Status**: Implementation Plan
**Date**: 2026-02-07
**Input**: Codebase Audit + Architecture Spec

---

## Phase 0: Quick Wins (Ship This Week)

Zero architectural risk. Shift framing from "Lab" to "Tools" immediately.

### 0.1 Reverse Route Direction: `/lab` -> `/tools`

Currently `/tools` redirects to `/lab` in `next.config.mjs`. Reverse this.

**Files to modify:**

| File | Change | Effort |
|------|--------|--------|
| `apps/web/next.config.mjs` (lines 42-60) | Reverse `/tools` -> `/lab` redirect to `/lab` -> `/tools`. Keep `/hivelab` -> `/tools`. Remove old `/tools` -> `/lab` redirect. | 15 min |
| `apps/web/src/lib/navigation.ts` (lines 37-41) | Change nav item: `label: 'Lab'` -> `label: 'Tools'`, `href: '/lab'` -> `href: '/tools'`, `matchPattern: /^\/tools(\/\|$)/` | 10 min |
| `apps/web/src/middleware.ts` (line 67) | Change `'/build': '/lab/create'` -> `'/build': '/tools/create'` | 5 min |
| `apps/web/src/lib/tool-navigation.ts` | Replace all `/lab/` references with `/tools/` (13 occurrences) | 15 min |

**Dependencies:** None
**Total effort:** ~45 min

### 0.2 Move Page Files from `/lab` to `/tools`

Move the actual Next.js route directory.

**Action:**
```
mv apps/web/src/app/lab -> apps/web/src/app/tools
```

All 17 pages move as-is. No internal changes needed (they use relative imports and API routes).

**Files affected:**
- `apps/web/src/app/lab/page.tsx` -> `apps/web/src/app/tools/page.tsx`
- `apps/web/src/app/lab/[toolId]/page.tsx` -> `apps/web/src/app/tools/[toolId]/page.tsx`
- `apps/web/src/app/lab/[toolId]/deploy/page.tsx` -> `apps/web/src/app/tools/[toolId]/deploy/page.tsx`
- `apps/web/src/app/lab/[toolId]/preview/page.tsx` -> `apps/web/src/app/tools/[toolId]/preview/page.tsx`
- `apps/web/src/app/lab/[toolId]/analytics/page.tsx` -> `apps/web/src/app/tools/[toolId]/analytics/page.tsx`
- `apps/web/src/app/lab/[toolId]/runs/page.tsx` -> `apps/web/src/app/tools/[toolId]/runs/page.tsx`
- `apps/web/src/app/lab/[toolId]/run/page.tsx` -> `apps/web/src/app/tools/[toolId]/run/page.tsx`
- `apps/web/src/app/lab/[toolId]/edit/page.tsx` -> `apps/web/src/app/tools/[toolId]/edit/page.tsx`
- `apps/web/src/app/lab/[toolId]/settings/page.tsx` -> `apps/web/src/app/tools/[toolId]/settings/page.tsx`
- `apps/web/src/app/lab/templates/page.tsx` -> `apps/web/src/app/tools/templates/page.tsx`
- `apps/web/src/app/lab/create/page.tsx` -> `apps/web/src/app/tools/create/page.tsx`
- `apps/web/src/app/lab/new/page.tsx` -> `apps/web/src/app/tools/new/page.tsx`
- `apps/web/src/app/lab/setups/**` -> `apps/web/src/app/tools/setups/**` (5 pages)
- All error.tsx files in these directories move too

**Dependencies:** 0.1 (redirects reversed first)
**Effort:** 30 min (mostly grep-and-replace for any absolute `/lab/` paths in page content)

### 0.3 Update All Internal References

Grep for `/lab/` and `/lab` in source code and update.

**Files to scan and update (27 files from grep):**
- `apps/web/src/app/u/[handle]/ProfilePageContent.tsx` - profile tool links
- `apps/web/src/app/s/[handle]/components/space-settings.tsx` - space settings tool links
- `apps/web/src/app/feed/components/FeedEmptyState.tsx` - empty state CTA
- `apps/web/src/components/explore/ToolGallery.tsx` - gallery links
- `apps/web/src/app/spaces/[spaceId]/tools/page.tsx` - space tool page links
- `apps/web/src/app/spaces/[spaceId]/setups/[deploymentId]/page.tsx` - setup links
- `apps/web/src/app/spaces/[spaceId]/tools/[deploymentId]/page.tsx` - tool deployment links
- `apps/web/src/app/elements/*` - element reference pages
- `apps/web/src/app/design-system/page.tsx` - design system reference
- `apps/web/src/app/templates/page.tsx` - templates reference

**Change:** Replace `'/lab/` with `'/tools/` and `'/lab'` with `'/tools'` in `href`, `router.push`, and `window.location` calls.

**Dependencies:** 0.2
**Effort:** 1 hour

### 0.4 Copy Changes

**Files to modify:**

| File | Change | Effort |
|------|--------|--------|
| `apps/web/src/app/tools/page.tsx` (was lab/page.tsx) line 423 | `"Your Lab"` -> `"Your Tools"` | 2 min |
| `apps/web/src/app/tools/page.tsx` line 601 | `"Welcome to your Lab"` -> `"What do you need?"` | 2 min |
| `apps/web/src/app/tools/page.tsx` line 616 | `"Build tools your space will actually use"` -> `"Describe it. We'll build it."` | 2 min |
| `apps/web/src/app/tools/page.tsx` line 717 | `"Name your tool to get started..."` -> `"Describe what you need..."` | 2 min |
| `apps/web/src/app/tools/page.tsx` line 514 | `"Or name a new tool..."` -> `"Describe what you need..."` | 2 min |
| `apps/web/src/app/tools/page.tsx` line 241 | `"Quick start"` -> `"Describe anything"` | 2 min |

**Dependencies:** 0.2
**Effort:** 15 min

### 0.5 Fix the Blank Tool Bug

This is the #1 UX bug. When user submits a prompt from dashboard, `handleSubmit()` calls `createBlankTool()` then redirects to IDE. The prompt is passed as a query param but generation doesn't start automatically.

**Fix (immediate, pre-conversation):** Modify `handleSubmit` to call the generation API directly instead of creating a blank tool.

**File:** `apps/web/src/app/tools/page.tsx` (was lab/page.tsx), `handleSubmit()` at line 297

**Current flow:**
```
prompt -> createBlankTool(name, prompt) -> redirect /tools/{id}?prompt=...
```

**Fixed flow:**
```
prompt -> createBlankTool(name, prompt) -> call /api/tools/generate with prompt -> redirect /tools/{id}
```

Actually, the better fix is simpler: in the IDE page (`/tools/[toolId]/page.tsx`), auto-trigger generation when `?new=true&prompt=...` query params are present. This preserves the existing flow but removes the manual re-submit step.

**Check the IDE page to confirm this is feasible** -- the IDE already has a chat/AI bar that calls the streaming generation hook. The fix is to check `searchParams.prompt` on mount and auto-call `generate()`.

**Dependencies:** 0.2
**Effort:** 1-2 hours (need to verify IDE page structure)

---

## Phase 1: The Conversational Core

Build the prompt -> artifact -> deploy flow as a full-page experience at `/tools`.

### Build Order

The dependency chain is:

```
1.1 ToolArtifact component (standalone renderer)
  -> 1.2 ArtifactStreamLayout (streaming animation wrapper)
    -> 1.3 ConversationContext + useConversationEngine (state + logic)
      -> 1.4 Intent Router (prompt -> template or generation)
        -> 1.5 ConversationFull page (puts it all together)
          -> 1.6 Deploy-in-conversation
```

### 1.1 ToolArtifact Component

**What:** A layout container that renders tool compositions using existing `renderElementSafe()` in a vertical flow layout (not absolute positioned canvas).

**Create:** `packages/ui/src/design-system/components/hivelab/ToolArtifact.tsx`

**Key decisions:**
- Uses `renderElementSafe` from `packages/ui/src/components/hivelab/elements/registry.tsx` -- no new element renderers
- Reads `composition.layout` field (flow | grid | tabs | sidebar) and arranges elements accordingly
- For `surface: 'conversation'`, max-width 480px, padding from tokens
- No absolute positioning (unlike `StreamingCanvasView.tsx` which uses `position: absolute, left: x, top: y`)
- Elements stack vertically in a flow layout with `gap` from design tokens

**Reuses:** `IsolatedElementRenderer` pattern from `StreamingCanvasView.tsx` (line 69-103) for hook isolation

**Dependencies:** None (uses only existing element renderers)
**Effort:** 1 day

### 1.2 ArtifactStreamLayout

**What:** Wraps ToolArtifact with streaming entrance animations. Elements appear one-by-one as they arrive from the streaming API.

**Create:** `packages/ui/src/design-system/components/hivelab/ArtifactStreamLayout.tsx`

**Key behavior:**
- During `generationStatus === 'streaming'`: renders skeleton placeholders, fades in real elements as they arrive
- Uses `framer-motion` with the entrance spec from architecture doc (opacity 0->1, y 12->0, scale 0.97->1, 250ms)
- Once complete, removes skeletons and shows full artifact

**Dependencies:** 1.1
**Effort:** 0.5 day

### 1.3 ArtifactHeader

**What:** Name, generation status indicator, action buttons (Deploy / Open in Studio / Share).

**Create:** `packages/ui/src/design-system/components/hivelab/ArtifactHeader.tsx`

**Dependencies:** None
**Effort:** 0.5 day

### 1.4 ConversationContext + useConversationEngine

**What:** The core state machine and React context that manages the full conversation lifecycle.

**Create:**
- `apps/web/src/contexts/conversation/ConversationContext.tsx`
- `apps/web/src/hooks/use-conversation-engine.ts`

**How it works:**
- Wraps `useStreamingGeneration` from `packages/hooks/src/use-streaming-generation.ts`
- Adds conversation message history (array of `{ role, content, timestamp }`)
- Implements state machine transitions (idle -> prompting -> routing -> generating -> previewing -> iterating -> deploying -> deployed)
- `send(prompt)` function: checks if artifact exists (iteration) or new, calls intent router, then either applies template or calls streaming generation
- `deploy(target)` function: calls `POST /api/tools` then `POST /api/tools/deploy`
- `cancel()` delegates to `streaming.cancel()`
- `reset()` clears session

**The `useStreamingGeneration` hook already supports:**
- `existingComposition` for iteration mode (line 63-66)
- `isIteration` flag (line 66)
- Streaming via NDJSON from `POST /api/tools/generate`
- Cancel via AbortController
- Hydrate from external composition

**No changes needed to `useStreamingGeneration`.**

**Dependencies:** 1.1 (ToolArtifact must exist for previewing state to render)
**Effort:** 2 days

### 1.5 Intent Router

**What:** Routes a prompt to the fastest path: template match (<100ms) or full AI generation (1-3s) or IDE redirect.

**Create:**
- `packages/core/src/domain/hivelab/intent-router.ts`
- `packages/core/src/domain/hivelab/template-matcher.ts`

**Reuses:**
- `detectIntent()` from `apps/web/src/lib/ai-generator/intent-detection.ts` -- **move this to `packages/core`** for shared access. Currently it's in an app-level lib.
- `QUICK_TEMPLATES`, `getQuickTemplate`, `createToolFromTemplate` from `packages/ui/src/lib/hivelab/quick-templates.ts`

**Migration needed:**
- Move `apps/web/src/lib/ai-generator/intent-detection.ts` -> `packages/core/src/domain/hivelab/intent-detection.ts`
- Update import in `apps/web/src/app/api/tools/generate/route.ts` (if it imports this)
- Re-export from `packages/core/src/server.ts`

**The router logic:**
1. Check for IDE signals ("studio", "canvas", "drag and drop", "advanced") -> redirect to `/tools/studio`
2. Call `detectIntent(prompt)` to get intent + confidence
3. If confidence >= 0.5, try template match via `INTENT_TEMPLATE_MAP`
4. If template found, apply customizations from prompt and return instantly
5. Otherwise, fall through to full AI generation

**Dependencies:** None (standalone, tested independently)
**Effort:** 1.5 days (including intent-detection migration)

### 1.6 Shared Conversation UI Components

**Create:**
```
apps/web/src/components/hivelab/conversation/shared/
  ConversationInput.tsx        -- The universal input box
  ConversationMessages.tsx     -- Message history display
  ConversationActions.tsx      -- Deploy/Share/Studio action bar
  ConversationSuggestions.tsx  -- Prompt suggestions for idle state
```

**ConversationInput:**
- Adapted from `GoldBorderInput` in current `lab/page.tsx` (lines 136-247)
- Remove the `GoldBorderInput` component and replace with `ConversationInput`
- Add: submission state indication, cancel button during generation, placeholder text per state

**ConversationMessages:**
- Simple message list with user/assistant bubbles
- System messages shown as status chips ("Added poll", "Made anonymous")
- Artifact snapshots rendered inline via ToolArtifact

**ConversationActions:**
- Deploy button (with space picker)
- "Open in Studio" link to `/tools/studio/{toolId}` (the IDE)
- Share link
- Shows only in `previewing` and `deployed` states

**ConversationSuggestions:**
- 3-4 prompt suggestions for idle state
- Context-aware: different suggestions in space sidebar vs standalone
- Clicking a suggestion fills the input and auto-submits

**Dependencies:** 1.3 (ArtifactHeader), 1.4 (ConversationContext)
**Effort:** 2 days

### 1.7 ConversationFull Page

**What:** Full-page conversation UI at `/tools` (replaces current `BuilderDashboard`).

**Create:** `apps/web/src/components/hivelab/conversation/ConversationFull.tsx`

**Modify:** `apps/web/src/app/tools/page.tsx` -- replace `BuilderDashboard` with `ConversationFull`

**Layout:**
- Two-column layout: conversation (left 50%) + artifact (right 50%)
- On mobile: stacked (conversation top, artifact below)
- Conversation column: messages list, input at bottom
- Artifact column: ToolArtifact rendering, ArtifactHeader on top
- Below artifact: "Your Tools" section (existing tool grid from current dashboard)

**Keep from current page:**
- `fetchUserTools()` query for "Your Tools" section
- Template-from-query handling (`?template=...` from deep links)
- Space context from query params (`?spaceId=...`)

**Remove from current page:**
- `WordReveal` animation component (no longer needed)
- `GoldBorderInput` (replaced by `ConversationInput`)
- `QuickStartChips` (templates now hidden behind intent router)
- `ceremonyPhase` state machine (replaced by conversation state machine)
- New user vs active builder split (single experience for all)

**Dependencies:** 1.1-1.6 all
**Effort:** 2 days

### 1.8 Deploy-in-Conversation

**What:** Detect deploy intent from conversation, resolve target space, confirm and deploy inline.

**Create:**
- `packages/core/src/domain/hivelab/deploy-intent.ts`
- `apps/web/src/hooks/use-space-matcher.ts`

**`deploy-intent.ts`:** Detects phrases like "add to Photography Club", "deploy to my space", "put this in our board". Extracts target name.

**`use-space-matcher.ts`:** Fetches user's joined spaces, fuzzy-matches target name against space names. Returns best match or shows picker if ambiguous.

**Integration in `useConversationEngine`:**
- When user sends a message in `previewing` state, first check for deploy intent
- If deploy intent detected:
  1. Resolve target space via `useSpaceMatcher`
  2. Show confirmation inline in messages: "Deploy [Tool Name] to Photography Club?"
  3. On confirm: call `POST /api/tools` then `POST /api/tools/deploy`
  4. On success: transition to `deployed`, show "Live in Photography Club" with link

**No new API routes.** Uses existing `POST /api/tools` and `POST /api/tools/deploy`.

**Dependencies:** 1.4 (ConversationContext), 1.7 (ConversationFull for testing)
**Effort:** 1.5 days

### 1.9 Iteration Protocol

**What:** Follow-up prompts modify existing artifacts. "Make it anonymous" -> modify config. "Add a countdown" -> stream new element.

**Create:** `packages/core/src/domain/hivelab/iteration-classifier.ts`

**Types of iteration:**
- **modify**: Change config of existing element (client-side, instant)
- **add**: Add new element (triggers streaming generation with `isIteration: true`)
- **remove**: Remove element (client-side, instant)
- **restyle**: Change layout (client-side, instant)
- **replace**: Swap element type (client-side, instant)

**For modify/remove/restyle/replace:** Applied in `useConversationEngine` without API call. The `applyIteration()` function from architecture doc handles this.

**For add:** Calls `streaming.generate({ prompt, isIteration: true, existingComposition })`. The existing `useStreamingGeneration` hook already supports this (lines 63-66, 122-135).

**Integration:** In `useConversationEngine.send()`, when `session.artifact` exists, classify the follow-up as iteration type before routing.

**Dependencies:** 1.4 (ConversationContext)
**Effort:** 2 days

### Phase 1 Total Effort: ~13 days

### Phase 1 Critical Path

```
1.1 ToolArtifact (1d)
  -> 1.2 ArtifactStreamLayout (0.5d)
    -> 1.7 ConversationFull (2d)

1.5 Intent Router (1.5d) [parallel with 1.1-1.2]

1.4 useConversationEngine (2d) [after 1.5]
  -> 1.6 Shared UI Components (2d)
    -> 1.7 ConversationFull (2d)
      -> 1.8 Deploy-in-conversation (1.5d)
      -> 1.9 Iteration Protocol (2d) [can parallel with 1.8]
```

**Minimum time to ship (critical path):** 1 + 0.5 + 1.5 + 2 + 2 + 2 = ~9 days with 1 developer
**With parallelism (2 devs):** ~6 days

---

## Phase 2: Embedded Everywhere

Get conversation UI into spaces, command palette, and chat. Ordered by impact.

### 2.1 ConversationSidebar (Spaces)

**Highest impact.** Creating a tool from within a space, for that space, is the killer use case. No navigating away. No context switching.

**Create:** `apps/web/src/components/hivelab/conversation/ConversationSidebar.tsx`

**Modify:** `apps/web/src/components/spaces/boards-sidebar.tsx`
- Add a "Build a Tool" section/button to the sidebar (alongside `SidebarToolSection`)
- On click: expand `ConversationSidebar` panel (320px fixed width)
- Sidebar auto-sets `spaceContext` (current space ID/name)
- Deploy button defaults to current space

**Layout constraints (320px):**
- Input at bottom, artifact scrolls above
- Messages collapsed to status chips
- No prompt suggestions (space context provides them)
- Compact `ToolArtifact` with `surface: 'sidebar'`

**Dependencies:** Phase 1 complete (all shared components exist)
**Effort:** 2 days

### 2.2 ConversationCommandPalette (Cmd+K)

**Create:** `apps/web/src/components/hivelab/conversation/ConversationCommandPalette.tsx`

**Integration point:** HIVE likely has an existing command palette or can add one.

**Layout:**
- Centered modal, 560px wide, max 70vh
- Input at top (search pattern)
- Artifact renders below
- "Enter" on completed artifact deploys to last-used space
- "Tab" to expand to full page `/tools`

**Dependencies:** Phase 1 complete
**Effort:** 2 days

### 2.3 ConversationInline (Space Chat)

**Lowest impact of the three.** Only useful if spaces have active chat.

**Create:** `apps/web/src/components/hivelab/conversation/ConversationInline.tsx`

**Layout:**
- Rendered as a special message bubble in space chat
- Compact artifact (max 320px wide)
- Single "Deploy here" action

**Dependencies:** Phase 1 + Phase 2.1
**Effort:** 1.5 days

### Phase 2 Total Effort: ~5.5 days

---

## Phase 3: Ecosystem

Compound effects that make the platform sticky.

### 3.1 Template Marketplace

Templates are surfaced when AI matches them. But users should also be able to browse what's available.

**Modify:** `apps/web/src/app/tools/templates/page.tsx` (existing)
- Add "Created by [username]" attribution
- Add "Used X times" counter
- Add "Fork" button to start conversation with template pre-loaded

**Effort:** 2 days

### 3.2 Fork Chains

When a user creates a tool from a template (or from another user's tool), track the lineage.

**Data model addition:** `tool.forkedFrom: { toolId: string, userId: string }` in Firestore

**Create:** `packages/core/src/domain/hivelab/fork-chain.ts` - lineage tracking

**No new API routes.** Add `forkedFrom` field to existing `POST /api/tools` body.

**Effort:** 1 day

### 3.3 AI Suggestions

After a tool is deployed and used, suggest improvements based on usage patterns.

**Example:** "Your poll has been live for 3 days. 80% of members voted. Want to close it and share results?"

This is a notification + suggestion system, not a conversation feature.

**Effort:** 3 days (requires usage analytics pipeline)

### Phase 3 Total Effort: ~6 days

---

## Migration Strategy

### Route Changes Summary

| Old Route | New Route | Redirect Type |
|-----------|-----------|---------------|
| `/lab` | `/tools` | 301 permanent |
| `/lab/:path*` | `/tools/:path*` | 301 permanent |
| `/hivelab` | `/tools` | 301 permanent (already exists, update destination) |
| `/hivelab/:path*` | `/tools/:path*` | 301 permanent (already exists, update destination) |
| `/tools` | N/A | Remove current redirect (was -> `/lab`) |
| `/tools/:path*` | N/A | Remove current redirect (was -> `/lab/:path*`) |

### Backwards Compatibility

1. **`next.config.mjs` redirects** handle old URLs. Users with bookmarks to `/lab/*` get 301 redirected to `/tools/*`.
2. **API routes don't change.** All 41 routes under `/api/tools/` stay exactly where they are.
3. **Firebase data doesn't change.** Tool documents in Firestore have no URL fields.
4. **Shared links.** Any `/lab/{toolId}` links shared externally will redirect to `/tools/{toolId}`.

### IDE Preservation

The full IDE (canvas, drag-and-drop, visual editor) moves to `/tools/studio` or `/tools/[toolId]` (the existing tool detail page).

**Rename:** The `/tools/[toolId]` page IS the IDE. No route change needed for the IDE itself.

Add explicit "Open in Studio" route alias:
- `apps/web/src/app/tools/studio/[toolId]/page.tsx` -> redirect to `/tools/[toolId]`

Or simpler: just link to `/tools/{toolId}` from the conversation "Open in Studio" button.

### Edge Middleware Update

**File:** `apps/web/src/middleware.ts`

- Line 67: Change `'/build': '/lab/create'` to `'/build': '/tools/create'`
- Add `/tools` to the authenticated routes check (replace `/lab` match)

---

## What to Kill

### Files to Delete (after Phase 1 ships)

| File | Reason |
|------|--------|
| `apps/web/src/components/hivelab/dashboard/QuickStartChips.tsx` | Replaced by intent router. Templates matched by AI, not browsed by user. |
| `apps/web/src/app/tools/page.tsx` old `BuilderDashboard` component | Replaced entirely by `ConversationFull`. The file stays but content is replaced. |

### Files to Keep (despite seeming obsolete)

| File | Reason to Keep |
|------|----------------|
| `packages/ui/src/components/hivelab/StreamingCanvasView.tsx` | Still used by the IDE (canvas view with absolute positioning). Not used by conversation. |
| `packages/ui/src/components/hivelab/ide/template-gallery.tsx` | Still used for IDE template browsing. May deprecate in Phase 3. |
| `apps/web/src/app/tools/[toolId]/deploy/page.tsx` | Still used for direct-link deploys. Conversation deploy is additive. |
| `apps/web/src/app/tools/templates/page.tsx` | Evolves into template marketplace in Phase 3. |
| `apps/web/src/lib/hivelab/create-tool.ts` | `createBlankTool` still used by IDE. `createToolFromTemplateApi` used by intent router. |

### Components to Eventually Deprecate (Phase 3+)

- `apps/web/src/components/hivelab/dashboard/ToolCard.tsx` -- if "Your Tools" section moves into conversation history
- `packages/ui/src/design-system/components/hivelab/QuickCreateWizard.tsx` -- replaced by conversation flow

---

## Risk Assessment

### High Risk: AI Intent Router Quality

**What breaks:** If the intent router misclassifies prompts (matches wrong template, or falls through to full generation when a template would be better), users get slow or wrong results.

**Mitigation:**
- Start conservative: only match templates at confidence >= 0.7 (not 0.5 from spec)
- Add a "Not what you wanted? Try describing it differently" action in previewing state
- Log all routing decisions for quality analysis
- Template match is instant (<100ms); the cost of a false positive is "user iterates once" -- acceptable

### Medium Risk: Iteration Classifier Accuracy

**What breaks:** "Make it anonymous" might not correctly identify which element to modify, or what config change to apply.

**Mitigation:**
- Start with only `add` (full generation) and `remove` (simple) iterations
- Defer `modify`, `restyle`, `replace` to Phase 1.5 (after shipping the core loop)
- For complex iterations, show "I'll modify it -- does this look right?" confirmation before applying

### Medium Risk: ToolArtifact Layout Quality

**What breaks:** Elements designed for absolute-positioned canvas may not look good in a vertical flow layout. Some elements assume specific widths (280px default from streaming hook).

**Mitigation:**
- The existing `renderElementSafe` already renders elements standalone (they're self-contained React components)
- Set max-width per surface and let elements respond to container width
- Test with all 27 element types in flow layout during 1.1 build

### Low Risk: Deploy Flow Interruptions

**What breaks:** User starts deploy, network fails, tool saved but not deployed.

**Mitigation:**
- Already handled by existing deploy API error responses
- Conversation state machine has `error` state with retry
- Saved-but-not-deployed tools appear in "Your Tools" as drafts

### Low Risk: Route Migration Breaking External Links

**What breaks:** If any external service or shared link points to `/lab/*`.

**Mitigation:** 301 redirects in `next.config.mjs` are permanent and cached by browsers/search engines. No broken links.

---

## Summary Timeline

| Phase | What Ships | Calendar Estimate |
|-------|-----------|-------------------|
| Phase 0 | Route rename, copy changes, blank tool bug fix | This week |
| Phase 1 | Full conversational creation at `/tools` | +2 weeks |
| Phase 2.1 | Space sidebar creation | +1 week |
| Phase 2.2-2.3 | Command palette + inline chat | +1 week |
| Phase 3 | Marketplace, fork chains, AI suggestions | +2 weeks |

**Total: ~6-7 weeks to full ecosystem.**
**Minimum viable: Phase 0 + Phase 1 = 2-3 weeks to ship the core conversation loop.**

---

## New Files Created (All Phases)

### packages/core/src/domain/hivelab/
```
conversation-machine.ts       # State machine types and transitions
intent-router.ts              # Prompt -> routing decision
template-matcher.ts           # Template matching and scoring
deploy-intent.ts              # Deploy intent detection from prompts
iteration-classifier.ts       # Follow-up prompt classification
intent-detection.ts           # MOVED from apps/web/src/lib/ai-generator/
```

### packages/ui/src/design-system/components/hivelab/
```
ToolArtifact.tsx              # Live tool artifact renderer
ArtifactStreamLayout.tsx      # Streaming build animation
ArtifactHeader.tsx            # Name, status, action buttons
```

### apps/web/src/contexts/conversation/
```
ConversationContext.tsx        # React context provider
```

### apps/web/src/hooks/
```
use-conversation-engine.ts    # Core engine hook
use-space-matcher.ts          # Fuzzy space name resolution
```

### apps/web/src/components/hivelab/conversation/
```
ConversationFull.tsx           # Full-page conversation UI
ConversationSidebar.tsx        # Space sidebar conversation
ConversationCommandPalette.tsx # Cmd+K conversation
ConversationInline.tsx         # Chat-embedded conversation
shared/
  ConversationInput.tsx        # Universal input box
  ConversationMessages.tsx     # Message history
  ConversationActions.tsx      # Deploy/Share/Studio bar
  ConversationSuggestions.tsx  # Idle state suggestions
```

### No New API Routes

All functionality uses existing endpoints:
- `POST /api/tools/generate` -- streaming generation
- `POST /api/tools` -- save tool
- `POST /api/tools/deploy` -- deploy to space/profile
