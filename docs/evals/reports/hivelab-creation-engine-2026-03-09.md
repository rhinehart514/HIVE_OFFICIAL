# Eval: HiveLab Creation Engine — 2026-03-09

## Tier 1: Deterministic — 18/18 PASS

| # | Check | Result |
|---|-------|--------|
| D1 | TypeScript compiles cleanly | PASS |
| D2 | Production build succeeds | PASS |
| D3 | `/build` route exports default | PASS |
| D4 | Classify API exports POST | PASS |
| D5 | Generate API exports POST | PASS |
| D6 | ShellFormat includes poll/bracket/rsvp/custom | PASS |
| D7 | PollState, BracketState, RSVPState exported | PASS |
| D8 | useBuildMachine exports hook + BuildPhase | PASS |
| D9 | BuildPhase covers idle/classifying/shell-matched/generating/complete/error | PASS |
| D10 | `/t/[toolId]` route exists with metadata | PASS |
| D11 | StandaloneToolClient handles shell + code | PASS |
| D12 | Classify uses withAuthAndErrors | PASS |
| D13 | Generate validates auth | PASS |
| D14 | Rate limiting on both AI endpoints | PASS |
| D15 | SHELL_REGISTRY maps poll/bracket/rsvp | PASS |
| D16 | Initial state builders for all 3 formats | PASS |
| D17 | Zero `any` in shells/types.ts | PASS |
| D18 | Zod schemas for classify request/response | PASS |

---

## Tier 2: Functional — 19/20 PASS, 1 PARTIAL

| # | Assertion | Result | Notes |
|---|-----------|--------|-------|
| F1 | Prompt → classify → shell-matched flow complete | PASS | Full chain traced: submitPrompt → SUBMIT_PROMPT → classify API → CLASSIFICATION_SUCCESS → shell-matched when confidence > 0.5. Client-side fallback on API failure. |
| F2 | All 3 shell config editors exist | PASS | PollConfigEditor, BracketConfigEditor, RSVPConfigEditor render in shell-matched phase via ShellConfigEditor switch. |
| F3 | Poll options min 2, max 6 | PARTIAL PASS | Enforced in UI (add hidden at 6, remove hidden at 2), Zod schema, and deploy validation. No max-6 guard on PUT API — minor API-level gap. |
| F4 | Bracket odd count pads with "Bye" | PASS | Explicit `if (entries.length % 2 !== 0) entries.push('Bye')` in buildInitialBracketState. |
| F5 | Custom/low-confidence → code gen | PASS | Three conditions trigger fallback: null result, non-native format, confidence ≤ 0.5. Fork is complete. |
| F6 | Generate streams typed chunks | PASS | AsyncGenerator yields thinking → code → complete (or error). NDJSON stream. Spec's `element` type only exists in composition mode — code mode correctly uses thinking/code/complete/error. |
| F7 | Deploy saves to Firestore | PASS | createBlankTool → POST /api/tools, then PUT with format/config/status. |
| F8 | Deploy writes RTDB initial state | PASS | `set(ref(db, shell_states/${toolId}), initialState)` — non-blocking, shell tools only. |
| F9 | Unauthed → localStorage → /enter redirect | PASS | savePendingDeploy writes prompt/format/config, router.push('/enter?redirect=/build'). |
| F10 | Post-auth restore skips re-classification | PASS | loadPendingDeploy on mount dispatches CLASSIFICATION_SUCCESS with confidence 1.0 for native formats. Key is removed after read. |
| F11 | Share copies /t/{toolId} URL | PASS | navigator.clipboard.writeText + navigator.share fallback on mobile. |
| F12 | Standalone works without auth | PASS | GET handler uses withErrors (not withAuthAndErrors). Anonymous access for published/public tools. |
| F13 | Shell tools use real-time RTDB | PASS | useShellState subscribes via onValue to shell_states/${shellId}. Persistent listener. |
| F14 | Code tools render via ToolCanvas | PASS | LazyToolCanvas from @hive/ui, dynamically imported. Sandboxing handled internally. |
| F15 | ShellAction types handled + RTDB writes | PASS | poll_vote, poll_close, bracket_vote, rsvp_toggle, rsvp_cancel all dispatch optimistic updates + RTDB writes. |
| F16 | Space context enriches classification | PASS | fetchSpaceContext reads space name/category/orgType/tags from Firestore, prepends to prompt. |
| F17 | Iteration mode accepts existing code | PASS | GenerateToolRequestSchema includes existingCode, existingComposition, isIteration. API forwards to generation functions. |
| F18 | PreviewErrorBoundary preserves state | PASS | Catches shell render crashes. Build machine state (prompt, classification, shellConfig) lives outside boundary — unaffected. |
| F19 | Example prompts submit on click | PASS | 4 UB-specific examples, onClick → submitPrompt(example). |
| F20 | ?prompt= auto-fills and auto-submits | PASS | useState(autoPrompt), useEffect fires onSubmit after 100ms. |

---

## Tier 3: Ceiling — Average 0.64/1.0

| # | Test | Score | Primary Gap |
|---|------|-------|-------------|
| C1 | Time-to-first-value | 0.62 | ShellRenderer lazy-load adds latency on first visit. Code gen shows spinner until complete code chunk — no progressive rendering. |
| C2 | Classification accuracy | 0.71 | No few-shot examples in system prompt. Ambiguous cases (vote vs bracket) rely on keyword priority without calibration. Client-side fallback produces generic options. |
| C3 | Shell config editing UX | 0.55 | No option reordering, no keyboard shortcuts, labels at text-white/30 barely readable, browser-native datetime picker fights dark theme. |
| C4 | Code generation quality | 0.68 | System prompt is excellent (HIVE SDK docs, dark-theme tokens, good examples). But: no progressive iframe update, iteration not wired in build machine (existingCode never passed), potential HIVE SDK injection gap in preview iframe. |
| C5 | Deploy-to-share flow | 0.63 | Tap count is good (2-3 taps). Gaps: no-spaces users hit dead end, share CTAs in complete state are text-white/30 (invisible), "Deploy" is dev jargon. |
| C6 | Standalone tool experience | 0.72 | OG pipeline is complete and correct. Anonymous voting works. "Made with HIVE" links out. Gaps: OG image uses #D4AF37 not #FFD700, "tools" copy leaks through in error states, no iOS safe-area on fixed conversion banner. |
| C7 | Error recovery | 0.74 | Classification fallback is solid (client-side regex → code gen). Error boundary preserves state. Gaps: reset() wipes edited shellConfig, code gen PUT failure is silently swallowed leaving orphaned empty tool. |
| C8 | Mobile creation experience | 0.61 | Panels stack correctly (flex-col on mobile). Gaps: no sticky deploy button (scrolls off on bracket with 16 entries), no pb-14 for bottom nav, no iOS safe-area padding. |
| C9 | Returning creator experience | 0.55 | MyAppsSection exists with use counts. Gaps: engagement data rendered at text-white/20 (invisible), wau/weeklyInteractions fields likely always 0, shell tools show "empty app" in /build/[toolId] studio. |
| C10 | Campus context integration | 0.68 | UB dining/study data in system prompt, UB-specific example prompts and inspiration cards. Gaps: client-side fallback is campus-blind (generic Option 1/2/3), space context only fires with query params. |

---

## Perspectives — Average 0.52/1.0

### Overwhelmed Org Leader: 0.65

She can get from prompt to working poll in <5 seconds. The AI pre-fills UB-specific options. The inline editors are discoverable and fast. She'd use this over Google Forms for the speed advantage.

**Gap:** The path from "Deploy" to "shareable link I can paste in GroupMe" requires either knowing to skip space placement or navigating two screens. No primary "Copy link" button exists in the complete state — only three tertiary text links at text-white/30.

### First-Time Creator: 0.55

Example prompts with real UB names (Jim's Steakout, Hertz vs. Alphonce) make the idle state feel campus-native. Clicking an example auto-submits and produces a live poll — the classification magic moment works. Auth gate preserves state through redirect.

**Gap:** The transition from "static example" to "this is yours" lacks a clear visual handoff. No celebratory moment. Vague prompts ("idk something fun") fall through to code gen silently — no guided recovery. The auth redirect may feel like losing work.

### Returning Skeptic: 0.35

MyAppsSection shows previous creations with deployment and use counts. The data exists. Social-proof push notification infrastructure is built.

**Gap:** Engagement data is rendered at text-white/20 — nearly invisible. The single most important signal for retention ("47 people voted on your poll") is displayed in 10px text at 20% opacity. No gold, no emphasis, no pull-back copy. Shell tools show "empty app" in the iteration view. The returning creator has to squint to find their impact, and if they find it, there's no emotional signal to create again.

---

## Verdict: SHIP WITH FIXES

**Reasoning:**
- All 18 deterministic checks pass
- 19/20 functional checks pass (F3 partial is non-blocking)
- Ceiling average: 0.64 (above 0.5 threshold)
- Perspectives average: 0.52 (below 0.7 threshold — drags verdict from SHIP to SHIP WITH FIXES)

The creation engine is architecturally sound. The classify → shell flow works. The state machine is correct. Auth gate with localStorage restore works. Campus context is genuinely differentiating. The social-proof notification infrastructure is built.

The product breaks down at **two specific points**, both in the post-creation experience:

---

## Top Fixes (ordered by impact)

### 1. Add primary "Copy link" CTA in complete state (BLOCKS SHIP)

Currently: three text links at text-white/30 ("View standalone", "Copy link", "Make another") appear after deploy. These are invisible.

Fix: Add a white pill button "Copy link" at the top of the complete state, above the space placement card. One tap to shareable URL. This is the #1 conversion failure — a user who creates something but can't find the link in 5 seconds will not return.

**Files:** `apps/web/src/app/(shell)/build/page.tsx` — complete state section (~line 952)

### 2. Make engagement data visible in MyAppsSection (BLOCKS RETENTION)

Currently: use counts at text-white/20 (20% opacity, 10px font). The returning creator's primary question ("did anyone use this?") is answered in near-invisible text.

Fix: Render use counts at text-white/70, add gold accent when count > 0, use 13px not 10px. Consider a header line: "47 people used your apps this week" in text-white/70 with gold number.

**Files:** `apps/web/src/app/(shell)/build/page.tsx` — MyAppsSection (~line 502)

### 3. Add sticky deploy button on mobile

Currently: Deploy button scrolls off-screen when bracket has 16 entries. User has to scroll past all entries to find deploy.

Fix: `sticky bottom-0` on the deploy button container with a `bg-gradient-to-t from-[var(--bg-void)]` fade.

**Files:** `apps/web/src/app/(shell)/build/page.tsx` — shell-matched phase deploy CTA

### 4. Preload ShellRenderer during idle state

Currently: lazy-loaded on first shell match, adding visible latency.

Fix: `import()` call in useEffect on mount (prefetch, don't render).

### 5. Wire iteration for code tools

Currently: `existingCode` field exists in API schema but build machine never passes it. Every code gen prompt creates from scratch.

Fix: When iterating on an existing code tool, pass `existingCode` and `isIteration: true` from the build machine's streamGeneration call.

---

## Ceiling Gaps (feed forward)

| Gap | Score Impact | Fix Complexity |
|-----|-------------|----------------|
| No primary share CTA in complete state | C5: -0.15, Perspectives: -0.15 | Low (1 button) |
| Engagement data invisible at 20% opacity | C9: -0.25, Perspectives: -0.20 | Low (CSS change) |
| No progressive code gen preview | C1: -0.10, C4: -0.10 | Medium (streaming iframe) |
| Shell config labels barely readable | C3: -0.10 | Low (opacity bump) |
| No option reordering in editors | C3: -0.10 | Medium (drag-drop) |
| Mobile deploy button not sticky | C8: -0.10 | Low (sticky CSS) |
| Code iteration not wired | C4: -0.10 | Medium (state plumbing) |
| No vague-prompt recovery | Perspectives: -0.10 | Medium (fallback UI) |
| iOS safe-area not accounted for | C8: -0.05 | Low (env() padding) |

---

## Critical Path Status

| Item | Status | Notes |
|------|--------|-------|
| Classify → shell/codegen routing (F1+F5) | PASS | Fork works with fallback |
| Unauthed create → auth → restore (F9+F10) | PASS | localStorage round-trip verified |
| Time-to-first-value <5s (C1) | 0.62 | Meets target for shells on good network, lazy-load adds gap |
| Classification accuracy ≥80% (C2) | 0.71 | Solid on canonical prompts, needs few-shot examples for edge cases |
| Standalone works on mobile without auth (C6) | 0.72 | Works, minor polish needed |
