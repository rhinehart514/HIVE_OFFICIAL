# HiveLab Winter 2025 Strategy

## Strategic Pivot: From Tool Builder to AI Assistant

**Date:** December 2024
**Status:** Active Strategy
**Focus:** Winter 2025 (January - March)

---

## Executive Summary

HiveLab is pivoting from a "visual tool builder" to an **AI Assistant for Campus Leaders**. Instead of teaching leaders to drag-and-drop elements onto a canvas, we meet them where they are: **chat**.

> "I want to run a poll for our next meeting location"
>
> **Old HiveLab:** Navigate to HiveLab → Open canvas → Drag poll element → Configure options → Deploy to space
>
> **New HiveLab:** Type in chat → AI creates poll → Done in 10 seconds

The canvas IDE isn't going away—it becomes the power-user escape hatch for the 1% who want full control. But 99% of leader interactions happen through natural language.

---

## The Problem with "Tool Builder"

### What We Built
- Visual canvas with drag-and-drop
- 27 elements across 3 tiers (Universal, Connected, Space)
- Full deployment system to spaces
- Runtime engine with state persistence
- AI generation from prompts

### Why It's Not Working

1. **Cognitive Overhead**: Leaders don't want to "build tools." They want outcomes.
2. **Discovery Friction**: HiveLab is buried behind access gates and navigation
3. **Builder Anxiety**: Canvas IDEs intimidate non-technical users
4. **Misaligned Mental Model**: Users think "I need a poll" not "I need to compose a tool with a poll element"

### Market Reality

Every startup is becoming AI-native. The successful ones aren't adding AI features—they're rebuilding around AI as the primary interaction model. Notion AI, Figma AI, Linear's AI features all prove: **chat-first interfaces win for routine tasks**.

---

## The New Model: Three Modes

```
┌─────────────────────────────────────────────────────────────────┐
│                        HIVELAB v2                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   MODE 1: CHAT ASSISTANT (90% of interactions)                   │
│   ────────────────────────────────────────────                   │
│   Natural language in space chat                                 │
│   "Create a poll for next meeting time"                          │
│   "Set up RSVP for Friday's event"                               │
│   "Show me who's most active this week"                          │
│                                                                  │
│   → Inline components appear in chat                             │
│   → No navigation, no context switch                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   MODE 2: QUICK ACTIONS (9% of interactions)                     │
│   ───────────────────────────────────────────                    │
│   Slash commands for power users                                 │
│   /poll "Meeting time?" Mon Tue Wed                              │
│   /countdown "Application deadline" 2024-01-15                   │
│   /rsvp "Study session" --limit 20                               │
│                                                                  │
│   → Faster than natural language                                 │
│   → Predictable output                                           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   MODE 3: CANVAS IDE (1% of interactions)                        │
│   ────────────────────────────────────────                       │
│   Full visual builder                                            │
│   Multi-element compositions                                     │
│   Custom data connections                                        │
│   Advanced automations                                           │
│                                                                  │
│   → Power users only                                             │
│   → Complex compositions                                         │
│   → Reusable templates                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Architecture

### How HiveLab Powers HIVE

HiveLab isn't a separate app—it's the **capability engine** that powers interactive features throughout HIVE.

```
┌─────────────────────────────────────────────────────────────────┐
│                         HIVE PLATFORM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │   SPACES    │    │    CHAT     │    │    FEED     │         │
│   │             │    │             │    │             │         │
│   │  Sidebar    │    │   Inline    │    │  Activity   │         │
│   │  Tools      │    │ Components  │    │  Cards      │         │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│          │                  │                  │                 │
│          └──────────────────┼──────────────────┘                 │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │    HIVELAB      │                           │
│                    │  CAPABILITY     │                           │
│                    │    ENGINE       │                           │
│                    │                 │                           │
│                    │ - Elements      │                           │
│                    │ - Runtime       │                           │
│                    │ - State         │                           │
│                    │ - AI Gen        │                           │
│                    └─────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Existing Integration Points (Already Built)

#### 1. Space Sidebar Integration
**Location:** `packages/core/src/domain/spaces/entities/placed-tool.ts`

```typescript
// PlacedTool entity - already exists
interface PlacedTool {
  id: string;
  spaceId: string;
  toolId: string;
  placementType: 'sidebar' | 'inline' | 'modal' | 'tab';
  position: number;
  config: Record<string, unknown>;
  source: 'system' | 'leader' | 'member';
}
```

**UI Component:** `packages/ui/src/atomic/03-Spaces/organisms/space-sidebar-configurable.tsx`
- Renders PlacedTools in space sidebar
- Supports drag-to-reorder
- Leader-only configuration

#### 2. Chat Inline Components
**Location:** `packages/core/src/domain/spaces/entities/inline-component.ts`

```typescript
// InlineComponent - already exists
interface InlineComponent {
  id: string;
  messageId: string;
  spaceId: string;
  componentType: 'poll' | 'countdown' | 'rsvp' | 'custom';
  config: Record<string, unknown>;
  sharedState: Record<string, unknown>;  // Aggregated (vote counts)
  // participants subcollection for individual votes
}
```

**Factory Methods (Already Built):**
- `InlineComponent.createPoll()`
- `InlineComponent.createCountdown()`
- `InlineComponent.createRsvp()`
- `InlineComponent.createCustom()`

**Renderer:** `packages/ui/src/components/hivelab/inline-element-renderer.tsx`

#### 3. Tool Runtime System
**Location:** `apps/web/src/hooks/use-tool-runtime.ts` (596 lines)

```typescript
// useToolRuntime - already exists
const {
  tool,           // Tool definition
  state,          // Current state
  isLoading,
  executeAction,  // Trigger element actions
  updateState,    // Manual state update
} = useToolRuntime(toolId, { autoSave: true });
```

**Features Already Built:**
- SSE real-time state sync
- Optimistic updates with rollback
- Auto-save with 2s debounce
- Action execution with server validation
- Retry logic for failures

#### 4. Deployment Flow
**API:** `apps/web/src/app/api/tools/deploy/route.ts`

```typescript
// Deployment creates:
// 1. DeploymentRecord (tool_deployments collection)
// 2. PlacedTool (spaces/{spaceId}/placed_tools)
```

**Deployment Targets:**
- Space sidebar (persistent)
- Inline in chat (ephemeral)
- Profile widgets (personal)
- Standalone pages (shareable)

#### 5. Element System
**Location:** `packages/ui/src/lib/hivelab/element-system.ts` (945 lines)

**27 Elements Across 3 Tiers:**

| Tier | Elements | Use Case |
|------|----------|----------|
| Universal (14) | poll, timer, countdown, form-builder, chart-display, counter, leaderboard, search-input, filter-selector, result-list, date-picker, tag-cloud, map-view, notification-center | Any context |
| Connected (5) | event-picker, space-picker, user-selector, rsvp-button, connection-list | Needs data source |
| Space (7) | member-list, member-selector, space-events, space-feed, space-stats, announcement, role-gate | Space context only |

#### 6. AI Generation
**Location:** `packages/core/src/application/hivelab/ai-tool-generator.service.ts`

```typescript
// Uses Gemini 2.0 Flash via Firebase AI
async generateTool(prompt: string): Promise<ToolComposition>
```

**Current Flow:**
1. User describes what they want
2. AI generates tool composition JSON
3. Composition rendered on canvas
4. User can refine and deploy

---

## The Seven Capabilities (Evolved from PRD V2)

The PRD V2 defined "7 Pillars" for Space Builder. We're keeping them but reframing as **AI capabilities** that leaders can invoke through natural language:

### 1. Content Capability
**What Leaders Say:** "Post an announcement" / "Pin this message" / "Create a welcome post"

**Backend:** Uses existing announcement element + SpaceChatService

### 2. Tools Capability
**What Leaders Say:** "Create a poll" / "Set up RSVP" / "Add a countdown"

**Backend:** InlineComponent factory methods + element renderers

### 3. Automations Capability
**What Leaders Say:** "Welcome new members automatically" / "Remind about events"

**Backend:** Event triggers + automated workflows (partially built)

### 4. Structure Capability
**What Leaders Say:** "Create a new channel for events" / "Organize our sidebar"

**Backend:** Board entity + PlacedTool positioning

### 5. Rules Capability
**What Leaders Say:** "Only admins can post announcements" / "Limit who can use polls"

**Backend:** Role-gate element + permission system

### 6. Integrations Capability (Future)
**What Leaders Say:** "Connect our Google Calendar" / "Sync with GroupMe"

**Backend:** Integration framework (not yet built)

### 7. Commerce Capability (Future)
**What Leaders Say:** "Sell tickets" / "Collect dues"

**Backend:** Payment integration (not yet built)

---

## Winter 2025 Phased Roadmap

### Phase 1: Chat-First Foundation (Weeks 1-3)

**Goal:** Leaders can create polls, RSVPs, and countdowns from natural language in chat.

**What to Build:**

1. **AI Intent Parser**
   - Detect when message is a command vs conversation
   - Extract intent: poll, rsvp, countdown, announcement
   - Extract parameters: options, dates, limits

   ```typescript
   // New: apps/web/src/lib/ai-intent-parser.ts
   interface ParsedIntent {
     type: 'poll' | 'rsvp' | 'countdown' | 'announcement' | 'none';
     confidence: number;
     params: Record<string, unknown>;
   }

   async function parseIntent(message: string): Promise<ParsedIntent>
   ```

2. **Leader Chat Integration**
   - Modify `SpaceChatService.sendMessage()` to check for leader intents
   - If intent detected, create InlineComponent instead of regular message

   ```typescript
   // Modify: packages/core/src/application/spaces/space-chat.service.ts
   async sendMessage(params) {
     if (isLeader && hasAIIntent(params.content)) {
       const intent = await parseIntent(params.content);
       if (intent.type !== 'none') {
         return this.createInlineComponent(intent, params);
       }
     }
     // Regular message flow
   }
   ```

3. **Improved Inline Renderers**
   - Polish poll, countdown, RSVP renderers
   - Add creation confirmation toast
   - Real-time vote/RSVP updates

   ```
   Files to modify:
   - packages/ui/src/components/hivelab/inline-element-renderer.tsx
   - packages/ui/src/atomic/03-Spaces/molecules/chat-inline-poll.tsx
   - packages/ui/src/atomic/03-Spaces/molecules/chat-inline-rsvp.tsx
   ```

**What Already Exists:**
- InlineComponent entity with factory methods
- Basic inline renderers
- SpaceChatService with real-time updates
- Element system with poll, countdown, rsvp configs

**Success Metric:** 50% of polls created via chat (vs. navigating to HiveLab)

---

### Phase 2: Quick Actions (Weeks 4-5)

**Goal:** Power users can use slash commands for faster creation.

**What to Build:**

1. **Slash Command Parser**
   ```typescript
   // New: apps/web/src/lib/slash-command-parser.ts

   // /poll "Question?" Option1 Option2 Option3
   // /countdown "Event name" 2024-01-15T18:00
   // /rsvp "Event" --limit 50 --deadline 2024-01-10

   interface SlashCommand {
     command: 'poll' | 'countdown' | 'rsvp' | 'announce';
     args: string[];
     flags: Record<string, string | boolean>;
   }
   ```

2. **Command Autocomplete**
   - Show suggestions as leader types `/`
   - Preview what will be created
   - Tab to complete

   ```
   Files to modify:
   - packages/ui/src/atomic/03-Spaces/organisms/space-chat-input.tsx
   ```

3. **Command Documentation**
   - `/help` shows available commands
   - Inline hints for syntax

**What Already Exists:**
- Chat input component
- Real-time message processing
- InlineComponent creation flow

**Success Metric:** Power users create components 3x faster than natural language

---

### Phase 3: Automations MVP (Weeks 6-8)

**Goal:** Leaders can set up simple automations without touching code.

**What to Build:**

1. **Trigger System**
   ```typescript
   // New: packages/core/src/domain/hivelab/entities/automation.ts
   interface Automation {
     id: string;
     spaceId: string;
     trigger: AutomationTrigger;
     action: AutomationAction;
     enabled: boolean;
   }

   type AutomationTrigger =
     | { type: 'member_join' }
     | { type: 'event_reminder'; beforeMinutes: number }
     | { type: 'schedule'; cron: string };

   type AutomationAction =
     | { type: 'send_message'; content: string }
     | { type: 'create_poll'; config: PollConfig }
     | { type: 'assign_role'; roleId: string };
   ```

2. **Automation Chat Commands**
   ```
   "Set up automatic welcome messages"
   → AI configures member_join trigger + send_message action

   "Remind members about events 1 hour before"
   → AI configures event_reminder trigger
   ```

3. **Automation Dashboard**
   - View active automations
   - Enable/disable toggle
   - Edit triggers and actions

   ```
   Files to create:
   - apps/web/src/app/spaces/[spaceId]/automations/page.tsx
   ```

**What Already Exists:**
- Event system infrastructure (partially)
- Automated moderation workflows (packages/core)
- Firestore triggers capability

**Success Metric:** 30% of active spaces have at least 1 automation

---

### Phase 4: Canvas Polish (Weeks 9-10)

**Goal:** Canvas IDE becomes the power-user escape hatch, not the default.

**What to Change:**

1. **Entry Point Shift**
   - Remove HiveLab from main nav
   - Access via "Advanced" in space settings
   - Or: "Want more control? Open canvas →"

2. **Canvas Improvements**
   - Template gallery as starting point
   - Better AI refinement ("make the poll anonymous")
   - One-click deployment

3. **Template System**
   - Pre-built compositions for common needs
   - "Event management kit" (RSVP + countdown + announcement)
   - "Election kit" (poll + timer + results)

**What Already Exists:**
- Full canvas IDE (apps/hivelab)
- Drag-and-drop system
- AI generation
- Deployment flow

**Success Metric:** Canvas users have 2x satisfaction (they chose to be there)

---

## Technical Implementation Details

### New Files to Create

```
apps/web/src/
├── lib/
│   ├── ai-intent-parser.ts          # NL intent detection
│   ├── slash-command-parser.ts      # Slash command parsing
│   └── automation-engine.ts         # Automation execution
├── app/
│   └── spaces/[spaceId]/
│       └── automations/
│           └── page.tsx             # Automation dashboard

packages/core/src/
├── domain/hivelab/
│   └── entities/
│       └── automation.ts            # Automation entity
└── application/hivelab/
    ├── automation.service.ts        # Automation CRUD
    └── intent-parser.service.ts     # Server-side intent parsing
```

### Files to Modify

```
packages/core/src/application/spaces/space-chat.service.ts
  - Add intent detection in sendMessage()
  - Route to InlineComponent creation for leader intents

packages/ui/src/atomic/03-Spaces/organisms/space-chat-input.tsx
  - Add slash command autocomplete
  - Add command preview

packages/ui/src/components/hivelab/inline-element-renderer.tsx
  - Polish existing renderers
  - Add loading states
  - Improve real-time updates

apps/web/src/app/tools/page.tsx
  - Simplify to "Advanced Tools" section
  - Add link to automations dashboard
```

### API Endpoints to Add

```
POST /api/spaces/[spaceId]/chat/intent
  - Parse natural language intent
  - Return structured intent or null

POST /api/spaces/[spaceId]/automations
  - Create automation
  - Validate trigger/action combination

GET /api/spaces/[spaceId]/automations
  - List automations for space

PATCH /api/spaces/[spaceId]/automations/[automationId]
  - Update automation (enable/disable, modify)

DELETE /api/spaces/[spaceId]/automations/[automationId]
  - Remove automation
```

---

## What to Keep, Evolve, Deprecate

### Keep (Core Infrastructure)

| Component | Location | Reason |
|-----------|----------|--------|
| Element System | `packages/ui/src/lib/hivelab/element-system.ts` | Foundation for all components |
| InlineComponent Entity | `packages/core/src/domain/spaces/entities/inline-component.ts` | Powers chat components |
| PlacedTool Entity | `packages/core/src/domain/spaces/entities/placed-tool.ts` | Powers sidebar tools |
| useToolRuntime Hook | `apps/web/src/hooks/use-tool-runtime.ts` | State management |
| Element Renderers | `packages/ui/src/components/hivelab/element-renderers.tsx` | Component rendering |
| AI Generation | `packages/core/src/application/hivelab/ai-tool-generator.service.ts` | Natural language to composition |

### Evolve (Shift Usage)

| Component | Current State | Evolution |
|-----------|---------------|-----------|
| Canvas IDE | Primary interface | Power-user escape hatch |
| /tools page | Main entry point | "Advanced Tools" section |
| HiveLab standalone app | Separate app (port 3002) | Embedded in space settings |
| Tool creation flow | Canvas-first | Chat-first with canvas fallback |
| Deployment modal | Manual configuration | AI-suggested optimal placement |

### Deprecate (Phase Out)

| Component | Reason | Timeline |
|-----------|--------|----------|
| Complex multi-element compositions | Low usage, high maintenance | Phase 4 |
| Marketplace browse | No user demand yet | Post-Winter |
| Tool analytics page | Premature optimization | Revisit when needed |
| Standalone HiveLab marketing | Confuses positioning | Immediate |

---

## Success Metrics

### Primary KPIs

| Metric | Current | Winter Target |
|--------|---------|---------------|
| Inline components created per week | ~10 | 100+ |
| % of components via chat (vs canvas) | 0% | 50% |
| Time to create poll | 2+ minutes | <30 seconds |
| Leaders using tools weekly | ~5% | 25% |
| Spaces with active automations | 0 | 30% |

### Leading Indicators

- Intent parser accuracy (>90% correct interpretation)
- Slash command usage rate
- Canvas access rate (should decrease)
- Automation completion rate (setup started → active)

---

## Risks and Mitigations

### Risk 1: AI Misinterpretation
**Risk:** AI creates wrong component from natural language
**Mitigation:**
- Confirmation step before creation
- Easy undo ("That's not what I wanted")
- Fallback to explicit slash commands

### Risk 2: Power User Abandonment
**Risk:** Existing canvas users feel abandoned
**Mitigation:**
- Canvas remains fully functional
- Migration guide for complex tools
- "Advanced mode" positioning (they're special, not forgotten)

### Risk 3: Feature Creep in Automations
**Risk:** Automations become too complex
**Mitigation:**
- Strict initial scope (3 triggers, 3 actions)
- "Pro" tier for complex automations
- Template-based setup, not custom building

### Risk 4: Performance with Real-Time Components
**Risk:** Many inline components slow down chat
**Mitigation:**
- Lazy loading for off-screen components
- Aggregated state (vote counts, not individual votes in main doc)
- Pagination for older messages with components

---

## Appendix: Firestore Schema Updates

### Automations Collection

```typescript
// Collection: spaces/{spaceId}/automations/{automationId}
interface AutomationDocument {
  id: string;
  spaceId: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  name: string;
  description?: string;
  enabled: boolean;

  trigger: {
    type: 'member_join' | 'event_reminder' | 'schedule' | 'keyword';
    config: Record<string, unknown>;
  };

  action: {
    type: 'send_message' | 'create_component' | 'assign_role' | 'notify';
    config: Record<string, unknown>;
  };

  stats: {
    timesTriggered: number;
    lastTriggered?: Timestamp;
  };
}
```

### Inline Components Enhancement

```typescript
// Existing: spaces/{spaceId}/messages/{messageId}/inline_components/{componentId}
// Add: creation source tracking
interface InlineComponentDocument {
  // ... existing fields

  creationSource: 'chat_intent' | 'slash_command' | 'canvas' | 'automation';
  creationPrompt?: string;  // Original natural language if from intent
}
```

---

## Conclusion

HiveLab's identity shifts from "where leaders build tools" to "how leaders get things done." The infrastructure we've built—elements, runtime, deployment—becomes invisible plumbing that powers a magical experience.

Leaders don't need to know about HiveLab. They just know that when they say "create a poll," a poll appears. When they want automatic welcome messages, they describe it and it happens.

The canvas IDE remains for the 1% who want ultimate control. But for the 99%, HIVE just works.

**The measure of HiveLab's success is how little users think about HiveLab.**

---

*Last Updated: December 2024*
*Status: Active Strategy Document*
*Owner: HIVE Product Team*
