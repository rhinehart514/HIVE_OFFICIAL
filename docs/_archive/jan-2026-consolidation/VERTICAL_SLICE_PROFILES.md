# Vertical Slice: Profiles (Connection Layer)

## January 2026 Full Launch

---

## Vision

**Real social graph of campus life. Not followers — connections.**

Profiles are the third layer of HIVE's four-layer architecture. Where Spaces create community and HiveLab enables creation, Profiles make it personal. Every student has a rich identity: their campus affiliation, interests, spaces, and the connections they've made along the way.

The insight: on campus, everyone is connected by context. Same dorm. Same major. Same club. We don't need a follow model—we have a connection model based on shared campus experience.

---

## Current Status: 75% Complete

| Submodule | Status | Notes |
|-----------|--------|-------|
| Profile View | ✅ Complete | Own + others, premium dark design |
| Profile Editing | ✅ Complete | All fields, handle changes |
| Photo Uploads | ✅ Complete | Profile + cover photos |
| Bio/Interests | ✅ Complete | Max 10 interests |
| Completion Tracking | ✅ Complete | Percentage calculation |
| Follow/Connect | ✅ Complete | Bidirectional connections |
| Connection List | ✅ Complete | With mutual detection |
| Mutual Detection | ✅ Complete | Auto-discover from spaces |
| User Search | ✅ Complete | By name, handle |
| Privacy Settings | ✅ Complete | DDD value object |
| Visibility Controls | ✅ Complete | 4 privacy levels |
| Ghost Mode | ⚠️ 60% | Domain logic exists, UI deferred |
| Profile Widgets | ⚠️ 70% | Spaces widget done, calendar basic |
| Bento Grid | ✅ Complete | Drag-drop customizable layout |
| Presence/Status | ✅ Complete | Real-time online indicator |

---

## Architecture

### DDD Layer (packages/core)

```
packages/core/src/domain/profile/
├── aggregates/
│   ├── enhanced-profile.ts    # Main profile aggregate (684 lines)
│   └── connection.ts          # Connection aggregate (305 lines)
├── value-objects/
│   ├── profile-id.value.ts
│   ├── profile-handle.value.ts
│   ├── profile-privacy.value.ts   # 4-level privacy (108 lines)
│   ├── campus-id.value.ts
│   ├── graduation-year.value.ts   # Standing calculation
│   ├── major.value.ts             # School classification
│   ├── interest.value.ts          # Interest collection with categories
│   └── connection-strength.value.ts
└── services/
    └── ghost-mode.service.ts      # Privacy stealth (370 lines)
```

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `enhanced-profile.ts` | 684 | Main profile aggregate with rich domain methods |
| `connection.ts` | 305 | Connection aggregate with accept/reject/block |
| `ghost-mode.service.ts` | 370 | Privacy stealth domain service |
| `profile-privacy.value.ts` | 108 | 4-level privacy value object |
| `/api/profile/route.ts` | 484 | Profile CRUD with DDD integration |
| `/api/connections/route.ts` | 306 | Connection detection and retrieval |
| `ProfilePageContent.tsx` | 852 | Main profile view component |
| `profile-bento-grid.tsx` | 1,332 | Customizable bento grid layout |

---

## Profile Aggregate (EnhancedProfile)

The `EnhancedProfile` is the core domain aggregate for user profiles:

```typescript
// packages/core/src/domain/profile/aggregates/enhanced-profile.ts

interface EnhancedProfileProps {
  profileId: ProfileId;
  email: UBEmail;
  handle: ProfileHandle;
  userType: UserType;
  campusId: CampusId;
  personalInfo: PersonalInfo;
  academicInfo?: AcademicInfo;
  socialInfo: SocialInfo;
  privacy: ProfilePrivacy;
  connections: string[];
  spaces: string[];
  achievements: string[];
  isOnboarded: boolean;
  isVerified: boolean;
  isActive: boolean;
  lastActive?: Date;
  activityScore: number;
  followerCount: number;
  followingCount: number;
  connectionCount: number;
}
```

### Personal Info

```typescript
interface PersonalInfo {
  firstName: string;
  lastName: string;
  bio?: string;
  major?: string;
  graduationYear?: number;
  dorm?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  coverPhoto?: string;
}
```

### Social Info

```typescript
interface SocialInfo {
  interests: string[];  // Max 10
  clubs: string[];
  sports: string[];
  greek?: string;
  instagram?: string;
  snapchat?: string;
  twitter?: string;
  linkedin?: string;
}
```

### Domain Methods

```typescript
// Profile completion
public getCompletionPercentage(): number;
public isProfileComplete(): boolean;

// Academic standing (from value objects)
public getAcademicStanding(): string | null;  // Alumni/Senior/Junior/Sophomore/Freshman
public isAlumni(): boolean;
public isCurrentStudent(): boolean;

// Major classification
public getMajorInfo(): { name: string; school: AcademicSchool; isSTEM: boolean };
public isSTEMMajor(): boolean;

// Interest management (validated)
public getInterestCollection(): InterestCollection;
public getInterestSimilarity(other: EnhancedProfile): number;  // 0-100
public addInterestValidated(interest: string): Result<void>;
public hasEnoughInterests(): boolean;

// Connections & Spaces
public addConnection(connectionId: string): void;
public removeConnection(connectionId: string): void;
public joinSpace(spaceId: string): void;
public leaveSpace(spaceId: string): void;

// Lifecycle
public completeOnboarding(personalInfo?, interests?): Result<void>;
public verify(): void;
public deactivate(): void;
public reactivate(): void;
```

---

## Connection System

### Connection Types

```typescript
enum ConnectionType {
  FRIEND = 'friend',        // Mutual connection
  FOLLOWER = 'follower',    // One-way
  FOLLOWING = 'following',  // One-way
  BLOCKED = 'blocked',      // Blocked
  PENDING = 'pending'       // Awaiting acceptance
}

enum ConnectionSource {
  SEARCH = 'search',
  SUGGESTION = 'suggestion',
  MUTUAL = 'mutual',
  SPACE = 'space',
  EVENT = 'event',
  QR_CODE = 'qr_code'
}
```

### Connection Aggregate

```typescript
// packages/core/src/domain/profile/aggregates/connection.ts

class Connection extends AggregateRoot<ConnectionProps> {
  // Accept a pending connection request
  public accept(acceptedBy: ProfileId): Result<void>;

  // Reject a pending request
  public reject(): Result<void>;

  // Block a user
  public block(blockedBy: ProfileId): Result<void>;

  // Unblock
  public unblock(): Result<void>;

  // Track mutual spaces
  public addMutualSpace(spaceId: string): void;

  // Track interaction count (for connection strength)
  public incrementInteraction(): void;

  // Get the other person in the connection
  public getOtherProfileId(profileId: ProfileId): ProfileId | null;
}
```

### Auto-Detection

Connections are automatically detected from shared campus context:

```typescript
// POST /api/connections/detect

// Detection sources and weights:
// 1. Same major: +30 strength
// 2. Same dorm: +40 strength
// 3. Same year: +10 strength
// 4. Same space: +20 strength

// Max strength: 100
// Strong connections: strength >= 70
```

---

## Privacy System

### Privacy Levels

```typescript
// packages/core/src/domain/profile/value-objects/profile-privacy.value.ts

enum PrivacyLevel {
  PUBLIC = 'public',              // Anyone can view
  CAMPUS_ONLY = 'campus_only',    // Same campus only (default)
  CONNECTIONS_ONLY = 'connections_only',  // Only connections
  PRIVATE = 'private'             // Only self and admins
}

interface ProfilePrivacyProps {
  level: PrivacyLevel;
  showEmail: boolean;     // Default: false
  showPhone: boolean;     // Default: false
  showDorm: boolean;      // Default: true
  showSchedule: boolean;  // Default: false
  showActivity: boolean;  // Default: true
}
```

### Visibility Check

```typescript
public canViewProfile(viewerType: 'public' | 'campus' | 'connection'): boolean {
  switch (this.props.level) {
    case PrivacyLevel.PUBLIC:
      return true;
    case PrivacyLevel.CAMPUS_ONLY:
      return viewerType === 'campus' || viewerType === 'connection';
    case PrivacyLevel.CONNECTIONS_ONLY:
      return viewerType === 'connection';
    case PrivacyLevel.PRIVATE:
      return false;
  }
}
```

### Granular Privacy Settings

Beyond the basic level, granular settings control:

```typescript
// /api/profile/privacy

interface PrivacySettings {
  ghostMode: {
    enabled: boolean;
    level: 'invisible' | 'minimal' | 'selective' | 'normal';
    hideFromDirectory: boolean;
    hideActivity: boolean;
    hideSpaceMemberships: boolean;
    hideLastSeen: boolean;
    hideOnlineStatus: boolean;
  };
  profileVisibility: {
    showToSpaceMembers: boolean;
    showToFollowers: boolean;
    showToPublic: boolean;
    hideProfilePhoto: boolean;
    hideHandle: boolean;
    hideInterests: boolean;
  };
  activitySharing: {
    shareActivityData: boolean;
    shareSpaceActivity: boolean;
    shareToolUsage: boolean;
    shareContentCreation: boolean;
    allowAnalytics: boolean;
  };
  notifications: {
    enableActivityNotifications: boolean;
    enableSpaceNotifications: boolean;
    enableToolNotifications: boolean;
    enableRitualNotifications: boolean;
  };
  dataRetention: {
    retainActivityData: boolean;
    retentionPeriod: number;  // days
    autoDeleteInactiveData: boolean;
  };
}
```

---

## Ghost Mode (Deferred to Spring 2026)

Ghost Mode is a privacy stealth feature that lets users control their visibility. The domain logic is complete, but UI is deferred.

### Ghost Mode Levels

```typescript
// packages/core/src/domain/profile/services/ghost-mode.service.ts

type GhostModeLevel = 'invisible' | 'minimal' | 'selective' | 'normal';

// invisible: Hidden from everyone except self and admins
// minimal: Only visible to space members
// selective: Visible to close community members (2+ shared spaces)
// normal: Full visibility
```

### Level Presets

```typescript
case 'invisible':
  return {
    hideFromDirectory: true,
    hideActivity: true,
    hideSpaceMemberships: true,
    hideLastSeen: true,
    hideOnlineStatus: true,
    hideFromSearch: true
  };

case 'minimal':
  return {
    hideFromDirectory: false,
    hideActivity: true,
    hideSpaceMemberships: false,
    hideLastSeen: true,
    hideOnlineStatus: true,
    hideFromSearch: false
  };
```

### Visibility Rules

```typescript
// Self always sees their own data
if (viewer.userId === targetUserId) return false;

// Admins can always see
if (viewer.isAdmin) return false;

// Level-based rules
switch (settings.level) {
  case 'invisible':
    return true;  // Hidden from everyone
  case 'minimal':
    // Visible only if sharing a space
    return sharedSpaceIds.length === 0;
  case 'selective':
    // Visible if 2+ shared spaces
    return sharedSpaceIds.length < 2;
}
```

---

## Profile Page UI

### Premium Dark Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌────────┐  @laney · Active in UB Tech                       │
│   │ Avatar │  Computer Science, Class of 2026                  │
│   │ + Glow │  "Building things that matter"                    │
│   └────────┘                                                   │
│                                                                 │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │
│   │  12  │ │  45  │ │  7   │ │  89  │  ← Animated counters    │
│   │Spaces│ │Friend│ │Streak│ │ Rep  │                          │
│   └──────┘ └──────┘ └──────┘ └──────┘                          │
│                                                                 │
│   [Edit Profile]  or  [Connect] [Message]                       │
│                                                                 │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│   │ React   │ │ TypeScript│ │ Design │ │AI/ML   │  ← Interests │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                      BENTO GRID                                 │
│   ┌─────────────────┐ ┌─────────────────┐                       │
│   │ SPACES          │ │ CALENDAR        │                       │
│   │ UB Tech  Leader │ │ Coming soon     │                       │
│   │ ACM      Member │ │                 │                       │
│   └─────────────────┘ └─────────────────┘                       │
│   ┌─────────────────────────────────────┐                       │
│   │ HIVELAB TOOLS                       │                       │
│   │ Poll Template, Event RSVP           │                       │
│   └─────────────────────────────────────┘                       │
│   ┌─────────────────────────────────────┐                       │
│   │ COMING SOON (own profile only)      │                       │
│   │ Calendar, Analytics, Ghost Mode     │                       │
│   └─────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key UI Components

```typescript
// ProfilePageContent.tsx

// Spring-animated stat counters
function Stat({ label, value, accent, delay }) {
  return (
    <AnimatedNumber
      value={value}
      animateOnView
      springOptions={{
        ...numberSpringPresets.standard,
        duration: 1500 + delay * 200,
      }}
      className={accent ? 'text-gold-500' : 'text-white'}
    />
  );
}

// Presence status with ambient glow
{isOnline && (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="absolute inset-0 -m-2 rounded-full bg-emerald-500/20 blur-xl"
  />
)}
```

### Bento Grid Layout

Profiles use a customizable bento grid layout:

```typescript
// ProfileBentoGrid with drag-drop reordering
<ProfileBentoGrid
  profile={profileSystem}
  editable={isOwnProfile}
  onLayoutChange={handleLayoutChange}
/>

// Layout persisted to API
const handleLayoutChange = async (layout: BentoGridLayout) => {
  await fetch('/api/profile/v2', {
    method: 'PATCH',
    body: JSON.stringify({ grid: layout }),
  });
};
```

---

## Profile Widgets

### Spaces Widget

```typescript
// packages/ui/src/atomic/04-Profile/organisms/profile-spaces-widget.tsx

interface ProfileSpaceItem {
  id: string;
  name: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  memberCount?: number;
  lastActivityAt?: string;
  unreadCount?: number;
  onlineCount?: number;
}

// Features:
// - Role badges with styling (gold for Leader, purple for Admin, etc.)
// - Unread message count
// - Online members indicator
// - Privacy controls for who can see spaces
// - Browse more CTA
```

### HiveLab Widget

Shows tools the user has created:

```typescript
<ProfileHiveLabWidget
  tools={userTools}
  isOwnProfile={isOwnProfile}
/>

// Displays:
// - Tool name
// - Deployment count (how many spaces)
// - Usage count
// - Status (draft/published)
// - Last updated
```

### Coming Soon Section

For own profile, shows upcoming features with notification opt-in:

```typescript
<ProfileComingSoonSection
  notifiedFeatures={notifiedFeatures}
  onNotify={handleNotifyFeature}
  isSaving={isNotifySaving}
/>

// Features teased:
// - Calendar integration
// - Advanced analytics
// - Ghost mode UI
// - Profile themes
```

---

## API Routes (17 Endpoints)

### Core Profile

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile` | GET | Current user profile (DDD) |
| `/api/profile` | PUT/PATCH/POST | Update profile (DDD + legacy) |
| `/api/profile/[userId]` | GET | User profile by ID |
| `/api/profile/handle/[handle]` | GET | Profile by handle |
| `/api/profile/v2` | GET/PATCH | Enhanced profile v2 |
| `/api/profile-v2/[userId]` | GET | Profile v2 by ID |

### Profile Features

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/completion` | GET | Profile completion percentage |
| `/api/profile/stats` | GET | Profile statistics |
| `/api/profile/dashboard` | GET | Dashboard data |
| `/api/profile/upload-photo` | POST | Upload profile/cover photo |

### Privacy & Notifications

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/privacy` | GET/PATCH | Privacy settings (DDD sync) |
| `/api/profile/notifications/preferences` | GET/POST | Notification preferences |
| `/api/profile/fcm-token` | POST | Register push token |
| `/api/profile/notify` | GET/POST | Feature notification subscriptions |

### Spaces & Social

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/spaces` | GET | User's spaces |
| `/api/profile/spaces/recommendations` | GET | Recommended spaces |
| `/api/profile/spaces/actions` | POST | Space actions (join/leave) |
| `/api/profile/my-spaces` | GET | My spaces (simplified) |

### Calendar

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/calendar/events` | GET | User's calendar events |
| `/api/profile/calendar/conflicts` | GET | Calendar conflicts |

---

## Connections API (2 Endpoints)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/connections` | GET | Get user's connections with profiles |
| `/api/connections` | POST | Detect and create auto-connections |

### Connection Stats

```typescript
// GET /api/connections returns:
{
  connections: [{
    userId: string,
    strength: number,
    sources: string[],
    isMutual: boolean,
    isFriend: boolean,
    profile: {
      fullName, handle, avatarUrl, major, academicYear,
      housing, statusMessage, currentVibe, availabilityStatus
    }
  }],
  stats: {
    totalConnections: number,
    friends: number,
    averageStrength: number,
    strongConnections: number,  // strength >= 70
    connectionSources: { [source]: count }
  }
}
```

---

## Interest System

### Interest Value Object

```typescript
// packages/core/src/domain/profile/value-objects/interest.value.ts

const MAX_INTERESTS = 10;
const MIN_RECOMMENDED = 3;

enum InterestCategory {
  ACADEMIC = 'academic',
  CREATIVE = 'creative',
  SOCIAL = 'social',
  TECHNOLOGY = 'technology',
  SPORTS = 'sports',
  MUSIC = 'music',
  OTHER = 'other'
}

class InterestCollection {
  // Normalized, deduplicated array
  public toStringArray(): string[];

  // Category distribution
  public getCategoryDistribution(): Map<InterestCategory, number>;

  // Similarity calculation (Jaccard-style)
  public similarityWith(other: InterestCollection): number;

  // Validation
  public meetsRecommendedMin(): boolean;
  public add(interest: string): Result<InterestCollection>;
}
```

### Similarity Calculation

Used for connection suggestions and feed personalization:

```typescript
// On EnhancedProfile aggregate
public getInterestSimilarity(other: EnhancedProfile): number {
  const myInterests = this.getInterestCollection();
  const theirInterests = other.getInterestCollection();
  return myInterests.similarityWith(theirInterests);  // 0-100
}
```

---

## Presence System

Real-time online status using Firestore:

```typescript
// Subscribe to presence updates
useEffect(() => {
  const presenceRef = doc(db, 'presence', profileId);
  const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
    const presence = snapshot.data() as PresenceData;
    // Update UI with presence status
  });
  return () => unsubscribe();
}, [profileId]);

// Presence data structure
interface PresenceData {
  status: 'online' | 'away' | 'offline';
  lastSeen: Timestamp;
  isGhostMode: boolean;
}
```

### UI Indicators

```typescript
// Online indicator dot
{isOnline && (
  <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-neutral-950" />
)}

// Presence text
const presenceText = isOnline
  ? 'Online now'
  : presenceStatus === 'away'
  ? 'Away'
  : `Last seen ${formatRelativeTime(lastSeen)}`;
```

---

## Handle System

### Handle Rules

```typescript
// Validation via ProfileHandle value object
- Min 3 characters
- Max 30 characters
- Alphanumeric + underscore + hyphen only
- Case-insensitive uniqueness check

// Change rules
- First change is free
- Subsequent changes: 6 month cooldown
- Old handles released for reuse
```

### Handle Change API

```typescript
// In /api/profile/route.ts
if (updateData.handle) {
  const handleResult = await changeHandle(userId, updateData.handle);

  if (!handleResult.success) {
    return respond.error({
      error: handleResult.error,
      nextChangeDate: handleResult.nextChangeDate?.toISOString()
    });
  }
}

// GET /api/profile returns handle change status
{
  handleChange: {
    canChange: boolean,
    nextChangeDate: string | null,
    changeCount: number,
    isFirstChangeFree: boolean
  }
}
```

---

## Profile Completion

### Calculation (40% personal, 30% academic, 30% social)

```typescript
// In EnhancedProfile aggregate
public getCompletionPercentage(): number {
  let completed = 0;
  let total = 0;

  // Personal Info (40%)
  total += 4;
  if (this.props.personalInfo.firstName) completed++;
  if (this.props.personalInfo.lastName) completed++;
  if (this.props.personalInfo.bio) completed++;
  if (this.props.personalInfo.profilePhoto) completed++;

  // Academic Info (30%) - only for students
  if (this.props.userType.isStudent()) {
    total += 3;
    if (this.props.academicInfo?.major) completed++;
    if (this.props.academicInfo?.graduationYear) completed++;
    if (this.props.academicInfo?.courses.length) completed++;
  }

  // Social Info (30%)
  total += 3;
  if (this.props.socialInfo.interests.length > 0) completed++;
  if (this.props.socialInfo.clubs.length > 0) completed++;
  if (this.props.socialInfo.instagram || this.props.socialInfo.snapchat) completed++;

  return Math.round((completed / total) * 100);
}
```

---

## Known Issues & Blockers

### Soft Launch Critical

1. **Ghost Mode UI** (Deferred)
   - Domain logic complete in `ghost-mode.service.ts`
   - UI settings panel not built
   - Deferred to Spring 2026

2. **Calendar Widget** (Basic)
   - Basic implementation only
   - Full calendar integration deferred

### Should Fix

1. **Interest Suggestions**
   - Currently free-form entry
   - Should have autocomplete with popular interests

2. **Connection Strength Display**
   - Strength calculated but not prominently displayed
   - Could show "strong connection" badges

3. **Profile Analytics**
   - Views, engagement not tracked
   - Would be nice for leaders

### Edge Cases

1. **Handle Conflict**
   - What if someone takes your old handle during cooldown?
   - Currently: they can take it, you can't get it back

2. **Privacy + Connections**
   - Can you see someone's profile if they're private but you're connected?
   - Currently: depends on privacy level settings

---

## Success Criteria

### Soft Launch (Dec 2025)

| Metric | Target |
|--------|--------|
| Profile completion rate | 60%+ of users |
| Photo upload rate | 50%+ of users |
| Interests added | 3+ per user |
| Connections detected | 5+ per user |
| Privacy settings viewed | 30%+ |

### Spring 2026

| Metric | Target |
|--------|--------|
| Ghost mode adoption | 10%+ |
| Calendar integration | 40%+ |
| Profile views per user | 5+/week |
| Connection interactions | 10+/week |

---

## Integration Points

### With Spaces

- Profile shows spaces joined
- Connections detected from shared spaces
- Privacy controls visibility to space members

### With HiveLab

- Profile shows tools created
- Tools deployed to profile widgets
- Builder status from profile

### With Feed

- Profile interests affect feed ranking
- Ghost mode hides from activity feeds
- Privacy level affects content visibility

### With Auth/Onboarding

- Profile created during onboarding
- Handle set during step 2
- Interests set during step 4
- Completion tracked

---

*Last updated: December 2025*
*Status: 70% Complete - Ready for Soft Launch (Ghost Mode UI deferred)*
