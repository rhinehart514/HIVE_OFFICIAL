# HIVE Platform Architecture

> Complete logic documentation for the HIVE campus creation platform.  
> All diagrams use [Mermaid](https://mermaid.js.org/) — GitHub renders them natively.

## Contents

| Document | What It Covers |
|----------|---------------|
| [Platform Overview](./platform-overview.md) | High-level system map, packages, data flow |
| [Space Type Rules](./space-type-rules.md) | 5 space types, membership/visibility/tool rules per type |
| [Permission System](./permission-system.md) | Role hierarchy, permission matrix, space type modifiers |
| [Auth & Identity](./auth-identity.md) | .edu gating, OTP flow, sessions, campus detection |
| [Space Lifecycle](./space-lifecycle.md) | Creation, joining, claiming, leaving, transfer, deletion |
| [Content Flow](./content-flow.md) | Posts, chat, events — creation, moderation, visibility |
| [HiveLab & Tools](./hivelab-tools.md) | Intent detection, composition patterns, custom blocks, fork/remix, discovery |
| [Real-Time Systems](./realtime-systems.md) | Chat SSE, tool state sync, notifications, typing indicators |
| [API Route Map](./api-route-map.md) | All 311 routes organized by domain |

## Architecture Principles

- **Domain-Driven Design** — `@hive/core` owns business logic, `apps/web` owns API routes
- **Firebase Admin SDK** — all server-side Firestore via `firebase-admin`, never client SDK in routes
- **Space type rules drive behavior** — same UI, different rules per space type
- **Permission cascading** — Space Rules → User Role → Space Type Modifiers → Custom Overrides
- **Intent-based creation** — users describe what they need, system resolves to elements or custom blocks
