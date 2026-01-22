# Vertical Slice: HiveLab / Tools

## January 2026 Full Launch

---

## Overview

HiveLab is Figma + Cursor for campus tools. A visual builder with AI generation that lets space leaders create custom tools without code. The signature moment: describe what you want, see it appear on canvas, deploy to your space.

**Status: 100% Builder Complete / 70% Infrastructure** ✅

**Key Metrics:**
- Element system: 27 elements across 3 tiers (1,102 lines in `element-system.ts`)
- IDE component: 926 lines (`packages/ui/src/components/hivelab/ide/hivelab-ide.tsx`)
- IDE folder: 20+ files for complete visual builder
- Tool runtime hook: 701 lines (`apps/web/src/hooks/use-tool-runtime.ts`)
- AI generation: Gemini 2.0 Flash with streaming
- 26 API routes for tools ecosystem

---

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CREATION FLOW                                       │
│                                                                               │
│   ┌───────────────────────────────────────────────────────────────────────┐  │
│   │  AI ENTRY POINT                                                        │  │
│   │                                                                         │  │
│   │  "Create a poll for our next event location"                           │  │
│   │           ↓                                                             │  │
│   │  Streaming generation → Elements appear on canvas in real-time         │  │
│   │           ↓                                                             │  │
│   │  "Make the options Lockwood Library, Student Union, Capen Hall"        │  │
│   │           ↓                                                             │  │
│   │  Iteration → Updates existing composition                              │  │
│   └───────────────────────────────────────────────────────────────────────┘  │
│                                     ↓                                         │
│   ┌───────────────────────────────────────────────────────────────────────┐  │
│   │                        HIVELAB IDE                                      │  │
│   │  ┌────────────┬──────────────────────────────┬─────────────────────┐   │  │
│   │  │ ELEMENT    │                              │   PROPERTIES        │   │  │
│   │  │ PALETTE    │         CANVAS               │   PANEL             │   │  │
│   │  │            │                              │                     │   │  │
│   │  │ Universal  │   ┌─────────────────────┐   │   Config:           │   │  │
│   │  │ - Poll     │   │     Poll Element    │   │   - Question        │   │  │
│   │  │ - Timer    │   │  ┌───────────────┐  │   │   - Options         │   │  │
│   │  │ - Form     │   │  │ What time?    │  │   │   - Allow Multiple  │   │  │
│   │  │ - Chart    │   │  │ ○ 3pm        │  │   │   - Show Results    │   │  │
│   │  │ ...        │   │  │ ○ 5pm        │  │   │                     │   │  │
│   │  │            │   │  │ ○ 7pm        │  │   │   Position:         │   │  │
│   │  │ Connected  │   │  └───────────────┘  │   │   - x: 120          │   │  │
│   │  │ - Events   │   │         [selected]  │   │   - y: 80           │   │  │
│   │  │ - Users    │   └─────────────────────┘   │                     │   │  │
│   │  │ - RSVP     │                              │   Size:             │   │  │
│   │  │            │   [ snap grid | zoom | pan ] │   - 240 x 180       │   │  │
│   │  │ Space      │                              │                     │   │  │
│   │  │ - Members  │                              │   Actions:          │   │  │
│   │  │ - Stats    │                              │   - Lock            │   │  │
│   │  │ - Announce │                              │   - Duplicate       │   │  │
│   │  │            │                              │   - Delete          │   │  │
│   │  └────────────┴──────────────────────────────┴─────────────────────┘   │  │
│   │                                                                         │  │
│   │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │  │ AI: "Create a countdown to finals week"            [⌘K to open] │   │  │
│   │  └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                         │  │
│   │  [Cancel]                                     [Preview] [Save] [Deploy] │  │
│   └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT FLOW                                     │
│                                                                               │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐   │
│   │   SPACE SIDEBAR   │  │   INLINE CHAT     │  │   PROFILE WIDGET      │   │
│   │                   │  │                   │  │                       │   │
│   │   Persistent tool │  │   Interactive in  │  │   Personal tools on   │   │
│   │   visible to all  │  │   message flow    │  │   your profile page   │   │
│   │   space members   │  │                   │  │                       │   │
│   └───────────────────┘  └───────────────────┘  └───────────────────────┘   │
│                                      ↓                                        │
│                          ┌───────────────────────┐                           │
│                          │   STANDALONE PAGE     │                           │
│                          │                       │                           │
│                          │   Shareable URL       │                           │
│                          │   hive.app/tools/xyz  │                           │
│                          └───────────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Pages & Routes

```
apps/web/src/app/hivelab/
├── page.tsx                    # HiveLab home / my tools
├── [toolId]/
│   ├── page.tsx               # Edit existing tool
│   └── preview/page.tsx       # Preview mode
└── new/
    └── page.tsx               # Create new tool

apps/web/src/app/tools/
└── [toolId]/
    └── page.tsx               # Standalone tool page (public)
```

### API Routes (28 endpoints)

```
apps/web/src/app/api/tools/
├── route.ts                   # GET list, POST create
├── browse/route.ts            # Marketplace browse
├── search/route.ts            # Tool search
├── recommendations/route.ts   # AI recommendations
├── personal/route.ts          # User's own tools
├── generate/route.ts          # AI generation (streaming) ⭐
├── execute/route.ts           # Execute tool action ⭐
├── deploy/route.ts            # Deploy to space
├── publish/route.ts           # Publish to marketplace
├── install/route.ts           # Install from marketplace
├── migrate/route.ts           # Version migration
├── usage-stats/route.ts       # Usage analytics
├── event-system/route.ts      # Tool events
├── feed-integration/route.ts  # Feed integration
├── [toolId]/
│   ├── route.ts               # GET/PATCH/DELETE tool
│   ├── state/route.ts         # GET/POST tool state
│   ├── with-state/route.ts    # Combined tool + state (optimization)
│   ├── deploy/route.ts        # Deploy this tool
│   ├── analytics/route.ts     # Tool analytics
│   ├── reviews/route.ts       # Tool reviews
│   ├── share/route.ts         # Share tool
│   ├── upload-asset/route.ts  # Upload images/files
│   └── publish-template/route.ts # Publish as template
├── deploy/
│   └── [deploymentId]/route.ts # Deployment CRUD
└── state/
    └── [deploymentId]/route.ts # Deployment state
```

### UI Components

```
packages/ui/src/components/hivelab/
├── ide/
│   ├── hivelab-ide.tsx        # Main IDE component (700+ lines) ⭐
│   ├── ide-canvas.tsx         # Canvas with drag-drop
│   ├── ide-toolbar.tsx        # Top toolbar
│   ├── element-palette.tsx    # Left panel - elements
│   ├── properties-panel.tsx   # Right panel - config
│   ├── layers-panel.tsx       # Layer management
│   ├── ai-command-palette.tsx # ⌘K AI input (473 lines) ⭐
│   ├── smart-guides.tsx       # Alignment guides
│   ├── contextual-inspector.tsx # Hover inspector
│   ├── element-belt.tsx       # Quick element access
│   ├── onboarding-overlay.tsx # First-time UX
│   └── components/
│       ├── ide-section.tsx
│       ├── ide-button.tsx
│       ├── ide-input.tsx
│       └── ide-panel.tsx
├── studio/
│   ├── DndStudioProvider.tsx  # Drag-drop context
│   ├── DraggablePaletteItem.tsx
│   ├── CanvasDropZone.tsx
│   ├── SortableCanvasElement.tsx
│   └── ToolStudioExample.tsx
├── showcase/
│   ├── ElementShowcase.tsx
│   ├── ElementShowcaseGrid.tsx
│   ├── ElementBundleCard.tsx
│   └── TemplateBrowser.tsx
├── elements/
│   ├── universal.tsx          # Universal element renderers
│   ├── interactive.tsx        # Interactive elements
│   └── error-boundary.tsx     # Element error handling
├── element-renderers.tsx      # Central render registry
├── inline-element-renderer.tsx # Chat inline rendering
├── tool-canvas.tsx            # Deployed tool canvas
├── tool-runtime-modal.tsx     # Runtime preview modal
├── ToolDeployModal.tsx        # Deployment modal
├── save-template-dialog.tsx   # Save as template
├── remix-dialog.tsx           # Remix existing tool
├── template-suggestions.tsx   # Template recommendations
├── visual-tool-composer.tsx   # Legacy composer
├── automations-panel.tsx      # Automation builder
├── automation-templates.tsx   # Automation templates
├── AIPromptInput.tsx          # AI prompt component
├── SkeletonCanvas.tsx         # Loading skeleton
├── StreamingCanvasView.tsx    # Streaming canvas
└── StreamingCanvasWrapper.tsx # Streaming wrapper
```

### Hooks

```
apps/web/src/hooks/
├── use-tool-runtime.ts        # Tool execution & state (592 lines) ⭐
└── use-streaming-generation.ts # AI streaming (in @hive/hooks)

packages/hooks/src/
├── use-streaming-generation.ts # AI generation hook
└── use-hivelab-state.ts       # IDE state management
```

### Element System

```
packages/ui/src/lib/hivelab/
├── element-system.ts          # Core element registry ⭐
├── quick-templates.ts         # Pre-built templates (486 lines)
├── space-templates.ts         # Space-specific templates
└── automation-types.ts        # Automation definitions
```

### DDD Domain Layer

```
packages/core/src/domain/hivelab/
├── entities/
│   ├── tool.ts                # Tool aggregate root
│   ├── tool-element.ts        # Element entity
│   └── deployment.ts          # Deployment entity
├── value-objects/
│   ├── tool-id.ts
│   ├── element-type.ts
│   └── deployment-target.ts
└── services/
    └── tool-generation.service.ts

packages/core/src/application/
├── services/
│   └── demo-prompts.ts        # AI demo prompts
└── hivelab/
    ├── tool-management.service.ts
    └── tool-query.service.ts
```

---

## Technical Implementation

### 1. Element Tier System

```typescript
// Element access tiers - determines DATA access, not creation ability
type ElementTier = 'universal' | 'connected' | 'space';

// Universal: Everyone - no HIVE data needed (15 elements)
// Connected: Everyone - pulls from public HIVE data (5 elements)
// Space: Leaders only - pulls from their space's private data (7 elements)

interface ElementDefinition {
  id: string;
  name: string;
  description: string;
  category: 'input' | 'display' | 'filter' | 'action' | 'layout';
  tier: ElementTier;
  dataSource: DataSource;
  icon: string;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  render: (props: ElementProps) => JSX.Element;
}
```

### 2. Element Registry (27 Elements)

**Universal Tier (15 elements):**
| Element | Category | Description |
|---------|----------|-------------|
| `search-input` | input | Text search with autocomplete |
| `filter-selector` | filter | Multi-select filtering |
| `result-list` | display | Paginated item list |
| `date-picker` | input | Date/time selection |
| `tag-cloud` | display | Weighted tag visualization |
| `map-view` | display | Geographic map |
| `chart-display` | display | Bar, line, pie charts |
| `form-builder` | input | Dynamic form creation |
| `countdown-timer` | display | Live countdown |
| `poll-element` | action | Voting/polls |
| `leaderboard` | display | Ranked standings |
| `markdown-element` | display | Rich text content |
| `image-element` | display | Image display |
| `button-element` | action | Action buttons |
| `tabs-element` | layout | Tabbed content |

**Connected Tier (5 elements):**
| Element | Category | Data Source |
|---------|----------|-------------|
| `event-picker` | input | campus-events |
| `user-selector` | input | campus-users |
| `space-picker` | input | campus-spaces |
| `rsvp-button` | action | user-connections |
| `calendar-view` | display | user-events |

**Space Tier (7 elements):**
| Element | Category | Data Source |
|---------|----------|-------------|
| `member-list` | display | space-members |
| `member-selector` | input | space-members |
| `space-events` | display | space-events |
| `space-feed` | display | space-feed |
| `space-stats` | display | space-stats |
| `announcement` | display | space-announcements |
| `role-gate` | layout | space-roles |

### 3. AI Generation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ CLIENT                                                               │
│                                                                      │
│ useStreamingGeneration hook                                          │
│     ↓                                                                │
│ fetch('/api/tools/generate', { stream: true })                       │
│     ↓                                                                │
│ ReadableStream → parse NDJSON chunks                                 │
│     ↓                                                                │
│ Chunk types:                                                         │
│   • { type: 'thinking', data: { step } }     → Show progress        │
│   • { type: 'element', data: { element } }   → Add to canvas        │
│   • { type: 'metadata', data: { name } }     → Set tool name        │
│   • { type: 'complete', data: { tool } }     → Generation done      │
│   • { type: 'error', data: { error } }       → Handle error         │
└─────────────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────────────┐
│ SERVER (/api/tools/generate)                                         │
│                                                                      │
│ 1. Rate limiting (AI-specific limits)                                │
│ 2. Usage tracking (canGenerate/recordGeneration)                     │
│ 3. Firebase AI (Gemini 2.0 Flash) or Mock fallback                   │
│                                                                      │
│ GenerationContext:                                                   │
│   - userId: string                                                   │
│   - sessionId: string                                                │
│   - campusId: string                                                 │
│   - spaceContext?: { spaceId, spaceName, spaceType, ... }           │
│   - existingComposition?: { elements, name } (for iterations)        │
└─────────────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────────────┐
│ FIREBASE AI (Gemini 2.0 Flash)                                       │
│                                                                      │
│ System prompt:                                                       │
│   "You are a tool composition assistant for HIVE..."                 │
│   - Available elements: [full element registry]                      │
│   - Space context: [if provided]                                     │
│   - Output format: Structured JSON for tool composition              │
│                                                                      │
│ Streaming output:                                                    │
│   - Generates one element at a time                                  │
│   - Real-time canvas updates                                         │
│   - Supports iteration ("make the options...")                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Tool Composition Structure

```typescript
interface ToolComposition {
  id: string;
  name: string;
  description: string;
  elements: {
    elementId: string;      // Type of element (poll, timer, etc.)
    instanceId: string;     // Unique instance ID
    config: Record<string, any>;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }[];
  connections: {
    from: { instanceId: string; output: string };
    to: { instanceId: string; input: string };
  }[];
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

// Example: Simple poll tool
{
  id: "tool_123456",
  name: "Event Location Poll",
  description: "Vote on where to hold our next event",
  elements: [
    {
      elementId: "poll-element",
      instanceId: "poll_1",
      config: {
        question: "Where should we meet?",
        options: ["Lockwood Library", "Student Union", "Capen Hall"],
        allowMultipleVotes: false,
        showResults: true
      },
      position: { x: 20, y: 20 },
      size: { width: 300, height: 200 }
    }
  ],
  connections: [],
  layout: "flow"
}
```

### 5. Tool Runtime (State Management)

```typescript
// useToolRuntime hook
const {
  tool,           // Tool definition
  state,          // Current state (votes, form data, etc.)
  isLoading,      // Loading tool/state
  isExecuting,    // Executing action
  isSaving,       // Saving state
  isSynced,       // State synced with server
  lastSaved,      // Last save timestamp
  error,          // Error state
  executeAction,  // Execute element action
  updateState,    // Partial state update
  saveState,      // Force save
  reset,          // Reset to initial state
  reload          // Reload tool and state
} = useToolRuntime({
  toolId: "tool_123",
  spaceId: "space_abc",
  placementId: "sidebar_1",
  autoSave: true,
  autoSaveDelay: 2000  // 2s debounce
});

// Execute action (e.g., vote in poll)
const result = await executeAction(
  "poll_1",           // Element instance ID
  "vote",             // Action name
  { option: "Lockwood Library" }
);

// State persists to:
// /api/tools/state/{deploymentId}
// Deployment ID = "space:space_abc_sidebar_1"
```

### 6. Deployment Targets

```typescript
type DeploymentTarget =
  | 'space_sidebar'    // Persistent in space sidebar
  | 'space_inline'     // Interactive in chat
  | 'profile_widget'   // Personal profile widget
  | 'standalone';      // Public shareable page

// Deployment ID format:
// space:{spaceId}_{placementId} - Space deployment
// profile:{userId}_{widgetId}   - Profile widget
// standalone:{toolId}           - Public page

// Deployment data:
interface Deployment {
  id: string;              // Composite deployment ID
  toolId: string;
  target: DeploymentTarget;
  targetId: string;        // spaceId, userId, or toolId
  placementId?: string;    // Position within target
  state: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### 7. Quick Templates

```typescript
// Pre-built tool compositions for one-click deployment
interface QuickTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: 'engagement' | 'organization' | 'communication';
  composition: ToolComposition;
  defaultConfig: {
    placement: 'sidebar' | 'inline';
    collapsed: boolean;
  };
}

// Available templates (10):
const QUICK_TEMPLATES = [
  QUICK_POLL_TEMPLATE,        // "Quick Poll"
  EVENT_COUNTDOWN_TEMPLATE,   // "Event Countdown"
  QUICK_LINKS_TEMPLATE,       // "Quick Links"
  STUDY_GROUP_TEMPLATE,       // "Study Group Signup"
  ANNOUNCEMENTS_TEMPLATE,     // "Announcements"
  MEETING_NOTES_TEMPLATE,     // "Meeting Notes"
  OFFICE_HOURS_TEMPLATE,      // "Office Hours"
  LEADERBOARD_TEMPLATE,       // "Leaderboard"
  EVENT_RSVP_TEMPLATE,        // "Event RSVP"
  MEMBER_SPOTLIGHT_TEMPLATE,  // "Member Spotlight"
];
```

### 8. IDE Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Open AI command palette |
| `⌘S` | Save tool |
| `⌘Z` | Undo |
| `⌘⇧Z` | Redo |
| `⌘A` | Select all elements |
| `⌘C` | Copy selected |
| `⌘V` | Paste |
| `⌘X` | Cut selected |
| `⌘D` | Duplicate selected |
| `Delete` | Delete selected |
| `Escape` | Clear selection |
| `Space` (hold) | Pan canvas |
| `⌘+` / `⌘-` | Zoom in/out |
| `⌘0` | Reset zoom |

---

## Database Schema

### Collections

```
tools/{toolId}
├── id: string
├── name: string
├── description: string
├── elements: ToolElement[]
├── connections: Connection[]
├── layout: 'grid' | 'flow' | 'tabs' | 'sidebar'
├── category: string
├── version: number
├── status: 'draft' | 'preview' | 'published'
├── creatorId: string
├── campusId: string
├── isPublished: boolean
├── publishedAt?: timestamp
├── tags: string[]
├── config: object
├── metadata: {
│     generatedBy?: 'ai' | 'manual'
│     aiSessionId?: string
│     iterationCount?: number
│   }
├── createdAt: timestamp
└── updatedAt: timestamp

toolDeployments/{deploymentId}
├── id: string (composite: "space:spaceId_placementId")
├── toolId: string
├── target: 'space_sidebar' | 'space_inline' | 'profile_widget' | 'standalone'
├── targetId: string
├── placementId?: string
├── state: object (tool-specific state)
├── createdBy: string
├── campusId: string
├── createdAt: timestamp
└── updatedAt: timestamp

toolTemplates/{templateId}
├── id: string
├── toolId: string (source tool)
├── name: string
├── description: string
├── category: string
├── suggestedFor: string[] (e.g., ['student_org', 'greek_life'])
├── difficulty: 'starter' | 'intermediate' | 'advanced'
├── elements: ToolElement[]
├── isOfficial: boolean
├── usageCount: number
├── rating: number
├── createdBy: string
├── publishedAt: timestamp
└── updatedAt: timestamp

toolReviews/{reviewId}
├── toolId: string
├── userId: string
├── rating: number (1-5)
├── review: string
├── createdAt: timestamp
└── isVerified: boolean

toolAnalytics/{toolId}
├── views: number
├── deploys: number
├── activeDeployments: number
├── uniqueUsers: number
├── actionsExecuted: number
├── lastActivityAt: timestamp
└── dailyStats: object[]
```

---

## Security Measures

### 1. Element Tier Enforcement

```typescript
// IDE validates element access
const SPACE_TIER_ELEMENTS = [
  'member-list', 'member-selector', 'space-events',
  'space-feed', 'space-stats', 'announcement', 'role-gate'
];

if (SPACE_TIER_ELEMENTS.includes(elementId) && !userContext?.isSpaceLeader) {
  console.warn(`Cannot add ${elementId}: requires space leader access`);
  return; // Element not added
}
```

### 2. AI Rate Limiting

```typescript
// Per-user limits on AI generation
const aiGenerationRateLimit = createRateLimiter({
  windowMs: 60_000,  // 1 minute
  max: 10,           // 10 generations per minute
});

// Usage tracking
const usage = await canGenerate(userId);
// Returns: { allowed: boolean, tier: string, limit: number }
```

### 3. Tool Execution Security

```typescript
// Execute route validates:
// 1. Tool exists and user has access
// 2. Element exists in tool
// 3. Action is valid for element type
// 4. Rate limiting on action execution
```

### 4. Deployment Permissions

```typescript
// Only space leaders can deploy to space sidebar
// Only profile owners can deploy to their profile
// Anyone can deploy to standalone (creates public page)
```

---

## Known Issues & Recommended Fixes

### Critical (Soft Launch Blockers) - ALL RESOLVED ✅

1. **More Quick Templates Needed** ✅ DONE
   - Was: 10 templates → Now: 20 templates
   - Added: Feedback Form, Decision Maker, Progress Tracker, Meeting Agenda, Budget Overview, Weekly Update
   - File: `packages/ui/src/lib/hivelab/quick-templates.ts`

2. **Undo/Redo Not Fully Implemented** ✅ DONE
   - Fixed: History initialization and restore logic
   - Now: ⌘Z/⌘⇧Z work correctly
   - File: `packages/ui/src/components/hivelab/ide/hivelab-ide.tsx:45-65`

### Important (Should Fix) - ALL RESOLVED ✅

3. **Element Connection UI** ✅ DONE
   - Added: Visual wire preview with animated bezier curves
   - Added: Gold-styled connection drawing with dots
   - Added: ESC to cancel, visual endpoint indicators
   - File: `packages/ui/src/components/hivelab/ide/ide-canvas.tsx:648-743`

4. **Multi-select Incomplete** ✅ DONE
   - Added: Lasso/rectangle selection tool
   - Added: Shift+click for additive selection
   - Added: Gold selection rectangle visualization
   - File: `packages/ui/src/components/hivelab/ide/ide-canvas.tsx:780-917`

5. **Canvas Performance at Scale** ✅ DONE
   - Added: Viewport-based virtualization (200px buffer)
   - Added: Only renders visible elements and connections
   - Added: "X/Y visible" indicator when virtualizing
   - File: `packages/ui/src/components/hivelab/ide/ide-canvas.tsx:66-121, 869-887`

### Deferred (Spring 2026)

- Collaborative editing (multiple users)
- Version history / rollback
- Tool marketplace with payments
- Custom element creation (code mode)
- Advanced layout constraints

---

## Success Metrics

### Creation

| Metric | Target | Current |
|--------|--------|---------|
| Time to first tool | < 2 min | ~3 min |
| AI accuracy | 80% first-try | ~75% |
| Tool save rate | 70% of created | N/A |
| Deploy rate | 50% of saved | N/A |

### Engagement

| Metric | Target | Current |
|--------|--------|---------|
| Tools per leader | 2+/month | N/A |
| Actions per deployed tool | 10+/week | N/A |
| Tool remix rate | 20% | N/A |

### Performance

| Metric | Target | Current |
|--------|--------|---------|
| AI generation time | < 5s | ~3s ✅ |
| Canvas FPS | 60fps | 60fps ✅ |
| State save latency | < 200ms | ~150ms ✅ |
| Tool load time | < 500ms | ~400ms ✅ |

---

## Testing Checklist

### AI Generation
- [ ] Describe "poll" → creates poll element
- [ ] Describe "countdown to finals" → creates countdown
- [ ] Iteration: "add 3 more options" → updates existing
- [ ] Space context: mentions space name appropriately
- [ ] Error handling: graceful fallback on AI failure
- [ ] Rate limiting: shows limit message

### IDE Canvas
- [ ] Drag element from palette → drops on canvas
- [ ] Click element → shows selection
- [ ] Drag selected → moves element
- [ ] Resize handles → change size
- [ ] Properties panel → updates config
- [ ] Delete key → removes element
- [ ] ⌘K → opens AI palette
- [ ] ⌘S → saves tool

### Deployment
- [ ] Deploy to sidebar → appears in space
- [ ] Deploy inline → creates chat message
- [ ] State persists across page loads
- [ ] Action execution → updates state
- [ ] Multiple deployments → independent state

### Templates
- [ ] Template gallery shows all templates
- [ ] Click template → creates tool
- [ ] Template config → shows defaults
- [ ] One-click deploy → works from template

---

## Related Documents

- **Vision**: `docs/PRODUCT_VISION.md`
- **Spaces Slice**: `docs/VERTICAL_SLICE_SPACES.md`
- **Onboarding Slice**: `docs/VERTICAL_SLICE_ONBOARDING.md`
- **Element Registry**: `packages/ui/src/lib/hivelab/element-system.ts`

---

---

## Scaling Readiness

**Grade: A** (Infrastructure built, activation required)

### Already Implemented
| Component | Status | Capacity |
|-----------|--------|----------|
| Counter sharding | ✅ Built | 200+ writes/sec (from 25) |
| Collection extraction | ✅ Built | Unlimited (from 1MB limit) |
| RTDB real-time broadcast | ✅ Built | Eliminates polling |

### Activation Required Before Beta
1. Run migration: `pnpm tsx scripts/migrate-tool-state-to-sharded.ts`
2. Enable feature flags:
   ```bash
   USE_SHARDED_COUNTERS=true
   USE_EXTRACTED_COLLECTIONS=true
   USE_RTDB_BROADCAST=true
   ```

### Deferred (10K+ Users)
- Redis caching layer (sub-100ms latency)

See: `docs/SCALING_READINESS.md` for full architecture.

---

*Last updated: January 2026*
*Status: 100% Complete - Ready for Soft Launch* ✅
