# HiveLab Integration Map

## Overview

This document maps existing HiveLab infrastructure to the Winter 2025 strategy. Use this as a reference when implementing the chat-first experience.

---

## Core Infrastructure (Already Built)

### 1. Element System

**File:** `packages/ui/src/lib/hivelab/element-system.ts`
**Lines:** ~945
**Status:** Production-ready

```typescript
// Key exports
export const ELEMENT_REGISTRY: Record<string, ElementConfig>
export const ELEMENT_TIERS: { universal, connected, space }
export function getElementsByTier(tier: string): ElementConfig[]
export function validateElementConfig(type: string, config: unknown): boolean
```

**Elements Available:**
| Tier | Elements |
|------|----------|
| Universal | poll-element, timer, countdown-timer, counter, form-builder, chart-display, leaderboard, search-input, filter-selector, result-list, date-picker, tag-cloud, map-view, notification-center |
| Connected | event-picker, space-picker, user-selector, rsvp-button, connection-list |
| Space | member-list, member-selector, space-events, space-feed, space-stats, announcement, role-gate |

**Winter 2025 Usage:** Core element configs power inline components created via chat.

---

### 2. Inline Component Entity

**File:** `packages/core/src/domain/spaces/entities/inline-component.ts`
**Status:** Production-ready

```typescript
// Factory methods for Phase 1 components
InlineComponent.createPoll(props: PollProps): InlineComponent
InlineComponent.createCountdown(props: CountdownProps): InlineComponent
InlineComponent.createRsvp(props: RsvpProps): InlineComponent
InlineComponent.createCustom(props: CustomProps): InlineComponent
```

**State Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│ InlineComponent Document                                     │
├─────────────────────────────────────────────────────────────┤
│ id, messageId, spaceId, componentType                        │
│ config: { question, options, settings }                      │
│ sharedState: { voteCounts: {opt1: 5, opt2: 3} }  ← Aggregated│
├─────────────────────────────────────────────────────────────┤
│ Subcollection: participants/                                 │
│   {participantId}: { optionId, votedAt }         ← Individual│
└─────────────────────────────────────────────────────────────┘
```

**Winter 2025 Usage:** Chat intents create InlineComponents via factory methods.

---

### 3. Placed Tool Entity

**File:** `packages/core/src/domain/spaces/entities/placed-tool.ts`
**Status:** Production-ready

```typescript
interface PlacedTool {
  id: string;
  spaceId: string;
  toolId: string;
  placementType: 'sidebar' | 'inline' | 'modal' | 'tab';
  position: number;
  config: Record<string, unknown>;
  source: 'system' | 'leader' | 'member';
  visibility: 'all' | 'members' | 'leaders';
  createdAt: Date;
  updatedAt: Date;
}
```

**Firestore Path:** `spaces/{spaceId}/placed_tools/{placedToolId}`

**Winter 2025 Usage:** Automations can deploy tools to sidebar.

---

### 4. Tool Runtime Hook

**File:** `apps/web/src/hooks/use-tool-runtime.ts`
**Lines:** 596
**Status:** Production-ready

```typescript
function useToolRuntime(toolId: string, options?: RuntimeOptions) {
  return {
    tool: ToolDefinition | null,
    state: ToolState,
    isLoading: boolean,
    error: Error | null,
    executeAction: (actionId: string, payload: unknown) => Promise<void>,
    updateState: (path: string, value: unknown) => void,
    resetState: () => void,
  };
}
```

**Features:**
- SSE real-time sync with `/api/tools/[toolId]/state/stream`
- Optimistic updates with rollback
- Auto-save with 2s debounce
- Retry logic (3 attempts with exponential backoff)

**Winter 2025 Usage:** Powers sidebar tools and complex compositions.

---

### 5. Tool Placement Service

**File:** `apps/web/src/lib/tool-placement.ts`
**Status:** Production-ready

```typescript
async function createPlacementDocument(params: {
  spaceId: string;
  toolId: string;
  placementType: PlacementType;
  position?: number;
  config?: Record<string, unknown>;
}): Promise<PlacedTool>

async function removePlacement(spaceId: string, placementId: string): Promise<void>

async function reorderPlacements(spaceId: string, orderedIds: string[]): Promise<void>
```

**Winter 2025 Usage:** Automations use this for "deploy tool" actions.

---

### 6. AI Tool Generator

**File:** `packages/core/src/application/hivelab/ai-tool-generator.service.ts`
**Status:** Production-ready

```typescript
class AIToolGeneratorService {
  async generateTool(prompt: string): Promise<ToolComposition>
  async refineComposition(composition: ToolComposition, feedback: string): Promise<ToolComposition>
}
```

**Model:** Gemini 2.0 Flash via Firebase AI
**Prompt Template:** `packages/core/src/application/hivelab/prompts/tool-generation.prompt.ts`

**Winter 2025 Usage:** Powers both chat intents and canvas AI generation.

---

### 7. Deployment API

**File:** `apps/web/src/app/api/tools/deploy/route.ts`
**Status:** Production-ready

```typescript
// POST /api/tools/deploy
interface DeployRequest {
  toolId: string;
  deployTo: 'profile' | 'space';
  targetId: string;
  surface?: 'sidebar' | 'tab' | 'modal';
  permissions: PermissionConfig;
  settings: DeploymentSettings;
}

// Creates:
// 1. DeploymentRecord in tool_deployments collection
// 2. PlacedTool in spaces/{spaceId}/placed_tools
```

**Winter 2025 Usage:** Automations use this for "deploy to space" actions.

---

### 8. Tool Execution API

**File:** `apps/web/src/app/api/tools/execute/route.ts`
**Status:** Production-ready

```typescript
// POST /api/tools/execute
interface ExecuteRequest {
  toolId: string;
  actionId: string;
  payload: Record<string, unknown>;
  context?: {
    spaceId?: string;
    userId?: string;
  };
}

// Inlined action handlers:
// - submit: Form submission
// - vote: Poll voting
// - rsvp: RSVP registration
```

**Winter 2025 Usage:** Powers inline component interactions.

---

## UI Components (Already Built)

### Space Sidebar

**File:** `packages/ui/src/atomic/03-Spaces/organisms/space-sidebar-configurable.tsx`

Renders PlacedTools in space sidebar. Supports:
- Drag-to-reorder (leader only)
- Visibility controls
- Tool removal

### Inline Element Renderer

**File:** `packages/ui/src/components/hivelab/inline-element-renderer.tsx`

Renders inline components in chat. Supports:
- Poll rendering with vote buttons
- Countdown with real-time tick
- RSVP with attendee list
- Custom elements

### Element Renderers

**File:** `packages/ui/src/components/hivelab/element-renderers.tsx`

Full set of 27 element renderers for canvas and runtime.

### Chat Input

**File:** `packages/ui/src/atomic/03-Spaces/organisms/space-chat-input.tsx`

Current chat input component. Needs modification for:
- Slash command detection
- Command autocomplete
- Intent preview

---

## Services (Already Built)

### Space Chat Service

**File:** `packages/core/src/application/spaces/space-chat.service.ts`
**Lines:** 1,478

```typescript
class SpaceChatService {
  async sendMessage(params: SendMessageParams): Promise<Message>
  async editMessage(messageId: string, content: string): Promise<void>
  async deleteMessage(messageId: string): Promise<void>
  async addReaction(messageId: string, reaction: string): Promise<void>
  async pinMessage(messageId: string): Promise<void>
  async createBoard(name: string, type: BoardType): Promise<Board>
}
```

**Winter 2025 Modification Point:**
```typescript
// Add intent detection in sendMessage
async sendMessage(params: SendMessageParams): Promise<Message | InlineComponent> {
  if (isLeader(params.senderId) && hasToolIntent(params.content)) {
    const intent = await this.intentParser.parse(params.content);
    if (intent.confidence > 0.8) {
      return this.createInlineComponent(intent, params);
    }
  }
  // ... existing message flow
}
```

---

## Phase 1 Implementation Files

### New Files to Create

```
apps/web/src/lib/
├── ai-intent-parser.ts           # Natural language → intent
├── intent-to-component.ts        # Intent → InlineComponent
└── slash-command-parser.ts       # /command → structured

packages/core/src/application/hivelab/
└── intent-parser.service.ts      # Server-side intent parsing

apps/web/src/app/api/spaces/[spaceId]/chat/
└── intent/route.ts               # Intent parsing endpoint
```

### ai-intent-parser.ts Template

```typescript
import { generateText } from '@hive/firebase/ai';

export type IntentType = 'poll' | 'rsvp' | 'countdown' | 'announcement' | 'none';

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  params: {
    question?: string;
    options?: string[];
    deadline?: Date;
    limit?: number;
    title?: string;
    content?: string;
  };
  rawInput: string;
}

const INTENT_PROMPT = `
You are an intent parser for a campus community platform.
Analyze if the message is a request to create a component.

Supported components:
- poll: "create a poll", "let's vote on", "poll for"
- rsvp: "set up rsvp", "registration for", "sign up for"
- countdown: "countdown to", "timer for", "X days until"
- announcement: "announce", "announcement:", "📢"

Return JSON:
{
  "type": "poll|rsvp|countdown|announcement|none",
  "confidence": 0.0-1.0,
  "params": { extracted parameters }
}

Message: "{message}"
`;

export async function parseIntent(message: string): Promise<ParsedIntent> {
  const prompt = INTENT_PROMPT.replace('{message}', message);

  const response = await generateText({
    model: 'gemini-2.0-flash',
    prompt,
    temperature: 0.1,
  });

  try {
    const parsed = JSON.parse(response);
    return {
      ...parsed,
      rawInput: message,
    };
  } catch {
    return {
      type: 'none',
      confidence: 0,
      params: {},
      rawInput: message,
    };
  }
}
```

### intent-to-component.ts Template

```typescript
import { InlineComponent } from '@hive/core';
import { ParsedIntent } from './ai-intent-parser';

export function createComponentFromIntent(
  intent: ParsedIntent,
  context: { spaceId: string; messageId: string; creatorId: string }
): InlineComponent | null {
  switch (intent.type) {
    case 'poll':
      return InlineComponent.createPoll({
        ...context,
        question: intent.params.question || 'Poll',
        options: intent.params.options || ['Option 1', 'Option 2'],
        settings: {
          allowMultiple: false,
          anonymous: false,
          showResults: true,
        },
      });

    case 'rsvp':
      return InlineComponent.createRsvp({
        ...context,
        title: intent.params.title || 'Event RSVP',
        maxAttendees: intent.params.limit,
        deadline: intent.params.deadline,
      });

    case 'countdown':
      return InlineComponent.createCountdown({
        ...context,
        title: intent.params.title || 'Countdown',
        targetDate: intent.params.deadline || new Date(),
      });

    case 'announcement':
      // Announcements are special - they're styled messages, not components
      return null;

    default:
      return null;
  }
}
```

### slash-command-parser.ts Template

```typescript
export interface SlashCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
}

const COMMAND_PATTERNS: Record<string, RegExp> = {
  poll: /^\/poll\s+"([^"]+)"\s+(.+)$/,
  rsvp: /^\/rsvp\s+"([^"]+)"(.*)$/,
  countdown: /^\/countdown\s+"([^"]+)"\s+(\S+)$/,
  announce: /^\/announce\s+(.+)$/,
};

export function parseSlashCommand(input: string): SlashCommand | null {
  if (!input.startsWith('/')) return null;

  const trimmed = input.trim();
  const spaceIndex = trimmed.indexOf(' ');
  const command = spaceIndex > 0
    ? trimmed.slice(1, spaceIndex)
    : trimmed.slice(1);

  if (!COMMAND_PATTERNS[command]) return null;

  const match = trimmed.match(COMMAND_PATTERNS[command]);
  if (!match) return null;

  // Extract flags (--flag or --flag=value)
  const flags: Record<string, string | boolean> = {};
  const flagPattern = /--(\w+)(?:=(\S+))?/g;
  let flagMatch;
  while ((flagMatch = flagPattern.exec(trimmed)) !== null) {
    flags[flagMatch[1]] = flagMatch[2] || true;
  }

  return {
    command,
    args: match.slice(1).filter(Boolean),
    flags,
    raw: input,
  };
}

// Usage examples:
// /poll "What's for lunch?" Pizza Sushi Burgers
// /rsvp "Study Session" --limit=20 --deadline=2024-01-15
// /countdown "Finals Week" 2024-12-16T09:00
// /announce Welcome new members!
```

---

## Phase 3 Implementation Files

### New Files to Create

```
packages/core/src/domain/hivelab/entities/
└── automation.ts                 # Automation entity

packages/core/src/application/hivelab/
└── automation.service.ts         # Automation CRUD + execution

apps/web/src/app/api/spaces/[spaceId]/automations/
├── route.ts                      # GET (list), POST (create)
└── [automationId]/route.ts       # PATCH, DELETE

apps/web/src/app/spaces/[spaceId]/automations/
└── page.tsx                      # Automation dashboard UI
```

### automation.ts Template

```typescript
export type TriggerType = 'member_join' | 'event_reminder' | 'schedule' | 'keyword';
export type ActionType = 'send_message' | 'create_component' | 'assign_role' | 'notify';

export interface AutomationTrigger {
  type: TriggerType;
  config: {
    // member_join: no config needed
    // event_reminder: { beforeMinutes: number }
    // schedule: { cron: string }
    // keyword: { keywords: string[], matchType: 'any' | 'all' }
    [key: string]: unknown;
  };
}

export interface AutomationAction {
  type: ActionType;
  config: {
    // send_message: { content: string, boardId?: string }
    // create_component: { componentType: string, componentConfig: object }
    // assign_role: { roleId: string }
    // notify: { title: string, body: string }
    [key: string]: unknown;
  };
}

export interface Automation {
  id: string;
  spaceId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  name: string;
  description?: string;
  enabled: boolean;

  trigger: AutomationTrigger;
  action: AutomationAction;

  stats: {
    timesTriggered: number;
    lastTriggered?: Date;
    lastError?: string;
  };
}

export class AutomationEntity {
  constructor(private readonly props: Automation) {}

  static create(params: {
    spaceId: string;
    createdBy: string;
    name: string;
    trigger: AutomationTrigger;
    action: AutomationAction;
  }): AutomationEntity {
    return new AutomationEntity({
      id: crypto.randomUUID(),
      spaceId: params.spaceId,
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: params.name,
      enabled: true,
      trigger: params.trigger,
      action: params.action,
      stats: {
        timesTriggered: 0,
      },
    });
  }

  get id() { return this.props.id; }
  get spaceId() { return this.props.spaceId; }
  get enabled() { return this.props.enabled; }
  get trigger() { return this.props.trigger; }
  get action() { return this.props.action; }

  enable(): void {
    this.props.enabled = true;
    this.props.updatedAt = new Date();
  }

  disable(): void {
    this.props.enabled = false;
    this.props.updatedAt = new Date();
  }

  recordTrigger(error?: string): void {
    this.props.stats.timesTriggered++;
    this.props.stats.lastTriggered = new Date();
    if (error) {
      this.props.stats.lastError = error;
    }
  }

  toJSON(): Automation {
    return { ...this.props };
  }
}
```

---

## Firestore Collections

### Existing (No Changes)

```
spaces/{spaceId}/
├── placed_tools/{placedToolId}
├── messages/{messageId}/
│   └── inline_components/{componentId}
└── boards/{boardId}

tools/{toolId}
tool_deployments/{deploymentId}
```

### New (Phase 3)

```
spaces/{spaceId}/
└── automations/{automationId}
    ├── id: string
    ├── name: string
    ├── enabled: boolean
    ├── trigger: { type, config }
    ├── action: { type, config }
    ├── stats: { timesTriggered, lastTriggered }
    ├── createdBy: string
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

---

## Testing Strategy

### Phase 1 Tests

```typescript
// __tests__/lib/ai-intent-parser.test.ts
describe('parseIntent', () => {
  it('detects poll intent', async () => {
    const result = await parseIntent("Let's vote on lunch options");
    expect(result.type).toBe('poll');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('ignores regular messages', async () => {
    const result = await parseIntent("How is everyone doing?");
    expect(result.type).toBe('none');
  });

  it('extracts poll options', async () => {
    const result = await parseIntent("Poll: Pizza or Sushi?");
    expect(result.params.options).toContain('Pizza');
    expect(result.params.options).toContain('Sushi');
  });
});

// __tests__/lib/slash-command-parser.test.ts
describe('parseSlashCommand', () => {
  it('parses poll command', () => {
    const result = parseSlashCommand('/poll "Best day?" Mon Tue Wed');
    expect(result?.command).toBe('poll');
    expect(result?.args[0]).toBe('Best day?');
    expect(result?.args[1]).toBe('Mon Tue Wed');
  });

  it('parses flags', () => {
    const result = parseSlashCommand('/rsvp "Event" --limit=20');
    expect(result?.flags.limit).toBe('20');
  });
});
```

---

## Migration Notes

### HiveLab Standalone App

The `apps/hivelab` app (port 3002) remains functional but becomes secondary:

1. **Access Path Changes:**
   - Old: Main nav → HiveLab
   - New: Space settings → Advanced tools → Open HiveLab

2. **Cross-Origin Considerations:**
   - HiveLab uses same API endpoints as web app
   - Authentication shared via cookies
   - No code changes needed

3. **URL Structure:**
   - Keep: `lab.hive.app/[toolId]` for direct links
   - Add: `hive.app/spaces/[spaceId]/settings/tools` as new entry point

### Inline Component Schema

Add tracking fields to existing InlineComponent:

```typescript
// Migration: Add to inline_components documents
{
  // ... existing fields
  creationSource: 'chat_intent' | 'slash_command' | 'canvas' | 'automation',
  creationPrompt?: string,  // Original NL if from intent
  createdVia: 'web' | 'mobile' | 'api',
}
```

---

*Last Updated: December 2024*
