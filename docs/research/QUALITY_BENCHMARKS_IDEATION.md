# Quality Benchmarks & Measurement System: Ideation

Comprehensive quality and measurement framework for HiveLab. Not vanity metrics -- real signals that tell you whether students are building things that matter, whether AI is getting better, and whether the ecosystem is alive.

Grounded in: CREATION_PARADIGMS.md (10 creation platforms analyzed), MAGIC_MOMENTS.md (psychology of creation, dopamine loops, retention mechanics), and the existing codebase quality infrastructure (AIQualityPipeline, QualityGateService, CompositionValidatorService, GenerationTrackerService, FailureClassifierService, EditTrackerService, and the 13-prompt benchmark suite).

---

## 1. Tool Quality Score (TQS)

A composite score (0-100) for any tool, whether AI-generated or manually composed. The TQS answers one question: **"Is this tool good enough that a student would use it twice?"**

### Six Dimensions

| Dimension | Weight | What It Measures | Data Source |
|-----------|--------|------------------|-------------|
| Functional Integrity (FI) | 25% | Does the tool actually work? Schema valid, connections intact, no broken elements | Existing `QualityScore` from `CompositionValidatorService` |
| Design Coherence (DC) | 15% | Does it look intentional? Layout consistency, visual hierarchy, spacing rhythm | New algorithmic scoring on `ToolComposition.elements[].position/size` |
| Semantic Accuracy (SA) | 20% | Did it build what was asked? Prompt-to-output alignment | Existing `ExpectationResult` from benchmarks + new embedding similarity |
| Usage Signal (US) | 20% | Do people actually use it? Interaction rate, repeat usage, session depth | `deployedTools/{id}/events` + `deployedTools/{id}/sharedState` |
| Evolution Health (EH) | 10% | Is it being maintained? Edit frequency, improvement vs decay | Existing `GenerationEditRecord` from `EditTrackerService` + `tools/{id}/versions` |
| Adoption Breadth (AB) | 10% | Did it spread? Cross-user usage, fork/remix rate | `deployedTools` count per `toolId` + future fork tracking |

### Formula

```
TQS = (FI * 0.25) + (DC * 0.15) + (SA * 0.20) + (US * 0.20) + (EH * 0.10) + (AB * 0.10)
```

### Dimension Scoring Details

**Functional Integrity (FI) -- 0-100**

Already 80% implemented in `QualityScore` (schema, elements, config, connections dimensions from `packages/core/src/domain/hivelab/validation/types.ts`).

```
FI = (schema * 0.25) + (elements * 0.25) + (config * 0.25) + (connections * 0.25)
```

Maps to existing infrastructure:
- `schema` score: Structure correctness (valid JSON, required fields)
- `elements` score: Element ID validity (all IDs exist in `ELEMENT_IDS` registry)
- `config` score: Config schema compliance (required fields, valid values per element type)
- `connections` score: Connection graph integrity (no orphans, no cycles, valid ports)

Interpretation:
- 100: Zero `ValidationError`s, zero `ValidationWarning`s
- 85+: Minor warnings only (`MISSING_OPTIONAL_CONFIG`, `SUBOPTIMAL_LAYOUT`)
- 60-84: Fixable issues (auto-corrected by `QualityGateService.applyAutoFixes()`)
- <60: Structural problems -- rejected at gate (`GateDecision = 'rejected'`)

**Design Coherence (DC) -- 0-100**

New dimension. Algorithmic design quality measurement -- no human review needed.

```
DC = (layoutScore * 0.30) + (spacingScore * 0.25) + (hierarchyScore * 0.25) + (densityScore * 0.20)
```

How to calculate each sub-metric from `ToolComposition.elements[].position` and `.size`:

| Sub-metric | Calculation | Target |
|------------|-------------|--------|
| Layout Score | Alignment grid compliance. Count elements whose x/y positions snap to an 8px grid (`pos.x % 8 === 0 && pos.y % 8 === 0`). Score = `(snapped / total) * 100` | >80 |
| Spacing Score | Variance in gaps between adjacent elements. Low variance = consistent spacing. Score = `100 - (stddev(gaps) / mean(gaps) * 100)`, clamped 0-100. Gaps calculated from `pos.y + size.height` of element N to `pos.y` of element N+1 (vertical flow) | >75 |
| Hierarchy Score | Largest element should be the primary/title element. Score based on whether element sizes descend in logical order matching information architecture. First element gets most visual weight | >70 |
| Density Score | `fillRate = sum(element.size.width * element.size.height) / (canvasWidth * maxElementY)`. Optimal density zone is 40-70%. Score = `100 - abs(fillRate - 55) * 3`, clamped 0-100. Too sparse = wasted space. Too dense = cluttered | 40-70% fill |

The existing `QualityGateService` already enforces position bounds (0-2000 x, 0-5000 y) and size bounds (50-1000 width, 30-800 height), so elements are already constrained to a reasonable canvas.

**Semantic Accuracy (SA) -- 0-100**

Did the tool match what the user asked for? Already partially tracked by the benchmark system's `ExpectationResult` (hasExpectedElements, withinElementBounds, meetsMinQuality). Extend with:

```
SA = (elementMatch * 0.40) + (intentAlignment * 0.35) + (contextFit * 0.25)
```

| Sub-metric | Calculation | Implementation |
|------------|-------------|----------------|
| Element Match | `(expectedPresent / expectedTotal) * 80 + (withinBounds ? 20 : 0) - (unexpectedExtra * 5)`. Already available from `ExpectationResult.hasExpectedElements` and `withinElementBounds` | Extend `BenchmarkResult.expectations` |
| Intent Alignment | Embedding cosine similarity between user prompt and generated `composition.name + composition.description + element labels`. Use a lightweight embedding model (e.g., text-embedding-3-small). Score = `similarity * 100` | New: add to `AIQualityPipeline.process()` |
| Context Fit | If `spaceContext` provided: keyword overlap between space metadata (`spaceName`, `spaceType`, `category`) and tool config values. Score = `(matchedKeywords / totalKeywords) * 100`. If no context: score = 50 (neutral) | New: add to validation pipeline |

**Usage Signal (US) -- 0-100**

Only calculated after deployment. Pre-deployment tools get US=50 (neutral).

```
US = (interactionRate * 0.30) + (repeatUsage * 0.35) + (sessionDepth * 0.35)
```

| Sub-metric | Calculation | Good | Bad |
|------------|-------------|------|-----|
| Interaction Rate | `unique_interactors / space.memberCount` in first 7 days post-deploy. Data from `deployedTools/{id}/events` counting unique `userId`s | >30% | <5% |
| Repeat Usage | `users_who_returned_within_7_days / users_who_interacted_day_1`. Track via `deployedTools/{id}/events` timestamps per user | >40% | <10% |
| Session Depth | Average actions per session (votes cast on polls, forms submitted, buttons clicked). Count events in `deployedTools/{id}/events` grouped by user+session | >2.5 actions | <1.2 actions |

**Evolution Health (EH) -- 0-100**

```
EH = (editVelocity * 0.40) + (improvementDirection * 0.40) + (versionDepth * 0.20)
```

| Sub-metric | Calculation | Data Source |
|------------|-------------|-------------|
| Edit Velocity | Meaningful edits in last 30 days. 0 edits on deployed tool = stale (score 30). 1-3 = maintained (70). 4+ = actively evolved (100) | `GenerationEditRecord` from `EditTrackerService` |
| Improvement Direction | Compare `QualityScore.overall` of latest version vs first version. Increasing = good (80-100). Flat = neutral (50). Decreasing = degrading (0-30) | `tools/{toolId}/versions` subcollection |
| Version Depth | Number of saved versions. 1 = never iterated (30). 2-4 = some iteration (60). 5+ = craft investment (100) | `tools/{toolId}/versions` count |

**Adoption Breadth (AB) -- 0-100**

```
AB = (deploymentCount * 0.35) + (crossSpaceUsage * 0.35) + (forkRate * 0.30)
```

| Sub-metric | Calculation | Data Source |
|------------|-------------|-------------|
| Deployment Count | How many spaces deployed this tool. 1 = single-use (30). 2-5 = growing (60-80). 6+ = viral (100) | Count `deployedTools` docs where `toolId` matches |
| Cross-Space Usage | Different `spaceType`s using it. Same type only = niche (40). 2 types = versatile (70). 3+ = universal (100) | Join `deployedTools.spaceId` -> `spaces.spaceType` |
| Fork Rate | `(forks + remixes) / total_views * 100`. >5% = inspiring (80+). 1-5% = useful reference (50). <1% = not fork-worthy (20) | Future fork tracking |

### Interpretation

| TQS Range | Label | Action |
|-----------|-------|--------|
| 90-100 | Exceptional | Feature in tool gallery, use as AI training example, highlight creator |
| 75-89 | Good | Recommend to similar spaces, eligible for "Staff Pick" |
| 60-74 | Acceptable | Functional but has room for improvement. No action needed |
| 40-59 | Below Average | Surface improvement suggestions to creator. Don't recommend |
| 0-39 | Failing | Flag for review. Offer creator help or suggest archiving |

**Launch target:** Average TQS across all deployed tools >= 65. No deployed tool below 40. 50%+ of deployed tools rated "Good" or better.

### TQS by Tool Type

Different tool types have different "healthy" TQS profiles:

| Tool Type | Expected Strength | Expected Weakness | Adjusted Min TQS |
|-----------|-------------------|-------------------|-------------------|
| Single poll | High SA, high FI | Low EH (one-time use), low AB | 55 (polls are disposable) |
| Event RSVP | High US, seasonal | Spiky retention | 60 |
| Form builder | High FI, moderate US | Low DC (forms are utilitarian) | 65 |
| Dashboard (multi-element) | High DC, high AB | Complex = higher FI risk | 60 |
| Dues/budget tracker | High US, high retention | Low AB (org-specific) | 70 (operational tools must be reliable) |
| Election system | Very high FI requirement | Very low EH (once/year) | 75 (trust is critical for voting) |

---

## 2. AI Generation Benchmarks

### Expanding the Test Suite: 50 Standard Prompts

The existing benchmark suite (in `packages/core/src/application/hivelab/benchmarks/benchmark-prompts.ts`) has 13 prompts across 5 categories. Expand to 50.

**Current distribution (13 prompts):**
- Basic: 4 (basic-poll, basic-countdown, basic-form, basic-search)
- Complex: 4 (complex-event-registration, complex-poll-results, complex-member-search, complex-leaderboard)
- Edge Case: 3 (edge-vague, edge-long, edge-minimal)
- Space Context: 2 (context-hackathon, context-study-group)
- Iteration: 2 (iteration-add-chart, iteration-add-countdown)

**Target distribution (50 prompts):**

| Category | Current | Add | Total | Purpose |
|----------|---------|-----|-------|---------|
| Basic (single element) | 4 | 6 | 10 | Baseline reliability -- these MUST always pass |
| Complex (multi-element) | 4 | 8 | 12 | Composition quality -- the real test of AI value |
| Edge Case (vague/adversarial) | 3 | 5 | 8 | Robustness under pressure |
| Space Context | 2 | 8 | 10 | Context-awareness per space type |
| Iteration | 2 | 3 | 5 | Modification capability |
| Real-World Scenarios | 0 | 5 | 5 | End-to-end student workflows (new category) |

**New prompts to add (37 total):**

Basic -- add 6 (all should score minQualityScore: 85):
```typescript
{ id: 'basic-rsvp', prompt: 'Add an RSVP button for our meeting next Thursday',
  expectedElements: ['rsvp-button'], minElementCount: 1, maxElementCount: 2 }
{ id: 'basic-leaderboard', prompt: 'Show a leaderboard of our most active members',
  expectedElements: ['leaderboard'], minElementCount: 1, maxElementCount: 2 }
{ id: 'basic-counter', prompt: 'Track how many community service hours we have completed',
  expectedElements: ['counter'], minElementCount: 1, maxElementCount: 2 }
{ id: 'basic-announcements', prompt: 'Create an announcements board for our club',
  expectedElements: ['text-display'], minElementCount: 1, maxElementCount: 2 }
{ id: 'basic-checklist', prompt: 'Create a checklist for event setup tasks',
  expectedElements: ['checklist'], minElementCount: 1, maxElementCount: 2 }
{ id: 'basic-media', prompt: 'Create a photo gallery for our recent events',
  expectedElements: ['media-gallery'], minElementCount: 1, maxElementCount: 2 }
```

Complex -- add 8 (minQualityScore: 65-75, expectedConnections: true):
```typescript
{ id: 'complex-rush-dashboard', prompt: 'Build a rush week dashboard with event schedule, applicant tracking, and voting',
  expectedElements: ['countdown-timer', 'form-builder', 'poll-element'], minElementCount: 3, maxElementCount: 6 }
{ id: 'complex-study-session', prompt: 'Create a study session tool with topic poll, timer, and attendance',
  expectedElements: ['poll-element', 'countdown-timer'], minElementCount: 2, maxElementCount: 5 }
{ id: 'complex-fundraiser', prompt: 'Build a fundraiser tracker with goal progress, donation form, and donor leaderboard',
  expectedElements: ['counter', 'form-builder', 'leaderboard'], minElementCount: 3, maxElementCount: 5 }
{ id: 'complex-election', prompt: 'Create a club election with candidate profiles, voting, and live results',
  expectedElements: ['poll-element', 'chart-display'], minElementCount: 2, maxElementCount: 5 }
{ id: 'complex-ra-toolkit', prompt: 'Build a floor check-in tool with room roster, incident logging, and event calendar',
  expectedElements: ['form-builder', 'result-list'], minElementCount: 2, maxElementCount: 5 }
{ id: 'complex-org-dashboard', prompt: 'Create a club dashboard with member count, upcoming events, announcements, and quick polls',
  expectedElements: ['counter', 'countdown-timer', 'poll-element'], minElementCount: 3, maxElementCount: 6 }
{ id: 'complex-mentorship', prompt: 'Build a mentorship matching tool with profiles, preferences, and schedule coordination',
  expectedElements: ['form-builder', 'poll-element'], minElementCount: 2, maxElementCount: 5 }
{ id: 'complex-newsletter', prompt: 'Create a newsletter builder with content blocks, preview, and distribution tracking',
  expectedElements: ['text-display', 'form-builder'], minElementCount: 2, maxElementCount: 4 }
```

Edge Case -- add 5 (minQualityScore: 50-60):
```typescript
{ id: 'edge-emoji-only', prompt: 'party popper vote fire rocket',
  expectedElements: [], minElementCount: 1, maxElementCount: 4, minQualityScore: 50 }
{ id: 'edge-contradictory', prompt: 'Make a private public poll that is anonymous but tracks who voted',
  expectedElements: ['poll-element'], minElementCount: 1, maxElementCount: 3, minQualityScore: 55 }
{ id: 'edge-off-platform', prompt: 'Build me an Instagram clone with stories and reels',
  expectedElements: [], minElementCount: 1, maxElementCount: 4, minQualityScore: 50 }
{ id: 'edge-xss-attempt', prompt: 'Create a poll with options: <script>alert("xss")</script> and normal option',
  expectedElements: ['poll-element'], minElementCount: 1, maxElementCount: 2, minQualityScore: 70 }
{ id: 'edge-maximal', prompt: 'I need a tool that does everything: polls, forms, events, chat, payments, scheduling, file sharing, video calls, and a social feed',
  expectedElements: [], minElementCount: 2, maxElementCount: 8, minQualityScore: 50 }
```

Space Context -- add 8 (minQualityScore: 70-80):
```typescript
{ id: 'context-greek-rush', spaceContext: { spaceName: 'Alpha Phi', spaceType: 'greek_life', category: 'greek_life' },
  prompt: 'Create a rush event tracker', expectedElements: ['countdown-timer', 'rsvp-button'], minElementCount: 1, maxElementCount: 4 }
{ id: 'context-res-floor', spaceContext: { spaceName: 'Ellicott 3rd Floor', spaceType: 'campus_living', category: 'campus_living' },
  prompt: 'Create a floor hangout organizer', expectedElements: ['poll-element', 'countdown-timer'], minElementCount: 1, maxElementCount: 3 }
{ id: 'context-uni-org', spaceContext: { spaceName: 'Career Center', spaceType: 'university_organizations', category: 'professional' },
  prompt: 'Create a student feedback collection tool', expectedElements: ['form-builder'], minElementCount: 1, maxElementCount: 3 }
{ id: 'context-club-exec', spaceContext: { spaceName: 'Engineering Club', spaceType: 'student_organizations', category: 'academic' },
  prompt: 'Create a meeting agenda tool', expectedElements: ['checklist', 'countdown-timer'], minElementCount: 1, maxElementCount: 3 }
{ id: 'context-sports', spaceContext: { spaceName: 'Club Soccer', spaceType: 'student_organizations', category: 'sports' },
  prompt: 'Create a game day countdown and roster', expectedElements: ['countdown-timer'], minElementCount: 1, maxElementCount: 3 }
{ id: 'context-cultural', spaceContext: { spaceName: 'Korean Student Association', spaceType: 'student_organizations', category: 'cultural' },
  prompt: 'Create an event series tracker for culture night preparation', expectedElements: ['countdown-timer', 'counter'], minElementCount: 1, maxElementCount: 4 }
{ id: 'context-academic', spaceContext: { spaceName: 'Pre-Med Society', spaceType: 'student_organizations', category: 'academic' },
  prompt: 'Create a study resource library with search', expectedElements: ['search-input', 'result-list'], minElementCount: 2, maxElementCount: 4 }
{ id: 'context-service', spaceContext: { spaceName: 'Habitat for Humanity', spaceType: 'student_organizations', category: 'service' },
  prompt: 'Track volunteer hours and impact for this semester', expectedElements: ['counter', 'form-builder'], minElementCount: 1, maxElementCount: 4 }
```

Iteration -- add 3 (minQualityScore: 65-70):
```typescript
{ id: 'iteration-add-form', prompt: 'Add a signup form so people can register',
  existingComposition: { elements: [{ elementId: 'countdown-timer', instanceId: 'timer_001', config: { targetDate: '...' } }] },
  expectedElements: ['countdown-timer', 'form-builder'], minElementCount: 2, maxElementCount: 4, expectedConnections: true }
{ id: 'iteration-restyle', prompt: 'Make this look more professional and clean',
  existingComposition: { elements: [{ elementId: 'poll-element', instanceId: 'poll_001', config: { question: 'Fav color?', options: ['Red', 'Blue'] } }] },
  expectedElements: ['poll-element'], minElementCount: 1, maxElementCount: 2 }
{ id: 'iteration-add-leaderboard', prompt: 'Add a leaderboard showing who has the most participation points',
  existingComposition: { elements: [{ elementId: 'counter', instanceId: 'counter_001', config: { label: 'Points' } }] },
  expectedElements: ['counter', 'leaderboard'], minElementCount: 2, maxElementCount: 4, expectedConnections: true }
```

Real-World Scenarios -- 5 new (new `BenchmarkCategory: 'real_world'`, minQualityScore: 55-65):
```typescript
{ id: 'scenario-first-meeting', category: 'real_world',
  prompt: 'It is the first week of school and I just became president of my club. I need something to get people excited about joining',
  expectedElements: [], minElementCount: 1, maxElementCount: 6, minQualityScore: 55 }
{ id: 'scenario-event-planning', category: 'real_world',
  prompt: 'We have a formal coming up in 3 weeks and we need to coordinate catering vote, ticket sales, and outfit coordination',
  expectedElements: ['poll-element', 'form-builder'], minElementCount: 2, maxElementCount: 6, minQualityScore: 60 }
{ id: 'scenario-semester-end', category: 'real_world',
  prompt: 'The semester is ending and we need to collect officer transition documents, do end-of-year awards voting, and plan our last event',
  expectedElements: ['form-builder', 'poll-element', 'countdown-timer'], minElementCount: 2, maxElementCount: 6, minQualityScore: 55 }
{ id: 'scenario-recruitment', category: 'real_world',
  prompt: 'We are trying to recruit new members and need something to showcase what we do and collect interest forms',
  expectedElements: ['form-builder'], minElementCount: 1, maxElementCount: 5, minQualityScore: 60 }
{ id: 'scenario-budget', category: 'real_world',
  prompt: 'We just got our funding allocation and need to track spending across 4 committees',
  expectedElements: ['counter'], minElementCount: 1, maxElementCount: 5, minQualityScore: 55 }
```

### Semantic Accuracy Scoring

The core question: **"Did the AI build what was asked?"**

Three-layer evaluation:

**Layer 1: Element Expectation Check** (already implemented in `ExpectationResult`)
- Does the output contain expected element types?
- Is element count within `[minElementCount, maxElementCount]` bounds?
- Does quality score meet `minQualityScore` threshold?

**Layer 2: Config Relevance Check** (new)
- Extract keywords from prompt using TF-IDF or simple noun/verb extraction
- Check if config values (poll questions, form labels, countdown titles, etc.) contain semantically related terms
- Example: prompt "vote on meeting day" should produce poll with day-related options, not generic "Option 1, Option 2"
- Score: `(config_values_with_related_terms / total_config_values) * 100`
- Detection: compare against `getConfigDefaults()` in QualityGateService -- if config matches defaults exactly, score drops (means AI used fallbacks, not intent)

**Layer 3: Structural Appropriateness Check** (new)
- Single-concern prompts ("make a poll") should produce 1-2 elements. Penalize bloat
- Multi-concern prompts ("dashboard with X, Y, Z") should produce proportional elements
- Score: `100 - (abs(expected_concerns - actual_elements) / max(expected_concerns, 1) * 50)`
- Connected elements should have logical data flow (poll -> chart, form -> result-list)

**Layer 4: Safety Check** (new, binary pass/fail)
- XSS attempts in config values stripped (test with `edge-xss-attempt` benchmark)
- No executable content in generated configs
- Off-platform requests gracefully redirected to available capabilities
- Fail = immediate `GateDecision: 'rejected'` regardless of other scores

### A/B Testing Framework

Extend the existing `AIGenerationRecord` tracking to support variants:

```typescript
interface AIExperiment {
  id: string;                        // 'exp-enhanced-system-prompt'
  name: string;                      // Human-readable
  status: 'draft' | 'running' | 'complete' | 'cancelled';

  // What changed
  variants: Array<{
    id: string;                      // 'control' | 'variant-a' | 'variant-b'
    description: string;             // What's different
    promptVersion: string;           // Maps to AIGenerationRecord.promptVersion
    trafficPercentage: number;       // 0-100, all variants sum to 100
    config?: {                       // Variant-specific config
      systemPromptOverride?: string;
      temperature?: number;
      fewShotExamples?: number;
      spaceContextDepth?: 'name_only' | 'full_metadata' | 'with_member_context';
    };
  }>;

  // Evaluation
  primaryMetric: 'avgQualityScore' | 'acceptanceRate' | 'deploymentRate' | 'editRate';
  guardRails: {
    maxRejectionRateIncrease: number;  // e.g., 0.05 (5%)
    maxLatencyIncrease: number;        // e.g., 2000 (ms)
    minSampleSize: number;             // e.g., 100 per variant
  };
  significanceThreshold: number;       // e.g., 0.05

  // Traffic routing
  // Hash(userId + experimentId) % 100 < trafficPercentage
  // Same user always gets same variant within experiment

  // Lifecycle
  startedAt: Date;
  endedAt?: Date;
  conclusion?: string;
}
```

**What to A/B test first (priority order):**
1. System prompt verbosity: minimal element docs vs. full element schemas with examples
2. Few-shot examples: 0 vs. 3 vs. 5 example compositions in system prompt
3. Temperature: 0.3 (conservative) vs. 0.5 (balanced) vs. 0.7 (creative)
4. Space-context depth: space name only vs. full metadata (type, category, memberCount) vs. metadata + recent activity

**Evaluation flow:**
1. Run experiment for minimum 100 generations per variant (or 2 weeks, whichever comes first)
2. Compare primary metric with two-sample t-test
3. Check guard rails: if rejection rate increased >5% or P95 latency increased >2s, auto-stop
4. Winner must beat control on primary metric at p < 0.05
5. If winner found: promote to production by updating `CURRENT_PROMPT_VERSION` in `ai-quality-pipeline.ts`

### Generation Quality by Space Type

Track quality scores segmented by `spaceContext.spaceType` from `AIGenerationRecord`:

**Expected patterns (hypotheses to validate with data):**

| Space Type | Expected AI Strength | Expected AI Weakness |
|------------|---------------------|---------------------|
| `student_organizations` | Polls, event tools, signup forms | Complex governance, budget trackers |
| `greek_life` | Rush dashboards, voting tools | Chapter management, compliance |
| `campus_living` | Floor polls, social event tools | RA administrative tools |
| `university_organizations` | Feedback forms, surveys | Data-heavy dashboards |

**Queries to run weekly:**
```
GROUP BY spaceContext.spaceType:
  AVG(validation.score.overall)
  COUNT(*) WHERE gateDecision = 'accepted' / COUNT(*)  -- acceptance rate
  COUNT(*) WHERE outcome.type = 'deployed' / COUNT(*) WHERE gateDecision != 'rejected'  -- deployment rate
  AVG(editCount) WHERE outcome.type = 'edited'  -- edit intensity
```

**Quality gap alert:** If any space type's average quality score is >15 points below the overall average for 2+ consecutive weeks, flag for prompt engineering attention.

**Target:** All space types within 15 points of overall average by month 3.

---

## 3. Creator Health Metrics

### Progression Velocity

Track how fast creators level up. The learning curve should feel like Minecraft (always one more block to place, from CREATION_PARADIGMS.md), not Roblox Studio (cliff after the tutorial).

**Creator Levels:**

| Level | Name | Criteria | Expected Time | Data Source |
|-------|------|----------|---------------|-------------|
| 0 | Viewer | Joined a space, viewed tools | Day 0 | `activityEvents` with type 'tool_view' |
| 1 | Prompter | First AI generation (any quality) | Day 0-1 | `ai_generations` first record per userId |
| 2 | Deployer | First tool deployed to a space | Day 0-3 | `deployedTools` first record per userId |
| 3 | Editor | First manual edit after AI generation | Day 1-7 | `GenerationEditRecord` first record |
| 4 | Iterator | Created 3+ versions of a tool | Week 1-2 | `tools/{id}/versions` count >= 3 |
| 5 | Composer | Built a multi-element tool with connections | Week 1-3 | Any tool with `connectionCount > 0` |
| 6 | Crafter | Tool achieved TQS >= 75 | Week 2-4 | Computed TQS check |
| 7 | Sharer | Tool used by 5+ unique other users | Week 2-6 | `deployedTools/{id}/events` unique userIds >= 5 |
| 8 | Builder | 3+ deployed tools, avg TQS >= 70 | Month 1-2 | Cross-reference deployedTools + TQS |
| 9 | Architect | Tool forked/remixed by others | Month 1-3 | Future fork tracking |
| 10 | Creator | 10+ deployed tools, community recognition | Month 2+ | Profile badge: `builder` |

**Velocity metric:** `median_days_to_level[n]` -- tracked per signup cohort (by week)

**Critical velocity targets (grounded in MAGIC_MOMENTS.md research):**
- Level 0 -> 1: < 10 minutes. Research is unambiguous: Claude Artifacts achieves time-to-magic in ~30 seconds. Canva in 3-5 minutes. HiveLab must achieve first generation in under 5 minutes. 10 minutes is the absolute ceiling before users disengage
- Level 1 -> 2: < 24 hours. If a user generates a tool but doesn't deploy it within a day, the tool probably wasn't good enough
- Level 2 -> 3: < 7 days. Editing is the IKEA Effect (Norton, Mochon, Ariely) -- users who invest effort value the output more. If they never edit, they either got a perfect tool (unlikely early on) or the editing UX is broken
- Level 3 -> 5: < 14 days. Composition (connecting elements) is the ceiling test from CREATION_PARADIGMS.md. If users plateau at single-element tools, the composition model is too hard

**Warning signals:**
- Cohort stuck at Level 1 (generated but never deployed) = AI output not good enough or deployment UX has too much friction
- Cohort stuck at Level 2 (deployed but never edited) = editing UX broken OR tools feel "untouchable" (users afraid to break AI output)
- Velocity slowing across successive cohorts = product is getting worse, not better
- Level 5 (Composer) reached by <10% of Level 2 users = composition model is too complex

### Creation Frequency and Complexity Growth

```
Creator Activity Score = (
  generations_this_week * 1.0 +
  deployments_this_week * 3.0 +
  edits_this_week * 1.5 +
  tools_with_connections_created * 2.0
) / weeks_since_first_generation
```

Track weekly per user. Plot distribution.

**Healthy patterns:**
- Activity Score > 2.0 = healthy engagement
- Activity Score trending up over first 4 weeks = growth trajectory
- Activity Score flatlining at < 1.0 = stalled creator

**Complexity ladder (weekly cohort averages):**

| Week | Expected Avg Elements/Tool | Expected % with Connections | Expected Layout Diversity |
|------|---------------------------|---------------------------|--------------------------|
| 1 | 1.0 - 2.0 | 0-10% | Mostly 'flow' layout |
| 2 | 1.5 - 2.5 | 10-25% | 'flow' + 'grid' appearing |
| 3 | 2.0 - 3.5 | 20-40% | All layouts represented |
| 4+ | 2.5 - 4.0 | 30-50% | Layout choice matches tool purpose |

Data source: `AIGenerationRecord.elementCount`, `AIGenerationRecord.connectionCount`, `AIGenerationRecord.layout`

### Abandonment Signals

**Definition:** Abandonment = user started a creation flow but didn't deploy within 48 hours.

Already partially tracked in `GenerationOutcome`:
- `{ type: 'abandoned'; abandonedAfterMs: number }` -- captures explicit abandonment
- `{ type: 'rejected'; reason?: string }` -- captures AI rejection leading to abandonment

**Abandonment taxonomy (extend tracking):**

| Signal | Detection | Likely Cause | Intervention |
|--------|-----------|-------------|--------------|
| Prompt-and-Leave | Generation completed, user left within 10 seconds (`timeToFirstAction < 10000` + outcome = 'abandoned') | AI output didn't match expectations. Visual first impression failed | Improve first-impression quality. Better default design coherence |
| Edit-and-Abandon | `GenerationEditRecord` exists but `finalOutcome = 'discarded'` and `totalEditTimeMs > 300000` (5+ min) | Editing UX frustrating or tool can't be shaped to intent | Reduce edit friction, add undo, add auto-save |
| Regeneration Spiral | 3+ generations in same session (`sessionId`) without deployment | AI can't satisfy the request | Detect spiral at generation 3, offer template suggestions or "try a simpler prompt" guidance |
| Slow-Fade | User deployed 1 tool, no `ai_generations` records for 30+ days | No clear next step after first creation | "What to build next" prompts, showcase other creators' tools |
| Quality Frustration | Multiple tools created across sessions, none reach TQS 60 | Skill ceiling hit without support | Suggest templates, surface builder community, pair with experienced creator |

**Weekly tracking targets:**
- Overall abandonment rate (started sessions without deployment): < 40%
- Prompt-and-Leave rate: < 25%
- Regeneration spiral rate: < 15% of sessions
- Slow-Fade rate (30-day inactivity after first deployment): < 50%

### Creator NPS

**Methodology:** In-product micro-survey, triggered at specific moments (from MAGIC_MOMENTS.md: validation must come at the right time):

1. After first tool deployment -- measure initial delight ("The It Works Moment")
2. After 5th deployment -- measure sustained satisfaction ("The I Can Improve It Moment")
3. 30 days after last creation if inactive -- measure if they miss it

**Question:** "How likely are you to recommend HiveLab to a friend in another org?" (0-10)

**Follow-up (one question max, selected by segment):**
- Promoters (9-10): "What made you love it?" (open text, <100 chars)
- Passives (7-8): "What would make it a 10?" (open text, <100 chars)
- Detractors (0-6): "What frustrated you most?" (open text, <100 chars)

**Targets:**
- Launch: NPS >= +20
- Month 1: NPS >= +30
- Month 3: NPS >= +50

**Segmentation to track:**
- NPS by creator level (do power users love it more or less?)
- NPS by space type (which org types get most value?)
- NPS by AI-only vs. manual editors (does the editing step improve satisfaction?)
- NPS by complexity level (do multi-element tool creators have different satisfaction?)

---

## 4. Platform Vitality Index (PVI)

A single number (0-100) that answers: **"Is the HiveLab ecosystem alive?"**

### Formula

```
PVI = (creationVelocity * 0.25) +
      (adoptionMomentum * 0.25) +
      (ecosystemDensity * 0.20) +
      (retentionPulse * 0.20) +
      (qualityFloor * 0.10)
```

### Sub-metrics

**Creation Velocity (CV) -- 0-100**

```
CV = min(100, (tools_created_this_week / target_weekly_creation) * 100)
```

Targets by phase:
| Phase | Weekly Target | Rationale |
|-------|--------------|-----------|
| Week 1 (launch) | 20 tools | ~20% of early adopters try HiveLab |
| Month 1 | 50 tools/week | Growing organically via word of mouth |
| Month 3 | 100 tools/week | Steady state for a single campus |
| Semester 2 | 200 tools/week | Cross-campus expansion |

Data source: `COUNT(tools) WHERE createdAt > 7_days_ago AND campusId = X`

**Adoption Momentum (AM) -- 0-100**

```
AM = (new_creators_this_week / max(new_creators_last_week, 1)) * 25 +
     (new_deployments_this_week / max(new_deployments_last_week, 1)) * 25 +
     (new_spaces_with_first_tool / max(new_spaces_with_first_tool_last_week, 1)) * 25 +
     (returning_creators_this_week / max(total_creators_ever, 1)) * 25
```

Score interpretation: >50 = growing. <50 = shrinking. = 50 = flat.

**Ecosystem Density (ED) -- 0-100**

```
ED = (spaces_with_2plus_tools / total_active_spaces) * 100
```

This is the "empty shelf" metric. From MAGIC_MOMENTS.md: "If sharing requires extra steps or the output looks amateur, this moment dies." Similarly, if students open a space and see zero tools, HiveLab feels like a ghost feature.

**Thresholds:**

| Density | Feel | Status |
|---------|------|--------|
| <10% of spaces have 2+ tools | Ghost town | Red alert. HiveLab isn't a feature yet |
| 10-25% | Sparse | Yellow. Early adopters only |
| 25-40% | Growing | Green. Momentum building |
| 40-60% | Alive | Strong. New users organically discover tools |
| >60% | Thriving | HiveLab is a core platform feature |

**The "Empty Shelf" Threshold:** A space needs at least 2 deployed tools to feel like HiveLab is a real capability. A campus needs at least 30% of active spaces with 2+ tools before new users will organically discover and adopt HiveLab.

Data source: `COUNT(DISTINCT spaceId) FROM deployedTools GROUP BY spaceId HAVING COUNT(*) >= 2` / `COUNT(spaces) WHERE isActive = true AND campusId = X`

**Retention Pulse (RP) -- 0-100**

```
RP = (weekly_active_tool_users / total_tool_users_ever) * 100
```

Where "active tool user" = interacted with any deployed tool in last 7 days (from `deployedTools/{id}/events` with `timestamp > 7_days_ago`).

**Quality Floor (QF) -- 0-100**

```
QF = (deployed_tools_with_TQS_above_60 / total_deployed_tools) * 100
```

If >30% of deployed tools have TQS <60, the quality floor is broken. Users will associate HiveLab with low-quality output. From CREATION_PARADIGMS.md: "Conversational creation (v0/Artifacts) is the fastest path to 'I made something' but the weakest path to 'I made something good.' The ceiling is low and the quality floor is unpredictable." We must prevent this.

### Seasonal Patterns

College campuses have predictable rhythms. Track PVI against expected patterns:

```
August/September:  SPIKE  -- Welcome week, rush, orientation. Peak tool creation window.
October:           STEADY -- Settled routine. Maintenance mode. Slight dip from midterms.
November:          DIP    -- Midterms, pre-finals stress. Creation drops 20-30%.
December:          CLIFF  -- Finals + break. Near-zero activity for 3-4 weeks.
January:           SPIKE  -- New semester energy. Second-biggest creation window.
February:          STEADY -- Routine established. Stable baseline.
March:             DIP    -- Spring break (1 week near-zero) + midterms.
April:             SURGE  -- End-of-year events, elections, transitions. Third-biggest window.
May:               CLIFF  -- Finals + summer. Activity drops to maintenance-only.
```

**What to measure:**
- Week-over-week PVI trend: following expected seasonal pattern or diverging?
- Semester-start retention: What % of last semester's creators return in the first 2 weeks?
- Year-over-year PVI comparison (once we have data)

**Semester-start retention target:** >50% of previous semester's Level 2+ creators return within first 2 weeks. If <30%, something fundamental is broken about tool persistence, value, or discoverability.

### Fork/Remix Rate

```
Fork Rate = tools_forked_this_period / total_published_tools
Remix Rate = tools_modified_after_fork / tools_forked
Cross-Space Fork Rate = forks_to_different_space_type / total_forks
```

From CREATION_PARADIGMS.md: "Publishing/sharing is a crucial satisfaction multiplier... the moment other people see your creation amplifies the dopamine hit by 10x." Forks are the deepest form of social validation -- someone thought your tool was good enough to build on.

**Targets:**
- Fork rate > 5% of published tools per month = healthy ecosystem
- Remix rate > 60% of forks = people don't just copy, they improve (creation culture, not consumption culture)
- Cross-space fork rate > 20% of total forks = ideas spreading between org types (network effects)

---

## 5. Space-Type Specific Benchmarks

### Student Organization Health Score (OHS)

**What "healthy" looks like for a student org on HiveLab:**

| Metric | Target | How to Measure | Weight |
|--------|--------|----------------|--------|
| Tools deployed | >= 3 | Count `spaces/{id}/placed_tools` | 15 |
| Member tool interaction rate | >= 40% of members used a tool in last 14 days | Unique interactors / `space.memberCount` | 25 |
| Active tool variety | >= 2 different element types | Count distinct `elementId`s across deployed tools | 15 |
| Tool freshness | >= 1 tool updated in last 30 days | Check `tools/{id}.updatedAt` | 15 |
| Leader-created tools | >= 1 tool created by admin/owner | Cross-reference `tool.ownerId` with `spaceMembers` role='owner'|'admin' | 15 |
| Engagement depth | Avg 3+ interactions per active user per week | `deployedTools/{id}/events` count / unique users / weeks | 15 |

```
OHS = sum(target_met[i] * weight[i])  // Each factor binary: met = 1, not met = 0
```

**Target:** 60% of active student orgs achieve OHS >= 60 within first semester.

### Greek Chapter Operational Completeness (OCS)

Greek chapters have 5 core operational domains. HiveLab should cover each:

| Operation | What "Covered" Means | Detection |
|-----------|---------------------|-----------|
| Rush/Recruitment | Has event tool + form/signup + voting tool active during rush season | 3+ tools with rush-related keywords in config during Sept/Jan |
| Chapter Meetings | Has agenda/checklist + attendance tracking + voting | 2+ tools used on recurring weekly cadence |
| Social Events | Has RSVP + countdown + any social tool | 2+ tools active during event windows |
| Philanthropy | Has hours tracker/counter + sign-up form | 1+ tool with service/volunteer keywords |
| Internal Communication | Has announcements + polls | 2+ tools with broad member interaction |

```
OCS = (operations_covered / 5) * 100
```

**Target:** Active Greek chapters achieve OCS >= 60 (3+ operations covered) within first semester.

### Residential Floor Engagement Score (FES)

Floors are low-commitment, high-frequency. Different patterns than orgs.

| Metric | Target | Weight | Rationale |
|--------|--------|--------|-----------|
| Tools per floor | >= 2 | 20 | Enough to feel useful without overwhelming |
| Resident participation | >= 25% interacted this month | 25 | Lower bar -- floor membership is passive |
| Poll completion rate | >= 50% voted on most recent poll | 20 | Polls are natural first tool for floors |
| RA tool adoption | RA created >= 1 tool | 15 | RA adoption is gateway to floor adoption |
| Social event tool | >= 1 event tool used this month | 20 | Floors exist for social connection |

```
FES = sum(target_met[i] * weight[i])
```

**Target:** 40% of active residential floors achieve FES >= 60. Lower bar because floor engagement is inherently more casual than org engagement.

### University Organization Student Reach Score (SRS)

University orgs measure success by reach, not depth.

| Metric | Target | Weight | Rationale |
|--------|--------|--------|-----------|
| Tool visibility | >= 1 tool with >100 unique viewers | 25 | Uni orgs serve the whole campus |
| Form submission rate | >= 5% of viewers submit forms | 20 | Conversion matters for institutional tools |
| Event RSVP rate | >= 10% of viewers RSVP | 20 | Events are core to uni org value |
| Tool findability | Tool appears in campus-wide search | 15 | Must be discoverable outside the space |
| Repeat visits | >= 30% return within 14 days | 20 | Not just a one-time survey |

```
SRS = sum(target_met[i] * weight[i])
```

**Target:** 50% of active university orgs achieve SRS >= 60.

---

## 6. Launch Quality Gates

Binary pass/fail checks. Every gate must pass before HiveLab goes live to students.

### Technical Gates

| # | Gate | Pass Criteria | How to Test |
|---|------|--------------|-------------|
| T1 | AI generation reliability | >= 95% of basic benchmark prompts pass (9.5/10 basic prompts) | Run benchmark suite with `categories: ['basic']` |
| T2 | Quality gate functions | Rejection rate for known-bad inputs >= 90% | Run edge case benchmarks, verify `gateDecision = 'rejected'` for invalid inputs |
| T3 | Auto-fix works | Partial acceptance rate > 0 (proves `applyAutoFixes()` is functioning) | Run complex benchmarks, verify at least some return `gateDecision = 'partial_accept'` |
| T4 | Latency acceptable | P95 generation latency < 8 seconds | Run full 50-prompt benchmark suite, check `BenchmarkResult.durationMs` percentiles |
| T5 | Campus isolation | Tools can only access data within their space's campusId | Attempt cross-campus tool state read via API with mismatched campusId |
| T6 | Rate limiting | Users get clear error after exceeding generation limit, not a crash | Hit rate limit endpoint, verify `respond.error()` with appropriate code |
| T7 | State persistence | Deployed tool state survives page refresh | Deploy tool, interact (cast vote, submit form), refresh, verify state persists in `deployedTools/{id}/sharedState` |
| T8 | Concurrent safety | Two users interacting with same tool don't corrupt state | Simulate 10 concurrent poll votes, verify final count = 10 |

### Experience Gates

| # | Gate | Pass Criteria | How to Test |
|---|------|--------------|-------------|
| E1 | Time-to-magic < 5 min | New user goes from opening HiveLab to seeing a deployed tool in < 5 minutes | Stopwatch test with 5 naive users who have never seen HiveLab |
| E2 | Empty state guidance | Zero-tool space shows clear CTA and example prompts, not "Nothing here" | Visit empty `spaces/{id}/placed_tools`, verify non-empty UI |
| E3 | Error recovery | Failed generation shows helpful message + retry option | Force AI error (mock mode), verify user sees recovery UX, not blank screen |
| E4 | Mobile responsive | Tool creation flow works on 375px viewport | Test full prompt->generate->deploy flow on iPhone SE viewport |
| E5 | Loading states | All async operations show skeleton/spinner, no layout shift > 0.1 CLS | Throttle network to 3G, verify no content jumps |
| E6 | Keyboard accessible | Full creation flow completable without mouse | Tab through prompt input -> generate -> review -> deploy |
| E7 | Deployed tool UX | Deployed tools render correctly for non-creator space members | View deployed tool as member with role='member' (not owner/admin) |

### Content Gates

| # | Gate | Pass Criteria | How to Test |
|---|------|--------------|-------------|
| C1 | Seed templates | >= 5 template tools per space type in `system-tool-templates.ts` | Count templates grouped by applicable spaceType |
| C2 | Template quality | All seed templates have TQS >= 75 | Run TQS calculation on all system templates |
| C3 | Prompt suggestions | >= 10 prompt suggestions per space type | Verify prompt suggestion data in `quick-templates.ts` |
| C4 | No placeholder text | Zero "Lorem ipsum", "TODO", "Example", "Option 1" in production templates | String search across `system-tool-templates.ts` and `quick-templates.ts` |

### The Smoke Test: 10 Prompts That Must Produce Good Tools

These 10 prompts represent the most common things students will ask HiveLab to build. Each must produce a tool with at least the specified minimum TQS. Run each prompt 3 times (30 total generations). **All 30 must pass their minimum TQS.**

| # | Prompt | Expected Outcome | Min TQS |
|---|--------|-----------------|---------|
| S1 | "Create a poll for what day to have our meeting" | Single poll, day-related options (not "Option 1") | 75 |
| S2 | "Build a signup form for our event next Friday" | Form with name/email fields, possibly countdown | 70 |
| S3 | "Track attendance for our weekly meetings" | Counter or checklist element | 65 |
| S4 | "Vote on our new club logo" | Poll with image-appropriate options | 70 |
| S5 | "Create a countdown to our spring formal" | Single countdown with clear target date | 80 |
| S6 | "Build a leaderboard for our points system" | Leaderboard with member names and point values | 65 |
| S7 | "Make a feedback form for our last event" | Form with rating + comments fields | 70 |
| S8 | "Create an event RSVP tracker" | RSVP button + counter or attendee list | 65 |
| S9 | "Build a dashboard for our club" | Multi-element: announcements + upcoming events + poll | 60 |
| S10 | "Help me organize rush week" | Multi-element: event schedule + signup + voting | 60 |

**Pass criteria:**
- 30/30 individual generations achieve their minimum TQS
- 0/30 produce broken/error-state outputs (no `GateDecision: 'rejected'`)
- Average TQS across all 30 >= 68
- S1 through S5 (single-element prompts) average TQS >= 72
- S9 and S10 (multi-element prompts) produce `connectionCount > 0` in at least 2/3 runs

---

## 7. Anti-Metrics

### Vanity Metrics That Look Good But Mean Nothing

| Metric | Why It Looks Good | Why It's Meaningless |
|--------|------------------|---------------------|
| Total tools created | "We have 500 tools!" | 400 were AI-generated, viewed once, never deployed. `tool.status = 'draft'` forever |
| Total AI generations | "10,000 generations this month!" | Counts regeneration spirals as success. High count might mean the AI is bad, not popular |
| Average session time in builder | "Users spend 20 minutes in HiveLab!" | They're stuck, not engaged. Long sessions might mean friction |
| Page views on tool gallery | "Gallery gets 5K views!" | Views without deployment = window shopping |
| Raw user count | "1,000 users accessed HiveLab!" | Accessed != created != deployed != retained |
| Prompt count | "Users sent 3,000 prompts!" | More prompts per deployment = more frustration |
| Element types available | "We support 25 element types!" | If 20 of them are never used in deployed tools, they're dead weight |

**What to track instead for each:**
- Total tools -> Active tools (interacted with in last 30 days) / Total tools. Target: >40%
- Total generations -> Deployment rate (deployed / generated). Target: >50%
- Session time -> Time-to-deploy (lower is generally better, track satisfaction at deploy)
- Gallery views -> Gallery-to-deploy conversion rate. Target: >10%
- User count -> Weekly active creators (generated or edited a tool). Target: growing week-over-week
- Prompt count -> Prompts per deployed tool (lower is better). Target: < 3
- Element types -> Element usage distribution. Components used in <2% of deployed tools should be questioned

### Metrics That Incentivize Wrong Behavior

| Metric | What It Optimizes For | Why That's Destructive |
|--------|----------------------|----------------------|
| Tools per user | Quantity over quality | Users spam low-quality tools. A student with 1 great tool beats one with 20 junk tools |
| Generation speed (too aggressively) | Faster AI at cost of quality | Users get instant garbage instead of slightly-slower quality. From MAGIC_MOMENTS.md: time-to-magic matters, but "output must look good by default" |
| Auto-accept rate | Looser quality gates | More garbage reaches users. The quality gate (`QualityGateService`) exists for a reason -- weakening it destroys trust |
| Element count per tool | More complex = better | AI bloats tools with unnecessary elements. A clean 2-element tool that does one thing well beats a 6-element tool that does everything poorly |
| AI-only creation rate | Less human editing | Kills the IKEA effect. From MAGIC_MOMENTS.md: "users who invested effort in creating digital content valued it more than pre-made content." Editing IS the retention mechanism |
| Time-to-deploy (too aggressively) | Rushing past the editing step | Users skip the craft step that builds psychological ownership. From MAGIC_MOMENTS.md: "The user must have actually built something, not just customized a template" |
| Fork count (gamified) | Quantity of forks | Self-forking to inflate numbers. Forks without remixes (modifications) are hollow copies |

### Goodhart's Law Watchlist

"When a measure becomes a target, it ceases to be a good measure."

Watch for these gaming patterns as metrics are surfaced to users:
- If we incentivize deployment count: watch for empty tools deployed and immediately abandoned
- If we incentivize TQS: watch for template-only tools that score high but add zero unique value
- If we incentivize forks: watch for self-forking or fork-to-delete patterns
- If we incentivize interaction rate: watch for tools that require mandatory interaction but provide no value (dark UX patterns)
- If we gamify creator levels: watch for minimal-effort level-grinding (create 3 versions by changing one character each time to reach Level 4)

**Mitigation:** Never tie rewards, badges, or visibility directly to a single metric. Use composite scores (TQS) that are harder to game because gaming one dimension hurts another.

---

## 8. Real-Time Quality Dashboard

### What to Check Every Morning (5 Numbers in 10 Seconds)

```
HIVELAB PULSE -- Feb 7, 2026
===========================================================
PVI:   72 (+3)     TQS:   68 (avg)    Gen:   47 (today)
DR:    62%         Churn:  8%/wk      Errors: 2 (today)
===========================================================
  PVI    = Platform Vitality Index (0-100)
  TQS    = Avg Tool Quality Score of deployed tools
  Gen    = AI generations today
  DR     = Deployment Rate (deployed / generated)
  Churn  = Creator week-over-week churn
  Errors = Rejected generations today
```

### Key Graphs (5 graphs, check weekly)

**Graph 1: Quality Score Distribution (7-day rolling)**

Histogram of TQS scores for all generations this week. Watch the bell curve.

```
This Week (n=84)                    vs. Last Week (n=72)
Exceptional (90+):  ████████ 14%         ██████ 11%
Good (70-89):       █████████████ 48%    █████████████ 47%
Acceptable (50-69): ████████ 26%         ██████████ 30%
Poor (30-49):       ███ 8%               ████ 9%
Failing (<30):      █ 4%                 ██ 3%

Mean: 71.2 (+1.8 from last week)
Median: 73.0 (+2.0)
```

Alert: Mean drops >5 points in 24 hours -> investigate AI regression

**Graph 2: Generation Funnel (daily)**

```
Prompts Entered:      |====================| 100%  (n=100)
Generation Started:   |==================  |  90%
Generation Complete:  |================    |  82%
Accepted at Gate:     |==============      |  68%
Deployed to Space:    |==========          |  52%
Used by Others:       |======              |  31%
```

Alert: Any step drops >10% from trailing 7-day average

**Graph 3: Creator Cohort Retention (weekly)**

For each signup week, what % are still creating/editing N weeks later. Classic retention curve.

```
Week 0:  |████████████████████| 100%
Week 1:  |████████████        |  60%
Week 2:  |████████            |  42%
Week 4:  |██████              |  30%
Week 8:  |████                |  22%
Week 12: |███                 |  18%
```

Alert: Latest cohort Week 1 retention drops below 40%

**Graph 4: AI Error Rate (hourly, 24-hour window)**

```
  30%|
     |                                    *
  20%|                                   * *
     |           *                      *   *
  10%| *  *  * *  *  *  *  *  *  *  *  *     *  *
     |*  *  *     *  *  *  *  *  *  *         *  *
   0%|_____|_____|_____|_____|_____|_____|_____|_____|
     00   03    06    09    12    15    18    21    24

  Rejection Rate (blue)    Failure Rate (red)    Fallback Rate (yellow)
```

Alert: Rejection rate >30% for 2 consecutive hours

**Graph 5: Space Type Heat Map (weekly)**

| Space Type | Avg TQS | Deploy Rate | Edit Rate | Interaction Rate | Status |
|------------|---------|-------------|-----------|-----------------|--------|
| Student Orgs | 72 | 58% | 35% | 42% | GREEN |
| Greek Life | 68 | 52% | 40% | 38% | GREEN |
| Residential | 65 | 48% | 28% | 31% | YELLOW |
| University Orgs | 61 | 44% | 22% | 25% | YELLOW |

Alert: Any space type drops to RED (>15 points below overall average on any metric)

### Leading vs Lagging Indicators

| Type | Metric | Why It's Leading/Lagging | Alert Threshold |
|------|--------|--------------------------|-----------------|
| **Leading** | Prompt quality (avg length, keyword specificity) | Predicts generation quality before AI runs | Avg prompt length drops below 15 chars |
| **Leading** | Time-to-first-edit after generation | Short = high intent to deploy | Median exceeds 5 minutes |
| **Leading** | Template usage rate (templates / total generations) | Predicts new user success | Drops below 20% for new users |
| **Leading** | New creator daily count | Predicts next week's creation volume | 3-day average drops >30% |
| **Leading** | AI error rate spike | Predicts user frustration before support tickets | >20% for 1 hour |
| **Lagging** | Average TQS (deployed tools) | Reflects accumulated quality | Drops below 60 |
| **Lagging** | Creator NPS | Reflects accumulated satisfaction | Drops below +20 |
| **Lagging** | Semester retention | Only measurable after semester boundary | Drops below 30% |
| **Lagging** | Fork rate | Only visible after tools are public for weeks | Below 3% after month 2 |
| **Lagging** | Space-type coverage (% of spaces with tools) | Builds slowly over weeks | Below 20% after month 2 |

### When to Panic vs When to Celebrate

**PANIC -- action within hours:**
- AI rejection rate >40% sustained for 3+ hours (AI service likely degraded or prompt regression)
- Generation latency P95 >15 seconds (users will abandon mid-generation)
- Zero deployments in 24 hours during an active semester week (something is fundamentally broken)
- Quality floor collapse: >50% of today's deployed tools have TQS <40 (users seeing garbage)
- Creator churn spike: week-over-week active creator count drops >30%

**CONCERN -- investigate within 24 hours:**
- Average TQS drops >5 points week-over-week
- Abandonment rate exceeds 50% of started sessions
- Regeneration spiral rate exceeds 20% of sessions
- One space type's quality score diverges >15 points from overall average
- Creator NPS drops below +20
- Smoke test prompt fails (any of the 10 core prompts produces TQS below minimum)

**CELEBRATE -- share with team:**
- PVI exceeds 70 for 7 consecutive days (ecosystem reaching critical mass)
- First tool forked across space types (ideas spreading between org types)
- Creator cohort shows >40% Week 4 retention (real product-market fit signal)
- Average TQS exceeds 75 (quality is genuinely good, not just acceptable)
- Student org spontaneously creates 5+ tools without prompting (organic adoption, not seeded)
- A deployed tool is used by >50% of a space's members (tool-market fit)

**MILESTONE -- tell stakeholders:**
- 100 tools deployed across campus
- First tool used by students across 3+ different org types (cross-space network effect)
- Creator NPS hits +50
- A student builds a tool that replaces a manual process their org was doing (real operational value)
- Tool shared outside HIVE (screenshot on social media, mentioned in org communications, linked from org website)

---

## 9. Implementation Priority

What to build first vs what can wait, mapped to existing infrastructure.

### Phase 1: Pre-Launch (Must Have for Launch Gates)

| # | What | Effort | Depends On | Maps To |
|---|------|--------|------------|---------|
| 1 | Expand benchmark suite to 50 prompts | Low | Nothing | Extend `benchmark-prompts.ts` |
| 2 | Run smoke test as pre-deploy check | Low | #1 | Add npm script, run 10 prompts x3 |
| 3 | TQS: Functional Integrity + Semantic Accuracy | Low | Nothing | Already ~80% built in `QualityScore` |
| 4 | Generation funnel tracking | Low | Nothing | Already built in `GenerationTrackerService`, expose to admin |
| 5 | AI error rate alerting | Low | Nothing | Threshold check on `gateDecision = 'rejected'` rate |
| 6 | Empty shelf metric | Low | Nothing | `COUNT DISTINCT spaceId FROM deployedTools` / `COUNT spaces WHERE isActive` |

### Phase 2: Month 1 (First Operational Metrics)

| # | What | Effort | Depends On |
|---|------|--------|------------|
| 7 | Creator levels + progression tracking | Medium | User activity data flowing |
| 8 | Abandonment signal classification | Medium | `GenerationOutcome` data in `ai_generations` |
| 9 | Space-type quality segmentation | Low | Existing `AIGenerationRecord.spaceContext` |
| 10 | Design Coherence scoring (new TQS dimension) | Medium | ToolComposition position/size data |
| 11 | Dashboard v1: 5 numbers + 3 graphs | Medium | #3, #4, #5, #6 |
| 12 | PVI calculation (partial -- CV, ED, QF) | Low | #6 |

### Phase 3: Month 2-3 (Usage + Social Metrics)

| # | What | Effort | Depends On |
|---|------|--------|------------|
| 13 | Usage Signal dimension (TQS) | Medium | Enough deployed tools with `deployedTools/{id}/events` data |
| 14 | Creator NPS micro-survey | Medium | In-product survey infrastructure |
| 15 | A/B testing framework for generation | High | Traffic routing + variant tracking in `AIGenerationRecord` |
| 16 | Fork/remix tracking | Medium | Fork feature implemented |
| 17 | Full PVI calculation (all 5 sub-metrics) | Low | #12, #13, #16 |
| 18 | Space-type specific health scores (OHS, OCS, FES, SRS) | Medium | Space type data + tool interaction data |

### Phase 4: Ongoing (Long-term Intelligence)

| # | What | Effort | Depends On |
|---|------|--------|------------|
| 19 | Seasonal pattern analysis | Low (analysis only) | Full semester of data |
| 20 | Semester retention tracking | Low | Second semester begins |
| 21 | Automated insight generation | High | `AutomatedInsight` types already defined, need ML pipeline |
| 22 | Year-over-year PVI comparison | Low (analysis only) | Full year of data |
| 23 | Embedding-based semantic accuracy | Medium | Embedding model integration |
| 24 | Cross-campus benchmarking | Medium | Multiple campuses live |

### The One Metric That Matters (OMTM) by Phase

| Phase | OMTM | Why | Target |
|-------|------|-----|--------|
| Pre-launch | Smoke test pass rate | AI generation quality is the foundation. If the 10 core prompts don't produce good tools, nothing else matters | 30/30 pass |
| Launch (month 1) | Time-to-first-deploy | Activation is everything. From MAGIC_MOMENTS.md: "First output in under 5 minutes" | < 5 minutes, median |
| Growth (month 2-3) | Deployment rate | Conversion from generation to actual deployed tool proves value | > 55% |
| Retention (month 3-6) | Creator Week 4 retention | Proves tools have lasting value, not just novelty | > 30% |
| Scale (month 6+) | Cross-space fork rate | Network effects prove the ecosystem is alive and self-sustaining | > 5% monthly |
