# HiveLab: Exponential Value Architecture

> Tools that compound. Systems that emerge. Infrastructure students own.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Primitive Stack](#primitive-stack)
3. [Connectors](#1-connectors)
4. [Tool-to-Tool Connections](#2-tool-to-tool-connections)
5. [Element-to-Element Connections](#3-element-to-element-connections)
6. [Context Injection](#4-context-injection)
7. [Automations](#5-automations)
8. [UI/UX Customization](#6-uiux-customization)
9. [Versioning & Evolution](#7-versioning--evolution)
10. [Intelligence Layer](#8-intelligence-layer)
11. [Cost Architecture](#cost-architecture)
12. [Implementation Priority](#implementation-priority)

---

## Philosophy

**The Claude Pattern:** Give users primitives + control = they build things you never imagined.

HiveLab doesn't ship features. It ships capability surfaces:
- **Elements** — the atoms
- **Connectors** — the bridges
- **Context** — the intelligence
- **Composition** — the emergence

Value compounds through:
- Network effects (more users = more tools = more value)
- Knowledge accumulation (context gets richer over time)
- Community contribution (connectors, templates, patterns)
- System emergence (tools combine into workflows)

---

## Primitive Stack

```
┌─────────────────────────────────────────────┐
│              SYSTEMS                        │  ← Orgs compose (free)
│         (Tool chains + Automations)         │
├─────────────────────────────────────────────┤
│              TOOLS                          │  ← Students build (free)
│         (Composed solutions)                │
├─────────────────────────────────────────────┤
│           CONNECTORS                        │  ← Community extends (free)
│      (External interfaces)                  │
├─────────────────────────────────────────────┤
│            ELEMENTS                         │  ← HIVE provides (27 today)
│       (UI + logic blocks)                   │
├─────────────────────────────────────────────┤
│            CONTEXT                          │  ← HIVE accumulates (automatic)
│   (Member, org, campus, history)            │
└─────────────────────────────────────────────┘
```

---

## 1. Connectors

### Purpose

Bridge HIVE to external systems while pulling users IN, not pushing content OUT.

### Psychology

| Wrong | Right |
|-------|-------|
| Post full event to GroupMe | Ping GroupMe with link to HIVE |
| Sync all data bidirectionally | Import history, own the data |
| Replicate functionality | Create FOMO, require HIVE for action |

### Connector Types

#### 1.1 Notification Hooks (Outbound Minimal)

Ping external channels. Content lives in HIVE.

```typescript
interface NotificationHook {
  id: string;
  channel: 'groupme' | 'discord' | 'slack' | 'email' | 'sms';
  trigger: {
    type: 'element_event' | 'tool_event' | 'schedule';
    source?: string;
    event?: string;
    cron?: string;
  };
  template: {
    preview: string;   // Max 100 chars, teaser only
    cta: string;       // "Vote now →"
    // link auto-generated to HIVE
  };
  rules: {
    maxPerDay: number;       // Prevent spam
    quietHours?: [number, number]; // No pings 10pm-8am
    digest?: 'immediate' | 'hourly' | 'daily' | 'weekly';
  };
}
```

**Cost model:** Near-zero. Just HTTP calls on trigger.

#### 1.2 Import Connectors (Inbound One-Time)

Bring historical data into HIVE. Migration, not sync.

```typescript
interface ImportConnector {
  id: string;
  source: 'groupme' | 'drive' | 'sheets' | 'canvas' | 'slack';
  auth: {
    type: 'oauth' | 'api_key' | 'manual_upload';
    credentials?: EncryptedCredentials;
  };
  mapping: Record<string, string>; // sourceField → hiveField
  options: {
    mode: 'once' | 'scheduled';
    destination: 'archive' | 'active';
    deduplication: boolean;
  };
}
```

**Cost model:** One-time Firestore writes. Cache source data client-side during mapping.

#### 1.3 Inbound Triggers (Webhook Receivers)

External events trigger tool actions.

```typescript
interface InboundTrigger {
  id: string;
  endpoint: string;  // Auto-generated webhook URL
  source: 'webhook' | 'email_parse' | 'calendar_push';
  validation: {
    secret?: string;
    schema: ZodSchema;
  };
  action: {
    toolId: string;
    elementId?: string;
    mutation: StateMutation;
  };
}
```

**Cost model:** Edge function receives webhook → single Firestore write. Pennies.

#### 1.4 Context Feeds (Continuous Inbound)

Ongoing data streams that enrich context.

```typescript
interface ContextFeed {
  id: string;
  source: 'google_calendar' | 'canvas_roster' | 'org_roster';
  auth: OAuthCredentials;
  sync: {
    frequency: 'realtime' | 'hourly' | 'daily';
    fields: string[];
  };
  storage: {
    location: 'user_context' | 'space_context';
    ttl: Duration;
  };
}
```

**Cost model:** Scheduled Cloud Functions. Batch writes. Cache aggressively.

### Connector Marketplace

Community-built connectors shared across campuses.

```typescript
interface ConnectorListing {
  id: string;
  name: string;
  author: UserId;
  type: 'notification' | 'import' | 'trigger' | 'feed';
  description: string;
  setup: SetupInstructions;
  installs: number;
  rating: number;
  campuses: CampusId[];
}
```

**Cost model:** Connectors are just config. No compute until used.

---

## 2. Tool-to-Tool Connections

### Purpose

Tools become services. Systems emerge from composition.

### Connection Types

| Type | Description | Cost Impact |
|------|-------------|-------------|
| **Data Reference** | Tool B reads Tool A's state | Read on load, cacheable |
| **Event Trigger** | Event in A triggers action in B | Single write per event |
| **Embedded Tool** | Tool A contains Tool B | Shared render, no extra cost |
| **Chained Workflow** | A completes → B starts | Sequential writes |

### Spec

```typescript
interface ToolConnection {
  id: string;
  source: {
    toolId: string;
    deploymentId: string;
    output: 'state' | 'event' | 'element_output';
    path?: string;  // "sharedState.counters.votes"
  };
  target: {
    toolId: string;
    deploymentId: string;
    input: 'trigger' | 'data_inject' | 'embed';
    elementId?: string;
  };
  transform?: string;  // Simple expression, evaluated client-side
  conditions?: Condition[];
  enabled: boolean;
}
```

### Visual Model

```
┌──────────────┐     event: "submitted"     ┌──────────────┐
│  Application │ ─────────────────────────→ │   Reviewer   │
│    Form      │                            │   Assigner   │
└──────────────┘                            └──────────────┘
       │                                           │
       │ data: applicant                           │ event: "assigned"
       ▼                                           ▼
┌──────────────┐                            ┌──────────────┐
│   Tracker    │                            │   Notifier   │
└──────────────┘                            └──────────────┘
```

### Cost Optimization

- **Lazy resolution:** Don't fetch connected tool state until accessed
- **Client-side transforms:** Simple mappings run in browser
- **Event batching:** Multiple triggers in same second → single write
- **Connection caching:** Store resolved connections for 5 min TTL

---

## 3. Element-to-Element Connections

### Current State

Intra-tool connections exist (`ElementConnection` type).

### Expansion: Cross-Tool Element References

```typescript
interface ElementReference {
  id: string;
  source: {
    deploymentId: string;
    elementId: string;
    path: string;  // "outputs.selectedMembers"
  };
  target: {
    deploymentId: string;
    elementId: string;
    path: string;  // "inputs.eligibleVoters"
  };
  sync: 'realtime' | 'on_load' | 'manual';
  permissions: 'read' | 'read_write';
}
```

### Example

```
Dues Tracker                         Voting Tool
┌─────────────────┐                  ┌─────────────────┐
│ Paid Members    │                  │ Eligible Voters │
│ (element)       │ ───reference───→ │ (element)       │
│                 │                  │                 │
│ [✓] Alice       │                  │ Auto-filtered   │
│ [✓] Bob         │                  │ to paid only    │
│ [ ] Carol       │                  │                 │
└─────────────────┘                  └─────────────────┘
```

### Cost Optimization

- **Sync modes:**
  - `on_load`: Single read when tool opens (cheapest)
  - `manual`: User triggers refresh
  - `realtime`: RTDB listener (use sparingly)
- **Denormalization:** Cache frequently-referenced data in target tool
- **Batch resolution:** Resolve all references in single query on tool load

---

## 4. Context Injection

### Purpose

Tools are smart without configuration. They know where they are and who's using them.

### Context Layers

```typescript
interface ToolContext {
  // User context - loaded once per session
  user: {
    id: string;
    role: 'member' | 'officer' | 'admin' | 'guest';
    tenure: number;  // days in org
    participation: {
      eventsAttended: number;
      postsCreated: number;
      toolsUsed: number;
    };
  };

  // Space context - cached per space
  space: {
    id: string;
    name: string;
    type: OrgType;
    memberCount: number;
    activityLevel: 'low' | 'medium' | 'high';
    settings: SpaceSettings;
  };

  // Campus context - cached globally
  campus: {
    id: string;
    name: string;
    size: 'small' | 'medium' | 'large';
    features: string[];
  };

  // Temporal context - computed client-side
  temporal: {
    semester: 'fall' | 'spring' | 'summer';
    weekOfSemester: number;
    isRushSeason: boolean;
    isFinalsWeek: boolean;
  };

  // Historical context - loaded on demand
  history?: {
    toolVersions: ToolVersion[];
    orgDecisions: Decision[];
    patterns: Pattern[];
  };
}
```

### Context Resolution

```
User opens tool
    ↓
Check context cache (IndexedDB)
    ↓
If fresh (< 5 min): use cached
If stale: fetch user + space context (2 reads)
    ↓
Campus context: global cache (1 read per session)
Temporal: computed client-side (0 reads)
History: lazy load only if element requests (0 reads usually)
```

### Cost Model

| Context Layer | Reads | Caching |
|---------------|-------|---------|
| User | 1 | 5 min |
| Space | 1 | 5 min |
| Campus | 1 | 24 hours |
| Temporal | 0 | Computed |
| History | 0-1 | On demand |

**Total:** 2-3 reads per tool load, heavily cached.

---

## 5. Automations

### Purpose

Tools run themselves. Time + Events + Conditions = Actions without humans.

### Trigger Types

```typescript
type Trigger =
  | { type: 'schedule'; cron: string }
  | { type: 'event'; source: string; event: string }
  | { type: 'threshold'; element: string; path: string; op: '>' | '<' | '=='; value: any }
  | { type: 'absence'; event: string; duration: number }
  | { type: 'webhook'; connectorId: string };
```

### Action Types

```typescript
type Action =
  | { type: 'mutate'; element: string; mutation: Mutation }
  | { type: 'notify'; connector: string; template: string }
  | { type: 'trigger_tool'; toolId: string; event: string }
  | { type: 'create'; entity: 'post' | 'event' | 'task'; data: any };
```

### Automation Spec

```typescript
interface Automation {
  id: string;
  name: string;
  deploymentId: string;
  trigger: Trigger;
  conditions?: Condition[];
  actions: Action[];
  enabled: boolean;

  // Cost controls
  limits: {
    maxRunsPerDay: number;
    maxRunsPerHour: number;
    cooldownSeconds: number;
  };

  // Observability
  lastRun?: Timestamp;
  runCount: number;
  errorCount: number;
}
```

### Cost Architecture

#### Schedule Triggers
- **Cloud Scheduler** → **Pub/Sub** → **Cloud Function**
- Batch all automations into minute-granularity checks
- Single cron job checks all due automations, not one per automation

```
Every minute:
  Query: automations WHERE nextRun <= now AND enabled = true
  For each: evaluate conditions, execute actions
  Batch write: update lastRun timestamps
```

**Cost:** 1 Cloud Scheduler job + 1 Function invocation/min + N reads where N = due automations

#### Event Triggers
- Firestore trigger on state change
- Filter to relevant automations client-side when possible
- Debounce rapid-fire events (1 sec window)

#### Threshold Triggers
- Evaluated on state write, not polling
- When state changes → check if threshold crossed → trigger

### Example: Dues Reminder Pipeline

```yaml
automations:
  - name: "7-day reminder"
    trigger:
      type: schedule
      cron: "0 9 * * *"  # Daily 9am
    conditions:
      - path: "member.dueDate"
        op: "<="
        value: "{{now + 7 days}}"
      - path: "member.hasPaid"
        op: "=="
        value: false
    actions:
      - type: notify
        connector: "email"
        template: "dues_reminder_7day"
    limits:
      maxRunsPerDay: 1  # Per member

  - name: "Mark inactive"
    trigger:
      type: event
      source: "dues_deadline"
      event: "passed"
    conditions:
      - path: "member.hasPaid"
        op: "=="
        value: false
    actions:
      - type: mutate
        element: "member_status"
        mutation: { status: "inactive" }
      - type: trigger_tool
        toolId: "voting_eligibility"
        event: "remove_voter"
```

---

## 6. UI/UX Customization

### Purpose

Tools feel native to the org. Brand inheritance, not configuration.

### Theme Inheritance

```typescript
interface ToolTheme {
  extends: 'hive-default' | 'space-brand' | 'minimal';
  overrides?: {
    primary?: Color;
    accent?: Color;
    radius?: 'none' | 'sm' | 'md' | 'lg';
    density?: 'compact' | 'default' | 'spacious';
  };
}
```

### Inheritance Chain

```
HIVE defaults (design system)
    ↓
Campus theme (if set)
    ↓
Space brand (org colors)
    ↓
Tool overrides (optional)
    ↓
Final render
```

### Surface Deployment

| Surface | Context | Chrome | Size |
|---------|---------|--------|------|
| `pinned` | Space sidebar | Minimal | Compact |
| `tools_tab` | Tools section | Standard | Full |
| `modal` | Triggered popup | Dialog | Medium |
| `embedded` | Inside post/event | None | Inline |
| `standalone` | Public URL | Branded | Full page |

### Cost Model

**Zero incremental cost.** Themes are CSS variables resolved at render time.

---

## 7. Versioning & Evolution

### Purpose

Safe iteration. Rollback capability. Learning from history.

### Version Spec

```typescript
interface ToolVersion {
  version: string;  // semver
  composition: ToolComposition;
  createdAt: Timestamp;
  createdBy: UserId;
  changelog?: string;

  // Deployment tracking
  deployments: string[];  // Which deployments use this version

  // Storage optimization
  diffFromPrevious?: CompositionDiff;  // Store diff, not full copy
}
```

### Storage Optimization

- **First version:** Full composition stored
- **Subsequent versions:** Store diff from previous
- **Reconstruct:** Apply diffs to get any version
- **Prune:** Archive versions older than 90 days with no deployments

### Cost Model

| Operation | Cost |
|-----------|------|
| Create version | 1 write (diff only) |
| List versions | 1 read (metadata only) |
| Load version | 1-N reads (apply diffs) |
| Rollback | 1 write (update deployment pointer) |

---

## 8. Intelligence Layer

### Purpose

Tools improve through observation, not configuration.

### Intelligence Types

#### 8.1 Suggestions (Rules-Based)

No AI cost. Pattern matching on composition.

```typescript
interface Suggestion {
  type: 'add_element' | 'remove_element' | 'reorder' | 'configure';
  confidence: number;
  reason: string;
  action: CompositionMutation;
}

// Example rules
const SUGGESTION_RULES = [
  {
    condition: (comp) => hasDeadline(comp) && !hasReminder(comp),
    suggestion: {
      type: 'add_element',
      reason: 'Tools with reminders see 23% higher completion',
      action: { add: 'reminder_element', near: 'deadline_element' }
    }
  },
  {
    condition: (comp) => formFieldCount(comp) > 10,
    suggestion: {
      type: 'configure',
      reason: 'Long forms have 40% drop-off. Consider progress indicator.',
      action: { add: 'progress_indicator' }
    }
  }
];
```

#### 8.2 Analytics (Aggregated, Anonymized)

```typescript
interface ToolAnalytics {
  deploymentId: string;
  period: 'day' | 'week' | 'month';

  usage: {
    uniqueUsers: number;
    totalInteractions: number;
    completionRate: number;
  };

  elements: {
    [elementId: string]: {
      interactions: number;
      avgTimeSpent: number;
      dropOffRate: number;
    };
  };

  // Computed client-side, stored as aggregates
  patterns: {
    peakHours: number[];
    commonPaths: string[][];
  };
}
```

#### 8.3 Predictions (Simple Models)

No ML inference cost. Statistical extrapolation.

```typescript
interface Prediction {
  type: 'completion' | 'attendance' | 'engagement';
  value: number;
  confidence: number;
  basis: 'historical' | 'similar_tools' | 'trend';
}

// Example: RSVP prediction
function predictAttendance(rsvpCount: number, daysUntilEvent: number, historicalShowRate: number): Prediction {
  const projectedRSVPs = rsvpCount * (1 + (daysUntilEvent * 0.1));  // 10% growth per day remaining
  const expectedAttendance = projectedRSVPs * historicalShowRate;

  return {
    type: 'attendance',
    value: Math.round(expectedAttendance),
    confidence: daysUntilEvent < 3 ? 0.8 : 0.5,
    basis: 'historical'
  };
}
```

### Cost Model

| Feature | Compute | Storage |
|---------|---------|---------|
| Suggestions | Client-side | None |
| Analytics | Client-side aggregation | 1 doc/period |
| Predictions | Client-side math | None |

**Total AI cost: $0.** Intelligence through rules and statistics.

---

## Cost Architecture

### Design Principles

1. **Client-side first:** Compute in browser, not server
2. **Cache aggressively:** IndexedDB for context, 5-min TTL
3. **Batch writes:** Aggregate multiple changes into single write
4. **Lazy load:** Don't fetch until needed
5. **Rules over AI:** Deterministic logic, not inference
6. **Edge functions:** Cheap for simple triggers

### Cost Breakdown by Feature

| Feature | Reads/Use | Writes/Use | Compute | Monthly Est* |
|---------|-----------|------------|---------|--------------|
| Tool load | 2-3 | 0 | Client | $0.001 |
| Element action | 0 | 1 | Client | $0.0001 |
| Connector (notify) | 0 | 0 | Edge | $0.00001 |
| Connector (import) | N | N | Function | $0.01/import |
| Automation (schedule) | 1 | 1 | Function | $0.0001/run |
| Automation (event) | 0 | 1 | Trigger | $0.0001/run |
| Tool-to-tool | 1 | 0 | Client | $0.0001 |
| Context injection | 0-1 | 0 | Client | $0.0001 |
| Analytics write | 0 | 1 | Client | $0.0001/day |
| Intelligence | 0 | 0 | Client | $0 |

*Based on Firestore pricing: $0.036/100K reads, $0.108/100K writes

### Scaling Thresholds

| Scale | Strategy |
|-------|----------|
| < 1K tools | Default architecture |
| 1K-10K tools | Enable sharded counters for high-traffic elements |
| 10K-100K tools | Extract hot collections, add read replicas |
| 100K+ tools | Evaluate dedicated infrastructure |

### Cost Controls

```typescript
interface CostLimits {
  // Per deployment
  maxAutomationsPerTool: 10;
  maxConnectionsPerTool: 20;
  maxRunsPerAutomationPerDay: 100;

  // Per space
  maxToolsPerSpace: 50;
  maxImportsPerMonth: 10;

  // Per campus
  maxRealtimeListeners: 500;
  maxWebhooksPerMinute: 100;
}
```

---

## Implementation Priority

### Phase 1: Foundation (Now)
*Ship with current architecture, no new infra*

| Feature | Effort | Value | Dependencies |
|---------|--------|-------|--------------|
| Context injection (user, space) | Low | High | None |
| Tool-to-tool data reference | Medium | High | None |
| Notification hooks (email) | Low | Medium | Resend |
| Tool versioning | Low | Medium | None |
| Rules-based suggestions | Low | Medium | None |

### Phase 2: Connections (Next)
*Add connector infrastructure*

| Feature | Effort | Value | Dependencies |
|---------|--------|-------|--------------|
| Webhook inbound triggers | Medium | High | Edge functions |
| Event-based automations | Medium | High | Firestore triggers |
| Cross-tool element refs | Medium | High | Phase 1 |
| GroupMe notification hook | Low | High | GroupMe API |
| Google Calendar import | Medium | Medium | OAuth setup |

### Phase 3: Intelligence (Later)
*Compound value over time*

| Feature | Effort | Value | Dependencies |
|---------|--------|-------|--------------|
| Schedule automations | Medium | High | Cloud Scheduler |
| Tool analytics dashboard | Medium | Medium | Phase 1 |
| Connector marketplace | High | High | Phase 2 |
| Prediction models | Low | Medium | Analytics data |
| A/B deployment | Medium | Medium | Versioning |

### Phase 4: Scale (When Needed)
*Only if usage demands*

| Feature | Trigger | Effort |
|---------|---------|--------|
| Sharded counters | >25 writes/sec on element | Medium |
| Extracted collections | >10K tools | High |
| RTDB broadcast | >500 concurrent listeners | Medium |
| Read replicas | >50K reads/day | High |

---

## Appendix: Data Models

### Firestore Collections

```
tools/
  {toolId}/
    - composition: ToolComposition
    - metadata: ToolMetadata
    - versions/
        {versionId}: ToolVersion
    - connections/
        {connectionId}: ToolConnection

deployedTools/
  {deploymentId}/
    - composition: ToolComposition (snapshot)
    - surface: Surface
    - theme: ToolTheme
    - sharedState/
        current: ToolSharedState
    - automations/
        {automationId}: Automation

toolStates/
  {deploymentId}_{userId}: ToolUserState

connectors/
  {connectorId}/
    - type: ConnectorType
    - config: ConnectorConfig
    - author: UserId
    - installs: number

context/
  users/{userId}: UserContext
  spaces/{spaceId}: SpaceContext
  campuses/{campusId}: CampusContext
```

### IndexedDB (Client Cache)

```
hive-context/
  user: UserContext (TTL: 5 min)
  spaces/{spaceId}: SpaceContext (TTL: 5 min)
  campus: CampusContext (TTL: 24 hours)

hive-tools/
  compositions/{toolId}: ToolComposition (TTL: 1 hour)
  states/{deploymentId}: ToolSharedState (TTL: 30 sec)
```

---

## Summary

HiveLab's exponential value comes from:

1. **Primitives over features** — Elements, Connectors, Context
2. **Composition over configuration** — Tools combine into systems
3. **Community over company** — Users build connectors and templates
4. **Accumulation over reset** — Context compounds over time
5. **Rules over AI** — Intelligence without inference cost

**The unlock:** Students build infrastructure their universities can't provide. Every tool makes the platform more valuable. Every campus makes the network stronger.

**Cost reality:** <$100/month at 10K tools with aggressive caching and client-side compute.
