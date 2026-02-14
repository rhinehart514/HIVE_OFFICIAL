# Space Lifecycle

## Space States

```mermaid
stateDiagram-v2
    [*] --> Unclaimed: Pre-seeded from university data
    [*] --> Draft: User creates new space
    
    Unclaimed --> Active: Leader claims space
    Draft --> Active: Creator completes setup
    
    Active --> Suspended: Admin/moderation action
    Suspended --> Active: Restored by admin
    
    Active --> Archived: Owner archives
    Archived --> Active: Owner restores
    
    Active --> Deleted: Owner deletes<br/>(if allowed by space type)
    Deleted --> [*]
    
    note right of Unclaimed
        698 pre-seeded spaces
        (student orgs, greek life, etc.)
    end note
    
    note right of Deleted
        Blocked for:
        - university_organizations
        - campus_living
    end note
```

## Creation Flow

```mermaid
flowchart TD
    Start([Create Space]) --> Type{How?}
    
    Type -->|"New (HIVE Exclusive)"| Create[POST /api/spaces<br/>Name, handle, description, category]
    Type -->|"Claim existing"| Claim[POST /api/spaces/claim<br/>Verify affiliation with org]
    Type -->|"Request to lead"| Request[POST /api/spaces/request-to-lead<br/>For unclaimed pre-seeded spaces]
    
    Create --> HandleCheck[Check handle availability<br/>GET /api/spaces/check-handle]
    HandleCheck --> PermCheck[Check creation permission<br/>GET /api/spaces/check-create-permission]
    PermCheck --> Setup[Configure space<br/>Avatar, banner, settings, boards]
    
    Claim --> VerifyClaim{Verify claim}
    VerifyClaim -->|Approved| BecomeOwner[User becomes owner]
    
    Request --> AdminReview[Admin reviews request]
    AdminReview -->|Approved| BecomeOwner
    
    Setup --> GoLive[POST /api/spaces/:id/go-live]
    BecomeOwner --> GoLive
    GoLive --> Active([Space is active])
```

## Join Flow (Detailed)

```mermaid
flowchart TD
    UserJoin([User wants to join]) --> FindSpace[Find via Discover, Invite, or Search]
    FindSpace --> SpaceType{Space Type}
    
    SpaceType -->|"Instant join<br/>(some student orgs, hive exclusive)"| Direct[POST /api/spaces/join-v2<br/>Immediately added as member]
    
    SpaceType -->|"Approval required<br/>(most student orgs, university orgs)"| JoinReq[POST /api/spaces/:id/join-requests<br/>Request submitted]
    JoinReq --> LeaderReview{Leader reviews}
    LeaderReview -->|Accept| Added[Added as member]
    LeaderReview -->|Reject| Rejected[Request rejected]
    
    SpaceType -->|"Invitation only<br/>(Greek life)"| InviteCheck{Has invite?}
    InviteCheck -->|Yes| Direct
    InviteCheck -->|No| Waitlist[POST /api/spaces/waitlist<br/>Added to interest list]
    
    SpaceType -->|"Automatic<br/>(Campus living)"| Housing{Housing assigned?}
    Housing -->|Yes| AutoAdd[Automatically added<br/>Based on housing data]
    Housing -->|No| NoAccess[Cannot join manually]
    
    Direct --> Member([Member of space])
    Added --> Member
    AutoAdd --> Member
    
    Member --> Threshold[Space Threshold<br/>New members see limited view first]
```

## Member Roles & Transitions

```mermaid
stateDiagram-v2
    [*] --> Guest: Views public space
    Guest --> Member: Joins space
    
    Member --> Moderator: Promoted by admin/owner
    Moderator --> Admin: Promoted by owner
    Admin --> Owner: Ownership transferred
    
    Member --> Suspended: Moderation action
    Suspended --> Member: Restored
    
    Member --> [*]: Leaves space
    Moderator --> Member: Demoted
    Admin --> Moderator: Demoted
    
    note right of Owner
        Only 1 owner per space.
        Transfer via POST /api/spaces/transfer
    end note
```

## Leave / Transfer / Delete Rules

```mermaid
flowchart TD
    Action{Action?}
    
    Action -->|Leave| LeaveCheck{Space type?}
    LeaveCheck -->|Campus Living| HousingOnly[❌ Can only leave<br/>on housing change]
    LeaveCheck -->|Others| CanLeave[✅ POST /api/spaces/leave]
    CanLeave --> OwnerCheck{Is owner?}
    OwnerCheck -->|Yes| MustTransfer[Must transfer ownership first]
    OwnerCheck -->|No| Left[Left space]
    
    Action -->|Transfer| TransferCheck{Space type?}
    TransferCheck -->|Campus Living| NoTransfer[❌ Cannot transfer<br/>housing-managed space]
    TransferCheck -->|Others| CanTransfer[✅ POST /api/spaces/transfer<br/>Requires owner role]
    
    Action -->|Delete| DeleteCheck{Space type?}
    DeleteCheck -->|University Org| NoDelete[❌ Cannot delete<br/>official university space]
    DeleteCheck -->|Campus Living| NoDelete2[❌ Cannot delete<br/>housing-managed space]
    DeleteCheck -->|Others| CanDelete[✅ DELETE /api/spaces/:id<br/>Requires owner role]
    
    style HousingOnly fill:#f66,color:#fff
    style NoTransfer fill:#f66,color:#fff
    style NoDelete fill:#f66,color:#fff
    style NoDelete2 fill:#f66,color:#fff
```

## Space Internal Structure

```mermaid
graph TD
    Space[Space] --> Boards[Boards<br/>Chat channels within space]
    Space --> Tabs[Tabs<br/>Content sections]
    Space --> Tools[Deployed Tools<br/>HiveLab tools in space]
    Space --> Events[Events<br/>Space-specific events]
    Space --> Members[Members<br/>With roles]
    Space --> Posts[Posts<br/>Feed content]
    Space --> Resources[Resources<br/>Files, links, docs]
    Space --> Automations[Automations<br/>Triggered workflows]
    Space --> Analytics[Analytics<br/>Leader dashboard]
    
    Boards --> Messages[Messages<br/>With reactions, threads, pins]
    Members --> Roles[owner / admin / moderator / member / guest]
    Tools --> ToolState[Tool State<br/>Personal + Shared scopes]
```

## Key API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/spaces` | GET/POST | List/create spaces |
| `/api/spaces/join-v2` | POST | Join a space |
| `/api/spaces/leave` | POST | Leave a space |
| `/api/spaces/claim` | POST | Claim unclaimed space |
| `/api/spaces/transfer` | POST | Transfer ownership |
| `/api/spaces/browse-v2` | GET | Browse/discover spaces |
| `/api/spaces/recommended` | GET | Personalized recommendations |
| `/api/spaces/search` | GET | Search spaces |
| `/api/spaces/mine` | GET | User's joined spaces |
| `/api/spaces/:id` | GET/PATCH/DELETE | Space CRUD |
| `/api/spaces/:id/members` | GET/POST/PATCH/DELETE | Member management |
| `/api/spaces/:id/boards` | GET/POST | Board (channel) management |
| `/api/spaces/:id/tabs` | GET/POST/PATCH | Tab management |
| `/api/spaces/:id/tools` | GET/POST | Tool deployment |
| `/api/spaces/:id/events` | GET/POST | Space events |
| `/api/spaces/:id/analytics` | GET | Space analytics |
| `/api/spaces/:id/automations` | GET/POST | Automation management |
| `/api/spaces/:id/go-live` | POST | Publish space |
| `/api/spaces/:id/invite` | GET/POST | Invite links |
| `/api/spaces/:id/join-requests` | GET/POST | Manage join requests |
