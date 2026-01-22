# HiveLab TODO

> The tool that builds tools. Student infrastructure that compounds.

---

## Strategic Priorities

### The Thesis
HiveLab is not a feature—it's the reason HIVE becomes indispensable. When students can build what their university won't provide, they own their campus infrastructure.

**Tools are not a feature of Spaces. Tools ARE Spaces.** A Space without tools is just a message board.

### Success Metrics
- Time to first deployed tool: <10 minutes
- Tools deployed per active space: >3
- Cross-tool connections per space: >1
- Monthly active tool interactions: >50% of space members
- Tool persistence across leadership changes: 100%

### Build Philosophy
1. **Value before reach** — Make existing tools powerful before adding connectors
2. **Context before config** — Tools should be smart without setup
3. **Systems before features** — Enable composition, not just creation
4. **Cheap before scale** — Client-side compute, aggressive caching
5. **Native before separate** — Tools feel like part of Spaces, not bolted on

---

## Current State Assessment

### What Works Today
- [x] 27 elements across 3 tiers (Universal, Connected, Space)
- [x] AI generation from natural language (streaming, 4-tier fallback)
- [x] Manual canvas creation with drag-drop
- [x] Tool deployment to spaces (multiple surfaces)
- [x] Element execution with state management
- [x] Shared state (counters, collections, timeline)
- [x] User state (selections, participation)
- [x] Real-time updates via RTDB
- [x] Basic tool versioning
- [x] Rate limiting (60 req/min)
- [x] IDE with element palette, canvas, properties panel (926 lines)

### What's Incomplete
- [ ] Space navigation integration (tools in sidebar)
- [ ] Space context injection (tools know where they are)
- [ ] Member context injection (tools know who's using)
- [ ] Tool-to-tool connections
- [ ] Automations
- [ ] Connectors (external integrations)
- [ ] Template publishing (DDD pattern mismatch)
- [ ] App Check enforcement (commented out)

### Critical Gaps for GTM
1. **Tools hidden in separate tab** — Need sidebar presence
2. **Tools don't know Space context** — No member/role awareness
3. **No tool activity indicators** — Users forget tools exist
4. **No cross-tool data flow** — Tools are islands
5. **No automations** — Tools require manual trigger every time

---

## Phase 0: Space Integration Foundation
*Tools must feel native to Spaces before adding features*

### 0.1 Space Navigation: Tools in Sidebar

**Current state:** Tools live in separate tab, easily forgotten

**Target state:**
```
Space Sidebar:
├── Feed
├── Events
├── Members
├── Resources
├── ─────────────
├── 📊 Dues Tracker      ← pinned tool
├── 📝 Meeting Poll      ← pinned tool
└── [+ Add tool]
```

**Tasks:**
- [ ] **Add tools section to space sidebar**
  - Location: `apps/web/src/components/spaces/space-sidebar.tsx` (or similar)
  - Show pinned tools (max 5)
  - Compact card view with key metric
  - Click → opens tool modal or navigates to full view

- [ ] **Pinned tools data model**
  - Add `pinnedTools: string[]` to Space settings
  - Order matters (user can reorder)
  - Default: first 3 deployed tools

- [ ] **Tool compact view component**
  ```
  ┌──────────────────────┐
  │ 📊 Dues         (3)  │  ← activity badge
  │ ████░░ 67%           │  ← key metric
  └──────────────────────┘
  ```
  - Location: `packages/ui/src/components/hivelab/tool-compact-card.tsx`
  - Shows: icon, name, primary metric, activity badge
  - Hover: quick actions (open, edit, settings)

- [ ] **"Add tool" quick action**
  - Opens tool picker modal
  - Options: Browse templates, AI generate, pick existing

### 0.2 Tool Activity Badges

**Purpose:** Drive engagement, surface what needs attention

**Tasks:**
- [ ] **Badge types**
  - Numeric: "3 new" (new submissions, payments, etc.)
  - Action needed: 🔴 (your vote pending, etc.)
  - Active: 🟢 (poll is live, deadline approaching)

- [ ] **Badge calculation**
  - Compare user's last seen timestamp vs tool state changes
  - Track per-user per-tool `lastSeen` in user state
  - Compute badge client-side from state diff

- [ ] **Badge display**
  - In sidebar compact view
  - In tools tab list
  - In Space overview (if tools have activity)

### 0.3 Tool Quick Actions

**Tasks:**
- [ ] **Hover state on sidebar tools**
  ```
  [Open] [Edit] [⋮]
  ```
  - Open: modal or navigate based on surface setting
  - Edit: navigate to IDE (if has permission)
  - Menu: settings, analytics, unpin

- [ ] **Context menu in tools tab**
  - Pin/unpin from sidebar
  - Duplicate tool
  - View analytics
  - Delete (with confirmation)

### 0.4 Empty State: No Tools Yet

**Tasks:**
- [ ] **Space with no tools prompt**
  ```
  🛠️ Build tools for your org

  What do you need?
  [Track dues, collect applications...]

  Popular for [Consulting Clubs]:
  [Interview Scheduler] [Case Tracker]
  ```
  - Location: Space sidebar tools section when empty
  - Contextual suggestions based on `space.type`

- [ ] **Template suggestions by org type**
  - Map org types to recommended templates
  - Show top 4 most relevant
  - "Browse all" link to marketplace

---

## Phase 1: Context Injection
*Tools become smart without configuration*

### 1.1 Space Context

**What tools should automatically know:**
```typescript
interface SpaceContext {
  id: string;
  name: string;
  type: OrgType;  // consulting, greek, cultural, academic, etc.
  memberCount: number;
  settings: {
    dueAmount?: number;
    meetingDay?: string;
    // ...custom space settings
  };
  roles: SpaceRole[];
  brand: {
    primaryColor: string;
    logo?: string;
  };
}
```

**Tasks:**
- [ ] **Define SpaceContext type**
  - Location: `packages/core/src/domain/hivelab/tool-context.types.ts`

- [ ] **Space context loader**
  - Fetch on tool load (single Firestore read)
  - Cache in IndexedDB (5 min TTL)
  - Location: `packages/hooks/src/use-space-context.ts`

- [ ] **Inject into tool runtime**
  - Wrap tool canvas in `<SpaceContextProvider>`
  - Make available via `useSpaceContext()` hook
  - Pass to element renderers

### 1.2 Member Context

**What tools should know about current user:**
```typescript
interface MemberContext {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;  // member, officer, admin, etc.
  permissions: string[];
  joinedAt: Timestamp;
  tenure: number;  // days in org
  participation: {
    eventsAttended: number;
    postsCreated: number;
    toolInteractions: number;
  };
}
```

**Tasks:**
- [ ] **Define MemberContext type**
  - Location: `packages/core/src/domain/hivelab/tool-context.types.ts`

- [ ] **Member context loader**
  - Fetch current user's membership for this space
  - Include role and permissions
  - Calculate tenure from joinedAt
  - Cache in IndexedDB (5 min TTL)

- [ ] **Participation metrics**
  - Query user's activity in this space
  - Aggregate: events attended, posts, tool usage
  - Can be lazy-loaded (not blocking)

### 1.3 Temporal Context

**Computed client-side (no fetching):**
```typescript
interface TemporalContext {
  now: Date;
  today: string;  // YYYY-MM-DD
  semester: 'fall' | 'spring' | 'summer';
  weekOfSemester: number;
  daysUntilSemesterEnd: number;
  isRushSeason: boolean;  // based on date ranges
  isFinalsWeek: boolean;
}
```

**Tasks:**
- [ ] **Temporal context calculator**
  - Pure function, no async
  - Configurable semester dates (space or campus setting)
  - Location: `packages/core/src/domain/hivelab/temporal-context.ts`

### 1.4 Context in IDE

**Tasks:**
- [ ] **Context picker component**
  ```
  Insert variable:
  ├── User
  │   ├── user.name
  │   ├── user.role
  │   └── user.tenure
  ├── Space
  │   ├── space.name
  │   └── space.memberCount
  └── Time
      ├── now
      └── semester
  ```
  - Location: `packages/ui/src/components/hivelab/ide/context-picker.tsx`
  - Trigger: `{{` in text fields or `@` shortcut
  - Searchable/filterable

- [ ] **Integrate into element config**
  - Any text field supports `{{variable}}` syntax
  - Show picker on trigger
  - Preview resolved value

- [ ] **Interpolation engine**
  - Parse `{{path.to.value}}` in strings
  - Resolve against combined context
  - Handle missing values (empty string or default)
  - Location: `packages/core/src/domain/hivelab/interpolation.ts`

### 1.5 Context in Conditions

**Tasks:**
- [ ] **Condition builder component**
  ```
  Show element if:
  [user.role ▼] [is one of ▼] [☑ officer ☑ admin]
  ```
  - Left: context variable picker
  - Operator: equals, not equals, is one of, greater than, etc.
  - Right: value input or picker
  - Location: `packages/ui/src/components/hivelab/ide/condition-builder.tsx`

- [ ] **Element visibility conditions**
  - Add `conditions` array to element config
  - UI in properties panel: "Show this element if..."
  - Multiple conditions with AND/OR logic

- [ ] **Condition evaluation at runtime**
  - Evaluate all conditions against context
  - Hide elements that don't pass
  - Don't fetch data for hidden elements
  - Location: `packages/core/src/domain/hivelab/condition-evaluator.ts`

---

## Phase 2: Tool-to-Tool Connections
*Systems emerge from composition*

### 2.1 Data Model

```typescript
interface ToolConnection {
  id: string;
  source: {
    deploymentId: string;
    path: string;  // "sharedState.counters.paid" or "elements.memberList.output"
  };
  target: {
    deploymentId: string;
    elementId: string;
    inputPath: string;  // "config.eligibleVoters"
  };
  enabled: boolean;
  createdAt: Timestamp;
}
```

**Tasks:**
- [ ] **Define ToolConnection type**
  - Location: `packages/core/src/domain/hivelab/tool-connection.types.ts`

- [ ] **Connections collection**
  - Firestore: `spaces/{spaceId}/toolConnections/{connectionId}`
  - Index: by source deployment, by target deployment

### 2.2 IDE: Other Tools Panel

**Tasks:**
- [ ] **"Other Tools" section in IDE sidebar**
  ```
  Other Tools in Space:
  ├── Dues Tracker
  │   └── Outputs: paidMembers[], totalPaid
  ├── Member Directory
  │   └── Outputs: allMembers[], activeMembers[]
  └── [Browse more...]
  ```
  - List tools deployed to same space
  - Expandable to show available outputs
  - Click output to insert as data source

- [ ] **Tool output discovery**
  - Analyze tool composition for exportable data
  - Shared state paths (counters, collections)
  - Element outputs (lists, values)

### 2.3 IDE: Connection Wiring

**Tasks:**
- [ ] **Data source property type**
  - New element config type: `toolReference`
  - UI: Tool selector → Path selector
  - Preview: Show current value from source

- [ ] **Connections panel in IDE**
  ```
  Connections:
  ├── eligibleVoters ← Dues.paidMembers
  └── [+ Add connection]
  ```
  - Show all incoming connections for this tool
  - Add/edit/remove connections
  - Test connection (fetch current value)

### 2.4 Connection Resolution at Runtime

**Tasks:**
- [ ] **Connection resolver**
  - On tool load, identify all connections where this tool is target
  - Fetch source deployment's state
  - Extract value at specified path
  - Inject into target element's config
  - Location: `packages/core/src/application/hivelab/connection-resolver.ts`

- [ ] **Caching strategy**
  - Cache resolved connections for 30 sec
  - Invalidate on source state change (if real-time enabled)
  - Lazy resolution (only if element is visible)

### 2.5 Graph View (Optional, Phase 2+)

**Tasks:**
- [ ] **Tool graph visualization**
  - Show tools as nodes, connections as edges
  - Auto-layout with dagre
  - Click node to edit, click edge to edit connection
  - Location: `packages/ui/src/components/hivelab/tool-graph.tsx`

---

## Phase 3: Automations
*Tools run themselves*

### 3.1 Data Model

```typescript
interface Automation {
  id: string;
  deploymentId: string;
  name: string;
  enabled: boolean;

  trigger:
    | { type: 'schedule'; cron: string }
    | { type: 'event'; elementId: string; event: string }
    | { type: 'threshold'; path: string; op: '>' | '<' | '=='; value: any };

  conditions: Condition[];

  actions: (
    | { type: 'mutate'; elementId: string; mutation: any }
    | { type: 'notify'; channel: 'email'; template: string; to: string }
    | { type: 'trigger_tool'; deploymentId: string; event: string }
  )[];

  limits: {
    maxRunsPerDay: number;
    cooldownSeconds: number;
  };

  lastRun?: Timestamp;
  runCount: number;
}
```

**Tasks:**
- [ ] **Define Automation type**
  - Location: `packages/core/src/domain/hivelab/automation.types.ts`

- [ ] **Automations subcollection**
  - Firestore: `deployedTools/{deploymentId}/automations/{automationId}`

### 3.2 Automation Builder UI

**Tasks:**
- [ ] **Automations panel in IDE**
  ```
  Automations                         [+ New]
  ├── Dues Reminder (active)
  │   7 days before deadline → email
  └── Mark Inactive (active)
      When deadline passes → update status
  ```

- [ ] **Automation builder modal**
  ```
  ┌─────────────────────────────────────────┐
  │ New Automation                          │
  ├─────────────────────────────────────────┤
  │ Name: [Dues Reminder                 ]  │
  │                                         │
  │ WHEN                                    │
  │ ○ On schedule                           │
  │   [7 ▼] [days ▼] before [deadline ▼]    │
  │ ○ On event                              │
  │ ○ When value crosses threshold          │
  │                                         │
  │ IF (optional)                           │
  │ [member.hasPaid ▼] [equals ▼] [false]   │
  │                                         │
  │ THEN                                    │
  │ ☑ Send notification                     │
  │   [Email ▼] using [dues_reminder ▼]     │
  │ ☐ Update element                        │
  │ ☐ Trigger another tool                  │
  │                                         │
  │ [Cancel]                [Save]          │
  └─────────────────────────────────────────┘
  ```
  - Location: `packages/ui/src/components/hivelab/automation-builder.tsx`

### 3.3 Automation Runner: Events

**Tasks:**
- [ ] **Firestore trigger function**
  - Trigger on: `deployedTools/{deploymentId}/sharedState/current` writes
  - Logic: Find automations with event triggers, evaluate conditions, execute
  - Location: `functions/automations/on-state-change.ts`

- [ ] **Event detection**
  - Compare old vs new state
  - Detect: counter increment, item added, field changed
  - Match to automation event triggers

### 3.4 Automation Runner: Schedule

**Tasks:**
- [ ] **Cloud Scheduler setup**
  - Single job: runs every minute
  - Invokes Cloud Function

- [ ] **Schedule function**
  - Query: automations WHERE type='schedule' AND nextRun <= now AND enabled
  - For each: evaluate conditions, execute actions, update lastRun
  - Batch writes for efficiency
  - Location: `functions/automations/run-scheduled.ts`

- [ ] **Cron parser**
  - Parse human-readable: "7 days before deadline"
  - Convert to next run timestamp
  - Support: relative to field value, absolute cron

### 3.5 Notification Actions

**Tasks:**
- [ ] **Email action**
  - Use existing Resend integration
  - Template interpolation with context
  - Rate limit: 100/day per deployment

- [ ] **Template editor**
  - Simple rich text with variable insertion
  - Preview with sample data
  - Location: `packages/ui/src/components/hivelab/notification-template-editor.tsx`

### 3.6 Automation Logs

**Tasks:**
- [ ] **Log schema**
  ```typescript
  interface AutomationRun {
    automationId: string;
    timestamp: Timestamp;
    status: 'success' | 'skipped' | 'failed';
    conditionResults?: boolean[];
    actionsExecuted?: string[];
    error?: string;
  }
  ```

- [ ] **Logs viewer in IDE**
  - List recent runs (last 50)
  - Filter by status
  - Expandable details

---

## Phase 4: Connectors
*Bridge to external systems (pull users IN)*

### 4.1 Notification Hooks

**Tasks:**
- [ ] **Email notification hook** (extends existing)
  - Trigger from automation action
  - Template with context interpolation

- [ ] **GroupMe notification hook**
  - User provides bot token
  - Store encrypted
  - Send message with link back to HIVE
  - Never send full content, only teaser

- [ ] **Discord webhook**
  - User provides webhook URL
  - Send embed with link

### 4.2 Import Connectors

**Tasks:**
- [ ] **Google Sheets import**
  - OAuth flow
  - Select sheet, map columns
  - One-time or scheduled import

- [ ] **Google Calendar import**
  - OAuth flow
  - Import events to HIVE events or tool data

### 4.3 Inbound Webhooks

**Tasks:**
- [ ] **Webhook receiver endpoint**
  - Auto-generated URL per deployment
  - Secret validation
  - Map payload to tool state update

---

## Phase 5: Polish & Hardening

### 5.1 Theme Inheritance

**Tasks:**
- [ ] **Space brand in tool runtime**
  - Tools inherit `space.brand.primaryColor`
  - Apply to accent colors, buttons, active states
  - No per-tool config needed (automatic)

### 5.2 Surface-Specific UI

**Tasks:**
- [ ] **Compact view for sidebar**
  - Reduced padding, smaller text
  - Single key metric visible
  - Click expands to modal

- [ ] **Modal view**
  - Dialog wrapper
  - Close on escape, click outside
  - Full tool functionality

- [ ] **Embedded view (in posts)**
  - No chrome, blends with post
  - Single interaction focus

### 5.3 Handoff & Continuity

**Tasks:**
- [ ] **Tool ownership transfer**
  - When leadership changes, tool ownership follows role
  - Or explicit transfer UI
  - Full history preserved

- [ ] **Audit trail**
  - Log who edited tool, when
  - Log automation runs
  - Available to officers

### 5.4 Security

**Tasks:**
- [ ] **App Check enforcement**
  - Enable in production
  - Bypass for development

- [ ] **Rate limiting audit**
  - Per-user limits
  - Per-deployment limits
  - Automation limits

---

## Implementation Order

### Sprint 1: Space Integration (2 weeks)
**Goal:** Tools feel native to Spaces

| Task | Priority | Effort |
|------|----------|--------|
| Sidebar tools section | P0 | Medium |
| Pinned tools data model | P0 | Low |
| Tool compact card component | P0 | Medium |
| Add tool quick action | P1 | Low |
| Tool activity badges | P1 | Medium |
| Empty state with suggestions | P1 | Low |

**Exit criteria:** Tools visible in sidebar, users discover them naturally

### Sprint 2: Context Injection (2 weeks)
**Goal:** Tools are smart without config

| Task | Priority | Effort |
|------|----------|--------|
| SpaceContext loader + cache | P0 | Medium |
| MemberContext loader + cache | P0 | Medium |
| Context picker in IDE | P0 | Medium |
| Template interpolation engine | P0 | Medium |
| Condition builder component | P1 | High |
| Element visibility conditions | P1 | Medium |

**Exit criteria:** Tools know who's using them and where, conditions work

### Sprint 3: Connections (2 weeks)
**Goal:** Tools work together

| Task | Priority | Effort |
|------|----------|--------|
| ToolConnection data model | P0 | Low |
| Other tools panel in IDE | P0 | Medium |
| Data source property type | P0 | Medium |
| Connection resolver runtime | P0 | High |
| Connections panel in IDE | P1 | Medium |

**Exit criteria:** Dues tracker → Voting tool eligibility works

### Sprint 4: Automations (3 weeks)
**Goal:** Tools run themselves

| Task | Priority | Effort |
|------|----------|--------|
| Automation data model | P0 | Low |
| Automations panel in IDE | P0 | Medium |
| Automation builder modal | P0 | High |
| Event trigger runner | P0 | High |
| Schedule trigger runner | P1 | High |
| Email action | P0 | Medium |
| Automation logs viewer | P1 | Medium |

**Exit criteria:** Automated dues reminder works end-to-end

### Sprint 5: Polish (1 week)
**Goal:** Production ready

| Task | Priority | Effort |
|------|----------|--------|
| Theme inheritance | P1 | Low |
| Surface-specific UI | P1 | Medium |
| App Check enforcement | P0 | Low |
| Error handling audit | P0 | Medium |

---

## Open Questions

### Product
1. **Max pinned tools?** Recommend 5 to prevent clutter
2. **Tool ownership model?** Creator owns, or role-based?
3. **Can members create tools?** Or officers+ only?
4. **Automation limits?** Max 10 per tool? 100 runs/day?

### Technical
1. **Real-time connections?** RTDB listener or polling?
2. **Context cache invalidation?** 5 min TTL or event-based?
3. **Automation cold starts?** Acceptable for Cloud Functions?

### UX
1. **Tool discovery?** How prominent should suggestions be?
2. **Connection visualization?** Is graph view necessary for MVP?
3. **Automation debugging?** How much visibility into failures?

---

## Key Files Reference

| What | Location |
|------|----------|
| Element registry | `packages/core/src/domain/hivelab/element-registry.ts` |
| Tool composition types | `packages/core/src/domain/hivelab/tool-composition.types.ts` |
| IDE component | `packages/ui/src/components/hivelab/ide/hivelab-ide.tsx` |
| Tool runtime | `packages/ui/src/components/hivelab/tool-canvas.tsx` |
| Execution hook | `packages/hooks/src/use-tool-execution.ts` |
| Execute API | `apps/web/src/app/api/tools/execute/route.ts` |
| Deploy API | `apps/web/src/app/api/tools/deploy/route.ts` |
| Space sidebar | `apps/web/src/components/spaces/` (TBD) |

## Related Docs

| Doc | Purpose |
|-----|---------|
| `HIVELAB_ARCHITECTURE.md` | Original architecture |
| `HIVELAB_EXPONENTIAL_SPEC.md` | Connectors, automations, intelligence spec |
| `DATABASE_SCHEMA.md` | Firestore collections |

---

## Readiness Assessment

### Ready to Build
- [x] Core thesis clear
- [x] User journey mapped
- [x] Data models defined
- [x] UI components identified
- [x] Integration points documented
- [x] Implementation order prioritized

### Needs Clarification
- [ ] Space sidebar component location (need to audit current codebase)
- [ ] Automation limits (product decision)
- [ ] Tool ownership model (product decision)

### Dependencies
- Existing IDE (working)
- Existing tool deployment (working)
- Existing tool execution (working)
- Resend email integration (exists)
- Cloud Functions infrastructure (exists)
- Cloud Scheduler (needs setup)

---

**Status: READY TO BUILD**

Sprint 1 can start immediately. Product questions can be resolved in parallel.
