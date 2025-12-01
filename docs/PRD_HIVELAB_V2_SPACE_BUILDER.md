# HiveLab V2: Space Builder
## Product Requirements Document

**Version:** 2.0
**Last Updated:** 2025-11-29
**Status:** Draft

---

## Executive Summary

HiveLab V2 evolves from a "Tool Builder" to a "Space Builder" - an AI-native interface for configuring complete campus communities. Instead of just creating interactive tools, users can describe outcomes ("I want an active photography club") and HiveLab configures everything: content, tools, automations, structure, rules, and integrations.

**Key Insight:** Users don't think in terms of "tools." They think in terms of outcomes. HiveLab should understand intent and handle the complexity.

---

## 1. Vision

### The Interaction Model

```
User: "I want to run a weekly photo challenge for my club"

HiveLab thinks:
├── Content: Weekly announcement post template
├── Tool: Poll for theme voting + countdown + submission form
├── Automation: Auto-post reminder every Monday
├── Structure: "Challenges" tab with gallery widget
└── Rules: Only members can submit, voting is anonymous

User sees: "Here's what I've set up for your photo challenge..."
```

### Core Principle: ChatGPT for Campus Communities

Like ChatGPT where users return daily with varied requests, HiveLab becomes the "ask anything" interface for space management. Users don't choose categories - they describe what they want and AI routes to the right capabilities.

**Interaction Frequency Model:**
- **Power users (leaders):** 2-5 sessions/week, complex requests
- **Regular users:** 1-3 sessions/week, simple tools + sharing
- **Casual users:** 1-2 sessions/month, discovery + running shared tools

---

## 2. Current State Inventory

### What We Have Today

#### A. Element System (Complete - 31 elements)

| Category | Count | Examples |
|----------|-------|----------|
| Input | 6 | search-input, date-picker, form-builder, user-selector |
| Display | 10 | chart-display, leaderboard, countdown-timer, result-list |
| Filter | 1 | filter-selector |
| Action | 3 | poll-element, rsvp-button, announcement |
| Layout | 1 | role-gate |

**Tier Model:**
- **Universal (12):** Everyone can use, no HIVE data needed
- **Connected (5):** Everyone, pulls from public campus data
- **Space (7):** Leaders only, accesses private space data

#### B. Tool Composition Engine (Functional)

```typescript
interface ToolComposition {
  id: string;
  name: string;
  description: string;
  elements: ElementInstance[];      // Positioned elements
  connections: ConnectionDef[];     // Data flow between elements
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}
```

- Canvas rendering with drag-drop positioning
- Element connections (data flow)
- Layout options
- Built-in templates (3)

#### C. AI Generation (Implemented)

| Component | Status | File |
|-----------|--------|------|
| Firebase AI Generator | Working | `apps/web/src/lib/firebase-ai-generator.ts` |
| Streaming API | Working | `apps/web/src/app/api/tools/generate/route.ts` |
| Iteration Mode | Working | System prompt + context injection |
| Mock Fallback | Working | `apps/web/src/lib/mock-ai-generator.ts` |

**Current AI Capabilities:**
- Generate tools from natural language
- Iterate on existing compositions ("add a leaderboard")
- Space context awareness (name, category, member count)
- Streaming element addition for visual feedback

#### D. Space Data Model (Complete - DDD Aggregate)

```typescript
EnhancedSpace {
  // Identity
  spaceId, name, slug, description, category, campusId

  // Membership
  members: SpaceMember[]          // role: owner|admin|moderator|member|guest
  leaderRequests: LeaderRequest[] // leadership request workflow

  // UI Configuration
  tabs: Tab[]                     // feed, widget, resource, custom
  widgets: Widget[]               // calendar, poll, links, files, rss, custom

  // Settings
  settings: SpaceSettings         // allowInvites, requireApproval, etc.

  // Metadata
  visibility, isActive, isVerified, trendingScore
  rushMode?: RushMode
}
```

#### E. API Coverage (18+ endpoints)

| Area | Endpoints | Status |
|------|-----------|--------|
| Space CRUD | `/spaces/[spaceId]` | Complete |
| Posts | `/spaces/[spaceId]/posts/*` | Complete |
| Events | `/spaces/[spaceId]/events/*` | Complete |
| Members | `/spaces/[spaceId]/members/*` | Complete |
| Tools | `/spaces/[spaceId]/tools/*` | Complete |
| RSS Seeding | `/spaces/[spaceId]/seed-rss` | Complete |

#### F. Deployment Infrastructure (Functional)

```typescript
DeploymentRecord {
  toolId, deployedBy, deployedTo: 'profile' | 'space'
  targetId, surface, position
  config, permissions, status
  usageCount, lastUsed
}
```

#### G. Automation Infrastructure (Partial)

| Type | Status | File |
|------|--------|------|
| Post Promotion | Working | `api/cron/promote-posts/route.ts` |
| Event System | Infrastructure only | `api/tools/event-system/route.ts` |
| Webhooks | Not implemented | - |
| Scheduled Jobs | Not implemented | - |

---

## 3. Version 2 Capability Stack

### The Seven Pillars

HiveLab V2 handles seven types of configurations. Users don't choose - AI determines what's needed.

```
┌─────────────────────────────────────────────────────────────┐
│                    HIVELAB V2: SPACE BUILDER                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ CONTENT  │ │  TOOLS   │ │AUTOMATIONS│ │STRUCTURE │       │
│  │          │ │          │ │          │ │          │       │
│  │ Posts    │ │ Polls    │ │ Triggers │ │ Tabs     │       │
│  │ Events   │ │ Forms    │ │ Schedules│ │ Widgets  │       │
│  │ Announce │ │ RSVPs    │ │ Actions  │ │ Layout   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │  RULES   │ │INTEGRATIONS│ │ COMMERCE │                    │
│  │          │ │          │ │          │                    │
│  │ Permissions│ RSS      │ │ Dues     │                    │
│  │ Roles    │ │ Calendars│ │ Tickets  │                    │
│  │ Policies │ │ Webhooks │ │ Bookings │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Capability Details

#### 1. CONTENT (Posts, Events, Announcements)

**What it does:** Creates actual content in the space - posts, events, pinned announcements.

**User might say:**
- "Post an announcement about tomorrow's meeting"
- "Create a recurring event for every Tuesday at 7pm"
- "Schedule a reminder post for Friday"

**Implementation:**
- Call existing `/spaces/[spaceId]/posts` and `/spaces/[spaceId]/events` APIs
- Add scheduling support (new)
- Add recurring content templates (new)

**Status:** 70% complete (APIs exist, scheduling missing)

#### 2. TOOLS (Interactive Elements)

**What it does:** Creates composable interactive tools from elements.

**User might say:**
- "Create a poll for next week's movie night"
- "Build an event signup form"
- "Make a challenge submission system"

**Implementation:**
- Current element system (31 elements)
- Current composition engine
- Current AI generation

**Status:** 90% complete (just polish + more elements)

#### 3. AUTOMATIONS (Triggers + Actions)

**What it does:** Sets up rules that run automatically.

**Trigger Types:**
- Time-based (every Monday, at 9am, in 24 hours)
- Event-based (when someone joins, when post reaches X hearts)
- Condition-based (when RSVP count hits 20)

**Action Types:**
- Create post
- Send notification
- Feature/unfeature content
- Update tool state
- Webhook call

**User might say:**
- "Remind members every Monday about upcoming events"
- "When someone joins, DM them the welcome guide"
- "Auto-feature posts that get 10+ hearts"

**Status:** 20% complete (post promotion exists, general system missing)

#### 4. STRUCTURE (Tabs, Widgets, Layout)

**What it does:** Configures how the space is organized.

**User might say:**
- "Add a Resources tab with file links"
- "Put the events calendar in the sidebar"
- "Create a separate tab for each project"

**Implementation:**
- Tab CRUD on EnhancedSpace aggregate
- Widget configuration
- Layout preferences

**Status:** 60% complete (data model exists, UI for configuration missing)

#### 5. RULES (Permissions, Policies, Requirements)

**What it does:** Sets membership rules, content policies, role permissions.

**User might say:**
- "Only officers can post announcements"
- "Require approval for new members"
- "Make events member-only"

**Implementation:**
- Role-based permissions (exists in data model)
- Membership policies (partial)
- Content visibility rules (partial)

**Status:** 50% complete (model exists, enforcement inconsistent)

#### 6. INTEGRATIONS (RSS, Calendar, External)

**What it does:** Connects to external systems.

**User might say:**
- "Import posts from our RSS feed"
- "Sync events to Google Calendar"
- "Post updates to our Discord"

**Implementation:**
- RSS seeding (exists)
- Calendar export (partial)
- Webhook triggers (new)
- OAuth integrations (new)

**Status:** 30% complete

#### 7. COMMERCE (Dues, Tickets, Bookings) [Future]

**What it does:** Handles payments and reservations.

**User might say:**
- "Collect $20 dues from members"
- "Sell tickets to our gala"
- "Let people book equipment"

**Status:** 0% (V2.5 or V3)

---

## 4. UI/UX Design

### Core Interface: AI Chat with Live Preview

```
┌─────────────────────────────────────────────────────────────┐
│  HiveLab                                    [Photography Club]│
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  ┌────────────────────┐  │     LIVE PREVIEW                 │
│  │ 👤 How can I help  │  │                                  │
│  │ with Photography   │  │  ┌────────────────────────────┐  │
│  │ Club today?        │  │  │                            │  │
│  └────────────────────┘  │  │   [Preview updates as     │  │
│                          │  │    user types and AI      │  │
│  ┌────────────────────┐  │  │    generates]             │  │
│  │ I want to run a    │  │  │                            │  │
│  │ weekly photo       │  │  └────────────────────────────┘  │
│  │ challenge          │  │                                  │
│  └────────────────────┘  │  GENERATED CONFIGURATION:        │
│                          │  ────────────────────────────    │
│  ┌────────────────────┐  │  ☑ Poll: Theme Voting            │
│  │ 🤖 Here's what I   │  │  ☑ Form: Submission Form         │
│  │ set up for your    │  │  ☑ Tab: "Challenges"             │
│  │ photo challenge:   │  │  ☑ Automation: Monday reminder   │
│  │                    │  │                                  │
│  │ • Weekly poll for  │  │  [Deploy All]  [Edit Individual] │
│  │   theme voting     │  │                                  │
│  │ • Submission form  │  │                                  │
│  │ • "Challenges" tab │  │                                  │
│  │ • Auto-reminder    │  │                                  │
│  │   every Monday     │  │                                  │
│  └────────────────────┘  │                                  │
│                          │                                  │
│  ┌────────────────────┐  │                                  │
│  │ Add a leaderboard  │  │                                  │
│  │ for points...      │  │                                  │
│  └────────────────────┘  │                                  │
│                          │                                  │
├──────────────────────────┴──────────────────────────────────┤
│ [📎]  Type a message...                              [Send] │
└─────────────────────────────────────────────────────────────┘
```

### Key UX Patterns

#### 1. Conversational, Not Form-Based

**Wrong:** Show a form with fields for "tool type", "elements", "schedule"
**Right:** Let users describe what they want in natural language

```
User: "remind members about dues next week"
AI: "I'll create a scheduled announcement for next Monday.
     Want me to also set up recurring monthly reminders?"
```

#### 2. Progressive Disclosure

Start simple, offer complexity:

```
[Basic response]
"Created a poll for movie night. It's live!"

[Expandable detail]
▼ Poll Details
  - Question: "What movie should we watch?"
  - Options: Comedy, Horror, Action, Drama
  - Closes: Saturday 6pm
  - Results: Public after voting closes

  [Edit] [Delete] [Schedule Another]
```

#### 3. Inline Configuration

When AI needs clarification, ask in-flow:

```
AI: "Creating your event signup form. Quick question -
     should there be a max capacity?"

[No limit] [Set limit: ___] [Let me think about it]
```

#### 4. Undo/History

Every action reversible:

```
┌──────────────────────────────────┐
│ Recent Changes               [↩] │
├──────────────────────────────────┤
│ ○ Created "Challenges" tab       │
│ ○ Added submission form          │
│ ○ Set up Monday reminder         │
│ ○ Created theme poll             │
└──────────────────────────────────┘
```

#### 5. Context Awareness

HiveLab knows:
- What space you're working on
- Your role (leader, admin, member)
- Recent activity in the space
- What configurations already exist
- Time of year (rush season, finals, etc.)

```
AI: "I noticed Photography Club's spring showcase is coming up.
     Want me to set up RSVPs and a countdown?"
```

### Mobile Experience

Prioritize chat-first on mobile:

```
┌─────────────────────┐
│ HiveLab    [Preview]│
├─────────────────────┤
│                     │
│ [Chat messages]     │
│                     │
│                     │
│                     │
├─────────────────────┤
│ Message...    [Send]│
└─────────────────────┘
```

Preview available as slide-up or separate screen.

### Entry Points

| Entry Point | Context | Initial Prompt |
|------------|---------|----------------|
| Space sidebar | In a space | "What do you want to add to [Space Name]?" |
| Tools hub | Personal | "What would you like to create?" |
| Quick action | Anywhere | "How can I help?" |
| Template gallery | Discovery | "Start from a template or describe what you need" |

---

## 5. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Chat UI    │  │  Preview    │  │  Config     │         │
│  │             │  │  Canvas     │  │  Panel      │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Streaming  │
                    │  API        │
                    └──────┬──────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                 ORCHESTRATION LAYER                   │  │
│  │                                                       │  │
│  │  Intent Classification → Capability Routing           │  │
│  │                                                       │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│  ┌───────────┬───────────┼───────────┬───────────┐         │
│  │           │           │           │           │         │
│  ▼           ▼           ▼           ▼           ▼         │
│ Content   Tools    Automations  Structure   Rules          │
│ Engine    Engine     Engine      Engine     Engine         │
│  │           │           │           │           │         │
│  └───────────┴───────────┼───────────┴───────────┘         │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                   EXECUTION LAYER                     │  │
│  │                                                       │  │
│  │  Firebase APIs  │  Element Runtime  │  Job Scheduler  │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│                          SERVER                              │
└──────────────────────────────────────────────────────────────┘
```

### New Components Required

#### 1. Orchestration Layer

**Purpose:** Routes user intent to appropriate capability engines.

```typescript
// Intent classification result
interface IntentClassification {
  primary: CapabilityType;  // 'content' | 'tool' | 'automation' | etc.
  secondary?: CapabilityType[];
  confidence: number;
  extractedEntities: {
    timeExpressions?: string[];
    contentTypes?: string[];
    targetAudience?: string[];
  };
}

// Orchestrator routes to capability engines
class HiveLabOrchestrator {
  async process(
    userMessage: string,
    context: SpaceContext
  ): AsyncGenerator<OrchestrationChunk> {
    // 1. Classify intent
    const intent = await this.classifyIntent(userMessage, context);

    // 2. Route to capability engine(s)
    for (const capability of [intent.primary, ...intent.secondary || []]) {
      const engine = this.getEngine(capability);
      yield* engine.process(userMessage, context, intent);
    }

    // 3. Compose final configuration
    yield { type: 'complete', data: this.composeConfiguration() };
  }
}
```

#### 2. Capability Engines

Each capability has its own engine:

```typescript
// Base engine interface
interface CapabilityEngine {
  canHandle(intent: IntentClassification): boolean;
  process(
    message: string,
    context: SpaceContext,
    intent: IntentClassification
  ): AsyncGenerator<CapabilityChunk>;
  validate(config: unknown): ValidationResult;
  execute(config: unknown, context: SpaceContext): Promise<ExecutionResult>;
}

// Content engine example
class ContentEngine implements CapabilityEngine {
  async *process(message, context, intent) {
    // Use AI to generate content configuration
    const contentConfig = await this.generateContent(message, context);

    yield { type: 'preview', data: contentConfig };

    // Wait for confirmation or modification
  }

  async execute(config, context) {
    // Call appropriate API
    if (config.type === 'post') {
      return apiClient.post(`/spaces/${context.spaceId}/posts`, config);
    } else if (config.type === 'event') {
      return apiClient.post(`/spaces/${context.spaceId}/events`, config);
    }
  }
}
```

#### 3. Automation System

**New tables/collections:**

```typescript
// Firestore: automations/{automationId}
interface Automation {
  id: string;
  spaceId: string;
  createdBy: string;
  name: string;
  description: string;

  trigger: {
    type: 'schedule' | 'event' | 'condition';
    config: ScheduleTrigger | EventTrigger | ConditionTrigger;
  };

  actions: {
    type: 'create_post' | 'send_notification' | 'update_tool' | 'webhook';
    config: Record<string, unknown>;
  }[];

  status: 'active' | 'paused' | 'disabled';
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
}

// Schedule trigger
interface ScheduleTrigger {
  cron?: string;           // "0 9 * * MON" for every Monday 9am
  interval?: number;       // Run every N minutes
  runAt?: Date;            // One-time scheduled
  timezone: string;
}

// Event trigger
interface EventTrigger {
  eventType: 'member_joined' | 'post_created' | 'rsvp_added' | 'reaction_milestone';
  conditions?: Record<string, unknown>;
}

// Condition trigger
interface ConditionTrigger {
  field: string;           // e.g., "post.reactionCount"
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: number | string;
}
```

**Scheduler Service:**

```typescript
// Background job that checks and executes automations
class AutomationScheduler {
  async tick() {
    // Find automations due to run
    const dueAutomations = await this.findDueAutomations();

    for (const automation of dueAutomations) {
      await this.executeAutomation(automation);
    }
  }

  async onEvent(event: HiveEvent) {
    // Find event-triggered automations
    const matching = await this.findMatchingAutomations(event);

    for (const automation of matching) {
      await this.executeAutomation(automation);
    }
  }
}
```

#### 4. Enhanced AI System Prompt

```typescript
const HIVELAB_V2_SYSTEM_PROMPT = `You are HiveLab, an AI assistant for campus community management.

## Your Capabilities

You can configure spaces in seven ways:

1. CONTENT - Create posts, events, announcements
2. TOOLS - Build interactive elements (polls, forms, RSVPs, displays)
3. AUTOMATIONS - Set up triggers and actions (schedules, event reactions)
4. STRUCTURE - Configure tabs, widgets, layout
5. RULES - Set permissions, policies, membership requirements
6. INTEGRATIONS - Connect RSS, calendars, external services
7. COMMERCE - (Coming soon) Handle dues, tickets, bookings

## Response Format

When a user makes a request, respond with:

1. A natural language summary of what you'll set up
2. A structured configuration object for each capability used
3. Any clarifying questions needed

## Configuration Output Schema

{
  "summary": "Natural language description",
  "capabilities": [
    {
      "type": "tool" | "content" | "automation" | "structure" | "rules" | "integration",
      "action": "create" | "update" | "delete",
      "config": { ... capability-specific config ... },
      "requires_confirmation": boolean
    }
  ],
  "questions": [
    {
      "id": "q1",
      "text": "Question text",
      "options": ["option1", "option2"] | null // null for free-form
    }
  ]
}

## Context

Current space: {{spaceName}}
Space category: {{spaceCategory}}
User role: {{userRole}}
Member count: {{memberCount}}
Existing tabs: {{existingTabs}}
Existing tools: {{existingTools}}
`;
```

### API Changes

#### New Endpoints

```typescript
// POST /api/hivelab/generate
// Main generation endpoint - replaces /api/tools/generate
interface GenerateRequest {
  message: string;
  spaceId?: string;        // Optional - for space context
  conversationId?: string; // For multi-turn conversations
  capabilities?: string[]; // Limit to specific capabilities
}

// POST /api/automations
// Create automation
interface CreateAutomationRequest {
  spaceId: string;
  name: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
}

// GET /api/automations?spaceId=xxx
// List automations for space

// PATCH /api/automations/[id]
// Update automation

// POST /api/automations/[id]/run
// Manually trigger automation

// POST /api/spaces/[spaceId]/structure
// Update space structure (tabs, widgets)
interface UpdateStructureRequest {
  tabs?: TabConfig[];
  widgets?: WidgetConfig[];
  layout?: LayoutConfig;
}
```

### Data Flow

```
User Message
     │
     ▼
┌────────────────┐
│ Intent         │ ──► Classify: "run weekly photo challenge"
│ Classification │     → primary: tool, secondary: [automation, structure]
└────────────────┘
     │
     ▼
┌────────────────┐
│ Capability     │ ──► Tool Engine generates poll + form
│ Engines        │     Automation Engine generates weekly trigger
│                │     Structure Engine generates new tab
└────────────────┘
     │
     ▼
┌────────────────┐
│ Preview        │ ──► Stream to client for live preview
│ Assembly       │     User sees configurations being built
└────────────────┘
     │
     ▼
┌────────────────┐
│ Confirmation   │ ──► "Deploy All" or "Edit Individual"
└────────────────┘
     │
     ▼
┌────────────────┐
│ Execution      │ ──► Create tool → Deploy to space
│                │     Create automation → Schedule
│                │     Update structure → Modify tabs
└────────────────┘
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Orchestration layer + enhanced AI

- [ ] Create `HiveLabOrchestrator` class
- [ ] Implement intent classification with Gemini
- [ ] Update system prompt for 7 capabilities
- [ ] Refactor `/api/tools/generate` → `/api/hivelab/generate`
- [ ] Add capability routing
- [ ] Stream multi-capability responses

**Files:**
```
apps/web/src/lib/hivelab/
├── orchestrator.ts
├── intent-classifier.ts
├── engines/
│   ├── base-engine.ts
│   ├── tool-engine.ts        # Existing, refactored
│   └── index.ts
└── prompts/
    └── system-prompt.ts
```

### Phase 2: Content Engine (Week 3)

**Goal:** Create content (posts, events) via chat

- [ ] Implement ContentEngine
- [ ] Add post creation capability
- [ ] Add event creation capability
- [ ] Add scheduling support (schedule_at field)
- [ ] Preview generated content before posting

**Files:**
```
apps/web/src/lib/hivelab/engines/
└── content-engine.ts

apps/web/src/app/api/hivelab/
└── generate/route.ts
```

### Phase 3: Automation Engine (Weeks 4-5)

**Goal:** Trigger-action workflows

- [ ] Create `automations` collection schema
- [ ] Implement AutomationEngine
- [ ] Build automation scheduler (cron job or Cloud Functions)
- [ ] Implement schedule triggers
- [ ] Implement event triggers (member_joined, post_created)
- [ ] Implement actions (create_post, send_notification)
- [ ] UI for viewing/managing automations

**Files:**
```
apps/web/src/lib/hivelab/engines/
└── automation-engine.ts

apps/web/src/app/api/automations/
├── route.ts
├── [id]/route.ts
└── scheduler/route.ts

packages/core/src/domain/automations/
├── automation.aggregate.ts
└── value-objects/
```

### Phase 4: Structure Engine (Week 6)

**Goal:** Configure tabs, widgets, layout via chat

- [ ] Implement StructureEngine
- [ ] Tab CRUD via AI
- [ ] Widget placement via AI
- [ ] Preview structure changes
- [ ] Apply structure updates

**Files:**
```
apps/web/src/lib/hivelab/engines/
└── structure-engine.ts

apps/web/src/app/api/spaces/[spaceId]/
└── structure/route.ts
```

### Phase 5: Rules Engine (Week 7)

**Goal:** Permissions and policies via chat

- [ ] Implement RulesEngine
- [ ] Permission configuration via AI
- [ ] Membership policy configuration
- [ ] Role assignment suggestions

**Files:**
```
apps/web/src/lib/hivelab/engines/
└── rules-engine.ts
```

### Phase 6: Integrations Engine (Week 8)

**Goal:** External connections via chat

- [ ] Implement IntegrationEngine
- [ ] Enhanced RSS configuration
- [ ] Calendar export setup
- [ ] Webhook configuration

### Phase 7: Polish & Optimization (Weeks 9-10)

**Goal:** Production-ready experience

- [ ] Conversation history/memory
- [ ] Undo/redo functionality
- [ ] Mobile optimization
- [ ] Performance tuning
- [ ] Analytics and monitoring

---

## 7. Success Metrics

### User Engagement

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sessions per leader per week | 3+ | Analytics |
| Messages per session | 4+ | Conversation length |
| Configurations deployed | 70%+ | Deploy rate |
| Return rate (7-day) | 60%+ | Retention |

### Configuration Quality

| Metric | Target | Measurement |
|--------|--------|-------------|
| Intent classification accuracy | 90%+ | Manual review sample |
| Config acceptance rate | 80%+ | Deploy without edit |
| Error rate | <5% | Failed generations |

### Space Health

| Metric | Target | Measurement |
|--------|--------|-------------|
| Active tools per space | 3+ | Deployment count |
| Automations per space | 2+ | Automation count |
| Member engagement lift | 20%+ | Before/after comparison |

---

## 8. Open Questions

1. **Conversation Persistence:** How long do we keep conversation history? Per-session or persistent?

2. **Multi-Space Context:** Can a user configure multiple spaces in one session?

3. **Undo Scope:** How far back can users undo? Individual actions or entire conversations?

4. **Rate Limiting:** How many AI generations per user per day?

5. **Collaboration:** Can multiple leaders configure a space simultaneously?

6. **Templates:** Should we maintain curated templates or let AI generate everything?

7. **Onboarding:** How do we teach new users what HiveLab can do?

---

## Appendix A: Element System Reference

See `/packages/ui/src/lib/hivelab/element-system.ts` for full element definitions.

| Element | Category | Tier | Data Source |
|---------|----------|------|-------------|
| search-input | input | universal | none |
| filter-selector | filter | universal | none |
| result-list | display | universal | none |
| date-picker | input | universal | none |
| tag-cloud | display | universal | none |
| map-view | display | universal | none |
| chart-display | display | universal | none |
| form-builder | input | universal | none |
| countdown-timer | display | universal | none |
| poll-element | action | universal | none |
| leaderboard | display | universal | none |
| notification-display | display | universal | none |
| event-picker | input | connected | campus-events |
| space-picker | input | connected | campus-spaces |
| user-selector | input | connected | campus-users |
| rsvp-button | action | connected | campus-events |
| connection-list | display | connected | user-connections |
| member-list | display | space | space-members |
| member-selector | input | space | space-members |
| space-events | display | space | space-events |
| space-feed | display | space | space-feed |
| space-stats | display | space | space-stats |
| announcement | action | space | space-members |
| role-gate | layout | space | space-members |

---

## Appendix B: Automation Examples

### Weekly Reminder

```json
{
  "name": "Monday Meeting Reminder",
  "trigger": {
    "type": "schedule",
    "config": {
      "cron": "0 9 * * MON",
      "timezone": "America/New_York"
    }
  },
  "actions": [
    {
      "type": "create_post",
      "config": {
        "content": "📅 Reminder: Weekly meeting tonight at 7pm in Student Union Room 301!",
        "pinned": false
      }
    }
  ]
}
```

### Welcome New Members

```json
{
  "name": "Welcome New Members",
  "trigger": {
    "type": "event",
    "config": {
      "eventType": "member_joined"
    }
  },
  "actions": [
    {
      "type": "send_notification",
      "config": {
        "template": "welcome",
        "toMember": "{{triggerData.memberId}}"
      }
    }
  ]
}
```

### Auto-Feature Popular Posts

```json
{
  "name": "Feature Popular Posts",
  "trigger": {
    "type": "condition",
    "config": {
      "field": "post.reactionCount",
      "operator": "gte",
      "value": 15
    }
  },
  "actions": [
    {
      "type": "update_post",
      "config": {
        "postId": "{{triggerData.postId}}",
        "featured": true
      }
    }
  ]
}
```

---

*Document created: 2025-11-29*
*Next review: After Phase 1 completion*
