# HiveLab Complete Specification

**Last Updated:** December 2025
**Status:** Winter 2025-26 Launch Ready
**Completion:** 80% → Target 95%

---

## Executive Summary

HiveLab is HIVE's visual tool builder—Figma meets Cursor for campus tools. It enables student leaders to create, customize, and deploy interactive tools without code, expanding what communities can do.

**Core Promise:** "I need a poll for event locations" → describe in plain English → see working tool in <30 seconds

---

## Table of Contents

1. [Philosophy & Vision](#philosophy--vision)
2. [Architecture Overview](#architecture-overview)
3. [Element System](#element-system)
4. [AI Generation](#ai-generation)
5. [Visual Canvas](#visual-canvas)
6. [Tool Deployment](#tool-deployment)
7. [State Management](#state-management)
8. [Templates & Marketplace](#templates--marketplace)
9. [Analytics & Insights](#analytics--insights)
10. [Integration Points](#integration-points)
11. [Butterfly Effects at Scale](#butterfly-effects-at-scale)
12. [Winter Launch Checklist](#winter-launch-checklist)

---

## Philosophy & Vision

### Why HiveLab Exists

**Tool Autonomy:** Don't wait for HIVE to add features. Create what you need.

The traditional path:
```
Leader needs feature → Requests from platform → Waits months → Gets generic solution
```

The HIVE way:
```
Leader needs feature → Opens HiveLab → Describes or drags → Deploys in minutes
```

### The Skill That Matters

In an AI world, the most valuable skill is **creation**—deciding what to build, understanding problems, making something new. HiveLab is where students develop this:

- Build tools your community needs → Learn by shipping
- Solve real problems → More valuable than any assignment
- Share what you built → Portfolio that matters
- Learn AI-augmented creation → The skill that transfers

### Success Metric

**A student who's built 5 HiveLab tools has more demonstrable capability than a student with a 4.0 GPA.** One is proof of creation. The other is proof of compliance.

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HIVELAB IDE                                      │
│                                                                               │
│  ┌──────────┐   ┌────────────────────────────────────────┐   ┌────────────┐ │
│  │          │   │                                        │   │            │ │
│  │ ELEMENT  │   │              CANVAS                    │   │ PROPERTIES │ │
│  │ PALETTE  │   │                                        │   │   PANEL    │ │
│  │          │   │   ┌──────┐   ┌──────┐   ┌──────┐      │   │            │ │
│  │ Universal│   │   │ Poll │   │Timer │   │ RSVP │      │   │ Config     │ │
│  │ Connected│   │   │      │   │      │   │      │      │   │ Data       │ │
│  │ Space    │   │   └──────┘   └──────┘   └──────┘      │   │ Actions    │ │
│  │          │   │                                        │   │ Style      │ │
│  │          │   │         ┌─────────────┐               │   │            │ │
│  │          │   │         │ Leaderboard │               │   │            │ │
│  │          │   │         └─────────────┘               │   │            │ │
│  └──────────┘   └────────────────────────────────────────┘   └────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ AI: "Create a poll for our next meeting location with a 48h deadline"  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  [Preview Mode]  [Layers Panel]  [Smart Guides]      [Save Draft] [Deploy]  │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼ Deploy

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT TARGETS                                  │
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Space Sidebar  │  │  Inline Chat    │  │  Standalone     │              │
│  │                 │  │                 │  │     Page        │              │
│  │  Persistent     │  │  Embedded in    │  │                 │              │
│  │  tools visible  │  │  messages       │  │  Public URL     │              │
│  │  to all members │  │  Interactive    │  │  Shareable      │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                                   │
│  │  Profile Widget │  │  Modal Overlay  │                                   │
│  │                 │  │                 │                                   │
│  │  Personal tools │  │  Full-screen    │                                   │
│  │  on profile     │  │  tool popup     │                                   │
│  └─────────────────┘  └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Architecture

```
packages/
├── core/src/domain/hivelab/
│   ├── tool-composition.types.ts    # Core type definitions
│   ├── element-registry.ts          # Element specifications
│   ├── system-tool-templates.ts     # Built-in tool templates
│   ├── entities/
│   │   ├── automation.ts            # Workflow automation
│   │   └── template.entity.ts       # Saved tool templates
│   └── validation/
│       └── element-schemas.ts       # Zod validation schemas
│
├── ui/src/
│   ├── lib/hivelab/
│   │   ├── element-system.ts        # Full element registry (27,204 lines)
│   │   ├── local-tool-storage.ts    # Local persistence
│   │   └── tool-state-manager.ts    # Runtime state management
│   │
│   └── components/hivelab/
│       ├── ide/
│       │   ├── hivelab-ide.tsx      # Main IDE component
│       │   ├── ide-canvas.tsx       # Visual editing surface
│       │   ├── properties-panel.tsx  # Element configuration
│       │   ├── element-palette.tsx   # Element selection
│       │   ├── layers-panel.tsx      # Element hierarchy
│       │   └── ai-command-palette.tsx # Natural language input
│       │
│       ├── element-renderers.tsx     # Element implementations (2,500+ lines)
│       ├── inline-element-renderer.tsx # Embedded tool rendering
│       ├── tool-runtime-modal.tsx    # Tool execution
│       └── ToolDeployModal.tsx       # Deployment UI

apps/web/src/
├── app/tools/
│   ├── page.tsx                     # Tool listing
│   ├── new/page.tsx                 # Create new tool
│   └── [toolId]/
│       ├── page.tsx                 # Tool viewer
│       └── edit/page.tsx            # Tool editor
│
├── hooks/
│   └── use-tool-runtime.ts          # Runtime hook (596 lines)
│
└── app/api/tools/
    ├── route.ts                     # List/create tools
    ├── generate/route.ts            # AI generation
    ├── [toolId]/
    │   ├── route.ts                 # CRUD operations
    │   ├── deploy/route.ts          # Deployment
    │   ├── state/route.ts           # State persistence
    │   ├── execute/route.ts         # Action execution
    │   └── analytics/route.ts       # Usage metrics
    ├── browse/route.ts              # Marketplace
    └── templates/route.ts           # Template gallery
```

---

## Element System

### Element Tiers

Elements are organized into three access tiers based on data requirements:

| Tier | Access | Data Source | Example |
|------|--------|-------------|---------|
| **Universal** | Everyone | No HIVE data | Poll, Timer, Form |
| **Connected** | Everyone | Public HIVE data | Event Picker, User Selector |
| **Space** | Leaders only | Private space data | Member List, Space Stats |

### Complete Element Reference

#### Universal Elements (15)

| Element | Description | Use Cases | State |
|---------|-------------|-----------|-------|
| `poll-element` | Multi-option voting | Event location, feedback | `{ votes: Record<optionId, userId[]> }` |
| `countdown-timer` | Time until event | Event countdown, deadlines | `{ endTime: Date, isComplete: boolean }` |
| `timer` | Stopwatch/interval | Study sessions, meetings | `{ elapsed: number, isRunning: boolean }` |
| `counter` | Increment/decrement | Attendance, signups | `{ count: number }` |
| `form-builder` | Custom forms | Surveys, applications | `{ submissions: Submission[] }` |
| `chart-display` | Data visualization | Analytics, results | `{ data: ChartData }` |
| `leaderboard` | Rankings | Competitions, gamification | `{ entries: LeaderboardEntry[] }` |
| `search-input` | Text search | Directory, content | `{ query: string }` |
| `filter-selector` | Multi-filter | Categories, tags | `{ filters: string[] }` |
| `result-list` | Searchable list | Directories | `{ results: Item[] }` |
| `date-picker` | Date selection | Scheduling | `{ selectedDate: Date }` |
| `tag-cloud` | Tag display | Interests, topics | `{ tags: Tag[] }` |
| `notification-display` | Alerts | Announcements | `{ notifications: Notification[] }` |
| `text-block` | Rich text | Content, instructions | `{ content: string }` |
| `image-gallery` | Image display | Photos, media | `{ images: Image[] }` |

#### Connected Elements (5)

| Element | Description | Data Source | State |
|---------|-------------|-------------|-------|
| `event-picker` | Campus event selection | `/api/events` | `{ selectedEventId: string }` |
| `space-picker` | Space directory | `/api/spaces` | `{ selectedSpaceId: string }` |
| `user-selector` | User search | `/api/users/search` | `{ selectedUserIds: string[] }` |
| `rsvp-button` | Event signup | Space events | `{ rsvpUserIds: string[] }` |
| `connection-list` | User connections | Profile connections | `{ connections: Connection[] }` |

#### Space Elements (7)

| Element | Description | Access | State |
|---------|-------------|--------|-------|
| `member-list` | Space members | Leader view | `{ members: Member[] }` |
| `member-selector` | Select members | Leaders | `{ selectedMemberIds: string[] }` |
| `space-events` | Space events | All members | `{ events: Event[] }` |
| `space-feed` | Space posts | All members | `{ posts: Post[] }` |
| `space-stats` | Analytics | Leaders | `{ stats: SpaceStats }` |
| `announcement` | Broadcasts | Leaders create | `{ message: string, createdAt: Date }` |
| `role-gate` | Conditional content | By role | `{ allowedRoles: Role[] }` |

### Element Specification Schema

```typescript
interface ElementSpec {
  // Identity
  id: string;                        // Unique identifier
  name: string;                      // Display name
  description: string;               // What it does
  icon: string;                      // Lucide icon name
  tier: 'universal' | 'connected' | 'space';

  // Configuration
  configSchema: ZodSchema;           // Zod schema for config
  defaultConfig: Record<string, any>;

  // Layout
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };

  // Behavior
  stateful: boolean;                 // Has persistent state
  realtime: boolean;                 // Needs real-time updates

  // Data Flow
  inputs: ElementPort[];             // Data inputs
  outputs: ElementPort[];            // Data outputs
  actions: ElementAction[];          // Triggerable actions

  // Metadata
  useCases: string[];                // Example use cases
  tags: string[];                    // Searchable tags
  category: ElementCategory;
}

interface ElementPort {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
}

interface ElementAction {
  id: string;
  name: string;
  description: string;
  params: ElementPort[];
}
```

### Element Data Flow

Elements can be connected to create data flows:

```
┌──────────────┐     value      ┌──────────────┐
│ search-input │ ───────────────▶ │ result-list  │
└──────────────┘                └──────────────┘
       │
       │ query
       ▼
┌──────────────┐
│filter-selector│
└──────────────┘
```

**Connection Types:**
- **Value Binding:** Element A's output feeds Element B's input
- **Action Trigger:** Element A's action triggers Element B's action
- **State Sync:** Elements share state via a common store

---

## AI Generation

### Generation Pipeline

```
User Prompt → Intent Detection → Element Selection → Layout Generation → Config Tuning → Preview
```

### Intent Detection

| Intent | Keywords | Suggested Elements |
|--------|----------|-------------------|
| Voting/Decision | poll, vote, choose, decide | `poll-element`, `chart-display` |
| Scheduling | when, schedule, availability | `date-picker`, `countdown-timer` |
| Attendance | who's coming, RSVP, signup | `rsvp-button`, `counter`, `member-list` |
| Competition | leaderboard, ranking, winner | `leaderboard`, `counter`, `timer` |
| Feedback | survey, feedback, rate | `form-builder`, `chart-display` |
| Information | announce, share, display | `announcement`, `text-block` |
| Search | find, search, lookup | `search-input`, `result-list` |

### Generation Examples

**Prompt:** "Create a poll for our next event location with a 48-hour deadline"

**Generated Composition:**
```typescript
{
  elements: [
    {
      id: 'poll-1',
      type: 'poll-element',
      config: {
        title: 'Next Event Location',
        options: ['Option A', 'Option B', 'Option C'],
        allowMultiple: false,
        anonymous: false
      },
      position: { x: 20, y: 20 },
      size: { width: 300, height: 200 }
    },
    {
      id: 'timer-1',
      type: 'countdown-timer',
      config: {
        endTime: /* 48 hours from now */,
        label: 'Voting ends in'
      },
      position: { x: 20, y: 240 },
      size: { width: 300, height: 60 }
    }
  ],
  connections: [
    {
      from: { elementId: 'timer-1', output: 'isComplete' },
      to: { elementId: 'poll-1', action: 'close' }
    }
  ]
}
```

### AI Quality System

```
packages/core/src/application/hivelab/
├── ai-tool-generator.service.ts     # Main generator (Gemini API)
├── validation/
│   ├── composition-validator.service.ts
│   └── quality-gate.service.ts
├── learning/
│   ├── pattern-extractor.service.ts  # Learn common patterns
│   ├── context-retriever.service.ts  # Gather context
│   ├── config-learner.service.ts     # Learn configs
│   └── prompt-enhancer.service.ts    # Improve prompts
└── benchmarks/
    ├── generation-tracker.service.ts  # Log generations
    ├── edit-tracker.service.ts        # Track user edits
    └── failure-classifier.service.ts  # Categorize failures
```

**Quality Metrics:**
- Generation success rate: Target 90%
- User edit rate: Track modifications post-generation
- Time to deploy: Target <60 seconds

---

## Visual Canvas

### Canvas Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| Drag-and-drop from palette | Done | `DndStudioProvider` |
| Grid-based positioning | Done | `ide-canvas.tsx` |
| Resize handles | Done | Custom resize logic |
| Selection highlighting | Done | Focus ring |
| Properties panel | Done | `properties-panel.tsx` |
| Multi-select | Partial | Shift+click |
| Undo/redo | Missing | Command pattern needed |
| Copy/paste | Missing | Clipboard API |
| Alignment tools | Missing | Snap guides |
| Zoom/pan | Partial | Scroll to zoom |

### Canvas Interactions

```typescript
// Canvas State
interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  gridEnabled: boolean;
  snapEnabled: boolean;
}

// Canvas Actions
type CanvasAction =
  | { type: 'ADD_ELEMENT'; element: CanvasElement }
  | { type: 'REMOVE_ELEMENT'; elementId: string }
  | { type: 'UPDATE_ELEMENT'; elementId: string; updates: Partial<CanvasElement> }
  | { type: 'SELECT_ELEMENTS'; ids: string[] }
  | { type: 'MOVE_ELEMENTS'; ids: string[]; delta: { x: number; y: number } }
  | { type: 'RESIZE_ELEMENT'; id: string; size: { width: number; height: number } }
  | { type: 'UNDO' }
  | { type: 'REDO' };
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` | Remove selected elements |
| `Ctrl+Z` | Undo (not implemented) |
| `Ctrl+Shift+Z` | Redo (not implemented) |
| `Ctrl+C` | Copy (not implemented) |
| `Ctrl+V` | Paste (not implemented) |
| `Ctrl+A` | Select all |
| `Arrow keys` | Nudge selected |
| `Tab` | Next element |
| `Escape` | Deselect all |

---

## Tool Deployment

### Deployment Flow

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   HiveLab   │ ──▶ │ Deploy Modal    │ ──▶ │ SpaceDeployment │
│   (Create)  │     │ (Configure)     │     │ Service         │
└─────────────┘     └─────────────────┘     └─────────────────┘
                            │                        │
                            ▼                        ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │ Select Target   │     │ PlacedTool      │
                    │ - Space         │     │ Entity Created  │
                    │ - Placement     │     │ in Space        │
                    │ - Visibility    │     └─────────────────┘
                    └─────────────────┘
```

### PlacedTool Entity

The bridge between HiveLab (creation) and Spaces (usage):

```typescript
interface PlacedToolProps {
  toolId: string;              // Reference to tool definition
  spaceId: string;             // Target space
  placement: PlacementLocation; // sidebar | inline | modal | tab
  order: number;               // Display order
  isActive: boolean;           // Currently visible
  source: PlacementSource;     // system | leader | member
  placedBy: string | null;     // Who placed it
  placedAt: Date;              // When placed
  configOverrides: Record<string, unknown>; // Space-specific config
  visibility: PlacementVisibility; // all | members | leaders
  titleOverride: string | null;
  isEditable: boolean;         // Can leaders modify
  state: Record<string, unknown>; // Runtime state
  stateUpdatedAt: Date | null;
}
```

### Deployment Targets

| Target | Description | Use Case |
|--------|-------------|----------|
| **Sidebar** | Persistent tools in space sidebar | Ongoing polls, member directory |
| **Inline** | Embedded in chat messages | Quick votes, announcements |
| **Modal** | Full-screen overlay | Complex forms, detailed views |
| **Tab** | Custom space tab | Dedicated tool pages |
| **Profile** | Widget on user profile | Personal tools, trackers |
| **Standalone** | Public URL | Shareable outside HIVE |

### Multi-Deployment

Same tool can be deployed to multiple spaces:

```typescript
// Tool definition (single source of truth)
Tool {
  id: 'tool_abc123',
  name: 'Weekly Poll',
  composition: { ... },
  createdBy: 'user_xyz'
}

// Multiple placements (space-specific instances)
PlacedTool { toolId: 'tool_abc123', spaceId: 'space_1', state: { votes: [...] } }
PlacedTool { toolId: 'tool_abc123', spaceId: 'space_2', state: { votes: [...] } }
PlacedTool { toolId: 'tool_abc123', spaceId: 'space_3', state: { votes: [...] } }
```

---

## State Management

### State Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Tool State Flow                              │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Element    │ ──▶ │   Runtime    │ ──▶ │   Firestore  │    │
│  │   Renderer   │     │   Hook       │     │   Persist    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Local      │ ◀── │   SSE        │ ◀── │   Real-time  │    │
│  │   State      │     │   Updates    │     │   Sync       │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### useToolRuntime Hook

```typescript
// apps/web/src/hooks/use-tool-runtime.ts (596 lines)

interface UseToolRuntimeReturn {
  // State
  state: Record<string, unknown>;
  isLoading: boolean;
  error: Error | null;

  // Actions
  updateState: (updates: Record<string, unknown>) => Promise<void>;
  replaceState: (state: Record<string, unknown>) => Promise<void>;
  executeAction: (actionId: string, params: Record<string, unknown>) => Promise<void>;

  // Sync
  isConnected: boolean;
  lastSyncAt: Date | null;
}

const { state, updateState, executeAction } = useToolRuntime({
  toolId: 'tool_abc123',
  placementId: 'placement_xyz', // Optional: per-placement state
  onStateChange: (newState) => { /* real-time callback */ },
  autoSave: true,           // Auto-save with debounce
  autoSaveDelay: 2000,      // 2 second debounce
});
```

### State Persistence

| Layer | Purpose | Location |
|-------|---------|----------|
| **Local** | Immediate updates, offline | IndexedDB/localStorage |
| **Server** | Persistent storage | Firestore `tools/{toolId}/state` |
| **Real-time** | Multi-user sync | Firestore listeners + SSE |

### Conflict Resolution

When multiple users update simultaneously:

1. **Last Write Wins** (default): Latest update overwrites
2. **Merge** (for arrays): Combine arrays, deduplicate
3. **Custom** (for complex state): Element-specific merge logic

---

## Templates & Marketplace

### Template System

```typescript
interface ToolTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  composition: ToolComposition;
  thumbnail: string;

  // Customization
  variables: TemplateVariable[]; // Fill-in-the-blanks

  // Metadata
  createdBy: string;
  usageCount: number;
  rating: number;
  isOfficial: boolean;
  isPublic: boolean;
}

interface TemplateVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'options' | 'date';
  defaultValue: any;
  required: boolean;
  description: string;
}
```

### Initial Template Set (10 Templates)

| Template | Elements | Category | Use Case |
|----------|----------|----------|----------|
| **Quick Poll** | `poll-element` | Engagement | Instant voting |
| **Event Signup** | `form`, `rsvp`, `countdown` | Events | Registration |
| **Weekly Check-in** | `form`, `timer`, `notification` | Engagement | Recurring |
| **Leaderboard** | `leaderboard`, `counter` | Gamification | Competition |
| **Meeting Scheduler** | `date-picker`, `user-selector` | Coordination | Scheduling |
| **Feedback Form** | `form`, `chart` | Feedback | Collect responses |
| **Announcement Board** | `announcement`, `space-feed` | Communication | Broadcasts |
| **Study Timer** | `timer`, `leaderboard` | Productivity | Focus sessions |
| **Resource Directory** | `search`, `result-list`, `filter` | Information | Curated links |
| **RSVP Tracker** | `rsvp`, `member-list`, `countdown` | Events | Attendance |

### Marketplace Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browse     │ ──▶ │   Preview    │ ──▶ │   Use        │
│   Templates  │     │   Template   │     │   Template   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            │                    ▼
                            │            ┌──────────────┐
                            │            │   Customize  │
                            │            │   Variables  │
                            │            └──────────────┘
                            │                    │
                            ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   View       │     │   Deploy     │
                     │   Details    │     │   to Space   │
                     └──────────────┘     └──────────────┘
```

---

## Analytics & Insights

### Metrics Collected

| Metric | Description | Granularity |
|--------|-------------|-------------|
| **Views** | Tool page loads | Per-tool, per-user |
| **Interactions** | Clicks, inputs, actions | Per-element |
| **Completions** | Form submissions, poll votes | Per-tool |
| **Time Spent** | Duration of engagement | Per-session |
| **Return Rate** | Users who come back | Per-user |

### Analytics Schema

```typescript
interface ToolAnalytics {
  toolId: string;
  period: 'daily' | 'weekly' | 'monthly';

  // Engagement
  views: number;
  uniqueViews: number;
  interactions: number;
  completions: number;

  // User Metrics
  avgTimeSpent: number;
  returnRate: number;

  // Element Breakdown
  elementStats: {
    [elementId: string]: {
      interactions: number;
      completions: number;
    };
  };

  // Temporal
  byHour: Record<number, number>;
  byDay: Record<string, number>;

  // User Segments
  byRole: Record<string, number>;
}
```

### Dashboard Views

**Creator Dashboard:**
- Total tools created
- Total deployments
- Aggregate engagement
- Top performing tools

**Per-Tool Analytics:**
- Views over time
- Interaction funnel
- Element heatmap
- User demographics (role-based)

---

## Integration Points

### HiveLab ↔ Spaces

```
CREATION                          DEPLOYMENT                        USAGE
─────────────────────────────────────────────────────────────────────────────

Leader opens      ──▶  Creates tool    ──▶  Deploys to      ──▶  Members see
HiveLab IDE            in canvas            space sidebar          tool

                                             │
                                             ▼
                                      PlacedTool entity
                                      created in Space
                                             │
                                             ▼
                                      State persisted
                                      per-placement
```

**API Integration:**
```typescript
// Deploy tool to space
POST /api/tools/{toolId}/deploy
{
  spaceId: 'space_xyz',
  placement: 'sidebar',
  visibility: 'members',
  configOverrides: { title: 'Custom Title' }
}

// Returns PlacedTool
{
  placementId: 'placement_abc',
  toolId: 'tool_123',
  spaceId: 'space_xyz',
  // ...
}
```

### HiveLab ↔ Profiles

```
CREATION                          OWNERSHIP                         PORTFOLIO
─────────────────────────────────────────────────────────────────────────────

Profile creates   ──▶  Tool.createdBy   ──▶  Profile.tools[]  ──▶  Public
tool                   = profileId            populated              portfolio
```

### HiveLab ↔ Feed

```
TOOL EVENT                        FEED ITEM                         DISCOVERY
─────────────────────────────────────────────────────────────────────────────

Poll closes       ──▶  Generate        ──▶  Appears in      ──▶  Members
with results           feed item             member feeds          engage
```

---

## Butterfly Effects at Scale

### At 100 Tools

**Positive Effects:**
- Template ecosystem emerges
- Cross-space tool sharing begins
- Patterns emerge for common use cases

**Challenges:**
- Discovery becomes harder
- Quality variance increases
- Support burden grows

**Mitigations:**
- Curated "Featured" section
- Quality scoring algorithm
- Self-service documentation

### At 1,000 Tools

**Positive Effects:**
- Rich template marketplace
- Campus-wide tool standards emerge
- Student developers become power users

**Challenges:**
- Performance at scale (listing, search)
- Duplicate/similar tools
- Moderation needs

**Mitigations:**
- Elasticsearch for tool search
- Duplicate detection algorithm
- Community moderation flagging

### At 10,000 Tools

**Positive Effects:**
- Platform becomes self-sustaining
- External developer ecosystem possible
- Revenue opportunities (premium elements)

**Challenges:**
- Database partitioning needed
- CDN for tool assets
- Legal/compliance (user-generated content)

**Mitigations:**
- Sharded storage by campus
- CloudFlare for assets
- Terms of service + DMCA process

### Cross-Campus Effects

When HiveLab scales to multiple campuses:

```
Campus A creates    ──▶  Published as     ──▶  Campus B       ──▶  Template
amazing tool             public template       discovers            spreads

                                                                     │
                                                                     ▼
                                                              Cross-campus
                                                              best practices
                                                              emerge
```

---

## Winter Launch Checklist

### Must Have (P0)

- [x] AI generation working reliably
- [x] Core 24 elements rendering correctly
- [x] Deployment to sidebar working
- [x] Tool state persistence
- [ ] Real analytics (not mock data)
- [ ] 10 quality templates
- [ ] Mobile-responsive canvas

### Should Have (P1)

- [ ] Undo/redo for canvas
- [ ] Template quick-start wizard
- [ ] Element connection visualization
- [ ] Deployment preview
- [ ] Export tool as JSON

### Nice to Have (P2)

- [ ] Collaboration (multi-user editing)
- [ ] Version history
- [ ] External embed code
- [ ] Webhook actions
- [ ] Custom CSS styling

### Feature Flags

```typescript
const HIVELAB_FLAGS = {
  // Core (always on)
  'hivelab.visual_canvas': { default: true },
  'hivelab.core_elements': { default: true },
  'hivelab.deployment': { default: true },
  'hivelab.ai_generation': { default: true, targets: ['space_leaders'] },

  // Winter Launch
  'hivelab.templates': { default: true },
  'hivelab.analytics_v2': { default: false, targets: ['space_leaders'] },

  // Flagged Off
  'hivelab.collaboration': { default: false },
  'hivelab.webhooks': { default: false },
  'hivelab.embed_export': { default: false },
  'hivelab.advanced_styling': { default: false },
};
```

### Success Criteria

1. Leader can describe tool in English → see working tool in **<30 seconds**
2. Visual editing feels smooth (no jank)
3. Deployment to sidebar works **first try**
4. Tools persist state correctly across sessions
5. Templates cover **80%** of common use cases

---

## API Reference

### Tool CRUD

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools` | GET | List user's tools |
| `/api/tools` | POST | Create new tool |
| `/api/tools/{toolId}` | GET | Get tool details |
| `/api/tools/{toolId}` | PATCH | Update tool |
| `/api/tools/{toolId}` | DELETE | Delete tool |

### Generation

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools/generate` | POST | AI-generate tool from prompt |

### Deployment

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools/{toolId}/deploy` | POST | Deploy to target |
| `/api/tools/deploy/{deploymentId}` | GET | Get deployment |
| `/api/tools/deploy/{deploymentId}` | DELETE | Remove deployment |

### State

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools/{toolId}/state` | GET | Get tool state |
| `/api/tools/{toolId}/state` | POST | Update state |
| `/api/tools/state/{deploymentId}` | GET | Get placement state |
| `/api/tools/state/{deploymentId}` | POST | Update placement state |

### Marketplace

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools/browse` | GET | Browse marketplace |
| `/api/tools/search` | GET | Search tools |
| `/api/tools/templates` | GET | Get templates |
| `/api/tools/{toolId}/publish-template` | POST | Publish as template |

---

*This document is the source of truth for HiveLab specifications. Update when features ship.*
