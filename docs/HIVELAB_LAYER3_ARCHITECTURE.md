# HiveLab Layer 3 Architecture

**Date:** January 19, 2026
**Status:** Design Complete
**Launch Target:** Monday (T-2 days)

---

## Executive Summary

**Discovery:** Layer 3 backend already exists and is fully functional. The `tool-connection-engine.ts` implements complete data cascade between elements. What's missing is the **IDE UI** to expose connection configuration and visual feedback.

**Architecture Decision:** Enhance the existing canvas UI to expose the power of the backend, rather than building new infrastructure.

---

## What Already Exists (The Foundation)

### 1. Connection Cascade Engine (`apps/web/src/lib/tool-connection-engine.ts`)

A complete server-side engine that:
- Processes all connections when an action completes
- Cascades data from source outputs to target inputs
- Supports recursive cascading (up to 5 levels deep)
- Has complete output/input mappings for all 27 elements
- Includes 5 built-in transforms: `toArray`, `toCount`, `toSorted`, `toTop5`

```typescript
// When a Poll vote action completes, this automatically triggers:
processActionConnections(
  composition,    // Tool with elements + connections
  state,          // Current tool state
  'vote',         // Action that was executed
  'poll-element', // Element type
  'poll-1',       // Instance ID
  userId,
  deploymentId
) // → Cascades to all connected elements
```

### 2. Element Registry (`packages/core/src/domain/hivelab/element-registry.ts`)

All 27 elements define:
- **Outputs** - Data they produce (e.g., Poll produces `results`, `totalVotes`)
- **Inputs** - Data they consume (e.g., Leaderboard consumes `entries`)
- **Actions** - User interactions that trigger data changes

### 3. IDE Canvas (`packages/ui/src/components/hivelab/ide/ide-canvas.tsx`)

Already implements:
- Input/output ports on each element node
- Connect mode for wiring elements
- Bezier connection lines with hover effects
- `flowingConnections` prop for animation (but not wired up)

### 4. Type System (`packages/ui/src/components/hivelab/ide/types.ts`)

```typescript
interface Connection {
  id: string;
  from: { instanceId: string; port: string };
  to: { instanceId: string; port: string };
  transform?: 'toArray' | 'toCount' | 'toSorted' | 'toTop5' | 'toBoolean' | 'toString';
}
```

---

## The Gap: IDE UI for Connection Configuration

### Current UX Flow
1. User drags elements onto canvas ✅
2. User enters "connect mode" ✅
3. User clicks output port → input port ✅
4. Connection is created with generic "output" → "input" ports ❌

### Target UX Flow
1. User drags elements onto canvas ✅
2. User clicks output port (right side of element)
3. **Port picker shows available outputs** (e.g., "results", "totalVotes") ← NEW
4. User clicks input port on target element
5. **Port picker shows compatible inputs** ← NEW
6. Connection is created with specific port names
7. **Optional: Transform selector** for data shaping ← NEW

---

## Architecture Design

### Component 1: Port Discovery System

**Location:** `packages/ui/src/components/hivelab/ide/port-picker.tsx`

```typescript
interface PortPickerProps {
  element: CanvasElement;
  direction: 'output' | 'input';
  position: { x: number; y: number };
  onSelect: (portName: string) => void;
  onClose: () => void;
}
```

**Behavior:**
- When user clicks an output port, show available outputs from element registry
- When user clicks an input port, show available inputs
- Filter inputs to show only compatible types (future enhancement)

**Data Source:** Import element specs from `@hive/core` element registry:
```typescript
import { getElementSpec } from '@hive/core';

const spec = getElementSpec('poll-element');
// spec.outputs = ['results', 'totalVotes']
// spec.inputs = []
```

### Component 2: Connection Configuration Panel

**Location:** `packages/ui/src/components/hivelab/ide/connection-config.tsx`

Shows when a connection is selected:
- Source element + output port
- Target element + input port
- Transform selector dropdown
- Delete connection button

```typescript
interface ConnectionConfigProps {
  connection: Connection;
  elements: CanvasElement[];
  onUpdate: (updates: Partial<Connection>) => void;
  onDelete: () => void;
}
```

### Component 3: Flow Visualization

**Enhancement to:** `ide-canvas.tsx` ConnectionLine component

Currently `flowingConnections` prop exists but isn't used. Wire it up:
- During action execution, pass flowing connection IDs
- Show animated particle/pulse along connection lines
- Duration: 500ms per data transfer

### Component 4: Element Port Labels

**Enhancement to:** `ide-canvas.tsx` ElementNode component

Show port names on hover:
- Output ports (right side): Show output names from registry
- Input ports (left side): Show input names from registry
- Color-code by data type (future: string=blue, number=green, array=purple)

---

## Implementation Priority (GTM-Focused)

### P0: Must Ship Monday
1. **Wire up `flowingConnections`** - Visual feedback when data flows
2. **Port name tooltips** - Show available ports on hover

### P1: Week 1 Post-Launch
3. **Port picker popover** - Select specific output/input when connecting
4. **Connection selection** - Click connection to select it
5. **Transform selector** - Choose data transforms for connections

### P2: Week 2+
6. **Connection configuration panel** - Full editing of connections
7. **Compatibility filtering** - Only show compatible input ports
8. **Multi-port elements** - Elements with multiple inputs/outputs visually distinct

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HiveLab Tool Runtime                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────────────┐     ┌─────────────────┐   │
│  │   Element   │     │  Connection Engine  │     │    Element      │   │
│  │   (Poll)    │────▶│   (Cascade Data)    │────▶│  (Leaderboard)  │   │
│  │             │     │                     │     │                 │   │
│  │ outputs:    │     │ 1. Extract output   │     │ inputs:         │   │
│  │  - results  │     │ 2. Apply transform  │     │  - entries      │   │
│  │  - votes    │     │ 3. Inject to input  │     │                 │   │
│  └─────────────┘     │ 4. Trigger refresh  │     └─────────────────┘   │
│        │             └─────────────────────┘              │            │
│        │                                                  │            │
│        ▼                                                  ▼            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Tool Shared State                         │   │
│  │  {                                                               │   │
│  │    "poll-1": { responses: {...}, totalVotes: 42 },              │   │
│  │    "leaderboard-1": { entries: [...] }  ← cascaded from poll    │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Space Integration

Tools deploy to Spaces via:
- `POST /api/tools/{toolId}/deploy` → Creates `tool_deployments` document
- Adds to `spaces/{spaceId}/placed_tools` subcollection
- Tool runtime loads composition + connections from tool document
- Actions execute in Space context (has spaceId, can access space members)

**Space-Specific Elements:**
- `member-list` - Shows space members
- `member-selector` - Pick space members
- `space-events` - Space's events
- `space-feed` - Space's posts
- `space-stats` - Space metrics
- `role-gate` - Conditional rendering by role

These elements automatically get Space context when tool runs within a Space.

---

## Example: Poll → Leaderboard Connection

**Scenario:** Space leader wants poll votes to auto-populate a leaderboard.

**Connection Definition:**
```typescript
{
  id: "conn-1",
  from: { instanceId: "poll-1", port: "results" },
  to: { instanceId: "leaderboard-1", port: "entries" },
  transform: "toArray"
}
```

**Runtime Flow:**
1. User votes on poll
2. `vote` action executes
3. Poll state updates: `{ responses: { "Option A": 15, "Option B": 8 } }`
4. Connection engine detects "results" output changed
5. Extracts `responses` from poll state
6. Applies `toArray` transform: `[{ id: "Option A", score: 15 }, { id: "Option B", score: 8 }]`
7. Injects into leaderboard's `entries` input
8. Leaderboard refreshes with new data
9. Both elements re-render in UI

---

## Custom Styling (Future Phase)

**Not for Monday.** Post-launch enhancement:

```typescript
interface ToolTheme {
  colorMode: 'dark' | 'light' | 'system';
  accentColor: string;  // CSS variable override
  borderRadius: 'none' | 'sm' | 'md' | 'lg';
  fontFamily: 'system' | 'sans' | 'mono';
}

// Applied as CSS variables at tool runtime
const themeVars = {
  '--tool-accent': theme.accentColor,
  '--tool-radius': radiusMap[theme.borderRadius],
  ...
};
```

---

## Files to Modify

### P0 Changes (Monday)

| File | Change |
|------|--------|
| `ide-canvas.tsx` | Wire `flowingConnections` to connection animation |
| `ide-canvas.tsx` | Add port name tooltips on hover |
| `apps/web/src/app/tools/page.tsx` | Pass `flowingConnections` from action execution |

### P1 Changes (Post-Launch)

| File | Change |
|------|--------|
| `port-picker.tsx` | NEW - Port selection popover |
| `connection-config.tsx` | NEW - Connection editing panel |
| `ide-canvas.tsx` | Integrate port picker, connection selection |
| `types.ts` | Add `selectedConnectionId` to state |

---

## Success Criteria

### Monday Launch
- [ ] Users can connect elements on canvas
- [ ] Connections work at runtime (data cascades)
- [ ] Visual feedback shows data flowing

### Week 1
- [ ] Users can select specific output/input ports
- [ ] Users can choose transforms for connections
- [ ] Connection editing panel works

### Week 2+
- [ ] Port compatibility filtering
- [ ] Custom tool themes
- [ ] Advanced connection conditions

---

## Conclusion

Layer 3 is 80% built. The backend cascade engine is complete and tested. The IDE canvas has connection infrastructure. What's needed:

1. **P0 (Monday):** Wire up flow visualization, add port tooltips
2. **P1 (Post-launch):** Port picker, transform selector, connection config

This is achievable for Monday with targeted enhancements to existing components.
