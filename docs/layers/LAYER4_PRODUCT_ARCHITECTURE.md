# Layer 4: Product Architecture

> **Status:** LOCKED
> **Finalized:** January 2026
> **Sprint:** 4
> **Depends on:** Layer 1 (Macro Bet), Layer 2 (Users), Layer 3 (Business)

---

## Philosophy

This is the system view. Not screens, not features — the underlying objects, their relationships, and how they change over time.

A well-designed product architecture means:
- Every feature maps cleanly to objects
- State changes are predictable
- The system extends without breaking
- New developers can understand the model

---

## Core Objects

### User

The person using the platform. Central identity object.

```
User
├── id: string (Firestore document ID)
├── email: string
├── name: string
├── handle: string (unique, @username)
├── avatar: string (URL)
├── campusId: string (campus isolation)
├── role: 'student' | 'faculty' | 'staff' | 'alumni'
├── status: 'active' | 'suspended' | 'deleted'
├── ghostMode: boolean (privacy feature)
├── createdAt: timestamp
├── lastActiveAt: timestamp
└── onboardingComplete: boolean
```

**Key behaviors:**
- Users belong to exactly one campus
- Users can be members of many spaces
- Users can create tools
- Users can attend events
- Handle is unique within campus

---

### Space

The container where community lives. Central organizing object.

```
Space
├── id: string
├── name: string
├── slug: string (URL-friendly)
├── description: string
├── avatar: string
├── coverImage: string
├── campusId: string
├── visibility: 'public' | 'private' | 'secret'
├── status: 'active' | 'archived' | 'suspended'
├── memberCount: number (denormalized)
├── category: string (e.g., 'Academic', 'Sports')
├── territory: string (e.g., 'Student Orgs')
├── createdAt: timestamp
├── createdBy: string (userId)
├── claimedAt: timestamp (when leader claimed pre-seeded space)
├── claimedBy: string (userId)
└── settings: SpaceSettings
```

**Key behaviors:**
- Spaces have members with roles
- Spaces contain boards (chat channels)
- Spaces can deploy tools
- Spaces host events
- Spaces can be pre-seeded (unclaimed) or claimed

---

### SpaceMember

The relationship between a user and a space. Flat collection (not subcollection).

```
SpaceMember
├── id: string (spaceId_userId composite)
├── spaceId: string
├── userId: string
├── role: 'owner' | 'admin' | 'moderator' | 'member'
├── joinedAt: timestamp
├── invitedBy: string (userId)
└── status: 'active' | 'banned' | 'left'
```

**Key behaviors:**
- One document per space-user relationship
- Role determines permissions
- Flat collection enables efficient queries

---

### Board

A chat channel within a space. Spaces have multiple boards.

```
Board
├── id: string
├── spaceId: string (parent)
├── name: string
├── type: 'general' | 'announcements' | 'questions' | 'events'
├── isDefault: boolean
├── createdAt: timestamp
└── lastMessageAt: timestamp
```

**Key behaviors:**
- Every space has at least one default board
- Boards contain messages
- Boards can be restricted by permissions

---

### ChatMessage

A message in a board. High-volume object.

```
ChatMessage
├── id: string
├── boardId: string (parent)
├── spaceId: string (for efficient queries)
├── userId: string
├── content: string
├── type: 'text' | 'image' | 'file' | 'system' | 'event_announcement'
├── replyTo: string (messageId, for threading)
├── reactions: { emoji: userIds[] }
├── createdAt: timestamp
├── editedAt: timestamp
└── deleted: boolean
```

**Key behaviors:**
- Real-time via SSE
- Threading via replyTo
- Reactions stored inline
- Soft delete (deleted flag, not removed)

---

### Event

A scheduled gathering. Atomic unit of engagement.

```
Event
├── id: string
├── spaceId: string (host space)
├── title: string
├── description: string
├── type: 'meeting' | 'social' | 'workshop' | 'sports' | 'other'
├── visibility: 'public' | 'members_only' | 'private'
├── startTime: timestamp
├── endTime: timestamp
├── location: string
├── isVirtual: boolean
├── meetingUrl: string
├── capacity: number
├── rsvpCount: number (denormalized)
├── status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
├── createdBy: string (userId)
├── createdAt: timestamp
└── hasWaitlist: boolean
```

**Key behaviors:**
- Events belong to one space
- Events can be discovered campus-wide
- RSVP creates commitment
- Capacity can be enforced

---

### RSVP

The relationship between a user and an event. Flat collection.

```
RSVP
├── id: string (eventId_userId composite)
├── eventId: string
├── userId: string
├── status: 'going' | 'maybe' | 'not_going'
├── createdAt: timestamp
└── waitlistPosition: number (if on waitlist)
```

**Key behaviors:**
- One RSVP per event-user pair
- Status can change
- Waitlist managed via position

---

### Tool

A user-created micro-application. HiveLab output.

```
Tool
├── id: string
├── name: string
├── description: string
├── creatorId: string (userId)
├── campusId: string
├── elements: CanvasElement[]
├── connections: ElementConnection[]
├── layout: 'grid' | 'flow' | 'tabs' | 'sidebar'
├── status: 'draft' | 'published' | 'archived'
├── isTemplate: boolean
├── remixedFrom: string (toolId)
├── usageCount: number (denormalized)
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Key behaviors:**
- Tools are created by users
- Tools can be deployed to spaces
- Tools can be remixed (fork)
- Templates are special tools

---

### ToolDeployment

A tool deployed to a space. The placement.

```
ToolDeployment
├── id: string
├── toolId: string
├── spaceId: string
├── deployedBy: string (userId)
├── deployedAt: timestamp
├── status: 'active' | 'disabled'
└── sharedState: object (tool-specific state)
```

**Key behaviors:**
- One tool can be deployed to many spaces
- Each deployment has its own state
- Deployed tools appear in space's tool list

---

### Post

A feed item. Currently minimal.

```
Post
├── id: string
├── authorId: string
├── campusId: string
├── spaceId: string (optional, if space-scoped)
├── content: string
├── mediaUrls: string[]
├── type: 'text' | 'image' | 'poll' | 'event_share'
├── likeCount: number
├── commentCount: number
├── createdAt: timestamp
└── visibility: 'public' | 'space_only'
```

**Key behaviors:**
- Posts can be standalone or space-scoped
- Feed aggregates posts
- Comments are subcollection

---

## Object Relationships

```
                                    ┌──────────────┐
                                    │   Campus     │
                                    │  (context)   │
                                    └──────┬───────┘
                                           │ isolates
        ┌──────────────────────────────────┼──────────────────────────────────┐
        │                                  │                                  │
        ▼                                  ▼                                  ▼
┌───────────────┐                 ┌───────────────┐                 ┌───────────────┐
│     User      │────creates────▶│     Tool      │                 │     Post      │
│   (actor)     │                 │  (creation)   │                 │   (content)   │
└───────┬───────┘                 └───────┬───────┘                 └───────────────┘
        │                                 │
        │ joins/owns                      │ deploys to
        ▼                                 ▼
┌───────────────┐                 ┌───────────────┐
│ SpaceMember   │─────────────────│ToolDeployment │
│  (relation)   │                 │  (placement)  │
└───────┬───────┘                 └───────┬───────┘
        │                                 │
        │ member of                       │ deployed in
        ▼                                 ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                    Space                                           │
│                              (community container)                                 │
└───────────────────────────────────────────────────────────────────────────────────┘
        │                                                   │
        │ contains                                          │ hosts
        ▼                                                   ▼
┌───────────────┐                                   ┌───────────────┐
│     Board     │                                   │     Event     │
│   (channel)   │                                   │  (gathering)  │
└───────┬───────┘                                   └───────┬───────┘
        │                                                   │
        │ contains                                          │ receives
        ▼                                                   ▼
┌───────────────┐                                   ┌───────────────┐
│  ChatMessage  │                                   │     RSVP      │
│  (message)    │                                   │   (intent)    │
└───────────────┘                                   └───────────────┘
```

---

## State Machines

### User Lifecycle

```
                    ┌─────────────────────────────────────────────────┐
                    │                                                 │
                    ▼                                                 │
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  None   │───▶│ Landing │───▶│  Entry  │───▶│Onboard- │───▶│ Active  │
│         │    │         │    │ (OTP)   │    │  ing    │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                                  │
                    ┌─────────────────────────────────────────────┤
                    │                                             │
                    ▼                                             ▼
            ┌─────────────┐                               ┌─────────────┐
            │  Suspended  │                               │   Churned   │
            │             │                               │ (inactive)  │
            └─────────────┘                               └─────────────┘
```

**State definitions:**
- **None:** Not registered
- **Landing:** Viewing marketing, not authenticated
- **Entry:** In OTP flow
- **Onboarding:** Authenticated, completing profile
- **Active:** Fully onboarded, using product
- **Suspended:** Admin action, cannot access
- **Churned:** Hasn't returned in 30+ days

**Key transitions:**
- Landing → Entry: Clicks "Enter"
- Entry → Onboarding: Verifies OTP
- Onboarding → Active: Completes wizard
- Active → Churned: 30 days inactive
- Churned → Active: Returns to product

---

### Space Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Pre-seeded │───▶│   Claimed   │───▶│   Active    │
│  (empty)    │    │  (leader)   │    │ (engaged)   │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                  │                  │
                          ▼                  ▼                  ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │   Quiet     │    │   Dying     │    │  Archived   │
                   │ (dormant)   │    │ (declining) │    │  (closed)   │
                   └─────────────┘    └─────────────┘    └─────────────┘
```

**State definitions:**
- **Pre-seeded:** Space exists, no leader has claimed it
- **Claimed:** Leader has claimed, may be setting up
- **Active:** Regular activity (messages, events, tools)
- **Quiet:** Low activity, not necessarily declining
- **Dying:** Declining activity, may need intervention
- **Archived:** Intentionally closed, history preserved

**Key transitions:**
- Pre-seeded → Claimed: Leader clicks "Claim"
- Claimed → Active: First message, event, or tool deployed
- Active → Quiet: No activity for 7 days
- Quiet → Dying: No activity for 30 days
- Dying → Active: Activity resumes
- Any → Archived: Leader explicitly archives

**Activity signals:**
- New message in any board
- New event created
- Tool deployed or used
- New member joined

---

### Event Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Draft     │───▶│  Published  │───▶│   Ongoing   │───▶│  Completed  │
│             │    │ (upcoming)  │    │             │    │             │
└─────────────┘    └──────┬──────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Cancelled  │
                   └─────────────┘
```

**State definitions:**
- **Draft:** Created but not visible
- **Published:** Visible, accepting RSVPs
- **Ongoing:** Start time has passed, end time hasn't
- **Completed:** End time has passed
- **Cancelled:** Organizer cancelled

**Key transitions:**
- Draft → Published: Organizer publishes
- Published → Ongoing: Start time reached
- Ongoing → Completed: End time reached
- Published → Cancelled: Organizer cancels
- Ongoing → Cancelled: Organizer cancels (rare)

---

### Tool Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Draft    │───▶│  Published  │───▶│   Popular   │
│             │    │             │    │ (trending)  │
└──────┬──────┘    └──────┬──────┘    └─────────────┘
       │                  │
       │                  ▼
       │           ┌─────────────┐
       └──────────▶│  Archived   │
                   └─────────────┘
```

**State definitions:**
- **Draft:** Being built, not deployable
- **Published:** Can be deployed to spaces
- **Popular:** High usage, featured in discovery
- **Archived:** No longer maintained

---

## Data Flow

### Read Flow (Page Load)

```
User lands on /spaces/[spaceId]
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Route                                 │
│  1. Auth middleware (verify JWT)                                │
│  2. Campus middleware (extract campusId)                        │
│  3. Load space (with campusId filter)                           │
│  4. Check membership (user is member?)                          │
│  5. Load boards (filtered by permissions)                       │
│  6. Load recent messages (last 50)                              │
│  7. Load deployed tools                                         │
│  8. Return composite response                                   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        React Component                           │
│  1. Render space header                                         │
│  2. Render board tabs                                           │
│  3. Render message list                                         │
│  4. Render tool sidebar                                         │
│  5. Establish SSE connection for real-time                      │
└─────────────────────────────────────────────────────────────────┘
```

### Write Flow (Send Message)

```
User types message, clicks send
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        React Component                           │
│  1. Optimistic update (show message immediately)                │
│  2. POST to /api/spaces/[spaceId]/boards/[boardId]/messages     │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Route                                 │
│  1. Auth middleware                                             │
│  2. Validate request body (Zod schema)                          │
│  3. Check user is space member                                  │
│  4. Create ChatMessage document                                 │
│  5. Update Board.lastMessageAt                                  │
│  6. Emit domain event (MessageSent)                             │
│  7. Return message with server ID                               │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SSE Broadcast                             │
│  1. Message event pushed to all connected clients               │
│  2. Clients receive and update local state                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feedback Loops

### Engagement Loop
```
User posts message → Other users react → Reactions notify user → User posts more
```

### Discovery Loop
```
User finds space via browse → User joins → Space member count increases → Space ranks higher in browse → More users find space
```

### Tool Adoption Loop
```
Creator builds tool → Deploys to space → Members use → Usage count increases → Tool appears in templates → More creators remix → Tool ecosystem grows
```

### Event Network Loop
```
Space hosts event → Members RSVP → Event appears in member calendars → Members attend → Members meet people from other spaces → Members join more spaces → More spaces host events
```

---

## Technical Patterns

### Campus Isolation
Every query includes `campusId`. No exceptions.

```typescript
// Good
const spaces = await db.collection('spaces')
  .where('campusId', '==', user.campusId)
  .get();

// Bad - never do this
const spaces = await db.collection('spaces').get();
```

### Denormalization
Counters are stored on parent documents to avoid aggregation queries.

```typescript
// Space document has memberCount
// When member joins:
await db.doc(`spaces/${spaceId}`).update({
  memberCount: FieldValue.increment(1)
});
```

### Flat Collections
SpaceMember and RSVP use composite IDs to enable efficient queries.

```typescript
// SpaceMember document ID
const memberId = `${spaceId}_${userId}`;

// Query all spaces for a user
const memberships = await db.collection('spaceMembers')
  .where('userId', '==', userId)
  .get();
```

### Domain Events
State changes emit events that can trigger side effects.

```typescript
// In domain logic
space.claim(userId);
// Emits: SpaceClaimedEvent

// Event handler can:
// - Send welcome email
// - Create default board
// - Log analytics
```

---

## What This Means for Features

| Feature Request | Objects Affected | State Changes |
|-----------------|------------------|---------------|
| Create event | Event, Space | Event: Draft → Published |
| RSVP to event | RSVP, Event | Event.rsvpCount increments |
| Send message | ChatMessage, Board | Board.lastMessageAt updates |
| Deploy tool | ToolDeployment, Space | Creates deployment doc |
| Join space | SpaceMember, Space | Space.memberCount increments |
| Claim space | Space, SpaceMember | Space: Pre-seeded → Claimed |

Every feature traces to objects and state changes. If a feature can't be expressed in terms of existing objects, we need a new object. If a feature requires a state that doesn't exist, we need to extend the state machine.

---

*This document is the product blueprint. Every screen, every interaction, every API traces back to these objects and transitions.*
