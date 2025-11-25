# HIVE Features & Business Logic

**Last Updated**: 2025-11-22
**Status**: Production Reference
**Deadline**: December 9-13, 2025
**Total API Routes**: 127

This document defines HIVE's business logic and domain rules. It is the source of truth for feature behavior, NOT UI/UX patterns (see DESIGN.md for that).

---

## Table of Contents

1. [Onboarding & Auth](#1-onboarding--auth)
2. [Feed & Rituals](#2-feed--rituals)
3. [Spaces](#3-spaces)
4. [HiveLab](#4-hivelab)
5. [Profile](#5-profile)
6. [Calendar & Events](#6-calendar--events)
7. [Notifications](#7-notifications)
8. [Search](#8-search)
9. [Social & Content](#9-social--content)
10. [Analytics & Activity](#10-analytics--activity)
11. [Realtime](#11-realtime)
12. [System & Infrastructure](#12-system--infrastructure)

---

## 1. Onboarding & Auth

### 1.1 Authentication

**Email Verification**
- Only `@buffalo.edu` emails allowed
- Email validation: `^[a-zA-Z0-9._%+-]+@buffalo\.edu$`
- Firebase Authentication with magic links
- JWT tokens stored in HTTP-only cookies

**Session Management**
- Token expiry: 1 hour (3600s)
- Auto-refresh: 5 minutes before expiry
- Session stored in sessionStorage with key `hive_session_info`
- Activity tracking on mouse/keyboard/touch events

**Campus Isolation**
- ALL queries MUST include `campusId: 'ub-buffalo'`
- User profile automatically tagged with campus on creation
- Cross-campus data access is prohibited

### 1.2 Onboarding Flow

**Profile Creation**
```typescript
interface ProfileProps {
  email: UBEmail;           // Validated @buffalo.edu
  handle: Handle;           // Unique, 3-20 chars, alphanumeric + underscore
  personalInfo: PersonalInfo;
  interests: string[];
  connections: string[];
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Required Steps**
1. Email verification (magic link)
2. Handle selection (unique per campus)
3. Personal info (name, major, grad year)
4. Interest selection (min 3 recommended)
5. Profile photo (optional but encouraged)

**Domain Events**
- `ProfileCreatedEvent` - Fired on account creation
- `ProfileOnboardedEvent` - Fired when onboarding completes

**Business Rules**
- Handle must be unique within campus
- First name and last name required
- Major and graduation year optional but tracked for completion
- Profile cannot be re-onboarded once completed
- Minimum 0, recommended 3+ interests

### 1.3 Waitlist

**Pre-Launch Flow**
- Collect email + school ID before campus launch
- Campus-specific waitlists
- Automatic invite when campus goes live

### 1.4 Auth API Routes (11 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/check-admin-grant` | Check if user has admin privileges |
| GET | `/api/auth/check-handle` | Validate handle availability |
| POST | `/api/auth/complete-onboarding` | Finalize onboarding flow |
| GET | `/api/auth/csrf` | Get CSRF token for form protection |
| POST | `/api/auth/dev-session` | Development-only session creation |
| POST | `/api/auth/logout` | Clear session and cookies |
| POST | `/api/auth/resend-magic-link` | Resend verification email |
| POST | `/api/auth/send-magic-link` | Send magic link for login |
| GET | `/api/auth/session` | Get current session info |
| POST | `/api/auth/verify-magic-link` | Verify magic link token |
| POST | `/api/waitlist/join` | Join campus waitlist |

---

## 2. Feed & Rituals

### 2.1 Feed

**Feed Types**
- `all` - Default, shows everything
- `spaces` - Posts from joined spaces only
- `rituals` - Ritual-related content
- `events` - Events and RSVPs
- `trending` - High engagement content

**Feed Item Sources**
```typescript
type FeedSource = 'space' | 'ritual' | 'event' | 'profile';
```

**Feed Configuration**
- Max items: 100 per feed
- Refresh interval: 30 seconds
- Auto-removes oldest items when at capacity
- Pinned items always sort first

**Sorting Algorithm**
1. Pinned items first
2. By relevance score (engagement + recency)
3. By creation date (newest first)

**Business Rules**
- Feed is personalized per user
- Only shows content from joined spaces
- Campus-isolated (only shows `ub-buffalo` content)
- Supports filtering without losing items
- Tracks last refresh for staleness detection

### 2.2 Feed Algorithm

**Aggregation**
- Combines posts from all joined spaces
- Includes ritual updates and events
- Weights by user engagement history

**Space Filtering**
- Filter by specific space
- Filter by space category
- Exclude muted spaces

**Content Validation**
- Check post content for policy violations
- Validate media attachments
- Rate limit spam detection

### 2.3 Rituals

**Ritual Types**
- `daily` - Resets every day
- `weekly` - Resets every week
- `monthly` - Resets every month
- `seasonal` - Quarter/semester-based
- `one-time` - Single occurrence

**Ritual Structure**
```typescript
interface EnhancedRitualProps {
  ritualId: RitualId;
  name: string;
  description: string;
  type: RitualType;
  campusId: CampusId;
  createdBy: ProfileId;
  milestones: Milestone[];
  participants: ProfileId[];
  settings: RitualSettings;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  completedCount: number;
}
```

**Milestones**
```typescript
interface Milestone {
  id: string;
  name: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  rewards: Reward[];
  isCompleted: boolean;
  threshold: number;
  isReached: boolean;
  reachedAt?: Date;
}
```

**Rewards**
- `badge` - Visual achievement
- `points` - Campus points/XP
- `unlock` - Feature unlock
- `achievement` - Profile achievement

**Ritual Settings**
```typescript
interface RitualSettings {
  isVisible: boolean;
  maxParticipants?: number;
  allowLateJoin: boolean;
  requiresApproval: boolean;
  autoStart: boolean;
  autoEnd: boolean;
}
```

**Business Rules**
- Participants cannot join after start if `allowLateJoin: false`
- Max participants enforced if set
- Cannot remove creator
- Milestones auto-complete when `currentValue >= targetValue`
- Completion percentage = completed milestones / total milestones
- Total progress = sum of individual milestone progress / count

**State Transitions**
- `isActive: true` + `hasStarted()` + `!hasEnded()` = In Progress
- `hasEnded()` = Completed
- `!hasStarted()` = Upcoming

### 2.4 Feed API Routes (8 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/feed` | Get personalized feed with pagination |
| GET | `/api/feed/aggregation` | Get aggregated feed from multiple sources |
| GET/POST | `/api/feed/algorithm` | Get/update feed algorithm weights |
| GET/DELETE | `/api/feed/cache` | Manage feed cache |
| POST | `/api/feed/content-validation` | Validate post content |
| GET | `/api/feed/search` | Search within feed |
| GET | `/api/feed/space-filtering` | Get feed filtered by space |
| GET | `/api/feed/updates` | Get feed updates since timestamp |

---

## 3. Spaces

### 3.1 Space Structure

```typescript
interface EnhancedSpaceProps {
  spaceId: SpaceId;
  name: SpaceName;          // 3-50 chars
  description: SpaceDescription;  // Max 500 chars
  category: SpaceCategory;
  campusId: CampusId;
  createdBy: ProfileId;
  members: SpaceMember[];
  tabs: Tab[];
  widgets: Widget[];
  settings: SpaceSettings;
  rssUrl?: string;
  visibility: 'public' | 'private';
  isActive: boolean;
  isVerified: boolean;
  trendingScore: number;
  rushMode?: RushMode;
  postCount: number;
  lastActivityAt: Date;
}
```

### 3.2 Membership

**Member Roles**
- `admin` - Full control, cannot be removed if last admin
- `moderator` - Can moderate content
- `builder` - Can install and configure tools
- `member` - Standard participation

**Member Operations**
```typescript
interface SpaceMember {
  profileId: ProfileId;
  role: 'admin' | 'moderator' | 'builder' | 'member';
  joinedAt: Date;
  status: 'active' | 'pending' | 'banned';
}
```

**Business Rules**
- Creator automatically becomes admin
- Cannot remove last admin
- Cannot demote last admin
- Max members enforced if `settings.maxMembers` set
- Must check membership before allowing posts
- Builder role required for tool deployment

### 3.3 Space Settings

```typescript
interface SpaceSettings {
  allowInvites: boolean;      // Members can invite others
  requireApproval: boolean;   // Join requests need admin approval
  allowRSS: boolean;          // RSS feed integration
  maxMembers?: number;        // Member cap
  isPublic: boolean;          // Discoverable in search
}
```

### 3.4 Rush Mode

For Greek life/recruitment periods:
```typescript
interface RushMode {
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  requirements?: string[];
}
```

### 3.5 Tabs & Widgets

**Default Tab**: Feed (created automatically)

**Tab Structure**
```typescript
interface Tab {
  name: string;
  type: 'feed' | 'events' | 'resources' | 'custom';
  isDefault: boolean;
  order: number;
  widgets: Widget[];
  isVisible: boolean;
}
```

**Widget Types**
- About widget
- Tools widget
- Events widget
- Members widget
- Custom widgets from HiveLab

### 3.6 Categories

```typescript
type SpaceCategory =
  | 'student_org'
  | 'academic'
  | 'greek'
  | 'sports'
  | 'arts'
  | 'community'
  | 'professional'
  | 'other';
```

### 3.7 Space API Routes (30 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/spaces` | List/create spaces |
| GET/PATCH/DELETE | `/api/spaces/[spaceId]` | Get/update/delete space |
| GET | `/api/spaces/[spaceId]/builder-status` | Check builder role status |
| GET/POST | `/api/spaces/[spaceId]/events` | List/create space events |
| GET/PATCH/DELETE | `/api/spaces/[spaceId]/events/[eventId]` | Manage specific event |
| POST | `/api/spaces/[spaceId]/events/[eventId]/rsvp` | RSVP to event |
| GET | `/api/spaces/[spaceId]/feed` | Get space-specific feed |
| GET/POST | `/api/spaces/[spaceId]/members` | List/add members |
| PATCH/DELETE | `/api/spaces/[spaceId]/members/[memberId]` | Update/remove member |
| GET/POST | `/api/spaces/[spaceId]/membership` | Check/request membership |
| GET/POST | `/api/spaces/[spaceId]/posts` | List/create posts |
| GET/PATCH/DELETE | `/api/spaces/[spaceId]/posts/[postId]` | Manage specific post |
| GET/POST | `/api/spaces/[spaceId]/posts/[postId]/comments` | List/add comments |
| POST | `/api/spaces/[spaceId]/posts/[postId]/reactions` | Add reaction |
| POST | `/api/spaces/[spaceId]/promote-post` | Promote post to feed |
| POST | `/api/spaces/[spaceId]/seed-rss` | Seed from RSS feed |
| GET/POST | `/api/spaces/[spaceId]/tools` | List/deploy tools |
| POST | `/api/spaces/[spaceId]/tools/feature` | Feature a tool |
| GET | `/api/spaces/browse` | Browse all public spaces |
| GET | `/api/spaces/browse-v2` | Enhanced browse with filters |
| GET | `/api/spaces/check-create-permission` | Check if user can create |
| POST | `/api/spaces/join` | Join a space |
| POST | `/api/spaces/join-v2` | Enhanced join with approval |
| POST | `/api/spaces/leave` | Leave a space |
| GET | `/api/spaces/mine` | Get user's spaces |
| GET | `/api/spaces/my` | Alias for mine |
| GET | `/api/spaces/recommended` | Get recommended spaces |
| POST | `/api/spaces/request-to-lead` | Request admin role |
| GET | `/api/spaces/resolve-slug/[slug]` | Resolve space by slug |
| GET | `/api/spaces/search` | Search spaces |
| POST | `/api/spaces/seed` | Seed demo spaces (admin) |
| POST | `/api/spaces/transfer` | Transfer ownership |

---

## 4. HiveLab

### 4.1 Tool Structure

```typescript
interface Tool {
  id: string;
  name: string;
  version: string;          // Semantic versioning (0.1.0)
  status: ToolStatus;
  config: ToolConfig;
  metadata: Record<string, any>;
  ownerId: string;
  campusId: string;
  viewCount: number;
  installCount: number;
  createdAt: Date;
  updatedAt: Date;
}

type ToolStatus = 'draft' | 'published' | 'archived';
```

### 4.2 Tool Composition

**Canvas Elements**
```typescript
interface CanvasElement {
  elementId: string;        // Element type (e.g., 'search-input')
  instanceId: string;       // Unique instance (e.g., 'elem_001')
  config: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}
```

**Element Connections**
```typescript
interface ElementConnection {
  from: { instanceId: string; output: string };
  to: { instanceId: string; input: string };
}
```

**Full Composition**
```typescript
interface ToolComposition {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];
  connections: ElementConnection[];
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}
```

### 4.3 Element Categories

```typescript
type ElementCategory =
  | 'input'     // User input elements
  | 'display'   // Output/visualization
  | 'filter'    // Data transformation
  | 'action'    // Triggers/buttons
  | 'layout';   // Structural elements
```

### 4.4 Tool Lifecycle

**Versioning**
- Semantic versioning (major.minor.patch)
- Auto-increment patch on save
- Major/minor for breaking changes

**States**
1. `draft` - In development, not visible to others
2. `published` - Available for installation
3. `archived` - No longer available, existing installs work

**Operations**
- Create tool
- Update tool
- Deploy to space/profile
- Share via link (with optional expiry)
- Install from marketplace
- Review/rate
- Fork from existing

### 4.5 Deployment

**Deployment Targets**
- Personal dashboard (`profile`)
- Space widget (`space`)
- Standalone page

**Deployment Config**
```typescript
interface DeploymentConfig {
  toolId: string;
  deployTo: 'profile' | 'space';
  targetId: string;
  surface?: 'pinned' | 'posts' | 'events' | 'tools' | 'chat' | 'members';
  config: Record<string, any>;
  permissions: {
    canInteract: boolean;
    canView: boolean;
    canEdit: boolean;
    allowedRoles: string[];
  };
  settings: {
    showInDirectory: boolean;
    allowSharing: boolean;
    collectAnalytics: boolean;
    notifyOnInteraction: boolean;
  };
}
```

### 4.6 Tool Reviews

```typescript
interface ToolReview {
  userId: string;
  toolId: string;
  rating: number;           // 1-5
  title: string;            // 5-100 chars
  content: string;          // 10-1000 chars
  pros?: string[];
  cons?: string[];
  useCase?: string;
  verified: boolean;        // User has used tool
  createdAt: Date;
}
```

**Business Rules**
- One review per user per tool
- Must have used tool for verified badge
- Reviews public after moderation

### 4.7 Business Rules

- Tools are owned by creator
- Published tools can be installed by anyone
- Installed tools are copies (updates don't propagate)
- Tools can be deployed to multiple targets
- Share links have optional expiration
- Analytics tracked per deployment
- Only admin/moderator/builder can deploy to space
- View count increments on non-owner views

### 4.8 HiveLab API Routes (24 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/tools` | List/create tools |
| GET/PUT/DELETE | `/api/tools/[toolId]` | Get/update/delete tool |
| GET | `/api/tools/[toolId]/analytics` | Get tool analytics |
| POST | `/api/tools/[toolId]/deploy` | Deploy to space |
| POST | `/api/tools/[toolId]/reviews` | Add review |
| POST | `/api/tools/[toolId]/share` | Create share link or fork |
| GET/POST | `/api/tools/[toolId]/state` | Get/save tool state |
| GET | `/api/tools/browse` | Browse published tools |
| GET/PATCH/DELETE | `/api/tools/deploy/[deploymentId]` | Manage deployment |
| POST | `/api/tools/deploy` | Deploy tool |
| POST | `/api/tools/event-system` | Install event system tool |
| POST | `/api/tools/execute` | Execute tool action |
| POST | `/api/tools/feed-integration` | Integrate tool with feed |
| POST | `/api/tools/generate` | AI-generate tool config |
| POST | `/api/tools/install` | Install to profile/space |
| POST | `/api/tools/migrate` | Migrate tool version |
| GET/POST | `/api/tools/personal` | Get/manage personal tools |
| POST | `/api/tools/publish` | Publish tool |
| GET | `/api/tools/recommendations` | Get recommended tools |
| POST | `/api/tools/review` | Submit tool review |
| GET | `/api/tools/search` | Search tools |
| GET | `/api/tools/state/[deploymentId]` | Get deployment state |
| GET | `/api/tools/usage-stats` | Get usage statistics |

---

## 5. Profile

### 5.1 Profile Structure

```typescript
interface ProfileProps {
  email: UBEmail;
  handle: Handle;
  personalInfo: PersonalInfo;
  interests: string[];
  connections: string[];
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonalInfo {
  firstName: string;        // Required
  lastName: string;         // Required
  bio: string;              // Optional, max 500 chars
  major: string;            // Optional
  graduationYear: number | null;  // Optional
  dorm: string;             // Optional
  photoUrl?: string;
}
```

### 5.2 Handle Rules

```typescript
// Handle validation
- Length: 3-20 characters
- Characters: alphanumeric + underscore
- Must be unique per campus
- Case-insensitive for uniqueness check
```

### 5.3 Connections

**Connection Types**
- Mutual follow (bidirectional)
- One-way follow (asymmetric)

**Operations**
- Add connection (must not exist)
- Remove connection (must exist)
- Check connection status

**Business Rules**
- Cannot connect to self
- Duplicate connections rejected
- Connection removal is idempotent

### 5.4 Interests

**Operations**
- Update all interests (replace)
- Add single interest
- Interest deduplication automatic

**Business Rules**
- No maximum (but UI should limit)
- Used for feed personalization
- Used for space recommendations

### 5.5 Profile Completion

**Completion Score**
Calculated based on filled fields:
- Name (required, always complete)
- Handle (required, always complete)
- Photo (optional, +20%)
- Bio (optional, +15%)
- Major (optional, +15%)
- Graduation year (optional, +10%)
- Interests (3+, +20%)
- Connections (1+, +20%)

### 5.6 Privacy

**Privacy Levels**
```typescript
type ProfilePrivacy =
  | 'public'      // Visible to all campus
  | 'connections' // Visible to connections
  | 'private';    // Visible only to self
```

**Ghost Mode**
- Temporarily hide all activity
- No feed appearances
- No "online" status
- Can still browse

### 5.7 Profile API Routes (17 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET/PATCH | `/api/profile` | Get/update current profile |
| GET | `/api/profile/[userId]` | Get profile by ID |
| GET | `/api/profile-v2/[userId]` | Enhanced profile with stats |
| GET | `/api/profile/calendar/conflicts` | Check calendar conflicts |
| GET/POST | `/api/profile/calendar/events` | List/add profile events |
| GET | `/api/profile/completion` | Get completion score |
| GET | `/api/profile/dashboard` | Get dashboard data |
| GET | `/api/profile/my-spaces` | Get joined spaces |
| GET/PATCH | `/api/profile/notifications/preferences` | Notification settings |
| POST | `/api/profile/spaces/actions` | Batch space actions |
| GET | `/api/profile/spaces/recommendations` | Recommended spaces |
| GET | `/api/profile/spaces` | Get space memberships |
| GET | `/api/profile/stats` | Get activity stats |
| POST | `/api/profile/upload-photo` | Upload profile photo |
| GET/POST | `/api/connections` | List/add connections |
| GET/PATCH | `/api/privacy` | Get/update privacy settings |
| GET/PATCH | `/api/privacy/visibility` | Specific visibility settings |
| POST | `/api/privacy/ghost-mode` | Toggle ghost mode |

---

## 6. Calendar & Events

### 6.1 Calendar Structure

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  type: EventType;
  capacity?: number;
  isPublic: boolean;
  requiresRSVP: boolean;
  allowGuests: boolean;
  tags: string[];
  recurrence?: RecurrenceRule;
  spaceId?: string;
  createdBy: string;
  campusId: string;
}

type EventType =
  | 'study_session'
  | 'social_meetup'
  | 'project_work'
  | 'organization_meeting'
  | 'campus_event'
  | 'custom';
```

### 6.2 RSVP System

```typescript
interface RSVP {
  userId: string;
  eventId: string;
  status: 'going' | 'interested' | 'not_going';
  guests: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**
- One RSVP per user per event
- Capacity enforced if set
- Guests counted toward capacity
- RSVP notifications sent to organizer

### 6.3 Free Time Detection

- Analyzes user's calendar
- Suggests optimal meeting times
- Considers timezone
- Respects quiet hours

### 6.4 Conflict Detection

- Checks overlapping events
- Warns on double-booking
- Suggests alternatives

### 6.5 Calendar API Routes (4 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/calendar` | List/create calendar events |
| GET/PATCH/DELETE | `/api/calendar/[eventId]` | Manage specific event |
| GET | `/api/calendar/conflicts` | Detect calendar conflicts |
| GET | `/api/calendar/free-time` | Find available time slots |

---

## 7. Notifications

### 7.1 Notification Types

```typescript
type NotificationType =
  | 'space_invite'
  | 'space_join_request'
  | 'post_reaction'
  | 'post_comment'
  | 'event_reminder'
  | 'rsvp_update'
  | 'ritual_milestone'
  | 'tool_review'
  | 'connection_request'
  | 'system';
```

### 7.2 Notification Structure

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}
```

### 7.3 Notification Preferences

```typescript
interface NotificationPreferences {
  email: {
    enabled: boolean;
    digest: 'instant' | 'daily' | 'weekly' | 'never';
  };
  push: {
    enabled: boolean;
    quietHours: { start: string; end: string };
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
  };
  byType: Record<NotificationType, boolean>;
}
```

### 7.4 Notifications API Routes (1 route)

| Method | Route | Description |
|--------|-------|-------------|
| GET/PATCH | `/api/notifications` | List/mark notifications |

---

## 8. Search

### 8.1 Search Domains

- **Profiles** - Search by name, handle, major
- **Spaces** - Search by name, description, category
- **Tools** - Search by name, description
- **Posts** - Full-text search in content

### 8.2 Search Features

- Fuzzy matching
- Filters by type
- Recent searches
- Trending searches
- Campus-scoped results

### 8.3 Search API Routes (4 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/search` | Universal search |
| GET | `/api/search/v2` | Enhanced search with facets |
| GET | `/api/users/search` | Search users specifically |
| GET | `/api/schools` | Search/list schools |

---

## 9. Social & Content

### 9.1 Posts

```typescript
interface Post {
  id: string;
  content: string;          // Max 2000 chars
  media: MediaAttachment[];
  authorId: string;
  spaceId: string;
  campusId: string;
  isPinned: boolean;
  isPromoted: boolean;
  reactionCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 9.2 Reactions

```typescript
type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';

interface Reaction {
  userId: string;
  postId: string;
  type: ReactionType;
  createdAt: Date;
}
```

**Business Rules**
- One reaction per user per post
- Can change reaction type
- Can remove reaction

### 9.3 Comments

```typescript
interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;          // Max 500 chars
  parentId?: string;        // For replies
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**
- Nested comments (max 2 levels)
- Author can edit/delete
- Moderators can delete

### 9.4 Content Moderation

**Report Types**
- Spam
- Harassment
- Inappropriate content
- Misinformation
- Other

**Moderation Actions**
- Warn user
- Remove content
- Mute user
- Ban user

### 9.5 Social & Content API Routes (4 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/social/interactions` | Get/record interactions |
| GET/POST | `/api/social/posts` | List/create posts |
| POST | `/api/content/reports` | Report content |
| POST | `/api/feedback` | Submit feedback |

---

## 10. Analytics & Activity

### 10.1 Activity Tracking

```typescript
interface ActivityEvent {
  userId: string;
  eventType: string;
  timestamp: Date;
  metadata: Record<string, any>;
  sessionId: string;
  campusId: string;
}
```

**Tracked Events**
- Page views
- Button clicks
- Tool interactions
- Post engagements
- Search queries
- Session duration

### 10.2 Activity Insights

- Daily active users
- Feature usage stats
- Engagement metrics
- Retention rates

### 10.3 Analytics Metrics

```typescript
interface AnalyticsMetrics {
  period: 'day' | 'week' | 'month';
  activeUsers: number;
  newUsers: number;
  posts: number;
  reactions: number;
  comments: number;
  toolUsage: number;
  spaceJoins: number;
}
```

### 10.4 Analytics API Routes (4 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/activity` | Get/record activity |
| POST | `/api/activity/batch` | Batch activity events |
| GET | `/api/activity/insights` | Get activity insights |
| GET | `/api/analytics/metrics` | Get analytics metrics |

---

## 11. Realtime

### 11.1 Realtime Channels

```typescript
type ChannelType =
  | 'feed'
  | 'space'
  | 'chat'
  | 'notifications'
  | 'presence'
  | 'typing';
```

### 11.2 Presence System

```typescript
interface PresenceStatus {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentSpace?: string;
}
```

### 11.3 Typing Indicators

- Show when user is typing
- Auto-clear after 3 seconds
- Per-channel indicators

### 11.4 Server-Sent Events (SSE)

- Feed updates
- Notification delivery
- Presence changes
- Tool state sync

### 11.5 Realtime API Routes (10 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/realtime/channels` | List/subscribe to channels |
| GET/POST | `/api/realtime/chat` | Chat messages |
| GET | `/api/realtime/metrics` | Realtime metrics |
| GET | `/api/realtime/notifications` | Notification stream |
| GET/POST | `/api/realtime/presence` | Presence status |
| POST | `/api/realtime/send` | Send realtime message |
| GET | `/api/realtime/sse` | SSE connection |
| POST | `/api/realtime/tool-updates` | Tool state updates |
| POST | `/api/realtime/typing` | Typing indicator |
| GET | `/api/realtime/websocket` | WebSocket upgrade |

---

## 12. System & Infrastructure

### 12.1 Health Checks

- Database connectivity
- Firebase status
- Memory usage
- Response times

### 12.2 Feature Flags

```typescript
interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetCampuses?: string[];
}
```

### 12.3 Error Reporting

- Client-side errors
- API errors
- Stack traces
- User context

### 12.4 Cron Jobs

- `promote-posts` - Auto-promote trending posts
- Feed cache refresh
- Analytics aggregation
- Cleanup expired data

### 12.5 Campus Detection

- Detect campus from email domain
- IP-based hints
- Manual override

### 12.6 Onboarding Catalog

- Interest categories
- Space suggestions
- Tool recommendations

### 12.7 System API Routes (10 routes)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/feature-flags` | Manage feature flags |
| POST | `/api/errors/report` | Report client error |
| POST | `/api/cron/promote-posts` | Cron: promote posts |
| GET | `/api/campus/detect` | Detect user's campus |
| GET | `/api/onboarding/catalog` | Get onboarding catalog |
| GET | `/api/debug-calendar` | Debug calendar (dev) |
| POST | `/api/dev-auth` | Dev auth bypass |
| * | `/api/internal/*` | Internal endpoints |

---

## Cross-Cutting Concerns

### Campus Isolation

**CRITICAL**: Every Firestore query MUST include:
```typescript
where('campusId', '==', 'ub-buffalo')
```

### Rate Limiting

- API: 60 requests/minute per IP
- Auth: 5 attempts/15 minutes per email
- Posts: 10/hour per user
- Search: 30/minute per user

### Audit Logging

All mutations logged with:
- User ID
- Action type
- Timestamp
- Previous/new values
- IP address

### Real-Time Updates

Firebase listeners for:
- Feed items
- Space membership changes
- Ritual progress
- Notifications
- Presence

### Security

- CSRF protection on all POST/PUT/DELETE
- JWT validation via Firebase Admin
- Input sanitization
- SQL injection prevention (N/A - Firestore)
- XSS prevention

---

## Domain Events

| Event | Trigger | Side Effects |
|-------|---------|--------------|
| `ProfileCreatedEvent` | Account created | Welcome notification, feed setup |
| `ProfileOnboardedEvent` | Onboarding complete | Enable full features |
| `SpaceCreatedEvent` | Space created | Index for search |
| `SpaceJoinedEvent` | User joins space | Add to feed sources, notify admins |
| `PostCreatedEvent` | Post created | Add to feeds, notify followers |
| `ReactionAddedEvent` | Reaction added | Notify post author |
| `CommentAddedEvent` | Comment added | Notify post author |
| `EventCreatedEvent` | Event created | Notify space members |
| `RSVPEvent` | User RSVPs | Update count, notify organizer |
| `RitualParticipantAddedEvent` | User joins ritual | Track participation |
| `MilestoneCompletedEvent` | Milestone reached | Award rewards, notify |
| `ToolCreatedEvent` | Tool created | Track analytics |
| `ToolPublishedEvent` | Tool published | Make discoverable, notify followers |
| `ToolDeployedEvent` | Tool deployed | Create instance, track usage |
| `ConnectionAddedEvent` | Connection made | Notify both users |

---

## Validation Schemas

All input validation uses Zod schemas. Key validations:

```typescript
// Handle
z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/)

// Email
z.string().email().regex(/@buffalo\.edu$/)

// Space name
z.string().min(3).max(50).trim()

// Space description
z.string().max(500).trim()

// Post content
z.string().min(1).max(2000).trim()

// Comment content
z.string().min(1).max(500).trim()

// Tool name
z.string().min(1).max(100).trim()

// Event title
z.string().min(1).max(200).trim()

// Review rating
z.number().min(1).max(5)

// Review content
z.string().min(10).max(1000).trim()
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Feed load | < 500ms | Cached + paginated |
| Space load | < 400ms | Single document |
| Tool save | < 200ms | Optimistic UI |
| Search | < 300ms | Indexed queries |
| Auth | < 1s | Firebase cold start |
| Post create | < 500ms | With media upload |
| RSVP | < 200ms | Optimistic update |
| Notification | < 100ms | Real-time delivery |

---

## API Route Summary

| Domain | Routes | Notes |
|--------|--------|-------|
| Auth | 11 | Magic link, session, CSRF |
| Feed | 8 | Algorithm, cache, validation |
| Spaces | 30 | Full CRUD, events, posts |
| HiveLab | 24 | Tools, deployments, reviews |
| Profile | 17 | Settings, calendar, privacy |
| Calendar | 4 | Events, conflicts, free time |
| Notifications | 1 | List and mark |
| Search | 4 | Universal and filtered |
| Social | 4 | Posts, interactions, reports |
| Analytics | 4 | Activity, insights, metrics |
| Realtime | 10 | SSE, presence, typing |
| System | 10 | Health, flags, cron |
| **Total** | **127** | |

---

**Remember**: This document defines WHAT the features do. For HOW they look, see `DESIGN.md`. For HOW to build them, see `CLAUDE.md`.
