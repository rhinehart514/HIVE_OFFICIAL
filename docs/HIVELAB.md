# HiveLab: AI-Powered Visual Tool Builder

> "Cursor for Visual Tools" - Natural language to interactive campus experiences

## Executive Summary

HiveLab enables anyone to create interactive tools through conversation. Speak what you want, AI generates it, deploy to your space instantly. No code required, unlimited possibilities.

**The Magic Moment**: "Create a poll for our club meeting" → Working poll in 3 seconds.

---

## User Control Model

The critical question: **What does the user control vs what does AI handle?**

### Control Spectrum

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTROL SPECTRUM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AI CONTROLS                    SHARED                    USER CONTROLS     │
│  (Invisible)                    (Guided)                  (Explicit)        │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • Element selection            • Element config          • Tool name       │
│  • Initial layout               • Colors/theme            • Where to deploy │
│  • Connection wiring            • Option text             • Who can access  │
│  • Config defaults              • Size/position           • When to launch  │
│  • Responsive behavior          • Ordering                • Delete/archive  │
│                                                                              │
│  "I'll figure out              "Let me suggest,          "This is your     │
│   what you need"                you can adjust"           decision"         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What AI Handles (User Never Sees)

| Responsibility | AI Behavior | User Sees |
|----------------|-------------|-----------|
| **Element Selection** | Picks best element for intent | "Poll" not "poll-element" |
| **Layout Algorithm** | Grid vs stack vs flow | Elements just appear nicely |
| **Connection Wiring** | Links data between elements | Things "just work" together |
| **Config Defaults** | Sets sensible starting values | Pre-filled options |
| **Responsive Rules** | Mobile vs desktop layout | It just looks right |
| **Accessibility** | ARIA labels, keyboard nav | Built-in, invisible |

### What User Controls (Explicit Decisions)

| Decision | When Asked | Why User Decides |
|----------|------------|------------------|
| **Tool Name** | After generation | Identity, findability |
| **Deploy Target** | Deploy flow | Space leaders need control |
| **Permissions** | Deploy flow | Security/access |
| **Content** | IDE or inline | Poll questions, event names |
| **Publish/Draft** | Save | Timing control |
| **Delete** | Explicit action | Destructive, irreversible |

### Shared Control (AI Suggests, User Adjusts)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SHARED CONTROL INTERFACE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ELEMENT CONFIG (Properties Panel)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Poll Options                                                        │    │
│  │ ┌───────────────────────────────────────────────────────────────┐  │    │
│  │ │ Pizza           [AI suggested, user can edit]                 │  │    │
│  │ │ Sushi           [AI suggested, user can edit]                 │  │    │
│  │ │ Tacos           [AI suggested, user can edit]                 │  │    │
│  │ │ + Add option    [User can extend]                             │  │    │
│  │ └───────────────────────────────────────────────────────────────┘  │    │
│  │                                                                     │    │
│  │ Show Results Before Voting  [○ On  ● Off]  ← AI chose Off          │    │
│  │ Allow Vote Change           [● On  ○ Off]  ← AI chose On           │    │
│  │ Anonymous Voting            [○ On  ● Off]  ← User decision         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  POSITION & SIZE (Canvas)                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ AI places elements in sensible grid                                 │    │
│  │ User can drag to reposition                                         │    │
│  │ User can resize handles                                             │    │
│  │ Smart guides help alignment                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ITERATION (Cmd+K)                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ "Make this poll anonymous"                                          │    │
│  │ → AI modifies config, preserves everything else                    │    │
│  │                                                                     │    │
│  │ "Add a countdown timer for Friday 5pm"                             │    │
│  │ → AI adds element, connects deadline to poll                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Control Principles

1. **AI Never Decides Identity** - Name, deploy target, permissions are always user choices
2. **AI Always Suggests Content** - But with clear edit affordances
3. **Undo is Sacred** - User can always revert AI decisions
4. **Selection = Context** - Selected elements inform AI suggestions
5. **Progressive Disclosure** - Advanced options exist but don't clutter

---

## Spaces vs HiveLab Relationship

### The Two Contexts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SPACES vs HIVELAB                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  HIVELAB (Creation Context)              SPACES (Usage Context)             │
│  ═══════════════════════════             ══════════════════════             │
│                                                                              │
│  WHO: Tool creators (leaders)            WHO: All space members             │
│  WHAT: Build, iterate, configure         WHAT: Interact, vote, RSVP         │
│  WHEN: Before deployment                 WHEN: After deployment             │
│  WHERE: /lab, /tools/create              WHERE: /spaces/[id]                │
│                                                                              │
│  ┌─────────────────────┐                 ┌─────────────────────┐            │
│  │                     │                 │                     │            │
│  │   CANVAS IDE        │    DEPLOY →     │   SPACE SIDEBAR     │            │
│  │   Edit elements     │                 │   Use tools         │            │
│  │   Configure         │                 │   See live state    │            │
│  │   Preview           │                 │   Real-time sync    │            │
│  │                     │                 │                     │            │
│  └─────────────────────┘                 └─────────────────────┘            │
│                                                                              │
│  RENDERS: ToolCanvas (edit mode)         RENDERS: ToolCanvas (run mode)     │
│  STATE: Draft, local                     STATE: Live, Firestore             │
│  ACTIONS: Save, Preview                  ACTIONS: Vote, RSVP, Submit        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CREATION (HiveLab)                                                       │
│     User: "Create a poll for lunch"                                         │
│     ↓                                                                        │
│     AI generates → tools/{toolId}                                           │
│     User edits in Canvas IDE                                                │
│     User saves → tools/{toolId} updated                                     │
│                                                                              │
│  2. DEPLOYMENT (HiveLab → Spaces)                                           │
│     User clicks "Deploy to Space"                                           │
│     ↓                                                                        │
│     Creates: tool_deployments/{deploymentId}                                │
│     Creates: spaces/{spaceId}/placed_tools/{placementId}                    │
│     Creates: tool_state/{deploymentId} (empty initial state)                │
│                                                                              │
│  3. USAGE (Spaces)                                                           │
│     Member opens space                                                       │
│     ↓                                                                        │
│     Reads: spaces/{spaceId}/placed_tools/* → finds toolId                   │
│     Reads: tools/{toolId} → gets element definitions                        │
│     Reads: tool_state/{deploymentId} → gets current state                   │
│     Subscribes: SSE for real-time updates                                   │
│                                                                              │
│  4. INTERACTION (Spaces)                                                     │
│     Member votes in poll                                                     │
│     ↓                                                                        │
│     POST: /api/tools/execute                                                 │
│     Updates: tool_state/{deploymentId}                                      │
│     Broadcasts: SSE to all connected clients                                │
│     Optional: Creates feed post                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Reuse

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SHARED vs CONTEXT-SPECIFIC                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SHARED COMPONENTS (packages/ui)                                             │
│  ════════════════════════════════                                           │
│  • element-renderers.tsx     → Same rendering in both contexts              │
│  • tool-canvas.tsx           → Same layout engine                           │
│  • Motion primitives         → Same animations                              │
│                                                                              │
│  HIVELAB-ONLY (packages/ui/components/hivelab/ide/)                         │
│  ═══════════════════════════════════════════════════                        │
│  • hivelab-ide.tsx           → Full IDE container                           │
│  • ide-canvas.tsx            → Pan/zoom/select canvas                       │
│  • ide-toolbar.tsx           → Save/preview/mode buttons                    │
│  • element-palette.tsx       → Draggable element library                    │
│  • layers-panel.tsx          → Z-order management                           │
│  • properties-panel.tsx      → Element configuration                        │
│  • ai-command-palette.tsx    → Cmd+K interface                              │
│  • smart-guides.tsx          → Alignment helpers                            │
│                                                                              │
│  SPACES-ONLY (apps/web/src/app/spaces/)                                     │
│  ═══════════════════════════════════════                                    │
│  • Tool widget in sidebar    → Read-only positioning                        │
│  • Inline tools in chat      → Embedded in message flow                     │
│  • Tool discovery            → Browse deployed tools                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Surface Types in Spaces

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TOOL SURFACES IN SPACES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SIDEBAR (40% of space layout)                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Tools appear as cards in sidebar                                      │  │
│  │ Persistent, always visible                                            │  │
│  │ Full interactivity (vote, RSVP, etc.)                                │  │
│  │ Leaders can reorder                                                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  CHAT INLINE (future)                                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Tool appears embedded in chat message                                 │  │
│  │ Context: "Let's vote: [inline poll]"                                 │  │
│  │ Same interactivity, different layout                                  │  │
│  │ Messages reference deploymentId                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  FEED POST (future)                                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Tool appears as rich feed card                                        │  │
│  │ Social proof: "42 people voted"                                      │  │
│  │ One-tap interaction from feed                                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  FULLSCREEN (linked)                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ /tools/{toolId}/run?spaceId=X&deploymentId=Y                         │  │
│  │ Dedicated page for complex tools                                      │  │
│  │ Debug panel in dev mode                                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HIVELAB STACK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   AI GENERATION  │───▶│   CANVAS IDE     │───▶│    DEPLOYMENT    │       │
│  │   Gemini 2.0     │    │   Figma-like     │    │   Space/Profile  │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│           │                       │                       │                  │
│           ▼                       ▼                       ▼                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  ELEMENT SYSTEM  │◀──▶│  STATE RUNTIME   │◀──▶│  ACTION HANDLERS │       │
│  │  27 Components   │    │  SSE Real-time   │    │  Server Logic    │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. AI Generation Layer

### Technology Stack
- **Model**: Gemini 2.0 Flash via Firebase AI
- **Fallback**: Mock generator for offline/testing
- **Output**: Structured JSON tool compositions

### Key Files
```
apps/web/src/lib/firebase-ai-generator.ts   # Gemini integration
apps/web/src/lib/mock-ai-generator.ts       # Fallback generator
apps/web/src/app/api/tools/generate/route.ts # Generation endpoint
packages/firebase/src/index.ts               # Firebase AI init
```

### How It Works

```typescript
// User prompt
"Create a poll for lunch options"

// AI receives context-aware prompt including:
// - Available element library (27 elements)
// - Element config schemas
// - Connection patterns
// - Space context (if deploying to space)

// AI outputs structured composition:
{
  name: "Lunch Poll",
  description: "Vote on lunch options",
  elements: [
    {
      elementId: "poll-element",
      instanceId: "poll-lunch",
      config: {
        question: "Where should we eat?",
        options: ["Pizza", "Sushi", "Tacos", "Salad"],
        showResults: true,
        allowChangeVote: true
      },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 1 }
    }
  ],
  connections: [],
  layout: "stack"
}
```

### Context-Aware Generation

The AI adapts based on deployment context:

| Context | AI Behavior |
|---------|-------------|
| Personal tool | Universal elements only |
| Space tool | Includes space-tier elements (member lists, announcements) |
| Leader creating | Unlocks admin elements (role gates, moderation) |
| Iteration mode | Modifies existing composition, preserves connections |

### Prompt Engineering

```typescript
// Element library documentation fed to AI
const ELEMENT_PROMPTS = `
Available elements:
- poll-element: Voting/polls. Config: { question, options[], allowChangeVote }
- rsvp-button: Event signup. Config: { eventName, maxAttendees, allowWaitlist }
- countdown-timer: Live countdown. Config: { targetDate, label }
- leaderboard: Ranked standings. Config: { maxEntries, scoreLabel }
- form-builder: Dynamic forms. Config: { fields[], validateOnChange }
...

Composition patterns:
- Events: countdown-timer + rsvp-button + form-builder
- Competitions: poll-element + leaderboard + countdown-timer
- Feedback: form-builder + result-list + chart-display
`;
```

---

## 2. Canvas IDE Layer

### Technology Stack
- **Framework**: React 19 + Framer Motion
- **Patterns**: Figma-inspired canvas with VS Code command palette
- **Features**: Pan/zoom, smart guides, layers panel, undo/redo

### Key Files
```
packages/ui/src/components/hivelab/ide/
├── hivelab-ide.tsx          # Main IDE container
├── ide-canvas.tsx           # Infinite canvas with pan/zoom
├── ide-toolbar.tsx          # Top toolbar
├── ai-command-palette.tsx   # Cmd+K AI interface
├── element-palette.tsx      # Draggable element library
├── layers-panel.tsx         # Visual hierarchy
├── properties-panel.tsx     # Element configuration
├── smart-guides.tsx         # Alignment guides
├── onboarding-overlay.tsx   # First-use tutorial
├── use-ide-keyboard.ts      # Keyboard shortcuts
└── types.ts                 # TypeScript definitions
```

### Canvas Features

#### Smart Guides (Figma-like)
```typescript
// Alignment detection
- Center-to-center (horizontal/vertical)
- Edge alignment (top/bottom/left/right)
- Adjacent snapping (element edges)
- 8px threshold for activation
- Visual feedback with gold guides
```

#### Selection-Aware AI (Cursor-like)
```typescript
// Commands change based on selection:
selectedCount === 0 → "Generate Tool", "Add Element"
selectedCount === 1 → "Modify Element", "Create Variation", "Connect To..."
selectedCount > 1  → "Modify All Selected", "Group Elements", "Align"
```

#### Keyboard Shortcuts
```
Cmd/Ctrl + K     → AI Command Palette
Cmd/Ctrl + Z     → Undo
Cmd/Ctrl + Shift + Z → Redo
Cmd/Ctrl + S     → Save
Delete/Backspace → Delete selected
Cmd/Ctrl + D     → Duplicate
Cmd/Ctrl + G     → Group
```

---

## 3. Element System

### Tiered Access Model

```
┌─────────────────────────────────────────────────────────────┐
│                     ELEMENT TIERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  UNIVERSAL (Anyone)                                          │
│  ├── poll-element        Vote on anything                   │
│  ├── countdown-timer     Event deadlines                    │
│  ├── timer               Stopwatch functionality            │
│  ├── counter             Increment/decrement                │
│  ├── form-builder        Collect responses                  │
│  ├── leaderboard         Ranked standings                   │
│  ├── search-input        Filter content                     │
│  ├── filter-selector     Multi-select filters               │
│  ├── result-list         Display results                    │
│  ├── date-picker         Date/time selection                │
│  ├── tag-cloud           Visual tags                        │
│  ├── chart-display       Data visualization                 │
│  └── notification-center Real-time alerts                   │
│                                                              │
│  CONNECTED (Authenticated)                                   │
│  ├── user-selector       Pick campus users                  │
│  ├── event-picker        Browse events                      │
│  ├── space-picker        Browse spaces                      │
│  ├── rsvp-button         Event signup with capacity         │
│  └── connection-list     Show user connections              │
│                                                              │
│  SPACE (Leaders Only)                                        │
│  ├── member-list         Space member directory             │
│  ├── member-selector     Select members for actions         │
│  ├── space-events        Space event calendar               │
│  ├── space-feed          Space post stream                  │
│  ├── space-stats         Analytics dashboard                │
│  ├── announcement        Broadcast to members               │
│  └── role-gate           Conditional content by role        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Files
```
packages/ui/src/components/hivelab/element-renderers.tsx  # All 27 elements
packages/ui/src/lib/hivelab/element-system.ts            # Element registry
packages/core/src/domain/hivelab/element-registry.ts     # Core definitions
```

### Element Props Interface
```typescript
interface ElementProps {
  id: string;                           // Instance ID
  config: Record<string, unknown>;      // Element configuration
  data?: unknown;                       // Server state (hydration)
  context?: {                           // Runtime context
    spaceId?: string;
    userId?: string;
    userRole?: string;
  };
  onChange?: (data: unknown) => void;   // Local state updates
  onAction?: (action: string, payload: unknown) => void;  // Server actions
}
```

---

## 4. State Runtime Layer

### Technology Stack
- **Local State**: React useState + refs
- **Sync**: Auto-save with debouncing
- **Real-time**: SSE (Server-Sent Events)
- **Persistence**: Firestore

### Key Files
```
apps/web/src/hooks/use-tool-runtime.ts         # Main runtime hook
apps/web/src/app/api/tools/state/[deploymentId]/route.ts  # State API
apps/web/src/app/api/realtime/tool-updates/route.ts       # SSE endpoint
apps/web/src/lib/sse-realtime-service.ts       # SSE service
```

### Runtime Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE FLOW                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Interaction                                            │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────┐                                            │
│  │ onAction()  │ ─── Optimistic UI Update                   │
│  └─────────────┘                                            │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────┐     ┌─────────────┐                        │
│  │executeAction│────▶│ /api/tools  │                        │
│  │   (hook)    │     │  /execute   │                        │
│  └─────────────┘     └─────────────┘                        │
│                            │                                 │
│                            ▼                                 │
│                      ┌─────────────┐                        │
│                      │  Action     │                        │
│                      │  Handler    │                        │
│                      └─────────────┘                        │
│                            │                                 │
│              ┌─────────────┼─────────────┐                  │
│              ▼             ▼             ▼                  │
│        ┌─────────┐   ┌─────────┐   ┌─────────┐             │
│        │Firestore│   │  SSE    │   │  Feed   │             │
│        │  State  │   │Broadcast│   │  Post   │             │
│        └─────────┘   └─────────┘   └─────────┘             │
│                            │                                 │
│                            ▼                                 │
│                      Other Users                             │
│                      See Update                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### useToolRuntime Hook

```typescript
const {
  // Data
  tool,           // Tool definition
  deployment,     // Deployment info
  state,          // Current element states

  // Loading states
  isLoading,
  isExecuting,
  isSaving,

  // Sync status
  isSynced,       // Local matches server
  lastSaved,      // Last save timestamp
  isConnected,    // SSE connection active

  // Actions
  executeAction,  // Call server handler
  updateState,    // Update local + auto-save
  saveState,      // Force save
  refresh,        // Reload all data
} = useToolRuntime({
  toolId: 'abc123',
  spaceId: 'space-xyz',
  deploymentId: 'deploy-456',
  autoSave: true,
  autoSaveDelay: 1500
});
```

---

## 5. Action Handler Layer

### Technology Stack
- **Pattern**: Extensible handler registry
- **Execution**: Server-side with Firestore transactions
- **Side Effects**: Feed posts, notifications, analytics

### Key Files
```
apps/web/src/lib/tool-action-handlers.ts       # Handler implementations
apps/web/src/app/api/tools/execute/route.ts    # Execution endpoint
```

### Registered Handlers

```typescript
// Handler registry
registerElementActionHandler('poll-element', 'vote', pollSubmitHandler);
registerElementActionHandler('rsvp-button', 'rsvp', rsvpSubmitHandler);
registerElementActionHandler('rsvp-button', 'cancel_rsvp', rsvpCancelHandler);
registerElementActionHandler('timer', 'start', timerStartHandler);
registerElementActionHandler('timer', 'stop', timerStopHandler);
registerElementActionHandler('timer', 'reset', timerResetHandler);
registerElementActionHandler('counter', 'increment', counterIncrementHandler);
registerElementActionHandler('counter', 'decrement', counterDecrementHandler);
registerElementActionHandler('leaderboard', 'update_score', leaderboardUpdateHandler);
registerElementActionHandler('form-builder', 'submit', formSubmitHandler);
registerElementActionHandler('countdown-timer', 'check', countdownCheckHandler);
```

### Handler Implementation Example

```typescript
// Poll vote handler with duplicate prevention
async function pollSubmitHandler(context: ActionContext): Promise<ActionResult> {
  const { deploymentId, elementId, userId, data, stateRef } = context;
  const choice = data.choice as string;

  // Transaction for atomic updates
  await dbAdmin.runTransaction(async (tx) => {
    const stateDoc = await tx.get(stateRef);
    const currentState = stateDoc.data()?.[elementId] || { responses: {}, totalVotes: 0 };

    // Check for existing vote
    if (currentState.responses[userId]) {
      throw new Error('Already voted');
    }

    // Record vote
    currentState.responses[userId] = { choice, timestamp: new Date() };
    currentState.totalVotes = Object.keys(currentState.responses).length;

    tx.set(stateRef, { [elementId]: currentState }, { merge: true });
  });

  return {
    success: true,
    state: { userVote: choice },
    feedContent: {
      type: 'update',
      content: `voted in the poll`
    }
  };
}
```

---

## 6. Deployment Layer

### Technology Stack
- **Targets**: Spaces (subcollection) or Profiles (personal)
- **Discovery**: Browse in Tools marketplace
- **Permissions**: Role-based access

### Key Files
```
apps/web/src/lib/tool-placement.ts             # Placement logic
apps/web/src/app/api/tools/deploy/route.ts     # Deploy endpoint
apps/web/src/app/api/spaces/[spaceId]/tools/route.ts  # Space tools API
```

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CREATE TOOL                                              │
│     └── tools/{toolId}                                      │
│         ├── name, description                               │
│         ├── elements[]                                       │
│         ├── connections[]                                    │
│         └── ownerId                                          │
│                                                              │
│  2. DEPLOY TO SPACE                                          │
│     └── POST /api/tools/deploy                              │
│         ├── toolId                                           │
│         ├── targetId (spaceId)                              │
│         ├── deployedTo: 'space'                             │
│         └── surface: 'tools' | 'sidebar' | 'feed'          │
│                                                              │
│  3. CREATE DEPLOYMENT RECORD                                 │
│     └── tool_deployments/{deploymentId}                     │
│         ├── toolId                                           │
│         ├── targetId                                         │
│         ├── placementId                                      │
│         ├── status: 'active'                                │
│         └── configuration                                    │
│                                                              │
│  4. CREATE PLACEMENT IN SPACE                                │
│     └── spaces/{spaceId}/placed_tools/{placementId}         │
│         ├── toolId                                           │
│         ├── deploymentId                                     │
│         ├── surface                                          │
│         └── permissions                                      │
│                                                              │
│  5. TOOL NOW VISIBLE                                         │
│     └── GET /api/spaces/{spaceId}/tools                     │
│         └── Returns all placed_tools                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Firestore Schema

```
┌─────────────────────────────────────────────────────────────┐
│                   FIRESTORE COLLECTIONS                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  tools/{toolId}                                              │
│  ├── name: string                                            │
│  ├── description: string                                     │
│  ├── status: 'draft' | 'published' | 'archived'             │
│  ├── ownerId: string                                         │
│  ├── elements: Element[]                                     │
│  ├── connections: Connection[]                               │
│  ├── config: { layout, theme, ... }                         │
│  ├── metadata: { useCount, rating, ... }                    │
│  ├── createdAt: Timestamp                                    │
│  └── updatedAt: Timestamp                                    │
│                                                              │
│  tool_deployments/{deploymentId}                             │
│  ├── toolId: string                                          │
│  ├── deployedTo: 'space' | 'profile'                        │
│  ├── targetId: string                                        │
│  ├── placementId: string                                     │
│  ├── status: 'active' | 'paused' | 'removed'                │
│  ├── surface: 'tools' | 'sidebar' | 'feed'                  │
│  ├── permissions: { canInteract, canConfigure, ... }        │
│  └── createdAt: Timestamp                                    │
│                                                              │
│  tool_state/{deploymentId}                                   │
│  ├── state: { [elementId]: ElementState }                   │
│  └── metadata: { version, lastSaved, autoSave, size }       │
│                                                              │
│  spaces/{spaceId}/placed_tools/{placementId}                 │
│  ├── toolId: string                                          │
│  ├── deploymentId: string                                    │
│  ├── surface: string                                         │
│  ├── status: 'active'                                        │
│  ├── permissions: { canInteract }                           │
│  ├── usageCount: number                                      │
│  └── createdAt: Timestamp                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Current Status

### Completion: ~85%

| Layer | Status | Details |
|-------|--------|---------|
| AI Generation | ✅ 95% | Real Gemini 2.0 Flash, context-aware |
| Canvas IDE | ✅ 90% | Smart guides, Cmd+K, layers, undo/redo |
| Element System | ✅ 100% | 27 elements across 3 tiers |
| State Runtime | ✅ 90% | Auto-save, SSE real-time |
| Action Handlers | ✅ 100% | Poll, RSVP, timer, leaderboard, forms |
| Deployment | ✅ 95% | Space/profile placement |
| Documentation | 🔄 This doc | |

### Verified Working
- [x] AI generates valid tool compositions
- [x] Elements render with proper configs
- [x] Actions call backend handlers
- [x] State persists to Firestore
- [x] SSE broadcasts to connected clients
- [x] Optimistic UI updates

### Needs Testing
- [ ] Full E2E: generate → deploy → interact → persist
- [ ] Multi-user real-time sync
- [ ] Error recovery on failed actions
- [ ] Connection cascade (search → result-list)

---

## 9. Unlimited Technology Ceiling

### Near-Term Enhancements

#### AI Improvements
```
┌─────────────────────────────────────────────────────────────┐
│                 AI ENHANCEMENT ROADMAP                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ITERATION MODE                                              │
│  "Make the poll options more colorful"                      │
│  → AI modifies existing composition, preserves state        │
│                                                              │
│  MULTI-TURN CONVERSATION                                     │
│  User: "Create a poll"                                       │
│  AI: Creates poll                                            │
│  User: "Add a countdown"                                     │
│  AI: Adds countdown, connects to poll deadline              │
│                                                              │
│  EXAMPLE-BASED LEARNING                                      │
│  "Make something like what Chess Club has"                  │
│  → AI analyzes successful tools, replicates patterns        │
│                                                              │
│  SMART SUGGESTIONS                                           │
│  After creating poll: "Want to add a leaderboard?"          │
│  → AI suggests complementary elements                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### New Element Types
```typescript
// Interactive visualizations
'3d-gallery'       // Spline/Three.js objects
'live-chart'       // Real-time updating charts
'interactive-map'  // Campus map with pins

// Social elements
'challenge-tracker' // Multi-day challenges with streaks
'matchmaking'       // Pair users based on interests
'anonymous-qa'      // Q&A with anonymous submissions

// Media elements
'audio-recorder'    // Voice memos
'video-embed'       // YouTube/Vimeo with timestamps
'live-stream'       // Streaming to space members

// Gamification
'achievement-badge' // Unlockable badges
'point-system'      // Configurable point economy
'daily-streak'      // Streak tracking
```

#### Advanced Connections
```
┌─────────────────────────────────────────────────────────────┐
│                 ELEMENT CONNECTIONS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DATA FLOW                                                   │
│  search-input ──▶ filter-selector ──▶ result-list           │
│       │                                                      │
│       └──────────────────────────────▶ chart-display        │
│                                                              │
│  EVENT TRIGGERS                                              │
│  countdown-timer ──[finished]──▶ announcement                │
│  poll-element ──[vote]──▶ leaderboard.update_score          │
│                                                              │
│  CONDITIONAL LOGIC                                           │
│  role-gate ──[hasRole:admin]──▶ moderation-panel            │
│  form-builder ──[valid]──▶ rsvp-button.enable               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Medium-Term Vision

#### AI Tool Marketplace
```
┌─────────────────────────────────────────────────────────────┐
│                 TOOL MARKETPLACE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DISCOVERY                                                   │
│  ├── "Most used this week"                                  │
│  ├── "Trending in Greek Life"                               │
│  ├── "Top rated for events"                                 │
│  └── "Similar to what you've used"                          │
│                                                              │
│  ONE-CLICK INSTALL                                           │
│  ├── Browse → Preview → Install to Space                    │
│  └── Automatic configuration for space context              │
│                                                              │
│  TOOL TEMPLATES                                              │
│  ├── "Event Planning Kit" (RSVP + countdown + form)         │
│  ├── "Competition Bundle" (poll + leaderboard + timer)      │
│  └── "Feedback System" (form + chart + notification)        │
│                                                              │
│  CREATOR ECONOMY                                             │
│  ├── Tool analytics (usage, engagement, ratings)            │
│  ├── Version history with rollback                          │
│  └── Creator profiles and portfolios                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Workflow Automation
```typescript
// Trigger → Condition → Action chains
{
  trigger: 'form-builder.submit',
  conditions: [
    { field: 'attendeeCount', operator: '>=', value: 50 }
  ],
  actions: [
    { type: 'notification', template: 'milestone_reached' },
    { type: 'post_to_feed', content: '50 signups!' },
    { type: 'update_element', target: 'capacity-badge', data: { color: 'gold' } }
  ]
}
```

### Long-Term Possibilities

#### AI Agents
```
┌─────────────────────────────────────────────────────────────┐
│                   AI AGENTS                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SPACE CONCIERGE                                             │
│  "What events are happening this week?"                     │
│  → Agent queries space events, formats response             │
│  → Offers to RSVP on user's behalf                          │
│                                                              │
│  TOOL ASSISTANT                                              │
│  "Help me set up registration for our hackathon"            │
│  → Agent asks clarifying questions                          │
│  → Creates multi-element tool composition                   │
│  → Deploys and configures automatically                     │
│                                                              │
│  DATA ANALYST                                                │
│  "What's the engagement trend this month?"                  │
│  → Agent analyzes tool usage across space                   │
│  → Generates insights and visualizations                    │
│  → Suggests optimizations                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Cross-Platform Integration
```typescript
// External service connections
integrations: {
  'google-calendar': {
    sync: 'bidirectional',
    elements: ['event-picker', 'countdown-timer']
  },
  'slack': {
    sync: 'push',
    elements: ['announcement', 'poll-element']
  },
  'notion': {
    sync: 'bidirectional',
    elements: ['form-builder', 'result-list']
  },
  'canvas-lms': {
    sync: 'pull',
    elements: ['assignment-tracker', 'grade-display']
  }
}
```

#### Generative UI
```
┌─────────────────────────────────────────────────────────────┐
│                 GENERATIVE UI                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CURRENT: AI selects from 27 pre-built elements             │
│                                                              │
│  FUTURE: AI generates custom React components               │
│                                                              │
│  "Create a 3D rotating trophy for our leaderboard"          │
│  → AI writes React + Three.js component                     │
│  → Sandboxed execution in iframe                            │
│  → Automatic caching for performance                        │
│                                                              │
│  "Make an interactive flowchart for our process"            │
│  → AI generates custom SVG-based component                  │
│  → Drag-drop nodes, connection lines                        │
│  → State management included                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Logic & Design Principles

### Core Philosophy

1. **Conversation-First**: The primary interface is natural language, not menus
2. **Instant Gratification**: See results in seconds, not minutes
3. **Progressive Disclosure**: Simple by default, powerful when needed
4. **Context-Aware**: AI adapts to where you are and what you can do
5. **Real-Time by Default**: Every interaction is live, collaborative

### Element Design Principles

```
┌─────────────────────────────────────────────────────────────┐
│              ELEMENT DESIGN PRINCIPLES                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. STATELESS RENDER, STATEFUL DATA                         │
│     Elements receive data as props                          │
│     All mutations go through onAction → server              │
│     Server is source of truth                               │
│                                                              │
│  2. OPTIMISTIC BY DEFAULT                                    │
│     Update UI immediately on user action                    │
│     Server confirms/corrects asynchronously                 │
│     User never waits for network                            │
│                                                              │
│  3. HYDRATION FROM SERVER                                    │
│     Elements receive `data` prop with server state          │
│     Initialize local state from server                      │
│     Sync changes via useEffect                              │
│                                                              │
│  4. GRACEFUL DEGRADATION                                     │
│     Elements work without network (local-only)              │
│     Queue actions for when connection returns               │
│     Show sync status to user                                │
│                                                              │
│  5. PERMISSION-AWARE                                         │
│     Check tier before rendering                             │
│     Show helpful error for missing permissions              │
│     Never expose data user shouldn't see                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Action Handler Principles

```typescript
// Every handler must:
// 1. Validate permissions
// 2. Use transactions for atomic updates
// 3. Return new state for client sync
// 4. Optionally generate feed content
// 5. Handle errors gracefully

interface ActionResult {
  success: boolean;
  error?: string;
  state?: Record<string, unknown>;  // Partial state update
  feedContent?: {
    type: 'post' | 'update' | 'achievement';
    content: string;
  };
  data?: Record<string, unknown>;  // Additional response data
}
```

### Real-Time Sync Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 SYNC STRATEGY                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CLIENT A                     SERVER                  CLIENT B │
│     │                           │                         │   │
│     │──── vote('Pizza') ───────▶│                         │   │
│     │     [optimistic UI]       │                         │   │
│     │                           │──── validate ────────▶  │   │
│     │                           │◀─── OK ──────────────   │   │
│     │                           │                         │   │
│     │                           │──── SSE broadcast ─────▶│   │
│     │                           │                         │   │
│     │◀──── confirm ─────────────│                         │   │
│     │                           │                         │   │
│     │ [UI already correct]      │     [UI updates]        │   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Development Guide

### Adding a New Element

1. **Define the element renderer** in `element-renderers.tsx`:
```typescript
export function MyNewElement({ config, data, onChange, onAction }: ElementProps) {
  // Hydrate from server state
  const serverState = data?.myField || config.defaultValue;
  const [localState, setLocalState] = useState(serverState);

  // Sync with server
  useEffect(() => {
    setLocalState(serverState);
  }, [serverState]);

  // Handle user action
  const handleAction = () => {
    // Optimistic update
    setLocalState(newValue);
    // Call server
    onAction?.('my_action', { value: newValue });
  };

  return <Card>...</Card>;
}
```

2. **Register in ELEMENT_RENDERERS**:
```typescript
const ELEMENT_RENDERERS = {
  // ...existing
  'my-new-element': MyNewElement,
};
```

3. **Add action handler** in `tool-action-handlers.ts`:
```typescript
async function myActionHandler(context: ActionContext): Promise<ActionResult> {
  const { elementId, userId, data, stateRef } = context;

  await dbAdmin.runTransaction(async (tx) => {
    // Update state
  });

  return { success: true, state: { ... } };
}

registerElementActionHandler('my-new-element', 'my_action', myActionHandler);
```

4. **Document for AI** in `firebase-ai-generator.ts`:
```typescript
// Add to element prompts
- my-new-element: Description. Config: { field1: type, field2: type }
```

### Testing Locally

```bash
# Start web app
pnpm --filter @hive/web dev

# Start HiveLab app
pnpm --filter @hive/hivelab dev

# Test AI generation
curl -X POST http://localhost:3000/api/tools/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a poll for lunch"}'

# Check generation backend
curl http://localhost:3000/api/tools/generate
# Should return: {"backend":"firebase-ai","model":"gemini-2.0-flash"}
```

---

## 12. API Reference

### Tool Generation
```
POST /api/tools/generate
Body: { prompt: string, spaceId?: string, existingTool?: object }
Response: { tool: { name, description, elements, connections } }
```

### Tool CRUD
```
GET    /api/tools/:toolId
POST   /api/tools
PUT    /api/tools/:toolId
DELETE /api/tools/:toolId
```

### Deployment
```
POST   /api/tools/deploy
Body: { toolId, targetId, deployedTo, surface, permissions }

GET    /api/spaces/:spaceId/tools
Response: { tools: PlacedTool[] }
```

### State Management
```
GET    /api/tools/state/:deploymentId
PUT    /api/tools/state/:deploymentId
Body: { state: object, metadata: object, merge: boolean }
```

### Action Execution
```
POST   /api/tools/execute
Body: { deploymentId, action, elementId, data, context }
Response: { success, state?, feedContent?, error? }
```

### Real-Time Updates
```
GET    /api/realtime/tool-updates?deploymentId=X&spaceId=Y
Response: SSE stream with state updates
```

---

## Summary

HiveLab is a complete AI-powered visual tool builder with:

- **Real AI** (Gemini 2.0 Flash) generating structured tool compositions
- **Professional IDE** (Figma-like canvas with Cursor-like AI palette)
- **27 Interactive Elements** across 3 permission tiers
- **Real-Time State** with optimistic updates and SSE sync
- **Extensible Handlers** for server-side action logic
- **Space Integration** for deployment and discovery

The architecture supports an unlimited technology ceiling - from simple polls today to AI agents and generative UI tomorrow.
