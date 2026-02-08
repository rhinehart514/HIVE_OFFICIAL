# HiveLab Conversational Creation Architecture

**Status**: Design Spec
**Author**: Architecture Agent
**Date**: 2026-02-07

---

## Core Thesis

The input box is the product. The output is an artifact (a live, interactive tool). The ecosystem compounds through sharing. Students describe what they want, a working tool appears, they iterate conversationally, then deploy with one action.

---

## 1. ToolArtifact Component

The artifact is the live, interactive tool rendered inline within the conversation. Not on a canvas. Not in a preview frame. The tool itself, running, clickable.

### Interface

```typescript
// File: packages/ui/src/design-system/components/hivelab/ToolArtifact.tsx

import type { ToolComposition, CanvasElement, CombinedToolState } from '@hive/core';

/**
 * Surface determines layout constraints and interaction model.
 * Same artifact component renders everywhere, adapting to available space.
 */
type ArtifactSurface = 'conversation' | 'sidebar' | 'command-palette' | 'fullscreen';

interface ToolArtifactProps {
  /** The tool composition to render */
  composition: ToolComposition;

  /** Which surface is rendering this artifact */
  surface: ArtifactSurface;

  /** Tool state for interactive elements (polls, RSVPs, etc.) */
  state: CombinedToolState | null;

  /** Whether the artifact is in "preview" mode (no writes) or "live" */
  mode: 'preview' | 'live';

  /** Generation status for streaming builds */
  generationStatus?: 'streaming' | 'complete' | 'error';

  /** Elements currently being streamed in (partial build) */
  streamingElements?: CanvasElement[];

  /** Callback when user interacts with a live element */
  onAction?: (elementInstanceId: string, action: string, payload: Record<string, unknown>) => void;

  /** Callback to iterate: user typed follow-up about this artifact */
  onIterate?: (prompt: string) => void;
}
```

### Rendering Strategy

The `ToolArtifact` uses the existing `renderElementSafe` from `packages/ui/src/components/hivelab/elements/registry.tsx` -- no new element renderers needed. The artifact is a layout container that:

1. Reads the composition's `layout` field (`flow | grid | tabs | sidebar`)
2. Iterates over `composition.elements` and renders each via `renderElementSafe(element.elementId, elementProps)`
3. Applies layout spacing using design tokens (`@hive/tokens`)
4. During streaming: renders elements as they arrive with entrance animation, shows skeleton placeholders for anticipated remaining elements

```typescript
// Layout behavior per surface:
const SURFACE_CONSTRAINTS: Record<ArtifactSurface, { maxWidth: number; padding: string }> = {
  'conversation': { maxWidth: 480, padding: 'var(--spacing-4)' },
  'sidebar': { maxWidth: 320, padding: 'var(--spacing-3)' },
  'command-palette': { maxWidth: 560, padding: 'var(--spacing-4)' },
  'fullscreen': { maxWidth: 800, padding: 'var(--spacing-6)' },
};
```

### Streaming Build Animation

While `generationStatus === 'streaming'`, elements appear one by one using `@hive/ui/motion`:

```typescript
// File: packages/ui/src/design-system/components/hivelab/ArtifactStreamLayout.tsx

const elementEntrance = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
};
```

### File Location

```
packages/ui/src/design-system/components/hivelab/ToolArtifact.tsx
packages/ui/src/design-system/components/hivelab/ArtifactStreamLayout.tsx
packages/ui/src/design-system/components/hivelab/ArtifactHeader.tsx
```

---

## 2. Conversation State Machine

### States & Transitions

```typescript
// File: packages/core/src/domain/hivelab/conversation-machine.ts

type ConversationState =
  | 'idle'           // Empty input, no artifact. CTA: prompt suggestions
  | 'prompting'      // User is typing. CTA: none (auto-detect intent)
  | 'routing'        // AI determining intent (template match vs full gen). Duration: <200ms
  | 'generating'     // Streaming tool composition from API. Artifact building live
  | 'previewing'     // Artifact complete, interactive preview. CTA: iterate, deploy, share
  | 'iterating'      // User typed follow-up, modifying existing artifact
  | 'deploying'      // User chose a deploy target. CTA: confirm
  | 'deployed'       // Tool is live. CTA: view in space, share link, iterate more
  | 'error';         // Generation or deploy failed. CTA: retry, modify prompt

type ConversationTransition =
  | { from: 'idle'; to: 'prompting'; trigger: 'user_focused_input' }
  | { from: 'prompting'; to: 'routing'; trigger: 'user_submitted_prompt' }
  | { from: 'routing'; to: 'generating'; trigger: 'intent_resolved_to_generation' }
  | { from: 'routing'; to: 'previewing'; trigger: 'intent_resolved_to_template' }
  | { from: 'routing'; to: 'idle'; trigger: 'intent_resolved_to_redirect' }  // IDE redirect
  | { from: 'generating'; to: 'previewing'; trigger: 'generation_complete' }
  | { from: 'generating'; to: 'error'; trigger: 'generation_failed' }
  | { from: 'previewing'; to: 'iterating'; trigger: 'user_submitted_followup' }
  | { from: 'previewing'; to: 'deploying'; trigger: 'user_chose_deploy' }
  | { from: 'iterating'; to: 'routing'; trigger: 'followup_submitted' }
  | { from: 'deploying'; to: 'deployed'; trigger: 'deploy_success' }
  | { from: 'deploying'; to: 'error'; trigger: 'deploy_failed' }
  | { from: 'deployed'; to: 'iterating'; trigger: 'user_wants_changes' }
  | { from: 'error'; to: 'prompting'; trigger: 'user_retried' }
  | { from: '*'; to: 'idle'; trigger: 'user_cleared' };

/**
 * Full conversation session state persisted in memory during creation.
 */
interface ConversationSession {
  /** Current machine state */
  state: ConversationState;

  /** All messages in the conversation (user + system) */
  messages: ConversationMessage[];

  /** Current artifact (null until first generation) */
  artifact: ToolComposition | null;

  /** Current artifact state (for preview interactions) */
  artifactState: CombinedToolState | null;

  /** Conversation turn count (for context window) */
  turnCount: number;

  /** Space context if initiated from a space */
  spaceContext: SpaceContext | null;

  /** The detected intent from the last prompt */
  lastIntent: DetectedIntent | null;

  /** Deploy target if user has selected one */
  deployTarget: DeployTarget | null;

  /** Error info if in error state */
  error: { message: string; retryable: boolean } | null;

  /** Timestamp of session start */
  startedAt: number;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** Artifact snapshot at this point in conversation */
  artifactSnapshot?: ToolComposition;
  /** Metadata about what the system did */
  metadata?: {
    intent?: DetectedIntent;
    templateMatched?: string;
    elementsAdded?: string[];
    elementsRemoved?: string[];
    elementsModified?: string[];
  };
}

interface DeployTarget {
  type: 'space' | 'profile';
  id: string;
  name: string;
  surface?: 'sidebar' | 'inline';
}
```

### UI Per State

| State | Input Box | Artifact Panel | Action Bar |
|-------|-----------|---------------|------------|
| `idle` | Focused, placeholder: "Describe what you need..." | Empty, shows 3 prompt suggestions | Hidden |
| `prompting` | Active, user typing | Dimmed suggestions | Hidden |
| `routing` | Disabled, brief pulse | "Understanding..." shimmer | Hidden |
| `generating` | Disabled, shows thinking text | Elements stream in one by one | Cancel button |
| `previewing` | Re-enabled, placeholder: "Make changes..." | Full artifact, interactive | Deploy / Share / Open in Studio |
| `iterating` | Active, user typing follow-up | Current artifact visible, dimmed | Hidden |
| `deploying` | Disabled | Artifact with deploy overlay | Confirm / Cancel |
| `deployed` | Re-enabled, "Want to change anything?" | Artifact with "Live" badge | View in Space / Share Link |
| `error` | Re-enabled, pre-filled with last prompt | Error message with suggestion | Retry |

---

## 3. Multi-Surface Conversation UI

The same conversation state and rendering works across four surfaces. The difference is layout, not logic.

### Shared Context

```typescript
// File: apps/web/src/contexts/conversation/ConversationContext.tsx

import { createContext, useContext } from 'react';

interface ConversationContextValue {
  /** Current session state */
  session: ConversationSession;

  /** Send a prompt (new or follow-up) */
  send: (prompt: string) => Promise<void>;

  /** Cancel current generation */
  cancel: () => void;

  /** Reset conversation */
  reset: () => void;

  /** Deploy the current artifact */
  deploy: (target: DeployTarget) => Promise<void>;

  /** Set space context (for space-initiated conversations) */
  setSpaceContext: (ctx: SpaceContext) => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);
export const useConversation = () => useContext(ConversationContext)!;
```

### Hook: useConversationEngine

```typescript
// File: apps/web/src/hooks/use-conversation-engine.ts

/**
 * Core engine hook that manages conversation state, AI routing,
 * streaming generation, and deployment.
 *
 * Wraps useStreamingGeneration from @hive/hooks and adds:
 * - Conversation message history
 * - State machine transitions
 * - Intent routing (template match vs full gen)
 * - Deploy-in-conversation flow
 */
function useConversationEngine(options?: {
  initialSpaceContext?: SpaceContext;
  surface?: ArtifactSurface;
}): ConversationContextValue {
  // State machine
  const [session, setSession] = useState<ConversationSession>(initialSession);

  // Reuse existing streaming hook
  const streaming = useStreamingGeneration({
    onElementAdded: (element, status) => { /* update session.artifact */ },
    onComplete: (composition) => { /* transition to 'previewing' */ },
    onError: (error) => { /* transition to 'error' */ },
  });

  const send = useCallback(async (prompt: string) => {
    // 1. Add user message to history
    // 2. Transition to 'routing'
    // 3. Run intent router (see section 4)
    // 4. Based on routing result:
    //    a. Template match -> apply template, transition to 'previewing'
    //    b. Full generation -> call streaming.generate(), transition to 'generating'
    //    c. IDE redirect -> transition to 'idle', navigate to /tools/studio
    // 5. For iterations: pass existingComposition to streaming.generate()
  }, [session, streaming]);

  const deploy = useCallback(async (target: DeployTarget) => {
    // 1. Transition to 'deploying'
    // 2. Save tool via POST /api/tools (creates tool document)
    // 3. Deploy via POST /api/tools/deploy
    // 4. On success: transition to 'deployed'
    // 5. On failure: transition to 'error'
  }, [session]);

  return { session, send, cancel: streaming.cancel, reset, deploy, setSpaceContext };
}
```

### Surface Components

```
apps/web/src/components/hivelab/conversation/
  ConversationFull.tsx          -- /tools page, standalone full-width
  ConversationSidebar.tsx       -- Space sidebar panel (compact)
  ConversationCommandPalette.tsx -- Cmd+K overlay
  ConversationInline.tsx        -- Embedded in space chat
  shared/
    ConversationInput.tsx        -- The universal input box
    ConversationMessages.tsx     -- Message history display
    ConversationActions.tsx      -- Deploy/Share/Studio action bar
    ConversationSuggestions.tsx  -- Prompt suggestions for idle state
```

All surface components use `<ConversationContext.Provider>` wrapping `useConversationEngine`, each passing its `surface` prop. The `ToolArtifact` component adapts to the surface constraint.

### Surface Layout Specs

**Space Sidebar** (most constrained):
- Width: 320px fixed
- Input at bottom, artifact scrolls above
- Messages collapsed to status chips ("Added poll", "Made anonymous")
- No prompt suggestions (space context provides them)
- Deploy button targets current space by default

**Command Palette** (Cmd+K):
- Centered modal, 560px wide, max 70vh tall
- Input at top (search pattern)
- Artifact renders below input
- Quick-deploy: "Enter" on completed artifact deploys to last-used space
- "Tab" to expand to full page

**Full Page** (/tools or /tools/create):
- Two-column: conversation left (50%), artifact right (50%)
- Full message history visible
- Artifact has maximize button for full-screen preview
- All deploy options visible

**Space Chat Inline**:
- Rendered as a special message bubble
- Compact artifact (max 320px wide)
- Single "Deploy here" action
- Minimal UI

---

## 4. AI Intent Router

Instead of four separate creation flows, a single prompt enters the router. The router determines the fastest path to a working artifact.

```typescript
// File: packages/core/src/domain/hivelab/intent-router.ts

import { detectIntent, type DetectedIntent, type Intent } from './intent-detection';
import { QUICK_TEMPLATES, type QuickTemplate } from '@hive/ui';
import type { ToolComposition } from './tool-composition.types';

/**
 * Routing result: what to do with the user's prompt.
 */
type RoutingResult =
  | { action: 'template'; template: QuickTemplate; customizations: Record<string, unknown> }
  | { action: 'generate'; intent: DetectedIntent }
  | { action: 'redirect'; target: 'studio' }
  | { action: 'clarify'; question: string };

/**
 * Keywords that signal the user wants the full IDE.
 */
const IDE_SIGNALS = [
  'ide', 'studio', 'canvas', 'drag and drop', 'visual editor',
  'build from scratch', 'manual', 'custom layout', 'advanced',
];

/**
 * Intent-to-template mapping.
 * Each intent has ranked template matches with confidence thresholds.
 */
const INTENT_TEMPLATE_MAP: Record<Intent, { templateId: string; minConfidence: number }[]> = {
  'enable-voting': [
    { templateId: 'quick-poll', minConfidence: 0.5 },
    { templateId: 'decision-maker', minConfidence: 0.4 },
    { templateId: 'multi-poll-dashboard', minConfidence: 0.3 },
  ],
  'coordinate-people': [
    { templateId: 'event-rsvp', minConfidence: 0.5 },
    { templateId: 'event-checkin', minConfidence: 0.4 },
    { templateId: 'study-group-signup', minConfidence: 0.3 },
  ],
  'track-time': [
    { templateId: 'event-countdown', minConfidence: 0.5 },
  ],
  'rank-items': [
    { templateId: 'member-leaderboard', minConfidence: 0.5 },
    { templateId: 'competition-tracker', minConfidence: 0.3 },
  ],
  'collect-input': [
    { templateId: 'feedback-form', minConfidence: 0.4 },
    { templateId: 'study-group-signup', minConfidence: 0.3 },
    { templateId: 'office-hours', minConfidence: 0.3 },
  ],
  'broadcast': [
    { templateId: 'announcements', minConfidence: 0.5 },
    { templateId: 'weekly-update', minConfidence: 0.3 },
  ],
  'visualize-data': [
    { templateId: 'space-stats-dashboard', minConfidence: 0.4 },
  ],
  'discover-events': [
    { templateId: 'tonights-events', minConfidence: 0.5 },
    { templateId: 'upcoming-events', minConfidence: 0.4 },
  ],
  'photo-challenge': [
    { templateId: 'photo-challenge', minConfidence: 0.5 },
  ],
  'attendance-tracking': [
    { templateId: 'attendance-tracker', minConfidence: 0.5 },
  ],
  'resource-management': [
    { templateId: 'resource-signup', minConfidence: 0.5 },
  ],
  'multi-vote': [
    { templateId: 'multi-poll-dashboard', minConfidence: 0.5 },
  ],
  'event-series': [
    { templateId: 'event-series-hub', minConfidence: 0.5 },
  ],
  'suggestion-triage': [
    { templateId: 'suggestion-box', minConfidence: 0.5 },
  ],
  'group-matching': [
    { templateId: 'study-group-matcher', minConfidence: 0.5 },
  ],
  'competition-goals': [
    { templateId: 'competition-tracker', minConfidence: 0.5 },
  ],
  // These intents always go to full generation (no template match)
  'show-results': [],
  'search-filter': [],
  'find-food': [],
  'find-study-spot': [],
};

/**
 * Route a user prompt to the fastest path to a working artifact.
 *
 * Priority:
 * 1. IDE redirect (explicit request for studio)
 * 2. Template match (instant, <100ms)
 * 3. Full generation (streaming, 1-3s)
 */
function routeIntent(
  prompt: string,
  context?: { spaceId?: string; spaceName?: string },
): RoutingResult {
  const lower = prompt.toLowerCase();

  // 1. Check for explicit IDE/studio redirect
  if (IDE_SIGNALS.some(signal => lower.includes(signal))) {
    return { action: 'redirect', target: 'studio' };
  }

  // 2. Detect intent
  const intent = detectIntent(prompt);

  // 3. Try template match
  if (intent.confidence >= 0.5) {
    const templateCandidates = INTENT_TEMPLATE_MAP[intent.primary] || [];

    for (const candidate of templateCandidates) {
      if (intent.confidence >= candidate.minConfidence) {
        const template = QUICK_TEMPLATES.find(t => t.id === candidate.templateId);
        if (template && template.status !== 'hidden') {
          // Extract customizations from the prompt
          const customizations = extractCustomizations(prompt, template, intent);
          return { action: 'template', template, customizations };
        }
      }
    }
  }

  // 4. Fall through to full generation
  return { action: 'generate', intent };
}

/**
 * Extract customizations from the prompt to apply to a matched template.
 * Example: "Make a poll about lunch spots" -> { question: "What's your favorite lunch spot?" }
 */
function extractCustomizations(
  prompt: string,
  template: QuickTemplate,
  intent: DetectedIntent,
): Record<string, unknown> {
  const customizations: Record<string, unknown> = {};

  // If template has setupFields, try to fill them from the prompt
  if (template.setupFields) {
    for (const field of template.setupFields) {
      // Use keyword extraction to populate fields
      // "poll about lunch spots" -> question field gets "What's your favorite lunch spot?"
      // "countdown to spring formal" -> title field gets "Spring Formal"
      const extracted = extractFieldValue(prompt, field, intent);
      if (extracted !== undefined) {
        customizations[field.key] = extracted;
      }
    }
  }

  return customizations;
}
```

### Routing Decision Flow

```
User types prompt
       |
       v
  IDE signals? ----yes----> Redirect to /tools/studio
       |
       no
       |
       v
  Detect intent
  (existing detectIntent from intent-detection.ts)
       |
       v
  Confidence >= 0.5? ----no----> Full AI generation
       |
       yes
       |
       v
  Template match found? ----no----> Full AI generation
       |
       yes
       |
       v
  Apply template with prompt-extracted customizations
  (instant, <100ms)
       |
       v
  Show artifact in 'previewing' state
```

---

## 5. Template-as-AI-Fallback

Templates are not browsed -- they are what AI uses when it recognizes a pattern. The user never sees "pick a template." They describe, and if the description maps to a known pattern, the template is used as a fast path.

### Template Matching Logic

```typescript
// File: packages/core/src/domain/hivelab/template-matcher.ts

import { QUICK_TEMPLATES, type QuickTemplate } from '@hive/ui';
import type { DetectedIntent } from './intent-detection';

interface TemplateMatch {
  template: QuickTemplate;
  score: number; // 0-1
  matchType: 'exact' | 'partial' | 'semantic';
  customizations: Record<string, unknown>;
}

/**
 * Score a template against a detected intent + prompt.
 * Returns null if no viable match.
 */
function scoreTemplate(
  template: QuickTemplate,
  intent: DetectedIntent,
  prompt: string,
): TemplateMatch | null {
  let score = 0;

  // 1. Direct intent-to-template mapping (highest weight)
  const mapping = INTENT_TEMPLATE_MAP[intent.primary];
  const directMatch = mapping?.find(m => m.templateId === template.id);
  if (directMatch) {
    score += 0.5;
  }

  // 2. Template name/description fuzzy match
  const lowerPrompt = prompt.toLowerCase();
  const nameWords = template.name.toLowerCase().split(' ');
  const nameMatchCount = nameWords.filter(w => lowerPrompt.includes(w)).length;
  score += (nameMatchCount / nameWords.length) * 0.3;

  // 3. Complexity appropriateness
  // Short prompts ("make a poll") -> prefer simple templates
  // Long prompts ("build an attendance tracker with points and trends") -> prefer app templates
  const wordCount = prompt.split(' ').length;
  if (wordCount <= 6 && template.complexity === 'simple') score += 0.1;
  if (wordCount > 10 && template.complexity === 'app') score += 0.1;

  // 4. Hidden/blocked templates are disqualified
  if (template.status === 'hidden') return null;

  // Minimum threshold
  if (score < 0.4) return null;

  const customizations = extractCustomizations(prompt, template, intent);

  return {
    template,
    score: Math.min(score, 1),
    matchType: score >= 0.7 ? 'exact' : score >= 0.5 ? 'partial' : 'semantic',
    customizations,
  };
}

/**
 * Find the best template match for a prompt.
 */
function findBestTemplateMatch(
  prompt: string,
  intent: DetectedIntent,
): TemplateMatch | null {
  const matches = QUICK_TEMPLATES
    .map(t => scoreTemplate(t, intent, prompt))
    .filter((m): m is TemplateMatch => m !== null)
    .sort((a, b) => b.score - a.score);

  return matches[0] || null;
}
```

### Template Customization Application

When a template matches, the prompt's content is used to customize it:

```typescript
/**
 * Apply prompt-extracted customizations to a template composition.
 * Returns a new ToolComposition with the customizations applied.
 */
function applyCustomizations(
  template: QuickTemplate,
  customizations: Record<string, unknown>,
): ToolComposition {
  const composition = createToolFromTemplate(template);

  // Apply customizations to element configs
  for (const [key, value] of Object.entries(customizations)) {
    for (const element of composition.elements) {
      if (key in element.config) {
        element.config[key] = value;
      }
    }
  }

  // Update composition name if we extracted a title
  if (customizations.title || customizations.question || customizations.eventName) {
    const extractedName = (customizations.title || customizations.question || customizations.eventName) as string;
    composition.name = extractedName.length > 40 ? extractedName.slice(0, 40) + '...' : extractedName;
  }

  return composition;
}
```

---

## 6. Deploy-in-Conversation

No deploy page. "Add to Photography Club" is a conversational action.

### Conversation Deploy Flow

```
User: "Add this to Photography Club"
  |
  v
System detects deploy intent from message
  |
  v
Resolve target:
  - If spaceContext is set (sidebar/chat): use current space
  - If prompt mentions space name: fuzzy-match against user's spaces
  - If ambiguous: show space picker inline
  |
  v
Pre-flight checks (existing validation):
  - validateToolElements (element compatibility)
  - validatePlacementCapabilities (lane check)
  - enforceSpaceLimit (max 20 tools)
  |
  v
Show confirmation inline:
  "Deploy [Tool Name] to Photography Club?"
  [Confirm] [Cancel]
  |
  v
On confirm: POST /api/tools (save) -> POST /api/tools/deploy
  |
  v
Success state: "Live in Photography Club" with link
```

### Deploy Intent Detection

```typescript
// File: packages/core/src/domain/hivelab/deploy-intent.ts

const DEPLOY_SIGNALS = [
  'deploy', 'add to', 'put in', 'add this to', 'deploy to',
  'install in', 'launch in', 'send to', 'share to', 'place in',
  'use in', 'set up in',
];

interface DeployIntent {
  isDeployRequest: boolean;
  targetName: string | null;  // "Photography Club", "my profile"
  targetType: 'space' | 'profile' | null;
  confidence: number;
}

function detectDeployIntent(prompt: string): DeployIntent {
  const lower = prompt.toLowerCase();

  for (const signal of DEPLOY_SIGNALS) {
    if (lower.includes(signal)) {
      // Extract target name: everything after the deploy signal
      const afterSignal = lower.split(signal)[1]?.trim();
      const isProfile = afterSignal?.includes('profile') || afterSignal?.includes('my page');

      return {
        isDeployRequest: true,
        targetName: afterSignal || null,
        targetType: isProfile ? 'profile' : 'space',
        confidence: afterSignal ? 0.8 : 0.5,
      };
    }
  }

  return { isDeployRequest: false, targetName: null, targetType: null, confidence: 0 };
}
```

### Space Fuzzy Matcher

```typescript
// File: apps/web/src/hooks/use-space-matcher.ts

/**
 * Hook that resolves a space name from a user prompt against
 * the user's joined spaces.
 */
function useSpaceMatcher() {
  // Query user's spaces from existing hooks
  // Fuzzy match the target name against space names
  // Return the best match or null
}
```

### API Contract

Deploy uses the existing `POST /api/tools/deploy` endpoint unchanged. The conversation engine:

1. First saves the tool: `POST /api/tools` with the composition
2. Then deploys: `POST /api/tools/deploy` with `{ toolId, deployTo, targetId }`
3. Both endpoints already exist and handle all validation

```typescript
// Conversation deploy sequence (in useConversationEngine)
async function deployArtifact(target: DeployTarget) {
  // 1. Save tool
  const toolRes = await fetch('/api/tools', {
    method: 'POST',
    body: JSON.stringify({
      name: session.artifact.name,
      description: session.artifact.description,
      composition: session.artifact,
      status: 'published',
    }),
  });
  const { toolId } = await toolRes.json();

  // 2. Deploy
  const deployRes = await fetch('/api/tools/deploy', {
    method: 'POST',
    body: JSON.stringify({
      toolId,
      deployTo: target.type,
      targetId: target.id,
      surface: target.surface || 'tools',
    }),
  });

  return deployRes.json();
}
```

---

## 7. Iteration Protocol

"Make it anonymous" modifies the existing composition. "Add a deadline" adds a countdown element. Context is preserved, artifacts update in place.

### Iteration Classification

```typescript
// File: packages/core/src/domain/hivelab/iteration-classifier.ts

/**
 * Classify a follow-up prompt into an iteration type.
 */
type IterationType =
  | 'modify'   // Change config of existing element ("make it anonymous")
  | 'add'      // Add new element ("add a deadline")
  | 'remove'   // Remove an element ("remove the timer")
  | 'restyle'  // Change layout or visual ("make it more compact")
  | 'replace'  // Swap an element ("use a form instead of a poll")
  | 'deploy'   // Deploy the artifact (see section 6)
  | 'unclear'; // Needs clarification

interface ClassifiedIteration {
  type: IterationType;
  /** Target element(s) to modify (for modify/remove/replace) */
  targetElements: string[];
  /** Config changes to apply (for modify) */
  configDelta: Record<string, unknown>;
  /** New element to add (for add) */
  newElementType?: string;
  /** Confidence in classification */
  confidence: number;
}
```

### Iteration Execution

```typescript
/**
 * Apply a classified iteration to an existing composition.
 * Returns the updated composition.
 */
function applyIteration(
  composition: ToolComposition,
  iteration: ClassifiedIteration,
): ToolComposition {
  const updated = structuredClone(composition);

  switch (iteration.type) {
    case 'modify':
      // Find target elements and merge configDelta
      for (const element of updated.elements) {
        if (iteration.targetElements.includes(element.elementId) ||
            iteration.targetElements.includes(element.instanceId)) {
          Object.assign(element.config, iteration.configDelta);
        }
      }
      break;

    case 'add':
      // Delegate to streaming generation for the new element
      // The streaming hook handles this with isIteration=true
      break;

    case 'remove':
      // Remove matched elements
      updated.elements = updated.elements.filter(
        el => !iteration.targetElements.includes(el.elementId) &&
              !iteration.targetElements.includes(el.instanceId)
      );
      // Remove connections referencing removed elements
      updated.connections = updated.connections.filter(
        conn => !iteration.targetElements.includes(conn.from.instanceId) &&
                !iteration.targetElements.includes(conn.to.instanceId)
      );
      break;

    case 'restyle':
      // Apply layout changes
      if (iteration.configDelta.layout) {
        updated.layout = iteration.configDelta.layout as ToolComposition['layout'];
      }
      break;

    case 'replace':
      // Remove old element, add new one at same position
      const oldElement = updated.elements.find(
        el => iteration.targetElements.includes(el.elementId)
      );
      if (oldElement && iteration.newElementType) {
        oldElement.elementId = iteration.newElementType;
        oldElement.config = {}; // Reset config for new element type
      }
      break;
  }

  return updated;
}
```

### Iteration UX

When the user types a follow-up in `previewing` state:

1. The input is classified as an iteration type
2. For `modify`, `remove`, `restyle`, `replace`: applied client-side instantly (no API call)
3. For `add`: triggers `streaming.generate()` with `isIteration=true` and `existingComposition`
4. The artifact updates in place with a brief transition animation
5. A system message is added to conversation: "Made poll anonymous" or "Added countdown timer"

```typescript
// Iteration-specific entrance/exit animations
const iterationMotion = {
  modify: {
    animate: { backgroundColor: ['rgba(255,215,0,0.1)', 'transparent'] },
    transition: { duration: 0.5 },
  },
  add: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    transition: { duration: 0.3 },
  },
  remove: {
    exit: { opacity: 0, height: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
};
```

---

## 8. Data Flow

```
User types prompt
       |
       v
ConversationInput.tsx
       |
       v
useConversationEngine.send(prompt)
       |
       +-- Is iteration? (session.artifact exists)
       |     |
       |     yes --> Classify iteration type
       |     |        |
       |     |        +-- modify/remove/restyle/replace --> Apply locally, update artifact
       |     |        |
       |     |        +-- add --> streaming.generate({ isIteration: true, existingComposition })
       |     |        |
       |     |        +-- deploy --> deployArtifact(target)
       |     |
       |     no --> Route intent
       |              |
       |              +-- template match --> Apply template, show artifact
       |              |
       |              +-- full gen --> streaming.generate({ prompt })
       |              |
       |              +-- IDE redirect --> navigate('/tools/studio')
       |
       v
streaming.generate() calls POST /api/tools/generate
       |
       v
Server: NDJSON streaming response
(thinking -> element -> element -> ... -> complete)
       |
       v
useStreamingGeneration processes chunks
       |
       v
ToolArtifact renders elements progressively
       |
       v
User sees live, interactive tool artifact
       |
       v
User iterates or deploys
```

---

## 9. New File Locations

Following codebase conventions from CLAUDE.md:

### Core Domain (packages/core)
```
packages/core/src/domain/hivelab/
  conversation-machine.ts       # State machine types and transitions
  intent-router.ts              # Prompt -> routing decision
  template-matcher.ts           # Template matching and scoring
  deploy-intent.ts              # Deploy intent detection from prompts
  iteration-classifier.ts       # Follow-up prompt classification
```

### UI Components (packages/ui)
```
packages/ui/src/design-system/components/hivelab/
  ToolArtifact.tsx              # Live tool artifact renderer
  ArtifactStreamLayout.tsx      # Streaming build animation
  ArtifactHeader.tsx            # Name, status, action buttons
```

### App Components (apps/web)
```
apps/web/src/contexts/conversation/
  ConversationContext.tsx        # React context provider

apps/web/src/hooks/
  use-conversation-engine.ts    # Core engine hook
  use-space-matcher.ts          # Fuzzy space name resolution

apps/web/src/components/hivelab/conversation/
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

### No New API Routes Needed

The existing API surface handles everything:
- `POST /api/tools/generate` -- streaming generation (already supports iteration)
- `POST /api/tools` -- save tool
- `POST /api/tools/deploy` -- deploy to space/profile
- Existing middleware, auth, rate limiting all apply

---

## 10. What Does NOT Change

- **Element registry**: All 27 elements remain as-is. No new elements needed.
- **Element renderers**: All existing `packages/ui/src/components/hivelab/elements/` components work as-is.
- **AI backends**: Goose/Groq/Firebase/rules-based generators continue to produce the same `StreamingChunk` format.
- **Deploy API**: `POST /api/tools/deploy` unchanged.
- **Capability governance**: Safe/Scoped/Power lanes, budgets, trust tiers all preserved.
- **Tool state system**: `ToolSharedState`/`ToolUserState`/`CombinedToolState` types unchanged.
- **IDE**: The full HiveLab IDE at `/tools/studio` remains accessible. The conversational system routes there when the user explicitly requests it.

---

## 11. Migration Notes

The conversational system is additive. It does not replace the IDE. It replaces the current tool creation landing page and the template-browsing flow.

**Phase 1**: Build `ToolArtifact` + `ConversationFull` (full-page). Wire to existing generation API.
**Phase 2**: Add `ConversationSidebar` for space-context creation.
**Phase 3**: Add `ConversationCommandPalette` for Cmd+K.
**Phase 4**: Add deploy-in-conversation flow.
**Phase 5**: Add iteration protocol with client-side instant modifications.

The IDE continues to work independently. "Open in Studio" button in conversation actions allows switching to full IDE at any point.
