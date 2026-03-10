# Eval Spec: HiveLab Creation Engine

The creation engine is HIVE's only competitive win. If this doesn't work flawlessly, nothing else matters.

## Scope

The full creation pipeline: prompt input → classification → shell preview OR code generation → config editing → deploy → share → standalone runtime. Covers `/build`, `/api/tools/*`, `/t/[toolId]`, shell system, code gen, and the state machines that connect them.

---

## Tier 1: Deterministic

These are binary — pass or fail, no judgment calls.

| # | Check | How to verify |
|---|-------|---------------|
| D1 | TypeScript compiles cleanly | `pnpm typecheck` exits 0 |
| D2 | Production build succeeds | `pnpm --filter=@hive/web build` exits 0 |
| D3 | `/build` route exists and exports default | `apps/web/src/app/(shell)/build/page.tsx` exports default component |
| D4 | Classify API route exists with POST handler | `apps/web/src/app/api/tools/classify/route.ts` exports POST |
| D5 | Generate API route exists with POST handler | `apps/web/src/app/api/tools/generate/route.ts` exports POST |
| D6 | All 3 shell formats have type definitions | `ShellFormat` includes `'poll' | 'bracket' | 'rsvp' | 'custom'` in `shells/types.ts` |
| D7 | Shell state types exist for all 3 formats | `PollState`, `BracketState`, `RSVPState` exported from `shells/types.ts` |
| D8 | `useBuildMachine` hook exists and exports | `hooks/use-build-machine.ts` exports `useBuildMachine` and `BuildPhase` |
| D9 | Build machine covers all phases | `BuildPhase` type includes: `idle`, `classifying`, `shell-matched`, `generating`, `complete` |
| D10 | Standalone tool route exists | `apps/web/src/app/t/[toolId]/page.tsx` exists with metadata generation |
| D11 | StandaloneToolClient handles both shell and code tools | Component renders `LazyShellRenderer` for shells and `LazyToolCanvas` for code tools |
| D12 | Classify API uses `withAuthAndErrors` middleware | Auth wrapper present on POST handler |
| D13 | Generate API validates auth | Auth check present before generation |
| D14 | Rate limiting on AI endpoints | Both classify and generate have rate limit configuration |
| D15 | `SHELL_REGISTRY` maps all 3 native formats | Registry entries exist for poll, bracket, rsvp |
| D16 | Initial state builders exist for all 3 formats | `buildInitialPollState`, `buildInitialBracketState`, `buildInitialRSVPState` in use-build-machine |
| D17 | No `any` types in shell type definitions | `shells/types.ts` has zero `any` |
| D18 | Zod schemas validate classify request/response | `ClassifyRequestSchema` and `ClassifyResponseSchema` defined |

---

## Tier 2: Functional

Assertions about behavior — requires reading code and tracing logic, not running it.

| # | Assertion | What to check |
|---|-----------|---------------|
| F1 | Prompt → classify → shell-matched flow is complete | `submitPrompt` in build machine dispatches `SUBMIT_PROMPT`, calls classify API, on success dispatches `CLASSIFICATION_SUCCESS` with format + config, transitions to `shell-matched` when confidence > threshold |
| F2 | Shell config editors exist for all 3 formats | `PollConfigEditor`, `BracketConfigEditor`, `RSVPConfigEditor` (or equivalent) render in `shell-matched` phase |
| F3 | Poll config allows 2-6 options | Min 2 options enforced, max 6 enforced in both Zod schema and UI (add button hidden at 6) |
| F4 | Bracket entries pad to even count | `buildInitialBracketState` adds "Bye" entry when odd count |
| F5 | Custom/low-confidence falls through to code gen | When classify returns `format: 'custom'` or confidence < threshold, build machine transitions to `generating` and calls `/api/tools/generate` |
| F6 | Code generation streams chunks | Generate API returns streaming response with typed chunks (`thinking`, `code`, `element`, `complete`, `error`) |
| F7 | Deploy saves to Firestore | `acceptShell` or equivalent creates tool document in Firestore with format, config, state |
| F8 | Deploy writes initial state to RTDB | Shell state (votes, matchups, attendees) written to Firebase RTDB at creation |
| F9 | Unauthed user hits signup gate at deploy | When `!user`, pending deploy saved to localStorage, redirect to `/enter?redirect=/build` |
| F10 | Pending deploy restores after auth | On mount with user, `loadPendingDeploy` checks localStorage, restores prompt + format + config, skips re-classification for native formats |
| F11 | Share copies standalone URL | `handleShare` copies `${origin}/t/${toolId}` to clipboard |
| F12 | Standalone page works without auth | `/t/[toolId]` loads tool data and renders without requiring login |
| F13 | Standalone page handles shell tools | Shell tools on standalone page use `useShellState` for real-time state from RTDB |
| F14 | Standalone page handles code tools | Code tools render via `ToolCanvas` with sandboxed HTML/CSS/JS |
| F15 | Shell actions dispatch correctly | `ShellAction` types (poll_vote, poll_close, bracket_vote, rsvp_toggle) are handled and write to RTDB |
| F16 | Space context enriches classification | When `spaceId` provided, classify API fetches space metadata and appends to AI prompt |
| F17 | Iteration mode modifies existing tools | Generate API accepts `existingCode`/`existingComposition` + `isIteration` flag for modification |
| F18 | Error boundary wraps shell preview | `PreviewErrorBoundary` catches render crashes without losing creation state |
| F19 | Example prompts submit on click | Idle state shows example prompts that call `submitPrompt` directly |
| F20 | Auto-prompt from query params works | `?prompt=` search param auto-fills and auto-submits on mount |

---

## Tier 3: Ceiling

Subjective quality — scored 0.0 to 1.0. These are the "is it good?" questions.

| # | Test | What to evaluate |
|---|------|-----------------|
| C1 | **Time-to-first-value** | From landing on `/build` to seeing a working preview. Target: <5 seconds for native shells (prompt + 500ms classify + instant shell render). How close? Does the classify latency feel instant or does it create doubt? Is the idle→classifying→shell-matched transition smooth or jarring? |
| C2 | **Classification accuracy** | Test 10 prompts across formats. Does "best pizza near campus?" → poll? "March madness dining halls" → bracket? "who's coming friday" → rsvp? "study group finder" → custom? How many misclassify? Does confidence score correlate with actual accuracy? |
| C3 | **Shell config editing UX** | Can a user modify the AI-generated config without friction? Poll: edit question, add/remove options. Bracket: reorder entries. RSVP: add location, time. Are the inline editors discoverable? Do they feel like editing, not filling out a form? |
| C4 | **Code generation quality** | For custom prompts, does the generated HTML/CSS/JS produce something functional and visually coherent? Does it look like HIVE (dark theme, gold accents) or generic? Does iteration ("make the header bigger") produce correct diffs? |
| C5 | **Deploy-to-share flow** | After creation, how many taps to get a shareable link? Is the deploy CTA obvious? Does the space picker work intuitively? Is the share URL readable? Is the transition from "editing" to "deployed" clear? |
| C6 | **Standalone tool experience** | Opening `/t/[toolId]` as a non-user: does it load fast? Does it render correctly on mobile? Can you vote/RSVP without signing up? Does "Made with HIVE" lead somewhere? Is it screenshot-worthy when shared in GroupMe? |
| C7 | **Error recovery** | What happens when classify API fails? When code gen streams an error? When RTDB write fails? Does the user get stuck or can they retry? Does the error boundary preserve creation state? |
| C8 | **Mobile creation experience** | Full `/build` flow on a 375px viewport. Does the split panel stack correctly? Is the prompt input thumb-reachable? Can you configure a poll shell without horizontal scrolling? Does deploy work without desktop? |
| C9 | **Returning creator experience** | Creator comes back to `/build`. Do they see their previous apps (MyAppsSection)? Can they iterate on an existing tool? Is there signal that their last creation got engagement? |
| C10 | **Campus context integration** | Does classification use UB-specific knowledge? "Best dining hall" → options include Crossroads, C3, Sizzles (not generic "Cafeteria A"). "Study spot bracket" → entries include Lockwood, Silverman, Capen. Does space context change the output? |

**Ceiling scoring:**
- 0.0-0.3: Broken or generic — would not trust it
- 0.4-0.6: Works but rough edges — needs fixes before launch
- 0.7-0.8: Solid — would ship with minor polish
- 0.9-1.0: Delightful — would screenshot and share

---

## Perspectives

Test from 3 personas that matter most for the creation engine:

### Overwhelmed Org Leader (primary user)
"I run SGA and I need a quick poll for our meeting in 2 hours."
- Can they go from `/build` → deployed poll → shareable link in under 60 seconds?
- Does the AI pre-fill reasonable options for their org context?
- Do they understand they can edit the AI's suggestions?
- Would they use this over Google Forms? Why or why not?

### First-Time Creator (activation)
"I just signed up. My RA told me to check out HIVE."
- Do the example prompts help them understand what to make?
- Is the classification magic moment ("I typed words and got a poll") clear?
- Does deploy feel scary or obvious?
- What happens if their first prompt is vague ("idk something fun")?

### Returning Skeptic (retention)
"I made a poll last week. Why am I back here?"
- Do they see their previous creations?
- Is there signal their poll got engagement?
- Can they iterate ("add another option") without starting over?
- Does anything on `/build` give them a reason to create again?

**Perspective scoring:** Same 0.0-1.0 scale as ceiling tests.

---

## Verdicts

| Verdict | Criteria |
|---------|----------|
| **SHIP** | All D-checks pass, all F-checks pass, ceiling avg ≥ 0.7, perspectives avg ≥ 0.7 |
| **SHIP WITH FIXES** | All D-checks pass, ≥80% F-checks pass, ceiling avg ≥ 0.5, top fixes identified |
| **NOT READY** | D-check failures OR ceiling avg < 0.5 OR critical F-check failures |

---

## Critical Path (what blocks launch)

These are the F-checks and C-checks that, if they fail, mean the creation engine isn't ready:

1. **F1 + F5**: The classify → shell OR classify → codegen fork must work. If prompts don't route correctly, nothing downstream works.
2. **F9 + F10**: Unauthed creation → auth → restore. This IS the activation flow. If pending deploy breaks, first-time creators lose their work.
3. **C1**: Time-to-first-value must be <5s for native shells. Classification at 500ms is the budget — if it's 3s, the magic is gone.
4. **C2**: Classification accuracy must be ≥80% on canonical prompts. A misclassified "who's coming friday" that generates code instead of RSVP is a trust-breaker.
5. **C6**: Standalone tool must work on mobile without auth. This is what people see when a link is shared in GroupMe. If it's broken, distribution is broken.

---

## How to Run This Eval

1. **D-checks**: `pnpm typecheck && pnpm --filter=@hive/web build` + grep/read verification for each check
2. **F-checks**: Code trace through each flow. Read the files, follow the state machine, verify the assertions.
3. **C-checks**: Manual testing on `localhost:3000/build` or deployed preview. Score each dimension.
4. **Perspectives**: Embody each persona, walk through their scenario, score honestly.
5. Write results to `docs/evals/reports/hivelab-creation-engine-YYYY-MM-DD.md`
6. Append to `docs/evals/reports/history.jsonl`
7. Update `docs/evals/EVAL-RESULTS.md`
