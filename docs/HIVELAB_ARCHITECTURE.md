# HIVE HiveLab Architecture Map

> Generated: January 2026
> Status: 100% Builder Complete | 70% Infrastructure Ready

---

## Executive Summary

HiveLab is a **visual tool builder** (Figma + Cursor) that allows space leaders to create custom tools without code. Users describe what they want, AI generates elements on a canvas in real-time, and they deploy to their space.

**Key Stats:**
- 27 elements across 3 access tiers
- 35 templates (8 system + 5 universal + 20+ quick templates)
- 26 API routes for tool ecosystem
- 926-line IDE component + 20+ specialized IDE subcomponents
- 701-line tool runtime hook for deployment/execution
- Rules-based AI generation (~100ms, $0 cost) with Gemini 2.0 Flash fallback

---

## 1. Data Flow Architecture

### A. Tool Creation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREATION FLOW (Browser)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Input                                                           │
│  "Create a poll for our next event location"                        │
│          ↓                                                            │
│  /api/tools/generate (POST, streaming)                              │
│          ↓                                                            │
│  AIToolGeneratorService (server-side)                               │
│  - Rules-based generator (primary, $0 cost, ~100ms)                 │
│  - Gemini 2.0 Flash fallback (if Firebase AI enabled)               │
│          ↓                                                            │
│  Streaming chunks (JSON elements)                                    │
│  { elements: [...], connections: [...] }                            │
│          ↓                                                            │
│  HiveLabIDE renders on canvas in real-time                          │
│          ↓                                                            │
│  User edits via canvas: drag/drop, properties panel, delete         │
│          ↓                                                            │
│  /api/tools (POST) or /api/tools/[toolId] (PATCH)                  │
│          ↓                                                            │
│  Firestore: tools/{toolId}                                          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### B. Tool Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              DEPLOYMENT FLOW (Browser → Space)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User clicks [Deploy]                                               │
│          ↓                                                            │
│  /api/tools/[toolId]/deploy (POST)                                  │
│  - Surface: 'sidebar' | 'posts' | 'chat' | 'widget'                │
│  - Target space ID                                                   │
│          ↓                                                            │
│  Create ToolDeployment document:                                    │
│  deployedTools/{deploymentId}                                        │
│  - composition (copy of elements + connections)                     │
│  - surface, placement, governance                                    │
│  - capabilities, budgets, trust tier                                │
│          ↓                                                            │
│  Create sharedState subcollection:                                  │
│  deployedTools/{deploymentId}/sharedState/current                   │
│  - counters: {} (for polls, votes)                                  │
│  - collections: {} (for RSVPs, attendees)                           │
│  - timeline: [] (activity log)                                       │
│          ↓                                                            │
│  Create reference in space:                                          │
│  spaces/{spaceId}/tools/{toolId}                                    │
│          ↓                                                            │
│  Render in Space UI via ToolCanvas component                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### C. Tool Execution Flow (Runtime)

```
┌─────────────────────────────────────────────────────────────────────┐
│            TOOL EXECUTION FLOW (Deployed Tool)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User interacts with deployed tool element                          │
│  (clicks poll option, submits form, toggles RSVP)                  │
│          ↓                                                            │
│  useToolRuntime.executeAction(elementId, action, payload)           │
│          ↓                                                            │
│  /api/tools/execute (POST)                                          │
│          ↓                                                            │
│  Update sharedState (aggregate data):                               │
│  deployedTools/{deploymentId}/sharedState/current                   │
│  - counters (vote count += 1)                                       │
│  - collections (RSVP attendees list)                                │
│          ↓                                                            │
│  Update userState (per-user data):                                  │
│  toolStates/{deploymentId}_{userId}                                 │
│  - selections (which option user voted for)                         │
│  - participation (has user voted?)                                  │
│          ↓                                                            │
│  Return: { success, sharedStateUpdate, userStateUpdate }            │
│          ↓                                                            │
│  If realtime enabled: Subscribe to RTDB for live sync              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Routes (26 Endpoints)

### Creation & Editing
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools` | GET | List user's tools |
| `/api/tools` | POST | Create new tool |
| `/api/tools/[toolId]` | GET | Fetch tool |
| `/api/tools/[toolId]` | PATCH | Update tool |
| `/api/tools/[toolId]` | DELETE | Delete tool |
| `/api/tools/generate` | POST | **AI generation (streaming)** |
| `/api/tools/personal` | GET | User's own tools |

### Deployment & Execution
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/deploy` | POST | Deploy tool to space |
| `/api/tools/[toolId]/deploy` | POST | Deploy specific tool |
| `/api/tools/deploy/[deploymentId]` | GET/PATCH/DELETE | Manage deployment |
| `/api/tools/execute` | POST | **Execute tool action** |
| `/api/tools/[toolId]/state` | GET/POST | Get/set tool state |
| `/api/tools/state/[deploymentId]` | GET/POST | Deployment state |

### Discovery & Sharing
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/browse` | GET | Browse marketplace |
| `/api/tools/search` | GET | Search tools |
| `/api/tools/recommendations` | GET | AI recommendations |
| `/api/tools/install` | POST | Install from marketplace |
| `/api/tools/[toolId]/share` | POST | Share tool |
| `/api/tools/publish` | POST | Publish to marketplace |
| `/api/tools/[toolId]/publish-template` | POST | Save as template |

### Analytics
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/[toolId]/analytics` | GET | Tool usage analytics |
| `/api/tools/usage-stats` | GET | Platform stats |

---

## 3. Domain Layer (DDD)

### Key Types

**ToolComposition**
```typescript
interface ToolComposition {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];        // Visual elements on canvas
  connections: ElementConnection[];  // Data flow between elements
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

interface CanvasElement {
  elementId: string;        // e.g., 'poll-element', 'countdown-timer'
  instanceId: string;       // Unique instance on canvas
  config: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}
```

**State Architecture**
```typescript
// Shared state: Visible to ALL users (aggregate data)
interface ToolSharedState {
  counters: Record<string, number>;           // Vote counts, etc.
  collections: Record<string, Record<string, ToolSharedEntity>>;
  timeline: ToolTimelineEvent[];              // Activity log
  computed: Record<string, unknown>;          // Derived values
  version: number;
}

// User state: Per-user personalization
interface ToolUserState {
  selections: Record<string, unknown>;        // What user chose
  participation: Record<string, boolean>;     // Has user participated?
  personal: Record<string, unknown>;          // Form drafts
  ui: Record<string, unknown>;                // UI state
}
```

**Capabilities (Governance)**
```typescript
interface ToolCapabilities {
  read_space_context: boolean;      // Can read space name, description
  read_space_members: boolean;      // Can access member list
  write_shared_state: boolean;      // Can update poll votes, RSVPs
  create_posts: boolean;            // Can post to space
  send_notifications: boolean;      // Can send notifications
  trigger_automations: boolean;     // Can trigger workflows
}
```

---

## 4. Element System (27 Elements)

### Tier 1: Universal (15 Elements)
No HIVE data needed. User provides all data.

| Element | Category | Purpose |
|---------|----------|---------|
| `search-input` | input | Text search |
| `filter-selector` | filter | Multi-select filtering |
| `date-picker` | input | Date/time selection |
| `form-builder` | input | Dynamic form creation |
| `result-list` | display | Paginated item list |
| `tag-cloud` | display | Weighted tag visualization |
| `map-view` | display | Geographic map |
| `chart-display` | display | Bar/line/pie charts |
| `countdown-timer` | display | Live countdown |
| `poll-element` | action | Voting/polls |
| `leaderboard` | display | Ranked standings |
| `markdown-element` | display | Rich text content |
| `image-element` | display | Image display |
| `button-element` | action | Action buttons |
| `user-selector` | input | User picker |

### Tier 2: Connected (5 Elements)
Public HIVE data. Everyone can use.

| Element | Data Source | Purpose |
|---------|-------------|---------|
| `event-picker` | campus-events | Browse/filter events |
| `space-picker` | campus-spaces | Browse spaces |
| `rsvp-element` | space-events | RSVP with attendance |
| `member-list` | campus-users | Display members |
| `user-selector` | campus-users | Search users |

### Tier 3: Space (7 Elements)
Private space data. Leaders only.

| Element | Data Source | Purpose |
|---------|-------------|---------|
| `space-stats` | space-stats | Member count, online status |
| `space-events` | space-events | Upcoming space events |
| `space-members` | space-members | Space member list |
| `space-feed` | space-feed | Recent posts |
| `tool-list` | space-tools | Deployed tools |
| `member-activity` | space-stats | Activity timeline |
| `space-announcements` | space-feed | Pinned announcements |

---

## 5. Template System (35 Templates)

### System Templates (8)
Pre-built sidebar tools for spaces.

| Template | Purpose |
|----------|---------|
| `system:about` | Space description |
| `system:events` | Upcoming events |
| `system:members` | Member list |
| `system:tools` | Space tools |
| `system:poll` | Quick poll |
| `system:countdown` | Countdown timer |
| `system:leaderboard` | Rankings |
| `system:announcements` | Pinned posts |

### Universal Templates (5)
Layouts for quick composition.

| Template | Purpose |
|----------|---------|
| `search-results` | Search + results list |
| `filtered-table` | Filter + table |
| `poll-with-leaderboard` | Poll + rankings |
| `event-rsvp-flow` | Event picker + RSVP |
| `signup-form` | User registration |

### Quick Templates (20+)
One-click deployment from sidebar.

- Quick Poll, Event Countdown, Quick Links
- Study Group Signup, Trivia Game
- Member Directory, Event RSVP
- Feedback Form, Leaderboard
- And more...

---

## 6. Frontend IDE Architecture

### Component Hierarchy

```
hivelab-ide.tsx (926 lines) - Main orchestrator
├── Header Bar (title, save/deploy)
├── Left Rail (Element Palette)
│   └── Tab: Universal | Connected | Space | Templates
├── CENTER (Canvas Area)
│   ├── ide-canvas.tsx (drag-drop, snap, guides)
│   └── ai-command-palette.tsx (⌘K interface)
├── Right Panel (Properties)
│   ├── properties-panel.tsx (config editor)
│   ├── layers-panel.tsx (hierarchy)
│   └── contextual-inspector.tsx
└── Helpers
    ├── smart-guides.tsx
    ├── use-ide-keyboard.ts
    └── template-gallery.tsx
```

### Key IDE Features

- **Canvas**: Drag-drop, resize, snap-to-grid, smart guides
- **AI**: ⌘K opens command palette, streaming generation
- **Properties**: Schema-driven forms, live preview
- **Keyboard**: Undo/redo (50 entries), shortcuts

---

## 7. Runtime & State Management

### useToolRuntime Hook (701 lines)

```typescript
interface UseToolRuntimeReturn {
  tool: Tool | null;
  userState: ToolState;
  sharedState: ToolSharedState;
  isLoading: boolean;
  isExecuting: boolean;
  isRealtimeConnected: boolean;

  executeAction(elementId, action, payload): Promise<ActionResult>;
  updateState(updates): void;
  saveState(): Promise<void>;
  reset(): void;
}
```

**Features:**
- Auto-save with debounce (2s default)
- Optimistic UI updates
- Real-time sync via Firebase RTDB
- Retry logic (3 attempts)

---

## 8. Key Files by Layer

### Domain Layer
| File | Lines | Purpose |
|------|-------|---------|
| `tool-composition.types.ts` | 255 | Core types |
| `element-registry.ts` | 700+ | 27 element definitions |
| `system-tool-templates.ts` | 500+ | 8 system templates |
| `capabilities.ts` | 500+ | Governance & budgets |

### Application Layer
| File | Purpose |
|------|---------|
| `ai-tool-generator.service.ts` | AI generation orchestration |
| `composition-validator.service.ts` | Tool validation |
| `automation-executor.service.ts` | Workflow execution |

### Frontend
| File | Lines | Purpose |
|------|-------|---------|
| `hivelab-ide.tsx` | 926 | Main IDE component |
| `ai-command-palette.tsx` | 473 | ⌘K interface |
| `element-renderers.tsx` | 400+ | Element dispatch |
| `element-system.ts` | 1,102 | Element registry |
| `use-tool-runtime.ts` | 701 | Runtime hook |

---

## 9. Firestore Collections

```
tools/{toolId}
├── composition, metadata, creator info
└── versions/ (version history)

deployedTools/{deploymentId}
├── toolId, spaceId, surface, placement
├── composition (copy), capabilities, budgets
└── sharedState/current
    ├── counters, collections, timeline
    └── version, lastModified

toolStates/{deploymentId}_{userId}
├── selections, participation
├── personal, ui
└── updatedAt

spaces/{spaceId}/tools/{toolId}
├── deploymentId, surface, order
```

---

## 10. Deployment Surfaces

| Surface | Description |
|---------|-------------|
| **Space Sidebar** | Persistent panel, visible to all members |
| **Chat Posts** | Single element inline in message |
| **Profile Widget** | Personal bento grid (5-8 tools) |
| **Standalone Page** | Full-page at /tools/{toolId} |
| **Event Details** | Tool in event description |

---

## 11. Performance

| Metric | Limit |
|--------|-------|
| Max elements per tool | 50 |
| Max connections per tool | 100 |
| Practical canvas elements | 30 |
| State size per deployment | 1MB |
| Concurrent tool users | 100/space |

**Optimizations:**
- Rules-based generation (no API calls, ~100ms)
- Debounced auto-save
- Optimistic UI updates
- Atomic Firestore operations
- Real-time only for shared state

---

## 12. AI Generation

### Two-Tier System

**Primary: Rules-Based (~100ms, $0)**
```typescript
// mock-ai-generator.ts
// Pattern matching + template expansion
// Handles 80% of common tool requests
```

**Fallback: Gemini 2.0 Flash**
```typescript
// firebase-ai-generator.ts
// Used for complex/novel requests
// Streaming response
```

### Generation Flow
1. User types in ⌘K palette
2. Rules-based generator tries first
3. If no match, falls back to Gemini
4. Streaming JSON chunks to canvas
5. Elements appear in real-time

---

*Last updated: January 2026*
