# HiveLab — Complete Specification

> **One-Sentence Definition**: HiveLab is a governed runtime that lets students install and evolve systems inside HIVE—so communities and individuals can run themselves without losing memory, structure, or control.

---

## Part 1: What HiveLab Is

### 1.1 The Core Identity

**HiveLab is infrastructure, not a feature.**

It allows:
- Groups to encode how they operate
- Individuals to encode how they work
- Systems to persist across time, leadership, and context

HiveLab is NOT:
- A no-code app builder
- A template gallery
- An AI toy
- A feature bolted onto Spaces

### 1.2 The Problem It Solves

Campus life today runs on:
- Fragmented apps
- Manual coordination
- Undocumented norms
- Knowledge that resets every semester

Students don't lack motivation. They lack **systems they're allowed to own**.

### 1.3 What HiveLab Gives Students

- Define behavior
- Persist memory
- Enforce structure
- Automate continuity

...inside the communities they already belong to.

---

## Part 2: Mental Model

### 2.1 The Hierarchy

```
ATOMS          →    SYSTEMS       →    SETUPS
(Elements)          (Compositions)      (Operating Patterns)
```

| Level | What It Is | Example |
|-------|------------|---------|
| **Element** | Single building block | Poll, Timer, Form |
| **System** | Composed elements with state | Recruiting Pipeline |
| **Setup** | Bundle of systems with defaults | "How Greek Life Runs" |

### 2.2 The User Spectrum

| User Type | What They Do | What They Experience |
|-----------|--------------|---------------------|
| **Member** | Votes, RSVPs, interacts | "This space has cool tools" |
| **Leader** | Installs Setups, customizes | "I set up our system" |
| **Builder** | Composes from scratch | "I built this from elements" |

**Everyone can build.** But most won't need to.

---

## Part 3: The Three Surfaces

Every HiveLab system can appear on three surfaces:

### 3.1 Widget Surface

- Lives in Space sidebar (or Profile sidebar)
- Optimized for fast interaction
- Collapsed by default
- Shows summaries, actions, counts

**Use cases:** Polls, RSVPs, counters, quick actions, previews

### 3.2 App Surface

- Full-screen page
- URL-addressable (`hive.app/tools/xyz`)
- Same system, deeper interaction
- Accessed via "View Full"

**Use cases:** Application review, meeting notes, dashboards, pipelines

### 3.3 Setup Surface

- Installable bundle of systems
- Defines "how this runs"
- Opinionated defaults
- Fully customizable

**Use cases:** Recruiting, meetings, event ops, onboarding, personal OS

---

## Part 4: Element System

### 4.1 Element Tiers

Elements are tiered for **privacy + trust**, not creativity.

#### Universal Tier (15 elements) — Everyone

No private data access. Pure UI, inputs, displays, actions.

| Element | Category | Description |
|---------|----------|-------------|
| `poll-element` | action | Voting/polls |
| `countdown-timer` | display | Live countdown |
| `form-builder` | input | Dynamic form creation |
| `leaderboard` | display | Ranked standings |
| `chart-display` | display | Bar, line, pie charts |
| `search-input` | input | Text search with autocomplete |
| `filter-selector` | filter | Multi-select filtering |
| `result-list` | display | Paginated item list |
| `date-picker` | input | Date/time selection |
| `tag-cloud` | display | Weighted tag visualization |
| `map-view` | display | Geographic map |
| `markdown-element` | display | Rich text content |
| `image-element` | display | Image display |
| `button-element` | action | Action buttons |
| `tabs-element` | layout | Tabbed content |

#### Connected Tier (5 elements) — Public HIVE Data

| Element | Category | Data Source |
|---------|----------|-------------|
| `event-picker` | input | campus-events |
| `user-selector` | input | campus-users |
| `space-picker` | input | campus-spaces |
| `rsvp-button` | action | user-connections |
| `calendar-view` | display | user-events |

#### Space Tier (7 elements) — Private Space Data

Requires leader permission. Scoped to a single Space.

| Element | Category | Data Source |
|---------|----------|-------------|
| `member-list` | display | space-members |
| `member-selector` | input | space-members |
| `space-events` | display | space-events |
| `space-feed` | display | space-feed |
| `space-stats` | display | space-stats |
| `announcement` | display | space-announcements |
| `role-gate` | layout | space-roles |

### 4.2 Element Definition Schema

```typescript
interface ElementDefinition {
  id: string;
  name: string;
  description: string;
  category: 'input' | 'display' | 'filter' | 'action' | 'layout';
  tier: 'universal' | 'connected' | 'space';
  dataSource: DataSource;
  icon: string;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  render: (props: ElementProps) => JSX.Element;
}
```

---

## Part 5: State Model

Every deployment has **two state layers**.

### 5.1 Shared State

- Visible to everyone
- Conflict-aware
- Supports sharded writes for high throughput

**Used for:**
- Votes
- RSVPs
- Counters
- Leaderboards
- Shared collections

### 5.2 User State

- Private per user
- No conflicts

**Used for:**
- Selections
- Drafts
- Participation flags
- UI preferences

**Rule:** Shared state represents *reality*. User state represents *experience*.

### 5.3 State Persistence

```typescript
// Tool Runtime Hook
const {
  tool,           // Tool definition
  state,          // Current state (shared + user)
  isLoading,
  isExecuting,
  isSaving,
  isSynced,
  lastSaved,
  error,
  executeAction,  // Execute element action
  updateState,    // Partial state update
  saveState,      // Force save
  reset,          // Reset to initial
  reload          // Reload tool and state
} = useToolRuntime({
  toolId: "tool_123",
  spaceId: "space_abc",
  placementId: "sidebar_1",
  autoSave: true,
  autoSaveDelay: 2000
});
```

---

## Part 6: Capability Governance

HiveLab does not allow unlimited power. Every system operates in a **capability lane**.

### 6.1 Capability Lanes

| Lane | What It Allows |
|------|----------------|
| **SAFE** | UI + state only |
| **SCOPED** | Read space context + members |
| **POWER** | Create posts, send notifications |
| **OBJECTS** | Read/write specific data types |

### 6.2 Trust Tiers

Capabilities are gated by trust:

| Trust Level | Allowed Lanes |
|-------------|---------------|
| **Unverified** | SAFE |
| **Community** | SAFE, SCOPED |
| **Verified** | SAFE, SCOPED, POWER |
| **System** | All (HIVE only) |

### 6.3 Budgets

Every deployment has limits:

| Budget | Default | Purpose |
|--------|---------|---------|
| Notifications/day | 10 | Prevent spam |
| Posts/day | 5 | Prevent abuse |
| Executions/hour | 100 | Rate limiting |
| AI generations/minute | 10 | Cost control |

---

## Part 7: Deployment Model

A **Deployment** is the atomic unit of execution.

Same system → many deployments. Each deployment has:
- Its own state
- Its own permissions
- Its own budgets
- Its own surfaces (widget/app)
- Its own lifecycle

### 7.1 Deployment Targets

```typescript
type DeploymentTarget =
  | 'space_sidebar'    // Persistent in space sidebar
  | 'space_inline'     // Interactive in chat
  | 'profile_widget'   // Personal profile widget
  | 'standalone';      // Public shareable page
```

### 7.2 Deployment ID Format

```
space:{spaceId}_{placementId}     // Space deployment
profile:{userId}_{widgetId}       // Profile widget
standalone:{toolId}               // Public page
```

### 7.3 Deployment Schema

```typescript
interface Deployment {
  id: string;              // Composite deployment ID
  toolId: string;
  target: DeploymentTarget;
  targetId: string;        // spaceId, userId, or toolId
  placementId?: string;    // Position within target
  state: Record<string, unknown>;
  budgets: BudgetConfig;
  capabilities: CapabilityLane[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

---

## Part 8: Setups

### 8.1 What a Setup Is

A **Setup** is a pre-configured operating pattern.

It defines:
- Which systems exist
- How they're arranged
- Default permissions
- Implied norms

It answers: **"How does this Space (or person) run?"**

### 8.2 Setup Scopes

| Scope | Meaning | Example |
|-------|---------|---------|
| **Space** | Group operating system | "Recruiting Setup" |
| **Profile** | Personal operating system | "My Productivity OS" |
| **Campus** | Shared moment/ritual | "Finals Week Survival" |

### 8.3 Snapshot Semantics

- Installing a Setup creates a local copy
- No live coupling to source
- Optional updates later
- Safe remix

### 8.4 Example Setups

| Setup | Systems Included |
|-------|------------------|
| **Recruiting** | Application form, Pipeline tracker, Interview scheduler, Decision board |
| **Meetings** | Agenda builder, Attendance tracker, Notes template, Action items |
| **Events** | RSVP system, Countdown, Check-in, Photo wall |
| **Onboarding** | Welcome flow, Resource links, Mentor matching, Progress tracker |
| **Personal OS** | Daily planner, Goal tracker, Reading list, Habit streaks |

---

## Part 9: AI Generation

### 9.1 Generation Flow

```
User prompt
    ↓
"/api/tools/generate" (streaming)
    ↓
Gemini 2.0 Flash
    ↓
NDJSON chunks:
  • { type: 'thinking', data: { step } }     → Show progress
  • { type: 'element', data: { element } }   → Add to canvas
  • { type: 'metadata', data: { name } }     → Set tool name
  • { type: 'complete', data: { tool } }     → Generation done
  • { type: 'error', data: { error } }       → Handle error
```

### 9.2 Generation Context

```typescript
interface GenerationContext {
  userId: string;
  sessionId: string;
  campusId: string;
  spaceContext?: {
    spaceId: string;
    spaceName: string;
    spaceType: string;
  };
  existingComposition?: {
    elements: Element[];
    name: string;
  }; // For iterations
}
```

### 9.3 Example Prompts

| Prompt | Result |
|--------|--------|
| "Create a poll for our next event location" | Poll element with options |
| "Add a countdown to finals week" | Countdown timer |
| "Make the options Lockwood, Union, Capen" | Updates existing poll |
| "Build a study group signup" | Form + member list + calendar |

---

## Part 10: IDE & Creation Experience

### 10.1 IDE Layout

```
┌────────────┬──────────────────────────────┬─────────────────────┐
│ ELEMENT    │                              │   PROPERTIES        │
│ PALETTE    │         CANVAS               │   PANEL             │
│            │                              │                     │
│ Universal  │   ┌─────────────────────┐   │   Config:           │
│ - Poll     │   │     Poll Element    │   │   - Question        │
│ - Timer    │   │  ┌───────────────┐  │   │   - Options         │
│ - Form     │   │  │ What time?    │  │   │   - Allow Multiple  │
│ ...        │   │  │ ○ 3pm        │  │   │   - Show Results    │
│            │   │  │ ○ 5pm        │  │   │                     │
│ Connected  │   │  └───────────────┘  │   │   Position:         │
│ - Events   │   └─────────────────────┘   │   - x: 120          │
│ - Users    │                              │   - y: 80           │
│            │   [ snap grid | zoom | pan ] │                     │
│ Space      │                              │   Actions:          │
│ - Members  │                              │   - Lock            │
│ - Stats    │                              │   - Duplicate       │
│            │                              │   - Delete          │
└────────────┴──────────────────────────────┴─────────────────────┘
│ AI: "Create a countdown to finals week"            [⌘K to open] │
└─────────────────────────────────────────────────────────────────┘
│ [Cancel]                                [Preview] [Save] [Deploy] │
```

### 10.2 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Open AI command palette |
| `⌘S` | Save tool |
| `⌘Z` | Undo |
| `⌘⇧Z` | Redo |
| `⌘A` | Select all elements |
| `⌘C` | Copy selected |
| `⌘V` | Paste |
| `⌘D` | Duplicate selected |
| `Delete` | Delete selected |
| `Escape` | Clear selection |
| `Space` (hold) | Pan canvas |
| `⌘+` / `⌘-` | Zoom in/out |

### 10.3 Canvas Features

- Snap grid alignment
- Smart guides
- Multi-select (shift+click, lasso)
- Connection wires between elements
- Viewport virtualization (60fps at scale)

---

## Part 11: Quick Templates

### 11.1 Available Templates (20)

| Template | Description |
|----------|-------------|
| Quick Poll | Simple voting |
| Event Countdown | Timer to event |
| Quick Links | Resource shortcuts |
| Study Group Signup | Form + scheduling |
| Announcements | Broadcast messages |
| Meeting Notes | Structured notes |
| Office Hours | Queue management |
| Leaderboard | Ranked standings |
| Event RSVP | Signup + waitlist |
| Member Spotlight | Featured profiles |
| Feedback Form | Structured feedback |
| Decision Maker | Weighted voting |
| Progress Tracker | Milestone tracking |
| Meeting Agenda | Structured agendas |
| Budget Overview | Financial tracking |
| Weekly Update | Status reports |
| Application Form | Recruiting intake |
| Interview Scheduler | Calendar booking |
| Task Board | Kanban-style tasks |
| Resource Library | File/link collection |

---

## Part 12: API Routes (28 endpoints)

### 12.1 Core Routes

```
/api/tools
├── GET                    # List tools
├── POST                   # Create tool
├── /generate              # AI generation (streaming)
├── /execute               # Execute action
├── /deploy                # Deploy to target
├── /publish               # Publish to marketplace
├── /browse                # Marketplace browse
├── /search                # Tool search
├── /personal              # User's own tools
└── /recommendations       # AI recommendations
```

### 12.2 Tool-Specific Routes

```
/api/tools/[toolId]
├── GET/PATCH/DELETE       # Tool CRUD
├── /state                 # GET/POST tool state
├── /with-state            # Combined (optimization)
├── /deploy                # Deploy this tool
├── /analytics             # Tool analytics
├── /reviews               # Tool reviews
├── /share                 # Share tool
└── /upload-asset          # Upload images/files
```

### 12.3 Deployment Routes

```
/api/tools/deploy/[deploymentId]    # Deployment CRUD
/api/tools/state/[deploymentId]     # Deployment state
```

---

## Part 13: Database Schema

### 13.1 Collections

```
tools/{toolId}
├── id, name, description
├── elements: ToolElement[]
├── connections: Connection[]
├── layout: 'grid' | 'flow' | 'tabs' | 'sidebar'
├── status: 'draft' | 'preview' | 'published'
├── creatorId, campusId
├── metadata: { generatedBy, aiSessionId, iterationCount }
└── createdAt, updatedAt

toolDeployments/{deploymentId}
├── id (composite: "space:spaceId_placementId")
├── toolId, target, targetId, placementId
├── state: object
├── budgets: BudgetConfig
├── capabilities: CapabilityLane[]
└── createdAt, updatedAt, createdBy

toolTemplates/{templateId}
├── id, toolId, name, description
├── category, suggestedFor[], difficulty
├── elements: ToolElement[]
├── isOfficial, usageCount, rating
└── createdBy, publishedAt
```

---

## Part 14: Security

### 14.1 Element Tier Enforcement

```typescript
const SPACE_TIER_ELEMENTS = [
  'member-list', 'member-selector', 'space-events',
  'space-feed', 'space-stats', 'announcement', 'role-gate'
];

if (SPACE_TIER_ELEMENTS.includes(elementId) && !userContext?.isSpaceLeader) {
  return; // Element not added
}
```

### 14.2 Deployment Permissions

- Only space leaders can deploy to space sidebar
- Only profile owners can deploy to their profile
- Anyone can deploy to standalone (public page)

### 14.3 Rate Limiting

- AI generation: 10/minute per user
- Action execution: 100/hour per deployment
- State saves: Debounced at 2s

---

## Part 15: Scaling

**Grade: A** (Infrastructure built, activation required)

### 15.1 Built-In Scaling

| Component | Status | Capacity |
|-----------|--------|----------|
| Counter sharding | ✅ Built | 200+ writes/sec |
| Collection extraction | ✅ Built | Unlimited |
| RTDB real-time broadcast | ✅ Built | Eliminates polling |

### 15.2 Activation

```bash
# Enable before beta
USE_SHARDED_COUNTERS=true
USE_EXTRACTED_COLLECTIONS=true
USE_RTDB_BROADCAST=true
```

### 15.3 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| AI generation time | < 5s | ~3s ✅ |
| Canvas FPS | 60fps | 60fps ✅ |
| State save latency | < 200ms | ~150ms ✅ |
| Tool load time | < 500ms | ~400ms ✅ |

---

## Part 16: Core Invariants

These rules cannot be broken:

1. **HiveLab is infrastructure, not a feature**
2. **Power is composable, not hard-coded**
3. **Governance is explicit and server-enforced**
4. **Systems persist across time**
5. **Setups encode behavior, not UI**
6. **Users experience systems, not builders**
7. **The ceiling must stay infinite**

---

## Part 17: File Structure

### 17.1 Pages & Routes

```
apps/web/src/app/hivelab/
├── page.tsx                    # HiveLab home
├── [toolId]/page.tsx           # Edit tool
├── [toolId]/preview/page.tsx   # Preview mode
└── new/page.tsx                # Create new

apps/web/src/app/tools/
└── [toolId]/page.tsx           # Standalone page
```

### 17.2 UI Components

```
packages/ui/src/components/hivelab/
├── ide/
│   ├── hivelab-ide.tsx         # Main IDE (700+ lines)
│   ├── ide-canvas.tsx          # Canvas with drag-drop
│   ├── element-palette.tsx     # Left panel
│   ├── properties-panel.tsx    # Right panel
│   └── ai-command-palette.tsx  # ⌘K AI input
├── element-renderers.tsx       # Central render registry
├── tool-canvas.tsx             # Deployed tool canvas
└── ToolDeployModal.tsx         # Deployment modal
```

### 17.3 Element System

```
packages/ui/src/lib/hivelab/
├── element-system.ts           # Core registry (27 elements)
├── quick-templates.ts          # 20 templates
└── automation-types.ts         # Automation definitions
```

### 17.4 Hooks

```
apps/web/src/hooks/
├── use-tool-runtime.ts         # Execution & state (592 lines)
└── use-streaming-generation.ts # AI streaming
```

---

## Part 18: Success Metrics

### Creation

| Metric | Target |
|--------|--------|
| Time to first tool | < 2 min |
| AI accuracy (first-try) | 80% |
| Tool save rate | 70% |
| Deploy rate | 50% of saved |

### Engagement

| Metric | Target |
|--------|--------|
| Tools per leader | 2+/month |
| Actions per deployed tool | 10+/week |
| Tool remix rate | 20% |
| Setup install rate | 40% of new spaces |

---

## Part 19: Implementation Status

### What's Built (Verified Jan 3, 2026)

| Component | Spec | Actual | Status |
|-----------|------|--------|--------|
| Universal Elements | 15 | 15 | ✅ Complete |
| Connected Elements | 5 | 5 | ✅ Complete |
| Space Elements | 7 | 7 | ✅ Complete |
| **Total Elements** | **27** | **27** | ✅ Complete |
| Quick Templates | 20 | 20 | ✅ Complete |
| API Routes | 28 | 26 | ✅ Sufficient |
| IDE (Canvas/Palette/Properties) | Yes | Yes | ✅ Complete |
| AI Generation (Gemini 2.0) | Yes | Yes | ✅ Complete |
| State Model (Shared + User) | Yes | Yes | ✅ Complete |
| Real-time Sync (RTDB) | Yes | Yes | ✅ Complete |
| Deploy to Spaces | Yes | Yes | ✅ Complete |
| Tool Runtime Hook | Yes | Yes | ✅ Complete |

### What's Not Built (Governed Runtime Gaps)

| Component | Status | Impact | Priority |
|-----------|--------|--------|----------|
| **Setups** (installable bundles) | ❌ Not built | Can't "install operating patterns" | P1 - Differentiator |
| **Setup Gallery** | ❌ Not built | No Setup discovery | P1 |
| **Profile Deployment** | ❌ Not built | Tools deploy to Spaces only | P2 |
| **Widget Collapsed Mode** | ❌ Not built | No summary view in sidebar | P2 |
| **Budget System UI** | ❌ Not built | Budgets defined but not enforced | P3 |
| **Tier Governance UI** | ❌ Not built | Trust tiers not visible | P3 |

### Completion Assessment

| Framing | Completion |
|---------|------------|
| **HiveLab as "visual tool builder"** | 100% ✅ |
| **HiveLab as "governed runtime infrastructure"** | 70% |

The **builder experience** is complete and production-ready.

The **infrastructure experience** (Setups, governance, Profile deployment) is the differentiator that transforms HiveLab from "tool builder" into "campus infrastructure."

### Launch Recommendation

**Launch with builder. Ship Setups in Phase 2.**

What works now:
- Leaders can build tools from elements or AI
- Tools deploy to Space sidebars
- State persists and syncs in real-time
- 20 templates for quick deployment

What to build next:
1. **Greek Recruiting Setup** - Proof of "installable operating pattern"
2. **Setup Install Flow** - One-click bundle installation
3. **Profile Widgets** - Personal deployment surface

---

## Summary

**HiveLab is a governed runtime that lets students install and evolve systems inside HIVE.**

- **27 elements** across 3 tiers
- **3 surfaces**: Widget ✅, App ✅, Setup ❌
- **Capability governance**: Lanes ✅, Tiers (partial), Budgets ❌
- **State model**: Shared + User ✅
- **AI generation**: Gemini 2.0 Flash streaming ✅
- **20 templates**, **26 API routes**
- **Scaling: Grade A**

The visual builder is the **on-ramp**. ✅ Complete.
The governed runtime is the **foundation**. 70% Complete.
The ceiling is **infinite**.

---

*Last updated: January 3, 2026*
*Builder Status: 100% Complete - Ready for Launch*
*Infrastructure Status: 70% Complete - Setups needed for full vision*
