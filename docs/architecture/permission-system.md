# Permission System

Permissions cascade: **Base Role → Space Type Modifiers → Custom Overrides → Restrictions**

## Role Hierarchy

```mermaid
graph TB
    Owner[🔑 Owner<br/>Full control] --> Admin[⚙️ Admin<br/>Everything except delete/transfer]
    Admin --> Moderator[🛡️ Moderator<br/>Content moderation + basic actions]
    Moderator --> Member[👤 Member<br/>Own content only]
    Member --> Guest[👁️ Guest<br/>View members only]

    style Owner fill:#f90,color:#fff
    style Admin fill:#66f,color:#fff
    style Moderator fill:#6c6,color:#fff
    style Member fill:#888,color:#fff
    style Guest fill:#ccc,color:#333
```

## Permission Categories

```mermaid
mindmap
  root((Permissions))
    Content
      posts:create
      posts:edit_own
      posts:edit_any
      posts:delete_own
      posts:delete_any
      posts:pin
      events:create
      events:edit_own
      events:edit_any
      events:delete_own
      events:delete_any
      events:manage
      messages:edit_own
      messages:edit_any
      messages:delete_own
      messages:delete_any
    Members
      members:view
      members:invite
      members:remove
      members:promote
    Tools
      tools:view
      tools:install
      tools:configure
      tools:remove
    Space
      space:settings
      space:delete
      space:transfer
    Data
      data:export
      analytics:view
      moderation:access
```

## Base Permission Matrix

| Permission | Owner | Admin | Moderator | Member | Guest |
|-----------|-------|-------|-----------|--------|-------|
| **posts:create** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **posts:edit_own** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **posts:edit_any** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **posts:delete_own** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **posts:delete_any** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **posts:pin** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **events:create** | ✅ | ✅ | ✅ | ❌* | ❌ |
| **events:edit_own** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **events:edit_any** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **events:delete_own** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **events:delete_any** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **events:manage** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **messages:edit_own** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **messages:edit_any** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **messages:delete_own** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **messages:delete_any** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **members:view** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **members:invite** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **members:remove** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **members:promote** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **tools:view** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **tools:install** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **tools:configure** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **tools:remove** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **space:settings** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **space:delete** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **space:transfer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **data:export** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **analytics:view** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **moderation:access** | ✅ | ✅ | ✅ | ❌ | ❌ |

*\* Members get `events:create` in student_organizations, greek_life, and hive_exclusive via space type modifiers*

## Space Type Modifiers

After base role permissions are calculated, space type modifiers **add** or **restrict** permissions:

```mermaid
flowchart TD
    Base[Base Role Permissions] --> SpaceMod{Space Type?}
    
    SpaceMod -->|Student Org| SO["+ members get events:create"]
    SpaceMod -->|University Org| UO["+ owner/admin get data:export<br/>- space:delete BLOCKED"]
    SpaceMod -->|Greek Life| GL["+ members get events:create<br/>- members:view RESTRICTED"]
    SpaceMod -->|Campus Living| CL["+ admins (RAs) get tools:install<br/>- space:delete BLOCKED<br/>- space:transfer BLOCKED"]
    SpaceMod -->|HIVE Exclusive| HE["+ owner gets data:export + analytics:view<br/>+ admin gets data:export<br/>+ members get events:create"]
    
    SO --> Final[Effective Permissions]
    UO --> Final
    GL --> Final
    CL --> Final
    HE --> Final
    
    Final --> Custom{Custom overrides?}
    Custom -->|Yes| Apply[Apply additions + restrictions]
    Custom -->|No| Done[Final Permission Set]
    Apply --> Done

    style UO fill:#f90,color:#fff
    style CL fill:#66f,color:#fff
    style GL fill:#f66,color:#fff
```

### Space Type Modifier Details

| Space Type | Additions | Restrictions |
|-----------|-----------|-------------|
| **Student Org** | Members: `events:create` | — |
| **University Org** | Owner/Admin: `data:export` | `space:delete` blocked for all |
| **Greek Life** | Members: `events:create` | `members:view` restricted |
| **Campus Living** | Admin (RA): `tools:install`; Members: `tools:view` | `space:delete` + `space:transfer` blocked |
| **HIVE Exclusive** | Owner: `data:export` + `analytics:view`; Admin: `data:export`; Members: `events:create` | — |

## Permission Resolution Flow

```mermaid
sequenceDiagram
    participant Route as API Route
    participant MW as Middleware
    participant Perm as Permission System
    participant Rules as Space Type Rules
    participant DB as Firestore

    Route->>MW: enforceSpaceRules(spaceId, userId, 'posts:create')
    MW->>DB: Get space (type, settings)
    MW->>DB: Get membership (role, status)
    
    alt Not a member
        MW-->>Route: {allowed: false, reason: "Not a member"}
    end
    
    alt Suspended
        MW-->>Route: {allowed: false, reason: "Membership suspended"}
    end
    
    MW->>Rules: getSpaceTypeRules(spaceType)
    MW->>Perm: resolveUserPermissions(userPerms, spaceType, rules)
    
    Note over Perm: 1. Get base role permissions<br/>2. Apply space type additions<br/>3. Remove space type restrictions<br/>4. Apply custom additions<br/>5. Remove custom restrictions<br/>6. Deduplicate
    
    Perm-->>MW: effectivePermissions[]
    
    alt Has required permission
        MW-->>Route: {allowed: true, effectivePermissions}
    else Missing permission
        MW-->>Route: {allowed: false, reason: "Insufficient permissions"}
    end
```

## Tool Permission Presets

Tools have their own permission requirements that stack on top of user permissions:

| Tool Type | Required Role | Required Permissions | Restricted In |
|-----------|--------------|---------------------|---------------|
| **Project Management** | Member | `posts:create`, `events:create` | — |
| **Administrative** | Admin | `space:settings`, `data:export` | — |
| **Social Planning** | Member | `events:create` | — |
| **Resource Booking** | Member | — | Greek Life |
| **Member Development** | Moderator | `members:view` | — |
| **Analytics** | Admin | `analytics:view`, `data:export` | — |

```mermaid
flowchart TD
    ToolUse([User wants to use tool]) --> RoleCheck{User role ≥<br/>required role?}
    RoleCheck -->|No| Denied[❌ Denied:<br/>Requires higher role]
    RoleCheck -->|Yes| SpaceCheck{Tool restricted<br/>in this space type?}
    SpaceCheck -->|Yes| Denied2[❌ Denied:<br/>Not available in this space type]
    SpaceCheck -->|No| PermCheck{Has all required<br/>permissions?}
    PermCheck -->|No| Denied3[❌ Denied:<br/>Missing required permission]
    PermCheck -->|Yes| Allowed[✅ Allowed]
    
    style Denied fill:#f66,color:#fff
    style Denied2 fill:#f66,color:#fff
    style Denied3 fill:#f66,color:#fff
    style Allowed fill:#6c6,color:#fff
```

## Own vs Any: Content Permission Logic

A critical distinction in the permission system:

```mermaid
flowchart TD
    Action([Edit/Delete Content]) --> OwnerCheck{Is user the<br/>content author?}
    
    OwnerCheck -->|Yes| OwnCheck{Has _own<br/>permission?}
    OwnCheck -->|Yes| Allow[✅ Allowed]
    OwnCheck -->|No| Deny[❌ Denied]
    
    OwnerCheck -->|No| AnyCheck{Has _any<br/>permission?}
    AnyCheck -->|Yes| Allow
    AnyCheck -->|No| Deny
    
    style Allow fill:#6c6,color:#fff
    style Deny fill:#f66,color:#fff
```

**Example:** A `member` has `posts:edit_own` + `posts:delete_own` but NOT `posts:edit_any`. They can edit their own posts but cannot edit others' posts. A `moderator` has both `_own` and `_any` — they can edit anyone's posts.
