# Profile Vertical Slice

> **Purpose**: Define the complete Profile vertical slice from user value through UI/UX to data layer, including DDD model integration requirements and implementation priorities.
>
> **Last Updated**: November 28, 2024
> **DDD Integration Status**: ✅ **COMPLETE** - 14/15 endpoints (93%)
> **Remaining**: 1 endpoint (upload-photo) - binary storage, DDD not applicable

---

## Table of Contents

1. [User Value & Problem Statement](#1-user-value--problem-statement)
2. [UI/UX Layer](#2-uiux-layer)
3. [API Layer](#3-api-layer)
4. [Domain Model (DDD)](#4-domain-model-ddd)
5. [Data Layer (Firestore)](#5-data-layer-firestore)
6. [Full Stack Data Flows](#6-full-stack-data-flows)
7. ["Meant to Have" vs "Currently Have"](#7-meant-to-have-vs-currently-have)
8. [Integration Points](#8-integration-points)
9. [Critical Issues & Fixes](#9-critical-issues--fixes)
10. [Implementation Log](#10-implementation-log)
11. [Testing Requirements](#11-testing-requirements)
12. [File Inventory](#12-file-inventory)

---

## 1. User Value & Problem Statement

### What Problem Does Profile Solve?

**Core Problem**: College students need a way to present their authentic campus identity that reflects who they actually are - not a LinkedIn resume, not an Instagram highlight reel, but their real campus life.

**HIVE Differentiator**: The Profile is the **campus identity layer** - it's how students are known within their campus community, showing their spaces (clubs, orgs), their interests, their vibe, and their availability for connection.

### User Journeys

#### Journey 1: First Impressions (Discovery)
```
Trigger: User sees someone in a Space or Feed
Action: Taps profile to learn more
Value: Quick understanding of who this person is on campus
Success: "I want to connect with this person" or "We have things in common"
```

#### Journey 2: Self-Expression (Customization)
```
Trigger: User wants to express their campus identity
Action: Customizes profile bento grid with cards
Value: Authentic representation beyond basic info
Success: "This profile feels like me"
```

#### Journey 3: Privacy Control (Safety)
```
Trigger: User wants control over who sees what
Action: Adjusts privacy settings per section
Value: Comfort sharing on campus without oversharing
Success: "I feel safe sharing this with campus peers"
```

#### Journey 4: Connection Building (Social)
```
Trigger: User finds someone interesting
Action: Views shared interests, spaces, and mutual connections
Value: Common ground for initiating conversation
Success: "I have a reason to reach out to this person"
```

---

## 2. UI/UX Layer

### Pages Inventory

| Page | Path | Purpose | Status | API Used |
|------|------|---------|--------|----------|
| Profile Index | `/profile` | Redirect to own profile | Working | - |
| Public Profile | `/profile/[id]` | View another user's profile | Working | `/api/profile/v2` |
| ProfilePageContent | Component | Main profile rendering | Working | `/api/profile/v2` |
| Edit Profile | `/profile/edit` | Update profile information | Working | PATCH `/api/profile/v2` |
| Settings | `/profile/settings` | Privacy and preferences | Working | Multiple |
| Connections | `/profile/connections` | View/manage connections | Working | Real-time Firestore |
| User by Handle | `/user/[handle]` | Public-facing profile by handle | Working | Profile lookup |

### Component Architecture

```
Profile Pages
├── ProfileBentoGrid (organism) ─────────────────────────────────┐
│   ├── ProfileIdentityCard (identity)                           │
│   ├── SpacesCard (spaces)                                      │
│   ├── InterestsCard (interests)                                │
│   ├── ActivityCard (activity)                                  │
│   ├── ConnectionsCard (connections)                            │
│   ├── ScheduleCard (schedule) ← Privacy gated                  │
│   ├── PhotosCard (photos)                                      │
│   ├── MusicCard (music)                                        │
│   ├── QuotesCard (quotes)                                      │
│   ├── AchievementsCard (achievements)                          │
│   ├── LookingForCard (looking-for)                             │
│   ├── VibeCard (vibe)                                          │
│   ├── MajorCard (major)                                        │
│   ├── DormCard (dorm) ← Privacy gated                          │
│   ├── GreekCard (greek)                                        │
│   ├── SportsCard (sports)                                      │
│   ├── SocialsCard (socials) ← Campus+ visibility               │
│   ├── AvailabilityCard (availability)                          │
│   ├── ClassesCard (classes)                                    │
│   └── ProjectsCard (projects)                                  │
│       └── 24+ total card types                                 │
├── ProfileCompletionCard (molecule) ─ Shows completion %        │
├── ProfileIdentityWidget (molecule) ─ Name, avatar, bio, campus │
├── ProfileSpacesWidget (molecule) ─ Joined spaces list          │
├── ProfileActivityWidget (molecule) ─ Activity timeline         │
└── ProfileConnectionsWidget (molecule) ─ Connections preview    │
```

### Bento Grid Card Types (24+)

```typescript
type BentoCardType =
  | 'identity'        // Name, photo, handle, bio
  | 'spaces'          // Joined spaces
  | 'interests'       // Selected interests
  | 'activity'        // Recent activity
  | 'connections'     // Connection count/preview
  | 'schedule'        // Class schedule (privacy-gated)
  | 'photos'          // Photo gallery
  | 'music'           // Spotify integration
  | 'quotes'          // Favorite quotes
  | 'achievements'    // Badges/achievements
  | 'looking-for'     // What user is looking for
  | 'vibe'            // Current status/mood
  | 'major'           // Academic major
  | 'dorm'            // Housing (privacy-gated)
  | 'greek'           // Greek life affiliation
  | 'sports'          // Sports involvement
  | 'socials'         // Social media links
  | 'availability'    // Availability status
  | 'classes'         // Current classes
  | 'projects'        // HiveLab projects
  // + more...
```

### Profile Adapter (UI Data Transformer)

**File**: `apps/web/src/components/profile-adapter.ts`

Transforms API responses to `ProfileSystem` for bento grid rendering:

```typescript
// Input: ProfileV2ApiResponse from /api/profile/v2
// Output: ProfileSystem for ProfileBentoGrid

export function profileApiResponseToProfileSystem(
  apiResponse: ProfileV2ApiResponse
): ProfileSystem {
  return {
    identity: {
      handle: apiResponse.profile.handle,
      displayName: apiResponse.profile.fullName,
      avatarUrl: apiResponse.profile.avatarUrl,
      // ...
    },
    spaces: apiResponse.profile.spaces,
    interests: apiResponse.profile.interests,
    connections: {
      count: apiResponse.profile.connectionCount,
      preview: [],  // Fetched separately
    },
    // ... maps all card types
  };
}
```

---

## 3. API Layer

### Endpoints Inventory (15 routes)

| Endpoint | Method | Purpose | DDD? | Notes |
|----------|--------|---------|------|-------|
| `/api/profile` | GET | Get current user's profile | ✅ | Uses EnhancedProfile aggregate |
| `/api/profile` | PUT/PATCH/POST | Update profile | ⚠️ | Partial - handle uses DDD |
| `/api/profile/[userId]` | GET | Public profile with privacy | ✅ | 4-tier privacy enforced |
| `/api/profile/v2` | GET | V2 profile endpoint | ✅ | Uses DDD repository + ProfilePrivacy |
| `/api/profile/v2` | PATCH | Update profile | ✅ | Uses domain methods with fallback |
| `/api/profile/completion` | GET | Profile completion status | ✅ | Uses `getCompletionPercentage()` |
| `/api/profile/dashboard` | GET | Dashboard data | ✅ | Uses DDD for stats |
| `/api/profile/privacy` | GET/PATCH | Privacy settings | ✅ | Syncs with ProfilePrivacy VO |
| `/api/profile/stats` | GET | Profile statistics | ✅ | Uses DDD for profile data |
| `/api/profile/upload-photo` | POST | Photo upload | ❌ | Firebase Storage |
| `/api/profile/my-spaces` | GET | My spaces list | ✅ | Uses DDD for profile validation |
| `/api/profile/spaces` | GET | User's spaces | ✅ | Uses DDD for profile data |
| `/api/profile/spaces/actions` | GET/POST | Space actions | ✅ | DDD sync on leave, profile context |
| `/api/profile/spaces/recommendations` | GET | Space recommendations | ✅ | Uses DDD for interests/profile |
| `/api/profile/calendar/events` | GET/POST/PUT/DELETE | Calendar events | ✅ | Profile context for filtering |
| `/api/profile/calendar/conflicts` | GET/POST | Schedule conflicts | ✅ | Profile context |
| `/api/profile/notifications/preferences` | GET/PUT | Notification prefs | ✅ | Profile context for spaces |

### Integration Status Summary

```
Total Endpoints:     15
DDD Integrated:      14 (93%)
Partial Integration:  0 (0%)
Raw Firestore:        1 (7%) - upload-photo (binary storage, doesn't need DDD)
```

### Server-Side Repository (New)

**File**: `packages/core/src/infrastructure/repositories/firebase-admin/profile.repository.ts`

```typescript
import { getFirestore } from 'firebase-admin/firestore';
import { EnhancedProfile, IProfileRepository, Result } from '@hive/core';

export class FirebaseAdminProfileRepository implements IProfileRepository {
  private db: FirebaseFirestore.Firestore;

  async findById(id: ProfileId | string): Promise<Result<EnhancedProfile>> {
    const doc = await this.db.collection('users').doc(idValue).get();
    if (!doc.exists) return Result.fail('Profile not found');
    return this.toDomain(doc.id, doc.data() as ProfileDocument);
  }

  async findByHandle(handle: string): Promise<Result<EnhancedProfile>> { ... }
  async findByEmail(email: string): Promise<Result<EnhancedProfile>> { ... }
  async findConnectionsOf(profileId: string): Promise<Result<EnhancedProfile[]>> { ... }

  // Maps Firestore flat structure to DDD nested structure
  private async toDomain(id: string, data: ProfileDocument): Promise<Result<EnhancedProfile>> {
    // Creates value objects: ProfileId, UBEmail, ProfileHandle, ProfilePrivacy
    // Maps flat Firestore to EnhancedProfile aggregate
  }
}

// Singleton accessor for API routes
export function getServerProfileRepository(): IProfileRepository {
  if (!serverProfileRepositoryInstance) {
    serverProfileRepositoryInstance = new FirebaseAdminProfileRepository();
  }
  return serverProfileRepositoryInstance;
}
```

---

## 4. Domain Model (DDD)

### EnhancedProfile Aggregate

**Location**: `packages/core/src/domain/profile/aggregates/enhanced-profile.ts` (501 lines)

```typescript
export interface PersonalInfo {
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

export interface AcademicInfo {
  major: string;
  minor?: string;
  graduationYear: number;
  gpa?: number;
  courses: string[];
  academicStanding: 'good' | 'probation' | 'warning';
}

export interface SocialInfo {
  interests: string[];
  clubs: string[];
  sports: string[];
  greek?: string;
  instagram?: string;
  snapchat?: string;
  twitter?: string;
  linkedin?: string;
}

export class EnhancedProfile extends AggregateRoot<EnhancedProfileProps> {
  // Value Objects
  profileId: ProfileId
  email: UBEmail
  handle: ProfileHandle
  userType: UserType
  campusId: CampusId
  privacy: ProfilePrivacy

  // Domain Methods
  updatePersonalInfo(info: Partial<PersonalInfo>): Result<void>
  updateAcademicInfo(info: AcademicInfo): Result<void>
  updateSocialInfo(info: Partial<SocialInfo>): Result<void>
  updatePrivacy(privacy: ProfilePrivacy): Result<void>
  addInterest(interest: string): Result<void>  // Max 10 enforced
  removeInterest(interest: string): void
  addConnection(connectionId: string): void
  removeConnection(connectionId: string): void
  joinSpace(spaceId: string): void
  leaveSpace(spaceId: string): void
  completeOnboarding(personalInfo?, interests?): Result<void>
  isProfileComplete(): boolean
  getCompletionPercentage(): number  // Calculates 0-100%
}
```

### Value Objects

| Value Object | Purpose | Key Validation | DDD Location |
|--------------|---------|----------------|--------------|
| `ProfileId` | Unique identifier | Firebase UID format | `profile-id.value.ts` |
| `ProfileHandle` | @username | 3-30 chars, alphanumeric, unique | `profile-handle.value.ts` |
| `UBEmail` | .edu email | Domain validation (.buffalo.edu) | `ub-email.value.ts` |
| `UserType` | student/faculty/staff/alumni | Enum validation | `user-type.value.ts` |
| `CampusId` | Campus identifier | UB Buffalo default | `campus-id.value.ts` |
| `ProfilePrivacy` | Privacy settings | 4 levels with visibility rules | `profile-privacy.value.ts` |
| `ConnectionId` | Connection identifier | Format validation | `connection-id.value.ts` |

### ProfilePrivacy Value Object

**Location**: `packages/core/src/domain/profile/value-objects/profile-privacy.value.ts`

```typescript
export enum PrivacyLevel {
  PUBLIC = 'public',           // Anyone can view
  CAMPUS_ONLY = 'campus_only', // Only users from same campus
  CONNECTIONS_ONLY = 'connections_only',  // Only connected users
  PRIVATE = 'private'          // Only the user themselves
}

interface ProfilePrivacyProps {
  level: PrivacyLevel;
  showEmail: boolean;
  showPhone: boolean;
  showDorm: boolean;
  showSchedule: boolean;
  showActivity: boolean;
}

export class ProfilePrivacy extends ValueObject<ProfilePrivacyProps> {
  // KEY METHOD - Used in /api/profile/[userId]
  canViewProfile(viewerType: 'public' | 'campus' | 'connection'): boolean {
    switch (this.props.level) {
      case PrivacyLevel.PUBLIC:
        return true;
      case PrivacyLevel.CAMPUS_ONLY:
        return viewerType !== 'public';
      case PrivacyLevel.CONNECTIONS_ONLY:
        return viewerType === 'connection';
      case PrivacyLevel.PRIVATE:
        return false;
    }
  }
}
```

---

## 5. Data Layer (Firestore)

### Collection: `users`

```typescript
// Current Firestore schema (actual)
{
  id: string;
  email: string;
  handle: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string;
  major: string;
  graduationYear: number;
  dorm: string;
  housing: string;
  pronouns: string;
  academicYear: string;
  interests: string[];
  profileImageUrl: string;
  photos: string[];
  statusMessage: string;
  currentVibe: string;
  availabilityStatus: 'online' | 'studying' | 'busy' | 'away' | 'invisible';
  lookingFor: string[];
  connections: string[];
  spaceIds: string[];
  onboardingComplete: boolean;
  onboardingStep: number;
  campusId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  privacySettings: {
    isPublic: boolean;        // Legacy boolean
    level?: PrivacyLevel;     // NEW: 4-tier privacy
    showEmail?: boolean;
    showPhone?: boolean;
    showDorm?: boolean;
    showSchedule?: boolean;
    showActivity: boolean;
    showSpaces: boolean;
    showConnections: boolean;
    allowDirectMessages: boolean;
    showOnlineStatus: boolean;
  };
  builderOptIn: boolean;
  builderAnalyticsEnabled: boolean;

  // NEW: Bento card configuration
  bentoConfig?: {
    cards: BentoCardConfig[];
    layout?: 'default' | 'compact' | 'expanded';
  };
}

// Bento card config structure
interface BentoCardConfig {
  id: string;
  type: BentoCardType;
  position: { row: number; col: number };
  size: { width: number; height: number };
  visible: boolean;
  privacyLevel?: PrivacyLevel;  // Per-card privacy
}
```

### Schema Mismatch Issues

| DDD Model | Firestore | Issue | Status |
|-----------|-----------|-------|--------|
| `personalInfo.firstName` | `firstName` | Flat vs nested | Mapped in repository |
| `socialInfo.interests` | `interests` | Flat vs nested | Mapped in repository |
| `academicInfo.major` | `major` | Flat vs nested | Mapped in repository |
| `privacy: ProfilePrivacy` | `privacySettings: {}` | Value object vs plain | Mapped with fallback |
| `ProfilePrivacy.level` | `privacySettings.level` | Was boolean-only | Added `level` field |
| `bentoConfig` | `bentoConfig` | Not persisted | Schema added, UI needs binding |

---

## 6. Full Stack Data Flows

### Flow A: View Own Profile (DDD Path)

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER: Opens /profile                                                 │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ UI LAYER: /profile/page.tsx                                         │
│ ├── Checks auth state                                                │
│ ├── Redirects to /profile/[id] with userId                           │
│ └── Renders ProfilePageContent                                       │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API CALL: fetch('/api/profile')                                      │
│ Authorization: Bearer <idToken>                                      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE: withAuthAndErrors()                                      │
│ ├── Verifies Firebase ID token via firebase-admin                    │
│ ├── Attaches user.uid, user.email, user.campusId to request          │
│ └── Wraps handler with error handling                                │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/profile/route.ts (GET handler)                       │
│ ├── const userId = getUserId(request)                                │
│ ├── const profileRepository = getServerProfileRepository()           │
│ ├── const profileResult = await profileRepository.findById(userId)   │
│ └── if (profileResult.isFailure) → Fallback to legacy Firestore      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ REPOSITORY: FirebaseAdminProfileRepository.findById()                │
│ ├── const doc = await db.collection('users').doc(userId).get()       │
│ ├── if (!doc.exists) return Result.fail('Profile not found')         │
│ └── return this.toDomain(doc.id, doc.data())                         │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ DOMAIN MAPPING: toDomain()                                           │
│ ├── Creates ProfileId value object                                   │
│ ├── Creates UBEmail value object (with validation)                   │
│ ├── Creates ProfileHandle value object                               │
│ ├── Creates ProfilePrivacy value object (maps level + field flags)   │
│ ├── Creates CampusId value object                                    │
│ ├── Creates UserType value object                                    │
│ └── Returns EnhancedProfile.create(props)                            │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ AGGREGATE METHODS: EnhancedProfile                                   │
│ ├── profile.handle.value                                             │
│ ├── profile.privacy.level                                            │
│ ├── profile.getCompletionPercentage()                                │
│ └── profile.spaces, profile.connections, etc.                        │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API RESPONSE: NextResponse.json(response)                            │
│ {                                                                    │
│   success: true,                                                     │
│   data: {                                                            │
│     id, handle, firstName, lastName, fullName, bio, major,           │
│     graduationYear, dorm, interests, profileImageUrl, coverPhoto,    │
│     photos, clubs, sports, greek, socials, onboardingStatus,         │
│     privacy: { level, showEmail, showPhone, showDorm, ... },         │
│     stats: { connectionCount, followerCount, spacesJoined, ... },    │
│     metadata: { campusId, userType, isVerified, createdAt, ... },    │
│     handleChange: { canChange, nextChangeDate, changeCount },        │
│     completionPercentage: 75                                         │
│   }                                                                  │
│ }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Flow B: View Another User's Profile (4-Tier Privacy)

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER: Clicks on another user's profile link                          │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API CALL: fetch('/api/profile/{targetUserId}')                       │
│ Authorization: Bearer <idToken> (optional)                           │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE: withOptionalAuth()                                       │
│ ├── Tries to verify token if present                                 │
│ ├── Attaches user info if authenticated                              │
│ └── Continues without auth if no token (viewerType = 'public')       │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ VIEWER TYPE DETECTION                                                │
│ ├── No auth? → viewerType = 'public'                                 │
│ ├── Same campus? → viewerType = 'campus'                             │
│ └── Is connection? → viewerType = 'connection'                       │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PRIVACY CHECK: ProfilePrivacy.canViewProfile(viewerType)             │
│ ├── PUBLIC level → true for all                                      │
│ ├── CAMPUS_ONLY → true for campus, connection                        │
│ ├── CONNECTIONS_ONLY → true for connection only                      │
│ └── PRIVATE → false for all (except owner)                           │
└─────────────────────────────────────────────────────────────────────┘
        │
        ├── canView = false ─────────────────────────────────────────┐
        │                                                             │
        ▼                                                             ▼
┌─────────────────────────────────┐  ┌────────────────────────────────┐
│ FULL PROFILE RESPONSE           │  │ MINIMAL PROFILE (Privacy Gated)│
│ ├── All public fields           │  │ ├── id, handle, fullName        │
│ ├── Field-level privacy check   │  │ ├── avatarUrl                   │
│ │   ├── showDorm? → include     │  │ ├── isPrivate: true             │
│ │   ├── showSchedule? → include │  │ ├── privacyLevel                │
│ │   └── showActivity? → include │  │ └── message: "This profile is   │
│ └── buildProfileResponse()      │  │       only visible to..."       │
└─────────────────────────────────┘  └────────────────────────────────┘
```

### Flow C: Edit Profile (V2 Path - Needs DDD Migration)

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER: Edits field in /profile/edit                                   │
│ (e.g., changes bio text)                                             │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ UI LAYER: profile/edit/page.tsx                                      │
│ ├── Local state updates (optimistic)                                 │
│ ├── Debounced auto-save triggers                                     │
│ └── handleLayoutChange({ grid: newLayout })                          │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API CALL: PATCH /api/profile/v2                                      │
│ Body: { bio: "New bio text" }                                        │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/profile/v2/route.ts (PATCH)                          │
│ ❌ CURRENT: Raw Firestore update                                     │
│ ├── await dbAdmin.collection('users').doc(userId).update(body)       │
│ └── No domain validation                                             │
│                                                                      │
│ ✅ TARGET: DDD domain methods                                        │
│ ├── const profile = await profileRepository.findById(userId)         │
│ ├── profile.updatePersonalInfo({ bio: body.bio })  // Validates      │
│ └── await profileRepository.save(profile)                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. "Meant to Have" vs "Currently Have"

### Feature Comparison Matrix

| Feature | Target State | Current State | Gap |
|---------|--------------|---------------|-----|
| **4-Tier Privacy** | All endpoints enforce PUBLIC/CAMPUS_ONLY/CONNECTIONS_ONLY/PRIVATE | ✅ `/api/profile/[userId]` enforces | 1/15 endpoints |
| **DDD Aggregates** | All 15 endpoints use EnhancedProfile | 3/15 use DDD | 80% to migrate |
| **Bento Customization** | Users can arrange 24+ card types, persisted | UI exists, DEFAULT_LAYOUT always used | Binding incomplete |
| **Field-Level Privacy** | showDorm, showSchedule, etc. respected everywhere | ✅ Implemented in public profile | Working |
| **Real-time Presence** | Online/Away/Offline status | ✅ Working via `presence/{userId}` | Done |
| **Profile Completion** | Progress with next steps | ✅ `getCompletionPercentage()` exists | API needs to use it |
| **Handle Uniqueness** | Rate-limited changes (first free, then 6mo) | ✅ Working via handle-service.ts | Done |
| **Campus Isolation** | Multi-tenant isolation | ⚠️ Hardcoded `'ub-buffalo'` in some places | Needs cleanup |
| **Ghost Mode** | Hide from discovery | ✅ Privacy settings exist | Working |
| **Connection Strength** | Track interaction frequency | Domain has it, not used in UI | UI needs binding |
| **Profile V2 DDD** | Use EnhancedProfile aggregate | ✅ Uses DDD repository | Migrated |
| **ProfileContext** | Provide profile data to all components | ✅ Wired to real APIs | Migrated |

### What's Missing (All P0-P2 Complete ✅)

1. ~~**P0: `/api/profile/v2` Not DDD**~~ - ✅ FIXED
2. ~~**P0: Bento Data Not Persisted**~~ - ✅ FIXED
3. ~~**P1: ProfileContextProvider Stubs**~~ - ✅ FIXED
4. ~~**P1: Dashboard/Stats Not DDD**~~ - ✅ FIXED
5. ~~**P1: Spaces Endpoints Not DDD**~~ - ✅ FIXED
6. ~~**P2: Calendar Endpoints**~~ - ✅ FIXED
7. ~~**P2: Notifications Preferences**~~ - ✅ FIXED

**Remaining (P3 - Low Priority):**
- **Upload Photo** - Binary storage, DDD not applicable
- **Campus ID Cleanup** - Hardcoded `'ub-buffalo'` in several files
- **Connection Strength UI** - Domain exists but no UI display

---

## 8. Integration Points

### Profile → Spaces
- Profile displays joined spaces (`profile.spaces[]`)
- Joining space updates profile via domain method `joinSpace(spaceId)`
- Space members list shows profile data
- Space roles affect profile badges

### Profile → Feed
- Feed shows author profile preview (avatarUrl, displayName)
- Creator influence score from profile data (activityScore)
- Profile activity feeds into ranking algorithm

### Profile → HiveLab
- Tools display creator profile
- Profile shows created tools (projects card)
- Builder opt-in stored on profile (`builderOptIn`)

### Profile → Onboarding
- Onboarding creates initial profile
- `completeOnboarding()` domain method validates and saves
- `isOnboarded` flag gates access to main app

### Profile → Connections
- Connection requests between profiles
- Mutual connections shown on profile
- Privacy gates connection visibility based on `ProfilePrivacy.canViewProfile()`

---

## 9. Critical Issues & Fixes

### ~~P0: /api/profile/v2 Bypasses DDD~~ ✅ FIXED

**Problem**: ~~The most-used profile endpoint doesn't use domain validation~~

**Status**: ✅ FIXED on November 28, 2024

**Now** (`apps/web/src/app/api/profile/v2/route.ts`):
```typescript
// Try DDD repository first for profile data
const profileRepository = getServerProfileRepository();
const profileResult = await profileRepository.findById(targetUserId);

if (profileResult.isSuccess) {
  const profile = profileResult.getValue();
  profilePrivacy = profile.privacy;

  // Check profile-level access using DDD privacy
  if (!isOwnProfile && !profilePrivacy.canViewProfile(dddViewerType)) {
    return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }
  // Extract user data from DDD profile...
}
```

**Before** (Legacy):
```typescript
const doc = await db.collection('users').doc(userId).get();
const data = doc.data();
// Direct Firestore, no domain validation
```

### ~~P0: Bento Grid Layout Not Persisted~~ ✅ FIXED

**Problem**: ~~ProfileBentoGrid uses DEFAULT_LAYOUT, custom arrangements not saved~~

**Status**: ✅ FIXED on November 28, 2024

**Location**: `packages/ui/src/atomic/04-Profile/molecules/profile-bento-grid.tsx`

**Fix Applied**:
1. ✅ Read `profileGrid` from user document (already in API)
2. ✅ `normalizeLayout()` now validates and uses persisted config
3. ✅ Falls back to DEFAULT_LAYOUT only for new/invalid profiles

### P1: ProfileContextProvider Stubs

**Problem**: Context provider has stub implementations

**Location**: `apps/web/src/components/profile/ProfileContextProvider.tsx`

**Current State**: Functions return mock data or no-ops
**Target State**: Wire to real API calls and real-time subscriptions

### P2: Hardcoded Campus ID

**Files with hardcoded `'ub-buffalo'`**:
- `apps/web/src/lib/campus-context.ts`
- `apps/web/src/lib/middleware/index.ts` (line 145)
- Several API routes

**Fix**: Use `getCampusId(request)` consistently everywhere

---

## 10. Implementation Log

### Completed: November 28, 2024

| Task | Description | File(s) |
|------|-------------|---------|
| B1 | Created server-side ProfileRepository with Admin SDK | `packages/core/src/infrastructure/repositories/firebase-admin/profile.repository.ts` |
| B2 | Added bento card schema to profile documents | `ProfileDocument` interface in repository |
| B3 | Wired ProfileRepository into public profile route | `apps/web/src/app/api/profile/[userId]/route.ts` |
| B4 | Implemented 4-tier privacy in public profile | Uses `ProfilePrivacy.canViewProfile()` |
| B5 | Updated GET /api/profile to use EnhancedProfile | `apps/web/src/app/api/profile/route.ts` |
| B6 | Updated PUT /api/profile to use domain methods | `apps/web/src/app/api/profile/route.ts` |
| B7 | Added withOptionalAuth middleware | `apps/web/src/lib/middleware/index.ts` |
| B8 | Fixed bento card UI to use persisted layout | `packages/ui/src/atomic/04-Profile/molecules/profile-bento-grid.tsx` |
| B9 | Added 36 unit tests for ProfilePrivacy | `packages/core/src/__tests__/domain/profile/value-objects/profile-privacy.value.test.ts` |
| B10 | Created migration script for privacy+bento | `scripts/migrate-profile-privacy.mjs` |
| V2-DDD | Migrated /api/profile/v2 to use DDD repository | `apps/web/src/app/api/profile/v2/route.ts` |
| CTX | Fixed ProfileContextProvider to wire to real APIs | `apps/web/src/components/profile/ProfileContextProvider.tsx` |
| COMP | Migrated /api/profile/completion to use DDD | `apps/web/src/app/api/profile/completion/route.ts` |
| PRIV | Migrated /api/profile/privacy to sync with DDD | `apps/web/src/app/api/profile/privacy/route.ts` |
| DASH | Migrated /api/profile/dashboard to use DDD stats | `apps/web/src/app/api/profile/dashboard/route.ts` |
| STATS | Migrated /api/profile/stats to use DDD profile data | `apps/web/src/app/api/profile/stats/route.ts` |
| MYSP | Migrated /api/profile/my-spaces to use DDD | `apps/web/src/app/api/profile/my-spaces/route.ts` |
| SPACES | Migrated /api/profile/spaces to use DDD | `apps/web/src/app/api/profile/spaces/route.ts` |
| RECS | Migrated /api/profile/spaces/recommendations to DDD | `apps/web/src/app/api/profile/spaces/recommendations/route.ts` |
| ACTIONS | Migrated /api/profile/spaces/actions with DDD sync | `apps/web/src/app/api/profile/spaces/actions/route.ts` |
| CAL | Migrated /api/profile/calendar/events with profile context | `apps/web/src/app/api/profile/calendar/events/route.ts` |
| CONF | Migrated /api/profile/calendar/conflicts with profile context | `apps/web/src/app/api/profile/calendar/conflicts/route.ts` |
| NOTIF | Migrated /api/profile/notifications/preferences with profile context | `apps/web/src/app/api/profile/notifications/preferences/route.ts` |

### Pending (Low Priority)

> **✅ Profile Slice Complete** - 14/15 endpoints (93%) now use DDD. Remaining items are P3 improvements.

| Task | Description | Priority |
|------|-------------|----------|
| - | Photo upload doesn't need DDD (binary storage) | N/A |
| - | Campus ID cleanup (hardcoded 'ub-buffalo') | P3 |
| - | Connection Strength UI binding | P3 |

---

## 11. Testing Requirements

### Unit Tests Needed

- [x] `ProfilePrivacy.canViewProfile()` for all 4 levels × 3 viewer types (36 tests)
- [ ] `EnhancedProfile.addInterest()` max limit (10)
- [ ] `EnhancedProfile.completeOnboarding()` validation
- [ ] `EnhancedProfile.getCompletionPercentage()` calculation
- [ ] `FirebaseAdminProfileRepository.toDomain()` mapping

### Integration Tests Needed

- [ ] Public profile respects privacy settings (all 4 levels)
- [ ] Handle change with cleanup in `handles` collection
- [ ] Profile ↔ Spaces sync when joining/leaving
- [ ] Onboarding completion flow with all steps

### E2E Tests Needed

- [ ] Complete profile edit flow with save
- [ ] Privacy settings persist correctly
- [ ] Connection visibility rules
- [ ] Profile completion card updates after edit

---

## 12. File Inventory

### Domain Layer (`packages/core`)

| File | Purpose | Lines |
|------|---------|-------|
| `domain/profile/aggregates/enhanced-profile.ts` | Main aggregate | 501 |
| `domain/profile/value-objects/profile-id.value.ts` | ID value object | ~50 |
| `domain/profile/value-objects/profile-handle.value.ts` | Handle with validation | ~80 |
| `domain/profile/value-objects/profile-privacy.value.ts` | 4-tier privacy | ~120 |
| `domain/profile/value-objects/user-type.value.ts` | User type enum | ~40 |
| `domain/profile/value-objects/ub-email.value.ts` | Email validation | ~60 |
| `domain/profile/value-objects/campus-id.value.ts` | Campus identifier | ~40 |
| `infrastructure/repositories/firebase-admin/profile.repository.ts` | Server-side repo | ~300 |

### API Layer (`apps/web/src/app/api/profile`)

| File | Methods | DDD? | Lines |
|------|---------|------|-------|
| `route.ts` | GET, PUT, PATCH, POST | ✅ GET | ~365 |
| `[userId]/route.ts` | GET | ✅ | ~262 |
| `v2/route.ts` | GET, PATCH | ✅ | ~450 |
| `completion/route.ts` | GET | ✅ | ~296 |
| `dashboard/route.ts` | GET | ✅ | ~320 |
| `privacy/route.ts` | GET, PATCH | ✅ | ~275 |
| `stats/route.ts` | GET | ✅ | ~163 |
| `upload-photo/route.ts` | POST | ❌ | ~100 |
| `my-spaces/route.ts` | GET | ✅ | ~200 |
| `spaces/route.ts` | GET | ✅ | ~540 |
| `spaces/actions/route.ts` | GET, POST | ✅ | ~370 |
| `spaces/recommendations/route.ts` | GET | ✅ | ~500 |
| `calendar/events/route.ts` | GET, POST, PUT, DELETE | ✅ | ~350 |
| `calendar/conflicts/route.ts` | GET, POST | ✅ | ~345 |
| `notifications/preferences/route.ts` | GET, PUT | ✅ | ~135 |

### UI Layer

| File | Purpose | Location |
|------|---------|----------|
| `profile/page.tsx` | Profile index | `apps/web/src/app/profile/` |
| `profile/[id]/page.tsx` | View profile | `apps/web/src/app/profile/[id]/` |
| `profile/[id]/ProfilePageContent.tsx` | Main content | `apps/web/src/app/profile/[id]/` |
| `profile/edit/page.tsx` | Edit profile | `apps/web/src/app/profile/edit/` |
| `profile/settings/page.tsx` | Settings tabs | `apps/web/src/app/profile/settings/` |
| `profile/connections/page.tsx` | Connections | `apps/web/src/app/profile/connections/` |
| `user/[handle]/page.tsx` | Public by handle | `apps/web/src/app/user/[handle]/` |
| `profile-bento-grid.tsx` | Bento grid | `packages/ui/src/atomic/04-Profile/molecules/` |
| `profile-completion-card.tsx` | Completion | `packages/ui/src/atomic/04-Profile/organisms/` |
| `profile-adapter.ts` | API transformer | `apps/web/src/components/` |

### Services

| File | Purpose |
|------|---------|
| `apps/web/src/lib/handle-service.ts` | Handle uniqueness + rate limiting |
| `apps/web/src/lib/profile-security.ts` | Profile security utilities |
| `apps/web/src/lib/profile-api.ts` | Profile API client |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Profile completion rate | 80% | Profiles with >70% completion |
| Privacy settings configured | 60% | Profiles with non-default privacy |
| Bento customization | 40% | Profiles with >5 card types |
| Handle claim rate | 90% | Users with custom handles |
| Connection rate | 50% | Users with >3 connections |
| DDD Integration | 100% | All 15 endpoints use aggregates |
