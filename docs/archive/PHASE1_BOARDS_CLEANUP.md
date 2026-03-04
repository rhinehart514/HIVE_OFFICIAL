# KILL #1: Multi-Board Switching Removal - STATUS REPORT

## ✅ COMPLETED (70%)

### Files Deleted (5)
- `board-creation-modal.tsx`
- `BoardEmptyState.tsx`
- `board-item.tsx`
- `boards-list.tsx`
- `board-header.tsx`

### Backend Simplified
**`use-space-residence-state.ts`** - Core hook cleaned:
- ✅ Removed `boards` state array
- ✅ Removed `activeBoard`/`setActiveBoard`  
- ✅ Removed `BoardsListProps` from interface
- ✅ Removed board API fetches
- ✅ Removed board query params from chat API calls
- ✅ ChatMessage interface no longer requires `boardId`

**`components/index.ts`** - Exports cleaned:
- ✅ Removed BoardsList, BoardItem, BoardHeader exports
- ✅ Removed BoardEmptyState and getBoardType exports

**`space-sidebar.tsx`** - Simplified:
- ✅ Removed BoardsList import and rendering
- ✅ Updated props interface (no more `boards: BoardsListProps`)
- ✅ Removed collapsed boards icon view

**`page.tsx`** - Partially cleaned:
- ✅ Removed BoardCreationModal import/rendering
- ✅ Removed handleBoardCreate function
- ✅ Removed keyboard nav hook (was boards-dependent)
- ✅ Removed showBoardModal state
- ✅ Simplified empty state (no BoardEmptyState component)

## 🚧 REMAINING (30%)

### `page.tsx` - 15 references to clean:
1. Line 283-291: `sidebarBoardsNew` mapping (transform function)
2. Line 444, 447: Edit message uses `activeBoard` in API call  
3. Line 467, 475: Delete message uses `activeBoard`
4. Lines 686-689: SpaceSidebar still passed `boards` prop
5. Line 716: Chat input placeholder references `activeBoard` 
6. Line 904: SpaceTabs passed `boards` array
7. Line 983: Delete space description mentions "boards"
8. Line 1010-1037: Delete board confirm dialog (entire block)
9. Line 1065: Thread panel uses `boardId`

### `page.tsx` - Missing imports:
- Line 41: Still imports `Board` type from './components'

### API Routes - May need updates:
- `/api/spaces/[spaceId]/chat` - ensure it works without `boardId` param
- `/api/spaces/[spaceId]/chat/[messageId]` - ensure edit/delete work without `boardId`

## ⚡ COMPLETION PLAN (45 min)

1. **Fix page.tsx references** (20 min)
   - Remove sidebarBoardsNew transform
   - Change edit/delete message API calls to not use boardId
   - Remove boards prop from SpaceSidebar
   - Simplify chat placeholder to use space name
   - Remove boards from SpaceTabs
   - Remove delete board dialog block

2. **Fix remaining type errors** (15 min)
   - Remove `Board` import
   - Fix any remaining activeBoard references
   - Update thread panel to not need boardId

3. **Test & verify** (10 min)
   - Typecheck passes
   - App loads without runtime errors
   - Chat works in a space

## WHY THIS MATTERS

Multi-board switching was a complexity tax:
- 5 components maintaining board state
- Every message tied to a boardId
- Extra API parameters on every chat call
- Keyboard shortcuts for board switching
- Leaders could create/reorder boards (unused feature)

**After cleanup:** One feed per space. Simpler mental model. Less code. Faster loads.

## NEXT STEPS

Option A: Finish this now (45 min)
Option B: Park it, move to KILL #2 (threshold) which is more isolated, come back

**Recommendation:** Complete it. The remaining work is mechanical find-replace. Worth doing now to avoid TypeScript errors blocking other work.
