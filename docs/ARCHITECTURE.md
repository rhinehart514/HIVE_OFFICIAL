# HIVE Codebase Architecture

## 📐 Top-Level Structure

```
/
├── apps/                     # Applications
│   ├── web/                  # Main Next.js app (port 3000)
│   └── admin/                # Admin dashboard (port 3001)
│
├── packages/                 # Shared packages (monorepo)
│   ├── ui/                   # @hive/ui - Atomic design system
│   ├── core/                 # @hive/core - DDD business logic
│   ├── firebase/             # @hive/firebase - Firebase integration
│   ├── auth-logic/           # @hive/auth-logic - Authentication
│   ├── hooks/                # @hive/hooks - React hooks
│   ├── tokens/               # @hive/tokens - Design tokens
│   ├── validation/           # @hive/validation - Zod schemas
│   ├── analytics/            # @hive/analytics - Analytics tracking
│   ├── i18n/                 # @hive/i18n - Internationalization
│   ├── api-client/           # @hive/api-client - API client
│   ├── utilities/            # @hive/utilities - Shared utils
│   └── config/               # @hive/config - Shared config
│
├── docs/                     # Documentation
│   ├── features/             # Feature specifications
│   ├── ux/                   # UX topology + design patterns
│   ├── api/                  # API documentation
│   ├── development/          # Developer guides
│   ├── deployment/           # Deployment guides
│   ├── architecture/         # System architecture docs
│   └── archive/              # Old docs + migration notes
│
├── infrastructure/           # Infrastructure & deployment
│   ├── firebase/             # Firebase config + Cloud Functions
│   ├── docker/               # Docker configs
│   ├── kubernetes/           # Kubernetes configs
│   ├── deploy/               # Deployment scripts
│   └── dataconnect/          # Data Connect schema
│
├── tooling/                  # Development tools
│   ├── scripts/              # Build/dev scripts
│   ├── mcp-servers/          # MCP servers
│   └── .storybook/           # Storybook config
│
├── public/                   # Static assets
│
├── .claude/                  # Claude Code config
├── .cursor/                  # Cursor IDE config
├── .husky/                   # Git hooks
├── .vercel/                  # Vercel deployment config
├── .vscode/                  # VSCode config
│
├── package.json              # Root package.json
├── pnpm-workspace.yaml       # Workspace config
├── turbo.json                # Turborepo config
└── tsconfig.json             # Root TypeScript config
```

## 🎯 Design Principles

1. **Clear Separation**: Apps, packages, docs, infra, tooling are separate
2. **Monorepo Structure**: All packages in `/packages`, all apps in `/apps`
3. **Documentation First**: All docs in `/docs` with clear categorization
4. **Infrastructure Isolated**: All deployment/infra in `/infrastructure`
5. **Tooling Separated**: Dev tools in `/tooling`, not cluttering root

## 📦 Package Dependencies

```
apps/web → depends on → all packages/*
apps/admin → depends on → @hive/ui, @hive/core

@hive/ui → depends on → @hive/tokens
@hive/hooks → depends on → @hive/core, @hive/tokens
@hive/auth-logic → depends on → @hive/firebase
@hive/core → depends on → @hive/firebase
```

## 🏗️ Build Order (Turborepo)

1. `@hive/tokens` - Design tokens
2. `@hive/firebase` - Firebase init
3. `@hive/core` - Business logic
4. `@hive/auth-logic`, `@hive/validation`, `@hive/analytics`
5. `@hive/hooks` - React hooks
6. `@hive/ui` - UI components
7. `apps/web`, `apps/admin` - Applications

## 📚 Documentation Index

- [Feature Specs](./features/) - Product requirements
- [UX Topology](./ux/) - Design patterns
- [API Docs](./api/) - API reference
- [Development](./development/) - Dev setup guides
- [Deployment](./deployment/) - Deploy guides
- [Architecture](./architecture/) - System design

### Key Architecture Documents

| Document | Purpose |
|----------|---------|
| [VERTICAL_SLICE_AUDIT.md](./architecture/VERTICAL_SLICE_AUDIT.md) | Complete analysis of all 22 vertical slices |
| [IMPLEMENTATION_ROADMAP.md](./architecture/IMPLEMENTATION_ROADMAP.md) | Ordered implementation with AI-first analysis |
| [CAMPUS_TOPOLOGY.md](./architecture/CAMPUS_TOPOLOGY.md) | Campus ecosystem + wedge strategy |

---

## 🏫 Campus Topology

### Target Environment: University at Buffalo (UB)

**Campus Scale:**
- ~32,000 students (undergraduate + graduate)
- ~6,000 faculty/staff
- 300+ registered student organizations
- 3 campuses (North, South, Downtown)

**Existing Digital Ecosystem:**
```
┌─────────────────────────────────────────────────────────────┐
│                    CAMPUS DIGITAL LAYER                      │
├─────────────────────────────────────────────────────────────┤
│ Official                                                     │
│ ├── MyUB Portal (Blackboard, grades, official comms)        │
│ ├── UB Mobile App (maps, dining, transit)                   │
│ ├── Campus Labs (org registration, events)                  │
│ └── Email (official communications)                         │
├─────────────────────────────────────────────────────────────┤
│ Social (Where Students Actually Are)                         │
│ ├── Instagram (club promotion, events, social)              │
│ ├── GroupMe (group chats, class groups, club comms)         │
│ ├── Discord (gaming, tech clubs, study groups)              │
│ ├── Snapchat (social, stories)                              │
│ └── TikTok (discovery, trends)                              │
├─────────────────────────────────────────────────────────────┤
│ Functional                                                   │
│ ├── Google Calendar (personal scheduling)                   │
│ ├── LinkedIn (career, professional)                         │
│ ├── Handshake (jobs, internships)                           │
│ └── When2Meet (group scheduling)                            │
└─────────────────────────────────────────────────────────────┘
```

### Wedge Opportunities

**Primary Wedge: Space Discovery**
- Problem: New students don't know what clubs exist
- Current: Campus Labs listing (static, boring, unused)
- HIVE: Dynamic discovery with social proof, activity feeds

**Secondary Wedge: Event Fragmentation**
- Problem: Events scattered across Instagram stories, flyers, GroupMe
- Current: No single source of truth
- HIVE: Unified event calendar with RSVP + social layer

**Tertiary Wedge: Leader Burden**
- Problem: Club leaders manage 5+ platforms manually
- Current: Post same content to Instagram, GroupMe, email
- HIVE: Single hub that distributes to where members are

### Competitive Positioning

| Competitor | Weakness | HIVE Advantage |
|------------|----------|----------------|
| GroupMe | No discovery, no profiles, no persistence | Rich profiles, discoverability |
| Instagram | No membership, no structure | Structured communities |
| Discord | Too complex for casual users | Simple, campus-native |
| Campus Labs | Static, no engagement | Dynamic, social, engaging |
| Slack/Teams | Professional, not social | Social-first, campus-native |

---

## 🔄 Vertical Slice Overview

### Platform Readiness

| Tier | Slices | Status | Launch Blocker |
|------|--------|--------|----------------|
| **Core** | Auth, Onboarding, Profiles, Spaces, Feed | 50% | Yes |
| **Engagement** | Tools, Rituals, Calendar, Social, Notifications | 25% | Partial |
| **Infrastructure** | Real-time, Search, Privacy, Admin, Moderation | 20% | Yes |

### Critical Path to Launch

```
Week 1: Security (Auth hardening, remove dev backdoors)
Week 1-2: Data Integrity (Onboarding fix, Profile cleanup)
Week 2-3: Core Experience (Feed algorithm, Spaces permissions)
Week 3-4: Infrastructure (Real-time, Notifications)
Week 4: Discovery (Search)
```

### AI Integration Readiness

Each slice has documented AI opportunities:
- **Near-term**: Rule-based, deterministic enhancements
- **Medium-term**: ML-powered personalization
- **Long-term**: Generative AI features

See `IMPLEMENTATION_ROADMAP.md` for slice-by-slice AI analysis.

---

**Last Updated:** November 28, 2024
**Branch:** main
**Platform Status:** Pre-launch (50% core ready)
