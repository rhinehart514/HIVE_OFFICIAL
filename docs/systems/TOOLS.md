# TOOLS SYSTEM (HiveLab)

> Comprehensive Feature Specification
> Status: 70% Infrastructure Ready | 100% Builder UI Complete
> Last Updated: 2026-02-04

---

## Executive Summary

HiveLab is HIVE's visual tool builder—Figma meets Cursor for campus tools. Space leaders describe what they want, elements appear on a canvas, and they deploy to their space in under 60 seconds. The system enables non-technical students to create polls, RSVPs, leaderboards, countdowns, and custom workflows without code.

**Current State (verified 2026-02-05 audit):**
- 32 composable elements across 3 access tiers (previously documented as 27)
- 30 templates: 8 system + 5 universal + 17 quick templates (previously documented as 35)
- 41 API routes for the tool ecosystem (previously documented as 26)
- Canvas-first IDE with real-time AI generation
- Execution engine partially implemented (actions work, automations stored but don't fire)

**Critical Gaps:**
- Automation triggers never fire (scheduled, event-based, threshold)
- Connection cascades stored but don't propagate automatically
- AI element generation is rules-based only (no LLM composition)
- Template versioning absent (breaking changes corrupt silently)
- Community trust/reviews infrastructure exists but no UI

---

## Part 1: Current State Analysis

### 1.1 What Exists Today

#### File Map

| Domain | Key Files | Purpose |
|--------|-----------|---------|
| Lab Dashboard | `apps/web/src/app/lab/page.tsx` | Tool gallery, quick templates, AI prompt input |
| Tool Studio (IDE) | `apps/web/src/app/lab/[toolId]/page.tsx` | Canvas editor with Edit/Use mode toggle |
| Tool Execution | `apps/web/src/app/api/tools/execute/route.ts` | Action handlers (vote, submit, rsvp, etc.) |
| Tool CRUD | `apps/web/src/app/api/tools/route.ts` | Create, list, update tools |
| Deployment | `apps/web/src/app/api/tools/[toolId]/deploy/route.ts` | Deploy to space/profile |
| Automations | `apps/web/src/app/api/tools/[toolId]/automations/route.ts` | CRUD for automation rules |
| Domain Types | `packages/core/src/domain/hivelab/*.types.ts` | Composition, automation, connection types |
| Templates | `packages/core/src/domain/hivelab/system-tool-templates.ts` | 8 system + 5 universal templates |
| Element Registry | `packages/ui/src/hivelab/element-system.ts` | 32 element definitions |
| Runtime Hook | `apps/web/src/hooks/use-tool-runtime.ts` | Client-side state + action execution |
| Automation Runner | `packages/core/src/application/hivelab/automation-runner.service.ts` | Execution logic (unused) |
| Cloud Functions | `functions/src/automations/*.ts` | Scheduled + event triggers (incomplete) |

#### API Routes (41 Endpoints — verified 2026-02-05)

**Creation & Editing:**
- `GET /api/tools` - List user's tools with deployment context
- `POST /api/tools` - Create tool (supports templateId)
- `GET/PUT /api/tools/[toolId]` - Fetch/update specific tool
- `POST /api/tools/generate` - AI generation (streaming)
- `GET /api/tools/personal` - User's personal tools

**Deployment & Execution:**
- `POST /api/tools/[toolId]/deploy` - Deploy to space or profile
- `DELETE /api/tools/[toolId]/deploy?spaceId=` - Undeploy
- `POST /api/tools/execute` - Execute action (vote, rsvp, submit, etc.)
- `GET/POST /api/tools/[toolId]/state` - Tool state management
- `GET /api/tools/[toolId]/with-state` - Tool with current state

**Automations:**
- `GET/POST /api/tools/[toolId]/automations` - List/create automations
- `GET/PUT/DELETE /api/tools/[toolId]/automations/[automationId]` - Manage automation
- `POST /api/tools/[toolId]/automations/[automationId]/test` - Test run
- `POST /api/tools/[toolId]/automations/[automationId]/trigger` - Manual trigger
- `GET /api/tools/[toolId]/automations/[automationId]/runs` - Run history

**Connections:**
- `GET/POST /api/tools/[toolId]/connections` - Tool-to-tool connections
- `GET/DELETE /api/tools/[toolId]/connections/[connectionId]` - Manage connection

**Discovery & Analytics:**
- `GET /api/tools/browse` - Marketplace browsing
- `GET /api/tools/search` - Search tools
- `GET /api/tools/recommendations` - AI recommendations
- `POST /api/tools/install` - Install from marketplace
- `GET /api/tools/[toolId]/analytics` - Usage analytics
- `POST /api/tools/[toolId]/reviews` - Add review

#### Data Model

**Tool Document** (`tools/{toolId}`):
```typescript
{
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  ownerId: string;
  campusId: string;
  elements: CanvasElement[];      // Visual composition
  connections: ElementConnection[]; // Intra-tool data flow
  provenance: {
    creatorId: string;
    forkedFrom?: string;
    lineage: string[];
    trustTier: 'unverified' | 'verified' | 'trusted';
  };
  supportedSurfaces: { widget: boolean; app: boolean };
  requiredCapabilities: ToolCapabilities;
  originalContext?: { type: 'space' | 'profile'; id: string };
  createdAt: Date;
  updatedAt: Date;
}
```

**Deployment Document** (`deployedTools/{deploymentId}`):
```typescript
{
  id: string;
  toolId: string;
  deployedTo: 'space' | 'profile';
  targetId: string;
  surface: 'sidebar' | 'posts' | 'chat' | 'widget';
  capabilities: ToolCapabilities;
  budgets: ToolBudgets;
  capabilityLane: 'safe' | 'elevated' | 'admin';
  surfaceModes: { widget: boolean; app: boolean };
  provenance: { creatorId: string; trustTier: string };
  status: 'active' | 'paused' | 'archived';
  usageCount: number;
  deployedBy: string;
  deployedAt: Date;
}
```

**Shared State** (`deployedTools/{id}/sharedState/current`):
```typescript
{
  counters: Record<string, number>;     // e.g., "poll1:optionA": 42
  collections: Record<string, Record<string, Entity>>; // e.g., "rsvp1:attendees"
  timeline: TimelineEvent[];            // Activity log
  computed: Record<string, unknown>;    // Derived values
  version: number;
  lastModified: string;
}
```

**User State** (`toolStates/{deploymentId}_{userId}`):
```typescript
{
  selections: Record<string, unknown>;    // User's choices
  participation: Record<string, boolean>; // Has voted, submitted, etc.
  personal: Record<string, unknown>;      // Drafts, preferences
  ui: Record<string, unknown>;            // Collapse states, etc.
  updatedAt: Date;
}
```

**Automation** (`deployedTools/{id}/automations/{automationId}`):
```typescript
{
  id: string;
  deploymentId: string;
  name: string;
  enabled: boolean;
  trigger: EventTrigger | ScheduleTrigger | ThresholdTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  limits: { maxRunsPerDay: number; cooldownSeconds: number };
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  errorCount: number;
}
```

**Connection** (`spaces/{spaceId}/toolConnections/{connectionId}`):
```typescript
{
  id: string;
  spaceId: string;
  source: { deploymentId: string; path: string };
  target: { deploymentId: string; elementId: string; inputPath: string };
  transform?: DataTransform;
  enabled: boolean;
  createdBy: string;
}
```

#### Element System (27 Elements)

**Tier 1: Universal (15)** - No HIVE data needed
- `search-input`, `filter-selector`, `date-picker`, `form-builder`
- `result-list`, `tag-cloud`, `map-view`, `chart-display`
- `countdown-timer`, `poll-element`, `leaderboard`, `markdown-element`
- `image-element`, `button-element`, `user-selector`

**Tier 2: Connected (5)** - Public campus data
- `event-picker`, `space-picker`, `rsvp-element`, `member-list`, `user-selector`

**Tier 3: Space (7)** - Private space data, leaders only
- `space-stats`, `space-events`, `space-members`, `space-feed`
- `tool-list`, `member-activity`, `space-announcements`

#### Action Handlers (Execution Engine)

The execute route (`/api/tools/execute`) handles 30+ action types:

| Action | Element | Behavior |
|--------|---------|----------|
| `vote` | poll-element | Increment counter, track voter, prevent double-vote |
| `rsvp` | rsvp-element | Update attendee collection, adjust status counters |
| `submit` | form-builder | Store submission in collection, increment count |
| `increment/decrement` | counter | Atomic counter update |
| `toggle` | any | Boolean flip |
| `start/stop/reset/lap` | countdown-timer | Timer state management |
| `search` | search-input | Store query |
| `select_*` | pickers | Store selection in user state |
| `update_score` | leaderboard | Update score counter, upsert entry |
| `send_announcement` | announcement | Create notification (stubbed) |

**State Architecture:**
- **Shared State**: Aggregate data visible to all (counters, collections, timeline)
- **User State**: Per-user data (selections, participation, drafts)
- Action handlers return `sharedStateUpdate` and `userStateUpdate` objects
- Atomic Firestore operations prevent race conditions

### 1.2 What Works Well

1. **Canvas IDE Experience**: Full drag-drop, resize, snap-to-grid, smart guides, undo/redo
2. **Element Composition**: 32 elements with consistent config schemas and action definitions
3. **Action Execution**: Vote, RSVP, form submission all work end-to-end with proper state isolation
4. **Template Gallery**: Quick templates for common use cases (poll, countdown, RSVP)
5. **Deployment Flow**: Deploy modal with space selection, capability configuration
6. **State Separation**: Shared state (aggregate) vs user state (personal) architecture is clean
7. **Rate Limiting**: Tool execution rate limited (60 req/min per user)
8. **Capability Governance**: Lane system (safe/elevated/admin) with budget enforcement

### 1.3 What's Broken or Missing

#### P0: Automation Execution Engine

**Status:** CRUD complete. Triggers stored. Execution never fires.

The automation system has:
- Full type definitions (`tool-automation.types.ts`)
- API routes for CRUD (`/api/tools/[toolId]/automations/*`)
- Runner service (`automation-runner.service.ts`)
- Cloud Functions scaffolded (`functions/src/automations/`)

**What's missing:**
1. **Scheduled automations**: Cloud Scheduler calls `runScheduledAutomations` but action executors return "not implemented" for email/push
2. **Event triggers**: No event bus connects tool actions to automation evaluation
3. **Threshold triggers**: State change detection exists but never invoked
4. **Action execution**: `sendEmail`, `sendPush`, `mutateElement`, `triggerTool` all stubbed

**Files to fix:**
- `functions/src/automations/action-executors.ts` - Implement real email/push/mutate
- `apps/web/src/app/api/tools/execute/route.ts:1100+` - Fire event triggers after action
- Wire `on-state-change.ts` to detect threshold crossings

#### P1: Connection Cascade Propagation

**Status:** Connections stored. Cascade execution manual only.

Tool-to-tool connections are defined in `tool-connection.types.ts`:
- Source tool outputs (counter values, collections, etc.)
- Target tool inputs (element config properties)
- Transform functions (toArray, toCount, toBoolean, etc.)

**What's missing:**
1. **Automatic propagation**: When source tool state changes, target tool should update
2. **Real-time sync**: Connections should propagate within 500ms
3. **Cycle detection**: Circular connections could infinite loop

**Files to fix:**
- `apps/web/src/lib/tool-connection-engine.ts` - `processActionConnections()` exists but needs wiring
- Add Firestore trigger on `sharedState` change to evaluate connections

#### P2: Template Versioning

**Status:** Templates deployed without version lock. Updates break silently.

When a template is used to create a tool:
- Tool gets a snapshot of template elements
- No `templateVersion` stored
- If template definition changes, existing tools continue working
- But "update from template" feature would corrupt state

**Need:**
- Store `templateVersion` on tool creation
- Diff algorithm to show template changes
- "Apply update" with state migration

#### P3: AI Element Generation

**Status:** Rules-based pattern matching only. No LLM composition.

Current AI generation (`ai-tool-generator.service.ts`):
- Keyword extraction from user prompt
- Template matching (poll → poll-element, countdown → countdown-timer)
- Static config injection

**Missing:**
- Claude/Gemini API integration for novel compositions
- Multi-element layout generation
- Connection inference between elements
- Iterative refinement ("make the poll options editable")

### 1.4 Quality Assessment

| Area | Score | Notes |
|------|-------|-------|
| Data Model | **A** | Clean separation of tool/deployment/state, proper typing |
| API Design | **A-** | RESTful, consistent, good validation. Some routes missing auth. |
| IDE UX | **A** | Polished canvas, keyboard shortcuts, real-time preview |
| Execution Engine | **B** | Actions work, but automations/connections incomplete |
| Templates | **B+** | Good coverage, missing version control |
| AI Generation | **C** | Rules only, no real AI composition |
| Documentation | **B-** | Architecture doc exists, API docs sparse |
| Test Coverage | **D** | Minimal unit tests, no E2E for tool flows |

---

### Audit Findings (2026-02-05 — 17-Agent Cross-System Audit)

**Stat Corrections:**
- Routes: 41 actual (was documented as 26) — includes automation CRUD, connections, analytics, reviews, marketplace
- Elements: 32 actual (was documented as 27) — 5 additional elements added since last doc update
- Templates: 30 actual (was documented as 35) — 5 quick templates removed

**Critical Blockers Found:**
1. **Setups system has 0 UI** — API routes exist but no frontend pages
2. **Automations panel not ready** — CRUD backend works, but triggers NEVER fire (no Cloud Scheduler, no event bus)
3. **Runs history has no page** — API returns data, no UI to view it
4. **Settings has no page** — Tool-level settings not surfaced

**Additional Findings:**
- `api/tools/updates/route.ts:898` has commented-out `createNotification()` — space members never notified of tool updates
- IDE is 80% complete — canvas, element composition, deploy all working
- Creator attribution missing from all tool cards (ToolCard.tsx shows zero author info)
- Template versioning absent — deployed templates don't track upstream changes
- Connection cascades stored but execution never propagates automatically
- AI element generation is rules-based only (no LLM composition despite UI suggesting it)

---

## Part 2: Gaps & Refinements

### 2.1 Execution Engine Completion

**Gap:** Automations stored but never execute.

**Refinements Required:**

1. **Wire Event Triggers**
   - After `executeAction()` completes, evaluate matching automations
   - File: `apps/web/src/app/api/tools/execute/route.ts`
   - Add: `await processEventTriggers(deploymentId, elementId, action)`

2. **Complete Action Executors**
   - File: `functions/src/automations/action-executors.ts`
   - Implement `sendEmail()` via SendGrid/Resend
   - Implement `sendPush()` via FCM
   - Implement `mutateElement()` via Firestore update
   - Implement `triggerTool()` via internal API call

3. **Enable Scheduled Triggers**
   - Verify Cloud Scheduler calls `runScheduledAutomations`
   - Confirm Firestore indexes for `trigger.type == 'schedule'`
   - Test cron expression parsing with `cron-parser`

4. **Wire Threshold Triggers**
   - Add Firestore trigger on `deployedTools/{id}/sharedState/current`
   - Compare previous vs current values
   - Call `processThresholdTriggers()` from `automation-runner.service.ts`

**Acceptance Criteria:**
- [ ] Scheduled automation sends email 7 days before event deadline
- [ ] Event trigger fires when poll hits 100 votes
- [ ] Threshold trigger fires when counter exceeds configured value
- [ ] Run history shows success/failure with duration

### 2.2 Connection Cascade Propagation

**Gap:** Data flows defined but don't propagate automatically.

**Refinements Required:**

1. **Real-Time Propagation**
   - On source tool state change, resolve all outgoing connections
   - Apply transforms (toCount, toArray, etc.)
   - Update target tool element configs
   - File: `apps/web/src/lib/tool-connection-engine.ts`

2. **Cycle Detection**
   - Build dependency graph on connection creation
   - Reject if cycle would be created
   - File: `packages/core/src/domain/hivelab/tool-connection.types.ts`

3. **Connection Status Dashboard**
   - Show connection health in IDE
   - Highlight stale or errored connections
   - "Last synced 2 minutes ago" indicator

**Acceptance Criteria:**
- [ ] Dues tracker "paid members" list flows to voting eligibility within 500ms
- [ ] Circular connection rejected with clear error message
- [ ] Connection panel shows live sync status

### 2.3 Template Versioning

**Gap:** Breaking template changes corrupt deployed tools.

**Refinements Required:**

1. **Version Lock on Creation**
   - Store `templateId` + `templateVersion` on tool
   - Template versions are immutable snapshots

2. **Update Detection**
   - Compare tool's `templateVersion` to current template
   - Show "Update available" badge in IDE

3. **Migration Preview**
   - Diff view showing element changes
   - State migration plan for breaking changes
   - One-click apply with rollback

**Acceptance Criteria:**
- [ ] Tool created from template stores version hash
- [ ] "Update available" shows when template changes
- [ ] Apply update preserves existing state where possible

### 2.4 Notification Delivery

**Gap:** `notifyAffectedUsers()` is stubbed.

**Refinements Required:**

1. **Space Member Notifications**
   - When tool state changes significantly, notify relevant members
   - Respect notification preferences (quiet hours, muted spaces)
   - File: `lib/notify-tool-updates.ts`

2. **Notification Types**
   - `tool_result` - Poll closed, results available
   - `tool_mention` - Mentioned in tool activity
   - `tool_deadline` - Countdown expired, signup closed

**Acceptance Criteria:**
- [ ] Poll creator notified when poll closes
- [ ] RSVP updates notify event organizer
- [ ] Respects user notification preferences

---

## Part 3: Feature Ideation

### 3.1 Builder Experience

#### 3.1.1 AI-Assisted Composition

**From:** User describes tool in natural language
**To:** AI generates multi-element composition with connections

```
User: "Create a study group signup with max 5 people,
       show who signed up, countdown to session"

AI generates:
- form-builder (name, major fields)
- member-list (connected to form submissions)
- countdown-timer (to session time)
- capacity-counter (5 max, connected to form)
```

**Implementation:**
- Integrate Claude API with tool-generation prompt
- Element relationship inference
- Position/layout algorithm
- Iterative refinement loop

#### 3.1.2 One-Click Deploy from Template

**Current:** Click template → lands in IDE → configure → deploy
**Proposed:** Click template → configure inline → deploy immediately

```
[Event RSVP]
  Event: [dropdown: upcoming events]
  Capacity: [50]
  [Deploy to: Coding Club sidebar]
  [Deploy Now]
```

Skip IDE entirely for simple tools. Power users still have full IDE access.

#### 3.1.3 Element Remix

**Concept:** Fork any deployed tool's element composition into your own tool.

- See tool in space → "Remix this" → Lands in your Lab with elements copied
- Provenance tracked (forked from X by Y)
- Original creator gets "forked 12 times" stat

### 3.2 Automation Architecture

#### 3.2.1 Trigger Types

| Trigger | Description | Example |
|---------|-------------|---------|
| `event` | Element emits action | "When someone RSVPs" |
| `schedule` | Cron expression | "Every Monday at 9am" |
| `threshold` | Value crosses limit | "When votes > 100" |
| `time_relative` | Before/after date field | "24 hours before event.startTime" |
| `member_action` | Space member activity | "When new member joins" |

#### 3.2.2 Action Types

| Action | Description | Implementation |
|--------|-------------|----------------|
| `notify_email` | Send email | SendGrid/Resend |
| `notify_push` | Send push notification | FCM |
| `notify_in_app` | Create notification doc | Firestore |
| `mutate_state` | Update tool state | Firestore |
| `trigger_tool` | Fire another tool's action | Internal API |
| `create_post` | Post to space feed | Via posts API |
| `assign_role` | Update member role | Via members API |

#### 3.2.3 Condition Operators

```typescript
type ConditionOperator =
  | 'equals' | 'notEquals'
  | 'greaterThan' | 'lessThan' | 'greaterOrEqual' | 'lessOrEqual'
  | 'contains' | 'notContains'
  | 'isEmpty' | 'isNotEmpty'
  | 'matchesRegex'
  | 'inArray' | 'notInArray';
```

### 3.3 Template System

#### 3.3.1 Template Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Events** | RSVPs, countdowns, schedules | Event RSVP, Event Countdown, Availability Poll |
| **Engagement** | Polls, leaderboards, reactions | Quick Poll, Trivia Game, Reaction Board |
| **Operations** | Signups, forms, tracking | Dues Tracker, Attendance, Sign-up Sheet |
| **Information** | Links, announcements, stats | Quick Links, Announcements, Space Stats |
| **Governance** | Voting, elections, proposals | Officer Election, Budget Vote, Proposal Form |

#### 3.3.2 Template Evolution

**Community Templates Flow:**
1. User creates tool in Lab
2. Publishes as template (requires verification)
3. Other users install, customize, deploy
4. Popular templates get "Featured" badge
5. Template creator earns "Builder" reputation

#### 3.3.3 Setup Templates (Multi-Tool Orchestration)

**Concept:** Templates that deploy multiple coordinated tools.

```
[Event Planning Setup]
- RSVP Tool (sidebar)
- Announcement Tool (pinned post)
- Countdown Tool (header widget)
- Feedback Tool (post-event)

Orchestration:
- RSVP count flows to Countdown capacity display
- Event end triggers Feedback tool visibility
- Feedback complete triggers thank-you announcement
```

Files: `apps/web/src/app/api/setups/templates/route.ts`

### 3.4 Tool Lifecycle

#### 3.4.1 Lifecycle States

```
Draft → Published → Deployed → Popular → Featured → Archived
         ↓                       ↓
     (private)              (marketplace)
```

| State | Visibility | Actions |
|-------|------------|---------|
| Draft | Creator only | Edit, preview, delete |
| Published | Creator + shared | Deploy, share link |
| Deployed | Space members | Execute, view analytics |
| Popular | Marketplace | Install, review, fork |
| Featured | Homepage | Curated showcase |
| Archived | Creator only | Restore, delete |

#### 3.4.2 Version Management

- Semantic versioning (1.0.0 → 1.0.1 on element change)
- Version history with rollback
- Breaking change detection (removed required field)
- Migration scripts for state transformations

### 3.5 Campus Context Injection

#### 3.5.1 Context Variables

Tools can access campus context via `{{variables}}`:

| Variable | Source | Example |
|----------|--------|---------|
| `{{space.name}}` | Current space | "Coding Club" |
| `{{space.memberCount}}` | Space stats | 142 |
| `{{user.name}}` | Current user | "Alex Chen" |
| `{{user.year}}` | User profile | "Junior" |
| `{{campus.name}}` | Campus | "UB Buffalo" |
| `{{calendar.nextEvent}}` | Academic calendar | "Spring Break" |
| `{{calendar.daysUntil('finals')}}` | Academic calendar | 23 |

#### 3.5.2 Academic Calendar Integration

- Finals countdown (auto-populated)
- Semester-aware deadlines
- Holiday detection for scheduling

---

## Part 4: Strategic Considerations

### 4.1 Cold Start Analysis

**Question:** Does a tool work for user #1 alone?

| Tool Type | Single-Player Value | Network Effects |
|-----------|--------------------|-----------------|
| Countdown | **Yes** - Personal deadline tracking | Low |
| Poll | **No** - Needs voters | High |
| RSVP | **Partial** - Organizer sees 0 RSVPs | Medium |
| Leaderboard | **No** - Empty rankings | High |
| Form | **Yes** - Collect own data | Low |
| Announcement | **Yes** - Post to self | Low |
| Dues Tracker | **No** - Needs members | High |

**Recommendations:**
1. Default templates should have single-player value
2. Show "Invite members" prompt when tool needs network
3. Seed polls/leaderboards with sample data for preview
4. "Your First Tool" flow starts with countdown (always useful)

### 4.2 Moat Analysis

**Why not just use Notion/Zapier/Airtable?**

| HIVE HiveLab | Notion/Zapier |
|--------------|---------------|
| Campus identity built-in | Anonymous/generic |
| Space membership context | Manual access lists |
| 60-second deploy | Complex setup |
| Real-time for all members | Paid feature/complex |
| Academic calendar aware | Manual entry |
| Mobile-first design | Responsive but not native |
| Zero learning curve for voters | Requires account/training |

**Defensible advantages:**
1. **Identity**: Tools know who you are (major, year, spaces)
2. **Context**: Tools live inside your communities
3. **Speed**: Template → deploy → usage in under 60 seconds
4. **Real-time**: All members see live updates, no refresh
5. **Trust**: Verified campus emails, not anonymous

### 4.3 Time Collapse Opportunities

**Repetitive campus tasks tools can eliminate:**

| Task | Current | With HiveLab |
|------|---------|--------------|
| Meeting poll | GroupMe chaos, 20 messages | Poll tool, 5 taps |
| Event RSVP | Google Form → Spreadsheet → Manual count | RSVP tool, live count |
| Dues tracking | Venmo requests, spreadsheet | Dues tool, auto-track |
| Officer elections | Paper ballots, manual count | Election tool, instant results |
| Study group signup | Email thread, confusion | Signup tool, capacity enforced |
| Attendance | Paper sign-in, data entry | Check-in tool, auto-record |
| Feedback collection | Google Form, manual review | Feedback tool, auto-summarize |

**Time saved estimate:** 2-5 hours/week for active space leader

---

## Part 5: Feature Specifications

### Feature 1: Automation Execution Engine

**Priority:** P0
**Owner:** Platform Team
**Status:** Infrastructure exists, execution not wired

#### User Story
As a space leader, I want to set up automations that run automatically, so I don't have to manually send reminders or update tool states.

#### Acceptance Criteria

- [ ] **AC1.1**: Event triggers fire within 5 seconds of triggering action
- [ ] **AC1.2**: Schedule triggers execute within 1 minute of scheduled time
- [ ] **AC1.3**: Threshold triggers fire when value crosses threshold (not on every update)
- [ ] **AC1.4**: Email actions deliver via SendGrid with template support
- [ ] **AC1.5**: Push actions deliver via FCM to user's devices
- [ ] **AC1.6**: Rate limits enforced (100 runs/day default, 60s cooldown)
- [ ] **AC1.7**: Run history visible in IDE with success/failure status
- [ ] **AC1.8**: Failed runs retry 3 times with exponential backoff

#### Technical Design

```typescript
// After action execution in execute/route.ts
await processEventTriggers({
  deploymentId,
  elementId,
  event: action,
  state: updatedSharedState,
  userId,
});

// In action-executors.ts
async function sendEmail(params: EmailParams): Promise<Result> {
  const recipients = await resolveRecipients(params.to, params.roleName);
  const rendered = renderTemplate(params.templateId, params.variables);
  return sendgrid.send({ to: recipients, ...rendered });
}
```

#### Edge Cases

- Automation disabled mid-execution → Complete current run, skip next
- Rate limit exceeded → Skip with logged reason, resume next day
- Email delivery failure → Retry 3x, then mark failed
- Circular trigger detection → Max 5 chained triggers per execution

---

### Feature 2: Connection Cascade Propagation

**Priority:** P1
**Owner:** Platform Team
**Status:** Data model complete, propagation not wired

#### User Story
As a space leader with multiple tools, I want data to flow between them automatically, so dues payment status updates voting eligibility without manual intervention.

#### Acceptance Criteria

- [ ] **AC2.1**: Source tool state change propagates to connected tools within 500ms
- [ ] **AC2.2**: Transforms applied correctly (toCount, toArray, toBoolean, etc.)
- [ ] **AC2.3**: Circular connections rejected on creation with clear error
- [ ] **AC2.4**: Connection status visible in IDE (connected, stale, error)
- [ ] **AC2.5**: Failed propagation retries 3 times
- [ ] **AC2.6**: Connection can be temporarily disabled without deletion

#### Technical Design

```typescript
// Firestore trigger on sharedState changes
export const onSharedStateChange = onDocumentWritten(
  'deployedTools/{deploymentId}/sharedState/current',
  async (event) => {
    const connections = await getOutgoingConnections(event.params.deploymentId);
    for (const conn of connections) {
      await propagateConnection(conn, event.data.after.data());
    }
  }
);
```

---

### Feature 3: AI Element Generation

**Priority:** P2
**Owner:** Platform Team
**Status:** Rules-based only

#### User Story
As a tool builder, I want to describe what I need in plain language, so I can create complex tools without understanding element composition.

#### Acceptance Criteria

- [ ] **AC3.1**: Claude API generates element composition from natural language
- [ ] **AC3.2**: Multi-element tools generated with appropriate connections
- [ ] **AC3.3**: Layout algorithm places elements sensibly
- [ ] **AC3.4**: Streaming response shows elements appearing in real-time
- [ ] **AC3.5**: Iterative refinement ("make the poll anonymous")
- [ ] **AC3.6**: Fallback to rules-based for common patterns (cost optimization)

#### Technical Design

```typescript
// In ai-tool-generator.service.ts
async generateFromPrompt(prompt: string): Promise<StreamingResponse> {
  // Try rules-based first for common patterns
  const rulesResult = this.rulesGenerator.tryMatch(prompt);
  if (rulesResult) return rulesResult;

  // Fall back to Claude for complex compositions
  const response = await claude.messages.create({
    model: 'claude-3-sonnet',
    system: TOOL_GENERATION_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  return this.streamElements(response);
}
```

---

### Feature 4: Template Versioning

**Priority:** P2
**Owner:** Platform Team
**Status:** Not implemented

#### User Story
As a tool creator, I want my deployed tools to stay stable when templates update, so breaking changes don't corrupt my tool.

#### Acceptance Criteria

- [ ] **AC4.1**: Tool stores `templateId` and `templateVersion` on creation
- [ ] **AC4.2**: "Update available" indicator when template changes
- [ ] **AC4.3**: Diff preview shows element additions/removals/changes
- [ ] **AC4.4**: One-click update with automatic state migration
- [ ] **AC4.5**: Rollback available for 7 days after update
- [ ] **AC4.6**: Breaking changes require explicit confirmation

---

### Feature 5: Community Trust System

**Priority:** P3
**Owner:** Platform Team
**Status:** Schema exists, no workflow

#### User Story
As a user, I want to know which tools are safe and well-built, so I can deploy with confidence.

#### Acceptance Criteria

- [ ] **AC5.1**: Verification form for template creators
- [ ] **AC5.2**: Review queue for platform admins
- [ ] **AC5.3**: Trust tiers: unverified → verified → trusted
- [ ] **AC5.4**: Trust badge visible on tools and templates
- [ ] **AC5.5**: Verified creators get "Builder" profile badge
- [ ] **AC5.6**: Trusted tools can request elevated capabilities

---

### Feature 6: One-Click Template Deploy

**Priority:** P1
**Owner:** Frontend Team
**Status:** Not implemented

#### User Story
As a space leader, I want to deploy common tools instantly without entering the IDE, so I can set up my space in minutes.

#### Acceptance Criteria

- [ ] **AC6.1**: Template card has inline configuration (event picker, capacity, etc.)
- [ ] **AC6.2**: "Deploy to [Space]" button directly on template card
- [ ] **AC6.3**: Success toast with "View in space" link
- [ ] **AC6.4**: "Customize in IDE" option for power users
- [ ] **AC6.5**: Works on mobile (bottom sheet configuration)
- [ ] **AC6.6**: 3-tap maximum from template view to deployed

---

### Feature 7: Tool Analytics Dashboard

**Priority:** P2
**Owner:** Frontend Team
**Status:** API exists, no UI

#### User Story
As a tool creator, I want to see how my tools are being used, so I can understand engagement and iterate.

#### Acceptance Criteria

- [ ] **AC7.1**: Usage chart (daily/weekly/monthly interactions)
- [ ] **AC7.2**: Unique users count
- [ ] **AC7.3**: Action breakdown (votes, RSVPs, submissions)
- [ ] **AC7.4**: Peak usage times
- [ ] **AC7.5**: Completion rate (started vs finished interactions)
- [ ] **AC7.6**: Comparison to template average

---

### Feature 8: Tool Reviews & Ratings

**Priority:** P3
**Owner:** Frontend Team
**Status:** API exists, no UI

#### User Story
As a space leader browsing templates, I want to see reviews from other users, so I can choose effective tools.

#### Acceptance Criteria

- [ ] **AC8.1**: 5-star rating system
- [ ] **AC8.2**: Written review with 280 character limit
- [ ] **AC8.3**: "Helpful" upvote on reviews
- [ ] **AC8.4**: Review must be from actual user of tool
- [ ] **AC8.5**: Creator can respond to reviews
- [ ] **AC8.6**: Average rating shown on template cards

---

### Feature 9: Setup Templates (Multi-Tool Orchestration)

**Priority:** P2
**Owner:** Platform Team
**Status:** Schema exists, partial implementation

#### User Story
As a space leader, I want to deploy coordinated tool setups for common scenarios, so I don't have to configure each tool individually.

#### Acceptance Criteria

- [ ] **AC9.1**: Setup template deploys 2-5 tools in one action
- [ ] **AC9.2**: Pre-configured connections between tools
- [ ] **AC9.3**: Pre-configured automations
- [ ] **AC9.4**: Unified configuration form (event date, capacity, etc.)
- [ ] **AC9.5**: Setup status dashboard (all tools healthy)
- [ ] **AC9.6**: "Teardown" removes all tools in setup

---

### Feature 10: Real-Time Presence on Tools

**Priority:** P3
**Owner:** Frontend Team
**Status:** Not implemented

#### User Story
As a tool user, I want to see how many people are currently using this tool, so I know if it's active and engaging.

#### Acceptance Criteria

- [ ] **AC10.1**: "3 people viewing" indicator on deployed tools
- [ ] **AC10.2**: Avatar stack of current users (max 5)
- [ ] **AC10.3**: Typing/interacting indicator on polls
- [ ] **AC10.4**: 30-second presence timeout
- [ ] **AC10.5**: Privacy respects ghost mode

---

### Feature 11: Offline Tool Execution

**Priority:** P3
**Owner:** Platform Team
**Status:** Not implemented

#### User Story
As a user with spotty connectivity, I want to interact with tools offline, so my votes and RSVPs sync when I'm back online.

#### Acceptance Criteria

- [ ] **AC11.1**: Optimistic UI update on action
- [ ] **AC11.2**: Queue actions in IndexedDB when offline
- [ ] **AC11.3**: Sync queue on reconnect
- [ ] **AC11.4**: Conflict resolution for concurrent edits
- [ ] **AC11.5**: "Pending sync" indicator

---

### Feature 12: Tool Embedding

**Priority:** P2
**Owner:** Frontend Team
**Status:** Not implemented

#### User Story
As a space leader, I want to embed tools in posts and chat messages, so members can interact inline without navigating away.

#### Acceptance Criteria

- [ ] **AC12.1**: `/tool [name]` command in chat creates embed
- [ ] **AC12.2**: Embed shows live tool state
- [ ] **AC12.3**: Interactions work within embed
- [ ] **AC12.4**: Embed collapses to result after poll closes
- [ ] **AC12.5**: Works in mobile chat

---

### Feature 13: Tool Duplication

**Priority:** P2
**Owner:** Frontend Team
**Status:** Not implemented

#### User Story
As a tool creator, I want to duplicate my existing tools, so I can create variations without starting from scratch.

#### Acceptance Criteria

- [ ] **AC13.1**: "Duplicate" action in tool menu
- [ ] **AC13.2**: Creates new tool with "(Copy)" suffix
- [ ] **AC13.3**: State reset (counters zero, collections empty)
- [ ] **AC13.4**: Configuration preserved
- [ ] **AC13.5**: Automations optionally copied

---

### Feature 14: Scheduled Tool Visibility

**Priority:** P2
**Owner:** Platform Team
**Status:** Not implemented

#### User Story
As a space leader, I want tools to appear and disappear on schedule, so feedback forms only show after events.

#### Acceptance Criteria

- [ ] **AC14.1**: "Show from" datetime on deployment
- [ ] **AC14.2**: "Hide after" datetime on deployment
- [ ] **AC14.3**: Schedule relative to event dates
- [ ] **AC14.4**: Override for leaders (always visible)
- [ ] **AC14.5**: Pre-publish preview mode

---

### Feature 15: Tool Import/Export

**Priority:** P3
**Owner:** Platform Team
**Status:** Not implemented

#### User Story
As a power user, I want to export my tool configurations as JSON, so I can back them up or share outside HIVE.

#### Acceptance Criteria

- [ ] **AC15.1**: Export tool as JSON file
- [ ] **AC15.2**: Import JSON to create new tool
- [ ] **AC15.3**: Validate imported schema
- [ ] **AC15.4**: Handle missing element types gracefully
- [ ] **AC15.5**: Include/exclude state data option

---

## Part 6: Integration Points

### 6.1 Identity System Integration

| Integration | Direction | Data Flow |
|-------------|-----------|-----------|
| User Profile | Tools → Identity | Tools appear on profile bento grid |
| User Context | Identity → Tools | `{{user.name}}`, `{{user.major}}`, `{{user.year}}` |
| Handle Resolution | Identity → Tools | Tool creators identified by @handle |
| Ghost Mode | Identity → Tools | Respect privacy settings in tool interactions |

### 6.2 Spaces System Integration

| Integration | Direction | Data Flow |
|-------------|-----------|-----------|
| Deployment | Tools → Spaces | Tools deployed to space sidebar/feed |
| Membership | Spaces → Tools | Member list for RSVP, voting eligibility |
| Permissions | Spaces → Tools | Leader-only tool creation/editing |
| Activity | Tools → Spaces | Tool usage in space activity feed |
| Events | Spaces ↔ Tools | Event picker, RSVP tools |

### 6.3 Awareness System Integration

| Integration | Direction | Data Flow |
|-------------|-----------|-----------|
| Notifications | Tools → Awareness | Poll closed, RSVP reminder, deadline approaching |
| Presence | Awareness → Tools | "3 people viewing" indicator |
| Activity Feed | Tools → Awareness | "Alex voted in Quick Poll" |
| Unread Counts | Tools → Awareness | Unread tool updates badge |

### 6.4 Discovery System Integration

| Integration | Direction | Data Flow |
|-------------|-----------|-----------|
| Template Browse | Discovery → Tools | Explore → Templates section |
| Search | Discovery ↔ Tools | Search includes tools and templates |
| Recommendations | Discovery → Tools | "Tools for your spaces" |
| Trending | Tools → Discovery | Popular tools in Explore |

---

## Part 7: Edge Cases & Abuse Prevention

### 7.1 Broken Tool Handling

| Scenario | Detection | Response |
|----------|-----------|----------|
| Invalid element config | Schema validation | Show error, prevent save |
| Missing required field | Runtime check | Fallback UI, log error |
| Circular connections | Graph analysis | Reject with explanation |
| Element not found | Registry lookup | Graceful degradation to placeholder |
| State corruption | Schema mismatch | Offer reset, preserve backup |

### 7.2 Runaway Automation Prevention

| Scenario | Prevention |
|----------|------------|
| Infinite trigger loop | Max 5 chained triggers per execution |
| Email spam | 100 notifications/day per automation |
| Resource exhaustion | 60s cooldown between runs |
| Cross-tool cascade | Max 3 tools in cascade chain |
| Failed run accumulation | Auto-disable after 10 consecutive failures |

### 7.3 Abuse Scenarios

| Attack | Mitigation |
|--------|------------|
| Spam tool creation | Rate limit: 10 tools/hour/user |
| Fake votes | One vote per user, verified identity |
| Bot automation | App Check verification (optional) |
| XSS in tool content | Sanitize all user input |
| CSRF on actions | Token validation in execute route |
| Cross-campus data | campusId filter on all queries |

### 7.4 Rate Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Tool creation | 10 | 1 hour |
| Tool execution | 60 | 1 minute |
| Automation runs | 100 | 1 day |
| Connection propagation | 10 | 1 second |
| AI generation | 20 | 1 hour |

---

## Appendix: File Reference

### Core Files
| File | Lines | Purpose |
|------|-------|---------|
| `apps/web/src/app/lab/page.tsx` | 835 | Lab dashboard |
| `apps/web/src/app/lab/[toolId]/page.tsx` | 709 | Tool IDE |
| `apps/web/src/app/api/tools/execute/route.ts` | 1400+ | Action execution |
| `apps/web/src/app/api/tools/route.ts` | 732 | Tool CRUD |
| `packages/core/src/domain/hivelab/tool-composition.types.ts` | 255 | Core types |
| `packages/core/src/domain/hivelab/tool-automation.types.ts` | 491 | Automation types |
| `packages/core/src/domain/hivelab/tool-connection.types.ts` | 541 | Connection types |
| `packages/core/src/domain/hivelab/system-tool-templates.ts` | 675 | System templates |
| `packages/core/src/application/hivelab/automation-runner.service.ts` | 708 | Automation execution |
| `packages/ui/src/hivelab/element-system.ts` | 1102 | Element registry |
| `functions/src/automations/run-scheduled.ts` | 521 | Scheduled automation CF |

### Related Documentation
- `docs/HIVELAB_ARCHITECTURE.md` - Architecture overview
- `TODO.md` - P4 HiveLab completion tasks
- `docs/SYSTEMS.md` - System-level documentation
