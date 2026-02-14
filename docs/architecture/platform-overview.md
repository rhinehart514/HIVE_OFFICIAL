# Platform Overview

## System Architecture

```mermaid
graph TB
    subgraph Client["Client (Browser/PWA)"]
        LP[Landing Page]
        Entry[Entry Flow]
        Shell[App Shell]
        SpaceUI[Space View]
        LabUI[HiveLab]
        DiscoverUI[Discover]
        ProfileUI[Profile]
    end

    subgraph API["Next.js API Routes (311 routes)"]
        AuthAPI[Auth - 17 routes]
        SpacesAPI[Spaces - 92 routes]
        ToolsAPI[Tools - 50 routes]
        ProfileAPI[Profile - 26 routes]
        AdminAPI[Admin - 61 routes]
        EventsAPI[Events - 2 routes]
        CampusAPI[Campus - 7 routes]
        CronAPI[Cron - 5 routes]
        NotifAPI[Notifications - 2 routes]
        SearchAPI[Search - 2 routes]
        OtherAPI[Other - 47 routes]
    end

    subgraph Middleware["Middleware Layer"]
        AuthMW[Auth Middleware<br/>withAuthAndErrors]
        SpacePerm[Space Permission<br/>checkSpacePermission]
        SpaceRules[Space Type Rules<br/>enforceSpaceRules]
        PermSys[Permission System<br/>resolveUserPermissions]
        RateLimit[Rate Limiting]
        Validation[Input Validation<br/>Zod + SecurityScanner]
    end

    subgraph Packages["Shared Packages"]
        Core["@hive/core<br/>83K lines<br/>DDD domain logic"]
        UI["@hive/ui<br/>216K lines<br/>Design system + components"]
    end

    subgraph Infrastructure["Infrastructure"]
        Firebase[(Firebase/Firestore)]
        FCM[Firebase Cloud Messaging]
        Groq[Groq API<br/>LLM generation]
        Resend[Resend<br/>Email delivery]
    end

    Client --> API
    API --> Middleware
    Middleware --> Packages
    API --> Infrastructure
    Core --> Firebase
```

## Data Flow

```mermaid
flowchart LR
    User([Student]) -->|".edu email"| Auth
    Auth -->|"OTP verify"| Session
    Session -->|"JWT"| API
    
    API -->|"read/write"| Firestore[(Firestore)]
    API -->|"push"| FCM[Push Notifications]
    API -->|"AI generation"| Groq[Groq LLM]
    API -->|"email"| Resend[Email]
    
    Firestore -->|"SSE stream"| Client([Browser])
    FCM -->|"push"| PWA([PWA])
```

## Package Structure

```
HIVE/
├── apps/
│   ├── web/                    # Main Next.js 15 app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/        # 311 API routes (~86K lines)
│   │   │   │   ├── s/[handle]/ # Space pages
│   │   │   │   ├── lab/        # HiveLab pages
│   │   │   │   ├── discover/   # Discovery page
│   │   │   │   ├── enter/      # Entry/auth pages
│   │   │   │   └── ...
│   │   │   ├── hooks/          # 47 hooks (~9.5K lines)
│   │   │   ├── lib/            # 118 modules (~37K lines)
│   │   │   └── components/     # UI components
│   │   └── ...
│   └── admin/                  # Admin dashboard app
├── packages/
│   ├── core/                   # Domain logic (~83K lines)
│   │   ├── domain/             # Entities, value objects, services
│   │   ├── application/        # Use cases, services
│   │   ├── infrastructure/     # Repository implementations
│   │   └── server.ts           # Server-only exports
│   └── ui/                     # Design system (~216K lines)
│       ├── design-system/      # Base components
│       └── components/         # Feature components
└── docs/
    └── architecture/           # You are here
```

## Key Integrations

| Service | Purpose | Used By |
|---------|---------|---------|
| **Firebase/Firestore** | Primary database, auth tokens, file storage | All routes |
| **Firebase Cloud Messaging** | Push notifications (18 types) | Notification service |
| **Groq** | LLM for custom block generation | HiveLab tool creation |
| **Resend** | Email delivery (OTP codes, invites) | Auth, notifications |
| **Vercel** | Hosting, edge functions, cron | Deployment |

## Scale Numbers

| Metric | Count |
|--------|-------|
| API routes | 311 |
| Total route code | ~86K lines |
| Core package | ~83K lines |
| UI package | ~216K lines |
| Hooks | 47 (~9.5K lines) |
| Lib modules | 118 (~37K lines) |
| HiveLab elements | 38 registered |
| Composition patterns | 50 |
| Space types | 5 |
| Pre-seeded spaces | 698 |
| Pre-seeded events | 2,467 |
| Notification types | 18 |
