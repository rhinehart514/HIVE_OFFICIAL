# HIVE Product Strategy & Roadmap

**Last Updated:** December 2025
**Purpose:** Complete product taxonomy, feature topology, and prioritized backlog

---

## Table of Contents

1. [Strategic Direction](#strategic-direction)
2. [Product Taxonomy](#product-taxonomy)
3. [Feature Topology](#feature-topology)
4. [Critical Gap Analysis](#critical-gap-analysis)
5. [Winter Feature Specs](#winter-feature-specs)
6. [Winter vs Spring Scope](#winter-vs-spring-scope)
7. [Prioritized Backlog](#prioritized-backlog)
8. [Implementation Schedule](#implementation-schedule)

---

## Strategic Direction

### The Bet

**Go deep on Spaces first.** If Spaces doesn't feel valuable on its own, HiveLab is a feature nobody discovers.

```
LAYER 4: INTELLIGENCE (Spring+)
└── Depends on: Density in Layer 1-3

LAYER 3: CREATION (HiveLab)
└── Depends on: Leaders using Spaces daily

LAYER 2: COMMUNITY (Spaces)  ◀── WINTER FOCUS
└── Depends on: Profiles exist, can join

LAYER 1: IDENTITY (Profiles)
└── Foundation - everything builds on this
```

### The Dependency Chain

```
Profile exists
    └──▶ Can join Spaces
            └──▶ Leader sees value in Space
                    └──▶ Leader wants to customize
                            └──▶ Opens HiveLab
                                    └──▶ Deploys tool
                                            └──▶ Members interact
                                                    └──▶ Data for AI layer
```

**You can't skip layers.** A leader won't touch HiveLab until their Space feels alive.

---

## Product Taxonomy

```
HIVE PLATFORM
│
├── VERTICAL 1: IDENTITY (Profiles)
│   ├── 1.1 Authentication
│   ├── 1.2 Onboarding
│   ├── 1.3 Profile Data
│   ├── 1.4 Privacy & Visibility
│   ├── 1.5 Connections (Social Graph)
│   └── 1.6 Presence
│
├── VERTICAL 2: COMMUNITY (Spaces)
│   ├── 2.1 Space Management
│   ├── 2.2 Chat System
│   ├── 2.3 Board System
│   ├── 2.4 Member System
│   ├── 2.5 Events
│   ├── 2.6 Sidebar & Widgets
│   ├── 2.7 Discovery
│   ├── 2.8 Moderation
│   └── 2.9 Analytics
│
├── VERTICAL 3: CREATION (HiveLab)
│   ├── 3.1 Tool Composition
│   ├── 3.2 Element System
│   ├── 3.3 AI Generation
│   ├── 3.4 Deployment
│   ├── 3.5 State Management
│   ├── 3.6 Templates
│   ├── 3.7 Tool Analytics
│   └── 3.8 Visual Canvas (IDE)
│
├── VERTICAL 4: INTELLIGENCE (AI Layer)
│   ├── 4.1 Catch-up / Summary
│   ├── 4.2 Recommendations
│   ├── 4.3 Intent Detection
│   └── 4.4 Cross-space Insights
│
└── VERTICAL 5: ENGAGEMENT (Feed & Notifications)
    ├── 5.1 Feed Algorithm
    ├── 5.2 Notifications (In-app)
    ├── 5.3 Push Notifications
    └── 5.4 Email Digests
```

---

## Feature Topology

### VERTICAL 1: IDENTITY (Profiles)

| Feature | Sub-feature | Status | Winter? |
|---------|-------------|--------|---------|
| **1.1 Authentication** | OTP Code Flow | ✅ Done | |
| | Magic Link Flow | ✅ Done | |
| | Session Management | ✅ Done | |
| | Multi-device Sessions | ⚠️ Basic | |
| **1.2 Onboarding** | 4-Step Flow | ✅ Done | |
| | Handle Availability | ⚠️ Not real-time | FIX |
| | Photo Upload | ⚠️ Flaky (10% fail) | **FIX** |
| **1.3 Profile Data** | Personal Info | ✅ Done | |
| | Academic Info | ✅ Done | |
| | Social Info | ✅ Done | |
| | Activity Score | ⚠️ Not calculated | |
| **1.4 Privacy** | Visibility Settings | ✅ Done | |
| | Ghost Mode | ❌ Not wired | DEFER |
| **1.5 Connections** | Basic Requests | ⚠️ Basic | |
| | Suggestions | ❌ Not implemented | DEFER |
| **1.6 Presence** | Online Status | ❌ Not implemented | DEFER |

### VERTICAL 2: COMMUNITY (Spaces)

| Feature | Sub-feature | Status | Winter? |
|---------|-------------|--------|---------|
| **2.1 Space Management** | CRUD | ✅ Done | |
| | Settings | ✅ Done | |
| | Archive | ❌ None | DEFER |
| **2.2 Chat System** | Real-time SSE | ✅ Done | |
| | Threading | ✅ Done | |
| | Reactions | ✅ Done | |
| | Mentions | ✅ Done | |
| | Pinned Messages | ✅ Done | |
| | **Unread Tracking** | ❌ **NOT IMPLEMENTED** | **BUILD** |
| | **Unread Badges** | ❌ **NOT IMPLEMENTED** | **BUILD** |
| | **New Message Divider** | ❌ **NOT IMPLEMENTED** | **BUILD** |
| | Typing Indicators | ❌ Broken | DEFER |
| | Message Search | ⚠️ Basic | |
| **2.3 Board System** | CRUD | ✅ Done | |
| | Tab Navigation | ✅ Done | |
| | Tab Overflow (mobile) | ⚠️ Rough | **FIX** |
| | Reorder Tabs | ❌ None | DEFER |
| **2.4 Member System** | Roles | ✅ Done | |
| | Invite/Remove | ✅ Done | |
| | Online Status | ❌ None | DEFER |
| **2.5 Events** | CRUD | ✅ Done | |
| | RSVP | ✅ Done | |
| | Reminders | ❌ None | DEFER |
| **2.6 Sidebar** | 60/40 Layout | ✅ Done | |
| | Mobile Drawer | ⚠️ Janky | **FIX** |
| | HiveLab Tools | ✅ Done | |
| **2.7 Discovery** | Browse/Search | ✅ Done | |
| | Trending | ❌ None | DEFER |
| **2.8 Moderation** | Delete Message | ✅ Done | |
| | Moderation Queue | ❌ None | DEFER |
| | Ban/Mute | ❌ None | DEFER |
| **2.9 Analytics** | **All Metrics** | ❌ **MOCK DATA** | **BUILD** |

### VERTICAL 3: CREATION (HiveLab)

| Feature | Sub-feature | Status | Winter? |
|---------|-------------|--------|---------|
| **3.1 Tool Composition** | CRUD | ✅ Done | |
| **3.2 Element System** | 27 Elements | ✅ Done | |
| | Element Rendering | ✅ Done | |
| | Data Flow | ⚠️ Basic | |
| **3.3 AI Generation** | Natural Language | ✅ Done | |
| | Streaming | ✅ Done | |
| | Iteration | ❌ None | DEFER |
| **3.4 Deployment** | Sidebar | ✅ Done | |
| | Inline | ✅ Done | |
| | Preview | ❌ None | DEFER |
| **3.5 State Management** | Persistence | ✅ Done | |
| | Real-time Sync | ✅ Done | |
| **3.6 Templates** | **Library** | ⚠️ **Only 3** | **BUILD 7 MORE** |
| | Marketplace | ❌ None | DEFER |
| **3.7 Tool Analytics** | All Metrics | ❌ Mock | DEFER |
| **3.8 Visual Canvas** | Drag-and-Drop | ✅ Done | |
| | Undo/Redo | ❌ None | DEFER |
| | Copy/Paste | ❌ None | DEFER |

### VERTICAL 4: INTELLIGENCE

| Feature | Status | Winter? |
|---------|--------|---------|
| AI Catch-up | ❌ Not started | DEFER |
| Recommendations | ⚠️ Basic interests only | DEFER |
| Intent Detection | ⚠️ Basic | DEFER |
| Cross-space Insights | ❌ None | DEFER |

### VERTICAL 5: ENGAGEMENT

| Feature | Status | Winter? |
|---------|--------|---------|
| Feed | ✅ Working | |
| In-app Notifications | ⚠️ Basic | |
| Push Notifications | ❌ Not implemented | DEFER |
| Email Digests | ❌ Not implemented | DEFER |

---

## Critical Gap Analysis

| Vertical | Critical Gap | Impact | Winter Action |
|----------|--------------|--------|---------------|
| **Profiles** | Photo upload 10% fail | Onboarding friction | **FIX** |
| **Profiles** | Ghost mode unwired | Privacy promise broken | DEFER |
| **Spaces** | Unread indicators missing | No reason to return | **BUILD** |
| **Spaces** | Analytics mock data | Leader trust dies | **BUILD** |
| **Spaces** | Typing indicator broken | Space feels dead | DEFER (disable) |
| **Spaces** | Mobile sidebar janky | Bad mobile UX | **FIX** |
| **HiveLab** | Only 3 templates | Low discoverability | **BUILD 7 MORE** |
| **HiveLab** | No undo/redo | Creator frustration | DEFER |
| **HiveLab** | Analytics mock | Same as Spaces | DEFER |
| **Intelligence** | Nothing built | Not for Winter | DEFER |
| **Engagement** | No push notifications | No re-engagement | DEFER |

---

## Winter Feature Specs

### SPEC 1: Unread Indicators

**Problem:** Users open HIVE after 2 days. No idea what's new.

**Data Model:**
```typescript
// Collection: users/{userId}/readState/{spaceId_boardId}
interface ReadState {
  odId: string;
  spaceId: string;
  boardId: string;
  lastReadMessageId: string;
  lastReadAt: Timestamp;
  unreadCount: number;
}
```

**UI Components:**
1. Space list badge: `CS Club (12)`
2. Board tab badges: `[General (8)] [Events (3)]`
3. New message divider: `--- NEW MESSAGES ---`

**Effort:** 2-3 days

---

### SPEC 2: Real Analytics

**Problem:** Leaders see fake data. Trust evaporates.

**Data Model:**
```typescript
// Collection: spaces/{spaceId}/analytics/{period}
interface SpaceAnalytics {
  period: string;           // "2025-12-23" or "2025-W52"
  periodType: 'daily' | 'weekly';
  messageCount: number;
  uniqueAuthors: number;
  reactionCount: number;
  activeMembers: string[];
  topContributors: Array<{ odId: string; messageCount: number }>;
  messagesByHour: Record<number, number>;
}
```

**Queries:**
- Messages per day (last 7 days)
- Unique authors
- Top contributors

**Effort:** 2-3 days

---

### SPEC 3: HiveLab Templates (7 More)

| Template | Elements | Use Case |
|----------|----------|----------|
| Quick Poll | poll-element | Fast decisions |
| Event Signup | form + rsvp + countdown | Registration |
| Weekly Check-in | form + timer + notification | Recurring engagement |
| Leaderboard | leaderboard + counter | Gamification |
| Study Timer | timer + leaderboard | Group study |
| Resource Directory | search + filter + result-list | Curated links |
| Feedback Form | form + chart | Collecting opinions |

**Effort:** 2 days

---

### SPEC 4: Photo Upload Fix

**Problem:** 10% of uploads fail. Breaks onboarding.

**Solution:**
1. Client-side resize (500x500 max, 80% quality)
2. Retry logic (3 attempts with exponential backoff)
3. Better error messages
4. Allow skip in onboarding

**Effort:** 1 day

---

### SPEC 5: Mobile Polish

**Fixes:**
1. Sidebar drawer animation (CSS transitions)
2. Board tabs overflow (horizontal scroll)
3. Touch targets (min 44x44px)
4. Keyboard handling (viewport meta)

**Effort:** 1-2 days

---

## Winter vs Spring Scope

### Winter 2025-26 (December - January)

**MUST SHIP:**
- ✓ Unread indicators (badges + divider)
- ✓ Real analytics (not mock)
- ✓ 10 HiveLab templates
- ✓ Photo upload fix
- ✓ Mobile polish

**EXPLICITLY OFF:**
- ✗ Typing indicators (disable)
- ✗ Push notifications
- ✗ Email digests
- ✗ Ghost mode
- ✗ Moderation queue
- ✗ Undo/redo in HiveLab
- ✗ AI catch-up

---

### Spring 2026

**February - Re-engagement:**
- Push notifications (FCM)
- Typing indicators (RTDB rewrite)
- Event reminders

**March - Leader Tools:**
- Moderation queue
- Ban/mute user
- Scheduled messages
- Announcement system

**April - HiveLab v2:**
- Undo/redo
- Copy/paste
- Template marketplace
- Real tool analytics

**May - Intelligence:**
- AI catch-up summary
- Connection suggestions
- Trending spaces
- Email digests

---

## Prioritized Backlog

### Priority 0: Winter Blockers

| ID | Feature | Effort | Status |
|----|---------|--------|--------|
| W-001 | Unread indicators | 3 days | Not started |
| W-002 | Real analytics | 3 days | Not started |
| W-003 | HiveLab templates (7) | 2 days | Not started |
| W-004 | Photo upload fix | 1 day | Not started |
| W-005 | Mobile polish | 2 days | Not started |

### Priority 1: Winter Nice-to-Have

| ID | Feature | Effort | Status |
|----|---------|--------|--------|
| W-006 | Handle real-time check | 0.5 day | Not started |
| W-007 | Onboarding polish | 1 day | Not started |
| W-008 | Space empty states | 0.5 day | Not started |
| W-009 | Error message cleanup | 0.5 day | Not started |
| W-010 | Loading skeletons | 1 day | Not started |

### Priority 2: Spring - Re-engagement (February)

| ID | Feature | Effort |
|----|---------|--------|
| S-001 | Push notifications | 5 days |
| S-002 | Typing indicators (RTDB) | 2 days |
| S-003 | Event reminders | 2 days |

### Priority 3: Spring - Leader Tools (March)

| ID | Feature | Effort |
|----|---------|--------|
| S-004 | Moderation queue | 3 days |
| S-005 | Ban/mute user | 2 days |
| S-006 | Scheduled messages | 3 days |
| S-007 | Announcement system | 2 days |
| S-008 | Member export | 1 day |

### Priority 4: Spring - HiveLab v2 (April)

| ID | Feature | Effort |
|----|---------|--------|
| S-009 | Undo/redo | 3 days |
| S-010 | Copy/paste elements | 2 days |
| S-011 | Template marketplace | 5 days |
| S-012 | Tool analytics (real) | 3 days |
| S-013 | Form export | 2 days |

### Priority 5: Spring - Intelligence (May)

| ID | Feature | Effort |
|----|---------|--------|
| S-014 | AI catch-up summary | 5 days |
| S-015 | Connection suggestions | 3 days |
| S-016 | Trending spaces | 2 days |
| S-017 | Email digests | 3 days |

---

## Implementation Schedule

### Week of December 23-29

| Day | Focus | Tasks |
|-----|-------|-------|
| **Dec 23-24** | Unread Indicators | ReadState entity, badges, divider |
| **Dec 24-25** | Real Analytics | Service, queries, dashboard |
| **Dec 25-26** | HiveLab Templates | 7 new templates, thumbnails |
| **Dec 26-27** | Photo + Mobile | Retry logic, CSS fixes |
| **Dec 27-28** | Testing | E2E flows, bug fixes |
| **Dec 28-29** | Pre-Launch | Staging review, monitoring |

### Week of December 30 - January 5

| Day | Focus | Tasks |
|-----|-------|-------|
| **Dec 30-31** | Soft Launch Prep | Seed spaces, invite leaders |
| **Jan 1-2** | Launch | Monitor, support, hotfixes |
| **Jan 3-5** | Iterate | Collect feedback, fix issues |

---

*This document is the source of truth for product strategy. Update as priorities evolve.*
