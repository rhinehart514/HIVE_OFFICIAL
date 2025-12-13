# HIVE Spaces: YC Co-Founder Audit Findings

**Audit Date:** December 4, 2024
**Overall Score:** 62/100 (NOT LAUNCH-READY)

---

## Summary

| Area | Score | Status |
|------|-------|--------|
| Mission Alignment | 57/100 | Architecture OK, execution incomplete |
| Backend/Security | 70/100 | DDD solid, permission gaps critical |
| UX/Component Quality | 60/100 | Vision clear, polish missing |

---

## TIER 1: CRITICAL SECURITY (P0 - Fix Before Any Users)

### [ ] 1.1 Space Transfer Allows Any Member

**File:** `apps/web/src/app/api/spaces/transfer/route.ts`
**Lines:** 104-111, 37

**Issue:** Only checks membership, not role. `BUILDER_ROLES` defined on line 37 but NEVER USED.

```typescript
// CURRENT: Any member can transfer spaces
const sourceMembershipSnapshot = await dbAdmin
  .collection('spaceMembers')
  .where('spaceId', '==', fromSpaceId)
  .where('userId', '==', userId)
  .where('isActive', '==', true)
  .limit(1)
  .get();

// MISSING: Check role is in BUILDER_ROLES = ['owner', 'admin', 'builder']
```

**Fix:** Add role check against BUILDER_ROLES before allowing transfer.

---

### [ ] 1.2 adminOverride Controlled by Client

**File:** `apps/web/src/app/api/spaces/transfer/route.ts`
**Line:** 68

**Issue:** Client can send `adminOverride: true` to bypass validation.

```typescript
// VULNERABLE
const { fromSpaceId, toSpaceId, reason, adminOverride = false } = await request.json();
```

**Fix:** Remove adminOverride from request body. Derive from authenticated session/role instead.

---

### [ ] 1.3 Race Condition: Duplicate Membership Documents

**File:** `apps/web/src/app/api/spaces/join-v2/route.ts`
**Line:** 50

**Issue:** Uses auto-generated ID. Two rapid clicks = two membership documents.

```typescript
// CURRENT: Auto-ID allows duplicates
const memberRef = dbAdmin.collection('spaceMembers').doc();

// SHOULD BE: Composite key prevents duplicates
const memberRef = dbAdmin.collection('spaceMembers').doc(`${spaceId}_${userId}`);
```

**Fix:** Use composite key `spaceMembers/{spaceId}_{userId}`.

---

### [ ] 1.4 Inconsistent Permission Validation

**Files:** All `/api/spaces/[spaceId]/*` routes

**Issue:** Three different permission patterns used:
1. `validateSpaceAndMembership()` - queries spaceMembers directly
2. `checkSpacePermission()` - middleware-based
3. `ensureSpaceAccess()` - yet another pattern

**Fix:** Create unified `validateSpacePermission(userId, spaceId, requiredRole)` function.

**Create File:** `apps/web/src/lib/space-permission-middleware.ts`

---

## TIER 2: MISSION ALIGNMENT (P1 - Ship the Vision)

### [ ] 2.1 Remove Dead Feed Code

**File:** `apps/web/src/app/spaces/[spaceId]/page.tsx`
**Lines:** 110-123, 461-539

**Issue:** useFeed hook instantiated but NEVER rendered. feedContent exists but not in JSX.

```typescript
// LINE 110-123: UNUSED
const { posts, isLoading: feedLoading, createPost } = useFeed({...});

// LINE 461-539: DEAD CODE
const feedContent = (
  <div className="space-y-4">
    {/* ALL UNUSED */}
  </div>
);
```

**Fix:**
- Remove useFeed import and call
- Remove feedContent variable
- Remove post detail modal state
- Remove SpacePostComposer import

---

### [ ] 2.2 Improve Polling (Currently 3s)

**File:** `apps/web/src/hooks/use-chat-messages.ts`
**Line:** 64

**Issue:** 3-second polling creates noticeable latency. Vision says "real-time conversation model (like Discord)".

```typescript
// CURRENT
const { pollingIntervalMs = 3000 } = options;

// IMPROVED
const { pollingIntervalMs = 1000 } = options;
// + Add optimistic updates for sent messages
```

**Fix:**
- Reduce polling to 1 second
- Add optimistic message insertion
- Show sent messages immediately, reconcile with server

**FUTURE (Deferred):** Debug `sse-realtime-service.ts` for true real-time.

---

### [ ] 2.3 Wire HiveLab Sidebar Rendering

**File:** `apps/web/src/app/spaces/[spaceId]/page.tsx`
**Lines:** 398-417

**Issue:** Hardcoded sidebar. Vision says "Sidebar = persistent components rendered via HiveLab".

```typescript
// CURRENT: Manual assembly
const sidebarData = {
  about: { /* hardcoded */ },
  tools: { /* fetched separately */ },
};

// COMPONENTS EXIST BUT UNUSED:
// - packages/ui/src/atomic/03-Spaces/organisms/space-sidebar-configurable.tsx
// - packages/ui/src/atomic/03-Spaces/organisms/widget-gallery.tsx
// - packages/ui/src/atomic/03-Spaces/molecules/sidebar-tool-slot.tsx
```

**Fix:** Replace SpaceSidebar with SpaceSidebarConfigurable for leader customization.

---

### [ ] 2.4 Inline Component Insertion UI

**Files:**
- `packages/ui/src/atomic/03-Chat/chat-input.tsx`
- `packages/ui/src/components/hivelab/inline-element-renderer.tsx`

**Issue:** Types exist for inline components but no UI to insert them.

```typescript
// ChatMessage.ts line 24-35: Types exist
interface InlineComponentData {
  elementType: string;
  deploymentId: string;
  state?: Record<string, unknown>;
}

// MISSING:
// - "Add Poll" button in chat composer
// - Tool picker modal
// - InlineElementRenderer not wired to message rendering
```

**Fix:**
1. Add "+" or tool button to ChatInput
2. Create tool picker popover/modal
3. Wire InlineElementRenderer in SpaceChatBoard message rendering

---

## TIER 3: CODE QUALITY (P1 - Maintainability)

### [ ] 3.1 Full Cleanup of page.tsx (850 -> 250 lines)

**File:** `apps/web/src/app/spaces/[spaceId]/page.tsx`
**Current:** 850 lines

**Issue:** God component handling:
- Page layout orchestration
- Data fetching (6+ API calls)
- State management (10+ useState hooks)
- Modal management (4 different modals)
- Mobile drawer management
- Tool runtime integration

**Fix:** Extract to separate concerns:
- `useSpacePageData()` hook for data fetching
- `useSpaceChatIntegration()` hook for chat logic
- `useSpaceModals()` hook for modal state
- Reduce page.tsx to ~250 lines of pure layout

---

### [ ] 3.2 Extract useSpacePageData Hook

**Create File:** `apps/web/src/hooks/use-space-page-data.ts`

**Purpose:** Consolidate all space data fetching into single hook.

```typescript
export function useSpacePageData(spaceId: string) {
  // Parallel fetch with Promise.all
  const { data, isLoading, error } = useSWR(
    spaceId ? `space-${spaceId}` : null,
    () => Promise.all([
      fetchSpace(spaceId),
      fetchBoards(spaceId),
      fetchTools(spaceId),
      fetchLeaders(spaceId),
    ])
  );

  return { space, boards, tools, leaders, isLoading, error };
}
```

---

### [ ] 3.3 Extract useSpaceChatIntegration Hook

**Create File:** `apps/web/src/hooks/use-space-chat-integration.ts`

**Purpose:** Encapsulate chat board + message + tool runtime logic.

```typescript
export function useSpaceChatIntegration(spaceId: string, activeBoardId: string) {
  const chat = useChatMessages({ spaceId, boardId: activeBoardId });
  const toolRuntime = useToolRuntime({ spaceId });

  // Combined state and handlers
  return {
    messages: chat.messages,
    sendMessage: chat.sendMessage,
    activeTool: toolRuntime.tool,
    executeToolAction: toolRuntime.executeAction,
    // ...
  };
}
```

---

### [ ] 3.4 Parallel API Calls

**File:** `apps/web/src/app/spaces/[spaceId]/page.tsx`

**Issue:** 6+ serial API calls = 4-6 second load time on 3G.

```typescript
// CURRENT: Serial
useEffect(() => { fetchSpace() });    // waits
useEffect(() => { fetchPosts() });    // waits for 1
useEffect(() => { fetchBoards() });   // waits for 2
// ...

// FIX: Parallel
useEffect(() => {
  Promise.all([
    fetchSpace(),
    fetchBoards(),
    fetchTools(),
    fetchLeaders(),
  ]).then(([space, boards, tools, leaders]) => {
    // Set all state at once
  });
}, [spaceId]);
```

---

## TIER 4: UX POLISH (P2 - Production Quality)

### [ ] 4.1 ARIA Labels (Zero Found)

**Files:** All `packages/ui/src/atomic/03-Spaces/*`

**Issue:** No accessibility labels found in any Spaces component.

**Critical elements needing labels:**
- Join/leave buttons: `aria-label="Join {spaceName}"`
- Board switcher tabs: `role="tablist"`, `aria-selected`
- Message reactions: `aria-label="React with {emoji}"`
- Sidebar: `role="complementary"`
- Loading states: `aria-busy="true"`

**Example fix:**
```typescript
// BEFORE
<button onClick={onJoin}>Join Space</button>

// AFTER
<button
  onClick={onJoin}
  aria-label={`Join ${spaceName} space`}
  aria-busy={isLoading}
>
  {isLoading ? "Joining..." : "Join Space"}
</button>
```

---

### [ ] 4.2 Touch Targets >= 44px

**Files:**
- `packages/ui/src/atomic/03-Spaces/organisms/space-dynamic-content.tsx`
- `packages/ui/src/atomic/03-Spaces/organisms/space-chat-board.tsx`

**Issue:** Multiple buttons below Apple's 44px minimum.

**Problem areas:**
- "Done Editing" button: `px-3 py-1.5` (~32px)
- Pin/delete icons: `w-3.5` (14px)
- Widget edit buttons: ~24px targets

**Fix:** Add minimum height/width classes:
```typescript
// Add to all interactive elements
className="min-h-[44px] min-w-[44px]"
```

---

### [ ] 4.3 Confirmation Dialogs for Destructive Actions

**File:** `apps/web/src/hooks/use-space.ts`
**Line:** 68-93

**Issue:** Leave space fires immediately with no confirmation.

```typescript
// CURRENT
const leaveSpace = useCallback(async () => {
  setIsMember(false); // Immediate, no warning
  await secureApiFetch('/api/spaces/leave', ...);
}, [...]);
```

**Fix:** Add AlertDialog confirmation:
```typescript
const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

const handleLeaveClick = () => setShowLeaveConfirm(true);

const confirmLeave = async () => {
  setShowLeaveConfirm(false);
  setIsMember(false);
  await secureApiFetch('/api/spaces/leave', ...);
};

// Render AlertDialog with warning
```

---

### [ ] 4.4 Mobile Keyboard Handling

**File:** `packages/ui/src/atomic/03-Spaces/organisms/space-chat-board.tsx`

**Issue:** Chat input has no keyboard avoidance on mobile.

**Fix:**
1. Detect keyboard open on mobile
2. Scroll input into view
3. Adjust viewport/container height
4. Focus management when switching boards

---

## TIER 5: DATA INTEGRITY (P2 - Before 1000 Users)

### [ ] 5.1 Member Count Reconciliation Cron

**Issue:** `spaces/{spaceId}/metrics.memberCount` incremented separately from `spaceMembers` collection. Can diverge over time.

**Create File:** `apps/web/src/app/api/internal/reconcile-metrics/route.ts`

```typescript
// Schedule: Daily at 3 AM UTC (vercel.json cron)
export async function GET() {
  const spaces = await db.collection('spaces').get();

  for (const space of spaces.docs) {
    const actualCount = await db.collection('spaceMembers')
      .where('spaceId', '==', space.id)
      .where('isActive', '==', true)
      .count().get();

    await space.ref.update({
      'metrics.memberCount': actualCount.data().count,
      'metrics.lastReconciled': FieldValue.serverTimestamp(),
    });
  }

  return Response.json({ reconciled: spaces.size });
}
```

---

### [ ] 5.2 Clarify Tabs vs Boards Naming

**Files:**
- `apps/web/src/contexts/SpaceContext.tsx` (uses "tabs")
- `apps/web/src/hooks/use-chat-messages.ts` (uses "boards")

**Issue:** Same entity has two names. Code maps between them confusingly.

**Decision:** Use "boards" (matches Discord mental model).

**Migration:**
1. Rename SpaceContext tab-related state to boards
2. Update all consumers
3. Keep Tab entity for backward compat but deprecate

---

## FUTURE: SSE Real-time (Documented, Deferred)

### [ ] Debug sse-realtime-service.ts

**File:** `apps/web/src/lib/sse-realtime-service.ts`

**Issue:** Marked as BROKEN in CLAUDE.md. "Passes `null` controller".

**Current workaround:** Using improved polling (1s + optimistic updates).

**When to revisit:** After core UX polish complete, if latency complaints persist.

---

## File Priority Summary

### P0 - Security (This Week)
| File | Change |
|------|--------|
| `apps/web/src/app/api/spaces/transfer/route.ts` | Add builder role check, remove adminOverride |
| `apps/web/src/app/api/spaces/join-v2/route.ts` | Composite key for membership |
| `apps/web/src/lib/space-permission-middleware.ts` | Create unified validation (NEW) |

### P1 - Mission & Code Quality (Week 2-3)
| File | Change |
|------|--------|
| `apps/web/src/app/spaces/[spaceId]/page.tsx` | Remove dead code, extract hooks, 850->250 lines |
| `apps/web/src/hooks/use-chat-messages.ts` | 3s->1s polling, optimistic updates |
| `apps/web/src/hooks/use-space-page-data.ts` | Create: parallel data fetching (NEW) |
| `apps/web/src/hooks/use-space-chat-integration.ts` | Create: chat logic extraction (NEW) |
| `packages/ui/src/atomic/03-Chat/chat-input.tsx` | Add inline component insertion |

### P2 - UX Polish (Week 3-4)
| File | Change |
|------|--------|
| All `packages/ui/src/atomic/03-Spaces/*` | ARIA labels |
| All interactive buttons | Touch targets 44px |
| `apps/web/src/hooks/use-space.ts` | Leave confirmation |

---

## TIER 6: SPACES ↔ HIVELAB INTEGRATION (P1 - Parallel Track)

### Integration Status Overview

| Integration Point | Status | Priority |
|-------------------|--------|----------|
| Tool → Space Deployment | ✓ WORKING | - |
| Sidebar Tool List | ✓ WORKING | - |
| Sidebar Tool Preview | ⚠️ MISSING | P1 |
| Inline Chat Components | ⚠️ NOT WIRED | P1 |
| Tool Runtime (Modal) | ✓ WORKING | - |
| Action Execution | ✓ WORKING | - |
| Widget Gallery | ⚠️ ORPHANED | P2 |

---

### [ ] 6.1 Wire Inline Chat Component Rendering

**Files:**
- `packages/ui/src/atomic/03-Spaces/organisms/space-chat-board.tsx` (consumer)
- `packages/ui/src/components/hivelab/inline-element-renderer.tsx` (ready, not imported)
- `packages/core/src/domain/spaces/entities/chat-message.ts` (types exist)

**Issue:** InlineElementRenderer exists and is complete, but SpaceChatBoard renders `inline_component` messages as plain text.

```typescript
// chat-message.ts - Types exist (line 24-35)
interface ChatMessage {
  type: 'text' | 'inline_component' | 'system';
  componentData?: {
    elementType: string;      // 'poll', 'signup', 'event-rsvp'
    deploymentId: string;
    state?: Record<string, unknown>;
  };
}

// space-chat-board.tsx - MISSING integration
// Currently just renders message.content for all types
// Should check type === 'inline_component' and render InlineElementRenderer
```

**Fix:**
1. Import `InlineElementRenderer` in SpaceChatBoard
2. Add type check in message rendering
3. Pass `componentData` to renderer
4. Wire up `onAction` callback to tool runtime

---

### [ ] 6.2 Sidebar Tool Preview (Not Just List)

**Files:**
- `packages/ui/src/atomic/03-Spaces/molecules/sidebar-tool-slot.tsx` (exists, basic)
- `packages/ui/src/components/hivelab/element-renderers.tsx` (has all renderers)
- `apps/web/src/app/spaces/[spaceId]/page.tsx` (sidebar assembly)

**Issue:** Sidebar shows tool name/description list. Vision says tools should render as interactive components.

```typescript
// CURRENT in page.tsx (lines 398-417)
sidebarData = {
  tools: {
    items: placedTools.map(t => ({
      id: t.toolId,
      name: t.tool?.name,
      // Just metadata, no preview
    }))
  }
}

// SHOULD BE
sidebarData = {
  tools: {
    items: placedTools.map(t => ({
      id: t.toolId,
      composition: t.tool?.composition, // Full element data
      renderPreview: true,
    }))
  }
}
```

**Fix:**
1. Extend SidebarToolSlot to accept `composition` prop
2. Import ElementRenderer from HiveLab
3. Render compact preview of tool
4. Add "Open Full" button that triggers modal

---

### [ ] 6.3 Widget Gallery API Backend

**Files:**
- `packages/ui/src/atomic/03-Spaces/organisms/widget-gallery.tsx` (UI exists)
- `apps/web/src/app/api/spaces/[spaceId]/widgets/route.ts` (EXISTS but incomplete)

**Issue:** Widget Gallery component exists with full UI but API doesn't support full CRUD.

```typescript
// widget-gallery.tsx has:
// - Grid display
// - Add widget button
// - Widget cards with edit/delete

// API route exists but:
// - GET returns widgets ✓
// - POST creates widget ✓
// - PUT (reorder/update) - MISSING
// - DELETE - MISSING
```

**Fix:**
1. Add PATCH handler for widget updates
2. Add DELETE handler
3. Add reorder support (array of widget IDs)
4. Wire Widget Gallery to these endpoints

---

### [ ] 6.4 Unify Type Definitions

**Files:**
- `packages/core/src/domain/hivelab/element-registry.ts` (HiveLab types)
- `packages/ui/src/lib/hivelab/element-system.ts` (UI types, different!)
- `packages/core/src/domain/hivelab/tool-composition.types.ts` (third set)

**Issue:** Three separate type definitions for elements. Causes drift and confusion.

```typescript
// element-registry.ts
interface ElementDefinition { ... }

// element-system.ts
interface ElementConfig { ... }  // Different structure!

// tool-composition.types.ts
interface ToolElement { ... }   // Yet another!
```

**Fix:**
1. Canonicalize in `packages/core/src/domain/hivelab/types/`
2. Export from `@hive/core`
3. Remove duplicates from UI package
4. Update all imports

---

### [ ] 6.5 Create Unified State Manager

**Files:**
- `apps/web/src/hooks/use-tool-runtime.ts` (tool state)
- `apps/web/src/contexts/SpaceContext.tsx` (space state)
- `packages/ui/src/lib/hivelab/tool-state-manager.ts` (local state)

**Issue:** Three state systems don't communicate. Tool actions in sidebar don't update chat, etc.

```typescript
// CURRENT: Isolated state
const { tool, state } = useToolRuntime();     // HiveLab
const { space, members } = useSpaceContext(); // Spaces
// No cross-communication

// NEEDED: Unified
const {
  space,
  tools: { sidebar, inline, modal },
  actions: { executeToolAction, syncState }
} = useSpaceWithTools(spaceId);
```

**Fix:**
1. Create `apps/web/src/hooks/use-space-with-tools.ts`
2. Combine SpaceContext + tool runtime
3. Add cross-domain event bus
4. Ensure tool actions update space state

---

### [ ] 6.6 Chat Input Tool Insertion Button

**Files:**
- `packages/ui/src/atomic/03-Chat/chat-input.tsx`
- `packages/ui/src/atomic/03-Chat/chat-toolbar.tsx` (exists, may have button)

**Issue:** No UI to insert HiveLab tools into chat messages.

```typescript
// CURRENT chat-input.tsx
<textarea ... />
<button>Send</button>

// NEEDED
<div className="flex items-center gap-2">
  <button onClick={openToolPicker}>
    <PlusIcon /> {/* Opens tool picker */}
  </button>
  <textarea ... />
  <button>Send</button>
</div>
```

**Fix:**
1. Add "+" button to chat input
2. Create tool picker popover (shows deployed tools)
3. On selection, insert `inline_component` message
4. Preview component before sending

---

## Integration Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SPACES PAGE                                  │
├────────────────────────────────────┬────────────────────────────────┤
│                                    │                                │
│  CHAT BOARD (60%)                  │  SIDEBAR (40%)                 │
│  ══════════════                    │  ════════════                  │
│                                    │                                │
│  ┌──────────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ Regular message              │  │  │ ABOUT SECTION            │  │
│  └──────────────────────────────┘  │  └──────────────────────────┘  │
│  ┌──────────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ ┌──────────────────────────┐ │  │  │ HIVELAB TOOLS            │  │
│  │ │ INLINE POLL (HiveLab)   │ │  │  │ ┌────────────────────┐   │  │
│  │ │ ○ Option A  ○ Option B  │ │  │  │ │ Poll Preview       │   │  │
│  │ │ [Vote]                  │ │  │  │ │ [interact inline]  │   │  │
│  │ └──────────────────────────┘ │  │  │ └────────────────────┘   │  │
│  │ 6.1: InlineElementRenderer   │  │  │ 6.2: ElementRenderer     │  │
│  └──────────────────────────────┘  │  └──────────────────────────┘  │
│  ┌──────────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ [+] Type a message... [Send] │  │  │ WIDGET GALLERY           │  │
│  │ 6.6: Tool insertion button   │  │  │ 6.3: Needs CRUD API      │  │
│  └──────────────────────────────┘  │  └──────────────────────────┘  │
│                                    │                                │
└────────────────────────────────────┴────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     HIVELAB (Tool Builder)    │
              │                               │
              │  Create → Deploy → Interact   │
              │  6.4: Unified types           │
              │  6.5: Unified state           │
              └───────────────────────────────┘
```

---

## File Priority Summary (Updated with Integration)

### P0 - Security (This Week)
| File | Change |
|------|--------|
| `apps/web/src/app/api/spaces/transfer/route.ts` | Add builder role check, remove adminOverride |
| `apps/web/src/app/api/spaces/join-v2/route.ts` | Composite key for membership |
| `apps/web/src/lib/space-permission-middleware.ts` | Create unified validation (NEW) |

### P1 - Mission & Code Quality (Week 2-3)
| File | Change |
|------|--------|
| `apps/web/src/app/spaces/[spaceId]/page.tsx` | Remove dead code, extract hooks, 850->250 lines |
| `apps/web/src/hooks/use-chat-messages.ts` | 3s->1s polling, optimistic updates |
| `apps/web/src/hooks/use-space-page-data.ts` | Create: parallel data fetching (NEW) |
| `apps/web/src/hooks/use-space-chat-integration.ts` | Create: chat logic extraction (NEW) |
| `packages/ui/src/atomic/03-Chat/chat-input.tsx` | Add inline component insertion |

### P1 - Integration (Parallel Track)
| File | Change |
|------|--------|
| `packages/ui/src/atomic/03-Spaces/organisms/space-chat-board.tsx` | Wire InlineElementRenderer |
| `packages/ui/src/atomic/03-Spaces/molecules/sidebar-tool-slot.tsx` | Add element preview rendering |
| `packages/core/src/domain/hivelab/types/index.ts` | Canonical type definitions (NEW) |
| `apps/web/src/hooks/use-space-with-tools.ts` | Unified state manager (NEW) |

### P2 - UX Polish (Week 3-4)
| File | Change |
|------|--------|
| All `packages/ui/src/atomic/03-Spaces/*` | ARIA labels |
| All interactive buttons | Touch targets 44px |
| `apps/web/src/hooks/use-space.ts` | Leave confirmation |
| `apps/web/src/app/api/spaces/[spaceId]/widgets/route.ts` | Full CRUD for Widget Gallery |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Security vulnerabilities | 4 critical | 0 |
| ARIA labels coverage | 0% | 100% |
| Page load time (3G) | 4-6s | <2s |
| Touch target compliance | ~50% | 100% |
| Dead code lines | ~200 | 0 |
| page.tsx size | 850 lines | <300 lines |
| Polling interval | 3s | 1s |
| Integration points working | 3/7 | 7/7 |
| Type definition files | 3 duplicates | 1 canonical |
