# Space Detail Page - Architecture Diagram

## Visual Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           page.tsx (337 lines)                               │
│                     Layout Orchestration Layer                               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  SpaceBoardPage                                                       │  │
│  │    └── SpaceEntryWrapper (entry animation)                            │  │
│  │          └── SpaceDetailContent                                       │  │
│  │                ├── Loading/Error/NotFound states                      │  │
│  │                ├── Threshold (first-time visitors)                    │  │
│  │                └── Main UI Layout                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ uses
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      hooks/use-space-page-state.ts (702 lines)               │
│                            State Aggregation Layer                           │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  useSpacePageState()                                                  │  │
│  │    ├── Core State                                                     │  │
│  │    │   ├── useSpaceMetadata() → space, membership, isLeader          │  │
│  │    │   ├── useSpaceEvents() → events                                 │  │
│  │    │   └── useAuth() → currentUser                                   │  │
│  │    │                                                                  │  │
│  │    ├── Feature State                                                  │  │
│  │    │   ├── useChatMessages() → chat, boards, messages                │  │
│  │    │   ├── useToolRuntime() → selectedTool, toolRuntime              │  │
│  │    │   ├── usePinnedMessages() → pinnedMessages                      │  │
│  │    │   ├── useAutomations() → automations                            │  │
│  │    │   ├── useLeaderOnboarding() → leaderOnboarding                  │  │
│  │    │   └── useFoundingClassRitual() → foundingClassRitual            │  │
│  │    │                                                                  │  │
│  │    ├── UI State                                                       │  │
│  │    │   ├── modals (8 modal states)                                   │  │
│  │    │   ├── activeDrawer (mobile navigation)                          │  │
│  │    │   ├── scrollToMessageId                                         │  │
│  │    │   ├── showThreshold                                             │  │
│  │    │   └── sidebarEditMode                                           │  │
│  │    │                                                                  │  │
│  │    └── Handler Wiring (uses factories below)                         │  │
│  │        ├── createSpaceHandlers()                                     │  │
│  │        ├── createChatHandlers()                                      │  │
│  │        ├── createToolHandlers()                                      │  │
│  │        └── createAutomationHandlers()                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ↓                ↓                ↓
┌───────────────────────────────────────────────────────────────────────────┐
│                         handlers/ (875 lines)                              │
│                      Business Logic Layer                                  │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐ │
│  │ space-handlers.ts   │  │ chat-handlers.ts    │  │ tool-handlers.ts  │ │
│  │     (143 lines)     │  │     (294 lines)     │  │   (161 lines)     │ │
│  │                     │  │                     │  │                   │ │
│  │ • handleAddTab      │  │ • handleSendMessage │  │ • handleOpenHiveLab│ │
│  │ • handleAddWidget   │  │ • handleConfirmIntent│ │ • handleDeployTool│ │
│  │ • handleInviteMember│  │ • handleDismissIntent│ │ • handleQuickDeploy│ │
│  │ • handleSearchUsers │  │ • handleInsertTool  │  │ • handleRemoveTool│ │
│  │ • handleCreateEvent │  │ • handleSlashCommand│  │                   │ │
│  │ • handleEventRSVP   │  │                     │  │                   │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────┘ │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐                         │
│  │automation-handlers.ts│ │     types.ts        │                         │
│  │     (173 lines)     │  │     (92 lines)      │                         │
│  │                     │  │                     │                         │
│  │ • handleAutomation  │  │ • ToolData          │                         │
│  │   Command           │  │ • LeaderData        │                         │
│  │                     │  │ • SelectedTool      │                         │
│  │                     │  │ • PendingIntent     │                         │
│  └─────────────────────┘  └─────────────────────┘                         │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ called by
                                     ↓
┌───────────────────────────────────────────────────────────────────────────┐
│                       components/ (799 lines)                              │
│                          UI Component Layer                                 │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ space-page-sidebar.tsx (177 lines)                                   │ │
│  │   ├── PinnedMessagesWidget                                           │ │
│  │   ├── LeaderSetupProgress                                            │ │
│  │   ├── AutomationsPanel                                               │ │
│  │   ├── RitualStrip                                                    │ │
│  │   └── SpaceSidebar (main)                                            │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ space-page-modals.tsx (215 lines)                                    │ │
│  │   ├── SpaceLeaderModals (add tab, widget, invite, event)            │ │
│  │   ├── ToolRuntimeModal                                               │ │
│  │   ├── ThreadDrawer                                                   │ │
│  │   ├── AutomationTemplates Sheet                                     │ │
│  │   ├── SpaceLeaderOnboardingModal                                    │ │
│  │   ├── SpaceWelcomeModal                                             │ │
│  │   └── EventDetailsModal                                             │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ space-mobile-navigation.tsx (153 lines)                              │ │
│  │   ├── Mobile drawer system                                           │ │
│  │   ├── Bottom navigation                                              │ │
│  │   └── Swipe-up panels                                                │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ space-leader-modals.tsx (121 lines)                                  │ │
│  │   ├── AddTabModal                                                    │ │
│  │   ├── AddWidgetModal                                                 │ │
│  │   ├── InviteMemberModal                                              │ │
│  │   └── CreateEventModal                                               │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │ space-entry-wrapper │  │ intent-confirm   │  │ error-toast.tsx     │ │
│  │   .tsx (57 lines)   │  │ ation.tsx        │  │    (25 lines)       │ │
│  │                     │  │   (38 lines)     │  │                     │ │
│  │ • Entry animation   │  │ • Intent banner  │  │ • Error notification│ │
│  │ • Session tracking  │  │ • Confirm/Dismiss│  │ • Retry button      │ │
│  └─────────────────────┘  └──────────────────┘  └─────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ uses utilities
                                     ↓
┌───────────────────────────────────────────────────────────────────────────┐
│                          utils/ (27 lines)                                 │
│                       Helper Utilities Layer                                │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ tool-runtime-builder.ts (27 lines)                                   │ │
│  │   └── buildToolRuntime() - Transform runtime state for modal        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Action
    │
    ↓
Component (calls handler prop)
    │
    ↓
Handler (business logic)
    │
    ├─→ API Call (via secureApiFetch)
    │     │
    │     ↓
    │   Backend
    │     │
    │     ↓
    ├─→ Update State (via setState or refresh)
    │
    └─→ Toast Notification
    │
    ↓
State Update
    │
    ↓
Hook Re-computation
    │
    ↓
Component Re-render
    │
    ↓
UI Update
```

## Import Graph

```
page.tsx
  │
  ├─→ @hive/ui (UI components)
  │     └─→ SpaceDetailHeader, SpaceChatBoard, BoardTabBar, etc.
  │
  ├─→ @/contexts/space (React context)
  │     └─→ useSpaceStructureContext
  │
  ├─→ ./hooks (state management)
  │     └─→ useSpacePageState
  │           │
  │           ├─→ @hive/auth-logic (useAuth)
  │           ├─→ @/contexts/space (useSpaceMetadata, useSpaceEvents)
  │           ├─→ @/hooks (useChatMessages, useToolRuntime, etc.)
  │           └─→ ./handlers (handler factories)
  │                 │
  │                 ├─→ space-handlers
  │                 ├─→ chat-handlers
  │                 ├─→ tool-handlers
  │                 └─→ automation-handlers
  │
  └─→ ./components (UI modules)
        │
        ├─→ space-page-sidebar
        │     └─→ ./utils/tool-runtime-builder
        │
        ├─→ space-page-modals
        │     └─→ space-leader-modals
        │
        ├─→ space-mobile-navigation
        ├─→ space-entry-wrapper
        ├─→ intent-confirmation
        └─→ error-toast
```

## Responsibility Matrix

| Layer | Responsibilities | Forbidden |
|-------|-----------------|-----------|
| **page.tsx** | Layout orchestration, routing, conditional rendering | Business logic, API calls, state management |
| **hooks/** | State aggregation, data loading, handler wiring | UI rendering, navigation, business rules |
| **handlers/** | Business logic, API calls, toast notifications | UI components, direct state management |
| **components/** | UI rendering, user interactions, local UI state | Data fetching, business logic, API calls |
| **utils/** | Pure functions, data transformations | Side effects, API calls, state management |

## File Size Distribution

```
Main page.tsx:        337 lines  ████████████░░░░░░░░ (13%)
Hooks:                702 lines  ████████████████████████████░░ (27%)
Handlers:             875 lines  ████████████████████████████████░░░ (34%)
Components:           799 lines  ████████████████████████████████ (31%)
Utils:                 27 lines  █ (1%)
                    ──────────
Total:              2,747 lines
```

## Complexity Reduction

```
Before:
┌────────────────────────────────────────┐
│                                        │
│         1,880 lines                    │
│         All in one file                │
│         High coupling                  │
│         Hard to maintain               │
│                                        │
└────────────────────────────────────────┘

After:
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Page │ │ Hooks│ │Handler│ │ Comp │ │ Utils│
│ 337  │ │ 702  │ │ 875  │ │ 799  │ │  27  │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘
  Clean separation of concerns
  Low coupling, high cohesion
  Easy to maintain and test
```

## Testing Strategy per Layer

```
┌─────────────────────────────────────────────────────────┐
│ Layer: page.tsx                                          │
│ Testing: E2E tests (Playwright)                          │
│ Focus: User flows, navigation, error states              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Layer: hooks/use-space-page-state.ts                     │
│ Testing: Integration tests (React Testing Library)       │
│ Focus: State aggregation, handler wiring                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Layer: handlers/*.ts                                     │
│ Testing: Unit tests (Jest)                               │
│ Focus: Business logic, API calls, error handling         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Layer: components/*.tsx                                  │
│ Testing: Component tests (React Testing Library)         │
│ Focus: UI rendering, user interactions, props            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Layer: utils/*.ts                                        │
│ Testing: Unit tests (Jest)                               │
│ Focus: Pure functions, edge cases                        │
└─────────────────────────────────────────────────────────┘
```

## Performance Impact

### Before Refactoring
- Single large file → No code splitting
- All code loaded upfront → Slow initial load
- Difficult to optimize → High bundle size

### After Refactoring
- Modular structure → Enables code splitting
- Components can be lazy loaded → Faster initial load
- Tree-shakeable handlers → Reduced bundle size
- Memoization opportunities → Better runtime performance

## Maintenance Impact

### Before: Finding a Bug
1. Open 1,880 line file
2. Search through entire file
3. Risk breaking unrelated code
4. Hard to write tests

### After: Finding a Bug
1. Identify layer (page/state/handler/component)
2. Open specific file (max 702 lines)
3. Fix in isolation
4. Easy to write unit test

---

**Version:** 5.0.0
**Last Updated:** January 7, 2026
