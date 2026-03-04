# CODEX-TASK-3: HiveLab Week 2 — Make Creation Feel Magical

> Context: Week 1 is done (commit `281052c`). AI consolidated to Groq+rules, intents deduplicated, state dual-scoped, sync wired. Now we make the creation experience fast, smart, and rich.

## Codebase Orientation

- **Monorepo**: Turborepo with `apps/web`, `apps/admin`, `packages/core`, `packages/ui`
- **Intent detection**: `apps/web/src/lib/ai-generator/intent-detection.ts` — 22 intents with keyword scoring
- **Create-from-intent**: `apps/web/src/app/api/tools/create-from-intent/route.ts` — routes intents to elements or custom blocks
- **INTENT_TO_ELEMENT map** (in create-from-intent): currently only 12 mappings. Needs all 22.
- **Element registry**: `packages/ui/src/components/hivelab/elements/registry.tsx` — 38 elements registered
- **Custom block generator**: `packages/core/src/application/hivelab/custom-block-generator.service.ts`
- **Rate limiter**: `apps/web/src/lib/ai-usage-tracker.ts`
- **Rate limit middleware**: `apps/web/src/lib/rate-limit-simple.ts`

## Task 1: Wire ALL 22 intents to element compositions

**File**: `apps/web/src/app/api/tools/create-from-intent/route.ts`

The `INTENT_TO_ELEMENT` map currently has 12 entries. Add the remaining 10:

```typescript
const INTENT_TO_ELEMENT: Record<string, string> = {
  // Existing 12...
  // ADD THESE:
  'photo-challenge': 'composition', // multi-element
  'attendance-tracking': 'composition',
  'resource-management': 'composition',
  'multi-vote': 'composition',
  'event-series': 'composition',
  'suggestion-triage': 'composition',
  'group-matching': 'composition',
  'competition-goals': 'composition',
  'custom-visual': 'custom-block', // always goes to custom block generator
};
```

For `'composition'` intents, create a new `COMPOSITION_PATTERNS` map that assembles multiple elements into a single tool. See Task 2.

## Task 2: Build composition pattern library (50 patterns)

**New file**: `apps/web/src/lib/ai-generator/composition-patterns.ts`

Create a typed composition pattern system:

```typescript
export interface CompositionPattern {
  id: string;
  name: string;
  description: string;
  intent: Intent;
  /** Keywords that boost this specific pattern within its intent */
  keywords: string[];
  elements: CompositionElement[];
  connections: CompositionConnection[];
  /** Optional: space types where this pattern is most relevant */
  spaceTypes?: string[];
}

export interface CompositionElement {
  elementId: string;  // must match registry
  instanceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface CompositionConnection {
  fromElement: string; // instanceId
  fromPort: string;
  toElement: string;   // instanceId
  toPort: string;
}
```

Create **50 patterns** across these categories. Each pattern should be a realistic, useful tool:

**Governance (8 patterns)**:
1. club-election — poll + countdown + result-list
2. budget-vote — poll + chart-display (pie)
3. constitutional-amendment — poll + announcement + countdown
4. officer-nominations — form-builder + result-list
5. motion-vote — poll + countdown + announcement
6. board-decision-dashboard — multi-poll layout (3 polls + summary)
7. priority-ranking — leaderboard + poll + result-list
8. funding-request — form-builder + poll + chart-display

**Scheduling (6 patterns)**:
9. office-hours — rsvp-button + countdown + announcement
10. weekly-meeting — rsvp-button + countdown + form-builder (agenda)
11. study-group-finder — form-builder (availability) + result-list
12. event-rsvp — rsvp-button + countdown + announcement
13. availability-grid — form-builder (time slots) + result-list
14. recurring-meetup — rsvp-button + countdown + leaderboard (attendance)

**Commerce (6 patterns)**:
15. textbook-swap — form-builder (listing) + search-input + result-list
16. ticket-exchange — form-builder + search-input + countdown
17. services-board — form-builder + search-input + result-list
18. roommate-finder — form-builder + search-input + result-list
19. sublet-board — form-builder + search-input + result-list
20. free-stuff — form-builder + result-list

**Content (6 patterns)**:
21. club-newsletter — announcement + form-builder (subscribe)
22. weekly-digest — announcement + chart-display + result-list
23. meeting-minutes — form-builder + result-list
24. faq-board — form-builder (questions) + result-list
25. resource-library — form-builder + search-input + result-list
26. announcements-feed — announcement + countdown

**Social (6 patterns)**:
27. icebreaker — poll + result-list
28. two-truths-and-a-lie — form-builder + poll + result-list
29. this-or-that — poll + chart-display
30. superlatives — poll + result-list + leaderboard
31. shoutout-wall — form-builder + result-list
32. hot-takes — poll + chart-display + leaderboard

**Events (6 patterns)**:
33. event-countdown — countdown + rsvp-button + announcement
34. event-feedback — form-builder + chart-display + result-list
35. event-leaderboard — leaderboard + chart-display
36. event-checkin — form-builder + leaderboard
37. event-photo-wall — form-builder (caption) + result-list
38. event-agenda — result-list + countdown

**Org Management (6 patterns)**:
39. attendance-tracker — form-builder + leaderboard + chart-display
40. member-directory — search-input + result-list
41. committee-tracker — result-list + chart-display
42. task-board — form-builder + result-list
43. equipment-checkout — form-builder + result-list + countdown
44. budget-tracker — form-builder + chart-display + result-list

**Campus Life (6 patterns)**:
45. dining-decider — dining-picker + poll
46. study-spot-ranker — study-spot-finder + leaderboard
47. campus-event-feed — personalized-event-feed + rsvp-button
48. course-review — form-builder + leaderboard + chart-display
49. professor-rating — form-builder + chart-display + result-list
50. campus-guide — search-input + result-list

Each pattern needs realistic default configs for its elements. For example, a `poll-element` config should have `{ question: '', options: [], allowMultiple: false }`. A `form-builder` config should have `{ fields: [...] }` with fields relevant to the pattern.

**Export**: `getPatternForIntent(intent: Intent, prompt: string, spaceType?: string): CompositionPattern | null`
- Match intent first, then score patterns within that intent by keyword overlap with the prompt
- If spaceType matches a pattern's spaceTypes, boost that pattern's score
- Return best match or null

## Task 3: Wire composition patterns into create-from-intent

**File**: `apps/web/src/app/api/tools/create-from-intent/route.ts`

Update the route to use composition patterns:

1. After `findIntentMatch()`, if the intent maps to `'composition'`, call `getPatternForIntent(intent, prompt, spaceType)`
2. If a pattern is found, create a tool document with the pattern's elements and connections
3. Name the tool based on the pattern name (e.g., "Club Election", "Textbook Swap")
4. Set metadata `{ generatedFrom: 'composition-pattern', patternId: pattern.id, prompt }`
5. If no pattern found for the intent, fall through to custom block generation

## Task 4: Space-context-aware generation

**File**: `apps/web/src/lib/ai-generator/composition-patterns.ts` (add to existing)

Add a function `enrichPatternForSpace(pattern: CompositionPattern, spaceContext: { name: string; type: string; memberCount: number }): CompositionPattern` that:

1. Adjusts element configs based on space type:
   - `greek_life` spaces: Add rush-relevant defaults, Greek terminology
   - `student_org` spaces: Add club-specific fields (position, committee)
   - `campus_living` spaces: Add floor/building fields
   - `university_org` spaces: More formal language in defaults
2. Adjusts based on member count:
   - Small (<20): simpler configs, fewer options
   - Medium (20-100): standard configs
   - Large (100+): add pagination hints, chart summaries

Call this in `create-from-intent` after pattern selection, before creating the tool document.

## Task 5: Verify and enforce rate limiting

**File**: `apps/web/src/lib/ai-usage-tracker.ts`

Verify the rate limiting actually works:
1. `canGenerate(userId)` must check Firestore for daily usage count
2. `recordGeneration(userId, tokens)` must increment the counter
3. Daily limit: 50 generations per user (check this is enforced in create-from-intent)
4. If the limit is hit, return 429 with `{ error: 'Daily generation limit reached', resetAt: <next midnight UTC> }`

**File**: `apps/web/src/app/api/tools/create-from-intent/route.ts`
- Ensure `canGenerate()` is called BEFORE any generation work
- Ensure `recordGeneration()` is called AFTER successful creation (for BOTH composition and custom block paths)
- Composition patterns (no AI call) should still count toward the limit (they create tools)

## Task 6: Wire GROQ_API_KEY validation

**File**: `apps/web/src/lib/goose-server.ts`

Add a startup validation:
```typescript
function validateGroqConfig(): boolean {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    logger.warn('GROQ_API_KEY not set — custom block generation will fail');
    return false;
  }
  return true;
}
```

In the custom block generation path, if `GROQ_API_KEY` is missing, return a clear error instead of crashing:
```json
{ "error": "AI generation not configured", "code": "GROQ_NOT_CONFIGURED" }
```

## Verification

After all tasks, run:
```bash
pnpm --filter @hive/core typecheck && pnpm --filter @hive/ui typecheck && pnpm --filter @hive/web typecheck
```

Write `/tmp/codex-done-3` with `CODEX-TASK-3 COMPLETE` when finished.

## Rules
- Do NOT add new dependencies
- Do NOT modify element registry or existing element components
- Do NOT touch frontend components — backend only
- All new code must typecheck
- Use existing patterns from the codebase (logger, respond helpers, middleware)
