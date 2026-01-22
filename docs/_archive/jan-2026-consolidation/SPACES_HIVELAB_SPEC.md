# Spaces & HiveLab Specification

**Last Updated:** December 2025

---

## Philosophy

**Spaces work without leaders. Leaders are an upgrade, not a requirement.**

A pre-seeded space from UBLinked should be valuable before anyone claims it. Students can browse, join, chat, see events. A leader claiming the space unlocks customization and tools — but doesn't create the core value.

**Student autonomy means:** Anyone can create. Anyone can participate. Structure emerges from activity, not from permission.

---

## Space Types

Four space types. Type informs the experience (templates, suggestions, AI context) but doesn't gate access.

| Type | Description | Default Governance | Primary Use |
|------|-------------|-------------------|-------------|
| **UNI** | Official university entities | Hierarchical | Departments, programs, student gov |
| **STUDENT** | Student-run organizations | Hybrid | Clubs, orgs, interest groups |
| **GREEK** | Fraternities & sororities | Hierarchical | Chapters, councils |
| **RESIDENTIAL** | Dorms, floors, housing | Flat/Emergent | Floor communities, RA groups |

### Governance Models

| Model | Description | Roles |
|-------|-------------|-------|
| **Flat** | Everyone equal, no designated roles | All members equivalent |
| **Emergent** | Roles form from activity/contribution | Contributors earn influence |
| **Hybrid** | Some designated roles + earned roles | Officers + active contributors |
| **Hierarchical** | Clear chain of command | Owner → Admin → Mod → Member |

---

## Space Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  PRE-SEEDED (from UBLinked)                                  │
│                                                              │
│  - Exists in directory                                       │
│  - Basic info: name, category, description                   │
│  - Events synced from UBLinked                               │
│  - No owner, no customization                                │
│  - Status: unclaimed                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ Students discover & join
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ACTIVE (organic community)                                  │
│                                                              │
│  - Members join                                              │
│  - Chat is live                                              │
│  - Polls, events work                                        │
│  - Community forms organically                               │
│  - Still no designated leader                                │
│  - Status: active-unclaimed                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Leader claims space
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CLAIMED (leader-enhanced)                                   │
│                                                              │
│  - Customization unlocked (banner, description)              │
│  - HiveLab tool deployment                                   │
│  - Analytics access                                          │
│  - Role management                                           │
│  - Official status available (if verified)                   │
│  - Status: claimed                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ Verification (optional)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  VERIFIED (official status)                                  │
│                                                              │
│  - Official badge                                            │
│  - Priority in discovery                                     │
│  - University integration (future)                           │
│  - Status: verified                                          │
└─────────────────────────────────────────────────────────────┘
```

### Student-Created Spaces

Students can create spaces that don't match UBLinked data:
- Study groups
- Project teams
- Interest clusters
- Event-based (temporary)
- Friend groups

These follow the same lifecycle but start at ACTIVE (creator optional as leader).

---

## Space Structure

```
SPACE
│
├── HEADER
│   ├── Name
│   ├── Banner (if claimed)
│   ├── Category / Type
│   ├── Member count
│   └── Status badge (verified, etc.)
│
├── BOARDS (channels)
│   ├── General (auto-created)
│   └── Custom boards (leader creates, or anyone in flat governance)
│       └── Each board has:
│           ├── Messages (real-time SSE)
│           ├── Threads (nested replies)
│           ├── Reactions
│           ├── Pinned messages
│           └── Inline components (deployed tools)
│
├── SIDEBAR (40% width)
│   ├── Events widget (from space or UBLinked)
│   ├── Deployed HiveLab tools
│   ├── Member highlights
│   └── Quick actions
│
├── MEMBERS
│   ├── Roles (governance-dependent):
│   │   ├── Hierarchical: owner → admin → mod → member → guest
│   │   ├── Flat: member (all equal)
│   │   └── Emergent: contributor levels based on activity
│   └── Member list with search
│
└── SETTINGS (if claimed)
    ├── Space info (name, description, category)
    ├── Governance model
    ├── Visibility (public / private / secret)
    ├── Join mode (open / request / invite)
    └── Moderation settings
```

---

## Space Attributes

| Attribute | Options | Default |
|-----------|---------|---------|
| **Type** | uni, student, greek, residential | student |
| **Governance** | flat, emergent, hybrid, hierarchical | hybrid |
| **Visibility** | public, private, secret | public |
| **Join Mode** | open, request, invite-only | open |
| **Status** | unclaimed, active, claimed, verified | unclaimed (pre-seeded) |

---

## What Works Without a Leader

| Feature | Needs Leader? | Notes |
|---------|---------------|-------|
| Join space | No | Anyone can join public spaces |
| Chat / messages | No | Peers talking |
| Create polls | No | Anyone can ask questions |
| Add events | No | Anyone can organize |
| Create boards | Depends | Flat: yes. Hierarchical: leader only |
| Announcements | Yes | Someone must speak "officially" |
| Member removal | Yes | Requires authority |
| Space settings | Yes | Customization requires claim |
| Tool deployment (sidebar) | Yes | Leader controls shared tools |
| Tool deployment (inline) | No | Anyone can use in their messages |
| Analytics access | Yes | Leader sees engagement data |

---

## Layered Needs by Space Type

### Framework

```
CAN'T GET TODAY    ← Only HIVE provides this
NEXT               ← Anticipate before they ask
DESIRE             ← Delighters, unexpected value
WANT               ← More = better, performance
NEED               ← Table stakes, leave without this
```

---

### UNI Spaces

**WHO:** University departments, official programs, student government

**NEED:**
- Broadcast announcements that reach students
- Event promotion
- Professional appearance
- Reach students who ignore email

**WANT:**
- Engagement metrics (did they see it?)
- Easy content creation
- Targeted reach (by major, year)
- Feedback without friction

**DESIRE:**
- Real engagement, not just broadcasts
- Students actually responding
- Connection to student life pulse
- Look modern, not institutional

**NEXT:**
- AI-optimized send times
- Auto-generated content variants
- Cross-department coordination
- Student sentiment dashboard

**CAN'T GET:**
- Access to where students actually live online
- Organic reach without email/ads
- Real-time campus pulse
- Two-way relationship with students

---

### STUDENT Spaces

**WHO:** Clubs, orgs, academic groups, interest groups, project teams

**NEED:**
- Member communication that isn't muted
- Event coordination
- Basic member list
- Not another app to check

**WANT:**
- Engagement beyond announcements
- Know who's active vs. ghost
- Tools for their specific workflows
- Look professional to recruits

**DESIRE:**
- Members actually show up
- Reduced leader burnout
- New members find them organically
- Alumni connections

**NEXT:**
- AI handles routine coordination
- Cross-org collaboration tools
- Career/opportunity matching
- Leadership transition tools

**CAN'T GET:**
- Discovery (students find THEM)
- Tools built for their org type
- Integrated with campus ecosystem
- Data they actually own

---

### GREEK Spaces

**WHO:** Fraternities, sororities, Greek councils

**NEED:**
- Rush management (not spreadsheet chaos)
- Chapter communication
- Points/participation tracking
- Philanthropy hour logging

**WANT:**
- Streamlined rush pipeline
- Real participation metrics
- Social event coordination
- Brotherhood/sisterhood engagement

**DESIRE:**
- Nationals compliance without pain
- Alumni engagement that works
- Chapter health visibility
- Cross-chapter coordination

**NEXT:**
- AI rush preference matching
- Automatic chapter health scores
- Greek council integration
- Alumni mentor matching

**CAN'T GET:**
- Integrated rush-to-active pipeline
- Greek-native tools (not hacked together)
- Real chapter analytics
- Cross-org Greek ecosystem

---

### RESIDENTIAL Spaces

**WHO:** Dorms, floors, RAs, housing communities

**NEED:**
- Floor announcements that get seen
- Event coordination
- Know your neighbors
- RA communication

**WANT:**
- Actual community (not just broadcasts)
- Event sign-ups with limits
- Feedback collection
- Floor identity

**DESIRE:**
- Residents who actually engage
- RA job made easier
- Floor traditions that persist year-to-year
- Cross-floor connections

**NEXT:**
- Roommate matching
- Floor history/traditions archive
- Quiet hours coordination
- Maintenance request integration

**CAN'T GET:**
- Hyperlocal community that persists
- RA tools that actually work
- Residential life analytics
- Floor-to-floor discovery

---

## HiveLab Element System

### Current Elements (24)

**Universal (12)** — No HIVE data required:
- search-input, filter-selector, result-list
- date-picker, tag-cloud, map-view
- chart-display, form-builder, countdown-timer
- poll-element, leaderboard, notification-display

**Connected (5)** — Public HIVE data:
- event-picker (campus events)
- space-picker (space directory)
- user-selector (user search)
- rsvp-button (event signup)
- connection-list (user connections)

**Space (7)** — Private space data (leader only):
- member-list, member-selector
- space-events, space-feed, space-stats
- announcement, role-gate

### Elements Needed by Space Type

| Type | Priority Elements | Status |
|------|-------------------|--------|
| **UNI** | targeted-broadcast, engagement-tracker | Future |
| **STUDENT** | attendance-tracker, resource-library | Beta |
| **GREEK** | points-tracker, hour-logger, rush-ranker | Beta |
| **RESIDENTIAL** | floor-poll, neighbor-intro | Future |

### Element Roadmap

| Phase | Elements | Priority |
|-------|----------|----------|
| **Soft Launch** | Current 24, polished | Now |
| **Beta** | points-tracker, hour-logger, attendance-tracker | Feb 2026 |
| **Full Launch** | targeted-broadcast, resource-library | Spring 2026 |
| **Post-Launch** | AI-generated elements (RAG/RLHF) | Summer 2026 |

---

## HiveLab Templates by Space Type

### Soft Launch (10 templates)

| Template | Type | Elements Used |
|----------|------|---------------|
| **Quick Poll** | Universal | poll-element |
| **Event Signup** | Universal | form-builder, rsvp-button, countdown-timer |
| **Feedback Form** | Universal | form-builder, chart-display |
| **Meeting Scheduler** | STUDENT | poll-element, countdown-timer |
| **Recruitment Kit** | STUDENT | form-builder, member-list, announcement |
| **Rush Preference** | GREEK | poll-element (ranked), countdown-timer |
| **Chapter Points** | GREEK | leaderboard, member-list |
| **Philanthropy Logger** | GREEK | form-builder, leaderboard |
| **Floor Welcome** | RESIDENTIAL | announcement, member-list |
| **Floor Poll** | RESIDENTIAL | poll-element, member-list |

### Beta Launch (10 more)

| Template | Type | Elements Used |
|----------|------|---------------|
| **Study Group Finder** | STUDENT | form-builder, user-selector, result-list |
| **Resource Directory** | STUDENT | search-input, result-list, filter-selector |
| **Attendance Tracker** | STUDENT | member-selector, chart-display |
| **Rush Candidate Tracker** | GREEK | form-builder, member-list, role-gate |
| **Chapter Health Dashboard** | GREEK | space-stats, chart-display |
| **Study Hours Logger** | GREEK | form-builder, leaderboard |
| **Event Series** | UNI | space-events, countdown-timer, rsvp-button |
| **Feedback Collection** | UNI | form-builder, chart-display |
| **Floor Traditions** | RESIDENTIAL | announcement, form-builder |
| **Neighbor Matcher** | RESIDENTIAL | form-builder, user-selector |

---

## Data Model Updates

### Space Entity

```typescript
interface Space {
  id: string;
  campusId: string;

  // Basic info
  name: string;
  slug: string;
  description?: string;
  category: SpaceCategory;
  bannerUrl?: string;

  // Type & Governance
  spaceType: 'uni' | 'student' | 'greek' | 'residential';
  governance: 'flat' | 'emergent' | 'hybrid' | 'hierarchical';

  // Ownership (optional for unclaimed)
  ownerId?: string;
  leaders: string[];  // Can be empty

  // Status
  status: 'unclaimed' | 'active' | 'claimed' | 'verified';
  claimedAt?: Date;
  verifiedAt?: Date;

  // Settings
  visibility: 'public' | 'private' | 'secret';
  joinMode: 'open' | 'request' | 'invite';

  // Source
  source: 'ublinked' | 'user-created';
  externalId?: string;  // UBLinked ID if pre-seeded

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Member Entity

```typescript
interface SpaceMember {
  userId: string;
  spaceId: string;

  // Role (governance-dependent interpretation)
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

  // For emergent governance
  contributionScore?: number;
  contributionLevel?: 'newcomer' | 'contributor' | 'regular' | 'core';

  joinedAt: Date;
  lastActiveAt: Date;
}
```

---

## AI Generation Context

When AI generates tools, include space context:

```typescript
interface AIGenerationContext {
  spaceType: 'uni' | 'student' | 'greek' | 'residential';
  spaceCategory: string;  // e.g., "Greek Life", "Academic"
  memberCount: number;
  existingTools: string[];  // Already deployed
  recentActivity: string[];  // What's happening in space

  // User intent
  prompt: string;

  // What AI should consider
  suggestedElements: string[];  // Based on space type
  suggestedTemplates: string[];  // Relevant templates
}
```

---

## HIVE's Unfair Advantages (The Wedge)

| Advantage | How It Works |
|-----------|--------------|
| **Pre-seeded** | 400+ spaces exist before anyone signs up |
| **Campus-native** | Elements understand campus context (events, spaces, users) |
| **HiveLab** | Build exactly what you need, no code |
| **Leaderless** | Spaces work before anyone claims them |
| **Discovery** | Students find orgs, orgs find students |
| **Ownership** | Your data, your community, portable |
| **Network effects** | Value increases with campus density |

---

## Implementation Priority

### Soft Launch (Dec 2025 - Jan 2026)

**Spaces:**
- [x] Real-time chat (SSE)
- [x] Boards system
- [x] Role management
- [ ] Governance model support (flat vs hierarchical)
- [ ] Unclaimed space experience
- [ ] Space type selection on create

**HiveLab:**
- [x] 24 elements working
- [x] Visual canvas
- [x] AI generation
- [x] Deployment to sidebar
- [ ] 10 templates by type
- [ ] Undo/redo

### Beta Launch (Feb 2026)

**Spaces:**
- [ ] Emergent governance (contribution scoring)
- [ ] Space claiming flow
- [ ] Verification workflow

**HiveLab:**
- [ ] points-tracker element
- [ ] hour-logger element
- [ ] attendance-tracker element
- [ ] 10 more templates
- [ ] Template gallery by type

### Full Launch (Spring 2026)

**Spaces:**
- [ ] Cross-space discovery
- [ ] UNI-specific features
- [ ] Residential features

**HiveLab:**
- [ ] targeted-broadcast element
- [ ] resource-library element
- [ ] AI-generated elements (admin)

---

*This document is the source of truth for Spaces and HiveLab architecture. Update as decisions are made.*
