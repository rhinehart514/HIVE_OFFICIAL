# HiveLab & Tools

HiveLab is the creation engine. Everything else is distribution infrastructure for what HiveLab produces.

## The Two-Path Creation Model

```mermaid
flowchart TD
    User([User describes what they need]) --> Intent[Intent Detection<br/>detectIntent() — 22 intents<br/>Keyword scoring, no LLM call]
    
    Intent --> Resolution{Resolution Path}
    
    Resolution -->|"80%+ of requests"| Composition[Composition Pattern<br/>50 patterns across 8 categories<br/>FREE, INSTANT]
    Resolution -->|"Single element match"| Element[Single Element<br/>38 registered elements<br/>FREE, INSTANT]
    Resolution -->|"Novel/complex request"| CustomBlock[Custom Block<br/>AI-generated via Groq<br/>$0.01, ~2 seconds]
    
    Composition --> Enrich[Space Context Enrichment<br/>enrichPatternForSpace()]
    Enrich --> Tool[Tool Document Created]
    
    Element --> Tool
    CustomBlock --> Generate[Groq LLM generates code<br/>Full HIVE SDK access]
    Generate --> Validate[Validate output<br/>CSP + type checking]
    Validate --> Tool
    
    Tool --> Deploy{Deploy where?}
    Deploy -->|Space| SpaceTool[Available in space tabs]
    Deploy -->|Personal| PersonalTool[In user's lab dashboard]
    Deploy -->|Public| PublicTool[Discoverable by others]

    style Composition fill:#6c6,color:#fff
    style Element fill:#6c6,color:#fff
    style CustomBlock fill:#f90,color:#fff
```

## 22 Intents

```mermaid
mindmap
  root((Intents))
    Governance
      voting
      multi-vote
      suggestion-triage
    Scheduling
      scheduling
      event-series
      attendance-tracking
    Commerce
      marketplace
      fundraising
    Content
      content-creation
      custom-visual
    Social
      icebreaker
      group-matching
      competition-goals
      photo-challenge
    Organization
      task-management
      resource-management
      progress-tracking
    Communication
      announcements
      feedback
      knowledge-base
    Campus
      study-group
      campus-info
```

## 50 Composition Patterns (8 Categories)

| Category | Count | Examples |
|----------|-------|---------|
| **Governance** | 8 | Simple poll, ranked choice, proposal system, budget vote, amendment process, quorum poll, anonymous ballot, consent vote |
| **Scheduling** | 6 | Event planner, recurring schedule, availability finder, shift scheduler, deadline tracker, booking system |
| **Commerce** | 6 | Dues collector, fundraiser, split bill, marketplace listing, auction, budget tracker |
| **Content** | 6 | Newsletter, photo gallery, resource library, wiki, announcement board, blog |
| **Social** | 6 | Icebreaker, matchmaker, challenge board, leaderboard, shoutout wall, secret santa |
| **Events** | 6 | RSVP manager, event series, check-in system, after-event survey, volunteer signup, carpool coordinator |
| **Org Management** | 6 | Role assignment, meeting agenda, minutes tracker, task board, onboarding checklist, attendance log |
| **Campus Life** | 6 | Study group finder, roommate matcher, course review, textbook exchange, campus guide, meal planner |

### Pattern Resolution

```mermaid
flowchart TD
    Intent[Detected Intent] --> GetPattern[getPatternForIntent()<br/>Match intent to patterns]
    GetPattern --> Score[scorePattern()<br/>Keyword overlap scoring]
    Score --> BestMatch{Pattern found?}
    
    BestMatch -->|Yes| Clone[clonePattern()<br/>Deep copy for customization]
    Clone --> Enrich[enrichPatternForSpace()]
    
    BestMatch -->|No| Fallback{Single element?}
    Fallback -->|Yes| ElementComp[Single-element composition]
    Fallback -->|No| CustomBlock[Custom block generation<br/>Groq LLM call]
    
    subgraph Enrichment["Space Context Enrichment"]
        SpaceType{Space Type?}
        SpaceType -->|Greek Life| GL[Add pledge class fields<br/>Chapter terminology<br/>Formal language]
        SpaceType -->|Student Org| SO[Add position fields<br/>Committee structure]
        SpaceType -->|Campus Living| CL[Add building/floor fields<br/>RA terminology]
        SpaceType -->|University Org| UO[Add formal language<br/>Compliance fields]
        
        Size{Space Size?}
        Size -->|"<20 members"| Small[Trim configs<br/>Simpler defaults]
        Size -->|"100+ members"| Large[Add pagination<br/>Batch operations]
    end
    
    Enrich --> SpaceType
    Enrich --> Size
```

## Custom Block System

```mermaid
flowchart TD
    Request([Novel creation request]) --> Generate[Groq generates code<br/>goose-server.ts]
    
    Generate --> BlockCode["Custom block output:<br/>- HTML/CSS/JS bundle<br/>- Typed inputs/outputs<br/>- State schema<br/>- Design tokens"]
    
    BlockCode --> Validate[Validation Pipeline]
    
    subgraph Validation
        TypeCheck[Type checking<br/>custom-block-validator.ts]
        CSP[CSP sandbox rules<br/>csp-builder.ts]
        SizeCheck[Bundle size check]
    end
    
    Validate --> TypeCheck
    Validate --> CSP
    Validate --> SizeCheck
    
    TypeCheck -->|Pass| Store[Store in Firestore]
    CSP -->|Pass| Store
    
    Store --> Render[CustomBlockRenderer.tsx<br/>Sandboxed iframe<br/>window.HIVE SDK access]
    
    subgraph SDK["window.HIVE SDK"]
        State[state.get/set/subscribe]
        IO[io.emit/on]
        Theme[theme.colors/tokens]
        User[user.id/name/role]
        Space[space.id/name/type]
    end
    
    Render --> SDK
```

### Custom Block Architecture

| Component | File | Purpose |
|-----------|------|---------|
| Types | `packages/core/src/domain/hivelab/custom-block.types.ts` | Block type definitions |
| SDK | `packages/ui/src/lib/hivelab/hive-sdk.ts` | `window.HIVE` runtime API |
| Renderer | `packages/ui/src/design-system/components/hivelab/CustomBlockRenderer.tsx` | Sandboxed iframe renderer |
| CSP | `packages/ui/src/lib/hivelab/csp-builder.ts` | Content Security Policy |
| Element | `packages/ui/src/components/hivelab/elements/custom/custom-block-element.tsx` | Element registry entry |
| Validator | `packages/core/src/domain/hivelab/validation/custom-block-validator.ts` | Output validation |
| Generator | `packages/core/src/application/hivelab/custom-block-generator.service.ts` | Generation service |
| Create API | `apps/web/src/app/api/tools/create-custom-block/route.ts` | API endpoint |

## Tool Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: User creates tool
    Draft --> Published: Creator publishes
    Draft --> Deleted: Creator deletes
    
    Published --> Featured: Admin features
    Published --> Suspended: Moderation flag
    Published --> Draft: Creator unpublishes
    
    Featured --> Published: Un-featured
    Suspended --> Published: Restored
    
    Published --> Forked: Another user forks
    Forked --> Draft: Fork is a new draft
    
    note right of Published
        Published tools can be:
        - Deployed to spaces
        - Discovered by others
        - Forked/remixed
    end note
```

## Fork / Remix Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Clone API
    participant DB as Firestore
    participant Notif as Notifications

    U->>API: POST /tools/:id/clone {mode: 'fork'}
    API->>DB: Get original tool
    
    alt Tool not published/public
        API-->>U: 403 Not cloneable
    end
    
    API->>DB: Create new tool doc
    Note over DB: forkedFrom: {toolId, userId, timestamp}
    API->>DB: Increment original.forkCount
    API->>Notif: tool.forked notification to creator
    API-->>U: {newToolId} → redirect to editor
    
    Note over U: Fork = exact copy (published)<br/>Remix = copy in draft mode (edit first)
```

## Discovery & Distribution

```mermaid
flowchart TD
    Created([Tool created in Space A]) --> Publish[Creator publishes tool]
    
    Publish --> Discover[Discovery API<br/>GET /api/tools/discover]
    
    Discover --> Filters{Filters}
    Filters --> Category[By category<br/>governance, scheduling, etc.]
    Filters --> SpaceType[By space type<br/>student_org, greek_life, etc.]
    Filters --> Sort[By sort<br/>popular, recent, trending]
    Filters --> Search[By search query]
    
    Sort --> Trending[Trending algorithm:<br/>score = (forks×3 + uses) × recencyMultiplier<br/>recency = 1/(1 + daysSince/7)]
    
    Discover --> Results[Tool results with:<br/>id, title, description, category,<br/>creator, spaceOrigin, forkCount,<br/>useCount, createdAt]
    
    Results --> Fork[Fork to my space]
    Results --> Remix[Remix and customize]
    Results --> View[View standalone<br/>/t/[toolId]]
```

## Tool State: Dual-Scoped

```mermaid
flowchart LR
    Tool[Tool Instance] --> Personal[Personal State<br/>Per-user, private<br/>getStateDocumentId(toolId, userId)]
    Tool --> Shared[Shared State<br/>Per-space, collaborative<br/>getStateDocumentId(toolId, spaceId)]
    
    Personal --> LocalFirst[Optimistic local update]
    Shared --> LocalFirst
    
    LocalFirst --> Debounce[300ms debounce<br/>scheduleActionStateSync()]
    Debounce --> Firestore[(Firestore)]
    
    Firestore --> SSE[SSE stream<br/>/api/tools/:id/state/stream]
    SSE --> Client[Client hook<br/>use-tool-state-stream.ts]
    Client --> Merge[Merge with local state<br/>Last-write-wins by timestamp]
```

## Rate Limiting

```mermaid
flowchart TD
    Request([AI generation request]) --> Check[ai-usage-tracker.ts<br/>Check daily limit]
    Check --> Counter[Firestore daily counter<br/>UTC date key]
    
    Counter --> Under{Under limit?<br/>DAILY_GENERATION_LIMIT = 50}
    Under -->|Yes| Generate[Proceed with generation]
    Under -->|No| Limited[429 Rate Limited<br/>Include resetAt timestamp]
    
    Generate --> Increment[Increment counter]
    
    style Limited fill:#f66,color:#fff
```

## Notification Hooks

| Event | Recipient | Message |
|-------|-----------|---------|
| `tool.forked` | Original creator | "Someone forked your [tool name]" |
| `tool.deployed` | Space members | "[tool name] was added to [space name]" |
| `tool.milestone` | Creator | "Your [tool name] hit [10/50/100/500/1000] uses!" |
| `tool.updated` | Users who forked it | "[tool name] was updated" |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `use-tool-runtime.ts` | 1,048 | Client-side tool execution runtime |
| `composition-patterns.ts` | ~2,000 | 50 patterns + scoring + enrichment |
| `intent-detection.ts` | — | 22 intents with keyword scoring |
| `create-from-intent/route.ts` | — | 3-tier resolution: pattern → element → custom block |
| `goose-server.ts` | — | Groq LLM integration + validation |
| `ai-usage-tracker.ts` | — | Firebase Admin rate limiting |
| `use-tool-state-stream.ts` | — | SSE client hook with optimistic updates |
| `tool-notifications.ts` | — | Tool event notification triggers |
