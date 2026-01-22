# HiveLab → Spaces Handoff Architecture

**Last Updated:** December 2025

---

## Overview

HiveLab is where tools are **created**. Spaces is where tools are **used**.

The handoff between these systems involves:
1. **Tool** (HiveLab definition) → **PlacedTool** (Space instance) → **Runtime** (execution)
2. Space taxonomy (type, governance) affects what tools are suggested and who can deploy
3. AI generation uses space context to create relevant tools

---

## The Handoff Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         HIVELAB                                  │
│                                                                 │
│   ┌─────────────────┐                                           │
│   │   Tool Entity   │  Definition: elements, connections, config│
│   │   (template)    │  Status: draft → published → archived     │
│   └────────┬────────┘                                           │
│            │                                                     │
│            │ Deploy                                              │
│            ▼                                                     │
└────────────┼────────────────────────────────────────────────────┘
             │
             │ POST /api/tools/deploy
             │ POST /api/spaces/[spaceId]/tools
             │
┌────────────┼────────────────────────────────────────────────────┐
│            ▼                         SPACES                      │
│   ┌─────────────────┐                                           │
│   │  PlacedTool     │  Instance: placement, config, state       │
│   │  (instance)     │  Locations: sidebar | inline | modal | tab │
│   └────────┬────────┘                                           │
│            │                                                     │
│            │ Runtime Execution                                   │
│            ▼                                                     │
│   ┌─────────────────┐                                           │
│   │  useToolRuntime │  Actions, state updates, auto-save        │
│   │  (execution)    │  Cascading element updates                │
│   └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Space Taxonomy Impact on HiveLab

### Space Types Drive Template Suggestions

| Space Type | Default Tools | Suggested Templates |
|------------|--------------|---------------------|
| **UNI** | Announcements, Events | targeted-broadcast, engagement-tracker |
| **STUDENT** | Poll, Calendar, Links | meeting-scheduler, attendance-tracker |
| **GREEK** | Points tracker | rush-ranker, hour-logger, chapter-points |
| **RESIDENTIAL** | Floor poll, Intro | neighbor-matcher, floor-traditions |

### Governance Controls Who Can Deploy

| Governance | Who Can Deploy to Sidebar | Who Can Use Inline |
|------------|--------------------------|-------------------|
| **Flat** | Any member | Any member |
| **Emergent** | Contributors (earned) | Any member |
| **Hybrid** | Leaders + active contributors | Any member |
| **Hierarchical** | Owner, Admins only | Any member |

### AI Generation Context

When AI generates tools, it receives space context:

```typescript
interface AIToolGenerationContext {
  // Space taxonomy (new fields)
  spaceType: 'uni' | 'student' | 'greek' | 'residential';
  governance: 'flat' | 'emergent' | 'hybrid' | 'hierarchical';
  status: 'unclaimed' | 'active' | 'claimed' | 'verified';

  // Space metadata
  spaceCategory: string;  // e.g., "Greek Life", "Academic"
  memberCount: number;
  hasOwner: boolean;

  // Existing tools (avoid duplicates)
  existingTools: string[];

  // Recent activity context
  recentActivity: string[];

  // User intent
  prompt: string;

  // AI suggestions based on type
  suggestedElements: string[];
  suggestedTemplates: string[];
}
```

---

## Entities & Relationships

### Tool (HiveLab Definition)

```typescript
// packages/core/src/domain/creation/tool.ts
interface Tool {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'published' | 'archived';

  // Composition
  elements: Element[];       // What the tool contains
  connections: Connection[]; // How elements relate

  // Metadata
  creatorId: string;
  category: string;
  tags: string[];

  // Analytics
  deploymentCount: number;
  rating: number;
}
```

### PlacedTool (Space Instance)

```typescript
// packages/core/src/domain/spaces/entities/placed-tool.ts
interface PlacedTool {
  id: string;              // placement_uuid
  toolId: string;          // Reference to Tool
  spaceId: string;         // Reference to Space

  // Placement
  placement: 'sidebar' | 'inline' | 'modal' | 'tab';
  order: number;
  isActive: boolean;

  // Source
  source: 'system' | 'leader' | 'member';
  placedBy: string | null;
  placedAt: Date;

  // Configuration
  configOverrides: Record<string, unknown>;
  visibility: 'all' | 'members' | 'leaders';
  titleOverride: string | null;
  isEditable: boolean;

  // Runtime state
  state: Record<string, unknown>;  // votes, submissions, etc.
  stateUpdatedAt: Date | null;
}
```

### EnhancedSpace (Container)

```typescript
// packages/core/src/domain/spaces/aggregates/enhanced-space.ts
class EnhancedSpace {
  // New taxonomy fields
  spaceType: SpaceType;      // uni, student, greek, residential
  governance: GovernanceModel; // flat, emergent, hybrid, hierarchical
  status: SpaceStatus;       // unclaimed, active, claimed, verified
  source: SpaceSource;       // ublinked, user-created

  // Tool collection
  placedTools: PlacedTool[];

  // Tool management methods
  placeTool(tool: PlacedTool): Result<void>
  placeSystemTool(toolId: string, placement: PlacementLocation): Result<PlacedTool>
  updatePlacedTool(placementId: string, updates: Partial<PlacedToolProps>): Result<void>
  removePlacedTool(placementId: string): Result<void>
  reorderPlacedTools(orderedIds: string[]): Result<void>
  updatePlacedToolState(placementId: string, state: Record<string, unknown>): Result<void>
}
```

---

## Deployment Flow

### Step 1: Tool Creation (HiveLab)

```
User opens HiveLab IDE
  ↓
Drag elements onto canvas
  ↓
Connect elements (data flow)
  ↓
Configure properties in Inspector
  ↓
Save → POST /api/tools { status: 'draft' }
  ↓
Publish → PATCH /api/tools/[toolId] { status: 'published' }
```

### Step 2: Deployment Initiation

**Path A: From HiveLab IDE**
```
Click "Deploy" button in IDE toolbar
  ↓
ToolDeployModal opens
  ↓
Select target: Profile OR Space
  ↓
Configure: placement, visibility, title
  ↓
Confirm → POST /api/tools/deploy
```

**Path B: From Tool Page**
```
Navigate to /tools/[toolId]/deploy
  ↓
See available targets (profile + led spaces)
  ↓
Step wizard: target → config → review
  ↓
Submit → POST /api/tools/[toolId]/deploy
```

### Step 3: Backend Processing

```typescript
// POST /api/spaces/[spaceId]/tools
async function deployToolToSpace(req: Request) {
  // 1. Validate permissions
  const membership = await getMembership(userId, spaceId);
  if (!canDeployTools(membership, space.governance)) {
    throw new ForbiddenError('Cannot deploy tools to this space');
  }

  // 2. Validate tool
  const tool = await toolRepo.findById(toolId);
  if (tool.status !== 'published') {
    throw new BadRequestError('Tool must be published');
  }

  // 3. Check limits
  if (space.placedTools.length >= 20) {
    throw new BadRequestError('Space has reached tool limit');
  }

  // 4. Create PlacedTool
  const placedTool = PlacedTool.create({
    toolId,
    spaceId,
    placement,
    source: 'leader',
    placedBy: userId,
    configOverrides,
    visibility,
  });

  // 5. Add to space aggregate
  space.placeTool(placedTool);

  // 6. Persist
  await spaceRepo.save(space);

  // 7. Update analytics
  await toolRepo.incrementDeploymentCount(toolId);
}
```

### Step 4: Runtime Execution

```typescript
// apps/web/src/hooks/use-tool-runtime.ts
function useToolRuntime({ toolId, spaceId, placementId }) {
  const deploymentId = `space:${spaceId}_${placementId}`;

  // Load tool + state
  const { tool, state } = await fetch(`/api/tools/${toolId}/with-state?deploymentId=${deploymentId}`);

  // Execute actions
  const executeAction = async (elementId, action, data) => {
    const result = await fetch('/api/tools/execute', {
      method: 'POST',
      body: { toolId, deploymentId, elementId, action, data }
    });

    // Update local state
    setState(result.state);

    // Handle cascading updates
    for (const cascade of result.cascadedElements) {
      updateElement(cascade.elementId, cascade.state);
    }
  };

  // Auto-save state changes
  useEffect(() => {
    const save = debounce(() => {
      fetch(`/api/tools/state/${deploymentId}`, {
        method: 'PUT',
        body: { state }
      });
    }, 1000);

    save();
  }, [state]);

  return { tool, state, executeAction, updateState };
}
```

---

## Placement Locations

### Sidebar (Default)

Persistent tools in the 40% right sidebar of a space.

```
┌──────────────────────────┬─────────────────────┐
│                          │   SIDEBAR (40%)     │
│   CHAT BOARD (60%)       │                     │
│                          │   ┌─────────────┐   │
│                          │   │ Events      │   │
│                          │   └─────────────┘   │
│                          │   ┌─────────────┐   │
│                          │   │ Quick Poll  │   │
│                          │   └─────────────┘   │
│                          │   ┌─────────────┐   │
│                          │   │ Links       │   │
│                          │   └─────────────┘   │
└──────────────────────────┴─────────────────────┘
```

Best for: Always-visible tools, widgets, quick actions

### Inline (In Chat)

Interactive elements embedded in chat messages.

```
┌─────────────────────────────────────────────────┐
│ [Alice] Posted a poll                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ Where should we meet?                       │ │
│ │ ○ Student Union  (3 votes)                  │ │
│ │ ● Library        (5 votes) ✓                │ │
│ │ ○ Cafe           (2 votes)                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Bob] I voted for Library!                      │
└─────────────────────────────────────────────────┘
```

Best for: Polls, RSVPs, quick forms, reactions

### Modal

Full-screen overlay for complex interactions.

Best for: Forms, detailed views, focused tasks

### Tab

Full-screen tab alongside boards.

```
[General] [Events] [Study Group] [Rush Tracker] [+]
                                      ↑
                               Tool as Tab
```

Best for: Complex tools, dashboards, trackers

---

## System Tools by Space Type

When a space is created, certain system tools can auto-deploy based on type:

```typescript
const SYSTEM_TOOLS_BY_TYPE: Record<SpaceType, SystemTool[]> = {
  uni: [
    { toolId: 'system:announcements', placement: 'sidebar', order: 0 },
    { toolId: 'system:events', placement: 'sidebar', order: 1 },
  ],
  student: [
    { toolId: 'system:events', placement: 'sidebar', order: 0 },
    { toolId: 'system:quick-poll', placement: 'sidebar', order: 1 },
  ],
  greek: [
    { toolId: 'system:events', placement: 'sidebar', order: 0 },
    { toolId: 'system:points-tracker', placement: 'sidebar', order: 1 },
  ],
  residential: [
    { toolId: 'system:floor-events', placement: 'sidebar', order: 0 },
    { toolId: 'system:floor-poll', placement: 'sidebar', order: 1 },
  ],
};

// On space creation
function autoDeploySystemTools(space: EnhancedSpace) {
  const systemTools = SYSTEM_TOOLS_BY_TYPE[space.spaceType];

  for (const tool of systemTools) {
    space.placeSystemTool(tool.toolId, tool.placement);
  }
}
```

---

## Permission Matrix

### Deployment Permissions

| Action | Owner | Admin | Mod | Member | Guest |
|--------|-------|-------|-----|--------|-------|
| Deploy to sidebar | ✓ | ✓ | - | Depends* | - |
| Use inline | ✓ | ✓ | ✓ | ✓ | - |
| Configure placed tool | ✓ | ✓ | - | - | - |
| Remove placed tool | ✓ | ✓ | - | - | - |
| Lock/unlock placement | ✓ | - | - | - | - |

*Members can deploy in `flat` governance only

### Visibility Controls

| Visibility | Who Can See | Who Can Interact |
|------------|------------|------------------|
| `all` | Everyone | Everyone |
| `members` | Members+ | Members+ |
| `leaders` | Admins, Mods, Owner | Admins, Mods, Owner |

---

## State Management

### Where State Lives

```
Firestore Path: spaces/{spaceId}/placed_tools/{placementId}
Field: state (Record<string, unknown>)
Updated: stateUpdatedAt (timestamp)
```

### State Update Flow

```
User votes in poll element
  ↓
executeAction('poll-1', 'vote', { option: 'Library' })
  ↓
POST /api/tools/execute
  ↓
Action handler increments vote count
  ↓
Return updated state + cascades
  ↓
Update local state (optimistic)
  ↓
Auto-save debounced to placed_tools doc
```

### Cascading Updates

When one element's action affects others:

```typescript
// Example: Form submission updates chart
{
  cascadedElements: [
    { elementId: 'chart-1', state: { data: [1, 2, 3, 5] } },
    { elementId: 'counter-1', state: { count: 5 } }
  ]
}
```

---

## API Reference

### Deploy Tool

```
POST /api/spaces/[spaceId]/tools
Authorization: Bearer <token>

Body:
{
  "toolId": "tool_abc123",
  "placement": "sidebar",
  "order": 0,
  "configOverrides": {},
  "visibility": "all",
  "titleOverride": null
}

Response:
{
  "success": true,
  "data": {
    "placementId": "placement_xyz789",
    "toolId": "tool_abc123",
    "placement": "sidebar"
  }
}
```

### List Deployed Tools

```
GET /api/spaces/[spaceId]/tools
Authorization: Bearer <token>

Query Params:
- status: active | inactive | all
- placement: sidebar | inline | modal | tab

Response:
{
  "success": true,
  "data": [
    {
      "id": "placement_xyz789",
      "toolId": "tool_abc123",
      "placement": "sidebar",
      "order": 0,
      "isActive": true,
      "tool": { "name": "Quick Poll", "category": "engagement" },
      "state": { "votes": { "opt1": 3, "opt2": 5 } }
    }
  ]
}
```

### Execute Tool Action

```
POST /api/tools/execute
Authorization: Bearer <token>

Body:
{
  "toolId": "tool_abc123",
  "deploymentId": "space:space_123_placement_xyz789",
  "elementId": "poll-1",
  "action": "vote",
  "data": { "option": "Library" }
}

Response:
{
  "success": true,
  "state": { "votes": { "Library": 6, "Cafe": 2 } },
  "cascadedElements": []
}
```

---

## Key Files

| Component | Path |
|-----------|------|
| PlacedTool Entity | `packages/core/src/domain/spaces/entities/placed-tool.ts` |
| EnhancedSpace Aggregate | `packages/core/src/domain/spaces/aggregates/enhanced-space.ts` |
| Space Tools API | `apps/web/src/app/api/spaces/[spaceId]/tools/route.ts` |
| Tool Deploy API | `apps/web/src/app/api/tools/deploy/route.ts` |
| Tool Execute API | `apps/web/src/app/api/tools/execute/route.ts` |
| Tool Runtime Hook | `apps/web/src/hooks/use-tool-runtime.ts` |
| ToolDeployModal | `packages/ui/src/components/hivelab/ToolDeployModal.tsx` |
| HiveLab IDE | `packages/ui/src/components/hivelab/ide/hivelab-ide.tsx` |

---

## Future Enhancements

1. **Tool Versioning** — Track which version of a tool is deployed, migrate state on updates
2. **Collaborative Tools** — Multiple users editing same tool state simultaneously
3. **Tool Templates by Type** — Pre-built templates optimized for each space type
4. **AI Auto-Suggest** — AI recommends tools based on space activity and type
5. **Tool Marketplace** — Share and discover tools across spaces

---

*This document describes the architectural handoff between HiveLab (tool creation) and Spaces (tool usage). For element specifications, see `SPACES_HIVELAB_SPEC.md`.*
