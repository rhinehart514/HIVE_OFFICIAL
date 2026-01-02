# Vertical Slice: Discovery

## December 2025 Soft Launch

---

## Vision

**Students find their people in under 30 seconds.**

Discovery is the gateway to HIVE. For explorers (the 80% of users who aren't leaders), this is where the magic happens—they browse, see activity signals, join with one click, and land in active conversation. No empty pages, no friction, no waiting.

The insight: campus communities already exist. We pre-seeded 400+ real UB organizations from CampusLabs data. Discovery isn't about creating connections—it's about revealing the ones that already exist.

---

## Current Status: 80% Complete

| Submodule | Status | Notes |
|-----------|--------|-------|
| Browse Spaces | ✅ Complete | Category filtering, pagination |
| Search Spaces | ✅ Complete | Name, description matching |
| Global Search | ✅ Complete | Cross-entity (spaces, people, tools, posts) |
| Category Pills | ✅ Complete | student_org, university_org, greek_life |
| Member Count | ✅ Complete | Real-time display |
| Activity Signals | ⚠️ 70% | Basic, needs "5 chatting now" |
| Join Flow | ✅ Complete | One-click, idempotent, DDD |
| Welcome Automations | ✅ Complete | Auto-message on join |
| Recommendations | ✅ Complete | Behavioral psychology algorithm |
| Social Proof | ✅ Complete | Friends/connections in space |
| Pre-Seeded Data | ✅ Complete | 400+ UB orgs from CampusLabs |
| Ghost Mode Filtering | ✅ Complete | Hidden users filtered from search |

---

## User Journey: Explorer Flow

```
Landing Page
    ↓
"Get early access" (email auth)
    ↓
"What brings you here?" → "I'm finding my people"
    ↓
Quick profile (name, handle)
    ↓
Browse spaces (categories, activity signals)  ← THIS IS DISCOVERY
    ↓
Join 1-3 spaces (one-click)
    ↓
"Welcome to HIVE" (show joined spaces)
    ↓
Land in FIRST joined space (not empty feed)
    ↓
First action: React to message OR Vote in poll
```

**Key Insight:** The explorer never sees an empty page. They land in active chat immediately after joining.

---

## Architecture

### Browse Page

```
/spaces/browse

┌─────────────────────────────────────────────────────────────┐
│ ← Browse Spaces                                             │
│     247 spaces available                                    │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search by name or description...    ] [Search] [⚙]     │
├─────────────────────────────────────────────────────────────┤
│ ○ All   ● Student Orgs   ○ University   ○ Greek Life       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [CS]  Computer Science Club                   [Join]│   │
│   │       Making tech accessible to all                 │   │
│   │       👥 125 members   🏷 Student Org               │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [🎭]  Debate Team                             [Join]│   │
│   │       Sharpen your arguments                        │   │
│   │       👥 45 members   🏷 Student Org                │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [Φ]   Phi Kappa Psi                           [Join]│   │
│   │       Brotherhood. Leadership. Service.             │   │
│   │       👥 78 members   🏷 Greek Life                 │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│                    [Load More]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `/spaces/browse/page.tsx` | 494 | Browse UI with search, filters |
| `/api/spaces/browse-v2/route.ts` | 226 | DDD browse endpoint |
| `/api/spaces/recommended/route.ts` | 346 | Behavioral recommendations |
| `/api/search/route.ts` | 534 | Global cross-entity search |
| `/api/spaces/join-v2/route.ts` | 451 | Idempotent join with automations |

---

## Browse API (v2)

### Endpoint

```
GET /api/spaces/browse-v2
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | 'all' | Filter: all, student_org, university_org, greek_life |
| `sort` | enum | 'trending' | trending, recommended, newest, popular |
| `limit` | number | 20 | Max 50 |
| `cursor` | string | - | Pagination cursor (spaceId) |

### Response

```typescript
{
  spaces: SpaceBrowseDTO[],
  totalCount: number,
  hasMore: boolean,
  nextCursor?: string
}

interface SpaceBrowseDTO {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  memberCount: number;
  bannerImage?: string;
  tags?: string[];
  isVerified: boolean;
  hasLeader: boolean;
  isMember: boolean;  // If authenticated
  createdAt: string;
}
```

### Visibility Logic

```typescript
// Filter by publish status
const visibleSpaces = spaces.filter(space => {
  if (space.isLive) return true;  // Published spaces
  if (space.isStealth && isLeaderOfSpace) return true;  // Leaders see their stealth spaces
  return false;  // Never show 'rejected' in browse
});
```

### Cache Headers

```typescript
// 60 second edge cache, 5 minute stale-while-revalidate
'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
```

---

## Global Search

### Endpoint

```
GET /api/search?q={query}&category={category}&limit={limit}
```

### Categories

```typescript
type SearchCategory = 'spaces' | 'tools' | 'people' | 'posts' | 'all';
```

### Search Strategy

Each entity type has optimized search:

```typescript
// Spaces: prefix match on name_lowercase + category match
.where('name_lowercase', '>=', query)
.where('name_lowercase', '<=', query + '\uf8ff')

// Profiles: prefix match on handle + displayName_lowercase
// Ghost mode filtering applied
.where('handle', '>=', query)

// Tools: prefix match on name_lowercase + type match
.where('name_lowercase', '>=', query)
.where('isPublic', '==', true)

// Posts: title_lowercase prefix + tags array-contains
// Content moderation filtering applied
.where('title_lowercase', '>=', query)
```

### Relevance Scoring

```typescript
// Score weights
const RELEVANCE_SCORES = {
  EXACT_PREFIX: 100,    // Exact name/handle prefix
  NAME_MATCH: 90,       // Display name match
  TITLE_MATCH: 80,      // Post title match
  CATEGORY_MATCH: 70,   // Category match
  TAG_MATCH: 60,        // Tag array-contains
  TYPE_MATCH: 70        // Tool type match
};
```

### Rate Limiting

```typescript
// IP-based rate limiting
const rateLimitResult = searchRateLimit.check(`ip:${clientIp}`);

// Headers returned on 429
{
  'X-RateLimit-Limit': limit,
  'X-RateLimit-Remaining': remaining,
  'X-RateLimit-Reset': resetTime,
  'Retry-After': 60
}
```

### Ghost Mode Integration

```typescript
// Filter hidden profiles from search
if (GhostModeService.shouldHideFromSearch(ghostModeUser, viewerContext)) {
  continue;  // Skip this profile
}
```

---

## Recommendations API

### Endpoint

```
GET /api/spaces/recommended?limit=20
```

### Behavioral Psychology Algorithm

From SPEC.md, the recommendation score:

```
Score = (AnxietyRelief × 0.4) + (SocialProof × 0.3) + (InsiderAccess × 0.3)
```

### Score Components

#### Anxiety Relief (0.4 weight)

```typescript
function calculateAnxietyReliefScore(space, user): number {
  let score = 0;

  // Study stress relief - academic orgs
  if (category === 'student_org') score += 0.3;

  // Official support
  if (category === 'university_org') score += 0.25;

  // Community building
  if (category === 'residential' || 'greek_life') score += 0.2;

  // FOMO relief - popular spaces
  if (memberCount > 50) score += 0.2;

  // Major-specific match
  if (space.name includes user.major) score += 0.3;

  return Math.min(score, 1);
}
```

#### Social Proof (0.3 weight)

```typescript
function calculateSocialProofScore(mutuals, friends, totalMembers): number {
  let score = 0;

  // Friends are highest signal
  if (friends > 0) score += Math.min(friends * 0.2, 0.4);

  // Connections are medium signal
  if (mutuals > 0) score += Math.min(mutuals * 0.1, 0.3);

  // Popular spaces
  if (totalMembers > 100) score += 0.2;
  else if (totalMembers > 50) score += 0.1;

  // Network density bonus
  const networkRatio = (mutuals + friends) / totalMembers;
  score += Math.min(networkRatio * 0.2, 0.2);

  return Math.min(score, 1);
}
```

#### Insider Access (0.3 weight)

```typescript
function calculateInsiderAccessScore(space): number {
  let score = 0;

  // Smaller = more exclusive
  if (memberCount < 30) score += 0.3;
  else if (memberCount < 50) score += 0.1;

  // Greek life inherently exclusive
  if (category === 'greek_life') score += 0.3;

  // Residential natural exclusivity
  if (category === 'residential') score += 0.2;

  // Private spaces
  if (!isPublic) score += 0.4;

  // Approval required
  if (requireApproval) score += 0.2;

  return Math.min(score, 1);
}
```

### Response Sections

```typescript
{
  // Spaces addressing student anxieties
  panicRelief: spaces.filter(s => s.anxietyReliefScore > 0.6).slice(0, 5),

  // Spaces where friends/connections are
  whereYourFriendsAre: spaces.filter(s =>
    s.socialProofScore > 0.5 &&
    (s.friendsInSpace > 0 || s.mutualConnections > 2)
  ).slice(0, 5),

  // Exclusive/invite-only spaces
  insiderAccess: spaces.filter(s => s.insiderAccessScore > 0.7).slice(0, 5),

  // All recommendations sorted by score
  recommendations: scoredSpaces.slice(0, limit),

  meta: {
    totalSpaces: number,
    userConnections: number,
    userFriends: number
  }
}
```

---

## Join Flow

### Endpoint

```
POST /api/spaces/join-v2
```

### Request

```typescript
{
  spaceId: string,
  joinMethod?: 'manual' | 'invite' | 'approval' | 'auto',
  inviteCode?: string,
  metadata?: Record<string, any>
}
```

### Join Process

```typescript
1. Validate joinability (campus isolation, space exists, not banned)
2. Check for existing membership (idempotent)
3. If inactive membership exists → reactivate
4. If new membership → create with composite key
5. Update space metrics (memberCount, activeMembers)
6. Notify space leaders (if new join)
7. Trigger member_join automations (welcome messages)
8. Return success with space + membership info
```

### Composite Key Pattern

```typescript
// P0 SECURITY: Composite key prevents duplicate memberships
const compositeId = `${spaceId}_${userId}`;
const memberRef = dbAdmin.collection('spaceMembers').doc(compositeId);

// Atomic create-or-update
await memberRef.set({
  spaceId,
  userId,
  role: 'member',
  joinedAt: FieldValue.serverTimestamp(),
  isActive: true,
  joinMethod,
  ...addSecureCampusMetadata({})
}, { merge: true });
```

### Welcome Automation

On new member join:

```typescript
// Find active member_join automations
const automations = await space.automations
  .where('trigger.type', '==', 'member_join')
  .where('enabled', '==', true)
  .get();

// Execute each (fire-and-forget)
for (const automation of automations) {
  if (automation.action.type === 'send_message') {
    // Interpolate {member} → actual name
    const content = config.content
      .replace(/\{member\}/g, memberName)
      .replace(/\{member\.name\}/g, memberName);

    // Create system message in General board
    await boardsRef.doc(boardId).collection('messages').add({
      content,
      authorId: 'system',
      authorName: '🤖 HIVE Bot',
      type: 'system',
      metadata: { isAutomation: true, automationId }
    });
  }
}
```

---

## Categories

### Canonical Categories

```typescript
// Note: 'residential' exists but hidden from browse UI
// Residential spaces have locked leadership (RA-only)
const BROWSE_CATEGORIES = {
  all: 'All',
  student_org: 'Student Orgs',
  university_org: 'University',
  greek_life: 'Greek Life'
};

// Full category enum (for backend)
enum SpaceCategory {
  STUDENT_ORG = 'student_org',
  UNIVERSITY_ORG = 'university_org',
  GREEK_LIFE = 'greek_life',
  RESIDENTIAL = 'residential',  // Hidden from browse
  ACADEMIC = 'academic',
  INTEREST = 'interest'
}
```

### Category-Based Behavior

| Category | Browse Visible | Self-Claim | Leadership |
|----------|----------------|------------|------------|
| student_org | Yes | Yes | Open |
| university_org | Yes | Yes | Open |
| greek_life | Yes | Yes | Open |
| residential | No | No | RA-only |
| academic | Future | Yes | Open |

---

## UI Components

### SpaceSearchCard

```typescript
function SpaceSearchCard({ space, onClick, onJoin }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="h-14 w-14 rounded-xl">
        {space.bannerImage ? (
          <img src={space.bannerImage} />
        ) : (
          <span>{space.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Info */}
      <div>
        <h3>{space.name}</h3>
        <p>{space.description}</p>
        <div>
          <Users /> {space.memberCount} members
          <Badge>{CATEGORIES[space.category]}</Badge>
        </div>
      </div>

      {/* Join button */}
      <Button onClick={onJoin}>Join</Button>
    </motion.div>
  );
}
```

### Animation Config

```typescript
const SPRING_CONFIG = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: SPRING_CONFIG }
};
```

---

## Pre-Seeded Data

### CampusLabs Integration

400+ real UB organizations pre-seeded:

```
/api/admin/seed-school
└── Fetches from buffalo.campuslabs.com
    ├── Category mapping (Academic → student_org, etc.)
    ├── Description extraction
    ├── Deduplication by name
    └── Campus ID assignment
```

### Seed Process

1. Fetch org list from CampusLabs
2. Parse and normalize category
3. Create Space entity with isLive=false (stealth)
4. Create auto-general board
5. Apply category-specific templates
6. Wait for leader to claim and go live

---

## Performance Optimizations

### Browse v2

```typescript
// Batch member fetching (solves N+1)
const BATCH_SIZE = 30;  // Firestore 'in' limit
for (let i = 0; i < spaceIds.length; i += BATCH_SIZE) {
  const batch = spaceIds.slice(i, i + BATCH_SIZE);
  await dbAdmin.collection('spaceMembers')
    .where('spaceId', 'in', batch)
    .where('isActive', '==', true)
    .select('spaceId', 'userId')  // Only needed fields
    .get();
}
```

### Search Parallelization

```typescript
// Execute all entity searches in parallel
const [spaces, profiles, posts, tools] = await Promise.all([
  searchSpaces(query, campusId, limit),
  searchProfiles(query, campusId, limit, viewerContext),
  searchPosts(query, campusId, limit),
  searchTools(query, campusId, limit)
]);
```

### Index Requirements

```
// Firestore indexes needed
spaces: campusId + isActive + name_lowercase
spaces: campusId + isActive + category
profiles: campusId + handle
profiles: campusId + displayName_lowercase
spaceMembers: spaceId + isActive
```

---

## Known Issues & Blockers

### Should Fix Before Launch

1. **Activity Signals**
   - Currently shows "125 members"
   - Should show "5 chatting now" (real-time presence)
   - Need to integrate presence data

2. **Search Suggestions**
   - Basic implementation exists
   - Could be smarter with autocomplete

### Edge Cases

1. **Private Spaces**
   - Currently visible in browse with "Request Access" button
   - Might confuse users if they can see but not join

2. **Empty Results**
   - Good empty state exists
   - Could suggest popular spaces instead

3. **Residential Spaces**
   - Intentionally hidden from browse
   - Need clear path for RA leadership assignment

---

## Success Criteria

### Soft Launch (Dec 2025)

| Metric | Target |
|--------|--------|
| Browse → Join conversion | 20%+ |
| Search → Result click | 40%+ |
| Time to first join | <30 seconds |
| Join → First message | <5 minutes |
| Spaces with activity | 50%+ |

### Spring 2026

| Metric | Target |
|--------|--------|
| Daily browse sessions | 500+ |
| Recommendation click rate | 30%+ |
| Average spaces joined | 3+ per user |
| Join-to-active rate | 70%+ |

---

## Integration Points

### With Onboarding

- Explorer flow ends in browse
- Pre-selected interests inform recommendations
- Handle created, ready to join

### With Spaces

- Join triggers membership creation
- Welcome automations fire
- User lands in active chat

### With Profiles

- Connections/friends inform social proof
- Interest matching for recommendations
- Privacy filtering in search

### With Auth

- Optional auth for browse (unauthenticated preview)
- Required auth for join
- Campus isolation from auth context

---

*Last updated: December 2025*
*Status: 80% Complete - Ready for Soft Launch (activity signals need polish)*
