# Profile System Complete Specification

**Last Updated:** December 2025
**Status:** Winter 2025-26 Launch Ready
**Completion:** 70% → Target 90%

---

## Executive Summary

Profiles are the identity layer of HIVE—who you are, what you're interested in, and where you belong. Unlike LinkedIn performance or Instagram presentation, HIVE profiles capture the real student: their explorations, communities, and creations.

**Core Promise:** Your profile is yours. Your connections are yours. Your activity is yours. Portable identity that belongs to you.

---

## Table of Contents

1. [Philosophy & Vision](#philosophy--vision)
2. [Architecture Overview](#architecture-overview)
3. [Profile Model](#profile-model)
4. [Onboarding Flow](#onboarding-flow)
5. [Privacy & Visibility](#privacy--visibility)
6. [Ghost Mode](#ghost-mode)
7. [Connections & Social Graph](#connections--social-graph)
8. [Profile Completeness](#profile-completeness)
9. [Profile ↔ Spaces Integration](#profile--spaces-integration)
10. [Profile ↔ HiveLab Integration](#profile--hivelab-integration)
11. [Recommendations & Discovery](#recommendations--discovery)
12. [Butterfly Effects at Scale](#butterfly-effects-at-scale)
13. [Winter Launch Checklist](#winter-launch-checklist)

---

## Philosophy & Vision

### Why Profiles Exist

**Data Autonomy:** Your profile is yours. Your connections are yours. Your activity is yours.

The surveillance model:
```
Platform owns data → Sells to advertisers → Profiles you for engagement → You're the product
```

The HIVE model:
```
You own data → Control visibility → Export everything → You're the customer
```

### What a Profile Represents

A HIVE profile is NOT:
- A resume to impress recruiters
- A highlight reel of achievements
- A performance for social approval

A HIVE profile IS:
- A map of your explorations (spaces joined, interests declared)
- A record of your creations (HiveLab tools built)
- A web of your connections (real relationships, not follower counts)
- Your campus identity (academic context, community belonging)

### Success Metrics

**Profile Authenticity:** Not completion percentage, but genuine representation.

```
Authentic = Interests match space memberships
            + Connections are bidirectional
            + Activity reflects actual engagement
```

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PROFILE PAGE                                      │
│                                                                               │
│  ┌────────────────────────────────┐  ┌──────────────────────────────────┐   │
│  │        HEADER                   │  │         TABS                      │   │
│  │  ┌──────────┐                   │  │  [Activity] [Spaces] [Tools]     │   │
│  │  │  Photo   │  @alice           │  ├──────────────────────────────────┤   │
│  │  │          │  Alice Johnson    │  │                                  │   │
│  │  └──────────┘  Computer Science │  │  Activity Feed                   │   │
│  │               Class of 2026     │  │  ┌────────────────────────────┐  │   │
│  │                                 │  │  │ Joined "AI Research Club"  │  │   │
│  │  245 connections                │  │  │ 2 hours ago                │  │   │
│  │  12 spaces                      │  │  └────────────────────────────┘  │   │
│  │                                 │  │  ┌────────────────────────────┐  │   │
│  │  [Connect] [Message]            │  │  │ Created tool "Study Timer" │  │   │
│  └────────────────────────────────┘  │  │ Yesterday                   │  │   │
│                                      │  └────────────────────────────┘  │   │
│  ┌────────────────────────────────┐  │                                  │   │
│  │ Interests                       │  │  Spaces (12)                    │   │
│  │ #AI #StartUps #Photography     │  │  ┌────────────────────────────┐  │   │
│  │ #Chess #Sustainability         │  │  │ CS Club • AI Research      │  │   │
│  └────────────────────────────────┘  │  │ Startup Club • Photo Club  │  │   │
│                                      │  └────────────────────────────┘  │   │
│  ┌────────────────────────────────┐  │                                  │   │
│  │ Socials                        │  │  Tools Created (5)              │   │
│  │ 📸 @alice_photos               │  │  ┌────────────────────────────┐  │   │
│  │ 🐦 @alicejohnson               │  │  │ Study Timer • Meeting Poll │  │   │
│  └────────────────────────────────┘  │  └────────────────────────────┘  │   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Architecture

```
packages/core/src/domain/profile/
├── aggregates/
│   └── enhanced-profile.ts         # Core aggregate (685 lines)
├── entities/
│   └── connection.ts               # User-to-user relationships
├── services/
│   └── ghost-mode.service.ts       # Privacy feature
├── value-objects/
│   ├── profile-id.value.ts
│   ├── profile-handle.value.ts
│   ├── campus-id.value.ts
│   ├── user-type.value.ts
│   ├── profile-privacy.value.ts
│   ├── graduation-year.value.ts
│   ├── major.value.ts
│   └── interest.value.ts
└── spec-compliant-profile.ts

packages/core/src/application/identity/
├── dtos/
│   └── profile.dto.ts              # Response DTOs
├── mappers/
│   └── profile.mapper.ts
└── services/
    └── profile-onboarding.service.ts

apps/web/src/
├── app/profile/
│   ├── page.tsx                    # Own profile
│   ├── [userId]/page.tsx           # View others
│   └── edit/page.tsx               # Edit profile
├── app/api/profile/
│   ├── route.ts                    # GET/PATCH own profile
│   ├── [userId]/route.ts           # View user profile
│   ├── handle/[handle]/route.ts    # Lookup by handle
│   ├── spaces/route.ts             # User's spaces
│   ├── upload-photo/route.ts       # Photo upload
│   └── privacy/route.ts            # Privacy settings
└── hooks/
    └── use-profile.ts              # Profile hook
```

---

## Profile Model

### EnhancedProfile Aggregate

```typescript
interface EnhancedProfileProps {
  // Identity
  profileId: ProfileId;
  email: UBEmail;
  handle: ProfileHandle;
  userType: UserType;             // student | faculty | alumni
  campusId: CampusId;

  // Personal Info
  personalInfo: {
    firstName: string;
    lastName: string;
    bio?: string;
    major?: string;
    graduationYear?: number;
    dorm?: string;
    phoneNumber?: string;
    profilePhoto?: string;
    coverPhoto?: string;
  };

  // Academic Info (optional)
  academicInfo?: {
    major: string;
    minor?: string;
    graduationYear: number;
    gpa?: number;
    courses: string[];
    academicStanding: 'good' | 'probation' | 'warning';
  };

  // Social Info
  socialInfo: {
    interests: string[];          // Max 10
    clubs: string[];
    sports: string[];
    greek?: string;
    instagram?: string;
    snapchat?: string;
    twitter?: string;
    linkedin?: string;
  };

  // Privacy
  privacy: ProfilePrivacy;

  // Relationships
  connections: string[];          // Connection IDs
  spaces: string[];               // Space IDs
  achievements: string[];         // Achievement IDs

  // Status
  isOnboarded: boolean;
  isVerified: boolean;
  isActive: boolean;
  lastActive?: Date;

  // Metrics
  activityScore: number;
  followerCount: number;
  followingCount: number;
  connectionCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Value Objects

| Value Object | Purpose | Validation |
|--------------|---------|------------|
| `ProfileId` | Unique identifier | UUID format |
| `ProfileHandle` | @username | 3-30 chars, alphanumeric + underscore |
| `CampusId` | Campus affiliation | Valid campus code |
| `UserType` | User category | student/faculty/alumni |
| `ProfilePrivacy` | Visibility settings | Valid privacy object |
| `GraduationYear` | Academic standing | Valid year range |
| `Major` | Academic major | Validated against school list |
| `Interest` | User interest | Normalized, deduplicated |

### Database Schema

```typescript
// Firestore: users/{userId}
interface UserDocument {
  // Identity
  uid: string;
  email: string;
  handle: string;
  displayName: string;
  campusId: string;              // 'ub-buffalo'

  // Academic
  userType: 'student' | 'faculty' | 'alumni';
  major?: string;
  academicYear?: 'freshman' | 'sophomore' | 'junior' | 'senior';
  graduationYear?: number;

  // Profile
  bio?: string;
  photoURL?: string;
  interests: string[];

  // Status
  onboardingComplete: boolean;
  emailVerified: boolean;
  isBuilder: boolean;

  // Social
  followerCount: number;
  followingCount: number;
  spaceCount: number;

  // Privacy
  privacy: {
    profileVisibility: 'public' | 'campus' | 'private';
    showEmail: boolean;
    showAcademicInfo: boolean;
  };

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Onboarding Flow

### 4-Step Onboarding

```
Step 1              Step 2              Step 3              Step 4
VERIFY EMAIL   ──▶  BASIC INFO     ──▶  INTERESTS      ──▶  JOIN SPACES

@buffalo.edu        Name, Photo         Select 3+           Recommended
verification        Class Year          from categories      spaces
```

### Step Details

**Step 1: Email Verification**
```
┌─────────────────────────────────────┐
│  Welcome to HIVE                     │
│                                      │
│  Enter your @buffalo.edu email      │
│  ┌─────────────────────────────────┐ │
│  │ your.email@buffalo.edu          │ │
│  └─────────────────────────────────┘ │
│                                      │
│  [Send Code]                         │
│                                      │
│  Enter the 6-digit code:            │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐           │
│  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘           │
└─────────────────────────────────────┘
```

**Step 2: Basic Info**
```
┌─────────────────────────────────────┐
│  Tell us about yourself              │
│                                      │
│  First Name  ┌──────────────────┐   │
│              └──────────────────┘   │
│  Last Name   ┌──────────────────┐   │
│              └──────────────────┘   │
│  Username    ┌──────────────────┐   │
│    @         └──────────────────┘   │
│  Class Year  [2025 ▾]               │
│  Major       [Computer Science ▾]   │
│                                      │
│  Profile Photo [Upload]              │
│                                      │
│  [Continue]                          │
└─────────────────────────────────────┘
```

**Step 3: Interests**
```
┌─────────────────────────────────────┐
│  What are you into?                  │
│  (Select at least 3)                 │
│                                      │
│  Tech & Innovation                   │
│  [AI/ML] [Startups] [Coding]        │
│  [Product] [Design]                  │
│                                      │
│  Creative                            │
│  [Photography] [Music] [Art]        │
│  [Writing] [Film]                    │
│                                      │
│  Academic                            │
│  [Research] [Pre-Med] [Pre-Law]     │
│  [Engineering] [Business]            │
│                                      │
│  Sports & Wellness                   │
│  [Basketball] [Running] [Yoga]      │
│  [Esports] [Climbing]                │
│                                      │
│  Selected: AI/ML, Startups, Photo   │
│  [Continue]                          │
└─────────────────────────────────────┘
```

**Step 4: Join Spaces**
```
┌─────────────────────────────────────┐
│  Join some communities               │
│  Based on your interests             │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ AI Research Club        [Join]  │ │
│  │ 245 members • AI/ML             │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │ Startup Club            [Join]  │ │
│  │ 189 members • Startups          │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │ Photo Club              [Join]  │ │
│  │ 123 members • Photography       │ │
│  └─────────────────────────────────┘ │
│                                      │
│  [Skip for now] [Finish Setup]       │
└─────────────────────────────────────┘
```

### Onboarding Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Step 1 → 2 conversion | 95% | ~92% |
| Step 2 → 3 conversion | 90% | ~88% |
| Step 3 → 4 conversion | 85% | ~82% |
| Full completion | 80% | ~75% |

---

## Privacy & Visibility

### Privacy Model

```typescript
interface ProfilePrivacy {
  // Overall visibility
  profileVisibility: 'public' | 'campus' | 'private';

  // Field-level
  showEmail: boolean;
  showAcademicInfo: boolean;
  showSocialLinks: boolean;
  showSpaces: boolean;
  showConnections: boolean;
  showActivity: boolean;

  // Discoverability
  appearInSearch: boolean;
  appearInRecommendations: boolean;

  // Ghost mode
  ghostModeEnabled: boolean;
}
```

### Visibility Levels

| Level | Who Can See | Index Status |
|-------|-------------|--------------|
| **Public** | Anyone on campus | Fully indexed |
| **Campus** | Verified @buffalo.edu only | Campus-indexed |
| **Private** | Only connections | Not indexed |

### Field-Level Privacy

```
Profile Field        Public    Campus    Private
─────────────────────────────────────────────────
Name                   ✓         ✓          ✓
Handle                 ✓         ✓          ✓
Photo                  ✓         ✓          ✓
Bio                    ✓         ✓          ✗
Major                  ✓         ✓          ✗
Graduation Year        ✓         ✓          ✗
Email                  ⚙         ⚙          ✗
Spaces                 ⚙         ⚙          ⚙
Connections            ⚙         ⚙          ⚙
Activity               ⚙         ⚙          ⚙

✓ = Always visible
⚙ = User-controlled toggle
✗ = Never visible
```

---

## Ghost Mode

### What is Ghost Mode

Ghost Mode is a privacy feature that temporarily hides user activity from others.

When enabled:
- User doesn't appear in "who's online" lists
- Activity doesn't show in space feeds
- Profile shows as "last seen recently" not exact time
- User can still see everything normally

### Ghost Mode States

```
NORMAL MODE                          GHOST MODE
─────────────────────────────────────────────────────────

@alice is online           ──▶      @alice was recently active
@alice just posted         ──▶      (no activity shown)
@alice joined Space X      ──▶      (no join shown)
@alice is typing...        ──▶      (no typing shown)
```

### Implementation

```typescript
// Ghost Mode Service
interface GhostModeService {
  enable(userId: string, duration?: number): Promise<void>;
  disable(userId: string): Promise<void>;
  isEnabled(userId: string): Promise<boolean>;
  getGhostModeStatus(userId: string): Promise<GhostModeStatus>;
}

interface GhostModeStatus {
  enabled: boolean;
  enabledAt?: Date;
  expiresAt?: Date;
  reason?: string;
}
```

### Ghost Mode Controls

```
┌─────────────────────────────────────┐
│  Ghost Mode                          │
│                                      │
│  [Toggle: OFF]                       │
│                                      │
│  When enabled:                       │
│  • You won't appear as "online"     │
│  • Your activity won't be visible   │
│  • You can still see everything     │
│                                      │
│  Duration:                           │
│  ○ Until I turn it off              │
│  ○ 1 hour                            │
│  ○ 24 hours                          │
│  ○ 1 week                            │
└─────────────────────────────────────┘
```

---

## Connections & Social Graph

### Connection Model

```typescript
interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;

  // Status
  status: 'pending' | 'accepted' | 'blocked';

  // Context
  connectedVia?: 'space' | 'search' | 'suggestion' | 'qr';
  mutualSpaces: string[];

  // Timestamps
  requestedAt: Date;
  acceptedAt?: Date;

  // Metadata
  note?: string;              // "Met at hackathon"
}
```

### Connection Flow

```
User A sends        ──▶  Request pending  ──▶  User B accepts  ──▶  Connected
request                                                             │
                                                                    ▼
                                                              Both appear in
                                                              each other's
                                                              connections
```

### Connection Strength

```typescript
interface ConnectionStrength {
  connectionId: string;
  strength: number;           // 0-100

  factors: {
    mutualSpaces: number;     // Shared communities
    interactions: number;      // Messages, reactions
    mutualConnections: number; // Friends in common
    recency: number;          // Recent activity together
  };
}
```

### Social Graph Queries

| Query | Purpose | API |
|-------|---------|-----|
| Connections | User's connections | GET `/profile/{userId}/connections` |
| Mutual | Shared connections | GET `/profile/{userId}/mutual/{otherUserId}` |
| Suggestions | People you may know | GET `/profile/suggestions` |
| Search | Find users | GET `/users/search` |

---

## Profile Completeness

### Completion Calculation

```typescript
function getCompletionPercentage(): number {
  let completed = 0;
  let total = 0;

  // Personal Info (40%)
  total += 4;
  if (personalInfo.firstName) completed++;
  if (personalInfo.lastName) completed++;
  if (personalInfo.bio) completed++;
  if (personalInfo.profilePhoto) completed++;

  // Academic Info (30%) - students only
  if (userType.isStudent()) {
    total += 3;
    if (academicInfo?.major) completed++;
    if (academicInfo?.graduationYear) completed++;
    if (academicInfo?.courses.length) completed++;
  }

  // Social Info (30%)
  total += 3;
  if (socialInfo.interests.length > 0) completed++;
  if (socialInfo.clubs.length > 0) completed++;
  if (socialInfo.instagram || socialInfo.snapchat) completed++;

  return Math.round((completed / total) * 100);
}
```

### Completion Tiers

| Tier | Percentage | Benefits |
|------|------------|----------|
| **Basic** | 0-30% | Can browse spaces |
| **Standard** | 31-70% | Can join spaces, connect |
| **Complete** | 71-100% | Full recommendations |

### Completion Prompts

```
┌─────────────────────────────────────┐
│  Complete your profile              │
│                                      │
│  ██████████░░░░░░░░░░ 50%           │
│                                      │
│  Add these to improve:               │
│  • Add a profile photo (+15%)       │
│  • Add your bio (+10%)              │
│  • Connect a social account (+5%)   │
│                                      │
│  [Complete Now]                      │
└─────────────────────────────────────┘
```

---

## Profile ↔ Spaces Integration

### How They Connect

```
Profile                              Spaces
───────────────────────────────────────────────

profile.spaces[]        ◀───▶       space.members[]
(IDs of joined spaces)              (includes profile)

profile.interests[]     ───▶        Space recommendations
(used for matching)                 based on interests

profile.activity        ◀───        Space activity
(aggregated)                        (messages, events)
```

### Space Membership in Profile

```typescript
// Profile shows spaces
profile.spaces = ['space_1', 'space_2', 'space_3'];

// Each space has profile as member
space.members.includes(profile.id); // true
```

### Activity Aggregation

```typescript
interface ProfileActivity {
  userId: string;

  // Space Activity
  spacesJoined: number;
  messagessSent: number;
  eventsAttended: number;
  reactionsGiven: number;

  // Creation Activity
  toolsCreated: number;
  templatesShared: number;

  // Social Activity
  connectionssMade: number;
  profileViews: number;

  // Engagement Score
  activityScore: number;
}
```

---

## Profile ↔ HiveLab Integration

### Tool Ownership

```
Profile creates         ──▶  tool.createdBy      ──▶  Profile.tools[]
tool                         = profile.id             populated
```

### Tools in Profile

```typescript
interface ProfileWithTools {
  // ... profile fields

  // Tools created by this user
  toolsCreated: Tool[];

  // Tools deployed to profile widgets
  profileWidgets: PlacedTool[];
}
```

### Profile Widgets

Users can deploy HiveLab tools as profile widgets:

```
┌─────────────────────────────────────┐
│  @alice                              │
│  ┌─────────────────────────────────┐ │
│  │ Study Progress                   │ │
│  │ ████████░░ 80%                   │ │  ◄── HiveLab tool as widget
│  │ 24 hours this week               │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ Currently Reading                │ │  ◄── Another widget
│  │ 📚 "Thinking Fast and Slow"      │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Recommendations & Discovery

### Interest-Based Matching

```typescript
// Calculate similarity between two profiles
function getInterestSimilarity(profileA: Profile, profileB: Profile): number {
  const setA = new Set(profileA.interests);
  const setB = new Set(profileB.interests);

  const intersection = [...setA].filter(x => setB.has(x));
  const union = new Set([...setA, ...setB]);

  return (intersection.length / union.size) * 100;
}
```

### Recommendation Sources

| Source | Weight | Description |
|--------|--------|-------------|
| Interest overlap | 40% | Shared interests |
| Mutual spaces | 25% | Same communities |
| Mutual connections | 20% | Friends in common |
| Academic proximity | 15% | Same major/year |

### "People You May Know"

```
┌─────────────────────────────────────┐
│  People You May Know                 │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ @bob                             │ │
│  │ Bob Smith • CS '26               │ │
│  │ 5 mutual connections             │ │
│  │ In: AI Club, Startup Club       │ │
│  │ [Connect]                        │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ @carol                           │ │
│  │ Carol Lee • CS '25               │ │
│  │ Similar interests: AI, ML       │ │
│  │ [Connect]                        │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Butterfly Effects at Scale

### At 1,000 Users

**Positive Effects:**
- Social graph starts forming
- Interest-based clustering
- Connection recommendations work

**Challenges:**
- Incomplete profiles
- Low connection density
- Cold start for new users

**Mitigations:**
- Aggressive completion prompts
- Seed initial connections via spaces
- Mutual friend suggestions

### At 10,000 Users

**Positive Effects:**
- Rich social graph
- Strong recommendations
- Real network effects

**Challenges:**
- Search performance
- Privacy at scale
- Spam connections

**Mitigations:**
- Elasticsearch for profiles
- Privacy audits
- Connection rate limiting

### At 30,000 Users (Full Campus)

**Positive Effects:**
- Campus-wide graph complete
- "Everyone is on HIVE"
- Self-sustaining growth

**Challenges:**
- Real-time presence at scale
- Storage costs
- Identity verification

**Mitigations:**
- Presence sharding
- Tiered storage
- Re-verification flows

### Multi-Campus Effects

```
UB Profile          ──▶  Cross-campus     ──▶  Multi-campus
exists                   visibility             identity
                         (if allowed)
                              │
                              ▼
                         Transfer students
                         maintain connections
```

---

## Winter Launch Checklist

### Must Have (P0)

- [x] Email verification working
- [x] 4-step onboarding flow
- [x] Profile CRUD operations
- [x] Privacy settings
- [x] Interest selection
- [ ] Profile photo upload (fix reliability)
- [ ] Handle availability check (real-time)

### Should Have (P1)

- [ ] Ghost mode (basic version)
- [ ] Connection requests
- [ ] Profile completion prompts
- [ ] Interest-based recommendations

### Nice to Have (P2)

- [ ] Profile widgets (HiveLab tools)
- [ ] Activity feed on profile
- [ ] QR code for connections
- [ ] Profile export

### Feature Flags

```typescript
const PROFILE_FLAGS = {
  // Core (always on)
  'profile.basic': { default: true },
  'profile.privacy_settings': { default: true },
  'profile.interests': { default: true },

  // Winter Launch
  'profile.ghost_mode': { default: false, targets: ['beta_users'] },
  'profile.connections': { default: true },

  // Flagged Off
  'profile.widgets': { default: false },
  'profile.activity_feed': { default: false },
  'profile.export': { default: false },
};
```

### Success Criteria

1. **95%** of users complete Step 1 (email verification)
2. **80%** of users complete full onboarding
3. Average profile completion: **>60%**
4. Interest selection average: **>3 interests**
5. Privacy settings accessed by **>30%** of users

---

## API Reference

### Profile CRUD

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile` | GET | Get current user's profile |
| `/api/profile` | PATCH | Update profile |
| `/api/profile/{userId}` | GET | Get user profile |
| `/api/profile/handle/{handle}` | GET | Lookup by handle |

### Privacy

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/privacy` | GET | Get privacy settings |
| `/api/profile/privacy` | POST | Update privacy |
| `/api/privacy/ghost-mode` | POST | Toggle ghost mode |

### Connections

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/connections` | GET | List connections |
| `/api/connections` | POST | Send request |
| `/api/connections/{id}/accept` | POST | Accept request |
| `/api/connections/{id}/reject` | POST | Reject request |

### Media

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/upload-photo` | POST | Upload profile photo |

---

*This document is the source of truth for Profile specifications. Update when features ship.*
