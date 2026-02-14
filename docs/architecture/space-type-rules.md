# Space Type Rules

Every space in HIVE has a **type** that determines its behavior. Same UI, different rules.

## Space Types

```mermaid
graph LR
    subgraph Types["5 Space Types"]
        SO[Student Organizations<br/>Clubs, academic groups, interests]
        UO[University Organizations<br/>Official university entities]
        GL[Greek Life<br/>Frats, sororities, honor societies]
        CL[Campus Living<br/>Dorms, floors, housing]
        HE[HIVE Exclusive<br/>User-created, native to HIVE]
    end
```

## Membership Rules

```mermaid
graph TD
    UserJoin([User wants to join]) --> CheckType{Space Type?}
    
    CheckType -->|Student Org| SO_Join{Join Method}
    SO_Join -->|"Default: Approval"| SO_Approve[Simple approval<br/>Leader approves/denies]
    SO_Join -->|"Some: Instant"| SO_Instant[Instant join<br/>No approval needed]
    
    CheckType -->|University Org| UO_Join[Faculty Approval<br/>Requires faculty advisor sign-off]
    
    CheckType -->|Greek Life| GL_Join[Invitation Only<br/>Must receive invite<br/>Rush system for recruitment]
    
    CheckType -->|Campus Living| CL_Join[Automatic<br/>Based on housing assignment<br/>Max 1 residential space]
    
    CheckType -->|HIVE Exclusive| HE_Join{Creator's Choice}
    HE_Join -->|"Default: Approval"| HE_Approve[Simple approval]
    HE_Join -->|"Can set: Instant"| HE_Instant[Instant join]

    style GL_Join fill:#f66,color:#fff
    style CL_Join fill:#66f,color:#fff
    style UO_Join fill:#f90,color:#fff
```

### Membership Matrix

| Rule | Student Org | University Org | Greek Life | Campus Living | HIVE Exclusive |
|------|-------------|---------------|------------|---------------|----------------|
| **Max spaces** | Unlimited | Unlimited | Unlimited | **1** | Unlimited |
| **Join method** | Approval | Approval | **Invitation only** | **Automatic** | Approval (creator sets) |
| **Leave restriction** | None | None | None | **Housing change only** | None |
| **Approval process** | Simple | **Faculty approval** | **Rush system** | N/A | Simple |
| **Special roles** | President, VP, Treasurer, Secretary | Faculty Advisor, Admin, Student Leader | President, VP, Rush Chair, Social Chair, Pledge Educator | **RA**, Floor President, Building Coordinator | Creator, Admin, Moderator |

## Visibility Rules

```mermaid
graph TD
    Content([Content Created]) --> VisCheck{Check Space Type}
    
    VisCheck -->|Student Org| SO_Vis["Posts: Campus visible<br/>Events: Public calendar<br/>Members: Public<br/>Discoverable: ✅"]
    
    VisCheck -->|University Org| UO_Vis["Posts: Campus visible<br/>Events: Public calendar<br/>Members: Role-based<br/>Discoverable: ✅"]
    
    VisCheck -->|Greek Life| GL_Vis["Posts: Members only<br/>Events: Invitation controlled<br/>Members: Limited external<br/>Discoverable: ❌"]
    
    VisCheck -->|Campus Living| CL_Vis["Posts: Space only<br/>Events: Members only<br/>Members: Members only<br/>Discoverable: ❌"]
    
    VisCheck -->|HIVE Exclusive| HE_Vis["Posts: Campus visible<br/>Events: Public calendar<br/>Members: Public<br/>Discoverable: ✅"]

    style GL_Vis fill:#f66,color:#fff
    style CL_Vis fill:#66f,color:#fff
```

### Visibility Matrix

| Content | Student Org | University Org | Greek Life | Campus Living | HIVE Exclusive |
|---------|-------------|---------------|------------|---------------|----------------|
| **Posts** | Campus visible | Campus visible | **Members only** | **Space only** | Campus visible |
| **Events** | Public calendar | Public calendar | **Invitation controlled** | **Members only** | Public calendar |
| **Member profiles** | Public | **Role-based** | **Limited external** | **Members only** | Public |
| **Discoverable** | ✅ | ✅ | ❌ | ❌ | ✅ |

## Tool Rules

```mermaid
graph TD
    Deploy([Deploy Tool to Space]) --> TypeCheck{Space Type?}
    
    TypeCheck -->|Student Org| SO_Tools["Allowed: project mgmt, skill matching,<br/>analytics, event coord, onboarding, goals<br/>Max: 10 tools<br/>Position: Leader's choice"]
    
    TypeCheck -->|University Org| UO_Tools["Allowed: admin, reporting, campus integration,<br/>compliance, resource allocation, student services<br/>Max: 15 tools<br/>Position: Contextual<br/>⚠️ Requires approval"]
    
    TypeCheck -->|Greek Life| GL_Tools["Allowed: social planning, member dev,<br/>alumni network, rush mgmt, philanthropy<br/>Max: 8 tools<br/>Position: Inline"]
    
    TypeCheck -->|Campus Living| CL_Tools["Allowed: resource booking, issue reporting,<br/>social coord, maintenance, package tracking<br/>Max: 6 tools<br/>Position: Contextual"]
    
    TypeCheck -->|HIVE Exclusive| HE_Tools["Allowed: project mgmt, skill matching,<br/>analytics, event coord, onboarding, goals, social<br/>Max: 10 tools<br/>Position: Leader's choice"]

    style UO_Tools fill:#f90,color:#fff
```

### Tool Rules Matrix

| Rule | Student Org | University Org | Greek Life | Campus Living | HIVE Exclusive |
|------|-------------|---------------|------------|---------------|----------------|
| **Max tools** | 10 | 15 | 8 | 6 | 10 |
| **Requires approval** | No | **Yes** | No | No | No |
| **Default position** | Leader's choice | Contextual | Inline | Contextual | Leader's choice |
| **Allowed categories** | 6 | 6 | 6 | 6 | 7 |

## Special Features & Compliance

| Space Type | Special Features | Compliance |
|-----------|-----------------|------------|
| **Student Org** | External partnerships, fundraising, competitions | — |
| **University Org** | University systems, official comms, resource access | **FERPA, accessibility, university policies** |
| **Greek Life** | Alumni connections, traditions, philanthropy, recruitment | — |
| **Campus Living** | Housing integration, maintenance systems, community resources | — |
| **HIVE Exclusive** | Custom branding, flexible governance, user created | — |

## Decision Flow: Complete Join Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant API as Join API
    participant Rules as Space Type Rules
    participant Perms as Permission System
    participant DB as Firestore

    U->>API: POST /spaces/join-v2
    API->>DB: Get space (type, settings)
    API->>DB: Get user's current spaces
    API->>Rules: canUserJoinSpace(type, currentSpaces)
    
    alt Max spaces exceeded
        Rules-->>API: {canJoin: false, reason: "Max 1 residential space"}
        API-->>U: 400 Bad Request
    end
    
    Rules-->>API: {canJoin: true}
    API->>Rules: getSpaceTypeRules(type)
    
    alt Join method: instant
        API->>DB: Add member (role: member)
        API-->>U: 200 Joined
    else Join method: approval
        API->>DB: Create join request
        API-->>U: 202 Request submitted
    else Join method: invitation_only
        API->>DB: Check pending invite
        alt No invite
            API-->>U: 403 Invitation required
        else Has invite
            API->>DB: Add member, consume invite
            API-->>U: 200 Joined
        end
    else Join method: automatic
        API-->>U: 400 Housing assignment only
    end
```
