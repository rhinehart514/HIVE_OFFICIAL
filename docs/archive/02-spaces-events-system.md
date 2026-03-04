# 02: Spaces & Events System

The organizational backbone and the primary content type. Everything on HIVE revolves around spaces (where students belong) and events (what students do).

---

## 1. Space Architecture

### 1.1 What IS a Space in 2026?

A space is a living room, not a bulletin board. It's the digital home of any organized group of students -- from a 200-member engineering club to five friends who study together on Thursdays.

The right metaphor varies by context:

| Student type | What a space feels like to them |
|---|---|
| Freshman browsing | A club fair booth -- preview what it's about, see who's there, decide to step in |
| Active member | A group chat home screen -- what's happening, who's online, what's next |
| Club president | A mission control dashboard -- events, members, analytics, one-click actions |
| Commuter | A schedule augmentation layer -- events that fit my gaps, spaces near my route |

A space is NOT a website, a forum, a channel, or a page. It's a persistent context that organizes people around shared purpose and surfaces what matters based on who you are and when you're looking.

### 1.2 Space Types

Four types, each with distinct defaults and AI context:

| Type | Code | Default Governance | Examples |
|---|---|---|---|
| Student Organization | `student` | `hybrid` | Clubs, interest groups, project teams, sports clubs |
| University Entity | `uni` | `hierarchical` | Departments, programs, student government, career center |
| Greek Life | `greek` | `hierarchical` | Fraternities, sororities, councils |
| Residential | `residential` | `flat` | Dorms, floors, housing communities |

**Existing code**: `SpaceType` in `packages/core/src/domain/spaces/aggregates/enhanced-space.ts:60` defines these four types. The `getDefaultGovernance()` function at line 143 maps type to governance model.

**Decision**: For launch, default ALL spaces to `hierarchical` governance regardless of type. The governance model selection adds cognitive load with no user demand. Revisit post-launch when there's signal that flat or emergent governance serves real needs.

### 1.3 Space Lifecycle

The unified lifecycle state machine (ADR-007) consolidates three legacy fields (`status`, `publishStatus`, `activationStatus`) into a single enum:

```
SEEDED --> CLAIMED --> PENDING --> LIVE --> SUSPENDED --> ARCHIVED
                  \                   \
                   --> LIVE             --> ARCHIVED
```

| State | Meaning | Visibility | Features |
|---|---|---|---|
| `SEEDED` | Pre-seeded from UBLinked, no owner | Visible in browse with "Unclaimed" badge | Browse, waitlist, join as member |
| `CLAIMED` | Owner assigned, setting up (stealth mode) | Visible only to leaders and provisional members | Full features for leader, setup checklist |
| `PENDING` | Awaiting admin verification or quorum | Visible to members, not in public browse | All member features active |
| `LIVE` | Active, verified, fully operational | Fully public, discoverable | Everything |
| `SUSPENDED` | Admin action (violation, investigation) | Hidden from browse, accessible to existing members | Read-only |
| `ARCHIVED` | Permanently inactive | Hidden everywhere | None (terminal state) |

**Existing code**: `SpaceLifecycleState` enum at line 113, `VALID_LIFECYCLE_TRANSITIONS` map at line 131, `transitionTo()` method at line 753, and `computeLifecycleState()` at line 712 for backwards compatibility with legacy fields.

**Key decision -- claim-to-live shortcut**: For the launch cohort of 20-30 leaders, claimed spaces should go LIVE immediately upon admin verification via the go-live endpoint (`POST /api/spaces/[spaceId]/go-live`). No PENDING state for pre-seeded spaces. The PENDING state serves user-created spaces that need moderation review.

### 1.4 Privacy & Visibility

| Setting | Default | Who sees what |
|---|---|---|
| `visibility: 'public'` | Default for all types except Greek | Anyone on campus can browse, search, see events |
| `visibility: 'private'` | Default for Greek Life | Only members see content; space appears in browse with limited info |
| Join policy: `open` | Default | Anyone joins instantly |
| Join policy: `approval` | Greek, Research | Request to join, leader approves |
| Join policy: `invite_only` | - | Only via invite link/code |

**Privacy invariant**: All queries filter by `campusId` from session (never from client). Cross-campus access is impossible by architecture.

**Existing code**: `SpaceSettings` interface at line 223 controls `allowInvites`, `requireApproval`, `allowRSS`, `maxMembers`, `isPublic`. Template settings in `packages/core/src/domain/spaces/templates/index.ts` pre-configure these per template type.

### 1.5 The Quorum Question: Redesign for Launch

**Current system**: `ActivationStatus` (ghost/gathering/open) with `DEFAULT_ACTIVATION_THRESHOLD = 10`. Below threshold, chat is locked. Founding members get special recognition.

**Audit verdict (from `docs/strategy/spaces-audit-alignment.md`)**: KILL for launch. The 10-member gate blocks leader adoption during the critical 21-day pre-launch window. A president claims their club and can't use chat because they only have 3 e-board members.

**Spec decision**:
- Set `DEFAULT_ACTIVATION_THRESHOLD = 1` for all claimed spaces. Any claimed space is fully functional from moment of claim.
- Keep quorum UX for *unclaimed* user-created spaces post-launch: the "gathering" concept (showing progress toward community formation) has value for organic spaces without designated leaders.
- Keep the `CommunityStage` framing in `SpaceHub.tsx` (line 68-92) -- "Founding Team" / "Growing" / "Established" labels are positive reframes of low counts, not feature gates.

**What stays**: The SpaceHub component's community stage labels (founding < 10, growing < 50, established 50+) continue to provide social framing. The `isFoundingMember` flag on `SpaceMember` (line 166) stays for recognition.

**What changes**: Chat, events, tools, and all features are available from member count = 1 for claimed spaces. The `canChat` getter (line 522) already handles this: it returns `true` when `isClaimed`.

### 1.6 Data Model

**Firestore Collections**:

```
/spaces/{spaceId}
  - name, slug, description, category
  - campusId (campus isolation)
  - spaceType: 'student' | 'uni' | 'greek' | 'residential'
  - governance: 'flat' | 'emergent' | 'hybrid' | 'hierarchical'
  - status: 'unclaimed' | 'active' | 'claimed' | 'verified'
  - source: 'ublinked' | 'user-created'
  - publishStatus: 'stealth' | 'live' | 'rejected'
  - lifecycleState: 'seeded' | 'claimed' | 'pending' | 'live' | 'suspended' | 'archived'
  - activationStatus: 'ghost' | 'gathering' | 'open'
  - activationThreshold: number (default 10, set to 1 for claimed)
  - visibility: 'public' | 'private'
  - settings: { allowInvites, requireApproval, allowRSS, maxMembers, isPublic }
  - identityType: 'major' | 'residence' | 'interest' | 'community'
  - iconURL, coverImageURL
  - leaderRequests: LeaderRequest[]
  - setupProgress: SetupProgress
  - socialLinks, email, contactName, orgTypeName, foundedDate, sourceUrl
  - trendingScore, postCount, lastActivityAt
  - createdAt, updatedAt, claimedAt, wentLiveAt, activatedAt

/spaceMembers/{spaceId}_{userId}
  - spaceId, userId, campusId
  - role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'
  - joinedAt, isActive, permissions[], joinMethod, isProvisional
  - isFoundingMember: boolean

/events/{eventId}  (flat collection for cross-space queries)
  - spaceId, campusId, organizerId
  - title, description, type, tags
  - startDate, endDate, location, virtualLink
  - maxAttendees, rsvpDeadline, requiredRSVP
  - isRecurring, recurrenceRule
  - status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  - attendeeCount, rsvpCount
  - cost, currency, imageUrl, isFeatured, isPrivate
  - createdAt, updatedAt

/rsvps/{eventId}_{userId}
  - eventId, userId, spaceId, campusId
  - status: 'going' | 'maybe' | 'not_going'
  - createdAt, updatedAt

/builderRequests/{requestId}
  - type: 'claim', spaceId, spaceName, userId, role, proofType, proofUrl
  - status: 'pending' | 'approved' | 'rejected'
  - provisionalAccessGranted, submittedAt, expiresAt

/spaceWaitlists/{docId}
  - spaceId, userId, campusId, notified, notifiedAt
```

**Key design choices**:
- Events in flat collection (not subcollection under spaces) enables cross-space temporal queries -- the single most important query for the commuter dashboard.
- RSVPs use composite key `{eventId}_{userId}` for efficient lookup and idempotent writes.
- SpaceMembers use composite key `{spaceId}_{userId}` for the same reasons.

---

## 2. Space Creation & Claiming

### 2.1 New Space Creation Flow

**Who**: Any verified student. No approval needed to create (approval comes via moderation queue for go-live).

**Existing code**: `SpaceCreationModal` in `apps/web/src/components/spaces/SpaceCreationModal.tsx` implements a 3-step wizard.

**The Flow (Step by Step)**:

```
Step 1: TEMPLATE — "What are you building?"
  - 4 options: Club/Organization, Study Group, Interest Group, Project Team
  - Each is a button card with icon + description
  - Tap selects and auto-advances to Step 2
  - AI HOOK: After selection, AI pre-generates suggested description and tags based on template type

Step 2: IDENTITY — "Name your space"
  - Name input (required, 1-200 chars)
  - Handle input with dramatic availability check (useDramaticHandleCheck hook)
    - Real-time availability check against /api/handles/check
    - Gold reveal animation when handle is available ("It's yours.")
  - AI HOOK: As user types name, AI suggests:
    - Description (pre-filled, editable)
    - Tags (3-5 relevant tags)
    - Category classification
  - Validation: Name uniqueness on campus, handle availability, profanity filter

Step 3: ACCESS — "Who can join?"
  - Three options: Open (default), Approval, Invite Only
  - Each option has icon + one-line description
  - Default: Open

Step 4: LAUNCH — "Your space is live."
  - Space created via POST /api/spaces
  - Loading state with anticipation animation
  - Success: Gold reveal "Your space is live" with CTA to enter
  - Redirects to /s/{slug} on "Enter Space"
```

**API**: `POST /api/spaces` creates the space, sets lifecycle to CLAIMED/STEALTH, adds creator as owner, deploys template.

**AI Integration Points**:
- **Smart defaults**: AI generates description, tags, suggested meeting times based on similar spaces on campus. Must appear within 500ms.
- **Name suggestions**: If the student types "photo," AI suggests "Photography Club," "Photo Enthusiasts," "Shutterbugs" -- real names, not generic.
- **Category inference**: AI classifies space type from name and template, sets appropriate defaults.

**Edge Cases**:
- Duplicate name on same campus: Warn but allow (handle must be unique, name can overlap).
- Profanity in name/description: SecurityScanner blocks at API level (existing at `apps/web/src/app/api/spaces/[spaceId]/events/route.ts:317`).
- Creator loses connection mid-create: Form state persists locally (offline-aware per 2026 standards), retry on reconnect.

### 2.2 Claiming Pre-Seeded UBLinked Spaces

**Who**: Student leaders who are officers of existing UB organizations imported from CampusLabs/UBLinked.

**Existing code**: Fully built at `apps/web/src/app/api/spaces/claim/route.ts` and `apps/web/src/components/spaces/SpaceClaimModal.tsx`.

**The Flow**:

```
Step 1: SEARCH — Find your organization
  - Search input with debounced query (300ms)
  - Queries /api/spaces/search?q={query}&unclaimed=true
  - Results show: name, category badge, member count, claim status
  - Residential spaces show "RA Only" lock (LOCKED_CATEGORIES)
  - Already-claimed spaces show "Claimed" badge (non-interactive)

Step 2: CONFIRM — Claim your role
  - Selected space details displayed
  - Role dropdown: President, VP, Treasurer, Secretary, Board Member, Advisor, Other
  - If "Other": custom role text input
  - Optional proof upload (email, document, social link, referral)
  - Submit button

Step 3: SUCCESS — "It's yours."
  - 600ms anticipation pause (dramatic timing per DRAMA.md)
  - Gold reveal animation with ThresholdReveal + WordReveal
  - Toast: "Your space is live! You're now the admin of {name}"
  - CTA: "Enter Your Space" -> redirects to /s/{slug}
  - Sets localStorage flag for onboarding banner
```

**What happens on claim** (from the API):
1. DDD SpaceRepository loads space, validates unclaimed status
2. Campus isolation check
3. Checks for existing pending claims (conflict prevention)
4. Calls `space.submitClaimRequest()` on the aggregate
5. Creates `builderRequests` record for admin queue
6. Adds user as `spaceMembers` with role: 'owner', joinMethod: 'claim', isProvisional: true
7. Auto-deploys template tools to sidebar based on category (`getSystemTemplateForCategory`)
8. Notifies waitlist members ("Photography Club now has a leader!")
9. Returns provisional access immediately

**Verification**: Admin reviews claim within 7 days via admin dashboard. Calls `POST /api/spaces/[spaceId]/go-live` which uses `SpaceManagementService.verifyAndGoLive()`. Space transitions from STEALTH to LIVE, becomes publicly discoverable.

**Key design**: Provisional access is immediate. The leader can start posting events, customizing the space, and inviting members before admin verification. The verification step prevents impersonation but doesn't block productivity.

### 2.3 Leader Onboarding (First 10 Minutes)

After claiming or creating a space, the leader lands on their space page. The first session must accomplish:

**Setup Progress Tracking**: `SetupProgress` interface (line 206 in enhanced-space.ts) tracks:
- `welcomeMessagePosted` -- Has leader sent a first message?
- `firstToolDeployed` -- Has a tool been activated?
- `coLeaderInvited` -- Has another admin been added?
- `minimumMembersTarget` -- Target member count
- `isComplete` -- All steps done?

**Existing UI**: `LeaderSetupProgress` component in `packages/ui/src/design-system/components/spaces/LeaderSetupProgress.tsx` renders a sidebar widget with progress bar and checklist.

**Leader's First 10 Minutes**:

```
Minute 0-1: LAND
  - Space hub loads with their space identity (icon, name, category)
  - Setup progress widget appears in sidebar (not modal -- non-blocking)
  - AI greeting: "Welcome to your space. Here's what matters first."

Minute 1-3: FIRST EVENT (most important action)
  - Setup progress highlights "Create your first event"
  - One-click opens EventCreateModal
  - AI pre-fills: "Weekly Meeting" title, suggested day/time based on similar clubs
  - Leader tweaks and publishes in under 60 seconds

Minute 3-5: INVITE CO-LEADER
  - Setup progress highlights "Add a co-leader"
  - MemberInviteModal generates shareable invite link
  - QR code ready for in-person sharing (activities fair)

Minute 5-7: CUSTOMIZE
  - Upload space icon (drag-and-drop or file picker)
  - Edit description (AI suggestion pre-filled from template)
  - Choose banner image

Minute 7-10: SHARE
  - Invite link copied
  - Space URL shared to group chat
  - First members start joining
```

**AI in onboarding**: The AI should generate a complete first event based on the space type. For a Photography Club, it suggests "Photo Walk" with location on campus, appropriate time, and beginner-friendly description. For a Study Group, it suggests "Weekly Review Session" at the library.

---

## 3. Inside a Space (Member Experience)

### 3.1 The Hub: What You See When You Enter

**Existing code**: `SpaceHub` component in `packages/ui/src/design-system/components/spaces/SpaceHub.tsx`.

The SpaceHub is the orientation screen -- identity + navigation + action. Three blocks:

**Block 1: Identity**
- Space icon (or initials fallback) with category-accent glow
- Space name (tight tracking, semibold)
- Verified badge (blue) or Unclaimed badge (gold)
- Category label (muted)
- Description (secondary, max ~100 chars visible)
- Online count with LiveDot indicator

**Block 2: Action (Primary CTA)**
- For members: "Open Chat" button
- For non-members: "Join Space" button
- For visitors of unclaimed spaces: "Claim as Leader" (CTA) + "Join as Member" (secondary)

**Block 3: Navigation (Mode Cards with Live Data)**
Four mode cards in a 2x2 grid, each showing real-time data:

| Mode | Live Data Shown | Empty State |
|---|---|---|
| Chat | Messages today, last message preview, typing indicator | "Be the first to say something" |
| Events | Upcoming count, next event title + date | "No events yet -- create one?" |
| Tools | Tool count, highly rated count, popular tool name | "Build one in HiveLab?" |
| Members | Count with community stage label, online count | "Be a founding member" |

**Community Stage framing** (instead of showing raw numbers that feel small):
- < 10 members: "Founding Team" (gold accent) -- "Join early, shape the community"
- 10-50 members: "Growing" -- "Momentum building"
- 50+ members: No label needed, numbers speak for themselves

### 3.2 Modes/Views Hierarchy

Spaces use a mode-based navigation model (not tabs). The current mode is `SpaceMode = 'hub' | 'chat' | 'events' | 'tools' | 'members'`.

| Mode | Component | What it shows |
|---|---|---|
| Hub | `SpaceHub` | Orientation: identity + mode cards + primary CTA |
| Chat | `SpaceChatBoard` / `TheaterChatBoard` | Real-time messaging with boards/channels |
| Events | `EventsMode` | Bento grid of upcoming/past events with RSVP |
| Tools | `ToolsMode` | Deployed tools (sidebar + inline) |
| Members | `MembersMode` | Member list with roles and online status |

**Mode transitions**: Use `ModeTransition` component for animated switches between modes. Entrance: fade + slight translate (4-8px). Duration < 300ms.

### 3.3 Experience Differences by Role

| Role | What they see differently |
|---|---|
| **Guest** (non-member, public space) | Hub + Events visible. Chat visible but read-only. No tools access. Join CTA prominent. |
| **New Visitor** (first visit) | SpaceWelcomeModal with space description, member count, next event. One-click join. |
| **Member** | Full access to all modes. Can post, RSVP, use tools, chat. |
| **Moderator** | Member features + content moderation actions (hide, warn). |
| **Admin** | Moderator features + event creation, member management, settings, analytics. |
| **Owner** | Admin features + ownership transfer, space deletion, go-live control. |

**Existing code**: Permission checks use `checkSpacePermission(spaceId, userId, requiredRole)` middleware at `apps/web/src/lib/space-permission-middleware.ts`. Roles are ordered: owner > admin > moderator > member > guest.

### 3.4 Signals of Life vs Staleness

A space must feel alive or honestly acknowledge that it's quiet. Never fake activity.

**Signals of life** (things that make a space feel active):
- `ActivityHeartbeatStrip` primitive showing recent activity pulses
- `LiveDotOnly` indicators for online members and typing
- Mode card data showing today's message count, upcoming events, online count
- "Last active X ago" timestamp on space cards in browse

**Signals of staleness** (honest empty states, never hidden):
- No events: "No events yet -- create one?" (not "Nothing here")
- No messages: "Be the first to say something" (invites action)
- No members online: Online indicator simply absent (don't show "0 online")
- No activity in 30+ days: "This space has been quiet" with suggestion to post or create an event

**Anti-pattern**: Never show "12 members" when only 1 has logged in this semester. If we track lastActive per member, we could show "3 active this week" instead of total count. But for launch, total count is fine -- it's honest about who's signed up.

---

## 4. Events System

Events are the primary content type on HIVE. Not posts, not messages, not tools. Events drive attendance, create memories, and give students a reason to open the app.

### 4.1 Event Data Model

**Existing code**: `CreateEventSchema` in `apps/web/src/app/api/spaces/[spaceId]/events/route.ts:33`.

```typescript
Event {
  id: string                    // Auto-generated
  spaceId: string               // Parent space
  campusId: string              // Campus isolation
  organizerId: string           // Creator's userId

  // Core
  title: string                 // 1-200 chars
  description: string           // 1-2000 chars
  type: EventType               // see taxonomy below
  tags: string[]

  // Timing
  startDate: Date
  endDate: Date
  isRecurring: boolean
  recurrenceRule?: string       // iCal RRULE format

  // Location
  location?: string             // Physical: "Student Union Room 101"
  virtualLink?: string          // Virtual: Zoom/Teams URL

  // Attendance
  maxAttendees?: number
  rsvpDeadline?: Date
  requiredRSVP: boolean
  attendeeCount: number         // Cached count (avoids N+1)

  // Display
  imageUrl?: string
  isFeatured: boolean
  isPrivate: boolean
  cost?: number
  currency?: string             // 3-char ISO

  // State
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  isHidden: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

### 4.2 Event Types Taxonomy

```typescript
type EventType = 'academic' | 'social' | 'recreational' | 'cultural' | 'meeting' | 'virtual';
```

| Type | Icon | Description | Example |
|---|---|---|---|
| `academic` | Books | Lectures, study sessions, workshops, office hours | "Calculus Study Session" |
| `social` | Party | Mixers, hangouts, parties, game nights | "End of Semester BBQ" |
| `recreational` | Running | Sports, fitness, outdoor activities | "Intramural Soccer Practice" |
| `cultural` | Theater | Performances, exhibitions, cultural celebrations | "Diwali Celebration" |
| `meeting` | People | Club meetings, board meetings, general body meetings | "Weekly GBM" |
| `virtual` | Computer | Online events, webinars, virtual hangouts | "Alumni Panel (Zoom)" |

**For launch**: These 6 types cover the full spectrum. Don't add more until there's demand signal. AI can infer the correct type from the event title and description.

### 4.3 Event Creation Flow

**Existing code**: `EventCreateModal` in `packages/ui/src/design-system/components/spaces/EventCreateModal.tsx`.

**Current flow** (working):
1. Title input (required)
2. Description textarea
3. Event type selector (3x2 grid with icons)
4. Start date/time (required) + End date/time (optional)
5. In-Person / Virtual toggle
6. Location input OR Meeting link input
7. Optional settings: Max attendees, Require RSVP, Link to channel
8. Submit -> POST /api/spaces/{spaceId}/events

**What needs to change for 2026**:

**AI-Assisted Creation** (new endpoint: `POST /api/events/generate`):

```
Student Leader Experience:
  1. Leader types: "Photo walk Wednesday 4pm Baird Point beginners welcome"
  2. AI generates complete event in <2 seconds:
     - Title: "Photo Walk: Baird Point at Golden Hour"
     - Description: "Join us for a beginner-friendly photo walk around Baird Point..."
     - Type: recreational
     - Start: Next Wednesday, 4:00 PM
     - End: Next Wednesday, 6:00 PM
     - Location: "Baird Point, UB North Campus"
     - Tags: ["photography", "outdoors", "beginners"]
  3. Leader reviews, edits if needed, publishes
  4. Total time: 30 seconds instead of 5 minutes
```

**AI Generation API Contract**:

```
POST /api/events/generate
Authorization: Bearer {session}

Request:
{
  "prompt": "Photo walk Wednesday 4pm Baird Point beginners welcome",
  "spaceId": "space_abc123",
  "context": {
    "spaceName": "Photography Club",
    "spaceType": "student",
    "campusId": "ub",
    "recentEvents": ["Darkroom Workshop", "Portrait Night"]
  }
}

Response:
{
  "event": {
    "title": "Photo Walk: Baird Point at Golden Hour",
    "description": "Join us for a beginner-friendly photo walk...",
    "type": "recreational",
    "startDate": "2026-09-10T16:00:00-04:00",
    "endDate": "2026-09-10T18:00:00-04:00",
    "location": "Baird Point, UB North Campus",
    "tags": ["photography", "outdoors", "beginners"],
    "suggestedImagePrompt": "golden hour campus photography"
  },
  "confidence": 0.92,
  "alternatives": [
    { "title": "Sunset Photo Session at Baird Point", ... }
  ]
}
```

**Implementation**: Use Vercel AI SDK `generateObject` with Zod schema matching `CreateEventSchema`. Gemini structured output with campus-aware context (building names, locations, common event patterns). Estimated build: 2-3 days.

### 4.4 Event Discovery: How Students Find Events

Events must be discoverable in three ways:

**A. Inside a space** (existing, working):
- `EventsMode` component shows bento grid
- Next event hero card if < 24h away
- Upcoming events (large cards) + past events (small cards)
- RSVP buttons prominent on each card
- Mode card on SpaceHub shows "3 upcoming" with next event preview

**B. Cross-space discovery by time** (CRITICAL NEW ENDPOINT):

```
GET /api/events/upcoming
  ?from=2026-09-03T10:15:00
  &to=2026-09-03T12:45:00
  &campusId=ub
  &types=social,academic
  &limit=20

Returns: All events across ALL spaces that fall within the time window,
filtered by campusId, sorted by startDate ascending.
```

This is the single most important missing endpoint. The commuter dashboard needs this to answer "what's happening during my 2.5-hour gap?" It's a straightforward Firestore compound query on the flat `/events` collection: `campusId == X AND startDate >= from AND startDate <= to`. Build time: 1-2 days.

**C. AI-powered discovery** (natural language):

```
Student asks: "What's happening this weekend that I'd actually like?"
System queries:
  - Events this weekend (Fri 5pm - Sun midnight)
  - Student's interest profile (joined spaces, RSVP history, stated interests)
  - Returns curated list, not a dump of 40 events
  - "Based on your interest in photography and outdoor activities,
     here are 3 events this weekend you'd probably enjoy..."
```

This integrates with the Discovery & Intelligence system (spec 03). The events system provides the data; the discovery system provides the intelligence.

### 4.5 Event Lifecycle

```
draft --> scheduled --> live --> completed
                    |
                    --> cancelled
```

| Status | Meaning | Visibility |
|---|---|---|
| `draft` (future) | Leader is still editing, not published | Only organizer sees it |
| `scheduled` | Published, RSVP open | Public (or space-members-only if private) |
| `live` | Happening right now (startDate <= now <= endDate) | Highlighted, "Happening Now" badge |
| `completed` | Past event | Moved to "Past Events" section, attendance recorded |
| `cancelled` | Organizer cancelled | Shows "Cancelled" badge, notifies RSVP'd users |

**Recurring events**: The `isRecurring` flag + `recurrenceRule` (iCal RRULE) support weekly meetings, biweekly events, etc. Each occurrence generates a separate event document (not computed on-the-fly) to support per-occurrence RSVPs and attendance tracking.

**For launch**: Support `scheduled` and `completed`. The `live` status is computed client-side from date comparison. Recurring events are a post-launch feature (Layer 2).

### 4.6 RSVP + Attendance + Social Proof

**Existing code**: RSVP route at `apps/web/src/app/api/spaces/[spaceId]/events/[eventId]/rsvp/route.ts`.

**RSVP Model**:
- Three states: `going`, `maybe`, `not_going`
- Composite key `{eventId}_{userId}` prevents duplicates
- Capacity enforcement: checks `maxAttendees` before accepting "going"
- Deadline enforcement: checks `rsvpDeadline` before accepting any RSVP
- Notifications: organizer notified on RSVP, attendee gets confirmation

**Social Proof** (what makes events feel worth attending):
- "12 going, 5 maybe" -- visible on event cards
- "Sarah, Mike, and 10 others are going" -- friends-first display
- "This event filled up in 2 hours" -- scarcity signal for popular events
- Organizer avatar + name visible on all event cards

**Attendance Tracking** (post-launch, Layer 2):
- Check-in confirmation: "Did you actually attend?" notification 30 min after event starts
- QR code check-in at the door (leader scans or displays)
- Attendance data feeds analytics: which events get best turnout, optimal timing

### 4.7 Event API Contracts

**Existing routes** (all working):

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/spaces/[spaceId]/events` | List events for a space (upcoming/past, with pagination) |
| `POST` | `/api/spaces/[spaceId]/events` | Create event (admin+ permission required) |
| `GET` | `/api/spaces/[spaceId]/events/[eventId]` | Get single event details |
| `PATCH` | `/api/spaces/[spaceId]/events/[eventId]` | Update event |
| `DELETE` | `/api/spaces/[spaceId]/events/[eventId]` | Delete event |
| `POST` | `/api/spaces/[spaceId]/events/[eventId]/rsvp` | RSVP to event |
| `GET` | `/api/spaces/[spaceId]/events/[eventId]/rsvp` | Get user's RSVP status |

**New routes needed**:

| Method | Route | Purpose | Priority |
|---|---|---|---|
| `GET` | `/api/events/upcoming` | Cross-space events by time window | CRITICAL (Layer 1) |
| `POST` | `/api/events/generate` | AI-generate event from natural language | CRITICAL (Layer 1) |
| `GET` | `/api/events/happening-now` | Currently live events on campus | USEFUL (Layer 2) |
| `POST` | `/api/events/[eventId]/check-in` | Attendance check-in | USEFUL (Layer 2) |

---

## 5. Leader Experience (Space Autopilot)

### 5.1 The Promise

The promise of Space Autopilot: what takes a club president 10 hours a week today takes 30 seconds on HIVE.

| Task | Without HIVE | With HIVE |
|---|---|---|
| Create weekly event | Open Google Calendar, write description, copy to GroupMe, post to Instagram | Type "weekly meeting Thursday 6pm SU 210" -> AI generates -> one click publish |
| Announce event | Write announcement, post to 3 platforms, make flyer | Event creation auto-notifies all members, generates shareable card |
| Track attendance | Pass around sign-in sheet, manually enter data | QR check-in or post-event confirmation, automatic analytics |
| Onboard new members | Answer DMs, explain club, share links | New member sees space overview, events, and resources automatically |
| Transition leadership | Google Drive handoff, oral history | All institutional memory in the space: past events, member data, analytics |

### 5.2 Daily/Weekly Leader Workflow

**Daily** (30 seconds):
1. Open HIVE -> Space hub shows mode card data at a glance
2. Check: any new members? Any RSVPs for upcoming event?
3. Quick action: respond to a join request or post an update

**Weekly** (5 minutes):
1. Create next event (AI-assisted, 30 seconds)
2. Glance at member engagement (who's active, who's drifting)
3. Review past event attendance
4. Share invite link if recruiting

**Monthly** (15 minutes):
1. Review analytics dashboard: attendance trends, growth, engagement
2. Adjust event timing based on AI suggestions
3. Consider leadership transitions for graduating seniors

### 5.3 AI Event Creation: The Exact Flow

```
Leader opens space -> Clicks "+" or "New Event"
  |
  v
EventCreateModal opens with AI input field at top:
  "Describe your event in a few words..."
  |
  v
Leader types: "Pizza and coding night this Friday 7pm Capen"
  |
  v
AI generates (streaming, <2s):
  Title: "Pizza & Coding Night"
  Description: "Grab a slice and work on projects together. All skill levels
                welcome -- whether you're debugging your first program or
                building your senior project. Pizza provided!"
  Type: social
  Start: This Friday, 7:00 PM
  End: This Friday, 10:00 PM
  Location: "Capen Hall, UB North Campus"
  Tags: ["coding", "social", "free-food", "all-levels"]
  |
  v
Form auto-fills with AI output. Leader reviews.
  - Can edit any field
  - Can regenerate with different prompt
  - All fields are real form inputs, not locked AI output
  |
  v
Leader clicks "Create Event"
  - Event saved to /events collection
  - Auto-linked chat board created
  - All space members notified
  - Shareable event card generated
  |
  v
Total time: 30 seconds. Leader goes back to studying.
```

### 5.4 Member Management

**Active/Drifting/Churned** (engagement states, computed server-side):

| State | Definition | Signal |
|---|---|---|
| Active | Engaged in the last 14 days | Opened space, RSVP'd, posted, or chatted |
| Drifting | No engagement in 14-30 days | Still a member, just hasn't interacted |
| Churned | No engagement in 30+ days | Effectively gone, but hasn't left |

**What leaders can do**:
- View member list with engagement state indicators
- Remove members (with confirmation for irreversible action)
- Promote/demote roles (owner/admin/member -- simplified from 5 roles for launch)
- Generate invite link or QR code
- See join method for each member (invite, organic, claim, activities fair)

**What leaders CANNOT see** (privacy):
- Individual member activity details (when they last opened HIVE)
- Which other spaces a member belongs to
- Member's class schedule or personal profile data

### 5.5 Analytics (Leader Dashboard)

**For launch** (Layer 1): Basic counts visible on mode cards:
- Total member count
- Upcoming event count
- Online count (if > 0)
- Messages today

**Post-launch** (Layer 2): Full analytics dashboard at `/s/{handle}/analytics`:
- **Attendance trends**: Line chart of event attendance over time
- **Growth**: Member count over time, join rate
- **Engagement health**: Pie chart of active/drifting/churned
- **Event performance**: Which events get highest attendance, best RSVP conversion
- **Optimal timing**: AI-suggested event times based on member schedule data
- **Comparison**: "Attendance up 30% from last month"

**Existing code**: Analytics endpoint at `/api/spaces/[spaceId]/analytics`. Needs extension for the dashboard data.

### 5.6 Leadership Handoff

The hardest problem in student organizations: leadership changes every 1-2 years. Institutional memory dies with each transition.

**How HIVE solves this**:
- All event history lives in the space (not in the leader's personal account)
- Past event templates can be cloned: "Create event like last year's Spring Formal"
- Analytics history persists across leadership changes
- `transferOwnership()` method (line 1271 in enhanced-space.ts) moves owner role to a new member, demotes previous owner to admin
- Transfer ownership route: `POST /api/spaces/[spaceId]/transfer-ownership`

**The handoff flow**:
1. Outgoing president opens space settings
2. Selects incoming president from member list
3. Confirms ownership transfer
4. Incoming president becomes owner, outgoing becomes admin
5. Outgoing can leave space later (or stay as member/advisor)

**What transfers**: Everything. Space identity, events, members, analytics, tools, settings. Nothing is lost.

**What doesn't transfer**: Personal messages, personal RSVP history. Those belong to the individual.

---

## 6. Space Discovery & Browsing

### 6.1 How Students Find Spaces

**Browse** (the digital activities fair):
- `/spaces` page shows spaces organized by category quadrants
- Four discovery quadrants (from identity system):
  - **Major**: Academic spaces related to your declared major
  - **Community**: Student organizations and interest groups
  - **Home**: Residential spaces (de-emphasized for commuters)
  - **Greek**: Greek life chapters

**Existing code**: Territory-based browsing in `apps/web/src/components/spaces/territory-header.tsx`, `discover-section.tsx`, `identity-cards.tsx`.

**Search** (natural language):
- "photography" AND "camera stuff" return the same results
- AI-powered semantic search, not just keyword matching
- Results show: space card with name, category, member count, last activity, next event
- Zero results: "No spaces match 'rock climbing.' Want to start one? 4 other students searched for this too."

**AI Recommendations** (personalized):
- "Students in your major also joined..." (Major -> Interest cross-pollination)
- Based on: stated interests (onboarding), join history, RSVP history, engagement patterns
- Never based on: location data, device sensors, cross-app data

**Social proof** (peer influence):
- "12 students from your year joined this week"
- "3 friends are members" (if social graph data available)
- Trending score visible on browse cards (computed from recent activity)

### 6.2 Preview Before Joining

**Existing code**: Space preview at `/api/spaces/[spaceId]/preview` and `apps/web/src/components/spaces/space-preview-modal.tsx`.

Before joining, students can see:
- Space identity (name, icon, banner, description)
- Category and type
- Member count (with community stage framing)
- Upcoming events (public events visible without joining)
- Verified/Unclaimed badge
- Recent activity indicator

What they CANNOT see without joining:
- Chat messages
- Full member list
- Private events
- Tools/resources

This supports the introvert-first design principle: browse before joining, observe before committing.

### 6.3 Join Friction by Policy

| Policy | Flow | Friction Level |
|---|---|---|
| `open` | Tap "Join" -> instantly a member | Zero |
| `approval` | Tap "Request to Join" -> leader approves/denies -> notified | Medium (hours) |
| `invite_only` | Must receive invite link/code -> tap link -> joined | High (requires knowing someone) |

**Existing code**: Join flow at `/api/spaces/join-v2`, invite validation at `/api/spaces/invite/[code]/validate` and `/api/spaces/invite/[code]/redeem`, join requests at `/api/spaces/[spaceId]/join-requests`.

**Design principle**: Joining should never feel permanent or scary. Leaving is one tap, no confirmation dialog (reversible action per 2026 anti-patterns).

### 6.4 The Digital Activities Fair

At the real activities fair, students walk through rows of tables, see posters, talk to leaders, sign up.

HIVE's digital equivalent:
1. Student opens `/spaces` or the discover section
2. Browse by category or search by interest
3. Preview space card: name, next event, member count, vibe
4. Tap to see preview modal: full description, upcoming events, "what it's like"
5. One-tap join for open spaces
6. QR code at physical fair table: scan -> space preview -> join

**For activities fair day specifically**:
- Leaders generate QR codes from invite-link-modal (`apps/web/src/components/spaces/invite-link-modal.tsx`)
- Scanning the QR opens HIVE with the space preview
- If student doesn't have HIVE: redirects to signup with space auto-join on completion
- If student has HIVE: opens space preview, one-tap join

---

## 7. Templates

### 7.1 Template Strategy

**Existing code**: 9 templates defined in `packages/core/src/domain/spaces/templates/index.ts`.

**For launch**: Surface 3 templates in the creation UI, keep the rest in code.

| Template | ID | When to use | Tabs | Join Policy |
|---|---|---|---|---|
| Student Club | `student-club` | 80% of spaces: clubs, organizations, interest groups | Feed, Events, Resources, About | Open |
| Study Group | `study-group` | Academic collaboration | Discussion, Resources, Schedule | Open |
| Minimal | `minimal` | "I'll figure it out myself" | Home (single feed) | Open |

**Hidden but available** (re-enable when demand exists):
- Research Lab (academic, approval-based)
- Dorm Community (residential)
- Greek Life Chapter (private, invite-only)
- Career Network (professional)
- Event Series (event-first)
- Hackathon (time-bounded)

### 7.2 Template Auto-Deploy

When a space is created or claimed, the template automatically configures:
- **Tabs**: Pre-created with appropriate types and ordering
- **Widgets**: Calendar, poll, links deployed to relevant tabs
- **Settings**: Join policy, visibility, approval requirements
- **System tools**: Auto-deployed to sidebar via `getSystemTemplateForCategory`
- **Suggested content**: Description, tags pre-filled

The leader doesn't need to configure anything. The space works from the moment of creation.

---

## 8. Cross-System Dependencies

### 8.1 Dependencies on Other Systems

| System | Dependency | Nature |
|---|---|---|
| **Identity & Home** | User profile, campus email verification, session/auth | Spaces require authenticated users with campusId |
| **Identity & Home** | Home feed | Events from joined spaces surface on the home feed |
| **Identity & Home** | Student schedule | Cross-space event discovery needs schedule gaps |
| **Discovery & Intelligence** | AI event generation | Events system provides schema, AI system provides generation |
| **Discovery & Intelligence** | Semantic search | Space browse/search uses AI-powered similarity |
| **Discovery & Intelligence** | Recommendations | "Spaces you might like" pulls from interest profile |
| **Communication** | Notifications | Event creation, RSVP, claim notifications |
| **Communication** | Event chat boards | Each event auto-links to a chat board |

### 8.2 What This System Provides to Others

| Consumer | What we provide |
|---|---|
| **Home Feed** | Upcoming events from joined spaces, space activity signals |
| **Discovery** | Space metadata for search indexing, event data for recommendations |
| **Communication** | Space membership for notification targeting, event boards |
| **Profile** | Space memberships for "your spaces" section |
| **Admin** | Builder requests queue, analytics data, moderation targets |

### 8.3 Shared Data Contracts

**SpaceCard** (used in browse, search results, recommendations):
```typescript
{
  id: string;
  name: string;
  slug: string;
  category: string;
  spaceType: SpaceType;
  memberCount: number;
  iconUrl?: string;
  isVerified: boolean;
  isUnclaimed: boolean;
  lastActivityAt: string;
  nextEvent?: { title: string; startDate: string };
  trendingScore: number;
}
```

**EventCard** (used in home feed, search results, calendar):
```typescript
{
  id: string;
  title: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location?: string;
  spaceName: string;
  spaceId: string;
  rsvpCount: number;
  userRsvp?: string;
  organizer: { name: string; avatarUrl?: string };
}
```

---

## 9. Acceptance Criteria

### 9.1 Space Creation
- [ ] Student can create a new space in under 60 seconds via 3-step wizard
- [ ] AI pre-fills description and tags within 500ms of template selection
- [ ] Handle availability check works with dramatic reveal animation
- [ ] Space is immediately accessible after creation (no approval wait)
- [ ] Template auto-deploys tabs, widgets, and system tools

### 9.2 Space Claiming
- [ ] Leader can search for and find their UBLinked organization
- [ ] Claim grants provisional access immediately
- [ ] Template tools auto-deploy on claim
- [ ] Waitlist members notified when space is claimed
- [ ] Admin can verify and go-live within 7-day window

### 9.3 Events
- [ ] Leader can create event with all required fields in EventCreateModal
- [ ] Events stored in flat /events collection with spaceId + campusId
- [ ] Cross-space event query by time window returns correct results
- [ ] RSVP works with capacity enforcement and deadline checking
- [ ] Event creation notifies all space members
- [ ] Auto-linked chat board created for each event

### 9.4 Discovery
- [ ] Space browse shows spaces organized by category quadrants
- [ ] Search returns relevant results for both exact and semantic queries
- [ ] Preview modal shows space info without requiring membership
- [ ] Join flow works for all three policies (open, approval, invite)

### 9.5 Leader Experience
- [ ] Setup progress widget shows on first visit after claim/create
- [ ] Member list shows all members with roles
- [ ] Invite link generation and QR code work
- [ ] Ownership transfer works between members

### 9.6 Performance
- [ ] Space hub loads in < 1.5s LCP
- [ ] Event list loads in < 300ms API response
- [ ] RSVP action completes in < 300ms
- [ ] Mode transitions animate in < 300ms
- [ ] Skeleton states shown for all async content

### 9.7 Privacy & Security
- [ ] All queries filter by campusId from session, never from client
- [ ] Private space content invisible to non-members
- [ ] Ghost mode respected for event organizer display
- [ ] SecurityScanner validates all user-generated content
- [ ] Cross-campus access blocked at API level

---

## 10. Existing Code Assessment

### What's Built and Working
- EnhancedSpace aggregate with full DDD (lifecycle, members, tabs, widgets, tools)
- 9 space templates with smart defaults
- Space creation modal (3-step wizard)
- Space claim flow (search -> confirm -> success) with provisional access
- Events CRUD with flat collection, pagination, ghost mode
- RSVP with capacity/deadline enforcement and notifications
- SpaceHub with mode-based navigation and live data
- EventsMode with bento grid layout
- 6 context providers (metadata, structure, events, tabs, leader, main)
- 88+ API routes covering spaces, events, chat, members, tools, boards
- Leader setup progress tracking
- Ownership transfer
- Go-live admin verification

### What Needs to Be Built
1. **Cross-space event query** (`GET /api/events/upcoming`) -- 1-2 days
2. **AI event generation** (`POST /api/events/generate`) -- 2-3 days
3. **AI space creation assist** (smart defaults in creation modal) -- 1-2 days
4. **Leader analytics dashboard** (extend existing endpoint + build UI) -- 3-5 days (Layer 2)
5. **Member engagement states** (active/drifting/churned computation) -- 2 days (Layer 2)
6. **Attendance tracking** (check-in confirmation + QR) -- 3 days (Layer 2)

### What Should Be Simplified for Launch
- Governance models: Default to hierarchical, hide selection
- Quorum threshold: Set to 1 for claimed spaces
- Tab/widget customization: Keep template defaults, hide add/edit UI
- Tool deployment: Keep auto-deploy, hide manual management
- Chat boards: Leave working, don't extend or promote
- Webhooks: Hide from all UI surfaces
- Role granularity: Simplify to owner/admin/member (hide moderator/guest in UI)
