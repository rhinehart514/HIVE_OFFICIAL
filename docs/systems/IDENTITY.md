# Identity System

**Version:** 1.0.0
**Last Updated:** February 2026
**Status:** Built, Refinements Needed

---

## Overview

The Identity System is the foundation of HIVE. It answers: "Who are you, and why should this campus know you?"

**Core Philosophy:** A student with HIVE has a campus that knows them. Identity is not a static profile — it's a living record of belonging, building, and contributing.

**System Scope:**
- Entry (verification + onboarding)
- Authentication (sessions, tokens, refresh)
- Profile (identity display + editing)
- Reputation (trust layers, activity tracking)

---

## Part 1: Current State

### 1.1 Entry Flow

**Files:**
- `apps/web/src/app/enter/page.tsx` - Entry page wrapper
- `apps/web/src/components/entry/Entry.tsx` - Main entry component
- `apps/web/src/components/entry/hooks/useEntry.ts` - State machine
- `apps/web/src/components/entry/screens/` - Phase screens

**Architecture:**

The entry flow is a 4-phase state machine on a single URL (`/enter`):

```
Gate → Naming → Field → Crossing
```

| Phase | Purpose | Data Collected |
|-------|---------|----------------|
| **Gate** | Prove campus membership | Email, 6-digit OTP |
| **Naming** | Claim real identity | First name, last name |
| **Field** | Academic context | Graduation year (required), major (optional) |
| **Crossing** | Interest-based discovery | 2-5 interests |

**Narrative Arc:** Outsider → Proven → Named → Claimed → Arrived

**Key Design Decisions:**
1. **Single URL** - Browser back button is intercepted to navigate within the flow, not out
2. **Real names required** - The "wedge" moment differentiates HIVE from anonymous platforms
3. **Handle auto-generation** - Handle is generated from name (e.g., `johnsmith`); user never manually enters it
4. **Progressive profiling** - Community identities, residence collected later in settings

**Gate Sub-steps:**
- `email` - Enter campus email
- `code` - 6-digit OTP verification
- `waitlist` - School not active yet (join waitlist)

**Field Sub-steps:**
- `year` - Graduation year selection (2025-2029)
- `major` - Major search/select (optional)

**What Works Well:**
- Premium visual design (Clash Display typography, gold accents, void background)
- Smooth motion transitions between phases (framer-motion)
- Handle availability checking with real-time feedback
- Code expiry countdown with auto-resend
- Browser back button interception preserves progress
- 150+ interests organized by category
- Auto-join spaces based on major/interests
- Gravatar detection for automatic avatar

**Gaps & Issues:**
1. **Alumni waitlist UX** - When school isn't active, waitlist flow works but success state could be more celebratory
2. **Handle collision recovery** - API generates suggestions but UI for selecting them could be smoother
3. **No profile photo upload** - Relies entirely on Gravatar; many students don't have one
4. **Major list incomplete** - Hardcoded list of ~40 majors, missing many disciplines
5. **No "I'm unsure" option for major** - Forces skip, which feels dismissive

---

### 1.2 Authentication System

**Files:**
- `apps/web/src/app/api/auth/send-code/route.ts` - Send OTP
- `apps/web/src/app/api/auth/verify-code/route.ts` - Verify OTP
- `apps/web/src/app/api/auth/complete-entry/route.ts` - Complete onboarding
- `apps/web/src/app/api/auth/me/route.ts` - Session introspection
- `apps/web/src/app/api/auth/refresh/route.ts` - Token refresh
- `apps/web/src/lib/session.ts` - JWT handling
- `apps/web/src/lib/handle-service.ts` - Handle validation

**Token Architecture:**

```
Access Token (15 min) + Refresh Token (7 days)
```

| Token | Purpose | Storage | Expiry |
|-------|---------|---------|--------|
| Access | API authorization | httpOnly cookie `hive_session` | 15 minutes |
| Refresh | Token renewal | httpOnly cookie `hive_refresh` | 7 days |
| Admin | Elevated access | Same as access | 4 hours |

**Session Data (JWT Payload):**
```typescript
interface SessionData {
  userId: string;
  email: string;
  campusId: string;
  isAdmin?: boolean;
  verifiedAt: string;
  sessionId: string;
  csrf?: string; // Admin sessions only
  onboardingCompleted?: boolean;
  tokenType?: 'access' | 'refresh';
}
```

**Security Posture:**
- SHA256 code hashing (codes never stored in plaintext)
- Rate limiting: 5 send-code requests per 5 minutes per IP
- Max 5 verification attempts per code
- 60-second lockout after max attempts
- 10-minute code TTL
- httpOnly + Secure + SameSite cookies
- Origin validation on pre-auth endpoints
- Session revocation support

**What Works Well:**
- Fortress-class security (multi-layer rate limiting, secure code storage)
- Clean token refresh flow with rotation
- Session introspection endpoint provides expiry info for client-side refresh scheduling
- Dev bypass system for testing without hitting Firebase quotas

**Gaps & Issues:**
1. **No remember me** - Always 7-day refresh token; no "keep me signed in" option
2. **Single device sessions** - No device management or "sign out everywhere"
3. **No MFA** - OTP is only factor; no TOTP/WebAuthn for sensitive actions
4. **Session count unbounded** - User could have unlimited concurrent sessions

---

### 1.3 Handle Service

**File:** `apps/web/src/lib/handle-service.ts`

**Handle Rules:**
- 3-20 characters
- Lowercase letters, numbers, periods, underscores, hyphens
- Cannot start/end with special characters
- No consecutive special characters
- Reserved handles blocked (admin, hive, support, etc.)

**Handle Change Policy:**
- First change after onboarding is FREE
- Subsequent changes: 6-month cooldown
- Full handle history tracked
- Old handle released, new reserved atomically

**What Works Well:**
- Transactional handle reservation prevents race conditions
- Retry with exponential backoff for transient Firestore failures
- Reserved handle list prevents impersonation
- Handle history tracking for accountability

**Gaps & Issues:**
1. **No handle recycling** - Released handles are never reused
2. **No handle search** - Can't find user by old handle
3. **6-month cooldown harsh** - Could be 30-60 days for balance

---

### 1.4 Profile System

**Files:**
- `apps/web/src/app/u/[handle]/` - Profile pages
- `apps/web/src/app/u/[handle]/ProfilePageContent.tsx` - Main profile view
- `apps/web/src/app/me/settings/page.tsx` - Settings
- `packages/ui/src/design-system/components/profile/` - Profile components

**Profile Zones (Belonging-First Layout):**

| Zone | Content | Purpose |
|------|---------|---------|
| **Zone 1: Identity** | Avatar, name, handle, bio, badges | Who is this person? |
| **Zone 2: Belonging** | Spaces, events, shared spaces with viewer | Where do they belong? |
| **Zone 3: Activity** | Active days, tools built | What do they do? |

**Profile Data Model:**
```typescript
interface Profile {
  // Core identity
  id: string;
  handle: string;
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;

  // Academic
  userType: 'student' | 'faculty' | 'alumni';
  major?: string;
  graduationYear?: number;

  // Campus
  campusId: string;
  schoolId: string;

  // Interests & Communities
  interests: string[];
  communityIdentities?: {
    international?: boolean;
    transfer?: boolean;
    firstGen?: boolean;
    commuter?: boolean;
    graduate?: boolean;
    veteran?: boolean;
  };

  // Privacy
  privacy: {
    isPublic: boolean;
    showActivity: boolean;
    showSpaces: boolean;
    showConnections: boolean;
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    ghostMode: { enabled: boolean };
  };
}
```

**Profile Components (packages/ui):**
- `ProfileIdentityHero` - Main hero with avatar, name, badges
- `ProfileBelongingSpaceCard` - Space membership card
- `ProfileSharedBanner` - "You share X spaces" context
- `ProfileActivityCard` - Tool/activity display
- `ProfileEventCard` - Upcoming events
- `ProfileOverflowChip` - "+N more" expansion
- `ConnectButton` - Connection state management
- `PeopleYouMayKnow` - Discovery suggestions

**What Works Well:**
- Belonging-first hierarchy shows context before activity
- Shared spaces banner creates immediate connection
- Ghost mode for privacy control
- Activity heatmap shows engagement patterns
- Inline expansion for spaces/tools (no modal needed)

**Gaps & Issues:**
1. **No cover photo** - Profile hero feels sparse without it
2. **Bio character limit unclear** - No counter or validation feedback
3. **No pronouns field** - Common expectation for student platforms
4. **No links/social** - Can't add Twitter, LinkedIn, portfolio
5. **No "featured" section** - Can't highlight best work
6. **Profile completion nags** - Prompts could be more helpful
7. **No profile analytics** - "Who viewed your profile" missing

---

### 1.5 Settings

**File:** `apps/web/src/app/me/settings/page.tsx`

**Settings Sections:**
- **Profile** - Name, bio, interests
- **Notifications** - Email, push, quiet hours
- **Privacy** - Visibility, permissions, ghost mode
- **Account** - Calendar, data export, security

**What Works Well:**
- Clean section-based organization
- Profile completion card shows what's missing
- Ghost mode toggle with confirmation
- Data export with progress tracking
- Delete account requires typing "DELETE"

**Gaps & Issues:**
1. **No email change** - Email is locked after verification
2. **No password** - OTP-only means no traditional login option
3. **No 2FA settings** - Can't enable additional security
4. **No connected apps** - Can't see OAuth authorizations
5. **No notification preferences per space** - All or nothing

---

### Audit Findings (2026-02-05 — 17-Agent Cross-System Audit)

**Scale:**
- 43 total API routes (17 auth + 26 profile)
- 37 frontend components
- 8 hooks (missing abort cleanup, no error recovery)

**Type System Issues:**
- 4 conflicting onboarding completion fields: `entryCompletedAt`, `onboardingCompleted`, `onboardingComplete`, `onboardingCompletedAt`
- Duplicate `Handle` and `Email` types across packages
- 6 competing `Profile` type definitions across codebase
- 3 avatar field name conventions: `avatarUrl`, `photoURL`, `profileImageUrl`

**Security (already tracked in TODO P0):**
- Dev bypasses controlled by env vars (acceptable)
- `MAX_CODES_PER_EMAIL_PER_HOUR = 10` raised for testing (needs reset)
- Strong security overall — rate limiting, SHA256 hashing, 60s lockout

**Design Token Violations:**
- `EmailInput.tsx` and `OTPInput.tsx` hardcode gold rgba values instead of using design tokens
- Gold constant (`#FFD700`) duplicated in 3 separate files

**Missing Zod Validation:**
- 7+ routes accept raw input without Zod schema validation
- Routes: `feedback`, `waitlist/join`, `waitlist/launch`, `friends`, and 3+ others

**Hook Quality:**
- Missing `AbortController` cleanup on unmount in fetch hooks
- Race conditions in handle checking (`useDramaticHandleCheck` points to wrong API endpoint)
- No stale cache invalidation strategy
- Missing hooks: `useAuthGuard`, `useProfileCache`, `useMutationRetry`

**Component Findings:**
- Entry docs reference deleted components (NarrativeEntry, EvolvingEntry, acts/, scenes/)
- All deleted component imports properly cleaned from barrel files
- 2 design token violations in locked UI primitives
- 3 LOCKED primitives have zero Storybook coverage
- Settings account section: changes NEVER SAVED (no PUT/PATCH wired)
- 3 different persistence patterns across 4 settings sections

---

## Part 2: Gaps & Refinements

### 2.1 Critical Gaps (P0)

| Gap | Impact | Effort | Recommendation |
|-----|--------|--------|----------------|
| No profile photo upload | 40% of users have no avatar | M | Add photo upload with crop |
| Major list incomplete | Users skip because their major isn't listed | S | Expand to 200+ majors or free text |
| No device management | Can't sign out compromised device | M | Add sessions list in settings |
| Handle collision UX | Rare but frustrating when it happens | S | Inline handle picker in naming phase |

### 2.2 Important Gaps (P1)

| Gap | Impact | Effort | Recommendation |
|-----|--------|--------|----------------|
| No cover photo | Profile feels incomplete | M | Add cover with crop/position |
| No pronouns field | DEI expectation | S | Add optional pronouns field |
| No social links | Can't show full identity | S | Add 3-5 link slots |
| No profile analytics | No engagement feedback | L | "Who viewed" with privacy controls |
| Email can't be changed | Account recovery blocked | M | Add email change with re-verification |

### 2.3 Nice-to-Have (P2)

| Gap | Impact | Effort | Recommendation |
|-----|--------|--------|----------------|
| No profile themes | Customization desire | M | 3-5 color themes |
| No profile QR code | IRL networking friction | S | Generate shareable QR |
| No handle search | Can't find old handles | S | Handle history lookup |
| No import from LinkedIn | Onboarding friction | L | OAuth profile import |

---

## Part 3: Feature Ideation

### 3.1 First Impression Designer

**The entry flow is the first moment. How does it feel? What makes someone feel "this is different"?**

**Current Feel:**
- Premium, editorial aesthetic
- "We don't let everyone in" creates exclusivity
- Gold accents signal achievement
- Smooth animations feel crafted

**Enhancement Ideas:**

**A. "You're In" Moment**
After code verification, before naming:
- Full-screen gold flash
- Sound effect (optional, off by default)
- Confetti burst
- "Welcome to HIVE" with campus logo

**B. Name Claim Ritual**
When entering name:
- Show handle preview morphing in real-time
- "@johnsmith" appears as they type
- Checkmark animation when available
- "This is yours forever" feeling

**C. Interest Selection Personality**
- Show other students who share each interest
- "47 other students in AI/ML"
- Creates anticipation for community

**D. Completion Celebration**
After interests:
- Show spaces they're auto-joining
- "You're joining Computer Science, AI Club, and 2 more"
- Redirect to first space, not /home

---

### 3.2 Identity Accumulator

**How does identity compound over time? What activities build reputation?**

**Reputation Signals:**

| Signal | Source | Visibility | Decay |
|--------|--------|------------|-------|
| **Activity Score** | Days active this month | Public | Monthly reset |
| **Spaces Joined** | Membership count | Public | Never |
| **Leadership** | Admin/owner roles | Public | Never |
| **Tools Built** | HiveLab creations | Public | Never |
| **Events Organized** | RSVP'd attendees | Public | Never |
| **Connections** | Mutual connections | Private | Never |
| **Contribution Streak** | Consecutive active days | Private | Daily |

**Accumulation Mechanics:**

**A. Badges (Earned, Permanent)**
```
Verified Student - Completed entry
Early Adopter - Joined in first 100 users
Space Leader - Owns/admins a space
Builder - Created 5+ tools
Event Organizer - Hosted 3+ events
Connector - 50+ connections
```

**B. Streaks (Active, Resets)**
```
Active Streak: 7 days → 14 days → 30 days
"On fire" indicator on profile
```

**C. Campus Reputation (Aggregate)**
```
"Top 10% most active students"
"Connected to 15% of your campus"
"Attended more events than 80% of students"
```

---

### 3.3 Portability Engineer

**How does identity travel? Across spaces? Off-platform? To employers/orgs?**

**In-Platform Portability:**
- Profile follows you into every space
- Reputation travels with membership
- Tools are associated with your handle

**Off-Platform Portability Ideas:**

**A. Public Profile URL**
```
hive.college/u/johnsmith
```
- Shareable, indexable (opt-in)
- Shows spaces, tools, activity
- QR code generation

**B. Profile Export**
```
Download PDF resume of HIVE activity
- Spaces led
- Events organized
- Tools built
- Activity summary
```

**C. Verification API**
```
/api/verify?handle=johnsmith&campus=ub-buffalo
Returns: { verified: true, role: 'student', year: 2026 }
```
For employers, apps, other platforms to verify student status.

**D. LinkedIn Integration**
```
"Add HIVE to LinkedIn"
Auto-generates position: "Active Member at HIVE - University at Buffalo"
Links to public profile
```

---

### 3.4 Trust Architect

**How do we build trust layers? Verified student → active member → trusted contributor → leader?**

**Trust Ladder:**

```
Level 0: Visitor (not signed in)
Level 1: Verified Student (completed entry)
Level 2: Active Member (7+ days active)
Level 3: Trusted Contributor (30+ days active, no flags)
Level 4: Space Leader (owns/admins space)
Level 5: Campus Leader (multiple spaces, high activity)
```

**Trust Unlocks:**

| Level | Unlock |
|-------|--------|
| 1 | Join spaces, view profiles, send messages |
| 2 | Create posts, RSVP to events |
| 3 | Create tools, invite to spaces |
| 4 | Manage space, moderate content |
| 5 | Create spaces, featured in discovery |

**Trust Indicators:**
- Badge next to name showing level
- "Trusted contributor" label on posts
- Priority in search results
- Reduced rate limits

---

### 3.5 Privacy Guardian

**What's visible to whom? How does the user control their identity exposure?**

**Current Privacy Controls:**
- Profile visibility: public/campus/private
- Show activity: on/off
- Show spaces: on/off
- Show connections: on/off
- Show online status: on/off
- Allow DMs: on/off
- Ghost mode: on/off

**Privacy Levels Matrix:**

| Data | Public | Campus | Private | Ghost |
|------|--------|--------|---------|-------|
| Name | Yes | Yes | No | No |
| Handle | Yes | Yes | Yes | No |
| Avatar | Yes | Yes | Blurred | Blurred |
| Bio | Yes | Yes | No | No |
| Spaces | Yes | Yes | No | No |
| Activity | Yes | Yes | No | No |
| Online | No | Yes | No | No |
| Tools | Yes | Yes | Yes | No |

**Missing Privacy Controls:**
1. **Per-space visibility** - Hide membership in specific spaces
2. **Anonymous posting** - Post without attribution in some spaces
3. **Block users** - Prevent specific users from seeing profile
4. **Incognito viewing** - View profiles without being tracked
5. **Data deletion** - True "right to be forgotten"

---

### 3.6 Cold Start Physicist

**Does identity work for user #1? What has single-player value?**

**User #1 Experience:**
1. Completes entry flow (works perfectly alone)
2. Gets auto-joined to major space (may be empty)
3. Sees own profile (works, but feels sparse)
4. No connections, no activity, no tools

**Single-Player Value:**

| Feature | Single-Player Value | Multi-Player Bonus |
|---------|--------------------|--------------------|
| Verified identity | Resume credential | Trust with others |
| Profile | Self-expression | Discovery by others |
| Handle | Canonical identity | @mentions, search |
| Interests | Self-knowledge | Matching with others |
| Settings | Control | - |

**Improvements for User #1:**

**A. "Your HIVE ID" Card**
Downloadable card showing:
- Handle, name, campus
- QR code to profile
- Useful even alone

**B. Profile Completion Game**
- Gamify completing bio, adding photo, etc.
- Progress bar: "Your profile is 40% complete"
- Each step unlocks visibility in discovery

**C. Interest-Based Content**
- Show content related to interests even before joining spaces
- "Computer Science students at UB are discussing..."

---

### 3.7 Moat Auditor

**What about identity is defensible? What can't be copied?**

**Defensible Elements:**

| Element | Defensibility | Why |
|---------|---------------|-----|
| Campus verification | High | Requires .edu email, school partnerships |
| Handle namespace | High | First-mover; early adopters claim best handles |
| Activity history | High | Historical data can't be replicated |
| Reputation graph | High | Network effects compound over time |
| Real names | Medium | Policy choice; competitors may not require |

**What's NOT Defensible:**
- Profile UI (easily copied)
- Settings options (table stakes)
- Badge designs (aesthetic)

**Moat Deepening Strategies:**

1. **Handle lock-in** - Make handle valuable outside HIVE (LinkedIn, resume)
2. **Reputation portability** - Export-able credentials that link back to HIVE
3. **Activity history** - "Member since 2026" creates switching cost
4. **Cross-campus identity** - If HIVE expands, handle works everywhere

---

### 3.8 Wedge Designer

**What's the "must use today" moment for identity?**

**Current Wedge:** Entry is required to join spaces. No anonymous access.

**Stronger Wedge Ideas:**

**A. "Claim Your Handle" Marketing**
- "Claim @yourname before someone else does"
- Scarcity creates urgency
- Share on social: "I got @john on HIVE"

**B. Event RSVP Verification**
- "Only verified students can RSVP"
- Forces entry completion for high-demand events
- Org leaders can trust attendee list

**C. Tool Access Gate**
- "Complete your profile to use this tool"
- Progressive profiling through tool usage

**D. "Who's Going" Social Proof**
- Events show "John + 12 others from your classes"
- Requires identity to show meaningful connections

---

## Part 4: Strategic Considerations

### 4.1 Cold Start

**Day 1 Reality:**
- 50-100 users
- 5-10 seeded spaces
- No activity history

**Identity System Cold Start Plan:**

1. **Pre-seed handles** - Reserve handles for campus leaders before launch
2. **Verified leader badges** - Give early adopters exclusive "founding member" badge
3. **Profile showcases** - Feature complete profiles in discovery
4. **Handle claim campaign** - "Be the first @john at your school"

### 4.2 Moat

**Identity moat strategy:**

| Timeframe | Moat Building |
|-----------|---------------|
| Month 1 | Handle namespace + verified students |
| Month 3 | Activity history + badges |
| Month 6 | Reputation + cross-space identity |
| Year 1 | Portable credentials + network effects |

### 4.3 Wedge

**Primary wedge:** Real identity required for trusted community.

**Positioning:** "The only campus platform where you know who you're talking to."

**Anti-positioning:** Not anonymous. Not ephemeral. Not for trolling.

---

## Part 5: Feature Specs

### Feature 1: Profile Photo Upload

**Priority:** P0
**Effort:** Medium (3-5 days)

**User Story:**
As a student, I want to upload a profile photo so others can recognize me.

**Acceptance Criteria:**
- [ ] Upload button on profile edit page
- [ ] Supports JPEG, PNG, WebP up to 5MB
- [ ] Crop tool with circular preview
- [ ] Uploads to Firebase Storage with user-specific path
- [ ] Generates 200x200 and 50x50 thumbnails
- [ ] Replaces Gravatar fallback when uploaded
- [ ] Shows upload progress
- [ ] Error handling for failed uploads
- [ ] Accessible (keyboard, screen reader)

**Technical Notes:**
- Use `packages/ui` crop component if exists, or add Sharp for server-side processing
- Storage path: `users/{userId}/avatar/{size}.{ext}`
- Update `avatarUrl` in user document after upload

---

### Feature 2: Expanded Major List

**Priority:** P0
**Effort:** Small (1 day)

**User Story:**
As a student, I want to find my exact major in the list so I can connect with others in my field.

**Acceptance Criteria:**
- [ ] 200+ majors covering all common disciplines
- [ ] Grouped by school/college (Arts & Sciences, Engineering, etc.)
- [ ] Search filters by name
- [ ] "My major isn't listed" free-text option
- [ ] Majors are canonical (no duplicates like "CS" vs "Computer Science")

**Technical Notes:**
- Move major list to shared constant in `packages/core`
- Consider dynamic fetching from Firestore for campus-specific majors

---

### Feature 3: Device Management

**Priority:** P0
**Effort:** Medium (3-5 days)

**User Story:**
As a student, I want to see what devices are signed into my account so I can sign out compromised devices.

**Acceptance Criteria:**
- [ ] List of active sessions in settings
- [ ] Shows device type, browser, location, last active
- [ ] "Sign out" button per session
- [ ] "Sign out all devices" button
- [ ] Current session marked and cannot be signed out
- [ ] Confirmation before signing out other sessions

**Technical Notes:**
- Store session metadata in Firestore `sessions` collection
- Use `sessionId` from JWT to identify sessions
- Add session revocation to `session-revocation.ts`

---

### Feature 4: Cover Photo

**Priority:** P1
**Effort:** Medium (3-5 days)

**User Story:**
As a student, I want to add a cover photo to personalize my profile.

**Acceptance Criteria:**
- [ ] Upload button in profile edit
- [ ] Supports landscape images (16:9 recommended)
- [ ] Crop and position tool
- [ ] Displays behind profile hero
- [ ] Falls back to gradient if none set
- [ ] Mobile: Adjusts height for smaller screens

**Technical Notes:**
- Storage path: `users/{userId}/cover/{size}.{ext}`
- Generate 1200px and 600px versions

---

### Feature 5: Pronouns Field

**Priority:** P1
**Effort:** Small (0.5 days)

**User Story:**
As a student, I want to display my pronouns so others address me correctly.

**Acceptance Criteria:**
- [ ] Optional field in profile edit
- [ ] Preset options: he/him, she/her, they/them, custom
- [ ] Displays next to name in profile hero
- [ ] Displays in member lists
- [ ] Max 30 characters for custom

**Technical Notes:**
- Add `pronouns?: string` to user document
- Display in `ProfileIdentityHero` component

---

### Feature 6: Social Links

**Priority:** P1
**Effort:** Small (1-2 days)

**User Story:**
As a student, I want to add links to my social profiles so others can connect with me elsewhere.

**Acceptance Criteria:**
- [ ] 5 link slots in profile edit
- [ ] Preset types: LinkedIn, Twitter/X, GitHub, Portfolio, Other
- [ ] Validates URL format
- [ ] Displays as icons in profile hero
- [ ] Opens in new tab

**Technical Notes:**
- Add `socialLinks: { type: string, url: string }[]` to user document
- Use platform icons from Lucide

---

### Feature 7: Profile Completion Progress

**Priority:** P1
**Effort:** Small (1 day)

**User Story:**
As a student, I want to see what's missing from my profile so I can complete it.

**Acceptance Criteria:**
- [ ] Progress bar: "Your profile is X% complete"
- [ ] Checklist of missing items: photo, bio, pronouns, links
- [ ] Each item links to the relevant edit section
- [ ] Dismissible after first view
- [ ] Reappears in settings if profile incomplete

**Technical Notes:**
- Calculate completion in `ProfileContextProvider`
- Store `profileCompletionDismissed` in localStorage

---

### Feature 8: Badges System

**Priority:** P1
**Effort:** Medium (3-5 days)

**User Story:**
As a student, I want to earn badges for my contributions so my reputation is visible.

**Acceptance Criteria:**
- [ ] Badge definitions in Firestore `badgeDefinitions` collection
- [ ] Badge display on profile hero (max 3 visible, +N more)
- [ ] Badge detail modal with earn criteria
- [ ] Badge award triggers: entry completion, tool creation, leadership, streak
- [ ] Admin can manually award badges
- [ ] Badge notifications when earned

**Technical Notes:**
- Add `badges: { id: string, awardedAt: string }[]` to user document
- Create badge award service with trigger checks

---

### Feature 9: Public Profile URL

**Priority:** P2
**Effort:** Small (1 day)

**User Story:**
As a student, I want a shareable link to my profile for my resume and LinkedIn.

**Acceptance Criteria:**
- [ ] URL format: `hive.college/u/{handle}`
- [ ] Opt-in public visibility (default: campus only)
- [ ] SEO meta tags (og:title, og:image, og:description)
- [ ] Structured data for Google
- [ ] "Share Profile" button generates link

**Technical Notes:**
- Already partially implemented with `/u/[handle]` route
- Need to add public/private toggle and meta tags

---

### Feature 10: Profile QR Code

**Priority:** P2
**Effort:** Small (0.5 days)

**User Story:**
As a student, I want a QR code to my profile for in-person networking.

**Acceptance Criteria:**
- [ ] QR code displays in profile share modal
- [ ] Encodes profile URL
- [ ] Downloadable as PNG
- [ ] Styled with HIVE branding
- [ ] Works when scanned by any QR reader

**Technical Notes:**
- Use `qrcode` npm package
- Generate client-side for instant display

---

## Part 6: Integration Points

### 6.1 Identity → Spaces

**Data Flow:**
- Profile data displayed in member lists
- Handle used for @mentions
- Role (owner/admin/member) from `spaceMembers` collection
- Activity score affects visibility in member search

**Touchpoints:**
- `apps/web/src/app/s/[handle]/components/members-list.tsx`
- `apps/web/src/app/api/spaces/[spaceId]/members/route.ts`

### 6.2 Identity → Tools

**Data Flow:**
- Creator attribution on tools
- Profile displays tools built
- Tool runs contribute to activity score

**Touchpoints:**
- `apps/web/src/app/lab/` - Tool creation
- `apps/web/src/app/u/[handle]/ProfilePageContent.tsx` - Tool display

### 6.3 Identity → Awareness

**Data Flow:**
- Presence shows online status
- Typing indicators use handle
- Notifications reference user name/avatar

**Touchpoints:**
- `apps/web/src/hooks/use-presence.ts`
- `apps/web/src/lib/notification-service.ts`

### 6.4 Identity → Discovery

**Data Flow:**
- Interests power space recommendations
- Handle searchable in global search
- Profile completeness affects ranking

**Touchpoints:**
- `apps/web/src/app/explore/page.tsx`
- `apps/web/src/app/api/search/route.ts`

---

## Appendix: File Reference

### Entry System
```
apps/web/src/app/enter/page.tsx
apps/web/src/components/entry/Entry.tsx
apps/web/src/components/entry/EntryShell.tsx
apps/web/src/components/entry/hooks/useEntry.ts
apps/web/src/components/entry/screens/GateScreen.tsx
apps/web/src/components/entry/screens/NamingScreen.tsx
apps/web/src/components/entry/screens/FieldScreen.tsx
apps/web/src/components/entry/screens/CrossingScreen.tsx
apps/web/src/components/entry/motion/entry-motion.ts
apps/web/src/components/entry/primitives/
```

### Auth API
```
apps/web/src/app/api/auth/send-code/route.ts
apps/web/src/app/api/auth/verify-code/route.ts
apps/web/src/app/api/auth/complete-entry/route.ts
apps/web/src/app/api/auth/check-handle/route.ts
apps/web/src/app/api/auth/me/route.ts
apps/web/src/app/api/auth/refresh/route.ts
apps/web/src/app/api/auth/logout/route.ts
apps/web/src/app/api/auth/session/route.ts (deprecated)
```

### Session & Security
```
apps/web/src/lib/session.ts
apps/web/src/lib/session-revocation.ts
apps/web/src/lib/handle-service.ts
apps/web/src/lib/secure-rate-limiter.ts
apps/web/src/lib/production-auth.ts
apps/web/src/lib/dev-auth-bypass.ts
```

### Profile
```
apps/web/src/app/u/[handle]/page.tsx
apps/web/src/app/u/[handle]/ProfilePageContent.tsx
apps/web/src/app/u/[handle]/hooks/use-profile-by-handle.ts
apps/web/src/app/me/page.tsx
apps/web/src/app/me/settings/page.tsx
apps/web/src/app/me/edit/page.tsx
```

### Profile UI Components
```
packages/ui/src/design-system/components/profile/ProfileIdentityHero.tsx
packages/ui/src/design-system/components/profile/ProfileBelongingSpaceCard.tsx
packages/ui/src/design-system/components/profile/ProfileSharedBanner.tsx
packages/ui/src/design-system/components/profile/ProfileActivityCard.tsx
packages/ui/src/design-system/components/profile/ProfileEventCard.tsx
packages/ui/src/design-system/components/profile/ConnectButton.tsx
packages/ui/src/design-system/components/profile/PeopleYouMayKnow.tsx
packages/ui/src/design-system/components/profile/ProfileToolModal.tsx
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| Feb 2026 | 1.0.0 | Initial spec document |
