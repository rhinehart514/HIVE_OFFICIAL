# CODEX TASK 2: HiveLab Week 1 — Make What Exists Work

This is a Next.js 15 Turborepo monorepo. Packages: `@hive/core`, `@hive/ui`, `@hive/tokens`, `@hive/hooks`, `@hive/validation`. Main app: `apps/web`.

**RULES:**
- Do NOT rewrite working code — only modify what's specified
- After each task, commit with a descriptive message
- Run `pnpm --filter @hive/core typecheck && pnpm --filter @hive/ui typecheck` after each task
- If a typecheck fails on something YOU didn't touch, skip it and note it

---

## Task 1: Consolidate AI to Groq Only (Kill Gemini + Ollama)

### 1a: Kill `ai-intent-parser.ts` (Gemini-based intent parser)
- File: `apps/web/src/lib/ai-intent-parser.ts`
- This uses Firebase AI / Gemini for chat intent parsing
- It's imported in: `apps/web/src/app/api/spaces/[spaceId]/chat/intent/route.ts`
- **Replace the Gemini implementation** with a local keyword-based parser using the INTENT_SIGNALS from `apps/web/src/lib/ai-generator/intent-detection.ts`
- Keep the same exported types (`IntentType`, `ParsedIntent`, `IntentParams`) and function signatures
- The intent detection keyword system already exists and is better (22 types vs 6). Use `detectIntent()` from `intent-detection.ts` and map its output to the `ParsedIntent` format
- Remove all Firebase AI / Gemini imports from this file

### 1b: Kill Ollama backend in `goose-server.ts`
- File: `apps/web/src/lib/goose-server.ts`
- Remove: `checkOllamaHealth()`, `generateWithOllama()`, `pullModel()`, any Ollama-specific code
- Keep: `generateTool()` (rules-based path), `generateToolStream()` (rules-based streaming), Groq path if it exists
- Update `getAvailableBackend()` to only return `'groq'` or `'rules'` (never `'ollama'`)
- Update `getGooseConfig()` to remove `ollamaHost` and `ollamaModel` fields

### 1c: Kill `firebase-ai-generator.ts` as standalone backend
- File: `apps/web/src/lib/firebase-ai-generator.ts`
- This is a Gemini-based tool generator (250+ lines)
- It's imported in `apps/web/src/app/api/tools/generate/route.ts`
- In `generate/route.ts`: remove the Firebase AI code path. Keep rules-based as primary, Groq as fallback
- Do NOT delete `firebase-ai-generator.ts` yet (other files might import types) — just remove its usage from the generate route

### 1d: Clean up `generate/route.ts`
- File: `apps/web/src/app/api/tools/generate/route.ts`
- Remove Ollama backend selection logic
- Remove Firebase AI backend selection logic
- Simplify to: try rules-based first → if `GROQ_API_KEY` exists, offer Groq as enhanced option
- Remove `checkOllamaHealth` import and usage
- Remove `isFirebaseAIAvailable` import and usage

**Commit:** `refactor: consolidate AI to Groq-only, remove Gemini and Ollama backends`

---

## Task 2: Deduplicate Intent Systems → Single Router

There are THREE intent systems:
1. `apps/web/src/lib/ai-intent-parser.ts` — Gemini-based, 6 intent types (you just replaced with keywords in Task 1)
2. `apps/web/src/lib/ai-generator/intent-detection.ts` — keyword-based, 22 intent types (THE GOOD ONE)
3. `apps/web/src/app/api/tools/create-from-intent/route.ts` — has its own `findCatalogMatch()` keyword matching

**Goal:** Make `intent-detection.ts` the single source of truth.

### 2a: Update `create-from-intent/route.ts`
- Replace `findCatalogMatch()` with `detectIntent()` from `intent-detection.ts`
- Map the 22 detected intents to either:
  - A catalog element composition (for known patterns like polls, RSVPs, countdowns)
  - Custom block generation (for novel/complex requests)
- The intent→element mapping should be a simple lookup table:
  ```typescript
  const INTENT_TO_ELEMENT: Record<string, string> = {
    'enable-voting': 'poll-element',
    'coordinate-people': 'rsvp-button',
    'track-time': 'countdown-timer',
    'broadcast': 'announcement',
    'collect-input': 'form-builder',
    'rank-items': 'leaderboard',
    'show-results': 'result-list',
    'search-filter': 'search-input',
    'visualize-data': 'chart-display',
    'discover-events': 'personalized-event-feed',
    'find-food': 'dining-picker',
    'find-study-spot': 'study-spot-finder',
  };
  ```
- Intents NOT in the map (like `photo-challenge`, `attendance-tracking`, `group-matching`, `custom-visual`, etc.) → route to custom block generation
- Keep the confidence threshold: if `detectIntent()` returns confidence < 0.3, go straight to custom block

### 2b: Update `ai-intent-parser.ts` to re-export from `intent-detection.ts`
- Make `ai-intent-parser.ts` a thin wrapper that maps `detectIntent()` output to the `ParsedIntent` format
- This preserves backward compatibility for `chat/intent/route.ts`

**Commit:** `refactor: unify three intent systems into single router via intent-detection.ts`

---

## Task 3: Verify and Fix Shared State → Firestore

### 3a: Audit `use-tool-runtime.ts`
- File: `apps/web/src/hooks/use-tool-runtime.ts` (1,048 lines)
- Check: does `handleAction()` persist state changes to Firestore via the `/api/tools/[toolId]/state` endpoint?
- Check: does it fall back to localStorage? If so, that's a bug for shared tools.
- If state is only in React state / localStorage:
  - Wire `handleAction()` to POST state changes to `/api/tools/[toolId]/state` after every action
  - Add a debounce (300ms) so rapid actions don't spam the API

### 3b: Audit `/api/tools/[toolId]/state/route.ts`
- Verify it reads/writes to Firestore (not in-memory or localStorage)
- Verify it supports per-user state AND shared state (a poll needs shared state, a personal tracker needs per-user)
- If missing shared state support: add a `scope` field (`'personal'` | `'shared'`) to the state API

### 3c: Audit element state persistence
- Check `packages/ui/src/components/hivelab/elements/core/use-element-state.ts`
- This hook manages per-element state. Verify it calls the runtime's state persistence, not just `useState`

**Commit:** `fix: ensure tool state persists to Firestore, not just localStorage/React state`

---

## Task 4: Wire Real-Time State Sync for Deployed Tools

### 4a: Add SSE endpoint for tool state
- File: Create `apps/web/src/app/api/tools/[toolId]/state/stream/route.ts`
- Pattern: Follow the existing SSE pattern from `apps/web/src/app/api/spaces/[spaceId]/chat/stream/` (or similar SSE routes in the codebase)
- When tool state changes, push updates to all connected clients
- Use Firestore `.onSnapshot()` listener on the tool state document

### 4b: Wire SSE into `use-tool-runtime.ts`
- When a tool is deployed to a space (not in editor mode), connect to the SSE stream
- On receiving state updates from SSE, merge into local state
- This makes polls, counters, signup sheets update in real-time for all users

**Commit:** `feat: add real-time state sync via SSE for deployed tools`

---

## Task 5: Rate Limiting Enforcement for AI Generation

### 5a: Verify rate limits on generation endpoints
- Check `apps/web/src/lib/ai-usage-tracker.ts` — what limits does it enforce?
- Ensure these endpoints have rate limiting:
  - `POST /api/tools/generate` (rules-based + Groq)
  - `POST /api/tools/create-custom-block` (Groq)
  - `POST /api/tools/create-from-intent` (may call Groq)
- If rate limiting is missing on create-custom-block or create-from-intent, add it:
  - Use the existing `aiGenerationRateLimit` from `apps/web/src/lib/rate-limit-simple.ts`
  - Import and call at the top of each route handler

### 5b: Set per-user daily limits
- In `ai-usage-tracker.ts`, ensure daily limit is set to 50 generations per user
- After 50, return 429 with message "Daily generation limit reached. Resets at midnight."

**Commit:** `feat: enforce rate limiting on all AI generation endpoints (50/day per user)`

---

## Task 6: Delete Dead Code

- Delete: `apps/web/src/lib/mock-ai-generator.ts` (mock AI, never used in production)
- Delete: `apps/web/src/lib/firebase-ai-generator.ts` (killed in Task 1, verify no remaining imports first)
- If `firebase-ai-generator.ts` still has imports elsewhere, leave it but add `@deprecated` JSDoc comment
- Clean up any unused imports in files you've modified

**Commit:** `chore: remove dead AI code (mock generator, firebase AI generator)`

---

## Final: Run Full Typecheck

```bash
pnpm --filter @hive/core typecheck && pnpm --filter @hive/ui typecheck && pnpm --filter @hive/web typecheck
```

Report any failures. If they're pre-existing (not from your changes), note them and move on.

When done with all 6 tasks, run:
```bash
echo "CODEX-TASK-2 COMPLETE" > /tmp/codex-done-2
```
